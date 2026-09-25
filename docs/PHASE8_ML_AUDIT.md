# PHASE 8 ML AUDIT REPORT

## 1. Actual Feature Dataset Path
- **Target Label Dataset**: data/processed/ml/target_dataset_v2.parquet
- **Rainfall Features (Live)**: Synthesized from historic observations in data/processed/clean/v1.0/Data_Research/rainfall_tel_hr_*.csv
- **Station Static Metadata**: data/processed/standardized/standardized_weather_stations.parquet
- **Static Geofeatures (NetCDF)**: data/processed/standardized/unified_static_features.nc
- **Dynamic Atmosphere (NetCDF)**: data/processed/standardized/standardized_dynamic_atmosphere.nc

## 2. Feature Columns
The actual feature columns used by the anomaly detector during training are:
1. ain_1h
2. ain_3h
3. ain_6h
4. ain_12h
5. ain_24h
6. surface_soil_moisture
7. elevation
8. slope
9. 	wi (Topographic Wetness Index)

## 3. Target/Label Columns
The target dataset provides a column 	arget which dictates historical flood event associations based on spatial/temporal intersections.

## 4. Positive Count
**Actual count**: 60
- The system possesses exactly 60 confirmed instances of "flood event". 

## 5. Negative Count
**Actual count**: 110,030
- The system possesses 110,030 confirmed instances where no flood was reported within the operational radius and horizon.

## 6. Unknown Count
**Actual count**: 92,970
- 92,970 records lack verifiable validation data and cannot be proven positive or negative.

## 7. Existing Trained Model Artifacts
- models/live_anomaly_v1.pkl (IsolationForest model)
- models/live_anomaly_thresholds.json (Derived quantile boundaries)

## 8. Existing Preprocessing Artifacts
The preprocessing logic is inherently handled via scripts.ml_pipeline.live_feature_pipeline.generate_canonical_features. It maps raw observations onto NetCDF boundaries and extracts exact matching static/dynamic bounds using xarray. Any remaining missing features are logically illna(0) adhering to the previously established Phase 7D baseline validation strategy. No complex standalone scikit-learn preprocessing Pipeline artifacts exist because standard spatial extraction requires Pandas/Xarray primitives.

## 9. Existing Scalers/Encoders
None. The Isolation Forest algorithm utilizes decision tree splits, which are scale-invariant. For this explicit anomaly modeling, numeric features remain in their raw units (e.g. mm for rainfall, meters for elevation).

## 10. Existing Station/Location Identifiers
Data tracks station_id alongside latitude and longitude.

## 11. Existing Timestamps
Tracked via prediction_timestamp normalized to local/naive UTC matching.

## 12. Existing Rainfall Windows
Rainfall aggregates include: 1h, 3h, 6h, 12h, and 24h.

## 13. Existing Soil-Moisture Features
surface_soil_moisture is extracted from the standardized_dynamic_atmosphere.nc tensor.

## 14. Existing Terrain Features
elevation, slope, and 	wi are accurately derived from unified_static_features.nc.

## 15. Existing Runoff/SCS-CN Features
Presently omitted from the core 9 features in the V1 live anomaly detector due to sparsity in the training subset intersection, prioritizing a robust 9-feature manifold.

## 16. Existing Spatial Grouping Columns
station_id maps cleanly to internal static spatial bounding boxes.

## 17. Existing Temporal Columns
All temporal components strictly revolve around prediction_timestamp.

## SCIENTIFIC LIMITATION OVERVIEW
As evidenced by the meager 60 positives vs 110,030 negatives, the class imbalance is roughly 1:1833. A supervised classifier trained on this sparse positive manifold will almost certainly fail to generalize to the geographic complexities of Uttarakhand. Consequently, the supervised flood probability engine remains firmly in **STANDBY**. The deployed engine is strictly an unsupervised **hydrometeorological anomaly detector**.
