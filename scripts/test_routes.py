from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
print(client.get("/api/v1/risk/offline").status_code)
print(client.get("/api/v1/live/telemetry").status_code)
