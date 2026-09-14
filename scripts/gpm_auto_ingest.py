"""

Automatic NASA GPM IMERG Early ingestion



Downloads IMERG Early half-hourly files for a specified time range,

crops them to the Uttarakhand bounding box, and stores NetCDF files

in data/raw.



Run:

    python scripts\\gpm_auto_ingest.py

"""



import os

import sys

from pathlib import Path



try:

    import earthaccess

except ImportError:

    earthaccess = None



try:

    import h5py

except ImportError:

    h5py = None



try:

    import xarray as xr

except ImportError:

    xr = None



try:

    from dotenv import load_dotenv

except ImportError:

    load_dotenv = None



import numpy as np

import argparse



# ============================================================

# CONFIGURATION & CLI ARGUMENTS

# ============================================================



parser = argparse.ArgumentParser(description="NASA GPM IMERG Early Ingestion")

parser.add_argument("--start-date", type=str, default=None, help="Start date (YYYY-MM-DD or ISO string)")

parser.add_argument("--end-date", type=str, default=None, help="End date (YYYY-MM-DD or ISO string)")

args = parser.parse_args()



PROJECT_DIR = Path(__file__).resolve().parent.parent



# Automatically load project-root .env if available

if load_dotenv:

    dotenv_file = PROJECT_DIR / ".env"

    if dotenv_file.exists():

        load_dotenv(dotenv_file)

    else:

        load_dotenv()



RAW_DIR = PROJECT_DIR / "data" / "raw"

RAW_DIR.mkdir(parents=True, exist_ok=True)



# Uttarakhand / surrounding region

WEST = 77.8

EAST = 81.1

SOUTH = 28.5

NORTH = 31.5



# Target window fallback (August 30–31, 2026)

START_TIME = args.start_date if args.start_date else "2026-08-30T00:00:00"

END_TIME = args.end_date if args.end_date else "2026-08-31T23:59:59"



if len(START_TIME) == 10:

    START_TIME = f"{START_TIME}T00:00:00"

if len(END_TIME) == 10:

    END_TIME = f"{END_TIME}T23:59:59"





# ============================================================

# NASA LOGIN

# ============================================================



print("=" * 60)

print("NASA GPM IMERG AUTOMATIC INGESTION")

print("=" * 60)



if earthaccess is None:

    print("ERROR: 'earthaccess' module is not installed in the environment.")

    print("STATUS: FAILED / MODULE_MISSING (earthaccess required for GPM Earthdata access)")

    sys.exit(1)



print("Logging into NASA Earthdata...")



# Non-interactive check: verify environment or netrc credentials exist

username = os.getenv("EARTHDATA_USERNAME")

password = os.getenv("EARTHDATA_PASSWORD")

token = os.getenv("EARTHDATA_TOKEN")

home_netrc = Path(os.path.expanduser("~")) / ".netrc"

home_win_netrc = Path(os.path.expanduser("~")) / "_netrc"



if not (username and password) and not token and not home_netrc.exists() and not home_win_netrc.exists():

    print("ERROR: NASA Earthdata credentials not configured.")

    print("STATUS: FAILED / AUTH_REQUIRED (Set EARTHDATA_USERNAME and EARTHDATA_PASSWORD in environment or .netrc)")

    sys.exit(1)



try:

    auth = earthaccess.login(strategy="environment")

except Exception:

    try:

        auth = earthaccess.login(strategy="netrc")

    except Exception as e:

        print(f"ERROR: NASA Earthdata login failed: {e}")

        print("STATUS: FAILED / AUTH_REQUIRED")

        sys.exit(1)



if not auth or not auth.authenticated:

    print("ERROR: NASA Earthdata authentication failed.")

    print("STATUS: FAILED / AUTH_REQUIRED")

    sys.exit(1)



print("NASA Earthdata login successful.")





# ============================================================

# SEARCH IMERG EARLY

# ============================================================



print("\nSearching GPM IMERG Early...")



results = earthaccess.search_data(

    short_name="GPM_3IMERGHHE",

    version="07",

    temporal=(START_TIME, END_TIME),

)



print(f"Files found: {len(results)}")



if not results:

    print("No GPM files found.")

    sys.exit(0)





# ============================================================

# AUTHENTICATED HTTP SESSION

# ============================================================



session = earthaccess.get_requests_https_session()





# ============================================================

# DOWNLOAD + SPATIAL SUBSET

# ============================================================



downloaded = 0

skipped = 0

failed = 0





