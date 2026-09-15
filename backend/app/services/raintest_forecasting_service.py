import threading
import time
import io
import logging
from collections import deque
from datetime import datetime, timezone
import requests
import asyncio

from app.schemas.flood_forecasting import LiveForecastSummary
from app.config import settings

logger = logging.getLogger("FlashFloodAI.RainTestForecastingService")

try:
    from PIL import Image, ImageStat, ImageFilter
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    logger.warning("Pillow (PIL) is not available. ESP32-CAM visual analysis will be disabled.")

SOIL_DRY_RAW = 620
SOIL_WET_RAW = 230

def clamp(v, lo=0, hi=100):
    return max(lo, min(hi, float(v)))

def soil_percent(raw):
    if raw <= SOIL_WET_RAW:
        return 100
    if raw >= SOIL_DRY_RAW:
        return 0
    return int(round(clamp((SOIL_DRY_RAW - raw) * 100 / (SOIL_DRY_RAW - SOIL_WET_RAW))))

def trend(vals):
    if len(vals) < 5:
        return 0
    n = min(10, max(5, len(vals) // 5))
    a = sum(vals[-2*n:-n]) / n if len(vals) >= 2*n else sum(vals[:n]) / n
    b = sum(vals[-n:]) / n
    return round(clamp((b - a) * 3))

def external_water_score(soil_values, current_soil, current_rain):
    if current_rain >= 20 or len(soil_values) < 5:
        return 0, 0
    n = min(10, max(5, len(soil_values) // 5))
    recent_start = soil_values[-n]
    recent_avg = sum(soil_values[-n:]) / n
    rise = max(0, current_soil - recent_start)

    rise_score = clamp(rise * 3.0)
    persistence = clamp((recent_avg - 35) * 1.8)
    score = 0.45 * current_soil + 0.35 * rise_score + 0.20 * persistence

    if current_soil >= 70 and rise >= 8:
        score += 15
    if current_soil >= 85 and rise >= 12:
        score += 15

    return round(clamp(score)), round(rise, 1)

class RainTestForecastingService:
    _instance = None

    def __init__(self):
        self.history = deque(maxlen=300)
        self.camera_data = {
            "connected": False,
            "brightness": 0,
            "dark_cloud_score": 0,
            "visual_rain_score": 0,
            "camera_score": 0,
            "last_update": None,
            "frames_analyzed": 0
        }
        self.forecast_data = {
            "risk": "INSUFFICIENT DATA",
            "probability": 0,
            "eta_min": None,
            "eta_max": None,
            "confidence": 0,
            "reason": "Waiting for live sensor and camera history.",
            "components": {
                "rain": 0,
                "soil": 0,
                "rain_trend": 0,
                "soil_trend": 0,
                "camera": 0,
                "external_water": 0,
                "soil_rise": 0
            }
        }
        self.capture_url = getattr(settings, "ESP32_CAM_URL", "http://192.168.1.116/capture")
        self.camera_thread_running = True
        self.camera_thread = threading.Thread(target=self._camera_loop, daemon=True)
        self.camera_thread.start()
        
        self.arduino_port = "COM8"
        self.baud_rate = 9600
        self.serial_thread = threading.Thread(target=self._serial_loop, daemon=True)
        self.serial_thread.start()
        
        logger.info(f"RainTestForecastingService initialized. Camera URL: {self.capture_url}, Arduino: {self.arduino_port}")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _camera_features(self, data):
        if not PILLOW_AVAILABLE:
            return None
            
        try:
            im = Image.open(io.BytesIO(data)).convert("L").resize((160, 120))
            stat = ImageStat.Stat(im)
            px = list(im.getdata())
            brightness = float(stat.mean[0])
            dark = sum(p < 90 for p in px) / len(px)
            contrast = float(stat.stddev[0])
            edge = float(ImageStat.Stat(im.filter(ImageFilter.FIND_EDGES)).mean[0])
            darkness = clamp((150 - brightness) / 90 * 100)
            dark_score = clamp(0.70 * darkness + 0.30 * dark * 100)
            visual = clamp(0.55 * dark_score + 0.25 * clamp((contrast - 25) / 45 * 100) + 0.20 * clamp((edge - 10) / 35 * 100))
            return {
                "brightness": round(brightness, 1),
                "dark_cloud_score": round(dark_score),
                "visual_rain_score": round(visual),
                "camera_score": round(visual)
            }
        except Exception as e:
            logger.warning(f"Camera analysis error: {e}")
            return None

    def _camera_loop(self):
        while self.camera_thread_running:
            try:
                r = requests.get(self.capture_url, timeout=2)
                if r.ok and r.content:
                    f = self._camera_features(r.content)
                    if f:
                        self.camera_data.update(f)
                        self.camera_data["connected"] = True
                        self.camera_data["last_update"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
                        self.camera_data["frames_analyzed"] += 1
                        if self.history:
                            self.history[-1]["camera_score"] = self.camera_data["camera_score"]
                        self._compute_forecast()
                else:
                    self.camera_data["connected"] = False
            except Exception:
                self.camera_data["connected"] = False
            time.sleep(1.0)

    def _serial_loop(self):
        import serial
        import re
        from app.services.hardware_telemetry_service import HardwareTelemetryService
        
        while True:
            try:
                arduino = serial.Serial(self.arduino_port, self.baud_rate, timeout=1.0)
                logger.info(f"Arduino connected successfully on {self.arduino_port}")
                while True:
                    try:
                        if arduino.in_waiting > 0:
                            line = arduino.readline().decode("utf-8", errors="ignore").strip()
                            if line:
                                logger.debug(f"Arduino: {line}")
                                if re.search(r"RAIN_RAW|SOIL_RAW", line):
                                    rain_val = 1023
                                    soil_val = None
                                    m = re.search(r"RAIN_RAW=(\d+)", line)
                                    if m: rain_val = int(m.group(1))
                                    m = re.search(r"SOIL_RAW=(\d+)", line)
                                    if m: soil_val = int(m.group(1))
                                    
                                    
                                    # Update Global Hardware Monitor so frontend says "CONNECTED"
                                    # ingest_telemetry automatically forwards data to ingest_sensor_reading
                                    try:
                                        hw_service = HardwareTelemetryService.get_instance()
                                        hw_service.ingest_telemetry({
                                            "sensor_id": "UNO_LEGACY", 
                                            "raw_rain_value": rain_val,
                                            "soil_raw": soil_val,
                                            "water_level_m": 1.8,
                                            "rainfall_mm_h": 0.0 # Handled by raw_rain_value fallback
                                        })
                                    except Exception as hw_err:
                                        logger.warning(f"Failed to update hardware monitor: {hw_err}")
                        else:
                            time.sleep(0.1)
                    except serial.SerialException:
                        logger.error("Arduino disconnected abruptly.")
                        break # Break inner loop to trigger outer reconnection
                    except Exception as e:
                        logger.error(f"Arduino read error: {e}")
                        time.sleep(2)
            except Exception as e:
                logger.error(f"Arduino connection failed on {self.arduino_port}: {e}. Retrying in 3s...")
                time.sleep(3.0)

    def ingest_sensor_reading(self, raw_sensor_value: float, water_level_m: float, timestamp_epoch: float, is_simulated: bool = False, soil_raw: float = None) -> LiveForecastSummary:
        # Compatibility with legacy rain intensity calibration
        # RAW > 700 -> NO RAIN, 400-700 -> LIGHT, 250-400 -> MODERATE, 150-250 -> HEAVY, <150 -> VERY HEAVY
        intensity = 0
        if raw_sensor_value < 150:
            intensity = 95
        elif raw_sensor_value < 250:
            intensity = 75
        elif raw_sensor_value < 400:
            intensity = 45
        elif raw_sensor_value < 700:
            intensity = 15
        else:
            intensity = 0

        # Simulate soil raw if none provided, based on rain intensity, else use actual
        s_raw = soil_raw if soil_raw is not None else (SOIL_DRY_RAW - intensity * (SOIL_DRY_RAW - SOIL_WET_RAW) / 100.0)
        s_moisture = soil_percent(s_raw)

        self.history.append({
            "timestamp": timestamp_epoch,
            "rain_raw": raw_sensor_value,
            "rain_intensity": intensity,
            "soil_raw": s_raw,
            "soil_moisture": s_moisture,
            "camera_score": self.camera_data["camera_score"] if self.camera_data["connected"] else None
        })
        self._compute_forecast()
        return self.get_live_forecast()

    def _compute_forecast(self):
        if len(self.history) < 5:
            self.forecast_data.update({
                "risk": "COLLECTING DATA",
                "reason": "Collecting sensor and camera history."
            })
            return

        rows = list(self.history)
        rain = [x["rain_intensity"] for x in rows]
        soil = [x["soil_moisture"] for x in rows]
        cams = [x["camera_score"] for x in rows if x["camera_score"] is not None]

        cr = rain[-1]
        cs = soil[-1]
        cc = cams[-1] if cams else 0
        rt = trend(rain)
        st = trend(soil)

        score = 0.32 * cr + 0.23 * cs + 0.17 * rt + 0.13 * st + 0.15 * cc
        score += 8 * (sum(1 for x in rain[-10:] if x >= 60) / min(10, len(rain)))

        external_water, soil_rise = external_water_score(soil, cs, cr)
        if external_water > 0:
            score = max(score, external_water)

        probability = int(round(clamp(score)))
        if cr < 35 and cs < 65 and cc < 65 and st < 10:
            probability = min(probability, 39)

        if probability >= 80:
            risk = "CRITICAL"
            eta = (15, 30)
        elif probability >= 65:
            risk = "HIGH"
            eta = (25, 50)
        elif probability >= 45:
            risk = "MODERATE"
            eta = (45, 90)
        else:
            risk = "LOW"
            eta = (None, None)

        worsening = 0.40 * cr + 0.25 * rt + 0.20 * st + 0.15 * cc
        if eta[0] is not None:
            mn, mx = eta
            if worsening >= 75:
                mn = max(10, mn - 10)
                mx = max(mn + 10, mx - 15)
            elif worsening < 45:
                mn += 10
                mx += 15
            eta = (mn, mx)

        confidence = int(round(clamp(35 + min(len(rows), 60) * 0.6 + (15 if cams else 0))))

        if cr < 20 and external_water >= 45:
            reason = (f"Rain is low/absent, but soil saturation is {cs:.0f}% with a "
                      f"recent rise of {soil_rise:.0f} points. Possible external water "
                      f"intrusion; camera evidence {cc:.0f}%.")
        elif probability >= 65:
            reason = (f"Rain intensity {cr:.0f}%, soil saturation {cs:.0f}%, rainfall trend {rt:.0f}%, "
                      f"soil trend {st:.0f}%, camera evidence {cc:.0f}%.")
        elif probability >= 45:
            reason = "Multiple indicators are elevated, but the combined pattern has not reached a high-risk threshold."
        else:
            reason = "Current rainfall, soil saturation and camera evidence do not show a strong flood pattern."

        self.forecast_data = {
            "risk": risk,
            "probability": probability,
            "eta_min": eta[0],
            "eta_max": eta[1],
            "confidence": confidence,
            "reason": reason,
            "components": {
                "rain": round(cr),
                "soil": round(cs),
                "rain_trend": rt,
                "soil_trend": st,
                "camera": round(cc),
                "camera_details": {
                    "brightness": self.camera_data["brightness"],
                    "dark_cloud_score": self.camera_data["dark_cloud_score"],
                    "visual_rain_score": self.camera_data["visual_rain_score"],
                    "connected": self.camera_data["connected"]
                },
                "external_water": round(external_water),
                "soil_rise": soil_rise
            }
        }

    def get_live_forecast(self) -> LiveForecastSummary:
        if len(self.history) < 5:
            return LiveForecastSummary(
                status="INSUFFICIENT_DATA",
                is_sufficient=False,
                message="Collecting sensor and camera history.",
                sample_count=len(self.history)
            )

        f = self.forecast_data
        horizon = f"{f['eta_min']}–{f['eta_max']} min" if f['eta_min'] is not None else "N/A"
        
        now = datetime.now(timezone.utc)
        age = (now.timestamp() - self.history[-1]["timestamp"]) if self.history else 0
        
        last = self.history[-1] if self.history else {}
        
        # Determine alert state
        is_alert = last.get("rain_intensity", 0) > 80 or f["probability"] > 70
        
        # Determine rain level text
        rain_val = last.get("rain_raw", 1023)
        if rain_val < 150: level_txt = "VERY HEAVY"
        elif rain_val < 250: level_txt = "HEAVY"
        elif rain_val < 400: level_txt = "MODERATE"
        elif rain_val < 700: level_txt = "LIGHT"
        else: level_txt = "NO RAIN"
        
        return LiveForecastSummary(
            status="VALID" if age < 45 else "STALE_SENSOR",
            is_sufficient=True,
            flood_probability=f["probability"] / 100.0,
            risk_level=f["risk"],
            forecast_horizon=horizon,
            model_confidence=f["confidence"],
            current_rain_intensity=f["components"]["rain"] / 100.0,
            rainfall_trend="RISING" if f["components"]["rain_trend"] > 0 else "FALLING" if f["components"]["rain_trend"] < 0 else "STEADY",
            data_age_seconds=age,
            last_updated_display=now.strftime("%H:%M:%S UTC"),
            sample_count=len(self.history),
            components={
                **f["components"],
                "readings": {
                    "rain_raw": rain_val,
                    "rain_level": level_txt,
                    "rain_intensity": last.get("rain_intensity", 0),
                    "soil_raw": round(last.get("soil_raw", 0)),
                    "soil_moisture": last.get("soil_moisture", 0),
                    "alert": is_alert
                }
            },
            reason=f["reason"]
        )

    def get_history(self, window_seconds: float = 3600):
        items = []
        now = datetime.now(timezone.utc).timestamp()
        for h in self.history:
            if now - h["timestamp"] <= window_seconds:
                items.append({
                    "timestamp_iso": datetime.fromtimestamp(h["timestamp"], timezone.utc).isoformat(),
                    "time_display": datetime.fromtimestamp(h["timestamp"], timezone.utc).strftime("%H:%M"),
                    "raw_value": h["rain_raw"],
                    "rain_intensity": h["rain_intensity"] / 100.0,
                    "water_level_m": 1.80, # Stub for history since raintest doesn't store wl natively
                    "flood_probability": None,
                    "risk_level": None
                })
        return items

    def predict_custom_features(self, req):
        from app.schemas.flood_forecasting import FloodPredictResponse
        # Stub to keep API from crashing if called directly
        return FloodPredictResponse(
            flood_probability=0.0,
            risk_level="LOW",
            forecast_horizon="1-3 hours",
            model_confidence=100.0,
            model_name="Multi-Sensor Fusion (RainTest)",
            model_version="1.0"
        )

