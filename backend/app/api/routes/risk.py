"""
FlashFloodAI Backend — Risk & Decision API Endpoints
Phase 8: Exposes multi-signal risk decisions, CWC threshold evaluations, active alerts,
district summaries, and live on-demand risk evaluations.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse
from app.schemas.risk_decision import (
    RiskAlertsResponse,
    RiskDecisionResponse,
    RiskEvaluationRequest,
    RiskPolicySchema,
    RiskSummaryResponse,
)
from app.services.risk_decision_engine import RiskDecisionEngine

router = APIRouter(prefix="/risk", tags=["Risk & Decision Engine"])


@router.get(
    "/latest",
    response_model=APIResponse[List[RiskDecisionResponse]],
    summary="Get Latest Multi-Signal Risk Decisions",
)
def get_latest_risk_decisions(
    district: Optional[str] = Query(None, description="Filter by Uttarakhand district"),
    final_risk_class: Optional[str] = Query(None, description="Filter by final risk class: LOW, MODERATE, HIGH, EXTREME"),
    alert_priority: Optional[str] = Query(None, description="Filter by alert priority: INFORMATION, WATCH, WARNING, CRITICAL"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
):
    """
    Retrieves the latest multi-signal risk decisions combining ML predictions,
    official CWC flood thresholds, rainfall intensity, and soil saturation.
    """
    engine = RiskDecisionEngine.get_instance()
    decisions = engine.get_latest_decisions(
        district=district,
        final_risk_class=final_risk_class,
        alert_priority=alert_priority,
        limit=limit,
    )
    return APIResponse(
        success=True,
        count=len(decisions),
        data=decisions,
    )


@router.get(
    "/summary",
    response_model=APIResponse[RiskSummaryResponse],
    summary="Get State-Wide Flood Risk Executive Summary",
)
def get_risk_summary():
    """
    Returns an executive risk summary across Uttarakhand including:
    - Counts of locations in LOW, MODERATE, HIGH, EXTREME states
    - Dissemination alert priority distribution
    - CWC river gauge threshold status distribution
    - District-level risk breakdown
    - Top 10 highest-risk locations requiring urgent operational attention
    """
    engine = RiskDecisionEngine.get_instance()
    summary = engine.get_summary()
    return APIResponse(
        success=True,
        data=summary,
    )


@router.get(
    "/alerts",
    response_model=APIResponse[RiskAlertsResponse],
    summary="Get Active Flood Risk Alerts",
)
def get_active_alerts():
    """
    Retrieves all active WARNING and CRITICAL priority alerts across Uttarakhand,
    complete with operational justifications and recommended disaster management procedures.
    """
    engine = RiskDecisionEngine.get_instance()
    alerts = engine.get_active_alerts()
    return APIResponse(
        success=True,
        data=alerts,
    )


@router.get(
    "/policy",
    response_model=APIResponse[RiskPolicySchema],
    summary="Get Auditable Risk Decision Policy",
)
def get_risk_policy():
    """
    Returns the formal, auditable Multi-Signal Flood Risk Decision Policy (v8.1.0)
    including probability bands, CWC threshold rules, and conflict resolution matrix.
    """
    engine = RiskDecisionEngine.get_instance()
    policy = engine.get_policy()
    return APIResponse(
        success=True,
        data=policy,
    )


@router.get(
    "/timeseries",
    response_model=APIResponse[List[RiskDecisionResponse]],
    summary="Get Time-Series Risk Decisions for a Location",
)
def get_risk_timeseries(
    spatial_id: str = Query(..., description="Spatial identifier or station ID"),
    limit: int = Query(50, ge=1, le=500, description="Number of historical time steps"),
):
    """
    Returns sequence of risk evaluations over time for a given station or grid point.
    """
    engine = RiskDecisionEngine.get_instance()
    decisions = engine.get_latest_decisions(limit=limit)
    filtered = [d for d in decisions if d.spatial_id.lower() == spatial_id.lower()]
    return APIResponse(
        success=True,
        count=len(filtered),
        data=filtered,
    )


@router.get(
    "/{station_id}",
    response_model=APIResponse[RiskDecisionResponse],
    summary="Get Detailed Risk Decision for a Station",
)
def get_station_risk_decision(station_id: str):
    """
    Retrieves the multi-signal risk decision for a specific CWC or IMD station,
    including official CWC threshold status, contributing factors breakdown, and recommended action.
    """
    engine = RiskDecisionEngine.get_instance()
    decision = engine.get_station_decision(station_id)
    if not decision:
        raise HTTPException(
            status_code=404,
            detail=f"Station or location '{station_id}' not found in active risk monitoring network.",
        )
    return APIResponse(
        success=True,
        data=decision,
    )


@router.post(
    "/evaluate",
    response_model=APIResponse[RiskDecisionResponse],
    summary="On-Demand Multi-Signal Risk Evaluation",
)
def evaluate_on_demand_risk(request: RiskEvaluationRequest):
    """
    Performs on-demand live risk evaluation combining:
    1. Phase 6 XGBoost model inference + SCS-CN direct runoff (Q)
    2. CWC Warning/Danger/HFL threshold evaluation
    3. Multi-signal conflict resolution and recommended action assignment
    """
    engine = RiskDecisionEngine.get_instance()
    result = engine.evaluate_live(request)
    return APIResponse(
        success=True,
        data=result,
    )
