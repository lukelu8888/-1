import { describe, expect, it } from 'vitest';
import {
  COLUMN_LABELS,
  IMPORT_COLUMNS,
  buildImportTemplate,
  normalizeImportRow,
} from './productImportColumns';
import { csvToObjects } from './csv';

describe('normalizeImportRow', () => {
  it('accepts English keys verbatim', () => {
    const row = normalizeImportRow({ sku: 'A1', name: 'Hose', basePrice: '10' });
    expect(row.sku).toBe('A1');
    expect(row.name).toBe('Hose');
    expect(row.basePrice).toBe('10');
  });

  it('translates Chinese labels to English keys', () => {
    const row = normalizeImportRow({
      SKU: 'B2',
      中文名: '水管',
      品牌: 'Acme',
      地区: 'NA',
      售价: '99.99',
    });
    expect(row.sku).toBe('B2');
    expect(row.name).toBe('水管');
    expect(row.brand).toBe('Acme');
    expect(row.region).toBe('NA');
    expect(row.salePrice).toBe('99.99');
  });

  it('drops unknown columns and empty cells without error', () => {
    const row = normalizeImportRow({ sku: 'C3', '随便一列': 'x', name: '' });
    expect(row.sku).toBe('C3');
    // empty cells are stripped (not kept as '')
    const asMap = row as Record<string, unknown>;
    expect(asMap.name).toBeUndefined();
    expect(asMap['随便一列']).toBeUndefined();
  });
});

describe('buildImportTemplate', () => {
  it('emits header + sample row that round-trips through csvToObjects', () => {
    const csv = buildImportTemplate();
    const parsed = csvToObjects(csv);
    expect(parsed.length).toBe(1);
    // header row uses Chinese labels
    expect(Object.keys(parsed[0])).toContain(COLUMN_LABELS.sku);
    expect(Object.keys(parsed[0])).toContain(COLUMN_LABELS.name);
    // sample row has the example sku
    expect(parsed[0][COLUMN_LABELS.sku]).toBe('SKU-EXAMPLE-001');
  });

  it('includes every column from IMPORT_COLUMNS', () => {
    const csv = buildImportTemplate();
    const headerLine = csv.split('\r\n')[0];
    IMPORT_COLUMNS.forEach((k) => {
      expect(headerLine).toContain(COLUMN_LABELS[k]);
    });
  });
});
