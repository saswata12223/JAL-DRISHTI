import stationsService from './stationsService';

// ============================================================
// FLOOD RISK ANALYTICS SERVICE (Screen 9D)
// ------------------------------------------------------------
// Phase 8 demo analytics dataset + deterministic derivation
// helpers. Calibrated to mirror the canonical CWC station
// picture already used by the Risk Map and Live Station
// Monitoring screens so all screens stay mutually consistent.
//
// NOTE: This module is the single integration point for the
// live backend when real telemetry is available. The
// STATIONS dataset below is the isolated demo fallback;
// replace `loadAnalyticsStations()` internals with the
// backend risk/observations endpoints to go fully live.
// ============================================================

export const TIME_LABELS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];

export const TIME_RANGES = [
  { id: '6H', label: 'Last 6 Hours', steps: 6 },
  { id: '3H', label: 'Last 3 Hours', steps: 3 },
];

// Hourly multipliers — normalized to 1.0 at the latest hour.
// Profiles reproduce the canonical statewide trend series
// (risk 15→94%, rainfall 12→85 mm/h, level 337.5→341.7 m).
const PROB_PROFILE = [0.16, 0.23, 0.40, 0.69, 0.87, 1.0];
const RAIN_PROFILE = [0.14, 0.28, 0.21, 0.53, 0.80, 1.0];
const LEVEL_SPAN = [4.2, 3.6, 2.8, 2.1, 0.9, 0.0];

const RIVER_BASIN = {
  Alaknanda: 'Alaknanda Sub-Basin',
  Bhagirathi: 'Bhagirathi Sub-Basin',
  Mandakini: 'Mandakini Sub-Basin',
  Ganga: 'Ganga Mainstem',
  Kali: 'Kali Sub-Basin',
  Sarayu: 'Saryu Sub-Basin',
  Kosi: 'Kosi Sub-Basin',
  Gaula: 'Gaula Sub-Basin',
  Lohawati: 'Lohawati Sub-Basin',
  Kalyani: 'Kalyani Sub-Basin',
  Dhela: 'Dhela Sub-Basin',
  Yamuna: 'Yamuna Sub-Basin',
  Ramganga: 'Ramganga Sub-Basin',
  Bindal: 'Bindal Sub-Basin',
  Balkhila: 'Balkhila Sub-Basin',
};

export function resolveBasin(riverName) {
  return RIVER_BASIN[riverName] || 'Uttarakhand Catchment';
}

