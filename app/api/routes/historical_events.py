"""
FlashFloodAI Backend — Historical Flood Events API Route
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse, GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry
from app.schemas.historical_events import HistoricalEventResponse
from app.services.data_loader import DatabaseDataLoader

router = APIRouter(prefix="/historical-events", tags=["Historical Disaster Benchmark"])

loader = DatabaseDataLoader()


@router.get("", response_model=APIResponse[List[HistoricalEventResponse]], summary="List Canonical Historical Disaster Events")
def list_historical_events(
    district: Optional[str] = Query(None, description="Filter by district"),
    event_type: Optional[str] = Query(None, description="Filter by disaster event type"),
    severity: Optional[str] = Query(None, description="Filter by severity category"),
):
    """Retrieves 15 canonical flood, flash flood, and GLOF disaster events (1970–2024) in Uttarakhand."""
    events = loader.load_historical_events_data()
    res = events
    if district:
        res = [e for e in res if district.lower() in str(e.get("district", "")).lower()]
    if event_type:
        res = [e for e in res if event_type.lower() in str(e.get("event_type", "")).lower()]
    if severity:
        res = [e for e in res if severity.lower() in str(e.get("severity_category", "")).lower()]

    return APIResponse(
        success=True,
        count=len(res),
        data=[HistoricalEventResponse(**e) for e in res],
    )


@router.get("/{event_id}", response_model=APIResponse[HistoricalEventResponse], summary="Get Historical Event Detail")
def get_historical_event_detail(event_id: str):
    """Retrieves full documentation and agency citations for a specific historical disaster event."""
    events = loader.load_historical_events_data()
    match = next((e for e in events if e["event_id"] == event_id), None)
    if not match:
        raise HTTPException(status_code=404, detail=f"Historical disaster event '{event_id}' not found.")

    return APIResponse(
        success=True,
        data=HistoricalEventResponse(**match),
    )
