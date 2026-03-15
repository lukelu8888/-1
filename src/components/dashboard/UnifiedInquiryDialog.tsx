import { Fragment, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  History,
  Globe,
  Boxes,
  Plus,
  Save,
  X,
  Package,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  AlertCircle,
  Container,
  TrendingUp,
  CircleHelp,
  FileText,
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { InquiryProductHome } from './InquiryProductHome';
import { InquiryHistorySelector } from './InquiryHistorySelector';
import { MyProductsSelector } from './MyProductsSelector';
import {
  buildCustomerInquiryRequirementText,
  CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS,
  normalizeCustomerInquiryRequirementFields,
  parseCustomerInquiryRequirementText,
  type CustomerInquiryRequirementFormFields,
} from '../documents/templates/CustomerInquiryDocument';
import { toast } from 'sonner';
import { aggregateInquiryOemFromProducts, normalizeOemData } from '../../types/oem';
import { customerInquiryDraftService } from '../../lib/supabaseService';
import { tradeProductSnapshotService } from '../../lib/services/tradeProductSnapshotService';
import {
  getCustomerFacingModelNo,
  getCustomerFacingSourceLabel,
  shouldShowCustomerRefLine,
} from '../../utils/productModelDisplay';
import { getCurrentUser } from '../../utils/dataIsolation';

interface UnifiedInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInquiry: (products: any[], additionalInfo?: any) => void | Promise<void>;
  editMode?: boolean;
  existingInquiry?: any;
  onUpdateInquiry?: (updatedInquiry: any) => void | Promise<void>;
}

type ViewMode = 'selection' | 'website' | 'my_products' | 'history';
type SubmitIntent = 'create' | 'save' | 'update' | null;
const LOGO_ACCENT = '#D82018';
const SUBMIT_TIMEOUT_MS = 60000;
const NEW_INQUIRY_DRAFT_PRODUCTS_KEY = 'new_inquiry_draft_products_v1';

// Standard ERP dialog specimen.
// Reuse these tokens when aligning future task-driven dialogs to the same visual system.
const ERP_DIALOG_STYLE = {
  shell: 'flex h-[90vh] w-[1040px] max-w-[calc(100vw-48px)] min-w-0 flex-col p-0 overflow-hidden',
  header: 'border-b border-gray-200 px-8 py-4',
  body: 'overflow-y-auto px-8 py-6',
  bodyInner: 'mx-auto w-full max-w-[960px] space-y-6',
  subviewHeader: 'flex-shrink-0 border-b border-slate-200 bg-white px-8 py-4',
  subviewFrame: 'overflow-hidden bg-slate-50/30 px-0 py-0',
  subviewBody: 'mx-auto h-full w-full max-w-[1040px]',
  section: 'space-y-3',
  sectionTitle: 'flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[#1A1A1A]',
  panel: 'overflow-hidden border border-slate-200 bg-white',
  tableHead: 'py-3 text-[12px] font-semibold text-slate-600',
  summaryLabel: 'text-[12px] uppercase tracking-[0.16em] text-slate-500',
  summaryValue: 'mt-2 text-[14px] font-semibold text-[#1A1A1A]',
  footer: 'flex items-center justify-between border-t border-gray-200 bg-slate-50 px-8 py-4',
  secondaryButton: 'h-11 min-w-[132px] border-slate-300 px-5 text-[14px] font-semibold',
  primaryButton: 'h-11 min-w-[220px] justify-center gap-2.5 rounded-md px-6 text-[14px] font-semibold text-white shadow-none',
} as const;

const withSubmitTimeout = async <T,>(task: Promise<T>) => {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Request timed out. Please try again.')), SUBMIT_TIMEOUT_MS);
    }),
  ]);
};

const sanitizeRequirementEditorValues = (
  fields: CustomerInquiryRequirementFormFields
): CustomerInquiryRequirementFormFields => {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => {
      const text = String(value ?? '').trim();
      return [key, /^\d+$/.test(text) ? '' : String(value ?? '')];
    })
  ) as CustomerInquiryRequirementFormFields;
};

const getNewInquiryDraftStorageKey = () => {
  const currentUser = getCurrentUser() as any;
  const email = String(currentUser?.email || 'anonymous').trim().toLowerCase();
  return `${NEW_INQUIRY_DRAFT_PRODUCTS_KEY}:${email}`;
};

const loadDraftSelectedProducts = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getNewInquiryDraftStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistDraftSelectedProducts = (products: any[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getNewInquiryDraftStorageKey(), JSON.stringify(products));
};

const clearDraftSelectedProducts = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getNewInquiryDraftStorageKey());
};

const normalizeSelectedProductLine = (product: any) =>
  tradeProductSnapshotService.normalizeInquirySelectionProduct(product);

const normalizeSelectedProductLines = (products: any[]) =>
  Array.isArray(products) ? products.map((product) => normalizeSelectedProductLine(product)) : [];

