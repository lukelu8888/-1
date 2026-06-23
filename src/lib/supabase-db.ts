/**
 * Supabase 数据服务层
 * 提供所有 ERP 核心数据的 CRUD 操作，替代 localStorage
 * 兼容现有数据结构，支持 localStorage 降级回退
 */

import { supabase } from './supabase';
import { getPersistableSalesContractStatus, normalizeCustomerContractStatus } from './customerPortalContractStatus';

// ─── 通用工具 ─────────────────────────────────────────────────

const isOnline = () => navigator.onLine;

async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  fallback: T
): Promise<T> {
  if (!isOnline()) return fallback;
  try {
    const { data, error } = await queryFn();
    if (error) {
      console.warn('[Supabase]', error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (e) {
    console.warn('[Supabase] query failed:', e);
    return fallback;
  }
}

function isMissingColumnError(error: any, column: string): boolean {
  const message = String(error?.message || '');
  return error?.code === '42703' || message.includes(column);
}

function matchesCustomerEmailFallback(row: Record<string, any> | null | undefined, email: string): boolean {
  if (!row || !email) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const candidates = [
    row.customer_email,
    row.customerEmail,
    row.email,
    row.customer?.email,
    row.customer?.customer_email,
    row.contact_email,
    row.bill_to_email,
    row.billing_email,
  ];
  return candidates.some((candidate) => String(candidate || '').trim().toLowerCase() === normalizedEmail);
}

// ─── 销售合同 ─────────────────────────────────────────────────

export const salesContractsDb = {
  async getAll(): Promise<any[]> {
    return safeQuery(
      () => supabase.from('sales_contracts').select('*').order('created_at', { ascending: false }),
      []
    );
  },

  async getByCustomer(email: string): Promise<any[]> {
    return safeQuery(
      () => supabase.from('sales_contracts').select('*').eq('customer_email', email).order('created_at', { ascending: false }),
      []
    );
  },

  async getById(id: string): Promise<any | null> {
    return safeQuery(
      () => supabase.from('sales_contracts').select('*').eq('id', id).maybeSingle(),
      null
    );
  },

  async getByContractNumber(contractNumber: string): Promise<any | null> {
    return safeQuery(
      () => supabase.from('sales_contracts').select('*').eq('contract_number', contractNumber).maybeSingle(),
      null
    );
  },

  async upsert(contract: any): Promise<any | null> {
    const row = toContractRow(contract);
    const { data, error } = await supabase
      .from('sales_contracts')
      .upsert(row, { onConflict: 'contract_number' })
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] upsert contract:', error.message); return null; }
    return data;
  },

  async updateStatus(contractNumber: string, status: string, extra: Record<string, any> = {}): Promise<boolean> {
    const logicalStatus = normalizeCustomerContractStatus(status);
    const persistedStatus = getPersistableSalesContractStatus(logicalStatus);
    const existingRenderMeta = extra.documentRenderMeta || extra.document_render_meta || {};
    const { error } = await supabase
      .from('sales_contracts')
      .update({
        ...extra,
        status: persistedStatus,
        document_render_meta: {
          ...existingRenderMeta,
          erpWorkflow: {
            ...(existingRenderMeta?.erpWorkflow || {}),
            logicalStatus,
            persistedStatus,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('contract_number', contractNumber);
    if (error) { console.warn('[Supabase] update contract status:', error.message); return false; }
    return true;
  },

  async delete(contractNumber: string): Promise<boolean> {
    const { error } = await supabase
      .from('sales_contracts')
      .delete()
      .eq('contract_number', contractNumber);
    if (error) { console.warn('[Supabase] delete contract:', error.message); return false; }
    return true;
  },

  subscribeChanges(callback: (payload: any) => void) {
    return supabase
      .channel('sales_contracts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_contracts' }, callback)
      .subscribe();
  },
};

// ─── 订单 ─────────────────────────────────────────────────────

export const ordersDb = {
  async getAll(): Promise<any[]> {
    return safeQuery(
      () => supabase.from('orders').select('*').order('created_at', { ascending: false }),
      []
    );
  },

  async getByCustomer(email: string): Promise<any[]> {
    return safeQuery(
      () => supabase.from('orders').select('*').eq('customer_email', email).order('created_at', { ascending: false }),
      []
    );
  },

  async getById(id: string): Promise<any | null> {
    return safeQuery(
      () => supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      null
    );
  },

  async upsert(order: any): Promise<any | null> {
    const row = toOrderRow(order);
    const { data, error } = await supabase
      .from('orders')
      .upsert(row, { onConflict: 'order_number' })
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] upsert order:', error.message); return null; }
    return data;
  },

  async updateStatus(orderNumber: string, status: string, extra: Record<string, any> = {}): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('order_number', orderNumber);
    if (error) { console.warn('[Supabase] update order status:', error.message); return false; }
    return true;
  },

  async delete(orderNumber: string): Promise<boolean> {
    const { error } = await supabase.from('orders').delete().eq('order_number', orderNumber);
    if (error) { console.warn('[Supabase] delete order:', error.message); return false; }
    return true;
  },

  subscribeChanges(callback: (payload: any) => void, customerEmail?: string) {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          ...(customerEmail ? { filter: `customer_email=eq.${customerEmail}` } : {}),
        },
        callback
      )
      .subscribe();
    return channel;
  },
};

// ─── 应收账款 ─────────────────────────────────────────────────

export const accountsReceivableDb = {
  async getAll(): Promise<any[]> {
    return safeQuery(
      () => supabase.from('accounts_receivable').select('*').order('created_at', { ascending: false }),
      []
    );
  },

  async getByCustomer(email: string): Promise<any[]> {
    if (!isOnline()) return [];
    try {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

      if (!error) return data ?? [];

      if (isMissingColumnError(error, 'customer_email')) {
        console.warn('[Supabase] accountsReceivableDb.getByCustomer fallback: customer_email column unavailable');
        const { data: allRows, error: fallbackError } = await supabase
          .from('accounts_receivable')
          .select('*')
          .order('created_at', { ascending: false });
        if (fallbackError) {
          console.warn('[Supabase]', fallbackError.message);
          return [];
        }
        return (allRows || []).filter((row) => matchesCustomerEmailFallback(row, email));
      }

      console.warn('[Supabase]', error.message);
      return [];
    } catch (e) {
      console.warn('[Supabase] query failed:', e);
      return [];
    }
  },

  async getByOrderNumber(orderNumber: string): Promise<any | null> {
    return safeQuery(
      () => supabase.from('accounts_receivable').select('*').eq('order_number', orderNumber).maybeSingle(),
      null
    );
  },

  async upsert(ar: any): Promise<any | null> {
    const row = toARRow(ar);
    const { data, error } = await supabase
      .from('accounts_receivable')
      .upsert(row, { onConflict: 'ar_number' })
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] upsert AR:', error.message); return null; }
    return data;
  },

  async updateByOrderNumber(orderNumber: string, updates: Record<string, any>): Promise<boolean> {
    const { error } = await supabase
      .from('accounts_receivable')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('order_number', orderNumber);
    if (error) { console.warn('[Supabase] update AR:', error.message); return false; }
    return true;
  },

  subscribeChanges(callback: (payload: any) => void) {
    return supabase
      .channel('ar_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts_receivable' }, callback)
      .subscribe();
  },
};

