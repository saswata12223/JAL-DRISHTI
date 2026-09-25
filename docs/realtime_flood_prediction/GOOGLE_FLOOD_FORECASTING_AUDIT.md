# Google Research Flood Forecasting Audit

## Phase 1 — Repository Audit

1. **Repository commit/hash used**: `828dfc5a66f4e6f2c86b09d500e4547c4d92ed25`
2. **Model architectures available**: `mean_embedding_forecast_lstm`, `handoff_forecast_lstm` (Note: open sourced version is Mean Embedding Forecast LSTM, based on NeuralHydrology).
3. **Pretrained models available**: 
   - `google-floodhub-base` (Model A: Full Basin Baseline)
   - `google-floodhub-nse-filtered` (Model B: High-Skill Filtered, NSE > 0.5)
4. **Exact pretrained checkpoint locations**: 
   - `scripts/google_flood_forecasting/pretrained-models/google-floodhub-settings-55-epochs/model_epoch055.pt`
   - `scripts/google_flood_forecasting/pretrained-models/google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs/model_epoch085.pt`
5. **License**: Apache License 2.0
6. **Python requirements**: `python=3.12.*`
7. **PyTorch/TensorFlow requirements**: `pytorch=2.5.1`
8. **CUDA requirements**: `cuda-toolkit=12.4`, `pytorch-cuda=12.4`
9. **CPU compatibility**: UNKNOWN — REQUIRES VERIFICATION (PyTorch inherently supports CPU, but performance and hardcoded device settings in `googlehydrology` require validation).
10. **GPU requirements**: Standard PyTorch CUDA 12.4 compatible GPU. Does not seem to require specialized custom kernels like RiverMamba's `mamba-ssm`.
11. **Expected RAM/VRAM**: UNKNOWN — REQUIRES VERIFICATION (The checkpoint size is ~13MB, indicating a small parameter count and likely low VRAM footprint).
12. **Model parameter counts**: UNKNOWN — REQUIRES VERIFICATION (Checkpoint is ~13MB, estimated at ~3-4 million parameters based on standard precision).
13. **Input variables**: MultiMet dataset (excluding CHIRPS). Includes ERA5-Land variables (e.g., `era5land_temperature_2m`, `era5land_total_precipitation`) and static catchment attributes (e.g., `p_mean`, `frac_snow`, `ele_mt_sav`).
14. **Input temporal resolution**: Daily sequences (`seq_length: 365` days).
15. **Input spatial resolution**: Catchment/Basin level aggregations (1D sequence per basin, not gridded 2D spatial).
16. **Output variables**: `streamflow`
17. **Forecast horizons**: `lead_time: 7` days (with `predict_last_n: 8`).
18. **Training datasets**: Global Caravan-like dataset (MultiMet) with 15,955 basins.
19. **Geographic coverage**: Global catchments.
20. **Training period**: 01/01/1982 to 30/09/2023.
21. **Validation/test periods**: Pre-trained models were trained on the FULL historical data period (1982-2023). There is NO temporal holdout/test split in the provided weights.
22. **Required static features**: Extensive list of static attributes derived from Caravan (e.g., `pet_mean_ERA5_LAND`, `aridity_ERA5_LAND`, land cover fractions).
23. **Required dynamic features**: Historical meteorological forcing data (precipitation, temperature, solar radiation, pressure).
24. **Can it be executed without retraining?**: 
   - YES, for inference on future data (post-2023) or spatially held-out ungauged basins (PUB).
   - NO, for historical benchmarking (due to severe data leakage, as it has seen all data from 1982-2023).
25. **Is fine-tuning supported?**: YES. Explicitly supports transfer learning via the `base_run_dir` parameter, enabling warm-started fine-tuning for local catchments.

## Phase 2 — Pretrained Model Audit

1. **Selection for Uttarakhand**: 
   - `google-floodhub-nse-filtered` (Model B) is selected as the primary candidate for initial evaluation and fine-tuning.
   - **Reasoning**: The model explicitly excludes "fundamentally unpredictable, heavily regulated, or severely noisy catchments" and focuses on "learning physically consistent rainfall-runoff relationships". Given the complexity of the Uttarakhand topology (steep Himalayan catchments, flashy runoff), starting with a high-signal pre-trained model that filters out noisy global basins provides a more stable prior for fine-tuning on regional data. Model A (Full Basin Baseline) can be used as a fallback if Model B lacks generalization to specific high-altitude extremes.
2. **Embedded Data Transformations**:
   - The pretrained model directories contain `train_data/` which houses pre-computed dataset scalers (mean/std) computed across the global training dataset.
   - Using these weights strictly requires normalizing new inputs using these exact scalers.
   - The framework automatically loads this `Scaler` object during fine-tuning (if `base_run_dir` is provided) to ensure consistent normalization without manual inverse/forward transformations.
3. **Appropriate vs Inappropriate Uses**:
   - **✅ Appropriate**: Fine-Tuning (Transfer Learning) on localized data, Spatial Generalization (PUB) to spatially held-out basins, and Future Inference (post-2023).
   - **❌ Inappropriate**: Direct operational deployment without local validation/fine-tuning, and Historical Benchmarking on the 1982-2023 period (would result in artificially inflated skill scores due to severe data leakage).
