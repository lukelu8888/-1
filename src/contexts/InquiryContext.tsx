import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import type { RegionType } from '../utils/rfqNumberGenerator';
import { executeCustomerInquiry, executeSystemDistribute, updateWorkflowState, WorkflowContext } from '../utils/workflowEngineV2';
import { getCurrentUser, getUserData, setUserData, getUserStorageKey } from '../utils/dataIsolation'; // 🔥 新增：导入获取当前用户
import { apiFetchJson, getApiToken, getBackendUser } from '../api/backend-auth';
import { addTombstones, filterNotDeleted } from '../lib/erp-core/deletion-tombstone';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';
import { subscribeErpEvent } from '../lib/erp-core/event-bus';

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
  submitInquiry: (id: string) => Promise<boolean>; // 🚀 Submit inquiry to admin
  getSubmittedInquiries: () => Inquiry[]; // 🚀 Get all submitted inquiries (for Admin)
  getInquiriesByRegion: (region: RegionType) => Inquiry[]; // 🌍 Get inquiries by region
  refreshInquiries: () => Promise<void>; // 🔄 Load from database
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);
const INQUIRY_BASE_KEY = 'inquiries';
const LEGACY_INQUIRY_KEY = 'cosun_inquiries';
const DELETED_INQUIRIES_KEY_PREFIX = 'deleted_inquiries_markers_v1';

const normalizeEmail = (email?: string | null): string => (email || '').trim().toLowerCase();

const getDeletedInquiriesKey = (email?: string | null): string =>
  `${DELETED_INQUIRIES_KEY_PREFIX}:${normalizeEmail(email) || 'anonymous'}`;

