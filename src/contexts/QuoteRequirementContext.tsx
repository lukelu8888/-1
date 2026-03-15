import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { quoteRequirementService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import type { PricingTaxSettings, SourcePricingBasis } from '../types/pricingBasis';
import type { QuoteRequirementDocumentData } from '../components/documents/templates/QuoteRequirementDocument';
import type {
  CommercialTermsSnapshot,
  CustomerRequirementsSnapshot,
  DownstreamVisibilityRules,
} from '../utils/procurementRequestContext';

export interface QuoteRequirementItem {
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
  imageUrl?: string;
  remarks?: string;
  customerProductId?: string;
  projectId?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
}

export interface QuoteRequirementFeedbackProduct {
  productId: string;
  productName: string;
  specification: string;
  quantity: number;
  unit: string;
  costPrice: number;
  currency: string;
  priceType?: 'usd' | 'cny_with_tax' | 'cny_no_tax';
  quoteMode?: string;
  taxSettings?: PricingTaxSettings;
  sourcePricing?: SourcePricingBasis;
  amount: number;
  moq?: number;
  leadTime?: string;
  remarks?: string;
}

export interface QuoteRequirementFeedback {
  status: 'pending' | 'quoted' | 'rejected';
  feedbackDate?: string;
  feedbackBy?: string;
  linkedBJ?: string;
  linkedSupplier?: string;
  linkedXJ?: string;
  products: QuoteRequirementFeedbackProduct[];
  paymentTerms?: string;
  deliveryTerms?: string;
  packaging?: string;
  warranty?: string;
  purchaserRemarks?: string;
  suggestedMargin?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface QuoteRequirement {
  id: string;
  requirementNo: string;
  source: string;
  sourceRef?: string;
  sourceInquiryNumber?: string;
  projectId?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  projectRevisionId?: string | null;
  projectRevisionCode?: string | null;
  projectRevisionStatus?: 'working' | 'quoted' | 'superseded' | 'final' | 'cancelled' | null;
  finalRevisionId?: string | null;
  finalQuotationId?: string | null;
  finalQuotationNumber?: string | null;
  requiredDate: string;
  urgency: 'high' | 'medium' | 'low';
  status: 'pending' | 'partial' | 'processing' | 'completed';
  createdBy: string;
  createdDate: string;
  specialRequirements?: string;
  expectedQuoteDate?: string;
  deliveryDate?: string;
  tradeTerms?: string;
  paymentTerms?: string;
  targetCostRange?: string;
  qualityRequirements?: string;
  packagingRequirements?: string;
  remarks?: string;
  customerRequirements?: CustomerRequirementsSnapshot | null;
  commercialTerms?: CommercialTermsSnapshot | null;
  downstreamVisibility?: DownstreamVisibilityRules | null;
  region?: string;
  salesOrderNo?: string;
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
  items: QuoteRequirementItem[];
  purchaserFeedback?: QuoteRequirementFeedback;
  pushedToQuotation?: boolean;
  pushedToQuotationDate?: string;
  pushedBy?: string;
  templateId?: string | null;
  templateVersionId?: string | null;
  templateSnapshot?: any;
  documentDataSnapshot?: QuoteRequirementDocumentData;
  documentRenderMeta?: any;
}

interface QuoteRequirementContextType {
  requirements: QuoteRequirement[];
  addRequirement: (requirement: QuoteRequirement) => Promise<void>;
  updateRequirement: (id: string, updates: Partial<QuoteRequirement>) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  getRequirementById: (id: string) => QuoteRequirement | undefined;
  refreshQuoteRequirementsFromApi: () => Promise<void>;
}

const QuoteRequirementContext = createContext<QuoteRequirementContextType | undefined>(undefined);

const assertQuoteRequirementWritePayload = (requirement: Partial<QuoteRequirement>) => {
  if (!requirement.templateSnapshot || !requirement.documentDataSnapshot) {
    throw new Error(`QR ${requirement.requirementNo || requirement.id || ''} 缺少模板快照数据，已阻止写入`);
  }
};

const assertQuoteRequirementPersistedBinding = (requirement: Partial<QuoteRequirement>) => {
  if (!requirement.templateId || !requirement.templateVersionId || !requirement.templateSnapshot || !requirement.documentDataSnapshot) {
    throw new Error(`QR ${requirement.requirementNo || requirement.id || ''} 缺少模板绑定字段，Supabase 返回结果不完整`);
  }
};

export const QuoteRequirementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requirements, setRequirements] = useState<QuoteRequirement[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const rows = await quoteRequirementService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      setRequirements(rows.filter(Boolean) as QuoteRequirement[]);
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') setRequirements([]);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const addRequirement = async (requirement: QuoteRequirement) => {
    assertQuoteRequirementWritePayload(requirement);
    const saved = await quoteRequirementService.upsert(requirement);
    if (!saved) {
      throw new Error(`QR ${requirement.requirementNo || requirement.id} 写入 Supabase 失败`);
    }
    assertQuoteRequirementPersistedBinding(saved as QuoteRequirement);
    setRequirements(prev => prev.some(r => r.id === saved.id) ? prev : [...prev, saved as QuoteRequirement]);
  };

  const updateRequirement = async (id: string, updates: Partial<QuoteRequirement>) => {
    const current = requirements.find((req) => req.id === id);
    if (!current) return;
    const merged = { ...current, ...updates } as QuoteRequirement;
    assertQuoteRequirementWritePayload(merged);
    const saved = await quoteRequirementService.upsert(merged);
    if (!saved) {
      throw new Error(`QR ${current.requirementNo || id} 更新 Supabase 失败`);
    }
    assertQuoteRequirementPersistedBinding(saved as QuoteRequirement);
    setRequirements(prev => prev.map(req => req.id === id ? saved as QuoteRequirement : req));
  };

  const deleteRequirement = async (id: string) => {
    await quoteRequirementService.delete(id);
    setRequirements(prev => prev.filter(req => req.id !== id));
  };

  const getRequirementById = (id: string) => requirements.find(req => req.id === id);

  const refreshQuoteRequirementsFromApi = React.useCallback(async () => {
    try {
      const rows = await quoteRequirementService.getAll();
      if (Array.isArray(rows)) setRequirements(rows.filter(Boolean) as QuoteRequirement[]);
    } catch {}
  }, []);

  return (
    <QuoteRequirementContext.Provider
      value={{
        requirements,
        addRequirement,
        updateRequirement,
        deleteRequirement,
        getRequirementById,
        refreshQuoteRequirementsFromApi,
      }}
    >
      {children}
    </QuoteRequirementContext.Provider>
  );
};

export const useQuoteRequirements = () => {
  const context = useContext(QuoteRequirementContext);
  if (context === undefined) {
    throw new Error('useQuoteRequirements must be used within a QuoteRequirementProvider');
  }
  return context;
};
