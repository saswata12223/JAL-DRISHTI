# Phase 8: Anomaly Model Architecture

## 1. Overview
The Phase 8 Machine Learning mandate explicitly prohibited the deployment of a supervised flood probability model due to critical imbalances in validated labels (60 Positives vs 110,030 Negatives). Instead, a rigorous **unsupervised hydrometeorological anomaly detector** was deployed.

## 2. Algorithm Choice
We implemented an IsolationForest (sklearn.ensemble.IsolationForest). This algorithm is highly effective at identifying statistically rare manifolds in high-dimensional feature spaces, making it perfect for detecting severe hydro-meteorological deviations without relying on historical event labels.

## 3. Training Data
The model was fit exclusively on the historical baseline:
- 110,030 NEGATIVE samples (confirmed no-flood events)
- 92,970 UNKNOWN samples (unverified background events)

**CRITICAL SAFEGUARD**: The 60 POSITIVE events were explicitly excluded from the it() phase to prevent target leakage and ensure the model only learned what "normal" and "background" weather looks like in Uttarakhand.

## 4. Feature Schema
The model uses 9 numeric features spanning dynamic meteorology and static terrain constraints:
1. ain_1h (mm)
2. ain_3h (mm)
3. ain_6h (mm)
4. ain_12h (mm)
5. ain_24h (mm)
6. surface_soil_moisture (volumetric)
7. elevation (meters)
8. slope (degrees)
9. 	wi (Topographic Wetness Index)

## 5. Thresholds & States
The decision_function of the Isolation Forest assigns scores where lower values denote higher anomaly. We established fixed thresholds based on the empirical training distribution:
- **EXTREME** (<= 1st percentile): Highly severe outlier
- **HIGH** (<= 5th percentile): Severe outlier
- **ELEVATED** (<= 10th percentile): Moderate outlier
- **WATCH** / **NORMAL**: Within 90% of expected conditions

## 6. Known Limitations
This is **NOT A CALIBRATED FLOOD PROBABILITY MODEL**. It detects weather/terrain anomalies. A severe anomaly does not guarantee a flood, and a flood can occur without a local severe anomaly (e.g. downstream impacts from remote dam releases).
