import pandas as pd
gwl_path = r'data/raw/Data_Research/gwl_tel_6_hourly_uttarakhand_uk_2021_2025.csv'
df = pd.read_csv(gwl_path)
df['datetime'] = pd.to_datetime(df['Data Acquisition Time'], dayfirst=True, errors='coerce')
print("Years represented in GWL dataset:")
print(df['datetime'].dt.year.value_counts().sort_index())
