import { canonicalizePersonnelEmail } from '../personnelEmail'

const LEGACY_INTERNAL_PLACEHOLDER_EMAILS = [
  'sales@cosun.com',
  'sales@cosunchina.com',
]

const normalizeText = (value: unknown) => String(value || '').trim()

const ALLOWED_INTERNAL_ROLE_CODES = new Set([
  'CEO',
  'CFO',
  'Sales_Director',
  'Regional_Manager',
  'Sales_Manager',
  'Sales_Rep',
  'Sales_Assistant',
  'Order_Coordinator',
  'Finance',
  'External_Accountant',
  'Procurement_Manager',
  'Procurement',
  'Documentation_Officer',
  'Marketing_Ops',
  'Marketing_Assistant',
  'QC',
  'Warehouse_Ops',
  'HR_Admin',
  'Admin_Ops',
  'Admin',
])

export function normalizeAdminRosterContacts<T extends Record<string, any>>(contacts: T[] | undefined): T[] {
  if (!Array.isArray(contacts)) return []
  return contacts.map((contact) => {
    const normalizedEmail = canonicalizePersonnelEmail(contact?.email)
    return {
      ...contact,
      email: normalizedEmail || normalizeText(contact?.email),
      name: normalizeText(contact?.name),
      department: normalizeText(contact?.department),
      title: normalizeText(contact?.title),
      employeeNo: normalizeText(contact?.employeeNo),
    }
  })
}

export function normalizeAdminRosterAccounts<T extends Record<string, any>>(accounts: T[] | undefined): T[] {
  if (!Array.isArray(accounts)) return []
  return accounts.map((account) => {
    const normalizedEmail = canonicalizePersonnelEmail(account?.loginEmail, account?.region)
    return {
      ...account,
      loginEmail: normalizedEmail || normalizeText(account?.loginEmail),
      role: normalizeText(account?.role),
      region: normalizeText(account?.region),
      username: normalizeText(account?.username),
      employeeId: normalizeText(account?.employeeId),
      authUserId: normalizeText(account?.authUserId),
    }
  })
}

export function validateAdminRoster(
  contacts: Array<Record<string, any>> | undefined,
  accounts: Array<Record<string, any>> | undefined,
): string[] {
  const normalizedContacts = normalizeAdminRosterContacts(contacts)
  const normalizedAccounts = normalizeAdminRosterAccounts(accounts)
  const errors: string[] = []

  const contactEmailMap = new Map<string, string>()
  normalizedContacts.forEach((contact) => {
    const email = String(contact.email || '').toLowerCase()
    if (!email) return
    if (contactEmailMap.has(email)) {
      errors.push(`Duplicate internal contact email: ${email}`)
      return
    }
    contactEmailMap.set(email, String(contact.id || ''))
  })

  const accountEmailMap = new Map<string, string>()
  normalizedAccounts.forEach((account) => {
    const email = String(account.loginEmail || '').toLowerCase()
    const role = String(account.role || '')
    if (!email) {
      errors.push(`Internal account "${String(account.username || account.id || 'unknown')}" is missing login email`)
      return
    }
    if (accountEmailMap.has(email)) {
      errors.push(`Duplicate internal account email: ${email}`)
    } else {
      accountEmailMap.set(email, String(account.id || ''))
    }
    if (!ALLOWED_INTERNAL_ROLE_CODES.has(role)) {
      errors.push(`Invalid internal account role "${role}" for ${email}`)
    }

    const employeeId = String(account.employeeId || '').trim()
    const linkedByEmployeeId = employeeId
      ? normalizedContacts.some((contact) => String(contact.id || '') === employeeId)
      : false
    const linkedByEmail = contactEmailMap.has(email)
    if (!linkedByEmployeeId && !linkedByEmail) {
      errors.push(`Internal account ${email} is not linked to any internal contact`)
    }
  })

  if (hasLegacyAdminRosterArtifacts(normalizedContacts, normalizedAccounts)) {
    errors.push('Legacy internal roster artifacts detected')
  }

  return Array.from(new Set(errors))
}

export function hasLegacyAdminRosterArtifacts(
  contacts: Array<Record<string, any>> | undefined,
  accounts: Array<Record<string, any>> | undefined,
  requiredEmails: string[] = [],
): boolean {
  const normalizedContacts = normalizeAdminRosterContacts(contacts)
  const normalizedAccounts = normalizeAdminRosterAccounts(accounts)

  if (
    normalizedContacts.some((contact) => {
      const email = String(contact.email || '').toLowerCase()
      const title = String(contact.title || '').toLowerCase()
      const department = String(contact.department || '').toLowerCase()
      return (
        LEGACY_INTERNAL_PLACEHOLDER_EMAILS.includes(email) ||
        title === 'standard_user' ||
        department === 'standard_user'
      )
    })
  ) {
    return true
  }

  if (
    normalizedAccounts.some((account) => {
      const email = String(account.loginEmail || '').toLowerCase()
      const role = String(account.role || '').toLowerCase()
      return LEGACY_INTERNAL_PLACEHOLDER_EMAILS.includes(email) || role === 'standard_user'
    })
  ) {
    return true
  }

  if (requiredEmails.length === 0) return false

  const contactEmails = new Set(
    normalizedContacts
      .map((contact) => canonicalizePersonnelEmail(contact.email))
      .filter(Boolean),
  )

  return requiredEmails.some((email) => !contactEmails.has(canonicalizePersonnelEmail(email)))
}
