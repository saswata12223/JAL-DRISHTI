"""
package_jal_drishti_ml_dataset_v0_1.py

Script to package JAL-DRISHTI-ML-DATA-v0.1 into a clean zip archive for ML teammate delivery.
"""

import os
import sys
import zipfile
import hashlib
import pandas as pd
from pathlib import Path

DATASET_DIR = Path("data/processed/training/JAL-DRISHTI-ML-DATA-v0.1")
ZIP_PATH = Path("data/processed/training/JAL-DRISHTI-ML-DATA-v0.1.zip")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def create_readme():
    readme_path = DATASET_DIR / "README.md"
    content = """# JAL-DRISHTI-ML-DATA-v0.1

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
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"[OK] Created {readme_path}")

def update_checksums():
    checksum_path = DATASET_DIR / "SHA256SUMS.txt"
    entries = []
    for root, _, files in os.walk(DATASET_DIR):
        for file in sorted(files):
            if file == "SHA256SUMS.txt":
                continue
            fp = Path(root) / file
            rel_path = fp.relative_to(DATASET_DIR).as_posix()
            chsum = sha256_file(fp)
            entries.append(f"{chsum}  {rel_path}")
    
    with open(checksum_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sorted(entries)) + "\n")
    print(f"[OK] Updated SHA256SUMS.txt with {len(entries)} entries")

def verify_and_print_contents():
    print("\n==================================================")
    print("VERIFYING DATASET PACKAGE CONTENTS")
    print("==================================================")
    
    total_bytes = 0

    for root, _, files in os.walk(DATASET_DIR):
        for file in sorted(files):
            fp = Path(root) / file
            rel_path = fp.relative_to(DATASET_DIR).as_posix()
            sz = fp.stat().st_size
            total_bytes += sz
            
            if file.endswith(".parquet"):
                df = pd.read_parquet(fp)
                rows, cols = df.shape
                print(f" - {rel_path:<50} | Size: {sz:>8} B | Rows: {rows:>5} | Cols: {cols:>2}")
            else:
                print(f" - {rel_path:<50} | Size: {sz:>8} B")

    print("--------------------------------------------------")
    print(f"Total Package Size: {total_bytes} bytes ({total_bytes / (1024*1024):.2f} MB)")
    print("--------------------------------------------------")
    return total_bytes

def create_zip():
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
        
    print(f"\nPackaging ZIP archive into {ZIP_PATH}...")
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(DATASET_DIR):
            for file in sorted(files):
                fp = Path(root) / file
                arc_name = Path("JAL-DRISHTI-ML-DATA-v0.1") / fp.relative_to(DATASET_DIR)
                zf.write(fp, arc_name)
                
    zip_sz = ZIP_PATH.stat().st_size
    zip_sha = sha256_file(ZIP_PATH)
    print(f"[OK] ZIP created successfully.")
    print(f"     ZIP Path: {ZIP_PATH.resolve()}")
    print(f"     ZIP Size: {zip_sz} bytes ({zip_sz / (1024*1024):.2f} MB)")
    print(f"     ZIP SHA256: {zip_sha}")

    print("\nVerifying ZIP archive integrity...")
    with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
        corrupt = zf.testzip()
        if corrupt is not None:
            print(f"[ERROR] Corrupt file in zip: {corrupt}")
            sys.exit(1)
        names = zf.namelist()
        print(f"[OK] ZIP contains {len(names)} archived entries.")
        
    return zip_sz, zip_sha

def main():
    if not DATASET_DIR.exists():
        print(f"[ERROR] Target directory {DATASET_DIR} does not exist!")
        sys.exit(1)
        
    create_readme()
    update_checksums()
    total_bytes = verify_and_print_contents()
    zip_sz, zip_sha = create_zip()

if __name__ == "__main__":
    main()
