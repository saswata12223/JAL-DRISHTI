import os
import csv
from pathlib import Path

# Since GDAL and rasterio are missing native dependencies in the environment based on previous logs,
# we will use try/except and gracefully degrade.
try:
    import rasterio
except ImportError:
    rasterio = None

try:
    import shapefile # pyshp
except ImportError:
    shapefile = None

def process_rasters_and_vectors(repo_root):
    """
    Phases 18, 19, 20, 21: Raster and Vector Processing
    """
    raw_dir = Path(repo_root) / "data" / "raw"
    recovery_dir = Path(repo_root) / "data" / "processed" / "extraction" / "recovery"
    recovery_dir.mkdir(parents=True, exist_ok=True)
    
    raster_results = []
    vector_results = []
    
    for root, _, files in os.walk(raw_dir):
        for file in files:
            file_path = Path(root) / file
            rel_path = file_path.relative_to(raw_dir).as_posix()
            ext = file_path.suffix.lower()
            
            # Raster processing
            if ext in ['.tif', '.tiff', '.dem']:
                res = {
                    "source_file": rel_path,
                    "engine": "rasterio" if rasterio else "unresolved",
                    "dimensions": "unknown",
                    "bands": 0,
                    "dtype": "unknown",
                    "CRS": "unknown",
                    "EPSG": "unknown",
                    "resolution": "unknown",
                    "valid_pixels": 0,
                    "nodata_pixels": 0,
                    "status": "UNRESOLVED"
                }
                
                if rasterio:
                    try:
                        with rasterio.open(file_path) as src:
                            res["dimensions"] = f"{src.width}x{src.height}"
                            res["bands"] = src.count
                            res["dtype"] = src.dtypes[0] if src.dtypes else "unknown"
                            res["CRS"] = src.crs.to_string() if src.crs else "unknown"
                            if src.crs and src.crs.is_epsg_code:
                                res["EPSG"] = src.crs.to_epsg()
                            res["resolution"] = str(src.res)
                            res["status"] = "EXTRACTED"
                    except Exception as e:
                        print(f"Error processing raster {rel_path}: {e}")
                
                raster_results.append(res)
                
            # Vector processing
            elif ext == '.shp':
                res = {
                    "source_file": rel_path,
                    "engine": "pyshp" if shapefile else "unresolved",
                    "geometry_type": "unknown",
                    "feature_count": 0,
                    "fields": "unknown",
                    "status": "UNRESOLVED"
                }
                
                if shapefile:
                    try:
                        sf = shapefile.Reader(str(file_path))
                        res["geometry_type"] = sf.shapeTypeName
                        res["feature_count"] = len(sf)
                        res["fields"] = len(sf.fields) - 1 # first is DeletionFlag
                        res["status"] = "EXTRACTED"
                    except Exception as e:
                        print(f"Error processing shapefile {rel_path}: {e}")
                        
                vector_results.append(res)
                
    # Write CSVs
    if raster_results:
        with open(recovery_dir / "raster_validation_final.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=raster_results[0].keys())
            writer.writeheader()
            writer.writerows(raster_results)
            
    if vector_results:
        with open(recovery_dir / "vector_validation_final.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=vector_results[0].keys())
            writer.writeheader()
            writer.writerows(vector_results)
            
    print(f"Geospatial processing complete. Rasters: {len(raster_results)}, Vectors: {len(vector_results)}")

if __name__ == "__main__":
    repo_root = Path(__file__).resolve().parents[2]
    process_rasters_and_vectors(repo_root)
