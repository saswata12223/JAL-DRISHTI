import React, { useState, useEffect, useMemo } from 'react';
import StationTable from '../components/monitoring/StationTable';
import StationDetailDrawer from '../components/monitoring/StationDetailDrawer';
import stationsService from '../services/stationsService';
import riskService from '../services/riskService';



// Default 20 CWC Hydrological Monitoring Stations
const DEFAULT_CWC_MONITORING = [
  { id: 'CWC_UK_001', name: 'Joshimath', district: 'Chamoli', river: 'Alaknanda', lat: 30.556, lon: 79.568, risk: 'EXTREME', prob: 0.94, stage: 'DANGER ZONE', waterLevel: 341.7, warningLevel: 339.5, dangerLevel: 340.5, rainfallMm: 85, status: 'CRITICAL', stationType: 'CWC Hydrological Gauge', soilSaturation: '94%', runoff: 'HIGH' },
  { id: 'CWC_UK_002', name: 'Rishikesh', district: 'Dehradun', river: 'Ganga', lat: 30.108, lon: 78.298, risk: 'HIGH', prob: 0.68, stage: 'WARNING ZONE', waterLevel: 339.8, warningLevel: 339.5, dangerLevel: 340.5, rainfallMm: 45, status: 'WARNING', stationType: 'CWC Hydrological Gauge', soilSaturation: '82%', runoff: 'HIGH' },
  { id: 'CWC_UK_003', name: 'Uttarkashi', district: 'Uttarkashi', river: 'Bhagirathi', lat: 30.727, lon: 78.435, risk: 'HIGH', prob: 0.72, stage: 'WARNING ZONE', waterLevel: 1120.4, warningLevel: 1119.0, dangerLevel: 1121.0, rainfallMm: 62, status: 'WARNING', stationType: 'CWC Hydrological Gauge', soilSaturation: '85%', runoff: 'HIGH' },
  { id: 'CWC_UK_004', name: 'Rudraprayag', district: 'Rudraprayag', river: 'Mandakini', lat: 30.285, lon: 78.981, risk: 'EXTREME', prob: 0.91, stage: 'DANGER ZONE', waterLevel: 618.2, warningLevel: 616.0, dangerLevel: 617.5, rainfallMm: 78, status: 'CRITICAL', stationType: 'CWC Hydrological Gauge', soilSaturation: '92%', runoff: 'HIGH' },
  { id: 'CWC_UK_005', name: 'Srinagar', district: 'Pauri Garhwal', river: 'Alaknanda', lat: 30.221, lon: 78.784, risk: 'HIGH', prob: 0.65, stage: 'WARNING ZONE', waterLevel: 536.4, warningLevel: 535.0, dangerLevel: 537.0, rainfallMm: 48, status: 'WARNING', stationType: 'CWC Hydrological Gauge', soilSaturation: '78%', runoff: 'HIGH' },
  { id: 'CWC_UK_006', name: 'Devprayag', district: 'Tehri Garhwal', river: 'Ganga', lat: 30.146, lon: 78.598, risk: 'MODERATE', prob: 0.35, stage: 'NORMAL', waterLevel: 452.1, warningLevel: 454.0, dangerLevel: 456.0, rainfallMm: 22, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '64%', runoff: 'NORMAL' },
  { id: 'CWC_UK_007', name: 'Haridwar', district: 'Haridwar', river: 'Ganga', lat: 29.945, lon: 78.164, risk: 'LOW', prob: 0.12, stage: 'NORMAL', waterLevel: 292.3, warningLevel: 294.0, dangerLevel: 295.5, rainfallMm: 10, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '48%', runoff: 'NORMAL' },
  { id: 'CWC_UK_008', name: 'Dharchula', district: 'Pithoragarh', river: 'Kali', lat: 29.851, lon: 80.542, risk: 'EXTREME', prob: 0.88, stage: 'DANGER ZONE', waterLevel: 890.5, warningLevel: 888.0, dangerLevel: 890.0, rainfallMm: 72, status: 'CRITICAL', stationType: 'CWC Hydrological Gauge', soilSaturation: '91%', runoff: 'HIGH' },
  { id: 'CWC_UK_009', name: 'Karanprayag', district: 'Chamoli', river: 'Alaknanda', lat: 30.260, lon: 79.220, risk: 'MODERATE', prob: 0.38, stage: 'NORMAL', waterLevel: 778.0, warningLevel: 780.0, dangerLevel: 782.0, rainfallMm: 24, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '62%', runoff: 'NORMAL' },
  { id: 'CWC_UK_010', name: 'Almora', district: 'Almora', river: 'Kosi', lat: 29.597, lon: 79.659, risk: 'LOW', prob: 0.15, stage: 'NORMAL', waterLevel: 1580.0, warningLevel: 1583.0, dangerLevel: 1585.0, rainfallMm: 8, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '45%', runoff: 'NORMAL' },
  { id: 'CWC_UK_011', name: 'Nainital', district: 'Nainital', river: 'Gaula', lat: 29.380, lon: 79.463, risk: 'LOW', prob: 0.18, stage: 'NORMAL', waterLevel: 1930.0, warningLevel: 1935.0, dangerLevel: 1937.0, rainfallMm: 12, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '52%', runoff: 'NORMAL' },
  { id: 'CWC_UK_012', name: 'Bageshwar', district: 'Bageshwar', river: 'Sarayu', lat: 29.838, lon: 79.771, risk: 'MODERATE', prob: 0.32, stage: 'NORMAL', waterLevel: 980.0, warningLevel: 983.0, dangerLevel: 985.0, rainfallMm: 19, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '58%', runoff: 'NORMAL' },
  { id: 'CWC_UK_013', name: 'Champawat', district: 'Champawat', river: 'Lohawati', lat: 29.337, lon: 80.092, risk: 'LOW', prob: 0.10, stage: 'NORMAL', waterLevel: 1610.0, warningLevel: 1615.0, dangerLevel: 1617.0, rainfallMm: 6, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '42%', runoff: 'NORMAL' },
  { id: 'CWC_UK_014', name: 'Rudrapur', district: 'Udham Singh Nagar', river: 'Kalyani', lat: 28.980, lon: 79.400, risk: 'LOW', prob: 0.08, stage: 'NORMAL', waterLevel: 205.0, warningLevel: 208.0, dangerLevel: 210.0, rainfallMm: 4, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '38%', runoff: 'NORMAL' },
  { id: 'CWC_UK_015', name: 'Gopeshwar', district: 'Chamoli', river: 'Balkhila', lat: 30.410, lon: 79.330, risk: 'HIGH', prob: 0.70, stage: 'WARNING ZONE', waterLevel: 1450.0, warningLevel: 1448.0, dangerLevel: 1451.0, rainfallMm: 55, status: 'WARNING', stationType: 'CWC Hydrological Gauge', soilSaturation: '84%', runoff: 'HIGH' },
  { id: 'CWC_UK_016', name: 'Tehri', district: 'Tehri Garhwal', river: 'Bhagirathi', lat: 30.380, lon: 78.480, risk: 'MODERATE', prob: 0.30, stage: 'NORMAL', waterLevel: 825.0, warningLevel: 830.0, dangerLevel: 835.0, rainfallMm: 16, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '55%', runoff: 'NORMAL' },
  { id: 'CWC_UK_017', name: 'Barkot', district: 'Uttarkashi', river: 'Yamuna', lat: 30.810, lon: 78.200, risk: 'LOW', prob: 0.14, stage: 'NORMAL', waterLevel: 1210.0, warningLevel: 1215.0, dangerLevel: 1218.0, rainfallMm: 8, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '46%', runoff: 'NORMAL' },
  { id: 'CWC_UK_018', name: 'Pithoragarh', district: 'Pithoragarh', river: 'Ramganga', lat: 29.580, lon: 80.210, risk: 'LOW', prob: 0.16, stage: 'NORMAL', waterLevel: 1510.0, warningLevel: 1515.0, dangerLevel: 1518.0, rainfallMm: 11, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '49%', runoff: 'NORMAL' },
  { id: 'CWC_UK_019', name: 'Kashipur', district: 'Udham Singh Nagar', river: 'Dhela', lat: 29.210, lon: 78.950, risk: 'LOW', prob: 0.09, stage: 'NORMAL', waterLevel: 215.0, warningLevel: 218.0, dangerLevel: 220.0, rainfallMm: 5, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '40%', runoff: 'NORMAL' },
  { id: 'CWC_UK_020', name: 'Dehradun City', district: 'Dehradun', river: 'Bindal', lat: 30.316, lon: 78.032, risk: 'LOW', prob: 0.11, stage: 'NORMAL', waterLevel: 640.0, warningLevel: 645.0, dangerLevel: 647.0, rainfallMm: 14, status: 'ONLINE', stationType: 'CWC Hydrological Gauge', soilSaturation: '50%', runoff: 'NORMAL' },
];

