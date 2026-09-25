# RiverMamba Integration Audit

## PHASE 0: REPOSITORY AUDIT

### Existing Model & Architecture
*   **Existing Model**: The current Champion model is an XGBoost Classifier (`final_flood_risk_model.joblib`, v6.1.0) trained to predict flood events.
*   **Existing Feature Schema**: Defined in `clean_feature_allowlist.json` with 44 predictors spanning rainfall, weather, soil moisture, terrain, hydrology, physics, and river gauge data.
*   **Existing Preprocessing**: Handled by a serialized scikit-learn pipeline (`preprocessor.joblib`).
*   **Existing Realtime Ingestion**: Contains batch retrieval scripts but lacks a persistent robust realtime streaming/scheduling daemon.
*   **Existing IMERG**: `scripts/gpm_auto_ingest.py` retrieves NASA GPM IMERG Early half-hourly data.
*   **Existing IMD**: `scripts/imd_ingest.py` ingests IMD AWS, Synop, and METAR observations.
*   **Existing GloFAS**: Missing. No existing GloFAS integration scripts exist.
*   **Existing Database**: SQLAlchemy ORM backing a FastAPI application (PostgreSQL/SQLite).
*   **Existing API**: FastAPI backend located in `backend/app/`.
*   **Existing Scheduler**: Missing. No APScheduler or Celery tasks currently orchestrate the pipeline.

### Existing Phase 7D & Phase 8 Implementations
*   **Existing Phase 7D**: Present in `scripts/phase7d/run_phase7d.py`. It serves as the final scientific gate for the XGBoost model, ensuring target integrity, evaluating data provenance, preventing future leakage, and assessing classification metrics (PR-AUC, ROC-AUC) over train/val/test splits.
*   **Existing Phase 8**: Documented in `docs/PHASE8_ANOMALY_MODEL.md`. Due to severe class imbalance (60 positives vs 110,030 negatives), a supervised flood model was previously barred. Instead, an **IsolationForest** (unsupervised) anomaly detector was deployed to identify hydrometeorological outliers, mapping scores to EXTREME, HIGH, and ELEVATED percentiles.

### Integration Analysis
*   **Reusable Components**: The XGBoost pipeline, IMERG script, IMD script, and FastAPI database models are reusable.
*   **Conflicts**: The Phase 8 anomaly detector (IsolationForest) conceptually overlaps with the goal of assigning risk, but operates on completely different principles (unsupervised vs. supervised). The integration must ensure the XGBoost Champion and RiverMamba forecasts don't overwrite or conflict with the Phase 8 alerting layer.
*   **Missing Components**: GloFAS baseline, RiverMamba checkpoint, RiverMamba input ingestion (e.g., ECMWF-HRES/ERA5), deterministic task scheduler, and confidence calibration engine.
*   **Manual Requirements**: API credentials for EarthData (IMERG), CDS (GloFAS), and potentially ECMWF for RiverMamba inputs.

---

## PHASE 1: HUGGING FACE / RIVERMAMBA AUDIT

*   **Repository Type**: `HakamShams/RiverMamba_reforecasts` is a **Dataset** repository, not a standard Model repository.
*   **Files**: Contains 7z archives (`RiverMamba_glofas_reanalysis.7z`, `RiverMamba_glofas_reanalysis_full_map.7z`, `RiverMamba_grdc_obs.7z`) and metadata (`README.md`, `README.txt`, `GRDC_Meta`).
*   **Data Format**: NetCDF files (inside the archives) with temporal predictions and spatial dimensions.
*   **Available Metadata**: Describes medium-range river discharge forecasts up to 7 days lead time on a 0.05° global grid.
*   **Forecast Variables**: River discharge (e.g., `dis24` - averaged over 24 hours in m³/s).
*   **Spatial Resolution**: 0.05° grid.
*   **Temporal Resolution**: Daily (averaged over 24 hours).
*   **Forecast Lead Times**: 7 days (7 time steps in each NetCDF file).
*   **Geographic Coverage**: Global (90°N-60°S, 180°W-180°E).
*   **Required Input Variables**: CPC precipitation, ECMWF-HRES meteorological forecasts, ERA5-Land reanalysis, GloFAS static data.
*   **Model Architecture**: State Space Model (Mamba-based).
*   **Checkpoint Format**: Not explicitly provided as a standalone Hugging Face model weight (`.safetensors`/`.bin`) in the root of the repo. The documentation states pretrained models are included in the dataset, likely inside one of the archives, but recommends the official GitHub for code.
*   **Official Implementation**: The `README.txt` explicitly points to `https://github.com/HakamShams/RiverMamba_code` (v1.0.0) as the official software implementation.
*   **License**: Creative Commons Attribution 4.0 International (CC BY 4.0).

### Checkpoint / Blocker Status
**STATUS**: The Hugging Face repository does **NOT** contain an easily accessible, executable RiverMamba checkpoint directly via standard `huggingface_hub` model loading methods. We must fetch the code from the official GitHub (`HakamShams/RiverMamba_code`) and extract the model weights from the dataset archives to proceed with local inference benchmarking.
