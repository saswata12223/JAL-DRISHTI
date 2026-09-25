import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import StaticPool
from typing import Generator

# Use an isolated SQLite database to ensure the prototype runs perfectly on localhost
SOS_DATABASE_URL = os.getenv("SOS_DATABASE_URL", "sqlite:///./data/jal_drishti_sos.db")

# Ensure the data directory exists
os.makedirs(os.path.dirname("./data/jal_drishti_sos.db"), exist_ok=True)

engine = create_engine(
    SOS_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,          # Wait up to 30s for a lock instead of failing immediately
    },
    echo=False
)

# Enable WAL mode — allows concurrent reads and writes without blocking
# This fixes the SSE stream session blocking the incoming POST endpoint
@event.listens_for(engine, "connect")
def set_wal_mode(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")  # 30s busy timeout at DB level too
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_sos_db() -> Generator:
    """Dependency for providing request-scoped database sessions for SOS system."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_sos_db():
    """Initializes the database tables."""
    Base.metadata.create_all(bind=engine)
