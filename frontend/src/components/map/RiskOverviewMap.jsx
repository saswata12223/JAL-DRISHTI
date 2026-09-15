import React, { useState } from 'react';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Tooltip } from 'react-leaflet';



// Default Uttarakhand Monitoring Stations matching official locations

const DEFAULT_MAP_STATIONS = [

  { id: 'CWC_UK_001', name: 'Joshimath', district: 'Chamoli', river: 'Alaknanda', lat: 30.556, lon: 79.568, risk: 'EXTREME', prob: 0.94, stage: 'DANGER' },

  { id: 'CWC_UK_002', name: 'Rishikesh', district: 'Dehradun', river: 'Ganga', lat: 30.108, lon: 78.298, risk: 'HIGH', prob: 0.68, stage: 'WARNING' },

  { id: 'CWC_UK_003', name: 'Uttarkashi', district: 'Uttarkashi', river: 'Bhagirathi', lat: 30.727, lon: 78.435, risk: 'HIGH', prob: 0.72, stage: 'WARNING' },

  { id: 'CWC_UK_004', name: 'Rudraprayag', district: 'Rudraprayag', river: 'Mandakini', lat: 30.285, lon: 78.981, risk: 'EXTREME', prob: 0.91, stage: 'DANGER' },

  { id: 'CWC_UK_005', name: 'Srinagar', district: 'Pauri Garhwal', river: 'Alaknanda', lat: 30.221, lon: 78.784, risk: 'HIGH', prob: 0.65, stage: 'WARNING' },

  { id: 'CWC_UK_006', name: 'Devprayag', district: 'Tehri Garhwal', river: 'Ganga', lat: 30.146, lon: 78.598, risk: 'MODERATE', prob: 0.35, stage: 'NORMAL' },

  { id: 'CWC_UK_007', name: 'Haridwar', district: 'Haridwar', river: 'Ganga', lat: 29.945, lon: 78.164, risk: 'LOW', prob: 0.12, stage: 'NORMAL' },

  { id: 'CWC_UK_008', name: 'Dharchula', district: 'Pithoragarh', river: 'Kali', lat: 29.851, lon: 80.542, risk: 'EXTREME', prob: 0.88, stage: 'DANGER' },

  { id: 'CWC_UK_009', name: 'Almora', district: 'Almora', river: 'Kosi', lat: 29.597, lon: 79.659, risk: 'LOW', prob: 0.15, stage: 'NORMAL' },

  { id: 'CWC_UK_010', name: 'Nainital', district: 'Nainital', river: 'Gaula', lat: 29.380, lon: 79.463, risk: 'LOW', prob: 0.18, stage: 'NORMAL' },

  { id: 'CWC_UK_011', name: 'Bageshwar', district: 'Bageshwar', river: 'Sarayu', lat: 29.838, lon: 79.771, risk: 'MODERATE', prob: 0.32, stage: 'NORMAL' },

  { id: 'CWC_UK_012', name: 'Champawat', district: 'Champawat', river: 'Lohawati', lat: 29.337, lon: 80.092, risk: 'LOW', prob: 0.10, stage: 'NORMAL' },

  { id: 'CWC_UK_013', name: 'Rudrapur', district: 'Udham Singh Nagar', river: 'Kalyani', lat: 28.980, lon: 79.400, risk: 'LOW', prob: 0.08, stage: 'NORMAL' },

];



