import React from 'react';

export default function MapLayerControl({ layers, onToggleLayer, isOpen, onToggleOpen }) {
  return (
    <div className="relative select-none pointer-events-auto">
      {/* Trigger Button */}
      <button
        onClick={onToggleOpen}
        className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shadow-sm ${
          isOpen
            ? 'bg-app-surface-elevated border-indigo-500/50 text-app-text-primary'
            : 'bg-app-surface border-app-border text-app-text-secondary hover:text-app-text-primary'
        }`}
      >
        <span className="material-symbols-outlined text-[16px] text-indigo-400">layers</span>
        <span>Map Layers</span>
        <span className="material-symbols-outlined text-[14px] text-app-text-muted">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Layer Options Dropdown */}
      {isOpen && (
        <div className="absolute top-10 right-0 w-60 bg-app-surface border border-app-border rounded-xl p-3 shadow-xl flex flex-col gap-2 z-[1100]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
            AVAILABLE LAYERS
          </span>

          <div className="flex flex-col gap-1.5 text-[12px]">
            <label className="flex items-center gap-2 text-app-text-primary hover:text-indigo-400 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.riskStations}
                onChange={() => onToggleLayer('riskStations')}
                className="rounded text-indigo-600 focus:ring-0 bg-transparent border-app-border w-3.5 h-3.5"
              />
              <span>Risk Stations (20 CWC Gauges)</span>
            </label>

            <label className="flex items-center gap-2 text-app-text-primary hover:text-indigo-400 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.riverNetwork}
                onChange={() => onToggleLayer('riverNetwork')}
                className="rounded text-indigo-600 focus:ring-0 bg-transparent border-app-border w-3.5 h-3.5"
              />
              <span>River Network (Alaknanda/Ganga)</span>
            </label>

            <label className="flex items-center gap-2 text-app-text-primary hover:text-indigo-400 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.catchments}
                onChange={() => onToggleLayer('catchments')}
                className="rounded text-indigo-600 focus:ring-0 bg-transparent border-app-border w-3.5 h-3.5"
              />
              <span>Catchments & Basins (13 Districts)</span>
            </label>

            <label className="flex items-center gap-2 text-app-text-primary hover:text-indigo-400 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.stateBoundary}
                onChange={() => onToggleLayer('stateBoundary')}
                className="rounded text-indigo-600 focus:ring-0 bg-transparent border-app-border w-3.5 h-3.5"
              />
              <span>Uttarakhand State Boundary</span>
            </label>

            <label className="flex items-center gap-2 text-app-text-primary hover:text-indigo-400 cursor-pointer">
              <input
                type="checkbox"
                checked={layers.activeAlerts}
                onChange={() => onToggleLayer('activeAlerts')}
                className="rounded text-indigo-600 focus:ring-0 bg-transparent border-app-border w-3.5 h-3.5"
              />
              <span>Active Alerts Overlay</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
