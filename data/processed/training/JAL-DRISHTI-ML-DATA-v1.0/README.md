# JAL-DRISHTI-ML-DATA-v1.0 — Master ML Training Package

## Overview
- **Dataset Version:** JAL-DRISHTI-ML-DATA-v1.0
- **Project:** Jal Drishti Hydrological Early Warning & Flash Flood Prediction Platform (SIH26192)
- **Purpose:** Primary ML training dataset combining 15 verified historical flood events and 10 real negative control monsoon observation windows.
- **Total Rows:** 1356 hourly environmental observation rows across 63 features.

---

## Key Package Deliverables

1. **Master Training Dataset:**
   - [`training/master_training_dataset.parquet`](file:///training/master_training_dataset.parquet) & [`.csv`](file:///training/master_training_dataset.csv)
2. **Provenance & Audits:**
   - [`event_label_provenance.csv`](file:///event_label_provenance.csv): Timing precision and hazard taxonomy audit for all 15 events.
   - [`negative_sample_provenance.csv`](file:///negative_sample_provenance.csv): Sampling rules and zero-disaster evidence for 10 control windows.
3. **Documentation:**
   - [`label_definition.md`](file:///label_definition.md): Zero-leakage target specification protocol.
   - [`feature_dictionary.csv`](file:///feature_dictionary.csv): Complete metadata, spatial/temporal resolution, and leakage classification.
   - [`data_sources.md`](file:///data_sources.md): Data provider access manifest.
   - [`dataset_quality_report.md`](file:///dataset_quality_report.md): Comprehensive quality audit metrics.
   - [`SHA256SUMS.txt`](file:///SHA256SUMS.txt): Cryptographic checksums.

---

## SCIENTIFIC LIMITATIONS & TRAIN-TEST SPLIT GUIDELINES

> [!WARNING]
> 1. **Date-Only Events:** 14 historical events have date-only timing precision in GoI records. Their target labels (`flood_next_*`) are explicitly `NULL` (NaN). Do **NOT** treat `NULL` as `0`.
> 2. **Group-Based Validation:** Always split train and test sets by `event_id` or `district` to avoid spatial-temporal data leakage.
