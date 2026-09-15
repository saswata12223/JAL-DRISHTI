import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import PanelCard from '../components/analytics/PanelCard';
import { STATIONS } from '../services/analyticsService';
import {
  HISTORICAL_EVENTS,
  EVENT_DISTRICTS,
  EVENT_TYPES,
  EVENT_YEARS,
  SEVERITY_ORDER,
  computeHistoricalKpis,
  eventCountByYear,
  severityDistribution,
  eventCountByDistrict,
  buildEventTimeline,
  loadHistoricalEvents,
  eventDurationDays,
  formatDate,
} from '../services/historicalEventsService';

const SEVERITY_BADGE = {
  Catastrophic: 'bg-red-500/10 border-red-500/30 text-red-500',
  Major: 'bg-orange-500/10 border-orange-500/30 text-orange-500',
  Moderate: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
};

const SEVERITY_BAR = {
  Catastrophic: '#DC2626',
  Major: '#F97316',
  Moderate: '#EAB308',
};

const SEVERITY_OPTIONS = ['ALL', 'Catastrophic', 'Major', 'Moderate'];

function SeverityBadge({ severity }) {
  const cls = SEVERITY_BADGE[severity] || SEVERITY_BADGE.Moderate;
  return (
    <span className={`px-1.5 py-px rounded-full border text-[9px] font-bold uppercase tracking-wider shrink-0 ${cls}`}>
      {severity}
    </span>
  );
}

