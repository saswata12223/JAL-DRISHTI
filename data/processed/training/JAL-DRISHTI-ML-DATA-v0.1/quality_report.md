# JAL DRISHTI ML DATASET v0.1 — QUALITY & INTEGRITY REPORT

**Build Date:** 2026-09-14 19:25:29 UTC
**Data Integrity Standard:** ZERO Synthetic Values, 100% Real Observations

---

## 1. Executive Data Summary

- **Total Catalogue Events:** 15
- **Events with NASA GPM Rainfall Coverage:** 14 / 15 (FL-UK-1970-01 predates 1998 satellite era)
- **Events without GPM Coverage:** 1
- **Events with NASA SMAP Soil Moisture Coverage:** 8 / 15 (SMAP operational March 2015+)
- **Events without SMAP Coverage:** 7
- **Events with NOAA GFS Forecast Vintage:** 0 / 15 (Historical forecast cycles unavailable on NOMADS filter service)
- **Events without GFS Forecast:** 15
- **Events with SRTM Terrain Features:** 15 / 15
- **Events with ESA WorldCover Landcover Features:** 15 / 15
- **CWC Water Level Gauge Status:** UNAVAILABLE (No synthetic river gauges fabricated)
- **Total Dataset Rows:** 1116
- **Duplicate Rows:** 0
- **Minimum Precipitation Observation:** 0.00 mm
- **Maximum Precipitation Observation:** 19.10 mm
- **Maximum Rainfall Event:** FL-UK-2019-01

---

## 2. Feature Missingness Analysis

