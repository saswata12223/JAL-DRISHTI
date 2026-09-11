import React from 'react';

export default function DecisionIntelligenceCard({
  locationName = 'Alaknanda River Basin (Rishikesh)',
  mlProbability = 0.94,
  rainfallStatus = 'HIGH',
  soilSaturationStatus = 'HIGH',
  cwcStage = 'DANGER',
  runoffStatus = 'HIGH',
  finalRiskState = 'EXTREME',
  onIssueOrder,
}) {
  const isExtreme = finalRiskState === 'EXTREME';

  return (
    <div className="glass-panel-level2 rounded-2xl flex flex-col p-4 select-none font-sans border border-[#A5F1F7]/35 shadow-[0_10px_35px_rgba(16,42,46,0.06)]">
      {/* Header Instrument Identifier */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#A5F1F7]/35">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#A5F1F7] flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] text-[#102A2E]">
              psychology
            </span>
          </div>
          <h2 className="text-[12px] font-bold text-[#102A2E] uppercase tracking-wide">
            Decision Intelligence
          </h2>
        </div>
        <span className="text-[10.5px] font-mono font-semibold text-[#24464B] bg-[#EAF8FA] px-2 py-0.5 rounded border border-[#A5F1F7]/40 truncate max-w-[140px]" title={locationName}>
          {locationName}
        </span>
      </div>

      {/* Compact Decision Instrument Rows */}
      <div className="flex flex-col gap-2 text-[11.5px] pb-3 border-b border-[#A5F1F7]/35">
        <div className="flex items-center justify-between">
          <span className="text-[#6B858A] font-medium">ML Probability</span>
          <span className="font-mono font-bold text-[#DC2626]">
            {Math.round(mlProbability * 100)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6B858A] font-medium">Rainfall</span>
          <span className="font-mono font-semibold text-[#F97316]">
            {rainfallStatus}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6B858A] font-medium">Soil Saturation</span>
          <span className="font-mono font-semibold text-[#D97706]">
            {soilSaturationStatus}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6B858A] font-medium">CWC Stage</span>
          <span className="font-mono font-bold text-[#DC2626]">
            {cwcStage}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#6B858A] font-medium">Physics Runoff</span>
          <span className="font-mono font-semibold text-[#24464B]">
            {runoffStatus}
          </span>
        </div>
      </div>

      {/* Fused Risk Output */}
      <div className="flex items-center justify-between py-2.5">
        <span className="text-[11.5px] font-bold text-[#102A2E] uppercase tracking-wide">
          Fused Risk
        </span>
        <div className="flex items-center gap-1.5 font-mono text-[12px] font-bold text-[#DC2626]">
          <span className={`w-2 h-2 rounded-full ${isExtreme ? 'bg-[#DC2626] animate-pulse' : 'bg-[#F97316]'}`} />
          <span>{finalRiskState}</span>
        </div>
      </div>

      {/* Issue SOP Action Button */}
      <button
        onClick={onIssueOrder}
        className="w-full mt-1 py-2 px-3 bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] hover:from-[#8BE5EC] hover:to-[#C4F4F8] text-[#102A2E] border border-[#A5F1F7] rounded-xl font-bold text-[11.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98 shadow-xs"
      >
        <span>ISSUE DEPLOYMENT SOP</span>
        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
      </button>
    </div>
  );
}


