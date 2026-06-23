import React from 'react';

/**
 * 财务 V2 路由顶栏：与 Admin 主内容常用字号对标（15px 标题 + 11px 说明，行高固定），
 * 避免全局 typography / h1 预检样式把字「压扁」。
 */
interface FinancePageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function FinancePageHeader({ title, subtitle, right }: FinancePageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-300 bg-white px-4 py-3">
      <div className="min-w-0">
        <h1 className="text-slate-900" style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-slate-600" style={{ fontSize: 11, lineHeight: 1.45 }}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {right ? <div className="flex flex-shrink-0 flex-wrap items-center gap-1.5">{right}</div> : null}
    </div>
  );
}
