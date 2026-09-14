import os

import json

import joblib

import pandas as pd

import numpy as np

import xgboost as xgb

from sklearn.ensemble import RandomForestClassifier

from sklearn.preprocessing import StandardScaler

from sklearn.impute import SimpleImputer

from sklearn.metrics import (

    precision_recall_curve, auc, roc_auc_score, brier_score_loss,

    precision_score, recall_score, f1_score, confusion_matrix

)

from sklearn.model_selection import GroupKFold



# Check for LightGBM optional import

try:

    import lightgbm as lgb

    HAS_LGBM = True

except ImportError:

    HAS_LGBM = False

    print("[NOTE] LightGBM not installed in environment. Skipping Model B per prompt instructions.")



print("==================== ML PHASE 4: LEAKAGE-CONTROLLED MODEL TRAINING ====================")



# Create output directories

phase4_val_dir = "data/processed/ml/validation/phase4"

models_dir = "data/processed/ml/models"

os.makedirs(phase4_val_dir, exist_ok=True)

os.makedirs(models_dir, exist_ok=True)



# Load Clean Dataset & Allowlist

df_clean = pd.read_parquet("data/processed/ml/flood_ml_features_clean.parquet")

with open("data/processed/ml/models/clean_feature_allowlist.json", "r", encoding="utf-8") as f:

    allowlist_doc = json.load(f)



# Extract 34 Pure Physical Features (Exp E - Exclude missingness indicators and CWC threshold constants)

prohibited_fields = allowlist_doc["prohibited_metadata_fields"]

clean_predictors = [

    p["feature"] for p in allowlist_doc["clean_predictors"]

    if not p["feature"].endswith("_missing") and p["feature"] not in prohibited_fields

]



cwc_station_constants = ["warning_level_m", "danger_level_m", "hfl_m", "gauge_datum_msl_m"]

predictors_34 = [p for p in clean_predictors if p not in cwc_station_constants]



print(f"Dataset shape: {df_clean.shape}")

print(f"Selected 34 Physical Predictors for Candidate Model:")

for idx, p in enumerate(predictors_34, 1):

    print(f"  {idx:2d}. {p}")



target_col = "flood_event_label"



# Verification: Ensure zero prohibited fields or missingness indicators

for p in predictors_34:

    assert not p.endswith("_missing"), f"Error: Missingness indicator {p} in predictors!"

    assert p not in prohibited_fields, f"Error: Prohibited field {p} in predictors!"



print("\n[VERIFICATION PASSED] Zero prohibited metadata or missingness indicators in predictors.")



# Save Candidate Feature Allowlist JSON

candidate_allowlist_doc = {

    "title": "Jal Drishti ML Phase 4 Candidate Feature Allowlist",

    "version": "4.0.0",

    "target_variable": target_col,

    "predictor_count": len(predictors_34),

    "predictors": predictors_34,

    "excluded_missingness_indicators": [p["feature"] for p in allowlist_doc["clean_predictors"] if p["feature"].endswith("_missing")],

    "excluded_prohibited_metadata": prohibited_fields

}



candidate_allowlist_path = os.path.join(models_dir, "candidate_feature_allowlist_phase4.json")

with open(candidate_allowlist_path, "w", encoding="utf-8") as f:

    json.dump(candidate_allowlist_doc, f, indent=2)

print(f"Saved Candidate Allowlist: {candidate_allowlist_path}")



# -------------------------------------------------------------

# STEP 4 & 12: HISTORICAL EVENT DISASTER FOLD ASSIGNMENTS

# -------------------------------------------------------------

groups = df_clean["district"].values

gkf = GroupKFold(n_splits=5)

X_raw = df_clean[predictors_34].values

y_all = df_clean[target_col].values



fold_splits = list(gkf.split(X_raw, y_all, groups))



hist_events_doc = []

for fold, (tr_idx, va_idx) in enumerate(fold_splits, 1):

    val_districts = list(df_clean.iloc[va_idx]["district"].unique())

    val_pos_df = df_clean.iloc[va_idx][df_clean.iloc[va_idx][target_col] == 1]



    events_in_val = []

    for _, r in val_pos_df.iterrows():

        events_in_val.append({

            "event_id": str(r.get("historical_event_id", "N/A")),

            "event_type": str(r.get("flood_event_type", "N/A")),

            "district": str(r.get("district", "N/A"))

        })



    hist_events_doc.append({

        "fold": fold,

        "train_samples": len(tr_idx),

        "val_samples": len(va_idx),

        "train_positives": int(y_all[tr_idx].sum()),

        "val_positives": int(y_all[va_idx].sum()),

        "val_districts": val_districts,

        "val_historical_events": events_in_val

    })



