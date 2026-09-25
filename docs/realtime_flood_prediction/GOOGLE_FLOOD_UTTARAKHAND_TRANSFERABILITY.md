# Google Flood Forecasting Geographic Transferability Validation (Uttarakhand)

## 1. Executive Conclusion
The Google Flood Forecasting checkpoint (`google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs`) is **NOT_TRANSFERABLE_TO_UTTARAKHAND** (Classification E) at this time, because authoritative historical streamflow observations for Uttarakhand do not exist in our repository to validate it, and the model inherently relies on precise, basin-specific static attributes that we have not calculated for Uttarakhand catchments. The validation is fundamentally blocked by the absence of target observation data.

## 2. What Phase 7.1–7.6 Actually Established
Phase 7.1-7.6 proved that the codebase, data streaming pipeline (MultiMet GCS), and model forward pass function correctly on a CPU environment. The comparison that produced a matching P50 (MAE = 0.2003 m³/s) was executed on a **single 8-day window (October 1987) for a US-based CAMELS basin (`04115265`)**, which is part of the original Caravan training/testing distribution. It demonstrated technical execution and output-contract validity (m³/s with 372 timesteps), but it **did not demonstrate geographic transferability or performance on unseen Indian basins**.

## 3. Checkpoint Identity
- **Name**: `google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs`
- **Output**: 372 timesteps, probabilistic mixture (CMAL).

## 4. Original Model Geography
- **Training Coverage**: The model was trained on the Caravan dataset (CAMELS-US, CAMELS-GB, CAMELS-BR, CAMELS-CL, CAMELS-AUS, LamaH-CE, and HYSETS).
- **Basin Types**: Primarily North America, South America, Europe, and Australia.
- **Indian Coverage**: The Caravan dataset does NOT contain Indian basins. The model has never seen Himalayan catchments or monsoon-driven Indian hydrology during its training.
- **Input Requirements**: The model relies on 32 precomputed static catchment attributes (e.g., elevation, slope, aridity index) and dynamic meteorological forcings (MultiMet).

## 5. Uttarakhand Geography
Uttarakhand consists of steep Himalayan topography, glacial melt influences, extreme localized monsoon rainfall (cloudbursts), and rapid-response flash flood basins. The hydrological dynamics differ drastically from standard US/European catchments present in Caravan.

## 6. Candidate Observation Stations
An audit of our local data repository (`data/processed/waterlevel/cwc_water_level_stations.csv`) identified 9 CWC telemetry stations (e.g., Devprayag, Rishikesh, Haridwar, Joshimath, Nandprayag, Karanprayag, Rudraprayag, Srinagar, Uttarkashi).

However, **NONE** of these stations have accompanying historical streamflow/discharge observations (m³/s) available in the repository.

## 7. Observation Sources
- **Current Repo Status**: The repository only contains offline telemetry metadata (`cwc_water_level_stations.csv`) and categorical flash flood event definitions (`uttarakhand_flash_flood_features_processed.csv`), not continuous quantitative streamflow.
- **External Feasibility**: Authoritative streamflow data for the Ganges basin (especially upstream in Uttarakhand) is classified by the Government of India and is not freely available in public archives like GRDC at hourly/daily resolutions.

## 8. Gauge/Basin Compatibility
All Uttarakhand stations are currently **NOT SUPPORTED**.
- We lack the 32 precomputed static Caravan attributes for these specific Indian basins.
- We lack the observation data to validate them.
- Mapping nearest-neighbor coordinates is scientifically invalid for hydrology, as catchments are bounded by topography, not euclidean distance.

## 9. Evaluation Methodology
An evaluation methodology could not be executed. No quantitative historical backtest was possible.

## 10. Leakage Controls
N/A (No backtest possible).

## 11. Metrics
N/A.

## 12. Baseline Comparison
N/A.

## 13. Results
Inconclusive/Blocked due to missing observation data.

## 14. Limitations
- Lack of authoritative streamflow data (m³/s) for India.
- Lack of precomputed static attributes for Uttarakhand catchments.

## 15. Transferability Classification
**`NOT_TRANSFERABLE_TO_UTTARAKHAND`**
Without a historical target dataset of streamflow observations, it is scientifically impossible to calculate MAE, RMSE, or NSE for Uttarakhand, rendering any transferability claim fabricated.

## 16. Required Next Step
If Jal Drishti requires a physical discharge prediction, the team must procure valid historical streamflow data for Uttarakhand and compute the 32 static Caravan attributes for the target basins using HydroSHEDS and climate data. Until then, the project must rely on the existing XGBoost severity classification model.

## 17. Exact Evidence Paths/References
- `data/processed/waterlevel/cwc_water_level_stations.csv` (contains no historical discharge)
- `data/uttarakhand_flash_flood_features_processed.csv` (contains no continuous discharge)
- Phase 7.1-7.6 log output confirming `camels_04115265` was the evaluated station.
