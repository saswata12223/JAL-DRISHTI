"""

Phase 8.3 — Proposed Future Nowcasting Feature Specifications



DESIGN PROPOSAL ONLY.

These features are defined as candidate inputs for future model iterations.

They are STRICTLY ISOLATED and NOT added to the Phase 4 34-feature production contract.

"""



from typing import Dict, Any, List



CANDIDATE_NOWCAST_FEATURES: Dict[str, Dict[str, Any]] = {

    "nowcast_rain_15min": {

        "description": "Advection-nowcasted 15-minute precipitation depth",

        "units": "mm",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "nowcast_rain_30min": {

        "description": "Advection-nowcasted 30-minute precipitation depth",

        "units": "mm",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "nowcast_rain_45min": {

        "description": "Advection-nowcasted 45-minute precipitation depth",

        "units": "mm",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "nowcast_rain_60min": {

        "description": "Advection-nowcasted 60-minute precipitation depth",

        "units": "mm",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "nowcast_max_intensity": {

        "description": "Maximum nowcasted rainfall intensity in the 0-60 min horizon",

        "units": "mm/hr",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "nowcast_accumulation": {

        "description": "Total 1-hour advection-nowcasted cumulative rainfall",

        "units": "mm",

        "dtype": "float32",

        "category": "proposed_nowcast_input",

    },

    "rain_motion_speed": {

        "description": "Estimated optical-flow rain-cell advection speed",

        "units": "km/h",

        "dtype": "float32",

        "category": "proposed_motion_input",

    },

    "rain_motion_direction": {

        "description": "Estimated optical-flow rain-cell advection compass heading",

        "units": "degrees (0-360)",

        "dtype": "float32",

        "category": "proposed_motion_input",

    },

}





def get_proposed_feature_manifest() -> List[str]:

    """Returns list of proposed candidate nowcasting feature names."""

    return list(CANDIDATE_NOWCAST_FEATURES.keys())
