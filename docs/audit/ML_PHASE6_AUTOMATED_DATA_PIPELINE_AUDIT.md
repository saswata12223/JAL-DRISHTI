# 🛰️ Jal Drishti — ML Phase 6: Automated Rolling Data Pipeline Discovery & Architecture Report



**System:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)

**Phase:** ML Phase 6 — Automated Rolling Data Pipeline Discovery & Architecture Design

**Target Region:** Uttarakhand, India (Bounding Box: $77.8^\circ\text{E}$ to $81.1^\circ\text{E}$, $28.5^\circ\text{N}$ to $31.5^\circ\text{N}$)



---



## 1. EXISTING PIPELINE INVENTORY TABLE



| Data Source | Provider / Agency | Existing Script / Module | Input Format / Protocol | Output Artifact / Location | Temporal Resolution | Spatial Resolution | Auth Required? | Current Status | Reusable? | Modification Needed? | Data Type |

|---|---|---|---|---|---|---|---|---|---|---|---|

| **GPM IMERG Early/Late** | NASA Earthdata / GSFC | `scripts/gpm_auto_ingest.py`, `scripts/gpm_nasa_download.py` | HDF5 / NetCDF via `earthaccess` CMR | `data/raw/gpm/`, `standardized_dynamic_atmosphere.nc` | 30-minute | 0.1° (~10km) | **YES** (Earthdata Login) | **ACTIVE** | **YES** | Add dynamic `start_time` / `end_time` CLI args | **DYNAMIC** |

| **SMAP Soil Moisture** | NASA Earthdata / NSIDC DAAC | `scripts/smap_ingest.py` (`SPL3SMP_E` / `SPL4SMGP`) | HDF5 via `earthaccess` CMR | `data/processed/smap/smap_soil_moisture.nc` | Daily / 2-3 day revisit | 9 km / 0.1° | **YES** (Earthdata Login) | **ACTIVE** | **YES** | Add configurable date window params | **DYNAMIC** |

| **IMD Weather Stations** | India Meteorological Dept | `scripts/imd_ingest.py` | HTTP REST / JSON endpoints | `data/processed/weather/imd_weather_latest.json` | Hourly / Nowcast | 157 Station Nodes | **NO** (Public Portal) | **ACTIVE** | **YES** | Refactor endpoint fallback handling | **DYNAMIC** |

| **CWC River Gauge Levels** | Central Water Commission | `scripts/waterlevel_ingest.py` | HTTP REST / CWC FFS Gateway | `data/processed/waterlevel/cwc_water_level_latest.json` | Hourly / Daily | 20 Station Nodes | **NO** (Public Portal) | **ACTIVE** | **YES** | Add rate-of-rise calculation | **DYNAMIC** |

| **SRTM DEM Elevation** | NASA / USGS | `scripts/dem_ingest.py` | GeoTIFF / NetCDF | `data/processed/srtm/`, `unified_static_features.nc` | Static | ~90m (3 arc-sec) | **NO** | **ACTIVE** | **YES** | **NONE** (Cached static asset) | **STATIC** |

| **ESA WorldCover LULC** | European Space Agency | `scripts/landcover_ingest.py` | GeoTIFF | `data/processed/landcover/` | Static | 10m / ~90m | **NO** | **ACTIVE** | **YES** | **NONE** (Cached static asset) | **STATIC** |

| **ESP32 Local Telemetry** | IoT Ultrasonic Node | `hardware/scripts/mqtt_gateway.py` | Serial / MQTT (`telemetry/sensor`) | `POST /hardware/telemetry` API Endpoint | Real-time (seconds) | Local Point Node | **NO** (Local Network) | **ACTIVE** | **YES** | Integrate with live feature buffer | **DYNAMIC** |

| **Data Standardization** | Jal Drishti Pipeline | `scripts/standardize.py` | Raw NetCDF / Parquet / GeoTIFF | `data/processed/standardized/` | Batch run | Dual ~90m / 0.1° | **NO** | **ACTIVE** | **YES** | Wrap in rolling orchestrator | **PIPELINE** |

| **Multimodal Features** | Jal Drishti Pipeline | `scripts/multimodal_features.py` | Standardized NetCDF / Parquet | `data/processed/features/zonal_catchment_features.parquet` | Batch run | Dual ~90m / 0.1° | **NO** | **ACTIVE** | **YES** | Support rolling 34-predictor matrix | **PIPELINE** |



