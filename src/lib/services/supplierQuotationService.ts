import { supabase } from '../supabase'

type TemplateBindingResolver = (input: any, options: {
  documentCode: string
  nodeCode: string
  businessData: Record<string, any>
}) => Promise<any>

type SupplierQuotationDeps = {
  handleError: (error: any, context: string) => any
  throwSupabaseError: (context: string, error: any) => never
  toUUID: (id: string | null | undefined) => string
  toUUIDOrNull: (id: string | null | undefined) => string | null
  resolveBusinessDocumentTemplateBinding: TemplateBindingResolver
}

function toSQRow(q: any, deps: Pick<SupplierQuotationDeps, 'toUUID' | 'toUUIDOrNull'>) {
  const sourceItems = (Array.isArray(q.items) && q.items.length > 0)
    ? q.items
    : (Array.isArray(q.products) ? q.products : [])
  const normalizedProducts = sourceItems.map((it: any) => {
    const qty = Number(it?.quantity ?? 0)
    const unitPriceRaw = it?.unitPrice ?? it?.price ?? null
    const unitPrice = unitPriceRaw != null && Number.isFinite(Number(unitPriceRaw))
      ? Number(unitPriceRaw)
      : null
    const amountRaw = it?.amount ?? it?.lineAmount ?? null
    const amount = amountRaw != null && Number.isFinite(Number(amountRaw))
      ? Number(amountRaw)
      : (unitPrice != null && qty > 0 ? unitPrice * qty : null)
    return {
      ...it,
      quantity: qty,
      unitPrice,
      amount,
    }
  })
  const projectExecutionBaseline = q.documentRenderMeta?.projectExecutionBaseline || (q.projectRevisionId
    ? {
        projectId: q.projectId || null,
        projectCode: q.projectCode || null,
        projectName: q.projectName || null,
        projectRevisionId: q.projectRevisionId || null,
        projectRevisionCode: q.projectRevisionCode || null,
        projectRevisionStatus: q.projectRevisionStatus || null,
        finalRevisionId: q.finalRevisionId || null,
        finalQuotationId: q.finalQuotationId || null,
        finalQuotationNumber: q.finalQuotationNumber || null,
        quotationRole: q.quotationRole || null,
      }
    : null)

  return {
    id: deps.toUUID(q.id),
    quotation_number: q.quotationNumber || q.quotationNo || q.bj_number || q.quotation_number || null,
    bj_number: q.bjNumber || q.quotationNo || q.quotationNumber || q.bj_number || null,
    display_number: q.displayNumber || q.display_number || null,
    supplier_code: q.supplierCode || q.supplier_code || null,
    supplier_name: q.supplierName || q.supplier_name || null,
    supplier_email: q.supplierEmail || q.supplier_email || '',
    supplier_company: q.supplierCompany || q.supplier_company || null,
    source_xj_number: q.sourceXJNumber || q.sourceXJ || q.xjNumber || q.source_xj_number || null,
    source_xj_id: deps.toUUIDOrNull(q.sourceXJId || q.xjId || q.source_xj_id),
    source_qr_number: q.sourceQR || q.sourceQRNumber || q.source_qr_number || null,
    region_code: q.regionCode || q.region_code || null,
    products: normalizedProducts,
    total_amount: q.totalAmount || q.total_amount || 0,
    currency: q.currency || 'CNY',
    quotation_date: q.quotationDate || q.quotation_date || null,
    valid_until: q.validUntil || q.valid_until || null,
    payment_terms: q.paymentTerms || q.payment_terms || null,
    delivery_terms: q.deliveryTerms || q.delivery_terms || null,
    status: q.status || 'draft',
    notes: q.notes || q.generalRemarks || null,
    created_by: q.createdBy || q.created_by || null,
    source_doc_id: deps.toUUIDOrNull(q.sourceDocId || q.source_doc_id),
    sales_contract_id: deps.toUUIDOrNull(q.salesContractId || q.sales_contract_id),
    root_sales_contract_id: deps.toUUIDOrNull(q.rootSalesContractId || q.root_sales_contract_id),
    template_id: q.templateId || q.template_id || null,
    template_version_id: q.templateVersionId || q.template_version_id || null,
    template_snapshot: q.templateSnapshot || q.template_snapshot || {},
    document_data_snapshot: q.documentDataSnapshot || q.document_data_snapshot || q.documentData || q.document_data || {},
    document_render_meta: {
      ...(q.documentRenderMeta || q.document_render_meta || {}),
      ...(projectExecutionBaseline ? { projectExecutionBaseline } : {}),
    },
  }
}

