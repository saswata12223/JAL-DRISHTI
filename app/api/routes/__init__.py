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
from app.api.routes.auth import router as auth_router
from app.api.routes.sos import router as sos_router
from app.api.routes.regions import router as regions_router
from app.api.routes.data_sources import router as data_sources_router
from app.api.routes.gis import router as gis_router
from app.api.routes.live import router as live_router
from app.api.routes.weather import router as weather_router
from app.api.routes.ffews import router as ffews_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(stations_router)
api_router.include_router(observations_router)
api_router.include_router(predictions_router)
api_router.include_router(historical_events_router)
api_router.include_router(metadata_router)
api_router.include_router(risk_router)
api_router.include_router(auth_router)
api_router.include_router(sos_router)
api_router.include_router(regions_router)
api_router.include_router(data_sources_router)
api_router.include_router(gis_router)
api_router.include_router(live_router)
api_router.include_router(weather_router)
api_router.include_router(ffews_router)
from app.api.routes.tactical_plan import router as tactical_plan_router
api_router.include_router(tactical_plan_router, prefix="/tactical-plan", tags=["Tactical Plan"])

__all__ = ["api_router"]
