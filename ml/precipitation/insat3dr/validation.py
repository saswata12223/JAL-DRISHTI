"""

Phase 8.5 — INSAT-3DR Ground Validation Module



Validates INSAT-3DR precipitation estimates against independent ground station observations

from the IMD weather network (157 stations in Uttarakhand).

"""



from typing import Dict, Any, List, Optional

import numpy as np

import pandas as pd





class INSAT3DRGroundValidator:

    """Validator evaluating INSAT-3DR against IMD ground station observations."""



    def __init__(self, rain_threshold_mmh: float = 0.5):

        self.rain_threshold_mmh = rain_threshold_mmh



    def evaluate_station_match(

        self,

        insat_estimates: np.ndarray,

        station_observations: np.ndarray,

    ) -> Dict[str, Any]:

        """Calculates point-to-grid verification metrics against IMD ground observations.



        Args:

            insat_estimates: 1D numpy array of INSAT-3DR precipitation estimates at station locations

            station_observations: 1D numpy array of ground station observed rainfall



        Returns:

            Dict containing correlation, MAE, RMSE, POD, FAR, CSI

        """

        # Filter valid non-NaN pairs

        mask = ~np.isnan(insat_estimates) & ~np.isnan(station_observations)

        if np.sum(mask) < 2:

            return {

                "status": "INSUFFICIENT_PAIRS",

                "paired_count": int(np.sum(mask)),

                "correlation": None,

                "mae": None,

                "rmse": None,

                "csi": None,

            }



        est = insat_estimates[mask]

        obs = station_observations[mask]



        mae = float(np.mean(np.abs(est - obs)))

        rmse = float(np.sqrt(np.mean((est - obs) ** 2)))

        bias = float(np.mean(est - obs))



        # Pearson correlation

        if np.std(est) > 1e-6 and np.std(obs) > 1e-6:

            corr = float(np.corrcoef(est, obs)[0, 1])

        else:

            corr = 0.0



        # Categorical contingency scores at threshold

        est_rain = est >= self.rain_threshold_mmh

        obs_rain = obs >= self.rain_threshold_mmh



        hits = int(np.sum(est_rain & obs_rain))

        false_alarms = int(np.sum(est_rain & ~obs_rain))

        misses = int(np.sum(~est_rain & obs_rain))

        correct_negs = int(np.sum(~est_rain & ~obs_rain))



        csi_denom = hits + false_alarms + misses

        csi = float(hits / csi_denom) if csi_denom > 0 else 0.0



        pod_denom = hits + misses

        pod = float(hits / pod_denom) if pod_denom > 0 else 0.0



        far_denom = hits + false_alarms

        far = float(false_alarms / far_denom) if far_denom > 0 else 0.0



        return {

            "status": "VALIDATED",

            "paired_count": int(np.sum(mask)),

            "mae": round(mae, 4),

            "rmse": round(rmse, 4),

            "bias": round(bias, 4),

            "correlation": round(corr, 4),

            "threshold_mmh": self.rain_threshold_mmh,

            "csi": round(csi, 4),

            "pod": round(pod, 4),

            "far": round(far, 4),

            "hits": hits,

            "false_alarms": false_alarms,

            "misses": misses,

            "correct_negatives": correct_negs,

        }
