import React from 'react';
import PanelCard from '../components/analytics/PanelCard';

// About & Terrain intelligence — Uttarakhand flood early-warning platform.
// Data sources below reflect the accepted project inputs (CWC, IMD, NRSC,
// USGS, GSI and Uttarakhand State), consistent with the application footer.
const TERRAIN_SOURCES = [
  { icon: 'terrain', label: 'SRTM Elevation', detail: 'Digital terrain elevation model used for slope and runoff routing.' },
  { icon: 'landscape', label: 'Terrain Slope', detail: 'Riparian slope derived from DEM to compute SCS-CN peak runoff.' },
  { icon: 'layers', label: 'ESA Land Cover', detail: 'WorldCover classes governing curve-number (CN) infiltration.' },
  { icon: 'water', label: 'GPM / IMD Rainfall', detail: 'Satellite and gauge rainfall drivers for the Phase 6 model.' },
  { icon: 'spatial_tracking', label: 'SMAP Soil Moisture', detail: 'Surface and profile moisture governing saturation state.' },
  { icon: 'straighten', label: 'CWC Gauge Levels', detail: 'Official river stage thresholds (Warning / Danger / HFL).' },
];

export default function AboutTerrainPage() {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3.5">
        <div>
          <h1 className="text-[17px] font-bold text-app-text-primary tracking-tight font-sans">
            ABOUT &amp; TERRAIN
          </h1>
          <p className="text-[11.5px] font-medium text-app-text-secondary">
            Uttarakhand flood intelligence platform, terrain inputs, SCS-CN hydrologic runoff and model pipeline
          </p>
        </div>
      </div>

      {/* 2. About + Terrain Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-5">
          <PanelCard
            icon="info"
            title="About Jal Drishti"
            subtitle="Uttarakhand Flood Intelligence System"
          >
            <div className="flex flex-col gap-2.5">
              <p className="text-[12px] text-app-text-secondary leading-relaxed">
                Jal Drishti is an operational flash-flood early-warning and decision-support platform for the
                Himalayan state of Uttarakhand. It fuses satellite precipitation and soil-moisture telemetry with an
                upgraded Phase 6 machine-learning champion model, SCS-CN hydrological physics, and official Central
                Water Commission (CWC) river-gauge thresholds within a deterministic, auditable Policy v8.1.0
                decision engine.
              </p>
              <p className="text-[12px] text-app-text-secondary leading-relaxed">
                The platform exposes live risk decisions, monitoring telemetry, predictive analytics, and on-demand
                model evaluation across all 13 districts, with governance authority shared between the Central Water
                Commission (CWC) and the Uttarakhand State Disaster Management Authority (USDMA).
              </p>
            </div>
          </PanelCard>

          <PanelCard
            icon="psychology"
            title="Model Pipeline"
            subtitle="Phase 6 XGBoost + SCS-CN + CWC fusion"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Champion Model</span>
                <span className="text-[11.5px] font-mono font-bold text-indigo-400">XGBoost_PPT_Upgraded</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Model Version</span>
                <span className="text-[11.5px] font-mono font-bold text-app-text-primary">6.1.0</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Decision Policy</span>
                <span className="text-[11.5px] font-mono font-bold text-app-text-primary">v8.1.0</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Decision Threshold</span>
                <span className="text-[11.5px] font-mono font-bold text-amber-500">0.40</span>
              </div>
            </div>
          </PanelCard>
        </div>

        <PanelCard
          icon="terrain"
          title="Terrain & Data Inputs"
          subtitle="Physical forcing signals feeding the pipeline"
        >
          <div className="flex flex-col gap-2.5">
            {TERRAIN_SOURCES.map((s) => (
              <div
                key={s.label}
                className="flex items-start gap-2.5 bg-app-surface-elevated border border-app-border rounded-lg p-2.5"
              >
                <span className="material-symbols-outlined text-[18px] text-indigo-400 shrink-0 mt-px">{s.icon}</span>
                <div className="min-w-0">
                  <span className="text-[11.5px] font-bold text-app-text-primary block">{s.label}</span>
                  <span className="text-[10.5px] text-app-text-secondary leading-snug">{s.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </PanelCard>
      </div>
    </div>
  );
}
