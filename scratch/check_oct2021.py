import pandas as pd
gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(gwl_path)
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')
oct21 = df[(df['datetime'] >= '2021-10-10') & (df['datetime'] <= '2021-10-25')]
print(f"Total readings in Oct 2021: {len(oct21)}")
print(f"Stations with readings in Oct 2021: {oct21['Station'].nunique()}")
print("Stations list:", oct21['Station'].unique())
