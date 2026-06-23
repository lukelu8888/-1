import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { filterNotDeleted, removeTombstonesByMarkers } from '../lib/erp-core/deletion-tombstone';
import { salesQuotationService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import type { QuotationData } from '../components/documents/templates/QuotationDocument';
import type { BalanceTrigger } from '../lib/paymentFlow';
import { assertBusinessOwnerEmail, matchesBusinessOwnerEmail, pickBusinessOwnerEmail } from '../utils/quotationOwnership';
import {
  buildIdentityAuditMetadata,
  buildIdentityPersistenceFields,
  clearLegacyScopedStorageKeys,
  getScopedStorageKey,
  readScopedStoragePayload,
} from '../utils/dataIsolation';

const TRACE_QT_NUMBER = 'QT-NA-260326-0001';
const SALES_QUOTATION_CONTEXT_CACHE_KEY = 'sales_quotation_context_cache_v1';

// 🎯 销售报价单（QT）- 业务员创建，需要审批

export interface SalesQuotationItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  customerProductId?: string;
  projectId?: string;
  projectRevisionId?: string;
  projectRevisionCode?: string;
  
  // 成本信息（从供应商报价BJ获取）
  costPrice: number;
  selectedSupplier: string; // 选择的供应商
  selectedSupplierName: string;
  selectedBJ: string; // 关联的供应商报价单号 BJ-xxx
  
  // 销售报价
  salesPrice: number; // 销售价格
  profitMargin: number; // 利润率百分比（18 = 18%）
  profit: number; // 利润金额
  
  hsCode?: string;
  remarks?: string;
}

export type PaymentMode =
  | 'tt_deposit_balance_before_shipment'
  | 'tt_deposit_balance_against_bl'
  | 'tt_100_before_production'
  | 'lc_100'
  | 'deposit_plus_lc'
  | 'dp'
  | 'da'
  | 'oa';

export interface SalesQuotation {
  id: string;
  qtNumber: string; // QT-NA-251219-6789
  
  // 关联单据
  qrNumber: string; // QR-NA-251219-1234（采购需求单）
  inqNumber: string; // ING-NA-251219-0001（客户询价单）
  
  // 区域和客户
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  quotationRole?: 'budgetary' | 'technical_review' | 'commercial_offer' | 'final_offer' | 'accepted';
  
  // 业务员信息
  salesPerson: string; // 业务员邮箱
  salesPersonName: string;
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  operatorUserId?: string | null;
  operatorEmail?: string | null;
  operatorRole?: string | null;
  actingUserId?: string | null;
  actingUserEmail?: string | null;
  actingUserRole?: string | null;
  authenticatedUserId?: string | null;
  authenticatedUserEmail?: string | null;
  authenticatedUserRole?: string | null;
  
  // 报价产品
  items: SalesQuotationItem[];
  
  // 财务汇总
  totalCost: number; // 总成本
  totalPrice: number; // 总报价
  totalProfit: number; // 总利润
  profitRate: number; // 总利润率
  
