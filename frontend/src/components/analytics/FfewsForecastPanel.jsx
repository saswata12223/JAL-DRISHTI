import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PanelCard from './PanelCard';
import { useTheme } from '../../context/ThemeContext';
import { fetchFfewsTelemetry, sendFfewsSmsTest } from '../../services/ffewsService';

const HILLY_REGIONS = [
  { id: 'shimla', name: 'Shimla, Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { id: 'kedarnath', name: 'Kedarnath, Uttarakhand', lat: 30.7352, lon: 79.0669 },
  { id: 'srinagar', name: 'Srinagar, Jammu & Kashmir', lat: 34.0837, lon: 74.7973 },
  { id: 'gangtok', name: 'Gangtok, Sikkim', lat: 27.3389, lon: 88.6065 },
  { id: 'tawang', name: 'Tawang, Arunachal Pradesh', lat: 27.5860, lon: 91.8594 },
  { id: 'darjeeling', name: 'Darjeeling, West Bengal', lat: 27.0360, lon: 88.2627 },
  { id: 'shillong', name: 'Shillong, Meghalaya', lat: 25.5788, lon: 91.8933 },
  { id: 'munnar', name: 'Munnar, Kerala', lat: 10.0889, lon: 77.0595 },
  { id: 'mahabaleshwar', name: 'Mahabaleshwar, Maharashtra', lat: 17.9239, lon: 73.6538 },
];

export default function FfewsForecastPanel() {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [smsStatus, setSmsStatus] = useState('idle'); // 'idle', 'sending', 'success', 'error'
  const [activeRegionId, setActiveRegionId] = useState(HILLY_REGIONS[0].id);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const region = HILLY_REGIONS.find(r => r.id === activeRegionId) || HILLY_REGIONS[0];
      const res = await fetchFfewsTelemetry(region.lat, region.lon);
      setData(res);
      setLoading(false);
    }
    load();
  }, [activeRegionId]);

  const handleTestSms = async () => {
    setSmsStatus('sending');
    // Using a sample number, in a real scenario this might be dynamic
    const res = await sendFfewsSmsTest('WARNING: FFEWS test SMS integration successful. Flood risk is being monitored.', '9748379047');
    if (res.success) {
      setSmsStatus('success');
      setTimeout(() => setSmsStatus('idle'), 3000);
    } else {
      setSmsStatus('error');
      setTimeout(() => setSmsStatus('idle'), 3000);
    }
  };

  const gridColor = isDark ? '#1E2532' : '#E2E8F0';
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#151922' : '#FFFFFF';
  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';
  
  const tooltipStyle = {
    backgroundColor: tooltipBg,
    borderColor: tooltipBorder,
    borderRadius: '12px',
    fontSize: '11px',
    color: tooltipText,
  };

  if (loading) {
    return (
      <PanelCard icon="timeline" title="FFEWS 15-Day Long-Term Forecast" subtitle="Open-Meteo Weather & Flood API Integration">
        <div className="h-[300px] flex items-center justify-center">
          <span className="material-symbols-outlined text-[32px] animate-spin text-indigo-500">progress_activity</span>
        </div>
      </PanelCard>
    );
  }

  if (!data || !data.chartData) {
    return (
      <PanelCard icon="timeline" title="FFEWS 15-Day Long-Term Forecast" subtitle="Open-Meteo Weather & Flood API Integration">
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-app-text-muted">Failed to load FFEWS forecast data.</p>
        </div>
      </PanelCard>
    );
  }

  const { riskScore, chartData } = data;
  const riskClass = riskScore >= 90 ? 'EXTREME' : riskScore >= 75 ? 'HIGH' : riskScore >= 50 ? 'MODERATE' : 'LOW';
  const riskColor = riskScore >= 90 ? 'text-red-500' : riskScore >= 75 ? 'text-orange-500' : riskScore >= 50 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <PanelCard 
      icon="public" 
      title="FFEWS 15-Day Long-Term Forecast" 
      subtitle="Open-Meteo Weather & Flood API Integration"
      badge={
        <div className="flex items-center gap-3">
          <select
            value={activeRegionId}
            onChange={(e) => setActiveRegionId(e.target.value)}
            className="bg-app-surface-elevated border border-app-border/80 rounded-lg px-2.5 py-1 text-[11px] font-bold text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer"
          >
            {HILLY_REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-500">GLOBAL MODEL</span>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
          <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 flex flex-col items-center">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted text-center">FFEWS Risk Score</span>
            <span className={`text-[24px] font-bold font-mono mt-1 ${riskColor}`}>{riskScore}</span>
            <span className="text-[10px] text-app-text-muted font-mono mt-0.5">/ 100</span>
          </div>
          
          <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted text-center">Risk Classification</span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wider ${riskClass === 'EXTREME' ? 'bg-red-500/10 border-red-500/30 text-red-500' : riskClass === 'HIGH' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : riskClass === 'MODERATE' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
              {riskClass}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="Day" stroke={axisTextColor} fontSize={10.5} tickLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
              <YAxis yAxisId="left" stroke={axisTextColor} fontSize={10.5} tickLine={false} label={{ value: 'Rainfall (mm)', angle: -90, position: 'insideLeft', fill: axisTextColor, fontSize: 10 }} />
              <YAxis yAxisId="right" orientation="right" stroke={axisTextColor} fontSize={10.5} tickLine={false} label={{ value: 'Discharge (m³/s)', angle: 90, position: 'insideRight', fill: axisTextColor, fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="amount" name="Rainfall (mm)" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="Discharge" name="River Discharge" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line yAxisId="right" type="step" dataKey="DischargeMedian" name="Historical Median" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
    </PanelCard>
  );
}
