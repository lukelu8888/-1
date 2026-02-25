import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getCurrentUser } from '../utils/dataIsolation';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';

// 🎯 销售报价单（QT）- 业务员创建，需要审批

export interface SalesQuotationItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  
  // 成本信息（从供应商报价BJ获取）
  costPrice: number;
  selectedSupplier: string; // 选择的供应商
  selectedSupplierName: string;
  selectedBJ: string; // 关联的供应商报价单号 BJ-xxx
  
  // 销售报价
  salesPrice: number; // 销售价格
  profitMargin: number; // 利润率 (0.18 = 18%)
  profit: number; // 利润金额
  
  hsCode?: string;
  remarks?: string;
}

export interface SalesQuotation {
  id: string;
  qtNumber: string; // QT-NA-251219-6789
  
  // 关联单据
  qrNumber: string; // QR-NA-251219-1234（采购需求单）
  inqNumber: string; // INQ-NA-251219-0001（客户询价单）
  
  // 区域和客户
  region: 'NA' | 'SA' | 'EU';
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  
  // 业务员信息
  salesPerson: string; // 业务员邮箱
  salesPersonName: string;
  
  // 报价产品
  items: SalesQuotationItem[];
  
  // 财务汇总
  totalCost: number; // 总成本
  totalPrice: number; // 总报价
  totalProfit: number; // 总利润
  profitRate: number; // 总利润率
  
  // 付款和交付条件
  currency: string; // USD, EUR, etc.
  paymentTerms: string; // 30天账期, T/T, L/C等
  deliveryTerms: string; // FOB, CIF, EXW等
  deliveryDate: string;
  
  // 审批状态
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approvalChain: {
    level: 1 | 2; // 1=区域业务主管, 2=销售总监
    approverRole: '区域业务主管' | '销售总监';
    approverEmail: string;
    approverName?: string;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    approvedAt?: string;
  }[];
  
  // 客户响应
  customerStatus: 'not_sent' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'negotiating' | 'expired';
  customerResponse?: {
    status: 'accepted' | 'rejected' | 'negotiating';
    comment?: string;
    respondedAt: string;
  };
  
  // 关联销售订单
  soNumber?: string; // SO-NA-251219-8888
  
  // 🔥 新增：下推销售合同相关字段
  pushedToContract?: boolean; // 是否已下推到销售合同
  pushedContractNumber?: string; // 下推的销售合同号 SC-xxx
  pushedContractAt?: string; // 下推时间
  pushedBy?: string; // 下推操作人邮箱
  
  // 报价有效期
  validUntil: string;
  
  // 版本管理（支持修改报价）
  version: number; // 1, 2, 3...
  previousVersion?: string; // QT编号（如果是修改版本）
  
  // 时间戳
  createdAt: string;
  updatedAt: string;
  sentAt?: string; // 发送给客户的时间
  
  // 备注（🔥 重要：区分内部备注和客户备注）
  notes?: string; // 🚨 已废弃：可能包含敏感信息，不应直接使用
  customerNotes?: string; // ✅ 客户备注：可以给客户看的备注信息
  internalNotes?: string; // 🔒 内部备注：采购员建议、成本分析等敏感信息，仅内部可见
  tradeTerms?: {
    incoterms?: string;
    paymentTerms?: string;
    deliveryTime?: string;
    packing?: string;
    portOfLoading?: string;
    portOfDestination?: string;
    warranty?: string;
    inspection?: string;
  };
  remarks?: string; // ✅ 给客户看的备注说明
}

interface SalesQuotationContextType {
  quotations: SalesQuotation[];
  addQuotation: (quotation: SalesQuotation) => void;
  updateQuotation: (id: string, updates: Partial<SalesQuotation>) => void;
  deleteQuotation: (id: string) => void;
  getQuotationById: (id: string) => SalesQuotation | undefined;
  getQuotationByNumber: (qtNumber: string) => SalesQuotation | undefined;
  getQuotationsByQR: (qrNumber: string) => SalesQuotation[];
  getQuotationsByCustomer: (customerEmail: string) => SalesQuotation[];
  getQuotationsBySalesPerson: (salesPersonEmail: string) => SalesQuotation[];
}

const SalesQuotationContext = createContext<SalesQuotationContextType | undefined>(undefined);

const getSalesQuotationMarkers = (quotation: Partial<SalesQuotation>): string[] => {
  return [quotation.id, quotation.qtNumber, quotation.qrNumber, quotation.inqNumber]
    .filter(Boolean)
    .map((v) => String(v));
};

