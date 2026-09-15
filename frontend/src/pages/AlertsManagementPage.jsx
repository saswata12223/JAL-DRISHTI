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

function KpiCard({ label, value, subtext, accent }) {
  const accentMap = {
    red: { value: 'text-red-500' },
    orange: { value: 'text-orange-500' },
    amber: { value: 'text-amber-500' },
    emerald: { value: 'text-emerald-500' },
    sky: { value: 'text-app-text-primary' },
  };
  const a = accentMap[accent] || accentMap.sky;
  return (
    <div className="bg-app-surface border border-app-border p-6 rounded-xl shadow-sm flex flex-col gap-1 select-none h-full justify-center">
      <span className="text-[11px] font-bold text-app-text-muted uppercase tracking-wider block truncate">{label}</span>
      <span className={`text-[32px] font-bold leading-none font-mono tracking-tight ${a.value}`}>{value}</span>
      <span className="text-[11px] text-app-text-secondary font-medium block truncate mt-1">{subtext}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ACTIVE ALERT LIST / TABLE
// ---------------------------------------------------------------------------
function AlertList({ alerts, selectedId, onSelect }) {
  return (
    <AlertPanelCard
      title="Active Alert Register"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{alerts.length} shown</span>}
    >
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[560px] pr-1">
        {alerts.map((alert) => {
          const selected = alert.id === selectedId;
          return (
            <div
              key={alert.id}
              onClick={() => onSelect && onSelect(alert.id)}
              className={`flex items-center justify-between gap-4 bg-app-surface-elevated border rounded-xl px-4 py-3 cursor-pointer transition-all duration-150 group ${
                selected ? 'border-indigo-500/60 shadow-md bg-indigo-50/50' : 'border-app-border hover:border-app-border/80'
              }`}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[14px] font-bold text-app-text-primary truncate group-hover:text-indigo-400 transition-colors">
                    {alert.stationName}
                  </span>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <div className="text-[11px] text-app-text-secondary truncate">
                  {alert.type} &bull; {alert.district} District &bull; {alert.river}
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="flex flex-col items-end min-w-[60px]">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-app-text-muted">Risk</span>
                  <span className="text-[14px] font-mono font-bold text-app-text-primary">
                    {Math.round(alert.probability * 100)}%
                  </span>
                </div>

                <div className="flex flex-col items-end min-w-[80px]">
                  <StatusPill status={alert.status} />
                  <span className="text-[10px] text-app-text-muted mt-1 font-mono">{alert.updatedAt.split(' ')[0]}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect && onSelect(alert.id);
                  }}
                  className="text-[11px] font-semibold text-indigo-500 flex items-center gap-0.5 hover:underline"
                >
                  Inspect <span className="material-symbols-outlined text-[13px]">chevron_right</span>
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
    <div className="flex items-center justify-between border-b border-app-border/50 py-2 last:border-0">
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-app-text-primary">{factor.signal}</span>
        <span className="text-[10px] text-app-text-secondary">{factor.explanation}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-[9.5px] font-bold uppercase tracking-wider ${weightColor}`}>{factor.weight}</span>
        <span className="text-[11.5px] font-mono text-app-text-primary">{factor.value}</span>
      </div>
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

function AlertDecisionPanel({ alert, onAcknowledge, onResolve }) {
  const navigate = useNavigate();
  const stageColor =
    alert.stage === 'DANGER ZONE' ? 'text-red-500' : alert.stage === 'WARNING ZONE' ? 'text-orange-500' : 'text-emerald-500';

  return (
    <AlertPanelCard
      title="Alert Detail & Response"
      subtitle={alert.id}
      badge={<SeverityBadge severity={alert.severity} />}
      right={<StatusPill status={alert.status} />}
    >
      <div className="flex flex-col gap-5">
        {/* Header Section */}
        <div>
          <h2 className="text-[18px] font-bold text-app-text-primary tracking-tight mb-1">{alert.stationName}</h2>
          <p className="text-[12px] text-app-text-secondary">
            {alert.type} &bull; {alert.district} District &bull; {alert.basin}
          </p>
          <div className="mt-3">
            <span className={`text-[13px] font-bold uppercase tracking-wider ${stageColor}`}>{alert.stage}</span>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-3 gap-3 border-y border-app-border/60 py-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-app-text-muted mb-1">Risk Probability</span>
            <span className="text-[16px] font-mono font-bold text-app-text-primary">{Math.round(alert.probability * 100)}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-app-text-muted mb-1">Rainfall</span>
            <span className="text-[16px] font-mono font-bold text-app-text-primary">{alert.rainfallMm != null ? `${alert.rainfallMm} mm/h` : '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-app-text-muted mb-1">Water Level</span>
            <span className="text-[16px] font-mono font-bold text-app-text-primary">{alert.waterLevel != null ? `${alert.waterLevel} m` : '—'}</span>
          </div>
        </div>

        {/* Why this matters (Trigger) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">Why This Matters</span>
          <p className="text-[13px] text-app-text-primary leading-relaxed">{alert.trigger}</p>
        </div>

        {/* Recommended Action */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">Recommended Response</span>
          <p className="text-[13px] font-medium text-app-text-primary leading-relaxed bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">{alert.action}</p>
        </div>

        {/* Lifecycle actions */}
        <div className="flex items-center gap-3 pt-2">
          {alert.status === 'ACTIVE' && (
            <button
              onClick={() => onAcknowledge && onAcknowledge(alert.id)}
              className="px-4 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-[12px] font-bold cursor-pointer transition-colors"
            >
              Acknowledge Alert
            </button>
          )}
          {(alert.status === 'ACTIVE' || alert.status === 'ACKNOWLEDGED') && (
            <button
              onClick={() => onResolve && onResolve(alert.id)}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-[12px] font-bold cursor-pointer transition-colors"
            >
              Mark Resolved
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 pt-4 border-t border-app-border/60">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[12px] font-semibold cursor-pointer transition-colors"
          >
            View Risk Map
          </button>
          <button
            onClick={() => navigate('/monitoring')}
            className="flex-1 px-4 py-2.5 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[12px] font-semibold cursor-pointer transition-colors"
          >
            View Monitoring
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
    GENERATED: 'text-indigo-500',
    UPDATED: 'text-amber-600',
    ACKNOWLEDGED: 'text-amber-500',
    ESCALATED: 'text-red-600',
    RESOLVED: 'text-emerald-600',
    EXPIRED: 'text-app-text-muted',
  };
  return (
    <AlertPanelCard
      title="Alert Timeline"
      subtitle="Event History"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{events.length} events</span>}
    >
      <div className="flex flex-col mt-2">
        {events.map((ev, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className={`w-2 h-2 rounded-full mt-1.5 ${(kindColor[ev.kind] || 'text-app-text-muted').replace('text-', 'bg-')}`} />
              {i < events.length - 1 && <span className="w-px flex-1 bg-app-border my-1" />}
            </div>
            <div className="pb-4 flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[12px] font-bold ${kindColor[ev.kind] || 'text-app-text-muted'}`}>{ev.title}</span>
                <span className="text-[10px] text-app-text-muted font-mono">{ev.time}</span>
              </div>
              <p className="text-[11.5px] text-app-text-secondary leading-snug">{ev.detail}</p>
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
function TechnicalDetailsPanel({ alert }) {
  const bars = [
    { label: 'Probability', value: Math.round(alert.probability * 100), color: 'bg-red-500' },
    { label: 'Rainfall', value: Math.min(alert.rainfallMm ?? 0, 100), color: 'bg-sky-500' },
    { label: 'Soil Saturation', value: alert.soilSaturation ?? 0, color: 'bg-amber-500' },
  ];

  return (
    <AlertPanelCard
      title="Supporting Technical Info"
      subtitle="Metadata & Evidence"
    >
      <div className="flex flex-col gap-6">
        
        {/* Contributing factors */}
        {alert.factors && alert.factors.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1">Contributing Factors</span>
            <div className="flex flex-col">
              {alert.factors.map((f, i) => (
                <FactorRow key={i} factor={f} />
              ))}
            </div>
          </div>
        )}

        {/* Signal bars */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1">Live Signals</span>
          <div className="flex flex-col gap-3">
            {bars.map((b) => (
              <div key={b.label} className="flex flex-col gap-1">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-secondary">{b.label}</span>
                  <span className="text-[10.5px] font-mono text-app-text-primary">{b.value}%</span>
                </div>
                <div className="h-1 bg-app-surface-elevated border border-app-border rounded-full overflow-hidden">
                  <div className={`h-full ${b.color}`} style={{ width: `${Math.min(Math.max(b.value, 0), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted mb-1">System Metadata</span>
          <DetailRow label="Generated" value={alert.generatedAt} />
          <DetailRow label="Last Updated" value={alert.updatedAt} />
          <DetailRow label="Data Source" value={alert.source === 'LIVE_BACKEND' ? 'Live backend' : 'Calibrated fallback'} mono />
          <DetailRow label="Policy" value="v8.1.0" mono />
        </div>

        {/* Confidence / data quality */}
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Confidence &amp; Data Quality</span>
          <p className="text-[11px] text-app-text-secondary leading-relaxed mt-1.5">
            {alert.source === 'LIVE_BACKEND'
              ? 'Derived from live multi-signal risk decisions with the backend risk engine.'
              : 'Calibrated canonical data: live gauge telemetry not yet available, severity derived from established station-level risk.'}
          </p>
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
        <KpiCard label="Active Alerts" value={kpis.activeAlerts} subtext="Currently unresolved" accent="red" />
        <KpiCard label="Critical / Extreme" value={kpis.criticalExtreme} subtext="Immediate response priority" accent="red" />
        <KpiCard label="High / Warning" value={kpis.highWarning} subtext="Heightened vigilance" accent="orange" />
        <KpiCard label="Acknowledged" value={kpis.acknowledged} subtext="Awaiting resolution" accent="amber" />
        <KpiCard label="Resolved / Cleared" value={kpis.resolved} subtext={`${kpis.expired} expired`} accent="emerald" />
      </div>

      {/* 3. Alert List + Detail (main work surface) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <AlertList alerts={filteredAlerts} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="lg:col-span-2">
          {selectedAlert ? (
            <AlertDecisionPanel
              alert={selectedAlert}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
            />
          ) : (
            <AlertPanelCard title="Alert Detail" subtitle="No alert selected">
              <p className="text-[12px] text-app-text-muted py-6 text-center">
                No alerts match the current filters. Adjust or reset the filters above to inspect an alert.
              </p>
            </AlertPanelCard>
          )}
        </div>
      </div>

      {/* 4. Timeline + Early Warning / Response */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          {selectedAlert ? <Timeline alert={selectedAlert} /> : null}
        </div>
        <div className="lg:col-span-2">
          {selectedAlert ? <TechnicalDetailsPanel alert={selectedAlert} /> : null}
        </div>
      </div>
    </div>
  );
}