  // 付款和交付条件
  currency: string; // USD, EUR, etc.
  paymentTerms: string; // 30天账期, T/T, L/C等（自由文本，文档渲染用）
  paymentMode?: PaymentMode | null; // 结构化付款模式（Phase 1: 仅存储，不影响闸门逻辑）
  balanceTrigger?: BalanceTrigger | null; // 余款/信用证触发节点（结构化，驱动财务应收阶段）
  qtType?: 'regular' | 'large_amount' | 'special_price' | 'special_payment' | 'strategic_customer' | null;
  specialPriceFlag?: boolean;
  specialPriceReason?: string | null;
  specialPaymentTermsFlag?: boolean;
  strategicCustomerFlag?: boolean;
  qtLastApprovalAt?: string | null;
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
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSnapshot?: any;
  documentDataSnapshot?: QuotationData;
  documentRenderMeta?: any;
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

const assertSalesQuotationWritePayload = (quotation: Partial<SalesQuotation>) => {
  if (!quotation.templateSnapshot || !quotation.documentDataSnapshot) {
    throw new Error(`QT ${quotation.qtNumber || quotation.id || ''} 缺少模板快照数据，已阻止写入`);
  }
};

const ensureSalesQuotationPersistedBinding = (
  quotation: Partial<SalesQuotation>,
  fallback?: Partial<SalesQuotation>,
): SalesQuotation => {
  return {
    ...(fallback as SalesQuotation),
    ...(quotation as SalesQuotation),
    templateId: quotation.templateId ?? fallback?.templateId ?? null,
    templateVersionId: quotation.templateVersionId ?? fallback?.templateVersionId ?? null,
    templateSnapshot: quotation.templateSnapshot ?? fallback?.templateSnapshot ?? {},
    documentDataSnapshot: quotation.documentDataSnapshot ?? fallback?.documentDataSnapshot,
    documentRenderMeta: quotation.documentRenderMeta ?? fallback?.documentRenderMeta ?? {},
  } as SalesQuotation;
};

const normalizeSalesQuotationWritePayload = (quotation: SalesQuotation): SalesQuotation => {
  const resolvedOwnerEmail = pickBusinessOwnerEmail(
    [
      quotation.salesPerson,
      quotation.ownerEmail,
      quotation.owner_email,
    ],
    quotation.region,
    quotation.salesPerson,
  );
  const ownerEmail = assertBusinessOwnerEmail(resolvedOwnerEmail, quotation.region, '销售报价单');
  return {
    ...quotation,
    salesPerson: ownerEmail,
    ownerEmail,
    ownerName: quotation.salesPersonName || null,
    ownerRole: 'Sales_Rep',
    ...buildIdentityPersistenceFields({
      ownerEmail,
      ownerName: quotation.salesPersonName || null,
      ownerRole: 'Sales_Rep',
    }),
    documentRenderMeta: {
      ...(quotation.documentRenderMeta || {}),
      ...buildIdentityAuditMetadata({
        ownerEmail,
        ownerName: quotation.salesPersonName || null,
        ownerRole: 'Sales_Rep',
        region: quotation.region || null,
      }),
    },
  };
};

const getSalesQuotationMarkers = (quotation: Partial<SalesQuotation>): string[] => {
  // 仅使用报价单自身标识，避免误伤同一 QR/ING 下后续新建报价单。
  return [quotation.id, quotation.qtNumber]
    .filter(Boolean)
    .map((v) => String(v));
};

const readSalesQuotationContextCache = (): SalesQuotation[] => {
  try {
    const raw = readScopedStoragePayload(SALES_QUOTATION_CONTEXT_CACHE_KEY, [
      SALES_QUOTATION_CONTEXT_CACHE_KEY,
    ]);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSalesQuotationContextCache = (rows: SalesQuotation[]) => {
  try {
    localStorage.setItem(
      getScopedStorageKey(SALES_QUOTATION_CONTEXT_CACHE_KEY),
      JSON.stringify(Array.isArray(rows) ? rows : []),
    );
    clearLegacyScopedStorageKeys(SALES_QUOTATION_CONTEXT_CACHE_KEY, [SALES_QUOTATION_CONTEXT_CACHE_KEY]);
  } catch {}
};

const hasLocalBusinessIdentity = () => {
  const currentUser = getCurrentUser() as any;
  return Boolean(
    currentUser?.email ||
    currentUser?.id ||
    currentUser?.role ||
    currentUser?.userRole ||
    currentUser?.type,
  );
};

const emitSalesQuotationEvent = (
  key: string,
  quotation: Partial<SalesQuotation> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  emitErpEvent({
    id: `evt-sales-quotation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'qt',
    recordId: String(quotation.id),
    internalNo: String(quotation.qtNumber || quotation.id),
    source: 'admin',
    occurredAt: new Date().toISOString(),
    metadata: {
      ...metadata,
      quotation,
    },
  });
};

export const SalesQuotationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quotations, setQuotations] = useState<SalesQuotation[]>(() => readSalesQuotationContextCache());
  const restoreQuotationCacheFallback = React.useCallback(() => {
    const cached = readSalesQuotationContextCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setQuotations(cached);
      return true;
    }
    return false;
  }, []);

  const preserveQuotationStateOnAuthGap = React.useCallback(() => {
    const cached = readSalesQuotationContextCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setQuotations(cached);
      return;
    }
    setQuotations((prev) => prev);
  }, []);

  // 从 Supabase 加载数据
  const loadFromSupabase = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (!restoreQuotationCacheFallback()) {
        preserveQuotationStateOnAuthGap();
      }
      return;
    }
    const data = await salesQuotationService.getAll();
    if (data && Array.isArray(data)) {
      removeTombstonesByMarkers(
        'qt',
        data.flatMap((q) => [q?.id, q?.qtNumber]),
      );
      const filtered = filterNotDeleted('qt', data as SalesQuotation[], (q) => getSalesQuotationMarkers(q));
      setQuotations(filtered);
      writeSalesQuotationContextCache(filtered);
    }
  };

  // 初始加载 & 监听 Auth 状态
  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        void loadFromSupabase();
      } else if (event === 'SIGNED_OUT') {
        if (!hasLocalBusinessIdentity() || !restoreQuotationCacheFallback()) {
          preserveQuotationStateOnAuthGap();
        }
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
  }, [preserveQuotationStateOnAuthGap, restoreQuotationCacheFallback]);

  // Supabase Realtime 订阅
  useEffect(() => {
    const channel = salesQuotationService.subscribeToChanges((payload) => {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const updated = newRow as SalesQuotation;
        setQuotations(prev => {
          const exists = prev.find(q => q.id === updated.id);
          const nextRows = exists
            ? prev.map(q => q.id === updated.id ? { ...q, ...updated } : q)
            : [updated, ...prev];
          writeSalesQuotationContextCache(nextRows);
          return nextRows;
        });
      } else if (eventType === 'DELETE') {
        const deletedId = (oldRow as any)?.id;
        if (deletedId) {
          setQuotations(prev => {
            const nextRows = prev.filter(q => q.id !== deletedId);
            writeSalesQuotationContextCache(nextRows);
            return nextRows;
          });
        }
      }
    });
    return () => { void supabase.removeChannel(channel); };
  }, []);

  const addQuotation = async (quotation: SalesQuotation) => {
    const normalizedQuotation = normalizeSalesQuotationWritePayload(quotation);
    assertSalesQuotationWritePayload(normalizedQuotation);
    if (String(quotation.qtNumber || '').trim() === TRACE_QT_NUMBER) {
      console.warn('🔎 [TRACE QT context] upsert start', {
        id: quotation.id,
        qtNumber: quotation.qtNumber,
        qrNumber: quotation.qrNumber,
        createdAt: quotation.createdAt,
      });
    }
    const saved = await salesQuotationService.upsert(normalizedQuotation);
    if (!saved) {
      throw new Error('Supabase upsert sales quotation failed');
    }
    if (String((saved as SalesQuotation)?.qtNumber || '').trim() === TRACE_QT_NUMBER) {
      console.warn('🔎 [TRACE QT context] upsert returned', {
        id: (saved as SalesQuotation).id,
        qtNumber: (saved as SalesQuotation).qtNumber,
        qrNumber: (saved as SalesQuotation).qrNumber,
        createdAt: (saved as SalesQuotation).createdAt,
        updatedAt: (saved as SalesQuotation).updatedAt,
      });
    }
    const persistedQuotation = ensureSalesQuotationPersistedBinding(saved as SalesQuotation, normalizedQuotation);
    setQuotations(prev => {
      const nextRows = [persistedQuotation, ...prev];
      writeSalesQuotationContextCache(nextRows);
      return nextRows;
    });
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_CREATED, persistedQuotation, {
      approvalStatus: persistedQuotation.approvalStatus,
      customerStatus: persistedQuotation.customerStatus,
    });
  };

  const updateQuotation = async (id: string, updates: Partial<SalesQuotation>) => {
    const requestedQtNumber = String(updates.qtNumber || '').trim();
    let currentQuotation = quotations.find((qt) => qt.id === id)
      || (requestedQtNumber ? quotations.find((qt) => String(qt.qtNumber || '').trim() === requestedQtNumber) : undefined);

    if (!currentQuotation && requestedQtNumber) {
      const serverRows = await salesQuotationService.listViaServer({ qtNumber: requestedQtNumber }).catch(() => []);
      if (Array.isArray(serverRows) && serverRows.length > 0) {
        currentQuotation = serverRows[0] as SalesQuotation;
      }
    }

    if (!currentQuotation) {
      throw new Error(`Sales quotation ${requestedQtNumber || id} not found`);
    }

    const merged = normalizeSalesQuotationWritePayload({ ...currentQuotation, ...updates, updatedAt: new Date().toISOString() } as SalesQuotation);
    assertSalesQuotationWritePayload(merged);
    const updateIdentifier = String(currentQuotation.qtNumber || requestedQtNumber || currentQuotation.id || id).trim();
    let saved: SalesQuotation | null = null;
    try {
      saved = await salesQuotationService.updateStatus(
        updateIdentifier,
        String(merged.approvalStatus || currentQuotation.approvalStatus || 'draft'),
        merged,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || '');
      if (!/No sales quotation matched identifier/i.test(message)) {
        throw error;
      }
      saved = await salesQuotationService.upsertViaServer(merged);
    }
    if (!saved) {
      throw new Error('Supabase update sales quotation failed');
    }
    const persistedQuotation = ensureSalesQuotationPersistedBinding(saved as SalesQuotation, merged);
    setQuotations(prev => {
      const matchedExisting = prev.some((qt) => qt.id === currentQuotation?.id || String(qt.qtNumber || '').trim() === String(currentQuotation?.qtNumber || '').trim());
      const nextRows = matchedExisting
        ? prev.map((qt) => (
            qt.id === currentQuotation?.id || String(qt.qtNumber || '').trim() === String(currentQuotation?.qtNumber || '').trim()
              ? persistedQuotation
              : qt
          ))
        : [persistedQuotation, ...prev];
      writeSalesQuotationContextCache(nextRows);
      return nextRows;
    });
    if (updates.customerStatus === 'sent' || updates.customerStatus === 'viewed') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_SENT, { id: String(persistedQuotation.id || id), qtNumber: String(currentQuotation?.qtNumber || requestedQtNumber || id) }, { customerStatus: updates.customerStatus });
    }
    if (updates.customerStatus === 'accepted') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_ACCEPTED, { id: String(persistedQuotation.id || id), qtNumber: String(currentQuotation?.qtNumber || requestedQtNumber || id) }, { customerStatus: updates.customerStatus });
    }
  };

  const deleteQuotation = async (id: string) => {
    const currentQuotation = quotations.find((qt) => qt.id === id);
    await salesQuotationService.delete(id);
    setQuotations((prev) => {
      const nextRows = prev.filter((qt) => qt.id !== id);
      writeSalesQuotationContextCache(nextRows);
      return nextRows;
    });
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_DELETED, { id, qtNumber: String(currentQuotation?.qtNumber || id) });
  };

  const getQuotationById = (id: string) => {
    return quotations.find(qt => qt.id === id);
  };

  const getQuotationByNumber = (qtNumber: string) => {
    const normalizedTarget = String(qtNumber || '').trim().toUpperCase();
    if (!normalizedTarget) return undefined;

    return quotations.find((qt: any) => {
      const candidates = [
        qt?.qtNumber,
        qt?.quotationNumber,
        qt?.documentDataSnapshot?.quotationNo,
        qt?.documentDataSnapshot?.quotationNumber,
        qt?.documentRenderMeta?.quotationNumber,
        qt?.id,
      ];

      return candidates.some((candidate) => String(candidate || '').trim().toUpperCase() === normalizedTarget);
    });
  };

  const getQuotationsByQR = (qrNumber: string) => {
    return quotations.filter(qt => qt.qrNumber === qrNumber);
  };

  const getQuotationsByCustomer = (customerEmail: string) => {
    return quotations.filter(qt => qt.customerEmail === customerEmail);
  };

  const getQuotationsBySalesPerson = (salesPersonEmail: string) => {
    return quotations.filter((qt) =>
      matchesBusinessOwnerEmail(
        qt.ownerEmail || qt.salesPerson,
        salesPersonEmail,
        qt.region,
        qt.ownerUserId,
      ),
    );
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
