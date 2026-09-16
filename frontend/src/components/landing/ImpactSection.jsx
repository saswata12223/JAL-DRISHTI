import React from 'react';

export default function ImpactSection() {
  return (
    <section className="w-full bg-white py-24 border-b border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#64748B] uppercase mb-4">Our Impact</span>
            <h2 className="text-4xl lg:text-[42px] font-black text-[#0F172A] tracking-tight leading-tight">
              From Information to Action
            </h2>
          </div>
          <div className="md:max-w-md">
            <p className="text-sm lg:text-[15px] text-[#475569] leading-relaxed font-medium">
              Jal Drishti provides accurate, timely and actionable information to support disaster preparedness and safer communities.
            </p>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          {/* Monitor */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#0F4C81]/10 flex items-center justify-center shrink-0 text-[#0F4C81]">
              <span className="material-symbols-outlined text-[28px]">monitor_heart</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">Monitor</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Real-time environmental and hydrological conditions.
              </p>
            </div>
          </div>

          {/* Forecast */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0 text-[#10B981]">
              <span className="material-symbols-outlined text-[28px]">insights</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">Forecast</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Identify changing risk conditions across regions.
              </p>
            </div>
          </div>

          {/* Respond */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0 text-[#F59E0B]">
              <span className="material-symbols-outlined text-[28px]">shield</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-[#0F172A] mb-2">Respond</h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Support timely warnings and informed decision-making.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
