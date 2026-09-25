import pandas as pd
from pathlib import Path
import re

def classify_bounds(min_lon, min_lat, max_lon, max_lat):
    # Very rough heuristics
    if min_lon <= -170 and max_lon >= 170 and min_lat <= -80 and max_lat >= 80:
        return "GLOBAL"
    if min_lon <= 65 and max_lon >= 135 and min_lat <= 5 and max_lat >= 55:
        return "ASIA"
    if min_lon >= 60 and max_lon <= 100 and min_lat >= 5 and max_lat <= 40:
        # Check if bounds closely match Uttarakhand
        if min_lon >= 77 and max_lon <= 81.5 and min_lat >= 28.5 and max_lat <= 31.5:
            return "UTTARAKHAND ONLY"
        elif min_lon >= 75 and max_lon <= 85 and min_lat >= 25 and max_lat <= 35:
            return "UTTARAKHAND + SURROUNDING"
        return "INDIA"
    return "UNKNOWN"

def parse_raster_bounds(b_str):
    try:
        parts = [float(x) for x in str(b_str).split(',')]
        if len(parts) == 4:
            return parts[0], parts[1], parts[2], parts[3]
    except:
        pass
    return None

def parse_nc4_bounds(b_str):
    try:
        # e.g. "Lon: 70.0 to 90.0, Lat: 20.0 to 40.0"
        if "unknown" in str(b_str).lower():
            return None
        matches = re.findall(r"[-+]?\d*\.\d+|\d+", b_str)
        if len(matches) >= 4:
            return float(matches[0]), float(matches[2]), float(matches[1]), float(matches[3])
    except:
        pass
    return None

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    cat_dir = repo_root / "data" / "processed" / "catalog"
    geo_csv = cat_dir / "GEOSPATIAL_INVENTORY.csv"
    nc4_csv = cat_dir / "NC4_INVENTORY.csv"
    
    results = []
    
    if geo_csv.exists():
        df_geo = pd.read_csv(geo_csv)
        for idx, row in df_geo.iterrows():
            bounds = parse_raster_bounds(row['bounds'])
            if bounds:
                cls = classify_bounds(*bounds)
                results.append({
                    "dataset": row['filepath'],
                    "actual_bounds": row['bounds'],
                    "geographic_classification": cls
                })
                
    if nc4_csv.exists():
        df_nc4 = pd.read_csv(nc4_csv)
        for idx, row in df_nc4.iterrows():
            bounds = parse_nc4_bounds(row['spatial_bounds'])
            if bounds:
                cls = classify_bounds(*bounds)
                results.append({
                    "dataset": row['filename'],
                    "actual_bounds": row['spatial_bounds'],
                    "geographic_classification": cls
                })
                
    out_csv = cat_dir / "SPATIAL_COVERAGE.csv"
    if results:
        pd.DataFrame(results).to_csv(out_csv, index=False)
        print(f"Phase 11 complete. Saved to {out_csv}")
    else:
        print("No spatial bounds found to classify.")

if __name__ == "__main__":
    main()
