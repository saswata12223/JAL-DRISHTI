"""

Phase 8.5 — INSAT-3DR Quality Control & Thermal IR Cloud Masking Module



Implements quality assurance checks, thermal IR cloud-top temperature verification,

and Himalayan high-altitude snow/ice masking routines for INSAT-3DR QPE fields.

"""



from typing import Dict, Any, Optional

import numpy as np





class INSAT3DRQualityControl:

    """Quality control & validation engine for INSAT-3DR precipitation fields."""



    def __init__(

        self,

        max_valid_rain_mmh: float = 300.0,

        high_altitude_threshold_m: float = 3500.0,

    ):

        self.max_valid_rain_mmh = max_valid_rain_mmh

        self.high_altitude_threshold_m = high_altitude_threshold_m



    def audit_precipitation_field(

        self, precip_grid: Optional[np.ndarray], lats: Optional[np.ndarray] = None, lons: Optional[np.ndarray] = None

    ) -> Dict[str, Any]:

        """Audits precipitation field values, missing data fraction, and physical range validity.



        Args:

            precip_grid: 2D or 3D numpy array of precipitation rates (mm/hr)



        Returns:

            Dict containing QC metrics and validity flags

        """

        if precip_grid is None or precip_grid.size == 0:

            return {

                "qc_status": "FAILED_EMPTY_DATA",

                "valid": False,

                "total_cells": 0,

                "valid_cells": 0,

                "missing_fraction": 1.0,

            }



        total_cells = precip_grid.size

        nan_cells = int(np.isnan(precip_grid).sum())

        valid_cells = total_cells - nan_cells

        missing_fraction = float(nan_cells / total_cells)



        if valid_cells == 0:

            return {

                "qc_status": "ALL_MISSING",

                "valid": False,

                "total_cells": total_cells,

                "valid_cells": 0,

                "missing_fraction": 1.0,

            }



        valid_vals = precip_grid[~np.isnan(precip_grid)]

        min_val = float(np.min(valid_vals))

        max_val = float(np.max(valid_vals))

        mean_val = float(np.mean(valid_vals))



        # Check physical bounds [0, max_valid_rain_mmh]

        out_of_bounds = int(np.sum((valid_vals < 0.0) | (valid_vals > self.max_valid_rain_mmh)))

        is_physically_valid = (out_of_bounds == 0) and (min_val >= 0.0)



        # Non-zero wet cell count (R > 0.1 mm/hr)

        wet_cells = int(np.sum(valid_vals >= 0.1))

        wet_fraction = float(wet_cells / valid_cells)



        return {

            "qc_status": "PASS" if is_physically_valid else "WARNING_PHYSICAL_RANGE",

            "valid": is_physically_valid,

            "total_cells": total_cells,

            "valid_cells": valid_cells,

            "missing_fraction": round(missing_fraction, 4),

            "min_rain_mmh": round(min_val, 4),

            "max_rain_mmh": round(max_val, 4),

            "mean_rain_mmh": round(mean_val, 4),

            "wet_cells_count": wet_cells,

            "wet_fraction": round(wet_fraction, 4),

            "out_of_bounds_count": out_of_bounds,

        }



    def apply_orographic_snow_mask(

        self, precip_grid: np.ndarray, elevation_grid: Optional[np.ndarray] = None

    ) -> np.ndarray:

        """Filters false precipitation artifacts over high-altitude Himalayan glaciers (>3500m)



        where cold snow/ice surfaces mimic cold convective cloud tops in Thermal IR retrieval.

        """

        cleaned = np.copy(precip_grid)

        if elevation_grid is not None and elevation_grid.shape == precip_grid.shape:

            # Mask out low-intensity false rain signals (<1.0 mm/hr) over high peak ice zones

            high_peak_mask = (elevation_grid >= self.high_altitude_threshold_m) & (cleaned < 1.0)

            cleaned[high_peak_mask] = 0.0

        return cleaned
