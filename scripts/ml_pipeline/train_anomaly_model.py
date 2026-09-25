import pandas as pd
import numpy as np
import pickle
import json
import logging
from pathlib import Path
from sklearn.ensemble import IsolationForest

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
TARGET_PATH = REPO_ROOT / "data" / "processed" / "ml" / "target_dataset_v2.parquet"
MODELS_DIR = REPO_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

def load_data():
    logger.info("Loading target dataset V2...")
    df_target = pd.read_parquet(TARGET_PATH)
    df_target['prediction_timestamp'] = pd.to_datetime(df_target['prediction_timestamp']).dt.tz_localize(None)
    
    logger.info("Loading historical telemetry data for feature generation...")
    rain_files = list(Path(REPO_ROOT / "data" / "processed" / "clean" / "v1.0" / "Data_Research").rglob("rainfall_tel_hr_*.csv"))
    dfs_rain = []
    for f in rain_files:
        df_r = pd.read_csv(f, usecols=['Station', 'Data Acquisition Time', 'Telemetry Hourly Rainfall (mm)'])
        dfs_rain.append(df_r)
    df_rain = pd.concat(dfs_rain, ignore_index=True)
    df_rain['datetime'] = pd.to_datetime(df_rain['Data Acquisition Time'], format="%d-%m-%Y %H:%M", errors='coerce').dt.tz_localize(None)
    df_rain = df_rain.dropna(subset=['datetime']).rename(columns={'Station': 'station_id', 'datetime': 'prediction_timestamp', 'Telemetry Hourly Rainfall (mm)': 'rain_1h'})
    df_rain = df_rain[['station_id', 'prediction_timestamp', 'rain_1h']].sort_values(['station_id', 'prediction_timestamp'])
    
    return df_target, df_rain

def generate_features(df_rain):
    import sys
    sys.path.append(str(REPO_ROOT))
    from scripts.ml_pipeline.live_feature_pipeline import generate_canonical_features
    
    logger.info("Loading station metadata and static/dynamic features...")
    stations_df = pd.read_parquet(REPO_ROOT / "data" / "processed" / "standardized" / "standardized_weather_stations.parquet")
    stations_df['latitude'] = pd.to_numeric(stations_df['latitude'], errors='coerce')
    stations_df['longitude'] = pd.to_numeric(stations_df['longitude'], errors='coerce')
    
    static_nc_path = str(REPO_ROOT / "data" / "processed" / "standardized" / "unified_static_features.nc")
    dyn_nc_path = str(REPO_ROOT / "data" / "processed" / "standardized" / "standardized_dynamic_atmosphere.nc")
    
    logger.info("Generating canonical features...")
    df_features = generate_canonical_features(df_rain, stations_df, static_nc_path, dyn_nc_path)
    df_features['prediction_timestamp'] = pd.to_datetime(df_features['prediction_timestamp']).dt.tz_localize(None)
    return df_features

def main():
    df_target, df_rain = load_data()
    df_features = generate_features(df_rain)
    
    logger.info("Merging target and features...")
    df_merged = pd.merge(df_target, df_features, on=['station_id', 'prediction_timestamp'], how='left')
    
    # Impute missing values with 0 to match Phase 7D's baseline logic exactly
    df_merged = df_merged.fillna(0)
    
    # Filter out POSITIVE events (Baseline B: NEGATIVE + UNKNOWN)
    logger.info("Filtering out POSITIVE events for unsupervised training...")
    df_train = df_merged[df_merged['target'].isin(['0', 'UNKNOWN'])].copy()
    
    feature_cols = ['rain_1h', 'rain_3h', 'rain_6h', 'rain_12h', 'rain_24h', 'surface_soil_moisture', 'elevation', 'slope', 'twi']
    df_train_features = df_train[feature_cols].copy()
    
    logger.info(f"Training IsolationForest on {len(df_train_features)} samples...")
    iso = IsolationForest(contamination=0.01, random_state=42, n_jobs=-1)
    iso.fit(df_train_features)
    
    logger.info("Calculating anomaly scores to derive thresholds...")
    scores = iso.decision_function(df_train_features)
    
    # decision_function: lower score == more anomalous.
    # 1st percentile of the scores represents the threshold for the 1% most anomalous points.
    threshold_99 = np.percentile(scores, 1)  # Top 1% most anomalous
    threshold_95 = np.percentile(scores, 5)  # Top 5% most anomalous
    threshold_90 = np.percentile(scores, 10) # Top 10% most anomalous
    
    logger.info(f"Derived Thresholds (decision_function <= X):")
    logger.info(f"  Top 1% (99th percentile anomaly): {threshold_99:.4f}")
    logger.info(f"  Top 5% (95th percentile anomaly): {threshold_95:.4f}")
    logger.info(f"  Top 10% (90th percentile anomaly): {threshold_90:.4f}")
    
    model_path = MODELS_DIR / "live_anomaly_v1.pkl"
    logger.info(f"Saving model to {model_path}...")
    with open(model_path, 'wb') as f:
        pickle.dump(iso, f)
        
    thresholds_path = MODELS_DIR / "live_anomaly_thresholds.json"
    logger.info(f"Saving thresholds to {thresholds_path}...")
    with open(thresholds_path, 'w') as f:
        json.dump({
            "top_1_pct_threshold": float(threshold_99),
            "top_5_pct_threshold": float(threshold_95),
            "top_10_pct_threshold": float(threshold_90),
            "mean_score": float(np.mean(scores)),
            "std_score": float(np.std(scores))
        }, f, indent=2)
        
    logger.info("Done.")

if __name__ == "__main__":
    main()