const emitInquiryEvent = (
  key: string,
  inquiry: Partial<Inquiry> & { id: string },
  metadata?: Record<string, unknown>,
) => {
  const currentUser = getCurrentUser() as any;
  emitErpEvent({
    id: `evt-inquiry-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    key: key as any,
    domain: 'inquiry',
    recordId: String(inquiry.id),
    internalNo: String(inquiry.inquiryNumber || inquiry.id),
    companyId: currentUser?.companyId ? String(currentUser.companyId) : undefined,
    source: currentUser?.type === 'admin' ? 'admin' : 'client',
    occurredAt: new Date().toISOString(),
    metadata,
  });
};

const getDeletedInquiryMarkers = (email?: string | null): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const normalized = normalizeEmail(email);
  if (!normalized) return new Set();
  try {
    const raw = localStorage.getItem(getDeletedInquiriesKey(normalized));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((v) => String(v)).filter(Boolean));
  } catch {
    return new Set();
  }
};

const saveDeletedInquiryMarkers = (email: string, markers: Set<string>) => {
  if (typeof window === 'undefined') return;
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  localStorage.setItem(getDeletedInquiriesKey(normalized), JSON.stringify(Array.from(markers)));
};

const filterDeletedInquiries = (items: Inquiry[], email?: string | null): Inquiry[] => {
  const markers = getDeletedInquiryMarkers(email);
  const localVisible = markers.size === 0 ? items : items.filter((item) => !markers.has(String(item?.id || '')));
  return filterNotDeleted('inquiry', localVisible, (item: Inquiry) => [
    String(item?.id || ''),
    String(item?.inquiryNumber || ''),
  ]);
};

const INTERNAL_INQUIRY_ROLES = new Set([
  'Sales_Rep',
  'Regional_Manager',
  'Sales_Manager',
  'Sales_Director',
  'Admin',
  'Procurement',
  'Marketing_Ops',
  'Documentation_Officer',
  'Finance',
  'CFO',
  'CEO',
  '业务员',
  '区域主管',
  '销售主管',
  '销售总监',
  '管理员',
  '采购',
  '市场运营',
  '单证员',
  '财务',
  '首席财务官',
  '首席执行官',
]);

const resolveEffectiveRole = (currentUser: any, backendUser: any): string => {
  const candidates = [
    currentUser?.role,
    currentUser?.userRole,
    backendUser?.rbac_role,
    backendUser?.company_user_role,
    backendUser?.role,
  ];
  const first = candidates.find((v) => typeof v === 'string' && v.trim() !== '');
  return typeof first === 'string' ? first.trim() : '';
};

const canUseAdminInquiryApis = (currentUser: any, backendUser: any): boolean => {
  const portalRole = String(backendUser?.portal_role || '').trim();
  if (portalRole === 'admin') return true;

  const effectiveRole = resolveEffectiveRole(currentUser, backendUser);
  if (INTERNAL_INQUIRY_ROLES.has(effectiveRole)) return true;

  const userType = String(currentUser?.type || '').trim();
  // Any authenticated non-customer internal user should use admin inquiries endpoint.
  if (userType === 'admin' || userType === 'supplier') return true;

  return false;
};

const getActiveInquiryUserEmail = (): string | null => {
  const currentUser = getCurrentUser();
  const backendUser = getBackendUser();
  return normalizeEmail(currentUser?.email || backendUser?.email) || null;
};

const readLegacyInquiries = (): Inquiry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEGACY_INQUIRY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse legacy inquiries:', error);
    return [];
  }
};

const getInquiryCandidateEmails = (inquiry: Inquiry): string[] => {
  return [normalizeEmail(inquiry.userEmail), normalizeEmail(inquiry.buyerInfo?.email)].filter(Boolean);
};

const toApiDateString = (value?: string): string => {
  const raw = String(value || '').trim();
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);

  const mdy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const mm = mdy[1].padStart(2, '0');
    const dd = mdy[2].padStart(2, '0');
    const yyyy = mdy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return new Date().toISOString().slice(0, 10);
};

const mapInquiryToSubmitPayload = (inquiry: Inquiry) => ({
  id: inquiry.id,
  inquiryNumber: inquiry.inquiryNumber || inquiry.id,
  date: toApiDateString(inquiry.date),
  userEmail: inquiry.userEmail,
  companyId: inquiry.companyId,
  region: inquiry.region,
  status: 'pending',
  isSubmitted: true,
  totalPrice: inquiry.totalPrice ?? 0,
  message: inquiry.message ?? '',
  createdAt: typeof inquiry.createdAt === 'number' ? inquiry.createdAt : Date.now(),
  submittedAt: Date.now(),
  buyerInfo: inquiry.buyerInfo || undefined,
  shippingInfo: inquiry.shippingInfo || {
    cartons: '0',
    cbm: '0',
    totalGrossWeight: '0',
    totalNetWeight: '0',
  },
  containerInfo: inquiry.containerInfo || undefined,
  products: (inquiry.products || []).map((p: any) => ({
    productName: p.productName || p.name || '',
    name: p.name || p.productName || '',
    sku: p.sku || p.productCode || '',
    modelNo: p.modelNo || '',
    specification: p.specification || p.specifications || '',
    quantity: Number(p.quantity || 0),
    unitPrice: Number(p.unitPrice ?? p.price ?? p.targetPrice ?? 0),
    price: Number(p.price ?? p.unitPrice ?? p.targetPrice ?? 0),
    image: p.image || p.imageUrl || '',
    remarks: p.remarks || p.notes || '',
  })),
});

const syncLocalSubmittedInquiriesToBackend = async (local: Inquiry[], server: Inquiry[]) => {
  const serverIds = new Set((server || []).map((s) => s?.id).filter(Boolean));
  const pendingSync = (local || []).filter((inq) => inq?.isSubmitted === true && !!inq?.id && !serverIds.has(inq.id));
  if (!pendingSync.length) return;

  console.log('🔁 [InquiryContext] Backfilling submitted local inquiries to backend:', pendingSync.map(i => i.id));

  await Promise.all(
    pendingSync.map(async (inq) => {
      try {
        await apiFetchJson<{ inquiry: Inquiry }>('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mapInquiryToSubmitPayload(inq)),
        });
      } catch (error) {
        console.error('❌ [InquiryContext] Failed to backfill inquiry:', inq.id, error);
      }
    })
  );
};

const loadStoredInquiries = (): Inquiry[] => {
  const email = getActiveInquiryUserEmail();
  const currentUser = getCurrentUser() as any;
  const currentCompanyId = currentUser?.companyId ? String(currentUser.companyId) : '';
  if (!email) {
    return readLegacyInquiries();
  }

  const isolated = getUserData<Inquiry>(INQUIRY_BASE_KEY, email);
  const isolatedStorageKey = getUserStorageKey(INQUIRY_BASE_KEY, email);
  const isolatedKeyExists = Boolean(isolatedStorageKey && localStorage.getItem(isolatedStorageKey) !== null);
  if (isolated.length > 0) {
    return filterDeletedInquiries(isolated, email);
  }
  // 已存在用户专属键（即使是空数组）时，不再回退旧全局键，避免“手动删除后又被恢复”
  if (isolatedKeyExists) {
    return [];
  }

  // 兼容迁移：从旧全局键读取当前用户数据，并迁移到按用户隔离存储
  const legacy = readLegacyInquiries();
  if (!legacy.length) return [];

  const matched = legacy.filter((inquiry) => {
    const emailMatched = getInquiryCandidateEmails(inquiry).includes(email);
    const companyMatched = Boolean(
      currentCompanyId &&
      inquiry?.companyId &&
      String(inquiry.companyId) === currentCompanyId
    );
    return emailMatched || companyMatched;
  });
  const migrated = matched.length > 0 ? matched : [];

  if (migrated.length > 0) {
    const filteredMigrated = filterDeletedInquiries(migrated, email);
    setUserData<Inquiry>(INQUIRY_BASE_KEY, filteredMigrated, email);
    console.log(`🔁 [InquiryContext] Migrated ${migrated.length} legacy inquiries to isolated storage for ${email}`);
    return filteredMigrated;
  }

  return filterDeletedInquiries(migrated, email);
};

export function InquiryProvider({ children }: { children: ReactNode }) {
  // Load inquiries from localStorage
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    return loadStoredInquiries();
  });

  // Save to localStorage whenever inquiries change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const email = getActiveInquiryUserEmail();
    if (email) {
      setUserData<Inquiry>(INQUIRY_BASE_KEY, inquiries, email);
    }

    // 🔒 Backup save with timestamp - for data recovery
    const backup = {
      data: inquiries,
      timestamp: Date.now(),
      count: inquiries.length,
      userEmail: email || 'anonymous'
    };
    localStorage.setItem('cosun_inquiries_backup', JSON.stringify(backup));
    
    console.log(`💾 Inquiry data saved: ${inquiries.length} inquiries (user: ${email || 'anonymous'})`);
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
    const effectiveRole = resolveEffectiveRole(currentUser, backendUser);
    
    console.log('🔍 [InquiryContext] refreshInquiries - Debug:', {
      hasToken: !!token,
      backendUser: backendUser ? { portal_role: backendUser.portal_role, rbac_role: backendUser.rbac_role, email: backendUser.email } : null,
      currentUser: currentUser ? { role: currentUser.role, userRole: (currentUser as any).userRole, email: currentUser.email, type: currentUser.type } : null,
      effectiveRole,
    });
    
    // Admin portal users and internal staff should use admin endpoint.
    const useAdminEndpoint = canUseAdminInquiryApis(currentUser, backendUser);
    
    const endpoint = useAdminEndpoint ? '/api/admin/inquiries' : '/api/inquiries';
    console.log('🔄 [InquiryContext] refreshInquiries - Will call:', { endpoint, useAdminEndpoint, effectiveRole, userType: currentUser?.type, portalRole: backendUser?.portal_role });

    try {
      const data = await apiFetchJson<{ inquiries: Inquiry[] }>(endpoint);
      console.log('✅ [InquiryContext] Fetched from API:', data?.inquiries?.length || 0, 'inquiries');

      // Customer side fallback: if a submitted inquiry only exists in local storage (legacy flow),
      // backfill it to backend to guarantee cross-role visibility.
      if (!useAdminEndpoint) {
        void syncLocalSubmittedInquiriesToBackend(inquiries, data?.inquiries || []);
      }

      // Merge strategy: keep local drafts, prefer server data for submitted inquiries (by id)
      setInquiries(prev => {
        const activeEmail = getActiveInquiryUserEmail();
        const prevById = new Map<string, Inquiry>(
          prev.filter((item) => item?.id).map((item) => [item.id, item])
        );
        const localDrafts = prev.filter(i => i && i.isSubmitted === false);
        const server = (data?.inquiries || []).filter(Boolean);

        const seen = new Set<string>();
        const merged: Inquiry[] = [];

        // First: add all server inquiries (authoritative for submitted ones)
        for (const s of server) {
          if (!s?.id) continue;
          const local = prevById.get(s.id);
          const normalizedServer: Inquiry = local
            ? {
                ...local,
                ...s,
                userEmail: s.userEmail || local.userEmail,
                companyId: s.companyId || local.companyId,
                buyerInfo: s.buyerInfo || local.buyerInfo,
                shippingInfo: s.shippingInfo || local.shippingInfo,
                products: Array.isArray(s.products) && s.products.length > 0 ? s.products : local.products,
                region: s.region || local.region,
              }
            : s;
          seen.add(s.id);
          merged.push(normalizedServer);
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

        return filterDeletedInquiries(merged, activeEmail);
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
    setInquiries(loadStoredInquiries());
    run();

    // reload local data + refresh after login/logout token changes (same tab)
    const handleToken = () => {
      setInquiries(loadStoredInquiries());
      run();
    };
    const handleUserChanged = () => {
      setInquiries(loadStoredInquiries());
      run();
    };
    window.addEventListener('authTokenChanged', handleToken as EventListener);
    window.addEventListener('userChanged', handleUserChanged as EventListener);
    const unsubscribeErpEvents = subscribeErpEvent((event) => {
      if (event.domain !== 'inquiry') return;
      if (
        event.key === ERP_EVENT_KEYS.INQUIRY_CREATED ||
        event.key === ERP_EVENT_KEYS.INQUIRY_SUBMITTED ||
        event.key === ERP_EVENT_KEYS.INQUIRY_DELETED
      ) {
        run();
      }
    });

    return () => {
      window.removeEventListener('authTokenChanged', handleToken as EventListener);
      window.removeEventListener('userChanged', handleUserChanged as EventListener);
      unsubscribeErpEvents();
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
        const email = getActiveInquiryUserEmail();
        if (email) {
          setUserData<Inquiry>(INQUIRY_BASE_KEY, updated, email);
        }
        console.log(`💾 立即保存 inquiries (${updated.length}) for:`, email);
      }
      
      return updated;
    });
    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_CREATED, inquiry, {
      status: inquiry.status,
      isSubmitted: inquiry.isSubmitted,
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
    const currentUser = getCurrentUser();
    if (canUseAdminInquiryApis(currentUser, backendUser) && getApiToken()) {
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
    const currentUser = getCurrentUser();
    if (canUseAdminInquiryApis(currentUser, backendUser) && getApiToken()) {
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
    const activeEmail = getActiveInquiryUserEmail();
    if (activeEmail) {
      const markers = getDeletedInquiryMarkers(activeEmail);
      markers.add(String(id));
      saveDeletedInquiryMarkers(activeEmail, markers);
    }

    // If admin, delete from DB (best effort)
    const backendUser = getBackendUser();
    const currentUser = getCurrentUser();
    if (canUseAdminInquiryApis(currentUser, backendUser) && getApiToken()) {
      void apiFetchJson(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch(err => console.error('❌ Failed to delete inquiry:', err));
    } else if (getApiToken()) {
      // Non-admin route may be unavailable in some environments; keep best-effort.
      void apiFetchJson(`/api/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' })
        .catch(() => {});
    }

    setInquiries(prev =>
      prev.filter(inq =>
        inq.id !== id
      )
    );

    const target = inquiries.find((inq) => inq.id === id);
    addTombstones('inquiry', [String(id), String(target?.inquiryNumber || '')].filter(Boolean), {
      reason: 'manual_delete',
      deletedBy: activeEmail || 'unknown',
    });
    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_DELETED, {
      id,
      inquiryNumber: target?.inquiryNumber || id,
    });
  };

  // 🚀 Submit inquiry - change isSubmitted to true
  const submitInquiry = async (id: string): Promise<boolean> => {
    const inquiry = inquiries.find(inq => inq.id === id);
    if (!inquiry) return false;
    if (inquiry.isSubmitted) return true;
    const previousStatus = inquiry.status;
    const previousSubmittedAt = inquiry.submittedAt;
    
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

    const token = getApiToken();
    if (token) {
      try {
        const payload = mapInquiryToSubmitPayload(inquiry);
        const res = await apiFetchJson<{ inquiry: Inquiry }>('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res?.inquiry) {
          setInquiries(prev =>
            prev.map(inq =>
              inq.id === id ? { ...inq, ...res.inquiry } : inq
            )
          );
        }
      } catch (error) {
        console.error('❌ [InquiryContext] Failed to submit inquiry to backend:', error);
        setInquiries(prev =>
          prev.map(inq =>
            inq.id === id
              ? {
                  ...inq,
                  isSubmitted: false,
                  status: previousStatus,
                  submittedAt: previousSubmittedAt,
                }
              : inq
          )
        );
        return false;
      }
    }

    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_SUBMITTED, {
      id,
      inquiryNumber: inquiry.inquiryNumber || inquiry.id,
    }, {
      status: 'pending',
    });

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

    return true;
  };

  // Helper: normalize region for matching (supports both codes and full names)
  const normalizeRegionForMatch = (r: string | null | undefined): string[] => {
    if (!r) return [];
    const s = String(r).trim();
    if (!s || s === 'all') return [];
    
    const variants = [s];
    const map: Record<string, string[]> = {
      'NA': ['North America', 'north-america', 'north_america', '北美'],
      'North America': ['NA', 'north-america', 'north_america', '北美'],
      'north-america': ['NA', 'North America', 'north_america', '北美'],
      'north_america': ['NA', 'North America', 'north-america', '北美'],
      '北美': ['NA', 'North America', 'north-america', 'north_america'],
      'SA': ['South America', 'south-america', 'south_america', '南美'],
      'South America': ['SA', 'south-america', 'south_america', '南美'],
      'south-america': ['SA', 'South America', 'south_america', '南美'],
      'south_america': ['SA', 'South America', 'south-america', '南美'],
      '南美': ['SA', 'South America', 'south-america', 'south_america'],
      'EA': ['Europe & Africa', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'EMEA': ['Europe & Africa', 'EA', 'europe-africa', 'europe_africa', '欧非'],
      'Europe & Africa': ['EA', 'EMEA', 'europe-africa', 'europe_africa', '欧非'],
      'europe-africa': ['EA', 'EMEA', 'Europe & Africa', 'europe_africa', '欧非'],
      'europe_africa': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', '欧非'],
      '欧非': ['EA', 'EMEA', 'Europe & Africa', 'europe-africa', 'europe_africa'],
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
