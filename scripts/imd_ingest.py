"""

FlashFloodAI — Phase 1B: IMD Weather Data Ingestion Module



Ingests real meteorological observations from the India Meteorological Department (IMD)

for weather monitoring stations across Uttarakhand, India.



Data Sources:

    1. IMD Automatic Weather Station (AWS) Network (imd:aws_data_layer)

    2. IMD Synoptic Observation Network (imd:synop_data_layer)

    3. IMD METAR Aviation Network (imd:metar_data_layer)

    4. IMD Meteorological Centre Dehradun Nowcast Network (imd:mcwise_station_nowcast_view)



Target Variables:

    - Rainfall (mm)

    - Temperature (°C)

    - Relative Humidity (%)

    - Wind Speed (km/h & m/s)

    - Atmospheric Pressure (hPa)

    - Data Freshness & Status Flag (LIVE / RECENT / STALE / UNAVAILABLE)



Usage:

    python scripts/imd_ingest.py

"""



import json

import logging

import os

import re

import sys

from datetime import datetime, timezone

from pathlib import Path

from typing import Any, Dict, List, Optional, Tuple



import numpy as np

import pandas as pd

import requests

import urllib3



# Suppress insecure HTTPS request warnings for public government portals

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)



# ============================================================

# LOGGING CONFIGURATION

# ============================================================



logging.basicConfig(

    level=logging.INFO,

    format="%(asctime)s [%(levelname)s] %(message)s",

    datefmt="%Y-%m-%d %H:%M:%S",

)

logger = logging.getLogger("IMD_Ingest")





# ============================================================

# CONFIGURATION & CONSTANTS

# ============================================================



PROJECT_DIR = Path(__file__).resolve().parent.parent

RAW_IMD_DIR = PROJECT_DIR / "data" / "raw" / "imd"

PROCESSED_WEATHER_DIR = PROJECT_DIR / "data" / "processed" / "weather"



# Uttarakhand Region Bounding Box

WEST = 77.8

EAST = 81.1

SOUTH = 28.5

NORTH = 31.5



# IMD Official GeoServer Endpoint

IMD_GEOSERVER_WFS = "https://reactjs.imd.gov.in/geoserver/wfs"



HTTP_HEADERS = {

    "User-Agent": (

        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "

        "AppleWebKit/537.36 (KHTML, like Gecko) "

        "Chrome/120.0.0.0 Safari/537.36"

    ),

    "Accept": "application/json",

}



# Freshness Thresholds (in hours from acquisition)

LIVE_THRESHOLD_HOURS = 3.0

RECENT_THRESHOLD_HOURS = 24.0





# ============================================================

# HELPER FUNCTIONS

# ============================================================



def safe_float(val: Any) -> Optional[float]:

    """Safely convert variable to float or return None."""

    if val is None:

        return None

    if isinstance(val, (int, float)):

        return float(val) if np.isfinite(val) else None

    val_str = str(val).strip().upper()

    if val_str in ("", "NULL", "NONE", "NAN", "N/A", "-"):

        return None

    try:

        # Strip trailing non-numeric characters if any

        clean = re.sub(r"[^\d.\-+]", "", val_str)

        if clean:

            f = float(clean)

            return f if np.isfinite(f) else None

    except (ValueError, TypeError):

        pass

    return None





def parse_timestamp(ts_str: Any) -> Optional[datetime]:

    """Parse various IMD timestamp string formats into UTC datetime."""

    if ts_str is None:

        return None

    ts_str = str(ts_str).strip()

    if not ts_str or ts_str.upper() in ("NULL", "NONE", "NAN", ""):

        return None



    formats = [

        "%Y-%m-%dT%H:%M:%SZ",

        "%Y-%m-%dT%H:%M:%S%z",

        "%Y-%m-%dT%H:%M:%S",

        "%Y-%m-%d %H:%M:%S",

        "%Y-%m-%d %H:%M",

        "%Y-%m-%d",

        "%Y-%m-%dZ",

    ]



    for fmt in formats:

        try:

            dt = datetime.strptime(ts_str, fmt)

            if dt.tzinfo is None:

                dt = dt.replace(tzinfo=timezone.utc)

            else:

                dt = dt.astimezone(timezone.utc)

            return dt

        except ValueError:

            continue



    return None





