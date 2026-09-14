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

    <header className="fixed top-0 left-0 w-full z-50 bg-[#0A2540] text-white shadow-md select-none border-b border-white/10 backdrop-blur-xl">

      {/* 1. Top Institutional Banner Strip */}

      <div className="border-b border-white/10 px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between text-[11px] font-sans bg-black/20">

        <div className="flex items-center gap-2 text-slate-300">

          <span className="font-bold tracking-widest uppercase text-white text-[10px]">

            Government of Uttarakhand

          </span>

          <span className="text-slate-500 hidden sm:inline">&bull;</span>

          <span className="text-slate-300 hidden sm:inline text-[10.5px]">

            State Disaster Management Authority (USDMA)

          </span>

        </div>

        <div className="flex items-center gap-3 text-slate-300 text-[10.5px]">

          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">

            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

            <span className="font-bold text-emerald-400 text-[10px] uppercase tracking-wider">System {systemStatus}</span>

          </div>

          <span className="hidden md:inline text-slate-600">|</span>

          <span className="hidden md:inline font-mono text-slate-300 text-[10px]">Updated: {lastUpdated}</span>

        </div>

      </div>



      {/* 2. Main Executive Header & Integrated Navigation */}

      <div className="px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-6">

        {/* Brand Identity */}

        <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0 group">

          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-indigo-500/20 border border-white/20 transition-transform duration-300 group-hover:scale-105">

            <span className="material-symbols-outlined text-[22px]">waves</span>

          </div>

          <div className="flex flex-col justify-center">

            <span className="text-[18px] font-bold text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors">

              Jal Drishti

            </span>

            <span className="text-[9.5px] font-bold text-cyan-300 uppercase tracking-widest leading-tight mt-0.5">

              Hydrological Intelligence System

            </span>

          </div>

        </NavLink>



        {/* Integrated Primary Horizontal Navigation Links */}

        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 h-full">

          {PRIMARY_NAV_ITEMS.map((item) => (

            <NavLink

              key={item.path}

              to={item.path}

              className={({ isActive }) =>

                `px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[12.5px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1.5 whitespace-nowrap ${

                  isActive

                    ? 'bg-white/15 text-white shadow-inner font-bold border border-white/20'

                    : item.isUrgent

                    ? 'text-amber-300 hover:text-white hover:bg-white/10'

                    : 'text-slate-300 hover:text-white hover:bg-white/10'

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

            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all relative flex items-center justify-center border border-transparent hover:border-white/15"

            title="Active Alerts"

          >

            <span className="material-symbols-outlined text-[22px]">notifications</span>

            {activeAlertsCount > 0 && (

              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-md animate-bounce">

                {activeAlertsCount}

              </span>

            )}

          </NavLink>



          {/* User Profile / Portal Access */}

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/20 text-white text-[12px] font-bold bg-white/10 hover:bg-white/20 cursor-pointer transition-all shadow-sm">

            <span className="material-symbols-outlined text-[18px]">account_circle</span>

            <span>USDMA Portal</span>

          </div>



          {/* Mobile Menu Toggle Button */}

          <button

            type="button"

            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}

            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl focus:outline-none"

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

        <div className="lg:hidden border-t border-white/15 bg-[#0A2540] px-4 py-4 shadow-2xl">

          <div className="grid grid-cols-2 gap-2">

            {PRIMARY_NAV_ITEMS.map((item) => (

              <NavLink

                key={item.path}

                to={item.path}

                onClick={() => setMobileMenuOpen(false)}

                className={({ isActive }) =>

                  `px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${

                    isActive

                      ? 'bg-cyan-400 text-[#0A2540] font-bold shadow-md'

                      : 'text-slate-200 hover:bg-white/10 hover:text-white'

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
