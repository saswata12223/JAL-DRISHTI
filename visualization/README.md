# FlashFloodAI — Visualization Module (`visualization/`)

**Module Name:** `visualization`  
**Scope:** Reusable Geospatial Maps, Hydrodynamic Charts, and 3D Mountain Catchment Models  
**Lead Developer Role:** Geospatial Visualization / WebGL Engineer  

---

## 1. Purpose & Scope

The `visualization/` module provides modular, reusable visualization components for rendering high-dimensional geospatial datasets, hydrographs, and 3D terrain models across Uttarakhand.

### Core Visualization Capabilities:
1. **Geospatial Map Layers**: Vector tile shaders and GeoJSON renderers for 0.1° risk grid cells, river network channels, and CWC gauge markers (Deck.gl / Leaflet / MapLibre).
2. **Dynamic Hydrograph Charts**: Dual-axis time-series charts rendering simulated/observed river stage against CWC Warning Level, Danger Level, and Highest Flood Level (HFL) thresholds (Chart.js / D3.js).
3. **ML Explainability Visualizers**: Radar charts, horizontal bar contribution plots, and decision tree pathway visualizers.
4. **3D Mountain Catchment Models**: Three.js / Cesium WebGL rendering of high-altitude Himalayan valleys (e.g. Kedarnath, Chamoli, Alaknanda) with elevation shading, stream channels, and flood inundation wavefronts.

---

## 2. Directory Structure

```text
visualization/
├── geospatial/              # Deck.gl / Leaflet layer wrappers and colormaps
│   ├── risk_layer.js        # Dynamic color-interpolated grid cell polygon layer
│   ├── gauge_markers.js     # Pulsing CWC alert stage markers (Yellow/Orange/Red)
│   └── colormaps.json       # Scientific perceptually uniform color palettes (Viridis, Turbo)
├── charts/                  # Reusable D3 / Chart.js chart components
│   ├── hydrograph_chart.js  # River level vs warning/danger/HFL threshold lines
│   ├── rainfall_bar.js      # Hyetograph (30m, 1h, 3h hyetographs)
│   └── feature_importance.js# Top 15 predictor ranking waterfall chart
├── terrain_3d/              # WebGL / Three.js 3D Himalayan catchment rendering
│   ├── dem_mesh_builder.js  # Converts SRTM 90m GeoTIFF into 3D terrain geometry
│   └── water_flow_shader.glsl # Custom fragment shader for flood wave propagation
└── README.md                # This document
```

---

## 3. Inputs & Data Dependencies

- **Rasters**: `data/processed/standardized/unified_static_features.tif` (DEM, Slope, Streams)
- **Feature Tables**: `data/processed/ml/risk_timeseries.parquet`
- **GeoJSON**: `data/processed/risk/flood_thresholds.geojson`, `data/processed/standardized/standardized_historical_events.geojson`

---

## 4. Upstream & Downstream Dependencies

- **Upstream Modules**: `pipelines/` (geospatial rasters), `ml/` (feature importance manifests).
- **Downstream Modules**: `frontend/` (embeds visualization components in React views).
