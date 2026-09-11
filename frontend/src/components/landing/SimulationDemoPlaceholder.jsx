import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { animate } from 'animejs';

export default function SimulationDemoPlaceholder() {
  const navigate = useNavigate();
  const [hydroGrid, setHydroGrid] = useState(true);
  const [rainSim, setRainSim] = useState(true);
  const [rotation, setRotation] = useState(12);
  const [selectedPoint, setSelectedPoint] = useState('Rishikesh Gauge');
  const riverRef = useRef(null);

  // Animate river flow dashoffset with anime.js
  useEffect(() => {
    if (!riverRef.current) return;
    try {
      animate(riverRef.current, {
        strokeDashoffset: [100, 0],
        duration: 4000,
        easing: 'linear',
        loop: true,
      });
    } catch (e) {
      console.warn('River animation notice:', e);
    }
  }, []);

  const STATIONS = [
    { name: 'Joshimath Headwaters', elev: '1,875m', stage: 'NORMAL (1.8m)', risk: 'LOW', x: 75, y: 22 },
    { name: 'Devprayag Confluence', elev: '472m', stage: 'WARNING (3.9m)', risk: 'HIGH', x: 48, y: 45 },
    { name: 'Rishikesh Gauge', elev: '340m', stage: 'ELEVATED (2.8m)', risk: 'MODERATE', x: 25, y: 72 },
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[540px] rounded-2xl border border-[#A5F1F7]/40 bg-[#F7FCFD] shadow-[0_10px_35px_rgba(16,42,46,0.06)] overflow-hidden flex flex-col select-none group font-sans">
      {/* Background Perspective Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none transition-transform duration-500"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(165, 241, 247, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          transform: `perspective(600px) rotateX(${rotation}deg)`,
        }}
      />

      {/* TOP CONTROLS & DEMO BADGE BAR */}
      <div className="relative z-20 px-4 py-3 bg-white/90 border-b border-[#A5F1F7]/35 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EAF8FA] border border-[#A5F1F7] text-[#102A2E] font-mono text-[10.5px] font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#102A2E] animate-pulse" />
            <span>DEMO SIMULATION</span>
          </div>

          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-[#102A2E] tracking-tight">
              JAL DRISTI DIGITAL TWIN
            </span>
            <span className="text-[10px] font-semibold text-[#6B858A] font-mono">
              Himalayan Basin Hydro-Terrain Engine • 30.3165° N, 78.0322° E
            </span>
          </div>
        </div>

        {/* Quick View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHydroGrid(!hydroGrid)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              hydroGrid
                ? 'bg-gradient-to-r from-[#A5F1F7] to-[#E8FBFC] border-[#A5F1F7] text-[#102A2E] shadow-xs'
                : 'bg-white border-[#A5F1F7]/35 text-[#6B858A] hover:text-[#102A2E]'
            }`}
            title="Toggle Hydrologic Surface Grid"
          >
            <span className="material-symbols-outlined text-sm">grid_4x4</span>
            <span className="hidden md:inline">Grid</span>
          </button>

          <button
            onClick={() => setRainSim(!rainSim)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              rainSim
                ? 'bg-gradient-to-r from-[#A5F1F7] to-[#E8FBFC] border-[#A5F1F7] text-[#102A2E] shadow-xs'
                : 'bg-white border-[#A5F1F7]/35 text-[#6B858A] hover:text-[#102A2E]'
            }`}
            title="Toggle Precipitation Vectors"
          >
            <span className="material-symbols-outlined text-sm">rainy</span>
            <span className="hidden md:inline">Rainfall</span>
          </button>

          <button
            onClick={() => setRotation(rotation === 12 ? 24 : 12)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#A5F1F7]/50 text-[#102A2E] text-[11px] font-bold hover:bg-[#EAF8FA] transition-all flex items-center gap-1 cursor-pointer"
            title="Tilt Perspective"
          >
            <span className="material-symbols-outlined text-sm">3d_rotation</span>
            <span className="hidden md:inline">Tilt</span>
          </button>

          <button
            onClick={() => navigate('/flood-simulation')}
            className="ml-1 px-3 py-1 rounded-lg bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] hover:from-[#8BE5EC] hover:to-[#C4F4F8] border border-[#A5F1F7] text-[#102A2E] font-bold text-[11px] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>LAUNCH SIMULATION</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* CENTRAL GRAPHICAL VECTOR SIMULATION WORKSPACE */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
        {/* Animated Rain Particles Overlay */}
        {rainSim && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-40">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#A5F1F7]/30 via-transparent to-transparent" />
            <svg className="w-full h-full">
              <line x1="15%" y1="0" x2="18%" y2="100%" stroke="rgba(165, 241, 247, 0.6)" strokeWidth="1" strokeDasharray="6,12" className="animate-pulse" />
              <line x1="35%" y1="0" x2="38%" y2="100%" stroke="rgba(165, 241, 247, 0.7)" strokeWidth="1.5" strokeDasharray="10,20" />
              <line x1="55%" y1="0" x2="58%" y2="100%" stroke="rgba(165, 241, 247, 0.5)" strokeWidth="1" strokeDasharray="8,16" />
              <line x1="75%" y1="0" x2="78%" y2="100%" stroke="rgba(165, 241, 247, 0.8)" strokeWidth="1.5" strokeDasharray="12,24" />
              <line x1="90%" y1="0" x2="93%" y2="100%" stroke="rgba(165, 241, 247, 0.6)" strokeWidth="1" strokeDasharray="6,18" />
            </svg>
          </div>
        )}

        {/* 3D Himalayan Terrain Contour SVG Representation */}
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full max-w-4xl max-h-[380px] filter drop-shadow-xl transition-all duration-700"
          style={{ transform: `perspective(800px) rotateX(${rotation}deg)` }}
        >
          <defs>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5F1F7" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#24464B" stopOpacity="1" />
              <stop offset="100%" stopColor="#102A2E" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(165, 241, 247, 0.25)" />
              <stop offset="100%" stopColor="rgba(242, 250, 251, 0.9)" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Mountain Contours (Himalayan Ridge Silhouette) */}
          <path
            d="M 20 280 Q 120 120 220 180 T 420 140 T 620 100 T 780 240 L 780 430 L 20 430 Z"
            fill="url(#mountainGrad)"
            stroke="rgba(165, 241, 247, 0.5)"
            strokeWidth="1.5"
          />

          <path
            d="M 60 320 Q 180 180 320 240 T 580 200 T 740 330 L 740 430 L 60 430 Z"
            fill="rgba(234, 248, 250, 0.8)"
            stroke="rgba(165, 241, 247, 0.6)"
            strokeWidth="1.5"
          />

          {/* Hydrologic Surface Grid Lines */}
          {hydroGrid && (
            <g stroke="rgba(16, 42, 46, 0.08)" strokeWidth="1" strokeDasharray="4,6">
              <line x1="100" y1="100" x2="700" y2="100" />
              <line x1="80" y1="180" x2="720" y2="180" />
              <line x1="60" y1="260" x2="740" y2="260" />
              <line x1="40" y1="340" x2="760" y2="340" />
              <line x1="200" y1="80" x2="150" y2="400" />
              <line x1="400" y1="80" x2="400" y2="400" />
              <line x1="600" y1="80" x2="650" y2="400" />
            </g>
          )}

          {/* Dynamic River Vector Channel */}
          <path
            d="M 680 90 Q 560 140 440 210 T 260 290 T 80 380"
            fill="none"
            stroke="rgba(165, 241, 247, 0.4)"
            strokeWidth="28"
            strokeLinecap="round"
          />
          <path
            d="M 680 90 Q 560 140 440 210 T 260 290 T 80 380"
            fill="none"
            stroke="url(#riverGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Animated Water Flow Stroke */}
          <path
            ref={riverRef}
            d="M 680 90 Q 560 140 440 210 T 260 290 T 80 380"
            fill="none"
            stroke="#102A2E"
            strokeWidth="4"
            strokeDasharray="12,18"
            strokeLinecap="round"
          />

          {/* Interactive Hydrologic Stations Markers */}
          {STATIONS.map((st) => (
            <g
              key={st.name}
              transform={`translate(${(st.x / 100) * 800}, ${(st.y / 100) * 450})`}
              className="cursor-pointer group/pin"
              onClick={() => setSelectedPoint(st.name)}
            >
              {/* Outer Pulse Ring */}
              <circle
                r="16"
                className={`fill-none stroke-2 animate-ping opacity-75 ${
                  st.risk === 'HIGH' ? 'stroke-[#F97316]' : st.risk === 'MODERATE' ? 'stroke-[#D97706]' : 'stroke-[#16A34A]'
                }`}
              />
              <circle
                r="8"
                className={`stroke-2 ${
                  st.risk === 'HIGH'
                    ? 'fill-orange-100 stroke-[#F97316]'
                    : st.risk === 'MODERATE'
                    ? 'fill-amber-100 stroke-[#D97706]'
                    : 'fill-emerald-100 stroke-[#16A34A]'
                }`}
              />
              <circle r="3" fill="#102A2E" />

              {/* Station Label Tooltip */}
              <g transform="translate(14, -12)">
                <rect
                  x="0"
                  y="-16"
                  width="135"
                  height="34"
                  rx="6"
                  fill="rgba(255, 255, 255, 0.95)"
                  stroke="rgba(165, 241, 247, 0.6)"
                  strokeWidth="1"
                />
                <text x="8" y="-3" fill="#102A2E" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                  {st.name}
                </text>
                <text x="8" y="10" fill="#24464B" fontSize="9" fontFamily="monospace">
                  {st.stage}
                </text>
              </g>
            </g>
          ))}
        </svg>

        {/* Central Overlay Launch CTA */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <button
            onClick={() => navigate('/flood-simulation')}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#A5F1F7] to-[#D9F9FB] hover:from-[#8BE5EC] hover:to-[#C4F4F8] border border-[#A5F1F7] text-[#102A2E] font-extrabold text-xs uppercase tracking-wider shadow-md transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">view_in_ar</span>
            <span>VIEW INTERACTIVE FLOOD SIMULATION</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
          <span className="text-[10px] text-[#6B858A] font-mono tracking-wide font-medium">
            Click to enter complete 30-minute scenario timeline engine
          </span>
        </div>
      </div>

      {/* BOTTOM METADATA BAR */}
      <div className="relative z-20 px-4 py-2 bg-white/95 border-t border-[#A5F1F7]/35 flex flex-wrap items-center justify-between text-[11px] text-[#6B858A] font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[#102A2E]">
            <span className="material-symbols-outlined text-sm text-[#24464B]">landscape</span>
            <span>Selected Gauge: <strong className="text-[#102A2E]">{selectedPoint}</strong></span>
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline">Model Engine: <strong className="text-[#24464B]">XGBoost v6.1.0</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#D97706] font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
            SCS-CN Runoff Q: 68mm
          </span>
        </div>
      </div>
    </div>
  );
}

