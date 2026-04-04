export type CustomerEnterpriseRole =
  | 'Owner'
  | 'Purchase Manager'
  | 'Purchaser'
  | 'Finance'
  | 'Viewer'

export type CustomerEnterpriseStatus = 'active' | 'invited' | 'suspended'

export type CustomerEnterprisePermissionKey =
  | 'manageEnterpriseProfile'
  | 'manageMembers'
  | 'createInquiries'
  | 'viewPrices'
  | 'placeOrders'
  | 'managePurchaseRequests'
  | 'viewFinanceDocs'
  | 'uploadPaymentProof'
  | 'viewBillingDetails'
  | 'readOnlyAccess'

export const CUSTOMER_ENTERPRISE_ROLES: CustomerEnterpriseRole[] = [
  'Owner',
  'Purchase Manager',
  'Purchaser',
  'Finance',
  'Viewer',
]

export const CUSTOMER_ENTERPRISE_ROLE_PERMISSION_KEYS: Record<
  CustomerEnterpriseRole,
  CustomerEnterprisePermissionKey[]
> = {
  Owner: [
    'manageEnterpriseProfile',
    'manageMembers',
    'createInquiries',
    'viewPrices',
    'placeOrders',
    'viewFinanceDocs',
  ],
  'Purchase Manager': [
    'createInquiries',
    'viewPrices',
    'placeOrders',
    'managePurchaseRequests',
  ],
  Purchaser: [
    'createInquiries',
    'viewPrices',
    'placeOrders',
  ],
  Finance: [
    'viewFinanceDocs',
    'uploadPaymentProof',
    'viewBillingDetails',
  ],
  Viewer: ['readOnlyAccess'],
}

export const CUSTOMER_ENTERPRISE_ROLE_TONES: Record<CustomerEnterpriseRole, string> = {
  Owner: 'bg-amber-50 text-amber-700 border-amber-200',
  'Purchase Manager': 'bg-violet-50 text-violet-700 border-violet-200',
  Purchaser: 'bg-blue-50 text-blue-700 border-blue-200',
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Viewer: 'bg-slate-100 text-slate-600 border-slate-200',
}

export const DEFAULT_CUSTOMER_ENTERPRISE_ROLE: CustomerEnterpriseRole = 'Purchaser'
export const DEFAULT_CUSTOMER_ENTERPRISE_STATUS: CustomerEnterpriseStatus = 'invited'

export function isCustomerEnterpriseRole(value: string): value is CustomerEnterpriseRole {
  return CUSTOMER_ENTERPRISE_ROLES.includes(value as CustomerEnterpriseRole)
}

export function normalizeCustomerEnterpriseRole(value?: string | null): CustomerEnterpriseRole {
  const normalized = String(value || '').trim()
  return isCustomerEnterpriseRole(normalized) ? normalized : DEFAULT_CUSTOMER_ENTERPRISE_ROLE
}

export function normalizeCustomerEnterpriseStatus(value?: string | null): CustomerEnterpriseStatus {
  const normalized = String(value || '').trim()
  if (normalized === 'active' || normalized === 'invited' || normalized === 'suspended') {
    return normalized
  }
  return DEFAULT_CUSTOMER_ENTERPRISE_STATUS
}
