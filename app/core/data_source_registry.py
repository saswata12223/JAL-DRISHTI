"""
Jal Drishti — Data Source Registry

Single authoritative registry of all data sources documented in the project.
Each source entry describes WHAT IS KNOWN about the source, not what is
assumed or wished.

IMPORTANT DISTINCTIONS enforced here:
  - adapter_exists ≠ AVAILABLE
  - historical_files_exist ≠ live source
  - source URL exists ≠ reachable
  - last_successful_observation must be a verified timestamp, never system clock

Sources are registered only if they appear in existing project code,
documentation, ingestion scripts, or processed data artifacts.

Traceable evidence for each source is documented inline.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional

from app.core.freshness import FreshnessPolicy, compute_freshness, DataSourceFreshness


# ---------------------------------------------------------------------------
# Source availability status enum
# ---------------------------------------------------------------------------
class DataSourceAvailabilityStatus(str, Enum):
    AVAILABLE           = "AVAILABLE"           # Ingestion adapter exists & live access confirmed
    PARTIALLY_AVAILABLE = "PARTIALLY_AVAILABLE" # Historical files exist; live access not confirmed
    UNAVAILABLE         = "UNAVAILABLE"         # Definitively cannot be reached
    NOT_CONFIGURED      = "NOT_CONFIGURED"      # No adapter or credentials configured
    NOT_VERIFIED        = "NOT_VERIFIED"        # Existence documented but reachability not tested


# ---------------------------------------------------------------------------
# Data source entry
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class DataSourceEntry:
    """
    Immutable metadata record for a registered data source.

    Fields:
        source_id:                   Canonical snake_case identifier.
        display_name:                Human-readable name.
        provider:                    Organization providing the data.
        description:                 What this source provides.
        region_ids:                  Regions this source covers in the project.
        variables:                   Physical variables provided.
        temporal_resolution:         Human-readable (e.g. "30-min", "daily").
        spatial_resolution:          Human-readable (e.g. "0.1°", "90m").
        coverage_start:              Earliest available data (None if unknown).
        coverage_end:                Latest available data or None for ongoing.
        access_method:               How data is accessed (API, FTP, file, etc.).
        source_url:                  Official URL (not guaranteed reachable).
        availability_status:         Honest current status (see enum).
        freshness_policy:            Expected update interval.
        last_successful_observation: Verified last observation time (None if unknown).
        usable_for_inference:        Whether this source is currently usable in ML.
        limitations:                 Known issues, caveats, or restrictions.
        adapter_exists:              Whether an ingestion script exists in project.
        evidence:                    Where this source appears in the project.
    """
    source_id: str
    display_name: str
    provider: str
    description: str
    region_ids: List[str]
    variables: List[str]
    temporal_resolution: str
    spatial_resolution: str
    coverage_start: Optional[str]             # ISO date string or None
    coverage_end: Optional[str]               # ISO date string or None = ongoing
    access_method: str
    source_url: Optional[str]
    availability_status: DataSourceAvailabilityStatus
    freshness_policy: FreshnessPolicy
    last_successful_observation: Optional[datetime]   # MUST be verified; None otherwise
    usable_for_inference: bool
    limitations: str
    adapter_exists: bool
    evidence: str                             # File(s) where source is referenced


# ---------------------------------------------------------------------------
# Registry data — sources documented in the existing project
# ---------------------------------------------------------------------------
_SOURCES: List[DataSourceEntry] = [

    # ── OpenWeatherMap (Phase 17 Live Telemetry Proxy) ────────────────────
    DataSourceEntry(
        source_id="openweather",
        display_name="OpenWeatherMap Live Telemetry",
        provider="OpenWeatherMap",
        description=(
            "Live surface meteorological observations acting as a genuine "
            "telemetry proxy since official IMD/CWC REST APIs are inaccessible."
        ),
        region_ids=["uttarakhand"],
        variables=["temperature_c", "relative_humidity_pct", "surface_pressure_hpa",
                   "wind_speed_ms"],
        temporal_resolution="Real-time",
        spatial_resolution="Point",
        coverage_start="2026-09-24",
        coverage_end=None,
        access_method="REST API",
        source_url="https://openweathermap.org",
        availability_status=DataSourceAvailabilityStatus.PARTIALLY_AVAILABLE,
        freshness_policy=FreshnessPolicy.SUB_HOURLY,
        last_successful_observation=None,
        usable_for_inference=False,
        limitations="Does not supply full feature schema for XGBoost inference.",
        adapter_exists=True,
        evidence="app/services/weather_adapter.py, app/api/routes/live.py",
    ),

    # ── IMD (India Meteorological Department) ─────────────────────────────
    DataSourceEntry(
        source_id="imd_aws_arg",
        display_name="IMD AWS/ARG Meteorological Network",
        provider="India Meteorological Department (IMD)",
        description=(
            "Automatic Weather Stations (AWS) and Automatic Rain Gauges (ARG) "
            "operated by IMD across Uttarakhand. Provides near-realtime "
            "temperature, humidity, pressure, wind speed, and rainfall."
        ),
        region_ids=["uttarakhand"],
        variables=["temperature_c", "relative_humidity_pct", "surface_pressure_hpa",
                   "wind_speed_ms", "rainfall_mm"],
        temporal_resolution="3-hourly (typical)",
        spatial_resolution="Point (station-based)",
        coverage_start="2020-01-01",
        coverage_end=None,
        access_method="REST API / FTP",
        source_url="https://aws.imd.gov.in",
        availability_status=DataSourceAvailabilityStatus.PARTIALLY_AVAILABLE,
        freshness_policy=FreshnessPolicy.SUB_HOURLY,
        last_successful_observation=None,  # Not verified live; historical files exist
        usable_for_inference=False,        # Adapter exists but live access not confirmed
        limitations=(
            "Live API access not confirmed. Historical standardized files exist at "
            "data/processed/standardized/standardized_weather_stations.parquet. "
            "Adapter present in scripts/imd_ingest.py."
        ),
        adapter_exists=True,
        evidence="scripts/imd_ingest.py, app/services/data_loader.py, "
                 "data/processed/standardized/standardized_weather_stations.parquet",
    ),

    # ── GPM IMERG ──────────────────────────────────────────────────────────
    DataSourceEntry(
        source_id="gpm_imerg",
        display_name="NASA GPM IMERG Precipitation",
        provider="NASA / JAXA Global Precipitation Measurement (GPM)",
        description=(
            "Multi-satellite precipitation estimates at 0.1° × 0.1° resolution. "
            "Used as primary gridded rainfall input for flood-risk feature engineering. "
            "Historical files processed; near-realtime access requires NASA Earthdata credentials."
        ),
        region_ids=["uttarakhand"],
        variables=["precipitation_mm_hr", "rainfall_30min_mm", "rainfall_1h_mm",
                   "rainfall_3h_mm"],
        temporal_resolution="30-min",
        spatial_resolution="0.1° (~11 km)",
        coverage_start="2000-06-01",
        coverage_end=None,
        access_method="NASA Earthdata HTTPS / OPeNDAP",
        source_url="https://gpm.nasa.gov/data/imerg",
        availability_status=DataSourceAvailabilityStatus.PARTIALLY_AVAILABLE,
        freshness_policy=FreshnessPolicy.DAILY,
        last_successful_observation=None,  # Near-realtime access not confirmed
        usable_for_inference=False,        # Historical files used; live access not confirmed
        limitations=(
            "Near-realtime IMERG (NRT) lag is ~4h. Final-run IMERG lag is ~3.5 months. "
            "Historical processed files at data/processed/rainfall/. "
            "Live access adapter in scripts/gpm_auto_ingest.py; requires Earthdata credentials."
        ),
        adapter_exists=True,
        evidence="scripts/gpm_auto_ingest.py, scripts/gpm_nasa_download.py, "
                 "data/processed/rainfall/, data/processed/ml/models/phase2b/gpm_inventory.csv",
    ),

    # ── NASA SMAP ──────────────────────────────────────────────────────────
    DataSourceEntry(
        source_id="nasa_smap_l4",
        display_name="NASA SMAP L4 Soil Moisture",
        provider="NASA Jet Propulsion Laboratory (JPL)",
        description=(
            "SMAP Level-4 Surface and Root Zone Soil Moisture (SPL4SMGP v008). "
            "Provides 9-km gridded soil moisture for Uttarakhand. "
            "Used as soil saturation input for flood risk model."
        ),
        region_ids=["uttarakhand"],
        variables=["surface_soil_moisture_vol", "rootzone_soil_moisture_vol",
                   "profile_soil_moisture_vol", "soil_saturation_index"],
        temporal_resolution="3-hourly",
        spatial_resolution="9 km",
        coverage_start="2015-04-01",
        coverage_end=None,
        access_method="NASA Earthdata HTTPS (earthaccess)",
        source_url="https://nsidc.org/data/SPL4SMGP",
        availability_status=DataSourceAvailabilityStatus.PARTIALLY_AVAILABLE,
        freshness_policy=FreshnessPolicy.DAILY,   # FRESH < 24h per smap_l4_ingest.py
        last_successful_observation=None,          # Not verified live
        usable_for_inference=False,
        limitations=(
            "Historical files exist at data/processed/standardized/. "
            "Live SMAP L4 product has ~7-day latency. "
            "Ingestion adapter at scripts/smap_l4_ingest.py; requires NASA Earthdata auth. "
            "FRESH threshold: 24h, AGING: 72h (per existing scripts/smap_l4_ingest.py)."
        ),
        adapter_exists=True,
        evidence="scripts/smap_l4_ingest.py, scripts/smap_ingest.py, "
                 "tests/test_smap_l4_ingest.py, data/processed/ml/models/phase2b/smap_inventory.csv",
    ),

    # ── CWC (Central Water Commission) ────────────────────────────────────
    DataSourceEntry(
        source_id="cwc_water_level",
        display_name="CWC Real-Time River Stage / Water Level",
        provider="Central Water Commission (CWC), Government of India",
        description=(
            "Official CWC telemetry network providing river stage, warning level, "
            "danger level, and Highest Flood Level (HFL) for gauging stations "
            "across Uttarakhand. Station flood thresholds are CWC-verified."
        ),
        region_ids=["uttarakhand"],
        variables=["water_level_m", "warning_level_m", "danger_level_m", "hfl_m",
                   "official_alert_stage", "official_flood_status"],
        temporal_resolution="Hourly (telemetry-dependent)",
        spatial_resolution="Point (gauge station)",
        coverage_start="2010-01-01",
        coverage_end=None,
        access_method="India-WRIS portal / CWC telemetry API",
        source_url="https://indiawris.gov.in",
        availability_status=DataSourceAvailabilityStatus.PARTIALLY_AVAILABLE,
        freshness_policy=FreshnessPolicy.HOURLY,
        last_successful_observation=None,  # Live telemetry not confirmed active
        usable_for_inference=False,
        limitations=(
            "Flood thresholds from CWC are verified and in data/processed/risk/flood_thresholds.parquet. "
            "Live water-level telemetry is NOT confirmed accessible. "
            "Current system uses static threshold files; live gauge readings are missing. "
            "is_telemetry_missing=True is set for all current records."
        ),
        adapter_exists=False,  # No live CWC telemetry adapter in scripts/
        evidence="app/services/data_loader.py, data/processed/risk/flood_thresholds.parquet, "
                 "data/waterlevel/cwc_water_level_latest.json",
    ),

    # ── SRTM DEM ──────────────────────────────────────────────────────────
    DataSourceEntry(
        source_id="srtm_dem",
        display_name="SRTM 90m Digital Elevation Model",
        provider="NASA / NGA (Shuttle Radar Topography Mission)",
        description=(
            "90m resolution DEM used for slope, aspect, elevation, and "
            "topographic wetness index features in the flood risk model."
        ),
        region_ids=["uttarakhand"],
        variables=["elevation_m", "slope_deg", "aspect_deg", "twi"],
        temporal_resolution="Static (one-time acquisition: Feb 2000)",
        spatial_resolution="90m (SRTM3)",
        coverage_start="2000-02-01",
        coverage_end="2000-02-28",
        access_method="One-time download (processed files present)",
        source_url="https://srtm.csi.cgiar.org",
        availability_status=DataSourceAvailabilityStatus.AVAILABLE,
        freshness_policy=FreshnessPolicy.STATIC,
        last_successful_observation=None,  # Static dataset; not applicable
        usable_for_inference=True,         # Processed files present and used in model
        limitations="Static dataset. Processed terrain features in data/processed/terrain/.",
        adapter_exists=True,
        evidence="scripts/dem_ingest.py, scripts/terrain_features.py, "
                 "data/processed/terrain/terrain_features.nc",
    ),

    # ── ESA WorldCover ─────────────────────────────────────────────────────
    DataSourceEntry(
        source_id="esa_worldcover",
        display_name="ESA WorldCover 10m Land Use / Land Cover",
        provider="European Space Agency (ESA) / Copernicus",
        description=(
            "10m global land cover classification used to derive SCS-CN "
            "landcover_class features for the flood risk model."
        ),
        region_ids=["uttarakhand"],
        variables=["landcover_class"],
        temporal_resolution="Static (2020 / 2021 editions)",
        spatial_resolution="10m",
        coverage_start="2020-01-01",
        coverage_end="2021-12-31",
        access_method="One-time download (processed files present)",
        source_url="https://esa-worldcover.org",
        availability_status=DataSourceAvailabilityStatus.AVAILABLE,
        freshness_policy=FreshnessPolicy.STATIC,
        last_successful_observation=None,  # Static dataset
        usable_for_inference=True,
        limitations="Static dataset. Processed landcover features at data/processed/features/.",
        adapter_exists=True,
        evidence="scripts/landcover_ingest.py, data/processed/features/",
    ),

    # ── Historical Flood Event Catalog ────────────────────────────────────
    DataSourceEntry(
        source_id="historical_event_catalog",
        display_name="Jal Drishti Historical Flood & Disaster Event Catalog",
        provider="IMD / CWC / USDMA / NDMA / NIDM (assembled)",
        description=(
            "Curated catalog of Uttarakhand flood, GLOF, landslide, and "
            "cloudburst events used for model training, validation, and "
            "historical replay. NOT a live event feed."
        ),
        region_ids=["uttarakhand"],
        variables=["event_type", "event_date", "severity_category", "deaths",
                   "affected_population", "triggering_hazard"],
        temporal_resolution="Event-based (historical archive)",
        spatial_resolution="District / Location point",
        coverage_start="1970-01-01",
        coverage_end="2026-06-30",
        access_method="Processed Parquet files (no live feed)",
        source_url=None,
        availability_status=DataSourceAvailabilityStatus.AVAILABLE,
        freshness_policy=FreshnessPolicy.HISTORICAL,
        last_successful_observation=None,  # Historical archive; not a live feed
        usable_for_inference=False,        # Used for training/benchmarking only
        limitations=(
            "THIS IS A HISTORICAL ARCHIVE, NOT A LIVE EVENT FEED. "
            "Data sourced from multiple agencies with varying confidence levels. "
            "Coverage is primarily Uttarakhand (1970–2026)."
        ),
        adapter_exists=True,
        evidence="scripts/historical_events.py, app/services/data_loader.py, "
                 "data/processed/standardized/standardized_historical_events.parquet",
    ),

    # ── ERA5 / ERA5-Land ───────────────────────────────────────────────────
    DataSourceEntry(
        source_id="era5_land",
        display_name="ECMWF ERA5-Land Reanalysis",
        provider="European Centre for Medium-Range Weather Forecasts (ECMWF)",
        description=(
            "ERA5-Land hourly reanalysis used in RiverMamba and LSTM research "
            "experiments within the project. Not currently used in the operational "
            "XGBoost inference pipeline."
        ),
        region_ids=["uttarakhand"],
        variables=["temperature_2m", "precipitation_m", "soil_moisture", "runoff"],
        temporal_resolution="Hourly",
        spatial_resolution="0.1° (~11 km)",
        coverage_start="1950-01-01",
        coverage_end=None,
        access_method="ECMWF CDS API (requires API key)",
        source_url="https://cds.climate.copernicus.eu",
        availability_status=DataSourceAvailabilityStatus.NOT_CONFIGURED,
        freshness_policy=FreshnessPolicy.DAILY,
        last_successful_observation=None,
        usable_for_inference=False,
        limitations=(
            "Used in scripts/rivermamba_code only. Not part of operational XGBoost pipeline. "
            "Requires ECMWF CDS API credentials not configured in project."
        ),
        adapter_exists=True,
        evidence="scripts/rivermamba_code/scripts/donwload_era5_land_reanalysis.sh, "
                 "data/processed/ml/models/phase2b/",
    ),

    # ── GLDAS ─────────────────────────────────────────────────────────────
    DataSourceEntry(
        source_id="gldas",
        display_name="NASA GLDAS Land Surface Model Output",
        provider="NASA Goddard Space Flight Center (GSFC)",
        description=(
            "Global Land Data Assimilation System soil moisture and land surface "
            "variables used in Phase 2 data acquisition research. Not confirmed "
            "in the operational inference pipeline."
        ),
        region_ids=["uttarakhand"],
        variables=["soil_moisture_kg_m2", "evapotranspiration", "runoff_mm_day"],
        temporal_resolution="3-hourly",
        spatial_resolution="0.25°",
        coverage_start="2000-01-01",
        coverage_end=None,
        access_method="NASA Earthdata HTTPS",
        source_url="https://ldas.gsfc.nasa.gov/gldas",
        availability_status=DataSourceAvailabilityStatus.NOT_VERIFIED,
        freshness_policy=FreshnessPolicy.DAILY,
        last_successful_observation=None,
        usable_for_inference=False,
        limitations=(
            "Referenced in Phase 2 data acquisition research (phase2d/gldas_test_samples.csv). "
            "Not confirmed in operational ML pipeline. Access requires NASA Earthdata auth."
        ),
        adapter_exists=False,
        evidence="data/processed/ml/models/phase2d/gldas_test_samples.csv, "
                 "data/processed/ml/models/phase2e/gldas_acquisition_manifest.csv",
    ),
]


# ---------------------------------------------------------------------------
# Registry access functions
# ---------------------------------------------------------------------------

_SOURCE_INDEX: Dict[str, DataSourceEntry] = {s.source_id: s for s in _SOURCES}


def get_source(source_id: str) -> Optional[DataSourceEntry]:
    """Return a source entry by its canonical ID, or None if not registered."""
    return _SOURCE_INDEX.get(source_id)


def list_sources() -> List[str]:
    """Return all registered source IDs."""
    return list(_SOURCE_INDEX.keys())


def list_sources_for_region(region_id: str) -> List[DataSourceEntry]:
    """Return all source entries that cover the given region_id."""
    return [s for s in _SOURCES if region_id in s.region_ids]


def get_source_freshness(
    source_id: str,
    region_id: str,
    now: Optional[datetime] = None,
) -> Optional[DataSourceFreshness]:
    """
    Compute the current freshness for a source/region pair.

    Returns None if the source is not registered.
    Returns a DataSourceFreshness with UNKNOWN state if no verified
    observation timestamp is available.
    """
    from datetime import timezone as _tz
    from app.core.freshness import FreshnessState

    entry = get_source(source_id)
    if entry is None:
        return None

    _now = now or datetime.now(_tz.utc)

    if region_id not in entry.region_ids:
        return DataSourceFreshness(
            source_id=source_id,
            region_id=region_id,
            availability_status=DataSourceAvailabilityStatus.UNAVAILABLE.value,
            freshness_state=FreshnessState.UNKNOWN,
            last_successful_observation=None,
            data_age_seconds=None,
            checked_at=_now,
            usable_for_inference=False,
            reason=f"Source '{source_id}' does not cover region '{region_id}'.",
        )

    return compute_freshness(
        source_id=source_id,
        region_id=region_id,
        policy=entry.freshness_policy,
        last_successful_observation=entry.last_successful_observation,
        availability_status=entry.availability_status.value,
        usable_for_inference=entry.usable_for_inference,
        now=_now,
    )

