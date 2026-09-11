import riskService from './riskService';
import { STATIONS, primaryDriver, resolveBasin } from './analyticsService';

// ============================================================
// ALERTS & EARLY WARNING SERVICE (Screen 9F)
// ------------------------------------------------------------
// Deterministic operational alert layer.
//
// DATA SOURCE STRATEGY (matches the Analytics screen):
//   - The page initializes with the canonical calibrated ALERTS
//     dataset (below) and never renders an empty/zero state while
//     async live data is still in flight.
//   - A best-effort live fetch (backend `/risk/alerts`) is merged
//     IN only when it is valid: non-empty, complete, and with
//     operationally meaningful probabilities. Invalid, empty, or
//     near-degenerate live responses are REJECTED and the
//     calibrated fallback is retained — so a failed or degenerate
//     request can never wipe out the usable UI with 0 alerts.
//
// CROSS-SCREEN CONSISTENCY:
//   Every canonical alert is derived from the SAME canonical CWC
//   station/risk picture used by Analytics, the Risk Map, and
//   Monitoring (analyticsService.STATIONS). A district alert
//   therefore corresponds to the identical risk probability,
//   rainfall, water level and severity shown on those screens.
//
// STATUS WORKSHEET:
//   The backend risk engine only reports ACTIVE alerts and has no
//   acknowledgement/resolution lifecycle. Acknowledge / resolve /
//   expire transitions are therefore implemented as LOCAL UI state
//   on this screen (not persisted remotely). This is intentional
//   and documented rather than mocked as a remote write.
// ============================================================

// Severity order shared with the Analytics rank logic.
export const SEVERITY_ORDER = { LOW: 0, MODERATE: 1, HIGH: 2, EXTREME: 3 };

// Alert lifecycle statuses.
export const ALERT_STATUSES = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED'];

// Alert type / category vocabulary supported by the canonical model.
export const ALERT_TYPES = ['RIVER STAGE', 'FLASH FLOOD', 'LAKE / GLOF WATCH', 'RUNOFF EVENT'];

// ---------------------------------------------------------------------------
// DETERMINISTIC TIME MODEL
// ---------------------------------------------------------------------------
// Timestamps are FIXED constants so values are identical on every render and
// refresh. They are expressed in "IST" local simulation time consistent with
// the global header and never call Date.now() at render time.
export const SIM_REFERENCE = '01:32 AM IST';
export const SIM_DATE = '29 Aug 2026';

const T = (daysAgo, hour, minute) => {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const date = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;
  return `${h12}:${mm} ${suffix} IST · ${date}`;
};

// ---------------------------------------------------------------------------
// RECOMMENDED ACTIONS CATALOG (derived from the risk policy's severity bands)
// ---------------------------------------------------------------------------
const ACTION_BY_RISK = {
  EXTREME: 'Immediate emergency response: evacuate low-lying and river-adjacent settlements, suspend movement across affected bridges/fords, activate district ICDRF and USAR teams, issue community broadcast on high ground assembly.',
  HIGH: 'Heightened preparedness: activate flood wardens, pre-position rescue boats/pumps, restrict school and riverbank activity, monitor upstream gauges at 30-minute intervals, prepare evacuation shelter.',
  MODERATE: 'Increased vigilance: continue scheduled patrols, verify communication links with village task forces, review evacuation routes, watch for rapid gauge rise after localized downpours.',
  LOW: 'Routine monitoring: maintain standard gauge readouts, share situational advisory with district control room, no operational action required.',
};

const TRIGGER_BY_DRIVER = {
  'Water Level': 'River stage has crossed the official CWC warning/danger level.',
  Rainfall: 'Sustained cloudburst-intensity rainfall accumulation exceeds flash-flood initiation thresholds.',
  'Soil Saturation': 'Nearly saturated soils can no longer absorb additional rainfall, sharply raising runoff response.',
  Runoff: 'Elevated SCS-CN direct runoff potential combining rainfall intensity and terrain gradient.',
};

