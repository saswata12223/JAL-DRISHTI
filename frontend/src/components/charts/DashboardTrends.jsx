import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

const RISK_TREND_DATA = [
  { time: '06:00', prob: 0.15 },
  { time: '07:00', prob: 0.22 },
  { time: '08:00', prob: 0.38 },
  { time: '09:00', prob: 0.65 },
  { time: '10:00', prob: 0.82 },
  { time: '11:00', prob: 0.94 },
];

const RAINFALL_TREND_DATA = [
  { time: '06:00', mm: 12, fill: '#A5F1F7' },
  { time: '07:00', mm: 24, fill: '#A5F1F7' },
  { time: '08:00', mm: 18, fill: '#A5F1F7' },
  { time: '09:00', mm: 45, fill: '#D97706' },
  { time: '10:00', mm: 68, fill: '#F97316' },
  { time: '11:00', mm: 85, fill: '#DC2626' },
];

export default function DashboardTrends() {
  const axisTextColor = '#6B858A';
  const tooltipBg = 'rgba(255, 255, 255, 0.96)';
  const tooltipBorder = 'rgba(165, 241, 247, 0.6)';
  const tooltipText = '#102A2E';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none font-sans">
      {/* 1. Risk Probability Trend */}
      <div className="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-[#102A2E] uppercase font-sans tracking-wider">
              Risk Trend
            </h3>
          </div>
          <span className="text-[11px] font-bold font-mono text-[#DC2626]">
            P = 94%
          </span>
        </div>

        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={RISK_TREND_DATA} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A5F1F7" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#A5F1F7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(16, 42, 46, 0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke={axisTextColor} fontSize={9.5} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 1]} stroke={axisTextColor} fontSize={9.5} tickLine={false} axisLine={false} tickCount={4} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(16,42,46,0.1)',
                  fontSize: '11px',
                  color: tooltipText,
                }}
                formatter={(val) => [`${Math.round(val * 100)}%`, 'Probability']}
              />
              <ReferenceLine
                y={0.40}
                stroke="#F97316"
                strokeDasharray="2 2"
                strokeOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="prob"
                stroke="#24464B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#tealGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Rainfall Intensity (mm/h) */}
      <div className="bg-white rounded-2xl p-6 flex flex-col border border-slate-200 shadow-xs hover:shadow-sm transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-[#102A2E] uppercase font-sans tracking-wider">
              Rainfall Intensity
            </h3>
          </div>
          <span className="text-[11px] font-bold font-mono text-[#DC2626]">
            85 mm/h
          </span>
        </div>

        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={RAINFALL_TREND_DATA} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
              <CartesianGrid stroke="rgba(16, 42, 46, 0.06)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" stroke={axisTextColor} fontSize={9.5} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke={axisTextColor} fontSize={9.5} tickLine={false} axisLine={false} tickCount={4} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(16,42,46,0.1)',
                  fontSize: '11px',
                  color: tooltipText,
                }}
                formatter={(val) => [`${val} mm/h`, 'Rainfall Intensity']}
              />
              <Bar dataKey="mm" radius={[4, 4, 0, 0]}>
                {RAINFALL_TREND_DATA.map((entry, index) => (
                  <cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}



