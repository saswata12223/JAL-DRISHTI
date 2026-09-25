import React from 'react';
import { NavLink } from 'react-router-dom';

const PORTAL_LINKS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Immediate Actions', path: '/immediate-actions' },
  { name: 'Forecast & Monitoring', path: '/live-forecast' },
  { name: 'Flood Simulation', path: '/flood-simulation' },
  { name: 'Alerts & Response', path: '/alerts' },
  { name: 'Analytics', path: '/analytics' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A2540] text-slate-300 font-sans border-t border-slate-700/50 pt-10 pb-6 shrink-0 z-50 relative">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col gap-10">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand & Mission (Left) */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3 select-none">
              <div className="bg-white rounded-full p-1 shadow-sm shrink-0">
                <img src="/assets/images/logo_without_text.png" alt="Jal Drishti Logo" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-[13px] font-bold text-white tracking-wide">Jal Drishti</span>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400 max-w-sm">
              Jal Drishti is a flood risk intelligence and decision-support platform designed to support situational awareness, early warning, and disaster preparedness.
            </p>
            {/* Tile attribution */}
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Map tiles: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">OpenStreetMap</a> contributors,
              © <a href="https://carto.com/" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">CARTO</a>.
              Administrative boundaries: Survey of India (SOI) — immutable, SHA-256 verified.
            </p>
          </div>

          {/* Portal Navigation (Center-Left) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Portal Navigation</h3>
            <div className="flex flex-col gap-2.5">
              {PORTAL_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm"
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Information & Policies (Center-Right) */}
          <div className="md:col-span-4 lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Information & Policies</h3>
            <div className="flex flex-col gap-2.5">
              <NavLink to="/about" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm">About Jal Drishti</NavLink>
              <NavLink to="/resources" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm">Resources</NavLink>
              <NavLink to="/privacy" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm">Privacy Policy</NavLink>
              <NavLink to="/terms" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm">Terms of Service</NavLink>
              <NavLink to="/accessibility" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm">Accessibility</NavLink>
              <a href="https://usdma.uk.gov.in/" target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm flex items-center gap-1 mt-2">
                Official USDMA <span className="material-symbols-outlined text-[12px]">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Data Sources (Right) */}
          <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-4 lg:items-end">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Data & Information Sources</h3>
            <div className="flex flex-wrap lg:justify-end gap-2 text-[10.5px] font-mono font-semibold">
              <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded" title="OpenWeatherMap — verified live source">OWM ✓ Live</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400" title="Central Water Commission — offline">CWC</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400" title="India Meteorological Department — not configured">IMD</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400">NRSC</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400">USGS</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded text-slate-400">GSI</span>
            </div>
            <div className="text-[10px] text-slate-500 lg:text-right mt-1">
              ML Model: XGBoost (historical calibrated reference)<br />
              GIS: Survey of India (SOI) — Pan-India
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-slate-700/50"></div>

        {/* Bottom Legal / Copyright Strip */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} State Disaster Management Authority (USDMA). All rights reserved.
          </div>
          <div className="flex gap-4">
            <NavLink to="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</NavLink>
            <NavLink to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</NavLink>
            <NavLink to="/accessibility" className="hover:text-slate-300 transition-colors">Accessibility</NavLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
