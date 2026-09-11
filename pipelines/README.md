# FlashFloodAI — Data Pipelines Module (`pipelines/`)

**Module Name:** `pipelines`  
**Primary Phases:** Phases 1A–1H (Ingestion), Phase 2 (Standardization), Phase 3 (Features), Phase 4 (Thresholds)  
**Lead Developer Role:** Data Engineer / Geospatial Hydrologist  

---

## 1. Purpose & Scope

The `pipelines/` module is the scientific and geospatial backbone of FlashFloodAI. It ingests raw multi-sensor Earth observations and government telemetry, aligns disparate temporal and spatial scales into standardized grids, and computes physically grounded hydrodynamic indices.

### Core Pipelines:
1. **`ingestion/`**: Ingestion scripts for NASA GPM IMERG, IMD meteorological stations, NASA SMAP soil moisture, SRTM 90m DEM, ESA WorldCover 10m LULC, CWC river gauge stations, and official disaster catalogs.
2. **`standardization/`**: High-resolution static 90m grid and 0.1° dynamic atmospheric grid standardization under `EPSG:4326`.
3. **`features/`**: Computation of Topographic Wetness Index (TWI), Stream Power Index (SPI), Sediment Transport Index (STI), Topographic Runoff Potential (TRP), Flash Flood Susceptibility Index (FFSI), Soil Saturation Index (SSI), and Antecedent Precipitation Index (API).
4. **`thresholds/`**: Derivation and verification of official Central Water Commission Warning Level, Danger Level, and Highest Flood Level (HFL) exceedances.

---

## 2. Directory Structure

```text
pipelines/
├── ingestion/               # Raw satellite, telemetry, and catalog ingest pipelines
├── standardization/         # Spatial-temporal grid alignment (Phase 2)
├── features/                # Multimodal hydrodynamic and moisture indices (Phase 3)
├── thresholds/              # Official CWC government flood threshold engine (Phase 4)
└── README.md                # This document
```

---

## 3. Inputs & Authoritative Data Sources

- **NASA GPM IMERG Early v07**: Half-hourly gridded precipitation (`0.1°`).
- **IMD Weather Stations**: 157 monitored Uttarakhand surface meteorological stations.
- **NASA SMAP L4**: Surface (0–5 cm) and rootzone (0–100 cm) volumetric soil moisture.
- **SRTM DEM 90m**: Seamless elevation raster across Uttarakhand bounds.
- **ESA WorldCover 10m**: Sentinel-2 derived categorical land-cover classes.
- **CWC / India-WRIS**: 20 river gauge telemetry stations and official flood thresholds.
- **GSI / NDMA / USDMA**: 15 canonical historical flood disaster event records (1970–2024).

---

## 4. Outputs & Standardized Artifacts

- `data/processed/standardized/unified_static_features.nc` & `.tif` (14.2M pixels)
- `data/processed/standardized/standardized_dynamic_atmosphere.nc` (33 $\times$ 30 $\times$ 8)
- `data/processed/features/multimodal_static_features.nc` & `.tif` (13 static bands)
- `data/processed/features/multimodal_dynamic_features.nc` (13 dynamic layers)
- `data/processed/risk/flood_thresholds.parquet` & `flood_risk_features.parquet`

---

## 5. How to Run Pipeline Steps

```powershell
# Activate virtual environment
& "C:\FlashFloodAI\.venv\Scripts\Activate.ps1"

# Run Data Standardization (Phase 2):
python scripts/standardize.py

# Run Multimodal Feature Extraction (Phase 3):
python scripts/multimodal_features.py

# Run CWC Flood Threshold Engine (Phase 4):
python scripts/flood_thresholds.py
```

---

## 6. Upstream & Downstream Dependencies

- **Upstream Sources**: External NASA, IMD, ESA, and CWC data endpoints.
- **Downstream Modules**: `ml/` (consumes standardized feature tables), `backend/` (reads threshold and station GeoJSONs).
