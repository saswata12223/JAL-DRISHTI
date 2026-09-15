import React, { useState, useRef, useEffect } from 'react';

import { NavLink, useNavigate } from 'react-router-dom';



const PRIMARY_NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Immediate Actions', path: '/immediate-actions', isUrgent: true },
  { name: 'Live Forecast', path: '/live-forecast' },
  { name: 'Monitoring', path: '/monitoring' },
  { name: 'Flood Simulation', path: '/flood-simulation' },
  { name: 'Alerts', path: '/alerts' },
  { name: 'Analytics', path: '/analytics' },
  { name: 'Historical Events', path: '/historical-events' },
];



export default function Header({
  activeAlertsCount = 2,
  systemStatus = 'LIVE',
  lastUpdated = '01:32 AM IST',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const portalMenuRef = useRef(null);
  const navigate = useNavigate();

  // Handle outside click and escape key for portal menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (portalMenuRef.current && !portalMenuRef.current.contains(event.target)) {
        setPortalMenuOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setPortalMenuOpen(false);
      }
    }
    if (portalMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [portalMenuOpen]);

  const handleSignOut = () => {
    // Currently, there is no global auth context or session state to clear.
    // If one is added, clear it here before navigating.
    setPortalMenuOpen(false);
    navigate('/');
  };



  return (

    <header className="fixed top-0 left-0 w-full z-[100] bg-[#0A2540] text-white select-none border-b border-white/10 backdrop-blur-xl">



      {/* Main Executive Header & Integrated Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">

        {/* Brand Identity */}

        <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0 group">

          <img src="/assets/images/logo_without_text.png" alt="Jal Drishti Logo" className="w-8 h-8 object-contain shrink-0 group-hover:scale-105 transition-transform duration-300" />

          <div className="flex flex-col justify-center">

            <span className="text-[18px] font-bold text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors">

              Jal Drishti

            </span>

            <span className="text-[9.5px] font-bold text-cyan-300 uppercase tracking-widest leading-tight mt-0.5">
              Sense the storm, see the risk, act in time
            </span>

          </div>

        </NavLink>



        {/* Integrated Primary Horizontal Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3 h-full overflow-x-auto scrollbar-hide flex-1 min-w-0 px-2 mx-4 pb-1">

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
          <div className="hidden sm:block relative" ref={portalMenuRef}>
            <button
              onClick={() => setPortalMenuOpen(!portalMenuOpen)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPortalMenuOpen(!portalMenuOpen);
                }
              }}
              aria-haspopup="menu"
              aria-expanded={portalMenuOpen}
              aria-label="Account menu"
              className="flex items-center gap-2 px-3 py-1.5 text-white/90 text-[12px] font-bold hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <span className="material-symbols-outlined text-[18px]">account_circle</span>
              <span>USDMA Portal</span>
            </button>
            
            {portalMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden z-50 text-slate-800"
                role="menu"
              >
                <div className="px-4 py-3 select-none">
                  <p className="text-[12px] font-bold text-slate-900 leading-tight">USDMA Portal</p>
                  <p className="text-[11px] text-slate-500 font-medium">Administrator</p>
                </div>
                <div className="h-px bg-slate-200 w-full"></div>
                <button
                  onClick={handleSignOut}
                  role="menuitem"
                  className="w-full text-left px-4 py-2.5 text-[12px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors focus:outline-none focus:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            )}
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
