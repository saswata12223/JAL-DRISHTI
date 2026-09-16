import React from 'react';

export default function AccessibilityPage() {
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
        <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Accessibility</h1>
        
        <div className="space-y-8 text-[15px] leading-relaxed text-slate-300">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">1. Commitment to Accessibility</h2>
            <p>
              The Jal Drishti portal is designed with accessibility in mind, ensuring that critical flood risk intelligence is usable by as broad an audience as possible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white border-b border-white/10 pb-2">2. Accessibility Features</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Readable Typography:</strong> Content utilizes clean, highly readable font families with appropriate line heights.</li>
              <li><strong>Responsive Layout:</strong> The portal dynamically adjusts to function seamlessly across mobile devices, tablets, and desktop displays.</li>
              <li><strong>Visual Contrast:</strong> High-contrast color palettes are used to distinguish critical information and alert statuses clearly.</li>
              <li><strong>Keyboard Navigation:</strong> Core interactive elements and navigation menus can be accessed via standard keyboard controls.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
