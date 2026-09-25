"""
Jal Drishti — Regional GIS Abstraction (Phase 6)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GIS AUDIT FINDINGS (performed 2026-09-23)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vector files found in repository:
  data/processed/risk/flood_thresholds.geojson
    → FeatureCollection of 20 POINT features (CWC gauge stations)
    → NOT a boundary polygon

  data/processed/standardized/standardized_historical_events.geojson
    → FeatureCollection of 15 POINT features (historical disaster events)
    → NOT a boundary polygon

Raster files found in repository:
  data/processed/terrain/terrain_features.tif / .nc
  data/processed/landcover/landcover_uttarakhand.tif / .nc
  data/processed/features/multimodal_static_features.tif / .nc
  data/processed/standardized/unified_static_features.tif / .nc
    → ML feature rasters clipped to Uttarakhand project extent
    → NOT administrative boundary polygons

Installed GIS libraries:
  shapely 2.1.2  — AVAILABLE
  geopandas      — NOT INSTALLED
  pyproj         — NOT INSTALLED

CONCLUSION:
  No authoritative administrative boundary polygon exists in the repository
  for any region: Uttarakhand, Maharashtra Western Ghats, Sikkim, or others.

  The project uses a coarse bounding box as a data-acquisition extent:
    lon: 77.80 – 81.10 E
    lat: 28.50 – 31.50 N
  This is documented in app/config.py as BBOX_* constants.
  It is NOT the official Uttarakhand state boundary.

GEOMETRY STATUS PER REGION:
  uttarakhand              → GEOMETRY_UNAVAILABLE (no authoritative polygon)
  maharashtra_western_ghats → GEOMETRY_UNAVAILABLE
  sikkim_eastern_himalayas  → GEOMETRY_UNAVAILABLE
  chota_nagpur_plateau      → GEOMETRY_UNAVAILABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN CONSTRAINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Because no authoritative polygon boundaries exist:
  - Point-in-polygon containment is NOT POSSIBLE for any region.
  - The project bounding box (77.8-81.1E, 28.5-31.5N) is exposed as
    PROJECT_EXTENT_ONLY — a coarse data-acquisition extent, never an
    authoritative boundary.
  - Coordinates inside the project extent are labelled WITHIN_PROJECT_EXTENT,
    not RESOLVED to a region.
  - A coordinate is only RESOLVED when an authoritative polygon is loaded.

Dependencies used:
  - shapely.geometry.Point: coordinate validation and point construction only.
    NO polygon containment (since no authoritative polygons exist yet).
  - No geopandas, no pyproj (not installed).
"""

import math
import os
import threading
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from shapely.geometry import Point
import shapely
import shapely.ops

try:
    import pyogrio
    import pyproj
    from shapely import from_wkb
    from shapely.strtree import STRtree
    GIS_DEPS_AVAILABLE = True
except ImportError:
    GIS_DEPS_AVAILABLE = False


# ── Resolution status vocabulary ────────────────────────────────────────────

class GISResolutionStatus(str, Enum):
    RESOLVED             = "RESOLVED"              # Authoritative polygon confirmed membership
    WITHIN_PROJECT_EXTENT = "WITHIN_PROJECT_EXTENT" # Inside coarse UK data extent; not authoritative
    OUTSIDE_KNOWN_REGIONS = "OUTSIDE_KNOWN_REGIONS" # Outside all known project extents
    GEOMETRY_UNAVAILABLE  = "GEOMETRY_UNAVAILABLE"  # No authoritative polygon registered
    INVALID_COORDINATES   = "INVALID_COORDINATES"   # Coordinate validation failed
    AMBIGUOUS             = "AMBIGUOUS"             # Point lies within multiple regions
    UNKNOWN               = "UNKNOWN"               # Cannot determine


# ── Coordinate validation ────────────────────────────────────────────────────

class CoordinateValidationError(ValueError):
    """Raised when coordinates fail validation."""
    pass


