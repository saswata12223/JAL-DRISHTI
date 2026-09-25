import pandas as pd
import rasterio
import geopandas as gpd
from pathlib import Path
import os

def inspect_raster(filepath):
    try:
        with rasterio.open(filepath) as src:
            bounds = src.bounds
            stats = []
            
            # calculate min/max safely for small rasters, or just read tags/stats if available
            # to be safe and fast, we won't compute full min/max for huge files unless necessary
            # let's just grab basic metadata
            
            return {
                "filepath": str(filepath),
                "type": "raster",
                "crs": str(src.crs),
                "bounds": f"{bounds.left}, {bounds.bottom}, {bounds.right}, {bounds.top}",
                "resolution": str(src.res),
                "dimensions": f"{src.width}x{src.height}",
                "band_count": src.count,
                "data_type": str(src.dtypes),
                "nodata": str(src.nodatavals),
                "status": "SUCCESS"
            }
    except Exception as e:
        return {"filepath": str(filepath), "type": "raster", "status": f"ERROR: {str(e)}"}

def inspect_vector(filepath):
    try:
        gdf = gpd.read_file(filepath)
        bounds = gdf.total_bounds
        geom_types = list(gdf.geom_type.unique())
        validity = gdf.is_valid.all()
        
        return {
            "filepath": str(filepath),
            "type": "vector",
            "crs": str(gdf.crs),
            "geometry_type": str(geom_types),
            "bounds": f"{bounds[0]}, {bounds[1]}, {bounds[2]}, {bounds[3]}",
            "feature_count": len(gdf),
            "attribute_fields": str(list(gdf.columns)),
            "geometry_validity": "Valid" if validity else "Contains Invalid Geometries",
            "status": "SUCCESS"
        }
    except Exception as e:
        return {"filepath": str(filepath), "type": "vector", "status": f"ERROR: {str(e)}"}

def main():
    repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
    manifest_csv = repo_root / "data" / "raw" / "_manifest" / "raw_inventory_before.csv"
    
    if not manifest_csv.exists():
        print("Manifest not found.")
        return
        
    df = pd.read_csv(manifest_csv)
    raw_files = df[df['source_category'] == 'raw']
    
    results = []
    
    for idx, row in raw_files.iterrows():
        ext = row['extension'].lower()
        filepath = Path(row['absolute_path'])
        
        if ext in ['.tif', '.tiff']:
            res = inspect_raster(filepath)
            results.append(res)
        elif ext in ['.shp', '.geojson', '.gpkg']:
            res = inspect_vector(filepath)
            results.append(res)
            
    out_dir = repo_root / "data" / "processed" / "catalog"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_csv = out_dir / "GEOSPATIAL_INVENTORY.csv"
    
    if results:
        results_df = pd.DataFrame(results)
        results_df.to_csv(out_csv, index=False)
        print(f"Phase 5 complete. Results saved to {out_csv}")
    else:
        print("No geospatial files found.")

if __name__ == "__main__":
    main()
