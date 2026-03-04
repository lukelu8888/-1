import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { purchaseOrderService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { addTombstones, filterNotDeleted, removeTombstones } from '../lib/erp-core/deletion-tombstone';

// 🔥 采购订单状态
export type POStatus = 'pending' | 'confirmed' | 'producing' | 'shipped' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

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
}

// 🔥 采购订单接口
export interface PurchaseOrder {
  id: string;
  poNumber: string; // 采购订单号
  requirementNo?: string; // 关联的采购需求编号
  sourceRef?: string; // 来源单号（销售订单号等）
  sourceSONumber?: string; // 🔥 新增：关联销售订单编号 SO-xxx
  
  // 🔥 订单组信息（用于关联多供应商订单）
  orderGroup?: string; // 订单组号，例如: "PO-GROUP-20251217-001"
  isPartOfGroup?: boolean; // 是否属于订单组
  groupTotalOrders?: number; // 订单组中总PO数量
  groupNote?: string; // 订单组备注（例如："同一客户订单拆分"）
  
  // 🔥 XJ关联信息（如果PO是基于供应商报价创建的）
  rfqId?: string; // 关联的XJ ID
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
  paymentTerms: string;
  deliveryTerms: string;
  
  // 日期信息
  orderDate: string;
  expectedDate: string;
  actualDate?: string;
  
  // 状态信息
  status: POStatus;
  paymentStatus: PaymentStatus;
  
  // 其他信息
  remarks?: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;
}

