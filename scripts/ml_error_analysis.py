import json
import logging
import os
from pathlib import Path

import pandas as pd
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, roc_auc_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ML_Error_Analysis")

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
PROC_DIR = DATA_DIR / "processed"
ML_DIR = PROC_DIR / "ml"

def main():
    logger.info("Starting ML Error Analysis...")
    
    preds_file = ML_DIR / "flood_risk_predictions.parquet"
    if not preds_file.exists():
        logger.error(f"Predictions file not found: {preds_file}. Ensure train_flood_model.py has run.")
        return
        
    df = pd.read_parquet(preds_file)
    logger.info(f"Loaded {len(df)} predictions.")
    
    # We will analyze out-of-fold and test predictions if possible.
    # In flood_risk_predictions.parquet, 'split_group' may be present.
    # If not, we just analyze the whole set (or what's available).
    
    if "split_group" in df.columns:
        eval_df = df[df["split_group"].isin(["VALIDATION", "TEST"])].copy()
        if len(eval_df) == 0:
            eval_df = df.copy()
            eval_source = "ENTIRE_DATASET (No test/val splits found)"
        else:
            eval_source = "OOF_AND_TEST_SETS"
    else:
        eval_df = df.copy()
        eval_source = "ENTIRE_DATASET"
        
    logger.info(f"Evaluation source: {eval_source} ({len(eval_df)} samples)")
    
    y_true = eval_df["actual_label"].values
    y_prob = eval_df["prediction_probability"].values
    threshold = eval_df["ml_decision_threshold"].iloc[0] if "ml_decision_threshold" in eval_df.columns else 0.40
    y_pred = (y_prob >= threshold).astype(int)
    
    # Global metrics
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    tn, fp, fn, tp = cm
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_true, y_prob)
    except:
        roc_auc = 0.5
        
    global_metrics = {
        "evaluation_source": eval_source,
        "total_samples": len(eval_df),
        "TP": int(tp), "TN": int(tn), "FP": int(fp), "FN": int(fn),
        "precision": float(prec), "recall": float(rec), "f1_score": float(f1),
        "false_positive_rate": float(fpr), "false_negative_rate": float(fnr),
        "roc_auc": float(roc_auc)
    }
    
    # Breakdown by spatial grouping (district)
    district_analysis = {}
    if "district" in eval_df.columns:
        for dist in eval_df["district"].unique():
            dist_df = eval_df[eval_df["district"] == dist]
            dy_true = dist_df["actual_label"].values
            dy_prob = dist_df["prediction_probability"].values
            dy_pred = (dy_prob >= threshold).astype(int)
            
            d_cm = confusion_matrix(dy_true, dy_pred, labels=[0, 1]).ravel()
            if len(d_cm) == 4:
                d_tn, d_fp, d_fn, d_tp = d_cm
            else:
                continue
                
            district_analysis[str(dist)] = {
                "samples": len(dist_df),
                "TP": int(d_tp), "TN": int(d_tn), "FP": int(d_fp), "FN": int(d_fn)
            }
            
    report = {
        "global_metrics": global_metrics,
        "spatial_breakdown_by_district": district_analysis
    }
    
    out_file = ML_DIR / "error_analysis_report.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    logger.info(f"Error analysis completed. Report saved to {out_file}")

if __name__ == "__main__":
    main()
