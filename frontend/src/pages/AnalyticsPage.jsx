import React, { useState, useEffect, useMemo } from 'react';
import RiskTrendPanel from '../components/analytics/RiskTrendPanel';
import RainfallTrendPanel from '../components/analytics/RainfallTrendPanel';
import WaterLevelTrendPanel from '../components/analytics/WaterLevelTrendPanel';
import DistrictRiskPanel from '../components/analytics/DistrictRiskPanel';
import RiskFactorsPanel from '../components/analytics/RiskFactorsPanel';
import PredictionVsObservedPanel from '../components/analytics/PredictionVsObservedPanel';
import TopRiskLocationsPanel from '../components/analytics/TopRiskLocationsPanel';
import AnalyticalInsightPanel from '../components/analytics/AnalyticalInsightPanel';
import {
  STATIONS,
  DISTRICTS,
  BASINS,
  TIME_RANGES,
  loadAnalyticsStations,
  buildStateSeries,
  buildStationSeries,
  computeKpis,
  rankByGroup,
  computeFactorAssessments,
  buildPredictionVsObserved,
  buildInsight,
  primaryDriver,
  resolveBasin,
} from '../services/analyticsService';

const RISK_OPTIONS = ['ALL', 'EXTREME', 'HIGH', 'MODERATE', 'LOW'];

