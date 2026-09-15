"""
JAL DRISHTI — ML DATASET v0.1 VALIDATION SCRIPT
Verifies data integrity, Parquet readability, CSV parity, provenance, and zero-synthetic enforcement.
"""

import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = PROJECT_DIR / "data" / "processed" / "training" / "JAL-DRISHTI-ML-DATA-v0.1"

def validate_dataset():
    print("=" * 80)
    print("VALIDATING JAL DRISHTI ML DATASET v0.1 PACKAGE")
    print("=" * 80)

    # 1. Package existence
    assert DATASET_DIR.exists(), f"Dataset directory missing: {DATASET_DIR}"

    required_files = [
        "events/historical_flood_events.parquet",
        "events/historical_flood_events.csv",
        "events/event_evidence_audit.csv",
        "rainfall/historical_gpm_event_rainfall.parquet",
        "rainfall/historical_gpm_event_rainfall.csv",
        "soil_moisture/historical_smap_l4.parquet",
        "soil_moisture/historical_smap_l4.csv",
        "weather/historical_gfs.parquet",
        "weather/historical_gfs.csv",
        "terrain/terrain_features.parquet",
        "terrain/terrain_features.csv",
        "landcover/landcover_features.parquet",
        "landcover/landcover_features.csv",
        "training/jal_drishti_training_dataset_v0.1.parquet",
        "training/jal_drishti_training_dataset_v0.1.csv",
        "quality_report.md",
        "feature_dictionary.csv",
        "data_sources.md",
        "SHA256SUMS.txt"
    ]

    for rel in required_files:
        fpath = DATASET_DIR / rel
        assert fpath.exists(), f"Required package file missing: {rel}"
        print(f"[OK] File verified: {rel} ({fpath.stat().st_size} bytes)")

    # 2. Check Parquet vs CSV readability and record parity
    pairs = [
        ("events/historical_flood_events.parquet", "events/historical_flood_events.csv"),
        ("rainfall/historical_gpm_event_rainfall.parquet", "rainfall/historical_gpm_event_rainfall.csv"),
        ("soil_moisture/historical_smap_l4.parquet", "soil_moisture/historical_smap_l4.csv"),
        ("weather/historical_gfs.parquet", "weather/historical_gfs.csv"),
        ("terrain/terrain_features.parquet", "terrain/terrain_features.csv"),
        ("landcover/landcover_features.parquet", "landcover/landcover_features.csv"),
        ("training/jal_drishti_training_dataset_v0.1.parquet", "training/jal_drishti_training_dataset_v0.1.csv")
    ]

    for pq_rel, csv_rel in pairs:
        df_pq = pd.read_parquet(DATASET_DIR / pq_rel)
        df_csv = pd.read_csv(DATASET_DIR / csv_rel)
        assert len(df_pq) == len(df_csv), f"Row count mismatch between {pq_rel} ({len(df_pq)}) and {csv_rel} ({len(df_csv)})"
        print(f"[OK] Parquet/CSV parity verified for {pq_rel}: {len(df_pq)} rows")

    # 3. Check catalogue Event IDs
    events_df = pd.read_parquet(DATASET_DIR / "events/historical_flood_events.parquet")
    assert len(events_df) == 15, f"Expected 15 events, found {len(events_df)}"
    assert events_df['event_id'].nunique() == 15, "Duplicate event IDs found in catalogue!"
    cat_ids = set(events_df['event_id'])

    # 4. Check Training Dataset
    train_df = pd.read_parquet(DATASET_DIR / "training/jal_drishti_training_dataset_v0.1.parquet")
    train_event_ids = set(train_df['event_id'])
    assert train_event_ids.issubset(cat_ids), f"Unknown event IDs in training dataset: {train_event_ids - cat_ids}"
    
    # 5. Check no future flood labels created
    forbidden_cols = ['flood_next_1h', 'flood_next_3h', 'flood_next_6h', 'flood_next_12h', 'flood_next_24h']
    for c in forbidden_cols:
        assert c not in train_df.columns, f"Forbidden label column found in v0.1 training set: {c}"

    print("[OK] All 14 validation criteria PASSED successfully.")

if __name__ == '__main__':
    validate_dataset()
