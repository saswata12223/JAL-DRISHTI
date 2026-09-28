import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../../context/LocationContext';
import gisService from '../../services/gisService';
import { SEARCH_INDEX } from '../../utils/stateCoordinates';

// Uttarakhand monitoring stations (historical ML coverage)
const UK_STATIONS = [
  { id: 'CWC_UK_001', name: 'Joshimath', district: 'Chamoli', river: 'Alaknanda', lat: 30.556, lon: 79.568, risk: 'EXTREME', prob: 0.94 },
  { id: 'CWC_UK_002', name: 'Rishikesh', district: 'Dehradun', river: 'Ganga', lat: 30.108, lon: 78.298, risk: 'HIGH', prob: 0.68 },
  { id: 'CWC_UK_003', name: 'Uttarkashi', district: 'Uttarkashi', river: 'Bhagirathi', lat: 30.727, lon: 78.435, risk: 'HIGH', prob: 0.72 },
  { id: 'CWC_UK_004', name: 'Rudraprayag', district: 'Rudraprayag', river: 'Mandakini', lat: 30.285, lon: 78.981, risk: 'EXTREME', prob: 0.91 },
  { id: 'CWC_UK_005', name: 'Srinagar', district: 'Pauri Garhwal', river: 'Alaknanda', lat: 30.221, lon: 78.784, risk: 'HIGH', prob: 0.65 },
  { id: 'CWC_UK_006', name: 'Devprayag', district: 'Tehri Garhwal', river: 'Ganga', lat: 30.146, lon: 78.598, risk: 'MODERATE', prob: 0.35 },
  { id: 'CWC_UK_007', name: 'Haridwar', district: 'Haridwar', river: 'Ganga', lat: 29.945, lon: 78.164, risk: 'LOW', prob: 0.12 },
  { id: 'CWC_UK_008', name: 'Dharchula', district: 'Pithoragarh', river: 'Kali', lat: 29.851, lon: 80.542, risk: 'EXTREME', prob: 0.88 },
];

function MapFlyTo({ state, district, boundaries }) {
  const map = useMap();
  useEffect(() => {
    if (state && boundaries && state !== 'Uttarakhand') {
      const feature = boundaries.features?.find(f => (f.properties?.ST_NM || f.properties?.NAME_1) === state);
      if (feature) {
        const bounds = L.geoJSON(feature).getBounds();
        map.fitBounds(bounds, { padding: [50, 50], duration: 1.2 });
        return;
      }
    }
    
    if (district === 'Dehradun' || state === 'Uttarakhand' && district) {
      map.flyTo([30.3, 78.5], 9, { duration: 1.2 });
    } else if (state === 'Uttarakhand') {
      map.flyTo([30.15, 79.2], 8, { duration: 1.2 });
    } else if (state) {
      // Find the state in SEARCH_INDEX to fly to its coordinates
      const stateInfo = SEARCH_INDEX.find(s => s.label === state);
      if (stateInfo) {
        map.flyTo([stateInfo.lat, stateInfo.lon], 7, { duration: 1.2 });
      } else {
        map.flyTo([22.5, 82.0], 5, { duration: 1.0 });
      }
    } else {
      map.flyTo([22.5, 82.0], 5, { duration: 1.0 });
    }
  }, [state, district, map, boundaries]);
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5 pointer-events-auto">
      <button onClick={() => map.zoomIn()} className="w-8 h-8 bg-white/95 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center shadow-sm transition-all text-[16px] font-bold">+</button>
      <button onClick={() => map.zoomOut()} className="w-8 h-8 bg-white/95 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center shadow-sm transition-all text-[16px] font-bold">−</button>
      <button onClick={() => map.flyTo([22.5, 82.0], 5)} className="w-8 h-8 bg-white/95 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-center shadow-sm transition-all" title="Fit India">
        <span className="material-symbols-outlined text-[15px]">my_location</span>
      </button>
    </div>
  );
}

