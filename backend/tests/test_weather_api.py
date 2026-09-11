"""
FlashFloodAI Backend — OpenWeather API Route Acceptance Tests
Tests live weather and forecast endpoints, caching, error handling, and mock API integration.
"""

import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.services.weather_service import WeatherService


class TestWeatherAPIEndpoints(unittest.TestCase):
    """Test suite covering OpenWeather API endpoints and WeatherService behavior."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        # Reset weather service cache between test cases
        service = WeatherService.get_instance()
        service._current_cache.clear()
        service._forecast_cache.clear()

    def test_current_weather_unconfigured_key(self):
        """Test GET /api/v1/weather/current when API key is unconfigured."""
        service = WeatherService.get_instance()
        with patch.object(service, "_get_api_key", return_value=None):
            res = self.client.get("/api/v1/weather/current")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertFalse(data.get("success"))
            self.assertEqual(data.get("status"), "UNAVAILABLE")
            self.assertIn("weather_source", data)

    def test_forecast_unconfigured_key(self):
        """Test GET /api/v1/weather/forecast when API key is unconfigured."""
        service = WeatherService.get_instance()
        with patch.object(service, "_get_api_key", return_value=None):
            res = self.client.get("/api/v1/weather/forecast")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertFalse(data.get("success"))
            self.assertEqual(data.get("status"), "UNAVAILABLE")

    def test_current_weather_mock_success(self):
        """Test GET /api/v1/weather/current with valid mock OpenWeather response."""
        mock_raw = {
            "name": "Rishikesh",
            "dt": 1693564800,
            "main": {
                "temp": 26.5,
                "feels_like": 28.2,
                "temp_min": 24.0,
                "temp_max": 28.0,
                "pressure": 1008,
                "humidity": 78,
            },
            "weather": [
                {"main": "Rain", "description": "heavy intensity rain", "icon": "10d"}
            ],
            "wind": {"speed": 4.5, "deg": 140},
            "clouds": {"all": 85},
            "visibility": 8000,
            "rain": {"1h": 14.5},
            "sys": {"sunrise": 1693526400, "sunset": 1693573200},
        }

        mock_http_resp = MagicMock()
        mock_http_resp.status_code = 200
        mock_http_resp.json.return_value = mock_raw

        service = WeatherService.get_instance()
        with patch.object(service, "_get_api_key", return_value="dummy_mock_key"):
            with patch("httpx.get", return_value=mock_http_resp):
                res = self.client.get("/api/v1/weather/current?lat=30.108&lon=78.298&location=Rishikesh")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertTrue(data.get("success"))
                self.assertEqual(data.get("status"), "OK")
                self.assertEqual(data.get("location_name"), "Rishikesh")
                self.assertEqual(data.get("temp_c"), 26.5)
                self.assertEqual(data.get("feels_like_c"), 28.2)
                self.assertEqual(data.get("condition"), "Rain")
                self.assertEqual(data.get("humidity_pct"), 78)
                self.assertEqual(data.get("rainfall_1h_mm"), 14.5)
                self.assertEqual(data.get("visibility_km"), 8.0)
                self.assertEqual(data.get("weather_source"), "OpenWeather")

    def test_forecast_mock_success(self):
        """Test GET /api/v1/weather/forecast with valid mock OpenWeather 5-day forecast response."""
        mock_raw = {
            "city": {"name": "Uttarakhand Region"},
            "list": [
                {
                    "dt": 1693564800 + i * 10800,
                    "dt_txt": f"2026-09-07 {i*3:02d}:00:00",
                    "main": {"temp": 20.0 + i, "humidity": 70},
                    "weather": [{"main": "Clouds", "description": "few clouds", "icon": "02d"}],
                    "pop": 0.3 + (i * 0.05),
                    "rain": {"3h": 2.5 if i % 2 == 0 else 0.0},
                    "wind": {"speed": 3.0},
                }
                for i in range(12)
            ],
        }

        mock_http_resp = MagicMock()
        mock_http_resp.status_code = 200
        mock_http_resp.json.return_value = mock_raw

        service = WeatherService.get_instance()
        with patch.object(service, "_get_api_key", return_value="dummy_mock_key"):
            with patch("httpx.get", return_value=mock_http_resp):
                res = self.client.get("/api/v1/weather/forecast?lat=30.0668&lon=79.0193")
                self.assertEqual(res.status_code, 200)
                data = res.json()
                self.assertTrue(data.get("success"))
                self.assertIn("hourly", data)
                self.assertIn("daily", data)
                self.assertLessEqual(len(data["hourly"]), 8)
                self.assertGreater(len(data["daily"]), 0)

    def test_weather_caching_behavior(self):
        """Test that consecutive requests return cached data within TTL."""
        mock_raw = {
            "name": "Dehradun",
            "dt": 1693564800,
            "main": {"temp": 22.0, "humidity": 60, "pressure": 1012},
            "weather": [{"main": "Clear", "description": "clear sky", "icon": "01d"}],
            "wind": {"speed": 2.0},
            "clouds": {"all": 10},
        }
        mock_http_resp = MagicMock()
        mock_http_resp.status_code = 200
        mock_http_resp.json.return_value = mock_raw

        service = WeatherService.get_instance()
        with patch.object(service, "_get_api_key", return_value="dummy_mock_key"):
            with patch("httpx.get", return_value=mock_http_resp) as mock_get:
                # First request -> calls httpx
                res1 = self.client.get("/api/v1/weather/current?lat=30.316&lon=78.032")
                self.assertEqual(res1.status_code, 200)
                self.assertEqual(mock_get.call_count, 1)

                # Second request with same coordinates -> uses cache, call_count stays 1
                res2 = self.client.get("/api/v1/weather/current?lat=30.316&lon=78.032")
                self.assertEqual(res2.status_code, 200)
                self.assertEqual(mock_get.call_count, 1)

    def test_invalid_coordinate_validation(self):
        """Test FastAPI query parameter validation for out-of-range latitude/longitude."""
        res = self.client.get("/api/v1/weather/current?lat=150.0&lon=78.0")
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
