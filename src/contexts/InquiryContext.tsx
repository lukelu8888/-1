import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import type { RegionType } from '../utils/xjNumberGenerator';
import { getCurrentUser } from '../utils/dataIsolation';
import { inquiryService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import { ERP_EVENT_KEYS } from '../lib/erp-core/events';
import { emitErpEvent } from '../lib/erp-core/event-bus';

export interface Inquiry {
  id: string;
  inquiryNumber?: string;
  date: string;
  userEmail: string;
  companyId?: string;
  products: CartItem[];
  status: 'draft' | 'pending' | 'quoted' | 'approved' | 'rejected';
  isSubmitted: boolean;
  totalPrice: number;
  region?: RegionType;
  buyerInfo?: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    mobile?: string;
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
  submittedAt?: number;
}

interface InquiryContextType {
  inquiries: Inquiry[];
  addInquiry: (inquiry: Inquiry) => Promise<void>;
  getUserInquiries: (email: string) => Inquiry[];
  getCompanyInquiries: (companyId: string) => Inquiry[];
  updateInquiryStatus: (id: string, status: Inquiry['status']) => void;
  updateInquiry: (id: string, updatedInquiry: Partial<Inquiry>) => void;
  deleteInquiry: (id: string) => void;
  submitInquiry: (id: string) => Promise<boolean>;
  getSubmittedInquiries: () => Inquiry[];
  getInquiriesByRegion: (region: RegionType) => Inquiry[];
  refreshInquiries: () => Promise<void>;
}

const InquiryContext = createContext<InquiryContextType | undefined>(undefined);

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

export function InquiryProvider({ children }: { children: ReactNode }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const loadFromSupabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }
      const userId = session.user.id;
      const email = session.user.email!;

      // Check staff role from Supabase user_profiles (not localStorage)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('rbac_role, portal_role')
        .eq('id', userId)
        .single();

      const rbacRole = profile?.rbac_role || '';
      const portalRole = profile?.portal_role || '';
      const isStaff = portalRole === 'admin' || portalRole === 'staff';

      const data = isStaff
        ? await inquiryService.getAll()
        : await inquiryService.getByUserEmail(email);
      if (Array.isArray(data)) {
        setInquiries(data as Inquiry[]);
      }
    } catch (err) {
      console.error('❌ [loadFromSupabase] error:', err);
    }
  };

  const refreshInquiries = async () => {
    await loadFromSupabase();
  };

  useEffect(() => {
    void loadFromSupabase();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void loadFromSupabase();
      if (event === 'SIGNED_OUT') setInquiries([]);
    });

    return () => { authSub.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addInquiry = async (inquiry: Inquiry) => {
    console.log('🔵 [addInquiry] start:', inquiry.id, inquiry.userEmail);

    const result = await inquiryService.upsert(inquiry);
    if (!result) {
      console.error('❌ [addInquiry] Supabase upsert failed for:', inquiry.id);
      throw new Error('Failed to save inquiry to database');
    }
    console.log('✅ [addInquiry] Supabase upsert OK:', result.id);

    setInquiries(prev => [result as Inquiry, ...prev.filter(i => i.id !== result.id)]);

    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_CREATED, inquiry, {
      status: inquiry.status,
      isSubmitted: inquiry.isSubmitted,
    });
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
    void inquiryService.updateStatus(id, status).catch(() => {});
    setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, status } : inq));
  };

  const updateInquiry = (id: string, updatedInquiry: Partial<Inquiry>) => {
    setInquiries(prev => {
      const next = prev.map(inq => inq.id === id ? { ...inq, ...updatedInquiry } : inq);
      const updated = next.find(i => i.id === id);
      if (updated) void inquiryService.upsert(updated).catch(() => {});
      return next;
    });
  };

  const deleteInquiry = (id: string) => {
    void inquiryService.delete(id).catch(() => {});
    setInquiries(prev => prev.filter(inq => inq.id !== id));
    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_DELETED, { id });
  };

  const submitInquiry = async (id: string): Promise<boolean> => {
    const inquiry = inquiries.find(inq => inq.id === id);
    if (!inquiry) return false;
    if (inquiry.isSubmitted) return true;

    const submittedInquiry = { ...inquiry, isSubmitted: true, status: 'pending' as const, submittedAt: Date.now() };

    const result = await inquiryService.upsert(submittedInquiry);
    if (!result) {
      console.error('❌ [submitInquiry] Supabase upsert failed for:', id);
      return false;
    }
    console.log('✅ [submitInquiry] Supabase OK:', result.id);

    setInquiries(prev => prev.map(inq => inq.id === id ? (result as Inquiry) : inq));

    emitInquiryEvent(ERP_EVENT_KEYS.INQUIRY_SUBMITTED, {
      id,
      inquiryNumber: inquiry.inquiryNumber || inquiry.id,
    }, { status: 'pending' });

    return true;
  };

  const getSubmittedInquiries = () => {
    return inquiries.filter(inq => inq.isSubmitted === true);
  };

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
        refreshInquiries,
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
