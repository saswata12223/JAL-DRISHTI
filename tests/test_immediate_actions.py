"""
FlashFloodAI — Immediate Actions & Emergency Response Unit Tests
Verifies voice call dispatch, SMS dissemination, SOS alert webhook, shelter registry,
and tactical plan endpoints.
"""

import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_DIR) not in sys.path:
    sys.path.insert(0, str(PROJECT_DIR))

from app.main import app


class TestImmediateActionsEndpoints(unittest.TestCase):
    """Test suite for /api/v1/immediate-actions endpoints."""

    def setUp(self):
        self.client = TestClient(app)

    def test_01_get_tactical_plan(self):
        resp = self.client.get("/api/v1/immediate-actions/tactical-plan")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertIn("forces", body["data"])
        self.assertIn("ingress_routes", body["data"])
        self.assertIn("vulnerable_points", body["data"])
        self.assertIn("population_centers", body["data"])
        self.assertIn("safe_shortest_routes", body["data"])
        self.assertGreaterEqual(len(body["data"]["forces"]), 4)

    def test_02_dispatch_voice_call_multilingual(self):
        for lang in ["hi", "en", "local_uttarakhand"]:
            resp = self.client.post(
                "/api/v1/immediate-actions/call/dispatch",
                json={
                    "phone_numbers": ["9748379047", "98833 70734", "90195 86089"],
                    "language": lang,
                    "basin_location": "Kedarnath Valley",
                },
            )
            self.assertEqual(resp.status_code, 200)
            body = resp.json()
            self.assertTrue(body["success"])
            self.assertEqual(body["count"], 3)
            self.assertIn("script_used", body["data"])

    def test_03_dispatch_sms(self):
        resp = self.client.post(
            "/api/v1/immediate-actions/sms/dispatch",
            json={
                "phone_numbers": ["9748379047", "98833 70734"],
                "message_text": "Test alert: Flash flood warning!",
            },
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["count"], 2)

    def test_03b_dispatch_whatsapp(self):
        resp = self.client.post(
            "/api/v1/immediate-actions/whatsapp/dispatch",
            json={
                "phone_numbers": ["9748379047", "98833 70734", "90195 86089"],
                "message_text": "🚨 *[URGENT JAL DRISHTI FLASH FLOOD ALERT]* Evacuate immediately.",
                "basin_location": "Alaknanda & Mandakini Valley",
            },
        )
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertTrue(body["success"])
        self.assertEqual(body["count"], 3)
        self.assertIn("dispatches", body["data"])
        self.assertTrue(body["data"]["dispatches"][0]["message_sid"].startswith("WA-"))

    def test_04_sos_alerts_lifecycle(self):
        # 1. Get existing alerts
        resp = self.client.get("/api/v1/immediate-actions/sos")
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["success"])

        # 2. Inbound webhook from mobile app
        inbound = {
            "citizen_name": "Test Pilgrim",
            "contact_number": "+91 97483 79047",
            "lat": 30.735,
            "lon": 79.067,
            "location_name": "Kedarnath Temple Base Camp",
            "distress_type": "RISING_WATER",
            "distress_description": "Water entering tent.",
            "people_count": 2,
            "battery_percent": 90,
        }
        post_resp = self.client.post("/api/v1/immediate-actions/sos", json=inbound)
        self.assertEqual(post_resp.status_code, 200)
        sos_id = post_resp.json()["data"]["id"]

        # 3. Patch status to DISPATCHED
        patch_resp = self.client.patch(
            f"/api/v1/immediate-actions/sos/{sos_id}/status",
            json={"status": "DISPATCHED", "assigned_unit": "SDRF Kedarnath Unit"},
        )
        self.assertEqual(patch_resp.status_code, 200)
        self.assertEqual(patch_resp.json()["data"]["status"], "DISPATCHED")

    def test_05_shelter_management_and_two_way_messaging(self):
        # 1. List shelters
        resp = self.client.get("/api/v1/immediate-actions/shelters")
        self.assertEqual(resp.status_code, 200)
        shelters = resp.json()["data"]
        self.assertGreater(len(shelters), 3)

        # 2. Broadcast to shelter
        shelter_id = shelters[0]["id"]
        bcast_resp = self.client.post(f"/api/v1/immediate-actions/shelters/{shelter_id}/broadcast")
        self.assertEqual(bcast_resp.status_code, 200)

        # 3. Update shelter availability response
        avail_resp = self.client.post(
            f"/api/v1/immediate-actions/shelters/{shelter_id}/availability",
            json={"occupied": 500, "status": "OPEN", "water_days": 10, "notes": "Supplies intact."},
        )
        self.assertEqual(avail_resp.status_code, 200)
        self.assertEqual(avail_resp.json()["data"]["occupied"], 500)


if __name__ == "__main__":
    unittest.main()
