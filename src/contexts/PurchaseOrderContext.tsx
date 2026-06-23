import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { purchaseOrderService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { addTombstones, filterNotDeleted, removeTombstones } from '../lib/erp-core/deletion-tombstone';
import type { PurchaseOrderData } from '../components/documents/templates/PurchaseOrderDocument';
import { buildIdentityAuditMetadata, buildIdentityPersistenceFields } from '../utils/dataIsolation';
import { assertBusinessOwnerEmail } from '../utils/quotationOwnership';
import { derivePurchaseOrderWorkflowFields } from '../lib/services/purchaseOrderQuoteRequirementServices';

// 🔥 采购订单状态
export type POStatus = 'pending' | 'confirmed' | 'producing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type PurchaseOrderPaymentMode =
  | 'tt_deposit_balance_before_shipment'
  | 'tt_deposit_balance_against_bl'
  | 'lc_100'
  | 'deposit_plus_lc'
  | 'dp'
  | 'da'
  | 'oa'
  | 'mixed';

export type PurchaseOrderDocumentType = 'PR' | 'CG';
export type PurchaseOrderApprovalStatus = 'draft' | 'pending_l1' | 'pending_l2' | 'approved' | 'rejected' | 'not_required';

// 🔥 采购订单产品项接口
export interface PurchaseOrderItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  currency: string;
  subtotal: number;
  hsCode?: string;
  packingRequirement?: string;
  remarks?: string;
  customerProductId?: string;
  projectId?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
}

// 🔥 采购订单接口
export interface PurchaseOrder {
  id: string;
  poNumber: string; // 采购订单号
  requirementNo?: string; // 关联的采购需求编号
  sourceRef?: string; // 来源单号（销售订单号等）
  sourceSONumber?: string; // 🔥 新增：关联销售订单编号 SO-xxx
  // Phase 3a: typed SC linkage — replaces the previous `as any` cast in requestProcurementFromContract
  salesContractNumber?: string; // 关联的销售合同编号 SC-xxx
  quotationNumber?: string;     // 关联的报价单编号 QT-xxx (set at PR creation from SC.quotationNumber)

  // ── Phase 3b: PR → CG relationship fields ──────────────────────────────────────────────────────
  // PR records (poNumber: PR-xxx) are procurement requests created from SC by the salesperson.
  // CG records (poNumber: CG-xxx) are supplier orders generated from PR by admin allocation.
  // One PR can produce multiple CG records (one per allocated supplier).

  // On CG records: the PR number (PR-xxx) of the parent procurement request that produced this CG
  // via submitSupplierAllocation. Absent on legacy direct-CG records (handleSubmitCreateOrder path).
  parentRequestPoNumber?: string;

  // On PR records: CG numbers generated from this PR during supplier allocation
  pendingSupplierPONumbers?: string[];

  // On PR records: number of suppliers allocated in the last allocation operation
  allocatedSupplierCount?: number;

  // On PR records: true once at least one supplier allocation has been submitted
  supplierAllocationReady?: boolean;

  // On both PR and CG records: position in the procurement request lifecycle.
  // PR lifecycle:  pending_procurement_assignment → partial_allocated | allocated_completed
  // CG lifecycle:  draft_allocated → pending_manager_approval → pending_ceo_approval? → approved_boss → pushed_supplier
  //               (rejected_boss is a terminal failure state requiring re-initiation)
  // Phase 3c precondition: union completed to include all active CG lifecycle values.
  procurementRequestStatus?:
    | 'pending_procurement_assignment'  // PR: created, awaiting admin supplier allocation
    | 'partial_allocated'               // PR: some items allocated; remainder still in pool
    | 'allocated_completed'             // PR: all items distributed to suppliers
    | 'draft_allocated'                 // CG: created from PR allocation, not yet submitted for review
    | 'pending_manager_approval'        // CG: submitted for procurement manager review
    | 'pending_ceo_approval'            // CG: manager approved and amount exceeds CEO threshold
    | 'approved_boss'                   // CG: boss approved, ready to push to supplier
    | 'rejected_boss'                   // CG: boss rejected; requires re-initiation
    | 'pushed_supplier';                // CG: pushed to supplier — execution has started
  documentType?: PurchaseOrderDocumentType;
  approvalStatus?: PurchaseOrderApprovalStatus;
  prValidationStatus?: 'pending' | 'passed' | 'failed';
  prValidatedAt?: string;
  prValidatedBy?: string;
  cgType?: 'standard' | 'urgent' | 'exception' | 'over_budget';
  selectedBjId?: string | null;
  bjLockedAt?: string;
  // ────────────────────────────────────────────────────────────────────────────────────────────────

  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
  
