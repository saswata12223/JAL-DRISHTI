import json
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.model_selection import RandomizedSearchCV, GroupKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import make_scorer, recall_score
import xgboost as xgb
import lightgbm as lgb

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ML_Hyperparameter_Tuning")

RANDOM_SEED = 42

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
PROC_DIR = DATA_DIR / "processed"
ML_DIR = PROC_DIR / "ml"
MODELS_DIR = ML_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

def load_data():
    dataset_path = ML_DIR / "flood_ml_features_clean.parquet"
    if not dataset_path.exists():
        dataset_path = ML_DIR / "flood_ml_features.parquet"
        
    allowlist_path = ML_DIR / "models" / "clean_feature_allowlist.json"
    if not allowlist_path.exists():
        allowlist_path = ML_DIR / "model_feature_allowlist.json"

    logger.info(f"Loading feature matrix from {dataset_path}...")
    df = pd.read_parquet(dataset_path)

    with open(allowlist_path, "r", encoding="utf-8") as f:
        allowlist = json.load(f)
    
    # Try different formats of allowlist
    if "clean_predictors" in allowlist:
        predictors = [p["feature"] for p in allowlist["clean_predictors"]]
    elif "allowed_predictors" in allowlist:
        predictors = [p["feature"] for p in allowlist["allowed_predictors"]]
    else:
        # Fallback
        predictors = [c for c in df.columns if c not in ["sample_id", "sample_type", "spatial_id", "timestamp_utc", "district", "major_basin", "flood_event_label", "split_group"]]

    # Some predictors might not be in the df if physics layer is not computed yet.
    # In train_flood_model.py they compute physics. For simplicity, we just use what's in df.
    actual_predictors = [p for p in predictors if p in df.columns]
    
    # Target and group
    target_col = "flood_event_label"
    group_col = "district"
    
    if group_col not in df.columns:
        df[group_col] = "unknown_district"
        
    # Standardize
    scaler = StandardScaler()
    X = scaler.fit_transform(df[actual_predictors].fillna(0.0))
    y = df[target_col].values
    groups = df[group_col].values
    
    return X, y, groups, actual_predictors

def tune_xgboost(X, y, groups):
    logger.info("Starting XGBoost tuning...")
    
    pos_weight = (len(y) - sum(y)) / (sum(y) + 1e-6)
    
    xgb_model = xgb.XGBClassifier(
        scale_pos_weight=pos_weight,
        random_state=RANDOM_SEED,
        eval_metric="logloss"
    )
    
    param_distributions = {
        'n_estimators': [50, 100, 200],
        'max_depth': [3, 4, 5, 6, 8],
        'learning_rate': [0.01, 0.05, 0.08, 0.1, 0.2],
        'subsample': [0.7, 0.8, 0.9, 1.0],
        'colsample_bytree': [0.7, 0.8, 0.9, 1.0]
    }
    
    gkf = GroupKFold(n_splits=5)
    recall_scorer = make_scorer(recall_score, zero_division=0)
    
    search = RandomizedSearchCV(
        estimator=xgb_model,
        param_distributions=param_distributions,
        n_iter=10,  # Bounded search to save compute
        scoring=recall_scorer,
        cv=gkf,
        verbose=1,
        random_state=RANDOM_SEED,
        n_jobs=1
    )
    
    t0 = time.time()
    search.fit(X, y, groups=groups)
    t1 = time.time()
    
    logger.info(f"XGBoost tuning completed in {t1-t0:.2f} seconds.")
    return search

def main():
    try:
        X, y, groups, predictors = load_data()
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        return

    logger.info(f"Loaded {len(X)} samples with {len(predictors)} features.")
    
    search_xgb = tune_xgboost(X, y, groups)
    
    report = {
        "title": "Hyperparameter Tuning Report",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "model_algorithm": "XGBoost Classifier",
        "search_configuration": "RandomizedSearchCV (n_iter=10)",
        "cv_strategy": "GroupKFold (n_splits=5) grouped by district",
        "evaluation_metric": "Recall",
        "best_parameters": search_xgb.best_params_,
        "best_cv_score": round(float(search_xgb.best_score_), 5),
        "runtime_seconds": "Not recorded directly",
        "feature_count": len(predictors)
    }
    
    out_path = MODELS_DIR / "optimal_hyperparameters.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    logger.info(f"Optimal hyperparameters saved to {out_path}")
    logger.info(f"Best Params: {search_xgb.best_params_}")
    logger.info(f"Best CV Recall: {search_xgb.best_score_:.4f}")

if __name__ == "__main__":
    main()
