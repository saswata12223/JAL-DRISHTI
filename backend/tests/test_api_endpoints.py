"""
FlashFloodAI Backend — FastAPI API Route Acceptance Tests
Uses Starlette/HTTPX TestClient to test all endpoints.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

proj_dir = backend_dir.parent
if str(proj_dir) not in sys.path:
    sys.path.insert(0, str(proj_dir))

from app.main import app


class TestBackendAPIEndpoints(unittest.TestCase):
    """Test suite covering all FastAPI REST endpoints."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root_endpoint(self):
        """Test root endpoint returns greeting and docs link."""
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "ONLINE")
        self.assertIn("api_v1_docs", data)

    def test_health_endpoint(self):
        """Test GET /api/v1/health."""
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn("version", data)
        self.assertIn("ml_engine_loaded", data)

    def test_stations_endpoint(self):
        """Test GET /api/v1/stations."""
        res = self.client.get("/api/v1/stations")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertGreater(data.get("count"), 0)
        self.assertGreater(len(data.get("data")), 0)

    def test_stations_filter_cwc(self):
        """Test GET /api/v1/stations?station_type=CWC_HYDROLOGICAL."""
        res = self.client.get("/api/v1/stations?station_type=CWC_HYDROLOGICAL")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("count"), 20)
        for s in data["data"]:
            self.assertEqual(s["station_type"], "CWC_HYDROLOGICAL")
            self.assertIsNotNone(s["warning_level_m"])
            self.assertIsNotNone(s["danger_level_m"])
            self.assertIsNotNone(s["hfl_m"])

    def test_station_detail(self):
        """Test GET /api/v1/stations/{station_id}."""
        res = self.client.get("/api/v1/stations/CWC_UK_002")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        stn = data["data"]
        self.assertEqual(stn["station_id"], "CWC_UK_002")
        self.assertEqual(stn["warning_level_m"], 339.5)
        self.assertEqual(stn["danger_level_m"], 340.5)

    def test_historical_events_endpoint(self):
        """Test GET /api/v1/historical-events."""
        res = self.client.get("/api/v1/historical-events")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("count"), 15)

    def test_historical_event_detail(self):
        """Test GET /api/v1/historical-events/FL-UK-2013-01."""
        res = self.client.get("/api/v1/historical-events/FL-UK-2013-01")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        ev = data["data"]
        self.assertEqual(ev["event_id"], "FL-UK-2013-01")
        self.assertIn("Kedarnath", ev["event_name"])

    def test_predictions_endpoint(self):
        """Test GET /api/v1/predictions."""
        res = self.client.get("/api/v1/predictions?limit=50")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("count"), 50)

    def test_predictions_latest_summary(self):
        """Test GET /api/v1/predictions/latest."""
        res = self.client.get("/api/v1/predictions/latest")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        summary = data["data"]
        self.assertIn("risk_class_counts", summary)
        self.assertEqual(summary.get("total_monitored_points"), 8199)

    def test_live_inference_endpoint(self):
        """Test POST /api/v1/predictions/infer."""
        payload = {
            "rainfall_1h_mm": 35.0,
            "rainfall_30min_mm": 18.0,
            "surface_soil_moisture_vol": 0.88,
            "profile_soil_moisture_vol": 0.85,
            "soil_saturation_index": 0.86,
            "elevation_m": 2200.0,
            "slope_deg": 30.0,
            "landcover_class": 10,
        }
        res = self.client.post("/api/v1/predictions/infer", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        inf = data["data"]
        self.assertIn("probability", inf)
        self.assertIn("risk_class", inf)
        self.assertIn("scs_direct_runoff_q_mm", inf)
        self.assertGreaterEqual(inf["probability"], 0.0)
        self.assertLessEqual(inf["probability"], 1.0)

    def test_metadata_endpoint(self):
        """Test GET /api/v1/metadata."""
        res = self.client.get("/api/v1/metadata")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        meta = data["data"]
        self.assertEqual(meta["cwc_monitoring_stations_count"], 20)
        self.assertEqual(meta["historical_disasters_count"], 15)
        self.assertIn("PostGIS", str(meta["database_technologies"]))
        self.assertIn("TimescaleDB", str(meta["database_technologies"]))

    def test_hardware_status_endpoint(self):
        """Test GET /api/v1/hardware/status."""
        res = self.client.get("/api/v1/hardware/status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        hw_data = data["data"]
        self.assertIn("esp32_status", hw_data)
        self.assertIn("buzzer_state", hw_data)
        self.assertIn("rate_of_rise", hw_data)

    def test_hardware_telemetry_post(self):
        """Test POST /api/v1/hardware/telemetry."""
        payload = {
            "device_id": "ESP32_TEST_01",
            "water_level_m": 2.5,
            "rainfall_rate_mm_h": 40.0,
            "accumulated_rain_mm": 50.0,
            "timestamp": "2026-09-08T12:00:00Z"
        }
        res = self.client.post("/api/v1/hardware/telemetry", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertIn("telemetry", data["data"])
        self.assertIn("risk_decision", data["data"])

    def test_hardware_buzzer_test(self):
        """Test POST /api/v1/hardware/buzzer/test."""
        res = self.client.post("/api/v1/hardware/buzzer/test")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"].get("last_buzzer_command"), "ALERT_TEST")

    def test_hardware_buzzer_acknowledge(self):
        """Test POST /api/v1/hardware/buzzer/acknowledge."""
        res = self.client.post("/api/v1/hardware/buzzer/acknowledge")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data["data"].get("ack_received"))
        self.assertEqual(data["data"].get("status"), "ACKNOWLEDGED")


if __name__ == "__main__":
    unittest.main()

