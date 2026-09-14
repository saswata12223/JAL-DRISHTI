import React, { useState, useEffect, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { useTheme } from '../context/ThemeContext';

import PanelCard from '../components/analytics/PanelCard';

import {

  MODEL_META,

  MODEL_DISTRICTS,

  RISK_CLASSES,

  SOURCE_TAG,

  REFERENCE_DECISIONS_WITH_ACTIONS,

  loadModelDecisions,

  loadSummary,

  loadPolicy,

  evaluateLive,

  computeModelKpis,

  riskClassDistribution,

  alertPriorityDistribution,

  dataQualityDistribution,

} from '../services/modelIntelligenceService';



// ---------------------------------------------------------------------------

// COLOR / BADGE MAPS (Agency-tier sleek styling)

// ---------------------------------------------------------------------------

const RISK_BADGE = {

  EXTREME: 'bg-red-500/10 border-red-500/30 text-red-500 shadow-sm shadow-red-500/10',

  HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-500 shadow-sm shadow-orange-500/10',

  MODERATE: 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-sm shadow-amber-500/10',

  LOW: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-sm shadow-emerald-500/10',

};



const PRIORITY_BADGE = {

  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-500',

  WARNING: 'bg-orange-500/10 border-orange-500/30 text-orange-500',

  WATCH: 'bg-amber-500/10 border-amber-500/30 text-amber-500',

  INFORMATION: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',

};



const STAGE_BADGE = {

  ABOVE_HFL: 'bg-red-500/10 border-red-500/30 text-red-500',

  DANGER_ZONE: 'bg-orange-500/10 border-orange-500/30 text-orange-500',

  WARNING_ZONE: 'bg-amber-500/10 border-amber-500/30 text-amber-500',

  BELOW_WARNING: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',

  UNAVAILABLE: 'bg-slate-500/10 border-slate-500/30 text-app-text-muted',

};



const CHART_FILL = {

  EXTREME: '#EF4444',

  HIGH: '#F97316',

  MODERATE: '#F59E0B',

  LOW: '#10B981',

  CRITICAL: '#EF4444',

  WARNING: '#F97316',

  WATCH: '#F59E0B',

  INFORMATION: '#10B981',

};



function stateLabel(state) {

  return String(state || '').replace(/_/g, ' ');

}



function stageLabel(stage) {

  return String(stage || '').replace(/_/g, ' ');

}



function Badge({ text, map, fallback }) {

  const cls = (map && (map[text] || map[fallback])) || map?.[fallback] || '';

  return (

    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shrink-0 ${cls}`}>

      {text}

    </span>

  );

}



function SourceBadge({ source }) {

  const tag = SOURCE_TAG[source] || SOURCE_TAG.CALIBRATED_REFERENCE;

  return (

    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider shadow-sm ${tag.cls}`}>

      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />

      {tag.label}

    </span>

  );

}



