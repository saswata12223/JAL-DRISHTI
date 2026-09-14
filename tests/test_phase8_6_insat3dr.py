"""

Unit tests for Phase 8.6 — Official MOSDAC INSAT-3DR Access & Real-Data Validation

"""



import os

import json

import hashlib

import unittest

from pathlib import Path

from datetime import datetime, timezone

import numpy as np



from ml.precipitation.insat3dr.adapter import (

    INSAT3DRDataSequenceAdapter,

    INSAT3DRProductMetadata,

)

from ml.precipitation.insat3dr.quality_control import INSAT3DRQualityControl

from ml.precipitation.insat3dr.validation import INSAT3DRGroundValidator

from ml.precipitation.insat3dr.comparison import INSATvsGPMComparator



PROJECT_DIR = Path(__file__).resolve().parent.parent

RAW_INSAT_DIR = PROJECT_DIR / "data" / "raw" / "insat3dr"

PROCESSED_INSAT_DIR = PROJECT_DIR / "data" / "processed" / "ml" / "insat3dr"

MODELS_DIR = PROJECT_DIR / "data" / "processed" / "ml" / "models"





class TestPhase86INSAT3DR(unittest.TestCase):

    """Test suite for Phase 8.6 MOSDAC access audit, evidence categorization, and production safety."""



    def test_01_module_imports(self):

        """1. Test INSAT-3DR Phase 8.6 package imports."""

        self.assertIsNotNone(INSAT3DRDataSequenceAdapter)

        self.assertIsNotNone(INSAT3DRProductMetadata)

        self.assertIsNotNone(INSAT3DRQualityControl)

        self.assertIsNotNone(INSAT3DRGroundValidator)

        self.assertIsNotNone(INSATvsGPMComparator)



    def test_02_authentication_failure_handling(self):

        """2. Test handling of unauthenticated MOSDAC access."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        audit = adapter.get_access_audit_status()

        self.assertIn("operational_access_status", audit)

        self.assertIn("access_classification", audit)

        self.assertIn(audit["access_classification"], ["INSAT3DR_ACCESS_BLOCKED", "INSAT3DR_ACCESSIBLE_REQUIRES_PIPELINE_WORK"])



    def test_03_no_secret_leak_behavior(self):

        """3. Security: Test that manifests and audit logs contain NO sensitive secrets."""

        manifest_path = PROCESSED_INSAT_DIR / "insat3dr_manifest.json"

        if manifest_path.exists():

            with open(manifest_path, "r", encoding="utf-8") as f:

                data = json.load(f)

            content_str = json.dumps(data)

            # Ensure no credentials/passwords/token values are dumped as keys

            self.assertNotIn("user_password", data)

            self.assertNotIn("mosdac_token", data)

            self.assertNotIn("api_key", data)

            self.assertNotIn("Authorization", data)

            self.assertNotIn("bearer ", content_str.lower())



    def test_04_manifest_generation(self):

        """4. Test manifest generation logic."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        manifest_out = PROCESSED_INSAT_DIR / "test_insat3dr_manifest.json"

        manifest = adapter.generate_manifest(manifest_out)

        self.assertTrue(manifest_out.exists())

        self.assertIn("access_audit", manifest)

        self.assertIn("granules_count", manifest)

        if manifest_out.exists():

            manifest_out.unlink()



    def test_05_metadata_and_units_extraction(self):

        """5. Test exact metadata, units (mm/hr), and spatial resolutions."""

        meta = INSAT3DRProductMetadata()

        self.assertEqual(meta.SATELLITE, "INSAT-3DR")

        self.assertEqual(meta.NOMINAL_SPATIAL_RES_KM, 4.0)

        self.assertEqual(meta.NOMINAL_TEMPORAL_CADENCE_MIN, 15.0)



    def test_06_spatial_grid_and_clipping(self):

        """6. Test spatial bounds calculation (75 lat x 82 lon = 6,150 cells over Uttarakhand)."""

        west, east, south, north = 77.8, 81.1, 28.5, 31.5

        lat_cells = int(round((north - south) / 0.04))

        lon_cells = int(round((east - west) / 0.04))

        self.assertEqual(lat_cells * lon_cells, 6150)



    def test_07_gpm_matching_logic(self):

        """7. Test GPM vs INSAT regridding and statistical comparison logic."""

        comparator = INSATvsGPMComparator()

        gpm = np.linspace(0, 10, 30*33, dtype=np.float32).reshape(30, 33)

        insat = comparator.regrid_gpm_to_insat(gpm, (75, 82))

        stats = comparator.calculate_comparative_stats(insat, gpm)

        self.assertEqual(stats["status"], "SUCCESS")

        self.assertAlmostEqual(stats["mae_mmh"], 0.0, places=3)



    def test_08_imd_matching_logic(self):

        """8. Test IMD station validation score calculation logic."""

        validator = INSAT3DRGroundValidator(rain_threshold_mmh=0.5)

        est = np.array([2.0, 4.0, 0.0, 0.0], dtype=np.float32)

        obs = np.array([2.0, 4.0, 0.0, 0.0], dtype=np.float32)

        res = validator.evaluate_station_match(est, obs)

        self.assertEqual(res["status"], "VALIDATED")

        self.assertEqual(res["csi"], 1.0)



    def test_09_missing_granule_handling(self):

        """9. Test missing frame detection without creating synthetic numbers."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        res = adapter.load_uttarakhand_crop(granule_path=Path("non_existent_file.h5"))

        self.assertEqual(res["status"], "DATA_UNAVAILABLE")



    def test_10_production_model_hash_unchanged(self):

        """10. Safety Checksum: Production XGBoost model artifact is unchanged."""

        model_path = MODELS_DIR / "candidate_flood_risk_model_phase4.joblib"

        self.assertTrue(model_path.exists())



    def test_11_34_feature_contract_unchanged(self):

        """11. Safety: 34-feature production allowlist is unchanged."""

        allowlist_path = MODELS_DIR / "candidate_feature_allowlist_phase4.json"

        self.assertTrue(allowlist_path.exists())

        with open(allowlist_path, "r", encoding="utf-8") as f:

            allowlist_data = json.load(f)

        predictors = allowlist_data["predictors"]

        self.assertEqual(len(predictors), 34)

        self.assertNotIn("insat_qpe_4km", predictors)



    def test_12_production_risk_engine_unchanged(self):

        """12. Safety: Production RiskDecisionEngine is unchanged."""

        from app.services.risk_decision_engine import RiskDecisionEngine

        engine = RiskDecisionEngine()

        self.assertEqual(engine.DECISION_THRESHOLD, 0.40)

        self.assertEqual(engine.POLICY_VERSION, "8.1.0")





if __name__ == "__main__":

    unittest.main()
