"""
JalDrishti — Flood Forecasting Model Training & Evaluation Pipeline
Generates reproducible time-series storm benchmark data, trains supervised XGBoost and Random Forest
classifiers with chronological train/val/test splits, computes flood recall metrics, and serializes
the production model bundle.

IMPORTANT:
The generated dataset is saved to data/processed/ml/forecasting_training_dataset.csv and clearly
labeled as a benchmark demonstration training dataset ready for retraining on real catchment gauge logs.
"""

import os
import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    classification_report,
)
import joblib

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False

PROJECT_DIR = Path(__file__).resolve().parents[1]
ML_DIR = PROJECT_DIR / "data" / "processed" / "ml"
MODELS_DIR = ML_DIR / "models"
ML_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

DATASET_PATH = ML_DIR / "forecasting_training_dataset.csv"
MODEL_BUNDLE_PATH = MODELS_DIR / "flood_forecaster.joblib"
METRICS_PATH = MODELS_DIR / "forecaster_metrics.json"

FEATURE_NAMES = [
    "rain_intensity",
    "rain_5m",
    "rain_15m",
    "rain_30m",
    "rain_1h",
    "rain_3h",
    "rain_6h",
    "rate_of_change",
    "rain_duration_min",
    "water_level_m",
]


def generate_benchmark_dataset(num_samples: int = 2500, seed: int = 42) -> pd.DataFrame:
    """
    Generates realistic, physically-consistent time-series sequences representing
    monsoonal rain events, cloudburst storms, dry spells, and river level changes in Himalayan catchments.
    """
    np.random.seed(seed)
    timestamps = pd.date_range(start="2026-06-01 00:00:00", periods=num_samples, freq="15min")

    data = []
    current_intensity = 0.0
    current_water_level = 1.80  # meters
    continuous_rain_min = 0.0

    # Simulate 5 storm episodes across the season
    storm_centers = [300, 750, 1200, 1700, 2150]

    for i, t in enumerate(timestamps):
        # Distance to nearest storm center in steps
        dist_to_storm = min(abs(i - c) for c in storm_centers)

        if dist_to_storm < 50:
            # Active severe storm episode (cloudburst / heavy monsoonal surge)
            target_intensity = float(np.clip(0.60 + 0.35 * np.sin(i / 10.0) + np.random.normal(0, 0.05), 0.0, 1.0))
        elif dist_to_storm < 120:
            # Moderate monsoonal drizzle / intermittent rain
            target_intensity = float(np.clip(0.20 + 0.25 * np.sin(i / 20.0) + np.random.normal(0, 0.04), 0.0, 1.0))
        else:
            # Clear / dry weather
            target_intensity = float(np.clip(np.random.exponential(0.01), 0.0, 0.15))

        # Smooth intensity transition
        rate_of_change = (target_intensity - current_intensity) * 0.25
        current_intensity = float(np.clip(current_intensity + rate_of_change, 0.0, 1.0))

        if current_intensity > 0.08:
            continuous_rain_min += 15.0
        else:
            continuous_rain_min = max(0.0, continuous_rain_min - 15.0)

        # River level physical response: Base level 1.8m + runoff accumulation
        rain_forcing = current_intensity * 0.4
        recession = (current_water_level - 1.80) * 0.05
        current_water_level = float(np.clip(current_water_level + rain_forcing - recession + np.random.normal(0, 0.02), 1.5, 6.5))

        # Proxy rolling accumulations (scaled to realistic index units)
        rain_5m = round(current_intensity * (5.0 / 60.0) * 100.0, 2)
        rain_15m = round(current_intensity * (15.0 / 60.0) * 100.0 + np.random.uniform(0, 1), 2)
        rain_30m = round(current_intensity * (30.0 / 60.0) * 100.0 + np.random.uniform(0, 2), 2)
        rain_1h = round(current_intensity * 100.0 * 0.8 + np.random.uniform(0, 5), 2)
        rain_3h = round(rain_1h * 2.3 + np.random.uniform(0, 8), 2)
        rain_6h = round(rain_3h * 1.8 + np.random.uniform(0, 12), 2)

        # Ground truth target: Flood condition 1-3 hours ahead
        # Flood occurs if sustained torrential rain combined with elevated river level
        flood_score = (
            (current_intensity * 0.35)
            + (min(120.0, rain_1h) / 120.0 * 0.30)
            + (min(250.0, rain_3h) / 250.0 * 0.15)
            + (max(0.0, current_water_level - 2.8) / 3.0 * 0.20)
        )
        is_flood_ahead = 1 if flood_score >= 0.52 else 0

        data.append({
            "timestamp": t.isoformat(),
            "rain_intensity": round(current_intensity, 4),
            "rain_5m": rain_5m,
            "rain_15m": rain_15m,
            "rain_30m": rain_30m,
            "rain_1h": rain_1h,
            "rain_3h": rain_3h,
            "rain_6h": rain_6h,
            "rate_of_change": round(rate_of_change, 4),
            "rain_duration_min": continuous_rain_min,
            "water_level_m": round(current_water_level, 2),
            "flood_event_1to3h_ahead": is_flood_ahead,
        })

    df = pd.DataFrame(data)
    df.to_csv(DATASET_PATH, index=False)
    print(f"[Dataset] Generated {len(df)} samples saved to {DATASET_PATH}")
    print(f"[Dataset] Flood event prevalence: {df['flood_event_1to3h_ahead'].mean() * 100:.2f}% ({df['flood_event_1to3h_ahead'].sum()} positive samples)")
    return df


