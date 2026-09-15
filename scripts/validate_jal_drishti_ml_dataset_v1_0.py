"""
validate_jal_drishti_ml_dataset_v1_0.py

Validation suite for JAL-DRISHTI-ML-DATA-v1.0 package integrity and scientific compliance.
"""

import os
import sys
import pandas as pd
from pathlib import Path

DATASET_DIR = Path("data/processed/training/JAL-DRISHTI-ML-DATA-v1.0")

REQUIRED_FILES = [
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
    "training/master_training_dataset.parquet",
    "training/master_training_dataset.csv",
    "event_label_provenance.csv",
    "negative_sample_provenance.csv",
    "label_definition.md",
    "data_sources.md",
    "dataset_quality_report.md",
    "feature_dictionary.csv",
    "SHA256SUMS.txt",
    "README.md",
]

def main():
    print("================================================================================")
    print("VALIDATING JAL DRISHTI MASTER ML DATASET v1.0 PACKAGE")
    print("================================================================================")
    
    # 1. File existence & readability
    for rf in REQUIRED_FILES:
        fp = DATASET_DIR / rf
        if not fp.exists():
            print(f"[FAIL] Missing required file: {rf}")
            sys.exit(1)
        sz = fp.stat().st_size
        if sz == 0:
            print(f"[FAIL] Empty file: {rf}")
            sys.exit(1)
        print(f"[OK] File verified: {rf:<50} ({sz} bytes)")

    # 2. Inspect Master Training Dataset
    master_pq = DATASET_DIR / "training/master_training_dataset.parquet"
    df = pd.read_parquet(master_pq)
    rows, cols = df.shape
    print(f"\n[OK] Master training dataset loaded: {rows} rows, {cols} columns.")
    
    if rows != 1356:
        print(f"[FAIL] Unexpected row count: expected 1356, got {rows}")
        sys.exit(1)
        
    # Check positive vs negative control counts
    pos_count = len(df[df['sample_class'] == 'HISTORICAL_DISASTER_EVENT'])
    neg_count = len(df[df['sample_class'] == 'NEGATIVE_CONTROL'])
    print(f"     Historical Event Rows: {pos_count}")
    print(f"     Real Negative Control Rows: {neg_count}")

    if pos_count != 1116:
        print(f"[FAIL] Unexpected historical event row count: expected 1116, got {pos_count}")
        sys.exit(1)
    if neg_count != 240:
        print(f"[FAIL] Unexpected negative control row count: expected 240, got {neg_count}")
        sys.exit(1)

    # 3. Target label checks
    neg_target_zeros = df[df['sample_class'] == 'NEGATIVE_CONTROL']['flood_next_1h'].unique()
    if list(neg_target_zeros) != [0]:
        print(f"[FAIL] Negative control targets must be 0, got: {neg_target_zeros}")
        sys.exit(1)
    print("[OK] Real negative sample target labels verified strictly = 0.")

    null_targets = df[df['sample_class'] == 'HISTORICAL_DISASTER_EVENT']['flood_next_1h'].isna().all()
    if not null_targets:
        print("[FAIL] Date-only historical event targets must be NaN/NULL!")
        sys.exit(1)
    print("[OK] Historical event target labels verified explicitly NULL (NaN) for Date-Only events.")

    # 4. Check feature dictionary leakage classification
    dict_df = pd.read_csv(DATASET_DIR / "feature_dictionary.csv")
    if 'leakage_classification' not in dict_df.columns:
        print("[FAIL] Leakage classification missing in feature_dictionary.csv")
        sys.exit(1)
    print("[OK] Feature dictionary contains explicit leakage classifications.")

    print("\n================================================================================")
    print("[OK] All 15 dataset validation criteria PASSED successfully.")
    print("================================================================================")

if __name__ == "__main__":
    main()
