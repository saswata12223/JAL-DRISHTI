import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SOSIncomingPacket(BaseModel):
    """
    Data packet received from the BLE Mesh Gateway.
    Optional fields are handled gracefully if missing.
    """
    sos_id: str
    sender_id: str
    timestamp: datetime.datetime
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distress_type: Optional[str] = "UNKNOWN"
    message: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    people_trapped: Optional[int] = Field(None, ge=0)
    battery: Optional[int] = Field(None, ge=0, le=100)
    mesh_hops: Optional[int] = Field(None, ge=0)
    device_id: Optional[str] = None
    gateway_id: Optional[str] = None
    gateway_received_at: Optional[datetime.datetime] = None
    source: Optional[str] = "BLE_MESH"

class SOSStatusUpdate(BaseModel):
    status: str = Field(..., description="ACKNOWLEDGED, DISPATCHED, RESOLVED")
    assigned_unit: Optional[str] = None

class SOSResponse(BaseModel):
    id: int
    sender_id: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distress_type: Optional[str] = None
    message: Optional[str] = None
    people_trapped: Optional[int] = None
    battery: Optional[int] = None
    mesh_hops: Optional[int] = None
    gateway_id: Optional[str] = None
    status: str
    source: str
    assigned_unit: Optional[str] = None
    
    # Timestamps
    timestamp: Optional[datetime.datetime] = None
    gateway_received_at: Optional[datetime.datetime] = None
    received_at: Optional[datetime.datetime] = None
    acknowledged_at: Optional[datetime.datetime] = None
    dispatched_at: Optional[datetime.datetime] = None
    resolved_at: Optional[datetime.datetime] = None
    
    class Config:
        from_attributes = True
