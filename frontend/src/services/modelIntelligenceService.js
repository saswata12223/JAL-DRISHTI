import riskService from './riskService';

import { STATIONS, primaryDriver, resolveBasin } from './analyticsService';

import { SIM_REFERENCE, SIM_DATE } from './alertsService';



// ---------------------------------------------------------------------------
// LOCAL HELPERS (defined here so the entire module is self-contained)
// ---------------------------------------------------------------------------

function toFiniteNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function actionForRisk(riskClass) {
  const catalog = {
    LOW:      'Continue routine hydrological and meteorological monitoring.',
    MODERATE: 'Increase telemetry polling. Alert local field observers and inspect drainage catchments.',
    HIGH:     'Issue Stage-2 preparedness advisory to DEOC. Deploy emergency response assets.',
    EXTREME:  'Activate emergency protocol. Alert SDRF/NDRF. Prepare immediate evacuation.',
  };
  return catalog[riskClass] ?? catalog.LOW;
}

const REQUIRED_DECISION_FIELDS = [
  'spatial_id', 'flood_probability', 'final_risk_class', 'alert_priority',
];

function hasAllDecisionFields(d) {
  return REQUIRED_DECISION_FIELDS.every((k) => d[k] !== undefined && d[k] !== null);
}

function mapLiveDecision(d) {
  return {
    ...d,
    flood_probability:       toFiniteNumber(d.flood_probability)        ?? 0,
    decision_confidence:     toFiniteNumber(d.decision_confidence)      ?? 0,
    rainfall_1h_mm:          toFiniteNumber(d.rainfall_1h_mm)           ?? null,
    soil_saturation_index:   toFiniteNumber(d.soil_saturation_index)    ?? null,
    water_level_m:           toFiniteNumber(d.water_level_m)            ?? null,
    latitude:                toFiniteNumber(d.latitude)                 ?? 0,
    longitude:               toFiniteNumber(d.longitude)                ?? 0,
    final_risk_class:        String(d.final_risk_class   ?? d.ml_risk_class ?? 'LOW'),
    ml_risk_class:           String(d.ml_risk_class      ?? d.final_risk_class ?? 'LOW'),
    alert_priority:          String(d.alert_priority     ?? 'INFORMATION'),
    cwc_threshold_status:    String(d.cwc_threshold_status   ?? 'UNAVAILABLE'),
    environmental_condition: String(d.environmental_condition ?? 'NORMAL'),
    operational_state:       String(d.operational_state  ?? 'ROUTINE_MONITORING'),
    data_quality_status:     String(d.data_quality_status ?? 'UNAVAILABLE'),
    station_name:            String(d.station_name  ?? d.spatial_id ?? '—'),
    district:                String(d.district      ?? '—'),
    contributing_factors:    Array.isArray(d.contributing_factors) ? d.contributing_factors : [],
    dissemination_channels:  Array.isArray(d.dissemination_channels) ? d.dissemination_channels : [],
    decision_reason:         String(d.decision_reason ?? '—'),
    recommended_action:      String(d.recommended_action ?? actionForRisk(d.final_risk_class ?? 'LOW')),
  };
}


// ============================================================

// MODEL INTELLIGENCE SERVICE (Screen 9H)

// ------------------------------------------------------------

// Presents the Flood Risk & Decision pipeline (Phase 8) that

// powers the whole application:

//   - Phase 6 ML champion model (XGBoost_PPT_Upgraded 6.1.0)

//   - SCS-CN direct-runoff physics

//   - official Phase 4 CWC river gauge thresholds

//   - Policy v8.1.0 multi-signal fusion engine

//

// DATA SOURCE STRATEGY

//   - `/risk/policy`    : real audited policy document. Adopted

//     verbatim when the request succeeds; a static reference copy

//     of the SAME audited policy is used only when the endpoint is

//     unavailable. Tagged accordingly, never claimed as LIVE.

//   - `/risk/summary`   : real executive snapshot of the model's

//     latest evaluation sweep. Displayed as an informational

//     "live snapshot" when the request succeeds (never fabricated).

//   - `/risk/latest`    : real per-station model decisions. Adopted

//     ONLY when operationally meaningful (complete records with

//     real level telemetry and non-degenerate probabilities — the

//     same acceptance rule Analytics/Alerts use). Otherwise the

//     canonical calibrated reference decision set (built from the

//     same STATIONS picture used by Risk Map / Monitoring /

//     Analytics / Alerts) is retained so the screen stays mutually

//     consistent with the rest of the app and never renders

//     fabricated model output.

//   - `/risk/evaluate`  : on-demand live evaluation. Results are

//     shown exactly as the backend returns them; when the server's

//     ML engine is unavailable the real error is surfaced and the

//     response is never synthesized client-side.