---



## 2. DATA-SOURCE CAPABILITIES & LIMITATIONS



1. **NASA GPM IMERG (Global Precipitation Measurement):**

   - *Capability:* Provides 30-minute precipitation accumulation and max/mean intensity. Available globally within ~4 hours of observation via IMERG Early Run.

   - *Limitation:* NASA Earthdata authentication is mandatory via `earthaccess`. Short-term NASA server maintenance can cause transient download failures.

2. **NASA SMAP (Soil Moisture Active Passive):**

   - *Capability:* Direct surface (0-5cm) and rootzone (0-100cm) volumetric soil moisture wetness fractions.

   - *Limitation:* Satellite revisit interval over Himalayan catchments is 2 to 3 days. Real-time daily steps require spatial/temporal assimilation interpolation.

3. **IMD Weather Stations (157 Nodes in Uttarakhand):**

   - *Capability:* Real-time ambient temperature (°C), relative humidity (%), surface pressure (hPa), and wind speed (m/s).

   - *Limitation:* Government web endpoints occasionally experience HTTP 503/timeout issues during peak monsoon storms.

4. **CWC River Gauge Station Network (20 Stations):**

   - *Capability:* Provides river water level ($m$), Warning Level, Danger Level, and Highest Flood Level (HFL).

   - *Limitation:* Water level measurements exist only at 20 physical river stations ($99.98\%$ missing for non-station mountain grid points).

5. **SRTM DEM & ESA WorldCover (Static Terrain & Land Cover):**

   - *Capability:* 100% complete ~90m resolution elevation, slope, flow accumulation, TWI, SPI, STI, Manning's $n$, and SCS-CN baseline Curve Numbers.

   - *Limitation:* Static; requires zero real-time network downloads.



---



## 3. PIPELINE REUSE POLICY (NO DUPLICATE CODEWRITING)



- **CRITICAL PRINCIPLE:** Existing ingestion modules (`scripts/gpm_auto_ingest.py`, `scripts/smap_ingest.py`, `scripts/imd_ingest.py`, `scripts/waterlevel_ingest.py`, `scripts/dem_ingest.py`, `scripts/landcover_ingest.py`, `scripts/standardize.py`, `scripts/multimodal_features.py`) represent months of verified development. **No replacement downloaders or duplicate scripts will be created.**

- **Orchestrator Strategy:** Phase 7 will construct a lightweight, high-level orchestrator (`scripts/orchestrate_rolling_pipeline.py`) that imports and wraps existing modules as Python libraries or invokes them with command-line arguments (`--start-date`, `--end-date`).



---



## 4. ROLLING WINDOW SUPPORT ANALYSIS



| Dynamic Source | Earliest Timestamp | Latest Timestamp | Expected Latency | Missing Data Handling | Arbitrary Date Range Support? | Auth Required? |

|---|---|---|---|---|---|---|

| **GPM IMERG** | June 2000 | Current Day - 4 hours | ~4 hours (Early Run) | Nearest temporal fill | **YES** (via `earthaccess.search_data`) | **YES** (Earthdata) |

| **NASA SMAP** | April 2015 | Current Day - 12 hours | ~12–24 hours | Climatological median fill ($0.7924$) + indicator | **YES** (via `earthaccess.search_data`) | **YES** (Earthdata) |

| **IMD Weather** | 2020 | Real-Time | Live / ~1 hour | Spatial district median fill | **YES** (via historical API queries) | **NO** |

| **CWC River** | 2018 | Real-Time | Live / ~2 hours | Explicit `water_level_missing = 1` | **YES** (via FFS API) | **NO** |

| **ESP32 IoT** | Local Boot | Real-Time | < 5 seconds | Station offline status flag | Real-time stream buffer | **NO** |



---



## 5. CONFIGURABLE ROLLING WINDOW DESIGN



The automated pipeline will feature a flexible, configurable rolling historical window:



```python

# Rolling Window Configuration (Default: 15 Days, Configurable up to 30 Days)

ROLLING_WINDOW_DAYS = int(os.getenv("ROLLING_WINDOW_DAYS", 15))

```



### Feature-Specific Lookback Strategy:

- **Precipitation Accumulation:** Rolling 30m, 1h, 3h, 6h, 12h, 24h, 48h, 72h windows.

