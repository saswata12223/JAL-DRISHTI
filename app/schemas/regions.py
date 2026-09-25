from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class MacroRegion(str, Enum):
    WESTERN_CENTRAL_HIMALAYA = "western_central_himalaya"
    EASTERN_HIMALAYA_NE_HILLS = "eastern_himalaya_ne_hills"
    WESTERN_GHATS_KONKAN = "western_ghats_konkan"
    EASTERN_GHATS_CENTRAL_HILLS = "eastern_ghats_central_hills"

class HazardType(str, Enum):
    FLASH_FLOOD = "FLASH_FLOOD"
    RIVERINE_FLOOD = "RIVERINE_FLOOD"
    URBAN_FLOOD = "URBAN_FLOOD"
    FOOTHILL_FLOOD = "FOOTHILL_FLOOD"
    SMALL_CATCHMENT_FLOOD = "SMALL_CATCHMENT_FLOOD"
    GLOF_RELATED_FLOOD = "GLOF_RELATED_FLOOD"
    LANDSLIDE_DAM_RELATED_FLOOD = "LANDSLIDE_DAM_RELATED_FLOOD"
    LANDSLIDE = "LANDSLIDE"
    ROCKFALL = "ROCKFALL"
    DEBRIS_FLOW = "DEBRIS_FLOW"
    HEAVY_RAINFALL = "HEAVY_RAINFALL"
    VERY_HEAVY_RAINFALL = "VERY_HEAVY_RAINFALL"
    EXTREMELY_HEAVY_RAINFALL = "EXTREMELY_HEAVY_RAINFALL"
    CLOUD_BURST = "CLOUD_BURST"
    GLOF = "GLOF"
    EROSION = "EROSION"
    COMPOUND_HAZARD = "COMPOUND_HAZARD"
    OTHER_VERIFIED_TYPE = "OTHER_VERIFIED_TYPE"

class CapabilityStatus(str, Enum):
    VERIFIED = "VERIFIED"
    AVAILABLE = "AVAILABLE"
    PARTIAL = "PARTIAL"
    UNAVAILABLE = "UNAVAILABLE"
    UNVERIFIED = "UNVERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    NOT_CONFIGURED = "NOT_CONFIGURED"
    DATA_REQUIRED = "DATA_REQUIRED"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    EXISTING_IMPLEMENTATION = "EXISTING_IMPLEMENTATION"
    REGISTERED = "REGISTERED"
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"

class RegionBase(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    geometry_reference: Optional[str] = Field(None, description="Identifier linking to authoritative external verified GIS layer")
    source_id: Optional[str] = None
    status: CapabilityStatus = CapabilityStatus.UNVERIFIED

class MacroRegionSchema(RegionBase):
    pass

class StateOrUT(RegionBase):
    pass

class PhysiographicSubregion(RegionBase):
    pass

class District(RegionBase):
    pass

class Subdistrict(RegionBase):
    pass

class Village(RegionBase):
    pass

class Ward(RegionBase):
    pass

class Basin(RegionBase):
    pass

class SubBasin(RegionBase):
    pass

class Catchment(RegionBase):
    pass

class HazardZone(RegionBase):
    pass

class RegionConfigModelInfo(BaseModel):
    hydrological_risk: Optional[CapabilityStatus] = None
    status: Optional[CapabilityStatus] = None

class RegionConfigSCSCN(BaseModel):
    status: CapabilityStatus

class RegionConfig(BaseModel):
    id: str
    macro_region: MacroRegion
    geometry_status: CapabilityStatus
    hazard_domains: Dict[str, CapabilityStatus]
    model: RegionConfigModelInfo
    scs_cn: RegionConfigSCSCN
