"""

Phase 8.3 — Nowcasting Verification & Baseline Benchmarking Module



Calculates continuous (MAE, RMSE) and categorical (CSI, POD, FAR) verification metrics

comparing pySTEPS nowcasts against actual future GPM observation fields and against

a Persistence baseline.

"""



from typing import Dict, Any, List, Optional

import numpy as np





def calculate_mae(predicted: np.ndarray, observed: np.ndarray) -> float:

    """Calculates Mean Absolute Error (MAE)."""

    return float(np.mean(np.abs(predicted - observed)))





def calculate_rmse(predicted: np.ndarray, observed: np.ndarray) -> float:

    """Calculates Root Mean Squared Error (RMSE)."""

    return float(np.sqrt(np.mean((predicted - observed) ** 2)))





def calculate_categorical_scores(

    predicted: np.ndarray, observed: np.ndarray, threshold: float = 0.5

) -> Dict[str, float]:

    """Calculates CSI, POD, and FAR at a specified precipitation threshold (mm/hr).



    Returns:

        Dict with 'csi', 'pod', 'far', 'hits', 'false_alarms', 'misses', 'correct_negatives'

    """

    pred_mask = predicted >= threshold

    obs_mask = observed >= threshold



    hits = int(np.sum(pred_mask & obs_mask))

    false_alarms = int(np.sum(pred_mask & ~obs_mask))

    misses = int(np.sum(~pred_mask & obs_mask))

    correct_negs = int(np.sum(~pred_mask & ~obs_mask))



    csi_denom = hits + false_alarms + misses

    csi = float(hits / csi_denom) if csi_denom > 0 else 0.0



    pod_denom = hits + misses

    pod = float(hits / pod_denom) if pod_denom > 0 else 0.0



    far_denom = hits + false_alarms

    far = float(false_alarms / far_denom) if far_denom > 0 else 0.0



    return {

        "threshold_mmh": threshold,

        "csi": round(csi, 4),

        "pod": round(pod, 4),

        "far": round(far, 4),

        "hits": hits,

        "false_alarms": false_alarms,

        "misses": misses,

        "correct_negatives": correct_negs,

    }





class NowcastVerifier:

    """Benchmarking engine comparing pySTEPS nowcasts against Persistence and actual Future Observations."""



    def __init__(self, thresholds: List[float] = [0.1, 0.5, 1.0, 2.5]):

        self.thresholds = thresholds



    def evaluate_forecast_vs_actual(

        self,

        pysteps_forecast: np.ndarray,

        actual_observation: np.ndarray,

        persistence_forecast: np.ndarray,

        lead_time_min: int,

    ) -> Dict[str, Any]:

        """Evaluates pySTEPS nowcast and Persistence baseline against the ground-truth future observation field.



        Args:

            pysteps_forecast: 2D array pySTEPS predicted precipitation field

            actual_observation: 2D array actual observed precipitation field at t+h

            persistence_forecast: 2D array persistence predicted precipitation field (observation at t)

            lead_time_min: Forecast horizon lead time in minutes



        Returns:

            Dict containing detailed verification scores and baseline comparison flags

        """

        # pySTEPS metrics

        ps_mae = calculate_mae(pysteps_forecast, actual_observation)

        ps_rmse = calculate_rmse(pysteps_forecast, actual_observation)

        ps_cat = {

            t: calculate_categorical_scores(pysteps_forecast, actual_observation, t)

            for t in self.thresholds

        }



        # Persistence metrics

        pers_mae = calculate_mae(persistence_forecast, actual_observation)

        pers_rmse = calculate_rmse(persistence_forecast, actual_observation)

        pers_cat = {

            t: calculate_categorical_scores(persistence_forecast, actual_observation, t)

            for t in self.thresholds

        }



        # Baseline comparison flags

        beats_persistence_mae = ps_mae < pers_mae

        beats_persistence_rmse = ps_rmse < pers_rmse



        return {

            "lead_time_min": lead_time_min,

            "pysteps": {

                "mae": round(ps_mae, 4),

                "rmse": round(ps_rmse, 4),

                "categorical": ps_cat,

            },

            "persistence": {

                "mae": round(pers_mae, 4),

                "rmse": round(pers_rmse, 4),

                "categorical": pers_cat,

            },

            "comparison": {

                "mae_diff_pysteps_minus_pers": round(ps_mae - pers_mae, 4),

                "rmse_diff_pysteps_minus_pers": round(ps_rmse - pers_rmse, 4),

                "beats_persistence_mae": beats_persistence_mae,

                "beats_persistence_rmse": beats_persistence_rmse,

            },

        }
