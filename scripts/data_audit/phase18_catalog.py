import pandas as pd
from pathlib import Path
import os

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    cat_dir = repo_root / "data" / "processed" / "catalog"
    
    # We already have:
    # GEOSPATIAL_INVENTORY.csv
    # NC4_INVENTORY.csv
    # PHASE3_FORMAT_IDENTIFICATION.csv
    # TEMPORAL_COVERAGE.csv
    # VARIABLE_DICTIONARY.csv
    # SPATIAL_COVERAGE.csv
    # DUPLICATE_REPORT.csv
    
    # We need DATA_CATALOG.csv combining basic file info
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    if manifest_csv.exists():
        df = pd.read_csv(manifest_csv)
        df_raw = df[df['source_category'] == 'raw'].copy()
        
        # assign dataset_id
        df_raw['dataset_id'] = [f"RAW_{str(i).zfill(3)}" for i in range(len(df_raw))]
        
        df_raw.to_csv(cat_dir / "DATA_CATALOG.csv", index=False)
        
    # UTTARAKHAND_DATA_MAP.md
    report_lines = [
        "# Uttarakhand Data Map\n",
        "1. **What rainfall data exists?**: Found GPM IMERG NC4 files, some CSV/Parquet.",
        "2. **What soil moisture data exists?**: SMAP data appears to be present in CSV/Parquet formats.",
        "3. **What terrain data exists?**: SRTM TIF tiles are present.",
        "4. **What land-cover data exists?**: Landcover rasters are present.",
        "5. **What weather data exists?**: IMD weather CSV files are present.",
        "6. **What water-level data exists?**: CWC water level data is present.",
        "7. **What historical flood events exist?**: Event files are present.",
        "8. **What data covers all of Uttarakhand?**: Cannot be determined as Uttarakhand boundary is missing.",
        "9. **What data only covers selected locations?**: See SPATIAL_COVERAGE.csv.",
        "10. **What data has continuous historical coverage?**: Temporal analysis indicates continuous coverage is LIKELY available for rainfall.",
        "11. **What data is event-only?**: Some datasets are clearly marked as event extracts.",
        "12. **What data is suitable for ML?**: Pending completion of curation.",
        "13. **What data is insufficient?**: Uttarakhand boundary is missing.",
        "14. **What data needs external acquisition?**: Uttarakhand administrative boundary polygon.",
        "15. **What data must remain excluded?**: Datasets without clear semantics.",
    ]
    with open(cat_dir / "UTTARAKHAND_DATA_MAP.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    # SOURCE_TO_MODEL_LINEAGE.md
    with open(cat_dir / "SOURCE_TO_MODEL_LINEAGE.md", "w", encoding="utf-8") as f:
        f.write("# Source to Model Lineage\n\n*Pending completion of Phase 14-17. Blocked by missing geographic boundary.*")
        
    # PROVENANCE_MANIFEST.csv
    pd.DataFrame(columns=["source_path", "source_sha256", "output_path", "output_sha256", "boundary_source", "crs", "spatial_operation", "temporal_filtering", "variables", "units", "creation_timestamp", "script"]).to_csv(cat_dir / "PROVENANCE_MANIFEST.csv", index=False)
    
    print(f"Phase 18 complete. Catalog files saved to {cat_dir}")

if __name__ == "__main__":
    main()
