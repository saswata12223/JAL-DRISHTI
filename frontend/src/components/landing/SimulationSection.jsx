import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WORKFLOW_STAGES = [
  { phase: 'SENSE THE STORM', phaseIndex: 0, message: 'Rainfall intensifies...' },
  { phase: 'SENSE THE STORM', phaseIndex: 0, message: 'Soil moisture rises...' },
  { phase: 'SENSE THE STORM', phaseIndex: 0, message: 'Runoff potential increases...' },
  { phase: 'SEE THE RISK',    phaseIndex: 1, message: 'Flood risk emerges...' },
  { phase: 'SEE THE RISK',    phaseIndex: 1, message: 'Jal Drishti detects the signal...' },
  { phase: 'SEE THE RISK',    phaseIndex: 1, message: 'Early warning is issued...' },
  { phase: 'ACT IN TIME',     phaseIndex: 2, message: 'Citizens are alerted...' },
  { phase: 'ACT IN TIME',     phaseIndex: 2, message: 'Rescue response begins...' },
];

const PHASES = ['SENSE THE STORM', 'SEE THE RISK', 'ACT IN TIME'];

const PHASE_ICONS = ['sensors', 'crisis_alert', 'emergency_home'];

function RiskWorkflow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [typing, setTyping] = useState(true);
  const prefersReduced = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const step = WORKFLOW_STAGES[stepIndex];
    const target = step.message;

    if (prefersReduced.current) {
      setDisplayText(target);
      const timer = setTimeout(() => {
        setStepIndex((prev) => (prev + 1) % WORKFLOW_STAGES.length);
      }, 2200);
      return () => clearTimeout(timer);
    }

    setDisplayText('');
    setTyping(true);
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      charIndex++;
      setDisplayText(target.slice(0, charIndex));
      if (charIndex >= target.length) {
        clearInterval(typeInterval);
        setTyping(false);
        const holdTimer = setTimeout(() => {
          setStepIndex((prev) => (prev + 1) % WORKFLOW_STAGES.length);
        }, 1800);
        return () => clearTimeout(holdTimer);
      }
    }, 38);

    return () => clearInterval(typeInterval);
  }, [stepIndex]);

  const currentPhaseIndex = WORKFLOW_STAGES[stepIndex].phaseIndex;

  return (
    <div className="w-full mt-1">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-4 h-px bg-[#8FD3E8]" />
        <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#8FD3E8] uppercase">
          How Jal Drishti Responds
        </span>
      </div>

      {/* Phase rail */}
      <div className="flex flex-col gap-0 mb-6">
        {PHASES.map((phase, idx) => {
          const isActive = idx === currentPhaseIndex;
          const isDone = idx < currentPhaseIndex;
          return (
            <React.Fragment key={phase}>
              <div
                className={`flex items-center gap-3 py-2.5 transition-all duration-500 ${
                  isActive ? 'opacity-100' : isDone ? 'opacity-40' : 'opacity-25'
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                    isActive
                      ? 'bg-[#0F4C81] border border-[#8FD3E8] shadow-[0_0_10px_rgba(143,211,232,0.25)]'
                      : isDone
                      ? 'bg-[#1E293B] border border-[#334155]'
                      : 'bg-transparent border border-[#334155]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      isActive ? 'text-[#8FD3E8]' : isDone ? 'text-[#475569]' : 'text-[#334155]'
                    }`}
                  >
                    {PHASE_ICONS[idx]}
                  </span>
                </div>

                {/* Phase label + live message */}
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-[10px] font-extrabold tracking-[0.14em] uppercase transition-colors duration-500 ${
                      isActive ? 'text-[#8FD3E8]' : isDone ? 'text-[#475569]' : 'text-[#2D3A4A]'
                    }`}
                  >
                    {phase}
                  </span>

                  {isActive && (
                    <span className="text-[12px] text-[#CBD5E1] font-medium mt-0.5 min-h-[18px] flex items-center gap-1">
                      {displayText}
                      {typing && (
                        <span className="inline-block w-px h-3 bg-[#8FD3E8] animate-pulse ml-0.5" />
                      )}
                    </span>
                  )}
                </div>

                {/* Active pulse dot */}
                {isActive && (
                  <span className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-[#8FD3E8] animate-pulse" />
                )}
              </div>

              {/* Connector line between phases */}
              {idx < PHASES.length - 1 && (
                <div className="ml-[13px] w-px h-4 bg-[#1E293B]" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Disclaimer note */}
      <p className="text-[10px] text-[#475569] leading-relaxed border-l-2 border-[#1E293B] pl-3">
        This represents Jal Drishti's multi-source risk assessment workflow. Actual outcomes depend on sensor data, terrain conditions, and operational context.
      </p>
    </div>
  );
}

export default function SimulationSection() {
  const navigate = useNavigate();

  return (
    <section id="simulation" className="w-full bg-[#0F172A] py-24 border-b border-[#1E293B]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center">

          {/* Text Content */}
          <div className="lg:w-1/3 flex flex-col items-start text-white">
            <h2 className="text-4xl lg:text-[42px] font-black tracking-tight leading-tight mb-6">
              See How Flood Risk Evolves
            </h2>
            <p className="text-sm lg:text-[15px] text-[#CBD5E1] leading-relaxed mb-8 font-medium">
              Explore different rainfall and river flow scenarios using an interactive 3D simulation of Uttarakhand's terrain.
            </p>

            {/* Animated workflow — replaces button */}
            <RiskWorkflow />
          </div>

          {/* Video */}
          <div className="lg:w-2/3 w-full relative">
            <div className="w-full h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-[#334155] shadow-2xl bg-[#090D14] relative">
              <video
                src="/assets/video/InShot_20260917_040506723.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
