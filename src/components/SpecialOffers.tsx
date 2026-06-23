import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Clock, Database, PackageSearch, ShoppingCart, Tag } from 'lucide-react';
import { toast } from 'sonner';
import type { ProductSpec } from '../data/productData';
import {
  fetchAllProducts,
  PRODUCT_CATALOG_UPDATED_EVENT,
  PRODUCT_CATALOG_UPDATED_STORAGE_KEY,
} from '../lib/services/productCatalogService';
import {
  getBestActivePromotionCampaignAsync,
  getCampaignTimeRemaining,
  PROMOTION_CAMPAIGNS_UPDATED_EVENT,
  type PromotionCampaign,
} from '../lib/promotionCampaigns';
import {
  getProductDiscountLabel,
  getProductDisplayPriority,
  getProductMoq,
  getProductOriginalPrice,
  getProductQuantityStep,
  getProductSpecValue,
  getProductUnit,
  getWebsiteProductSpecLine,
  isWebsiteDealProduct,
} from '../lib/productPublication';
import { useRouter } from '../contexts/RouterContext';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  formatPromotionRemaining,
  promotionLabels,
  translatePromotionText,
} from '../lib/promotionTextLocalization';
import { Button } from './ui/button';

const getProductCategory = (product: ProductSpec) =>
  product.specifications?.Category ||
  product.specifications?.category ||
  product.specifications?.Material ||
  'Catalog Products';

const hasPublicDealPrice = (product: ProductSpec) => Number(product.price || 0) > 0;
const DEAL_PRODUCTS_CACHE_KEY = 'cosun_deal_products_snapshot_v1';

const readDealProductsCache = (): ProductSpec[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DEAL_PRODUCTS_CACHE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => item?.id && item?.name && item?.model)
      : [];
  } catch {
    return [];
  }
};

const writeDealProductsCache = (products: ProductSpec[]) => {
  if (typeof window === 'undefined' || products.length === 0) return;
  try {
    window.localStorage.setItem(DEAL_PRODUCTS_CACHE_KEY, JSON.stringify(products.slice(0, 80)));
  } catch {
    // Cache is only used to avoid a blank first paint.
  }
};

const getCartonCbm = (product: ProductSpec) => {
  const { length, width, height } = product.cartonDimensions || { length: 0, width: 0, height: 0 };
  return Number(((Number(length || 0) * Number(width || 0) * Number(height || 0)) / 1000000).toFixed(3));
};

