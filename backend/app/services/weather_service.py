"""
FlashFloodAI Backend — OpenWeather Integration Service
Handles fetching, caching, and normalizing live weather and forecast data from OpenWeather API.
"""

import os
import time
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import httpx

from app.config import settings

logger = logging.getLogger("FlashFloodAI.WeatherService")

OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"
CACHE_TTL_SECONDS = 900  # 15 minutes cache TTL


class WeatherService:
    """Service to interact with OpenWeather API with in-memory caching and error handling."""

    _instance: Optional["WeatherService"] = None

    def __init__(self):
        self._current_cache: Dict[str, Dict[str, Any]] = {}
        self._forecast_cache: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def get_instance(cls) -> "WeatherService":
        if cls._instance is None:
            cls._instance = WeatherService()
        return cls._instance

    def _get_api_key(self) -> Optional[str]:
        key = settings.OPENWEATHER_API_KEY or os.getenv("OPENWEATHER_API_KEY")
        if not key or key.strip() == "" or key.strip() == "YOUR_OPENWEATHER_API_KEY":
            return None
        return key.strip()

    def _make_cache_key(self, lat: float, lon: float) -> str:
        return f"{round(lat, 2)},{round(lon, 2)}"

    def get_current_weather(self, lat: float, lon: float, location_name: Optional[str] = None) -> Dict[str, Any]:
        """Fetches normalized current weather conditions for given coordinates."""
        api_key = self._get_api_key()
        cache_key = self._make_cache_key(lat, lon)
        now = time.time()

        # Check in-memory cache
        if cache_key in self._current_cache:
            cached_item = self._current_cache[cache_key]
            if now - cached_item["timestamp"] < CACHE_TTL_SECONDS:
                logger.info(f"Returning cached current weather for ({lat}, {lon})")
                return cached_item["data"]

        if not api_key:
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "detail": "OpenWeather API key is not configured in backend environment.",
                "weather_source": "OpenWeather",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }

        url = f"{OPENWEATHER_BASE_URL}/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        }

        try:
            resp = httpx.get(url, params=params, timeout=10.0)

            if resp.status_code == 401:
                logger.error("OpenWeather API key is invalid or unauthorized.")
                return {
                    "success": False,
                    "status": "INVALID_KEY",
                    "detail": "OpenWeather API key is invalid or not activated.",
                    "weather_source": "OpenWeather",
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }
            elif resp.status_code == 429:
                logger.warning("OpenWeather API rate limit reached.")
                if cache_key in self._current_cache:
                    cached_data = dict(self._current_cache[cache_key]["data"])
                    cached_data["is_stale"] = True
                    return cached_data
                return {
                    "success": False,
                    "status": "RATE_LIMITED",
                    "detail": "OpenWeather API rate limit exceeded.",
                    "weather_source": "OpenWeather",
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }
            elif resp.status_code != 200:
                logger.error(f"OpenWeather HTTP error {resp.status_code}: {resp.text}")
                if cache_key in self._current_cache:
                    cached_data = dict(self._current_cache[cache_key]["data"])
                    cached_data["is_stale"] = True
                    return cached_data
                return {
                    "success": False,
                    "status": "API_ERROR",
                    "detail": f"OpenWeather returned HTTP error {resp.status_code}.",
                    "weather_source": "OpenWeather",
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }

            raw = resp.json()
            normalized = self._normalize_current(raw, lat, lon, location_name)

            self._current_cache[cache_key] = {
                "timestamp": now,
                "data": normalized,
            }
            return normalized

        except httpx.RequestError as exc:
            logger.error(f"Network error calling OpenWeather: {exc}")
            if cache_key in self._current_cache:
                cached_data = dict(self._current_cache[cache_key]["data"])
                cached_data["is_stale"] = True
                return cached_data
            return {
                "success": False,
                "status": "NETWORK_ERROR",
                "detail": "Network failure connecting to OpenWeather service.",
                "weather_source": "OpenWeather",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }

    def get_forecast(self, lat: float, lon: float, location_name: Optional[str] = None) -> Dict[str, Any]:
        """Fetches and normalizes 5-day / 3-hour forecast, providing hourly (next 24h) and daily summaries."""
        api_key = self._get_api_key()
        cache_key = self._make_cache_key(lat, lon)
        now = time.time()

        if cache_key in self._forecast_cache:
            cached_item = self._forecast_cache[cache_key]
            if now - cached_item["timestamp"] < CACHE_TTL_SECONDS:
                logger.info(f"Returning cached forecast for ({lat}, {lon})")
                return cached_item["data"]

        if not api_key:
            return {
                "success": False,
                "status": "UNAVAILABLE",
                "detail": "OpenWeather API key is not configured in backend environment.",
                "weather_source": "OpenWeather",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }

        url = f"{OPENWEATHER_BASE_URL}/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        }

        try:
            resp = httpx.get(url, params=params, timeout=10.0)

            if resp.status_code == 401:
                return {
                    "success": False,
                    "status": "INVALID_KEY",
                    "detail": "OpenWeather API key is invalid or not activated.",
                    "weather_source": "OpenWeather",
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }
            elif resp.status_code != 200:
                if cache_key in self._forecast_cache:
                    cached_data = dict(self._forecast_cache[cache_key]["data"])
                    cached_data["is_stale"] = True
                    return cached_data
                return {
                    "success": False,
                    "status": "API_ERROR",
                    "detail": f"OpenWeather forecast returned HTTP error {resp.status_code}.",
                    "weather_source": "OpenWeather",
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }

            raw = resp.json()
            normalized = self._normalize_forecast(raw, lat, lon, location_name)

            self._forecast_cache[cache_key] = {
                "timestamp": now,
                "data": normalized,
            }
            return normalized

        except httpx.RequestError as exc:
            logger.error(f"Network error calling OpenWeather forecast: {exc}")
            if cache_key in self._forecast_cache:
                cached_data = dict(self._forecast_cache[cache_key]["data"])
                cached_data["is_stale"] = True
                return cached_data
            return {
                "success": False,
                "status": "NETWORK_ERROR",
                "detail": "Network failure connecting to OpenWeather service.",
                "weather_source": "OpenWeather",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            }

    def _normalize_current(self, raw: Dict[str, Any], lat: float, lon: float, custom_name: Optional[str]) -> Dict[str, Any]:
        main = raw.get("main", {})
        weather_list = raw.get("weather", [{}])
        weather_obj = weather_list[0] if weather_list else {}
        wind = raw.get("wind", {})
        clouds = raw.get("clouds", {})
        sys_obj = raw.get("sys", {})
        rain = raw.get("rain", {})

        rainfall_mm = 0.0
        if isinstance(rain, dict):
            if "1h" in rain:
                rainfall_mm = float(rain["1h"])
            elif "3h" in rain:
                rainfall_mm = float(rain["3h"])

        location_display = custom_name or raw.get("name") or "Uttarakhand Region"

        return {
            "success": True,
            "status": "OK",
            "location_name": location_display,
            "lat": lat,
            "lon": lon,
            "temp_c": round(float(main.get("temp", 0)), 1),
            "feels_like_c": round(float(main.get("feels_like", 0)), 1),
            "temp_min_c": round(float(main.get("temp_min", 0)), 1),
            "temp_max_c": round(float(main.get("temp_max", 0)), 1),
            "humidity_pct": int(main.get("humidity", 0)),
            "pressure_hpa": int(main.get("pressure", 1013)),
            "condition": weather_obj.get("main", "Clear"),
            "description": weather_obj.get("description", "Clear sky").capitalize(),
            "icon": weather_obj.get("icon", "01d"),
            "wind_speed_kmh": round(float(wind.get("speed", 0)) * 3.6, 1),
            "wind_deg": int(wind.get("deg", 0)),
            "cloud_cover_pct": int(clouds.get("all", 0)),
            "visibility_km": round(float(raw.get("visibility", 10000)) / 1000.0, 1) if "visibility" in raw else None,
            "rainfall_1h_mm": round(rainfall_mm, 1),
            "sunrise_utc": sys_obj.get("sunrise"),
            "sunset_utc": sys_obj.get("sunset"),
            "data_timestamp_utc": datetime.fromtimestamp(raw.get("dt", time.time()), tz=timezone.utc).isoformat(),
            "last_updated_time": datetime.now(timezone.utc).strftime("%H:%M UTC"),
            "is_cached": False,
            "is_stale": False,
            "weather_source": "OpenWeather",
        }

    def _normalize_forecast(self, raw: Dict[str, Any], lat: float, lon: float, custom_name: Optional[str]) -> Dict[str, Any]:
        forecast_list = raw.get("list", [])
        location_display = custom_name or raw.get("city", {}).get("name") or "Uttarakhand Region"

        # 1. Hourly Forecast (Next 24 hours -> Next 8 x 3-hour intervals)
        hourly_items: List[Dict[str, Any]] = []
        for item in forecast_list[:8]:
            dt = item.get("dt", 0)
            dt_obj = datetime.fromtimestamp(dt, tz=timezone.utc)
            main = item.get("main", {})
            weather_list = item.get("weather", [{}])
            w_obj = weather_list[0] if weather_list else {}
            rain_obj = item.get("rain", {})
            rain_3h = float(rain_obj.get("3h", 0.0)) if isinstance(rain_obj, dict) else 0.0

            hourly_items.append({
                "timestamp_utc": dt_obj.isoformat(),
                "time_label": dt_obj.strftime("%H:%M"),
                "temp_c": round(float(main.get("temp", 0)), 1),
                "condition": w_obj.get("main", "Clear"),
                "description": w_obj.get("description", "").capitalize(),
                "icon": w_obj.get("icon", "01d"),
                "pop_pct": round(float(item.get("pop", 0.0)) * 100),
                "rainfall_3h_mm": round(rain_3h, 1),
                "wind_speed_kmh": round(float(item.get("wind", {}).get("speed", 0)) * 3.6, 1),
            })

        # 2. Daily Forecast Aggregation (Grouping 3-hour intervals by date)
        daily_groups: Dict[str, List[Dict[str, Any]]] = {}
        for item in forecast_list:
            dt_txt = item.get("dt_txt", "")
            date_key = dt_txt.split(" ")[0] if " " in dt_txt else datetime.fromtimestamp(item.get("dt", 0), tz=timezone.utc).strftime("%Y-%m-%d")
            if date_key not in daily_groups:
                daily_groups[date_key] = []
            daily_groups[date_key].append(item)

        daily_items: List[Dict[str, Any]] = []
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        for idx, (date_key, items) in enumerate(daily_groups.items()):
            if len(daily_items) >= 5:
                break

            temps = [it.get("main", {}).get("temp", 0) for it in items]
            min_temp = round(float(min(temps)), 1) if temps else 0.0
            max_temp = round(float(max(temps)), 1) if temps else 0.0

            pops = [it.get("pop", 0.0) for it in items]
            max_pop_pct = round(float(max(pops)) * 100) if pops else 0

            total_rain = 0.0
            for it in items:
                r_obj = it.get("rain", {})
                if isinstance(r_obj, dict) and "3h" in r_obj:
                    total_rain += float(r_obj["3h"])

            mid_item = items[len(items) // 2]
            w_obj = mid_item.get("weather", [{}])[0] if mid_item.get("weather") else {}

            date_dt = datetime.strptime(date_key, "%Y-%m-%d")
            if date_key == today_str:
                day_label = "Today"
            elif idx == 1:
                day_label = "Tomorrow"
            else:
                day_label = date_dt.strftime("%a, %b %d")

            daily_items.append({
                "date": date_key,
                "day_label": day_label,
                "temp_min_c": min_temp,
                "temp_max_c": max_temp,
                "condition": w_obj.get("main", "Clear"),
                "description": w_obj.get("description", "").capitalize(),
                "icon": w_obj.get("icon", "01d"),
                "pop_pct": max_pop_pct,
                "rainfall_total_mm": round(total_rain, 1),
            })

        return {
            "success": True,
            "status": "OK",
            "location_name": location_display,
            "lat": lat,
            "lon": lon,
            "hourly": hourly_items,
            "daily": daily_items,
            "is_cached": False,
            "is_stale": False,
            "weather_source": "OpenWeather",
        }
