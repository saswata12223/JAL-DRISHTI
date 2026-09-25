import os
import hashlib
import pytest
import math
from typing import Optional

from app.core.gis import (
    resolve_region_from_coordinate,
    resolve_state_from_coordinate,
    resolve_district_from_coordinate,
    GISResolutionStatus,
    get_region_geometry_status,
    _load_admin_layer,
    _GEOMETRY_REGISTRY,
    GIS_DEPS_AVAILABLE
)

RAR_PATH = "data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar"
EXPECTED_HASH = "b8325e5d9dd0f04a6663d775363fe38cd2f23bd9dbae3fb7118b4e6e0ce0bcb7"

def get_file_sha256(path):
    if not os.path.exists(path):
        return None
    sha256_hash = hashlib.sha256()
    with open(path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def test_a_soi_archive_exists_and_hash_matches():
    assert os.path.exists(RAR_PATH), "SOI RAR archive missing."
    h = get_file_sha256(RAR_PATH)
    assert h.lower() == EXPECTED_HASH, "SHA-256 hash does not match original."

@pytest.mark.skipif(not GIS_DEPS_AVAILABLE, reason="pyogrio/pyproj missing")
def test_c_d_e_shapefiles_load():
    state_cache = _load_admin_layer('state')
    assert state_cache is not None, "State shapefile failed to load."
    assert len(state_cache.geometries) == 40
    
    district_cache = _load_admin_layer('district')
    assert district_cache is not None, "District shapefile failed to load."
    assert len(district_cache.geometries) == 808
    
    # Sub-district might be heavy, just check if it loads without crashing
    sub_cache = _load_admin_layer('subdistrict')
    assert sub_cache is not None
    assert len(sub_cache.geometries) > 1000

@pytest.mark.skipif(not GIS_DEPS_AVAILABLE, reason="pyogrio/pyproj missing")
def test_f_g_crs_detected_and_transformed():
    # If the point successfully maps, CRS was transformed. 
    # Let's derive a point inside Uttarakhand directly from the authoritative polygon.
    state_cache = _load_admin_layer('state')
    uk_idx = None
    for i, val in enumerate(state_cache.fields['STATE']):
        if val == 'UTTARAKHAND':
            uk_idx = i
            break
            
    assert uk_idx is not None, "Uttarakhand not found in state layer."
    uk_geom = state_cache.geometries[uk_idx]
    
    # Representative point guaranteed to be inside polygon
    rep_point = uk_geom.representative_point()
    
    # Check J: Uttarakhand resolves coordinate
    res = resolve_region_from_coordinate(rep_point.y, rep_point.x)
    assert res.status == GISResolutionStatus.RESOLVED
    assert res.region_id == "uttarakhand"
    assert "EPSG:4326" in res.crs

@pytest.mark.skipif(not GIS_DEPS_AVAILABLE, reason="pyogrio/pyproj missing")
def test_k_outside_india_rejected():
    # Null Island (0,0) is outside India
    res = resolve_region_from_coordinate(0.0, 0.0)
    assert res.status == GISResolutionStatus.OUTSIDE_KNOWN_REGIONS
    
    # Admin layer resolution for Null Island
    admin_res = resolve_state_from_coordinate(0.0, 0.0)
    assert admin_res.status == GISResolutionStatus.OUTSIDE_KNOWN_REGIONS

@pytest.mark.skipif(not GIS_DEPS_AVAILABLE, reason="pyogrio/pyproj missing")
def test_l_administrative_resolution_works():
    # Derive a point from a specific district, e.g., Almora
    dist_cache = _load_admin_layer('district')
    almora_idx = None
    for i, val in enumerate(dist_cache.fields['DISTRICT']):
        if val == 'ALMORA':
            almora_idx = i
            break
            
    assert almora_idx is not None
    almora_geom = dist_cache.geometries[almora_idx]
    rep_point = almora_geom.representative_point()
    
    res = resolve_district_from_coordinate(rep_point.y, rep_point.x)
    assert res.status == GISResolutionStatus.RESOLVED
    assert res.district == 'ALMORA'
    # LGD code for Almora is known to be '064' in the metadata
    assert res.district_lgd == '064'
    assert res.state_lgd == '05'

def test_m_n_o_other_regions_remain_unavailable():
    # Only Uttarakhand should be mapped
    assert get_region_geometry_status('maharashtra_western_ghats') == "GEOMETRY_UNAVAILABLE"
    assert get_region_geometry_status('sikkim_eastern_himalayas') == "GEOMETRY_UNAVAILABLE"
    assert get_region_geometry_status('chota_nagpur_plateau') == "GEOMETRY_UNAVAILABLE"
