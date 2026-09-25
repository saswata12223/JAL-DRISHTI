import os
import json
import ast
import joblib
from pathlib import Path

def get_ast_predictors(inference_path):
    if not Path(inference_path).exists():
        return "UNVERIFIED"
    tree = ast.parse(Path(inference_path).read_text(encoding='utf-8'))
    predictors = "UNVERIFIED"
    # Find assignments to _predictors
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Attribute) and target.attr == '_predictors':
                    if isinstance(node.value, ast.List):
                        try:
                            # E.g., ['rainfall_1h_mm', ...]
                            predictors = [elt.s if isinstance(elt, ast.Str) else elt.value for elt in node.value.elts]
                        except:
                            pass
                    elif isinstance(node.value, ast.Call):
                        # E.g., list(self._model.feature_names_in_)
                        if isinstance(node.value.func, ast.Name) and node.value.func.id == 'list':
                            predictors = "DERIVED_FROM_MODEL"
    return predictors

def main():
    os.makedirs('data/processed/ml/phase14', exist_ok=True)
    os.makedirs('docs/audit', exist_ok=True)
    
    # 1. Feature parse
    inf_path = "ml/inference.py"
    ast_preds = get_ast_predictors(inf_path)
    
    model_path = Path("data/processed/ml/models/final_flood_risk_model.joblib")
    if model_path.exists():
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = joblib.load(model_path)
            if hasattr(model, 'feature_names_in_'):
                model_preds = list(model.feature_names_in_)
            else:
                model_preds = "UNVERIFIED"
    else:
        model_preds = "UNVERIFIED"
        
    allowlist_path = Path("data/processed/ml/models/clean_feature_allowlist.json")
    allowlist_preds = "UNVERIFIED"
    if allowlist_path.exists():
        with open(allowlist_path, 'r') as f:
            allow = json.load(f)
            if 'allowed_predictors' in allow:
                allowlist_preds = [p['feature'] for p in allow['allowed_predictors']]
            elif 'clean_predictors' in allow:
                allowlist_preds = [p['feature'] for p in allow['clean_predictors']]
                
    schema_status = "FEATURE_SCHEMA_UNVERIFIED"
    if ast_preds == "DERIVED_FROM_MODEL" and isinstance(model_preds, list):
        if all(p in allowlist_preds for p in model_preds):
            schema_status = "VERIFIED"
    
    schema_trace = {
        "ast_predictors": ast_preds,
        "model_feature_names_in": model_preds,
        "allowlist_features_count": len(allowlist_preds) if isinstance(allowlist_preds, list) else 0,
        "feature_schema_match": schema_status,
        "production_features": model_preds if isinstance(model_preds, list) else "UNVERIFIED"
    }
    with open('data/processed/ml/phase14/phase14_feature_schema_trace.json', 'w') as f:
        json.dump(schema_trace, f, indent=2)

    # 2. Registry trace
    reg_path = "app/core/data_source_registry.py"
    reg_status = "UNVERIFIED"
    if Path(reg_path).exists():
        content = Path(reg_path).read_text(encoding='utf-8')
        if "DataSourceRegistry" in content:
            reg_status = "NOT_CONFIGURED"  # Derived logically since no live API exists yet
            
    with open('data/processed/ml/phase14/phase14_api_integration_status.json', 'w') as f:
        json.dump({"sources": reg_status, "availability": reg_status}, f, indent=2)

    # 3. Write markdown
    md = f"""# PHASE 14 AUDIT
    
LIVE STATUS: BLOCKED_LIVE_ENVIRONMENTAL_INDICATOR
FEATURE SCHEMA: {schema_status}
SOURCES: {reg_status}
"""
    with open('docs/audit/PHASE14_LIVE_DATA_INTEGRATION.md', 'w') as f:
        f.write(md)

if __name__ == '__main__':
    main()
