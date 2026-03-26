import { canonicalizePersonnelEmail } from '../personnelEmail'
import { supabase } from '../supabase'
import {
  buildProcurementRequestNotes,
  DEFAULT_DOWNSTREAM_VISIBILITY,
  extractProcurementRequestContext,
  mergeCustomerInfoWithProcurementContext,
  parseProcurementRequestNotes,
} from '../../utils/procurementRequestContext'

type DependencyBag = {
  throwSupabaseError: (context: string, error: any) => never
  resolveBusinessDocumentTemplateBinding: (
    document: any,
    options: {
      documentCode: string
      nodeCode: string
      businessData: any
    },
  ) => Promise<Record<string, any>>
  toUUID: (id: string | null | undefined) => string
  toUUIDOrNull: (id: string | null | undefined) => string | null
  toIsoDate: (v: any) => string | null
  toRegionCode: (region: string | null | undefined) => string | null
  fromRegionCode: (code: string | null | undefined) => string | null
}

const COSUN_TENANT_ID = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9'

function toXJRow(x: any, deps: DependencyBag) {
  const xjNumber = x.xjNumber || x.xj_number || x.supplierXjNo || x.supplier_xj_no || ''
  const projectExecutionBaseline = x.documentRenderMeta?.projectExecutionBaseline || (x.projectRevisionId
    ? {
        projectId: x.projectId || null,
        projectCode: x.projectCode || null,
        projectName: x.projectName || null,
        projectRevisionId: x.projectRevisionId || null,
        projectRevisionCode: x.projectRevisionCode || null,
        projectRevisionStatus: x.projectRevisionStatus || null,
        finalRevisionId: x.finalRevisionId || null,
        finalQuotationId: x.finalQuotationId || null,
        finalQuotationNumber: x.finalQuotationNumber || null,
      }
    : null)
  return {
    id: deps.toUUID(x.id),
    tenant_id: x.tenant_id || COSUN_TENANT_ID,
    xj_number: xjNumber,
    supplier_xj_no: x.supplierXjNo || x.supplier_xj_no || null,
    supplier_quotation_no: x.supplierQuotationNo || x.supplier_quotation_no || null,
    source_qr_number: x.sourceQRNumber || x.source_qr_number || null,
    source_inquiry_id: deps.toUUIDOrNull(x.sourceInquiryId || x.source_inquiry_id),
    source_inquiry_number: x.sourceInquiryNumber || x.source_inquiry_number || null,
    requirement_no: x.requirementNo || x.requirement_no || null,
    source_ref: x.sourceRef || x.source_ref || null,
    region_code: deps.toRegionCode(x.region || x.region_code),
    customer_name: x.customerName || x.customer_name || null,
    customer_region: x.customerRegion || x.customer_region || null,
    supplier_company_id: deps.toUUIDOrNull(x.supplierCompanyId || x.supplier_company_id),
    supplier_code: x.supplierCode || x.supplier_code || '',
    supplier_name: x.supplierName || x.supplier_name || '',
    supplier_contact: x.supplierContact || x.supplier_contact || null,
    supplier_email: x.supplierEmail || x.supplier_email || '',
    products: x.products || [],
    product_name: x.productName || x.product_name || null,
    model_no: x.modelNo || x.model_no || null,
    specification: x.specification || null,
    quantity: x.quantity ?? null,
    unit: x.unit || null,
    target_price: x.targetPrice ?? x.target_price ?? null,
    currency: x.currency || 'USD',
    expected_date: deps.toIsoDate(x.expectedDate || x.expected_date),
    quotation_deadline: deps.toIsoDate(x.quotationDeadline || x.quotation_deadline),
    due_date: deps.toIsoDate(x.dueDate || x.due_date || x.quotationDeadline || x.quotation_deadline),
    priority: x.priority || 'normal',
    status: x.status || 'pending',
    quotes: x.quotes || [],
    document_data: x.documentData || x.document_data || null,
    remarks: x.remarks || null,
    created_by: x.createdBy || x.created_by || '',
    source_doc_id: deps.toUUIDOrNull(x.sourceDocId || x.source_doc_id),
    sales_contract_id: deps.toUUIDOrNull(x.salesContractId || x.sales_contract_id),
    root_sales_contract_id: deps.toUUIDOrNull(x.rootSalesContractId || x.root_sales_contract_id),
    display_number: x.displayNumber || x.display_number || xjNumber || null,
    template_id: x.templateId || x.template_id || null,
    template_version_id: x.templateVersionId || x.template_version_id || null,
    template_snapshot: x.templateSnapshot || x.template_snapshot || {},
    document_data_snapshot: x.documentDataSnapshot || x.document_data_snapshot || {},
    document_render_meta: {
      ...(x.documentRenderMeta || x.document_render_meta || {}),
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  }
}

function fromXJRow(r: any, deps: DependencyBag) {
  if (!r) return null
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null
  return {
    id: r.id,
    tenantId: r.tenant_id,
    xjNumber: r.xj_number,
    supplierXjNo: r.supplier_xj_no,
    supplierQuotationNo: r.supplier_quotation_no,
    sourceQRNumber: r.source_qr_number,
    sourceInquiryId: r.source_inquiry_id,
    sourceInquiryNumber: r.source_inquiry_number,
    requirementNo: r.requirement_no,
    sourceRef: r.source_ref,
    region: deps.fromRegionCode(r.region_code),
    customerName: r.customer_name,
    customerRegion: r.customer_region,
    projectId: projectExecutionBaseline?.projectId || null,
    projectCode: projectExecutionBaseline?.projectCode || null,
    projectName: projectExecutionBaseline?.projectName || null,
    projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
    projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
    finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
    finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
    finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,
    supplierCompanyId: r.supplier_company_id,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierContact: r.supplier_contact,
    supplierEmail: r.supplier_email,
    products: r.products || [],
    productName: r.product_name,
    modelNo: r.model_no,
    specification: r.specification,
    quantity: r.quantity,
    unit: r.unit,
    targetPrice: r.target_price,
    currency: r.currency,
    expectedDate: r.expected_date,
    quotationDeadline: r.quotation_deadline,
    dueDate: r.due_date,
    priority: r.priority,
    status: r.status,
    quotes: r.quotes || [],
    documentData: r.document_data,
    remarks: r.remarks,
    createdBy: r.created_by,
    sourceDocId: r.source_doc_id,
    salesContractId: r.sales_contract_id,
    rootSalesContractId: r.root_sales_contract_id,
    displayNumber: r.display_number,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    createdDate: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toQRRow(q: any, deps: DependencyBag) {
  const commercialTerms = {
    expectedQuoteDate: q.expectedQuoteDate || q.expected_quote_date || null,
    deliveryDate: q.deliveryDate || q.delivery_date || null,
    tradeTerms: q.tradeTerms || q.trade_terms || null,
    paymentTerms: q.paymentTerms || q.payment_terms || null,
    targetCostRange: q.targetCostRange || q.target_cost_range || null,
    qualityRequirements: q.qualityRequirements || q.quality_requirements || null,
    packagingRequirements: q.packagingRequirements || q.packaging_requirements || null,
    remarks: q.remarks || null,
  }
  const notes = q.notes || buildProcurementRequestNotes(commercialTerms) || null
  return {
    id: deps.toUUID(q.id),
    request_number: q.requestNumber || q.request_number || '',
    region_code: deps.toRegionCode(q.region || q.region_code),
    source_inquiry_id: q.sourceInquiryId || q.source_inquiry_id || null,
    source_inquiry_number: q.sourceInquiryNumber || q.source_inquiry_number || '',
    customer_name: q.customerName || q.customer_name || '',
    customer_email: q.customerEmail || q.customer_email || null,
    customer_company: q.customerCompany || q.customer_company || null,
    products: q.items || q.products || [],
    status: q.status || 'pending',
    assigned_to: q.assignedTo || q.assigned_to || null,
    requested_by: q.requestedBy || q.requested_by || null,
    requested_by_name: q.requestedByName || q.requested_by_name || null,
    owner_user_id: deps.toUUIDOrNull(q.ownerUserId || q.owner_user_id || null),
    owner_email: canonicalizePersonnelEmail(q.ownerEmail || q.owner_email || q.requestedBy || q.requested_by || '', q.region || q.region_code) || null,
    owner_name: q.ownerName || q.owner_name || q.requestedByName || q.requested_by_name || null,
    owner_role: q.ownerRole || q.owner_role || null,
    operator_user_id: deps.toUUIDOrNull(q.operatorUserId || q.operator_user_id || null),
    operator_email: canonicalizePersonnelEmail(q.operatorEmail || q.operator_email || '', q.region || q.region_code) || null,
    operator_role: q.operatorRole || q.operator_role || null,
    acting_user_id: deps.toUUIDOrNull(q.actingUserId || q.acting_user_id || null),
    acting_user_email: canonicalizePersonnelEmail(q.actingUserEmail || q.acting_user_email || '', q.region || q.region_code) || null,
    acting_user_role: q.actingUserRole || q.acting_user_role || null,
    authenticated_user_id: deps.toUUIDOrNull(q.authenticatedUserId || q.authenticated_user_id || null),
    authenticated_user_email: canonicalizePersonnelEmail(q.authenticatedUserEmail || q.authenticated_user_email || '', q.region || q.region_code) || null,
    authenticated_user_role: q.authenticatedUserRole || q.authenticated_user_role || null,
    request_date: deps.toIsoDate(q.requestDate || q.request_date),
    expected_quote_date: deps.toIsoDate(q.expectedQuoteDate || q.expected_quote_date),
    urgency: q.urgency || 'medium',
    xj_ids: q.xjIds || q.xj_ids || [],
    xj_count: q.xjCount || q.xj_count || 0,
    priority: q.priority || 'medium',
    notes,
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || {},
    document_render_meta: q.documentRenderMeta || q.document_render_meta || {},
  }
}

function fromQRRow(r: any, deps: DependencyBag) {
  if (!r) return null
  const notesTerms = parseProcurementRequestNotes(r.notes)
  return {
    id: r.id,
    requestNumber: r.request_number,
    region: deps.fromRegionCode(r.region_code),
    sourceInquiryId: r.source_inquiry_id,
    sourceInquiryNumber: r.source_inquiry_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    items: r.products || [],
    status: r.status,
    assignedTo: r.assigned_to,
    requestedBy: r.requested_by,
    requestedByName: r.requested_by_name,
    ownerUserId: r.owner_user_id || null,
    ownerEmail: canonicalizePersonnelEmail(r.owner_email || r.requested_by || '', r.region_code) || null,
    ownerName: r.owner_name || r.requested_by_name || null,
    ownerRole: r.owner_role || null,
    operatorUserId: r.operator_user_id || null,
    operatorEmail: canonicalizePersonnelEmail(r.operator_email || '', r.region_code) || null,
    operatorRole: r.operator_role || null,
    actingUserId: r.acting_user_id || null,
    actingUserEmail: canonicalizePersonnelEmail(r.acting_user_email || '', r.region_code) || null,
    actingUserRole: r.acting_user_role || null,
    authenticatedUserId: r.authenticated_user_id || null,
    authenticatedUserEmail: canonicalizePersonnelEmail(r.authenticated_user_email || '', r.region_code) || null,
    authenticatedUserRole: r.authenticated_user_role || null,
    requestDate: r.request_date,
    expectedQuoteDate: r.expected_quote_date || notesTerms.expectedQuoteDate || '',
    urgency: r.urgency || 'medium',
    xjIds: r.xj_ids || [],
    xjCount: r.xj_count || 0,
    priority: r.priority,
    notes: r.notes,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
    deliveryDate: notesTerms.deliveryDate || null,
    tradeTerms: notesTerms.tradeTerms || null,
    paymentTerms: notesTerms.paymentTerms || null,
    targetCostRange: notesTerms.targetCostRange || null,
    qualityRequirements: notesTerms.qualityRequirements || null,
    packagingRequirements: notesTerms.packagingRequirements || null,
    remarks: notesTerms.remarks || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function createXjService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll supplier_xjs', error)
      return (data || []).map((row: any) => fromXJRow(row, deps))
    },

    async getByEmail(email: string) {
      const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).or(`supplier_email.eq.${email},created_by.eq.${email}`).order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getByEmail supplier_xjs', error)
      return (data || []).map((row: any) => fromXJRow(row, deps))
    },

    async upsert(x: any) {
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(x, {
        documentCode: 'XJ',
        nodeCode: 'xj-create',
        businessData: x.documentDataSnapshot || x.document_data_snapshot || x,
      })
      const row = toXJRow({ ...x, ...templateBinding }, deps)
      const { data, error } = await supabase
        .from('supplier_xjs')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) {
        if (error.code === '23505') {
          const { data: updated, error: updateError } = await supabase
            .from('supplier_xjs')
            .update(row)
            .eq('xj_number', row.xj_number)
            .eq('tenant_id', row.tenant_id)
            .select()
            .single()
          if (updateError) deps.throwSupabaseError('upsert supplier_xj (update fallback)', updateError)
          return fromXJRow(updated, deps)
        }
        deps.throwSupabaseError('upsert supplier_xj', error)
      }
      return fromXJRow(data, deps)
    },

    async delete(id: string) {
      const { data: { session } } = await supabase.auth.getSession()
      const currentEmail = String(session?.user?.email || '').trim().toLowerCase()
      if (currentEmail) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('portal_role, rbac_role')
          .eq('id', session?.user?.id || '')
          .maybeSingle()
        const portalRole = String((profile as any)?.portal_role || '').toLowerCase()
        if (portalRole === 'supplier') {
          deps.throwSupabaseError('delete supplier_xj forbidden', new Error('supplier cannot delete supplier_xjs'))
        }
      }
      const operatorEmail = session?.user?.email || null
      const { error } = await supabase
        .from('supplier_xjs')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: operatorEmail,
          deleted_reason: 'manual-delete-ui',
        })
        .eq('id', id)
      if (error) deps.throwSupabaseError('delete supplier_xj', error)
    },
  }
}

export function createQuotationRequestService(deps: DependencyBag) {
  return {
    async getAll() {
      const { data, error } = await supabase.from('quotation_requests').select('*').is('deleted_at', null).order('created_at', { ascending: false })
      if (error) deps.throwSupabaseError('getAll quotation_requests', error)
      return (data || []).map((row: any) => fromQRRow(row, deps))
    },

    async upsert(q: any) {
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(q, {
        documentCode: 'QR',
        nodeCode: 'qr-create',
        businessData: q.documentDataSnapshot || q.document_data_snapshot || q,
      })
      const row = toQRRow({ ...q, ...templateBinding }, deps)
      const { data, error } = await supabase.from('quotation_requests').upsert(row, { onConflict: 'id' }).select().single()
      if (error) deps.throwSupabaseError('upsert quotation_request', error)
      return fromQRRow(data, deps)
    },

    async delete(id: string) {
      const { error } = await supabase.from('quotation_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) deps.throwSupabaseError('delete quotation_request', error)
    },
  }
}
