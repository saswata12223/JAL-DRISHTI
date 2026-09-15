import unittest
import os
import sys
import time
from datetime import datetime, timezone

# Ensure project and backend root are in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_ROOT = os.path.join(PROJECT_ROOT, "backend")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from ml.time_series_features import RainfallTimeSeriesBuffer, normalize_sensor_reading
from ml.flood_forecaster import FloodForecaster, classify_forecast_risk
from fastapi.testclient import TestClient
from app.main import app


class TestRainfallFeatureEngineering(unittest.TestCase):
    """Unit tests for sensor normalization and sliding window proxy feature calculations."""

    def test_normalize_rain_sensor_reading(self):
        # ADC 1023 (completely dry) -> intensity 0.0
        self.assertAlmostEqual(normalize_sensor_reading(1023), 0.0, places=2)
        # ADC 0 (submerged / maximum rain) -> intensity 1.0
        self.assertAlmostEqual(normalize_sensor_reading(0), 1.0, places=2)
        # ADC 512 (moderate) -> ~0.5
        self.assertAlmostEqual(normalize_sensor_reading(512), 0.5, places=1)
        # Out of bounds clamping
        self.assertEqual(normalize_sensor_reading(1200), 0.0)
        self.assertEqual(normalize_sensor_reading(-50), 1.0)

    def test_insufficient_data_guard(self):
        buffer = RainfallTimeSeriesBuffer(max_records=100)
        # With 0 samples
        feat = buffer.compute_features(time.time())
        self.assertFalse(feat["is_sufficient"])
        self.assertEqual(feat["status"], "INSUFFICIENT_DATA")

        # With 2 samples
        t = time.time()
        buffer.add_observation(raw_sensor_value=800, timestamp_epoch=t - 60)
        buffer.add_observation(raw_sensor_value=700, timestamp_epoch=t)
        feat = buffer.compute_features(t)
        self.assertFalse(feat["is_sufficient"])
        self.assertEqual(feat["status"], "INSUFFICIENT_DATA")

        # With 3 samples
        buffer.add_observation(raw_sensor_value=500, timestamp_epoch=t + 60)
        feat = buffer.compute_features(t + 60)
        self.assertTrue(feat["is_sufficient"])
        self.assertEqual(feat["status"], "VALID")
        self.assertIn("rain_15m", feat)

    def test_rainfall_trend_and_duration(self):
        buffer = RainfallTimeSeriesBuffer(max_records=100)
        base_t = time.time() - 300
        # Rising intensity over time
        buffer.add_observation(raw_sensor_value=900, timestamp_epoch=base_t)          # intensity ~0.12
        buffer.add_observation(raw_sensor_value=600, timestamp_epoch=base_t + 100)    # intensity ~0.41
        buffer.add_observation(raw_sensor_value=200, timestamp_epoch=base_t + 200)    # intensity ~0.80

        feat = buffer.compute_features(base_t + 200)
        self.assertEqual(feat["rainfall_trend"], "RISING")
        self.assertGreater(feat["rate_of_change"], 0.0)
        self.assertGreater(feat["continuous_rain_duration_min"], 0)


class TestFloodForecasterModel(unittest.TestCase):
    """Unit tests for ML inference, risk classification, and confidence scoring."""

    @classmethod
    def setUpClass(cls):
        cls.forecaster = FloodForecaster()

    def test_model_loaded(self):
        self.assertTrue(self.forecaster.is_trained())

    def test_dry_scenario_prediction(self):
        dry_features = {
            "rain_intensity": 0.0,
            "rain_5m": 0.0,
            "rain_15m": 0.0,
            "rain_30m": 0.0,
            "rain_1h": 0.0,
            "rain_3h": 0.0,
            "rain_6h": 0.0,
            "rate_of_change": 0.0,
            "rain_duration_min": 0.0,
            "water_level_m": 1.8,
        }
        pred = self.forecaster.predict(dry_features)
        self.assertEqual(pred["risk_level"], "LOW")
        self.assertLess(pred["flood_probability"], 0.35)
        self.assertGreaterEqual(pred["model_confidence"], 50.0)

    def test_extreme_storm_scenario_prediction(self):
        storm_features = {
            "rain_intensity": 0.95,
            "rain_5m": 7.5,
            "rain_15m": 22.0,
            "rain_30m": 45.0,
            "rain_1h": 85.0,
            "rain_3h": 180.0,
            "rain_6h": 250.0,
            "rate_of_change": 0.15,
            "rain_duration_min": 120.0,
            "water_level_m": 4.8,
        }
        pred = self.forecaster.predict(storm_features)
        self.assertIn(pred["risk_level"], ["HIGH", "CRITICAL"])
        self.assertGreater(pred["flood_probability"], 0.70)


class TestFloodForecastingAPI(unittest.TestCase):
    """End-to-end FastAPI endpoint tests."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_direct_predict_endpoint(self):
        payload = {
            "rain_intensity": 0.85,
            "rain_5m": 6.8,
            "rain_15m": 20.0,
            "rain_30m": 40.0,
            "rain_1h": 75.0,
            "rain_3h": 150.0,
            "rain_6h": 200.0,
            "rate_of_change": 0.08,
            "rain_duration_min": 45.0,
            "water_level_m": 3.8,
        }
        res = self.client.post("/api/v1/flood/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertIn(data["data"]["risk_level"], ["HIGH", "CRITICAL"])
        self.assertGreater(data["data"]["flood_probability"], 0.60)

    def test_telemetry_ingest_and_latest_forecast(self):
        # Post 4 telemetry samples
        for i in range(4):
            telemetry = {
                "raw_sensor_value": float(300 - (i * 50)),
                "water_level_m": float(2.2 + (i * 0.3)),
                "timestamp_epoch": time.time() - (4 - i) * 60,
                "is_simulated": True,
            }
            post_res = self.client.post("/api/v1/flood/telemetry", json=telemetry)
            self.assertEqual(post_res.status_code, 200)

        # Query latest forecast
        get_res = self.client.get("/api/v1/flood/forecast/latest")
        self.assertEqual(get_res.status_code, 200)
        data = get_res.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertTrue(data["data"]["is_sufficient"])

        # Query rainfall history
        hist_res = self.client.get("/api/v1/flood/history?window_minutes=60")
        self.assertEqual(hist_res.status_code, 200)
        hist_data = hist_res.json()
        self.assertTrue(hist_data["success"])
        self.assertGreaterEqual(len(hist_data["data"]), 4)


if __name__ == "__main__":
    unittest.main()
