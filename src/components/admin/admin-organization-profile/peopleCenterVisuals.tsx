import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export function renderHierarchyDots(
  level: number,
  hasHierarchy: boolean,
  dotClassName: string,
  dotColor?: string,
) {
  if (!hasHierarchy) return null;
  const count = Math.max(level + 1, 1);

  return (
    <span
      className="inline-flex flex-row items-center justify-center gap-1"
      aria-label={`Hierarchy level ${count}`}
      title={`Hierarchy level ${count}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={`${level}-dot-${index}`}
          className={`block h-1.5 w-1.5 rounded-full ${dotClassName}`}
          style={dotColor ? { backgroundColor: dotColor } : undefined}
        />
      ))}
    </span>
  );
}

export function renderSortIcon<T extends string>(
  currentKey: T,
  key: T,
  direction: 'asc' | 'desc',
) {
  if (currentKey !== key) {
    return <ArrowUpDown className="h-3.5 w-3.5 text-slate-300" />;
  }

  return direction === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5 text-red-500" />
    : <ArrowDown className="h-3.5 w-3.5 text-red-500" />;
}

export function getColumnStyle<T extends string>(
  widths: Record<T, number>,
  key: T,
) {
  return {
    width: `${widths[key]}px`,
    minWidth: `${widths[key]}px`,
  };
}

export function renderColumnResizeHandle<T extends string>(
  key: T,
  onMouseDown: (key: T, event: React.MouseEvent<HTMLDivElement>) => void,
  onDoubleClick: (key: T, event: React.MouseEvent<HTMLDivElement>) => void,
  options?: {
    hidden?: boolean;
    lineHoverClassName?: string;
    showKnob?: boolean;
    knobHoverClassName?: string;
    hitAreaClassName?: string;
  },
) {
  return (
    <div
      className={`absolute right-0 top-0 z-20 h-full w-5 cursor-col-resize select-none ${options?.hitAreaClassName || ''} ${options?.hidden ? 'hidden' : ''}`}
      onMouseDown={(event) => onMouseDown(key, event)}
      onDoubleClick={(event) => onDoubleClick(key, event)}
      title="Drag to resize column. Double-click to shrink to minimum width."
    >
      <span className={`pointer-events-none absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-slate-300 transition-colors ${options?.lineHoverClassName || 'group-hover:bg-slate-400'}`} />
      {options?.showKnob ? (
        <span className={`pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-slate-300 shadow-sm transition-colors ${options?.knobHoverClassName || 'group-hover:bg-slate-500'}`} />
      ) : null}
    </div>
  );
}
