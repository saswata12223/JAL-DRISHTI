# ML Phase 8.2 — Real Live ML Data-Path Integration Report



## 1. Objective



The primary objective of **Phase 8.2** is to switch the live operational prediction pipeline of the Jal Drishti platform to consume the real rolling feature matrix (`data/processed/ml/rolling/rolling_features_latest.parquet`) produced by the Phase 7 multi-satellite pipeline, evaluate the promoted Phase 4 candidate XGBoost model (`candidate_flood_risk_model_phase4.joblib`) strictly against the verified 34-feature physical predictor contract, and completely remove synthetic CWC telemetry (`STATION_LIVE_TELEMETRY_SIGNATURES`) from active risk decisions.



---



## 2. Previous Production Data Path



Prior to Phase 8.2, the audit in Phase 8.1 established that:

- `/api/v1/risk/latest` loaded historical predictions directly from `data/processed/ml/flood_risk_predictions.parquet`.

- `STATION_LIVE_TELEMETRY_SIGNATURES` (hardcoded test sine wave functions) were being evaluated as real water levels and generating alerts.

- Live satellite ingestion (GPM, SMAP, IMD) was running, but its latest feature outputs were bypassed by the API.



---



## 3. Corrected Production Data Path



```

REAL EXTERNAL DATA (GPM IMERG, SMAP L3, IMD Gridded)

    ↓

Phase 7 Rolling Feature Pipeline (`scripts/orchestrate_rolling_pipeline.py`)

    ↓

`data/processed/ml/rolling/rolling_features_latest.parquet` (8,199 location rows)

    ↓

34-Feature Contract Validation (`candidate_feature_allowlist_phase4.json`)

    ↓

Candidate Preprocessor (`candidate_feature_preprocessor_phase4.joblib`)

    ↓

Candidate XGBoost Model (`candidate_flood_risk_model_phase4.joblib`)

    ↓

Continuous ML Risk Probability ($P_{\text{ML}} \in [0.0405, 0.9595]$)

    ↓

USDMA/CWC Policy v8.1.0 (Deterministic Physics & Signal Integration)

    ↓

FastAPI Response (`/api/v1/risk/latest`) & React Dashboard

```



---



## 4. Files Changed



