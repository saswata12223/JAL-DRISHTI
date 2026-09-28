import React from 'react';
import { useLocation } from '../../context/LocationContext';

const CAPABILITY_CONFIG = [
  {
    key: 'gis',
    label: 'Administrative GIS',
    icon: 'map',
    alwaysAvailable: true,
    detail: (caps, state) => state ? `${state} boundary data (SOI)` : 'Survey of India — Pan-India',
  },
  {
    key: 'sih_region',
    label: 'SIH26192 Hilly Region',
    icon: 'landscape',
    alwaysAvailable: false,
    detail: (caps) => caps.sih_region?.reason || 'Not in scope',
  },
  {
    key: 'historical_ml',
    label: 'Dynamic Risk Modeling',
    icon: 'psychology',
    alwaysAvailable: false,
    detail: (caps) => caps.historical_ml.available
      ? 'Calibrated operational reference — Uttarakhand'
      : 'Coverage pending for this region',
  },
  {
    key: 'live_weather',
    label: 'Live Weather',
    icon: 'cloud',
    alwaysAvailable: false,
    detail: (caps) => caps.live_weather.available
      ? 'OpenWeatherMap — verified active'
      : 'No verified source for this region',
  },
  {
    key: 'live_telemetry',
    label: 'River Telemetry',
    icon: 'water',
    alwaysAvailable: false,
    detail: () => 'CWC gauge data unavailable',
  },
  {
    key: 'ml_live_inference',
    label: 'Real-time Risk Assessment',
    icon: 'bolt',
    alwaysAvailable: false,
    detail: () => 'Blocked — insufficient sensor data',
  },
];

function CapabilityRow({ label, icon, available, detail, isLast }) {
  let isAvailable = available;
  let statusText = '—';
  let colorClass = 'text-slate-400';
  let bgClass = 'bg-slate-50';

  if (available === 'YES' || available === true) {
    isAvailable = true;
    statusText = '✓';
    colorClass = 'text-emerald-600';
    bgClass = 'bg-emerald-50';
  } else if (available === 'PARTIAL') {
    isAvailable = true;
    statusText = 'PARTIAL';
    colorClass = 'text-amber-600';
    bgClass = 'bg-amber-50';
  } else {
    isAvailable = false;
  }

  return (
    <div className={`flex items-start gap-3 py-2.5 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${bgClass}`}>
        <span className={`material-symbols-outlined text-[14px] ${colorClass}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-slate-700 truncate">{label}</span>
          <span className={`text-[9.5px] font-bold uppercase tracking-wide shrink-0 ${colorClass}`}>
            {statusText}
          </span>
        </div>
        <p className="text-[9.5px] text-slate-400 leading-relaxed mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export default function LocationCapabilityCard({ compact = false }) {
  const { selectedState, selectedDistrict, selectedSubdistrict, capabilities, breadcrumb, clearSelection, selectState } = useLocation();

  const locationLabel = selectedSubdistrict || selectedDistrict || selectedState || 'India';
  const scopeLabel = [selectedState, selectedDistrict, selectedSubdistrict].filter(Boolean).join(' → ') || 'Pan-India';

  const isUttarakhand = true;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs font-sans select-none shrink-0">
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-[#0A2540] overflow-hidden bg-[#0A2540]">
        <div 
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/images/himalayan_hero_bg.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative z-10 flex items-start justify-between gap-2">
          <div>
            <div className="text-[9px] font-bold text-cyan-400/80 uppercase tracking-widest mb-0.5">Location Capabilities</div>
            <div className="text-[13px] font-bold text-white leading-tight">{locationLabel}</div>
            {selectedState && (
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{scopeLabel}</div>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 1 && (
          <div className="relative z-10 flex items-center gap-1 flex-wrap mt-2">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={crumb.label}>
                {i > 0 && <span className="text-white/40 text-[9px]">›</span>}
                <button
                  onClick={crumb.onClick || undefined}
                  disabled={!crumb.onClick}
                  className={`text-[9.5px] font-semibold transition-colors ${crumb.active ? 'text-white font-bold' : 'text-cyan-400 hover:text-cyan-300'} ${!crumb.onClick ? 'cursor-default' : ''}`}
                >
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="px-4 pb-2">
        {CAPABILITY_CONFIG.map((cap, i) => {
          const available = capabilities[cap.key]?.available || cap.alwaysAvailable;
          const detail = cap.detail(capabilities, selectedState);
          return (
            <CapabilityRow
              key={cap.key}
              label={cap.label}
              icon={cap.icon}
              available={available}
              detail={detail}
              isLast={i === CAPABILITY_CONFIG.length - 1}
            />
          );
        })}
      </div>

      {/* Footer: data integrity note */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
        <p className="text-[9px] text-slate-400 leading-relaxed">
          Capability status reflects actual verified data sources only. No predictions are generated for uncovered regions.
        </p>
      </div>
    </div>
  );
}
