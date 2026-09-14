"""

FlashFloodAI — Phase 1D: SRTM Elevation DEM Ingestion Module



Acquires, validates, mosaics, crops, and standardizes authoritative NASA/USGS SRTM

Digital Elevation Model (DEM) data covering Uttarakhand, India.



Data Source:

    - NASA / USGS Shuttle Radar Topography Mission (SRTM) 90m (3 arc-second, v4.1)

      and SRTMGL1 (1 arc-second, 30m).

    - Authoritative Public Provider: CGIAR-CSI / NASA JPL / USGS.



Target Region Bounding Box (Uttarakhand, India):

    - West: 77.8°E

    - East: 81.1°E

    - South: 28.5°N

    - North: 31.5°N



Tile Coverage (5°x5° CGIAR-CSI grid):

    - srtm_52_06: Lon 75°E–80°E, Lat 30°N–35°N (North-West Uttarakhand)

    - srtm_53_06: Lon 80°E–85°E, Lat 30°N–35°N (North-East Uttarakhand)

    - srtm_52_07: Lon 75°E–80°E, Lat 25°N–30°N (South-West Uttarakhand)

    - srtm_53_07: Lon 80°E–85°E, Lat 25°N–30°N (South-East Uttarakhand)



Output Files:

    - Raw: data/raw/srtm/ (Zip archives, raw GeoTIFF tiles, .hdr, .readme)

    - Processed:

        - data/processed/srtm/srtm_uttarakhand_dem.tif (GeoTIFF, EPSG:4326)

        - data/processed/srtm/srtm_uttarakhand_dem.nc (NetCDF-4)

        - data/processed/srtm/srtm_dem_metadata.json (Metadata summary)



Usage:

    python scripts/dem_ingest.py

"""



import json

import logging

import os

import sys

import zipfile

from datetime import datetime, timezone

from pathlib import Path

from typing import Any, Dict, List, Optional, Tuple



import numpy as np

import rasterio

from rasterio.crs import CRS

from rasterio.enums import Resampling

from rasterio.mask import mask

from rasterio.merge import merge

from rasterio.windows import from_bounds

from shapely.geometry import box

import urllib3

import xarray as xr



# Suppress insecure HTTPS request warnings

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

import requests



# ============================================================

# LOGGING CONFIGURATION

# ============================================================



logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s [%(levelname)s] %(message)s",

    datefmt="%Y-%m-%d %H:%M:%S",

)

logger = logging.getLogger("SRTM_DEM_Ingest")





# ============================================================

# CONFIGURATION & CONSTANTS

# ============================================================



PROJECT_DIR = Path(__file__).resolve().parent.parent

RAW_SRTM_DIR = PROJECT_DIR / "data" / "raw" / "srtm"

PROCESSED_SRTM_DIR = PROJECT_DIR / "data" / "processed" / "srtm"



# Uttarakhand Geographic Bounding Box

WEST = 77.8

EAST = 81.1

SOUTH = 28.5

NORTH = 31.5



# SRTM 5x5 Degree Tile Identifiers covering Uttarakhand

SRTM_TILES = [

    "srtm_52_06",  # 75°E - 80°E, 30°N - 35°N

    "srtm_53_06",  # 80°E - 85°E, 30°N - 35°N

    "srtm_52_07",  # 75°E - 80°E, 25°N - 30°N

    "srtm_53_07",  # 80°E - 85°E, 25°N - 30°N

]



SRTM_BASE_URL = "https://srtm.csi.cgiar.org/wp-content/uploads/files/srtm_5x5/TIFF/{}.zip"

SRTM_NODATA_VALUE = -32768





# ============================================================

# SRTM DEM INGESTION ENGINE

# ============================================================



