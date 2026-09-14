"""

FlashFloodAI Backend — Multi-Signal Flood Risk & Decision Engine

Phase 8: Evaluates ML probability, official CWC thresholds, rainfall intensity,

soil saturation, and hydrological physics to produce deterministic, explainable risk decisions.

"""



import json

import logging

from datetime import datetime, timezone

from pathlib import Path

from typing import Any, Dict, List, Optional, Tuple



import numpy as np

import pandas as pd



from app.config import settings

from app.schemas.risk_decision import (

    ContributingFactorSchema,

    RiskAlertItem,

    RiskAlertsResponse,

    RiskDecisionResponse,

    RiskEvaluationRequest,

    RiskPolicySchema,

    RiskSummaryResponse,

)

from app.schemas.predictions import LiveInferenceRequest

from app.services.prediction_service import PredictionService



logger = logging.getLogger("FlashFloodAI.RiskDecisionEngine")





class RiskDecisionEngine:

    """

    Deterministic, auditable Multi-Signal Flood Risk Decision Engine for Uttarakhand.

    Strictly combines:

      1. Approved Phase 6 ML champion model probability (XGBoost 6.1.0)

      2. Official Phase 4 CWC hydrological thresholds (Warning / Danger / HFL)

      3. Atmospheric & environmental conditions (GPM rainfall, SMAP soil moisture, SCS-CN runoff)

      4. Sensor data quality & decision confidence

    """



    POLICY_VERSION = "8.1.0"

    STANDARDS_AUTHORITY = "Central Water Commission (CWC) & Uttarakhand State Disaster Management Authority (USDMA)"

    DECISION_THRESHOLD = 0.40



    _instance = None



    @classmethod

    def get_instance(cls) -> "RiskDecisionEngine":

        if cls._instance is None:

            cls._instance = cls()

        return cls._instance



    def __init__(self):

        project_root = Path(__file__).resolve().parents[3]

        self.data_dir = project_root / "data" / "processed"

        self.prediction_service = PredictionService.get_instance()

        self._cwc_thresholds_cache: Dict[str, Dict[str, Any]] = {}

        self._load_cwc_thresholds()



    def _load_cwc_thresholds(self):

        """Loads verified Phase 4 CWC thresholds for Uttarakhand stations."""

        cwc_file = self.data_dir / "risk" / "flood_thresholds.parquet"

        if cwc_file.exists():

            df_cwc = pd.read_parquet(cwc_file)

            for _, r in df_cwc.iterrows():

                st_id = str(r["station_id"])

                self._cwc_thresholds_cache[st_id] = {

                    "station_id": st_id,

                    "station_name": str(r["station_name"]),

                    "river_name": str(r["river_name"]),

                    "district": str(r["district"]),

                    "latitude": float(r["latitude"]),

                    "longitude": float(r["longitude"]),

                    "warning_level_m": float(r["warning_level_m"]) if pd.notna(r.get("warning_level_m")) else None,

                    "danger_level_m": float(r["danger_level_m"]) if pd.notna(r.get("danger_level_m")) else None,

                    "hfl_m": float(r["hfl_m"]) if pd.notna(r.get("hfl_m")) else None,

                    "gauge_datum_msl_m": float(r["gauge_datum_msl_m"]) if pd.notna(r.get("gauge_datum_msl_m")) else None,

                    "source_agency": str(r.get("source_agency", "CWC")),

                    "source_document": str(r.get("source_document_or_endpoint", "CWC Official Bulletin")),

                }

            logger.info(f"Loaded {len(self._cwc_thresholds_cache)} official CWC station thresholds.")



    # ============================================================

    # DETERMINISTIC SIGNAL EVALUATION

    # ============================================================



    def classify_ml_probability(self, prob: float) -> str:

        """Categorizes ML probability into standard risk bands."""

        if prob < 0.20:

            return "LOW"

        elif prob < self.DECISION_THRESHOLD:

            return "MODERATE"

        elif prob < 0.70:

            return "HIGH"

        else:

            return "EXTREME"



    def evaluate_cwc_threshold_state(

        self,

        water_level_m: Optional[float],

        warning_level_m: Optional[float],

        danger_level_m: Optional[float],

        hfl_m: Optional[float],

    ) -> Tuple[str, str]:

        """

        Deterministically evaluates official CWC threshold exceedance.

        Returns: (cwc_threshold_status, official_alert_stage)

        """

        if water_level_m is None or warning_level_m is None or pd.isna(water_level_m):

            return "UNAVAILABLE", "UNKNOWN"



        if danger_level_m is not None and hfl_m is not None:

            if water_level_m >= hfl_m:

                return "ABOVE_HFL", "RED"

            elif water_level_m >= danger_level_m:

                return "DANGER_ZONE", "ORANGE"

            elif water_level_m >= warning_level_m:

                return "WARNING_ZONE", "YELLOW"

            else:

                return "BELOW_WARNING", "NONE"

        elif danger_level_m is not None:

            if water_level_m >= danger_level_m:

                return "DANGER_ZONE", "ORANGE"

            elif water_level_m >= warning_level_m:

                return "WARNING_ZONE", "YELLOW"

            else:

                return "BELOW_WARNING", "NONE"

        else:

            if water_level_m >= warning_level_m:

                return "WARNING_ZONE", "YELLOW"

            else:

                return "BELOW_WARNING", "NONE"



    def evaluate_environmental_condition(

        self,

        rainfall_1h_mm: Optional[float],

        rainfall_30min_mm: Optional[float],

        soil_saturation_index: Optional[float],

        scs_direct_runoff_q_mm: Optional[float] = None,

    ) -> str:

        """

        Evaluates physical environmental and atmospheric forcing state.

        Returns: NORMAL | WATCH | ESCALATING | CRITICAL

        """

        r1h = rainfall_1h_mm or 0.0

        r30m = rainfall_30min_mm or 0.0

        ssi = soil_saturation_index or 0.0

        q = scs_direct_runoff_q_mm or 0.0



        # Critical: Cloudburst (>=65mm/h or >=40mm/30min) or extreme saturation + heavy rain

        if r1h >= 65.0 or r30m >= 40.0 or (ssi >= 0.90 and r1h >= 35.0) or q >= 35.0:

            return "CRITICAL"

        # Escalating: Heavy rainfall or high saturation with high runoff

        elif r1h >= 30.0 or r30m >= 18.0 or (ssi >= 0.80 and r1h >= 15.0) or q >= 15.0:

            return "ESCALATING"

        # Watch: Moderate rainfall or elevated soil saturation

        elif r1h >= 15.0 or ssi >= 0.65 or q >= 5.0:

            return "WATCH"

        else:

            return "NORMAL"



    # ============================================================

    # MULTI-SIGNAL FUSION & CONFLICT RESOLUTION

    # ============================================================



    def fuse_signals(

        self,

        ml_prob: float,

        ml_class: str,

        cwc_status: str,

        env_condition: str,

        water_level_m: Optional[float] = None,

        rainfall_1h_mm: Optional[float] = None,

        soil_saturation_index: Optional[float] = None,

        scs_direct_runoff_q_mm: Optional[float] = None,

    ) -> Tuple[str, str, str, str, List[ContributingFactorSchema], str, float]:

        """

        Deterministic multi-signal fusion and conflict handling engine.

        Returns:

          (final_risk_class, operational_state, alert_priority, decision_reason, contributing_factors, data_quality_status, decision_confidence)

        """

        contributing_factors: List[ContributingFactorSchema] = []



        # 1. Evaluate ML Factor

        ml_weight = "HIGH" if ml_prob >= 0.40 else "MEDIUM" if ml_prob >= 0.20 else "LOW"

        contributing_factors.append(

            ContributingFactorSchema(

                factor_name="ML_FLOOD_PROBABILITY",

                observed_value=round(ml_prob, 4),

                status_label=ml_class,

                impact_weight=ml_weight,

                explanation=f"XGBoost champion model predicted {ml_prob*100:.1f}% probability of flash flooding.",

            )

        )



        # 2. Evaluate Hydrological / CWC Gauge Factor

        if cwc_status != "UNAVAILABLE":

            cwc_weight = "DOMINANT" if cwc_status in ("DANGER_ZONE", "ABOVE_HFL") else "HIGH" if cwc_status == "WARNING_ZONE" else "MEDIUM"

            contributing_factors.append(

                ContributingFactorSchema(

                    factor_name="CWC_RIVER_GAUGE_STAGE",

                    observed_value=water_level_m,

                    status_label=cwc_status,

                    impact_weight=cwc_weight,

                    explanation=f"Observed river water level is currently in official CWC {cwc_status} state.",

                )

            )

        else:

            contributing_factors.append(

                ContributingFactorSchema(

                    factor_name="CWC_RIVER_GAUGE_STAGE",

                    observed_value=None,

                    status_label="UNAVAILABLE",

                    impact_weight="LOW",

                    explanation="River gauge telemetry is offline or unmonitored at this grid point.",

                )

            )



        # 3. Evaluate Environmental / Rainfall Factor

        if rainfall_1h_mm is not None:

            contributing_factors.append(

                ContributingFactorSchema(

                    factor_name="RAINFALL_INTENSITY",

                    observed_value=round(rainfall_1h_mm, 2),

                    status_label=env_condition,

                    impact_weight="HIGH" if env_condition in ("CRITICAL", "ESCALATING") else "MEDIUM",

                    explanation=f"Observed 1-hour rainfall accumulation is {rainfall_1h_mm:.1f} mm ({env_condition} state).",

                )

            )



        # 4. Evaluate Soil Saturation Factor

        if soil_saturation_index is not None:

            contributing_factors.append(

                ContributingFactorSchema(

                    factor_name="SOIL_SATURATION",

                    observed_value=round(soil_saturation_index, 3),

                    status_label="HIGH_SATURATION" if soil_saturation_index >= 0.80 else "NORMAL",

                    impact_weight="HIGH" if soil_saturation_index >= 0.80 else "LOW",

                    explanation=f"Soil column saturation index is {soil_saturation_index*100:.1f}%, modulating surface infiltration capacity.",

                )

            )



        # 5. Determine Data Quality & Confidence

        if cwc_status != "UNAVAILABLE" and rainfall_1h_mm is not None and soil_saturation_index is not None:

            data_quality = "COMPLETE"

            confidence = 0.95

        elif rainfall_1h_mm is not None and soil_saturation_index is not None:

            data_quality = "PARTIAL"

            confidence = 0.85

        elif rainfall_1h_mm is not None or soil_saturation_index is not None:

            data_quality = "DEGRADED"

            confidence = 0.60

        else:

            data_quality = "UNAVAILABLE"

            confidence = 0.20



        # ============================================================

        # MULTI-SIGNAL CONFLICT RESOLUTION RULES

        # ============================================================



        # RULE 1: CWC ABOVE_HFL (Catastrophic Breach)

        if cwc_status == "ABOVE_HFL":

            final_risk = "EXTREME"

            op_state = "EMERGENCY_RESPONSE"

            alert_priority = "CRITICAL"

            reason = "CRITICAL OVERRIDE: River stage has exceeded historical all-time Highest Flood Level (HFL). Immediate severe flood emergency."



        # RULE 2: CWC DANGER_ZONE (Gauge overrides low weather)

        elif cwc_status == "DANGER_ZONE":

            if ml_class == "EXTREME" or env_condition == "CRITICAL":

                final_risk = "EXTREME"

                op_state = "EMERGENCY_RESPONSE"

                alert_priority = "CRITICAL"

                reason = "Severe multi-signal convergence: River stage breached official Danger Level combined with high ML probability / intense precipitation."

            else:

                final_risk = "HIGH"

                op_state = "PREPAREDNESS_WARNING"

                alert_priority = "WARNING"

                reason = "HYDROLOGICAL OVERRIDE: River water level has breached official CWC Danger Level, superseding local weather indices (potential upstream release/catchment surge)."



        # RULE 3: CWC WARNING_ZONE

        elif cwc_status == "WARNING_ZONE":

            if ml_class in ("HIGH", "EXTREME") or env_condition in ("CRITICAL", "ESCALATING"):

                final_risk = "HIGH"

                op_state = "PREPAREDNESS_WARNING"

                alert_priority = "WARNING"

                reason = "Active warning state: River stage has reached CWC Warning Level accompanied by elevated ML flood probability and heavy rainfall forcing."

            else:

                final_risk = "MODERATE"

                op_state = "ELEVATED_WATCH"

                alert_priority = "WATCH"

                reason = "River stage has reached official CWC Warning Level; local atmospheric forcing is currently moderate."



        # RULE 4: Impending Flash Flood Surge (ML HIGH/EXTREME with CRITICAL/ESCALATING weather while gauge is BELOW_WARNING or UNAVAILABLE)

        elif ml_class in ("HIGH", "EXTREME") and env_condition in ("CRITICAL", "ESCALATING"):

            final_risk = ml_class

            op_state = "EMERGENCY_RESPONSE" if ml_class == "EXTREME" else "PREPAREDNESS_WARNING"

            alert_priority = "CRITICAL" if ml_class == "EXTREME" else "WARNING"

            gauge_desc = "telemetry offline" if cwc_status == "UNAVAILABLE" else "river gauge currently below warning"

            reason = f"IMPENDING FLASH SURGE: Model probability ({ml_prob*100:.1f}%) and intense rainfall forcing ({env_condition}) indicate imminent surface runoff flooding ({gauge_desc})."



        # RULE 5: High Soil Saturation with Moderate Rainfall (Antecedent buildup)

        elif ml_class == "MODERATE" or env_condition == "ESCALATING" or (soil_saturation_index and soil_saturation_index >= 0.85 and rainfall_1h_mm and rainfall_1h_mm >= 15.0):

            final_risk = "MODERATE"

            op_state = "ELEVATED_WATCH"

            alert_priority = "WATCH"

            reason = f"Elevated hydrometeorological watch: High catchment saturation and rainfall runoff potential (ML probability: {ml_prob*100:.1f}%)."



        # RULE 6: High ML probability alone without gauge confirmation (Moderate Escalation)

        elif ml_class in ("HIGH", "EXTREME") and cwc_status == "BELOW_WARNING":

            final_risk = "MODERATE"

            op_state = "ELEVATED_WATCH"

            alert_priority = "WATCH"

            reason = f"Precautionary watch: ML model indicates elevated risk ({ml_prob*100:.1f}%), but river stage remains below warning level."



        # RULE 7: Baseline Normal State

        else:

            final_risk = "LOW"

            op_state = "ROUTINE_MONITORING"

            alert_priority = "INFORMATION"

            reason = f"Normal monsoonal conditions. River stage within channel capacity and ML probability low ({ml_prob*100:.1f}%)."



        return final_risk, op_state, alert_priority, reason, contributing_factors, data_quality, confidence



    def get_recommended_action(self, final_risk_class: str) -> str:

        """Maps final risk class to standard disaster management operating procedures."""

        catalog = {

            "LOW": "Continue routine hydrological and meteorological monitoring. Maintain normal river gauge and weather telemetry poll cycles.",

            "MODERATE": "Increase sensor telemetry polling frequency. Alert local field observers and inspect vulnerable drainage catchments and bridges.",

            "HIGH": "Issue Stage-2 preparedness advisory to District Emergency Operations Centre (DEOC). Inspect vulnerable embankments and deploy emergency response assets to staging areas.",

            "EXTREME": "Activate emergency escalation protocol. Alert SDRF/NDRF and local administration. Prepare and execute immediate evacuation procedures for low-lying floodplain and riparian zones.",

        }

        return catalog.get(final_risk_class, catalog["LOW"])



    # ============================================================

    # ON-DEMAND LIVE EVALUATION

    # ============================================================



    def evaluate_live(self, request: RiskEvaluationRequest) -> RiskDecisionResponse:

        """Performs real-time multi-signal evaluation for on-demand requests."""

        # 1. Run live ML inference with SCS-CN physics

        # Project RiskEvaluationRequest into the narrower LiveInferenceRequest schema

        inference_request = LiveInferenceRequest(

            rainfall_1h_mm=request.rainfall_1h_mm,

            rainfall_30min_mm=request.rainfall_30min_mm,

            rainfall_3h_mm=request.rainfall_3h_mm,

            surface_soil_moisture_vol=request.surface_soil_moisture_vol,

            profile_soil_moisture_vol=request.profile_soil_moisture_vol,

            soil_saturation_index=request.soil_saturation_index,

            elevation_m=request.elevation_m,

            slope_deg=request.slope_deg,

            landcover_class=request.landcover_class,

            district=request.district,

        )

        live_pred = self.prediction_service.predict(inference_request)

        prob = live_pred.probability

        ml_class = self.classify_ml_probability(prob)



        # 2. Check official CWC thresholds if station provided

        warning_m = request.warning_level_m

        danger_m = request.danger_level_m

        hfl_m = request.hfl_m

        thresh_source = "User Supplied"



        if request.station_id and request.station_id in self._cwc_thresholds_cache:

            cached = self._cwc_thresholds_cache[request.station_id]

            warning_m = cached["warning_level_m"]

            danger_m = cached["danger_level_m"]

            hfl_m = cached["hfl_m"]

            thresh_source = cached["source_document"]



        # 3. Evaluate CWC stage status

        cwc_status, alert_stage = self.evaluate_cwc_threshold_state(

            request.water_level_m, warning_m, danger_m, hfl_m

        )



        # 4. Evaluate Environmental condition

        env_condition = self.evaluate_environmental_condition(

            request.rainfall_1h_mm,

            request.rainfall_30min_mm,

            request.soil_saturation_index,

            live_pred.scs_direct_runoff_q_mm,

        )



        # 5. Multi-signal fusion

        final_risk, op_state, alert_prio, reason, factors, dq, conf = self.fuse_signals(

            ml_prob=prob,

            ml_class=ml_class,

            cwc_status=cwc_status,

            env_condition=env_condition,

            water_level_m=request.water_level_m,

            rainfall_1h_mm=request.rainfall_1h_mm,

            soil_saturation_index=request.soil_saturation_index,

            scs_direct_runoff_q_mm=live_pred.scs_direct_runoff_q_mm,

        )



        now = datetime.now(timezone.utc)

        sp_id = request.station_id or f"POINT_{request.latitude:.4f}_{request.longitude:.4f}"



        return RiskDecisionResponse(

            timestamp_utc=now,

            spatial_id=sp_id,

            sample_id=f"LIVE_{now.strftime('%Y%m%d%H%M%S')}_{sp_id}",

            sample_type="live_query",

            station_id=request.station_id,

            station_name=request.station_id or "Custom Location",

            district=request.district or "Dehradun",

            river_name=None,

            major_basin=None,

            latitude=request.latitude or 30.3165,

            longitude=request.longitude or 78.0322,

            model_name="XGBoost_PPT_Upgraded",

            model_version="6.1.0",

            flood_probability=prob,

            ml_risk_class=ml_class,

            ml_decision_threshold=self.DECISION_THRESHOLD,

            water_level_m=request.water_level_m,

            warning_level_m=warning_m,

            danger_level_m=danger_m,

            hfl_m=hfl_m,

            cwc_threshold_status=cwc_status,

            official_alert_stage=alert_stage,

            is_gauge_offline=True if request.water_level_m is None else False,

            rainfall_1h_mm=request.rainfall_1h_mm,

            rainfall_3h_mm=request.rainfall_3h_mm,

            soil_saturation_index=request.soil_saturation_index,

            scs_direct_runoff_q_mm=live_pred.scs_direct_runoff_q_mm,

            scs_peak_runoff_potential=live_pred.scs_direct_runoff_q_mm * 1.25 if live_pred.scs_direct_runoff_q_mm else None,

            environmental_condition=env_condition,

            final_risk_class=final_risk,

            operational_state=op_state,

            alert_priority=alert_prio,

            decision_reason=reason,

            recommended_action=self.get_recommended_action(final_risk),

            contributing_factors=factors,

            data_quality_status=dq,

            decision_confidence=conf,

            risk_policy_version=self.POLICY_VERSION,

            threshold_source=thresh_source,

            generated_at_utc=now,

        )



    # ============================================================

    # ============================================================

    # SYNTHETIC TEST TELEMETRY SIGNATURES (INACTIVE IN PRODUCTION)

    # Preserved for reference & historical audit; NOT used for active risk decisions.

    # ============================================================

    SYNTHETIC_TEST_SIGNATURES_INACTIVE = {

        "CWC_UK_004": {"water_level_m": 1381.85, "rainfall_1h_mm": 68.5, "soil_saturation_index": 0.94, "ml_prob": 0.92},

        "CWC_UK_007": {"water_level_m": 627.20, "rainfall_1h_mm": 52.0, "soil_saturation_index": 0.91, "ml_prob": 0.88},

        "CWC_UK_014": {"water_level_m": 891.20, "rainfall_1h_mm": 61.2, "soil_saturation_index": 0.93, "ml_prob": 0.94},

    }



    # ============================================================

    # DATASET EVALUATION & AGGREGATIONS

    # ============================================================



    def get_latest_decisions(

        self,

        district: Optional[str] = None,

        final_risk_class: Optional[str] = None,

        alert_priority: Optional[str] = None,

        limit: int = 100,

    ) -> List[RiskDecisionResponse]:

        """

        Retrieves and evaluates real live operational state across monitored points in Uttarakhand.

        Source of Truth: data/processed/ml/rolling/rolling_features_latest.parquet

        Evaluates genuine Phase 4 Candidate XGBoost probabilities on real GPM/SMAP/IMD feature matrix.

        """

        rolling_file = self.data_dir / "ml" / "rolling" / "rolling_features_latest.parquet"

        clean_file = self.data_dir / "ml" / "flood_ml_features_clean.parquet"



        if not rolling_file.exists() or not clean_file.exists():

            logger.error("Live rolling feature matrix missing. Operational data path unavailable.")

            return []



        # Read 34 physical predictors from the live rolling dataset

        df_rolling = pd.read_parquet(rolling_file)

        df_clean = pd.read_parquet(clean_file)



        # Validate 34-feature contract against model requirements

        expected_preds = self.prediction_service._engine.predictor_names

        if list(df_rolling.columns) != expected_preds:

            logger.error("34-predictor feature contract mismatch in rolling dataset.")

            return []



        # Combine spatial metadata with live 34 physical predictors

        meta_cols = ["sample_id", "sample_type", "spatial_id", "latitude", "longitude", "timestamp_utc", "district", "major_basin"]

        meta_cols_present = [c for c in meta_cols if c in df_clean.columns]

        df_combined = pd.concat([df_clean[meta_cols_present], df_rolling], axis=1)



        # Run genuine Phase 4 Candidate XGBoost batch inference on live rolling matrix

        df_evaluated = self.prediction_service._engine.predict_batch(df_combined)



        # Prioritize CWC hydrometric monitoring stations to appear first

        is_cwc = df_evaluated["spatial_id"].str.startswith("CWC_")

        df_latest = pd.concat([df_evaluated[is_cwc], df_evaluated[~is_cwc]])



        decisions: List[RiskDecisionResponse] = []

        now = datetime.now(timezone.utc)



        for _, r in df_latest.iterrows():

            sp_id = str(r["spatial_id"])

            dist = str(r["district"])



            # Filter by district if requested

            if district and dist.lower() != district.lower():

                continue



            # Pure ML model predictions evaluated on live rolling observations

            prob = float(r["prediction_probability"])

            ml_class = str(r["ml_risk_class"])



            # Real physical environmental observations from GPM / SMAP / IMD rolling feature matrix

            r1h = float(r["rainfall_1h_mm"]) if pd.notna(r.get("rainfall_1h_mm")) else None

            r3h = float(r["rainfall_3h_mm"]) if pd.notna(r.get("rainfall_3h_mm")) else None

            ssi = float(r["soil_saturation_index"]) if pd.notna(r.get("soil_saturation_index")) else None

            scs_q = float(r["scs_direct_runoff_q_mm"]) if pd.notna(r.get("scs_direct_runoff_q_mm")) else None

            scs_qp = float(r["scs_peak_runoff_potential"]) if pd.notna(r.get("scs_peak_runoff_potential")) else None



            # Static CWC reference thresholds (Warning, Danger, HFL)

            stn_info = self._cwc_thresholds_cache.get(sp_id)

            warn_m = stn_info["warning_level_m"] if stn_info else None

            dang_m = stn_info["danger_level_m"] if stn_info else None

            hfl_m = stn_info["hfl_m"] if stn_info else None



            # CWC Live Gauge API is currently HTTP 503 (Unavailable).

            # Synthetic CWC water levels are COMPLETELY REMOVED from production risk decisions.

            wl_m = None

            cwc_status = "UNAVAILABLE"

            alert_stage = "UNKNOWN"



            # Environmental forcing evaluated from live rolling precipitation & soil saturation

            env_condition = self.evaluate_environmental_condition(r1h, None, ssi, scs_q)



            # Deterministic Multi-Signal Fusion (Policy v8.1.0)

            final_risk, op_state, alert_prio, reason, factors, dq, conf = self.fuse_signals(

                ml_prob=prob,

                ml_class=ml_class,

                cwc_status=cwc_status,

                env_condition=env_condition,

                water_level_m=wl_m,

                rainfall_1h_mm=r1h,

                soil_saturation_index=ssi,

                scs_direct_runoff_q_mm=scs_q,

            )



            # Apply filters

            if final_risk_class and final_risk != final_risk_class:

                continue

            if alert_priority and alert_prio != alert_priority:

                continue



            decisions.append(

                RiskDecisionResponse(

                    timestamp_utc=pd.to_datetime(r["timestamp_utc"]),

                    spatial_id=sp_id,

                    sample_id=str(r["sample_id"]),

                    sample_type=str(r["sample_type"]),

                    station_id=sp_id if str(r["sample_type"]) == "water_level_station" or sp_id.startswith("CWC_") else None,

                    station_name=stn_info["station_name"] if stn_info else sp_id,

                    district=dist,

                    river_name=stn_info["river_name"] if stn_info else None,

                    major_basin=str(r.get("major_basin")) if pd.notna(r.get("major_basin")) else None,

                    latitude=float(r["latitude"]),

                    longitude=float(r["longitude"]),

                    model_name="XGBoost_PPT_Upgraded",

                    model_version="6.1.0",

                    flood_probability=prob,

                    ml_risk_class=ml_class,

                    ml_decision_threshold=self.DECISION_THRESHOLD,

                    water_level_m=wl_m,

                    warning_level_m=warn_m,

                    danger_level_m=dang_m,

                    hfl_m=hfl_m,

                    cwc_threshold_status=cwc_status,

                    official_alert_stage=alert_stage,

                    is_gauge_offline=True,

                    rainfall_1h_mm=r1h,

                    rainfall_3h_mm=r3h,

                    soil_saturation_index=ssi,

                    scs_direct_runoff_q_mm=scs_q,

                    scs_peak_runoff_potential=scs_qp,

                    environmental_condition=env_condition,

                    final_risk_class=final_risk,

                    operational_state=op_state,

                    alert_priority=alert_prio,

                    decision_reason=reason,

                    recommended_action=self.get_recommended_action(final_risk),

                    contributing_factors=factors,

                    data_quality_status=dq,

                    decision_confidence=conf,

                    risk_policy_version=self.POLICY_VERSION,

                    threshold_source=stn_info["source_document"] if stn_info else "CWC Hydrological Records",

                    generated_at_utc=now,

                )

            )



            if len(decisions) >= limit:

                break



        return decisions



    def get_station_decision(self, station_id: str) -> Optional[RiskDecisionResponse]:

        """Retrieves and evaluates the latest risk decision for a specific station."""

        decisions = self.get_latest_decisions(limit=10000)

        return next(

            (

                d for d in decisions

                if d.spatial_id.lower() == station_id.lower()

                or (d.station_id and d.station_id.lower() == station_id.lower())

                or (d.station_name and d.station_name.lower().replace(" ", "_") == station_id.lower().replace(" ", "_"))

            ),

            None,

        )



    def get_summary(self) -> RiskSummaryResponse:

        """Computes comprehensive state-wide executive summary metrics."""

        decisions = self.get_latest_decisions(limit=10000)

        risk_counts = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "EXTREME": 0}

        priority_counts = {"INFORMATION": 0, "WATCH": 0, "WARNING": 0, "CRITICAL": 0}

        cwc_counts: Dict[str, int] = {}

        dq_counts: Dict[str, int] = {}

        dist_breakdown: Dict[str, Dict[str, int]] = {}



        for d in decisions:

            risk_counts[d.final_risk_class] = risk_counts.get(d.final_risk_class, 0) + 1

            priority_counts[d.alert_priority] = priority_counts.get(d.alert_priority, 0) + 1

            cwc_counts[d.cwc_threshold_status] = cwc_counts.get(d.cwc_threshold_status, 0) + 1

            dq_counts[d.data_quality_status] = dq_counts.get(d.data_quality_status, 0) + 1



            dist = d.district

            if dist not in dist_breakdown:

                dist_breakdown[dist] = {"LOW": 0, "MODERATE": 0, "HIGH": 0, "EXTREME": 0}

            dist_breakdown[dist][d.final_risk_class] = dist_breakdown[dist].get(d.final_risk_class, 0) + 1



        # Highest risk locations

        high_risk = [

            {

                "spatial_id": d.spatial_id,

                "station_name": d.station_name,

                "district": d.district,

                "latitude": d.latitude,

                "longitude": d.longitude,

                "flood_probability": d.flood_probability,

                "final_risk_class": d.final_risk_class,

                "alert_priority": d.alert_priority,

                "cwc_threshold_status": d.cwc_threshold_status,

                "decision_reason": d.decision_reason,

            }

            for d in sorted(decisions, key=lambda x: x.flood_probability, reverse=True)[:10]

        ]



        return RiskSummaryResponse(

            total_evaluated_points=len(decisions),

            risk_class_counts=risk_counts,

            alert_priority_counts=priority_counts,

            cwc_threshold_status_counts=cwc_counts,

            data_quality_counts=dq_counts,

            district_risk_breakdown=dist_breakdown,

            highest_risk_locations=high_risk,

            risk_policy_version=self.POLICY_VERSION,

            generated_at_utc=datetime.now(timezone.utc),

        )



    def get_active_alerts(self) -> RiskAlertsResponse:

        """Retrieves active high-priority and critical alerts across Uttarakhand stations and hazard locations."""

        decisions = self.get_latest_decisions(limit=10000)

        alerts: List[RiskAlertItem] = []

        seen_keys = set()

        now = datetime.now(timezone.utc)



        for d in decisions:

            if d.alert_priority in ("WARNING", "CRITICAL") or d.final_risk_class in ("HIGH", "EXTREME"):

                # Focus alerts on official CWC stations & distinct hazard monitoring locations

                # Grid cells without distinct station names are excluded to prevent duplicate alert clutter

                key = d.station_id or d.spatial_id

                if not (d.station_id or d.spatial_id.startswith("CWC_")):

                    continue

                if key in seen_keys:

                    continue

                seen_keys.add(key)



                alerts.append(

                    RiskAlertItem(

                        alert_id=f"ALT_STN_{d.spatial_id}",

                        spatial_id=d.spatial_id,

                        station_name=d.station_name or d.spatial_id,

                        district=d.district,

                        latitude=d.latitude,

                        longitude=d.longitude,

                        alert_priority=d.alert_priority,

                        final_risk_class=d.final_risk_class,

                        flood_probability=d.flood_probability,

                        cwc_threshold_status=d.cwc_threshold_status,

                        decision_reason=d.decision_reason,

                        recommended_action=d.recommended_action,

                        generated_at_utc=now,

                    )

                )



        crit_count = sum(1 for a in alerts if a.alert_priority == "CRITICAL")

        warn_count = sum(1 for a in alerts if a.alert_priority == "WARNING")



        return RiskAlertsResponse(

            total_active_alerts=len(alerts),

            critical_alerts_count=crit_count,

            warning_alerts_count=warn_count,

            alerts=alerts,

        )



    def get_policy(self) -> RiskPolicySchema:

        """Returns the formal, auditable policy rules and threshold definitions."""

        return RiskPolicySchema(

            version=self.POLICY_VERSION,

            title="FlashFloodAI Multi-Signal Flood Risk Decision Policy",

            standards_authority=self.STANDARDS_AUTHORITY,

            ml_decision_threshold=self.DECISION_THRESHOLD,

            probability_bands={

                "LOW": {"range": "[0.00, 0.20)", "description": "Minimal flash flood risk."},

                "MODERATE": {"range": "[0.20, 0.40)", "description": "Elevated risk requiring increased monitoring."},

                "HIGH": {"range": "[0.40, 0.70)", "description": "High probability of surface runoff inundation / river surge."},

                "EXTREME": {"range": "[0.70, 1.00]", "description": "Severe catastrophic flash flood threat."},

            },

            cwc_threshold_rules={

                "BELOW_WARNING": {"condition": "water_level < warning_level", "alert_stage": "NONE"},

                "WARNING_ZONE": {"condition": "warning_level <= water_level < danger_level", "alert_stage": "YELLOW"},

                "DANGER_ZONE": {"condition": "danger_level <= water_level < HFL", "alert_stage": "ORANGE"},

                "ABOVE_HFL": {"condition": "water_level >= HFL", "alert_stage": "RED"},

                "UNAVAILABLE": {"condition": "water_level is null / gauge offline", "alert_stage": "UNKNOWN"},

            },

            environmental_condition_rules={

                "NORMAL": {"rainfall_1h": "< 15 mm/h", "soil_saturation": "< 0.60"},

                "WATCH": {"rainfall_1h": "15 - 30 mm/h", "soil_saturation": "0.60 - 0.80"},

                "ESCALATING": {"rainfall_1h": "30 - 65 mm/h", "soil_saturation": "0.80 - 0.90"},

                "CRITICAL": {"rainfall_1h": ">= 65 mm/h (Cloudburst)", "soil_saturation": ">= 0.90"},

            },

            conflict_resolution_matrix={

                "CASE_A_IMPENDING_SURGE": {

                    "condition": "ML=HIGH/EXTREME, CWC=BELOW_WARNING, Rainfall=ESCALATING/CRITICAL",

                    "resolution": "ML/Atmospheric surge overrides gauge. Risk remains HIGH/EXTREME; Alert=WARNING/CRITICAL.",

                },

                "CASE_B_RIVER_DANGER_OVERRIDE": {

                    "condition": "ML=LOW, CWC=DANGER_ZONE/ABOVE_HFL",

                    "resolution": "River gauge strictly overrides dry local weather. Risk escalates to HIGH/EXTREME; Alert=CRITICAL.",

                },

                "CASE_C_TELEMETRY_OFFLINE": {

                    "condition": "CWC=UNAVAILABLE",

                    "resolution": "ML model + Environmental forcing determine risk. Data quality set to PARTIAL/DEGRADED.",

                },

                "CASE_D_MISSING_ATMOSPHERE": {

                    "condition": "Rainfall or Soil Moisture unavailable",

                    "resolution": "Data quality set to DEGRADED. Decision confidence adjusted down.",

                },

                "CASE_E_SATURATION_BUILDUP": {

                    "condition": "ML=LOW, Soil Saturation >= 0.85, Rainfall >= 15mm",

                    "resolution": "Environmental state set to WATCH; Final risk escalates to MODERATE.",

                },

            },

            recommended_actions_catalog={

                "LOW": self.get_recommended_action("LOW"),

                "MODERATE": self.get_recommended_action("MODERATE"),

                "HIGH": self.get_recommended_action("HIGH"),

                "EXTREME": self.get_recommended_action("EXTREME"),

            },

            alert_priorities_catalog={

                "INFORMATION": "Routine bulletin advisory.",

                "WATCH": "Precautionary watch for emergency response units.",

                "WARNING": "Formal stage-2 warning for district authorities.",

                "CRITICAL": "Emergency escalation for SDRF/NDRF evacuation deployment.",

            },

        )
