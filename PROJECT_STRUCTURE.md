# Jal Drishti — Project Structure

This document describes the standardized top-level module layout for the Jal Drishti Flash Flood Early Warning System.

## Repository Layout

```
JAL_DRISTI_TEAM_READY_2026-09/
├── backend/          # FastAPI REST API, ML serving, database layer
├── frontend/         # React + Vite web dashboard (Port 5173)
├── ml/               # Machine learning inference engine (XGBoost, PyTorch)
├── pipelines/        # ETL and data processing pipelines
├── hardware/         # IoT sensor firmware and hardware integration
├── visualization/    # Geospatial and chart visualization utilities
├── data/             # Raw, processed, and ML-ready datasets
├── docs/             # Architecture diagrams, setup guides, API reference
├── tests/            # End-to-end integration test suite
├── scripts/          # Utility and automation scripts
├── notebooks/        # Jupyter notebooks for EDA and model training
├── README.md         # Project overview and quickstart
├── CONTRIBUTING.md   # Contribution guidelines
└── PROJECT_STRUCTURE.md  # This file
```

## Module Descriptions

| Module | Description |
|---|---|
| `backend/` | FastAPI REST API serving ML predictions and sensor data. Connects to PostgreSQL/PostGIS. |
| `frontend/` | React + TailwindCSS dashboard with Leaflet maps and Recharts visualizations. |
| `ml/` | FloodRiskInferenceEngine — XGBoost champion model with SCS-CN physics layer. |
| `pipelines/` | Automated ETL scripts for ingesting IMD, ISRO, and IoT telemetry data. |
| `hardware/` | ESP32/Arduino sensor node firmware for rainfall, soil moisture, and river level. |
| `visualization/` | Geospatial rendering utilities and chart generation modules. |
| `data/` | Raw sensor data, processed Parquet feature files, and trained ML model artifacts. |
| `docs/` | Setup guides, architecture diagrams, and API reference documentation. |
| `tests/` | Cross-module end-to-end integration test suite using pytest and unittest. |
| `scripts/` | Developer utility scripts for data ingestion, model retraining, and deployment. |

---
*Jal Drishti Technical Documentation*
