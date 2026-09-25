import hashlib
from pathlib import Path

def get_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

models = [
    'data/processed/ml/models/final_flood_risk_model.joblib',
    'data/processed/ml/models/feature_scaler.joblib'
]
for p in models:
    print(f"{p}: {get_hash(Path(p))}")
