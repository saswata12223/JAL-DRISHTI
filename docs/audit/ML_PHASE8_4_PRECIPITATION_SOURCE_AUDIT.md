# ML Phase 8.4 — High-Resolution Precipitation Source Audit and Data-Enhancement Feasibility



## 1. Executive Summary



Following the completion of **Phase 8.3**—which established that pySTEPS optical-flow advection nowcasting does not outperform the Persistence baseline on 10 km GPM satellite fields (`PYStePS_DATA_LIMITED_REQUIRES_BETTER_PRECIPITATION_FIELDS`)—this **Phase 8.4 Audit** investigates high-resolution precipitation sources for Uttarakhand.



We evaluated authoritative Indian meteorological radar networks (IMD Doppler Weather Radar), high-resolution satellite precipitation products (ISRO MOSDAC INSAT-3DR QPE), gridded ground interpolations (IMD 0.25°), and atmospheric reanalyses (ERA5-Land).



---



## 2. Current GPM Data Capabilities & Limitations



| Metric / Property | Current Production Baseline (NASA GPM IMERG Early) |

| :--- | :--- |

| **Product Identifier** | `GPM_3IMERGHHE` (v07) |

| **Spatial Resolution** | $0.1^\circ \times 0.1^\circ \approx 10\text{ km} \times 10\text{ km}$ grid |

| **Temporal Interval** | 30 minutes (half-hourly) |

| **Physical Quantity** | Instantaneous Calibrated Precipitation Rate (`mm/hr`) |

| **Uttarakhand Coverage** | Full regional grid (33 Longitudes $\times$ 30 Latitudes = 990 grid cells) |

| **Real-time Access** | Operational via NASA Earthdata CMR HTTP API (`earthaccess` authenticated) |

| **Key Limitation** | **Spatial Smoothing:** $10\text{ km}$ spatial resolution and $30\text{ min}$ interval diffuse micro-scale cloudburst cores and fail to support fine-grained optical flow nowcasting over steep terrain. |



---



## 3. Current IMD Data Capabilities & Limitations



| Metric / Property | Ground Weather Stations (IMD AWS / ARG Network) |

| :--- | :--- |

| **Source Type** | Ground Weather Observation Network |

| **Station Count** | 157 monitoring stations in Uttarakhand & surrounding river basins |

| **Temporal Frequency** | Hourly updates / Daily summaries |

| **Physical Quantities** | Ambient Temperature (`°C`), Relative Humidity (`%`), Pressure (`hPa`), Wind Speed (`m/s`), Accumulated Rainfall (`mm`) |

| **Real-time Access** | Operational via IMD GeoServer WFS / AWS REST Endpoints |

| **Key Limitation** | **Spatial Sparsity:** Station density is low in high-altitude Himalayan catchments ($>3,000\text{ m}$ MSL), where cloudbursts frequently originate. |



---



## 4. High-Resolution Radar Source Investigation



IMD operates dedicated Doppler Weather Radar (DWR) stations under the *Integrated Himalayan Meteorology Project*:



### A. Mukteshwar DWR (Kumaon, Uttarakhand)

- **Location:** Mukteshwar, Nainital District ($29.47^\circ\text{N}, 79.65^\circ\text{E}$, Altitude $2,310\text{ m}$ MSL).

- **Radar Type:** S-band / C-band Doppler Weather Radar.

- **Spatial Resolution:** $0.5\text{ km} - 1.0\text{ km}$ radial gate resolution.

- **Temporal Cadence:** $10 - 15\text{ minutes}$.

- **Coverage Region:** Kumaon Hills (Nainital, Almora, Pithoragarh, Champawat, Bageshwar).



### B. Surkanda Devi / Mussoorie DWR (Garhwal, Uttarakhand)

- **Location:** Surkanda Devi Peak, Tehri Garhwal ($30.41^\circ\text{N}, 78.28^\circ\text{E}$, Altitude $2,750\text{ m}$ MSL).

- **Radar Type:** X-band / C-band Doppler Weather Radar.

- **Spatial Resolution:** $0.5\text{ km} - 1.0\text{ km}$.

