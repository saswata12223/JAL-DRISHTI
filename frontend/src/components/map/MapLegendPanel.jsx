import React from 'react';

export default function MapLegendPanel() {
  return (
    <div className="bg-app-surface/95 backdrop-blur-sm border border-app-border px-3.5 py-2.5 rounded-xl shadow-lg select-none pointer-events-auto">
      <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block mb-1.5 font-sans">
        RISK LEVEL
      </span>
      <div className="flex flex-col gap-1.5 text-[11px] font-medium text-app-text-secondary">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_6px_rgba(220,38,38,0.5)]"></span>
          <span className="text-app-text-primary font-semibold">Extreme</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
          <span>High</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span>Low</span>
        </div>
      </div>
    </div>
  );
}
