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
    uk_idx = next(i for i, val in enumerate(state_cache.fields['STATE']) if val == 'UTTARAKHAND')
    rep_point = state_cache.geometries[uk_idx].representative_point()
    return rep_point.y, rep_point.x

@pytest.fixture(scope="module")
def tn_point():
    if not GIS_DEPS_AVAILABLE:
        pytest.skip("pyogrio/pyproj missing")
    state_cache = _load_admin_layer('state')
    tn_idx = next(i for i, val in enumerate(state_cache.fields['STATE']) if val == 'TAMIL NADU')
    rep_point = state_cache.geometries[tn_idx].representative_point()
    return rep_point.y, rep_point.x

@pytest.fixture(scope="module")
def disputed_point():
    if not GIS_DEPS_AVAILABLE:
        pytest.skip("pyogrio/pyproj missing")
    state_cache = _load_admin_layer('state')
    disp_idx = next(i for i, val in enumerate(state_cache.fields['STATE']) if val and 'DISPUTED' in str(val).upper())
    rep_point = state_cache.geometries[disp_idx].representative_point()
    return rep_point.y, rep_point.x

def test_frontend_scenario_a_uttarakhand(uk_point):
    """Scenario A - Uttarakhand: Real coordinate -> State resolved, Project Region resolved."""
    lat, lon = uk_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    
    data = response.json()["data"]
    admin = data["administrative"]
    
    assert admin["state"]["status"] == "RESOLVED"
    assert admin["state"]["name"] == "UTTARAKHAND"
    assert admin["district"]["status"] == "RESOLVED"
    assert admin["subdistrict"]["status"] == "RESOLVED"
    
    assert data["project_region"]["status"] == "RESOLVED"
    assert data["project_region"]["region_id"] == "uttarakhand"


def test_frontend_scenario_b_tamil_nadu(tn_point):
    """Scenario B - Tamil Nadu: Real coordinate -> State resolved, Project Region OUTSIDE_KNOWN_REGIONS."""
    lat, lon = tn_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    
    data = response.json()["data"]
    admin = data["administrative"]
    
    assert admin["state"]["status"] == "RESOLVED"
    assert admin["state"]["name"] == "TAMIL NADU"
    assert admin["district"]["status"] == "RESOLVED"
    assert admin["subdistrict"]["status"] == "RESOLVED"
    
    assert data["project_region"]["status"] in ["OUTSIDE_KNOWN_REGIONS", "GEOMETRY_UNAVAILABLE"]


def test_frontend_scenario_c_missing_coordinates():
    """Scenario C - Missing coordinates: Should return 422 Unprocessable Entity."""
    # API explicitly fails if missing lat/lon, which is what gisService handles by checking nulls
    # but if a request *is* made without them, it must be rejected gracefully.
    response = client.get("/api/v1/gis/admin/resolve")
    assert response.status_code == 422
    
    # Check that it's standard Pydantic validation error or custom error
    data = response.json()
    assert "detail" in data


def test_frontend_scenario_d_api_failure():
    """Scenario D - API Failure (Invalid Coordinate)."""
    response = client.get("/api/v1/gis/admin/resolve?latitude=999&longitude=999")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    # the frontend expects a JSON payload even on 422, let's verify it matches our contract
    assert data["detail"]["status"] == "INVALID_COORDINATES"


def test_frontend_scenario_e_disputed_coordinate(disputed_point):
    """Scenario E - Disputed territory."""
    lat, lon = disputed_point
    response = client.get(f"/api/v1/gis/admin/resolve?latitude={lat}&longitude={lon}")
    assert response.status_code == 200
    
    data = response.json()["data"]
    admin = data["administrative"]
    
    assert admin["state"]["is_disputed"] is True
    assert "DISPUTED" in admin["state"]["name"].upper()
    
