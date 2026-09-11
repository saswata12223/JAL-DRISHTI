import xarray as xr
import pandas as pd
import numpy as np
from pathlib import Path

RAW_DIR = Path(r"C:\JAL DRISTI\data\raw")
OUTPUT_DIR = Path(r"C:\JAL DRISTI\data\processed")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

files = sorted(RAW_DIR.glob("*.nc4"))

if not files:
    raise FileNotFoundError("No GPM .nc4 files found.")

print(f"Found {len(files)} GPM files.")

records = []

for file in files:

    print(f"Processing: {file.name}")

    ds = xr.open_dataset(file)

    rain = ds["precipitation"]

    # Mean rainfall rate across the selected region
    mean_rate = float(rain.mean(skipna=True).values)

    # Maximum rainfall rate in the region
    max_rate = float(rain.max(skipna=True).values)

    # IMERG value is mm/hr.
    # Each file represents 30 minutes.
    mean_30min = mean_rate * 0.5
    max_30min = max_rate * 0.5

    timestamp = pd.to_datetime(ds.time.values[0])

    records.append({
        "time": timestamp,
        "mean_rainfall_rate_mm_hr": mean_rate,
        "max_rainfall_rate_mm_hr": max_rate,
        "mean_rainfall_30min_mm": mean_30min,
        "max_rainfall_30min_mm": max_30min
    })

    ds.close()

df = pd.DataFrame(records)

df = df.sort_values("time")

# --------------------------------------------------
# Rolling rainfall features
# --------------------------------------------------

# Each row represents 30 minutes.
df["rainfall_3h_mm"] = (
    df["mean_rainfall_30min_mm"]
    .rolling(window=6, min_periods=1)
    .sum()
)

df["rainfall_6h_mm"] = (
    df["mean_rainfall_30min_mm"]
    .rolling(window=12, min_periods=1)
    .sum()
)

df["rainfall_24h_mm"] = (
    df["mean_rainfall_30min_mm"]
    .rolling(window=48, min_periods=1)
    .sum()
)

df["rainfall_72h_mm"] = (
    df["mean_rainfall_30min_mm"]
    .rolling(window=144, min_periods=1)
    .sum()
)

# Change in rainfall intensity
df["rainfall_rate_change"] = (
    df["mean_rainfall_rate_mm_hr"].diff()
)

output = OUTPUT_DIR / "gpm_features.csv"

df.to_csv(output, index=False)

print("\n==========================================")
print("GPM FEATURE ENGINE COMPLETE")
print("==========================================")

print(f"\nRows: {len(df)}")

print("\nFeatures:")
for column in df.columns:
    print(f"  - {column}")

print(f"\nSaved to:")
print(output)

print("\nData:")
print(df)