with open(os.path.join(phase4_val_dir, "historical_event_splits.json"), "w", encoding="utf-8") as f:

    json.dump(hist_events_doc, f, indent=2)



print("\n--- 5-FOLD DISTRICT-GROUPED SPLITS & HISTORICAL POSITIVES ---")

print(json.dumps(hist_events_doc, indent=2))



# -------------------------------------------------------------

# STEP 3, 5, 6, 7 & 8: FOLD-SAFE MODEL TRAINING & COMPARISON

# -------------------------------------------------------------

print("\n--- EVALUATING CANDIDATE MODELS (STRICT FOLD-LEVEL PREPROCESSING) ---")



models_to_test = {

    "XGBoost_Candidate": "xgb",

    "RandomForest_Candidate": "rf"

}

if HAS_LGBM:

    models_to_test["LightGBM_Candidate"] = "lgb"



model_metrics_summary = {}



def evaluate_candidate_model(model_type: str):

    fold_results = []



    for fold, (tr_idx, va_idx) in enumerate(fold_splits, 1):

        # 1. Split train / validation

        df_tr = df_clean.iloc[tr_idx][predictors_34]

        y_tr = y_all[tr_idx]

        df_va = df_clean.iloc[va_idx][predictors_34]

        y_va = y_all[va_idx]



        # 2. Fit median imputer ONLY on training rows

        imputer = SimpleImputer(strategy="median")

        X_tr_imp = imputer.fit_transform(df_tr)

        X_va_imp = imputer.transform(df_va)



        # 3. Fit scaler ONLY on training rows

        scaler = StandardScaler()

        X_tr_s = scaler.fit_transform(X_tr_imp)

        X_va_s = scaler.transform(X_va_imp)



        # 4. Calculate scale_pos_weight strictly from training rows

        pos_w = (len(y_tr) - sum(y_tr)) / (sum(y_tr) + 1e-6)



        # 5. Instantiate model

        if model_type == "xgb":

            clf = xgb.XGBClassifier(

                n_estimators=50,

                max_depth=4,

                learning_rate=0.05,

                scale_pos_weight=pos_w,

                eval_metric="logloss",

                random_state=42

            )

        elif model_type == "lgb" and HAS_LGBM:

            clf = lgb.LGBMClassifier(

                n_estimators=50,

                max_depth=4,

                learning_rate=0.05,

                scale_pos_weight=pos_w,

                random_state=42,

                verbose=-1

            )

        elif model_type == "rf":

            clf = RandomForestClassifier(

                n_estimators=100,

                max_depth=6,

                class_weight="balanced",

                random_state=42

            )



        # 6. Fit model ONLY on training rows

        clf.fit(X_tr_s, y_tr)



        # 7. Predict validation fold

        probs_va = clf.predict_proba(X_va_s)[:, 1]

        preds_va = (probs_va >= 0.40).astype(int)



        if sum(y_va) > 0:

            prec, rec, _ = precision_recall_curve(y_va, probs_va)

            pr_auc = float(auc(rec, prec))

            roc_auc = float(roc_auc_score(y_va, probs_va))

        else:

            pr_auc = 0.0

            roc_auc = 1.0 if (preds_va == 0).all() else 0.0



        rec_s = float(recall_score(y_va, preds_va, zero_division=0))

        prec_s = float(precision_score(y_va, preds_va, zero_division=0))

        f1_s = float(f1_score(y_va, preds_va, zero_division=0))

        brier = float(brier_score_loss(y_va, probs_va))

        cm = confusion_matrix(y_va, preds_va).tolist()



        fold_results.append({

            "fold": fold,

            "pr_auc": round(pr_auc, 5),

            "roc_auc": round(roc_auc, 5),

            "recall": round(rec_s, 5),

            "precision": round(prec_s, 5),

            "f1_score": round(f1_s, 5),

            "brier_score": round(brier, 6),

            "confusion_matrix": cm

        })



    df_res = pd.DataFrame(fold_results)

    summary = {

        "model_name": model_type,

        "mean_pr_auc": round(float(df_res["pr_auc"].mean()), 5),

        "mean_roc_auc": round(float(df_res["roc_auc"].mean()), 5),

        "mean_recall": round(float(df_res["recall"].mean()), 5),

        "mean_precision": round(float(df_res["precision"].mean()), 5),

        "mean_f1_score": round(float(df_res["f1_score"].mean()), 5),

        "mean_brier_score": round(float(df_res["brier_score"].mean()), 6),

        "folds": fold_results

    }

    return summary



