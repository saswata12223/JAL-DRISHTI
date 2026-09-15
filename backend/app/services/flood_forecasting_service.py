"""
JalDrishti Backend — Flood Forecasting ML Service
Manages real-time sensor observation ingestion, sliding window temporal feature calculation,
supervised XGBoost ML model inference, SQLite time-series persistence, and live dashboard broadcasting.
"""

import sqlite3
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.schemas.flood_forecasting import (
    FloodPredictRequest,
    FloodPredictResponse,
    LiveForecastSummary,
    RainfallHistoryItem,
)

logger = logging.getLogger("JalDrishti.FloodForecastingService")

PROJECT_DIR = Path(__file__).resolve().parents[3]
DB_DIR = PROJECT_DIR / "data" / "processed" / "timeseries"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "sensor_timeseries.db"


class FloodForecastingService:
    """Singleton service for real-time flood forecasting and rainfall time-series analytics."""

    _instance: Optional["FloodForecastingService"] = None

    def __init__(self):
        self._init_db()
        self._init_ml()
        self.latest_forecast: Optional[Dict[str, Any]] = None
        self._load_recent_history()

    @classmethod
    def get_instance(cls) -> "FloodForecastingService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _init_db(self):
        """Initializes SQLite time-series storage table."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    CREATE TABLE IF NOT EXISTS sensor_observations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        timestamp TEXT NOT NULL,
                        epoch REAL NOT NULL,
                        raw_rain_value REAL NOT NULL,
                        normalized_intensity REAL NOT NULL,
                        water_level_m REAL NOT NULL,
                        rain_5m REAL NOT NULL,
                        rain_15m REAL NOT NULL,
                        rain_30m REAL NOT NULL,
                        rain_1h REAL NOT NULL,
                        rain_3h REAL NOT NULL,
                        rain_6h REAL NOT NULL,
                        rate_of_change REAL NOT NULL,
                        rain_duration_min REAL NOT NULL,
                        flood_probability REAL,
                        risk_level TEXT,
                        model_version TEXT
                    )
                    """
                )
                conn.commit()
            logger.info(f"Initialized time-series SQLite database at {DB_PATH}")
        except Exception as e:
            logger.error(f"Failed to initialize SQLite database: {e}")

    def _init_ml(self):
        """Loads time-series buffer and ML model."""
        from ml.time_series_features import RainfallTimeSeriesBuffer
        from ml.flood_forecaster import FloodForecaster

        self.buffer = RainfallTimeSeriesBuffer(max_records=1000)
        self.forecaster = FloodForecaster()
        if self.forecaster.is_trained():
            logger.info("Loaded trained FloodForecaster XGBoost model.")
        else:
            logger.warning("FloodForecaster model binary not found, fallback enabled.")

    def _load_recent_history(self):
        """Pre-populates buffer with recent observations from database if available."""
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT epoch, raw_rain_value, normalized_intensity, water_level_m
                    FROM sensor_observations
                    ORDER BY epoch DESC
                    LIMIT 200
                    """
                )
                rows = cursor.fetchall()
                for row in reversed(rows):
                    self.buffer.buffer.append({
                        "epoch": row[0],
                        "raw": row[1],
                        "intensity": row[2],
                        "water_level": row[3],
                    })
                if self.buffer.buffer:
                    self.buffer.last_observation_time = self.buffer.buffer[-1]["epoch"]
                    self._update_forecast()
        except Exception as e:
            logger.warning(f"Could not load recent history into buffer: {e}")

    def ingest_sensor_reading(
        self,
        raw_sensor_value: float,
        water_level_m: Optional[float] = None,
        timestamp_epoch: Optional[float] = None,
        is_simulated: bool = False,
    ) -> LiveForecastSummary:
        """
        Ingests a new raw Arduino rain sensor reading, calculates rolling temporal proxy features,
        runs the ML model inference, persists to SQLite, and updates the latest forecast state.
        """
        now_epoch = timestamp_epoch if timestamp_epoch is not None else datetime.now(timezone.utc).timestamp()
        wl = float(water_level_m) if water_level_m is not None else 1.80

        # 1. Append to sliding window and compute rolling proxy features
        features = self.buffer.add_observation(
            raw_sensor_value=raw_sensor_value,
            timestamp_epoch=now_epoch,
            water_level_m=wl,
        )

        # 2. Check data sufficiency
        if not features.get("is_sufficient", False):
            summary = LiveForecastSummary(
                status="INSUFFICIENT_DATA",
                is_sufficient=False,
                message=features.get("message", "Insufficient historical observations for valid forecast."),
                raw_sensor_value=features.get("current_raw_value", raw_sensor_value),
                current_rain_intensity=features.get("current_rain_intensity", 0.0),
                water_level_m=wl,
                data_age_seconds=features.get("data_age_sec", 0.0),
                last_updated_display=datetime.fromtimestamp(now_epoch, timezone.utc).strftime("%H:%M:%S IST"),
                sample_count=features.get("sample_count", 0),
            )
            self.latest_forecast = summary.model_dump()
            return summary

        # 3. Execute ML Inference
        pred_res = self.forecaster.predict(features)
        flood_prob = pred_res["flood_probability"]
        risk_level = pred_res["risk_level"]
        horizon = pred_res["forecast_horizon"]
        confidence = pred_res["model_confidence"]
        model_name = pred_res["model_name"]
        model_ver = pred_res["model_version"]

        # 4. Persist to SQLite
        try:
            with sqlite3.connect(DB_PATH) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO sensor_observations (
                        timestamp, epoch, raw_rain_value, normalized_intensity, water_level_m,
                        rain_5m, rain_15m, rain_30m, rain_1h, rain_3h, rain_6h,
                        rate_of_change, rain_duration_min, flood_probability, risk_level, model_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        datetime.fromtimestamp(now_epoch, timezone.utc).isoformat(),
                        now_epoch,
                        features["raw_sensor_value"],
                        features["current_rain_intensity"],
                        wl,
                        features["rain_5m"],
                        features["rain_15m"],
                        features["rain_30m"],
                        features["rain_1h"],
                        features["rain_3h"],
                        features["rain_6h"],
                        features["rate_of_change"],
                        features["continuous_rain_duration_min"],
                        flood_prob,
                        risk_level,
                        model_ver,
                    ),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Error persisting sensor observation to SQLite: {e}")

        # 5. Build Summary
        summary = LiveForecastSummary(
            status="VALID",
            is_sufficient=True,
            message="Live real-time ML forecast active.",
            flood_probability=flood_prob,
            risk_level=risk_level,
            forecast_horizon=horizon,
            model_confidence=confidence,
            current_rain_intensity=features["current_rain_intensity"],
            raw_sensor_value=features["raw_sensor_value"],
            water_level_m=wl,
            rainfall_trend=features["rainfall_trend"],
            rate_of_change=features["rate_of_change"],
            continuous_rain_duration_min=features["continuous_rain_duration_min"],
            data_age_seconds=features["data_age_sec"],
            last_updated_display=datetime.fromtimestamp(now_epoch, timezone.utc).strftime("%H:%M:%S IST"),
            sample_count=features["sample_count"],
            model_name=model_name,
        )
        self.latest_forecast = summary.model_dump()
        return summary

    def _update_forecast(self):
        """Internal recalculation from current buffer state."""
        features = self.buffer.compute_features()
        if not features.get("is_sufficient", False):
            self.latest_forecast = {
                "status": "INSUFFICIENT_DATA",
                "is_sufficient": False,
                "message": features.get("message", "Insufficient historical observations."),
                "sample_count": features.get("sample_count", 0),
            }
            return

        pred = self.forecaster.predict(features)
        now_dt = datetime.now(timezone.utc)
        self.latest_forecast = {
            "status": "VALID",
            "is_sufficient": True,
            "message": "Live real-time ML forecast active.",
            "flood_probability": pred["flood_probability"],
            "risk_level": pred["risk_level"],
            "forecast_horizon": pred["forecast_horizon"],
            "model_confidence": pred["model_confidence"],
            "current_rain_intensity": features.get("current_rain_intensity", 0.0),
            "raw_sensor_value": features.get("raw_sensor_value", 1023.0),
            "water_level_m": features.get("water_level_m", 1.80),
            "rainfall_trend": features.get("rainfall_trend", "STEADY"),
            "rate_of_change": features.get("rate_of_change", 0.0),
            "continuous_rain_duration_min": features.get("continuous_rain_duration_min", 0.0),
            "data_age_seconds": features.get("data_age_sec", 0.0),
            "last_updated_display": now_dt.strftime("%H:%M:%S IST"),
            "sample_count": features.get("sample_count", 0),
            "model_name": pred.get("model_name", "XGBoost-TimeSeriesForecaster-v1.0"),
            "feature_type": "sensor-derived proxy rainfall features",
        }

    def get_live_forecast(self) -> LiveForecastSummary:
        """Returns the latest calculated live forecast summary with staleness checking."""
        now_epoch = datetime.now(timezone.utc).timestamp()
        if not self.buffer.buffer:
            return LiveForecastSummary(
                status="INSUFFICIENT_DATA",
                is_sufficient=False,
                message="No Arduino rain sensor observations collected yet.",
                sample_count=0,
            )

        features = self.buffer.compute_features(now_epoch)
        if not features.get("is_sufficient", False):
            return LiveForecastSummary(
                status="INSUFFICIENT_DATA",
                is_sufficient=False,
                message=features.get("message", "Insufficient historical observations."),
                raw_sensor_value=features.get("current_raw_value"),
                current_rain_intensity=features.get("current_rain_intensity"),
                data_age_seconds=features.get("data_age_sec", 0.0),
                sample_count=features.get("sample_count", 0),
            )

        if not features.get("is_fresh", True):
            # Sensor is stale / disconnected (> 45 seconds since last transmission)
            pred = self.forecaster.predict(features)
            return LiveForecastSummary(
                status="STALE_SENSOR",
                is_sufficient=True,
                message=f"Sensor offline/stale (last seen {int(features['data_age_sec'])}s ago). Showing cached forecast.",
                flood_probability=pred["flood_probability"],
                risk_level=pred["risk_level"],
                forecast_horizon=pred["forecast_horizon"],
                model_confidence=max(40.0, pred["model_confidence"] - 25.0),
                current_rain_intensity=features["current_rain_intensity"],
                raw_sensor_value=features["raw_sensor_value"],
                water_level_m=features["water_level_m"],
                rainfall_trend=features["rainfall_trend"],
                rate_of_change=features["rate_of_change"],
                continuous_rain_duration_min=features["continuous_rain_duration_min"],
                data_age_seconds=features["data_age_sec"],
                last_updated_display=datetime.fromtimestamp(features["timestamp_epoch"], timezone.utc).strftime("%H:%M:%S IST"),
                sample_count=features["sample_count"],
                model_name=pred["model_name"],
            )

        pred = self.forecaster.predict(features)
        return LiveForecastSummary(
            status="VALID",
            is_sufficient=True,
            message="Live real-time ML forecast active.",
            flood_probability=pred["flood_probability"],
            risk_level=pred["risk_level"],
            forecast_horizon=pred["forecast_horizon"],
            model_confidence=pred["model_confidence"],
            current_rain_intensity=features["current_rain_intensity"],
            raw_sensor_value=features["raw_sensor_value"],
            water_level_m=features["water_level_m"],
            rainfall_trend=features["rainfall_trend"],
            rate_of_change=features["rate_of_change"],
            continuous_rain_duration_min=features["continuous_rain_duration_min"],
            data_age_seconds=features["data_age_sec"],
            last_updated_display=datetime.fromtimestamp(now_epoch, timezone.utc).strftime("%H:%M:%S IST"),
            sample_count=features["sample_count"],
            model_name=pred["model_name"],
        )

    def predict_custom_features(self, req: FloodPredictRequest) -> FloodPredictResponse:
        """Executes explicit on-demand feature-based prediction."""
        feat_dict = req.model_dump()
        pred = self.forecaster.predict(feat_dict)
        return FloodPredictResponse(**pred)

    def get_history(self, window_seconds: float = 3600) -> List[RainfallHistoryItem]:
        """Returns chronological time-series observations for frontend trend graphs."""
        history = self.buffer.get_history_samples(window_seconds=window_seconds)
        items = []
        for h in history:
            items.append(RainfallHistoryItem(**h))
        return items
