# 🔬 Jal Drishti — Phase 8.1: Production ML Integrity Audit Report



**System:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)

**Phase:** Phase 8.1 — Production ML Integrity Audit & Model Provenance Trace

**Audit Target:** Live FastAPI REST Endpoints, Model Serving Engine, In-Memory Telemetry Signatures, Parquet Datasets

**Audit Date:** September 13, 2026

**Safety Status Classification:** **D. LIVE_MODEL_USING_SYNTHETIC_DATA**



---



## EXECUTIVE SUMMARY



A full read-only code, artifact, and data provenance audit was executed on the live Jal Drishti platform. **Zero source code, model weights, feature matrices, or risk policy thresholds were modified during this audit.**



### Primary Audit Findings:

1. **Promoted Production Model:** The live API (`/api/v1/risk/latest`) currently loads and serves predictions using the **Phase 4 Candidate XGBoost Model** (`candidate_flood_risk_model_phase4.joblib`) via `ml/inference.py` (`FloodRiskInferenceEngine`).

2. **Artifact SHA256 Verification:**

   - Active Production Model: `candidate_flood_risk_model_phase4.joblib` (SHA256: `1908a36bed800206108a605f2d022685a255b101969cf10bb75a1ef1550eda03`)

   - Legacy Champion Model: `final_flood_risk_model.joblib` (SHA256: `f09944494c1002592f543a07f36a211c16f4d250f77ea02913d07afdbfbbd28e`)

3. **Data Path & Provenance:** The live API loads `data/processed/ml/flood_risk_predictions.parquet` (8,199 historical baseline rows), which were scored using the Phase 4 34-predictor contract.

4. **CWC Telemetry Audit (`461.5 m` Devprayag):** The river level of `461.5 m` for Devprayag originates from an in-memory dictionary `STATION_LIVE_TELEMETRY_SIGNATURES` in `backend/app/services/risk_decision_engine.py`, which contains **synthetic/test telemetry signatures**, not real-time external CWC REST API streams.

5. **Alert Registry Provenance:** The 7 active alerts in `/api/v1/risk/alerts` are derived from fusing the Phase 4 XGBoost predictions with the synthetic CWC station telemetry signatures (`STATION_LIVE_TELEMETRY_SIGNATURES`).



---



## 1. IDENTIFY THE ACTUAL MODEL IN PRODUCTION



| Property | Audit Finding |

| :--- | :--- |

| **Backend Route** | `GET /api/v1/risk/latest` (`backend/app/api/routes/risk.py`) |

| **Service Layer** | `RiskDecisionEngine.get_instance()` (`backend/app/services/risk_decision_engine.py`) |

| **ML Serving Layer** | `PredictionService` (`backend/app/services/prediction_service.py`) |

| **Inference Engine** | `FloodRiskInferenceEngine` (`ml/inference.py`) |

| **Loaded Model File** | `data/processed/ml/models/candidate_flood_risk_model_phase4.joblib` |

| **Loaded Preprocessor File** | `data/processed/ml/models/candidate_feature_preprocessor_phase4.joblib` |

| **Loaded Allowlist File** | `data/processed/ml/models/candidate_feature_allowlist_phase4.json` |

| **Model Type** | `xgboost.sklearn.XGBClassifier` (50 trees, max depth = 4, `scale_pos_weight` $\approx 500.0$) |

| **Model Version** | `6.1.0` (Phase 4 Candidate Promoted Engine) |

| **Artifact SHA256 Hash** | `1908a36bed800206108a605f2d022685a255b101969cf10bb75a1ef1550eda03` |

| **Model Status** | **b) Phase 4 candidate model (PROMOTED TO PRODUCTION)** |



---



## 2. CANDIDATE VS. CHAMPION ARTIFACT COMPARISON



| Artifact | File Location | SHA256 Checksum | Active in API? |

| :--- | :--- | :--- | :--- |

| **Phase 4 Candidate Model** | `data/processed/ml/models/candidate_flood_risk_model_phase4.joblib` | `1908a36bed800206108a605f2d022685a255b101969cf10bb75a1ef1550eda03` | **YES (ACTIVE)** |

| **Legacy Champion Model** | `data/processed/ml/models/final_flood_risk_model.joblib` | `f09944494c1002592f543a07f36a211c16f4d250f77ea02913d07afdbfbbd28e` | NO (INACTIVE) |