  // 🔥 订单组信息（用于关联多供应商订单）
  orderGroup?: string; // 订单组号，例如: "PO-GROUP-20251217-001"
  isPartOfGroup?: boolean; // 是否属于订单组
  groupTotalOrders?: number; // 订单组中总PO数量
  groupNote?: string; // 订单组备注（例如："同一客户订单拆分"）
  
  // 🔥 XJ关联信息（如果PO是基于供应商报价创建的）
  xjId?: string; // 关联的XJ ID
  xjNumber?: string; // 关联的XJ编号
  selectedQuote?: { // 选中的供应商报价信息
    supplierCode: string;
    supplierName: string;
    quotedDate: string;
    quotedPrice: number; // 供应商报价
    leadTime: number; // 交货周期
    moq: number; // 最小订购量
    validityDays: number; // 报价有效期
    paymentTerms: string;
    remarks?: string;
  };
  
  // 🔥 供应商信息（每个PO只对应1个供应商）
  supplierName: string;
  supplierCode: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  
  // 🔥 区域信息（继承自采购需求）
  region?: string; // NA/SA/EA - 用于市场区分
  // ❌ 采购员不能看到客户信息 - 权限隔离原则
  // customerName?: string;
  
  // 产品清单
  items: PurchaseOrderItem[];
  
  // 金额信息
  totalAmount: number;
  currency: string;
  
  // 条款信息
  paymentMode?: PurchaseOrderPaymentMode | null;
  paymentTerms: string;
  deliveryTerms: string;
  
  // 日期信息
  orderDate: string;
  expectedDate: string;
  actualDate?: string;
  
  // 状态信息
  status: POStatus;
  paymentStatus: PaymentStatus;
  executionStatus?: string;
  supplierConfirmedAt?: string;
  supplierRejectedAt?: string;
  supplierReplyNotes?: string;
  sampleRequired?: boolean;
  preProductionSampleStatus?: string;
  preProductionSampleNo?: string;
  sampleRound?: number;
  preProductionSampleSentAt?: string;
  sampleConfirmedAt?: string;
  sealConfirmedAt?: string;
  productionStartedAt?: string;
  estimatedCompletionDate?: string;
  productionCompletedAt?: string;
  supplierSelfInspectionStatus?: string;
  qcInspectionStatus?: string;
  qcReleaseStatus?: string;
  qcReleaseBlockReason?: string;
  releaseApprovedBy?: string;
  inspectionExecutionMode?: string;
  customerDesignatedInspectionAgency?: string;
  customerDesignatedInspectionStatus?: string;
  finishedGoodsConfirmedAt?: string;
  customerInspectionMode?: string;
  goodsReadyNotifiedToCustomerAt?: string;
  inspectionMethodNotifiedAt?: string;
  qcReportSharedToCustomerAt?: string;
  customerBalanceStatus?: string;
  supplierBalanceStatus?: string;
  collectionControlMode?: string;
  documentReleaseMode?: string;
  customerBalanceGateStatus?: string;
  customerBalanceConfirmedAt?: string;
  lcType?: string;
  lcOpenedAt?: string;
  lcDiscrepancyStatus?: string;
  lcMaturityDate?: string;
  supplierBalanceConfirmedAt?: string;
  supplierBalanceConfirmedBy?: string;
  bankSubmittedAt?: string;
  bankSubmittedBy?: string;
  acceptanceStatus?: string;
  acceptanceDate?: string;
  acceptanceMaturityDate?: string;
  bookingResponsibility?: string;
  freightConfirmationRequired?: boolean;
  freightConfirmedByCustomerAt?: string;
  bookingStatus?: string;
  freightInquiryStatus?: string;
  selectedBookingQuoteId?: string;
  shippingOrderStatus?: string;
  customerPaymentReceivedAt?: string;
  customerPaymentConfirmedAt?: string;
  financeConfirmedReceivedBy?: string;
  bankSubmissionStatus?: string;
  documentReleaseStatus?: string;
  documentReleasedAt?: string;
  documentReleasedBy?: string;
  fulfillmentMode?: string;
  consolidationRequired?: boolean;
  loadingSupervisionMode?: string;
  loadingSupervisionAgencyName?: string;
  loadingSupervisionRequired?: boolean;
  loadingSupervisionFeedbackStatus?: string;
  shipmentReadinessStatus?: string;
  executionRemarks?: string;
  
