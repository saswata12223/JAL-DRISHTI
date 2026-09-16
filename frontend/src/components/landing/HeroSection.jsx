import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
  },
};

export default function HeroSection() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative w-full h-[100vh] min-h-[600px] flex flex-col justify-center bg-[#0F172A] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: `url('/assets/images/himalayan_hero_bg.png')` }}
      />

      {/* Dark overlay membrane to enhance text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/60 via-[#0F172A]/50 to-transparent z-10" />

      {/* Content Container */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-24 sm:pt-32">
        <motion.div
          className="max-w-2xl flex flex-col items-start text-left"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Subtitle */}
          <motion.p
            variants={fadeUpItem}
            className="text-xs sm:text-[13px] font-bold tracking-[0.25em] text-white/80 uppercase mb-4"
          >
            UTTARAKHAND FLOOD INTELLIGENCE
          </motion.p>

          {/* Main Title */}
          <motion.h1
            variants={fadeUpItem}
            className="text-5xl sm:text-6xl lg:text-[72px] font-black text-white uppercase leading-[0.9] tracking-tighter mb-8"
          >
            JAL <span className="text-[#8FD3E8]">DRISHTI</span>
          </motion.h1>

          {/* Slogans */}
          <motion.div variants={fadeUpItem} className="flex flex-col gap-1 mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-tight">
              Know the risk.
            </h2>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-tight">
              Prepare early.
            </h2>
            <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#8FD3E8] tracking-tight leading-tight">
              Protect communities.
            </h2>
          </motion.div>

          {/* Description */}
          <motion.p
            variants={fadeUpItem}
            className="text-base sm:text-[17px] font-medium text-white/90 leading-relaxed max-w-[540px] mb-10"
          >
            Real-time risk intelligence, forecasting and simulation to support disaster preparedness across the Himalayan terrain of Uttarakhand.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUpItem}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3.5 rounded bg-[#0F4C81] hover:bg-[#0b3861] text-white font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              Explore Live Risk <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              onClick={() => scrollToSection('simulation')}
              className="px-6 py-3.5 rounded bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold text-sm uppercase tracking-wide transition-all flex items-center gap-2"
            >
              View Flood Simulation <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
