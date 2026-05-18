import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Format Y-axis ticks in USD shorthand
const formatAxisUSD = (n) => {
  if (n === 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000)     return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + n.toFixed(0);
};

// Format full USD for tooltip
const formatUSD = (n) =>
  '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(18, 22, 34, 0.96)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        minWidth: '130px',
      }}
    >
      <p style={{ color: '#6b7494', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4" style={{ marginBottom: i === 0 ? '2px' : 0 }}>
          <span style={{ color: '#6b7494', fontSize: '11px' }}>
            {i === 0 ? 'Thu nhập' : 'Chi tiêu'}
          </span>
          <span
            style={{
              color: i === 0 ? '#d4aa64' : '#a0a8c0',
              fontSize: '13px',
              fontFamily: 'Sora, sans-serif',
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            {formatUSD(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CashFlowChart = ({ monthlyData }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2
            style={{ fontFamily: 'Sora, sans-serif', color: '#eef0f8', letterSpacing: '-0.02em' }}
            className="text-base font-semibold"
          >
            Dòng tiền
          </h2>
          <p className="text-xs text-sand-dim mt-0.5">6 tháng gần nhất</p>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#d4aa64' }} />
            <span className="text-xs text-sand-dim">Thu nhập</span>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(212,170,100,0.2)' }} />
            <span className="text-xs text-sand-dim">Chi tiêu</span>
          </div>
        </div>
      </div>

      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} barGap={3} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid
              strokeDasharray="0"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: '#4a5068', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#4a5068', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisUSD}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 4 }} />
            <Bar dataKey="income" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {monthlyData?.map((_, i) => (
                <Cell key={i} fill="#d4aa64" />
              ))}
            </Bar>
            <Bar dataKey="actual" radius={[3, 3, 0, 0]} maxBarSize={18}>
              {monthlyData?.map((_, i) => (
                <Cell key={i} fill="rgba(212,170,100,0.18)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CashFlowChart;