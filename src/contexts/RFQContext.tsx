import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { apiFetchJson, getApiToken, getBackendUser } from '../api/backend-auth';

// 🔥 询价请求（RFQ - Request for Quotation）状态
export type RFQStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';

// 🔥 产品信息接口
export interface RFQProduct {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
}

// 🔥 询价请求接口
export interface RFQ {
  id: string;
  rfqNumber: string; // ⚠️ 字段名保留兼容性，实际存储QR采购需求编号（非RFQ！）
  
  // 🔥 供应商专属编号（供应商Portal显示）
  supplierRfqNo?: string; // 供应商询价单号 XJ-251218-7184
  supplierQuotationNo?: string; // 供应商报价单号 BJ-251218-7184（报价后生成）
  
  // 🔥 关联COSUN采购需求编号（QR - Quotation Request）
  sourceQRNumber?: string; // 采购需求编号 QR-NA-251217-9365（旧字段，兼容）
  
  // 🔥 关联客户询价单
  sourceInquiryId?: string; // 客户询价单ID
  sourceInquiryNumber?: string; // 客户询价单号
  customerName?: string; // 客户名称（方便显示）
  customerRegion?: string; // 客户来源区域（NA/SA/EMEA）
  
  requirementNo?: string; // 🔥 COSUN采购需求编号 QR-xxx（核心字段！）
  sourceRef?: string; // 来源单号（销售订单号等）
  
  // 🔥 产品信息（新：支持多个产品）
  products?: RFQProduct[]; // 产品列表数组
  
  // 🔥 产品信息（旧：单个产品，保留兼容性）
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency?: string;
  
  // 🔥 供应商信息（单个供应商）
  supplierCode: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail: string;
  
  // 🔥 询价信息
  expectedDate: string; // 期望交货日期
  quotationDeadline?: string; // 报价截止日期
  dueDate?: string; // 截止日期（兼容）
  priority?: string; // 优先级
  
  // 🔥 状态信息
  status: RFQStatus;
  
  // 🔥 其他信息
  remarks?: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;
  
  // 🔥 供应商报价信息（每个供应商一份报价）
  quotes?: Array<{
    supplierCode: string;
    supplierName: string;
    quotedDate: string;
    quotedPrice: number;
    currency: string;
    leadTime: number;
    moq: number;
    validityDays: number;
    paymentTerms: string;
    remarks?: string;
  }>;
  
  // 🔥 完整的询价单文档数据（供供应商Portal显示）
  documentData?: any; // SupplierRFQData 类型
}

export type RFQQuote = NonNullable<RFQ['quotes']>[number];

interface RFQContextType {
  rfqs: RFQ[];
  addRFQ: (rfq: RFQ) => void;
  updateRFQ: (id: string, updates: Partial<RFQ>) => void;
  deleteRFQ: (id: string) => void;
  getRFQById: (id: string) => RFQ | undefined;
  getRFQsByRequirement: (requirementNo: string) => RFQ[];
  getRFQsBySupplier: (supplierCodeOrEmail: string) => RFQ[];
  addQuoteToRFQ: (rfqId: string, quote: RFQQuote) => void;
  refreshMineFromBackend: (opts?: { force?: boolean }) => Promise<void>;
}

const RFQContext = createContext<RFQContextType | undefined>(undefined);

