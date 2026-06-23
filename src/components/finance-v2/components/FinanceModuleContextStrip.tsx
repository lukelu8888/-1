import React from 'react';
import type { FinanceManagementTabId } from '../types/financeV2';
import { FINANCE_MODULE_TAB_CONTEXT } from '../data/financeModuleTabContext';

/**
 * 管理中心 Tab 下方模块说明条：与 FinancePageHeader 层级衔接，字号对标 Admin 侧栏菜单（13px / 11px）。
 */
export function FinanceModuleContextStrip({ tab }: { tab: FinanceManagementTabId }) {
  const ctx = FINANCE_MODULE_TAB_CONTEXT[tab];
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2.5">
      <h2 className="text-slate-900" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
        {ctx.heading}
      </h2>
      <p className="mt-1 text-slate-600" style={{ fontSize: 11, lineHeight: 1.45 }}>
        {ctx.description}
      </p>
    </div>
  );
}
