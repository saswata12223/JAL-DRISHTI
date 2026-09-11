# FlashFloodAI — Data Sources & Ingestion Reference

**Target Geographic Region:** Uttarakhand, India  
**Bounding Box:**  
- West: `77.8° E`  
- East: `81.1° E`  
- South: `28.5° N`  
- North: `31.5° N`  

---

## 1. Data Source Inventory

| Variable Category | Primary Source | Product / Service | Access Protocol | Ingestion Script | Cadence / Dynamic Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Rainfall** | NASA Earthdata | GPM IMERG Early (`GPM_3IMERGHHE` v07) | HTTPS / `earthaccess` CMR | `scripts/gpm_auto_ingest.py` | Half-hourly (Dynamic) | **COMPLETE (Phase 1A)** |
| **Weather** | India Meteorological Department (IMD) | IMD AWS, SYNOP, METAR, MC Dehradun Nowcast | HTTPS / GeoServer WFS (`EPSG:4326`) | `scripts/imd_ingest.py` | Hourly / Multi-hourly (Dynamic) | **COMPLETE (Phase 1B)** |
| **Soil Moisture** | NASA Earthdata | SMAP Enhanced L3/L4 (`SPL3SMP_E` / `SPL4SMGP`) | HTTPS / `earthaccess` CMR / HDF5 / NetCDF | `scripts/smap_ingest.py` | Periodic (Daily / 1–3 days) | **COMPLETE (Phase 1C)** |
| **Elevation** | NASA / USGS | SRTM 90m DEM (v4.1) / SRTM 30m | GeoTIFF / NetCDF | `scripts/dem_ingest.py` | Static (Loaded once) | **COMPLETE (Phase 1D)** |
| **Terrain Features** | Derived from SRTM DEM | Slope, Flow Accumulation, TWI, Drainage Network | Python / `rasterio` / `numpy` | `scripts/terrain_features.py` | Static (Derived once) | **COMPLETE (Phase 1E)** |
| **Land Cover** | ESA / ISRO | Sentinel-2 10m LULC (ESA WorldCover v200) | GeoTIFF / NetCDF | `scripts/landcover_ingest.py` | Slow-changing (Annual) | **COMPLETE (Phase 1F)** |
| **Water Level** | CWC / India-WRIS | River Gauge Stations (Ganga, Alaknanda, Bhagirathi, etc.) | HTTPS REST / Official CWC Station Network | `scripts/waterlevel_ingest.py` | Real-time / Daily | **COMPLETE (Phase 1G)** |
| **Historical Events** | GSI / CWC / NDMA / USDMA | Verified Disaster & Flash Flood Catalog | CSV / JSON / GeoJSON | `scripts/historical_events.py` | Historical Ground Truth | **COMPLETE (Phase 1H)** |

---

## 2. Ingestion Details: IMD Weather (Phase 1B)

### Endpoints
- **GeoServer WFS Gateway**: `https://reactjs.imd.gov.in/geoserver/wfs`
- **Layers Ingested**:
  - `imd:aws_data_layer` — Automatic Weather Stations across India
  - `imd:synop_data_layer` — Synoptic Weather Stations
  - `imd:metar_data_layer` — Aviation Meteorological Stations (Airports)
  - `imd:mcwise_station_nowcast_view` — Meteorological Centre Dehradun Station Nowcasts

### Variables & Standard Units
- **Station Coordinates**: Latitude (°N), Longitude (°E) in EPSG:4326
- **Temperature**: Dry bulb, Min, Max in Degrees Celsius (°C)
- **Relative Humidity**: Percentage (`%`, range 0–100)
- **Wind Speed**: Converted to kilometers per hour (`km/h`) and meters per second (`m/s`)
- **Wind Direction**: Meteorological degrees (0°–360°)
- **Atmospheric Pressure**: Mean Sea Level Pressure in hectopascals (`hPa`), filtered to standard range (850–1085 hPa)
- **Rainfall**: Accumulated station rainfall depth in millimeters (`mm`)

### Data Freshness Categorization
- `LIVE`: Observation age $\le$ 3 hours from acquisition time.
- `RECENT`: Observation age between 3 and 24 hours.
- `STALE`: Observation age $>$ 24 hours (inactive or non-transmitting station).
- `UNAVAILABLE`: Station coordinate exists but observation values are missing/offline.

---

## 3. Ingestion Details: NASA SMAP Soil Moisture (Phase 1C)

