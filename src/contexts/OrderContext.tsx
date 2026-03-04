import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser } from '../utils/dataIsolation';
import { toast } from 'react-toastify';

import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { subscribeErpEvent } from '../lib/erp-core/event-bus';
import { ordersDb, fromOrderRow } from '../lib/supabase-db';
import { supabase } from '../lib/supabase';
import { orderService } from '../lib/supabaseService';

// 订单接口
export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  customerEmail?: string;
  quotationId?: string;
  quotationNumber?: string;
  date: string;
  expectedDelivery: string;
  totalAmount: number;
  currency: string;
  status: 'In Production' | 'Quality Inspection' | 'Ready to Ship' | 'Shipped' | 'Delivered' | 'Pending' | 'Awaiting Deposit' | 'Payment Proof Uploaded' | 'Deposit Received' | 'Preparing Production' | 'confirmed' | 'negotiating' | 'cancelled'; // 🔥 新增状态：Payment Proof Uploaded, Deposit Received
  progress: number;
  products: {
    name: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    specs?: string;
    produced?: number;
  }[];
  paymentStatus: string;
  paymentTerms?: string;
  shippingMethod: string;
  deliveryTerms?: string;
  trackingNumber?: string;
  notes?: string;
  createdFrom?: 'quotation' | 'manual' | 'import';
  createdAt?: string;
  updatedAt?: string;
  confirmed?: boolean; // Admin是否已确认订单
  confirmedAt?: string; // 确认时间
  confirmedBy?: string; // 确认人
  confirmedDate?: string; // 确认日期
  region?: 'NA' | 'SA' | 'EA'; // 🔥 区域信息
  country?: string; // 🔥 国家
  deliveryAddress?: string; // 🔥 交货地址
  contactPerson?: string; // 🔥 联系人
  phone?: string; // 🔥 电话
  customerFeedback?: { // 🔥 客户反馈
    status: 'accepted' | 'negotiate' | 'reject';
    message: string;
    submittedAt: number;
    submittedBy: string;
  };
  depositPaymentProof?: { // 🔥 定金付款水单（客户上传）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
    // 🔥 财务确认状态
    status?: 'pending' | 'confirmed' | 'rejected';
    confirmedAt?: string;
    confirmedBy?: string;
    rejectedReason?: string;
  };
  depositReceiptProof?: { // 🔥 定金收款水单（财务上传）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    actualAmount: number;  // 实际到账金额
    currency: string;
    receiptDate: string;   // 收款日期
    bankReference: string; // 银行流水号
    notes?: string;
  };
  balancePaymentProof?: { // 🔥 余款付款水单（客户上传）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
    // 🔥 财务确认状态
    status?: 'pending' | 'confirmed' | 'rejected';
    confirmedAt?: string;
    confirmedBy?: string;
    rejectedReason?: string;
  };
  balanceReceiptProof?: { // 🔥 余款收款水单（财务上传）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    actualAmount: number;  // 实际到账金额
    currency: string;
    receiptDate: string;   // 收款日期
    bankReference: string; // 银行流水号
    notes?: string;
  };
  contractTerms?: { // 合同条款
    paymentTerms?: string;
    deliveryTerms?: string;
    shippingMethod?: string;
    expectedDelivery?: string;
    qualityStandards?: string;
    warrantyTerms?: string;
    remarks?: string;
  };
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  clearAllOrders: () => void; // 🔥 清空所有订单
  getOrderByQuotation: (quotationNumber: string) => Order | undefined;
  getOrderById: (orderId: string) => Order | undefined;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);
const getOrderMarkers = (order: Partial<Order>): string[] => {
  return [order.id, order.orderNumber, order.quotationNumber].filter(Boolean).map((v) => String(v));
};

