import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface QuotationLayoutPanelProps {
  layout: {
    qtLogoWidthPx?: number;
    qtLogoHeightPx?: number;
    qtInfoTableWidthPx?: number;
    qtTableCellPaddingY?: number;
    qtCompanyTableWidthPercent?: number;
    qtProductsTableWidthPercent?: number;
    qtTermsTableWidthPercent?: number;
    qtRemarksTableWidthPercent?: number;
    qtPreparedByTableWidthPercent?: number;
  };
  onChange: (key: string, value: number) => void;
}

export function QuotationLayoutPanel({
  layout,
  onChange,
}: QuotationLayoutPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="mb-3 text-xs font-semibold text-gray-900">QT 专属版式</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] text-gray-500">LOGO 宽度(px)</Label>
          <Input type="number" value={layout.qtLogoWidthPx ?? 80} onChange={(e) => onChange('qtLogoWidthPx', Number(e.target.value) || 80)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">LOGO 高度(px)</Label>
          <Input type="number" value={layout.qtLogoHeightPx ?? 70} onChange={(e) => onChange('qtLogoHeightPx', Number(e.target.value) || 70)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">右上信息框宽度(px)</Label>
          <Input type="number" value={layout.qtInfoTableWidthPx ?? 240} onChange={(e) => onChange('qtInfoTableWidthPx', Number(e.target.value) || 240)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">表格行距/内边距(px)</Label>
          <Input type="number" value={layout.qtTableCellPaddingY ?? 6} onChange={(e) => onChange('qtTableCellPaddingY', Number(e.target.value) || 6)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">FROM/TO 表宽(%)</Label>
          <Input type="number" value={layout.qtCompanyTableWidthPercent ?? 100} onChange={(e) => onChange('qtCompanyTableWidthPercent', Number(e.target.value) || 100)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">产品表宽(%)</Label>
          <Input type="number" value={layout.qtProductsTableWidthPercent ?? 100} onChange={(e) => onChange('qtProductsTableWidthPercent', Number(e.target.value) || 100)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">条款表宽(%)</Label>
          <Input type="number" value={layout.qtTermsTableWidthPercent ?? 100} onChange={(e) => onChange('qtTermsTableWidthPercent', Number(e.target.value) || 100)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">备注表宽(%)</Label>
          <Input type="number" value={layout.qtRemarksTableWidthPercent ?? 100} onChange={(e) => onChange('qtRemarksTableWidthPercent', Number(e.target.value) || 100)} className="mt-1 h-7 text-xs" />
        </div>
        <div>
          <Label className="text-[11px] text-gray-500">Prepared By 表宽(%)</Label>
          <Input type="number" value={layout.qtPreparedByTableWidthPercent ?? 100} onChange={(e) => onChange('qtPreparedByTableWidthPercent', Number(e.target.value) || 100)} className="mt-1 h-7 text-xs" />
        </div>
      </div>
    </div>
  );
}