def validate_coordinate(latitude: Any, longitude: Any) -> Tuple[float, float]:
    """
    Strictly validates a latitude/longitude pair.

    Rules:
      -90 <= latitude <= 90
      -180 <= longitude <= 180
      Neither value may be NaN or infinite.
      Neither value may be None or non-numeric.

    Returns:
      (latitude, longitude) as floats if valid.

    Raises:
      CoordinateValidationError with a descriptive message.

    IMPORTANT: Invalid coordinates are REJECTED, never silently clamped.
    """
    for name, val, lo, hi in [
        ("latitude",  latitude,  -90.0,  90.0),
        ("longitude", longitude, -180.0, 180.0),
    ]:
        if val is None:
            raise CoordinateValidationError(f"{name} is None.")
        try:
            v = float(val)
        except (TypeError, ValueError):
            raise CoordinateValidationError(
                f"{name} '{val}' cannot be converted to float."
            )
        if math.isnan(v):
            raise CoordinateValidationError(f"{name} is NaN.")
        if math.isinf(v):
            raise CoordinateValidationError(f"{name} is infinite.")
        if not (lo <= v <= hi):
            raise CoordinateValidationError(
                f"{name} {v} is outside valid range [{lo}, {hi}]."
            )

    return float(latitude), float(longitude)


def build_point_epsg4326(latitude: float, longitude: float) -> Point:
    """
    Construct a Shapely Point in EPSG:4326 (lon, lat order).

    Shapely follows WKT/GeoJSON convention: Point(longitude, latitude).
    Coordinates must already be validated before calling this function.
    """
    return Point(longitude, latitude)


# ── Project extent (coarse, non-authoritative) ───────────────────────────────

# This is the Uttarakhand data-acquisition bounding box from app/config.py.
# It is documented as PROJECT_EXTENT only — NOT the official state boundary.
_PROJECT_EXTENT = {
    "label": "Uttarakhand Project Extent (data acquisition bbox)",
    "authority": "INTERNAL_PROJECT_CONFIG",
    "source_file": "app/config.py (BBOX_MIN_LON, BBOX_MAX_LON, BBOX_MIN_LAT, BBOX_MAX_LAT)",
    "crs": "EPSG:4326",
    "lon_min": 77.80,
    "lon_max": 81.10,
    "lat_min": 28.50,
    "lat_max": 31.50,
    "is_authoritative_boundary": False,
    "note": (
        "This bbox is used solely for data acquisition scoping. "
        "It is not an official Uttarakhand state boundary and must not "
        "be used for authoritative geographic membership decisions."
    ),
}


def _is_within_project_extent(latitude: float, longitude: float) -> bool:
    """Returns True if the coordinate falls within the coarse project bbox."""
    e = _PROJECT_EXTENT
    return (
        e["lat_min"] <= latitude <= e["lat_max"]
        and e["lon_min"] <= longitude <= e["lon_max"]
    )


# ── Geometry registry ─────────────────────────────────────────────────────────

@dataclass(frozen=True)
class RegionGeometryRecord:
    """
    Metadata about a region's geometry availability.

    geometry_available: True only when an authoritative polygon is loaded.
    geometry_source: Where the polygon would/does come from.
    crs: The CRS used by the polygon.
    suitable_for_containment: True only when a valid polygon is in memory.
    note: Any caveats or limitations.
    """
    region_id: str
    geometry_available: bool
    geometry_source: Optional[str]
    crs: Optional[str]
    geometry_type: Optional[str]         # "Polygon", "MultiPolygon", etc.
    authority: Optional[str]             # e.g. "Survey of India", "Census of India"
    suitable_for_containment: bool       # True only with a loaded authoritative polygon
    note: str