const emitOrderEvent = (key: string, order: Partial<Order> & { id: string }, metadata?: Record<string, unknown>) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-order-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'order',
    recordId: String(order.id),
    internalNo: String(order.orderNumber || order.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

// 初始订单数据（与AdminActiveOrders保持一致）
const initialOrders: Order[] = []; // 🗑️ 清空所有旧订单数据

export function OrderProvider({ children }: { children: ReactNode }) {
  // 🔒 数据隔离：根据用户类型加载数据
  // 🔥 修复：初始化为空数组，所有数据加载都在useEffect中进行
  const [orders, setOrders] = useState<Order[]>([]);

  // 🔒 监听 orders 变化，自动保存到用户专属存储
  // 🔥 禁用此useEffect，避免与updateOrder/addOrder中的手动保存冲突导致重复
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const currentUser = getCurrentUser();
  //     
  //     if (!currentUser) return;
  //     
  //     // Admin的更改需要特殊处理
  //     if (currentUser.type === 'admin') {
  //       // Admin视图是聚合的，不直接保存
  //       return;
  //     }
  //     
  //     // 客户保存到自己的专属存储
  //     setUserData('orders', orders, currentUser.email);
  //   }
  // }, [orders]);

  // 🔥 监听用户登录事件，加载订单：客户优先从后端 GET /api/orders 拉取（含“发送客户”的合同）
  useEffect(() => {
    let alive = true;
    const loadOrders = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;


      // Supabase 优先
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const supabaseOrders = currentUser.type === 'admin'
            ? await orderService.getAll()
            : await orderService.getByCustomerEmail(currentUser.email);
          if (Array.isArray(supabaseOrders) && supabaseOrders.length > 0 && alive) {
            const filtered = filterNotDeleted('order', supabaseOrders as Order[], o => getOrderMarkers(o));
            setOrders(filtered);
            return;
          }
        }
      } catch { /* fallback to legacy sources */ }

      // Supabase is the only source
    };

    loadOrders();
    const handleOrdersUpdated = () => { void loadOrders(); };
    const handleUserChanged = () => { void loadOrders(); };
    window.addEventListener('ordersUpdated', handleOrdersUpdated);
    window.addEventListener('userChanged', handleUserChanged);
    const unsubscribeErpEvents = subscribeErpEvent((event) => {
      if (event.domain !== 'order') return;
      if (
        event.key === ERP_EVENT_KEYS.ORDER_CREATED ||
        event.key === ERP_EVENT_KEYS.ORDER_STATUS_CHANGED ||
        event.key === ERP_EVENT_KEYS.ORDER_DELETED
      ) {
        void loadOrders();
      }
    });

    // Supabase Realtime 订阅（当 Supabase 有数据时刷新）
    const realtimeChannel = ordersDb.subscribeChanges(() => { void loadOrders(); });

    return () => {
      alive = false;
      window.removeEventListener('ordersUpdated', handleOrdersUpdated);
      window.removeEventListener('userChanged', handleUserChanged);
      unsubscribeErpEvents();
      void supabase.removeChannel(realtimeChannel);
    };
  }, []);

  const addOrder = (order: Order) => {
    if (!order.customerEmail) {
      toast.error('订单创建失败', { description: '订单缺少客户邮箱信息' });
      return;
    }

    // Supabase 主写入（异步，不阻塞 UI）
    void orderService.upsert(order).catch(() => {});

    // 立即更新 React State
    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id || o.orderNumber === order.orderNumber);
      return exists ? prev.map(o => (o.id === order.id || o.orderNumber === order.orderNumber) ? { ...o, ...order } : o) : [order, ...prev];
    });

    window.dispatchEvent(new CustomEvent('ordersUpdated', {
      detail: { action: 'add', orderNumber: order.orderNumber, customerEmail: order.customerEmail }
    }));
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_CREATED, order, {
      status: order.status,
      quotationNumber: order.quotationNumber || null,
    });
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    const merged = { ...updates, updatedAt: new Date().toISOString() };

    // 更新 React State（立即响应 UI）
    setOrders(prev => prev.map(o =>
      (o.id === orderId || o.orderNumber === orderId) ? { ...o, ...merged } : o
    ));

    // Supabase 主写入（异步）
    const target = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (target) {
      void orderService.upsert({ ...target, ...merged }).catch(() => {});
    }

    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { action: 'update', orderId } }));
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_STATUS_CHANGED, {
      id: orderId,
      orderNumber: String(updates.orderNumber || orderId),
    }, {
      fields: Object.keys(updates || {}),
      status: updates.status || null,
    });
  };


  const deleteOrder = (orderId: string) => {
    const currentUser = getCurrentUser();
    const orderToDelete = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    const deletionMarkers = new Set<string>([String(orderId)]);
    if (orderToDelete) getOrderMarkers(orderToDelete).forEach((m) => deletionMarkers.add(m));

    setOrders(prev => prev.filter(o => o.id !== orderId && o.orderNumber !== orderId));

    addTombstones('order', Array.from(deletionMarkers), {
      reason: 'manual_delete',
      deletedBy: currentUser?.email || 'unknown',
    });
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { action: 'delete', orderId } }));
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_DELETED, { id: orderId, orderNumber: String(orderId) });
  };

  const clearAllOrders = () => {
    setOrders([]);
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { action: 'clear' } }));
  };

  const getOrderByQuotation = (quotationNumber: string) => {
    return orders.find((order) => order.quotationNumber === quotationNumber);
  };

  const getOrderById = (orderId: string) => {
    return orders.find((order) => order.id === orderId);
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        addOrder,
        updateOrder,
        deleteOrder,
        clearAllOrders, // 🔥 添加清空所有订单的方法
        getOrderByQuotation,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}

