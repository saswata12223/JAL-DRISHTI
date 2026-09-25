import pandas as pd
import numpy as np

gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(gwl_path)
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')
df['gwl_m'] = pd.to_numeric(df['Groundwater Level Telemetry 6 Hourly (meter)'], errors='coerce')

def check_station_window(station_name, event_date_str, window_days=5):
    t_ev = pd.to_datetime(event_date_str)
    t_pre = t_ev - pd.Timedelta(days=window_days)
    t_post = t_ev + pd.Timedelta(days=window_days)
    
    sub = df[(df['Station'] == station_name) & (df['datetime'] >= t_pre) & (df['datetime'] <= t_post)].sort_values('datetime')
    print(f"\nStation: {station_name} around {event_date_str} ({len(sub)} records):")
    if len(sub) == 0:
        print("  NO RECORDS in window!")
        return None
    valid = sub.dropna(subset=['gwl_m'])
    print(f"  Valid readings: {len(valid)} / {len(sub)}")
    if len(valid) == 0:
        print("  NO VALID GWL readings!")
        return None
    
    # baseline = pre-event window (from t_pre to t_ev)
    pre = valid[valid['datetime'] < t_ev]
    ev = valid[(valid['datetime'] >= t_ev) & (valid['datetime'] <= t_ev + pd.Timedelta(days=1))]
    post = valid[valid['datetime'] > t_ev + pd.Timedelta(days=1)]
    
    pre_med = pre['gwl_m'].median() if len(pre) else np.nan
    ev_min = ev['gwl_m'].min() if len(ev) else np.nan
    ev_max = ev['gwl_m'].max() if len(ev) else np.nan
    ev_mean = ev['gwl_m'].mean() if len(ev) else np.nan
    
    print(f"  Pre-event median: {pre_med:.3f} m (N={len(pre)})")
    print(f"  Event day max: {ev_max:.3f} m, min: {ev_min:.3f} m, mean: {ev_mean:.3f} m (N={len(ev)})")
    if not np.isnan(pre_med) and not np.isnan(ev_max):
        print(f"  Event deviation from baseline: {ev_max - pre_med:.3f} m")
    print("  Readings sample:")
    for _, r in valid.head(10).iterrows():
        print(f"    {r['datetime']}: {r['gwl_m']:.3f} m")
    return valid

# Check Kotdwar_1 for FL-UK-2023-02 (2023-08-14)
print("=== FL-UK-2023-02 (2023-08-14) Kotdwar_1 ===")
check_station_window("Kotdwar_1", "2023-08-14", window_days=7)

# Check Sigaddi for FL-UK-2023-02 (2023-08-14)
print("\n=== FL-UK-2023-02 (2023-08-14) Sigaddi ===")
check_station_window("Sigaddi", "2023-08-14", window_days=7)

# Check Yamna Colony for FL-UK-2022-01 (2022-08-19)
print("\n=== FL-UK-2022-01 (2022-08-19) Yamna Colony, Dehradun ===")
check_station_window("Yamna Colony, Dehradun", "2022-08-19", window_days=7)

# Check Lacchiwala for FL-UK-2022-01 (2022-08-19)
print("\n=== FL-UK-2022-01 (2022-08-19) Lacchiwala ===")
check_station_window("Lacchiwala", "2022-08-19", window_days=7)
