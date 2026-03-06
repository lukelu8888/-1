import { supabase } from './supabase'

// ============================================================
// 通用错误处理
// ============================================================
function handleError(error: any, context: string) {
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
}

function buildSupabaseError(
  context: string,
  error: any,
  options: {
    removedColumns?: string[]
    adjustedProfitRate?: boolean
  } = {},
) {
  const details: string[] = []
  const rawMessage = String(error?.message || error || 'Unknown Supabase error').trim()
  if (rawMessage) details.push(rawMessage)
  if (options.removedColumns?.length) {
    details.push(`schema fallback removed columns: ${options.removedColumns.join(', ')}`)
  }
  if (options.adjustedProfitRate) {
    details.push('profit_rate auto-converted from percent to decimal for old schema')
  }
  return new Error(`${context} failed${details.length ? `: ${details.join(' | ')}` : ''}`)
}

function extractMissingColumn(error: any): string | null {
  const message = String(error?.message || '')
  const match = message.match(/Could not find the ['"]([^'"]+)['"] column/i)
  return match?.[1] || null
}

function shouldDowngradeProfitRate(error: any, payload: Record<string, any>, adjustedProfitRate: boolean) {
  if (adjustedProfitRate) return false
  if (!Object.prototype.hasOwnProperty.call(payload, 'profit_rate')) return false
  const profitRate = Number(payload.profit_rate)
  if (!Number.isFinite(profitRate) || profitRate <= 1) return false
  const message = String(error?.message || '')
  return /numeric field overflow|value overflows numeric format/i.test(message)
}

function normalizeProfitRatePercent(value: any): number {
  const raw = Number(value)
  if (!Number.isFinite(raw)) return 0
  if (raw !== 0 && Math.abs(raw) <= 1) return raw * 100
  return raw
}

function normalizeProfitRateForStorage(input: any, totalProfit?: any, totalCost?: any): number {
  const raw = Number(input)
  if (!Number.isFinite(raw)) return 0

  const numericTotalProfit = Number(totalProfit)
  const numericTotalCost = Number(totalCost)
  const derivedRatio = Number.isFinite(numericTotalProfit) && Number.isFinite(numericTotalCost) && numericTotalCost > 0
    ? numericTotalProfit / numericTotalCost
    : null
  const derivedPercent = derivedRatio == null ? null : derivedRatio * 100

  // 优先用 totals 判断当前值是“百分比”还是“decimal ratio”。
  if (derivedPercent != null && Math.abs(raw - derivedPercent) < 0.0001) {
    return Number(derivedRatio!.toFixed(6))
  }
  if (derivedRatio != null && Math.abs(raw - derivedRatio) < 0.0001) {
    return Number(derivedRatio.toFixed(6))
  }

  // 无法判定时兼容旧库：>= 1 视为百分比（18 => 0.18），< 1 视为旧 decimal。
  return Math.abs(raw) >= 1 ? Number((raw / 100).toFixed(6)) : raw
}

async function upsertWithSchemaFallback(
  table: string,
  row: Record<string, any>,
  onConflict: string,
  context: string,
) {
  const payload: Record<string, any> = { ...row }
  const removedColumns: string[] = []
  let adjustedProfitRate = false
  for (let i = 0; i < 12; i++) {
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict })
      .select()
      .single()
    if (!error) {
      if (removedColumns.length > 0) {
        console.warn(`[Supabase] ${context}: schema drift fallback removed columns: ${removedColumns.join(', ')}`)
      }
      if (adjustedProfitRate) {
        console.warn(`[Supabase] ${context}: profit_rate downgraded to decimal for old schema compatibility`)
      }
      return { data, error: null }
    }
    const missingColumn = extractMissingColumn(error)
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      delete payload[missingColumn]
      removedColumns.push(missingColumn)
      continue
    }
    if (shouldDowngradeProfitRate(error, payload, adjustedProfitRate)) {
      payload.profit_rate = Number((Number(payload.profit_rate) / 100).toFixed(6))
      adjustedProfitRate = true
      continue
    }
    return {
      data: null,
      error: buildSupabaseError(context, error, { removedColumns, adjustedProfitRate }),
    }
  }
  return {
    data: null,
    error: buildSupabaseError(context, { message: `${context}: too many schema fallback retries` }, { removedColumns, adjustedProfitRate }),
  }
}

// ============================================================
// 销售合同
// ============================================================
export const contractService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_contracts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll contracts')
    return data
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('sales_contracts')
      .select('*')
      .or(`customer_email.eq.${email},sales_person.eq.${email}`)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByEmail contracts')
    return data
  },

  async upsert(contract: any) {
    const row = toContractRow(contract)
    const { data, error } = await supabase
      .from('sales_contracts')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert contract')
    return fromContractRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('sales_contracts')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus contract')
    return fromContractRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('sales_contracts')
      .delete()
      .eq('id', id)
    if (error) return handleError(error, 'delete contract')
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sales_contracts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_contracts' }, callback)
      .subscribe()
  },
}

// ============================================================
// 订单
// ============================================================
export const orderService = {
  async getAll() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll orders')
    return data
  },

  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByCustomerEmail orders')
    return data
  },

  async upsert(order: any) {
    const row = toOrderRow(order)
    const { data, error } = await supabase
      .from('orders')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert order')
    return fromOrderRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus order')
    return fromOrderRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) return handleError(error, 'delete order')
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, callback)
      .subscribe()
  },
}

// ============================================================
// 应收账款
// ============================================================
export const arService = {
  async getAll() {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll AR')
    return data
  },

  async upsert(ar: any) {
    const row = toARRow(ar)
    const { data, error } = await supabase
      .from('accounts_receivable')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert AR')
    return fromARRow(data)
  },

  async updateByOrderNumber(orderNumber: string, update: Record<string, any>) {
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('order_number', orderNumber)
      .select()
      .single()
    if (error) return handleError(error, 'updateByOrderNumber AR')
    return fromARRow(data)
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('ar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_receivable' }, callback)
      .subscribe()
  },
}

