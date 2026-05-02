import type { RegionCode, RegionDescriptor } from './types';

export const REGIONS: RegionDescriptor[] = [
  {
    code: 'NA',
    name: '北美',
    nameEn: 'North America',
    flag: '🇺🇸',
    currency: 'USD',
    defaultLocale: 'en-US',
  },
  {
    code: 'SA',
    name: '南美',
    nameEn: 'South America',
    flag: '🇧🇷',
    currency: 'USD',
    defaultLocale: 'es-419',
  },
  {
    code: 'EA',
    name: '欧非',
    nameEn: 'Europe & Africa',
    flag: '🇪🇺',
    currency: 'EUR',
    defaultLocale: 'en-GB',
  },
];

export function getRegion(code: RegionCode): RegionDescriptor {
  return REGIONS.find((r) => r.code === code) || REGIONS[0];
}

export function formatRegionMoney(code: RegionCode, value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const region = getRegion(code);
  try {
    return new Intl.NumberFormat(region.defaultLocale, {
      style: 'currency',
      currency: region.currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${region.currency} ${value.toFixed(2)}`;
  }
}