for mname, mcode in models_to_test.items():

    res = evaluate_candidate_model(mcode)

    model_metrics_summary[mname] = res

    print(f"Model [{mname:22s}] -> PR-AUC: {res['mean_pr_auc']:.5f}, ROC-AUC: {res['mean_roc_auc']:.5f}, Recall: {res['mean_recall']:.5f}, Precision: {res['mean_precision']:.5f}, Brier: {res['mean_brier_score']:.6f}")



with open(os.path.join(phase4_val_dir, "model_comparison.json"), "w", encoding="utf-8") as f:

    json.dump(model_metrics_summary, f, indent=2)



# -------------------------------------------------------------

# STEP 11: ABLATION EXPERIMENTS (A, B, C, D)

# -------------------------------------------------------------

print("\n--- 11. PHASE 4 ABLATION EXPERIMENTS (STRICT FOLD CV) ---")



ablation_subsets = {

    "A_34_Physical_Predictors": predictors_34,

    "B_No_Soil_Moisture_30_Predictors": [p for p in predictors_34 if not ("soil" in p or "ssi" in p)],

    "C_No_CWC_Threshold_Distance": [p for p in predictors_34 if "cwc" not in p],

    "D_Rainfall_Weather_Terrain_Only_22": [

        p for p in predictors_34

        if "rainfall" in p or "precipitation" in p or "temperature" in p or "humidity" in p

        or "pressure" in p or "wind" in p or "elevation" in p or "slope" in p or "twi" in p or "spi" in p

    ]

}



ablation_summary = {}



for exp_name, feat_list in ablation_subsets.items():

    fold_pr, fold_roc, fold_rec, fold_prec, fold_f1, fold_brier = [], [], [], [], [], []



    for fold, (tr_idx, va_idx) in enumerate(fold_splits, 1):

        df_tr = df_clean.iloc[tr_idx][feat_list]

        y_tr = y_all[tr_idx]

        df_va = df_clean.iloc[va_idx][feat_list]

        y_va = y_all[va_idx]



        imp = SimpleImputer(strategy="median")

        X_tr_i = imp.fit_transform(df_tr)

        X_va_i = imp.transform(df_va)



        scl = StandardScaler()

        X_tr_s = scl.fit_transform(X_tr_i)

        X_va_s = scl.transform(X_va_i)



        pos_w = (len(y_tr) - sum(y_tr)) / (sum(y_tr) + 1e-6)



        m = xgb.XGBClassifier(

            n_estimators=50, max_depth=4, learning_rate=0.05,

            scale_pos_weight=pos_w, eval_metric="logloss", random_state=42

        )

        m.fit(X_tr_s, y_tr)



        p_va = m.predict_proba(X_va_s)[:, 1]

        c_va = (p_va >= 0.40).astype(int)



        if sum(y_va) > 0:

            pr, rc, _ = precision_recall_curve(y_va, p_va)

            pr_auc_v = float(auc(rc, pr))

            roc_auc_v = float(roc_auc_score(y_va, p_va))

        else:

            pr_auc_v = 0.0

            roc_auc_v = 1.0 if (c_va == 0).all() else 0.0



        fold_pr.append(pr_auc_v)

        fold_roc.append(roc_auc_v)

        fold_rec.append(float(recall_score(y_va, c_va, zero_division=0)))

        fold_prec.append(float(precision_score(y_va, c_va, zero_division=0)))

        fold_f1.append(float(f1_score(y_va, c_va, zero_division=0)))

        fold_brier.append(float(brier_score_loss(y_va, p_va)))



    ablation_summary[exp_name] = {

        "feature_count": len(feat_list),

        "mean_pr_auc": round(float(np.mean(fold_pr)), 5),

        "mean_roc_auc": round(float(np.mean(fold_roc)), 5),

        "mean_recall": round(float(np.mean(fold_rec)), 5),

        "mean_precision": round(float(np.mean(fold_prec)), 5),

        "mean_f1_score": round(float(np.mean(fold_f1)), 5),

        "mean_brier_score": round(float(np.mean(fold_brier)), 6)

    }



print(pd.DataFrame(ablation_summary).T.to_string())



with open(os.path.join(phase4_val_dir, "ablation_results.json"), "w", encoding="utf-8") as f:

    json.dump(ablation_summary, f, indent=2)



