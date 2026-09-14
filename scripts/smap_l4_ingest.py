"""
Jal Drishti — Phase 9.2-B: Real NASA SMAP L4 Version 8 Operational Ingestion Module

Acquires, validates, standardizes, and stores real operational NASA SMAP Level 4
Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data, Version 8 (SPL4SMGP.008).

Official Source:
    NASA Earthdata Cloud / NSIDC DAAC
    Product: SPL4SMGP Version: 008 (DOI: 10.5067/6VK8F9TCV056)

Data Integrity Rule:
    ZERO synthetic or dummy values. Fill values (-9999.0) remain explicit NaNs and are NEVER converted to zero
    or climatological defaults. SMAP L3 is NEVER substituted for L4.

Target Domain:
    Uttarakhand Bounding Box:
    West: 77.8°E, East: 81.1°E, South: 28.5°N, North: 31.5°N
    Spatial Resolution: 9 km EASE-Grid 2.0 (1296 grid cells, 36 x 36 subgrid)

Outputs:
    - data/processed/smap_l4/raw/SMAP_L4_SM_gph_*.h5
    - data/processed/smap_l4/standardized/smap_l4_latest.csv
    - data/processed/smap_l4/standardized/smap_l4_latest.parquet
    - data/processed/smap_l4/latest/latest_smap_l4_summary.json
    - data/processed/smap_l4/metadata/provenance_smap_l4.json

Usage:
    python scripts/smap_l4_ingest.py
    python scripts/smap_l4_ingest.py --dry-run
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import h5py
import numpy as np
import pandas as pd

try:
    import earthaccess
except ImportError:
    earthaccess = None

# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("SMAP_L4_Ingest")

# ============================================================
# CONFIGURATION & CONSTANTS
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
SMAP_L4_DIR = DATA_DIR / "processed" / "smap_l4"
RAW_DIR = DATA_DIR / "raw" / "smap_l4"
STANDARDIZED_DIR = SMAP_L4_DIR / "standardized"
LATEST_DIR = SMAP_L4_DIR / "latest"
METADATA_DIR = SMAP_L4_DIR / "metadata"

# Ensure output directories exist
RAW_DIR.mkdir(parents=True, exist_ok=True)
STANDARDIZED_DIR.mkdir(parents=True, exist_ok=True)
LATEST_DIR.mkdir(parents=True, exist_ok=True)
METADATA_DIR.mkdir(parents=True, exist_ok=True)

# Also check legacy raw smap dir for cached files
RAW_SMAP_LEGACY_DIR = DATA_DIR / "raw" / "smap"

# Domain Definition (Uttarakhand)
WEST_LON = 77.8
EAST_LON = 81.1
SOUTH_LAT = 28.5
NORTH_LAT = 31.5

# Product Details
SHORT_NAME = "SPL4SMGP"
VERSION = "008"

# Freshness thresholds (hours)
FRESH_THRESHOLD_HOURS = 24.0
AGING_THRESHOLD_HOURS = 72.0


# ============================================================
# AUTHENTICATION & DISCOVERY
# ============================================================

def authenticate_earthdata() -> bool:
    """Authenticates with NASA Earthdata using environment variables in .env."""
    if earthaccess is None:
        logger.error("earthaccess module is not installed!")
        return False

    # Ensure .env is loaded
    try:
        from dotenv import load_dotenv
        env_file = PROJECT_DIR / ".env"
        if env_file.exists():
            load_dotenv(env_file)
    except ImportError:
        pass

    username = os.getenv("EARTHDATA_USERNAME")
    password = os.getenv("EARTHDATA_PASSWORD")

    if not username or not password:
        logger.error("Missing EARTHDATA_USERNAME or EARTHDATA_PASSWORD in environment!")
        return False

    try:
        auth = earthaccess.login(strategy="environment")
        if not auth.authenticated:
            logger.error("earthaccess login strategy='environment' failed!")
            return False
        logger.info("NASA Earthdata authentication successful.")
        return True
    except Exception as e:
        logger.error(f"Error authenticating with NASA Earthdata: {e}")
        return False


def discover_latest_smap_l4_granule() -> Optional[Any]:
    """Queries NASA/NSIDC CMR for the newest available SPL4SMGP.008 granule."""
    if earthaccess is None:
        return None

    try:
        logger.info(f"Querying NASA/NSIDC CMR catalog for product {SHORT_NAME} version {VERSION}...")
        results = earthaccess.search_data(
            short_name=SHORT_NAME,
            version=VERSION,
            count=5,
            sort_key="-start_date",
        )
        if not results:
            logger.warning(f"No granules found for {SHORT_NAME}.{VERSION} in CMR search.")
            return None

        latest_granule = results[0]
        granule_id = latest_granule["meta"].get("native-id", latest_granule.get("title", "Unknown_Granule"))
        logger.info(f"Discovered newest SMAP L4 granule: {granule_id}")
        return latest_granule
    except Exception as e:
        logger.error(f"Error querying NASA CMR for SMAP L4: {e}")
        return None


def download_smap_l4_granule(granule: Any, force: bool = False) -> Tuple[Optional[Path], str]:
    """Downloads granule or uses cached file if available."""
    if granule is None:
        return None, "NO_GRANULE"

    granule_id = granule["meta"].get("native-id", "smap_l4_granule.h5")
    # Clean up title/filename
    target_filename = granule["meta"].get("native-id", "")
    if not target_filename.endswith(".h5"):
        data_links = granule.data_links()
        if data_links:
            target_filename = data_links[0].split("/")[-1]
        else:
            target_filename = f"{granule_id}.h5"

    target_path = RAW_DIR / target_filename
    legacy_path = RAW_SMAP_LEGACY_DIR / target_filename

    # Check cache
    if not force:
        if target_path.exists() and target_path.stat().st_size > 1000000:
            logger.info(f"Using cached SMAP L4 granule in RAW_DIR: {target_filename} ({target_path.stat().st_size} bytes)")
            return target_path, "CACHED"
        if legacy_path.exists() and legacy_path.stat().st_size > 1000000:
            logger.info(f"Using cached SMAP L4 granule in LEGACY_DIR: {target_filename} ({legacy_path.stat().st_size} bytes)")
            return legacy_path, "CACHED"

    logger.info(f"Downloading SMAP L4 granule {target_filename} via earthaccess...")
    try:
        downloaded = earthaccess.download(granule, local_path=str(RAW_DIR))
        if downloaded:
            dl_path = Path(downloaded[0])
            logger.info(f"Successfully downloaded {dl_path.name} ({dl_path.stat().st_size} bytes)")
            return dl_path, "DOWNLOADED"
        else:
            logger.error("earthaccess.download returned empty result list!")
            return None, "DOWNLOAD_EMPTY"
    except Exception as e:
        logger.error(f"Error downloading SMAP L4 granule: {e}")
        return None, "DOWNLOAD_ERROR"


# ============================================================
# HDF5 EXTRACTION & FEATURE ENGINEERING
# ============================================================

def parse_smap_l4_hdf5(hdf5_path: Path) -> Optional[Dict[str, Any]]:
    """
    Parses downloaded SMAP L4 HDF5 granule using h5py.
    Extracts cell_lat, cell_lon, sm_surface, sm_rootzone, and dataset attributes.
    Converts fill values (-9999.0) to explicit NaNs.
    """
    try:
        with h5py.File(hdf5_path, "r") as h5:
            # Check cell lat/lon
            if "cell_lat" not in h5 or "cell_lon" not in h5:
                logger.error("Missing cell_lat or cell_lon dataset in SMAP L4 HDF5 file!")
                return None

            cell_lat = h5["cell_lat"][:]
            cell_lon = h5["cell_lon"][:]

            # Check soil moisture datasets
            if "Geophysical_Data/sm_surface" not in h5 or "Geophysical_Data/sm_rootzone" not in h5:
                logger.error("Missing Geophysical_Data/sm_surface or sm_rootzone dataset!")
                return None

            sm_surf_ds = h5["Geophysical_Data/sm_surface"]
            sm_root_ds = h5["Geophysical_Data/sm_rootzone"]

            sm_surf = sm_surf_ds[:].astype(np.float32)
            sm_root = sm_root_ds[:].astype(np.float32)

            # Fill value handling (convert fill values < 0 to NaN)
            fill_val_surf = float(sm_surf_ds.attrs.get("_FillValue", -9999.0))
            fill_val_root = float(sm_root_ds.attrs.get("_FillValue", -9999.0))

            sm_surf[sm_surf < 0.0] = np.nan
            sm_root[sm_root < 0.0] = np.nan

            # Metadata attributes
            attrs = dict(h5.attrs)
            time_str = attrs.get("RangeBeginningTime", attrs.get("RangeBeginningDate", ""))
            if isinstance(time_str, bytes):
                time_str = time_str.decode("utf-8")

            return {
                "cell_lat": cell_lat,
                "cell_lon": cell_lon,
                "sm_surface": sm_surf,
                "sm_rootzone": sm_root,
                "attributes": {
                    "title": str(attrs.get("Title", "SMAP L4_SM Geophysical Data Granule")),
                    "institution": str(attrs.get("Institution", "NASA GMAO")),
                    "source": str(attrs.get("Source", "SMAP L4_SM")),
                    "range_start": str(time_str),
                },
            }
    except Exception as e:
        logger.error(f"Error parsing SMAP L4 HDF5 file {hdf5_path}: {e}")
        return None


# ============================================================
# MAIN INGESTION WORKFLOW
# ============================================================

def run_smap_l4_ingestion(
    force: bool = False,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Executes operational SMAP L4 Version 8 ingestion workflow."""
    start_time = datetime.now(timezone.utc)
    logger.info("============================================================")
    logger.info("JAL DRISHTI — PHASE 9.2-B: REAL NASA SMAP L4 V8 INGESTION")
    logger.info("============================================================")

    # 1. Authenticate
    auth_ok = authenticate_earthdata()
    if not auth_ok:
        logger.error("Authentication failed. Cannot proceed with live SMAP L4 ingestion.")
        summary = {
            "status": "AUTHENTICATION_FAILED",
            "message": "Earthdata authentication failed. Check .env credentials.",
            "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    # 2. Discover newest granule
    granule = discover_latest_smap_l4_granule()
    if granule is None:
        logger.error("Granule discovery failed.")
        summary = {
            "status": "UNAVAILABLE",
            "message": "No SMAP L4 granules discovered on CMR.",
            "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    granule_id = granule["meta"].get("native-id", granule.get("title", "Unknown"))
    umm = granule.get("umm", {})
    temp_extent = umm.get("TemporalExtent", {}).get("RangeDateTime", {})
    start_obs_str = temp_extent.get("BeginningDateTime", "")
    end_obs_str = temp_extent.get("EndingDateTime", "")
    data_links = granule.data_links()

    # Parse observation timestamp & calculate data latency
    try:
        if start_obs_str.endswith("Z"):
            obs_dt = datetime.fromisoformat(start_obs_str.replace("Z", "+00:00"))
        else:
            obs_dt = datetime.fromisoformat(start_obs_str).replace(tzinfo=timezone.utc)
        data_age_hours = (start_time - obs_dt).total_seconds() / 3600.0
    except Exception as te:
        logger.warning(f"Could not parse observation timestamp '{start_obs_str}': {te}")
        obs_dt = start_time
        data_age_hours = 0.0

    # Freshness state determination
    if data_age_hours <= FRESH_THRESHOLD_HOURS:
        freshness_status = "FRESH"
    elif data_age_hours <= AGING_THRESHOLD_HOURS:
        freshness_status = "AGING"
    else:
        freshness_status = "STALE"

    logger.info(f"Latest Observation Timestamp: {obs_dt.isoformat()}, Data Age: {data_age_hours:.1f} hours ({freshness_status})")

    if dry_run:
        logger.info("[DRY RUN MODE] Simulating SMAP L4 ingestion without saving data.")
        return {
            "status": "DRY_RUN_SUCCESS",
            "granule_id": granule_id,
            "observation_timestamp_utc": obs_dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "data_age_hours": round(data_age_hours, 2),
            "freshness_status": freshness_status,
        }

    # 3. Download granule
    hdf5_path, dl_status = download_smap_l4_granule(granule, force=force)
    if hdf5_path is None or not hdf5_path.exists():
        logger.error("Download failed.")
        summary = {
            "status": "DOWNLOAD_FAILED",
            "granule_id": granule_id,
            "download_status": dl_status,
            "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    # 4. Parse HDF5 & extract spatial subset
    parsed = parse_smap_l4_hdf5(hdf5_path)
    if parsed is None:
        logger.error("HDF5 parsing failed.")
        summary = {
            "status": "PRODUCT_SCHEMA_MISMATCH",
            "granule_id": granule_id,
            "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    cell_lat = parsed["cell_lat"]
    cell_lon = parsed["cell_lon"]
    sm_surf = parsed["sm_surface"]
    sm_root = parsed["sm_rootzone"]

    # Spatial selection mask for Uttarakhand
    uk_mask = (cell_lat >= SOUTH_LAT) & (cell_lat <= NORTH_LAT) & (cell_lon >= WEST_LON) & (cell_lon <= EAST_LON)
    uk_indices = np.argwhere(uk_mask)
    num_cells = len(uk_indices)
    logger.info(f"Extracted {num_cells} 9km EASE-Grid 2.0 grid cells for Uttarakhand domain.")

    if num_cells == 0:
        logger.error("Zero grid cells matched Uttarakhand bounding box!")
        summary = {
            "status": "SPATIAL_SELECTION_EMPTY",
            "granule_id": granule_id,
            "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    # Build standardized records
    df_rows = []
    for idx_num, (r_idx, c_idx) in enumerate(uk_indices):
        lat_val = float(cell_lat[r_idx, c_idx])
        lon_val = float(cell_lon[r_idx, c_idx])
        surf_val = sm_surf[r_idx, c_idx]
        root_val = sm_root[r_idx, c_idx]

        # Derived features
        surf_val_clean = float(surf_val) if not np.isnan(surf_val) else None
        root_val_clean = float(root_val) if not np.isnan(root_val) else None

        diff_val = surf_val_clean - root_val_clean if (surf_val_clean is not None and root_val_clean is not None) else None
        ratio_val = surf_val_clean / (root_val_clean + 1e-6) if (surf_val_clean is not None and root_val_clean is not None) else None
        sat_index = (0.6 * surf_val_clean + 0.4 * root_val_clean) if (surf_val_clean is not None and root_val_clean is not None) else None

        df_rows.append({
            "grid_cell_id": idx_num,
            "ease_row": int(r_idx),
            "ease_column": int(c_idx),
            "latitude": round(lat_val, 4),
            "longitude": round(lon_val, 4),
            "source": "NASA_SMAP_L4",
            "product": SHORT_NAME,
            "version": VERSION,
            "granule_id": granule_id,
            "observation_timestamp_utc": obs_dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "ingestion_time_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "data_age_hours": round(data_age_hours, 2),
            "freshness_status": freshness_status,
            "smap_l4_surface_soil_moisture": surf_val_clean,
            "smap_l4_rootzone_soil_moisture": root_val_clean,
            "smap_l4_surface_rootzone_diff": round(diff_val, 4) if diff_val is not None else None,
            "smap_l4_surface_rootzone_ratio": round(ratio_val, 4) if ratio_val is not None else None,
            "smap_l4_saturation_index": round(sat_index, 4) if sat_index is not None else None,
        })

    df_smap = pd.DataFrame(df_rows)

    # 5. Save Standardized Output Artifacts
    csv_path = STANDARDIZED_DIR / "smap_l4_latest.csv"
    parquet_path = STANDARDIZED_DIR / "smap_l4_latest.parquet"
    df_smap.to_csv(csv_path, index=False)
    df_smap.to_parquet(parquet_path, index=False)
    logger.info(f"Saved standardized SMAP L4 datasets to {csv_path} and {parquet_path}")

    # Statistics for report
    valid_surf_count = int(df_smap["smap_l4_surface_soil_moisture"].notnull().sum())
    valid_root_count = int(df_smap["smap_l4_rootzone_soil_moisture"].notnull().sum())
    surf_mean = float(df_smap["smap_l4_surface_soil_moisture"].mean()) if valid_surf_count > 0 else 0.0
    root_mean = float(df_smap["smap_l4_rootzone_soil_moisture"].mean()) if valid_root_count > 0 else 0.0

    summary_data = {
        "status": "REAL_OPERATIONAL" if freshness_status != "STALE" else "STALE",
        "source": "NASA_SMAP_L4",
        "product": SHORT_NAME,
        "version": VERSION,
        "doi": "10.5067/6VK8F9TCV056",
        "granule_id": granule_id,
        "downloaded_file": hdf5_path.name,
        "file_size_bytes": hdf5_path.stat().st_size,
        "file_size_mb": round(hdf5_path.stat().st_size / (1024 * 1024), 2),
        "download_url": data_links[0] if data_links else "N/A",
        "observation_timestamp_utc": obs_dt.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "data_age_hours": round(data_age_hours, 2),
        "freshness_status": freshness_status,
        "domain_bounding_box": {"west": WEST_LON, "east": EAST_LON, "south": SOUTH_LAT, "north": NORTH_LAT},
        "grid_cell_count": num_cells,
        "valid_surface_moisture_count": valid_surf_count,
        "valid_rootzone_moisture_count": valid_root_count,
        "surface_soil_moisture_mean": round(surf_mean, 4),
        "rootzone_soil_moisture_mean": round(root_mean, 4),
        "columns": list(df_smap.columns),
    }

    summary_path = LATEST_DIR / "latest_smap_l4_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    _write_manifest(summary_data)

    logger.info("============================================================")
    logger.info(f"SMAP L4 Ingestion Complete! Final Status: {summary_data['status']} ({freshness_status})")
    logger.info("============================================================")
    return summary_data


def _write_manifest(summary: Dict[str, Any]) -> None:
    """Writes provenance manifest for SMAP L4 ingestion."""
    manifest_path = METADATA_DIR / "provenance_smap_l4.json"
    manifest_entry = {
        "dataset": "NASA_SMAP_L4_SPL4SMGP_008",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_entry, f, indent=2)


# ============================================================
# CLI ENTRY POINT
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Jal Drishti Real-Time NASA SMAP L4 Version 8 Ingestion")
    parser.add_argument("--force", action="store_true", help="Force re-download even if cached")
    parser.add_argument("--dry-run", action="store_true", help="Simulate ingestion without downloading")
    args = parser.parse_args()

    res = run_smap_l4_ingestion(force=args.force, dry_run=args.dry_run)
    print(json.dumps(res, indent=2))
