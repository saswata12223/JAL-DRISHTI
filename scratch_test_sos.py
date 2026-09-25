from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

response = client.post('/api/v1/sos/incoming', json={
    'sos_id': 'test-sos-123',
    'sender_id': 'node-1',
    'timestamp': '2026-09-14T10:00:00Z',
    'latitude': 30.0,
    'longitude': 78.0,
    'distress_type': 4,
    'message': 'Testing SOS',
    'gateway_device_id': 'gateway-1'
})
print(response.status_code)
print(response.json())