# Geometry registry — reflects the actual repository state as of Phase 6 audit.
# geometry_available = False for all regions because no authoritative polygon
# files were found in the repository.
_GEOMETRY_REGISTRY: Dict[str, RegionGeometryRecord] = {
    "uttarakhand": RegionGeometryRecord(
        region_id="uttarakhand",
        geometry_available=False,
        geometry_source=(
            "Required: Survey of India / Census of India state boundary "
            "for Uttarakhand. Not present in repository."
        ),
        crs=None,
        geometry_type=None,
        authority=None,
        suitable_for_containment=False,
        note=(
            "Project uses a coarse bounding box (77.8-81.1E, 28.5-31.5N) "
            "for data acquisition. This is NOT the authoritative state boundary. "
            "To enable polygon containment, acquire and register an authoritative "
            "Uttarakhand boundary GeoJSON/shapefile."
        ),
    ),
    "maharashtra_western_ghats": RegionGeometryRecord(
        region_id="maharashtra_western_ghats",
        geometry_available=False,
        geometry_source=(
            "Required: A verified physiographic/administrative boundary "
            "for Maharashtra Western Ghats sub-region. Not present."
        ),
        crs=None,
        geometry_type=None,
        authority=None,
        suitable_for_containment=False,
        note=(
            "This is a project-defined physiographic region, not a standard "
            "administrative boundary. An authoritative GIS dataset defining "
            "the Western Ghats extent within Maharashtra is required."
        ),
    ),
    "sikkim_eastern_himalayas": RegionGeometryRecord(
        region_id="sikkim_eastern_himalayas",
        geometry_available=False,
        geometry_source="Required: Sikkim state boundary. Not present.",
        crs=None,
        geometry_type=None,
        authority=None,
        suitable_for_containment=False,
        note="No GIS assets for Sikkim in the repository.",
    ),
    "chota_nagpur_plateau": RegionGeometryRecord(
        region_id="chota_nagpur_plateau",
        geometry_available=False,
        geometry_source=(
            "Required: Physiographic boundary for the Chota Nagpur Plateau. "
            "No standard administrative equivalent. Not present."
        ),
        crs=None,
        geometry_type=None,
        authority=None,
        suitable_for_containment=False,
        note=(
            "Chota Nagpur Plateau spans multiple states. A verified "
            "physiographic boundary dataset is required."
        ),
    ),
}


# ── Resolution result ─────────────────────────────────────────────────────────

@dataclass(frozen=True)
class CoordinateResolutionResult:
    """
    Immutable result of attempting to resolve a coordinate to a region.

    status:
      RESOLVED             — authoritative polygon confirmed (not currently possible)
      WITHIN_PROJECT_EXTENT — inside the UK data extent; not authoritative
      OUTSIDE_KNOWN_REGIONS — outside all project extents
      GEOMETRY_UNAVAILABLE  — no authoritative polygon loaded for any region
      INVALID_COORDINATES   — validation failed
      AMBIGUOUS             — coordinate in multiple regions (future use)

    region_id:
      The resolved region or None.

    latitude / longitude:
      The validated coordinates (or the raw values for INVALID).

    geometry_source:
      What geometry determined the result (or None).

    crs:
      CRS of the resolution geometry (or None).

    note:
      A human-readable explanation.
    """
    status: GISResolutionStatus
    region_id: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    geometry_source: Optional[str]
    crs: Optional[str]
    note: str



# ── Administrative Geometry Cache (Phase 7) ──────────────────────────────────

_admin_lock = threading.Lock()
_ADMIN_CACHE = {
    'state': None,
    'district': None,
    'subdistrict': None
}

@dataclass
class AdminLayerCache:
    tree: 'STRtree'
    geometries: List[Any]
    fields: Dict[str, List[Any]]

def _load_admin_layer(layer_name: str) -> Optional[AdminLayerCache]:
    if not GIS_DEPS_AVAILABLE:
        return None
        
    cache_path_map = {
        'state': 'data/processed/gis/soi/state/State Boundary.shp',
        'district': 'data/processed/gis/soi/district/District Boundary.shp',
        'subdistrict': 'data/processed/gis/soi/subdistrict/Sub_district Boundary.shp'
    }
    
    path = cache_path_map.get(layer_name)
    if not path or not os.path.exists(path):
        return None
        
    with _admin_lock:
        if _ADMIN_CACHE[layer_name] is not None:
            return _ADMIN_CACHE[layer_name]
            
        try:
            meta, fids, geom_wkb, field_data = pyogrio.raw.read(path)
            geoms = from_wkb(geom_wkb)
            
            # Reproject from SOI LCC to EPSG:4326 using the native CRS from .prj
            source_crs = meta['crs']
            transformer = pyproj.Transformer.from_crs(source_crs, "EPSG:4326", always_xy=True)
            
            projected_geoms = [shapely.ops.transform(transformer.transform, g) for g in geoms]
            
            # Map fields for easier access
            field_dict = {}
            for idx, fname in enumerate(meta['fields']):
                field_dict[fname] = field_data[idx]
                
            tree = STRtree(projected_geoms)
            
            cache = AdminLayerCache(tree=tree, geometries=projected_geoms, fields=field_dict)
            _ADMIN_CACHE[layer_name] = cache
            
            # If we just loaded state, we also register Uttarakhand in the geometry registry
            if layer_name == 'state':
                _register_uttarakhand_geometry(cache)
                
            return cache
        except Exception as e:
            print(f"Error loading {layer_name} geometries: {e}")
            return None

