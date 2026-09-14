"""

FlashFloodAI — Operational Machine Learning Inference Engine (Phase 4 / Phase 5 Upgraded)



Provides high-performance, thread-safe probability prediction, risk level

classification, and SCS-CN physics calculation for live and batch telemetry.

Supports Phase 4 Leakage-Controlled XGBoost (Candidate/Promoted Champion),

Random Forest (Baseline), and PyTorch models.

"""



import json

from pathlib import Path

from typing import Any, Dict, List, Optional, Union



import joblib

import numpy as np

import pandas as pd



PROJECT_DIR = Path(__file__).resolve().parent.parent

ML_DIR = PROJECT_DIR / "data" / "processed" / "ml"

MODELS_DIR = ML_DIR / "models"



# Promoted Phase 4 Candidate Artifacts (Physical 34-Predictor Contract)

CANDIDATE_MODEL_PATH = MODELS_DIR / "candidate_flood_risk_model_phase4.joblib"

CANDIDATE_PREPROCESSOR_PATH = MODELS_DIR / "candidate_feature_preprocessor_phase4.joblib"

CANDIDATE_ALLOWLIST_PATH = MODELS_DIR / "candidate_feature_allowlist_phase4.json"



# Legacy Fallback Paths

LEGACY_CHAMPION_MODEL_PATH = MODELS_DIR / "final_flood_risk_model.joblib"

LEGACY_SCALER_PATH = MODELS_DIR / "feature_scaler.joblib"

