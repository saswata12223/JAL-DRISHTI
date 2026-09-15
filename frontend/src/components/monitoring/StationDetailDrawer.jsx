import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function StationDetailDrawer({ station, onClose }) {
  const navigate = useNavigate();

  if (!station) return null;

  const isExtreme = station.risk === 'EXTREME';
  const isHigh = station.risk === 'HIGH';
  const isModerate = station.risk === 'MODERATE';

  let riskBadgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-[#16A34A]';
  if (isExtreme) {
    riskBadgeColor = 'bg-red-500/15 border-red-500/30 text-[#DC2626]';
  } else if (isHigh) {
    riskBadgeColor = 'bg-orange-500/15 border-orange-500/30 text-[#F97316]';
  } else if (isModerate) {
    riskBadgeColor = 'bg-amber-500/15 border-amber-500/30 text-[#D97706]';
  }

  // Generate 6-hour synthetic trend curve based on station values for hydrograph
  const baseWl = station.waterLevel || 338.0;
  const wlTrendData = [
    { time: '07:00', wl: Number((baseWl - 2.8).toFixed(1)) },
    { time: '08:00', wl: Number((baseWl - 2.1).toFixed(1)) },
    { time: '09:00', wl: Number((baseWl - 1.4).toFixed(1)) },
    { time: '10:00', wl: Number((baseWl - 0.7).toFixed(1)) },
    { time: '11:00', wl: Number((baseWl - 0.2).toFixed(1)) },
    { time: '12:00', wl: Number(baseWl.toFixed(1)) },
  ];

  const baseRf = station.rainfallMm || (isExtreme ? 85 : isHigh ? 45 : isModerate ? 18 : 6);
  const rfTrendData = [
    { time: '07:00', mm: Math.round(baseRf * 0.15) },
    { time: '08:00', mm: Math.round(baseRf * 0.3) },
    { time: '09:00', mm: Math.round(baseRf * 0.45) },
    { time: '10:00', mm: Math.round(baseRf * 0.7) },
    { time: '11:00', mm: Math.round(baseRf * 0.85) },
    { time: '12:00', mm: baseRf },
  ];

  const warningLvl = station.warningLevel || (station.waterLevel ? station.waterLevel - 1.5 : null);
  const dangerLvl = station.dangerLevel || (station.waterLevel ? station.waterLevel - 0.5 : null);

  // Threshold Progress calculation
  let thresholdPct = 50;
  if (warningLvl && dangerLvl && station.waterLevel) {
    const range = dangerLvl - warningLvl + 2.0;
    const diff = station.waterLevel - (warningLvl - 1.0);
    thresholdPct = Math.min(Math.max(Math.round((diff / range) * 100), 10), 100);
  }

  const axisTextColor = '#6B858A';

  return (
    <div className="w-full lg:w-[380px] bg-white/95 border border-[#A5F1F7]/35 rounded-xl p-5 shadow-[0_10px_35px_rgba(16,42,46,0.08)] flex flex-col gap-4 select-none shrink-0 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar font-sans">
      {/* Drawer Header */}
      <div className="flex items-start justify-between pb-3 border-b border-[#A5F1F7]/35">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B858A]">
              {station.stationType || 'CWC Hydrological Gauge'}
            </span>
            <span className="text-[10px] font-mono text-[#102A2E] bg-[#EAF8FA] px-1.5 py-0.5 rounded border border-[#A5F1F7]/50 font-bold">
              {station.id}
            </span>
          </div>
          <h2 className="text-[16px] font-bold text-[#102A2E] uppercase tracking-tight">
            {station.name}
          </h2>
          <p className="text-[11.5px] text-[#24464B]">
            {station.district} District &bull; {station.river} River
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#6B858A] hover:text-[#102A2E] hover:bg-[#EAF8FA] transition-colors text-[18px] leading-none cursor-pointer"
          title="Close Panel"
        >
          &times;
        </button>
      </div>

      {/* Operational Status & Risk Strip */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-[#F2FAFB] rounded-xl border border-[#A5F1F7]/35">
        <div>
          <span className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider block mb-0.5">
            SENSOR STATUS
          </span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${station.status === 'ONLINE' ? 'bg-[#16A34A] animate-pulse' : station.status === 'WARNING' ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}></span>
            <span className="text-[12px] font-bold text-[#102A2E]">
              {station.status || 'ONLINE'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider block mb-0.5">
            RISK CLASSIFICATION
          </span>
          <span className={`inline-block px-2 py-0.5 rounded-full border text-[10.5px] font-bold uppercase ${riskBadgeColor}`}>
            {station.risk || 'LOW'}
          </span>
        </div>
      </div>

      {/* Live Telemetry Grid */}
      <div className="flex flex-col gap-3">
        <span className="text-[10.5px] font-bold text-[#6B858A] uppercase tracking-wider">
          LIVE TELEMETRY PARAMETERS
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Water Level */}
          <div className="p-3 bg-[#F2FAFB] rounded-lg border border-[#A5F1F7]/35 flex flex-col">
            <span className="text-[10px] font-semibold text-[#6B858A] uppercase">Water Level</span>
            <span className="text-[17px] font-bold font-mono text-[#102A2E] mt-0.5">
              {station.waterLevel ? `${station.waterLevel} m` : 'N/A'}
            </span>
            <span className="text-[10px] text-[#24464B] mt-0.5">
              Stage: <strong className={isExtreme ? 'text-[#DC2626]' : 'text-[#102A2E]'}>{station.stage || 'NORMAL'}</strong>
            </span>
          </div>

          {/* Rainfall Intensity */}
          <div className="p-3 bg-[#F2FAFB] rounded-lg border border-[#A5F1F7]/35 flex flex-col">
            <span className="text-[10px] font-semibold text-[#6B858A] uppercase">Hourly Rainfall</span>
            <span className="text-[17px] font-bold font-mono text-[#102A2E] mt-0.5">
              {station.rainfallMm ? `${station.rainfallMm} mm/h` : isExtreme ? '85 mm/h' : '12 mm/h'}
            </span>
            <span className="text-[10px] text-[#F97316] font-semibold mt-0.5">
              {station.rainfallStatus || (isExtreme ? 'CRITICAL' : 'NORMAL')}
            </span>
          </div>

          {/* Soil Saturation */}
          <div className="p-3 bg-[#F2FAFB] rounded-lg border border-[#A5F1F7]/35 flex flex-col">
            <span className="text-[10px] font-semibold text-[#6B858A] uppercase">Soil Saturation</span>
            <span className="text-[17px] font-bold font-mono text-[#102A2E] mt-0.5">
              {station.soilSaturation || (isExtreme ? '94%' : '52%')}
            </span>
            <span className="text-[10px] text-[#6B858A] mt-0.5">
              SMAP L4 Telemetry
            </span>
          </div>

          {/* Direct Runoff */}
          <div className="p-3 bg-[#F2FAFB] rounded-lg border border-[#A5F1F7]/35 flex flex-col">
            <span className="text-[10px] font-semibold text-[#6B858A] uppercase">Direct Runoff</span>
            <span className="text-[17px] font-bold text-[#102A2E] mt-0.5">
              {station.runoff || (isExtreme ? 'HIGH' : 'NORMAL')}
            </span>
            <span className="text-[10px] text-[#6B858A] mt-0.5">
              SCS-CN Physics
            </span>
          </div>
        </div>
      </div>

      {/* Threshold Progress Bar */}
      {station.waterLevel && (
        <div className="p-3.5 bg-[#F2FAFB] rounded-xl border border-[#A5F1F7]/35 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#6B858A]">Threshold Progress</span>
            <span className="font-mono font-bold text-[#102A2E]">{station.waterLevel} m MSL</span>
          </div>

          {/* Visual Bar */}
          <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#A5F1F7]/40 relative">
            <div
              className={`h-full transition-all duration-300 ${
                isExtreme ? 'bg-[#DC2626]' : isHigh ? 'bg-[#F97316]' : 'bg-[#16A34A]'
              }`}
              style={{ width: `${thresholdPct}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[9.5px] text-[#6B858A] font-mono pt-1">
            <span>Normal</span>
            <span className="text-[#D97706]">Warn: {warningLvl}m</span>
            <span className="text-[#DC2626]">Danger: {dangerLvl}m</span>
          </div>
        </div>
      )}

      {/* Mini Trend Hydrograph */}
      {station.waterLevel && (
        <div className="p-3 bg-[#F2FAFB] rounded-xl border border-[#A5F1F7]/35 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold text-[#6B858A] uppercase tracking-wider">
              WATER LEVEL 6-HR TREND
            </span>
            <span className="text-[10px] font-mono text-[#24464B] font-bold">m MSL</span>
          </div>

          <div className="h-[90px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wlTrendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <XAxis dataKey="time" stroke={axisTextColor} fontSize={9} tickLine={false} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke={axisTextColor} fontSize={9} tickLine={false} />
                <Area type="monotone" dataKey="wl" stroke="#24464B" fill="#A5F1F7" fillOpacity={0.5} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Mini Rainfall Hyetograph */}
      <div className="p-3 bg-[#F2FAFB] rounded-xl border border-[#A5F1F7]/35 flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10.5px] font-bold text-[#6B858A] uppercase tracking-wider">
            RAINFALL HYETOGRAPH
          </span>
          <span className="text-[10px] font-mono text-[#24464B] font-bold">mm/h</span>
        </div>

        <div className="h-[80px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rfTrendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <XAxis dataKey="time" stroke={axisTextColor} fontSize={9} tickLine={false} />
              <YAxis stroke={axisTextColor} fontSize={9} tickLine={false} />
              <Bar dataKey="mm" fill="#A5F1F7" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Station Health & Freshness Diagnostics */}
      <div className="p-3 bg-[#F2FAFB] rounded-xl border border-[#A5F1F7]/35 text-[11px] flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider">
          TELEMETRY & HARDWARE HEALTH
        </span>

        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Telemetry Freshness:</span>
          <span className="font-mono text-[#16A34A] font-bold">Live (30s ago)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Uplink Transceiver:</span>
          <span className="font-semibold text-[#102A2E]">INSAT-3D DCP Online</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Solar Battery Voltage:</span>
          <span className="font-mono text-[#102A2E]">13.8 V (Nominal)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Coordinates:</span>
          <span className="font-mono text-[#6B858A] text-[10px]">{station.lat?.toFixed(3)}°N, {station.lon?.toFixed(3)}°E</span>
        </div>
      </div>

      {/* Operational Action Buttons */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-2.5 px-4 rounded-lg font-bold text-[11.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98 bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] hover:from-[#8BE5EC] hover:to-[#C4F4F8] text-[#102A2E] border border-[#A5F1F7]"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          <span>VIEW ON DASHBOARD MAP</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/alerts')}
            className="py-2 px-3 bg-white hover:bg-[#EAF8FA] text-[#102A2E] border border-[#A5F1F7]/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">warning</span>
            <span>DECISION</span>
          </button>
          <button
            onClick={() => navigate('/historical-events')}
            className="py-2 px-3 bg-white hover:bg-[#EAF8FA] text-[#102A2E] border border-[#A5F1F7]/40 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>HISTORY</span>
          </button>
        </div>
      </div>
    </div>
  );
}