function MapControls() {

  const map = useMap();

  return (

    <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 pointer-events-auto">

      <button

        onClick={() => map.zoomIn()}

        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-[#A5F1F7] text-[#102A2E] hover:bg-[#A5F1F7]/30 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm"

        title="Zoom In"

      >

        <span className="material-symbols-outlined text-[17px]">add</span>

      </button>

      <button

        onClick={() => map.zoomOut()}

        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-[#A5F1F7] text-[#102A2E] hover:bg-[#A5F1F7]/30 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm"

        title="Zoom Out"

      >

        <span className="material-symbols-outlined text-[17px]">remove</span>

      </button>

      <button

        onClick={() => map.setView([30.15, 79.2], 8)}

        className="w-8 h-8 bg-white/90 backdrop-blur-md border border-[#A5F1F7] text-[#102A2E] hover:bg-[#A5F1F7]/30 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm"

        title="Reset View"

      >

        <span className="material-symbols-outlined text-[16px]">my_location</span>

      </button>

    </div>

  );

}



export default function RiskOverviewMap({ stations = DEFAULT_MAP_STATIONS, onSelectLocation, selectedLocation }) {

  const [filter, setFilter] = useState('ALL');



  // CARTO Voyager / Light Cartography Tiles for hero geospatial visualization

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || 'cb1_2k56_1_d8f949035bf0414f5da8a77b';

  const keyParam = cartoApiKey && cartoApiKey !== 'PASTE_CARTO_KEY_HERE' ? `?key=${cartoApiKey}` : '';

  const tileUrl = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyParam}`;



  const filteredStations = stations.filter((st) => {

    if (filter === 'EXTREME') return st.risk === 'EXTREME';

    if (filter === 'HIGH') return st.risk === 'HIGH' || st.risk === 'EXTREME';

    return true;

  });



  return (
    <div className="bg-white rounded-2xl flex flex-col overflow-hidden h-full min-h-[480px] lg:min-h-[520px] relative font-sans border border-slate-200 shadow-xs">
      {/* 1. Floating Top-Left Translucent Light Filter Pill */}
      <div className="absolute top-6 left-6 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 p-4 rounded-xl select-none flex flex-col gap-4 pointer-events-auto shadow-sm">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-slate-800 animate-pulse" />
          <h2 className="text-[12px] font-bold text-slate-900 tracking-wide font-sans">
            Flood Risk Overview
          </h2>
          <span className="text-[9.5px] font-bold text-cyan-900 bg-cyan-100 px-1.5 py-0.5 rounded border border-cyan-200">
            Uttarakhand
          </span>
        </div>



        {/* Floating Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-0.5">

          {['ALL', 'EXTREME', 'HIGH'].map((f) => (

            <button

              key={f}

              onClick={() => setFilter(f)}

              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${

                filter === f

                  ? 'bg-gradient-to-r from-[#A5F1F7] to-[#E8FBFC] text-[#102A2E] border border-[#A5F1F7] shadow-xs'

                  : 'text-[#6B858A] hover:text-[#102A2E] hover:bg-[#EAF8FA]'

              }`}

            >

              {f === 'ALL' ? 'All Stations' : f}

            </button>

          ))}

        </div>

      </div>



      {/* 2. Leaflet Map Viewport */}

      <div className="flex-1 w-full relative z-0">

        <MapContainer

          center={[30.15, 79.2]}

          zoom={8}

          className="w-full h-full"

          zoomControl={false}

        >

          <TileLayer

            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'

            url={tileUrl}

          />



          {filteredStations.map((st) => {

            const isSelected = selectedLocation && (selectedLocation.name?.includes(st.name) || selectedLocation.lat === st.lat);



            let fillColor = '#16A34A'; // Normal Green

            let radius = 5;

            let strokeColor = 'rgba(22, 163, 74, 0.4)';

            let strokeWidth = 1;



            if (st.risk === 'EXTREME') {

              fillColor = '#DC2626'; // Red

              radius = 8;

              strokeColor = '#F87171';

              strokeWidth = 1.5;

            } else if (st.risk === 'HIGH') {

              fillColor = '#F97316'; // Orange

              radius = 6.5;

              strokeColor = '#FDBA74';

              strokeWidth = 1.5;

            } else if (st.risk === 'MODERATE' || st.risk === 'WARNING') {

              fillColor = '#D97706'; // Amber

              radius = 5.5;

              strokeColor = '#FCD34D';

              strokeWidth = 1;

            }



            if (isSelected) {

              strokeColor = '#A5F1F7'; // #A5F1F7 ring accent for selected station

              strokeWidth = 3.5;

              radius = radius + 3;

            }



            return (

              <CircleMarker

                key={st.id}

                center={[st.lat, st.lon]}

                radius={radius}

                pathOptions={{

                  color: strokeColor,

                  weight: strokeWidth,

                  fillColor: fillColor,

                  fillOpacity: st.risk === 'LOW' ? 0.8 : 0.95,

                }}

                eventHandlers={{

                  click: () => onSelectLocation && onSelectLocation(st),

                }}

              >

                <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>

                  <div className="font-sans text-[11px] text-[#102A2E] font-semibold map-terrain-label">

                    {st.name} ({st.district}) &bull; <span style={{ color: fillColor, fontWeight: 700 }}>{st.risk}</span>

                  </div>

                </Tooltip>

                <Popup>

                  <div className="p-1 font-sans text-[#102A2E]">

                    <div className="font-bold text-[12.5px] text-[#102A2E]">{st.name}</div>

                    <div className="text-[10.5px] text-[#6B858A]">{st.river} River &bull; {st.district}</div>

                    <div className="flex justify-between items-center text-[11px] pt-1.5 mt-1 border-t border-[#A5F1F7]/40">

                      <span className="text-[#6B858A]">Risk:</span>

                      <span className="font-bold" style={{ color: fillColor }}>{st.risk} ({Math.round((st.prob || 0.5) * 100)}%)</span>

                    </div>

                    <div className="flex justify-between items-center text-[10.5px] text-[#6B858A] mt-0.5">

                      <span>CWC Stage:</span>

                      <span className="text-[#102A2E] font-mono font-semibold">{st.stage || 'NORMAL'}</span>

                    </div>

                  </div>

                </Popup>

              </CircleMarker>

            );

          })}



          <MapControls />

        </MapContainer>



        {/* 3. Floating Glass Legend (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur-md border border-[#A5F1F7]/50 px-4 py-3 rounded-xl select-none pointer-events-auto shadow-sm">
          <span className="text-[9.5px] font-bold text-[#6B858A] uppercase tracking-widest block mb-2">

            Risk Classification

          </span>

          <div className="flex items-center gap-3.5 text-[10.5px] text-[#102A2E] font-bold">

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />

              <span>Extreme</span>

            </div>

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-[#F97316]" />

              <span>High</span>

            </div>

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-[#D97706]" />

              <span>Warning</span>

            </div>

            <div className="flex items-center gap-1.5">

              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />

              <span>Normal</span>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}
