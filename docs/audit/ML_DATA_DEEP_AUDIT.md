# 📊 Jal Drishti — ML Phase 1: Data & Model Deep Audit Report



**System:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)

**Target Region:** Uttarakhand, India

**Audit Purpose:** Comprehensive, evidence-based ML audit of datasets, labels, leakage, feature quality, model performance, and architectural justification without modifying code or retraining.



---



## STEP 1 — FILE LOCATIONS & VERIFICATION SUMMARY



| File / Script Path | Presence Status | Format / Type | Notes |

|---|---|---|---|

| `data/processed/ml/flood_ml_features.parquet` | **EXISTS** | Apache Parquet | Main feature matrix (8,199 × 62) |

| `data/processed/ml/flood_risk_predictions.parquet` | **EXISTS** | Apache Parquet | Saved prediction outputs (8,199 × 24) |

| `data/processed/ml/models/final_flood_risk_model.joblib` | **EXISTS** | Joblib (`XGBClassifier`) | Champion XGBoost v6.1.0 (44 predictors) |

| `data/processed/ml/models/feature_scaler.joblib` | **EXISTS** | Joblib (`StandardScaler`) | Standardized feature scaler |

| `data/processed/risk/flood_thresholds.parquet` | **EXISTS** | Apache Parquet | CWC river station thresholds (20 × 19) |

| `data/processed/standardized/unified_sensor_dataset.parquet` | **NOT ON DISK** | — | Dataset exists as `flood_ml_features.parquet` |

| `scripts/train_flood_model.py` | **EXISTS** | Python Script | Model training pipeline script |

| `scripts/multimodal_features.py` | **EXISTS** | Python Script | Feature engineering pipeline script |

| `ml/inference.py` | **EXISTS** | Python Script | Production inference wrapper (`FloodRiskInferenceEngine`) |

| `ml/ml/train_probabilistic_models.py` | **NOT ON DISK** | — | Referenced path absent; logic integrated in repository scripts |

| `ml/ml/inference.py` | **EXISTS** (`ml/inference.py`) | Python Script | Located at `ml/inference.py` |

| `ml/ml/models/openweather_*.joblib` | **NOT ON DISK** | — | Model artifacts stored under `data/processed/ml/models/` |



---



## STEP 2 — DATASET DEEP AUDIT (`flood_ml_features.parquet`)



1. **Total Rows:** `8,199`

2. **Total Columns:** `62`

3. **Complete Feature List:**

   `sample_id`, `sample_type`, `spatial_id`, `latitude`, `longitude`, `timestamp_utc`, `district`, `major_basin`, `rainfall_30min_mm`, `rainfall_1h_mm`, `rainfall_3h_mm`, `max_rainfall_intensity_mmh`, `mean_rainfall_intensity_mmh`, `rainfall_trend`, `rainfall_surge_ratio`, `effective_precipitation_mm`, `antecedent_precipitation_index_mm`, `surface_soil_moisture_vol`, `rootzone_soil_moisture_vol`, `profile_soil_moisture_vol`, `soil_saturation_index`, `nearest_weather_station_id`, `nearest_weather_station_dist_km`, `ambient_temperature_c`, `relative_humidity_pct`, `surface_pressure_hpa`, `wind_speed_ms`, `weather_data_missing`, `elevation_m`, `slope_deg`, `flow_accumulation_cells`, `drainage_network_indicator`, `topographic_wetness_index`, `stream_power_index`, `sediment_transport_index`, `topographic_runoff_potential`, `flash_flood_susceptibility_index`, `landcover_class`, `landcover_name`, `runoff_coefficient`, `mannings_roughness_n`, `nearest_cwc_station_id`, `nearest_cwc_station_name`, `nearest_cwc_station_dist_km`, `warning_level_m`, `danger_level_m`, `hfl_m`, `gauge_datum_msl_m`, `water_level_m`, `water_level_missing`, `warning_exceedance_m`, `danger_exceedance_m`, `hfl_exceedance_m`, `official_flood_status`, `official_alert_stage`, `historical_event_id`, `flood_event_label`, `flood_event_type`, `severity_category`, `label_confidence`, `split_group`, `split_rationale`.



