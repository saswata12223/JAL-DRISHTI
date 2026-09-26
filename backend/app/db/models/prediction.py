"""
FlashFloodAI Backend — Flood Risk Prediction ORM Model (TimescaleDB Hypertable)
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from geoalchemy2 import Geometry
from app.db.database import Base


class FloodPrediction(Base):
    """Machine learning flood-risk prediction and physics attribution time-series record."""

    __tablename__ = "flood_predictions"

    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, index=True)
    spatial_id = Column(String(64), primary_key=True, index=True)
    sample_id = Column(String(128), nullable=False, unique=True)
    sample_type = Column(String(64), nullable=False, index=True)
    district = Column(String(128), nullable=False, index=True)
    major_basin = Column(String(128), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    # ML Attributes
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    prediction_probability = Column(Float, nullable=False, index=True)
    ml_risk_class = Column(String(32), nullable=False, index=True)
    ml_decision_threshold = Column(Float, default=0.40, nullable=False)

    # SCS-CN Hydrological Physics Attributes
    scs_direct_runoff_q_mm = Column(Float, nullable=True)
    scs_peak_runoff_potential = Column(Float, nullable=True)

    # Official CWC Alert Stage (for comparison)
    official_flood_status = Column(String(64), default="DATA_UNAVAILABLE", nullable=False)
    official_alert_stage = Column(String(32), default="UNKNOWN", nullable=False)
    warning_level_m = Column(Float, nullable=True)
    danger_level_m = Column(Float, nullable=True)
    hfl_m = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_predictions_time_spatial", "timestamp_utc", "spatial_id"),
        Index("idx_predictions_risk_district", "district", "ml_risk_class"),
        Index("idx_predictions_geom", "geom", postgresql_using="gist"),
    )

    def to_dict(self):
        return {
            "sample_id": self.sample_id,
            "spatial_id": self.spatial_id,
            "sample_type": self.sample_type,
            "timestamp_utc": self.timestamp_utc.isoformat() if self.timestamp_utc else None,
            "district": self.district,
            "major_basin": self.major_basin,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "prediction_probability": self.prediction_probability,
            "ml_risk_class": self.ml_risk_class,
            "ml_decision_threshold": self.ml_decision_threshold,
            "scs_direct_runoff_q_mm": self.scs_direct_runoff_q_mm,
            "scs_peak_runoff_potential": self.scs_peak_runoff_potential,
            "official_flood_status": self.official_flood_status,
            "official_alert_stage": self.official_alert_stage,
            "warning_level_m": self.warning_level_m,
            "danger_level_m": self.danger_level_m,
            "hfl_m": self.hfl_m,
        }
