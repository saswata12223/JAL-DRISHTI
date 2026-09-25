import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PlatformPreviewSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-[#F8FAFC] py-24 border-b border-[#E2E8F0] overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Text Content */}
          <div className="lg:w-1/3 flex flex-col items-start">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#64748B] uppercase mb-4">The Platform</span>
            <h2 className="text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tight leading-tight mb-6">
              One Platform. Multiple Decisions.
            </h2>
            <p className="text-sm lg:text-[15px] text-[#475569] leading-relaxed mb-8 font-medium">
              Access real-time data, forecasts, simulations, alerts and analytics — all in one place.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 rounded bg-[#0F4C81] hover:bg-[#0b3861] text-white font-bold text-sm tracking-wide transition-colors flex items-center gap-2 shadow-lg"
            >
              Explore Jal Drishti <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Video Preview */}
          <div className="lg:w-2/3 w-full relative">
            <div className="w-full max-w-[800px] mx-auto aspect-[16/10] bg-white rounded-xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col relative transform lg:rotate-[-2deg] transition-transform hover:rotate-0 duration-500">
              <div className="w-full h-full bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <img
                  src="/assets/images/frame.png"
                  alt="Platform Interface Preview"
                  className="w-full h-full object-contain rounded-lg select-none pointer-events-none drop-shadow-md"
                />
              </div>
            </div>

            {/* Slogan Note */}
            <div className="absolute -right-4 -bottom-6 hidden lg:block">
              <div className="bg-white/80 backdrop-blur-md px-4 py-3 border border-[#E2E8F0] shadow-xl rounded-lg flex flex-col items-start transform rotate-2">
                <span className="text-[#0F4C81] font-bold text-xs">Real Data.</span>
                <span className="text-[#0F4C81] font-bold text-xs">Real Decisions.</span>
                <span className="text-[#0F4C81] font-bold text-xs">Safer Communities.</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
