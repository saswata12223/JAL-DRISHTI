import React from 'react';

export default function TermsOfServicePage() {
  return (
    <div className="w-full min-h-screen bg-[#06182C] text-slate-200 font-sans pt-32 pb-16">
      <button
        onClick={() => window.close()}
        title="Close"
        className="fixed top-5 right-6 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-red-500/80 text-slate-300 hover:text-white transition-all duration-200 backdrop-blur-sm border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="max-w-4xl mx-auto px-6 sm:px-10 lg:px-16">
        <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Terms of Service</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-slate-300">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">1. Purpose of the Portal</h2>
            <p>
              Jal Drishti is a flood risk intelligence and decision-support platform designed for situational awareness. Information provided on this portal is intended to support disaster preparedness and early warning.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">2. Limitation of Liability</h2>
            <p>
              While every effort is made to ensure the accuracy of the information presented, data relies on automated sensor networks, external institutional feeds, and forecasting models. Users must exercise appropriate operational judgment. This platform should not be relied upon as the sole source for life-safety or emergency evacuation decisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">3. Official Directives</h2>
            <p>
              During active disaster scenarios, the public and authorized personnel must follow the direct instructions and official emergency management directives issued by the State Disaster Management Authority (USDMA) and relevant local authorities.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
