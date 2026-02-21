import React from 'react';
import { Card } from '../../../ui/card';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number; // 百分比变化
    direction: 'up' | 'down' | 'neutral';
    label?: string; // 例如："vs 上月"
  };
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'slate';
  onClick?: () => void;
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    trend: 'text-blue-600'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    trend: 'text-green-600'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    trend: 'text-orange-600'
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    trend: 'text-red-600'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    trend: 'text-purple-600'
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
    trend: 'text-slate-600'
  }
};

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color = 'blue',
  onClick
}: KPICardProps) {
  const colors = colorMap[color];
  
  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus;

  return (
    <Card 
      className={`p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-600 mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-slate-900">{value}</h3>
            {trend && (
              <div className={`flex items-center gap-1 ${
                trend.direction === 'up' ? 'text-green-600' : 
                trend.direction === 'down' ? 'text-red-600' : 
                'text-slate-600'
              }`}>
                <TrendIcon className="w-4 h-4" />
                <span style={{ fontSize: '12px' }}>
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-500 mt-1" style={{ fontSize: '12px' }}>
              {subtitle}
            </p>
          )}
          {trend?.label && (
            <p className="text-slate-400 mt-1" style={{ fontSize: '11px' }}>
              {trend.label}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </Card>
  );
}
