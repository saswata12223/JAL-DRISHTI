import pandas as pd
rain_path = r'data/raw/Data_Research/rainfall_tel_hr_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(rain_path, usecols=['Station', 'Data Acquisition Time', 'Telemetry Hourly Rainfall (mm)'])
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')

feb21 = df[(df['datetime'] >= '2021-02-05') & (df['datetime'] <= '2021-02-10')]
print(f"Feb 2021 records: {len(feb21)}")

oct21 = df[(df['datetime'] >= '2021-10-16') & (df['datetime'] <= '2021-10-21')]
print(f"Oct 2021 records: {len(oct21)}")

aug22 = df[(df['datetime'] >= '2022-08-18') & (df['datetime'] <= '2022-08-21')]
print(f"Aug 2022 records: {len(aug22)}")

aug23_1 = df[(df['datetime'] >= '2023-08-03') & (df['datetime'] <= '2023-08-06')]
print(f"Aug 2023 (FL-UK-2023-01) records: {len(aug23_1)}")

aug23_2 = df[(df['datetime'] >= '2023-08-13') & (df['datetime'] <= '2023-08-16')]
print(f"Aug 2023 (FL-UK-2023-02) records: {len(aug23_2)}")

jul24 = df[(df['datetime'] >= '2024-07-30') & (df['datetime'] <= '2024-08-02')]
print(f"Jul-Aug 2024 (FL-UK-2024-01) records: {len(jul24)}")