- **Antecedent Precipitation Index (API):** Recursive decay ($k=0.85$) computed over the past 7 to 15 days.

- **Soil Moisture Saturation:** Latest available SMAP snapshot (within 72 hours) combined with monsoon climatology median fallback ($0.7924$).

- **Static Topography:** 100% cached locally; zero download overhead.



---



## 6. STATIC VS. DYNAMIC DATA ARCHITECTURE



```

                               ┌─────────────────────────────────────────┐

                               │       STATIC ASSET CACHE (LOCAL)        │

                               │  - SRTM DEM (~90m Elevation & Slope)    │

                               │  - ESA WorldCover 10m LULC & Curve No.  │

                               │  - CWC Station Metadata & Thresholds    │

                               └────────────────────┬────────────────────┘

                                                    │ (Loaded ONCE from local cache)

                                                    ▼

┌────────────────────────────────┐    ┌──────────────────────────────────────────┐

│   DYNAMIC DATA INGESTION       │    │      INCREMENTAL LOCAL CACHE INDEX       │

│ - GPM IMERG (30m Rain)         │───>│ - Check existing NetCDF/JSON ranges      │

│ - NASA SMAP (Soil Moisture)    │    │ - Download ONLY missing date intervals   │

│ - IMD Stations (Temp, RH, Wind)│    └────────────────────┬─────────────────────┘

│ - CWC Gauges (Water Levels)    │                         │

│ - ESP32 MQTT (Local Telemetry) │                         │

└────────────────────────────────┘                         ▼

                                      ┌──────────────────────────────────────────┐

                                      │  HARMONIZATION & FEATURE STANDARDIZATION │

                                      │  - Spatial Alignment (0.1° / ~90m Grid)  │

                                      │  - Temporal UTC Synchronization          │

                                      │  - Compute SCS-CN Runoff (Q, S, Ia)      │

                                      └────────────────────┬─────────────────────┘

                                                           │

                                                           ▼

                                      ┌──────────────────────────────────────────┐

                                      │ 34-PREDICTOR CANDIDATE FEATURE MATRIX    │

                                      │ (data/processed/ml/flood_ml_features_clean)

                                      └──────────────────────────────────────────┘

```



---



## 7. AUTOMATED DATA FLOW PIPELINE



1. **Trigger / Time Check:** Compute `target_end_time = datetime.now(timezone.utc)` and `target_start_time = target_end_time - timedelta(days=ROLLING_WINDOW_DAYS)`.

2. **Cache Audit:** Inspect local manifest (`data/processed/standardized/provenance_manifest.json`) to identify already downloaded files.

3. **Incremental Ingestion:** Invoke `scripts/gpm_auto_ingest.py`, `scripts/smap_ingest.py`, `scripts/imd_ingest.py`, and `scripts/waterlevel_ingest.py` for missing timestamps.

4. **Validation & Quality Gates:** Run 15 automated pre-inference quality checks (range, bounds, causality).

5. **Harmonization (`scripts/standardize.py`):** Resample dynamic data to standard $0.1^\circ$ grid and align with ~90m terrain grid.

6. **Feature Derivation (`scripts/multimodal_features.py`):** Compute 34 physical predictors ($Q, S, I_a$, SPI, STI, TRP, FFSI, API).

7. **Candidate Model Inference (`ml/inference.py`):** Predict flood risk probabilities using Phase 4 Candidate Model + SCS-CN Physics Layer.

8. **Operational Decision & ESP32 Alert:** Evaluate CWC stage thresholds; dispatch alerts to web dashboard and local ESP32 buzzers.



---



## 8. INCREMENTAL DOWNLOAD & CACHING STRATEGY



### Cache Index Manifest (`data/processed/standardized/provenance_manifest.json`):

```json

{

  "dataset": "NASA_GPM_IMERG_Early",

  "start_time_utc": "2026-08-15T00:00:00Z",

  "end_time_utc": "2026-08-30T03:30:00Z",

  "last_updated_utc": "2026-08-30T04:00:00Z",

  "total_granules_cached": 720,

  "missing_intervals": [],

  "status": "HEALTHY"

}

```



---



## 9. DATA FRESHNESS TIERING POLICY



| Source | Max Acceptable Latency | Freshness Status Thresholds | Degraded Mode Action |

|---|---|---|---|

