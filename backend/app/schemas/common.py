"""
FlashFloodAI Backend — Common Pydantic Schemas & GeoJSON Envelopes
"""

from typing import Any, Dict, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""
    success: bool = True
    message: Optional[str] = None
    count: Optional[int] = None
    data: T


class GeoJSONGeometry(BaseModel):
    """GeoJSON Point geometry representation."""
    type: str = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")


class GeoJSONFeature(BaseModel, Generic[T]):
    """GeoJSON Feature representation."""
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: T


class GeoJSONFeatureCollection(BaseModel, Generic[T]):
    """GeoJSON FeatureCollection representation."""
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature[T]]
