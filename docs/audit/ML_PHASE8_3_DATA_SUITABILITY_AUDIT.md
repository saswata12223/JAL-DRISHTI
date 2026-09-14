# ML Phase 8.3 — Precipitation Data Suitability Audit for pySTEPS Nowcasting



## 1. Executive Summary



This audit evaluates the spatial, temporal, and physical properties of precipitation datasets present in the Jal Drishti platform repository to determine their suitability for optical-flow and advection-based precipitation nowcasting using pySTEPS.



---



## 2. Dataset Inventory & Provenance



| Property | NASA GPM IMERG Early (`GPM_3IMERGHHE`) | IMD Weather Station Ingest |

| :--- | :--- | :--- |

| **Data Directory** | `data/raw/` (124 NetCDF-4 granules) | `data/raw/imd/` & `data/processed/standardized/` |

| **Physical Quantity** | Instantaneous Calibrated Precipitation Rate (`mm/hr`) | Accumulated Rain Depth at Stations (`mm`) |

| **Observation Type** | Multi-satellite passive microwave & IR retrieval | Ground weather stations (157 points) |

| **Spatial Format** | 2D Regular Grid (`lon`, `lat`) | Irregular Point Locations |

| **Spatial Resolution** | 0.1° $\times$ 0.1° (~10 km $\times$ 10 km grid) | Point measurements |

| **Spatial Bounding Box** | West: 77.8°E, East: 81.1°E, South: 28.5°N, North: 31.5°N | Uttarakhand State boundaries |

| **Grid Dimensions** | 33 Longitudes $\times$ 30 Latitudes (990 grid cells) | N/A |

| **Temporal Resolution** | 30 minutes (half-hourly) | Hourly / Daily updates |

| **Time Window** | 2026-08-29 00:00:00 UTC to 2026-08-31 13:30:00 UTC | Operational latest |

| **Consecutive Frames** | **124 continuous half-hourly frames** | Irregular temporal sampling |

| **Data Gaps** | **0 gaps** (strictly continuous 30-minute interval) | Intermittent telemetry availability |

| **Peak Observed Rate** | **25.60 mm/hr** (Real monsoon storm event) | Variable station observations |

| **Mean Observed Rate** | 0.4549 mm/hr | Variable |

| **Data Authenticity** | Real NASA Earthdata retrieval (`earthaccess` API) | Real IMD GeoServer retrieval |



---



## 3. Detailed Data Lineage & Grid Mechanics



1. **Grid Orientation:** GPM IMERG V07 native HDF5 dimensions `(longitude, latitude)` are subsetted to Uttarakhand coordinates ($77.85^\circ\text{E} \dots 81.05^\circ\text{E}$ and $28.55^\circ\text{N} \dots 31.45^\circ\text{N}$).

2. **Temporal Alignment:** The 124 granules form a 3D matrix `precipitation[time, lon, lat]` shaped `(124, 33, 30)` with a constant $\Delta t = 30\text{ minutes}$.

3. **Data Completeness:** 100% frame availability across the 61.5-hour continuous period.



---



## 4. Assessment of Suitability for pySTEPS



- **Grid Regularity:** **SUITABLE** (Uniform 0.1° WGS84 grid).

- **Temporal Regularity:** **SUITABLE** (Strict 30-min timestep without missing frames).

- **Sequence Length:** **SUITABLE** (124 frames exceeds the minimum 3–4 frame requirement for advection estimation).

- **Physical Values:** **SUITABLE** (Calibrated precipitation rates in mm/hr).

- **Native Horizon Limit:** Native resolution is 30 minutes. Forecast horizons evaluated will be **+30 min** (1 step ahead) and **+60 min** (2 steps ahead), with interpolated **+15 min** and **+45 min** evaluation.



---



## 5. Audit Conclusion



The NASA GPM IMERG Early 3D sequence (`124` frames, 30-min interval, 0.1° grid) provides a real, continuous, and scientifically valid input sequence for pySTEPS nowcasting experiments.
