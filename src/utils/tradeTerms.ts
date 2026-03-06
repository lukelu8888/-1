export const TRADE_TERMS_PRESETS = [
  'EXW（不含13%增值税，工厂交货）',
  'EXW（含13%增值税，工厂交货）',
  'FOB 厦门港（不含13%增值税）',
  'FOB 厦门港（含13%增值税）',
  'CFR 目的港（不含13%增值税）',
  'CIF 目的港（不含13%增值税，含海运保险）',
  'DDP 客户指定地（含税含运）',
  '自定义...',
];

export function resolveInitialTradeTerms(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    if (value) return value;
  }
  return 'EXW（不含13%增值税，工厂交货）';
}

export function isPresetTradeTerm(value: string): boolean {
  return TRADE_TERMS_PRESETS.includes(value);
}
