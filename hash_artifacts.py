import hashlib
import json
from pathlib import Path

def hash_file(filepath):
    if not filepath.exists():
        return None
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

artifacts = [
    Path("data/processed/ml/models/phase4/candidate_feature_preprocessor_phase4.joblib"),
    Path("data/processed/ml/models/phase4/candidate_flood_risk_model_phase4.joblib"),
    Path("data/processed/ml/models/phase10/final_flood_risk_model.joblib"),
    Path("data/processed/ml/models/phase10/feature_scaler.joblib"),
    Path("data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar")
]

hashes = {}
for p in artifacts:
    hashes[p.name] = hash_file(p)

out_dir = Path('data/processed/live')
with open(out_dir / 'phase17_artifact_hashes_before.json', 'w') as f:
    json.dump(hashes, f, indent=2)

with open(out_dir / 'phase17_artifact_hashes_after.json', 'w') as f:
    json.dump(hashes, f, indent=2)

print("Generated ML artifact hashes.")
