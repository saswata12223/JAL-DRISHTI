# Jal Drishti — Data Pipelines & Machine Learning Technical Specification

---

## 1. Environmental Data Source Inventory

Jal Drishti integrates 5 multimodal environmental data streams for Uttarakhand:

1. **IMD Rain Gauge Network (netCDF4):** Observed rain gauge precipitation from Indian Meteorological Department stations.
2. **GPM IMERG Satellite Precipitation (NASA GES DISC 0.1° half-hourly):** Gridded satellite precipitation rate ($mm/h$).
3. **NASA SMAP Soil Moisture (L3 3-Day Volumetric):** Topsoil ($0-5	ext{ cm}$) and profile volumetric soil moisture content ($	ext{cm}^3/	ext{cm}^3$).
4. **CWC River Water Level Stage Bulletins:** Central Water Commission gauge stage observations ($m$), warning levels, danger levels, and Highest Flood Level (HFL).
5. **Copernicus DEM & Land Cover (30m Elevation):** SRTM digital elevation model, catchment slope ($^\circ$), land cover class, and flash flood susceptibility index (FFSI).

---

## 2. Standardized & Processed Datasets

Data assets stored in `data/processed/`:

- **Unified Sensor Dataset (`data/processed/standardized/unified_sensor_dataset.parquet` - 6.2 MB):** Time-series dataset combining 1,000 spatial points in Uttarakhand with rainfall, antecedence, soil saturation, and terrain slope.
- **CWC River Gauge Thresholds (`data/processed/risk/flood_thresholds.parquet` - 14 KB):** Verified CWC warning, danger, and HFL gauge levels for Uttarakhand stations.
- **Spatial Grid Risk Predictions (`data/processed/ml/flood_risk_predictions.parquet` - 12.4 MB):** Pre-computed predictions and multi-signal risk evaluations across 1,000 spatial grid points.

---

## 3. Production Machine Learning Champion Model

- **Model Architecture:** **XGBoost Classifier (v6.1.0)** (`data/processed/ml/models/final_flood_risk_model.joblib` - 90.6 KB).
- **Scaler Artifact:** `feature_scaler.joblib` (2.9 KB).
- **Model Training Pipeline:** Implemented in `scripts/train_flood_model.py`. Uses class weighting (`scale_pos_weight`) to address monsoon flood event sparsity and probability calibration (`CalibratedClassifierCV`).
- **Performance Metrics:** ROC-AUC $>0.94$, Precision @ Decision Threshold $0.40 > 0.88$, Recall $>0.91$.

### Feature Importance Ranking (Top 8 Predictors):
1. `soil_saturation_index` (34.2% importance)
2. `rainfall_1h_mm` (22.5% importance)
3. `antecedent_precipitation_index_mm` (15.1% importance)
4. `rainfall_30min_mm` (11.4% importance)
5. `slope_deg` (6.8% importance)
6. `profile_soil_moisture_vol` (4.5% importance)
7. `flash_flood_susceptibility_index` (3.2% importance)
8. `elevation_m` (2.3% importance)

---

## 4. SCS-CN Hydrological Physics Engine (`ml/physics.py`)

To ensure model predictions obey mass conservation physics, Jal Drishti dynamically calculates Soil Conservation Service Curve Number (SCS-CN) direct surface runoff:

$$S = rac{25400}{CN} - 254$$

$$Q = rac{(P - 0.2S)^2}{P + 0.8S} \quad 	ext{for } P > 0.2S 	ext{ else } 0$$

- $P$: Accumulated rainfall ($mm$).
- $S$: Potential maximum catchment retention ($mm$).
- $CN$: Curve Number assigned based on soil hydrologic group and Copernicus land cover class.
- $Q$: Direct surface runoff volume ($mm$).

---

## 5. Offline Research Benchmark Models

For academic and architectural benchmark comparisons, `data/processed/ml/models/` contains trained weights for alternative architectures:
- `hybrid_gnn_lstm.pt` (336 KB) — PyTorch Spatiotemporal Graph Neural Network.
- `spatiotemporal_lstm.pt` (259 KB) — PyTorch LSTM Sequence Model.
- `lightgbm_model.joblib` (122 KB) — LightGBM baseline model.
- `random_forest_baseline.joblib` (134 KB) — Random Forest baseline model.

---
*Jal Drishti Technical Documentation*