| **GPM IMERG** | 6 hours | `< 6h`: `AVAILABLE` \| `6-24h`: `RECENT` \| `> 24h`: `STALE` | Fall back to IMD station rainfall + API decay |

| **NASA SMAP** | 48 hours | `< 48h`: `AVAILABLE` \| `48-96h`: `STALE` \| `> 96h`: `FAILED` | Fall back to monsoon baseline median ($0.7924$) |

| **IMD Weather** | 3 hours | `< 3h`: `AVAILABLE` \| `3-12h`: `STALE` \| `> 12h`: `FAILED` | Spatial district median interpolation |

| **CWC Gauge** | 6 hours | `< 6h`: `AVAILABLE` \| `> 6h`: `STALE` | Mark station level missing (`water_level_missing = 1`) |



---



## 10. SOURCE-SPECIFIC FAILURE & GRACEFUL DEGRADATION



- **Zero Zero-Imputation Rule:** Under no circumstances will missing satellite soil moisture be filled with `0.0`. Missing SMAP soil moisture will be imputed using the scientifically established **monsoon median baseline ($0.7924$)**, and `soil_moisture_missing = 1` will be recorded in system quality logs (while remaining excluded from the 34 predictive ML features per Phase 4 allowlist).

- **Graceful Mode:** If GPM satellite data is unavailable, the pipeline logs `DEGRADED_SATELLITE_MODE` and computes rainfall features using interpolated IMD weather station networks.



---



## 11. TEMPORAL & SPATIAL ALIGNMENT CONTRACT



- **Temporal Contract:** All internal operations, NetCDF files, and ML matrices use **UTC ISO-8601 timestamps** (`YYYY-MM-DDTHH:MM:SSZ`). Web displays and dashboards convert to IST (`Asia/Kolkata` UTC+05:30).

- **Spatial Contract:** All rasters and spatial grids use **WGS84 EPSG:4326** geographic coordinates over Uttarakhand bounds ($77.8^\circ\text{E}$–$81.1^\circ\text{E}$, $28.5^\circ\text{N}$–$31.5^\circ\text{N}$). Dual-grid resolution: High-res ~90m grid for terrain morphometry; standard 0.1° (~10km) grid for atmospheric forcing.



---



## 12. 34-PREDICTOR FEATURE AUTOMATION READINESS CONTRACT



Mapping of all 34 candidate predictors (`candidate_feature_allowlist_phase4.json`) to automated data pipelines:



| # | Predictor Feature Name | Group | Source Script / Pipeline | Required Raw Input Data | Lookback Window | Formula / Derivation | Automation Readiness |

|---|---|---|---|---|---|---|---|

| 1 | `rainfall_30min_mm` | RAINFALL | `gpm_auto_ingest.py` | GPM IMERG 30m HDF5 | 30 min | Direct GPM precipitation | **READY** |

| 2 | `rainfall_1h_mm` | RAINFALL | `multimodal_features.py` | GPM / IMD station | 1 hour | Sum of two 30m steps | **READY** |

| 3 | `rainfall_3h_mm` | RAINFALL | `multimodal_features.py` | GPM / IMD station | 3 hours | Sum of six 30m steps | **READY** |

| 4 | `max_rainfall_intensity_mmh` | RAINFALL | `multimodal_features.py` | GPM IMERG | 30 min | Peak intensity in window | **READY** |

| 5 | `mean_rainfall_intensity_mmh` | RAINFALL | `multimodal_features.py` | GPM IMERG | 30 min | Mean intensity in window | **READY** |

| 6 | `rainfall_trend` | RAINFALL | `multimodal_features.py` | GPM IMERG | 1 hour | First difference $\Delta P = P_t - P_{t-1}$ | **READY** |

| 7 | `rainfall_surge_ratio` | RAINFALL | `multimodal_features.py` | GPM IMERG | 1 hour | Ratio $\frac{\text{max\_intensity}}{\text{mean\_intensity} + 0.01}$ | **READY** |

| 8 | `effective_precipitation_mm` | RAINFALL | `multimodal_features.py` | GPM & SMAP SSI | 3 hours | $P_{3h} \cdot (0.366 + 0.634 \cdot SSI)$ | **READY** |

| 9 | `antecedent_precipitation_index_mm` | RAINFALL | `multimodal_features.py` | GPM IMERG | 7–15 days | Recursive decay $API_t = P_t + 0.85 API_{t-1}$ | **READY** |