LEGACY_ALLOWLIST_PATH = ML_DIR / "model_feature_allowlist.json"





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

    """Production inference engine loading promoted Phase 4 candidate model and SCS-CN physics layer."""



    def __init__(

        self,

        model_path: Optional[Path] = None,

        allowlist_path: Optional[Path] = None,

        preprocessor_path: Optional[Path] = None,

    ):

        self.model_path = model_path or (

            CANDIDATE_MODEL_PATH if CANDIDATE_MODEL_PATH.exists() else LEGACY_CHAMPION_MODEL_PATH

        )

        self.allowlist_path = allowlist_path or (

            CANDIDATE_ALLOWLIST_PATH if CANDIDATE_ALLOWLIST_PATH.exists() else LEGACY_ALLOWLIST_PATH

        )

        self.preprocessor_path = preprocessor_path or (

            CANDIDATE_PREPROCESSOR_PATH if CANDIDATE_PREPROCESSOR_PATH.exists() else None

        )



        self._model = None

        self._preprocessor = None

        self._scaler = None

        self._predictors = None

        self._is_phase4 = False

        self._load_assets()



    def _load_assets(self):

        if not self.model_path.exists():

            raise FileNotFoundError(f"Missing serialized model: {self.model_path}")

        if not self.allowlist_path.exists():

            raise FileNotFoundError(f"Missing predictor allowlist: {self.allowlist_path}")



        self._model = joblib.load(self.model_path)



        # Check if loading Phase 4 candidate model format

        if self.preprocessor_path and self.preprocessor_path.exists():

            self._preprocessor = joblib.load(self.preprocessor_path)

            self._is_phase4 = True



        with open(self.allowlist_path, "r", encoding="utf-8") as f:

            allowlist = json.load(f)



        if "predictors" in allowlist:

            self._predictors = list(allowlist["predictors"])

            self._is_phase4 = True

        elif "allowed_predictors" in allowlist:

            base_preds = [p["feature"] for p in allowlist["allowed_predictors"]]

            physics_preds = [

                "scs_potential_retention_s_mm",

                "scs_initial_abstraction_ia_mm",

                "scs_direct_runoff_q_mm",

                "scs_peak_runoff_potential",

            ]

            self._predictors = base_preds + physics_preds



        if not self._is_phase4 and LEGACY_SCALER_PATH.exists():

            self._scaler = joblib.load(LEGACY_SCALER_PATH)



    @property

    def predictor_names(self) -> List[str]:

        return list(self._predictors)



    def compute_scs_cn(self, feature_dict: Dict[str, Any]) -> Dict[str, float]:

        """Calculates SCS-CN runoff depth Q and potential retention S."""

        lc_class = int(feature_dict.get("landcover_class", 10) or 10)

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



    def _transform_features(self, df_input: pd.DataFrame) -> np.ndarray:

        """Helper to reindex, impute, and scale features according to loaded model requirements."""

        df_reindexed = df_input.reindex(columns=self._predictors, fill_value=0.0).fillna(0.0)

        if self._is_phase4 and self._preprocessor:

            imputer = self._preprocessor["imputer"]

            scaler = self._preprocessor["scaler"]

            X_imp = imputer.transform(df_reindexed)

            return scaler.transform(X_imp)

        elif self._scaler is not None:

            return self._scaler.transform(df_reindexed)

        else:

            return df_reindexed.values



    def predict_sample(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:

        """Runs single-sample inference with dynamic SCS-CN physics calculation."""

        full_feat = dict(feature_dict)

        physics = self.compute_scs_cn(full_feat)

        full_feat.update(physics)



        data_dict = {

            col: [float(full_feat.get(col, 0.0) if full_feat.get(col) is not None else 0.0)]

            for col in self._predictors

        }

        df_single = pd.DataFrame(data_dict)

        X_scaled = self._transform_features(df_single)



        prob = float(self._model.predict_proba(X_scaled)[0, 1])

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

            cn_map = {10: 60.0, 20: 68.0, 30: 74.0, 40: 78.0, 50: 92.0, 60: 85.0, 70: 90.0, 80: 100.0, 90: 85.0, 100: 70.0}

            cn_base = df_eval["landcover_class"].map(cn_map).fillna(75.0) if "landcover_class" in df_eval.columns else pd.Series(75.0, index=df_eval.index)

            ssi = df_eval["soil_saturation_index"].fillna(0.8) if "soil_saturation_index" in df_eval.columns else pd.Series(0.8, index=df_eval.index)

            cn_adj = np.where(

                ssi >= 0.82,

                cn_base / (0.427 + 0.00573 * cn_base),

                np.where(ssi < 0.70, cn_base / (2.281 - 0.01281 * cn_base), cn_base),

            )

            cn_adj = np.clip(cn_adj, 40.0, 98.0)

            S = (25400.0 / cn_adj) - 254.0

            Ia = 0.20 * S

            P = df_eval["rainfall_1h_mm"].fillna(0.0) if "rainfall_1h_mm" in df_eval.columns else pd.Series(0.0, index=df_eval.index)

            Q = np.where(P > Ia, ((P - Ia) ** 2) / (P - Ia + S + 1e-6), 0.0)

            slope_deg = df_eval["slope_deg"].fillna(10.0) if "slope_deg" in df_eval.columns else pd.Series(10.0, index=df_eval.index)

            manning_n = df_eval["mannings_roughness_n"].fillna(0.05) if "mannings_roughness_n" in df_eval.columns else pd.Series(0.05, index=df_eval.index)

            slope_rad = np.radians(slope_deg)

            peak_q = Q * np.sin(slope_rad) * (1.0 - manning_n)

            df_eval["scs_potential_retention_s_mm"] = S

            df_eval["scs_initial_abstraction_ia_mm"] = Ia

            df_eval["scs_direct_runoff_q_mm"] = Q

            df_eval["scs_peak_runoff_potential"] = peak_q



        X_scaled = self._transform_features(df_eval)

        probs = self._model.predict_proba(X_scaled)[:, 1]

        risk_classes = [classify_risk(p) for p in probs]



        res = df.copy()

        res["prediction_probability"] = np.round(probs, 4)

        res["ml_risk_class"] = risk_classes

        res["is_alarm"] = probs >= 0.40

        return res
