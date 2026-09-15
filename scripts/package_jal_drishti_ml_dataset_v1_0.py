"""
package_jal_drishti_ml_dataset_v1_0.py

Script to package JAL-DRISHTI-ML-DATA-v1.0 into a clean ZIP archive for ML teammate handover.
"""

import os
import sys
import zipfile
import hashlib
import pandas as pd
from pathlib import Path

DATASET_DIR = Path("data/processed/training/JAL-DRISHTI-ML-DATA-v1.0")
ZIP_PATH = Path("data/processed/training/JAL-DRISHTI-ML-DATA-v1.0.zip")

def sha256_file(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

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
                print(f" - {rel_path:<55} | Size: {sz:>8} B | Rows: {rows:>5} | Cols: {cols:>2}")
            else:
                print(f" - {rel_path:<55} | Size: {sz:>8} B")

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
                arc_name = Path("JAL-DRISHTI-ML-DATA-v1.0") / fp.relative_to(DATASET_DIR)
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
        
    update_checksums()
    total_bytes = verify_and_print_contents()
    zip_sz, zip_sha = create_zip()

if __name__ == "__main__":
    main()