1. **[`backend/app/services/risk_decision_engine.py`](file:///c:/JAL-DRISHTI/backend/app/services/risk_decision_engine.py)**

   - Replaced reference from historical `flood_risk_predictions.parquet` to `rolling_features_latest.parquet`.

   - Added strict 34-feature contract verification.

   - Detached `STATION_LIVE_TELEMETRY_SIGNATURES` from active production risk loops.

   - Set CWC live status to `UNAVAILABLE` when the external CWC REST API is HTTP 503, setting `water_level_m = None`.

   - Set ESP32 hardware status to `OFFLINE`.



2. **[`tests/test_risk_decision_engine.py`](file:///c:/JAL-DRISHTI/tests/test_risk_decision_engine.py)**

   - Updated and added unit tests validating rolling parquet ingestion, 34-feature strict validation, synthetic CWC exclusion, CWC HTTP 503 fallback, and ESP32 offline handling.



---



## 5. Model Used



- **Artifact Path:** `data/processed/ml/models/candidate_flood_risk_model_phase4.joblib`

- **Preprocessor Path:** `data/processed/ml/models/candidate_feature_preprocessor_phase4.joblib`

- **Model Architecture:** XGBoost Classifier v6.1.0 (Phase 4 Candidate)

- **Status:** Unmodified, zero retraining, zero hyperparameter edits.



---



## 6. 34-Feature Contract



The model accepts exactly 34 physical predictors specified in `candidate_feature_allowlist_phase4.json`:

- **Precipitation Accumulations (10):** `precip_1h`, `precip_3h`, `precip_6h`, `precip_12h`, `precip_24h`, `precip_48h`, `precip_72h`, `precip_7d`, `precip_14d`, `precip_30d`

- **Precipitation Statistics (4):** `precip_intensity_max`, `precip_rolling_mean_24h`, `precip_rolling_std_24h`, `precip_anomaly_ratio`

- **Soil Moisture & Hydrology (7):** `soil_moisture_surface`, `soil_moisture_rootzone`, `soil_moisture_profile`, `soil_saturation_index`, `soil_moisture_anomaly`, `soil_moisture_delta_24h`, `soil_drainage_capacity`

- **SCS-CN Physics (6):** `scs_cn_value`, `scs_retention_s_mm`, `scs_ia_mm`, `scs_direct_runoff_24h_mm`, `scs_direct_runoff_72h_mm`, `scs_runoff_coeff_24h`

- **Terrain & Catchment Geo-Features (7):** `elevation_m`, `slope_degrees`, `aspect_degrees`, `flow_accumulation`, `twi`, `distance_to_river_m`, `drainage_density`



---



## 7. Rolling Dataset Source



- **File:** `data/processed/ml/rolling/rolling_features_latest.parquet`

- **Metadata File:** `data/processed/ml/rolling/rolling_metadata_latest.json`

- **Total Operational Rows:** 8,199 locations across Uttarakhand and Himalayan river basins.

- **Data Freshness:** `FRESH` (Latest safe timestamp: `2026-09-13T12:00:00Z`).



---



## 8. GPM Provenance



- **Source:** NASA GPM IMERG Final/Early Precipitation Rate.

- **Verification:** Authenticated ingest confirmed via Phase 7.1 GPM authentication repair (`NASA Earthdata Bearer Token`).



---



## 9. SMAP Provenance



- **Source:** NASA SMAP L3 Radiometer Global Soil Moisture (9km).

- **Verification:** Verified multi-layer surface and rootzone soil moisture fields.



---



## 10. IMD Provenance



- **Source:** India Meteorological Department High-Resolution Gridded Rainfall ($0.25^\circ \times 0.25^\circ$).

- **Verification:** Cross-validated against GPM satellite precipitation grid.



---



## 11. CWC Status



- **Status:** `UNAVAILABLE` / `DEGRADED`

- **HTTP Endpoint:** External CWC Gauge API returns HTTP 503 (`Service Unavailable`).

- **Data Treatment:** `water_level_m` set to `None` ("Gauge offline" in dashboard UI). Zero synthetic water levels are injected.



---



## 12. ESP32 Status



- **Status:** `OFFLINE` / `NOT_CONNECTED`

- **Data Treatment:** ESP32 physical telemetry stream is reported as offline. Zero test values are used.



---



## 13. Synthetic Telemetry Removal



- `STATION_LIVE_TELEMETRY_SIGNATURES` in `backend/app/services/risk_decision_engine.py` was marked as `SYNTHETIC_TEST_SIGNATURES_INACTIVE` and completely isolated from production risk evaluation.

- Alerts cannot be triggered by synthetic CWC water level sine waves.



---



## 14. API Data Flow



1. Request received at `/api/v1/risk/latest`.

2. Engine reads `rolling_features_latest.parquet`.

3. 34 physical features are validated and converted into numeric matrix.

4. `candidate_feature_preprocessor_phase4.joblib` transforms features.

5. `candidate_flood_risk_model_phase4.joblib` predicts raw probabilities ($P_{\text{ML}}$).

6. USDMA Policy v8.1.0 integrates $P_{\text{ML}}$ with satellite precipitation/soil saturation.

7. Serialized JSON response returned with explicit source timestamps and freshness metadata.



---



## 15. Risk Policy Integration



- **Policy Version:** USDMA/CWC Risk Policy v8.1.0.

- **Behavior:** Deterministic safety policy. Integrates ML probability ($P_{\text{ML}}$) alongside physical threshold triggers (24h rain, soil saturation index, SCS runoff).



---



## 16. Alert Safety



- **Rule:** Alerts are generated ONLY from real validated ML output and satellite forcing signals.

- **Safety Guarantee:** With CWC unavailable, alert stages rely on non-CWC physical safety rules without fake water levels.



---



## 17. Representative Prediction Traces



| Trace Property | Location 1: Devprayag (`CWC_UK_001`) | Location 2: Joshimath (`CWC_UK_004`) | Location 3: Dakpathar (`CWC_UK_012`) |

| :--- | :--- | :--- | :--- |

| **Latitude / Longitude** | 30.1458° N, 78.5986° E | 30.5556° N, 79.5667° E | 30.4900° N, 77.7800° E |

| **Rolling Matrix Row** | `rolling_features_latest.parquet` | `rolling_features_latest.parquet` | `rolling_features_latest.parquet` |

| **34 Predictor Check** | Valid (34/34 match allowlist) | Valid (34/34 match allowlist) | Valid (34/34 match allowlist) |

| **ML Probability ($P_{\text{ML}}$)** | `0.0405` (4.05%) | `0.0405` (4.05%) | `0.1528` (15.28%) |

| **Final Policy State** | `LOW` | `LOW` | `LOW` |

| **Rainfall (24h)** | `0.0 mm/h` | `0.0 mm/h` | `0.0 mm/h` |

| **Soil Saturation Index**| `81.2%` | `81.2%` | `81.2%` |

| **SCS Runoff (24h)** | `0.0 mm` | `0.0 mm` | `0.0 mm` |

| **CWC Status** | `UNAVAILABLE` | `UNAVAILABLE` | `UNAVAILABLE` |

| **Water Level** | `None` ("Gauge offline") | `None` ("Gauge offline") | `None` ("Gauge offline") |

| **ESP32 Status** | `OFFLINE` | `OFFLINE` | `OFFLINE` |

| **Data Freshness** | `FRESH` | `FRESH` | `FRESH` |



---



## 18. Test Results



Command executed:

```powershell

.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"

```

Output:

```

Ran 25 tests in 6.421s

OK

```



All 25 test cases (including rolling feature loading, 34-feature contract verification, synthetic CWC exclusion, CWC HTTP 503 handling, and ESP32 offline status) passed cleanly.



---



## 19. Live Verification Results



Live API query executed against local uvicorn server running `app.main:app`:

- **Endpoint:** `http://127.0.0.1:8000/api/v1/risk/latest`

- **HTTP Status:** `200 OK`

- **Data Source:** Verified `rolling_features_latest.parquet` provenance.

- **Probability Range:** Continuous continuous predictions from $0.0405$ up to $0.9595$ across 8,199 locations.

- **CWC Output:** `cwc_status: "UNAVAILABLE"`, `water_level_m: null`, `is_gauge_offline: true`.



---



## 20. Limitations



1. **CWC HTTP 503:** External CWC gauge servers remain offline. System operates safely in degraded mode without gauge telemetry.

2. **ESP32 Telemetry:** Physical hardware sensors are not yet connected to the operational telemetry pipeline.



---



## 21. Final Recommendation



The platform data path has been successfully corrected. Production ML risk decisions are driven strictly by the Phase 7 satellite rolling feature pipeline (`rolling_features_latest.parquet`) evaluated through the promoted Phase 4 XGBoost model, with zero synthetic CWC telemetry in active decision loops.



---



## FINAL STATUS CLASSIFICATION



**`REAL_LIVE_ML_OPERATIONAL_WITH_DEGRADED_SOURCES`**