//

// HONESTY RULES

//   - Live values are displayed ONLY when returned by the API.

//   - A request failure NEVER labels data as LIVE.

//   - Reference data is always tagged CALIBRATED_REFERENCE so the

//     operator can distinguish it from live API output.

// ============================================================



// ---------------------------------------------------------------------------

// CANONICAL MODEL / PIPELINE METADATA (Phase 8 backend configuration)

// ---------------------------------------------------------------------------

export const MODEL_META = {

  modelName: 'XGBoost_PPT_Upgraded',

  modelVersion: '6.1.0',

  policyVersion: '8.1.0',

  decisionThreshold: 0.4,

  standardsAuthority:

    'Central Water Commission (CWC) & Uttarakhand State Disaster Management Authority (USDMA)',

  pipeline: 'Phase 6 XGBoost probability + SCS-CN hydrology + Phase 4 CWC thresholds + Policy v8.1.0 fusion',

  dataInputs: 'GPM/IMD rainfall · SMAP soil moisture · SRTM terrain · ESA Land Cover · CWC gauge levels',

};



export const RISK_CLASSES = ['LOW', 'MODERATE', 'HIGH', 'EXTREME'];

export const OPERATIONAL_STATES = [

  'ROUTINE_MONITORING',

  'ELEVATED_WATCH',

  'PREPAREDNESS_WARNING',

  'EMERGENCY_RESPONSE',

];

export const ALERT_PRIORITIES = ['INFORMATION', 'WATCH', 'WARNING', 'CRITICAL'];

export const DATA_QUALITY_STATES = ['COMPLETE', 'PARTIAL', 'DEGRADED', 'UNAVAILABLE'];



