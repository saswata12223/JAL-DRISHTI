import os
import pandas as pd
from pathlib import Path

cat_dir = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\data\processed\catalog")

# 1. ML_MODEL_READINESS_AUDIT.md
audit_md = """# JAL DRISHTI ML MODEL READINESS AUDIT

## 1. DATASET CONSTRUCTION READINESS
- **Status**: BLOCKED
- **Reason**: The v0.2 report indicates only 15 unique independent events (13 positive). This is severely insufficient for training a robust, generalizable machine learning model. Furthermore, negative sampling in v0.2 was limited to days immediately preceding events.

## 2. FEATURE ENGINEERING READINESS
- **Status**: READY WITH CONDITIONS
- **Reason**: GPM, WorldCover, and SRTM data have been securely curated and validated. Features can be constructed from these. However, historical CWC water level data is unavailable (only API errors were retrieved), meaning hydrology features cannot be engineered historically.

## 3. LABEL READINESS
- **Status**: BLOCKED
- **Reason**: Need a larger corpus of authoritative historical flood events. Current label count is 13 positive events.

## 4. NEGATIVE-SAMPLING READINESS
- **Status**: BLOCKED
- **Reason**: Must sample genuine non-flood conditions (e.g., heavy rain non-event days, random monsoon days, spatial negatives). Using only pre-event days as in v0.2 provides insufficient class diversity and risks leakage.

## 5. LEAKAGE-CONTROL READINESS
- **Status**: READY
- **Reason**: Temporal and spatial leakage rules can be strictly implemented using proper GroupKFold based on discrete event IDs and enforcing a strict `prediction_timestamp` cutoff for feature data (no look-ahead).

## 6. MODEL-TRAINING READINESS
- **Status**: BLOCKED
- **Reason**: Cannot train without a sufficient number of independent events and properly balanced negative samples.

## 7. MODEL-SERVING READINESS
- **Status**: READY
- **Reason**: The existing FastAPI backend (`backend/app/main.py`) is well-suited for serving model predictions via API endpoints.

## 8. BACKEND INTEGRATION READINESS
- **Status**: READY
- **Reason**: Backend architecture is FastAPI, which can easily load a pickled scikit-learn or PyTorch model and expose `/predict` endpoints.

## 9. FRONTEND/DASHBOARD INTEGRATION READINESS
- **Status**: READY WITH CONDITIONS
- **Reason**: Frontend is React/Vite. The dashboard cards must properly handle unavailable live data (CWC) instead of faking values.

## 10. DASHBOARD METRIC REAL DATA SOURCE VERIFICATION
- **Status**: BLOCKED
- **Reason**: Live CWC and weather station data sources are failing/unavailable. Many dashboard cards (e.g., CWC Gauge Panel) cannot be powered by real data at this time.
"""
with open(cat_dir / "ML_MODEL_READINESS_AUDIT.md", "w", encoding="utf-8") as f:
    f.write(audit_md)


# 2. ML_FEATURE_SPECIFICATION.md
feature_spec = """# ML FEATURE SPECIFICATION

## RAW OBSERVATIONS
- **gpm_precipitation** (Source: GPM IMERG Early/Late, Unit: mm/hr, Temporal: 0.5h, Spatial: 0.1 deg)

## STATIC FEATURES
- **elevation** (Source: SRTM DEM, Unit: m, Spatial: 30m)
- **land_cover_class** (Source: ESA WorldCover, Unit: categorical, Spatial: 10m)

## DERIVED MODEL FEATURES
- **rainfall_24h** (Window: preceding 24h, Unit: mm)
- **rainfall_72h** (Window: preceding 72h, Unit: mm)
- **slope** (Derived from elevation)
- **distance_to_river** (Derived from GIS network, Unit: m)

## UNAVAILABLE FEATURES (DO NOT USE)
- **water_level** (Blocked: CWC historical data is API errors)
- **soil_moisture** (Blocked: Coverage insufficient)
"""
with open(cat_dir / "ML_FEATURE_SPECIFICATION.md", "w", encoding="utf-8") as f:
    f.write(feature_spec)


# 3. ML_TARGET_AND_LABEL_SPECIFICATION.md
target_spec = """# ML TARGET AND LABEL SPECIFICATION

## DEFINITION OF TARGET
**Prediction Target**: `P(flood event occurring at specific district/basin within the next 24 hours)`

## JUSTIFICATION
The historical event dataset primarily has calendar-day precision. Predicting exact 6-hour onsets is scientifically indefensible given the label fuzziness. A 24-hour prediction window provides actionable early warning while aligning with the realistic temporal precision of the historical labels.

## LABELS
- **Positive (1)**: A documented authoritative flood event occurred in the district/basin within the 24h prediction window.
- **Negative (0)**: No documented flood event occurred.

*Note: Requires minimum 50-100 independent events to train a stable model. Current count (13) is insufficient.*
"""
with open(cat_dir / "ML_TARGET_AND_LABEL_SPECIFICATION.md", "w", encoding="utf-8") as f:
    f.write(target_spec)


# 4. ML_NEGATIVE_SAMPLING_SPECIFICATION.md
neg_sample = """# ML NEGATIVE SAMPLING SPECIFICATION

## METHODOLOGY
To create a defensible and non-leaky ML dataset, negative samples must be drawn from:
1. **Normal Monsoon Days**: Random days during the monsoon season (June-Sept) where no event was recorded in the target district.
2. **Heavy Rain Non-Events**: Days where GPM recorded > 90th percentile rainfall for the district, but no flood was reported. (Crucial for minimizing false positives).
3. **Spatial Negatives**: Neighboring districts on the day of an event, *if* definitively unaffected.
4. **Pre-Event Baselines**: A limited number of days (e.g., -7 days, -14 days) before an event to capture the transition, but NOT the immediate 1-2 days prior (which might already reflect unrecorded flooding or identical antecedent conditions).

## FORBIDDEN PRACTICES
- Random assignment of missing labels to 0.
- Using future days (post-event) as negatives if the system is still recovering.
"""
with open(cat_dir / "ML_NEGATIVE_SAMPLING_SPECIFICATION.md", "w", encoding="utf-8") as f:
    f.write(neg_sample)