def _register_uttarakhand_geometry(state_cache: AdminLayerCache):
    # Find UTTARAKHAND and load it into _GEOMETRY_REGISTRY
    if 'STATE' in state_cache.fields:
        for i, val in enumerate(state_cache.fields['STATE']):
            if val and str(val).upper() == 'UTTARAKHAND':
                uk_geom = state_cache.geometries[i]
                
                # Update registry inline
                reg = _GEOMETRY_REGISTRY['uttarakhand']
                # We use object.__setattr__ because dataclass is frozen
                object.__setattr__(reg, 'geometry_available', True)
                object.__setattr__(reg, 'suitable_for_containment', True)
                object.__setattr__(reg, 'geometry_source', 'Survey of India Administrative Boundary Database')
                object.__setattr__(reg, 'crs', 'EPSG:4326')
                object.__setattr__(reg, 'geometry_type', uk_geom.geom_type)
                object.__setattr__(reg, 'authority', 'Survey of India')
                object.__setattr__(reg, 'note', 'Authoritative state boundary loaded from SOI data.')
                
                # Attach the raw geometry object to the record for PiP
                object.__setattr__(reg, '_polygon', uk_geom)
                break

@dataclass(frozen=True)
class AdminResolutionResult:
    status: GISResolutionStatus
    state: Optional[str] = None
    state_lgd: Optional[str] = None
    district: Optional[str] = None
    district_lgd: Optional[str] = None
    subdistrict: Optional[str] = None
    subdistrict_lgd: Optional[str] = None
    is_disputed: bool = False
    note: str = ""

def _resolve_admin_layer(layer_name: str, lat: float, lon: float) -> AdminResolutionResult:
    cache = _load_admin_layer(layer_name)
    if not cache:
        return AdminResolutionResult(status=GISResolutionStatus.GEOMETRY_UNAVAILABLE, note=f"{layer_name} geometry not loaded or dependencies missing.")
        
    point = Point(lon, lat)
    # Query STRtree
    indices = cache.tree.query(point, predicate='intersects')
    if len(indices) == 0:
        return AdminResolutionResult(status=GISResolutionStatus.OUTSIDE_KNOWN_REGIONS, note="Coordinate outside all boundaries in this layer.")
        
    # Take the first match
    idx = indices[0]
    
    # Check if disputed
    is_disputed = False
    state_val = None
    for field_name in ['STATE', 'STATE_UT']:
        if field_name in cache.fields:
            state_val = cache.fields[field_name][idx]
            if state_val and 'DISPUTED' in str(state_val).upper():
                is_disputed = True
            break
            
    res = AdminResolutionResult(status=GISResolutionStatus.RESOLVED, is_disputed=is_disputed)
    
    # Extract fields based on layer
    if 'STATE' in cache.fields:
        object.__setattr__(res, 'state', cache.fields['STATE'][idx])
    elif 'STATE_UT' in cache.fields:
        object.__setattr__(res, 'state', cache.fields['STATE_UT'][idx])
        
    if 'STATE_LGD' in cache.fields:
        object.__setattr__(res, 'state_lgd', str(cache.fields['STATE_LGD'][idx]).strip() if cache.fields['STATE_LGD'][idx] else None)
        
    if 'DISTRICT' in cache.fields:
        object.__setattr__(res, 'district', cache.fields['DISTRICT'][idx])
    if 'DIST_LGD' in cache.fields:
        object.__setattr__(res, 'district_lgd', str(cache.fields['DIST_LGD'][idx]).strip() if cache.fields['DIST_LGD'][idx] else None)
        
    if 'SUB_DIST' in cache.fields:
        object.__setattr__(res, 'subdistrict', cache.fields['SUB_DIST'][idx])
    if 'SUB_DT_LGD' in cache.fields:
        object.__setattr__(res, 'subdistrict_lgd', str(cache.fields['SUB_DT_LGD'][idx]).strip() if cache.fields['SUB_DT_LGD'][idx] else None)
        
    return res

def resolve_state_from_coordinate(latitude: Any, longitude: Any) -> AdminResolutionResult:
    try:
        lat, lon = validate_coordinate(latitude, longitude)
    except CoordinateValidationError as exc:
        return AdminResolutionResult(status=GISResolutionStatus.INVALID_COORDINATES, note=str(exc))
    return _resolve_admin_layer('state', lat, lon)

