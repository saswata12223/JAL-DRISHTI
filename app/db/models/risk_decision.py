"""
FlashFloodAI Backend — Risk Decision Database Model
Represents evaluated risk decisions, multi-signal fusion states, and recommended actions.
Integrated with PostGIS geometry (SRID=4326) and TimescaleDB hypertable partitioning on timestamp_utc.
"""

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, Column, DateTime, Float, Index, Integer, String, Text
from app.db.database import Base


class RiskDecisionRecord(Base):
    """
    SQLAlchemy ORM model for deterministic flood risk decisions.
    TimescaleDB Hypertable partitioned on timestamp_utc.
    """
    __tablename__ = "risk_decisions"

    # Composite primary key for hypertable partitioning
    timestamp_utc = Column(DateTime(timezone=True), primary_key=True, nullable=False)
    spatial_id = Column(String(64), primary_key=True, nullable=False)

    sample_id = Column(String(128), nullable=False, unique=True, index=True)
    sample_type = Column(String(64), nullable=False, index=True)  # grid_cell | water_level_station | weather_station | historical_event
    station_id = Column(String(64), nullable=True, index=True)
    station_name = Column(String(255), nullable=True)
    district = Column(String(128), nullable=False, index=True)
    river_name = Column(String(128), nullable=True)
    major_basin = Column(String(128), nullable=True)

    # Geospatial Coordinates & PostGIS Geometry
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    # ML Model Signals
    model_name = Column(String(64), nullable=False)
    model_version = Column(String(32), nullable=False)
    flood_probability = Column(Float, nullable=False)
    ml_risk_class = Column(String(32), nullable=False)
    ml_decision_threshold = Column(Float, nullable=False, default=0.40)

    # Hydrological & CWC Threshold Signals
    water_level_m = Column(Float, nullable=True)  # NULL if offline / unavailable
    warning_level_m = Column(Float, nullable=True)
    danger_level_m = Column(Float, nullable=True)
    hfl_m = Column(Float, nullable=True)
    cwc_threshold_status = Column(String(64), nullable=False)  # BELOW_WARNING | WARNING_ZONE | DANGER_ZONE | ABOVE_HFL | UNAVAILABLE
    official_alert_stage = Column(String(32), nullable=False)  # NONE | YELLOW | ORANGE | RED | UNKNOWN
    is_gauge_offline = Column(Boolean, nullable=False, default=True)

    # Environmental & Physical Signals
    rainfall_1h_mm = Column(Float, nullable=True)
    rainfall_3h_mm = Column(Float, nullable=True)
    soil_saturation_index = Column(Float, nullable=True)
    scs_direct_runoff_q_mm = Column(Float, nullable=True)
    scs_peak_runoff_potential = Column(Float, nullable=True)
    environmental_condition = Column(String(64), nullable=False)  # NORMAL | WATCH | ESCALATING | CRITICAL

    # Final Fused Decision Output
    final_risk_class = Column(String(32), nullable=False, index=True)  # LOW | MODERATE | HIGH | EXTREME
    operational_state = Column(String(64), nullable=False)  # ROUTINE_MONITORING | ELEVATED_WATCH | PREPAREDNESS_WARNING | EMERGENCY_RESPONSE
    alert_priority = Column(String(32), nullable=False, index=True)  # INFORMATION | WATCH | WARNING | CRITICAL
    decision_reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=False)
    contributing_factors_json = Column(Text, nullable=False)  # JSON-encoded contributing factors list

    # Data Quality & Governance
    data_quality_status = Column(String(32), nullable=False)  # COMPLETE | PARTIAL | DEGRADED | UNAVAILABLE
    decision_confidence = Column(Float, nullable=False)  # [0.0, 1.0]
    risk_policy_version = Column(String(32), nullable=False, default="8.1.0")
    threshold_source = Column(String(255), nullable=True)
    generated_at_utc = Column(DateTime(timezone=True), nullable=False)

    __table_args__ = (
        Index("idx_risk_decisions_geom", "geom", postgresql_using="gist"),
        Index("idx_risk_decisions_district_risk", "district", "final_risk_class"),
        Index("idx_risk_decisions_priority", "alert_priority"),
    )
