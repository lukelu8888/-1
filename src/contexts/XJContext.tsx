import React, { createContext, useCallback, useContext, useRef, useState, ReactNode, useEffect } from 'react';
import { xjService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

// 🔥 采购询价（XJ - 询价）状态
export type XJStatus = 'pending' | 'sent' | 'quoted' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed';

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
  xjNumber: string;

  supplierXjNo?: string;
  supplierQuotationNo?: string;

  sourceQRNumber?: string;

  sourceInquiryId?: string;
  sourceInquiryNumber?: string;
  customerName?: string;
  customerRegion?: string;

  requirementNo?: string;
  sourceRef?: string;

  products?: XJProduct[];

  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency?: string;

  supplierCode: string;
  supplierName: string;
  supplierContact?: string;
  supplierEmail: string;

  expectedDate: string;
  quotationDeadline?: string;
  dueDate?: string;
  priority?: string;

  status: XJStatus;

  remarks?: string;
  createdBy: string;
  createdDate: string;
  updatedDate?: string;

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

  documentData?: any;
}

export type XJQuote = NonNullable<XJ['quotes']>[number];

interface XJContextType {
  xjs: XJ[];
  loading: boolean;
  addXJ: (xj: XJ) => Promise<void>;
  updateXJ: (id: string, updates: Partial<XJ>) => Promise<void>;
  deleteXJ: (id: string) => Promise<void>;
  getXJById: (id: string) => XJ | undefined;
  getXJsByRequirement: (requirementNo: string) => XJ[];
  getXJsBySupplier: (supplierCodeOrEmail: string) => XJ[];
  addQuoteToXJ: (xjId: string, quote: XJQuote) => Promise<void>;
  refreshMineFromBackend: (opts?: { force?: boolean }) => Promise<void>;
}

const XJContext = createContext<XJContextType | undefined>(undefined);

export const XJProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [xjs, setXJs] = useState<XJ[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromSupabase = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const data = await xjService.getAll();
      if (data && Array.isArray(data)) {
        setXJs(data.filter(Boolean) as XJ[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载 & 监听 Auth 状态
  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void loadFromSupabase();
      else if (event === 'SIGNED_OUT') setXJs([]);
    });

    return () => { subscription.unsubscribe(); };
  }, [loadFromSupabase]);

  // Supabase Realtime 订阅 — 收到变更后重新拉取全量数据（确保 fromXJRow 转换正确）
  useEffect(() => {
    const channel = supabase
      .channel('supplier_xjs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'supplier_xjs' }, () => {
        void loadFromSupabase();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [loadFromSupabase]);

  const addXJ = async (xj: XJ) => {
    const saved = await xjService.upsert(xj);
    if (saved) {
      setXJs(prev => [saved as XJ, ...prev]);
    } else {
      setXJs(prev => [xj, ...prev]);
    }
  };

  const updateXJ = async (id: string, updates: Partial<XJ>) => {
    const current = xjs.find(x => x.id === id);
    const merged = { ...current, ...updates, updatedDate: new Date().toISOString() } as XJ;
    const saved = await xjService.upsert(merged);
    setXJs(prev => prev.map(x => x.id === id ? (saved as XJ || merged) : x));
  };

  const deleteXJ = async (id: string) => {
    await xjService.delete(id);
    setXJs(prev => prev.filter(x => x.id !== id));
  };

  const getXJById = (id: string) => xjs.find(x => x.id === id);

  const getXJsByRequirement = (requirementNo: string) =>
    xjs.filter(x => x.requirementNo === requirementNo);

  const getXJsBySupplier = (supplierCodeOrEmail: string) =>
    xjs.filter(x =>
      x.supplierCode === supplierCodeOrEmail ||
      x.supplierEmail === supplierCodeOrEmail
    );

  const addQuoteToXJ = async (xjId: string, quote: XJQuote) => {
    const current = xjs.find(x => x.id === xjId);
    if (!current) return;
    const updated: XJ = {
      ...current,
      quotes: [...(current.quotes || []), quote],
      status: 'quoted' as XJStatus,
      updatedDate: new Date().toISOString(),
    };
    await updateXJ(xjId, updated);
  };

  // 供应商 Portal 兼容：从 Supabase 重新拉取（替代旧的 Backend API）
  const mineInFlightRef = useRef<Promise<void> | null>(null);
  const mineLastFetchedAtRef = useRef<number>(0);

  const refreshMineFromBackend = useCallback(async (opts?: { force?: boolean }) => {
    const force = Boolean(opts?.force);
    if (mineInFlightRef.current && !force) return await mineInFlightRef.current;
    const now = Date.now();
    if (!force && now - mineLastFetchedAtRef.current < 2000) return;

    const run = (async () => {
      try {
        mineLastFetchedAtRef.current = Date.now();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.email) return;
        const data = await xjService.getByEmail(session.user.email);
        if (data && Array.isArray(data)) {
          setXJs(prev => {
            const byId = new Map(prev.map(r => [r.id, r]));
            for (const r of data.filter(Boolean) as XJ[]) {
              byId.set(r.id, { ...(byId.get(r.id) || {}), ...r });
            }
            return Array.from(byId.values());
          });
        }
      } catch (e) {
        console.error('❌ [XJContext] refreshMineFromBackend failed:', e);
      }
    })();

    mineInFlightRef.current = run.finally(() => { mineInFlightRef.current = null; });
    return await mineInFlightRef.current;
  }, []);

  return (
    <XJContext.Provider value={{
      xjs,
      loading,
      addXJ,
      updateXJ,
      deleteXJ,
      getXJById,
      getXJsByRequirement,
      getXJsBySupplier,
      addQuoteToXJ,
      refreshMineFromBackend,
    }}>
      {children}
    </XJContext.Provider>
  );
};

export const useXJ = () => {
  const context = useContext(XJContext);
  if (context === undefined) {
    throw new Error('useXJ must be used within an XJProvider');
  }
  return context;
};

// 兼容旧的 hook 名
export const useXJs = useXJ;
