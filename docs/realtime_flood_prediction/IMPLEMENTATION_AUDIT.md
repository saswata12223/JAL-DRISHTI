# Implementation Audit: Real-Time Multi-Source Flood Prediction Pipeline

## 1. EXISTING

*   **XGBoost Champion Model**: `final_flood_risk_model.joblib` (v6.1.0) exists in `data/processed/ml/models/`. It is trained to predict `flood_event_label` using 44 predictors.
*   **Feature Schema**: A robust feature schema is defined in `clean_feature_allowlist.json`, including IMERG rainfall, SMAP soil moisture, static ISRIC soil physics, and terrain topology.
*   **IMD Ingestion**: `scripts/imd_ingest.py` successfully retrieves IMD AWS, Synop, and METAR network observations.
*   **IMERG Ingestion**: `scripts/gpm_auto_ingest.py` performs EarthAccess downloads of GPM IMERG Early half-hourly data.
*   **Backend Architecture**: A FastAPI REST backend is fully established in `backend/app/` with routing, SQLite/PostgreSQL database models (`backend/app/db/`), and a React frontend.

## 2. MISSING

*   **GloFAS Integration**: No scripts currently exist to pull operational Global Flood Awareness System (GloFAS) forecasts or discharge variables.
*   **Google Flood Forecasting Integration**: MultiMet dynamic features (`ERA5_LAND`, `HRES`, `GRAPHCAST`) can be directly streamed via the official `googlehydrology.datasetzoo.multimet` GCS dataloader, completely bypassing local synthesis blocks. Needs formal integration into a realtime worker.
*   **Real-Time Temporal/Spatial Alignment Layer**: Missing a deterministic engine to align live IMERG, IMD, and GloFAS signals for a specific spatial coordinate exactly at inference time without future data leakage.
*   **Confidence & Calibration Engine**: No formal sub-system exists to calibrate XGBoost probabilities (Platt/Isotonic) or compute a multi-source confidence score based on data freshness/OOD status.
*   **Real-Time Scheduler**: Missing an asynchronous orchestration worker (e.g., APScheduler or Celery) to periodically poll sources, process features, run predictions, and update the API state.

## 3. REUSABLE

*   **XGBoost Model Pipeline**: The serialized `preprocessor.joblib` and `final_flood_risk_model.joblib` can be directly loaded into the new real-time inference engine.
*   **Database ORM Models**: Existing FastAPI SQLAlchemy configurations (`sos_database.py`, `auth_database.py`) provide a solid foundation for adding new `realtime_observations` and `flood_predictions` tables.
*   **IMD and IMERG Clients**: Core HTTP request logic and spatial parsing in `imd_ingest.py` and `gpm_auto_ingest.py` can be refactored into the new robust realtime adapters.

## 4. BROKEN / DEGRADED

*   **Live Inference Gap**: The current `app.py` live integration was built in Phase 5 for the *Random Forest* model over 28 events, bypassing the *XGBoost Champion* model (v6.1.0) on 44 features. The real-time engine needs to transition fully to the XGBoost model.
*   **Fault Tolerance**: Existing scripts are designed for batch offline retrieval. They lack the strict `LIVE`, `DEGRADED`, `UNAVAILABLE` health state management required for an always-on operational dashboard.

## 5. CONFLICTING

*   **Offline vs. Real-Time Processing**: The offline ML feature generation (`feature_engineering.py`) calculates rolling averages over complete historical arrays. A new real-time feature engineer is needed that computes `rain_3h`, `rain_6h`, etc., strictly from the incoming realtime cache buffer.

## 6. REQUIRES MANUAL CONFIGURATION

*   **API Credentials**:
    *   **NASA EarthData** credentials required for GPM IMERG Early.
    *   **Copernicus/CDS** credentials required for GloFAS operational data.
    *   **Google Flood Hub** API keys (Optional).
*   **Configuration File**: A centralized `.env` or `config.yaml` is needed to store the freshness thresholds (e.g., `imerg_minutes: 360`) and API keys securely.
