import React from 'react';
import { NavLink } from 'react-router-dom';

export default function ActiveAlertsPanel({ alerts = [], onSelectAlert }) {
  return (
    <div className="glass-panel-level1 rounded-2xl flex flex-col overflow-hidden font-sans border border-[#A5F1F7]/35 shadow-[0_10px_35px_rgba(16,42,46,0.06)]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#A5F1F7]/35 select-none bg-white/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
          <h2 className="text-[12px] font-bold tracking-wide text-[#102A2E] uppercase font-sans">
            Active Incidents
          </h2>
        </div>
        <NavLink
          to="/alerts"
          className="text-[11px] font-semibold text-[#24464B] hover:text-[#102A2E] transition-colors"
        >
          View All ({alerts.length})
        </NavLink>
      </div>

      {/* Incident Rows with subtle separators */}
      <div className="flex flex-col divide-y divide-[#102A2E]/08 max-h-[260px] overflow-y-auto custom-scrollbar bg-white/60">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const isExtreme = alert.level === 'EXTREME';
            const levelColor = isExtreme ? 'text-[#DC2626]' : 'text-[#F97316]';

            return (
              <div
                key={alert.id}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className="px-4 py-3 flex items-center justify-between hover:bg-[#EAF8FA] cursor-pointer transition-colors duration-150 group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold font-mono tracking-wider ${levelColor}`}>
                      {alert.level}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B858A]">
                      {alert.id || 'FL-UK-2010'}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B858A]">
                      &bull; {alert.time}
                    </span>
                  </div>
                  <h3 className="text-[12.5px] font-semibold text-[#102A2E] leading-snug group-hover:text-[#24464B] transition-colors truncate">
                    {alert.title}
                  </h3>
                </div>

                <span className="material-symbols-outlined text-[16px] text-[#6B858A] group-hover:text-[#102A2E] group-hover:translate-x-0.5 transition-all shrink-0">
                  arrow_forward
                </span>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-6 text-center text-[11.5px] text-[#6B858A] italic">
            No active emergency alerts recorded.
          </div>
        )}
      </div>
    </div>
  );
}


