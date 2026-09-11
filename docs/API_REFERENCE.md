# Jal Drishti — FastAPI REST API Reference

**Base URL:** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Interactive Swagger Docs:** `http://localhost:8000/docs`

---

## Endpoint Summary Table

| Method | Endpoint Path | Source Router File | Purpose |
|---|---|---|---|
| `GET` | `/` | `main.py` | System greeting & documentation links |
| `GET` | `/api/v1/health` | `routes/health.py` | Health check & ML engine readiness |
| `GET` | `/api/v1/stations` | `routes/stations.py` | Monitored station list & metadata |
| `GET` | `/api/v1/stations/{id}` | `routes/stations.py` | Detailed station telemetry |
| `GET` | `/api/v1/observations/weather` | `routes/observations.py` | IMD weather observation data |
| `GET` | `/api/v1/observations/rainfall` | `routes/observations.py` | GPM rainfall timeseries data |
| `GET` | `/api/v1/observations/soil-moisture` | `routes/observations.py` | SMAP soil moisture data |
| `GET` | `/api/v1/observations/water-level` | `routes/observations.py` | CWC river water level stage |
| `GET` | `/api/v1/predictions/latest` | `routes/predictions.py` | Latest raw ML predictions |
| `POST` | `/api/v1/predictions/infer` | `routes/predictions.py` | Live ML inference calculation |
| `GET` | `/api/v1/risk/latest` | `routes/risk.py` | State-wide latest decisions for 1,000 spatial points |
| `GET` | `/api/v1/risk/summary` | `routes/risk.py` | State-wide executive risk summary |
| `GET` | `/api/v1/risk/alerts` | `routes/risk.py` | Active WARNING and CRITICAL alerts |
| `GET` | `/api/v1/risk/policy` | `routes/risk.py` | Multi-signal decision policy rules |
| `GET` | `/api/v1/risk/timeseries` | `routes/risk.py` | Risk probability trend curves |
| `POST` | `/api/v1/risk/evaluate` | `routes/risk.py` | On-demand multi-signal risk evaluation |
| `GET` | `/api/v1/historical-events` | `routes/historical-events.py` | Historical disaster catalog |
| `GET` | `/api/v1/weather/current` | `routes/weather.py` | Live OpenWeather current conditions proxy |
| `GET` | `/api/v1/weather/forecast` | `routes/weather.py` | OpenWeather 24h hourly & 5-day daily forecast proxy |


---

## Detailed Endpoint Documentation

### 1. `GET /api/v1/risk/summary`
Retrieves executive summary metrics for Uttarakhand dashboard KPI cards.

**Response (200 OK):**
```json
{
  "total_evaluated_points": 1000,
  "risk_class_counts": {
    "LOW": 940,
    "MODERATE": 40,
    "HIGH": 15,
    "EXTREME": 5
  },
  "alert_priority_counts": {
    "INFORMATION": 940,
    "WATCH": 40,
    "WARNING": 15,
    "CRITICAL": 5
  },
  "risk_policy_version": "8.1.0"
}
```

---

### 2. `POST /api/v1/risk/evaluate`
Performs live multi-signal evaluation for a custom location or custom sensor values.

**Request Body:**
```json
{
  "latitude": 30.3165,
  "longitude": 78.0322,
  "rainfall_1h_mm": 45.0,
  "rainfall_30min_mm": 20.0,
  "soil_saturation_index": 0.88,
  "water_level_m": 352.5,
  "warning_level_m": 350.0,
  "danger_level_m": 352.0
}
```

**Response (200 OK):**
```json
{
  "final_risk_class": "EXTREME",
  "operational_state": "EMERGENCY_RESPONSE",
  "alert_priority": "CRITICAL",
  "flood_probability": 0.942,
  "cwc_threshold_status": "DANGER_ZONE",
  "scs_direct_runoff_q_mm": 38.4,
  "decision_reason": "Severe multi-signal convergence: River stage breached official Danger Level combined with high ML probability.",
  "recommended_action": "Activate emergency escalation protocol. Alert SDRF/NDRF and local administration."
}
```

---
*Jal Drishti Technical Documentation*
