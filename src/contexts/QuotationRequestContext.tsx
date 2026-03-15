import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { quotationRequestService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { useQuoteRequirements } from './QuoteRequirementContext';

/**
 * 📋 报价请求兼容 Context（QR）
 *
 * 业务流程：
 * 1. 业务员收到客户询价(INQ)
 * 2. 业务员向采购员发起"报价请求"(QR)
 * 3. 采购员向供应商发送采购询价(XJ)
 * 4. 供应商报价(BJ)
 * 5. 采购员选择最优报价，进入后续 CG / QT 等下游流程
 * 6. 业务员基于成本给客户报价(QT)
 *
 * 当前职责：
 * - 对旧采购工作台继续提供 quotationRequests 读写接口
 * - 读取时优先合并 QR 主承载（QuoteRequirement）数据
 * - 写入时保留 legacy quotation_requests，并把关键状态回写到 QR 主承载
 */

export type QuotationRequestStatus = 'pending' | 'processing' | 'quoted' | 'completed' | 'cancelled';

export interface QuotationRequestItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
  hsCode?: string;
  remarks?: string;
}

export interface QuotationRequest {
  id: string;
  requestNumber: string;

  sourceInquiryId: string;
  sourceInquiryNumber: string;
  customerName: string;
  customerEmail?: string;
  region: string;

  requestedBy: string;
  requestedByName?: string;
  requestDate: string;
  expectedQuoteDate: string;

  items: QuotationRequestItem[];

  status: QuotationRequestStatus;

  assignedTo?: string;
  assignedToName?: string;
  assignedDate?: string;

  rfqIds?: string[];
  rfqCount?: number;

  quotedPrice?: number;
  quotedCurrency?: string;
  quotedDate?: string;

  remarks?: string;

  createdDate: string;
  updatedDate?: string;
}

interface QuotationRequestContextType {
  quotationRequests: QuotationRequest[];
  loading: boolean;
  addQuotationRequest: (request: QuotationRequest) => Promise<void>;
  updateQuotationRequest: (id: string, updates: Partial<QuotationRequest>) => Promise<void>;
  deleteQuotationRequest: (id: string) => Promise<void>;
  getQuotationRequestById: (id: string) => QuotationRequest | undefined;
  getQuotationRequestsByInquiry: (inquiryId: string) => QuotationRequest[];
  getQuotationRequestsBySalesRep: (salesRepEmail: string) => QuotationRequest[];
  getQuotationRequestsByProcurement: (procurementEmail: string) => QuotationRequest[];
  getPendingQuotationRequests: () => QuotationRequest[];
}

const QuotationRequestContext = createContext<QuotationRequestContextType | undefined>(undefined);

