# PHASE 11 HISTORICAL EVENT EVIDENCE AUDIT

## Dataset Inventory

### historical_gpm_event_rainfall.csv
- **Path**: data/processed/rainfall/historical_gpm_event_rainfall.csv
- **Type**: PROCESSED / FEATURE-DERIVED
- **Source**: NASA GPM IMERG 3IMERGHH V07B (via HDF5 granules)
- **Lineage**: Extracted from GPM granules explicitly for the historical events as evidenced by historical_gpm_source_manifest.csv. It is not a raw global dataset, but an event-linked extract.
- **Spatial Resolution**: 0.1 degree grid
- **Temporal Resolution**: 30-minute intervals
- **Timestamps**: UTC
- **Usability**: USABLE for spatial and temporal bounding (as independent processed telemetry).

### historical_event_benchmark.json
- **Path**: data/processed/ml/models/historical_event_benchmark.json
- **Type**: DERIVED / MODEL OUTPUT
- **Reason**: Contains pre-calculated model metrics (predicted_probability_xgboost, scs_direct_runoff_q_mm). 
- **Usability**: REJECTED. Not suitable for raw feature matching.

## Canonical Event Statistics
- Source records: 15
- Canonical records: 15
- Duplicates: 0

## Administrative Resolution (Survey of India)
- Spatially resolved to State/District polygons: 14
- District only (no coords): 0

## Feature Evidence Summary
- Spatial candidate method: ±0.15° latitude/longitude bounding box
- Spatial selection: nearest valid GPM grid centre
- Distance: Haversine distance in km
- Temporal method: actual timestamps at the selected GPM grid cell
- Event precision: preserved from source
- Feature verification: requires both spatial and temporal correspondence

### Counts
- Spatially Matched: 14
- Spatially Unmatched: 1
- Spatially Insufficient: 0
- Temporally Matched: 14
- Temporally Unmatched: 0
- Temporally Insufficient: 1
- Feature-matched (Verified): 14
- Feature-matched (Partial): 0
- Feature Unmatched / Rejected: 1
- Feature Insufficient: 0

