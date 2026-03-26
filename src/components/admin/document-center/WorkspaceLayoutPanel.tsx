import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface WorkspaceLayoutPanelProps {
  layout: {
    canvasWidthMm: number;
    canvasMinHeightMm: number;
    contentPaddingTopMm: number;
    contentPaddingBottomMm: number;
    fontSizePt: number;
    lineHeight: number;
  };
  onChange: (key: string, value: number) => void;
}

export function WorkspaceLayoutPanel({
  layout,
  onChange,
}: WorkspaceLayoutPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="mb-3 text-xs font-semibold text-gray-900">版式参数</p>
      <div className="grid grid-cols-2 gap-2">
        <div><Label className="text-[11px] text-gray-500">画布宽度(mm)</Label><Input type="number" value={layout.canvasWidthMm} onChange={(e) => onChange('canvasWidthMm', Number(e.target.value) || 210)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">最小高度(mm)</Label><Input type="number" value={layout.canvasMinHeightMm} onChange={(e) => onChange('canvasMinHeightMm', Number(e.target.value) || 297)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">上边距(mm)</Label><Input type="number" value={layout.contentPaddingTopMm} onChange={(e) => onChange('contentPaddingTopMm', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">下边距(mm)</Label><Input type="number" value={layout.contentPaddingBottomMm} onChange={(e) => onChange('contentPaddingBottomMm', Number(e.target.value) || 12)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">字体(pt)</Label><Input type="number" value={layout.fontSizePt} onChange={(e) => onChange('fontSizePt', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
        <div><Label className="text-[11px] text-gray-500">行高</Label><Input type="number" step="0.1" value={layout.lineHeight} onChange={(e) => onChange('lineHeight', Number(e.target.value) || 1.5)} className="mt-1 h-7 text-xs" /></div>
      </div>
    </div>
  );
}
