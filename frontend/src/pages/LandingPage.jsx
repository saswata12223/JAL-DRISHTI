import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LandingHeader from '../components/landing/LandingHeader';
import JalDrishti3DViewer from '../components/landing/JalDrishti3DViewer';
import AuthPlaceholderModal from '../components/landing/AuthPlaceholderModal';

const TERRAIN_SOURCES = [
  { icon: 'terrain', label: 'SRTM Elevation DEM (30m)', detail: 'Digital terrain elevation model governing slope and watershed runoff routing.' },
  { icon: 'landscape', label: 'Riparian Terrain Slope', detail: 'Slope gradient derived from DEM to compute SCS-CN peak discharge.' },
  { icon: 'layers', label: 'ESA WorldCover Grid', detail: 'High-resolution land-cover classes determining curve-number (CN) infiltration.' },
  { icon: 'water_drop', label: 'GPM / IMD Rainfall Telemetry', detail: 'Real-time satellite precipitation and rain-gauge drivers for ML forecasting.' },
  { icon: 'sensors', label: 'SMAP Soil Moisture Index', detail: 'Surface and root-zone moisture metrics dictating antecedent soil saturation.' },
  { icon: 'straighten', label: 'CWC Gauge Thresholds', detail: 'Official Central Water Commission river stage levels (Warning / Danger / HFL).' },
];