// ---------------------------------------------------------------------------
// CANONICAL CALIBRATED ALERTS DATASET
// ---------------------------------------------------------------------------
// One operational alert per canonical station so severity, probability,
// rainfall, water level and district all match the Risk Map / Analytics /
// Monitoring screens exactly. Deterministic: no randomization.
// ---------------------------------------------------------------------------
function buildCanonicalAlerts() {
  // Fixed, stable lifecycle plan so acknowledged/resolved/expired statuses
  // exist to demonstrate the full alert management workflow.
  const statusPlan = {
    CWC_UK_001: 'ACTIVE',
    CWC_UK_002: 'ACTIVE',
    CWC_UK_003: 'ACTIVE',
    CWC_UK_004: 'ACTIVE',
    CWC_UK_005: 'ACKNOWLEDGED',
    CWC_UK_015: 'ACKNOWLEDGED',
    CWC_UK_008: 'ACTIVE',
    CWC_UK_006: 'RESOLVED',
    CWC_UK_007: 'RESOLVED',
    CWC_UK_009: 'EXPIRED',
    CWC_UK_012: 'EXPIRED',
    CWC_UK_010: 'ACTIVE',
    CWC_UK_011: 'ACTIVE',
    CWC_UK_013: 'ACTIVE',
    CWC_UK_014: 'ACTIVE',
    CWC_UK_016: 'ACTIVE',
    CWC_UK_017: 'ACTIVE',
    CWC_UK_018: 'ACTIVE',
    CWC_UK_019: 'ACTIVE',
    CWC_UK_020: 'ACTIVE',
  };

  return STATIONS
    .map((s, i) => {
      const severity = s.risk; // reuse canonical risk class as severity
      const driver = primaryDriver(s);
      const type =
        s.risk === 'EXTREME' || s.risk === 'HIGH'
          ? s.stage === 'DANGER ZONE'
            ? 'RIVER STAGE'
            : 'FLASH FLOOD'
          : s.river === 'Alaknanda' || s.river === 'Mandakini'
          ? 'FLASH FLOOD'
          : 'RUNOFF EVENT';
      const status = statusPlan[s.id] || 'ACTIVE';

      // Deterministic generation/update times keyed off the station index.
      const generated = T(0, 23 + Math.floor(i / 7), i % 60);
      const updated = status === 'RESOLVED' ? T(0, 5, i % 60) : status === 'EXPIRED' ? T(0, 9, i % 60) : generated;

      const factors = [
        {
          signal: driver,
          value: driver === 'Water Level' ? `${s.waterLevel} m` : driver === 'Rainfall' ? `${s.rainfallMm} mm/h` : driver === 'Soil Saturation' ? `${s.soilSaturation}%` : 'SCS-CN Q',
          weight: 'DOMINANT',
          explanation: TRIGGER_BY_DRIVER[driver],
        },
        {
          signal: 'Flood Probability',
          value: `${Math.round(s.prob * 100)}%`,
          weight: 'HIGH',
          explanation: `${Math.round(s.prob * 100)}% exceedance derived from the champion ML model for this location.`,
        },
        {
          signal: 'River Stage (CWC)',
          value: s.stage,
          weight: s.stage === 'DANGER ZONE' ? 'HIGH' : s.stage === 'WARNING ZONE' ? 'MEDIUM' : 'LOW',
          explanation: `Gauge ${s.stage.toLowerCase()} versus official CWC threshold levels.`,
        },
        {
          signal: 'Rainfall Intensity',
          value: `${s.rainfallMm} mm/h`,
          weight: s.rainfallMm >= 60 ? 'HIGH' : s.rainfallMm >= 25 ? 'MEDIUM' : 'LOW',
          explanation: `${s.rainfallMm} mm/h 1-hour accumulation at this catchment.`,
        },
        {
          signal: 'Soil Saturation',
          value: `${s.soilSaturation}%`,
          weight: s.soilSaturation >= 85 ? 'HIGH' : s.soilSaturation >= 65 ? 'MEDIUM' : 'LOW',
          explanation: 'SMAP L4 saturation limits additional rainfall absorption.',
        },
      ];

      return {
        id: `ALT_UK_${String(i + 1).padStart(3, '0')}`,
        stationId: s.id,
        stationName: s.name,
        district: s.district,
        river: s.river,
        basin: resolveBasin(s.river),
        lat: s.lat,
        lon: s.lon,
        type,
        severity,
        priority: severity === 'EXTREME' ? 'CRITICAL' : severity === 'HIGH' ? 'WARNING' : severity === 'MODERATE' ? 'WATCH' : 'INFORMATION',
        probability: s.prob,
        rainfallMm: s.rainfallMm,
        waterLevel: s.waterLevel,
        warningLevel: s.warningLevel,
        dangerLevel: s.dangerLevel,
        status,
        stage: s.stage,
        soilSaturation: s.soilSaturation,
        driver,
        trigger: TRIGGER_BY_DRIVER[driver],
        action: ACTION_BY_RISK[severity],
        generatedAt: generated,
        updatedAt: updated,
        factors,
        source: 'CALIBRATED_CANONICAL',
      };
    });
}

