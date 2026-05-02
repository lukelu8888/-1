import { useMemo, useState } from 'react';
import { Calculator, Download, History, Search, Sparkles, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { RegionPill } from '../../shared/RegionPill';
import { useProductCenter } from '../../context/ProductCenterContext';
import { REGIONS, formatRegionMoney } from '../../context/regionConfig';
import {
  DEFAULT_DUTY_PERCENT,
  DEFAULT_FX_TO_REGION,
  computeRegionCost,
  suggestSalePrice,
  actualMargin,
} from '../../context/costModel';
import type { RegionCode } from '../../context/types';
import { PriceHistoryDialog } from '../../shared/PriceHistoryDialog';

interface Props {
  onOpenProduct: (id: string) => void;
}

const DEFAULT_SHIPPING_PER_UNIT: Record<RegionCode, number> = {
  NA: 1.2,
  SA: 1.6,
  EA: 1.5,
};

/**
 * Phase 3 — composite cost & margin view.
 * Shows landed cost (factory + fx + shipping + duty + local fees) per region
 * and computes realised margin against the latest sale price.
 */
export function PricingCenterPage({ onOpenProduct }: Props) {
  const ctx = useProductCenter();
  const [keyword, setKeyword] = useState('');
  const [historyProduct, setHistoryProduct] = useState<string | null>(null);
  const [targetMargin, setTargetMargin] = useState(0.35); // 35% default

  const rows = useMemo(() => {
    const list = ctx.products
      .filter((p) => p.status !== 'archived')
      .map((p) => {
        const cost = ctx.supplierLinks.find((s) => s.productId === p.id && s.isPrimary);
        const prices = ctx.regionPrices.filter((rp) => rp.productId === p.id);
        const byRegion: Record<
          RegionCode,
          { sale?: number; campaign?: number | null; landedCost: number; suggested?: number }
        > = {
          NA: { landedCost: 0 },
          SA: { landedCost: 0 },
          EA: { landedCost: 0 },
        };
        REGIONS.forEach((r) => {
          const rp = prices.find((x) => x.regionCode === r.code);
          const breakdown = computeRegionCost(r.code, {
            factoryCost: cost?.costPrice ?? 0,
            shippingPerUnit: DEFAULT_SHIPPING_PER_UNIT[r.code],
          });
          byRegion[r.code] = {
            sale: rp?.salePrice,
            campaign: rp?.campaignPrice ?? null,
            landedCost: breakdown.landedCost,
            suggested: cost?.costPrice
              ? suggestSalePrice(breakdown.landedCost, targetMargin)
              : undefined,
          };
        });
        return { product: p, cost, byRegion };
      });

    if (!keyword.trim()) return list;
    const kw = keyword.toLowerCase();
    return list.filter(
      (r) =>
        r.product.sku.toLowerCase().includes(kw) ||
        r.product.name.toLowerCase().includes(kw),
    );
  }, [ctx.products, ctx.regionPrices, ctx.supplierLinks, keyword, targetMargin]);

  const totals = {
    products: rows.length,
    avgMargin: avgMargin(rows),
    missingPriceCount: rows.filter((r) =>
      Object.values(r.byRegion).every((v) => v.sale == null),
    ).length,
    underTarget: rows.reduce((acc, r) => {
      let n = 0;
      Object.values(r.byRegion).forEach((rp) => {
        const m = actualMargin(rp.sale, rp.landedCost);
        if (m != null && m < targetMargin) n += 1;
      });
      return acc + n;
    }, 0),
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="价格中心 / Pricing Center"
        subtitle="复合成本模型：工厂成本 → 汇率 → 运费 → 关税 → 区域落地价"
        actions={
          <>
            <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info('导入价格表 — Phase 4')}>
              <Upload className="mr-1 h-3.5 w-3.5" /> 导入
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => toast.info('导出价格表 — Phase 4')}>
              <Download className="mr-1 h-3.5 w-3.5" /> 导出
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-stretch border-b border-slate-200 bg-white">
        <Stat label="参与定价产品" value={totals.products} />
        <Stat
          label="平均实际毛利率"
          value={`${(totals.avgMargin * 100).toFixed(1)}%`}
          tone={totals.avgMargin < 0.25 ? 'text-rose-700' : 'text-emerald-700'}
        />
        <Stat label="低于目标毛利" value={totals.underTarget} tone="text-amber-700" />
        <Stat label="无任何区域售价" value={totals.missingPriceCount} tone="text-rose-700" />
        <div className="flex flex-1 items-center gap-3 border-l border-slate-200 px-3 py-2 text-[11px] text-slate-500">
          <Calculator className="h-3.5 w-3.5 text-slate-400" />
          <span>
            落地价 = 工厂成本 × 汇率 + 单件运费 + (上方两项 × 关税%) + 本地杂费
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-700">目标毛利率</span>
            <input
              type="range"
              min={0.05}
              max={0.7}
              step={0.01}
              value={targetMargin}
              onChange={(e) => setTargetMargin(Number(e.target.value))}
              className="w-32"
            />
            <span className="w-12 text-right font-mono text-slate-700">
              {(targetMargin * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      <Toolbar
        bordered
        left={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索 SKU / 名称"
              className="h-8 w-64 pl-7 text-[12px]"
            />
          </div>
        }
        right={
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            {REGIONS.map((r) => (
              <span
                key={r.code}
                className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5"
                title={`默认汇率 ${DEFAULT_FX_TO_REGION[r.code]} · 关税 ${(DEFAULT_DUTY_PERCENT[r.code] * 100).toFixed(0)}% · 运费 ${DEFAULT_SHIPPING_PER_UNIT[r.code]} ${r.currency}`}
              >
                {r.flag} fx {DEFAULT_FX_TO_REGION[r.code]} · 关税 {(DEFAULT_DUTY_PERCENT[r.code] * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">SKU / 名称</TableHead>
              <TableHead className="text-right">工厂成本</TableHead>
              {REGIONS.map((r) => (
                <TableHead key={`l-${r.code}`} className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <RegionPill region={r.code} />
                    <span>落地价</span>
                  </div>
                </TableHead>
              ))}
              {REGIONS.map((r) => (
                <TableHead key={`s-${r.code}`} className="text-right">
                  {r.code} 售价
                </TableHead>
              ))}
              {REGIONS.map((r) => (
                <TableHead key={`m-${r.code}`} className="text-right">
                  {r.code} 实际毛利
                </TableHead>
              ))}
              <TableHead className="w-12 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const cost = row.cost?.costPrice;
              return (
                <TableRow key={row.product.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onOpenProduct(row.product.id)}
                      className="text-left"
                    >
                      <div className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                        {row.product.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {row.product.sku}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {cost != null
                      ? `${row.cost?.costCurrency ?? 'USD'} ${cost.toFixed(2)}`
                      : '—'}
                  </TableCell>
                  {REGIONS.map((r) => (
                    <TableCell key={`l-${r.code}`} className="text-right">
                      {cost != null ? (
                        <div>
                          <div className="font-mono text-slate-700">
                            {formatRegionMoney(r.code, row.byRegion[r.code].landedCost)}
                          </div>
                          {row.byRegion[r.code].suggested != null && (
                            <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600">
                              <Sparkles className="h-2.5 w-2.5" />
                              建议 {formatRegionMoney(r.code, row.byRegion[r.code].suggested!)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </TableCell>
                  ))}
                  {REGIONS.map((r) => {
                    const sale = row.byRegion[r.code].sale;
                    return (
                      <TableCell key={`s-${r.code}`} className="text-right font-mono">
                        {sale != null ? formatRegionMoney(r.code, sale) : '—'}
                        {row.byRegion[r.code].campaign != null && (
                          <div className="text-[10px] text-orange-600">
                            活动 {formatRegionMoney(r.code, row.byRegion[r.code].campaign as number)}
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                  {REGIONS.map((r) => {
                    const sale = row.byRegion[r.code].sale;
                    const m = actualMargin(sale, row.byRegion[r.code].landedCost);
                    return (
                      <TableCell key={`m-${r.code}`} className="text-right font-mono">
                        {m == null ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={
                              m < 0
                                ? 'text-rose-700'
                                : m < targetMargin * 0.6
                                  ? 'text-rose-600'
                                  : m < targetMargin
                                    ? 'text-amber-600'
                                    : 'text-emerald-700'
                            }
                          >
                            {(m * 100).toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-slate-500 hover:bg-slate-100"
                      onClick={() => setHistoryProduct(row.product.id)}
                      title="价格历史"
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PriceHistoryDialog
        productId={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="flex min-w-[160px] flex-1 items-center justify-between gap-3 border-r border-slate-200 px-3 py-2 last:border-r-0">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <span className={`text-base font-semibold tabular-nums ${tone ?? 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

interface PricingRow {
  product: { id: string };
  cost?: { costPrice?: number };
  byRegion: Record<RegionCode, { sale?: number; landedCost: number }>;
}

function avgMargin(rows: PricingRow[]) {
  const margins: number[] = [];
  rows.forEach((r) => {
    Object.values(r.byRegion).forEach((rp) => {
      const m = actualMargin(rp.sale, rp.landedCost);
      if (m != null) margins.push(m);
    });
  });
  if (!margins.length) return 0;
  return margins.reduce((a, b) => a + b, 0) / margins.length;
}