const emitSalesQuotationEvent = (
  key: string,
  quotation: Partial<SalesQuotation> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-sales-quotation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'quotation',
    recordId: String(quotation.id),
    internalNo: String(quotation.qtNumber || quotation.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

export const SalesQuotationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从localStorage加载初始数据
  const [quotations, setQuotations] = useState<SalesQuotation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('salesQuotations');
      console.log('🔍 [SalesQuotation] 初始化加载 - localStorage键值:', saved ? `有数据(${saved.length}字符)` : '无数据');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const visible = filterNotDeleted('quotation', parsed, (q) => getSalesQuotationMarkers(q));
          console.log('✅ [SalesQuotation] 从localStorage加载销售报价单，总数:', parsed.length);
          console.log('📋 [SalesQuotation] 加载的报价单列表:');
          visible.forEach((qt: SalesQuotation, index: number) => {
            console.log(`  ${index + 1}. ${qt.qtNumber} - 业务员: ${qt.salesPerson} - 状态: ${qt.approvalStatus}`);
          });
          return visible;
        } catch (e) {
          console.error('❌ [SalesQuotation] 加载销售报价单失败:', e);
        }
      }
    }
    console.log('📋 [SalesQuotation] 初始化销售报价单为空数组');
    return [];
  });

  // 🔥 监听用户切换事件，重新加载数据
  React.useEffect(() => {
    const handleUserChanged = () => {
      console.log('🔄 [SalesQuotation] 检测到用户切换，重新加载销售报价单数据');
      
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('salesQuotations');
        console.log('  - localStorage数据:', saved ? `有数据(${saved.length}字符)` : '无数据');
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const visible = filterNotDeleted('quotation', parsed, (q) => getSalesQuotationMarkers(q));
            console.log('  - 重新加载销售报价单，总数:', parsed.length);
            console.log('  - 报价单列表:');
            visible.forEach((qt: SalesQuotation, index: number) => {
              console.log(`    ${index + 1}. ${qt.qtNumber} - 业务员: ${qt.salesPerson} - 状态: ${qt.approvalStatus}`);
            });
            setQuotations(visible);
          } catch (e) {
            console.error('  - ❌ 重新加载失败:', e);
            setQuotations([]);
          }
        } else {
          console.log('  - 无数据，设置为空数组');
          setQuotations([]);
        }
      }
    };

    window.addEventListener('userChanged', handleUserChanged);
    
    console.log('✅ [SalesQuotation] 已注册事件监听: userChanged');
    
    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      console.log('🔚 [SalesQuotation] 已移除事件监听');
    };
  }, []);

  // 自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('salesQuotations', JSON.stringify(quotations));
      console.log('💾 [SalesQuotation] 销售报价单已保存，总数:', quotations.length);
    }
  }, [quotations]);

  const addQuotation = (quotation: SalesQuotation) => {
    console.log('➕ [SalesQuotation] 添加新销售报价单:', quotation.qtNumber);
    console.log('  - 报价单数据:', quotation);
    setQuotations(prev => {
      const newQuotations = [...prev, quotation];
      console.log('  ✅ 当前销售报价单总数:', newQuotations.length);
      console.log('  ✅ 新列表:', newQuotations);
      
      // 🔥 立即保存到 localStorage（不等待 useEffect）
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('salesQuotations', JSON.stringify(newQuotations));
          console.log('  💾 立即保存到 localStorage 成功');
          
          // 验证保存结果
          const saved = localStorage.getItem('salesQuotations');
          const parsed = saved ? JSON.parse(saved) : [];
          console.log('  🔍 验证：从 localStorage 读取到', parsed.length, '条数据');
        } catch (err) {
          console.error('  ❌ 保存到 localStorage 失败:', err);
        }
      }
      
      return newQuotations;
    });
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_CREATED, quotation, {
      approvalStatus: quotation.approvalStatus,
      customerStatus: quotation.customerStatus,
    });
  };

  const updateQuotation = (id: string, updates: Partial<SalesQuotation>) => {
    console.log('🔄 [SalesQuotation] 更新销售报价单:', id, updates);
    const currentQuotation = quotations.find((qt) => qt.id === id);
    setQuotations(prev =>
      prev.map(qt => qt.id === id ? { ...qt, ...updates, updatedAt: new Date().toISOString() } : qt)
    );
    if (updates.customerStatus === 'sent' || updates.customerStatus === 'viewed') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_SENT, { id, qtNumber: String(currentQuotation?.qtNumber || id) }, { customerStatus: updates.customerStatus });
    }
    if (updates.customerStatus === 'accepted') {
      emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_ACCEPTED, { id, qtNumber: String(currentQuotation?.qtNumber || id) }, { customerStatus: updates.customerStatus });
    }
  };

  const deleteQuotation = (id: string) => {
    console.log('🗑️ [SalesQuotation] 删除销售报价单:', id);
    const currentQuotation = quotations.find((qt) => qt.id === id);
    const markers = currentQuotation ? getSalesQuotationMarkers(currentQuotation) : [String(id)];
    addTombstones('quotation', markers, {
      reason: 'manual_delete',
      deletedBy: (getCurrentUser() as any)?.email || 'unknown',
    });
    setQuotations((prev) =>
      filterNotDeleted(
        'quotation',
        prev.filter((qt) => qt.id !== id),
        (q) => getSalesQuotationMarkers(q),
      ),
    );
    emitSalesQuotationEvent(ERP_EVENT_KEYS.QUOTATION_DELETED, { id, qtNumber: String(currentQuotation?.qtNumber || id) });
  };

  const getQuotationById = (id: string) => {
    return quotations.find(qt => qt.id === id);
  };

  const getQuotationByNumber = (qtNumber: string) => {
    return quotations.find(qt => qt.qtNumber === qtNumber);
  };

  const getQuotationsByQR = (qrNumber: string) => {
    return quotations.filter(qt => qt.qrNumber === qrNumber);
  };

  const getQuotationsByCustomer = (customerEmail: string) => {
    return quotations.filter(qt => qt.customerEmail === customerEmail);
  };

  const getQuotationsBySalesPerson = (salesPersonEmail: string) => {
    return quotations.filter(qt => qt.salesPerson === salesPersonEmail);
  };

  return (
    <SalesQuotationContext.Provider
      value={{
        quotations,
        addQuotation,
        updateQuotation,
        deleteQuotation,
        getQuotationById,
        getQuotationByNumber,
        getQuotationsByQR,
        getQuotationsByCustomer,
        getQuotationsBySalesPerson
      }}
    >
      {children}
    </SalesQuotationContext.Provider>
  );
};

export const useSalesQuotations = () => {
  const context = useContext(SalesQuotationContext);
  if (context === undefined) {
    throw new Error('useSalesQuotations must be used within a SalesQuotationProvider');
  }
  return context;
};
