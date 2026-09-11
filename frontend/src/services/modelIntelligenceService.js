import riskService from './riskService';
import { STATIONS, primaryDriver, resolveBasin } from './analyticsService';
import { SIM_REFERENCE, SIM_DATE } from './alertsService';

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
// CANONICAL CALIBRATED REFERENCE DECISIONS
// ---------------------------------------------------------------------------
// Built from the SAME STATIONS picture used by Risk Map, Monitoring,
// Analytics and Alerts so every value is mutually consistent. Fields
// mirror RiskDecisionResponse so live and reference records render
// identically. Deterministic: no randomization, no Date.now().
// ---------------------------------------------------------------------------
function buildReferenceDecisions() {
  return STATIONS.map((s) => {
    const driver = primaryDriver(s);
    const stage = cwcStageFromLabel(s.stage);
    const condition = deriveEnvironmentalCondition(s);
    const weight = (lv) => (lv === 'HIGH' || lv === 'DOMINANT' ? 'HIGH' : lv === 'MODERATE' ? 'MEDIUM' : 'LOW');

    const factors = [
      {
        factor_name: 'ML_FLOOD_PROBABILITY',
        observed_value: s.prob,
        status_label: s.risk,
        impact_weight: weight(s.prob >= 0.4 ? 'HIGH' : s.prob >= 0.2 ? 'MEDIUM' : 'LOW'),
        explanation: `XGBoost champion model predicts ${(s.prob * 100).toFixed(1)}% probability of flash flooding at this location.`,
      },
      {
        factor_name: 'CWC_RIVER_GAUGE_STAGE',
        observed_value: s.waterLevel,
        status_label: stage,
        impact_weight: stage === 'DANGER_ZONE' ? 'DOMINANT' : stage === 'WARNING_ZONE' ? 'HIGH' : 'MEDIUM',
        explanation: `Observed river stage is in official CWC ${stage.replace(/_/g, ' ')} state (calibrated reference telemetry).`,
      },
      {
        factor_name: 'RAINFALL_INTENSITY',
        observed_value: s.rainfallMm,
        status_label: condition,
        impact_weight: condition === 'CRITICAL' || condition === 'ESCALATING' ? 'HIGH' : 'MEDIUM',
        explanation: `Observed reference rainfall accumulation is ${s.rainfallMm} mm/h (${condition} state).`,
      },
      {
        factor_name: 'SOIL_SATURATION',
        observed_value: s.soilSaturation / 100,
        status_label: s.soilSaturation >= 80 ? 'HIGH_SATURATION' : 'NORMAL',
        impact_weight: s.soilSaturation >= 80 ? 'HIGH' : 'LOW',
        explanation: `${s.soilSaturation}% soil saturation index modulating surface infiltration capacity.`,
      },
    ];

    return {
      spatial_id: s.id,
      sample_id: `REF_${s.id}`,
      sample_type: 'calibrated_reference',
      station_id: s.id,
      station_name: s.name,
      district: s.district,
      river_name: s.river,
      major_basin: resolveBasin(s.river),
      latitude: s.lat,
      longitude: s.lon,
      model_name: MODEL_META.modelName,
      model_version: MODEL_META.modelVersion,
      flood_probability: s.prob,
      ml_risk_class: s.risk,
      ml_decision_threshold: MODEL_META.decisionThreshold,
      water_level_m: s.waterLevel,
      warning_level_m: s.warningLevel,
      danger_level_m: s.dangerLevel,
      hfl_m: null,
      cwc_threshold_status: stage,
      official_alert_stage: stage === 'DANGER_ZONE' ? 'ORANGE' : stage === 'WARNING_ZONE' ? 'YELLOW' : stage === 'ABOVE_HFL' ? 'RED' : stage === 'BELOW_WARNING' ? 'NONE' : 'UNKNOWN',
      is_gauge_offline: false,
      rainfall_1h_mm: s.rainfallMm,
      rainfall_3h_mm: null,
      soil_saturation_index: Math.round((s.soilSaturation / 100) * 1000) / 1000,
      scs_direct_runoff_q_mm: s.runoff === 'HIGH' ? 22 : 4,
      scs_peak_runoff_potential: s.runoff === 'HIGH' ? 27.5 : 5,
      environmental_condition: condition,
      final_risk_class: s.risk,
      operational_state: deriveOperationalState(s.risk),
      alert_priority: deriveAlertPriority(s.risk),
      decision_reason:
        driver === 'Water Level'
          ? `Hydrological signal dominant: river stage is in official CWC ${stage.replace(/_/g, ' ')} (calibrated reference, consistent with Risk Map/Monitoring).`
          : driver === 'Rainfall'
          ? `Atmospheric signal dominant: rainfall intensity of ${s.rainfallMm} mm/h drives elevated runoff response (calibrated reference).`
          : driver === 'Soil Saturation'
          ? `Catchment saturation signal dominant: ${s.soilSaturation}% saturated soil sharply raises runoff response (calibrated reference).`
          : `Multiple signals indicate elevated runoff potential at ${s.name} (calibrated reference).`,
      recommended_action: '',
      contributing_factors: factors,
      data_quality_status: 'CALIBRATED_REFERENCE',
      decision_confidence: null,
      risk_policy_version: MODEL_META.policyVersion,
      threshold_source: 'CWC Hydrological Records (canonical)',
      generated_at_utc: `${SIM_DATE} · ${SIM_REFERENCE}`,
      source: 'CALIBRATED_REFERENCE',
    };
  });
}

