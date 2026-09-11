import xarray as xr
import pandas as pd

FILE = r"C:\JAL DRISTI\data\raw\GPM_20260827_0000_0030_uttarakhand.nc4"

ds = xr.open_dataset(FILE)

rain = ds["precipitation"]

# Convert grid into a table
df = rain.to_dataframe().reset_index()

# Rename for our ML pipeline
df = df.rename(
    columns={
        "lon": "longitude",
        "lat": "latitude",
        "precipitation": "rainfall_rate_mm_hr"
    }
)

# Convert 30-minute rate to rainfall depth
df["rainfall_30min_mm"] = df["rainfall_rate_mm_hr"] * 0.5

output = r"C:\JAL DRISTI\data\processed\gpm_rainfall.csv"

df.to_csv(output, index=False)

print("CSV created successfully!")
print(f"Rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print(f"Saved to: {output}")

print("\nFirst 10 rows:")
print(df.head(10))

ds.close()