// ─── 销售报价单 ───────────────────────────────────────────────

export const salesQuotationsDb = {
  async getAll(): Promise<any[]> {
    return safeQuery(
      () => supabase.from('sales_quotations').select('*').order('created_at', { ascending: false }),
      []
    );
  },

  async getByCustomer(email: string): Promise<any[]> {
    return safeQuery(
      () => supabase.from('sales_quotations').select('*').eq('customer_email', email).order('created_at', { ascending: false }),
      []
    );
  },

  async upsert(quotation: any): Promise<any | null> {
    const row = toQuotationRow(quotation);
    const { data, error } = await supabase
      .from('sales_quotations')
      .upsert(row, { onConflict: 'quotation_number' })
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] upsert quotation:', error.message); return null; }
    return data;
  },

  async updateStatus(quotationNumber: string, status: string, extra: Record<string, any> = {}): Promise<boolean> {
    const { error } = await supabase
      .from('sales_quotations')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('quotation_number', quotationNumber);
    if (error) { console.warn('[Supabase] update quotation status:', error.message); return false; }
    return true;
  },

  subscribeChanges(callback: (payload: any) => void) {
    return supabase
      .channel('quotations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_quotations' }, callback)
      .subscribe();
  },
};

// ─── 审批记录 ─────────────────────────────────────────────────

