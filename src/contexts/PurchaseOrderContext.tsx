import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { apiFetchJson } from '../api/backend-auth';

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
  
  // 🔥 RFQ关联信息（如果PO是基于供应商报价创建的）
  rfqId?: string; // 关联的RFQ ID
  rfqNumber?: string; // 关联的RFQ编号
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

export const PurchaseOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 先从 localStorage 启动，随后由接口数据覆盖（接口优先，本地兜底）
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('purchaseOrders');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📦 从localStorage加载采购订单数据，总数:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('❌ 加载采购订单数据失败:', e);
        }
      }
    }
    return [];
  });

  // 🔥 每次purchaseOrders变化时，自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders));
      console.log('💾 采购订单已保存到localStorage，总数:', purchaseOrders.length);
    }
  }, [purchaseOrders]);

  // 接口化：加载采购订单列表
  useEffect(() => {
    let alive = true;
    const loadPurchaseOrders = async () => {
      try {
        const res = await apiFetchJson<{ purchaseOrders: PurchaseOrder[] }>('/api/purchase-orders');
        const serverOrders = Array.isArray(res?.purchaseOrders) ? res.purchaseOrders : [];
        if (!alive) return;
        // 接口优先：请求成功即覆盖本地（可为空数组）
        setPurchaseOrders(serverOrders);
      } catch (e) {
        // 接口失败时保留本地
        console.warn('⚠️ [PurchaseOrderContext] load purchase-orders failed, fallback to localStorage:', e);
      }
    };

    void loadPurchaseOrders();
    const onUpdated = () => { void loadPurchaseOrders(); };
    const onAuthChanged = () => { void loadPurchaseOrders(); };
    window.addEventListener('purchaseOrdersUpdated', onUpdated);
    window.addEventListener('authTokenChanged', onAuthChanged);
    return () => {
      alive = false;
      window.removeEventListener('purchaseOrdersUpdated', onUpdated);
      window.removeEventListener('authTokenChanged', onAuthChanged);
    };
  }, []);

  const addPurchaseOrder = (order: PurchaseOrder) => {
    console.log('➕ 添加新采购订单:', order);
    setPurchaseOrders(prev => {
      const exists = prev.some(o => o.id === order.id || o.poNumber === order.poNumber);
      const newOrders = exists ? prev.map(o => (o.id === order.id || o.poNumber === order.poNumber ? order : o)) : [...prev, order];
      console.log('  ✅ 当前采购订单总数:', newOrders.length);
      return newOrders;
    });
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    void (async () => {
      try {
        await apiFetchJson<{ purchaseOrder: PurchaseOrder }>('/api/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
      } catch (e) {
        console.warn('⚠️ [PurchaseOrderContext] addPurchaseOrder sync failed:', e);
      }
    })();
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    const poRef = target?.poNumber || target?.id || id;
    setPurchaseOrders(prev => prev.map(order => (
      (order.id === id || order.poNumber === id)
        ? { ...order, ...updates, updatedDate: new Date().toISOString() }
        : order
    )));
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    void (async () => {
      try {
        await apiFetchJson<{ purchaseOrder: PurchaseOrder }>(`/api/purchase-orders/${encodeURIComponent(poRef)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
      } catch (e) {
        console.warn('⚠️ [PurchaseOrderContext] updatePurchaseOrder sync failed:', e);
      }
    })();
  };

  const deletePurchaseOrder = (id: string) => {
    const target = purchaseOrders.find(o => o.id === id || o.poNumber === id);
    const poRef = target?.poNumber || target?.id || id;
    setPurchaseOrders(prev => prev.filter(order => order.id !== id && order.poNumber !== id));
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
    void (async () => {
      try {
        await apiFetchJson(`/api/purchase-orders/${encodeURIComponent(poRef)}`, {
          method: 'DELETE',
        });
        window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
      } catch (e) {
        console.warn('⚠️ [PurchaseOrderContext] deletePurchaseOrder sync failed:', e);
      }
    })();
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
      return newOrders;
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