- **Temporal Cadence:** $10 - 15\text{ minutes}$.

- **Coverage Region:** Garhwal Hills (Dehradun, Tehri, Uttarkashi, Rudraprayag, Chamoli).



### DWR Access Classification & Status

- **Official Portal:** `https://radar.imd.gov.in/` and IMD Mausam WMS.

- **Classification:** **`E. REQUIRES AUTHORIZATION`** (IMD / Ministry of Earth Sciences Data Sharing Policy).

- **Status:** Public web services expose static rendered PNG images (MAX reflectivity, PPI, CAPPI). Direct REST API access to raw 3D float reflectivity matrices ($Z$, $\text{dBZ}$) or calibrated Rain Rate fields ($R$, $\text{mm/hr}$) requires an official MoES/IMD data-sharing agreement or institutional research credentials.



---



## 5. High-Resolution Non-Radar Alternatives



### A. ISRO MOSDAC INSAT-3DR QPE / HEOP

- **Source:** Meteorological & Oceanographic Satellite Data Archival Centre (MOSDAC / ISRO).

- **Product:** INSAT-3DR Quantitative Precipitation Estimation (QPE) & Hydro-Estimator Operational Product (HEOP).

- **Spatial Resolution:** **$4\text{ km} \times 4\text{ km}$**.

- **Temporal Cadence:** **$15\text{ minutes}$**.

- **Physical Category:** **OBSERVATION** (Geostationary Thermal IR & Vis QPE).

- **Access Status:** Publicly accessible via MOSDAC Open Data API (`https://www.mosdac.gov.in/`).



### B. IMD $0.25^\circ \times 0.25^\circ$ Gridded Daily Rainfall

- **Source:** India Meteorological Department (NDC Pune).

- **Spatial Resolution:** $0.25^\circ \times 0.25^\circ \approx 25\text{ km}$.

- **Temporal Cadence:** Daily (24h accumulation).

- **Physical Category:** **INTERPOLATED GAUGE ANALYSIS**.

- **Access Status:** Open via IMD Bharat-Data Portal.

- **Suitability for Nowcasting:** **NOT SUITABLE** (Daily accumulation only, 24h lag).



### C. ECMWF ERA5-Land Reanalysis

- **Source:** Copernicus Climate Change Service (CDS).

- **Spatial Resolution:** $0.1^\circ \approx 9\text{ km}$.

- **Temporal Cadence:** Hourly.

- **Physical Category:** **REANALYSIS** (Historical land-surface data assimilation).

- **Access Status:** Open via Copernicus CDS API.

- **Suitability for Nowcasting:** **NOT SUITABLE** (Historical reanalysis with 5-day to 2-month latency; cannot be used as real-time operational input).



---



## 6. Data-Access Constraints Summary



| Data Source | Operational Category | Access Protocol | Credentials Required? | Real-Time Latency | Classification |

| :--- | :--- | :--- | :--- | :--- | :--- |

| **NASA GPM IMERG Early** | Satellite Observation | HTTPS / `earthaccess` | Yes (Free NASA Token) | $\sim 4\text{ hours}$ | **DIRECTLY ACCESSIBLE** |

| **IMD AWS Weather Network** | Ground Station Obs | REST / WFS | No (Public GeoServer) | $\sim 1\text{ hour}$ | **DIRECTLY ACCESSIBLE** |

| **ISRO INSAT-3DR QPE** | Satellite Observation | MOSDAC REST API | Yes (Free ISRO Account) | $\sim 15\text{ minutes}$ | **ACCESSIBLE BUT LIMITED** |

| **IMD DWR Mukteshwar / Surkanda** | Ground Radar | Volumetric NetCDF / HDF5 | Yes (Official MoES License) | $\sim 10 - 15\text{ minutes}$ | **REQUIRES AUTHORIZATION** |

| **IMD 0.25° Gridded** | Interpolated Gauge | HTTP File Download | No | 24-48 hours | **HISTORICAL ONLY** |

