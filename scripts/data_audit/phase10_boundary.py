import pandas as pd
import geopandas as gpd
from pathlib import Path
import os

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    geo_csv = repo_root / "data" / "processed" / "catalog" / "GEOSPATIAL_INVENTORY.csv"
    
    if not geo_csv.exists():
        print("GEOSPATIAL_INVENTORY.csv not found.")
        return
        
    df = pd.read_csv(geo_csv)
    vectors = df[df['type'] == 'vector']
    
    boundary_found = False
    best_boundary = None
    
    report_lines = ["# Phase 10: Uttarakhand Boundary Discovery\n"]
    report_lines.append("## Search Results\n")
    
    for idx, row in vectors.iterrows():
        filepath = Path(row['filepath'])
        try:
            gdf = gpd.read_file(filepath)
            # search all string columns for 'uttarakhand'
            str_cols = gdf.select_dtypes(include=['object']).columns
            found = False
            for col in str_cols:
                if gdf[col].str.contains('uttarakhand', case=False, na=False).any():
                    found = True
                    break
                    
            if found:
                report_lines.append(f"- **{filepath.name}**: Contains 'Uttarakhand' in attributes. CRS: {gdf.crs}")
                if not boundary_found:
                    best_boundary = filepath
                    boundary_found = True
            else:
                # check filename
                if 'uttarakhand' in filepath.name.lower():
                    report_lines.append(f"- **{filepath.name}**: Filename implies Uttarakhand. CRS: {gdf.crs}")
                    if not boundary_found:
                        best_boundary = filepath
                        boundary_found = True
        except Exception as e:
            report_lines.append(f"- Error reading {filepath.name}: {str(e)}")
            
    if boundary_found:
        report_lines.append(f"\n## Conclusion\nUTTARAKHAND_BOUNDARY_SOURCE = {best_boundary.name}\n(Path: {best_boundary})")
    else:
        report_lines.append("\n## Conclusion\nUTTARAKHAND_BOUNDARY = NOT AVAILABLE")
        
    out_md = repo_root / "data" / "processed" / "catalog" / "UTTARAKHAND_BOUNDARY_REPORT.md"
    with open(out_md, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print(f"Phase 10 complete. Report saved to {out_md}")

if __name__ == "__main__":
    main()
