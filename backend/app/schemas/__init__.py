"""
FlashFloodAI Backend — Schemas Registration
"""

from app.schemas.common import APIResponse, GeoJSONFeature, GeoJSONFeatureCollection, GeoJSONGeometry
from app.schemas.stations import StationBase, StationResponse, StationDetailResponse
from app.schemas.observations import (
    WeatherObservationResponse,
    RainfallObservationResponse,
    SoilMoistureObservationResponse,
    WaterLevelObservationResponse,
)
from app.schemas.predictions import (
    PredictionResponse,
    LatestRiskSummaryResponse,
    LiveInferenceRequest,
    LiveInferenceResponse,
)
from app.schemas.historical_events import HistoricalEventResponse
from app.schemas.metadata import SystemMetadataResponse
from app.schemas.risk_decision import (
    ContributingFactorSchema,
    RiskDecisionResponse,
    RiskEvaluationRequest,
    RiskSummaryResponse,
    RiskAlertItem,
    RiskAlertsResponse,
    RiskPolicySchema,
)

__all__ = [
    "APIResponse",
    "GeoJSONFeature",
    "GeoJSONFeatureCollection",
    "GeoJSONGeometry",
    "StationBase",
    "StationResponse",
    "StationDetailResponse",
    "WeatherObservationResponse",
    "RainfallObservationResponse",
    "SoilMoistureObservationResponse",
    "WaterLevelObservationResponse",
    "PredictionResponse",
    "LatestRiskSummaryResponse",
    "LiveInferenceRequest",
    "LiveInferenceResponse",
    "HistoricalEventResponse",
    "SystemMetadataResponse",
    "ContributingFactorSchema",
    "RiskDecisionResponse",
    "RiskEvaluationRequest",
    "RiskSummaryResponse",
    "RiskAlertItem",
    "RiskAlertsResponse",
    "RiskPolicySchema",
]
