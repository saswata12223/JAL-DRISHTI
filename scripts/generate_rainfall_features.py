from pathlib import Path
import xarray as xr


# ============================================================
# PATHS
# ============================================================

PROJECT_DIR = Path(r"C:\JAL DRISTI")

INPUT_FILE = (
    PROJECT_DIR
    / "data"
    / "processed"
    / "gpm_combined.nc"
)

OUTPUT_FILE = (
    PROJECT_DIR
    / "data"
    / "processed"
    / "rainfall_features.nc"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("GPM RAINFALL FEATURE GENERATION")
print("=" * 60)

print("\nLoading:")
print(INPUT_FILE)

ds = xr.open_dataset(INPUT_FILE)

rain = ds["precipitation"]

print("\nInput rainfall:")
print(rain)


# ============================================================
# 30-MINUTE RAINFALL DEPTH
# ============================================================

print("\nCalculating 30-minute rainfall depth...")

rain_30min = rain * 0.5

rain_30min.name = "rainfall_30min"

rain_30min.attrs["units"] = "mm"
rain_30min.attrs["description"] = (
    "Rainfall depth during each 30-minute GPM interval"
)


# ============================================================
# 1-HOUR ACCUMULATED RAINFALL
# ============================================================

print("Calculating 1-hour accumulated rainfall...")

rain_1h = rain_30min.rolling(
    time=2,
    min_periods=2
).sum()

rain_1h.name = "rainfall_1h"

rain_1h.attrs["units"] = "mm"
rain_1h.attrs["description"] = (
    "Accumulated rainfall over the previous 1 hour"
)


# ============================================================
# 3-HOUR ACCUMULATED RAINFALL
# ============================================================

print("Calculating 3-hour accumulated rainfall...")

rain_3h = rain_30min.rolling(
    time=6,
    min_periods=6
).sum()

rain_3h.name = "rainfall_3h"

rain_3h.attrs["units"] = "mm"
rain_3h.attrs["description"] = (
    "Accumulated rainfall over the previous 3 hours"
)


# ============================================================
# MAXIMUM RAINFALL INTENSITY
# ============================================================

print("Calculating maximum rainfall intensity...")

max_intensity = rain.max(dim="time")

max_intensity.name = "max_rainfall_intensity"

max_intensity.attrs["units"] = "mm/hr"
max_intensity.attrs["description"] = (
    "Maximum rainfall intensity during the available period"
)


# ============================================================
# MEAN RAINFALL INTENSITY
# ============================================================

print("Calculating mean rainfall intensity...")

mean_intensity = rain.mean(dim="time")

mean_intensity.name = "mean_rainfall_intensity"

mean_intensity.attrs["units"] = "mm/hr"
mean_intensity.attrs["description"] = (
    "Mean rainfall intensity during the available period"
)


# ============================================================
# RAINFALL CHANGE / TREND
# ============================================================

print("Calculating rainfall trend...")

rainfall_trend = rain.diff(dim="time")

rainfall_trend.name = "rainfall_trend"

rainfall_trend.attrs["units"] = "mm/hr"
rainfall_trend.attrs["description"] = (
    "Change in rainfall intensity between consecutive "
    "30-minute observations"
)


# ============================================================
# CREATE FEATURE DATASET
# ============================================================

features = xr.Dataset(
    {
        "rainfall_30min": rain_30min,
        "rainfall_1h": rain_1h,
        "rainfall_3h": rain_3h,
        "max_rainfall_intensity": max_intensity,
        "mean_rainfall_intensity": mean_intensity,
        "rainfall_trend": rainfall_trend,
    }
)


# ============================================================
# DISPLAY
# ============================================================

print("\n" + "=" * 60)
print("FEATURE DATASET")
print("=" * 60)

print(features)


# ============================================================
# STATISTICS
# ============================================================

print("\n--- FEATURE STATISTICS ---")

print(
    f"Maximum 30-min rainfall : "
    f"{float(rain_30min.max()):.4f} mm"
)

print(
    f"Maximum 1-hour rainfall : "
    f"{float(rain_1h.max()):.4f} mm"
)

print(
    f"Maximum 3-hour rainfall : "
    f"{float(rain_3h.max(skipna=True)):.4f} mm"
)

print(
    f"Maximum intensity       : "
    f"{float(max_intensity.max()):.4f} mm/hr"
)

print(
    f"Mean intensity          : "
    f"{float(mean_intensity.mean()):.4f} mm/hr"
)


# ============================================================
# SAVE
# ============================================================

print("\nSaving features...")

features.to_netcdf(OUTPUT_FILE)

print("\nSaved successfully:")
print(OUTPUT_FILE)


# ============================================================
# CLOSE
# ============================================================

ds.close()
features.close()

print("\n" + "=" * 60)
print("FEATURE GENERATION COMPLETE")
print("=" * 60)