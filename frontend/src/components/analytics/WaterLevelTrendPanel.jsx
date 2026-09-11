import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import PanelCard from './PanelCard';

export default function WaterLevelTrendPanel({ data, station }) {
  const { isDark } = useTheme();
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#151922' : '#FFFFFF';
  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  const current = data.length ? data[data.length - 1].level : 0;
  const warning = station?.warningLevel;
  const danger = station?.dangerLevel;
  const aboveDanger = danger != null && current >= danger;
  const inWarning = warning != null && danger != null && current >= warning && current < danger;

  const min = data.length ? Math.floor(Math.min(...data.map((d) => d.level)) - 1) : 0;
  const max = data.length ? Math.ceil(Math.max(...data.map((d) => d.level), danger || 0, warning || 0) + 1) : 0;

  return (
    <PanelCard
      icon="show_chart"
      title="Water Level Trend"
      subtitle={station ? `${station.name} • ${station.river} River (CWC gauge)` : 'CWC river gauge stage'}
      badge={
        <span
          className={`text-[12px] font-bold font-mono px-2 py-0.5 rounded-md border ${
            aboveDanger
              ? 'text-red-500 border-red-500/25 bg-red-500/10'
              : inWarning
              ? 'text-amber-500 border-amber-500/25 bg-amber-500/10'
              : 'text-emerald-500 border-emerald-500/25 bg-emerald-500/10'
          }`}
        >
          {current} m {aboveDanger ? '(Danger)' : inWarning ? '(Warning)' : ''}
        </span>
      }
    >
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid stroke={isDark ? '#1E2532' : '#E2E8F0'} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke={axisTextColor} fontSize={11} tickLine={false} />
            <YAxis domain={[min, max]} stroke={axisTextColor} fontSize={11} tickLine={false} tickCount={6} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '8px',
                fontSize: '11px',
                color: tooltipText,
              }}
              formatter={(val) => [`${val} m MSL`, 'Water Level']}
            />
            {warning != null && (
              <ReferenceLine
                y={warning}
                stroke="#EAB308"
                strokeDasharray="4 4"
                label={{ value: `Warning ${warning}m`, fill: '#EAB308', fontSize: 9, position: 'insideTopLeft' }}
              />
            )}
            {danger != null && (
              <ReferenceLine
                y={danger}
                stroke="#DC2626"
                strokeDasharray="4 4"
                label={{ value: `Danger ${danger}m`, fill: '#DC2626', fontSize: 9, position: 'insideTopLeft' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="level"
              stroke="#38BDF8"
              strokeWidth={2.4}
              dot={{ r: 3, fill: '#38BDF8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#DC2626' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-app-border mt-1 text-[10.5px] font-semibold">
        <div className="flex items-center gap-3 text-app-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning {warning ?? '—'} m
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Danger {danger ?? '—'} m
          </span>
        </div>
        <span className="text-app-text-muted font-medium">Unit: m MSL</span>
      </div>
    </PanelCard>
  );
}