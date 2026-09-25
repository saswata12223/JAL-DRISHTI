"""
Jal Drishti — Regional Capability Query API Route

This is a READ-ONLY route exposing the Phase 3 regional registry to API consumers.
It does NOT execute any ML inference, database queries, or data pipelines.

Endpoints:
  GET /api/v1/regions               — list all registered regions
  GET /api/v1/regions/macro         — list all macro regions
  GET /api/v1/regions/{region_id}   — get capability status for a region
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException

from app.schemas.common import APIResponse
from app.core.regions import (
    get_region,
    list_regions,
    list_macro_regions,
    get_region_capabilities,
    get_region_model_status,
)
from app.core.region_context import resolve_region, RegionNotFoundError

router = APIRouter(prefix="/regions", tags=["Regional Registry"])


@router.get("", summary="List All Registered Regions")
def list_all_regions():
    """
    Returns the IDs and macro-region groupings of all regions
    currently registered in the Jal Drishti regional registry.

    Availability of a region in this list does NOT imply operational
    data or model capability.
    """
    region_ids = list_regions()
    result = []
    for rid in region_ids:
        cfg = get_region(rid)
        result.append({
            "region_id": rid,
            "macro_region": cfg.macro_region.value,
            "geometry_status": cfg.geometry_status.value,
            "model_status": get_region_model_status(rid),
        })
    return APIResponse(success=True, count=len(result), data=result)


@router.get("/macro", summary="List All Macro Regions")
def list_all_macro_regions():
    """
    Returns all macro-region identifiers present in the registry.
    """
    macros = list_macro_regions()
    return APIResponse(success=True, count=len(macros), data=macros)


@router.get("/{region_id}", summary="Get Regional Capability Status")
def get_region_detail(region_id: str):
    """
    Returns the full capability declaration for a registered region,
    including hazard domains, model status, geometry status, and SCS-CN status.

    Returns REGION_NOT_FOUND if the region_id is not registered.
    Does NOT execute any inference.
    """
    try:
        context = resolve_region(region_id)
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

    cfg = get_region(region_id)
    data = {
        "region_id": context.region_id,
        "macro_region": context.macro_region,
        "geometry_status": context.geometry_status,
        "model_status": context.model_status,
        "is_model_registered": context.is_model_registered,
        "hazard_capabilities": context.hazard_capabilities,
        "scs_cn_status": cfg.scs_cn.status.value,
    }
    return APIResponse(success=True, data=data)
