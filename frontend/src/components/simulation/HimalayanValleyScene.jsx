import React, { useRef, useEffect } from 'react';
import { animate } from 'animejs';

/**
 * HimalayanValleyScene — Photorealistic Disaster-Management Environmental Visualization.
 * Uses high-resolution photographic environmental state cross-fading combined with HTML5 Canvas 2D
 * rain particle systems, river floating debris, spray mist, and subtle GIS emergency overlays.
 */
export default function HimalayanValleyScene({ stageIndex, progressFraction, currentMetrics }) {
  const canvasRef = useRef(null);

  // HTML5 Canvas 2D Rain & River Floating Debris Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    const width = (canvas.width = canvas.offsetWidth || 1000);
    const height = (canvas.height = canvas.offsetHeight || 560);

    // Rain particles scale with progressFraction (0 rain at Normal up to 200 particles at Flash Flood)
    const rainCount = Math.floor(progressFraction * 200);
    const rainParticles = Array.from({ length: 200 }, () => ({
      x: Math.random() * (width + 200) - 100,
      y: Math.random() * height,
      length: 16 + Math.random() * 24,
      speed: 18 + Math.random() * 16,
      opacity: 0.2 + Math.random() * 0.65,
      thickness: 1 + Math.random() * 1.4,
    }));

    // Floating river debris particles (branches, logs, sediment) active at Flash Flood (progressFraction > 0.4)
    const debrisCount = Math.floor(Math.max(0, progressFraction - 0.3) * 25);
    const debrisParticles = Array.from({ length: 25 }, () => ({
      progress: Math.random(), // 0.0 top of river gorge to 1.0 bottom
      offset: (Math.random() - 0.5) * 40,
      length: 8 + Math.random() * 14,
      angle: (Math.random() - 0.5) * 0.4,
      speed: 0.003 + Math.random() * 0.005,
    }));

    // Curved River Channel Path points for debris movement (matching photograph)
    const getRiverPos = (t, offset) => {
      // Bezier curve from mid-center gorge down to bottom left/center
      const p0 = { x: 440, y: 260 };
      const p1 = { x: 380, y: 380 };
      const p2 = { x: 320, y: 460 };
      const p3 = { x: 260, y: 560 };

      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      let x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
      let y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;

      return { x: x + offset, y: y };
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Rain Particles
      if (rainCount > 0) {
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineCap = 'round';

        for (let i = 0; i < rainCount; i++) {
          const p = rainParticles[i];
          ctx.lineWidth = p.thickness;
          ctx.globalAlpha = p.opacity;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          // Realistic 18-degree diagonal wind slant
          ctx.lineTo(p.x - p.length * 0.3, p.y + p.length);
          ctx.stroke();

          p.y += p.speed * (1 + progressFraction * 0.3);
          p.x -= p.speed * 0.3;

          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * (width + 200) - 100;
          }
        }
      }

      // 2. Floating River Debris (Wood Logs / Sediment)
      if (debrisCount > 0 && progressFraction > 0.35) {
        ctx.strokeStyle = '#78350f'; // Wood brown color
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        for (let i = 0; i < debrisCount; i++) {
          const d = debrisParticles[i];
          const pos = getRiverPos(d.progress, d.offset);

          ctx.globalAlpha = Math.min((progressFraction - 0.35) * 2.5, 0.9);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x + Math.cos(d.angle) * d.length, pos.y + Math.sin(d.angle) * d.length);
          ctx.stroke();

          // Advance debris along river velocity
          d.progress += d.speed * (1 + progressFraction * 1.5);
          if (d.progress > 1.0) {
            d.progress = 0;
            d.offset = (Math.random() - 0.5) * 50;
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [progressFraction]);

  // Derived environmental cross-fade opacities
  const normalOpacity = Math.max(0, 1 - progressFraction * 1.4);
  const extremeOpacity = Math.min(1, progressFraction * 1.3);

  // Storm visibility darkness (0.0 clear up to 0.45 overcast haze)
  const stormDarkness = Math.min(progressFraction * 0.45, 0.45);

  // Evacuation route visibility (Active at Stage 6 / 25:00+ mins)
  const isEvacuationActive = stageIndex >= 6 || progressFraction >= 0.85;

  return (
    <div className="relative w-full h-[310px] sm:h-[360px] lg:h-[390px] xl:h-[410px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none font-sans">
      {/* 1. PHOTOREALISTIC HIMALAYAN VALLEY NORMAL STAGE PHOTO */}
      <img
        src="/images/himalayan_valley_normal.jpg"
        alt="Himalayan Valley Normal Stage"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 filter brightness-[0.95]"
        style={{ opacity: normalOpacity }}
      />

      {/* 2. PHOTOREALISTIC HIMALAYAN FLASH FLOOD STAGE PHOTO */}
      <img
        src="/images/himalayan_valley_extreme.jpg"
        alt="Himalayan Valley Extreme Flash Flood Stage"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 filter brightness-[0.98] contrast-[1.05]"
        style={{ opacity: extremeOpacity }}
      />

      {/* 3. ATMOSPHERIC STORM HAZE OVERLAY */}
      <div
        className="absolute inset-0 bg-slate-950 pointer-events-none transition-opacity duration-500"
        style={{ opacity: stormDarkness }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 pointer-events-none" />

      {/* 4. SUBTLE GIS OVERLAYS & EVACUATION ROUTE */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 560"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="gisGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- EVACUATION ROUTE OVERLAY (Stage 6 / 25:00+) --- */}
        {isEvacuationActive && (
          <g filter="url(#gisGlow)">
            {/* Path from village terrace (x=640, y=360) up to safe shelter highland (x=760, y=140) */}
            <path
              d="M 640 360 Q 700 260 760 140"
              stroke="#34d399"
              strokeWidth="3.5"
              fill="none"
              strokeDasharray="8 5"
              className="animate-pulse"
            />
            {/* Safe Shelter Highland Marker */}
            <circle cx="760" cy="140" r="14" fill="#065f46" stroke="#34d399" strokeWidth="2" />
            <text x="760" y="144" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="bold">
              H
            </text>
          </g>
        )}

        {/* --- SUBTLE GIS EMERGENCY OVERLAY ANNOTATIONS --- */}
        {/* Callout 1: Uphill Catchment */}
        <g transform="translate(140, 70)">
          <rect width="160" height="26" rx="4" fill="#0f172a" opacity="0.8" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="12" cy="13" r="3.5" fill="#38bdf8" />
          <text x="22" y="17" fill="#f8fafc" fontSize="10" fontWeight="bold">
            UPHILL CATCHMENT
          </text>
        </g>

        {/* Callout 2: Alaknanda River Stage Status */}
        <g transform="translate(200, 425)">
          <rect
            width="190"
            height="30"
            rx="4"
            fill="#0f172a"
            opacity="0.88"
            stroke={progressFraction > 0.6 ? '#ef4444' : progressFraction > 0.3 ? '#f59e0b' : '#38bdf8'}
            strokeWidth="1.2"
          />
          <circle
            cx="12"
            cy="15"
            r="4"
            fill={progressFraction > 0.6 ? '#ef4444' : progressFraction > 0.3 ? '#f59e0b' : '#38bdf8'}
          />
          <text x="22" y="14" fill="#f8fafc" fontSize="9.5" fontWeight="bold">
            ALAKNANDA RIVER
          </text>
          <text x="22" y="24" fill="#94a3b8" fontSize="8.5" fontWeight="medium">
            Stage {currentMetrics.waterLevelM}m ({currentMetrics.riskClass})
          </text>
        </g>

        {/* Callout 3: NH-58 Highway Status */}
        <g transform="translate(730, 425)">
          <rect
            width="160"
            height="28"
            rx="4"
            fill="#0f172a"
            opacity="0.88"
            stroke={progressFraction > 0.6 ? '#ef4444' : '#64748b'}
            strokeWidth="1"
          />
          <text x="10" y="14" fill="#f8fafc" fontSize="9.5" fontWeight="bold">
            NH-58 HIGHWAY
          </text>
          <text
            x="10"
            y="23"
            fill={progressFraction > 0.6 ? '#fca5a5' : '#cbd5e1'}
            fontSize="8.5"
            fontWeight="semibold"
          >
            {progressFraction > 0.6 ? 'ROAD INUNDATED' : 'PASSABLE'}
          </text>
        </g>

        {/* Callout 4: Safe Shelter Annotation */}
        {isEvacuationActive && (
          <g transform="translate(710, 105)">
            <rect width="150" height="24" rx="4" fill="#064e3b" opacity="0.9" stroke="#34d399" strokeWidth="1.2" />
            <text x="10" y="15" fill="#34d399" fontSize="9.5" fontWeight="bold">
              SAFE SHELTER (1,450m)
            </text>
          </g>
        )}
      </svg>

      {/* 5. HTML5 CANVAS RAIN & RIVER DEBRIS OVERLAY */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* 6. TOP DIGITAL TWIN TELEMETRY BADGE */}
      <div className="absolute top-3 left-3 bg-white/90 border border-[rgba(16,42,46,0.12)] backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2.5 text-sans">
        <span className="w-2 h-2 rounded-full bg-[#0C6E78] animate-ping" />
        <span className="text-[11px] font-bold text-[#102A2E] tracking-wide">
          HIMALAYAN VALLEY DIGITAL TWIN
        </span>
        <span className="text-[10px] font-mono text-[#5F777C] border-l border-[rgba(16,42,46,0.12)] pl-2.5 font-medium">
          Alaknanda Basin (30.108°N, 78.298°E)
        </span>
      </div>
    </div>
  );
}

