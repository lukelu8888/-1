import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData, setUserData, getAllCustomersData, getCurrentUser } from '../utils/dataIsolation';
import { toast } from 'react-toastify';
import { apiFetchJson } from '../api/backend-auth';
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
  region?: 'NA' | 'SA' | 'EU' | 'EMEA'; // 🔥 区域信息
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

      // Supabase is the only source; no admin fallback needed
      return;

      // 客户模式：优先从后端拉取，客户在任意设备都能看到业务员“发送客户”的订单
      try {
        const res = await apiFetchJson<{ orders: Order[] }>('/api/orders');
        const serverOrders = filterNotDeleted(
          'order',
          Array.isArray(res?.orders) ? res.orders : [],
          (order) => getOrderMarkers(order),
        );
        if (alive) {
          setOrders(serverOrders);
          // 同步到本地，便于离线或后续更新
          if (serverOrders.length > 0) setUserData('orders', serverOrders, currentUser.email);
        }
      } catch (e) {
        const customerOrders = getUserData<Order>('orders', currentUser.email);

        // 额外从 salesContracts 中读取发送给当前客户的合同（兜底：customerEmail 可能写错了 key）
        const contractOrders: Order[] = [];
        try {
          const allContracts: any[] = JSON.parse(localStorage.getItem('salesContracts') || '[]');
          const email = currentUser.email.toLowerCase();
          const sentContracts = allContracts.filter((c: any) => {
            const cEmail = (c.customerEmail || '').toLowerCase();
            const isForThisCustomer = cEmail === email;
            const isSent = c.status === 'sent_to_customer' || c.status === 'sent' || c.status === 'customer_confirmed';
            // 如果邮箱匹配 或 邮箱无效但合同已发送（宽松匹配）
            const isInvalidEmail = !cEmail || cEmail === 'n/a' || !cEmail.includes('@');
            return isSent && (isForThisCustomer || isInvalidEmail);
          });
          sentContracts.forEach((c: any) => {
            contractOrders.push({
              id: c.id,
              orderNumber: c.contractNumber,
              customer: c.customerName,
              customerEmail: currentUser.email, // 用当前客户 email 修正
              quotationNumber: c.quotationNumber,
              date: (c.createdAt || '').split('T')[0],
              expectedDelivery: c.deliveryTime,
              totalAmount: c.totalAmount,
              currency: c.currency,
              status: c.status === 'customer_confirmed' ? 'Awaiting Deposit'
                : c.status === 'deposit_uploaded' ? 'Payment Proof Uploaded'
                : c.status === 'deposit_confirmed' ? 'Deposit Received'
                : c.status === 'cancelled' ? 'cancelled'
                : 'Pending',
              progress: 0,
              products: (c.products || []).map((p: any) => ({
                name: p.productName,
                quantity: p.quantity,
                unitPrice: p.unitPrice,
                totalPrice: p.quantity * p.unitPrice,
                specs: p.specification || ''
              })),
              paymentStatus: 'Pending',
              paymentTerms: c.paymentTerms,
              shippingMethod: c.tradeTerms,
              deliveryTerms: c.tradeTerms,
              region: c.region,
              country: c.customerCountry,
              deliveryAddress: c.customerAddress,
              contactPerson: c.contactPerson,
              phone: c.contactPhone,
              createdFrom: 'sales_contract',
              createdAt: c.createdAt,
              updatedAt: c.updatedAt,
            } as Order);
          });
          if (contractOrders.length > 0) {
            console.log(`📦 [OrderContext] 从 salesContracts 兜底读取 ${contractOrders.length} 条已发送合同`);
          }
        } catch { /* ignore */ }

        // 合并两个来源，去重
        const combined = [...customerOrders, ...contractOrders];
        const seen = new Set<string>();
        const dedupedOrders = combined.filter(o => {
          const key = o.orderNumber || o.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        if (alive) {
          setOrders(filterNotDeleted('order', dedupedOrders, (order) => getOrderMarkers(order)));
        }
      }
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
    console.log('📥 [OrderContext.addOrder] 收到订单添加请求');
    console.log('  - 订单编号:', order.orderNumber);
    console.log('  - 客户名称:', order.customer);
    console.log('  - 客户邮箱:', order.customerEmail);
    console.log('  - 区域信息:', order.region);
    console.log('  - 订单金额:', order.totalAmount, order.currency);
    
    // 🔒 添加订单到对应客户的存储
    const customerEmail = order.customerEmail;
    
    if (!customerEmail) {
      console.error('❌ [OrderContext.addOrder] Order must have customerEmail');
      console.error('  - 订单对象:', order);
      toast.error('订单创建失败', { description: '订单缺少客户邮箱信息' });
      return;
    }
    
    console.log('✅ [OrderContext.addOrder] customerEmail验证通过:', customerEmail);
    
    // 读取该客户的现有订单
    const customerOrders = getUserData<Order>('orders', customerEmail);
    console.log(`  - 客户 ${customerEmail} 现有订单数:`, customerOrders.length);
    
    // 添加新订单
    const updatedOrders = [order, ...customerOrders];
    console.log('  - 添加后总订单数:', updatedOrders.length);
    
    // 保存到该客户的专属存储
    console.log('  - 正在保存到localStorage: orders_' + customerEmail);
    setUserData('orders', updatedOrders, customerEmail);
    console.log('  ✅ localStorage保存完成');
    // 同步到 Supabase（静默）
    ordersDb.upsert(order).catch(() => {/* 静默 */});
    
    // 更新当前Context状态
    const currentUser = getCurrentUser();
    console.log('  - 当前用户类型:', currentUser?.type);
    
    if (currentUser?.type === 'admin') {
      console.log('  - Admin用户，重新聚合所有订单...');
      const allOrders = getAllCustomersData<Order>('orders');
      console.log('  - 聚合后总订单数:', allOrders.length);
      setOrders(allOrders);
      console.log('  ✅ Context状态已更新');
    } else {
      console.log('  - 客户用户，更新自己的订单列表');
      setOrders(updatedOrders);
      console.log('  ✅ Context状态已更新');
    }
    
    // 🔥 触发自定义事件，通知所有监听器订单数据已更新
    console.log('📢 [OrderContext.addOrder] 触发ordersUpdated事件');
    window.dispatchEvent(new CustomEvent('ordersUpdated', { 
      detail: { 
        action: 'add', 
        orderNumber: order.orderNumber,
        customerEmail: customerEmail
      } 
    }));
    
    console.log('🎉 [OrderContext.addOrder] 订单添加完成！');
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_CREATED, order, {
      status: order.status,
      quotationNumber: order.quotationNumber || null,
    });
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    console.log('🔄 [OrderContext.updateOrder] 更新订单:', orderId);
    console.log('  - 更新内容:', updates);
    console.log('  - 🔍 当前Context中的订单数:', orders.length);
    
    // 🔒 更新订单：需要找到对应客户并更新其数据
    const currentUser = getCurrentUser();
    
    if (currentUser?.type === 'admin') {
      // Admin更新：需要找到订单属于哪个客户
      const allOrders = getAllCustomersData<Order>('orders');
      const orderToUpdate = allOrders.find(o => o.id === orderId || o.orderNumber === orderId);
      
      console.log('  - Admin模式，查找订单:', orderToUpdate?.orderNumber);
      
      if (orderToUpdate) {
        const customerEmail = orderToUpdate.customerEmail;
        if (customerEmail) {
          console.log('  - 订单所属客户:', customerEmail);
          
          const customerOrders = getUserData<Order>('orders', customerEmail);
          console.log('  - 客户现有订单数:', customerOrders.length);
          console.log('  - 🔍 现有订单列表（更新前）:');
          customerOrders.forEach((o, idx) => {
            console.log(`    ${idx + 1}. ${o.orderNumber} (id: ${o.id})`);
          });
          
          // 🔥 检测重复订单
          const duplicates = customerOrders.filter(o => 
            o.orderNumber === orderToUpdate.orderNumber || o.id === orderId
          );
          if (duplicates.length > 1) {
            console.error(`  ⚠️ 检测到 ${duplicates.length} 个重复订单！`);
            console.error('  - 重复订单详情:', duplicates);
          }
          
          const updated = customerOrders.map(o => 
            (o.id === orderId || o.orderNumber === orderId) 
              ? { ...o, ...updates, updatedAt: new Date().toISOString() } 
              : o
          );
          
          console.log('  - 更新后订单数:', updated.length);
          console.log('  - 🔍 更新后订单列表:');
          updated.forEach((o, idx) => {
            console.log(`    ${idx + 1}. ${o.orderNumber} (id: ${o.id}, status: ${o.status})`);
          });
          
          // 保存到该客户的专属存储
          setUserData('orders', updated, customerEmail);

          // 同步到 Supabase（静默）
          const updatedOrder = updated.find(o => o.id === orderId || o.orderNumber === orderId);
          if (updatedOrder) void ordersDb.upsert(updatedOrder).catch(() => {});
          
          // 重新聚合所有数据
          const refreshedOrders = getAllCustomersData<Order>('orders');
          console.log('  - 重新聚合后总订单数:', refreshedOrders.length);
          setOrders(refreshedOrders);
          
          console.log('  ✅ 订单更新完成（Admin模式）');
        }
      } else {
        console.error('  ❌ 未找到订单:', orderId);
      }
    } else {
      // 客户更新自己的订单
      const customerEmail = currentUser?.email;
      if (customerEmail) {
        console.log('  - 客户模式，客户邮箱:', customerEmail);
        
        const customerOrders = getUserData<Order>('orders', customerEmail);
        console.log('  - 🔍 客户现有订单数:', customerOrders.length);
        console.log('  - 🔍 现有订单列表（更新前）:');
        customerOrders.forEach((o, idx) => {
          console.log(`    ${idx + 1}. ${o.orderNumber || 'NO-NUMBER'} (id: ${o.id}, status: ${o.status})`);
        });
        
        // 🔥 检测localStorage中的重复订单
        const duplicates = customerOrders.filter(o => 
          o.orderNumber === orderId || o.id === orderId
        );
        if (duplicates.length > 1) {
          console.error(`  ⚠️⚠️⚠️ 警告：在localStorage中检测到 ${duplicates.length} 个重复订单！`);
          console.error('  - 重复订单详情:');
          duplicates.forEach((dup, idx) => {
            console.error(`    ${idx + 1}. orderNumber: ${dup.orderNumber}, id: ${dup.id}, status: ${dup.status}`);
          });
          console.error('  - 🔧 正在去重...');
          
          // 🔥 去重：保留第一个，删除其余
          const seen = new Set<string>();
          const deduped = customerOrders.filter(o => {
            const key = o.orderNumber || o.id;
            if (seen.has(key)) {
              console.log(`    ❌ 删除重复订单: ${key}`);
              return false;
            }
            seen.add(key);
            return true;
          });
          
          console.log(`  - ✅ 去重完成，订单数从 ${customerOrders.length} 减少到 ${deduped.length}`);
          
          // 使用去重后的数据
          const updated = deduped.map((order) =>
            (order.id === orderId || order.orderNumber === orderId)
              ? { ...order, ...updates, updatedAt: new Date().toISOString() } 
              : order
          );
          
          console.log('  - 更新后订单数:', updated.length);
          
          // 保存去重后的数据
          setUserData('orders', updated, customerEmail);
          setOrders(updated);
          
          console.log('  ✅ 订单更新完成（客户模式，已去重）');
          return;
        }
        
        // 🔥 修复：使用id或orderNumber匹配订单
        const updated = customerOrders.map((order) =>
          (order.id === orderId || order.orderNumber === orderId)
            ? { ...order, ...updates, updatedAt: new Date().toISOString() } 
            : order
        );
        
        console.log('  - 更新后订单数:', updated.length);
        console.log('  - 🔍 更新后订单列表:');
        updated.forEach((o, idx) => {
          console.log(`    ${idx + 1}. ${o.orderNumber || 'NO-NUMBER'} (id: ${o.id}, status: ${o.status})`);
        });
        
        // 🔥 保存到localStorage
        setUserData('orders', updated, customerEmail);

        // 同步到 Supabase（静默）
        const updatedOrder = updated.find(o => o.id === orderId || o.orderNumber === orderId);
        if (updatedOrder) void ordersDb.upsert(updatedOrder).catch(() => {});
        
        // 🔥 直接设置state，避免触发重复保存
        console.log('  - 正在更新React state...');
        setOrders(updated);
        
        console.log('  ✅ 订单更新完成（客户模式）');
      } else {
        console.error('  ❌ 无法获取客户邮箱');
        // Fallback：无法获取customerEmail时，仅更新状态
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            (order.id === orderId || order.orderNumber === orderId)
              ? { ...order, ...updates, updatedAt: new Date().toISOString() } 
              : order
          )
        );
      }
    }
    
    // 🔥 触发自定义事件
    console.log('📢 [OrderContext.updateOrder] 触发ordersUpdated事件');
    window.dispatchEvent(new CustomEvent('ordersUpdated', { 
      detail: { 
        action: 'update', 
        orderId: orderId 
      } 
    }));
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_STATUS_CHANGED, {
      id: orderId,
      orderNumber: String(updates.orderNumber || orderId),
    }, {
      fields: Object.keys(updates || {}),
      status: updates.status || null,
    });
  };

  const deleteOrder = (orderId: string) => {
    // 🔒 删除订单：需要找到对应客户并删除其数据
    const currentUser = getCurrentUser();
    const deletionMarkers = new Set<string>([String(orderId)]);
    
    if (currentUser?.type === 'admin') {
      // Admin删除：需要找到订单属于哪个客户
      const allOrders = getAllCustomersData<Order>('orders');
      const orderToDelete = allOrders.find(o => o.id === orderId || o.orderNumber === orderId);
      
      if (orderToDelete) {
        getOrderMarkers(orderToDelete).forEach((m) => deletionMarkers.add(m));
        const customerEmail = orderToDelete.customerEmail;
        if (customerEmail) {
          const customerOrders = getUserData<Order>('orders', customerEmail);
          const filtered = customerOrders.filter(o => o.id !== orderId && o.orderNumber !== orderId);
          setUserData('orders', filtered, customerEmail);
          
          // 重新聚合所有数据
          const next = filterNotDeleted('order', getAllCustomersData<Order>('orders'), (order) =>
            getOrderMarkers(order),
          );
          setOrders(next);
        }
      }
    } else {
      // 客户删除自己的订单
      const customerEmail = currentUser?.email;
      const filteredState = orders.filter((order) => order.id !== orderId && order.orderNumber !== orderId);
      setOrders(filteredState);
      if (customerEmail) {
        const customerOrders = getUserData<Order>('orders', customerEmail);
        const filtered = customerOrders.filter((order) => order.id !== orderId && order.orderNumber !== orderId);
        const orderToDelete = customerOrders.find((order) => order.id === orderId || order.orderNumber === orderId);
        if (orderToDelete) {
          getOrderMarkers(orderToDelete).forEach((m) => deletionMarkers.add(m));
        }
        setUserData('orders', filtered, customerEmail);
      }
    }

    addTombstones('order', Array.from(deletionMarkers), {
      reason: 'manual_delete',
      deletedBy: currentUser?.email || 'unknown',
    });
    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { action: 'delete', orderId } }));
    emitOrderEvent(ERP_EVENT_KEYS.ORDER_DELETED, {
      id: orderId,
      orderNumber: String(orderId),
    });
  };

  const clearAllOrders = () => {
    console.log('🔥 [clearAllOrders] 开始清空所有订单数据...');
    
    // 🔒 清空所有订单：仅Admin可以执行此操作
    const currentUser = getCurrentUser();
    
    if (currentUser?.type === 'admin') {
      console.log('  - Admin用户，清空所有客户的订单数据');
      
      // 🔥 方法1：通过已有订单找到所有客户邮箱并清空
      const allOrders = getAllCustomersData<Order>('orders');
      console.log(`  - 当前订单总数: ${allOrders.length}`);
      
      if (allOrders.length > 0) {
        const customerEmails = new Set(allOrders.map(o => o.customerEmail).filter(Boolean));
        console.log(`  - 找到 ${customerEmails.size} 个客户`);
        
        customerEmails.forEach(email => {
          if (email) {
            console.log(`    • 清空客户 ${email} 的订单数据`);
            setUserData('orders', [], email);
            localStorage.removeItem(`orders_${email}`);
          }
        });
      }
      
      // 🔥 方法2：暴力清空所有包含 'orders' 的 localStorage 键
      console.log('  - 扫描并清空所有包含"orders"的localStorage键...');
      const allKeys = Object.keys(localStorage);
      const orderKeys = allKeys.filter(key => key.includes('orders'));
      console.log(`  - 找到 ${orderKeys.length} 个订单相关的键:`, orderKeys);
      
      orderKeys.forEach(key => {
        console.log(`    • 删除: ${key}`);
        localStorage.removeItem(key);
      });
      
      // 更新状态
      setOrders([]);
      console.log('  ✅ 所有订单数据已清空！');
      console.log('  ✅ Context状态已重置为空数组');
      
    } else {
      // 客户删除自己的订单
      console.log('  - 客户用户，清空自己的订单数据');
      const customerEmail = currentUser?.email;
      if (customerEmail) {
        setUserData('orders', [], customerEmail);
        localStorage.removeItem(`orders_${customerEmail}`);
      }
      setOrders([]);
    }
    
    console.log('🔥 [clearAllOrders] 清空完成！');
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

