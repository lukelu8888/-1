import { canonicalizePersonnelEmail, getPersonnelEmailAliases } from '../personnelEmail'
import { supabase } from '../supabase'

type ApprovalRecordDeps = {
  throwSupabaseError: (context: string, error: any) => never
  toUUID: (id: string | null | undefined) => string
  toUUIDOrNull: (id: string | null | undefined) => string | null
  toRegionCode: (region: string | null | undefined) => string | null
  upsertWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    onConflict: string,
    context: string,
  ) => Promise<{ data: any; error: Error | null }>
  extractMissingColumn: (error: any) => string | null
}

export function fromApprovalRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    type: r.type || r.record_type || r.entity_type || 'qt',
    relatedDocumentId: r.related_document_id || r.entity_number || r.reference_id || r.entity_id || '',
    relatedDocumentUuid: r.entity_id || null,
    relatedDocumentType: r.related_document_type || r.entity_type || '',
    relatedDocument: r.related_document || null,
    submittedBy: canonicalizePersonnelEmail(r.submitted_by || r.requested_by || r.actor_email || '', r.region),
    submittedByName: r.submitted_by_name || r.requested_by_name || '',
    submittedByRole: r.submitted_by_role || r.actor_role || '',
    submittedAt: r.submitted_at || r.created_at || '',
    region: r.region || '',
    currentApprover: canonicalizePersonnelEmail(r.current_approver || r.approver || '', r.region),
    currentApproverRole: r.current_approver_role || '',
    nextApprover: r.next_approver || null,
    nextApproverRole: r.next_approver_role || null,
    requiresDirectorApproval: r.requires_director_approval || false,
    status: r.status || r.status_after || 'pending',
    urgency: r.urgency || 'normal',
    amount: r.amount || 0,
    currency: r.currency || 'USD',
    customerName: r.customer_name || '',
    customerEmail: r.customer_email || '',
    productSummary: r.product_summary || r.description || r.notes || '',
    approvalHistory: r.approval_history || [],
    deadline: r.deadline || '',
    expiresIn: 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const APPROVAL_RECORD_SUMMARY_COLUMNS = [
  'id',
  'type',
  'related_document_id',
  'related_document_type',
  'submitted_by',
  'submitted_by_name',
  'submitted_by_role',
  'submitted_at',
  'region',
  'current_approver',
  'current_approver_role',
  'next_approver',
  'next_approver_role',
  'requires_director_approval',
  'status',
  'urgency',
  'amount',
  'currency',
  'customer_name',
  'customer_email',
  'product_summary',
  'approval_history',
  'deadline',
  'created_at',
  'updated_at',
].join(',')

const APPROVAL_SUMMARY_CACHE_TTL_MS = 30_000
const APPROVAL_SUMMARY_CACHE_ALL_KEY = '__all__'

type ApprovalSummaryCacheEntry = {
  data: any[]
  updatedAt: number
  promise?: Promise<any[]>
}

const approvalSummaryCache = new Map<string, ApprovalSummaryCacheEntry>()

const getFreshApprovalSummaryCache = (key: string) => {
  const cached = approvalSummaryCache.get(key)
  if (!cached?.data?.length) return null
  if (Date.now() - cached.updatedAt > APPROVAL_SUMMARY_CACHE_TTL_MS) return null
  return cached.data
}

const setApprovalSummaryCache = (key: string, data: any[]) => {
  approvalSummaryCache.set(key, {
    data,
    updatedAt: Date.now(),
  })
  return data
}

const loadApprovalSummaryCache = async (key: string, loader: () => Promise<any[]>) => {
  const cached = approvalSummaryCache.get(key)
  if (cached?.promise) return cached.promise

  const promise = loader()
    .then((data) => setApprovalSummaryCache(key, data || []))
    .finally(() => {
      const latest = approvalSummaryCache.get(key)
      if (latest?.promise) {
        approvalSummaryCache.set(key, {
          data: latest.data || [],
          updatedAt: latest.updatedAt || Date.now(),
        })
      }
    })

  approvalSummaryCache.set(key, {
    data: cached?.data || [],
    updatedAt: cached?.updatedAt || 0,
    promise,
  })

  return promise
}