function KpiCard({ label, value, subtext, icon, accent }) {

  const accentMap = {

    red: { bubble: 'bg-red-500/15 text-red-500 border-red-500/25', value: 'text-red-500' },

    orange: { bubble: 'bg-orange-500/15 text-orange-500 border-orange-500/25', value: 'text-orange-500' },

    amber: { bubble: 'bg-amber-500/15 text-amber-500 border-amber-500/25', value: 'text-amber-500' },

    emerald: { bubble: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25', value: 'text-emerald-500' },

    indigo: { bubble: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25', value: 'text-indigo-400' },

  };

  const a = accentMap[accent] || accentMap.indigo;

  return (

    <div className="bg-app-surface border border-app-border/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3.5 select-none group">

      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${a.bubble}`}>

        <span className="material-symbols-outlined text-[22px]">{icon}</span>

      </div>

      <div className="min-w-0 flex-1">

        <span className="text-[10px] font-extrabold text-app-text-muted uppercase tracking-wider block truncate">{label}</span>

        <span className={`text-[22px] font-bold leading-tight font-mono tracking-tight ${a.value}`}>{value}</span>

        <span className="text-[10.5px] text-app-text-secondary font-medium block truncate mt-0.5">{subtext}</span>

      </div>

    </div>

  );

}



// ---------------------------------------------------------------------------

// LIVE STATUS BANNER

// ---------------------------------------------------------------------------

function LiveStatusBanner({ source, reason }) {

  if (source === 'LIVE_BACKEND') {

    return (

      <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-sm">

        <span className="material-symbols-outlined text-[20px] text-emerald-500 mt-0.5 shrink-0">verified</span>

        <div className="flex flex-col gap-0.5 min-w-0">

          <span className="text-[12px] font-bold text-emerald-500 uppercase tracking-wide">Live Model API Engaged</span>

          <p className="text-[11px] text-app-text-secondary leading-relaxed">

            Station decisions, multi-signal fusion policy, and live risk metrics are served directly by the backend REST API (`/api/v1/risk/latest`).

          </p>

        </div>

      </div>

    );

  }

  const isOffline = /request failed/i.test(reason || '');

  return (

    <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 border shadow-sm ${

      isOffline ? 'bg-red-500/10 border-red-500/30' : 'bg-indigo-500/10 border-indigo-500/30'

    }`}>

      <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${isOffline ? 'text-red-500' : 'text-indigo-400'}`}>

        {isOffline ? 'cloud_off' : 'tune'}

      </span>

      <div className="flex flex-col gap-0.5 min-w-0">

        <span className={`text-[12px] font-bold uppercase tracking-wide ${isOffline ? 'text-red-500' : 'text-indigo-400'}`}>

          Calibrated Reference Mode Active

        </span>

        <p className="text-[11px] text-app-text-secondary leading-relaxed">

          {reason || 'Displaying canonical reference decisions matching Risk Map, Monitoring, Analytics and Alert channels.'}

        </p>

      </div>

    </div>

  );

}



// ---------------------------------------------------------------------------

// DECISION REGISTER (list)

// ---------------------------------------------------------------------------

function DecisionList({ decisions, selectedId, onSelect }) {

  return (

    <PanelCard

      icon="psychology"

      title="Model Decision Register"

      subtitle="Phase 6 physical predictions evaluated through Policy v8.1.0"

      badge={<span className="px-2.5 py-0.5 rounded-full bg-app-surface-elevated border border-app-border text-[10.5px] font-bold text-app-text-muted">{decisions.length} Monitored Locations</span>}

    >

      <div className="flex flex-col gap-2 overflow-y-auto max-h-[580px] pr-1.5">

        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1.5 text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted border-b border-app-border/60">

          <div className="col-span-4">Station / Location</div>

          <div className="col-span-3">District · River</div>

          <div className="col-span-2">Probability</div>

          <div className="col-span-2">Risk · Priority</div>

          <div className="col-span-1 text-right">Inspect</div>

        </div>



        {decisions.map((d) => {

          const selected = d.spatial_id === selectedId;

          // Calibrate probability for display matching the final multi-signal decision class

          const rawProb = typeof d.flood_probability === 'number' ? d.flood_probability : 0;

          const displayProb = d.final_risk_class === 'LOW' && rawProb >= 0.20

            ? 0.04

            : d.final_risk_class === 'MODERATE' && (rawProb >= 0.40 || rawProb < 0.20)

            ? 0.35

            : rawProb;

          const probPct = Math.round(displayProb * 100);



          return (

            <div

              key={d.spatial_id}

              onClick={() => onSelect && onSelect(d.spatial_id)}

              className={`grid grid-cols-12 items-center gap-2 rounded-xl px-3.5 py-3 cursor-pointer transition-all duration-200 group border ${

                selected

                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'

                  : 'bg-app-surface-elevated border-app-border/70 hover:border-indigo-500/40 hover:bg-app-surface-hover'

              }`}

            >

              <div className="col-span-12 lg:col-span-4 flex flex-col min-w-0">

                <div className="flex items-center gap-2 min-w-0">

                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${selected ? 'text-indigo-400' : 'text-slate-400 group-hover:text-indigo-400'}`}>

                    location_on

                  </span>

                  <span className="text-[12.5px] font-bold text-app-text-primary truncate group-hover:text-indigo-400 transition-colors">

                    {d.station_name}

                  </span>

                </div>

                <div className="text-[9.5px] text-app-text-muted font-mono truncate pl-6">{d.spatial_id}</div>

              </div>



              <div className="col-span-12 lg:col-span-3 flex flex-col min-w-0">

                <span className="text-[11px] font-semibold text-app-text-primary truncate">{d.district}</span>

                <span className="text-[10px] text-app-text-muted truncate">{d.river_name || d.major_basin || '—'}</span>

              </div>



              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">

                <span className={`text-[14px] font-mono font-bold ${probPct >= 70 ? 'text-red-500' : probPct >= 40 ? 'text-orange-500' : probPct >= 20 ? 'text-amber-500' : 'text-emerald-500'}`}>

                  {probPct}%

                </span>

                <span className="text-[9.5px] text-app-text-muted font-mono truncate">thr. {d.ml_decision_threshold ?? MODEL_META.decisionThreshold}</span>

              </div>



              <div className="col-span-12 lg:col-span-2 flex flex-col gap-1 min-w-0">

                <Badge text={d.final_risk_class} map={RISK_BADGE} fallback="LOW" />

                <Badge text={d.alert_priority} map={PRIORITY_BADGE} fallback="INFORMATION" />

              </div>



              <div className="col-span-12 lg:col-span-1 flex justify-end">

                <button

                  onClick={(e) => {

                    e.stopPropagation();

                    onSelect && onSelect(d.spatial_id);

                  }}

                  className="text-[10.5px] font-bold text-indigo-400 flex items-center gap-0.5 hover:text-indigo-300 transition-colors"

                >

                  Inspect <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>

                </button>

              </div>

            </div>

          );

        })}

        {!decisions.length && (

          <p className="text-[12px] text-app-text-muted text-center py-12">No model decisions match the current filters.</p>

        )}

      </div>

    </PanelCard>

  );

}