for index, granule in enumerate(results, start=1):



    print("\n" + "-" * 60)

    print(f"Processing {index}/{len(results)}")



    # --------------------------------------------------------

    # NASA DATA URL

    # --------------------------------------------------------



    data_links = granule.data_links()



    if not data_links:

        print("No data URL found.")

        failed += 1

        continue



    url = data_links[0]



    print("NASA URL:")

    print(url)



    # --------------------------------------------------------

    # FILE NAMES

    # --------------------------------------------------------



    original_name = Path(url).name



    base_name = original_name.replace(".HDF5", "")



    output_name = f"{base_name}.nc4"



    output_file = RAW_DIR / output_name



    if output_file.exists():

        print(f"Already exists: {output_file.name}")

        skipped += 1

        continue



    temp_file = RAW_DIR / original_name



    try:



        # ====================================================

        # DOWNLOAD

        # ====================================================



        print("\nDownloading original GPM granule...")



        with session.get(

            url,

            stream=True,

            timeout=180

        ) as response:



            response.raise_for_status()



            total = int(

                response.headers.get("content-length", 0)

            )



            received = 0



            with open(temp_file, "wb") as f:



                for chunk in response.iter_content(

                    chunk_size=1024 * 1024

                ):



                    if chunk:



                        f.write(chunk)

                        received += len(chunk)



                        if total:



                            percent = (

                                received / total * 100

                            )



                            print(

                                f"\rProgress: {percent:6.2f}%",

                                end=""

                            )



        print("\nDownload complete.")





        # ====================================================

        # READ HDF5

        # ====================================================



        print("Reading GPM HDF5 file...")



        with h5py.File(temp_file, "r") as h5:



            # -----------------------------------------------

            # GPM Grid group

            # -----------------------------------------------



            if "Grid" not in h5:

                raise RuntimeError(

                    "Grid group not found in GPM HDF5 file."

                )



            grid = h5["Grid"]



            print("Available Grid datasets:")



            for name in grid.keys():

                print(f"  - {name}")



            # -----------------------------------------------

            # Read variables

            # -----------------------------------------------



            precipitation = grid["precipitation"][:]

            lat = grid["lat"][:]

            lon = grid["lon"][:]



            # -----------------------------------------------

            # Remove time dimension

            # -----------------------------------------------



            print(

                f"Original precipitation shape: "

                f"{precipitation.shape}"

            )



            if precipitation.ndim == 3:

                precipitation = precipitation[0]



            print(

                f"Latitude shape: {lat.shape}"

            )



            print(

                f"Longitude shape: {lon.shape}"

            )



            print(

                f"Precipitation shape after "

                f"time removal: {precipitation.shape}"

            )



            # =================================================

            # IMPORTANT:

            #

            # GPM IMERG V07 grid is:

            #

            # precipitation = (longitude, latitude)

            #

            # Therefore:

            #

            # axis 0 = longitude

            # axis 1 = latitude

            # =================================================



            if precipitation.shape != (

                len(lon),

                len(lat)

            ):

                raise RuntimeError(

                    "Unexpected precipitation dimensions.\n"

                    f"Precipitation: {precipitation.shape}\n"

                    f"Longitude: {len(lon)}\n"

                    f"Latitude: {len(lat)}"

                )



            # =================================================

            # FIND SPATIAL INDICES

            # =================================================



            print("\nCropping to Uttarakhand region...")



            lon_indices = np.where(

                (lon >= WEST) &

                (lon <= EAST)

            )[0]



            lat_indices = np.where(

                (lat >= SOUTH) &

                (lat <= NORTH)

            )[0]



            if len(lon_indices) == 0:

                raise RuntimeError(

                    "No longitude points found "

                    "inside bounding box."

                )



            if len(lat_indices) == 0:

                raise RuntimeError(

                    "No latitude points found "

                    "inside bounding box."

                )



            print(

                f"Longitude points selected: "

                f"{len(lon_indices)}"

            )



            print(

                f"Latitude points selected: "

                f"{len(lat_indices)}"

            )



            # =================================================

            # SUBSET

            # =================================================



            subset_precipitation = precipitation[

                np.ix_(

                    lon_indices,

                    lat_indices

                )

            ]



            subset_lon = lon[lon_indices]

            subset_lat = lat[lat_indices]



            print(

                "Subset precipitation shape: "

                f"{subset_precipitation.shape}"

            )



            print(

                f"Subset longitude: "

                f"{subset_lon.min()} to "

                f"{subset_lon.max()}"

            )



            print(

                f"Subset latitude: "

                f"{subset_lat.min()} to "

                f"{subset_lat.max()}"

            )



            # =================================================

            # CREATE XARRAY DATASET

            # =================================================



            ds = xr.Dataset(

                {

                    "precipitation": (

                        ("lon", "lat"),

                        subset_precipitation

                    )

                },

                coords={

                    "lon": subset_lon,

                    "lat": subset_lat

                },

                attrs={

                    "source": "NASA GPM IMERG Early",

                    "product": "GPM_3IMERGHHE",

                    "version": "07",

                    "region": "Uttarakhand",

                    "west": WEST,

                    "east": EAST,

                    "south": SOUTH,

                    "north": NORTH

                }

            )



            # =================================================

            # SAVE

            # =================================================



            ds.to_netcdf(output_file)



            ds.close()



            print(

                f"\nSaved: {output_file}"

            )



        # ====================================================

        # DELETE TEMPORARY HDF5

        # ====================================================



        temp_file.unlink(missing_ok=True)



        downloaded += 1



        print("Processing successful.")



    except Exception as e:



        print(f"\nERROR: {e}")



        temp_file.unlink(missing_ok=True)



        failed += 1





# ============================================================

# SUMMARY

# ============================================================



print("\n" + "=" * 60)

print("GPM INGESTION COMPLETE")

print("=" * 60)



print(f"Downloaded : {downloaded}")

print(f"Skipped    : {skipped}")

print(f"Failed     : {failed}")



print("\nRaw directory:")

print(RAW_DIR)
