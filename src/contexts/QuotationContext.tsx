import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Quotation } from '../components/admin/QuotationManagement';
import { getUserData, setUserData, getAllCustomersData, getCurrentUser } from '../utils/dataIsolation';
import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';

const getQuotationMarkers = (quotation: Partial<Quotation>): string[] => {
  return [quotation.id, (quotation as any).qtNumber, quotation.quotationNumber]
    .filter(Boolean)
    .map((v) => String(v));
};

const emitQuotationEvent = (
  key: string,
  quotation: Partial<Quotation> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-quotation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'quotation',
    recordId: String(quotation.id),
    internalNo: String((quotation as any).qtNumber || quotation.quotationNumber || quotation.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

interface QuotationContextType {
  quotations: Quotation[];
  addQuotation: (quotation: Quotation) => void;
  updateQuotation: (id: string, updates: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => Quotation | undefined;
}

const QuotationContext = createContext<QuotationContextType | undefined>(undefined);

export function QuotationProvider({ children }: { children: ReactNode }) {
  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    // 🔒 数据隔离：根据用户类型加载数据
    if (typeof window !== 'undefined') {
      const currentUser = getCurrentUser();
      
      console.log('🔍 [QuotationContext] 初始化加载报价数据');
      console.log('  - 当前用户:', currentUser);
      
      if (!currentUser) {
        console.log('  - ⚠️ 未登录，返回空数组');
        return [];
      }
      
      // Admin可以看到所有客户的报价
      if (currentUser.type === 'admin') {
        const allQuotations = getAllCustomersData<Quotation>('quotations');
        const visible = filterNotDeleted('quotation', allQuotations, (q) => getQuotationMarkers(q));
        console.log('  - 🔑 Admin视图，加载所有客户报价:', allQuotations.length, '条');
        console.log('  - 报价列表:', allQuotations);
        return visible;
      }
      
      // 客户只能看到自己的报价
      const customerQuotations = getUserData<Quotation>('quotations', currentUser.email);
      const visible = filterNotDeleted('quotation', customerQuotations, (q) => getQuotationMarkers(q));
      console.log('  - 👤 客户视图，加载自己的报价:', customerQuotations.length, '条');
      console.log('  - 客户邮箱:', currentUser.email);
      console.log('  - 报价列表:', customerQuotations);
      return visible;
    }
    return [];
  });

  // 🔥 监听用户切换事件，重新加载报价数据
  React.useEffect(() => {
    const handleUserChanged = () => {
      console.log('🔄 [QuotationContext] 检测到用户切换，重新加载报价数据');
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.log('  - ⚠️ 未登录，清空报价列表');
        setQuotations([]);
        return;
      }
      
      // Admin可以看到所有客户的报价
      if (currentUser.type === 'admin') {
        const allQuotations = getAllCustomersData<Quotation>('quotations');
        console.log('  - 🔑 Admin视图，重新加载所有客户报价:', allQuotations.length, '条');
        setQuotations(filterNotDeleted('quotation', allQuotations, (q) => getQuotationMarkers(q)));
      } else {
        // 客户只能看到自己的报价
        const customerQuotations = getUserData<Quotation>('quotations', currentUser.email);
        console.log('  - 👤 客户视图，重新加载自己的报价:', customerQuotations.length, '条');
        setQuotations(filterNotDeleted('quotation', customerQuotations, (q) => getQuotationMarkers(q)));
      }
    };

    // 🔥 监听报价数据更新事件（跨用户数据同步）
    const handleQuotationsUpdated = () => {
      console.log('🔄 [QuotationContext] 检测到报价数据更新，重新加载');
      const currentUser = getCurrentUser();
      
      if (!currentUser) return;
      
      if (currentUser.type === 'admin') {
        const allQuotations = getAllCustomersData<Quotation>('quotations');
        console.log('  - 🔑 Admin视图，重新聚合所有报价:', allQuotations.length, '条');
        setQuotations(filterNotDeleted('quotation', allQuotations, (q) => getQuotationMarkers(q)));
      } else {
        const customerQuotations = getUserData<Quotation>('quotations', currentUser.email);
        console.log('  - 👤 客户视图，重新加载自己的报价:', customerQuotations.length, '条');
        setQuotations(filterNotDeleted('quotation', customerQuotations, (q) => getQuotationMarkers(q)));
      }
    };

    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('quotationsUpdated', handleQuotationsUpdated);
    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('quotationsUpdated', handleQuotationsUpdated);
    };
  }, []);

  const addQuotation = (quotation: Quotation) => {
    // 🔒 添加报价到对应客户的存储
    const customerEmail = quotation.customerEmail;
    
    console.log('📝 [QuotationContext] 添加报价');
    console.log('  - 报价编号:', quotation.quotationNumber);
    console.log('  - 客户邮箱:', customerEmail);
    console.log('  - 报价详情:', quotation);
    
    // 🔥 验证客户邮箱是否有效
    if (!customerEmail || customerEmail === 'N/A' || customerEmail === 'customer@example.com') {
      console.error('❌ [QuotationContext] 报价的客户邮箱无效！');
      console.error('  - customerEmail:', customerEmail);
      console.error('  - 报价将不会被保存');
      return;
    }
    
    // 读取该客户的现有报价
    const customerQuotations = getUserData<Quotation>('quotations', customerEmail);
    console.log('  - 该客户现有报价数量:', customerQuotations.length);
    
    // 添加新报价
    const updatedQuotations = [quotation, ...customerQuotations];
    
    // 保存到该客户的专属存储
    const saved = setUserData('quotations', updatedQuotations, customerEmail);
    console.log('  - 保存结果:', saved ? '✅ 成功' : '❌ 失败');
    console.log('  - localStorage键名:', `quotations_${customerEmail}`);
    
    // 更新当前Context状态（如果是Admin视图，需要重新聚合）
    const currentUser = getCurrentUser();
    if (currentUser?.type === 'admin') {
      const allQuotations = getAllCustomersData<Quotation>('quotations');
      console.log('  - Admin视图，重新聚合所有报价:', allQuotations.length, '条');
      setQuotations(filterNotDeleted('quotation', allQuotations, (q) => getQuotationMarkers(q)));
    } else {
      console.log('  - 客户视图，更新本地报价列表');
      setQuotations(
        filterNotDeleted('quotation', updatedQuotations, (q) => getQuotationMarkers(q)),
      );
    }
    
    // 🔥 标记对应的询价为已使用（一对一关系）
    if (quotation.inquiryNumber) {
      const inquiries = JSON.parse(localStorage.getItem('admin_inquiries') || '[]');
      const updatedInquiries = inquiries.map((inq: any) => {
        if (inq.inquiryNumber === quotation.inquiryNumber) {
          return {
            ...inq,
            quotationCreated: true,
            quotationNumber: quotation.quotationNumber,
            status: 'quoted' // 更新状态为已报价
          };
        }
        return inq;
      });
      localStorage.setItem('admin_inquiries', JSON.stringify(updatedInquiries));
      
      // 🔥 触发同步事件，通知其他组件更新
      window.dispatchEvent(new Event('inquiriesUpdated'));
      console.log('✅ 已标记询价为已使用:', quotation.inquiryNumber);
    }

    emitQuotationEvent(ERP_EVENT_KEYS.QUOTATION_CREATED, quotation, {
      status: quotation.status,
    });
  };

  const updateQuotation = (id: string, updates: Partial<Quotation>) => {
    // 🔒 更新报价：需要找到对应客户并更新其数据
    const currentUser = getCurrentUser();
    
    console.log('🔄 [QuotationContext] 更新报价');
    console.log('  - 报价ID:', id);
    console.log('  - 更新内容:', updates);
    console.log('  - 当前用户:', currentUser);
    
    if (currentUser?.type === 'admin') {
      // Admin更新：需要找到报价属于哪个客户
      const allQuotations = getAllCustomersData<Quotation>('quotations');
      const quotationToUpdate = allQuotations.find(q => q.id === id);
      
      if (quotationToUpdate) {
        const customerEmail = quotationToUpdate.customerEmail;
        console.log('  - 找到报价，客户邮箱:', customerEmail);
        
        const customerQuotations = getUserData<Quotation>('quotations', customerEmail);
        const updated = customerQuotations.map(q => q.id === id ? { ...q, ...updates } : q);
        setUserData('quotations', updated, customerEmail);
        
        console.log('  - ✅ 已保存到客户存储:', `quotations_${customerEmail}`);
        
        // 重新聚合所有数据
        setQuotations(
          filterNotDeleted('quotation', getAllCustomersData<Quotation>('quotations'), (q) =>
            getQuotationMarkers(q),
          ),
        );
        
        // 🔥 触发同步事件
        window.dispatchEvent(new Event('quotationsUpdated'));
        console.log('  - 🔔 已触发quotationsUpdated事件');
      } else {
        console.error('  - ❌ 未找到要更新的报价');
      }
    } else {
      // 客户更新自己的报价
      console.log('  - 客户更新自己的报价');
      
      const customerEmail = currentUser.email;
      const customerQuotations = getUserData<Quotation>('quotations', customerEmail);
      console.log('  - 更新前客户报价数量:', customerQuotations.length);
      console.log('  - 更新前报价列表:', customerQuotations.map(q => q.quotationNumber));
      
      const updated = customerQuotations.map(q => q.id === id ? { ...q, ...updates } : q);
      console.log('  - 更新后报价数量:', updated.length);
      console.log('  - 更新后报价列表:', updated.map(q => `${q.quotationNumber} (状态: ${q.status})`));
      
      // 🔥 先保存到localStorage
      setUserData('quotations', updated, customerEmail);
      console.log('  - ✅ 已保存到客户存储:', `quotations_${customerEmail}`);
      
      // 🔥 验证保存结果
      const saved = localStorage.getItem(`quotations_${customerEmail}`);
      console.log('  - 🔍 验证localStorage保存结果:', saved ? `${JSON.parse(saved).length}条` : '未找到');
      
      // 🔥 再更新本地状态
      setQuotations(filterNotDeleted('quotation', updated, (q) => getQuotationMarkers(q)));
      console.log('  - ✅ 已更新本地React state');
      
      // 🔥 延迟触发同步事件，确保localStorage已完全写入
      setTimeout(() => {
        window.dispatchEvent(new Event('quotationsUpdated'));
        console.log('  - 🔔 已触发quotationsUpdated事件（通知Admin）');
      }, 100);
    }
  };

  const deleteQuotation = (id: string) => {
    // 🔒 删除报价：需要找到对应客户并删除其数据
    const currentUser = getCurrentUser();
    
    if (currentUser?.type === 'admin') {
      // Admin删除：需要找到报价属于哪个客户
      const allQuotations = getAllCustomersData<Quotation>('quotations');
      const quotationToDelete = allQuotations.find(q => q.id === id);
      
      if (quotationToDelete) {
        const customerEmail = quotationToDelete.customerEmail;
        const customerQuotations = getUserData<Quotation>('quotations', customerEmail);
        const filtered = customerQuotations.filter(q => q.id !== id);
        setUserData('quotations', filtered, customerEmail);
        
        // 重新聚合所有数据
        setQuotations(
          filterNotDeleted('quotation', getAllCustomersData<Quotation>('quotations'), (q) =>
            getQuotationMarkers(q),
          ),
        );
      }
    } else {
      // 客户删除自己的报价
      const customerEmail = currentUser?.email;
      if (!customerEmail) return;

      const customerQuotations = getUserData<Quotation>('quotations', customerEmail);
      const filtered = customerQuotations.filter(q => q.id !== id);
      setUserData('quotations', filtered, customerEmail);
      setQuotations(filterNotDeleted('quotation', filtered, (q) => getQuotationMarkers(q)));
      window.dispatchEvent(new Event('quotationsUpdated'));
    }

    const target = quotations.find((q) => q.id === id);
    const markers = target ? getQuotationMarkers(target) : [String(id)];
    addTombstones('quotation', markers, {
      reason: 'manual_delete',
      deletedBy: currentUser?.email || 'unknown',
    });
    emitQuotationEvent(ERP_EVENT_KEYS.QUOTATION_DELETED, {
      id,
      quotationNumber: String(target?.quotationNumber || id),
      ...(target as any)?.qtNumber ? { qtNumber: (target as any).qtNumber } : {},
    } as any);
  };

  const getQuotationById = (id: string) => {
    return quotations.find(q => q.id === id);
  };

  return (
    <QuotationContext.Provider value={{
      quotations,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      getQuotationById
    }}>
      {children}
    </QuotationContext.Provider>
  );
}

export function useQuotations() {
  const context = useContext(QuotationContext);
  if (!context) {
    throw new Error('useQuotations must be used within QuotationProvider');
  }
  return context;
}
