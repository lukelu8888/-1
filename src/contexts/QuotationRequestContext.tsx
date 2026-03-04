import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * 📋 报价请求 Context
 * 
 * 业务流程：
 * 1. 业务员收到客户询价(Customer Inquiry)
 * 2. 业务员向采购员发起"报价请求"(Quotation Request)
 * 3. 采购员收到报价请求后，向多个供应商发送采购询价(XJ)
 * 4. 供应商报价
 * 5. 采购员选择最优报价，创建PO
 * 6. 业务员基于成本给客户报价
 */

// 🔥 报价请求状态
export type QuotationRequestStatus = 'pending' | 'processing' | 'quoted' | 'completed' | 'cancelled';

// 🔥 报价请求产品项
export interface QuotationRequestItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number; // 客户期望价格
  currency: string;
  hsCode?: string;
  remarks?: string;
}

// 🔥 报价请求接口
export interface QuotationRequest {
  id: string;
  requestNumber: string; // QR-NA-251217-0001
  
  // 来源：客户询价
  sourceInquiryId: string;
  sourceInquiryNumber: string;
  customerName: string;
  customerEmail?: string;
  region: string;
  
  // 请求人：业务员
  requestedBy: string; // 业务员邮箱
  requestedByName?: string; // 业务员姓名
  requestDate: string;
  expectedQuoteDate: string; // 期望报价日期
  
  // 产品清单
  items: QuotationRequestItem[];
  
  // 状态
  status: QuotationRequestStatus;
  
  // 采购员信息
  assignedTo?: string; // 采购员邮箱
  assignedToName?: string; // 采购员姓名
  assignedDate?: string;
  
  // 关联的XJ（采购员创建的采购询价）
  rfqIds?: string[];
  rfqCount?: number; // XJ数量
  
  // 报价信息（采购员完成后）
  quotedPrice?: number;
  quotedCurrency?: string;
  quotedDate?: string;
  
  // 备注
  remarks?: string;
  
  // 时间戳
  createdDate: string;
  updatedDate?: string;
}

interface QuotationRequestContextType {
  quotationRequests: QuotationRequest[];
  addQuotationRequest: (request: QuotationRequest) => void;
  updateQuotationRequest: (id: string, updates: Partial<QuotationRequest>) => void;
  deleteQuotationRequest: (id: string) => void;
  getQuotationRequestById: (id: string) => QuotationRequest | undefined;
  getQuotationRequestsByInquiry: (inquiryId: string) => QuotationRequest[];
  getQuotationRequestsBySalesRep: (salesRepEmail: string) => QuotationRequest[];
  getQuotationRequestsByProcurement: (procurementEmail: string) => QuotationRequest[];
  getPendingQuotationRequests: () => QuotationRequest[];
}

const QuotationRequestContext = createContext<QuotationRequestContextType | undefined>(undefined);

export const QuotationRequestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 从localStorage加载初始数据
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quotationRequests');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('📦 从localStorage加载QuotationRequest数据，总数:', parsed.length);
          return parsed;
        } catch (e) {
          console.error('❌ 加载QuotationRequest数据失败:', e);
        }
      }
    }
    return [];
  });

  // 🔥 每次quotationRequests变化时，自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('quotationRequests', JSON.stringify(quotationRequests));
      console.log('💾 保存QuotationRequest数据到localStorage，总数:', quotationRequests.length);
    }
  }, [quotationRequests]);

  const addQuotationRequest = (request: QuotationRequest) => {
    setQuotationRequests(prev => {
      const exists = prev.some(r => r.id === request.id);
      if (exists) {
        console.warn(`⚠️ QuotationRequest ${request.id} 已存在，跳过添加`);
        return prev;
      }
      console.log('✅ 添加新QuotationRequest:', request.requestNumber);
      return [...prev, request];
    });
  };

  const updateQuotationRequest = (id: string, updates: Partial<QuotationRequest>) => {
    setQuotationRequests(prev =>
      prev.map(request =>
        request.id === id
          ? { ...request, ...updates, updatedDate: new Date().toISOString().split('T')[0] }
          : request
      )
    );
    console.log('✅ 更新QuotationRequest:', id, updates);
  };

  const deleteQuotationRequest = (id: string) => {
    setQuotationRequests(prev => prev.filter(request => request.id !== id));
    console.log('🗑️ 删除QuotationRequest:', id);
  };

  const getQuotationRequestById = (id: string) => {
    return quotationRequests.find(request => request.id === id);
  };

  const getQuotationRequestsByInquiry = (inquiryId: string) => {
    return quotationRequests.filter(request => request.sourceInquiryId === inquiryId);
  };

  const getQuotationRequestsBySalesRep = (salesRepEmail: string) => {
    return quotationRequests.filter(request => request.requestedBy === salesRepEmail);
  };

  const getQuotationRequestsByProcurement = (procurementEmail: string) => {
    return quotationRequests.filter(
      request => request.assignedTo === procurementEmail || !request.assignedTo
    );
  };

  const getPendingQuotationRequests = () => {
    return quotationRequests.filter(request => request.status === 'pending');
  };

  return (
    <QuotationRequestContext.Provider
      value={{
        quotationRequests,
        addQuotationRequest,
        updateQuotationRequest,
        deleteQuotationRequest,
        getQuotationRequestById,
        getQuotationRequestsByInquiry,
        getQuotationRequestsBySalesRep,
        getQuotationRequestsByProcurement,
        getPendingQuotationRequests,
      }}
    >
      {children}
    </QuotationRequestContext.Provider>
  );
};

export const useQuotationRequests = () => {
  const context = useContext(QuotationRequestContext);
  if (!context) {
    throw new Error('useQuotationRequests must be used within QuotationRequestProvider');
  }
  return context;
};