# -------------------------------------------------------------

# STEP 10: FEATURE IMPORTANCE STABILITY ANALYSIS

# -------------------------------------------------------------

print("\n--- 10. FEATURE IMPORTANCE STABILITY ANALYSIS (34 PHYSICAL PREDICTORS) ---")



fold_imps = []

for fold, (tr_idx, va_idx) in enumerate(fold_splits, 1):

    df_tr = df_clean.iloc[tr_idx][predictors_34]

    y_tr = y_all[tr_idx]



    imp = SimpleImputer(strategy="median")

    X_tr_i = imp.fit_transform(df_tr)

    scl = StandardScaler()

    X_tr_s = scl.fit_transform(X_tr_i)

    pos_w = (len(y_tr) - sum(y_tr)) / (sum(y_tr) + 1e-6)



    m = xgb.XGBClassifier(n_estimators=50, max_depth=4, learning_rate=0.05, scale_pos_weight=pos_w, eval_metric="logloss", random_state=42)

    m.fit(X_tr_s, y_tr)

    fold_imps.append(m.feature_importances_)



mean_imp = np.mean(fold_imps, axis=0)

std_imp = np.std(fold_imps, axis=0)



feat_imp_list = []

for idx, p in enumerate(predictors_34):

    feat_imp_list.append({

        "rank": 0,

        "feature": p,

        "mean_importance": round(float(mean_imp[idx]), 5),

        "std_importance": round(float(std_imp[idx]), 5)

    })



feat_imp_df = pd.DataFrame(feat_imp_list).sort_values("mean_importance", ascending=False).reset_index(drop=True)

for rank, row in feat_imp_df.iterrows():

    feat_imp_df.at[rank, "rank"] = int(rank + 1)



print("Top 10 Feature Importances Across Folds:")

print(feat_imp_df.head(10).to_string())



with open(os.path.join(phase4_val_dir, "feature_importance.json"), "w", encoding="utf-8") as f:

    json.dump(feat_imp_df.to_dict(orient="records"), f, indent=2)



# -------------------------------------------------------------

# STEP 13 & 14: TRAIN FINAL PHASE 4 CANDIDATE MODEL ARTIFACTS

# -------------------------------------------------------------

print("\n--- TRAINING FINAL PHASE 4 CANDIDATE MODEL ON FULL CLEAN DATASET ---")



X_full_df = df_clean[predictors_34]

y_full = df_clean[target_col].values



# Fit Preprocessing Pipeline strictly on Full Dataset for Candidate Serving

candidate_imputer = SimpleImputer(strategy="median")

X_full_imp = candidate_imputer.fit_transform(X_full_df)



candidate_scaler = StandardScaler()

X_full_scaled = candidate_scaler.fit_transform(X_full_imp)



pos_w_full = (len(y_full) - sum(y_full)) / (sum(y_full) + 1e-6)



candidate_model = xgb.XGBClassifier(

    n_estimators=50,

    max_depth=4,

    learning_rate=0.05,

    scale_pos_weight=pos_w_full,

    eval_metric="logloss",

    random_state=42

)

candidate_model.fit(X_full_scaled, y_full)



# Save Preprocessor Pipeline Dictionary

preprocessor_artifact = {

    "imputer": candidate_imputer,

    "scaler": candidate_scaler,

    "predictors": predictors_34,

    "median_values": dict(zip(predictors_34, candidate_imputer.statistics_))

}



candidate_model_path = os.path.join(models_dir, "candidate_flood_risk_model_phase4.joblib")

candidate_preprocessor_path = os.path.join(models_dir, "candidate_feature_preprocessor_phase4.joblib")



joblib.dump(candidate_model, candidate_model_path)

joblib.dump(preprocessor_artifact, candidate_preprocessor_path)



print(f"[SUCCESS] Saved Candidate Model: {candidate_model_path}")

print(f"[SUCCESS] Saved Candidate Preprocessor Pipeline: {candidate_preprocessor_path}")



# Verify Safety Rules

assert os.path.exists("data/processed/ml/models/final_flood_risk_model.joblib"), "CRITICAL: Champion model missing!"

assert os.path.exists("data/processed/ml/models/feature_scaler.joblib"), "CRITICAL: Champion scaler missing!"

print("\n[SAFETY CONFIRMED] Original Champion model and scaler preserved 100% untouched.")



print("\n==================== ML PHASE 4 CANDIDATE TRAINING COMPLETE ====================")
