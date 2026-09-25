import os, math, glob
import pandas as pd
import numpy as np

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return R * 2 * math.asin(math.sqrt(a))

gwl_st = pd.read_csv('scratch/gwl_stations_audit.csv')
print(f"Loaded {len(gwl_st)} GWL stations")

canon = pd.read_parquet('data/processed/canonical/flood_events.parquet')
print(f"Loaded {len(canon)} canonical flood events")

# Check events between 2021 and 2025
events_recent = canon[canon['event_date'] >= '2021-01-01'].copy()
print(f"Recent events (2021-2025): {len(events_recent)}")

for idx, ev in events_recent.iterrows():
    ev_id = ev['event_id']
    ev_lat = ev['latitude']
    ev_lon = ev['longitude']
    ev_date = ev['event_date']
    ev_dist = ev['district']
    
    # Calculate distance to all GWL stations
    dists = []
    for _, st in gwl_st.iterrows():
        d = haversine(ev_lat, ev_lon, st['latitude'], st['longitude'])
        dists.append({
            'station_id': st['station_id'],
            'district': st['district'],
            'distance_km': d
        })
    df_d = pd.DataFrame(dists).sort_values('distance_km')
    
    n_5 = (df_d['distance_km'] <= 5).sum()
    n_10 = (df_d['distance_km'] <= 10).sum()
    n_25 = (df_d['distance_km'] <= 25).sum()
    n_50 = (df_d['distance_km'] <= 50).sum()
    
    print(f"\n--- Event {ev_id} ({ev_date}) in {ev_dist} ({ev_lat}, {ev_lon}) ---")
    print(f"  Nearest: {df_d.iloc[0]['station_id']} ({df_d.iloc[0]['district']}) - {df_d.iloc[0]['distance_km']:.2f} km")
    print(f"  2nd:     {df_d.iloc[1]['station_id']} ({df_d.iloc[1]['district']}) - {df_d.iloc[1]['distance_km']:.2f} km")
    print(f"  3rd:     {df_d.iloc[2]['station_id']} ({df_d.iloc[2]['district']}) - {df_d.iloc[2]['distance_km']:.2f} km")
    print(f"  Counts: <=5km: {n_5}, <=10km: {n_10}, <=25km: {n_25}, <=50km: {n_50}")
    print(f"  Top 5 closest:")
    for i in range(min(5, len(df_d))):
        r = df_d.iloc[i]
        print(f"    {r['station_id']} ({r['district']}): {r['distance_km']:.2f} km")
