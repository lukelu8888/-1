import type { ReactNode } from 'react';
import { cn } from '../../../ui/utils';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, actions, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center',
        className,
      )}
    >
      {icon && <div className="text-slate-400">{icon}</div>}
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {description && (
        <div className="max-w-sm text-[12px] text-slate-500">{description}</div>
      )}
      {actions && <div className="mt-1 flex items-center gap-2">{actions}</div>}
    </div>
  );
}
