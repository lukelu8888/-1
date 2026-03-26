import { staffDirectoryService } from '../lib/supabaseService';
import { getPersonnelEmailAliases } from '../lib/personnelEmail';
import { normalizePersonnelEmail } from '../lib/notification-rules';

const SYSTEM_OWNER_EMAILS = new Set<string>([
  ...getPersonnelEmailAliases('admin@cosun.com'),
  ...getPersonnelEmailAliases('admin@cosunchina.com'),
  ...getPersonnelEmailAliases('system@cosun.com'),
  ...getPersonnelEmailAliases('system@cosunchina.com'),
  'admin@cosun.com',
  'admin@cosunchina.com',
  'system@cosun.com',
  'system@cosunchina.com',
]);

export const isSystemOwnerEmail = (email?: string | null, region?: string | null): boolean => {
  const normalized = normalizePersonnelEmail(email, region);
  if (!normalized) return false;
  return SYSTEM_OWNER_EMAILS.has(normalized);
};

export const pickBusinessOwnerEmail = (
  candidates: unknown[],
  region?: string | null,
  fallbackEmail?: string | null,
): string => {
  const normalizedCandidates = candidates
    .map((value) => normalizePersonnelEmail(String(value || '').trim(), region))
    .filter(Boolean);

  const resolved = normalizedCandidates.find((email) => !isSystemOwnerEmail(email, region));
  if (resolved) return resolved;

  const normalizedFallback = normalizePersonnelEmail(fallbackEmail, region);
  if (normalizedFallback && !isSystemOwnerEmail(normalizedFallback, region)) {
    return normalizedFallback;
  }

  return normalizedCandidates[0] || normalizedFallback || '';
};

export const resolveOwnerName = (
  ownerEmail: string,
  nameCandidates: unknown[],
  region?: string | null,
  fallbackName?: string | null,
): string => {
  const matchedStaff = staffDirectoryService.getCachedSalesStaff().find(
    (staff) =>
      String(staff.email || '').trim().toLowerCase() ===
      String(ownerEmail || '').trim().toLowerCase(),
  );

  return (
    nameCandidates
      .map((value) => String(value || '').trim())
      .filter(Boolean)[0] ||
    matchedStaff?.name ||
    String(fallbackName || '').trim()
  );
};

export const resolveInquirySalesOwner = (
  inquiry: any,
  currentUser?: { email?: string | null; name?: string | null } | null,
) => {
  const ownerEmail = pickBusinessOwnerEmail(
    [
      inquiry?.salesRepEmail,
      inquiry?.assignedTo,
    ],
    inquiry?.region,
    currentUser?.email || '',
  );

  return {
    email: ownerEmail,
    name: resolveOwnerName(
      ownerEmail,
      [
        inquiry?.salesRepName,
        ownerEmail === normalizePersonnelEmail(currentUser?.email, inquiry?.region) ? currentUser?.name : '',
      ],
      inquiry?.region,
      currentUser?.name || '',
    ),
  };
};

export const resolveQuoteRequirementOwner = (
  qr: any,
  inquiries: any[] = [],
  currentUser?: { email?: string | null; name?: string | null } | null,
) => {
  const relatedInquiry = Array.isArray(inquiries)
    ? inquiries.find((inquiry) =>
        [
          inquiry?.id,
          inquiry?.inquiryNumber,
        ]
          .map((value) => String(value || '').trim())
          .filter(Boolean)
          .includes(String(qr?.sourceInquiryId || qr?.sourceInquiryNumber || '').trim()),
      ) || inquiries.find((inquiry) =>
        String(inquiry?.inquiryNumber || inquiry?.id || '').trim() ===
        String(qr?.sourceInquiryNumber || qr?.sourceInquiryId || '').trim(),
      )
    : null;
  const region = qr?.region || relatedInquiry?.region;
  const fallbackEmail = normalizePersonnelEmail(currentUser?.email, region) || currentUser?.email || '';
  const ownerEmail = pickBusinessOwnerEmail(
    [
      qr?.requestedBy,
      qr?.salesPerson,
      qr?.salesPersonEmail,
      relatedInquiry?.salesRepEmail,
      relatedInquiry?.assignedTo,
      qr?.createdBy,
    ],
    region,
    fallbackEmail,
  );

  return {
    email: ownerEmail,
    name: resolveOwnerName(
      ownerEmail,
      [
        qr?.requestedByName,
        qr?.salesPersonName,
        relatedInquiry?.salesRepName,
        ownerEmail === fallbackEmail ? currentUser?.name : '',
      ],
      region,
      currentUser?.name || '',
    ),
  };
};

export const matchesBusinessOwnerEmail = (
  ownerEmail?: string | null,
  currentEmail?: string | null,
  region?: string | null,
  ownerUserId?: string | null,
  currentUserId?: string | null,
): boolean => {
  const normalizedOwnerId = String(ownerUserId || '').trim();
  const normalizedCurrentUserId = String(currentUserId || '').trim();
  if (normalizedOwnerId && normalizedCurrentUserId && normalizedOwnerId === normalizedCurrentUserId) {
    return true;
  }
  const normalizedOwner = normalizePersonnelEmail(ownerEmail, region);
  const normalizedCurrent = normalizePersonnelEmail(currentEmail, region);
  return Boolean(normalizedOwner) && Boolean(normalizedCurrent) && normalizedOwner === normalizedCurrent;
};

export const assertBusinessOwnerEmail = (
  ownerEmail?: string | null,
  region?: string | null,
  documentLabel = '业务单据',
): string => {
  const normalizedOwner = normalizePersonnelEmail(ownerEmail, region);
  if (!normalizedOwner) {
    throw new Error(`${documentLabel} 缺少业务归属人，已阻止写入`);
  }
  if (isSystemOwnerEmail(normalizedOwner, region)) {
    throw new Error(`${documentLabel} 归属人不能是系统账号：${normalizedOwner}`);
  }
  return normalizedOwner;
};
