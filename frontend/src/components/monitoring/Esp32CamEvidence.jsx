import React, { useState, useEffect } from 'react';

export default function Esp32CamEvidence({ cameraDetails, className = '' }) {
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const captureUrl = "http://192.168.1.116/capture";
  
  useEffect(() => {
    const interval = setInterval(() => {
      setImageTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = cameraDetails?.connected || false;

  return (
    <div className={`glass-panel-level1 p-3 rounded-xl flex flex-col gap-2 font-sans bg-white/90 border border-[rgba(16,42,46,0.1)] shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-[rgba(16,42,46,0.08)] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#0C6E78] text-[18px]">
            photo_camera
          </span>
          <h3 className="text-[12.5px] font-bold text-[#102A2E] tracking-tight">
            ESP32-CAM Live Evidence
          </h3>
        </div>
        <span
          className={`text-[9.5px] font-semibold px-2 py-0.5 rounded border uppercase ${
            isConnected
              ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold'
              : 'bg-amber-500/15 text-amber-700 border-amber-500/30 font-bold'
          }`}
        >
          {isConnected ? 'CONNECTED' : 'CONNECTING...'}
        </span>
      </div>

      <div className="w-full bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[160px] relative shadow-inner">
        <img 
          src={`${captureUrl}?t=${imageTimestamp}`} 
          alt="ESP32-CAM live frame" 
          className="w-full h-auto object-cover opacity-90"
          onError={(e) => { e.target.style.display = 'none'; }}
          onLoad={(e) => { e.target.style.display = 'block'; }}
        />
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 text-[11px] font-mono uppercase tracking-wider">
            No Signal
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-1">
        <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg text-center">
          <span className="text-[9px] font-semibold text-[#5F777C] uppercase block mb-0.5">
            Brightness
          </span>
          <span className="text-[13px] font-bold text-[#102A2E] font-mono">
            {isConnected ? cameraDetails?.brightness || 0 : '--'}
          </span>
        </div>
        <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg text-center">
          <span className="text-[9px] font-semibold text-[#5F777C] uppercase block mb-0.5">
            Dark Cloud
          </span>
          <span className="text-[13px] font-bold text-[#102A2E] font-mono">
            {isConnected ? cameraDetails?.dark_cloud_score || 0 : '--'}%
          </span>
        </div>
        <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2 rounded-lg text-center">
          <span className="text-[9px] font-semibold text-[#5F777C] uppercase block mb-0.5">
            Visual Rain
          </span>
          <span className="text-[13px] font-bold text-[#102A2E] font-mono">
            {isConnected ? cameraDetails?.visual_rain_score || 0 : '--'}%
          </span>
        </div>
      </div>
    </div>
  );
}
