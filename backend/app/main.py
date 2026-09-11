"""
FlashFloodAI — Backend REST API Main Application Entrypoint
Target Region: Uttarakhand, India
Technology Stack: FastAPI, PostgreSQL, PostGIS, TimescaleDB
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes import api_router
from app.services.prediction_service import PredictionService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("FlashFloodAI.Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown routines."""
    logger.info("Initializing FlashFloodAI Backend REST API...")
    logger.info(f"Target Region: Uttarakhand (Bounding Box: {settings.BBOX_MIN_LON}E - {settings.BBOX_MAX_LON}E, {settings.BBOX_MIN_LAT}N - {settings.BBOX_MAX_LAT}N)")
    logger.info(f"Connecting to ML Prediction Service...")
    _ = PredictionService.get_instance()
    yield
    logger.info("Shutting down FlashFloodAI Backend REST API.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Operational Flash Flood Early Warning and Environmental Monitoring API for Uttarakhand, India.",
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
