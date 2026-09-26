import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SelectedLocationCard({ location, onNavigateAlerts, onClose }) {
  const navigate = useNavigate();
  const [envData, setEnvData] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);

  useEffect(() => {
    if (location && location.lat != null && location.lon != null) {
      setEnvLoading(true);
      setEnvError(null);
      setEnvData(null);
      fetch(`/api/environment?lat=${location.lat}&lon=${location.lon}`)
        .then(res => {
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
        })
        .then(data => {
          setEnvData(data);
          setEnvLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch environment data:", err);
          setEnvError("Unable to fetch Open-Meteo data. Please try again.");
          setEnvLoading(false);
        });
    }
  }, [location]);

  if (!location) {
    return (
      <div className="w-80 bg-white/90 border border-[#A5F1F7]/40 p-4 rounded-xl shadow-lg select-none">
        <div className="text-[11px] text-[#6B858A] uppercase font-bold tracking-wider mb-1">
          LOCATION INTELLIGENCE
        </div>
        <p className="text-[12px] text-[#24464B]">
          Click any station marker or active alert to view detailed hydrological and ML risk parameters.
        </p>
      </div>
    );
  }

  const isExtreme = location.finalRisk === 'EXTREME';
  const isHigh = location.finalRisk === 'HIGH';
  const isModerate = location.finalRisk === 'MODERATE';
  
  let riskBadgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-[#16A34A]';
  let leftBorderColor = 'border-l-[#16A34A]';
  if (isExtreme) {
    riskBadgeColor = 'bg-red-500/15 border-red-500/30 text-[#DC2626]';
    leftBorderColor = 'border-l-[#DC2626]';
  } else if (isHigh) {
    riskBadgeColor = 'bg-orange-500/15 border-orange-500/30 text-[#F97316]';
    leftBorderColor = 'border-l-[#F97316]';
  } else if (isModerate) {
    riskBadgeColor = 'bg-amber-500/15 border-amber-500/30 text-[#D97706]';
    leftBorderColor = 'border-l-[#D97706]';
  }

  return (
    <div
      className={`w-80 sm:w-[340px] bg-white/95 border border-[#A5F1F7]/40 border-l-4 ${leftBorderColor} p-4 rounded-xl shadow-xl select-none relative transition-all duration-150 font-sans`}
    >
      {/* Top Timestamp & Close */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B858A] font-sans">
          SELECTED LOCATION
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[#6B858A] font-mono text-[10px]">
            {location.timestamp || '14:02:05 IST'}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#6B858A] hover:text-[#102A2E] text-[14px] leading-none cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Location Name & Basin */}
      <h3 className="text-[14px] font-bold text-[#102A2E] uppercase tracking-tight leading-snug">
        {location.name || 'Alaknanda River Basin'}
      </h3>
      <div className="text-[11.5px] font-medium text-[#24464B] mt-0.5 mb-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[13px] text-[#6B858A]">location_on</span>
        <span>{location.district ? `District: ${location.district}` : (location.adminContext?.district ? `District: ${location.adminContext.district}` : (location.adminContext?.state || 'India'))}</span>
        {location.river && <span>&bull; {location.river} River</span>}
      </div>

      {/* Geographic Context */}
      <div className="bg-white border border-[#A5F1F7]/30 rounded-lg p-2.5 mb-3">
        <div className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider mb-2">
          GEOGRAPHIC CONTEXT
        </div>
        {!location.adminContext ? (
           <div className="text-[11px] text-slate-500 italic">Context loading or unavailable...</div>
        ) : (
          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
            <div className="flex flex-col">
              <span className="text-[#6B858A] text-[9.5px] uppercase">Country</span>
              <span className="font-bold text-[#102A2E] truncate">
                {location.adminContext.country || 'INDIA'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#6B858A] text-[9.5px] uppercase">State</span>
              <span className="font-bold text-[#102A2E] truncate">
                {location.adminContext.state || location.adminContext.administrative_gis?.state_status || 'Unavailable'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#6B858A] text-[9.5px] uppercase">District</span>
              <span className="font-bold text-[#102A2E] truncate">
                {location.adminContext.district || location.adminContext.administrative_gis?.district_status || 'Unavailable'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#6B858A] text-[9.5px] uppercase">Subdistrict</span>
              <span className="font-bold text-[#102A2E] truncate">
                {location.adminContext.subdistrict || location.adminContext.administrative_gis?.subdistrict_status || '—'}
              </span>
            </div>
            {/* ML availability firewall indicator */}
            <div className="col-span-2 flex items-center gap-1.5 pt-1.5 border-t border-[#A5F1F7]/30 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${location.adminContext.ml?.available ? 'bg-emerald-500' : 'bg-red-400'}`} />
              <span className="text-[9.5px] font-semibold text-[#6B858A]">
                ML: {location.adminContext.ml?.available ? 'AVAILABLE (Uttarakhand)' : (location.adminContext.ml?.reason?.replace(/_/g, ' ') || 'UNAVAILABLE')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Primary KPI Row */}
      <div className="flex items-center justify-between p-2.5 bg-[#F2FAFB] rounded-lg border border-[#A5F1F7]/35 mb-3">
        <div>
          <div className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider">
            RISK STATE
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide ${riskBadgeColor}`}>
              {location.finalRisk || 'EXTREME'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider">
            ML PROBABILITY
          </div>
          <div className="text-[18px] font-bold font-mono text-[#102A2E] mt-0.5">
            {Math.round((location.mlProbability ?? 0.94) * 100)}%
          </div>
        </div>
      </div>

      {/* Metric Breakdown Table */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-[11.5px] mb-3 pb-3 border-b border-[#A5F1F7]/35">
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">CWC Stage:</span>
          <span className="font-bold text-[#102A2E]">{location.cwcStage || 'DANGER ZONE'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Rainfall:</span>
          <span className="font-bold text-[#F97316]">{location.rainfall || 'HIGH'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Soil Moisture:</span>
          <span className="font-bold text-[#D97706]">{location.soilSaturation || 'HIGH'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A]">Direct Runoff:</span>
          <span className="font-bold text-[#F97316]">{location.runoff || 'HIGH'}</span>
        </div>
        {location.waterLevel && (
          <div className="flex items-center justify-between col-span-2 pt-1 border-t border-[#A5F1F7]/35">
            <span className="text-[#6B858A]">Water Level (MSL):</span>
            <span className="font-bold font-mono text-[#102A2E]">{location.waterLevel} m</span>
          </div>
        )}
      </div>

      {/* Environmental Data from Open-Meteo */}
      <div className="bg-white border border-[#A5F1F7]/30 rounded-lg p-2.5 mb-3">
        <div className="text-[10px] font-bold text-[#6B858A] uppercase tracking-wider mb-2 border-b border-[#A5F1F7]/30 pb-1">
          OPEN-METEO ENVIRONMENTAL DATA
        </div>
        <div className="text-[9.5px] text-amber-600 bg-amber-50 p-1.5 rounded border border-amber-100 italic mb-2">
          Note: This is weather-model/reanalysis/forecast-derived data. Local ESP32 sensors provide the ground measurements.
        </div>

        {envLoading && (
          <div className="text-[11px] text-cyan-700 py-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined animate-spin text-[14px]">sync</span>
            Fetching environmental data...
          </div>
        )}

        {envError && (
          <div className="text-[11px] text-red-600 py-2">
            {envError}
          </div>
        )}

        {envData && (
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold flex items-center gap-1 text-[#24464B]">
                <span>🌧️</span> CURRENT WEATHER
              </h4>
              <div className="text-[10px] grid grid-cols-2 gap-y-1 gap-x-2">
                <span className="text-[#6B858A]">Temp:</span> <span className="font-bold text-[#102A2E]">{envData.current.temperature_2m} °C</span>
                <span className="text-[#6B858A]">Humidity:</span> <span className="font-bold text-[#102A2E]">{envData.current.relative_humidity_2m} %</span>
                <span className="text-[#6B858A]">Rain:</span> <span className="font-bold text-[#102A2E]">{envData.current.rain} mm</span>
                <span className="text-[#6B858A]">Wind:</span> <span className="font-bold text-[#102A2E]">{envData.current.wind_speed_10m} km/h</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] font-bold flex items-center gap-1 text-[#24464B]">
                <span>🌱</span> SOIL MOISTURE
              </h4>
              <div className="text-[10px] grid grid-cols-2 gap-y-1 gap-x-2">
                <span className="text-[#6B858A]">0–1 cm:</span> <span className="font-bold text-[#102A2E]">{envData.hourly.soil_moisture_0_to_1cm?.[0] ?? 'N/A'} m³/m³</span>
                <span className="text-[#6B858A]">1–3 cm:</span> <span className="font-bold text-[#102A2E]">{envData.hourly.soil_moisture_1_to_3cm?.[0] ?? 'N/A'} m³/m³</span>
                <span className="text-[#6B858A]">3–9 cm:</span> <span className="font-bold text-[#102A2E]">{envData.hourly.soil_moisture_3_to_9cm?.[0] ?? 'N/A'} m³/m³</span>
                <span className="text-[#6B858A]">9–27 cm:</span> <span className="font-bold text-[#102A2E]">{envData.hourly.soil_moisture_9_to_27cm?.[0] ?? 'N/A'} m³/m³</span>
                <span className="text-[#6B858A]">27–81 cm:</span> <span className="font-bold text-[#102A2E]">{envData.hourly.soil_moisture_27_to_81cm?.[0] ?? 'N/A'} m³/m³</span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] font-bold flex items-center gap-1 text-[#24464B]">
                <span>🌧️</span> RAINFALL FORECAST
              </h4>
              <div className="text-[10px] grid grid-cols-2 gap-y-1 gap-x-2">
                <span className="text-[#6B858A]">Next 1 hour:</span> <span className="font-bold text-[#102A2E]">{(envData.hourly.precipitation?.slice(1, 2).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                <span className="text-[#6B858A]">Next 3 hours:</span> <span className="font-bold text-[#102A2E]">{(envData.hourly.precipitation?.slice(1, 4).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                <span className="text-[#6B858A]">Next 6 hours:</span> <span className="font-bold text-[#102A2E]">{(envData.hourly.precipitation?.slice(1, 7).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                <span className="text-[#6B858A]">Next 24 hours:</span> <span className="font-bold text-[#102A2E]">{(envData.hourly.precipitation?.slice(1, 25).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
              </div>
            </div>
            
            {envData.elevation !== undefined && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold flex items-center gap-1 text-[#24464B]">
                  <span>⛰️</span> ELEVATION
                </h4>
                <div className="text-[10px]">
                  <span className="text-[#6B858A] ml-4">{envData.elevation} meters</span>
                </div>
              </div>
            )}
            
            <div className="pt-2 mt-2 border-t border-slate-200/80 text-[8.5px] text-[#6B858A]">
              Last updated: {envData.current.time || new Date().toISOString()}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            if (onNavigateAlerts) {
              onNavigateAlerts(location);
            } else {
              navigate('/alerts');
            }
          }}
          className="w-full py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] hover:from-[#8BE5EC] hover:to-[#C4F4F8] text-[#102A2E] border border-[#A5F1F7] transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <span>VIEW DECISION</span>
          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
        </button>

        <button
          onClick={() => navigate('/historical-events')}
          className="w-full py-2 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-white hover:bg-[#EAF8FA] text-[#102A2E] border border-[#A5F1F7]/40 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <span>HISTORY</span>
          <span className="material-symbols-outlined text-[13px]">history</span>
        </button>
      </div>
    </div>
  );
}

