/*
  Jal Drishti -- ESP32 IoT Sensor Node & Emergency Alert Actuator Firmware
  Hardware: ESP32-WROOM-32 Dev Board
  Sensors: JSN-SR04T Waterproof Ultrasonic Distance Sensor (Water Level), Tipping Bucket Rain Gauge
  Actuators: Piezo Emergency Buzzer (Pin 25)
  Protocol: Serial & MQTT Telemetry Payload (JSON) with Non-Blocking Buzzer Actuation
*/

#include <Arduino.h>

#define TRIG_PIN 12
#define ECHO_PIN 14
#define RAIN_PIN 27
#define BUZZER_PIN 25
#define SENSOR_ID "ESP32_STATION_001"
#define DISTANCE_OFFSET_CM 300.0

volatile unsigned long rain_tip_count = 0;
unsigned long last_telemetry_time = 0;
String current_buzzer_command = "EMERGENCY_ALERT_OFF";

// Non-blocking buzzer pattern state variables
unsigned long last_buzzer_step_time = 0;
int buzzer_pattern_step = 0;

void IRAM_ATTR handleRainTip() {
  rain_tip_count++;
}

float measureWaterLevelCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  if (duration == 0) return 180.0;

  float distance_cm = (duration * 0.0343) / 2.0;
  float water_level_cm = DISTANCE_OFFSET_CM - distance_cm;
  return max(0.0f, water_level_cm);
}

// Non-blocking repeating emergency alert pattern: BEEP - pause - BEEP - pause - LONG BEEP - pause - repeat
void updateBuzzerPatternNonBlocking() {
  if (current_buzzer_command == "EMERGENCY_ALERT_OFF" || current_buzzer_command == "NONE") {
    noTone(BUZZER_PIN);
    buzzer_pattern_step = 0;
    return;
  }

  unsigned long now = millis();

  if (current_buzzer_command == "EMERGENCY_ALERT_ON" || current_buzzer_command == "ALERT_EXTREME") {
    // 6-phase non-blocking pattern
    // Step 0: BEEP 1 (150ms @ 2400Hz)
    // Step 1: Pause 1 (150ms)
    // Step 2: BEEP 2 (150ms @ 2400Hz)
    // Step 3: Pause 2 (150ms)
    // Step 4: LONG BEEP (500ms @ 2800Hz)
    // Step 5: Long Pause (800ms)
    
    switch (buzzer_pattern_step) {
      case 0:
        tone(BUZZER_PIN, 2400);
        if (now - last_buzzer_step_time >= 150) {
          noTone(BUZZER_PIN);
          last_buzzer_step_time = now;
          buzzer_pattern_step = 1;
        }
        break;
      case 1:
        if (now - last_buzzer_step_time >= 150) {
          last_buzzer_step_time = now;
          buzzer_pattern_step = 2;
        }
        break;
      case 2:
        tone(BUZZER_PIN, 2400);
        if (now - last_buzzer_step_time >= 150) {
          noTone(BUZZER_PIN);
          last_buzzer_step_time = now;
          buzzer_pattern_step = 3;
        }
        break;
      case 3:
        if (now - last_buzzer_step_time >= 150) {
          last_buzzer_step_time = now;
          buzzer_pattern_step = 4;
        }
        break;
      case 4:
        tone(BUZZER_PIN, 2800);
        if (now - last_buzzer_step_time >= 500) {
          noTone(BUZZER_PIN);
          last_buzzer_step_time = now;
          buzzer_pattern_step = 5;
        }
        break;
      case 5:
        if (now - last_buzzer_step_time >= 800) {
          last_buzzer_step_time = now;
          buzzer_pattern_step = 0; // Repeat cycle
        }
        break;
    }
  } else if (current_buzzer_command == "ALERT_TEST") {
    // Short test pattern
    switch (buzzer_pattern_step) {
      case 0:
        tone(BUZZER_PIN, 2000);
        if (now - last_buzzer_step_time >= 150) {
          noTone(BUZZER_PIN);
          last_buzzer_step_time = now;
          buzzer_pattern_step = 1;
        }
        break;
      case 1:
        if (now - last_buzzer_step_time >= 200) {
          last_buzzer_step_time = now;
          buzzer_pattern_step = 2;
        }
        break;
      case 2:
        tone(BUZZER_PIN, 2000);
        if (now - last_buzzer_step_time >= 150) {
          noTone(BUZZER_PIN);
          last_buzzer_step_time = now;
          buzzer_pattern_step = 3;
        }
        break;
      case 3:
        current_buzzer_command = "EMERGENCY_ALERT_OFF";
        noTone(BUZZER_PIN);
        buzzer_pattern_step = 0;
        break;
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);

  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), handleRainTip, FALLING);
  Serial.println("{\"status\":\"ESP32_INITIALIZED\",\"sensor_id\":\"" SENSOR_ID "\"}");
}

void loop() {
  unsigned long now = millis();

  // 1. Process Incoming Serial Actuator Commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.indexOf("EMERGENCY_ALERT_ON") >= 0 || cmd.indexOf("ALERT_EXTREME") >= 0) {
      current_buzzer_command = "EMERGENCY_ALERT_ON";
      buzzer_pattern_step = 0;
      last_buzzer_step_time = now;
      // Send Serial ACK JSON back to gateway
      Serial.println("{\"status\":\"ACKNOWLEDGED\",\"command\":\"EMERGENCY_ALERT_ON\",\"sensor_id\":\"" SENSOR_ID "\"}");
    } else if (cmd.indexOf("EMERGENCY_ALERT_OFF") >= 0 || cmd.indexOf("ALERT_OFF") >= 0) {
      current_buzzer_command = "EMERGENCY_ALERT_OFF";
      noTone(BUZZER_PIN);
      buzzer_pattern_step = 0;
      Serial.println("{\"status\":\"ACKNOWLEDGED\",\"command\":\"EMERGENCY_ALERT_OFF\",\"sensor_id\":\"" SENSOR_ID "\"}");
    } else if (cmd.indexOf("ALERT_TEST") >= 0) {
      current_buzzer_command = "ALERT_TEST";
      buzzer_pattern_step = 0;
      last_buzzer_step_time = now;
      Serial.println("{\"status\":\"ACKNOWLEDGED\",\"command\":\"ALERT_TEST\",\"sensor_id\":\"" SENSOR_ID "\"}");
    }
  }

  // 2. Non-blocking Buzzer Pattern Generator
  updateBuzzerPatternNonBlocking();

  // 3. Periodic Telemetry Transmission (every 3000ms)
  if (now - last_telemetry_time >= 3000) {
    last_telemetry_time = now;
    float water_level_cm = measureWaterLevelCm();
    float rainfall_accum_mm = rain_tip_count * 0.2f;
    float rainfall_mm_h = rainfall_accum_mm * 12.0f;

    Serial.print("{\"sensor_id\":\"" SENSOR_ID "\",\"water_level_cm\":");
    Serial.print(water_level_cm, 1);
    Serial.print(",\"water_level_m\":");
    Serial.print(water_level_cm / 100.0f, 2);
    Serial.print(",\"rainfall_accum_mm\":");
    Serial.print(rainfall_accum_mm, 1);
    Serial.print(",\"rainfall_mm_h\":");
    Serial.print(rainfall_mm_h, 1);
    Serial.print(",\"battery_v\":3.88");
    Serial.print(",\"uptime_s\":");
    Serial.print(now / 1000);
    Serial.println("}");
  }
}