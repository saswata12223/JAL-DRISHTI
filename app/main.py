"""
FlashFloodAI — Backend REST API Main Application Entrypoint
Target Region: Uttarakhand, India
Technology Stack: FastAPI, PostgreSQL, PostGIS, TimescaleDB
"""

import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes import api_router
from app.api.routes.environment import router as environment_router
from app.services.prediction_service import PredictionService
from app.db.sos_database import init_sos_db
from app.services.sachet_service import ingest_sachet_alerts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("FlashFloodAI.Main")

async def background_sachet_ingestion():
    while True:
        try:
            logger.info("Running background SACHET CAP XML ingestion...")
            # Ideally this would be an async HTTP call or run in a threadpool so it doesn't block the event loop
            await asyncio.to_thread(ingest_sachet_alerts)
            logger.info("SACHET ingestion complete. Sleeping for 5 minutes.")
        except Exception as e:
            logger.error(f"Error during scheduled SACHET ingestion: {e}")
        
        await asyncio.sleep(300) # Sleep for 5 minutes

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown routines."""
    logger.info("Initializing FlashFloodAI Backend REST API...")
    logger.info(f"Target Region: Uttarakhand (Bounding Box: {settings.BBOX_MIN_LON}E - {settings.BBOX_MAX_LON}E, {settings.BBOX_MIN_LAT}N - {settings.BBOX_MAX_LAT}N)")
    logger.info(f"Connecting to ML Prediction Service...")
    _ = PredictionService.get_instance()
    logger.info(f"Initializing SOS Database...")
    init_sos_db()
    
    # Start the background tasks
    ingestion_task = asyncio.create_task(background_sachet_ingestion())
    
    yield
    
    ingestion_task.cancel()
    logger.info("Shutting down FlashFloodAI Backend REST API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Operational Flash Flood Early Warning and Environmental Monitoring API for India.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Register environment route
app.include_router(environment_router)


@app.get("/", tags=["Root"])
def root_info():
    """Root endpoint providing system greeting and API documentation link."""
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "ONLINE",
        "api_v1_docs": "/docs",
        "health_endpoint": f"{settings.API_V1_STR}/health",
        "stations_endpoint": f"{settings.API_V1_STR}/stations",
        "predictions_endpoint": f"{settings.API_V1_STR}/predictions",
    }
