import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TerrainSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-white py-24 border-b border-[#E2E8F0]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          
          {/* Text Content */}
          <div className="lg:w-1/3 flex flex-col items-start pt-4">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#64748B] uppercase mb-4">Himalayan Terrain</span>
            <h2 className="text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight leading-tight mb-6">
              Understand the Terrain
            </h2>
            <p className="text-sm lg:text-[15px] text-[#475569] leading-relaxed mb-8 font-medium">
              Uttarakhand's diverse and mountainous terrain creates complex hydrological conditions. Jal Drishti integrates terrain, rainfall, river flow and environmental data to help understand how flood risks can evolve across vulnerable areas.
            </p>
            <button
              onClick={() => navigate('/about-terrain')}
              className="px-6 py-2.5 rounded border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] font-bold text-sm tracking-wide transition-colors flex items-center gap-2"
            >
              Learn More <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Cards */}
          <div className="lg:w-2/3 w-full">
            {/* Real Terrain Card */}
            <div className="relative group overflow-hidden rounded-2xl aspect-video cursor-pointer">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: "url('/images/himalayan_valley_normal.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 flex flex-col">
                <span className="text-white font-bold text-lg">Real Terrain</span>
                <span className="text-white/80 text-[13px] font-medium">Rivers, valleys and vulnerable regions</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
