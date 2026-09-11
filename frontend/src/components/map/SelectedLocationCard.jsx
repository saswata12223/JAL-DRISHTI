import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SelectedLocationCard({ location, onNavigateAlerts, onClose }) {
  const navigate = useNavigate();

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
        <span>{location.district ? `District: ${location.district}` : 'Uttarakhand Region'}</span>
        {location.river && <span>&bull; {location.river} River</span>}
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

