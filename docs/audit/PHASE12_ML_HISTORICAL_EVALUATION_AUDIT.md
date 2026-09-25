# PHASE 12 ML HISTORICAL EVALUATION AUDIT

## 1. Actual production model class
The production model artifact is inal_flood_risk_model.joblib. The underlying class is an uncalibrated xgboost.sklearn.XGBClassifier.

## 2. Actual production feature contract
The model strictly requires 34 features, derived from inference.py and the candidate allowlist. This includes base variables (
ainfall_1h_mm, mbient_temperature_c, landcover_class, soil_saturation_index) and variables physically derived from them (scs_direct_runoff_q_mm).

## 3. Historical feature provenance
GPM IMERG (0.1 deg, 30-min) provides precipitation features. However, critical context predictors (ambient temperature, soil saturation, landcover, etc.) have no resolved historical provenance for these events and are VERIFIED_MISSING.

## 4. EVENT-SPECIFIC FEATURE AVAILABILITY
For all 15 DOCUMENTED HISTORICAL EVENTS, the feature vector is incomplete. Even the 14 events with GPM FEATURE-EVIDENCE CORRESPONDENCES lack the required covariates. 

## 5. TEMPORAL LEAKAGE
Temporal leakage could not be ruled out. Most historical events only possess date-level precision, producing a status of UNRESOLVED because a defensible prediction-time cutoff cannot be established.

## 6. SPATIAL CORRESPONDENCE and SPATIAL LEAKAGE
SPATIAL CORRESPONDENCE is verified for 14 events. However, SPATIAL LEAKAGE is NOT_ASSESSED because correspondence alone does not prove the absence of spatial leakage.

## 7. TARGET LEAKAGE
NOT_DETECTED. Benchmark fields like predicted_probability_xgboost and model outputs are strictly prohibited from entering the feature vector.

## 8. NEGATIVE-LABEL STATUS
**NOT_ESTABLISHED**. No legitimate negative class (verified non-flood events) exists in the historical catalog.

## 9. EVALUATION ELIGIBILITY
0 events are evaluable. Feature reconstruction is blocked for all events due to missing telemetry.

## 10. Metrics, only if legitimate
**NONE**. No metric is calculated because an appropriate labelled population (with reconstructed features and negative labels) does not exist.

## 11. Model artifact hashes
All Phase 10 baseline .joblib artifacts were hashed before and after. 0 model artifacts changed.

## 12. Raw-data immutability
No Phase 12 file modifies data/raw. Raw data remains unchanged.

## 13. Limitations
We cannot evaluate the exact model and feature architecture on historical records that possess only a single modality (satellite rainfall). The model prediction relies on a full vector, and the Model Probability output cannot be legitimately calculated on missing data.

## 14. Final evidence-based status
**BLOCKED_FEATURE_RECONSTRUCTION**
