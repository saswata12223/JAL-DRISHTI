import React, { useEffect, useState } from 'react';
import { loadSummary, loadModelDecisions } from '../../services/modelIntelligenceService';
import { motion } from 'framer-motion';

export default function LiveSituationStrip() {
  const [data, setData] = useState({
    maxProb: null,
    highExtreme: null,
    maxRain: null,
    criticalWater: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [isHistorical, setIsHistorical] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, decisionsRes] = await Promise.all([
        loadSummary(),
        loadModelDecisions()
      ]);
      
      let newStats = {
         maxProb: 0,
         highExtreme: 0,
         maxRain: 0,
         criticalWater: 0,
      };

      if (summaryRes.summary) {
         const s = summaryRes.summary;
      } else {
         setError(true);
      }
      
      if (decisionsRes.decisions) {
         if (decisionsRes.source === 'HISTORICAL_MODEL_OUTPUT') {
            setIsHistorical(true);
         } else {
            setIsHistorical(false);
         }
         const decisions = decisionsRes.decisions;
         if (Array.isArray(decisions) && decisions.length > 0) {
            newStats.maxProb = Math.max(0, ...decisions.map(d => d.flood_probability || 0));
            newStats.maxRain = Math.max(0, ...decisions.map(d => d.rainfall_1h_mm || 0));
            
            let calcHighExtreme = 0;
            let calcCriticalWater = 0;
            decisions.forEach(d => {
              const risk = d.final_risk_class || d.alert_priority || 'LOW';
              if (risk === 'HIGH' || risk === 'EXTREME' || risk === 'CRITICAL' || risk === 'WARNING') calcHighExtreme++;
              const cwc = d.cwc_threshold_status || 'NORMAL';
              if (cwc === 'DANGER_ZONE' || cwc === 'ABOVE_HFL' || cwc === 'DANGER') calcCriticalWater++;
            });
            newStats.highExtreme = calcHighExtreme;
            newStats.criticalWater = calcCriticalWater;
         }
      } else {
         setError(true);
      }

      setData(newStats);
      const now = new Date();
      setLastUpdated(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST');
      
      if (summaryRes.status === 'fulfilled' && decisionsRes.status === 'fulfilled') {
        setError(false);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] shadow-sm relative z-30">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col xl:flex-row items-center justify-between py-6 min-h-[96px] gap-6 xl:gap-8">
          
          {/* Status & Last Updated (Left side) */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 w-full xl:w-auto justify-center xl:justify-start">
            {/* Live Situation */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${error ? 'bg-red-400' : 'bg-[#10B981]'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${error ? 'bg-red-500' : 'bg-[#10B981]'}`}></span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[13px] text-[#0F172A] tracking-wider uppercase">{isHistorical ? "HISTORICAL MODEL OUTPUT" : "LIVE SITUATION"}</span>
                <span className="text-[11px] text-[#64748B] font-medium">{error ? 'System offline' : 'System operational'}</span>
              </div>
            </div>

            {/* Last Updated */}
            <div className="hidden sm:flex items-center gap-3 border-l border-[#E2E8F0] pl-8">
              <span className="material-symbols-outlined text-[#94A3B8] text-xl font-light">schedule</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#64748B] font-semibold">Last updated</span>
                  <span className="text-[11px] font-bold text-[#0F172A]">{loading && !lastUpdated ? '--:--' : lastUpdated}</span>
                </div>
                <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5">{isHistorical ? "Verified historical model output" : "Real-time data from multiple sources"}</span>
              </div>
            </div>
          </div>

          {/* Metrics (Right side) */}
          <div className="flex flex-wrap items-center justify-center xl:justify-end gap-6 sm:gap-8 xl:gap-12 w-full xl:w-auto">
            <MetricItem 
              icon="crisis_alert" 
              iconColor="text-[#EF4444]"
              label="OVERALL Model Probability" 
              value={data.maxProb !== null ? `${Math.round(data.maxProb * 100)}%` : null} 
              loading={loading}
              error={error}
            />
            <MetricItem 
              icon="warning" 
              iconColor="text-[#F97316]"
              label="HIGH / EXTREME LOCATIONS" 
              value={data.highExtreme} 
              loading={loading}
              error={error}
              zeroIsGood={true}
            />
            <MetricItem 
              icon="water_drop" 
              iconColor="text-[#0EA5E9]"
              label="RAINFALL INTENSITY" 
              value={data.maxRain !== null ? `${Math.round(data.maxRain)} mm/h` : null} 
              loading={loading}
              error={error}
            />
            <MetricItem 
              icon="waves" 
              iconColor="text-[#EF4444]"
              label="CRITICAL WATER LEVELS" 
              value={data.criticalWater} 
              loading={loading}
              error={error}
              zeroIsGood={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricItem({ icon, iconColor, label, value, loading, error, zeroIsGood }) {
  let displayValue = value;
  if (loading && value === null) displayValue = '--';
  else if (error) displayValue = 'ERR';
  else if (value !== null) {
    if (typeof value === 'number') {
      displayValue = String(value);
    }
  }

  const isZero = value === 0 || value === '0%' || value === '0 mm/h';
  const valueColor = error ? 'text-[#EF4444]' : (isZero && zeroIsGood ? 'text-[#0F172A]/40' : 'text-[#0F172A]');

  return (
    <div className="flex items-center gap-3">
      <span className={`material-symbols-outlined text-[26px] ${iconColor}`}>{icon}</span>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-[#0F172A]">{label}</span>
        <span className={`text-[32px] font-black leading-none mt-1 tracking-tighter ${valueColor}`}>
          {displayValue}
        </span>
      </div>
    </div>
  );
}
