import pandas as pd
import json

df_fe = pd.read_parquet('data/processed/canonical/flood_events.parquet')
print('=== 15 CANONICAL FLOOD EVENTS ===')
for idx, r in df_fe.iterrows():
    print(r['event_id'], '|', r['event_date'], '|', r['district'], '|', r['river_catchment'], '|', f"lat={r['latitude']:.3f}, lon={r['longitude']:.3f}", '|', r['target_suitability'])

with open('data/processed/risk/flood_thresholds.geojson') as f:
    ft = json.load(f)
print('\n=== 20 CWC GAUGES WITH VERIFIED THRESHOLDS ===')
for feat in ft['features']:
    p = feat['properties']
    geom = feat['geometry']['coordinates']
    print(p['station_id'], '|', p['station_name'], '|', p['river_name'], '|', f"Warn: {p['warning_level_m']}m, Danger: {p['danger_level_m']}m, HFL: {p['hfl_m']}m ({p['hfl_date']})", '| coords:', geom)
