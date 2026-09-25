"""
FlashFloodAI Backend — System Metadata & Provenance Schemas
"""

from typing import Any, Dict, List
from pydantic import BaseModel


class SystemMetadataResponse(BaseModel):
    system_name: str = "FlashFloodAI Backend & Database Engine"
    version: str = "7.0.0"
    spatial_coverage: Dict[str, Any]
    source_agencies: List[str]
    cwc_monitoring_stations_count: int
    imd_monitoring_stations_count: int
    historical_disasters_count: int
    model_stack: Dict[str, Any]
    physics_layer: Dict[str, Any]
    database_technologies: List[str]
