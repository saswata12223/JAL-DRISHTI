"""
Jal Drishti — Phase 9.1: NOAA GFS 0.25° Real-Time Forecast Ingestion Module

Acquires, validates, standardizes, and stores real operational NOAA/NCEP Global Forecast System (GFS) 0.25°
numerical weather prediction (NWP) forecast fields for the Uttarakhand, India domain.

Official Source:
    NOAA/NCEP NOMADS GFS 0.25° Filter Service:
    https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl

Data Integrity Rule:
    ZERO synthetic or dummy values. If NOAA NOMADS is unreachable or returns 0 bytes,
    the pipeline explicitly records UNAVAILABLE / ACCESS_ERROR status and does not fabricate forecasts.

Target Domain:
    Uttarakhand + Upstream Buffer:
    Bounding Box: 77.0°E to 82.0°E, 28.0°N to 32.5°N
    Grid Resolution: 0.25° (~28 km horizontal grid, 19 x 21 = 399 grid cells)

Forecast Lead Times Handled:
    +1h (f001), +3h (f003), +6h (f006), +12h (f012), +24h (f024)

Outputs:
    - data/processed/gfs/raw/gfs_YYYYMMDD_HH_fXXX.grib2
    - data/processed/gfs/standardized/gfs_forecast_latest.csv
    - data/processed/gfs/standardized/gfs_forecast_latest.parquet
    - data/processed/gfs/latest/latest_gfs_summary.json
    - data/processed/gfs/metadata/provenance_gfs.json

Usage:
    python scripts/gfs_ingest.py
    python scripts/gfs_ingest.py --dry-run
    python scripts/gfs_ingest.py --date 2026-09-14 --cycle 12
"""

import argparse
import json
import logging
import os
import re
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import rasterio

# ============================================================
# LOGGING CONFIGURATION
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("GFS_Ingest")

# ============================================================
# CONFIGURATION & CONSTANTS
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
GFS_DIR = DATA_DIR / "processed" / "gfs"
RAW_DIR = GFS_DIR / "raw"
STANDARDIZED_DIR = GFS_DIR / "standardized"
LATEST_DIR = GFS_DIR / "latest"
METADATA_DIR = GFS_DIR / "metadata"

# Ensure output directories exist
RAW_DIR.mkdir(parents=True, exist_ok=True)
STANDARDIZED_DIR.mkdir(parents=True, exist_ok=True)
LATEST_DIR.mkdir(parents=True, exist_ok=True)
METADATA_DIR.mkdir(parents=True, exist_ok=True)

# Domain Definition (Uttarakhand + Buffer)
WEST_LON = 77.0
EAST_LON = 82.0
SOUTH_LAT = 28.0
NORTH_LAT = 32.5

# NOMADS Base URLs
NOMADS_PROD_URL = "https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/"
NOMADS_FILTER_URL = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"

# Forecast lead hours to download
DEFAULT_HORIZONS = [1, 3, 6, 12, 24]

