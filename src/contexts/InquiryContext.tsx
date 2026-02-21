import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import type { RegionType } from '../utils/rfqNumberGenerator';
import { executeCustomerInquiry, executeSystemDistribute, updateWorkflowState, WorkflowContext } from '../utils/workflowEngineV2';
import { getCurrentUser } from '../utils/dataIsolation'; // 🔥 新增：导入获取当前用户
import { apiFetchJson, getApiToken, getBackendUser } from '../api/backend-auth';

export interface Inquiry {
  id: string;
  inquiryNumber?: string; // 🔥 新增：INQ-{REGION}-YYMMDD-XXXX
  date: string;
  userEmail: string;
  companyId?: string; // 🆕 Company ID for multi-user support
  products: CartItem[];
  status: 'draft' | 'pending' | 'quoted' | 'approved' | 'rejected'; // 🔥 添加 draft 状态
  isSubmitted: boolean; // 🚀 New field: true = submitted to admin, false = draft
  totalPrice: number;
  region?: RegionType; // 🌍 Customer region
  buyerInfo?: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    mobile?: string; // 🆕 Add mobile field
    address: string;
    website?: string;
    businessType?: string;
  };
  shippingInfo: {
    cartons: string;
    cbm: string;
    totalGrossWeight: string;
    totalNetWeight: string;
  };
  containerInfo?: {
    planningMode: 'automatic' | 'custom';
    recommendedContainer?: string;
    customContainers?: any[];
  };
  message?: string;
  createdAt: number;
  submittedAt?: number; // 🚀 Timestamp when submitted
}

interface InquiryContextType {
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => Promise<void>;
  getUserInquiries: (email: string) => Inquiry[];
  getCompanyInquiries: (companyId: string) => Inquiry[]; // 🆕 Get inquiries by company ID
  updateInquiryStatus: (id: string, status: Inquiry['status']) => void;
  updateInquiry: (id: string, updatedInquiry: Partial<Inquiry>) => void;
  deleteInquiry: (id: string) => void; // 🗑️ Add delete method
  submitInquiry: (id: string) => void; // 🚀 Submit inquiry to admin
  getSubmittedInquiries: () => Inquiry[]; // 🚀 Get all submitted inquiries (for Admin)
  getInquiriesByRegion: (region: RegionType) => Inquiry[]; // 🌍 Get inquiries by region
  refreshInquiries: () => Promise<void>; // 🔄 Load from database
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);

