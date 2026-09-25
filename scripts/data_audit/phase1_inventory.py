import os
import hashlib
import csv
from datetime import datetime
from pathlib import Path

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
    data_raw_dir = repo_root / "data" / "raw"
    data_processed_dir = repo_root / "data" / "processed"
    
    manifest_dir = data_raw_dir / "_manifest"
    manifest_dir.mkdir(parents=True, exist_ok=True)
    
    inventory_file = manifest_dir / "raw_inventory_before.csv"
    hashes_file = manifest_dir / "raw_hashes_before.csv"
    
    directories_to_scan = [data_raw_dir, data_processed_dir]
    
    inventory_data = []
    
    for directory in directories_to_scan:
        if not directory.exists():
            continue
        for root, _, files in os.walk(directory):
            # Skip _manifest itself during scan
            if "_manifest" in root:
                continue
            for file in files:
                filepath = Path(root) / file
                try:
                    stat = filepath.stat()
                    rel_path = filepath.relative_to(repo_root)
                    size = stat.st_size
                    mod_time = datetime.fromtimestamp(stat.st_mtime).isoformat()
                    ext = filepath.suffix.lower()
                    sha256 = get_sha256(filepath)
                    
                    category = rel_path.parts[1] if len(rel_path.parts) > 1 else "unknown"
                    sub_category = rel_path.parts[2] if len(rel_path.parts) > 2 else ""
                    
                    inventory_data.append({
                        "absolute_path": str(filepath),
                        "relative_path": str(rel_path),
                        "filename": file,
                        "extension": ext,
                        "size": size,
                        "sha256": sha256,
                        "modified_time": mod_time,
                        "source_category": category,
                        "detected_format": ext.replace(".", "")
                    })
                except Exception as e:
                    print(f"Failed to process {filepath}: {e}")
                    
    # Write inventory
    with open(inventory_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "absolute_path", "relative_path", "filename", "extension", 
            "size", "sha256", "modified_time", "source_category", "detected_format"
        ])
        writer.writeheader()
        writer.writerows(inventory_data)
        
    # Write hashes (same data, just to fulfill requirement)
    with open(hashes_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["relative_path", "sha256"])
        writer.writeheader()
        for row in inventory_data:
            writer.writerow({"relative_path": row["relative_path"], "sha256": row["sha256"]})
            
    print(f"Inventory saved to {inventory_file}")
    print(f"Hashes saved to {hashes_file}")
    print(f"Total files processed: {len(inventory_data)}")

if __name__ == "__main__":
    main()
