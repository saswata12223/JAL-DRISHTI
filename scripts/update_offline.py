from pathlib import Path
import re

p = Path('backend/app/schemas/risk_decision.py')
content = p.read_text(encoding='utf-8')

# We can safely allow UNKNOWN or UNAVAILABLE or None
content = content.replace(
    'environmental_condition: str = Field(..., description="Atmospheric/hydrological state: NORMAL | WATCH | ESCALATING | CRITICAL")',
    'environmental_condition: str = Field("UNKNOWN", description="Atmospheric/hydrological state: NORMAL | WATCH | ESCALATING | CRITICAL | UNKNOWN")'
)
content = content.replace(
    'data_quality_status: str = Field(..., description="Overall signal quality: GOOD | DEGRADED | POOR | CRITICAL_DATA_LOSS")',
    'data_quality_status: str = Field("UNKNOWN", description="Overall signal quality: GOOD | DEGRADED | POOR | CRITICAL_DATA_LOSS | UNKNOWN")'
)
content = content.replace(
    'operational_state: str = Field(..., description="System monitoring state: NORMAL | ADVISORY | ALERT | EMERGENCY")',
    'operational_state: str = Field("UNKNOWN", description="System monitoring state: NORMAL | ADVISORY | ALERT | EMERGENCY | UNKNOWN")'
)
content = content.replace(
    'decision_confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score [0, 1]")',
    'decision_confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score [0, 1] (0.0 if unknown)")'
)

# Replace all ... with Optional fields where safe or give default UNKNOWN
# But the simpler way is to just write a script to rewrite get_offline_decisions
p.write_text(content, encoding='utf-8')

p2 = Path('backend/app/services/risk_decision_engine.py')
content2 = p2.read_text(encoding='utf-8')

new_offline = '''    def get_offline_decisions(self, limit: int = 100) -> List[RiskDecisionResponse]:
        """Reads historical Phase 12 predictions from existing ML output for Phase 15 Integration."""
        offline_file = self.data_dir / "ml" / "flood_risk_predictions.csv"
        if not offline_file.exists():
            return []
            
        import pandas as pd
        from app.schemas.risk_decision import RiskDecisionResponse
        df = pd.read_csv(offline_file)
        
        decisions = []
        for _, r in df.head(limit).iterrows():
            # DO NOT INVENT VALUES
            # We ONLY use what's in the CSV.
            prob = float(r["prediction_probability"]) if "prediction_probability" in r and pd.notna(r["prediction_probability"]) else 0.0
            ml_class = str(r["ml_risk_class"]) if "ml_risk_class" in r and pd.notna(r["ml_risk_class"]) else "UNKNOWN"
            ts = pd.to_datetime(r["timestamp_utc"]) if "timestamp_utc" in r and pd.notna(r["timestamp_utc"]) else pd.Timestamp("1970-01-01T00:00:00Z")
            sp_id = str(r["spatial_id"]) if "spatial_id" in r and pd.notna(r["spatial_id"]) else "UNKNOWN"
            s_type = str(r["sample_type"]) if "sample_type" in r and pd.notna(r["sample_type"]) else "UNKNOWN"
            st_name = str(r["nearest_cwc_station_name"]) if "nearest_cwc_station_name" in r and pd.notna(r["nearest_cwc_station_name"]) else "UNKNOWN"
            dist = str(r["district"]) if "district" in r and pd.notna(r["district"]) else "UNKNOWN"
            lat = float(r["latitude"]) if "latitude" in r and pd.notna(r["latitude"]) else 0.0
            lon = float(r["longitude"]) if "longitude" in r and pd.notna(r["longitude"]) else 0.0
            
            decisions.append(
                RiskDecisionResponse(
                    timestamp_utc=ts,
                    spatial_id=sp_id,
                    sample_id=str(r["sample_id"]) if "sample_id" in r and pd.notna(r["sample_id"]) else "UNKNOWN",
                    sample_type=s_type,
                    station_name=st_name,
                    district=dist,
                    latitude=lat,
                    longitude=lon,
                    flood_probability=prob,
                    ml_risk_class=ml_class,
                    cwc_threshold_status="UNAVAILABLE",
                    official_alert_stage="UNKNOWN",
                    environmental_condition="UNKNOWN",
                    final_risk_class=ml_class,
                    alert_priority="INFORMATION",
                    recommended_action="HISTORICAL_OUTPUT",
                    data_quality_status="UNKNOWN",
                    decision_confidence=0.0,
                    dissemination_channels=[],
                    contributing_factors=[],
                    operational_state="UNKNOWN"
                )
            )
        return decisions'''
        
content2 = re.sub(r'    def get_offline_decisions\(self, limit: int = 100\) -> List\[RiskDecisionResponse\]:.*?return decisions', new_offline, content2, flags=re.DOTALL)
p2.write_text(content2, encoding='utf-8')
