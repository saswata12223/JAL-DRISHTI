"""

FlashFloodAI Backend — Prediction & ML Serving Service

Interfaces directly with the verified Phase 6 FloodRiskInferenceEngine and SCS-CN physics layer.

"""



import logging

import sys

from pathlib import Path

from typing import Any, Dict



from app.config import settings

from app.schemas.predictions import LiveInferenceRequest, LiveInferenceResponse



# Project root (C:\JAL DRISTI) is the parent of this package chain:

# backend/app/services/prediction_service.py -> parents[3]

PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Ensure the `ml` package (ml/inference.py) is importable regardless of the

# working directory the backend is launched from (README runs `cd backend`).

if str(PROJECT_ROOT) not in sys.path:

    sys.path.insert(0, str(PROJECT_ROOT))



logger = logging.getLogger("FlashFloodAI.PredictionService")





class PredictionService:

    """Service wrapping ML model inference and SCS-CN physics layer."""



    _instance = None

    _engine = None



    @classmethod

    def get_instance(cls) -> "PredictionService":

        if cls._instance is None:

            cls._instance = cls()

        return cls._instance



    def __init__(self):

        self._load_engine()



    def _load_engine(self):

        try:

            from ml.inference import FloodRiskInferenceEngine

            self._engine = FloodRiskInferenceEngine()

            logger.info(f"Loaded ML Inference Engine with {len(self._engine.predictor_names)} predictors.")

        except Exception as e:

            logger.error(f"Error loading ML inference engine: {e}")

            self._engine = None



    @property

    def is_ready(self) -> bool:

        return self._engine is not None



    def predict(self, request: LiveInferenceRequest) -> LiveInferenceResponse:

        """Executes live prediction with dynamic SCS-CN physics calculation."""

        if self._engine is None:

            self._load_engine()

        if self._engine is None:

            raise RuntimeError("ML Inference Engine is not available.")



        feat_dict = request.model_dump()

        result = self._engine.predict_sample(feat_dict)



        return LiveInferenceResponse(

            probability=result["probability"],

            risk_class=result["risk_class"],

            decision_threshold=result.get("decision_threshold", 0.40),

            is_alarm=result.get("is_alarm", False),

            scs_direct_runoff_q_mm=result.get("scs_direct_runoff_q_mm", 0.0),

            scs_potential_retention_s_mm=result.get("scs_potential_retention_s_mm", 0.0),

            model_name="XGBoost_PPT_Upgraded",

            model_version="6.1.0",

        )
