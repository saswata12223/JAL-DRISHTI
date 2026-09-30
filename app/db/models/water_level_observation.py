"""
FlashFloodAI Backend — Water Level Observation ORM Model (TimescaleDB Hypertable)
"""

from sqlalchemy import Column, String, Float, DateTime, Boolean, Index
from app.db.database import Base


class WaterLevelObservation(Base):
    """CWC Hydrological river stage and water level observation time-series record."""

    __tablename__ = "water_level_observations"

    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, index=True)
    station_id = Column(String(64), primary_key=True, index=True)
    station_name = Column(String(255), nullable=True)
    river_name = Column(String(128), nullable=True, index=True)
    district = Column(String(128), nullable=True, index=True)

    # Telemetry value — nullable to strictly preserve offline status
    water_level_m = Column(Float, nullable=True)
    discharge_cumec = Column(Float, nullable=True)

    # Official CWC Thresholds for alert comparison
    warning_level_m = Column(Float, nullable=True)
    danger_level_m = Column(Float, nullable=True)
    hfl_m = Column(Float, nullable=True)

    official_flood_status = Column(String(64), default="DATA_UNAVAILABLE", nullable=False)
    official_alert_stage = Column(String(32), default="UNKNOWN", nullable=False)
    is_telemetry_missing = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        Index("idx_water_obs_time_station", "timestamp_utc", "station_id"),
        Index("idx_water_obs_alert", "official_alert_stage"),
    )

    def to_dict(self):
        return {
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "station_id": self.station_id,
            "station_name": self.station_name,
            "river_name": self.river_name,
            "district": self.district,
            "water_level_m": self.water_level_m,
            "discharge_cumec": self.discharge_cumec,
            "warning_level_m": self.warning_level_m,
            "danger_level_m": self.danger_level_m,
            "hfl_m": self.hfl_m,
            "official_flood_status": self.official_flood_status,
            "official_alert_stage": self.official_alert_stage,
            "is_telemetry_missing": self.is_telemetry_missing,
        }
