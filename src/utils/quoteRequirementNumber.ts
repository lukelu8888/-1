export const normalizeLegacyQrNumber = (value?: string | null) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/^PR-/i, 'QR-');
};

export const getQrNumberAliases = (value?: string | null, fallbackRegion?: string | null) => {
  const normalized = normalizeLegacyQrNumber(value).toUpperCase();
  if (!normalized) return [];

  const aliases = new Set<string>([normalized]);
  const region = String(fallbackRegion || '').trim().toUpperCase();
  const match = normalized.match(/^QR-(?:(NA|SA|EA)-)?(\d{6})-(\d{4})$/);
  if (match) {
    const [, embeddedRegion, datePart, sequencePart] = match;
    aliases.add(`QR-${datePart}-${sequencePart}`);
    if (embeddedRegion) {
      aliases.add(`QR-${embeddedRegion}-${datePart}-${sequencePart}`);
    } else if (region) {
      aliases.add(`QR-${region}-${datePart}-${sequencePart}`);
    }
  }

  return Array.from(aliases);
};

export const isQrLikeNumber = (value?: string | null) => {
  const normalized = normalizeLegacyQrNumber(value).toUpperCase();
  return normalized.startsWith('QR-');
};

export const matchesNormalizedQrNumber = (
  left?: string | null,
  right?: string | null,
  leftRegion?: string | null,
  rightRegion?: string | null,
) => {
  const leftAliases = new Set(getQrNumberAliases(left, leftRegion));
  const rightAliases = getQrNumberAliases(right, rightRegion);
  return rightAliases.some((alias) => leftAliases.has(alias));
};
