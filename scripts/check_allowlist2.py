import json
with open('data/processed/ml/models/clean_feature_allowlist.json', 'r') as f:
    data = json.load(f)
    print(data['clean_predictors'])
