import pandas as pd
gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(gwl_path)
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')
df['gwl_m'] = pd.to_numeric(df['Groundwater Level Telemetry 6 Hourly (meter)'], errors='coerce')

for st in ['Rishikesh_1', 'Kotdwar_1', 'Doiwala_1']:
    sub = df[(df['Station'] == st) & (df['datetime'] >= '2024-07-25') & (df['datetime'] <= '2024-08-05')].sort_values('datetime')
    print(f"\n{st} around 2024-07-31 ({len(sub)} records):")
    if len(sub):
        valid = sub.dropna(subset=['gwl_m'])
        print(f"  Valid: {len(valid)}, min: {valid['gwl_m'].min():.3f}, max: {valid['gwl_m'].max():.3f}")
        for _, r in valid.head(8).iterrows():
            print(f"    {r['datetime']}: {r['gwl_m']:.3f} m")
