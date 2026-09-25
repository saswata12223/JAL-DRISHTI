"""
Jal Drishti — GIS Read-Only API Route (Phase 6)

Exposes regional geometry status and coordinate resolution through
read-only endpoints.

CRITICAL:
  - These endpoints reflect the honest Phase 6 GIS audit result.
  - No authoritative polygon geometry currently exists in the repository.
  - Coordinate resolution returns WITHIN_PROJECT_EXTENT or
    OUTSIDE_KNOWN_REGIONS, never a fabricated RESOLVED status.
  - No ML inference is triggered by these endpoints.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse
from app.core.gis import (
    resolve_region_from_coordinate,
    is_coordinate_in_region,
    get_region_geometry,
    get_region_geometry_status,
    list_geometry_statuses,
    get_project_extent,
    GISResolutionStatus,
    CoordinateValidationError,
    resolve_state_from_coordinate,
    resolve_district_from_coordinate,
    resolve_subdistrict_from_coordinate,
)
from app.core.region_context import resolve_region, RegionNotFoundError

router = APIRouter(prefix="/gis", tags=["GIS Abstraction"])


def _resolution_to_dict(result) -> Dict[str, Any]:
    return {
        "status": result.status.value,
        "region_id": result.region_id,
        "latitude": result.latitude,
        "longitude": result.longitude,
        "geometry_source": result.geometry_source,
        "crs": result.crs,
        "note": result.note,
    }


@router.get("/regions", summary="List Regional Geometry Status")
def list_region_geometry_status():
    """
    Returns the geometry availability status for all registered regions.

    In Phase 6, all regions return GEOMETRY_UNAVAILABLE because no
    authoritative boundary polygons exist in the repository.
    """
    statuses = list_geometry_statuses()
    data = [
        {
            "region_id": rid,
            "geometry_status": status,
        }
        for rid, status in statuses.items()
    ]
    return APIResponse(success=True, count=len(data), data=data)


@router.get("/regions/{region_id}", summary="Get Regional Geometry Record")
def get_region_geometry_detail(region_id: str):
    """
    Returns the geometry metadata record for a specific region.

    Validates region through Phase 4 context first, then returns
    the GIS geometry record including its availability status and
    what authoritative source would be required.
    """
    try:
        resolve_region(region_id)  # Phase 4 validation — no silent UK fallback
    except RegionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "REGION_NOT_FOUND",
                "region_id": region_id,
                "reason": f"Region '{region_id}' is not registered.",
            }
        )

    record = get_region_geometry(region_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "GEOMETRY_UNAVAILABLE",
                "region_id": region_id,
                "reason": (
                    f"Region '{region_id}' is registered in the region context "
                    f"but has no entry in the GIS geometry registry."
                ),
            }
        )

    return APIResponse(
        success=True,
        data={
            "region_id": record.region_id,
            "geometry_available": record.geometry_available,
            "geometry_source": record.geometry_source,
            "crs": record.crs,
            "geometry_type": record.geometry_type,
            "authority": record.authority,
            "suitable_for_containment": record.suitable_for_containment,
            "note": record.note,
        }
    )


@router.get("/resolve", summary="Resolve Coordinate to Region")
def resolve_coordinate(
    latitude: float = Query(..., description="Decimal degrees (EPSG:4326), -90 to 90"),
    longitude: float = Query(..., description="Decimal degrees (EPSG:4326), -180 to 180"),
):
    """
    Attempts to determine which registered region contains the given coordinate.

    Phase 6 honest behavior:
    - WITHIN_PROJECT_EXTENT: coordinate inside the project's coarse UK data-acquisition
      bbox (77.8-81.1E, 28.5-31.5N). NOT authoritative membership.
    - OUTSIDE_KNOWN_REGIONS: outside all known project extents.
    - INVALID_COORDINATES: validation failed.

    RESOLVED status requires an authoritative boundary polygon, which does not
    yet exist in the repository.

    Returns HTTP 422 for invalid coordinates (structured detail, not 500).
    """
    result = resolve_region_from_coordinate(latitude, longitude)

    if result.status == GISResolutionStatus.INVALID_COORDINATES:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "INVALID_COORDINATES",
                "reason": result.note,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    return APIResponse(success=True, data=_resolution_to_dict(result))


@router.get("/extent", summary="Get Project Data-Acquisition Extent")
def get_project_data_extent():
    """
    Returns the project's coarse data-acquisition bounding box.

    IMPORTANT: This is NOT an authoritative regional boundary.
    It is the extent used for data acquisition scoping only.
    Do not use this to infer administrative membership.
    """
    extent = get_project_extent()
    return APIResponse(success=True, data=extent)


@router.get("/admin/resolve", summary="Resolve Coordinate to Administrative Context")
def resolve_admin_coordinate(
    latitude: float = Query(..., description="Decimal degrees (EPSG:4326), -90 to 90"),
    longitude: float = Query(..., description="Decimal degrees (EPSG:4326), -180 to 180"),
):
    """
    Attempts to determine the administrative state, district, and sub-district for a coordinate.
    Also returns the project region status to cleanly separate administrative context from project regions.
    """
    # 1. Resolve administrative levels
    state_res = resolve_state_from_coordinate(latitude, longitude)
    
    if state_res.status == GISResolutionStatus.INVALID_COORDINATES:
        raise HTTPException(
            status_code=422,
            detail={
                "status": "INVALID_COORDINATES",
                "reason": state_res.note,
                "latitude": latitude,
                "longitude": longitude,
            }
        )

    district_res = resolve_district_from_coordinate(latitude, longitude)
    subdistrict_res = resolve_subdistrict_from_coordinate(latitude, longitude)
    
    # 2. Resolve project region level
    region_res = resolve_region_from_coordinate(latitude, longitude)

    data = {
        "coordinate": {
            "latitude": latitude,
            "longitude": longitude
        },
        "country": "INDIA" if state_res.status == GISResolutionStatus.RESOLVED else None,
        "state": state_res.state if state_res.status == GISResolutionStatus.RESOLVED else None,
        "district": district_res.district if district_res.status == GISResolutionStatus.RESOLVED else None,
        "subdistrict": subdistrict_res.subdistrict if subdistrict_res.status == GISResolutionStatus.RESOLVED else None,
        
        "administrative_gis": {
            "available": state_res.status == GISResolutionStatus.RESOLVED,
            "state_status": state_res.status.value,
            "district_status": district_res.status.value,
            "subdistrict_status": subdistrict_res.status.value
        },
        
        "ml": {
            "available": region_res.status == GISResolutionStatus.RESOLVED,
            "reason": "MODEL_SCOPE_UTTARAKHAND_ONLY" if region_res.status != GISResolutionStatus.RESOLVED else "MODEL_AVAILABLE_FOR_REGION"
        },
        
        "live_telemetry": {
            # Based on Phase 17, live telemetry is partially available for Uttarakhand (proxy OpenWeatherMap)
            # but for a true pan-India approach, OpenWeatherMap can actually serve anywhere! 
            # However, the prompt says "LIVE TELEMETRY = CURRENTLY PARTIAL" and for non-UK we should say NO_VERIFIED_SOURCE_FOR_LOCATION unless we enable OWM pan-india.
            # The prompt example for Karnataka: "Live telemetry: No verified source available"
            "available": region_res.status == GISResolutionStatus.RESOLVED,
            "reason": "NO_VERIFIED_SOURCE_FOR_LOCATION" if region_res.status != GISResolutionStatus.RESOLVED else "OPENWEATHERMAP_PROXY_AVAILABLE"
        },
        
        "project_region": {
            "region_id": region_res.region_id,
            "status": region_res.status.value
        }
    }

    return APIResponse(success=True, data=data)


@router.get("/admin/regions", summary="List PAN-India Administrative Regions")
def list_admin_regions():
    """
    Returns the full inventory of administrative states and district counts 
    available in the Survey of India PAN-India dataset.
    """
    from app.core.gis import _load_admin_layer, _ADMIN_CACHE
    import collections
    
    state_cache = _load_admin_layer('state')
    dist_cache = _load_admin_layer('district')
    
    if not state_cache or not dist_cache:
        raise HTTPException(
            status_code=503, 
            detail="Administrative layers not initialized or missing dependencies."
        )
        
    states = {}
    
    state_fields = state_cache.fields
    state_col = 'STATE' if 'STATE' in state_fields else 'STATE_UT'
    
    dist_fields = dist_cache.fields
    dist_state_col = 'STATE_UT' if 'STATE_UT' in dist_fields else 'STATE'
    
    # Calculate district counts per state
    dist_counts = collections.Counter()
    if dist_state_col in dist_fields:
        for s in dist_fields[dist_state_col]:
            if s:
                dist_counts[str(s).upper()] += 1
                
    for i, s_name in enumerate(state_fields[state_col]):
        if s_name:
            s_name_str = str(s_name).strip()
            s_upper = s_name_str.upper()
            if s_name_str not in states:
                lgd = str(state_fields['STATE_LGD'][i]).strip() if 'STATE_LGD' in state_fields and state_fields['STATE_LGD'][i] else ""
                states[s_name_str] = {
                    "id": s_name_str,
                    "name": s_name_str,
                    "lgd_code": lgd,
                    "district_count": dist_counts.get(s_upper, 0)
                }
                
    data = {
        "country": "INDIA",
        "states": sorted(list(states.values()), key=lambda x: x["name"])
    }
    
    return APIResponse(success=True, data=data)


@router.get("/admin/boundaries", summary="Get PAN-India State Boundaries (Simplified)")
def get_admin_boundaries():
    """
    Returns the simplified GeoJSON for PAN-India state boundaries for visualization.
    """
    import json
    from pathlib import Path
    
    file_path = Path("data/processed/gis/phase_pan_india/india_states_simplified.geojson")
    if not file_path.exists():
        raise HTTPException(status_code=503, detail="Boundaries not yet generated.")
        
    with open(file_path, "r") as f:
        geojson = json.load(f)
        
    return geojson


