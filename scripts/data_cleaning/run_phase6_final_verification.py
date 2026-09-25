import os
import sys
import pandas as pd
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.hashing import calculate_sha256

def run_phase6():
    print("Running Phase 6: Final Verification & ML Readiness...")
    
    # 1. Recalculate Hashes
    raw_dir = Path("data/raw")
    hashes = []
    files = list(raw_dir.rglob("*.*"))
    for f in files:
        if f.is_file():
            rel_path = f.relative_to(raw_dir).as_posix()
            hashes.append({
                "relative_path": rel_path,
                "sha256": calculate_sha256(f)
            })
            
    after_df = pd.DataFrame(hashes)
    out_dir_cat = Path("data/processed/catalog")
    after_path = out_dir_cat / "RAW_SHA256_AFTER_CLEANING.csv"
    after_df.to_csv(after_path, index=False)
    
    # Compare hashes
    before_path = out_dir_cat / "RAW_SHA256_BEFORE_CLEANING.csv"
    if not before_path.exists():
        print("CRITICAL: RAW_SHA256_BEFORE_CLEANING.csv not found.")
        sys.exit(1)
        
    before_df = pd.read_csv(before_path)
    
    # Check lengths
    if len(before_df) != len(after_df):
        print(f"CRITICAL: File count changed! Before: {len(before_df)}, After: {len(after_df)}")
        sys.exit(1)
        
    # Merge and compare
    comp = before_df.merge(after_df, on="relative_path", suffixes=("_before", "_after"))
    mismatch = comp[comp["sha256_before"] != comp["sha256_after"]]
    
    if not mismatch.empty:
        print("CRITICAL: RAW DATA INTEGRITY VIOLATION!")
        print(mismatch)
        sys.exit(1)
        
    print("RAW DATA INTEGRITY: VERIFIED")
    
    # Check readiness conditions
    manifest_path = Path("data/processed/catalog/CLEAN_DATA_MANIFEST.csv")
    if not manifest_path.exists():
        print("CRITICAL: Clean Data Manifest missing.")
        sys.exit(1)
        
    manifest_df = pd.read_csv(manifest_path)
    blocked_count = len(manifest_df[manifest_df["validation_status"] == "BLOCKED"])
    
    ml_ready = "PASS" if blocked_count == 0 else "BLOCKED"
    
    # Write Final Report
    report_path = Path("data/processed/reports/DATA_CLEANING_AND_VALIDATION_REPORT.md")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    
    report_content = f"""# Jal Drishti Data Cleaning and Validation Report

## Executive Summary
This report summarizes the execution of the read-only-first, scientifically defensible historical-data cleaning and validation pipeline.

## Raw Data Integrity
- RAW_SHA256_BEFORE_CLEANING: `VERIFIED`
- RAW_SHA256_AFTER_CLEANING: `VERIFIED`
- INTEGRITY CHECK: `PASS`

## Source Inventory
Discovered and cataloged {len(before_df)} files in the raw dataset inventory.

## Dataset Validation Summary
Total Datasets Cleaned: {len(manifest_df)}
Total Excluded / Blocked: {blocked_count}

## ML Readiness Gate
**ML_READY = {ml_ready}**

## Final Decision
The data pipeline completed without violating raw data integrity constraints.
"""

    with open(report_path, "w") as f:
        f.write(report_content)
        
    print(f"Final Report saved to {report_path}")
    print(f"ML READINESS: {ml_ready}")

if __name__ == "__main__":
    run_phase6()
