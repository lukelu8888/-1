import React from 'react';

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface XjTermsPresetLike {
  id: string;
  name: string;
  description: string;
}

interface XjTermsLike {
  currency?: string;
  paymentTerms?: string;
  deliveryTerms?: string;
  deliveryAddress?: string;
  deliveryRequirement?: string;
  qualityStandard?: string;
  inspectionMethod?: string;
  packaging?: string;
  shippingMarks?: string;
  inspectionRequirement?: string;
  technicalDocuments?: string;
  ipRights?: string;
  confidentiality?: string;
  sampleRequirement?: string;
  moq?: string;
  remarks?: string;
}

interface XjTermsEditorPanelProps {
  presets: XjTermsPresetLike[];
  terms: XjTermsLike;
  onApplyPreset: (presetId: string) => void;
  onClear: () => void;
  onRestoreDefault: () => void;
  onPatchTerms: (patch: Partial<XjTermsLike>) => void;
}

const TERM_FIELDS: Array<{ key: keyof XjTermsLike; label: string; rows?: number; input?: boolean }> = [
  { key: 'currency', label: '报价币种', input: true },
  { key: 'paymentTerms', label: '付款方式', rows: 2 },
  { key: 'deliveryTerms', label: '交货条款', rows: 2 },
  { key: 'deliveryAddress', label: '交货地址', rows: 2 },
  { key: 'deliveryRequirement', label: '交货时间要求', rows: 2 },
  { key: 'qualityStandard', label: '产品质量标准', rows: 3 },
  { key: 'inspectionMethod', label: '验收标准', rows: 3 },
  { key: 'packaging', label: '包装要求', rows: 3 },
  { key: 'shippingMarks', label: '唛头要求', rows: 2 },
  { key: 'inspectionRequirement', label: '验货要求', rows: 3 },
  { key: 'technicalDocuments', label: '技术文件', rows: 3 },
  { key: 'ipRights', label: '知识产权', rows: 2 },
  { key: 'confidentiality', label: '保密条款', rows: 2 },
  { key: 'sampleRequirement', label: '样品要求', rows: 2 },
  { key: 'moq', label: 'MOQ 要求', rows: 2 },
  { key: 'remarks', label: '其他说明', rows: 3 },
];

export function XjTermsEditorPanel({
  presets,
  terms,
  onApplyPreset,
  onClear,
  onRestoreDefault,
  onPatchTerms,
}: XjTermsEditorPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-900">询价条款</p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={onClear}>
            清空条款
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={onRestoreDefault}>
            恢复默认模板
          </Button>
        </div>
      </div>
      <div className="mb-3 space-y-2">
        <p className="text-[11px] font-medium text-gray-500">采购常用条款模板</p>
        <div className="grid grid-cols-1 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-left transition hover:border-violet-300 hover:bg-violet-50"
            >
              <div className="text-xs font-semibold text-gray-900">{preset.name}</div>
              <div className="mt-1 text-[11px] leading-5 text-gray-500">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {TERM_FIELDS.map((field) => (
          <div key={field.key}>
            <Label className="text-[11px] text-gray-500">{field.label}</Label>
            {field.input ? (
              <Input
                value={terms[field.key] || ''}
                onChange={(e) => onPatchTerms({ [field.key]: e.target.value })}
                className="mt-1 h-7 text-xs"
              />
            ) : (
              <Textarea
                value={terms[field.key] || ''}
                onChange={(e) => onPatchTerms({ [field.key]: e.target.value })}
                className={`mt-1 text-xs ${field.rows === 2 ? 'min-h-[52px]' : field.rows === 3 ? 'min-h-[56px]' : 'min-h-[64px]'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
