import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/jal_drishti_logo_transparent.png';

export default function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#0F172A] border-t border-[#1E293B]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-10">
        
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row justify-between gap-16 mb-16">
          
          {/* Brand */}
          <div className="lg:w-1/4 flex flex-col items-start">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/images/logo_without_text.png"
                alt="Jal Drishti Logo"
                className="h-10 w-auto object-contain drop-shadow-md"
                onError={(e) => { e.target.src = '/images/logo_without_text.png' }}
              />
              <div className="flex flex-col">
                <span className="text-white font-black text-xl leading-none tracking-tight">Jal Drishti</span>
                <span className="text-[#8FD3E8] text-[9px] uppercase tracking-[0.15em] leading-none mt-1 font-bold">Flood Intelligence</span>
              </div>
            </div>
            <p className="text-[#94A3B8] text-sm font-medium leading-relaxed max-w-xs">
              Sense the storm. See the risk. Act in time. Providing early insights for safer tomorrows in Uttarakhand.
            </p>
          </div>

          {/* Links Columns */}
          <div className="lg:w-3/4 grid grid-cols-1 sm:grid-cols-3 gap-10">
            {/* PORTAL NAVIGATION */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-extrabold tracking-[0.15em] text-[#CBD5E1] uppercase mb-1">Portal Navigation</span>
              <button onClick={() => navigate('/dashboard')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Dashboard</button>
              <button onClick={() => navigate('/immediate-actions')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Immediate Actions</button>
              <button onClick={() => navigate('/flood-simulation')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Flood Simulation</button>
              <button onClick={() => navigate('/alerts')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Alerts & Notifications</button>
            </div>

            {/* INFORMATION & POLICIES */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-extrabold tracking-[0.15em] text-[#CBD5E1] uppercase mb-1">Information & Policies</span>
              <button onClick={() => navigate('/about')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">About</button>
              <button onClick={() => navigate('/resources')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Resources</button>
              <button onClick={() => navigate('/privacy')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Privacy Policy</button>
              <button onClick={() => navigate('/terms')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Terms of Service</button>
              <button onClick={() => navigate('/accessibility')} className="text-left text-[#94A3B8] hover:text-white text-sm transition-colors w-fit font-medium">Legal & Accessibility</button>
            </div>

            {/* DATA & INFORMATION SOURCES */}
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-extrabold tracking-[0.15em] text-[#CBD5E1] uppercase mb-1">Data & Information Sources</span>
              <span className="text-[#94A3B8] text-sm font-medium">CWC (Central Water Commission)</span>
              <span className="text-[#94A3B8] text-sm font-medium">IMD (India Meteorological Department)</span>
              <span className="text-[#94A3B8] text-sm font-medium">ISRO (Indian Space Research Organisation)</span>
              <span className="text-[#94A3B8] text-sm font-medium">State Disaster Management Authority</span>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#334155] flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-[#64748B] text-xs font-medium">
            &copy; {new Date().getFullYear()} Jal Drishti. All Rights Reserved.
          </span>
          <span className="text-[#64748B] text-xs font-bold tracking-wide">
            Built for Uttarakhand.
          </span>
        </div>
      </div>
    </footer>
  );
}
