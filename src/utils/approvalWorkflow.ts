export interface StructuredApprovalDraft {
  pricingStrategy: string;
  customerBackground: string;
  specialConsiderations: string;
  riskFocus: string;
}

export const APPROVAL_NOTE_SECTIONS = [
  { key: 'pricing', title: '报价策略', hints: ['报价策略', '定价逻辑', '竞争对手'] },
  { key: 'customer', title: '客户背景', hints: ['客户背景', '订单潜力', '合作意向'] },
  { key: 'special', title: '特殊考虑', hints: ['特殊考虑', '交期紧急', '数量大', '首单'] },
  { key: 'risk', title: '风险点', hints: ['风险点', '上级关注', '风险'] },
] as const;

export type ApprovalDecisionMode =
  | 'release'
  | 'conditional_release'
  | 'escalate'
  | 'return_for_update';

export const APPROVAL_DECISION_LABELS: Record<ApprovalDecisionMode, string> = {
  release: '直接放行',
  conditional_release: '附条件放行',
  escalate: '上提总监',
  return_for_update: '退回补充',
};

export const buildStructuredApprovalNotes = (draft: StructuredApprovalDraft) =>
  [
    `1. 报价策略：${draft.pricingStrategy.trim() || '未填写'}`,
    `2. 客户背景：${draft.customerBackground.trim() || '未填写'}`,
    `3. 特殊考虑：${draft.specialConsiderations.trim() || '未填写'}`,
    `4. 风险点：${draft.riskFocus.trim() || '未填写'}`,
  ].join('\n');

export const parseApprovalNoteSections = (note: string) => {
  const normalized = String(note || '').replace(/\r/g, '').trim();
  if (!normalized) {
    return APPROVAL_NOTE_SECTIONS.map((section) => ({ ...section, content: '' }));
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = APPROVAL_NOTE_SECTIONS.map((section) => ({ ...section, content: '' }));
  let currentSectionIndex = -1;

  const matchSectionIndex = (line: string) => {
    const cleaned = line.replace(/^[\d一二三四五六七八九十]+[、.．)\s-]*/, '').trim();
    return sections.findIndex((section) => section.hints.some((hint) => cleaned.includes(hint)));
  };

  for (const line of lines) {
    const matchedIndex = matchSectionIndex(line);
    if (matchedIndex >= 0) {
      currentSectionIndex = matchedIndex;
      const cleaned = line.replace(/^[\d一二三四五六七八九十]+[、.．)\s-]*/, '').trim();
      const sectionTitle = sections[matchedIndex].hints.find((hint) => cleaned.startsWith(hint));
      const content = sectionTitle
        ? cleaned.slice(sectionTitle.length).replace(/^[:：\s-]+/, '').trim()
        : '';
      if (content) {
        sections[matchedIndex].content = content;
      }
      continue;
    }

    if (currentSectionIndex >= 0) {
      sections[currentSectionIndex].content = [sections[currentSectionIndex].content, line]
        .filter(Boolean)
        .join('\n');
    }
  }

  const unassigned = lines.filter((line) => matchSectionIndex(line) < 0);
  const hasStructuredContent = sections.some((section) => section.content);
  if (!hasStructuredContent && unassigned.length > 0) {
    sections[0].content = unassigned.join('\n');
  }

  return sections;
};

export const normalizeApprovalNotes = (
  note: string,
  fallback?: Partial<StructuredApprovalDraft>,
) => {
  const sections = parseApprovalNoteSections(note);
  const hasStructuredContent = sections.some((section) => section.content.trim());
  if (hasStructuredContent) {
    return buildStructuredApprovalNotes({
      pricingStrategy: sections[0]?.content || fallback?.pricingStrategy || '',
      customerBackground: sections[1]?.content || fallback?.customerBackground || '',
      specialConsiderations: sections[2]?.content || fallback?.specialConsiderations || '',
      riskFocus: sections[3]?.content || fallback?.riskFocus || '',
    });
  }

  const raw = String(note || '').trim();
  return buildStructuredApprovalNotes({
    pricingStrategy: raw || fallback?.pricingStrategy || '',
    customerBackground: fallback?.customerBackground || '',
    specialConsiderations: fallback?.specialConsiderations || '',
    riskFocus: fallback?.riskFocus || '',
  });
};

export const formatApprovalDecisionComment = (
  decisionMode: ApprovalDecisionMode,
  comment: string,
  conditionText: string,
) => {
  const normalizedComment = String(comment || '').trim();
  const normalizedCondition = String(conditionText || '').trim();
  const parts = [`[${APPROVAL_DECISION_LABELS[decisionMode]}]`];
  if (decisionMode === 'conditional_release' && normalizedCondition) {
    parts.push(`条件：${normalizedCondition}`);
  }
  if (normalizedComment) {
    parts.push(normalizedComment);
  }
  return parts.join('\n');
};

export const parseApprovalDecisionComment = (comment: string) => {
  const normalized = String(comment || '').trim();
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);
  const header = lines[0] || '';
  const conditionLine = lines.find((line) => line.startsWith('条件：')) || '';
  const labelMatch = header.match(/^\[(.+?)\]$/);
  const label = labelMatch?.[1] || '';
  const body = lines
    .filter((line, index) => index !== 0 && line !== conditionLine)
    .join('\n')
    .trim();

  return {
    label,
    condition: conditionLine.replace(/^条件：/, '').trim(),
    body,
    raw: normalized,
  };
};
