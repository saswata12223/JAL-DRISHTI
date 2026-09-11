import xarray as xr
import matplotlib.pyplot as plt

FILE = r"C:\JAL DRISTI\data\raw\GPM_20260827_0000_0030_uttarakhand.nc4"

ds = xr.open_dataset(FILE)

rain = ds["precipitation"].isel(time=0)

plt.figure(figsize=(10, 7))

rain.T.plot(
    x="lon",
    y="lat",
    cmap="Blues",
    cbar_kwargs={
        "label": "Precipitation Rate (mm/hr)"
    }
)

plt.title("NASA GPM IMERG Early Rainfall\nUttarakhand Region — 27 Aug 2026 00:00 UTC")
plt.xlabel("Longitude")
plt.ylabel("Latitude")

plt.tight_layout()

output = r"C:\JAL DRISTI\data\processed\gpm_rainfall_map.png"

plt.savefig(output, dpi=200)

print("Map saved to:")
print(output)

plt.show()

ds.close()