# SIH26192-Singularity — Frontend Module (`frontend/`)

**Module Name:** `frontend`  
**Primary Phase:** Phase 8 (Interactive Web Dashboard Application)  
**Lead Developer Role:** Frontend / UI Engineer  

---

## 1. Purpose & Scope

The `frontend/` module delivers a modern, rich web dashboard interface for monitoring real-time flash flood hazards across Uttarakhand. Key views include:
- **Statewide Geo-Risk Map**: Interactive tile layers rendering gridded risk levels (LOW, MODERATE, HIGH, EXTREME) and catchment boundaries.
- **CWC River Gauge Hydrograph Panel**: Gauge status, live/offline indicators, and Warning/Danger/HFL stage exceedances.
- **Atmospheric & Soil Moisture Overlays**: GPM IMERG half-hourly rainfall heatmaps and SMAP soil saturation grids.
- **Historical Event Explorer**: Interactive timeline and spatial mapping of the 15 canonical Uttarakhand disaster events (1970–2024).
- **ML Explainability Inspector**: Feature contribution waterfall charts showing why a catchment is at risk.

---

## 2. Directory Structure

```text
frontend/
├── public/                  # Static assets, GeoJSON catchment boundaries, icons
├── src/
│   ├── assets/              # Images, branding, CSS styles
│   ├── components/
│   │   ├── layout/          # Navbar, Sidebar, Footer, AlertBanner
│   │   ├── map/             # Leaflet / MapLibre interactive map container & layers
│   │   ├── hydrographs/     # River gauge level vs Warning/Danger charts
│   │   ├── risk_metrics/    # Statewide summary cards & gauge indicators
│   │   ├── explainability/  # Top feature importance & radar charts
│   │   └── historical/      # Disaster timeline & event replay
│   ├── services/
│   │   ├── api.js           # Axios / Fetch client connecting to backend/ (Port 8000)
│   │   └── websocket.js     # Real-time WebSocket connection for live alerts
│   ├── store/               # State management (Zustand / Redux)
│   ├── App.jsx              # Main dashboard application
│   └── main.jsx             # React DOM entry point
├── package.json             # NPM dependencies (React, Vite, TailwindCSS, Lucide, Chart.js)
├── vite.config.js           # Vite build & development proxy configuration
└── README.md                # This document
```

---

## 3. Inputs & Data Dependencies

The frontend consumes data exclusively through HTTP REST and WebSocket APIs exposed by `backend/`:
- `GET /api/v1/risk/current`
- `GET /api/v1/risk/timeseries`
- `GET /api/v1/gauges`
- `GET /api/v1/events`
- `WS /api/v1/alerts/live`

---

## 4. How to Run (Phase 8 Development)

```powershell
# Navigate to frontend directory
cd C:\FlashFloodAI\frontend

# Install dependencies
npm install

# Launch Vite development server
npm run dev
```
The dashboard interface will be accessible at `http://localhost:5173`.

---

## 5. Upstream & Downstream Dependencies

- **Upstream Modules**: `backend/` (data API), `visualization/` (reusable map & 3D chart components).
- **Downstream Modules**: End-user emergency management operators, disaster managers (USDMA/NDMA), public warning dashboards.
