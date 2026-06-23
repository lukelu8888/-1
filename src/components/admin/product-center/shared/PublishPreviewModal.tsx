import { useMemo, useState } from 'react';
import { Box, Globe, Image as ImageIcon, ShieldCheck, Truck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';

import { RegionPill } from './RegionPill';
import { StatusBadge } from './StatusBadge';
import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS, formatRegionMoney, getRegion } from '../context/regionConfig';
import type { RegionCode } from '../context/types';

interface Props {
  productId: string | null;
  onClose: () => void;
}

/**
 * Mock front-end PDP preview. Shows how the product would render on the
 * public website for a given region: hero image, title, price, MOQ, lead
 * time, SEO meta. Reads everything from the central store so it reflects
 * unsaved changes after the user saves.
 */
export function PublishPreviewModal({ productId, onClose }: Props) {
  const ctx = useProductCenter();
  const product = productId ? ctx.getProductById(productId) : null;

  // pick a region with status=published if any, else activeRegion
  const channels = productId ? ctx.getPublishChannelsForProduct(productId) : [];
  const defaultRegion: RegionCode =
    channels.find((c) => c.publishStatus === 'published')?.regionCode ??
    ctx.activeRegion ??
    'NA';
  const [region, setRegion] = useState<RegionCode>(defaultRegion);

  const channel = channels.find((c) => c.regionCode === region);
  const price = useMemo(
    () =>
      productId
        ? ctx.regionPrices.find(
            (rp) => rp.productId === productId && rp.regionCode === region,
          )
        : undefined,
    [ctx.regionPrices, productId, region],
  );
  const supplier = productId
    ? ctx.supplierLinks.find((sl) => sl.productId === productId && sl.isPrimary)
    : undefined;
  const cat = product?.primaryCategoryId
    ? ctx.categories.find((c) => c.id === product.primaryCategoryId)
    : undefined;

  const open = Boolean(productId);
  if (!product) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="!max-w-md">
          <DialogHeader>
            <DialogTitle>产品不存在</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const r = getRegion(region);
  const showPrice = channel?.showPriceOnFrontend ?? true;
  const allowInquiry = channel?.allowInquiry ?? true;
  const showMoq = channel?.showMoq ?? true;
  const showLeadTime = channel?.showLeadTime ?? true;
  const media = ctx.getMediaForProduct(product.id);
  const hero = media.find((m) => m.kind === 'main')?.url || product.thumbnailUrl;
  const galleries = media.filter((m) => m.kind !== 'main' && m.kind !== 'video').slice(0, 4);
  const seoTitle = channel?.seoTitle || product.nameEn || product.name;
  const seoDesc = channel?.seoDescription || product.shortDescription || '—';
  const seoSlug = channel?.seoSlug || product.sku.toLowerCase();

  const finalPrice =
    price?.campaignPrice != null && price.campaignPrice > 0
      ? price.campaignPrice
      : price?.salePrice ?? price?.basePrice;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="!max-w-4xl !p-0 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <div className="min-w-0">
            <DialogTitle className="text-[13px] font-semibold">发布预览 · Publish Preview</DialogTitle>
            <DialogDescription className="text-[11px] text-slate-500">
              模拟该产品在所选区域官网的展示效果（含 SEO meta、价格规则、询价按钮）
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {REGIONS.map((rr) => (
              <button
                key={rr.code}
                type="button"
                onClick={() => setRegion(rr.code)}
                className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                  region === rr.code
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {rr.flag} {rr.code}
              </button>
            ))}
          </div>
        </div>

        {/* Mock browser chrome */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-500">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">https://cosun.com/{r.code.toLowerCase()}/p/{seoSlug}</span>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="grid w-full grid-cols-12">

            {/* Gallery — col 5 */}
            <div className="col-span-5 space-y-2 p-4">
              {hero ? (
                <img
                  src={hero}
                  alt={product.name}
                  className="h-56 w-full rounded border border-slate-200 object-contain"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              {galleries.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {galleries.map((m) => (
                    <img
                      key={m.id}
                      src={m.url}
                      alt={m.altText ?? m.kind}
                      className="aspect-square w-full rounded border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* PDP detail — col 7 */}
            <div className="col-span-7 space-y-3 border-l border-slate-200 p-4">
              {/* status & breadcrumb */}
              <div className="flex flex-wrap items-center gap-1.5">
                {channel ? (
                  <StatusBadge kind="publish" status={channel.publishStatus} />
                ) : (
                  <StatusBadge kind="publish" status="not_published" />
                )}
                <RegionPill region={region} />
                {cat && (
                  <span className="text-[11px] text-slate-500">
                    {cat.nameEn ?? cat.name}
                  </span>
                )}
              </div>

              {/* title */}
              <h1 className="text-[18px] font-semibold leading-snug text-slate-900">
                {product.nameEn || product.name}
              </h1>
              {product.nameZh && (
                <p className="text-[12px] text-slate-500">{product.nameZh}</p>
              )}
              <p className="font-mono text-[11px] text-slate-500">SKU: {product.sku}</p>

              {/* price */}
              {showPrice ? (
                finalPrice != null ? (
                  <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="text-[11px] text-slate-500">From / 起售价</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[22px] font-bold text-slate-900">
                        {formatRegionMoney(region, finalPrice)}
                      </span>
                      {price?.salePrice != null &&
                        price?.campaignPrice != null &&
                        price.campaignPrice < price.salePrice && (
                          <span className="text-[12px] text-slate-400 line-through">
                            {formatRegionMoney(region, price.salePrice)}
                          </span>
                        )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded border border-dashed border-rose-300 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
                    该区域未维护价格 — 前台将自动隐藏价格并仅显示询价按钮。
                  </div>
                )
              ) : (
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
                  此产品在该区域设为「不展示前台价格」 → 仅展示询价按钮。
                </div>
              )}

              {/* facts */}
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                {showMoq && product.moq != null && (
                  <Fact icon={<Box className="h-3.5 w-3.5" />} label="MOQ" value={`${product.moq} ${product.unit ?? ''}`} />
                )}
                {showLeadTime && product.leadTimeDays != null && (
                  <Fact
                    icon={<Truck className="h-3.5 w-3.5" />}
                    label="交期"
                    value={`${product.leadTimeDays} 天`}
                  />
                )}
                {product.brand && <Fact label="品牌" value={product.brand} />}
                {product.hsCode && <Fact label="HS Code" value={product.hsCode} />}
                {supplier?.supplierName && (
                  <Fact icon={<ShieldCheck className="h-3.5 w-3.5" />} label="主供应商" value={supplier.supplierName} />
                )}
              </div>

              {/* CTAs */}
              <div className="flex gap-2">
                <button
                  disabled={!allowInquiry}
                  className={`flex-1 rounded px-3 py-2 text-[12px] font-semibold text-white ${
                    allowInquiry
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'cursor-not-allowed bg-slate-300'
                  }`}
                >
                  {allowInquiry ? 'Request Quote / 询价' : '已关闭询价'}
                </button>
                <button className="flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">
                  Add to Cart
                </button>
              </div>

              {/* short description */}
              {product.shortDescription && (
                <p className="rounded border border-slate-200 bg-white p-3 text-[12px] leading-relaxed text-slate-700">
                  {product.shortDescription}
                </p>
              )}

              {/* SEO meta — inline in detail column */}
              <details className="group rounded border border-slate-200 bg-slate-50">
                <summary className="flex cursor-pointer select-none items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100">
                  <span>SEO meta · Region {region}</span>
                  <span className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-slate-200 bg-white px-3 py-2.5 text-[12px]">
                  <div className="text-[13px] text-blue-700">{seoTitle}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-emerald-700">
                    cosun.com/{r.code.toLowerCase()}/p/{seoSlug}
                  </div>
                  <div className="mt-1 text-slate-700">{seoDesc}</div>
                  {channel?.seoKeywords?.length ? (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {channel.seoKeywords.map((k) => (
                        <span
                          key={k}
                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-rose-600">未维护关键词</div>
                  )}
                </div>
              </details>
            </div>

          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 px-4 py-2">
          <Button variant="outline" size="sm" className="h-8" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-slate-200 bg-white px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className="font-medium text-slate-800">{value}</div>
    </div>
  );
}
