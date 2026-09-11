import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AlertPanelCard from '../components/alerts/AlertPanelCard';
import {
  ALERTS,
  ALERT_DISTRICTS,
  ALERT_TYPES_LIST,
  ALERT_STATUSES,
  SEVERITY_ORDER,
  computeAlertKpis,
  loadAlerts,
  buildAlertTimeline,
} from '../services/alertsService';

const STATUS_OPTIONS = ['ALL', ...ALERT_STATUSES];
const SEVERITY_OPTIONS = ['ALL', 'EXTREME', 'HIGH', 'MODERATE', 'LOW'];

const SEVERITY_BADGE = {
  EXTREME: 'bg-red-500/10 border-red-500/30 text-red-500',
  HIGH: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  MODERATE: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  LOW: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
};

const PRIORITY_COLOR = {
  CRITICAL: 'text-red-500',
  WARNING: 'text-orange-500',
  WATCH: 'text-amber-500',
  INFORMATION: 'text-emerald-500',
};

const STATUS_BADGE = {
  ACTIVE: 'bg-red-500/10 border-red-500/30 text-red-500',
  ACKNOWLEDGED: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
  RESOLVED: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
  EXPIRED: 'bg-slate-500/10 border-slate-500/30 text-app-text-muted',
};

const TYPE_ICON = {
  'RIVER STAGE': 'waves',
  'FLASH FLOOD': 'flash_on',
  'LAKE / GLOF WATCH': 'landscape',
  'RUNOFF EVENT': 'water_drop',
};

