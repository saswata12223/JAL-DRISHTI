import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import riskService from '../services/riskService';

export default function AppLayout() {
  const [summary, setSummary] = useState(null);
  const [activeAlertsCount, setActiveAlertsCount] = useState(2);
  const [dataQuality, setDataQuality] = useState('COMPLETE');
  const [lastUpdated, setLastUpdated] = useState('01:32 AM IST');

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await riskService.getRiskSummary();
        if (res?.data) {
          setSummary(res.data);
          const criticalCount = res.data.alert_priority_counts?.CRITICAL ?? 0;
          const warningCount = res.data.alert_priority_counts?.WARNING ?? 0;
          setActiveAlertsCount(criticalCount + warningCount);
          setDataQuality(res.data.active_cwc_gauges_online < 20 ? 'PARTIAL' : 'COMPLETE');
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
        }
      } catch (err) {
        console.warn('Summary polling warning:', err);
      }
    }

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen flex flex-col">
      <Header
        activeAlertsCount={activeAlertsCount}
        systemStatus="LIVE"
        lastUpdated={lastUpdated}
      />
      <div className="flex-1 pt-[82px] flex flex-col w-full">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-8 pb-20 lg:pb-10">
          <Outlet context={{ summary, dataQuality }} />
          <Footer />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
