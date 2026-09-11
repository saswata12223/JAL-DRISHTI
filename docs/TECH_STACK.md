# Jal Drishti — Technology Stack Specification

**Authoritative Source:** Directly derived from `frontend/package.json`, `backend/requirements.txt`, `backend/app/config.py`, and source imports.

---

## 1. Core Stack Overview

```
Frontend Web Client        Backend REST Service       ML & Physics Engine         Hardware Gateway
(React 18 / Vite 5)   ──►  (FastAPI 0.115 / Python)  ──► (XGBoost 6.1 / PyTorch) ──► (ESP32 / MQTT)
```

---

## 2. Detailed Component Stack

### A. Frontend Web Application (`frontend/`)
- **Core Library:** React 18.3.1 (Single Page Application architecture).
- **Build Tool / Dev Server:** Vite 5.4.2 (Lightning-fast HMR, ES module output).
- **Geospatial Mapping:** Leaflet 1.9.4 & React-Leaflet 4.2.1 (Custom tile layers, risk color markers, station popups).
- **Data Visualization & Charts:** Recharts 2.12.7 (Rainfall trend lines, soil moisture curves, ROC calibration charts).
- **UI Icons & Styling:** Lucide React 0.436.0, Tailwind CSS 3.4.10, PostCSS 8.4, Autoprefixer 10.4, Tailwind-Merge 2.5, CLSX 2.1.
- **HTTP Client / Routing:** Axios 1.7.4 (REST requests to backend Port 8000), React Router DOM 6.26.0 (Client-side routing across 8 page views).

### B. Backend REST Application (`backend/`)
- **Language / Runtime:** Python 3.11.
- **Framework:** FastAPI 0.115.0 (Asynchronous ASGI framework, automated OpenAPI `/docs` generation).
- **Server:** Uvicorn 0.30.0 (High-performance ASGI server).
- **Data Validation & Settings:** Pydantic 2.8.0 & Pydantic-Settings 2.4.0 (Type safety & env management).
- **Data Querying & Dataframe Engine:** PyArrow 15.0.0, Pandas 2.2.0, NumPy 1.26.0 (High-speed Parquet data ingestion).
- **Spatial Calculations:** Shapely 2.0.0 (Geospatial point-in-polygon & bounding box validation).
- **ORM / Database Layer:** SQLAlchemy 2.0.30, GeoAlchemy2 0.15.0, Psycopg2-binary 2.9.9, Alembic 1.13.0 (PostgreSQL/PostGIS connection layer; system operates in Parquet mode by default).

### C. Machine Learning & Hydrological Physics (`ml/`)
- **Champion ML Model:** XGBoost 2.1.0 (`final_flood_risk_model.joblib` - 90.6 KB).
- **Feature Scaling:** Scikit-Learn / Joblib 1.4.0 (`feature_scaler.joblib` - 2.9 KB).
- **Deep Learning Framework:** PyTorch 2.3.0 (`torch` for benchmark GNN/LSTM artifacts).
- **Hydrological Physics:** SCS-CN Curve Number Runoff equations (`ml/physics.py`).

### D. Hardware Telemetry & Microcontroller (`hardware/`)
- **Microcontroller:** ESP32-WROOM-32 (Dual-core 240MHz, Wi-Fi / Serial).
- **Sensors:** JSN-SR04T Waterproof Ultrasonic Distance Sensor, Tipping Bucket Rain Gauge.
- **Gateway Script:** Python Pyserial / Paho-MQTT gateway (`hardware/scripts/mqtt_gateway.py`).

---

## 3. Data Formats & Protocols

- **Data Assets:** Apache Parquet (`.parquet`), netCDF4 (`.nc4`), GeoJSON, JSON.
- **API Protocols:** REST / HTTP JSON (Port 8000), MQTT (Port 1883).

---
*Jal Drishti Technical Documentation*
