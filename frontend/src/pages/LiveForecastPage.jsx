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
import weatherService from '../services/weatherService';
import stationsService from '../services/stationsService';

// Standard fallback locations across Uttarakhand
const DEFAULT_LOCATIONS = [
  { name: 'Uttarakhand Region (Statewide)', lat: 30.0668, lon: 79.0193, district: 'Statewide' },
  { name: 'Rishikesh (Ganga Basin)', lat: 30.108, lon: 78.298, district: 'Dehradun' },
  { name: 'Joshimath (Alaknanda Basin)', lat: 30.556, lon: 79.568, district: 'Chamoli' },
  { name: 'Uttarkashi (Bhagirathi Basin)', lat: 30.727, lon: 78.435, district: 'Uttarkashi' },
  { name: 'Rudraprayag (Mandakini Basin)', lat: 30.285, lon: 78.981, district: 'Rudraprayag' },
  { name: 'Haridwar (Ganga Plain)', lat: 29.945, lon: 78.164, district: 'Haridwar' },
  { name: 'Dharchula (Kali Basin)', lat: 29.851, lon: 80.542, district: 'Pithoragarh' },
  { name: 'Dehradun City (Bindal AWS)', lat: 30.316, lon: 78.032, district: 'Dehradun' },
];

export default function LiveForecastPage() {
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [selectedLocIndex, setSelectedLocIndex] = useState(0);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorDetail, setErrorDetail] = useState(null);

  // Load monitoring stations to populate location selector dynamically
  useEffect(() => {
    async function loadStationsForSelector() {
      try {
        const res = await stationsService.getStations();
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.map((st) => ({
            name: `${st.station_name} (${st.river_name || 'Catchment'})`,
            lat: st.latitude,
            lon: st.longitude,
            district: st.district || 'Uttarakhand',
          }));
          setLocations([DEFAULT_LOCATIONS[0], ...mapped]);
        }
      } catch (e) {
        console.warn('[LiveForecastPage] Failed to load stations list for selector:', e);
      }
    }
    loadStationsForSelector();
  }, []);

  const activeLoc = locations[selectedLocIndex] || DEFAULT_LOCATIONS[0];

  const fetchWeather = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorDetail(null);

      const [currentRes, forecastRes] = await Promise.all([
        weatherService.getCurrentWeather(activeLoc.lat, activeLoc.lon, activeLoc.name),
        weatherService.getWeatherForecast(activeLoc.lat, activeLoc.lon, activeLoc.name),
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
      console.warn('[LiveForecastPage] Error fetching weather:', err);
      setErrorDetail('Failed to retrieve live weather from backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeLoc]);

  useEffect(() => {
    fetchWeather();
    const timer = setInterval(() => {
      fetchWeather();
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchWeather]);

  const handleRefreshClick = () => {
    fetchWeather(true);
  };

  const getWeatherIconUrl = (code) => {
    if (!code) return null;
    return `https://openweathermap.org/img/wn/${code}@2x.png`;
  };

  const isUnavailable = !currentWeather || !currentWeather.success;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-app-text-primary tracking-tight font-sans flex items-center gap-2.5">
            <span className="material-symbols-outlined text-sky-400 text-[26px]">
              cloud_sync
            </span>
            LIVE FORECAST
          </h1>
          <p className="text-[12px] font-medium text-app-text-secondary mt-0.5">
            Real-time atmospheric observations and forecast intelligence
          </p>
        </div>

        {/* Controls & Location Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Dropdown */}
          <div className="flex items-center gap-1.5 bg-app-surface border border-app-border px-3 py-1.5 rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-sky-400 text-[18px]">
              location_on
            </span>
            <select
              value={selectedLocIndex}
              onChange={(e) => setSelectedLocIndex(Number(e.target.value))}
              className="bg-transparent text-[12.5px] font-semibold text-app-text-primary outline-none cursor-pointer font-sans"
            >
              {locations.map((loc, idx) => (
                <option key={idx} value={idx} className="bg-white text-[#102A2E]">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Badge */}
          {isUnavailable ? (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              UNAVAILABLE
            </span>
          ) : currentWeather?.is_stale ? (
            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              CACHED (STALE)
            </span>
          ) : (
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE (OPENWEATHER)
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefreshClick}
            disabled={refreshing || loading}
            title="Refresh OpenWeather Data"
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
          <span className="material-symbols-outlined text-[36px] text-sky-400 animate-spin">
            sync
          </span>
          <span className="text-[14px] font-semibold">Loading live forecast intelligence...</span>
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
                Live weather unavailable
              </h3>
              <p className="text-[12.5px] text-amber-200/80 mt-1">
                {errorDetail || 'OpenWeather service is not configured or temporarily unreachable from the backend.'}
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
          {/* 4. CURRENT CONDITIONS SECTION */}
          <div className="flex flex-col gap-3">
            <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
              CURRENT CONDITIONS
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Main Primary Temperature Card */}
              <div className="lg:col-span-4 bg-app-surface border border-app-border p-6 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                    {currentWeather.location_name}
                  </span>
                  <div className="text-[42px] font-bold text-app-text-primary leading-tight font-sans tracking-tight mt-1">
                    {currentWeather.temp_c}°C
                  </div>
                  <span className="text-[15px] font-semibold text-app-text-primary mt-0.5">
                    {currentWeather.condition} — {currentWeather.description}
                  </span>
                  <span className="text-[12px] text-app-text-secondary font-medium mt-1">
                    Feels like {currentWeather.feels_like_c}°C
                  </span>
                </div>

                {currentWeather.icon && (
                  <img
                    src={getWeatherIconUrl(currentWeather.icon)}
                    alt={currentWeather.condition}
                    className="w-24 h-24 shrink-0 drop-shadow-md"
                  />
                )}
              </div>

              {/* Supporting Metrics Grid */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Humidity */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">water_drop</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      HUMIDITY
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.humidity_pct}%
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Relative Humidity
                    </span>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">compress</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      PRESSURE
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.pressure_hpa} hPa
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Atmospheric Pressure
                    </span>
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">air</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      WIND SPEED
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.wind_speed_kmh} km/h
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Direction {currentWeather.wind_deg}°
                    </span>
                  </div>
                </div>

                {/* Cloud Cover */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-[#A5F1F7]/20 text-[#102A2E] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">cloud</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      CLOUD COVER
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.cloud_cover_pct}%
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Sky Coverage
                    </span>
                  </div>
                </div>

                {/* Rainfall */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">rainy</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      RAINFALL (1H)
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.rainfall_1h_mm} mm
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      {currentWeather.rainfall_1h_mm > 25 ? 'Heavy Rain' : currentWeather.rainfall_1h_mm > 5 ? 'Moderate' : 'Light / Dry'}
                    </span>
                  </div>
                </div>

                {/* Visibility */}
                <div className="bg-app-surface border border-app-border p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">visibility</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">
                      VISIBILITY
                    </span>
                    <span className="text-[20px] font-bold text-app-text-primary leading-tight block">
                      {currentWeather.visibility_km ? `${currentWeather.visibility_km} km` : 'Standard'}
                    </span>
                    <span className="text-[11px] text-app-text-secondary truncate block mt-0.5">
                      Atmospheric Sight
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. 24-HOUR FORECAST (3-Hour Steps Timeline) */}
          {forecast && forecast.hourly && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                  24-HOUR FORECAST (3-HOUR FORECAST STEPS)
                </h2>
                <span className="text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  OpenWeather 3-Hour Interval Steps
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {forecast.hourly.map((h, i) => (
                  <div
                    key={i}
                    className="bg-app-surface border border-app-border p-3.5 rounded-xl flex flex-col items-center text-center justify-between gap-1.5 shadow-sm hover:border-app-border/80 transition-all"
                  >
                    <span className="text-[12px] font-bold text-app-text-primary font-mono">
                      {h.time_label}
                    </span>

                    {h.icon ? (
                      <img
                        src={getWeatherIconUrl(h.icon)}
                        alt={h.condition}
                        className="w-10 h-10 my-0.5"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-sky-400 my-1">
                        cloud
                      </span>
                    )}

                    <span className="text-[15px] font-bold text-app-text-primary">
                      {h.temp_c}°C
                    </span>

                    <span className="text-[11px] font-medium text-app-text-secondary truncate max-w-full">
                      {h.condition}
                    </span>

                    <span className="text-[10.5px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 mt-1">
                      {h.pop_pct}% rain
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. PRECIPITATION OUTLOOK CHART (Recharts) */}
          {forecast && forecast.hourly && (
            <div className="bg-app-surface border border-app-border p-5 rounded-xl flex flex-col gap-3 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-[20px]">
                    bar_chart
                  </span>
                  PRECIPITATION OUTLOOK
                </h2>
                <span className="text-[11px] font-medium text-app-text-secondary">
                  Forecast Rain Probability (%) & Volume (mm)
                </span>
              </div>

              <div className="w-full h-[220px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecast.hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="time_label" stroke="#94a3b8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#38bdf8" fontSize={11} unit="%" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={11} unit="mm" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(16,42,46,0.12)',
                        borderRadius: '8px',
                        color: '#102A2E',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Bar yAxisId="right" dataKey="rainfall_3h_mm" name="Rainfall (3h mm)" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="left" type="monotone" dataKey="pop_pct" name="Rain Probability (%)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 7. 5-DAY DAILY FORECAST */}
          {forecast && forecast.daily && (
            <div className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                5-DAY FORECAST
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {forecast.daily.map((d, i) => (
                  <div
                    key={i}
                    className="bg-app-surface border border-app-border p-4 rounded-xl flex flex-col justify-between gap-3 shadow-sm hover:border-app-border/80 transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-app-border/60 pb-2">
                      <span className="text-[13px] font-bold text-app-text-primary uppercase font-sans">
                        {d.day_label}
                      </span>
                      <span className="text-[11px] font-mono text-app-text-muted">
                        {d.date}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <span className="text-[14px] font-bold text-app-text-primary block">
                          {d.condition}
                        </span>
                        <span className="text-[11px] text-app-text-secondary block mt-0.5">
                          {d.description}
                        </span>
                      </div>
                      {d.icon && (
                        <img
                          src={getWeatherIconUrl(d.icon)}
                          alt={d.condition}
                          className="w-12 h-12 shrink-0"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-app-border/60">
                      <div>
                        <span className="text-[10px] font-bold text-app-text-muted block">TEMP RANGE</span>
                        <span className="text-[14px] font-bold text-app-text-primary">
                          {d.temp_max_c}° <span className="text-[12px] font-normal text-app-text-secondary">/ {d.temp_min_c}°C</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-app-text-muted block">PRECIPITATION</span>
                        <span className="text-[12px] font-bold text-blue-400">
                          {d.pop_pct}% {d.rainfall_total_mm > 0 ? `(${d.rainfall_total_mm}mm)` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. WEATHER INTELLIGENCE & OBSERVATIONAL DISCLAIMER */}
          <div className="bg-white/80 border border-[rgba(16,42,46,0.12)] p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-400 text-[24px] shrink-0 mt-0.5">
                warning
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-app-text-primary uppercase tracking-wider font-sans">
                  WEATHER INTELLIGENCE
                </h3>
                <p className="text-[12px] font-medium text-app-text-secondary mt-0.5">
                  Current atmospheric conditions from OpenWeather observations.
                  {currentWeather.rainfall_1h_mm > 10
                    ? ' Heavier precipitation conditions may contribute to elevated flood risk.'
                    : ' Light/dry atmospheric conditions currently observed across this catchment.'}
                </p>
              </div>
            </div>

            <div className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0 italic">
              OBSERVATIONAL CONTEXT — Does not replace the Jal Drishti ML/Physics flood-risk model.
            </div>
          </div>
        </>
      )}

      {/* 9. DATA SOURCE & TIMESTAMP FOOTER */}
      <div className="border-t border-app-border pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] font-sans text-app-text-muted">
        <div className="flex items-center gap-2">
          <span>Weather Source:</span>
          <strong className="text-app-text-primary font-bold">OpenWeather</strong>
        </div>

        {currentWeather?.last_updated_time && (
          <div>
            Last successful update: <span className="font-mono font-semibold text-app-text-secondary">{currentWeather.last_updated_time}</span>
          </div>
        )}

        <div>
          Status: <strong className="text-emerald-400 font-bold">{isUnavailable ? 'UNAVAILABLE' : currentWeather?.is_stale ? 'CACHED' : 'LIVE'}</strong>
        </div>
      </div>
    </div>
  );
}
