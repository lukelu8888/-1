import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpDown,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Pencil,
  Gift,
  Megaphone,
  Percent,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProductSpec } from '../../data/productData';
import {
  isWebsiteDealProduct,
  getProductPublishStatus,
  getProductPublishType,
  getProductMoq,
  getProductOriginalPrice,
  getProductDiscountLabel,
  getProductSpecValue,
  getProductUnit,
  getProductQuantityStep,
} from '../../lib/productPublication';
import {
  fetchAllProducts,
  upsertWebsiteCatalogProduct,
} from '../../lib/services/productCatalogService';
import { fetchCategoryTree, type CategoryNode } from '../../lib/services/categoryTreeService';
import { productMasterService } from '../../lib/supabaseService';
import {
  deletePromotionCampaign,
  DEFAULT_PROMOTION_DISPLAY_CONFIG,
  loadPromotionCampaignsFromDatabase,
  persistPromotionCampaign,
  PROMOTION_CAMPAIGNS_UPDATED_EVENT,
  type PromotionCampaignPublicationStatus,
  type PromotionCampaignProductOffer,
  type PromotionCampaignDisplayConfig,
} from '../../lib/promotionCampaigns';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────

type DiscountType = 'percent' | 'amount';

type DealBadge =
  | 'Hot Deal'
  | 'Special Buy'
  | 'Clearance'
  | 'Bundle'
  | 'New Arrival'
  | 'Best Value'
  | 'Flash Sale';

interface DealForm {
  productId: string;
  discountType: DiscountType;
  discountValue: string;   // % or absolute amount
  dealLabel: string;       // e.g. "Save 20%"
  dealBadge: DealBadge | '';
  validUntil: string;      // YYYY-MM-DD
  displayPriority: string; // lower = higher on page
}

const BADGE_COLORS: Record<DealBadge, string> = {
  'Hot Deal': 'bg-red-100 text-red-700',
  'Special Buy': 'bg-orange-100 text-orange-700',
  'Clearance': 'bg-yellow-100 text-yellow-800',
  'Bundle': 'bg-blue-100 text-blue-700',
  'New Arrival': 'bg-green-100 text-green-700',
  'Best Value': 'bg-purple-100 text-purple-700',
  'Flash Sale': 'bg-pink-100 text-pink-700',
};

const BADGE_OPTIONS: DealBadge[] = [
  'Hot Deal', 'Special Buy', 'Clearance', 'Bundle', 'New Arrival', 'Best Value', 'Flash Sale',
];

// 跨区域状态提示用
const REGION_LABELS: Record<string, { name: string; flag: string }> = {
  NA: { name: '北美', flag: '🇺🇸' },
  SA: { name: '南美', flag: '🇧🇷' },
  EA: { name: '欧非', flag: '🇪🇺' },
};

// ─── Campaign Types ───────────────────────────────────────────────────────────

type CampaignType = 'weekly' | 'flash' | 'seasonal' | 'container' | 'clearance' | 'holiday';
type CampaignStatus = 'scheduled' | 'active' | 'ended';

interface Campaign {
  id: string;
  regionCode: string;
  name: string;
  type: CampaignType;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  headline: string;
  description: string;
  ctaText: string;
  bannerColor: string;
  productIds: string[];
  displayConfig: PromotionCampaignDisplayConfig;
  publicationStatus: PromotionCampaignPublicationStatus;
  publishedAt: string | null;
  createdAt: string;
}

const CAMPAIGN_TYPES: { value: CampaignType; label: string; icon: string; color: string }[] = [
  { value: 'weekly',    label: 'Weekly Deals',   icon: '📅', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'flash',     label: 'Flash Deals',     icon: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'seasonal',  label: 'Seasonal Deals',  icon: '🍂', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'container', label: 'Container Deals', icon: '🚢', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'clearance', label: 'Clearance Deals', icon: '🔖', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'holiday',   label: 'Holiday Deals',   icon: '🎉', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

const BANNER_COLORS = [
  { value: 'from-red-600 to-orange-500',    label: '红橙渐变' },
  { value: 'from-blue-600 to-cyan-500',     label: '蓝青渐变' },
  { value: 'from-purple-600 to-pink-500',   label: '紫粉渐变' },
  { value: 'from-green-600 to-teal-500',    label: '绿青渐变' },
  { value: 'from-gray-800 to-gray-600',     label: '深灰' },
];

type CampaignSuggestionGroup =
  | 'pro-supply'
  | 'bulk-buy'
  | 'contractor'
  | 'jobsite'
  | 'volume'
  | 'replenishment'
  | 'project'
  | 'wholesale'
  | 'trade-partner'
  | 'container';

const CAMPAIGN_NAME_PRESETS: { name: string; type: CampaignType; group: CampaignSuggestionGroup }[] = [
  { name: 'Pro Supply Savings Week', type: 'weekly', group: 'pro-supply' },
  { name: 'Bulk Buy Event', type: 'flash', group: 'bulk-buy' },
  { name: 'Contractor Deal Days', type: 'weekly', group: 'contractor' },
  { name: 'Jobsite Essentials Sale', type: 'seasonal', group: 'jobsite' },
  { name: 'Volume Purchase Savings', type: 'weekly', group: 'volume' },
  { name: 'Pro Replenishment Week', type: 'weekly', group: 'replenishment' },
  { name: 'Project Supply Event', type: 'seasonal', group: 'project' },
  { name: 'Wholesale Value Week', type: 'weekly', group: 'wholesale' },
  { name: 'Trade Partner Specials', type: 'weekly', group: 'trade-partner' },
  { name: 'Container Load Savings', type: 'container', group: 'container' },
];

const CAMPAIGN_HEADLINE_SUGGESTIONS_BY_GROUP: Record<CampaignSuggestionGroup, string[]> = {
  'pro-supply': [
    'Pro-Grade Supply Deals for Repeat Buyers',
    'Reliable Products at Better B2B Pricing',
    'Stock Up on Essentials for Your Trade Customers',
    'Weekly Savings for Professional Purchasing Teams',
    'Built for Pros, Priced for Volume Orders',
  ],
  'bulk-buy': [
    'Bulk Order Deals on Selected High-Demand SKUs',
    'Save More When You Buy by the Case or Pallet',
    'Limited-Time Pricing for Larger Purchase Orders',
    'B2B Bulk Savings for Faster Inventory Turns',
    'Volume-Ready Offers for Growing Buyers',
  ],
  contractor: [
    'Contractor Deals for Every Active Jobsite',
    'Pro Pricing on Materials and Worksite Essentials',
    'Built for Contractors Who Need Reliable Supply',
    'Job-Ready Products at Trade-Friendly Pricing',
    'Selected Deals for Contractor Procurement Teams',
  ],
  jobsite: [
    'Jobsite Essentials at Limited-Time Pricing',
    'Keep Projects Moving with Better Supply Costs',
    'Worksite-Ready Products for Faster Purchasing',
    'Daily-Use Essentials for Crews and Project Buyers',
    'Practical Deals for On-Site Supply Planning',
  ],
  volume: [
    'Volume Purchase Savings on Proven Products',
    'Better Margins Start with Bigger Orders',
    'Discounted SKUs for Repeat Volume Buyers',
    'Save More Across Larger B2B Orders',
    'High-Volume Pricing for Active Sales Channels',
  ],
  replenishment: [
    'Replenishment Deals for Faster Inventory Recovery',
    'Restock Core SKUs with Better Weekly Pricing',
    'Keep Shelves Ready with Reliable B2B Supply',
    'Priority Savings for Repeat Replenishment Orders',
    'Fast-Moving SKUs Priced for Ongoing Restock',
  ],
  project: [
    'Project Supply Offers for Planned Purchases',
    'Source More for Upcoming Commercial Projects',
    'Selected Deals for Project-Based Procurement',
    'Keep Project Budgets on Track with B2B Savings',
    'Procurement-Ready Products for Your Next Build',
  ],
  wholesale: [
    'Wholesale Value on Selected B2B Products',
    'Better Cost Control for Wholesale Buyers',
    'Value-Driven Deals for Retail and Distribution',
    'Selected SKUs Priced for Wholesale Growth',
    'Wholesale Savings Built for Margin Protection',
  ],
  'trade-partner': [
    'Special Pricing for Trade Partners',
    'Partner-Only Deals on Selected Product Lines',
    'Preferred B2B Offers for Active Trade Buyers',
    'Strengthen Your Channel with Better Product Costs',
    'Trade Partner Specials for Repeat Orders',
  ],
  container: [
    'Container Load Savings for Import Buyers',
    'Full-Container Deals on Selected Product Lines',
    'Container-Ready Offers for Better Landed Cost',
    'Factory-Direct Pricing for Consolidated Shipments',
    'Save More with Container-Friendly Assortments',
  ],
};

const CAMPAIGN_DESCRIPTION_SUGGESTIONS_BY_GROUP: Record<CampaignSuggestionGroup, string[]> = {
  'pro-supply': [
    'Curated for professional buyers who need reliable supply, repeat ordering, and predictable product costs.',
    'Use this campaign to source pro-grade products for retail shelves, dealer channels, and trade customers.',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.',
    'Designed to help purchasing teams protect margin while keeping key products available.',
    'A practical weekly offer for buyers sourcing dependable products across multiple categories.',
  ],
  'bulk-buy': [
    'Built for buyers placing larger orders, with selected products priced to support stronger unit economics.',
    'Use these deals to plan pallet, case, or multi-SKU purchases with better landed cost visibility.',
    'Selected SKUs are discounted for bulk buyers who need dependable supply and faster sourcing cycles.',
    'Ideal for distributors and retailers preparing larger replenishment or seasonal purchase orders.',
    'Increase order scale while keeping procurement cost under control during the offer window.',
  ],
  contractor: [
    'Selected products support contractor purchasing needs across active jobsites and recurring project work.',
    'Use this event to source reliable materials and essentials for professional trade customers.',
    'Designed for buyers serving contractors who need practical products, steady supply, and better pricing.',
    'Help your contractor channel stay project-ready with discounted products for repeat demand.',
    'A focused deal set for procurement teams buying for crews, service teams, and jobsite supply.',
  ],
  jobsite: [
    'Practical products selected for worksite demand, fast purchasing decisions, and dependable daily use.',
    'Use this sale to source essentials that help projects stay supplied without stretching budgets.',
    'Designed for project buyers and distributors supporting crews, contractors, and maintenance teams.',
    'Selected deals help keep jobsite supply moving while improving cost control on repeat items.',
    'A focused promotion for products that support active work, repairs, installations, and project execution.',
  ],
  volume: [
    'Selected products are priced for higher order quantities and repeat B2B purchasing cycles.',
    'Use this campaign to improve margin on proven SKUs across larger orders and active sales channels.',
    'Built for distributors, retailers, and project buyers looking to scale purchasing with better cost control.',
    'A volume-focused offer that helps turn larger commitments into stronger procurement value.',
    'Plan bigger orders with selected SKUs designed for dependable supply and competitive pricing.',
  ],
  replenishment: [
    'Restock fast-moving products with selected offers designed for recurring replenishment needs.',
    'Use this campaign to keep shelves, warehouses, or project supply points ready for demand.',
    'Selected SKUs support repeat purchasing cycles with better pricing and practical availability planning.',
    'A replenishment-focused offer for buyers who need dependable supply across active product lines.',
    'Plan your next restock with curated deals that help reduce sourcing friction and protect margin.',
  ],
  project: [
    'Selected products support planned project purchasing with better pricing during the campaign window.',
    'Use this event to source products for upcoming builds, installations, repairs, or commercial jobs.',
    'Designed for procurement teams managing project budgets, product availability, and supplier consistency.',
    'A project-focused offer that helps buyers secure useful SKUs before procurement deadlines.',
    'Plan your next project order with curated B2B deals across practical product categories.',
  ],
  wholesale: [
    'Curated wholesale deals help buyers improve cost control across selected products and categories.',
    'Use this value week to source products for retail, distribution, and repeat B2B sales channels.',
    'Selected SKUs are priced to support better margin, stronger offers, and dependable replenishment.',
    'Designed for wholesale buyers looking for practical products with clear pricing advantages.',
    'A focused value campaign for buyers who need competitive costs without changing sourcing workflows.',
  ],
  'trade-partner': [
    'Selected offers are designed for trade partners managing recurring orders and customer demand.',
    'Use these specials to strengthen your product mix while improving cost control on selected SKUs.',
    'Partner-focused pricing supports repeat purchasing, channel growth, and practical replenishment planning.',
    'Designed for active B2B accounts sourcing products for resale, projects, and professional customers.',
    'A targeted partner promotion for buyers who need reliable products and trade-friendly pricing.',
  ],
  container: [
    'Plan consolidated shipments with selected products priced for container-friendly purchasing.',
    'Use this campaign to improve landed cost on larger orders and factory-direct sourcing plans.',
    'Selected SKUs support import buyers who need container-ready assortments and better volume pricing.',
    'Designed for buyers coordinating full-container or mixed-container replenishment across categories.',
    'Lock in better pricing on shipment-ready products before the container offer window closes.',
  ],
};

const DEFAULT_CAMPAIGN_SUGGESTION_GROUP: CampaignSuggestionGroup = 'wholesale';

const CAMPAIGNS_STORAGE_KEY = 'cosun_promotion_campaigns_v1';

function cacheCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campaigns));
  window.dispatchEvent(new Event(PROMOTION_CAMPAIGNS_UPDATED_EVENT));
}

