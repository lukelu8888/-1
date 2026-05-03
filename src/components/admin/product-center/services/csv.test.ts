import { describe, expect, it } from 'vitest';
import { csvToObjects, csvToRows, rowsToCsv } from './csv';

describe('rowsToCsv', () => {
  it('returns empty string when given no rows', () => {
    expect(rowsToCsv([])).toBe('');
  });

  it('emits headers from the first row by default', () => {
    const csv = rowsToCsv([
      { sku: 'A1', name: 'Hose' },
      { sku: 'B2', name: 'Pump' },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('sku,name');
    expect(lines[1]).toBe('A1,Hose');
    expect(lines[2]).toBe('B2,Pump');
  });

  it('honours explicit header order and labels', () => {
    const csv = rowsToCsv(
      [{ sku: 'A1', name: 'Hose', price: 10 }],
      {
        headers: ['name', 'price', 'sku'],
        headerLabels: { name: '名称', price: '售价', sku: 'SKU' },
      },
    );
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('名称,售价,SKU');
    expect(lines[1]).toBe('Hose,10,A1');
  });

  it('escapes commas, quotes and newlines per RFC 4180', () => {
    const csv = rowsToCsv([
      { name: 'Hose, 10ft', desc: 'He said "hello"', body: 'line1\nline2' },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('"Hose, 10ft","He said ""hello""","line1\nline2"');
  });

  it('renders nullish values as empty cells and Date as ISO string', () => {
    const csv = rowsToCsv([
      { a: null, b: undefined, c: new Date('2026-05-03T00:00:00Z'), d: false },
    ]);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe(',,2026-05-03T00:00:00.000Z,false');
  });
});

describe('csvToRows / csvToObjects', () => {
  it('round-trips with rowsToCsv', () => {
    const rows = [
      { sku: 'A1', name: 'Hose, 10ft', price: '10' },
      { sku: 'B2', name: 'Pump "Pro"', price: '50' },
    ];
    const csv = rowsToCsv(rows);
    const parsed = csvToObjects(csv);
    expect(parsed).toEqual(rows);
  });

  it('handles UTF-8 BOM, CRLF, and trailing newline', () => {
    const csv = '\ufeffsku,name\r\nA1,Hose\r\nB2,Pump\r\n';
    expect(csvToObjects(csv)).toEqual([
      { sku: 'A1', name: 'Hose' },
      { sku: 'B2', name: 'Pump' },
    ]);
  });

  it('handles quoted fields with embedded commas, quotes and newlines', () => {
    const csv = 'name,desc\r\n"Hose, 10ft","He said ""hi""\nline2"';
    const rows = csvToRows(csv);
    expect(rows).toEqual([
      ['name', 'desc'],
      ['Hose, 10ft', 'He said "hi"\nline2'],
    ]);
  });

  it('returns [] when the CSV has no data rows', () => {
    expect(csvToObjects('sku,name')).toEqual([]);
    expect(csvToObjects('')).toEqual([]);
  });

  it('trims trailing empty rows from spreadsheet exports', () => {
    const csv = 'sku,name\r\nA1,Hose\r\n,\r\n,\r\n';
    const rows = csvToObjects(csv);
    expect(rows).toEqual([{ sku: 'A1', name: 'Hose' }]);
  });

  it('preserves header casing/wording so Chinese labels work', () => {
    const csv = 'SKU,中文名\r\nA1,水管\r\nB2,水泵';
    expect(csvToObjects(csv)).toEqual([
      { SKU: 'A1', '中文名': '水管' },
      { SKU: 'B2', '中文名': '水泵' },
    ]);
  });
});
