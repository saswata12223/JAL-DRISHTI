# Jal Drishti — Product Requirements Document (PRD)

**Document Version:** 1.0.0  
**Target Region:** Uttarakhand, India  
**Target Authority:** Uttarakhand State Disaster Management Authority (USDMA) & State Disaster Response Force (SDRF)

---

## 1. Problem Statement

Uttarakhand experiences extreme monsoonal precipitation, cloudbursts, and rapid river stage surges. Topographical steepness in the Bhagirathi, Alaknanda, Mandakini, Pindar, and Ganga river catchments creates short hydrological response times (under 2 hours).

Conventional river stage gauges alone fail during cloudburst inundation because flash floods originate in unmonitored upper catchments before downstream gauges reflect water level rise. Conversely, purely atmospheric precipitation forecasts produce false alarms without soil saturation and hydrological curve number modeling.

---

## 2. Product Objective

**Jal Drishti** provides a unified **Multi-Signal Flood Risk Decision Engine** that fuses:
1. **Machine Learning Predictions:** XGBoost Champion Model (v6.1.0) scoring precipitation, antecedence, soil moisture, and terrain susceptibility.
2. **Hydrological Physics:** SCS-CN (Soil Conservation Service Curve Number) direct surface runoff calculation ($Q$).
3. **Official CWC River Gauge Thresholds:** Central Water Commission Warning Level, Danger Level, and Highest Flood Level (HFL) exceedance logic.
4. **Sensor Quality & Conflict Resolution:** Deterministic priority rules ensuring river stage breaches override dry local forecasts, and extreme rainfall alerts trigger warnings even if upstream telemetry is offline.

---

## 3. Target Users & User Personas

- **State Disaster Management Officials (USDMA / DEOC):** Require high-level executive KPI indicators, district risk breakdowns, and SDRF alert activation triggers.
- **District Emergency Officers & Field Responders:** Require specific station stage data, river catchment maps, and recommended emergency actions.
- **Hydrological Analysts & ML Engineers:** Require model explainability, feature importance rankings, ROC calibration curves, and raw sensor observations.

---

## 4. Implemented Functional Capabilities

| Feature ID | Functional Requirement | Implemented Component | Status |
|---|---|---|---|
| **FR-01** | Real-Time ML Probability Scoring | XGBoost Champion Model (v6.1.0) in `backend/app/services/prediction_service.py` | Operational |
| **FR-02** | Hydrological Runoff Physics Calculation | SCS-CN runoff formula $Q$ in `ml/physics.py` | Operational |
| **FR-03** | CWC River Gauge Threshold Evaluation | Warning / Danger / HFL stage exceedance classifier in `risk_decision_engine.py` | Operational |
| **FR-04** | Multi-Signal Risk & Conflict Fusion | 7-rule conflict resolution matrix in `risk_decision_engine.py` | Operational |
| **FR-05** | State-Wide Geospatial Risk Map | Interactive Leaflet map displaying 1,000 spatial points in `frontend/src/pages/RiskMapPage.jsx` | Operational |
| **FR-06** | Operational Dashboard & KPI Cards | Active Extreme/High alerts, Monitored Stations, Decision Intelligence in `DashboardPage.jsx` | Operational |
| **FR-07** | Automated Sensor Telemetry Ingestion | REST API (`/api/v1/observations`) and MQTT Gateway (`mqtt_gateway.py`) | Operational |
| **FR-08** | Model Intelligence & Explainability | Feature importance charts, ROC curves, and policy schema in `ModelIntelligencePage.jsx` | Operational |

---

## 5. System Boundaries & Constraints

- **Spatial Extent:** Uttarakhand, India (Bounding Box: 77.5°E - 81.0°E, 28.7°N - 31.5°N).
- **Temporal Resolution:** Half-hourly satellite / rain gauge inputs; sub-100ms REST API query latency.
- **Offline Reliability:** Operates with embedded Parquet dataset storage (`unified_sensor_dataset.parquet`) when external databases are unreachable.

---
*Jal Drishti Technical Documentation*
