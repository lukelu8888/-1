import React from 'react';

import type {
  CustomerInquiryData,
  CustomerInquiryRequirementField,
} from '../../documents/templates/CustomerInquiryDocument';

interface InquiryRequirementsBindingPanelProps {
  fields: CustomerInquiryRequirementField[];
  requirements: CustomerInquiryData['requirements'];
  activeField: CustomerInquiryRequirementField['key'] | null;
  onActiveFieldChange: React.Dispatch<React.SetStateAction<CustomerInquiryRequirementField['key'] | null>>;
}

export function InquiryRequirementsBindingPanel({
  fields,
  requirements,
  activeField,
  onActiveFieldChange,
}: InquiryRequirementsBindingPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-900">询价条款 / TRADING REQUIREMENTS</p>
        <p className="mt-1 text-[11px] leading-5 text-gray-500">
          这里定义模板中心 ING 预览中的条款绑定。模板中心只承接结构和字段路径，客户实际条款内容来自 `Create New Inquiry` 弹窗。
        </p>
      </div>
      <div className="overflow-hidden rounded-md border border-gray-200">
        {fields.map((field) => {
          const value = field.key === 'certifications'
            ? (requirements?.certifications || []).join(', ')
            : requirements?.[field.key] || '';

          return (
            <button
              key={field.key}
              type="button"
              onMouseEnter={() => onActiveFieldChange(field.key)}
              onMouseLeave={() => onActiveFieldChange((current) => (current === field.key ? null : current))}
              onFocus={() => onActiveFieldChange(field.key)}
              onBlur={() => onActiveFieldChange((current) => (current === field.key ? null : current))}
              className={`grid w-full grid-cols-[160px_180px_1fr] border-t border-gray-200 text-left first:border-t-0 ${
                activeField === field.key ? 'bg-amber-50' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="border-r border-gray-200 bg-gray-50 px-3 py-3">
                <div className="text-[11px] font-semibold text-gray-900">{field.previewLabel}</div>
                <div className="mt-1 text-[10px] leading-4 text-gray-500">
                  客户侧字段名: {field.sourceLabel}
                </div>
              </div>
              <div className="border-r border-gray-200 px-3 py-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  Binding Path
                </div>
                <div className="mt-1 font-mono text-[11px] text-gray-700">
                  requirements.{field.key}
                </div>
              </div>
              <div className="px-3 py-3">
                <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                  当前样例值
                </div>
                <div className="mt-1 whitespace-pre-wrap text-[11px] leading-5 text-gray-700">
                  {value || '未提供'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
