import React from 'react';

export default function StatCard({ label, value, subtext, icon, type = 'default' }) {
  let valColor = 'text-[#102A2E]';
  let badgeColor = 'text-[#24464B]';

  if (type === 'extreme') {
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
  const displayVal = typeof value === 'number' && value < 10 ? `0${value}` : value;

  return (
    <div className="kpi-card bg-gradient-to-br from-white to-[#F2FAFB] border border-[#A5F1F7]/35 p-4 rounded-xl flex items-center justify-between select-none shadow-[0_10px_25px_rgba(16,42,46,0.05)] hover:border-[#A5F1F7] transition-all duration-200 group">
      {/* Label and Dominant Telemetry Number */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10.5px] font-semibold text-[#6B858A] tracking-wider font-sans truncate uppercase">
          {label}
        </span>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`kpi-number text-[32px] font-bold leading-none font-mono tracking-tight ${valColor}`}>
            {displayVal}
          </span>
          {type === 'extreme' && Number(value) > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse inline-block" />
          )}
        </div>
      </div>

      {/* Quiet Icon Badge */}
      <div className="w-10 h-10 rounded-lg bg-[#EAF8FA] border border-[#A5F1F7]/50 flex items-center justify-center shrink-0 group-hover:bg-[#A5F1F7]/30 transition-colors">
        <span className={`material-symbols-outlined text-[20px] ${badgeColor}`}>
          {icon}
        </span>
      </div>
    </div>
  );
}


