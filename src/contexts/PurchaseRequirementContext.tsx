import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { purchaseRequirementService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import type { PricingTaxSettings, SourcePricingBasis } from '../types/pricingBasis';


// 🔥 采购需求产品项接口
export interface PurchaseRequirementItem {
  id: string;
  productName: string;
  modelNo: string;
  specification?: string;
  quantity: number;
  unit: string;
  hsCode?: string;
  packingRequirement?: string;
  targetPrice?: number;
  targetCurrency?: string;
  imageUrl?: string; // 🔥 产品图片
  remarks?: string;
}

// 🔥 采购反馈产品接口
export interface PurchaserFeedbackProduct {
  productId: string; // 对应QR中的产品ID
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  costPrice: number; // 成本单价（核心字段）
  currency: string; // 货币（CNY/USD/EUR）
  // 🔥 价格属性（随供应商报价全程传递，决定下游核算逻辑）
  priceType?: 'usd' | 'cny_with_tax' | 'cny_no_tax'; // 供货单价类型
  quoteMode?: string;     // 供应商报价模式（EXW_CNY/FOB_CNY/FOB_USD/CIF_USD）
  taxSettings?: PricingTaxSettings; // 供应商报价时的税务参数
  sourcePricing?: SourcePricingBasis; // 上游 BJ 的价格基准，不允许下游再猜
  amount: number; // 总成本 = costPrice × quantity
  moq?: number; // 最小起订量
  leadTime?: string; // 交货期（如："30天"）
  remarks?: string; // 产品备注
}

// 🔥 采购反馈接口（采购员反馈给业务员的脱敏成本信息）
export interface PurchaserFeedback {
  status: 'pending' | 'quoted' | 'rejected'; // 待反馈 | 已报价 | 已拒绝
  feedbackDate?: string; // 反馈时间
  feedbackBy?: string; // 反馈人（采购员姓名）
  
  // 🔥 关联的BJ单号（仅采购员可见，业务员看不到）
  linkedBJ?: string; // 如：BJ-251221-3762
  linkedSupplier?: string; // 供应商名称（仅采购员可见）
  linkedXJ?: string; // 关联的XJ询价单号
  
  // 🔥 给业务员的成本信息（脱敏）
  products: PurchaserFeedbackProduct[];
  
  // 商务条款（脱敏）
  paymentTerms?: string; // 付款方式
  deliveryTerms?: string; // 交货条款
  packaging?: string; // 包装方式
  warranty?: string; // 质保期
  
  // 🔥 采购员专业建议（给业务员的指导）
  purchaserRemarks?: string;
  
  // 成本分析（可选）
  suggestedMargin?: number; // 建议利润率（如：30表示30%）
  riskLevel?: 'low' | 'medium' | 'high'; // 风险评估
}

// 采购需求接口 - 重构为包含多个产品项
export interface PurchaseRequirement {
  id: string;
  requirementNo: string;
  source: string; // '销售订单' | '库存预警' | '战略备货'
  sourceRef?: string; // 来源单号（如销售订单号）
  sourceInquiryNumber?: string; // 🔥 新增：关联客户询价单编号 INQ-xxx
  requiredDate: string;
  urgency: 'high' | 'medium' | 'low';
  status: 'pending' | 'partial' | 'processing' | 'completed'; // 🔥 新增 'partial' 部分提交状态
  createdBy: string; // 创建人
  createdDate: string;
  specialRequirements?: string; // 特殊要求
  region?: string; // 🔥 客户来源区域（NA/SA/EA）- 用于市场区分
  // 销售订单相关信息
  salesOrderNo?: string;
  // 🔥 客户信息 - 业务员端需要此信息用于创建销售报价
  // 注意：采购员角色不应看到此信息（通过RBAC权限控制）
  customer?: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    mobile?: string;
    address: string;
    website?: string;
    businessType?: string;
  };
  // 🔥 产品清单 - 一个需求可以包含多个产品
  items: PurchaseRequirementItem[];
  
  // 🔥 采购反馈模块（采购员反馈给业务员）
  purchaserFeedback?: PurchaserFeedback;
  
  // 🔥 新增：是否已下推到报价管理（业务员报价管理模块标记）
  pushedToQuotation?: boolean;
  pushedToQuotationDate?: string; // 下推时间
  pushedBy?: string; // 下推操作人
}

