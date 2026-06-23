import React from 'react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { cn } from '../../ui/utils';

export function FinanceFilterBar({
  placeholder = '关键字…',
  extra,
  value,
  onChange,
  onReset,
  inputClassName,
  containerClassName,
  hideDefaultActions = false,
}: {
  placeholder?: string;
  extra?: React.ReactNode;
  /** 传入后与 onChange 配对，启用可编辑筛选（否则保持只读占位，兼容各业务模块 mock） */
  value?: string;
  onChange?: (next: string) => void;
  onReset?: () => void;
  inputClassName?: string;
  containerClassName?: string;
  hideDefaultActions?: boolean;
}) {
  const interactive = value !== undefined && onChange !== undefined;

  return (
    <div className={cn('flex min-w-0 items-center gap-2 border border-slate-300 bg-white px-2 py-1.5', containerClassName)}>
      <Input
        className={cn(
          'h-10 min-w-0 flex-1 border-slate-300 text-[13px] font-semibold leading-[1.35] text-slate-700 placeholder:text-[11px] placeholder:font-semibold placeholder:text-slate-400',
          inputClassName,
        )}
        placeholder={placeholder}
        readOnly={!interactive}
        value={interactive ? value : undefined}
        onChange={interactive ? (e) => onChange(e.target.value) : undefined}
      />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {!hideDefaultActions ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0 min-w-[96px] border-slate-300 px-6 text-[13px] font-semibold leading-[1.35]"
              disabled={!interactive}
            >
              筛选
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 shrink-0 min-w-[96px] border-slate-300 px-6 text-[13px] font-semibold leading-[1.35] text-slate-600"
              disabled={!interactive}
              onClick={() => onReset?.()}
            >
              重置
            </Button>
          </>
        ) : null}
        {extra}
      </div>
    </div>
  );
}
