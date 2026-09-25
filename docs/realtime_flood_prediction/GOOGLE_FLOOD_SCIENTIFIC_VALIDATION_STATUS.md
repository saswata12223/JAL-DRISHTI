# Google Flood Forecasting - Scientific Validation Status

## Status Breakdown

### 1. Execution Validation: **VALIDATED**
- The `googlehydrology` pipeline successfully runs on the local CPU environment using Python 3.12.
- GCS streaming of MultiMet (`ERA5_LAND`, `HRES`, `GRAPHCAST`) operates correctly.
- Workarounds for `torch.compile` (`cl` compiler missing) are effective for local inference.

### 2. Output-Contract Validation: **VALIDATED**
- The `google-floodhub-nse-filtered` checkpoint correctly produces 372 timesteps of CMAL distributions.
- Parameter unscaling (`center=1.777243`, `scale=3.3809924`) yields mathematically sound probabilistic quantiles (P10, P50, P90) in m³/s.

### 3. Hydrological Validation: **PARTIALLY VALIDATED (US BASIN ONLY)**
- Validated on a single Caravan sample (CAMELS-US `04115265` from Oct 1987).
- MAE and RMSE were ~0.2 m³/s, demonstrating correct prediction behavior *in-distribution*.

### 4. Geographic Validation (Uttarakhand): **BLOCKED / FAILED**
- No continuous historical streamflow observations exist in the Jal Drishti repository for Uttarakhand.
- Without authoritative streamflow data (e.g. from the CWC), the model's accuracy on steep, monsoon-driven Himalayan catchments cannot be scientifically proven.
- The 32 required static catchment attributes are not calculated for Indian basins in the current pipeline.

### 5. Realtime Feasibility: **VALIDATED**
- Execution latency (~20ms) and RAM footprint (~270MB) are fully compatible with lightweight realtime deployment constraints.

### 6. Production Readiness: **NOT READY**
- Integrating an uncalibrated, unvalidated global model into a production system predicting catastrophic flash floods in India violates fundamental ML safety principles.

---

## Production Gate Decision

**`PHASE_7_8_ALLOWED = NO`**

**Blocking Evidence:**
1. Zero historical continuous streamflow (m³/s) targets exist in the dataset to perform geographic validation.
2. The Caravan static features required by the Google model (e.g., specific catchment area, aridity index, geological porosity) do not exist for the target CWC stations.
3. The Phase 7.5 success was performed on `camels_04115265` (a US basin), which provides zero scientific evidence of transferability to Uttarakhand.

Any integration into `backend/app/services/ml/prediction_service.py` at this time would be scientifically indefensible. The project must retain the existing XGBoost severity model as the Champion for the production Jal Drishti prediction service until appropriate streamflow validation targets are obtained.
