import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Quotation } from '../components/admin/QuotationManagement';
import { getCurrentUser } from '../utils/dataIsolation';
import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { salesQuotationService, inquiryService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

const getQuotationMarkers = (quotation: Partial<Quotation>): string[] => {
  return [quotation.id, (quotation as any).qtNumber, quotation.quotationNumber]
    .filter(Boolean)
    .map((v) => String(v));
};

const emitQuotationEvent = (
  key: string,
  quotation: Partial<Quotation> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-quotation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'quotation',
    recordId: String(quotation.id),
    internalNo: String((quotation as any).qtNumber || quotation.quotationNumber || quotation.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

// 将 Quotation 接口字段适配到 salesQuotationService 期待的格式
function toServicePayload(q: Quotation): any {
  return {
    id: q.id,
    qtNumber: q.quotationNumber,
    inqNumber: q.inquiryNumber,
    region: q.region,
    customerName: q.customerName || q.customer,
    customerEmail: q.customerEmail,
    items: q.products?.map(p => ({
      name: p.name || p.productName,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalPrice: p.totalPrice,
      specs: p.specs,
      image: p.image,
      sku: p.sku,
    })) || [],
    totalPrice: q.totalAmount,
    currency: q.currency,
    paymentTerms: q.paymentTerms,
    deliveryTerms: q.deliveryTerms,
    validUntil: q.validUntil,
    approvalStatus: q.status,
    notes: q.notes,
    tradeTerms: q.tradeTerms,
    approvalHistory: q.approvalHistory,
    approvalFlow: q.approvalFlow,
    customerResponse: q.customerFeedback,
    revisions: q.revisions,
    revisionNumber: q.revisionNumber,
  };
}

// 将 Supabase 返回的数据适配回 Quotation 接口
function fromServicePayload(r: any): Quotation {
  return {
    id: r.id,
    quotationNumber: r.qtNumber || r.quotation_number || r.id,
    inquiryId: r.inqNumber || '',
    inquiryNumber: r.inqNumber || '',
    customer: r.customerName || '',
    customerName: r.customerName || '',
    customerEmail: r.customerEmail || '',
    region: r.region,
    products: (r.items || []).map((item: any) => ({
      name: item.name || item.productName,
      productName: item.name || item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specs: item.specs || '',
      image: item.image,
      sku: item.sku,
    })),
    subtotal: r.totalPrice || 0,
    discount: 0,
    tax: 0,
    totalAmount: r.totalPrice || 0,
    currency: r.currency || 'USD',
    validUntil: r.validUntil || '',
    paymentTerms: r.paymentTerms || '',
    deliveryTerms: r.deliveryTerms || '',
    quotationDate: r.createdAt || new Date().toISOString(),
    status: r.approvalStatus || 'draft',
    notes: r.internalNotes || r.customerNotes || '',
    tradeTerms: r.tradeTerms,
    approvalFlow: r.approvalFlow,
    approvalHistory: r.approvalHistory,
    approvalNotes: r.approvalNotes,
    customerFeedback: r.customerResponse,
    revisions: r.revisions,
    revisionNumber: r.revisionNumber,
  };
}

interface QuotationContextType {
  quotations: Quotation[];
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => Quotation | undefined;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export function QuotationProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const loadQuotations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const raw = currentUser.type === 'admin'
      ? await salesQuotationService.getAll()
      : await salesQuotationService.getByCustomerEmail(currentUser.email);

    if (!Array.isArray(raw)) return;

    const mapped = raw.filter(Boolean).map(fromServicePayload);
    const visible = filterNotDeleted('quotation', mapped, (q) => getQuotationMarkers(q));
    setQuotations(visible);
  };

  useEffect(() => {
    let alive = true;

    void loadQuotations();

    // Realtime 订阅
    const realtimeChannel = salesQuotationService.subscribeToChanges(() => {
      if (alive) void loadQuotations();
    });

    // 跨组件事件兼容（老事件派发）
    const handleUpdate = () => { if (alive) void loadQuotations(); };
    window.addEventListener('quotationsUpdated', handleUpdate);
    window.addEventListener('userChanged', handleUpdate);

    return () => {
      alive = false;
      supabase.removeChannel(realtimeChannel);
      window.removeEventListener('quotationsUpdated', handleUpdate);
      window.removeEventListener('userChanged', handleUpdate);
    };
  }, []);

  const addQuotation = (quotation: Quotation) => {
    if (!quotation.customerEmail || quotation.customerEmail === 'N/A') {
      console.error('[QuotationContext] addQuotation: 客户邮箱无效，不保存');
      return;
    }

    // 立即更新 React State
    setQuotations(prev => {
      const exists = prev.some(q => q.id === quotation.id);
      return exists ? prev : [quotation, ...prev];
    });

    // Supabase 异步写入
    void salesQuotationService.upsert(toServicePayload(quotation)).catch(() => {});

    // 标记对应询价为已报价
    if (quotation.inquiryNumber || quotation.inquiryId) {
      const inquiryId = quotation.inquiryId || quotation.inquiryNumber;
      void inquiryService.updateStatus(inquiryId, 'quoted', {
        quotation_created: true,
        quotation_number: quotation.quotationNumber,
      }).catch(() => {});
    }

    window.dispatchEvent(new Event('quotationsUpdated'));
    emitQuotationEvent(ERP_EVENT_KEYS.QUOTATION_CREATED, quotation, {
      status: quotation.status,
    });
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    // 立即更新 React State
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));

    // Supabase 异步写入
    const target = quotations.find(q => q.id === id);
    if (target) {
      const merged = { ...target, ...updates };
      void salesQuotationService.upsert(toServicePayload(merged)).catch(() => {});
    }

    window.dispatchEvent(new Event('quotationsUpdated'));
    emitQuotationEvent(ERP_EVENT_KEYS.QUOTATION_SENT, {
      id,
      quotationNumber: String(updates.quotationNumber || id),
    } as any, { fields: Object.keys(updates) });
  };

  const deleteQuotation = (id: string) => {
    const target = quotations.find(q => q.id === id);
    const markers = target ? getQuotationMarkers(target) : [String(id)];
    const currentUser = getCurrentUser();

    setQuotations(prev => prev.filter(q => q.id !== id));

    void salesQuotationService.delete(id).catch(() => {});

    addTombstones('quotation', markers, {
      reason: 'manual_delete',
      deletedBy: currentUser?.email || 'unknown',
    });

    window.dispatchEvent(new Event('quotationsUpdated'));
    emitQuotationEvent(ERP_EVENT_KEYS.QUOTATION_DELETED, {
      id,
      quotationNumber: String(target?.quotationNumber || id),
      ...(target as any)?.qtNumber ? { qtNumber: (target as any).qtNumber } : {},
    } as any);
  };

  const getQuotationById = (id: string) => {
    return quotations.find(q => q.id === id);
  };

  return (
    <QuotationContext.Provider value={{
      quotations,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      getQuotationById
    }}>
      {children}
    </QuotationContext.Provider>
  );
}

export function useQuotations() {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotations must be used within QuotationProvider');
  }
  return context;
}
