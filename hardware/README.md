# FlashFloodAI — Hardware & IoT Sensor Module (`hardware/`)

**Module Name:** `hardware`  
**Scope:** Miniature Physical River Model, IoT Sensors, Serial & Telemetry Bridges  
**Lead Developer Role:** Embedded Systems / IoT Hardware Engineer  

---

## 1. Purpose & Scope

The `hardware/` module defines the embedded firmware, serial bridges, and physical sensor interfaces for integrating on-ground micro-catchment sensor telemetry into FlashFloodAI.

### Target Hardware Capabilities:
1. **Ultrasonic Water Level Gauges**: Measure river stage or flume water levels in real time ($0–500\text{ cm}$ range, $\pm 1\text{ mm}$ resolution).
2. **Tipping-Bucket Rain Gauges**: Record instantaneous rainfall intensity and cumulative pulse counts ($0.2\text{ mm/tip}$).
3. **Microcontroller Gateways (ESP32 / Arduino / Raspberry Pi Pico)**: Aggregate sensor readings, format JSON payloads, and transmit via Wi-Fi, LoRaWAN, or USB-Serial.
4. **Serial-to-REST Telemetry Bridge**: Lightweight background daemon streaming incoming sensor serial packets to `POST /api/v1/sensors/telemetry` on `backend/`.

---

## 2. Directory Structure

```text
hardware/
├── firmware/
│   ├── esp32_river_gauge/       # Arduino / PlatformIO firmware for ultrasonic stage sensor
│   └── esp32_rain_gauge/        # Interrupt-driven tipping-bucket pulse counter firmware
├── serial_bridge/
│   ├── serial_reader.py         # Python daemon reading USB COM ports and forwarding to REST API
│   └── mock_sensor_stream.py    # Deterministic test harness for hardware-in-the-loop validation
├── schemas/
│   └── sensor_payload.json      # Standard JSON telemetry packet schema
└── README.md                    # This document
```

---

## 3. Telemetry JSON Packet Schema

```json
{
  "sensor_id": "SN-UK-HW-001",
  "sensor_type": "ultrasonic_water_level",
  "location_name": "Alaknanda_Physical_Model_Gauge_01",
  "latitude": 30.2850,
  "longitude": 79.1120,
  "timestamp_utc": "2026-08-29T21:45:00Z",
  "measurements": {
    "water_level_cm": 142.5,
    "temperature_c": 18.2,
    "battery_voltage_v": 3.95
  }
}
```

---

## 4. How to Run Serial Bridge Daemon

```powershell
# Activate virtual environment
& "C:\FlashFloodAI\.venv\Scripts\Activate.ps1"

# Launch Serial-to-REST Bridge
python hardware/serial_bridge/serial_reader.py --port COM3 --baud 115200 --api-url http://localhost:8000/api/v1/sensors/telemetry
```

---

## 5. Upstream & Downstream Dependencies

- **Upstream Hardware**: Microcontroller sensors (JSN-SR04T waterproof ultrasonic, Hall-effect rain gauge).
- **Downstream Modules**: `backend/` (receives telemetry via `POST /api/v1/sensors/telemetry` $\to$ triggers `ml/inference.py` $\to$ updates `frontend/` live dashboard).
