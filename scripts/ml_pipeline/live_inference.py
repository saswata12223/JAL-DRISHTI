import pandas as pd
import numpy as np
import pickle
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = REPO_ROOT / "models"
MODEL_PATH = MODELS_DIR / "live_anomaly_v1.pkl"
THRESHOLDS_PATH = MODELS_DIR / "live_anomaly_thresholds.json"
OUTPUT_DIR = REPO_ROOT / "data" / "processed" / "ml"
OUTPUT_PATH = OUTPUT_DIR / "live_anomaly_states.parquet"

def run_live_inference(lookback_days=7):
    # Phase 16 Safety Gate
    logger.error("LIVE_ML_INFERENCE = BLOCKED")
    logger.error("Phase 16 audit confirmed required live telemetry sources are NOT_CONFIGURED.")
    logger.error("Inference cannot proceed without genuine, verified feature data.")
    return
    
    logger.info("Loading model and thresholds...")
    with open(MODEL_PATH, 'rb') as f:
        iso = pickle.load(f)
    
    with open(THRESHOLDS_PATH, 'r') as f:
        thresholds = json.load(f)
        
    logger.info("Loading telemetry for inference window...")
    rain_files = list(Path(REPO_ROOT / "data" / "processed" / "clean" / "v1.0" / "Data_Research").rglob("rainfall_tel_hr_*.csv"))
    dfs_rain = []
    for f in rain_files:
        df_r = pd.read_csv(f, usecols=['Station', 'Data Acquisition Time', 'Telemetry Hourly Rainfall (mm)'])
        dfs_rain.append(df_r)
    df_rain = pd.concat(dfs_rain, ignore_index=True)
    df_rain['datetime'] = pd.to_datetime(df_rain['Data Acquisition Time'], format="%d-%m-%Y %H:%M", errors='coerce').dt.tz_localize(None)
    df_rain = df_rain.dropna(subset=['datetime']).rename(columns={'Station': 'station_id', 'datetime': 'prediction_timestamp', 'Telemetry Hourly Rainfall (mm)': 'rain_1h'})
    df_rain = df_rain[['station_id', 'prediction_timestamp', 'rain_1h']].sort_values(['station_id', 'prediction_timestamp'])
    
    # Filter to last 7 days
    latest_time = df_rain['prediction_timestamp'].max()
    start_time = latest_time - pd.Timedelta(days=lookback_days)
    logger.info(f"Filtering inference data from {start_time} to {latest_time} (lookback={lookback_days} days)")
    
    df_rain_recent = df_rain[df_rain['prediction_timestamp'] >= start_time].copy()
    
    import sys
    sys.path.append(str(REPO_ROOT))
    from scripts.ml_pipeline.live_feature_pipeline import generate_canonical_features
    
    logger.info("Loading station metadata and static/dynamic features...")
    stations_df = pd.read_parquet(REPO_ROOT / "data" / "processed" / "standardized" / "standardized_weather_stations.parquet")
    stations_df['latitude'] = pd.to_numeric(stations_df['latitude'], errors='coerce')
    stations_df['longitude'] = pd.to_numeric(stations_df['longitude'], errors='coerce')
    
    static_nc_path = str(REPO_ROOT / "data" / "processed" / "standardized" / "unified_static_features.nc")
    dyn_nc_path = str(REPO_ROOT / "data" / "processed" / "standardized" / "standardized_dynamic_atmosphere.nc")
    
    logger.info("Generating features for inference window...")
    df_features = generate_canonical_features(df_rain_recent, stations_df, static_nc_path, dyn_nc_path)
    df_features['prediction_timestamp'] = pd.to_datetime(df_features['prediction_timestamp']).dt.tz_localize(None)
    
    # Ensure all target stations are present by right joining on df_rain_recent
    df_inference = pd.merge(df_rain_recent[['station_id', 'prediction_timestamp']], df_features, on=['station_id', 'prediction_timestamp'], how='left')
    
    # Impute missing with 0 to match training baseline
    df_inference = df_inference.fillna(0)
    
    feature_cols = ['rain_1h', 'rain_3h', 'rain_6h', 'rain_12h', 'rain_24h', 'surface_soil_moisture', 'elevation', 'slope', 'twi']
    X_infer = df_inference[feature_cols].copy()
    
    logger.info(f"Running inference on {len(X_infer)} samples...")
    scores = iso.decision_function(X_infer)
    
    df_inference['anomaly_score'] = scores
    df_inference['is_anomaly_1pct'] = (scores <= thresholds['top_1_pct_threshold']).astype(int)
    df_inference['is_anomaly_5pct'] = (scores <= thresholds['top_5_pct_threshold']).astype(int)
    df_inference['is_anomaly_10pct'] = (scores <= thresholds['top_10_pct_threshold']).astype(int)
    
    logger.info(f"Found {df_inference['is_anomaly_1pct'].sum()} points at 1% threshold.")
    logger.info(f"Found {df_inference['is_anomaly_5pct'].sum()} points at 5% threshold.")
    logger.info(f"Found {df_inference['is_anomaly_10pct'].sum()} points at 10% threshold.")
    
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Saving inference results to {OUTPUT_PATH}...")
    df_inference.to_parquet(OUTPUT_PATH, index=False)
    
    logger.info("Done.")

if __name__ == "__main__":
    run_live_inference(lookback_days=7)
