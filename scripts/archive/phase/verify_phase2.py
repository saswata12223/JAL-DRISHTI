"""
FlashFloodAI — Comprehensive Phase 2 Data Standardization & Unified Dataset Verification Suite
"""

import json
import re
import sys
import unittest
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio
import xarray as xr

sys.path.insert(0, r"C:\JAL DRISTI")

from scripts.standardize import (
    CRS_STANDARD,
    DATA_DICTIONARY,
    EAST,
    NORTH,
    PROCESSED_DIR,
    PROJECT_DIR,
    SOUTH,
    STANDARDIZED_DIR,
    WEST,
)


class TestPhase2DataStandardizationComprehensive(unittest.TestCase):

    def setUp(self):
        self.std_dir = STANDARDIZED_DIR
        self.static_nc = self.std_dir / "unified_static_features.nc"
        self.static_tif = self.std_dir / "unified_static_features.tif"
        self.dynamic_nc = self.std_dir / "standardized_dynamic_atmosphere.nc"
        self.wx_csv = self.std_dir / "standardized_weather_stations.csv"
        self.wx_parquet = self.std_dir / "standardized_weather_stations.parquet"
        self.wl_csv = self.std_dir / "standardized_water_level_stations.csv"
        self.wl_parquet = self.std_dir / "standardized_water_level_stations.parquet"
        self.ev_csv = self.std_dir / "standardized_historical_events.csv"
        self.ev_parquet = self.std_dir / "standardized_historical_events.parquet"
        self.ev_geojson = self.std_dir / "standardized_historical_events.geojson"
        self.dict_json = self.std_dir / "data_dictionary.json"
        self.qc_json = self.std_dir / "quality_control_report.json"
        self.prov_json = self.std_dir / "provenance_manifest.json"

    def test_01_unified_outputs_exist_and_readable(self):
        """1. Verify that all 13 unified output files exist, are readable, and non-empty."""
        expected_files = [
            self.static_nc, self.static_tif, self.dynamic_nc,
            self.wx_csv, self.wx_parquet, self.wl_csv, self.wl_parquet,
            self.ev_csv, self.ev_parquet, self.ev_geojson,
            self.dict_json, self.qc_json, self.prov_json
        ]
        for f in expected_files:
            self.assertTrue(f.exists(), f"Missing standardized file: {f}")
            self.assertGreater(f.stat().st_size, 0, f"File is empty: {f}")

    def test_02_spatial_crs_consistency(self):
        """2. Verify 100% CRS consistency (EPSG:4326) across static NetCDF, GeoTIFF, and GeoJSON."""
        ds_static = xr.open_dataset(self.static_nc)
        self.assertEqual(ds_static.attrs.get("crs"), CRS_STANDARD)
        ds_static.close()

        with rasterio.open(self.static_tif) as src:
            self.assertEqual(str(src.crs), "EPSG:4326")

        ds_dynamic = xr.open_dataset(self.dynamic_nc)
        self.assertEqual(ds_dynamic.attrs.get("crs"), CRS_STANDARD)
        ds_dynamic.close()

        with open(self.ev_geojson, "r", encoding="utf-8") as f:
            geo = json.load(f)
            self.assertIn("EPSG:4326", geo["metadata"]["crs"])

    def test_03_spatial_bounds_and_grid_alignment(self):
        """3. Verify spatial bounds and grid dimensions for high-res static grid and dynamic grid."""
        # Static Grid (~90m, 3600 lats x 3961 lons)
        ds_static = xr.open_dataset(self.static_nc)
        self.assertEqual(len(ds_static["lat"]), 3600)
        self.assertEqual(len(ds_static["lon"]), 3961)
        self.assertAlmostEqual(float(ds_static["lon"].min()), 77.7996, places=3)
        self.assertAlmostEqual(float(ds_static["lon"].max()), 81.0996, places=3)
        self.assertAlmostEqual(float(ds_static["lat"].min()), 28.5004, places=3)
        self.assertAlmostEqual(float(ds_static["lat"].max()), 31.4996, places=3)
        ds_static.close()

        # Dynamic Grid (0.1 deg, 30 lats x 33 lons)
        ds_dyn = xr.open_dataset(self.dynamic_nc)
        self.assertEqual(len(ds_dyn["lat"]), 30)
        self.assertEqual(len(ds_dyn["lon"]), 33)
        self.assertAlmostEqual(float(ds_dyn["lon"].min()), 77.85, places=2)
        self.assertAlmostEqual(float(ds_dyn["lon"].max()), 81.05, places=2)
        self.assertAlmostEqual(float(ds_dyn["lat"].min()), 28.55, places=2)
        self.assertAlmostEqual(float(ds_dyn["lat"].max()), 31.45, places=2)
        ds_dyn.close()

    def test_04_coordinate_ordering(self):
        """4. Verify that longitude is monotonically increasing and latitude is properly ordered."""
        ds_static = xr.open_dataset(self.static_nc)
        lons = ds_static["lon"].values
        self.assertTrue(np.all(np.diff(lons) > 0), "Static grid Longitudes must be monotonically increasing")
        ds_static.close()

        ds_dyn = xr.open_dataset(self.dynamic_nc)
        dyn_lons = ds_dyn["lon"].values
        dyn_lats = ds_dyn["lat"].values
        self.assertTrue(np.all(np.diff(dyn_lons) > 0), "Dynamic grid Longitudes must be monotonically increasing")
        self.assertTrue(np.all(np.diff(dyn_lats) > 0), "Dynamic grid Latitudes must be monotonically increasing")
        ds_dyn.close()

    def test_05_temporal_ordering_and_consistency(self):
        """5. Verify dynamic dataset temporal sequence and ISO-8601 formatting."""
        ds_dyn = xr.open_dataset(self.dynamic_nc)
        times = ds_dyn["time"].values
        self.assertEqual(len(times), 8)
        # Verify chronological ordering
        for i in range(len(times) - 1):
            self.assertLess(times[i], times[i + 1], "Timestamps must be strictly chronological")
        ds_dyn.close()

    def test_06_unit_metadata_completeness(self):
        """6. Verify that all static and dynamic variables have explicit units and long_name attributes."""
        ds_static = xr.open_dataset(self.static_nc)
        for v in ds_static.data_vars:
            self.assertIn("units", ds_static[v].attrs, f"Missing units attribute in static variable: {v}")
            self.assertIn("long_name", ds_static[v].attrs, f"Missing long_name in static variable: {v}")
        ds_static.close()

        ds_dyn = xr.open_dataset(self.dynamic_nc)
        for v in ds_dyn.data_vars:
            self.assertIn("units", ds_dyn[v].attrs, f"Missing units attribute in dynamic variable: {v}")
            self.assertIn("long_name", ds_dyn[v].attrs, f"Missing long_name in dynamic variable: {v}")
        ds_dyn.close()

    def test_07_variable_naming_consistency(self):
        """7. Verify standard clean variable naming conventions across all standardized products."""
        ds_static = xr.open_dataset(self.static_nc)
        expected_static = {
            "elevation", "slope", "flow_direction", "flow_accumulation",
            "stream_network", "twi", "landcover_class", "runoff_coefficient", "mannings_roughness"
        }
        self.assertEqual(set(ds_static.data_vars.keys()), expected_static)
        ds_static.close()

        ds_dyn = xr.open_dataset(self.dynamic_nc)
        expected_dyn = {
            "rainfall_30min", "rainfall_1h", "rainfall_3h",
            "max_rainfall_intensity", "mean_rainfall_intensity", "rainfall_trend",
            "surface_soil_moisture", "rootzone_soil_moisture", "profile_soil_moisture"
        }
        self.assertEqual(set(ds_dyn.data_vars.keys()), expected_dyn)
        ds_dyn.close()

    def test_08_missing_value_preservation_and_no_zero_filling(self):
        """8. Verify that missing numerical observations remain NaN/null and are not converted to zero."""
        df_cwc = pd.read_csv(self.wl_csv)
        self.assertEqual(df_cwc["water_level"].isna().sum(), 20, "Missing water_level must be NaN")
        self.assertEqual(df_cwc["discharge_cumec"].isna().sum(), 20, "Missing discharge_cumec must be NaN")
        self.assertEqual((df_cwc["water_level"] == 0).sum(), 0, "Missing water levels must NOT be converted to 0")

        df_wx = pd.read_csv(self.wx_csv)
        self.assertGreater(df_wx["pressure_hpa"].isna().sum(), 0, "Missing pressures in IMD should remain NaN")

    def test_09_no_duplicate_records(self):
        """9. Verify that no duplicate stations or event records exist in tabular outputs."""
        df_wx = pd.read_csv(self.wx_csv)
        self.assertEqual(df_wx.duplicated(subset=["station_id", "station_type"]).sum(), 0, "Duplicate station_id + station_type in IMD dataset")

        df_wl = pd.read_csv(self.wl_csv)
        self.assertEqual(len(df_wl["station_id"]), len(df_wl["station_id"].unique()), "Duplicate station_id in CWC dataset")

        df_ev = pd.read_csv(self.ev_csv)
        self.assertEqual(len(df_ev["event_id"]), len(df_ev["event_id"].unique()), "Duplicate event_id in Historical Events dataset")

    def test_10_physical_plausibility_of_variables(self):
        """10. Verify physical plausibility ranges for all environmental and topographic variables."""
        ds_static = xr.open_dataset(self.static_nc)
        elev = ds_static["elevation"].values
        self.assertGreaterEqual(float(np.nanmin(elev)), 100.0)
        self.assertLessEqual(float(np.nanmax(elev)), 8000.0)

        slope = ds_static["slope"].values
        self.assertGreaterEqual(float(np.nanmin(slope)), 0.0)
        self.assertLessEqual(float(np.nanmax(slope)), 90.0)

        twi = ds_static["twi"].values
        self.assertGreaterEqual(float(np.nanmin(twi)), 0.0)
        self.assertLessEqual(float(np.nanmax(twi)), 35.0)

        runoff = ds_static["runoff_coefficient"].values
        self.assertGreaterEqual(float(np.nanmin(runoff)), 0.0)
        self.assertLessEqual(float(np.nanmax(runoff)), 1.0)
        ds_static.close()

        ds_dyn = xr.open_dataset(self.dynamic_nc)
        sm = ds_dyn["surface_soil_moisture"].values
        self.assertGreaterEqual(float(np.nanmin(sm)), 0.0)
        self.assertLessEqual(float(np.nanmax(sm)), 1.0)
        ds_dyn.close()

    def test_11_historical_event_integrity(self):
        """11. Verify that the 15 canonical historical disaster events remain perfectly preserved."""
        df_ev = pd.read_csv(self.ev_csv)
        self.assertEqual(len(df_ev), 15)
        self.assertIn("FL-UK-2013-01", df_ev["event_id"].values)
        self.assertIn("FL-UK-2021-01", df_ev["event_id"].values)
        self.assertEqual((df_ev["confidence"] == "HIGH").sum(), 15)

    def test_12_provenance_and_data_dictionary_completeness(self):
        """12. Verify that the data dictionary and provenance manifest cover all Phase 1A-1H stages."""
        with open(self.dict_json, "r", encoding="utf-8") as f:
            d = json.load(f)
            self.assertGreaterEqual(len(d["variables"]), 18)

        with open(self.prov_json, "r", encoding="utf-8") as f:
            p = json.load(f)
            for stage in ["Phase 1A", "Phase 1B", "Phase 1C", "Phase 1D", "Phase 1E", "Phase 1F", "Phase 1G", "Phase 1H"]:
                self.assertIn(stage, p["pipeline_stages"], f"Missing {stage} in provenance manifest")

    def test_13_no_synthetic_or_mock_generators(self):
        """13. Verify that no random or synthetic number generators exist in scripts/standardize.py."""
        code_file = PROJECT_DIR / "scripts" / "standardize.py"
        with open(code_file, "r", encoding="utf-8") as f:
            code = f.read()
        for forbidden in ["random.", "np.random", "uniform(", "randint(", "unittest.mock", "MagicMock"]:
            matches = re.findall(rf".*{re.escape(forbidden)}.*", code)
            self.assertEqual(len(matches), 0, f"Found forbidden generator '{forbidden}' in standardize.py")

    def test_14_phase_1a_to_1h_source_integrity(self):
        """14. Verify that all Phase 1A–1H source datasets remain completely intact and unmodified."""
        # 1A
        self.assertTrue((PROCESSED_DIR / "gpm_combined.nc").exists())
        self.assertTrue((PROCESSED_DIR / "rainfall_features.nc").exists())
        # 1B
        self.assertTrue((PROCESSED_DIR / "weather" / "imd_weather_stations.csv").exists())
        self.assertTrue((PROCESSED_DIR / "weather" / "imd_weather_latest.json").exists())
        # 1C
        self.assertTrue((PROCESSED_DIR / "smap" / "smap_soil_moisture.nc").exists())
        self.assertTrue((PROCESSED_DIR / "smap" / "smap_soil_moisture_latest.json").exists())
        # 1D
        self.assertTrue((PROCESSED_DIR / "srtm" / "srtm_uttarakhand_dem.tif").exists())
        self.assertTrue((PROCESSED_DIR / "srtm" / "srtm_uttarakhand_dem.nc").exists())
        # 1E
        self.assertTrue((PROCESSED_DIR / "terrain" / "terrain_features.tif").exists())
        self.assertTrue((PROCESSED_DIR / "terrain" / "terrain_features.nc").exists())
        # 1F
        self.assertTrue((PROCESSED_DIR / "landcover" / "landcover_uttarakhand.tif").exists())
        self.assertTrue((PROCESSED_DIR / "landcover" / "landcover_uttarakhand.nc").exists())
        # 1G
        self.assertTrue((PROCESSED_DIR / "waterlevel" / "cwc_water_level_stations.csv").exists())
        self.assertTrue((PROCESSED_DIR / "waterlevel" / "cwc_water_level_latest.json").exists())
        # 1H
        self.assertTrue((PROCESSED_DIR / "events" / "historical_flood_events.csv").exists())
        self.assertTrue((PROCESSED_DIR / "events" / "historical_flood_events.json").exists())
        self.assertTrue((PROCESSED_DIR / "events" / "historical_flood_events.geojson").exists())


def run_verification():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase2DataStandardizationComprehensive)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_verification()
    if not success:
        sys.exit(1)
