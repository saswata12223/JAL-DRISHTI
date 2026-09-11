import React from 'react';
import PanelCard from './PanelCard';

export default function AnalyticalInsightPanel({ insight }) {
  return (
    <PanelCard
      icon="lightbulb"
      title="Analytical Insight"
      subtitle="Deterministic summary from active filtered data"
      badge={
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 dark:text-indigo-400">
          Operational Readout
        </span>
      }
    >
      <div className="bg-app-surface-elevated border border-app-border rounded-lg p-3.5 flex flex-col gap-3">
        <p className="text-[12px] leading-relaxed text-app-text-primary font-medium">
          {insight.headline}
        </p>

        <ul className="flex flex-col gap-2">
          {insight.points.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-[11.5px] leading-relaxed text-app-text-secondary">
              <span
                className={`material-symbols-outlined text-[14px] mt-px shrink-0 ${
                  pt.includes('danger mark') || pt.includes('allocate monitoring')
                    ? 'text-red-500'
                    : pt.includes('Deterministic') || pt.includes('no generative')
                    ? 'text-app-text-muted'
                    : 'text-amber-500'
                }`}
              >
                {pt.includes('Deterministic') || pt.includes('no generative') ? 'info' : 'chevron_right'}
              </span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelCard>
  );
}