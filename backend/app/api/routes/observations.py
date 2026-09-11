"""
FlashFloodAI Backend — Hydrometeorological Observations API Route
Provides access to weather, rainfall, soil moisture, and water level time-series.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse
from app.schemas.observations import (
    WeatherObservationResponse,
    RainfallObservationResponse,
    SoilMoistureObservationResponse,
    WaterLevelObservationResponse,
)
from app.services.data_loader import DatabaseDataLoader

router = APIRouter(prefix="/observations", tags=["Environmental Observations"])

loader = DatabaseDataLoader()


@router.get("/weather", response_model=APIResponse[List[WeatherObservationResponse]], summary="Get IMD Weather Observations")
def get_weather_observations(
    district: Optional[str] = Query(None, description="Filter by district"),
    station_id: Optional[str] = Query(None, description="Filter by station ID"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves IMD meteorological station observations."""
    _, _, _, weather_obs = loader.load_timeseries_observations()
    if not weather_obs:
        # Fallback to stations with mock observation structure if needed or empty list
        stations = loader.load_stations_data()
        weather_obs = []
        for s in stations:
            if s["station_type"] == "IMD_METEOROLOGICAL":
                weather_obs.append({
                    "timestamp_utc": "2026-08-27T00:00:00Z",
                    "station_id": s["station_id"],
                    "station_name": s["station_name"],
                    "district": s["district"],
                    "latitude": s["latitude"],
                    "longitude": s["longitude"],
                    "temperature_c": None,
                    "relative_humidity_pct": None,
                    "surface_pressure_hpa": None,
                    "wind_speed_ms": None,
                    "rainfall_mm": None,
                })

    res = weather_obs
    if district:
        res = [w for w in res if district.lower() in str(w.get("district", "")).lower()]
    if station_id:
        res = [w for w in res if w.get("station_id") == station_id]

    return APIResponse(
        success=True,
        count=len(res[:limit]),
        data=[WeatherObservationResponse(**w) for w in res[:limit]],
    )


@router.get("/rainfall", response_model=APIResponse[List[RainfallObservationResponse]], summary="Get GPM Rainfall Observations")
def get_rainfall_observations(
    district: Optional[str] = Query(None, description="Filter by district"),
    spatial_id: Optional[str] = Query(None, description="Filter by grid or station spatial ID"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves GPM IMERG gridded and catchment precipitation observations."""
    rain_obs, _, _, _ = loader.load_timeseries_observations()
    res = rain_obs
    if district:
        res = [r for r in res if district.lower() in str(r.get("district", "")).lower()]
    if spatial_id:
        res = [r for r in res if r.get("spatial_id") == spatial_id]

    return APIResponse(
        success=True,
        count=len(res[:limit]),
        data=[RainfallObservationResponse(**r) for r in res[:limit]],
    )


@router.get("/soil-moisture", response_model=APIResponse[List[SoilMoistureObservationResponse]], summary="Get SMAP Soil Moisture Observations")
def get_soil_moisture_observations(
    spatial_id: Optional[str] = Query(None, description="Filter by spatial location ID"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves NASA SMAP surface and rootzone soil moisture observations."""
    _, soil_obs, _, _ = loader.load_timeseries_observations()
    res = soil_obs
    if spatial_id:
        res = [s for s in res if s.get("spatial_id") == spatial_id]

    return APIResponse(
        success=True,
        count=len(res[:limit]),
        data=[SoilMoistureObservationResponse(**s) for s in res[:limit]],
    )


@router.get("/water-level", response_model=APIResponse[List[WaterLevelObservationResponse]], summary="Get CWC Water Level Observations")
def get_water_level_observations(
    station_id: Optional[str] = Query(None, description="Filter by CWC station ID"),
    alert_stage: Optional[str] = Query(None, description="Filter by alert stage (NORMAL, WARNING, DANGER, HFL, UNKNOWN)"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves CWC river stage observations with official Warning/Danger/HFL thresholds."""
    _, _, water_obs, _ = loader.load_timeseries_observations()
    res = water_obs
    if station_id:
        res = [w for w in res if w.get("station_id") == station_id]
    if alert_stage:
        res = [w for w in res if str(w.get("official_alert_stage", "")).upper() == alert_stage.upper()]

    return APIResponse(
        success=True,
        count=len(res[:limit]),
        data=[WaterLevelObservationResponse(**w) for w in res[:limit]],
    )
