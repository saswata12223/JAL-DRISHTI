"""
FlashFloodAI Backend — FFEWS Integration Route
"""

from typing import Optional
from fastapi import APIRouter, Query, Body, HTTPException

from app.services.ffews_service import FfewsService

router = APIRouter(prefix="/ffews", tags=["FFEWS Integration"])

@router.get("/telemetry", summary="Get FFEWS Long-Term Forecast & Risk Score")
async def get_ffews_telemetry(
    lat: Optional[float] = Query(None, description="Latitude in decimal degrees"),
    lon: Optional[float] = Query(None, description="Longitude in decimal degrees")
):
    """
    Retrieves the 15-day Open-Meteo rainfall and flood forecast, 
    matching the original FFEWS backend logic.
    """
    try:
        data = await FfewsService.get_telemetry(lat, lon)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-sms", summary="Trigger FFEWS SMS Test")
async def test_ffews_sms(
    message: str = Body(..., embed=True),
    to: str = Body(..., embed=True)
):
    """
    Triggers an SMS alert using the original FFEWS BulkSMS integration logic.
    """
    if not message or not to:
        raise HTTPException(status_code=400, detail="Message and to number are required.")
        
    success, resp = await FfewsService.send_sms(message, to)
    if success:
        return {"success": True, "message": "SMS request sent.", "response": resp}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to send SMS: {resp}")
