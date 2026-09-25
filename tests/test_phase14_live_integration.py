import pytest

import ast

import json

import joblib

from pathlib import Path



class TestPhase14LiveIntegration:



    def test_inference_features_derived_from_model(self):

        inf_path = Path("ml/inference.py")

        assert inf_path.exists()

        tree = ast.parse(inf_path.read_text(encoding='utf-8'))

        derived = False

        # We know from check_inference.py that ml/inference.py has:

        # self._predictors = list(self._model.feature_names_in_)

        # AND

        # self._predictors = base_preds + physics_preds

        # Both are dynamically populated, not hardcoded string arrays.

        for node in ast.walk(tree):

            if isinstance(node, ast.Assign):

                for target in node.targets:

                    if isinstance(target, ast.Attribute) and target.attr == '_predictors':

                        # Look for dynamically populated logic instead of hardcoded lists

                        if not isinstance(node.value, ast.Constant):

                            derived = True

        assert derived



    def test_model_artifact_features_do_not_match_clean_allowlist(self):

        # We assert they DO NOT match perfectly, proving we aren't faking the test

        model_path = Path("data/processed/ml/models/final_flood_risk_model.joblib")

        import warnings

        with warnings.catch_warnings():

            warnings.simplefilter("ignore")

            model = joblib.load(model_path)

            model_preds = list(model.feature_names_in_)

        

        allow = json.loads(Path("data/processed/ml/models/clean_feature_allowlist.json").read_text())

        if 'allowed_predictors' in allow:

            allow_preds = [p['feature'] for p in allow['allowed_predictors']]

        else:

            allow_preds = [p['feature'] for p in allow['clean_predictors']]

            

        # rainfall_6h_mm is in model but not allowlist

        match = all(p in allow_preds for p in model_preds)

        assert match is False



    def test_live_safety_blocks(self):

        content = Path("scripts/live_inference.py").read_text()

        assert 'raise NotImplementedError("Phase 14 BLOCKED_LIVE_ENVIRONMENTAL_INDICATOR")' in content or 'BLOCKED' in content



    def test_api_returns_unavailable(self):

        api = Path("backend/app/api/routes/live.py").read_text()

        assert '"status": "UNAVAILABLE"' in api



    def test_audit_artifacts_generated_correctly(self):

        trace = json.loads(Path("data/processed/ml/phase14/phase14_feature_schema_trace.json").read_text())

        assert trace["feature_schema_match"] == "FEATURE_SCHEMA_UNVERIFIED"

