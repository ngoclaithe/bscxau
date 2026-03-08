import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatNumber } from '@/lib/utils';

interface PriceChartProps {
  data: { time: number; price: number }[];
  currentPrice: number;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, currentPrice }) => {
  const chartData = data.map(d => ({
    time: new Date(d.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    price: d.price,
  }));

  return (
    <div className="h-full">
      <div className="mb-4">
        <div className="text-3xl font-bold">{formatNumber(currentPrice)}</div>
        <div className="text-sm text-muted-foreground">Giá hiện tại</div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <XAxis
            dataKey="time"
            stroke="#888"
            fontSize={12}
          />
          <YAxis
            stroke="#888"
            fontSize={12}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${formatNumber(value, 0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number) => [`$${formatNumber(value)}`, 'Giá']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
