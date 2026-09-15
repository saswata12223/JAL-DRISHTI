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
              className={`bg-app-surface-elevated border-b border-app-border/40 last:border-0 px-2 py-3 flex items-start justify-between gap-3 cursor-pointer transition-all duration-150 group ${
                selected ? 'bg-app-surface border-indigo-500/30' : 'hover:bg-app-surface-hover'
              }`}
            >
              <div className="flex flex-col min-w-0">
                <span className={`text-[12px] font-bold truncate transition-colors ${selected ? 'text-indigo-400' : 'text-app-text-primary group-hover:text-indigo-400'}`}>
                  {loc.name}
                </span>
                <span className="text-[10px] text-app-text-muted truncate mt-0.5">
                  {loc.district} &bull; {loc.river}
                </span>
                <span className={`text-[9.5px] font-extrabold uppercase tracking-wider mt-1 ${
                  loc.risk === 'EXTREME' ? 'text-red-500' : loc.risk === 'HIGH' ? 'text-orange-500' : loc.risk === 'MODERATE' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {loc.risk}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`font-mono font-bold text-[13px] ${
                  loc.prob >= 0.7 ? 'text-red-500' : loc.prob >= 0.4 ? 'text-orange-500' : loc.prob >= 0.2 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {Math.round(loc.prob * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/dashboard');
                  }}
                  className="text-[10px] font-semibold text-indigo-400 mt-2 hover:underline"
                >
                  View Map &rarr;
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