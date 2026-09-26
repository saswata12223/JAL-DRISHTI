"""
FlashFloodAI Backend — Soil Moisture Observation ORM Model (TimescaleDB Hypertable)
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class SoilMoistureObservation(Base):
    """NASA SMAP surface & rootzone soil moisture time-series record."""

    __tablename__ = "soil_moisture_observations"

    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, index=True)
    spatial_id = Column(String(64), primary_key=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    surface_soil_moisture_vol = Column(Float, nullable=True)
    rootzone_soil_moisture_vol = Column(Float, nullable=True)
    profile_soil_moisture_vol = Column(Float, nullable=True)
    soil_saturation_index = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_soil_obs_time_spatial", "timestamp_utc", "spatial_id"),
        Index("idx_soil_obs_geom", "geom", postgresql_using="gist"),
    )

    def to_dict(self):
        return {
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "spatial_id": self.spatial_id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "surface_soil_moisture_vol": self.surface_soil_moisture_vol,
            "rootzone_soil_moisture_vol": self.rootzone_soil_moisture_vol,
            "profile_soil_moisture_vol": self.profile_soil_moisture_vol,
            "soil_saturation_index": self.soil_saturation_index,
        }
