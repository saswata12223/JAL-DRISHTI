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
// COLOR / BADGE MAPS (matches Alerts/Analytics conventions)
// ---------------------------------------------------------------------------
const RISK_BADGE = {
  EXTREME: 'bg-red-500/10 border-red-500/30 text-red-500',
  HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  MODERATE: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  LOW: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

const PRIORITY_BADGE = {
  CRITICAL: 'bg-red-500/10 border-red-500/30 text-red-500',
  WARNING: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  WATCH: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  INFORMATION: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

const STATE_COLOR = {
  'EMERGENCY_RESPONSE': 'text-red-500',
  'PREPAREDNESS_WARNING': 'text-orange-500',
  'ELEVATED_WATCH': 'text-amber-500',
  'ROUTINE_MONITORING': 'text-emerald-500',
};

const STAGE_BADGE = {
  ABOVE_HFL: 'bg-red-500/10 border-red-500/30 text-red-500',
  DANGER_ZONE: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  WARNING_ZONE: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  BELOW_WARNING: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  UNAVAILABLE: 'bg-slate-500/10 border-slate-500/30 text-app-text-muted',
};

const DQ_BADGE = {
  COMPLETE: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  PARTIAL: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  DEGRADED: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  UNAVAILABLE: 'bg-slate-500/10 border-slate-500/30 text-app-text-muted',
  CALIBRATED_REFERENCE: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
};

const CHART_FILL = {
  EXTREME: '#DC2626',
  HIGH: '#F97316',
  MODERATE: '#EAB308',
  LOW: '#10B981',
  CRITICAL: '#DC2626',
  WARNING: '#F97316',
  WATCH: '#EAB308',
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
    <span className={`px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${cls}`}>
      {text}
    </span>
  );
}

function SourceBadge({ source }) {
  const tag = SOURCE_TAG[source] || SOURCE_TAG.CALIBRATED_REFERENCE;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider ${tag.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
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
    indigo: { bubble: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25', value: 'text-indigo-300' },
  };
  const a = accentMap[accent] || accentMap.indigo;
  return (
    <div className="bg-app-surface border border-app-border p-4 rounded-xl shadow-sm flex items-center gap-3.5 select-none">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${a.bubble}`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div className="min-w-0">
        <span className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider block truncate">{label}</span>
        <span className={`text-[22px] font-bold leading-tight font-mono tracking-tight ${a.value}`}>{value}</span>
        <span className="text-[11px] text-app-text-secondary font-medium block truncate">{subtext}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LIVE STATUS BANNER
// ---------------------------------------------------------------------------
function LiveStatusBanner({ source, reason, summary }) {
  if (source === 'LIVE_BACKEND') {
    return (
      <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/25 rounded-xl px-3.5 py-2.5">
        <span className="material-symbols-outlined text-[18px] text-emerald-500 mt-px">verified</span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[11.5px] font-bold text-emerald-500 uppercase tracking-wide">Live Model API engaged</span>
          <p className="text-[10.5px] text-app-text-secondary leading-snug">
            Station decisions, policy and the executive snapshot are sourced from the live /risk/* endpoints. Probabilities
            are the Phase 6 model output as served by the running backend.
          </p>
        </div>
      </div>
    );
  }
  const isOffline = /request failed/i.test(reason || '');
  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 border ${
      isOffline ? 'bg-red-500/5 border-red-500/25' : 'bg-amber-500/5 border-amber-500/25'
    }`}>
      <span className={`material-symbols-outlined text-[18px] mt-px ${isOffline ? 'text-red-500' : 'text-amber-500'}`}>
        {isOffline ? 'cloud_off' : 'tune'}
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={`text-[11.5px] font-bold uppercase tracking-wide ${isOffline ? 'text-red-500' : 'text-amber-500'}`}>
          Calibrated Reference in use — not live API data
        </span>
        <p className="text-[10.5px] text-app-text-secondary leading-snug">
          {reason || 'Live model output is not being displayed. Values below reflect the canonical monitored-station picture shared with Risk Map, Monitoring, Analytics and Alerts; they are labelled Calibrated Reference, never LIVE.'}
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
      subtitle="Phase 6 predictions evaluated through Policy v8.1.0"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{decisions.length} shown</span>}
    >
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[560px] pr-1">
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-app-text-muted">
          <div className="col-span-4">Station / Location</div>
          <div className="col-span-3">District · River</div>
          <div className="col-span-2">Probability</div>
          <div className="col-span-2">Risk · Priority</div>
          <div className="col-span-1" />
        </div>

        {decisions.map((d) => {
          const selected = d.spatial_id === selectedId;
          const prob = typeof d.flood_probability === 'number' ? Math.round(d.flood_probability * 100) : null;
          return (
            <div
              key={d.spatial_id}
              onClick={() => onSelect && onSelect(d.spatial_id)}
              className={`grid grid-cols-12 items-center gap-2 bg-app-surface-elevated border rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 group ${
                selected ? 'border-indigo-500/60 shadow-md' : 'border-app-border hover:border-app-border/80'
              }`}
            >
              <div className="col-span-12 lg:col-span-4 flex flex-col min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[15px] text-indigo-400/80 shrink-0">location_on</span>
                  <span className="text-[12px] font-bold text-app-text-primary truncate group-hover:text-indigo-300 transition-colors">
                    {d.station_name}
                  </span>
                </div>
                <div className="text-[9.5px] text-app-text-muted font-mono truncate">{d.spatial_id}</div>
              </div>

              <div className="col-span-12 lg:col-span-3 flex flex-col min-w-0">
                <span className="text-[10.5px] font-semibold text-app-text-primary truncate">{d.district}</span>
                <span className="text-[9.5px] text-app-text-muted truncate">{d.river_name || d.major_basin || '—'}</span>
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">
                <span className={`text-[13px] font-mono font-bold ${prob >= 70 ? 'text-red-500' : prob >= 40 ? 'text-orange-500' : prob >= 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {prob != null ? `${prob}%` : '—'}
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
                  className="text-[10px] font-semibold text-indigo-400 flex items-center gap-0.5 hover:underline"
                >
                  Inspect <span className="material-symbols-outlined text-[11px]">chevron_right</span>
                </button>
              </div>
            </div>
          );
        })}
        {!decisions.length && (
          <p className="text-[12px] text-app-text-muted text-center py-10">No model decisions match the current filters.</p>
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
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-app-border/50 last:border-0">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted shrink-0">{label}</span>
      <span className={`text-[11.5px] text-app-text-primary text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</span>
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
    <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 flex flex-col gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-bold text-app-text-primary uppercase tracking-wide truncate">{name}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${weightColor}`}>
          {String(factor.impact_weight || 'LOW')}
        </span>
      </div>
      <span className="text-[10.5px] font-mono text-indigo-300 truncate">
        {observed} · {stageLabel(factor.status_label || '—')}
      </span>
      <span className="text-[10px] text-app-text-secondary leading-snug">{factor.explanation}</span>
    </div>
  );
}

function ProbabilityGauge({ prob, threshold = 0.4, risk }) {
  const pct = typeof prob === 'number' ? Math.min(Math.max(prob * 100, 0), 100) : 0;
  const barColor =
    risk === 'EXTREME'
      ? 'bg-red-500'
      : risk === 'HIGH'
      ? 'bg-orange-500'
      : risk === 'MODERATE'
      ? 'bg-amber-500'
      : 'bg-emerald-500';
  return (
    <div className="bg-app-surface-elevated border border-app-border rounded-lg p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Flood Probability</span>
        <span className={`text-[20px] font-bold font-mono ${pct >= 70 ? 'text-red-500' : pct >= 40 ? 'text-orange-500' : pct >= 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
          {typeof prob === 'number' ? `${Math.round(prob * 100)}%` : '—'}
        </span>
      </div>
      <div className="relative h-2.5 bg-app-surface-hover border border-app-border rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/60"
          style={{ left: `${Math.min(Math.max(threshold * 100, 0), 100)}%` }}
        />
      </div>
      <span className="text-[9px] text-app-text-muted mt-1 block">Decision threshold {threshold} — ML banding</span>
    </div>
  );
}

function DecisionDetail({ decision, kpis }) {
  const navigate = useNavigate();
  const isReference = decision.source !== 'LIVE_BACKEND';
  const prob = typeof decision.flood_probability === 'number' ? decision.flood_probability : null;

  return (
    <PanelCard
      icon="description"
      title="Model Decision Detail"
      subtitle={decision.spatial_id}
      badge={<SourceBadge source={decision.source} />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-app-text-primary">{decision.station_name}</span>
          </div>
          <p className="text-[11px] text-app-text-secondary mt-0.5">
            {decision.district} &bull; {decision.river_name || decision.major_basin || '—'}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge text={decision.final_risk_class} map={RISK_BADGE} fallback="LOW" />
            <Badge text={decision.alert_priority} map={PRIORITY_BADGE} fallback="INFORMATION" />
            <Badge text={decision.cwc_threshold_status} map={STAGE_BADGE} fallback="UNAVAILABLE" />
          </div>
        </div>

        <ProbabilityGauge prob={prob} threshold={decision.ml_decision_threshold ?? MODEL_META.decisionThreshold} risk={decision.final_risk_class} />

        <div className="flex flex-col">
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
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Decision Reason</span>
          <p className="text-[11px] text-app-text-secondary leading-snug mt-1">{decision.decision_reason}</p>
        </div>

        {/* Contributing factors */}
        {decision.contributing_factors && decision.contributing_factors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Contributing Factors</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {decision.contributing_factors.map((f, i) => (
                <FactorRow key={i} factor={f} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended action */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">emergency</span> Recommended Action
          </span>
          <p className="text-[11px] text-app-text-primary leading-snug mt-1">{decision.recommended_action}</p>
        </div>

        {/* Reference note */}
        {isReference && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Data Provenance</span>
            <p className="text-[10.5px] text-app-text-secondary leading-snug mt-1">
              Calibrated reference: real-time model telemetry is not displayed because the live /risk snapshot is
              degenerate or unavailable. These values mirror the canonical monitored-station picture used by Risk Map,
              Monitoring, Analytics and Alerts. Decision confidence is reported only where the live engine computes it.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-1 border-t border-app-border/60">
          <button
            onClick={() => navigate('/risk-map')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">map</span> Risk Map
          </button>
          <button
            onClick={() => navigate('/monitoring')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sensors</span> Monitoring
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
        <span className="inline-flex items-center gap-1 px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 border-emerald-500/30 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live API
        </span>
      }
    >
      {!summary ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="material-symbols-outlined text-[32px] text-app-text-muted">block</span>
          <p className="text-[12px] font-bold text-app-text-primary mt-2 uppercase tracking-wide">Live Snapshot Not Available</p>
          <p className="text-[10.5px] text-app-text-muted max-w-xs mt-1">
            The /risk/summary endpoint did not return a valid response. No live snapshot is displayed and none is
            fabricated.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Evaluated Points', value: summary.total_evaluated_points, accent: 'text-app-text-primary' },
              { label: 'High / Extreme', value: (summary.risk_class_counts?.HIGH || 0) + (summary.risk_class_counts?.EXTREME || 0), accent: 'text-red-500' },
              { label: 'Active Warnings', value: (summary.alert_priority_counts?.WARNING || 0) + (summary.alert_priority_counts?.CRITICAL || 0), accent: 'text-orange-500' },
              { label: 'Policy Version', value: `v${summary.risk_policy_version || '—'}`, accent: 'text-indigo-300' },
            ].map((s) => (
              <div key={s.label} className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-app-text-muted block">{s.label}</span>
                <span className={`text-[17px] font-bold font-mono ${s.accent}`}>{s.value}</span>
              </div>
            ))}
          </div>

          {summary.data_quality_counts && Object.keys(summary.data_quality_counts).length > 0 && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Data Quality (live sweep)</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {Object.entries(summary.data_quality_counts).map(([k, v]) => (
                  <span key={k} className="px-2 py-0.5 rounded-md bg-app-surface-elevated border border-app-border text-[10px] font-mono text-app-text-secondary">
                    {replLabel(k)}: {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9.5px] text-app-text-muted leading-snug">
            {summary.total_evaluated_points} points evaluated at the engine's latest sweep. When the live sweep is
            degenerate (near-zero probabilities / no level telemetry) the app retains the calibrated reference for the
            operational view, exactly as Analytics and Alerts do. Snapshot generated: {summary.generated_at_utc}.
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
      {isReference && (
        <p className="text-[10px] text-amber-500/90 leading-snug mb-2">
          Reference copy of the audited policy — /risk/policy was unavailable when this page loaded. Values match the
          audited Policy v8.1.0 document served by the backend.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {/* Model identity */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Model / Pipeline in Use</span>
          <span className="text-[12px] font-bold text-app-text-primary">
            {MODEL_META.modelName} <span className="text-indigo-300 font-mono">v{MODEL_META.modelVersion}</span>
          </span>
          <span className="text-[10.5px] text-app-text-secondary leading-snug">{MODEL_META.pipeline}</span>
          <span className="text-[10px] text-app-text-muted flex items-center gap-1">
            <span className="material-symbols-outlined text-[11px]">database</span> {MODEL_META.dataInputs}
          </span>
        </div>

        {/* Probability bands */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">
            ML Probability Bands (threshold {policy.ml_decision_threshold ?? MODEL_META.decisionThreshold})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-1.5">
            {Object.entries(policy.probability_bands || {}).map(([key, band]) => (
              <div key={key} className="bg-app-surface-elevated border border-app-border rounded-lg p-2 flex flex-col">
                <span className={`text-[11px] font-bold font-mono ${bandColor[key] || 'text-app-text-primary'}`}>{key}</span>
                <span className="text-[9.5px] text-app-text-secondary font-mono">{band.range}</span>
                <span className="text-[9px] text-app-text-muted leading-tight mt-0.5">{band.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CWC threshold rules */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Official CWC Stage Rules</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
            {Object.entries(policy.cwc_threshold_rules || {}).map(([key, rule]) => (
              <div key={key} className="bg-app-surface-elevated border border-app-border rounded px-2.5 py-1.5 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold text-app-text-primary">{replLabel(key)}</span>
                <span className="text-[9.5px] text-app-text-secondary text-right">{rule.condition} → {rule.alert_stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict resolution */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Conflict Resolution Matrix</span>
          <div className="grid grid-cols-1 gap-1.5 mt-1.5">
            {Object.entries(policy.conflict_resolution_matrix || {}).map(([key, rule]) => (
              <div key={key} className="bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 flex items-start gap-2">
                <span className="text-[9.5px] font-mono font-bold text-indigo-300 shrink-0 uppercase">{replLabel(key)}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9.5px] text-app-text-muted">If: {rule.condition}</span>
                  <span className="text-[9.5px] text-app-text-secondary leading-snug">Resolved: {rule.resolution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended action catalog */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Recommended Action Catalog</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1.5">
            {Object.entries(policy.recommended_actions_catalog || {}).map(([key, action]) => (
              <div key={key} className="bg-app-surface-elevated border border-app-border rounded-lg p-2 flex flex-col">
                <span className={`text-[10px] font-bold font-mono ${bandColor[key] || 'text-app-text-primary'}`}>{key}</span>
                <span className="text-[9.5px] text-app-text-secondary leading-snug mt-0.5">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standards authority */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Standards Authority</span>
          <p className="text-[10.5px] text-app-text-secondary leading-snug mt-1">{policy.standards_authority}</p>
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
    borderRadius: '8px',
    fontSize: '11px',
    color: tooltipText,
  };

  // Prefer the real live sweep when present; else derive from the active view.
  const isLiveCounts = Boolean(summary) && summary.risk_class_counts;
  const riskData = isLiveCounts
    ? ['EXTREME', 'HIGH', 'MODERATE', 'LOW'].map((k) => ({ label: k, value: summary.risk_class_counts[k] || 0 }))
    : riskClassDistribution(decisions);
  const priorityData = isLiveCounts
    ? ['CRITICAL', 'WARNING', 'WATCH', 'INFORMATION'].map((k) => ({ label: k, value: summary.alert_priority_counts[k] || 0 }))
    : alertPriorityDistribution(decisions);
  const dqData = isLiveCounts
    ? Object.entries(summary.data_quality_counts || {})
        .map(([label, value]) => ({ label: replLabel(label), value }))
        .sort((a, b) => b.value - a.value)
    : dataQualityDistribution(decisions).map((d) => ({ label: replLabel(d.label), value: d.value }));

  const chartCls = (k) => CHART_FILL[k] || '#818CF8';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <PanelCard
        icon="bar_chart"
        title="Risk Class Distribution"
        subtitle={isLiveCounts ? 'Live state-wide sweep' : 'Active decision view'}
      >
        <div className="h-[200px] w-full mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke={axisTextColor} fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Points']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {riskData.map((entry) => (
                  <Cell key={`r-${entry.label}`} fill={chartCls(entry.label)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>

      <PanelCard icon="notifications_active" title="Alert Priority Distribution" subtitle={isLiveCounts ? 'Live state-wide sweep' : 'Active decision view'}>
        <div className="h-[200px] w-full mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" stroke={axisTextColor} fontSize={10} tickLine={false} />
              <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Points']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={`p-${entry.label}`} fill={chartCls(entry.label)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </PanelCard>

      <PanelCard icon="database" title="Data Quality Distribution" subtitle={isLiveCounts ? 'Live state-wide sweep' : 'Active decision view'}>
        <div className="flex flex-col gap-1.5 mt-1 max-h-[200px] overflow-y-auto pr-1">
          {dqData.length ? (
            dqData.map((d) => (
              <div key={d.label} className="flex items-center justify-between text-[10.5px]">
                <span className="font-semibold text-app-text-primary">{d.label}</span>
                <span className="font-mono text-app-text-secondary">{d.value}</span>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-app-text-muted text-center py-6">No data quality breakdown available.</p>
          )}
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
    <label className="flex flex-col gap-0.5">
      <span className="text-[9.5px] font-bold uppercase tracking-wider text-app-text-muted">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full bg-app-surface-elevated border border-app-border rounded-lg px-2 py-1 text-[11.5px] font-mono text-app-text-primary outline-none focus:border-indigo-500/50"
        />
        {suffix && <span className="text-[9.5px] text-app-text-muted font-mono shrink-0">{suffix}</span>}
      </div>
    </label>
  );
}

function EvaluatePanel() {
  const [form, setForm] = useState(EVAL_DEFAULTS);
  const [status, setStatus] = useState('idle'); // idle | loading | ok | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runEvaluation = async () => {
    // Client-side validation first — never send malformed inputs.
    const numericRules = [
      { key: 'rainfall_1h_mm', label: 'Rainfall 1h', min: 0, max: 500 },
      { key: 'rainfall_30min_mm', label: 'Rainfall 30m', min: 0, max: 300 },
      { key: 'rainfall_3h_mm', label: 'Rainfall 3h', min: 0, max: 1000 },
      { key: 'surface_soil_moisture_vol', label: 'Surface Soil Moisture', min: 0, max: 1, step: 0.01 },
      { key: 'soil_saturation_index', label: 'Soil Saturation', min: 0, max: 1, step: 0.01 },
      { key: 'elevation_m', label: 'Elevation', min: 0, max: 9000 },
      { key: 'slope_deg', label: 'Slope', min: 0, max: 90 },
    ];
    const issues = [];
    numericRules.forEach((r) => {
      const raw = form[r.key];
      const num = Number(raw);
      if (raw === '' || raw === null || raw === undefined || !Number.isFinite(num)) {
        issues.push(`${r.label} must be a valid number`);
      } else if (num < r.min || num > r.max) {
        issues.push(`${r.label} must be between ${r.min} and ${r.max}`);
      }
    });
    if (issues.length > 0) {
      setResult(null);
      setStatus('error');
      setError(`Check inputs before running: ${issues.join('; ')}.`);
      return;
    }

    setStatus('loading');
    setError('');
    setResult(null);
    const payload = {
      rainfall_1h_mm: Number(form.rainfall_1h_mm) || 0,
      rainfall_30min_mm: Number(form.rainfall_30min_mm) || 0,
      rainfall_3h_mm: Number(form.rainfall_3h_mm) || 0,
      surface_soil_moisture_vol: Number(form.surface_soil_moisture_vol),
      soil_saturation_index: Number(form.soil_saturation_index),
      elevation_m: Number(form.elevation_m),
      slope_deg: Number(form.slope_deg),
      landcover_class: Number(form.landcover_class) || 10,
      district: form.district || 'Chamoli',
      ...(form.station_id ? { station_id: form.station_id } : {}),
    };
    const res = await evaluateLive(payload);
    if (res.ok) {
      setResult(res.data);
      setStatus('ok');
    } else {
      setError(res.error || 'Live evaluation failed.');
      setStatus('error');
    }
  };

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const selectClass =
    'w-full bg-app-surface-elevated border border-app-border rounded-lg px-2 py-1 text-[11.5px] text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer';

  return (
    <PanelCard
      icon="science"
      title="On-Demand Model Evaluation"
      subtitle="Run live XGBoost inference + SCS-CN physics + CWC fusion"
      badge={<span className="text-[11px] font-bold text-app-text-muted">POST /risk/evaluate</span>}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <NumberField label="Rainfall 1h (mm)" value={form.rainfall_1h_mm} onChange={set('rainfall_1h_mm')} min={0} step="1" />
          <NumberField label="Rainfall 30m (mm)" value={form.rainfall_30min_mm} onChange={set('rainfall_30min_mm')} min={0} step="1" />
          <NumberField label="Rainfall 3h (mm)" value={form.rainfall_3h_mm} onChange={set('rainfall_3h_mm')} min={0} step="1" />
          <NumberField label="Soil Saturation" value={form.soil_saturation_index} onChange={set('soil_saturation_index')} min={0} max={1} step="0.01" />
          <NumberField label="Surface Soil Moisture" value={form.surface_soil_moisture_vol} onChange={set('surface_soil_moisture_vol')} min={0} max={1} step="0.01" />
          <NumberField label="Elevation (m)" value={form.elevation_m} onChange={set('elevation_m')} min={0} step="1" />
          <NumberField label="Slope (deg)" value={form.slope_deg} onChange={set('slope_deg')} min={0} max={90} step="1" />
          <label className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-app-text-muted">Land Cover</span>
            <select value={form.landcover_class} onChange={(e) => set('landcover_class')(Number(e.target.value))} className={selectClass}>
              {LANDCOVER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} ({o.value})</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-app-text-muted">Station Context</span>
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
          className="self-start px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-wait text-white text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span className={`material-symbols-outlined text-[14px] ${status === 'loading' ? 'animate-spin' : ''}`}>
            {status === 'loading' ? 'progress_activity' : 'play_arrow'}
          </span>
          {status === 'loading' ? 'Running Live Evaluation…' : 'Run Live Evaluation'}
        </button>

        {status === 'error' && (
          <div className="bg-red-500/5 border border-red-500/25 rounded-lg p-2.5 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
            <div className="flex flex-col min-w-0">
              <span className="text-[10.5px] font-bold text-red-500 uppercase tracking-wider">
                Live Evaluation Unavailable
              </span>
              <p className="text-[11px] text-app-text-secondary leading-snug mt-0.5">{error}</p>
              <p className="text-[9.5px] text-app-text-muted mt-1">
                This is a real response from the /risk/evaluate endpoint — not synthesized client-side. Check inputs
                or confirm the backend ML inference service is available.
              </p>
            </div>
          </div>
        )}

        {status === 'ok' && result && (
          <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-lg p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10.5px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Live Evaluation Result
              </span>
              <SourceBadge source="LIVE_BACKEND" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-app-text-muted block">Probability</span>
                <span className={`text-[18px] font-bold font-mono ${result.flood_probability >= 0.7 ? 'text-red-500' : result.flood_probability >= 0.4 ? 'text-orange-500' : result.flood_probability >= 0.2 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {Math.round(result.flood_probability * 100)}%
                </span>
              </div>
              <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-app-text-muted block">Risk Class</span>
                <div className="inline-flex mt-1"><Badge text={result.final_risk_class} map={RISK_BADGE} fallback="LOW" /></div>
              </div>
              <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-app-text-muted block">SCS-CN Q</span>
                <span className="text-[16px] font-bold font-mono text-app-text-primary">{result.scs_direct_runoff_q_mm ?? '—'} mm</span>
              </div>
              <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-app-text-muted block">Model</span>
                <span className="text-[12px] font-bold font-mono text-indigo-300 leading-tight">{result.model_name}<br />v{result.model_version}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <DetailRow label="Operational State" value={stateLabel(result.operational_state)} />
              <DetailRow label="Alert Priority" value={result.alert_priority} />
              <DetailRow label="Data Quality" value={stageLabel(result.data_quality_status)} />
              <DetailRow label="Confidence" value={result.decision_confidence != null ? `${Math.round(result.decision_confidence * 100)}%` : 'Not available'} mono />
            </div>
            <p className="text-[10.5px] text-app-text-secondary leading-snug">{result.decision_reason}</p>
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-orange-400">Recommended Action</span>
              <p className="text-[10.5px] text-app-text-primary leading-snug mt-0.5">{result.recommended_action}</p>
            </div>
            <p className="text-[9px] text-app-text-muted">
              Evaluated at {result.generated_at_utc ? new Date(result.generated_at_utc).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }) : 'Live'} · Threshold {result.ml_decision_threshold}
            </p>
          </div>
        )}
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function ModelIntelligencePage() {
  const [decisions, setDecisions] = useState(REFERENCE_DECISIONS_WITH_ACTIONS);
  const [source, setSource] = useState('CALIBRATED_REFERENCE');
  const [sourceReason, setSourceReason] = useState(
    'Loading live model data… reference values shown until the request resolves.'
  );
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
        : dec.reason || 'Showing calibrated reference (live model snapshot unavailable).'
    );
    setSummary(sum.summary);
    setPolicy(pol.policy);
    setPolicySource(pol.source);
    // Keep the selected decision valid.
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
          : dec.reason || 'Showing calibrated reference (live model snapshot unavailable).'
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

  const handleReset = () => {
    setDistrictFilter('ALL');
    setRiskFilter('ALL');
  };

  const selectClass =
    'bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer text-[11.5px] font-medium';

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3.5">
        <div>
          <h1 className="text-[17px] font-bold text-app-text-primary tracking-tight font-sans">
            MODEL INTELLIGENCE
          </h1>
          <p className="text-[11.5px] font-medium text-app-text-secondary">
            Flood risk model &amp; decision pipeline — Phase 6 ML, SCS-CN hydrology, CWC thresholds, Policy v8.1.0
          </p>
        </div>

        {/* Filter / Control Bar */}
        <div className="bg-app-surface border border-app-border p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2.5 select-none">
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
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

            <span className="text-[10.5px] text-app-text-muted font-medium flex items-center gap-1.5">
              <SourceBadge source={source} />
            </span>
          </div>

          <button
            onClick={() => loadAll(true)}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-app-surface-elevated hover:bg-app-surface-hover text-app-text-muted hover:text-app-text-primary border border-app-border transition-colors text-[11.5px] font-semibold flex items-center gap-1 disabled:opacity-60 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[14px] ${refreshing ? 'animate-spin' : ''}`}>refresh</span>
            {refreshing ? 'Refreshing…' : 'Refresh Model Data'}
          </button>
        </div>

        <LiveStatusBanner source={source} reason={sourceReason} summary={summary} />
      </div>

      {/* 2. Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Model in Use" value="XGBoost" subtext={`v${MODEL_META.modelVersion} · PPT upgraded`} icon="psychology" accent="indigo" />
        <KpiCard label="Risk Policy" value={`v${MODEL_META.policyVersion}`} subtext="Multi-signal fusion engine" icon="policy" accent="indigo" />
        <KpiCard label="Decision Threshold" value={Number(MODEL_META.decisionThreshold).toFixed(2)} subtext="ML probability banding" icon="straighten" accent="amber" />
        <KpiCard label="Peak Probability" value={kpis.maxProbability != null ? `${Math.round(kpis.maxProbability * 100)}%` : '—'} subtext={kpis.maxProbabilityStation} icon="trending_up" accent="indigo" />
        <KpiCard label="High / Extreme" value={kpis.highExtreme} subtext={`${kpis.warningsActive} warning-critical`} icon="crisis_alert" accent="red" />
      </div>

      {/* 3. Decision Register + Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <DecisionList decisions={filteredDecisions} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-5">
          {selectedDecision ? (
            <DecisionDetail decision={selectedDecision} kpis={kpis} />
          ) : (
            <PanelCard icon="info" title="Model Decision Detail" subtitle="Nothing selected">
              <p className="text-[12px] text-app-text-muted py-6 text-center">
                No model decisions match the current filters. Adjust or reset the filters above.
              </p>
            </PanelCard>
          )}
        </div>
      </div>

      {/* 4. Live Snapshot + Policy */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
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