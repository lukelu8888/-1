import React from 'react';
import { Card } from '../../../ui/card';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'slate';
  onClick: () => void;
  badge?: {
    label: string;
    color: 'red' | 'orange' | 'blue' | 'green';
  };
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    hover: 'hover:bg-blue-100'
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    hover: 'hover:bg-green-100'
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'text-orange-600',
    hover: 'hover:bg-orange-100'
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    hover: 'hover:bg-purple-100'
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'text-slate-600',
    hover: 'hover:bg-slate-100'
  }
};

const badgeColorMap = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700'
};

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  color = 'blue',
  onClick,
  badge
}: QuickActionCardProps) {
  const colors = colorMap[color];

  return (
    <Card 
      className="p-5 cursor-pointer hover:shadow-md transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} ${colors.hover} flex items-center justify-center flex-shrink-0 transition-colors`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-slate-900 truncate">{title}</h4>
            {badge && (
              <span className={`px-2 py-0.5 rounded-full flex-shrink-0 ${badgeColorMap[badge.color]}`} style={{ fontSize: '11px' }}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-slate-600 line-clamp-2" style={{ fontSize: '13px' }}>
            {description}
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </Card>
  );
}
