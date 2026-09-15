"""
JalDrishti — Rainfall Time-Series Feature Engineering Engine
Processes timestamped raw Arduino rain sensor observations and computes rolling temporal features.

IMPORTANT:
Analog rain sensor readings (ADC 0-1023) are rain-detection/intensity proxies and are NOT
claimed to be direct millimeters without calibrated tipping bucket hardware.
All rolling features are explicitly labeled as sensor-derived proxy features.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from collections import deque
import math


def normalize_sensor_reading(raw_value: float, v_min: float = 0.0, v_max: float = 1023.0) -> float:
    """
    Normalizes raw analog rain sensor ADC reading (typically 1023 = completely dry, 0 = saturated wet)
    into a continuous rain intensity proxy [0.0 = completely dry, 1.0 = maximum torrential saturation].
    """
    if math.isnan(raw_value) or math.isinf(raw_value):
        return 0.0
    clamped = max(v_min, min(v_max, float(raw_value)))
    # Inverted ADC logic: 1023 (dry) -> 0.0, 0 (wet) -> 1.0
    normalized = (v_max - clamped) / (v_max - v_min)
    return round(float(normalized), 4)


class RainfallTimeSeriesBuffer:
    """
    Thread-safe in-memory sliding window buffer of timestamped rain observations.
    Computes rolling temporal proxy features: 5m, 15m, 30m, 1h, 3h, 6h cumulative activity,
    rate-of-change, rainfall trend, and continuous rain duration.
    """

    def __init__(self, max_records: int = 1000):
        self.max_records = max_records
        # Deque of tuples: (epoch_seconds, raw_value, normalized_intensity, water_level_m)
        self.buffer: deque = deque(maxlen=max_records)
        self.last_observation_time: Optional[float] = None

    def add_observation(
        self,
        raw_sensor_value: float,
        timestamp_epoch: Optional[float] = None,
        water_level_m: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Appends a new observation and returns the latest calculated feature set.
        """
        now_epoch = timestamp_epoch if timestamp_epoch is not None else datetime.now(timezone.utc).timestamp()
        norm_intensity = normalize_sensor_reading(raw_sensor_value)
        wl = float(water_level_m) if water_level_m is not None else 1.80

        entry = {
            "epoch": now_epoch,
            "raw": float(raw_sensor_value),
            "intensity": norm_intensity,
            "water_level": wl,
        }

        self.buffer.append(entry)
        self.last_observation_time = now_epoch
        return self.compute_features(now_epoch)

    def is_data_sufficient(self, min_samples: int = 3) -> bool:
        """Returns True if enough historical observations exist for valid forecasting."""
        return len(self.buffer) >= min_samples

    def is_sensor_fresh(self, max_staleness_sec: float = 45.0, current_epoch: Optional[float] = None) -> bool:
        """Returns True if the most recent sensor reading arrived within the staleness window."""
        if not self.buffer or self.last_observation_time is None:
            return False
        now_epoch = current_epoch if current_epoch is not None else datetime.now(timezone.utc).timestamp()
        return (now_epoch - self.last_observation_time) <= max_staleness_sec

    def compute_features(self, target_epoch: Optional[float] = None) -> Dict[str, Any]:
        """
        Calculates all rolling time-series features up to target_epoch.
        """
        if not self.buffer:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": "No sensor observations recorded yet.",
                "sample_count": 0,
                "is_sufficient": False,
            }

        now_epoch = target_epoch if target_epoch is not None else datetime.now(timezone.utc).timestamp()
        latest = self.buffer[-1]
        data_age_sec = max(0.0, now_epoch - latest["epoch"])

        if len(self.buffer) < 3:
            return {
                "status": "INSUFFICIENT_DATA",
                "message": f"Only {len(self.buffer)} observations collected (minimum 3 required).",
                "sample_count": len(self.buffer),
                "is_sufficient": False,
                "current_raw_value": latest["raw"],
                "current_rain_intensity": latest["intensity"],
                "data_age_sec": round(data_age_sec, 1),
            }

        # Convert buffer to list for window filtering
        records = list(self.buffer)

        def cumulative_proxy(window_seconds: float) -> float:
            cutoff = now_epoch - window_seconds
            window_pts = [r for r in records if r["epoch"] >= cutoff]
            if not window_pts:
                return 0.0
            # Weighted area under the curve / mean intensity over window scaled to proxy units
            mean_intensity = sum(r["intensity"] for r in window_pts) / len(window_pts)
            # Duration in hours within this window (capped at window span)
            actual_span_h = min(window_seconds, max(60.0, now_epoch - window_pts[0]["epoch"])) / 3600.0
            # Proxy cumulative index: Mean intensity * span * calibration factor (100.0)
            return round(mean_intensity * actual_span_h * 100.0, 2)

        rain_5m = cumulative_proxy(5 * 60)
        rain_15m = cumulative_proxy(15 * 60)
        rain_30m = cumulative_proxy(30 * 60)
        rain_1h = cumulative_proxy(60 * 60)
        rain_3h = cumulative_proxy(3 * 3600)
        rain_6h = cumulative_proxy(6 * 3600)

        # Rate of change calculation (derivative of intensity over last 3-5 mins)
        roc = 0.0
        trend = "STEADY"
        recent_pts = [r for r in records if (now_epoch - r["epoch"]) <= 300]
        if len(recent_pts) >= 2:
            dt = recent_pts[-1]["epoch"] - recent_pts[0]["epoch"]
            if dt > 5:
                di = recent_pts[-1]["intensity"] - recent_pts[0]["intensity"]
                roc = round(float(di / (dt / 60.0)), 4)  # change per minute

        if roc > 0.02:
            trend = "RISING"
        elif roc < -0.02:
            trend = "FALLING"
        else:
            trend = "STEADY"

        # Continuous rain duration (duration where intensity >= 0.08)
        continuous_rain_sec = 0.0
        for i in range(len(records) - 1, -1, -1):
            if records[i]["intensity"] >= 0.08:
                continuous_rain_sec = now_epoch - records[i]["epoch"]
            else:
                break
        continuous_rain_min = round(continuous_rain_sec / 60.0, 1)

        return {
            "status": "VALID",
            "is_sufficient": True,
            "sample_count": len(records),
            "timestamp_epoch": now_epoch,
            "timestamp_iso": datetime.fromtimestamp(now_epoch, timezone.utc).isoformat(),
            "raw_sensor_value": latest["raw"],
            "current_rain_intensity": latest["intensity"],
            "rain_5m": rain_5m,
            "rain_15m": rain_15m,
            "rain_30m": rain_30m,
            "rain_1h": rain_1h,
            "rain_3h": rain_3h,
            "rain_6h": rain_6h,
            "rate_of_change": roc,
            "rainfall_trend": trend,
            "continuous_rain_duration_min": continuous_rain_min,
            "water_level_m": latest["water_level"],
            "data_age_sec": round(data_age_sec, 1),
            "is_fresh": data_age_sec <= 45.0,
            "feature_type": "sensor-derived proxy rainfall features",
        }

    def get_history_samples(self, window_seconds: float = 3600) -> List[Dict[str, Any]]:
        """Returns history items formatted for trend charts."""
        now_epoch = datetime.now(timezone.utc).timestamp()
        cutoff = now_epoch - window_seconds
        pts = [r for r in self.buffer if r["epoch"] >= cutoff]
        return [
            {
                "timestamp_iso": datetime.fromtimestamp(p["epoch"], timezone.utc).isoformat(),
                "time_display": datetime.fromtimestamp(p["epoch"], timezone.utc).strftime("%H:%M:%S"),
                "raw_value": p["raw"],
                "rain_intensity": p["intensity"],
                "water_level_m": p["water_level"],
            }
            for p in pts
        ]

    def clear(self):
        """Resets the buffer."""
        self.buffer.clear()
        self.last_observation_time = None