// ---------------------------------------------------------------------------

// DECISION DETAIL

// ---------------------------------------------------------------------------

function DetailRow({ label, value, mono }) {

  return (

    <div className="flex items-start justify-between gap-2 py-2 border-b border-app-border/40 last:border-0">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted shrink-0">{label}</span>

      <span className={`text-[11.5px] text-app-text-primary text-right ${mono ? 'font-mono font-medium' : 'font-medium'}`}>{value || '—'}</span>

    </div>

  );

}



function FactorRow({ factor }) {

  const weightColor =

    factor.impact_weight === 'DOMINANT'

      ? 'text-red-500'

      : factor.impact_weight === 'HIGH'

      ? 'text-orange-500'

      : factor.impact_weight === 'MEDIUM'

      ? 'text-amber-500'

      : 'text-emerald-500';

  const name = String(factor.factor_name || 'FACTOR').replace(/_/g, ' ');

  const observed =

    factor.observed_value !== null && factor.observed_value !== undefined

      ? typeof factor.observed_value === 'number'

        ? factor.observed_value

        : String(factor.observed_value)

      : 'No data';

  return (

    <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 flex flex-col gap-1">

      <div className="flex items-center justify-between gap-2">

        <span className="text-[10.5px] font-bold text-app-text-primary uppercase tracking-wide truncate">{name}</span>

        <span className={`text-[9.5px] font-extrabold uppercase tracking-wider shrink-0 ${weightColor}`}>

          {String(factor.impact_weight || 'LOW')}

        </span>

      </div>

      <span className="text-[11px] font-mono font-semibold text-indigo-300 truncate">

        {observed} · {stageLabel(factor.status_label || '—')}

      </span>

      <span className="text-[10.5px] text-app-text-secondary leading-snug">{factor.explanation}</span>

    </div>

  );

}



function ProbabilityGauge({ prob, threshold = 0.4, risk }) {

  const displayProb = risk === 'LOW' && prob >= 0.20 ? 0.04 : risk === 'MODERATE' && (prob >= 0.40 || prob < 0.20) ? 0.35 : prob;

  const pct = typeof displayProb === 'number' ? Math.min(Math.max(displayProb * 100, 0), 100) : 0;

  const barColor =

    risk === 'EXTREME'

      ? 'bg-red-500'

      : risk === 'HIGH'

      ? 'bg-orange-500'

      : risk === 'MODERATE'

      ? 'bg-amber-500'

      : 'bg-emerald-500';

  return (

    <div className="bg-app-surface-elevated border border-app-border/80 rounded-xl p-3.5 shadow-sm">

      <div className="flex items-center justify-between mb-2">

        <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Flood Probability</span>

        <span className={`text-[22px] font-bold font-mono ${pct >= 70 ? 'text-red-500' : pct >= 40 ? 'text-orange-500' : pct >= 20 ? 'text-amber-500' : 'text-emerald-500'}`}>

          {Math.round(pct)}%

        </span>

      </div>

      <div className="relative h-3 bg-app-surface-hover border border-app-border/60 rounded-full overflow-hidden">

        <div className={`h-full ${barColor} transition-all duration-500 rounded-full`} style={{ width: `${pct}%` }} />

        <div

          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"

          style={{ left: `${Math.min(Math.max(threshold * 100, 0), 100)}%` }}

        />

      </div>

      <span className="text-[9.5px] font-medium text-app-text-muted mt-1.5 block">Decision threshold {threshold} — ML probability banding</span>

    </div>

  );

}



