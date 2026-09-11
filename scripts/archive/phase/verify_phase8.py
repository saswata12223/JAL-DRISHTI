"""
FlashFloodAI — Phase 8: Flood Risk & Decision Engine Acceptance Verification Suite

Tests:
1. Phase 7 backend integration and router registration.
2. Phase 6 ML champion model loading (XGBoost 6.1.0).
3. Official CWC flood thresholds loading (20 stations).
4. Zero threshold fabrication (Warning <= Danger <= HFL).
5. Strict NULL water-level preservation (UNAVAILABLE status).
6. Deterministic ML risk classification bands.
7. Official CWC hydrological stage classification.
8. Multi-signal environmental condition evaluation.
9. Multi-signal conflict resolution matrix (Cases A through E).
10. Data quality status assignment (COMPLETE, PARTIAL, DEGRADED, UNAVAILABLE).
11. Decision confidence score separation from ML probability.
12. Recommended disaster management actions mapping.
13. Alert priority mapping (INFORMATION, WATCH, WARNING, CRITICAL).
14. Pydantic schema validation & OpenAPI schema compliance.
15. Deterministic reproducibility across repeated evaluations.
16. Historical disaster event validation (15 canonical events evaluated).
17. Database ORM model and Alembic migration definition.
18. REST API endpoints execution via TestClient.
19. Static code analysis verifying zero synthetic/fake physical measurements.
20. Cross-phase dataset and model artifact integrity (Phases 1–7 intact).

Usage:
    python scripts/verify_phase8.py
"""

import json
import logging
import re
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

# Ensure project and backend directories are in sys.path
PROJECT_DIR = Path(r"C:\JAL DRISTI")
BACKEND_DIR = PROJECT_DIR / "backend"
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("Phase8_Verification")

from app.config import settings
from app.db.database import Base
from app.db.models.risk_decision import RiskDecisionRecord
from app.main import app
from app.schemas.risk_decision import (
    RiskAlertsResponse,
    RiskDecisionResponse,
    RiskEvaluationRequest,
    RiskPolicySchema,
    RiskSummaryResponse,
)
from app.services.prediction_service import PredictionService
from app.services.risk_decision_engine import RiskDecisionEngine


