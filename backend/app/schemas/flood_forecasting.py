"""
JalDrishti Backend — Flood Forecasting Pydantic Schemas
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FloodPredictRequest(BaseModel):
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of observation")
    rain_sensor: Optional[float] = Field(default=None, description="Raw ADC analog value (0-1023)")
    rain_intensity: float = Field(..., ge=0.0, le=1.0, description="Normalized rain intensity proxy [0.0 - 1.0]")
    rain_5m: float = Field(default=0.0, ge=0.0, description="5-minute cumulative rain activity proxy")
    rain_15m: float = Field(default=0.0, ge=0.0, description="15-minute cumulative rain activity proxy")
    rain_30m: float = Field(default=0.0, ge=0.0, description="30-minute cumulative rain activity proxy")
    rain_1h: float = Field(default=0.0, ge=0.0, description="1-hour cumulative rain activity proxy")
    rain_3h: float = Field(default=0.0, ge=0.0, description="3-hour cumulative rain activity proxy")
    rain_6h: float = Field(default=0.0, ge=0.0, description="6-hour cumulative rain activity proxy")
    rate_of_change: float = Field(default=0.0, description="Rate of change in rain intensity per minute")
    rain_duration_min: float = Field(default=0.0, ge=0.0, description="Continuous rain duration in minutes")
    water_level_m: float = Field(default=1.80, ge=0.0, description="River stage water level in meters")


class FloodPredictResponse(BaseModel):
    flood_probability: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., description="'LOW', 'MODERATE', 'HIGH', 'CRITICAL'")
    forecast_horizon: str = Field(default="1-3 hours")
    model_confidence: float = Field(..., ge=0.0, le=100.0)
    model_name: str = Field(default="XGBoost-TimeSeriesForecaster-v1.0")
    model_version: str = Field(default="1.0.0")
    features_used: Dict[str, float] = Field(default_factory=dict)


class LiveForecastSummary(BaseModel):
    status: str = Field(default="INSUFFICIENT_DATA", description="'VALID', 'INSUFFICIENT_DATA', 'OFFLINE'")
    is_sufficient: bool = Field(default=False)
    message: Optional[str] = None
    flood_probability: Optional[float] = None
    risk_level: Optional[str] = None
    forecast_horizon: Optional[str] = "1-3 hours"
    model_confidence: Optional[float] = None
    current_rain_intensity: Optional[float] = None
    raw_sensor_value: Optional[float] = None
    water_level_m: Optional[float] = None
    rainfall_trend: Optional[str] = None
    rate_of_change: Optional[float] = None
    continuous_rain_duration_min: Optional[float] = None
    data_age_seconds: Optional[float] = None
    last_updated_display: Optional[str] = None
    sample_count: int = 0
    model_name: str = "Multi-Sensor Fusion (RainTest)"
    feature_type: str = "sensor-derived proxy rainfall features"
    components: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None


class RainfallTelemetryIngest(BaseModel):
    raw_sensor_value: float = Field(..., ge=0.0, le=1023.0, description="Arduino analog rain sensor reading")
    water_level_m: Optional[float] = Field(default=None, description="Optional river water level measurement in meters")
    water_level_cm: Optional[float] = Field(default=None, description="Optional river water level in centimeters")
    timestamp_epoch: Optional[float] = Field(default=None, description="Epoch timestamp of sensor reading")
    soil_raw: Optional[float] = Field(default=None, description="Raw soil moisture reading")
    is_simulated: bool = Field(default=False)


class RainfallHistoryItem(BaseModel):
    timestamp_iso: str
    time_display: str
    raw_value: float
    rain_intensity: float
    water_level_m: float
    flood_probability: Optional[float] = None
    risk_level: Optional[str] = None