const normalizeLegacyQrStatus = (status?: string): QuotationRequestStatus => {
  switch (status) {
    case 'processing':
      return 'processing';
    case 'quoted':
    case 'completed':
      return 'quoted';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
};

const buildQuotationRequestFromQuoteRequirement = (qr: any): QuotationRequest => {
  const requestNumber = String(qr?.requirementNo || qr?.qrNumber || qr?.displayNumber || '');
  const sourceInquiryNumber = String(qr?.sourceInquiryNumber || qr?.sourceRef || '');
  const sourceInquiryId = String(qr?.sourceRef || qr?.sourceInquiryNumber || qr?.id || '');
  const createdDate = String(qr?.createdDate || qr?.createdAt || '').split('T')[0] || new Date().toISOString().split('T')[0];
  const customer = qr?.customer || {};

  return {
    id: String(qr?.id || requestNumber || crypto.randomUUID()),
    requestNumber,
    sourceInquiryId,
    sourceInquiryNumber,
    customerName: String(customer?.companyName || customer?.contactPerson || ''),
    customerEmail: customer?.email || undefined,
    region: String(qr?.region || ''),
    requestedBy: String(qr?.createdBy || ''),
    requestedByName: String(qr?.createdBy || ''),
    requestDate: String(qr?.createdDate || qr?.createdAt || createdDate).split('T')[0],
    expectedQuoteDate: String(qr?.expectedQuoteDate || ''),
    items: Array.isArray(qr?.items) ? qr.items : [],
    status: normalizeLegacyQrStatus(qr?.status),
    assignedTo: qr?.assignedTo || undefined,
    remarks: qr?.remarks || qr?.notes || undefined,
    createdDate,
    updatedDate: qr?.updatedAt || undefined,
  };
};

const mergeQuotationRequests = (legacyRequests: QuotationRequest[], quoteRequirements: any[]): QuotationRequest[] => {
  const legacyByRequestNumber = new Map<string, QuotationRequest>();
  const legacyById = new Map<string, QuotationRequest>();

  legacyRequests.forEach((request) => {
    const requestNumber = String(request?.requestNumber || '').trim();
    const requestId = String(request?.id || '').trim();
    if (requestNumber) legacyByRequestNumber.set(requestNumber, request);
    if (requestId) legacyById.set(requestId, request);
  });

  const merged: QuotationRequest[] = [];
  const consumedLegacyIds = new Set<string>();

  quoteRequirements.forEach((quoteRequirement: any) => {
    const base = buildQuotationRequestFromQuoteRequirement(quoteRequirement);
    const legacy =
      legacyByRequestNumber.get(base.requestNumber) ||
      legacyById.get(base.id);

    if (legacy?.id) consumedLegacyIds.add(String(legacy.id));

    merged.push({
      ...base,
      id: legacy?.id || base.id,
      status: legacy?.status || base.status,
      assignedTo: legacy?.assignedTo || base.assignedTo,
      assignedToName: legacy?.assignedToName,
      assignedDate: legacy?.assignedDate,
      xjIds: legacy?.xjIds || [],
      xjCount: legacy?.xjCount || 0,
      quotedPrice: legacy?.quotedPrice,
      quotedCurrency: legacy?.quotedCurrency,
      quotedDate: legacy?.quotedDate,
      requestedByName: legacy?.requestedByName || base.requestedByName,
      requestedBy: legacy?.requestedBy || base.requestedBy,
      requestDate: legacy?.requestDate || base.requestDate,
      createdDate: legacy?.createdDate || base.createdDate,
      updatedDate: legacy?.updatedDate || base.updatedDate,
      remarks: legacy?.remarks || base.remarks,
    });
  });

  legacyRequests.forEach((legacy) => {
    if (!consumedLegacyIds.has(String(legacy.id || ''))) {
      merged.push(legacy);
    }
  });

  return merged.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
};

export const QuotationRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { requirements: quoteRequirements, updateRequirement: updateQuoteRequirement } = useQuoteRequirements();
  const [legacyQuotationRequests, setLegacyQuotationRequests] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const quotationRequests = useMemo(
    () => mergeQuotationRequests(legacyQuotationRequests, quoteRequirements as any[]),
    [legacyQuotationRequests, quoteRequirements],
  );

  const loadFromSupabase = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const data = await quotationRequestService.getAll();
      if (data && Array.isArray(data)) {
        setLegacyQuotationRequests(data.filter(Boolean) as QuotationRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void loadFromSupabase();
      else if (event === 'SIGNED_OUT') setLegacyQuotationRequests([]);
    });

    return () => { subscription.unsubscribe(); };
  }, [loadFromSupabase]);

  // Realtime 订阅
  useEffect(() => {
    const channel = supabase
      .channel('quotation_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotation_requests' }, (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          const updated = newRow as QuotationRequest;
          setLegacyQuotationRequests(prev => {
            const exists = prev.find(r => r.id === updated.id);
            return exists
              ? prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)
              : [updated, ...prev];
          });
        } else if (eventType === 'DELETE') {
          const deletedId = (oldRow as any)?.id;
          if (deletedId) setLegacyQuotationRequests(prev => prev.filter(r => r.id !== deletedId));
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const addQuotationRequest = async (request: QuotationRequest) => {
    const saved = await quotationRequestService.upsert(request);
    if (!saved) {
      throw new Error(`QR ${request.requestNumber || request.id} 写入 quotation_requests 失败`);
    }
    setLegacyQuotationRequests(prev => {
      const exists = prev.some(r => r.id === saved.id);
      return exists ? prev.map(r => r.id === saved.id ? saved as QuotationRequest : r) : [saved as QuotationRequest, ...prev];
    });
  };

  const updateQuotationRequest = async (id: string, updates: Partial<QuotationRequest>) => {
    const current = quotationRequests.find(r => r.id === id);
    if (!current) {
      throw new Error('未找到要更新的 QR 请求');
    }
    const merged = { ...current, ...updates, updatedDate: new Date().toISOString() } as QuotationRequest;
    const saved = await quotationRequestService.upsert(merged);
    if (!saved) {
      throw new Error(`QR ${current.requestNumber || id} 更新 quotation_requests 失败`);
    }
    setLegacyQuotationRequests(prev => {
      const nextRow = saved as QuotationRequest;
      const exists = prev.some(r => r.id === id || r.requestNumber === nextRow.requestNumber);
      return exists
        ? prev.map(r => (r.id === id || r.requestNumber === nextRow.requestNumber) ? nextRow : r)
        : [nextRow, ...prev];
    });

    const quoteRequirement = (quoteRequirements as any[]).find((req: any) =>
      String(req?.id || '') === String(current?.id || '') ||
      String(req?.requirementNo || req?.qrNumber || '') === String(current?.requestNumber || ''),
    );

    if (quoteRequirement) {
      const nextRequirementUpdates: Record<string, any> = {};
      if (updates.status === 'processing') {
        nextRequirementUpdates.status = 'processing';
      }
      if (updates.assignedTo !== undefined) {
        nextRequirementUpdates.assignedTo = updates.assignedTo || null;
      }
      if (updates.expectedQuoteDate !== undefined) {
        nextRequirementUpdates.expectedQuoteDate = updates.expectedQuoteDate || null;
      }
      if (updates.remarks !== undefined) {
        nextRequirementUpdates.remarks = updates.remarks || null;
      }

      if (Object.keys(nextRequirementUpdates).length > 0) {
        await updateQuoteRequirement(quoteRequirement.id, nextRequirementUpdates);
      }
    }
  };

  const deleteQuotationRequest = async (id: string) => {
    await quotationRequestService.delete(id);
    setLegacyQuotationRequests(prev => prev.filter(r => r.id !== id));
  };

  const getQuotationRequestById = (id: string) =>
    quotationRequests.find(r => r.id === id);

  const getQuotationRequestsByInquiry = (inquiryId: string) =>
    quotationRequests.filter(r =>
      r.sourceInquiryId === inquiryId || r.sourceInquiryNumber === inquiryId
    );

  const getQuotationRequestsBySalesRep = (salesRepEmail: string) =>
    quotationRequests.filter(r => r.requestedBy === salesRepEmail);

  const getQuotationRequestsByProcurement = (procurementEmail: string) =>
    quotationRequests.filter(r => r.assignedTo === procurementEmail || !r.assignedTo);

  const getPendingQuotationRequests = () =>
    quotationRequests.filter(r => r.status === 'pending');

  return (
    <QuotationRequestContext.Provider
      value={{
        quotationRequests,
        loading,
        addQuotationRequest,
        updateQuotationRequest,
        deleteQuotationRequest,
        getQuotationRequestById,
        getQuotationRequestsByInquiry,
        getQuotationRequestsBySalesRep,
        getQuotationRequestsByProcurement,
        getPendingQuotationRequests,
      }}
    >
      {children}
    </QuotationRequestContext.Provider>
  );
};

export const useQuotationRequests = () => {
  const context = useContext(QuotationRequestContext);
  if (!context) {
    throw new Error('useQuotationRequests must be used within QuotationRequestProvider');
  }
  return context;
};
