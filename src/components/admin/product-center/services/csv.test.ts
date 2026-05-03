import { describe, expect, it } from 'vitest';
import { rowsToCsv } from './csv';

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