| Feature Name | Missing (%) | Missing Count | Availability Status |
|---|---|---|---|
| `event_id` | 0.0% | 0 | COMPLETE |
| `event_date` | 0.0% | 0 | COMPLETE |
| `timestamp` | 0.0% | 0 | COMPLETE |
| `latitude` | 0.0% | 0 | COMPLETE |
| `longitude` | 0.0% | 0 | COMPLETE |
| `precipitation_mm` | 0.0% | 0 | COMPLETE |
| `gpm_precipitation_rate_mm_hr` | 0.0% | 0 | COMPLETE |
| `source_product` | 0.0% | 0 | COMPLETE |
| `source_version` | 0.0% | 0 | COMPLETE |
| `source_granule` | 0.0% | 0 | COMPLETE |
| `observation_time` | 0.0% | 0 | COMPLETE |
| `coord_class` | 0.0% | 0 | COMPLETE |
| `event_type` | 0.0% | 0 | COMPLETE |
| `flash_flood_target_eligible` | 0.0% | 0 | COMPLETE |
| `rainfall_30min_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_1h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_3h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_6h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_12h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_24h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_48h_mm` | 0.0% | 0 | COMPLETE |
| `rainfall_72h_mm` | 0.0% | 0 | COMPLETE |
| `event_time_precision` | 0.0% | 0 | COMPLETE |
| `target_suitability` | 0.0% | 0 | COMPLETE |
| `severity` | 0.0% | 0 | COMPLETE |
| `elevation` | 0.0% | 0 | COMPLETE |
| `slope` | 0.0% | 0 | COMPLETE |
| `aspect` | 0.0% | 0 | COMPLETE |
| `curvature` | 0.0% | 0 | COMPLETE |
| `flow_accumulation` | 0.0% | 0 | COMPLETE |
| `topographic_wetness_index` | 0.0% | 0 | COMPLETE |
| `stream_power_index` | 0.0% | 0 | COMPLETE |
| `distance_to_stream` | 0.0% | 0 | COMPLETE |
| `drainage_density` | 0.0% | 0 | COMPLETE |
| `landcover_class` | 0.0% | 0 | COMPLETE |
| `landcover_name` | 0.0% | 0 | COMPLETE |
| `forest_fraction` | 0.0% | 0 | COMPLETE |
| `cropland_fraction` | 0.0% | 0 | COMPLETE |
| `urban_fraction` | 0.0% | 0 | COMPLETE |
| `bare_ground_fraction` | 0.0% | 0 | COMPLETE |
| `surface_sm` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `rootzone_sm` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `official_wetness_or_saturation_if_available` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_forecast_rainfall_mm` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_temperature_2m_c` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_relative_humidity_pct` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_surface_pressure_hpa` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_wind_speed_ms` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_cape_jkg` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `gfs_status` | 0.0% | 0 | COMPLETE |
| `cwc_water_level_m` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_discharge_m3s` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_rate_of_rise_mh` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_warning_level_m` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_danger_level_m` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_hfl_m` | 100.0% | 1116 | UNAVAILABLE_HISTORICAL |
| `cwc_status` | 0.0% | 0 | COMPLETE |

---

## 3. GPM Event Coverage Breakdown

| event_id      | event_date   |   gpm_records | gpm_coverage_status           |   missing_fraction |   max_precipitation_mm_hr |   total_accumulation_mm |
|:--------------|:-------------|--------------:|:------------------------------|-------------------:|--------------------------:|------------------------:|
| FL-UK-1970-01 | 1970-07-20   |             0 | PRE_SATELLITE_ERA_UNAVAILABLE |                  1 |                    nan    |                 nan     |
| FL-UK-1998-01 | 1998-08-11   |            54 | COVERAGE_AVAILABLE            |                  0 |                      9.39 |                  27.5   |
| FL-UK-1998-02 | 1998-08-18   |            54 | COVERAGE_AVAILABLE            |                  0 |                     12.61 |                  45.355 |
| FL-UK-2010-01 | 2010-09-18   |            54 | COVERAGE_AVAILABLE            |                  0 |                      9.51 |                  39.8   |
| FL-UK-2012-01 | 2012-08-03   |           396 | COVERAGE_AVAILABLE            |                  0 |                     18.23 |                 169.475 |
| FL-UK-2012-02 | 2012-09-13   |            54 | COVERAGE_AVAILABLE            |                  0 |                      7.77 |                  23.625 |
| FL-UK-2013-01 | 2013-06-16   |            54 | COVERAGE_AVAILABLE            |                  0 |                     12.63 |                  43.175 |
| FL-UK-2016-01 | 2016-07-01   |            72 | COVERAGE_AVAILABLE            |                  0 |                     15.8  |                  99.195 |
| FL-UK-2019-01 | 2019-08-18   |            54 | COVERAGE_AVAILABLE            |                  0 |                     38.21 |                  58.52  |
| FL-UK-2021-01 | 2021-02-07   |            54 | COVERAGE_AVAILABLE            |                  0 |                      0.08 |                   0.085 |
| FL-UK-2021-02 | 2021-10-18   |            54 | COVERAGE_AVAILABLE            |                  0 |                     38.1  |                  48.81  |
| FL-UK-2022-01 | 2022-08-19   |            54 | COVERAGE_AVAILABLE            |                  0 |                     23    |                  52.495 |
| FL-UK-2023-01 | 2023-08-04   |            54 | COVERAGE_AVAILABLE            |                  0 |                      9.77 |                  32.66  |
| FL-UK-2023-02 | 2023-08-14   |            54 | COVERAGE_AVAILABLE            |                  0 |                      4.26 |                  21.81  |
| FL-UK-2024-01 | 2024-07-31   |            54 | COVERAGE_AVAILABLE            |                  0 |                     11.98 |                  27.25  |

---

## 4. SMAP L4 Event Coverage Breakdown

| event_id      | event_date   |   smap_records | smap_coverage_status     |   missing_fraction |
|:--------------|:-------------|---------------:|:-------------------------|-------------------:|
| FL-UK-1970-01 | 1970-07-20   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-1998-01 | 1998-08-11   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-1998-02 | 1998-08-18   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-2010-01 | 2010-09-18   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-2012-01 | 2012-08-03   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-2012-02 | 2012-09-13   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-2013-01 | 2013-06-16   |              0 | PRE_SMAP_ERA_UNAVAILABLE |                  1 |
| FL-UK-2016-01 | 2016-07-01   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2019-01 | 2019-08-18   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2021-01 | 2021-02-07   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2021-02 | 2021-10-18   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2022-01 | 2022-08-19   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2023-01 | 2023-08-04   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2023-02 | 2023-08-14   |              2 | COVERAGE_AVAILABLE       |                  0 |
| FL-UK-2024-01 | 2024-07-31   |              2 | COVERAGE_AVAILABLE       |                  0 |