  // 其他信息
  remarks?: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSnapshot?: any;
  documentDataSnapshot?: PurchaseOrderData;
  documentRenderMeta?: any;
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
}

interface PurchaseOrderContextType {
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (order: PurchaseOrder) => Promise<void>;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
  getPurchaseOrderById: (id: string) => PurchaseOrder | undefined;
  getPurchaseOrdersByRequirement: (requirementNo: string) => PurchaseOrder[];
  
  // 🔥 订单组相关方法
  getPurchaseOrdersByGroup: (orderGroup: string) => PurchaseOrder[];
  addPurchaseOrderBatch: (orders: PurchaseOrder[]) => Promise<void>; // 批量添加（用于拆单）
  getOrderGroupStats: (orderGroup: string) => {
    total: number;
    confirmed: number;
    shipped: number;
    completed: number;
  };
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

const assertPurchaseOrderWritePayload = (order: Partial<PurchaseOrder>) => {
  if (!order.templateSnapshot || !order.documentDataSnapshot) {
    throw new Error(`CG/PO ${order.poNumber || order.id || ''} 缺少模板快照数据，已阻止写入`);
  }
};

const assertPurchaseOrderPersistedBinding = (order: Partial<PurchaseOrder>) => {
  if (!order.templateId || !order.templateVersionId || !order.templateSnapshot || !order.documentDataSnapshot) {
    throw new Error(`CG/PO ${order.poNumber || order.id || ''} 缺少模板绑定字段，Supabase 返回结果不完整`);
  }
};

const normalizePurchaseOrderWritePayload = (order: PurchaseOrder): PurchaseOrder => {
  const ownerEmail = assertBusinessOwnerEmail(
    order.ownerEmail,
    order.region,
    '采购单',
  );
  const ownerName = String(order.ownerName || '').trim() || null;
  const workflowFields = derivePurchaseOrderWorkflowFields(order);
  const existingRenderMeta = order.documentRenderMeta || {};

  return {
    ...order,
    ownerEmail,
    ownerName,
    documentType: order.documentType || workflowFields.documentType,
    approvalStatus: order.approvalStatus || workflowFields.approvalStatus,
    executionStatus: order.executionStatus || workflowFields.executionStatus,
    documentRenderMeta: {
      ...existingRenderMeta,
      ...buildIdentityAuditMetadata({
        ownerEmail,
        ownerName,
        ownerRole: order.ownerRole || null,
        region: order.region || null,
      }),
      procurementWorkflow: {
        ...(existingRenderMeta?.procurementWorkflow || {}),
        documentType: order.documentType || workflowFields.documentType,
        approvalStatus: order.approvalStatus || workflowFields.approvalStatus,
        executionStatus: order.executionStatus || workflowFields.executionStatus,
      },
    },
    ...buildIdentityPersistenceFields({
      ownerEmail,
      ownerName,
      ownerRole: order.ownerRole || null,
    }),
  };
};

const getPurchaseOrderMarkers = (order: Partial<PurchaseOrder>): string[] =>
  [order.id, order.poNumber].filter(Boolean).map((v) => String(v));

const filterVisiblePurchaseOrders = (list: PurchaseOrder[]): PurchaseOrder[] =>
  filterNotDeleted('order', list, (order) => getPurchaseOrderMarkers(order));

const normalizeCurrencyCode = (value: unknown): string => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'RMB' || raw === 'CN¥' || raw === 'YUAN') return 'CNY';
  return raw;
};

const mergePurchaseOrders = (localOrders: PurchaseOrder[], serverOrders: PurchaseOrder[]): PurchaseOrder[] => {
  const byKey = new Map<string, PurchaseOrder>();
  // 先放本地（兜底）
  localOrders.forEach((order) => {
    const key = String(order.poNumber || order.id || '').trim();
    if (key) byKey.set(key, order);
  });
  // 再放服务端（同key覆盖本地，确保服务端为准）
  serverOrders.forEach((order) => {
    const key = String(order.poNumber || order.id || '').trim();
    if (key) byKey.set(key, order);
  });
  return Array.from(byKey.values());
};

