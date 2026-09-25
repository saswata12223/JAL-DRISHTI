"""
FlashFloodAI Backend — Station Pydantic Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class StationBase(BaseModel):
    station_id: str
    station_name: str
    station_type: str = Field(..., description="'CWC_HYDROLOGICAL' or 'IMD_METEOROLOGICAL'")
    river_name: Optional[str] = None
    major_basin: Optional[str] = None
    district: str
    state: str = "Uttarakhand"
    latitude: float
    longitude: float
    warning_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    hfl_m: Optional[float] = None
    gauge_datum_msl_m: Optional[float] = None
    source_agency: str
    source_document: Optional[str] = None
    source_url: Optional[str] = None
    status: str = "ACTIVE"


class StationResponse(StationBase):
    class Config:
        from_attributes = True


class StationDetailResponse(StationBase):
    latest_water_level_m: Optional[float] = None
    latest_alert_stage: Optional[str] = "UNKNOWN"
    is_telemetry_missing: bool = True
    cwc_provenance_verified: bool = True

    class Config:
        from_attributes = True
