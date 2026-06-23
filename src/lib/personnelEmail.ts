const PERSONNEL_EMAIL_CANONICAL_MAP: Record<string, string> = {
  'admin@cosun.com': 'admin@cosunchina.com',
  'ceo@cosun.com': 'ceo@cosunchina.com',
  'finance@cosun.com': 'finance@cosunchina.com',
  'finance@gaoshengda.com': 'finance@cosunchina.com',
  'finance@cosunchina.com': 'finance@cosunchina.com',
  'john.smith@cosun.com': 'salesmanager-na@cosunchina.com',
  'carlos.silva@cosun.com': 'salesmanager-sa@cosunchina.com',
  'hans.mueller@cosun.com': 'salesmanager-ea@cosunchina.com',
  'maria.garcia@cosun.com': 'sales01-na@cosunchina.com',
  'maria@cosun.com': 'sales01-na@cosunchina.com',
  'zhangwei@cosun.com': 'sales01-na@cosunchina.com',
  'ana.santos@cosun.com': 'sales01-sa@cosunchina.com',
  'lifang@cosun.com': 'sales01-sa@cosunchina.com',
  'emma.thompson@cosun.com': 'sales02-ea@cosunchina.com',
  'wangfang@cosun.com': 'sales02-ea@cosunchina.com',
  'salesmanager-na@cosunchina.com': 'salesmanager-na@cosunchina.com',
  'salesmanager-sa@cosunchina.com': 'salesmanager-sa@cosunchina.com',
  'salesmanager-ea@cosunchina.com': 'salesmanager-ea@cosunchina.com',
  'sales.director@cosunchina.com': 'sales.director@cosunchina.com',
  'sales01-na@cosunchina.com': 'sales01-na@cosunchina.com',
  'sales01-sa@cosunchina.com': 'sales01-sa@cosunchina.com',
  'sales02-ea@cosunchina.com': 'sales02-ea@cosunchina.com',
};

const GSD_REGION_FALLBACK_MAP: Record<string, string> = {
  'north america': 'sales01-na@cosunchina.com',
  na: 'sales01-na@cosunchina.com',
  north_america: 'sales01-na@cosunchina.com',
  'north-america': 'sales01-na@cosunchina.com',
  '北美': 'sales01-na@cosunchina.com',
  'south america': 'sales01-sa@cosunchina.com',
  sa: 'sales01-sa@cosunchina.com',
  south_america: 'sales01-sa@cosunchina.com',
  'south-america': 'sales01-sa@cosunchina.com',
  '南美': 'sales01-sa@cosunchina.com',
  'europe & africa': 'sales02-ea@cosunchina.com',
  ea: 'sales02-ea@cosunchina.com',
  emea: 'sales02-ea@cosunchina.com',
  europe_africa: 'sales02-ea@cosunchina.com',
  'europe-africa': 'sales02-ea@cosunchina.com',
  '欧非': 'sales02-ea@cosunchina.com',
};

const GSD_EMAIL_CANONICAL_MAP: Record<string, string> = {
  'zhangwei@gsd.com': 'sales01-na@cosunchina.com',
  'wangjian@gsd.com': 'sales01-na@cosunchina.com',
  'liming@gsd.com': 'sales01-na@cosunchina.com',
  'lifang@gsd.com': 'sales01-sa@cosunchina.com',
  'chenlei@gsd.com': 'sales01-sa@cosunchina.com',
  'zhaoting@gsd.com': 'sales01-sa@cosunchina.com',
  'wangfang@gsd.com': 'sales02-ea@cosunchina.com',
  'zhaoyong@gsd.com': 'sales02-ea@cosunchina.com',
  'sunli@gsd.com': 'sales02-ea@cosunchina.com',
};

const buildAliasMap = () => {
  const aliasMap = new Map<string, Set<string>>();

  Object.entries(PERSONNEL_EMAIL_CANONICAL_MAP).forEach(([legacyEmail, canonicalEmail]) => {
    const normalizedLegacy = String(legacyEmail || '').trim().toLowerCase();
    const normalizedCanonical = String(canonicalEmail || '').trim().toLowerCase();
    if (!normalizedLegacy || !normalizedCanonical) return;
    const current = aliasMap.get(normalizedCanonical) || new Set<string>();
    current.add(normalizedCanonical);
    current.add(normalizedLegacy);
    aliasMap.set(normalizedCanonical, current);
  });

  Object.entries(GSD_EMAIL_CANONICAL_MAP).forEach(([legacyEmail, canonicalEmail]) => {
    const normalizedLegacy = String(legacyEmail || '').trim().toLowerCase();
    const normalizedCanonical = String(canonicalEmail || '').trim().toLowerCase();
    const current = aliasMap.get(normalizedCanonical) || new Set<string>();
    current.add(normalizedCanonical);
    current.add(normalizedLegacy);
    aliasMap.set(normalizedCanonical, current);
  });

  return aliasMap;
};

const PERSONNEL_EMAIL_ALIAS_MAP = buildAliasMap();

export const canonicalizePersonnelEmail = (email?: string | null, region?: string | null): string => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return '';

  if (PERSONNEL_EMAIL_CANONICAL_MAP[normalized]) {
    return PERSONNEL_EMAIL_CANONICAL_MAP[normalized];
  }

  if (normalized.endsWith('@gsd.com')) {
    if (GSD_EMAIL_CANONICAL_MAP[normalized]) {
      return GSD_EMAIL_CANONICAL_MAP[normalized];
    }
    const regionValue = String(region || '').trim().toLowerCase();
    return GSD_REGION_FALLBACK_MAP[regionValue] || normalized;
  }

  return normalized;
};

export const getPersonnelEmailAliases = (email?: string | null, region?: string | null): string[] => {
  const canonicalEmail = canonicalizePersonnelEmail(email, region);
  if (!canonicalEmail) return [];
  const aliases = PERSONNEL_EMAIL_ALIAS_MAP.get(canonicalEmail);
  return Array.from(aliases || new Set<string>([canonicalEmail]));
};