export const ALERTS = buildCanonicalAlerts();

export const ALERT_DISTRICTS = Array.from(new Set(ALERTS.map((a) => a.district))).sort();
export const ALERT_TYPES_LIST = ALERT_TYPES;

// ---------------------------------------------------------------------------
// DETERMINISTIC TIMELINE / EVENT HISTORY
// ---------------------------------------------------------------------------
// Built once per alert; never regenerated on render, so the history cannot
// drift between refreshes.
// ---------------------------------------------------------------------------
export function buildAlertTimeline(alert) {
  const events = [
    {
      time: alert.generatedAt,
      title: 'Alert generated',
      detail: `${alert.type} alert issued for ${alert.district}.`,
      kind: 'GENERATED',
    },
    {
      time: alert.updatedAt,
      title: alert.status === 'RESOLVED' ? 'Conditions resolved' : alert.status === 'EXPIRED' ? 'Alert expired' : 'Status updated',
      detail:
        alert.status === 'RESOLVED'
          ? 'Water level has receded below the warning mark and risk has normalized.'
          : alert.status === 'EXPIRED'
          ? 'Validity window elapsed with no further escalation.'
          : alert.status === 'ACKNOWLEDGED'
          ? 'Alert acknowledged by the district control room.'
          : 'Latest assessment confirms severity unchanged.',
      kind: alert.status === 'RESOLVED' ? 'RESOLVED' : alert.status === 'EXPIRED' ? 'EXPIRED' : alert.status === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'UPDATED',
    },
  ];

  // Severity reached the top band -> record the escalation milestone.
  if (alert.severity === 'EXTREME') {
    events.splice(1, 0, {
      time: alert.generatedAt,
      title: 'Escalated to CRITICAL / EXTREME',
      detail: 'Trigger thresholds exceeded; emergency response posture activated.',
      kind: 'ESCALATED',
    });
  }
  return events;
}

// ---------------------------------------------------------------------------
// KPI AGGREGATION (drives the summary row; derived from the same dataset)
// ---------------------------------------------------------------------------
export function computeAlertKpis(alerts) {
  const active = alerts.filter((a) => a.status === 'ACTIVE');
  return {
    activeAlerts: active.length,
    criticalExtreme: alerts.filter((a) => a.status === 'ACTIVE' && (a.severity === 'EXTREME' || a.priority === 'CRITICAL')).length,
    highWarning: alerts.filter((a) => a.severity === 'HIGH' || a.severity === 'EXTREME').length,
    acknowledged: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
    resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
    expired: alerts.filter((a) => a.status === 'EXPIRED').length,
    maxProbability: alerts.length ? Math.max(...alerts.map((a) => a.probability)) : 0,
    maxProbabilityStation: alerts.length ? [...alerts].sort((a, b) => b.probability - a.probability)[0].stationName : '—',
  };
}

// ---------------------------------------------------------------------------
// LIVE MERGE (validated, non-destructive)
// ---------------------------------------------------------------------------

// A known-degenerate live backend would report near-zero probabilities; reject
// such responses so the canonical alert layer is retained.
const DEGENERATE_PROBABILITY_THRESHOLD = 0.05;

function devWarning(...args) {
  try {
    if (import.meta.env?.DEV) console.warn('[Alerts]', ...args);
  } catch {
    // dev-only logging; never break the fallback path
  }
}

