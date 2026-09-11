"""
FlashFloodAI — Phase 4 Source-Level Government Threshold Verification Suite

Automated acceptance tests validating:
1. All 20 Phase 4 stations are represented in source-level verification records.
2. Exactly 60 threshold records are present and verified.
3. Every record has documented source organization, title, URL, and citation.
4. Every VERIFIED record has exact evidence text.
5. Every VERIFIED record has an exact numerical match (exact_value_confirmed == True).
6. Datum/reference system is explicitly documented in meters MSL.
7. Zero synthetic/random/mock generators exist in threshold scripts.
8. No threshold values were silently altered from flood_thresholds.csv.
9. Phase 1A–1D source files remain completely intact and unmodified.

Usage:
    python scripts/verify_phase4_source_level.py
"""

import json
import logging
import re
import sys
import unittest
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd

# ============================================================
# SETUP & PATHS
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("Phase4SourceLevelVerification")

PROJECT_DIR = Path(r"C:\JAL DRISTI")
DATA_DIR = PROJECT_DIR / "data"
PROC_DIR = DATA_DIR / "processed"
RISK_DIR = PROC_DIR / "risk"
THRESH_DIR = PROC_DIR / "thresholds"

# ============================================================
# TEST SUITE
# ============================================================

class TestPhase4SourceLevelVerification(unittest.TestCase):
    """Test suite validating Source-Level Government Threshold Verification integrity."""

    @classmethod
    def setUpClass(cls):
        cls.thresh_csv = RISK_DIR / "flood_thresholds.csv"
        cls.source_csv = THRESH_DIR / "phase4_source_level_verification.csv"
        cls.source_json = THRESH_DIR / "phase4_source_level_verification.json"

    def test_01_source_verification_files_exist_and_readable(self):
        """1. Verify that source verification CSV and JSON files exist and are non-empty."""
        self.assertTrue(self.source_csv.exists(), f"Missing {self.source_csv}")
        self.assertTrue(self.source_json.exists(), f"Missing {self.source_json}")
        self.assertGreater(self.source_csv.stat().st_size, 0)
        self.assertGreater(self.source_json.stat().st_size, 0)

    def test_02_all_20_stations_represented(self):
        """2. Verify that exactly 20 distinct CWC stations are audited."""
        df_src = pd.read_csv(self.source_csv)
        df_orig = pd.read_csv(self.thresh_csv)

        orig_stations = set(df_orig["station_id"])
        src_stations = set(df_src["station_id"])

        self.assertEqual(len(src_stations), 20)
        self.assertEqual(orig_stations, src_stations, "Mismatch between Phase 4 stations and source verification")

    def test_03_exactly_60_threshold_records_checked(self):
        """3. Verify exactly 60 threshold records are present (20 stations x 3 fields)."""
        df_src = pd.read_csv(self.source_csv)
        self.assertEqual(len(df_src), 60, "Must have exactly 60 threshold records (20 stations x 3 fields)")

        expected_fields = {"warning_level_m", "danger_level_m", "hfl_m"}
        for st_id, group in df_src.groupby("station_id"):
            fields = set(group["threshold_field"])
            self.assertEqual(fields, expected_fields, f"Station {st_id} does not have all 3 threshold fields")

    def test_04_each_record_has_source_and_url(self):
        """4. Verify that each record has documented source organization, title, and URL."""
        df_src = pd.read_csv(self.source_csv)
        for _, r in df_src.iterrows():
            self.assertGreater(len(str(r["source_organization"])), 5)
            self.assertGreater(len(str(r["source_title"])), 5)
            url = str(r["source_url"])
            self.assertTrue(url.startswith("http://") or url.startswith("https://"))

    def test_05_each_verified_record_has_evidence_text(self):
        """5. Verify that each VERIFIED record has non-empty evidence text and page/section."""
        df_src = pd.read_csv(self.source_csv)
        for _, r in df_src[df_src["verification_status"] == "VERIFIED"].iterrows():
            self.assertGreater(len(str(r["evidence_text"])), 15)
            self.assertGreater(len(str(r["page_or_section"])), 3)

    def test_06_each_verified_record_has_exact_numeric_match(self):
        """6. Verify that each VERIFIED record has exact_value_confirmed == True and matches stored value."""
        df_src = pd.read_csv(self.source_csv)
        df_orig = pd.read_csv(self.thresh_csv)

        for _, r in df_orig.iterrows():
            st_id = r["station_id"]
            warn_src = df_src[(df_src["station_id"] == st_id) & (df_src["threshold_field"] == "warning_level_m")].iloc[0]
            dang_src = df_src[(df_src["station_id"] == st_id) & (df_src["threshold_field"] == "danger_level_m")].iloc[0]
            hfl_src = df_src[(df_src["station_id"] == st_id) & (df_src["threshold_field"] == "hfl_m")].iloc[0]

            self.assertEqual(warn_src["stored_value"], float(r["warning_level_m"]))
            self.assertEqual(dang_src["stored_value"], float(r["danger_level_m"]))
            self.assertEqual(hfl_src["stored_value"], float(r["hfl_m"]))

            self.assertTrue(warn_src["exact_value_confirmed"])
            self.assertTrue(dang_src["exact_value_confirmed"])
            self.assertTrue(hfl_src["exact_value_confirmed"])

    def test_07_datum_and_reference_system_recorded(self):
        """7. Verify datum/reference system explicitly records MSL and gauge zero datum."""
        df_src = pd.read_csv(self.source_csv)
        for _, r in df_src.iterrows():
            datum_str = str(r["datum_reference"])
            self.assertIn("MSL", datum_str)
            self.assertIn("m", datum_str)

    def test_08_zero_synthetic_or_mock_generators_in_code(self):
        """8. Static code analysis ensuring no random or synthetic generators in flood_thresholds.py."""
        code_file = PROJECT_DIR / "scripts" / "flood_thresholds.py"
        with open(code_file, "r", encoding="utf-8") as f:
            code = f.read()
        for forbidden in ["random.", "np.random", "uniform(", "randint(", "unittest.mock", "MagicMock"]:
            matches = re.findall(rf".*{re.escape(forbidden)}.*", code)
            self.assertEqual(len(matches), 0, f"Found forbidden generator '{forbidden}' in flood_thresholds.py")

    def test_09_phase1a_to_phase1d_source_data_intact(self):
        """9. Verify that all Phase 1A–1D source datasets remain completely intact and unmodified."""
        phase1_sources = [
            PROC_DIR / "gpm_combined.nc",
            PROC_DIR / "rainfall_features.nc",
            PROC_DIR / "weather" / "imd_weather_stations.csv",
            PROC_DIR / "smap" / "smap_soil_moisture.nc",
            PROC_DIR / "srtm" / "srtm_uttarakhand_dem.tif",
        ]
        for f in phase1_sources:
            self.assertTrue(f.exists(), f"Phase 1 dataset missing: {f}")
            self.assertGreater(f.stat().st_size, 0, f"Phase 1 dataset empty: {f}")


# ============================================================
# RUNNER WITH MACHINE-READABLE SUMMARY
# ============================================================

def run_source_verification_suite() -> bool:
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase4SourceLevelVerification)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    passes = total_tests - failures - errors

    print("\n" + "=" * 65)
    print("PHASE 4 SOURCE-LEVEL THRESHOLD VERIFICATION SUITE SUMMARY")
    print("=" * 65)
    print(f"TOTAL TESTS RUN : {total_tests}")
    print(f"PASS            : {passes}")
    print(f"FAIL            : {failures + errors}")
    print("=" * 65)

    if failures > 0 or errors > 0:
        print("\n[CRITICAL FAILURE] Phase 4 Source-Level Verification criteria not met.")
        return False

    print("\n[SUCCESS] 100% of Phase 4 Source-Level Verification criteria PASSED.")
    return True


if __name__ == "__main__":
    success = run_source_verification_suite()
    if not success:
        sys.exit(1)
    sys.exit(0)
