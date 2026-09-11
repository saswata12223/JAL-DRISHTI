"""
FlashFloodAI Backend — Flood Risk Predictions & Inference API Route
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse
from app.schemas.predictions import (
    PredictionResponse,
    LatestRiskSummaryResponse,
    LiveInferenceRequest,
    LiveInferenceResponse,
)
from app.services.data_loader import DatabaseDataLoader
from app.services.prediction_service import PredictionService

router = APIRouter(prefix="/predictions", tags=["Flood Risk Predictions"])

loader = DatabaseDataLoader()
predictor = PredictionService.get_instance()


@router.get("", response_model=APIResponse[List[PredictionResponse]], summary="Get Historical & Grid Predictions")
def get_predictions(
    district: Optional[str] = Query(None, description="Filter by district"),
    risk_class: Optional[str] = Query(None, description="Filter by risk class: LOW, MODERATE, HIGH, EXTREME"),
    sample_type: Optional[str] = Query(None, description="Filter by sample type: grid_cell, water_level_station, district_zonal, historical_event_benchmark"),
    limit: int = Query(100, ge=1, le=1000),
):
    """Retrieves ML flood predictions with SCS-CN physics attributes."""
    all_preds = loader.load_predictions_data()
    res = all_preds
    if district:
        res = [p for p in res if district.lower() in str(p.get("district", "")).lower()]
    if risk_class:
        res = [p for p in res if str(p.get("ml_risk_class", "")).upper() == risk_class.upper()]
    if sample_type:
        res = [p for p in res if str(p.get("sample_type", "")) == sample_type]

    # Convert timestamps to isoformat strings for Pydantic
    formatted = []
    for p in res[:limit]:
        item = dict(p)
        item["timestamp_utc"] = item["timestamp_utc"].isoformat() if hasattr(item["timestamp_utc"], "isoformat") else str(item["timestamp_utc"])
        formatted.append(PredictionResponse(**item))

    return APIResponse(
        success=True,
        count=len(formatted),
        data=formatted,
    )


@router.get("/latest", response_model=APIResponse[LatestRiskSummaryResponse], summary="Get Latest Risk Summary")
def get_latest_risk_summary():
    """Returns the latest state of monitored points across Uttarakhand with risk category aggregations."""
    all_preds = loader.load_predictions_data()
    if not all_preds:
        raise HTTPException(status_code=404, detail="No prediction records found.")

    counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "EXTREME": 0}
    high_alerts = []

    for p in all_preds:
        rc = str(p.get("ml_risk_class", "LOW")).upper()
        if rc in counts:
            counts[rc] += 1
        if rc in ["HIGH", "EXTREME"]:
            item = dict(p)
            item["timestamp_utc"] = item["timestamp_utc"].isoformat() if hasattr(item["timestamp_utc"], "isoformat") else str(item["timestamp_utc"])
            high_alerts.append(PredictionResponse(**item))

    summary = LatestRiskSummaryResponse(
        timestamp_utc=all_preds[0]["timestamp_utc"].isoformat() if hasattr(all_preds[0]["timestamp_utc"], "isoformat") else str(all_preds[0]["timestamp_utc"]),
        total_monitored_points=len(all_preds),
        risk_class_counts=counts,
        high_extreme_alert_locations=high_alerts[:50],
        model_version="6.1.0 (PPT Upgraded)",
    )

    return APIResponse(
        success=True,
        data=summary,
    )


@router.post("/infer", response_model=APIResponse[LiveInferenceResponse], summary="Run Live On-Demand Inference")
def run_live_inference(request: LiveInferenceRequest):
    """Calculates SCS-CN physics layer variables on-the-fly and returns calibrated flood probability."""
    try:
        res = predictor.predict(request)
        return APIResponse(
            success=True,
            data=res,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {e}")
