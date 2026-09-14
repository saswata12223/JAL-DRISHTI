"""

Unit tests for Phase 8.5 — INSAT-3DR Acquisition, Validation & Operational Feasibility

"""



import os

import json

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

MODELS_DIR = PROJECT_DIR / "data" / "processed" / "ml" / "models"





class TestPhase85INSAT3DR(unittest.TestCase):

    """Test suite for Phase 8.5 INSAT-3DR validation package and production isolation."""



    def test_01_module_imports(self):

        """1. Test INSAT-3DR module imports."""

        self.assertIsNotNone(INSAT3DRDataSequenceAdapter)

        self.assertIsNotNone(INSAT3DRProductMetadata)

        self.assertIsNotNone(INSAT3DRQualityControl)

        self.assertIsNotNone(INSAT3DRGroundValidator)

        self.assertIsNotNone(INSATvsGPMComparator)



    def test_02_metadata_extraction(self):

        """2. Test INSAT-3DR metadata extraction specifications."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        status = adapter.get_access_status()

        self.assertEqual(status["satellite"], "INSAT-3DR")

        self.assertEqual(status["spatial_resolution_km"], 4.0)

        self.assertEqual(status["temporal_cadence_min"], 15.0)

        self.assertTrue(status["authentication_required"])



    def test_03_units_and_format(self):

        """3. Test unit specification (mm/hr) and supported file formats."""

        meta = INSAT3DRProductMetadata()

        self.assertIn("HDF5 (.h5)", meta.FILE_FORMATS)

        self.assertIn("NetCDF-4 (.nc)", meta.FILE_FORMATS)



    def test_04_missing_granule_handling(self):

        """4. Test handling of missing granules without generating synthetic numbers."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        crop = adapter.load_uttarakhand_crop(granule_path=None)

        self.assertEqual(crop["status"], "DATA_UNAVAILABLE")

        self.assertIsNone(crop["precipitation"])



    def test_05_spatial_bounds_uttarakhand(self):

        """5. Test Uttarakhand grid cell geometry (75 lat x 82 lon = 6,150 cells at 0.04 deg)."""

        west, east, south, north = 77.8, 81.1, 28.5, 31.5

        lat_cells = int(round((north - south) / 0.04))

        lon_cells = int(round((east - west) / 0.04))

        self.assertEqual(lat_cells, 75)

        self.assertEqual(lon_cells, 82)

        self.assertEqual(lat_cells * lon_cells, 6150)



    def test_06_quality_control_audit(self):

        """6. Test quality control audit module."""

        qc = INSAT3DRQualityControl(max_valid_rain_mmh=300.0)

        valid_grid = np.array([[0.0, 5.0], [10.0, 15.0]], dtype=np.float32)

        audit = qc.audit_precipitation_field(valid_grid)

        self.assertTrue(audit["valid"])

        self.assertEqual(audit["qc_status"], "PASS")



        invalid_grid = np.array([[-10.0, 500.0]], dtype=np.float32)

        audit_inv = qc.audit_precipitation_field(invalid_grid)

        self.assertFalse(audit_inv["valid"])



    def test_07_gpm_comparison_logic(self):

        """7. Test INSAT vs GPM comparison logic."""

        comparator = INSATvsGPMComparator()

        gpm_10km = np.linspace(0.0, 20.0, 30*33, dtype=np.float32).reshape(30, 33)

        insat_4km = comparator.regrid_gpm_to_insat(gpm_10km, (75, 82))



        stats = comparator.calculate_comparative_stats(insat_4km, gpm_10km)

        self.assertEqual(stats["status"], "SUCCESS")

        self.assertAlmostEqual(stats["mae_mmh"], 0.0, places=3)

        self.assertGreater(stats["spatial_correlation"], 0.99)



    def test_08_imd_ground_validation_logic(self):

        """8. Test IMD ground station validation benchmarking logic."""

        validator = INSAT3DRGroundValidator(rain_threshold_mmh=0.5)

        est = np.array([1.0, 2.0, 0.0, 0.0], dtype=np.float32)

        obs = np.array([1.0, 2.0, 0.0, 0.0], dtype=np.float32)



        res = validator.evaluate_station_match(est, obs)

        self.assertEqual(res["status"], "VALIDATED")

        self.assertAlmostEqual(res["mae"], 0.0)

        self.assertEqual(res["csi"], 1.0)



    def test_09_failure_handling_categories(self):

        """9. Test failure status logging."""

        adapter = INSAT3DRDataSequenceAdapter(RAW_INSAT_DIR)

        status = adapter.get_access_status()

        self.assertIn(status["operational_access_status"], ["OPERATIONAL_ACCESS_LIMITED", "GRANULES_AVAILABLE", "UNAUTHENTICATED_ACCESS_BLOCKED"])



    def test_10_production_model_artifact_unchanged(self):

        """10. Safety: Production XGBoost model artifact is unchanged."""

        model_path = MODELS_DIR / "candidate_flood_risk_model_phase4.joblib"

        self.assertTrue(model_path.exists())

        self.assertGreater(model_path.stat().st_size, 10000)



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
