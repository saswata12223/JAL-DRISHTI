import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JalDrishti3DViewer from './JalDrishti3DViewer';

export default function SimulationSection() {
  const navigate = useNavigate();
  const [simulationState, setSimulationState] = useState('NORMAL');
  
  // Simulation controls state
  const [rainfall, setRainfall] = useState(0);
  const [simTime, setSimTime] = useState(0);
  
  const handleRunSimulation = () => {
    // Basic logic mapping UI controls to the existing 3D viewer state
    if (rainfall > 80 || simTime > 20) {
      setSimulationState('EXTREME');
    } else if (rainfall > 40 || simTime > 10) {
      setSimulationState('HIGH');
    } else {
      setSimulationState('NORMAL');
    }
  };

  return (
    <section id="simulation" className="w-full bg-[#0F172A] py-24 border-b border-[#1E293B]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Text Content */}
          <div className="lg:w-1/3 flex flex-col items-start text-white">
            <span className="text-[11px] font-extrabold tracking-[0.2em] text-[#94A3B8] uppercase mb-4">Interactive Simulation</span>
            <h2 className="text-4xl lg:text-[42px] font-black tracking-tight leading-tight mb-6">
              See How Flood Risk Evolves
            </h2>
            <p className="text-sm lg:text-[15px] text-[#CBD5E1] leading-relaxed mb-8 font-medium">
              Explore different rainfall and river flow scenarios using an interactive 3D simulation of Uttarakhand's terrain.
            </p>
            <button
              onClick={() => navigate('/flood-simulation')}
              className="px-6 py-3 rounded bg-[#0F4C81] hover:bg-[#0B3B66] text-white font-bold text-sm tracking-wide transition-colors flex items-center gap-2 shadow-lg"
            >
              Launch 3D Simulation <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* 3D Simulation Viewer & Controls Overlay */}
          <div className="lg:w-2/3 w-full relative">
            <div className="w-full h-[450px] lg:h-[500px] rounded-2xl overflow-hidden border border-[#334155] shadow-2xl bg-[#090D14] relative">
              <JalDrishti3DViewer
                simulationState={simulationState}
                onStateChange={setSimulationState}
              />
              
              {/* Overlay Controls */}
              <div className="absolute top-4 right-4 w-72 bg-[#0F172A]/90 backdrop-blur-md border border-[#334155] rounded-xl p-5 shadow-2xl flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-[#334155] mb-5">
                  <button className="flex-1 pb-2 text-[11px] font-bold text-[#8FD3E8] border-b-2 border-[#8FD3E8]">Simulation</button>
                  <button className="flex-1 pb-2 text-[11px] font-bold text-[#94A3B8] hover:text-[#CBD5E1]">Layers</button>
                  <button className="flex-1 pb-2 text-[11px] font-bold text-[#94A3B8] hover:text-[#CBD5E1]">Legend</button>
                </div>

                {/* Rainfall Slider */}
                <div className="flex flex-col mb-5">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-[#F8FAFC]">Rainfall (mm)</span>
                    <span className="text-xs font-bold text-[#94A3B8]">{rainfall}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="200" 
                    value={rainfall}
                    onChange={(e) => setRainfall(Number(e.target.value))}
                    className="w-full h-1 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#8FD3E8]"
                  />
                </div>

                {/* Simulation Time Slider */}
                <div className="flex flex-col mb-5">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-semibold text-[#F8FAFC]">Simulation Time</span>
                    <span className="text-xs font-bold text-[#94A3B8]">{simTime} hrs</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="48" 
                    value={simTime}
                    onChange={(e) => setSimTime(Number(e.target.value))}
                    className="w-full h-1 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#8FD3E8]"
                  />
                </div>

                {/* Risk Layer Dropdown */}
                <div className="flex flex-col mb-5">
                  <span className="text-[11px] font-semibold text-[#F8FAFC] mb-1.5">Risk Layer</span>
                  <select className="bg-[#1E293B] border border-[#334155] text-[#F8FAFC] text-xs font-semibold rounded-md p-2 outline-none">
                    <option>Flood Inundation</option>
                    <option>Soil Saturation</option>
                    <option>Flash Flood Probability</option>
                  </select>
                </div>

                {/* Run Button */}
                <button 
                  onClick={handleRunSimulation}
                  className="w-full py-2 bg-[#0F4C81] hover:bg-[#0b3861] text-white rounded font-bold text-[11px] flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">play_arrow</span> Run Simulation
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
