"""
FlashFloodAI Backend — Flood Prediction Pydantic Schemas
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    sample_id: str
    spatial_id: str
    sample_type: str
    timestamp_utc: str
    district: str
    major_basin: Optional[str] = None
    latitude: float
    longitude: float
    model_name: str
    model_version: str
    prediction_probability: float
    ml_risk_class: str
    ml_decision_threshold: float = 0.40
    scs_direct_runoff_q_mm: Optional[float] = None
    scs_peak_runoff_potential: Optional[float] = None
    official_flood_status: str
    official_alert_stage: str
    warning_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    hfl_m: Optional[float] = None

    class Config:
        from_attributes = True


class LatestRiskSummaryResponse(BaseModel):
    timestamp_utc: str
    total_monitored_points: int
    risk_class_counts: Dict[str, int]
    high_extreme_alert_locations: List[PredictionResponse]
    model_version: str


class LiveInferenceRequest(BaseModel):
    """Payload for on-demand model inference with SCS-CN physics derivation."""
    rainfall_1h_mm: float = Field(default=0.0, description="1-hour accumulated precipitation in mm")
    rainfall_30min_mm: Optional[float] = Field(default=0.0, description="30-min precipitation in mm")
    rainfall_3h_mm: Optional[float] = Field(default=0.0, description="3-hour precipitation in mm")
    surface_soil_moisture_vol: Optional[float] = Field(default=0.80, description="SMAP surface volumetric moisture")
    profile_soil_moisture_vol: Optional[float] = Field(default=0.80, description="SMAP profile volumetric moisture")
    soil_saturation_index: Optional[float] = Field(default=0.80, description="Soil saturation index (0-1)")
    elevation_m: Optional[float] = Field(default=1500.0, description="SRTM elevation in meters")
    slope_deg: Optional[float] = Field(default=15.0, description="Topographic slope in degrees")
    landcover_class: Optional[int] = Field(default=10, description="ESA WorldCover class code (10, 20, 30, ...)")
    district: Optional[str] = Field(default="Chamoli", description="Target district")


class LiveInferenceResponse(BaseModel):
    probability: float
    risk_class: str
    decision_threshold: float = 0.40
    is_alarm: bool
    scs_direct_runoff_q_mm: float
    scs_potential_retention_s_mm: float
    model_name: str = "XGBoost_PPT_Upgraded"
    model_version: str = "6.1.0"
