import React from 'react';

export default function StatCard({ label, value, subtext, icon, type = 'default' }) {
  let valColor = 'text-[#102A2E]';
  let badgeColor = 'text-[#24464B]';

  if (value === 0 || value === '-') {
    valColor = 'text-slate-400';
    badgeColor = 'text-slate-400';
  } else if (type === 'extreme') {
    valColor = 'text-[#DC2626]';
    badgeColor = 'text-[#DC2626]';
  } else if (type === 'high') {
    valColor = 'text-[#F97316]';
    badgeColor = 'text-[#F97316]';
  } else if (type === 'alerts') {
    valColor = 'text-[#D97706]';
    badgeColor = 'text-[#D97706]';
  }

  // Format value to 2 digits if less than 10 for clean telemetry aesthetic (e.g. 01, 00)
  // If it's a dash (loading state), don't format it.
  const displayVal = typeof value === 'number' && value < 10 ? `0${value}` : value;

  return (
    <div className="kpi-card bg-white border border-slate-200 p-6 rounded-2xl flex items-center select-none shadow-xs hover:shadow-sm transition-all duration-200 group">
      {/* Label and Dominant Telemetry Number */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10.5px] font-bold text-slate-500 tracking-wider font-sans truncate uppercase">
          {label}
        </span>
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className={`kpi-number text-[32px] font-bold leading-none font-mono tracking-tight ${valColor}`}>
            {displayVal}
          </span>
          {type === 'extreme' && Number(value) > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block mb-1" />
          )}
        </div>
      </div>
    </div>
  );
}


