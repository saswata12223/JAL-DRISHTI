# Jal Drishti — Technology Stack Specification

**Platform:** Jal Drishti (FlashFloodAI) — Hydrological Early Warning & Disaster Intelligence Platform  
**Target Region:** Uttarakhand, India (Himalayan Catchments: Alaknanda, Mandakini, Bhagirathi, Pindar, Tons, Kali)  
**Authoritative Source:** Directly derived from `frontend/package.json`, `backend/requirements.txt`, `backend/app/config.py`, and runtime microservices.

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FRONTEND LAYER                                        │
│  React 18.3 (SPA) • Vite 5.4 • Tailwind CSS 3.4 • Leaflet 1.9 • Three.js / Fiber 3D     │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Reverse Proxy / HTTP REST
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   BACKEND REST API                                      │
│     FastAPI 0.115 • Uvicorn (ASGI) • Pydantic v2 • Pandas / PyArrow Parquet Engine      │
└─────────────────────┬─────────────────────────────────────────────┬─────────────────────┘
                      │                                             │
                      ▼                                             ▼
┌───────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│          ML & HYDROLOGICAL ENGINE         │ │      TELECOMMUNICATIONS & DISSEMINATION   │
│ • XGBoost 2.1.0 Champion Model (v6.1.0)   │ │ • Twilio Cloud Voice PSTN Gateway         │
│ • SCS-CN Runoff Physics (`ml/physics.py`) │ │ • TwiML Multilingual Voice Synthesis      │
│ • Multi-Signal Decision Fusion Engine     │ │ • Microsoft Edge-TTS High-Fidelity Audio  │
│ • PyTorch Benchmark Artifacts (GNN/LSTM)  │ │ • Priority SMS / WhatsApp / Webhook SOS   │
└───────────────────────────────────────────┘ └───────────────────────────────────────────┘
                      ▲                                             ▲
                      │                                             │
┌───────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│          GEOSPATIAL & ENVIRONMENTAL       │ │             IOT & HARDWARE LAYER          │
│ • 1,000 Uttarakhand Spatial Grid Points   │ │ • ESP32-WROOM-32 Dual-Core Microcontroller│
│ • CWC Gauge Danger/Warning Thresholds     │ │ • JSN-SR04T Waterproof Ultrasonic Sensor  │
│ • GPM IMERG Rainfall Accumulation         │ │ • Tipping Bucket Digital Rain Gauge       │
│ • SMAP Soil Moisture & Carto Topography   │ │ • MQTT Telemetry Broker (Port 1883)       │
└───────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 2. Comprehensive Layer-by-Layer Tech Stack

### A. Frontend Web Client (`frontend/`)

| Technology | Version | Category | Purpose & Capabilities |
|---|---|---|---|
| **React** | `18.3.1` | Core UI Framework | Single-Page Application (SPA) architecture with component state, hooks, and context management. |
| **Vite** | `5.4.2` | Build Tool & Dev Server | Lightning-fast Hot Module Replacement (HMR), ES-module bundling, and `/api` reverse proxy configuration. |
| **React Router DOM** | `6.26.0` | Client Routing | Declarative routing across 10 operational views (`/dashboard`, `/risk-map`, `/immediate-actions`, `/simulation`, `/monitoring`, etc.). |
| **Tailwind CSS** | `3.4.10` | Styling Engine | Utility-first responsive design, dark/light mode theming, and custom tactical HUD aesthetics. |
| **Leaflet & React-Leaflet** | `1.9.4` / `4.2.1` | Geospatial GIS Engine | High-performance interactive maps rendering 1,000 spatial points, CWC gauges, safe corridors, and flood zones. |
| **Three.js & React Three Fiber**| `0.185.1` / `8.18.0` | 3D Graphics Engine | Interactive 3D terrain elevation and river basin water volume simulations (`@react-three/drei`). |
| **Recharts** | `2.12.7` | Data Visualization | Interactive time-series charts for rainfall accumulation, soil saturation, water discharge, and ROC curves. |
| **Anime.js** | `4.5.0` | Motion Animation | Micro-animations for emergency alert pulsing, wave effects, and telemetry transitions. |
| **Lucide React** | `0.436.0` | Iconography | Modern, consistent vector icons for UI actions, sensors, and status badges. |
| **Axios** | `1.7.4` | HTTP / API Client | Asynchronous REST communication with backend endpoints with global request/response interceptors. |
| **Web Audio API & HTML5 Audio**| Native Browser | Audio Synthesis | Real-time multi-lingual emergency siren, ringing tones, and studio IVR playback without external player plugins. |

---

### B. Backend REST Service (`backend/`)

