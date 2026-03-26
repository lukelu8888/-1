import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Badge } from '../../ui/badge';

interface VersionHistoryPanelProps {
  collapsed: boolean;
  count: number;
  onToggle: () => void;
  children: React.ReactNode;
}

export function VersionHistoryPanel({
  collapsed,
  count,
  onToggle,
  children,
}: VersionHistoryPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex min-w-0 items-center gap-1.5 text-left"
          onClick={onToggle}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
          )}
          <p className="text-xs font-semibold text-gray-900">版本记录</p>
        </button>
        <Badge variant="outline" className="text-[10px]">{count} 条</Badge>
      </div>
      {!collapsed ? (
        children
      ) : (
        <p className="text-[11px] text-gray-500">已折叠版本记录，点击标题可展开查看与恢复历史版本。</p>
      )}
    </div>
  );
}
