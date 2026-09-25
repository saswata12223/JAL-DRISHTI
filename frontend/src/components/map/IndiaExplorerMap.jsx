import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import { useLocation } from '../../context/LocationContext';
import gisService from '../../services/gisService';

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

import L from 'leaflet';

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
    const isUttarakhand = stateName === 'Uttarakhand';
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

  // Active stations — only show UK stations when Uttarakhand selected or no selection
  const showStations = !selectedState || selectedState === 'Uttarakhand';
  const activeStations = showStations ? (stations.length > 0 ? stations : UK_STATIONS) : [];
  const filteredStations = activeStations.filter(st => {
    if (filter === 'EXTREME') return st.risk === 'EXTREME';
    if (filter === 'HIGH') return ['HIGH', 'EXTREME'].includes(st.risk);
    return true;
  });

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
              eventHandlers={{ click: () => onSelectStation && onSelectStation(st) }}
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
