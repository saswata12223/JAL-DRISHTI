# JAL DRISHTI — PHASE FRONTEND VISUAL DIFF REPORT

**Date:** 2026-09-24  
**Frontend URL:** http://localhost:5173 (Vite dev server, port confirmed active)  
**Build result:** ✅ Exit 0 — 1465 modules, 0 errors (Vite 5.4.21)  
**Pytest result:** ✅ 16/16 tests passed (Phase 16 + Phase 17 + Phase 18 GIS suites)

---

## 1. ACTIVE FRONTEND ENTRY POINT

```
frontend/src/main.jsx → App.jsx → React Router
Routes:
  /               → LandingPage (public)
  /login          → LoginPage (public)
  /dashboard      → DashboardPage (protected)
  /immediate-actions → ImmediateActionsPage (protected)
  /analytics      → AnalyticsPage (protected)
  /monitoring     → StationMonitoringPage (protected)
  /live-forecast  → LiveForecastPage (protected)
  /flood-simulation → FloodSimulationPage (protected)
  /alerts         → AlertsManagementPage (protected)
  /historical-events → HistoricalEventsPage (protected)
  /about          → AboutPage (public)
  /resources      → ResourcesPage (public)
```

---

## 2. PAGES AND COMPONENTS INSPECTED

- `frontend/src/App.jsx`
- `frontend/src/layouts/AppLayout.jsx`
- `frontend/src/layouts/Header.jsx`
- `frontend/src/layouts/Footer.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/pages/AnalyticsPage.jsx`
- `frontend/src/pages/RiskMapPage.jsx`
- `frontend/src/pages/LiveForecastPage.jsx`
- `frontend/src/components/decision/DecisionIntelligenceCard.jsx`
- `frontend/src/components/map/RiskOverviewMap.jsx`
- `frontend/src/components/map/SelectedLocationCard.jsx`
- `frontend/src/services/modelIntelligenceService.js`
- `frontend/src/services/gisService.js`
- `frontend/src/services/analyticsService.js`

---

## 3. VISUAL DIFFERENCES FOUND

| # | Location | Defect Found |
|---|---|---|
| 1 | `AnalyticsPage.jsx:789,812` | **CRITICAL**: `null.spatial_id` — TypeError crash on page load |
| 2 | `DecisionIntelligenceCard` | Label "Risk Fall" violates Phase 10 mandate — must be "Model Probability" |
| 3 | `DecisionIntelligenceCard` | Defaults `0.94`, `'HIGH'`, `'EXTREME'` — fabricated values on load |
| 4 | `DecisionIntelligenceCard` | No null/loading state — rendered fake data while loading |
| 5 | `DecisionIntelligenceCard` | No historical vs live label |
| 6 | `RiskOverviewMap` popup | `Risk: EXTREME (94%)` — wrong terminology, suggests flood probability |
| 7 | `RiskOverviewMap` region badge | Hardcoded `Uttarakhand` only — no pan-India context |
| 8 | `RiskOverviewMap` recenter | Reset view to `[30.15, 79.2]` Uttarakhand — not India bounds |
| 9 | `Header.jsx` brand link | Linked to `/dashboard` not `/` (landing page) |
| 10 | `Header.jsx` brand | Logo only — no visible "Jal Drishti" text |
| 11 | `Header.jsx` default | `lastUpdated = '01:32 AM IST'` — hardcoded fake timestamp |
| 12 | `AppLayout.jsx` default | `activeAlertsCount = 2` — fabricated alert count on load |
| 13 | `AppLayout.jsx` default | `lastUpdated = '01:32 AM IST'` — hardcoded fake timestamp |
| 14 | `Footer.jsx` | 140+ blank lines at top — file corruption |
| 15 | `Footer.jsx` | Missing map tile attribution (OSM, CARTO, SOI required) |
| 16 | `Footer.jsx` | No data source availability status |
| 17 | `LiveForecastPage.jsx` | `district: st.district || 'Uttarakhand'` — false geographic scope |
| 18 | `analyticsService.js` | `district = st?.district || 'Uttarakhand'` — false geographic scope |
| 19 | `analyticsService.js` | `resolveBasin() || 'Uttarakhand Catchment'` — false geographic scope |
| 20 | `gisService.js` | Missing `listAdminRegions()` for pan-India selector |

---

## 4. COMPONENTS MODIFIED

| File | Type | Summary of Change |
|---|---|---|
| `AnalyticsPage.jsx` | Bug fix | `null.spatial_id` → `null` (×2) |
| `Header.jsx` | Fix + Feature | Brand → `/`, added "Jal Drishti" text, fixed default timestamp |
| `AppLayout.jsx` | Fix | Fake defaults → `0` / `'Unavailable'` |
| `Footer.jsx` | Rewrite | Removed 140 blank lines; added OSM+CARTO+SOI attribution; OWM/CWC/IMD status badges |
| `DecisionIntelligenceCard.jsx` | Rewrite | "Model Probability*" label; null-safe; loading skeleton; historical disclaimer; ML firewall |
| `RiskOverviewMap.jsx` | Fix | "Historical Output" badge; India recenter; "Model Probability*" popup label |
| `DashboardPage.jsx` | Fix | Null initial defaults; adminContext in alert-based update |
| `RiskMapPage.jsx` | Feature | Async GIS enrichment on station click |
| `gisService.js` | Feature | Added `listAdminRegions()`; updated schema |
| `LiveForecastPage.jsx` | Fix | Removed `'Uttarakhand'` hardcode |
| `analyticsService.js` | Fix | Removed `'Uttarakhand'` hardcodes (×2) |

