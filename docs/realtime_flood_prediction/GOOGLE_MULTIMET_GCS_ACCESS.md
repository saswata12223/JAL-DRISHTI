# GOOGLE MULTIMET GCS ACCESS

## 1. Access Verification
- **Status:** SUCCESS
- **Authentication Required:** No (publicly readable with `token="anon"`).
- **Execution Date:** 2026-09-17

## 2. Directory Structure and Object Prefixes
The root `gs://caravan-multimet/v1.1` was successfully listed. It contains the following product partitions, each containing a `timeseries.zarr` object prefix:

| Path | Status | Contains `timeseries.zarr` |
| ---- | ------ | -------------------------- |
| `caravan-multimet/v1.1/CHIRPS` | OK | Yes |
| `caravan-multimet/v1.1/CHIRPS_GEFS` | OK | Yes |
| `caravan-multimet/v1.1/CPC` | OK | Yes |
| `caravan-multimet/v1.1/ERA5_LAND` | OK | Yes |
| `caravan-multimet/v1.1/GRAPHCAST` | OK | Yes |
| `caravan-multimet/v1.1/HRES` | OK | Yes |
| `caravan-multimet/v1.1/IMERG` | OK | Yes |

## 3. Unavailable Paths / Errors
- No unavailable paths.
- No permission errors encountered during listing.

## 4. Conclusion
The GCS data structure perfectly matches the assumptions hardcoded in `googlehydrology.datasetzoo.multimet.MultimetDataLoader` and `_get_products_and_bands_from_feature_strings`. 

**Verification Result:**
A direct script utilizing `googlehydrology.datasetzoo.multimet.Multimet` confirmed that configuring `cfg.dynamics_data_dir = Path("gs://caravan-multimet/v1.1")` allows the official dataloader to natively stream required MultiMet products (`ERA5-Land`, `HRES`, `GraphCast`) as chunked `dask` Zarr arrays. The dynamic data dependencies of the checkpoint (`google-floodhub-nse-filtered`) can be entirely fulfilled via remote GCS streaming.