export function InquiryProvider({ children }: { children: ReactNode }) {
  // Load inquiries from localStorage
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cosun_inquiries');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse inquiries:', e);
          return [];
        }
      }
    }
    return [];
  });

  // Save to localStorage whenever inquiries change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 🔒 Primary save
      localStorage.setItem('cosun_inquiries', JSON.stringify(inquiries));
      
      // 🔒 Backup save with timestamp - for data recovery
      const backup = {
        data: inquiries,
        timestamp: Date.now(),
        count: inquiries.length
      };
      localStorage.setItem('cosun_inquiries_backup', JSON.stringify(backup));
      
      console.log(`💾 Inquiry data saved: ${inquiries.length} inquiries`);
    }
  }, [inquiries]);

  // 🔄 Load inquiries from backend DB after login
  const refreshInquiries = async () => {
    const token = getApiToken();
    if (!token) {
      console.log('⚠️ [InquiryContext] No token, skip refreshInquiries');
      return;
    }

    const backendUser = getBackendUser();
    const currentUser = getCurrentUser();
    
    console.log('🔍 [InquiryContext] refreshInquiries - Debug:', {
      hasToken: !!token,
      backendUser: backendUser ? { portal_role: backendUser.portal_role, email: backendUser.email } : null,
      currentUser: currentUser ? { role: currentUser.role, email: currentUser.email, type: currentUser.type } : null,
    });
    
    // Admin portal users (admin portal_role OR internal staff rbac_role) should use admin endpoint
    const isAdminPortal = backendUser?.portal_role === 'admin';
    const isInternalStaff = currentUser?.role && [
      'Sales_Rep', 'Regional_Manager', 'Sales_Manager', 'Sales_Director',
      'CEO', 'CFO', 'Finance', 'Procurement', 'Admin', 'Marketing_Ops', 'Documentation_Officer'
    ].includes(currentUser.role);
    
    const endpoint = (isAdminPortal || isInternalStaff) ? '/api/admin/inquiries' : '/api/inquiries';
    console.log('🔄 [InquiryContext] refreshInquiries - Will call:', { isAdminPortal, isInternalStaff, endpoint, role: currentUser?.role });

    try {
      const data = await apiFetchJson<{ inquiries: Inquiry[] }>(endpoint);
      console.log('✅ [InquiryContext] Fetched from API:', data?.inquiries?.length || 0, 'inquiries');

      // Merge strategy: keep local drafts, prefer server data for submitted inquiries (by id)
      setInquiries(prev => {
        const localDrafts = prev.filter(i => i && i.isSubmitted === false);
        const server = (data?.inquiries || []).filter(Boolean);

        const seen = new Set<string>();
        const merged: Inquiry[] = [];

        // First: add all server inquiries (authoritative for submitted ones)
        for (const s of server) {
          if (!s?.id) continue;
          seen.add(s.id);
          merged.push(s);
        }
        
        // Then: add local drafts that aren't on server
        for (const d of localDrafts) {
          if (!d?.id) continue;
          if (seen.has(d.id)) continue;
          merged.push(d);
        }
        
        // Finally: keep local submitted inquiries that server didn't return (fallback for offline/old data)
        const localSubmitted = prev.filter(i => i && i.isSubmitted === true);
        for (const ls of localSubmitted) {
          if (!ls?.id) continue;
          if (seen.has(ls.id)) continue;
          merged.push(ls); // Keep old submitted inquiries as fallback
        }

        console.log('📊 [InquiryContext] Merged:', {
          server: server.length,
          localDrafts: localDrafts.length,
          localSubmitted: localSubmitted.length,
          total: merged.length
        });

        return merged;
      });
    } catch (err) {
      console.error('❌ [InquiryContext] Failed to refresh from API:', err);
      // Don't clear existing data on error - keep localStorage data
    }
  };

  useEffect(() => {
    const run = () => {
      void refreshInquiries().catch(err => {
        console.error('❌ Failed to load inquiries from backend:', err);
      });
    };

    // initial best-effort refresh
    run();

    // refresh after login/logout token changes (same tab)
    const handleToken = () => run();
    window.addEventListener('authTokenChanged', handleToken as EventListener);

    return () => {
      window.removeEventListener('authTokenChanged', handleToken as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addInquiry = async (inquiry: Inquiry) => {
    console.log('🔵 InquiryContext: addInquiry 被调用');
    console.log('📝 添加的询价数据:', inquiry);
    console.log('📧 用户邮箱:', inquiry.userEmail);
    console.log('📋 询价状态:', inquiry.status, '| 是否已提交:', inquiry.isSubmitted);
    
    setInquiries(prev => {
      const updated = [inquiry, ...prev];
      console.log('✅ 更新后的询价列表:', updated);
      
      // 🔥 立即保存到 localStorage（不等待 useEffect）
      if (typeof window !== 'undefined') {
        localStorage.setItem('cosun_inquiries', JSON.stringify(updated));
        console.log('💾 立即保存到 localStorage:', localStorage.getItem('cosun_inquiries'));
      }
      
      return updated;
    });

    // 🔄 只有在询价单已提交时才启动工作流引擎
    if (inquiry.isSubmitted) {
      console.log('🔄 询价单已提交，启动工作流引擎...');
      try {
        // 构建工作流上下文
        const workflowContext: WorkflowContext = {
          inquiry_number: inquiry.id,
          customer_name: inquiry.buyerInfo?.companyName || 'N/A',
          customer_contact: inquiry.buyerInfo?.contactPerson || 'N/A',
          customer_email: inquiry.buyerInfo?.email || inquiry.userEmail,
          product_count: inquiry.products.length,
          total_amount: inquiry.totalPrice,
          shipping_address: inquiry.buyerInfo?.address || 'N/A',
          submission_date: inquiry.date,
          urgency_level: 'normal',
          expected_response_time: '48 hours',
        };

        console.log('📋 工作流上下文:', workflowContext);

        // 步骤 1.1: 客户提交询价单 (带状态追踪)
        await updateWorkflowState(inquiry.id, 'customer_inquiry', workflowContext);
        console.log('✅ 步骤 1.1 完成并已保存状态');

        // 步骤 1.2: 系统自动分发询价单 (带状态追踪)
        await updateWorkflowState(inquiry.id, 'system_distribute_inquiry', workflowContext);
        console.log('✅ 步骤 1.2 完成并已保存状态');

        console.log('🎉 工作流引擎启动成功！询价单已进入5阶段21步骤流程');
      } catch (error) {
        console.error('❌ 工作流引擎执行错误:', error);
      }
    } else {
      console.log('📝 询价单为草稿状态，暂不启动工作流引擎');
    }
  };

  const getUserInquiries = (email: string) => {
    const target = (email || '').trim().toLowerCase();
    if (!target) return [];

    return inquiries.filter((inq) => {
      const a = (inq?.userEmail || '').trim().toLowerCase();
      const b = (inq?.buyerInfo?.email || '').trim().toLowerCase();
      return a === target || b === target;
    });
  };

  const getCompanyInquiries = (companyId: string) => {
    return inquiries.filter(inq => inq.companyId === companyId);
  };

  const updateInquiryStatus = (id: string, status: Inquiry['status']) => {
    // If admin, persist status to DB (best effort)
    const backendUser = getBackendUser();
    if (backendUser?.portal_role === 'admin' && getApiToken()) {
      void apiFetchJson<{ inquiry: Inquiry }>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).catch(err => console.error('❌ Failed to update inquiry status:', err));
    }

    setInquiries(prev =>
      prev.map(inq =>
        inq.id === id ? { ...inq, status } : inq
      )
    );
  };

  const updateInquiry = (id: string, updatedInquiry: Partial<Inquiry>) => {
    // If admin, persist basic fields to DB (best effort)
    const backendUser = getBackendUser();
    if (backendUser?.portal_role === 'admin' && getApiToken()) {
      const patch: any = {};
      if (typeof (updatedInquiry as any).status === 'string') patch.status = (updatedInquiry as any).status;
      if ('message' in updatedInquiry) patch.message = (updatedInquiry as any).message;
      if (Object.keys(patch).length > 0) {
        void apiFetchJson<{ inquiry: Inquiry }>(`/api/admin/inquiries/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(err => console.error('❌ Failed to update inquiry:', err));
      }
    }

    setInquiries(prev =>
      prev.map(inq =>
        inq.id === id ? { ...inq, ...updatedInquiry } : inq
      )
    );
  };

  const deleteInquiry = (id: string) => {
    // If admin, delete from DB (best effort)
    const backendUser = getBackendUser();
    if (backendUser?.portal_role === 'admin' && getApiToken()) {
      void apiFetchJson(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch(err => console.error('❌ Failed to delete inquiry:', err));
    }

    setInquiries(prev =>
      prev.filter(inq =>
        inq.id !== id
      )
    );
  };

  // 🚀 Submit inquiry - change isSubmitted to true
  const submitInquiry = async (id: string) => {
    const inquiry = inquiries.find(inq => inq.id === id);
    
    setInquiries(prev =>
      prev.map(inq =>
        inq.id === id 
          ? { 
              ...inq, 
              isSubmitted: true, 
              status: 'pending', // 🔥 提交时状态从 draft 变为 pending
              submittedAt: Date.now() 
            } 
          : inq
      )
    );

    // 🔄 如果这是首次提交，启动工作流
    if (inquiry && !inquiry.isSubmitted) {
      console.log('🔄 询价单提交，启动工作流引擎...');
      try {
        const workflowContext: WorkflowContext = {
          inquiry_number: inquiry.id,
          customer_name: inquiry.buyerInfo?.companyName || 'N/A',
          customer_contact: inquiry.buyerInfo?.contactPerson || 'N/A',
          customer_email: inquiry.buyerInfo?.email || inquiry.userEmail,
          product_count: inquiry.products.length,
          total_amount: inquiry.totalPrice,
          shipping_address: inquiry.buyerInfo?.address || 'N/A',
          submission_date: inquiry.date,
          urgency_level: 'normal',
          expected_response_time: '48 hours',
        };

        // 步骤 1.1: 客户提交询价单 (带状态追踪)
        await updateWorkflowState(inquiry.id, 'customer_inquiry', workflowContext);
        // 步骤 1.2: 系统自动分发询价单 (带状态追踪)
        await updateWorkflowState(inquiry.id, 'system_distribute_inquiry', workflowContext);

        console.log('✅ 工作流引擎已启动');
      } catch (error) {
        console.error('❌ 工作流引擎执行错误:', error);
      }
    }
  };

  // Helper: normalize region for matching (supports both codes and full names)
  const normalizeRegionForMatch = (r: string | null | undefined): string[] => {
    if (!r) return [];
    const s = String(r).trim();
    if (!s || s === 'all') return [];
    
    const variants = [s];
    const map: Record<string, string[]> = {
      'NA': ['North America', 'north-america'],
      'North America': ['NA', 'north-america'],
      'north-america': ['NA', 'North America'],
      'SA': ['South America', 'south-america'],
      'South America': ['SA', 'south-america'],
      'south-america': ['SA', 'South America'],
      'EA': ['Europe & Africa', 'EMEA', 'europe-africa'],
      'EMEA': ['Europe & Africa', 'EA', 'europe-africa'],
      'Europe & Africa': ['EA', 'EMEA', 'europe-africa'],
      'europe-africa': ['EA', 'EMEA', 'Europe & Africa'],
    };
    
    const mapped = map[s] || [];
    return [...new Set([...variants, ...mapped])];
  };

  // 🚀 Get only submitted inquiries (for Admin)
  const getSubmittedInquiries = () => {
    const currentUser = getCurrentUser();
    const submittedInquiries = inquiries.filter(inq => inq.isSubmitted === true);
    
    // 🔥 Admin可以看所有询价，业务员只能看自己负责区域的询价
    if (currentUser?.type === 'admin' || currentUser?.userRole === 'Owner') {
      console.log('🔑 [InquiryContext] Admin/Owner用户，返回所有已提交的询价:', submittedInquiries.length);
      return submittedInquiries;
    } else {
      // 业务员：只能看自己负责区域的询价（支持区域代码和完整名称互转，且允许 region 为 null 时显示）
      const userRegion = currentUser?.region;
      const userRegionVariants = normalizeRegionForMatch(userRegion);
      
      const filtered = submittedInquiries.filter(inq => {
        // 如果询价的 region 是 null/undefined，允许显示（可能是旧数据或未设置区域）
        if (!inq.region) return true;
        
        // 如果有区域，则进行匹配
        if (!userRegionVariants.length) return true; // no region filter
        const inqRegionVariants = normalizeRegionForMatch(inq.region);
        return userRegionVariants.some(v => inqRegionVariants.includes(v));
      });
      
      console.log('👤 [InquiryContext] 业务员用户，按区域过滤:', {
        userEmail: currentUser?.email,
        userRegion,
        userRegionVariants,
        totalSubmitted: submittedInquiries.length,
        filtered: filtered.length,
        inquiries: filtered.map(inq => ({
          inquiryNumber: inq.inquiryNumber,
          region: inq.region
        }))
      });
      
      return filtered;
    }
  };

  // 🌍 Get inquiries by region
  const getInquiriesByRegion = (region: RegionType) => {
    return inquiries.filter(inq => inq.region === region);
  };

  return (
    <InquiryContext.Provider
      value={{
        inquiries,
        addInquiry,
        getUserInquiries,
        getCompanyInquiries,
        updateInquiryStatus,
        updateInquiry,
        deleteInquiry,
        submitInquiry,
        getSubmittedInquiries,
        getInquiriesByRegion,
        refreshInquiries
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const context = useContext(InquiryContext);
  if (context === undefined) {
    throw new Error('useInquiry must be used within an InquiryProvider');
  }
  return context;
}