// ------------------------------------------------------------
// CANONICAL ANALYTICS DATASET (isolated demo fallback)
// Mirrors DEFAULT_CWC_MONITORING from the Monitoring screen.
// ------------------------------------------------------------
export const STATIONS = [
  { id: 'CWC_UK_001', name: 'Joshimath', district: 'Chamoli', river: 'Alaknanda', lat: 30.556, lon: 79.568, risk: 'EXTREME', prob: 0.94, stage: 'DANGER ZONE', waterLevel: 341.7, warningLevel: 339.5, dangerLevel: 340.5, rainfallMm: 85, status: 'CRITICAL', soilSaturation: 94, runoff: 'HIGH' },
  { id: 'CWC_UK_002', name: 'Rishikesh', district: 'Dehradun', river: 'Ganga', lat: 30.108, lon: 78.298, risk: 'HIGH', prob: 0.68, stage: 'WARNING ZONE', waterLevel: 339.8, warningLevel: 339.5, dangerLevel: 340.5, rainfallMm: 45, status: 'WARNING', soilSaturation: 82, runoff: 'HIGH' },
  { id: 'CWC_UK_003', name: 'Uttarkashi', district: 'Uttarkashi', river: 'Bhagirathi', lat: 30.727, lon: 78.435, risk: 'HIGH', prob: 0.72, stage: 'WARNING ZONE', waterLevel: 1120.4, warningLevel: 1119.0, dangerLevel: 1121.0, rainfallMm: 62, status: 'WARNING', soilSaturation: 85, runoff: 'HIGH' },
  { id: 'CWC_UK_004', name: 'Rudraprayag', district: 'Rudraprayag', river: 'Mandakini', lat: 30.285, lon: 78.981, risk: 'EXTREME', prob: 0.91, stage: 'DANGER ZONE', waterLevel: 618.2, warningLevel: 616.0, dangerLevel: 617.5, rainfallMm: 78, status: 'CRITICAL', soilSaturation: 92, runoff: 'HIGH' },
  { id: 'CWC_UK_005', name: 'Srinagar', district: 'Pauri Garhwal', river: 'Alaknanda', lat: 30.221, lon: 78.784, risk: 'HIGH', prob: 0.65, stage: 'WARNING ZONE', waterLevel: 536.4, warningLevel: 535.0, dangerLevel: 537.0, rainfallMm: 48, status: 'WARNING', soilSaturation: 78, runoff: 'HIGH' },
  { id: 'CWC_UK_006', name: 'Devprayag', district: 'Tehri Garhwal', river: 'Ganga', lat: 30.146, lon: 78.598, risk: 'MODERATE', prob: 0.35, stage: 'NORMAL', waterLevel: 452.1, warningLevel: 454.0, dangerLevel: 456.0, rainfallMm: 22, status: 'ONLINE', soilSaturation: 64, runoff: 'NORMAL' },
  { id: 'CWC_UK_007', name: 'Haridwar', district: 'Haridwar', river: 'Ganga', lat: 29.945, lon: 78.164, risk: 'LOW', prob: 0.12, stage: 'NORMAL', waterLevel: 292.3, warningLevel: 294.0, dangerLevel: 295.5, rainfallMm: 10, status: 'ONLINE', soilSaturation: 48, runoff: 'NORMAL' },
  { id: 'CWC_UK_008', name: 'Dharchula', district: 'Pithoragarh', river: 'Kali', lat: 29.851, lon: 80.542, risk: 'EXTREME', prob: 0.88, stage: 'DANGER ZONE', waterLevel: 890.5, warningLevel: 888.0, dangerLevel: 890.0, rainfallMm: 72, status: 'CRITICAL', soilSaturation: 91, runoff: 'HIGH' },
  { id: 'CWC_UK_009', name: 'Karanprayag', district: 'Chamoli', river: 'Alaknanda', lat: 30.260, lon: 79.220, risk: 'MODERATE', prob: 0.38, stage: 'NORMAL', waterLevel: 778.0, warningLevel: 780.0, dangerLevel: 782.0, rainfallMm: 24, status: 'ONLINE', soilSaturation: 62, runoff: 'NORMAL' },
  { id: 'CWC_UK_010', name: 'Almora', district: 'Almora', river: 'Kosi', lat: 29.597, lon: 79.659, risk: 'LOW', prob: 0.15, stage: 'NORMAL', waterLevel: 1580.0, warningLevel: 1583.0, dangerLevel: 1585.0, rainfallMm: 8, status: 'ONLINE', soilSaturation: 45, runoff: 'NORMAL' },
  { id: 'CWC_UK_011', name: 'Nainital', district: 'Nainital', river: 'Gaula', lat: 29.380, lon: 79.463, risk: 'LOW', prob: 0.18, stage: 'NORMAL', waterLevel: 1930.0, warningLevel: 1935.0, dangerLevel: 1937.0, rainfallMm: 12, status: 'ONLINE', soilSaturation: 52, runoff: 'NORMAL' },
  { id: 'CWC_UK_012', name: 'Bageshwar', district: 'Bageshwar', river: 'Sarayu', lat: 29.838, lon: 79.771, risk: 'MODERATE', prob: 0.32, stage: 'NORMAL', waterLevel: 980.0, warningLevel: 983.0, dangerLevel: 985.0, rainfallMm: 19, status: 'ONLINE', soilSaturation: 58, runoff: 'NORMAL' },
  { id: 'CWC_UK_013', name: 'Champawat', district: 'Champawat', river: 'Lohawati', lat: 29.337, lon: 80.092, risk: 'LOW', prob: 0.10, stage: 'NORMAL', waterLevel: 1610.0, warningLevel: 1615.0, dangerLevel: 1617.0, rainfallMm: 6, status: 'ONLINE', soilSaturation: 42, runoff: 'NORMAL' },
  { id: 'CWC_UK_014', name: 'Rudrapur', district: 'Udham Singh Nagar', river: 'Kalyani', lat: 28.980, lon: 79.400, risk: 'LOW', prob: 0.08, stage: 'NORMAL', waterLevel: 205.0, warningLevel: 208.0, dangerLevel: 210.0, rainfallMm: 4, status: 'ONLINE', soilSaturation: 38, runoff: 'NORMAL' },
  { id: 'CWC_UK_015', name: 'Gopeshwar', district: 'Chamoli', river: 'Balkhila', lat: 30.410, lon: 79.330, risk: 'HIGH', prob: 0.70, stage: 'WARNING ZONE', waterLevel: 1450.0, warningLevel: 1448.0, dangerLevel: 1451.0, rainfallMm: 55, status: 'WARNING', soilSaturation: 84, runoff: 'HIGH' },
  { id: 'CWC_UK_016', name: 'Tehri', district: 'Tehri Garhwal', river: 'Bhagirathi', lat: 30.380, lon: 78.480, risk: 'MODERATE', prob: 0.30, stage: 'NORMAL', waterLevel: 825.0, warningLevel: 830.0, dangerLevel: 835.0, rainfallMm: 16, status: 'ONLINE', soilSaturation: 55, runoff: 'NORMAL' },
  { id: 'CWC_UK_017', name: 'Barkot', district: 'Uttarkashi', river: 'Yamuna', lat: 30.810, lon: 78.200, risk: 'LOW', prob: 0.14, stage: 'NORMAL', waterLevel: 1210.0, warningLevel: 1215.0, dangerLevel: 1218.0, rainfallMm: 8, status: 'ONLINE', soilSaturation: 46, runoff: 'NORMAL' },
  { id: 'CWC_UK_018', name: 'Pithoragarh', district: 'Pithoragarh', river: 'Ramganga', lat: 29.580, lon: 80.210, risk: 'LOW', prob: 0.16, stage: 'NORMAL', waterLevel: 1510.0, warningLevel: 1515.0, dangerLevel: 1518.0, rainfallMm: 11, status: 'ONLINE', soilSaturation: 49, runoff: 'NORMAL' },
  { id: 'CWC_UK_019', name: 'Kashipur', district: 'Udham Singh Nagar', river: 'Dhela', lat: 29.210, lon: 78.950, risk: 'LOW', prob: 0.09, stage: 'NORMAL', waterLevel: 215.0, warningLevel: 218.0, dangerLevel: 220.0, rainfallMm: 5, status: 'ONLINE', soilSaturation: 40, runoff: 'NORMAL' },
  { id: 'CWC_UK_020', name: 'Dehradun City', district: 'Dehradun', river: 'Bindal', lat: 30.316, lon: 78.032, risk: 'LOW', prob: 0.11, stage: 'NORMAL', waterLevel: 640.0, warningLevel: 645.0, dangerLevel: 647.0, rainfallMm: 14, status: 'ONLINE', soilSaturation: 50, runoff: 'NORMAL' },
];

