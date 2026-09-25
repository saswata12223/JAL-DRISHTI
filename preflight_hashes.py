import hashlib
from pathlib import Path

def get_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest().upper()

soi = Path('data/raw/gis/survey_of_india/State_District_Subdistrict_PAN INDIA.rar')
print(f"SOI Hash: {get_hash(soi)}")
print(f"Expected: B8325E5D9DD0F04A6663D775363FE38CD2F23BD9DBAE3FB7118B4E6E0CE0BCB7")

ml1 = Path('data/processed/ml/models/phase10/final_flood_risk_model.joblib')
if ml1.exists():
    print(f"ML Hash: {get_hash(ml1)}")
else:
    print("final_flood_risk_model.joblib not found in phase10, checking phase4")
    ml4 = Path('data/processed/ml/models/phase4/candidate_flood_risk_model_phase4.joblib')
    print(f"ML Hash (Phase4): {get_hash(ml4)}")
