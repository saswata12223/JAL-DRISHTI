from pathlib import Path
import pandas as pd


# -----------------------------------------
# PATH SETUP
# -----------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

RAW_DIR = ML_DIR / "data" / "raw"

FLOOD_FILE = RAW_DIR / "India_Flood_Inventory_v3.csv"


# -----------------------------------------
# CHECK FILE
# -----------------------------------------

if not FLOOD_FILE.exists():
    raise FileNotFoundError(
        f"Flood dataset not found:\n{FLOOD_FILE}"
    )


# -----------------------------------------
# LOAD DATA
# -----------------------------------------

print("Loading flood inventory...")

df = pd.read_csv(FLOOD_FILE)

print("\nDataset loaded successfully.")


# -----------------------------------------
# BASIC INFORMATION
# -----------------------------------------

print("\nNumber of rows:")
print(len(df))

print("\nNumber of columns:")
print(len(df.columns))


# -----------------------------------------
# COLUMN NAMES
# -----------------------------------------

print("\nColumns:")
for column in df.columns:
    print(" -", column)


# -----------------------------------------
# DATA TYPES
# -----------------------------------------

print("\nData types:")
print(df.dtypes)


# -----------------------------------------
# FIRST FIVE ROWS
# -----------------------------------------

print("\nFirst five records:")
print(df.head().to_string())


# -----------------------------------------
# MISSING VALUES
# -----------------------------------------

print("\nMissing values:")
print(df.isnull().sum())