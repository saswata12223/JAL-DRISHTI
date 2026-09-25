import os, json, math, hashlib, glob
import pandas as pd
import numpy as np

# Load GWL data and examine all 66 stations
gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
gwl_df = pd.read_csv(gwl_path)
print(f"Total GWL rows: {len(gwl_df)}")
gwl_df['datetime'] = pd.to_datetime(gwl_df['Data Acquisition Time'], dayfirst=True, errors='coerce')
gwl_df['gwl_m'] = pd.to_numeric(gwl_df['Groundwater Level Telemetry 6 Hourly (meter)'], errors='coerce')

st_summary = []
for st, grp in gwl_df.groupby('Station'):
    lat = grp['Latitude'].dropna().iloc[0] if grp['Latitude'].notna().any() else np.nan
    lon = grp['Longitude'].dropna().iloc[0] if grp['Longitude'].notna().any() else np.nan
    dist = grp['District'].dropna().iloc[0] if grp['District'].notna().any() else '-'
    river = grp['River'].dropna().iloc[0] if grp['River'].notna().any() else '-'
    basin = grp['Basin'].dropna().iloc[0] if grp['Basin'].notna().any() else '-'
    valid_dt = grp['datetime'].dropna()
    valid_gwl = grp['gwl_m'].dropna()
    st_summary.append({
        'station_id': st,
        'station_name': st,
        'latitude': lat,
        'longitude': lon,
        'district': dist,
        'river': river,
        'basin': basin,
        'first_obs': valid_dt.min().isoformat() if len(valid_dt) else None,
        'last_obs': valid_dt.max().isoformat() if len(valid_dt) else None,
        'obs_count': len(valid_dt),
        'valid_gwl_count': len(valid_gwl),
        'gwl_min': valid_gwl.min() if len(valid_gwl) else None,
        'gwl_max': valid_gwl.max() if len(valid_gwl) else None,
        'gwl_mean': valid_gwl.mean() if len(valid_gwl) else None
    })

st_df = pd.DataFrame(st_summary)
print(f"Unique GWL stations: {len(st_df)}")
print("Districts with GWL stations:")
print(st_df['district'].value_counts())
print("\nSample stations with coords:")
print(st_df[['station_id', 'latitude', 'longitude', 'district', 'first_obs', 'last_obs', 'valid_gwl_count']].head(10))

# Save for reference
st_df.to_csv('scratch/gwl_stations_audit.csv', index=False)