# 5. ML_WEBSITE_DATA_MAPPING.md
web_map = """# WEBSITE ML INTEGRATION ARCHITECTURE

## ARCHITECTURE
- **Backend**: Python FastAPI service (`backend/app/main.py`). The ML model will be loaded in-memory here.
- **Frontend**: React application via Vite (`frontend/`).
- **Model Storage**: Trained model as an optimized artifact (e.g., `.joblib` or `.onnx`) in a cloud bucket or secure backend directory, tagged with version and checksum.

## DATA SOURCES PER DASHBOARD CARD
- **Overall Risk Probability**: ML OUTPUT (Supported)
- **High / Extreme Locations**: ML OUTPUT (Supported)
- **Rainfall Intensity**: RAW SENSOR DATA (Supported via GPM/IMD if live feed connected, else HISTORICAL)
- **Critical Water Levels**: NOT CURRENTLY SUPPORTED (CWC data is failing)
- **Risk Probability Trend**: ML OUTPUT (Supported)
- **Water Level Trend**: NOT CURRENTLY SUPPORTED
- **Historical Events**: HISTORICAL DATA (Supported via registry, not ML)
- **Live Stations**: NOT CURRENTLY SUPPORTED
"""
with open(cat_dir / "ML_WEBSITE_DATA_MAPPING.md", "w", encoding="utf-8") as f:
    f.write(web_map)


# 6. ML_API_CONTRACT.md
api_contract = """# ML API CONTRACT

## ENDPOINT
`POST /api/v1/predict`

## REQUEST PAYLOAD
```json
{
  "location_id": "str",
  "prediction_timestamp": "ISO-8601",
  "features": {
    "rainfall_24h": "float",
    "rainfall_72h": "float",
    "elevation": "float"
  }
}
```

## RESPONSE PAYLOAD
```json
{
  "prediction_timestamp": "2026-09-15T00:00:00Z",
  "location_id": "district_x",
  "risk_probability": 0.85,
  "risk_level": "HIGH",
  "prediction_horizon": "24h",
  "model_version": "v0.4.0-rf",
  "top_contributing_factors": [
    {"feature": "rainfall_72h", "contribution_direction": "positive"}
  ]
}
```
"""
with open(cat_dir / "ML_API_CONTRACT.md", "w", encoding="utf-8") as f:
    f.write(api_contract)


# 7. DASHBOARD_DATA_READINESS_MATRIX.csv
dash_matrix = [
    {"Dashboard Component": "Overall Risk Probability", "Required Data": "Model Probability", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No (Pending Model)", "Blocker": "Insufficient training events"},
    {"Dashboard Component": "High/Extreme Locations", "Required Data": "Risk Categories", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No", "Blocker": "Pending Model thresholds"},
    {"Dashboard Component": "Rainfall Intensity", "Required Data": "Rainfall API/GPM", "Source": "Raw Sensor Data", "ML Output?": "No", "Currently Available?": "Yes", "Blocker": "None"},
    {"Dashboard Component": "Critical Water Levels", "Required Data": "CWC Gauge telemetry", "Source": "Raw Sensor Data", "ML Output?": "No", "Currently Available?": "No", "Blocker": "CWC Historical API returns 404/503"},
    {"Dashboard Component": "Risk Probability Trend", "Required Data": "Historical ML outputs", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No", "Blocker": "Pending Model"},
    {"Dashboard Component": "Rainfall Trend", "Required Data": "Rainfall History", "Source": "Derived Analytics", "ML Output?": "No", "Currently Available?": "Yes", "Blocker": "None"},
    {"Dashboard Component": "Water Level Trend", "Required Data": "CWC Time Series", "Source": "Raw Sensor Data", "ML Output?": "No", "Currently Available?": "No", "Blocker": "CWC Data Unavailable"},
    {"Dashboard Component": "Risk by District/Basin", "Required Data": "Spatial ML output", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No", "Blocker": "Pending Model"},
    {"Dashboard Component": "Risk Factors", "Required Data": "Feature Importances/SHAP", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No", "Blocker": "Pending Model"},
    {"Dashboard Component": "Prediction vs Observed", "Required Data": "Past predictions & labels", "Source": "Analytics", "ML Output?": "No", "Currently Available?": "No", "Blocker": "No production model history yet"},
    {"Dashboard Component": "Top Risk Locations", "Required Data": "Sorted Risk", "Source": "ML Output", "ML Output?": "Yes", "Currently Available?": "No", "Blocker": "Pending Model"},
    {"Dashboard Component": "Historical Events", "Required Data": "Event Register", "Source": "Historical Data", "ML Output?": "No", "Currently Available?": "Yes", "Blocker": "Needs more events to be useful for ML, but register can be displayed"},
    {"Dashboard Component": "Live Stations", "Required Data": "IoT/Weather APIs", "Source": "External API", "ML Output?": "No", "Currently Available?": "No", "Blocker": "No live IoT integration in codebase"},
    {"Dashboard Component": "CWC Gauge Panel", "Required Data": "CWC Live feed", "Source": "External API", "ML Output?": "No", "Currently Available?": "No", "Blocker": "CWC endpoints are failing"}
]
pd.DataFrame(dash_matrix).to_csv(cat_dir / "DASHBOARD_DATA_READINESS_MATRIX.csv", index=False)

print("Files generated.")
