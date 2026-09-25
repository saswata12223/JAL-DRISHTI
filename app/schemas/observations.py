"""
FlashFloodAI Backend — Observation Pydantic Schemas
"""

from typing import Optional
from pydantic import BaseModel


class WeatherObservationResponse(BaseModel):
    timestamp_utc: str
    station_id: str
    station_name: Optional[str] = None
    district: str
    latitude: float
    longitude: float
    temperature_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    surface_pressure_hpa: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    rainfall_mm: Optional[float] = None

    class Config:
        from_attributes = True


class RainfallObservationResponse(BaseModel):
    timestamp_utc: str
    spatial_id: str
    district: Optional[str] = None
    latitude: float
    longitude: float
    rainfall_30min_mm: Optional[float] = None
    rainfall_1h_mm: Optional[float] = None
    rainfall_3h_mm: Optional[float] = None
    max_intensity_mmh: Optional[float] = None
    mean_intensity_mmh: Optional[float] = None
    effective_precipitation_mm: Optional[float] = None
    antecedent_precipitation_index_mm: Optional[float] = None

    class Config:
        from_attributes = True


class SoilMoistureObservationResponse(BaseModel):
    timestamp_utc: str
    spatial_id: str
    latitude: float
    longitude: float
    surface_soil_moisture_vol: Optional[float] = None
    rootzone_soil_moisture_vol: Optional[float] = None
    profile_soil_moisture_vol: Optional[float] = None
    soil_saturation_index: Optional[float] = None

    class Config:
        from_attributes = True


class WaterLevelObservationResponse(BaseModel):
    timestamp_utc: str
    station_id: str
    station_name: Optional[str] = None
    river_name: Optional[str] = None
    district: Optional[str] = None
    water_level_m: Optional[float] = None
    discharge_cumec: Optional[float] = None
    warning_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    hfl_m: Optional[float] = None
    official_flood_status: str
    official_alert_stage: str
    is_telemetry_missing: bool = True

    class Config:
        from_attributes = True
