from pathlib import Path
from datetime import datetime, timedelta

import xarray as xr


# ============================================================
# PATHS
# ============================================================

PROJECT_DIR = Path(r"C:\JAL DRISTI")

RAW_DIR = PROJECT_DIR / "data" / "raw"
PROCESSED_DIR = PROJECT_DIR / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = PROCESSED_DIR / "gpm_combined.nc"


# ============================================================
# FIND GPM FILES
# ============================================================

files = sorted(
    RAW_DIR.glob(
        "3B-HHR-E.MS.MRG.3IMERG.*.V07C.nc4"
    )
)

print("=" * 60)
print("GPM IMERG TIME-SERIES COMBINATION")
print("=" * 60)

print(f"\nGPM files found: {len(files)}")

if not files:
    print("ERROR: No GPM files found.")
    raise SystemExit(1)


for i, file in enumerate(files, start=1):
    print(f"{i}. {file.name}")


# ============================================================
# OPEN FILES
# ============================================================

datasets = []

for file in files:

    print(f"\nReading: {file.name}")

    ds = xr.open_dataset(file)

    if "precipitation" not in ds:
        print("ERROR: precipitation variable missing.")
        ds.close()
        raise SystemExit(1)

    datasets.append(ds)


# ============================================================
# CREATE CORRECT TIME COORDINATES
# ============================================================

print("\nCreating half-hour time coordinates...")

start_time = datetime(2026, 8, 30, 0, 0)

times = [
    start_time + timedelta(minutes=30 * i)
    for i in range(len(datasets))
]

print("\nTime steps:")

for t in times:
    print(" ", t)


# ============================================================
# COMBINE DATA
# ============================================================

print("\nCombining datasets...")

combined = xr.concat(
    datasets,
    dim="time"
)

# Replace numeric time coordinate with real timestamps
combined = combined.assign_coords(
    time=("time", times)
)

# Ensure chronological order
combined = combined.sortby("time")


# ============================================================
# DATASET INFORMATION
# ============================================================

print("\n--- COMBINED DATASET ---")

print(combined)


# ============================================================
# TIME INFORMATION
# ============================================================

print("\n--- TIME ---")

print("Start:", combined.time.values[0])

print("End:", combined.time.values[-1])

print(
    "Number of time steps:",
    combined.sizes["time"]
)


# ============================================================
# GRID INFORMATION
# ============================================================

print("\n--- GRID ---")

print(
    "Longitude points:",
    combined.sizes["lon"]
)

print(
    "Latitude points:",
    combined.sizes["lat"]
)

print(
    "Grid cells:",
    combined.sizes["lon"] *
    combined.sizes["lat"]
)


# ============================================================
# RAINFALL STATISTICS
# ============================================================

rain = combined["precipitation"]

print("\n--- RAINFALL ---")

print(
    f"Minimum : {float(rain.min()):.4f} mm/hr"
)

print(
    f"Maximum : {float(rain.max()):.4f} mm/hr"
)

print(
    f"Mean    : {float(rain.mean()):.4f} mm/hr"
)

print(
    f"Median  : {float(rain.median()):.4f} mm/hr"
)


# ============================================================
# SAVE
# ============================================================

print("\nSaving combined dataset...")

combined.to_netcdf(
    OUTPUT_FILE
)

print("\nSaved successfully:")
print(OUTPUT_FILE)


# ============================================================
# CLEANUP
# ============================================================

for ds in datasets:
    ds.close()

combined.close()


print("\n" + "=" * 60)
print("COMBINATION COMPLETE")
print("=" * 60)