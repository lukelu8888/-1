import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { quoteRequirementService } from '../lib/supabaseService';
import { supabase } from '../lib/supabase';
import {
  buildIdentityAuditMetadata,
  buildIdentityPersistenceFields,
  clearLegacyScopedStorageKeys,
  getCurrentUser,
  getScopedStorageKey,
  readScopedStoragePayload,
} from '../utils/dataIsolation';
import type { PricingTaxSettings, SourcePricingBasis } from '../types/pricingBasis';
import type { QuoteRequirementDocumentData } from '../components/documents/templates/QuoteRequirementDocument';
import type {
  CommercialTermsSnapshot,
  CustomerRequirementsSnapshot,
  DownstreamVisibilityRules,
} from '../utils/procurementRequestContext';
import { assertBusinessOwnerEmail } from '../utils/quotationOwnership';
import { normalizeLegacyQrNumber } from '../utils/quoteRequirementNumber';

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

export interface QuoteRequirementDecisionSnapshotMetric {
  key: string;
  label: string;
  value: string;
  source: 'quoted' | 'history' | 'default';
  note?: string;
}

export interface QuoteRequirementDecisionSnapshotHistoricalBenchmark {
  sampleCount: number;
  sameSupplierSampleCount: number;
  marketMinUnitPrice?: number | null;
  marketAvgUnitPrice?: number | null;
  sameSupplierAvgUnitPrice?: number | null;
  latestKnownUnitPrice?: number | null;
  latestKnownQuoteDate?: string | null;
}

export interface QuoteRequirementDecisionSnapshotSupplierPerformance {
  historicalPurchaseOrderCount: number;
  qcPassCount: number;
  qcFailCount: number;
  supplierSelfInspectionPassCount: number;
  supplierSelfInspectionFailCount: number;
  averageOverallRating?: number | null;
  averageDeliveryRating?: number | null;
  qualityIssueCount: number;
  deliveryIssueCount: number;
}

export interface QuoteRequirementDecisionSnapshotProduct {
  productId: string;
  productName: string;
  selectedSupplierName: string;
  selectedBJNumber: string;
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendReason?: string;
  metrics: QuoteRequirementDecisionSnapshotMetric[];
  warnings: string[];
  historicalBenchmark?: QuoteRequirementDecisionSnapshotHistoricalBenchmark | null;
  supplierPerformance?: QuoteRequirementDecisionSnapshotSupplierPerformance | null;
}

export interface QuoteRequirementDecisionSnapshot {
  decisionMode: 'single_quote_confirmation' | 'multi_supplier_comparison';
  comparisonDate: string;
  supplierCount: number;
  quotationCount: number;
  evidenceCoverage: number;
  confidence: 'limited' | 'medium' | 'high';
  scoreWeights: Array<{
    key: string;
    label: string;
    weight: number;
    description: string;
  }>;
  products: QuoteRequirementDecisionSnapshotProduct[];
  limitations: string[];
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
  decisionSnapshot?: QuoteRequirementDecisionSnapshot;
}