export function UnifiedInquiryDialog({
  isOpen,
  onClose,
  onCreateInquiry,
  editMode = false,
  existingInquiry = null,
  onUpdateInquiry,
}: UnifiedInquiryDialogProps) {
  const draftHydratedRef = useRef(false);
  const draftPersistTimeoutRef = useRef<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [expandedSelectedOemIds, setExpandedSelectedOemIds] = useState<string[]>([]);
  const [customerRequirement, setCustomerRequirement] = useState<CustomerInquiryRequirementFormFields>(DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent>(null);
  
  // Track initial state for comparison in edit mode
  const [initialState, setInitialState] = useState<{
    products: any[];
    requirement: string;
  } | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(editMode);
  const currentUser = getCurrentUser() as any;
  const draftCustomerEmail = String(currentUser?.email || '').trim().toLowerCase();

  // Initialize state when editing
  useEffect(() => {
    if (editMode && existingInquiry && isOpen) {
      const products = normalizeSelectedProductLines(existingInquiry.products || []);
      const legacyRequirementText = existingInquiry.message || existingInquiry.deliveryAddress || '';
      const resolvedRequirement = existingInquiry.requirements
        ? normalizeCustomerInquiryRequirementFields(existingInquiry.requirements)
        : parseCustomerInquiryRequirementText(legacyRequirementText);
      const sanitizedRequirement = sanitizeRequirementEditorValues(resolvedRequirement);
      
      setSelectedProducts(products);
      setCustomerRequirement(sanitizedRequirement);
      setIsDraftHydrated(true);
      draftHydratedRef.current = true;
      
      // Save initial state for comparison
      setInitialState({
        products: JSON.parse(JSON.stringify(products)),
        requirement: buildCustomerInquiryRequirementText(sanitizedRequirement),
      });
    } else if (!editMode && isOpen) {
      let cancelled = false;
      draftHydratedRef.current = false;
      setIsDraftHydrated(false);
      setInitialState(null);
      setCustomerRequirement({ ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS });
      setSelectedProducts([]);

      const hydrateDraft = async () => {
        try {
          const cloudDraft = draftCustomerEmail
            ? await customerInquiryDraftService.getByCustomerEmail(draftCustomerEmail)
            : null;
          if (cancelled) return;
          if (cloudDraft?.products?.length) {
            setSelectedProducts(normalizeSelectedProductLines(cloudDraft.products));
          } else {
            setSelectedProducts([]);
          }
        } catch (error) {
          console.warn('[UnifiedInquiryDialog] Failed to load cloud inquiry draft, using local fallback.', error);
          if (!cancelled) {
            setSelectedProducts(normalizeSelectedProductLines(loadDraftSelectedProducts()));
          }
        } finally {
          if (!cancelled) {
            draftHydratedRef.current = true;
            setIsDraftHydrated(true);
          }
        }
      };

      hydrateDraft();

      return () => {
        cancelled = true;
      };
    }
  }, [draftCustomerEmail, editMode, existingInquiry, isOpen]);

  useEffect(() => {
    if (editMode || !isOpen || !isDraftHydrated || !draftHydratedRef.current) return;
    if (draftPersistTimeoutRef.current) {
      window.clearTimeout(draftPersistTimeoutRef.current);
    }

    draftPersistTimeoutRef.current = window.setTimeout(() => {
      const persistDraft = async () => {
        try {
          if (draftCustomerEmail) {
            await customerInquiryDraftService.upsert({
              customerEmail: draftCustomerEmail,
              customerUserId: currentUser?.id || null,
              companyId: currentUser?.companyId || null,
              regionCode: currentUser?.region || null,
              products: selectedProducts,
            });
            clearDraftSelectedProducts();
          }
        } catch (error) {
          console.warn('[UnifiedInquiryDialog] Failed to persist cloud inquiry draft, saving local fallback.', error);
          persistDraftSelectedProducts(selectedProducts);
        }
      };

      persistDraft();
    }, 250);

    return () => {
      if (draftPersistTimeoutRef.current) {
        window.clearTimeout(draftPersistTimeoutRef.current);
      }
    };
  }, [currentUser?.companyId, currentUser?.id, currentUser?.region, draftCustomerEmail, editMode, isDraftHydrated, isOpen, selectedProducts]);

  // Track which products have been added (by unique ID)
  const addedProductIds = new Set(selectedProducts.map(p => p.id));

  const handleAddProduct = (product: any) => {
    const normalizedProduct = normalizeSelectedProductLine({
      ...product,
      source: product.source || viewMode,
      addedFrom:
        product.addedFrom ||
        (viewMode === 'website'
          ? 'Website'
          : viewMode === 'my_products'
            ? 'My Products'
            : viewMode === 'history'
              ? 'History'
              : 'Manual Entry'),
    });

    // Check if product already exists
    if (addedProductIds.has(normalizedProduct.id)) {
      toast.error('Product already added');
      return;
    }

      setSelectedProducts(prev => [...prev, normalizedProduct]);
    
    toast.success(`${normalizedProduct.productName} added to inquiry`);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Product removed');
  };

  const toggleSelectedProductOem = (productId: string) => {
    setExpandedSelectedOemIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    const nextQuantity = Number.isNaN(parsed) ? 0 : Math.max(0, parsed);

    setSelectedProducts(prev =>
      prev.map((p) =>
        p.id === productId
          ? normalizeSelectedProductLine({ ...p, quantity: nextQuantity })
          : p,
      )
    );
  };

  const handleQuantityBlur = (productId: string) => {
    setSelectedProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const safeQuantity = Number.isFinite(p.quantity) && p.quantity > 0 ? p.quantity : 1;
        return normalizeSelectedProductLine({ ...p, quantity: safeQuantity });
      })
    );
  };

  const handleProductsFromHistory = (products: any[]) => {
    const newProducts = products
      .filter((product) => !addedProductIds.has(product.id))
      .map((product) =>
        normalizeSelectedProductLine({
          ...product,
          source: 'history',
          addedFrom: 'History',
        }),
      );

    if (newProducts.length > 0) {
      setSelectedProducts((prev) => [...prev, ...newProducts]);
      toast.success(`${newProducts.length} products imported from previous inquiry`);
    }

    setViewMode('selection');
  };

  const getCustomerFacingSourceBadgeClass = (product: any) => {
    const label = getCustomerFacingSourceLabel(product).toLowerCase();
    if (label === 'my products') {
      return 'border-slate-300 bg-slate-100 text-slate-800';
    }
    if (label === 'website') {
      return 'border-blue-200 bg-blue-50 text-blue-700';
    }
    if (label === 'history') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    return 'border-slate-300 bg-slate-100 text-slate-800';
  };

  const handleCreateInquiry = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const customerRequirementText = buildCustomerInquiryRequirementText(customerRequirement);
    const normalizedSelectedProducts = normalizeSelectedProductLines(selectedProducts);
    const normalizedOemData = aggregateInquiryOemFromProducts(normalizedSelectedProducts);

    setIsSubmitting(true);
    setSubmitIntent('create');
    try {
      await withSubmitTimeout(
        Promise.resolve(
          onCreateInquiry(normalizedSelectedProducts, {
            notes: customerRequirementText,
            deliveryAddress: '',
            requirements: { ...customerRequirement },
            oem: normalizedOemData,
          })
        )
      );

      setSelectedProducts([]);
      if (draftCustomerEmail) {
        try {
          await customerInquiryDraftService.clearByCustomerEmail(draftCustomerEmail);
        } catch (error) {
          console.warn('[UnifiedInquiryDialog] Failed to clear cloud inquiry draft after create.', error);
        }
      }
      clearDraftSelectedProducts();
      setCustomerRequirement({ ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS });
      setViewMode('selection');
      onClose();
    } catch (error) {
      console.error('Failed to create inquiry from dialog:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitIntent(null);
    }
  };

  const handleUpdateInquiry = async (intent: Exclude<SubmitIntent, 'create' | null> = 'update') => {
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const customerRequirementText = buildCustomerInquiryRequirementText(customerRequirement);
    const normalizedSelectedProducts = normalizeSelectedProductLines(selectedProducts);
    const normalizedOemData = aggregateInquiryOemFromProducts(normalizedSelectedProducts);

    const updatedInquiry = {
      products: normalizedSelectedProducts,
      notes: customerRequirementText,
      deliveryAddress: '',
      requirements: { ...customerRequirement },
      oem: normalizedOemData,
    };

    setIsSubmitting(true);
    setSubmitIntent(intent);
    try {
      await withSubmitTimeout(Promise.resolve(onUpdateInquiry?.(updatedInquiry)));

      setSelectedProducts([]);
      if (draftCustomerEmail) {
        try {
          await customerInquiryDraftService.clearByCustomerEmail(draftCustomerEmail);
        } catch (error) {
          console.warn('[UnifiedInquiryDialog] Failed to clear cloud inquiry draft after update.', error);
        }
      }
      clearDraftSelectedProducts();
      setCustomerRequirement({ ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS });
      setViewMode('selection');
      onClose();
    } catch (error) {
      console.error('Failed to update inquiry from dialog:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSubmitIntent(null);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    let hasChanges = false;
    
    if (editMode && initialState) {
      // In edit mode, check if anything changed
      const productsChanged = JSON.stringify(selectedProducts) !== JSON.stringify(initialState.products);
      const requirementChanged = buildCustomerInquiryRequirementText(customerRequirement) !== initialState.requirement;
      
      hasChanges = productsChanged || requirementChanged;
    } else if (!editMode && selectedProducts.length > 0) {
      // In create mode, warn if products are selected
      hasChanges = true;
    }
    
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        return;
      }
    }
    
    // Reset non-product transient state only. Added items stay until manually removed
    // or the inquiry is successfully submitted.
    setCustomerRequirement({ ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS });
    setViewMode('selection');
    setInitialState(null);
    onClose();
  };

  const getTotalQuantity = () => {
    return selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  };

  const getTotalValue = () => {
    return selectedProducts.reduce((sum, p) => sum + ((p.targetPrice || 0) * (p.quantity || 0)), 0);
  };

  const getRequirementTextareaRows = (value: string, baseRows = 3) =>
    Math.max(baseRows, value.split('\n').length + 1);

  // 🔥 计算货柜信息 - 使用与Container Load Planner完全相同的智能装柜算法
  const getContainerInfo = () => {
    // 标准集装箱规格（与Container Load Planner一致）
    const CONTAINER_TYPES = {
      '20GP': {
        name: '20GP',
        volume: 28, // Practical loadable CBM
        maxPayload: 25700, // kg
      },
      '40GP': {
        name: '40GP',
        volume: 67.5,
        maxPayload: 24300,
      },
      '40HQ': {
        name: '40HQ',
        volume: 68, // Practical loadable CBM
        maxPayload: 24000,
      },
      '20HV': {
        name: '20HV',
        volume: 37.4,
        maxPayload: 25500,
      },
    };

    // 准备产品列表（与Container Load Planner相同）
    const sortedProducts = selectedProducts
      .map(p => {
        const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000;
        const weight = (p.weight || 1.5);
        const totalVolume = volume * (p.quantity || 0);
        const totalWeight = weight * (p.quantity || 0);
        
        return {
          productName: p.productName,
          quantity: p.quantity || 0,
          unitVolume: volume,
          unitWeight: weight,
          totalVolume: totalVolume,
          totalWeight: totalWeight,
        };
      })
      .sort((a, b) => b.totalVolume - a.totalVolume);

    // 定义柜子优先级：优先使用小柜子
    const containerPriority: (keyof typeof CONTAINER_TYPES)[] = ['20GP', '20HV', '40GP', '40HQ'];
    
    // 装柜结果
    const containers: Array<{
      type: keyof typeof CONTAINER_TYPES;
      currentVolume: number;
      currentWeight: number;
    }> = [];

    let remainingProducts = [...sortedProducts];
    let containerIdCounter = 1;

    // FFD算法装柜
    while (remainingProducts.some(p => p.quantity > 0)) {
      // 计算剩余货物的总体积和总重量
      const remainingVolume = remainingProducts.reduce((sum, p) => sum + (p.unitVolume * p.quantity), 0);
      const remainingWeight = remainingProducts.reduce((sum, p) => sum + (p.unitWeight * p.quantity), 0);

      // 选择合适的柜子类型
      let selectedType: keyof typeof CONTAINER_TYPES = '40HQ';
      for (const type of containerPriority) {
        const spec = CONTAINER_TYPES[type];
        if (remainingVolume <= spec.volume && remainingWeight <= spec.maxPayload) {
          selectedType = type;
          break;
        }
      }

      const spec = CONTAINER_TYPES[selectedType];
      const newContainer = {
        type: selectedType,
        currentVolume: 0,
        currentWeight: 0,
        capacity: {
          volume: spec.volume,
          weight: spec.maxPayload,
        },
      };

      // FFD算法：将产品放入这个柜子
      let placedAnyProduct = false;
      remainingProducts.forEach(product => {
        if (product.quantity <= 0) return;

        const availableVolume = newContainer.capacity.volume - newContainer.currentVolume;
        const availableWeight = newContainer.capacity.weight - newContainer.currentWeight;

        const maxByVolume = Math.floor(availableVolume / product.unitVolume);
        const maxByWeight = Math.floor(availableWeight / product.unitWeight);
        const canFit = Math.min(maxByVolume, maxByWeight, product.quantity);

        if (canFit > 0) {
          newContainer.currentVolume += product.unitVolume * canFit;
          newContainer.currentWeight += product.unitWeight * canFit;
          product.quantity -= canFit;
          placedAnyProduct = true;
        }
      });

      if (!placedAnyProduct) {
        break;
      }

      containers.push(newContainer);

      // 防止无限循环
      if (containers.length > 20) {
        console.error('Too many containers generated, breaking loop');
        break;
      }
    }

    // 统计各种柜型的数量
    const containerCounts: { [key: string]: number } = {};
    containers.forEach(container => {
      containerCounts[container.type] = (containerCounts[container.type] || 0) + 1;
    });

    // 计算总体积和总重量
    const totalCBM = selectedProducts.reduce((sum, p) => {
      const volume = ((p.length || 30) * (p.width || 30) * (p.height || 30)) / 1000000;
      return sum + (volume * (p.quantity || 0));
    }, 0);

    const totalWeight = selectedProducts.reduce((sum, p) => {
      const weight = (p.weight || 1.5);
      return sum + (weight * (p.quantity || 0));
    }, 0);

    // 计算总柜子容量
    const totalContainerVolume = containers.reduce((sum, c) => {
      const spec = CONTAINER_TYPES[c.type];
      return sum + spec.volume;
    }, 0);

    const utilizationRate = totalContainerVolume > 0 ? ((totalCBM / totalContainerVolume) * 100) : 0;

    // 生成推荐文本
    const recommendedText = Object.entries(containerCounts)
      .map(([type, count]) => `${count}×${type}`)
      .join(' + ');

    return {
      totalCBM: totalCBM.toFixed(2),
      totalWeight: totalWeight.toFixed(0),
      recommendedText: recommendedText || '0×Container',
      containerCount: containers.length,
      utilizationRate: utilizationRate.toFixed(1),
      containerBreakdown: containerCounts,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent
        hideClose={viewMode === 'website' || viewMode === 'my_products' || viewMode === 'history'}
        className={`${
          viewMode === 'website'
            ? '!left-3 !top-3 !translate-x-0 !translate-y-0 !h-[calc(100dvh-24px)] !w-[calc(100vw-24px)] !max-w-none !p-0 overflow-hidden rounded-xl'
            : `${ERP_DIALOG_STYLE.shell} ${viewMode === 'selection' ? 'max-h-[95vh]' : 'h-[90vh]'}`
        }`}
        style={{
          fontFamily: 'var(--hd-font)',
          ...(viewMode === 'website'
            ? {
                transform: 'none',
                margin: 0,
              }
            : {
                width: '1040px',
                maxWidth: 'calc(100vw - 48px)',
              }),
        }}
      >
        {viewMode === 'selection' && (
          <TooltipProvider delayDuration={150}>
          <>
            <DialogHeader
              className={ERP_DIALOG_STYLE.header}
              style={{ backgroundColor: LOGO_ACCENT }}
            >
              <DialogTitle className="text-[20px] font-semibold tracking-tight text-white">
                {editMode ? 'Edit Inquiry' : 'Create New Inquiry'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[14px] leading-5 text-white/90">
                {editMode 
                  ? 'Modify your inquiry by adding or removing products from 3 sources'
                  : 'Choose how you want to add products to your inquiry'
                }
              </DialogDescription>
            </DialogHeader>

            <div className={ERP_DIALOG_STYLE.body} style={{ maxHeight: 'calc(95vh - 252px)' }}>
              <div className={ERP_DIALOG_STYLE.bodyInner}>
                <section className={ERP_DIALOG_STYLE.section}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4.5 w-4.5" style={{ color: LOGO_ACCENT }} />
                      <div className="text-[14px] font-semibold tracking-tight text-[#1A1A1A]">
                        Product Source
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setViewMode('history')}
                      className="h-9 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <History className="mr-2 h-4 w-4" />
                      Import from Previous Inquiry
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-white">
                    {[
                  {
                    key: 'website',
                    title: 'Select from Website',
                    description: 'Browse and select products from catalog',
                    icon: Globe,
                    accentStyle: { backgroundColor: LOGO_ACCENT },
                  },
                  {
                    key: 'my_products',
                    title: 'My Products',
                    description: 'Select from your saved product packages, drawings, and technical files',
                    icon: Boxes,
                    accent: 'bg-[#2E7D32]',
                    hoverAccent: 'group-hover:border-[#2E7D32]',
                    badge: 'Product Packages',
                  },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setViewMode(option.key as ViewMode)}
                      className="group w-full border-r border-slate-200 text-left transition-colors hover:bg-slate-100 last:border-r-0"
                    >
                      <div className="flex min-h-[68px] items-center gap-3 px-4 py-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                          style={option.accentStyle}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-[14px] font-semibold tracking-tight text-[#1A1A1A]">{option.title}</div>
                            {option.badge ? (
                              <Badge className="border border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 shadow-none">
                                {option.badge}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="mt-0.5 text-[12px] leading-5 text-slate-500">{option.description}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
                  </div>
                </section>

              {/* Selected Products List */}
              {selectedProducts.length > 0 && (
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className={ERP_DIALOG_STYLE.sectionTitle}>
                      <ShoppingCart className="h-4.5 w-4.5" style={{ color: LOGO_ACCENT }} />
                      Selected Products ({selectedProducts.length})
                      </h3>
                    </div>

                  {/* 🔥 Products Table */}
                  <div className={ERP_DIALOG_STYLE.panel}>
                    <Table className="table-fixed">
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className={`w-[16px] px-0 text-center ${ERP_DIALOG_STYLE.tableHead}`}>Seq#</TableHead>
                          <TableHead className={`w-[64px] ${ERP_DIALOG_STYLE.tableHead}`}>Model#</TableHead>
                          <TableHead className={`w-[72px] ${ERP_DIALOG_STYLE.tableHead}`}>Image</TableHead>
                          <TableHead className={`w-[388px] ${ERP_DIALOG_STYLE.tableHead}`}>Product</TableHead>
                          <TableHead className={`w-[112px] text-center ${ERP_DIALOG_STYLE.tableHead}`}>Qty</TableHead>
                          <TableHead className={`w-[40px] text-center ${ERP_DIALOG_STYLE.tableHead}`}>Unit</TableHead>
                          <TableHead className={`w-[80px] text-right ${ERP_DIALOG_STYLE.tableHead}`}>Unit Price</TableHead>
                          <TableHead className={`w-[112px] text-right ${ERP_DIALOG_STYLE.tableHead}`}>Subtotal</TableHead>
                          <TableHead className={`w-[96px] ${ERP_DIALOG_STYLE.tableHead}`}>Source</TableHead>
                          <TableHead className={`w-[40px] text-center ${ERP_DIALOG_STYLE.tableHead}`}>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((product, index) => {
                          const itemOem = normalizeOemData(product.oem);
                          const isOemProduct = Boolean(product.itemType === 'oem_custom' && itemOem.enabled);
                          const isExpanded = expandedSelectedOemIds.includes(product.id);
                          return (
                          <Fragment key={product.id}>
                          <TableRow className="hover:bg-orange-50/40">
                            <TableCell className="w-[16px] px-0 py-3 text-center">
                              <div className="text-[12px] font-medium text-slate-600">{index + 1}</div>
                            </TableCell>

                            <TableCell className="w-[64px] py-3">
                              <div className="text-[12px] font-medium text-slate-700">
                                {getCustomerFacingModelNo(product)}
                              </div>
                            </TableCell>

                            {/* Product Image */}
                            <TableCell className="w-[72px] py-3">
                              <div className="h-11 w-11 overflow-hidden rounded-lg bg-gray-100">
                                {product.image ? (
                                  <ImageWithFallback
                                    src={product.image}
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Product Name */}
                            <TableCell className="w-[388px] overflow-hidden py-3">
                              <div className="flex items-center gap-2">
                                <div className="truncate text-[12px] font-semibold tracking-tight text-[#1A1A1A]">
                                  {product.productName}
                                </div>
                                {isOemProduct ? (
                                  <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[10px] text-orange-700">
                                    OEM
                                  </Badge>
                                ) : null}
                              </div>
                              {shouldShowCustomerRefLine(product) ? (
                                <div className="mt-0.5 truncate text-[12px] leading-5 text-slate-500">
                                  Customer Ref: {product.customerModelNo || product.customerModelNO || product.customer_model_no}
                                </div>
                              ) : product.specification ? (
                                <div className="mt-0.5 truncate text-[12px] leading-5 text-slate-500">
                                  {product.specification}
                                </div>
                              ) : null}
                              {isOemProduct ? (
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
                                  <span>{itemOem.files.length} file{itemOem.files.length === 1 ? '' : 's'}</span>
                                  {itemOem.tooling.toolingCostInvolved ? <span>Mold plan</span> : null}
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectedProductOem(product.id)}
                                    className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
                                  >
                                    {isExpanded ? 'Hide OEM' : 'View OEM'}
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                  </button>
                                </div>
                              ) : null}
                            </TableCell>

                            {/* Quantity */}
                            <TableCell className="w-[112px] py-3 text-center">
                              <div className="mx-auto flex h-8 w-[96px] items-center justify-center rounded-lg border border-slate-300 bg-white px-2">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={product.quantity ?? 1}
                                  onChange={(e) => handleQuantityChange(product.id, e.target.value.replace(/[^\d]/g, ''))}
                                  onBlur={() => handleQuantityBlur(product.id)}
                                  className="h-full w-full border-0 bg-transparent px-0 text-center text-[12px] shadow-none focus-visible:ring-0"
                                />
                              </div>
                            </TableCell>

                            <TableCell className="w-[40px] py-3 text-center">
                              <div className="text-[12px] text-slate-500">{product.unit || 'pcs'}</div>
                            </TableCell>

                            {/* Unit Price */}
                            <TableCell className="w-[80px] py-3 text-right">
                              <div className="text-[12px] font-semibold" style={{ color: LOGO_ACCENT }}>
                                ${product.targetPrice?.toFixed(2) || '0.00'}
                              </div>
                            </TableCell>

                            {/* Subtotal */}
                            <TableCell className="w-[112px] py-3 text-right">
                              <div className="text-[12px] font-semibold text-[#1A1A1A]">
                                ${((product.targetPrice || 0) * (product.quantity || 0)).toFixed(2)}
                              </div>
                            </TableCell>

                            {/* Source */}
                            <TableCell className="w-[96px] py-3">
                              <Badge
                                variant="outline"
                                className={`rounded-md px-2.5 py-1 text-[12px] font-medium ${getCustomerFacingSourceBadgeClass(product)}`}
                              >
                                {getCustomerFacingSourceLabel(product)}
                              </Badge>
                            </TableCell>

                            {/* Remove Button */}
                            <TableCell className="w-[40px] py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(product.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isOemProduct && isExpanded ? (
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                              <TableCell colSpan={10} className="px-5 py-4">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                                  <section className="space-y-3">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                      OEM Files
                                    </div>
                                    {itemOem.files.length > 0 ? (
                                      <div className="space-y-2">
                                        {itemOem.files.map((file: any, fileIndex: number) => (
                                          <div key={file.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                            <div className="text-[13px] font-semibold text-slate-800">
                                              {fileIndex + 1}. {file.fileName}
                                            </div>
                                            <div className="mt-1 text-[11px] text-slate-500">
                                              {file.fileType || 'Unknown type'} · {(Number(file.fileSize || 0) / 1024).toFixed(1)} KB
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-[12px] text-slate-500">
                                        No OEM files attached.
                                      </div>
                                    )}
                                  </section>

                                  <div className="space-y-4">
                                    <section>
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Specifications / Description
                                      </div>
                                      <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-[12px] leading-6 text-slate-700 whitespace-pre-wrap">
                                        {itemOem.overallRequirementNote || 'No OEM description provided.'}
                                      </div>
                                    </section>

                                    <section>
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        Mold / Quantity Plan
                                      </div>
                                      <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-[12px] leading-6 text-slate-700">
                                        {itemOem.tooling.toolingCostInvolved ? (
                                          <>
                                            <div>1st order quantity: {itemOem.tooling.firstOrderQuantity || '-'}</div>
                                            <div>Annual quantity: {itemOem.tooling.annualQuantity || '-'}</div>
                                            <div>3-year Quantity: {itemOem.tooling.quantityWithinThreeYears || '-'}</div>
                                            <div>Mold lifetime: {itemOem.tooling.moldLifetime || '-'}</div>
                                          </>
                                        ) : (
                                          <div>No mold / quantity plan submitted.</div>
                                        )}
                                      </div>
                                    </section>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                          </Fragment>
                        )})}
                      </TableBody>
                    </Table>

                    {/* Total Summary Bar */}
                    <div className="border-t border-slate-200 bg-stone-50 px-5 py-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className={ERP_DIALOG_STYLE.summaryLabel}>Total Items</div>
                          <div className={ERP_DIALOG_STYLE.summaryValue}>{selectedProducts.length}</div>
                        </div>
                        <div>
                          <div className={ERP_DIALOG_STYLE.summaryLabel}>Total Quantity</div>
                          <div className={ERP_DIALOG_STYLE.summaryValue}>{getTotalQuantity()} pcs</div>
                        </div>
                        <div className="text-right">
                          <div className={ERP_DIALOG_STYLE.summaryLabel}>Estimated Total Value</div>
                          <div className="mt-2 text-[14px] font-semibold tracking-tight" style={{ color: LOGO_ACCENT }}>
                            ${getTotalValue().toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </section>

                  {/* 🔥 Container Information Card */}
                  {(() => {
                    const containerInfo = getContainerInfo();
                    return (
                      <section className={ERP_DIALOG_STYLE.section}>
                        <div>
                          <div className="flex items-center gap-2">
                            <Container className="h-4.5 w-4.5 text-blue-600" />
                            <h4 className="text-[14px] font-semibold tracking-tight text-[#1A1A1A]">Container Load Planning</h4>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-slate-600 hover:border-slate-700 hover:text-slate-800"
                                >
                                  <CircleHelp className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[280px] text-xs leading-5">
                                Container recommendations follow practical loading capacity. 20GP: about 28 CBM / 25,700 kg max. 40HQ: about 68 CBM / 24,000 kg max.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <div className={ERP_DIALOG_STYLE.panel}>
                          <div className="grid grid-cols-4 divide-x divide-slate-200">
                            <div className="px-4 py-3">
                              <div className="text-[12px] uppercase tracking-[0.16em] text-slate-500">Total Volume</div>
                              <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-[14px] font-semibold text-blue-600">{containerInfo.totalCBM}</span>
                                <span className="text-[12px] text-slate-500">CBM</span>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-[12px] uppercase tracking-[0.16em] text-slate-500">Total Weight</div>
                              <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-[14px] font-semibold text-blue-600">{containerInfo.totalWeight}</span>
                                <span className="text-[12px] text-slate-500">kg</span>
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-[12px] uppercase tracking-[0.16em] text-slate-500">Recommended</div>
                              <div className="mt-1 text-[14px] font-semibold text-blue-600">
                                {containerInfo.recommendedText}
                              </div>
                            </div>
                            <div className="px-4 py-3">
                              <div className="text-[12px] uppercase tracking-[0.16em] text-slate-500">Utilization</div>
                              <div className="mt-1 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-[14px] font-semibold text-green-600">{containerInfo.utilizationRate}%</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </section>
                    );
                  })()}

                  {/* Additional Information */}
                  <section className={ERP_DIALOG_STYLE.section}>
                    <div>
                      <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight text-slate-700">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <label>Trading Requirements</label>
                      </div>
                    </div>
                    <div className={ERP_DIALOG_STYLE.panel}>
                          {CUSTOMER_INQUIRY_REQUIREMENT_FIELDS.map((field, index) => {
                            const value = customerRequirement[field.key];
                            const isOtherRequirements = field.key === 'otherRequirements';
                            const textareaRows = getRequirementTextareaRows(
                              value,
                              isOtherRequirements ? field.rows || 4 : 1,
                            );

                            return (
                              <div
                                key={field.key}
                                className={`grid gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 ${isOtherRequirements ? 'md:grid-cols-[176px_minmax(0,1fr)] md:items-start' : 'md:grid-cols-[176px_minmax(0,1fr)] md:items-center'}`}
                              >
                                <div className={isOtherRequirements ? 'md:pt-0.5' : ''}>
                                  <div className="flex items-center gap-2">
                                    <label className="block text-[12px] font-semibold tracking-tight text-[#1A1A1A]">
                                      {index + 1}. {field.sourceLabel}
                                    </label>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-500 text-slate-600 hover:border-slate-700 hover:text-slate-800"
                                        >
                                          <CircleHelp className="h-3 w-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[240px] text-xs leading-5">
                                        {field.description}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div>
                                  <Textarea
                                    value={value}
                                    onChange={(e) =>
                                      setCustomerRequirement((prev) => ({ ...prev, [field.key]: e.target.value }))
                                    }
                                    rows={textareaRows}
                                    placeholder={field.placeholder}
                                    style={{ fieldSizing: 'fixed' as any }}
                                    className={`resize-y whitespace-pre-wrap rounded-md border-slate-300 bg-white text-[14px] leading-6 placeholder:text-slate-400 ${
                                      isOtherRequirements ? 'min-h-[104px]' : 'min-h-[40px]'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  </section>

                </div>
              )}

              {selectedProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-[14px] font-semibold text-slate-700">No products selected yet</p>
                  <p className="mt-1 text-[12px] text-slate-500">Choose a method above to start adding products</p>
                </div>
              )}
            </div>
            </div>

            {/* Footer Actions */}
            <div className={ERP_DIALOG_STYLE.footer}>
              <div className="text-[12px] text-slate-600">
                {selectedProducts.length > 0 ? (
                  <span>
                    <strong>{selectedProducts.length}</strong> products selected
                  </span>
                ) : (
                  <span>Select products to create inquiry</span>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className={ERP_DIALOG_STYLE.secondaryButton}
                >
                  Cancel
                </Button>
                {editMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateInquiry('save')}
                      disabled={isSubmitting}
                      className={ERP_DIALOG_STYLE.secondaryButton}
                    >
                      <Save className="w-4 h-4" />
                      {submitIntent === 'save' ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      onClick={() => handleUpdateInquiry('update')}
                      disabled={isSubmitting}
                      className={ERP_DIALOG_STYLE.primaryButton}
                      style={{ backgroundColor: LOGO_ACCENT }}
                    >
                      <Plus className="w-4 h-4" />
                      {submitIntent === 'update' ? 'Updating...' : 'Update Inquiry'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleCreateInquiry}
                    disabled={isSubmitting}
                    className={ERP_DIALOG_STYLE.primaryButton}
                    style={{ backgroundColor: LOGO_ACCENT }}
                  >
                    <Plus className="w-4 h-4" />
                    {submitIntent === 'create' ? 'Creating...' : 'Create Inquiry'}
                  </Button>
                )}
              </div>
            </div>
          </>
          </TooltipProvider>
        )}

        {viewMode === 'website' && (
          <>
            <DialogHeader className={ERP_DIALOG_STYLE.subviewHeader}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <DialogTitle className="text-[20px]" style={{ color: LOGO_ACCENT }}>Select from Website</DialogTitle>
                  <DialogDescription className="mt-0.5 text-[13px] text-slate-600">
                    Browse our product catalog
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('selection')}
                    className="h-9 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Back to Inquiry ({selectedProducts.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className={ERP_DIALOG_STYLE.subviewFrame} style={{ height: 'calc(90vh - 89px)' }}>
              <div className={ERP_DIALOG_STYLE.subviewBody}>
                <InquiryProductHome
                  onAddProduct={handleAddProduct}
                  addedProductIds={addedProductIds}
                  onSelectCategory={() => {}}
                />
              </div>
            </div>
          </>
        )}

        {viewMode === 'history' && (
          <>
            <DialogHeader className={ERP_DIALOG_STYLE.subviewHeader}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <DialogTitle className="text-[20px]" style={{ color: LOGO_ACCENT }}>Import from Previous Inquiry</DialogTitle>
                  <DialogDescription className="mt-0.5 text-[13px] text-slate-600">
                    Bulk import products from one of your earlier inquiries
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('selection')}
                    className="h-9 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Back to Inquiry ({selectedProducts.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div className={ERP_DIALOG_STYLE.subviewFrame} style={{ height: 'calc(90vh - 89px)' }}>
              <div className={ERP_DIALOG_STYLE.subviewBody}>
                <InquiryHistorySelector
                  onSelectProducts={handleProductsFromHistory}
                  onCancel={() => setViewMode('selection')}
                />
              </div>
            </div>
          </>
        )}

        {viewMode === 'my_products' && (
          <>
            <DialogHeader className={ERP_DIALOG_STYLE.subviewHeader}>
              <div className="flex items-start justify-between gap-6">
                <div>
                  <DialogTitle className="text-[20px]" style={{ color: LOGO_ACCENT }}>My Products</DialogTitle>
                  <DialogDescription className="mt-0.5 text-[13px] text-slate-600">
                    Select saved product packages from your product library
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('selection')}
                    className="h-9 border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                    Back to Inquiry ({selectedProducts.length})
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    className="h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </DialogHeader>
            <div
              className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 px-0 py-0"
              style={{ scrollbarGutter: 'stable' }}
            >
              <div className={ERP_DIALOG_STYLE.subviewBody}>
                <MyProductsSelector
                  onAddProduct={handleAddProduct}
                  addedProductIds={addedProductIds}
                />
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
