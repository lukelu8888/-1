import React, { createContext, useCallback, useContext, useState, ReactNode, useEffect } from 'react';
import { quotationRequestService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

/**
 * 📋 报价请求 Context（QR）
 *
 * 业务流程：
 * 1. 业务员收到客户询价(INQ)
 * 2. 业务员向采购员发起"报价请求"(QR)
 * 3. 采购员向供应商发送采购询价(XJ)
 * 4. 供应商报价(BJ)
 * 5. 采购员选择最优报价，创建 PO
 * 6. 业务员基于成本给客户报价(QT)
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

export const QuotationRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromSupabase = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const data = await quotationRequestService.getAll();
      if (data && Array.isArray(data)) {
        setQuotationRequests(data.filter(Boolean) as QuotationRequest[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void loadFromSupabase();
      else if (event === 'SIGNED_OUT') setQuotationRequests([]);
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
          setQuotationRequests(prev => {
            const exists = prev.find(r => r.id === updated.id);
            return exists
              ? prev.map(r => r.id === updated.id ? { ...r, ...updated } : r)
              : [updated, ...prev];
          });
        } else if (eventType === 'DELETE') {
          const deletedId = (oldRow as any)?.id;
          if (deletedId) setQuotationRequests(prev => prev.filter(r => r.id !== deletedId));
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const addQuotationRequest = async (request: QuotationRequest) => {
    const saved = await quotationRequestService.upsert(request);
    if (saved) {
      setQuotationRequests(prev => {
        const exists = prev.some(r => r.id === request.id);
        return exists ? prev : [saved as QuotationRequest, ...prev];
      });
    } else {
      setQuotationRequests(prev => {
        const exists = prev.some(r => r.id === request.id);
        return exists ? prev : [request, ...prev];
      });
    }
  };

  const updateQuotationRequest = async (id: string, updates: Partial<QuotationRequest>) => {
    const current = quotationRequests.find(r => r.id === id);
    const merged = { ...current, ...updates, updatedDate: new Date().toISOString() } as QuotationRequest;
    const saved = await quotationRequestService.upsert(merged);
    setQuotationRequests(prev =>
      prev.map(r => r.id === id ? (saved as QuotationRequest || merged) : r)
    );
  };

  const deleteQuotationRequest = async (id: string) => {
    await quotationRequestService.delete(id);
    setQuotationRequests(prev => prev.filter(r => r.id !== id));
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
