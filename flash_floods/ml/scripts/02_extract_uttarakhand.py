from pathlib import Path
import pandas as pd

# -----------------------------------------
# PATHS
# -----------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

RAW_DIR = ML_DIR / "data" / "raw"
PROCESSED_DIR = ML_DIR / "data" / "processed"

FLOOD_FILE = RAW_DIR / "India_Flood_Inventory_v3.csv"
OUTPUT_FILE = PROCESSED_DIR / "uttarakhand_flood_events.csv"

# Create processed folder if needed
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# -----------------------------------------
# LOAD DATA
# -----------------------------------------

print("Loading India Flood Inventory...")

df = pd.read_csv(FLOOD_FILE)

# -----------------------------------------
# FILTER UTTARAKHAND
# -----------------------------------------

uttarakhand = df[
    df["State"]
    .astype(str)
    .str.strip()
    .str.lower()
    == "uttarakhand"
].copy()

# -----------------------------------------
# SAVE
# -----------------------------------------

uttarakhand.to_csv(OUTPUT_FILE, index=False)

# -----------------------------------------
# RESULTS
# -----------------------------------------

print("\nUttarakhand extraction complete!")

print("\nNumber of Uttarakhand events:")
print(len(uttarakhand))

print("\nOutput file:")
print(OUTPUT_FILE)

print("\nDistricts:")
print(
    uttarakhand["Districts"]
    .dropna()
    .value_counts()
)

print("\nDate range:")
print("From:", uttarakhand["Start Date"].min())
print("To:", uttarakhand["End Date"].max())