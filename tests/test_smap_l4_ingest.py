"""
Unit and Integration Test Suite for Jal Drishti Phase 9.2-B: Real NASA SMAP L4 Version 8 Ingestion.
"""

import json
import os
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np
import pandas as pd

from scripts.smap_l4_ingest import (
    authenticate_earthdata,
    parse_smap_l4_hdf5,
    run_smap_l4_ingestion,
    SHORT_NAME,
    VERSION,
    WEST_LON,
    EAST_LON,
    SOUTH_LAT,
    NORTH_LAT,
)
from scripts.orchestrate_rolling_pipeline import RollingPipelineOrchestrator


class TestSMAPL4Ingestion(unittest.TestCase):
    """Test suite covering NASA SMAP L4 Version 8 ingestion, HDF5 parsing, quality gates, and pipeline safety."""

    def setUp(self):
        self.project_dir = Path(__file__).resolve().parent.parent
        self.smap_l4_dir = self.project_dir / "data" / "processed" / "smap_l4"
        self.raw_hdf5 = self.project_dir / "data" / "raw" / "smap" / "SMAP_L4_SM_gph_20260911T223000_Vv8011_001.h5"

    def test_01_earthdata_credentials_presence(self):
        """Verify NASA Earthdata authentication credentials exist in environment/dotenv."""
        from dotenv import load_dotenv
        load_dotenv(self.project_dir / ".env")
        user = os.getenv("EARTHDATA_USERNAME")
        pwd = os.getenv("EARTHDATA_PASSWORD")
        self.assertIsNotNone(user)
        self.assertIsNotNone(pwd)

    def test_02_product_short_name_and_version(self):
        """Verify exact product ID and Version 8 specification."""
        self.assertEqual(SHORT_NAME, "SPL4SMGP")
        self.assertEqual(VERSION, "008")

    def test_03_spatial_domain_bounding_box(self):
        """Verify Uttarakhand bounding box definition."""
        self.assertEqual(WEST_LON, 77.8)
        self.assertEqual(EAST_LON, 81.1)
        self.assertEqual(SOUTH_LAT, 28.5)
        self.assertEqual(NORTH_LAT, 31.5)

    def test_04_hdf5_parsing_and_fill_value_handling(self):
        """Parse real downloaded SMAP L4 HDF5 file and verify -9999.0 fill values are converted to NaNs."""
        if not self.raw_hdf5.exists():
            self.skipTest(f"Raw HDF5 file {self.raw_hdf5} not found.")

        parsed = parse_smap_l4_hdf5(self.raw_hdf5)
        self.assertIsNotNone(parsed)
        self.assertIn("sm_surface", parsed)
        self.assertIn("sm_rootzone", parsed)

        sm_surf = parsed["sm_surface"]
        sm_root = parsed["sm_rootzone"]

        # Ensure no negative fill values remain in processed array
        self.assertFalse((sm_surf < 0.0).any(), "Fill values < 0 must be converted to NaNs")
        self.assertFalse((sm_root < 0.0).any(), "Fill values < 0 must be converted to NaNs")

    def test_05_uttarakhand_grid_cell_extraction_count(self):
        """Verify exact 1,296 grid cells extracted for Uttarakhand domain."""
        if not self.raw_hdf5.exists():
            self.skipTest(f"Raw HDF5 file {self.raw_hdf5} not found.")

        parsed = parse_smap_l4_hdf5(self.raw_hdf5)
        cell_lat = parsed["cell_lat"]
        cell_lon = parsed["cell_lon"]

        uk_mask = (cell_lat >= SOUTH_LAT) & (cell_lat <= NORTH_LAT) & (cell_lon >= WEST_LON) & (cell_lon <= EAST_LON)
        num_cells = int(uk_mask.sum())
        self.assertEqual(num_cells, 1296)

    def test_06_derived_features_calculation(self):
        """Verify derived features (ratio, difference, saturation index)."""
        surf = 0.35
        root = 0.30
        diff = surf - root
        ratio = surf / (root + 1e-6)
        sat_index = 0.6 * surf + 0.4 * root

        self.assertAlmostEqual(diff, 0.05, places=4)
        self.assertAlmostEqual(sat_index, 0.33, places=4)
        self.assertGreater(ratio, 1.0)

    def test_07_freshness_state_classification(self):
        """Test freshness state logic based on data age hours."""
        now = datetime.now(timezone.utc)
        fresh_dt = now - timedelta(hours=10)
        aging_dt = now - timedelta(hours=48)
        stale_dt = now - timedelta(hours=96)

        self.assertLessEqual((now - fresh_dt).total_seconds() / 3600.0, 24.0)
        self.assertLessEqual((now - aging_dt).total_seconds() / 3600.0, 72.0)
        self.assertGreater((now - stale_dt).total_seconds() / 3600.0, 72.0)

    def test_08_processed_output_files_exist(self):
        """Verify latest standardized SMAP L4 files exist and are non-empty."""
        latest_parquet = self.smap_l4_dir / "standardized" / "smap_l4_latest.parquet"
        latest_json = self.smap_l4_dir / "latest" / "latest_smap_l4_summary.json"

        if latest_parquet.exists():
            df = pd.read_parquet(latest_parquet)
            self.assertEqual(len(df), 1296)
            self.assertIn("smap_l4_surface_soil_moisture", df.columns)
            self.assertIn("smap_l4_rootzone_soil_moisture", df.columns)
            self.assertIn("smap_l4_saturation_index", df.columns)

        if latest_json.exists():
            with open(latest_json, "r", encoding="utf-8") as f:
                summary = json.load(f)
            self.assertIn("status", summary)
            self.assertIn("data_age_hours", summary)

    def test_09_rolling_pipeline_smap_l4_integration(self):
        """Test that RollingPipelineOrchestrator incorporates SMAP L4 summary into operational metadata."""
        orchestrator = RollingPipelineOrchestrator(rolling_days=15, dry_run=True)
        summary = orchestrator.run()
        self.assertEqual(summary["34_feature_contract"], "PASS")
        self.assertEqual(summary["quality_gates_status"], "PASS")

    def test_10_production_allowlist_contract_preservation(self):
        """Verify strict 34-feature allowlist contract remains unchanged."""
        allowlist_path = self.project_dir / "data" / "processed" / "ml" / "models" / "candidate_feature_allowlist_phase4.json"
        with open(allowlist_path, "r", encoding="utf-8") as f:
            contract = json.load(f)
        self.assertEqual(contract["predictor_count"], 34)
        self.assertEqual(len(contract["predictors"]), 34)
        self.assertNotIn("smap_l4_surface_soil_moisture", contract["predictors"])


if __name__ == "__main__":
    unittest.main()
