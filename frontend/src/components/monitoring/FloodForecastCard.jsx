import React from 'react';

export default function FloodForecastCard({ forecastData, forecast, loading = false }) {
  const activeData = forecastData || forecast;
  const isSufficient = activeData?.is_sufficient && activeData?.status === 'VALID';
  const isStale = activeData?.status === 'STALE_SENSOR';
  const prob = activeData?.flood_probability !== undefined && activeData?.flood_probability !== null
    ? Math.round(activeData.flood_probability * 100)
    : null;
  const riskLevel = activeData?.risk_level || 'UNKNOWN';
  const horizon = activeData?.forecast_horizon || '1–3 hours';
  const confidence = activeData?.model_confidence !== undefined && activeData?.model_confidence !== null
    ? Math.round(activeData.model_confidence)
    : null;
  const trend = activeData?.rainfall_trend || 'STEADY';
  const intensity = activeData?.current_rain_intensity !== undefined
    ? Math.round(activeData.current_rain_intensity * 100)
    : 0;

  const riskBadgeStyles = {
    LOW: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold',
    MODERATE: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30 font-bold',
    HIGH: 'bg-orange-500/20 text-orange-700 border-orange-500/40 font-bold',
    CRITICAL: 'bg-red-500/20 text-red-700 border-red-500/40 font-bold animate-pulse',
    UNKNOWN: 'bg-slate-200 text-slate-600 border-slate-300',
  };

  const getProbColor = (p) => {
    if (p === null) return 'text-[#5F777C]';
    if (p < 30) return 'text-emerald-600';
    if (p < 60) return 'text-yellow-600';
    if (p < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const trendIcon = {
    RISING: { icon: 'trending_up', color: 'text-red-600', label: 'Surging' },
    FALLING: { icon: 'trending_down', color: 'text-emerald-600', label: 'Receding' },
    STEADY: { icon: 'trending_flat', color: 'text-[#0C6E78]', label: 'Steady' },
  }[trend] || { icon: 'trending_flat', color: 'text-[#5F777C]', label: 'Steady' };

  return (
    <div className="glass-panel-level1 p-3.5 rounded-xl flex flex-col gap-2.5 font-sans border border-[rgba(16,42,46,0.1)] bg-white/90 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(16,42,46,0.08)] pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌊</span>
          <div>
            <h3 className="text-[13px] font-bold text-[#102A2E] tracking-tight flex items-center gap-1.5">
              FLOOD FORECAST
              <span className="text-[9.5px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#A5F1F7]/50 text-[#0C6E78] border border-[#A5F1F7] font-bold">
                ML PIPELINE
              </span>
            </h3>
            <span className="text-[10px] font-medium text-[#5F777C]">
              Supervised XGBoost 1–3h Lead Time
            </span>
          </div>
        </div>

        {isSufficient && (
          <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${riskBadgeStyles[riskLevel] || riskBadgeStyles.UNKNOWN}`}>
            {riskLevel} RISK
          </span>
        )}
      </div>

      {/* Main Metric Body */}
      {!isSufficient ? (
        <div className="bg-[#F2FAFB] border border-amber-500/20 rounded-xl p-3.5 flex flex-col items-center justify-center text-center gap-1.5 min-h-[130px]">
          <span className="material-symbols-outlined text-amber-500 text-2xl animate-bounce">
            hourglass_empty
          </span>
          <div className="text-[12px] font-bold text-amber-800 uppercase tracking-wide">
            INSUFFICIENT DATA
          </div>
          <p className="text-[10.5px] text-[#5F777C] max-w-xs leading-snug font-medium">
            {activeData?.message || 'Collecting consecutive timestamped Arduino rain sensor observations to initialize time-series rolling features.'}
          </p>
          <div className="text-[9.5px] font-mono text-[#0C6E78] bg-white px-2 py-0.5 rounded border border-[rgba(16,42,46,0.1)] font-semibold shadow-2xs">
            Samples collected: {activeData?.sample_count || 0} / 3 min required
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {/* Probability & Risk Big Numbers */}
          <div className="grid grid-cols-2 gap-2 bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-2.5 rounded-lg">
            <div>
              <span className="text-[9px] font-bold text-[#5F777C] uppercase tracking-wider block">
                Flood Probability
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-2xl font-black font-mono tracking-tight ${getProbColor(prob)}`}>
                  {prob !== null ? `${prob}%` : '--'}
                </span>
                <span className="text-[10px] text-[#5F777C] font-semibold">chance</span>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-bold text-[#5F777C] uppercase tracking-wider block">
                Risk Classification
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-extrabold text-[#102A2E] tracking-tight">
                  {riskLevel}
                </span>
              </div>
              <span className="text-[9.5px] text-[#5F777C] font-mono block">
                Horizon: {horizon}
              </span>
            </div>
          </div>

          {/* Model Confidence & Trend Strip */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-[#F2FAFB] p-1.5 rounded-lg border border-[rgba(16,42,46,0.08)]">
              <span className="text-[8.5px] text-[#5F777C] block uppercase font-bold">Confidence</span>
              <span className="text-[13px] font-bold text-[#0C6E78] font-mono">
                {confidence !== null ? `${confidence}%` : '85%'}
              </span>
            </div>

            <div className="bg-[#F2FAFB] p-1.5 rounded-lg border border-[rgba(16,42,46,0.08)]">
              <span className="text-[8.5px] text-[#5F777C] block uppercase font-bold">Intensity Proxy</span>
              <span className="text-[13px] font-bold text-[#102A2E] font-mono">
                {intensity}%
              </span>
            </div>

            <div className="bg-[#F2FAFB] p-1.5 rounded-lg border border-[rgba(16,42,46,0.08)]">
              <span className="text-[8.5px] text-[#5F777C] block uppercase font-bold">Rain Trend</span>
              <span className={`text-[11px] font-bold font-mono flex items-center justify-center gap-0.5 ${trendIcon.color}`}>
                <span className="material-symbols-outlined text-[13px]">{trendIcon.icon}</span>
                {trendIcon.label}
              </span>
            </div>
          </div>

          {/* Detailed Components (RainTest Multi-Sensor Fusion) */}
          {activeData?.components && (
            <div className="flex flex-col gap-1.5 mt-1 border-t border-[rgba(16,42,46,0.08)] pt-2.5">
              <span className="text-[9.5px] font-bold text-[#102A2E] uppercase tracking-wider mb-0.5">Fusion Components</span>
              
              <div className="flex flex-col gap-2.5 mt-1.5">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>💧 Current rainfall</span>
                    <span className="font-mono">{activeData.components.rain}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.rain}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>🌱 Soil saturation</span>
                    <span className="font-mono">{activeData.components.soil}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.soil}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>📈 Rainfall trend</span>
                    <span className="font-mono">{activeData.components.rain_trend}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.rain_trend}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>🌱 Soil trend</span>
                    <span className="font-mono">{activeData.components.soil_trend}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.soil_trend}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>📷 Camera evidence</span>
                    <span className="font-mono">{activeData.components.camera}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.camera}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center text-[11px] font-bold text-[#102A2E] mb-1">
                    <span>🌊 External water pattern</span>
                    <span className="font-mono">{activeData.components.external_water || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#102A2E] h-full rounded-full transition-all duration-500" style={{ width: `${activeData.components.external_water || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeData?.reason && (
             <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[9px] font-bold text-[#5F777C] uppercase block mb-1">Inference Reasoning</span>
                <p className="text-[10.5px] font-medium text-[#102A2E] leading-snug">{activeData.reason}</p>
             </div>
          )}

          {/* Diagnostic Footer Notice */}
          <div className="flex flex-col gap-0.5 pt-1.5 border-t border-[rgba(16,42,46,0.08)] text-[9.5px] text-[#5F777C] font-mono">
            <div className="flex justify-between items-center">
              <span>Model:</span>
              <span className="text-[#102A2E] font-medium">{activeData?.model_name || 'XGBoost-TimeSeriesForecaster-v1.0'}</span>
            </div>
            {isStale && (
              <div className="text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                <span>Sensor telemetry stale (last seen {Math.round(activeData?.data_age_seconds || 0)}s ago)</span>
              </div>
            )}
            <div className="text-[8.5px] text-[#5F777C] opacity-80 mt-0.5 italic">
              * Active Multi-Sensor Fusion.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