export const RFQProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 从localStorage加载初始数据
  const [rfqs, setRFQs] = useState<RFQ[]>(() => {
    if (typeof window !== 'undefined') {
      // 🔥 合并两个数据源：rfqs（Admin端创建的草稿）+ supplierRFQs（Admin提交给供应商的）
      const adminRFQs = localStorage.getItem('rfqs');
      const supplierRFQs = localStorage.getItem('supplierRFQs');
      
      let allRFQs: RFQ[] = [];
      
      // 加载Admin端的rfqs
      if (adminRFQs) {
        try {
          const parsed = JSON.parse(adminRFQs);
          allRFQs = [...parsed];
          console.log('📦 从localStorage加载Admin RFQ数据，总数:', parsed.length);
        } catch (e) {
          console.error('❌ 加载Admin RFQ数据失败:', e);
        }
      }
      
      // 加载提交给供应商的supplierRFQs
      if (supplierRFQs) {
        try {
          const parsed = JSON.parse(supplierRFQs);
          console.log('📦 从localStorage加载Supplier RFQ数据，总数:', parsed.length);
          
          // 🔥 去重：如果id已存在，则跳过（避免重复）
          parsed.forEach((supplierRFQ: any) => {
            if (!allRFQs.find(rfq => rfq.id === supplierRFQ.id)) {
              allRFQs.push(supplierRFQ);
            }
          });
        } catch (e) {
          console.error('❌ 加载Supplier RFQ数据失败:', e);
        }
      }
      
      console.log('✅ 合并后的总RFQ数量:', allRFQs.length);
      return allRFQs;
    }
    return [];
  });

  // 🔥 每次rfqs变化时，自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('rfqs', JSON.stringify(rfqs));
      console.log('💾 RFQ已保存到localStorage，总数:', rfqs.length);
    }
  }, [rfqs]);

  // 🔥 监听supplierRFQs的变化（Admin端提交新询价单）
  React.useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔔 检测到supplierRFQs变化，重新加载...');
      
      const supplierRFQs = localStorage.getItem('supplierRFQs');
      if (supplierRFQs) {
        try {
          const parsed = JSON.parse(supplierRFQs);
          console.log('📦 重新加载supplierRFQs，数量:', parsed.length);
          
          // 🔥 修复：只添加新的RFQ，不重新加载所有历史数据
          // 对比当前rfqs中的id，只添加不存在的新RFQ
          setRFQs(prev => {
            const existingIds = new Set(prev.map(rfq => rfq.id));
            const newRFQs = parsed.filter((supplierRFQ: any) => !existingIds.has(supplierRFQ.id));
            
            if (newRFQs.length > 0) {
              console.log(`✅ 添加${newRFQs.length}个新RFQ:`, newRFQs.map((r: any) => r.supplierRfqNo));
              return [...prev, ...newRFQs];
            } else {
              console.log('⏭️ 没有新的RFQ需要添加');
              return prev;
            }
          });
        } catch (e) {
          console.error('❌ 重新加载supplierRFQs失败:', e);
        }
      }
    };

    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 🔥 监听自定义事件（同标签页内）
    window.addEventListener('supplierRFQsUpdated', handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('supplierRFQsUpdated', handleStorageChange as EventListener);
    };
  }, []);

  const mineInFlightRef = useRef<Promise<void> | null>(null);
  const mineLastFetchedAtRef = useRef<number>(0);

  const refreshMineFromBackend = useCallback(async (opts?: { force?: boolean }) => {
    const force = Boolean(opts?.force);

    // Dedupe: if a request is already running, reuse it.
    if (mineInFlightRef.current && !force) {
      return await mineInFlightRef.current;
    }

    // Throttle: avoid spamming when multiple effects fire in dev/StrictMode.
    const now = Date.now();
    if (!force && now - mineLastFetchedAtRef.current < 2000) {
      return;
    }

    const run = (async () => {
      try {
        const token = getApiToken();
        const backendUser = getBackendUser();
        if (!token) return;

        // Some pages rely on local session user; be tolerant here.
        const localAuthRaw = typeof window !== 'undefined' ? localStorage.getItem('cosun_auth_user') : null;
        let localType: string | null = null;
        try {
          localType = localAuthRaw ? (JSON.parse(localAuthRaw)?.type ?? null) : null;
        } catch {
          localType = null;
        }

        const isSupplier =
          backendUser?.portal_role === 'supplier' ||
          backendUser?.rbac_role === 'Supplier' ||
          localType === 'supplier' ||
          localType === 'manufacturer';

        if (!isSupplier) return;

        mineLastFetchedAtRef.current = Date.now();

        const data = await apiFetchJson<{ rfqs: RFQ[] }>('/api/supplier-rfqs/mine');
        const serverRfqs = (data?.rfqs || []).filter(Boolean);

        setRFQs(prev => {
          const byId = new Map(prev.map(r => [r.id, r]));
          for (const r of serverRfqs) {
            byId.set(r.id, { ...(byId.get(r.id) || {}), ...r });
          }
          return Array.from(byId.values());
        });
      } catch (e) {
        console.error('❌ [RFQContext] Failed to load supplier RFQs from backend:', e);
      }
    })();

    mineInFlightRef.current = run.finally(() => {
      mineInFlightRef.current = null;
    });

    return await mineInFlightRef.current;
  }, []);

  // ✅ Supplier portal: fetch submitted RFQs from backend DB (authoritative)
  React.useEffect(() => {
    void refreshMineFromBackend();
    const onTokenChanged = () => void refreshMineFromBackend();
    window.addEventListener('authTokenChanged', onTokenChanged);
    return () => window.removeEventListener('authTokenChanged', onTokenChanged);
  }, []);

  const addRFQ = (rfq: RFQ) => {
    console.log('📥 添加RFQ:', rfq.rfqNumber);
    setRFQs(prev => [rfq, ...prev]);
    
    // 🔥 触发事件通知所有监听器
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'add', rfqNumber: rfq.rfqNumber } 
    }));
  };

  const updateRFQ = (id: string, updates: Partial<RFQ>) => {
    console.log('🔄 更新RFQ:', id, updates);
    setRFQs(prev => prev.map(rfq => 
      rfq.id === id 
        ? { ...rfq, ...updates, updatedDate: new Date().toISOString() }
        : rfq
    ));
    
    // 🔥 触发事件通知
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'update', rfqId: id } 
    }));
  };

  const deleteRFQ = (id: string) => {
    console.log('🗑️ 删除RFQ:', id);
    setRFQs(prev => prev.filter(rfq => rfq.id !== id));
    
    // 🔥 同时从supplierRFQs中删除（如果存在）
    if (typeof window !== 'undefined') {
      const supplierRFQs = localStorage.getItem('supplierRFQs');
      if (supplierRFQs) {
        try {
          const parsed = JSON.parse(supplierRFQs);
          const filtered = parsed.filter((rfq: any) => rfq.id !== id);
          if (filtered.length < parsed.length) {
            localStorage.setItem('supplierRFQs', JSON.stringify(filtered));
            console.log('🗑️ 同时从supplierRFQs中删除了RFQ:', id);
          }
        } catch (e) {
          console.error('❌ 从supplierRFQs删除失败:', e);
        }
      }
    }
    
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'delete', rfqId: id } 
    }));
  };

  const getRFQById = (id: string) => {
    return rfqs.find(rfq => rfq.id === id);
  };

  const getRFQsByRequirement = (requirementNo: string) => {
    return rfqs.filter(rfq => rfq.requirementNo === requirementNo);
  };

  const getRFQsBySupplier = (supplierCodeOrEmail: string) => {
    // 🔥 支持通过supplierCode或supplierEmail查询
    console.log('🔍 [getRFQsBySupplier] 查询参数:', supplierCodeOrEmail);
    console.log('  - 当前RFQs总数:', rfqs.length);
    
    // 打印所有RFQ的供应商信息
    if (rfqs.length > 0) {
      console.log('  - RFQ列表详情:');
      rfqs.forEach((rfq, idx) => {
        console.log(`    ${idx + 1}. RFQ ID: ${rfq.id}`);
        console.log(`       - supplierCode: ${rfq.supplierCode}`);
        console.log(`       - supplierEmail: ${rfq.supplierEmail}`);
        console.log(`       - supplierName: ${rfq.supplierName}`);
        console.log(`       - supplierRfqNo: ${rfq.supplierRfqNo || '未生成'}`);
        console.log(`       - status: ${rfq.status}`);
      });
    }
    
    const result = rfqs.filter(rfq => 
      rfq.supplierCode === supplierCodeOrEmail || 
      rfq.supplierEmail === supplierCodeOrEmail
    );
    
    console.log(`  - 匹配结果: ${result.length} 个RFQ`);
    
    return result;
  };

  const addQuoteToRFQ = (rfqId: string, quote: RFQQuote) => {
    console.log('💰 添加报价到RFQ:', rfqId, '供应商:', quote.supplierName);
    setRFQs(prev => prev.map(rfq => {
      if (rfq.id === rfqId) {
        const existingQuotes = rfq.quotes || [];
        // 如果该供应商已经报过价，则更新；否则添加
        const updatedQuotes = existingQuotes.some(q => q.supplierCode === quote.supplierCode)
          ? existingQuotes.map(q => q.supplierCode === quote.supplierCode ? quote : q)
          : [...existingQuotes, quote];
        
        return {
          ...rfq,
          quotes: updatedQuotes,
          status: 'quoted' as RFQStatus,
          updatedDate: new Date().toISOString()
        };
      }
      return rfq;
    }));
    
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'quote', rfqId, supplierCode: quote.supplierCode } 
    }));
  };

  return (
    <RFQContext.Provider value={{
      rfqs,
      addRFQ,
      updateRFQ,
      deleteRFQ,
      getRFQById,
      getRFQsByRequirement,
      getRFQsBySupplier,
      addQuoteToRFQ,
      refreshMineFromBackend
    }}>
      {children}
    </RFQContext.Provider>
  );
};

export const useRFQs = () => {
  const context = useContext(RFQContext);
  if (context === undefined) {
    throw new Error('useRFQs must be used within a RFQProvider');
  }
  return context;
};