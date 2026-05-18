import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const formatVND = (n) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000
    ? (n / 1_000).toFixed(0) + 'K'
    : n.toFixed(0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 rounded-lg text-center">
      <p className="font-label-sm text-label-sm text-on-surface-variant">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className={`font-label-md text-label-md font-bold ${i === 0 ? 'text-primary' : 'text-secondary/60'}`}>
          {p.value.toLocaleString('vi-VN')}đ
        </p>
      ))}
    </div>
  );
};

const CashFlowChart = ({ monthlyData }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-stack-lg">
        <h2 className="font-headline-md text-headline-md text-on-surface">Dòng tiền thực tế</h2>
        <select className="bg-surface-container border-none text-on-surface-variant font-label-sm text-label-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer">
          <option>6 tháng qua</option>
          <option>1 năm qua</option>
        </select>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#c2c6d6', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: '#c2c6d6', fontSize: 11, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatVND}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(173,198,255,0.05)' }} />
            <Bar dataKey="income" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {monthlyData?.map((entry, i) => (
                <Cell key={i} fill="rgba(173,198,255,0.25)" />
              ))}
            </Bar>
            <Bar dataKey="actual" radius={[4, 4, 0, 0]} maxBarSize={20}>
              {monthlyData?.map((entry, i) => (
                <Cell key={i} fill="#adc6ff" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-stack-md pt-stack-sm border-t border-glass-border flex justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Thu nhập</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/25"></div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">Chi tiêu</span>
        </div>
      </div>
    </div>
  );
};

export default CashFlowChart;