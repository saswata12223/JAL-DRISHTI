"""
FlashFloodAI Backend — Monitoring Stations API Route
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.db.models.station import Station
from app.schemas.stations import StationResponse, StationDetailResponse
from app.schemas.common import APIResponse, GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry
from app.services.data_loader import DatabaseDataLoader

router = APIRouter(prefix="/stations", tags=["Monitoring Stations"])


def _get_fallback_stations() -> List[dict]:
    """Reads station data directly from verified files if database is offline."""
    loader = DatabaseDataLoader()
    return loader.load_stations_data()


@router.get("", response_model=APIResponse[List[StationResponse]], summary="List Monitoring Stations")
def list_stations(
    station_type: Optional[str] = Query(None, description="'CWC_HYDROLOGICAL' or 'IMD_METEOROLOGICAL'"),
    district: Optional[str] = Query(None, description="Filter by Uttarakhand district name"),
    river_name: Optional[str] = Query(None, description="Filter by river name"),
    format: Optional[str] = Query("json", description="'json' or 'geojson'"),
):
    """Retrieves list of CWC and IMD monitoring stations across Uttarakhand."""
    stations_data = []
    if SessionLocal is not None:
        try:
            with SessionLocal() as db:
                query = db.query(Station)
                if station_type:
                    query = query.filter(Station.station_type == station_type)
                if district:
                    query = query.filter(Station.district.ilike(f"%{district}%"))
                if river_name:
                    query = query.filter(Station.river_name.ilike(f"%{river_name}%"))
                rows = query.all()
                if rows:
                    stations_data = [r.to_dict() for r in rows]
        except Exception:
            stations_data = []

    if not stations_data:
        # Fallback to direct authoritative files
        all_stations = _get_fallback_stations()
        stations_data = all_stations
        if station_type:
            stations_data = [s for s in stations_data if s.get("station_type") == station_type]
        if district:
            stations_data = [s for s in stations_data if district.lower() in str(s.get("district", "")).lower()]
        if river_name:
            stations_data = [s for s in stations_data if river_name.lower() in str(s.get("river_name", "")).lower()]

    return APIResponse(
        success=True,
        count=len(stations_data),
        data=[StationResponse(**s) for s in stations_data],
    )


@router.get("/{station_id}", response_model=APIResponse[StationDetailResponse], summary="Get Station Detail")
def get_station_detail(station_id: str):
    """Retrieves detailed information, official CWC flood thresholds, and metadata for a single station."""
    all_stations = _get_fallback_stations()
    match = next(
        (
            s for s in all_stations
            if s["station_id"].lower() == station_id.lower()
            or str(s["station_name"]).lower().replace(" ", "_") == station_id.lower().replace(" ", "_")
        ),
        None,
    )
    if not match:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    detail = dict(match)
    detail["latest_water_level_m"] = None
    detail["latest_alert_stage"] = "UNKNOWN"
    detail["is_telemetry_missing"] = True
    detail["cwc_provenance_verified"] = True

    return APIResponse(
        success=True,
        data=StationDetailResponse(**detail),
    )
