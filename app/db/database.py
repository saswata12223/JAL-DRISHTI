"""
FlashFloodAI Backend — Database Session & Connection Management
Configures SQLAlchemy with PostGIS and TimescaleDB extension support.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.pool import QueuePool

from app.config import settings

logger = logging.getLogger("FlashFloodAI.Database")

# Declarative Base for ORM Models
Base = declarative_base()

# SQLAlchemy Engine
try:
    engine = create_engine(
        settings.sync_database_url,
        poolclass=QueuePool,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=1800,
        echo=settings.DEBUG,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Database engine initialization deferred: {e}")
    engine = None
    SessionLocal = None


def get_db() -> Generator[Session, None, None]:
    """Dependency for providing request-scoped database sessions."""
    if SessionLocal is None:
        raise RuntimeError("Database engine is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db_extensions(db_session: Session) -> bool:
    """Enables PostGIS and TimescaleDB extensions on the connected database."""
    try:
        logger.info("Enabling PostGIS extension...")
        db_session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        
        logger.info("Enabling TimescaleDB extension...")
        try:
            db_session.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;"))
        except Exception as te:
            logger.warning(f"TimescaleDB extension creation warning (may require superuser or pre-installation): {te}")
            
        db_session.commit()
        return True
    except Exception as e:
        logger.error(f"Error enabling database extensions: {e}")
        db_session.rollback()
        return False
