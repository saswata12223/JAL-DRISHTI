"""
JalDrishti Backend — Real-Time Flood Forecasting & Time-Series REST API Routes
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body

from app.schemas.common import APIResponse
from app.schemas.flood_forecasting import (
    FloodPredictRequest,
    FloodPredictResponse,
    LiveForecastSummary,
    RainfallHistoryItem,
    RainfallTelemetryIngest,
)
from app.services.raintest_forecasting_service import RainTestForecastingService

router = APIRouter(prefix="/flood", tags=["Flood Forecasting ML Pipeline"])


@router.post("/predict", response_model=APIResponse[FloodPredictResponse], summary="Run Modular ML Flood Forecast on Features")
def predict_flood_risk(request: FloodPredictRequest):
    """
    Executes supervised ML inference (XGBoost Forecaster v1.0) on rolling rainfall proxy features.
    Outputs calibrated flood probability, categorical risk level (LOW, MODERATE, HIGH, CRITICAL),
    forecast horizon (1-3 hours), and model confidence score.
    """
    service = RainTestForecastingService.get_instance()
    try:
        res = service.predict_custom_features(request)
        return APIResponse(success=True, data=res)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flood forecasting inference failed: {e}")


@router.get("/forecast/latest", response_model=APIResponse[LiveForecastSummary], summary="Get Latest Real-Time Flood Forecast")
def get_latest_forecast():
    """
    Returns the real-time operational flood forecast computed from active Arduino rain sensor
    time-series observations. If insufficient data (<3 observations) or sensor is stale (>45s),
    appropriately returns diagnostic state rather than misleading predictions.
    """
    service = RainTestForecastingService.get_instance()
    summary = service.get_live_forecast()
    return APIResponse(success=True, data=summary)


@router.get("/history", response_model=APIResponse[List[RainfallHistoryItem]], summary="Get Rainfall & Risk History Time-Series")
def get_rainfall_history(
    window_minutes: int = Query(60, ge=5, le=1440, description="Time-series lookback window in minutes")
):
    """
    Returns recent timestamped rain intensity and water level readings for interactive
    dashboard history trend charts (15m, 1h, 3h windows).
    """
    service = RainTestForecastingService.get_instance()
    history = service.get_history(window_seconds=window_minutes * 60)
    return APIResponse(success=True, count=len(history), data=history)


@router.post("/telemetry", response_model=APIResponse[LiveForecastSummary], summary="Ingest Raw Arduino Rain Telemetry & Forecast")
def ingest_rainfall_telemetry(payload: RainfallTelemetryIngest):
    """
    Direct ingestion endpoint for Arduino UNO analog rain sensor (ADC 0-1023) observations.
    Updates sliding window, calculates rolling proxy features, triggers ML forecast, and saves observation.
    """
    service = RainTestForecastingService.get_instance()
    wl = payload.water_level_m
    if wl is None and payload.water_level_cm is not None:
        wl = payload.water_level_cm / 100.0

    summary = service.ingest_sensor_reading(
        raw_sensor_value=payload.raw_sensor_value,
        water_level_m=wl,
        timestamp_epoch=payload.timestamp_epoch,
        is_simulated=payload.is_simulated,
        soil_raw=payload.soil_raw
    )
    return APIResponse(success=True, data=summary)
