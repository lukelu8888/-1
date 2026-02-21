import React from 'react';
import { Card } from '../../../ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RegionData {
  region: string;
  regionName: string;
  sales: number;
  orders: number;
  profit: number;
}

interface RegionComparisonChartProps {
  data: RegionData[];
  title?: string;
}

export function RegionComparisonChart({ data, title = '区域业绩对比' }: RegionComparisonChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-slate-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="regionName" 
            tick={{ fontSize: 12, fill: '#64748b' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => `$${value.toLocaleString()}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Bar 
            dataKey="sales" 
            fill="#3b82f6" 
            name="销售额"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="profit" 
            fill="#10b981" 
            name="利润"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
