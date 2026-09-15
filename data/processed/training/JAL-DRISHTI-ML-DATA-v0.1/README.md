# JAL-DRISHTI-ML-DATA-v0.1

## Dataset Metadata
- **Dataset:** JAL-DRISHTI-ML-DATA-v0.1
- **Purpose:** Historical environmental feature dataset for Uttarakhand flash-flood ML research.
- **Events:** 15 verified historical flood events (8 flash-flood / cloudburst eligible)
- **Rainfall:** GPM IMERG V07 available for 14/15 events (FL-UK-1970-01 predates GPM era)
- **Soil Moisture:** SMAP L4 V8 available for 8/15 events (2015+ period of record)
- **Weather:** Historical GFS forecast-vintage unavailable (0/15, documented missingness)
- **Hydrology:** CWC river gauge historical data unavailable (0/15, documented status)
- **Terrain Predictors:** Complete (15/15 events, static SRTM DEM derived features)
- **Land Cover:** Complete (15/15 events, ESA WorldCover features)
- **Total Rows:** 1116 primary time-series observations across events

---

## IMPORTANT SCIENTIFIC LIMITATION & USAGE RULES

> [!WARNING]
> This is a preliminary historical feature dataset.
> It is **NOT** yet the final production flood-classification training dataset.

1. **Event Unit of Observation:**
   - Do **NOT** interpret each row as an independent flood event. Rows represent temporal observation windows surrounding verified event dates.
2. **Label Discipline:**
   - Do **NOT** create flood labels from rainfall alone.
3. **Missing Value Handling:**
   - Do **NOT** invent missing GFS/CWC values.
   - Do **NOT** treat missing values as zero (`NULL` represents explicit missingness).
4. **Coordinate Provenance:**
   - Preserve `coord_class` (`DIRECT` vs `DERIVED`) during model training and evaluation.

---

## Package Directory Structure
```
JAL-DRISHTI-ML-DATA-v0.1/
├── README.md
├── events/
│   ├── historical_flood_events.parquet
│   ├── historical_flood_events.csv
│   └── event_evidence_audit.csv
├── rainfall/
│   ├── historical_gpm_event_rainfall.parquet
│   └── historical_gpm_event_rainfall.csv
├── soil_moisture/
│   ├── historical_smap_l4.parquet
│   └── historical_smap_l4.csv
├── weather/
│   ├── historical_gfs.parquet
│   └── historical_gfs.csv
├── terrain/
│   ├── terrain_features.parquet
│   └── terrain_features.csv
├── landcover/
│   ├── landcover_features.parquet
│   └── landcover_features.csv
├── training/
│   ├── jal_drishti_training_dataset_v0.1.parquet
│   └── jal_drishti_training_dataset_v0.1.csv
├── feature_dictionary.csv
├── data_sources.md
├── quality_report.md
└── SHA256SUMS.txt
```
