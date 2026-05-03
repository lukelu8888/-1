/**
 * Tiny CSV serializer + browser-side download helper used by the Phase 4d
 * export flow. We keep this in the service folder (not `shared/`) because
 * it sits between the data layer and the browser — it has no React
 * dependencies and is unit-testable.
 *
 * Notes:
 *   - We use UTF-8 with a BOM so Excel on Windows opens Chinese columns
 *     correctly.
 *   - Each cell is quoted only when it contains a separator, quote or
 *     newline, matching RFC 4180 minimal-quoting style.
 */

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[],
  options?: { headers?: Array<keyof T & string>; headerLabels?: Record<string, string> },
): string {
  if (rows.length === 0) return '';
  const headers = options?.headers ?? (Object.keys(rows[0]) as Array<keyof T & string>);
  const labels = headers.map((h) => options?.headerLabels?.[h] ?? h);

  const lines = [labels.map(escape).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(formatCell(row[h]))).join(','));
  }
  return lines.join('\r\n');
}

function formatCell(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  return String(value);
}

function escape(cell: string): string {
  if (/[",\r\n]/.test(cell)) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

/**
 * Triggers a CSV download in the current browser tab. We wrap the data in
 * a UTF-8 BOM so Excel opens the file with the correct encoding on
 * Windows. Caller is responsible for the filename (without extension).
 */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
