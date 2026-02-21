import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetchJson } from '../api/backend-auth';

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

export const PurchaseRequirementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 🔥 从localStorage加载初始数据，保留用户创建的所有采购需求
  const [requirements, setRequirements] = useState<PurchaseRequirement[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('purchaseRequirements');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // 🔥 修复：不要清空所有数据，而是过滤掉有问题的记录并尝试修复
          const validRequirements = parsed.map((req: any) => {
            // 如果缺少customer字段，尝试从其他地方获取或使用默认值
            if (!req.customer) {
              console.warn('⚠️ QR缺少customer字段，使用默认值:', req.requirementNo);
              req.customer = {
                companyName: 'Unknown Customer',
                contactPerson: 'N/A',
                email: 'unknown@example.com',
                phone: 'N/A',
                address: 'N/A'
              };
            }
            
            // 如果items为空或格式不正确，尝试修复
            if (!req.items || req.items.length === 0) {
              console.warn('⚠️ QR的items为空:', req.requirementNo);
              // 保留这个QR，但标记items为空
            }
            
            return req;
          });
          
          console.log('✅ 从localStorage加载采购需求数据，总数:', validRequirements.length);
          return validRequirements;
        } catch (e) {
          console.error('❌ 加载采购需求数据失败:', e);
          // 不要返回空数组，保持localStorage中的原始数据
          console.error('⚠️ 保留localStorage中的原始数据，不进行清空');
          return [];
        }
      }
    }
    
    // 如果没有保存的数据，返回空数组
    console.log('📋 初始化采购需求为空数组');
    return [];
  });

  // 🔥 修复：添加标志区分"初始化"和"后续更新"，防止首次渲染覆盖localStorage
  const [isInitialized, setIsInitialized] = React.useState(false);

  // 🔥 业务员/采购员：从服务端拉取采购需求并合并（含采购接受的报价→purchaserFeedback），保证看到成本价与建议
  useEffect(() => {
    let cancelled = false;
    apiFetchJson<{ requirements: PurchaseRequirement[] }>('/api/purchase-requirements')
      .then((data) => {
        if (cancelled || !data?.requirements?.length) return;
        const apiList = data.requirements as PurchaseRequirement[];
        setRequirements((prev) => {
          const byNo = new Map<string, PurchaseRequirement>();
          prev.forEach((r) => {
            const key = r.requirementNo || r.id;
            if (key) byNo.set(key, r);
          });
          apiList.forEach((apiR) => {
            const key = apiR.requirementNo || apiR.id;
            if (key) byNo.set(key, apiR);
          });
          return Array.from(byNo.values());
        });
      })
      .catch(() => { /* 未登录或网络错误时保留本地数据 */ });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    // 首次渲染时标记为已初始化，但不保存数据
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }
    
    // 🔥 只在非初始化状态下保存数据
    if (typeof window !== 'undefined') {
      localStorage.setItem('purchaseRequirements', JSON.stringify(requirements));
      console.log('💾 采购需求已保存到localStorage，总数:', requirements.length);
    }
  }, [requirements, isInitialized]);

  const addRequirement = (requirement: PurchaseRequirement) => {
    console.log('➕ 添加新采购需求:', requirement);
    setRequirements(prev => {
      const newRequirements = [...prev, requirement];
      console.log('  ✅ 当前采购需求总数:', newRequirements.length);
      return newRequirements;
    });
  };

  const updateRequirement = (id: string, updates: Partial<PurchaseRequirement>) => {
    console.log('🔄 [PurchaseRequirementContext] 更新采购需求:', {
      id,
      updates,
      updateKeys: Object.keys(updates)
    });
    
    setRequirements(prev => {
      const targetReq = prev.find(req => req.id === id);
      if (!targetReq) {
        console.error('❌ [PurchaseRequirementContext] 未找到要更新的需求:', id);
        return prev;
      }
      
      console.log('  ✅ 找到目标需求:', {
        requirementNo: targetReq.requirementNo,
        currentStatus: targetReq.status,
        newStatus: updates.status,
        createdBy: targetReq.createdBy
      });
      
      const newReqs = prev.map(req => req.id === id ? { ...req, ...updates } : req);
      console.log('  💾 更新后的需求列表数量:', newReqs.length);
      return newReqs;
    });
  };

  const deleteRequirement = (id: string) => {
    console.warn('🗑️ [PurchaseRequirementContext] 删除采购需求:', id);
    
    setRequirements(prev => {
      const targetReq = prev.find(req => req.id === id);
      if (targetReq) {
        console.warn('  ⚠️ 即将删除:', {
          requirementNo: targetReq.requirementNo,
          createdBy: targetReq.createdBy,
          status: targetReq.status,
          itemCount: targetReq.items?.length
        });
      }
      
      const newReqs = prev.filter(req => req.id !== id);
      console.warn('  📊 删除后剩余需求数量:', newReqs.length);
      return newReqs;
    });
  };

  const getRequirementById = (id: string) => {
    return requirements.find(req => req.id === id);
  };

  const refreshPurchaseRequirementsFromApi = React.useCallback(async () => {
    try {
      const data = await apiFetchJson<{ requirements: PurchaseRequirement[] }>('/api/purchase-requirements');
      const apiList = (data?.requirements ?? []) as PurchaseRequirement[];
      setRequirements((prev) => {
        const byNo = new Map<string, PurchaseRequirement>();
        prev.forEach((r) => {
          const key = r.requirementNo || r.id;
          if (key) byNo.set(key, r);
        });
        apiList.forEach((apiR) => {
          const key = apiR.requirementNo || apiR.id;
          if (key) byNo.set(key, apiR);
        });
        return Array.from(byNo.values());
      });
    } catch {
      // 未登录或网络错误时静默失败，由调用方 toast
    }
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