"""

Phase 8.3 — pySTEPS Nowcasting & Motion Estimation Module



Implements optical-flow advection nowcasting algorithms (Farneback / Lucas-Kanade

optical flow + semi-Lagrangian backward extrapolation) for short-term (+15m to +60m)

precipitation nowcasting over Uttarakhand.

"""



import math

from typing import Dict, Any, Tuple, Optional, List



import numpy as np

import scipy.ndimage as ndimage

try:

    import cv2

except ImportError:

    cv2 = None





class OpticalFlowNowcaster:

    """Optical flow precipitation nowcasting model."""



    def __init__(self, dt_minutes: float = 30.0, grid_res_km: float = 10.0):

        self.dt_minutes = dt_minutes

        self.grid_res_km = grid_res_km



    def estimate_motion(

        self, frame_t_prev: np.ndarray, frame_t_curr: np.ndarray

    ) -> Dict[str, Any]:

        """Estimates advection velocity vectors (u, v) using Farneback optical flow.



        Args:

            frame_t_prev: 2D array (lat, lon) precipitation rate at t-1

            frame_t_curr: 2D array (lat, lon) precipitation rate at t



        Returns:

            Dict containing:

                - 'u': 2D array horizontal velocity (pixels/frame, +east)

                - 'v': 2D array vertical velocity (pixels/frame, +south in array, +north physically)

                - 'motion_speed_kmh': float mean speed in km/h

                - 'motion_direction_deg': float mean compass direction in degrees (0=N, 90=E)

        """

        if frame_t_prev.shape != frame_t_curr.shape:

            raise ValueError(f"Shape mismatch: {frame_t_prev.shape} vs {frame_t_curr.shape}")



        ny, nx = frame_t_curr.shape



        # Normalize precipitation fields using log transform ln(1 + R) for optical flow stability

        img_prev = np.log1p(np.maximum(frame_t_prev, 0.0))

        img_curr = np.log1p(np.maximum(frame_t_curr, 0.0))



        max_val = max(np.max(img_prev), np.max(img_curr), 1e-5)

        img_prev_8u = np.uint8(np.clip(img_prev / max_val * 255.0, 0, 255))

        img_curr_8u = np.uint8(np.clip(img_curr / max_val * 255.0, 0, 255))



        if cv2 is not None:

            # OpenCV Farneback Optical Flow

            flow = cv2.calcOpticalFlowFarneback(

                img_prev_8u, img_curr_8u, None,

                pyr_scale=0.5, levels=3, winsize=7,

                iterations=5, poly_n=5, poly_sigma=1.2, flags=0

            )

            u = flow[..., 0]  # dx (columns, east)

            v = flow[..., 1]  # dy (rows, south in matrix)

        else:

            # Fallback gradient optical flow when OpenCV is absent

            dy, dx = np.gradient(img_curr_8u)

            dt = img_curr_8u.astype(float) - img_prev_8u.astype(float)

            denom = dx**2 + dy**2 + 1e-3

            u = -dt * dx / denom

            v = -dt * dy / denom



        # Calculate physical motion speed & direction

        dt_hours = self.dt_minutes / 60.0

        u_kmh = (u * self.grid_res_km) / dt_hours

        v_kmh = (-v * self.grid_res_km) / dt_hours  # negate v so +north is positive



        speed_grid = np.sqrt(u_kmh**2 + v_kmh**2)

        mean_speed = float(np.mean(speed_grid))



        mean_u = float(np.mean(u_kmh))

        mean_v = float(np.mean(v_kmh))

        dir_rad = math.atan2(mean_u, mean_v)  # compass angle relative to North

        mean_dir = math.degrees(dir_rad) % 360.0



        return {

            "u": u,

            "v": v,

            "motion_speed_kmh": mean_speed,

            "motion_direction_deg": mean_dir,

            "mean_u_kmh": mean_u,

            "mean_v_kmh": mean_v,

        }



    def forecast(

        self,

        frame_latest: np.ndarray,

        motion: Dict[str, Any],

        lead_times_minutes: List[int] = [15, 30, 45, 60],

    ) -> Dict[int, np.ndarray]:

        """Generates deterministic nowcasts using semi-Lagrangian backward extrapolation.



        Args:

            frame_latest: 2D array (lat, lon) latest observed precipitation field

            motion: Motion dict returned by estimate_motion()

            lead_times_minutes: List of forecast horizons in minutes



        Returns:

            Dict mapping lead_time_min -> 2D forecast array (lat, lon) in mm/hr

        """

        u = motion["u"]

        v = motion["v"]

        ny, nx = frame_latest.shape



        grid_y, grid_x = np.indices((ny, nx), dtype=np.float32)



        forecasts = {}

        for lead_min in lead_times_minutes:

            steps = lead_min / self.dt_minutes  # step multiplier relative to dt



            # Backward displacement

            src_x = grid_x - steps * u

            src_y = grid_y - steps * v



            # Map coordinates with nearest/linear interpolation

            forecast_field = ndimage.map_coordinates(

                frame_latest, [src_y, src_x], order=1, mode="nearest"

            )

            forecast_field = np.maximum(forecast_field, 0.0).astype(np.float32)

            forecasts[lead_min] = forecast_field



        return forecasts
