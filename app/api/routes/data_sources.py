"""
Jal Drishti — Data Sources Read-Only API Route

Exposes the Phase 5 Data Source Registry through read-only endpoints.

CRITICAL: These endpoints expose METADATA ONLY.
They do NOT trigger any ML inference, data ingestion, live scraping,
fabricated timestamps, or synthetic availability claims.

All source statuses reflect the honest documented state of each source.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.schemas.common import APIResponse
from app.core.data_source_registry import (
    get_source,
    list_sources,
    list_sources_for_region,
    get_source_freshness,
)
from app.core.region_context import resolve_region, RegionNotFoundError

router = APIRouter(prefix="/data-sources", tags=["Data Source Registry"])


def _entry_to_dict(entry) -> Dict[str, Any]:
    """Serialize a DataSourceEntry to a safe API-response dict."""
    return {
        "source_id": entry.source_id,
        "display_name": entry.display_name,
        "provider": entry.provider,
        "description": entry.description,
        "region_ids": entry.region_ids,
        "variables": entry.variables,
        "temporal_resolution": entry.temporal_resolution,
        "spatial_resolution": entry.spatial_resolution,
        "coverage_start": entry.coverage_start,
        "coverage_end": entry.coverage_end,
        "access_method": entry.access_method,
        "source_url": entry.source_url,
        "availability_status": entry.availability_status.value,
        "freshness_policy": entry.freshness_policy.value,
        # Never expose a fabricated timestamp.
        # last_successful_observation is null when not verified.
        "last_successful_observation": (
            entry.last_successful_observation.isoformat()
            if entry.last_successful_observation else None
        ),
        "usable_for_inference": entry.usable_for_inference,
        "limitations": entry.limitations,
        "adapter_exists": entry.adapter_exists,
        "evidence": entry.evidence,
    }


def _freshness_to_dict(freshness) -> Dict[str, Any]:
    """Serialize a DataSourceFreshness to an API-response dict."""
    return {
        "source_id": freshness.source_id,
        "region_id": freshness.region_id,
        "availability_status": freshness.availability_status,
        "freshness_state": freshness.freshness_state.value,
        "last_successful_observation": (
            freshness.last_successful_observation.isoformat()
            if freshness.last_successful_observation else None
        ),
        "data_age_seconds": freshness.data_age_seconds,
        "checked_at": freshness.checked_at.isoformat(),
        "usable_for_inference": freshness.usable_for_inference,
        "reason": freshness.reason,
    }


@router.get("", summary="List All Registered Data Sources")
def list_all_data_sources(
    region_id: Optional[str] = Query(
        default=None,
        description=(
            "Optional. If provided, only sources covering that region are returned. "
            "Region must be registered in the Jal Drishti regional registry."
        )
    )
):
    """
    Returns metadata for all registered data sources, or those covering
    a specific region.

    Availability and freshness fields reflect the documented, honest state
    of each source — NOT fabricated or assumed values.
    """
    if region_id is not None:
        # Validate region through Phase 4 context — no silent UK fallback
        try:
            resolve_region(region_id)
        except RegionNotFoundError:
            raise HTTPException(
                status_code=404,
                detail={
                    "status": "REGION_NOT_FOUND",
                    "region_id": region_id,
                    "reason": f"Region '{region_id}' is not registered. "
                              f"Use GET /api/v1/regions to list supported regions.",
                }
            )
        entries = list_sources_for_region(region_id)
    else:
        entries = [get_source(sid) for sid in list_sources()]

    data = [_entry_to_dict(e) for e in entries if e is not None]
    return APIResponse(success=True, count=len(data), data=data)


@router.get("/{source_id}", summary="Get Data Source Metadata")
def get_data_source(source_id: str):
    """
    Returns detailed metadata for a single registered data source.

    Returns DATA_SOURCE_NOT_FOUND if the source_id is not registered.
    """
    entry = get_source(source_id)
    if entry is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "DATA_SOURCE_NOT_FOUND",
                "source_id": source_id,
                "reason": f"Source '{source_id}' is not registered. "
                          f"Use GET /api/v1/data-sources to list registered sources.",
            }
        )
    return APIResponse(success=True, data=_entry_to_dict(entry))


@router.get("/{source_id}/freshness", summary="Get Data Source Freshness Status")
def get_data_source_freshness(
    source_id: str,
    region_id: str = Query(
        ...,
        description="Region identifier. Must be registered in the regional registry."
    ),
):
    """
    Returns the freshness/availability status for a source/region pair.

    Freshness is computed from the verified last_successful_observation.
    If no verified observation exists, returns UNKNOWN — never a fabricated timestamp.

    Static sources (SRTM, WorldCover) return NOT_APPLICABLE freshness state.
    Historical archives return NOT_APPLICABLE freshness state.
    """
    # Validate region
    try:
        resolve_region(region_id)
    except RegionNotFoundError:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "REGION_NOT_FOUND",
                "region_id": region_id,
                "reason": f"Region '{region_id}' is not registered.",
            }
        )

    # Validate source
    if get_source(source_id) is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "DATA_SOURCE_NOT_FOUND",
                "source_id": source_id,
                "reason": f"Source '{source_id}' is not registered.",
            }
        )

    freshness = get_source_freshness(
        source_id=source_id,
        region_id=region_id,
        now=datetime.now(timezone.utc),  # Real clock — this is check time, not obs time
    )

    if freshness is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": "DATA_SOURCE_NOT_FOUND",
                "source_id": source_id,
            }
        )

    return APIResponse(success=True, data=_freshness_to_dict(freshness))