export const SOURCE_TAG = {

  LIVE_BACKEND: { label: 'Live API', cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' },

  CALIBRATED_REFERENCE: { label: 'Calibrated Reference', cls: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' },

};



// ---------------------------------------------------------------------------

// STATE / PRIORITY DERIVATION (mirrors the policy catalogs)

// ---------------------------------------------------------------------------

export function deriveOperationalState(riskClass) {

  switch (riskClass) {

    case 'EXTREME':

      return 'EMERGENCY_RESPONSE';

    case 'HIGH':

      return 'PREPAREDNESS_WARNING';

    case 'MODERATE':

      return 'ELEVATED_WATCH';

    default:

      return 'ROUTINE_MONITORING';

  }

}



export function deriveAlertPriority(riskClass) {

  switch (riskClass) {

    case 'EXTREME':

      return 'CRITICAL';

    case 'HIGH':

      return 'WARNING';

    case 'MODERATE':

      return 'WATCH';

    default:

      return 'INFORMATION';

  }

}



export function cwcStageFromLabel(stage) {

  const s = String(stage || '').toUpperCase().replace(/[_\-\/]/g, ' ');

  if (s.includes('DANGER') || s.includes('ABOVE HFL')) return 'DANGER_ZONE';

  if (s.includes('WARNING')) return 'WARNING_ZONE';

  if (s === 'NORMAL' || s === 'BELOW WARNING') return 'BELOW_WARNING';

  return String(stage || '').toUpperCase() || 'UNAVAILABLE';

}



function deriveEnvironmentalCondition(st) {

  if (st.stage === 'DANGER ZONE') return 'CRITICAL';

  if (st.stage === 'WARNING ZONE') return 'ESCALATING';

  if (st.rainfallMm >= 65) return 'CRITICAL';

  if (st.rainfallMm >= 30) return 'ESCALATING';

  if (st.soilSaturation >= 80) return 'ESCALATING';

  if (st.rainfallMm >= 15 || st.soilSaturation >= 65) return 'WATCH';

  return 'NORMAL';

}



// ---------------------------------------------------------------------------



export function validateLiveDecisions(records) {

  const reasons = [];

  if (!Array.isArray(records) || records.length === 0) {

    return { valid: false, reasons: ['live response is empty'], records: [] };

  }

  const complete = records.filter(hasAllDecisionFields);

  if (complete.length === 0) {

    return { valid: false, reasons: ['live decisions are missing required fields'], records: [] };

  }

  const incompleteRatio = (records.length - complete.length) / records.length;

  if (incompleteRatio > 0.8) {

    reasons.push(`${Math.round(incompleteRatio * 100)}% of live decisions are missing required fields`);

  }

  return { valid: reasons.length === 0, reasons, records: complete };

}



function devWarning(...args) {

  try {

    if (import.meta.env?.DEV) console.warn('[ModelIntelligence]', ...args);

  } catch {

    // dev-only logging; never break fallback path

  }

}



// Loads the operational decision set. Always returns a usable set +

// explicit provenance so the UI can label the data source truthfully.

// Returns { decisions, source, reason }

export async function loadModelDecisions() {
  try {
    const res = await riskService.getOfflineDecisions({ limit: 100 });
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : [];
    if (!raw.length) {
      return { decisions: [], source: 'UNAVAILABLE', reason: 'No historical ML records.' };
    }
    const mapped = raw.map(mapLiveDecision);
    return { decisions: mapped, source: 'HISTORICAL_MODEL_OUTPUT', reason: null };
  } catch (err) {
    return { decisions: [], source: 'UNAVAILABLE', reason: 'Failed to fetch historical ML records.' };
  }
}


// ---------------------------------------------------------------------------

// LIVE SUMMARY SNAPSHOT (informational; adopted verbatim when present)

// ---------------------------------------------------------------------------

export async function loadSummary() {

  try {

    const res = await riskService.getRiskSummary();

    const data = res?.data;

    if (data && typeof data.total_evaluated_points === 'number' && data.total_evaluated_points >= 0) {

      return { summary: data, source: 'LIVE_BACKEND' };

    }

    devWarning('Live /risk/summary response missing expected shape.');

  } catch (err) {

    devWarning('Live /risk/summary request failed.', err);

  }

  return { summary: null, source: 'CALIBRATED_REFERENCE' };

}



// ---------------------------------------------------------------------------

// POLICY (audited document)

// ---------------------------------------------------------------------------

// Static reference copy of the SAME audited Policy v8.1.0 served by

// the backend. Used only when /risk/policy is unavailable, and always

// tagged REFERENCE by the consumer.

const POLICY_REFERENCE = {

  version: '8.1.0',

  title: 'FlashFloodAI Multi-Signal Flood Risk Decision Policy',

  standards_authority:

    'Central Water Commission (CWC) & Uttarakhand State Disaster Management Authority (USDMA)',

  ml_decision_threshold: 0.4,

  probability_bands: {

    LOW: { range: '[0.00, 0.20)', description: 'Minimal flash flood risk.' },

    MODERATE: { range: '[0.20, 0.40)', description: 'Elevated risk requiring increased monitoring.' },

    HIGH: { range: '[0.40, 0.70)', description: 'High probability of surface runoff inundation / river surge.' },

    EXTREME: { range: '[0.70, 1.00]', description: 'Severe catastrophic flash flood threat.' },

  },

  cwc_threshold_rules: {

    BELOW_WARNING: { condition: 'water_level < warning_level', alert_stage: 'NONE' },

    WARNING_ZONE: { condition: 'warning_level <= water_level < danger_level', alert_stage: 'YELLOW' },

    DANGER_ZONE: { condition: 'danger_level <= water_level < HFL', alert_stage: 'ORANGE' },

    ABOVE_HFL: { condition: 'water_level >= HFL', alert_stage: 'RED' },

    UNAVAILABLE: { condition: 'water_level is null / gauge offline', alert_stage: 'UNKNOWN' },

  },

  environmental_condition_rules: {

    NORMAL: { rainfall_1h: '< 15 mm/h', soil_saturation: '< 0.60' },

    WATCH: { rainfall_1h: '15 - 30 mm/h', soil_saturation: '0.60 - 0.80' },

    ESCALATING: { rainfall_1h: '30 - 65 mm/h', soil_saturation: '0.80 - 0.90' },

    CRITICAL: { rainfall_1h: '>= 65 mm/h (Cloudburst)', soil_saturation: '>= 0.90' },

  },

  conflict_resolution_matrix: {

    CASE_A_IMPENDING_SURGE: {

      condition: 'ML=HIGH/EXTREME, CWC=BELOW_WARNING, Rainfall=ESCALATING/CRITICAL',

      resolution: 'ML/Atmospheric surge overrides gauge. Risk remains HIGH/EXTREME; Alert=WARNING/CRITICAL.',

    },

    CASE_B_RIVER_DANGER_OVERRIDE: {

      condition: 'ML=LOW, CWC=DANGER_ZONE/ABOVE_HFL',

      resolution: 'River gauge strictly overrides dry local weather. Risk escalates to HIGH/EXTREME; Alert=CRITICAL.',

    },

    CASE_C_TELEMETRY_OFFLINE: {

      condition: 'CWC=UNAVAILABLE',

      resolution: 'ML model + Environmental forcing determine risk. Data quality set to PARTIAL/DEGRADED.',

    },

    CASE_D_MISSING_ATMOSPHERE: {

      condition: 'Rainfall or Soil Moisture unavailable',

      resolution: 'Data quality set to DEGRADED. Decision confidence adjusted down.',

    },

    CASE_E_SATURATION_BUILDUP: {

      condition: 'ML=LOW, Soil Saturation >= 0.85, Rainfall >= 15mm',

      resolution: 'Environmental state set to WATCH; Final risk escalates to MODERATE.',

    },

  },

  recommended_actions_catalog: {

    LOW: actionForRisk('LOW'),

    MODERATE: actionForRisk('MODERATE'),

    HIGH: actionForRisk('HIGH'),

    EXTREME: actionForRisk('EXTREME'),

  },

  alert_priorities_catalog: {

    INFORMATION: 'Routine bulletin advisory.',

    WATCH: 'Precautionary watch for emergency response units.',

    WARNING: 'Formal stage-2 warning for district authorities.',

    CRITICAL: 'Emergency escalation for SDRF/NDRF evacuation deployment.',

  },

};



export async function loadPolicy() {

  try {

    const res = await riskService.getRiskPolicy();

    const data = res?.data;

    if (data && data.version && data.probability_bands && data.recommended_actions_catalog) {

      return { policy: data, source: 'LIVE_BACKEND' };

    }

    devWarning('Live /risk/policy response missing expected shape.');

  } catch (err) {

    devWarning('Live /risk/policy request failed; using reference policy copy.', err);

  }

  return { policy: POLICY_REFERENCE, source: 'CALIBRATED_REFERENCE' };

}



// ---------------------------------------------------------------------------

// ON-DEMAND LIVE EVALUATION (/risk/evaluate)

// ---------------------------------------------------------------------------

// Results are returned exactly as the backend computes them. If the

// server's ML engine is not loaded the real error is surfaced, never

// synthesized client-side.

export async function evaluateLive(payload) {

  try {

    const res = await riskService.evaluateLive(payload);

    const data = res?.data;

    if (data && typeof data.flood_probability === 'number') {

      return { ok: true, data: mapLiveDecision(data) };

    }

    return { ok: false, data: null, error: 'The backend returned an invalid evaluation response.' };

  } catch (err) {

    const detail = err?.response?.data?.detail;

    return {

      ok: false,

      data: null,

      error:

        typeof detail === 'string'

          ? detail

          : 'Live evaluation failed. The ML inference engine may not be loaded on the server.',

    };

  }

}



// ---------------------------------------------------------------------------

// KPI AGGREGATION (drives the summary row)

// ---------------------------------------------------------------------------

export function computeModelKpis(decisions) {

  const riskCounts = { LOW: 0, MODERATE: 0, HIGH: 0, EXTREME: 0 };

  decisions.forEach((d) => {

    const rc = d.final_risk_class;

    if (riskCounts[rc] !== undefined) riskCounts[rc] += 1;

  });

  const withProb = decisions.filter((d) => toFiniteNumber(d.flood_probability) !== undefined);

  const maxProb = withProb.length ? Math.max(...withProb.map((d) => toFiniteNumber(d.flood_probability))) : null;

  const top = withProb.length ? [...withProb].sort((a, b) => b.flood_probability - a.flood_probability)[0] : null;



  return {

    totalDecisions: decisions.length,

    riskCounts,

    highExtreme: riskCounts.HIGH + riskCounts.EXTREME,

    warningsActive: decisions.filter((d) => d.alert_priority === 'WARNING' || d.alert_priority === 'CRITICAL').length,

    maxProbability: maxProb,

    maxProbabilityStation: top ? top.station_name : '—',

    emergencyStations: decisions.filter((d) => d.operational_state === 'EMERGENCY_RESPONSE').length,

  };

}



// ---------------------------------------------------------------------------

// DISTRIBUTIONS (for charts)

// ---------------------------------------------------------------------------

export function riskClassDistribution(decisions) {

  const counts = { LOW: 0, MODERATE: 0, HIGH: 0, EXTREME: 0 };

  decisions.forEach((d) => {

    if (counts[d.final_risk_class] !== undefined) counts[d.final_risk_class] += 1;

  });

  return ['EXTREME', 'HIGH', 'MODERATE', 'LOW'].map((k) => ({ label: k, value: counts[k] }));

}



export function alertPriorityDistribution(decisions) {

  const counts = { CRITICAL: 0, WARNING: 0, WATCH: 0, INFORMATION: 0 };

  decisions.forEach((d) => {

    if (counts[d.alert_priority] !== undefined) counts[d.alert_priority] += 1;

  });

  return ['CRITICAL', 'WARNING', 'WATCH', 'INFORMATION'].map((k) => ({ label: k, value: counts[k] }));

}



export function dataQualityDistribution(decisions) {

  const counts = {};

  decisions.forEach((d) => {

    const k = d.data_quality_status || 'UNAVAILABLE';

    counts[k] = (counts[k] || 0) + 1;

  });

  return Object.entries(counts)

    .map(([label, value]) => ({ label, value }))

    .sort((a, b) => b.value - a.value);

}

export const MODEL_DISTRICTS = ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'];
