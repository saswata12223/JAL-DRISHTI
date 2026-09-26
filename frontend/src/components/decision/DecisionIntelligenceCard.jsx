import React, { useState, useEffect } from 'react';

export default function DecisionIntelligenceCard({
  locationName = 'No location selected',
  lat = null,
  lon = null,
  mlProbability = null,
  rainfallStatus = null,
  soilSaturationStatus = null,
  cwcStage = null,
  runoffStatus = null,
  finalRiskState = null,
  adminContext = null,
}) {
  const [ffewsData, setFfewsData] = useState(null);
  const [envData, setEnvData] = useState(null);
  const [loadingFfews, setLoadingFfews] = useState(false);

  useEffect(() => {
    async function loadFfews() {
      if (!lat || !lon) return;
      setLoadingFfews(true);
      try {
        const [ffewsRes, envRes] = await Promise.all([
          fetch(`/api/v1/ffews/telemetry?lat=${lat}&lon=${lon}`),
          fetch(`/api/environment?lat=${lat}&lon=${lon}`)
        ]);
        if (ffewsRes.ok) {
          const data = await ffewsRes.json();
          setFfewsData(data);
        }
        if (envRes.ok) {
          const data = await envRes.json();
          setEnvData(data);
        }
      } catch (err) {
        console.error("Failed to load FFEWS data:", err);
      } finally {
        setLoadingFfews(false);
      }
    }
    loadFfews();
  }, [lat, lon]);

  // Use FFEWS risk score to determine live risk state if available
  const activeRiskState = ffewsData ? (ffewsData.riskScore >= 90 ? 'EXTREME' : ffewsData.riskScore >= 75 ? 'HIGH' : ffewsData.riskScore >= 50 ? 'MODERATE' : 'LOW') : finalRiskState;
  
  const isExtreme = activeRiskState === 'EXTREME';
  const isHigh = activeRiskState === 'HIGH';

  const riskColor = isExtreme ? 'text-red-600' : isHigh ? 'text-orange-500' : 'text-emerald-600';
  const dotColor = isExtreme ? 'bg-red-600 animate-pulse' : isHigh ? 'bg-orange-500' : 'bg-emerald-600';

  // Loading state
  const isLoading = (!finalRiskState && mlProbability === null && !envData) || loadingFfews;

  // Derive display fields (fallback to Open-Meteo if ML data is not provided)
  let displayRainfall = rainfallStatus || '—';
  let displaySoil = soilSaturationStatus || '—';
  let displayRiver = cwcStage || '—';
  let displayRunoff = runoffStatus || '—';

  if (!rainfallStatus || rainfallStatus === 'NORMAL') {
    if (envData?.current) {
      const rain = envData.current.precipitation || 0;
      displayRainfall = rain > 50 ? 'CRITICAL' : rain > 25 ? 'HIGH' : 'NORMAL';
    }
  }

  if (!soilSaturationStatus) {
    if (envData?.hourly?.soil_moisture_0_to_1cm?.[0] !== undefined) {
      displaySoil = `${Math.round(envData.hourly.soil_moisture_0_to_1cm[0] * 100)}%`;
    }
  }

  if (!cwcStage || cwcStage === 'NORMAL') {
    if (ffewsData?.chartData?.[0]) {
      const today = ffewsData.chartData[0];
      if (today.Discharge && today.DischargeMedian && today.DischargeMedian > 0) {
        const ratio = today.Discharge / today.DischargeMedian;
        displayRiver = ratio > 2.0 ? 'DANGER' : ratio > 1.5 ? 'WARNING' : 'NORMAL';
      } else {
        displayRiver = 'NORMAL';
      }
    }
  }

  if (!runoffStatus || runoffStatus === 'NORMAL') {
    if (displayRainfall === 'CRITICAL' || (displayRainfall === 'HIGH' && parseInt(displaySoil) > 50)) {
      displayRunoff = 'HIGH';
    } else if (envData) {
      displayRunoff = 'NORMAL';
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col select-none font-sans shadow-xs hover:shadow-sm transition-shadow h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold text-slate-900 uppercase tracking-widest">
            Risk Decision
          </h2>
        </div>
        <span className="text-[10.5px] font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[140px]" title={locationName}>
          {locationName}
        </span>
      </div>

      {/* Decision rows */}
      <div className="flex flex-col gap-4 text-[12px] pb-5 border-b border-slate-100 min-h-[160px] justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-[24px] text-slate-300 mb-2 animate-pulse">hourglass_empty</span>
            <span className="font-medium text-slate-500 text-[11px]">Loading model output…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">FFEWS Risk Score*</span>
              <span className="font-mono font-bold text-red-600 text-right shrink-0">
                {ffewsData ? `${ffewsData.riskScore}/100` : (typeof mlProbability === 'number' ? `${Math.round(mlProbability * 100)}%` : '—')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Rainfall Intensity</span>
              <span className="font-mono font-semibold text-orange-600 text-right shrink-0">
                {displayRainfall}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Soil Saturation</span>
              <span className="font-mono font-semibold text-amber-600 text-right shrink-0">
                {displaySoil}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">River Stage</span>
              <span className="font-mono font-bold text-red-600 text-right shrink-0">
                {displayRiver}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 font-medium truncate">Physics Runoff</span>
              <span className="font-mono font-semibold text-slate-800 text-right shrink-0">
                {displayRunoff}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Fused Risk */}
      <div className="flex items-center justify-between pt-5">
        <span className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">
          Fused Risk
        </span>
        <div className={`flex items-center gap-1.5 font-mono text-[12.5px] font-bold ${isLoading ? 'text-slate-300' : riskColor}`}>
          <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-slate-200' : dotColor}`} />
          <span>{isLoading ? '—' : (activeRiskState || '—')}</span>
        </div>
      </div>

      {/* Footnote: data provenance */}
      <div className="pt-3 border-t border-slate-100 mt-3">
        <span className="text-[9.5px] text-slate-400 leading-relaxed">
          * FFEWS Risk Score = Derived from Open-Meteo API.{' '}
          <span className="font-semibold text-emerald-600">LIVE INFERENCE.</span>
        </span>
      </div>
    </div>
  );
}
