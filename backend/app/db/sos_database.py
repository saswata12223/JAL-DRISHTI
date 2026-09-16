import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

# Use an isolated SQLite database to ensure the prototype runs perfectly on localhost
SOS_DATABASE_URL = os.getenv("SOS_DATABASE_URL", "sqlite:///./data/jal_drishti_sos.db")

# Ensure the data directory exists
os.makedirs(os.path.dirname("./data/jal_drishti_sos.db"), exist_ok=True)

engine = create_engine(
    SOS_DATABASE_URL,
    connect_args={"check_same_thread": False},  # Needed for SQLite in FastAPI
    echo=False
)

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
