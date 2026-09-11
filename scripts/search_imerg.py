import earthaccess

print("Logging into NASA Earthdata...")
earthaccess.login()

print("Searching for GPM IMERG Early V07B...")

results = earthaccess.search_data(
    short_name="GPM_3IMERGHHE",
    temporal=("2026-08-30", "2026-08-31")
)

print(f"\nFiles found: {len(results)}")

for i, result in enumerate(results[:5], start=1):
    print(f"\n--- Result {i} ---")
    print(result)