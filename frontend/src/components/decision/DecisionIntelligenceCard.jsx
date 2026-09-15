import React from 'react';

export default function DecisionIntelligenceCard({
  locationName = 'Alaknanda River Basin (Rishikesh)',
  mlProbability = 0.94,
  rainfallStatus = 'HIGH',
  soilSaturationStatus = 'HIGH',
  cwcStage = 'DANGER',
  runoffStatus = 'HIGH',
  finalRiskState = 'EXTREME',
}) {
  const isExtreme = finalRiskState === 'EXTREME';
  const isHigh = finalRiskState === 'HIGH';

  const riskColor = isExtreme ? 'text-red-600' : isHigh ? 'text-orange-500' : 'text-emerald-600';
  const dotColor = isExtreme ? 'bg-red-600 animate-pulse' : isHigh ? 'bg-orange-500' : 'bg-emerald-600';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col select-none font-sans shadow-xs hover:shadow-sm transition-shadow">
      {/* Header Instrument Identifier */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">
            Risk Decision
          </h2>
        </div>
        <span className="text-[10.5px] font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[140px]" title={locationName}>
          {locationName}
        </span>
      </div>

      {/* Compact Decision Instrument Rows */}
      <div className="flex flex-col gap-4 text-[12px] pb-5 border-b border-slate-100">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium truncate">Risk Fall</span>
          <span className="font-mono font-bold text-red-600 text-right shrink-0">
            {typeof mlProbability === 'number' ? `${Math.round(mlProbability * 100)}%` : mlProbability || '—'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium truncate">Rainfall Intensity</span>
          <span className="font-mono font-semibold text-orange-600 text-right shrink-0">
            {rainfallStatus || 'NORMAL'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium truncate">Soil Saturation</span>
          <span className="font-mono font-semibold text-amber-600 text-right shrink-0">
            {soilSaturationStatus || 'NORMAL'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium truncate">River Stage</span>
          <span className="font-mono font-bold text-red-600 text-right shrink-0">
            {cwcStage || 'NORMAL'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-500 font-medium truncate">Physics Runoff</span>
          <span className="font-mono font-semibold text-slate-800 text-right shrink-0">
            {runoffStatus || 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Fused Risk Output */}
      <div className="flex items-center justify-between pt-5">
        <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
          Fused Risk
        </span>
        <div className={`flex items-center gap-1.5 font-mono text-[12.5px] font-bold ${riskColor}`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span>{finalRiskState}</span>
        </div>
      </div>
    </div>
  );
}




