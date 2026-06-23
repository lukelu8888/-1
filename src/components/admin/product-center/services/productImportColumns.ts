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
import type { ProductAttribute, ProductCategory } from '../context/types';

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

function csvEscape(value: string): string {
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildDynamicImportTemplate(
  categories: ProductCategory[],
  attributes: ProductAttribute[],
): string {
  const attrColumns = attributes
    .filter((a) => a.includeInImport ?? true)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((a) => `属性:${a.code}`);
  const headers = [...IMPORT_COLUMNS.map((k) => COLUMN_LABELS[k]), ...attrColumns];
  const sample = headers.map((header) => {
    if (header === COLUMN_LABELS.sku) return 'SKU-EXAMPLE-001';
    if (header === COLUMN_LABELS.name) return '示例产品';
    if (header === COLUMN_LABELS.nameEn) return 'Sample Product';
    if (header === COLUMN_LABELS.status) return 'draft';
    if (header === COLUMN_LABELS.region) return 'NA';
    if (header === COLUMN_LABELS.currency) return 'USD';
    if (header === COLUMN_LABELS.basePrice) return '99.99';
    if (header === COLUMN_LABELS.primaryCategoryCode) {
      return categories.find((c) => c.isActive)?.code ?? '';
    }
    return '';
  });
  return `${headers.map(csvEscape).join(',')}\r\n${sample.map(csvEscape).join(',')}\r\n`;
}

export function buildDynamicImportWorkbookHtml(
  categories: ProductCategory[],
  attributes: ProductAttribute[],
): string {
  const attrColumns = attributes
    .filter((a) => a.includeInImport ?? true)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const headers = [...IMPORT_COLUMNS.map((k) => COLUMN_LABELS[k]), ...attrColumns.map((a) => `属性:${a.code}`)];
  const leafCategoryIds = new Set(categories.map((c) => c.parentId).filter(Boolean));
  const leafCategories = categories.filter((c) => c.isActive && !leafCategoryIds.has(c.id));
  const categoryPath = (cat: ProductCategory): string => {
    const byId = new Map(categories.map((c) => [c.id, c] as const));
    const chain: string[] = [];
    let cursor: ProductCategory | undefined = cat;
    while (cursor) {
      chain.unshift(cursor.name);
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return chain.join(' / ');
  };

  const headerCells = headers.map((h) => `<th>${htmlEscape(h)}</th>`).join('');
  const sampleCells = headers.map((h) => {
    const value =
      h === COLUMN_LABELS.sku ? 'SKU-EXAMPLE-001'
        : h === COLUMN_LABELS.name ? '示例产品'
        : h === COLUMN_LABELS.nameEn ? 'Sample Product'
        : h === COLUMN_LABELS.status ? 'draft'
        : h === COLUMN_LABELS.region ? 'NA'
        : h === COLUMN_LABELS.currency ? 'USD'
        : h === COLUMN_LABELS.basePrice ? '99.99'
        : h === COLUMN_LABELS.primaryCategoryCode ? (leafCategories[0]?.code ?? '')
        : '';
    return `<td>${htmlEscape(value)}</td>`;
  }).join('');

  const categoryRows = leafCategories
    .map((c) => `<tr><td>${htmlEscape(c.code)}</td><td>${htmlEscape(c.name)}</td><td>${htmlEscape(c.nameEn ?? '')}</td><td>${htmlEscape(categoryPath(c))}</td></tr>`)
    .join('');
  const attrRows = attrColumns
    .map((a) => `<tr><td>${htmlEscape(a.code)}</td><td>${htmlEscape(a.label)}</td><td>${htmlEscape(a.dataType)}</td><td>${htmlEscape(a.unit ?? '')}</td><td>${htmlEscape(a.options?.join(' / ') ?? '')}</td><td>${a.isRequired ? 'Y' : ''}</td><td>${htmlEscape((a.appliesToCategoryIds ?? []).join(', '))}</td></tr>`)
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; margin-bottom: 24px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; mso-number-format:"\\@"; }
    th { background: #e2e8f0; font-weight: 700; }
    .title { font-size: 16px; font-weight: 700; margin: 16px 0 8px; }
    .note { color: #64748b; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="title">产品导入模板</div>
  <div class="note">请在“主类目编码”填写下方类目字典中的末级类目编码；属性列会随分类中心实时生成。</div>
  <table><thead><tr>${headerCells}</tr></thead><tbody><tr>${sampleCells}</tr></tbody></table>
  <div class="title">类目字典（末级类目）</div>
  <table><thead><tr><th>类目编码</th><th>中文名</th><th>英文名</th><th>完整路径</th></tr></thead><tbody>${categoryRows}</tbody></table>
  <div class="title">属性字典</div>
  <table><thead><tr><th>属性编码</th><th>属性名称</th><th>类型</th><th>单位</th><th>可选项</th><th>必填</th><th>绑定类目ID</th></tr></thead><tbody>${attrRows}</tbody></table>
</body>
</html>`;
}
