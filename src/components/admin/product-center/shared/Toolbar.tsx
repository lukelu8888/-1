import type { ReactNode } from 'react';
import { cn } from '../../../ui/utils';

interface ToolbarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  /** add a thin border + bg for the action bar */
  bordered?: boolean;
}

/**
 * ERP top toolbar — left side: page title / actions, right side: search/filter/view.
 */
export function Toolbar({ left, right, className, bordered = true }: ToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 px-3 py-2',
        bordered && 'border-b border-slate-200 bg-slate-50/60',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">{left}</div>
      <div className="flex flex-wrap items-center gap-1.5">{right}</div>
    </div>
  );
}

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function PageHeading({ title, subtitle, badge, actions }: PageHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-slate-900">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-[12px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}
