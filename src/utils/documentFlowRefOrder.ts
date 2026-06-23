export const DOCUMENT_FLOW_REF_ORDER = ['ING', 'QR', 'XJ', 'BJ', 'QT', 'SC', 'PR', 'CG'] as const;

const DOCUMENT_FLOW_REF_RANK = DOCUMENT_FLOW_REF_ORDER.reduce<Record<string, number>>((acc, prefix, index) => {
  acc[prefix] = index;
  return acc;
}, {});

const normalizeDocumentRefPrefix = (value: string) => {
  const normalized = String(value || '').trim().toUpperCase();
  const match = normalized.match(/^([A-Z]{2,3})-/);
  return match?.[1] || '';
};

export const compareDocumentFlowRefs = (left: string, right: string) => {
  const leftPrefix = normalizeDocumentRefPrefix(left);
  const rightPrefix = normalizeDocumentRefPrefix(right);
  const leftRank = DOCUMENT_FLOW_REF_RANK[leftPrefix] ?? Number.MAX_SAFE_INTEGER;
  const rightRank = DOCUMENT_FLOW_REF_RANK[rightPrefix] ?? Number.MAX_SAFE_INTEGER;

  if (leftRank !== rightRank) return leftRank - rightRank;
  return String(left || '').localeCompare(String(right || ''), 'zh-CN');
};

export const sortDocumentFlowRefs = <T extends { value: string }>(refs: T[]) => {
  return [...refs].sort((left, right) => compareDocumentFlowRefs(left.value, right.value));
};