interface PurchaseRequirementContextType {
  requirements: PurchaseRequirement[];
  addRequirement: (requirement: PurchaseRequirement) => void;
  updateRequirement: (id: string, updates: Partial<PurchaseRequirement>) => void;
  deleteRequirement: (id: string) => void;
  getRequirementById: (id: string) => PurchaseRequirement | undefined;
  /** 从服务端刷新采购需求（含采购员接受报价后的 purchaserFeedback），业务员点「刷新」后可看到最新采购反馈 */
  refreshPurchaseRequirementsFromApi: () => Promise<void>;
}

const PurchaseRequirementContext = createContext<PurchaseRequirementContextType | undefined>(undefined);
const DELETED_PURCHASE_REQUIREMENTS_KEY = 'deleted_purchase_requirements';

const getDeletedRequirementMarkers = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(DELETED_PURCHASE_REQUIREMENTS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(Boolean).map((v) => String(v)));
  } catch {
    return new Set();
  }
};

const saveDeletedRequirementMarkers = (markers: Set<string>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DELETED_PURCHASE_REQUIREMENTS_KEY, JSON.stringify(Array.from(markers)));
};

const getRequirementMarkers = (req: Partial<PurchaseRequirement>): string[] => {
  return [req.id, req.requirementNo].filter(Boolean).map((v) => String(v));
};

const filterVisibleRequirements = (list: PurchaseRequirement[]): PurchaseRequirement[] =>
  filterNotDeleted('document', list, (req) => getRequirementMarkers(req));

export const PurchaseRequirementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requirements, setRequirements] = useState<PurchaseRequirement[]>([]);

  // Supabase-first: 从 purchase_requirements 表加载
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = await purchaseRequirementService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      setRequirements(rows.filter(Boolean) as PurchaseRequirement[]);
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setRequirements([]);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);


  const addRequirement = (requirement: PurchaseRequirement) => {
    setRequirements(prev => {
      const exists = prev.some(r => r.id === requirement.id);
      return exists ? prev : [...prev, requirement];
    });
    purchaseRequirementService.upsert(requirement).catch((e) => console.warn('⚠️ PR upsert failed:', e));
  };

  const updateRequirement = (id: string, updates: Partial<PurchaseRequirement>) => {
    setRequirements(prev => {
      const next = prev.map(req => req.id === id ? { ...req, ...updates } : req);
      const updated = next.find(r => r.id === id);
      if (updated) purchaseRequirementService.upsert(updated).catch(() => {});
      return next;
    });
  };

  const deleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(req => req.id !== id));
    purchaseRequirementService.delete(id).catch(() => {});
  };

  const getRequirementById = (id: string) => {
    return requirements.find(req => req.id === id);
  };

  const refreshPurchaseRequirementsFromApi = React.useCallback(async () => {
    try {
      const rows = await purchaseRequirementService.getAll();
      if (Array.isArray(rows)) setRequirements(rows.filter(Boolean) as PurchaseRequirement[]);
    } catch { /* 静默失败 */ }
  }, []);

  return (
    <PurchaseRequirementContext.Provider
      value={{
        requirements,
        addRequirement,
        updateRequirement,
        deleteRequirement,
        getRequirementById,
        refreshPurchaseRequirementsFromApi
      }}
    >
      {children}
    </PurchaseRequirementContext.Provider>
  );
};

export const usePurchaseRequirements = () => {
  const context = useContext(PurchaseRequirementContext);
  if (context === undefined) {
    throw new Error('usePurchaseRequirements must be used within a PurchaseRequirementProvider');
  }
  return context;
};
