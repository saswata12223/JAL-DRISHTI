from pathlib import Path
import pandas as pd

# -----------------------------------------
# PATHS
# -----------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
ML_DIR = SCRIPT_DIR.parent

INPUT_FILE = ML_DIR / "data" / "processed" / "uttarakhand_flood_events.csv"

# -----------------------------------------
# LOAD DATA
# -----------------------------------------

df = pd.read_csv(INPUT_FILE)

print("=" * 60)
print("UTTARAKHAND FLOOD DATA ANALYSIS")
print("=" * 60)

print("\nTotal events:", len(df))

# -----------------------------------------
# MAIN CAUSE
# -----------------------------------------

print("\n" + "=" * 60)
print("MAIN CAUSE")
print("=" * 60)

print(df["Main Cause"].value_counts(dropna=False))

# -----------------------------------------
# SEVERITY
# -----------------------------------------

print("\n" + "=" * 60)
print("SEVERITY")
print("=" * 60)

print(df["Severity"].value_counts(dropna=False))

# -----------------------------------------
# COORDINATES
# -----------------------------------------

print("\n" + "=" * 60)
print("COORDINATES")
print("=" * 60)

print("Latitude available:",
      df["Latitude"].notna().sum())

print("Longitude available:",
      df["Longitude"].notna().sum())

print("Both coordinates available:",
      (df["Latitude"].notna() & df["Longitude"].notna()).sum())

# -----------------------------------------
# DATES
# -----------------------------------------

print("\n" + "=" * 60)
print("DATES")
print("=" * 60)

print("Earliest event:", df["Start Date"].min())
print("Latest event:", df["Start Date"].max())

# -----------------------------------------
# HUMAN IMPACT
# -----------------------------------------

print("\n" + "=" * 60)
print("HUMAN IMPACT")
print("=" * 60)

print("Total fatalities:",
      pd.to_numeric(df["Human fatality"], errors="coerce").sum())

print("Total injured:",
      pd.to_numeric(df["Human injured"], errors="coerce").sum())

print("Total displaced:",
      pd.to_numeric(df["Human Displaced"], errors="coerce").sum())

# -----------------------------------------
# SAMPLE DESCRIPTIONS
# -----------------------------------------

print("\n" + "=" * 60)
print("EVENT DESCRIPTIONS")
print("=" * 60)

for i, description in enumerate(
    df["Description of Casualties/injured"].dropna().head(10),
    start=1
):
    print(f"\n{i}. {description}")

# -----------------------------------------
# LOCATIONS
# -----------------------------------------

print("\n" + "=" * 60)
print("LOCATIONS")
print("=" * 60)

print(
    df["Location"]
    .dropna()
    .value_counts()
    .head(20)
)

print("\nAnalysis complete.")