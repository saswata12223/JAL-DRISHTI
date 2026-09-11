"""
FlashFloodAI — Cross-Module End-to-End Integration Test Suite
"""

import sys
import unittest
from pathlib import Path
import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parent.parent
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from ml.inference import FloodRiskInferenceEngine


class TestFlashFloodAIEndToEndIntegration(unittest.TestCase):
    """Verifies that all modular pipelines, data layers, and ML inference wrappers work harmoniously."""

    def test_01_all_top_level_directories_exist(self):
        """Verify presence of all standardized top-level modules."""
        for module in ["backend", "frontend", "ml", "pipelines", "hardware", "visualization", "docs", "tests", "scripts", "data"]:
            mod_path = PROJECT_DIR / module
            self.assertTrue(mod_path.exists(), f"Missing top-level module directory: {module}")

    def test_02_all_readme_documents_exist(self):
        """Verify presence of all standardized README and documentation artifacts."""
        readmes = [
            PROJECT_DIR / "docs" / "PROJECT_STRUCTURE.md" if (PROJECT_DIR / "docs" / "PROJECT_STRUCTURE.md").exists() else PROJECT_DIR / "PROJECT_STRUCTURE.md",
            PROJECT_DIR / "CONTRIBUTING.md",
            PROJECT_DIR / "README.md",
            PROJECT_DIR / "backend" / "README.md",
            PROJECT_DIR / "frontend" / "README.md",
            PROJECT_DIR / "ml" / "README.md",
            PROJECT_DIR / "pipelines" / "README.md",
            PROJECT_DIR / "hardware" / "README.md",
            PROJECT_DIR / "visualization" / "README.md",
            PROJECT_DIR / "docs" / "architecture" / "README.md",
            PROJECT_DIR / "tests" / "README.md",
        ]
        for r in readmes:
            self.assertTrue(r.exists(), f"Missing README or structure document: {r}")
            self.assertGreater(r.stat().st_size, 100, f"README too short: {r}")

    def test_03_ml_inference_engine_single_sample(self):
        """Verify that ml.inference.FloodRiskInferenceEngine loads and scores sample."""
        engine = FloodRiskInferenceEngine()
        sample = {
            "surface_soil_moisture_vol": 0.90,
            "profile_soil_moisture_vol": 0.88,
            "soil_saturation_index": 0.89,
            "antecedent_precipitation_index_mm": 55.0,
            "rainfall_30min_mm": 20.0,
            "rainfall_1h_mm": 45.0,
            "slope_deg": 32.0,
            "flash_flood_susceptibility_index": 0.50,
        }
        res = engine.predict_sample(sample)
        self.assertIn("probability", res)
        self.assertIn("risk_class", res)
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)
        self.assertIn(res["risk_class"], ["LOW", "MODERATE", "HIGH", "EXTREME"])

    def test_04_ml_inference_engine_batch_prediction(self):
        """Verify batch inference on Phase 5 feature dataset."""
        engine = FloodRiskInferenceEngine()
        df = pd.read_parquet(PROJECT_DIR / "data" / "processed" / "ml" / "flood_ml_features.parquet").head(10)
        res_df = engine.predict_batch(df)
        self.assertEqual(len(res_df), 10)
        self.assertIn("prediction_probability", res_df.columns)
        self.assertIn("ml_risk_class", res_df.columns)


if __name__ == "__main__":
    unittest.main()