function KpiCard({ label, value, subtext, accent }) {
  const accentMap = {
    red: 'text-red-500',
    orange: 'text-orange-500',
    amber: 'text-amber-500',
    sky: 'text-app-text-primary',
  };
  const color = accentMap[accent] || accentMap.sky;
  return (
    <div className="bg-app-surface border border-app-border/80 p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col select-none group">
      <span className="text-[10.5px] font-extrabold text-app-text-muted uppercase tracking-wider block truncate mb-1">
        {label}
      </span>
      <span className={`text-[24px] font-bold leading-tight font-mono tracking-tight ${color}`}>
        {value}
      </span>
      <span className="text-[11px] text-app-text-secondary font-medium block truncate mt-1">
        {subtext}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HISTORICAL EVENT LIST / TABLE
// ---------------------------------------------------------------------------
function EventList({ events, selectedId, onSelect }) {
  return (
    <PanelCard
      icon="history"
      title="Historical Event Register"
      subtitle="Documented flood / flash-flood / GLOF events (1970–2024)"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{events.length} events</span>}
    >
      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[540px] pr-1">
        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1 text-[9.5px] font-bold uppercase tracking-wider text-app-text-muted">
          <div className="col-span-4">Event / Date</div>
          <div className="col-span-3">District</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Peak Rain</div>
          <div className="col-span-1" />
        </div>

        {events.map((event) => {
          const selected = event.id === selectedId;
          return (
            <div
              key={event.id}
              onClick={() => onSelect && onSelect(event.id)}
              className={`grid grid-cols-12 items-center gap-2 bg-app-surface-elevated border rounded-lg px-3 py-2 cursor-pointer transition-all duration-150 group ${
                selected ? 'border-indigo-500/60 shadow-md' : 'border-app-border hover:border-app-border/80'
              }`}
            >
              <div className="col-span-12 lg:col-span-4 flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={event.severity} />
                  <span className="text-[12px] font-bold text-app-text-primary truncate group-hover:text-indigo-300 transition-colors">
                    {event.eventName}
                  </span>
                </div>
                <div className="text-[10px] text-app-text-muted font-mono mt-0.5">
                  {formatDate(event.eventDate)} &bull; {event.eventId}
                </div>
              </div>

              <div className="col-span-12 lg:col-span-3 flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-app-text-primary truncate">{event.primaryDistrictLabel}</span>
                <span className="text-[9.5px] text-app-text-muted truncate">{event.eventType}</span>
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">
                <span className="text-[10px] text-app-text-secondary truncate">{event.eventType}</span>
                <span className="text-[11px] font-mono font-bold text-app-text-primary mt-0.5">
                  {event.peakRainfallMm != null ? `${event.peakRainfallMm} mm` : '—'}
                </span>
              </div>

              <div className="col-span-12 lg:col-span-2 flex flex-col min-w-0">
                <span className="text-[10px] text-app-text-secondary truncate">
                  {eventDurationDays(event)} d
                </span>
                <span className="text-[10px] text-app-text-muted truncate">{event.confidence} conf.</span>
              </div>

              <div className="col-span-12 lg:col-span-1 flex justify-end">
                <span className={`text-[10.5px] font-bold ${selected ? 'text-indigo-400' : 'text-app-text-muted group-hover:text-indigo-400'} transition-colors`}>
                  Inspect
                </span>
              </div>
            </div>
          );
        })}
        {!events.length && (
          <p className="text-[12px] text-app-text-muted text-center py-10">No historical events match the current filters.</p>
        )}
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------
// EVENT DETAIL PANEL
// ---------------------------------------------------------------------------
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-app-border/50 last:border-0">
      <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted shrink-0">{label}</span>
      <span className={`text-[11.5px] text-app-text-primary text-right ${mono ? 'font-mono' : 'font-medium'}`}>{value || '—'}</span>
    </div>
  );
}

function EventDetail({ event }) {
  const navigate = useNavigate();
  return (
    <PanelCard
      title="Event Detail"
      subtitle={event.eventId}
      badge={<SeverityBadge severity={event.severity} />}
    >
      <div className="flex flex-col gap-5">
        {/* PRIMARY INFO */}
        <div>
          <h2 className="text-[17px] font-bold text-app-text-primary">{event.eventName}</h2>
          <p className="text-[11.5px] text-app-text-secondary font-medium mt-0.5">
            {formatDate(event.eventDate)} &bull; {event.location}
          </p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-0.5 rounded border border-app-border text-[10px] font-semibold text-app-text-secondary">
              {event.eventType}
            </span>
            <SeverityBadge severity={event.severity} />
          </div>
        </div>

        {/* PRIMARY MEASUREMENTS */}
        <div className="grid grid-cols-2 gap-3 border-y border-app-border/40 py-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Peak Rainfall</span>
            <span className="text-[14px] font-bold font-mono text-app-text-primary mt-0.5">
              {event.peakRainfallMm != null ? `${event.peakRainfallMm} mm` : '—'}
            </span>
            <span className="text-[10px] text-app-text-secondary mt-1">{event.rainfallInformation}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Peak Water Level</span>
            <span className="text-[14px] font-bold font-mono text-app-text-primary mt-0.5">
              {event.peakWaterLevelM != null ? `${event.peakWaterLevelM} m` : '—'}
            </span>
            <span className="text-[10px] text-app-text-secondary mt-1">{event.waterLevelInformation}</span>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-app-text-muted">Summary</span>
          <p className="text-[12px] text-app-text-primary font-medium leading-relaxed">{event.description}</p>
        </div>

        {/* SECONDARY METADATA */}
        <div className="flex flex-col gap-0 pt-2">
          <DetailRow label="Duration" value={`${eventDurationDays(event)} day(s)`} mono />
          <DetailRow label="District(s)" value={event.districts.join(', ')} />
          <DetailRow label="River Basin" value={event.riverBasin} />
          <DetailRow label="Triggering Hazard" value={event.triggeringHazard} />
          <DetailRow label="Affected Population" value={event.affectedPopulation ? event.affectedPopulation.toLocaleString() : '—'} mono />
          <DetailRow label="Recorded Deaths" value={event.deaths || 0} mono />
        </div>

        {/* TECHNICAL / SOURCE METADATA */}
        <details className="group border border-app-border/60 rounded-xl mt-2 bg-app-surface/50">
          <summary className="text-[10.5px] font-bold text-app-text-muted uppercase tracking-wider cursor-pointer p-3 hover:text-app-text-primary transition-colors select-none flex items-center justify-between">
            <span>Technical Metadata & Source</span>
            <span className="material-symbols-outlined text-[14px] group-open:rotate-180 transition-transform">expand_more</span>
          </summary>
          <div className="flex flex-col px-4 pb-4 gap-0">
            <DetailRow label="Event ID" value={event.eventId} mono />
            <DetailRow label="Data Source" value={event.source === 'LIVE_BACKEND' ? 'Live backend' : 'Canonical repository'} mono />
            <DetailRow label="Source Name" value={event.sourceName} />
            <DetailRow label="Confidence" value={event.confidence} mono />
            {event.sourceUrl && (
              <div className="flex items-start justify-between gap-2 py-1.5 border-b border-app-border/50 last:border-0">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted shrink-0">Source URL</span>
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-400 hover:underline break-all text-right"
                >
                  {event.sourceUrl}
                </a>
              </div>
            )}
          </div>
        </details>

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-1 border-t border-app-border/60">
          <button
            onClick={() => navigate('/monitoring')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sensors</span> View Monitoring
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="flex-1 px-3 py-2 rounded-lg bg-app-surface-elevated border border-app-border hover:bg-app-surface-hover text-app-text-primary text-[11.5px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">notifications_active</span> Current Alerts
          </button>
        </div>
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------
// HISTORICAL TREND / CHARTS
// ---------------------------------------------------------------------------
function EventCharts({ byYear, bySeverity }) {
  const { isDark } = useTheme();
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const gridColor = isDark ? '#1E2532' : '#E2E8F0';
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

  return (
    <PanelCard icon="bar_chart" title="Historical Trends" subtitle="Events by year and severity (filtered)">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Events by year */}
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Events by Year</span>
          <div className="h-[190px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byYear} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="year" stroke={axisTextColor} fontSize={10} tickLine={false} />
                <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Events']} />
                <Bar dataKey="count" fill="#818CF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events by severity */}
        <div>
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-app-text-muted">Events by Severity</span>
          <div className="h-[190px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySeverity} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="severity" stroke={axisTextColor} fontSize={10} tickLine={false} />
                <YAxis allowDecimals={false} stroke={axisTextColor} fontSize={10} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(val) => [`${val}`, 'Events']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bySeverity.map((entry) => (
                    <Cell key={`sev-${entry.severity}`} fill={SEVERITY_BAR[entry.severity] || '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------
// DISTRICT ANALYSIS
// ---------------------------------------------------------------------------
function DistrictAnalysis({ byDistrict }) {
  const max = byDistrict.length ? Math.max(...byDistrict.map((d) => d.count)) : 0;
  return (
    <PanelCard icon="map" title="District / Severity Analysis" subtitle="Event frequency by district (filtered)">
      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
        {byDistrict.map((d) => {
          const pct = max ? Math.round((d.count / max) * 100) : 0;
          return (
            <div key={d.district} className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10.5px]">
                <span className="font-semibold text-app-text-primary">{d.district}</span>
                <span className="font-mono text-app-text-secondary">{d.count} event{d.count > 1 ? 's' : ''}</span>
              </div>
              <div className="h-1.5 bg-app-surface-elevated border border-app-border rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {!byDistrict.length && (
          <p className="text-[12px] text-app-text-muted text-center py-6">No district data for the current filters.</p>
        )}
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// CURRENT vs HISTORICAL CONTEXT
// ---------------------------------------------------------------------------
function ComparisonCard({ label, current, historical, unit }) {
  return (
    <div className="bg-app-surface-elevated border border-app-border rounded-lg p-3 flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">{label}</span>
      <div className="flex items-end justify-between mt-1">
        <div className="flex flex-col">
          <span className="text-[9.5px] text-app-text-muted">Current</span>
          <span className="text-[18px] font-bold font-mono text-indigo-300">
            {current != null ? `${current}${unit}` : '—'}
          </span>
        </div>
        <span className="text-[13px] text-app-text-muted mb-1 font-bold">vs</span>
        <div className="flex flex-col items-end">
          <span className="text-[9.5px] text-app-text-muted">Historic</span>
          <span className="text-[18px] font-bold font-mono text-app-text-primary">
            {historical != null ? `${historical}${unit}` : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function CurrentVsHistorical({ event }) {
  // Deterministic CURRENT snapshot sourced from the canonical live-risk
  // picture used by Analytics/Alerts (see analyticsService.STATIONS).
  const maxCurrentProb = STATIONS.length
    ? Math.max(...STATIONS.map((s) => s.prob))
    : 0;
  const maxCurrentRain = STATIONS.length
    ? Math.max(...STATIONS.map((s) => s.rainfallMm))
    : 0;

  return (
    <PanelCard
      icon="compare_arrows"
      title="Current vs Historical Context"
      subtitle="Informational comparison — datasets are not directly comparable"
      badge={<span className="text-[11px] font-bold text-app-text-muted">{formatDate(event.eventDate)}</span>}
    >
      <p className="text-[10.5px] text-app-text-muted leading-snug mb-2">
        Current figures reflect the canonical real-time risk/conditions used across Monitoring, Risk Map, Analytics and
        Alerts. Historical figures are the documented peak of this event. The comparison is indicative, not a validated
        scientific equivalence.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ComparisonCard
          label="Rainfall"
          current={maxCurrentRain}
          historical={event.peakRainfallMm}
          unit=" mm"
        />
        <ComparisonCard
          label="Risk Probability"
          current={Math.round(maxCurrentProb * 100)}
          historical={null}
          unit="%"
        />
        <div className="bg-app-surface-elevated border border-app-border rounded-lg p-2.5 text-center flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted">Peak Water Level</span>
          <span className="mt-1 text-[16px] font-bold font-mono text-app-text-primary">
            {event.peakWaterLevelM != null ? `${event.peakWaterLevelM} m` : '—'}
          </span>
          <span className="text-[9px] text-app-text-muted mt-0.5">documented event peak</span>
        </div>
      </div>
    </PanelCard>
  );
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------
export default function HistoricalEventsPage() {
  const [events, setEvents] = useState(HISTORICAL_EVENTS);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(HISTORICAL_EVENTS[0].id);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const live = await loadHistoricalEvents();
      if (!mounted) return;
      if (Array.isArray(live) && live.length > 0) {
        setEvents(live);
        const top = [...live].sort(
          (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || b.year - a.year
        )[0];
        if (top) setSelectedId(top.id);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (districtFilter !== 'ALL' && !e.districts.includes(districtFilter)) return false;
        if (severityFilter !== 'ALL' && e.severity !== severityFilter) return false;
        if (typeFilter !== 'ALL' && e.eventType !== typeFilter) return false;
        if (yearFilter !== 'ALL') {
          const year = parseInt(yearFilter, 10);
          const eYear = parseInt(String(e.eventDate).slice(0, 4), 10);
          if (eYear !== year) return false;
        }
        if (q) {
          const haystack = [
            e.eventId,
            e.eventName,
            e.district,
            e.location,
            e.riverBasin,
            e.eventType,
            e.triggeringHazard,
            e.sourceName,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));
  }, [events, search, districtFilter, severityFilter, typeFilter, yearFilter]);

  const kpis = useMemo(() => computeHistoricalKpis(filteredEvents), [filteredEvents]);
  const byYear = useMemo(() => eventCountByYear(filteredEvents), [filteredEvents]);
  const bySeverity = useMemo(() => severityDistribution(filteredEvents), [filteredEvents]);
  const byDistrict = useMemo(() => eventCountByDistrict(filteredEvents), [filteredEvents]);
  const timeline = useMemo(() => buildEventTimeline(filteredEvents), [filteredEvents]);

  const selectedEvent = useMemo(() => {
    const found = filteredEvents.find((e) => e.id === selectedId);
    if (found) return found;
    return filteredEvents.length ? filteredEvents[0] : null;
  }, [filteredEvents, selectedId]);

  const handleReset = () => {
    setSearch('');
    setDistrictFilter('ALL');
    setSeverityFilter('ALL');
    setTypeFilter('ALL');
    setYearFilter('ALL');
  };

  const selectClass =
    'bg-app-surface-elevated border border-app-border rounded-lg px-2.5 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 cursor-pointer text-[11.5px] font-medium';

  return (
    <div className="flex flex-col gap-6 w-full font-sans">
      {/* 1. Page Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[19px] font-extrabold text-app-text-primary tracking-tight">
            HISTORICAL FLOOD EVENTS
          </h1>
          <p className="text-[12px] font-medium text-app-text-secondary mt-1">
            Documented flood-event records, trends and comparative intelligence (1970–2024)
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-app-surface border border-app-border p-3.5 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3 select-none">
          <div className="flex flex-wrap items-center gap-2.5 text-[12px]">
            <div className="relative">
              <span className="material-symbols-outlined text-[15px] text-app-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search event / location / source..."
                className="bg-app-surface-elevated border border-app-border rounded-lg pl-9 pr-3 py-1.5 text-app-text-primary outline-none focus:border-indigo-500/50 placeholder:text-app-text-muted text-[11.5px] font-medium w-64"
              />
            </div>

            <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={selectClass}>
              <option value="ALL">District: All</option>
              {EVENT_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className={selectClass}>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'Severity: All' : `Severity: ${s}`}</option>
              ))}
            </select>

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={selectClass}>
              <option value="ALL">Type: All</option>
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClass}>
              <option value="ALL">Year: All</option>
              {[...EVENT_YEARS].reverse().map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-lg bg-app-surface-elevated hover:bg-app-surface-hover text-app-text-muted hover:text-app-text-primary border border-app-border transition-colors text-[11.5px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">restart_alt</span>
            Reset Filters
          </button>
        </div>
      </div>

      {/* 2. Summary KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <KpiCard label="Total Events" value={kpis.totalEvents} subtext="Documented 1970–2024" accent="sky" />
        <KpiCard label="Catastrophic" value={kpis.criticalExtreme} subtext="Extreme severity events" accent="red" />
        <KpiCard label="Most Affected" value={kpis.mostAffectedDistrict} subtext={`${kpis.mostAffectedCount} documented events`} accent="orange" />
        <KpiCard
          label="Highest Rainfall"
          value={kpis.maxRainfallValue != null ? `${kpis.maxRainfallValue} mm` : '—'}
          subtext={kpis.maxRainfallEvent ? kpis.maxRainfallEvent.eventId : ''}
          accent="sky"
        />
        <KpiCard
          label="Peak Water Level"
          value={kpis.maxWaterLevelValue != null ? `${kpis.maxWaterLevelValue} m` : 'n/a'}
          subtext={kpis.maxWaterLevelEvent ? kpis.maxWaterLevelEvent.eventId : 'descriptive records only'}
          accent="orange"
        />
      </div>

      {/* 3. Event List + Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3">
          <EventList events={filteredEvents} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <div className="xl:col-span-2">
          {selectedEvent ? (
            <EventDetail event={selectedEvent} />
          ) : (
            <PanelCard title="Event Detail" subtitle="No event selected">
              <p className="text-[12px] text-app-text-muted py-6 text-center">
                No historical events match the current filters. Adjust or reset the filters above.
              </p>
            </PanelCard>
          )}
        </div>
      </div>

      {/* 4. Charts */}
      <EventCharts byYear={byYear} bySeverity={bySeverity} />

      {/* 5. District Analysis + Current vs Historical */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DistrictAnalysis byDistrict={byDistrict} />
        {selectedEvent && <CurrentVsHistorical event={selectedEvent} />}
      </div>
    </div>
  );
}
