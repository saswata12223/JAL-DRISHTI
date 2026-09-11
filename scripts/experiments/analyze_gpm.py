import xarray as xr
import numpy as np

FILE = r"C:\JAL DRISTI\data\raw\GPM_20260827_0000_0030_uttarakhand.nc4"

print("=" * 60)
print("GPM IMERG RAINFALL ANALYSIS")
print("=" * 60)

ds = xr.open_dataset(FILE)

rain = ds["precipitation"]

# Convert to NumPy array
values = rain.values.astype(float)

# Remove invalid / missing values
valid = values[np.isfinite(values)]

print("\n--- GRID ---")
print(f"Longitude points : {len(ds.lon)}")
print(f"Latitude points  : {len(ds.lat)}")
print(f"Grid cells       : {len(ds.lon) * len(ds.lat)}")

print("\n--- COORDINATES ---")
print(f"Longitude: {float(ds.lon.min())} to {float(ds.lon.max())}")
print(f"Latitude : {float(ds.lat.min())} to {float(ds.lat.max())}")

print("\n--- TIME ---")
print(f"Time coordinate: {ds.time.values}")

print("\n--- PRECIPITATION ---")

if len(valid) > 0:

    print(f"Valid cells : {len(valid)}")
    print(f"Minimum     : {np.min(valid):.4f} mm/hr")
    print(f"Maximum     : {np.max(valid):.4f} mm/hr")
    print(f"Mean        : {np.mean(valid):.4f} mm/hr")
    print(f"Median      : {np.median(valid):.4f} mm/hr")

    # Convert rate to rainfall depth for this 30-minute period
    rainfall_30min = valid * 0.5

    print("\n--- 30-MINUTE RAINFALL DEPTH ---")
    print(f"Minimum : {np.min(rainfall_30min):.4f} mm")
    print(f"Maximum : {np.max(rainfall_30min):.4f} mm")
    print(f"Mean    : {np.mean(rainfall_30min):.4f} mm")

else:
    print("No valid precipitation values found.")

ds.close()

print("\nAnalysis complete.")