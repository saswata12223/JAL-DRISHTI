# JAL DRISHTI ML DATASET v1.0 — Data Sources & Provenance Manifest

| Provider | Dataset / Product | Version | Access Method | Coverage | Temporal Res. | Spatial Res. | Access Status / License |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GoI / USDMA / GSI** | Historical Flood Event Catalogue | v1.0 | Official Bulletins / Reports | 15 Events (1970–2024) | Daily / Event | Point / Centroid | Verified Primary Public Records |
| **NASA GPM** | IMERG Final Precipitation | V07B | NASA CMR / earthaccess | 14 Events (1998–2024) | 30-min | 0.1 deg (~10 km) | Open Access (NASA Earthdata) |
| **NASA SMAP** | L4 Global Surface/Rootzone SM | SPL4SMGP.008 | NASA CMR / earthaccess | 8 Events (2016–2024) | 3-hr | 9 km grid | Open Access (NASA Earthdata) |
| **NOAA** | Operational Forecast System (GFS) | 0.25 deg | Public NOMADS Archive | 0 Events (1970–2024) | 3-hr forecast | 0.25 deg | `GFS_FORECAST_VINTAGE = UNAVAILABLE` |
| **ECMWF** | ERA5 / ERA5-Land Reanalysis | Single Levels | CDS API (ECMWF) | 0 Events | Hourly | 0.1 deg | `CDS_ACCOUNT_REQUIRED (UNAVAILABLE)` |
| **NASA / USGS** | SRTM DEM Terrain Predictors | V3 90m | Local Cached HydroSHEDS | 15 Events (100%) | Static | 90 m | Open Access (USGS/NASA) |
| **ESA** | WorldCover Land Cover | 10m V200 | Local Cached Raster | 15 Events (100%) | Static | 10 m | Open Access (ESA CC-BY 4.0) |
| **CWC / NWIC** | River Telemetry & Gauge Data | Historical | India-WRIS / WIMS API | 0 Events | Hourly | Station | `CWC_STATUS = UNAVAILABLE` |
| **ISRIC** | SoilGrids Soil Properties | 250m V2.0 | WCS / GeoTIFF | 0 Events | Static | 250 m | `GLOBAL_GRIDDED_RASTER_REQUIRED` |