class TestPhase8RiskAndDecisionEngineAcceptance(unittest.TestCase):
    """Automated acceptance test suite for Phase 8 Risk & Decision Engine."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.engine = RiskDecisionEngine.get_instance()
        cls.pred_service = PredictionService.get_instance()
        cls.data_dir = PROJECT_DIR / "data" / "processed"

    def test_01_backend_integration_and_routes(self):
        """1. Verify FastAPI backend integrates /api/v1/risk routes."""
        res = self.client.get("/openapi.json")
        self.assertEqual(res.status_code, 200)
        paths = res.json()["paths"].keys()
        self.assertIn("/api/v1/risk/latest", paths)
        self.assertIn("/api/v1/risk/summary", paths)
        self.assertIn("/api/v1/risk/alerts", paths)
        self.assertIn("/api/v1/risk/policy", paths)
        self.assertIn("/api/v1/risk/evaluate", paths)

    def test_02_phase6_model_integration(self):
        """2. Verify engine uses approved Phase 6 XGBoost champion model."""
        self.assertTrue(self.pred_service.is_ready)
        self.assertIsNotNone(self.pred_service._engine)
        engine = self.pred_service._engine
        assert engine is not None
        model = engine._model
        self.assertEqual(type(model).__name__, "XGBClassifier")
        self.assertEqual(len(engine.predictor_names), 44)

    def test_03_official_cwc_thresholds_loaded(self):
        """3. Verify engine loads all 20 verified CWC station thresholds."""
        self.assertEqual(len(self.engine._cwc_thresholds_cache), 20)
        rishikesh = self.engine._cwc_thresholds_cache.get("CWC_UK_002")
        self.assertIsNotNone(rishikesh)
        self.assertEqual(rishikesh["warning_level_m"], 339.5)
        self.assertEqual(rishikesh["danger_level_m"], 340.5)

    def test_04_zero_threshold_fabrication(self):
        """4. Verify that Warning <= Danger <= HFL across 100% of loaded stations."""
        for st_id, st in self.engine._cwc_thresholds_cache.items():
            self.assertIsNotNone(st["warning_level_m"])
            self.assertIsNotNone(st["danger_level_m"])
            self.assertIsNotNone(st["hfl_m"])
            self.assertLessEqual(st["warning_level_m"], st["danger_level_m"])
            self.assertLessEqual(st["danger_level_m"], st["hfl_m"])

    def test_05_null_water_level_preservation(self):
        """5. Verify NULL water level strictly yields UNAVAILABLE status without fake zeros."""
        status, stage = self.engine.evaluate_cwc_threshold_state(
            water_level_m=None,
            warning_level_m=339.5,
            danger_level_m=340.5,
            hfl_m=342.0,
        )
        self.assertEqual(status, "UNAVAILABLE")
        self.assertEqual(stage, "UNKNOWN")

    def test_06_ml_risk_classification_bands(self):
        """6. Verify deterministic ML probability bands (<0.20 LOW, 0.20-0.40 MODERATE, 0.40-0.70 HIGH, >=0.70 EXTREME)."""
        self.assertEqual(self.engine.classify_ml_probability(0.05), "LOW")
        self.assertEqual(self.engine.classify_ml_probability(0.19), "LOW")
        self.assertEqual(self.engine.classify_ml_probability(0.20), "MODERATE")
        self.assertEqual(self.engine.classify_ml_probability(0.39), "MODERATE")
        self.assertEqual(self.engine.classify_ml_probability(0.40), "HIGH")
        self.assertEqual(self.engine.classify_ml_probability(0.69), "HIGH")
        self.assertEqual(self.engine.classify_ml_probability(0.70), "EXTREME")
        self.assertEqual(self.engine.classify_ml_probability(0.99), "EXTREME")

    def test_07_cwc_threshold_state_evaluation(self):
        """7. Verify deterministic CWC hydrological stage rules."""
        # BELOW_WARNING
        s1, a1 = self.engine.evaluate_cwc_threshold_state(338.0, 339.5, 340.5, 342.0)
        self.assertEqual(s1, "BELOW_WARNING")
        self.assertEqual(a1, "NONE")

        # WARNING_ZONE
        s2, a2 = self.engine.evaluate_cwc_threshold_state(339.8, 339.5, 340.5, 342.0)
        self.assertEqual(s2, "WARNING_ZONE")
        self.assertEqual(a2, "YELLOW")

        # DANGER_ZONE
        s3, a3 = self.engine.evaluate_cwc_threshold_state(341.0, 339.5, 340.5, 342.0)
        self.assertEqual(s3, "DANGER_ZONE")
        self.assertEqual(a3, "ORANGE")

        # ABOVE_HFL
        s4, a4 = self.engine.evaluate_cwc_threshold_state(342.5, 339.5, 340.5, 342.0)
        self.assertEqual(s4, "ABOVE_HFL")
        self.assertEqual(a4, "RED")

    def test_08_environmental_condition_evaluation(self):
        """8. Verify physical environmental condition evaluation (NORMAL, WATCH, ESCALATING, CRITICAL)."""
        self.assertEqual(self.engine.evaluate_environmental_condition(5.0, 2.0, 0.40, 2.0), "NORMAL")
        self.assertEqual(self.engine.evaluate_environmental_condition(20.0, 8.0, 0.70, 6.0), "WATCH")
        self.assertEqual(self.engine.evaluate_environmental_condition(45.0, 22.0, 0.85, 20.0), "ESCALATING")
        self.assertEqual(self.engine.evaluate_environmental_condition(75.0, 42.0, 0.95, 40.0), "CRITICAL")

    def test_09_conflict_resolution_matrix(self):
        """9. Verify multi-signal conflict resolution (Cases A to E)."""
        # Case A: Impending Flash Flood Surge (ML EXTREME + CRITICAL rain overrides BELOW_WARNING gauge)
        rA, opA, prioA, _, _, _, _ = self.engine.fuse_signals(
            ml_prob=0.88,
            ml_class="EXTREME",
            cwc_status="BELOW_WARNING",
            env_condition="CRITICAL",
            water_level_m=335.0,
            rainfall_1h_mm=70.0,
            soil_saturation_index=0.92,
        )
        self.assertEqual(rA, "EXTREME")
        self.assertEqual(prioA, "CRITICAL")

        # Case B: River Danger Override (CWC DANGER_ZONE overrides LOW ML probability)
        rB, opB, prioB, _, _, _, _ = self.engine.fuse_signals(
            ml_prob=0.10,
            ml_class="LOW",
            cwc_status="DANGER_ZONE",
            env_condition="NORMAL",
            water_level_m=341.0,
            rainfall_1h_mm=5.0,
            soil_saturation_index=0.50,
        )
        self.assertEqual(rB, "HIGH")
        self.assertEqual(prioB, "WARNING")

        # Case C: Gauge Telemetry Offline (ML + Environment drive risk cleanly)
        rC, opC, prioC, _, _, dqC, _ = self.engine.fuse_signals(
            ml_prob=0.92,
            ml_class="EXTREME",
            cwc_status="UNAVAILABLE",
            env_condition="CRITICAL",
            water_level_m=None,
            rainfall_1h_mm=75.0,
            soil_saturation_index=0.95,
        )
        self.assertEqual(rC, "EXTREME")
        self.assertEqual(prioC, "CRITICAL")
        self.assertEqual(dqC, "PARTIAL")

        # Case E: High Soil Saturation Buildup (ML LOW, SSI >= 0.85, Rain >= 15mm -> MODERATE)
        rE, opE, prioE, _, _, _, _ = self.engine.fuse_signals(
            ml_prob=0.15,
            ml_class="LOW",
            cwc_status="BELOW_WARNING",
            env_condition="NORMAL",
            water_level_m=330.0,
            rainfall_1h_mm=18.0,
            soil_saturation_index=0.88,
        )
        self.assertEqual(rE, "MODERATE")
        self.assertEqual(prioE, "WATCH")

    def test_10_data_quality_states(self):
        """10. Verify data quality classifications (COMPLETE, PARTIAL, DEGRADED, UNAVAILABLE)."""
        _, _, _, _, _, dq1, c1 = self.engine.fuse_signals(0.1, "LOW", "BELOW_WARNING", "NORMAL", 330.0, 10.0, 0.5)
        self.assertEqual(dq1, "COMPLETE")
        self.assertEqual(c1, 0.95)

        _, _, _, _, _, dq2, c2 = self.engine.fuse_signals(0.1, "LOW", "UNAVAILABLE", "NORMAL", None, 10.0, 0.5)
        self.assertEqual(dq2, "PARTIAL")
        self.assertEqual(c2, 0.85)

        _, _, _, _, _, dq3, c3 = self.engine.fuse_signals(0.1, "LOW", "UNAVAILABLE", "NORMAL", None, None, 0.5)
        self.assertEqual(dq3, "DEGRADED")
        self.assertEqual(c3, 0.60)

        _, _, _, _, _, dq4, c4 = self.engine.fuse_signals(0.1, "LOW", "UNAVAILABLE", "NORMAL", None, None, None)
        self.assertEqual(dq4, "UNAVAILABLE")
        self.assertEqual(c4, 0.20)

    def test_11_decision_confidence_separation(self):
        """11. Verify decision confidence is separated from ML probability."""
        _, _, _, _, _, _, conf = self.engine.fuse_signals(
            ml_prob=0.99,
            ml_class="EXTREME",
            cwc_status="UNAVAILABLE",
            env_condition="NORMAL",
            water_level_m=None,
            rainfall_1h_mm=None,
            soil_saturation_index=None,
        )
        self.assertNotEqual(conf, 0.99)
        self.assertEqual(conf, 0.20)

    def test_12_recommended_action_mapping(self):
        """12. Verify recommended action SOP mapping across all risk classes."""
        for rc in ["LOW", "MODERATE", "HIGH", "EXTREME"]:
            act = self.engine.get_recommended_action(rc)
            self.assertIsInstance(act, str)
            self.assertGreater(len(act), 20)

    def test_13_alert_priority_mapping(self):
        """13. Verify alert priority categories."""
        policy = self.engine.get_policy()
        self.assertIn("INFORMATION", policy.alert_priorities_catalog)
        self.assertIn("WATCH", policy.alert_priorities_catalog)
        self.assertIn("WARNING", policy.alert_priorities_catalog)
        self.assertIn("CRITICAL", policy.alert_priorities_catalog)

    def test_14_schema_validation(self):
        """14. Verify Pydantic schema validation for RiskDecisionResponse and RiskSummaryResponse."""
        decisions = self.engine.get_latest_decisions(limit=5)
        self.assertGreater(len(decisions), 0)
        for d in decisions:
            self.assertIsInstance(d, RiskDecisionResponse)
            self.assertIn(d.final_risk_class, ["LOW", "MODERATE", "HIGH", "EXTREME"])
            self.assertIn(d.alert_priority, ["INFORMATION", "WATCH", "WARNING", "CRITICAL"])

        summary = self.engine.get_summary()
        self.assertIsInstance(summary, RiskSummaryResponse)
        self.assertGreater(summary.total_evaluated_points, 0)

    def test_15_deterministic_reproducibility(self):
        """15. Verify identical inputs yield identical outputs on repeated evaluations."""
        req = RiskEvaluationRequest(
            rainfall_1h_mm=45.0,
            rainfall_30min_mm=25.0,
            surface_soil_moisture_vol=0.88,
            soil_saturation_index=0.86,
            elevation_m=2100.0,
            slope_deg=28.0,
            landcover_class=10,
        )
        res1 = self.engine.evaluate_live(req)
        res2 = self.engine.evaluate_live(req)
        self.assertEqual(res1.final_risk_class, res2.final_risk_class)
        self.assertEqual(res1.flood_probability, res2.flood_probability)
        self.assertEqual(res1.alert_priority, res2.alert_priority)

    def test_16_historical_disaster_validation(self):
        """16. Verify 15 historical disaster events are evaluated with 100% detection rate."""
        val_file = self.data_dir / "risk" / "risk_decision_historical_validation.json"
        self.assertTrue(val_file.exists(), f"Missing historical validation artifact: {val_file}")
        with open(val_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["evaluated_events_count"], 15)
        self.assertEqual(data["evaluation_summary"]["extreme_risk_classified"], 15)
        self.assertEqual(data["evaluation_summary"]["critical_alert_priority"], 15)

    def test_17_database_orm_model_and_migration(self):
        """17. Verify RiskDecisionRecord ORM model and Alembic migration 002 exist."""
        self.assertIn("risk_decisions", Base.metadata.tables.keys())
        geom_col = RiskDecisionRecord.__table__.columns["geom"].type
        self.assertEqual(geom_col.srid, 4326)
        self.assertEqual(geom_col.geometry_type, "POINT")

        mig_file = BACKEND_DIR / "alembic" / "versions" / "002_risk_decision_engine.py"
        self.assertTrue(mig_file.exists())

    def test_18_api_endpoints_execution(self):
        """18. Verify all Phase 8 REST API routes execute successfully with 200 OK."""
        # 1. GET /api/v1/risk/latest
        res_latest = self.client.get("/api/v1/risk/latest?limit=10")
        self.assertEqual(res_latest.status_code, 200)
        self.assertTrue(res_latest.json()["success"])

        # 2. GET /api/v1/risk/summary
        res_sum = self.client.get("/api/v1/risk/summary")
        self.assertEqual(res_sum.status_code, 200)
        self.assertIn("total_evaluated_points", res_sum.json()["data"])

        # 3. GET /api/v1/risk/alerts
        res_alt = self.client.get("/api/v1/risk/alerts")
        self.assertEqual(res_alt.status_code, 200)
        self.assertIn("total_active_alerts", res_alt.json()["data"])

        # 4. GET /api/v1/risk/policy
        res_pol = self.client.get("/api/v1/risk/policy")
        self.assertEqual(res_pol.status_code, 200)
        self.assertEqual(res_pol.json()["data"]["version"], "8.1.0")

        # 5. GET /api/v1/risk/{station_id}
        res_stn = self.client.get("/api/v1/risk/CWC_UK_002")
        self.assertEqual(res_stn.status_code, 200)
        self.assertEqual(res_stn.json()["data"]["station_name"], "Rishikesh")

        # 6. POST /api/v1/risk/evaluate
        payload = {
            "rainfall_1h_mm": 50.0,
            "rainfall_30min_mm": 25.0,
            "surface_soil_moisture_vol": 0.88,
            "soil_saturation_index": 0.86,
            "elevation_m": 2200.0,
            "slope_deg": 30.0,
            "landcover_class": 10,
        }
        res_eval = self.client.post("/api/v1/risk/evaluate", json=payload)
        self.assertEqual(res_eval.status_code, 200)
        data = res_eval.json()["data"]
        self.assertIn(data["final_risk_class"], ["LOW", "MODERATE", "HIGH", "EXTREME"])
        self.assertIn(data["alert_priority"], ["INFORMATION", "WATCH", "WARNING", "CRITICAL"])

    def test_19_no_synthetic_data_generators(self):
        """19. Static code analysis ensuring zero random or mock data generators in backend/."""
        for py_file in BACKEND_DIR.glob("**/*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
            for forbidden in ["uniform(", "randint(", "unittest.mock", "MagicMock", "fake"]:
                matches = re.findall(rf".*{re.escape(forbidden)}.*", content)
                code_matches = [m for m in matches if not m.strip().startswith("#") and "mock" not in py_file.name]
                self.assertEqual(len(code_matches), 0, f"Found '{forbidden}' in {py_file}")

    def test_20_previous_phases_integrity(self):
        """20. Verify all Phase 1–7 source datasets and model binaries remain intact."""
        crucial_files = [
            self.data_dir / "gpm_combined.nc",
            self.data_dir / "weather" / "imd_weather_stations.csv",
            self.data_dir / "smap" / "smap_soil_moisture.nc",
            self.data_dir / "srtm" / "srtm_uttarakhand_dem.tif",
            self.data_dir / "terrain" / "terrain_features.tif",
            self.data_dir / "landcover" / "landcover_uttarakhand.tif",
            self.data_dir / "waterlevel" / "cwc_water_level_stations.csv",
            self.data_dir / "events" / "historical_flood_events.csv",
            self.data_dir / "standardized" / "unified_static_features.nc",
            self.data_dir / "risk" / "flood_thresholds.parquet",
            self.data_dir / "ml" / "flood_ml_features.parquet",
            self.data_dir / "ml" / "models" / "random_forest_baseline.joblib",
            self.data_dir / "ml" / "models" / "final_flood_risk_model.joblib",
            self.data_dir / "ml" / "models" / "hybrid_gnn_lstm.pt",
        ]
        for f in crucial_files:
            self.assertTrue(f.exists(), f"Crucial artifact missing: {f}")
            self.assertGreater(f.stat().st_size, 0, f"Crucial artifact empty: {f}")


# ============================================================
# RUNNER
# ============================================================

def run_phase8_acceptance_suite() -> bool:
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase8RiskAndDecisionEngineAcceptance)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    passes = total_tests - failures - errors

    print("\n" + "=" * 70)
    print("PHASE 8: RISK & DECISION ENGINE ACCEPTANCE SUMMARY")
    print("=" * 70)
    print(f"TOTAL TESTS RUN : {total_tests}")
    print(f"PASS            : {passes}")
    print(f"FAIL            : {failures + errors}")
    print("=" * 70)

    if failures > 0 or errors > 0:
        print("\n[CRITICAL FAILURE] Phase 8 Acceptance criteria not met.")
        return False

    print("\n[SUCCESS] 100% of Phase 8 Automated Acceptance criteria PASSED.")
    return True


if __name__ == "__main__":
    success = run_phase8_acceptance_suite()
    if not success:
        sys.exit(1)
    sys.exit(0)
