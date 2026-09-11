import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

// Uttarakhand key monitoring stations
const DEFAULT_STATIONS = [
  { id: 'CWC_UK_002', name: 'Rishikesh', river: 'Ganga', lat: 30.108, lon: 78.298, risk: 'HIGH', prob: 0.68, stage: 'WARNING_ZONE' },
  { id: 'CWC_UK_001', name: 'Joshimath', river: 'Alaknanda', lat: 30.556, lon: 79.568, risk: 'EXTREME', prob: 0.94, stage: 'DANGER_ZONE' },
  { id: 'CWC_UK_003', name: 'Uttarkashi', river: 'Bhagirathi', lat: 30.727, lon: 78.435, risk: 'HIGH', prob: 0.72, stage: 'WARNING_ZONE' },
  { id: 'CWC_UK_004', name: 'Rudraprayag', river: 'Mandakini', lat: 30.285, lon: 78.981, risk: 'EXTREME', prob: 0.91, stage: 'DANGER_ZONE' },
  { id: 'CWC_UK_005', name: 'Srinagar', river: 'Alaknanda', lat: 30.221, lon: 78.784, risk: 'HIGH', prob: 0.65, stage: 'WARNING_ZONE' },
  { id: 'CWC_UK_006', name: 'Devprayag', river: 'Ganga', lat: 30.146, lon: 78.598, risk: 'MODERATE', prob: 0.35, stage: 'BELOW_WARNING' },
  { id: 'CWC_UK_007', name: 'Haridwar', river: 'Ganga', lat: 29.945, lon: 78.164, risk: 'LOW', prob: 0.12, stage: 'BELOW_WARNING' },
  { id: 'CWC_UK_008', name: 'Dharchula', river: 'Kali', lat: 29.851, lon: 80.542, risk: 'EXTREME', prob: 0.88, stage: 'DANGER_ZONE' },
];

function MapControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1 pointer-events-auto">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 bg-white/90 border border-[#A5F1F7] rounded flex items-center justify-center text-[#102A2E] hover:bg-[#A5F1F7]/30 transition-colors backdrop-blur-sm shadow-xs cursor-pointer"
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 bg-white/90 border border-[#A5F1F7] rounded flex items-center justify-center text-[#102A2E] hover:bg-[#A5F1F7]/30 transition-colors backdrop-blur-sm shadow-xs cursor-pointer"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <button
        onClick={() => map.setView([30.15, 79.2], 8)}
        className="w-8 h-8 bg-white/90 border border-[#A5F1F7] rounded flex items-center justify-center text-[#102A2E] hover:bg-[#A5F1F7]/30 transition-colors backdrop-blur-sm shadow-xs cursor-pointer mt-1"
        title="Reset View to Uttarakhand"
      >
        <span className="material-symbols-outlined text-[18px]">my_location</span>
      </button>
    </div>
  );
}

export default function MiniRiskMap({ stations = DEFAULT_STATIONS, onSelectStation }) {
  return (
    <div className="flex-[3] relative rounded-xl border border-[#A5F1F7]/35 overflow-hidden bg-white/70 flex flex-col h-full min-h-[380px] shadow-[0_10px_35px_rgba(16,42,46,0.06)]">
      {/* Top Left Floating Layers Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/90 border border-[#A5F1F7] px-2.5 py-1 rounded backdrop-blur-sm shadow-xs pointer-events-auto">
        <span className="text-[11px] font-bold text-[#102A2E] flex items-center gap-1.5 uppercase tracking-wider">
          <span className="material-symbols-outlined text-[15px] text-[#24464B]">layers</span> Map Layers
        </span>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[30.2, 79.2]}
        zoom={8}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        />
        
        {stations.map((st) => {
          let fillColor = '#16A34A'; // Normal Green
          let radius = 6;
          if (st.risk === 'EXTREME') {
            fillColor = '#DC2626'; // Red
            radius = 10;
          } else if (st.risk === 'HIGH') {
            fillColor = '#F97316'; // Orange
            radius = 8;
          } else if (st.risk === 'MODERATE') {
            fillColor = '#D97706'; // Amber
            radius = 7;
          }

          return (
            <CircleMarker
              key={st.id}
              center={[st.lat, st.lon]}
              radius={radius}
              pathOptions={{
                color: '#FFFFFF',
                weight: 1.5,
                fillColor: fillColor,
                fillOpacity: 0.9,
              }}
              eventHandlers={{
                click: () => onSelectStation && onSelectStation(st),
              }}
            >
              <Popup>
                <div className="p-1 font-sans text-[#102A2E]">
                  <div className="font-bold text-[13px] text-[#102A2E] mb-0.5">{st.name}</div>
                  <div className="text-[11px] text-[#6B858A] mb-1">River: {st.river}</div>
                  <div className="flex justify-between items-center text-[11px] gap-2 pt-1 border-t border-[#A5F1F7]/40">
                    <span>Risk:</span>
                    <span className="font-bold" style={{ color: fillColor }}>{st.risk} ({Math.round(st.prob * 100)}%)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#6B858A] mt-0.5">
                    <span>Stage:</span>
                    <span className="font-mono text-[#102A2E] font-semibold">{st.stage}</span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
        <MapControls />
      </MapContainer>
    </div>
  );
}

