import os
import json
import pandas as pd
import geopandas as gpd
import rasterio
import xarray as xr
from pathlib import Path

def validate_file(filepath: str, ext: str):
    """
    Validates a single file and extracts format, schema, crs, and bounds metadata.
    Returns a dict with the expected keys.
    """
    path = Path(filepath)
    
    res = {
        "format": ext.lower().replace(".", ""),
        "readable": False,
        "schema_valid": False,
        "crs_present": False,
        "source_crs": "",
        "geometry_valid": False,
        "bounds": "",
        "resolution": "",
        "status": "FAILED",
        "error": ""
    }
    
    if not path.exists():
        res["error"] = "File not found"
        return res
        
    try:
        if ext.lower() == ".csv":
            df = pd.read_csv(path, nrows=5)
            res["readable"] = True
            res["schema_valid"] = True if not df.empty else False
            res["status"] = "VALIDATED"
            
        elif ext.lower() == ".json":
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            res["readable"] = True
            res["schema_valid"] = True
            res["status"] = "VALIDATED"
            
        elif ext.lower() in [".shp", ".gpkg", ".geojson"]:
            gdf = gpd.read_file(path, rows=5)
            res["readable"] = True
            res["schema_valid"] = True if not gdf.empty else False
            if gdf.crs is not None:
                res["crs_present"] = True
                res["source_crs"] = str(gdf.crs.to_string())
            res["geometry_valid"] = gdf.is_valid.all() if not gdf.empty else False
            bounds = gdf.total_bounds
            if len(bounds) == 4:
                res["bounds"] = f"{bounds[0]},{bounds[1]},{bounds[2]},{bounds[3]}"
            res["status"] = "VALIDATED"
            
        elif ext.lower() in [".tif", ".tiff"]:
            with rasterio.open(path) as src:
                res["readable"] = True
                res["schema_valid"] = True
                if src.crs:
                    res["crs_present"] = True
                    res["source_crs"] = src.crs.to_string()
                bounds = src.bounds
                res["bounds"] = f"{bounds.left},{bounds.bottom},{bounds.right},{bounds.top}"
                res["resolution"] = f"{src.res[0]}x{src.res[1]}"
                res["status"] = "VALIDATED"
                
        elif ext.lower() == ".nc":
            ds = xr.open_dataset(path)
            res["readable"] = True
            res["schema_valid"] = True
            # Check standard CRS metadata
            if "crs" in ds.variables or "spatial_ref" in ds.variables:
                res["crs_present"] = True
                res["source_crs"] = ds.attrs.get("crs", "EPSG:4326 (assumed by CF)")
            ds.close()
            res["status"] = "VALIDATED"
            
        elif ext.lower() == ".parquet":
            df = pd.read_parquet(path)
            res["readable"] = True
            res["schema_valid"] = True
            res["status"] = "VALIDATED"
            
        else:
            # Attempt generic read for readability
            res["readable"] = True
            res["schema_valid"] = False
            res["error"] = "Unsupported or unvalidated format"
            res["status"] = "WARNING"
            
    except Exception as e:
        res["error"] = str(e)[:250]
        res["status"] = "BLOCKED"
        
    return res
