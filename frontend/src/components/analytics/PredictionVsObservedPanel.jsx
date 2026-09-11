import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import PanelCard from './PanelCard';

export default function PredictionVsObservedPanel({ data, status, meanDiff }) {
  const { isDark } = useTheme();
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#151922' : '#FFFFFF';
  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  const statusStyle =
    status === 'ALIGNED'
      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
      : status === 'ABOVE OBSERVED'
      ? 'bg-orange-500/10 border-orange-500/25 text-orange-500'
      : 'bg-sky-500/10 border-sky-500/25 text-sky-400';

  return (
    <PanelCard
      icon="fact_check"
      title="Prediction vs Observed"
      subtitle="Model probability trend against a gauge-based observed conditions index"
      badge={
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${statusStyle}`}>
          {status}
        </span>
      }
    >
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={isDark ? '#1E2532' : '#E2E8F0'} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke={axisTextColor} fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke={axisTextColor} fontSize={11} tickLine={false} tickCount={5} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '8px',
                fontSize: '11px',
                color: tooltipText,
              }}
              formatter={(val, name) => [`${val}%`, name === 'predicted' ? 'Predicted Risk' : 'Observed Index']}
            />
            <Legend
              wrapperStyle={{ fontSize: '10.5px', fontWeight: 600 }}
              formatter={(value) => (value === 'predicted' ? 'Predicted Risk' : 'Observed Conditions')}
            />
            <Line
              type="monotone"
              name="predicted"
              dataKey="predicted"
              stroke="#818CF8"
              strokeWidth={2.4}
              dot={{ r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              name="observed"
              dataKey="observed"
              stroke="#38BDF8"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-app-border mt-1 text-[10.5px] font-semibold text-app-text-muted">
        <span>Mean |Pred − Obs| deviation: <span className="font-mono text-app-text-primary">{meanDiff} pts</span></span>
        <span className="font-medium">Observed index = gauge stage + rainfall composite</span>
      </div>
    </PanelCard>
  );
}