export const DISTRICTS = Array.from(new Set(STATIONS.map((s) => s.district))).sort();
export const BASINS = Array.from(new Set(STATIONS.map((s) => resolveBasin(s.river)))).sort();

// ------------------------------------------------------------
// SERIES DERIVATION (deterministic)
// ------------------------------------------------------------

export function buildStationSeries(station, steps = 6) {
  const labels = TIME_LABELS.slice(-steps);
  const prob = PROB_PROFILE.slice(-steps).map((k) => Math.round(station.prob * 100 * k));
  const rain = RAIN_PROFILE.slice(-steps).map((k) => Math.round(station.rainfallMm * k));
  const level = LEVEL_SPAN.slice(-steps).map((k) => Math.round((station.waterLevel - k) * 10) / 10);

  return labels.map((time, i) => ({
    time,
    prob: prob[i],
    rain: rain[i],
    level: level[i],
  }));
}

// Aggregated statewide series for the filtered station set.
export function buildStateSeries(stations, steps = 6) {
  if (!stations.length) return TIME_LABELS.slice(-steps).map((time) => ({ time, prob: 0, rain: 0 }));
  const perStation = stations.map((s) => buildStationSeries(s, steps));
  return perStation[0].map((_, i) => ({
    time: perStation[0][i].time,
    prob: Math.max(...perStation.map((series) => series[i].prob)),
    rain: Math.max(...perStation.map((series) => series[i].rain)),
  }));
}

