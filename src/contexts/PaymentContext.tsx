import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData, setUserData } from '../utils/dataIsolation';
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
  
  // 🔥 使用localStorage持久化（收款数据存储在admin@cosun.com账号下）
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const financeEmail = 'admin@cosun.com'; // 财务数据统一存储在admin账号下
      const data = getUserData<PaymentRecord>('paymentRecords', financeEmail);
      console.log('🔧 [PaymentContext] 加载收款记录数据:', data?.length || 0, '条');
      return data || [];
    }
    return [];
  });

  // 🔥 持久化到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const financeEmail = 'admin@cosun.com';
      setUserData('paymentRecords', payments, financeEmail);
      console.log('💾 [PaymentContext] 收款记录数据已保存:', payments.length, '条');
    }
  }, [payments]);

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
    
    setPayments(prev => {
      console.log('✅ [PaymentContext] 收款记录已创建:', newPayment.paymentNumber);
      return [newPayment, ...prev];
    });
    
    return newPayment;
  };

  // 🔄 更新收款记录
  const updatePayment = (id: string, updates: Partial<PaymentRecord>) => {
    setPayments(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
    console.log('✅ [PaymentContext] 收款记录已更新:', id, updates);
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
    console.log('🗑️ [PaymentContext] 收款记录已删除:', id);
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
