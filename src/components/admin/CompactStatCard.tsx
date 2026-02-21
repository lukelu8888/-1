import React from 'react';
import { Card } from '../ui/card';
import { LucideIcon } from 'lucide-react';

/**
 * 🎨 紧凑型统计卡片 - 台湾大厂风格
 * 采用简洁的单行布局，信息密度高，视觉统一
 */

interface CompactStatCardProps {
  // 文本内容
  label: string;
  value: string | number;
  description?: string;
  
  // 图标（JSX）
  icon?: React.ReactNode;
  
  // 背景颜色
  color?: string;
  
  // 点击事件
  onClick?: () => void;
}

export const CompactStatCard: React.FC<CompactStatCardProps> = ({
  label,
  value,
  description,
  icon,
  color = 'bg-gradient-to-br from-gray-500 to-gray-600',
  onClick
}) => {
  return (
    <Card 
      className={`
        p-4 ${color} text-white border-0 shadow-md
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/80 mb-1">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-white/80 mt-1">{description}</p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};