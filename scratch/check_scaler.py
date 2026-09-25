import xarray as xr
import os

scaler_path = r"D:\Github\JAL_DRISTI_TEAM_READY_2026-09\scripts\google_flood_forecasting\pretrained-models\google-floodhub-settings-55-epochs-nse-filtered-0.5-85-epochs\scaler.nc"

ds = xr.open_dataset(scaler_path)
print("Center for streamflow:", ds['streamflow'].sel(parameter='center').values)
print("Scale for streamflow:", ds['streamflow'].sel(parameter='scale').values)
