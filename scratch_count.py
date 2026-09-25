import pandas as pd
from pathlib import Path

df = pd.read_parquet("D:/Github/JAL_DRISTI_TEAM_READY_2026-09/data/processed/ml/target_dataset_v2.parquet")
print("Target counts:")
print(df['target'].value_counts())
print("\nTotal rows:", len(df))
