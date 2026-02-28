/**
 * formatters.ts
 * Unified money / date / number formatters for ERP document rendering.
 *
 * Rules (enforced):
 *  • Money  : Intl.NumberFormat, 2 decimal places, thousands separator
 *  • null / undefined / NaN → display "—" (em-dash), never "NaN" or "0.00"
 *  • Currency symbol prefix OR trailing label (CNY → "元", USD → "$", EUR → "€")
 *  • Date   : zh-CN locale, YYYY-MM-DD
 */

// ─── Currency config ──────────────────────────────────────────────────────────
export interface CurrencyConfig {
  /** Symbol shown before the number (e.g. "$") */
  symbol: string;
  /** Label shown after (e.g. "元(人民币)") – used in column headers */
  label: string;
  /** BCP-47 locale for Intl.NumberFormat */
  locale: string;
}

const CURRENCY_MAP: Record<string, CurrencyConfig> = {
  CNY: { symbol: '¥', label: '元（人民币）', locale: 'zh-CN' },
  USD: { symbol: '$', label: '美元（USD）',  locale: 'en-US' },
  EUR: { symbol: '€', label: '欧元（EUR）',  locale: 'de-DE' },
  GBP: { symbol: '£', label: '英镑（GBP）',  locale: 'en-GB' },
  JPY: { symbol: '¥', label: '日元（JPY）',  locale: 'ja-JP' },
};

export function getCurrencyConfig(currency: string | undefined | null): CurrencyConfig {
  const key = (currency ?? 'CNY').toUpperCase();
  return CURRENCY_MAP[key] ?? { symbol: key, label: key, locale: 'zh-CN' };
}

// ─── Money formatter ──────────────────────────────────────────────────────────
/**
 * Format a monetary value.
 * @param value  Raw number (may be null/undefined/NaN)
 * @param currency  e.g. "CNY", "USD"
 * @param opts.withSymbol  Prefix the currency symbol (default true)
 * @param opts.fallback    What to show for null/NaN (default "—")
 * @returns Formatted string, e.g. "¥1,234.56"  |  "—"
 */
export function formatMoney(
  value: number | null | undefined,
  currency: string | undefined | null = 'CNY',
  opts: { withSymbol?: boolean; fallback?: string } = {},
): string {
  const { withSymbol = true, fallback = '—' } = opts;

  if (value == null || !Number.isFinite(value)) return fallback;

  const cfg = getCurrencyConfig(currency);

  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return withSymbol ? `${cfg.symbol}${formatted}` : formatted;
}

/**
 * Calculate line amount: qty × unitPrice.
 * Returns null if either operand is null/NaN.
 */
export function calcLineAmount(
  qty: number | null | undefined,
  unitPrice: number | null | undefined,
): number | null {
  if (qty == null || unitPrice == null) return null;
  if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) return null;
  return qty * unitPrice;
}

/**
 * Sum all line amounts. If items has no valid prices, returns 0.
 */
export function calcGrandTotal(
  items: Array<{
    quantity?: number | null;
    unitPrice?: number | null;
    amount?: number | null;
    lineAmount?: number | null;
  }>,
): number {
  return items.reduce((sum, item) => {
    // Prefer explicit amount field, fall back to qty×price
    const lineAmt =
      item.amount ?? item.lineAmount ?? calcLineAmount(item.quantity ?? null, item.unitPrice ?? null);
    return sum + (lineAmt ?? 0);
  }, 0);
}

// ─── Date formatter ───────────────────────────────────────────────────────────
/**
 * Format a date string/Date to zh-CN "YYYY-MM-DD".
 * Returns "—" for invalid/null input.
 */
export function formatDate(
  value: string | Date | null | undefined,
  fallback = '—',
): string {
  if (!value) return fallback;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return fallback;
    return d
      .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-');
  } catch {
    return fallback;
  }
}

// ─── Number formatter (qty, etc.) ─────────────────────────────────────────────
export function formatQty(
  value: number | null | undefined,
  decimals = 0,
  fallback = '—',
): string {
  if (value == null || !Number.isFinite(value)) return fallback;
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
