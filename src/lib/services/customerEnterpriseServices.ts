import { supabase } from '../supabase'

function buildSupabaseError(context: string, error: any) {
  return new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error').trim()}`)
}

function extractMissingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the ['"]([^'"]+)['"] column/i)
  return match?.[1] || null
}

async function withSupabaseTimeout<T>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])
}

async function updateWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  applyFilters: (query: any) => any,
  context: string,
) {
  const payload: Record<string, any> = { ...row }
  const removedColumns: string[] = []

  for (let i = 0; i < 12; i++) {
    const { error } = await applyFilters(supabase.from(table).update(payload))
    if (!error) {
      return { error: null }
    }

    const missingColumn = extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      removedColumns.push(missingColumn)
      continue
    }

    return { error: buildSupabaseError(context, error) }
  }

  return { error: new Error(`${context} failed: exceeded schema fallback retry budget`) }
}

type CustomerEnterpriseMemberSupabaseRecord = {
  id?: string | null
  enterprise_auth_user_id?: string | null
  linked_auth_user_id?: string | null
  name?: string | null
  title?: string | null
  business_email?: string | null
  login_email?: string | null
  role?: string | null
  status?: string | null
  can_login?: boolean | null
  last_login_at?: string | null
  permissions?: any
}

type CustomerEnterpriseInvitationSupabaseRecord = {
  id?: string | null
  enterprise_auth_user_id?: string | null
  member_id?: string | null
  login_email?: string | null
  business_email?: string | null
  role?: string | null
  status?: string | null
  invite_token?: string | null
  invited_by_email?: string | null
  invite_url?: string | null
  expires_at?: string | null
  last_sent_at?: string | null
  accepted_at?: string | null
  linked_auth_user_id?: string | null
}

function mapCustomerEnterpriseMemberRow(row: CustomerEnterpriseMemberSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    enterpriseAuthUserId: row.enterprise_auth_user_id || '',
    linkedAuthUserId: row.linked_auth_user_id || null,
    name: row.name || '',
    title: row.title || '',
    businessEmail: row.business_email || '',
    loginEmail: row.login_email || '',
    role: row.role || 'Purchaser',
    status: row.status || 'invited',
    canLogin: row.can_login !== false,
    lastLogin: row.last_login_at || '',
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
  }
}

function mapCustomerEnterpriseInvitationRow(row: CustomerEnterpriseInvitationSupabaseRecord | null) {
  if (!row) return null
  return {
    id: row.id || '',
    enterpriseAuthUserId: row.enterprise_auth_user_id || '',
    memberId: row.member_id || '',
    loginEmail: row.login_email || '',
    businessEmail: row.business_email || '',
    role: row.role || 'Purchaser',
    status: row.status || 'pending',
    inviteToken: row.invite_token || '',
    invitedByEmail: row.invited_by_email || '',
    inviteUrl: row.invite_url || '',
    expiresAt: row.expires_at || null,
    lastSentAt: row.last_sent_at || null,
    acceptedAt: row.accepted_at || null,
    linkedAuthUserId: row.linked_auth_user_id || null,
  }
}

export const customerEnterpriseMemberService = {
  async listByEnterpriseAuthUser(enterpriseAuthUserId: string) {
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_members')
        .select(`
          id,
          enterprise_auth_user_id,
          linked_auth_user_id,
          name,
          title,
          business_email,
          login_email,
          role,
          status,
          can_login,
          last_login_at,
          permissions
        `)
        .eq('enterprise_auth_user_id', enterpriseAuthUserId)
        .order('created_at', { ascending: true }),
      12000,
      'list customer enterprise members timed out',
    )

    if (error) throw buildSupabaseError('list customer enterprise members', error)
    return (data || [])
      .map((row) => mapCustomerEnterpriseMemberRow(row as CustomerEnterpriseMemberSupabaseRecord | null))
      .filter(Boolean)
  },

  async replaceAllByEnterpriseAuthUser(
    enterpriseAuthUserId: string,
    members: Array<Record<string, any>>,
  ) {
    const normalizedEnterpriseAuthUserId = String(enterpriseAuthUserId || '').trim()
    if (!normalizedEnterpriseAuthUserId) {
      throw new Error('replace customer enterprise members failed: enterprise auth user id is required')
    }

    const normalizedMembers = members.map((member) => ({
      id: String(member.id || '').trim() || crypto.randomUUID(),
      enterprise_auth_user_id: normalizedEnterpriseAuthUserId,
      linked_auth_user_id: member.linkedAuthUserId || null,
      name: String(member.name || '').trim(),
      title: String(member.title || '').trim(),
      business_email: String(member.businessEmail || '').trim().toLowerCase(),
      login_email: String(member.loginEmail || '').trim().toLowerCase(),
      role: String(member.role || 'Purchaser').trim() || 'Purchaser',
      status: String(member.status || 'invited').trim() || 'invited',
      can_login: member.canLogin !== false,
      last_login_at: String(member.lastLogin || '').trim(),
      permissions: Array.isArray(member.permissions) ? member.permissions : [],
      updated_at: new Date().toISOString(),
    }))

    const { error: deleteError } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_members')
        .delete()
        .eq('enterprise_auth_user_id', normalizedEnterpriseAuthUserId),
      12000,
      'clear customer enterprise members timed out',
    )

    if (deleteError) throw buildSupabaseError('clear customer enterprise members', deleteError)

    if (normalizedMembers.length === 0) {
      return []
    }

    const { error: upsertError } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_members')
        .upsert(normalizedMembers, { onConflict: 'enterprise_auth_user_id,login_email' }),
      12000,
      'save customer enterprise members timed out',
    )

    if (upsertError) throw buildSupabaseError('save customer enterprise members', upsertError)
    return normalizedMembers.map((row) => mapCustomerEnterpriseMemberRow(row))
  },

  async resolveEnterpriseAuthUserIdForUser(authUserId: string, loginEmail?: string | null) {
    const normalizedAuthUserId = String(authUserId || '').trim()
    const normalizedLoginEmail = String(loginEmail || '').trim().toLowerCase()

    if (!normalizedAuthUserId && !normalizedLoginEmail) return null

    let query = supabase
      .from('customer_enterprise_members')
      .select('enterprise_auth_user_id, linked_auth_user_id, login_email')
      .limit(1)

    if (normalizedAuthUserId && normalizedLoginEmail) {
      query = query.or(
        `linked_auth_user_id.eq.${normalizedAuthUserId},login_email.eq.${normalizedLoginEmail}`,
      )
    } else if (normalizedAuthUserId) {
      query = query.eq('linked_auth_user_id', normalizedAuthUserId)
    } else {
      query = query.eq('login_email', normalizedLoginEmail)
    }

    const { data, error } = await withSupabaseTimeout(
      query.maybeSingle(),
      12000,
      'resolve customer enterprise auth user timed out',
    )

    if (error) throw buildSupabaseError('resolve customer enterprise auth user', error)
    return String((data as any)?.enterprise_auth_user_id || '').trim() || null
  },
}