| 10 | `ambient_temperature_c` | WEATHER | `imd_ingest.py` | IMD AWS / SYNOP | Instantaneous | Station reading / Spatial IDW | **READY** |

| 11 | `relative_humidity_pct` | WEATHER | `imd_ingest.py` | IMD AWS / SYNOP | Instantaneous | Station reading / Spatial IDW | **READY** |

| 12 | `surface_pressure_hpa` | WEATHER | `imd_ingest.py` | IMD AWS / SYNOP | Instantaneous | Station reading / Spatial IDW | **READY** |

| 13 | `wind_speed_ms` | WEATHER | `imd_ingest.py` | IMD AWS / SYNOP | Instantaneous | Station reading / Spatial IDW | **READY** |

| 14 | `surface_soil_moisture_vol` | SOIL | `smap_ingest.py` | NASA SMAP `SPL3SMP_E` | Latest (24-72h) | Volumetric fraction $m^3/m^3$ | **READY** |

| 15 | `rootzone_soil_moisture_vol` | SOIL | `smap_ingest.py` | NASA SMAP `SPL4SMGP` | Latest (24-72h) | Volumetric fraction $m^3/m^3$ | **READY** |

| 16 | `profile_soil_moisture_vol` | SOIL | `smap_ingest.py` | NASA SMAP `SPL4SMGP` | Latest (24-72h) | Volumetric fraction $m^3/m^3$ | **READY** |

| 17 | `soil_saturation_index` | SOIL | `multimodal_features.py` | SMAP Surface & Root | Latest (24-72h) | $0.6 \cdot \text{Surface} + 0.4 \cdot \text{Root}$ | **READY** |

| 18 | `elevation_m` | TERRAIN | `dem_ingest.py` | SRTM DEM (~90m) | Static Cached | SRTM Ground Elevation MSL | **READY** |

| 19 | `slope_deg` | TERRAIN | `dem_ingest.py` | SRTM DEM (~90m) | Static Cached | Horn 1981 gradient operator | **READY** |

| 20 | `flow_accumulation_cells` | TERRAIN | `dem_ingest.py` | SRTM DEM (~90m) | Static Cached | D8 Flow Accumulation cells | **READY** |

| 21 | `drainage_network_indicator` | TERRAIN | `dem_ingest.py` | SRTM DEM (~90m) | Static Cached | Binary mask ($\text{flow\_accum} \ge 1000$) | **READY** |

| 22 | `topographic_wetness_index` | TERRAIN | `dem_ingest.py` | SRTM DEM (~90m) | Static Cached | $\ln(a / \tan \beta)$ Beven-Kirkby | **READY** |

| 23 | `stream_power_index` | TERRAIN | `multimodal_features.py` | DEM & Slope | Static Cached | $A_s \cdot \tan \beta$ Stream power | **READY** |

| 24 | `sediment_transport_index` | TERRAIN | `multimodal_features.py` | DEM & Slope | Static Cached | $(A_s/22.13)^{0.6} \cdot (\sin \beta / 0.0896)^{1.3}$ | **READY** |

| 25 | `topographic_runoff_potential` | TERRAIN | `multimodal_features.py` | DEM & Slope | Static Cached | $\log_{10}(\text{flow\_accum}) \cdot \sin \beta$ | **READY** |

| 26 | `flash_flood_susceptibility_index` | TERRAIN | `multimodal_features.py` | DEM, TWI, Runoff $C$ | Static Cached | Multi-criteria weighted overlay | **READY** |

| 27 | `landcover_class` | HYDROLOGY | `landcover_ingest.py` | ESA WorldCover 10m | Static Cached | LULC Categorical Code | **READY** |

| 28 | `runoff_coefficient` | HYDROLOGY | `landcover_ingest.py` | ESA WorldCover 10m | Static Cached | Runoff potential fraction $[0-1]$ | **READY** |

| 29 | `mannings_roughness_n` | HYDROLOGY | `landcover_ingest.py` | ESA WorldCover 10m | Static Cached | Manning's hydraulic roughness $n$ | **READY** |

| 30 | `scs_potential_retention_s_mm` | PHYSICS | `multimodal_features.py` | Land cover & SMAP SSI | Instantaneous | $S = (25400 / CN_{\text{adj}}) - 254$ | **READY** |

