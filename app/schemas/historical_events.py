"""
FlashFloodAI Backend — Historical Event Pydantic Schemas
"""

from typing import Optional
from pydantic import BaseModel


class HistoricalEventResponse(BaseModel):
    event_id: str
    event_date: str
    event_end_date: Optional[str] = None
    event_type: str
    event_name: str
    state: str = "Uttarakhand"
    district: str
    location: str
    river_basin: str
    latitude: float
    longitude: float
    severity_category: str
    deaths: int
    missing_persons: Optional[float] = None
    affected_population: int
    infrastructure_damage: Optional[str] = None
    rainfall_information: Optional[str] = None
    water_level_information: Optional[str] = None
    triggering_hazard: Optional[str] = None
    description: Optional[str] = None
    source_name: str
    source_url: Optional[str] = None
    confidence: str = "HIGH"

    class Config:
        from_attributes = True