export const customerEnterpriseInvitationService = {
  buildInviteUrl(inviteToken: string) {
    if (typeof window === 'undefined') return `#/register?invite=${encodeURIComponent(inviteToken)}`
    const url = new URL(window.location.href)
    url.hash = '/register'
    url.searchParams.set('invite', inviteToken)
    return url.toString()
  },

  async getPendingByMemberId(memberId: string) {
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_invitations')
        .select('*')
        .eq('member_id', memberId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      12000,
      'load customer enterprise invitation timed out',
    )

    if (error) throw buildSupabaseError('load customer enterprise invitation', error)
    return mapCustomerEnterpriseInvitationRow(data as CustomerEnterpriseInvitationSupabaseRecord | null)
  },

  async getByToken(inviteToken: string) {
    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_invitations')
        .select('*')
        .eq('invite_token', inviteToken)
        .maybeSingle(),
      12000,
      'load customer invitation by token timed out',
    )

    if (error) throw buildSupabaseError('load customer invitation by token', error)
    return mapCustomerEnterpriseInvitationRow(data as CustomerEnterpriseInvitationSupabaseRecord | null)
  },

  async createOrRefreshInvitation(input: {
    enterpriseAuthUserId: string
    memberId: string
    loginEmail: string
    businessEmail: string
    role: string
    invitedByEmail: string
  }) {
    const inviteToken = crypto.randomUUID()
    const inviteUrl = this.buildInviteUrl(inviteToken)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const payload = {
      enterprise_auth_user_id: input.enterpriseAuthUserId,
      member_id: input.memberId,
      login_email: String(input.loginEmail || '').trim().toLowerCase(),
      business_email: String(input.businessEmail || '').trim().toLowerCase(),
      role: input.role || 'Purchaser',
      status: 'pending',
      invite_token: inviteToken,
      invited_by_email: String(input.invitedByEmail || '').trim().toLowerCase(),
      invite_url: inviteUrl,
      expires_at: expiresAt,
      last_sent_at: now.toISOString(),
      accepted_at: null,
      linked_auth_user_id: null,
      updated_at: now.toISOString(),
    }

    const { error: cancelExistingError } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_invitations')
        .update({
          status: 'cancelled',
          updated_at: now.toISOString(),
        })
        .eq('member_id', input.memberId)
        .eq('status', 'pending'),
      12000,
      'cancel previous customer invitations timed out',
    )

    if (cancelExistingError) throw buildSupabaseError('cancel previous customer invitations', cancelExistingError)

    const { data, error } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_invitations')
        .insert(payload)
        .select('*')
        .single(),
      12000,
      'create customer invitation timed out',
    )

    if (error) throw buildSupabaseError('create customer invitation', error)
    return mapCustomerEnterpriseInvitationRow(data as CustomerEnterpriseInvitationSupabaseRecord | null)
  },

  async acceptInvitation(inviteToken: string, linkedAuthUserId: string) {
    const invitation = await this.getByToken(inviteToken)
    if (!invitation) {
      throw new Error('accept customer invitation failed: invitation not found')
    }
    if (invitation.status !== 'pending') {
      throw new Error('accept customer invitation failed: invitation is no longer pending')
    }
    if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() < Date.now()) {
      throw new Error('accept customer invitation failed: invitation has expired')
    }

    const acceptedAt = new Date().toISOString()
    const { error: invitationError } = await withSupabaseTimeout(
      supabase
        .from('customer_enterprise_invitations')
        .update({
          status: 'accepted',
          accepted_at: acceptedAt,
          linked_auth_user_id: linkedAuthUserId,
          updated_at: acceptedAt,
        })
        .eq('invite_token', inviteToken),
      12000,
      'accept customer invitation timed out',
    )

    if (invitationError) throw buildSupabaseError('accept customer invitation', invitationError)

    const { error: memberError } = await updateWithSchemaFallback(
      'customer_enterprise_members',
      {
        status: 'active',
        linked_auth_user_id: linkedAuthUserId,
        can_login: true,
        last_login_at: acceptedAt,
        updated_at: acceptedAt,
      },
      (query) => query.eq('id', invitation.memberId),
      'activate customer enterprise member',
    )

    if (memberError) throw memberError
    return {
      ...invitation,
      status: 'accepted',
      acceptedAt,
      linkedAuthUserId,
    }
  },
}
