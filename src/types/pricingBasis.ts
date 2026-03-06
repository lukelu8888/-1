export type PriceType = 'usd' | 'cny_no_tax' | 'cny_with_tax';

export type PricingIncoterm = 'EXW' | 'FOB' | 'CFR' | 'CIF';

export interface PricingTaxSettings {
  vatRate: number;
  exportRebateRate: number;
  hasExportRebate: boolean;
  usdRate: number;
  eurRate: number;
}

export interface SourcePricingBasis {
  unitPrice: number;
  currency: string;
  priceType: PriceType;
  incoterm: PricingIncoterm;
  incotermLocation?: string | null;
  quoteMode?: string | null;
  sourceDocumentNo?: string | null;
  supplierQuotationNo?: string | null;
  exchangeRate?: number | null;
  vatRate?: number | null;
  exportRebateRate?: number | null;
  hasExportRebate?: boolean | null;
  includesDomesticFees?: boolean;
  includesFreight?: boolean;
  includesInsurance?: boolean;
  sourceFreightUSD?: number | null;
  sourceInsuranceUSD?: number | null;
}

export function normalizePriceType(value: unknown, currency?: unknown): PriceType {
  if (value === 'usd' || value === 'cny_no_tax' || value === 'cny_with_tax') return value;
  return String(currency || '').toUpperCase() === 'USD' ? 'usd' : 'cny_with_tax';
}

export function normalizeCurrencyByPriceType(priceType: PriceType, currency?: unknown): string {
  if (priceType === 'usd') return 'USD';
  if (priceType === 'cny_no_tax' || priceType === 'cny_with_tax') return 'CNY';
  return String(currency || 'CNY').toUpperCase();
}

export function extractIncoterm(value: unknown, fallback: PricingIncoterm = 'FOB'): PricingIncoterm {
  const text = String(value || '').toUpperCase();
  if (text.includes('EXW')) return 'EXW';
  if (text.includes('CIF')) return 'CIF';
  if (text.includes('CFR')) return 'CFR';
  if (text.includes('FOB')) return 'FOB';
  return fallback;
}

export function extractIncotermLocation(value: unknown): string | null {
  const text = String(value || '').trim();
  if (!text) return null;
  const parts = text.split(/\s+/);
  if (parts.length <= 1) return null;
  return parts.slice(1).join(' ');
}

export function buildSourcePricingBasis(input: {
  unitPrice: unknown;
  currency?: unknown;
  priceType?: unknown;
  quoteMode?: unknown;
  deliveryTerms?: unknown;
  sourceDocumentNo?: unknown;
  supplierQuotationNo?: unknown;
  taxSettings?: Partial<PricingTaxSettings> | null;
  sourceFreightUSD?: unknown;
  sourceInsuranceUSD?: unknown;
}): SourcePricingBasis {
  const incoterm = extractIncoterm(input.quoteMode || input.deliveryTerms, 'FOB');
  const priceType = normalizePriceType(input.priceType, input.currency);
  const normalizedCurrency = normalizeCurrencyByPriceType(priceType, input.currency);
  const taxSettings = input.taxSettings || {};
  const freight = Number(input.sourceFreightUSD);
  const insurance = Number(input.sourceInsuranceUSD);

  return {
    unitPrice: Number(input.unitPrice) || 0,
    currency: normalizedCurrency,
    priceType,
    incoterm,
    incotermLocation: extractIncotermLocation(input.deliveryTerms),
    quoteMode: input.quoteMode ? String(input.quoteMode) : null,
    sourceDocumentNo: input.sourceDocumentNo ? String(input.sourceDocumentNo) : null,
    supplierQuotationNo: input.supplierQuotationNo ? String(input.supplierQuotationNo) : null,
    exchangeRate: Number(taxSettings.usdRate) || null,
    vatRate: Number(taxSettings.vatRate) || null,
    exportRebateRate: Number(taxSettings.exportRebateRate) || null,
    hasExportRebate: typeof taxSettings.hasExportRebate === 'boolean' ? taxSettings.hasExportRebate : null,
    includesDomesticFees: incoterm !== 'EXW',
    includesFreight: incoterm === 'CFR' || incoterm === 'CIF',
    includesInsurance: incoterm === 'CIF',
    sourceFreightUSD: Number.isFinite(freight) ? freight : null,
    sourceInsuranceUSD: Number.isFinite(insurance) ? insurance : null,
  };
}
