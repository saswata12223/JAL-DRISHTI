import json
import logging
import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Feature_Drift_Monitor")

PROJECT_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_DIR / "data"
PROC_DIR = DATA_DIR / "processed"
ML_DIR = PROC_DIR / "ml"

def monitor_drift(ref_df: pd.DataFrame, inf_df: pd.DataFrame, features: list) -> list:
    results = []
    for feat in features:
        if feat not in ref_df.columns:
            continue
        
        ref_vals = ref_df[feat].dropna().values
        
        if feat in inf_df.columns:
            inf_vals = inf_df[feat].dropna().values
        else:
            inf_vals = np.array([])
            
        ref_mean = float(np.mean(ref_vals)) if len(ref_vals) > 0 else 0.0
        ref_std = float(np.std(ref_vals)) if len(ref_vals) > 0 else 0.0
        
        if len(inf_vals) > 0:
            inf_mean = float(np.mean(inf_vals))
            inf_std = float(np.std(inf_vals))
            
            # Kolmogorov-Smirnov test
            stat, p_val = ks_2samp(ref_vals, inf_vals)
            drift_detected = bool(p_val < 0.05)
            
            results.append({
                "feature": feat,
                "reference_mean": ref_mean,
                "reference_std": ref_std,
                "current_mean": inf_mean,
                "current_std": inf_std,
                "ks_statistic": float(stat),
                "p_value": float(p_val),
                "threshold_p_value": 0.05,
                "drift_status": "DRIFT_DETECTED" if drift_detected else "STABLE"
            })
        else:
            results.append({
                "feature": feat,
                "reference_mean": ref_mean,
                "reference_std": ref_std,
                "current_mean": None,
                "current_std": None,
                "ks_statistic": None,
                "p_value": None,
                "threshold_p_value": 0.05,
                "drift_status": "NO_INFERENCE_DATA"
            })
            
    return results

def main():
    parser = argparse.ArgumentParser(description="Monitor feature drift between training and inference distributions.")
    parser.add_argument("--inference_path", type=str, default=None, help="Path to the recent inference dataset (parquet/csv).")
    args = parser.parse_args()
    
    logger.info("Starting Feature Drift Monitor...")
    
    ref_path = ML_DIR / "flood_ml_features_clean.parquet"
    if not ref_path.exists():
        ref_path = ML_DIR / "flood_ml_features.parquet"
        
    if not ref_path.exists():
        logger.error(f"Reference dataset not found at {ref_path}")
        return
        
    ref_df = pd.read_parquet(ref_path)
    logger.info(f"Loaded reference (training) dataset: {len(ref_df)} samples.")
    
    genuine_live_data_available = False
    inf_df = pd.DataFrame()
    
    if args.inference_path and Path(args.inference_path).exists():
        try:
            inf_df = pd.read_parquet(args.inference_path) if args.inference_path.endswith(".parquet") else pd.read_csv(args.inference_path)
            genuine_live_data_available = True
            logger.info(f"Loaded inference dataset: {len(inf_df)} samples.")
        except Exception as e:
            logger.error(f"Failed to load inference data from {args.inference_path}: {e}")
    else:
        logger.warning("No live inference dataset provided or found. Live drift cannot currently be measured.")
        logger.info("The monitoring framework will still record reference statistics.")
        
    key_features_to_monitor = [
        "rainfall_30min_mm",
        "rainfall_1h_mm",
        "rainfall_3h_mm",
        "surface_soil_moisture_vol",
        "soil_saturation_index",
        "scs_direct_runoff_q_mm"
    ]
    
    drift_results = monitor_drift(ref_df, inf_df, key_features_to_monitor)
    
    report = {
        "genuine_live_data_available": genuine_live_data_available,
        "reference_dataset": str(ref_path),
        "inference_dataset": args.inference_path if args.inference_path else "None",
        "drift_analysis": drift_results
    }
    
    out_file = ML_DIR / "feature_drift_report.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    logger.info(f"Drift report generated at {out_file}")

if __name__ == "__main__":
    main()
