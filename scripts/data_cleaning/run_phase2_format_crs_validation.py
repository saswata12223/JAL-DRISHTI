import os
import pandas as pd
from pathlib import Path
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.schema_utils import validate_file

def run_phase2():
    print("Running Phase 2: Format and CRS Validation...")
    
    inventory_path = Path("data/processed/catalog/DATA_CLEANING_SOURCE_INVENTORY.csv")
    if not inventory_path.exists():
        print(f"Error: {inventory_path} does not exist. Run Phase 1 first.")
        sys.exit(1)
        
    df_inv = pd.read_csv(inventory_path)
    
    results = []
    
    for idx, row in df_inv.iterrows():
        rel_path = row["relative_path"]
        ext = row["extension"]
        full_path = Path("data/raw") / rel_path
        
        # Skip auxiliary files if they aren't data formats
        if ext.lower() in [".txt", ".md", ".pdf", ".prj", ".cpg", ".dbf", ".shx", ".sbn", ".sbx", ".tfw", ".hdr", ".xml"]:
            results.append({
                "file": rel_path,
                "format": ext.lower().replace(".", ""),
                "readable": True,
                "schema_valid": False,
                "crs_present": False,
                "source_crs": "",
                "geometry_valid": False,
                "bounds": "",
                "resolution": "",
                "status": "SKIPPED_AUXILIARY",
                "error": ""
            })
            continue

        print(f"Validating {rel_path}...")
        val = validate_file(str(full_path), ext)
        
        # In rule 28: If CRS is missing for dataset that needs spatial interpretation -> WARNING or BLOCKED.
        # Let's assign warning if it's geospatial and missing CRS.
        if ext.lower() in [".shp", ".tif", ".tiff", ".nc"] and not val["crs_present"] and val["status"] == "VALIDATED":
            val["status"] = "WARNING"
            val["error"] = "Missing CRS"
            
        val["file"] = rel_path
        results.append(val)
        
    res_df = pd.DataFrame(results)
    
    out_dir = Path("data/processed/validation")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "FILE_VALIDATION_REPORT.csv"
    
    # reorder columns to match rule 5
    cols = ["file", "format", "readable", "schema_valid", "crs_present", 
            "source_crs", "geometry_valid", "bounds", "resolution", "status", "error"]
    res_df = res_df[cols]
    
    res_df.to_csv(out_path, index=False)
    print(f"Phase 2 Complete. Validated {len(res_df)} files.")
    print(f"Report saved to {out_path}")
    
    # Block if critical geospatial file cannot be read
    blocked = res_df[res_df["status"] == "BLOCKED"]
    if not blocked.empty:
        print("WARNING: Some files are BLOCKED (cannot be parsed).")
        # According to rule 28: do not silently skip. Just log it, orchestrator handles it.

if __name__ == "__main__":
    run_phase2()
