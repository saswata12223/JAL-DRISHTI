import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[0]
sys.path.append(str(REPO_ROOT / 'backend'))

from app.main import app

def print_routes():
    for route in app.routes:
        if hasattr(route, 'path'):
            print(route.path)
        elif hasattr(route, 'name'):
            print("Name:", route.name)
            
print_routes()
