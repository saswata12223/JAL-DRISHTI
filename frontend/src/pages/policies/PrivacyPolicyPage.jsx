import React from 'react';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-slate-300">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">1. Information Collection and Use</h2>
            <p>
              The Jal Drishti portal collects and processes operational data strictly for the purposes of situational awareness, early warning, and disaster preparedness. This includes hydrological sensor readings, meteorological forecasts, and spatial intelligence data.
            </p>
            <p>
              We do not track personally identifiable information (PII) from general public users browsing the portal. For authorized personnel logging into the system, standard session information is retained solely to manage secure access and audit portal usage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">2. Data Security</h2>
            <p>
              Information transmitted to and from this portal is secured using standard encryption protocols. The system is designed to protect operational intelligence and ensure the integrity of the data provided to disaster management authorities.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">3. Third-Party Integrations</h2>
            <p>
              Jal Drishti integrates data from authorized institutional sources. Information regarding portal usage is not shared with third-party commercial entities for marketing purposes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
