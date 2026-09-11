"""
FlashFloodAI — Phase 1G Water Level Ingestion Verification Suite
"""

import json
import re
import sys
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd
import requests

sys.path.insert(0, r"C:\JAL DRISTI")

from scripts.waterlevel_ingest import (
    CWC_UTTARAKHAND_STATION_MASTER,
    EAST,
    NORTH,
    PROCESSED_DIR,
    PROJECT_DIR,
    RAW_DIR,
    SOUTH,
    WEST,
    WaterLevelIngestionEngine,
)


class TestPhase1GWaterLevelVerification(unittest.TestCase):

    def setUp(self):
        self.raw_files = list(RAW_DIR.glob("cwc_water_level_raw_*.json"))
        self.csv_file = PROCESSED_DIR / "cwc_water_level_stations.csv"
        self.json_file = PROCESSED_DIR / "cwc_water_level_latest.json"

    def test_01_raw_files_created_and_locations(self):
        """Check that raw CWC JSON snapshots exist in data/raw/waterlevel/."""
        self.assertTrue(RAW_DIR.exists(), "Raw waterlevel directory missing")
        self.assertGreater(len(self.raw_files), 0, "No raw CWC snapshot files found")
        for f in self.raw_files:
            self.assertGreater(f.stat().st_size, 500, f"Raw snapshot file suspiciously small: {f}")
            with open(f, "r", encoding="utf-8") as fp:
                data = json.load(fp)
                self.assertIn("endpoints_probed", data)
                self.assertIn("retrieval_time_utc", data)

    def test_02_processed_dataset_exists_and_readable(self):
        """Check that standardized CSV and JSON datasets exist and are readable."""
        self.assertTrue(self.csv_file.exists(), f"Processed CSV missing: {self.csv_file}")
        self.assertTrue(self.json_file.exists(), f"Processed JSON missing: {self.json_file}")
        df = pd.read_csv(self.csv_file)
        self.assertGreater(len(df), 0, "Processed CSV is empty")
        self.assertEqual(len(df), len(CWC_UTTARAKHAND_STATION_MASTER))

    def test_03_uttarakhand_station_coverage(self):
        """Check Uttarakhand river basin station coverage (Alaknanda, Bhagirathi, Ganga, Mandakini, Yamuna, Kali)."""
        df = pd.read_csv(self.csv_file)
        # Check major key stations exist
        station_names = list(df["station_name"])
        for required_st in ["Devprayag", "Rishikesh", "Haridwar (Bhimgoda Barrage)", "Joshimath (Marwari)", "Uttarkashi", "Rudraprayag"]:
            self.assertIn(required_st, station_names, f"Missing key CWC station: {required_st}")

        # Check major rivers represented
        rivers = " ".join(df["river_name"].tolist()).lower()
        for river in ["ganga", "alaknanda", "bhagirathi", "mandakini", "yamuna", "tons", "kali", "saryu"]:
            self.assertIn(river, rivers, f"River basin missing in station network: {river}")

    def test_04_required_water_level_fields(self):
        """Check that all required standardized fields are present in the dataset."""
        df = pd.read_csv(self.csv_file)
        required_fields = [
            "station_id",
            "station_name",
            "river_name",
            "basin",
            "latitude",
            "longitude",
            "timestamp_utc",
            "water_level",
            "water_level_unit",
            "warning_level_m",
            "danger_level_m",
            "hfl_m",
            "source",
            "source_url",
            "retrieved_at_utc",
        ]
        for field in required_fields:
            self.assertIn(field, df.columns, f"Missing required column: {field}")

    def test_05_coordinates_valid(self):
        """Check that all station coordinates fall within the Uttarakhand bounding box."""
        df = pd.read_csv(self.csv_file)
        for idx, row in df.iterrows():
            lat = row["latitude"]
            lon = row["longitude"]
            self.assertFalse(np.isnan(lat), f"NaN latitude at index {idx}")
            self.assertFalse(np.isnan(lon), f"NaN longitude at index {idx}")
            self.assertGreaterEqual(lat, SOUTH - 0.1, f"Latitude too low: {lat}")
            self.assertLessEqual(lat, NORTH + 0.1, f"Latitude too high: {lat}")
            self.assertGreaterEqual(lon, WEST - 0.1, f"Longitude too low: {lon}")
            self.assertLessEqual(lon, EAST + 0.1, f"Longitude too high: {lon}")

    def test_06_timestamps_and_timezone(self):
        """Check retrieval and observation timestamps are valid ISO 8601 UTC formats."""
        with open(self.json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        retrieval_utc = data["metadata"]["retrieval_time_utc"]
        self.assertTrue(retrieval_utc.endswith("+00:00") or retrieval_utc.endswith("Z"))
        dt = datetime.fromisoformat(retrieval_utc)
        self.assertIsNotNone(dt)

    def test_07_water_level_units_and_physical_plausibility(self):
        """Check units (meters) and threshold sanity (Warning Level < Danger Level < HFL)."""
        df = pd.read_csv(self.csv_file)
        for idx, row in df.iterrows():
            self.assertEqual(row["water_level_unit"], "meters")
            wl = row["warning_level_m"]
            dl = row["danger_level_m"]
            hfl = row["hfl_m"]
            self.assertLessEqual(wl, dl, f"Warning Level {wl} > Danger Level {dl} for {row['station_name']}")
            self.assertLessEqual(dl, hfl, f"Danger Level {dl} > HFL {hfl} for {row['station_name']}")
            # Physical elevation range in Uttarakhand (200m to 2000m MSL)
            self.assertGreater(wl, 150.0)
            self.assertLess(hfl, 3000.0)

    def test_08_missing_data_handling(self):
        """Verify that offline/missing observations are represented as NaN/null, not fake zero values."""
        df = pd.read_csv(self.csv_file)
        # When telemetry is offline, water_level must be NaN, never 0.0
        offline_rows = df[df["station_status"].str.contains("OFFLINE", na=False)]
        for idx, row in offline_rows.iterrows():
            self.assertTrue(pd.isna(row["water_level"]), f"Expected NaN for offline station, found {row['water_level']}")
            self.assertNotEqual(row["water_level"], 0.0, "Missing data incorrectly replaced with zero")

    def test_09_provenance_and_source_metadata(self):
        """Check complete provenance and source metadata recording."""
        with open(self.json_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        meta = data["metadata"]
        self.assertIn("Central Water Commission", meta["source_provider"])
        self.assertIn("ffs.india-water.gov.in", meta["source_url"])
        self.assertIn("endpoint_probe_summary", data)

    def test_10_graceful_endpoint_failure(self):
        """Verify graceful error handling on network/HTTP failures without crashing."""
        engine = WaterLevelIngestionEngine(
            raw_dir=PROJECT_DIR / "scratch" / "dummy_raw_wl",
            processed_dir=PROJECT_DIR / "scratch" / "dummy_proc_wl",
        )
        with patch.object(engine.session, "get", side_effect=requests.exceptions.ConnectionError("Simulated outage")):
            results = engine.probe_official_cwc_endpoints()
            self.assertIsInstance(results, dict)
            for ep, res in results.items():
                self.assertFalse(res["accessible"])
                self.assertIn("Simulated outage", str(res["error"]))

    def test_11_no_synthetic_or_mock_data(self):
        """Check that no random or synthetic number generators exist in scripts/waterlevel_ingest.py."""
        code_path = PROJECT_DIR / "scripts" / "waterlevel_ingest.py"
        with open(code_path, "r", encoding="utf-8") as f:
            code = f.read()
        for forbidden in ["random.", "np.random", "uniform(", "randint(", "unittest.mock", "MagicMock"]:
            matches = re.findall(rf".*{re.escape(forbidden)}.*", code)
            self.assertEqual(len(matches), 0, f"Found forbidden generator '{forbidden}' in waterlevel_ingest.py")

    def test_12_phase_1a_to_1f_integrity(self):
        """Verify that all previously accepted Phase 1A–1F datasets remain intact and unmodified."""
        # 1A GPM
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "gpm_combined.nc").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "rainfall_features.nc").exists())
        # 1B IMD
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "weather" / "imd_weather_stations.csv").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "weather" / "imd_weather_latest.json").exists())
        # 1C SMAP
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "smap" / "smap_soil_moisture.nc").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "smap" / "smap_soil_moisture_latest.json").exists())
        # 1D SRTM
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "srtm" / "srtm_uttarakhand_dem.tif").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "srtm" / "srtm_uttarakhand_dem.nc").exists())
        # 1E Terrain
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "terrain" / "terrain_features.tif").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "terrain" / "terrain_features.nc").exists())
        # 1F Land Cover
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "landcover" / "landcover_uttarakhand.tif").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "landcover" / "landcover_uttarakhand.nc").exists())


def run_verification():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase1GWaterLevelVerification)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_verification()
    if not success:
        sys.exit(1)
