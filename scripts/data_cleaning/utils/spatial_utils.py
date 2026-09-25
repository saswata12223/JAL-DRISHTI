import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

def load_authoritative_boundary(bdy_path: str = "data/raw/reference_boundaries/uttarakhand/source/UTTARAKHAND_STATE_BDY.shp") -> gpd.GeoDataFrame:
    try:
        bdy = gpd.read_file(bdy_path)
        if bdy.crs != "EPSG:4326":
            bdy = bdy.to_crs("EPSG:4326")
        return bdy
    except Exception as e:
        print(f"Error loading authoritative boundary: {e}")
        return None

def validate_coordinates(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        if -90 <= lat <= 90 and -180 <= lon <= 180:
            return True
    except:
        pass
    return False

def check_intersection(gdf: gpd.GeoDataFrame, bdy: gpd.GeoDataFrame) -> pd.Series:
    """Returns a boolean series where True means it intersects with the boundary."""
    # Ensure same CRS
    if gdf.crs != bdy.crs:
        gdf = gdf.to_crs(bdy.crs)
        
    # We can do a spatial join or check intersects
    # Sjoin is faster for points
    joined = gpd.sjoin(gdf, bdy, how="left", predicate="intersects")
    
    # If the index of the boundary dataframe is in the joined result, it intersected
    return joined["index_right"].notna()
