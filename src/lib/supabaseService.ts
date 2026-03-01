import { supabase } from './supabase'

// ============================================================
// 通用错误处理
// ============================================================
function handleError(error: any, context: string) {
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  return null
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
    const { data, error } = await supabase
      .from('sales_quotations')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) return handleError(error, 'upsert salesQuotation')
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
    // 先尝试按 id upsert
    const { data, error } = await supabase
      .from('inquiries')
      .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
      .select()
      .single()
    if (!error) return fromInquiryRow(data)
    // inquiry_number unique 冲突：改为按 inquiry_number 更新
    if (error.code === '23505') {
      const { data: updated, error: err2 } = await supabase
        .from('inquiries')
        .update({ ...row, updated_at: new Date().toISOString() })
        .eq('inquiry_number', row.inquiry_number)
        .select()
        .single()
      if (err2) return handleError(err2, 'upsert inquiry (by inquiry_number)')
      return fromInquiryRow(updated)
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
  return {
    id: q.id,
    qt_number: q.qtNumber,
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
    profit_rate: q.profitRate || 0,
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
    customer_response_data: q.customerResponse || null,
    so_number: q.soNumber || null,
    pushed_to_contract: q.pushedToContract || false,
    pushed_contract_number: q.pushedContractNumber || null,
    pushed_contract_at: q.pushedContractAt || null,
    pushed_by: q.pushedBy || null,
    customer_notes: q.customerNotes || null,
    internal_notes: q.internalNotes || null,
    trade_terms: q.tradeTerms || null,
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
    profitRate: r.profit_rate || 0,
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
    customerResponse: r.customer_response_data,
    soNumber: r.so_number,
    pushedToContract: r.pushed_to_contract || false,
    pushedContractNumber: r.pushed_contract_number,
    pushedContractAt: r.pushed_contract_at,
    pushedBy: r.pushed_by,
    customerNotes: r.customer_notes,
    internalNotes: r.internal_notes,
    tradeTerms: r.trade_terms,
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

// Inquiry 转换
function toInquiryRow(i: any) {
  // createdAt 可能是毫秒数字或 ISO 字符串，统一转为 ISO 字符串
  const toIso = (v: any) => {
    if (!v) return new Date().toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();
    return String(v);
  };
  return {
    id: i.id,
    inquiry_number: i.inquiryNumber || i.id,
    date: i.date || new Date().toISOString().split('T')[0],
    user_email: i.userEmail || '',
    company_id: i.companyId || null,
    region: i.region || null,
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
    region: r.region,
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