### Endpoints & Products
- **Primary NSIDC Product**: `SPL3SMP_E` Version 006 (SMAP Enhanced Level-3 Radiometer Global Daily 9 km EASE-Grid Soil Moisture) and `SPL4SMGP` Version 007 via NASA Earthdata CMR (`earthaccess`).
- **Observation Service**: NASA Open Earth Science Observation and Assimilation Services for Uttarakhand river basins.

### Variables & Standard Units
- **Surface Soil Moisture (`surface_soil_moisture`)**: Volumetric fraction (0.0 to 1.0) / $\text{m}^3\,\text{m}^{-3}$ at 0–5 cm depth.
- **Rootzone Soil Moisture (`rootzone_soil_moisture`)**: Volumetric fraction (0.0 to 1.0) / $\text{m}^3\,\text{m}^{-3}$ at 0–100 cm depth.
- **Profile Soil Moisture (`profile_soil_moisture`)**: Profile wetness index.

### Spatial-Temporal Grid
- **Spatial Bounds**: `77.85°E` to `81.05°E`, `28.55°N` to `31.45°N` (33 Lon × 30 Lat = 990 grid cells, 0.1° resolution matching GPM rainfall grid).
- **Temporal Resolution**: Daily steps.

---

## 4. Ingestion Details: SRTM Elevation DEM (Phase 1D)

### Endpoints & Products
- **Product**: NASA / USGS Shuttle Radar Topography Mission (SRTM) 90m Digital Elevation Model (v4.1).
- **Source Provider**: CGIAR-CSI / NASA JPL / USGS.
- **Raw Tile Archives**: `srtm_52_06.zip`, `srtm_53_06.zip`, `srtm_52_07.zip`, `srtm_53_07.zip`.

### Spatial & Vertical Characteristics
- **Coordinate Reference System (CRS)**: `EPSG:4326` (WGS 84).
- **Spatial Bounds**: `77.8°E` to `81.1°E`, `28.5°N` to `31.5°N`.
- **Dimensions**: 3,961 Columns (Lon) × 3,600 Rows (Lat) = 14,259,600 pixels.
- **Spatial Resolution**: 0.0008333° (~90 meters).
- **Vertical Units**: Meters (`m`) above Mean Sea Level.
- **Topographic Range**: Minimum = 142.0 m (Haridwar plains), Maximum = 7512.0 m (Garhwal Himalayan massifs), Mean = 2244.15 m.

---

## 5. Ingestion Details: Derived Terrain Features (Phase 1E)

### Layers & Formats
- **Multi-Band Raster**: `data/processed/terrain/terrain_features.tif` (5-band GeoTIFF, EPSG:4326).
- **NetCDF Dataset**: `data/processed/terrain/terrain_features.nc`.
- **Variables**:
  1. `slope`: Topographic Slope Angle in degrees ($0.0^\circ - 80.72^\circ$, Mean = $15.96^\circ$).
  2. `flow_direction`: Standard D8 steepest downward descent directional code ($1, 2, 4, 8, 16, 32, 64, 128$).
  3. `flow_accumulation`: Total upslope contributing area in pixel units ($1 - 13,771\text{ cells}$).
  4. `stream_network`: Binary stream drainage channel mask ($70,024\text{ stream pixels}$).
  5. `twi`: Topographic Wetness Index $\ln(a / \tan\beta)$ ($2.56 - 19.07$, Mean = $7.49$).

---

## 6. Ingestion Details: Sentinel-2 Land Cover (Phase 1F)

### Endpoints & Products
- **Product**: ESA WorldCover 2021 10m Land Cover (Version 200).
- **Constellation**: European Space Agency (ESA) Sentinel-1 (C-band SAR) & Sentinel-2 (Multi-Spectral Instrument MSI).
- **Source Provider**: European Space Agency (ESA) / VITO Remote Sensing / AWS Open Data.
- **Product Accuracy**: Authentic ESA WorldCover 2021 dataset (official global overall accuracy of 76.7% for v200 as validated against independent reference datasets by ESA/VITO). Zero synthetic land-cover data were generated.
- **Tiles Ingested**: `N27E078`, `N30E078`, `N27E075`, `N30E075`, `N27E081`, `N30E081` (6 raw GeoTIFF tiles).

### Spatial Harmonization & Resampling
- **Native Resolution**: 10 meters ($0.00008333^\circ$).
- **Processed Grid Resolution**: ~90 meters ($0.0008333^\circ$, $3,961\text{ Lons} \times 3,600\text{ Lats} = 14,259,600\text{ pixels}$, `EPSG:4326`).
- **Resampling Method**: Nearest Neighbor (`rasterio.warp.Resampling.nearest`) to preserve discrete categorical class identity without creating artificial interpolated intermediate values.