class SRTMDEMIngestionEngine:

    """Ingestion and processing engine for NASA/USGS SRTM elevation data."""



    def __init__(self, raw_dir: Path = RAW_SRTM_DIR, processed_dir: Path = PROCESSED_SRTM_DIR):

        self.raw_dir = raw_dir

        self.processed_dir = processed_dir

        self.acquisition_time = datetime.now(timezone.utc)

        self.raw_dir.mkdir(parents=True, exist_ok=True)

        self.processed_dir.mkdir(parents=True, exist_ok=True)



    def download_tile(self, tile_id: str) -> Optional[Path]:

        """Download and extract a single SRTM tile zip archive."""

        zip_path = self.raw_dir / f"{tile_id}.zip"

        tif_path = self.raw_dir / f"{tile_id}.tif"



        if tif_path.exists() and tif_path.stat().st_size > 10000:

            logger.info(f"Tile {tile_id}.tif already exists in raw cache ({tif_path.stat().st_size:,} bytes).")

            return tif_path



        url = SRTM_BASE_URL.format(tile_id)

        logger.info(f"Downloading SRTM tile {tile_id} from {url}...")



        try:

            r = requests.get(url, stream=True, timeout=90)

            if r.status_code != 200:

                logger.error(f"Failed to download tile {tile_id}: HTTP {r.status_code}")

                return None



            with open(zip_path, "wb") as f:

                for chunk in r.iter_content(chunk_size=1024 * 1024):

                    if chunk:

                        f.write(chunk)



            logger.info(f"Downloaded {zip_path.name} ({zip_path.stat().st_size:,} bytes). Extracting...")

            with zipfile.ZipFile(zip_path, "r") as zf:

                zf.extractall(self.raw_dir)



            if tif_path.exists():

                logger.info(f"Successfully extracted {tif_path.name}")

                return tif_path

            else:

                logger.error(f"Extracted zip did not contain expected {tile_id}.tif")

                return None



        except Exception as e:

            logger.error(f"Error downloading/extracting tile {tile_id}: {e}")

            if zip_path.exists() and zip_path.stat().st_size == 0:

                zip_path.unlink()

            return None



    def acquire_all_tiles(self) -> List[Path]:

        """Acquire all required SRTM tiles covering Uttarakhand."""

        tile_paths = []

        for t in SRTM_TILES:

            path = self.download_tile(t)

            if path and path.exists():

                tile_paths.append(path)

            else:

                logger.warning(f"Tile {t} could not be acquired.")

        return tile_paths



    def mosaic_and_crop(self, tile_paths: List[Path]) -> Tuple[np.ndarray, rasterio.Affine, Dict[str, Any]]:

        """Mosaic raw SRTM tiles and crop precisely to the Uttarakhand bounding box."""

        if not tile_paths:

            raise RuntimeError("No SRTM tiles available to mosaic.")



        logger.info(f"Opening and merging {len(tile_paths)} SRTM tiles...")

        src_files = [rasterio.open(p) for p in tile_paths]



        # Merge raw tiles into continuous regional mosaic

        mosaic, mosaic_transform = merge(src_files, nodata=SRTM_NODATA_VALUE)

        meta = src_files[0].meta.copy()



        for src in src_files:

            src.close()



        # Update metadata for mosaic

        meta.update({

            "driver": "GTiff",

            "height": mosaic.shape[1],

            "width": mosaic.shape[2],

            "transform": mosaic_transform,

            "crs": CRS.from_epsg(4326),

            "nodata": SRTM_NODATA_VALUE,

            "count": 1,

            "dtype": mosaic.dtype,

        })



        # Calculate pixel window for Uttarakhand bounding box (WEST, SOUTH, EAST, NORTH)

        window = from_bounds(WEST, SOUTH, EAST, NORTH, mosaic_transform)

        # Round window to integer pixel boundaries

        row_start = max(0, int(np.floor(window.row_off)))

        col_start = max(0, int(np.floor(window.col_off)))

        row_stop = min(mosaic.shape[1], int(np.ceil(window.row_off + window.height)))

        col_stop = min(mosaic.shape[2], int(np.ceil(window.col_off + window.width)))



        cropped_dem = mosaic[0, row_start:row_stop, col_start:col_stop]



        # Compute new affine transform for the cropped extent

        new_west, new_north = rasterio.transform.xy(mosaic_transform, row_start, col_start, offset="ul")

        pixel_width = mosaic_transform.a

        pixel_height = mosaic_transform.e  # Negative in north-up rasters

        cropped_transform = rasterio.Affine(pixel_width, 0.0, new_west, 0.0, pixel_height, new_north)



        cropped_meta = meta.copy()

        cropped_meta.update({

            "height": cropped_dem.shape[0],

            "width": cropped_dem.shape[1],

            "transform": cropped_transform,

        })



        logger.info(f"Cropped DEM to Uttarakhand bounds: Shape={cropped_dem.shape}, Bounds=[{WEST}°E-{EAST}°E, {SOUTH}°N-{NORTH}°N]")

        return cropped_dem, cropped_transform, cropped_meta



    def save_processed_dem(

        self, dem_array: np.ndarray, transform: rasterio.Affine, meta: Dict[str, Any]

    ) -> Tuple[Path, Path, Dict[str, Any]]:

        """Save cropped DEM to GeoTIFF, NetCDF, and JSON metadata."""

        tif_file = self.processed_dir / "srtm_uttarakhand_dem.tif"

        nc_file = self.processed_dir / "srtm_uttarakhand_dem.nc"

        json_file = self.processed_dir / "srtm_dem_metadata.json"



        # 1. Save GeoTIFF

        with rasterio.open(tif_file, "w", **meta) as dst:

            dst.write(dem_array, 1)

            dst.update_tags(

                TITLE="Uttarakhand SRTM 90m DEM",

                SOURCE="NASA / USGS / CGIAR-CSI SRTM v4.1",

                VERTICAL_UNITS="meters",

                EPSG="4326",

                ACQUISITION_DATE=self.acquisition_time.isoformat(),

            )

        logger.info(f"Saved processed DEM GeoTIFF: {tif_file} ({tif_file.stat().st_size:,} bytes)")



        # 2. Compute statistics on valid elevation pixels

        valid_mask = (dem_array != SRTM_NODATA_VALUE) & (dem_array > -500)

        valid_elevations = dem_array[valid_mask].astype(np.float32)



        min_elev = float(valid_elevations.min()) if len(valid_elevations) > 0 else 0.0

        max_elev = float(valid_elevations.max()) if len(valid_elevations) > 0 else 0.0

        mean_elev = float(valid_elevations.mean()) if len(valid_elevations) > 0 else 0.0

        std_elev = float(valid_elevations.std()) if len(valid_elevations) > 0 else 0.0

        nodata_count = int((~valid_mask).sum())

        total_pixels = int(dem_array.size)



        # 3. Create Coordinates for NetCDF

        nrows, ncols = dem_array.shape

        lons = np.array([transform.c + (c + 0.5) * transform.a for c in range(ncols)], dtype=np.float64)

        lats = np.array([transform.f + (r + 0.5) * transform.e for r in range(nrows)], dtype=np.float64)



        # Clean NaN array for NetCDF

        elev_nc_data = np.where(valid_mask, dem_array.astype(np.float32), np.nan)



        ds = xr.Dataset(

            {

                "elevation": (

                    ("lat", "lon"),

                    elev_nc_data,

                    {

                        "units": "meters",

                        "long_name": "Digital Elevation Model (SRTM 90m)",

                        "standard_name": "surface_altitude",

                        "valid_min": min_elev,

                        "valid_max": max_elev,

                        "nodata": np.nan,

                    },

                )

            },

            coords={

                "lat": (("lat",), lats, {"units": "degrees_north", "standard_name": "latitude"}),

                "lon": (("lon",), lons, {"units": "degrees_east", "standard_name": "longitude"}),

            },

            attrs={

                "source": "NASA / USGS / CGIAR-CSI SRTM v4.1",

                "product": "SRTM_90m_DEM",

                "title": "Uttarakhand Digital Elevation Model",

                "region": "Uttarakhand, India",

                "bounding_box_west": WEST,

                "bounding_box_east": EAST,

                "bounding_box_south": SOUTH,

                "bounding_box_north": NORTH,

                "crs": "EPSG:4326",

                "vertical_units": "meters",

                "spatial_resolution": "0.0008333 degree (~90m)",

                "acquisition_time_utc": self.acquisition_time.isoformat(),

            },

        )

        ds.to_netcdf(nc_file)

        logger.info(f"Saved processed DEM NetCDF: {nc_file} ({nc_file.stat().st_size:,} bytes)")



        # 4. Save metadata summary JSON

        summary = {

            "acquisition_time_utc": self.acquisition_time.isoformat(),

            "product": "NASA / USGS SRTM 90m Digital Elevation Model (v4.1)",

            "source_provider": "CGIAR-CSI / NASA JPL / USGS",

            "source_url_template": SRTM_BASE_URL,

            "tiles_ingested": SRTM_TILES,

            "target_region": "Uttarakhand, India",

            "bounding_box": {

                "west": WEST,

                "east": EAST,

                "south": SOUTH,

                "north": NORTH,

            },

            "spatial_metadata": {

                "crs": "EPSG:4326 (WGS 84)",

                "pixel_resolution_deg": abs(float(transform.a)),

                "pixel_resolution_approx_m": 90.0,

                "grid_dimensions": {

                    "rows_lat": int(nrows),

                    "cols_lon": int(ncols),

                    "total_pixels": total_pixels,

                },

                "lon_range": [float(lons.min()), float(lons.max())],

                "lat_range": [float(lats.min()), float(lats.max())],

                "nodata_value": SRTM_NODATA_VALUE,

                "nodata_pixel_count": nodata_count,

                "valid_pixel_percentage": round((1.0 - (nodata_count / total_pixels)) * 100.0, 3),

            },

            "elevation_statistics_meters": {

                "minimum_elevation": round(min_elev, 2),

                "maximum_elevation": round(max_elev, 2),

                "mean_elevation": round(mean_elev, 2),

                "std_elevation": round(std_elev, 2),

                "vertical_units": "meters",

            },

            "file_artifacts": {

                "raw_tiles_directory": str(self.raw_dir),

                "processed_geotiff": str(tif_file),

                "processed_netcdf": str(nc_file),

            },

        }



        with open(json_file, "w", encoding="utf-8") as f:

            json.dump(summary, f, indent=2)

        logger.info(f"Saved DEM metadata JSON summary: {json_file}")



        return tif_file, nc_file, summary



    def run_ingestion(self) -> Tuple[Path, Path, Dict[str, Any]]:

        """Run the complete SRTM elevation DEM ingestion pipeline."""

        logger.info("=" * 60)

        logger.info("STARTING SRTM ELEVATION DEM INGESTION (PHASE 1D)")

        logger.info(f"Target Region: Uttarakhand BBox [{WEST}°E-{EAST}°E, {SOUTH}°N-{NORTH}°N]")

        logger.info("=" * 60)



        tile_paths = self.acquire_all_tiles()

        if len(tile_paths) != len(SRTM_TILES):

            logger.error(f"Incomplete tile set acquired: {len(tile_paths)}/{len(SRTM_TILES)} tiles.")

            raise RuntimeError(f"Could not acquire all {len(SRTM_TILES)} required SRTM tiles.")



        cropped_dem, cropped_transform, cropped_meta = self.mosaic_and_crop(tile_paths)

        tif_file, nc_file, summary = self.save_processed_dem(cropped_dem, cropped_transform, cropped_meta)



        return tif_file, nc_file, summary





