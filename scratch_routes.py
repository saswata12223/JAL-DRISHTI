import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[0]
sys.path.append(str(REPO_ROOT / 'backend'))

from app.main import app

for route in app.routes:
    print(route.path)