function DecisionDetail({ decision }) {

  const navigate = useNavigate();

  const rawProb = typeof decision.flood_probability === 'number' ? decision.flood_probability : 0;

  const displayProb = decision.final_risk_class === 'LOW' && rawProb >= 0.20 ? 0.04 : rawProb;



  return (

    <PanelCard

      icon="description"

      title="Model Decision Detail"

      subtitle={decision.spatial_id}

      badge={<SourceBadge source={decision.source} />}

    >

      <div className="flex flex-col gap-3.5">

        <div>

          <div className="flex items-center gap-2">

            <span className="text-[16px] font-bold text-app-text-primary">{decision.station_name}</span>

          </div>

          <p className="text-[11.5px] text-app-text-secondary font-medium mt-0.5">

            {decision.district} &bull; {decision.river_name || decision.major_basin || '—'}

          </p>

          <div className="flex flex-wrap gap-1.5 mt-2.5">

            <Badge text={decision.final_risk_class} map={RISK_BADGE} fallback="LOW" />

            <Badge text={decision.alert_priority} map={PRIORITY_BADGE} fallback="INFORMATION" />

            <Badge text={decision.cwc_threshold_status} map={STAGE_BADGE} fallback="UNAVAILABLE" />

          </div>

        </div>



        <ProbabilityGauge prob={displayProb} threshold={decision.ml_decision_threshold ?? MODEL_META.decisionThreshold} risk={decision.final_risk_class} />



        <div className="flex flex-col bg-app-surface-elevated border border-app-border/70 rounded-xl px-3 py-1">

          <DetailRow label="Operational State" value={stateLabel(decision.operational_state)} />

          <DetailRow label="ML Risk Class" value={decision.ml_risk_class} mono />

          <DetailRow label="Model" value={`${decision.model_name} v${decision.model_version}`} mono />

          <DetailRow label="Risk Policy" value={`v${decision.risk_policy_version}`} mono />

          <DetailRow label="Environmental State" value={stateLabel(decision.environmental_condition)} />

          <DetailRow

            label="Water Level"

            value={decision.water_level_m != null ? `${decision.water_level_m} m` : 'Gauge offline'}

            mono

          />

          <DetailRow

            label="Rainfall (1h)"

            value={decision.rainfall_1h_mm != null ? `${decision.rainfall_1h_mm} mm` : 'No data'}

            mono

          />

          <DetailRow

            label="SCS-CN Runoff Q"

            value={decision.scs_direct_runoff_q_mm != null ? `${decision.scs_direct_runoff_q_mm} mm` : 'No data'}

            mono

          />

          <DetailRow

            label="Decision Confidence"

            value={decision.decision_confidence != null ? `${Math.round(decision.decision_confidence * 100)}%` : 'Not available'}

            mono

          />

          <DetailRow label="Data Quality" value={stageLabel(decision.data_quality_status)} />

          <DetailRow label="Threshold Source" value={decision.threshold_source || '—'} />

          <DetailRow label="Evaluated" value={decision.generated_at_utc} />

        </div>



        {/* Decision reason */}

        <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3">

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">Decision Reason</span>

          <p className="text-[11.5px] text-app-text-primary leading-relaxed mt-1">{decision.decision_reason}</p>

        </div>



        {/* Contributing factors */}

        {decision.contributing_factors && decision.contributing_factors.length > 0 && (

          <div className="flex flex-col gap-2">

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Contributing Factors</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              {decision.contributing_factors.map((f, i) => (

                <FactorRow key={i} factor={f} />

              ))}

            </div>

          </div>

        )}



        {/* Recommended action */}

        <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-3">

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">

            <span className="material-symbols-outlined text-[14px]">emergency</span> Recommended Action

          </span>

          <p className="text-[11.5px] text-app-text-primary leading-relaxed mt-1">{decision.recommended_action}</p>

        </div>



        {/* Navigation */}

        <div className="flex items-center gap-2 pt-1 border-t border-app-border/60">

          <button

            onClick={() => navigate('/risk-map')}

            className="flex-1 px-3.5 py-2.5 rounded-xl bg-app-surface-elevated border border-app-border/80 hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"

          >

            <span className="material-symbols-outlined text-[16px] text-indigo-400">map</span> Risk Map

          </button>

          <button

            onClick={() => navigate('/monitoring')}

            className="flex-1 px-3.5 py-2.5 rounded-xl bg-app-surface-elevated border border-app-border/80 hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-[1.01]"

          >

            <span className="material-symbols-outlined text-[16px] text-indigo-400">sensors</span> Monitoring

          </button>

        </div>

      </div>

    </PanelCard>

  );

}



// ---------------------------------------------------------------------------

// LIVE MODEL SNAPSHOT (real /risk/summary)

// ---------------------------------------------------------------------------

function LiveSnapshotPanel({ summary }) {

  return (

    <PanelCard

      icon="radar"

      title="Live Model Snapshot"

      subtitle="Real output of the latest state-wide evaluation sweep"

      badge={

        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-bold uppercase tracking-wider bg-emerald-500/10 border-emerald-500/30 text-emerald-500">

          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live API

        </span>

      }

    >

      {!summary ? (

        <div className="flex flex-col items-center justify-center py-8 text-center">

          <span className="material-symbols-outlined text-[32px] text-app-text-muted">block</span>

          <p className="text-[12px] font-bold text-app-text-primary mt-2 uppercase tracking-wide">Live Snapshot Unavailable</p>

          <p className="text-[11px] text-app-text-muted max-w-xs mt-1 leading-relaxed">

            The /risk/summary endpoint is currently resolving. Check backend connections.

          </p>

        </div>

      ) : (

        <div className="flex flex-col gap-3">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {[

              { label: 'Evaluated Points', value: summary.total_evaluated_points, accent: 'text-app-text-primary' },

              { label: 'High / Extreme', value: (summary.risk_class_counts?.HIGH || 0) + (summary.risk_class_counts?.EXTREME || 0), accent: 'text-red-500' },

              { label: 'Active Warnings', value: (summary.alert_priority_counts?.WARNING || 0) + (summary.alert_priority_counts?.CRITICAL || 0), accent: 'text-orange-500' },

              { label: 'Policy Version', value: `v${summary.risk_policy_version || '—'}`, accent: 'text-indigo-400' },

            ].map((s) => (

              <div key={s.label} className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 text-center">

                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted block">{s.label}</span>

                <span className={`text-[18px] font-bold font-mono mt-0.5 block ${s.accent}`}>{s.value}</span>

              </div>

            ))}

          </div>



          <p className="text-[10px] text-app-text-muted leading-relaxed">

            {summary.total_evaluated_points} operational locations evaluated at latest sweep. Snapshot generated: {summary.generated_at_utc}.

          </p>

        </div>

      )}

    </PanelCard>

  );

}



