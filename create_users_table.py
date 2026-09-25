import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.db.database import engine
from app.db.models.user import User

if __name__ == "__main__":
    print("Creating users table...")
    User.__table__.create(bind=engine, checkfirst=True)
    print("Done!")
