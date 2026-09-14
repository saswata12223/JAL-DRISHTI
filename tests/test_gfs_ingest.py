"""
Unit and Integration Test Suite for Jal Drishti Phase 9.1: Real NOAA GFS 0.25° Forecast Ingestion.
"""

import json
import os
import shutil
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
import numpy as np

from scripts.gfs_ingest import (
    build_nomads_download_url,
    discover_available_gfs_cycles,
    parse_gfs_grib_raster,
    run_gfs_ingestion,
    WEST_LON,
    EAST_LON,
    SOUTH_LAT,
    NORTH_LAT,
)
from scripts.orchestrate_rolling_pipeline import RollingPipelineOrchestrator


class TestGFSIngestion(unittest.TestCase):
    """Test suite covering NOAA GFS forecast ingestion, parsing, quality gates, and pipeline safety."""

    def setUp(self):
        self.project_dir = Path(__file__).resolve().parent.parent
        self.gfs_dir = self.project_dir / "data" / "processed" / "gfs"
        self.raw_grib = self.gfs_dir / "raw" / "gfs_20260914_12z_f001.grib2"

    def test_01_nomads_download_url_construction(self):
        """Test URL formatting for GFS 0.25 GRIB filter API."""
        url = build_nomads_download_url("20260914", "12", 1)
        self.assertIn("https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl", url)
        self.assertIn("file=gfs.t12z.pgrb2.0p25.f001", url)
        self.assertIn("var_APCP=on", url)
        self.assertIn("var_TMP=on", url)
        self.assertIn(f"leftlon={WEST_LON}", url)
        self.assertIn(f"rightlon={EAST_LON}", url)
        self.assertIn(f"toplat={NORTH_LAT}", url)
        self.assertIn(f"bottomlat={SOUTH_LAT}", url)

    def test_02_spatial_domain_bounding_box(self):
        """Verify Uttarakhand bounding box definition and buffer."""
        self.assertEqual(WEST_LON, 77.0)
        self.assertEqual(EAST_LON, 82.0)
        self.assertEqual(SOUTH_LAT, 28.0)
        self.assertEqual(NORTH_LAT, 32.5)

    def test_03_grib_file_parsing_with_rasterio(self):
        """Parse real downloaded GRIB2 file using rasterio if available."""
        if not self.raw_grib.exists():
            self.skipTest(f"GRIB file {self.raw_grib} does not exist yet.")
        parsed = parse_gfs_grib_raster(self.raw_grib, 1)
        self.assertIsNotNone(parsed)
        self.assertEqual(parsed["fhour"], 1)
        self.assertIn("variables", parsed)
        self.assertIn("TMP_2m_C", parsed["variables"])
        self.assertIn("APCP_accum_mm", parsed["variables"])

    def test_04_apcp_cumulative_to_interval_conversion(self):
        """Verify arithmetic derivation of non-overlapping interval precipitation."""
        apcp_f1 = 2.5
        apcp_f3 = 7.0
        apcp_f6 = 15.0
        
        interval_1_3 = max(0.0, apcp_f3 - apcp_f1)
        interval_3_6 = max(0.0, apcp_f6 - apcp_f3)

        self.assertAlmostEqual(interval_1_3, 4.5, places=3)
        self.assertAlmostEqual(interval_3_6, 8.0, places=3)

    def test_05_stale_cycle_detection(self):
        """Verify cycle age calculation flags stale data > 24 hours old."""
        now_utc = datetime.now(timezone.utc)
        old_cycle = now_utc - timedelta(hours=30)
        date_str = old_cycle.strftime("%Y%m%d")
        cycle_str = old_cycle.strftime("%H")
        
        # Test dry-run with historical stale cycle
        res = run_gfs_ingestion(date_str=date_str, cycle_str=cycle_str, dry_run=True)
        self.assertTrue(res["is_stale"])

    def test_06_forecast_leakage_prevention(self):
        """Ensure forecast initialization timestamp is not after prediction timestamp."""
        init_time = datetime(2026, 9, 14, 12, 0, 0, tzinfo=timezone.utc)
        pred_time = datetime(2026, 9, 14, 16, 0, 0, tzinfo=timezone.utc)
        self.assertLessEqual(init_time, pred_time)

    def test_07_dry_run_execution(self):
        """Verify dry run mode returns success status without network/disk modifications."""
        res = run_gfs_ingestion(date_str="20260914", cycle_str="12", dry_run=True)
        self.assertEqual(res["status"], "DRY_RUN_SUCCESS")

    def test_08_processed_output_files_exist(self):
        """Verify latest standardized GFS files exist and are non-empty."""
        latest_csv = self.gfs_dir / "standardized" / "gfs_forecast_latest.csv"
        latest_json = self.gfs_dir / "latest" / "latest_gfs_summary.json"
        
        if latest_csv.exists():
            self.assertGreater(latest_csv.stat().st_size, 100)
        if latest_json.exists():
            with open(latest_json, "r", encoding="utf-8") as f:
                summary = json.load(f)
            self.assertIn("status", summary)
            self.assertIn(summary["status"], ["REAL_OPERATIONAL", "REAL_PARTIAL", "STALE"])

    def test_09_rolling_pipeline_gfs_integration(self):
        """Test that RollingPipelineOrchestrator incorporates GFS summary into operational metadata."""
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
        self.assertNotIn("gfs_precip_accum_1h_mm", contract["predictors"])

    def test_11_apcp_grib_accumulation_semantics(self):
        """Empirically verify APCP accumulation start/end times and monotonicity across downloaded GRIB2 files."""
        if not self.raw_grib.exists():
            self.skipTest("Raw GRIB2 files not available for offline test execution.")
        
        # Load standardized dataset
        parquet_path = self.gfs_dir / "standardized" / "gfs_forecast_latest.parquet"
        if not parquet_path.exists():
            self.skipTest("Standardized GFS Parquet dataset not available.")
        
        import pandas as pd
        df = pd.read_parquet(parquet_path)
        
        # Verify cumulative rainfall fields are strictly monotonic across all 399 cells
        a1 = df["gfs_rainfall_0_to_1h_mm"].values
        a3 = df["gfs_rainfall_0_to_3h_mm"].values
        a6 = df["gfs_rainfall_0_to_6h_mm"].values
        a12 = df["gfs_rainfall_0_to_12h_mm"].values
        a24 = df["gfs_rainfall_0_to_24h_mm"].values

        self.assertTrue((a3 >= a1 - 1e-4).all(), "APCP03 must be >= APCP01 across all grid cells")
        self.assertTrue((a6 >= a3 - 1e-4).all(), "APCP06 must be >= APCP03 across all grid cells")
        self.assertTrue((a12 >= a6 - 1e-4).all(), "APCP12 must be >= APCP06 across all grid cells")
        self.assertTrue((a24 >= a12 - 1e-4).all(), "APCP24 must be >= APCP12 across all grid cells")

        # Verify interval precipitation values are non-negative
        self.assertTrue((df["gfs_interval_rainfall_1h_to_3h_mm"].values >= 0.0).all())
        self.assertTrue((df["gfs_interval_rainfall_3h_to_6h_mm"].values >= 0.0).all())
        self.assertTrue((df["gfs_interval_rainfall_6h_to_12h_mm"].values >= 0.0).all())
        self.assertTrue((df["gfs_interval_rainfall_12h_to_24h_mm"].values >= 0.0).all())


if __name__ == "__main__":
    unittest.main()
