import pandas as pd

gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(gwl_path)
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')
df['gwl_m'] = pd.to_numeric(df['Groundwater Level Telemetry 6 Hourly (meter)'], errors='coerce')

kot = df[(df['Station'] == 'Kotdwar_1') & (df['datetime'] >= '2023-08-10') & (df['datetime'] <= '2023-08-18')].sort_values('datetime')
print("Kotdwar_1 2023-08-10 to 2023-08-18:")
for _, r in kot.iterrows():
    print(f"  {r['datetime']}: {r['gwl_m']:.3f} m")
