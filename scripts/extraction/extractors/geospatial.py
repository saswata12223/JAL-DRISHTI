import json
import traceback
from pathlib import Path
from .structured import update_status
from ..database import get_db_connection, log_error
from ..config import DIRS

try:
    import rasterio
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

try:
    import geopandas as gpd
    HAS_GEOPANDAS = True
except ImportError:
    HAS_GEOPANDAS = False


def extract_geospatial(file_record):
    file_id = file_record['id']
    file_path = Path(file_record['absolute_path'])
    ext = file_record['extension']
    
    try:
        if ext in ['.tif', '.tiff']:
            if not HAS_RASTERIO:
                log_error(file_id, 'missing_dependency', 'rasterio missing for TIF', ['rasterio'], 'high')
                update_status(file_id, 'failed', 'geospatial', '1.0', error='rasterio missing')
                return
                
            with rasterio.open(file_path) as dataset:
                meta = {
                    "width": dataset.width,
                    "height": dataset.height,
                    "count": dataset.count,
                    "dtypes": dataset.dtypes,
                    "crs": dataset.crs.to_string() if dataset.crs else None,
                    "bounds": [dataset.bounds.left, dataset.bounds.bottom, dataset.bounds.right, dataset.bounds.top],
                    "transform": dataset.transform.to_gdal(),
                    "nodata": dataset.nodatavals
                }
                
                with open(DIRS['raster'] / f"{file_path.stem}_{file_id}_meta.json", "w", encoding="utf-8") as f:
                    json.dump(meta, f, indent=2)
                    
            update_status(file_id, 'completed', 'geospatial', '1.0')
            
        elif ext in ['.shp', '.gpkg']:
            if not HAS_GEOPANDAS:
                log_error(file_id, 'missing_dependency', 'geopandas missing for Vector', ['geopandas'], 'high')
                update_status(file_id, 'failed', 'geospatial', '1.0', error='geopandas missing')
                return
                
            gdf = gpd.read_file(file_path)
            meta = {
                "feature_count": len(gdf),
                "crs": str(gdf.crs) if gdf.crs else None,
                "bounds": list(gdf.total_bounds) if not gdf.empty else [],
                "columns": list(gdf.columns)
            }
            
            with open(DIRS['geospatial'] / f"{file_path.stem}_{file_id}_meta.json", "w", encoding="utf-8") as f:
                json.dump(meta, f, indent=2)
                
            # Exporting to GeoParquet if possible
            try:
                gdf.to_parquet(DIRS['geospatial'] / f"{file_path.stem}_{file_id}.parquet")
            except Exception as e:
                log_error(file_id, 'geoparquet_failed', str(e), ['pyarrow'], 'low')
                
            update_status(file_id, 'completed', 'geospatial', '1.0')
            
    except Exception as e:
        log_error(file_id, 'geospatial_failed', str(e) + "\n" + traceback.format_exc(), ['rasterio', 'geopandas'], 'high')
        update_status(file_id, 'failed', 'geospatial', '1.0', error=str(e))
