import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserData, setUserData, getCurrentUser } from '../utils/dataIsolation';
import { accountsReceivableDb, fromARRow } from '../lib/supabase-db';

// 应收账款类型
export interface AccountReceivable {
  id: string;
  arNumber: string; // YS-{REGION}-YYMMDD-XXXX
  orderNumber: string;
  quotationNumber?: string;
  contractNumber?: string; // 关联的销售合同号
  customerName: string;
  customerEmail: string;
  region: string; // NA, SA, EU, etc.
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue' | 'proof_uploaded'; // 🔥 添加 proof_uploaded 状态
  paymentTerms: string;
  products: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
    receivedBy?: string;
    notes?: string;
    proofUrl?: string; // 🔥 财务收款凭证URL
    proofFileName?: string; // 🔥 财务收款凭证文件名
  }>;
  depositProof?: { // 🔥 客户上传的定金凭证（同步自订单）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
  };
  balanceProof?: { // 🔥 客户上传的余款凭证（同步自订单）
    uploadedAt: string;
    uploadedBy: string;
    fileUrl?: string;
    fileName?: string;
    amount: number;
    currency: string;
    notes?: string;
  };
  createdAt: number;
  createdBy: string;
  notes?: string;
}

interface FinanceContextType {
  accountsReceivable: AccountReceivable[];
  addAccountReceivable: (ar: Omit<AccountReceivable, 'id' | 'createdAt'>) => AccountReceivable;
  updateAccountReceivable: (id: string, updates: Partial<AccountReceivable>) => void;
  updateARByOrderNumber: (orderNumber: string, updates: Partial<AccountReceivable>) => void; // 🔥 新增：通过订单号更新
  recordPayment: (id: string, payment: {
    date: string;
    amount: number;
    method: string;
    reference: string;
    receivedBy: string;
    notes?: string;
    proofUrl?: string;
    proofFileName?: string;
  }) => void;
  getARByOrder: (orderNumber: string) => AccountReceivable | undefined;
  clearAllAccountsReceivable: () => void; // 🔥 新增：清空所有应收账款
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  // 🔥 使用localStorage持久化（Finance数据存储在admin@cosun.com账号下）
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>(() => {
    if (typeof window !== 'undefined') {
      const financeEmail = 'admin@cosun.com'; // 财务数据统一存储在admin账号下
      const data = getUserData<AccountReceivable>('accountsReceivable', financeEmail); // 🔥 修正参数顺序
      console.log('🔧 [FinanceContext] 加载应收账款数据:', data?.length || 0, '条');
      return data || [];
    }
    return [];
  });

