import React from 'react';
import PanelCard from './PanelCard';
import { getRiskTextClass } from '../../utils/riskColors';

export default function DistrictRiskPanel({ data, mode, onModeChange }) {
  const maxProb = data.length ? data[0].prob : 1;

  return (
    <PanelCard
      icon="map"
      title="Risk by District / Basin"
      subtitle={`Ranked by peak flood probability across ${data.length ? `${data.length} ${mode === 'basin' ? 'basins' : 'districts'}` : 'scope'}`}
      right={
        <div className="flex items-center bg-app-surface-elevated border border-app-border rounded-lg p-0.5 text-[10.5px] font-bold select-none">
          <button
            onClick={() => onModeChange('district')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === 'district' ? 'bg-indigo-500/20 text-indigo-400 dark:text-indigo-300' : 'text-app-text-muted hover:text-app-text-primary'
            }`}
          >
            DISTRICT
          </button>
          <button
            onClick={() => onModeChange('basin')}
            className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              mode === 'basin' ? 'bg-indigo-500/20 text-indigo-400 dark:text-indigo-300' : 'text-app-text-muted hover:text-app-text-primary'
            }`}
          >
            BASIN
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5 pt-1">
        {data.map((row) => {
          const pct = Math.round(row.prob * 100);
          const width = Math.max((row.prob / maxProb) * 100, 6);
          const barColor =
            row.risk === 'EXTREME'
              ? 'bg-red-500'
              : row.risk === 'HIGH'
              ? 'bg-orange-500'
              : row.risk === 'MODERATE'
              ? 'bg-amber-500'
              : 'bg-emerald-500';

          return (
            <div key={row.label} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="text-app-text-primary font-semibold truncate pr-2">{row.label}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${getRiskTextClass(row.risk)}`}>
                    {row.risk}
                  </span>
                  <span className="font-mono font-bold text-app-text-primary">{pct}%</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-app-surface-elevated border border-app-border overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }}></div>
              </div>
            </div>
          );
        })}
        {!data.length && (
          <p className="text-[12px] text-app-text-muted text-center py-6">No locations match the current filters.</p>
        )}
      </div>
    </PanelCard>
  );
}