// Deep Multi-Layered Cinematic Animated Atmospheric Himalayan Landscape Environment
const HimalayanAtmosphericEnvironment = () => {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-10">
      <svg
        className="w-full h-full text-[#0F4C81]"
        viewBox="0 0 1600 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Readability Vignette Mask for Left/Center Hero Text */}
          <radialGradient id="heroTextReadability" cx="22%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.97" />
            <stop offset="35%" stopColor="#F8FAFC" stopOpacity="0.88" />
            <stop offset="65%" stopColor="#F8FAFC" stopOpacity="0.45" />
            <stop offset="90%" stopColor="#F8FAFC" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
          </radialGradient>

          {/* Sky Haze & Atmospheric Sun Glow */}
          <linearGradient id="himalayanSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2F1F8" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#8FD3E8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="sunGlow" cx="75%" cy="20%" r="35%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#8FD3E8" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#0F4C81" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
          </radialGradient>

          {/* Distant Snow Peaks Shading */}
          <linearGradient id="snowPeakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#CBE6F2" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#0F4C81" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id="snowShadowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F4C81" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0F4C81" stopOpacity="0.06" />
          </linearGradient>

          {/* Midground Ridges */}
          <linearGradient id="midRidgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1B5E91" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#0F4C81" stopOpacity="0.14" />
          </linearGradient>

          {/* Forested Valley Slope Shading */}
          <linearGradient id="forestSlopeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B3B66" stopOpacity="0.78" />
            <stop offset="100%" stopColor="#0F4C81" stopOpacity="0.22" />
          </linearGradient>

          {/* Winding River Flow Gradient */}
          <linearGradient id="riverFlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8FD3E8" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.88" />
            <stop offset="85%" stopColor="#0F4C81" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0B3B66" stopOpacity="0.98" />
          </linearGradient>

          {/* Valley Mist Overlay */}
          <linearGradient id="valleyMistGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8FD3E8" stopOpacity="0.32" />
            <stop offset="50%" stopColor="#F8FAFC" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* LAYER 1: SKY & SUN ATMOSPHERE */}
        <rect width="1600" height="900" fill="url(#himalayanSkyGrad)" />
        <circle cx="1180" cy="180" r="240" fill="url(#sunGlow)" />

        {/* LAYER 2: DISTANT SNOW-CAPPED HIMALAYAN PEAKS */}
        <g id="distant-snow-peaks">
          <polygon points="150,550 320,260 420,380 580,210 720,420 860,180 1020,390 1200,240 1380,480 1650,220 1750,600 -100,600" fill="url(#snowPeakGrad)" />
          <polygon points="320,260 420,380 580,210 720,420 860,180 1020,390 1200,240 1380,480 1650,220 1750,600 1200,600" fill="url(#snowShadowGrad)" />
          <path d="M -50 580 L 150 550 L 320 260 L 420 380 L 580 210 L 720 420 L 860 180 L 1020 390 L 1200 240 L 1380 480 L 1650 220 L 1750 600" stroke="#0F4C81" strokeWidth="1.5" strokeOpacity="0.3" fill="none" />
        </g>

        {/* LAYER 3: ATMOSPHERIC DRIFTING CLOUDS & HIGH MOUNTAIN MIST */}
        <g id="cloud-mist-layer">
          <motion.path
            d="M -100 220 C 150 140, 450 280, 750 180 C 1050 80, 1350 240, 1700 140 L 1700 30 L -100 30 Z"
            fill="url(#valleyMistGrad)"
            animate={{ x: [-30, 30, -30] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />

          <motion.path
            d="M 500 160 C 620 120, 780 130, 880 170 C 980 210, 1120 170, 1240 120 C 1360 170, 1240 230, 1080 220 C 920 230, 700 210, 500 160 Z"
            fill="#FFFFFF"
            fillOpacity="0.35"
            animate={{ x: [-40, 40, -40] }}
            transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>

        {/* LAYER 4: MIDGROUND HIMALAYAN RIDGES & VALLEY SHADING */}
        <g id="midground-mountain-ridges">
          <path
            d="M -100 720 C 150 580, 350 380, 580 400 C 760 410, 880 290, 1080 320 C 1280 350, 1420 500, 1720 420 L 1720 900 L -100 900 Z"
            fill="url(#midRidgeGrad)"
            stroke="#0F4C81"
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        </g>

        {/* LAYER 5: FOREGROUND FORESTED MOUNTAIN SLOPES (PINE / SPRUCE SILHOUETTES) */}
        <g id="forested-slopes">
          <path
            d="M -100 850 C 100 750, 250 550, 480 580 C 650 600, 780 480, 950 540 L 950 900 L -100 900 Z"
            fill="url(#forestSlopeGrad)"
            stroke="#0B3B66"
            strokeWidth="2.5"
            strokeOpacity="0.6"
          />

          <path
            d="M 850 580 C 1050 500, 1250 620, 1450 680 C 1580 720, 1680 810, 1750 850 L 1750 900 L 850 900 Z"
            fill="url(#forestSlopeGrad)"
            stroke="#0B3B66"
            strokeWidth="2.5"
            strokeOpacity="0.6"
          />

          <g fill="#0B3B66" fillOpacity="0.75">
            <path d="M 220 620 L 226 600 L 232 620 L 229 620 L 234 635 L 230 635 L 237 650 L 225 650 L 225 658 L 223 658 L 223 650 L 211 650 L 218 635 L 214 635 L 219 620 Z" />
            <path d="M 245 605 L 251 585 L 257 605 L 254 605 L 259 620 L 255 620 L 262 635 L 250 635 L 250 644 L 248 644 L 248 635 L 236 635 L 243 620 L 239 620 L 244 605 Z" />
            <path d="M 270 590 L 276 570 L 282 590 L 279 590 L 284 605 L 280 605 L 287 620 L 275 620 L 275 630 L 273 630 L 273 620 L 261 620 L 268 605 L 264 605 L 269 590 Z" />
            <path d="M 330 580 L 336 560 L 342 580 L 339 580 L 344 595 L 340 595 L 347 610 L 335 610 L 335 618 L 333 618 L 333 610 L 321 610 L 328 595 L 324 595 L 329 580 Z" />
            <path d="M 410 575 L 416 555 L 422 575 L 419 575 L 424 590 L 420 590 L 427 605 L 415 605 L 415 614 L 413 614 L 413 605 L 401 605 L 408 590 L 404 590 L 409 575 Z" />
            <path d="M 1080 515 L 1086 495 L 1092 515 L 1089 515 L 1094 530 L 1090 530 L 1097 545 L 1085 545 L 1085 553 L 1083 553 L 1083 545 L 1071 545 L 1078 530 L 1074 530 L 1079 515 Z" />
            <path d="M 1120 510 L 1126 490 L 1132 510 L 1129 510 L 1134 525 L 1130 525 L 1137 540 L 1125 540 L 1125 549 L 1123 549 L 1123 540 L 1111 540 L 1118 525 L 1114 525 L 1119 510 Z" />
            <path d="M 1210 540 L 1216 520 L 1222 540 L 1219 540 L 1224 555 L 1220 555 L 1227 570 L 1215 570 L 1215 579 L 1213 579 L 1213 570 L 1201 570 L 1208 555 L 1204 555 L 1209 540 Z" />
            <path d="M 1320 590 L 1326 570 L 1332 590 L 1329 590 L 1334 605 L 1330 605 L 1337 620 L 1325 620 L 1325 629 L 1323 629 L 1323 620 L 1311 620 L 1318 605 L 1314 605 L 1319 590 Z" />
          </g>
        </g>

        {/* LAYER 6: ELEGANT WINDING AQUA BLUE HIMALAYAN RIVER */}
        <g id="himalayan-river-system">
          <motion.path
            d="M 580 400 Q 630 460, 710 510 Q 780 560, 840 600"
            stroke="#8FD3E8"
            strokeWidth="3.5"
            strokeOpacity="0.85"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3 }}
          />

          <motion.path
            d="M 1080 320 Q 980 440, 910 520 Q 860 570, 840 600"
            stroke="#8FD3E8"
            strokeWidth="4"
            strokeOpacity="0.9"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.45 }}
          />

          <motion.path
            d="M 840 600 C 910 650, 990 680, 1080 720 C 1200 770, 1360 800, 1680 840"
            stroke="url(#riverFlowGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, delay: 0.6 }}
          />

          <motion.path
            d="M 840 600 C 910 650, 990 680, 1080 720 C 1200 770, 1360 800, 1680 840"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeOpacity="0.6"
            strokeDasharray="12 18"
            fill="none"
            animate={{ strokeDashoffset: [0, -60] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
        </g>

        {/* LAYER 7: DELICATE ATMOSPHERIC RAIN & WATER DROPLETS */}
        <g id="atmospheric-rain-layer">
          {[120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200, 1320, 1440, 1560].map((x, i) => (
            <motion.line
              key={`delicate-rain-${i}`}
              x1={x}
              y1={40 + (i % 6) * 20}
              x2={x - 18}
              y2={150 + (i % 6) * 20}
              stroke="#8FD3E8"
              strokeWidth={i % 2 === 0 ? "1.4" : "0.8"}
              strokeOpacity="0.35"
              strokeDasharray="4 9"
              animate={{ opacity: [0.15, 0.5, 0.15], y: [0, 20, 0] }}
              transition={{ duration: 3.5 + (i % 4), repeat: Infinity, ease: "easeInOut" }}
            />
          ))}

          {[280, 520, 760, 1000, 1240, 1480].map((cx, i) => (
            <motion.circle
              key={`mist-drop-${i}`}
              cx={cx}
              cy={110 + (i % 3) * 30}
              r={1.8}
              fill="#8FD3E8"
              fillOpacity="0.5"
              animate={{ y: [0, 30, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 3.2 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </g>

        {/* LAYER 8: READABILITY MASK OVERLAY FOR HERO TEXT (100% LEGIBILITY GUARANTEE) */}
        <rect width="1600" height="900" fill="url(#heroTextReadability)" pointerEvents="none" />
      </svg>
    </div>
  );
};

// Motion Primitives Stagger Animation Variants
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

export default function LandingPage() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [simulationState, setSimulationState] = useState('NORMAL');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#8FD3E8] selection:text-[#0F4C81] scroll-smooth">
      {/* SECTION 1: FULL-BLEED IMMERSIVE HIMALAYAN HERO WITH OVERLAY HEADER */}
      <section id="home" className="w-full min-h-screen bg-[#F8FAFC] border-b border-[#E2E8F0] relative overflow-hidden flex flex-col justify-between">
        {/* OVERLAY TRANSPARENT HEADER (POSITIONED ON TOP OF LANDSCAPE BACKGROUND) */}
        <LandingHeader onOpenAuth={handleOpenAuth} />

        {/* FULL-VIEWPORT ATMOSPHERIC HIMALAYAN LANDSCAPE ENVIRONMENT */}
        <HimalayanAtmosphericEnvironment />

        {/* HERO CONTENT CONTAINER */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 pt-36 sm:pt-44 lg:pt-48 pb-20 sm:pb-28 flex-1 flex flex-col justify-center">
          <motion.div
            className="max-w-3xl flex flex-col items-start text-left"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Main Brand Title */}
            <motion.h1
              variants={fadeUpItem}
              className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#0F4C81] uppercase leading-none font-sans"
            >
              JAL DRISHTI
            </motion.h1>

            {/* Subtitle Label */}
            <motion.p
              variants={fadeUpItem}
              className="text-sm sm:text-base font-bold tracking-[0.25em] text-[#0F4C81]/90 uppercase mt-4 sm:mt-5"
            >
              UTTARAKHAND FLOOD INTELLIGENCE
            </motion.p>

            {/* Main Action Headline */}
            <motion.h2
              variants={fadeUpItem}
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] mt-6 sm:mt-8 tracking-tight leading-tight"
            >
              Predict. Prepare. Protect.
            </motion.h2>

            {/* Description */}
            <motion.p
              variants={fadeUpItem}
              className="text-base sm:text-xl font-normal text-[#334155] mt-5 sm:mt-6 leading-relaxed max-w-2xl"
            >
              State-wide early-warning &amp; hydrologic digital twin platform for the Himalayan terrain of Uttarakhand. Supporting disaster preparedness and early risk decision workflows across all 13 districts.
            </motion.p>

            {/* Primary Action Buttons */}
            <motion.div
              variants={fadeUpItem}
              className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-5"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 rounded-xl bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-bold text-sm sm:text-base uppercase tracking-wider transition-all flex items-center gap-3 shadow-lg hover:shadow-xl cursor-pointer"
              >
                <span>EXPLORE DASHBOARD</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('simulation')}
                className="px-8 py-4 rounded-xl bg-white/85 hover:bg-white border border-[#0F4C81]/30 text-[#0F4C81] font-bold text-sm sm:text-base uppercase tracking-wider transition-all flex items-center gap-3 shadow-sm backdrop-blur-xs cursor-pointer"
              >
                <span>VIEW FLOOD SIMULATION</span>
                <span className="material-symbols-outlined text-lg">3d_rotation</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: 3D FLOOD DIGITAL TWIN / SIMULATION (STRICTLY UNTOUCHED THREE.JS / R3F IMPLEMENTATION) */}
      <section id="simulation" className="w-full bg-white py-16 sm:py-20 px-4 sm:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Section Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="w-12 h-1 bg-[#0F4C81] mb-3 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F4C81] uppercase tracking-tight font-sans">
              3D FLOOD DIGITAL TWIN
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#64748B] mt-1">
              Explore Himalayan catchment terrain, river channels, and hydrodynamic inundation states.
            </p>
          </div>

          {/* REAL 3D GLB MODEL VIEWER (STRICTLY UNTOUCHED THREE.JS / R3F IMPLEMENTATION) */}
          <div className="w-full h-[500px] sm:h-[540px] rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-[#F8FAFC]">
            <JalDrishti3DViewer
              simulationState={simulationState}
              onStateChange={setSimulationState}
            />
          </div>

          {/* Simulation Link */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/flood-simulation')}
              className="px-6 py-3 rounded-lg bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>EXPLORE FULL SIMULATION ENVIRONMENT →</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: ABOUT & TERRAIN */}
      <section id="about-terrain" className="w-full bg-[#F8FAFC] py-16 sm:py-20 px-4 sm:px-8 border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="w-12 h-1 bg-[#0F4C81] mb-3 rounded-full" />
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F4C81] uppercase tracking-tight font-sans">
              ABOUT &amp; TERRAIN INTELLIGENCE
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-[#64748B] mt-1">
              Uttarakhand flood intelligence platform architecture &amp; physical forcing signals.
            </p>
          </div>

          {/* Two-Column Structured Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: About Jal Drishti & Model Pipeline */}
            <div className="flex flex-col gap-8">
              {/* About Jal Drishti Block */}
              <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0F4C81] p-6 rounded-lg shadow-xs flex flex-col gap-3">
                <h3 className="text-base font-bold text-[#0F4C81] uppercase tracking-tight">
                  About Jal Drishti Platform
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-normal">
                  Jal Drishti is an operational flash-flood early-warning and decision-support platform engineered specifically for the steep Himalayan state of Uttarakhand. It fuses satellite precipitation and soil-moisture telemetry with an upgraded Phase 6 machine-learning champion model, SCS-CN hydrological physics, and official Central Water Commission (CWC) river-gauge thresholds within a deterministic, auditable Policy v8.1.0 decision engine.
                </p>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed font-normal">
                  The platform exposes live risk decisions, monitoring telemetry, predictive analytics, and on-demand model evaluation across all 13 districts, supporting governance workflows shared between the Central Water Commission (CWC) and the Uttarakhand State Disaster Management Authority (USDMA).
                </p>
              </div>

              {/* Model Pipeline Specifications */}
              <div className="bg-white border border-[#E2E8F0] p-6 rounded-lg shadow-xs flex flex-col gap-4">
                <h4 className="text-xs font-bold text-[#0F4C81] uppercase tracking-wider font-mono border-b border-[#E2E8F0] pb-2">
                  MODEL PIPELINE SPECIFICATIONS
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Champion Model</span>
                    <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">XGBoost_PPT_Upgraded</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Model Version</span>
                    <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">6.1.0</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Decision Policy</span>
                    <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">v8.1.0</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                    <span className="text-[10px] font-extrabold text-[#64748B] uppercase block">Decision Threshold</span>
                    <span className="font-mono font-bold text-[#0F172A] mt-0.5 block">0.40</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Physical Forcing Signals & Data Sources */}
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-bold text-[#0F4C81] uppercase tracking-tight mb-1">
                Terrain &amp; Data Inputs
              </h3>
              <div className="flex flex-col gap-3">
                {TERRAIN_SOURCES.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-3.5 bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-xs hover:border-[#0F4C81]/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#0F4C81]/10 border border-[#0F4C81]/20 flex items-center justify-center shrink-0 text-[#0F4C81]">
                      <span className="material-symbols-outlined text-xl">{s.icon}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0F4C81] block">{s.label}</span>
                      <span className="text-[11.5px] text-[#334155] font-normal leading-relaxed">{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-6 px-6 sm:px-8 bg-[#0F4C81] text-white border-t border-[#0B3B66] flex flex-wrap items-center justify-between gap-4 text-xs select-none">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-wide">JAL DRISHTI © 2026</span>
          <span className="text-[#8FD3E8]">•</span>
          <span className="text-white/90">Uttarakhand State Disaster Management Authority &amp; CWC</span>
        </div>
        <div className="flex items-center gap-4 text-[#8FD3E8] font-mono text-[11px]">
          <span>SRTM DEM 30m</span>
          <span>•</span>
          <span>GPM &amp; SMAP Telemetry</span>
          <span>•</span>
          <span>XGBoost v6.1.0</span>
        </div>
      </footer>

      {/* AUTH PLACEHOLDER MODAL */}
      <AuthPlaceholderModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