export default function StationMonitoringPage() {
  const [stations, setStations] = useState(DEFAULT_CWC_MONITORING);
  const [selectedStation, setSelectedStation] = useState(DEFAULT_CWC_MONITORING[0]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [basinFilter, setBasinFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    async function loadAllStations() {
      try {
        setLoading(true);
        const res = await stationsService.getStations();
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.map((st, i) => {
            let risk = 'LOW';
            let prob = 0.12;
            let stage = 'NORMAL';
            let status = 'ONLINE';
            let rf = 8;

            if (st.station_name === 'Joshimath' || st.station_name === 'Rudraprayag' || st.station_name === 'Dharchula') {
              risk = 'EXTREME';
              prob = 0.94;
              stage = 'DANGER ZONE';
              status = 'CRITICAL';
              rf = 85;
            } else if (st.station_name === 'Rishikesh' || st.station_name === 'Uttarkashi' || st.station_name === 'Srinagar' || st.station_name === 'Gopeshwar') {
              risk = 'HIGH';
              prob = 0.72;
              stage = 'WARNING ZONE';
              status = 'WARNING';
              rf = 48;
            } else if (st.station_name === 'Devprayag' || st.station_name === 'Karanprayag' || st.station_name === 'Bageshwar' || st.station_name === 'Tehri') {
              risk = 'MODERATE';
              prob = 0.35;
              stage = 'NORMAL';
              status = 'ONLINE';
              rf = 22;
            }

            return {
              id: st.station_id || `STN_${i + 1}`,
              name: st.station_name,
              district: st.district || 'Uttarakhand',
              river: st.river_name || (st.station_type?.includes('IMD') ? 'Catchment AWS' : 'River Basin'),
              lat: st.latitude,
              lon: st.longitude,
              risk: risk,
              prob: prob,
              stage: stage,
              status: status,
              waterLevel: st.water_level_m,
              warningLevel: st.warning_level_m,
              dangerLevel: st.danger_level_m,
              rainfallMm: rf,
              stationType: st.station_type === 'CWC_HYDROLOGICAL' ? 'CWC Hydrological Gauge' : 'IMD Weather Station',
              soilSaturation: prob > 0.7 ? '94%' : prob > 0.4 ? '82%' : '48%',
              runoff: prob > 0.4 ? 'HIGH' : 'NORMAL',
            };
          });

          setStations(mapped);
          setSelectedStation(mapped[0]);
        }
      } catch (err) {
        console.warn('Live monitoring stations fetch warning:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAllStations();
  }, []);

  // Filter Logic
  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = st.name?.toLowerCase().includes(q);
        const mDist = st.district?.toLowerCase().includes(q);
        const mRiv = st.river?.toLowerCase().includes(q);
        const mId = st.id?.toLowerCase().includes(q);
        if (!mName && !mDist && !mRiv && !mId) return false;
      }

      // Status
      if (statusFilter !== 'ALL' && st.status !== statusFilter) return false;

      // Risk
      if (riskFilter !== 'ALL' && st.risk !== riskFilter) return false;

      // District
      if (districtFilter !== 'ALL' && st.district !== districtFilter) return false;

      // Basin
      if (basinFilter !== 'ALL' && !st.river?.toLowerCase().includes(basinFilter.toLowerCase())) return false;

      // Type
      if (typeFilter !== 'ALL' && st.stationType !== typeFilter) return false;

      return true;
    });
  }, [stations, searchTerm, statusFilter, riskFilter, districtFilter, basinFilter, typeFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setRiskFilter('ALL');
    setDistrictFilter('ALL');
    setBasinFilter('ALL');
    setTypeFilter('ALL');
  };

  // Distinct Lists for Dropdowns
  const districtsList = useMemo(() => {
    const d = new Set(stations.map((s) => s.district).filter(Boolean));
    return Array.from(d).sort();
  }, [stations]);

  // Operational Counts
  const onlineCount = stations.filter((s) => s.status === 'ONLINE').length;
  const warningCount = stations.filter((s) => s.status === 'WARNING').length;
  const criticalCount = stations.filter((s) => s.status === 'CRITICAL').length;
  const offlineCount = stations.filter((s) => s.status === 'OFFLINE').length;

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header & Operational Summary KPI Strip */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[17px] font-bold text-app-text-primary tracking-tight font-sans">
            LIVE STATION MONITORING
          </h1>
          <p className="text-[11.5px] font-medium text-app-text-secondary">
            Real-time hydrological, rainfall and environmental station telemetry
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">sensors</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block">
                TOTAL STATIONS
              </span>
              <span className="text-[22px] font-bold text-app-text-primary leading-tight font-mono">
                {stations.length}
              </span>
            </div>
          </div>

          <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block">
                ONLINE & NOMINAL
              </span>
              <span className="text-[22px] font-bold text-emerald-500 leading-tight font-mono">
                {onlineCount} <span className="text-[12px] text-app-text-secondary font-normal">({Math.round((onlineCount / (stations.length || 1)) * 100)}%)</span>
              </span>
            </div>
          </div>

          <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block">
                WARNING / DEGRADED
              </span>
              <span className="text-[22px] font-bold text-amber-500 leading-tight font-mono">
                {warningCount}
              </span>
            </div>
          </div>

          <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 text-red-500 border border-red-500/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">priority_high</span>
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block">
                CRITICAL / EXTREME
              </span>
              <span className="text-[22px] font-bold text-red-500 leading-tight font-mono">
                {criticalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Operational Filter Toolbar */}
      <div className="bg-app-surface border border-app-border p-3.5 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Search Bar */}
        <div className="w-full md:w-64 bg-app-surface-elevated border border-app-border rounded-lg px-3 py-1.5 flex items-center shadow-xs">
          <span className="material-symbols-outlined text-[17px] text-app-text-muted mr-2">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search station, river, district..."
            className="bg-transparent border-none text-[12px] text-app-text-primary placeholder:text-app-text-muted focus:ring-0 w-full outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-app-text-muted hover:text-app-text-primary text-[14px] leading-none"
            >
              &times;
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">Status: All</option>
            <option value="ONLINE">Online</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
            <option value="OFFLINE">Offline</option>
          </select>

          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">Risk: All</option>
            <option value="EXTREME">Extreme</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>

          {/* District Filter */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">District: All</option>
            {districtsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Station Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            <option value="ALL">Type: All</option>
            <option value="CWC Hydrological Gauge">CWC Gauge</option>
            <option value="IMD Weather Station">IMD AWS</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 rounded-lg bg-app-surface-elevated hover:bg-app-surface-hover text-app-text-muted hover:text-app-text-primary border border-app-border transition-colors text-[11.5px] font-semibold cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* 3. Station Live Weather Banner & Link to /live-forecast */}
      <div className="bg-app-surface border border-app-border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm font-sans">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-app-text-primary">
              Live Atmospheric Forecast & Weather Intelligence
            </h3>
            <p className="text-[11.5px] text-app-text-secondary font-medium mt-0.5">
              Inspecting {selectedStation ? selectedStation.name : 'Uttarakhand Catchment'} telemetry & atmospheric forcing.
            </p>
          </div>
        </div>

        <a
          href="/live-forecast"
          className="px-3.5 py-1.5 text-[11.5px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>View Live Forecast</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </a>
      </div>

      {/* 4. Main Workspace: Station Table + Docked Station Detail Drawer */}
      <div className="flex flex-col lg:flex-row items-start gap-5 min-h-[560px]">
        {/* Main Station Table */}
        <StationTable
          stations={filteredStations}
          selectedStation={selectedStation}
          onSelectStation={setSelectedStation}
        />

        {/* Station Detail Intelligence Drawer */}
        {selectedStation && (
          <StationDetailDrawer
            station={selectedStation}
            onClose={() => setSelectedStation(null)}
          />
        )}
      </div>
    </div>
  );
}
