
import os
import time
import json
from pathlib import Path
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score, precision_score, recall_score, f1_score, confusion_matrix
import pickle

def run_training(repo_root, budget, manager, args):
    print("Running baseline training...")
    ml_dir = Path(repo_root) / "data" / "processed" / "ml"
    models_dir = ml_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    
    df = pd.read_parquet(ml_dir / "flood_risk_dataset.parquet")
    
    # Chronological Split
    df = df.sort_values('prediction_time')
    n = len(df)
    train_end = int(n * 0.6)
    val_end = int(n * 0.8)
    
    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]
    
    features = [c for c in df.columns if c not in ['event_id', 'prediction_time', 'target']]
    
    X_train = train_df[features]
    y_train = train_df['target']
    
    X_val = val_df[features]
    y_val = val_df['target']
    
    X_test = test_df[features]
    y_test = test_df['target']
    
    results = {}
    
    for name, model in [
        ("LogisticRegression", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ("RandomForestClassifier", RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced"))
    ]:
        model.fit(X_train, y_train)
        
        # Evaluate on validation
        y_val_pred = model.predict(X_val)
        y_val_prob = model.predict_proba(X_val)[:, 1]
        
        # Evaluate on test
        y_test_pred = model.predict(X_test)
        y_test_prob = model.predict_proba(X_test)[:, 1]
        
        cm = confusion_matrix(y_test, y_test_pred)
        tn, fp, fn, tp = cm.ravel() if len(cm.ravel()) == 4 else (0,0,0,0)
        
        metrics = {
            "ROC-AUC": roc_auc_score(y_test, y_test_prob) if len(set(y_test)) > 1 else 0,
            "Precision": precision_score(y_test, y_test_pred, zero_division=0),
            "Recall": recall_score(y_test, y_test_pred, zero_division=0),
            "F1": f1_score(y_test, y_test_pred, zero_division=0),
            "False Positives": int(fp),
            "False Negatives": int(fn)
        }
        
        results[name] = metrics
        
        # Save model
        with open(models_dir / f"{name}.pkl", "wb") as f:
            pickle.dump(model, f)
            
        with open(models_dir / f"{name}_metrics.json", "w") as f:
            json.dump(metrics, f, indent=2)
            
    # Write Final Report
    with open(ml_dir / "ML_FINAL_REPORT.md", "w") as f:
        f.write("# ML Final Report\n\n")
        f.write("## Dataset\n")
        f.write(f"- Rows: {n}\n")
        f.write(f"- Positives: {df['target'].sum()}\n")
        f.write(f"- Negatives: {n - df['target'].sum()}\n")
        f.write("\n## Models\n")
        for k, v in results.items():
            f.write(f"### {k}\n")
            for metric, val in v.items():
                f.write(f"- {metric}: {val}\n")
                
    with open(ml_dir / "ML_PROJECT_STATUS.md", "w") as f:
        f.write("ML READY — BASELINE TRAINED")
        
    return True
