from pathlib import Path
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

INPUT_FILE = (
    ML_DIR
    / "data"
    / "processed"
    / "flash_flood_positive_events.csv"
)

df = pd.read_csv(INPUT_FILE)

print("=" * 60)
print("FLASH-FLOOD LOCATION CHECK")
print("=" * 60)

print("\nTotal flash-flood events:", len(df))

print("\nDISTRICT VALUES:")
print(df["district"].fillna("MISSING").value_counts().to_string())

print("\n\nLOCATION VALUES:")

locations = df["location"].fillna("MISSING").astype(str)

for i, location in enumerate(locations, start=1):
    print(f"{i}. {location}")

print("\n\nCoordinate status:")
print("Latitude missing:", df["latitude"].isna().sum())
print("Longitude missing:", df["longitude"].isna().sum())

print("\nDone.")