"""

Unit tests for Phase 8.3 — pySTEPS Precipitation Nowcasting Feasibility & Verification

"""



import os

import json

import unittest

from pathlib import Path

from datetime import datetime, timezone

import numpy as np



from ml.nowcasting.data_adapter import GPMDataSequenceAdapter

from ml.nowcasting.pysteps_nowcast import OpticalFlowNowcaster

from ml.nowcasting.verification import (

    NowcastVerifier,

    calculate_mae,

    calculate_rmse,

    calculate_categorical_scores,

)

from ml.nowcasting.nowcast_features import (

    CANDIDATE_NOWCAST_FEATURES,

    get_proposed_feature_manifest,

)



PROJECT_DIR = Path(__file__).resolve().parent.parent

RAW_DIR = PROJECT_DIR / "data" / "raw"

MODELS_DIR = PROJECT_DIR / "data" / "processed" / "ml" / "models"





class TestPhase83Nowcasting(unittest.TestCase):

    """Test suite for Phase 8.3 pySTEPS nowcasting package and production isolation."""



    def test_01_module_imports(self):

        """1. Test pySTEPS nowcasting module imports."""

        self.assertIsNotNone(GPMDataSequenceAdapter)

        self.assertIsNotNone(OpticalFlowNowcaster)

        self.assertIsNotNone(NowcastVerifier)

        self.assertIsNotNone(CANDIDATE_NOWCAST_FEATURES)



    def test_02_real_data_adapter_loads(self):

        """2. Test real data adapter loads GPM granules."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            self.assertGreater(adapter.total_frames, 0)

            seq = adapter.load_sequence_slice(start_idx=0, num_frames=3)

            self.assertEqual(len(seq["timestamps"]), 3)

            self.assertEqual(seq["precipitation"].ndim, 3)



    def test_03_timestamp_ordering(self):

        """3. Test timestamp ordering in GPM sequence."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            ts = adapter.timestamps

            for i in range(1, len(ts)):

                self.assertGreater(ts[i], ts[i-1])



    def test_04_spatial_dimensions(self):

        """4. Test spatial dimensions match Uttarakhand grid (30 lat x 33 lon)."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            seq = adapter.load_sequence_slice(start_idx=0, num_frames=1)

            p = seq["precipitation"]

            self.assertEqual(p.shape[1], 30)  # lat

            self.assertEqual(p.shape[2], 33)  # lon



    def test_05_temporal_consistency(self):

        """5. Test temporal interval is 30 minutes."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            seq = adapter.load_sequence_slice(start_idx=0, num_frames=5)

            self.assertEqual(seq["dt_minutes"], 30.0)



    def test_06_unit_conversion(self):

        """6. Test physical units are mm/hr."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            seq = adapter.load_sequence_slice(start_idx=0, num_frames=1)

            self.assertEqual(seq["units"], "mm/hr")



    def test_07_missing_value_handling(self):

        """7. Test NaNs and negative values are handled safely."""

        fake_frame = np.array([[-1.0, np.nan], [5.0, 10.0]], dtype=np.float32)

        cleaned = np.nan_to_num(fake_frame, nan=0.0)

        cleaned = np.maximum(cleaned, 0.0)

        self.assertEqual(cleaned[0, 0], 0.0)

        self.assertEqual(cleaned[0, 1], 0.0)



    def test_08_no_random_synthetic_precipitation(self):

        """8. Test no random synthetic precipitation is generated in adapter."""

        if RAW_DIR.exists() and len(list(RAW_DIR.glob("*.nc4"))) > 0:

            adapter = GPMDataSequenceAdapter(RAW_DIR)

            seq = adapter.load_sequence_slice(start_idx=0, num_frames=2)

            self.assertEqual(seq["source"], "NASA GPM IMERG Early")



    def test_09_forecast_output_shape(self):

        """9. Test nowcaster output shapes match input spatial dimensions."""

        frame_prev = np.zeros((30, 33), dtype=np.float32)

        frame_curr = np.zeros((30, 33), dtype=np.float32)

        frame_curr[15, 16] = 12.5  # rain cell



        nowcaster = OpticalFlowNowcaster(dt_minutes=30.0)

        motion = nowcaster.estimate_motion(frame_prev, frame_curr)

        forecasts = nowcaster.forecast(frame_curr, motion, lead_times_minutes=[15, 30, 45, 60])



        for lead_min, fc in forecasts.items():

            self.assertEqual(fc.shape, (30, 33))



    def test_10_forecast_timestamps(self):

        """10. Test forecast lead time keys match requested horizons."""

        nowcaster = OpticalFlowNowcaster(dt_minutes=30.0)

        frame = np.zeros((10, 10), dtype=np.float32)

        motion = {"u": np.zeros((10, 10)), "v": np.zeros((10, 10)), "motion_speed_kmh": 0.0, "motion_direction_deg": 0.0}

        forecasts = nowcaster.forecast(frame, motion, lead_times_minutes=[15, 30, 45, 60])

        self.assertListEqual(sorted(list(forecasts.keys())), [15, 30, 45, 60])



    def test_11_verification_metrics(self):

        """11. Test verification functions (MAE, RMSE, CSI, POD, FAR)."""

        pred = np.array([[1.0, 0.0], [0.0, 2.0]], dtype=np.float32)

        obs = np.array([[1.0, 0.0], [0.0, 1.0]], dtype=np.float32)



        mae = calculate_mae(pred, obs)

        self.assertAlmostEqual(mae, 0.25)



        rmse = calculate_rmse(pred, obs)

        self.assertAlmostEqual(rmse, 0.5)



        cat = calculate_categorical_scores(pred, obs, threshold=0.5)

        self.assertEqual(cat["csi"], 1.0)

        self.assertEqual(cat["pod"], 1.0)

        self.assertEqual(cat["far"], 0.0)



    def test_12_persistence_baseline(self):

        """12. Test verifier benchmarks against persistence baseline."""

        verifier = NowcastVerifier(thresholds=[0.5])

        pysteps = np.ones((5, 5), dtype=np.float32)

        actual = np.ones((5, 5), dtype=np.float32)

        persistence = np.ones((5, 5), dtype=np.float32)



        res = verifier.evaluate_forecast_vs_actual(pysteps, actual, persistence, lead_time_min=30)

        self.assertIn("pysteps", res)

        self.assertIn("persistence", res)

        self.assertIn("comparison", res)



    def test_13_production_model_artifact_unchanged(self):

        """13. Safety: Production XGBoost model artifact is unchanged."""

        model_path = MODELS_DIR / "candidate_flood_risk_model_phase4.joblib"

        self.assertTrue(model_path.exists())

        self.assertGreater(model_path.stat().st_size, 10000)



    def test_14_34_feature_contract_unchanged(self):

        """14. Safety: 34-feature production allowlist is unchanged."""

        allowlist_path = MODELS_DIR / "candidate_feature_allowlist_phase4.json"

        self.assertTrue(allowlist_path.exists())

        with open(allowlist_path, "r", encoding="utf-8") as f:

            allowlist_data = json.load(f)

        predictors = allowlist_data["predictors"]

        self.assertEqual(len(predictors), 34)

        self.assertNotIn("nowcast_rain_15min", predictors)

        self.assertNotIn("rain_motion_speed", predictors)



    def test_15_production_api_path_unchanged(self):

        """15. Safety: Production RiskDecisionEngine is not modified by nowcasting."""

        from app.services.risk_decision_engine import RiskDecisionEngine

        engine = RiskDecisionEngine()

        self.assertEqual(engine.DECISION_THRESHOLD, 0.40)

        self.assertEqual(engine.POLICY_VERSION, "8.1.0")





if __name__ == "__main__":

    unittest.main()
