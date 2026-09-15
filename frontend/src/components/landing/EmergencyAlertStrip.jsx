import React from 'react';

export default function EmergencyAlertStrip({
  alertMessage = 'STATEWIDE FLOOD MONITORING ACTIVE | HIGH-RISK CATCHMENTS: CHAMOLI, UTTARKASHI, RUDRAPRAYAG',
}) {
  return (
    <div className="w-full bg-[#0F4C81] text-white px-4 py-2.5 border-y border-[#0B3B66] flex items-center justify-center font-sans text-xs font-semibold tracking-wide select-none shadow-inner">
      <div className="flex items-center justify-center gap-2.5 max-w-6xl mx-auto text-center truncate">
        <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white font-mono text-[10px] font-black uppercase tracking-wider shrink-0 animate-pulse">
          LIVE ALERT
        </span>
        <span className="truncate text-white/95 text-[11.5px] font-medium font-sans">
          {alertMessage}
        </span>
      </div>
    </div>
  );
}