def resolve_district_from_coordinate(latitude: Any, longitude: Any) -> AdminResolutionResult:
    try:
        lat, lon = validate_coordinate(latitude, longitude)
    except CoordinateValidationError as exc:
        return AdminResolutionResult(status=GISResolutionStatus.INVALID_COORDINATES, note=str(exc))
    return _resolve_admin_layer('district', lat, lon)

def resolve_subdistrict_from_coordinate(latitude: Any, longitude: Any) -> AdminResolutionResult:
    try:
        lat, lon = validate_coordinate(latitude, longitude)
    except CoordinateValidationError as exc:
        return AdminResolutionResult(status=GISResolutionStatus.INVALID_COORDINATES, note=str(exc))
    return _resolve_admin_layer('subdistrict', lat, lon)

# ── Public GIS API ────────────────────────────────────────────────────────────


def resolve_region_from_coordinate(
    latitude: Any,
    longitude: Any,
) -> CoordinateResolutionResult:
    """
    Attempt to determine which registered region contains the given coordinate.

    Current behavior (Phase 6):
      No authoritative polygon is loaded for any region.
      Coordinates within the project's coarse data-acquisition extent
      receive status WITHIN_PROJECT_EXTENT, NOT RESOLVED.
      Coordinates outside all extents receive OUTSIDE_KNOWN_REGIONS.
      Invalid coordinates receive INVALID_COORDINATES.

    NEVER silently assigns a coordinate to Uttarakhand or any other region.

    Args:
      latitude:  Geographic latitude in decimal degrees (EPSG:4326).
      longitude: Geographic longitude in decimal degrees (EPSG:4326).

    Returns:
      CoordinateResolutionResult with an explicit status.
    """
    # Step 1: Validate coordinates
    try:
        lat, lon = validate_coordinate(latitude, longitude)
    except CoordinateValidationError as exc:
        return CoordinateResolutionResult(
            status=GISResolutionStatus.INVALID_COORDINATES,
            region_id=None,
            latitude=None,
            longitude=None,
            geometry_source=None,
            crs=None,
            note=str(exc),
        )

    # Step 2: Check whether any authoritative polygon geometry is loaded.
    #         Currently none are — so GEOMETRY_UNAVAILABLE dominates for
    #         polygon-containment queries.
    #         We provide WITHIN_PROJECT_EXTENT as a coarse informational hint.

    # Ensure state geometry is loaded so Uttarakhand gets registered if possible
    _load_admin_layer('state')
    
    any_polygon_available = any(
        rec.suitable_for_containment
        for rec in _GEOMETRY_REGISTRY.values()
    )

    if any_polygon_available:
        point = Point(lon, lat)
        for rid, rec in _GEOMETRY_REGISTRY.items():
            if rec.suitable_for_containment and hasattr(rec, '_polygon'):
                if rec._polygon.contains(point):
                    return CoordinateResolutionResult(
                        status=GISResolutionStatus.RESOLVED,
                        region_id=rid,
                        latitude=lat,
                        longitude=lon,
                        geometry_source=rec.geometry_source,
                        crs=rec.crs,
                        note=f"Coordinate resolved to region '{rid}' via authoritative polygon containment."
                    )

    # Step 3: Coarse project-extent check (non-authoritative hint only)
    if _is_within_project_extent(lat, lon):
        return CoordinateResolutionResult(
            status=GISResolutionStatus.WITHIN_PROJECT_EXTENT,
            region_id=None,   # Not authoritative — no confirmed region_id
            latitude=lat,
            longitude=lon,
            geometry_source=_PROJECT_EXTENT["source_file"],
            crs=_PROJECT_EXTENT["crs"],
            note=(
                "Coordinate falls within the project's coarse Uttarakhand "
                "data-acquisition bounding box. This is NOT authoritative "
                "geographic membership. No region_id is assigned. "
                "To get RESOLVED status, an authoritative boundary polygon "
                "must be registered. "
                f"Project extent: {_PROJECT_EXTENT['label']}"
            ),
        )

    # Step 4: Outside all known extents
    return CoordinateResolutionResult(
        status=GISResolutionStatus.OUTSIDE_KNOWN_REGIONS,
        region_id=None,
        latitude=lat,
        longitude=lon,
        geometry_source=None,
        crs="EPSG:4326",
        note=(
            "Coordinate is outside all registered project extents. "
            "No region assignment is possible without authoritative geometry."
        ),
    )


