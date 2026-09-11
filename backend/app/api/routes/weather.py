"""
FlashFloodAI Backend — Live OpenWeather API Route
"""

from typing import Optional
from fastapi import APIRouter, Query

from app.config import settings
from app.services.weather_service import WeatherService

router = APIRouter(prefix="/weather", tags=["Live Weather (OpenWeather)"])


@router.get("/current", summary="Get Live Weather Conditions")
def get_current_weather(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    location: Optional[str] = Query(None, description="Optional location / station name override"),
):
    """
    Retrieves live weather observations for specified coordinates from OpenWeather.
    Defaults to Uttarakhand center (Lat: 30.0668, Lon: 79.0193) if coordinates are omitted.
    """
    target_lat = lat if lat is not None else settings.DEFAULT_LAT
    target_lon = lon if lon is not None else settings.DEFAULT_LON

    service = WeatherService.get_instance()
    return service.get_current_weather(target_lat, target_lon, location_name=location)


@router.get("/forecast", summary="Get Weather Forecast (Hourly & Daily)")
def get_weather_forecast(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude in decimal degrees"),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude in decimal degrees"),
    location: Optional[str] = Query(None, description="Optional location / station name override"),
):
    """
    Retrieves normalized hourly (next 24h) and 5-day daily forecast summaries from OpenWeather.
    Defaults to Uttarakhand center (Lat: 30.0668, Lon: 79.0193) if coordinates are omitted.
    """
    target_lat = lat if lat is not None else settings.DEFAULT_LAT
    target_lon = lon if lon is not None else settings.DEFAULT_LON

    service = WeatherService.get_instance()
    return service.get_forecast(target_lat, target_lon, location_name=location)
