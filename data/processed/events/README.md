# Jal Drishti — Historical Flood Event Catalogue Documentation

**Product Version:** Phase 10.2 Ground-Truth Release  
**Last Updated:** September 14, 2026  
**Files:**
- `data/processed/events/historical_flood_events.parquet` (Binary column store)
- `data/processed/events/historical_flood_events.csv` (CSV flat file)
- `data/processed/events/event_evidence_audit.csv` (Field-level provenance audit table)

---

## 1. Overview & Data Quality Report

The **Historical Flood Event Catalogue** contains 100% primary-evidenced natural disaster records for **Uttarakhand, India (1970–2024)**. This catalogue serves as the ground-truth target repository for machine learning training label construction ($1\text{h}$, $3\text{h}$, $6\text{h}$, $12\text{h}$, $24\text{h}$ lead times).

### Data Quality Summary

```yaml
total_events: 15
primary_evidence_events: 15
flash_flood_eligible_events: 8
events_with_exact_timestamp: 1
events_with_date_only: 14
events_with_direct_coordinates: 6
events_with_derived_coordinates: 9
events_without_coordinates: 0
duplicate_event_ids: 0
duplicate_date_location_pairs: 0
data_quality_assessment: HIGH
```

### Breakdown by Hazard Target Class (`target_class`):
- `CLOUDBURST`: **6 events** (`FL-UK-2012-01`, `FL-UK-2012-02`, `FL-UK-2016-01`, `FL-UK-2019-01`, `FL-UK-2022-01`, `FL-UK-2024-01`) — **Eligible**
- `FLASH_FLOOD`: **2 events** (`FL-UK-2023-01`, `FL-UK-2023-02`) — **Eligible**
- `DEBRIS_FLOW`: **3 events** (`FL-UK-1998-01`, `FL-UK-1998-02`, `FL-UK-2021-01`) — **Ineligible** (Non-meteorological avalanche or debris torrent focus)
- `RIVER_FLOOD`: **2 events** (`FL-UK-2010-01`, `FL-UK-2021-02`) — **Ineligible** (Multi-day regional inundation, $>24\text{h}$ lead time)
- `LLOF`: **1 event** (`FL-UK-1970-01`) — **Ineligible** (Gauna landslide dam outburst breach)
- `GLOF`: **1 event** (`FL-UK-2013-01`) — **Ineligible** (Chorabari glacial lake outburst breach)
- `OTHER`: **0 events**

---

## 2. Schema Specification

| Column Name | Data Type | Nullable | Description & Mapping Rules |
| :--- | :--- | :---: | :--- |
| `event_id` | String | No | Standardized unique event identifier (`FL-UK-YYYY-NN`) |
| `event_date` | String | No | Official calendar date (`YYYY-MM-DD`) |
| `event_start_datetime` | String | **Yes (NULL)** | ISO timestamp if exact start time is reported (NULL for date-only events) |
| `event_end_datetime` | String | **Yes (NULL)** | ISO timestamp if exact end time is reported (NULL per strict project rules) |
| `event_type` | String | No | Original hazard classification from source bulletin |
| `target_class` | String | No | Physical hazard class (`FLASH_FLOOD`, `CLOUDBURST`, `GLOF`, `LLOF`, `DEBRIS_FLOW`, `RIVER_FLOOD`, `OTHER`) |
| `target_suitability` | String | No | Technical explanation of target suitability |
| `flash_flood_target_eligible` | Boolean | No | `True` for short-fuse rainfall flash floods (`FLASH_FLOOD`, `CLOUDBURST`); `False` otherwise |
| `location_description` | String | No | Textual location and river valley description |
| `latitude` | Float64 | No | WGS84 latitude coordinate |
| `longitude` | Float64 | No | WGS84 longitude coordinate |
| `coord_class` | String | No | `DIRECT` (GSI/ISRO site survey) vs `DERIVED` (locality centroid geocoding) |
| `district` | String | No | Administrative district(s) |
| `river_catchment` | String | No | River basin or sub-tributary |
| `severity` | String | No | Hazard severity (`Catastrophic`, `Major`, `Moderate`) |
| `source_organization` | String | No | Primary government publisher (USDMA, GSI, IMD, CWC, NDMA, WIHG, SEOC) |
| `source_document_title` | String | No | Title of official report, monograph, or publication |
| `source_url` | String | No | Canonical web link to source |
| `page_number_or_section` | String | No | Report section reference |
| `evidence_status` | String | No | Evidence validation code (`VERIFIED_PRIMARY_SOURCE`) |

---

## 3. Strict Rules & Data Integrity

1. **Zero Synthetic Values:** No invented timestamps (`00:00:00`), artificial durations, or fabricated coordinates. Missing timestamps are strictly preserved as `NULL`.
2. **Target Isolation:** GLOF, LLOF, and non-meteorological debris flows are **NOT** silently converted into rainfall-driven flash flood positive labels.
3. **Equivalence:** `historical_flood_events.parquet` and `historical_flood_events.csv` contain 100% identical records verified by automated unit tests (`tests/test_historical_event_catalogue.py`).
