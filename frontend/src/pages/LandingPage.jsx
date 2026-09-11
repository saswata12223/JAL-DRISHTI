import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingHeader from '../components/landing/LandingHeader';
import EmergencyAlertStrip from '../components/landing/EmergencyAlertStrip';
import JalDrishti3DViewer from '../components/landing/JalDrishti3DViewer';
import AuthPlaceholderModal from '../components/landing/AuthPlaceholderModal';

const TERRAIN_SOURCES = [
  { icon: 'terrain', label: 'SRTM Elevation DEM', detail: 'Digital terrain elevation model used for slope and runoff routing.' },
  { icon: 'landscape', label: 'Terrain Slope', detail: 'Riparian slope derived from DEM to compute SCS-CN peak runoff.' },
  { icon: 'layers', label: 'ESA WorldCover', detail: 'Land-cover classes governing curve-number (CN) infiltration.' },
  { icon: 'water', label: 'GPM / IMD Rainfall', detail: 'Satellite and gauge rainfall drivers for the Phase 6 model.' },
  { icon: 'spatial_tracking', label: 'SMAP Soil Moisture', detail: 'Surface and profile moisture governing saturation state.' },
  { icon: 'straighten', label: 'CWC Gauge Thresholds', detail: 'Official river stage thresholds (Warning / Danger / HFL).' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [simulationState, setSimulationState] = useState('NORMAL');

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#152C31] flex flex-col font-sans selection:bg-[#A5F1F7] selection:text-[#152C31] scroll-smooth">
      {/* HEADER */}
      <LandingHeader onOpenAuth={handleOpenAuth} />

      {/* SECTION 1: HERO / INTRODUCTION */}
      <section id="home" className="w-full bg-white py-16 sm:py-24 px-4 sm:px-8 border-b border-[#152C31]/10 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Solid Color Accent Block */}
          <div className="w-16 h-2 bg-[#A5F1F7] mb-6 rounded-xs" />

          {/* Centered Large Typography */}
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#152C31] uppercase font-sans">
            JAL DRISTI
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#647A7F] uppercase mt-3">
            UTTARAKHAND FLOOD INTELLIGENCE
          </p>

          {/* Tagline */}
          <p className="text-lg sm:text-2xl font-semibold text-[#152C31] mt-6 max-w-xl">
            Predict. Prepare. Protect.
          </p>

          <p className="text-xs sm:text-sm text-[#647A7F] font-medium mt-3 max-w-lg leading-relaxed">
            State-wide early-warning &amp; hydrologic digital twin platform for the Himalayan terrain of Uttarakhand.
          </p>

          {/* Scroll Indicator */}
          <div className="mt-14 flex flex-col items-center gap-1.5 text-[#647A7F] text-xs font-semibold uppercase tracking-wider">
            <span>SCROLL TO EXPLORE</span>
            <span className="material-symbols-outlined text-lg opacity-80">keyboard_arrow_down</span>
          </div>
        </div>
      </section>

      {/* EMERGENCY ALERT STRIP */}
      <EmergencyAlertStrip />

      {/* SECTION 2: 3D FLOOD DIGITAL TWIN / SIMULATION */}
      <section id="simulation" className="w-full bg-[#F7FCFD] py-16 sm:py-20 px-4 sm:px-8 border-b border-[#152C31]/10">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Section Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="w-12 h-1 bg-[#A5F1F7] mb-3" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#152C31] uppercase tracking-tight font-sans">
              3D FLOOD DIGITAL TWIN
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#647A7F] mt-1">
              Explore the Himalayan terrain and flood evolution.
            </p>
          </div>

          {/* Real 3D GLB Model Viewer */}
          <div className="w-full h-[500px] sm:h-[540px]">
            <JalDrishti3DViewer
              simulationState={simulationState}
              onStateChange={setSimulationState}
            />
          </div>

          {/* Simulation Link */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/flood-simulation')}
              className="px-6 py-2.5 rounded bg-[#A5F1F7] hover:bg-[#8BE5EC] border border-[#A5F1F7] text-[#152C31] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>EXPLORE FULL SIMULATION →</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: ABOUT & TERRAIN */}
      <section id="about-terrain" className="w-full bg-white py-16 sm:py-20 px-4 sm:px-8 border-b border-[#152C31]/10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="w-12 h-1 bg-[#A5F1F7] mb-3" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#152C31] uppercase tracking-tight font-sans">
              ABOUT &amp; TERRAIN
            </h2>
            <p className="text-xs sm:text-sm font-medium text-[#647A7F] mt-1">
              Uttarakhand flood intelligence platform &amp; physical forcing signals.
            </p>
          </div>

          {/* Editorial Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Left Column: About Jal Drishti & Model Pipeline */}
            <div className="flex flex-col gap-8">
              {/* About Jal Drishti Block */}
              <div className="border-l-4 border-[#A5F1F7] pl-5 flex flex-col gap-3">
                <h3 className="text-lg font-bold text-[#152C31] uppercase tracking-tight">
                  About Jal Drishti
                </h3>
                <p className="text-xs sm:text-sm text-[#647A7F] leading-relaxed font-medium">
                  Jal Drishti is an operational flash-flood early-warning and decision-support platform for the Himalayan state of Uttarakhand. It fuses satellite precipitation and soil-moisture telemetry with an upgraded Phase 6 machine-learning champion model, SCS-CN hydrological physics, and official Central Water Commission (CWC) river-gauge thresholds within a deterministic, auditable Policy v8.1.0 decision engine.
                </p>
                <p className="text-xs sm:text-sm text-[#647A7F] leading-relaxed font-medium">
                  The platform exposes live risk decisions, monitoring telemetry, predictive analytics, and on-demand model evaluation across all 13 districts, with governance authority shared between the Central Water Commission (CWC) and the Uttarakhand State Disaster Management Authority (USDMA).
                </p>
              </div>

              {/* Model Pipeline Summary Block */}
              <div className="bg-[#F7FCFD] border border-[#152C31]/10 p-5 rounded-md flex flex-col gap-3">
                <h4 className="text-xs font-bold text-[#152C31] uppercase tracking-wider font-mono">
                  MODEL PIPELINE SPECIFICATIONS
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-[#647A7F] uppercase block">Champion Model</span>
                    <span className="font-mono font-bold text-[#152C31]">XGBoost_PPT_Upgraded</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#647A7F] uppercase block">Model Version</span>
                    <span className="font-mono font-bold text-[#152C31]">6.1.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#647A7F] uppercase block">Decision Policy</span>
                    <span className="font-mono font-bold text-[#152C31]">v8.1.0</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#647A7F] uppercase block">Decision Threshold</span>
                    <span className="font-mono font-bold text-[#152C31]">0.40</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Physical Forcing Signals & Data Sources */}
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#152C31] uppercase tracking-tight mb-2">
                Terrain &amp; Data Inputs
              </h3>
              <div className="flex flex-col gap-2.5">
                {TERRAIN_SOURCES.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-start gap-3 bg-[#F7FCFD] border border-[#152C31]/10 p-3 rounded-md"
                  >
                    <div className="w-8 h-8 rounded bg-[#A5F1F7] flex items-center justify-center shrink-0 text-[#152C31]">
                      <span className="material-symbols-outlined text-lg">{s.icon}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#152C31] block">{s.label}</span>
                      <span className="text-[11.5px] text-[#647A7F] font-medium leading-snug">{s.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-5 px-6 sm:px-8 bg-[#F7FCFD] border-t border-[#152C31]/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#647A7F] font-mono select-none">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#152C31]">JAL DRISTI © 2026</span>
          <span>•</span>
          <span>Uttarakhand State Disaster Management Authority &amp; CWC</span>
        </div>
        <div className="flex items-center gap-4 text-[#152C31] font-semibold">
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