| **Phase 4 Preprocessor** | `data/processed/ml/models/candidate_feature_preprocessor_phase4.joblib` | `c0c8dbecce26b1c2bceb8ff52ebfa136d814ecb3be059db3b4fe606fbf4a01c3` | **YES (ACTIVE)** |



---



## 3. PROVENANCE OF LIVE PREDICTIONS & PROBABILITY VALUES



The continuous probabilities and displayed risk numbers are derived through a multi-stage pipeline:



```

[Parquet / Telemetry Signatures]

      │

      ▼

[34-Predictor Feature Matrix] ──> [StandardScaler + SimpleImputer] ──> [XGBoost Model]

                                                                              │

                                                                              ▼

[UI / Dissemination Layer] <── [Calibrated Probability] <── [fuse_signals Policy]

```



### Exact Origin of Displayed Percentage Values:



1. **4% (0.04):**

   - *Provenance:* Raw XGBoost model prediction on unforced/dry baseline negative samples in `flood_risk_predictions.parquet` produces `0.0405` (4.05%).

   - *Policy Mapping:* `fuse_signals()` classifies `prob < 0.20` as `LOW` risk. `STATION_LIVE_TELEMETRY_SIGNATURES` for Haridwar (`CWC_UK_003`) and Banbasa (`CWC_UK_018`) also explicitly define `ml_prob: 0.04`.



2. **35% (0.35):**

   - *Provenance:* Defined under `STATION_LIVE_TELEMETRY_SIGNATURES["CWC_UK_001"]` (Devprayag) as `"ml_prob": 0.35`.

   - *Policy Mapping:* `get_latest_decisions()` calibrates probabilities for `MODERATE` risk decisions to `0.35` (35%) to ensure visual alignment between risk badge (`MODERATE`) and probability number.



3. **94% (0.94):**

   - *Provenance:* Defined under `STATION_LIVE_TELEMETRY_SIGNATURES["CWC_UK_014"]` (Dharchula) as `"ml_prob": 0.94`.

   - *Policy Mapping:* `get_latest_decisions()` calibrates `EXTREME` risk decisions breaching CWC Danger Level to $\ge 0.92$ (92%–94%).



---



## 4. DATASET PROVENANCE (8,199-ROW ISSUE)



- **Active File Loaded by API:** `data/processed/ml/flood_risk_predictions.parquet` (8,199 rows $\times$ 72 columns).

- **Rolling File Status:** `data/processed/ml/rolling/rolling_features_latest.parquet` exists on disk (generated during Phase 7 dry-run testing), but is **NOT** currently read by `RiskDecisionEngine.get_latest_decisions()`.

- **API Data Access Strategy:** `RiskDecisionEngine` reads `flood_risk_predictions.parquet` and merges in-memory telemetry signatures (`STATION_LIVE_TELEMETRY_SIGNATURES`) for the 20 official CWC stations.



---



## 5. CRITICAL CWC TELEMETRY & DEVPRAYAG (461.5 m) AUDIT



- **Reported UI Value:** `Water Level: 461.5 m` (Devprayag)

- **Provenance Trace:**

  - `461.50 m` originates from `scripts/waterlevel_ingest.py` as a fallback static value for Devprayag (Warning Level: `461.0 m`, Danger Level: `463.0 m`).

  - In `backend/app/services/risk_decision_engine.py`, `STATION_LIVE_TELEMETRY_SIGNATURES["CWC_UK_001"]` hardcodes `"water_level_m": 461.50`.

- **Classification:** **SYNTHETIC / TEST DATA (Hardcoded in-memory dictionary)**.

- **Audit Findings on `STATION_LIVE_TELEMETRY_SIGNATURES`:**

  - Defined directly in `backend/app/services/risk_decision_engine.py` (lines 446–654).

  - Contains synthetic telemetry values (water level, 1h rain, soil saturation, SCS runoff) for all 20 CWC stations.

  - Does **NOT** contain live network observations from external CWC APIs.

  - Currently active in production risk decisions.



---



## 6. ACTIVE ALERT REGISTRY AUDIT (7 ACTIVE ALERTS)



The `/api/v1/risk/alerts` endpoint returns **7 active operational alerts**:



| Alert ID | Station Name | District | Risk Level | Probability | Priority | CWC Status | Telemetry Source |

| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| `ALT_STN_CWC_UK_004` | Joshimath (Marwari) | Chamoli | `EXTREME` | 92.0% | `CRITICAL` | `DANGER_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_007` | Rudraprayag | Rudraprayag | `EXTREME` | 88.0% | `CRITICAL` | `DANGER_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_014` | Dharchula | Pithoragarh | `EXTREME` | 94.0% | `CRITICAL` | `DANGER_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_009` | Uttarkashi | Uttarkashi | `HIGH` | 68.0% | `WARNING` | `WARNING_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_008` | Srinagar | Pauri Garhwal | `HIGH` | 65.0% | `WARNING` | `WARNING_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_011` | Kund (Guptkashi) | Rudraprayag | `HIGH` | 66.0% | `WARNING` | `WARNING_ZONE` | Synthetic Signature |

| `ALT_STN_CWC_UK_019` | Bageshwar | Bageshwar | `HIGH` | 62.0% | `WARNING` | `WARNING_ZONE` | Synthetic Signature |



- **Dependency:** All 7 active alerts currently depend on the synthetic telemetry signatures in `STATION_LIVE_TELEMETRY_SIGNATURES`.



---



## 7. 34-FEATURE INPUT CONTRACT VERIFICATION



- **Feature Count:** Exactly **34 predictors** passed to model.

- **Allowed Predictors List (`candidate_feature_allowlist_phase4.json`):**

  `rainfall_30min_mm`, `rainfall_1h_mm`, `rainfall_3h_mm`, `max_rainfall_intensity_mmh`, `mean_rainfall_intensity_mmh`, `rainfall_trend`, `rainfall_surge_ratio`, `effective_precipitation_mm`, `antecedent_precipitation_index_mm`, `ambient_temperature_c`, `relative_humidity_pct`, `surface_pressure_hpa`, `wind_speed_ms`, `surface_soil_moisture_vol`, `rootzone_soil_moisture_vol`, `profile_soil_moisture_vol`, `soil_saturation_index`, `elevation_m`, `slope_deg`, `flow_accumulation_cells`, `drainage_network_indicator`, `topographic_wetness_index`, `stream_power_index`, `sediment_transport_index`, `topographic_runoff_potential`, `flash_flood_susceptibility_index`, `landcover_class`, `runoff_coefficient`, `mannings_roughness_n`, `scs_potential_retention_s_mm`, `scs_initial_abstraction_ia_mm`, `scs_direct_runoff_q_mm`, `scs_peak_runoff_potential`, `nearest_cwc_station_dist_km`.

- **Prohibited Metadata & Proxies Verification:** Verified **0** metadata fields (`sample_id`, `spatial_id`, `flood_event_label`, etc.) and **0** missingness flags (`soil_moisture_missing`) enter the preprocessor or XGBoost model.



---



## 8. TIMESTAMP & FUTURE-DATA AUDIT



- All predictions in `flood_risk_predictions.parquet` use historical timestamps ($\le \text{current time}$).

- No observation timestamp breaches causality ($\text{observation\_timestamp} \le \text{prediction\_timestamp}$).



---



## 9. ESP32 HARDWARE TELEMETRY AUDIT



- **API Endpoint:** `/hardware/telemetry` and `/hardware/status` (`backend/app/api/routes/hardware.py`).

- **Dependencies:** State-wide ML risk decisions do **NOT** depend on ESP32 telemetry. ESP32 readings remain isolated to local IoT node monitoring.



---



## 10. PRODUCTION SAFETY STATUS CLASSIFICATION



```

PRODUCTION SAFETY CLASSIFICATION:

D. LIVE_MODEL_USING_SYNTHETIC_DATA



Explanation:

The live backend API is loading the promoted Phase 4 XGBoost candidate model (candidate_flood_risk_model_phase4.joblib) and evaluating risk decisions using static Parquet feature baselines combined with hardcoded in-memory synthetic station telemetry signatures (STATION_LIVE_TELEMETRY_SIGNATURES). Real-time external CWC REST APIs and live NASA satellite streams are not currently populating the active API layer.

```



---



## 🏁 11. CRITICAL AUDIT RECOMMENDATIONS



1. **Maintain Audit Freeze:** Do not alter model weights, feature schemas, or risk policy rules.

2. **Explicit Telemetry Labeling:** Disclose in system diagnostics that CWC station values are generated from canonical baseline signatures (`SYNTHETIC_TEST_SIGNATURE`).

3. **Shadow Pipeline Mode:** If live satellite/CWC integration is desired in future phases, route real-time ingested data into a isolated shadow pipeline before overriding static baseline datasets.
