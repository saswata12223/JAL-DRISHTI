"""

Recomputes all model predictions across the dataset using the promoted Phase 4 Candidate Model.

Updates data/processed/ml/flood_risk_predictions.parquet and .csv.

"""



import sys

from pathlib import Path

import pandas as pd

import numpy as np



PROJECT_DIR = Path(__file__).resolve().parent.parent

if str(PROJECT_DIR) not in sys.path:

    sys.path.insert(0, str(PROJECT_DIR))



from ml.inference import FloodRiskInferenceEngine



def main():

    print("Recomputing predictions across feature matrix using promoted Phase 4 model...")

    engine = FloodRiskInferenceEngine()

    print(f"Engine loaded with {len(engine.predictor_names)} predictors: {engine.predictor_names[:5]}...")



    features_path = PROJECT_DIR / "data" / "processed" / "ml" / "flood_ml_features_clean.parquet"

    if not features_path.exists():

        features_path = PROJECT_DIR / "data" / "processed" / "ml" / "flood_ml_features.parquet"



    print(f"Reading features from {features_path}...")

    df_features = pd.read_parquet(features_path)

    print(f"Feature dataset shape: {df_features.shape}")



    print("Running batch prediction...")

    df_preds = engine.predict_batch(df_features)



    # Ensure required columns exist

    df_preds["prediction_probability"] = df_preds["prediction_probability"].round(4)



    out_pq = PROJECT_DIR / "data" / "processed" / "ml" / "flood_risk_predictions.parquet"

    out_csv = PROJECT_DIR / "data" / "processed" / "ml" / "flood_risk_predictions.csv"



    print(f"Writing updated predictions to {out_pq}...")

    df_preds.to_parquet(out_pq, index=False)

    print(f"Writing updated predictions to {out_csv}...")

    df_preds.to_csv(out_csv, index=False)



    print("\nSummary Statistics of Recomputed Predictions:")

    print("Probability Range:", df_preds["prediction_probability"].min(), "to", df_preds["prediction_probability"].max())

    print("Risk Class Counts:")

    print(df_preds["ml_risk_class"].value_counts())



    # Check historical benchmark event predictions

    hist_mask = df_preds["sample_type"] == "historical_event_benchmark"

    if hist_mask.any():

        print("\nHistorical Event Benchmark Predictions (Phase 4 Promoted Model):")

        hist_df = df_preds[hist_mask][["sample_id", "district", "rainfall_1h_mm", "prediction_probability", "ml_risk_class"]]

        print(hist_df.to_string())



if __name__ == "__main__":

    main()
