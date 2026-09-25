import os, re, json, glob
import pandas as pd

print("Checking historical events in scripts/historical_events.py:")
if os.path.exists("scripts/historical_events.py"):
    with open("scripts/historical_events.py", "r", encoding="utf-8") as f:
        text = f.read()
    events = re.findall(r'event_id["\']?\s*[:=]\s*["\']([^"\']+)["\']', text)
    print(f"Found {len(events)} matches: {set(events)}")

print("\nChecking historicalEventsService.js:")
js_p = "frontend/src/services/historicalEventsService.js"
if os.path.exists(js_p):
    with open(js_p, "r", encoding="utf-8") as f:
        jstext = f.read()
    jsevents = re.findall(r'id:\s*["\']([^"\']+)["\']', jstext)
    print(f"Found {len(jsevents)} in JS: {jsevents[:10]}")

print("\nChecking India_Flood_Inventory_v3.csv in raw:")
for p in glob.glob("data/raw/**/India_Flood_Inventory_v3.csv", recursive=True):
    df = pd.read_csv(p, nrows=5)
    print(f"Found {p} ({os.path.getsize(p)} bytes), columns: {df.columns.tolist()[:8]}")
    # Check if Uttarakhand is in the State column
    full = pd.read_csv(p, usecols=["State", "Start Date", "End Date", "Location", "Districts"] if "State" in df.columns else None)
    uk_rows = full[full["State"].astype(str).str.contains("Uttarakhand|Uttaranchal", case=False, na=False)]
    print(f"Uttarakhand rows in IFI: {len(uk_rows)}")
    uk_rows["dt"] = pd.to_datetime(uk_rows["Start Date"], errors="coerce")
    print(f"Max date in IFI for UK: {uk_rows['dt'].max()}")