| Technology | Version | Category | Purpose & Capabilities |
|---|---|---|---|
| **Python** | `3.11` | Runtime Environment | High-performance asynchronous execution runtime. |
| **FastAPI** | `0.115.0` | REST API Framework | High-throughput async ASGI web framework with automated interactive Swagger docs (`/docs`) and ReDoc (`/redoc`). |
| **Uvicorn** | `0.30.0` | ASGI Web Server | Production-ready asynchronous web server running the REST API on port `8000`. |
| **Pydantic & Pydantic-Settings** | `2.8.0` / `2.4.0` | Data Validation & Config | Strict schema validation, type safety, and automatic environment variable resolution (`.env`). |
| **PyArrow & Pandas** | `15.0.0` / `2.2.0` | High-Speed Data Engine | In-memory querying and column-oriented filtering across multi-gigabyte Parquet hydrological datasets. |
| **NumPy & Scipy** | `1.26.0` / `1.12.0` | Numerical Computing | Vectorized rainfall, runoff, and catchment slope calculations. |
| **Shapely** | `2.0.0` | Computational Geometry | Spatial point-in-polygon containment and Uttarakhand bounding box validation (`77.80°E - 81.10°E, 28.50°N - 31.50°N`). |
| **HTTPX** | `0.27.0` | Async HTTP Client | Asynchronous outbound communication with Twilio Cloud API and external meteorological services. |
| **SQLAlchemy & Alembic** | `2.0.30` / `1.13.0` | Database ORM & Migrations| Optional PostgreSQL / PostGIS relational persistence layer for disaster records and audit logs. |

---

### C. Machine Learning & Hydrological Physics Engine (`ml/`)

| Technology | Version | Purpose & Capabilities |
|---|---|---|
| **XGBoost** | `2.1.0` | **Champion Classifier (v6.1.0)** (`final_flood_risk_model.joblib` — 90.6 KB). High-speed gradient boosting predicting flood probabilities from multi-sensor features. |
| **Scikit-Learn** | `1.3.2+` | Robust feature scaling pipeline (`feature_scaler.joblib`) with strict feature allowlist validation (`model_feature_allowlist.json`). |
| **SCS-CN Physics Model** | Custom (`ml/physics.py`) | Deterministic Soil Conservation Service Curve Number runoff equation: $$Q = \frac{(P - I_a)^2}{(P - I_a) + S}$$ accounting for AMC II antecedent moisture and soil hydrologic group. |
| **Decision Fusion Engine** | Custom (`backend/app/services/risk_decision_engine.py`) | Fuses ML Risk Probability (40%), CWC Gauge Stage Breaches (35%), 24h GPM Rainfall (15%), and SMAP Soil Saturation (10%) into deterministic 4-tier alerts (`LOW`, `ADVISORY`, `WARNING`, `CRITICAL`). |
| **PyTorch (Benchmarking)** | `2.3.0` | Benchmark deep learning artifacts (Spatio-Temporal GNN & LSTM models for research validation). |

---

### D. Telecommunications & Emergency Dissemination

| Service / Tool | Protocol / Format | Capability |
|---|---|---|
| **Twilio Cloud Voice API** | REST / HTTPS (PSTN) | Direct cellular outbound voice call placement to registered citizen and rescue authority mobile phones across Uttarakhand. |
| **TwiML Voice Synthesis** | XML / TwiML | Multilingual emergency speech synthesis delivering automated warnings in **Hindi**, **English**, and **Garhwali/Kumaoni**. |
| **Microsoft Edge-TTS** | Neural TTS (MP3) | Offline high-fidelity pre-rendered audio warnings (`hi-IN-SwaraNeural`, `en-IN-NeerjaNeural`, `hi-IN-MadhurNeural`). |
| **Twilio SMS / WhatsApp API**| REST / Webhooks | Instant broadcast SMS text warnings and WhatsApp notifications containing emergency shelter directions and SOS links. |

---

### E. IoT & Edge Hardware Telemetry (`hardware/`)

| Hardware Component | Protocol / Specs | Role in Platform |
|---|---|---|
| **ESP32-WROOM-32** | 240 MHz Dual-Core, 802.11 b/g/n Wi-Fi | Edge microcontroller sampling sensor readings and streaming telemetry. |
| **JSN-SR04T Sensor** | Ultrasonic (20 cm – 600 cm range) | Non-contact waterproof river stage level monitoring mounted on river bridges/culverts. |
| **Tipping Bucket Gauge**| Digital Pulse (0.2 mm/tip) | Real-time precipitation rate and intensity measurement. |
| **Physical Buzzer / Actuator**| GPIO Control (Active Low) | High-decibel audible emergency siren triggered when water level breaches CWC danger mark. |
| **Python Serial/MQTT Gateway**| `paho-mqtt` / `pyserial` | Bidirectional telemetry bridge forwarding edge sensor data to the central platform. |

---

## 3. Data Storage & Formats

- **Time-Series Sensor Data:** Apache Parquet (`unified_sensor_dataset.parquet`) for sub-millisecond querying.
- **Geospatial Basemaps & Tiles:** CARTO Basemaps, Esri World Topo Map, OpenStreetMap vector/raster tiles.
- **Environmental Forcing Data:** NASA GPM IMERG Precipitation, NASA SMAP Soil Moisture, SRTM/ASTER 30m Digital Elevation Models (DEM).
- **Relational Data (Optional):** PostgreSQL 16 + PostGIS extension for spatial queries.

---

## 4. Development & Runtime Ports

| Service | Port | Environment |
|---|---|---|
| **Frontend Web App** | `5173` | Node.js / Vite (`http://localhost:5173`) |
| **Backend REST API** | `8000` | Python / Uvicorn (`http://localhost:8000`) |
| **API Documentation** | `8000` | Swagger UI (`http://localhost:8000/docs`) |
| **MQTT Telemetry Broker** | `1883` | Eclipse Mosquitto / EMQX |
