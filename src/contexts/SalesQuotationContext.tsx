import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { filterNotDeleted } from '../lib/erp-core/deletion-tombstone';
import { salesQuotationService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

// 🎯 销售报价单（QT）- 业务员创建，需要审批

export interface SalesQuotationItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  
  // 成本信息（从供应商报价BJ获取）
  costPrice: number;
  selectedSupplier: string; // 选择的供应商
  selectedSupplierName: string;
  selectedBJ: string; // 关联的供应商报价单号 BJ-xxx
  
  // 销售报价
  salesPrice: number; // 销售价格
  profitMargin: number; // 利润率 (0.18 = 18%)
  profit: number; // 利润金额
  
  hsCode?: string;
  remarks?: string;
}

export interface SalesQuotation {
  id: string;
  qtNumber: string; // QT-NA-251219-6789
  
  // 关联单据
  qrNumber: string; // QR-NA-251219-1234（采购需求单）
  inqNumber: string; // INQ-NA-251219-0001（客户询价单）
  
  // 区域和客户
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  
  // 业务员信息
  salesPerson: string; // 业务员邮箱
  salesPersonName: string;
  
  // 报价产品
  items: SalesQuotationItem[];
  
  // 财务汇总
  totalCost: number; // 总成本
  totalPrice: number; // 总报价
  totalProfit: number; // 总利润
  profitRate: number; // 总利润率
  
  // 付款和交付条件
  currency: string; // USD, EUR, etc.
  paymentTerms: string; // 30天账期, T/T, L/C等
  deliveryTerms: string; // FOB, CIF, EXW等
  deliveryDate: string;
  
  // 审批状态
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approvalChain: {
    level: 1 | 2; // 1=区域业务主管, 2=销售总监
    approverRole: '区域业务主管' | '销售总监';
    approverEmail: string;
    approverName?: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    approvedAt?: string;
  }[];
  
  // 客户响应
  customerStatus: 'not_sent' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'negotiating' | 'expired';
  customerResponse?: {
    status: 'accepted' | 'rejected' | 'negotiating';
    comment?: string;
    respondedAt: string;
  };
  
  // 关联销售订单
  soNumber?: string; // SO-NA-251219-8888
  
  // 🔥 新增：下推销售合同相关字段
  pushedToContract?: boolean; // 是否已下推到销售合同
  pushedContractNumber?: string; // 下推的销售合同号 SC-xxx
  pushedContractAt?: string; // 下推时间
  pushedBy?: string; // 下推操作人邮箱
  
  // 报价有效期
  validUntil: string;
  
  // 版本管理（支持修改报价）
  version: number; // 1, 2, 3...
  previousVersion?: string; // QT编号（如果是修改版本）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  sentAt?: string; // 发送给客户的时间
  
  // 备注（🔥 重要：区分内部备注和客户备注）
  notes?: string; // 🚨 已废弃：可能包含敏感信息，不应直接使用
  customerNotes?: string; // ✅ 客户备注：可以给客户看的备注信息
  internalNotes?: string; // 🔒 内部备注：采购员建议、成本分析等敏感信息，仅内部可见
  tradeTerms?: {
    incoterms?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    packing?: string;
    portOfLoading?: string;
    portOfDestination?: string;
    warranty?: string;
    inspection?: string;
  };
  remarks?: string; // ✅ 给客户看的备注说明
}

