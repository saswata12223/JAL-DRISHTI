import React from 'react';

export default function LandingHeader({ onOpenAuth }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="absolute top-0 left-0 z-50 w-full bg-transparent select-none pt-4 sm:pt-6 pb-2 px-6 sm:px-10 lg:px-16">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between relative">
        {/* LEFT: ACTUAL TRANSPARENT JAL DRISHTI LOGO */}
        <div className="flex items-center">
          <a
            href="#home"
            onClick={(e) => { e.preventDefault(); scrollToSection('home'); }}
            className="group flex items-center transition-opacity"
          >
            <img
              src="/assets/images/jal_drishti_logo_transparent.png"
              alt="Jal Drishti - Early Insights. Safer Tomorrows."
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain drop-shadow-sm group-hover:scale-[1.01] transition-transform"
            />
          </a>
        </div>

        {/* CENTER: HOME & SIMULATION NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12 text-xs sm:text-sm font-extrabold text-[#0F4C81] tracking-wider font-sans absolute left-1/2 -translate-x-1/2">
          <button
            onClick={() => scrollToSection('home')}
            className="hover:text-[#0B3B66] transition-colors cursor-pointer py-1 uppercase"
          >
            HOME
          </button>
          <button
            onClick={() => scrollToSection('simulation')}
            className="hover:text-[#0B3B66] transition-colors cursor-pointer py-1 uppercase"
          >
            SIMULATION
          </button>
        </nav>

        {/* RIGHT: LOGIN & SIGN UP WITH CLEAR SEPARATION AND RIGHT PADDING */}
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-5 py-2 text-xs sm:text-sm font-extrabold text-[#0F4C81] bg-white/80 hover:bg-white border border-[#0F4C81]/30 rounded-lg transition-all cursor-pointer shadow-xs backdrop-blur-xs"
          >
            LOGIN
          </button>

          <button
            onClick={() => onOpenAuth('signup')}
            className="px-6 py-2 text-xs sm:text-sm font-extrabold text-white bg-[#0F4C81] hover:bg-[#0B3B66] border border-[#0F4C81] rounded-lg transition-all cursor-pointer shadow-md"
          >
            SIGN UP
          </button>
        </div>
      </div>
    </header>
  );
}