| **ECMWF ERA5-Land** | Reanalysis | CDS API | Yes (CDS API Key) | 5 days | **HISTORICAL ONLY** |



---



## 7. Resolution Comparison Matrix



| Precipitation Source | Spatial Grid | Temporal Interval | Uttarakhand Coverage | Historical Archive | Real-Time Latency | Suitable for Nowcasting? |

| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| **NASA GPM IMERG Early (Baseline)** | 0.1° (~10 km) | 30 min | Full State (990 cells) | 2000–Present | ~4 hours | Limited (Coarse 10 km grid) |

| **IMD AWS Weather Stations** | Point Network | 1 hour | 157 Stations | 2015–Present | ~1 hour | No (Sparse point network) |

| **ISRO INSAT-3DR QPE** | **4 km $\times$ 4 km** | **15 min** | Full State | 2016–Present | **~15 min** | **FEASIBLE** (4 km grid, 15m cadence) |

| **IMD DWR Mukteshwar / Surkanda** | **0.5–1 km** | **10–15 min** | High (Garhwal & Kumaon) | Archive at IMD | **~10–15 min** | **IDEAL** (Requires MoES Authorization) |

| **IMD 0.25° Gridded** | 0.25° (~25 km) | Daily (24h) | Full State | 1901–Present | 24–48 hours | No (Daily accumulation) |

| **ECMWF ERA5-Land** | 0.1° (~9 km) | 1 hour | Full State | 1950–Present | 5 days | No (Historical reanalysis) |



---



## 8. Scientific Suitability Analysis



1. **For Immediate Operational Risk Scoring:**

   - **GPM IMERG Early ($0.1^\circ$, 30m) + IMD Station Network** provides the most reliable, fully automated, unauthenticated open data path for the Phase 4 candidate XGBoost model (34-feature contract).

2. **For Sub-Hourly Nowcasting Enhancement:**

   - **ISRO INSAT-3DR QPE ($4\text{ km}$, 15m)** provides a $2.5\times$ spatial improvement ($4\text{ km}$ vs $10\text{ km}$) and $2\times$ temporal improvement ($15\text{ min}$ vs $30\text{ min}$) over GPM, accessible via MOSDAC.

3. **For Fine-Scale Cloudburst Warning ($<1\text{ km}$):**

   - **IMD Mukteshwar & Surkanda Devi DWR ($1\text{ km}$, 10-15m)** is the gold standard for Himalayan radar nowcasting, requiring institutional MoES data partnership.



---



## 9. Production Isolation Verification



- **Candidate XGBoost Model (`candidate_flood_risk_model_phase4.joblib`):** UNCHANGED.

- **Candidate Preprocessor (`candidate_feature_preprocessor_phase4.joblib`):** UNCHANGED.

- **Candidate Feature Allowlist (`candidate_feature_allowlist_phase4.json`):** UNCHANGED (34 predictors).

- **Production Risk API (`/api/v1/risk/latest`):** UNCHANGED.

- **Risk Decision Engine:** UNCHANGED.

- **Phase 8.2 Live Rolling Data Path:** UNCHANGED.



---



## 10. Automated Test Suite Verification



```powershell

.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py"

```

**Output:** `Ran 40 tests in 2.790s — OK` (40/40 passed).



---



## 11. Final Recommendation



**`C. FUSE RADAR + GPM + IMD`**



### Rationale:

1. **Immediate Operational Path:** Retain the verified Phase 8.2 GPM IMERG + IMD station rolling pipeline for the live 34-feature XGBoost risk engine.

2. **Near-Term Enhancement:** Integrate ISRO MOSDAC INSAT-3DR QPE ($4\text{ km}$, $15\text{ min}$) to double the temporal update frequency of precipitation forcing.

3. **Long-Term Strategic Path:** Initiate an official MoES/IMD research partnership to obtain direct volumetric NetCDF feeds from the Mukteshwar and Surkanda Devi DWR radars for sub-kilometer cloudburst nowcasting.



---



## FINAL STATUS CLASSIFICATION



**`MULTI_SOURCE_HIGH_RES_PRECIPITATION_FEASIBLE`**