export function SpecialOffers() {
  const { navigateTo } = useRouter();
  const { addToCart, getTotalItems } = useCart();
  const { language } = useLanguage();
  const promotionCopy = promotionLabels[language];
  const [products, setProducts] = useState<ProductSpec[]>(() => readDealProductsCache());
  const [isLoading, setIsLoading] = useState(() => readDealProductsCache().length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [activeCampaign, setActiveCampaign] = useState<PromotionCampaign | null>(null);
  const [campaignClockNow, setCampaignClockNow] = useState(() => Date.now());
  const campaignRemaining = getCampaignTimeRemaining(activeCampaign, campaignClockNow);

  useEffect(() => {
    let isMounted = true;

    const loadDeals = () => {
      setIsLoading(products.length === 0);
      setLoadError(null);
      getBestActivePromotionCampaignAsync().then((campaign) => {
        if (isMounted) setActiveCampaign(campaign);
      });
      fetchAllProducts()
        .then((items) => {
          if (!isMounted) return;
          const discountedProducts = items
            .filter((item) => item.id && item.name && item.model && hasPublicDealPrice(item) && isWebsiteDealProduct(item))
            .sort((a, b) => getProductDisplayPriority(a) - getProductDisplayPriority(b));
          setProducts(discountedProducts);
          writeDealProductsCache(discountedProducts);
          setQuantities(
            Object.fromEntries(
              discountedProducts.map((product) => [product.id, getProductMoq(product)])
            )
          );
        })
        .catch((error) => {
          if (!isMounted) return;
          console.error('Failed to load product catalog for Deals & Offers:', error);
          if (products.length === 0) setProducts(readDealProductsCache());
          setLoadError('Product catalog is unavailable. Please try again after the product database is connected.');
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    loadDeals();
    const pendingCatalogRefreshTimers: number[] = [];
    const refreshDealsSoon = () => {
      loadDeals();
      pendingCatalogRefreshTimers.push(window.setTimeout(loadDeals, 450));
      pendingCatalogRefreshTimers.push(window.setTimeout(loadDeals, 1200));
    };
    const handleCatalogStorageUpdate = (event: StorageEvent) => {
      if (event.key === PRODUCT_CATALOG_UPDATED_STORAGE_KEY) refreshDealsSoon();
    };
    window.addEventListener(PRODUCT_CATALOG_UPDATED_EVENT, refreshDealsSoon);
    window.addEventListener('storage', handleCatalogStorageUpdate);

    return () => {
      isMounted = false;
      pendingCatalogRefreshTimers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener(PRODUCT_CATALOG_UPDATED_EVENT, refreshDealsSoon);
      window.removeEventListener('storage', handleCatalogStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const refreshCampaign = () => {
      setCampaignClockNow(Date.now());
      getBestActivePromotionCampaignAsync().then(setActiveCampaign);
    };
    const timer = window.setInterval(() => {
      refreshCampaign();
    }, 60_000);
    window.addEventListener(PROMOTION_CAMPAIGNS_UPDATED_EVENT, refreshCampaign);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(PROMOTION_CAMPAIGNS_UPDATED_EVENT, refreshCampaign);
    };
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(getProductCategory))).sort();
    return [
      { id: 'all', label: 'All Deals' },
      ...(activeCampaign?.productIds.length ? [{ id: '__campaign', label: activeCampaign.name }] : []),
      ...uniqueCategories.map((category) => ({ id: category, label: category })),
    ];
  }, [activeCampaign, products]);

  const filteredProducts = useMemo(
    () => selectedCategory === 'all'
      ? products
      : selectedCategory === '__campaign'
        ? products.filter((product) => hasPublicDealPrice(product) && activeCampaign?.productIds.includes(product.id))
      : products.filter((product) => getProductCategory(product) === selectedCategory),
    [activeCampaign, products, selectedCategory]
  );

  const campaignProducts = useMemo(() => {
    if (!activeCampaign) return [];
    const selectedProducts = activeCampaign.productIds.length
      ? products.filter((product) => hasPublicDealPrice(product) && activeCampaign.productIds.includes(product.id))
      : products;
    return selectedProducts.slice(0, 4);
  }, [activeCampaign, products]);

  const setProductQuantity = (id: string, nextQuantity: number, packMultiple = 1) => {
    const pack = Math.max(packMultiple || 1, 1);
    const normalizedQuantity = Math.max(pack, Math.ceil(Math.max(nextQuantity, 0) / pack) * pack);

    setQuantities((current) => ({
      ...current,
      [id]: normalizedQuantity,
    }));
  };

  const addProductToInquiry = (product: ProductSpec) => {
    const packSize = getProductQuantityStep(product);
    const quantity = quantities[product.id] || getProductMoq(product);
    const cartonCbm = getCartonCbm(product);

    addToCart({
      productName: product.name,
      modelNo: product.model,
      image: product.image,
      material: getProductCategory(product),
      color: product.model,
      specification: getWebsiteProductSpecLine(product),
      unitPrice: product.price || 0,
      quantity,
      pcsPerCarton: packSize,
      cartonGrossWeight: product.cartonGrossWeight || 0,
      cartonNetWeight: product.cartonNetWeight || 0,
      cartonSize: product.cartonDimensions
        ? `${product.cartonDimensions.length} x ${product.cartonDimensions.width} x ${product.cartonDimensions.height} cm`
        : '',
      cbmPerCarton: cartonCbm,
    });

    setAddedIds((current) => ({ ...current, [product.id]: true }));
    toast.success('Added to inquiry list', {
      description: `${product.name} - ${quantity} pcs`,
      action: {
        label: 'View',
        onClick: () => navigateTo('cart'),
      },
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <section className="border-b border-gray-200 bg-white">
        <div className="cosun-shell py-5">
          <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="max-w-4xl">
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-red-600">{promotionCopy.dealsEyebrow}</p>
              <h1 className="text-3xl font-black leading-tight tracking-normal md:text-4xl">
                {promotionCopy.dealsPageTitle}
              </h1>
            </div>
            <Button
              onClick={() => navigateTo('cart')}
              className="h-10 w-full bg-red-600 px-4 text-sm font-bold hover:bg-red-700"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {promotionCopy.inquiryList} ({getTotalItems()})
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {activeCampaign && (
        <section className="border-b border-gray-200 bg-white">
          <div className="cosun-shell py-4">
            <div className="grid overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm lg:grid-cols-[380px_minmax(0,1fr)]">
              <div className={`flex min-h-[190px] flex-col justify-center bg-gradient-to-r ${activeCampaign.bannerColor} p-5 text-white md:p-7`}>
                <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase">
                  <span className="bg-white px-2 py-1 text-red-600">{promotionCopy.specialBuy}</span>
                  <span className="border border-white/35 px-2 py-1 text-white/95">{translatePromotionText(activeCampaign.name, language)}</span>
                </div>
                <h2 className="text-2xl font-black uppercase leading-tight md:text-3xl">
                  {translatePromotionText(activeCampaign.headline || activeCampaign.name, language)}
                </h2>
                {activeCampaign.description && (
                  <p className="mt-2 text-sm font-bold leading-5 text-white/90">
                    {translatePromotionText(activeCampaign.description, language)}
                  </p>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-black uppercase">
                  <span className="inline-flex items-center gap-2 border border-white/30 bg-black/10 px-3 py-2">
                    <Clock className="h-4 w-4" />
                    {formatPromotionRemaining(campaignRemaining, promotionCopy)}
                  </span>
                  <span className="border border-white/30 bg-black/10 px-3 py-2">
                    {activeCampaign.productIds.length || filteredProducts.length} {promotionCopy.products}
                  </span>
                </div>
              </div>
              <div className="grid min-h-[190px] grid-cols-2 gap-0 divide-x divide-y divide-gray-100 bg-white md:grid-cols-4 md:divide-y-0">
                {campaignProducts.length > 0 ? campaignProducts.map((product) => {
                  const originalPrice = getProductOriginalPrice(product);
                  const discountLabel = getProductDiscountLabel(product);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setSelectedCategory(activeCampaign.productIds.length ? '__campaign' : 'all')}
                      className="group flex min-w-0 flex-col p-3 text-left transition hover:bg-red-50"
                    >
                      <div className="relative h-24 overflow-hidden bg-gray-50">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <PackageSearch className="h-7 w-7" />
                          </div>
                        )}
                        {discountLabel && (
                          <span className="absolute left-2 top-2 bg-red-600 px-2 py-1 text-[10px] font-black uppercase text-white">
                            {discountLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 truncate text-sm font-black text-gray-950">{product.name}</h3>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-base font-black text-red-600">${(product.price || 0).toFixed(2)}</span>
                        {originalPrice > Number(product.price || 0) && (
                          <span className="text-xs font-bold text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </button>
                  );
                }) : (
                  <div className="col-span-full flex items-center justify-center p-6 text-sm font-bold text-gray-400">
                    {promotionCopy.selectCampaignProducts}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="sticky top-[136px] z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="cosun-shell flex gap-2 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`h-9 shrink-0 rounded-sm border px-3 text-sm font-bold transition ${
                selectedCategory === category.id
                  ? 'border-red-600 bg-red-600 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:text-red-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section className="cosun-shell py-5">
        {isLoading ? (
          <div className="rounded-sm border border-gray-200 bg-white p-8 text-center">
            <PackageSearch className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <p className="text-sm font-bold text-gray-600">{promotionCopy.loadingCatalog}</p>
          </div>
        ) : loadError ? (
          <div className="rounded-sm border border-red-100 bg-white p-8 text-center">
            <Database className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <h2 className="text-base font-black text-gray-950">{promotionCopy.catalogUnavailable}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-gray-500">{loadError}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-sm border border-gray-200 bg-white p-8 text-center">
            <PackageSearch className="mx-auto mb-3 h-8 w-8 text-gray-400" />
            <h2 className="text-base font-black text-gray-950">{promotionCopy.noDiscountedProducts}</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">{promotionCopy.noDiscountedProductsDescription}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-sm border border-gray-200 bg-white">
            <div
              className="hidden border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black uppercase tracking-normal text-gray-500 lg:grid"
              style={{ gridTemplateColumns: '76px minmax(280px,1fr) 132px 220px 104px', columnGap: '12px' }}
            >
              <span>{promotionCopy.product}</span>
              <span>{promotionCopy.catalogInfo}</span>
              <span>{promotionCopy.price}</span>
              <span>{promotionCopy.quantity}</span>
              <span>{promotionCopy.action}</span>
            </div>
            {filteredProducts.map((product) => {
              const quantity = quantities[product.id] || getProductMoq(product);
              const increment = getProductQuantityStep(product);
              const moq = getProductMoq(product);
              const packCount = Math.ceil(quantity / increment);
              const cartonCbm = getCartonCbm(product);
              const originalPrice = getProductOriginalPrice(product);
              const discountLabel = getProductDiscountLabel(product);
              const stock = getProductSpecValue(product, ['Stock', 'Available Stock']);
              const eta = getProductSpecValue(product, ['ETA', 'Lead Time']);
              const validUntil = getProductSpecValue(product, ['Valid Until', 'Valid To']);
              const dealTag = getProductSpecValue(product, ['Deal Tag', 'Front Tag', 'Promotion Tag']);
              const discountPercent = originalPrice > Number(product.price || 0)
                ? Math.round(((originalPrice - Number(product.price || 0)) / originalPrice) * 100)
                : 0;
              const savings = originalPrice > Number(product.price || 0)
                ? (originalPrice - Number(product.price || 0)) * quantity
                : 0;

              return (
                <article
                  key={product.id}
                  className="grid gap-3 border-b border-gray-200 px-3 py-2 last:border-b-0 lg:items-center"
                  style={{ gridTemplateColumns: '76px minmax(280px,1fr) 132px 220px 104px', columnGap: '12px' }}
                >
                  <div className="h-14 overflow-hidden rounded-sm bg-gray-50">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <PackageSearch className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-sm font-black leading-5">{product.name}</h2>
                      <span className="bg-gray-950 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{product.model}</span>
                      {(discountLabel || discountPercent > 0) && (
                        <span className="bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                          {discountLabel || `${discountPercent}% OFF`}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs font-semibold text-gray-500">{getWebsiteProductSpecLine(product)}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-black uppercase leading-none text-gray-600">
                      <span className="rounded-sm bg-gray-100 px-1.5 py-1">MOQ {moq}</span>
                      <span className="rounded-sm bg-gray-100 px-1.5 py-1">Pack {increment} pcs</span>
                      {stock && <span className="rounded-sm bg-gray-100 px-1.5 py-1">Stock {stock}</span>}
                      {eta && <span className="rounded-sm bg-gray-100 px-1.5 py-1">ETA {eta}</span>}
                      {validUntil && <span className="rounded-sm bg-red-50 px-1.5 py-1 text-red-700">Valid {validUntil}</span>}
                      {dealTag && <span className="rounded-sm bg-blue-50 px-1.5 py-1 text-blue-700">{dealTag}</span>}
                      <span className="rounded-sm bg-gray-100 px-1.5 py-1">CBM {cartonCbm.toFixed(3)} m³</span>
                      <span className="rounded-sm bg-gray-100 px-1.5 py-1">GW {product.cartonGrossWeight || 0} kg</span>
                      <span className="rounded-sm bg-gray-100 px-1.5 py-1">NW {product.cartonNetWeight || 0} kg</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-black text-red-600">${(product.price || 0).toFixed(2)}</div>
                    {originalPrice > Number(product.price || 0) && (
                      <div className="text-xs font-bold text-gray-400 line-through">${originalPrice.toFixed(2)}</div>
                    )}
                    <div className="text-xs font-semibold text-gray-500">/{getProductUnit(product)}</div>
                  </div>

                  <div>
                    <div className="mb-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-black uppercase leading-none text-gray-500">
                      <span>{packCount} pack</span>
                      <span className="text-right">Save ${savings.toFixed(0)}</span>
                    </div>
                    <div
                      className="grid overflow-hidden rounded-sm border border-gray-200"
                      style={{ gridTemplateColumns: '34px minmax(0,1fr) 34px' }}
                    >
                      <button
                        type="button"
                        onClick={() => setProductQuantity(product.id, quantity - increment, increment)}
                        className="h-8 bg-gray-50 text-base font-black hover:bg-gray-100"
                      >
                        -
                      </button>
                      <input
                        value={quantity}
                        onChange={(event) => setProductQuantity(product.id, Number(event.target.value) || increment, increment)}
                        className="h-8 min-w-0 border-x border-gray-200 text-center text-sm font-black outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setProductQuantity(product.id, quantity + increment, increment)}
                        className="h-8 bg-gray-50 text-base font-black hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={() => addProductToInquiry(product)}
                    className="h-8 w-full bg-red-600 text-sm font-bold hover:bg-red-700"
                  >
                    {addedIds[product.id] ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Added
                      </>
                    ) : (
                      <>
                        <Tag className="mr-2 h-4 w-4" />
                        Add
                      </>
                    )}
                  </Button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
