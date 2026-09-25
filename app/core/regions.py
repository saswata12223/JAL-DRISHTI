from typing import List, Dict, Optional
from app.schemas.regions import (
    RegionConfig,
    MacroRegion,
    CapabilityStatus,
    RegionConfigModelInfo,
    RegionConfigSCSCN,
)

# Central Region Registry acting as Phase 3 static metadata registry.
# Describing what is known, not complete scientific parameters.
# Guessed numbers and unverified models are explicitly avoided.

REGIONS_REGISTRY: Dict[str, RegionConfig] = {
    "uttarakhand": RegionConfig(
        id="uttarakhand",
        macro_region=MacroRegion.WESTERN_CENTRAL_HIMALAYA,
        geometry_status=CapabilityStatus.VERIFIED,
        hazard_domains={
            "flash_flood": CapabilityStatus.AVAILABLE,
            "riverine_flood": CapabilityStatus.AVAILABLE,
            "landslide": CapabilityStatus.PARTIAL,
            "cloudburst": CapabilityStatus.PARTIAL,
            "GLOF": CapabilityStatus.UNAVAILABLE,
        },
        model=RegionConfigModelInfo(
            hydrological_risk=CapabilityStatus.REGISTERED
        ),
        scs_cn=RegionConfigSCSCN(
            status=CapabilityStatus.EXISTING_IMPLEMENTATION
        )
    ),
    "maharashtra_western_ghats": RegionConfig(
        id="maharashtra_western_ghats",
        macro_region=MacroRegion.WESTERN_GHATS_KONKAN,
        geometry_status=CapabilityStatus.PENDING_VERIFICATION,
        hazard_domains={
            "flash_flood": CapabilityStatus.NOT_CONFIGURED,
            "riverine_flood": CapabilityStatus.DATA_REQUIRED,
            "landslide": CapabilityStatus.DATA_REQUIRED,
            "cloudburst": CapabilityStatus.DATA_REQUIRED,
            "GLOF": CapabilityStatus.NOT_APPLICABLE,
        },
        model=RegionConfigModelInfo(
            status=CapabilityStatus.MODEL_UNAVAILABLE
        ),
        scs_cn=RegionConfigSCSCN(
            status=CapabilityStatus.NOT_CONFIGURED
        )
    ),
    "sikkim_eastern_himalayas": RegionConfig(
        id="sikkim_eastern_himalayas",
        macro_region=MacroRegion.EASTERN_HIMALAYA_NE_HILLS,
        geometry_status=CapabilityStatus.DATA_REQUIRED,
        hazard_domains={
            "flash_flood": CapabilityStatus.DATA_REQUIRED,
            "landslide": CapabilityStatus.DATA_REQUIRED,
            "GLOF": CapabilityStatus.DATA_REQUIRED,
        },
        model=RegionConfigModelInfo(
            status=CapabilityStatus.MODEL_UNAVAILABLE
        ),
        scs_cn=RegionConfigSCSCN(
            status=CapabilityStatus.NOT_CONFIGURED
        )
    ),
    "chota_nagpur_plateau": RegionConfig(
        id="chota_nagpur_plateau",
        macro_region=MacroRegion.EASTERN_GHATS_CENTRAL_HILLS,
        geometry_status=CapabilityStatus.DATA_REQUIRED,
        hazard_domains={
            "flash_flood": CapabilityStatus.DATA_REQUIRED,
            "riverine_flood": CapabilityStatus.DATA_REQUIRED,
            "GLOF": CapabilityStatus.NOT_APPLICABLE,
        },
        model=RegionConfigModelInfo(
            status=CapabilityStatus.MODEL_UNAVAILABLE
        ),
        scs_cn=RegionConfigSCSCN(
            status=CapabilityStatus.NOT_CONFIGURED
        )
    )
}

def get_region(region_id: str) -> Optional[RegionConfig]:
    """Retrieve the explicit configuration for a given region."""
    return REGIONS_REGISTRY.get(region_id)

def list_regions() -> List[str]:
    """Return a list of all registered region IDs."""
    return list(REGIONS_REGISTRY.keys())

def list_macro_regions() -> List[str]:
    """Return a list of all unique macro regions present in the registry."""
    macros = set(region.macro_region.value for region in REGIONS_REGISTRY.values())
    return list(macros)

def get_children(parent_id: str) -> List[str]:
    """
    Retrieve IDs of regions that declare the given parent_id.
    Note: Currently the RegionConfig does not store parent_id, but future schemas may.
    """
    return []

def get_region_capabilities(region_id: str) -> Dict[str, str]:
    """Retrieve the hazard capabilities for a region."""
    region = get_region(region_id)
    if not region:
        return {}
    return {k: v.value for k, v in region.hazard_domains.items()}

def get_region_model_status(region_id: str) -> Optional[str]:
    """Retrieve the ML model status for a region."""
    region = get_region(region_id)
    if not region or not region.model:
        return None
    
    if region.model.status:
        return region.model.status.value
    
    if region.model.hydrological_risk:
        return region.model.hydrological_risk.value
        
    return CapabilityStatus.MODEL_UNAVAILABLE.value
