import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { arService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { getStoredPortalRole, isStoredStaffPortalRole } from '../utils/dataIsolation';

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
  creditLimitUsd?: number | null;
  overdueRiskLevel?: string | null;
  creditReleaseApprovedBy?: string | null;
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
  depositReceiptProof?: Record<string, any> | null; // 财务确认定金到账凭证
  balanceReceiptProof?: Record<string, any> | null; // 财务确认余款到账凭证
  createdAt: number;
  createdBy: string;
  notes?: string;
}

interface FinanceContextType {
  accountsReceivable: AccountReceivable[];
  refreshFinanceData: () => Promise<void>;
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
  const [accountsReceivable, setAccountsReceivable] = useState<AccountReceivable[]>([]);

  const loadAccountsReceivable = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setAccountsReceivable([]);
      return;
    }
    let isStaff = isStoredStaffPortalRole();
    if (!isStaff && getStoredPortalRole() === null) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('portal_role')
        .eq('id', session.user.id)
        .maybeSingle();
      isStaff = profile?.portal_role === 'admin' || profile?.portal_role === 'staff';
    }
    const rows = isStaff
      ? await arService.getAll()
      : await arService.getByEmail(session.user.email || '');
    if (!Array.isArray(rows)) return;
    setAccountsReceivable(rows.filter(Boolean) as AccountReceivable[]);
  };

  // Supabase-first: 从 accounts_receivable 表加载
  useEffect(() => {
    let alive = true;
    const load = async () => {
      await loadAccountsReceivable();
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setAccountsReceivable([]);
    });
    const handleFinanceDataUpdated = () => { void load(); };
    window.addEventListener('financeDataUpdated', handleFinanceDataUpdated);
    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener('financeDataUpdated', handleFinanceDataUpdated);
    };
  }, []);

  // Realtime 订阅
  useEffect(() => {
    const channel = arService.subscribeToChanges(() => {
      void loadAccountsReceivable();
    });
    return () => { void supabase.removeChannel(channel); };
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
    arService.upsert(newAR).catch(() => {});
    
    return newAR;
  };

  const updateAccountReceivable = (id: string, updates: Partial<AccountReceivable>) => {
    setAccountsReceivable(prev => {
      const next = prev.map(ar => (ar.id === id ? { ...ar, ...updates } : ar));
      // 同步到 Supabase
      const updated = next.find(a => a.id === id);
      if (updated) {
        void arService.upsert(updated).catch(() => {});
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
    arService.updateByOrderNumber(orderNumber, updates).catch(() => {});
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
        void arService.upsert(updated).catch(() => {});
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
        refreshFinanceData: loadAccountsReceivable,
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
