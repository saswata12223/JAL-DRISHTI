import React from 'react';
import { useNavigate } from 'react-router-dom';
import PanelCard from './PanelCard';

const RISK_BADGE = {
  EXTREME: 'bg-red-500/10 border-red-500/30 text-red-500',
  HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  MODERATE: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  LOW: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

export default function TopRiskLocationsPanel({ locations, selectedId, onSelect }) {
  const navigate = useNavigate();

  return (
    <PanelCard
      icon="place"
      title="Top Risk Locations"
      subtitle="Select a location to focus the water level hydrograph"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{locations.length} shown</span>}
    >
      <div className="flex flex-col gap-2">
        {locations.map((loc) => {
          const selected = loc.id === selectedId;
          const badge = RISK_BADGE[loc.risk] || RISK_BADGE.LOW;
          const statusColor =
            loc.status === 'CRITICAL'
              ? 'text-red-500'
              : loc.status === 'WARNING'
              ? 'text-amber-500'
              : 'text-emerald-500';

          return (
            <div
              key={loc.id}
              onClick={() => onSelect && onSelect(loc.id)}
              className={`bg-app-surface-elevated border rounded-lg px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 group ${
                selected
                  ? 'border-indigo-500/60 shadow-md'
                  : 'border-app-border hover:border-app-border/80'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-app-text-primary truncate group-hover:text-indigo-300 dark:group-hover:text-indigo-300 transition-colors">
                    {loc.name}
                  </span>
                  <span className={`px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${badge}`}>
                    {loc.risk}
                  </span>
                </div>
                <div className="text-[10.5px] text-app-text-muted truncate">
                  {loc.district} District &bull; {loc.river} River
                </div>
                <div className="text-[10.5px] text-app-text-secondary mt-0.5">
                  Driver: <span className="font-semibold text-app-text-primary">{loc.driver}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono font-bold text-app-text-primary text-[13px]">
                  {Math.round(loc.prob * 100)}%
                </span>
                <span className={`text-[9.5px] font-bold uppercase tracking-wider ${statusColor}`}>{loc.status}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/risk-map');
                  }}
                  className="text-[10px] font-semibold text-indigo-400 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
                >
                  View Map <span className="material-symbols-outlined text-[11px]">chevron_right</span>
                </button>
              </div>
            </div>
          );
        })}
        {!locations.length && (
          <p className="text-[12px] text-app-text-muted text-center py-6">No locations match the current filters.</p>
        )}
      </div>
    </PanelCard>
  );
}