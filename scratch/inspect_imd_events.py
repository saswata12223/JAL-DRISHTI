import os, glob
import pandas as pd

pattern = 'data/raw/*Flash_Flood*/*Flash_Flood*/uttarakhand_flood_events.csv'
matches = glob.glob(pattern)
p = matches[0]
df = pd.read_csv(p)
df['start_dt'] = pd.to_datetime(df['Start Date'], dayfirst=True, errors='coerce')
sub = df[df['start_dt'] >= '2022-01-01'].copy()
print(f"Events >= 2022: {len(sub)}")
for _, r in sub.iterrows():
    print(f"{r['UEI']} | {r['Start Date']} | {r['Districts']} | Lat: {r['Latitude']} | Lon: {r['Longitude']} | Cause: {r['Main Cause']} | Loc: {r['Location']}")
