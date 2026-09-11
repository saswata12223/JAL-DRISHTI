# Jal Drishti — Project Structure & Directory Catalog

**Repository Root:** `C:\JAL DRISTI`

---

## 1. Directory Tree Overview

```
C:\JAL DRISTI├── backend/                       # FastAPI REST API Backend Service
│   ├── app/
│   │   ├── api/routes/            # REST endpoint routers (health, stations, risk, predictions)
│   │   ├── services/              # Risk Decision Engine, ML Prediction Service, Data Loader
│   │   ├── schemas/               # Pydantic data validation schemas
│   │   ├── config.py              # Application settings & spatial bounding box
│   │   └── main.py                # FastAPI application entrypoint
│   ├── README.md                  # Backend service documentation
│   └── requirements.txt           # Python backend dependencies
│
├── frontend/                      # React 18 + Vite 5 Single Page Application
│   ├── src/
│   │   ├── pages/                 # 8 Operational Views (Dashboard, RiskMap, Alerts, etc.)
│   │   ├── layouts/               # Sidebar navigation, Header, Layout wrappers
│   │   ├── components/            # Reusable UI cards, Leaflet map overlays, charts, modals
│   │   ├── services/              # Axios API service client
│   │   └── App.jsx                # React Router 6 route definitions
│   ├── package.json               # Frontend dependencies & npm scripts
│   ├── vite.config.js             # Vite dev server configuration & API proxy (target: 8000)
│   └── README.md                  # Frontend module documentation
│
├── ml/                            # Machine Learning Inference & Hydrological Physics
│   ├── inference.py               # FloodRiskInferenceEngine wrapper class
│   ├── physics.py                 # SCS-CN Hydrological Direct Runoff equations
│   └── README.md                  # ML module documentation
│
├── pipelines/                     # Data Processing & Feature Engineering Pipelines
│   ├── features.py                # Multimodal Feature Engineering Engine
│   ├── ingest.py                  # IMD/CWC/SMAP Data Ingestion Pipeline
│   ├── standardize.py             # Dataset Standardization Pipeline
│   └── README.md                  # Pipelines module documentation
│
├── scripts/                       # Production Scripts & Experiment Archives
│   ├── train_flood_model.py       # Phase 6 Champion XGBoost Model Trainer
│   ├── multimodal_features.py     # Multimodal Feature Extraction Script
│   ├── experiments/               # GPM satellite exploratory inspection utilities
│   └── archive/                   # Archived historical phase scripts & prototypes
│
├── hardware/                      # Microcontroller Firmware & MQTT Gateway
│   ├── firmware/                  # ESP32 C++ sensor node firmware (esp32_sensor_node.ino)
│   ├── scripts/                   # Python Serial/MQTT gateway script (mqtt_gateway.py)
│   └── README.md                  # Hardware module documentation
│
├── data/                          # Datasets & ML Models
│   ├── raw/                       # IMD, GPM, SMAP, DEM raw files
│   └── processed/                 # Parquet datasets, CWC thresholds, Champion ML model
│
├── tests/                         # Automated Integration Test Suite
│   ├── test_end_to_end.py         # Cross-module E2E integration test suite
│   └── README.md                  # Testing documentation
│
├── docs/                          # Central System Documentation
│   ├── PRD.md                     # Product Requirements Document
│   ├── TECH_STACK.md              # Technology stack specification
│   ├── SETUP.md                   # Complete installation & run guide
│   ├── PROJECT_STRUCTURE.md       # Directory catalog (this file)
│   ├── PROJECT_STATUS.md          # Live system status & verification index
│   ├── ARCHITECTURE.md            # System architecture & multi-signal fusion model
│   ├── API_REFERENCE.md           # FastAPI REST endpoint reference
│   ├── DATA_AND_ML.md             # Data pipelines & ML technical guide
│   ├── TESTING.md                 # Testing & QA guide
│   ├── HARDWARE_INTEGRATION.md    # ESP32 & MQTT gateway specification
│   ├── archive/                   # Archived historical Phase 1-8 acceptance reports
│   └── audit/                     # Forensic audit & cleanup reports
│
├── README.md                      # Central project entry point
├── CONTRIBUTING.md                # Developer contribution guidelines
└── LICENSE                        # MIT License
```

---
*Jal Drishti Technical Documentation*