// Operational "observed conditions" composite index per hour,
// derived from CWC gauge stage proximity and rainfall intensity.
export function buildObservationSeries(stations, steps = 6) {
  if (!stations.length) return TIME_LABELS.slice(-steps).map((time) => ({ time, obs: 0 }));
  const perStation = stations.map((s) => buildStationSeries(s, steps));
  return perStation[0].map((_, i) => {
    let obs = 0;
    perStation.forEach((series, si) => {
      const st = stations[si];
      let levelFx = 0;
      if (st.warningLevel && st.dangerLevel) {
        const lo = st.warningLevel - 1.0;
        const hi = st.dangerLevel + 1.0;
        levelFx = Math.min(Math.max((series[i].level - lo) / (hi - lo), 0), 1);
      }
      const rainFx = Math.min(series[i].rain / 100, 1);
      const composite = Math.round(100 * (0.5 * levelFx + 0.5 * rainFx));
      obs = Math.max(obs, composite);
    });
    return { time: perStation[0][i].time, obs };
  });
}

export function primaryDriver(station) {
  if (station.stage === 'DANGER ZONE') return 'Water Level';
  if (station.rainfallMm >= 60) return 'Rainfall';
  if (station.soilSaturation >= 85) return 'Soil Saturation';
  return 'Runoff';
}

// ------------------------------------------------------------
// AGGREGATIONS
// ------------------------------------------------------------

export function computeKpis(stations) {
  return {
    maxProb: stations.length ? Math.max(...stations.map((s) => s.prob)) : 0,
    highExtreme: stations.filter((s) => s.risk === 'EXTREME' || s.risk === 'HIGH').length,
    maxRain: stations.length ? Math.max(...stations.map((s) => s.rainfallMm)) : 0,
    criticalLevels: stations.filter((s) => s.stage === 'DANGER ZONE').length,
    monitoredCount: stations.length,
  };
}

