from pathlib import Path
import pandas as pd

# -----------------------------------------
# PATHS
# -----------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

INPUT_FILE = (
    ML_DIR
    / "data"
    / "processed"
    / "uttarakhand_flood_events.csv"
)

OUTPUT_FILE = (
    ML_DIR
    / "data"
    / "processed"
    / "uttarakhand_flash_flood_candidates.csv"
)

# -----------------------------------------
# LOAD DATA
# -----------------------------------------

df = pd.read_csv(INPUT_FILE)

print("=" * 60)
print("FLASH-FLOOD CANDIDATE EXTRACTION")
print("=" * 60)

print("\nTotal Uttarakhand events:", len(df))

# -----------------------------------------
# SEARCH MAIN CAUSE
# -----------------------------------------

cause = (
    df["Main Cause"]
    .fillna("")
    .astype(str)
    .str.lower()
)

flash_flood_mask = (
    cause.str.contains("flash flood", regex=False)
    |
    cause.str.contains("cloudburst", regex=False)
    |
    cause.str.contains("cloud burst", regex=False)
)

flash_floods = df[flash_flood_mask].copy()

# -----------------------------------------
# SAVE
# -----------------------------------------

flash_floods.to_csv(OUTPUT_FILE, index=False)

# -----------------------------------------
# RESULTS
# -----------------------------------------

print("\nFlash-flood candidates:", len(flash_floods))

print("\nMatched Main Cause values:")
print(
    flash_floods["Main Cause"]
    .value_counts(dropna=False)
)

print("\nOutput:")
print(OUTPUT_FILE)

print("\nExtraction complete.")