export function createApprovalRecordService(deps: ApprovalRecordDeps) {
  return {
    async getAll() {
      const { data, error } = await supabase.from('approval_records').select('*').order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll approval_records', error)
      return (data || []).map(fromApprovalRow)
    },

    async getAllSummaries() {
      const { data, error } = await supabase
        .from('approval_records')
        .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
        .order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAllSummaries approval_records', error)
      return (data || []).map(fromApprovalRow)
    },

    readAllSummariesCache() {
      return getFreshApprovalSummaryCache(APPROVAL_SUMMARY_CACHE_ALL_KEY)
    },

    async getAllSummariesCached(options?: { force?: boolean }) {
      if (!options?.force) {
        const cached = getFreshApprovalSummaryCache(APPROVAL_SUMMARY_CACHE_ALL_KEY)
        if (cached) return cached
      }
      return loadApprovalSummaryCache(APPROVAL_SUMMARY_CACHE_ALL_KEY, async () => {
        const { data, error } = await supabase
          .from('approval_records')
          .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
          .order('created_at', { ascending: false })
        if (error) deps.throwSupabaseError('getAllSummaries approval_records', error)
        return (data || []).map(fromApprovalRow)
      })
    },

    async prefetchAllSummaries() {
      return this.getAllSummariesCached()
    },

    async getForApprover(email: string) {
      const aliases = getPersonnelEmailAliases(email)
      const canonicalEmail = canonicalizePersonnelEmail(email)
      const emailFilter = aliases.map((alias) => `current_approver.eq.${alias},submitted_by.eq.${alias},actor_email.eq.${alias}`).join(',')
      const { data, error } = await supabase
        .from('approval_records')
        .select('*')
        .or(emailFilter || `current_approver.eq.${canonicalEmail},submitted_by.eq.${canonicalEmail},actor_email.eq.${canonicalEmail}`)
        .order('created_at', { ascending: false })

      if (!error) return (data || []).map(fromApprovalRow)

      console.warn('[approvalRecordService] getForApprover new columns unavailable, using legacy fallback:', error.message)
      const legacyFilter = aliases.map((alias) => `approver.eq.${alias},requested_by.eq.${alias}`).join(',')
      const { data: legacyData, error: legacyError } = await supabase
        .from('approval_records')
        .select('*')
        .or(legacyFilter || `approver.eq.${canonicalEmail},requested_by.eq.${canonicalEmail}`)
        .order('created_at', { ascending: false })
      if (legacyError) deps.throwSupabaseError('getForApprover approval_records legacy', legacyError)
      return (legacyData || []).map(fromApprovalRow)
    },

    async getForApproverSummaries(email: string) {
      const aliases = getPersonnelEmailAliases(email)
      const canonicalEmail = canonicalizePersonnelEmail(email)
      const emailFilter = aliases.map((alias) => `current_approver.eq.${alias},submitted_by.eq.${alias},actor_email.eq.${alias}`).join(',')
      const { data, error } = await supabase
        .from('approval_records')
        .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
        .or(emailFilter || `current_approver.eq.${canonicalEmail},submitted_by.eq.${canonicalEmail},actor_email.eq.${canonicalEmail}`)
        .order('created_at', { ascending: false })

      if (!error) return (data || []).map(fromApprovalRow)

      console.warn('[approvalRecordService] getForApproverSummaries new columns unavailable, using legacy fallback:', error.message)
      const legacyFilter = aliases.map((alias) => `approver.eq.${alias},requested_by.eq.${alias}`).join(',')
      const { data: legacyData, error: legacyError } = await supabase
        .from('approval_records')
        .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
        .or(legacyFilter || `approver.eq.${canonicalEmail},requested_by.eq.${canonicalEmail}`)
        .order('created_at', { ascending: false })
      if (legacyError) deps.throwSupabaseError('getForApproverSummaries approval_records legacy', legacyError)
      return (legacyData || []).map(fromApprovalRow)
    },

    readForApproverSummariesCache(email: string) {
      return getFreshApprovalSummaryCache(canonicalizePersonnelEmail(email))
    },

    async getForApproverSummariesCached(email: string, options?: { force?: boolean }) {
      const cacheKey = canonicalizePersonnelEmail(email)
      if (!options?.force) {
        const cached = getFreshApprovalSummaryCache(cacheKey)
        if (cached) return cached
      }

      return loadApprovalSummaryCache(cacheKey, async () => {
        const aliases = getPersonnelEmailAliases(email)
        const canonicalEmail = canonicalizePersonnelEmail(email)
        const emailFilter = aliases.map((alias) => `current_approver.eq.${alias},submitted_by.eq.${alias},actor_email.eq.${alias}`).join(',')
        const { data, error } = await supabase
          .from('approval_records')
          .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
          .or(emailFilter || `current_approver.eq.${canonicalEmail},submitted_by.eq.${canonicalEmail},actor_email.eq.${canonicalEmail}`)
          .order('created_at', { ascending: false })

        if (!error) return (data || []).map(fromApprovalRow)

        console.warn('[approvalRecordService] getForApproverSummaries new columns unavailable, using legacy fallback:', error.message)
        const legacyFilter = aliases.map((alias) => `approver.eq.${alias},requested_by.eq.${alias}`).join(',')
        const { data: legacyData, error: legacyError } = await supabase
          .from('approval_records')
          .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
          .or(legacyFilter || `approver.eq.${canonicalEmail},requested_by.eq.${canonicalEmail}`)
          .order('created_at', { ascending: false })
        if (legacyError) deps.throwSupabaseError('getForApproverSummaries approval_records legacy', legacyError)
        return (legacyData || []).map(fromApprovalRow)
      })
    },

    async prefetchForApproverSummaries(email: string) {
      return this.getForApproverSummariesCached(email)
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('approval_records')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) deps.throwSupabaseError('getById approval_records', error)
      return fromApprovalRow(data)
    },

    async findLatestByDocumentAndStatuses(options: {
      type: string
      relatedDocumentId: string
      statuses: string[]
    }) {
      const normalizedType = String(options.type || '').trim()
      const normalizedDocumentId = String(options.relatedDocumentId || '').trim()
      const normalizedStatuses = Array.from(
        new Set(
          (options.statuses || [])
            .map((status) => String(status || '').trim())
            .filter(Boolean),
        ),
      )

      if (!normalizedType || !normalizedDocumentId || normalizedStatuses.length === 0) {
        return null
      }

      const { data, error } = await supabase
        .from('approval_records')
        .select(APPROVAL_RECORD_SUMMARY_COLUMNS)
        .eq('type', normalizedType)
        .eq('related_document_id', normalizedDocumentId)
        .in('status', normalizedStatuses)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) deps.throwSupabaseError('findLatestByDocumentAndStatuses approval_records', error)
      return fromApprovalRow((data || [])[0] || null)
    },

    async upsert(record: any) {
      const businessDocId = String(
        record.relatedDocumentNumber ||
        record.relatedDocumentNo ||
        record.relatedDocumentId ||
        record.related_document_id ||
        record.entity_number ||
        ''
      ).trim()
      const relatedDocument = record.relatedDocument || record.related_document || null
      const relatedDocumentUuid = deps.toUUIDOrNull(
        record.relatedDocumentUuid ||
        record.related_document_uuid ||
        record.entity_id ||
        relatedDocument?.id ||
        (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessDocId) ? businessDocId : null)
      )
      const submitter = canonicalizePersonnelEmail(record.submittedBy || record.submitted_by || '', record.region)
      const submitterRole = record.submittedByRole || record.submitted_by_role || ''
      const statusVal = record.status || 'pending'
      const approvalHistory = record.approvalHistory || record.approval_history || []
      const latestHistoryAction = Array.isArray(approvalHistory) && approvalHistory.length > 0
        ? String(approvalHistory[approvalHistory.length - 1]?.action || '').trim()
        : ''
      const legacyAction = latestHistoryAction || (
        statusVal === 'pending'
          ? 'submitted'
          : statusVal === 'cancelled'
            ? 'cancelled'
            : statusVal
      )

      const row = {
        id: deps.toUUID(record.id),
        type: record.type || 'qt',
        related_document_id: businessDocId || relatedDocumentUuid || '',
        related_document_type: record.relatedDocumentType || record.related_document_type || '',
        related_document: relatedDocument,
        submitted_by: submitter,
        submitted_by_name: record.submittedByName || record.submitted_by_name || '',
        submitted_by_role: submitterRole,
        submitted_at: record.submittedAt || record.submitted_at || new Date().toISOString(),
        region: deps.toRegionCode(record.region),
        current_approver: canonicalizePersonnelEmail(record.currentApprover || record.current_approver || '', record.region) || '',
        current_approver_role: record.currentApproverRole || record.current_approver_role || '',
        next_approver: record.nextApprover || record.next_approver || null,
        next_approver_role: record.nextApproverRole || record.next_approver_role || null,
        requires_director_approval: record.requiresDirectorApproval ?? record.requires_director_approval ?? false,
        status: statusVal,
        urgency: record.urgency || 'normal',
        amount: record.amount || 0,
        currency: record.currency || 'USD',
        customer_name: record.customerName || record.customer_name || '',
        customer_email: record.customerEmail || record.customer_email || '',
        product_summary: record.productSummary || record.product_summary || '',
        approval_history: approvalHistory,
        deadline: record.deadline || null,
        entity_type: record.type || 'qt',
        entity_id: relatedDocumentUuid,
        entity_number: businessDocId || relatedDocumentUuid || '',
        action: (['approved', 'rejected', 'forwarded', 'cancelled'].includes(legacyAction) ? legacyAction : null),
        actor_email: submitter,
        actor_role: submitterRole,
        status_before: record.previousStatus || null,
        status_after: statusVal,
        approver: canonicalizePersonnelEmail(record.currentApprover || record.current_approver || '', record.region) || '',
        requested_by: submitter,
        requested_by_name: record.submittedByName || record.submitted_by_name || '',
        record_type: record.type || 'qt',
        title: `${(record.type || 'QT').toUpperCase()} Approval: ${businessDocId || relatedDocumentUuid || ''}`.trim(),
        description: record.productSummary || record.product_summary || '',
        notes: record.productSummary || record.product_summary || '',
      }
      const { data, error } = await deps.upsertWithSchemaFallback(
        'approval_records',
        row,
        'id',
        'upsert approval_record',
      )
      if (error) deps.throwSupabaseError('upsert approval_record', error)
      return fromApprovalRow(data)
    },

    async updateStatus(id: string, status: string, history: any[]) {
      const { data, error } = await supabase
        .from('approval_records')
        .update({ status, approval_history: history, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (!error) return fromApprovalRow(data)
      const colMissing = deps.extractMissingColumn(error)
      if (colMissing === 'approval_history' || String(error?.code || '') === '42703') {
        console.warn('[approvalRecordService] updateStatus: approval_history column missing, falling back to status-only update')
        const { data: d2, error: e2 } = await supabase
          .from('approval_records')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single()
        if (e2) deps.throwSupabaseError('updateStatus approval_record (fallback)', e2)
        return fromApprovalRow(d2)
      }
      deps.throwSupabaseError('updateStatus approval_record', error)
    },

    subscribeToChanges(email: string, callback: (payload: any) => void) {
      return supabase
        .channel(`approval_records_${email}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_records' }, callback)
        .subscribe()
    },
  }
}
