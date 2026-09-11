import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import PanelCard from './PanelCard';

export default function RiskTrendPanel({ data }) {
  const { isDark } = useTheme();
  const gridColor = isDark ? '#1E2532' : '#E2E8F0';
  const axisTextColor = isDark ? '#64748B' : '#94A3B8';
  const tooltipBg = isDark ? '#151922' : '#FFFFFF';
  const tooltipBorder = isDark ? '#262E3D' : '#E2E8F0';
  const tooltipText = isDark ? '#F3F4F6' : '#111827';

  const current = data.length ? data[data.length - 1].prob : 0;
  const first = data.length ? data[0].prob : 0;
  const delta = current - first;
  const trendColor = delta > 3 ? '#DC2626' : delta < -3 ? '#10B981' : '#EAB308';

  return (
    <PanelCard
      icon="trending_up"
      title="Flood Risk Probability Trend"
      subtitle="Predicted flash flood probability over the selected window"
      badge={
        <span className="text-[12px] font-bold font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md">
          P = {current}%
        </span>
      }
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="analyticRiskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" stroke={axisTextColor} fontSize={11} tickLine={false} />
            <YAxis
              domain={[0, 100]}
              stroke={axisTextColor}
              fontSize={11}
              tickLine={false}
              tickCount={6}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '8px',
                fontSize: '11px',
                color: tooltipText,
              }}
              formatter={(val) => [`${val}%`, 'Risk Probability']}
            />
            <ReferenceLine
              y={40}
              stroke="#F97316"
              strokeDasharray="4 4"
              label={{ value: 'HIGH RISK (40%)', fill: '#F97316', fontSize: 9, position: 'insideBottomRight' }}
            />
            <Area
              type="monotone"
              dataKey="prob"
              stroke="#818CF8"
              strokeWidth={2.4}
              fillOpacity={1}
              fill="url(#analyticRiskGrad)"
              dot={{ r: 2.5, fill: '#818CF8', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#DC2626' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-app-border mt-1">
        <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-app-text-muted">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: trendColor }}></span>
          <span>
            {delta > 3 ? 'INCREASING' : delta < -3 ? 'DECREASING' : 'STABLE'} ({delta > 0 ? '+' : ''}
            {delta} pts over window)
          </span>
        </div>
        <span className="text-[10.5px] text-app-text-muted font-medium">
          Threshold: <span className="text-orange-500 font-semibold">High risk ≥ 40%</span>
        </span>
      </div>
    </PanelCard>
  );
}