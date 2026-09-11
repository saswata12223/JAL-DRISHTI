# Jal Drishti — Hardware Sensor Node & MQTT Gateway Specification

---

## 1. Hardware Architecture Overview

Jal Drishti integrates field sensor nodes to capture high-frequency river gauge stages and localized rainfall accumulation.

```
 ┌──────────────────────────────────────────────────────────┐
 │ ESP32 Microcontroller Node                               │
 │ - JSN-SR04T Waterproof Ultrasonic Sensor (Water Stage)   │
 │ - Tipping Bucket Rain Gauge (Rainfall Accumulation)      │
 └────────────────────────────┬─────────────────────────────┘
                              │ Serial / Wi-Fi Telemetry Payload
                              ▼
        Python Gateway Script (hardware/scripts/mqtt_gateway.py)
                              │ HTTP POST JSON
                              ▼
    FastAPI Endpoint (http://localhost:8000/api/v1/observations)
```

---

## 2. ESP32 Firmware Implementation

- **Source Location:** `hardware/firmware/esp32_sensor_node.ino`
- **Microcontroller:** ESP32-WROOM-32 Dev Board.
- **Sensors:**
  - JSN-SR04T Ultrasonic Transducer (Trigger Pin 12, Echo Pin 14). Measures distance to water surface ($cm$).
  - Digital Reed Switch Tipping Bucket Rain Gauge (Interrupt Pin 27). Measures $0.2	ext{ mm}$ rainfall per tip.
- **Output Payload Schema (JSON over Serial/MQTT):**
```json
{
  "sensor_id": "ESP32_STATION_001",
  "water_level_cm": 142.5,
  "rainfall_tips": 12,
  "rainfall_accum_mm": 2.4,
  "battery_v": 3.82,
  "uptime_s": 3600
}
```

---

## 3. Hardware Gateway Script

- **Source Location:** `hardware/scripts/mqtt_gateway.py`
- **Role:** Reads incoming serial payloads from connected ESP32 sensor nodes or listens on MQTT broker topic `jaldrishti/sensors/telemetry`, formats telemetry into Pydantic observation schemas, and posts data directly to backend REST API `/api/v1/observations`.

---

## 4. Hardware Deployment Note

Firmware sketch `esp32_sensor_node.ino` and gateway `mqtt_gateway.py` are fully functional software implementations. Local web platform development and API testing can be conducted with or without physically attached ESP32 hardware.

---
*Jal Drishti Technical Documentation*
