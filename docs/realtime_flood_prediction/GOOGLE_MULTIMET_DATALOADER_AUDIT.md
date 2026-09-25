# GOOGLE MULTIMET DATALOADER AUDIT

## 1. Dataloader Identity

- **Python module:** `googlehydrology.datasetzoo.multimet`
- **Class names:** `Multimet` (inherits from `Dataset`), `MultimetDataLoader` (inherits from `torch.utils.data.DataLoader`), `SampleIndexer`
- **Helper function:** `_get_products_and_bands_from_feature_strings`

## 2. Expected Configuration

- **GCS Root (dynamics_data_path):** `gs://caravan-multimet/v1.1`
- **Expected Directory Structure:** The dataloader expects Zarr stores partitioned by product name, e.g., `<product>/timeseries.zarr`.
- **Expected Product Names:** Derived by splitting feature strings at the first underscore, uppercasing, and replacing `ERA5LAND` with `ERA5_LAND`. Known products include `ERA5_LAND`, `HRES`, `GRAPHCAST`, `IMERG`, `CPC`, `CHIRPS`.

## 3. Data Extraction Semantics

- **Variable names:** The dataloader extracts the "band" and uses it to slice the product's xarray Dataset (`product_ds[bands]`). The full variable name in config remains e.g. `era5land_total_precipitation`.
- **Basin selection:** Slices by basin IDs directly in xarray (`product_ds.sel(basin=self._basins)`).
- **Temporal Resolution:** Loaded via `lead_time` dimension for forecasts. Hindcast data is loaded natively and expanded with a 0-day lead time coordinate. Assumed to be daily frequency compatible with Caravan standard.
- **Spatial Resolution:** Basin-aggregated (1D time series per basin).

## 4. Execution Details

- **Streamed vs Downloaded:** Data is STREAMED via `xr.open_zarr()` using `dask` and `gcsfs`.
- **Cache Behavior:** Zarr chunks are accessed lazily over the network. If `lazy_load` is True in `MultimetDataLoader`, it computes Dask graphs per batch during training/inference.
- **Normalization:** Evaluated later in the pipeline using a static `scaler.nc` or scaler objects provided by the model checkpoint.
- **Memory Usage:** Lazy loading prevents out-of-memory errors on the full bucket, but Dask graph overhead is noted in TODOs inside `multimet.py`.
