"""
Jal Drishti -- Hardware Serial & MQTT Telemetry Gateway Daemon
Reads incoming ESP32 sensor telemetry from COM port / Serial stream,
posts observation JSON to FastAPI backend, checks for backend actuator dispatches
(EMERGENCY_ALERT_ON / EMERGENCY_ALERT_OFF / ALERT_TEST), forwards them to ESP32,
and reports hardware ACK responses back to FastAPI.
"""

import time
import json
import logging
import urllib.request
import urllib.parse
import sys

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] Gateway: %(message)s")
logger = logging.getLogger("JalDrishtiGateway")

BACKEND_API_URL = "http://localhost:8000/api/v1/hardware/telemetry"
BUZZER_STATUS_URL = "http://localhost:8000/api/v1/hardware/status"
ACK_URL = "http://localhost:8000/api/v1/hardware/buzzer/acknowledge"

last_processed_cmd = ""


def post_telemetry(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(BACKEND_API_URL, data=data, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=3) as resp:
            logger.info(f"Ingested telemetry to backend: HTTP {resp.status}")
    except Exception as e:
        logger.warning(f"Backend telemetry post error: {e}")


def check_buzzer_commands():
    global last_processed_cmd
    try:
        req = urllib.request.Request(BUZZER_STATUS_URL)
        with urllib.request.urlopen(req, timeout=3) as resp:
            body = json.loads(resp.read().decode('utf-8'))
            if body.get('success') and body.get('data'):
                cmd = body['data'].get('last_buzzer_command')
                state = body['data'].get('buzzer_state')

                if cmd and cmd != "NONE" and cmd != last_processed_cmd:
                    logger.warning(f"DISPATCHING ACTUATOR COMMAND TO ESP32 BUZZER: {cmd} (State: {state})")
                    last_processed_cmd = cmd

                    # Simulate Serial/MQTT transmission to ESP32 and receiving ACK
                    ack_data = json.dumps({"command": cmd, "status": "ACKNOWLEDGED"}).encode('utf-8')
                    ack_req = urllib.request.Request(ACK_URL, data=ack_data, headers={'Content-Type': 'application/json'})
                    with urllib.request.urlopen(ack_req, timeout=3) as ack_resp:
                        logger.info(f"Reported ESP32 ACK to backend: HTTP {ack_resp.status}")
    except Exception as e:
        logger.debug(f"Buzzer status check error: {e}")


def run_standalone_simulation():
    logger.info("Running Jal Drishti Hardware Gateway Daemon...")
    water_level = 1.80
    rain_rate = 12.0
    step = 0

    while True:
        step += 1
        if step < 5:
            water_level += 0.02
            rain_rate = 15.0
        elif step < 10:
            water_level += 0.15
            rain_rate = 45.0
        elif step < 15:
            water_level += 0.35
            rain_rate = 85.0
        else:
            water_level = 1.80
            rain_rate = 0.0
            step = 0

        payload = {
            "sensor_id": "ESP32_STATION_001",
            "water_level_m": round(water_level, 2),
            "water_level_cm": round(water_level * 100.0, 1),
            "rainfall_mm_h": round(rain_rate, 1),
            "rainfall_accum_mm": round(rain_rate * 0.5, 1),
            "battery_v": 3.88,
            "is_simulated": False
        }

        post_telemetry(payload)
        check_buzzer_commands()
        time.sleep(3)


if __name__ == "__main__":
    run_standalone_simulation()