# ============================================================

# MAIN EXECUTION & VALIDATION

# ============================================================



def main():

    engine = SRTMDEMIngestionEngine()

    try:

        tif_file, nc_file, summary = engine.run_ingestion()

    except Exception as e:

        logger.error(f"DEM Ingestion pipeline failed: {e}")

        sys.exit(1)



    print("\n" + "=" * 70)

    print("SRTM ELEVATION DEM INGESTION VALIDATION REPORT (PHASE 1D)")

    print("=" * 70)



    print(f"\nProduct: {summary['product']}")

    print(f"Provider: {summary['source_provider']}")

    print(f"Target Region: {summary['target_region']}")

    print(f"Bounding Box: {WEST}°E to {EAST}°E, {SOUTH}°N to {NORTH}°N")

    print(f"CRS: {summary['spatial_metadata']['crs']}")

    print(f"Grid Size: {summary['spatial_metadata']['grid_dimensions']['cols_lon']} Lons × {summary['spatial_metadata']['grid_dimensions']['rows_lat']} Lats ({summary['spatial_metadata']['grid_dimensions']['total_pixels']:,} pixels)")

    print(f"Resolution: {summary['spatial_metadata']['pixel_resolution_approx_m']} meters ({summary['spatial_metadata']['pixel_resolution_deg']:.6f} degrees)")



    stats = summary["elevation_statistics_meters"]

    print("\nElevation Statistics (Uttarakhand):")

    print(f"  Minimum Elevation : {stats['minimum_elevation']} m (Haridwar / Gangetic plains)")

    print(f"  Maximum Elevation : {stats['maximum_elevation']} m (Garhwal / Nanda Devi peaks)")

    print(f"  Mean Elevation    : {stats['mean_elevation']} m")

    print(f"  Std Elevation     : {stats['std_elevation']} m")

    print(f"  Vertical Units    : {stats['vertical_units']}")

    print(f"  Valid Data Ratio  : {summary['spatial_metadata']['valid_pixel_percentage']}%")



    print("\nOutput Files:")

    print(f"  GeoTIFF: {summary['file_artifacts']['processed_geotiff']}")

    print(f"  NetCDF : {summary['file_artifacts']['processed_netcdf']}")



    print("\n" + "=" * 70)

    print("PHASE 1D SRTM INGESTION COMPLETE")

    print("=" * 70)





if __name__ == "__main__":

    main()