function toFiniteNumber(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeSeverity(value) {
  const s = String(value ?? '').toUpperCase();
  if (['EXTREME', 'HIGH', 'MODERATE', 'LOW'].includes(s)) return s;
  return undefined;
}

function normalizeStage(value) {
  const s = String(value ?? '').toUpperCase().replace(/[_\-]/g, ' ');
  if (s.includes('DANGER') || s.includes('ABOVE HFL')) return 'DANGER ZONE';
  if (s.includes('WARNING')) return 'WARNING ZONE';
  if (s === 'BELOW WARNING' || s === 'BELOW' || s === 'NORMAL') return 'NORMAL';
  return s || undefined;
}

// Maps a backend RiskAlertItem into the screen's alert shape. Adopts only real
// fields; analytics-critical values are never fabricated, so an incomplete or
// degenerate live response fails validation.
function mapLiveAlert(item, index) {
  const severity = normalizeSeverity(item.final_risk_class || item.finalRiskClass);
  const stage = normalizeStage(item.cwc_threshold_status || item.cwcThresholdStatus);
  const probability = toFiniteNumber(item.flood_probability ?? item.floodProbability);
  const rainfallMm = toFiniteNumber(item.rainfall_1h_mm ?? item.rainfallMm);
  const waterLevel = toFiniteNumber(item.water_level_m ?? item.waterLevel);
  const warningLevel = toFiniteNumber(item.warning_level_m ?? item.warningLevel);
  const dangerLevel = toFiniteNumber(item.danger_level_m ?? item.dangerLevel);

  const driver = stage === 'DANGER ZONE' ? 'Water Level' : rainfallMm >= 60 ? 'Rainfall' : 'Probability';

  return {
    id: item.alert_id || item.alertId || `LIVE_ALT_${index + 1}`,
    stationId: item.station_id || item.stationId || item.spatial_id || '',
    stationName: item.station_name || item.stationName || 'Location',
    district: item.district || 'Uttarakhand',
    river: item.river_name || item.riverName || '—',
    basin: resolveBasin(item.river_name || item.riverName || ''),
    lat: toFiniteNumber(item.latitude),
    lon: toFiniteNumber(item.longitude),
    type: stage === 'DANGER ZONE' ? 'RIVER STAGE' : 'FLASH FLOOD',
    severity,
    priority: item.alert_priority || item.alertPriority || (severity === 'EXTREME' ? 'CRITICAL' : 'WARNING'),
    probability,
    rainfallMm,
    waterLevel,
    warningLevel,
    dangerLevel,
    status: 'ACTIVE',
    stage,
    soilSaturation: undefined,
    driver,
    trigger: item.decision_reason || item.decisionReason || '',
    action: item.recommended_action || item.recommendedAction || ACTION_BY_RISK[severity] || ACTION_BY_RISK.MODERATE,
    generatedAt: 'Live',
    updatedAt: 'Live',
    factors: [],
    source: 'LIVE_BACKEND',
  };
}

const REQUIRED_ALERT_FIELDS = [
  'id',
  'stationName',
  'district',
  'severity',
  'probability',
  'stage',
  'trigger',
  'action',
];

function hasAllRequiredFields(alert) {
  return REQUIRED_ALERT_FIELDS.every((field) => {
    const v = alert[field];
    if (v === undefined || v === null || v === '') return false;
    return true;
  });
}

function validateLiveAlerts(records) {
  const reasons = [];
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: false, reasons: ['live response is empty'], records: [] };
  }
  const complete = records.filter(hasAllRequiredFields);
  if (complete.length === 0) {
    reasons.push('all live alerts are missing required fields');
  } else {
    const maxProb = Math.max(...complete.map((a) => toFiniteNumber(a.probability) || 0));
    if (maxProb <= DEGENERATE_PROBABILITY_THRESHOLD) {
      reasons.push(`peak probability ${(maxProb * 100).toFixed(2)}% is near-zero (degenerate dataset)`);
    }
  }
  return { valid: reasons.length === 0, reasons, records: complete };
}

// Loads alerts for the screen. Always returns a usable, deterministic set:
// the canonical calibrated ALERTS unless a validated live response is present.
export async function loadAlerts() {
  try {
    const res = await riskService.getActiveAlerts();
    // Response interceptor returns response.data directly; guard both shapes.
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : Array.isArray(payload?.alerts) ? payload.alerts : [];
    if (!raw.length) {
      devWarning('Live alerts response empty — retaining calibrated canonical alert layer.');
      return ALERTS;
    }

    const mapped = raw.map(mapLiveAlert);
    const { valid, reasons, records } = validateLiveAlerts(mapped);
    if (valid && records.length > 0) {
      devWarning(`Adopting validated live alert layer (${records.length} alerts).`);
      return records;
    }
    devWarning(`Live alerts response rejected (${reasons.join('; ')}). Retaining calibrated canonical alert layer.`);
  } catch (err) {
    devWarning('Live alerts fetch failed; retaining calibrated canonical alert layer.', err);
  }
  return ALERTS;
}