| 31 | `scs_initial_abstraction_ia_mm` | PHYSICS | `multimodal_features.py` | SCS $S$ parameter | Instantaneous | $I_a = 0.20 \cdot S$ | **READY** |

| 32 | `scs_direct_runoff_q_mm` | PHYSICS | `multimodal_features.py` | SCS $S, I_a$ & Rain $P$ | Instantaneous | $Q = (P - I_a)^2 / (P - I_a + S)$ | **READY** |

| 33 | `scs_peak_runoff_potential` | PHYSICS | `multimodal_features.py` | Runoff $Q$ & Slope | Instantaneous | $Q \cdot \sin \beta \cdot (1 - n)$ | **READY** |

| 34 | `nearest_cwc_station_dist_km` | CWC | `waterlevel_ingest.py` | CWC Station List | Static Cached | Euclidean / Haversine distance | **READY** |



---



## 13. AUTOMATED PRE-INFERENCE DATA QUALITY GATES



Fifteen automated checks executed before calling `predict_proba()`:

1. `CHECK_01`: Timestamp ISO-8601 validity & UTC alignment.

2. `CHECK_02`: Duplicate timestamp detection across spatial grid points.

3. `CHECK_03`: Missing time interval gap detection (> 2 consecutive timesteps missing).

4. `CHECK_04`: Non-negative rainfall depth ($P_{30m} \ge 0.0\text{ mm}$).

5. `CHECK_05`: Relative humidity bounds ($0\% \le RH \le 100\%$).

6. `CHECK_06`: Soil moisture bounds ($0.0 \le SM \le 1.0$).

7. `CHECK_07`: Ambient temperature bounds ($-20^\circ\text{C} \le T \le 55^\circ\text{C}$).

8. `CHECK_08`: Surface pressure bounds ($500\text{ hPa} \le P_{\text{surf}} \le 1100\text{ hPa}$).

9. `CHECK_09`: Coordinates within Uttarakhand spatial bounding box ($77.8^\circ\text{E}$–$81.1^\circ\text{E}$, $28.5^\circ\text{N}$–$31.5^\circ\text{N}$).

10. `CHECK_10`: SRTM DEM elevation non-negative ($Elevation \ge 0\text{ m}$).

11. `CHECK_11`: CWC threshold hierarchy ($\text{Warning} \le \text{Danger} \le \text{HFL}$).

12. `CHECK_12`: Predictor count match (Exactly 34 features present).

13. `CHECK_13`: Feature range sanity (No $\text{NaN}$ or $\infty$ values after fold-safe imputer).

14. `CHECK_14`: Stale data detection (GPM data age $< 12$ hours).

15. `CHECK_15`: Future data causality check (No observation timestamp $> \text{current prediction time}$).



If any critical gate fails, the pipeline aborts ML inference and outputs `SYSTEM_DEGRADED_DATA_WARNING`.



---



## 14. SCHEDULING & UPDATE CADENCE



- **Dynamic Data Ingestion Cadence:** Every **30 minutes** (aligned with half-hourly GPM IMERG Early releases).

- **Feature Refresh Cadence:** Every **30 minutes** (recomputes 34-predictor matrix over rolling 15-day history).

- **Prediction Cadence:** Every **30 minutes** (executes Phase 4 Candidate Model + SCS-CN Physics Layer).

- **ESP32 Local Sensor Telemetry Cadence:** Real-time stream (sub-second MQTT push to REST API `/hardware/telemetry`).



---



## 15. LOCAL ESP32 TELEMETRY & HARDWARE ALERT INTEGRATION



```

  ESP32 Water Depth Node (C++ Firmware: hardware/firmware/esp32_sensor_node.ino)

                              ↓ (Serial / MQTT)

  Python Gateway Bridge (hardware/scripts/mqtt_gateway.py)

                              ↓ (HTTP POST)

  FastAPI REST API (/hardware/telemetry in backend/app/api/routes/hardware.py)

                              ↓

  Multi-Signal Risk Decision Engine (backend/app/services/risk_decision_engine.py)

  [Combines ESP32 Water Level + ML Candidate Probability + SCS-CN Runoff Q + CWC Thresholds]

                              ↓

  HTTP Response / MQTT Command (BUZZER_ON / ALARM)

                              ↓

  ESP32 Local Audible Alarm / Siren Activation

```



---



## 16. SECURITY & CREDENTIALS AUDIT