  // 🔥 持久化到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const financeEmail = 'admin@cosun.com';
      setUserData('accountsReceivable', accountsReceivable, financeEmail);
      console.log('💾 [FinanceContext] 应收账款数据已保存:', accountsReceivable.length, '条');
    }
  }, [accountsReceivable]);

  // 从 Supabase 加载应收账款（初始化时）
  useEffect(() => {
    let alive = true;
    accountsReceivableDb.getAll().then((rows) => {
      if (!alive || !Array.isArray(rows) || rows.length === 0) return;
      const mapped = rows.map(fromARRow).filter(Boolean) as AccountReceivable[];
      setAccountsReceivable((prev) => {
        const supIds = new Set(mapped.map((a) => a.orderNumber));
        const localOnly = prev.filter((a) => !supIds.has(a.orderNumber));
        const merged = [...mapped, ...localOnly];
        console.log('✅ [FinanceContext] 已从 Supabase 加载应收账款:', merged.length, '条');
        return merged;
      });
    }).catch((e) => console.warn('⚠️ [FinanceContext] Supabase AR 加载失败:', e?.message));
    return () => { alive = false; };
  }, []);

  // Supabase Realtime 监听 AR 变化
  useEffect(() => {
    const channel = accountsReceivableDb.subscribeChanges((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const updated = fromARRow(payload.new);
        if (!updated) return;
        setAccountsReceivable((prev) => {
          const exists = prev.find((a) => a.orderNumber === updated.orderNumber);
          if (exists) return prev.map((a) => a.orderNumber === updated.orderNumber ? { ...a, ...updated } : a);
          return [updated, ...prev];
        });
      } else if (payload.eventType === 'DELETE') {
        const deleted = payload.old;
        setAccountsReceivable((prev) => prev.filter((a) => a.id !== deleted?.id));
      }
    });
    return () => { channel.unsubscribe(); };
  }, []);

  // 监听客户端直接写入的 financeDataUpdated 事件，重新从 localStorage + Supabase 加载
  useEffect(() => {
    const handleFinanceDataUpdated = () => {
      const financeEmail = 'admin@cosun.com';
      const fresh = getUserData<AccountReceivable>('accountsReceivable', financeEmail);
      if (fresh && fresh.length > 0) {
        setAccountsReceivable(fresh);
        console.log('🔄 [FinanceContext] financeDataUpdated 事件触发，重新加载:', fresh.length, '条');
      }
      // 同时从 Supabase 刷新
      accountsReceivableDb.getAll().then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map(fromARRow).filter(Boolean) as AccountReceivable[];
        setAccountsReceivable((prev) => {
          const supIds = new Set(mapped.map((a) => a.orderNumber));
          const localOnly = prev.filter((a) => !supIds.has(a.orderNumber));
          return [...mapped, ...localOnly];
        });
      }).catch(() => {/* 静默 */});
    };
    window.addEventListener('financeDataUpdated', handleFinanceDataUpdated);
    window.addEventListener('userChanged', handleFinanceDataUpdated);
    return () => {
      window.removeEventListener('financeDataUpdated', handleFinanceDataUpdated);
      window.removeEventListener('userChanged', handleFinanceDataUpdated);
    };
  }, []);

  const addAccountReceivable = (ar: Omit<AccountReceivable, 'id' | 'createdAt'>) => {
    const newAR: AccountReceivable = {
      ...ar,
      id: `ar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now()
    };
    
    setAccountsReceivable(prev => {
      const exists = prev.find(a => a.orderNumber === ar.orderNumber);
      if (exists) {
        console.log('⚠️ 应收账款已存在，跳过创建:', ar.orderNumber);
        return prev;
      }
      console.log('✅ [FinanceContext] 财务应收账款已创建:', newAR.arNumber, newAR.orderNumber);
      return [newAR, ...prev];
    });

    // 同步到 Supabase（静默）
    accountsReceivableDb.upsert(newAR).catch(() => {/* 静默 */});
    
    return newAR;
  };

  const updateAccountReceivable = (id: string, updates: Partial<AccountReceivable>) => {
    setAccountsReceivable(prev => {
      const next = prev.map(ar => (ar.id === id ? { ...ar, ...updates } : ar));
      // 同步到 Supabase
      const updated = next.find(a => a.id === id);
      if (updated) {
        void accountsReceivableDb.upsert(updated).catch(() => {});
      }
      return next;
    });
    console.log('✅ [FinanceContext] 应收账款已更新 (by ID):', id, updates);
  };

  // 🔥 新增：通过订单号更新应收账款
  const updateARByOrderNumber = (orderNumber: string, updates: Partial<AccountReceivable>) => {
    setAccountsReceivable(prev =>
      prev.map(ar => {
        if (ar.orderNumber === orderNumber) {
          console.log('✅ [FinanceContext] 应收账款已更新 (by OrderNumber):', orderNumber, updates);
          return { ...ar, ...updates };
        }
        return ar;
      })
    );
    // 同步到 Supabase（静默）
    accountsReceivableDb.updateByOrderNumber(orderNumber, updates).catch(() => {/* 静默 */});
  };

  const recordPayment = (id: string, payment: {
    date: string;
    amount: number;
    method: string;
    reference: string;
    receivedBy: string;
    notes?: string;
    proofUrl?: string;
    proofFileName?: string;
  }) => {
    setAccountsReceivable(prev => {
      const next = prev.map(ar => {
        if (ar.id === id) {
          const newPaidAmount = ar.paidAmount + payment.amount;
          const newRemainingAmount = ar.totalAmount - newPaidAmount;
          const newStatus =
            newRemainingAmount <= 0 ? 'paid' :
            newPaidAmount > 0 ? 'partially_paid' :
            new Date(ar.dueDate) < new Date() ? 'overdue' : 'pending';
          console.log('💰 [FinanceContext] 收款记录已添加:', payment);
          return {
            ...ar,
            paidAmount: newPaidAmount,
            remainingAmount: newRemainingAmount,
            status: newStatus,
            paymentHistory: [...ar.paymentHistory, payment]
          };
        }
        return ar;
      });
      // 同步到 Supabase
      const updated = next.find(a => a.id === id);
      if (updated) {
        void accountsReceivableDb.upsert(updated).catch(() => {});
      }
      return next;
    });
  };

  const getARByOrder = (orderNumber: string) => {
    return accountsReceivable.find(ar => ar.orderNumber === orderNumber);
  };

  // 🔥 新增：清空所有应收账款
  const clearAllAccountsReceivable = () => {
    setAccountsReceivable([]);
    console.log('🗑️ [FinanceContext] 所有应收账款已清空');
  };

  return (
    <FinanceContext.Provider
      value={{
        accountsReceivable,
        addAccountReceivable,
        updateAccountReceivable,
        updateARByOrderNumber,
        recordPayment,
        getARByOrder,
        clearAllAccountsReceivable
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}