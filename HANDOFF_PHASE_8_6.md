# JAL DRISHTI — PHASE 8.6 GITHUB HANDOFF DOCUMENTATION

**Project:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)

**Handoff Date:** September 14, 2026

**Status:** **`INSAT3DR_ACCESS_BLOCKED`** (Phase 8.6 Completed & Validated)

**Production Isolation:** **100% ENFORCED (Zero model or API contract mutation)**



---



## 1. Executive Summary & Work Completed (Phases 7 — 8.6)



This repository contains the complete implementation, data ingestion pipelines, model intelligence dashboard, and scientific audit reports for **Jal Drishti** up through **Phase 8.6**.



### Phase Progress Summary

- **Phase 7 — Live Rolling ML Pipeline:** Integrated real NASA GPM IMERG Early precipitation, NASA SMAP soil moisture, and IMD AWS weather station telemetry into a dynamic 15-day rolling feature matrix orchestrator (`scripts/orchestrate_rolling_pipeline.py`).

- **Phase 8.1 — Production ML Integrity Audit:** Audited backend prediction paths, restored XGBoost v6.1.0 candidate model isolation, and established strict 34-feature contract enforcement.

- **Phase 8.2 — Live Rolling Data Path Correction:** Decoupled synthetic CWC station telemetry signatures from active ML inference while preserving official CWC hydraulic threshold alerts.

- **Phase 8.3 — pySTEPS Nowcasting Feasibility:** Tested pySTEPS optical-flow rainfall nowcasting using NASA GPM IMERG Early ($0.1^\circ \approx 10\text{ km}$, 30-min). Established that GPM IMERG Early resolution is too coarse for useful optical-flow motion vectors and performed worse than persistence. **Result:** `PYSTEPS_DATA_LIMITED_REQUIRES_BETTER_PRECIPITATION_FIELDS`.

- **Phase 8.4 — High-Resolution Source Audit:** Evaluated ISRO MOSDAC INSAT-3DR QPE/HEOP ($0.04^\circ \approx 4\text{ km}$, 15-min) and IMD DWR as candidate high-resolution precipitation fields.

- **Phase 8.5 — INSAT-3DR Initial Investigation:** Established MOSDAC portal reachability. Identified that Phase 8.5 reported ground metrics (POD 1.000, CSI 0.4667, MAE 7.20 mm) were code unit test outputs rather than empirical satellite validation.

- **Phase 8.6 — Official MOSDAC Access & Real-Data Validation:** Confirmed unauthenticated HTTP bulk downloads of raw HDF5 granules (`3R_HEOP` / `3D_HEOP`) are blocked without MOSDAC user registration and API session tokens (`INSAT3DR_ACCESS_BLOCKED`). Formally invalidated Phase 8.5 ground metrics (`PHASE8_5_INSAT_IMD_METRICS_INVALID_AS_INSAT_VALIDATION`).



---



## 2. Production vs. Experimental Architecture



```

                               ┌─────────────────────────────────────────┐

                               │           PRODUCTION PIPELINE           │

                               └─────────────────────────────────────────┘

  NASA GPM IMERG (0.1°) ──┐

  NASA SMAP Surface     ──┼─► scripts/orchestrate_rolling_pipeline.py ─► data/processed/ml/rolling/

  IMD AWS Stations      ──┘                   │ (34-Feature Contract)

                                              ▼

                                 ml/inference.py (XGBoost v6.1.0)

                                              │

                                              ▼

                               backend/app/services/risk_decision_engine.py

                                              │

                                              ▼

                                    FastAPI /api/v1/risk/latest

                                              │

                                              ▼

                                     React / Vite Dashboard



                               ┌─────────────────────────────────────────┐

                               │        EXPERIMENTAL (ISOLATED)          │

                               └─────────────────────────────────────────┘

  ISRO MOSDAC INSAT-3DR ──► ml/precipitation/insat3dr/ ──► (Blocked - Requires API Token)

  pySTEPS Nowcasting    ──► ml/nowcasting/             ──► (Data-limited - Excluded)

```



---



## 3. Production Specifications & Feature Contract



### Active Production Model

- **Engine:** XGBoost Classifier v6.1.0 (`data/processed/ml/models/candidate_flood_risk_model_phase4.joblib`)

- **Scaler / Preprocessor:** RobustScaler (`data/processed/ml/models/candidate_feature_preprocessor_phase4.joblib`)

