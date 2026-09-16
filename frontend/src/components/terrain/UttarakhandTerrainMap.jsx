/**
 * UttarakhandTerrainMap.jsx
 * Jal Drishti — Interactive GIS Terrain Intelligence Map
 *
 * Uses react-leaflet with Esri satellite / CARTO dark / OpenTopoMap tiles.
 * No API key required for default satellite view.
 * Architecture designed for easy backend integration of live risk layers.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  ZoomControl,
  useMap,
  Rectangle,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import {
  UK_CENTER,
  UK_ZOOM,
  UK_BOUNDS,
  MONITORING_STATIONS,
  STATUS_CONFIG,
  TILE_LAYERS,
} from './terrainData';

// ── Captures the Leaflet map instance and passes it up ───────────────────────
function MapInstanceCapture({ onMap }) {
  const map = useMap();
  React.useEffect(() => { onMap(map); }, [map, onMap]);
  return null;
}

// ── Tile layer switcher ───────────────────────────────────────────────────────
function TileLayerSwitcher({ activeLayer }) {
  const cfg = TILE_LAYERS[activeLayer];
  const subdomains = activeLayer === 'dark' ? 'abcd' : 'abc';
  return (
    <TileLayer
      key={activeLayer}
      url={cfg.url}
      attribution={cfg.attribution}
      maxZoom={cfg.maxZoom}
      subdomains={subdomains}
    />
  );
}

// ── Satellite place-name overlay ─────────────────────────────────────────────
function SatelliteLabels({ active }) {
  if (!active) return null;
  return (
    <TileLayer
      url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      attribution=""
      opacity={0.9}
    />
  );
}

// ── Checkbox toggle row ───────────────────────────────────────────────────────
function LayerToggleRow({ label, value, onChange, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left text-[11px] font-semibold transition-colors mb-0.5 ${
        disabled
          ? 'opacity-40 cursor-not-allowed text-white/40'
          : 'text-white/80 hover:bg-white/5'
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-sm border flex-shrink-0 flex items-center justify-center text-[8px] ${
          value && !disabled
            ? 'bg-[#38BDF8] border-[#38BDF8] text-[#0F172A]'
            : 'border-white/20 text-white/20'
        }`}
      >
        {value && !disabled ? '✓' : ''}
      </span>
      {label}
      {disabled && (
        <span className="text-[8px] text-white/25 ml-auto">soon</span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UttarakhandTerrainMap({ height = '640px', className = '' }) {
  const [activeLayer, setActiveLayer]       = useState('satellite');
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(true);
  const [showBoundary, setShowBoundary]     = useState(true);
  const [mapInstance, setMapInstance]       = useState(null);

  const handleMapCapture = useCallback((map) => setMapInstance(map), []);

  const handleReset = () => {
    if (mapInstance) mapInstance.setView(UK_CENTER, UK_ZOOM);
  };

  const now = new Date();
  const timestamp = now.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' IST';

  // Approximate Uttarakhand bounding box
  const UK_RECT_BOUNDS = [[28.70, 77.55], [31.45, 81.05]];

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl ${className}`}
      style={{ height }}
    >
      {/* ── LEAFLET MAP ─────────────────────────────────────────────────── */}
      <MapContainer
        center={UK_CENTER}
        zoom={UK_ZOOM}
        minZoom={6}
        maxZoom={16}
        maxBounds={[[25.0, 74.0], [36.0, 86.0]]}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ background: '#0A1628' }}
      >
        {/* Capture map instance for external controls */}
        <MapInstanceCapture onMap={handleMapCapture} />

        {/* Basemap */}
        <TileLayerSwitcher activeLayer={activeLayer} />
        <SatelliteLabels active={activeLayer === 'satellite'} />

        {/* Uttarakhand boundary rectangle */}
        {showBoundary && (
          <Rectangle
            bounds={UK_RECT_BOUNDS}
            pathOptions={{
              color: '#38BDF8',
              weight: 1.5,
              fill: false,
              dashArray: '6 4',
              opacity: 0.7,
            }}
          />
        )}

        {/* Monitoring station markers */}
        {showMonitoring &&
          MONITORING_STATIONS.map((station) => {
            const cfg = STATUS_CONFIG[station.status] || STATUS_CONFIG.NORMAL;
            const isHighRisk =
              station.status === 'CRITICAL' || station.status === 'ELEVATED';
            return (
              <CircleMarker
                key={station.id}
                center={[station.lat, station.lng]}
                radius={isHighRisk ? 9 : 6}
                pathOptions={{
                  color: cfg.color,
                  fillColor: cfg.color,
                  fillOpacity: 0.85,
                  weight: isHighRisk ? 2.5 : 1.5,
                  opacity: 1,
                }}
              >
                <Popup closeButton={false} minWidth={230}>
                  <div
                    style={{
                      background: '#0F172A',
                      color: '#F8FAFC',
                      borderRadius: '12px',
                      padding: '14px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      minWidth: '220px',
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        marginBottom: '10px',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        paddingBottom: '8px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#94A3B8',
                          letterSpacing: '0.15em',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Jal Drishti · Monitoring Point
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          color: '#F8FAFC',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {station.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                        {station.district} · {station.basin} Basin
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '6px',
                        marginBottom: '10px',
                      }}
                    >
                      {[
                        ['Elevation', `${station.elevation.toLocaleString()} m`],
                        ['River', station.river],
                        ['Rainfall', `${station.rainfall_mm} mm`],
                        ['River Level', station.river_level],
                        ['Slope Risk', station.slope_risk],
                        ['Flood Risk', station.flood_risk],
                      ].map(([label, val]) => (
                        <div
                          key={label}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '6px',
                            padding: '5px 7px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '9px',
                              color: '#64748B',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#E2E8F0',
                              marginTop: '1px',
                            }}
                          >
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Status row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: cfg.color,
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: cfg.color,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                        {timestamp}
                      </div>
                    </div>

                    {/* Simulation disclaimer */}
                    <div
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          color: '#F59E0B',
                          fontWeight: 700,
                          letterSpacing: '0.05em',
                        }}
                      >
                        ⚠ SIMULATION DATA — Not live sensor feed
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* ── OVERLAY UI (rendered outside MapContainer for correct z-index) ─ */}

      {/* Top-left: status + subtitle */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#0F172A]/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-white text-[10px] font-extrabold tracking-[0.15em] uppercase">
            Live Terrain Intelligence
          </span>
        </div>
        <div className="bg-[#0F172A]/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 w-fit">
          <div className="text-[#38BDF8] text-[11px] font-bold tracking-wide">Uttarakhand</div>
          <div className="text-white/50 text-[9px] font-semibold tracking-[0.1em] uppercase">
            DEM · Satellite · Hydrology · Terrain
          </div>
        </div>
      </div>

      {/* Top-right: layer controls */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col items-end gap-2">
        <button
          onClick={() => setLayerPanelOpen((o) => !o)}
          className="flex items-center gap-2 bg-[#0F172A]/90 hover:bg-[#0F172A] backdrop-blur-md border border-white/15 rounded-lg px-3 py-1.5 text-white text-[11px] font-bold tracking-wide transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined text-[14px] text-[#38BDF8]">layers</span>
          Layers
        </button>

        {layerPanelOpen && (
          <div className="bg-[#0F172A]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-4 w-52 flex flex-col gap-3">
            {/* Basemap */}
            <div>
              <div className="text-[9px] font-extrabold text-[#64748B] tracking-[0.15em] uppercase mb-2">
                Basemap
              </div>
              {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setActiveLayer(key)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left text-[11px] font-semibold transition-colors mb-1 ${
                    activeLayer === key
                      ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
                      : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      activeLayer === key ? 'bg-[#38BDF8]' : 'bg-white/20'
                    }`}
                  />
                  {cfg.label}
                </button>
              ))}
            </div>

            {/* Overlays */}
            <div className="border-t border-white/10 pt-3">
              <div className="text-[9px] font-extrabold text-[#64748B] tracking-[0.15em] uppercase mb-2">
                Overlays
              </div>
              <LayerToggleRow
                label="Monitoring Points"
                value={showMonitoring}
                onChange={setShowMonitoring}
              />
              <LayerToggleRow
                label="State Boundary"
                value={showBoundary}
                onChange={setShowBoundary}
              />
              {['River Basins', 'Flood Risk', 'Rainfall', 'Slope Risk'].map((l) => (
                <LayerToggleRow key={l} label={l} value={false} onChange={() => {}} disabled />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reset button */}
      <button
        onClick={handleReset}
        title="Reset to Uttarakhand"
        className="absolute bottom-28 right-3 z-[500] w-8 h-8 bg-[#0F172A]/90 hover:bg-[#0F172A] border border-white/15 text-white rounded flex items-center justify-center shadow-lg transition-colors"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <span className="material-symbols-outlined text-[16px]">my_location</span>
      </button>

      {/* Legend */}
      <div className="absolute bottom-14 right-3 z-[500] bg-[#0F172A]/85 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2.5 pointer-events-none">
        <div className="text-[8px] font-extrabold text-white/40 tracking-[0.15em] uppercase mb-2">
          Legend
        </div>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: cfg.color }}
            />
            <span className="text-[10px] font-semibold text-white/70">{cfg.label}</span>
          </div>
        ))}
        <div className="border-t border-white/10 mt-1.5 pt-1.5">
          <div className="flex items-center gap-2">
            <span className="w-4 border-t border-dashed border-[#38BDF8] flex-shrink-0" />
            <span className="text-[10px] font-semibold text-white/70">State Boundary</span>
          </div>
        </div>
      </div>

      {/* Bottom caption bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-3 pointer-events-none z-[400]"
        style={{
          background: 'linear-gradient(to top, rgba(10,22,40,0.88) 0%, rgba(10,22,40,0.3) 70%, transparent 100%)',
        }}
      >
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-white font-bold text-[12px] leading-tight">
              Uttarakhand Terrain — Digital Elevation Model
            </span>
            <span className="text-white/50 text-[9px] font-semibold tracking-wide">
              SRTM · DEM · River Basins · Slope Classification · Watershed Boundaries
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0F172A]/60 backdrop-blur-sm border border-white/10 rounded-md px-2 py-1">
            <span className="material-symbols-outlined text-white/50 text-[11px]">schedule</span>
            <span className="text-white/50 text-[9px] font-semibold">{timestamp}</span>
          </div>
        </div>
      </div>

      {/* Leaflet overrides */}
      <style>{`
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(15,23,42,0.90) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          width: 30px !important;
          height: 30px !important;
          line-height: 28px !important;
          font-size: 18px !important;
          border-radius: 6px !important;
          margin-bottom: 3px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          transition: background 0.15s !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(15,23,42,1) !important;
        }
        .leaflet-control-attribution {
          background: rgba(10,22,40,0.65) !important;
          color: rgba(255,255,255,0.4) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(56,189,248,0.7) !important; }
      `}</style>
    </div>
  );
}
