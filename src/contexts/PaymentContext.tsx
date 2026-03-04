import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { paymentService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { useFinance } from './FinanceContext';

// 💰 收款记录类型（Payment Collection Record）
export interface PaymentRecord {
  id: string;
  paymentNumber: string; // SK-{REGION}-YYMMDD-XXXX（收款编号）
  receivableNumber: string; // 关联的应收账款编号 YS-XX-XX
  receivableId: string; // 关联的应收账款ID
  orderNumber: string; // 关联的订单号
  customerName: string;
  customerEmail: string;
  amount: number; // 本次收款金额
  currency: string;
  paymentDate: string; // 收款日期
  paymentMethod: 'T/T' | 'L/C' | 'D/P' | 'D/A' | 'Western Union' | 'PayPal' | 'Other'; // 付款方式
  bankReference: string; // 银行流水号/交易参考号
  bankName?: string; // 收款银行
  receivedBy: string; // 收款确认人（财务人员）
  notes?: string; // 备注
  proofUrl?: string; // 收款凭证URL
  proofFileName?: string; // 收款凭证文件名
  status: 'pending' | 'confirmed' | 'rejected'; // 收款状态
  region: string; // 区域代码 NA/SA/EA
  createdAt: number;
  createdBy: string;
  confirmedAt?: number;
  confirmedBy?: string;
}

interface PaymentContextType {
  payments: PaymentRecord[];
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'paymentNumber'>) => PaymentRecord;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  confirmPayment: (id: string, confirmedBy: string) => void;
  rejectPayment: (id: string, reason: string) => void;
  getPaymentsByReceivable: (receivableId: string) => PaymentRecord[];
  getPaymentsByOrder: (orderNumber: string) => PaymentRecord[];
  deletePayment: (id: string) => void;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { updateAccountReceivable } = useFinance();
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Supabase-first: 从 payments 表加载
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = await paymentService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      setPayments(rows.filter(Boolean) as PaymentRecord[]);
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setPayments([]);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  // 📝 生成收款编号：SK-{REGION}-YYMMDD-XXXX
  const generatePaymentNumber = (region: string): string => {
    // 获取当前日期 YYMMDD
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;
    
    // 统计该区域的历史收款记录数量（累计序号）
    const regionPayments = payments.filter(p => p.region === region);
    const sequence = String(regionPayments.length + 1).padStart(4, '0');
    
    return `SK-${region}-${dateStr}-${sequence}`;
  };

  // ➕ 添加收款记录
  const addPayment = (payment: Omit<PaymentRecord, 'id' | 'createdAt' | 'paymentNumber'>) => {
    const paymentNumber = generatePaymentNumber(payment.region);
    
    const newPayment: PaymentRecord = {
      ...payment,
      id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      paymentNumber,
      createdAt: Date.now(),
      status: payment.status || 'confirmed' // 默认已确认
    };
    
    setPayments(prev => [newPayment, ...prev]);
    paymentService.upsert(newPayment).catch(() => {});
    return newPayment;
  };

  // 🔄 更新收款记录
  const updatePayment = (id: string, updates: Partial<PaymentRecord>) => {
    setPayments(prev => {
      const next = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      const updated = next.find(p => p.id === id);
      if (updated) paymentService.upsert(updated).catch(() => {});
      return next;
    });
  };

  // ✅ 确认收款（财务确认）
  const confirmPayment = (id: string, confirmedBy: string) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    // 更新收款记录状态
    updatePayment(id, {
      status: 'confirmed',
      confirmedAt: Date.now(),
      confirmedBy
    });

    // 🔥 核销应收账款：更新应收账款的已收金额
    updateAccountReceivable(payment.receivableId, {
      paidAmount: 0, // 这里需要重新计算
      paymentHistory: [] // 这里需要追加
    });

    console.log('✅ [PaymentContext] 收款已确认，应收账款已核销:', payment.paymentNumber);
  };

  // ❌ 拒绝收款
  const rejectPayment = (id: string, reason: string) => {
    updatePayment(id, {
      status: 'rejected',
      notes: reason
    });
    console.log('❌ [PaymentContext] 收款已拒绝:', id, reason);
  };

  // 🔍 查询某应收账款的所有收款记录
  const getPaymentsByReceivable = (receivableId: string) => {
    return payments.filter(p => p.receivableId === receivableId);
  };

  // 🔍 查询某订单的所有收款记录
  const getPaymentsByOrder = (orderNumber: string) => {
    return payments.filter(p => p.orderNumber === orderNumber);
  };

  // 🗑️ 删除收款记录
  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    paymentService.delete(id).catch(() => {});
  };

  return (
    <PaymentContext.Provider
      value={{
        payments,
        addPayment,
        updatePayment,
        confirmPayment,
        rejectPayment,
        getPaymentsByReceivable,
        getPaymentsByOrder,
        deletePayment
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within PaymentProvider');
  }
  return context;
}
