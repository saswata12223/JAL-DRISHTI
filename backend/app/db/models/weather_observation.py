"""
FlashFloodAI Backend — Weather Observation ORM Model (TimescaleDB Hypertable)
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class WeatherObservation(Base):
    """IMD Meteorological weather observation time-series record."""

    __tablename__ = "weather_observations"

    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, index=True)
    station_id = Column(String(64), primary_key=True, index=True)
    station_name = Column(String(255), nullable=True)
    district = Column(String(128), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    temperature_c = Column(Float, nullable=True)
    relative_humidity_pct = Column(Float, nullable=True)
    surface_pressure_hpa = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_weather_obs_time_station", "timestamp_utc", "station_id"),
        Index("idx_weather_obs_district", "district"),
        Index("idx_weather_obs_geom", "geom", postgresql_using="gist"),
    )

    def to_dict(self):
        return {
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "station_id": self.station_id,
            "station_name": self.station_name,
            "district": self.district,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "temperature_c": self.temperature_c,
            "relative_humidity_pct": self.relative_humidity_pct,
            "surface_pressure_hpa": self.surface_pressure_hpa,
            "wind_speed_ms": self.wind_speed_ms,
            "rainfall_mm": self.rainfall_mm,
        }