function StatusPill({ status }) {
  const cls = STATUS_BADGE[status] || STATUS_BADGE.EXPIRED;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider ${cls}`}>
      {status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {status}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const cls = SEVERITY_BADGE[severity] || SEVERITY_BADGE.LOW;
  return (
    <span className={`px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${cls}`}>
      {severity}
    </span>
  );
}

function KpiCard({ label, value, subtext, icon, accent }) {
  const accentMap = {
    red: { bubble: 'bg-red-500/15 text-red-500 border-red-500/25', value: 'text-red-500' },
    orange: { bubble: 'bg-orange-500/15 text-orange-500 border-orange-500/25', value: 'text-orange-500' },
    amber: { bubble: 'bg-amber-500/15 text-amber-500 border-amber-500/25', value: 'text-amber-500' },
    emerald: { bubble: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/25', value: 'text-emerald-500' },
    sky: { bubble: 'bg-sky-500/15 text-sky-400 border-sky-500/25', value: 'text-app-text-primary' },
  };
  const a = accentMap[accent] || accentMap.sky;
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
// ACTIVE ALERT LIST / TABLE
// ---------------------------------------------------------------------------
function AlertList({ alerts, selectedId, onSelect }) {
  return (
    <AlertPanelCard
      icon="notification_important"
      title="Active Alert Register"
      subtitle="Select an alert to inspect detailed context"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{alerts.length} shown</span>}
    >
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[520px] pr-1">
        {alerts.map((alert) => {
          const selected = alert.id === selectedId;
          return (
            <div
              key={alert.id}
              onClick={() => onSelect && onSelect(alert.id)}
              className={`grid grid-cols-12 items-center gap-2 bg-app-surface-elevated border rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 group ${
                selected ? 'border-indigo-500/60 shadow-md' : 'border-app-border hover:border-app-border/80'
              }`}
            >
              <div className="col-span-12 lg:col-span-4 flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[16px] text-indigo-400/80 shrink-0">{TYPE_ICON[alert.type] || 'notifications'}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-bold text-app-text-primary truncate group-hover:text-indigo-300 transition-colors">
                    {alert.stationName}
                  </div>
                  <div className="text-[10px] text-app-text-muted font-mono truncate">{alert.id}</div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-3 flex flex-col min-w-0 lg:px-1">
                <SeverityBadge severity={alert.severity} />
                <div className="text-[10.5px] text-app-text-secondary truncate mt-0.5">
                  {alert.district} &bull; {alert.river}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">
                <span className="text-[13px] font-mono font-bold text-app-text-primary">
                  {Math.round(alert.probability * 100)}%
                </span>
                <span className={`text-[9.5px] font-bold uppercase tracking-wider ${PRIORITY_COLOR[alert.priority] || 'text-app-text-muted'}`}>
                  {alert.priority}
                </span>
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">
                <StatusPill status={alert.status} />
                <span className="text-[9.5px] text-app-text-muted truncate mt-0.5">{alert.updatedAt}</span>
              </div>

              <div className="col-span-12 lg:col-span-1 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect && onSelect(alert.id);
                  }}
                  className="text-[10px] font-semibold text-indigo-400 flex items-center gap-0.5 hover:underline"
                >
                  Inspect <span className="material-symbols-outlined text-[11px]">chevron_right</span>
                </button>
              </div>
            </div>
          );
        })}
        {!alerts.length && (
          <p className="text-[12px] text-app-text-muted text-center py-10">No alerts match the current filters.</p>
        )}
      </div>
    </AlertPanelCard>
  );
}

// ---------------------------------------------------------------------------
// ALERT DETAIL / INSPECTION PANEL
// ---------------------------------------------------------------------------
function FactorRow({ factor }) {
  const weightColor =
    factor.weight === 'DOMINANT'
      ? 'text-red-500'
      : factor.weight === 'HIGH'
      ? 'text-orange-500'
      : factor.weight === 'MEDIUM'
      ? 'text-amber-500'
      : 'text-emerald-500';
  return (
    <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-app-text-primary">{factor.signal}</span>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${weightColor}`}>{factor.weight}</span>
      </div>
      <span className="text-[11px] font-mono text-indigo-300">{factor.value}</span>
      <span className="text-[10px] text-app-text-secondary leading-snug">{factor.explanation}</span>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-app-border/50 last:border-0">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted shrink-0">{label}</span>
      <span className={`text-[11.5px] text-app-text-primary text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

function AlertDetail({ alert, onAcknowledge, onResolve, timeline }) {
  const navigate = useNavigate();
  const stageColor =
    alert.stage === 'DANGER ZONE' ? 'text-red-500' : alert.stage === 'WARNING ZONE' ? 'text-orange-500' : 'text-emerald-500';

  return (
    <AlertPanelCard
      icon="visibility"
      title="Alert Detail"
      subtitle={alert.id}
      badge={<SeverityBadge severity={alert.severity} />}
      right={<StatusPill status={alert.status} />}
    >
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">{TYPE_ICON[alert.type] || 'notifications'}</span>
            <h2 className="text-[15px] font-bold text-app-text-primary">{alert.stationName}</h2>
          </div>
          <p className="text-[11px] text-app-text-secondary mt-0.5">
            {alert.type} &bull; {alert.district} District &bull; {alert.basin}
          </p>
          <div className="mt-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${stageColor}`}>{alert.stage}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <DetailRow label="Alert Type" value={alert.type} />
          <DetailRow label="Severity" value={alert.severity} mono />
          <DetailRow label="Priority" value={alert.priority} mono />
          <DetailRow label="Location" value={`${alert.district} / ${alert.river}`} />
          <DetailRow label="Risk Probability" value={`${Math.round(alert.probability * 100)}%`} mono />
          <DetailRow label="Rainfall" value={alert.rainfallMm != null ? `${alert.rainfallMm} mm/h` : '—'} mono />
          <DetailRow
            label="Water Level"
            value={alert.waterLevel != null ? `${alert.waterLevel} m` : 'Gauge offline'}
            mono
          />
          <DetailRow label="Generated" value={alert.generatedAt} />
          <DetailRow label="Last Updated" value={alert.updatedAt} />
          <DetailRow label="Data Source" value={alert.source === 'LIVE_BACKEND' ? 'Live backend' : 'Calibrated fallback'} mono />
        </div>

        {/* Trigger / reason */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Trigger / Reason</span>
          <p className="text-[11px] text-app-text-secondary leading-snug mt-1">{alert.trigger}</p>
        </div>

        {/* Contributing factors */}
        {alert.factors && alert.factors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Contributing Factors</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {alert.factors.map((f, i) => (
                <FactorRow key={i} factor={f} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended action */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">warning</span> Recommended Response
          </span>
          <p className="text-[11px] text-app-text-primary leading-snug mt-1">{alert.action}</p>
        </div>

        {/* Lifecycle actions (local UI state — not persisted remotely) */}
        <div className="flex items-center gap-2 flex-wrap">
          {alert.status === 'ACTIVE' && (
            <button
              onClick={() => onAcknowledge && onAcknowledge(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">task_alt</span> Acknowledge
            </button>
          )}
          {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
            <button
              onClick={() => onResolve && onResolve(alert.id)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/25 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[13px]">check</span> Mark Resolved
            </button>
          )}
          <span className="text-[9.5px] text-app-text-muted ml-auto">Lifecycle changes are local UI state</span>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-1 border-t border-app-border/60">
          <button
            onClick={() => navigate('/risk-map')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">map</span> View Risk Map
          </button>
          <button
            onClick={() => navigate('/monitoring')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sensors</span> View Monitoring
          </button>
        </div>
      </div>
    </AlertPanelCard>
  );
}

// ---------------------------------------------------------------------------
// TIMELINE / EVENT HISTORY
// ---------------------------------------------------------------------------
function Timeline({ alert }) {
  const events = buildAlertTimeline(alert);
  const kindColor = {
    GENERATED: 'text-indigo-400',
    UPDATED: 'text-amber-500',
    ACKNOWLEDGED: 'text-amber-400',
    ESCALATED: 'text-red-500',
    RESOLVED: 'text-emerald-500',
    EXPIRED: 'text-app-text-muted',
  };
  return (
    <AlertPanelCard
      icon="timeline"
      title="Alert Timeline / Event History"
      subtitle="Deterministic event record for this alert"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{events.length} events</span>}
    >
      <div className="flex flex-col">
        {events.map((ev, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="flex flex-col items-center">
              <span className={`w-2 h-2 rounded-full mt-1 ${(kindColor[ev.kind] || 'text-app-text-muted').replace('text-', 'bg-')}`} />
              {i < events.length - 1 && <span className="w-px flex-1 bg-app-border" />}
            </div>
            <div className="pb-3 flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${kindColor[ev.kind] || 'text-app-text-muted'}`}>{ev.title}</span>
                <span className="text-[9.5px] text-app-text-muted font-mono">{ev.time}</span>
              </div>
              <p className="text-[10.5px] text-app-text-secondary leading-snug mt-0.5">{ev.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </AlertPanelCard>
  );
}

// ---------------------------------------------------------------------------
// EARLY WARNING / RESPONSE PANEL
// ---------------------------------------------------------------------------
function EarlyWarningPanel({ alert, kpis }) {
  const navigate = useNavigate();
  const levelColor =
    alert.severity === 'EXTREME'
      ? 'text-red-500'
      : alert.severity === 'HIGH'
      ? 'text-orange-500'
      : alert.severity === 'MODERATE'
      ? 'text-amber-500'
      : 'text-emerald-500';

  const bars = [
    { label: 'Probability', value: Math.round(alert.probability * 100), color: 'bg-red-500' },
    { label: 'Rainfall', value: Math.min(alert.rainfallMm ?? 0, 100), color: 'bg-sky-500' },
    { label: 'Soil Saturation', value: alert.soilSaturation ?? 0, color: 'bg-amber-500' },
  ];

  return (
    <AlertPanelCard
      icon="siren"
      title="Early Warning / Response"
      subtitle="Observation vs model-derived signal"
      badge={<StatusPill status={alert.status} />}
    >
      <div className="flex flex-col gap-3">
        {/* Warning level */}
        <div className="flex items-center justify-between bg-app-surface-elevated border border-app-border rounded-lg p-3">
          <div className="flex flex-col">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Warning Level</span>
            <span className={`text-[18px] font-bold font-mono tracking-tight ${levelColor}`}>{alert.stage}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Trigger</span>
            <span className="text-[11.5px] text-app-text-primary font-semibold">{alert.driver}</span>
          </div>
        </div>

        {/* Signal bars */}
        <div className="flex flex-col gap-1.5">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-col gap-0.5">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">{b.label}</span>
                <span className="text-[10.5px] font-mono text-app-text-primary">{b.value}%</span>
              </div>
              <div className="h-1.5 bg-app-surface-elevated border border-app-border rounded-full overflow-hidden">
                <div className={`h-full ${b.color} transition-all duration-500`} style={{ width: `${Math.min(Math.max(b.value, 0), 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Escalation state */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Escalation State</span>
            <span className={`text-[12px] font-bold ${PRIORITY_COLOR[alert.priority] || 'text-app-text-primary'}`}>
              {alert.priority === 'CRITICAL'
                ? 'EMERGENCY RESPONSE'
                : alert.priority === 'WARNING'
                ? 'PREPAREDNESS WARNING'
                : alert.priority === 'WATCH'
                ? 'ELEVATED WATCH'
                : 'ROUTINE MONITORING'}
            </span>
          </div>
          <span className="text-[10px] text-app-text-muted font-mono">Policy v8.1.0</span>
        </div>

        {/* Confidence / data quality */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Confidence &amp; Data Quality</span>
          <p className="text-[11px] text-app-text-secondary leading-snug mt-1">
            {alert.source === 'LIVE_BACKEND'
              ? 'Derived from live multi-signal risk decisions with the backend risk engine.'
              : 'Calibrated canonical data: live gauge/ML telemetry not yet available for this location, so severity is derived from the established station-level risk picture.'}
            {' '}Each signal bar reflects observed (gauge/rainfall) or model-derived (probability, runoff) values.
          </p>
        </div>

        {/* Recommended action */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Recommended Action</span>
          <p className="text-[11px] text-app-text-primary leading-snug mt-1">{alert.action}</p>
        </div>

        <div className="flex items-center gap-2">
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
    </AlertPanelCard>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function AlertsManagementPage() {
  const [alerts, setAlerts] = useState(ALERTS);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(ALERTS[0].id);

  // Establishes canonical fallback first; merges live only when valid.
  useEffect(() => {
    let mounted = true;
    async function load() {
      const live = await loadAlerts();
      if (!mounted) return;
      if (Array.isArray(live) && live.length > 0) {
        setAlerts(live);
        const top = [...live].sort(
          (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || b.probability - a.probability
        )[0];
        if (top) setSelectedId(top.id);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
      if (districtFilter !== 'ALL' && a.district !== districtFilter) return false;
      if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, statusFilter, severityFilter, districtFilter, typeFilter]);

  // Summary values are derived from the FILTERED set so filters update KPIs too.
  const kpis = useMemo(() => computeAlertKpis(filteredAlerts), [filteredAlerts]);

  const selectedAlert = useMemo(() => {
    const found = filteredAlerts.find((a) => a.id === selectedId);
    if (found) return found;
    return [...filteredAlerts].sort(
      (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || b.probability - a.probability
    )[0] || null;
  }, [filteredAlerts, selectedId]);

  // Local lifecycle transitions (no backend persistence endpoint).
  const handleAcknowledge = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id && a.status === 'ACTIVE'
          ? { ...a, status: 'ACKNOWLEDGED', updatedAt: 'Acknowledged · local UI state' }
          : a
      )
    );
  };

  const handleResolve = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        (a.id === id && (a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED'))
          ? { ...a, status: 'RESOLVED', updatedAt: 'Resolved · local UI state' }
          : a
      )
    );
  };

  const handleReset = () => {
    setStatusFilter('ALL');
    setSeverityFilter('ALL');
    setDistrictFilter('ALL');
    setTypeFilter('ALL');
  };

  const selectClass =
    'bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer text-[11.5px] font-medium';

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-3.5">
        <div>
          <h1 className="text-[17px] font-bold text-app-text-primary tracking-tight font-sans">
            ALERTS &amp; EARLY WARNING
          </h1>
          <p className="text-[11.5px] font-medium text-app-text-secondary">
            Operational management of active flood warnings and response signals across Uttarakhand
          </p>
        </div>

        {/* Filter / Control Bar */}
        <div className="bg-app-surface border border-app-border p-3 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-2.5 select-none">
          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'Status: All' : `Status: ${s}`}</option>
              ))}
            </select>

            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClass}>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'Severity: All' : `Severity: ${s}`}</option>
              ))}
            </select>

            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass}>
              <option value="ALL">District: All</option>
              {ALERT_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="ALL">Type: All</option>
              {ALERT_TYPES_LIST.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-app-surface-elevated hover:bg-app-surface-hover text-app-text-muted hover:text-app-text-primary border border-app-border transition-colors text-[11.5px] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
            Reset Filters
          </button>
        </div>
      </div>

      {/* 2. Alert Summary / KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard label="Active Alerts" value={kpis.activeAlerts} subtext="Currently unresolved" icon="notifications_active" accent="red" />
        <KpiCard label="Critical / Extreme" value={kpis.criticalExtreme} subtext="Immediate response priority" icon="crisis_alert" accent="red" />
        <KpiCard label="High / Warning" value={kpis.highWarning} subtext="Heightened vigilance" icon="warning" accent="orange" />
        <KpiCard label="Acknowledged" value={kpis.acknowledged} subtext="Awaiting resolution" icon="task_alt" accent="amber" />
        <KpiCard label="Resolved / Cleared" value={kpis.resolved} subtext={`${kpis.expired} expired`} icon="verified" accent="emerald" />
      </div>

      {/* 3. Alert List + Detail (main work surface) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <AlertList alerts={filteredAlerts} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="xl:col-span-2">
          {selectedAlert ? (
            <AlertDetail
              alert={selectedAlert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ) : (
            <AlertPanelCard icon="info" title="Alert Detail" subtitle="No alert selected">
              <p className="text-[12px] text-app-text-muted py-6 text-center">
                No alerts match the current filters. Adjust or reset the filters above to inspect an alert.
              </p>
            </AlertPanelCard>
          )}
        </div>
      </div>

      {/* 4. Timeline + Early Warning / Response */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          {selectedAlert ? <Timeline alert={selectedAlert} /> : null}
        </div>
        <div className="xl:col-span-2">
          {selectedAlert ? <EarlyWarningPanel alert={selectedAlert} kpis={kpis} /> : null}
        </div>
      </div>
    </div>
  );
}
