import React from 'react';
import { NavLink } from 'react-router-dom';

const PLATFORM_LINKS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Immediate Actions', path: '/immediate-actions' },
  { name: 'Live Forecast', path: '/live-forecast' },
  { name: 'Monitoring', path: '/monitoring' },
  { name: 'Flood Simulation', path: '/flood-simulation' },
  { name: 'Alerts', path: '/alerts' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Historical Events', path: '/historical-events' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#0A2540] text-slate-300 font-sans border-t border-slate-700/50 pt-10 pb-6 shrink-0 z-50 relative">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col gap-10">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand & Mission (Left) */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col items-start gap-4">
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
              State Disaster Management Authority (USDMA), Government of Uttarakhand. Providing real-time hydrological intelligence, flood forecasting, and decision support for disaster preparedness.
            </p>
          </div>
          
          {/* Platform Navigation (Center) */}
          <div className="md:col-span-7 lg:col-span-5 flex flex-col gap-4">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Platform Modules</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {PLATFORM_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className="text-[12px] text-slate-400 hover:text-cyan-300 transition-colors w-fit flex items-center focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-sm"
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>
          
          {/* Data Sources (Right) */}
          <div className="md:col-span-12 lg:col-span-3 flex flex-col gap-4 lg:items-end">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-wider">Verified Data Partners</h3>
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
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
