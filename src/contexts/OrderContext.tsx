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

// 🔥 生成测试订单
export function generateTestOrders() {
  console.log('🎯 [generateTestOrders] 开始生成测试订单...');
  
  const testOrders: Order[] = [
    // 🔥 订单1：客户刚上传定金付款凭证，等待财务确认
    {
      id: 'SC-NA-251220-0001',
      orderNumber: 'SC-NA-251220-0001',
      customer: 'BuildRight Supply Co.',
      customerEmail: 'buildright@example.com',
      quotationId: 'QT-NA-251210-0001',
      quotationNumber: 'QT-NA-251210-0001',
      date: '2025-12-20',
      expectedDelivery: '2026-02-20',
      totalAmount: 150000,
      currency: 'USD',
      status: 'Payment Proof Uploaded',
      progress: 0,
      products: [
        {
          name: 'Industrial Circuit Breaker 250A',
          quantity: 200,
          unitPrice: 185,
          totalPrice: 37000,
          specs: '250A, 4-Pole, UL Listed',
          produced: 0,
        },
        {
          name: 'Smart Door Lock System',
          quantity: 400,
          unitPrice: 125,
          totalPrice: 50000,
          specs: 'WiFi + Bluetooth, Fingerprint + PIN',
          produced: 0,
        },
        {
          name: 'Premium Bathroom Faucet Set',
          quantity: 300,
          unitPrice: 95,
          totalPrice: 28500,
          specs: 'Brushed Nickel, Water-saving Technology',
          produced: 0,
        },
        {
          name: 'Safety Work Gloves Premium',
          quantity: 2000,
          unitPrice: 17.25,
          totalPrice: 34500,
          specs: 'Cut Level 5, Touchscreen Compatible',
          produced: 0,
        },
      ],
      paymentStatus: 'Awaiting Deposit Confirmation',
      paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou, China',
      notes: 'Deposit payment proof uploaded - awaiting finance confirmation',
      createdFrom: 'quotation',
      createdAt: '2025-12-20T08:00:00Z',
      updatedAt: '2025-12-20T10:30:00Z',
      confirmed: true,
      confirmedAt: '2025-12-20T08:30:00Z',
      confirmedBy: 'Admin',
      confirmedDate: '2025-12-20',
      region: 'NA',
      country: 'United States',
      deliveryAddress: '1234 Industrial Pkwy, Dallas, TX 75201, USA',
      contactPerson: 'Mike Johnson',
      phone: '+1-214-555-0123',
      depositPaymentProof: {
        uploadedAt: '2025-12-20T10:20:00Z',
        uploadedBy: 'buildright@example.com',
        fileUrl: 'https://example.com/deposit-proof-sc-na-251220-0001.pdf',
        fileName: 'deposit-proof-buildright-45000-usd.pdf',
        amount: 45000, // 30% deposit
        currency: 'USD',
        notes: 'Wire Transfer | Ref: BR-NA-251220-001 | Bank: Chase | Date: 2025-12-20',
        status: 'pending',
      },
      contractTerms: {
        paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
        deliveryTerms: 'FOB Fuzhou, China',
        shippingMethod: 'Sea Freight - 40HQ Container',
        expectedDelivery: '2026-02-20',
        qualityStandards: 'All products shall comply with UL, CE, and RoHS standards.',
        warrantyTerms: '24-month warranty from date of shipment',
        remarks: 'Standard delivery schedule',
      },
    },
    
    // 🔥 订单2：财务已确认定金，财务已上传收款凭证
    {
      id: 'SC-EU-251215-0002',
      orderNumber: 'SC-EU-251215-0002',
      customer: 'EuroBuilders GmbH',
      customerEmail: 'eurobuilders@example.com',
      quotationId: 'QT-EU-251208-0002',
      quotationNumber: 'QT-EU-251208-0002',
      date: '2025-12-15',
      expectedDelivery: '2026-03-15',
      totalAmount: 220000,
      currency: 'EUR',
      status: 'Deposit Received',
      progress: 10,
      products: [
        {
          name: 'Heavy Duty Door Hinges',
          quantity: 5000,
          unitPrice: 12,
          totalPrice: 60000,
          specs: 'Stainless Steel, Load 200kg',
          produced: 500,
        },
        {
          name: 'Commercial Door Closer',
          quantity: 1000,
          unitPrice: 85,
          totalPrice: 85000,
          specs: 'Hydraulic, Fire-rated',
          produced: 100,
        },
        {
          name: 'High-Security Padlocks',
          quantity: 3000,
          unitPrice: 25,
          totalPrice: 75000,
          specs: 'Hardened Steel, Pick-resistant',
          produced: 300,
        },
      ],
      paymentStatus: 'Deposit Confirmed',
      paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'CIF Hamburg, Germany',
      notes: 'Deposit confirmed by finance - production started',
      createdFrom: 'quotation',
      createdAt: '2025-12-15T09:00:00Z',
      updatedAt: '2025-12-16T14:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-15T10:00:00Z',
      confirmedBy: 'Admin',
      confirmedDate: '2025-12-15',
      region: 'EU',
      country: 'Germany',
      deliveryAddress: 'Industriestrasse 45, 20095 Hamburg, Germany',
      contactPerson: 'Hans Mueller',
      phone: '+49-40-555-0234',
      depositPaymentProof: {
        uploadedAt: '2025-12-15T12:00:00Z',
        uploadedBy: 'eurobuilders@example.com',
        fileUrl: 'https://example.com/deposit-proof-sc-eu-251215-0002.pdf',
        fileName: 'deposit-proof-eurobuilders-66000-eur.pdf',
        amount: 66000, // 30% deposit
        currency: 'EUR',
        notes: 'SEPA Transfer | Ref: EB-EU-251215-002 | Bank: Deutsche Bank | Date: 2025-12-15',
        status: 'confirmed',
        confirmedAt: '2025-12-15T15:30:00Z',
        confirmedBy: 'finance@gaoshengda.com',
      },
      depositReceiptProof: {
        uploadedAt: '2025-12-16T09:00:00Z',
        uploadedBy: 'finance@gaoshengda.com',
        fileUrl: 'https://example.com/receipt-proof-sc-eu-251215-0002.pdf',
        fileName: 'bank-receipt-eurobuilders-66000-eur.pdf',
        actualAmount: 66000,
        currency: 'EUR',
        receiptDate: '2025-12-15',
        bankReference: '20251215-ICBC-EU-654321',
        notes: 'Received via ICBC Frankfurt branch | All documents verified',
      },
      contractTerms: {
        paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
        deliveryTerms: 'CIF Hamburg, Germany',
        shippingMethod: 'Sea Freight - 20FT Container',
        expectedDelivery: '2026-03-15',
        qualityStandards: 'CE certified, EN standards compliance required',
        warrantyTerms: '24-month warranty from date of shipment',
        remarks: 'Production in progress - 10% completed',
      },
    },
    
    // 🔥 订单3：定金完成，生产中，客户刚上传余款付款凭证，等待财务确认
    {
      id: 'SC-SA-251210-0003',
      orderNumber: 'SC-SA-251210-0003',
      customer: 'Latin Hardware Ltda',
      customerEmail: 'latinhardware@example.com',
      quotationId: 'QT-SA-251201-0003',
      quotationNumber: 'QT-SA-251201-0003',
      date: '2025-12-10',
      expectedDelivery: '2026-02-28',
      totalAmount: 180000,
      currency: 'USD',
      status: 'In Production',
      progress: 85,
      products: [
        {
          name: 'Electrical Junction Boxes',
          quantity: 8000,
          unitPrice: 6.5,
          totalPrice: 52000,
          specs: 'IP65 rated, UV resistant',
          produced: 6800,
        },
        {
          name: 'Wall Outlet Sockets',
          quantity: 10000,
          unitPrice: 3.2,
          totalPrice: 32000,
          specs: 'Universal, Grounded',
          produced: 8500,
        },
        {
          name: 'LED Ceiling Lights',
          quantity: 2000,
          unitPrice: 48,
          totalPrice: 96000,
          specs: '36W, 4000K, Dimmable',
          produced: 1700,
        },
      ],
      paymentStatus: 'Balance Payment Uploaded',
      paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou, China',
      notes: 'Production 85% complete - Balance payment uploaded, awaiting confirmation',
      createdFrom: 'quotation',
      createdAt: '2025-12-10T08:00:00Z',
      updatedAt: '2025-12-29T16:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-10T09:00:00Z',
      confirmedBy: 'Admin',
      confirmedDate: '2025-12-10',
      region: 'SA',
      country: 'Brazil',
      deliveryAddress: 'Av. Paulista 1000, São Paulo, SP 01310-100, Brazil',
      contactPerson: 'Carlos Silva',
      phone: '+55-11-3555-0345',
      depositPaymentProof: {
        uploadedAt: '2025-12-10T14:00:00Z',
        uploadedBy: 'latinhardware@example.com',
        fileUrl: 'https://example.com/deposit-proof-sc-sa-251210-0003.pdf',
        fileName: 'deposit-proof-latinhardware-54000-usd.pdf',
        amount: 54000, // 30% deposit
        currency: 'USD',
        notes: 'Wire Transfer | Ref: LH-SA-251210-003 | Bank: Banco do Brasil | Date: 2025-12-10',
        status: 'confirmed',
        confirmedAt: '2025-12-11T10:00:00Z',
        confirmedBy: 'finance@gaoshengda.com',
      },
      depositReceiptProof: {
        uploadedAt: '2025-12-11T11:00:00Z',
        uploadedBy: 'finance@gaoshengda.com',
        fileUrl: 'https://example.com/receipt-proof-sc-sa-251210-0003-deposit.pdf',
        fileName: 'bank-receipt-latinhardware-54000-usd-deposit.pdf',
        actualAmount: 54000,
        currency: 'USD',
        receiptDate: '2025-12-10',
        bankReference: '20251210-BOC-SA-789012',
        notes: 'Received via Bank of China | Verified and confirmed',
      },
      balancePaymentProof: {
        uploadedAt: '2025-12-29T15:45:00Z',
        uploadedBy: 'latinhardware@example.com',
        fileUrl: 'https://example.com/balance-proof-sc-sa-251210-0003.pdf',
        fileName: 'balance-proof-latinhardware-126000-usd.pdf',
        amount: 126000, // 70% balance
        currency: 'USD',
        notes: 'Wire Transfer | Ref: LH-SA-251229-BALANCE | Bank: Banco do Brasil | Date: 2025-12-29',
        status: 'pending',
      },
      contractTerms: {
        paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
        deliveryTerms: 'FOB Fuzhou, China',
        shippingMethod: 'Sea Freight - 40HQ Container',
        expectedDelivery: '2026-02-28',
        qualityStandards: 'INMETRO certified for Brazilian market',
        warrantyTerms: '18-month warranty from date of shipment',
        remarks: 'Production nearly complete - awaiting balance payment confirmation',
      },
    },
    
    // 🔥 订单4：余款已确认，财务已上传余款收款凭证，准备发货
    {
      id: 'SC-NA-251205-0004',
      orderNumber: 'SC-NA-251205-0004',
      customer: 'MegaHardware Inc.',
      customerEmail: 'megahardware@example.com',
      quotationId: 'QT-NA-251128-0004',
      quotationNumber: 'QT-NA-251128-0004',
      date: '2025-12-05',
      expectedDelivery: '2026-02-10',
      totalAmount: 280000,
      currency: 'USD',
      status: 'Ready to Ship',
      progress: 100,
      products: [
        {
          name: 'Commercial Door Handles',
          quantity: 4000,
          unitPrice: 35,
          totalPrice: 140000,
          specs: 'Stainless Steel, ADA Compliant',
          produced: 4000,
        },
        {
          name: 'Window Hardware Sets',
          quantity: 2500,
          unitPrice: 28,
          totalPrice: 70000,
          specs: 'Casement Window, White Powder Coat',
          produced: 2500,
        },
        {
          name: 'Sliding Door Rollers',
          quantity: 3500,
          unitPrice: 20,
          totalPrice: 70000,
          specs: 'Heavy Duty, Nylon Wheels',
          produced: 3500,
        },
      ],
      paymentStatus: 'Fully Paid',
      paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'FOB Fuzhou, China',
      notes: 'All payments confirmed - ready to arrange shipment',
      createdFrom: 'quotation',
      createdAt: '2025-12-05T08:00:00Z',
      updatedAt: '2025-12-30T10:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-05T09:00:00Z',
      confirmedBy: 'Admin',
      confirmedDate: '2025-12-05',
      region: 'NA',
      country: 'Canada',
      deliveryAddress: '789 Commerce Blvd, Vancouver, BC V5Z 1M9, Canada',
      contactPerson: 'Jennifer Lee',
      phone: '+1-604-555-0456',
      depositPaymentProof: {
        uploadedAt: '2025-12-05T13:00:00Z',
        uploadedBy: 'megahardware@example.com',
        fileUrl: 'https://example.com/deposit-proof-sc-na-251205-0004.pdf',
        fileName: 'deposit-proof-megahardware-84000-usd.pdf',
        amount: 84000, // 30% deposit
        currency: 'USD',
        notes: 'Wire Transfer | Ref: MH-NA-251205-004 | Bank: TD Canada Trust | Date: 2025-12-05',
        status: 'confirmed',
        confirmedAt: '2025-12-06T09:00:00Z',
        confirmedBy: 'finance@gaoshengda.com',
      },
      depositReceiptProof: {
        uploadedAt: '2025-12-06T10:00:00Z',
        uploadedBy: 'finance@gaoshengda.com',
        fileUrl: 'https://example.com/receipt-proof-sc-na-251205-0004-deposit.pdf',
        fileName: 'bank-receipt-megahardware-84000-usd-deposit.pdf',
        actualAmount: 84000,
        currency: 'USD',
        receiptDate: '2025-12-05',
        bankReference: '20251205-CCB-NA-345678',
        notes: 'Received via China Construction Bank | Verified',
      },
      balancePaymentProof: {
        uploadedAt: '2025-12-28T14:00:00Z',
        uploadedBy: 'megahardware@example.com',
        fileUrl: 'https://example.com/balance-proof-sc-na-251205-0004.pdf',
        fileName: 'balance-proof-megahardware-196000-usd.pdf',
        amount: 196000, // 70% balance
        currency: 'USD',
        notes: 'Wire Transfer | Ref: MH-NA-251228-BALANCE | Bank: TD Canada Trust | Date: 2025-12-28',
        status: 'confirmed',
        confirmedAt: '2025-12-29T10:00:00Z',
        confirmedBy: 'finance@gaoshengda.com',
      },
      balanceReceiptProof: {
        uploadedAt: '2025-12-29T11:00:00Z',
        uploadedBy: 'finance@gaoshengda.com',
        fileUrl: 'https://example.com/receipt-proof-sc-na-251205-0004-balance.pdf',
        fileName: 'bank-receipt-megahardware-196000-usd-balance.pdf',
        actualAmount: 196000,
        currency: 'USD',
        receiptDate: '2025-12-28',
        bankReference: '20251228-CCB-NA-901234',
        notes: 'Received via China Construction Bank | All payments complete',
      },
      contractTerms: {
        paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
        deliveryTerms: 'FOB Fuzhou, China',
        shippingMethod: 'Sea Freight - 2x20FT Containers',
        expectedDelivery: '2026-02-10',
        qualityStandards: 'CSA certified for Canadian market',
        warrantyTerms: '24-month warranty from date of shipment',
        remarks: 'All payments verified - ready for shipment arrangement',
      },
    },
    
    // 🔥 订单5：定金被驳回（示例）
    {
      id: 'SC-EU-251222-0005',
      orderNumber: 'SC-EU-251222-0005',
      customer: 'FrenchBuild SARL',
      customerEmail: 'frenchbuild@example.com',
      quotationId: 'QT-EU-251218-0005',
      quotationNumber: 'QT-EU-251218-0005',
      date: '2025-12-22',
      expectedDelivery: '2026-03-22',
      totalAmount: 95000,
      currency: 'EUR',
      status: 'Pending',
      progress: 0,
      products: [
        {
          name: 'Waterproof LED Fixtures',
          quantity: 1500,
          unitPrice: 42,
          totalPrice: 63000,
          specs: 'IP67, Marine Grade',
          produced: 0,
        },
        {
          name: 'Industrial Cable Trays',
          quantity: 800,
          unitPrice: 40,
          totalPrice: 32000,
          specs: 'Galvanized Steel, Perforated',
          produced: 0,
        },
      ],
      paymentStatus: 'Payment Rejected',
      paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
      shippingMethod: 'Sea Freight',
      deliveryTerms: 'CIF Marseille, France',
      notes: 'Deposit payment rejected - customer needs to resubmit',
      createdFrom: 'quotation',
      createdAt: '2025-12-22T08:00:00Z',
      updatedAt: '2025-12-23T11:00:00Z',
      confirmed: true,
      confirmedAt: '2025-12-22T09:00:00Z',
      confirmedBy: 'Admin',
      confirmedDate: '2025-12-22',
      region: 'EU',
      country: 'France',
      deliveryAddress: '25 Rue de la République, 13001 Marseille, France',
      contactPerson: 'Pierre Dupont',
      phone: '+33-4-9155-0567',
      depositPaymentProof: {
        uploadedAt: '2025-12-22T15:00:00Z',
        uploadedBy: 'frenchbuild@example.com',
        fileUrl: 'https://example.com/deposit-proof-sc-eu-251222-0005.pdf',
        fileName: 'deposit-proof-frenchbuild-28500-eur.pdf',
        amount: 28500, // 30% deposit
        currency: 'EUR',
        notes: 'SEPA Transfer | Ref: FB-EU-251222-005 | Bank: BNP Paribas',
        status: 'rejected',
        confirmedAt: '2025-12-23T10:30:00Z',
        confirmedBy: 'finance@gaoshengda.com',
        rejectedReason: '付款凭证金额不符：凭证显示€27,500，应为€28,500。请重新上传正确金额的付款凭证。',
      },
      contractTerms: {
        paymentTerms: '30% T/T Deposit, 70% Balance Before Shipment',
        deliveryTerms: 'CIF Marseille, France',
        shippingMethod: 'Sea Freight - 20FT Container',
        expectedDelivery: '2026-03-22',
        qualityStandards: 'CE certified, French NF standards compliance',
        warrantyTerms: '24-month warranty from date of shipment',
        remarks: 'Awaiting corrected deposit payment proof',
      },
    },
  ];

  // 🔥 为每个客户保存订单
  testOrders.forEach(order => {
    if (order.customerEmail) {
      console.log(`  - 保存订单 ${order.orderNumber} 到客户 ${order.customerEmail}`);
      // 获取该客户现有订单
      const existing = getUserData<Order>('orders', order.customerEmail);
      // 添加新订单（避免重复）
      if (!existing.find(o => o.id === order.id)) {
        setUserData('orders', [order, ...existing], order.customerEmail);
      }
    }
  });
  
  console.log('✅ [generateTestOrders] 测试订单生成完成，共', testOrders.length, '条');
}