### Class Coverage (10 Classes Present in Uttarakhand, Class 95 = 0 Pixels)
Of the 11 official ESA WorldCover classes, exactly 10 are present within the Uttarakhand study area. Class 95 (Mangroves) is absent due to inland Himalayan geography:
1. `Class 10` — Tree cover / Forest: $5,836,639\text{ px}$ ($40.9313\%$)
2. `Class 20` — Shrubland: $16,188\text{ px}$ ($0.1135\%$)
3. `Class 30` — Grassland / Alpine Meadow: $2,018,455\text{ px}$ ($14.1551\%$)
4. `Class 40` — Cropland: $2,372,966\text{ px}$ ($16.6412\%$)
5. `Class 50` — Built-up / Urban: $199,128\text{ px}$ ($1.3964\%$)
6. `Class 60` — Bare / sparse vegetation: $2,360,028\text{ px}$ ($16.5505\%$)
7. `Class 70` — Snow and Ice: $744,072\text{ px}$ ($5.2180\%$)
8. `Class 80` — Permanent water bodies: $83,439\text{ px}$ ($0.5851\%$)
9. `Class 90` — Herbaceous wetland: $6,116\text{ px}$ ($0.0429\%$
10. `Class 100` — Moss and lichen: $622,569\text{ px}$ ($4.3660\%$)
11. `Class 95` — Mangroves: **$0\text{ px}$ ($0.0000\%$)** (verified absent in Uttarakhand)

### Hydrological Parameters (Deterministic Lookup Models)
The parameters `runoff_coefficient` and `mannings_roughness` are **deterministic engineering/model parameters** assigned from documented hydrological lookup assumptions based on LULC class, and are **not** raw satellite measurements:
- **Runoff Potential Coefficient ($C$, range 0.0–1.0)**: Assigned from standard catchment yield tables (USDA NRCS NEH Part 630 / ASCE Guidelines).
- **Manning's Surface Roughness ($n$, range 0.015–0.120 $\text{s/m}^{1/3}$)**: Assigned from open-channel rough-bed hydraulics lookup tables (Ven Te Chow, 1959).

---

## 7. Ingestion Details: River Water Level & Gauge Data (Phase 1G)

### Endpoints & Source
- **Primary Source**: Central Water Commission (CWC) / Ministry of Jal Shakti, Government of India.
- **Portals & Gateways**:
  - CWC Flood Forecasting System (FFS): `https://ffs.india-water.gov.in/`
  - CWC Daily Flood Situation Report: `https://cwc.gov.in/daily-flood-situation-report-cum-advisory`
- **Network Organisation**: CWC Upper Ganga Basin Organisation (UGBO, Dehradun).

### Station Network & Coverage
- **Total Stations Monitored**: 20 official CWC river gauge stations across Uttarakhand.
- **Key River Basins Covered**:
  1. **Alaknanda**: Joshimath (Marwari), Nandprayag, Karanprayag, Rudraprayag, Srinagar.
  2. **Bhagirathi**: Uttarkashi, Tehri (Zero Point / Reservoir).
  3. **Mandakini**: Kund (Guptkashi), Rudraprayag confluence.
  4. **Ganga**: Devprayag (Alaknanda-Bhagirathi confluence), Rishikesh, Haridwar (Bhimgoda Barrage).
  5. **Yamuna & Tons**: Dakpathar (Yamuna), Kalsi (Hari-ki-Doon / Tons).
  6. **Kali / Saryu / Sharda**: Dharchula, Jauljibi, Jhoolaghat, Pancheshwar, Banbasa (Sharda Barrage), Bageshwar.
  7. **Western Ramganga**: Chaukhutia.

### Hydrological Thresholds & Datum
- **Warning Level Range**: $220.50\text{ m}$ to $1,378.00\text{ m}$ above MSL.
- **Danger Level Range**: $221.70\text{ m}$ to $1,380.00\text{ m}$ above MSL.
- **Highest Flood Level (HFL)**: $223.20\text{ m}$ to $1,383.50\text{ m}$ above MSL.
- **Units**: Meters (`m`) above Mean Sea Level.

### Quality Control & Zero-Fake Data Rules
- No artificial, mock, or synthetic water levels are generated.
- Offline telemetry is explicitly marked as `NaN` / `null` with descriptive status strings (`TELEMETRY_OFFLINE`), rather than filled with fake zero values.
- Point gauge locations preserved natively without artificial spatial grid interpolation.

---

## 8. Ingestion Details: Historical Flood Events Catalog (Phase 1H)

### Authoritative Sources
- **Primary Agencies**:
  - Geological Survey of India (GSI) — Landslide & Flash Flood Hazard Monograph Series
  - National Disaster Management Authority (NDMA) & Uttarakhand State Disaster Management Authority (USDMA) — Official Post-Disaster Damage Assessments
  - India Meteorological Department (IMD) — High-Impact Monsoon Weather Reports
  - Central Water Commission (CWC) — Inundation & Dam Breach Bulletins
  - Wadia Institute of Himalayan Geology (WIHG) & ISRO-NRSC Disaster Management Support Programme
  - Peer-reviewed geoscientific disaster analyses (e.g., Shugar et al. 2021, Martha et al. 2015)

### Catalog Scope & Event Taxonomy
- **Total Canonical Events**: 15 verified catastrophic & major flood disasters ($1970–2024$).
- **Taxonomy Categories**:
  1. `cloudburst-induced flood` (e.g., Asi Ganga 2012, Bastadi 2016, Arakot 2019, Maldevta 2022, Kedar Valley 2024)
  2. `flash flood` (e.g., Alaknanda 1970, Gaurikund 2023, Kotdwar 2023)
  3. `glacial lake outburst flood (GLOF)` (e.g., Kedarnath / Chorabari Lake 2013)
  4. `debris-flow/flood event` (e.g., Malpa 1998, Okhimath 1998, Chamoli / Rishi Ganga 2021)
  5. `extreme rainfall flood` (e.g., Haridwar/Uttarakhand 2010, Kumaon/Nainital 2021)

### Standardized Formats & Schema
- **Tabular Catalog**: `data/processed/events/historical_flood_events.csv`
- **JSON Registry**: `data/processed/events/historical_flood_events.json`
- **Spatial GeoJSON**: `data/processed/events/historical_flood_events.geojson`
- **Zero Synthetic Rule**: 100% of event records are backed by official agency reports and published literature; missing parameters are stored strictly as `null` / `NaN`.

---

## 9. Storage Architecture

```
data/
├── raw/
│   ├── gpm/ (or data/raw/*.nc4)
│   ├── imd/
│   │   └── imd_raw_observations_YYYYMMDD_HHMMSSZ.json
│   ├── smap/
│   │   └── smap_soil_moisture_raw_YYYYMMDD_HHMMSSZ.json
│   ├── srtm/
│   │   ├── srtm_52_06.tif (.zip, .hdr, .tfw)
│   │   ├── srtm_53_06.tif (.zip, .hdr, .tfw)
│   │   ├── srtm_52_07.tif (.zip, .hdr, .tfw)
│   │   └── srtm_53_07.tif (.zip, .hdr, .tfw)
│   ├── landcover/
│   │   ├── ESA_WorldCover_10m_2021_v200_N27E075_Map.tif
│   │   ├── ESA_WorldCover_10m_2021_v200_N27E078_Map.tif
│   │   ├── ESA_WorldCover_10m_2021_v200_N27E081_Map.tif
│   │   ├── ESA_WorldCover_10m_2021_v200_N30E075_Map.tif
│   │   ├── ESA_WorldCover_10m_2021_v200_N30E078_Map.tif
│   │   └── ESA_WorldCover_10m_2021_v200_N30E081_Map.tif
│   ├── waterlevel/
│   │   └── cwc_water_level_raw_YYYYMMDD_HHMMSSZ.json
│   └── events/
│       └── authoritative_event_sources.json
└── processed/
    ├── rainfall/ (or data/processed/gpm_combined.nc, rainfall_features.nc)
    ├── weather/
    │   ├── imd_weather_stations.csv
    │   └── imd_weather_latest.json
    ├── smap/
    │   ├── smap_soil_moisture.nc
    │   └── smap_soil_moisture_latest.json
    ├── srtm/
    │   ├── srtm_uttarakhand_dem.tif
    │   ├── srtm_uttarakhand_dem.nc
    │   └── srtm_dem_metadata.json
    ├── terrain/
    │   ├── terrain_features.tif
    │   ├── terrain_features.nc
    │   └── terrain_features_metadata.json
    ├── landcover/
    │   ├── landcover_uttarakhand.tif
    │   ├── landcover_uttarakhand.nc
    │   └── landcover_metadata.json
    ├── waterlevel/
    │   ├── cwc_water_level_stations.csv
    │   └── cwc_water_level_latest.json
    └── events/
        ├── historical_flood_events.csv
        ├── historical_flood_events.json
        └── historical_flood_events.geojson
```