interface SalesQuotationContextType {
  quotations: SalesQuotation[];
  addQuotation: (quotation: SalesQuotation) => Promise<void>;
  updateQuotation: (id: string, updates: Partial<SalesQuotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  getQuotationById: (id: string) => SalesQuotation | undefined;
  getQuotationByNumber: (qtNumber: string) => SalesQuotation | undefined;
  getQuotationsByQR: (qrNumber: string) => SalesQuotation[];
  getQuotationsByCustomer: (customerEmail: string) => SalesQuotation[];
  getQuotationsBySalesPerson: (salesPersonEmail: string) => SalesQuotation[];
}

const SalesQuotationContext = createContext<SalesQuotationContextType | undefined>(undefined);

const getSalesQuotationMarkers = (quotation: Partial<SalesQuotation>): string[] => {
  return [quotation.id, quotation.qtNumber, quotation.qrNumber, quotation.inqNumber]
    .filter(Boolean)
    .map((v) => String(v));
};

const emitSalesQuotationEvent = (
  key: string,
  quotation: Partial<SalesQuotation> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  emitErpEvent({
    id: `evt-sales-quotation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'quotation',
    recordId: String(quotation.id),
    internalNo: String(quotation.qtNumber || quotation.id),
    source: 'admin',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

export const SalesQuotationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);

  // 从 Supabase 加载数据
  const loadFromSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const data = await salesQuotationService.getAll();
    if (data && Array.isArray(data)) {
      const filtered = filterNotDeleted('quotation', data as SalesQuotation[], (q) => getSalesQuotationMarkers(q));
      setQuotations(filtered);
    }
  };

  // 初始加载 & 监听 Auth 状态
  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        void loadFromSupabase();
      } else if (event === 'SIGNED_OUT') {
        setQuotations([]);
      }
    });

    // 监听用户切换（兼容旧事件）
    const handleUserChanged = () => void loadFromSupabase();
    window.addEventListener('userChanged', handleUserChanged);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('userChanged', handleUserChanged);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Supabase Realtime 订阅
  useEffect(() => {
    const channel = salesQuotationService.subscribeToChanges((payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const updated = newRow as SalesQuotation;
        setQuotations(prev => {
          const exists = prev.find(q => q.id === updated.id);
          return exists
            ? prev.map(q => q.id === updated.id ? { ...q, ...updated } : q)
            : [updated, ...prev];
        });
      } else if (eventType === 'DELETE') {
        const deletedId = (oldRow as any)?.id;
        if (deletedId) {
          setQuotations(prev => prev.filter(q => q.id !== deletedId));
        }
      }
    });
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const addQuotation = async (quotation: SalesQuotation) => {
    const saved = await salesQuotationService.upsert(quotation);
    if (saved) {
      setQuotations(prev => [saved as SalesQuotation, ...prev]);
    } else {
      setQuotations(prev => [quotation, ...prev]);
    }
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_CREATED, quotation, {
      approvalStatus: quotation.approvalStatus,
      customerStatus: quotation.customerStatus,
    });
  };

  const updateQuotation = async (id: string, updates: Partial<SalesQuotation>) => {
    const currentQuotation = quotations.find((qt) => qt.id === id);
    const merged = { ...currentQuotation, ...updates, updatedAt: new Date().toISOString() } as SalesQuotation;
    const saved = await salesQuotationService.upsert(merged);
    setQuotations(prev => prev.map(qt => qt.id === id ? (saved as SalesQuotation || merged) : qt));
    if (updates.customerStatus === 'sent' || updates.customerStatus === 'viewed') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_SENT, { id, qtNumber: String(currentQuotation?.qtNumber || id) }, { customerStatus: updates.customerStatus });
    }
    if (updates.customerStatus === 'accepted') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_ACCEPTED, { id, qtNumber: String(currentQuotation?.qtNumber || id) }, { customerStatus: updates.customerStatus });
    }
  };

  const deleteQuotation = async (id: string) => {
    const currentQuotation = quotations.find((qt) => qt.id === id);
    await salesQuotationService.delete(id);
    setQuotations((prev) => prev.filter((qt) => qt.id !== id));
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_DELETED, { id, qtNumber: String(currentQuotation?.qtNumber || id) });
  };

  const getQuotationById = (id: string) => {
    return quotations.find(qt => qt.id === id);
  };

  const getQuotationByNumber = (qtNumber: string) => {
    return quotations.find(qt => qt.qtNumber === qtNumber);
  };

  const getQuotationsByQR = (qrNumber: string) => {
    return quotations.filter(qt => qt.qrNumber === qrNumber);
  };

  const getQuotationsByCustomer = (customerEmail: string) => {
    return quotations.filter(qt => qt.customerEmail === customerEmail);
  };

  const getQuotationsBySalesPerson = (salesPersonEmail: string) => {
    return quotations.filter(qt => qt.salesPerson === salesPersonEmail);
  };

  return (
    <SalesQuotationContext.Provider
      value={{
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        getQuotationById,
        getQuotationByNumber,
        getQuotationsByQR,
        getQuotationsByCustomer,
        getQuotationsBySalesPerson
      }}
    >
      {children}
    </SalesQuotationContext.Provider>
  );
};

export const useSalesQuotations = () => {
  const context = useContext(SalesQuotationContext);
  if (context === undefined) {
    throw new Error('useSalesQuotations must be used within a SalesQuotationProvider');
  }
  return context;
};