def get_region_geometry(region_id: str) -> Optional[RegionGeometryRecord]:
    """
    Return the geometry record for a registered region.

    Returns None if the region_id is not in the geometry registry.
    A returned record with geometry_available=False means no authoritative
    polygon is loaded — callers must check this field before attempting
    containment operations.
    """
    return _GEOMETRY_REGISTRY.get(region_id)


def get_region_geometry_status(region_id: str) -> str:
    """
    Return a string status for the geometry availability of a region.

    Returns:
      "AVAILABLE"            — authoritative polygon is loaded (not currently possible)
      "GEOMETRY_UNAVAILABLE" — no authoritative polygon registered
      "REGION_NOT_REGISTERED"— region_id not in geometry registry
    """
    record = _GEOMETRY_REGISTRY.get(region_id)
    if record is None:
        return "REGION_NOT_REGISTERED"
    if record.geometry_available and record.suitable_for_containment:
        return "AVAILABLE"
    return "GEOMETRY_UNAVAILABLE"


def list_geometry_statuses() -> Dict[str, str]:
    """Return geometry status for all registered regions."""
    return {rid: get_region_geometry_status(rid) for rid in _GEOMETRY_REGISTRY}


def is_coordinate_in_region(
    region_id: str,
    latitude: Any,
    longitude: Any,
) -> CoordinateResolutionResult:
    """
    Check whether a coordinate belongs to a specific region.

    If no authoritative polygon exists for the region, returns GEOMETRY_UNAVAILABLE.
    Does NOT use the bounding box as a proxy for regional membership.

    Args:
      region_id:  Canonical region identifier.
      latitude:   Decimal degrees.
      longitude:  Decimal degrees.

    Returns:
      CoordinateResolutionResult. status=RESOLVED only when an actual polygon
      confirms membership.
    """
    # Validate coordinates first
    try:
        lat, lon = validate_coordinate(latitude, longitude)
    except CoordinateValidationError as exc:
        return CoordinateResolutionResult(
            status=GISResolutionStatus.INVALID_COORDINATES,
            region_id=None,
            latitude=None,
            longitude=None,
            geometry_source=None,
            crs=None,
            note=str(exc),
        )

    record = _GEOMETRY_REGISTRY.get(region_id)
    if record is None:
        return CoordinateResolutionResult(
            status=GISResolutionStatus.GEOMETRY_UNAVAILABLE,
            region_id=region_id,
            latitude=lat,
            longitude=lon,
            geometry_source=None,
            crs=None,
            note=f"Region '{region_id}' is not in the GIS geometry registry.",
        )

    if not record.suitable_for_containment:
        return CoordinateResolutionResult(
            status=GISResolutionStatus.GEOMETRY_UNAVAILABLE,
            region_id=region_id,
            latitude=lat,
            longitude=lon,
            geometry_source=record.geometry_source,
            crs=record.crs,
            note=(
                f"No authoritative boundary polygon is loaded for '{region_id}'. "
                f"{record.note}"
            ),
        )

    # Ensure state is loaded
    _load_admin_layer('state')
    
    if hasattr(record, '_polygon'):
        point = Point(lon, lat)
        if record._polygon.contains(point):
            return CoordinateResolutionResult(
                status=GISResolutionStatus.RESOLVED,
                region_id=region_id,
                latitude=lat,
                longitude=lon,
                geometry_source=record.geometry_source,
                crs=record.crs,
                note=f"Coordinate is inside region '{region_id}'."
            )
        else:
            return CoordinateResolutionResult(
                status=GISResolutionStatus.OUTSIDE_KNOWN_REGIONS,
                region_id=None,
                latitude=lat,
                longitude=lon,
                geometry_source=record.geometry_source,
                crs=record.crs,
                note=f"Coordinate is strictly outside authoritative polygon for '{region_id}'."
            )
            
    return CoordinateResolutionResult(
        status=GISResolutionStatus.GEOMETRY_UNAVAILABLE,
        region_id=region_id,
        latitude=lat,
        longitude=lon,
        geometry_source=None,
        crs=None,
        note="Polygon containment check reached unexpected state.",
    )


def get_project_extent() -> Dict[str, Any]:
    """
    Return the project's coarse data-acquisition extent metadata.

    IMPORTANT: This is NOT an authoritative regional boundary.
    Do not use this to infer administrative membership.
    """
    return dict(_PROJECT_EXTENT)
