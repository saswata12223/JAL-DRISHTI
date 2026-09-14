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
    / "uttarakhand_flash_flood_candidates.csv"
)

OUTPUT_FILE = (
    ML_DIR
    / "data"
    / "processed"
    / "flash_flood_positive_events.csv"
)

# -----------------------------------------
# LOAD
# -----------------------------------------

df = pd.read_csv(INPUT_FILE)

# -----------------------------------------
# SELECT USEFUL COLUMNS
# -----------------------------------------

output = pd.DataFrame()

output["event_id"] = df["UEI"]
output["start_date"] = pd.to_datetime(
    df["Start Date"],
    errors="coerce"
)
output["end_date"] = pd.to_datetime(
    df["End Date"],
    errors="coerce"
)

output["duration_days"] = pd.to_numeric(
    df["Duration(Days)"],
    errors="coerce"
)

output["main_cause"] = df["Main Cause"]
output["location"] = df["Location"]
output["district"] = df["Districts"]
output["latitude"] = pd.to_numeric(
    df["Latitude"],
    errors="coerce"
)
output["longitude"] = pd.to_numeric(
    df["Longitude"],
    errors="coerce"
)

output["severity"] = df["Severity"]

output["area_affected"] = pd.to_numeric(
    df["Area Affected"],
    errors="coerce"
)

output["human_fatality"] = pd.to_numeric(
    df["Human fatality"],
    errors="coerce"
)

output["human_injured"] = pd.to_numeric(
    df["Human injured"],
    errors="coerce"
)

output["human_displaced"] = pd.to_numeric(
    df["Human Displaced"],
    errors="coerce"
)

# -----------------------------------------
# FLASH-FLOOD LABEL
# -----------------------------------------

output["flash_flood_label"] = 1

# -----------------------------------------
# SAVE
# -----------------------------------------

output.to_csv(
    OUTPUT_FILE,
    index=False
)

# -----------------------------------------
# REPORT
# -----------------------------------------

print("=" * 60)
print("FLASH-FLOOD LABEL DATASET")
print("=" * 60)

print("\nPositive flash-flood events:", len(output))

print("\nColumns:")
for column in output.columns:
    print(" -", column)

print("\nDates:")
print("From:", output["start_date"].min())
print("To:", output["start_date"].max())

print("\nCoordinates available:")
print(
    (
        output["latitude"].notna()
        & output["longitude"].notna()
    ).sum()
)

print("\nSaved to:")
print(OUTPUT_FILE)

print("\nDone.")