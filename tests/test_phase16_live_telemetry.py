import os
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
REPO_ROOT = Path(__file__).resolve().parents[1]
LIVE_AUDIT_DIR = REPO_ROOT / "data" / "processed" / "live"

def test_01_telemetry_adapters_blocked():
    """Verify that we found NO active adapters for the live telemetry sources."""
    inventory_path = LIVE_AUDIT_DIR / "phase16_source_inventory.csv"
    assert inventory_path.exists(), "Source inventory missing"
    
    with open(inventory_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Ensure they are all NOT_CONFIGURED
    assert "NOT_CONFIGURED" in content
    assert "AVAILABLE" not in content

def test_02_historical_and_live_separation():
    """Verify /live/telemetry and /risk/offline endpoints are separated and behave appropriately."""
    # Historical offline should return data
    res_offline = client.get("/api/v1/risk/offline")
    assert res_offline.status_code == 200
    assert res_offline.json()["success"] is True
    
    # Live telemetry should safely return UNAVAILABLE or AVAILABLE (if Phase 17 activated)
    res_live = client.get("/api/v1/live/telemetry")
    assert res_live.status_code == 200
    assert res_live.json()["status"] in ["UNAVAILABLE", "AVAILABLE"]
    assert res_live.json()["data_state"] in ["NO_CURRENT_OBSERVATION", "LIVE", "STALE"]

def test_03_inference_safety_gate():
    """Verify that ml_pipeline/live_inference.py blocks live inference."""
    with open(REPO_ROOT / "scripts" / "ml_pipeline" / "live_inference.py", "r") as f:
        content = f.read()
    assert "LIVE_ML_INFERENCE = BLOCKED" in content, "Safety gate missing"
    assert "return" in content.split("LIVE_ML_INFERENCE = BLOCKED")[1].split("logger.info")[0], "Safety gate doesn't return early"

def test_04_ml_artifact_hashes():
    """Verify no model files were mutated."""
    before_path = LIVE_AUDIT_DIR / "phase16_artifact_hashes_before.json"
    after_path = LIVE_AUDIT_DIR / "phase16_artifact_hashes_after.json"
    
    with open(before_path, 'r') as f:
        before = json.load(f)
    with open(after_path, 'r') as f:
        after = json.load(f)
        
    assert before == after
    
    # Check that final_flood_risk_model exists in it
    assert any("final_flood_risk_model.joblib" in k for k in before.keys())

def test_05_frontend_safe_states():
    """Verify that frontend doesn't use REFERENCE_DECISIONS mock fallback."""
    mi_service_path = REPO_ROOT / "frontend" / "src" / "services" / "modelIntelligenceService.js"
    with open(mi_service_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Make sure we don't have REFERENCE_DECISIONS_WITH_ACTIONS exported
    assert "export const REFERENCE_DECISIONS_WITH_ACTIONS" not in content
