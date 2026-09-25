"""
Jal Drishti — Backend Regional Context Abstraction

This module is the single choke point for region validation in Phase 4.
It prevents cross-region inference by requiring all region-dependent
operations to pass through `resolve_region()` and then
`assert_model_available()` before touching any ML pipeline.

ARCHITECTURE CONTRACT:
  request
    ↓ region_id (optional)
    ↓ resolve_region()  ← validates against registry, rejects unknowns
    ↓ ResolvedRegionContext
    ↓ assert_model_available()  ← blocks non-UK inference at the gate
    ↓ existing UK pipeline (only if region_id == "uttarakhand")
"""

from typing import Optional
from dataclasses import dataclass

from app.core.regions import get_region, get_region_model_status
from app.schemas.regions import RegionConfig, CapabilityStatus

# The ONLY region that currently has a registered model in this repository.
_REGIONS_WITH_REGISTERED_MODEL = {"uttarakhand"}


class RegionNotFoundError(ValueError):
    """Raised when a region_id does not exist in the registry."""
    pass


class ModelUnavailableError(ValueError):
    """Raised when a region does not have a validated, registered model."""
    pass


@dataclass(frozen=True)
class ResolvedRegionContext:
    """
    Immutable snapshot of a validated region's capability status.
    Returned by resolve_region(). Consumed by route handlers.
    """
    region_id: str
    macro_region: str
    geometry_status: str
    model_status: str
    hazard_capabilities: dict  # hazard_name → CapabilityStatus value string
    is_model_registered: bool  # True only if a model is explicitly registered


def resolve_region(region_id: str) -> ResolvedRegionContext:
    """
    Validates a region_id against the canonical registry and returns
    a ResolvedRegionContext.

    Raises:
        RegionNotFoundError: if region_id is not in the registry.

    This function must NEVER silently fall back to "uttarakhand".
    An unknown region_id is always an error.
    """
    config: Optional[RegionConfig] = get_region(region_id)
    if config is None:
        raise RegionNotFoundError(
            f"Region '{region_id}' is not registered. "
            f"Use GET /api/v1/regions to list supported regions."
        )

    model_status = get_region_model_status(region_id) or CapabilityStatus.MODEL_UNAVAILABLE.value

    is_model_registered = region_id in _REGIONS_WITH_REGISTERED_MODEL

    return ResolvedRegionContext(
        region_id=region_id,
        macro_region=config.macro_region.value,
        geometry_status=config.geometry_status.value,
        model_status=model_status,
        hazard_capabilities={k: v.value for k, v in config.hazard_domains.items()},
        is_model_registered=is_model_registered,
    )


def assert_model_available(context: ResolvedRegionContext, hazard: str = "flash_flood") -> None:
    """
    Gate that MUST be called before any ML inference.

    Raises:
        ModelUnavailableError: if the region does not have a registered,
            compatible model. This is the firewall that prevents
            maharashtra_western_ghats (or any other unsupported region)
            from reaching the Uttarakhand XGBoost model.
    """
    if not context.is_model_registered:
        raise ModelUnavailableError(
            f"No validated model is registered for region '{context.region_id}' "
            f"/ hazard '{hazard}'. Model status: {context.model_status}"
        )


def build_model_unavailable_response(region_id: str, hazard: str, reason: str) -> dict:
    """
    Returns a structured MODEL_UNAVAILABLE response dict following
    existing project APIResponse conventions.
    """
    return {
        "status": "MODEL_UNAVAILABLE",
        "region_id": region_id,
        "hazard": hazard,
        "model": None,
        "reason": reason,
    }


def build_region_not_found_response(region_id: str) -> dict:
    """
    Returns a structured REGION_NOT_FOUND response dict.
    """
    return {
        "status": "REGION_NOT_FOUND",
        "region_id": region_id,
        "reason": f"Region '{region_id}' is not registered in the Jal Drishti regional registry.",
    }
