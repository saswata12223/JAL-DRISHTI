import numpy as np
import pandas as pd
import xarray as xr

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points on the Earth surface in km."""
    R = 6371.0 # km
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

def compute_rolling_rainfall(df_rain: pd.DataFrame) -> pd.DataFrame:
    """
    Given a dataframe with 'station_id', 'prediction_timestamp', and 'rain_1h',
    computes rolling 3h, 6h, 12h, and 24h rainfall sums.
    """
    df = df_rain.copy()
    if 'prediction_timestamp' not in df.columns or 'station_id' not in df.columns:
        raise ValueError("DataFrame must contain 'station_id' and 'prediction_timestamp'")
    
    df = df.sort_values(['station_id', 'prediction_timestamp'])
    df.set_index('prediction_timestamp', inplace=True)
    
    def compute_roll(g):
        r3 = g['rain_1h'].rolling('3h', min_periods=1).sum()
        r6 = g['rain_1h'].rolling('6h', min_periods=1).sum()
        r12 = g['rain_1h'].rolling('12h', min_periods=1).sum()
        r24 = g['rain_1h'].rolling('24h', min_periods=1).sum()
        return pd.DataFrame({'rain_3h': r3, 'rain_6h': r6, 'rain_12h': r12, 'rain_24h': r24})
    
    if len(df) > 0:
        rolled = df.groupby('station_id', group_keys=False).apply(compute_roll)
        df = df.join(rolled).reset_index()
    else:
        df = df.reset_index()
        for col in ['rain_3h', 'rain_6h', 'rain_12h', 'rain_24h']:
            df[col] = []
            
    return df

def apply_terrain_features(df_features: pd.DataFrame, stations_df: pd.DataFrame, static_nc_path: str) -> pd.DataFrame:
    """
    Maps elevation, slope, and twi from static NC file to the features dataframe.
    """
    if df_features.empty:
        return df_features

    static_nc = xr.open_dataset(static_nc_path)
    lats_static, lons_static = static_nc.lat.values, static_nc.lon.values
    
    station_static_map = {}
    for _, row in stations_df.iterrows():
        sid, slat, slon = row['station_id'], row['latitude'], row['longitude']
        if pd.isna(slat) or pd.isna(slon): 
            continue
            
        lat_idx_s = np.argmin(np.abs(lats_static - slat))
        lon_idx_s = np.argmin(np.abs(lons_static - slon))
        station_static_map[sid] = {
            'elevation': static_nc['elevation'].values[lat_idx_s, lon_idx_s],
            'slope': static_nc['slope'].values[lat_idx_s, lon_idx_s],
            'twi': static_nc['twi'].values[lat_idx_s, lon_idx_s]
        }
        
    df = df_features.copy()
    df['elevation'] = df['station_id'].map(lambda x: station_static_map.get(x, {}).get('elevation', np.nan))
    df['slope'] = df['station_id'].map(lambda x: station_static_map.get(x, {}).get('slope', np.nan))
    df['twi'] = df['station_id'].map(lambda x: station_static_map.get(x, {}).get('twi', np.nan))
    return df

def apply_soil_features(df_features: pd.DataFrame, stations_df: pd.DataFrame, dyn_nc_path: str) -> pd.DataFrame:
    """
    Maps surface_soil_moisture strictly backward in time from dynamic NC file.
    """
    if df_features.empty:
        return df_features
        
    dyn_nc = xr.open_dataset(dyn_nc_path)
    lats_dyn, lons_dyn = dyn_nc.lat.values, dyn_nc.lon.values
    
    station_dyn_map = {}
    for _, row in stations_df.iterrows():
        sid, slat, slon = row['station_id'], row['latitude'], row['longitude']
        if pd.isna(slat) or pd.isna(slon): 
            continue
        lat_idx_d = np.argmin(np.abs(lats_dyn - slat))
        lon_idx_d = np.argmin(np.abs(lons_dyn - slon))
        station_dyn_map[sid] = (lat_idx_d, lon_idx_d)
        
    dyn_times = pd.to_datetime(dyn_nc.time.values).tz_localize(None)
    soil_vals = []
    
    for idx, row in df_features.iterrows():
        sid, pt = row['station_id'], row['prediction_timestamp'].tz_localize(None)
        val = np.nan
        if sid in station_dyn_map:
            y_idx, x_idx = station_dyn_map[sid]
            valid_times = [t for t in dyn_times if t <= pt]
            if len(valid_times) > 0:
                best_t = max(valid_times)
                t_idx = list(dyn_times).index(best_t)
                val = dyn_nc['surface_soil_moisture'].values[t_idx, y_idx, x_idx]
        soil_vals.append(val)
        
    df = df_features.copy()
    df['surface_soil_moisture'] = soil_vals
    return df

def generate_canonical_features(df_rain: pd.DataFrame, stations_df: pd.DataFrame, static_nc_path: str, dyn_nc_path: str) -> pd.DataFrame:
    """
    Complete canonical feature pipeline from Phase 7D.
    Takes 1h rainfall, station metadata, and grid paths, and returns the full feature set.
    """
    df = compute_rolling_rainfall(df_rain)
    df = apply_terrain_features(df, stations_df, static_nc_path)
    df = apply_soil_features(df, stations_df, dyn_nc_path)
    return df
