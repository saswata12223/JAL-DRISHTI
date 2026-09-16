import React, { useEffect, useState } from 'react';
import riskService from '../../services/riskService';
import { motion } from 'framer-motion';

export default function LiveSituationStrip() {
  const [data, setData] = useState({
    totalLocations: null,
    extreme: null,
    high: null,
    activeAlerts: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await riskService.getRiskSummary();
      if (res && res.success) {
        const summary = res.data;
        const total = summary.total_evaluated_points || 0;
        const extreme = summary.risk_class_counts?.EXTREME || 0;
        const high = summary.risk_class_counts?.HIGH || 0;
        const warning = summary.alert_priority_counts?.WARNING || 0;
        const critical = summary.alert_priority_counts?.CRITICAL || 0;
        const alerts = warning + critical;

        setData({ totalLocations: total, extreme, high, activeAlerts: alerts });
        
        const now = new Date();
        setLastUpdated(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) + ' IST');
        setError(false);
      } else {
        setError(true);
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
        <div className="flex flex-col lg:flex-row items-center justify-between py-4 lg:py-0 lg:h-24 gap-6 lg:gap-0">
          
          {/* Status & Last Updated (Left side) */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-12 lg:w-1/3">
            {/* Live Situation */}
            <div className="flex items-center gap-4">
              <div className="relative flex h-4 w-4">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${error ? 'bg-red-400' : 'bg-[#10B981]'}`}></span>
                <span className={`relative inline-flex rounded-full h-4 w-4 ${error ? 'bg-red-500' : 'bg-[#10B981]'}`}></span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-[13px] text-[#0F172A] tracking-wider uppercase">LIVE SITUATION</span>
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
                <span className="text-[10px] text-[#94A3B8] font-medium mt-0.5">Real-time data from multiple sources</span>
              </div>
            </div>
          </div>

          {/* Metrics (Right side) */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 sm:gap-10 lg:gap-16 lg:w-2/3">
            <MetricItem 
              icon="location_on" 
              iconColor="text-[#0F4C81]"
              label="Risk Locations" 
              value={data.totalLocations} 
              loading={loading}
              error={error}
            />
            <MetricItem 
              icon="warning" 
              iconColor="text-[#EF4444]"
              label="Extreme" 
              value={data.extreme} 
              loading={loading}
              error={error}
              zeroIsGood={true}
            />
            <MetricItem 
              icon="report_problem" 
              iconColor="text-[#F59E0B]"
              label="High" 
              value={data.high} 
              loading={loading}
              error={error}
              zeroIsGood={true}
            />
            <MetricItem 
              icon="notifications_active" 
              iconColor="text-[#0F4C81]"
              label="Active Alerts" 
              value={data.activeAlerts} 
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
  else if (value !== null) displayValue = String(value).padStart(2, '0');

  const isZero = value === 0;
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
