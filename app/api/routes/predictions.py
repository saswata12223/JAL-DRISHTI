"""
Jal Drishti Backend — Flood Risk Predictions & Inference API Route
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
from app.core.region_context import (
    resolve_region,
    assert_model_available,
    RegionNotFoundError,
    ModelUnavailableError,
)

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
def run_live_inference(
    request: LiveInferenceRequest,
    region_id: Optional[str] = Query(
        default=None,
        description=(
            "Optional region identifier. If omitted, defaults to Uttarakhand "
            "(existing behavior preserved). If provided, the region must be "
            "registered AND have a validated model, otherwise inference is blocked."
        )
    ),
):
    """
    Calculates SCS-CN physics layer variables on-the-fly and returns calibrated flood probability.

    REGIONAL SAFETY GATE:
    - If region_id is omitted: existing Uttarakhand inference runs unchanged.
    - If region_id='uttarakhand': same as above (explicit).
    - If region_id=<any other registered region>: returns MODEL_UNAVAILABLE.
    - If region_id=<unknown>: returns REGION_NOT_FOUND (HTTP 404).

    An unsupported region CANNOT reach the Uttarakhand XGBoost model.
    """
    # ── Regional context gate ──────────────────────────────────────────────
    if region_id is not None:
        # Validate region exists in registry
        try:
            context = resolve_region(region_id)
        except RegionNotFoundError as e:
            raise HTTPException(
                status_code=404,
                detail={
                    "status": "REGION_NOT_FOUND",
                    "region_id": region_id,
                    "reason": str(e),
                },
            )

        # Block inference if no registered model for this region
        try:
            assert_model_available(context, hazard="flash_flood")
        except ModelUnavailableError as e:
            raise HTTPException(
                status_code=422,
                detail={
                    "status": "MODEL_UNAVAILABLE",
                    "region_id": region_id,
                    "hazard": "flash_flood",
                    "model": None,
                    "reason": str(e),
                },
            )
    # ── End regional gate — only reaches here for uttarakhand ─────────────

    try:
        res = predictor.predict(request)
        return APIResponse(
            success=True,
            data=res,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {e}")
