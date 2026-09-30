import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animate, stagger } from 'animejs';
import { useLocation } from '../context/LocationContext';
import IndiaExplorerMap from '../components/map/IndiaExplorerMap';
import LocationCapabilityCard from '../components/common/LocationCapabilityCard';
import LocationSearch from '../components/common/LocationSearch';
import DecisionIntelligenceCard from '../components/decision/DecisionIntelligenceCard';
import riskService from '../services/riskService';
import stationsService from '../services/stationsService';
import { loadSummary, loadModelDecisions } from '../services/modelIntelligenceService';
import { SEARCH_INDEX } from '../utils/stateCoordinates';

// Default quick-select states for Pan-India exploration
const DEFAULT_PINNED = [
  'Uttarakhand', 'Himachal Pradesh', 'Jammu & Kashmir', 
  'Sikkim', 'Arunachal Pradesh', 'Meghalaya', 'Maharashtra', 'Kerala'
];

export default function DashboardPage() {
  const { selectedState, selectedDistrict, selectState, selectDistrict, capabilities, breadcrumb, clearSelection } = useLocation();
  const containerRef = useRef(null);

  // Data state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState('');
  const [summaryData, setSummaryData] = useState({ maxProb: null, highExtreme: null, maxRain: null, criticalWater: null });
  const [stationsList, setStationsList] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);

  // Custom Pinned States state
  const [pinnedStates, setPinnedStates] = useState(() => {
    try {
      const saved = localStorage.getItem('jaldrishti_pinned_states');
      if (!saved) return DEFAULT_PINNED;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : DEFAULT_PINNED;
    } catch (e) {
      return DEFAULT_PINNED;
    }
  });
  const [showQuickAccessEditor, setShowQuickAccessEditor] = useState(false);
  const editorRef = useRef(null);

  const ALL_STATES = SEARCH_INDEX.filter(item => item.type === 'State' || item.type === 'UT')
    .sort((a, b) => a.label.localeCompare(b.label));

  // Close editor on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (editorRef.current && !editorRef.current.contains(e.target)) {
        setShowQuickAccessEditor(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const togglePinnedState = (stateName) => {
    setPinnedStates(prev => {
      const safePrev = Array.isArray(prev) ? prev : DEFAULT_PINNED;
      let updated;
      if (safePrev.includes(stateName)) {
        updated = safePrev.filter(s => s !== stateName);
      } else {
        updated = [...safePrev, stateName];
      }
      localStorage.setItem('jaldrishti_pinned_states', JSON.stringify(updated));
      return updated;
    });
  };

  // Pan-India active
  const isUttarakhand = true; 
  const mlEnabled = true;

  // Load dashboard data — only fetches UK ML data when Uttarakhand selected
  useEffect(() => {
    let abortController = new AbortController();
    let interval;

    async function loadData(isRefresh = false) {
      try {
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);
        setError(false);

        const [summaryRes, alertsRes, stationsRes, decisionsRes] = await Promise.allSettled([
          loadSummary(),
          riskService.getActiveAlerts(),
          stationsService.getStations(),
          loadModelDecisions(),
        ]);

        if (abortController.signal.aborted) return;

        let anySuccess = false;
        let riskDecisionMap = {};
        let maxProb = 0, maxRain = 0, calcHighExtreme = 0, calcCriticalWater = 0;

        if (decisionsRes.status === 'fulfilled' && decisionsRes.value?.decisions) {
          anySuccess = true;
          const decisions = decisionsRes.value.decisions;
          if (Array.isArray(decisions) && decisions.length > 0) {
            maxProb = Math.max(0, ...decisions.map(d => d.flood_probability || 0));
            maxRain = Math.max(0, ...decisions.map(d => d.rainfall_1h_mm || 0));
          }
          if (Array.isArray(decisions)) {
            decisions.forEach(d => {
              if (d.spatial_id) riskDecisionMap[d.spatial_id] = d;
              const risk = d.final_risk_class || d.alert_priority || 'LOW';
              if (['HIGH', 'EXTREME', 'CRITICAL', 'WARNING'].includes(risk)) calcHighExtreme++;
              const cwc = d.cwc_threshold_status || 'NORMAL';
              if (['DANGER_ZONE', 'ABOVE_HFL', 'DANGER'].includes(cwc)) calcCriticalWater++;
            });
          }
        }

        if (stationsRes.status === 'fulfilled' && stationsRes.value?.data) {
          anySuccess = true;
          const rawStations = stationsRes.value.data;
          const mapped = rawStations.map((st, i) => {
            const dec = riskDecisionMap[st.station_id] || {};
            const risk = dec.final_risk_class || st.latest_alert_stage || 'LOW';
            const prob = dec.flood_probability !== undefined ? dec.flood_probability : null;
            const rainfallMm = dec.rainfall_1h_mm !== undefined ? dec.rainfall_1h_mm : 0;
            return {
              id: st.station_id || `STN-${i}`,
              name: st.station_name,
              district: st.district,
              river: st.river_name || 'River Basin',
              lat: st.latitude,
              lon: st.longitude,
              risk, prob,
              stage: dec.cwc_threshold_status || st.latest_alert_stage || 'NORMAL',
              rainfall: rainfallMm > 50 ? 'CRITICAL' : rainfallMm > 25 ? 'HIGH' : 'NORMAL',
              soilSaturation: dec.soil_saturation_index ? `${Math.round(dec.soil_saturation_index * 100)}%` : null,
              runoff: dec.scs_direct_runoff_q_mm > 30 ? 'HIGH' : 'NORMAL',
              cwcStage: dec.cwc_threshold_status || 'NORMAL',
              finalRisk: risk,
            };
          });
          setStationsList(mapped);
        }

        if (summaryRes.status === 'fulfilled' && summaryRes.value?.summary) {
          anySuccess = true;
          const s = summaryRes.value.summary;
          if (s.generated_at_utc) {
            const serverTime = new Date(s.generated_at_utc);
            setLastUpdatedTime(serverTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
          }
        }

        setSummaryData({ maxProb, maxRain, highExtreme: calcHighExtreme, criticalWater: calcCriticalWater });
        if (!anySuccess) setError(true);
      } catch (e) {
        if (!abortController.signal.aborted) { setError(true); }
      } finally {
        if (!abortController.signal.aborted) { setLoading(false); setRefreshing(false); }
      }
    }

    loadData(false);
    interval = setInterval(() => loadData(true), 30000);
    return () => { clearInterval(interval); abortController.abort(); };
  }, []);

  // Animate KPI cards on load
  useEffect(() => {
    if (!loading && containerRef.current) {
      animate('.kpi-card', { opacity: [0, 1], translateY: [16, 0], delay: stagger(70), duration: 450, easing: 'easeOutQuad' });
    }
  }, [loading]);

  // Handle station selection from map
  const handleSelectStation = useCallback((st) => {
    setSelectedStation({
      name: `${st.name} (${st.river || 'River'})`,
      lat: st.lat,
      lon: st.lon,
      mlProbability: st.prob,
      rainfall: st.rainfall,
      soilSaturation: st.soilSaturation,
      cwcStage: st.cwcStage || st.stage,
      runoff: st.runoff,
      finalRisk: st.finalRisk || st.risk,
      adminContext: null,
    });
    if (st.district) selectDistrict(st.district);
  }, [selectDistrict]);

const decisionLoc = selectedStation || (selectedDistrict ? {
    name: `${selectedDistrict}${selectedState ? ', ' + selectedState : ''}`,
    lat: null, lon: null,
    mlProbability: null, rainfall: null, soilSaturation: null,
    cwcStage: null, runoff: null, finalRisk: null, adminContext: null,
  } : selectedState ? {
    name: selectedState,
    lat: null, lon: null,
    mlProbability: null, rainfall: null, soilSaturation: null,
    cwcStage: null, runoff: null, finalRisk: null, adminContext: null,
  } : null);

  return (
    <div ref={containerRef} className="flex flex-col gap-6 w-full font-sans select-none">

      {/* Location breadcrumb + search bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 flex-wrap flex-1">
          {breadcrumb.map((crumb, i) => (
            <React.Fragment key={crumb.label}>
              {i > 0 && <span className="text-slate-300 text-[11px]">›</span>}
              <button
                onClick={crumb.onClick || undefined}
                disabled={!crumb.onClick}
                className={`text-[12px] font-semibold transition-colors rounded px-1 py-0.5 ${
                  crumb.active
                    ? 'text-slate-900 bg-slate-100 cursor-default'
                    : 'text-cyan-600 hover:text-cyan-800 hover:bg-cyan-50 cursor-pointer'
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
          {refreshing && <span className="text-[10px] text-slate-400 ml-2 font-medium">Updating…</span>}
          {lastUpdatedTime && !refreshing && (
            <span className="text-[10px] text-slate-400 ml-2 font-mono">{lastUpdatedTime}</span>
          )}
        </div>
        {/* Search */}
        <div className="w-full sm:max-w-xs">
          <LocationSearch />
        </div>
      </div>

      {/* Quick state tiles */}
      <div className="flex gap-2 flex-wrap items-center">
        {(Array.isArray(pinnedStates) ? pinnedStates : DEFAULT_PINNED).map(stateName => {
          const isActive = selectedState === stateName;
          const stateData = SEARCH_INDEX.find(s => s.label === stateName);
          const hasML = stateData?.mlAvailable;
          return (
            <button
              key={stateName}
              onClick={() => isActive ? clearSelection() : selectState(stateName)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                isActive
                  ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {stateName}
              {hasML && <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-400' : 'bg-emerald-500'}`} title="ML available" />}
            </button>
          );
        })}
        <div className="relative" ref={editorRef}>
          <button
            onClick={() => setShowQuickAccessEditor(!showQuickAccessEditor)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-600 border border-slate-200 hover:border-slate-300 transition-all bg-slate-50"
            title="Customize Quick Access"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span className="hidden sm:inline">Edit</span>
          </button>

          {showQuickAccessEditor && (
            <div className="absolute top-full left-0 mt-2 w-[220px] bg-white border border-slate-200 rounded-xl shadow-xl z-[500] max-h-[300px] overflow-y-auto p-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Customize Quick Access</div>
              {ALL_STATES.map(s => (
                <label key={s.label} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(Array.isArray(pinnedStates) ? pinnedStates : DEFAULT_PINNED).includes(s.label)}
                    onChange={() => togglePinnedState(s.label)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className="text-[12px] font-medium text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={clearSelection}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-700 border border-dashed border-slate-200 hover:border-slate-300 transition-all ml-auto sm:ml-0"
        >
          Reset
        </button>
      </div>

      {/* Main grid: Map + Capability/Decision sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-6 items-stretch min-h-[520px]">
        {/* Map */}
        <div className="min-h-[480px] lg:min-h-[520px]">
          <IndiaExplorerMap
            stations={stationsList}
            onSelectStation={handleSelectStation}
          />
        </div>

        {/* Sidebar: Capability + Decision */}
        <div className="flex flex-col gap-4">
          {/* Location Capability Card */}
          <LocationCapabilityCard />

          {/* Decision Intelligence Card */}
          {decisionLoc && (
            <DecisionIntelligenceCard
              locationName={decisionLoc.name}
              lat={decisionLoc.lat}
              lon={decisionLoc.lon}
              mlProbability={decisionLoc.mlProbability}
              rainfallStatus={decisionLoc.rainfall}
              soilSaturationStatus={decisionLoc.soilSaturation}
              cwcStage={decisionLoc.cwcStage}
              runoffStatus={decisionLoc.runoff}
              finalRiskState={decisionLoc.finalRisk}
              adminContext={null}
            />
          )}

          {/* If no selection, show prompt */}
          {!decisionLoc && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined text-[28px] text-slate-300">touch_app</span>
              <div>
                <div className="text-[12px] font-bold text-slate-600">Select a Location</div>
                <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                  Click any state on the map or use the search to explore capabilities. Select an active monitoring station to view dynamic risk assessment data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
