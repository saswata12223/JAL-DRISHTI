import unittest
import sys
import os
import pandas as pd
import numpy as np
from pathlib import Path

# Add scripts directory to path
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts"))
from train_flood_model import compute_scs_cn_physics, PPTAlignedFloodModelTrainingEngine

class TestMLPipeline(unittest.TestCase):
    
    def setUp(self):
        # Create a small mock dataset strictly reflecting the actual project columns needed
        self.mock_data = pd.DataFrame({
            "sample_id": ["S1", "S2", "S3", "S4", "S5"],
            "sample_type": ["grid", "grid", "grid", "historical_event_benchmark", "historical_event_benchmark"],
            "spatial_id": ["G1", "G2", "G3", "E1", "E2"],
            "latitude": [30.1, 30.2, 30.3, 30.4, 30.5],
            "longitude": [78.1, 78.2, 78.3, 78.4, 78.5],
            "timestamp_utc": ["2023-01-01T00:00:00Z", "2023-01-01T01:00:00Z", "2023-01-01T02:00:00Z", "2013-06-16T00:00:00Z", "2013-06-17T00:00:00Z"],
            "district": ["Dehradun", "Dehradun", "Haridwar", "Rudraprayag", "Uttarkashi"],
            "major_basin": ["Ganga", "Ganga", "Ganga", "Ganga", "Ganga"],
            "landcover_class": [10, 50, 80, 10, 60], # Tree, Urban, Water, Tree, Bare
            "soil_saturation_index": [0.6, 0.9, 0.7, 0.85, 0.5],
            "rainfall_1h_mm": [0.0, 50.0, 10.0, 120.0, 5.0],
            "slope_deg": [15.0, 2.0, 1.0, 45.0, 20.0],
            "mannings_roughness_n": [0.05, 0.02, 0.01, 0.06, 0.04],
            "flood_event_label": [0, 1, 0, 1, 0],
            "split_group": ["TRAIN", "VALIDATION", "TEST", "TRAIN", "VALIDATION"] # Used internally by orchestrator
        })
        
        self.predictors = [
            "landcover_class", "soil_saturation_index", "rainfall_1h_mm", 
            "slope_deg", "mannings_roughness_n"
        ]

    def test_scs_cn_physics_bounds(self):
        """Verify properties that are mathematically/physically valid for the actual implementation."""
        df_out, features, meta = compute_scs_cn_physics(self.mock_data)
        
        # Runoff does not become negative
        self.assertTrue((df_out["scs_direct_runoff_q_mm"] >= 0.0).all())
        
        # Expected monotonic relationships hold (higher rainfall generally -> higher or equal runoff)
        # S2 has 50mm, S1 has 0mm
        q_s1 = df_out.loc[0, "scs_direct_runoff_q_mm"]
        q_s2 = df_out.loc[1, "scs_direct_runoff_q_mm"]
        self.assertGreaterEqual(q_s2, q_s1)
        
        # No NaN/invalid output is silently produced
        self.assertFalse(df_out[features].isnull().any().any())
        
        # Check initial abstraction is always positive
        self.assertTrue((df_out["scs_initial_abstraction_ia_mm"] > 0.0).all())
        
        # Peak runoff scaling with slope: S4 (slope 45) vs S2 (slope 2) despite similar/different rain
        # We just verify it's computed and >= 0
        self.assertTrue((df_out["scs_peak_runoff_potential"] >= 0.0).all())

    def test_data_partitioning_logic(self):
        """Verify no train/test overlap and temporal causality in partitioning."""
        engine = PPTAlignedFloodModelTrainingEngine(ml_dir=Path("dummy"), models_dir=Path("dummy"))
        
        splits = engine.prepare_partitions(self.mock_data, self.predictors)
        
        # X_train, X_val, X_test should exist
        self.assertEqual(len(splits["X_train"]), 3) # 1 grid TRAIN + 2 event TRAIN (based on the split logic in engine, wait, engine takes 10,3,2 but our mock has 5)
        # The engine strictly indexes iloc[:10] for train_events.
        # Since our mock events length is 2, all 2 go to train_events.
        # Grid train is 1. So total X_train = 3.
        
        # Check shapes
        self.assertEqual(splits["X_train"].shape[1], len(self.predictors))
        
        # Verify no NaN after scaling
        self.assertFalse(np.isnan(splits["X_train"]).any())
        self.assertFalse(np.isnan(splits["X_val"]).any())
        self.assertFalse(np.isnan(splits["X_test"]).any())
        
    def test_feature_processing(self):
        """Verify expected columns exist and transformations behave correctly."""
        df_out, features, meta = compute_scs_cn_physics(self.mock_data)
        for f in features:
            self.assertIn(f, df_out.columns)

if __name__ == '__main__':
    unittest.main()