export const REFERENCE_DECISIONS = buildReferenceDecisions();

export const MODEL_DISTRICTS = Array.from(
  new Set(REFERENCE_DECISIONS.map((d) => d.district))
).sort();

function actionForRisk(riskClass) {
  switch (riskClass) {
    case 'EXTREME':
      return 'Activate emergency escalation protocol. Alert SDRF/NDRF and local administration. Prepare and execute immediate evacuation procedures for low-lying floodplain and riparian zones.';
    case 'HIGH':
      return 'Issue Stage-2 preparedness advisory to District Emergency Operations Centre (DEOC). Inspect vulnerable embankments and deploy emergency response assets to staging areas.';
    case 'MODERATE':
      return 'Increase sensor telemetry polling frequency. Alert local field observers and inspect vulnerable drainage catchments and bridges.';
    default:
      return 'Continue routine hydrological and meteorological monitoring. Maintain normal river gauge and weather telemetry poll cycles.';
  }
}

// Attach recommended action to reference decisions (uses the same policy catalog).
export const REFERENCE_DECISIONS_WITH_ACTIONS = REFERENCE_DECISIONS.map((d) => ({
  ...d,
  recommended_action: actionForRisk(d.final_risk_class),
}));

// ---------------------------------------------------------------------------
// LIVE DECISION MAPPING + VALIDATION (same acceptance rule as Analytics/Alerts)
// ---------------------------------------------------------------------------
const DEGENERATE_PROBABILITY_THRESHOLD = 0.05;

