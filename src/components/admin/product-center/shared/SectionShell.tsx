import type { ReactNode } from 'react';
import { cn } from '../../../ui/utils';

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hide outer panel — for nested sections */
  flat?: boolean;
  /** Phase tag like "Phase 2" / "Phase 3" — appears next to title */
  phase?: string;
}

/**
 * Tight ERP-style content panel. No oversized rounding, no big shadows.
 */
export function SectionShell({ title, subtitle, actions, children, className, flat, phase }: Props) {
  return (
    <section
      className={cn(
        !flat && 'rounded border border-slate-200 bg-white',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-[13px] font-semibold text-slate-800">{title}</h2>
          {phase && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {phase}
            </span>
          )}
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5">{actions}</div>}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

interface FieldRowProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /**
   * `horizontal` (default): label on the left with fixed width, control on
   *  the right filling remaining space. Robust under nested grid layouts.
   * `vertical`: label above the control. Use when the section is very narrow
   *  or stacked into a single thin column.
   */
  layout?: 'horizontal' | 'vertical';
  /** Override the fixed label column width (Tailwind class). Default `w-28`. */
  labelWidth?: string;
}

/**
 * ERP-style label + control row.
 *
 * Implementation note: we use flex (not grid) because `grid-cols-12 col-span-3`
 * collapses Chinese labels to single-character vertical text when the section
 * is nested inside another grid (deals/category right panes). Flex with a
 * fixed-width `whitespace-nowrap` label keeps labels horizontal regardless of
 * outer width.
 */
export function FieldRow({
  label,
  hint,
  required,
  children,
  className,
  layout = 'horizontal',
  labelWidth,
}: FieldRowProps) {
  if (layout === 'vertical') {
    return (
      <div className={cn('py-1.5', className)}>
        <div className="mb-1 flex items-center text-[12px] font-medium text-slate-600">
          <span className="whitespace-nowrap">{label}</span>
          {required && <span className="ml-0.5 text-rose-500">*</span>}
          {hint && (
            <span className="ml-1 whitespace-nowrap text-[11px] font-normal text-slate-400">
              {hint}
            </span>
          )}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    );
  }
  return (
    <div className={cn('flex items-start gap-3 py-1.5', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center pt-1.5 text-[12px] font-medium text-slate-600',
          labelWidth ?? 'w-28',
        )}
      >
        <span className="whitespace-nowrap">{label}</span>
        {required && <span className="ml-0.5 text-rose-500">*</span>}
        {hint && (
          <span className="ml-1 whitespace-nowrap text-[11px] font-normal text-slate-400">
            {hint}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function FieldGroup({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded border border-slate-200 bg-slate-50/40', className)}>
      {title && (
        <div className="border-b border-slate-200 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </div>
      )}
      <div className="p-3">{children}</div>
    </div>
  );
}
