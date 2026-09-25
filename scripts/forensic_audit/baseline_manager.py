import os
import shutil
import hashlib
import csv
from pathlib import Path

def get_sha256(file_path):
    hash_sha256 = hashlib.sha256()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    except FileNotFoundError:
        return None

def freeze_baseline(repo_root):
    reports_dir = Path(repo_root) / "data" / "processed" / "extraction" / "reports"
    baseline_dir = Path(repo_root) / "data" / "processed" / "extraction" / "forensic_baseline"
    baseline_dir.mkdir(parents=True, exist_ok=True)
    
    baseline_files = [
        "FINAL_INDEPENDENT_VERIFICATION.md",
        "FINAL_INDEPENDENT_VERIFICATION_SUMMARY.json",
        "INDEPENDENT_FILE_INVENTORY.csv",
        "INDEPENDENT_PDF_PAGE_AUDIT.csv",
        "INDEPENDENT_TABLE_AUDIT.csv",
        "INDEPENDENT_VISUAL_AUDIT.csv",
        "INDEPENDENT_OCR_AUDIT.csv",
        "INDEPENDENT_RASTER_AUDIT.csv",
        "INDEPENDENT_VECTOR_AUDIT.csv",
        "INDEPENDENT_STRUCTURED_AUDIT.csv",
        "INDEPENDENT_DOMAIN_ENTITY_AUDIT.csv",
        "INDEPENDENT_SOURCE_OUTPUT_RECONCILIATION.csv",
        "INDEPENDENT_INFORMATION_LOSS_MATRIX.csv"
    ]
    
    hashes = []
    
    for filename in baseline_files:
        src = reports_dir / filename
        dst = baseline_dir / filename
        if src.exists():
            # Never overwrite if frozen baseline already exists
            if not dst.exists():
                shutil.copy2(src, dst)
            file_hash = get_sha256(dst)
            hashes.append({"file": filename, "sha256": file_hash})
        else:
            print(f"Warning: Baseline file {filename} not found in {reports_dir}")
            
    hash_log = baseline_dir / "baseline_hashes.csv"
    if not hash_log.exists() and hashes:
        with open(hash_log, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["file", "sha256"])
            writer.writeheader()
            writer.writerows(hashes)
    print("Phase 0: Baseline frozen.")

def generate_raw_inventory(repo_root, output_csv):
    raw_dir = Path(repo_root) / "data" / "raw"
    inventory = []
    
    if not raw_dir.exists():
        raise FileNotFoundError(f"Raw directory not found: {raw_dir}")
        
    for root, _, files in os.walk(raw_dir):
        for file in files:
            file_path = Path(root) / file
            rel_path = file_path.relative_to(raw_dir).as_posix()
            
            # Skip hidden files or git files if any
            if file.startswith('.'):
                continue
                
            stat = file_path.stat()
            file_hash = get_sha256(file_path)
            
            inventory.append({
                "relative_path": rel_path,
                "file_size": stat.st_size,
                "SHA-256": file_hash,
                "extension": file_path.suffix.lower(),
                "content_type": "unknown", # to be refined if needed, but extension is primary
                "mtime": stat.st_mtime
            })
            
    # Sort for deterministic output
    inventory.sort(key=lambda x: x["relative_path"])
    
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["relative_path", "file_size", "SHA-256", "extension", "content_type", "mtime"])
        writer.writeheader()
        writer.writerows(inventory)
        
    print(f"Inventory generated: {len(inventory)} files found. Written to {output_csv}")
    return inventory

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[2]
    freeze_baseline(repo_root)
    out_csv = repo_root / "data" / "processed" / "extraction" / "recovery" / "fresh_raw_inventory.csv"
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    generate_raw_inventory(repo_root, out_csv)
