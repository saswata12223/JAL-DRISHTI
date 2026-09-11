import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import PanelCard from './PanelCard';

function rainColor(mm) {
  if (mm >= 60) return '#DC2626';
  if (mm >= 35) return '#F97316';
  if (mm >= 20) return '#EAB308';
  return '#16A34A';
}

export default function RainfallTrendPanel({ data }) {
  const { isDark } = useTheme();
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#151922' : '#FFFFFF';
  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  const current = data.length ? data[data.length - 1].rain : 0;

  return (
    <PanelCard
      icon="water_drop"
      title="Rainfall Trend"
      subtitle="Hourly rainfall intensity (GPM IMERG)"
      badge={<span className="text-[12px] font-bold font-mono text-sky-400 border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 rounded-md">{current} mm/h</span>}
    >
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={isDark ? '#1E2532' : '#E2E8F0'} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke={axisTextColor} fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke={axisTextColor} fontSize={11} tickLine={false} tickCount={5} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '8px',
                fontSize: '11px',
                color: tooltipText,
              }}
              formatter={(val) => [`${val} mm/h`, 'Rainfall Intensity']}
              cursor={{ fill: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(13,148,136,0.06)' }}
            />
            <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.time} fill={rainColor(entry.rain)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-app-border mt-1">
        <div className="flex items-center gap-3 text-[10px] font-semibold text-app-text-muted">
          {[
            ['#16A34A', 'Low <20'],
            ['#EAB308', 'Moderate 20–35'],
            ['#F97316', 'High 35–60'],
            ['#DC2626', 'Extreme >60'],
          ].map(([color, label]) => (
            <span key={label} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </PanelCard>
  );
}