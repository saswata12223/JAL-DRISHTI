from pathlib import Path
content = '''import pytest
import os
import json
import pandas as pd
import hashlib
from pathlib import Path

class TestPhase15MLUIIntegration:

    def test_csv_row_count_and_classes(self):
        df = pd.read_csv('data/processed/ml/flood_risk_predictions.csv')
        counts = df['ml_risk_class'].value_counts().to_dict()
        assert 'LOW' in counts
        assert 'HIGH' in counts
        assert len(df) > 0

    def test_joblib_hash_integrity(self):
        model_path = Path("data/processed/ml/models/final_flood_risk_model.joblib")
        h = hashlib.sha256()
        with open(model_path, 'rb') as f:
            while chunk := f.read(8192): h.update(chunk)
        assert h.hexdigest().upper() == "A03B3677816825F5A8861ED17A57EF84F6D215D66C2729124B2C3F92C5D07387"

    def test_soi_archive_hash_integrity(self):
        rar_path = Path("data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar")
        if rar_path.exists():
            h = hashlib.sha256()
            with open(rar_path, 'rb') as f:
                while chunk := f.read(8192): h.update(chunk)
            assert h.hexdigest().upper() == "B8325E5D9DD0F04A6663D775363FE38CD2F23BD9DBAE3FB7118B4E6E0CE0BCB7"

    def test_forbidden_terminology(self):
        frontend_dir = Path('frontend/src')
        forbidden_terms = ["Flood Probability", "Probability of Flood", "Chance of Flood", "ML Risk Score"]
        
        for root, _, files in os.walk(frontend_dir):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    content = (Path(root) / file).read_text(encoding='utf-8')
                    for term in forbidden_terms:
                        assert term not in content

    def test_no_legacy_fallback(self):
        frontend_dir = Path('frontend/src')
        for root, _, files in os.walk(frontend_dir):
            for file in files:
                if file.endswith('.jsx') or file.endswith('.js'):
                    content = (Path(root) / file).read_text(encoding='utf-8')
                    # Ensure REFERENCE_DECISIONS_WITH_ACTIONS is either removed or not exported/used.
                    if "REFERENCE_DECISIONS_WITH_ACTIONS" in content:
                        assert "export" not in content or "const REFERENCE_DECISIONS_WITH_ACTIONS" not in content

    def test_dashboard_calls_offline_endpoint(self):
        dash = Path("frontend/src/pages/DashboardPage.jsx").read_text(encoding='utf-8')
        intel = Path("frontend/src/services/modelIntelligenceService.js").read_text(encoding='utf-8')
        assert "getOfflineDecisions" in dash or "modelIntelligenceService" in dash
        assert "getOfflineDecisions" in intel

    def test_landing_page_distinguishes_historical(self):
        strip = Path("frontend/src/components/landing/LiveSituationStrip.jsx").read_text(encoding='utf-8')
        assert "HISTORICAL MODEL OUTPUT" in strip

    def test_backend_live_api_returns_unavailable(self):
        live_api = Path("backend/app/api/routes/live.py").read_text(encoding='utf-8')
        assert '"status": "UNAVAILABLE"' in live_api

    def test_no_fabricated_operational_values(self):
        engine = Path("backend/app/services/risk_decision_engine.py").read_text(encoding='utf-8')
        assert 'environmental_condition="NORMAL"' not in engine
        assert 'decision_confidence=1.0' not in engine'''
Path('tests/test_phase15_ml_ui_integration.py').write_text(content, encoding='utf-8')