function fromSQRow(r: any) {
  if (!r) return null
  const projectExecutionBaseline = r.document_render_meta?.projectExecutionBaseline || null
  return {
    id: r.id,
    quotationNo: r.quotation_number || r.bj_number || r.display_number || '',
    quotationNumber: r.quotation_number,
    sourceXJ: r.source_xj_number,
    sourceQR: r.source_qr_number,
    quotationDate: r.quotation_date,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierEmail: r.supplier_email,
    supplierCompany: r.supplier_company,
    sourceXJNumber: r.source_xj_number,
    xjNumber: r.source_xj_number,
    sourceXJId: r.source_xj_id,
    xjId: r.source_xj_id,
    regionCode: r.region_code,
    projectId: projectExecutionBaseline?.projectId || null,
    projectCode: projectExecutionBaseline?.projectCode || null,
    projectName: projectExecutionBaseline?.projectName || null,
    projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
    projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
    projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
    finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
    finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
    finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,
    quotationRole: projectExecutionBaseline?.quotationRole || null,
    products: r.products || [],
    items: r.products || [],
    totalAmount: r.total_amount || 0,
    currency: r.currency || 'CNY',
    validUntil: r.valid_until,
    paymentTerms: r.payment_terms,
    deliveryTerms: r.delivery_terms,
    submittedDate: r.updated_at || r.created_at,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    deletedAt: r.deleted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    bjNumber: r.bj_number,
    displayNumber: r.display_number,
    sourceDocId: r.source_doc_id,
    salesContractId: r.sales_contract_id,
    rootSalesContractId: r.root_sales_contract_id,
    templateId: r.template_id || null,
    templateVersionId: r.template_version_id || null,
    templateSnapshot: r.template_snapshot || {},
    documentDataSnapshot: r.document_data_snapshot || {},
    documentRenderMeta: r.document_render_meta || {},
  }
}

export function createSupplierQuotationService(deps: SupplierQuotationDeps) {
  return {
    async getAll() {
      let { data, error } = await supabase
        .from('supplier_quotations')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
        const retry = await supabase
          .from('supplier_quotations')
          .select('*')
          .order('created_at', { ascending: false })
        data = retry.data
        error = retry.error
      }
      if (error) return deps.handleError(error, 'getAll supplier_quotations')
      return (data || []).map(fromSQRow)
    },

    async getBySupplierEmail(email: string) {
      const normalized = String(email || '').trim().toLowerCase()
      const bySupplierEmail = `supplier_email.ilike.%${normalized}%`
      const byCreatedBy = `created_by.ilike.%${normalized}%`
      const bySupplierCode = `supplier_code.ilike.%${normalized}%`

      let { data, error } = await supabase
        .from('supplier_quotations')
        .select('*')
        .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
        const retry = await supabase
          .from('supplier_quotations')
          .select('*')
          .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
          .order('created_at', { ascending: false })
        data = retry.data
        error = retry.error
      }
      if (error) return deps.handleError(error, 'getBySupplierEmail supplier_quotations')
      return (data || []).map(fromSQRow)
    },

    async upsert(q: any) {
      const templateBinding = await deps.resolveBusinessDocumentTemplateBinding(q, {
        documentCode: 'BJ',
        nodeCode: 'bj-review',
        businessData: q.documentDataSnapshot || q.document_data_snapshot || q.documentData || q.document_data || q,
      })
      const row = toSQRow({ ...q, ...templateBinding }, deps)
      const { data, error } = await supabase
        .from('supplier_quotations')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single()
      if (error) deps.throwSupabaseError('upsert supplier_quotation', error)
      return fromSQRow(data)
    },

    async delete(id: string) {
      const { error } = await supabase.from('supplier_quotations').delete().eq('id', id)
      if (error) return deps.handleError(error, 'delete supplier_quotation')
    },

    subscribeToChanges(callback: (payload: any) => void) {
      return supabase
        .channel('supplier_quotations_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_quotations' }, callback)
        .subscribe()
    },
  }
}
