











































































































































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
              <img src="/assets/images/logo_without_text.png" alt="Jal Drishti Logo" className="w-8 h-8 object-contain shrink-0" />
              <div className="flex flex-col justify-center">
                <span className="text-[17px] font-bold text-white tracking-tight leading-none">
                  Jal Drishti
                </span>
                <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest leading-tight mt-0.5">
                  Sense the storm, see the risk, act in time
                </span>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-slate-400 max-w-sm">
              Jal Drishti is a flood risk intelligence and decision-support platform designed to support situational awareness, early warning, and disaster preparedness.
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
            <div className="flex flex-wrap lg:justify-end gap-2 text-[10.5px] font-mono font-semibold text-slate-400">
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">CWC</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">IMD</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">NRSC</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">USGS</span>
              <span className="bg-white/5 border border-white/10 px-2 py-1 rounded">GSI</span>
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
