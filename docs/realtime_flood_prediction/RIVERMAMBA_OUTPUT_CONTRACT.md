# RiverMamba Output Contract

This document defines the exact contract of the RiverMamba model output based on the official source code implementation (`inference_aifas.py`).

## Variable Details

*   **Variable Name:** `dis24` (River Discharge)
*   **Units:** $m^3/s$
*   **Temporal Horizon:** `delta_t_f` = 7 days (as defined in `config.py`)
*   **Temporal Resolution:** Daily
*   **Spatial Indexing:** AIFAS points (`1,529,667` maximum) or full map points (`6,221,926`).
*   **Catchment/Grid Relationship:** The model operates directly on grid points (lat/lon) without explicitly grouping them by catchments, using coordinate curves (Space-Filling Curves) to order them into sequences.

## Transformation & Semantics

The raw output of the RiverMamba regression head is a **residual log1p-transformed discharge** relative to the last timestep of the input GloFAS sequence.

The post-processing in `inference_aifas.py` performs the following steps:

1.  **Inverse Log1p:** `preds = exp(preds) - 1` (via `val_dataset.log1p_inv_transform`)
2.  **Un-normalization:** (If applicable)
3.  **Base Addition:** `preds = data_glofas_input[:, -1] + preds` (The last input GloFAS step is added to the prediction residual).
4.  **Clipping:** `preds = clip(preds, min=0)` to prevent negative discharges.

## Output Tensor Dimensions

The output tensor produced per sample (ignoring batch dimension) is:
`[7, N, 1]`

*   `7`: Lead time (days 1 through 7)
*   `N`: Number of spatial points predicted in the chunk (e.g., `254,945` for AIFAS chunk, or full evaluation mask).
*   `1`: Feature dimension (`dis24`).

The output is written to a NetCDF file (`.nc`) containing the `dis24` variable with dimensions `("time", "x")`.
