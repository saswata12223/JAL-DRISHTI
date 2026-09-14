"""

Phase 8.5 — INSAT-3DR vs GPM Multi-Satellite Comparison Module



Performs non-production grid regridding and comparative statistical analysis between

INSAT-3DR (4km / 15m) and NASA GPM IMERG (10km / 30m) precipitation products over Uttarakhand.

"""



from typing import Dict, Any, Tuple, Optional

import numpy as np

import scipy.ndimage as ndimage





class INSATvsGPMComparator:

    """Comparative analysis engine comparing INSAT-3DR and GPM IMERG precipitation fields."""



    def __init__(self, insat_res_km: float = 4.0, gpm_res_km: float = 10.0):

        self.insat_res_km = insat_res_km

        self.gpm_res_km = gpm_res_km



    def regrid_gpm_to_insat(

        self, gpm_grid: np.ndarray, target_shape: Tuple[int, int]

    ) -> np.ndarray:

        """Regrids a 10km GPM matrix to match 4km INSAT grid dimensions via bilinear interpolation."""

        if gpm_grid.shape == target_shape:

            return gpm_grid



        sy = target_shape[0] / gpm_grid.shape[0]

        sx = target_shape[1] / gpm_grid.shape[1]

        regridded = ndimage.zoom(gpm_grid, (sy, sx), order=1)

        return np.maximum(regridded, 0.0).astype(np.float32)



    def calculate_comparative_stats(

        self, insat_grid: np.ndarray, gpm_grid: np.ndarray

    ) -> Dict[str, Any]:

        """Calculates spatial and intensity comparison statistics between INSAT and GPM.



        Args:

            insat_grid: 2D array (ny, nx) 4km INSAT precipitation field

            gpm_grid: 2D array (ny_gpm, nx_gpm) 10km GPM precipitation field



        Returns:

            Dict containing comparative statistics

        """

        # Regrid GPM to INSAT grid for point-by-point comparison

        gpm_regridded = self.regrid_gpm_to_insat(gpm_grid, insat_grid.shape)



        mask = ~np.isnan(insat_grid) & ~np.isnan(gpm_regridded)

        if np.sum(mask) == 0:

            return {

                "status": "NO_OVERLAPPING_VALID_CELLS",

                "insat_mean": None,

                "gpm_mean": None,

            }



        insat_vals = insat_grid[mask]

        gpm_vals = gpm_regridded[mask]



        insat_mean = float(np.mean(insat_vals))

        insat_max = float(np.max(insat_vals))

        insat_var = float(np.var(insat_vals))

        insat_wet = float(np.sum(insat_vals >= 0.1) / len(insat_vals))



        gpm_mean = float(np.mean(gpm_vals))

        gpm_max = float(np.max(gpm_vals))

        gpm_var = float(np.var(gpm_vals))

        gpm_wet = float(np.sum(gpm_vals >= 0.1) / len(gpm_vals))



        mae = float(np.mean(np.abs(insat_vals - gpm_vals)))

        rmse = float(np.sqrt(np.mean((insat_vals - gpm_vals) ** 2)))

        bias = float(np.mean(insat_vals - gpm_vals))



        if np.std(insat_vals) > 1e-6 and np.std(gpm_vals) > 1e-6:

            corr = float(np.corrcoef(insat_vals, gpm_vals)[0, 1])

        else:

            corr = 0.0



        return {

            "status": "SUCCESS",

            "eval_pixels_count": int(np.sum(mask)),

            "insat_resolution_km": self.insat_res_km,

            "gpm_resolution_km": self.gpm_res_km,

            "insat_mean_mmh": round(insat_mean, 4),

            "gpm_mean_mmh": round(gpm_mean, 4),

            "insat_max_mmh": round(insat_max, 4),

            "gpm_max_mmh": round(gpm_max, 4),

            "insat_spatial_variance": round(insat_var, 4),

            "gpm_spatial_variance": round(gpm_var, 4),

            "insat_wet_fraction": round(insat_wet, 4),

            "gpm_wet_fraction": round(gpm_wet, 4),

            "mae_mmh": round(mae, 4),

            "rmse_mmh": round(rmse, 4),

            "bias_mmh": round(bias, 4),

            "spatial_correlation": round(corr, 4),

            "spatial_detail_ratio": round(insat_var / (gpm_var + 1e-6), 2) if gpm_var > 0 else 1.0,

        }
