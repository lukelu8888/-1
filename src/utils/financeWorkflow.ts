import { canonicalizePersonnelEmail, getPersonnelEmailAliases } from '../lib/personnelEmail';

export const FINANCE_CANONICAL_EMAIL = 'finance@cosunchina.com';

export function getFinanceNotificationRecipients() {
  const canonical = canonicalizePersonnelEmail(FINANCE_CANONICAL_EMAIL) || FINANCE_CANONICAL_EMAIL;
  return Array.from(
    new Set([
      canonical,
      ...getPersonnelEmailAliases(canonical),
      'finance@cosun.com',
      'finance@gaoshengda.com',
    ].map((email) => String(email || '').trim().toLowerCase()).filter(Boolean)),
  );
}

export function buildScArNotes(input: {
  contractNumber: string;
  quotationNumber?: string | null;
  contractStatus: string;
  extraNotes?: string | null;
}) {
  const parts = [
    `SC Status: ${input.contractStatus}`,
    `Contract: ${input.contractNumber}`,
    `Quotation: ${input.quotationNumber || 'N/A'}`,
  ];
  if (input.extraNotes) {
    parts.push(input.extraNotes);
  }
  return parts.join(' | ');
}
