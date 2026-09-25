from pathlib import Path
from .config import Status, ContentType

def analyze_spatial(file_path: Path):
    """
    Since GDAL, rasterio, geopandas, pyogrio are all UNAVAILABLE,
    we can only perform a shallow metadata check (file size, extension) 
    and log the missing dependency limitation.
    """
    file_ext = file_path.suffix.lower()
    
    if file_ext in [".tif", ".tiff", ".img", ".jp2"]:
        content_type = ContentType.RASTER
    elif file_ext in [".shp", ".gpkg", ".geojson", ".geojsonl"]:
        content_type = ContentType.VECTOR
    else:
        return None # Not spatial
        
    return {
        "content_type": content_type,
        "detection_status": Status.EXTRACTED,
        "extraction_status": Status.UNRESOLVED,
        "extraction_method": "None",
        "confidence": 0.0,
        "failure_reason": "DEPENDENCY_FAILURE (rasterio/geopandas/gdal unavailable)"
    }
