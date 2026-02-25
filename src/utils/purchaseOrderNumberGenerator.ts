const CG_COUNTER_KEY = 'cg_document_counter_data_v1';
const CQ_COUNTER_KEY = 'cq_request_counter_data_v1';

type CounterData = {
  counters: Record<string, number>;
};

const REGION_CODE_MAP: Record<string, string> = {
  NA: 'NA',
  SA: 'SA',
  EA: 'EA',
  EMEA: 'EA',
  'NORTH AMERICA': 'NA',
  'SOUTH AMERICA': 'SA',
  'EUROPE & AFRICA': 'EA',
  'EUROPE AND AFRICA': 'EA',
  EUROPE: 'EA',
  AFRICA: 'EA',
};

const getDateYYMMDD = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

const getCounterData = (): CounterData => {
  try {
    const raw = localStorage.getItem(CG_COUNTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CounterData;
      if (parsed && typeof parsed === 'object' && parsed.counters) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('⚠️ [CG Number] failed to read counter data:', error);
  }
  return { counters: {} };
};

const saveCounterData = (data: CounterData) => {
  try {
    localStorage.setItem(CG_COUNTER_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('⚠️ [CG Number] failed to save counter data:', error);
  }
};

export const normalizeRegionCode = (region?: string | null): string => {
  if (!region) return 'NA';
  const key = String(region).trim().toUpperCase();
  return REGION_CODE_MAP[key] || 'NA';
};

export const generateCGNumber = (region?: string | null): string => {
  const regionCode = normalizeRegionCode(region);
  const data = getCounterData();
  const counterKey = `CG-${regionCode}`;
  const current = Number(data.counters[counterKey] || 0);
  const next = current + 1;
  data.counters[counterKey] = next;
  saveCounterData(data);
  return `CG-${regionCode}-${getDateYYMMDD()}-${String(next).padStart(4, '0')}`;
};

export const generateCQNumber = (): string => {
  const data = (() => {
    try {
      const raw = localStorage.getItem(CQ_COUNTER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CounterData;
        if (parsed && typeof parsed === 'object' && parsed.counters) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('⚠️ [CQ Number] failed to read counter data:', error);
    }
    return { counters: {} } as CounterData;
  })();

  const counterKey = 'CQ';
  const current = Number(data.counters[counterKey] || 0);
  const next = current + 1;
  data.counters[counterKey] = next;

  try {
    localStorage.setItem(CQ_COUNTER_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('⚠️ [CQ Number] failed to save counter data:', error);
  }

  return `CQ-${getDateYYMMDD()}-${String(next).padStart(4, '0')}`;
};

export const normalizeCGNumberForDisplay = (poNumber?: string | null): string => {
  if (!poNumber) return '';
  const raw = String(poNumber).trim();
  const match = raw.match(/^CG-([A-Za-z\s&]+)-(\d{6})-(\d{4})$/i);
  if (!match) return raw;
  const regionCode = normalizeRegionCode(match[1]);
  return `CG-${regionCode}-${match[2]}-${match[3]}`;
};
