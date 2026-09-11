import React from 'react';
import PanelCard from './PanelCard';
import { FACTOR_WEIGHT } from '../../services/analyticsService';

const LEVEL_STYLE = {
  DOMINANT: { text: 'text-red-500', bar: 'bg-red-500', chip: 'bg-red-500/10 border-red-500/25 text-red-500' },
  HIGH: { text: 'text-orange-500', bar: 'bg-orange-500', chip: 'bg-orange-500/10 border-orange-500/25 text-orange-500' },
  MODERATE: { text: 'text-amber-500', bar: 'bg-amber-500', chip: 'bg-amber-500/10 border-amber-500/25 text-amber-500' },
  LOW: { text: 'text-emerald-500', bar: 'bg-emerald-500', chip: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500' },
};

export default function RiskFactorsPanel({ factors, hasExtreme }) {
  // If any location is EXTREME, elevate rainfall/water level drivers to DOMINANT.
  const effective = factors.map((f) => {
    const level = hasExtreme && (f.key === 'rainfall' || f.key === 'water_level') && f.level === 'HIGH' ? 'DOMINANT' : f.level;
    return { ...f, level };
  });

  return (
    <PanelCard
      icon="psychology_alt"
      title="Risk Contributing Factors"
      subtitle="Qualitative influence of multi-signal drivers"
      badge={<span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider">Policy v8.1.0</span>}
    >
      <div className="flex flex-col gap-3 pt-1">
        {effective.map((f) => {
          const style = LEVEL_STYLE[f.level] || LEVEL_STYLE.MODERATE;
          return (
            <div key={f.key} className="flex items-center gap-3">
              <div className="w-[38%] min-w-[110px]">
                <div className="text-[11.5px] font-semibold text-app-text-primary truncate">{f.name}</div>
                <div className="text-[9.5px] text-app-text-muted truncate">{f.detail}</div>
              </div>
              <div className="flex-1 h-2 rounded-full bg-app-surface-elevated border border-app-border overflow-hidden">
                <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${FACTOR_WEIGHT[f.level] || 50}%` }}></div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider w-[74px] text-right shrink-0 ${style.text}`}>
                {f.level}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[9.5px] leading-relaxed text-app-text-muted pt-3 border-t border-app-border mt-1">
        Qualitative factor assessments derived deterministically from active multi-signal data (rainfall, CWC stage, SMAP soil
        saturation, SCS-CN runoff). They are operational estimates — not attributed scientific validation percentages.
      </p>
    </PanelCard>
  );
}