interface PurchaseOrderContextType {
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (order: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  getPurchaseOrderById: (id: string) => PurchaseOrder | undefined;
  getPurchaseOrdersByRequirement: (requirementNo: string) => PurchaseOrder[];
  
  // 🔥 订单组相关方法
  getPurchaseOrdersByGroup: (orderGroup: string) => PurchaseOrder[];
  addPurchaseOrderBatch: (orders: PurchaseOrder[]) => void; // 批量添加（用于拆单）
  getOrderGroupStats: (orderGroup: string) => {
    total: number;
    confirmed: number;
    shipped: number;
    completed: number;
  };
}

const PurchaseOrderContext = createContext<PurchaseOrderContextType | undefined>(undefined);

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
  useEffect(() => {
    const removedLegacy = removeTombstones((t) => {
      if (t.domain !== 'order') return false;
      const marker = String(t.marker || '').trim().toUpperCase();
      const reason = String(t.reason || '').trim();
      if (reason !== 'manual-delete-purchase-order') return false;
      // 仅清理“非采购单本体”的错误 marker，保留真正 PO/CQ 删除标记
      return /^(SC-|QT-|RFQ-|INQ-|XJ-|SO-|QR-)/.test(marker);
    });

    // 修复历史误操作：系统曾错误调用删除采购请求，写入了 CQ 的 tombstone，导致采购请求池被永久隐藏
    // 仅当本地仍存在同号 CQ 单据时，移除该 tombstone，避免影响用户手动删除的真实意图
    let removedCQ = 0;
    try {
      const raw = localStorage.getItem('purchaseOrders');
      const parsed = raw ? JSON.parse(raw) : [];
      const existingCQ = new Set(
        (Array.isArray(parsed) ? parsed : [])
          .map((o: any) => String(o?.poNumber || '').trim().toUpperCase())
          .filter((no: string) => /^CQ-\d{6}-\d{4}$/.test(no))
      );
      if (existingCQ.size > 0) {
        removedCQ = removeTombstones((t) => {
          if (t.domain !== 'order') return false;
          const reason = String(t.reason || '').trim();
          if (reason !== 'manual-delete-purchase-order') return false;
          const marker = String(t.marker || '').trim().toUpperCase();
          return /^CQ-\d{6}-\d{4}$/.test(marker) && existingCQ.has(marker);
        });
      }
    } catch {
      removedCQ = 0;
    }

    const totalRemoved = removedLegacy + removedCQ;
    if (totalRemoved > 0) {
      console.warn(`⚠️ [PurchaseOrderContext] removed ${totalRemoved} invalid order tombstones (legacy=${removedLegacy}, cq=${removedCQ})`);
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
        const parent = String((o as any).parentRequestPoNumber || '').trim().toUpperCase();
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
          rfqId: seed.rfqId,
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

  // 兜底恢复：若采购需求中已记录“采购单号: CQ-xxxx”，但 CQ 请求单在采购订单池缺失，则自动补回
  useEffect(() => {
    setPurchaseOrders((prev) => {
      let requirements: any[] = [];
      try {
        const rawReq = localStorage.getItem('purchaseRequirements');
        const parsedReq = rawReq ? JSON.parse(rawReq) : [];
        requirements = Array.isArray(parsedReq) ? parsedReq : [];
      } catch {
        requirements = [];
      }
      if (!requirements.length) return prev;

      const byPo = new Map<string, PurchaseOrder>();
      prev.forEach((o) => byPo.set(String(o.poNumber || '').trim().toUpperCase(), o));
      let changed = false;
      const next = [...prev];
      const cqMarkersToKeep = new Set<string>();

      requirements.forEach((req: any) => {
        const special = String(req?.specialRequirements || '');
        const match = special.match(/采购单号[:：]\s*(CQ-\d{6}-\d{4})/i);
        if (!match) return;
        const cqNo = String(match[1] || '').trim().toUpperCase();
        if (!cqNo) return;
        cqMarkersToKeep.add(cqNo);
        if (byPo.has(cqNo)) return;

        const items = Array.isArray(req?.items)
          ? req.items.map((item: any, idx: number) => ({
              id: String(item?.id || `item-${idx + 1}`),
              productName: String(item?.productName || 'Unknown Product'),
              modelNo: String(item?.modelNo || item?.productName || '-'),
              specification: String(item?.specification || ''),
              quantity: Number(item?.quantity || 0),
              unit: String(item?.unit || 'PCS'),
              unitPrice: Number(item?.targetPrice || 0),
              currency: normalizeCurrencyCode(item?.targetCurrency || req?.currency || '') || 'USD',
              subtotal: Number(item?.quantity || 0) * Number(item?.targetPrice || 0),
              hsCode: String(item?.hsCode || ''),
              packingRequirement: String(item?.packingRequirement || ''),
              remarks: String(item?.remarks || ''),
            }))
          : [];

        const recovered: PurchaseOrder = {
          id: `recovered-${cqNo.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          poNumber: cqNo,
          requirementNo: String(req?.requirementNo || '').trim(),
          sourceRef: String(req?.sourceInquiryNumber || req?.sourceRef || '').trim(),
          sourceSONumber: String(req?.salesOrderNo || req?.sourceRef || '').trim(),
          salesContractNumber: String(req?.sourceRef || '').trim(),
          xjNumber: String(req?.sourceInquiryNumber || '').trim(),
          supplierName: '待采购分配',
          supplierCode: 'TBD',
          region: String(req?.region || 'NA'),
          items,
          totalAmount: 0,
          currency: normalizeCurrencyCode(req?.currency || items?.[0]?.currency || 'USD') || 'USD',
          paymentTerms: '待采购确认',
          deliveryTerms: '待采购确认',
          orderDate: String(req?.createdDate || new Date().toISOString()),
          expectedDate: String(req?.requiredDate || new Date().toISOString()),
          status: 'pending',
          paymentStatus: 'unpaid',
          remarks: special || '系统自动补回采购请求',
          createdBy: String(req?.createdBy || 'system'),
          createdDate: String(req?.createdDate || new Date().toISOString()),
          updatedDate: new Date().toISOString(),
          ...( { procurementRequestStatus: 'pending_procurement_assignment' } as any ),
        };
        next.push(recovered);
        byPo.set(cqNo, recovered);
        changed = true;
      });

      if (cqMarkersToKeep.size > 0) {
        const removed = removeTombstones((t) => {
          if (t.domain !== 'order') return false;
          if (String(t.reason || '') !== 'manual-delete-purchase-order') return false;
          const marker = String(t.marker || '').trim().toUpperCase();
          return /^CQ-\d{6}-\d{4}$/.test(marker) && cqMarkersToKeep.has(marker);
        });
        if (removed > 0) changed = true;
      }

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


  const addPurchaseOrder = (order: PurchaseOrder) => {
    console.log('➕ 添加新采购订单:', order);
    setPurchaseOrders(prev => {
      const exists = prev.some(o => o.id === order.id || o.poNumber === order.poNumber);
      const newOrders = exists ? prev.map(o => (o.id === order.id || o.poNumber === order.poNumber ? order : o)) : [...prev, order];
      console.log('  ✅ 当前采购订单总数:', newOrders.length);
      return filterVisiblePurchaseOrders(newOrders);
    });
    purchaseOrderService.upsert(order).catch((e) => console.warn('⚠️ PO upsert failed:', e));
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    const poRef = target?.poNumber || target?.id || id;
    setPurchaseOrders(prev => filterVisiblePurchaseOrders(prev.map(order => (
      (order.id === id || order.poNumber === id)
        ? { ...order, ...updates, updatedDate: new Date().toISOString() }
        : order
    ))));
    const updated = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    if (updated) purchaseOrderService.upsert({ ...updated, ...updates }).catch((e) => console.warn('⚠️ PO update failed:', e));
  };

  const deletePurchaseOrder = (id: string) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    const poRef = target?.poNumber || target?.id || id;
    const markers = getPurchaseOrderMarkers(target || { id });
    addTombstones('order', markers, {
      reason: 'manual-delete-purchase-order',
      deletedBy: 'admin',
    });
    setPurchaseOrders(prev => filterVisiblePurchaseOrders(prev.filter(order => order.id !== id && order.poNumber !== id)));
    purchaseOrderService.delete(id).catch((e) => console.warn('⚠️ PO delete failed:', e));
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

  const addPurchaseOrderBatch = (orders: PurchaseOrder[]) => {
    console.log('➕ 批量添加新采购订单:', orders);
    setPurchaseOrders(prev => {
      const byPo = new Map<string, PurchaseOrder>();
      prev.forEach((o) => byPo.set(o.poNumber || o.id, o));
      orders.forEach((o) => byPo.set(o.poNumber || o.id, o));
      const newOrders = Array.from(byPo.values());
      console.log('  ✅ 当前采购订单总数:', newOrders.length);
      return filterVisiblePurchaseOrders(newOrders);
    });
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    void (async () => {
      for (const order of orders) {
        try {
          await apiFetchJson('/api/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });
        } catch (e) {
          console.warn('⚠️ [PurchaseOrderContext] addPurchaseOrderBatch item sync failed:', order.poNumber, e);
        }
      }
      window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    })();
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
