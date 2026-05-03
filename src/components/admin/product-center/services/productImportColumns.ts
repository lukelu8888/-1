/**
 * Canonical column set shared by Phase 4d export and Phase 4e import.
 *
 * The order here is the order users will see in the exported CSV and in
 * the import preview table. `LABELS` maps each English key to the
 * Chinese header users actually see; `LABEL_TO_KEY` is the reverse map
 * the import flow uses to recognize CSV files exported from this app
 * (or filled in from the downloadable template).
 *
 * Both English keys and Chinese labels are accepted on import, so
 * operators can use whatever they prefer.
 */
import type { BulkImportRow, ProductExportRow } from './productCenterService';

/**
 * Column keys (must match `ProductExportRow` and `BulkImportRow` field
 * names). Marked `as const` so `(typeof IMPORT_COLUMNS)[number]` narrows
 * to the literal union.
 */
export const IMPORT_COLUMNS = [
  'sku',
  'name',
  'nameEn',
  'brand',
  'status',
  'reviewStatus',
  'primaryCategoryCode',
  'primaryCategoryName',
  'region',
  'currency',
  'basePrice',
  'salePrice',
  'campaignPrice',
  'publishStatus',
  'primarySupplier',
  'costPrice',
  'costCurrency',
  'hsCode',
  'moq',
  'unitsPerCarton',
  'leadTimeDays',
  'updatedAt',
] as const satisfies readonly (keyof ProductExportRow)[];

export type ImportColumnKey = (typeof IMPORT_COLUMNS)[number];

export const COLUMN_LABELS: Record<ImportColumnKey, string> = {
  sku: 'SKU',
  name: '中文名',
  nameEn: '英文名',
  brand: '品牌',
  status: '产品状态',
  reviewStatus: '审核状态',
  primaryCategoryCode: '主类目编码',
  primaryCategoryName: '主类目',
  region: '地区',
  currency: '币种',
  basePrice: '标价',
  salePrice: '售价',
  campaignPrice: '活动价',
  publishStatus: '发布状态',
  primarySupplier: '主供应商',
  costPrice: '采购成本',
  costCurrency: '成本币种',
  hsCode: 'HS Code',
  moq: 'MOQ',
  unitsPerCarton: '装箱量',
  leadTimeDays: '交期(天)',
  updatedAt: '更新时间',
};

/** Reverse lookup so import accepts Chinese labels. */
export const LABEL_TO_KEY: Record<string, ImportColumnKey> = Object.fromEntries(
  Object.entries(COLUMN_LABELS).map(([k, v]) => [v, k]),
) as Record<string, ImportColumnKey>;

/** Columns required for `pc_bulk_upsert_products` to succeed. */
export const REQUIRED_COLUMNS: ImportColumnKey[] = ['sku', 'name'];

/**
 * Normalises a parsed CSV row whose headers may be either English keys or
 * Chinese labels into the canonical `BulkImportRow` shape. Unknown
 * columns are dropped silently — extra columns in the CSV are not an error.
 */
export function normalizeImportRow(raw: Record<string, string>): BulkImportRow {
  const out: Record<string, string> = {};
  for (const [header, value] of Object.entries(raw)) {
    const key =
      (IMPORT_COLUMNS as readonly string[]).includes(header)
        ? (header as ImportColumnKey)
        : LABEL_TO_KEY[header];
    if (!key) continue;
    if (value !== '') out[key] = value;
  }
  return out as unknown as BulkImportRow;
}

/** Builds an empty CSV containing just the header row, for download. */
export function buildImportTemplate(): string {
  const headers = IMPORT_COLUMNS.map((k) => COLUMN_LABELS[k]).join(',');
  // include one example row so the user has a hint of what to fill in
  const sample = IMPORT_COLUMNS.map((k) => {
    if (k === 'sku') return 'SKU-EXAMPLE-001';
    if (k === 'name') return '示例产品';
    if (k === 'nameEn') return 'Sample Product';
    if (k === 'status') return 'draft';
    if (k === 'region') return 'NA';
    if (k === 'currency') return 'USD';
    if (k === 'basePrice') return '99.99';
    return '';
  }).join(',');
  return `${headers}\r\n${sample}\r\n`;
}
