import patoolib
import os
from pathlib import Path
import geopandas as gpd
import pandas as pd

out_dir = Path("data/processed/gis/pan_india_admin")
out_dir.mkdir(parents=True, exist_ok=True)

rar_path = "data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar"
# Extract only if not already extracted
if not (out_dir / "State Boundary.shp").exists() and not (out_dir / "State_Boundary.shp").exists() and not list(out_dir.glob("*.shp")):
    try:
        patoolib.extract_archive(rar_path, outdir=str(out_dir))
    except Exception as e:
        print(f"Error extracting: {e}")

# Find shapefiles
shps = list(out_dir.glob("**/*.shp"))
print(f"Shapefiles found: {[s.name for s in shps]}")