function toFiniteNumber(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRiskClass(value) {
  const s = String(value ?? '').toUpperCase();
  return RISK_CLASSES.includes(s) ? s : undefined;
}

function normalizeStage(value) {
  const s = String(value ?? '').toUpperCase().replace(/[_\-]/g, ' ');
  if (s.includes('DANGER') || s.includes('ABOVE HFL')) return 'DANGER_ZONE';
  if (s.includes('WARNING')) return 'WARNING_ZONE';
  if (s === 'BELOW WARNING' || s === 'BELOW' || s === 'NORMAL') return 'BELOW_WARNING';
  return s || 'UNAVAILABLE';
}

function mapLiveDecision(raw) {
  const risk = normalizeRiskClass(raw.final_risk_class ?? raw.ml_risk_class ?? raw['finalRiskClass']);
  return {
    spatial_id: String(raw.spatial_id ?? raw.sample_id ?? ''),
    sample_id: String(raw.sample_id ?? ''),
    sample_type: String(raw.sample_type ?? ''),
    station_id: raw.station_id ?? null,
    station_name: raw.station_name || raw.spatial_id || 'Location',
    district: raw.district || 'Uttarakhand',
    river_name: raw.river_name || null,
    major_basin: raw.major_basin || null,
    latitude: toFiniteNumber(raw.latitude),
    longitude: toFiniteNumber(raw.longitude),
    model_name: raw.model_name || MODEL_META.modelName,
    model_version: raw.model_version || MODEL_META.modelVersion,
    flood_probability: toFiniteNumber(raw.flood_probability),
    ml_risk_class: normalizeRiskClass(raw.ml_risk_class),
    ml_decision_threshold: toFiniteNumber(raw.ml_decision_threshold) ?? MODEL_META.decisionThreshold,
    water_level_m: toFiniteNumber(raw.water_level_m),
    warning_level_m: toFiniteNumber(raw.warning_level_m),
    danger_level_m: toFiniteNumber(raw.danger_level_m),
    hfl_m: toFiniteNumber(raw.hfl_m),
    cwc_threshold_status: normalizeStage(raw.cwc_threshold_status),
    official_alert_stage: String(raw.official_alert_stage ?? 'UNKNOWN'),
    is_gauge_offline: Boolean(raw.is_gauge_offline),
    rainfall_1h_mm: toFiniteNumber(raw.rainfall_1h_mm),
    rainfall_3h_mm: toFiniteNumber(raw.rainfall_3h_mm),
    soil_saturation_index: toFiniteNumber(raw.soil_saturation_index),
    scs_direct_runoff_q_mm: toFiniteNumber(raw.scs_direct_runoff_q_mm),
    scs_peak_runoff_potential: toFiniteNumber(raw.scs_peak_runoff_potential),
    environmental_condition: String(raw.environmental_condition ?? 'NORMAL'),
    final_risk_class: risk,
    operational_state: String(raw.operational_state ?? deriveOperationalState(risk)),
    alert_priority: String(raw.alert_priority ?? deriveAlertPriority(risk)),
    decision_reason: String(raw.decision_reason ?? ''),
    recommended_action: String(raw.recommended_action ?? actionForRisk(risk)),
    contributing_factors: Array.isArray(raw.contributing_factors) ? raw.contributing_factors : [],
    data_quality_status: String(raw.data_quality_status ?? 'UNAVAILABLE'),
    decision_confidence: toFiniteNumber(raw.decision_confidence),
    risk_policy_version: String(raw.risk_policy_version ?? MODEL_META.policyVersion),
    threshold_source: raw.threshold_source || null,
    generated_at_utc: raw.generated_at_utc || raw.timestamp_utc || 'Live',
    source: 'LIVE_BACKEND',
  };
}

const REQUIRED_DECISION_FIELDS = [
  'spatial_id',
  'station_name',
  'district',
  'flood_probability',
  'final_risk_class',
  'cwc_threshold_status',
  'decision_reason',
  'recommended_action',
];

function hasAllDecisionFields(record) {
  return REQUIRED_DECISION_FIELDS.every((field) => {
    const v = record[field];
    if (v === undefined || v === null || v === '') return false;
    return true;
  });
}

export function validateLiveDecisions(records) {
  const reasons = [];
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: false, reasons: ['live response is empty'], records: [] };
  }
  const complete = records.filter(hasAllDecisionFields);
  if (complete.length === 0) {
    return { valid: false, reasons: ['live decisions are missing required fields'], records: [] };
  }
  const maxProb = Math.max(...complete.map((r) => toFiniteNumber(r.flood_probability) || 0));
  if (maxProb <= DEGENERATE_PROBABILITY_THRESHOLD) {
    reasons.push(`peak probability ${(maxProb * 100).toFixed(2)}% is near-zero (degenerate snapshot)`);
  }
  const hasLevelTelemetry = complete.some((r) => toFiniteNumber(r.water_level_m) > 0);
  if (!hasLevelTelemetry) reasons.push('no valid river level telemetry in the snapshot');
  const incompleteRatio = (records.length - complete.length) / records.length;
  if (incompleteRatio > 0.5) {
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
    const res = await riskService.getLatestDecisions({ limit: 100 });
    const payload = Array.isArray(res) ? res : res?.data;
    const raw = Array.isArray(payload) ? payload : [];
    if (!raw.length) {
      devWarning('Live decisions empty — retaining calibrated reference.');
      return { decisions: REFERENCE_DECISIONS_WITH_ACTIONS, source: 'CALIBRATED_REFERENCE', reason: 'Live /risk/latest returned no records.' };
    }
    const mapped = raw.map(mapLiveDecision);
    const { valid, reasons, records } = validateLiveDecisions(mapped);
    if (valid && records.length > 0) {
      devWarning(`Adopting validated live decisions (${records.length}).`);
      return { decisions: records, source: 'LIVE_BACKEND', reason: null };
    }
    devWarning(`Live decisions rejected (${reasons.join('; ')}). Retaining calibrated reference.`);
    return {
      decisions: REFERENCE_DECISIONS_WITH_ACTIONS,
      source: 'CALIBRATED_REFERENCE',
      reason: `Live model snapshot rejected: ${reasons.join('; ')}.`,
    };
  } catch (err) {
    devWarning('Live decisions fetch failed; retaining calibrated reference.', err);
    return {
      decisions: REFERENCE_DECISIONS_WITH_ACTIONS,
      source: 'CALIBRATED_REFERENCE',
      reason: 'Live /risk/latest request failed. Showing calibrated reference.',
    };
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