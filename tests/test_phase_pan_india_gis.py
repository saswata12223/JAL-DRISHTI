import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_01_india_wide_administrative_coverage():
    res = client.get("/api/v1/gis/admin/regions")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["country"] == "INDIA"
    states = data["states"]
    assert len(states) >= 30 # Pan-India covers more than 30 regions/states
    # Should not assert a hardcoded count per prompt

def test_02_uttarakhand_resolution():
    res = client.get("/api/v1/gis/admin/resolve?latitude=30.3&longitude=78.0")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["state"] == "UTTARAKHAND"
    assert data["administrative_gis"]["available"] is True
    assert data["ml"]["available"] is True

def test_03_karnataka_resolution():
    res = client.get("/api/v1/gis/admin/resolve?latitude=12.97&longitude=77.59")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["state"] == "KARNATAKA"
    assert data["administrative_gis"]["available"] is True
    assert data["ml"]["available"] is False
    assert data["ml"]["reason"] == "MODEL_SCOPE_UTTARAKHAND_ONLY"
    assert data["live_telemetry"]["available"] is False

def test_04_maharashtra_resolution():
    res = client.get("/api/v1/gis/admin/resolve?latitude=19.07&longitude=72.87")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["state"] == "MAHARASHTRA"
    assert data["administrative_gis"]["available"] is True
    assert data["ml"]["available"] is False

def test_05_tamil_nadu_resolution():
    res = client.get("/api/v1/gis/admin/resolve?latitude=13.08&longitude=80.27")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["state"] == "TAMIL NADU"
    assert data["administrative_gis"]["available"] is True
    assert data["ml"]["available"] is False

def test_06_outside_india():
    res = client.get("/api/v1/gis/admin/resolve?latitude=51.5&longitude=-0.1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["administrative_gis"]["available"] is False
    assert data["ml"]["available"] is False

def test_07_disputed_geometry_handling():
    res = client.get("/api/v1/gis/admin/regions")
    assert res.status_code == 200
    data = res.json()["data"]
    states = [s["name"] for s in data["states"]]
    assert any("DISPUTED" in s.upper() for s in states), "Disputed features must be retained"