function getCampaignStatus(c: Campaign): CampaignStatus {
  const now = Date.now();
  const start = new Date(c.startDate).getTime();
  const end = new Date(c.endDate).getTime() + 86_400_000; // include end day
  if (now < start) return 'scheduled';
  if (now > end) return 'ended';
  return 'active';
}

function getCampaignRemainingLabel(endDate: string) {
  if (!endDate) return 'select an end date';
  const totalMinutes = Math.max(Math.floor((new Date(endDate).getTime() + 86_400_000 - Date.now()) / 60_000), 0);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m`;
}

function genId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

type ProductMasterRecord = {
  id?: string | null;
  internalModelNo?: string | null;
  modelNo?: string | null;
  regionCode?: string | null;
  productName?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  status?: string | null;
};

const normalizeCandidateText = (value: unknown) => String(value ?? '').trim();

const normalizeCandidateKey = (value: unknown) => normalizeCandidateText(value).toLowerCase();

const normalizePromotionRegionCode = (value: unknown) => {
  const raw = normalizeCandidateText(value);
  if (!raw) return 'NA';
  const normalized = raw.toLowerCase();
  if (normalized === 'north america' || normalized === 'north-america') return 'NA';
  if (normalized === 'south america' || normalized === 'south-america') return 'SA';
  if (normalized === 'europe & africa' || normalized === 'emea') return 'EA';
  return raw.toUpperCase();
};

const findFirstLeafCategoryId = (nodes: CategoryNode[]): string => {
  for (const node of nodes) {
    if (!node.children.length) return node.id;
    const childLeafId = findFirstLeafCategoryId(node.children);
    if (childLeafId) return childLeafId;
  }
  return '';
};

function mapMasterProductToPromotionCandidate(
  product: ProductMasterRecord,
  regionCode: string,
  fallbackCategoryId: string,
): ProductSpec | null {
  const model = normalizeCandidateText(product.internalModelNo || product.modelNo || product.id);
  const name = normalizeCandidateText(product.productName || product.description || model);
  if (!model || !name) return null;

  return {
    id: normalizeCandidateText(product.id || model),
    categoryId: fallbackCategoryId,
    name,
    model,
    image: normalizeCandidateText(product.imageUrl),
    regionCode,
    price: 0,
    netWeight: 0,
    grossWeight: 0,
    unitsPerCarton: 1,
    cartonDimensions: { length: 0, width: 0, height: 0 },
    cartonNetWeight: 0,
    cartonGrossWeight: 0,
    specifications: {
      'Product Source': '产品库',
      'Internal Model No': model,
      Description: normalizeCandidateText(product.description),
      'Publish Type': 'standard',
      'Publish Status': 'draft',
    },
  };
}

function mergePromotionCandidates(
  websiteProducts: ProductSpec[],
  productLibraryProducts: ProductSpec[],
): ProductSpec[] {
  const merged = new Map<string, ProductSpec>();
  const add = (product: ProductSpec) => {
    const idKey = normalizeCandidateKey(product.id);
    const modelKey = normalizeCandidateKey(product.model);
    const key = idKey || modelKey;
    if (!key) return;
    const existingKey = merged.has(key)
      ? key
      : [...merged.entries()].find(([, item]) => normalizeCandidateKey(item.model) === modelKey)?.[0];
    if (existingKey) {
      const existing = merged.get(existingKey);
      merged.set(existingKey, {
        ...existing,
        ...product,
        specifications: { ...(existing?.specifications || {}), ...(product.specifications || {}) },
      });
      return;
    }
    merged.set(key, product);
  };

  productLibraryProducts.forEach(add);
  websiteProducts.forEach(add);
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Campaign Manager Component ───────────────────────────────────────────────

const emptyCampaignForm: Omit<Campaign, 'id' | 'createdAt' | 'regionCode'> = {
  name: '',
  type: 'weekly',
  startDate: '',
  endDate: '',
  headline: '',
  description: '',
  ctaText: 'Shop Deals',
  bannerColor: 'from-red-600 to-orange-500',
  productIds: [],
  displayConfig: DEFAULT_PROMOTION_DISPLAY_CONFIG,
  publicationStatus: 'draft',
  publishedAt: null,
};

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

const normalizeCampaignDate = (value: string) => {
  const normalized = String(value || '').trim().replace(/\//g, '-');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  return '';
};

const formatCampaignCategoryLabel = (value: string) =>
  String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getCampaignProductTopCategory = (product: ProductSpec) => {
  const explicitCategory = getProductSpecValue(product, [
    'Department',
    'Main Category',
    'Top Category',
    'Category',
    'Product Source',
  ]);
  if (explicitCategory) return explicitCategory;

  const categoryId = String(product.categoryId || '').trim();
  if (!categoryId) return '未分类商品';
  const [firstSegment] = categoryId.split(/[/.]/).filter(Boolean);
  return formatCampaignCategoryLabel(firstSegment || categoryId) || '未分类商品';
};

const createDefaultCampaignProductOffer = (product?: ProductSpec): PromotionCampaignProductOffer => ({
  discountType: 'percent',
  discountValue: '',
  dealLabel: '',
  dealBadge: '',
  moq: product ? String(getProductMoq(product) || '') : '',
});

const getCampaignProductOffer = (
  displayConfig: PromotionCampaignDisplayConfig,
  productId: string,
  product?: ProductSpec,
) => displayConfig.productOffers?.[productId] || createDefaultCampaignProductOffer(product);

const calculateCampaignOfferPrice = (product: ProductSpec, offer: PromotionCampaignProductOffer) => {
  const basePrice = Number(product.price || 0);
  const discountValue = Number(offer.discountValue || 0);
  if (!basePrice || !discountValue) return basePrice;
  if (offer.discountType === 'percent') {
    return Math.max(basePrice * (1 - Math.min(discountValue, 99) / 100), 0);
  }
  return Math.max(basePrice - discountValue, 0);
};

const formatCampaignOfferLabel = (offer: PromotionCampaignProductOffer, product: ProductSpec) => {
  if (offer.dealLabel.trim()) return offer.dealLabel.trim();
  const discountValue = Number(offer.discountValue || 0);
  if (!discountValue) return '';
  if (offer.discountType === 'percent') return `Save ${discountValue}%`;
  const basePrice = Number(product.price || 0);
  if (basePrice > 0) {
    const pct = Math.round((discountValue / basePrice) * 100);
    return pct > 0 ? `Save ${pct}%` : `Save $${discountValue.toFixed(2)}`;
  }
  return `Save $${discountValue.toFixed(2)}`;
};

const clearCampaignPopupSeenState = (campaignId: string) => {
  if (typeof window === 'undefined') return;
  const prefixes = [
    `cosun_promo_popup_seen:${campaignId}:`,
    `cosun_promo_popup_seen:${campaignId}`,
    `cosun_promo_popup_seen:session:${campaignId}`,
  ];
  try {
    [window.localStorage, window.sessionStorage].forEach((storage) => {
      Array.from({ length: storage.length }, (_, index) => storage.key(index))
        .filter((key): key is string => Boolean(key && prefixes.some((prefix) => key.startsWith(prefix))))
        .forEach((key) => storage.removeItem(key));
    });
  } catch {
    // Clearing popup frequency state is best-effort.
  }
};

const createDefaultCampaignForm = (): Omit<Campaign, 'id' | 'createdAt' | 'regionCode'> => {
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 7);
  return {
    ...emptyCampaignForm,
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
};

function CampaignManager({
  regionCode,
  allProducts,
}: {
  regionCode: string;
  allProducts: import('../../data/productData').ProductSpec[];
}) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyCampaignForm });
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'all'>('all');
  const selectedNamePreset = useMemo(
    () => CAMPAIGN_NAME_PRESETS.find((preset) => preset.name === form.name),
    [form.name],
  );
  const activeSuggestionGroup = selectedNamePreset?.group || DEFAULT_CAMPAIGN_SUGGESTION_GROUP;
  const campaignHeadlineSuggestions = CAMPAIGN_HEADLINE_SUGGESTIONS_BY_GROUP[activeSuggestionGroup];
  const campaignDescriptionSuggestions = CAMPAIGN_DESCRIPTION_SUGGESTIONS_BY_GROUP[activeSuggestionGroup];

  const refreshCampaignsFromDatabase = useCallback(async () => {
    setIsLoadingCampaigns(true);
    try {
      const dbCampaigns = await loadPromotionCampaignsFromDatabase({ throwOnError: true });
      setCampaigns((dbCampaigns as Campaign[]).filter((c) => c.regionCode === regionCode));
      cacheCampaigns(dbCampaigns as Campaign[]);
      return dbCampaigns as Campaign[];
    } catch (error) {
      console.error('Failed to load promotion campaigns from database:', error);
      toast.error('促销活动加载失败：数据库不可用');
      setCampaigns([]);
      return [];
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [regionCode]);

  useEffect(() => {
    setCampaigns([]);
    setShowForm(false);
    setEditingId(null);
    void refreshCampaignsFromDatabase();
  }, [refreshCampaignsFromDatabase]);

  useEffect(() => {
    if (!isSavingCampaign) return undefined;
    const timeoutId = window.setTimeout(() => {
      setIsSavingCampaign(false);
      toast.error('数据库同步超时，保存未确认成功，请重试');
    }, 12_000);
    return () => window.clearTimeout(timeoutId);
  }, [isSavingCampaign]);

  const updateForm = (key: keyof typeof form, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const selectCampaignNamePreset = (preset: (typeof CAMPAIGN_NAME_PRESETS)[number]) => {
    setForm((f) => ({
      ...f,
      name: preset.name,
      type: preset.type,
    }));
  };

  const updateDisplayConfig = (value: {
    placements?: Partial<PromotionCampaignDisplayConfig['placements']>;
    popup?: Partial<PromotionCampaignDisplayConfig['popup']>;
  }) =>
    setForm((f) => ({
      ...f,
      displayConfig: {
        ...f.displayConfig,
        ...value,
        placements: {
          ...f.displayConfig.placements,
          ...(value.placements || {}),
        },
        popup: {
          ...f.displayConfig.popup,
          ...(value.popup || {}),
        },
      },
    }));

  const toggleProduct = (id: string) => {
    const product = allProducts.find((item) => item.id === id);
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
      displayConfig: {
        ...f.displayConfig,
        productOffers: f.productIds.includes(id)
          ? Object.fromEntries(Object.entries(f.displayConfig.productOffers || {}).filter(([productId]) => productId !== id))
          : {
              ...(f.displayConfig.productOffers || {}),
              [id]: getCampaignProductOffer(f.displayConfig, id, product),
            },
      },
    }));
  };

  const updateProductOffer = (
    productId: string,
    key: keyof PromotionCampaignProductOffer,
    value: string,
  ) => {
    const product = allProducts.find((item) => item.id === productId);
    setForm((f) => {
      const currentOffer = getCampaignProductOffer(f.displayConfig, productId, product);
      return {
        ...f,
        displayConfig: {
          ...f.displayConfig,
          productOffers: {
            ...(f.displayConfig.productOffers || {}),
            [productId]: {
              ...currentOffer,
              [key]: value,
            },
          },
        },
      };
    });
  };

  const handleSave = async (publicationStatus: PromotionCampaignPublicationStatus = 'draft') => {
    if (isSavingCampaign) return;
    const nextPublishedAt = publicationStatus === 'published'
      ? (form.publishedAt || new Date().toISOString())
      : null;
    const normalizedForm = {
      ...form,
      name: form.name.trim(),
      startDate: normalizeCampaignDate(form.startDate),
      endDate: normalizeCampaignDate(form.endDate),
      headline: form.headline.trim(),
      description: form.description.trim(),
      ctaText: form.ctaText.trim() || 'Shop Deals',
      displayConfig: {
        ...form.displayConfig,
        productOffers: Object.fromEntries(
          form.productIds.map((productId) => [
            productId,
            getCampaignProductOffer(
              form.displayConfig,
              productId,
              allProducts.find((product) => product.id === productId),
            ),
          ]),
        ),
      },
      publicationStatus,
      publishedAt: nextPublishedAt,
    };
    if (!normalizedForm.name || !normalizedForm.startDate || !normalizedForm.endDate) {
      toast.error('请填写活动名称、开始和结束日期');
      return;
    }
    if (publicationStatus === 'published' && normalizedForm.displayConfig.popup.enabled && !normalizedForm.displayConfig.placements.popup) {
      toast.error('发布失败：启用弹窗广告时必须勾选弹窗展示位');
      return;
    }
    let savedCampaign: Campaign;
    if (editingId) {
      const existing = campaigns.find((c) => c.id === editingId);
      savedCampaign = { ...(existing || { id: editingId, createdAt: new Date().toISOString() }), ...normalizedForm, regionCode };
    } else {
      savedCampaign = { ...normalizedForm, id: genId(), regionCode, createdAt: new Date().toISOString() };
    }
    setIsSavingCampaign(true);
    try {
      await persistPromotionCampaign(savedCampaign);
      const refreshedCampaigns = await refreshCampaignsFromDatabase();
      const persistedCampaign = refreshedCampaigns.find((campaign) => campaign.id === savedCampaign.id);
      if (!persistedCampaign || persistedCampaign.publicationStatus !== publicationStatus) {
        throw new Error('数据库写入校验失败：未读取到刚保存的活动或发布状态不一致');
      }
      if (publicationStatus === 'published') {
        clearCampaignPopupSeenState(savedCampaign.id);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(createDefaultCampaignForm());
      toast.success(publicationStatus === 'published' ? '活动已发布并同步到数据库' : '草稿已同步到数据库');
    } catch (error) {
      console.error('Failed to save promotion campaign:', error);
      toast.error(publicationStatus === 'published'
        ? '发布失败：数据库未确认写入，前台不会展示，请重试'
        : '保存失败：数据库未确认写入，请重试');
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleEdit = (c: Campaign) => {
    setForm({ name: c.name, type: c.type, startDate: c.startDate, endDate: c.endDate,
      headline: c.headline, description: c.description, ctaText: c.ctaText,
      bannerColor: c.bannerColor, productIds: c.productIds, displayConfig: c.displayConfig || DEFAULT_PROMOTION_DISPLAY_CONFIG,
      publicationStatus: c.publicationStatus || 'draft', publishedAt: c.publishedAt || null });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除此促销活动？')) return;
    try {
      await deletePromotionCampaign(id);
      await refreshCampaignsFromDatabase();
      toast.success('活动已删除');
    } catch (error) {
      console.error('Failed to delete promotion campaign:', error);
      toast.error('活动删除失败，数据库未更新');
    }
  };

  const filtered = useMemo(() => {
    return campaigns.filter((c) => filterStatus === 'all' || getCampaignStatus(c) === filterStatus);
  }, [campaigns, filterStatus]);

  const productCategoryOptions = useMemo(() => {
    const categories = new Set<string>();
    allProducts.forEach((product) => categories.add(getCampaignProductTopCategory(product)));
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [allProducts]);

  const searchedProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return allProducts
      .filter((p) => productCategoryFilter === 'all' || getCampaignProductTopCategory(p) === productCategoryFilter)
      .filter((p) => p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allProducts, productCategoryFilter, productSearch]);

  const selectedProducts = useMemo(() => {
    const byId = new Map(allProducts.map((product) => [product.id, product]));
    return form.productIds
      .map((id) => byId.get(id))
      .filter((product): product is ProductSpec => Boolean(product));
  }, [allProducts, form.productIds]);

  const trimmedProductSearch = productSearch.trim();
  const showProductSearchResults = trimmedProductSearch.length > 0;

  const statusMeta: Record<CampaignStatus, { label: string; cls: string }> = {
    scheduled: { label: '计划中', cls: 'bg-blue-50 text-blue-700' },
    active:    { label: '进行中', cls: 'bg-green-50 text-green-700' },
    ended:     { label: '已结束', cls: 'bg-gray-100 text-gray-500' },
  };

  const regionInfo = REGION_LABELS[regionCode];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-1.5">
            <Megaphone className="h-4 w-4 text-orange-500" />
            促销活动管理
            {regionInfo && (
              <span className="text-xs font-normal text-gray-500">
                — {regionInfo.flag} {regionInfo.name}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Create time-boxed campaign programs with English copy, selected products, and storefront banner content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'all')}
          >
            <option value="all">全部状态</option>
            <option value="scheduled">计划中</option>
            <option value="active">进行中</option>
            <option value="ended">已结束</option>
          </select>
          <Button
            size="sm"
            className="h-8 bg-orange-600 hover:bg-orange-700 text-white"
            onClick={() => { setShowForm(true); setEditingId(null); setForm(createDefaultCampaignForm()); }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            新建活动
          </Button>
        </div>
      </div>

      {/* Campaign Form */}
      {showForm && (
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-orange-700">
                {editingId ? '编辑促销活动' : '新建促销活动'}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2 grid gap-1">
                <label className="text-xs font-medium text-gray-700">活动名称 *</label>
                <input
                  className="h-8 rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  placeholder="e.g. Pro Supply Savings Week"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                />
                <div className="flex flex-wrap gap-1.5">
                  {CAMPAIGN_NAME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={`rounded-full border px-2.5 py-1 text-left text-[10px] font-semibold leading-4 transition ${
                        form.name === preset.name
                          ? 'border-red-300 bg-red-100 text-red-700'
                          : 'border-red-100 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100'
                      }`}
                      onClick={() => selectCampaignNamePreset(preset)}
                      title={`${preset.name} · ${CAMPAIGN_TYPES.find((type) => type.value === preset.type)?.label || preset.type}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">活动类型</label>
                <select
                  className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                  value={form.type}
                  onChange={(e) => updateForm('type', e.target.value)}
                >
                  {CAMPAIGN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">横幅颜色</label>
                <select
                  className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                  value={form.bannerColor}
                  onChange={(e) => updateForm('bannerColor', e.target.value)}
                >
                  {BANNER_COLORS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">开始日期 *</label>
                <input
                  type="date"
                  className="h-8 rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  value={form.startDate}
                  onChange={(e) => updateForm('startDate', e.target.value)}
                />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-medium text-gray-700">结束日期 *</label>
                <input
                  type="date"
                  className="h-8 rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                  value={form.endDate}
                  onChange={(e) => updateForm('endDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-gray-700">横幅标题</label>
              <input
                className="h-8 rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="e.g. Wholesale savings on selected B2B products"
                value={form.headline}
                onChange={(e) => updateForm('headline', e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5">
                {campaignHeadlineSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-left text-[10px] font-semibold leading-4 text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                    onClick={() => updateForm('headline', suggestion)}
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-gray-700">活动说明</label>
              <input
                className="h-8 rounded border border-gray-200 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                placeholder="e.g. Limited-time pricing for wholesale buyers and repeat purchase orders"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
              />
              <div className="grid gap-1.5 sm:grid-cols-2">
                {campaignDescriptionSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-left text-[10px] font-medium leading-4 text-gray-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => updateForm('description', suggestion)}
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-gray-400">点击建议文案可填入，保存前仍可直接编辑。</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-gray-800">前台展示配置</div>
                  <div className="text-[10px] text-gray-400">控制首页促销位、Deals 页面和首访弹窗</div>
                </div>
                <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-red-600"
                    checked={form.displayConfig.popup.enabled}
                    onChange={(e) => updateDisplayConfig({
                      placements: { popup: e.target.checked },
                      popup: { enabled: e.target.checked },
                    })}
                  />
                  启用弹窗广告
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="inline-flex items-center gap-2 rounded-md bg-white px-2 py-2 text-xs text-gray-700 ring-1 ring-gray-200">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-red-600"
                    checked={form.displayConfig.placements.homeDeals}
                    onChange={(e) => updateDisplayConfig({ placements: { homeDeals: e.target.checked } })}
                  />
                  首页促销横栏
                </label>
                <label className="inline-flex items-center gap-2 rounded-md bg-white px-2 py-2 text-xs text-gray-700 ring-1 ring-gray-200">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-red-600"
                    checked={form.displayConfig.placements.dealsPageHero}
                    onChange={(e) => updateDisplayConfig({ placements: { dealsPageHero: e.target.checked } })}
                  />
                  Deals 页面横幅
                </label>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">弹窗样式</label>
                  <select
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={form.displayConfig.popup.style}
                    onChange={(e) => updateDisplayConfig({ popup: { style: e.target.value as PromotionCampaignDisplayConfig['popup']['style'] } })}
                    disabled={!form.displayConfig.popup.enabled}
                  >
                    <option value="hero-modal">首访大弹窗</option>
                    <option value="center-card">居中卡片</option>
                    <option value="top-bar">顶部横条</option>
                    <option value="corner">右下角浮层</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-5">
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">触发时机</label>
                  <select
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={form.displayConfig.popup.trigger}
                    onChange={(e) => updateDisplayConfig({ popup: { trigger: e.target.value as PromotionCampaignDisplayConfig['popup']['trigger'] } })}
                    disabled={!form.displayConfig.popup.enabled}
                  >
                    <option value="homepage-delay">进入首页延迟</option>
                    <option value="immediate">立即展示</option>
                    <option value="scroll-depth">滚动后展示</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">延迟秒数</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={Math.round(form.displayConfig.popup.delayMs / 1000)}
                    onChange={(e) => updateDisplayConfig({ popup: { delayMs: Math.max(Number(e.target.value || 0), 0) * 1000 } })}
                    disabled={!form.displayConfig.popup.enabled}
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">展示频率</label>
                  <select
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={form.displayConfig.popup.frequency}
                    onChange={(e) => updateDisplayConfig({ popup: { frequency: e.target.value as PromotionCampaignDisplayConfig['popup']['frequency'] } })}
                    disabled={!form.displayConfig.popup.enabled}
                  >
                    <option value="once-per-day">每天一次</option>
                    <option value="once-per-campaign">每活动一次</option>
                    <option value="every-visit">每次访问</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">CTA 跳转</label>
                  <select
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={form.displayConfig.popup.ctaTarget}
                    onChange={(e) => updateDisplayConfig({ popup: { ctaTarget: e.target.value as PromotionCampaignDisplayConfig['popup']['ctaTarget'] } })}
                    disabled={!form.displayConfig.popup.enabled}
                  >
                    <option value="deals">Deals 页面</option>
                    <option value="campaign">活动商品</option>
                    <option value="catalog">产品目录</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-[10px] font-semibold text-gray-500">商品预览数</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                    value={form.displayConfig.popup.productPreviewCount}
                    onChange={(e) => updateDisplayConfig({ popup: { productPreviewCount: Number(e.target.value || 4) } })}
                    disabled={!form.displayConfig.popup.enabled}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                关联产品
                <span className="text-gray-400 font-normal">（已选 {form.productIds.length} 个）</span>
              </label>
              <div className="mb-1.5 grid gap-1.5 rounded border border-gray-200 bg-white p-1.5 lg:grid-cols-[140px_180px_minmax(0,1fr)]">
                <div className="flex h-8 items-center gap-1.5 rounded bg-gray-50 px-2 text-xs font-semibold text-gray-700">
                  <span>{regionInfo?.flag || '🌐'}</span>
                  <span className="truncate">{regionInfo?.name || regionCode}</span>
                </div>
                <select
                  className="h-8 rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">全部总类目</option>
                  {productCategoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                  <input
                    className="h-8 w-full rounded border border-gray-200 pl-6 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-400"
                    placeholder="输入产品名称或 SKU 后选择..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
              </div>
              {selectedProducts.length > 0 && (
                <>
                  <div className="mb-1.5 flex flex-wrap gap-1.5 rounded border border-green-100 bg-green-50 p-2">
                    {selectedProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className="inline-flex max-w-full items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-200 hover:text-red-600"
                        title="Click to remove"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{p.name}</span>
                        <span className="text-green-400">{p.model}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mb-1.5 space-y-1.5 rounded border border-orange-100 bg-orange-50/40 p-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600">
                      <span>活动商品优惠设置</span>
                      <span className="text-gray-400">每个关联商品可单独设置折扣和 MOQ</span>
                    </div>
                    {selectedProducts.map((product) => {
                      const offer = getCampaignProductOffer(form.displayConfig, product.id, product);
                      const offerPrice = calculateCampaignOfferPrice(product, offer);
                      const label = formatCampaignOfferLabel(offer, product);
                      return (
                        <div key={product.id} className="grid gap-2 rounded border border-gray-200 bg-white p-2 lg:grid-cols-[minmax(180px,1fr)_130px_110px_110px_130px_150px]">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-gray-900">{product.name}</div>
                            <div className="text-[10px] text-gray-400">{product.model}</div>
                          </div>
                          <select
                            className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                            value={offer.discountType}
                            onChange={(e) => updateProductOffer(product.id, 'discountType', e.target.value)}
                          >
                            <option value="percent">百分比折扣</option>
                            <option value="amount">固定减价</option>
                          </select>
                          <input
                            type="number"
                            min={0}
                            max={offer.discountType === 'percent' ? 99 : undefined}
                            className="h-8 rounded border border-gray-200 px-2 text-xs"
                            value={offer.discountValue}
                            onChange={(e) => updateProductOffer(product.id, 'discountValue', e.target.value)}
                            placeholder={offer.discountType === 'percent' ? '如 20' : '如 5.00'}
                          />
                          <input
                            type="number"
                            min={0}
                            className="h-8 rounded border border-gray-200 px-2 text-xs"
                            value={offer.moq}
                            onChange={(e) => updateProductOffer(product.id, 'moq', e.target.value)}
                            placeholder="MOQ"
                          />
                          <select
                            className="h-8 rounded border border-gray-200 bg-white px-2 text-xs"
                            value={offer.dealBadge}
                            onChange={(e) => updateProductOffer(product.id, 'dealBadge', e.target.value)}
                          >
                            <option value="">标签</option>
                            {BADGE_OPTIONS.map((badge) => (
                              <option key={badge} value={badge}>{badge}</option>
                            ))}
                          </select>
                          <input
                            className="h-8 rounded border border-gray-200 px-2 text-xs"
                            value={offer.dealLabel}
                            onChange={(e) => updateProductOffer(product.id, 'dealLabel', e.target.value)}
                            placeholder={label || '自动标签'}
                          />
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 lg:col-span-6">
                            <span>原价 ${Number(product.price || 0).toFixed(2)}</span>
                            {offer.discountValue && Number(product.price || 0) > 0 && (
                              <>
                                <span>→</span>
                                <span className="text-green-700">活动价 ${offerPrice.toFixed(2)}</span>
                              </>
                            )}
                            {label && <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">{label}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {showProductSearchResults && (
                <div className="max-h-44 overflow-y-auto rounded border border-gray-100 bg-gray-50 p-1.5 space-y-0.5">
                  {trimmedProductSearch.length < 2 && (
                    <div className="py-3 text-center text-xs text-gray-400">至少输入 2 个字符后搜索商品</div>
                  )}
                  {trimmedProductSearch.length >= 2 && searchedProducts.length === 0 && (
                    <div className="py-4 text-center text-xs text-gray-400">
                      当前区域和类目下没有匹配商品
                    </div>
                  )}
                  {searchedProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => toggleProduct(p.id)}
                      className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={form.productIds.includes(p.id)}
                        className="h-3 w-3 accent-orange-600"
                      />
                      <span className="flex-1 truncate text-gray-800">{p.name}</span>
                      <span className="text-gray-400">{p.model}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Banner preview */}
            {(form.headline || form.name) && (
              <div className="rounded-lg border border-orange-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-bold text-gray-600">前台展示预览</div>
                  <div className="text-[10px] font-semibold text-gray-400">首页优惠区 / Deals & Offers 顶部</div>
                </div>
                <div className={`grid overflow-hidden rounded-md bg-gradient-to-r ${form.bannerColor} text-white lg:grid-cols-[minmax(0,1fr)_240px]`}>
                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase">
                      <span className="bg-white/20 px-2 py-1">Special Buy</span>
                      <span className="bg-white/20 px-2 py-1">{CAMPAIGN_TYPES.find((type) => type.value === form.type)?.label || 'Promotion'}</span>
                      <span className="bg-white/20 px-2 py-1">{form.productIds.length} products</span>
                    </div>
                    <div className="line-clamp-2 text-xl font-black uppercase leading-tight">
                      {form.headline || form.name}
                    </div>
                    <div className="mt-2 line-clamp-2 max-w-2xl text-sm font-semibold leading-5 text-white/90">
                      {form.description || 'Campaign description will appear here to support the promotion theme and buying reason.'}
                    </div>
                  </div>
                  <div className="flex flex-col justify-center border-t border-white/20 p-4 lg:border-l lg:border-t-0">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase text-white/90">
                      <Clock className="h-4 w-4" />
                      <span>Deals end in {getCampaignRemainingLabel(form.endDate)}</span>
                    </div>
                    <button
                      type="button"
                      className="h-9 rounded-sm bg-white px-4 text-sm font-black text-gray-950"
                    >
                      {form.ctaText || 'Shop Deals'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => handleSave('draft')}
                disabled={isSavingCampaign}
              >
                {isSavingCampaign ? 'Saving...' : '保存草稿'}
              </Button>
              <Button
                size="sm"
                className="h-8 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => handleSave('published')}
                disabled={isSavingCampaign}
              >
                {isSavingCampaign ? 'Publishing...' : '发布活动'}
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setShowForm(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      {filtered.length === 0 && !showForm && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-10 text-center">
            <Megaphone className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">暂无促销活动</p>
            <p className="text-xs text-gray-400 mt-1">创建主题促销活动，统一管理有时间范围的优惠计划</p>
            <Button size="sm" className="mt-3 h-8 bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => { setShowForm(true); setEditingId(null); setForm(createDefaultCampaignForm()); }}>
              <Plus className="mr-1 h-3.5 w-3.5" />新建首个活动
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((c) => {
          const status = getCampaignStatus(c);
          const meta = statusMeta[status];
          const typeInfo = CAMPAIGN_TYPES.find((t) => t.value === c.type);
          const campaignProducts = allProducts.filter((p) => c.productIds.includes(p.id));
          return (
            <Card key={c.id} className={status === 'ended' ? 'opacity-60' : ''}>
              <CardContent className="pt-4 pb-3">
                {/* Banner preview */}
                {c.headline && (
                  <div className={`mb-3 rounded-lg bg-gradient-to-r ${c.bannerColor} px-4 py-2.5 text-white`}>
                    <div className="font-bold text-sm">{c.headline}</div>
                    {c.description && <div className="text-xs opacity-80 mt-0.5">{c.description}</div>}
                  </div>
                )}
                <div className="flex flex-wrap items-start gap-2 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{c.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.publicationStatus === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {c.publicationStatus === 'published' ? '已发布' : '草稿'}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>{meta.label}</span>
                      {typeInfo && (
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeInfo.color}`}>
                          {typeInfo.icon} {typeInfo.label}
                        </span>
                      )}
                      {c.displayConfig?.popup?.enabled && (
                        <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                          弹窗广告
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {c.startDate} → {c.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {c.productIds.length} products
                      </span>
                    </div>
                    {campaignProducts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {campaignProducts.slice(0, 5).map((p) => (
                          <span key={p.id} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {p.model || p.name}
                          </span>
                        ))}
                        {campaignProducts.length > 5 && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            +{campaignProducts.length - 5} 个
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(c)}>
                      <Pencil className="h-3.5 w-3.5 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computedDealLabel(form: DealForm, product: ProductSpec): string {
  if (form.dealLabel.trim()) return form.dealLabel.trim();
  const price = Number(product.price || 0);
  if (form.discountType === 'percent' && form.discountValue) {
    return `优惠 ${form.discountValue}%`;
  }
  if (form.discountType === 'amount' && form.discountValue && price > 0) {
    const pct = Math.round((Number(form.discountValue) / price) * 100);
    return `优惠 ${pct}%`;
  }
  return '';
}

function discountedPrice(form: DealForm, product: ProductSpec): number {
  const price = Number(product.price || 0);
  if (!price) return 0;
  if (form.discountType === 'percent') {
    return price * (1 - Number(form.discountValue || 0) / 100);
  }
  return price - Number(form.discountValue || 0);
}

function isExpired(validUntil: string): boolean {
  if (!validUntil) return false;
  return new Date(validUntil) < new Date();
}

function daysRemaining(validUntil: string): number {
  if (!validUntil) return Infinity;
  const diff = new Date(validUntil).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

function formFromProduct(product: ProductSpec): DealForm {
  const label = getProductDiscountLabel(product);
  const originalPrice = getProductOriginalPrice(product);
  const price = Number(product.price || 0);
  let discountType: DiscountType = 'percent';
  let discountValue = '';
  if (originalPrice > 0 && price > 0) {
    const pct = Math.round(((originalPrice - price) / originalPrice) * 100);
    discountType = 'percent';
    discountValue = String(pct);
  }
  return {
    productId: product.id,
    discountType,
    discountValue,
    dealLabel: label,
    dealBadge: (getProductSpecValue(product, ['Deal Tag']) as DealBadge) || '',
    validUntil: getProductSpecValue(product, ['Valid Until']) || '',
    displayPriority: getProductSpecValue(product, ['Display Priority']) || '10',
  };
}

// ─── Product Deal Card ────────────────────────────────────────────────────────

function DealCard({
  product,
  currentRegion,
  dealRegions,
  onEdit,
  onRemove,
}: {
  product: ProductSpec;
  currentRegion: string;
  /** 该产品在哪些区域已是促销产品 */
  dealRegions: string[];
  onEdit: (product: ProductSpec) => void;
  onRemove: (id: string) => void;
}) {
  const badge = getProductSpecValue(product, ['Deal Tag']) as DealBadge | '';
  const label = getProductDiscountLabel(product);
  const validUntil = getProductSpecValue(product, ['Valid Until']);
  const priority = getProductSpecValue(product, ['Display Priority']) || '10';
  const expired = isExpired(validUntil);
  const days = daysRemaining(validUntil);

  // 其他区域（排除当前区域）的促销状态
  const otherRegionDeals = dealRegions.filter((r) => r !== currentRegion);

  return (
    <div className="group relative flex gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Product image */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-50">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <Tag className="h-6 w-6" />
          </div>
        )}
        {badge && (
          <span className={`absolute bottom-0 left-0 right-0 truncate px-1 py-0.5 text-center text-[9px] font-semibold ${BADGE_COLORS[badge] || 'bg-gray-100 text-gray-600'}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">{product.name}</div>
            <div className="text-xs text-gray-400">SKU: {product.model || '—'}</div>
          </div>
          <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(product)}>
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
              onClick={() => onRemove(product.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          {label && (
            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-red-600 font-medium">
              <Percent className="h-3 w-3" />
              {label}
            </span>
          )}
          {product.price && (
            <span className="text-gray-700 font-medium">
              ${Number(product.price).toFixed(2)} / {getProductUnit(product)}
            </span>
          )}
          <span className="text-gray-400">MOQ: {getProductMoq(product)}</span>
          <span className="ml-auto text-gray-400">优先级: {priority}</span>
        </div>
        {validUntil && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${expired ? 'text-red-500' : days <= 3 ? 'text-orange-500' : 'text-gray-400'}`}>
            <Clock className="h-3 w-3" />
            {expired ? `已过期 ${validUntil}` : `到期 ${validUntil}（剩 ${days} 天）`}
          </div>
        )}
        {/* 跨区域促销状态 */}
        {otherRegionDeals.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            <span className="text-[10px] text-gray-400">同步促销：</span>
            {otherRegionDeals.map((r) => {
              const info = REGION_LABELS[r];
              return info ? (
                <span
                  key={r}
                  className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
                  title={`${info.name}区域也在促销`}
                >
                  <span>{info.flag}</span>
                  <span>{info.name}</span>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Deal Edit Form (inline panel) ────────────────────────────────────────────

function DealEditPanel({
  product,
  onSave,
  onCancel,
  saving,
}: {
  product: ProductSpec;
  onSave: (form: DealForm) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<DealForm>(() => formFromProduct(product));
  const newPrice = discountedPrice(form, product);
  const label = computedDealLabel(form, product);
  const originalPrice = Number(product.price || 0);

  const set = (key: keyof DealForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
          <div className="text-xs text-gray-500">SKU: {product.model}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {/* Discount type & value */}
        <div className="col-span-2 sm:col-span-1">
          <Label className="text-xs text-gray-600">折扣类型</Label>
          <div className="mt-1 flex rounded overflow-hidden border border-gray-200">
            {(['percent', 'amount'] as DiscountType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${form.discountType === t ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => set('discountType', t)}
              >
                {t === 'percent' ? '百分比折扣' : '固定减价'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs text-gray-600">
            {form.discountType === 'percent' ? '折扣百分比' : '减价金额'}
          </Label>
          <Input
            className="mt-1 h-8 text-sm"
            type="number"
            min="0"
            max={form.discountType === 'percent' ? '99' : undefined}
            value={form.discountValue}
            onChange={(e) => set('discountValue', e.target.value)}
            placeholder={form.discountType === 'percent' ? '如: 20' : '如: 5.00'}
          />
        </div>
        <div>
          <Label className="text-xs text-gray-600">折后价（预览）</Label>
          <div className="mt-1 flex h-8 items-center rounded border border-gray-200 bg-white px-3 text-sm font-semibold text-green-700">
            {newPrice > 0 ? `$${newPrice.toFixed(2)}` : originalPrice > 0 ? `$${originalPrice.toFixed(2)}` : '—'}
          </div>
        </div>

        {/* Badge type */}
        <div>
          <Label className="text-xs text-gray-600">标签类型</Label>
          <select
            className="mt-1 h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none"
            value={form.dealBadge}
            onChange={(e) => set('dealBadge', e.target.value)}
          >
            <option value="">无标签</option>
            {BADGE_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Promotion label */}
        <div>
          <Label className="text-xs text-gray-600">促销标签（自动或自定义）</Label>
          <Input
            className="mt-1 h-8 text-sm"
            value={form.dealLabel}
            onChange={(e) => set('dealLabel', e.target.value)}
            placeholder={label || '自动生成'}
          />
        </div>

        {/* Valid until */}
        <div>
          <Label className="text-xs text-gray-600">有效期至</Label>
          <Input
            className="mt-1 h-8 text-sm"
            type="date"
            value={form.validUntil}
            onChange={(e) => set('validUntil', e.target.value)}
          />
        </div>

        {/* Display priority */}
        <div>
          <Label className="text-xs text-gray-600">展示优先级（1 = 最高）</Label>
          <Input
            className="mt-1 h-8 text-sm"
            type="number"
            min="1"
            value={form.displayPriority}
            onChange={(e) => set('displayPriority', e.target.value)}
          />
        </div>
      </div>

      {/* Preview label */}
      {(form.dealBadge || label) && (
        <div className="mt-3 flex items-center gap-2 rounded bg-white border border-gray-200 px-3 py-2 text-xs">
          <span className="text-gray-500">预览:</span>
          {form.dealBadge && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_COLORS[form.dealBadge as DealBadge] || 'bg-gray-100'}`}>
              {form.dealBadge}
            </span>
          )}
          {(form.dealLabel || label) && (
            <span className="text-red-600 font-medium">{form.dealLabel || label}</span>
          )}
          {newPrice > 0 && originalPrice > 0 && newPrice !== originalPrice && (
            <>
              <span className="line-through text-gray-400">${originalPrice.toFixed(2)}</span>
              <span className="font-semibold text-green-700">${newPrice.toFixed(2)}</span>
            </>
          )}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-8" onClick={onCancel}>取消</Button>
        <Button size="sm" className="h-8" disabled={saving} onClick={() => onSave(form)}>
          {saving ? '保存中...' : '保存促销'}
        </Button>
      </div>
    </div>
  );
}

// ─── Add Product Modal ────────────────────────────────────────────────────────

function AddProductModal({
  allProducts,
  dealProductIds,
  onAdd,
  onClose,
}: {
  allProducts: ProductSpec[];
  dealProductIds: Set<string>;
  onAdd: (product: ProductSpec) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const pricedCount = useMemo(
    () => allProducts.filter((product) => Number(product.price || 0) > 0).length,
    [allProducts],
  );
  const unpricedCount = Math.max(allProducts.length - pricedCount, 0);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts
      .filter(
        (p) =>
          !dealProductIds.has(p.id) &&
          (!q || p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q)),
      )
      .sort((a, b) => {
        const aHasPrice = Number(a.price || 0) > 0;
        const bHasPrice = Number(b.price || 0) > 0;
        if (aHasPrice !== bHasPrice) return aHasPrice ? -1 : 1;
        if (aHasPrice && bHasPrice) return Number(b.price || 0) - Number(a.price || 0);
        return a.name.localeCompare(b.name);
      });
  }, [allProducts, dealProductIds, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">添加产品到促销</h2>
            <p className="text-xs text-gray-500">选择当前区域商品库中的产品加入本周优惠</p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="按名称或SKU搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              {allProducts.length === 0 ? '当前区域商品库暂无产品' : '无匹配产品'}
            </div>
          ) : (
            filtered.slice(0, 60).map((product) => (
              <button
                key={product.id}
                type="button"
                className="w-full flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 text-left hover:border-gray-400 hover:bg-gray-50 transition-colors"
                onClick={() => onAdd(product)}
              >
                <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                  {product.image ? (
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <Tag className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-400">SKU: {product.model}</div>
                </div>
                {product.price ? (
                  <div className="shrink-0 text-sm font-semibold text-gray-700">
                    ${Number(product.price).toFixed(2)}
                  </div>
                ) : (
                  <div className="shrink-0 text-xs text-gray-400">无价格</div>
                )}
                <Plus className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">
            当前区域商品库 {allProducts.length} 个 · 有价格 {pricedCount} 个 · 无价格 {unpricedCount} 个 · 当前可添加 {filtered.length} 个 · 已在促销中的产品已隐藏
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PromotionsManager({ regionCode }: { regionCode: string }) {
  const [promoTab, setPromoTab] = useState<'deals' | 'campaigns'>('deals');
  const [allProducts, setAllProducts] = useState<ProductSpec[]>([]);
  const [promotionCandidates, setPromotionCandidates] = useState<ProductSpec[]>([]);
  // 加载全部区域产品，用于跨区域状态显示
  const [allRegionsProducts, setAllRegionsProducts] = useState<ProductSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductSpec | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchDeals, setSearchDeals] = useState('');
  const [sortField, setSortField] = useState<'priority' | 'name' | 'expiry'>('priority');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      // 加载当前区域官网商品，同时接入内部产品库作为"添加促销产品"候选来源。
      const [products, masterProducts, categoryTree] = await Promise.all([
        fetchAllProducts(regionCode, { includeUnpublished: true, requireStructured: true }).catch((error) => {
          console.warn('Failed to load website products for promotions.', error);
          return [] as ProductSpec[];
        }),
        productMasterService.getAll().catch((error) => {
          console.warn('Failed to load product master library for promotions.', error);
          return [] as ProductMasterRecord[];
        }),
        fetchCategoryTree(regionCode).catch((error) => {
          console.warn('Failed to load category tree for promotion candidates.', error);
          return [] as CategoryNode[];
        }),
      ]);
      if (!products.length && !masterProducts.length) {
        toast.error('加载产品失败');
      }
      const fallbackCategoryId =
        products.find((product) => product.categoryId)?.categoryId ||
        findFirstLeafCategoryId(categoryTree);
      const normalizedRegionCode = normalizePromotionRegionCode(regionCode);
      const productLibraryCandidates = masterProducts
        .filter((product) => normalizePromotionRegionCode((product as ProductMasterRecord).regionCode) === normalizedRegionCode)
        .map((product) => mapMasterProductToPromotionCandidate(product as ProductMasterRecord, regionCode, fallbackCategoryId))
        .filter((product): product is ProductSpec => Boolean(product));
      setAllProducts(products);
      setPromotionCandidates(mergePromotionCandidates(products, productLibraryCandidates));
      // 并行拉取全部三个区域，用于跨区域状态提示
      // （不能传 null，那会回落到 localStorage 默认值而非"全部"）
      const regionalResults = await Promise.allSettled([
        fetchAllProducts('NA', { includeUnpublished: true, requireStructured: true }),
        fetchAllProducts('SA', { includeUnpublished: true, requireStructured: true }),
        fetchAllProducts('EA', { includeUnpublished: true, requireStructured: true }),
      ]);
      setAllRegionsProducts(
        regionalResults.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      );
      if (regionalResults.some((result) => result.status === 'rejected')) {
        console.warn('Some regional promotion product snapshots failed to load.', regionalResults);
      }
    } catch (err) {
      console.error('Failed to load promotion products:', err);
      toast.error('加载产品失败');
      setAllProducts([]);
      setPromotionCandidates([]);
      setAllRegionsProducts([]);
    } finally {
      setLoading(false);
    }
  }, [regionCode]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const dealProducts = useMemo(
    () => allProducts.filter(isWebsiteDealProduct),
    [allProducts],
  );
  const dealProductIds = useMemo(
    () => new Set(dealProducts.map((p) => p.id)),
    [dealProducts],
  );
  /**
   * 跨区域促销状态映射：productId → 哪些区域将该产品列为促销
   * 用于在当前区域的产品卡片上显示"其他区域同步促销"标记
   */
  const crossRegionDealMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of allRegionsProducts) {
      if (isWebsiteDealProduct(p) && p.regionCode) {
        if (!map[p.id]) map[p.id] = [];
        if (!map[p.id].includes(p.regionCode)) map[p.id].push(p.regionCode);
      }
    }
    return map;
  }, [allRegionsProducts]);

  const stats = useMemo(() => {
    const active = dealProducts.filter((p) => !isExpired(getProductSpecValue(p, ['Valid Until']))).length;
    const expired = dealProducts.filter((p) => isExpired(getProductSpecValue(p, ['Valid Until']))).length;
    const endingSoon = dealProducts.filter((p) => {
      const vu = getProductSpecValue(p, ['Valid Until']);
      const d = daysRemaining(vu);
      return vu && !isExpired(vu) && d <= 3;
    }).length;
    return { total: dealProducts.length, active, expired, endingSoon };
  }, [dealProducts]);

  const filteredDeals = useMemo(() => {
    const q = searchDeals.trim().toLowerCase();
    const base = q
      ? dealProducts.filter((p) => p.name.toLowerCase().includes(q) || p.model.toLowerCase().includes(q))
      : dealProducts;
    return [...base].sort((a, b) => {
      if (sortField === 'priority') {
        return Number(getProductSpecValue(a, ['Display Priority']) || 99) - Number(getProductSpecValue(b, ['Display Priority']) || 99);
      }
      if (sortField === 'name') return a.name.localeCompare(b.name);
      if (sortField === 'expiry') {
        const va = getProductSpecValue(a, ['Valid Until']) || '9999';
        const vb = getProductSpecValue(b, ['Valid Until']) || '9999';
        return va.localeCompare(vb);
      }
      return 0;
    });
  }, [dealProducts, searchDeals, sortField]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const buildSpecifications = (product: ProductSpec, form: DealForm): Record<string, string> => {
    const originalPrice = Number(product.price || 0);
    const newPrice = discountedPrice(form, product);
    const label = computedDealLabel(form, product);
    const specs: Record<string, string> = { ...(product.specifications || {}) };
    specs['Publish Type'] = 'deal';
    specs['Publish Status'] = 'published';
    specs['Deal'] = 'yes';
    specs['Discount'] = label;
    specs['Deal Label'] = label;
    specs['Deal Tag'] = form.dealBadge || '';
    specs['Display Priority'] = form.displayPriority || '10';
    if (form.validUntil) specs['Valid Until'] = form.validUntil;
    if (newPrice > 0 && newPrice !== originalPrice) {
      specs['Original Price'] = String(originalPrice);
    }
    return specs;
  };

  const handleSaveDeal = async (form: DealForm) => {
    const product = promotionCandidates.find((p) => p.id === form.productId) || allProducts.find((p) => p.id === form.productId);
    if (!product) return;
    if (!product.categoryId) {
      toast.error('保存促销失败：请先在分类树中发布至少一个末级类目');
      return;
    }
    setSaving(true);
    try {
      const newPrice = discountedPrice(form, product);
      await upsertWebsiteCatalogProduct({
        id: product.id,
        categoryId: product.categoryId || '',
        name: product.name,
        model: product.model,
        image: product.image || '',
        price: newPrice > 0 ? newPrice : Number(product.price || 0),
        regionCode,   // 始终使用顶层传入的区域，确保保存到正确区域
        specifications: buildSpecifications(product, form),
        requireStructuredSave: true,
      });
      const verifiedProducts = await fetchAllProducts(regionCode, { includeUnpublished: true, requireStructured: true });
      const verifiedProduct = verifiedProducts.find((item) => item.id === product.id);
      if (!verifiedProduct || !isWebsiteDealProduct(verifiedProduct)) {
        throw new Error('Promotion product was not confirmed in Supabase after save');
      }
      toast.success(`促销已保存: ${product.name}`);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      toast.error('保存促销失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddProductAsDeal = async (product: ProductSpec) => {
    setShowAddModal(false);
    // Pre-populate edit form for new deal
    setEditingProduct(product);
  };

  const handleRemoveDeal = async (productId: string) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    if (!window.confirm(`确认将"${product.name}"从促销中移除？`)) return;
    setSaving(true);
    try {
      const specs: Record<string, string> = { ...(product.specifications || {}) };
      specs['Publish Type'] = 'standard';
      specs['Deal'] = 'no';
      specs['Discount'] = '';
      specs['Deal Label'] = '';
      specs['Deal Tag'] = '';
      specs['Original Price'] = '';
      specs['Compare At Price'] = '';
      specs['Valid Until'] = '';
      specs['Price Status'] = '';
      await upsertWebsiteCatalogProduct({
        id: product.id,
        categoryId: product.categoryId || '',
        name: product.name,
        model: product.model,
        image: product.image || '',
        price: Number(product.price || 0),
        regionCode,   // 始终使用顶层传入的区域
        specifications: specs,
        requireStructuredSave: true,
      });
      const verifiedProducts = await fetchAllProducts(regionCode, { includeUnpublished: true, requireStructured: true });
      const verifiedProduct = verifiedProducts.find((item) => item.id === productId);
      if (verifiedProduct && isWebsiteDealProduct(verifiedProduct)) {
        throw new Error('Promotion product removal was not confirmed in Supabase');
      }
      toast.success(`已从促销中移除: ${product.name}`);
      await loadProducts();
    } catch (err) {
      toast.error('移除促销失败');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-red-500" />
            促销管理
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            管理促销产品（单品优惠）与主题促销活动（有时间范围的整体活动），参照 Home Depot 促销体系设计。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const r = REGION_LABELS[regionCode];
            return r ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                <span className="text-sm">{r.flag}</span>
                {r.name} 促销数据
              </span>
            ) : null;
          })()}
          <Button variant="outline" size="sm" className="h-8" onClick={loadProducts} disabled={loading}>
            <RefreshCcw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          {promoTab === 'deals' && (
            <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowAddModal(true)} disabled={loading}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />添加促销产品
            </Button>
          )}
        </div>
      </div>

      {/* Sub-tab switcher */}
      <div className="flex gap-0 border-b border-gray-200">
        {[
          { id: 'deals' as const, label: '促销产品', icon: <Tag className="h-3.5 w-3.5" />, desc: '单品折扣与展示配置' },
          { id: 'campaigns' as const, label: '促销活动', icon: <Megaphone className="h-3.5 w-3.5" />, desc: '主题活动与横幅管理' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPromoTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-left transition-colors ${
              promoTab === t.id
                ? 'border-red-500 text-red-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.icon}
            <div>
              <div className="text-sm font-medium leading-tight">{t.label}</div>
              <div className="text-[10px] text-gray-400 leading-tight">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* ── 促销活动 Tab ─────────────────────────────────────────────── */}
      {promoTab === 'campaigns' && (
        <CampaignManager regionCode={regionCode} allProducts={promotionCandidates} />
      )}

      {/* ── 促销产品 Tab ─────────────────────────────────────────────── */}
      {promoTab === 'deals' && <>

      {/* Stats row */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
      >
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50">
              <Tag className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">促销总数</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              <div className="text-xs text-gray-500">进行中</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.endingSoon}</div>
              <div className="text-xs text-gray-500">3天内到期</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.expired}</div>
              <div className="text-xs text-gray-500">已过期</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty state */}
      {!loading && dealProducts.length === 0 && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="mb-3 h-10 w-10 text-gray-300" />
            <h3 className="text-sm font-semibold text-gray-600">暂无促销活动</h3>
            <p className="mt-1 text-xs text-gray-400 max-w-xs">
              将产品添加到"本周优惠"，可在首页以折扣和特殊标签进行展示。
            </p>
            <Button
              size="sm"
              className="mt-4 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowAddModal(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              添加首个促销
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Deal list */}
      {dealProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                当前促销产品（{dealProducts.length}）
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    className="h-7 pl-8 text-xs w-44"
                    placeholder="搜索促销产品..."
                    value={searchDeals}
                    onChange={(e) => setSearchDeals(e.target.value)}
                  />
                </div>
                <select
                  className="h-7 rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as typeof sortField)}
                >
                  <option value="priority">排序: 优先级</option>
                  <option value="name">排序: 名称</option>
                  <option value="expiry">排序: 到期日</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400">加载中...</div>
            ) : (
              <div className="space-y-2">
                {filteredDeals.map((product) =>
                  editingProduct?.id === product.id ? (
                    <DealEditPanel
                      key={product.id}
                      product={editingProduct}
                      saving={saving}
                      onSave={handleSaveDeal}
                      onCancel={() => setEditingProduct(null)}
                    />
                  ) : (
                    <DealCard
                      key={product.id}
                      product={product}
                      currentRegion={regionCode}
                      dealRegions={crossRegionDealMap[product.id] ?? [regionCode]}
                      onEdit={setEditingProduct}
                      onRemove={handleRemoveDeal}
                    />
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit panel for newly added product */}
      {editingProduct && !dealProductIds.has(editingProduct.id) && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
              <Plus className="h-4 w-4" />
              配置新促销
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DealEditPanel
              product={editingProduct}
              saving={saving}
              onSave={handleSaveDeal}
              onCancel={() => setEditingProduct(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* How it appears on homepage info */}
      <Card className="border-gray-100 bg-gray-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="mt-0.5 h-4 w-4 text-gray-400 shrink-0" />
            <div className="text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-600">在官网的展示逻辑</p>
              <p>此处添加的产品将显示在首页 <strong>"本周优惠"</strong> 轮播区域，按展示优先级排序（数字越小越靠前）。已过期的促销会自动在前台隐藏。</p>
              <p>设置标签（Hot Deal、Special Buy 等）会在产品图片卡片上显示彩色角标；促销标签则作为折扣提示展示在产品卡片上。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add product modal */}
      {showAddModal && (
        <AddProductModal
          allProducts={promotionCandidates}
          dealProductIds={dealProductIds}
          onAdd={handleAddProductAsDeal}
          onClose={() => setShowAddModal(false)}
        />
      )}
      </>} {/* end promoTab === 'deals' */}
    </div>
  );
}