export interface QuoteRequirement {
  id: string;
  requirementNo: string;
  source: string;
  sourceRef?: string;
  sourceInquiryId?: string;
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
  requestedBy?: string | null;
  requestedByName?: string | null;
  assignedTo?: string | null;
  ownerUserId?: string | null;
  ownerEmail?: string | null;
  ownerName?: string | null;
  ownerRole?: string | null;
  operatorUserId?: string | null;
  operatorEmail?: string | null;
  operatorRole?: string | null;
  actingUserId?: string | null;
  actingUserEmail?: string | null;
  actingUserRole?: string | null;
  authenticatedUserId?: string | null;
  authenticatedUserEmail?: string | null;
  authenticatedUserRole?: string | null;
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
const QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX = 'quote_requirement_context_cache_v1';
const QUOTE_REQUIREMENT_CROSS_ROLE_HANDOFF_KEY = 'quote_requirement_cross_role_handoff_v1';

const getQuoteRequirementMergeKey = (requirement: Partial<QuoteRequirement>) =>
  String(requirement?.id || requirement?.requirementNo || '').trim();

const hasQuotedPurchaserFeedback = (requirement?: Partial<QuoteRequirement> | null) => {
  const feedback = requirement?.purchaserFeedback;
  return Boolean(
    feedback &&
    feedback.status === 'quoted' &&
    Array.isArray(feedback.products) &&
    feedback.products.length > 0,
  );
};

const hasMeaningfulPurchaserFeedback = (requirement?: Partial<QuoteRequirement> | null) => {
  const feedback = requirement?.purchaserFeedback;
  return Boolean(
    feedback &&
    (
      hasQuotedPurchaserFeedback(requirement) ||
      feedback.status ||
      feedback.linkedBJ ||
      feedback.linkedSupplier ||
      feedback.feedbackDate
    )
  );
};

const shouldPreserveExistingQuoteRequirementField = (
  field: keyof QuoteRequirement,
  existing?: Partial<QuoteRequirement>,
  incoming?: Partial<QuoteRequirement>,
) => {
  if (!existing || !incoming) return false;

  if (field === 'purchaserFeedback') {
    return hasMeaningfulPurchaserFeedback(existing) && !hasMeaningfulPurchaserFeedback(incoming);
  }

  if (field === 'status') {
    return hasQuotedPurchaserFeedback(existing) && !hasQuotedPurchaserFeedback(incoming);
  }

  if (field === 'pushedToQuotation' || field === 'pushedToQuotationDate' || field === 'pushedBy' || field === 'quotationNumber') {
    return Boolean(existing[field]) && !incoming[field];
  }

  return false;
};

const mergeQuoteRequirementLists = (...lists: QuoteRequirement[][]) => {
  const merged = new Map<string, QuoteRequirement>();
  lists.flat().filter(Boolean).forEach((requirement) => {
    const key = getQuoteRequirementMergeKey(requirement);
    if (!key) return;
    const existing = merged.get(key);
    const next = {
      ...(existing || {}),
      ...requirement,
    } as QuoteRequirement;

    (['purchaserFeedback', 'status', 'pushedToQuotation', 'pushedToQuotationDate', 'pushedBy', 'quotationNumber'] as Array<keyof QuoteRequirement>).forEach((field) => {
      if (shouldPreserveExistingQuoteRequirementField(field, existing, requirement)) {
        (next as any)[field] = (existing as any)?.[field];
      }
    });

    merged.set(key, next);
  });
  return Array.from(merged.values()).sort((a, b) => (
    new Date(String(b.createdDate || '')).getTime() - new Date(String(a.createdDate || '')).getTime()
  ));
};

const parseQuoteRequirementArray = (raw: string | null): QuoteRequirement[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readCrossRoleQuoteRequirementHandoff = (): QuoteRequirement[] => {
  if (typeof window === 'undefined') return [];
  return parseQuoteRequirementArray(window.localStorage.getItem(QUOTE_REQUIREMENT_CROSS_ROLE_HANDOFF_KEY));
};

const writeCrossRoleQuoteRequirementHandoff = (requirements: QuoteRequirement[]) => {
  if (typeof window === 'undefined') return;
  try {
    const next = mergeQuoteRequirementLists(readCrossRoleQuoteRequirementHandoff(), requirements).slice(0, 300);
    window.localStorage.setItem(QUOTE_REQUIREMENT_CROSS_ROLE_HANDOFF_KEY, JSON.stringify(next));
  } catch {
    // ignore handoff write failures
  }
};

const removeCrossRoleQuoteRequirementHandoff = (id: string) => {
  if (typeof window === 'undefined') return;
  try {
    const next = readCrossRoleQuoteRequirementHandoff().filter((requirement) => (
      String(requirement.id || '') !== id &&
      String(requirement.requirementNo || '') !== id
    ));
    window.localStorage.setItem(QUOTE_REQUIREMENT_CROSS_ROLE_HANDOFF_KEY, JSON.stringify(next));
  } catch {
    // ignore handoff cleanup failures
  }
};

const getQuoteRequirementCacheKey = () => {
  return getScopedStorageKey(QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX);
};

const readQuoteRequirementCache = (): QuoteRequirement[] => {
  if (typeof window === 'undefined') return [];
  const scopedRows: QuoteRequirement[] = [];
  try {
    const raw = readScopedStoragePayload(QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX);
    scopedRows.push(...parseQuoteRequirementArray(raw));
  } catch {
    // keep scanning below
  }

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(`${QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX}:`)) continue;
      scopedRows.push(...parseQuoteRequirementArray(window.localStorage.getItem(key)));
    }
  } catch {
    // ignore cross-scope cache scan failures
  }

  return mergeQuoteRequirementLists(scopedRows, readCrossRoleQuoteRequirementHandoff());
};

