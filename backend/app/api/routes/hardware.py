"""
FlashFloodAI Backend -- Hardware Telemetry & Actuator REST API Routes
Provides endpoints for ESP32 sensor telemetry ingestion, status monitoring,
and physical buzzer test/acknowledgement dispatches.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Body

from app.schemas.common import APIResponse
from app.services.hardware_telemetry_service import HardwareTelemetryService

router = APIRouter(prefix="/hardware", tags=["Hardware & IoT Telemetry"])


@router.post("/telemetry", summary="Ingest ESP32 Sensor Reading")
def ingest_hardware_telemetry(payload: Dict[str, Any] = Body(...)):
    service = HardwareTelemetryService.get_instance()
    res = service.ingest_telemetry(payload, is_simulated=payload.get("is_simulated", False))
    return APIResponse(success=True, data=res)


@router.get("/status", summary="Get Real-Time Hardware & Sensor Status")
def get_hardware_status():
    service = HardwareTelemetryService.get_instance()
    status = service.get_live_status()
    return APIResponse(success=True, data=status)


@router.post("/buzzer/test", summary="Trigger Physical Buzzer Test Command")
def test_buzzer_actuator():
    service = HardwareTelemetryService.get_instance()
    res = service.trigger_test_buzzer()
    return APIResponse(success=True, data=res)


@router.post("/buzzer/acknowledge", summary="ESP32 Buzzer Command Acknowledgement")
def acknowledge_buzzer_actuator():
    service = HardwareTelemetryService.get_instance()
    res = service.acknowledge_buzzer()
    return APIResponse(success=True, data=res)