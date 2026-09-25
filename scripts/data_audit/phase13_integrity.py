import pandas as pd
from pathlib import Path
import hashlib
import os

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
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
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
            
    report_lines = ["# Phase 13: Raw Integrity Verification\n"]
    
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
            report_lines.append(f"- **DELETED**: {rel}")
        elif current_map[rel] != sha:
            modified_files += 1
            report_lines.append(f"- **MODIFIED**: {rel} (Hash changed)")
            
    for rel in current_map:
        if rel not in before_map:
            new_files += 1
            report_lines.append(f"- **NEW**: {rel}")
            
    report_lines.append(f"\n- **RAW FILE COUNT BEFORE**: {len(before_map)}")
    report_lines.append(f"- **RAW FILE COUNT AFTER**: {len(current_map)}")
    report_lines.append(f"- **RAW FILES DELETED**: {deleted_files}")
    report_lines.append(f"- **RAW FILES MODIFIED**: {modified_files}")
    report_lines.append(f"- **NEW FILES**: {new_files}")
    
    if deleted_files == 0 and modified_files == 0:
        report_lines.append("\n**STATUS: PASS - RAW DATA INTEGRITY MAINTAINED**")
    else:
        report_lines.append("\n**STATUS: BLOCKED - RAW DATA INTEGRITY FAILURE**")
        
    out_md = repo_root / "data" / "processed" / "catalog" / "RAW_INTEGRITY_REPORT.md"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"Phase 13 complete. Integrity verified: Modified={modified_files}, Deleted={deleted_files}")

if __name__ == "__main__":
    main()
