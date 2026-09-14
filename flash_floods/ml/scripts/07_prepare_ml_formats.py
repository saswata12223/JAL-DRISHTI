from pathlib import Path
import pandas as pd
import json


# ---------------------------------------------------------
# PATHS
# ---------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

INPUT_FILE = (
    ML_DIR
    / "data"
    / "processed"
    / "flash_flood_positive_events.csv"
)

OUTPUT_DIR = (
    ML_DIR
    / "data"
    / "processed"
)

CLEAN_CSV = OUTPUT_DIR / "flash_flood_events_clean.csv"
JSON_FILE = OUTPUT_DIR / "flash_flood_events.json"


# ---------------------------------------------------------
# LOAD DATA
# ---------------------------------------------------------

print("=" * 60)
print("FLASH FLOOD ML DATA PREPARATION")
print("=" * 60)

print("\nReading:", INPUT_FILE)

df = pd.read_csv(INPUT_FILE)

print("\nOriginal shape:", df.shape)

print("\nOriginal columns:")
for column in df.columns:
    print("-", column)


# ---------------------------------------------------------
# STANDARDIZE COLUMN NAMES
# ---------------------------------------------------------

df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
    .str.replace("(", "", regex=False)
    .str.replace(")", "", regex=False)
    .str.replace("/", "_", regex=False)
    .str.replace("-", "_", regex=False)
)

print("\nStandardized columns:")
for column in df.columns:
    print("-", column)


# ---------------------------------------------------------
# REMOVE COMPLETELY EMPTY COLUMNS
# ---------------------------------------------------------

empty_columns = [
    column
    for column in df.columns
    if df[column].isna().all()
]

if empty_columns:
    print("\nRemoving completely empty columns:")
    for column in empty_columns:
        print("-", column)

    df = df.drop(columns=empty_columns)


# ---------------------------------------------------------
# REMOVE DUPLICATE RECORDS
# ---------------------------------------------------------

duplicates = df.duplicated().sum()

print("\nDuplicate records:", duplicates)

if duplicates > 0:
    df = df.drop_duplicates()


# ---------------------------------------------------------
# CLEAN TEXT COLUMNS
# ---------------------------------------------------------

text_columns = df.select_dtypes(include=["object"]).columns

for column in text_columns:
    df[column] = (
        df[column]
        .astype(str)
        .str.strip()
    )

    # Restore actual missing values
    df[column] = df[column].replace(
        ["nan", "None", ""],
        pd.NA
    )


# ---------------------------------------------------------
# CONVERT NUMERIC COLUMNS
# ---------------------------------------------------------

numeric_columns = [
    "latitude",
    "longitude",
    "severity",
    "duration_days",
    "area_affected",
    "human_fatality",
    "human_injured",
    "human_displaced",
    "animal_fatality",
]

for column in numeric_columns:
    if column in df.columns:
        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )


# ---------------------------------------------------------
# SAVE CLEAN CSV
# ---------------------------------------------------------

df.to_csv(
    CLEAN_CSV,
    index=False
)

print("\nClean CSV saved:")
print(CLEAN_CSV)


# ---------------------------------------------------------
# SAVE JSON
# ---------------------------------------------------------

records = df.where(
    pd.notna(df),
    None
).to_dict(orient="records")

with open(
    JSON_FILE,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        records,
        file,
        indent=2,
        ensure_ascii=False
    )


print("\nJSON saved:")
print(JSON_FILE)


# ---------------------------------------------------------
# DATASET SUMMARY
# ---------------------------------------------------------

print("\n" + "=" * 60)
print("FINAL DATASET SUMMARY")
print("=" * 60)

print("\nRows:", len(df))
print("Columns:", len(df.columns))

print("\nMissing values:")

print(
    df.isna()
    .sum()
    .sort_values(ascending=False)
    .to_string()
)


# ---------------------------------------------------------
# COORDINATE CHECK
# ---------------------------------------------------------

if "latitude" in df.columns and "longitude" in df.columns:

    valid_coordinates = (
        df["latitude"].notna()
        & df["longitude"].notna()
    )

    print(
        "\nRecords with coordinates:",
        valid_coordinates.sum()
    )

    print(
        "Records without coordinates:",
        (~valid_coordinates).sum()
    )

print("\nDone.")