4. **Data Type of Every Feature:**

   - Strings (`object`): `sample_id`, `sample_type`, `spatial_id`, `timestamp_utc`, `district`, `major_basin`, `nearest_weather_station_id`, `landcover_name`, `nearest_cwc_station_id`, `nearest_cwc_station_name`, `official_flood_status`, `official_alert_stage`, `historical_event_id`, `flood_event_type`, `severity_category`, `label_confidence`, `split_group`, `split_rationale`.

   - Floats (`float64`): `latitude`, `longitude`, `rainfall_30min_mm`, `rainfall_1h_mm`, `rainfall_3h_mm`, `max_rainfall_intensity_mmh`, `mean_rainfall_intensity_mmh`, `rainfall_trend`, `rainfall_surge_ratio`, `effective_precipitation_mm`, `antecedent_precipitation_index_mm`, `surface_soil_moisture_vol`, `rootzone_soil_moisture_vol`, `profile_soil_moisture_vol`, `soil_saturation_index`, `nearest_weather_station_dist_km`, `ambient_temperature_c`, `relative_humidity_pct`, `surface_pressure_hpa`, `wind_speed_ms`, `elevation_m`, `slope_deg`, `flow_accumulation_cells`, `topographic_wetness_index`, `stream_power_index`, `sediment_transport_index`, `topographic_runoff_potential`, `flash_flood_susceptibility_index`, `runoff_coefficient`, `mannings_roughness_n`, `nearest_cwc_station_dist_km`, `warning_level_m`, `danger_level_m`, `hfl_m`, `gauge_datum_msl_m`, `water_level_m`, `warning_exceedance_m`, `danger_exceedance_m`, `hfl_exceedance_m`.

   - Integers (`int64`): `weather_data_missing`, `drainage_network_indicator`, `landcover_class`, `water_level_missing`, `flood_event_label`.



5. **Missing Count and Percentage:**

   - `water_level_m`, `warning_exceedance_m`, `danger_exceedance_m`, `hfl_exceedance_m`: **8,197 missing (99.98%)**

   - `historical_event_id`: **8,184 missing (99.82%)**

   - `surface_pressure_hpa`: **5,487 missing (66.92%)**

   - `rainfall_3h_mm`, `effective_precipitation_mm`: **5,133 missing (62.61%)**

   - `rainfall_1h_mm`, `rainfall_trend`: **1,045 missing (12.75%)**

   - `ambient_temperature_c`: **487 missing (5.94%)**

   - `relative_humidity_pct`: **463 missing (5.65%)**

   - `rainfall_30min_mm`, `max_rainfall_intensity_mmh`, `mean_rainfall_intensity_mmh`, `rainfall_surge_ratio`, `antecedent_precipitation_index_mm`, `surface_soil_moisture_vol`, `rootzone_soil_moisture_vol`, `profile_soil_moisture_vol`, `soil_saturation_index`: **23 missing (0.28%)**

   - `wind_speed_ms`: **15 missing (0.18%)**

   - Terrain, static hydrology, and spatial coordinates: **0 missing (0.00%)**



6. **Unique Values for Categorical Columns:**

   - `sample_type`: 2 (`operational_monitoring_grid`: 8184, `historical_event_benchmark`: 15)

   - `district`: 13 primary districts (Chamoli: 1754, Udham Singh Nagar: 1016, Pithoragarh: 985, Uttarkashi: 962, Champawat: 808, Haridwar: 640, Pauri Garhwal: 497, Bageshwar: 400, Nainital: 272, Rudraprayag: 267, Dehradun: 240, Tehri Garhwal: 184, Almora: 160)

   - `official_flood_status`: 3 (`DATA_UNAVAILABLE`: 8197, `SEVERE`: 1, `EXTREME`: 1)

   - `split_group`: 4 (`TRAIN`: 5115, `VALIDATION`: 2046, `TEST`: 1023, `BENCHMARK_EVALUATION`: 15)



7. **Target Distribution (`flood_event_label`):**

   - `0` (Quiescent Monsoon Baseline): **8,184 samples (99.82%)**

   - `1` (Historical Flood Event): **15 samples (0.18%)**

   - Imbalance Ratio: **~545:1**



8. **Number of Unique Timestamps:** `23`

9. **Earliest Timestamp:** `1970-07-20T00:00:00Z` (Historical disaster fallback)

10. **Latest Timestamp:** `2026-08-30T03:30:00+00:00` (Operational grid)

11. **Number of Unique Spatial IDs:** `1,038`

12. **Number of Districts:** `13`

13. **Number of Historical Flood Events:** `15` canonical events (1970–2024)

