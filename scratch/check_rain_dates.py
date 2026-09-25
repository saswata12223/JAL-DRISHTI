import pandas as pd
rain_path = r'data/raw/Data_Research/rainfall_tel_hr_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(rain_path, usecols=['Station', 'Data Acquisition Time', 'Telemetry Hourly Rainfall (mm)'])
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')

for st in ['Yamuna Colony', 'Doiwala (Bhogpur)', 'Kempty', 'Assan_1', 'Dakpathar']:
    sub = df[df['Station'] == st]
    print(f"Station {st}: {len(sub)} rows, min date: {sub['datetime'].min()}, max date: {sub['datetime'].max()}")
    aug22 = sub[(sub['datetime'] >= '2022-08-18') & (sub['datetime'] <= '2022-08-21')]
    print(f"  Rows in Aug 2022: {len(aug22)}")
