import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_GROUPS = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Immediate Actions', path: '/immediate-actions', isUrgent: true },
  { 
    name: 'Forecast & Monitoring', 
    dropdown: [
      { name: 'Live Forecast', path: '/live-forecast' },
      { name: 'Monitoring', path: '/monitoring' },
    ]
  },
  { name: 'Flood Simulation', path: '/flood-simulation' },
  { 
    name: 'Alerts & Response',
    dropdown: [
      { name: 'Active Alerts', path: '/alerts' },
    ]
  },
  { 
    name: 'Analytics',
    dropdown: [
      { name: 'Risk Analytics', path: '/analytics?tab=risk_analytics' },
      { name: 'Historical Events', path: '/historical-events' },
      { name: 'Model Explainability', path: '/analytics?tab=model_explainability' }
    ]
  },
  { name: 'Resources', path: '/resources' },
  { name: 'About', path: '/about' }
];

function NavDropdown({ group, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const location = useLocation();
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        if (!e.target.closest('.dropdown-portal-menu')) setOpen(false);
      }
    }
    function handleScroll() {
      setOpen(false);
    }
    if (open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setCoords({ top: r.bottom + 6, left: r.left });
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const checkActive = (childPath) => {
    const [path, search] = childPath.split('?');
    if (search) return location.pathname === path && location.search === `?${search}`;
    return location.pathname === path;
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={`px-2 lg:px-2.5 xl:px-3 py-1.5 text-[11.5px] lg:text-[12px] xl:text-[12.5px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1 lg:gap-1.5 whitespace-nowrap outline-none ${
          isActive 
            ? 'bg-white/15 text-white shadow-inner font-bold border border-white/20' 
            : 'text-slate-300 hover:text-white hover:bg-white/10'
        }`}
      >
        <span>{group.name}</span>
        <span className={`material-symbols-outlined text-[14px] transition-transform ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && createPortal(
        <div 
          className="fixed w-48 bg-[#0F2942] border border-white/10 rounded-xl shadow-2xl py-1.5 z-[200] flex flex-col dropdown-portal-menu"
          style={{ top: coords.top, left: coords.left }}
        >
          {group.dropdown.map(child => {
            const childActive = checkActive(child.path);
            return (
              <NavLink
                key={child.name}
                to={child.path}
                onClick={() => setOpen(false)}
                className={`px-4 py-2.5 text-[12px] font-medium transition-colors flex items-center gap-2 ${
                  childActive ? 'text-white font-bold bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {child.name}
              </NavLink>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}



export default function Header({
  activeAlertsCount = 2,
  systemStatus = 'LIVE',
  lastUpdated = '01:32 AM IST',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalMenuOpen, setPortalMenuOpen] = useState(false);
  const portalMenuRef = useRef(null);
  const navRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const onMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - navRef.current.offsetLeft;
    scrollLeft.current = navRef.current.scrollLeft;
  };
  const onMouseLeave = () => { isDragging.current = false; };
  const onMouseUp = () => { isDragging.current = false; };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    navRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onWheel = (e) => {
    if (navRef.current && e.deltaY !== 0) {
      navRef.current.scrollLeft += e.deltaY;
    }
  };

  const isDropdownActive = (group) => {
    return group.dropdown.some(child => {
      const [childPath, childSearch] = child.path.split('?');
      if (childSearch) return location.pathname === childPath && location.search === `?${childSearch}`;
      return location.pathname === childPath;
    });
  };

  const { logout, user } = useAuth();

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

  const handleSignOut = async () => {
    setPortalMenuOpen(false);
    await logout();
    navigate('/');
  };



  return (

    <header className="fixed top-0 left-0 w-full z-[1000] bg-[#0A2540] text-white select-none border-b border-white/10 backdrop-blur-xl">



      {/* Main Executive Header & Integrated Navigation */}
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 flex items-center justify-between gap-3 lg:gap-6">

        {/* Brand Identity */}

        <NavLink to="/dashboard" className="flex items-center gap-3 shrink-0 group">

          <div className="bg-white rounded-full p-1 shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
            <img src="/assets/images/logo_without_text.png" alt="Jal Drishti Logo" className="w-7 h-7 object-contain group-hover:scale-105 transition-transform duration-300" />
          </div>



        </NavLink>



        {/* Integrated Primary Horizontal Navigation Links */}
        <nav 
          ref={navRef}
          onMouseDown={onMouseDown}
          onMouseLeave={onMouseLeave}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
          onWheel={onWheel}
          className="hidden lg:flex items-center gap-1 lg:gap-1.5 xl:gap-3 h-full overflow-x-auto scrollbar-hide flex-1 min-w-0 px-1 lg:px-2 mx-2 lg:mx-4 pb-1 cursor-grab active:cursor-grabbing"
        >

          {NAV_GROUPS.map((item) => {
            if (item.dropdown) {
              return <NavDropdown key={item.name} group={item} isActive={isDropdownActive(item)} />;
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-2 lg:px-2.5 xl:px-3 py-1.5 text-[11.5px] lg:text-[12px] xl:text-[12.5px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1 lg:gap-1.5 whitespace-nowrap ${
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
            );
          })}

        </nav>



        {/* Right Side Header Controls */}

        <div className="flex items-center gap-1.5 lg:gap-3 shrink-0">

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
                  <p className="text-[12px] font-bold text-slate-900 leading-tight">{user?.full_name || 'USDMA Portal'}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{user?.role || 'Administrator'}</p>
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

            {NAV_GROUPS.map((item) => {
              if (item.dropdown) {
                return (
                  <div key={item.name} className="flex flex-col gap-1 col-span-2">
                    <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">{item.name}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {item.dropdown.map(child => {
                        const [path, search] = child.path.split('?');
                        const isActive = search 
                          ? location.pathname === path && location.search === `?${search}` 
                          : location.pathname === path;
                        return (
                          <NavLink
                            key={child.name}
                            to={child.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${
                              isActive
                                ? 'bg-cyan-400 text-[#0A2540] font-bold shadow-md'
                                : 'bg-[#0F2942] text-slate-200 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {child.name}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-[#0A2540] font-bold shadow-md'
                        : 'bg-[#0F2942] text-slate-200 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              );
            })}

          </div>

        </div>

      )}

    </header>

  );

}