function KpiCard({ label, value, subtext, icon, accent }) {
  const accentMap = {
    red: { bubble: 'bg-red-500/15 text-red-500 border-red-500/25', value: 'text-red-500' },
    orange: { bubble: 'bg-orange-500/15 text-orange-500 border-orange-500/25', value: 'text-orange-500' },
    sky: { bubble: 'bg-sky-500/15 text-sky-400 border-sky-500/25', value: 'text-app-text-primary' },
  };
  const a = accentMap[accent] || accentMap.sky;

  return (
    <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5 select-none">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${a.bubble}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
          {label}
        </span>
        <span className={`text-[22px] font-bold leading-tight font-mono tracking-tight ${a.value}`}>
          {value}
        </span>
        <span className="text-[11px] text-app-text-secondary font-medium block truncate">{subtext}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [stations, setStations] = useState(STATIONS);
  const [timeRange, setTimeRange] = useState('6H');
  const [district, setDistrict] = useState('ALL');
  const [basin, setBasin] = useState('ALL');
  const [riskLevel, setRiskLevel] = useState('ALL');
  const [rankMode, setRankMode] = useState('district');
  const [selectedId, setSelectedId] = useState(STATIONS[0].id);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const live = await loadAnalyticsStations();
      if (!mounted) return;
      if (Array.isArray(live) && live.length > 0) {
        setStations(live);
        const top = [...live].sort((a, b) => b.prob - a.prob)[0];
        if (top) setSelectedId(top.id);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const steps = useMemo(() => TIME_RANGES.find((t) => t.id === timeRange)?.steps || 6, [timeRange]);

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (district !== 'ALL' && s.district !== district) return false;
      if (basin !== 'ALL') {
        if (resolveBasin(s.river) !== basin) return false;
      }
      if (riskLevel !== 'ALL' && s.risk !== riskLevel) return false;
      return true;
    });
  }, [stations, district, basin, riskLevel]);

  const stateTrend = useMemo(() => buildStateSeries(filteredStations, steps), [filteredStations, steps]);
  const rainfallData = useMemo(
    () => stateTrend.map((d) => ({ time: d.time, rain: d.rain })),
    [stateTrend]
  );
  const kpis = useMemo(() => computeKpis(filteredStations), [filteredStations]);

  const focusStation = useMemo(() => {
    const found = filteredStations.find((s) => s.id === selectedId);
    if (found) return found;
    return [...filteredStations].sort((a, b) => b.prob - a.prob)[0] || null;
  }, [filteredStations, selectedId]);

  const focusSeries = useMemo(() => (focusStation ? buildStationSeries(focusStation, steps) : []), [focusStation, steps]);

  const districtRank = useMemo(
    () => rankByGroup(filteredStations, rankMode),
    [filteredStations, rankMode]
  );

  const factorData = useMemo(
    () => computeFactorAssessments(filteredStations, stateTrend, steps),
    [filteredStations, stateTrend, steps]
  );

  const predObs = useMemo(
    () => buildPredictionVsObserved(filteredStations, steps),
    [filteredStations, steps]
  );

  const topLocations = useMemo(
    () =>
      [...filteredStations]
        .sort((a, b) => b.prob - a.prob)
        .slice(0, 6)
        .map((s) => ({ ...s, driver: primaryDriver(s) })),
    [filteredStations]
  );

  const insight = useMemo(
    () => buildInsight(filteredStations, stateTrend, kpis, districtRank),
    [filteredStations, stateTrend, kpis, districtRank]
  );

  const handleReset = () => {
    setTimeRange('6H');
    setDistrict('ALL');
    setBasin('ALL');
    setRiskLevel('ALL');
  };

  const selectClass =
    'bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer text-[11.5px] font-medium';

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header & Analytical Controls */}
      <div className="flex flex-col gap-3.5">
        <div>
          <h1 className="text-[17px] font-bold text-app-text-primary tracking-tight font-sans">
            FLOOD RISK ANALYTICS
          </h1>
          <p className="text-[11.5px] font-medium text-app-text-secondary">
            Risk trends, contributing factors, and predictive flood intelligence
          </p>
        </div>

        {/* Compact Analytical Control Bar */}
        <div className="bg-app-surface border border-app-border p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2.5 select-none">
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {/* Time Range Segmented Control */}
            <div className="flex items-center bg-app-surface-elevated border border-app-border rounded-lg p-0.5 text-[10.5px] font-bold">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTimeRange(r.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    timeRange === r.id
                      ? 'bg-indigo-500/20 text-indigo-400 dark:text-indigo-300'
                      : 'text-app-text-muted hover:text-app-text-primary'
                  }`}
                >
                  {r.label.toUpperCase()}
                </button>
              ))}
            </div>

            <select value={district} onChange={(e) => setDistrict(e.target.value)} className={selectClass}>
              <option value="ALL">District: All</option>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select value={basin} onChange={(e) => setBasin(e.target.value)} className={selectClass}>
              <option value="ALL">Basin: All</option>
              {BASINS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className={selectClass}>
              {RISK_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r === 'ALL' ? 'Risk: All' : `Risk: ${r}`}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-app-surface-elevated hover:bg-app-surface-hover text-app-text-muted hover:text-app-text-primary border border-app-border transition-colors text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters
          </button>
        </div>
      </div>

      {/* 2. KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Overall Risk Probability"
          value={`${Math.round(kpis.maxProb * 100)}%`}
          subtext="Highest monitored location"
          icon="crisis_alert"
          accent="red"
        />
        <KpiCard
          label="High / Extreme Locations"
          value={kpis.highExtreme}
          subtext="Across filtered scope"
          icon="warning"
          accent="orange"
        />
        <KpiCard
          label="Rainfall Intensity"
          value={`${kpis.maxRain} mm/h`}
          subtext="Peak hourly accumulation"
          icon="water_drop"
          accent="sky"
        />
        <KpiCard
          label="Critical Water Levels"
          value={kpis.criticalLevels}
          subtext="Above CWC danger mark"
          icon="waves"
          accent="red"
        />
      </div>

      {/* 3. Primary Risk Trend + Rainfall */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <RiskTrendPanel data={stateTrend} />
        </div>
        <RainfallTrendPanel data={rainfallData} />
      </div>

      {/* 4. Water Level + Risk by District / Basin */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <WaterLevelTrendPanel data={focusSeries} station={focusStation} />
        <DistrictRiskPanel data={districtRank} mode={rankMode} onModeChange={setRankMode} />
      </div>

      {/* 5. Risk Factors + Prediction vs Observed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <RiskFactorsPanel factors={factorData.factors} hasExtreme={factorData.hasExtreme} />
        <PredictionVsObservedPanel data={predObs.data} status={predObs.status} meanDiff={predObs.meanDiff} />
      </div>

      {/* 6. Top Risk Locations + Analytical Insight */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <TopRiskLocationsPanel
            locations={topLocations}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="xl:col-span-2">
          <AnalyticalInsightPanel insight={insight} />
        </div>
      </div>
    </div>
  );
}