// ============================================================
// 审批记录
// ============================================================
export const approvalService = {
  async getPending(approverEmail: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .eq('approver_email', approverEmail)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getPending approvals')
    return data
  },

  async upsert(record: any) {
    const { data, error } = await supabase
      .from('approval_records')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert approval')
    return data
  },

  async updateStatus(id: string, status: 'approved' | 'rejected', notes?: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .update({ status, notes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus approval')
    return data
  },

  async deleteByTargetId(targetId: string) {
    const { error } = await supabase
      .from('approval_records')
      .delete()
      .eq('target_id', targetId)
    if (error) return handleError(error, 'deleteByTargetId approval')
    return true
  },

  subscribeToChanges(approverEmail: string, callback: (payload: any) => void) {
    return supabase
      .channel(`approval_changes_${approverEmail}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'approval_records',
        filter: `approver_email=eq.${approverEmail}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 通知
// ============================================================
export const notificationService = {
  async getForUser(email: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_email', email)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return handleError(error, 'getForUser notifications')
    return data
  },

  async send(notification: { recipient_email: string; type: string; title: string; message?: string; data?: any }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()
    if (error) return handleError(error, 'send notification')
    return data
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) return handleError(error, 'markRead notification')
    return true
  },

  subscribeToUser(email: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${email}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_email=eq.${email}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 销售报价单（SalesQuotation QT）
// ============================================================
export const salesQuotationService = {
  async getAll() {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll salesQuotations')
    return (data || []).map(fromSalesQuotationRow)
  },

  async getByCustomerEmail(email: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByCustomerEmail salesQuotations')
    return (data || []).map(fromSalesQuotationRow)
  },

  async getBySalesPerson(email: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('sales_person', email)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getBySalesPerson salesQuotations')
    return (data || []).map(fromSalesQuotationRow)
  },

  async getByQrNumber(qrNumber: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('qr_number', qrNumber)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByQrNumber salesQuotations')
    return (data || []).map(fromSalesQuotationRow)
  },

  async upsert(quotation: any) {
    const row = toSalesQuotationRow(quotation)
    const { data, error } = await upsertWithSchemaFallback(
      'sales_quotations',
      row,
      'id',
      'upsert salesQuotation',
    )
    if (error) throw (error instanceof Error ? error : buildSupabaseError('upsert salesQuotation', error))
    return fromSalesQuotationRow(data)
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .update({ approval_status: status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus salesQuotation')
    return fromSalesQuotationRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('sales_quotations').delete().eq('id', id)
    if (error) return handleError(error, 'delete salesQuotation')
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sales_quotations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_quotations' }, callback)
      .subscribe()
  },
}

// ============================================================
// 通知（Notifications）
// ============================================================
export const notificationSupabaseService = {
  async getForUser(email: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_email', email)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return handleError(error, 'getForUser notifications')
    return (data || []).map(fromNotificationRow)
  },

  async send(notification: {
    recipient_email: string
    type: string
    title: string
    message?: string
    related_id?: string
    related_type?: string
    sender?: string
    metadata?: any
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        is_read: false,
        created_at_ms: Date.now(),
      })
      .select()
      .single()
    if (error) return handleError(error, 'send notification')
    return fromNotificationRow(data)
  },

  async markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (error) return handleError(error, 'markRead notification')
    return true
  },

  async markAllRead(recipientEmail: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_email', recipientEmail)
    if (error) return handleError(error, 'markAllRead notifications')
    return true
  },

  async delete(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) return handleError(error, 'delete notification')
    return true
  },

  async deleteAll(recipientEmail: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('recipient_email', recipientEmail)
    if (error) return handleError(error, 'deleteAll notifications')
    return true
  },

  subscribeToUser(email: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_v2_${email.replace('@', '_').replace('.', '_')}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_email=eq.${email}`,
      }, callback)
      .subscribe()
  },
}

// ============================================================
// 编号生成（DB 原子递增，并发安全）
// ============================================================
export async function nextInquiryNumber(regionCode: string = 'NA', customerId?: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_inquiry_number', {
    p_region_code: regionCode,
    p_customer_id: customerId ?? null,
  })
  if (error) {
    console.error('[Supabase] next_inquiry_number RPC failed:', error.message)
    throw new Error(`Failed to generate inquiry number: ${error.message}`)
  }
  return data as string
}

// ============================================================
// 询价单（Inquiries）
// ============================================================
export const inquiryService = {
  async getAll() {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll inquiries')
    return (data || []).map(fromInquiryRow)
  },

  async getSubmitted() {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('is_submitted', true)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getSubmitted inquiries')
    return (data || []).map(fromInquiryRow)
  },

  async getByUserEmail(email: string) {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByUserEmail inquiries')
    return (data || []).map(fromInquiryRow)
  },

  async upsert(inquiry: any) {
    const row = toInquiryRow(inquiry)

    const { data, error } = await supabase
      .from('inquiries')
      .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .single()
    if (!error) return fromInquiryRow(data)

    if (error.code === '23505') {
      console.warn('[Supabase] inquiry_number conflict, generating next available number...')
      const prefix = (row.inquiry_number || row.id || '').replace(/-\d{4}$/, '')
      if (!prefix) return handleError(error, 'upsert inquiry (no prefix)')

      const { data: existing } = await supabase
        .from('inquiries')
        .select('inquiry_number')
        .like('inquiry_number', `${prefix}-%`)
        .order('inquiry_number', { ascending: false })
        .limit(1)

      let nextSeq = 1
      if (existing && existing.length > 0) {
        const lastNum = existing[0].inquiry_number
        const seqMatch = lastNum.match(/-(\d{4})$/)
        if (seqMatch) nextSeq = parseInt(seqMatch[1], 10) + 1
      }

      const newNumber = `${prefix}-${String(nextSeq).padStart(4, '0')}`
      const newId = newNumber
      console.log('[Supabase] Retrying with new number:', newNumber)

      const retryRow = { ...row, id: newId, inquiry_number: newNumber }
      const { data: d2, error: e2 } = await supabase
        .from('inquiries')
        .insert(retryRow)
        .select()
        .single()
      if (e2) return handleError(e2, 'upsert inquiry (retry)')
      return fromInquiryRow(d2)
    }
    return handleError(error, 'upsert inquiry')
  },

  async updateStatus(id: string, status: string, extra: Record<string, any> = {}) {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status, ...extra, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return handleError(error, 'updateStatus inquiry')
    return fromInquiryRow(data)
  },

  async delete(id: string) {
    const { error } = await supabase.from('inquiries').delete().eq('id', id)
    if (error) return handleError(error, 'delete inquiry')
    return true
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('inquiries_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, callback)
      .subscribe()
  },
}

// ============================================================
// 数据格式转换（camelCase ↔ snake_case）
// ============================================================
function toContractRow(c: any) {
  return {
    id: c.id,
    contract_number: c.contractNumber,
    quotation_number: c.quotationNumber || null,
    inquiry_number: c.inquiryNumber || null,
    customer_name: c.customerName || '',
    customer_email: c.customerEmail || '',
    customer_company: c.customerCompany || null,
    customer_address: c.customerAddress || null,
    customer_country: c.customerCountry || null,
    sales_person: c.salesPerson || '',
    sales_person_name: c.salesPersonName || null,
    supervisor: c.supervisor || null,
    region: c.region || null,
    products: c.products || [],
    total_amount: c.totalAmount || 0,
    currency: c.currency || 'USD',
    trade_terms: c.tradeTerms || null,
    payment_terms: c.paymentTerms || null,
    deposit_percentage: c.depositPercentage || 30,
    deposit_amount: c.depositAmount || 0,
    balance_percentage: c.balancePercentage || 70,
    balance_amount: c.balanceAmount || 0,
    delivery_time: c.deliveryTime || null,
    port_of_loading: c.portOfLoading || null,
    port_of_destination: c.portOfDestination || null,
    status: c.status || 'draft',
    approval_flow: c.approvalFlow || {},
    approval_history: c.approvalHistory || [],
    approval_notes: c.approvalNotes || null,
    rejection_reason: c.rejectionReason || null,
    deposit_proof: c.depositProof || null,
    remarks: c.remarks || null,
    submitted_at: c.submittedAt || null,
    approved_at: c.approvedAt || null,
    sent_to_customer_at: c.sentToCustomerAt || null,
    customer_confirmed_at: c.customerConfirmedAt || null,
  }
}

function fromContractRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    contractNumber: r.contract_number,
    quotationNumber: r.quotation_number,
    inquiryNumber: r.inquiry_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    customerAddress: r.customer_address,
    customerCountry: r.customer_country,
    salesPerson: r.sales_person,
    salesPersonName: r.sales_person_name,
    supervisor: r.supervisor,
    region: r.region,
    products: r.products || [],
    totalAmount: r.total_amount,
    currency: r.currency,
    tradeTerms: r.trade_terms,
    paymentTerms: r.payment_terms,
    depositPercentage: r.deposit_percentage,
    depositAmount: r.deposit_amount,
    balancePercentage: r.balance_percentage,
    balanceAmount: r.balance_amount,
    deliveryTime: r.delivery_time,
    portOfLoading: r.port_of_loading,
    portOfDestination: r.port_of_destination,
    status: r.status,
    approvalFlow: r.approval_flow || {},
    approvalHistory: r.approval_history || [],
    approvalNotes: r.approval_notes,
    rejectionReason: r.rejection_reason,
    depositProof: r.deposit_proof,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    submittedAt: r.submitted_at,
    approvedAt: r.approved_at,
    sentToCustomerAt: r.sent_to_customer_at,
    customerConfirmedAt: r.customer_confirmed_at,
  }
}

function toOrderRow(o: any) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    customer: o.customer || '',
    customer_email: o.customerEmail || null,
    quotation_id: o.quotationId || null,
    quotation_number: o.quotationNumber || null,
    contract_number: o.contractNumber || null,
    date: o.date || new Date().toISOString().split('T')[0],
    expected_delivery: o.expectedDelivery || null,
    total_amount: o.totalAmount || 0,
    currency: o.currency || 'USD',
    status: o.status || 'Pending',
    progress: o.progress || 0,
    products: o.products || [],
    payment_status: o.paymentStatus || null,
    shipping_method: o.shippingMethod || null,
    tracking_number: o.trackingNumber || null,
    notes: o.notes || null,
    region: o.region || null,
    deposit_payment_proof: o.depositPaymentProof || null,
    balance_payment_proof: o.balancePaymentProof || null,
  }
}

function fromOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    orderNumber: r.order_number,
    customer: r.customer,
    customerEmail: r.customer_email,
    quotationId: r.quotation_id,
    quotationNumber: r.quotation_number,
    contractNumber: r.contract_number,
    date: r.date,
    expectedDelivery: r.expected_delivery,
    totalAmount: r.total_amount,
    currency: r.currency,
    status: r.status,
    progress: r.progress,
    products: r.products || [],
    paymentStatus: r.payment_status,
    shippingMethod: r.shipping_method,
    trackingNumber: r.tracking_number,
    notes: r.notes,
    region: r.region,
    depositPaymentProof: r.deposit_payment_proof,
    balancePaymentProof: r.balance_payment_proof,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toARRow(ar: any) {
  return {
    id: ar.id,
    ar_number: ar.arNumber,
    order_number: ar.orderNumber,
    quotation_number: ar.quotationNumber || null,
    contract_number: ar.contractNumber || null,
    customer_name: ar.customerName || '',
    customer_email: ar.customerEmail || '',
    region: ar.region || null,
    invoice_date: ar.invoiceDate || new Date().toISOString().split('T')[0],
    due_date: ar.dueDate || '',
    total_amount: ar.totalAmount || 0,
    paid_amount: ar.paidAmount || 0,
    remaining_amount: ar.remainingAmount || 0,
    currency: ar.currency || 'USD',
    status: ar.status || 'pending',
    payment_terms: ar.paymentTerms || null,
    products: ar.products || [],
    payment_history: ar.paymentHistory || [],
    deposit_proof: ar.depositProof || null,
    balance_proof: ar.balanceProof || null,
    created_by: ar.createdBy || null,
    notes: ar.notes || null,
  }
}

function fromARRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    arNumber: r.ar_number,
    orderNumber: r.order_number,
    quotationNumber: r.quotation_number,
    contractNumber: r.contract_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    region: r.region,
    invoiceDate: r.invoice_date,
    dueDate: r.due_date,
    totalAmount: r.total_amount,
    paidAmount: r.paid_amount,
    remainingAmount: r.remaining_amount,
    currency: r.currency,
    status: r.status,
    paymentTerms: r.payment_terms,
    products: r.products || [],
    paymentHistory: r.payment_history || [],
    depositProof: r.deposit_proof,
    balanceProof: r.balance_proof,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    createdBy: r.created_by,
    notes: r.notes,
  }
}

// SalesQuotation 转换
function toSalesQuotationRow(q: any) {
  const uuid = toUUID(q.id)
  const customerResponseValue =
    q.customerResponse == null
      ? null
      : (typeof q.customerResponse === 'string'
          ? q.customerResponse
          : JSON.stringify(q.customerResponse));
  const profitRateValue = normalizeProfitRateForStorage(
    q.profitRate ?? q.profit_rate,
    q.totalProfit ?? q.total_profit,
    q.totalCost ?? q.total_cost,
  )
  return {
    id: uuid,
    qt_number: q.qtNumber || q.qt_number,
    quotation_number: q.qtNumber || q.qt_number || uuid,
    qr_number: q.qrNumber || null,
    inq_number: q.inqNumber || null,
    inquiry_number: q.inqNumber || null,
    region: q.region || null,
    customer_name: q.customerName || '',
    customer_email: q.customerEmail || '',
    customer_company: q.customerCompany || null,
    sales_person: q.salesPerson || '',
    sales_person_name: q.salesPersonName || null,
    items: q.items || [],
    total_cost: q.totalCost || 0,
    total_price: q.totalPrice || 0,
    total_amount: q.totalPrice || 0,
    total_profit: q.totalProfit || 0,
    profit_rate: profitRateValue,
    currency: q.currency || 'USD',
    payment_terms: q.paymentTerms || null,
    delivery_terms: q.deliveryTerms || null,
    delivery_date: q.deliveryDate || null,
    delivery_time: q.deliveryDate || null,
    valid_until: q.validUntil || null,
    validity_period: q.validUntil || null,
    version: q.version || 1,
    previous_version: q.previousVersion || null,
    approval_status: q.approvalStatus || 'draft',
    approval_chain: q.approvalChain || [],
    customer_status: q.customerStatus || 'not_sent',
    // 兼容当前线上表结构：使用 customer_response（text/json 文本）
    customer_response: customerResponseValue,
    so_number: q.soNumber || null,
    pushed_to_contract: q.pushedToContract || false,
    pushed_contract_number: q.pushedContractNumber || null,
    pushed_contract_at: q.pushedContractAt || null,
    pushed_by: q.pushedBy || null,
    customer_notes: q.customerNotes || null,
    internal_notes: q.internalNotes || null,
    trade_terms: q.tradeTerms || null,
    pricing_defaults: q.pricingDefaults || q.pricing_defaults || q.globalDefaults || null,
    remarks: q.remarks || null,
    sent_at: q.sentAt || null,
    sent_to_customer: q.customerStatus !== 'not_sent',
    sent_to_customer_at: q.sentAt || null,
    status: q.approvalStatus || 'draft',
    created_by: q.salesPerson || null,
  }
}

function fromSalesQuotationRow(r: any) {
  if (!r) return null
  let parsedCustomerResponse: any = null;
  const responseRaw = r.customer_response_data ?? r.customer_response;
  if (responseRaw != null) {
    if (typeof responseRaw === 'string') {
      try {
        parsedCustomerResponse = JSON.parse(responseRaw);
      } catch {
        parsedCustomerResponse = responseRaw;
      }
    } else {
      parsedCustomerResponse = responseRaw;
    }
  }
  return {
    id: r.id,
    qtNumber: r.qt_number || r.quotation_number,
    qrNumber: r.qr_number,
    inqNumber: r.inq_number || r.inquiry_number,
    region: r.region,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerCompany: r.customer_company,
    salesPerson: r.sales_person,
    salesPersonName: r.sales_person_name,
    items: r.items || [],
    totalCost: r.total_cost || 0,
    totalPrice: r.total_price || r.total_amount || 0,
    totalProfit: r.total_profit || 0,
    profitRate: normalizeProfitRatePercent(r.profit_rate || 0),
    currency: r.currency || 'USD',
    paymentTerms: r.payment_terms,
    deliveryTerms: r.delivery_terms,
    deliveryDate: r.delivery_date || r.delivery_time,
    validUntil: r.valid_until || r.validity_period,
    version: r.version || 1,
    previousVersion: r.previous_version,
    approvalStatus: r.approval_status || 'draft',
    approvalChain: r.approval_chain || [],
    customerStatus: r.customer_status || 'not_sent',
    customerResponse: parsedCustomerResponse,
    soNumber: r.so_number,
    pushedToContract: r.pushed_to_contract || false,
    pushedContractNumber: r.pushed_contract_number,
    pushedContractAt: r.pushed_contract_at,
    pushedBy: r.pushed_by,
    customerNotes: r.customer_notes,
    internalNotes: r.internal_notes,
    tradeTerms: r.trade_terms,
    pricingDefaults: r.pricing_defaults || null,
    globalDefaults: r.pricing_defaults || null, // 兼容旧组件字段名
    remarks: r.remarks,
    sentAt: r.sent_at || r.sent_to_customer_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// Notification 转换
function fromNotificationRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message || '',
    relatedId: r.related_id || r.reference_id,
    relatedType: r.related_type || r.reference_type,
    recipient: r.recipient_email,
    sender: r.sender,
    read: r.is_read || false,
    createdAt: r.created_at_ms || new Date(r.created_at).getTime(),
    metadata: r.metadata,
  }
}

// ============================================================
// 通用区域转换工具（所有表共用）
// DB 统一存 region_code (NA/SA/EA)，前端可能传全名或代码
// ============================================================
export const REGION_NAME_TO_CODE: Record<string, string> = {
  'North America': 'NA', 'north america': 'NA', 'north-america': 'NA',
  'South America': 'SA', 'south america': 'SA', 'south-america': 'SA',
  'Europe & Africa': 'EA', 'europe & africa': 'EA', 'EMEA': 'EA', 'emea': 'EA',
  'NA': 'NA', 'SA': 'SA', 'EA': 'EA',
};

export const REGION_CODE_TO_NAME: Record<string, string> = {
  'NA': 'North America',
  'SA': 'South America',
  'EA': 'Europe & Africa',
};

/** 前端 region 值 → DB region_code */
export function toRegionCode(region: string | null | undefined): string | null {
  if (!region) return null;
  return REGION_NAME_TO_CODE[region] || region;
}

/** DB region_code → 前端 region 值（保持代码格式，不转全名） */
export function fromRegionCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return code; // 前端统一用代码（NA/SA/EA）
}

/** 安全生成 UUID（若传入的 id 不是 UUID 格式则重新生成） */
export function toUUID(id: string | null | undefined): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return crypto.randomUUID();
}

/** UUID 或 null（用于可空的 uuid 外键列） */
export function toUUIDOrNull(id: string | null | undefined): string | null {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return null;
}

/** 日期转 ISO 格式 YYYY-MM-DD */
export function toIsoDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/');
    return `${y}-${m}-${d}`;
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0];
  return String(v);
}

// (salesQuotationService defined above at line ~283, kept there with full methods)

// ============================================================
// supplier_xjs 服务
// ============================================================
// COSUN 单租户固定 ID（对标 Supabase tenants 表）
const COSUN_TENANT_ID = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9';

function toXJRow(x: any) {
  // 严格对标 supplier_xjs 表实际列（Supabase-first）
  // NOT NULL: id, tenant_id, xj_number, supplier_code, supplier_name,
  //           supplier_email, products, status, created_by
  const xjNumber = x.xjNumber || x.xj_number || x.supplierXjNo || x.supplier_xj_no || '';
  return {
    id: toUUID(x.id),
    tenant_id: x.tenant_id || COSUN_TENANT_ID,               // NOT NULL，固定单租户
    xj_number: xjNumber,                                      // NOT NULL，唯一约束键
    supplier_xj_no: x.supplierXjNo || x.supplier_xj_no || null,
    supplier_quotation_no: x.supplierQuotationNo || x.supplier_quotation_no || null,
    source_qr_number: x.sourceQRNumber || x.source_qr_number || null,
    source_inquiry_id: toUUIDOrNull(x.sourceInquiryId || x.source_inquiry_id),
    source_inquiry_number: x.sourceInquiryNumber || x.source_inquiry_number || null,
    requirement_no: x.requirementNo || x.requirement_no || null,
    source_ref: x.sourceRef || x.source_ref || null,
    region_code: toRegionCode(x.region || x.region_code),
    customer_name: x.customerName || x.customer_name || null,
    customer_region: x.customerRegion || x.customer_region || null,
    supplier_company_id: toUUIDOrNull(x.supplierCompanyId || x.supplier_company_id),
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
    expected_date: toIsoDate(x.expectedDate || x.expected_date),
    quotation_deadline: toIsoDate(x.quotationDeadline || x.quotation_deadline),
    due_date: toIsoDate(x.dueDate || x.due_date || x.quotationDeadline || x.quotation_deadline),
    priority: x.priority || 'normal',                         // DB default 是 'normal'
    status: x.status || 'pending',
    quotes: x.quotes || [],
    document_data: x.documentData || x.document_data || null,
    remarks: x.remarks || null,
    created_by: x.createdBy || x.created_by || '',
    source_doc_id: toUUIDOrNull(x.sourceDocId || x.source_doc_id),
    sales_contract_id: toUUIDOrNull(x.salesContractId || x.sales_contract_id),
    root_sales_contract_id: toUUIDOrNull(x.rootSalesContractId || x.root_sales_contract_id),
    display_number: x.displayNumber || x.display_number || xjNumber || null,
  };
}

function fromXJRow(r: any) {
  if (!r) return null;
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
    region: fromRegionCode(r.region_code),
    customerName: r.customer_name,
    customerRegion: r.customer_region,
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
    createdDate: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const xjService = {
  async getAll() {
    const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) return handleError(error, 'getAll supplier_xjs');
    return (data || []).map(fromXJRow);
  },
  async getByEmail(email: string) {
    const { data, error } = await supabase.from('supplier_xjs').select('*').is('deleted_at', null).or(`supplier_email.eq.${email},created_by.eq.${email}`).order('created_at', { ascending: false });
    if (error) return handleError(error, 'getByEmail supplier_xjs');
    return (data || []).map(fromXJRow);
  },
  async upsert(x: any) {
    const row = toXJRow(x);
    // onConflict 同时覆盖 id 和 (tenant_id, xj_number) 两个唯一约束
    const { data, error } = await supabase
      .from('supplier_xjs')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      // 若 id 冲突策略未命中（xj_number 唯一约束触发），尝试按 xj_number 更新
      if (error.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('supplier_xjs')
          .update(row)
          .eq('xj_number', row.xj_number)
          .eq('tenant_id', row.tenant_id)
          .select()
          .single();
        if (updateError) return handleError(updateError, 'upsert supplier_xj (update fallback)');
        return fromXJRow(updated);
      }
      return handleError(error, 'upsert supplier_xj');
    }
    return fromXJRow(data);
  },
  async delete(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const currentEmail = String(session?.user?.email || '').trim().toLowerCase();
    if (currentEmail) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('portal_role, rbac_role')
        .eq('id', session?.user?.id || '')
        .maybeSingle();
      const portalRole = String((profile as any)?.portal_role || '').toLowerCase();
      if (portalRole === 'supplier') {
        return handleError(new Error('supplier cannot delete supplier_xjs'), 'delete supplier_xj forbidden');
      }
    }
    const operatorEmail = session?.user?.email || null;
    const { error } = await supabase
      .from('supplier_xjs')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: operatorEmail,
        deleted_reason: 'manual-delete-ui',
      })
      .eq('id', id);
    if (error) return handleError(error, 'delete supplier_xj');
  },
};

// ============================================================
// quotation_requests 服务
// ============================================================
function toQRRow(q: any) {
  return {
    id: toUUID(q.id),
    request_number: q.requestNumber || q.request_number || '',
    region_code: toRegionCode(q.region || q.region_code),
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
    request_date: toIsoDate(q.requestDate || q.request_date),
    expected_quote_date: toIsoDate(q.expectedQuoteDate || q.expected_quote_date),
    urgency: q.urgency || 'medium',
    xj_ids: q.xjIds || q.xj_ids || [],
    xj_count: q.xjCount || q.xj_count || 0,
    priority: q.priority || 'medium',
    notes: q.notes || null,
  };
}

function fromQRRow(r: any) {
  if (!r) return null;
  return {
    id: r.id,
    requestNumber: r.request_number,
    region: fromRegionCode(r.region_code),
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
    requestDate: r.request_date,
    expectedQuoteDate: r.expected_quote_date,
    urgency: r.urgency || 'medium',
    xjIds: r.xj_ids || [],
    xjCount: r.xj_count || 0,
    priority: r.priority,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const quotationRequestService = {
  async getAll() {
    const { data, error } = await supabase.from('quotation_requests').select('*').is('deleted_at', null).order('created_at', { ascending: false });
    if (error) return handleError(error, 'getAll quotation_requests');
    return (data || []).map(fromQRRow);
  },
  async upsert(q: any) {
    const row = toQRRow(q);
    const { data, error } = await supabase.from('quotation_requests').upsert(row, { onConflict: 'id' }).select().single();
    if (error) return handleError(error, 'upsert quotation_request');
    return fromQRRow(data);
  },
  async delete(id: string) {
    const { error } = await supabase.from('quotation_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) return handleError(error, 'delete quotation_request');
  },
};

// Inquiry 转换（使用顶部统一工具函数）
function toInquiryRow(i: any) {
  // createdAt 可能是毫秒数字或 ISO 字符串，统一转为 ISO 字符串
  const toIso = (v: any) => {
    if (!v) return new Date().toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();
    return String(v);
  };
  // region 存代码（NA/SA/EA），不存全名
  const regionCode = toRegionCode(i.region);
  // id：如果前端传的是询价编号（INQ-格式），生成新 UUID；否则直接用
  const id = (i.id && i.id.startsWith('INQ-'))
    ? crypto.randomUUID()
    : (i.id || crypto.randomUUID());
  return {
    id,
    inquiry_number: i.inquiryNumber || i.id,
    date: toIsoDate(i.date),
    user_email: i.userEmail || '',
    company_id: i.companyId || null,
    region_code: regionCode,
    status: i.status || 'draft',
    is_submitted: i.isSubmitted || false,
    total_price: i.totalPrice || 0,
    message: i.message || null,
    buyer_info: i.buyerInfo || null,
    shipping_info: i.shippingInfo || null,
    container_info: i.containerInfo || null,
    products: i.products || [],
    created_at: toIso(i.createdAt),
    submitted_at: i.submittedAt ? toIso(i.submittedAt) : null,
  }
}

function fromInquiryRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    inquiryNumber: r.inquiry_number,
    date: r.date,
    userEmail: r.user_email,
    companyId: r.company_id,
    region: r.region_code,
    status: r.status || 'draft',
    isSubmitted: r.is_submitted || false,
    totalPrice: r.total_price || 0,
    message: r.message,
    buyerInfo: r.buyer_info,
    shippingInfo: r.shipping_info || { cartons: '0', cbm: '0', totalGrossWeight: '0', totalNetWeight: '0' },
    containerInfo: r.container_info,
    products: r.products || [],
    createdAt: r.created_at,
    submittedAt: r.submitted_at,
  }
}

// ============================================================
// payments 服务
// ============================================================
function toPaymentRow(p: any) {
  return {
    id: toUUID(p.id),
    payment_number: p.paymentNumber || p.payment_number || '',
    order_number: p.orderNumber || p.order_number || null,
    contract_number: p.contractNumber || p.contract_number || null,
    customer_name: p.customerName || p.customer_name || '',
    customer_email: p.customerEmail || p.customer_email || '',
    amount: p.amount || 0,
    currency: p.currency || 'USD',
    payment_type: p.paymentType || p.payment_type || 'deposit',
    payment_method: p.paymentMethod || p.payment_method || null,
    status: p.status || 'pending',
    due_date: toIsoDate(p.dueDate || p.due_date),
    paid_date: toIsoDate(p.paidDate || p.paid_date),
    bank_info: p.bankInfo || p.bank_info || null,
    attachment_url: p.attachmentUrl || p.attachment_url || null,
    notes: p.notes || null,
    created_by: p.createdBy || p.created_by || null,
  }
}

function fromPaymentRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    paymentNumber: r.payment_number,
    orderNumber: r.order_number,
    contractNumber: r.contract_number,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    amount: r.amount || 0,
    currency: r.currency || 'USD',
    paymentType: r.payment_type,
    paymentMethod: r.payment_method,
    status: r.status,
    dueDate: r.due_date,
    paidDate: r.paid_date,
    bankInfo: r.bank_info,
    attachmentUrl: r.attachment_url,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const paymentService = {
  async getAll() {
    const { data, error } = await supabase.from('payments').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll payments')
    return (data || []).map(fromPaymentRow)
  },
  async getByEmail(email: string) {
    const { data, error } = await supabase.from('payments').select('*').is('deleted_at', null).eq('customer_email', email).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getByEmail payments')
    return (data || []).map(fromPaymentRow)
  },
  async upsert(p: any) {
    const row = toPaymentRow(p)
    const { data, error } = await supabase.from('payments').upsert(row, { onConflict: 'id' }).select().single()
    if (error) return handleError(error, 'upsert payment')
    return fromPaymentRow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('payments').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return handleError(error, 'delete payment')
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('payments_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, callback).subscribe()
  },
}

// ============================================================
// purchase_orders 服务
// ============================================================
function toPORow(p: any) {
  return {
    id: toUUID(p.id),
    po_number: p.poNumber || p.po_number || '',
    requirement_no: p.requirementNo || p.requirement_no || null,
    xj_number: p.xjNumber || p.xj_number || null,
    supplier_code: p.supplierCode || p.supplier_code || '',
    supplier_name: p.supplierName || p.supplier_name || '',
    supplier_email: p.supplierEmail || p.supplier_email || '',
    region_code: toRegionCode(p.region || p.region_code),
    items: p.items || p.products || [],
    total_amount: p.totalAmount || p.total_amount || 0,
    currency: p.currency || 'USD',
    payment_terms: p.paymentTerms || p.payment_terms || null,
    delivery_terms: p.deliveryTerms || p.delivery_terms || null,
    expected_delivery_date: toIsoDate(p.expectedDeliveryDate || p.expected_delivery_date),
    status: p.status || 'draft',
    notes: p.notes || null,
    created_by: p.createdBy || p.created_by || null,
  }
}

function fromPORow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    poNumber: r.po_number,
    requirementNo: r.requirement_no,
    xjNumber: r.xj_number,
    supplierCode: r.supplier_code,
    supplierName: r.supplier_name,
    supplierEmail: r.supplier_email,
    region: fromRegionCode(r.region_code),
    items: r.items || [],
    totalAmount: r.total_amount || 0,
    currency: r.currency || 'USD',
    paymentTerms: r.payment_terms,
    deliveryTerms: r.delivery_terms,
    expectedDeliveryDate: r.expected_delivery_date,
    status: r.status,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export const purchaseOrderService = {
  async getAll() {
    const { data, error } = await supabase.from('purchase_orders').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll purchase_orders')
    return (data || []).map(fromPORow)
  },
  async upsert(p: any) {
    const row = toPORow(p)
    const { data, error } = await supabase.from('purchase_orders').upsert(row, { onConflict: 'id' }).select().single()
    if (error) return handleError(error, 'upsert purchase_order')
    return fromPORow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('purchase_orders').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return handleError(error, 'delete purchase_order')
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('purchase_orders_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_orders' }, callback).subscribe()
  },
}

// ============================================================
// purchase_requirements 服务
// ============================================================
function toPRRow(p: any) {
  // DB 列类型对照（purchase_requirements）：
  //   id uuid, requirement_no text, source_inquiry_number text,
  //   region text, urgency text, required_date date, items jsonb,
  //   status text, notes text, created_by uuid(!), assigned_to text,
  //   qr_number text, display_number text, customer_info jsonb
  const reqNo = p.requirementNo || p.requirementNumber || p.requirement_no || p.qr_number || '';

  // created_by 是 uuid 类型，只接受合法 UUID（Supabase user.id）
  // 如果前端传的是 email 字符串，直接丢弃，由 RLS / DB default 填充
  const createdByRaw = p.createdBy || p.created_by || null;
  const createdBy = (createdByRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(createdByRaw))
    ? createdByRaw : null;

  // required_date 是 date 类型，只传 YYYY-MM-DD
  const rawDate = p.requiredDate || p.required_date || null;
  const requiredDate = rawDate ? String(rawDate).split('T')[0] : null;

  return {
    id: toUUID(p.id),                          // toUUID 会对非 UUID 生成新随机 UUID
    requirement_no: reqNo,
    source_inquiry_number: p.sourceInquiryNumber || p.source_inquiry_number || null,
    source_so_number: p.sourceSoNumber || p.source_so_number || null,
    region: p.region || null,
    urgency: p.urgency || 'medium',
    required_date: requiredDate,
    items: (p.items || p.products || []).map((item: any) => ({
      ...item,
      // 写入时确保每个 item 有合法 UUID，Supabase 即为唯一数据源，无需前端兜底
      id: (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(item.id)))
        ? item.id
        : crypto.randomUUID(),
    })),
    status: (['pending','in_progress','completed','cancelled','partial','processing','submitted','quoted','draft'].includes(p.status) ? p.status : 'pending'),
    notes: p.notes || p.specialRequirements || p.special_requirements || null,
    purchaser_feedback: p.purchaserFeedback || p.purchaser_feedback || null,
    pushed_to_quotation: p.pushedToQuotation ?? p.pushed_to_quotation ?? false,
    pushed_to_quotation_at: p.pushedToQuotationDate || p.pushed_to_quotation_at || null,
    pushed_by: p.pushedBy || p.pushed_by || null,
    quotation_number: p.quotationNumber || p.quotation_number || null,
    created_by: createdBy,
    assigned_to: p.assignedTo || p.assigned_to || null,
    qr_number: reqNo || null,
    display_number: reqNo || null,
    customer_info: p.customer || p.customer_info || null,
  }
}

function fromPRRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    requirementNo: r.requirement_no || r.qr_number || '',
    requirementNumber: r.requirement_no || r.qr_number || '',
    sourceInquiryNumber: r.source_inquiry_number,
    sourceSoNumber: r.source_so_number,
    region: r.region,
    urgency: r.urgency || 'medium',
    requiredDate: r.required_date,
    items: r.items || [],
    status: r.status || 'pending',
    notes: r.notes,
    purchaserFeedback: r.purchaser_feedback || null,
    pushedToQuotation: r.pushed_to_quotation || false,
    pushedToQuotationDate: r.pushed_to_quotation_at || null,
    pushedBy: r.pushed_by || null,
    quotationNumber: r.quotation_number || null,
    createdBy: r.created_by,   // uuid，不是 email
    assignedTo: r.assigned_to,
    createdDate: r.created_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: r.customer_info || null,
  }
}

export const purchaseRequirementService = {
  async getAll() {
    const { data, error } = await supabase.from('purchase_requirements').select('*').is('deleted_at', null).order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll purchase_requirements')
    return (data || []).map(fromPRRow)
  },
  async upsert(p: any) {
    const row = toPRRow(p)
    const { data, error } = await upsertWithSchemaFallback(
      'purchase_requirements',
      row,
      'id',
      'upsert purchase_requirement',
    )
    if (error) return handleError(error, 'upsert purchase_requirement')
    return fromPRRow(data)
  },
  async delete(id: string) {
    const { error } = await supabase.from('purchase_requirements').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) return handleError(error, 'delete purchase_requirement')
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('purchase_requirements_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_requirements' }, callback).subscribe()
  },
}

// ============================================================
// approval_records 服务（扩展版）
// ============================================================
export const approvalRecordService = {
  async getAll() {
    const { data, error } = await supabase.from('approval_records').select('*').order('created_at', { ascending: false })
    if (error) return handleError(error, 'getAll approval_records')
    return (data || []).map(fromApprovalRow)
  },
  async getForApprover(email: string) {
    const { data, error } = await supabase
      .from('approval_records')
      .select('*')
      .or(`current_approver.eq.${email},submitted_by.eq.${email},actor_email.eq.${email}`)
      .order('created_at', { ascending: false })
    if (error) return handleError(error, 'getForApprover approval_records')
    return (data || []).map(fromApprovalRow)
  },
  async upsert(record: any) {
    const docId = record.relatedDocumentId || record.related_document_id || ''
    const submitter = record.submittedBy || record.submitted_by || ''
    const submitterRole = record.submittedByRole || record.submitted_by_role || ''
    const statusVal = record.status || 'pending'
    const row = {
      id: toUUID(record.id),
      // 新字段（业务流程）
      type: record.type || 'quotation',
      related_document_id: docId,
      related_document_type: record.relatedDocumentType || record.related_document_type || '',
      related_document: record.relatedDocument || record.related_document || null,
      submitted_by: submitter,
      submitted_by_name: record.submittedByName || record.submitted_by_name || '',
      submitted_by_role: submitterRole,
      submitted_at: record.submittedAt || record.submitted_at || new Date().toISOString(),
      region: toRegionCode(record.region),
      current_approver: record.currentApprover || record.current_approver || '',
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
      approval_history: record.approvalHistory || record.approval_history || [],
      deadline: record.deadline || null,
      // 兼容旧字段（DB 原始列，保持同步）
      entity_type: record.type || 'quotation',
      entity_id: docId,
      entity_number: docId,
      action: statusVal,
      actor_email: submitter,
      actor_role: submitterRole,
      status_before: record.previousStatus || null,
      status_after: statusVal,
    }
    const { data, error } = await supabase.from('approval_records').upsert(row, { onConflict: 'id' }).select().single()
    if (error) return handleError(error, 'upsert approval_record')
    return fromApprovalRow(data)
  },
  async updateStatus(id: string, status: string, history: any[]) {
    const { data, error } = await supabase.from('approval_records').update({ status, approval_history: history, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return handleError(error, 'updateStatus approval_record')
    return fromApprovalRow(data)
  },
  subscribeToChanges(email: string, callback: (payload: any) => void) {
    return supabase.channel(`approval_records_${email}`).on('postgres_changes', { event: '*', schema: 'public', table: 'approval_records' }, callback).subscribe()
  },
}

function fromApprovalRow(r: any) {
  if (!r) return null
  // 兼容新旧两套字段名
  return {
    id: r.id,
    type: r.type || r.entity_type || 'quotation',
    relatedDocumentId: r.related_document_id || r.entity_id || '',
    relatedDocumentType: r.related_document_type || r.entity_type || '',
    relatedDocument: r.related_document || null,
    submittedBy: r.submitted_by || r.actor_email || '',
    submittedByName: r.submitted_by_name || '',
    submittedByRole: r.submitted_by_role || r.actor_role || '',
    submittedAt: r.submitted_at || r.created_at || '',
    region: r.region || '',
    currentApprover: r.current_approver || '',
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
    productSummary: r.product_summary || '',
    approvalHistory: r.approval_history || [],
    deadline: r.deadline || '',
    expiresIn: 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

// ============================================================
// supplier_quotations 服务
// ============================================================
function toSQRow(q: any) {
  const sourceItems = (Array.isArray(q.items) && q.items.length > 0)
    ? q.items
    : (Array.isArray(q.products) ? q.products : []);
  const normalizedProducts = sourceItems.map((it: any) => {
    const qty = Number(it?.quantity ?? 0);
    const unitPriceRaw = it?.unitPrice ?? it?.price ?? null;
    const unitPrice = unitPriceRaw != null && Number.isFinite(Number(unitPriceRaw))
      ? Number(unitPriceRaw)
      : null;
    const amountRaw = it?.amount ?? it?.lineAmount ?? null;
    const amount = amountRaw != null && Number.isFinite(Number(amountRaw))
      ? Number(amountRaw)
      : (unitPrice != null && qty > 0 ? unitPrice * qty : null);
    return {
      ...it,
      quantity: qty,
      unitPrice,
      amount,
    };
  });

  return {
    id: toUUID(q.id),
    // BJ 编号：quotationNo / quotationNumber / bjNumber 三者取一
    quotation_number: q.quotationNumber || q.quotationNo || q.bj_number || q.quotation_number || null,
    bj_number:        q.bjNumber || q.quotationNo || q.quotationNumber || q.bj_number || null,
    display_number:   q.displayNumber || q.display_number || null,
    supplier_code:    q.supplierCode || q.supplier_code || null,
    supplier_name:    q.supplierName || q.supplier_name || null,
    supplier_email:   q.supplierEmail || q.supplier_email || '',
    supplier_company: q.supplierCompany || q.supplier_company || null,
    // XJ 溯源
    source_xj_number: q.sourceXJNumber || q.sourceXJ || q.xjNumber || q.source_xj_number || null,
    source_xj_id:     toUUIDOrNull(q.sourceXJId || q.xjId || q.source_xj_id),
    // QR 溯源
    source_qr_number: q.sourceQR || q.sourceQRNumber || q.source_qr_number || null,
    region_code:      q.regionCode || q.region_code || null,
    products:         normalizedProducts,
    total_amount:     q.totalAmount || q.total_amount || 0,
    currency:         q.currency || 'CNY',
    quotation_date:   q.quotationDate || q.quotation_date || null,
    valid_until:      q.validUntil || q.valid_until || null,
    payment_terms:    q.paymentTerms || q.payment_terms || null,
    delivery_terms:   q.deliveryTerms || q.delivery_terms || null,
    status:           q.status || 'draft',
    notes:            q.notes || q.generalRemarks || null,
    created_by:       q.createdBy || q.created_by || null,
    source_doc_id:              toUUIDOrNull(q.sourceDocId || q.source_doc_id),
    sales_contract_id:          toUUIDOrNull(q.salesContractId || q.sales_contract_id),
    root_sales_contract_id:     toUUIDOrNull(q.rootSalesContractId || q.root_sales_contract_id),
  };
}

function fromSQRow(r: any) {
  if (!r) return null;
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
    xjNumber: r.source_xj_number,       // 向后兼容
    sourceXJId: r.source_xj_id,
    xjId: r.source_xj_id,               // 向后兼容
    regionCode: r.region_code,
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
  };
}

export const supplierQuotationService = {
  async getAll() {
    let { data, error } = await supabase
      .from('supplier_quotations')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    // 兼容旧环境：若 deleted_at 列不存在，则降级为不带 deleted_at 过滤
    if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
      const retry = await supabase
        .from('supplier_quotations')
        .select('*')
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }
    if (error) return handleError(error, 'getAll supplier_quotations');
    return (data || []).map(fromSQRow);
  },
  async getBySupplierEmail(email: string) {
    const normalized = String(email || '').trim().toLowerCase();
    const bySupplierEmail = `supplier_email.ilike.%${normalized}%`;
    const byCreatedBy = `created_by.ilike.%${normalized}%`;
    const bySupplierCode = `supplier_code.ilike.%${normalized}%`;

    let { data, error } = await supabase
      .from('supplier_quotations')
      .select('*')
      .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    // 兼容旧环境：若 deleted_at 列不存在，则降级为不带 deleted_at 过滤
    if (error && (error.code === '42703' || String(error.message || '').includes('deleted_at'))) {
      const retry = await supabase
        .from('supplier_quotations')
        .select('*')
        .or(`${bySupplierEmail},${byCreatedBy},${bySupplierCode}`)
        .order('created_at', { ascending: false });
      data = retry.data;
      error = retry.error;
    }
    if (error) return handleError(error, 'getBySupplierEmail supplier_quotations');
    return (data || []).map(fromSQRow);
  },
  async upsert(q: any) {
    const row = toSQRow(q);
    const { data, error } = await supabase.from('supplier_quotations').upsert(row, { onConflict: 'id' }).select().single();
    if (error) return handleError(error, 'upsert supplier_quotation');
    return fromSQRow(data);
  },
  async delete(id: string) {
    const { error } = await supabase.from('supplier_quotations').delete().eq('id', id);
    if (error) return handleError(error, 'delete supplier_quotation');
  },
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase.channel('supplier_quotations_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_quotations' }, callback).subscribe();
  },
};

// ─── companies 表（供应商 / 客户统一主档）───────────────────────────────────
const COSUN_TENANT_ID_COMPANIES = '3683e7c6-8c05-4074-8a58-5e9e599ff4b9';

function fromCompanyRow(r: any) {
  if (!r) return null;
  return {
    // 与前端 Supplier interface 保持字段对齐
    id: r.id,
    code: r.code || '',
    name: r.name || '',
    nameEn: r.name_en || '',
    level: (r.supplier_level || 'C') as 'A' | 'B' | 'C',
    category: r.supplier_category || r.industry || '',
    region: r.region || '',
    businessTypes: r.business_types || [],
    contact: r.notes?.replace(/^联系人：/, '') || '',
    phone: r.main_phone || '',
    email: r.main_email || '',
    address: r.address || '',
    certifications: r.certifications || [],
    cooperationYears: r.cooperation_years || 0,
    onTimeRate: Number(r.on_time_rate) || 0,
    qualityRate: Number(r.quality_rate) || 0,
    status: (r.status || 'active') as 'active' | 'inactive' | 'suspended',
    capacity: r.production_capacity || '',
    logoUrl: r.logo_url || undefined,
    // 额外字段（companies 表有但 Supplier interface 无）
    partyType: r.party_type,
    tenantId: r.tenant_id,
  };
}

export const companyService = {
  /** 获取所有供应商（party_type = supplier） */
  async getSuppliers() {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .order('code', { ascending: true });
    if (error) return handleError(error, 'getSuppliers companies');
    return (data || []).map(fromCompanyRow);
  },
  /** 按关键词搜索供应商（名称/code/email/类别） */
  async searchSuppliers(keyword: string) {
    if (!keyword.trim()) return this.getSuppliers();
    const kw = `%${keyword.trim()}%`;
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('party_type', 'supplier')
      .is('deleted_at', null)
      .or(`name.ilike.${kw},name_en.ilike.${kw},code.ilike.${kw},main_email.ilike.${kw},supplier_category.ilike.${kw}`)
      .order('code', { ascending: true });
    if (error) return handleError(error, 'searchSuppliers companies');
    return (data || []).map(fromCompanyRow);
  },
  /** 按 email 精确查找 */
  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', COSUN_TENANT_ID_COMPANIES)
      .eq('main_email', email)
      .is('deleted_at', null)
      .single();
    if (error) return null;
    return fromCompanyRow(data);
  },
};
