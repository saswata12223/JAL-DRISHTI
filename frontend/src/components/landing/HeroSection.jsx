import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LocationSearch from '../common/LocationSearch';
import { useLocation } from '../../context/LocationContext';

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const rise = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// Capability indicator pills
const PLATFORM_CAPS = [
  { label: 'Pan-India GIS', status: 'active', icon: 'map' },
  { label: 'SOI Boundaries', status: 'active', icon: 'layers' },
  { label: 'Historical ML · Uttarakhand', status: 'limited', icon: 'psychology' },
  { label: 'Live Weather · Partial', status: 'partial', icon: 'cloud' },
  { label: 'Live Inference · Blocked', status: 'blocked', icon: 'block' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { selectedState, selectState } = useLocation();
  const [searchUsed, setSearchUsed] = useState(false);

  const statusStyle = {
    active: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
    limited: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
    partial: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400',
    blocked: 'bg-slate-500/15 border-slate-500/25 text-slate-400',
  };

  return (
    <section
      id="home"
      className="relative w-full min-h-[100dvh] flex flex-col justify-center overflow-hidden bg-[#060E1A]"
    >
      {/* Hero background image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0 opacity-50"
        style={{ backgroundImage: `url('/assets/images/himalayan_hero_bg.jpg')` }}
      />
      {/* Gradient overlay — left-heavy for readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#060E1A]/95 via-[#060E1A]/70 to-[#060E1A]/20" />
      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-10 bg-gradient-to-t from-[#060E1A] to-transparent" />

      {/* Main content */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-20">
        <motion.div
          className="max-w-3xl flex flex-col items-start text-left gap-6"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow */}
          <motion.div variants={rise} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-[0.2em]">
                USDMA · National Disaster Intelligence
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={rise}
            className="text-5xl sm:text-6xl lg:text-[72px] font-black text-white uppercase leading-[0.92] tracking-tighter"
          >
            JAL <span className="text-cyan-400">DRISHTI</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={rise}
            className="text-xl sm:text-2xl font-semibold text-white/80 tracking-tight leading-snug max-w-lg"
          >
            Pan-India Environmental &amp; Disaster Intelligence Platform
          </motion.p>

          {/* Description */}
          <motion.p
            variants={rise}
            className="text-[15px] text-white/60 leading-relaxed max-w-lg"
          >
            Browse administrative geography across all Indian states and union territories.
            Access environmental monitoring, historical risk intelligence, and available
            live data — with honest transparency about what is and is not available for each region.
          </motion.p>

          {/* Search */}
          <motion.div variants={rise} className="w-full max-w-lg">
            <LocationSearch className="w-full" />
            <p className="text-[10.5px] text-white/35 mt-2 pl-1">
              Search any Indian state, district, or city to explore available capabilities
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div variants={rise} className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="group flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-[13px] uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">explore</span>
              Explore India
              <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white font-bold text-[13px] uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-300 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Portal Login
            </button>
          </motion.div>
        </motion.div>

        {/* Capability pills — bottom of hero */}
        <motion.div
          className="mt-14 flex flex-wrap gap-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {PLATFORM_CAPS.map(cap => (
            <div
              key={cap.label}
              className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-[10.5px] font-semibold ${statusStyle[cap.status]}`}
            >
              <span className="material-symbols-outlined text-[12px]">{cap.icon}</span>
              {cap.label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1"
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Scroll</span>
      </motion.div>
    </section>
  );
}