14. **Samples per Flood Event:** 1 sample per historical disaster record

15. **Samples per Spatial Location:** Exactly 8 timesteps per grid location (8,184 grid rows / 1,023 grid points)

16. **Samples per Timestamp:** 1,023 samples per operational half-hour timestep (t=0 to t=7)

17. **Duplicate Rows:** `0`

18. **Duplicate `(timestamp, spatial_id)`:** `0`

19. **Constant Features:** None

20. **Near-Constant Features (>99% identical values):** `water_level_m` (99.98%), `water_level_missing` (99.98%), `warning_exceedance_m` (99.98%), `danger_exceedance_m` (99.98%), `hfl_exceedance_m` (99.98%), `official_flood_status` (99.98%), `historical_event_id` (99.82%), `flood_event_label` (99.82%), `label_confidence` (100.0%).

21. **Highly Correlated Features (>0.90 correlation):**

    - `surface_soil_moisture_vol` $\leftrightarrow$ `rootzone_soil_moisture_vol` (r = 0.981)

    - `surface_soil_moisture_vol` $\leftrightarrow$ `soil_saturation_index` (r = 0.997)

    - `rainfall_3h_mm` $\leftrightarrow$ `effective_precipitation_mm` (r = 0.999)

    - `flow_accumulation_cells` $\leftrightarrow$ `stream_power_index` (r = 0.928)

    - `warning_level_m` $\leftrightarrow$ `danger_level_m` $\leftrightarrow$ `hfl_m` (r = 1.000)



22. **Features with Suspiciously Dominant Importance:**

    - `surface_soil_moisture_vol` contributes **94.21%** of total XGBoost feature importance.

23. **Features Encoding Target Indirectly / Imputation Artifacts:**

    - The 15 positive historical disaster rows had **NaN** for `surface_soil_moisture_vol` (SMAP missing for 1970–2024 historical points).

    - `train_flood_model.py` executed `fillna(0.0)`.

    - This turned all 15 positive samples into `surface_soil_moisture_vol = 0.0`, while all 8,184 negative grid samples have non-zero soil moisture (mean = 0.77).

    - **CRITICAL AUDIT FINDING:** The tree model split on `surface_soil_moisture_vol < 0.20 -> FLOOD`! This creates a completely artificial, unphysical decision rule where zero soil moisture equals flood.

24. **Features Derived from Future Observations:** None identified in single timesteps, but historical events are mixed into splits.

25. **Features Static vs Dynamic:**

    - **Static (28 features):** `elevation_m`, `slope_deg`, `flow_accumulation_cells`, `twi`, `spi`, `sti`, `trp`, `ffsi`, `landcover_class`, `runoff_coefficient`, `mannings_roughness_n`, station coordinates, datum levels.

    - **Dynamic (16 features):** `rainfall_30min_mm`, `rainfall_1h_mm`, `rainfall_3h_mm`, `rainfall_trend`, `effective_precipitation_mm`, `antecedent_precipitation_index_mm`, soil moisture variables.



---



## STEP 3 — TARGET / LABEL AUDIT



- **Label Generation Logic:** Inspected `data/processed/ml/label_definition.json` and `scripts/train_flood_model.py`.

- **What Constitutes a Positive Flood Event?** A confirmed historical high-impact disaster event verified by government records (NDMA/USDMA/CWC) in the historical catalog (15 records: 2013 Kedarnath, 2021 Chamoli, etc.).

- **Is the Label Based on Rainfall, River Level, or CWC Thresholds?** No. It is based on historical disaster occurrences.

- **Is it Manually Assigned?** Yes, derived from verified historical disaster inventories.

- **Is it Generated from Input Features?** No.

- **Does it Use Future Information?** No, but historical events span 1970–2024 while operational grid data spans a single 3.5-hour window in August 2026.

- **Forecast Horizon Represented:** Current timestep instantaneous hazard state (nowcasting / 0-hour lead time).



---



## STEP 4 — TEMPORAL LEAKAGE AUDIT



- **Split Logic Traced (`scripts/train_flood_model.py` lines 318–328):**

  - Operational grid points are chronologically split: `TRAIN` (t=0..4, 5,115 rows), `VALIDATION` (t=5..6, 2,046 rows), `TEST` (t=7, 1,023 rows).

  - However, the 15 positive `BENCHMARK_EVALUATION` rows are manually distributed: 10 added to TRAIN, 3 to VALIDATION, 2 to TEST.

