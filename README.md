# Jal Drishti — Hydrological Early Warning & Disaster Intelligence Platform

[![System Status](https://img.shields.io/badge/System_Status-ONLINE-success.svg)](#)
[![Python Version](https://img.shields.io/badge/Python-3.11-blue.svg)](#)
[![React Version](https://img.shields.io/badge/React-18.3-blue.svg)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Jal Drishti** is an operational, state-wide Flash Flood Early Warning and Environmental Risk Decision Platform built specifically for **Uttarakhand, India**.

Developed to address the severe monsoonal flash flood and cloudburst challenges in the Himalayan catchment, Jal Drishti fuses machine learning predictions, official Central Water Commission (CWC) river gauge thresholds, satellite/AWS environmental forcing data, and Soil Conservation Service Curve Number (SCS-CN) hydrological physics to deliver deterministic, actionable early warnings for emergency response units.

---

## 📸 Operational Web Platform

The Jal Drishti web interface provides 8 specialized operational views:
- 📊 **Dashboard (`/dashboard`):** High-level executive KPI indicators, CWC stage breaches, active extreme alerts, and decision intelligence.
- 🗺️ **Risk Map (`/risk-map`):** Interactive Leaflet geospatial map displaying flood risk across 1,000 spatial monitoring points in Uttarakhand.
- 📟 **Monitoring (`/monitoring`):** Real-time sensor telemetry and CWC river stage gauge observations.
- 📈 **Analytics (`/analytics`):** GPM rainfall accumulation curves, SMAP soil moisture saturation, and risk probability trend curves.
- ⚠️ **Alerts (`/alerts`):** Active WARNING and CRITICAL advisories mapped to SDRF/NDRF standard operating procedures.
- 📜 **Historical Events (`/historical-events`):** Case study benchmarks and historical disaster catalog (2013 Kedarnath, 2021 Chamoli).
- 🧠 **Model Intelligence (`/model-intelligence`):** ML champion model explainability, feature importances, ROC curves, and decision policy rules.
- 🏔️ **About Terrain (`/about-terrain`):** Topographical, DEM elevation, slope, and landcover specifications for Uttarakhand catchments.

---

## 🏗️ System Architecture

```
Environmental Data (IMD, GPM, SMAP, CWC, DEM)
             ↓
Data Ingestion & Standardization Pipelines (pipelines/)
             ↓
Unified Parquet Dataset (data/processed/standardized/unified_sensor_dataset.parquet)
             ↓
Multimodal Feature Engineering (pipelines/features.py)
             ↓
 ┌──────────────────────────────────────────────┐
 │ XGBoost Champion Model v6.1.0 (90.6 KB)      │
 │ + SCS-CN Hydrological Physics (ml/physics.py)│
 └──────────────────────┬───────────────────────┘
                        ↓
   Multi-Signal Risk Decision Engine (backend/app/services/risk_decision_engine.py)
   (Combines ML Probability + CWC Thresholds + Rainfall + Soil Saturation)
                        ↓
          FastAPI REST Service (Port 8000)
                        ↓
     React 18 + Vite 5 Web Client (Port 5173)
```

---

## 🛠️ Quickstart Guide

### Prerequisites
- **Python 3.11** installed on system.
- **Node.js 18+** & **npm 9+** installed on system.

### 1. Clone & Setup Virtual Environment
```powershell
cd "C:\JAL DRISTI"
py -3.11 -m venv .venv
& "C:\JAL DRISTI\.venv\Scripts\Activate.ps1"
pip install -r backend/requirements.txt
```

### 2. Launch Backend REST API (Port 8000)
```powershell
py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Backend interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)*

### 3. Launch Frontend Web Client (Port 5173)
Open a second terminal window:
```powershell
cd "C:\JAL DRISTIrontend"
npm install
npm run dev
```
*Frontend application: [http://localhost:5173](http://localhost:5173)*

---

## 🧪 Automated Testing

To run the automated cross-module integration test suite:
```powershell
python -m unittest tests/test_end_to_end.py
```

---

## 📚 Central Documentation Index

Detailed specifications are available in the [`docs/`](docs/) directory:

- 📋 [**Product Requirements Document (PRD)**](docs/PRD.md)
- 💻 [**Technology Stack Specification**](docs/TECH_STACK.md)
- ⚙️ [**Complete Setup & Installation Guide**](docs/SETUP.md)
- 📂 [**Project Repository Structure**](docs/PROJECT_STRUCTURE.md)
- 📌 [**Current Project & Implementation Status**](docs/PROJECT_STATUS.md)
- 🏗️ [**System Architecture & Fusion Flow**](docs/ARCHITECTURE.md)
- 🔌 [**FastAPI REST API Reference**](docs/API_REFERENCE.md)
- 🧠 [**Data Pipelines & ML Technical Guide**](docs/DATA_AND_ML.md)
- 🧪 [**Testing & Quality Assurance Guide**](docs/TESTING.md)
- 📟 [**Hardware ESP32 & MQTT Gateway Guide**](docs/HARDWARE_INTEGRATION.md)
- 🤝 [**Developer Contribution Guidelines**](CONTRIBUTING.md)

---

## ⚖️ Implemented vs. Research Capabilities

| Component | Implemented & Active Runtime Capability | Research / Offline Artifact |
|---|---|---|
| **ML Inference Model** | **XGBoost Champion Model v6.1.0** (`final_flood_risk_model.joblib`) | PyTorch GNN & LSTM weights in `data/processed/ml/models/` |
| **Physics Layer** | **SCS-CN Direct Runoff $Q$ Calculation** (`ml/physics.py`) | Hydrodynamic 2D grid flood plain simulations |
| **Data Engine** | High-performance Parquet datasets (`unified_sensor_dataset.parquet`) | Live PostgreSQL/PostGIS connection (optional ORM layer ready) |
| **Hardware** | ESP32 Ultrasonic Firmware & MQTT Gateway (`mqtt_gateway.py`) | Physically deployed sensor network (telemetry supported via REST/MQTT) |

---
*Maintained by the Jal Drishti Development Team.*
