import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.gis import _load_admin_layer, GIS_DEPS_AVAILABLE

client = TestClient(app)

@pytest.fixture(scope="module")
def uk_point():
    if not GIS_DEPS_AVAILABLE:
        pytest.skip("pyogrio/pyproj missing")
    state_cache = _load_admin_layer('state')
    uk_idx = None
    for i, val in enumerate(state_cache.fields['STATE']):
        if val == 'UTTARAKHAND':
            uk_idx = i
            break
    assert uk_idx is not None
    rep_point = state_cache.geometries[uk_idx].representative_point()
    return rep_point.y, rep_point.x

@pytest.fixture(scope="module")
def tn_point():
    if not GIS_DEPS_AVAILABLE:
        pytest.skip("pyogrio/pyproj missing")
    state_cache = _load_admin_layer('state')
    tn_idx = None
    for i, val in enumerate(state_cache.fields['STATE']):
        if val == 'TAMIL NADU':
            tn_idx = i
            break
    assert tn_idx is not None
    rep_point = state_cache.geometries[tn_idx].representative_point()
    return rep_point.y, rep_point.x

@pytest.fixture(scope="module")
def disputed_point():
    if not GIS_DEPS_AVAILABLE:
        pytest.skip("pyogrio/pyproj missing")
    state_cache = _load_admin_layer('state')
    disp_idx = None
    for i, val in enumerate(state_cache.fields['STATE']):
        if val and 'DISPUTED' in str(val).upper():
            disp_idx = i
            break
    assert disp_idx is not None
    rep_point = state_cache.geometries[disp_idx].representative_point()
    return rep_point.y, rep_point.x


def test_admin_resolve_inside_uttarakhand(uk_point):
    lat, lon = uk_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    data = response.json()["data"]
    
    # Check Admin Resolution
    assert data["administrative"]["state"]["name"] == "UTTARAKHAND"
    assert data["administrative"]["state"]["status"] == "RESOLVED"
    assert data["administrative"]["state"].get("is_disputed") is None
    
    # Check Project Region
    assert data["project_region"]["region_id"] == "uttarakhand"
    assert data["project_region"]["status"] == "RESOLVED"


def test_admin_resolve_tamil_nadu(tn_point):
    lat, lon = tn_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    data = response.json()["data"]
    
    # Check Admin Resolution
    assert data["administrative"]["state"]["name"] == "TAMIL NADU"
    assert data["administrative"]["state"]["status"] == "RESOLVED"
    
    # Check Project Region is UNAVAILABLE/OUTSIDE
    # It will be OUTSIDE_KNOWN_REGIONS because it's outside all known boundaries
    assert data["project_region"]["status"] in ["OUTSIDE_KNOWN_REGIONS", "GEOMETRY_UNAVAILABLE"]
    assert data["project_region"]["region_id"] is None


def test_admin_resolve_outside_india():
    lat, lon = 0.0, 0.0
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    data = response.json()["data"]
    
    assert data["administrative"]["state"]["status"] == "OUTSIDE_KNOWN_REGIONS"
    assert data["administrative"]["district"]["status"] == "OUTSIDE_KNOWN_REGIONS"
    assert data["project_region"]["status"] == "OUTSIDE_KNOWN_REGIONS"


def test_admin_resolve_disputed_territory(disputed_point):
    lat, lon = disputed_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    data = response.json()["data"]
    
    assert "DISPUTED" in data["administrative"]["state"]["name"].upper()
    assert data["administrative"]["state"]["is_disputed"] is True
    assert data["project_region"]["status"] in ["OUTSIDE_KNOWN_REGIONS", "GEOMETRY_UNAVAILABLE"]


def test_admin_resolve_invalid_coords():
    response = client.get("/api/v1/gis/admin/resolve?latitude=95&longitude=200")
    assert response.status_code == 422
    assert response.json()["detail"]["status"] == "INVALID_COORDINATES"
