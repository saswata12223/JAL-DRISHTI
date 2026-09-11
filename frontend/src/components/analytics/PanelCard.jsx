import React from 'react';

// Shared analytical panel shell used across Flood Risk Analytics (Screen 9D).
export default function PanelCard({ title, subtitle, icon, badge, right, children, className = '' }) {
  return (
    <div className={`bg-app-surface border border-app-border rounded-xl shadow-sm flex flex-col flex-1 min-w-0 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-1 select-none">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="material-symbols-outlined text-[16px] text-indigo-400 dark:text-indigo-400 shrink-0">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[11.5px] font-bold uppercase tracking-wider text-app-text-primary font-sans truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-app-text-muted font-medium truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {right}
        </div>
      </div>
      <div className="px-4 pt-1.5 pb-3.5 min-h-0">{children}</div>
    </div>
  );
}