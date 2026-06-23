import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Gift,
  Globe2,
  Headphones,
  Menu,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRouter } from '../contexts/RouterContext';
import { OrderEditingBanner } from './OrderEditingBanner';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LiveBanner } from './live/LiveBanner';
import { getLeafCategoryImage } from '../data/categoryLeafImages';
import { defaultProducts, productRecommendationsMap } from '../data/departmentRecommendedProductsData';
import { ProductRecommendations } from './shared/ProductRecommendations';
import type { ProductSpec } from '../data/productData';
import {
  fetchAllProducts,
  PRODUCT_CATALOG_UPDATED_EVENT,
  PRODUCT_CATALOG_UPDATED_STORAGE_KEY,
} from '../lib/services/productCatalogService';
import { useStorefrontDepartments } from '../hooks/useStorefrontDepartments';
import {
  getBestActivePromotionCampaignAsync,
  getCampaignTimeRemaining,
  PROMOTION_CAMPAIGNS_UPDATED_EVENT,
  type PromotionCampaign,
  type PromotionCampaignProductOffer,
} from '../lib/promotionCampaigns';
import {
  formatPromotionRemaining,
  promotionLabels,
  translatePromotionText,
} from '../lib/promotionTextLocalization';
import { formatPublicDiscountLabel } from '../lib/productPublication';

const cosunRed = 'bg-red-600 hover:bg-red-700';
const HEADER_ACTIVE_NAV_KEY = 'cosun_active_header_nav';
const PROMOTION_POPUP_SEEN_PREFIX = 'cosun_promo_popup_seen';
const HOME_DEALS_CACHE_KEY = 'cosun_home_deals_snapshot_v1';

const heroSlides = [
  {
    eyebrow: 'For Building Material Retail Chains',
    headline: 'Build More.',
    accent: 'Source Smarter.',
    description: 'Container-ready building materials and industrial supplies for chain stores that need stable price, assortment, and delivery.',
    bullets: ['Competitive wholesale pricing', 'Category sourcing programs', 'Reliable global delivery'],
    primaryCta: 'Shop Now',
    secondaryCta: 'Request a Quote',
    primaryPage: 'catalog',
    secondaryPage: 'dashboard',
    image: 'https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&w=1600&q=85',
  },
  {
    eyebrow: 'For Local Fabricators',
    headline: 'Supply Your Workshop.',
    accent: 'Keep Production Moving.',
    description: 'Doors, windows, kitchen, and home furnishing materials matched to the way local processing factories quote, cut, assemble, and deliver.',
    bullets: ['Profiles, hardware, panels, and fittings', 'Factory-direct sourcing support', 'Batch consistency and replacement planning'],
    primaryCta: 'Browse Categories',
    secondaryCta: 'Send Requirements',
    primaryPage: 'catalog',
    secondaryPage: 'dashboard',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=85',
  },
  {
    eyebrow: 'For Buyers Seeking a China Agent',
    headline: 'Your Agent.',
    accent: 'On the China Side.',
    description: 'A local China-side representative for supplier search, communication, quotation follow-up, samples, orders, QC, shipment, and visible workspace tracking.',
    bullets: ['Supplier communication and first screening', 'Quote, sample, and order follow-up', 'ERP-backed customer workspace tracking'],
    primaryCta: 'View China Agent',
    secondaryCta: 'Talk to an Agent',
    primaryPage: 'china-agent',
    secondaryPage: 'dashboard',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=85',
  },
  {
    eyebrow: 'For Inspection Service Clients',
    headline: 'Inspect Before.',
    accent: 'Ship With Confidence.',
    description: 'Independent quality inspection and loading checks across China, with practical reports that help you decide before goods leave the factory.',
    bullets: ['Pre-shipment and loading inspection', 'AQL sampling and photo reports', 'Issue follow-up before release'],
    primaryCta: 'View QC Services',
    secondaryCta: 'Book Inspection',
    primaryPage: 'qcmaster',
    secondaryPage: 'dashboard',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=85',
  },
  {
    eyebrow: 'For Turnkey Project Buyers',
    headline: 'One Project.',
    accent: 'One Sourcing Desk.',
    description: 'Coordinated sourcing for complete building, commercial, and industrial projects from item list to supplier packages, QC, documents, and delivery.',
    bullets: ['Multi-category bill of materials', 'Consolidated supplier management', 'Project delivery and documentation control'],
    primaryCta: 'View Project Solutions',
    secondaryCta: 'Submit Project List',
    primaryPage: 'projectsolution',
    secondaryPage: 'dashboard',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=85',
  },
] as const;

const departments = [
  {
    name: 'Building Materials',
    detail: 'Concrete blocks & bricks',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Electrical & Lighting',
    detail: 'Wiring & illumination',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Plumbing & HVAC',
    detail: 'Pipes & fittings',
    image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Tools & Hardware',
    detail: 'Power tools & hand tools',
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Industrial & Safety',
    detail: 'PPE & safety supplies',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Paints & Chemicals',
    detail: 'Coatings & adhesives',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Doors, Windows & Glass',
    detail: 'Frames & accessories',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Flooring & Wall Coverings',
    detail: 'Tiles, vinyl & more',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Furniture & Fixtures',
    detail: 'Commercial & office',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Packaging & Logistics',
    detail: 'Packaging & shipping',
    image: 'https://images.unsplash.com/photo-1606964212858-c215029db704?auto=format&fit=crop&w=900&q=80',
  },
];

const homeTopNavItems = [
  { name: 'Retail & Wholesale', page: 'retail-wholesale' },
  { name: 'Project Solution', page: 'projectsolution' },
  { name: 'Fabricators', page: 'fabricators' },
  { name: 'China Agent', page: 'china-agent' },
  { name: 'QC Inspection', page: 'qcmaster' },
  { name: 'Deals & Offers', page: 'specials' },
  { name: 'Resources', page: 'shipmenthub' },
];

const getRecommendedProducts = (subcategoryName: string) => {
  return productRecommendationsMap[subcategoryName] || defaultProducts;
};

interface HomeDealProduct {
  id: string;
  name: string;
  detail: string;
  price: string;
  unit: string;
  old: string;
  off: string;
  image: string;
}

const readHomeDealsCache = (): HomeDealProduct[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HOME_DEALS_CACHE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.name && item?.price)
      : [];
  } catch {
    return [];
  }
};

const writeHomeDealsCache = (products: HomeDealProduct[]) => {
  if (typeof window === 'undefined' || products.length === 0) return;
  try {
    window.localStorage.setItem(HOME_DEALS_CACHE_KEY, JSON.stringify(products.slice(0, 12)));
  } catch {
    // Cache is best effort; live Supabase data remains authoritative.
  }
};

const getProductSpecValue = (product: ProductSpec, keys: string[]) => {
  const specs = product.specifications || {};
  const match = Object.entries(specs).find(([key]) =>
    keys.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase())
  );
  return match?.[1];
};

