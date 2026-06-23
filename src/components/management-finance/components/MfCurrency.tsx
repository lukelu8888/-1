import type { CurrencyCode } from '../types';

const SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  HKD: 'HK$',
};

export const currencySymbol = (c: CurrencyCode | string | undefined): string =>
  c ? (SYMBOLS[c.toUpperCase()] ?? c) : '';

export const formatMoney = (
  amount: number | null | undefined,
  currency: CurrencyCode | string = 'CNY',
  options: { decimals?: number; compact?: boolean } = {},
): string => {
  if (amount == null || Number.isNaN(amount)) return '—';
  const { decimals = 2, compact = false } = options;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  if (compact) {
    if (abs >= 100_000_000) return `${sign}${currencySymbol(currency)}${(abs / 100_000_000).toFixed(2)}亿`;
    if (abs >= 10_000) return `${sign}${currencySymbol(currency)}${(abs / 10_000).toFixed(2)}万`;
  }
  return `${sign}${currencySymbol(currency)}${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const formatPercent = (
  pct: number | null | undefined,
  decimals = 1,
): string => {
  if (pct == null || Number.isNaN(pct)) return '—';
  return `${(pct * 100).toFixed(decimals)}%`;
};
