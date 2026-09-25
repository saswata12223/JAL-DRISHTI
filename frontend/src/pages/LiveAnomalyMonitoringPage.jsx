import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import liveAnomalyService from '../services/liveAnomalyService';
import stationsService from '../services/stationsService';

export default function LiveAnomalyMonitoringPage() {
  const [overview, setOverview] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  const fetchAnomalies = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorDetail(null);

      const [overviewRes, anomaliesRes] = await Promise.all([
        liveAnomalyService.getOverview(),
        liveAnomalyService.getAnomalies(100), // Get top 100 most anomalous stations
      ]);

      if (overviewRes && overviewRes.success) {
        setOverview(overviewRes.data);
      } else {
        setOverview(null);
        setErrorDetail(overviewRes?.detail || 'Live anomaly data is currently unavailable.');
      }

      if (anomaliesRes && anomaliesRes.success) {
        setAnomalies(anomaliesRes.data);
      } else {
        setAnomalies([]);
      }
    } catch (err) {
      console.warn('[LiveAnomalyMonitoringPage] Error fetching anomalies:', err);
      setErrorDetail('Failed to retrieve live anomalies from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
    const timer = setInterval(() => {
      fetchAnomalies();
    }, 15 * 60 * 1000); // 15 min refresh
    return () => clearInterval(timer);
  }, [fetchAnomalies]);

  const handleRefreshClick = () => {
    fetchAnomalies(true);
  };

  const isUnavailable = !overview || overview.status === 'UNAVAILABLE';

  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'WATCH': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'ELEVATED': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'EXTREME': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getAnomalyStateText = (anomaly) => {
    if (anomaly.is_anomaly_1pct) return 'EXTREME ANOMALY (Top 1%)';
    if (anomaly.is_anomaly_5pct) return 'HIGH ANOMALY (Top 5%)';
    if (anomaly.is_anomaly_10pct) return 'ELEVATED ANOMALY (Top 10%)';
    return 'NORMAL / BACKGROUND';
  };

  const getAnomalyColor = (anomaly) => {
    if (anomaly.is_anomaly_1pct) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (anomaly.is_anomaly_5pct) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (anomaly.is_anomaly_10pct) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-app-text-primary tracking-tight font-sans flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-[26px]">
              troubleshoot
            </span>
            LIVE ANOMALY MONITORING
          </h1>
          <p className="text-[12px] font-medium text-app-text-secondary mt-0.5">
            Real-time environmental state monitoring via unsupervised Isolation Forest baseline (v1.0)
          </p>
        </div>

        {/* Controls & Status Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Badge */}
          {isUnavailable ? (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              UNAVAILABLE
            </span>
          ) : (
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${getStatusColor(overview.status)}`}>
              <span className={`w-2 h-2 rounded-full ${overview.status === 'NORMAL' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`}></span>
              SYSTEM STATE: {overview.status}
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={refreshing || loading}
            title="Refresh Anomaly Data"
            className="px-3 py-1.5 text-[12px] font-semibold bg-white hover:bg-[#F2FAFB] text-[#102A2E] border border-[rgba(16,42,46,0.12)] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading ? (
        <div className="bg-app-surface border border-app-border rounded-xl p-8 text-center text-app-text-secondary font-sans animate-pulse flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[36px] text-amber-400 animate-spin">
            sync
          </span>
          <span className="text-[14px] font-semibold">Loading live anomaly intelligence...</span>
        </div>
      ) : isUnavailable ? (
        /* 3. Error / Unavailable Fallback State */
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-200 shadow-sm font-sans">
          <div className="flex items-start gap-3.5">
            <span className="material-symbols-outlined text-amber-400 text-[32px] shrink-0 mt-1">
              cloud_off
            </span>
            <div>
              <h3 className="text-[15px] font-bold text-amber-300">
                Live anomaly data unavailable
              </h3>
              <p className="text-[12.5px] text-amber-200/80 mt-1">
                {errorDetail || 'Anomaly detection service is unreachable or database is empty.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshClick}
            className="px-4 py-2 text-[12px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg transition-all shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* 4. CURRENT OBSERVATIONS OVERVIEW SECTION */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
              NETWORK OVERVIEW ({overview.total_stations_monitored} STATIONS)
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main Primary Card */}
              <div className="lg:col-span-4 bg-app-surface border border-app-border p-6 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                    LATEST OBSERVATION
                  </span>
                  <div className="text-[20px] font-bold text-app-text-primary leading-tight font-sans tracking-tight mt-1">
                    {new Date(overview.latest_timestamp).toLocaleString()}
                  </div>
                  <span className="text-[12px] text-app-text-secondary font-medium mt-2">
                    {overview.note}
                  </span>
                </div>
              </div>

              {/* Supporting Metrics Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* 1% Anomalies */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">warning</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      EXTREME ANOMALIES
                    </span>
                    <span className="text-[20px] font-bold text-red-400 leading-tight block">
                      {overview.anomalies_1pct} <span className="text-[14px] text-app-text-secondary">stations</span>
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Top 1% Deviation
                    </span>
                  </div>
                </div>

                {/* 5% Anomalies */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">error</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      HIGH ANOMALIES
                    </span>
                    <span className="text-[20px] font-bold text-orange-400 leading-tight block">
                      {overview.anomalies_5pct} <span className="text-[14px] text-app-text-secondary">stations</span>
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Top 5% Deviation
                    </span>
                  </div>
                </div>

                {/* 10% Anomalies */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">info</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      ELEVATED ANOMALIES
                    </span>
                    <span className="text-[20px] font-bold text-yellow-400 leading-tight block">
                      {overview.anomalies_10pct} <span className="text-[14px] text-app-text-secondary">stations</span>
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Top 10% Deviation
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. TOP ANOMALIES LIST */}
          {anomalies && anomalies.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                  RANKED STATION ANOMALIES
                </h2>
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Isolation Forest Unsupervised Score
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {anomalies.map((a, i) => (
                  <div
                    key={`${a.station_id}-${i}`}
                    className="bg-app-surface border border-app-border p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-app-border/80 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-app-border/60 pb-2">
                      <span className="text-[14px] font-bold text-app-text-primary font-sans flex items-center gap-1.5">
                         <span className="material-symbols-outlined text-[16px] text-sky-400">pin_drop</span>
                        {a.station_id}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${getAnomalyColor(a)}`}>
                        {getAnomalyStateText(a)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-app-text-secondary font-mono block">
                          SCORE
                        </span>
                        <span className="text-[14px] font-bold text-app-text-primary block">
                          {a.anomaly_score.toFixed(4)}
                        </span>
                    </div>

                    <div className="flex flex-col gap-1.5 bg-slate-500/5 p-2 rounded-lg border border-slate-500/10">
                      <div className="flex items-center justify-between text-[11px]">
                         <span className="text-app-text-muted font-semibold">24h Rainfall</span>
                         <span className="text-app-text-primary font-bold">{a.features.rain_24h} mm</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                         <span className="text-app-text-muted font-semibold">Surface Soil Moisture</span>
                         <span className="text-app-text-primary font-bold">{a.features.surface_soil_moisture}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                         <span className="text-app-text-muted font-semibold">Elevation</span>
                         <span className="text-app-text-primary font-bold">{a.features.elevation} m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SCIENTIFIC INTEGRITY DISCLAIMER (PHASE 8 REQUIREMENT) */}
          <div className="bg-white/80 border border-blue-500/20 p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm mt-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-500 text-[24px] shrink-0 mt-0.5">
                science
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                  SCIENTIFIC DISCLAIMER: ANOMALY VS PREDICTION
                </h3>
                <p className="text-[12px] font-medium text-app-text-secondary mt-0.5">
                  This page displays <strong>model-derived environmental anomalies</strong> (deviations from typical weather patterns).
                  <br />
                  <strong>IMPORTANT:</strong> Do not interpret anomaly scores as validated flood probabilities. 
                  Supervised operational flood forecasting is currently in <strong>STANDBY</strong>.
                </p>
              </div>
            </div>

            <div className="text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 shrink-0 italic uppercase">
              NOT VALIDATED FLOOD PREDICTION
            </div>
          </div>
        </>
      )}
    </div>
  );
}
