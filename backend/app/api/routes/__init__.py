"""
FlashFloodAI Backend — Routes Aggregator
"""

from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.stations import router as stations_router
from app.api.routes.observations import router as observations_router
from app.api.routes.predictions import router as predictions_router
from app.api.routes.historical_events import router as historical_events_router
from app.api.routes.metadata import router as metadata_router
from app.api.routes.risk import router as risk_router
from app.api.routes.weather import router as weather_router
from app.api.routes.hardware import router as hardware_router
from app.api.routes.immediate_actions import router as immediate_actions_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(stations_router)
api_router.include_router(observations_router)
api_router.include_router(predictions_router)
api_router.include_router(historical_events_router)
api_router.include_router(metadata_router)
api_router.include_router(risk_router)
api_router.include_router(weather_router)
api_router.include_router(hardware_router)
api_router.include_router(immediate_actions_router)

__all__ = ["api_router"]