export const approvalRecordsDb = {
  async getPendingForApprover(approverEmail: string): Promise<any[]> {
    return safeQuery(
      () => supabase
        .from('approval_records')
        .select('*')
        .eq('approver', approverEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      []
    );
  },

  async create(record: {
    record_type: 'sales_quotation' | 'sales_contract' | 'purchase_order';
    reference_id: string;
    reference_number: string;
    title: string;
    description?: string;
    requested_by: string;
    requested_by_name?: string;
    approver: string;
  }): Promise<any | null> {
    const { data, error } = await supabase
      .from('approval_records')
      .insert({ ...record, status: 'pending' })
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] create approval record:', error.message); return null; }
    return data;
  },

  async approve(id: string, notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('approval_records')
      .update({ status: 'approved', notes, approved_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { console.warn('[Supabase] approve record:', error.message); return false; }
    return true;
  },

  async reject(id: string, notes?: string): Promise<boolean> {
    const { error } = await supabase
      .from('approval_records')
      .update({ status: 'rejected', notes })
      .eq('id', id);
    if (error) { console.warn('[Supabase] reject record:', error.message); return false; }
    return true;
  },

  subscribeChanges(approverEmail: string, callback: (payload: any) => void) {
    return supabase
      .channel(`approval_${approverEmail}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'approval_records', filter: `approver=eq.${approverEmail}` },
        callback
      )
      .subscribe();
  },
};

// ─── 通知 ─────────────────────────────────────────────────────

export const notificationsDb = {
  async getForUser(email: string): Promise<any[]> {
    return safeQuery(
      () => supabase
        .from('notifications')
        .select('*')
        .eq('recipient_email', email)
        .order('created_at', { ascending: false })
        .limit(50),
      []
    );
  },

  async send(notification: {
    recipient_email: string;
    title: string;
    message: string;
    type?: string;
    reference_id?: string;
    reference_type?: string;
  }): Promise<boolean> {
    const { error } = await supabase.from('notifications').insert(notification);
    if (error) { console.warn('[Supabase] send notification:', error.message); return false; }
    return true;
  },

  async markRead(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error) { console.warn('[Supabase] mark notification read:', error.message); return false; }
    return true;
  },

  async markAllRead(email: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_email', email)
      .eq('read', false);
    if (error) { console.warn('[Supabase] mark all read:', error.message); return false; }
    return true;
  },

  subscribeForUser(email: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications_${email}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_email=eq.${email}` },
        callback
      )
      .subscribe();
  },
};

// ─── 数据映射：前端对象 → 数据库行 ────────────────────────────

function toContractRow(c: any): any {
  const logicalStatus = normalizeCustomerContractStatus(c);
  const persistedStatus = getPersistableSalesContractStatus(logicalStatus);
  const existingRenderMeta = c.documentRenderMeta || c.document_render_meta || {};
  return {
    id: c.id,
    contract_number: c.contractNumber || c.contract_number,
    quotation_number: c.quotationNumber || c.quotation_number || null,
    inquiry_number: c.inquiryNumber || c.inquiry_number || null,
    customer_name: c.customerName || c.customer_name || '',
    customer_email: c.customerEmail || c.customer_email || '',
    customer_company: c.customerCompany || c.customer_company || null,
    customer_address: c.customerAddress || c.customer_address || null,
    customer_country: c.customerCountry || c.customer_country || null,
    contact_person: c.contactPerson || c.contact_person || null,
    contact_phone: c.contactPhone || c.contact_phone || null,
    sales_person: c.salesPerson || c.sales_person || null,
    sales_person_name: c.salesPersonName || c.sales_person_name || null,
    owner_user_id: c.ownerUserId || c.owner_user_id || null,
    owner_email: c.ownerEmail || c.owner_email || c.salesPerson || c.sales_person || null,
    owner_name: c.ownerName || c.owner_name || c.salesPersonName || c.sales_person_name || null,
    owner_role: c.ownerRole || c.owner_role || null,
    operator_user_id: c.operatorUserId || c.operator_user_id || null,
    operator_email: c.operatorEmail || c.operator_email || null,
    operator_role: c.operatorRole || c.operator_role || null,
    acting_user_id: c.actingUserId || c.acting_user_id || null,
    acting_user_email: c.actingUserEmail || c.acting_user_email || null,
    acting_user_role: c.actingUserRole || c.acting_user_role || null,
    authenticated_user_id: c.authenticatedUserId || c.authenticated_user_id || null,
    authenticated_user_email: c.authenticatedUserEmail || c.authenticated_user_email || null,
    authenticated_user_role: c.authenticatedUserRole || c.authenticated_user_role || null,
    supervisor: c.supervisor || null,
    region: c.region || null,
    products: c.products || [],
    total_amount: c.totalAmount || c.total_amount || 0,
    currency: c.currency || 'USD',
    trade_terms: c.tradeTerms || c.trade_terms || null,
    payment_terms: c.paymentTerms || c.payment_terms || null,
    payment_mode: c.paymentMode || c.payment_mode || null,
    balance_trigger: c.balanceTrigger || c.balance_trigger || null,
    sc_type: c.scType || c.sc_type || null,
    exceptional_clause_flag: c.exceptionalClauseFlag ?? c.exceptional_clause_flag ?? false,
    exceptional_clause_notes: c.exceptionalClauseNotes || c.exceptional_clause_notes || null,
    special_account_period_flag: c.specialAccountPeriodFlag ?? c.special_account_period_flag ?? false,
    strategic_customer_flag: c.strategicCustomerFlag ?? c.strategic_customer_flag ?? false,
    sc_last_approval_at: c.scLastApprovalAt || c.sc_last_approval_at || null,
    deposit_percentage: c.depositPercentage ?? c.deposit_percentage ?? 30,
    deposit_amount: c.depositAmount || c.deposit_amount || 0,
    balance_percentage: c.balancePercentage ?? c.balance_percentage ?? 70,
    balance_amount: c.balanceAmount || c.balance_amount || 0,
    delivery_time: c.deliveryTime || c.delivery_time || null,
    port_of_loading: c.portOfLoading || c.port_of_loading || null,
    port_of_destination: c.portOfDestination || c.port_of_destination || null,
    packing: c.packing || null,
    status: persistedStatus,
    approval_flow: c.approvalFlow || c.approval_flow || null,
    approval_history: c.approvalHistory || c.approval_history || [],
    approval_notes: c.approvalNotes || c.approval_notes || null,
    rejection_reason: c.rejectionReason || c.rejection_reason || null,
    deposit_proof: c.depositProof || c.deposit_proof || null,
    deposit_confirmed_by: c.depositConfirmedBy || c.deposit_confirmed_by || null,
    deposit_confirmed_at: c.depositConfirmedAt || c.deposit_confirmed_at || null,
    deposit_confirm_notes: c.depositConfirmNotes || c.deposit_confirm_notes || null,
    purchase_order_numbers: c.purchaseOrderNumbers || c.purchase_order_numbers || null,
    seller_signature: c.sellerSignature || c.seller_signature || null,
    buyer_signature: c.buyerSignature || c.buyer_signature || null,
    remarks: c.remarks || null,
    attachments: c.attachments || [],
    created_by: c.createdBy || c.created_by || null,
    created_at: c.createdAt || c.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    submitted_at: c.submittedAt || c.submitted_at || null,
    approved_at: c.approvedAt || c.approved_at || null,
    sent_to_customer_at: c.sentToCustomerAt || c.sent_to_customer_at || null,
    customer_confirmed_at: c.customerConfirmedAt || c.customer_confirmed_at || null,
    document_render_meta: {
      ...existingRenderMeta,
      erpWorkflow: {
        ...(existingRenderMeta?.erpWorkflow || {}),
        logicalStatus,
        persistedStatus,
      },
    },
  };
}

function toOrderRow(o: any): any {
  return {
    id: o.id,
    order_number: o.orderNumber || o.order_number,
    customer: o.customer || '',
    customer_email: o.customerEmail || o.customer_email || null,
    quotation_id: o.quotationId || o.quotation_id || null,
    quotation_number: o.quotationNumber || o.quotation_number || null,
    contract_number: o.contractNumber || o.contract_number || null,
    date: o.date || new Date().toISOString().split('T')[0],
    expected_delivery: o.expectedDelivery || o.expected_delivery || null,
    total_amount: o.totalAmount || o.total_amount || 0,
    currency: o.currency || 'USD',
    status: o.status || 'Pending',
    progress: o.progress || 0,
    products: o.products || [],
    payment_status: o.paymentStatus || o.payment_status || null,
    payment_terms: o.paymentTerms || o.payment_terms || null,
    shipping_method: o.shippingMethod || o.shipping_method || null,
    delivery_terms: o.deliveryTerms || o.delivery_terms || null,
    tracking_number: o.trackingNumber || o.tracking_number || null,
    notes: o.notes || null,
    created_from: o.createdFrom || o.created_from || null,
    region: o.region || null,
    country: o.country || null,
    delivery_address: o.deliveryAddress || o.delivery_address || null,
    contact_person: o.contactPerson || o.contact_person || null,
    phone: o.phone || null,
    customer_feedback: o.customerFeedback || o.customer_feedback || null,
    deposit_payment_proof: o.depositPaymentProof || o.deposit_payment_proof || null,
    deposit_receipt_proof: o.depositReceiptProof || o.deposit_receipt_proof || null,
    balance_payment_proof: o.balancePaymentProof || o.balance_payment_proof || null,
    balance_receipt_proof: o.balanceReceiptProof || o.balance_receipt_proof || null,
    contract_terms: o.contractTerms || o.contract_terms || null,
    confirmed: o.confirmed || false,
    confirmed_at: o.confirmedAt || o.confirmed_at || null,
    confirmed_by: o.confirmedBy || o.confirmed_by || null,
    created_by: o.createdBy || o.created_by || null,
    created_at: o.createdAt || o.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function toARRow(ar: any): any {
  return {
    id: ar.id,
    ar_number: ar.arNumber || ar.ar_number,
    order_number: ar.orderNumber || ar.order_number,
    quotation_number: ar.quotationNumber || ar.quotation_number || null,
    contract_number: ar.contractNumber || ar.contract_number || null,
    customer_name: ar.customerName || ar.customer_name || '',
    customer_email: ar.customerEmail || ar.customer_email || '',
    region: ar.region || null,
    invoice_date: ar.invoiceDate || ar.invoice_date || new Date().toISOString().split('T')[0],
    due_date: ar.dueDate || ar.due_date || new Date().toISOString().split('T')[0],
    total_amount: ar.totalAmount || ar.total_amount || 0,
    paid_amount: ar.paidAmount || ar.paid_amount || 0,
    remaining_amount: ar.remainingAmount || ar.remaining_amount || 0,
    currency: ar.currency || 'USD',
    status: ar.status || 'pending',
    payment_terms: ar.paymentTerms || ar.payment_terms || null,
    products: ar.products || [],
    payment_history: ar.paymentHistory || ar.payment_history || [],
    deposit_proof: ar.depositProof || ar.deposit_proof || null,
    balance_proof: ar.balanceProof || ar.balance_proof || null,
    notes: ar.notes || null,
    created_by: ar.createdBy || ar.created_by || null,
    created_at: ar.createdAt ? new Date(ar.createdAt).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function toQuotationRow(q: any): any {
  return {
    id: q.id,
    quotation_number: q.quotationNumber || q.quotation_number,
    inquiry_number: q.inquiryNumber || q.inquiry_number || null,
    customer_name: q.customerName || q.customer_name || '',
    customer_email: q.customerEmail || q.customer_email || '',
    customer_company: q.customerCompany || q.customer_company || null,
    sales_person: q.salesPerson || q.sales_person || null,
    sales_person_name: q.salesPersonName || q.sales_person_name || null,
    owner_user_id: q.ownerUserId || q.owner_user_id || null,
    owner_email: q.ownerEmail || q.owner_email || q.salesPerson || q.sales_person || null,
    owner_name: q.ownerName || q.owner_name || q.salesPersonName || q.sales_person_name || null,
    owner_role: q.ownerRole || q.owner_role || null,
    operator_user_id: q.operatorUserId || q.operator_user_id || null,
    operator_email: q.operatorEmail || q.operator_email || null,
    operator_role: q.operatorRole || q.operator_role || null,
    acting_user_id: q.actingUserId || q.acting_user_id || null,
    acting_user_email: q.actingUserEmail || q.acting_user_email || null,
    acting_user_role: q.actingUserRole || q.acting_user_role || null,
    authenticated_user_id: q.authenticatedUserId || q.authenticated_user_id || null,
    authenticated_user_email: q.authenticatedUserEmail || q.authenticated_user_email || null,
    authenticated_user_role: q.authenticatedUserRole || q.authenticated_user_role || null,
    supervisor: q.supervisor || null,
    region: q.region || null,
    products: q.products || [],
    total_amount: q.totalAmount || q.total_amount || 0,
    currency: q.currency || 'USD',
    price_type: q.priceType || q.price_type || null,
    profit_margin: q.profitMargin ?? q.profit_margin ?? null,
    payment_terms: q.paymentTerms || q.payment_terms || null,
    payment_mode: q.paymentMode || q.payment_mode || null,
    balance_trigger: q.balanceTrigger || q.balance_trigger || null,
    qt_type: q.qtType || q.qt_type || null,
    special_price_flag: q.specialPriceFlag ?? q.special_price_flag ?? false,
    special_price_reason: q.specialPriceReason || q.special_price_reason || null,
    special_payment_terms_flag: q.specialPaymentTermsFlag ?? q.special_payment_terms_flag ?? false,
    strategic_customer_flag: q.strategicCustomerFlag ?? q.strategic_customer_flag ?? false,
    qt_last_approval_at: q.qtLastApprovalAt || q.qt_last_approval_at || null,
    delivery_time: q.deliveryTime || q.delivery_time || null,
    validity_period: q.validityPeriod || q.validity_period || null,
    status: q.status || 'draft',
    approval_status: q.approvalStatus || q.approval_status || null,
    sent_to_customer: q.sentToCustomer || q.sent_to_customer || false,
    customer_response: q.customerResponse || q.customer_response || null,
    customer_decline_reason: q.customerDeclineReason || q.customer_decline_reason || null,
    created_by: q.createdBy || q.created_by || null,
    created_at: q.createdAt || q.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sent_at: q.sentAt || q.sent_at || null,
    responded_at: q.respondedAt || q.responded_at || null,
  };
}

// ─── 数据库行 → 前端对象（camelCase）─────────────────────────

export function fromContractRow(row: any): any {
  if (!row) return null;
  const projectExecutionBaseline = row.document_render_meta?.projectExecutionBaseline || null;
  const inferredStatus = normalizeCustomerContractStatus(row);
  return {
    id: row.id,
    contractNumber: row.contract_number,
    quotationNumber: row.quotation_number,
    inquiryNumber: row.inquiry_number,
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
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerCompany: row.customer_company,
    customerAddress: row.customer_address,
    customerCountry: row.customer_country,
    contactPerson: row.contact_person,
    contactPhone: row.contact_phone,
    salesPerson: row.sales_person,
    salesPersonName: row.sales_person_name,
    ownerUserId: row.owner_user_id,
    ownerEmail: row.owner_email,
    ownerName: row.owner_name,
    ownerRole: row.owner_role,
    operatorUserId: row.operator_user_id,
    operatorEmail: row.operator_email,
    operatorRole: row.operator_role,
    actingUserId: row.acting_user_id,
    actingUserEmail: row.acting_user_email,
    actingUserRole: row.acting_user_role,
    authenticatedUserId: row.authenticated_user_id,
    authenticatedUserEmail: row.authenticated_user_email,
    authenticatedUserRole: row.authenticated_user_role,
    supervisor: row.supervisor,
    region: row.region,
    products: row.products || [],
    totalAmount: row.total_amount,
    currency: row.currency,
    tradeTerms: row.trade_terms,
    paymentTerms: row.payment_terms,
    paymentMode: row.payment_mode || null,
    balanceTrigger: row.balance_trigger || null,
    scType: row.sc_type || null,
    exceptionalClauseFlag: Boolean(row.exceptional_clause_flag),
    exceptionalClauseNotes: row.exceptional_clause_notes || null,
    specialAccountPeriodFlag: Boolean(row.special_account_period_flag),
    strategicCustomerFlag: Boolean(row.strategic_customer_flag),
    scLastApprovalAt: row.sc_last_approval_at || null,
    depositPercentage: row.deposit_percentage,
    depositAmount: row.deposit_amount,
    balancePercentage: row.balance_percentage,
    balanceAmount: row.balance_amount,
    additionalCost: row.additional_cost ?? 0,
    fxRates: row.fx_rates ?? {},
    profitSnapshot: row.profit_snapshot ?? null,
    deliveryTime: row.delivery_time,
    portOfLoading: row.port_of_loading,
    portOfDestination: row.port_of_destination,
    packing: row.packing,
    status: inferredStatus,
    approvalFlow: row.approval_flow,
    approvalHistory: row.approval_history || [],
    approvalNotes: row.approval_notes,
    rejectionReason: row.rejection_reason,
    depositProof: row.deposit_proof,
    depositConfirmedBy: row.deposit_confirmed_by,
    depositConfirmedAt: row.deposit_confirmed_at,
    depositConfirmNotes: row.deposit_confirm_notes,
    purchaseOrderNumbers: row.purchase_order_numbers,
    sellerSignature: row.seller_signature,
    buyerSignature: row.buyer_signature,
    customerFeedback: row.customer_feedback || null,
    remarks: row.remarks,
    attachments: row.attachments || [],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    sentToCustomerAt: row.sent_to_customer_at,
    customerConfirmedAt: row.customer_confirmed_at,
    templateId: row.template_id || null,
    templateVersionId: row.template_version_id || null,
    templateSnapshot: row.template_snapshot || {},
    documentDataSnapshot: row.document_data_snapshot || {},
    documentRenderMeta: row.document_render_meta || {},
  };
}

export function fromOrderRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customer: row.customer,
    customerEmail: row.customer_email,
    quotationId: row.quotation_id,
    quotationNumber: row.quotation_number,
    contractNumber: row.contract_number,
    date: row.date,
    expectedDelivery: row.expected_delivery,
    totalAmount: row.total_amount,
    currency: row.currency,
    status: row.status,
    progress: row.progress || 0,
    products: row.products || [],
    paymentStatus: row.payment_status,
    paymentTerms: row.payment_terms,
    shippingMethod: row.shipping_method,
    deliveryTerms: row.delivery_terms,
    trackingNumber: row.tracking_number,
    notes: row.notes,
    createdFrom: row.created_from,
    region: row.region,
    country: row.country,
    deliveryAddress: row.delivery_address,
    contactPerson: row.contact_person,
    phone: row.phone,
    customerFeedback: row.customer_feedback,
    depositPaymentProof: row.deposit_payment_proof,
    depositReceiptProof: row.deposit_receipt_proof,
    balancePaymentProof: row.balance_payment_proof,
    balanceReceiptProof: row.balance_receipt_proof,
    contractTerms: row.contract_terms,
    confirmed: row.confirmed,
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromARRow(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    arNumber: row.ar_number,
    orderNumber: row.order_number,
    quotationNumber: row.quotation_number,
    contractNumber: row.contract_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    region: row.region,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    remainingAmount: row.remaining_amount,
    currency: row.currency,
    status: row.status,
    paymentTerms: row.payment_terms,
    products: row.products || [],
    paymentHistory: row.payment_history || [],
    depositProof: row.deposit_proof,
    balanceProof: row.balance_proof,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: row.updated_at,
  };
}

// ─── 借抬头出口服务 ────────────────────────────────────────────

function rowToExportServiceOrder(row: any): any {
  return {
    id: row.id,
    source: row.source,
    type: row.type,
    customer: row.customer_name,
    customerEmail: row.customer_email ?? undefined,
    region: row.region,
    managerName: row.manager_name ?? undefined,
    salesName: row.sales_name ?? undefined,
    trackerName: row.tracker_name ?? undefined,
    financeName: row.finance_name ?? undefined,
    internalStage: row.internal_stage,
    currentActionRole: row.current_action_role,
    isBlocked: row.is_blocked ?? false,
    isUrgent: row.is_urgent ?? false,
    emailSubject: row.email_subject ?? undefined,
    piNumber: row.pi_number ?? undefined,
    piAmount: row.pi_amount ?? undefined,
    piCurrency: row.pi_currency ?? 'USD',
    piRejectionReason: row.pi_rejection_reason ?? undefined,
    piCustomerFeedback: row.pi_customer_feedback ?? undefined,
    piCustomerDecision: row.pi_customer_decision ?? undefined,
    freightQuotes: row.freight_quotes ?? [],
    confirmedForwarder: row.confirmed_forwarder ?? undefined,
    confirmedFreight: row.confirmed_freight ?? undefined,
    soaAmount: row.soa_amount ?? undefined,
    soaCurrency: row.soa_currency ?? 'USD',
    blNumber: row.bl_number ?? undefined,
    blForwardedAt: row.bl_forwarded_at ?? undefined,
    documents: row.documents ?? [],
    events: row.events ?? [],
    internalNotes: row.internal_notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function exportServiceOrderToRow(patch: any): any {
  const row: any = { updated_at: new Date().toISOString() };
  if (patch.source !== undefined)              row.source = patch.source;
  if (patch.type !== undefined)                row.type = patch.type;
  if (patch.customer !== undefined)            row.customer_name = patch.customer;
  if (patch.customerEmail !== undefined)       row.customer_email = patch.customerEmail;
  if (patch.region !== undefined)              row.region = patch.region;
  if (patch.managerName !== undefined)         row.manager_name = patch.managerName;
  if (patch.salesName !== undefined)           row.sales_name = patch.salesName;
  if (patch.trackerName !== undefined)         row.tracker_name = patch.trackerName;
  if (patch.financeName !== undefined)         row.finance_name = patch.financeName;
  if (patch.internalStage !== undefined)       row.internal_stage = patch.internalStage;
  if (patch.currentActionRole !== undefined)   row.current_action_role = patch.currentActionRole;
  if (patch.isBlocked !== undefined)           row.is_blocked = patch.isBlocked;
  if (patch.isUrgent !== undefined)            row.is_urgent = patch.isUrgent;
  if (patch.emailSubject !== undefined)        row.email_subject = patch.emailSubject;
  if (patch.piNumber !== undefined)            row.pi_number = patch.piNumber;
  if (patch.piAmount !== undefined)            row.pi_amount = patch.piAmount;
  if (patch.piCurrency !== undefined)          row.pi_currency = patch.piCurrency;
  if (patch.piRejectionReason !== undefined)   row.pi_rejection_reason = patch.piRejectionReason;
  if (patch.piCustomerFeedback !== undefined)  row.pi_customer_feedback = patch.piCustomerFeedback;
  if (patch.piCustomerDecision !== undefined)  row.pi_customer_decision = patch.piCustomerDecision;
  if (patch.freightQuotes !== undefined)       row.freight_quotes = patch.freightQuotes;
  if (patch.confirmedForwarder !== undefined)  row.confirmed_forwarder = patch.confirmedForwarder;
  if (patch.confirmedFreight !== undefined)    row.confirmed_freight = patch.confirmedFreight;
  if (patch.soaAmount !== undefined)           row.soa_amount = patch.soaAmount;
  if (patch.soaCurrency !== undefined)         row.soa_currency = patch.soaCurrency;
  if (patch.blNumber !== undefined)            row.bl_number = patch.blNumber;
  if (patch.blForwardedAt !== undefined)       row.bl_forwarded_at = patch.blForwardedAt;
  if (patch.documents !== undefined)           row.documents = patch.documents;
  if (patch.events !== undefined)              row.events = patch.events;
  if (patch.internalNotes !== undefined)       row.internal_notes = patch.internalNotes;
  return row;
}

export const exportServiceOrdersDb = {
  async getAll(): Promise<any[]> {
    return safeQuery(
      async () => {
        const { data, error } = await supabase
          .from('export_service_orders')
          .select('*')
          .order('created_at', { ascending: false });
        return { data: (data ?? []).map(rowToExportServiceOrder), error };
      },
      []
    );
  },

  async getByCustomerEmail(email: string): Promise<any[]> {
    return safeQuery(
      async () => {
        const { data, error } = await supabase
          .from('export_service_orders')
          .select('*')
          .eq('customer_email', email)
          .order('created_at', { ascending: false });
        return { data: (data ?? []).map(rowToExportServiceOrder), error };
      },
      []
    );
  },

  async getById(id: string): Promise<any | null> {
    return safeQuery(
      async () => {
        const { data, error } = await supabase
          .from('export_service_orders')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        return { data: data ? rowToExportServiceOrder(data) : null, error };
      },
      null
    );
  },

  async create(order: any): Promise<any | null> {
    const row = exportServiceOrderToRow(order);
    row.created_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('export_service_orders')
      .insert(row)
      .select()
      .maybeSingle();
    if (error) { console.warn('[Supabase] create export service order:', error.message); return null; }
    return data ? rowToExportServiceOrder(data) : null;
  },

  async update(id: string, patch: any): Promise<boolean> {
    const row = exportServiceOrderToRow(patch);
    const { error } = await supabase
      .from('export_service_orders')
      .update(row)
      .eq('id', id);
    if (error) { console.warn('[Supabase] update export service order:', error.message); return false; }
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from('export_service_orders').delete().eq('id', id);
    if (error) { console.warn('[Supabase] delete export service order:', error.message); return false; }
    return true;
  },

  subscribeChanges(callback: (payload: any) => void) {
    return supabase
      .channel('export_service_orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'export_service_orders' }, callback)
      .subscribe();
  },

  async isExportServiceEnabled(customerEmail: string): Promise<boolean> {
    return safeQuery(
      async () => {
        const { data, error } = await supabase
          .from('customer_service_features')
          .select('enabled')
          .eq('customer_email', customerEmail)
          .eq('feature', 'export_service')
          .maybeSingle();
        return { data: data?.enabled ?? false, error };
      },
      false
    );
  },

  async setExportServiceEnabled(customerEmail: string, enabled: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('customer_service_features')
      .upsert(
        { customer_email: customerEmail, feature: 'export_service', enabled, updated_at: new Date().toISOString() },
        { onConflict: 'customer_email,feature' }
      );
    if (error) { console.warn('[Supabase] set export service enabled:', error.message); return false; }
    return true;
  },
};
