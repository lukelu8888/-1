import { supabase } from '../supabase'

export const DEFAULT_TEMPLATE_BINDING_FLOW_CODE = 'inq_qr_xj_bj_qt_sc_cg'
export const templateBindingResolutionCache = new Map<string, any>()
export const documentTemplateDirectReadUnavailableKeys = new Set<string>()
export const TEMPLATE_CENTER_PUBLISH_EVENT = 'template-center:published'
export const TEMPLATE_DEFAULT_NODE_BINDINGS: Record<string, string[]> = {
  ing: ['ing-create'],
  qt: ['qt-create'],
  qr: ['qr-create'],
  xj: ['xj-create'],
  sc: ['sc-create'],
  cg: ['cg-create'],
  bj: ['bj-review'],
}

const DOCUMENT_TEMPLATE_CENTER_CONFIG: Record<string, {
  templateCode: string
  documentCode: string
  templateNameCn: string
  templateNameEn: string
  displayOrder: number
  businessStage: string
  description: string
  rendererComponent: string
}> = {
  ing: {
    templateCode: 'tpl_ing',
    documentCode: 'ING',
    templateNameCn: 'ING',
    templateNameEn: 'ING',
    displayOrder: 1,
    businessStage: 'source',
    description: '客户原始询价源头',
    rendererComponent: 'src/components/documents/templates/CustomerInquiryDocument.tsx',
  },
  qt: {
    templateCode: 'tpl_qt',
    documentCode: 'QT',
    templateNameCn: 'QT',
    templateNameEn: 'QT',
    displayOrder: 2,
    businessStage: 'sales-quotation',
    description: '业务员对客户报价',
    rendererComponent: 'src/components/documents/templates/QuotationDocument.tsx',
  },
  qr: {
    templateCode: 'tpl_qr',
    documentCode: 'QR',
    templateNameCn: 'QR',
    templateNameEn: 'QR',
    displayOrder: 3,
    businessStage: 'internal-cost-request',
    description: '业务员向采购员发起的报价请求',
    rendererComponent: 'src/components/documents/templates/QuoteRequirementDocument.tsx',
  },
  xj: {
    templateCode: 'tpl_xj',
    documentCode: 'XJ',
    templateNameCn: 'XJ',
    templateNameEn: 'XJ',
    displayOrder: 4,
    businessStage: 'supplier-inquiry',
    description: '采购员向供应商询价',
    rendererComponent: 'src/components/documents/templates/XJDocument.tsx',
  },
  bj: {
    templateCode: 'tpl_bj',
    documentCode: 'BJ',
    templateNameCn: 'BJ',
    templateNameEn: 'BJ',
    displayOrder: 5,
    businessStage: 'supplier-quotation',
    description: '供应商对采购询价的正式报价',
    rendererComponent: 'src/components/documents/templates/SupplierQuotationDocument.tsx',
  },
  pi: {
    templateCode: 'tpl_pi',
    documentCode: 'PI',
    templateNameCn: '形式发票',
    templateNameEn: 'Proforma Invoice',
    displayOrder: 6,
    businessStage: 'pre-invoice',
    description: '正式订单前的形式发票',
    rendererComponent: 'src/components/documents/templates/ProformaInvoiceDocument.tsx',
  },
  sc: {
    templateCode: 'tpl_sc',
    documentCode: 'SC',
    templateNameCn: 'SC',
    templateNameEn: 'SC',
    displayOrder: 7,
    businessStage: 'sales-contract',
    description: '客户成交合同',
    rendererComponent: 'src/components/documents/templates/SalesContractDocument.tsx',
  },
  pr: {
    templateCode: 'tpl_pr',
    documentCode: 'PR',
    templateNameCn: 'PR',
    templateNameEn: 'PR',
    displayOrder: 8,
    businessStage: 'procurement-request',
    description: '采购员基于销售合同做供应商拆分与采购分配',
    rendererComponent: 'src/components/documents/templates/QuoteRequirementDocument.tsx',
  },
  cg: {
    templateCode: 'tpl_cg',
    documentCode: 'CG',
    templateNameCn: 'CG',
    templateNameEn: 'CG',
    displayOrder: 9,
    businessStage: 'purchase-contract',
    description: '公司与供应商采购合同',
    rendererComponent: 'src/components/documents/templates/PurchaseOrderDocument.tsx',
  },
  ci: {
    templateCode: 'tpl_ci',
    documentCode: 'CI',
    templateNameCn: '商业发票',
    templateNameEn: 'Commercial Invoice',
    displayOrder: 10,
    businessStage: 'shipping-docs',
    description: '出口报关和结汇用的商业发票',
    rendererComponent: 'src/components/documents/templates/CommercialInvoiceDocument.tsx',
  },
  pl: {
    templateCode: 'tpl_pl',
    documentCode: 'PL',
    templateNameCn: '装箱单',
    templateNameEn: 'Packing List',
    displayOrder: 11,
    businessStage: 'shipping-docs',
    description: '出口货物的详细包装清单',
    rendererComponent: 'src/components/documents/templates/PackingListDocument.tsx',
  },
  soa: {
    templateCode: 'tpl_soa',
    documentCode: 'SOA',
    templateNameCn: '账户对账单',
    templateNameEn: 'Statement of Account',
    displayOrder: 12,
    businessStage: 'finance-reconciliation',
    description: '客户账户往来对账单',
    rendererComponent: 'src/components/documents/templates/StatementOfAccountDocument.tsx',
  },
}

