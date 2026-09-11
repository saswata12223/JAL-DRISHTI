"""
FlashFloodAI Backend — Rainfall Observation ORM Model (TimescaleDB Hypertable)
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class RainfallObservation(Base):
    """GPM IMERG gridded / multi-scale rainfall measurement time-series record."""

    __tablename__ = "rainfall_observations"

    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, index=True)
    spatial_id = Column(String(64), primary_key=True, index=True)
    district = Column(String(128), nullable=True, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    rainfall_30min_mm = Column(Float, nullable=True)
    rainfall_1h_mm = Column(Float, nullable=True)
    rainfall_3h_mm = Column(Float, nullable=True)
    max_intensity_mmh = Column(Float, nullable=True)
    mean_intensity_mmh = Column(Float, nullable=True)
    effective_precipitation_mm = Column(Float, nullable=True)
    antecedent_precipitation_index_mm = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_rain_obs_time_spatial", "timestamp_utc", "spatial_id"),
        Index("idx_rain_obs_district", "district"),
        Index("idx_rain_obs_geom", "geom", postgresql_using="gist"),
    )

    def to_dict(self):
        return {
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "spatial_id": self.spatial_id,
            "district": self.district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "rainfall_30min_mm": self.rainfall_30min_mm,
            "rainfall_1h_mm": self.rainfall_1h_mm,
            "rainfall_3h_mm": self.rainfall_3h_mm,
            "max_intensity_mmh": self.max_intensity_mmh,
            "mean_intensity_mmh": self.mean_intensity_mmh,
            "effective_precipitation_mm": self.effective_precipitation_mm,
            "antecedent_precipitation_index_mm": self.antecedent_precipitation_index_mm,
        }
