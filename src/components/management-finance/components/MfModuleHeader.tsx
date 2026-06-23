import React from 'react';

interface MfModuleHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Module-level sub-header shared by every inner module of Management Finance
 * Center. Mirrors the visual rhythm of FinancePageHeader for consistency.
 */
export function MfModuleHeader({ title, subtitle, badge, actions }: MfModuleHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold leading-tight tracking-tight text-slate-900">{title}</h2>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-0.5 max-w-[960px] text-[12px] leading-relaxed text-slate-600">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-1.5">{actions}</div> : null}
    </div>
  );
}
