import joblib
from pathlib import Path
import ast

model_path = Path('data/processed/ml/models/final_flood_risk_model.joblib')
model = joblib.load(model_path)
print("Model feature_names_in_:")
if hasattr(model, 'feature_names_in_'):
    print(list(model.feature_names_in_))
else:
    print("None")

inference_path = Path('ml/inference.py')
content = inference_path.read_text()
tree = ast.parse(content)

for node in ast.walk(tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id == '_predictors':
                if isinstance(node.value, ast.List):
                    print("Inference _predictors:")
                    print([elt.s if isinstance(elt, ast.Str) else elt.value for elt in node.value.elts])
