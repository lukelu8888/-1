import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface TemplateTableColumn {
  key: string;
  label: string;
  widthPercent: number;
}

interface TemplateTableColumnsPanelProps {
  title: string;
  description?: string;
  columns: TemplateTableColumn[];
  onMove: (index: number, direction: 'up' | 'down') => void;
  onPatch: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function TemplateTableColumnsPanel({
  title,
  description,
  columns,
  onMove,
  onPatch,
}: TemplateTableColumnsPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-900">{title}</p>
        {description ? (
          <p className="mt-1 text-[11px] leading-5 text-gray-500">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        {columns.map((column, index) => (
          <div key={column.key} className="rounded border border-gray-100 bg-gray-50 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold text-gray-700">{column.key}</div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => onMove(index, 'up')}
                  disabled={index === 0}
                  title="上移"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 w-6 p-0"
                  onClick={() => onMove(index, 'down')}
                  disabled={index === columns.length - 1}
                  title="下移"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_88px] gap-2">
              <div>
                <Label className="text-[11px] text-gray-500">列标题</Label>
                <Input
                  value={column.label}
                  onChange={(e) => onPatch(index, { label: e.target.value })}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500">列宽(%)</Label>
                <Input
                  type="number"
                  min="4"
                  step="0.5"
                  value={column.widthPercent}
                  onChange={(e) => onPatch(index, { widthPercent: Number(e.target.value) || 4 })}
                  className="mt-1 h-7 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
