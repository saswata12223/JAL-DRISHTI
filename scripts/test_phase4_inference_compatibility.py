import os, json, joblib, numpy as np, pandas as pd



models_dir = "data/processed/ml/models"

cand_model_path = os.path.join(models_dir, "candidate_flood_risk_model_phase4.joblib")

cand_prep_path = os.path.join(models_dir, "candidate_feature_preprocessor_phase4.joblib")

cand_allowlist_path = os.path.join(models_dir, "candidate_feature_allowlist_phase4.json")



print("Testing Phase 4 Candidate Runtime Compatibility...")

model = joblib.load(cand_model_path)

prep = joblib.load(cand_prep_path)

with open(cand_allowlist_path, "r", encoding="utf-8") as f:

    allowlist = json.load(f)



predictors = allowlist["predictors"]



# Create mock single prediction payload

sample_payload = {p: 0.5 for p in predictors}

df_single = pd.DataFrame([sample_payload])



# Preprocess

X_imp = prep["imputer"].transform(df_single)

X_scaled = prep["scaler"].transform(X_imp)



# Predict

prob = float(model.predict_proba(X_scaled)[0, 1])



print(f"Sample Payload Prediction Probability: {prob:.4f}")

assert np.isfinite(prob), "ERROR: Non-finite probability!"

assert 0.0 <= prob <= 1.0, "ERROR: Probability out of bounds!"



output_dict = {

    "probability": round(prob, 4),

    "risk_class": "LOW" if prob < 0.2 else ("MODERATE" if prob < 0.4 else "EXTREME"),

    "decision_threshold": 0.40,

    "status": "COMPATIBLE"

}

print("Runtime Compatibility Output:", json.dumps(output_dict))
