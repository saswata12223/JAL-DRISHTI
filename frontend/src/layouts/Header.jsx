import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const PRIMARY_NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Immediate Actions', path: '/immediate-actions', isUrgent: true },
  { name: 'Risk Map', path: '/risk-map' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Monitoring', path: '/monitoring' },
  { name: 'Live Forecast', path: '/live-forecast' },
  { name: 'Flood Simulation', path: '/flood-simulation' },
  { name: 'Alerts', path: '/alerts' },
  { name: 'Historical Events', path: '/historical-events' },
  { name: 'Model Intelligence', path: '/model-intelligence' },
];

export default function Header({
  activeAlertsCount = 2,
  systemStatus = 'LIVE',
  lastUpdated = '01:32 AM IST',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#0F4C81] text-white shadow-sm select-none border-b border-[#0B3B66]">
      {/* 1. Top Institutional Banner Strip */}
      <div className="border-b border-white/10 px-4 sm:px-6 lg:px-8 py-1 flex items-center justify-between text-[11px] font-sans">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="font-semibold tracking-wider uppercase text-white">
            Government of Uttarakhand
          </span>
          <span className="text-slate-400 hidden sm:inline">&bull;</span>
          <span className="text-slate-200 hidden sm:inline">
            State Disaster Management Authority
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-200 text-[10.5px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>System {systemStatus}</span>
          </div>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline font-sans text-slate-200">Updated: {lastUpdated}</span>
        </div>
      </div>

      {/* 2. Main Yale-Blue Header & Integrated Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-6">
        {/* Brand Identity */}
        <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-white/15 text-white flex items-center justify-center font-bold text-base border border-white/20">
            <span className="material-symbols-outlined text-[20px]">waves</span>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-bold text-white tracking-tight leading-none">
              Jal Drishti
            </span>
            <span className="text-[9.5px] font-medium text-[#8FD3E8] uppercase tracking-wider leading-tight mt-0.5">
              Flood Intelligence System
            </span>
          </div>
        </NavLink>

        {/* Integrated Primary Horizontal Navigation Links */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 h-full">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-2 xl:px-2.5 py-1.5 text-[11.5px] xl:text-[12.5px] font-medium transition-colors border-b-2 flex items-center gap-1.5 h-full whitespace-nowrap ${
                  isActive
                    ? 'border-[#8FD3E8] text-[#8FD3E8] font-bold bg-white/10'
                    : item.isUrgent
                    ? 'border-transparent text-amber-300 hover:text-white hover:bg-white/10'
                    : 'border-transparent text-slate-100 hover:text-white hover:bg-white/10'
                }`
              }
            >
              {item.isUrgent && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
              )}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Side Header Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Active Alerts Button */}
          <NavLink
            to="/alerts"
            className="p-1.5 text-slate-100 hover:text-white hover:bg-white/10 rounded transition-colors relative flex items-center justify-center"
            title="Active Alerts"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {activeAlertsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                {activeAlertsCount}
              </span>
            )}
          </NavLink>

          {/* User Profile / Portal Access */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded border border-white/25 text-white text-[12px] font-semibold hover:bg-white/10 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[16px]">account_circle</span>
            <span>Portal Access</span>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-white/15 bg-[#0F4C81] px-4 py-3 shadow-lg">
          <div className="grid grid-cols-2 gap-1.5">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 text-[13px] font-medium rounded transition-colors ${
                    isActive
                      ? 'bg-[#8FD3E8] text-[#0F4C81] font-bold'
                      : 'text-slate-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}