type TemplateCenterDeps = {
  buildSupabaseError: (context: string, error: any, options?: any) => Error
  throwSupabaseError: (context: string, error: any) => never
  withSupabaseTimeout: <T>(task: Promise<T>, timeoutMs: number, message: string) => Promise<T>
  updateWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    applyFilter: (query: any) => any,
    context: string,
  ) => Promise<{ data: any; error: Error | null }>
  upsertWithoutSelectWithSchemaFallback: (
    table: string,
    row: Record<string, any>,
    onConflict: string,
    context: string,
  ) => Promise<{ error: Error | null }>
}

function normalizeTemplateCenterKey(templateKey: string) {
  return String(templateKey || '').trim().toLowerCase()
}

function notifyTemplatePublished(templateKey: string, version: string, versionId: string | null) {
  if (typeof window === 'undefined') return
  const detail = {
    templateKey,
    version,
    versionId,
    at: Date.now(),
  }

  try {
    window.dispatchEvent(new CustomEvent(TEMPLATE_CENTER_PUBLISH_EVENT, { detail }))
  } catch {
    // ignore custom event failures
  }

  try {
    window.localStorage.setItem('template-center:last-published', JSON.stringify(detail))
  } catch {
    // ignore storage failures
  }
}

async function runTemplateCenterStep<T>(
  deps: TemplateCenterDeps,
  stepLabel: string,
  task: Promise<T>,
  timeoutMs: number = 12000,
): Promise<T> {
  const startedAt = Date.now()
  try {
    const result = await deps.withSupabaseTimeout(task, timeoutMs, `${stepLabel} timed out after ${Math.round(timeoutMs / 1000)}s`)
    console.info(`[TemplateCenter] ${stepLabel} completed in ${Date.now() - startedAt}ms`)
    return result
  } catch (error) {
    console.warn(`[TemplateCenter] ${stepLabel} failed after ${Date.now() - startedAt}ms`, error)
    throw error
  }
}

function isMissingColumnMessage(error: unknown, column: string) {
  const message = String((error as any)?.message || error || '').toLowerCase()
  return (
    message.includes(`.${column.toLowerCase()}`) ||
    message.includes(`"${column.toLowerCase()}"`) ||
    message.includes(`'${column.toLowerCase()}'`) ||
    message.includes(`${column.toLowerCase()} does not exist`)
  )
}

function formatTemplateCenterTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toTemplateCenterVersionRecord(row: any) {
  const styleTokens = row.style_tokens || {}
  const editorMeta = styleTokens.editorMeta || {}
  return {
    id: row.id,
    templateId: row.template_id,
    versionNo: row.version_no,
    version: row.version_label || `v${row.version_no}.0.0`,
    status: row.status === 'published' ? 'published' : 'draft',
    savedAt: formatTemplateCenterTime(row.updated_at || row.created_at || row.published_at),
    savedBy: editorMeta.savedBy || 'Template Center',
    note: row.change_summary || '',
    data: row.sample_data || {},
    layout: row.layout_json || {},
    textOverrides: styleTokens.textOverrides || null,
    publishedAt: row.published_at || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

const documentTemplateMetaCache = new Map<string, any>()
let supabaseTemplateCenterUnreachable = false
let supabaseUnreachableSince = 0
const SUPABASE_UNREACHABLE_RETRY_MS = 5 * 60 * 1000

function markSupabaseTemplateCenterUnreachable() {
  supabaseTemplateCenterUnreachable = true
  supabaseUnreachableSince = Date.now()
  console.warn('[TemplateCenter] Supabase marked unreachable — fast-failing all template center calls for 5 minutes')
}

export function isTemplateCenterSupabaseUnreachable() {
  if (!supabaseTemplateCenterUnreachable) return false
  if (Date.now() - supabaseUnreachableSince > SUPABASE_UNREACHABLE_RETRY_MS) {
    supabaseTemplateCenterUnreachable = false
    console.info('[TemplateCenter] Supabase unreachable window expired — retrying')
    return false
  }
  return true
}

export function retryTemplateCenterSupabase() {
  supabaseTemplateCenterUnreachable = false
  documentTemplateDirectReadUnavailableKeys.clear()
  documentTemplateMetaCache.clear()
  publishedTemplateSettingsCache.clear()
  console.info('[TemplateCenter] Manual retry triggered — clearing unreachable flag and caches')
}

async function resolveTemplateMetaFromBindings(
  deps: TemplateCenterDeps,
  normalizedTemplateKey: string,
  config: (typeof DOCUMENT_TEMPLATE_CENTER_CONFIG)[string],
) {
  const targetNodeCodes = TEMPLATE_DEFAULT_NODE_BINDINGS[normalizedTemplateKey] || []
  if (targetNodeCodes.length === 0) return null

  for (const nodeCode of targetNodeCodes) {
    const { data, error } = await runTemplateCenterStep(
      deps,
      `ensureDocumentTemplate(${normalizedTemplateKey}) binding fallback ${nodeCode}`,
      supabase
        .from('document_template_bindings')
        .select(`
          template_id,
          template_version_id,
          document_template_versions (
            id,
            version_no,
            version_label,
            status
          )
        `)
        .eq('flow_code', DEFAULT_TEMPLATE_BINDING_FLOW_CODE)
        .eq('document_code', config.documentCode)
        .eq('node_code', nodeCode)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle(),
      8000,
    ).catch(() => ({ data: null, error: null } as any))

    if (error || !data?.template_id) continue

    return {
      id: data.template_id,
      template_code: config.templateCode,
      document_code: config.documentCode,
      template_name_cn: config.templateNameCn,
      template_name_en: config.templateNameEn,
      display_order: config.displayOrder,
      business_stage: config.businessStage,
      renderer_type: 'legacy-react',
      status: 'published',
      description: config.description,
      is_active: true,
      current_version_id: data.template_version_id || null,
      __synthetic_fallback: 'binding',
    }
  }

  return null
}

async function resolveTemplateMetaFromVersions(
  deps: TemplateCenterDeps,
  normalizedTemplateKey: string,
  config: (typeof DOCUMENT_TEMPLATE_CENTER_CONFIG)[string],
) {
  const { data, error } = await runTemplateCenterStep(
    deps,
    `ensureDocumentTemplate(${normalizedTemplateKey}) version fallback`,
    supabase
      .from('document_template_versions')
      .select('template_id,id,version_no,version_label,status,renderer_component,schema_json,published_at')
      .eq('renderer_component', config.rendererComponent)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle(),
    8000,
  ).catch(() => ({ data: null, error: null } as any))

  if (error || !data?.template_id) return null

  return {
    id: data.template_id,
    template_code: config.templateCode,
    document_code: config.documentCode,
    template_name_cn: config.templateNameCn,
    template_name_en: config.templateNameEn,
    display_order: config.displayOrder,
    business_stage: config.businessStage,
    renderer_type: 'legacy-react',
    status: data.status === 'published' ? 'published' : 'draft',
    description: config.description,
    is_active: true,
    current_version_id: data.id || null,
    __synthetic_fallback: 'version',
  }
}

async function ensureDocumentTemplate(deps: TemplateCenterDeps, templateKey: string) {
  const normalizedTemplateKey = normalizeTemplateCenterKey(templateKey)
  const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
  if (!config) throw new Error(`Unknown template key: ${templateKey}`)

  const cached = documentTemplateMetaCache.get(normalizedTemplateKey)
  if (cached?.id) return cached

  if (isTemplateCenterSupabaseUnreachable()) {
    throw new Error(`Supabase unreachable — skipping ensureDocumentTemplate(${normalizedTemplateKey})`)
  }

  const payload = {
    template_code: config.templateCode,
    document_code: config.documentCode,
    template_name_cn: config.templateNameCn,
    template_name_en: config.templateNameEn,
    display_order: config.displayOrder,
    business_stage: config.businessStage,
    renderer_type: 'legacy-react',
    status: 'published',
    description: config.description,
    is_active: true,
  }

  const readTemplateByCode = async (stepLabel: string, timeoutMs: number) => {
    const { data, error } = await runTemplateCenterStep(
      deps,
      stepLabel,
      supabase
        .from('document_templates')
        .select('id,template_code,document_code,template_name_cn,template_name_en,display_order,business_stage,renderer_type,status,is_active,current_version_id')
        .eq('template_code', config.templateCode)
        .single(),
      timeoutMs,
    )
    if (error) throw deps.buildSupabaseError('ensure document_template read by code', error)
    return data
  }

  if (!documentTemplateDirectReadUnavailableKeys.has(normalizedTemplateKey)) {
    try {
      const { data: existingTemplate, error: existingTemplateError } = await runTemplateCenterStep(
        deps,
        `ensureDocumentTemplate(${normalizedTemplateKey}) read existing`,
        supabase
          .from('document_templates')
          .select('id,template_code,document_code,template_name_cn,template_name_en,display_order,business_stage,renderer_type,status,is_active,current_version_id')
          .eq('template_code', config.templateCode)
          .maybeSingle(),
        20000,
      )

      if (existingTemplateError) {
        throw deps.buildSupabaseError('ensure document_template read existing', existingTemplateError)
      }

      if (existingTemplate?.id) {
        documentTemplateMetaCache.set(normalizedTemplateKey, existingTemplate)
        return existingTemplate
      }
    } catch (error) {
      documentTemplateDirectReadUnavailableKeys.add(normalizedTemplateKey)
      console.warn(`[TemplateCenter] ensureDocumentTemplate(${normalizedTemplateKey}) direct read unavailable, trying fallbacks.`, error)
    }
  }

  if (isTemplateCenterSupabaseUnreachable()) {
    throw new Error(`Supabase unreachable — skipping fallbacks for ensureDocumentTemplate(${normalizedTemplateKey})`)
  }

  const [bindingResolvedTemplate, versionResolvedTemplate] = await Promise.all([
    resolveTemplateMetaFromBindings(deps, normalizedTemplateKey, config).catch(() => null),
    resolveTemplateMetaFromVersions(deps, normalizedTemplateKey, config).catch(() => null),
  ])
  const parallelResolved = bindingResolvedTemplate?.id ? bindingResolvedTemplate : versionResolvedTemplate
  if (parallelResolved?.id) {
    documentTemplateMetaCache.set(normalizedTemplateKey, parallelResolved)
    return parallelResolved
  }

  try {
    const { error: upsertError } = await runTemplateCenterStep(
      deps,
      `ensureDocumentTemplate(${normalizedTemplateKey}) upsert`,
      supabase
        .from('document_templates')
        .upsert(payload, { onConflict: 'template_code', ignoreDuplicates: true }),
      45000,
    )
    if (upsertError) throw deps.buildSupabaseError('ensure document_template upsert', upsertError)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || '')
    if (message.includes('timed out') || message.includes('超时')) {
      try {
        const recovered = await readTemplateByCode(
          `ensureDocumentTemplate(${normalizedTemplateKey}) read persisted after timeout`,
          30000,
        )
        documentTemplateDirectReadUnavailableKeys.delete(normalizedTemplateKey)
        documentTemplateMetaCache.set(normalizedTemplateKey, recovered)
        return recovered
      } catch {
        const { error: retryUpsertError } = await runTemplateCenterStep(
          deps,
          `ensureDocumentTemplate(${normalizedTemplateKey}) upsert retry`,
          supabase
            .from('document_templates')
            .upsert(payload, { onConflict: 'template_code', ignoreDuplicates: true }),
          60000,
        )
        if (retryUpsertError) throw deps.buildSupabaseError('ensure document_template upsert retry', retryUpsertError)
      }
    } else {
      throw error
    }
  }

  const data = await readTemplateByCode(
    `ensureDocumentTemplate(${normalizedTemplateKey}) read persisted`,
    30000,
  )

  documentTemplateDirectReadUnavailableKeys.delete(normalizedTemplateKey)
  documentTemplateMetaCache.set(normalizedTemplateKey, data)
  return data
}

const publishedTemplateSettingsCache = new Map<string, { settings: Record<string, any> | null; fetchedAt: number }>()
const PUBLISHED_SETTINGS_CACHE_TTL = 5 * 60 * 1000

export function peekPublishedTemplateSettingsCache(templateKey: string): {
  hasFreshCache: boolean
  settings: Record<string, any> | null
} {
  const normalizedKey = normalizeTemplateCenterKey(templateKey)
  const cached = publishedTemplateSettingsCache.get(normalizedKey)
  if (!cached) {
    return { hasFreshCache: false, settings: null }
  }
  if ((Date.now() - cached.fetchedAt) >= PUBLISHED_SETTINGS_CACHE_TTL) {
    return { hasFreshCache: false, settings: null }
  }
  return {
    hasFreshCache: true,
    settings: cached.settings,
  }
}

export function createTemplateCenterService(deps: TemplateCenterDeps) {
  return {
    async getTemplateWorkspacePrefs() {
      try {
        const { data, error } = await runTemplateCenterStep(
          deps,
          'getTemplateWorkspacePrefs',
          supabase.from('document_templates').select('template_code,template_name_cn,template_name_en,display_order'),
          12000,
        )
        if (error) throw deps.buildSupabaseError('get document_templates workspace prefs', error)

        const templateCodeToKey = Object.entries(DOCUMENT_TEMPLATE_CENTER_CONFIG).reduce<Record<string, string>>((acc, [key, config]) => {
          acc[config.templateCode] = key
          return acc
        }, {})

        return (data || []).reduce<Record<string, { nameCn: string; nameEn: string; displayOrder: number | null }>>((acc, row: any) => {
          const key = templateCodeToKey[String(row?.template_code || '').trim()]
          if (!key) return acc
          const existingMeta = documentTemplateMetaCache.get(key) || {}
          documentTemplateMetaCache.set(key, {
            ...existingMeta,
            template_code: String(row?.template_code || '').trim(),
            template_name_cn: String(row?.template_name_cn || '').trim(),
            template_name_en: String(row?.template_name_en || '').trim(),
            display_order: Number.isFinite(Number(row?.display_order)) ? Number(row.display_order) : null,
          })
          acc[key] = {
            nameCn: String(row?.template_name_cn || '').trim(),
            nameEn: String(row?.template_name_en || '').trim(),
            displayOrder: Number.isFinite(Number(row?.display_order)) ? Number(row.display_order) : null,
          }
          return acc
        }, {})
      } catch (error) {
        deps.throwSupabaseError('getTemplateWorkspacePrefs', error)
      }
    },

    async updateTemplateDisplayName(input: { templateKey: string; nameCn: string; nameEn?: string }) {
      try {
        const normalizedTemplateKey = normalizeTemplateCenterKey(input.templateKey)
        const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
        if (!config) throw new Error(`Unknown template key: ${input.templateKey}`)

        const cachedTemplate = documentTemplateMetaCache.get(normalizedTemplateKey)
        const nowIso = new Date().toISOString()
        const nextNameCn = String(input.nameCn || '').trim()
        const nextNameEn = String(input.nameEn || '').trim() || cachedTemplate?.template_name_en || config.templateNameEn

        const { data, error } = await runTemplateCenterStep(
          deps,
          `updateTemplateDisplayName(${normalizedTemplateKey})`,
          supabase
            .from('document_templates')
            .upsert({
              template_code: config.templateCode,
              document_code: config.documentCode,
              template_name_cn: nextNameCn || config.templateNameCn,
              template_name_en: nextNameEn,
              display_order: Number.isFinite(Number(cachedTemplate?.display_order)) ? Number(cachedTemplate?.display_order) : config.displayOrder,
              business_stage: cachedTemplate?.business_stage || config.businessStage,
              renderer_type: cachedTemplate?.renderer_type || 'legacy-react',
              status: cachedTemplate?.status || 'published',
              description: cachedTemplate?.description || config.description,
              is_active: typeof cachedTemplate?.is_active === 'boolean' ? cachedTemplate.is_active : true,
              updated_at: nowIso,
            }, { onConflict: 'template_code' })
            .select('id,template_code,document_code,template_name_cn,template_name_en,display_order,business_stage,renderer_type,status,is_active,current_version_id')
            .single(),
          15000,
        )
        if (error) throw deps.buildSupabaseError('update document_template display name', error)
        documentTemplateMetaCache.set(normalizedTemplateKey, data)
        return data
      } catch (error) {
        deps.throwSupabaseError('updateTemplateDisplayName', error)
      }
    },

    async updateTemplateDisplayOrder(order: string[]) {
      try {
        const normalizedOrder = order
          .map((value) => normalizeTemplateCenterKey(value))
          .filter((value) => Boolean(DOCUMENT_TEMPLATE_CENTER_CONFIG[value]))
        if (normalizedOrder.length === 0) return

        const nowIso = new Date().toISOString()
        const payload = normalizedOrder.map((templateKey, index) => {
          const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[templateKey]
          const cachedTemplate = documentTemplateMetaCache.get(templateKey)
          return {
            template_code: config.templateCode,
            document_code: config.documentCode,
            template_name_cn: String(cachedTemplate?.template_name_cn || '').trim() || config.templateNameCn,
            template_name_en: String(cachedTemplate?.template_name_en || '').trim() || config.templateNameEn,
            display_order: index + 1,
            business_stage: cachedTemplate?.business_stage || config.businessStage,
            renderer_type: cachedTemplate?.renderer_type || 'legacy-react',
            status: cachedTemplate?.status || 'published',
            description: cachedTemplate?.description || config.description,
            is_active: typeof cachedTemplate?.is_active === 'boolean' ? cachedTemplate.is_active : true,
            updated_at: nowIso,
          }
        })

        const { data, error } = await runTemplateCenterStep(
          deps,
          'updateTemplateDisplayOrder(batch)',
          supabase
            .from('document_templates')
            .upsert(payload, { onConflict: 'template_code' })
            .select('id,template_code,document_code,template_name_cn,template_name_en,display_order,business_stage,renderer_type,status,is_active,current_version_id'),
          15000,
        )
        if (error) throw deps.buildSupabaseError('update document_templates display_order batch', error)

        const templateCodeToKey = Object.entries(DOCUMENT_TEMPLATE_CENTER_CONFIG).reduce<Record<string, string>>((acc, [key, config]) => {
          acc[config.templateCode] = key
          return acc
        }, {})
        ;(data || []).forEach((row: any) => {
          const templateKey = templateCodeToKey[String(row?.template_code || '').trim()]
          if (!templateKey) return
          documentTemplateMetaCache.set(templateKey, row)
        })
      } catch (error) {
        deps.throwSupabaseError('updateTemplateDisplayOrder', error)
      }
    },

    async resetTemplateWorkspacePrefs() {
      try {
        const orderedEntries = Object.entries(DOCUMENT_TEMPLATE_CENTER_CONFIG).sort((a, b) => a[1].displayOrder - b[1].displayOrder)
        const nowIso = new Date().toISOString()
        const payload = orderedEntries.map(([_, config]) => ({
          template_code: config.templateCode,
          document_code: config.documentCode,
          template_name_cn: config.templateNameCn,
          template_name_en: config.templateNameEn,
          display_order: config.displayOrder,
          business_stage: config.businessStage,
          renderer_type: 'legacy-react',
          status: 'published',
          description: config.description,
          is_active: true,
          updated_at: nowIso,
        }))

        const { data, error } = await runTemplateCenterStep(
          deps,
          'resetTemplateWorkspacePrefs(batch)',
          supabase
            .from('document_templates')
            .upsert(payload, { onConflict: 'template_code' })
            .select('id,template_code,document_code,template_name_cn,template_name_en,display_order,business_stage,renderer_type,status,is_active,current_version_id'),
          15000,
        )
        if (error) throw deps.buildSupabaseError('reset document_templates workspace prefs batch', error)

        const templateCodeToKey = Object.entries(DOCUMENT_TEMPLATE_CENTER_CONFIG).reduce<Record<string, string>>((acc, [key, config]) => {
          acc[config.templateCode] = key
          return acc
        }, {})
        ;(data || []).forEach((row: any) => {
          const templateKey = templateCodeToKey[String(row?.template_code || '').trim()]
          if (!templateKey) return
          documentTemplateMetaCache.set(templateKey, row)
        })
      } catch (error) {
        deps.throwSupabaseError('resetTemplateWorkspacePrefs', error)
      }
    },

    async getPublishedTemplateSettings(
      templateKey: string,
      options?: { forceRefresh?: boolean },
    ): Promise<Record<string, any> | null> {
      const normalizedKey = normalizeTemplateCenterKey(templateKey)
      const now = Date.now()
      const cached = publishedTemplateSettingsCache.get(normalizedKey)
      if (!options?.forceRefresh && cached && (now - cached.fetchedAt) < PUBLISHED_SETTINGS_CACHE_TTL) {
        return cached.settings
      }
      try {
        if (isTemplateCenterSupabaseUnreachable()) return null
        const template = await ensureDocumentTemplate(deps, normalizedKey)
        const { data, error } = await runTemplateCenterStep(
          deps,
          `getPublishedTemplateSettings(${normalizedKey})`,
          supabase
            .from('document_template_versions')
            .select('id,version_label,sample_data')
            .eq('template_id', template.id)
            .eq('status', 'published')
            .order('version_no', { ascending: false })
            .limit(1)
            .maybeSingle(),
        )
        if (error || !data) {
          publishedTemplateSettingsCache.set(normalizedKey, { settings: null, fetchedAt: now })
          return null
        }
        const templateSettings = (data.sample_data as any)?.templateSettings ?? null
        const versionLabel = String(data.version_label || '').trim() || null
        const settings = templateSettings
          ? {
              ...templateSettings,
              __templateVersion: versionLabel,
              __templateVersionId: data.id || null,
            }
          : null
        publishedTemplateSettingsCache.set(normalizedKey, { settings, fetchedAt: now })
        return settings
      } catch {
        return null
      }
    },

    async getVersionHistory(templateKey: string) {
      try {
        const template = await ensureDocumentTemplate(deps, templateKey)
        let { data, error } = await runTemplateCenterStep(
          deps,
          `getVersionHistory(${templateKey}) ordered query`,
          supabase.from('document_template_versions').select('*').eq('template_id', template.id).order('version_no', { ascending: false }),
        )
        if (error) {
          console.warn('[Supabase] getVersionHistory ordered query fallback:', error?.message || error)
          const fallback = await runTemplateCenterStep(
            deps,
            `getVersionHistory(${templateKey}) fallback query`,
            supabase.from('document_template_versions').select('*').eq('template_id', template.id),
          )
          data = fallback.data
          error = fallback.error
        }
        if (error) throw deps.buildSupabaseError('get document_template_versions', error)
        return (data || []).slice().sort((a: any, b: any) => Number(b?.version_no || 0) - Number(a?.version_no || 0)).map(toTemplateCenterVersionRecord)
      } catch (error) {
        deps.throwSupabaseError(`getVersionHistory ${templateKey}`, error)
      }
    },

    async getTemplateBindingsStatus(templateKey: string, nodeCodes?: string[]) {
      try {
        const normalizedTemplateKey = normalizeTemplateCenterKey(templateKey)
        const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
        if (!config) throw new Error(`Unknown template key: ${templateKey}`)

        const targetNodeCodes = (nodeCodes && nodeCodes.length > 0 ? nodeCodes : TEMPLATE_DEFAULT_NODE_BINDINGS[normalizedTemplateKey] || [])
          .map((nodeCode) => String(nodeCode || '').trim())
          .filter(Boolean)
        if (targetNodeCodes.length === 0) return []

        let data: any = null
        let error: any = null
        try {
          const result = await runTemplateCenterStep(
            deps,
            `getTemplateBindingsStatus(${normalizedTemplateKey})`,
            supabase
              .from('document_template_bindings')
              .select(`
                node_code,
                template_version_id,
                is_default,
                updated_at,
                document_template_versions (
                  id,
                  version_label,
                  status,
                  published_at
                )
              `)
              .eq('flow_code', DEFAULT_TEMPLATE_BINDING_FLOW_CODE)
              .eq('document_code', config.documentCode)
              .in('node_code', targetNodeCodes)
              .eq('is_default', true),
            10000,
          )
          data = result.data
          error = result.error
        } catch (queryError) {
          if (!isMissingColumnMessage(queryError, 'updated_at')) {
            throw queryError
          }
          console.warn(`[TemplateCenter] getTemplateBindingsStatus(${normalizedTemplateKey}) retrying without updated_at due to schema drift.`, queryError)
          const fallbackResult = await runTemplateCenterStep(
            deps,
            `getTemplateBindingsStatus(${normalizedTemplateKey}) fallback`,
            supabase
              .from('document_template_bindings')
              .select(`
                node_code,
                template_version_id,
                is_default,
                document_template_versions (
                  id,
                  version_label,
                  status,
                  published_at
                )
              `)
              .eq('flow_code', DEFAULT_TEMPLATE_BINDING_FLOW_CODE)
              .eq('document_code', config.documentCode)
              .in('node_code', targetNodeCodes)
              .eq('is_default', true),
            10000,
          )
          data = fallbackResult.data
          error = fallbackResult.error
        }
        if (error) throw deps.buildSupabaseError(`get template bindings status ${normalizedTemplateKey}`, error)

        const rowMap = new Map<string, any>()
        ;(data || []).forEach((row: any) => rowMap.set(String(row?.node_code || '').trim(), row))

        return targetNodeCodes.map((nodeCode) => {
          const row = rowMap.get(nodeCode) || null
          const versionMeta = Array.isArray(row?.document_template_versions)
            ? row.document_template_versions[0]
            : row?.document_template_versions || null
          return {
            nodeCode,
            templateVersionId: row?.template_version_id || null,
            version: String(versionMeta?.version_label || '').trim() || null,
            status: String(versionMeta?.status || '').trim() || null,
            publishedAt: versionMeta?.published_at || null,
            updatedAt: row?.updated_at || null,
            isDefault: Boolean(row?.is_default),
          }
        })
      } catch (error) {
        deps.throwSupabaseError(`getTemplateBindingsStatus ${templateKey}`, error)
      }
    },

    async saveVersion(input: {
      templateKey: string
      templateId?: string
      version: string
      status: 'draft' | 'published'
      note: string
      savedBy: string
      data: Record<string, any>
      layout: Record<string, any>
      textOverrides?: Record<string, any> | null
    }) {
      try {
        const normalizedTemplateKey = normalizeTemplateCenterKey(input.templateKey)
        const config = DOCUMENT_TEMPLATE_CENTER_CONFIG[normalizedTemplateKey]
        if (!config) throw new Error(`Unknown template key: ${input.templateKey}`)

        const template = input.templateId?.trim()
          ? { id: input.templateId.trim() }
          : await ensureDocumentTemplate(deps, normalizedTemplateKey)
        const { data: latestVersionRow, error: latestVersionError } = await runTemplateCenterStep(
          deps,
          `saveVersion(${normalizedTemplateKey}) read latest version`,
          supabase.from('document_template_versions').select('version_no').eq('template_id', template.id).order('version_no', { ascending: false }).limit(1).maybeSingle(),
          30000,
        )
        if (latestVersionError) throw deps.buildSupabaseError('read latest document_template_version', latestVersionError)

        const versionNo = Number(latestVersionRow?.version_no || 0) + 1
        const nowIso = new Date().toISOString()
        const { data: insertedVersion, error: insertError } = await runTemplateCenterStep(
          deps,
          `saveVersion(${normalizedTemplateKey}) insert version row`,
          supabase
            .from('document_template_versions')
            .insert({
              template_id: template.id,
              version_no: versionNo,
              version_label: input.version,
              status: input.status,
              schema_json: { mode: 'template-center-workspace', documentCode: config.documentCode },
              layout_json: input.layout || {},
              style_tokens: {
                textOverrides: input.textOverrides || null,
                editorMeta: { savedBy: input.savedBy, savedAt: nowIso },
              },
              sample_data: input.data || {},
              renderer_component: config.rendererComponent,
              change_summary: input.note || '',
              published_at: input.status === 'published' ? nowIso : null,
            })
            .select('*')
            .single(),
          45000,
        )
        if (insertError) throw deps.buildSupabaseError('insert document_template_version', insertError)

        if (!template.__synthetic_fallback) {
          const templateUpdatePayload: Record<string, any> = {
            status: input.status === 'published' ? 'published' : 'draft',
            updated_at: nowIso,
          }
          if (input.status === 'published') templateUpdatePayload.current_version_id = insertedVersion.id

          const { error: templateUpdateError } = await runTemplateCenterStep(
            deps,
            `saveVersion(${normalizedTemplateKey}) update template current version`,
            supabase.from('document_templates').update(templateUpdatePayload).eq('id', template.id),
            30000,
          )
          if (templateUpdateError) throw deps.buildSupabaseError('update document_templates current_version', templateUpdateError)
        } else {
          documentTemplateMetaCache.set(normalizedTemplateKey, {
            ...template,
            current_version_id: insertedVersion.id,
            status: input.status === 'published' ? 'published' : 'draft',
          })
        }

        if (input.status === 'published') {
          const targetNodeCodes = TEMPLATE_DEFAULT_NODE_BINDINGS[normalizedTemplateKey] || []
          for (const nodeCode of targetNodeCodes) {
            const { error: resetBindingError } = await runTemplateCenterStep(
              deps,
              `saveVersion(${normalizedTemplateKey}) reset binding ${config.documentCode}/${nodeCode}`,
              deps.updateWithSchemaFallback(
                'document_template_bindings',
                { is_default: false, updated_at: nowIso },
                (query) => query.eq('flow_code', DEFAULT_TEMPLATE_BINDING_FLOW_CODE).eq('document_code', config.documentCode).eq('node_code', nodeCode),
                `reset template binding ${config.documentCode}/${nodeCode}`,
              ),
              30000,
            )
            if (resetBindingError) throw resetBindingError

            const { error: bindingUpsertError } = await runTemplateCenterStep(
              deps,
              `saveVersion(${normalizedTemplateKey}) publish binding ${config.documentCode}/${nodeCode}`,
              deps.upsertWithoutSelectWithSchemaFallback(
                'document_template_bindings',
                {
                  flow_code: DEFAULT_TEMPLATE_BINDING_FLOW_CODE,
                  node_code: nodeCode,
                  document_code: config.documentCode,
                  template_id: template.id,
                  template_version_id: insertedVersion.id,
                  is_default: true,
                  updated_at: nowIso,
                },
                'flow_code,node_code,document_code,template_version_id',
                `publish template binding ${config.documentCode}/${nodeCode}`,
              ),
              30000,
            )
            if (bindingUpsertError) throw bindingUpsertError
            templateBindingResolutionCache.delete(`${config.documentCode}:${nodeCode}`)
          }
          publishedTemplateSettingsCache.delete(normalizedTemplateKey)
          notifyTemplatePublished(normalizedTemplateKey, input.version, insertedVersion.id || null)
        }

        const { error: logError } = await deps.withSupabaseTimeout(
          supabase.from('document_template_publish_logs').insert({
            template_id: template.id,
            template_version_id: insertedVersion.id,
            action: input.status === 'published' ? 'publish' : 'save_draft',
            notes: input.note || null,
          }),
          2500,
          'document_template_publish_logs write timed out',
        ).catch((error) => ({ error } as { error: any }))

        if (logError) {
          console.warn('[Supabase] save document_template_publish_logs:', logError?.message || logError)
        }

        return toTemplateCenterVersionRecord(insertedVersion)
      } catch (error) {
        deps.throwSupabaseError(`saveVersion ${input.templateKey}`, error)
      }
    },
  }
}
