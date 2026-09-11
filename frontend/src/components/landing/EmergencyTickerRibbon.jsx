import React, { useEffect, useState, useRef } from 'react';
import riskService from '../../services/riskService';
import { animate } from 'animejs';

const DEMO_ALERTS = [
  { id: '1', area: 'RISHIKESH', severity: 'HIGH', message: 'Water Stage Approaching Warning Threshold (4.2m)' },
  { id: '2', area: 'DEVPRAYAG', severity: 'EXTREME', message: 'High Runoff Velocity Detected - SCS-CN Q=85mm' },
  { id: '3', area: 'JOSHIMATH', severity: 'HIGH', message: 'Himalayan Catchment Saturation > 92%' },
  { id: '4', area: 'ALAKNANDA BASIN', severity: 'EXTREME', message: 'Heavy Rainband 48mm/h Active Over Headwaters' },
  { id: '5', area: 'CHAMOLI', severity: 'MODERATE', message: 'Elevated Hydrograph Trend Observed' },
];

export default function EmergencyTickerRibbon() {
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [isLive, setIsLive] = useState(false);
  const tickerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await riskService.getActiveAlerts();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const formatted = res.data.map((item, idx) => ({
            id: item.id || String(idx),
            area: item.location_name || item.district || item.station_name || 'HIMALAYAN BASIN',
            severity: item.priority || item.severity || 'HIGH',
            message: item.message || item.summary || 'High Flood Risk Detected',
          }));
          setAlerts(formatted);
          setIsLive(true);
        }
      } catch (err) {
        console.warn('Landing ticker live alert fetch fallback to demo alerts:', err);
      }
    }

    loadAlerts();
  }, []);

  // Anime.js loop or continuous marquee
  useEffect(() => {
    if (!tickerRef.current) return;

    try {
      // Anime.js translation for continuous horizontal ticker loop
      animationRef.current = animate(tickerRef.current, {
        translateX: ['0%', '-50%'],
        duration: 25000,
        easing: 'linear',
        loop: true,
      });
    } catch (e) {
      console.warn('Anime.js ticker initialization notice:', e);
    }

    return () => {
      if (animationRef.current && typeof animationRef.current.pause === 'function') {
        animationRef.current.pause();
      }
    };
  }, [alerts]);

  // Duplicate items to ensure seamless infinite scroll loop
  const tickerItems = [...alerts, ...alerts, ...alerts];

  return (
    <div className="w-full bg-white border-b border-[#A5F1F7]/35 py-2 px-4 flex items-center overflow-hidden select-none relative z-30 shadow-xs">
      {/* Badge label pinned to the left */}
      <div className="shrink-0 z-10 flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-[#DC2626] shadow-xs mr-3">
        <span className="material-symbols-outlined text-[#DC2626] text-sm animate-pulse">warning</span>
        <span className="text-[10.5px] font-extrabold uppercase tracking-wider font-mono">
          EMERGENCY ALERT TICKER
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-ping" />
        <span className="text-[9px] font-bold text-[#DC2626]/80 border-l border-red-200 pl-2 hidden sm:inline">
          {isLive ? 'LIVE DATA' : 'DEMO TICKER'}
        </span>
      </div>

      {/* Marquee ticker container */}
      <div className="flex-1 overflow-hidden relative flex items-center">
        <div
          ref={tickerRef}
          className="flex items-center gap-8 whitespace-nowrap will-change-transform"
          onMouseEnter={() => animationRef.current && animationRef.current.pause && animationRef.current.pause()}
          onMouseLeave={() => animationRef.current && animationRef.current.play && animationRef.current.play()}
        >
          {tickerItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center gap-2.5 text-xs">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase font-mono tracking-wide bg-red-100 text-[#DC2626] border border-red-300">
                ⚠ {item.severity} RISK
              </span>
              <span className="font-bold text-[#102A2E] uppercase tracking-wide font-mono text-[11px]">
                {item.area}
              </span>
              <span className="text-[#24464B] font-medium text-[11px]">
                — {item.message}
              </span>
              <span className="text-[#6B858A] font-bold text-[14px] ml-4">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

