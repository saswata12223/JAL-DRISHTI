import React from 'react';

export default function DecisionIntelligenceCard({
  locationName = 'No location selected',
  mlProbability = null,
  rainfallStatus = null,
  soilSaturationStatus = null,
  cwcStage = null,
  runoffStatus = null,
  finalRiskState = null,
  adminContext = null,
}) {
  const isExtreme = finalRiskState === 'EXTREME';
  const isHigh = finalRiskState === 'HIGH';

  const riskColor = isExtreme ? 'text-red-600' : isHigh ? 'text-orange-500' : 'text-emerald-600';
  const dotColor = isExtreme ? 'bg-red-600 animate-pulse' : isHigh ? 'bg-orange-500' : 'bg-emerald-600';

  // ML availability: blocked if adminContext explicitly says ml.available=false
  const mlAvailable = adminContext ? adminContext.ml?.available !== false : true;
  const reason = adminContext?.ml?.reason || 'UNAVAILABLE';

  // Loading state: no data yet
  const isLoading = !finalRiskState && mlProbability === null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col select-none font-sans shadow-xs hover:shadow-sm transition-shadow h-full">
      {/* Header */}
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

      {/* Decision rows */}
      <div className="flex flex-col gap-4 text-[12px] pb-5 border-b border-slate-100 min-h-[160px] justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-[24px] text-slate-300 mb-2 animate-pulse">hourglass_empty</span>
            <span className="font-medium text-slate-500 text-[11px]">Loading historical model output…</span>
          </div>
        ) : !mlAvailable ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-[24px] text-slate-400 mb-2">block</span>
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">ML Model Unavailable</span>
            <span className="text-[10px] text-slate-500 font-mono">{reason.replace(/_/g, ' ')}</span>
            <span className="text-[9.5px] text-slate-400 mt-2">Coverage restricted to Uttarakhand project area.</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Model Probability*</span>
              <span className="font-mono font-bold text-red-600 text-right shrink-0">
                {typeof mlProbability === 'number' ? `${Math.round(mlProbability * 100)}%` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Rainfall Intensity</span>
              <span className="font-mono font-semibold text-orange-600 text-right shrink-0">
                {rainfallStatus || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Soil Saturation</span>
              <span className="font-mono font-semibold text-amber-600 text-right shrink-0">
                {soilSaturationStatus || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">River Stage</span>
              <span className="font-mono font-bold text-red-600 text-right shrink-0">
                {cwcStage || '—'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Physics Runoff</span>
              <span className="font-mono font-semibold text-slate-800 text-right shrink-0">
                {runoffStatus || '—'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Fused Risk */}
      <div className="flex items-center justify-between pt-5">
        <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
          Fused Risk
        </span>
        <div className={`flex items-center gap-1.5 font-mono text-[12.5px] font-bold ${isLoading ? 'text-slate-300' : !mlAvailable ? 'text-slate-400' : riskColor}`}>
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-slate-200' : !mlAvailable ? 'bg-slate-300' : dotColor}`} />
          <span>{isLoading ? '—' : !mlAvailable ? 'NO COVERAGE' : (finalRiskState || '—')}</span>
        </div>
      </div>

      {/* Footnote: data provenance */}
      <div className="pt-3 border-t border-slate-100 mt-3">
        <span className="text-[9.5px] text-slate-400 leading-relaxed">
          * Model Probability = XGBoost predict_proba() output (historical calibrated reference).{' '}
          <span className="font-semibold text-amber-600">HISTORICAL — not live inference.</span>
        </span>
      </div>
    </div>
  );
}