- **Earthdata Login:** Uses `earthaccess.login()`, reading credentials securely from system environment variables (`EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`) or `~/.netrc`.

- **Zero Secrets in Source Control:** `.env` and `.env.example` are configured; no hardcoded API keys or passwords exist in python scripts or JSON manifests.



---



## 17. PROPOSED PHASE 7 ORCHESTRATOR SPECIFICATION



- **Script Name:** `scripts/orchestrate_rolling_pipeline.py`

- **Reused Modules:**

  - Ingestion: `scripts/gpm_auto_ingest.py`, `scripts/smap_ingest.py`, `scripts/imd_ingest.py`, `scripts/waterlevel_ingest.py`, `scripts/dem_ingest.py`, `scripts/landcover_ingest.py`

  - Harmonization: `scripts/standardize.py`

  - Feature Engineering: `scripts/multimodal_features.py`

  - Model Serving: `ml/inference.py`

- **Modifications Needed:** Add CLI argument parsing (`--rolling-days`, `--start-date`, `--end-date`) to `gpm_auto_ingest.py` and `smap_ingest.py`.

- **New Files to Create:** `scripts/orchestrate_rolling_pipeline.py` and `backend/app/services/rolling_pipeline_service.py`.



---



## 🏁 18. PHASE 6 DISCOVERY RESULT SUMMARY



```

PHASE 6 DISCOVERY RESULT:



Existing reusable pipelines:

- scripts/gpm_auto_ingest.py (NASA GPM IMERG Ingestion)

- scripts/smap_ingest.py (NASA SMAP Soil Moisture Ingestion)

- scripts/imd_ingest.py (IMD Weather Station Ingestion)

- scripts/waterlevel_ingest.py (CWC River Gauge Level Ingestion)

- scripts/dem_ingest.py (NASA SRTM DEM Terrain Ingestion)

- scripts/landcover_ingest.py (ESA WorldCover LULC Ingestion)

- scripts/standardize.py (Data Harmonization & Standardization)

- scripts/multimodal_features.py (34-Predictor Feature Engineering Engine)

- ml/inference.py (Operational Inference Wrapper)

- hardware/scripts/mqtt_gateway.py (ESP32 Serial/MQTT Telemetry Gateway)



Dynamic sources:

- NASA GPM IMERG (Precipitation, 30m resolution, 0.1° grid)

- NASA SMAP (Soil Moisture, Daily/2-3 day revisit, 9km grid)

- IMD Weather Stations (Temperature, Humidity, Pressure, Wind, 157 stations)

- CWC River Gauges (Water level, Warning/Danger/HFL thresholds, 20 stations)

- ESP32 Telemetry (Ultrasonic water surface distance, real-time)



Static sources:

- NASA SRTM v4.1 DEM (~90m elevation, slope, flow accumulation, TWI, SPI, STI)

- ESA WorldCover 10m (LULC classification, runoff coefficient, Manning's n)

- CWC Gauge Station Metadata (Coordinates, datum MSL, thresholds)



Current automation gaps:

- Ingestion scripts currently have hardcoded date ranges in headers and need CLI argument support (--start-date, --end-date).

- Automated orchestrator script wrapping all ingestion, standardization, and feature extraction modules into a single entrypoint is needed.



Recommended rolling window:

CONFIGURABLE (Default: 15 Days, support for 15-30 Days via ROLLING_WINDOW_DAYS env variable)



Recommended ingestion cadence:

30 minutes (aligned with NASA GPM IMERG Early releases)



Recommended prediction cadence:

30 minutes



Features currently automatically reproducible:

34 / 34 predictors (100% of Phase 4 clean physical allowlist)



Features requiring additional implementation:

0 / 34 predictors (All 34 features are supported by existing pipelines)



Recommended orchestrator:

scripts/orchestrate_rolling_pipeline.py (Python orchestrator wrapping existing ingestion scripts)



Implementation risk:

LOW (All core ingestion, harmonization, and feature engineering modules already exist and are 100% functional)



PHASE 7 RECOMMENDATION:

Proceed to ML Phase 7 — Automated Rolling Pipeline Orchestrator Implementation. Refactor existing ingestion scripts to accept dynamic date parameters, implement scripts/orchestrate_rolling_pipeline.py, and integrate with backend scheduler without breaking existing Champion artifacts.

```
