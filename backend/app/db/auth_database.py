import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("FlashFloodAI.AuthDB")

# Resolve absolute path to backend/data
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, "jal_drishti_auth.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

AuthBase = declarative_base()

def get_auth_db():
    """Dependency for providing request-scoped authentication database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_auth_db():
    """Initializes the authentication database schema."""
    try:
        AuthBase.metadata.create_all(bind=engine)
        logger.info(f"Initialized Auth Database at {DB_PATH}")
    except Exception as e:
        logger.error(f"Error initializing Auth Database: {e}")