- **Scaler / Imputation Fitting:** `StandardScaler` is fitted on `train_df`, which includes the 10 imputed positive historical events (`surface_soil_moisture_vol = 0.0`).

- **Leakage Severity Rating:** **CRITICAL**

  - **Evidence 1:** Imputing missing soil moisture as `0.0` for historical positive events creates an artificial binary separator (`surface_soil_moisture_vol == 0`).

  - **Evidence 2:** Reported validation/test F1 = 1.0 is an artifact of classifying `surface_soil_moisture_vol == 0` on 3 validation positive samples and 2 test positive samples.



---



## STEP 5 — SPATIAL LEAKAGE AUDIT



- **Spatial Distribution:** All 1,038 spatial grid locations are evaluated across all 8 operational timesteps simultaneously.

- **Spatial Leakage Finding:** `TRAIN` contains t=0..4 for node X, `VALIDATION` contains t=5..6 for node X, `TEST` contains t=7 for node X. Furthermore, neighboring nodes (~0.1° apart) exist across splits. Tree models can effectively memorize spatial IDs, elevation, and location coordinates.

- **Recommended Validation Strategy:** **Spatial-Block Group K-Fold Cross-Validation** grouped by Major River Basin / District, combined with Out-of-Time Historical Event Evaluation.



---



## STEP 6 — FEATURE QUALITY AUDIT



### Feature Grouping (A–I)



| Group | Features | Missingness | Assessment |

|---|---|---|---|

| **A. Rainfall** | `rainfall_30min`, `1h`, `3h`, `max_int`, `mean_int`, `trend`, `surge_ratio`, `eff_precip`, `API` | 0.28% – 62.6% | High physical value; needs upstream accumulation |

| **B. Weather** | `temp`, `humidity`, `pressure`, `wind_speed` | 0.18% – 66.9% | Secondary meteorological drivers |

| **C. Soil Moisture** | `surface_sm`, `rootzone_sm`, `profile_sm`, `SSI` | 0.28% | **CRITICAL ARTIFACT:** 94.2% importance due to `fillna(0.0)` on historical positives |

| **D. River Level** | `water_level_m`, `water_level_missing` | **99.98%** | Highly sparse; unusable for non-station grid points |

| **E. Terrain** | `elevation`, `slope`, `flow_accum`, `TWI`, `SPI`, `STI`, `TRP`, `FFSI` | 0.0% | Excellent static morphometric grounding |

| **F. Land Cover** | `landcover_class`, `runoff_coeff`, `mannings_n` | 0.0% | Essential for SCS-CN Curve Number calculations |

| **G. Physics** | `SCS_S`, `SCS_Ia`, `SCS_Q`, `peak_runoff_pot` | Derived | Solid physical runoff formulation |

| **H. Thresholds** | `warning_level`, `danger_level`, `HFL`, `exceedance` | 0.0% / 99.98% | Useful anchor for station nodes |

| **I. Metadata** | `spatial_id`, `district`, `basin`, `timestamp` | 0.0% | Administrative & spatial keys |



---



## STEP 7 — CURRENT XGBOOST AUDIT (`final_flood_risk_model.joblib`)



- **Estimator Type:** `xgboost.sklearn.XGBClassifier`

- **Trees:** `100`, **Max Depth:** `5`, **Learning Rate:** `0.08`

- **Scale Pos Weight:** `511.5` (dynamically computed ratio)

- **Objective:** `binary:logistic`, **Eval Metric:** `logloss`

- **Feature Count:** `44`

- **Reproducibility:** Confirmed matching `scripts/train_flood_model.py`.



---



## STEP 8 — FRIEND MODEL AUDIT & COMPARISON



- `ml/inference.py` provides `FloodRiskInferenceEngine` wrapper computing SCS-CN runoff ($Q$) dynamically.

- Specified paths (`ml/ml/train_probabilistic_models.py`, `openweather_*.joblib`) are absent on disk.



### Comparison Table



| Feature / Method | Friend Model (`ml/inference.py`) | Jal Drishti Champion (`XGBoost v6.1.0`) | Strength | Weakness | Action |

|---|---|---|---|---|---|

| **Runtime Physics** | Dynamic SCS-CN ($Q, S, I_a$) | Pre-computed + dynamic fallback | Fast payload parsing | Requires complete terrain input | **KEEP** |

