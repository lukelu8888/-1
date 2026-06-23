import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '../ui/popover';

export type CompactDetailItem = {
  label?: React.ReactNode;
  value: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

const hasCompactDetailValue = (value: React.ReactNode): boolean => {
  if (value === null || value === undefined || value === false) return false;
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized.length > 0 && normalized !== '-' && normalized !== '—';
  }
  return true;
};

let activeCompactDetailsClose: (() => void) | null = null;

export function CompactDetailsPopover({
  items,
  align = 'start',
  ariaLabel = '展开详情',
}: {
  items: CompactDetailItem[];
  align?: 'start' | 'center' | 'end';
  ariaLabel?: string;
}) {
  const visibleItems = items.filter((item) => hasCompactDetailValue(item.value));
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  const closeSelf = React.useCallback(() => {
    setOpen(false);
  }, []);

  const openDetails = React.useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      if (activeCompactDetailsClose && activeCompactDetailsClose !== closeSelf) {
        activeCompactDetailsClose();
      }

      activeCompactDetailsClose = closeSelf;
      setOpen(true);
    },
    [closeSelf],
  );

  const closeDetails = React.useCallback(() => {
    closeSelf();
    if (activeCompactDetailsClose === closeSelf) activeCompactDetailsClose = null;
  }, [closeSelf]);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        if (activeCompactDetailsClose && activeCompactDetailsClose !== closeSelf) {
          activeCompactDetailsClose();
        }
        activeCompactDetailsClose = closeSelf;
        setOpen(true);
        return;
      }
      closeDetails();
    },
    [closeDetails, closeSelf],
  );

  React.useEffect(() => () => {
    if (activeCompactDetailsClose === closeSelf) activeCompactDetailsClose = null;
  }, [closeSelf]);

  React.useEffect(() => {
    if (!open) return undefined;

    const containsPoint = (element: HTMLElement | null, x: number, y: number, padding = 10) => {
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return (
        x >= rect.left - padding &&
        x <= rect.right + padding &&
        y >= rect.top - padding &&
        y <= rect.bottom + padding
      );
    };

    const isBetweenTriggerAndContent = (x: number, y: number, padding = 12) => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const content = contentRef.current?.getBoundingClientRect();
      if (!trigger || !content) return false;

      const left = Math.min(trigger.left, content.left) - padding;
      const right = Math.max(trigger.right, content.right) + padding;
      const top = Math.min(trigger.top, content.top) - padding;
      const bottom = Math.max(trigger.bottom, content.bottom) + padding;

      return x >= left && x <= right && y >= top && y <= bottom;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const x = event.clientX;
      const y = event.clientY;

      if (
        containsPoint(triggerRef.current, x, y) ||
        containsPoint(contentRef.current, x, y) ||
        isBetweenTriggerAndContent(x, y)
      ) {
        return;
      }

      closeDetails();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [closeDetails, open]);

  if (visibleItems.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <span
          ref={triggerRef}
          aria-label={ariaLabel}
          aria-expanded={open}
          role="button"
          tabIndex={0}
          onPointerEnterCapture={openDetails}
          onMouseEnterCapture={openDetails}
          onFocus={openDetails}
          onPointerDownCapture={openDetails}
          onClickCapture={openDetails}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeDetails();
            if (event.key === 'Enter' || event.key === ' ') openDetails(event);
          }}
          className={`inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-white shadow-sm transition-colors hover:border-blue-200 hover:text-blue-600 ${
            open ? 'border-blue-300 text-blue-600' : 'border-slate-200 text-slate-500'
          }`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </PopoverAnchor>
      <PopoverContent
        ref={contentRef}
        align={align}
        className="z-50 w-auto min-w-[220px] max-w-[360px] rounded-md border border-slate-200 bg-white p-2 text-[11px] shadow-lg"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-1">
          {visibleItems.map((item, index) => (
            <div key={index} className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-2">
              <span className="shrink-0 text-slate-400">{item.label || '详情'}</span>
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`min-w-0 break-all text-left leading-4 hover:underline ${item.className || 'text-slate-700'}`}
                >
                  {item.value}
                </button>
              ) : (
                <span className={`min-w-0 break-words leading-4 ${item.className || 'text-slate-700'}`}>
                  {item.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