export const PurchaseOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 修复历史误删：过去把 SC/XJ 等来源号错误写入 order tombstone，导致订单列表被误隐藏
  // 注：CQ tombstone 修复逻辑已移除（历史 localStorage 数据已废弃，Supabase 为唯一数据源）
  useEffect(() => {
    const removedLegacy = removeTombstones((t) => {
      if (t.domain !== 'order') return false;
      const marker = String(t.marker || '').trim().toUpperCase();
      const reason = String(t.reason || '').trim();
      if (reason !== 'manual-delete-purchase-order') return false;
      return /^(SC-|QT-|ING-|XJ-|QR-|PR-|CG-)/.test(marker);
    });
    if (removedLegacy > 0) {
      console.warn(`⚠️ [PurchaseOrderContext] removed ${removedLegacy} invalid order tombstones`);
      window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    }
  }, []);


  // 修复历史数据：若存在由 CQ 请求拆出的 CG 子单，但 CQ 主请求被误删，则自动补回 CQ 记录
  useEffect(() => {
    setPurchaseOrders((prev) => {
      if (!prev.length) return prev;
      const byPo = new Map<string, PurchaseOrder>();
      prev.forEach((o) => byPo.set(String(o.poNumber || '').trim().toUpperCase(), o));

      let changed = false;
      const next = [...prev];
      const parentMap = new Map<string, PurchaseOrder[]>();
      prev.forEach((o) => {
        const parent = String(o.parentRequestPoNumber || '').trim().toUpperCase();
        if (!/^CQ-\d{6}-\d{4}$/.test(parent)) return;
        const list = parentMap.get(parent) || [];
        list.push(o);
        parentMap.set(parent, list);
      });

      parentMap.forEach((children, parentNo) => {
        if (byPo.has(parentNo)) return;
        const seed = children[0];
        if (!seed) return;
        const mergedItems = children.flatMap((c) => c.items || []);
        const totalAmount = children.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
        const recovered: PurchaseOrder = {
          id: `recovered-${parentNo.toLowerCase()}-${Date.now()}`,
          poNumber: parentNo,
          requirementNo: seed.requirementNo,
          sourceRef: seed.sourceRef,
          sourceSONumber: seed.sourceSONumber,
          xjId: seed.xjId ?? seed.rfqId,
          xjNumber: seed.xjNumber,
          supplierName: '待分配供应商',
          supplierCode: 'TBD',
          region: seed.region || 'NA',
          items: mergedItems,
          totalAmount,
          currency: seed.currency || 'USD',
          paymentTerms: seed.paymentTerms || '',
          deliveryTerms: seed.deliveryTerms || '',
          orderDate: seed.orderDate || new Date().toISOString(),
          expectedDate: seed.expectedDate || new Date().toISOString(),
          status: 'pending',
          paymentStatus: 'unpaid',
          remarks: '系统自动补回（历史误删修复）',
          createdBy: seed.createdBy || 'system',
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          ownerEmail: seed.ownerEmail || null,
          ownerName: seed.ownerName || null,
          ownerRole: seed.ownerRole || null,
          ...( {
            procurementRequestStatus: 'partial_allocated',
            supplierAllocationReady: true,
            allocatedSupplierCount: children.length,
            pendingSupplierPONumbers: children.map((c) => c.poNumber),
          } as any ),
        };
        next.push(recovered);
        byPo.set(parentNo, recovered);
        changed = true;
      });

      return changed ? filterVisiblePurchaseOrders(next) : prev;
    });
  }, []);


  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Supabase-first: 从 purchase_orders 表加载
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = await purchaseOrderService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      setPurchaseOrders(rows.filter(Boolean) as PurchaseOrder[]);
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setPurchaseOrders([]);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let alive = true;
    const reload = async () => {
      const rows = await purchaseOrderService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      setPurchaseOrders(rows.filter(Boolean) as PurchaseOrder[]);
    };
    const channel = purchaseOrderService.subscribeToChanges(() => {
      void reload();
    });
    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);


  const addPurchaseOrder = async (order: PurchaseOrder) => {
    const normalizedOrder = normalizePurchaseOrderWritePayload(order);
    assertPurchaseOrderWritePayload(normalizedOrder);
    const saved = await purchaseOrderService.upsert(normalizedOrder);
    if (!saved) {
      throw new Error(`CG/PO ${order.poNumber || order.id} 写入 Supabase 失败`);
    }
    assertPurchaseOrderPersistedBinding(saved as PurchaseOrder);
    setPurchaseOrders(prev => {
      const exists = prev.some(o => o.id === (saved as PurchaseOrder).id || o.poNumber === (saved as PurchaseOrder).poNumber);
      const newOrders = exists
        ? prev.map(o => (o.id === (saved as PurchaseOrder).id || o.poNumber === (saved as PurchaseOrder).poNumber ? saved as PurchaseOrder : o))
        : [...prev, saved as PurchaseOrder];
      return filterVisiblePurchaseOrders(newOrders);
    });
  };

  const updatePurchaseOrder = async (id: string, updates: Partial<PurchaseOrder>) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    if (!target) return;
    const merged = normalizePurchaseOrderWritePayload({
      ...target,
      ...updates,
      updatedDate: new Date().toISOString(),
    } as PurchaseOrder);
    assertPurchaseOrderWritePayload(merged);
    const saved = await purchaseOrderService.upsert(merged);
    if (!saved) {
      throw new Error(`CG/PO ${target.poNumber || id} 更新 Supabase 失败`);
    }
    assertPurchaseOrderPersistedBinding(saved as PurchaseOrder);
    setPurchaseOrders(prev => filterVisiblePurchaseOrders(prev.map(order => (
      (order.id === id || order.poNumber === id)
        ? saved as PurchaseOrder
        : order
    ))));
  };

  const deletePurchaseOrder = async (id: string) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    await purchaseOrderService.delete(id);
    const markers = getPurchaseOrderMarkers(target || { id });
    addTombstones('order', markers, {
      reason: 'manual-delete-purchase-order',
      deletedBy: 'admin',
    });
    setPurchaseOrders(prev => filterVisiblePurchaseOrders(prev.filter(order => order.id !== id && order.poNumber !== id)));
  };

  const getPurchaseOrderById = (id: string) => {
    return purchaseOrders.find(order => order.id === id);
  };

  const getPurchaseOrdersByRequirement = (requirementNo: string) => {
    return purchaseOrders.filter(order => order.requirementNo === requirementNo);
  };

  const getPurchaseOrdersByGroup = (orderGroup: string) => {
    return purchaseOrders.filter(order => order.orderGroup === orderGroup);
  };

  const addPurchaseOrderBatch = async (orders: PurchaseOrder[]) => {
    const savedOrders: PurchaseOrder[] = [];
    for (const order of orders) {
      const normalizedOrder = normalizePurchaseOrderWritePayload(order);
      assertPurchaseOrderWritePayload(normalizedOrder);
      const saved = await purchaseOrderService.upsert(normalizedOrder);
      if (!saved) {
        throw new Error(`批量写入采购单 ${order.poNumber || order.id} 到 Supabase 失败`);
      }
      assertPurchaseOrderPersistedBinding(saved as PurchaseOrder);
      savedOrders.push(saved as PurchaseOrder);
    }

    setPurchaseOrders(prev => {
      const byPo = new Map<string, PurchaseOrder>();
      prev.forEach((o) => byPo.set(o.poNumber || o.id, o));
      savedOrders.forEach((o) => byPo.set(o.poNumber || o.id, o));
      const newOrders = Array.from(byPo.values());
      return filterVisiblePurchaseOrders(newOrders);
    });
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
  };

  const getOrderGroupStats = (orderGroup: string) => {
    const orders = purchaseOrders.filter(order => order.orderGroup === orderGroup);
    return {
      total: orders.length,
      confirmed: orders.filter(order => order.status === 'confirmed').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      completed: orders.filter(order => order.status === 'completed').length
    };
  };

  return (
    <PurchaseOrderContext.Provider
      value={{
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        getPurchaseOrderById,
        getPurchaseOrdersByRequirement,
        getPurchaseOrdersByGroup,
        addPurchaseOrderBatch,
        getOrderGroupStats
      }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
};

export const usePurchaseOrders = () => {
  const context = useContext(PurchaseOrderContext);
  if (context === undefined) {
    throw new Error('usePurchaseOrders must be used within a PurchaseOrderProvider');
  }
  return context;
};

export const useOptionalPurchaseOrders = () => useContext(PurchaseOrderContext);
