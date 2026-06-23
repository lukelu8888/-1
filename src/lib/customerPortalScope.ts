import { isActiveCustomerContractStatus } from './customerPortalContractStatus';

export function normalizeCustomerPortalEmail(value?: string | null): string {
  return String(value || '').trim().toLowerCase();
}

export function isValidCustomerPortalEmail(value?: string | null): boolean {
  const email = normalizeCustomerPortalEmail(value);
  return Boolean(email) && email !== 'n/a' && email.includes('@');
}

export function matchesCustomerPortalEmail(
  recordEmail: string | null | undefined,
  customerEmail: string | null | undefined,
  options?: { treatInvalidRecordEmailAsMatch?: boolean },
): boolean {
  const normalizedCustomerEmail = normalizeCustomerPortalEmail(customerEmail);
  if (!normalizedCustomerEmail) return true;

  const normalizedRecordEmail = normalizeCustomerPortalEmail(recordEmail);
  if (!isValidCustomerPortalEmail(normalizedRecordEmail)) {
    return options?.treatInvalidRecordEmailAsMatch !== false;
  }

  return normalizedRecordEmail === normalizedCustomerEmail;
}

export function buildCustomerPortalEmailScope(options: {
  customerEmail?: string | null;
  enterpriseMembers?: Array<{
    loginEmail?: string | null;
    businessEmail?: string | null;
  }>;
  organization?: {
    email?: string | null;
    companyName?: string | null;
  } | null;
  extraEmails?: Array<string | null | undefined>;
}): {
  normalizedCustomerEmail: string;
  relatedEmails: string[];
  relatedCompanies: string[];
} {
  const relatedEmails = new Set<string>();
  const relatedCompanies = new Set<string>();

  const normalizedCustomerEmail = normalizeCustomerPortalEmail(options.customerEmail);
  if (normalizedCustomerEmail) relatedEmails.add(normalizedCustomerEmail);

  (options.enterpriseMembers || []).forEach((member) => {
    const loginEmail = normalizeCustomerPortalEmail(member?.loginEmail);
    const businessEmail = normalizeCustomerPortalEmail(member?.businessEmail);
    if (loginEmail) relatedEmails.add(loginEmail);
    if (businessEmail) relatedEmails.add(businessEmail);
  });

  (options.extraEmails || []).forEach((email) => {
    const normalizedEmail = normalizeCustomerPortalEmail(email);
    if (normalizedEmail) relatedEmails.add(normalizedEmail);
  });

  if (options.organization) {
    const orgEmail = normalizeCustomerPortalEmail(options.organization.email);
    const orgCompany = String(options.organization.companyName || '').trim().toLowerCase();
    if (orgEmail) relatedEmails.add(orgEmail);
    if (orgCompany) relatedCompanies.add(orgCompany);
  }

  return {
    normalizedCustomerEmail,
    relatedEmails: Array.from(relatedEmails),
    relatedCompanies: Array.from(relatedCompanies),
  };
}

export function buildCustomerContractTombstoneMarkers(contract: any): string[] {
  return [contract?.id, contract?.contractNumber]
    .map((marker) => String(marker || '').trim())
    .filter(Boolean);
}

export function buildCustomerOrderTombstoneMarkers(order: any): string[] {
  return [order?.id, order?.orderNumber, order?.quotationNumber, order?.contractNumber]
    .map((marker) => String(marker || '').trim())
    .filter(Boolean);
}

export function buildCustomerQuotationTombstoneMarkers(quotation: any): string[] {
  return [quotation?.id, quotation?.qtNumber, quotation?.quotationNumber]
    .map((marker) => String(marker || '').trim())
    .filter(Boolean);
}

export function isVisibleCustomerContract(contract: any, customerEmail?: string | null): boolean {
  return isActiveCustomerContractStatus(contract) && matchesCustomerPortalEmail(
    contract?.customerEmail || contract?.customer_email,
    customerEmail,
  );
}
