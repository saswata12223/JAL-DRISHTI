import geopandas as gpd
import pandas as pd
from pathlib import Path

base = Path("data/processed/gis/pan_india_admin")
shps = list(base.glob("**/*.shp"))
state_shp = next(s for s in shps if "State" in s.name)
dist_shp = next(s for s in shps if "District" in s.name)
subd_shp = next(s for s in shps if "Sub_district" in s.name)

gdf_state = gpd.read_file(state_shp)
gdf_dist = gpd.read_file(dist_shp)
gdf_subd = gpd.read_file(subd_shp)

inventory = []

states = gdf_state['STATE'].dropna().unique()
for state in states:
    s_geom = gdf_state[gdf_state['STATE'] == state]
    
    # Matching state names between STATE and STATE_UT can be tricky due to casing/spaces
    # We will do a case-insensitive match
    dist_matches = gdf_dist[gdf_dist['STATE_UT'].str.upper() == state.upper()]
    subd_matches = gdf_subd[gdf_subd['STATE_UT'].str.upper() == state.upper()]
    
    dist_count = len(dist_matches)
    subd_count = len(subd_matches)
    
    # Try to grab STATE_LGD from district file since state file doesn't have it
    lgd = dist_matches['STATE_LGD'].iloc[0] if len(dist_matches) > 0 and 'STATE_LGD' in dist_matches.columns else ""
    
    inventory.append({
        "state_name": state,
        "state_identifier": str(lgd) if pd.notna(lgd) else "",
        "district_count": dist_count,
        "subdistrict_count": subd_count,
        "geometry_availability": "YES" if not s_geom.geometry.isnull().all() else "NO",
        "source_layer": "State Boundary",
        "crs": str(gdf_state.crs.name if gdf_state.crs else "Unknown")
    })

df = pd.DataFrame(inventory)
out_dir = Path("data/processed/gis/phase_pan_india")
df.to_csv(out_dir / "pan_india_admin_inventory.csv", index=False)
print("Updated Inventory generated.")
print(df.head())
