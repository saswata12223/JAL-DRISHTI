import earthaccess
import os

print("Logging into NASA Earthdata...")
earthaccess.login()

print("Searching for one IMERG Early file...")

results = earthaccess.search_data(
    short_name="GPM_3IMERGHHE",
    temporal=("2026-08-30T00:00:00", "2026-08-31T23:59:59")
)

print(f"Files found: {len(results)}")

if len(results) == 0:
    print("No files found.")
    exit()

print("\nDownloading:")
print(results[0])

output_dir = r"C:\JAL DRISTI\data\raw"

os.makedirs(output_dir, exist_ok=True)

files = earthaccess.download(
    results[0],
    local_path=output_dir
)

print("\nDownload complete!")
print(files)