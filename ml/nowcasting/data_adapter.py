"""

Phase 8.3 — pySTEPS Nowcasting Data Adapter



Loads, validates, and transforms real NASA GPM IMERG Early precipitation observation fields

into pySTEPS-compatible 3D matrix representation (time, lat, lon).

"""



import re

import glob

from pathlib import Path

from datetime import datetime, timedelta, timezone

from typing import List, Tuple, Dict, Any, Optional



import numpy as np

import xarray as xr





class GPMDataSequenceAdapter:

    """Adapter for converting raw GPM IMERG NC4 granules into temporal precipitation sequences."""



    def __init__(self, data_dir: Path):

        self.data_dir = Path(data_dir)

        self._granule_files: List[Tuple[datetime, Path]] = []

        self._scan_files()



    def _scan_files(self):

        """Scans and parses GPM IMERG NC4 granules ordered by UTC timestamp."""

        nc_files = sorted(glob.glob(str(self.data_dir / "*.nc4")))

        parsed = []

        for filepath in nc_files:

            filename = Path(filepath).name

            match = re.search(r"(\d{8})-S(\d{6})", filename)

            if match:

                d_str, t_str = match.groups()

                dt = datetime.strptime(f"{d_str}{t_str}", "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)

                parsed.append((dt, Path(filepath)))

        parsed.sort(key=lambda x: x[0])

        self._granule_files = parsed



    @property

    def total_frames(self) -> int:

        return len(self._granule_files)



    @property

    def timestamps(self) -> List[datetime]:

        return [dt for dt, _ in self._granule_files]



    def get_time_range(self) -> Tuple[Optional[datetime], Optional[datetime]]:

        if not self._granule_files:

            return None, None

        return self._granule_files[0][0], self._granule_files[-1][0]



    def load_sequence_slice(

        self, start_idx: int = 0, num_frames: int = 10

    ) -> Dict[str, Any]:

        """Loads a slice of consecutive precipitation fields.



        Returns:

            Dict containing:

                - 'precipitation': np.ndarray shape (time, lat, lon) in mm/hr

                - 'timestamps': List[datetime]

                - 'lats': np.ndarray shape (lat,)

                - 'lons': np.ndarray shape (lon,)

                - 'dt_minutes': float (e.g. 30.0)

        """

        if start_idx < 0 or start_idx >= len(self._granule_files):

            raise IndexError(f"start_idx {start_idx} out of range [0, {len(self._granule_files)-1}].")



        end_idx = min(start_idx + num_frames, len(self._granule_files))

        selected_files = self._granule_files[start_idx:end_idx]



        frames = []

        slice_timestamps = []

        lats = None

        lons = None



        for dt, filepath in selected_files:

            with xr.open_dataset(filepath) as ds:

                # GPM V07 Dataset shape in nc4: (lon, lat)

                precip = ds["precipitation"].values

                if lats is None:

                    lats = ds["lat"].values

                    lons = ds["lon"].values



                # Replace NaNs or negative invalid retrieval values with 0.0

                precip = np.nan_to_num(precip, nan=0.0)

                precip = np.maximum(precip, 0.0)



                # Transpose (lon, lat) -> (lat, lon) for standard spatial mapping (y, x)

                precip_lat_lon = np.transpose(precip)

                frames.append(precip_lat_lon)

                slice_timestamps.append(dt)



        precip_3d = np.array(frames, dtype=np.float32)



        # Check temporal spacing

        dt_minutes = 30.0

        if len(slice_timestamps) > 1:

            diffs = [(slice_timestamps[i] - slice_timestamps[i-1]).total_seconds() / 60.0

                     for i in range(1, len(slice_timestamps))]

            dt_minutes = float(np.median(diffs))



        return {

            "precipitation": precip_3d,

            "timestamps": slice_timestamps,

            "lats": lats,

            "lons": lons,

            "dt_minutes": dt_minutes,

            "units": "mm/hr",

            "source": "NASA GPM IMERG Early",

        }
