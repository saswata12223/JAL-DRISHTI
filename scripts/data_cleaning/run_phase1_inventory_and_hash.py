import os
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone
import sys

# Add parent directory to path so we can import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.hashing import calculate_sha256

def run_phase1():
    print("Running Phase 1: Inventory and Hash...")
    
    raw_dir = Path("data/raw")
    if not raw_dir.exists():
        print(f"Error: {raw_dir} does not exist.")
        sys.exit(1)
        
    inventory = []
    hashes = []
    
    files = list(raw_dir.rglob("*.*"))
    for f in files:
        if f.is_file():
            rel_path = f.relative_to(raw_dir).as_posix()
            
            # Record inventory
            stat = f.stat()
            size = stat.st_size
            mod_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
            ext = f.suffix
            
            # Determine high-level dataset type
            if "rainfall" in f.name.lower():
                dataset_type = "Rainfall"
            elif "smap" in f.name.lower():
                dataset_type = "Soil Moisture"
            elif "srtm" in f.name.lower() or "dem" in f.name.lower():
                dataset_type = "DEM"
            elif "water_level" in f.name.lower() or "gwl" in f.name.lower():
                dataset_type = "Water Level"
            elif "humid" in f.name.lower():
                dataset_type = "Humidity"
            elif "discharge" in f.name.lower():
                dataset_type = "Discharge"
            elif "event" in f.name.lower() or "flood" in f.name.lower():
                dataset_type = "Flood Events"
            elif "catchment" in f.name.lower() or "bdy" in f.name.lower():
                dataset_type = "Boundary"
            else:
                dataset_type = "Other"

            sha256_hash = calculate_sha256(f)
            
            inventory.append({
                "relative_path": rel_path,
                "filename": f.name,
                "extension": ext,
                "size_bytes": size,
                "modified_time": mod_time,
                "sha256": sha256_hash,
                "dataset_type": dataset_type
            })
            
            hashes.append({
                "relative_path": rel_path,
                "sha256": sha256_hash
            })
            
    inventory_df = pd.DataFrame(inventory)
    hashes_df = pd.DataFrame(hashes)
    
    out_dir = Path("data/processed/catalog")
    out_dir.mkdir(parents=True, exist_ok=True)
    
    inventory_out = out_dir / "DATA_CLEANING_SOURCE_INVENTORY.csv"
    hashes_out = out_dir / "RAW_SHA256_BEFORE_CLEANING.csv"
    
    inventory_df.to_csv(inventory_out, index=False)
    hashes_df.to_csv(hashes_out, index=False)
    
    print(f"Phase 1 Complete. Processed {len(inventory_df)} files.")
    print(f"Inventory saved to {inventory_out}")
    print(f"Hashes saved to {hashes_out}")

if __name__ == "__main__":
    run_phase1()