| **Model Binary** | Wraps `final_flood_risk_model` | `XGBClassifier` (44 features) | High tabular speed | Trained on `fillna(0.0)` artifact | **MODIFY** |

| **Scaling** | `StandardScaler` integration | `feature_scaler.joblib` | Handles normalization | Scaled on artifact dataset | **MODIFY** |



---



## STEP 9 — RANKED REAL DATA GAPS



1. 🔴 **CRITICAL:** Missing value imputation artifact (`fillna(0.0)`) creates fake target separation on `surface_soil_moisture_vol`.

2. 🔴 **CRITICAL:** Severe class scarcity (only 15 positive flood events out of 8,199 samples).

3. 🟠 **HIGH:** Operational grid time series spans only 8 half-hourly timesteps (3.5 hours total).

4. 🟠 **HIGH:** Local point rainfall is used without upstream catchment-accumulated precipitation.

5. 🟠 **HIGH:** Extreme missingness (99.98%) in water-level observations for non-station grid points.

6. 🟡 **MEDIUM:** Spatial leakage caused by splitting all spatial nodes chronologically simultaneously.



---



## STEP 10 — DESIGN OF IMPROVED DATASET



- **Temporal Features:** `rainfall_30min`, `1h`, `3h`, `6h`, `12h`, `24h`, `48h`, `72h`, rainfall acceleration, API, rainfall anomaly.

- **Hydrological Features:** Soil saturation index (properly interpolated), SCS-CN runoff depth $Q$, runoff potential, stream stage rate-of-rise (station nodes), distance to CWC thresholds.

- **Spatial Features:** Elevation, slope, aspect, planform/profile curvature, flow accumulation, TWI, SPI, STI, distance to stream, **upstream catchment-aggregated rainfall**.

- **Environmental Features:** Land cover class, runoff coefficient, Manning's roughness, temperature degree-day snowmelt index.



---



## STEP 11 — MODEL JUSTIFICATION MATRIX



| Architecture | Justified? | Rationale |

|---|---|---|

| **XGBoost** | **YES** | Primary champion choice for tabular hydrometeorological features. |

| **LightGBM** | **YES** | Excellent speed and leaf-wise split optimization for tabular data. |

| **Random Forest** | **YES** | Robust ensemble baseline for comparison. |

| **LSTM / GRU** | ❌ **NO** | Sequence length of 8 half-hourly timesteps is insufficient for deep recurrent memory. |

| **GNN** | ❌ **NO** | Undirected k-NN graph failed ($F_1 = 0.0$); requires directed river network DAG. |

| **Transformer** | ❌ **NO** | Overparameterized and unwarranted for small tabular datasets. |



---



## STEP 12 — FINAL AUDIT RECOMMENDATION



1. **CURRENT SYSTEM VERDICT:** Unfit for production in current state due to soil moisture imputation artifact (`fillna(0.0)`) masking true generalization.

2. **BIGGEST PROBLEMS:** Soil moisture imputation artifact, positive sample scarcity (15 events), 3.5h time window, spatial leakage.

3. **DATA WE SHOULD KEEP:** High-resolution SRTM DEM terrain features, land cover, CWC threshold catalog, SCS-CN physics formulas.

4. **DATA WE NEED TO ADD:** Multi-year historical meteorological sequences, expanded disaster inventory, HydroSHEDS flow routing networks.

5. **FEATURES WE SHOULD ADD:** Upstream catchment-accumulated rainfall, aspect, slope curvature, degree-day snowmelt index.

6. **VALIDATION STRATEGY:** Spatial-Block Group K-Fold Cross-Validation (by River Basin) + Out-of-Time Historical Event Evaluation.

7. **MODEL STRATEGY:** XGBoost / LightGBM Gradient Boosted Decision Trees + Physics Layer.

8. **WHETHER LSTM IS JUSTIFIED:** No.

9. **WHETHER GNN IS JUSTIFIED:** No.

10. **WHETHER FRIEND MODEL SHOULD BE INTEGRATED:** Preserve `ml/inference.py` serving architecture.

11. **RECOMMENDED CHAMPION ARCHITECTURE:** Leakage-Safe XGBoost + SCS-CN Physics Layer + Calibrated Threshold Engine.

12. **EXACT NEXT IMPLEMENTATION STEP:** Fix SMAP soil moisture historical imputation, remove `fillna(0.0)` artifact, and rebuild feature matrix using true physical background values.
