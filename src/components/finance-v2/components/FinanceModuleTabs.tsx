import React from 'react';
import {
  BarChart3,
  Banknote,
  ClipboardCheck,
  FileText,
  HandCoins,
  Landmark,
  ReceiptText,
  ShieldAlert,
} from 'lucide-react';
import type { FinanceManagementTabId } from '../types/financeV2';

type FinanceModuleGroup = '收入侧' | '支出侧' | '资金侧' | '管理侧';

export const FINANCE_MODULE_TAB_ITEMS: {
  id: FinanceManagementTabId;
  label: string;
  group: FinanceModuleGroup;
  aliases?: string[];
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  // 收入侧：应收账款 → 收款与核销 → 发票与税务
  { id: 'receivables', label: '应收账款', group: '收入侧', icon: HandCoins },
  { id: 'collection', label: '收款与核销', group: '收入侧', aliases: ['收款管理'], icon: ReceiptText },
  { id: 'invoice', label: '发票与税务', group: '收入侧', aliases: ['发票管理', '合规文件包'], icon: FileText },
  // 支出侧：应付账款 → 付款申请 → 付款录入中心
  { id: 'payables', label: '应付账款', group: '支出侧', icon: Landmark },
  { id: 'payment_request', label: '付款申请', group: '支出侧', icon: ClipboardCheck },
  { id: 'payment_intake', label: '付款录入中心', group: '支出侧', aliases: ['付款记录'], icon: Banknote },
  // 资金侧
  { id: 'bank', label: '资金与银行', group: '资金侧', aliases: ['银行流水', '账户余额', '汇率管理'], icon: Banknote },
  // 管理侧：风控 → 报表
  { id: 'risk', label: '财务风控', group: '管理侧', icon: ShieldAlert },
  { id: 'reports', label: '执行报表', group: '管理侧', aliases: ['利润分析', '财务报表'], icon: BarChart3 },
];

/** mock 任务里的 `module` 文案 → 管理中心 Tab id */
export function financeModuleLabelToTabId(label: string): FinanceManagementTabId | undefined {
  return FINANCE_MODULE_TAB_ITEMS.find((t) => t.label === label)?.id;
}

export function FinanceModuleTabs({
  active,
  onChange,
  counts,
  grouped = false,
}: {
  active: FinanceManagementTabId;
  onChange: (id: FinanceManagementTabId) => void;
  /** 各模块待办数量（可选，用于待办中心等） */
  counts?: Partial<Record<FinanceManagementTabId, number>>;
  /** 管理中心使用分域导航，待办中心仍可用紧凑横向 Tab。 */
  grouped?: boolean;
}) {
  const renderButton = (t: (typeof FINANCE_MODULE_TAB_ITEMS)[number]) => {
    const Icon = t.icon;
    const count = counts?.[t.id];

    return (
      <button
        key={t.id}
        type="button"
        onClick={() => onChange(t.id)}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-2.5 py-1.5 text-[12px] font-semibold leading-[1.35] tracking-normal transition-colors ${
          active === t.id
            ? 'border-slate-300 bg-white text-slate-900 shadow-sm'
            : 'border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-white/70'
        }`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span>{t.label}</span>
        {typeof count === 'number' && count > 0 ? (
          <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
            {count}
          </span>
        ) : null}
      </button>
    );
  };

  if (grouped) {
    const groups: FinanceModuleGroup[] = ['收入侧', '支出侧', '资金侧', '管理侧'];
    const groupColors: Record<FinanceModuleGroup, string> = {
      '收入侧': 'text-emerald-700',
      '支出侧': 'text-rose-700',
      '资金侧': 'text-indigo-700',
      '管理侧': 'text-slate-600',
    };

    return (
      <div className="flex items-stretch overflow-x-auto border border-slate-200 bg-slate-50">
        {groups.map((group, gi) => (
          <React.Fragment key={group}>
            {gi > 0 && <div className="w-px flex-shrink-0 self-stretch bg-slate-200" />}
            <div className="flex flex-shrink-0 items-center">
              <span className={`self-stretch flex items-center whitespace-nowrap border-r border-slate-200 px-2.5 text-[10px] font-bold ${groupColors[group]}`}>
                {group}
              </span>
              <div className="flex items-center gap-0.5 px-1">
                {FINANCE_MODULE_TAB_ITEMS.filter((t) => t.group === group).map(renderButton)}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-0.5 border border-slate-300 bg-slate-200 p-0.5">
      {FINANCE_MODULE_TAB_ITEMS.map(renderButton)}
    </div>
  );
}