---

## 5. APIs/DATA SOURCES USED

| Endpoint | Status | Used For |
|---|---|---|
| `GET /api/v1/ml/decisions` | ✅ Historical calibrated reference | Model Probability, Risk Class |
| `GET /api/v1/stations/` | ✅ PostgreSQL DB | Station markers |
| `GET /api/v1/risk/summary` | ✅ Backend DB | KPI cards |
| `GET /api/v1/risk/alerts` | ✅ Backend DB | Alert count, selected location |
| `GET /api/v1/gis/admin/resolve` | ✅ SOI GeoJSON | Admin context per coordinate |
| `GET /api/v1/gis/admin/regions` | ✅ SOI inventory | Pan-India state list |
| `GET /api/v1/gis/admin/boundaries` | ✅ SOI simplified GeoJSON | India state outlines |
| OpenWeatherMap (via proxy) | ✅ Verified live | Live weather on LiveForecastPage |
| CWC telemetry | ❌ UNAVAILABLE | — |
| IMD | ❌ NOT_CONFIGURED | — |

---

## 6. FEATURES THAT REMAIN UNAVAILABLE

| Feature | Status | Reason |
|---|---|---|
| Live ML inference | Blocked | `BLOCKED_LIVE_TELEMETRY` per Phase 17 |
| CWC real-time gauges | Unavailable | No verified API source |
| IMD precipitation | Not configured | No API key/endpoint |
| GPM satellite | Historical only | No live feed connected |
| Pan-India district selector UI | Partial | Backend API ready; frontend dropdown not yet built |

---

## 7. EVIDENCE: NO SYNTHETIC DATA INTRODUCED

- `DecisionIntelligenceCard` props all default to `null` — shows `—` or loading state
- `AppLayout` starts `activeAlertsCount=0` — badge appears only after real API response
- `AppLayout` starts `lastUpdated='Unavailable'` — real time shown only after API success
- `DashboardPage` initial selectedLocation: `mlProbability: null` — no 94% on cold load
- All `'Uttarakhand'` string fallbacks replaced with `st.state || 'Unknown'`
- No new station records, rainfall values, or risk scores were created
- `.joblib` ML artifacts: unmodified (SHA-256 unchanged)
- `data/raw/`: unmodified

---

## 8. PYTEST RESULTS

```
tests/test_phase_pan_india_gis.py::test_01 PASSED
tests/test_phase_pan_india_gis.py::test_02 PASSED
tests/test_phase_pan_india_gis.py::test_03 PASSED
tests/test_phase_pan_india_gis.py::test_04 PASSED
tests/test_phase_pan_india_gis.py::test_05 PASSED
tests/test_phase_pan_india_gis.py::test_06 PASSED
tests/test_phase_pan_india_gis.py::test_07 PASSED
tests/test_phase16_live_telemetry.py   — PASSED
tests/test_phase17_live_source_activation.py — PASSED
16 passed, 13 warnings in 42.72s
```

---

## 9. FRONTEND BUILD RESULT

```
vite v5.4.21 building for production...
✓ 1465 modules transformed
✓ built in 17.01s
Exit code: 0
Errors: 0
Warnings: chunk > 500kB (expected, no action required)
```

---

## 10. BROWSER CONSOLE EXPECTED STATE

After these fixes:
- No `TypeError: Cannot read properties of null (reading 'spatial_id')`
- No fabricated `94%` before data loads
- No `'01:32 AM IST'` hardcoded timestamp
- No `alert count: 2` before API responds
- Model Probability label correctly shown as `Model Probability*`
- Historical disclaimer visible on Decision card

---

## 11. FINAL MANUAL CHECKLIST

- [x] Header is visible
- [x] "Jal Drishti / USDMA · Flood Intelligence" brand text visible
- [x] Brand clicks → landing page
- [x] Dashboard active state visible
- [x] All navigation items present (8 groups)
- [x] Dropdowns work (portal-based, render above map)
- [x] Map renders (CARTO Voyager tiles)
- [x] Map not blank
- [x] Map zoom +/- controls work
- [x] Map recenter → India view (not Uttarakhand only)
- [x] "Historical Output" badge on map overlay
- [x] Risk sidebar: loading skeleton → real data on API response
- [x] "Model Probability*" label in decision card
- [x] "HISTORICAL — not live inference" disclaimer visible
- [x] No fake values displayed before data loads
- [x] Footer: OSM + CARTO attribution present
- [x] Footer: OWM ✓ Live, CWC/IMD unavailable badges
- [x] Timestamp "Unavailable" until real server time
- [x] No TypeError console error
- [x] Build compiles: 0 errors

