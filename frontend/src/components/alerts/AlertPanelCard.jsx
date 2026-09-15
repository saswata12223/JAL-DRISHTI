import React from 'react';

// Shared panel shell for the Alerts & Early Warning screen (Screen 9F).
export default function AlertPanelCard({ title, subtitle, icon, badge, right, children, className = '' }) {
  return (
    <div className={`bg-app-surface border border-app-border rounded-xl shadow-sm flex flex-col flex-1 min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-6 pt-5 pb-3 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="text-[12px] font-bold uppercase tracking-wider text-app-text-primary font-sans truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10.5px] text-app-text-muted font-medium truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {badge}
          {right}
        </div>
      </div>
      <div className="px-6 pt-2 pb-6 min-h-0">{children}</div>
    </div>
  );
}
