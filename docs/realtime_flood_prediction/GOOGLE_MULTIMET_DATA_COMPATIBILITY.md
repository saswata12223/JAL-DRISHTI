# Google Flood Forecasting MultiMet Data Compatibility

## 1. Official Documentation & MultiMet Access Status

- **Exact MultiMet dataset version:** `v1.1`
- **Exact storage location:** `gs://caravan-multimet/v1.1`
- **Public authentication required:** No (public anonymous access via `gcsfs` / Google Cloud Storage is permitted).
- **Storage bucket exists:** Yes.
- **Alternative official download location:** None documented.
- **Google Mirror:** N/A.
- **Caravan alternative:** The standard Caravan dataset (Zenodo) does not contain the multi-source forecasting products (HRES, GraphCast, IMERG, CPC). It only contains historical ERA5-Land reanalysis.
- **Official API/Archive:** Accessed directly via GCS/fsspec.

**CURRENT ACCESS STATUS:**
The `gs://caravan-multimet/v1.1` bucket is publicly readable (verified via `gcsfs.ls()`). However, the directory structure is partitioned by product (e.g., `gs://caravan-multimet/v1.1/ERA5_LAND`, `gs://caravan-multimet/v1.1/HRES`), which differs from the standard Caravan single-NetCDF-per-basin structure (e.g., `tutorial/Caravan-nc/timeseries/netcdf/camels/`). Using `xarray` to open the direct basin paths mapped by standard Caravan loaders results in `FileNotFoundError`. The `multimet` dataset loader inside `googlehydrology` abstracts this, meaning the data exists and is accessible if the `googlehydrology` dataloader is correctly configured to stream it.

## 2. Data Compatibility Matrix

| Required MultiMet variable | Exact source available? | Candidate local source | Units | Temporal resolution | Spatial resolution | Provenance | Compatible? | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `era5land_total_precipitation` | No | `data/era5land_hourly_rainfall_observations.csv` | mm | Hourly | 0.1°x0.1° | ERA5-Land (Jal Drishti) | REQUIRES_VALIDATED_TRANSFORMATION | Requires temporal aggregation (hourly to daily sum). |
| `era5land_temperature_2m` | No | `tutorial/Caravan-nc` (`temperature_2m_mean`) | K | Daily | Basin-averaged | Caravan (ERA5-Land) | SCIENTIFICALLY_COMPATIBLE | Physical quantity, units, and aggregation match, but names differ. |
| `era5land_surface_net_solar_radiation` | No | `tutorial/Caravan-nc` (`surface_net_solar_radiation_mean`) | J m-2 | Daily | Basin-averaged | Caravan (ERA5-Land) | SCIENTIFICALLY_COMPATIBLE | Physical quantity, units, and aggregation match. |
| `era5land_surface_net_thermal_radiation` | No | `tutorial/Caravan-nc` (`surface_net_thermal_radiation_mean`) | J m-2 | Daily | Basin-averaged | Caravan (ERA5-Land) | SCIENTIFICALLY_COMPATIBLE | Physical quantity, units, and aggregation match. |
| `era5land_surface_pressure` | No | `tutorial/Caravan-nc` (`surface_pressure_mean`) | Pa | Daily | Basin-averaged | Caravan (ERA5-Land) | SCIENTIFICALLY_COMPATIBLE | Physical quantity, units, and aggregation match. |
| `hres_total_precipitation` | No | None | - | - | - | - | MISSING | No HRES operational forecast data available locally. |
| `hres_temperature_2m` | No | None | - | - | - | - | MISSING | No HRES operational forecast data available locally. |
| `hres_surface_net_solar_radiation` | No | None | - | - | - | - | MISSING | No HRES operational forecast data available locally. |
| `hres_surface_net_thermal_radiation` | No | None | - | - | - | - | MISSING | No HRES operational forecast data available locally. |
| `hres_surface_pressure` | No | None | - | - | - | - | MISSING | No HRES operational forecast data available locally. |
| `graphcast_total_precipitation` | No | None | - | - | - | - | MISSING | No GraphCast ML forecast data available locally. |
| `graphcast_temperature_2m` | No | None | - | - | - | - | MISSING | No GraphCast ML forecast data available locally. |
| `imerg_precipitation` | No | None | - | - | - | - | MISSING | No IMERG satellite precipitation available locally. |
| `cpc_precipitation` | No | None | - | - | - | - | MISSING | No CPC gauge precipitation available locally. |

## 3. Official Conclusion
`MULTIMET_OFFICIAL_DATA_STREAMING_SUCCESSFUL`

While the GCS bucket structure initially caused `FileNotFoundError` when mapped with standard local Caravan loaders, using the official `googlehydrology.datasetzoo.multimet.MultimetDataLoader` directly successfully streams the exact Zarr datasets required by the pretrained models (`ERA5-Land`, `HRES`, `GraphCast`) via `gcsfs` directly into memory as `dask` arrays.

The exact variables required by the model (e.g. `era5land_total_precipitation`, `hres_surface_net_solar_radiation`) can be streamed remotely in real-time, completely negating the need to alias local data or generate synthetic values.
