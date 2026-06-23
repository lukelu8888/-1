/**
 * WorkflowPipelineBanner
 * 主业务链路可视化横幅，用于每个关键单据页面顶部。
 * 显示当前所在步骤，并可点击链路节点进行导航。
 */
import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface WorkflowStep {
  key: string;
  /** 显示标签 */
  label: string;
  /** 单据编号（可选，显示在节点下方） */
  docNumber?: string;
  /** 点击该节点时的回调（可选） */
  onClick?: () => void;
  /** 是否已完成（显示绿色） */
  done?: boolean;
  /** 是否被跳过 / 无效（显示灰色且不可点击） */
  skipped?: boolean;
}

interface WorkflowPipelineBannerProps {
  steps: WorkflowStep[];
  currentKey: string;
  /** 可选说明文字（显示在右侧） */
  hint?: string;
  className?: string;
}

const STEP_BASE =
  'flex flex-col items-center justify-center text-center min-w-0 select-none';

const ACTIVE_DOT =
  'w-6 h-6 rounded-full bg-[#F96302] text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-[#F96302]/25';
const DONE_DOT =
  'w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center';
const SKIPPED_DOT =
  'w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-bold flex items-center justify-center';
const PENDING_DOT =
  'w-6 h-6 rounded-full border-2 border-slate-300 bg-white text-slate-400 text-[10px] font-bold flex items-center justify-center';

export function WorkflowPipelineBanner({
  steps,
  currentKey,
  hint,
  className = '',
}: WorkflowPipelineBannerProps) {
  const currentIdx = steps.findIndex((s) => s.key === currentKey);

  return (
    <div
      className={`flex items-start gap-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm ${className}`}
      role="navigation"
      aria-label="业务流程进度"
    >
      {steps.map((step, idx) => {
        const isActive = step.key === currentKey;
        const isDone = !isActive && (step.done || idx < currentIdx);
        const isSkipped = step.skipped;
        const isPending = !isActive && !isDone && !isSkipped;
        const isClickable = !!step.onClick && !isSkipped;

        const dotClass = isActive
          ? ACTIVE_DOT
          : isDone
          ? DONE_DOT
          : isSkipped
          ? SKIPPED_DOT
          : PENDING_DOT;

        const labelClass = isActive
          ? 'text-[#F96302] font-semibold'
          : isDone
          ? 'text-emerald-600 font-medium'
          : 'text-slate-400';

        const nodeEl = (
          <div className={STEP_BASE}>
            <div className={dotClass}>{idx + 1}</div>
            <div
              className={`mt-1 text-[11px] leading-tight whitespace-nowrap ${labelClass}`}
            >
              {step.label}
            </div>
            {step.docNumber && (
              <div className="mt-0.5 text-[10px] text-slate-400 leading-tight max-w-[80px] truncate">
                {step.docNumber}
              </div>
            )}
          </div>
        );

        return (
          <React.Fragment key={step.key}>
            {isClickable ? (
              <button
                type="button"
                onClick={step.onClick}
                className="group outline-none"
                title={`前往 ${step.label}`}
              >
                <div className={`${STEP_BASE} hover:opacity-75 transition-opacity cursor-pointer`}>
                  <div className={dotClass}>{idx + 1}</div>
                  <div
                    className={`mt-1 text-[11px] leading-tight whitespace-nowrap underline-offset-2 group-hover:underline ${labelClass}`}
                  >
                    {step.label}
                  </div>
                  {step.docNumber && (
                    <div className="mt-0.5 text-[10px] text-slate-400 leading-tight max-w-[80px] truncate">
                      {step.docNumber}
                    </div>
                  )}
                </div>
              </button>
            ) : (
              nodeEl
            )}

            {idx < steps.length - 1 && (
              <ChevronRight
                className={`mx-1.5 mt-1.5 h-3 w-3 flex-shrink-0 ${
                  idx < currentIdx ? 'text-emerald-400' : 'text-slate-300'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}

      {hint && (
        <div className="ml-auto pl-4 flex items-center text-[11px] text-slate-500 whitespace-nowrap">
          {hint}
        </div>
      )}
    </div>
  );
}

/** 主链路默认步骤定义（key 与各模块匹配） */
export const MAIN_WORKFLOW_STEPS: WorkflowStep[] = [
  { key: 'ing', label: '客户询价' },
  { key: 'qr', label: '成本询报' },
  { key: 'qt', label: '销售报价' },
  { key: 'sc', label: '销售合同' },
  { key: 'pr', label: '采购请求' },
  { key: 'cg', label: '采购订单' },
  { key: 'confirm', label: '供应商确认' },
  { key: 'track', label: '客户跟踪' },
];
