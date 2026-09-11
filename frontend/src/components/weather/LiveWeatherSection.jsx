import React, { useState, useEffect, useCallback } from 'react';
import weatherService from '../../services/weatherService';

export default function LiveWeatherSection({
  lat = 30.0668,
  lon = 79.0193,
  locationName = 'Uttarakhand Region',
  autoRefreshMinutes = 15,
}) {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  const fetchWeatherData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorDetail(null);

      const [currentRes, forecastRes] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon, locationName),
        weatherService.getWeatherForecast(lat, lon, locationName),
      ]);

      if (currentRes && currentRes.success) {
        setCurrentWeather(currentRes);
      } else {
        setCurrentWeather(null);
        setErrorDetail(currentRes?.detail || 'Live weather data is currently unavailable.');
      }

      if (forecastRes && forecastRes.success) {
        setForecast(forecastRes);
      } else {
        setForecast(null);
      }
    } catch (err) {
      console.warn('[LiveWeatherSection] Fetch error:', err);
      setErrorDetail('Failed to load weather data from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lat, lon, locationName]);

  useEffect(() => {
    fetchWeatherData();

    // Auto-refresh interval (default 15 mins)
    const intervalMs = Math.max(autoRefreshMinutes, 5) * 60 * 1000;
    const timer = setInterval(() => {
      fetchWeatherData();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [fetchWeatherData, autoRefreshMinutes]);

  const handleRefreshClick = () => {
    fetchWeatherData(true);
  };

  // Weather condition icon helper
  const getWeatherIconUrl = (iconCode) => {
    if (!iconCode) return null;
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  if (loading) {
    return (
      <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-sm font-sans animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-slate-200/80 rounded w-48"></div>
          <div className="h-4 bg-slate-200/80 rounded w-24"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const isUnavailable = !currentWeather || !currentWeather.success;

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-sm font-sans flex flex-col gap-4">
      {/* 1. Header Bar: Location, Status Badge, Last Update & Refresh Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-500 text-[20px]">
            location_on
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-app-text-primary uppercase tracking-tight">
                LIVE WEATHER
              </h2>
              <span className="text-[11px] font-semibold text-[#102A2E] bg-[#A5F1F7]/40 px-2 py-0.5 rounded border border-[#A5F1F7]">
                {currentWeather?.location_name || locationName}
              </span>
            </div>
            <span className="text-[11px] font-medium text-app-text-secondary">
              Real-time atmospheric observations & forecast
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Status Badge */}
          {isUnavailable ? (
            <span className="text-[10.5px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              UNAVAILABLE
            </span>
          ) : currentWeather?.is_stale ? (
            <span className="text-[10.5px] font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              CACHED (STALE)
            </span>
          ) : (
            <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE (OPENWEATHER)
            </span>
          )}

          {/* Last Updated Timestamp */}
          {currentWeather?.last_updated_time && (
            <span className="text-[11px] font-mono text-app-text-muted hidden sm:inline">
              Updated: {currentWeather.last_updated_time}
            </span>
          )}

          {/* Manual Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            title="Refresh Live Weather Data"
            className="p-1.5 rounded-lg bg-white hover:bg-[#F2FAFB] text-[#102A2E] border border-[rgba(16,42,46,0.12)] transition-all flex items-center justify-center disabled:opacity-50 shadow-xs"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* 2. Error / Fallback Card if Weather Service Unavailable */}
      {isUnavailable ? (
        <div className="bg-amber-50/80 border border-amber-500/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 text-[24px] shrink-0 mt-0.5">
              cloud_off
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-amber-900 font-sans">
                Live weather unavailable
              </h3>
              <p className="text-[11.5px] text-amber-800/80 mt-0.5 font-sans">
                {errorDetail || 'OpenWeather service is not configured or temporarily unreachable.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefreshClick}
            className="px-3 py-1.5 text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-500/30 rounded transition-all shrink-0 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <>
          {/* 3. Current Conditions Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Temperature */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              {currentWeather.icon ? (
                <img
                  src={getWeatherIconUrl(currentWeather.icon)}
                  alt={currentWeather.condition}
                  className="w-10 h-10 shrink-0"
                />
              ) : (
                <span className="material-symbols-outlined text-amber-500 text-[26px] shrink-0">
                  thermostat
                </span>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  TEMPERATURE
                </span>
                <span className="text-[20px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.temp_c}°C
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  Feels like {currentWeather.feels_like_c}°C
                </span>
              </div>
            </div>

            {/* Condition */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  cloud
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  CONDITION
                </span>
                <span className="text-[14px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.condition}
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  {currentWeather.description}
                </span>
              </div>
            </div>

            {/* Rainfall */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  rainy
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  RAINFALL (1H)
                </span>
                <span className="text-[20px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.rainfall_1h_mm} mm
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  {currentWeather.rainfall_1h_mm > 25 ? 'Heavy Rain' : currentWeather.rainfall_1h_mm > 5 ? 'Moderate' : 'Light / Dry'}
                </span>
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#A5F1F7]/30 text-[#102A2E] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  water_drop
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  HUMIDITY
                </span>
                <span className="text-[20px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.humidity_pct}%
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  Relative Humidity
                </span>
              </div>
            </div>

            {/* Wind */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  air
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  WIND SPEED
                </span>
                <span className="text-[20px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.wind_speed_kmh} km/h
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  Direction {currentWeather.wind_deg}°
                </span>
              </div>
            </div>

            {/* Pressure / Visibility */}
            <div className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] p-3.5 rounded-lg flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">
                  compress
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                  PRESSURE
                </span>
                <span className="text-[20px] font-bold text-app-text-primary leading-tight block truncate">
                  {currentWeather.pressure_hpa} hPa
                </span>
                <span className="text-[10.5px] text-app-text-secondary truncate block">
                  {currentWeather.visibility_km ? `Vis ${currentWeather.visibility_km} km` : 'Clouds ' + currentWeather.cloud_cover_pct + '%'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Forecast Section: Hourly (24h / 8 intervals) & Daily (4-5 days) */}
          {forecast && forecast.success && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-1 border-t border-app-border pt-4">
              {/* Left Column: Hourly Forecast (Next 24h) */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                    HOURLY FORECAST (NEXT 24H)
                  </h3>
                  <span className="text-[10.5px] text-app-text-muted">
                    3-Hour Forecast Steps
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 overflow-x-auto">
                  {forecast.hourly && forecast.hourly.map((h, i) => (
                    <div
                      key={i}
                      className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] rounded-lg p-2 flex flex-col items-center justify-between text-center min-w-[65px]"
                    >
                      <span className="text-[10.5px] font-bold text-app-text-secondary">
                        {h.time_label}
                      </span>
                      {h.icon ? (
                        <img
                          src={getWeatherIconUrl(h.icon)}
                          alt={h.condition}
                          className="w-8 h-8 my-0.5"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-[20px] text-sky-500 my-1">
                          cloud
                        </span>
                      )}
                      <span className="text-[13px] font-bold text-app-text-primary">
                        {h.temp_c}°C
                      </span>
                      <span className="text-[9.5px] font-semibold text-blue-600 mt-0.5">
                        {h.pop_pct}% rain
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Daily Forecast (4-5 Days) */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                <h3 className="text-[12px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                  5-DAY DAILY FORECAST
                </h3>
                <div className="flex flex-col gap-1.5">
                  {forecast.daily && forecast.daily.map((d, i) => (
                    <div
                      key={i}
                      className="bg-[#F2FAFB] border border-[rgba(16,42,46,0.08)] rounded-lg px-3 py-2 flex items-center justify-between text-sans"
                    >
                      <div className="w-24 shrink-0">
                        <span className="text-[11.5px] font-bold text-app-text-primary block leading-tight">
                          {d.day_label}
                        </span>
                        <span className="text-[10px] text-app-text-muted block">
                          {d.condition}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {d.icon && (
                          <img
                            src={getWeatherIconUrl(d.icon)}
                            alt={d.condition}
                            className="w-7 h-7"
                          />
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[12px] font-bold text-app-text-primary">
                          {d.temp_max_c}° <span className="text-app-text-muted font-normal text-[11px]">/ {d.temp_min_c}°C</span>
                        </span>
                        <div className="text-[10px] font-semibold text-blue-600">
                          {d.pop_pct}% rain {d.rainfall_total_mm > 0 ? `(${d.rainfall_total_mm}mm)` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. Footer: Data Source Attribution & Contextual Disclaimer */}
      <div className="border-t border-app-border/80 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-app-text-muted">
          <span className="material-symbols-outlined text-[14px] text-sky-500">
            info
          </span>
          <span>
            Weather Source: <strong className="text-app-text-secondary font-semibold">OpenWeather</strong>
          </span>
        </div>

        <div className="text-[10.5px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 italic">
          Context: Heavy precipitation conditions may contribute to elevated flood risk. (Observational Weather Context — Does not replace Jal Drishti ML/Physics Model)
        </div>
      </div>
    </div>
  );
}