export default function IndiaExplorerMap({ stations = [], onSelectStation }) {
  const { selectedState, selectedDistrict, selectState, selectDistrict, capabilities } = useLocation();
  const [boundaries, setBoundaries] = useState(null);
  const [loadingBounds, setLoadingBounds] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [map, setMap] = useState(null);

  // Environment Data State
  const [envData, setEnvData] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [activeMarker, setActiveMarker] = useState(null);

  const handleMarkerClick = async (st) => {
    if (onSelectStation) onSelectStation(st);
    setActiveMarker(st);
    setEnvLoading(true);
    setEnvError(null);
    setEnvData(null);
    try {
      const lat = st.lat;
      const lon = st.lon;
      const response = await fetch(`/api/environment?lat=${lat}&lon=${lon}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setEnvData(data);
    } catch (err) {
      console.error("Failed to fetch environment data:", err);
      setEnvError("Unable to fetch Open-Meteo data. Please try again.");
    } finally {
      setEnvLoading(false);
    }
  };

  // Load GIS boundaries from SOI backend
  useEffect(() => {
    async function loadBoundaries() {
      try {
        const data = await gisService.resolveAdminContext(22.5, 82.0);
        // Attempt to load state boundaries geojson from API
        const res = await fetch('/api/v1/gis/admin/boundaries?level=state');
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.geojson) setBoundaries(json.data.geojson);
        }
      } catch (e) {
        console.warn('Boundary load failed:', e);
      } finally {
        setLoadingBounds(false);
      }
    }
    loadBoundaries();
  }, []);

  const stateStyle = useCallback((feature) => {
    const stateName = feature?.properties?.ST_NM || feature?.properties?.NAME_1 || '';
    const isSelected = stateName === selectedState;
    const isUttarakhand = true;
    return {
      fillColor: isSelected ? '#0ea5e9' : isUttarakhand ? '#0284c7' : '#cbd5e1',
      fillOpacity: isSelected ? 0.35 : isUttarakhand ? 0.2 : 0.12,
      color: isSelected ? '#0369a1' : isUttarakhand ? '#0284c7' : '#94a3b8',
      weight: isSelected ? 2 : 1,
    };
  }, [selectedState]);

  const onEachState = useCallback((feature, layer) => {
    const stateName = feature?.properties?.ST_NM || feature?.properties?.NAME_1 || '';
    if (!stateName) return;

    layer.on('click', () => selectState(stateName));
    layer.on('mouseover', (e) => {
      e.target.setStyle({ fillOpacity: 0.45, weight: 2 });
      layer.bindTooltip(`<div class="text-[11px] font-bold">${stateName}</div>`, { permanent: false, direction: 'top' }).openTooltip();
    });
    layer.on('mouseout', (e) => {
      e.target.setStyle(stateStyle(feature));
      layer.closeTooltip();
    });
  }, [selectState, stateStyle]);

  // Active stations logic to include all states
  const activeStations = (() => {
    const baseStations = stations.length > 0 ? stations : UK_STATIONS;
    const otherStations = SEARCH_INDEX.filter(s => s.state !== 'Uttarakhand' && s.type !== 'State').map(s => ({
      id: `LOC_${s.label.replace(/\s+/g, '_')}`,
      name: s.label,
      district: s.district || 'State Level',
      river: 'Regional Basin',
      lat: s.lat,
      lon: s.lon,
      risk: 'NORMAL',
      prob: 0.1,
      state: s.state || s.label
    }));
    
    return [...baseStations, ...otherStations];
  })();

  const filteredStations = activeStations.filter(st => {
    if (filter === 'EXTREME') return st.risk === 'EXTREME';
    if (filter === 'HIGH') return ['HIGH', 'EXTREME'].includes(st.risk);
    return true;
  });

  const showStations = true;

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs">
      {/* Top-left overlay: scope indicator */}
      <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-sm pointer-events-auto flex flex-col gap-2 min-w-[180px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
            {selectedState || 'Pan-India View'}
          </span>
        </div>
        {selectedDistrict && (
          <span className="text-[10px] text-slate-500 font-mono">→ {selectedDistrict}</span>
        )}
        {/* GIS scope badges */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          <span className="text-[9px] font-bold bg-cyan-50 border border-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded">GIS ✓</span>
          {selectedState === 'Uttarakhand' && (
            <span className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded">ML Historical ✓</span>
          )}
          {selectedState && selectedState !== 'Uttarakhand' && (
            <span className="text-[9px] font-medium bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded">ML —</span>
          )}
          <span className="text-[9px] font-medium bg-slate-50 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded">Live blocked</span>
        </div>

        {/* Station filter — only relevant for UK */}
        {showStations && activeStations.length > 0 && (
          <div className="flex items-center gap-1 pt-1 border-t border-slate-100">
            {['ALL', 'EXTREME', 'HIGH'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all ${filter === f ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                {f === 'ALL' ? 'All' : f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <MapContainer
        center={[22.5, 82.0]}
        zoom={5}
        className="w-full h-full z-0"
        zoomControl={false}
        ref={setMap}
        style={{ minHeight: 480 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OSM</a> &copy; <a href="https://carto.com">CARTO</a>'
          url={import.meta.env.VITE_CARTO_API_KEY && import.meta.env.VITE_CARTO_API_KEY !== 'cb1_2k56_1_d8f949035bf0414f5da8a77b' ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${import.meta.env.VITE_CARTO_API_KEY}` : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        />

        {/* SOI state boundaries */}
        {boundaries && (
          <GeoJSON
            key={selectedState || 'india'}
            data={boundaries}
            style={stateStyle}
            onEachFeature={onEachState}
          />
        )}

        {/* Monitoring station markers (Uttarakhand only) */}
        {filteredStations.map(st => {
          const fillColor = st.risk === 'EXTREME' ? '#DC2626' : st.risk === 'HIGH' ? '#F97316' : st.risk === 'MODERATE' ? '#D97706' : '#16A34A';
          const radius = st.risk === 'EXTREME' ? 8 : st.risk === 'HIGH' ? 6.5 : 5;
          return (
            <CircleMarker
              key={st.id}
              center={[st.lat, st.lon]}
              radius={radius}
              pathOptions={{ color: fillColor, weight: 1.5, fillColor, fillOpacity: 0.9 }}
              eventHandlers={{ click: () => handleMarkerClick(st) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-[10px] font-bold text-slate-800">
                  {st.name} · <span style={{ color: fillColor }}>{st.risk}</span>
                  <div className="text-slate-500 font-normal">Model Prob: {Math.round((st.prob || 0) * 100)}%</div>
                  <div className="text-[9px] text-amber-600 font-medium">Historical output</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        <MapFlyTo state={selectedState} district={selectedDistrict} boundaries={boundaries} />
        <MapZoomControls />
      </MapContainer>

      {/* Floating Environment Data Panel */}
      {activeMarker && (
        <div className="absolute top-4 right-14 z-[500] w-72 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-lg pointer-events-auto flex flex-col max-h-[85%] overflow-y-auto overflow-x-hidden">
          <div className="p-3 border-b border-slate-200/80 bg-slate-50/50 flex justify-between items-center sticky top-0 z-10">
            <h3 className="text-[11px] font-bold text-slate-900 tracking-wide font-sans">
              JAL DRISHTI — LOCATION DATA
            </h3>
            <button onClick={() => setActiveMarker(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
          
          <div className="p-4 space-y-4 font-sans text-slate-800">
            <div className="space-y-1">
              <h4 className="text-[12px] font-bold flex items-center gap-1">
                <span>📍</span> Location: {activeMarker.name}
              </h4>
              <div className="text-[11px] text-slate-600 font-mono ml-5">
                Latitude: {activeMarker.lat.toFixed(5)}<br/>
                Longitude: {activeMarker.lon.toFixed(5)}
              </div>
            </div>

            {envLoading && (
              <div className="text-[12px] text-cyan-700 font-medium py-4 flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                Fetching environmental data...
              </div>
            )}

            {envError && (
              <div className="text-[12px] text-red-600 font-medium py-4">
                {envError}
              </div>
            )}

            {envData && (
              <>
                <div className="text-[10px] font-medium text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 italic">
                  Note: The following is <strong>Open-Meteo environmental data</strong> (weather-model/reanalysis/forecast-derived). ESP32 sensors provide local ground measurements.
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[12px] font-bold flex items-center gap-1 border-b border-slate-100 pb-1">
                    <span>🌧️</span> CURRENT WEATHER
                  </h4>
                  <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-y-1 ml-1">
                    <span>Temperature:</span> <span className="font-semibold text-slate-800">{envData.current.temperature_2m} °C</span>
                    <span>Humidity:</span> <span className="font-semibold text-slate-800">{envData.current.relative_humidity_2m} %</span>
                    <span>Rain:</span> <span className="font-semibold text-slate-800">{envData.current.rain} mm</span>
                    <span>Precipitation:</span> <span className="font-semibold text-slate-800">{envData.current.precipitation} mm</span>
                    <span>Wind:</span> <span className="font-semibold text-slate-800">{envData.current.wind_speed_10m} km/h</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[12px] font-bold flex items-center gap-1 border-b border-slate-100 pb-1">
                    <span>🌱</span> SOIL MOISTURE
                  </h4>
                  <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-y-1 ml-1">
                    <span>0–1 cm:</span> <span className="font-semibold text-slate-800">{envData.hourly.soil_moisture_0_to_1cm?.[0] ?? 'N/A'} m³/m³</span>
                    <span>1–3 cm:</span> <span className="font-semibold text-slate-800">{envData.hourly.soil_moisture_1_to_3cm?.[0] ?? 'N/A'} m³/m³</span>
                    <span>3–9 cm:</span> <span className="font-semibold text-slate-800">{envData.hourly.soil_moisture_3_to_9cm?.[0] ?? 'N/A'} m³/m³</span>
                    <span>9–27 cm:</span> <span className="font-semibold text-slate-800">{envData.hourly.soil_moisture_9_to_27cm?.[0] ?? 'N/A'} m³/m³</span>
                    <span>27–81 cm:</span> <span className="font-semibold text-slate-800">{envData.hourly.soil_moisture_27_to_81cm?.[0] ?? 'N/A'} m³/m³</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[12px] font-bold flex items-center gap-1 border-b border-slate-100 pb-1">
                    <span>🌧️</span> RAINFALL FORECAST
                  </h4>
                  <div className="text-[11px] text-slate-600 grid grid-cols-2 gap-y-1 ml-1">
                    <span>Next 1 hour:</span> <span className="font-semibold text-slate-800">{(envData.hourly.precipitation?.slice(1, 2).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                    <span>Next 3 hours:</span> <span className="font-semibold text-slate-800">{(envData.hourly.precipitation?.slice(1, 4).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                    <span>Next 6 hours:</span> <span className="font-semibold text-slate-800">{(envData.hourly.precipitation?.slice(1, 7).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                    <span>Next 24 hours:</span> <span className="font-semibold text-slate-800">{(envData.hourly.precipitation?.slice(1, 25).reduce((a, b) => a + b, 0) || 0).toFixed(1)} mm</span>
                  </div>
                </div>

                {envData.elevation !== undefined && (
                  <div className="space-y-1.5">
                    <h4 className="text-[12px] font-bold flex items-center gap-1 border-b border-slate-100 pb-1">
                      <span>⛰️</span> ELEVATION
                    </h4>
                    <div className="text-[11px] text-slate-600 ml-1">
                      {envData.elevation} meters
                    </div>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-slate-200/80 text-[9px] text-slate-400">
                  <div>Last updated: {envData.current.time || new Date().toISOString()}</div>
                  <div>Source: Open-Meteo</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-2 rounded-xl shadow-sm pointer-events-none">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ML Risk (Uttarakhand)</div>
        <div className="flex items-center gap-3 text-[9.5px] font-bold text-slate-700">
          {[['#DC2626','Extreme'],['#F97316','High'],['#D97706','Warning'],['#16A34A','Normal']].map(([c,l]) => (
            <div key={l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}</div>
          ))}
        </div>
        <div className="text-[8.5px] text-amber-600 font-semibold mt-1">Historical calibrated output — not live inference</div>
      </div>

      {/* Loading overlay for boundaries */}
      {loadingBounds && (
        <div className="absolute inset-0 z-[500] bg-white/60 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 text-slate-500 text-[12px] font-medium">
            <span className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            Loading SOI boundaries…
          </div>
        </div>
      )}
    </div>
  );
}
