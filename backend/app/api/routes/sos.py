import asyncio
import json
import datetime
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.sos_database import get_sos_db, init_sos_db
from app.db.sos_models import SosMessage
from app.schemas.sos import SOSIncomingPacket, SOSStatusUpdate, SOSResponse
from app.schemas.common import APIResponse

logger = logging.getLogger("FlashFloodAI.SOS")

router = APIRouter(prefix="/sos", tags=["SOS Mesh Receiver"])

# Dummy Gateway Secret for prototype (In production, load from env)
EXPECTED_GATEWAY_KEY = "gateway_secret_123"

def verify_gateway(x_gateway_key: str = Header(..., description="Gateway Authentication Key")):
    if x_gateway_key != EXPECTED_GATEWAY_KEY:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Gateway Key")
    return x_gateway_key

# --- SSE Manager ---
class SSEManager:
    def __init__(self):
        self.clients: List[asyncio.Queue] = []

    async def connect(self, queue: asyncio.Queue):
        self.clients.append(queue)
        logger.info(f"SSE Client connected. Total clients: {len(self.clients)}")

    def disconnect(self, queue: asyncio.Queue):
        if queue in self.clients:
            self.clients.remove(queue)
            logger.info(f"SSE Client disconnected. Total clients: {len(self.clients)}")

    async def broadcast(self, event_type: str, data: dict):
        event_str = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        # Push to all connected clients
        for q in self.clients:
            await q.put(event_str)

sse_manager = SSEManager()

async def heartbeat(queue: asyncio.Queue):
    """Sends a ping every 15 seconds to keep the connection alive."""
    while True:
        await asyncio.sleep(15)
        await queue.put("event: ping\ndata: {}\n\n")

# --- Endpoints ---

@router.post("/incoming", summary="Receive Real SOS from BLE Mesh Gateway")
async def receive_sos_packet(
    packet: SOSIncomingPacket,
    db: Session = Depends(get_sos_db),
    gateway_key: str = Depends(verify_gateway)
):
    """
    State-mutating endpoint exclusively for BLE Gateways.
    Receives SOS packet, saves to SQLite, broadcasts to React via SSE.
    """
    # Check for duplicate
    existing = db.query(SosMessage).filter(SosMessage.sos_id == packet.sos_id).first()
    if existing:
        return {
            "success": True,
            "sos_id": packet.sos_id,
            "received": True,
            "duplicate": True
        }
        
    # Validate lat/lon
    if packet.latitude is not None and (packet.latitude < -90 or packet.latitude > 90):
        raise HTTPException(400, "Invalid latitude")
    if packet.longitude is not None and (packet.longitude < -180 or packet.longitude > 180):
        raise HTTPException(400, "Invalid longitude")

    new_sos = SosMessage(
        sos_id=packet.sos_id,
        sender_id=packet.sender_id,
        name=packet.name,
        phone=packet.phone,
        timestamp=packet.timestamp,
        latitude=packet.latitude,
        longitude=packet.longitude,
        distress_type=packet.distress_type,
        message=packet.message,
        people_trapped=packet.people_trapped,
        battery=packet.battery,
        mesh_hops=packet.mesh_hops,
        device_id=packet.device_id,
        gateway_id=packet.gateway_id,
        gateway_received_at=packet.gateway_received_at,
        received_at=datetime.datetime.utcnow(),
        status="ACTIVE",
        source=packet.source
    )
    
    db.add(new_sos)
    db.commit()
    db.refresh(new_sos)
    
    # Broadcast to active dashboard clients
    sos_dict = SOSResponse.model_validate(new_sos).model_dump(mode='json')
    # Rename id inside dict since model has `id` which maps to `sos_id` for frontend backward compat?
    sos_dict['id'] = new_sos.sos_id # Overwrite the int id with the string sos_id for the UI
    
    await sse_manager.broadcast("new_sos", sos_dict)
    
    return {
        "success": True,
        "sos_id": new_sos.sos_id,
        "received": True,
        "duplicate": False
    }

@router.get("/stream", summary="SSE Real-time Stream for React Dashboard")
async def sos_stream(request: Request):
    """
    Establishes Server-Sent Events (SSE) channel for real-time dashboard updates.
    """
    queue = asyncio.Queue()
    await sse_manager.connect(queue)
    
    # Start heartbeat task
    heartbeat_task = asyncio.create_task(heartbeat(queue))

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                event = await queue.get()
                yield event
        except asyncio.CancelledError:
            pass
        finally:
            sse_manager.disconnect(queue)
            heartbeat_task.cancel()

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/", summary="Get All SOS Messages")
def get_all_sos(db: Session = Depends(get_sos_db)):
    """Fetches historical and active SOS alerts."""
    records = db.query(SosMessage).order_by(SosMessage.received_at.desc()).all()
    out = []
    for r in records:
        d = SOSResponse.model_validate(r).model_dump(mode='json')
        d['id'] = r.sos_id
        out.append(d)
    return APIResponse(success=True, data=out, count=len(out))

@router.put("/{sos_id}/acknowledge", summary="Acknowledge SOS Alert")
async def acknowledge_sos(sos_id: str, db: Session = Depends(get_sos_db)):
    record = db.query(SosMessage).filter(SosMessage.sos_id == sos_id).first()
    if not record:
        raise HTTPException(404, "SOS not found")
        
    if record.status == "ACTIVE":
        record.status = "ACKNOWLEDGED"
        record.acknowledged_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(record)
        
        d = SOSResponse.model_validate(record).model_dump(mode='json')
        d['id'] = record.sos_id
        await sse_manager.broadcast("update_sos", d)
        
    return APIResponse(success=True, data=d)

@router.put("/{sos_id}/dispatch", summary="Record Dispatch for SOS Alert")
async def dispatch_sos(sos_id: str, db: Session = Depends(get_sos_db)):
    record = db.query(SosMessage).filter(SosMessage.sos_id == sos_id).first()
    if not record:
        raise HTTPException(404, "SOS not found")
        
    if record.status in ["ACTIVE", "ACKNOWLEDGED"]:
        record.status = "DISPATCHED"
        record.dispatched_at = datetime.datetime.utcnow()
        record.assigned_unit = "SDRF Control Room (Prototype Workflow)"
        db.commit()
        db.refresh(record)
        
        d = SOSResponse.model_validate(record).model_dump(mode='json')
        d['id'] = record.sos_id
        await sse_manager.broadcast("update_sos", d)
        
    return APIResponse(success=True, data=d)

@router.put("/{sos_id}/resolve", summary="Resolve SOS Alert")
async def resolve_sos(sos_id: str, db: Session = Depends(get_sos_db)):
    record = db.query(SosMessage).filter(SosMessage.sos_id == sos_id).first()
    if not record:
        raise HTTPException(404, "SOS not found")
        
    if record.status != "RESOLVED":
        record.status = "RESOLVED"
        record.resolved_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(record)
        
        d = SOSResponse.model_validate(record).model_dump(mode='json')
        d['id'] = record.sos_id
        await sse_manager.broadcast("update_sos", d)
        
    return APIResponse(success=True, data=d)