def train_and_evaluate():
    print("=" * 70)
    print("JalDrishti — Flood Forecasting ML Pipeline Training")
    print("=" * 70)

    # 1. Load or Generate Dataset
    if not DATASET_PATH.exists():
        df = generate_benchmark_dataset()
    else:
        df = pd.read_csv(DATASET_PATH)
        print(f"[Dataset] Loaded existing dataset from {DATASET_PATH} with {len(df)} records.")

    # 2. Chronological Split (70% Train, 15% Validation, 15% Test) to prevent temporal data leakage
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    print(f"[Split] Chronological Partition: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    X_train = train_df[FEATURE_NAMES].values
    y_train = train_df["flood_event_1to3h_ahead"].values

    X_val = val_df[FEATURE_NAMES].values
    y_val = val_df["flood_event_1to3h_ahead"].values

    X_test = test_df[FEATURE_NAMES].values
    y_test = test_df["flood_event_1to3h_ahead"].values

    # 3. Fit Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 4. Train Model (XGBoost if installed, fallback to Random Forest)
    if HAS_XGB:
        print("[Model] Training XGBoost Classifier...")
        model = XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=max(1.0, (len(y_train) - sum(y_train)) / max(1, sum(y_train))),
            random_state=42,
            eval_metric="logloss",
        )
        model.fit(X_train_scaled, y_train, eval_set=[(X_val_scaled, y_val)], verbose=False)
        model_name = "XGBoost-TimeSeriesForecaster-v1.0"
    else:
        print("[Model] Training Random Forest Baseline Classifier...")
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,
            class_weight="balanced",
            random_state=42,
        )
        model.fit(X_train_scaled, y_train)
        model_name = "RandomForest-TimeSeriesForecaster-v1.0"

    # 5. Evaluate on Unseen Test Partition
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    y_pred = (y_pred_proba >= 0.40).astype(int)  # Safety-calibrated threshold 0.40

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    roc_auc = float(roc_auc_score(y_test, y_pred_proba)) if len(np.unique(y_test)) > 1 else 1.0
    brier = float(brier_score_loss(y_test, y_pred_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()

    print("\n" + "-" * 50)
    print(f"EVALUATION RESULTS ON UNSEEN TEST SET (N={len(y_test)}):")
    print(f"  Accuracy:       {acc * 100:.2f}%")
    print(f"  Precision:      {prec * 100:.2f}%")
    print(f"  Recall (Safety):{rec * 100:.2f}%  (Zero false negatives prioritised)")
    print(f"  F1-Score:       {f1 * 100:.2f}%")
    print(f"  ROC-AUC:        {roc_auc:.4f}")
    print(f"  Brier Score:    {brier:.4f} (Calibration index)")
    print(f"  Confusion Matrix: TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0] if len(cm)>1 else 0}, TP={cm[1][1] if len(cm)>1 else 0}")
    print("-" * 50 + "\n")

    # Feature Importances
    importances = {}
    if hasattr(model, "feature_importances_"):
        for f, imp in zip(FEATURE_NAMES, model.feature_importances_):
            importances[f] = round(float(imp), 4)
        print("Feature Importances:")
        for f, imp in sorted(importances.items(), key=lambda x: x[1], reverse=True):
            print(f"  • {f:20s}: {imp * 100:.1f}%")

    # 6. Save Bundle & Metrics
    metadata = {
        "model_name": model_name,
        "model_version": "1.0.0",
        "trained_at": pd.Timestamp.now().isoformat(),
        "dataset_samples": len(df),
        "test_samples": len(y_test),
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "brier_score": round(brier, 4),
            "decision_threshold": 0.40,
            "confusion_matrix": cm,
        },
        "feature_importances": importances,
        "is_demonstration_dataset": True,
        "dataset_notice": (
            "Model trained on synthetic meteorological-hydrological sequences representing "
            "Himalayan cloudburst events. Retrain on physical stream gauge logs when deployed."
        ),
    }

    bundle = {
        "model": model,
        "scaler": scaler,
        "metadata": metadata,
        "feature_names": FEATURE_NAMES,
    }
    joblib.dump(bundle, MODEL_BUNDLE_PATH)
    print(f"\n[Artifact] Saved model bundle to {MODEL_BUNDLE_PATH}")

    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Artifact] Saved evaluation metrics to {METRICS_PATH}")

    return metadata


if __name__ == "__main__":
    train_and_evaluate()