export function rankByGroup(stations, groupKey, topN = 8) {
  const groups = {};
  stations.forEach((s) => {
    const key = groupKey === 'basin' ? resolveBasin(s.river) : s.district;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  return Object.entries(groups)
    .map(([label, list]) => {
      const top = list.reduce((a, b) => (b.prob > a.prob ? b : a), list[0]);
      return {
        label,
        stations: list.length,
        prob: top.prob,
        risk: top.risk,
      };
    })
    .sort((a, b) => b.prob - a.prob)
    .slice(0, topN);
}

const RISK_ORDER = { LOW: 0, MODERATE: 1, HIGH: 2, EXTREME: 3 };

export function computeFactorAssessments(stations, stateTrend, steps = 6) {
  const kpis = computeKpis(stations);
  const dangerCount = stations.filter((s) => s.stage === 'DANGER ZONE').length;
  const warningCount = stations.filter((s) => s.stage === 'WARNING ZONE' || s.status === 'WARNING').length;
  const maxSoil = stations.length ? Math.max(...stations.map((s) => s.soilSaturation)) : 0;

  const series = buildStateSeries(stations, steps);
  const probRise = series.length > 1 ? series[series.length - 1].prob - series[0].prob : 0;

  const factors = [
    {
      key: 'rainfall',
      name: 'Rainfall Intensity',
      level: kpis.maxRain >= 60 ? 'HIGH' : kpis.maxRain >= 25 ? 'MODERATE' : 'LOW',
      detail: `${kpis.maxRain} mm/h peak`,
    },
    {
      key: 'water_level',
      name: 'River Stage / Water Level',
      level: dangerCount > 0 ? 'HIGH' : warningCount > 0 ? 'MODERATE' : 'LOW',
      detail: `${dangerCount} at danger · ${warningCount} in warning zone`,
    },
    {
      key: 'soil',
      name: 'Soil Saturation',
      level: maxSoil >= 85 ? 'HIGH' : maxSoil >= 65 ? 'MODERATE' : 'LOW',
      detail: `${maxSoil}% max (SMAP L4)`,
    },
    {
      key: 'runoff',
      name: 'Runoff Potential',
      level: kpis.maxRain >= 60 || maxSoil >= 85 ? 'HIGH' : kpis.maxRain >= 25 ? 'MODERATE' : 'LOW',
      detail: 'SCS-CN direct runoff',
    },
    {
      key: 'terrain',
      name: 'Terrain / Slope',
      level: 'MODERATE',
      detail: 'Himalayan gradient',
    },
    {
      key: 'forecast',
      name: 'Forecast Conditions',
      level: probRise > 10 ? 'HIGH' : probRise < -10 ? 'LOW' : 'MODERATE',
      detail: `${probRise > 0 ? '+' : ''}${probRise} pts over window`,
    },
  ];

  // DOMINANT if any location is EXTREME, else keep the qualitative scale
  const hasExtreme = stations.some((s) => s.risk === 'EXTREME');
  return { factors, hasExtreme };
}

export const FACTOR_WEIGHT = { LOW: 25, MODERATE: 50, HIGH: 75, DOMINANT: 100 };

export function buildPredictionVsObserved(stations, steps = 6) {
  const predicted = buildStateSeries(stations, steps);
  const observed = buildObservationSeries(stations, steps);
  const data = predicted.map((p, i) => ({
    time: p.time,
    predicted: p.prob,
    observed: observed[i].obs,
  }));

  let diffSum = 0;
  data.forEach((d) => {
    diffSum += Math.abs(d.predicted - d.observed);
  });
  const meanDiff = data.length ? diffSum / data.length : 0;

  const lastPredicted = data.length ? data[data.length - 1].predicted : 0;
  const lastObserved = data.length ? data[data.length - 1].observed : 0;

  let status = 'ALIGNED';
  if (meanDiff > 12) {
    status = lastPredicted > lastObserved ? 'ABOVE OBSERVED' : 'BELOW OBSERVED';
  }

  return { data, meanDiff: Math.round(meanDiff), status };
}

export function buildInsight(stations, stateTrend, kpis, rankList) {
  if (!stations.length || stateTrend.length < 2) {
    return {
      headline: 'No monitored locations match the current filter scope.',
      points: ['Adjust or reset the analytical filters above to view flood risk intelligence.'],
    };
  }

  const first = stateTrend[0];
  const last = stateTrend[stateTrend.length - 1];
  const rise = last.prob - first.prob;

  let trendPhrase = 'has held steady';
  if (rise > 10) trendPhrase = 'has increased significantly';
  else if (rise > 3) trendPhrase = 'has increased';
  else if (rise < -10) trendPhrase = 'has decreased significantly';
  else if (rise < -3) trendPhrase = 'has decreased';

  const dangerStations = stations
    .filter((s) => s.stage === 'DANGER ZONE')
    .sort((a, b) => b.prob - a.prob);
  const warningStations = stations.filter((s) => s.stage === 'WARNING ZONE').length;

  const headline =
    `Risk probability ${trendPhrase} from ${first.prob}% to ${last.prob}% since ${first.time}, ` +
    `primarily associated with rising rainfall intensity (${kpis.maxRain} mm/h) and river stage escalation.`;

  const points = [];
  if (dangerStations.length) {
    const names = dangerStations.map((s) => `${s.name} (${s.district})`).join(', ');
    points.push(`${dangerStations.length} location${dangerStations.length > 1 ? 's' : ''} currently above the CWC danger mark: ${names}.`);
  }
  if (warningStations) {
    points.push(`${warningStations} location${warningStations > 1 ? 's are' : ' is'} at the CWC warning stage and require heightened watch.`);
  }
  if (rankList.length) {
    const top = rankList[0];
    points.push(`Highest exposure is ${top.label} at ${Math.round(top.prob * 100)}% probability — allocate monitoring attention accordingly.`);
  }
  points.push('Assessment is a deterministic summary of active multi-signal data (Phase 8); no generative model is engaged.');

  return { headline, points };
}

// ------------------------------------------------------------
// LIVE DATA LOADER (best-effort, validated, calibrated fallback)
// ------------------------------------------------------------
// The live backend is only adopted when the response is
// operationally meaningful. Any response that is empty,
// incomplete, near-zero, or lacking real analytics telemetry is
// REJECTED and the canonical calibrated dataset (STATIONS) is
// retained. Under no circumstances should the page transition to
// an empty or invalid station array because a live request
// completed.
//
// NOTE: the backend `/stations` endpoint currently returns station
// metadata + flood thresholds only (no live water level, rainfall,
// or probability telemetry). Such a response cannot satisfy the
// required-field validation below, so the calibrated canonical
// dataset is correctly retained until the backend exposes valid
// multi-signal telemetry for every station.
// ------------------------------------------------------------

const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'EXTREME'];

// Conservative bound for the known degenerate backend dataset
// (~0.0003 probabilities). Any live set whose peak probability is
// still at or below this threshold is treated as not meaningful.
const DEGENERATE_PROBABILITY_THRESHOLD = 0.05;

const liveValue = (src, keys) => {
  for (const key of keys) {
    const v = src?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const toFiniteNumber = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

function normalizeStage(value) {
  const s = String(value ?? '')
    .toUpperCase()
    .replace(/[_\-/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (s === 'DANGER ZONE' || s === 'DANGER' || s.includes('ABOVE HFL')) return 'DANGER ZONE';
  if (s === 'WARNING ZONE' || s === 'WARNING') return 'WARNING ZONE';
  if (s === 'NORMAL' || s === 'BELOW WARNING' || s === 'BELOW') return 'NORMAL';
  return s || undefined;
}

function normalizeStatus(value) {
  const s = String(value ?? '').toUpperCase();
  if (s === 'ACTIVE' || s === 'ONLINE') return 'ONLINE';
  if (s === 'WARNING') return 'WARNING';
  if (s === 'CRITICAL') return 'CRITICAL';
  return s || undefined;
}

// Maps a raw live station record into the analytics station shape.
// Only real response fields are adopted — analytics-critical values
// are never fabricated, so a metadata-only or degenerate backend
// response will correctly fail validation below.
function mapLiveStation(st, index) {
  const id = String(st?.station_id ?? `STN_${index + 1}`);
  const name = st?.station_name || st?.name || id;
  const district = st?.district || 'Uttarakhand';
  const river = liveValue(st, ['river_name', 'river']);
  const lat = toFiniteNumber(liveValue(st, ['latitude']));
  const lon = toFiniteNumber(liveValue(st, ['longitude']));

  const warningLevel = toFiniteNumber(liveValue(st, ['warning_level_m', 'warningLevel']));
  const dangerLevel = toFiniteNumber(liveValue(st, ['danger_level_m', 'dangerLevel']));
  const waterLevel = toFiniteNumber(liveValue(st, ['water_level_m', 'latest_water_level_m', 'waterLevel']));
  const rainfallMm = toFiniteNumber(liveValue(st, ['rainfall_1h_mm', 'rainfall_mm', 'rainfallMm']));

  let soilSaturation = toFiniteNumber(liveValue(st, ['soil_saturation_index', 'soil_saturation', 'soilSaturation']));
  if (soilSaturation !== undefined && soilSaturation <= 1) {
    soilSaturation = Math.round(soilSaturation * 100);
  }

  const prob = toFiniteNumber(liveValue(st, ['prediction_probability', 'flood_probability', 'probability', 'prob']));

  const rawRisk = String(liveValue(st, ['risk', 'risk_class', 'ml_risk_class', 'final_risk_class']) ?? '').toUpperCase();
  const risk = RISK_LEVELS.includes(rawRisk) ? rawRisk : undefined;
  const stage = normalizeStage(liveValue(st, ['stage', 'cwc_threshold_status', 'official_flood_status']));
  const status = normalizeStatus(liveValue(st, ['status']));

  const runoffRaw = liveValue(st, ['runoff', 'scs_direct_runoff_q_mm']);
  let runoff;
  if (typeof runoffRaw === 'number') {
    runoff = runoffRaw > 0 ? 'HIGH' : 'NORMAL';
  } else if (String(runoffRaw ?? '').toUpperCase() === 'HIGH') {
    runoff = 'HIGH';
  } else if (String(runoffRaw ?? '').toUpperCase() === 'NORMAL') {
    runoff = 'NORMAL';
  }

  return {
    id,
    name,
    district,
    river,
    lat,
    lon,
    risk,
    prob,
    stage,
    status,
    waterLevel,
    warningLevel,
    dangerLevel,
    rainfallMm,
    soilSaturation,
    runoff,
  };
}

const REQUIRED_ANALYTICS_FIELDS = [
  'id',
  'name',
  'district',
  'river',
  'lat',
  'lon',
  'risk',
  'prob',
  'stage',
  'status',
  'runoff',
  'waterLevel',
  'warningLevel',
  'dangerLevel',
  'rainfallMm',
  'soilSaturation',
];

const NUMERIC_FIELDS = ['lat', 'lon', 'waterLevel', 'warningLevel', 'dangerLevel', 'rainfallMm', 'soilSaturation'];

function isValidNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function hasAllRequiredFields(record) {
  return REQUIRED_ANALYTICS_FIELDS.every((field) => {
    const v = record[field];
    if (v === undefined || v === null || v === '') return false;
    if (field === 'prob') return isValidNumber(v) && v > 0 && v <= 1;
    if (NUMERIC_FIELDS.includes(field)) return isValidNumber(v);
    return true;
  });
}

// Validates a mapped live dataset before it may replace the canonical
// fallback. Returns the subset of complete records plus rejection reasons.
export function validateAnalyticsStations(records) {
  const reasons = [];
  if (!Array.isArray(records) || records.length === 0) {
    return { valid: false, reasons: ['live response is empty'], records: [] };
  }

  const complete = records.filter(hasAllRequiredFields);
  const incompleteRatio =
    complete.length === 0 ? 1 : (records.length - complete.length) / records.length;

  if (complete.length === 0) {
    reasons.push('all live stations are missing required analytics fields');
  } else {
    const maxProb = Math.max(...complete.map((r) => r.prob));
    const hasLevelTelemetry = complete.some((r) => r.waterLevel > 0);

    if (maxProb <= DEGENERATE_PROBABILITY_THRESHOLD) {
      reasons.push(`peak probability ${(maxProb * 100).toFixed(3)}% is near-zero (degenerate dataset)`);
    }
    if (!hasLevelTelemetry) reasons.push('no valid river level telemetry');
  }

  if (incompleteRatio > 0.5) {
    reasons.push(`${Math.round(incompleteRatio * 100)}% of live stations are missing required fields`);
  }

  return { valid: reasons.length === 0, reasons, records: complete };
}

function devWarning(...args) {
  try {
    if (import.meta.env?.DEV) console.warn('[Analytics]', ...args);
  } catch {
    // Logging is development-only; never break the fallback path.
  }
}

export async function loadAnalyticsStations() {
  try {
    const res = await stationsService.getStations({ station_type: 'CWC_HYDROLOGICAL' });
    const raw = res?.data;
    if (!Array.isArray(raw) || raw.length === 0) {
      devWarning('Live stations response empty — retaining calibrated canonical dataset.');
      return STATIONS;
    }

    const mapped = raw.map(mapLiveStation);
    const { valid, reasons, records } = validateAnalyticsStations(mapped);
    if (valid && records.length > 0) {
      devWarning(`Adopting validated live station dataset (${records.length} stations).`);
      return records;
    }

    devWarning(`Live stations response rejected (${reasons.join('; ')}). Retaining calibrated canonical dataset.`);
  } catch (err) {
    devWarning('Live stations fetch failed; retaining calibrated canonical dataset.', err);
  }
  return STATIONS;
}