from sqlalchemy import Column, String, DateTime, Text, BigInteger
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from app.db.database import Base

class SachetAlert(Base):
    __tablename__ = "sachet_alerts"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    identifier = Column(String, unique=True, index=True, nullable=False)
    sender = Column(String, nullable=True)
    sent = Column(DateTime, nullable=True)
    status = Column(String, nullable=True)
    msg_type = Column(String, nullable=True)
    
    category = Column(String, nullable=True)
    event = Column(String, nullable=True)
    urgency = Column(String, nullable=True)
    severity = Column(String, nullable=True)
    certainty = Column(String, nullable=True)
    
    onset = Column(DateTime, nullable=True)
    expires = Column(DateTime, nullable=True)
    
    area_description = Column(Text, nullable=True)
    # Using GEOMETRY to allow POLYGON or MULTIPOLYGON if needed, though POLYGON is typical for CAP.
    polygon = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=True)
    
    description = Column(Text, nullable=True)
    instruction = Column(Text, nullable=True)
    
    raw_xml = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
