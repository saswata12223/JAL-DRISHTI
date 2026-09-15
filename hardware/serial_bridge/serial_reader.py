import argparse
import time
import json
import logging
import urllib.request
import urllib.parse
import sys

try:
    import serial
except ImportError:
    print("Error: pyserial library not found. Please install it using: pip install pyserial")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] SerialBridge: %(message)s")
logger = logging.getLogger("SerialBridge")

def parse_and_forward(port, baudrate, api_url):
    try:
        ser = serial.Serial(port, baudrate, timeout=1.0)
        logger.info(f"Successfully connected to Arduino on {port} at {baudrate} baud.")
    except Exception as e:
        logger.error(f"Failed to connect to serial port {port}: {e}")
        return

    logger.info(f"Listening for telemetry... Forwarding to: {api_url}")
    
    while True:
        try:
            if ser.in_waiting > 0:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if not line:
                    continue
                
                # We expect the Arduino to send JSON packets.
                # If it sends raw values, wrap them in the expected JSON payload format
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    import re
                    # Fallback: if Arduino sends raw text like "RAIN_RAW=450 | SOIL_RAW=300", we parse it
                    if re.search(r"RAIN_RAW|SOIL_RAW", line):
                        payload = {"sensor_id": "UNO_LEGACY"}
                        m = re.search(r"RAIN_RAW=(\d+)", line)
                        if m:
                            payload["rain_sensor"] = int(m.group(1))
                        m = re.search(r"SOIL_RAW=(\d+)", line)
                        if m:
                            payload["soil_raw"] = int(m.group(1))
                    else:
                        logger.debug(f"Received unrecognized line from Arduino: {line}")
                        continue

                # Map fallback keys to the correct backend schema keys
                if "rain_sensor" in payload:
                    payload["raw_sensor_value"] = payload.pop("rain_sensor")
                if "rain_value" in payload:
                    payload["raw_sensor_value"] = payload.pop("rain_value")
                
                # Ensure payload has minimum required fields
                payload['is_simulated'] = False
                if "raw_sensor_value" not in payload:
                    payload["raw_sensor_value"] = 1023 # Default to no rain
                
                # We need to push to both the flood ML endpoint AND the hardware status endpoint
                endpoints = [
                    api_url, 
                    api_url.replace("/flood/telemetry", "/hardware/telemetry")
                ]
                
                for endpoint in endpoints:
                    try:
                        data = json.dumps(payload).encode('utf-8')
                        req = urllib.request.Request(endpoint, data=data, headers={'Content-Type': 'application/json'})
                        with urllib.request.urlopen(req, timeout=3) as resp:
                            if endpoint == api_url:
                                logger.info(f"Forwarded successfully: {payload.get('sensor_id', 'UNO')} -> HTTP {resp.status}")
                    except Exception as e:
                        if endpoint == api_url:
                            logger.warning(f"Backend forwarding failed to {endpoint}: {e}")

        except serial.SerialException as e:
            logger.error(f"Serial connection lost: {e}")
            break
        except KeyboardInterrupt:
            logger.info("Stopping Serial Bridge...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            time.sleep(1)

    ser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serial-to-REST Telemetry Bridge for Arduino UNO")
    parser.add_argument("--port", type=str, required=True, help="Serial COM port (e.g., COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate (default 115200)")
    parser.add_argument("--api-url", type=str, default="http://localhost:8000/api/v1/flood/telemetry", help="Backend API endpoint URL")
    
    args = parser.parse_args()
    parse_and_forward(args.port, args.baud, args.api_url)
