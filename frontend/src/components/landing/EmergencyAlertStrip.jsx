import React from 'react';

export default function EmergencyAlertStrip({
  alertMessage = 'FLOOD ALERT | HIGH-RISK AREAS: CHAMOLI, UTTARKASHI (DEMO TELEMETRY FEED)',
}) {
  return (
    <div className="w-full bg-[#A5F1F7] text-[#152C31] px-4 py-2 border-y border-[#152C31]/10 flex items-center justify-center font-sans text-xs font-bold tracking-wide select-none">
      <div className="flex items-center gap-2 max-w-6xl mx-auto text-center truncate">
        <span className="material-symbols-outlined text-base shrink-0 text-[#152C31]">warning</span>
        <span className="truncate">{alertMessage}</span>
      </div>
    </div>
  );
}
