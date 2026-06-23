import React, { useState } from 'react';
import { ManagementFinanceProvider } from './context/ManagementFinanceContext';
import { ManagementFinanceShell } from './ManagementFinanceShell';
import type { ManagementFinanceTabId } from './types';

/**
 * Management Finance Center — entry component.
 *
 * Drop-in module that wires:
 *   <ManagementFinanceProvider> → owns Supabase-backed state
 *   <ManagementFinanceShell>    → renders title bar, company/period filter,
 *                                 grouped tab strip and the 12 sub-modules.
 *
 * Architecture is documented in:
 *   docs/management-finance-architecture.md
 *
 * SQL schema:
 *   database/migrations/20260514_management_finance_center.sql
 */
export default function ManagementFinanceCenter() {
  const [activeTab, setActiveTab] = useState<ManagementFinanceTabId>('overview');
  return (
    <ManagementFinanceProvider>
      <div className="px-4 py-3">
        <ManagementFinanceShell activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </ManagementFinanceProvider>
  );
}
