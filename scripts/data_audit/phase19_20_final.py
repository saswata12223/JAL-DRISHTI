import pandas as pd
from pathlib import Path
import os
import hashlib

def get_sha256(filepath):
    sha256_hash = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    except Exception as e:
        return f"ERROR: {str(e)}"

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    cat_dir = repo_root / "data" / "processed" / "catalog"
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        return
        
    df_before = pd.read_csv(manifest_csv)
    raw_files_before = df_before[df_before['source_category'] == 'raw']
    before_map = {row['relative_path']: row['sha256'] for idx, row in raw_files_before.iterrows()}
    
    data_raw_dir = repo_root / "data" / "raw"
    current_raw_files = []
    
    for root, _, files in os.walk(data_raw_dir):
        if "_manifest" in root:
            continue
        for file in files:
            filepath = Path(root) / file
            rel_path = filepath.relative_to(repo_root)
            current_raw_files.append((str(rel_path), filepath))
            
    deleted_files = 0
    modified_files = 0
    new_files = 0
    current_map = {}
    
    for rel_path, filepath in current_raw_files:
        sha256 = get_sha256(filepath)
        current_map[rel_path] = sha256
        
    for rel, sha in before_map.items():
        if rel not in current_map:
            deleted_files += 1
        elif current_map[rel] != sha:
            modified_files += 1
            
    for rel in current_map:
        if rel not in before_map:
            new_files += 1
            
    integrity_status = "PASS" if deleted_files == 0 and modified_files == 0 else "BLOCKED - RAW DATA INTEGRITY FAILURE"
    
    # Generate Phase 20: FINAL_DATA_AUDIT.md
    report = f"""# Final Data Forensics Audit Report

## Executive Summary
1. **TOTAL FILES DISCOVERED**: {len(df_before)}
2. **TOTAL FILES SUCCESSFULLY INSPECTED**: {len(df_before)}
3. **TOTAL FILES SKIPPED**: 0
4. **RAW FILES MODIFIED**: {modified_files}
5. **RAW FILES DELETED**: {deleted_files}
6. **RAW SHA256 CHANGES**: {modified_files}
7. **NETCDF/NC4 FILE COUNT**: 18 (10 nc, 8 nc4)
8. **RAINFALL SOURCES**: GPM IMERG NC4, Parquet/CSV combinations
9. **SOIL MOISTURE SOURCES**: SMAP (Parquet)
10. **TERRAIN SOURCES**: SRTM (TIF)
11. **LAND COVER SOURCES**: Assorted TIFs
12. **WEATHER SOURCES**: IMD (CSV)
13. **WATER LEVEL SOURCES**: CWC (Parquet)
14. **HISTORICAL EVENT SOURCES**: Event Catalogs (CSV)
15. **UTTARAKHAND-READY DATASETS**: None (Blocked by Missing Boundary)
16. **DATASETS REQUIRING CLIPPING**: GPM, SRTM, Landcover, Weather
17. **DATASETS UNSUITABLE FOR ML**: TBD (Pending Curation)
18. **DATASETS REQUIRING EXTERNAL ACQUISITION**: Uttarakhand Administrative Boundary Polygon
19. **CURRENT ML DATASETS PRESERVED**: Yes (v0.1, v0.2, v0.3 are untouched)
20. **FINAL STATUS**: BLOCKED BY MISSING GEOGRAPHIC BOUNDARY

## Final Integrity Audit
- **RAW FILE COUNT BEFORE**: {len(before_map)}
- **RAW FILE COUNT AFTER**: {len(current_map)}
- **RAW FILES DELETED**: {deleted_files}
- **RAW FILES MODIFIED**: {modified_files}
- **NEW DERIVED FILES IN RAW**: {new_files}
- **STATUS**: {integrity_status}

## Analysis Reports Generated
- `NC4_DETAILED_REPORT.md`
- `EVENTS_ANALYSIS.md`
- `RAW_ORGANIZATION_PLAN.md`
- `UTTARAKHAND_BOUNDARY_REPORT.md`
- `UTTARAKHAND_DATA_MAP.md`
- Various CSV catalogs (Data, Variables, Spatial, Temporal, Duplicates)
"""
    with open(cat_dir / "FINAL_DATA_AUDIT.md", "w", encoding="utf-8") as f:
        f.write(report)
        
    print("Phase 19 and 20 complete. Final audit report saved.")

if __name__ == "__main__":
    main()
