"""
FlashFloodAI — Operational Machine Learning Inference Engine (PPT Upgraded)

Provides high-performance, thread-safe probability prediction, risk level
classification, and SCS-CN physics calculation for live and batch telemetry.
Supports XGBoost (Champion), Random Forest (Baseline), and PyTorch models.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
import torch

PROJECT_DIR = Path(__file__).resolve().parent.parent
ML_DIR = PROJECT_DIR / "data" / "processed" / "ml"
MODELS_DIR = ML_DIR / "models"
CHAMPION_MODEL_PATH = MODELS_DIR / "final_flood_risk_model.joblib"
BASELINE_MODEL_PATH = MODELS_DIR / "random_forest_baseline.joblib"
SCALER_PATH = MODELS_DIR / "feature_scaler.joblib"
ALLOWLIST_PATH = ML_DIR / "model_feature_allowlist.json"


def classify_risk(prob: float) -> str:
    """Categorizes continuous probability into discrete risk level."""
    if prob < 0.20:
        return "LOW"
    elif prob < 0.40:
        return "MODERATE"
    elif prob < 0.70:
        return "HIGH"
    else:
        return "EXTREME"


class FloodRiskInferenceEngine:
    """Production inference engine loading upgraded PPT champion model and physics layer."""

    def __init__(self, model_path: Path = CHAMPION_MODEL_PATH, allowlist_path: Path = ALLOWLIST_PATH):
        self.model_path = model_path
        self.allowlist_path = allowlist_path
        self._model = None
        self._scaler = None
        self._predictors = None
        self._load_assets()

    def _load_assets(self):
        if not self.model_path.exists():
            raise FileNotFoundError(f"Missing serialized model: {self.model_path}")
        if not self.allowlist_path.exists():
            raise FileNotFoundError(f"Missing predictor allowlist: {self.allowlist_path}")

        self._model = joblib.load(self.model_path)
        if SCALER_PATH.exists():
            self._scaler = joblib.load(SCALER_PATH)

        with open(self.allowlist_path, "r", encoding="utf-8") as f:
            allowlist = json.load(f)
        base_preds = [p["feature"] for p in allowlist["allowed_predictors"]]
        physics_preds = [
            "scs_potential_retention_s_mm",
            "scs_initial_abstraction_ia_mm",
            "scs_direct_runoff_q_mm",
            "scs_peak_runoff_potential",
        ]
        self._predictors = base_preds + physics_preds

    @property
    def predictor_names(self) -> List[str]:
        return list(self._predictors)

    def compute_scs_cn(self, feature_dict: Dict[str, Any]) -> Dict[str, float]:
        """Calculates SCS-CN runoff depth Q and potential retention S."""
        lc_class = int(feature_dict.get("landcover_class", 10))
        cn_map = {10: 60.0, 20: 68.0, 30: 74.0, 40: 78.0, 50: 92.0, 60: 85.0, 70: 90.0, 80: 100.0, 90: 85.0, 100: 70.0}
        cn_base = cn_map.get(lc_class, 75.0)

        ssi = float(feature_dict.get("soil_saturation_index", 0.80) or 0.80)
        if ssi >= 0.82:
            cn_adj = cn_base / (0.427 + 0.00573 * cn_base)
        elif ssi < 0.70:
            cn_adj = cn_base / (2.281 - 0.01281 * cn_base)
        else:
            cn_adj = cn_base
        cn_adj = max(40.0, min(98.0, cn_adj))

        S = (25400.0 / cn_adj) - 254.0
        Ia = 0.20 * S
        P = float(feature_dict.get("rainfall_1h_mm", 0.0) or 0.0)
        Q = ((P - Ia) ** 2) / (P - Ia + S + 1e-6) if P > Ia else 0.0

        slope_deg = float(feature_dict.get("slope_deg", 10.0) or 10.0)
        manning_n = float(feature_dict.get("mannings_roughness_n", 0.05) or 0.05)
        peak_q = Q * np.sin(np.radians(slope_deg)) * (1.0 - manning_n)

        return {
            "scs_potential_retention_s_mm": round(S, 3),
            "scs_initial_abstraction_ia_mm": round(Ia, 3),
            "scs_direct_runoff_q_mm": round(Q, 3),
            "scs_peak_runoff_potential": round(peak_q, 4),
        }

    def predict_sample(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Runs single-sample inference with dynamic SCS-CN physics calculation."""
        full_feat = dict(feature_dict)
        physics = self.compute_scs_cn(full_feat)
        full_feat.update(physics)

        data_dict = {col: [float(full_feat.get(col, 0.0) if full_feat.get(col) is not None else 0.0)] for col in self._predictors}
        df_single = pd.DataFrame(data_dict)

        if self._scaler is not None:
            X_scaled = self._scaler.transform(df_single)
            prob = float(self._model.predict_proba(X_scaled)[0, 1])
        else:
            prob = float(self._model.predict_proba(df_single)[0, 1])

        risk_class = classify_risk(prob)

        return {
            "probability": round(prob, 4),
            "risk_class": risk_class,
            "decision_threshold": 0.40,
            "is_alarm": bool(prob >= 0.40),
            "scs_direct_runoff_q_mm": physics["scs_direct_runoff_q_mm"],
            "scs_potential_retention_s_mm": physics["scs_potential_retention_s_mm"],
        }

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Runs batch inference on a pandas DataFrame."""
        df_eval = df.copy()
        if "scs_direct_runoff_q_mm" not in df_eval.columns:
            # Add physics
            cn_map = {10: 60.0, 20: 68.0, 30: 74.0, 40: 78.0, 50: 92.0, 60: 85.0, 70: 90.0, 80: 100.0, 90: 85.0, 100: 70.0}
            cn_base = df_eval["landcover_class"].map(cn_map).fillna(75.0)
            ssi = df_eval["soil_saturation_index"].fillna(0.8)
            cn_adj = np.where(ssi >= 0.82, cn_base / (0.427 + 0.00573 * cn_base),
                     np.where(ssi < 0.70, cn_base / (2.281 - 0.01281 * cn_base), cn_base))
            cn_adj = np.clip(cn_adj, 40.0, 98.0)
            S = (25400.0 / cn_adj) - 254.0
            Ia = 0.20 * S
            P = df_eval["rainfall_1h_mm"].fillna(0.0)
            Q = np.where(P > Ia, ((P - Ia) ** 2) / (P - Ia + S + 1e-6), 0.0)
            slope_rad = np.radians(df_eval["slope_deg"].fillna(10.0))
            peak_q = Q * np.sin(slope_rad) * (1.0 - df_eval["mannings_roughness_n"].fillna(0.05))
            df_eval["scs_potential_retention_s_mm"] = S
            df_eval["scs_initial_abstraction_ia_mm"] = Ia
            df_eval["scs_direct_runoff_q_mm"] = Q
            df_eval["scs_peak_runoff_potential"] = peak_q

        X = df_eval.reindex(columns=self._predictors, fill_value=0.0).fillna(0.0)
        if self._scaler is not None:
            X_s = self._scaler.transform(X)
            probs = self._model.predict_proba(X_s)[:, 1]
        else:
            probs = self._model.predict_proba(X)[:, 1]

        risk_classes = [classify_risk(p) for p in probs]

        res = df.copy()
        res["prediction_probability"] = np.round(probs, 4)
        res["ml_risk_class"] = risk_classes
        res["is_alarm"] = probs >= 0.40
        return res
