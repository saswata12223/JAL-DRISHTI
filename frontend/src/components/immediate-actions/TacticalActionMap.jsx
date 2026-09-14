import React, { useState, useEffect } from 'react';

import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Tooltip, useMap } from 'react-leaflet';

import L from 'leaflet';



const UTTARAKHAND_CENTER = [30.316, 79.150];

const UTTARAKHAND_BOUNDS = [

  [28.80, 77.60],

  [31.45, 81.05],

];



const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || 'cb1_2k56_1_d8f949035bf0414f5da8a77b';



function MapFitBounds() {

  const map = useMap();

  useEffect(() => {

    if (map) {

      const timer = setTimeout(() => {

        map.invalidateSize();

        map.fitBounds(UTTARAKHAND_BOUNDS, { padding: [25, 25] });

      }, 120);

      return () => clearTimeout(timer);

    }

  }, [map]);

  return null;

}



export default function TacticalActionMap({

  tacticalData,

  selectedEntity,

  onSelectEntity,

  activeRouteId,

  onSelectRoute,

}) {

  const [basemapType, setBasemapType] = useState('topo'); // 'topo', 'osm', 'satellite', 'carto'

  const [showForces, setShowForces] = useState(true);

  const [showRoutes, setShowRoutes] = useState(true);

  const [showVulnerable, setShowVulnerable] = useState(true);

  const [showPopulation, setShowPopulation] = useState(true);

  const [showSafeRoutes, setShowSafeRoutes] = useState(true);

  const [showShelters, setShowShelters] = useState(true);



  const BASEMAPS = {

    topo: {

      name: 'High-Res Topo (Terrain & Relief)',

      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',

      attribution: '&copy; Esri, USGS, Garmin, METI/NASA',

      maxZoom: 19,

    },

    osm: {

      name: 'OpenStreetMap (Roads & Axis)',

      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

      attribution: '&copy; OpenStreetMap contributors',

      maxZoom: 19,

    },

    satellite: {

      name: 'Satellite Aerial (Glacial & Riverbeds)',

      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

      attribution: '&copy; Esri, DigitalGlobe, GeoEye, Earthstar',

      maxZoom: 18,

    },

    carto: {

      name: 'CARTO Voyager (Geospatial Light)',

      url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`,

      attribution: '&copy; CARTO & OpenStreetMap',

      maxZoom: 19,

    },

  };



  const activeBasemap = BASEMAPS[basemapType] || BASEMAPS.topo;



  const forces = tacticalData?.forces || [];

  const ingressRoutes = tacticalData?.ingress_routes || [];

  const vulnerablePoints = tacticalData?.vulnerable_points || [];

  const populationCenters = tacticalData?.population_centers || [];

  const safeShortestRoutes = tacticalData?.safe_shortest_routes || [];

  const shelters = tacticalData?.shelters || [];



  return (

    <div className="relative w-full h-[540px] lg:h-[620px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-950">

      {/* Map Filter Controls Overlay */}

      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-lg text-xs space-y-1.5 max-w-xs">

        <div className="font-bold text-[11px] text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-slate-800">

          <span className="material-symbols-outlined text-sm text-[#8FD3E8]">layers</span>

          <span>Tactical Map Layers</span>

        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300">

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showForces}

              onChange={(e) => setShowForces(e.target.checked)}

              className="accent-blue-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-blue-500" />

              <span>Forces ({forces.length})</span>

            </span>

          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showRoutes}

              onChange={(e) => setShowRoutes(e.target.checked)}

              className="accent-amber-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-amber-500" />

              <span>Ingress Corridors</span>

            </span>

          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showVulnerable}

              onChange={(e) => setShowVulnerable(e.target.checked)}

              className="accent-red-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-red-500" />

              <span>Vulnerable Chokes</span>

            </span>

          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showPopulation}

              onChange={(e) => setShowPopulation(e.target.checked)}

              className="accent-purple-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-purple-500" />

              <span>Population Zones</span>

            </span>

          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showSafeRoutes}

              onChange={(e) => setShowSafeRoutes(e.target.checked)}

              className="accent-emerald-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-emerald-400" />

              <span>Safe Egress Paths</span>

            </span>

          </label>

          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">

            <input

              type="checkbox"

              checked={showShelters}

              onChange={(e) => setShowShelters(e.target.checked)}

              className="accent-teal-500 rounded"

            />

            <span className="flex items-center gap-1">

              <span className="w-2 h-2 rounded-full bg-teal-400" />

              <span>Relief Shelters</span>

            </span>

          </label>

        </div>

      </div>



      {/* Selected Entity HUD Bar */}

      {selectedEntity && (

        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">

          <div className="flex items-center gap-3">

            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">

              <span className="material-symbols-outlined text-lg">

                {selectedEntity.type === 'FORCE' ? 'shield' : selectedEntity.type === 'VULNERABLE' ? 'warning' : selectedEntity.type === 'POPULATION' ? 'groups' : 'navigation'}

              </span>

            </div>

            <div>

              <div className="font-bold text-sm text-white flex items-center gap-2">

                <span>{selectedEntity.name}</span>

                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">

                  {selectedEntity.district || selectedEntity.corridor || 'Uttarakhand'}

                </span>

              </div>

              <div className="text-slate-400 text-[11px] line-clamp-1">

                {selectedEntity.description || selectedEntity.assigned_zone || selectedEntity.egress_protocol || selectedEntity.vulnerability_desc}

              </div>

            </div>

          </div>

          <button

            onClick={() => onSelectEntity(null)}

            className="self-end sm:self-center px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"

          >

            Clear Focus

          </button>

        </div>

      )}



      {/* Basemap Switcher & API Key Verification Badge */}

      <div className="absolute top-3 right-3 z-[1000] flex flex-col sm:flex-row items-end sm:items-center gap-2 pointer-events-auto">

        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg flex items-center gap-1 text-[11px]">

          {[

            { id: 'topo', label: 'Topo Relief', icon: 'terrain' },

            { id: 'osm', label: 'Streets', icon: 'map' },

            { id: 'satellite', label: 'Satellite', icon: 'satellite_alt' },

          ].map((b) => (

            <button

              key={b.id}

              onClick={() => setBasemapType(b.id)}

              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${

                basemapType === b.id

                  ? 'bg-[#0F4C81] text-white shadow-xs font-bold'

                  : 'text-slate-400 hover:text-white hover:bg-slate-800'

              }`}

            >

              <span className="material-symbols-outlined text-[13px]">{b.icon}</span>

              <span>{b.label}</span>

            </button>

          ))}

        </div>



        <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-[11px] text-emerald-400 font-mono select-none">

          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />

          <span>GIS Engine: Active (SEOC Topo)</span>

        </div>

      </div>



      {/* Main Leaflet Map Container */}

      <MapContainer

        center={UTTARAKHAND_CENTER}

        zoom={8}

        className="w-full h-full"

        scrollWheelZoom={true}

      >

        <MapFitBounds />

        {/* Dynamic Basemap Tile Layer */}

        <TileLayer

          key={basemapType}

          attribution={activeBasemap.attribution}

          url={activeBasemap.url}

          subdomains={activeBasemap.subdomains || 'abc'}

          maxZoom={activeBasemap.maxZoom || 19}

        />



        {/* 1. Tactical Ingress Corridors (Polylines) */}

        {showRoutes &&

          ingressRoutes.map((route) => {

            const isCorridorAlpha = route.id === 'ROUTE-NH07';

            const isBravo = route.id === 'ROUTE-NH107';

            const isAir = route.id === 'ROUTE-AIR-01';

            const color = isAir ? '#818CF8' : isCorridorAlpha ? '#0284C7' : isBravo ? '#D97706' : '#10B981';

            const dashArray = isAir ? '6, 6' : undefined;



            return (

              <Polyline

                key={route.id}

                positions={route.path_coordinates}

                pathOptions={{

                  color,

                  weight: isCorridorAlpha ? 5 : 4,

                  opacity: 0.85,

                  dashArray,

                }}

              >

                <Tooltip sticky>

                  <div className="text-xs font-sans">

                    <strong className="block text-slate-900">{route.name}</strong>

                    <span className="text-slate-600 block">{route.clearance_capacity}</span>

                    <span className="text-blue-600 font-bold block">{route.total_distance_km} km | Status: {route.status}</span>

                  </div>

                </Tooltip>

              </Polyline>

            );

          })}



        {/* 2. Safe Shortest-Path Evacuation Routes (Green Highlight Polylines) */}

        {showSafeRoutes &&

          safeShortestRoutes.map((route) => {

            const isSelected = activeRouteId === route.from_point_id;

            return (

              <Polyline

                key={route.from_point_id}

                positions={route.waypoints}

                pathOptions={{

                  color: '#10B981',

                  weight: isSelected ? 6 : 3.5,

                  dashArray: '8, 8',

                  opacity: isSelected ? 1 : 0.7,

                }}

                eventHandlers={{

                  click: () => onSelectRoute && onSelectRoute(route),

                }}

              >

                <Tooltip sticky>

                  <div className="text-xs font-sans font-medium">

                    <strong className="text-emerald-700">Safe Shortest Path: {route.from_name} &rarr; {route.to_shelter_name}</strong>

                    <div className="text-slate-700">Distance: <strong>{route.shortest_distance_km} km</strong> | Vehicle: ~{route.est_rescue_vehicle_mins} mins</div>

                    <div className="text-emerald-600 font-semibold">{route.safety_score}</div>

                  </div>

                </Tooltip>

              </Polyline>

            );

          })}



        {/* 3. Force Deployment Bases (Blue Markers) */}

        {showForces &&

          forces.map((f) => (

            <CircleMarker

              key={f.id}

              center={[f.lat, f.lon]}

              radius={9}

              pathOptions={{

                color: '#1D4ED8',

                fillColor: '#3B82F6',

                fillOpacity: 0.9,

                weight: 2,

              }}

              eventHandlers={{

                click: () => onSelectEntity && onSelectEntity({ ...f, type: 'FORCE', name: `${f.organization} - ${f.base_name}` }),

              }}

            >

              <Tooltip direction="top" offset={[0, -8]}>

                <div className="font-sans text-xs">

                  <strong className="text-blue-800">{f.organization}</strong>

                  <div className="text-slate-800 font-medium">{f.base_name}</div>

                  <div className="text-blue-600 font-bold">{f.personnel_count} Personnel • {f.motorized_boats} Boats</div>

                </div>

              </Tooltip>

            </CircleMarker>

          ))}



        {/* 4. Vulnerable Bottleneck Hazard Points (Red Pulsing Markers) */}

        {showVulnerable &&

          vulnerablePoints.map((v) => (

            <CircleMarker

              key={v.id}

              center={[v.lat, v.lon]}

              radius={8}

              pathOptions={{

                color: '#B91C1C',

                fillColor: '#EF4444',

                fillOpacity: 0.95,

                weight: 2,

              }}

              eventHandlers={{

                click: () => onSelectEntity && onSelectEntity({ ...v, type: 'VULNERABLE', description: v.vulnerability_desc }),

              }}

            >

              <Tooltip direction="top" offset={[0, -8]}>

                <div className="font-sans text-xs">

                  <strong className="text-red-700">Vulnerable Point: {v.name}</strong>

                  <div className="text-slate-700">{v.hazard_type} ({v.risk_severity})</div>

                  <div className="text-red-600 font-semibold">{v.corridor}</div>

                </div>

              </Tooltip>

            </CircleMarker>

          ))}



        {/* 5. Population Centers (Purple / Rose Circles with Population Counts) */}

        {showPopulation &&

          populationCenters.map((p) => {

            const isExtreme = p.risk_level === 'EXTREME';

            return (

              <CircleMarker

                key={p.id}

                center={[p.lat, p.lon]}

                radius={13}

                pathOptions={{

                  color: isExtreme ? '#BE185D' : '#7C3AED',

                  fillColor: isExtreme ? '#F43F5E' : '#A855F7',

                  fillOpacity: 0.75,

                  weight: 2,

                }}

                eventHandlers={{

                  click: () => {

                    onSelectEntity && onSelectEntity({ ...p, type: 'POPULATION', description: `Approx Pop: ${p.approx_population.toLocaleString()} | Target: ${p.safe_shelter_target}` });

                    onSelectRoute && onSelectRoute(safeShortestRoutes.find((r) => r.from_point_id === p.id));

                  },

                }}

              >

                <Tooltip direction="top" offset={[0, -10]}>

                  <div className="font-sans text-xs">

                    <strong className="text-purple-900">{p.name}</strong>

                    <div className="text-slate-800">Total Pop: <strong>{p.approx_population.toLocaleString()}</strong></div>

                    <div className="text-rose-600 font-semibold">Riverfront Vulnerable: {p.vulnerable_riverfront_population.toLocaleString()}</div>

                    <div className="text-emerald-700 font-bold">Evac Target: {p.safe_shelter_target}</div>

                  </div>

                </Tooltip>

              </CircleMarker>

            );

          })}



        {/* 6. Relief Shelters (Teal / Emerald Markers) */}

        {showShelters &&

          shelters.map((s) => (

            <CircleMarker

              key={s.id}

              center={[s.lat, s.lon]}

              radius={8}

              pathOptions={{

                color: s.status === 'FULL' ? '#DC2626' : s.status === 'NEAR_CAPACITY' ? '#D97706' : '#059669',

                fillColor: s.status === 'FULL' ? '#EF4444' : s.status === 'NEAR_CAPACITY' ? '#F59E0B' : '#10B981',

                fillOpacity: 0.9,

                weight: 2,

              }}

              eventHandlers={{

                click: () => onSelectEntity && onSelectEntity({ ...s, type: 'SHELTER', description: `Capacity: ${s.capacity} | Available: ${s.available} | Status: ${s.status}` }),

              }}

            >

              <Tooltip direction="top" offset={[0, -8]}>

                <div className="font-sans text-xs">

                  <strong className="text-teal-900">{s.name}</strong>

                  <div className="text-slate-700">Capacity: {s.capacity} | Free: <span className="font-bold text-emerald-600">{s.available}</span></div>

                  <div className="text-slate-600">Contact: {s.contact_officer}</div>

                </div>

              </Tooltip>

            </CircleMarker>

          ))}

      </MapContainer>

    </div>

  );

}
