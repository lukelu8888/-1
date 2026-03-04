import React, { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';
import { apiFetchJson, getApiToken, getBackendUser } from '../api/backend-auth';
import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';

const SUPPLIER_XJ_CLEAR_LOCK_KEY = 'supplier_xj_clear_lock_until';

function isSupplierRfqSyncLocked(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(SUPPLIER_XJ_CLEAR_LOCK_KEY);
  if (!raw) return false;
  const lockUntil = Number(raw);
  if (!Number.isFinite(lockUntil)) {
    localStorage.removeItem(SUPPLIER_XJ_CLEAR_LOCK_KEY);
    return false;
  }
  if (Date.now() > lockUntil) {
    localStorage.removeItem(SUPPLIER_XJ_CLEAR_LOCK_KEY);
    return false;
  }
  return true;
}

// 🔥 采购询价（XJ - 询价）状态
export type XJStatus = 'pending' | 'quoted' | 'accepted' | 'rejected' | 'expired';

// 🔥 产品信息接口
export interface XJProduct {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency: string;
}

// 🔥 采购询价接口
export interface XJ {
  id: string;
  xjNumber: string; // ⚠️ 字段名保留兼容性，实际存储QR采购需求编号（非XJ！）
  
  // 🔥 供应商专属编号（供应商Portal显示）- XJ采购询价
  supplierXjNo?: string; // 采购询价单号 XJ-251218-7184
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
  products?: XJProduct[]; // 产品列表数组
  
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
  status: XJStatus;
  
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
  
  // 🔥 完整的采购询价单文档数据（供供应商Portal显示）
  documentData?: any; // SupplierRFQData 类型
}

export type XJQuote = NonNullable<XJ['quotes']>[number];

interface XJContextType {
  xjs: XJ[];
  addXJ: (xj: XJ) => void;
  updateXJ: (id: string, updates: Partial<XJ>) => void;
  deleteXJ: (id: string) => void;
  getXJById: (id: string) => XJ | undefined;
  getXJsByRequirement: (requirementNo: string) => XJ[];
  getXJsBySupplier: (supplierCodeOrEmail: string) => XJ[];
  addQuoteToXJ: (xjId: string, quote: XJQuote) => void;
  refreshMineFromBackend: (opts?: { force?: boolean }) => Promise<void>;
}

const XJContext = createContext<XJContextType | undefined>(undefined);

const getXJMarkers = (xj: Partial<XJ>): string[] =>
  [xj.id, xj.xjNumber, xj.requirementNo, xj.sourceInquiryNumber].filter(Boolean).map((v) => String(v));

const filterVisibleXJs = (list: XJ[]): XJ[] =>
  filterNotDeleted('inquiry', list, (xj) => getXJMarkers(xj));

export const XJProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 从localStorage加载初始采购询价数据
  const [xjs, setXJs] = useState<XJ[]>(() => {
    if (typeof window !== 'undefined') {
      if (isSupplierRfqSyncLocked()) {
        console.log('🧹 [XJContext] 供应商XJ同步已锁定，初始化为空列表');
        return [];
      }

      // 🔥 合并两个数据源：rfqs（Admin端创建的XJ草稿）+ supplierXJs（Admin提交给供应商的XJ）
      const adminXJs = localStorage.getItem('xjs');
      const supplierXJs = localStorage.getItem('supplierXJs');
      
      let allXJs: XJ[] = [];
      
      // 加载Admin端的rfqs
      if (adminXJs) {
        try {
          const parsed = JSON.parse(adminXJs);
          allXJs = [...parsed];
          console.log('📦 从localStorage加载Admin XJ数据，总数:', parsed.length);
        } catch (e) {
          console.error('❌ 加载Admin XJ数据失败:', e);
        }
      }
      
      // 加载提交给供应商的supplierXJs
      if (supplierXJs) {
        try {
          const parsed = JSON.parse(supplierXJs);
          console.log('📦 从localStorage加载Supplier XJ数据，总数:', parsed.length);
          
          // 🔥 去重：如果id已存在，则跳过（避免重复）
          parsed.forEach((supplierXJ: any) => {
            if (!allXJs.find(xj => xj.id === supplierXJ.id)) {
              allXJs.push(supplierXJ);
            }
          });
        } catch (e) {
          console.error('❌ 加载Supplier XJ数据失败:', e);
        }
      }
      
      const visible = filterVisibleXJs(allXJs);
      console.log('✅ 合并后的总XJ数量:', visible.length);
      return visible;
    }
    return [];
  });

  // 🔥 每次rfqs变化时，自动保存到localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('xjs', JSON.stringify(xjs));
      console.log('💾 XJ已保存到localStorage，总数:', xjs.length);
    }
  }, [xjs]);

  // 🔥 监听supplierXJs的变化（Admin端提交新询价单）
  React.useEffect(() => {
    const handleStorageChange = () => {
      if (isSupplierRfqSyncLocked()) {
        setXJs([]);
        return;
      }

      console.log('🔔 检测到supplierXJs变化，重新加载...');
      
      const supplierXJs = localStorage.getItem('supplierXJs');
      if (supplierXJs) {
        try {
          const parsed = JSON.parse(supplierXJs);
          console.log('📦 重新加载supplierXJs，数量:', parsed.length);
          
          // 🔥 修复：只添加新的XJ，不重新加载所有历史数据
          // 对比当前rfqs中的id，只添加不存在的新XJ
          setXJs(prev => {
            const existingIds = new Set(prev.map(xj => xj.id));
            const newXJs = filterVisibleXJs(parsed).filter((supplierXJ: any) => !existingIds.has(supplierXJ.id));
            
            if (newXJs.length > 0) {
              console.log(`✅ 添加${newXJs.length}个新XJ:`, newXJs.map((r: any) => r.supplierXjNo));
              return [...prev, ...newXJs];
            } else {
              console.log('⏭️ 没有新的XJ需要添加');
              return prev;
            }
          });
        } catch (e) {
          console.error('❌ 重新加载supplierXJs失败:', e);
        }
      }
    };

    // 监听storage事件（跨标签页）
    window.addEventListener('storage', handleStorageChange);
    
    // 🔥 监听自定义事件（同标签页内XJ更新）
    window.addEventListener('supplierXJsUpdated', handleStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('supplierXJsUpdated', handleStorageChange as EventListener);
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
        if (isSupplierRfqSyncLocked()) {
          setXJs([]);
          return;
        }

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

        const data = await apiFetchJson<{ xjs: XJ[] }>('/api/supplier-xjs/mine');
        const serverXJs = filterVisibleXJs((data?.xjs || []).filter(Boolean));

        setXJs(prev => {
          const byId = new Map(prev.map(r => [r.id, r]));
          for (const r of serverXJs) {
            byId.set(r.id, { ...(byId.get(r.id) || {}), ...r });
          }
          return filterVisibleXJs(Array.from(byId.values()));
        });
      } catch (e) {
        console.error('❌ [XJContext] Failed to load supplier XJ from backend:', e);
      }
    })();

    mineInFlightRef.current = run.finally(() => {
      mineInFlightRef.current = null;
    });

    return await mineInFlightRef.current;
  }, []);

  // ✅ Supplier portal: fetch submitted XJ (采购询价) from backend DB (authoritative)
  React.useEffect(() => {
    void refreshMineFromBackend();
    const onTokenChanged = () => void refreshMineFromBackend();
    window.addEventListener('authTokenChanged', onTokenChanged);
    return () => window.removeEventListener('authTokenChanged', onTokenChanged);
  }, []);

  const addXJ = (xj: XJ) => {
    console.log('📥 添加XJ:', xj.xjNumber);
    setXJs(prev => filterVisibleXJs([xj, ...prev]));
    
    // 🔥 触发事件通知所有监听器
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'add', xjNumber: xj.xjNumber } 
    }));
  };

  const updateXJ = (id: string, updates: Partial<XJ>) => {
    console.log('🔄 更新XJ:', id, updates);
    setXJs(prev => prev.map(xj => 
      xj.id === id 
        ? { ...xj, ...updates, updatedDate: new Date().toISOString() }
        : xj
    ));
    
    // 🔥 触发事件通知
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'update', rfqId: id } 
    }));
  };

  const deleteXJ = (id: string) => {
    console.log('🗑️ 删除XJ:', id);
    const target = xjs.find((r) => r.id === id);
    const markers = getXJMarkers(target || { id });
    addTombstones('inquiry', markers, {
      reason: 'manual-delete-xj',
      deletedBy: getBackendUser()?.email || 'unknown',
    });
    setXJs(prev => filterVisibleXJs(prev.filter(xj => xj.id !== id)));
    
    // 🔥 同时从supplierXJs中删除（如果存在）
    if (typeof window !== 'undefined') {
      const supplierXJs = localStorage.getItem('supplierXJs');
      if (supplierXJs) {
        try {
          const parsed = JSON.parse(supplierXJs);
          const filtered = parsed.filter((xj: any) => xj.id !== id);
          if (filtered.length < parsed.length) {
            localStorage.setItem('supplierXJs', JSON.stringify(filtered));
            console.log('🗑️ 同时从supplierXJs中删除了XJ:', id);
          }
        } catch (e) {
          console.error('❌ 从supplierXJs删除失败:', e);
        }
      }
    }
    
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'delete', rfqId: id } 
    }));
  };

  const getXJById = (id: string) => {
    return xjs.find(xj => xj.id === id);
  };

  const getXJsByRequirement = (requirementNo: string) => {
    return xjs.filter(xj => xj.requirementNo === requirementNo);
  };

  const getXJsBySupplier = (supplierCodeOrEmail: string) => {
    // 🔥 支持通过supplierCode或supplierEmail查询XJ
    console.log('🔍 [getRFQsBySupplier] 查询参数:', supplierCodeOrEmail);
    console.log('  - 当前XJs总数:', xjs.length);
    
    // 打印所有XJ的供应商信息
    if (xjs.length > 0) {
      console.log('  - XJ列表详情:');
      xjs.forEach((xj, idx) => {
        console.log(`    ${idx + 1}. XJ ID: ${xj.id}`);
        console.log(`       - supplierCode: ${xj.supplierCode}`);
        console.log(`       - supplierEmail: ${xj.supplierEmail}`);
        console.log(`       - supplierName: ${xj.supplierName}`);
        console.log(`       - supplierXjNo: ${xj.supplierXjNo || '未生成'}`);
        console.log(`       - status: ${xj.status}`);
      });
    }
    
    const result = xjs.filter(xj => 
      xj.supplierCode === supplierCodeOrEmail || 
      xj.supplierEmail === supplierCodeOrEmail
    );
    
    console.log(`  - 匹配结果: ${result.length} 个XJ`);
    
    return result;
  };

  const addQuoteToXJ = (xjId: string, quote: XJQuote) => {
    console.log('💰 添加报价到XJ:', rfqId, '供应商:', quote.supplierName);
    setXJs(prev => prev.map(xj => {
      if (xj.id === xjId) {
        const existingQuotes = xj.quotes || [];
        // 如果该供应商已经报过价，则更新；否则添加
        const updatedQuotes = existingQuotes.some(q => q.supplierCode === quote.supplierCode)
          ? existingQuotes.map(q => q.supplierCode === quote.supplierCode ? quote : q)
          : [...existingQuotes, quote];
        
        return {
          ...xj,
          quotes: updatedQuotes,
          status: 'quoted' as XJStatus,
          updatedDate: new Date().toISOString()
        };
      }
      return xj;
    }));
    
    window.dispatchEvent(new CustomEvent('rfqsUpdated', { 
      detail: { action: 'quote', rfqId, supplierCode: quote.supplierCode } 
    }));
  };

  return (
    <XJContext.Provider value={{
      xjs,
      addRFQ,
      updateRFQ,
      deleteRFQ,
      getRFQById,
      getRFQsByRequirement,
      getRFQsBySupplier,
      addQuoteToXJ,
      refreshMineFromBackend
    }}>
      {children}
    </XJContext.Provider>
  );
};

export const useXJs = () => {
  const context = useContext(XJContext);
  if (context === undefined) {
    throw new Error('useXJs must be used within a XJProvider');
  }
  return context;
};