const persistQuoteRequirementCache = (requirements: QuoteRequirement[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      getQuoteRequirementCacheKey(),
      JSON.stringify(Array.isArray(requirements) ? requirements : []),
    );
    writeCrossRoleQuoteRequirementHandoff(requirements);
    clearLegacyScopedStorageKeys(QUOTE_REQUIREMENT_CONTEXT_CACHE_PREFIX);
  } catch {
    // ignore cache write failures
  }
};

const hasLocalBusinessIdentity = () => {
  const currentUser = getCurrentUser() as any;
  return Boolean(
    currentUser?.email ||
    currentUser?.id ||
    currentUser?.role ||
    currentUser?.userRole ||
    currentUser?.type,
  );
};

const assertQuoteRequirementWritePayload = (requirement: Partial<QuoteRequirement>) => {
  // QR 允许在进入 service 时再自动解析模板绑定；此处只拦截缺少文档快照的数据。
  if (!requirement.documentDataSnapshot) {
    throw new Error(`QR ${requirement.requirementNo || requirement.id || ''} 缺少文档快照数据，已阻止写入`);
  }
};

const assertQuoteRequirementPersistedBinding = (requirement: Partial<QuoteRequirement>) => {
  if (!requirement.documentDataSnapshot) {
    throw new Error(`QR ${requirement.requirementNo || requirement.id || ''} 缺少模板绑定字段，Supabase 返回结果不完整`);
  }
  const templateSnapshot = requirement.templateSnapshot || (requirement as any).template_snapshot || null;
  if (templateSnapshot?.pendingResolution === true) return;
  if (!requirement.templateId || !requirement.templateVersionId || !requirement.templateSnapshot) {
    console.warn(
      `[QuoteRequirementContext] QR ${requirement.requirementNo || requirement.id || ''} saved without template binding; using document snapshot fallback.`,
    );
  }
};

const normalizeQuoteRequirementWritePayload = (requirement: QuoteRequirement): QuoteRequirement => {
  const ownerEmail = assertBusinessOwnerEmail(
    requirement.ownerEmail || requirement.requestedBy || requirement.createdBy,
    requirement.region,
    '采购需求单',
  );
  const ownerName = requirement.ownerName || requirement.requestedByName || null;
  const ownerRole = requirement.ownerRole || 'Sales_Rep';

  return {
    ...requirement,
    requirementNo: normalizeLegacyQrNumber(requirement.requirementNo),
    requestedBy: ownerEmail,
    requestedByName: ownerName,
    ownerEmail,
    ownerName,
    ownerRole,
    ...buildIdentityPersistenceFields({
      ownerEmail,
      ownerName,
      ownerRole,
    }),
    documentRenderMeta: {
      ...(requirement.documentRenderMeta || {}),
      ...buildIdentityAuditMetadata({
        ownerEmail,
        ownerName,
        ownerRole,
        region: requirement.region || null,
      }),
    },
  };
};

const normalizeQuoteRequirementReadPayload = (requirement: QuoteRequirement): QuoteRequirement => {
  if (!requirement) return requirement;

  const normalizedRequirementNo = normalizeLegacyQrNumber(requirement.requirementNo);
  const normalizedSnapshotRequirementNo = normalizeLegacyQrNumber(
    requirement.documentDataSnapshot?.requirementNo,
  );

  return {
    ...requirement,
    requirementNo: normalizedRequirementNo,
    documentDataSnapshot: requirement.documentDataSnapshot
      ? {
          ...requirement.documentDataSnapshot,
          requirementNo: normalizedSnapshotRequirementNo || normalizedRequirementNo,
        }
      : requirement.documentDataSnapshot,
  };
};