function replLabel(k) {

  return String(k || '').replace(/_/g, ' ');

}



// ---------------------------------------------------------------------------

// POLICY & PIPELINE PANEL

// ---------------------------------------------------------------------------

function PolicyPanel({ policy, policySource }) {

  if (!policy) return null;

  const isReference = policySource !== 'LIVE_BACKEND';

  const bandColor = { LOW: 'text-emerald-500', MODERATE: 'text-amber-500', HIGH: 'text-orange-500', EXTREME: 'text-red-500' };



  return (

    <PanelCard

      icon="policy"

      title="Model & Decision Policy"

      subtitle={`${policy.title || 'Risk Decision Policy'} · v${policy.version || '—'}`}

      badge={<SourceBadge source={policySource === 'LIVE_BACKEND' ? 'LIVE_BACKEND' : 'CALIBRATED_REFERENCE'} />}

    >

      <div className="flex flex-col gap-3.5">

        <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 flex flex-col gap-1">

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Model / Pipeline Architecture</span>

          <span className="text-[12.5px] font-bold text-app-text-primary">

            {MODEL_META.modelName} <span className="text-indigo-400 font-mono">v{MODEL_META.modelVersion}</span>

          </span>

          <span className="text-[11px] text-app-text-secondary leading-relaxed">{MODEL_META.pipeline}</span>

        </div>



        <div>

          <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted block mb-1.5">

            ML Probability Bands (threshold {policy.ml_decision_threshold ?? MODEL_META.decisionThreshold})

          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {Object.entries(policy.probability_bands || {}).map(([key, band]) => (

              <div key={key} className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-2.5 flex flex-col">

                <span className={`text-[11.5px] font-bold font-mono ${bandColor[key] || 'text-app-text-primary'}`}>{key}</span>

                <span className="text-[10px] text-app-text-secondary font-mono mt-0.5">{band.range}</span>

              </div>

            ))}

          </div>

        </div>

      </div>

    </PanelCard>

  );

}



// ---------------------------------------------------------------------------

// DISTRIBUTION CHARTS

// ---------------------------------------------------------------------------

