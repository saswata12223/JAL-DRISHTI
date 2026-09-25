import pandas as pd
import numpy as np
import pickle
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
TARGET_PATH = REPO_ROOT / "data" / "processed" / "ml" / "target_dataset_v2.parquet"
MODELS_DIR = REPO_ROOT / "models"

def main():
    logger.info("Loading model and thresholds...")
    model_path = MODELS_DIR / "live_anomaly_v1.pkl"
    thresholds_path = MODELS_DIR / "live_anomaly_thresholds.json"
    
    with open(model_path, 'rb') as f:
        iso = pickle.load(f)
        
    with open(thresholds_path, 'r') as f:
        thresholds = json.load(f)

    logger.info("Loading target dataset V2 to extract 60 positive validation events...")
    df_target = pd.read_parquet(TARGET_PATH)
    positives = df_target[df_target['target'] == '1'].copy()
    
    logger.info(f"Loaded {len(positives)} confirmed positive events for retrospective validation.")
    if len(positives) == 0:
        logger.error("No positive events found. Exiting validation.")
        return

    # We need to construct the features for these positives.
    # Since we can't run the full spatial feature pipeline here easily without repeating 
    # train_anomaly_model.py exactly, we will temporarily re-run the generate_features
    # step on just these 60 events.
    from train_anomaly_model import load_data, generate_features
    
    _, df_rain = load_data()
    # Filter df_rain to only include stations and timestamps near our positives
    # But for simplicity, let's just generate all and merge
    df_features = generate_features(df_rain)
    
    df_merged = pd.merge(positives, df_features, on=['station_id', 'prediction_timestamp'], how='inner')
    df_merged = df_merged.fillna(0)
    
    feature_cols = ['rain_1h', 'rain_3h', 'rain_6h', 'rain_12h', 'rain_24h', 'surface_soil_moisture', 'elevation', 'slope', 'twi']
    X_pos = df_merged[feature_cols].copy()
    
    logger.info(f"Successfully joined features for {len(X_pos)} positive instances.")
    if len(X_pos) == 0:
        logger.warning("Intersection of positive events and available telemetry yielded 0 rows. This indicates telemetry data gaps during the exact hour of the flood events.")
        return

    scores = iso.decision_function(X_pos)
    
    # Analyze where the positives fall
    logger.info(f"--- RETROSPECTIVE POSITIVE VALIDATION ---")
    logger.info(f"Mean Anomaly Score for Positives: {np.mean(scores):.4f} (Baseline Mean: {thresholds['mean_score']:.4f})")
    
    t99 = thresholds['top_1_pct_threshold']
    t95 = thresholds['top_5_pct_threshold']
    t90 = thresholds['top_10_pct_threshold']
    
    # Remember: lower score = more anomalous
    extreme_count = np.sum(scores <= t99)
    high_count = np.sum((scores > t99) & (scores <= t95))
    elevated_count = np.sum((scores > t95) & (scores <= t90))
    normal_count = np.sum(scores > t90)
    
    logger.info(f"EXTREME Anomaly (Top 1%): {extreme_count} / {len(scores)} ({(extreme_count/len(scores))*100:.1f}%)")
    logger.info(f"HIGH Anomaly (Top 5%): {high_count} / {len(scores)} ({(high_count/len(scores))*100:.1f}%)")
    logger.info(f"ELEVATED Anomaly (Top 10%): {elevated_count} / {len(scores)} ({(elevated_count/len(scores))*100:.1f}%)")
    logger.info(f"NORMAL Anomaly: {normal_count} / {len(scores)} ({(normal_count/len(scores))*100:.1f}%)")
    
    total_anomalous = extreme_count + high_count + elevated_count
    logger.info(f"Total Positives falling in ANY anomalous state: {total_anomalous} / {len(scores)} ({(total_anomalous/len(scores))*100:.1f}%)")
    logger.info("NOTE: Since this is an unsupervised anomaly detector and NOT a supervised flood predictor, we do not expect 100% recall. Many floods occur without extreme weather anomalies locally recorded by sensors (e.g. upstream dam release, structural failure).")

if __name__ == "__main__":
    main()