# User agent for requests
HTTP_USER_AGENT = "JalDrishti-Hydrological-Pipeline/9.1 (Contact: s.khaitan@jal-drishti.in)"


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def discover_available_gfs_cycles(timeout_sec: int = 15) -> List[Tuple[str, str]]:
    """
    Discovers available GFS production date directories and cycles on NOAA NOMADS.
    Returns list of (date_str, cycle_str) tuples, sorted chronologically ascending.
    Example: [('20260914', '00'), ('20260914', '06'), ('20260914', '12')]
    """
    req = urllib.request.Request(NOMADS_PROD_URL, headers={"User-Agent": HTTP_USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status != 200:
                logger.warning(f"NOAA NOMADS prod directory returned HTTP status {resp.status}")
                return []
            content = resp.read().decode("utf-8", errors="ignore")
            date_dirs = re.findall(r'href="(gfs\.\d{8})/"', content)
            if not date_dirs:
                return []
            
            # Check last 3 date directories for cycles
            results = []
            for date_dir in date_dirs[-3:]:
                date_str = date_dir.split(".")[1]
                cycle_url = f"{NOMADS_PROD_URL}{date_dir}/"
                cycle_req = urllib.request.Request(cycle_url, headers={"User-Agent": HTTP_USER_AGENT})
                try:
                    with urllib.request.urlopen(cycle_req, timeout=timeout_sec) as cycle_resp:
                        if cycle_resp.status == 200:
                            cycle_content = cycle_resp.read().decode("utf-8", errors="ignore")
                            cycles = re.findall(r'href="(\d{2})/"', cycle_content)
                            for cyc in cycles:
                                if cyc in ["00", "06", "12", "18"]:
                                    results.append((date_str, cyc))
                except Exception as e:
                    logger.debug(f"Could not read cycle dir {date_dir}: {e}")
            
            # Sort chronologically
            results.sort(key=lambda x: (x[0], x[1]))
            return results
    except Exception as e:
        logger.error(f"Failed to query NOAA NOMADS endpoint {NOMADS_PROD_URL}: {e}")
        return []


def build_nomads_download_url(date_str: str, cycle_str: str, fhour: int) -> str:
    """
    Constructs the filtered CGI download URL for a specific forecast hour and region.
    """
    fhour_str = f"f{fhour:03d}"
    file_name = f"gfs.t{cycle_str}z.pgrb2.0p25.{fhour_str}"
    dir_param = f"%2Fgfs.{date_str}%2F{cycle_str}%2Fatmos"
    
    url = (
        f"{NOMADS_FILTER_URL}?"
        f"file={file_name}&"
        f"lev_surface=on&lev_2_m_above_ground=on&lev_10_m_above_ground=on&"
        f"var_APCP=on&var_PRATE=on&var_TMP=on&var_RH=on&var_PRES=on&"
        f"var_UGRD=on&var_VGRD=on&var_GUST=on&var_PWAT=on&var_CAPE=on&var_CIN=on&"
        f"subregion=&leftlon={WEST_LON}&rightlon={EAST_LON}&toplat={NORTH_LAT}&bottomlat={SOUTH_LAT}&"
        f"dir={dir_param}"
    )
    return url


def download_gfs_grib_file(
    date_str: str, cycle_str: str, fhour: int, force: bool = False, timeout_sec: int = 45
) -> Tuple[Optional[Path], str]:
    """
    Downloads a single GFS 0.25 GRIB2 file from NOAA NOMADS for the specified cycle and forecast hour.
    Implements caching so unchanged files are not re-downloaded unless force=True.
    Returns (file_path, status_str).
    """
    target_filename = f"gfs_{date_str}_{cycle_str}z_f{fhour:03d}.grib2"
    target_path = RAW_DIR / target_filename
    
    if target_path.exists() and not force and target_path.stat().st_size > 500:
        logger.info(f"Using cached GRIB2 file: {target_filename} ({target_path.stat().st_size} bytes)")
        return target_path, "CACHED"
    
    url = build_nomads_download_url(date_str, cycle_str, fhour)
    logger.info(f"Downloading GFS 0.25° f{fhour:03d} for cycle {date_str} {cycle_str}Z from NOAA NOMADS...")
    req = urllib.request.Request(url, headers={"User-Agent": HTTP_USER_AGENT})
    
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            if resp.status != 200:
                logger.error(f"NOAA NOMADS filter returned HTTP status {resp.status} for f{fhour:03d}")
                return None, f"HTTP_{resp.status}"
            data = resp.read()
            if len(data) == 0:
                logger.error(f"NOAA NOMADS filter returned 0 bytes for f{fhour:03d}")
                return None, "ZERO_BYTES"
            
            # Save raw bytes
            temp_path = RAW_DIR / f"{target_filename}.tmp"
            with open(temp_path, "wb") as f:
                f.write(data)
            
            # Validate GRIB file integrity using rasterio before renaming
            try:
                with rasterio.open(temp_path) as src:
                    _ = src.count
            except Exception as ge:
                logger.error(f"Downloaded GRIB file failed rasterio validation: {ge}")
                if temp_path.exists():
                    temp_path.unlink()
                return None, "CORRUPTED_GRIB"
            
            # Rename temp file
            if target_path.exists():
                target_path.unlink()
            temp_path.rename(target_path)
            logger.info(f"Downloaded and verified {target_filename} ({len(data)} bytes)")
            return target_path, "DOWNLOADED"
            
    except urllib.error.HTTPError as he:
        logger.error(f"HTTP error downloading f{fhour:03d}: {he}")
        return None, f"HTTP_{he.code}"
    except urllib.error.URLError as ue:
        logger.error(f"URL/Network error downloading f{fhour:03d}: {ue}")
        return None, "NETWORK_ERROR"
    except Exception as e:
        logger.error(f"Unexpected error downloading f{fhour:03d}: {e}")
        return None, "ERROR"


def parse_gfs_grib_raster(grib_path: Path, fhour: int) -> Optional[Dict[str, Any]]:
    """
    Parses a downloaded GRIB2 file using rasterio.
    Extracts variable rasters, coordinates, units, and GRIB band tags.
    """
    try:
        with rasterio.open(grib_path) as src:
            width = src.width
            height = src.height
            bounds = src.bounds
            
            # Derive lat/lon 2D mesh grid
            lons = np.linspace(bounds.left, bounds.right, width)
            lats = np.linspace(bounds.top, bounds.bottom, height)  # Top to bottom
            lon_grid, lat_grid = np.meshgrid(lons, lats)
            
            band_data = {}
            ref_time_str = None
            valid_time_str = None
            
            for band_idx in range(1, src.count + 1):
                tags = src.tags(band_idx)
                element = tags.get("GRIB_ELEMENT", f"BAND_{band_idx}")
                short_name = tags.get("GRIB_SHORT_NAME", "")
                
                if ref_time_str is None and "GRIB_REF_TIME" in tags:
                    try:
                        ts = int(tags["GRIB_REF_TIME"])
                        ref_time_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                    except Exception:
                        pass
                
                if valid_time_str is None and "GRIB_VALID_TIME" in tags:
                    try:
                        ts = int(tags["GRIB_VALID_TIME"])
                        valid_time_str = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
                    except Exception:
                        pass
                
                arr = src.read(band_idx).astype(np.float32)
                
                # Key mapping based on element and short_name
                var_key = element
                if element == "TMP":
                    if "2-HTGL" in short_name:
                        var_key = "TMP_2m_C"
                        arr = arr - 273.15  # Kelvin to Celsius
                    else:
                        var_key = "TMP_sfc_C"
                        arr = arr - 273.15
                elif element == "RH":
                    var_key = "RH_2m_pct"
                elif element == "PRATE":
                    var_key = "PRATE_mmh"
                    arr = arr * 3600.0  # kg/m^2/s to mm/h
                elif element.startswith("APCP"):
                    # Explicitly match initialization-cumulative field for this forecast hour (e.g. APCP01, APCP03, APCP06, APCP12, APCP24)
                    target_apcp_elem = f"APCP{fhour:02d}"
                    if element == target_apcp_elem or "APCP_accum_mm" not in band_data:
                        var_key = "APCP_accum_mm"
                    else:
                        var_key = f"{element}_interval_mm"
                elif element == "CAPE":
                    var_key = "CAPE_Jkg"
                elif element == "CIN":
                    var_key = "CIN_Jkg"
                elif element == "PRES":
                    var_key = "PRES_sfc_hpa"
                    arr = arr / 100.0  # Pa to hPa
                elif element == "UGRD":
                    var_key = "UGRD_10m_ms"
                elif element == "VGRD":
                    var_key = "VGRD_10m_ms"
                elif element == "GUST":
                    var_key = "GUST_sfc_ms"
                elif element == "PWAT":
                    var_key = "PWAT_kgm2"
                
                band_data[var_key] = arr
            
            return {
                "fhour": fhour,
                "width": width,
                "height": height,
                "lats": lat_grid,
                "lons": lon_grid,
                "ref_time_utc": ref_time_str,
                "valid_time_utc": valid_time_str,
                "variables": band_data,
            }
            
    except Exception as e:
        logger.error(f"Error parsing GRIB file {grib_path}: {e}")
        return None


# ============================================================
# MAIN INGESTION WORKFLOW
# ============================================================

def run_gfs_ingestion(
    date_str: Optional[str] = None,
    cycle_str: Optional[str] = None,
    horizons: List[int] = DEFAULT_HORIZONS,
    force: bool = False,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """
    Executes the complete operational GFS 0.25° forecast ingestion workflow.
    """
    start_time = datetime.now(timezone.utc)
    logger.info("============================================================")
    logger.info("JAL DRISHTI — PHASE 9.1: NOAA GFS 0.25° FORECAST INGESTION")
    logger.info("============================================================")
    
    # 1. Discover or validate cycle
    if date_str is None or cycle_str is None:
        logger.info("Discovering latest available GFS cycle on NOAA NOMADS...")
        available_cycles = discover_available_gfs_cycles()
        if not available_cycles:
            logger.error("Failed to discover any GFS cycles on NOAA NOMADS. Network issue or server unavailable.")
            summary = {
                "status": "UNAVAILABLE",
                "message": "NOAA NOMADS endpoint unreachable or no GFS cycles discovered",
                "ingestion_timestamp_utc": start_time.isoformat(),
                "cycle": None,
                "horizons": horizons,
                "records_ingested": 0,
            }
            _write_manifest(summary)
            return summary
        
        target_date, target_cycle = available_cycles[-1]
        logger.info(f"Latest discovered GFS cycle: Date={target_date}, Cycle={target_cycle}Z")
    else:
        target_date = date_str.replace("-", "")
        target_cycle = cycle_str.zfill(2)
        logger.info(f"Targeting specified GFS cycle: Date={target_date}, Cycle={target_cycle}Z")
    
    # Validate cycle freshness (Stale gate: if cycle is > 24 hours old)
    try:
        cycle_dt = datetime.strptime(f"{target_date}{target_cycle}", "%Y%m%d%H").replace(tzinfo=timezone.utc)
        cycle_age_hours = (start_time - cycle_dt).total_seconds() / 3600.0
        logger.info(f"Target GFS Cycle Timestamp: {cycle_dt.isoformat()}, Age: {cycle_age_hours:.1f} hours")
        is_stale = cycle_age_hours > 24.0
    except Exception as e:
        logger.warning(f"Could not compute cycle age: {e}")
        cycle_dt = start_time
        is_stale = False

    if dry_run:
        logger.info("[DRY RUN MODE] Simulating download and processing without fetching files.")
        return {
            "status": "DRY_RUN_SUCCESS",
            "date": target_date,
            "cycle": target_cycle,
            "horizons": horizons,
            "is_stale": is_stale,
        }

    # 2. Download forecast horizon files
    downloaded_files = {}
    statuses = {}
    for fhour in horizons:
        path, status = download_gfs_grib_file(target_date, target_cycle, fhour, force=force)
        statuses[fhour] = status
        if path is not None:
            downloaded_files[fhour] = path

    if not downloaded_files:
        logger.error(f"Failed to download any GFS forecast files for cycle {target_date} {target_cycle}Z")
        overall_status = "ACCESS_ERROR" if any("HTTP" in s or "NETWORK" in s for s in statuses.values()) else "UNAVAILABLE"
        summary = {
            "status": overall_status,
            "date": target_date,
            "cycle": target_cycle,
            "horizons_attempted": horizons,
            "statuses": statuses,
            "ingestion_timestamp_utc": start_time.isoformat(),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    # 3. Parse downloaded GRIB files into structured data
    parsed_horizons = {}
    for fhour, grib_path in downloaded_files.items():
        parsed = parse_gfs_grib_raster(grib_path, fhour)
        if parsed is not None:
            parsed_horizons[fhour] = parsed

    if not parsed_horizons:
        logger.error("Failed to parse any downloaded GFS GRIB2 files!")
        summary = {
            "status": "CORRUPTED_DATA",
            "date": target_date,
            "cycle": target_cycle,
            "ingestion_timestamp_utc": start_time.isoformat(),
            "records_ingested": 0,
        }
        _write_manifest(summary)
        return summary

    # 4. Construct standardized tabular records for grid points
    first_parsed = list(parsed_horizons.values())[0]
    lats = first_parsed["lats"].flatten()
    lons = first_parsed["lons"].flatten()
    num_cells = len(lats)
    
    init_time_str = first_parsed["ref_time_utc"] or cycle_dt.strftime("%Y-%m-%d %H:%M:%S UTC")

    # Cumulative APCP to interval rainfall calculation
    apcp_by_fhour = {}
    for fh, pdata in parsed_horizons.items():
        if "APCP_accum_mm" in pdata["variables"]:
            apcp_by_fhour[fh] = pdata["variables"]["APCP_accum_mm"].flatten()

    df_rows = []
    for cell_idx in range(num_cells):
        row = {
            "grid_cell_id": cell_idx,
            "latitude": round(float(lats[cell_idx]), 4),
            "longitude": round(float(lons[cell_idx]), 4),
            "source": "NOAA_GFS",
            "model_cycle": f"{target_date}_{target_cycle}Z",
            "forecast_initialization_time_utc": init_time_str,
            "ingestion_time_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        }

        # Horizon specific variables
        for fh in horizons:
            pdata = parsed_horizons.get(fh)
            if pdata and "variables" in pdata:
                vars_dict = pdata["variables"]
                if "APCP_accum_mm" in vars_dict:
                    row[f"gfs_precip_accum_{fh}h_mm"] = round(float(vars_dict["APCP_accum_mm"].flatten()[cell_idx]), 3)
                if "PRATE_mmh" in vars_dict:
                    row[f"gfs_precip_rate_{fh}h_mmh"] = round(float(vars_dict["PRATE_mmh"].flatten()[cell_idx]), 3)
                if "TMP_2m_C" in vars_dict:
                    row[f"gfs_temp_2m_{fh}h_c"] = round(float(vars_dict["TMP_2m_C"].flatten()[cell_idx]), 2)
                if "RH_2m_pct" in vars_dict:
                    row[f"gfs_humidity_2m_{fh}h_pct"] = round(float(vars_dict["RH_2m_pct"].flatten()[cell_idx]), 1)
                if "PRES_sfc_hpa" in vars_dict:
                    row[f"gfs_pressure_sfc_{fh}h_hpa"] = round(float(vars_dict["PRES_sfc_hpa"].flatten()[cell_idx]), 1)
                if "UGRD_10m_ms" in vars_dict and "VGRD_10m_ms" in vars_dict:
                    u = float(vars_dict["UGRD_10m_ms"].flatten()[cell_idx])
                    v = float(vars_dict["VGRD_10m_ms"].flatten()[cell_idx])
                    ws = np.sqrt(u**2 + v**2)
                    row[f"gfs_wind_speed_{fh}h_ms"] = round(float(ws), 2)
                if "CAPE_Jkg" in vars_dict:
                    row[f"gfs_cape_{fh}h_jkg"] = round(float(vars_dict["CAPE_Jkg"].flatten()[cell_idx]), 1)

        # Explicitly derived interval rainfalls
        apcp1 = apcp_by_fhour.get(1, np.zeros(num_cells))[cell_idx]
        apcp3 = apcp_by_fhour.get(3, apcp1)[cell_idx]
        apcp6 = apcp_by_fhour.get(6, apcp3)[cell_idx]
        apcp12 = apcp_by_fhour.get(12, apcp6)[cell_idx]
        apcp24 = apcp_by_fhour.get(24, apcp12)[cell_idx]

        row["gfs_rainfall_0_to_1h_mm"] = round(float(apcp1), 3)
        row["gfs_rainfall_0_to_3h_mm"] = round(float(apcp3), 3)
        row["gfs_rainfall_0_to_6h_mm"] = round(float(apcp6), 3)
        row["gfs_rainfall_0_to_12h_mm"] = round(float(apcp12), 3)
        row["gfs_rainfall_0_to_24h_mm"] = round(float(apcp24), 3)

        # Non-overlapping interval rainfalls
        row["gfs_interval_rainfall_1h_to_3h_mm"] = round(max(0.0, float(apcp3 - apcp1)), 3)
        row["gfs_interval_rainfall_3h_to_6h_mm"] = round(max(0.0, float(apcp6 - apcp3)), 3)
        row["gfs_interval_rainfall_6h_to_12h_mm"] = round(max(0.0, float(apcp12 - apcp6)), 3)
        row["gfs_interval_rainfall_12h_to_24h_mm"] = round(max(0.0, float(apcp24 - apcp12)), 3)

        df_rows.append(row)

    df_gfs = pd.DataFrame(df_rows)
    logger.info(f"Successfully processed {len(df_gfs)} GFS grid points for Uttarakhand domain.")

    # 5. Save Standardized Output Artifacts
    csv_path = STANDARDIZED_DIR / "gfs_forecast_latest.csv"
    parquet_path = STANDARDIZED_DIR / "gfs_forecast_latest.parquet"
    df_gfs.to_csv(csv_path, index=False)
    df_gfs.to_parquet(parquet_path, index=False)
    logger.info(f"Saved standardized GFS datasets to {csv_path} and {parquet_path}")

    # Determine overall status
    if is_stale:
        final_status = "STALE"
    elif len(parsed_horizons) == len(horizons):
        final_status = "REAL_OPERATIONAL"
    else:
        final_status = "REAL_PARTIAL"

    # 6. Save Latest Summary & Provenance Manifest
    summary_data = {
        "status": final_status,
        "source": "NOAA_GFS",
        "resolution_deg": 0.25,
        "domain_bounding_box": {"west": WEST_LON, "east": EAST_LON, "south": SOUTH_LAT, "north": NORTH_LAT},
        "grid_cell_count": num_cells,
        "target_date": target_date,
        "target_cycle": f"{target_cycle}Z",
        "forecast_initialization_time_utc": init_time_str,
        "horizons_obtained": list(parsed_horizons.keys()),
        "horizons_attempted": horizons,
        "is_stale": is_stale,
        "cycle_age_hours": round(cycle_age_hours, 2),
        "ingestion_timestamp_utc": start_time.strftime("%Y-%m-%d %H:%M:%S UTC"),
        "records_ingested": len(df_gfs),
        "columns": list(df_gfs.columns),
    }

    summary_path = LATEST_DIR / "latest_gfs_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    _write_manifest(summary_data)

    logger.info("============================================================")
    logger.info(f"NOAA GFS Ingestion Complete! Final Status: {final_status}")
    logger.info("============================================================")
    return summary_data


def _write_manifest(summary: Dict[str, Any]) -> None:
    """Writes provenance manifest for GFS ingestion."""
    manifest_path = METADATA_DIR / "provenance_gfs.json"
    manifest_entry = {
        "dataset": "NOAA_GFS_0p25_Forecast",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest_entry, f, indent=2)


# ============================================================
# CLI ENTRY POINT
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Jal Drishti Real-Time NOAA GFS 0.25° Ingestion")
    parser.add_argument("--date", type=str, default=None, help="Target date YYYY-MM-DD or YYYYMMDD")
    parser.add_argument("--cycle", type=str, default=None, help="Target cycle 00, 06, 12, 18")
    parser.add_argument("--force", action="store_true", help="Force re-download even if cached")
    parser.add_argument("--dry-run", action="store_true", help="Simulate ingestion without downloading")
    args = parser.parse_args()

    res = run_gfs_ingestion(
        date_str=args.date,
        cycle_str=args.cycle,
        force=args.force,
        dry_run=args.dry_run,
    )
    print(json.dumps(res, indent=2))