const isTransientQuoteRequirementWriteError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || '');
  return /超时|timeout|timed out|network|fetch|abort/i.test(message);
};

export const QuoteRequirementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [requirements, setRequirements] = useState<QuoteRequirement[]>(() =>
    readQuoteRequirementCache().map((req) => normalizeQuoteRequirementReadPayload(req)),
  );
  const repairedLegacyQrNumbersRef = React.useRef<Set<string>>(new Set());

  const restoreRequirementCacheFallback = React.useCallback(() => {
    const cached = readQuoteRequirementCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setRequirements(cached.map((req) => normalizeQuoteRequirementReadPayload(req)));
      return true;
    }
    return false;
  }, []);

  const preserveRequirementStateOnAuthGap = React.useCallback(() => {
    const cached = readQuoteRequirementCache();
    if (Array.isArray(cached) && cached.length > 0) {
      setRequirements(cached.map((req) => normalizeQuoteRequirementReadPayload(req)));
      return;
    }
    setRequirements((prev) => prev);
  }, []);

  useEffect(() => {
    persistQuoteRequirementCache(requirements);
  }, [requirements]);

  const repairLegacyQrNumbers = React.useCallback(async (rows: QuoteRequirement[]) => {
    const legacyRows = rows.filter((row) => {
      const raw = String(row?.requirementNo || '').trim();
      return /^PR-/i.test(raw) && !repairedLegacyQrNumbersRef.current.has(raw);
    });
    if (legacyRows.length === 0) return;

    for (const row of legacyRows) {
      const oldNo = String(row?.requirementNo || '').trim();
      const newNo = normalizeLegacyQrNumber(oldNo);
      if (!oldNo || !newNo || oldNo === newNo) continue;

      repairedLegacyQrNumbersRef.current.add(oldNo);

      try {
        const normalizedRequirement = normalizeQuoteRequirementWritePayload({
          ...row,
          requirementNo: newNo,
          documentDataSnapshot: row.documentDataSnapshot
            ? {
                ...row.documentDataSnapshot,
                requirementNo: newNo,
              }
            : row.documentDataSnapshot,
        } as QuoteRequirement);

        await quoteRequirementService.upsert(normalizedRequirement);

        await Promise.all([
          supabase.from('sales_quotations').update({ qr_number: newNo }).eq('qr_number', oldNo),
          supabase.from('supplier_quotations').update({ source_qr_number: newNo }).eq('source_qr_number', oldNo),
          supabase.from('supplier_xjs').update({ source_qr_number: newNo }).eq('source_qr_number', oldNo),
          supabase.from('supplier_xjs').update({ requirement_no: newNo }).eq('requirement_no', oldNo),
          supabase.from('purchase_orders').update({ requirement_no: newNo }).eq('requirement_no', oldNo),
        ]);
      } catch (error) {
        repairedLegacyQrNumbersRef.current.delete(oldNo);
        console.warn(`⚠️ QR legacy number repair failed for ${oldNo}:`, error);
      }
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!restoreRequirementCacheFallback()) {
          preserveRequirementStateOnAuthGap();
        }
        return;
      }
      const rows = await quoteRequirementService.getAll();
      if (!alive || !Array.isArray(rows)) return;
      void repairLegacyQrNumbers(rows.filter(Boolean) as QuoteRequirement[]);
      setRequirements(
        mergeQuoteRequirementLists(
          readQuoteRequirementCache(),
          rows.filter(Boolean) as QuoteRequirement[],
        ).map((req) => normalizeQuoteRequirementReadPayload(req)),
      );
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') void load();
      else if (event === 'SIGNED_OUT') {
        if (!hasLocalBusinessIdentity() || !restoreRequirementCacheFallback()) {
          preserveRequirementStateOnAuthGap();
        }
      }
    });

    const handleUserChanged = () => void load();
    const handleWindowFocus = () => void load();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void load();
      }
    };

    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      alive = false;
      subscription.unsubscribe();
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [preserveRequirementStateOnAuthGap, repairLegacyQrNumbers, restoreRequirementCacheFallback]);

  const addRequirement = async (requirement: QuoteRequirement) => {
    const normalizedRequirement = normalizeQuoteRequirementWritePayload(requirement);
    assertQuoteRequirementWritePayload(normalizedRequirement);
    const optimisticRequirement = normalizeQuoteRequirementReadPayload(normalizedRequirement);
    writeCrossRoleQuoteRequirementHandoff([optimisticRequirement]);
    setRequirements(prev =>
      prev.some(r => r.id === optimisticRequirement.id || r.requirementNo === optimisticRequirement.requirementNo)
        ? prev
        : [optimisticRequirement, ...prev],
    );
    try {
      const saved = await quoteRequirementService.upsert(normalizedRequirement);
      if (!saved) {
        throw new Error(`QR ${normalizedRequirement.requirementNo || normalizedRequirement.id} 写入 Supabase 失败`);
      }
      assertQuoteRequirementPersistedBinding(saved as QuoteRequirement);
      const normalizedSaved = normalizeQuoteRequirementReadPayload(saved as QuoteRequirement);
      writeCrossRoleQuoteRequirementHandoff([normalizedSaved]);
      setRequirements(prev =>
        prev.some(r => r.id === saved.id)
          ? prev.map(req => req.id === saved.id ? normalizedSaved : req)
          : [normalizedSaved, ...prev],
      );
    } catch (error) {
      if (isTransientQuoteRequirementWriteError(error)) {
        console.warn(
          `[QuoteRequirementContext] QR ${normalizedRequirement.requirementNo || normalizedRequirement.id} write timed out; keeping optimistic local state.`,
          error,
        );
        return;
      }
      setRequirements(prev => prev.filter(req => req.id !== optimisticRequirement.id));
      throw error;
    }
  };

  const updateRequirement = async (id: string, updates: Partial<QuoteRequirement>) => {
    const current = requirements.find((req) => req.id === id);
    if (!current) return;
    const merged = normalizeQuoteRequirementWritePayload({ ...current, ...updates } as QuoteRequirement);
    assertQuoteRequirementWritePayload(merged);
    const optimisticRequirement = normalizeQuoteRequirementReadPayload(merged);
    writeCrossRoleQuoteRequirementHandoff([optimisticRequirement]);
    setRequirements(prev => prev.map(req => req.id === id ? optimisticRequirement : req));
    try {
      const saved = await quoteRequirementService.upsert(merged);
      if (!saved) {
        throw new Error(`QR ${current.requirementNo || id} 更新 Supabase 失败`);
      }
      assertQuoteRequirementPersistedBinding(saved as QuoteRequirement);
      const normalizedSaved = normalizeQuoteRequirementReadPayload(saved as QuoteRequirement);
      writeCrossRoleQuoteRequirementHandoff([normalizedSaved]);
      setRequirements(prev => prev.map(req => req.id === id ? normalizedSaved : req));
    } catch (error) {
      if (isTransientQuoteRequirementWriteError(error)) {
        console.warn(
          `[QuoteRequirementContext] QR ${current.requirementNo || id} update timed out; keeping optimistic local state.`,
          error,
        );
        return;
      }
      setRequirements(prev => prev.map(req => req.id === id ? current : req));
      throw error;
    }
  };

  const deleteRequirement = async (id: string) => {
    await quoteRequirementService.delete(id);
    removeCrossRoleQuoteRequirementHandoff(id);
    setRequirements(prev => prev.filter(req => req.id !== id));
  };

  const getRequirementById = (id: string) => requirements.find(req => req.id === id);

  const refreshQuoteRequirementsFromApi = React.useCallback(async () => {
    try {
      const rows = await quoteRequirementService.getAll();
      if (Array.isArray(rows)) {
        void repairLegacyQrNumbers(rows.filter(Boolean) as QuoteRequirement[]);
        setRequirements(
          mergeQuoteRequirementLists(
            readQuoteRequirementCache(),
            rows.filter(Boolean) as QuoteRequirement[],
          ).map((req) => normalizeQuoteRequirementReadPayload(req)),
        );
      }
    } catch {}
  }, [repairLegacyQrNumbers]);

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
