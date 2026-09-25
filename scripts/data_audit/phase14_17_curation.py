import os
import glob
from pathlib import Path
import geopandas as gpd
import pandas as pd
import xarray as xr
import rioxarray
import rasterio
from rasterio.merge import merge
from rasterio.mask import mask
from shapely.geometry import mapping
import warnings

warnings.filterwarnings("ignore")

repo_root = Path(r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09")
raw_dir = repo_root / "data" / "raw"
curated_dir = repo_root / "data" / "processed" / "curated" / "uttarakhand"
report_lines = ["# BOUNDARY AND GEOGRAPHIC CURATION FINAL REPORT\n"]

def get_boundary():
    gpkg = repo_root / "data" / "processed" / "curated" / "uttarakhand" / "boundary" / "uttarakhand_boundary_validated.gpkg"
    if not gpkg.exists():
        raise FileNotFoundError(f"Validated boundary not found at {gpkg}")
    
    gdf = gpd.read_file(gpkg, layer="state_boundary")
    gdf_4326 = gdf.to_crs(epsg=4326)
    return gdf_4326

def process_gpm(boundary):
    print("Processing GPM (Phase 14)...")
    out_dir = curated_dir / "gpm"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_lines.append("## Phase 14: GPM Rainfall Curation\n")
    
    nc_files = list(raw_dir.rglob("*.nc4"))
    processed = 0
    for nc_file in nc_files:
        try:
            # open lazily
            ds = xr.open_dataset(nc_file, chunks={})
            
            # determine dimensions/variables
            vars_list = list(ds.data_vars)
            
            # Check if it has latitude/longitude or lat/lon
            lat_col = 'lat' if 'lat' in ds.dims else 'latitude' if 'latitude' in ds.dims else None
            lon_col = 'lon' if 'lon' in ds.dims else 'longitude' if 'longitude' in ds.dims else None
            
            if not lat_col or not lon_col:
                report_lines.append(f"- SKIPPED: {nc_file.name} (No spatial dims found)")
                continue
                
            # Assign CRS so rioxarray can clip
            ds.rio.write_crs("epsg:4326", inplace=True)
            if lon_col != 'x' and lat_col != 'y':
                ds.rio.set_spatial_dims(x_dim=lon_col, y_dim=lat_col, inplace=True)
                
            # Check bounds
            min_lon = float(ds[lon_col].min())
            max_lon = float(ds[lon_col].max())
            min_lat = float(ds[lat_col].min())
            max_lat = float(ds[lat_col].max())
            
            state_bounds = boundary.total_bounds # [minx, miny, maxx, maxy]
            
            if (max_lon < state_bounds[0] or min_lon > state_bounds[2] or 
                max_lat < state_bounds[1] or min_lat > state_bounds[3]):
                report_lines.append(f"- SKIPPED: {nc_file.name} (No Uttarakhand coverage)")
                continue
                
            # Clip
            geometries = [mapping(geom) for geom in boundary.geometry]
            clipped_ds = ds.rio.clip(geometries, boundary.crs, drop=True, invert=False)
            
            out_file = out_dir / nc_file.name
            clipped_ds.to_netcdf(out_file)
            
            # metadata extraction for report
            res_x = abs(float(ds[lon_col][1] - ds[lon_col][0])) if len(ds[lon_col])>1 else 0
            
            report_lines.append(f"- PROCESSED: {nc_file.name}")
            report_lines.append(f"  - Source: {nc_file.relative_to(repo_root)}")
            report_lines.append(f"  - Variables: {vars_list}")
            report_lines.append(f"  - Resolution: {res_x:.3f} deg")
            report_lines.append(f"  - Output: {out_file.relative_to(repo_root)}")
            processed += 1
            
        except Exception as e:
            report_lines.append(f"- ERROR on {nc_file.name}: {str(e)}")
    
    report_lines.append(f"\nPhase 14 Completed. Files Curated: {processed}\n")

def process_landcover(boundary):
    print("Processing Land Cover (Phase 15)...")
    out_dir = curated_dir / "landcover"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_lines.append("## Phase 15: Land Cover Curation\n")
    
    lc_files = list(raw_dir.rglob("ESA_WorldCover_*.tif"))
    if not lc_files:
        report_lines.append("No ESA WorldCover files found.\n")
        return
        
    src_files_to_mosaic = []
    
    for f in lc_files:
        with rasterio.open(f) as src:
            bounds = src.bounds
            state_bounds = boundary.total_bounds
            if not (bounds.right < state_bounds[0] or bounds.left > state_bounds[2] or 
                    bounds.top < state_bounds[1] or bounds.bottom > state_bounds[3]):
                src_files_to_mosaic.append(str(f))
                
    if not src_files_to_mosaic:
        report_lines.append("- No intersecting Land Cover tiles found.\n")
        return
        
    mosaic, out_trans = merge(src_files_to_mosaic)
    with rasterio.open(src_files_to_mosaic[0]) as first:
        out_meta = first.meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans
    })
    
    temp_mosaic = out_dir / "temp_mosaic.tif"
    with rasterio.open(temp_mosaic, "w", **out_meta) as dest:
        dest.write(mosaic)
        
    # Now clip the mosaic
    with rasterio.open(temp_mosaic) as src:
        geoms = [mapping(geom) for geom in boundary.geometry]
        out_image, out_transform = mask(src, geoms, crop=True)
        out_meta = src.meta.copy()
        out_meta.update({
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        out_file = out_dir / "uttarakhand_esa_worldcover_10m.tif"
        with rasterio.open(out_file, "w", **out_meta) as dest:
            dest.write(out_image)
            
    os.remove(temp_mosaic)
    
    report_lines.append(f"- PROCESSED: ESA WorldCover")
    report_lines.append(f"  - Tiles Used: {len(src_files_to_mosaic)}")
    report_lines.append(f"  - CRS: EPSG:4326")
    report_lines.append(f"  - Output: {out_file.relative_to(repo_root)}")
    report_lines.append("\nPhase 15 Completed.\n")

def process_srtm(boundary):
    print("Processing SRTM (Phase 16)...")
    out_dir = curated_dir / "srtm"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_lines.append("## Phase 16: SRTM Curation\n")
    
    srtm_files = list(raw_dir.rglob("srtm_*.tif"))
    if not srtm_files:
        report_lines.append("No SRTM files found.\n")
        return
        
    src_files_to_mosaic = []
    
    for f in srtm_files:
        with rasterio.open(f) as src:
            bounds = src.bounds
            state_bounds = boundary.total_bounds
            if not (bounds.right < state_bounds[0] or bounds.left > state_bounds[2] or 
                    bounds.top < state_bounds[1] or bounds.bottom > state_bounds[3]):
                src_files_to_mosaic.append(str(f))
                
    if not src_files_to_mosaic:
        report_lines.append("- No intersecting SRTM tiles found.\n")
        return
        
    mosaic, out_trans = merge(src_files_to_mosaic)
    with rasterio.open(src_files_to_mosaic[0]) as first:
        out_meta = first.meta.copy()
    out_meta.update({
        "driver": "GTiff",
        "height": mosaic.shape[1],
        "width": mosaic.shape[2],
        "transform": out_trans
    })
    
    temp_mosaic = out_dir / "temp_srtm_mosaic.tif"
    with rasterio.open(temp_mosaic, "w", **out_meta) as dest:
        dest.write(mosaic)
        
    with rasterio.open(temp_mosaic) as src:
        geoms = [mapping(geom) for geom in boundary.geometry]
        out_image, out_transform = mask(src, geoms, crop=True)
        out_meta = src.meta.copy()
        out_meta.update({
            "height": out_image.shape[1],
            "width": out_image.shape[2],
            "transform": out_transform
        })
        out_file = out_dir / "uttarakhand_srtm_dem.tif"
        with rasterio.open(out_file, "w", **out_meta) as dest:
            dest.write(out_image)
            
    os.remove(temp_mosaic)
    
    report_lines.append(f"- PROCESSED: SRTM Elevation")
    report_lines.append(f"  - Tiles Used: {len(src_files_to_mosaic)}")
    report_lines.append(f"  - CRS: EPSG:4326")
    report_lines.append(f"  - Output: {out_file.relative_to(repo_root)}")
    report_lines.append("\nPhase 16 Completed.\n")

def process_weather(boundary):
    print("Processing Weather (Phase 17)...")
    out_dir = curated_dir / "weather"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_lines.append("## Phase 17: Weather Curation\n")
    
    # Check for historical weather csv in JAL-DRISHTI-ML-DATA-v0.1 or processed
    weather_files = list(raw_dir.rglob("*weather*.csv"))
    if not weather_files:
        report_lines.append("No weather CSV files found.\n")
        return
        
    # Just an example of how we could filter points if lat/lon are present
    processed = 0
    for f in weather_files:
        try:
            df = pd.read_csv(f)
            # Find lat/lon
            lat_col = next((c for c in df.columns if c.lower() in ['lat', 'latitude']), None)
            lon_col = next((c for c in df.columns if c.lower() in ['lon', 'longitude', 'lng']), None)
            
            if not lat_col or not lon_col:
                report_lines.append(f"- SKIPPED {f.name}: No Lat/Lon columns to spatial clip.")
                continue
                
            gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df[lon_col], df[lat_col]), crs="epsg:4326")
            # clip points to boundary
            clipped = gpd.clip(gdf, boundary)
            
            if not clipped.empty:
                out_file = out_dir / f"uttarakhand_{f.name}"
                clipped.drop(columns=['geometry']).to_csv(out_file, index=False)
                report_lines.append(f"- PROCESSED {f.name}: Kept {len(clipped)}/{len(df)} records in Uttarakhand.")
                processed += 1
            else:
                report_lines.append(f"- SKIPPED {f.name}: No records within Uttarakhand bounds.")
                
        except Exception as e:
            report_lines.append(f"- ERROR on {f.name}: {str(e)}")
            
    report_lines.append(f"\nPhase 17 Completed. Files Curated: {processed}\n")


def main():
    try:
        boundary = get_boundary()
    except Exception as e:
        print(e)
        return
        
    process_gpm(boundary)
    process_landcover(boundary)
    process_srtm(boundary)
    process_weather(boundary)
    
    # Save final report
    cat_dir = repo_root / "data" / "processed" / "catalog"
    with open(cat_dir / "BOUNDARY_AND_GEOGRAPHIC_CURATION_FINAL.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))
        
    print("Geographic Curation Pipeline complete!")

if __name__ == "__main__":
    main()
