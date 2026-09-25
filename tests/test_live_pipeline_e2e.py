import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(REPO_ROOT))

from backend.app.main import app

client = TestClient(app)

def test_get_live_overview():
    response = client.get("/api/v1/live/overview")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "total_stations_monitored" in data
    assert "note" in data
    # Confirm it returns our scientific note
    assert "NOT validated flood probability" in data["note"]
    
def test_get_live_anomalies():
    response = client.get("/api/v1/live/anomalies?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first = data[0]
        assert "station_id" in first
        assert "anomaly_score" in first
        assert "is_anomaly_1pct" in first
        assert "is_anomaly_5pct" in first
        assert "is_anomaly_10pct" in first
        assert "features" in first
