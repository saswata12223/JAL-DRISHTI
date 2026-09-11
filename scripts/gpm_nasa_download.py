import earthaccess
import os

# --------------------------------------------------
# SETTINGS
# --------------------------------------------------

OUTPUT_DIR = r"C:\JAL DRISTI\data\raw"

START = "2026-08-30T00:00:00"
END   = "2026-08-31T23:59:59"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# --------------------------------------------------
# LOGIN
# --------------------------------------------------

print("Logging into NASA Earthdata...")

auth = earthaccess.login()

if not auth.authenticated:
    raise RuntimeError("NASA Earthdata authentication failed.")

print("NASA login successful.")

# --------------------------------------------------
# SEARCH IMERG EARLY
# --------------------------------------------------

print("\nSearching GPM IMERG Early...")

results = earthaccess.search_data(
    short_name="GPM_3IMERGHHE",
    version="07",
    temporal=(START, END),
)

print(f"Files found: {len(results)}")

if not results:
    raise RuntimeError("No IMERG files found.")

# --------------------------------------------------
# SHOW FILE
# --------------------------------------------------

print("\nSelected file:")
print(results[0])

# --------------------------------------------------
# DOWNLOAD ONE FILE
# --------------------------------------------------

print("\nDownloading one IMERG file...")

downloaded = earthaccess.download(
    results[0],
    local_path=OUTPUT_DIR
)

print("\nDownload finished!")
print(downloaded)