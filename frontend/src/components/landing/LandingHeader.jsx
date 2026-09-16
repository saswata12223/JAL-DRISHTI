import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/jal_drishti_logo_transparent.png'; // Using the logo that includes text if possible, or logo_without_text

export default function LandingHeader() {
  const navigate = useNavigate();
  const [platformOpen, setPlatformOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 z-[1000] w-full transition-all duration-300 select-none ${isScrolled ? 'py-3 bg-[#0F172A]/85 backdrop-blur-md shadow-lg border-b border-white/10' : 'pt-4 sm:pt-6 pb-2 bg-transparent'} px-6 sm:px-10 lg:px-16`}>
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-between relative">
        {/* LEFT: JAL DRISHTI LOGO */}
        <div className="flex items-center">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="group flex items-center transition-opacity"
          >
            {/* The user requested logo_without_text, but the design shows Jal Drishti text next to it. Let's use logo_without_text + text */}
            <div className="flex items-center gap-3">
              <img
                src="/assets/images/logo_without_text.png"
                alt="Jal Drishti Logo"
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-md group-hover:scale-[1.02] transition-transform"
                onError={(e) => { e.target.src = '/images/logo_without_text.png' }}
              />
              <div className="flex flex-col">
                <span className="text-white font-black text-xl leading-none tracking-tight">Jal Drishti</span>
                <span className="text-white/70 text-[9px] uppercase tracking-widest leading-none mt-1 font-semibold">Sense the storm. See the risk. Act in time</span>
              </div>
            </div>
          </a>
        </div>

        {/* CENTER: NAVIGATION LINKS */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-white tracking-wide font-sans absolute left-1/2 -translate-x-1/2">
          
          {/* Platform Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setPlatformOpen(true)}
            onMouseLeave={() => setPlatformOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-white/80 transition-colors py-2">
              Platform <span className="material-symbols-outlined text-[16px]">expand_more</span>
            </button>
            {platformOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 py-2 flex flex-col text-[#0F172A] z-50">
                <button onClick={() => navigate('/dashboard')} className="text-left px-4 py-2 text-sm hover:bg-[#F1F5F9] transition-colors font-medium">Dashboard</button>
                <button onClick={() => navigate('/immediate-actions')} className="text-left px-4 py-2 text-sm hover:bg-[#F1F5F9] transition-colors font-medium">Immediate Actions</button>
                <button onClick={() => navigate('/flood-simulation')} className="text-left px-4 py-2 text-sm hover:bg-[#F1F5F9] transition-colors font-medium">Flood Simulation</button>
                <button onClick={() => navigate('/live-forecast')} className="text-left px-4 py-2 text-sm hover:bg-[#F1F5F9] transition-colors font-medium">Forecast & Monitoring</button>
              </div>
            )}
          </div>

          <button onClick={() => navigate('/about')} className="hover:text-white/80 transition-colors cursor-pointer py-2">
            About
          </button>
          <button onClick={() => navigate('/resources')} className="hover:text-white/80 transition-colors cursor-pointer py-2">
            Resources
          </button>
          <button onClick={() => navigate('/accessibility')} className="hover:text-white/80 transition-colors cursor-pointer py-2">
            Legal & Accessibility
          </button>
        </nav>

        {/* RIGHT: LOGIN & SIGN UP */}
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 text-sm font-bold text-[#0F172A] bg-white hover:bg-gray-100 rounded-lg transition-all cursor-pointer shadow-md"
          >
            Login
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#0F4C81] hover:bg-[#0B3B66] border border-white/10 rounded-lg transition-all cursor-pointer shadow-md"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}



