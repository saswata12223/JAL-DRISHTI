import React from 'react';



// Agency-tier analytical panel shell with Double-Bezel nested architecture

export default function PanelCard({ title, subtitle, icon, badge, right, children, className = '' }) {
  return (
    <div className={`bg-app-surface border border-app-border/80 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col flex-1 min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3 select-none border-b border-app-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-app-text-primary font-sans truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] text-app-text-muted font-medium truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {right}
        </div>
      </div>
      <div className="px-6 py-5 min-h-0 flex-1 flex flex-col">{children}</div>
    </div>
  );
}
