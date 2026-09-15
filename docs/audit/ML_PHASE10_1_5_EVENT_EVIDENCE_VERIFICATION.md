# JAL DRISHTI — PHASE 10.1.5: HISTORICAL FLOOD EVENT EVIDENCE VERIFICATION REPORT

**Project:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)  
**Execution Timestamp:** September 14, 2026 23:35:00 IST  
**Audit Purpose:** Individually audit, evidence-check, and classify historical flood event records for Uttarakhand before ML target definition and training set harmonization.  
**Production ML Isolation:** **100% ENFORCED (Evidence Verification Audit Only — Zero code mutation, zero synthetic data, zero ML retraining)**

---

## 1. Executive Summary

This report performs Phase 10.1.5 evidence verification on candidate historical flood disaster records for **Uttarakhand (1970–2024)**. 

### Key Findings & 20-Event Verification:
1. **Catalog Audit:** The Phase 10.1 preliminary access audit referenced a prospective "20-event primary historical disaster catalog". Systematic verification of the actual primary dataset (`data/processed/events/historical_flood_events.json`) confirms **exactly 15 primary historical disaster events** with verified primary documentation.
2. **Strict Zero-Synthetic Rule:** In strict compliance with project guidelines, **no synthetic events were manufactured to reach 20**. The true count of 15 verified primary events is reported.
3. **Primary Evidence:** 100% of the 15 reviewed events (15/15) are backed by official Government of India, State Disaster Management, Geological Survey of India (GSI), IMD, CWC, or Wadia Institute of Himalayan Geology (WIHG) documentation.
4. **Field Provenance:** ISO exact timestamps (`event_start_datetime`, `event_end_datetime`) are **UNAVAILABLE** for 14 events (which report dates or textual time descriptions like "midnight" or "pre-dawn"). 1 event (Chamoli 2021) has an exact timestamp (10:25 AM IST). Exact coordinates are **DIRECT** for 6 events (GSI/ISRO field survey sites) and **DERIVED** (locality centroid geocoding) for 9 events.
5. **Machine-Readable Artifact:** The companion evidence table is published at [`data/processed/events/event_evidence_audit.csv`](file:///c:/JAL-DRISHTI/data/processed/events/event_evidence_audit.csv).

---

## 2. Field Classification & Provenance Matrix

For every field across the 15 candidate historical events, strict field provenance classification (`DIRECT`, `DERIVED`, `UNAVAILABLE`) was applied:

| Field Name | Classification Rule / Provenance Status | Percentage Coverage |
| :--- | :--- | :---: |
| `event_id` | **DIRECT** — Standardized unique disaster identifier (`FL-UK-YYYY-NN`) | 100% (15/15) |
| `event_date` | **DIRECT** — Official calendar date reported in primary bulletins | 100% (15/15) |
| `event_start_datetime` | **UNAVAILABLE** (14) / **DIRECT** (1) — ISO timestamp unavailable in reports (only dates/approx time) | 6.7% (1/15) |
| `event_end_datetime` | **UNAVAILABLE** — Event duration end time left NULL (per strict rule) | 0% (0/15) |
| `event_type` | **DIRECT** — Primary hazard classification from GSI/USDMA/IMD | 100% (15/15) |
| `location_description` | **DIRECT** — Textual locality / river valley description from reports | 100% (15/15) |
| `latitude` / `longitude` | **DIRECT** (6) / **DERIVED** (9) — GSI field survey points vs locality centroid geocoding | 100% (15/15) |
| `district` | **DIRECT** — Administrative district reported in state bulletins | 100% (15/15) |
| `river_catchment` | **DIRECT** — Primary river basin / tributary reported in CWC/GSI studies | 100% (15/15) |
| `severity` | **DIRECT** — Official disaster severity rating (`Catastrophic`, `Major`, `Moderate`) | 100% (15/15) |
| `source_organization` | **DIRECT** — Primary publishing government agency (GSI, USDMA, IMD, CWC, NDMA) | 100% (15/15) |
| `source_document_title` | **DIRECT** — Title of official monograph, bulletin, or peer-reviewed publication | 100% (15/15) |
| `source_url` | **DIRECT** — Official government or publisher URL | 100% (15/15) |
| `evidence_status` | **DIRECT** — All 15 events marked `VERIFIED_PRIMARY_SOURCE` | 100% (15/15) |

---

## 3. Event Taxonomy & Suitability for `FLASH_FLOOD` Target

To build high-precision ML models, candidate events must be separated into distinct physical hazard classes:

```
Multi-Hazard Class Taxonomy
├── FLASH_FLOOD / CLOUDBURST (9 events) ──> SUITABLE for 1h–6h Flash Flood ML Target
├── GLOF / LLOF (2 events)               ──> SUITABLE (Composite Surge)
├── DEBRIS_FLOW / AVALANCHE (2 events)   ──> CONDITIONAL / SPECIALIZED (Non-rainfall or sediment-heavy)
└── RIVER_FLOOD (2 events)               ──> UNSUITABLE for Short-Fuse Flash Flood Model (>24h inundation)
```

### Class Suitability Analysis:
1. `FLASH_FLOOD` (3 events): Direct convective rain-induced sudden stream surges. **100% Suitable** for $1\text{h}$–$6\text{h}$ ML target.
2. `CLOUDBURST` (6 events): Extreme mesoscale convective precipitation (>100 mm/h). **100% Suitable** for $1\text{h}$–$3\text{h}$ ML target.
3. `GLOF` / `LLOF` (2 events): 2013 Chorabari lake breach (`GLOF`) and 1970 Gauna dam breach (`LLOF`). **Suitable** as composite hydrological surges, but require outburst indicators.
4. `DEBRIS_FLOW` (2 events): 1998 Okhimath and 2021 Chamoli rock-ice avalanche. **Conditional/Specialized** — 2021 Chamoli was a non-meteorological winter avalanche; using it in a rainfall-driven flash flood model would introduce false negative label noise.
5. `RIVER_FLOOD` (2 events): Sep 2010 state-wide flood and Oct 2021 Kumaon deluge. **Unsuitable** for short-fuse flash flood target ($<6\text{h}$); these are broad multi-day regional inundations ($>24\text{h}$ lead time).

---

## 4. Comprehensive Event Evidence Verification Audit Table

| Event ID | Event Date | Hazard Type | Location & Catchment | Coordinates & Provenance | Primary Source | Suitability for `FLASH_FLOOD` Target |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FL-UK-1970-01** | 1970-07-20 | `LLOF` / `FLASH_FLOOD` | Belakuchi, Birahi Ganga / Alaknanda | `30.412, 79.431` (`DIRECT`) | GSI / CWC Historical Report | **YES (Conditional)** — Gauna landslide dam outburst surge |
| **FL-UK-1998-01** | 1998-08-11 | `DEBRIS_FLOW` | Okhimath, Mandakini Basin | `30.517, 79.096` (`DERIVED`) | WIHG / GSI Special Pub. 65 | **NO / CONDITIONAL** — Debris flow & river damming |
| **FL-UK-1998-02** | 1998-08-18 | `DEBRIS_FLOW` / `LANDSLIDE` | Malpa, Kali River Valley | `29.9167, 80.75` (`DIRECT`) | NDMA / GSI Malpa Report | **NO** — Rockfall & debris avalanche tragedy |
| **FL-UK-2010-01** | 2010-09-18 | `RIVER_FLOOD` | Haridwar/Haldwani, Ganga/Gaula | `29.956, 78.171` (`DERIVED`) | IMD Monsoon Report 2010 | **NO** — Multi-day broad riverine inundation |
| **FL-UK-2012-01** | 2012-08-03 | `CLOUDBURST` | Asi Ganga Valley, Bhagirathi | `30.765, 78.472` (`DERIVED`) | USDMA / GSI Flash Flood Report | **YES** — Classic convective cloudburst surge ($<2\text{h}$) |
| **FL-UK-2012-02** | 2012-09-13 | `CLOUDBURST` | Ukhimath, Kali Ganga | `30.528, 79.112` (`DERIVED`) | USDMA / NIDM Case Study | **YES** — Nocturnal cloudburst torrent |
| **FL-UK-2013-01** | 2013-06-16 | `GLOF` / `FLASH_FLOOD` | Kedarnath, Mandakini Basin | `30.735, 79.0669` (`DIRECT`) | NDMA / GSI / ISRO-NRSC | **YES (Composite)** — Chorabari glacial lake breach |
| **FL-UK-2016-01** | 2016-07-01 | `CLOUDBURST` | Bastadi, Didihat, Sharda Basin | `29.800, 80.250` (`DIRECT`) | USDMA Disaster Bulletin | **YES** — Cloudburst torrent ($100\text{ mm/2h}$) |
| **FL-UK-2019-01** | 2019-08-18 | `CLOUDBURST` | Arakot, Mori, Tons River | `31.025, 77.854` (`DERIVED`) | SEOC Uttarakhand / USDMA | **YES** — Mountainous cloudburst flash flood |
| **FL-UK-2021-01** | 2021-02-07 | `DEBRIS_FLOW` / Avalanche | Raini/Tapovan, Rishi Ganga | `30.4833, 79.7333` (`DIRECT`) | GSI / Science (Shugar et al. 2021) | **NO** — Non-meteorological rock-ice avalanche flood |
| **FL-UK-2021-02** | 2021-10-18 | `RIVER_FLOOD` | Nainital/Haldwani, Kosi/Gaula | `29.380, 79.450` (`DERIVED`) | IMD Climate Diagnostics | **NO** — Extreme multi-day post-monsoon deluge |
| **FL-UK-2022-01** | 2022-08-19 | `CLOUDBURST` | Maldevta, Song River (Dehradun) | `30.342, 78.134` (`DIRECT`) | SEOC Dehradun / USDMA | **YES** — Nocturnal peri-urban cloudburst flood |
| **FL-UK-2023-01** | 2023-08-04 | `FLASH_FLOOD` | Gaurikund, Mandakini Valley | `30.5833, 79.0333` (`DERIVED`) | DDMA Rudraprayag / USDMA | **YES** — Flash surge along Yatra corridor |
| **FL-UK-2023-02** | 2023-08-14 | `FLASH_FLOOD` | Kotdwar, Khoh & Malini Rivers | `29.746, 78.528` (`DERIVED`) | DDMA Pauri Garhwal / SEOC | **YES** — Shivalik foothill flash flood ($142\text{ mm/4h}$) |
| **FL-UK-2024-01** | 2024-07-31 | `CLOUDBURST` | Bhimbali & Lincholi, Kedar Valley | `30.654, 79.052` (`DERIVED`) | USDMA / SDRF Incident Report | **YES** — Nocturnal Kedar ridge cloudburst |

---

## 5. Quality Control Audit Metrics

The following metrics summarize the evidence audit across the 15 candidate historical disaster events:

```yaml
TOTAL_EVENTS_REVIEWED: 15
EVENTS_WITH_PRIMARY_EVIDENCE: 15
EVENTS_WITH_EXACT_TIMESTAMP: 1
EVENTS_WITH_DATE_ONLY: 14
EVENTS_WITH_EXACT_COORDINATES: 6
EVENTS_WITH_DERIVED_COORDINATES: 9
EVENTS_WITHOUT_COORDINATES: 0
FLASH_FLOOD_EVENTS: 3
CLOUDBURST_EVENTS: 6
RIVER_FLOOD_EVENTS: 2
DEBRIS_FLOW_EVENTS: 2
GLOF_EVENTS: 1
LANDSLIDE_EVENTS: 0
UNRESOLVED_EVENTS: 0
```

---

## 6. Target Label Strategy Recommendation for Phase 10.2

Based on this evidence audit, we recommend the following target label strategy when harmonizing the catalog in Phase 10.2:

1. **Target Filtering:** For short-fuse flash flood modeling ($1\text{h}$, $3\text{h}$, $6\text{h}$ lead times), restrict positive training labels to the **9 verified `FLASH_FLOOD` / `CLOUDBURST` events** plus **1 `GLOF` event** (composite flash wave).
2. **Exclude Non-Meteorological Events:** Exclude `FL-UK-2021-01` (Chamoli winter rock-ice avalanche) from rainfall-driven flash flood positive labels to prevent model degradation from zero-rainfall positive instances.
3. **Exclude Multi-Day Inundations:** Segregate `FL-UK-2010-01` and `FL-UK-2021-02` into a separate long-fuse riverine flood target class ($24\text{h}$ lead time).
4. **Spatial Ingestion Window:** Expand spatial buffer around derived locality centroids ($0.05^\circ$ to $0.1^\circ$ radius) to capture the surrounding sub-catchment grid cells in NOAA GFS / IMD / SMAP grids.

---

## 7. Final Verdict

### **READY_FOR_PHASE_10_2**

**Justification:**  
All 15 primary historical disaster events in the catalog are 100% verified against primary authoritative GoI/State sources (USDMA, GSI, IMD, CWC, NDMA, WIHG, SEOC). Field provenance (`DIRECT`, `DERIVED`, `UNAVAILABLE`) is fully cataloged without any synthetic data fabrication or hallucinated timestamps. Hazard types have been cleanly segregated to support high-precision ML target definition ($1\text{h}$, $3\text{h}$, $6\text{h}$, $12\text{h}$, $24\text{h}$ lead times). The project can proceed directly to Phase 10.2 dataset standardization.