const parseMoney = (value: unknown) => {
  if (value == null) return 0;
  const parsed = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const getProductOriginalPrice = (product: ProductSpec) =>
  parseMoney(
    getProductSpecValue(product, [
      'Original Price',
      'OriginalPrice',
      'Compare At Price',
      'CompareAtPrice',
      'Compare Price',
      'List Price',
      'Regular Price',
      'MSRP',
      'Was Price',
    ])
  );

const getProductDiscountLabel = (product: ProductSpec) =>
  formatPublicDiscountLabel(getProductSpecValue(product, ['Discount', 'Discount Percent', 'Discount%', 'Promotion', 'Promo Label', 'Deal Label']));

const hasPublicDealPrice = (product: ProductSpec) => Number(product.price || 0) > 0;

const isHomeDiscountedProduct = (product: ProductSpec) => {
  const price = Number(product.price || 0);
  const originalPrice = getProductOriginalPrice(product);
  const discountLabel = getProductDiscountLabel(product);
  const publishType = String(
    getProductSpecValue(product, ['Publish Type', 'PublishType']) || ''
  ).trim().toLowerCase();
  const dealFlag = String(
    getProductSpecValue(product, ['Deal', 'Deals', 'Is Deal', 'IsDiscounted', 'On Sale', 'Sale']) || ''
  ).trim().toLowerCase();

  return (
    publishType === 'deal' ||
    publishType === 'bulk-container' ||
    (price > 0 && originalPrice > price) ||
    Boolean(discountLabel?.trim()) ||
    ['true', 'yes', 'y', '1', 'deal', 'sale', 'discount'].includes(dealFlag)
  );
};

const getProductDetailLine = (product: ProductSpec) => {
  const excludedKeys = new Set([
    'discount',
    'discount percent',
    'discount%',
    'promotion',
    'promo label',
    'deal label',
    'original price',
    'originalprice',
    'compare at price',
    'compareatprice',
    'compare price',
    'list price',
    'regular price',
    'msrp',
    'was price',
    'deal',
    'deals',
    'is deal',
    'isdiscounted',
    'on sale',
    'sale',
    'unit',
  ]);
  const detail = Object.entries(product.specifications || {})
    .filter(([key, value]) => value && !excludedKeys.has(key.trim().toLowerCase()))
    .slice(0, 2)
    .map(([, value]) => value)
    .join(', ');
  return detail || product.model;
};

const toHomeDealProduct = (product: ProductSpec): HomeDealProduct => {
  const currentPrice = Number(product.price || 0);
  const originalPrice = getProductOriginalPrice(product);
  const discountPercent = originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;
  const discountLabel = getProductDiscountLabel(product) || (discountPercent > 0 ? `${discountPercent}% OFF` : 'DEAL');

  return {
    id: product.id,
    name: product.name,
    detail: getProductDetailLine(product),
    price: `$${currentPrice.toFixed(2)}`,
    unit: `/${product.specifications?.Unit || 'pc'}`,
    old: originalPrice > currentPrice ? `$${originalPrice.toFixed(2)}` : '',
    off: discountLabel,
    image: product.image,
  };
};

const toCampaignDealProduct = (
  product: ProductSpec,
  offer: PromotionCampaignProductOffer | undefined,
): HomeDealProduct | null => {
  const currentPrice = Number(product.price || 0);
  if (!currentPrice) return null;
  if (!offer?.discountValue) return toHomeDealProduct(product);

  const discountValue = Number(offer.discountValue || 0);
  const campaignPrice = offer.discountType === 'amount'
    ? Math.max(currentPrice - discountValue, 0)
    : Math.max(currentPrice * (1 - Math.min(discountValue, 99) / 100), 0);
  const discountPercent = currentPrice > campaignPrice
    ? Math.round(((currentPrice - campaignPrice) / currentPrice) * 100)
    : 0;
  const discountLabel = offer.dealLabel || (discountPercent > 0 ? `${discountPercent}% OFF` : 'DEAL');

  return {
    id: product.id,
    name: product.name,
    detail: getProductDetailLine(product),
    price: `$${campaignPrice.toFixed(2)}`,
    unit: `/${product.specifications?.Unit || 'pc'}`,
    old: currentPrice > campaignPrice ? `$${currentPrice.toFixed(2)}` : '',
    off: discountLabel,
    image: product.image,
  };
};

const mapCampaignProducts = (products: ProductSpec[], campaign: PromotionCampaign | null) => {
  if (!campaign?.productIds?.length) return [];
  const byId = new Map(products.map((product) => [product.id, product]));
  return campaign.productIds
    .map((productId) => byId.get(productId))
    .filter((product): product is ProductSpec => Boolean(product?.id && product.name && product.model && hasPublicDealPrice(product)))
    .map((product) => toCampaignDealProduct(product, campaign.displayConfig.productOffers?.[product.id]))
    .filter((product): product is HomeDealProduct => Boolean(product));
};

const mergeHomeDealProducts = (featured: HomeDealProduct[], deals: HomeDealProduct[]) => {
  const merged = new Map<string, HomeDealProduct>();
  [...featured, ...deals].forEach((product) => {
    if (!merged.has(product.id)) merged.set(product.id, product);
  });
  return [...merged.values()];
};

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getPromotionPopupSeenKey = (campaign: PromotionCampaign) => {
  const frequency = campaign.displayConfig.popup.frequency;
  const version = campaign.publishedAt || campaign.createdAt || 'draft';
  if (frequency === 'once-per-day') return `${PROMOTION_POPUP_SEEN_PREFIX}:${campaign.id}:${version}:${getTodayKey()}`;
  if (frequency === 'once-per-campaign') return `${PROMOTION_POPUP_SEEN_PREFIX}:${campaign.id}:${version}`;
  return `${PROMOTION_POPUP_SEEN_PREFIX}:session:${campaign.id}:${version}`;
};

const canShowPromotionPopup = (campaign: PromotionCampaign | null) => {
  if (!campaign?.displayConfig?.placements?.popup || !campaign.displayConfig.popup.enabled) return false;
  if (campaign.displayConfig.popup.frequency === 'every-visit') {
    return typeof window === 'undefined' ? false : !window.sessionStorage.getItem(getPromotionPopupSeenKey(campaign));
  }
  return typeof window === 'undefined' ? false : !window.localStorage.getItem(getPromotionPopupSeenKey(campaign));
};

const markPromotionPopupSeen = (campaign: PromotionCampaign | null) => {
  if (!campaign) return;
  const key = getPromotionPopupSeenKey(campaign);
  try {
    if (campaign.displayConfig.popup.frequency === 'every-visit' || campaign.displayConfig.popup.dismissBehavior === 'session') {
      window.sessionStorage.setItem(key, String(Date.now()));
      return;
    }
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    // Frequency control is best-effort; the popup itself remains functional.
  }
};

const bestValueProducts = [
  {
    name: 'Hot Rolled Steel Coil',
    detail: '1.2mm, ASTM A36',
    price: '$650.00',
    unit: '/ MT',
    min: 'Min. Order: 5 MT',
    image: 'https://images.unsplash.com/photo-1606964212858-c215029db704?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Corrugated Roofing Sheet',
    detail: '0.5mm, Pre-Painted',
    price: '$3.90',
    unit: '/ sheet',
    min: 'Min. Order: 100 sheets',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'uPVC Pipe 110mm',
    detail: 'PN10, 6m',
    price: '$7.80',
    unit: '/ pc',
    min: 'Min. Order: 50 pcs',
    image: 'https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Aluminum Window Frame',
    detail: 'Powder Coated',
    price: '$28.00',
    unit: '/ m2',
    min: 'Min. Order: 20 m2',
    image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Ceramic Floor Tile',
    detail: '600x600mm, Matt',
    price: '$5.20',
    unit: '/ m2',
    min: 'Min. Order: 100 m2',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Safety Helmet',
    detail: 'ABS, Adjustable',
    price: '$2.60',
    unit: '/ pc',
    min: 'Min. Order: 50 pcs',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
  },
];

const trustStats = [
  { value: '200,000+', label: 'Quality Products', icon: ShieldCheck },
  { value: '5,000+', label: 'Verified Suppliers', icon: PackageCheck },
  { value: '200+ Countries', label: 'Global Shipping', icon: Globe2 },
  { value: 'Quality Guarantee', label: 'Standards You Can Trust', icon: ShieldCheck },
  { value: 'Secure Payments', label: 'Safe & Encrypted', icon: CreditCard },
];

function Rating() {
  return (
    <div className="flex items-center gap-0.5 text-red-600">
      {[0, 1, 2, 3, 4].map((item) => (
        <Star key={item} className="h-3 w-3 fill-current" />
      ))}
    </div>
  );
}

export function Home() {
  const { navigateTo, currentPage } = useRouter();
  const { user } = useUser();
  const { language, t } = useLanguage();
  const { departments: storefrontDepartments } = useStorefrontDepartments();
  const publicCopy = t.publicSite;
  const homeCopy = publicCopy.home;
  const promotionCopy = promotionLabels[language];
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [hoveredHomeDept, setHoveredHomeDept] = useState<number | null>(null);
  const [hoveredHomeSubcat, setHoveredHomeSubcat] = useState<string | null>(null);
  const [homeDealProducts, setHomeDealProducts] = useState<HomeDealProduct[]>(() => readHomeDealsCache());
  const [activeCampaign, setActiveCampaign] = useState<PromotionCampaign | null>(null);
  const [campaignClockNow, setCampaignClockNow] = useState(() => Date.now());
  const [showCampaignPopup, setShowCampaignPopup] = useState(false);
  const dealsScrollerRef = useRef<HTMLDivElement | null>(null);
  const isDealsShelfPausedRef = useRef(false);
  const departmentListRef = useRef<HTMLDivElement | null>(null);
  const [showDepartmentScrollHint, setShowDepartmentScrollHint] = useState(false);
  const heroSlide = heroSlides[activeHeroSlide];
  const heroText = homeCopy.heroSlides[activeHeroSlide] || heroSlide;
  const departmentMenu = useMemo(
    () => [...storefrontDepartments.map((department) => department.name), 'All Departments'],
    [storefrontDepartments]
  );
  const hoveredDepartment = hoveredHomeDept !== null ? storefrontDepartments[hoveredHomeDept] : null;
  const hoveredSubcategory = hoveredDepartment?.subcategories.find((subcat) => subcat.name === hoveredHomeSubcat) || null;
  const isRtl = language === 'ar';
  const campaignRemaining = getCampaignTimeRemaining(activeCampaign, campaignClockNow);
  const campaignPopupProducts = useMemo(() => {
    if (!activeCampaign?.productIds?.length) return [];
    const campaignProductIds = new Set(activeCampaign.productIds);
    return homeDealProducts.filter((product) => campaignProductIds.has(product.id));
  }, [activeCampaign, homeDealProducts]);

  const scrollDeals = (direction: 'left' | 'right') => {
    const scroller = dealsScrollerRef.current;
    if (!scroller) return;

    scroller.scrollBy({
      left: direction === 'left' ? -scroller.clientWidth : scroller.clientWidth,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    if (homeDealProducts.length <= 1) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const timer = window.setInterval(() => {
      const scroller = dealsScrollerRef.current;
      if (!scroller || isDealsShelfPausedRef.current) return;
      const firstCard = scroller.querySelector<HTMLElement>('.cosun-deal-card');
      const step = firstCard?.offsetWidth || Math.max(scroller.clientWidth / 5, 220);
      const nearEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - step * 0.6;
      scroller.scrollTo({
        left: nearEnd ? 0 : scroller.scrollLeft + step,
        behavior: 'smooth',
      });
    }, 6500);

    return () => window.clearInterval(timer);
  }, [homeDealProducts.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const extractDeals = (products: ProductSpec[]) =>
      products.filter((p) => p.id && p.name && p.model && hasPublicDealPrice(p) && isHomeDiscountedProduct(p)).map(toHomeDealProduct);

    const loadHomepageDeals = async () => {
      try {
        const campaign = await getBestActivePromotionCampaignAsync();
        if (!isMounted) return;
        setActiveCampaign(campaign);

        const [currentRegionProducts, naProducts] = await Promise.all([
          fetchAllProducts(undefined, { includeUnpublished: true }).catch(() => []),
          fetchAllProducts('NA', { includeUnpublished: true }).catch(() => []),
        ]);
        if (!isMounted) return;

        const campaignDeals = mapCampaignProducts(
          [...currentRegionProducts, ...naProducts].filter(
            (product, index, list) => list.findIndex((entry) => entry.id === product.id) === index
          ),
          campaign
        );
        const currentDeals = extractDeals(currentRegionProducts);
        const mergedCurrentDeals = mergeHomeDealProducts(campaignDeals, currentDeals);
        if (mergedCurrentDeals.length > 0) {
          setHomeDealProducts(mergedCurrentDeals);
          writeHomeDealsCache(mergedCurrentDeals);
          dealsScrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
          return;
        }

        const fallbackDeals = mergeHomeDealProducts(campaignDeals, extractDeals(naProducts));
        setHomeDealProducts(fallbackDeals);
        writeHomeDealsCache(fallbackDeals);
        dealsScrollerRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Failed to load homepage deal products:', error);
        if (isMounted && homeDealProducts.length === 0) setHomeDealProducts(readHomeDealsCache());
      }
    };

    void loadHomepageDeals();
    const pendingCatalogRefreshTimers: number[] = [];
    const refreshHomepageDealsSoon = () => {
      void loadHomepageDeals();
      pendingCatalogRefreshTimers.push(window.setTimeout(() => void loadHomepageDeals(), 450));
      pendingCatalogRefreshTimers.push(window.setTimeout(() => void loadHomepageDeals(), 1200));
    };
    const handleCatalogStorageUpdate = (event: StorageEvent) => {
      if (event.key === PRODUCT_CATALOG_UPDATED_STORAGE_KEY) refreshHomepageDealsSoon();
    };
    window.addEventListener(PRODUCT_CATALOG_UPDATED_EVENT, refreshHomepageDealsSoon);
    window.addEventListener('storage', handleCatalogStorageUpdate);

    return () => {
      isMounted = false;
      pendingCatalogRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener(PRODUCT_CATALOG_UPDATED_EVENT, refreshHomepageDealsSoon);
      window.removeEventListener('storage', handleCatalogStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const refreshCampaign = () => {
      setCampaignClockNow(Date.now());
      getBestActivePromotionCampaignAsync().then(setActiveCampaign);
    };
    refreshCampaign();
    const timer = window.setInterval(() => {
      refreshCampaign();
    }, 60_000);
    window.addEventListener(PROMOTION_CAMPAIGNS_UPDATED_EVENT, refreshCampaign);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(PROMOTION_CAMPAIGNS_UPDATED_EVENT, refreshCampaign);
    };
  }, []);

  useEffect(() => {
    if (currentPage !== 'home' || !canShowPromotionPopup(activeCampaign)) {
      setShowCampaignPopup(false);
      return;
    }

    const popup = activeCampaign!.displayConfig.popup;
    let timer: number | undefined;
    const openPopup = () => {
      if (canShowPromotionPopup(activeCampaign)) setShowCampaignPopup(true);
    };

    if (popup.trigger === 'immediate') {
      timer = window.setTimeout(openPopup, 250);
    } else if (popup.trigger === 'scroll-depth') {
      const handleScroll = () => {
        const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const depth = Math.round((window.scrollY / maxScrollable) * 100);
        if (depth >= popup.scrollDepth) {
          window.removeEventListener('scroll', handleScroll);
          openPopup();
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      timer = window.setTimeout(openPopup, popup.delayMs);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [activeCampaign, currentPage]);

  const closeCampaignPopup = (markSeen = true) => {
    if (markSeen) markPromotionPopupSeen(activeCampaign);
    setShowCampaignPopup(false);
  };

  useEffect(() => {
    if (!showCampaignPopup || !activeCampaign) return undefined;
    setHoveredHomeDept(null);
    setHoveredHomeSubcat(null);
    const timeoutId = window.setTimeout(() => {
      closeCampaignPopup(false);
    }, 3000);
    return () => window.clearTimeout(timeoutId);
  }, [showCampaignPopup, activeCampaign]);

  const handleCampaignPopupCta = () => {
    const target = activeCampaign?.displayConfig.popup.ctaTarget;
    closeCampaignPopup();
    navigateTo(target === 'catalog' ? 'catalog' : 'specials');
  };

  const updateDepartmentScrollHint = () => {
    const list = departmentListRef.current;
    if (!list) return;
    const canScrollMore = list.scrollTop + list.clientHeight < list.scrollHeight - 2;
    setShowDepartmentScrollHint(canScrollMore);
  };

  useEffect(() => {
    updateDepartmentScrollHint();
    window.addEventListener('resize', updateDepartmentScrollHint);
    return () => window.removeEventListener('resize', updateDepartmentScrollHint);
  }, []);

  useEffect(() => {
    updateDepartmentScrollHint();
  }, [hoveredHomeDept, storefrontDepartments.length]);

  useEffect(() => {
    if (hoveredHomeDept !== null && hoveredHomeDept >= storefrontDepartments.length) {
      setHoveredHomeDept(null);
      setHoveredHomeSubcat(null);
    }
  }, [hoveredHomeDept, storefrontDepartments.length]);

  useEffect(() => {
    if (hoveredHomeDept === null) return;
    const department = storefrontDepartments[hoveredHomeDept];
    if (!department) return;
    const hasHoveredSubcategory = department.subcategories.some((subcat) => subcat.name === hoveredHomeSubcat);
    if (!hasHoveredSubcategory) {
      setHoveredHomeSubcat(department.subcategories[0]?.name ?? null);
    }
  }, [hoveredHomeDept, hoveredHomeSubcat, storefrontDepartments]);

  const handleReturnToOrder = () => {
    if (user) {
      localStorage.setItem('dashboardActiveView', 'create-order');
      navigateTo('dashboard');
    } else {
      navigateTo('login');
    }
  };

  const getCategorySlug = (categoryName: string) =>
    categoryName
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const navigateToDepartment = (categoryName: string, subcategoryName?: string) => {
    const categorySlug = getCategorySlug(categoryName);
    setHoveredHomeDept(null);
    setHoveredHomeSubcat(null);
    navigateTo(
      `category-${categorySlug}`,
      subcategoryName
        ? { category: categoryName, subcategory: subcategoryName }
        : { category: categoryName }
    );
  };

  return (
    <div className="bg-white text-gray-900">
      {hoveredDepartment && !showCampaignPopup && typeof document !== 'undefined' && createPortal(
        <div
          className="cosun-department-focus-overlay hidden lg:block"
          aria-hidden="true"
        />,
        document.body
      )}
      {showCampaignPopup && activeCampaign && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed z-[30000] ${
            activeCampaign.displayConfig.popup.style === 'top-bar'
              ? 'left-0 right-0 top-0'
              : activeCampaign.displayConfig.popup.style === 'corner'
                ? 'bottom-5 right-5 max-w-md'
                : 'right-5 top-28'
          }`}
          style={
            activeCampaign.displayConfig.popup.style === 'top-bar'
              ? undefined
              : {
                  left: 'auto',
                  bottom: 'auto',
                }
          }
        >
          <div
            className={`relative overflow-hidden bg-white shadow-2xl ${
              activeCampaign.displayConfig.popup.style === 'top-bar'
                ? 'mx-auto flex max-w-7xl items-center justify-between gap-4 border-b border-red-100 px-6 py-3'
                : activeCampaign.displayConfig.popup.style === 'corner'
                  ? 'rounded-lg border border-gray-200'
                  : 'rounded-lg border border-gray-200'
            }`}
            style={
              activeCampaign.displayConfig.popup.style === 'top-bar'
                ? undefined
                : {
                    width: activeCampaign.displayConfig.popup.style === 'corner'
                      ? 'min(360px, calc(100vw - 32px))'
                      : 'min(340px, calc(100vw - 32px))',
                    maxHeight: 'min(360px, calc(100vh - 128px))',
                  }
            }
          >
            <button
              type="button"
              aria-label="Close promotion"
              onClick={closeCampaignPopup}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
            <div className={`grid ${
              activeCampaign.displayConfig.popup.style === 'top-bar'
                ? 'w-full grid-cols-[minmax(0,1fr)_auto]'
                : activeCampaign.displayConfig.popup.style === 'corner'
                  ? 'grid-cols-1'
                  : 'grid-cols-1'
            }`}>
              <div className={`bg-gradient-to-br ${activeCampaign.bannerColor} p-3 pr-12 text-white ${
                activeCampaign.displayConfig.popup.style === 'top-bar' ? 'bg-none !p-0 text-gray-950' : ''
              }`}>
                <div className="mb-1.5 inline-flex w-fit items-center gap-2 bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase">
                  {promotionCopy.specialBuy}
                </div>
                <h2 className={`font-black uppercase leading-tight ${
                  activeCampaign.displayConfig.popup.style === 'top-bar' ? 'text-lg' : 'line-clamp-2 text-base'
                }`}>
                  {translatePromotionText(activeCampaign.headline || activeCampaign.name, language)}
                </h2>
                <p className={`mt-1.5 max-w-sm text-xs font-semibold leading-4 ${
                  activeCampaign.displayConfig.popup.style === 'top-bar' ? 'text-gray-600' : 'text-white/90'
                }`}>
                  {translatePromotionText(activeCampaign.description || activeCampaign.name, language)}
                </p>
                <div className={`mt-2 flex items-center gap-2 text-[11px] font-black uppercase ${
                  activeCampaign.displayConfig.popup.style === 'top-bar' ? 'text-gray-700' : ''
                }`}>
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatPromotionRemaining(campaignRemaining, promotionCopy)}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleCampaignPopupCta}
                  className={`mt-2 h-7 rounded-sm px-3 text-xs font-black ${
                    activeCampaign.displayConfig.popup.style === 'top-bar'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-white text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  {translatePromotionText(activeCampaign.ctaText || promotionCopy.shopDeals, language)}
                </Button>
              </div>
              {activeCampaign.displayConfig.popup.style !== 'top-bar' && (
                <div className={`grid max-h-[150px] gap-2 overflow-y-auto bg-white p-2 ${
                  campaignPopupProducts.length === 1 ? 'grid-cols-1' : 'sm:grid-cols-2'
                }`}>
                  {campaignPopupProducts
                    .slice(0, activeCampaign.displayConfig.popup.productPreviewCount)
                    .map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={handleCampaignPopupCta}
                        className={`group overflow-hidden rounded-md border border-gray-200 text-left transition hover:border-red-200 hover:shadow-sm ${
                          campaignPopupProducts.length === 1 ? 'grid grid-cols-[92px_minmax(0,1fr)]' : ''
                        }`}
                      >
                        <div
                          className={`${campaignPopupProducts.length === 1 ? 'h-full min-h-[72px]' : 'h-[72px]'} overflow-hidden bg-gray-50`}
                          style={{ height: 72, maxHeight: 72 }}
                        >
                          <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        </div>
                        <div className="flex min-w-0 flex-col justify-center p-2">
                          <div className="mb-1 inline-flex bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">{product.off}</div>
                          <div className="truncate text-xs font-black text-gray-950">{product.name}</div>
                          <div className="truncate text-xs font-semibold text-gray-500">{product.detail}</div>
                          <div className="mt-1 text-sm font-black text-red-600">{product.price} <span className="text-xs text-gray-500">{product.unit}</span></div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      <section id="shop-by-department" className="cosun-shell pb-4 pt-0">
        <div className="cosun-home-hero-grid">
          <aside
            className={`cosun-home-department-panel relative hidden overflow-visible border border-gray-200 bg-white lg:block ${
              hoveredDepartment && !showCampaignPopup ? 'is-focused' : ''
            }`}
            onMouseLeave={() => {
              setHoveredHomeDept(null);
              setHoveredHomeSubcat(null);
            }}
          >
            <div className="flex h-12 items-center gap-3 bg-red-600 px-4 text-white shadow-sm">
              <Menu className="h-5 w-5 flex-shrink-0" />
              <span className="cosun-department-title min-w-0 flex-1 font-black uppercase tracking-normal">
                {homeCopy.departmentTitle}
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0" />
            </div>

            <div className="relative">
              <div
                ref={departmentListRef}
                onScroll={updateDepartmentScrollHint}
                className="cosun-home-department-list divide-y divide-gray-100 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {departmentMenu.map((item) => (
                  <button
                    key={item}
                    onMouseEnter={() => {
                      const nextDeptIndex = storefrontDepartments.findIndex((department) => department.name === item);
                      if (nextDeptIndex >= 0) {
                        const nextDepartment = storefrontDepartments[nextDeptIndex];
                        setHoveredHomeDept(nextDeptIndex);
                        setHoveredHomeSubcat(nextDepartment?.subcategories[0]?.name ?? null);
                      } else {
                        setHoveredHomeDept(null);
                        setHoveredHomeSubcat(null);
                      }
                    }}
                    onClick={() => {
                      if (item === 'All Departments') {
                        try {
                          sessionStorage.setItem(HEADER_ACTIVE_NAV_KEY, 'department');
                        } catch {
                          // Ignore storage failures; the header will still render the catalog page.
                        }
                        navigateTo('catalog');
                        return;
                      }
                      navigateToDepartment(item);
                    }}
                    className={`cosun-department-menu-item flex w-full items-center justify-between px-4 text-left text-[14px] font-medium leading-5 transition hover:bg-red-50 hover:text-red-700 ${
                      hoveredDepartment?.name === item ? 'bg-red-50 text-red-700' : 'text-gray-700'
                    }`}
                  >
                    {item === 'All Departments' ? homeCopy.allDepartments : item}
                    <ChevronRight className={`h-3.5 w-3.5 ${isRtl ? 'rotate-180' : ''} ${
                      hoveredDepartment?.name === item ? 'text-red-600' : 'text-gray-400'
                    }`} />
                  </button>
                ))}
              </div>

              {showDepartmentScrollHint && (
                <button
                  type="button"
                  aria-label="Show more departments"
                  onClick={() => {
                    departmentListRef.current?.scrollBy({ top: 96, behavior: 'smooth' });
                  }}
                  className="absolute bottom-0 left-0 right-0 z-10 flex h-10 items-end justify-center bg-gradient-to-t from-white via-white/95 to-transparent pb-1 text-gray-500 transition hover:text-red-600"
                >
                  <ChevronDown className="h-5 w-5 animate-bounce" />
                </button>
              )}
            </div>

            {hoveredDepartment && (
              <div className={`cosun-home-department-flyout absolute top-0 flex h-[454px] overflow-hidden border border-gray-200 bg-white shadow-xl ${
                isRtl
                  ? 'right-full rounded-l-sm border-r-0'
                  : 'left-full rounded-r-sm border-l-0'
              }`}>
                <div className={`w-[240px] flex-shrink-0 bg-white overflow-y-auto ${isRtl ? 'border-l' : 'border-r'}`}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="underline">{hoveredDepartment.name}</h3>
                      <button
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          navigateToDepartment(hoveredDepartment.name);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                      >
                        {homeCopy.shopAll}
                      </button>
                    </div>

                    <div className="space-y-0">
                      {hoveredDepartment.subcategories.map((subcat) => (
                        <div
                          key={subcat.name}
                          onMouseEnter={() => setHoveredHomeSubcat(subcat.name)}
                          onClick={() => navigateToDepartment(hoveredDepartment.name, subcat.name)}
                          className={`flex min-h-12 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm cursor-pointer transition-colors group ${
                            hoveredHomeSubcat === subcat.name ? 'text-orange-600' : 'text-gray-700 hover:text-orange-600'
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            {subcat.image && (
                              <img
                                src={subcat.image}
                                alt={subcat.name}
                                className="h-9 w-9 flex-shrink-0 rounded object-cover"
                                loading="lazy"
                              />
                            )}
                            <span className="leading-snug">{subcat.name}</span>
                          </span>
                          {subcat.items && subcat.items.length > 0 && (
                            <ChevronRight className={`h-4 w-4 transition-colors ${isRtl ? 'rotate-180' : ''} ${
                              hoveredHomeSubcat === subcat.name ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-600'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {hoveredSubcategory ? (
                  <>
                    <div className={`w-[280px] flex-shrink-0 bg-white overflow-y-auto ${isRtl ? 'border-l' : 'border-r'}`}>
                      <div className="px-4 py-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="underline">{hoveredSubcategory.name}</h3>
                          <button
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              navigateToDepartment(hoveredDepartment.name, hoveredSubcategory.name);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
                          >
                            {homeCopy.shopAll}
                          </button>
                        </div>

                        <div className="space-y-2">
                          {hoveredSubcategory.items?.map((item) => {
                            const itemImage = getLeafCategoryImage(item);

                            return (
                              <button
                                key={item}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  navigateToDepartment(hoveredDepartment.name, item);
                                }}
                                className="flex min-h-10 w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:text-orange-600"
                              >
                                {itemImage && (
                                  <img
                                    src={itemImage}
                                    alt={item}
                                    className="h-9 w-9 flex-shrink-0 rounded object-cover"
                                    loading="lazy"
                                  />
                                )}
                                <span className="leading-snug">{item}</span>
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setHoveredHomeSubcat(null)}
                          className="flex items-center gap-1 mt-4 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <ChevronRight className={`h-4 w-4 ${isRtl ? '' : 'rotate-180'}`} />
                          <span>{homeCopy.back}</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-[390px] flex-shrink-0 bg-white overflow-y-auto">
                      <div className="p-4">
                        <ProductRecommendations
                          products={getRecommendedProducts(hoveredSubcategory.name)}
                          priceLabel={homeCopy.startingFrom}
                          onProductClick={() => navigateTo('specials')}
                          onViewAllClick={() => navigateTo('specials')}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-[300px] bg-white overflow-y-auto">
                    <div className="p-4">
                      <ProductRecommendations
                        products={getRecommendedProducts(hoveredDepartment.subcategories[0]?.name || '')}
                        priceLabel={homeCopy.from}
                        onProductClick={() => navigateTo('specials')}
                        onViewAllClick={() => navigateTo('specials')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </aside>

          {currentPage === 'home' && (
            <nav className="cosun-home-nav-row hidden h-12 items-center justify-between border-b border-gray-200 bg-white lg:flex">
              {homeTopNavItems.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        HEADER_ACTIVE_NAV_KEY,
                        item.name
                      );
                    } catch {
                      // Header still falls back to its in-memory navigation state.
                    }
                    navigateTo(item.page);
                  }}
                  className="flex h-full items-center px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-red-700"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          )}

          <div
            className="cosun-home-hero-main relative h-[454px] overflow-hidden bg-gray-100"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.9) 43%, rgba(255,255,255,0.2) 76%), url('${heroSlide.image}')`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          >
            <div className="flex h-full max-w-[680px] flex-col justify-center px-8 py-9 sm:px-10 lg:px-12">
              <p className="mb-3 text-xs font-black uppercase tracking-normal text-red-600">{heroText.eyebrow}</p>
              <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-normal text-gray-900 md:text-[64px]">
                {heroText.headline}
                <span className="mt-1 block text-red-600">{heroText.accent}</span>
              </h1>
              <p className="mt-5 max-w-md text-base font-medium leading-6 text-gray-800">
                {heroText.description}
              </p>
              <div className="mt-4 space-y-1.5 text-sm text-gray-700">
                {heroText.bullets.map((item: string) => (
                  <div key={item} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-red-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => navigateTo(heroSlide.primaryPage)} className={`${cosunRed} rounded-sm px-6`}>
                  {heroText.primaryCta}
                </Button>
                <Button onClick={() => navigateTo(user ? heroSlide.secondaryPage : 'login')} variant="outline" className="rounded-sm px-6">
                  {heroText.secondaryCta}
                </Button>
              </div>
            </div>
            <div
              className="px-4 py-3"
              style={{
                position: 'absolute',
                right: 20,
                bottom: 20,
                zIndex: 30,
                width: 176,
              }}
            >
              <div className="flex items-center gap-2">
                {heroSlides.map((slide, index) => (
                  <button
                    key={slide.eyebrow}
                    type="button"
                    aria-label={`Show ${slide.eyebrow}`}
                    onClick={() => setActiveHeroSlide(index)}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      activeHeroSlide === index ? 'bg-red-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="cosun-home-promo-stack grid h-[454px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[Gift, Boxes, Globe2].map((Icon, index) => {
              const [title, value, detail, cta] = homeCopy.promos[index];
              const PromoIcon = Icon as typeof Gift;
              return (
              <button
                key={title}
                onClick={() => navigateTo(index === 2 ? 'shipmenthub' : 'specials')}
                className="flex h-[143px] items-center justify-between gap-4 overflow-hidden rounded-sm bg-gray-900 p-5 text-left text-white transition hover:bg-black"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-black uppercase text-red-500">{title}</span>
                  <span className="mt-1 block text-2xl font-black uppercase leading-none">{value}</span>
                  <span className="mt-1 block text-sm text-white/85">{detail}</span>
                  <span className="mt-3 block text-xs font-bold text-red-400">{cta} <ChevronRight className="inline h-3 w-3" /></span>
                </span>
                <PromoIcon className="h-12 w-12 flex-shrink-0 text-white" strokeWidth={1.7} />
              </button>
            );})}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-white">
        <div className="cosun-shell grid grid-cols-2 divide-x divide-y divide-gray-100 md:h-[58px] md:grid-cols-5 md:divide-y-0">
          {trustStats.map(({ value, label, icon: Icon }, index) => (
            <div key={value} className="flex items-center justify-center gap-3 py-4">
              <Icon className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-sm font-black text-gray-900">{value}</div>
                <div className="text-[11px] text-gray-500">{homeCopy.trustStats[index] || label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cosun-shell py-3">
        <div
          className="cosun-deals-grid overflow-hidden rounded-sm border border-gray-200 bg-white"
          style={{ height: 176, maxHeight: 176 }}
        >
          <button
            onClick={() => navigateTo('specials')}
            className="flex h-44 flex-col justify-center bg-red-600 p-6 text-left text-white transition hover:bg-red-700"
            style={{ height: 176, maxHeight: 176 }}
          >
            <h2 className="text-2xl font-black uppercase leading-tight">{homeCopy.dealsTitle}</h2>
            <p className="mt-4 max-w-[210px] text-sm font-medium leading-5 text-white/90">{homeCopy.dealsDescription}</p>
            <p className="mt-4 text-sm font-bold">
              {homeCopy.viewAllDeals}{' '}
              <ChevronRight className="inline h-4 w-4" />
            </p>
          </button>
          <div className="relative min-w-0" style={{ height: 176, maxHeight: 176, overflow: 'hidden' }}>
            <button
              type="button"
              aria-label="Scroll deals left"
              onClick={() => scrollDeals('left')}
              className="absolute left-2 top-1/2 z-10 hidden h-9 w-7 -translate-y-1/2 items-center justify-center rounded-sm border border-gray-200 bg-white/95 text-gray-700 shadow-sm transition hover:text-red-600 md:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={dealsScrollerRef}
              onMouseEnter={() => { isDealsShelfPausedRef.current = true; }}
              onMouseLeave={() => { isDealsShelfPausedRef.current = false; }}
              onFocus={() => { isDealsShelfPausedRef.current = true; }}
              onBlur={() => { isDealsShelfPausedRef.current = false; }}
              className="flex h-44 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ height: 176, maxHeight: 176, overflowY: 'hidden' }}
            >
              {homeDealProducts.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigateTo('specials')}
                  className="flex h-44 min-w-full flex-col justify-center px-8 text-left"
                >
                  <span className="text-base font-black text-gray-900">{promotionCopy.noActiveDealsTitle}</span>
                  <span className="mt-2 max-w-md text-sm font-semibold text-gray-500">
                    {promotionCopy.noActiveDealsDescription}
                  </span>
                </button>
              ) : homeDealProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => navigateTo('specials')}
                  className="cosun-deal-card group relative flex h-44 shrink-0 snap-start flex-col border-r border-gray-100 p-3.5 text-left"
                  style={{ height: 176, maxHeight: 176, flexBasis: 220, width: 220, overflow: 'hidden' }}
                >
                  <span className="absolute left-2 top-2 bg-red-600 px-2 py-1 text-[10px] font-bold text-white">{product.off}</span>
                  <div className="cosun-deal-image-slot overflow-hidden bg-white" style={{ height: 88, minHeight: 88, maxHeight: 88, overflow: 'hidden' }}>
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="cosun-deal-image h-full w-full object-cover transition group-hover:scale-105"
                      style={{ height: 88, minHeight: 88, maxHeight: 88, width: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <h3 className="cosun-deal-title mt-2 truncate text-sm font-bold leading-5 text-gray-900">{product.name}</h3>
                  <p className="cosun-deal-detail truncate text-xs leading-4 text-gray-500">{product.detail}</p>
                  <div className="cosun-deal-price mt-1.5 flex items-baseline gap-1">
                    <span className="text-base font-black text-red-600">{product.price}</span>
                    <span className="text-xs text-gray-500">{product.unit}</span>
                    {product.old && <span className="ml-1 text-xs text-gray-400 line-through">{product.old}</span>}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-label="Scroll deals right"
              onClick={() => scrollDeals('right')}
              className="absolute right-2 top-1/2 z-10 hidden h-9 w-7 -translate-y-1/2 items-center justify-center rounded-sm border border-gray-200 bg-white/95 text-gray-700 shadow-sm transition hover:text-red-600 md:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="cosun-shell py-3">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-gray-900">{homeCopy.shopByCategoryTitle}</h2>
            <p className="text-sm text-gray-500">{homeCopy.shopByCategorySubtitle}</p>
          </div>
          <button onClick={() => navigateTo('catalog')} className="hidden text-sm font-bold text-red-600 md:flex">
            {homeCopy.viewAllCategories} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div
          className="grid grid-cols-2 items-start gap-3 md:grid-cols-5"
          style={{ gridAutoRows: 320 }}
        >
          {departments.map((dept) => (
            <button
              key={dept.name}
              onClick={() => navigateTo('catalog')}
              className="group flex h-[320px] min-h-[320px] max-h-[320px] w-full min-w-0 max-w-full flex-col overflow-hidden rounded-sm border border-gray-200 bg-white text-left transition hover:border-red-200 hover:shadow-md"
              style={{ height: 320, minHeight: 320, maxHeight: 320 }}
            >
              <div className="h-[226px] min-h-[226px] max-h-[226px] w-full shrink-0 overflow-hidden bg-gray-100" style={{ height: 226, minHeight: 226, maxHeight: 226 }}>
                <ImageWithFallback src={dept.image} alt={dept.name} className="block h-[226px] min-h-[226px] max-h-[226px] w-full object-cover transition group-hover:scale-105" style={{ height: 226, minHeight: 226, maxHeight: 226 }} />
              </div>
              <div className="flex h-[94px] min-h-[94px] max-h-[94px] shrink-0 items-center justify-between overflow-hidden p-4" style={{ height: 94, minHeight: 94, maxHeight: 94 }}>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-gray-900">{dept.name}</h3>
                  <p className="truncate text-sm text-gray-500">{dept.detail}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-red-600" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="cosun-shell grid gap-4 py-3 md:grid-cols-3">
        <button
          onClick={() => navigateTo('projectsolution')}
          className="h-[144px] rounded-sm bg-gray-900 p-6 text-left text-white"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(17,24,39,0.96), rgba(17,24,39,0.55)), url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80')",
            backgroundSize: 'cover',
          }}
        >
          <h3 className="text-xl font-black uppercase">{homeCopy.featureCards[0][0]}</h3>
          <p className="mt-3 text-sm text-white/85">{homeCopy.featureCards[0][1]}</p>
          <p className="mt-8 text-sm font-bold text-red-300">{homeCopy.featureCards[0][2]} <ChevronRight className="inline h-4 w-4" /></p>
        </button>
        <button onClick={() => navigateTo(user ? 'dashboard' : 'login')} className="relative h-[144px] overflow-hidden rounded-sm bg-red-600 p-6 text-left text-white">
          <h3 className="text-xl font-black uppercase">{homeCopy.featureCards[1][0]}</h3>
          <p className="mt-3 text-sm text-white/90">{homeCopy.featureCards[1][1]}</p>
          <span className="mt-8 inline-flex rounded-sm border border-white px-4 py-2 text-sm font-bold">{homeCopy.featureCards[1][2]}</span>
          <div className="absolute right-8 top-6 hidden h-24 w-20 rounded-sm bg-white/95 p-3 text-red-600 shadow-lg md:block">
            <div className="mb-3 h-2 w-12 rounded bg-gray-300" />
            <div className="mb-2 flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-red-600" /><span className="h-1.5 w-8 rounded bg-gray-300" /></div>
            <div className="mb-2 flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-red-600" /><span className="h-1.5 w-8 rounded bg-gray-300" /></div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-red-600" /><span className="h-1.5 w-8 rounded bg-gray-300" /></div>
          </div>
        </button>
        <button onClick={() => navigateTo('products')} className="relative h-[144px] overflow-hidden rounded-sm bg-gray-100 p-6 text-left">
          <h3 className="text-xl font-black uppercase text-gray-900">{homeCopy.featureCards[2][0]}</h3>
          <p className="mt-3 text-sm text-gray-600">{homeCopy.featureCards[2][1]}</p>
          <p className="mt-8 text-sm font-bold text-red-600">{homeCopy.featureCards[2][2]} <ChevronRight className="inline h-4 w-4" /></p>
          <ImageWithFallback src="https://images.unsplash.com/photo-1595428774862-a79ab68dbabb?auto=format&fit=crop&w=700&q=80" alt="New arrivals" className="absolute bottom-0 right-0 hidden h-full w-44 object-cover opacity-80 md:block" />
        </button>
      </section>

      <section className="cosun-shell py-3">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase text-gray-900">{homeCopy.bestValueTitle}</h2>
            <p className="text-sm text-gray-500">{homeCopy.bestValueSubtitle}</p>
          </div>
          <button onClick={() => navigateTo('products')} className="hidden text-sm font-bold text-red-600 md:flex">
            {homeCopy.viewAllProducts} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid auto-rows-[280px] grid-cols-2 items-start gap-4 md:grid-cols-3 lg:grid-cols-6">
          {bestValueProducts.map((product) => (
            <article key={product.name} className="flex h-[280px] min-h-[280px] max-h-[280px] min-w-0 flex-col overflow-hidden rounded-sm border border-gray-200 bg-white">
              <button onClick={() => navigateTo('catalog')} className="block h-[132px] min-h-[132px] max-h-[132px] w-full shrink-0 overflow-hidden bg-gray-50">
                <div className="h-[132px] min-h-[132px] max-h-[132px] w-full overflow-hidden bg-gray-50">
                  <ImageWithFallback src={product.image} alt={product.name} className="block h-[132px] min-h-[132px] max-h-[132px] w-full object-cover" />
                </div>
              </button>
              <div className="flex h-[148px] min-h-[148px] max-h-[148px] flex-col overflow-hidden p-3">
                <h3 className="line-clamp-2 min-h-[32px] text-sm font-bold leading-4 text-gray-900">{product.name}</h3>
                <p className="truncate text-xs text-gray-500">{product.detail}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  <Rating />
                  <span className="text-[11px] text-gray-400">(12)</span>
                </div>
                <div className="mt-1.5">
                  <span className="text-lg font-black text-gray-900">{product.price}</span>
                  <span className="text-xs text-gray-500"> {product.unit}</span>
                </div>
                <p className="truncate text-xs text-gray-500">{product.min}</p>
                <button onClick={() => navigateTo('catalog')} className={`mt-auto w-full rounded-sm px-3 py-2 text-xs font-bold text-white ${cosunRed}`}>
                  View Catalog
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cosun-shell py-3">
        <div className="rounded-sm border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-xl font-black uppercase text-gray-900">{homeCopy.whyTitle}</h2>
          <div className="grid gap-4 md:grid-cols-6">
            {[Globe2, ShieldCheck, CreditCard, Truck, PackageCheck, Headphones].map((Icon, index) => {
              const [title, text] = homeCopy.whyItems[index];
              const IconComponent = Icon as typeof Globe2;
              return (
                <div key={title} className="flex gap-3">
                  <IconComponent className="h-7 w-7 flex-shrink-0 text-red-600" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="text-xs leading-4 text-gray-500">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="cosun-shell py-3">
        <div className="grid overflow-hidden rounded-sm bg-gray-900 p-6 text-white md:h-[134px] md:grid-cols-[1.15fr_1fr]">
          <div>
            <h2 className="text-xl font-black uppercase">{homeCopy.trustedTitle}</h2>
            <div className="mt-5 grid grid-cols-3 gap-4 md:grid-cols-6">
              {[
                ['500,000+', 'Orders Delivered'],
                ['98.6%', 'On-Time Delivery'],
                ['4.8/5', 'Customer Rating'],
                ['200+', 'Countries Served'],
                ['5,000+', 'Verified Suppliers'],
                ['15+ Years', 'Industry Experience'],
              ].map(([value, label]) => (
                <div key={value} className="border-l border-white/20 pl-3 first:border-l-0 first:pl-0">
                  <div className="text-xl font-black text-red-500">{value}</div>
                  <div className="text-[11px] text-white/70">{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-6 border-t border-white/10 pt-5 md:mt-0 md:border-l md:border-t-0 md:pl-8 md:pt-0">
            <h3 className="font-black">{homeCopy.logisticsTitle}</h3>
            <p className="mt-2 text-sm text-white/75">{homeCopy.logisticsText}</p>
            <button onClick={() => navigateTo('shipmenthub')} className="mt-4 text-sm font-bold text-red-400">
              {homeCopy.logisticsCta} <ChevronRight className="inline h-4 w-4" />
            </button>
            <div className="cosun-world-map" aria-hidden="true">
              <span className="left-[18%] top-[34%]" />
              <span className="left-[46%] top-[28%]" />
              <span className="left-[64%] top-[44%]" />
              <span className="left-[78%] top-[58%]" />
            </div>
          </div>
        </div>
      </section>

      <section className="cosun-shell py-2">
        <div className="relative h-[64px] overflow-hidden rounded-sm border border-gray-200 bg-white px-5 py-2">
          <p className="text-[9px] font-black uppercase leading-none tracking-normal text-gray-700">{homeCopy.partnersTitle}</p>
          <div className="mt-3 flex items-center justify-between gap-6 pr-10 text-center leading-none">
            <div className="min-w-0 flex-1 truncate text-[11px] font-black italic text-blue-700">
              <span className="mr-1.5 inline-block h-1.5 w-5 skew-x-[-24deg] bg-red-600 align-[-1px]" />CEMEX
            </div>
            <div className="min-w-0 flex-1 truncate text-[8px] font-black text-gray-900">
              <span className="mr-1.5 inline-flex h-[14px] w-4 items-end justify-center gap-0.5 align-[-4px]">
                <span className="h-1.5 w-0.5 bg-red-500" />
                <span className="h-2.5 w-0.5 bg-red-500" />
                <span className="h-[14px] w-0.5 bg-red-500" />
                <span className="h-2 w-0.5 bg-red-500" />
              </span>
              SAINT-GOBAIN
            </div>
            <div className="min-w-0 flex-1 truncate text-[10px] font-black text-green-600">
              Schneider<br /><span className="text-[7px]">Electric</span>
            </div>
            <div className="min-w-0 flex-1 truncate text-[9px] font-black text-white">
              <span className="inline-block bg-red-600 px-3 py-1 [clip-path:polygon(12%_0,88%_0,100%_50%,88%_100%,12%_100%,0_50%)]">DOW</span>
            </div>
            <div className="min-w-0 flex-1 truncate font-serif text-[18px] font-black text-gray-900">TOTO</div>
            <div className="min-w-0 flex-1 truncate text-[11px] font-black text-red-600">
              <span className="mr-1.5 inline-block h-3 w-3 rounded-full border border-gray-300 align-[-2px]" />BOSCH
            </div>
            <div className="min-w-0 flex-1 truncate text-[18px] font-black text-red-600">3M</div>
            <div className="min-w-0 flex-1 truncate text-[13px] font-black italic text-gray-900">KNAUF</div>
          </div>
          <button
            onClick={() => navigateTo('suppliers')}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-red-600"
            aria-label="View trusted partners"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="cosun-shell py-3">
        <div className="grid gap-4 rounded-sm bg-red-600 p-5 text-white md:grid-cols-3 md:items-center">
          <div>
            <h2 className="text-xl font-black uppercase">{homeCopy.subscribeTitle}</h2>
            <p className="text-sm text-white/85">{homeCopy.subscribeText}</p>
          </div>
          <div className="flex rounded-sm bg-white p-1">
            <input className="min-w-0 flex-1 px-3 text-sm text-gray-900 outline-none" placeholder={homeCopy.subscribePlaceholder} />
            <button className="rounded-sm bg-gray-900 px-4 py-2 text-sm font-bold text-white">{homeCopy.subscribeButton}</button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs font-bold">
            {homeCopy.subscribeTags.map((tag: string) => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </section>

      <OrderEditingBanner onReturnToOrder={handleReturnToOrder} />
      {false && <LiveBanner />}
    </div>
  );
}
