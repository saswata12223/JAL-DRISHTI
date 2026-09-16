import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.sos_database import Base

class SosMessage(Base):
    __tablename__ = "sos_messages"

    id = Column(Integer, primary_key=True, index=True)
    sos_id = Column(String, unique=True, index=True, nullable=False)
    sender_id = Column(String, nullable=True)
    name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    
    # Original citizen timestamp
    timestamp = Column(DateTime, nullable=True)
    
    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Distress Data
    distress_type = Column(String, nullable=True)
    message = Column(String, nullable=True)
    people_trapped = Column(Integer, nullable=True, default=1)
    battery = Column(Integer, nullable=True)
    
    # Network Data
    mesh_hops = Column(Integer, nullable=True)
    device_id = Column(String, nullable=True)
    gateway_id = Column(String, nullable=True)
    
    # Track when the gateway actually pushed it vs when we received it
    gateway_received_at = Column(DateTime, nullable=True)
    
    # Server Timestamps
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Workflow State
    status = Column(String, default="ACTIVE", index=True) # ACTIVE, ACKNOWLEDGED, DISPATCHED, RESOLVED
    assigned_unit = Column(String, nullable=True)
    
    # Source provenance
    source = Column(String, default="BLE_MESH") # BLE_MESH or SIMULATED
