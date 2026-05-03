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

// ── parsing (Phase 4e — bulk import) ─────────────────────────────────────────

/**
 * RFC 4180-compatible CSV parser. Returns a 2D array of strings. Strips a
 * leading UTF-8 BOM and handles quoted fields with embedded commas, quotes
 * and newlines. Empty trailing rows are skipped.
 *
 * We hand-roll this rather than pulling in `papaparse` (~30 KB gzipped)
 * because Phase 4d already has a CSV serializer; an in-house parser keeps
 * the round-trip "export → edit in Excel → import" symmetric and adds
 * no new bundle weight.
 */
export function csvToRows(csv: string): string[][] {
  const text = csv.replace(/^\ufeff/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuote = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuote) {
      if (c === '"') {
        // Doubled quote inside a quoted field → literal quote.
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuote = false;
        }
        continue;
      }
      cell += c;
      continue;
    }

    if (c === '"') {
      inQuote = true;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (c === '\r') {
      // CRLF or bare CR → ignore CR, the LF (or end-of-input) flushes.
      if (text[i + 1] !== '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      }
      continue;
    }
    if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += c;
  }

  // Flush the final cell/row if the file didn't end with a newline.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop fully-empty trailing rows (Excel often appends one).
  while (rows.length && rows[rows.length - 1].every((c) => c === '')) {
    rows.pop();
  }
  return rows;
}

/**
 * Parses a CSV string with header row. Each non-header row becomes an
 * object keyed by the header. Missing trailing columns become `''`.
 *
 * We normalize headers by trimming whitespace; otherwise the original
 * casing/wording is preserved so callers can map either Chinese or
 * English column names.
 */
export function csvToObjects(csv: string): Record<string, string>[] {
  const rows = csvToRows(csv);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
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
