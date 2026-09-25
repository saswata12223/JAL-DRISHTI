# ANOMALY BASELINE SELECTION

## Baseline Analysis Overview
To train the unsupervised Isolation Forest for Phase 8 Live Hydrometeorological Anomaly Monitoring, we must select the appropriate background "normal" manifold. 

Two populations were evaluated strictly excluding the 60 validated `POSITIVE` event observations.

### Baseline A
- **Population:** `NEGATIVE` only
- **Sample volume:** 1,169,701
- **Mean Anomaly Score (decision_function):** 0.3699
- **Std Anomaly Score:** 0.0802
- **Number of theoretical 1% anomalies:** 11,659

### Baseline B
- **Population:** `NEGATIVE` + `UNKNOWN`
- **Sample volume:** 1,863,936
- **Mean Anomaly Score (decision_function):** 0.3777
- **Std Anomaly Score:** 0.0921
- **Number of theoretical 1% anomalies:** 18,445

## Selected Baseline
**Selected baseline:** NEGATIVE + UNKNOWN (Baseline B)

## Reason
Baseline B provides an additional ~700,000 observations of natural hydrometeorological variance. The `UNKNOWN` class in Phase 7D indicates a lack of verifiable event evidence, not a verifiable flood event. Excluding it would artificially narrow the "normal" manifold to only explicitly verified negative periods, potentially increasing the false positive anomaly rate during natural weather fluctuations. The standard deviation of the anomaly scores in Baseline B (0.0921) is higher than A (0.0802), indicating a richer, more diverse background distribution that is better suited for a generalized environmental anomaly detector. 

## Assumptions
- `UNKNOWN` rows do not contain a sufficiently high concentration of extreme unrecorded catastrophic floods to skew the unsupervised anomaly baseline.
- The 1% contamination threshold remains a viable starting point for exploring anomaly tails before deriving the final exploratory percentile thresholds.

## Limitations
- If unrecorded floods exist in the `UNKNOWN` population, the model might slightly normalize certain extreme states.
- The imputation of missing terrain and soil moisture data (inherited from Phase 7D) with 0 reduces the multidimensional variance, creating a dense cluster at 0 for those features. This is a known limitation of the current spatial mapping mismatch.