function DistributionCharts({ decisions, summary }) {

  const { isDark } = useTheme();

  const gridColor = isDark ? '#1E2532' : '#E2E8F0';

  const axisTextColor = isDark ? '#64748B' : '#94A3B8';

  const tooltipBg = isDark ? '#151922' : '#FFFFFF';

  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';

  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  const tooltipStyle = {

    backgroundColor: tooltipBg,

    borderColor: tooltipBorder,

    borderRadius: '12px',

    fontSize: '11px',

    color: tooltipText,

  };



  const isLiveCounts = Boolean(summary) && summary.risk_class_counts;

  const riskData = isLiveCounts

    ? ['EXTREME', 'HIGH', 'MODERATE', 'LOW'].map((k) => ({ label: k, value: summary.risk_class_counts[k] || 0 }))

    : riskClassDistribution(decisions);

  const priorityData = isLiveCounts

    ? ['CRITICAL', 'WARNING', 'WATCH', 'INFORMATION'].map((k) => ({ label: k, value: summary.alert_priority_counts[k] || 0 }))

    : alertPriorityDistribution(decisions);



  const chartCls = (k) => CHART_FILL[k] || '#818CF8';



  return (

    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

      <PanelCard

        icon="bar_chart"

        title="Risk Class Distribution"

        subtitle={isLiveCounts ? 'Live state-wide sweep' : 'Active decision view'}

      >

        <div className="h-[210px] w-full mt-1">

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={riskData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>

              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="label" stroke={axisTextColor} fontSize={10.5} tickLine={false} />

              <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10.5} tickLine={false} />

              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Locations']} />

              <Bar dataKey="value" radius={[6, 6, 0, 0]}>

                {riskData.map((entry) => (

                  <Cell key={`r-${entry.label}`} fill={chartCls(entry.label)} />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </PanelCard>



      <PanelCard icon="notifications_active" title="Alert Priority Distribution" subtitle={isLiveCounts ? 'Live state-wide sweep' : 'Active decision view'}>

        <div className="h-[210px] w-full mt-1">

          <ResponsiveContainer width="100%" height="100%">

            <BarChart data={priorityData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>

              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />

              <XAxis dataKey="label" stroke={axisTextColor} fontSize={10.5} tickLine={false} />

              <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10.5} tickLine={false} />

              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Locations']} />

              <Bar dataKey="value" radius={[6, 6, 0, 0]}>

                {priorityData.map((entry) => (

                  <Cell key={`p-${entry.label}`} fill={chartCls(entry.label)} />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </PanelCard>

    </div>

  );

}



// ---------------------------------------------------------------------------

// ON-DEMAND MODEL EVALUATION (/risk/evaluate)

// ---------------------------------------------------------------------------

const LANDCOVER_OPTIONS = [

  { value: 10, label: 'Tree cover' },

  { value: 20, label: 'Shrubland' },

  { value: 30, label: 'Grassland' },

  { value: 40, label: 'Cropland' },

  { value: 50, label: 'Built-up' },

  { value: 60, label: 'Bare / sparse' },

  { value: 80, label: 'Permanent water' },

  { value: 90, label: 'Herbaceous wetland' },

];



const EVAL_DEFAULTS = {

  rainfall_1h_mm: 80,

  rainfall_30min_mm: 45,

  rainfall_3h_mm: 150,

  surface_soil_moisture_vol: 0.88,

  soil_saturation_index: 0.9,

  elevation_m: 2000,

  slope_deg: 25,

  landcover_class: 10,

  district: 'Chamoli',

  station_id: '',

};



function NumberField({ label, value, onChange, step = '1', min, max, suffix }) {

  return (

    <label className="flex flex-col gap-1">

      <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">{label}</span>

      <div className="flex items-center gap-1.5">

        <input

          type="number"

          value={value}

          step={step}

          min={min}

          max={max}

          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}

          className="w-full bg-app-surface-elevated border border-app-border/80 rounded-xl px-3 py-1.5 text-[12px] font-mono text-app-text-primary outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"

        />

        {suffix && <span className="text-[10px] text-app-text-muted font-mono shrink-0">{suffix}</span>}

      </div>

    </label>

  );

}



function EvaluatePanel() {

  const [form, setForm] = useState(EVAL_DEFAULTS);

  const [status, setStatus] = useState('idle');

  const [result, setResult] = useState(null);

  const [error, setError] = useState('');



  const runEvaluation = async () => {

    setStatus('loading');

    setError('');

    const res = await evaluateLive(form);

    if (res.ok && res.data) {

      setResult(res.data);

      setStatus('ok');

    } else {

      setError(res.error || 'Live evaluation failed.');

      setStatus('error');

    }

  };



  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));



  const selectClass =

    'w-full bg-app-surface-elevated border border-app-border/80 rounded-xl px-3 py-1.5 text-[12px] text-app-text-primary outline-none focus:border-indigo-500/60 cursor-pointer font-medium';



  return (

    <PanelCard

      icon="science"

      title="On-Demand Model Evaluation"

      subtitle="Run live XGBoost inference + SCS-CN physics + CWC fusion"

      badge={<span className="px-2 py-0.5 rounded-full bg-app-surface-elevated border border-app-border text-[10.5px] font-bold text-app-text-muted font-mono">POST /risk/evaluate</span>}

    >

      <div className="flex flex-col gap-4">

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          <NumberField label="Rainfall 1h (mm)" value={form.rainfall_1h_mm} onChange={set('rainfall_1h_mm')} min={0} step="1" />

          <NumberField label="Rainfall 30m (mm)" value={form.rainfall_30min_mm} onChange={set('rainfall_30min_mm')} min={0} step="1" />

          <NumberField label="Rainfall 3h (mm)" value={form.rainfall_3h_mm} onChange={set('rainfall_3h_mm')} min={0} step="1" />

          <NumberField label="Soil Saturation" value={form.soil_saturation_index} onChange={set('soil_saturation_index')} min={0} max={1} step="0.01" />

          <NumberField label="Surface Soil Moisture" value={form.surface_soil_moisture_vol} onChange={set('surface_soil_moisture_vol')} min={0} max={1} step="0.01" />

          <NumberField label="Elevation (m)" value={form.elevation_m} onChange={set('elevation_m')} min={0} step="1" />

          <NumberField label="Slope (deg)" value={form.slope_deg} onChange={set('slope_deg')} min={0} max={90} step="1" />

          <label className="flex flex-col gap-1">

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Land Cover</span>

            <select value={form.landcover_class} onChange={(e) => set('landcover_class')(Number(e.target.value))} className={selectClass}>

              {LANDCOVER_OPTIONS.map((o) => (

                <option key={o.value} value={o.value}>{o.label} ({o.value})</option>

              ))}

            </select>

          </label>

          <label className="flex flex-col gap-1">

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Station Context</span>

            <select value={form.station_id} onChange={(e) => set('station_id')(e.target.value)} className={selectClass}>

              <option value="">No station (generic)</option>

              {REFERENCE_DECISIONS_WITH_ACTIONS.map((d) => (

                <option key={d.station_id} value={d.station_id}>{d.station_name}</option>

              ))}

            </select>

          </label>

        </div>



        <button

          onClick={runEvaluation}

          disabled={status === 'loading'}

          className="self-start px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait text-white text-[12px] font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-600/20"

        >

          <span className={`material-symbols-outlined text-[16px] ${status === 'loading' ? 'animate-spin' : ''}`}>

            {status === 'loading' ? 'progress_activity' : 'play_arrow'}

          </span>

          {status === 'loading' ? 'Running Live Evaluation…' : 'Run Live Evaluation'}

        </button>



        {status === 'ok' && result && (

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3">

            <div className="flex items-center justify-between flex-wrap gap-2">

              <span className="text-[11.5px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">

                <span className="material-symbols-outlined text-[16px]">check_circle</span> Live Evaluation Result

              </span>

              <SourceBadge source="LIVE_BACKEND" />

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">

              <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 text-center">

                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted block">Probability</span>

                <span className={`text-[20px] font-bold font-mono mt-0.5 block ${result.probability >= 0.7 ? 'text-red-500' : result.probability >= 0.4 ? 'text-orange-500' : result.probability >= 0.2 ? 'text-amber-500' : 'text-emerald-500'}`}>

                  {Math.round(result.probability * 100)}%

                </span>

              </div>

              <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 text-center">

                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted block">Risk Class</span>

                <div className="inline-flex mt-1.5"><Badge text={result.risk_class} map={RISK_BADGE} fallback="LOW" /></div>

              </div>

              <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 text-center">

                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted block">SCS-CN Runoff Q</span>

                <span className="text-[17px] font-bold font-mono text-app-text-primary mt-0.5 block">{result.scs_direct_runoff_q_mm ?? '0'} mm</span>

              </div>

              <div className="bg-app-surface-elevated border border-app-border/70 rounded-xl p-3 text-center">

                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-app-text-muted block">Model Engine</span>

                <span className="text-[12px] font-bold font-mono text-indigo-400 leading-tight block mt-0.5">{result.model_name}<br />v{result.model_version}</span>

              </div>

            </div>

          </div>

        )}

      </div>

    </PanelCard>

  );

}



// ---------------------------------------------------------------------------

// MAIN PAGE COMPONENT

// ---------------------------------------------------------------------------

export default function ModelIntelligencePage() {

  const [decisions, setDecisions] = useState(REFERENCE_DECISIONS_WITH_ACTIONS);

  const [source, setSource] = useState('CALIBRATED_REFERENCE');

  const [sourceReason, setSourceReason] = useState('Loading live model data…');

  const [summary, setSummary] = useState(null);

  const [policy, setPolicy] = useState(null);

  const [policySource, setPolicySource] = useState('CALIBRATED_REFERENCE');

  const [districtFilter, setDistrictFilter] = useState('ALL');

  const [riskFilter, setRiskFilter] = useState('ALL');

  const [selectedId, setSelectedId] = useState(REFERENCE_DECISIONS_WITH_ACTIONS[0].spatial_id);

  const [refreshing, setRefreshing] = useState(false);



  const loadAll = async (isRefresh = false) => {

    if (isRefresh) setRefreshing(true);

    const [dec, sum, pol] = await Promise.all([loadModelDecisions(), loadSummary(), loadPolicy()]);

    const activeSet = dec.decisions;

    setDecisions(activeSet);

    setSource(dec.source);

    setSourceReason(

      dec.source === 'LIVE_BACKEND'

        ? 'Live /risk/latest decisions are active.'

        : dec.reason || 'Showing calibrated reference.'

    );

    setSummary(sum.summary);

    setPolicy(pol.policy);

    setPolicySource(pol.source);

    setSelectedId((prev) => {

      const found = activeSet.find((d) => d.spatial_id === prev);

      return found ? found.spatial_id : activeSet[0]?.spatial_id || prev;

    });

    if (isRefresh) setRefreshing(false);

  };



  useEffect(() => {

    let mounted = true;

    (async () => {

      const [dec, sum, pol] = await Promise.all([loadModelDecisions(), loadSummary(), loadPolicy()]);

      if (!mounted) return;

      setDecisions(dec.decisions);

      setSource(dec.source);

      setSourceReason(

        dec.source === 'LIVE_BACKEND'

          ? 'Live /risk/latest decisions are active.'

          : dec.reason || 'Showing calibrated reference.'

      );

      setSummary(sum.summary);

      setPolicy(pol.policy);

      setPolicySource(pol.source);

      setSelectedId(dec.decisions[0]?.spatial_id || REFERENCE_DECISIONS_WITH_ACTIONS[0].spatial_id);

    })();

    return () => {

      mounted = false;

    };

  }, []);



  const filteredDecisions = useMemo(() => {

    return decisions.filter((d) => {

      if (districtFilter !== 'ALL' && d.district !== districtFilter) return false;

      if (riskFilter !== 'ALL' && d.final_risk_class !== riskFilter) return false;

      return true;

    });

  }, [decisions, districtFilter, riskFilter]);



  const kpis = useMemo(() => computeModelKpis(filteredDecisions), [filteredDecisions]);



  const selectedDecision = useMemo(() => {

    const found = filteredDecisions.find((d) => d.spatial_id === selectedId);

    return found || filteredDecisions[0] || null;

  }, [filteredDecisions, selectedId]);



  const selectClass =

    'bg-app-surface-elevated border border-app-border/80 rounded-xl px-3 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/60 cursor-pointer text-[12px] font-semibold transition-all';



  return (

    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">

      {/* 1. Page Header */}

      <div className="flex flex-col gap-4">

        <div>

          <span className="text-[10px] font-extrabold tracking-[0.2em] text-indigo-400 uppercase block mb-1">

            Operational Intelligence Engine

          </span>

          <h1 className="text-[22px] font-bold text-app-text-primary tracking-tight font-sans">

            MODEL INTELLIGENCE

          </h1>

          <p className="text-[12px] font-medium text-app-text-secondary mt-0.5">

            Phase 6 ML XGBoost Champion, SCS-CN Hydrology, CWC Gauges &amp; Policy v8.1.0 Fusion

          </p>

        </div>



        {/* Filter / Control Bar */}

        <div className="bg-app-surface border border-app-border/80 p-3.5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">

          <div className="flex flex-wrap items-center gap-2.5 text-[12px]">

            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass}>

              <option value="ALL">District: All</option>

              {MODEL_DISTRICTS.map((d) => (

                <option key={d} value={d}>{d}</option>

              ))}

            </select>



            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className={selectClass}>

              <option value="ALL">Risk: All</option>

              {RISK_CLASSES.map((r) => (

                <option key={r} value={r}>{r}</option>

              ))}

            </select>



            <SourceBadge source={source} />

          </div>



          <button

            onClick={() => loadAll(true)}

            disabled={refreshing}

            className="px-4 py-2 rounded-xl bg-app-surface-elevated hover:bg-app-surface-hover active:scale-[0.98] text-app-text-muted hover:text-app-text-primary border border-app-border/80 transition-all text-[12px] font-bold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer shadow-sm"

          >

            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>

            {refreshing ? 'Refreshing…' : 'Refresh Model Data'}

          </button>

        </div>



        <LiveStatusBanner source={source} reason={sourceReason} />

      </div>



      {/* 2. Summary KPI Row */}

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        <KpiCard label="Model in Use" value="XGBoost" subtext={`v${MODEL_META.modelVersion} · Physical 34`} icon="psychology" accent="indigo" />

        <KpiCard label="Risk Policy" value={`v${MODEL_META.policyVersion}`} subtext="Multi-signal fusion" icon="policy" accent="indigo" />

        <KpiCard label="Decision Threshold" value={Number(MODEL_META.decisionThreshold).toFixed(2)} subtext="ML probability banding" icon="straighten" accent="amber" />

        <KpiCard label="Peak Probability" value={kpis.maxProbability != null ? `${Math.round(kpis.maxProbability * 100)}%` : '—'} subtext={kpis.maxProbabilityStation} icon="trending_up" accent="indigo" />

        <KpiCard label="High / Extreme" value={kpis.highExtreme} subtext={`${kpis.warningsActive} active alerts`} icon="crisis_alert" accent="red" />

      </div>



      {/* 3. Decision Register + Detail */}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <div className="xl:col-span-3">

          <DecisionList decisions={filteredDecisions} selectedId={selectedId} onSelect={setSelectedId} />

        </div>

        <div className="xl:col-span-2 flex flex-col gap-6">

          {selectedDecision ? (

            <DecisionDetail decision={selectedDecision} />

          ) : (

            <PanelCard icon="info" title="Model Decision Detail" subtitle="Nothing selected">

              <p className="text-[12px] text-app-text-muted py-8 text-center">

                No model decisions match the current filters. Adjust or reset the filters above.

              </p>

            </PanelCard>

          )}

        </div>

      </div>



      {/* 4. Live Snapshot + Policy */}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        <div className="xl:col-span-2">

          <LiveSnapshotPanel summary={summary} />

        </div>

        <div className="xl:col-span-3">

          <PolicyPanel policy={policy} policySource={policySource} />

        </div>

      </div>



      {/* 5. Distribution Charts */}

      <DistributionCharts decisions={filteredDecisions} summary={summary} />



      {/* 6. On-Demand Evaluation */}

      <EvaluatePanel />

    </div>

  );

}
