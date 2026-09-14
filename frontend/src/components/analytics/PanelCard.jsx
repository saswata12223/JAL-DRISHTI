import React from 'react';



// Agency-tier analytical panel shell with Double-Bezel nested architecture

export default function PanelCard({ title, subtitle, icon, badge, right, children, className = '' }) {

  return (

    <div className={`bg-app-surface border border-app-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col flex-1 min-w-0 ${className}`}>

      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-1 select-none">

        <div className="flex items-center gap-2.5 min-w-0">

          {icon && (

            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">

              <span className="material-symbols-outlined text-[16px] text-indigo-400">

                {icon}

              </span>

            </div>

          )}

          <div className="min-w-0">

            <h3 className="text-[12px] font-bold uppercase tracking-wider text-app-text-primary font-sans truncate">

              {title}

            </h3>

            {subtitle && (

              <p className="text-[10.5px] text-app-text-muted font-medium truncate mt-0.5">{subtitle}</p>

            )}

          </div>

        </div>

        <div className="flex items-center gap-2 shrink-0">

          {badge}

          {right}

        </div>

      </div>

      <div className="px-4 pt-2 pb-4 min-h-0">{children}</div>

    </div>

  );

}
