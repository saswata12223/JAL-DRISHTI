from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
import logging
from app.services.weather_adapter import WeatherAdapter, LiveObservationValidationError

logger = logging.getLogger("FlashFloodAI.API.LiveAnomalies")

router = APIRouter(prefix="/live", tags=["Live Monitoring"])

@router.get("/environment", response_model=Dict[str, Any])
def get_live_environment():
    """
    Retrieve current live environmental observations.
    Phase 14 integration ensures this fails safely when real telemetry is missing.
    """
    # Phase 13 audit proved that all live telemetry sources (IMD, GPM, SMAP, CWC)
    # are either NOT_CONFIGURED or UNREACHABLE.
    return {
        "status": "UNAVAILABLE",
        "reason": "NO_CURRENT_OBSERVATION",
        "source": "imd_aws_arg",
        "environmental_anomaly": "UNAVAILABLE",
        "hydrological_risk_indicator": "UNAVAILABLE",
        "model_probability": "UNAVAILABLE",
        "model_risk_class": "UNAVAILABLE",
        "freshness": "UNVERIFIED"
    }

@router.get("/telemetry", response_model=Dict[str, Any])
def get_live_telemetry():
    """
    Retrieve genuine live telemetry.
    Uses OpenWeatherMap as a surface meteorology proxy (Phase 17).
    """
    adapter = WeatherAdapter()
    
    # Dehradun coordinates for proxy testing (center of Uttarakhand bounding box approx)
    target_lat = 30.3165
    target_lon = 78.0322
    
    try:
        obs = adapter.fetch_current_observation(lat=target_lat, lon=target_lon)
        
        status = "STALE" if obs.get("is_stale") else "AVAILABLE"
        data_state = "STALE" if obs.get("is_stale") else "LIVE"
        
        return {
            "status": status,
            "data_state": data_state,
            "observations": [obs]
        }
    except LiveObservationValidationError as e:
        logger.warning(f"Live telemetry validation failed: {e}")
        return {
            "status": "UNAVAILABLE",
            "data_state": "UNVERIFIED",
            "reason": str(e),
            "observations": []
        }
    except Exception as e:
        logger.error(f"Unexpected error in live telemetry: {e}")
        return {
            "status": "UNAVAILABLE",
            "data_state": "NO_CURRENT_OBSERVATION",
            "observations": []
        }

@router.get("/anomalies", response_model=Dict[str, Any])
def get_live_anomalies():
    """
    Retrieve recent environmental anomalies.
    """
    return {
        "status": "UNAVAILABLE",
        "reason": "HISTORICAL_REPLAY_BLOCKED",
        "message": "Live anomalies are currently unavailable due to lack of verified telemetry."
    }

@router.get("/overview", response_model=Dict[str, Any])
def get_live_overview():
    """
    Retrieve overview statistics of current environmental anomalies.
    """
    return {
        "status": "UNAVAILABLE",
        "reason": "HISTORICAL_REPLAY_BLOCKED",
        "message": "Live environment overview is unavailable.",
        "latest_timestamp": None,
        "total_stations_monitored": 0
    }
