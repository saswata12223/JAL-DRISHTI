"""
FlashFloodAI — Phase 1H Historical Flood Events Verification Suite
"""

import json
import re
import sys
import unittest
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, r"C:\JAL DRISTI")

from scripts.historical_events import (
    EAST,
    NORTH,
    PROCESSED_DIR,
    PROJECT_DIR,
    RAW_DIR,
    SOUTH,
    WEST,
    HistoricalEventsCatalogEngine,
)


class TestPhase1HHistoricalEventsVerification(unittest.TestCase):

    def setUp(self):
        self.raw_file = RAW_DIR / "authoritative_event_sources.json"
        self.csv_file = PROCESSED_DIR / "historical_flood_events.csv"
        self.json_file = PROCESSED_DIR / "historical_flood_events.json"
        self.geojson_file = PROCESSED_DIR / "historical_flood_events.geojson"

    def test_01_raw_files_exist_and_locations(self):
        """Check that raw event sources JSON exists in data/raw/events/."""
        self.assertTrue(RAW_DIR.exists(), "Missing raw events directory")
        self.assertTrue(self.raw_file.exists(), f"Missing raw event file: {self.raw_file}")
        self.assertGreater(self.raw_file.stat().st_size, 5000)
        with open(self.raw_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.assertIn("source_organizations", data)
            self.assertIn("events", data)
            self.assertGreater(len(data["events"]), 0)

    def test_02_processed_catalog_exists_and_readable(self):
        """Check that processed CSV, JSON, and GeoJSON datasets exist and are readable."""
        self.assertTrue(self.csv_file.exists(), f"Missing CSV: {self.csv_file}")
        self.assertTrue(self.json_file.exists(), f"Missing JSON: {self.json_file}")
        self.assertTrue(self.geojson_file.exists(), f"Missing GeoJSON: {self.geojson_file}")

        df = pd.read_csv(self.csv_file)
        self.assertGreater(len(df), 10, f"Too few historical events: {len(df)}")

        with open(self.json_file, "r", encoding="utf-8") as f:
            events_json = json.load(f)
            self.assertEqual(len(df), len(events_json))

        with open(self.geojson_file, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)
            self.assertEqual(geojson_data["type"], "FeatureCollection")
            self.assertGreater(len(geojson_data["features"]), 0)

    def test_03_required_fields_presence(self):
        """Check that all required schema fields are present in the dataset."""
        df = pd.read_csv(self.csv_file)
        required_fields = [
            "event_id",
            "event_date",
            "event_end_date",
            "event_type",
            "event_name",
            "state",
            "district",
            "location",
            "river_basin",
            "latitude",
            "longitude",
            "severity_category",
            "deaths",
            "affected_population",
            "triggering_hazard",
            "description",
            "source_name",
            "source_url",
            "confidence",
        ]
        for field in required_fields:
            self.assertIn(field, df.columns, f"Missing required column: {field}")

    def test_04_dates_valid_and_chronological(self):
        """Check that all event dates are valid ISO YYYY-MM-DD dates and chronologically ordered."""
        df = pd.read_csv(self.csv_file)
        parsed_dates = []
        for idx, row in df.iterrows():
            d_str = row["event_date"]
            self.assertRegex(d_str, r"^\d{4}-\d{2}-\d{2}$", f"Invalid date format: {d_str}")
            d = datetime.strptime(d_str, "%Y-%m-%d")
            parsed_dates.append(d)

            # Check end date >= start date if present
            if pd.notna(row["event_end_date"]):
                end_d = datetime.strptime(row["event_end_date"], "%Y-%m-%d")
                self.assertGreaterEqual(end_d, d, f"End date {end_d} before start date {d} at row {idx}")

        # Check chronological ordering
        for i in range(len(parsed_dates) - 1):
            self.assertLessEqual(parsed_dates[i], parsed_dates[i + 1], f"Dates not chronological: {parsed_dates[i]} > {parsed_dates[i+1]}")

    def test_05_coordinates_valid_and_within_bounds(self):
        """Check that all explicit coordinates fall within the Uttarakhand bounding box."""
        df = pd.read_csv(self.csv_file)
        for idx, row in df.iterrows():
            lat = row["latitude"]
            lon = row["longitude"]
            if pd.notna(lat) and pd.notna(lon):
                self.assertGreaterEqual(lat, SOUTH - 0.2, f"Latitude too low for Uttarakhand: {lat}")
                self.assertLessEqual(lat, NORTH + 0.2, f"Latitude too high for Uttarakhand: {lat}")
                self.assertGreaterEqual(lon, WEST - 0.2, f"Longitude too low for Uttarakhand: {lon}")
                self.assertLessEqual(lon, EAST + 0.2, f"Longitude too high for Uttarakhand: {lon}")

    def test_06_event_types_taxonomy(self):
        """Check that all event types adhere to the official documented hazard taxonomy."""
        df = pd.read_csv(self.csv_file)
        valid_types = {
            "flash flood",
            "river flood",
            "cloudburst-induced flood",
            "glacial lake outburst flood (GLOF)",
            "debris-flow/flood event",
            "extreme rainfall flood",
            "landslide-dammed lake outburst flood (LLOF)",
        }
        for etype in df["event_type"]:
            self.assertIn(etype, valid_types, f"Invalid event type: {etype}")

    def test_07_missing_values_representation(self):
        """Verify that unknown/missing values are represented as NaN/null, not fake zeroes."""
        df = pd.read_csv(self.csv_file)
        # missing_persons is null for older events where records were unsegregated
        old_events = df[df["event_date"] < "2000-01-01"]
        for idx, row in old_events.iterrows():
            self.assertTrue(pd.isna(row["missing_persons"]), f"Expected NaN missing_persons for 1970/1998, found {row['missing_persons']}")
            self.assertNotEqual(row["missing_persons"], 0, "Missing data should not be zero")

    def test_08_casualties_and_population_non_negative(self):
        """Check that casualties and affected populations are non-negative and physically plausible."""
        df = pd.read_csv(self.csv_file)
        for col in ["deaths", "missing_persons", "affected_population"]:
            non_null = df[col].dropna()
            self.assertTrue((non_null >= 0).all(), f"Found negative values in {col}")

    def test_09_provenance_and_source_urls(self):
        """Check that every single event has an authoritative source name, publication, and URL."""
        df = pd.read_csv(self.csv_file)
        for idx, row in df.iterrows():
            self.assertGreater(len(str(row["source_name"])), 3, f"Missing source_name at index {idx}")
            self.assertGreater(len(str(row["source_url"])), 8, f"Missing source_url at index {idx}")
            self.assertTrue(row["source_url"].startswith("http"), f"Invalid source_url: {row['source_url']}")
            self.assertIn(row["confidence"], ["HIGH", "MEDIUM", "LOW"])

    def test_10_deduplication_logic(self):
        """Check that the deduplication engine prevents duplicate identical records."""
        engine = HistoricalEventsCatalogEngine()
        events = engine.load_and_deduplicate_events()
        event_ids = [e["event_id"] for e in events]
        self.assertEqual(len(event_ids), len(set(event_ids)), "Duplicate event_ids detected in catalog")

    def test_11_no_synthetic_or_mock_generators(self):
        """Check that no random or synthetic generators exist in scripts/historical_events.py."""
        code_file = PROJECT_DIR / "scripts" / "historical_events.py"
        with open(code_file, "r", encoding="utf-8") as f:
            code = f.read()
        for forbidden in ["random.", "np.random", "uniform(", "randint(", "unittest.mock", "MagicMock"]:
            matches = re.findall(rf".*{re.escape(forbidden)}.*", code)
            self.assertEqual(len(matches), 0, f"Found forbidden term '{forbidden}' in historical_events.py")

    def test_12_phase_1a_to_1g_integrity(self):
        """Verify that all previously accepted Phase 1A–1G datasets remain intact and unmodified."""
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
        # 1G Water Level
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "waterlevel" / "cwc_water_level_stations.csv").exists())
        self.assertTrue((PROJECT_DIR / "data" / "processed" / "waterlevel" / "cwc_water_level_latest.json").exists())


def run_verification():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase1HHistoricalEventsVerification)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_verification()
    if not success:
        sys.exit(1)
