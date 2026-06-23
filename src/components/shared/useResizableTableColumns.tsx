import React from 'react';
import { renderColumnResizeHandle } from '../admin/admin-organization-profile/peopleCenterVisuals';

type ResizeHandleOptions = {
  showKnob?: boolean;
  hitAreaClassName?: string;
  lineHoverClassName?: string;
  knobHoverClassName?: string;
};

type UseResizableTableColumnsOptions<T extends string> = {
  storageKey: string;
  order: T[];
  defaults: Record<T, number>;
  minWidths: Record<T, number>;
  fixedColumns?: T[];
};

function mergeStoredWidths<T extends string>(
  order: T[],
  defaults: Record<T, number>,
  candidate: unknown,
) {
  const merged = { ...defaults };
  if (!candidate || typeof candidate !== 'object') return merged;

  for (const key of order) {
    const rawValue = (candidate as Record<string, unknown>)[key];
    const width = Number(rawValue);
    if (Number.isFinite(width) && width > 0) {
      merged[key] = Math.round(width);
    }
  }

  return merged;
}

export function useResizableTableColumns<T extends string>({
  storageKey,
  order,
  defaults,
  minWidths,
  fixedColumns = [],
}: UseResizableTableColumnsOptions<T>) {
  const resizeRef = React.useRef<{
    key: T;
    startX: number;
    startWidth: number;
  } | null>(null);

  const [widths, setWidths] = React.useState<Record<T, number>>(() => {
    if (typeof window === 'undefined') return { ...defaults };
    try {
      const raw = window.localStorage.getItem(storageKey);
      return mergeStoredWidths(order, defaults, raw ? JSON.parse(raw) : null);
    } catch {
      return { ...defaults };
    }
  });

  React.useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(widths));
    } catch {}
  }, [storageKey, widths]);

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeRef.current) return;
      const { key, startX, startWidth } = resizeRef.current;
      const nextWidth = Math.max(
        minWidths[key],
        Math.round(startWidth + (event.clientX - startX)),
      );
      setWidths((current) => (
        current[key] === nextWidth ? current : { ...current, [key]: nextWidth }
      ));
    };

    const stopResize = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('blur', stopResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('blur', stopResize);
    };
  }, [minWidths]);

  const totalWidth = React.useMemo(
    () => order.reduce((sum, key) => sum + widths[key], 0),
    [order, widths],
  );

  const getColumnStyle = React.useCallback((key: T) => {
    if (fixedColumns.includes(key)) {
      const width = widths[key];
      return {
        width,
        minWidth: width,
        maxWidth: width,
      } as const;
    }

    const ratio = totalWidth > 0 ? widths[key] / totalWidth : 1 / order.length;
    const width = `${(ratio * 100).toFixed(4)}%`;
    return {
      width,
      minWidth: 0,
      maxWidth: width,
    } as const;
  }, [fixedColumns, order.length, totalWidth, widths]);

  const startResize = React.useCallback((key: T, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      key,
      startX: event.clientX,
      startWidth: widths[key],
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [widths]);

  const shrinkToMinimum = React.useCallback((key: T, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setWidths((current) => (
      current[key] === minWidths[key]
        ? current
        : { ...current, [key]: minWidths[key] }
    ));
  }, [minWidths]);

  const renderResizeHandle = React.useCallback((key: T, options?: ResizeHandleOptions) => (
    renderColumnResizeHandle(
      key,
      startResize,
      shrinkToMinimum,
      {
        lineHoverClassName: 'group-hover:bg-slate-400',
        ...options,
      },
    )
  ), [shrinkToMinimum, startResize]);

  const renderHeaderCell = React.useCallback((
    key: T,
    label: string,
    className = '',
    options?: ResizeHandleOptions,
  ) => {
    const alignClass = className.includes('text-center')
      ? 'justify-center text-center'
      : className.includes('text-right')
        ? 'justify-end text-right'
        : 'justify-start text-left';

    return (
      <th
        className={`group relative overflow-hidden px-3 py-3 font-semibold ${className}`.trim()}
        style={getColumnStyle(key)}
      >
        <div className={`flex min-h-5 w-full items-center pr-4 ${alignClass}`}>
          <span className="block whitespace-nowrap text-[13px] font-semibold leading-4">
            {label}
          </span>
        </div>
        {renderResizeHandle(key, options)}
      </th>
    );
  }, [getColumnStyle, renderResizeHandle]);

  return {
    widths,
    setWidths,
    getColumnStyle,
    renderResizeHandle,
    renderHeaderCell,
  };
}
