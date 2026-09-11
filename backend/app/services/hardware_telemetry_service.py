"""
FlashFloodAI Backend -- Hardware Telemetry & Actuator Management Service
Handles real-time ESP32 sensor ingestion, sequential rate-of-rise calculations,
integration with RiskDecisionEngine, physical buzzer command dispatches, and event logging.
"""

from datetime import datetime, timezone
import logging
from typing import Dict, List, Optional, Any

from app.schemas.risk_decision import RiskEvaluationRequest
from app.services.risk_decision_engine import RiskDecisionEngine

logger = logging.getLogger("FlashFloodAI.HardwareTelemetryService")


class HardwareTelemetryService:
    _instance: Optional["HardwareTelemetryService"] = None

    def __init__(self):
        self.telemetry_history: List[Dict[str, Any]] = []
        self.event_timeline: List[Dict[str, Any]] = []
        self.buzzer_state: str = "STANDBY"
        self.last_buzzer_command: str = "NONE"
        self.current_risk_state: str = "NORMAL"
        self.ack_received: bool = False
        self.last_command_timestamp: Optional[str] = None
        self.last_ack_timestamp: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "HardwareTelemetryService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def log_event(self, event_type: str, message: str, is_simulated: bool = False):
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S IST")
        event = {
            "timestamp": now_str,
            "type": event_type,
            "message": message,
            "is_simulated": is_simulated,
        }
        self.event_timeline.insert(0, event)
        if len(self.event_timeline) > 50:
            self.event_timeline = self.event_timeline[:50]

    def ingest_telemetry(self, payload: Dict[str, Any], is_simulated: bool = False) -> Dict[str, Any]:
        now_dt = datetime.now(timezone.utc)
        timestamp_str = now_dt.strftime("%H:%M:%S IST")

        sensor_id = str(payload.get("sensor_id", "ESP32_STATION_001"))
        wl_val = payload.get("water_level_m")
        if wl_val is None:
            wl_val = float(payload.get("water_level_cm") or 180.0) / 100.0
        water_level_m = float(wl_val)

        rf_val = payload.get("rainfall_mm_h")
        if rf_val is None:
            rf_val = float(payload.get("rainfall_accum_mm") or 0.0) * 12.0
        rainfall_mm_h = float(rf_val)

        rainfall_accum_mm = float(payload.get("rainfall_accum_mm") or (rainfall_mm_h * 0.5))
        battery_v = float(payload.get("battery_v") or 3.85)

        entry = {
            "sensor_id": sensor_id,
            "water_level_m": round(water_level_m, 2),
            "rainfall_mm_h": round(rainfall_mm_h, 1),
            "rainfall_accum_mm": round(rainfall_accum_mm, 1),
            "battery_v": round(battery_v, 2),
            "timestamp_utc": now_dt.isoformat(),
            "timestamp_display": timestamp_str,
            "timestamp_epoch": now_dt.timestamp(),
            "is_simulated": is_simulated,
        }

        rate_of_rise_str = "CALCULATING..."
        rate_of_rise_m_min = 0.0
        if len(self.telemetry_history) > 0:
            prev = self.telemetry_history[0]
            dt_mins = (entry["timestamp_epoch"] - prev["timestamp_epoch"]) / 60.0
            if dt_mins > 0.01:
                dh_m = entry["water_level_m"] - prev["water_level_m"]
                rate_of_rise_m_min = dh_m / dt_mins
                mins_rounded = max(1, int(round(dt_mins)))
                sign = "+" if dh_m >= 0 else ""
                rate_of_rise_str = f"{sign}{dh_m:.2f} m / {mins_rounded} min"

        entry["rate_of_rise_display"] = rate_of_rise_str
        entry["rate_of_rise_m_min"] = round(rate_of_rise_m_min, 4)

        self.telemetry_history.insert(0, entry)
        if len(self.telemetry_history) > 100:
            self.telemetry_history = self.telemetry_history[:100]

        risk_engine = RiskDecisionEngine.get_instance()
        soil_sat = min(0.98, 0.30 + (rainfall_accum_mm * 0.008))
        eval_req = RiskEvaluationRequest(
            district="Rudraprayag",
            station_id="CWC_RUDRA_01",
            water_level_m=water_level_m,
            rainfall_1h_mm=rainfall_mm_h,
            rainfall_30min_mm=rainfall_mm_h * 0.5,
            rainfall_3h_mm=rainfall_mm_h * 2.5,
            surface_soil_moisture_vol=soil_sat,
            profile_soil_moisture_vol=soil_sat * 0.9,
            soil_saturation_index=soil_sat,
            elevation_m=1850.0,
            slope_deg=28.5,
            landcover_class=10,
            warning_level_m=339.5,
            danger_level_m=340.5,
            hfl_m=342.0,
        )

        risk_res = risk_engine.evaluate_live(eval_req)
        final_risk_class = risk_res.final_risk_class.value if hasattr(risk_res.final_risk_class, 'value') else risk_res.final_risk_class

        prev_risk_state = self.current_risk_state
        self.current_risk_state = final_risk_class

        # State transition based actuator dispatch logic
        if prev_risk_state != "EXTREME" and final_risk_class == "EXTREME":
            # Transition INTO EXTREME -> Send EMERGENCY_ALERT_ON
            self.buzzer_state = "ALERTING"
            self.last_buzzer_command = "EMERGENCY_ALERT_ON"
            self.last_command_timestamp = timestamp_str
            self.ack_received = False
            self.log_event("RISK_ESCALATION", f"FLASH FLOOD RISK ESCALATED: {prev_risk_state} -> EXTREME (Water: {water_level_m:.2f}m, Rain: {rainfall_mm_h:.1f}mm/h)", is_simulated)
            self.log_event("ACTUATOR_COMMAND", f"Emergency Actuator Command EMERGENCY_ALERT_ON dispatched to ESP32 {sensor_id}", is_simulated)
        elif prev_risk_state == "EXTREME" and final_risk_class != "EXTREME":
            # Transition OUT OF EXTREME -> Send EMERGENCY_ALERT_OFF
            self.buzzer_state = "STANDBY"
            self.last_buzzer_command = "EMERGENCY_ALERT_OFF"
            self.last_command_timestamp = timestamp_str
            self.ack_received = False
            self.log_event("EMERGENCY_CLEARED", f"Emergency cleared: EXTREME -> {final_risk_class}. Deactivating buzzer.", is_simulated)
            self.log_event("ACTUATOR_COMMAND", f"Emergency Actuator Command EMERGENCY_ALERT_OFF dispatched to ESP32 {sensor_id}", is_simulated)
        elif final_risk_class in ["HIGH", "WARNING"]:
            if self.buzzer_state != "ALERTING":
                self.buzzer_state = "ARMED"
            self.log_event("TELEMETRY", f"Telemetry updated: Water {water_level_m:.2f}m, Rain {rainfall_mm_h:.1f}mm/h, Risk: {final_risk_class}", is_simulated)
        else:
            if self.buzzer_state != "ALERTING":
                self.buzzer_state = "STANDBY"
                if self.last_buzzer_command not in ["EMERGENCY_ALERT_ON", "ALERT_TEST"]:
                    self.last_buzzer_command = "NONE"
            self.log_event("TELEMETRY", f"Telemetry updated: Water {water_level_m:.2f}m, Rain {rainfall_mm_h:.1f}mm/h, Risk: NORMAL", is_simulated)

        return {
            "telemetry": entry,
            "risk_decision": risk_res.model_dump() if hasattr(risk_res, 'model_dump') else getattr(risk_res, '__dict__', risk_res),
            "buzzer_state": self.buzzer_state,
            "last_buzzer_command": self.last_buzzer_command,
            "ack_received": self.ack_received,
        }

    def trigger_test_buzzer(self) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S IST")
        self.buzzer_state = "ALERTING"
        self.last_buzzer_command = "ALERT_TEST"
        self.last_command_timestamp = now_str
        self.ack_received = False
        self.log_event("ACTUATOR_TEST", "Manual physical buzzer test command ALERT_TEST issued to gateway", is_simulated=False)
        return {
            "status": "COMMAND_SENT",
            "buzzer_state": self.buzzer_state,
            "last_buzzer_command": self.last_buzzer_command,
            "timestamp": now_str,
            "message": "Test command sent to ESP32 physical buzzer gateway.",
        }

    def acknowledge_buzzer(self) -> Dict[str, Any]:
        now_str = datetime.now(timezone.utc).strftime("%H:%M:%S IST")
        self.ack_received = True
        self.last_ack_timestamp = now_str
        if self.last_buzzer_command in ["EMERGENCY_ALERT_ON", "ALERT_TEST", "ALERT_EXTREME"]:
            self.buzzer_state = "ALERTING"
        else:
            self.buzzer_state = "STANDBY"
        self.log_event("ACTUATOR_ACK", f"ESP32 physical buzzer acknowledgement received for command {self.last_buzzer_command}", is_simulated=False)
        return {
            "status": "ACKNOWLEDGED",
            "buzzer_state": self.buzzer_state,
            "ack_received": True,
            "timestamp": now_str,
        }

    def get_live_status(self) -> Dict[str, Any]:
        now_epoch = datetime.now(timezone.utc).timestamp()
        if not self.telemetry_history:
            return {
                "hardware_mode": "DEMONSTRATION SCENARIO",
                "sensor_status": "OFFLINE",
                "esp32_status": "OFFLINE",
                "data_quality": "NO_DATA",
                "data_age_seconds": 999,
                "latest_telemetry": None,
                "rate_of_rise": "CALCULATING...",
                "buzzer_state": "OFFLINE",
                "last_buzzer_command": self.last_buzzer_command,
                "ack_received": self.ack_received,
                "event_timeline": self.event_timeline[:20],
            }

        latest = self.telemetry_history[0]
        data_age = int(now_epoch - latest["timestamp_epoch"])

        if data_age < 15:
            sensor_status = "ONLINE"
            esp32_status = "CONNECTED"
            data_quality = "GOOD"
        elif data_age < 45:
            sensor_status = "STALE"
            esp32_status = "CONNECTED"
            data_quality = "STALE"
        else:
            sensor_status = "OFFLINE"
            esp32_status = "OFFLINE"
            data_quality = "DEGRADED"

        return {
            "hardware_mode": "LIVE HARDWARE" if latest and not latest.get("is_simulated", False) else "DEMONSTRATION SCENARIO",
            "sensor_status": sensor_status,
            "esp32_status": esp32_status,
            "data_quality": data_quality,
            "data_age_seconds": data_age,
            "latest_telemetry": latest,
            "rate_of_rise": latest.get("rate_of_rise_display", "CALCULATING..."),
            "buzzer_state": self.buzzer_state if esp32_status == "CONNECTED" else "OFFLINE",
            "last_buzzer_command": self.last_buzzer_command,
            "ack_received": self.ack_received,
            "last_command_timestamp": self.last_command_timestamp,
            "last_ack_timestamp": self.last_ack_timestamp,
            "event_timeline": self.event_timeline[:20],
        }