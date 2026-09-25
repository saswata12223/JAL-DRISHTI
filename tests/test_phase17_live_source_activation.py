import pytest
from fastapi.testclient import TestClient
from app.main import app
import json
from pathlib import Path
import hashlib

client = TestClient(app)

def test_01_active_application_root():
    import app.main as app_main
    assert "app\\main.py" in str(app_main.__file__) or "app/main.py" in str(app_main.__file__)

def test_02_live_source_connectivity():
    res = client.get("/api/v1/live/telemetry")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["AVAILABLE", "STALE", "UNAVAILABLE"]
    assert data["data_state"] in ["LIVE", "STALE", "UNVERIFIED", "NO_CURRENT_OBSERVATION"]
    
    if data["status"] == "AVAILABLE":
        obs = data["observations"][0]
        assert "openweather" in obs["source_id"]
        assert obs["observation_timestamp_utc"] is not None
        assert obs["retrieval_timestamp_utc"] is not None
        assert obs["age_seconds"] >= 0
        assert obs["coordinates"]["latitude"] is not None
        assert obs["coordinates"]["longitude"] is not None

def test_03_historical_separation():
    res_offline = client.get("/api/v1/risk/offline")
    assert res_offline.status_code == 200
    assert "success" in res_offline.json()

def test_04_ml_artifact_hashes_unchanged():
    out_dir = Path('data/processed/live')
    before_file = out_dir / 'phase17_artifact_hashes_before.json'
    after_file = out_dir / 'phase17_artifact_hashes_after.json'
    
    if before_file.exists() and after_file.exists():
        with open(before_file, 'r') as f:
            before = json.load(f)
        with open(after_file, 'r') as f:
            after = json.load(f)
        assert before == after
    else:
        pytest.skip("Hash files not found.")
