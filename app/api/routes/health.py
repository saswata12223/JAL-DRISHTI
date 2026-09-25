"""
FlashFloodAI Backend — Health Check API Route
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])


@router.get("", summary="System Health & Diagnostic Status")
def get_health_status():
    """Returns application health, database connectivity, and ML engine status."""
    db_session = None
    if SessionLocal is not None:
        try:
            db_session = SessionLocal()
        except Exception:
            db_session = None

    try:
        status = HealthService.check_health(db_session)
        return status
    finally:
        if db_session is not None:
            db_session.close()
