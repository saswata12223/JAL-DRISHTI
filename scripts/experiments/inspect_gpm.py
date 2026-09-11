import xarray as xr
import os

file_path = r"C:\JAL DRISTI\data\raw\GPM_20260827_0000_0030_uttarakhand.nc4"

print("=" * 60)
print("GPM IMERG NETCDF INSPECTION")
print("=" * 60)

if not os.path.exists(file_path):
    print("ERROR: File not found!")
    exit()

print(f"\nFile: {file_path}")
print(f"Size: {os.path.getsize(file_path):,} bytes")

# Open NetCDF
ds = xr.open_dataset(file_path)

print("\n--- DATASET ---")
print(ds)

print("\n--- VARIABLES ---")
for name in ds.data_vars:
    var = ds[name]
    print(f"\n{name}")
    print(f"  Dimensions : {var.dims}")
    print(f"  Shape      : {var.shape}")
    print(f"  Units      : {var.attrs.get('units', 'Not specified')}")
    print(f"  Long name  : {var.attrs.get('long_name', 'Not specified')}")

print("\n--- COORDINATES ---")
for name in ds.coords:
    coord = ds[name]
    print(f"{name}: {coord.values}")

print("\n--- GLOBAL ATTRIBUTES ---")
for key, value in ds.attrs.items():
    print(f"{key}: {value}")

ds.close()