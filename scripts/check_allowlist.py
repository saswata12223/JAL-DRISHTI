import json
with open('data/processed/ml/models/clean_feature_allowlist.json', 'r') as f:
    data = json.load(f)
    print(data.keys())
    if 'allowed_predictors' in data:
        print([p['feature'] for p in data['allowed_predictors']])
