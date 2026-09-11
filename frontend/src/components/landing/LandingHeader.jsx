import React from 'react';
import { NavLink } from 'react-router-dom';

export default function LandingHeader({ onOpenAuth }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#152C31]/10 px-4 sm:px-8 py-3 flex items-center justify-between font-sans select-none">
      {/* LEFT: BRANDING */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md bg-[#A5F1F7] p-0.5 border border-[#152C31]/20 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[#152C31] text-xl">tsunami</span>
        </div>

        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-bold tracking-tight text-[#152C31] uppercase leading-none">
            JAL DRISTI
          </span>
          <span className="text-[9.5px] sm:text-[10.5px] font-semibold tracking-wider text-[#647A7F] uppercase mt-0.5">
            UTTARAKHAND FLOOD INTELLIGENCE
          </span>
        </div>
      </div>

      {/* CENTER: OPTIONAL MINIMAL ANCHOR NAVIGATION */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#647A7F]">
        <button
          onClick={() => scrollToSection('home')}
          className="hover:text-[#152C31] transition-colors cursor-pointer"
        >
          HOME
        </button>
        <button
          onClick={() => scrollToSection('simulation')}
          className="hover:text-[#152C31] transition-colors cursor-pointer"
        >
          SIMULATION
        </button>
        <button
          onClick={() => scrollToSection('about-terrain')}
          className="hover:text-[#152C31] transition-colors cursor-pointer"
        >
          ABOUT &amp; TERRAIN
        </button>
      </nav>

      {/* RIGHT ACTIONS: SIMPLE TEXT / OUTLINED BUTTONS */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onOpenAuth('login')}
          className="px-3.5 py-1.5 text-xs font-semibold text-[#152C31] hover:bg-[#F7FCFD] border border-[#152C31]/20 rounded transition-colors cursor-pointer"
        >
          LOGIN
        </button>

        <button
          onClick={() => onOpenAuth('signup')}
          className="px-3.5 py-1.5 text-xs font-bold text-[#152C31] bg-[#A5F1F7] hover:bg-[#8BE5EC] border border-[#A5F1F7] rounded transition-colors cursor-pointer"
        >
          SIGN UP
        </button>
      </div>
    </header>
  );
}

