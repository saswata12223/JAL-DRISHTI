"""
Jal Drishti — Data Freshness Framework

Unifies the freshness vocabulary and calculation logic that exists
across the project's ingestion scripts (imd_ingest.py, smap_l4_ingest.py,
orchestrate_rolling_pipeline.py) into a single backend abstraction.

Freshness States (canonical vocabulary for Phase 5+):
  FRESH      — data is within the source's expected update interval
  AGING      — data is older than FRESH threshold but not yet STALE
  STALE      — data has exceeded the source's acceptable staleness window
  UNKNOWN    — no verified observation timestamp is available
  NOT_APPLICABLE — source is static/historical by nature (e.g. SRTM DEM)

FreshnessPolicy (update interval semantics):
  REALTIME   — expected every few minutes
  SUB_HOURLY — expected more frequently than hourly
  HOURLY     — expected every hour
  DAILY      — expected every day (e.g. SMAP L4: 24h)
  MULTI_DAY  — expected every few days (e.g. GPM IMERG: 30-min lag, near-realtime)
  STATIC     — does not update; always FRESH by definition
  HISTORICAL — historical archive; never a live feed

IMPORTANT:
  - Never populate last_successful_observation with system clock time
    unless that timestamp was actually obtained from the source.
  - last_checked_at and last_successful_observation are different fields.
  - A source with no verified timestamp returns UNKNOWN, not FRESH.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional


class FreshnessState(str, Enum):
    FRESH = "FRESH"
    AGING = "AGING"
    STALE = "STALE"
    UNKNOWN = "UNKNOWN"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class FreshnessPolicy(str, Enum):
    """Expected update interval for a data source."""
    REALTIME = "REALTIME"          # < 15 min
    SUB_HOURLY = "SUB_HOURLY"      # 15–60 min
    HOURLY = "HOURLY"              # ~1 hour
    DAILY = "DAILY"                # ~24 hours
    MULTI_DAY = "MULTI_DAY"        # 2–7 days
    STATIC = "STATIC"              # Never updates (terrain, DEM, land cover)
    HISTORICAL = "HISTORICAL"      # Historical archive, not a live feed


# Per-policy thresholds (hours) that define FRESH → AGING → STALE transitions.
# These match the documented thresholds already present in the project scripts.
_POLICY_THRESHOLDS: dict[FreshnessPolicy, tuple[float, float]] = {
    FreshnessPolicy.REALTIME:    (0.25, 1.0),    # FRESH < 15min, STALE > 1h
    FreshnessPolicy.SUB_HOURLY: (1.0,  3.0),    # from imd_ingest LIVE_THRESHOLD_HOURS
    FreshnessPolicy.HOURLY:     (3.0,  24.0),   # from imd_ingest RECENT_THRESHOLD_HOURS
    FreshnessPolicy.DAILY:      (24.0, 72.0),   # from smap_l4_ingest thresholds
    FreshnessPolicy.MULTI_DAY:  (72.0, 168.0),  # 3d fresh, 7d stale
    FreshnessPolicy.STATIC:     (None, None),   # Always NOT_APPLICABLE
    FreshnessPolicy.HISTORICAL: (None, None),   # Always NOT_APPLICABLE
}


@dataclass(frozen=True)
class DataSourceFreshness:
    """
    Immutable freshness evaluation result for a specific source/region pair.

    NEVER populate last_successful_observation with a fabricated or
    inferred timestamp. Use None when no verified timestamp exists.
    """
    source_id: str
    region_id: str
    availability_status: str          # from DataSourceAvailabilityStatus
    freshness_state: FreshnessState
    last_successful_observation: Optional[datetime]  # None = not verified
    data_age_seconds: Optional[float]               # None = not calculable
    checked_at: datetime
    usable_for_inference: bool
    reason: str


def compute_freshness(
    source_id: str,
    region_id: str,
    policy: FreshnessPolicy,
    last_successful_observation: Optional[datetime],
    availability_status: str,
    usable_for_inference: bool,
    now: Optional[datetime] = None,
) -> DataSourceFreshness:
    """
    Compute freshness deterministically from an actual observation timestamp.

    Args:
        source_id:                   Canonical source identifier.
        region_id:                   Region this freshness applies to.
        policy:                      The source's FreshnessPolicy.
        last_successful_observation: The actual last verified observation time.
                                     Pass None if no verified timestamp exists.
        availability_status:         The source's DataSourceAvailabilityStatus value.
        usable_for_inference:        Whether the source is currently usable.
        now:                         Reference time for age calculation.
                                     Defaults to datetime.now(UTC). Only override
                                     in controlled unit tests.

    Returns:
        DataSourceFreshness — an immutable, auditable freshness snapshot.
    """
    checked_at = now or datetime.now(timezone.utc)

    # Static / Historical sources never have a meaningful age
    if policy in (FreshnessPolicy.STATIC, FreshnessPolicy.HISTORICAL):
        return DataSourceFreshness(
            source_id=source_id,
            region_id=region_id,
            availability_status=availability_status,
            freshness_state=FreshnessState.NOT_APPLICABLE,
            last_successful_observation=last_successful_observation,
            data_age_seconds=None,
            checked_at=checked_at,
            usable_for_inference=usable_for_inference,
            reason=f"Source policy is {policy.value}; freshness concept does not apply.",
        )

    # No verified timestamp → UNKNOWN
    if last_successful_observation is None:
        return DataSourceFreshness(
            source_id=source_id,
            region_id=region_id,
            availability_status=availability_status,
            freshness_state=FreshnessState.UNKNOWN,
            last_successful_observation=None,
            data_age_seconds=None,
            checked_at=checked_at,
            usable_for_inference=False,
            reason="No verified observation timestamp is available.",
        )

    # Ensure timezone-aware comparison
    obs = last_successful_observation
    if obs.tzinfo is None:
        obs = obs.replace(tzinfo=timezone.utc)

    age_seconds = (checked_at - obs).total_seconds()
    age_hours = age_seconds / 3600.0

    fresh_threshold, stale_threshold = _POLICY_THRESHOLDS[policy]

    if age_hours < 0:
        # Slight clock skew — treat as FRESH
        state = FreshnessState.FRESH
        reason = "Observation timestamp is marginally in the future (clock skew tolerated)."
    elif age_hours <= fresh_threshold:
        state = FreshnessState.FRESH
        reason = f"Data age {age_hours:.1f}h is within FRESH threshold ({fresh_threshold}h)."
    elif age_hours <= stale_threshold:
        state = FreshnessState.AGING
        reason = f"Data age {age_hours:.1f}h is between FRESH ({fresh_threshold}h) and STALE ({stale_threshold}h) thresholds."
    else:
        state = FreshnessState.STALE
        reason = f"Data age {age_hours:.1f}h exceeds STALE threshold ({stale_threshold}h)."

    # If stale, override usable_for_inference
    if state == FreshnessState.STALE:
        usable_for_inference = False

    return DataSourceFreshness(
        source_id=source_id,
        region_id=region_id,
        availability_status=availability_status,
        freshness_state=state,
        last_successful_observation=obs,
        data_age_seconds=age_seconds,
        checked_at=checked_at,
        usable_for_inference=usable_for_inference,
        reason=reason,
    )
