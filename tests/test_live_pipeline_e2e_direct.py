import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[0]
sys.path.append(str(REPO_ROOT / 'backend'))

from app.api.routes.live import get_live_overview, get_live_anomalies
from app.db.database import SessionLocal

def test_api_internally():
    db = SessionLocal()
    try:
        overview = get_live_overview(db)
        print("--- OVERVIEW ---")
        print(overview)
        assert overview['status'] in ['NORMAL', 'MODERATE_ANOMALY', 'HIGH_ANOMALY', 'NO_DATA']
        assert 'total_stations_monitored' in overview
        assert 'NOT validated flood probability' in overview['note']
        
        print("\n--- RECENT ANOMALIES ---")
        anomalies = get_live_anomalies(db, limit=5)
        print(f"Count: {len(anomalies)}")
        if len(anomalies) > 0:
            print(anomalies[0])
            
        print("\nSUCCESS: E2E DB Integration Verified!")
    finally:
        db.close()

if __name__ == '__main__':
    test_api_internally()