def calculate_freshness(obs_time: Optional[datetime], ref_time: datetime) -> str:

    """Classify data freshness into LIVE, RECENT, STALE, or UNAVAILABLE."""

    if obs_time is None:

        return "UNAVAILABLE"



    age_hours = (ref_time - obs_time).total_seconds() / 3600.0

    if age_hours < 0:

        # Observation slightly in future due to small clock skew

        return "LIVE"

    elif age_hours <= LIVE_THRESHOLD_HOURS:

        return "LIVE"

    elif age_hours <= RECENT_THRESHOLD_HOURS:

        return "RECENT"

    else:

        return "STALE"





# ============================================================

# INGESTION MODULE

# ============================================================



class IMDIngestionEngine:

    """Ingestion engine for IMD meteorological observations."""



    def __init__(self, session: Optional[requests.Session] = None):

        self.session = session or requests.Session()

        self.session.headers.update(HTTP_HEADERS)

        self.acquisition_time = datetime.now(timezone.utc)



    def fetch_wfs_layer(self, layer_name: str, timeout: int = 25) -> List[Dict[str, Any]]:

        """Fetch GeoJSON features from IMD GeoServer WFS."""

        params = {

            "service": "WFS",

            "version": "1.1.0",

            "request": "GetFeature",

            "typename": layer_name,

            "srsname": "EPSG:4326",

            "outputFormat": "application/json",

        }

        try:

            logger.info(f"Querying IMD WFS layer: {layer_name}")

            response = self.session.get(

                IMD_GEOSERVER_WFS,

                params=params,

                timeout=timeout,

                verify=False,

            )

            response.raise_for_status()

            data = response.json()

            features = data.get("features", [])

            logger.info(f"Retrieved {len(features)} raw features from {layer_name}")

            return features

        except Exception as e:

            logger.warning(f"Failed to fetch layer {layer_name} from IMD WFS: {e}")

            return []



    def process_aws_features(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:

        """Process IMD Automatic Weather Station features."""

        records = []

        for f in features:

            props = f.get("properties", {})

            geom = f.get("geometry", {})

            coords = geom.get("coordinates", []) if geom else []



            lon = safe_float(coords[0]) if len(coords) > 0 else None

            lat = safe_float(coords[1]) if len(coords) > 1 else None



            if lon is None or lat is None:

                continue



            # Filter to Uttarakhand bounding box

            if not (WEST <= lon <= EAST and SOUTH <= lat <= NORTH):

                continue



            station_name = str(props.get("station", "")).strip() or "UNKNOWN_AWS"



            raw_stn_id = props.get("station_id")

            if raw_stn_id is not None and str(raw_stn_id).strip() not in ("", "None", "nan", "NaN", "null", "NULL"):

                station_id = str(raw_stn_id).replace(".0", "").strip()

            elif props.get("id"):

                station_id = str(props.get("id")).strip()

            elif props.get("call_sign"):

                station_id = str(props.get("call_sign")).strip()

            else:

                clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", station_name)

                station_id = f"AWS_{clean_name}"



            raw_time_str = props.get("update_time") or props.get("dat")

            obs_time = parse_timestamp(raw_time_str)



            temp = safe_float(props.get("temp"))

            temp_min = safe_float(props.get("temp_min"))

            temp_max = safe_float(props.get("temp_max"))

            rh = safe_float(props.get("rh"))

            wind_speed = safe_float(props.get("windspeed")) # knots / kmh from AWS

            wind_dir = safe_float(props.get("winddir"))

            rainfall = safe_float(props.get("rainfall")) # mm

            pressure = safe_float(props.get("mslp")) # hPa

            dewpoint = safe_float(props.get("dewpoint"))



            # Quality validation: filter impossible physical values

            if temp is not None and (temp < -40.0 or temp > 60.0):

                temp = None

            if rh is not None and (rh < 0.0 or rh > 100.0):

                rh = None



            raw_pressure = pressure

            pressure_mslp = None

            if pressure is not None and (850.0 <= pressure <= 1085.0):

                pressure_mslp = round(pressure, 2)



            freshness = calculate_freshness(obs_time, self.acquisition_time)



            record = {

                "station_id": station_id or f"AWS_{station_name}",

                "station_name": station_name,

                "station_type": "AWS",

                "latitude": round(lat, 5),

                "longitude": round(lon, 5),

                "observation_time": obs_time.isoformat() if obs_time else None,

                "acquisition_time": self.acquisition_time.isoformat(),

                "temperature_c": temp,

                "temperature_min_c": temp_min,

                "temperature_max_c": temp_max,

                "relative_humidity_pct": rh,

                "wind_speed_kmh": round(wind_speed * 1.852, 2) if wind_speed is not None else None, # convert knots to km/h

                "wind_speed_ms": round(wind_speed * 0.514444, 2) if wind_speed is not None else None,

                "wind_direction_deg": wind_dir,

                "pressure_hpa": pressure_mslp,

                "raw_pressure": raw_pressure,

                "dewpoint_c": dewpoint,

                "rainfall_mm": rainfall,

                "rainfall_accum_period": "recent_observation",

                "data_source": "IMD GeoServer (imd:aws_data_layer)",

                "status": freshness,

            }

            records.append(record)

        return records



    def process_synop_features(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:

        """Process IMD Synoptic Observation Station features."""

        records = []

        for f in features:

            props = f.get("properties", {})

            geom = f.get("geometry", {})

            coords = geom.get("coordinates", []) if geom else []



            lon = safe_float(coords[0]) if len(coords) > 0 else safe_float(props.get("longitude1"))

            lat = safe_float(coords[1]) if len(coords) > 1 else safe_float(props.get("latitude1"))



            if lon is None or lat is None:

                continue



            if not (WEST <= lon <= EAST and SOUTH <= lat <= NORTH):

                continue



            station_name = str(props.get("station", "")).strip() or "UNKNOWN_SYNOP"



            raw_stn_id = props.get("station_id")

            if raw_stn_id is not None and str(raw_stn_id).strip() not in ("", "None", "nan", "NaN", "null", "NULL"):

                station_id = str(raw_stn_id).replace(".0", "").strip()

            elif props.get("id"):

                station_id = str(props.get("id")).strip()

            elif props.get("call_sign"):

                station_id = str(props.get("call_sign")).strip()

            else:

                clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", station_name)

                station_id = f"SYNOP_{clean_name}"



            raw_time_str = props.get("update_time") or props.get("dat")

            obs_time = parse_timestamp(raw_time_str)



            temp = safe_float(props.get("dbtemp"))

            dewtemp = safe_float(props.get("dewtemp"))

            rh = safe_float(props.get("rh"))

            wind_speed = safe_float(props.get("windsp"))

            wind_dir = safe_float(props.get("winddir"))

            pressure = safe_float(props.get("mslp"))

            rain_3h = safe_float(props.get("3hrlyrain"))

            rain_24h = safe_float(props.get("24hrlyrain"))



            if temp is not None and (temp < -40.0 or temp > 60.0):

                temp = None

            if rh is not None and (rh < 0.0 or rh > 100.0):

                rh = None



            raw_pressure = pressure

            pressure_mslp = None

            if pressure is not None and (850.0 <= pressure <= 1085.0):

                pressure_mslp = round(pressure, 2)



            freshness = calculate_freshness(obs_time, self.acquisition_time)



            record = {

                "station_id": station_id,

                "station_name": station_name,

                "station_type": "SYNOP",

                "latitude": round(lat, 5),

                "longitude": round(lon, 5),

                "observation_time": obs_time.isoformat() if obs_time else None,

                "acquisition_time": self.acquisition_time.isoformat(),

                "temperature_c": temp,

                "temperature_min_c": safe_float(props.get("min")),

                "temperature_max_c": safe_float(props.get("max")),

                "relative_humidity_pct": rh,

                "wind_speed_kmh": round(wind_speed * 1.852, 2) if wind_speed is not None else None,

                "wind_speed_ms": round(wind_speed * 0.514444, 2) if wind_speed is not None else None,

                "wind_direction_deg": wind_dir,

                "pressure_hpa": pressure_mslp,

                "raw_pressure": raw_pressure,

                "dewpoint_c": dewtemp,

                "rainfall_mm": rain_24h if rain_24h is not None else rain_3h,

                "rainfall_accum_period": "24h" if rain_24h is not None else ("3h" if rain_3h is not None else "unknown"),

                "data_source": "IMD GeoServer (imd:synop_data_layer)",

                "status": freshness,

            }

            records.append(record)

        return records



    def process_metar_features(self, features: List[Dict[str, Any]]) -> List[Dict[str, Any]]:

        """Process IMD METAR Airport Station features."""

        records = []

        for f in features:

            props = f.get("properties", {})

            geom = f.get("geometry", {})

            coords = geom.get("coordinates", []) if geom else []



            lon = safe_float(coords[0]) if len(coords) > 0 else safe_float(props.get("lon"))

            lat = safe_float(coords[1]) if len(coords) > 1 else safe_float(props.get("lat"))



            if lon is None or lat is None:

                continue



            if not (WEST <= lon <= EAST and SOUTH <= lat <= NORTH):

                continue



            station_name = str(props.get("station_name", "")).strip() or "UNKNOWN_METAR"



            raw_stn_id = props.get("station_id")

            if raw_stn_id is not None and str(raw_stn_id).strip() not in ("", "None", "nan", "NaN", "null", "NULL"):

                station_id = str(raw_stn_id).strip()

            elif props.get("id"):

                station_id = str(props.get("id")).strip()

            elif props.get("call_sign"):

                station_id = str(props.get("call_sign")).strip()

            else:

                clean_name = re.sub(r"[^a-zA-Z0-9_]", "_", station_name)

                station_id = f"METAR_{clean_name}"



            raw_time_str = props.get("update_time") or props.get("dat")

            obs_time = parse_timestamp(raw_time_str)



            temp = safe_float(props.get("temp"))

            dewtemp = safe_float(props.get("dewtemp"))

            rh = safe_float(props.get("rh"))

            wind_speed = safe_float(props.get("windsp"))

            wind_dir = safe_float(props.get("winddir"))

            pressure = safe_float(props.get("mslp"))



            if temp is not None and (temp < -40.0 or temp > 60.0):

                temp = None

            if rh is not None and (rh < 0.0 or rh > 100.0):

                rh = None



            raw_pressure = pressure

            pressure_mslp = None

            if pressure is not None and (850.0 <= pressure <= 1085.0):

                pressure_mslp = round(pressure, 2)



            freshness = calculate_freshness(obs_time, self.acquisition_time)



            record = {

                "station_id": station_id,

                "station_name": f"{station_name} Airport",

                "station_type": "METAR",

                "latitude": round(lat, 5),

                "longitude": round(lon, 5),

                "observation_time": obs_time.isoformat() if obs_time else None,

                "acquisition_time": self.acquisition_time.isoformat(),

                "temperature_c": temp,

                "temperature_min_c": None,

                "temperature_max_c": None,

                "relative_humidity_pct": rh,

                "wind_speed_kmh": round(wind_speed * 1.852, 2) if wind_speed is not None else None,

                "wind_speed_ms": round(wind_speed * 0.514444, 2) if wind_speed is not None else None,

                "wind_direction_deg": wind_dir,

                "pressure_hpa": pressure_mslp,

                "raw_pressure": raw_pressure,

                "dewpoint_c": dewtemp,

                "rainfall_mm": safe_float(props.get("24hrlyrain")),

                "rainfall_accum_period": "24h",

                "data_source": "IMD GeoServer (imd:metar_data_layer)",

                "status": freshness,

            }

            records.append(record)

        return records



    def run_ingestion(self) -> Tuple[pd.DataFrame, Dict[str, Any]]:

        """Run the complete multi-network IMD weather ingestion pipeline."""

        RAW_IMD_DIR.mkdir(parents=True, exist_ok=True)

        PROCESSED_WEATHER_DIR.mkdir(parents=True, exist_ok=True)



        logger.info("=" * 60)

        logger.info("STARTING IMD METEOROLOGICAL DATA INGESTION")

        logger.info(f"Target Region: Uttarakhand BBox [{WEST}°E-{EAST}°E, {SOUTH}°N-{NORTH}°N]")

        logger.info("=" * 60)



        # 1. Fetch raw features from all available IMD layers

        raw_aws = self.fetch_wfs_layer("imd:aws_data_layer")

        raw_synop = self.fetch_wfs_layer("imd:synop_data_layer")

        raw_metar = self.fetch_wfs_layer("imd:metar_data_layer")

        raw_nowcast = self.fetch_wfs_layer("imd:mcwise_station_nowcast_view")



        # 2. Save raw snapshot with full provenance

        timestamp_slug = self.acquisition_time.strftime("%Y%m%d_%H%M%SZ")

        raw_payload = {

            "acquisition_time_utc": self.acquisition_time.isoformat(),

            "region": "Uttarakhand",

            "bounding_box": {

                "west": WEST,

                "east": EAST,

                "south": SOUTH,

                "north": NORTH,

            },

            "layers": {

                "imd:aws_data_layer": raw_aws,

                "imd:synop_data_layer": raw_synop,

                "imd:metar_data_layer": raw_metar,

                "imd:mcwise_station_nowcast_view": raw_nowcast,

            },

        }



        raw_file = RAW_IMD_DIR / f"imd_raw_observations_{timestamp_slug}.json"

        with open(raw_file, "w", encoding="utf-8") as f:

            json.dump(raw_payload, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved raw observation snapshot: {raw_file}")



        # 3. Process each network

        aws_records = self.process_aws_features(raw_aws)

        synop_records = self.process_synop_features(raw_synop)

        metar_records = self.process_metar_features(raw_metar)



        logger.info(f"Processed {len(aws_records)} AWS stations in Uttarakhand")

        logger.info(f"Processed {len(synop_records)} SYNOP stations in Uttarakhand")

        logger.info(f"Processed {len(metar_records)} METAR stations in Uttarakhand")



        all_records = aws_records + synop_records + metar_records



        if not all_records:

            logger.error("No meteorological stations found in Uttarakhand bounding box!")

            return pd.DataFrame(), {}



        df = pd.DataFrame(all_records)



        # Deduplicate stations (prefer SYNOP/METAR over AWS if duplicate ID/name at same location)

        df["priority"] = df["station_type"].map({"SYNOP": 1, "METAR": 2, "AWS": 3}).fillna(9)

        df = df.sort_values(by=["station_name", "priority"]).drop_duplicates(

            subset=["station_name", "latitude", "longitude"], keep="first"

        ).drop(columns=["priority"])



        # 4. Save standardized datasets

        csv_file = PROCESSED_WEATHER_DIR / "imd_weather_stations.csv"

        json_file = PROCESSED_WEATHER_DIR / "imd_weather_latest.json"



        df.to_csv(csv_file, index=False)

        logger.info(f"Saved processed station CSV: {csv_file}")



        metadata_summary = {

            "acquisition_time_utc": self.acquisition_time.isoformat(),

            "target_region": "Uttarakhand, India",

            "bounding_box": {"west": WEST, "east": EAST, "south": SOUTH, "north": NORTH},

            "total_stations_monitored": len(df),

            "station_types": df["station_type"].value_counts().to_dict(),

            "data_status_breakdown": df["status"].value_counts().to_dict(),

            "variable_coverage": {

                "temperature": int(df["temperature_c"].notnull().sum()),

                "relative_humidity": int(df["relative_humidity_pct"].notnull().sum()),

                "wind_speed": int(df["wind_speed_kmh"].notnull().sum()),

                "pressure": int(df["pressure_hpa"].notnull().sum()),

                "rainfall": int(df["rainfall_mm"].notnull().sum()),

            },

            "active_stations_sample": df[df["status"] == "LIVE"][

                ["station_name", "station_type", "latitude", "longitude", "temperature_c", "relative_humidity_pct", "wind_speed_kmh", "pressure_hpa", "rainfall_mm", "observation_time"]

            ].to_dict(orient="records"),

        }



        with open(json_file, "w", encoding="utf-8") as f:

            json.dump(metadata_summary, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved processed weather JSON: {json_file}")



        return df, metadata_summary





# ============================================================

# MAIN EXECUTION & VALIDATION

# ============================================================



def main():

    engine = IMDIngestionEngine()

    df, summary = engine.run_ingestion()



    if df.empty:

        print("\nERROR: Ingestion failed to produce data.")

        sys.exit(1)



    print("\n" + "=" * 70)

    print("IMD WEATHER INGESTION VALIDATION REPORT (PHASE 1B)")

    print("=" * 70)



    print(f"\nTotal Uttarakhand Stations Monitored: {len(df)}")

    print(f"Station Breakdown:")

    for stype, count in summary["station_types"].items():

        print(f"  - {stype}: {count} stations")



    print(f"\nData Freshness Breakdown:")

    for status, count in summary["data_status_breakdown"].items():

        print(f"  - {status}: {count} stations")



    print(f"\nVariable Coverage & Non-Null Counts:")

    for var, count in summary["variable_coverage"].items():

        pct = (count / len(df)) * 100.0

        print(f"  - {var:20s}: {count:3d}/{len(df):3d} ({pct:5.1f}%)")



    # Statistics on LIVE stations

    df_live = df[df["status"] == "LIVE"]

    print(f"\nActive / Live Reporting Stations ({len(df_live)} stations):")

    if not df_live.empty:

        active_cols = ["station_name", "station_type", "temperature_c", "relative_humidity_pct", "wind_speed_kmh", "pressure_hpa", "rainfall_mm"]

        print(df_live[active_cols].to_string(index=False))



        print("\nLive Weather Metrics Summary:")

        if df_live["temperature_c"].notnull().any():

            print(f"  Temperature       : Min = {df_live['temperature_c'].min():.1f} °C, Max = {df_live['temperature_c'].max():.1f} °C, Mean = {df_live['temperature_c'].mean():.1f} °C")

        if df_live["relative_humidity_pct"].notnull().any():

            print(f"  Relative Humidity : Min = {df_live['relative_humidity_pct'].min():.1f} %, Max = {df_live['relative_humidity_pct'].max():.1f} %, Mean = {df_live['relative_humidity_pct'].mean():.1f} %")

        if df_live["wind_speed_kmh"].notnull().any():

            print(f"  Wind Speed        : Min = {df_live['wind_speed_kmh'].min():.1f} km/h, Max = {df_live['wind_speed_kmh'].max():.1f} km/h, Mean = {df_live['wind_speed_kmh'].mean():.1f} km/h")

        if df_live["pressure_hpa"].notnull().any():

            print(f"  Pressure (MSLP)   : Min = {df_live['pressure_hpa'].min():.1f} hPa, Max = {df_live['pressure_hpa'].max():.1f} hPa, Mean = {df_live['pressure_hpa'].mean():.1f} hPa")

        if df_live["rainfall_mm"].notnull().any():

            print(f"  Rainfall          : Min = {df_live['rainfall_mm'].min():.1f} mm, Max = {df_live['rainfall_mm'].max():.1f} mm, Mean = {df_live['rainfall_mm'].mean():.1f} mm")



    print("\n" + "=" * 70)

    print("PHASE 1B INGESTION COMPLETE")

    print("=" * 70)





if __name__ == "__main__":

    main()
