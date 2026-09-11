"""
FlashFloodAI Backend — Risk & Decision Engine Pydantic Schemas
Strictly validated data models for risk decisions, multi-signal evaluations, alerts, and policies.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ContributingFactorSchema(BaseModel):
    """Specific environmental or hydrological factor contributing to the risk decision."""
    factor_name: str = Field(..., description="Signal identifier (e.g. ML_PROBABILITY, CWC_RIVER_STAGE, RAINFALL_INTENSITY)")
    observed_value: Optional[float] = Field(None, description="Numeric observed value where applicable")
    status_label: str = Field(..., description="Qualitative status (e.g. CRITICAL, DANGER_ZONE, ELEVATED)")
    impact_weight: str = Field(..., description="Impact severity: LOW | MEDIUM | HIGH | DOMINANT")
    explanation: str = Field(..., description="Human-readable explanation of how this factor impacted the decision")


class RiskDecisionResponse(BaseModel):
    """Complete multi-signal risk decision record."""
    timestamp_utc: datetime = Field(..., description="Timestamp of the observation or prediction window")
    spatial_id: str = Field(..., description="Unique spatial identifier (grid coordinate, station ID, or event ID)")
    sample_id: str = Field(..., description="Unique sample identifier")
    sample_type: str = Field(..., description="Type of monitored location (grid_cell, water_level_station, weather_station, historical_event)")
    station_id: Optional[str] = Field(None, description="Associated station identifier if applicable")
    station_name: Optional[str] = Field(None, description="Name of station or geographical location")
    district: str = Field(..., description="Administrative district in Uttarakhand")
    river_name: Optional[str] = Field(None, description="Monitored river name")
    major_basin: Optional[str] = Field(None, description="Hydrological catchment / river basin")

    # Geospatial Coordinates
    latitude: float = Field(..., description="Latitude coordinate (EPSG:4326)")
    longitude: float = Field(..., description="Longitude coordinate (EPSG:4326)")

    # ML Model Signals
    model_name: str = Field("XGBoost_PPT_Upgraded", description="ML model architecture name")
    model_version: str = Field("6.1.0", description="Model version")
    flood_probability: float = Field(..., ge=0.0, le=1.0, description="Predicted flash flood probability")
    ml_risk_class: str = Field(..., description="ML discrete risk classification: LOW | MODERATE | HIGH | EXTREME")
    ml_decision_threshold: float = Field(0.40, description="Decision threshold benchmark")

    # Hydrological & CWC Threshold Signals
    water_level_m: Optional[float] = Field(None, description="Observed water level above MSL (NULL if offline)")
    warning_level_m: Optional[float] = Field(None, description="Official CWC warning level")
    danger_level_m: Optional[float] = Field(None, description="Official CWC danger level")
    hfl_m: Optional[float] = Field(None, description="Official CWC Highest Flood Level")
    cwc_threshold_status: str = Field(..., description="Official CWC status: BELOW_WARNING | WARNING_ZONE | DANGER_ZONE | ABOVE_HFL | UNAVAILABLE")
    official_alert_stage: str = Field(..., description="Official CWC alert stage: NONE | YELLOW | ORANGE | RED | UNKNOWN")
    is_gauge_offline: bool = Field(True, description="True if real-time water level gauge telemetry is unavailable")

    # Environmental & Physical Signals
    rainfall_1h_mm: Optional[float] = Field(None, description="1-hour rainfall accumulation in mm")
    rainfall_3h_mm: Optional[float] = Field(None, description="3-hour rainfall accumulation in mm")
    soil_saturation_index: Optional[float] = Field(None, description="Soil saturation index [0, 1]")
    scs_direct_runoff_q_mm: Optional[float] = Field(None, description="SCS-CN direct runoff depth Q in mm")
    scs_peak_runoff_potential: Optional[float] = Field(None, description="SCS kinematic peak runoff wave potential qp")
    environmental_condition: str = Field(..., description="Atmospheric/hydrological state: NORMAL | WATCH | ESCALATING | CRITICAL")

    # Final Fused Decision Output
    final_risk_class: str = Field(..., description="Unified final risk class: LOW | MODERATE | HIGH | EXTREME")
    operational_state: str = Field(..., description="Operational response state: ROUTINE_MONITORING | ELEVATED_WATCH | PREPAREDNESS_WARNING | EMERGENCY_RESPONSE")
    alert_priority: str = Field(..., description="Dissemination priority: INFORMATION | WATCH | WARNING | CRITICAL")
    decision_reason: str = Field(..., description="Deterministic justification explaining the fusion logic")
    recommended_action: str = Field(..., description="Official recommended disaster preparedness / mitigation action")
    contributing_factors: List[ContributingFactorSchema] = Field(default_factory=list, description="Ranked contributing factors breakdown")

    # Data Quality & Governance
    data_quality_status: str = Field(..., description="Data completeness status: COMPLETE | PARTIAL | DEGRADED | UNAVAILABLE")
    decision_confidence: float = Field(..., ge=0.0, le=1.0, description="Decision confidence based on sensor completeness")
    risk_policy_version: str = Field("8.1.0", description="Risk policy engine version")
    threshold_source: Optional[str] = Field(None, description="Provenance citation for CWC thresholds")
    generated_at_utc: datetime = Field(..., description="Timestamp when the decision was generated")


class RiskEvaluationRequest(BaseModel):
    """On-demand multi-signal risk evaluation payload."""
    rainfall_1h_mm: float = Field(..., ge=0.0, description="1-hour rainfall accumulation in mm")
    rainfall_30min_mm: Optional[float] = Field(None, ge=0.0, description="30-minute rainfall in mm")
    rainfall_3h_mm: Optional[float] = Field(None, ge=0.0, description="3-hour rainfall in mm")
    surface_soil_moisture_vol: float = Field(..., ge=0.0, le=1.0, description="Surface volumetric soil moisture")
    profile_soil_moisture_vol: Optional[float] = Field(None, ge=0.0, le=1.0, description="Profile soil moisture")
    soil_saturation_index: float = Field(..., ge=0.0, le=1.0, description="Soil saturation index")
    elevation_m: float = Field(..., description="Digital elevation above MSL in meters")
    slope_deg: float = Field(..., ge=0.0, le=90.0, description="Terrain slope angle in degrees")
    landcover_class: int = Field(..., description="ESA WorldCover landcover class code")

    # Optional river gauge context
    water_level_m: Optional[float] = Field(None, description="Observed water level above MSL (NULL if unavailable)")
    warning_level_m: Optional[float] = Field(None, description="Official CWC Warning Level")
    danger_level_m: Optional[float] = Field(None, description="Official CWC Danger Level")
    hfl_m: Optional[float] = Field(None, description="Official CWC Highest Flood Level")
    station_id: Optional[str] = Field(None, description="Optional CWC/IMD Station ID")
    district: Optional[str] = Field("Dehradun", description="Uttarakhand district name")
    latitude: Optional[float] = Field(30.3165, description="Latitude (EPSG:4326)")
    longitude: Optional[float] = Field(78.0322, description="Longitude (EPSG:4326)")


class RiskSummaryResponse(BaseModel):
    """State-wide executive summary of risk decisions across Uttarakhand."""
    total_evaluated_points: int = Field(..., description="Total monitored locations evaluated")
    risk_class_counts: Dict[str, int] = Field(..., description="Distribution across LOW, MODERATE, HIGH, EXTREME")
    alert_priority_counts: Dict[str, int] = Field(..., description="Distribution across INFORMATION, WATCH, WARNING, CRITICAL")
    cwc_threshold_status_counts: Dict[str, int] = Field(..., description="Distribution of river gauge statuses")
    data_quality_counts: Dict[str, int] = Field(..., description="Distribution across COMPLETE, PARTIAL, DEGRADED, UNAVAILABLE")
    district_risk_breakdown: Dict[str, Dict[str, int]] = Field(..., description="District-level count of risk classes")
    highest_risk_locations: List[Dict[str, Any]] = Field(default_factory=list, description="Top high-risk locations requiring urgent attention")
    risk_policy_version: str = Field("8.1.0", description="Risk policy engine version")
    generated_at_utc: datetime = Field(..., description="Generation timestamp")


class RiskAlertItem(BaseModel):
    """Urgent active alert for high/extreme risk locations."""
    alert_id: str = Field(..., description="Unique alert identifier")
    spatial_id: str = Field(..., description="Location identifier")
    station_name: str = Field(..., description="Location / station name")
    district: str = Field(..., description="District")
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    alert_priority: str = Field(..., description="INFORMATION | WATCH | WARNING | CRITICAL")
    final_risk_class: str = Field(..., description="LOW | MODERATE | HIGH | EXTREME")
    flood_probability: float = Field(..., description="ML probability")
    cwc_threshold_status: str = Field(..., description="CWC river stage status")
    decision_reason: str = Field(..., description="Operational justification")
    recommended_action: str = Field(..., description="Recommended mitigation protocol")
    generated_at_utc: datetime = Field(..., description="Alert timestamp")


class RiskAlertsResponse(BaseModel):
    """List of active flood alerts across Uttarakhand."""
    total_active_alerts: int = Field(..., description="Number of active warning/critical alerts")
    critical_alerts_count: int = Field(..., description="Number of CRITICAL priority alerts")
    warning_alerts_count: int = Field(..., description="Number of WARNING priority alerts")
    alerts: List[RiskAlertItem] = Field(default_factory=list, description="List of alert items")


class RiskPolicySchema(BaseModel):
    """Formal, auditable risk policy configuration metadata."""
    version: str = Field("8.1.0", description="Risk policy version")
    title: str = Field("FlashFloodAI Multi-Signal Flood Risk Decision Policy", description="Policy document title")
    standards_authority: str = Field("Central Water Commission (CWC) & Uttarakhand State Disaster Management Authority (USDMA)", description="Governance authority")
    ml_decision_threshold: float = Field(0.40, description="Champion model probability threshold")
    probability_bands: Dict[str, Dict[str, Any]] = Field(..., description="ML probability bands")
    cwc_threshold_rules: Dict[str, Dict[str, Any]] = Field(..., description="Official CWC stage rules")
    environmental_condition_rules: Dict[str, Dict[str, Any]] = Field(..., description="Rainfall/soil thresholds")
    conflict_resolution_matrix: Dict[str, Dict[str, Any]] = Field(..., description="Multi-signal conflict resolution rules")
    recommended_actions_catalog: Dict[str, str] = Field(..., description="Standard operational procedures per risk class")
    alert_priorities_catalog: Dict[str, str] = Field(..., description="Dissemination priority catalog")
