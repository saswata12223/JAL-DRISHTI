"""
FlashFloodAI Backend — Health & Diagnostic Service
Inspects database connectivity, PostGIS availability, TimescaleDB status, and ML model status.
"""

from typing import Any, Dict
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.services.prediction_service import PredictionService


class HealthService:
    """Provides system diagnostics and service availability checks."""

    @staticmethod
    def check_health(db_session: Session = None) -> Dict[str, Any]:
        status = {
            "status": "HEALTHY",
            "version": settings.VERSION,
            "project_name": settings.PROJECT_NAME,
            "ml_engine_loaded": PredictionService.get_instance().is_ready,
            "database": {
                "configured_url": settings.sync_database_url.split("@")[-1] if "@" in settings.sync_database_url else "configured",
                "connected": False,
                "postgis_enabled": False,
                "timescaledb_enabled": False,
                "error": None,
            },
        }

        if db_session is not None:
            try:
                # Test basic DB query
                db_session.execute(text("SELECT 1;"))
                status["database"]["connected"] = True

                # Test PostGIS
                try:
                    res_pg = db_session.execute(text("SELECT PostGIS_Version();")).scalar()
                    status["database"]["postgis_enabled"] = bool(res_pg)
                    status["database"]["postgis_version"] = str(res_pg)
                except Exception as pge:
                    status["database"]["postgis_enabled"] = False
                    status["database"]["postgis_error"] = str(pge)

                # Test TimescaleDB
                try:
                    res_ts = db_session.execute(text("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';")).scalar()
                    status["database"]["timescaledb_enabled"] = bool(res_ts)
                    status["database"]["timescaledb_version"] = str(res_ts) if res_ts else "NOT_INSTALLED"
                except Exception as tse:
                    status["database"]["timescaledb_enabled"] = False
                    status["database"]["timescaledb_error"] = str(tse)

            except Exception as e:
                status["database"]["connected"] = False
                status["database"]["error"] = str(e)
                status["status"] = "DEGRADED"

        return status
