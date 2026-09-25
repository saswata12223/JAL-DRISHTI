import sys
from pathlib import Path

# Add to risk.py route
risk_api_path = Path('backend/app/api/routes/risk.py')
risk_api = risk_api_path.read_text()

offline_route = '''
@router.get(
    "/offline",
    response_model=APIResponse[List[RiskDecisionResponse]],
    summary="Get Offline Historical ML Outputs",
)
def get_offline_risk_decisions(limit: int = Query(100, ge=1, le=1000)):
    """
    Returns verified Phase 12 ML outputs (historical predictions) for the UI.
    """
    engine = RiskDecisionEngine.get_instance()
    decisions = engine.get_offline_decisions(limit=limit)
    return APIResponse(
        success=True,
        count=len(decisions),
        data=decisions,
    )
'''
if "def get_offline_risk_decisions" not in risk_api:
    risk_api_path.write_text(risk_api + "\n" + offline_route)


# Add get_offline_decisions to risk_decision_engine.py
engine_path = Path('backend/app/services/risk_decision_engine.py')
engine = engine_path.read_text()

offline_func = '''
    def get_offline_decisions(self, limit: int = 100) -> List[RiskDecisionResponse]:
        """Reads historical Phase 12 predictions from existing ML output for Phase 15 Integration."""
        offline_file = self.data_dir / "ml" / "flood_risk_predictions.csv"
        if not offline_file.exists():
            return []
            
        import pandas as pd
        from app.schemas.risk_decision import RiskDecisionResponse
        df = pd.read_csv(offline_file)
        
        decisions = []
        for _, r in df.head(limit).iterrows():
            prob = float(r.get("prediction_probability", 0.0))
            ml_class = str(r.get("ml_risk_class", "LOW"))
            
            # Reconstruct basic decision
            decisions.append(
                RiskDecisionResponse(
                    timestamp_utc=pd.to_datetime(r["timestamp_utc"]) if "timestamp_utc" in r else pd.Timestamp.utcnow(),
                    spatial_id=str(r.get("spatial_id", "UNKNOWN")),
                    sample_id=str(r.get("sample_id", "UNKNOWN")),
                    sample_type=str(r.get("sample_type", "grid_cell")),
                    station_name=str(r.get("nearest_cwc_station_name", r.get("spatial_id", "UNKNOWN"))),
                    district=str(r.get("district", "Unknown")),
                    latitude=float(r.get("latitude", 0.0)),
                    longitude=float(r.get("longitude", 0.0)),
                    flood_probability=prob,
                    ml_risk_class=ml_class,
                    cwc_threshold_status="UNAVAILABLE",
                    official_alert_stage="UNKNOWN",
                    environmental_condition="NORMAL",
                    final_risk_class=ml_class,
                    alert_priority="INFORMATION",
                    recommended_action="Phase 15 - Historical Analysis Only",
                    data_quality_status="GOOD",
                    decision_confidence=1.0,
                    dissemination_channels=[],
                    contributing_factors=[],
                    operational_state="NORMAL"
                )
            )
        return decisions
'''
if "def get_offline_decisions" not in engine:
    # Just append it to the end of the class. It has proper indentation.
    # We will find the end of the file and append it.
    engine_path.write_text(engine + "\n" + offline_func)

print("Updated backend API for Phase 15")