- **Feature Allowlist Contract:** Exactly 34 features (`data/processed/ml/models/candidate_feature_allowlist_phase4.json`)



### Telemetry Ingestion Status

1. **NASA GPM IMERG Early:** Active live ingestion via HTTPS (`scripts/gpm_auto_ingest.py`).

2. **NASA SMAP Soil Moisture:** Active live surface soil moisture Ingestion (`scripts/smap_ingest.py`).

3. **IMD AWS Weather:** Active live station network feed (`scripts/imd_ingest.py`).

4. **CWC Water Levels:** Hydraulic threshold alert logic active; synthetic telemetry removed from ML inference (`scripts/waterlevel_ingest.py`).

5. **ESP32 Edge Micro-Gauges:** Active edge sensor ingestion via `/api/v1/telemetry/esp32`.



---



## 4. Invalidation of Phase 8.5 Fake INSAT Metrics



> [!CAUTION]

> **PROVENANCE AUDIT NOTICE:** The IMD ground validation metrics cited in the Phase 8.5 report (POD = 1.000, CSI = 0.4667, MAE = 7.20 mm, RMSE = 11.06 mm) were derived from an isolated code unit test comparing IMD station observations against the station mean. Zero genuine INSAT-3DR granules were parsed.

> **Official Label:** `PHASE8_5_INSAT_IMD_METRICS_INVALID_AS_INSAT_VALIDATION`

> Do **NOT** cite these numbers as satellite accuracy metrics in future presentations or papers.



---



## 5. What the Next Teammate Should Do



If you are taking over development for Phase 8.7 or future deployments, follow these recommendations:



1. **Maintain Production Baseline:**

   - Keep NASA GPM IMERG Early as the operational precipitation source for the 34-feature XGBoost v6.1.0 model.

   - Do **NOT** add INSAT features to the production 34-feature contract without retraining and shadow evaluation.

2. **Securing MOSDAC Credentials (If Pursuing High-Res Nowcasting):**

   - Register an institutional user account at ISRO MOSDAC (`https://www.mosdac.gov.in/user/register`).

   - Obtain an official MOSDAC API Token or session credential header.

   - Set environment variables `MOSDAC_USERNAME` and `MOSDAC_API_TOKEN` in `.env`.

3. **High-Resolution Precipitation Research:**

   - Once credentials are obtained, use `ml/precipitation/insat3dr/downloader.py` to acquire raw HDF5 granules (`3D_HEOP`).

   - Run experimental validation using `ml/precipitation/insat3dr/validation.py`.

4. **IMD Doppler Weather Radar (Alternative Option):**

   - Explore requesting IMD DWR radar reflectivity datasets over Dehradun / Mukteshwar as an alternative sub-kilometer Nowcasting source.



---



## 6. How to Install, Run & Test



### Installation

```bash

# Clone repository

git clone https://github.com/souvikkhaitan-hash/JAL-DRISHTI.git

cd JAL-DRISHTI



# Set up Python virtual environment

python -m venv .venv

.\.venv\Scripts\activate



# Install requirements

pip install -r requirements.txt

```



### Running Backend & Frontend

```bash

# Start FastAPI backend

uvicorn backend.app.main:app --reload --port 8000



# Start Frontend React app (in separate terminal)

cd frontend

npm install

npm run dev

```



### Running Automated Test Suite

```bash

.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"

```

*(All 64 tests should pass cleanly).*



---



## 7. Required Environment Variables Template



Create a `.env` file in the root directory (this file is `.gitignore` protected and must **NEVER** be committed):



```ini

# Environment Configuration (Template - DO NOT COMMIT SECRETS)

ENVIRONMENT=development

LOG_LEVEL=INFO



# NASA Earthdata Authentication (For GPM / SMAP Ingestion)

EARTHDATA_USERNAME=your_earthdata_username

EARTHDATA_PASSWORD=your_earthdata_password

EARTHDATA_BEARER_TOKEN=your_earthdata_bearer_token



# ISRO MOSDAC Credentials (Optional for INSAT-3DR Research)

MOSDAC_USERNAME=your_mosdac_username

MOSDAC_API_TOKEN=your_mosdac_api_token



# CWC API Key (Optional)

CWC_API_KEY=your_cwc_api_key



# Secret Key for JWT / Auth

SECRET_KEY=your_development_secret_key_here

```



---

*Documentation compiled for Jal Drishti Handoff — Phase 8.6.*
