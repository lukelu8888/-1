import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';

import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS, formatRegionMoney, getRegion } from '../context/regionConfig';
import type { RegionCode } from '../context/types';

interface Props {
  productId: string | null;
  onClose: () => void;
}

const FIELD_LABEL: Record<'base' | 'sale' | 'campaign' | 'cost', string> = {
  base: '基础价',
  sale: '售价',
  campaign: '活动价',
  cost: '成本',
};

const FIELD_COLOR: Record<'base' | 'sale' | 'campaign' | 'cost', string> = {
  base: 'border-slate-300 bg-slate-50 text-slate-700',
  sale: 'border-blue-300 bg-blue-50 text-blue-700',
  campaign: 'border-purple-300 bg-purple-50 text-purple-700',
  cost: 'border-amber-300 bg-amber-50 text-amber-700',
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function diffArrow(from: number | null, to: number | null) {
  if (from == null && to != null) return <ArrowRight className="h-3 w-3 text-emerald-600" />;
  if (from != null && to == null) return <ArrowRight className="h-3 w-3 text-slate-400" />;
  if (from == null || to == null) return <ArrowRight className="h-3 w-3 text-slate-400" />;
  if (to > from) return <ArrowUpRight className="h-3 w-3 text-rose-600" />;
  if (to < from) return <ArrowDownRight className="h-3 w-3 text-emerald-600" />;
  return <ArrowRight className="h-3 w-3 text-slate-400" />;
}

/**
 * Phase 3 — full price-change timeline for one product.
 * Filterable by region + price field.
 */
export function PriceHistoryDialog({ productId, onClose }: Props) {
  const ctx = useProductCenter();
  const [regionFilter, setRegionFilter] = useState<'ALL' | RegionCode>('ALL');
  const [fieldFilter, setFieldFilter] = useState<'ALL' | 'base' | 'sale' | 'campaign'>('ALL');

  const product = productId ? ctx.getProductById(productId) : null;
  const all = useMemo(
    () => (productId ? ctx.getPriceHistoryForProduct(productId) : []),
    [ctx, productId],
  );
  const rows = useMemo(() => {
    let out = [...all].sort((a, b) => b.changedAt.localeCompare(a.changedAt));
    if (regionFilter !== 'ALL') out = out.filter((r) => r.regionCode === regionFilter);
    if (fieldFilter !== 'ALL') out = out.filter((r) => r.field === fieldFilter);
    return out;
  }, [all, regionFilter, fieldFilter]);

  return (
    <Dialog open={Boolean(productId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            <Clock className="mr-2 inline h-4 w-4 text-slate-500" />
            价格历史 · {product?.sku ?? ''} {product?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="text-xs">
            自动记录每次区域价格变更，包含变更人、原值/新值、生效时间和原因。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-3 border-y border-slate-200 px-1 py-3 text-xs">
          <span className="font-medium text-slate-600">筛选：</span>
          <select
            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as 'ALL' | RegionCode)}
          >
            <option value="ALL">全部区域</option>
            {REGIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.flag} {r.name}
              </option>
            ))}
          </select>
          <select
            className="h-7 rounded border border-slate-300 bg-white px-2 text-xs"
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value as 'ALL' | 'base' | 'sale' | 'campaign')}
          >
            <option value="ALL">全部字段</option>
            <option value="base">基础价</option>
            <option value="sale">售价</option>
            <option value="campaign">活动价</option>
          </select>
          <span className="ml-auto text-slate-500">{rows.length} 条记录</span>
        </div>

        <div className="max-h-[480px] overflow-auto">
          {rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">暂无历史记录</div>
          ) : (
            <ol className="relative ml-4 space-y-3 border-l border-slate-200 py-3 pl-6">
              {rows.map((row) => {
                const regionDesc = getRegion(row.regionCode);
                return (
                  <li key={row.id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 shadow" />
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{fmtDate(row.changedAt)}</span>
                      <Badge
                        variant="outline"
                        className={`px-1.5 py-0 text-[10px] ${FIELD_COLOR[row.field]}`}
                      >
                        {FIELD_LABEL[row.field]}
                      </Badge>
                      <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px]">
                        {regionDesc.flag} {regionDesc.name}
                      </span>
                      {row.changedBy && <span className="text-slate-500">· {row.changedBy}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-sm text-slate-800">
                      <span className="text-slate-500 line-through">
                        {row.fromValue == null ? '—' : formatRegionMoney(row.regionCode, row.fromValue)}
                      </span>
                      {diffArrow(row.fromValue ?? null, row.toValue ?? null)}
                      <span className="font-semibold text-slate-900">
                        {row.toValue == null ? '—' : formatRegionMoney(row.regionCode, row.toValue)}
                      </span>
                      {row.fromValue != null && row.toValue != null && row.fromValue > 0 && (
                        <span
                          className={`text-xs ${
                            row.toValue >= row.fromValue ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          ({row.toValue >= row.fromValue ? '+' : ''}
                          {(((row.toValue - row.fromValue) / row.fromValue) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    {(row.reason || row.effectiveFrom) && (
                      <div className="mt-1 text-xs text-slate-600">
                        {row.reason && <span>原因：{row.reason}</span>}
                        {row.effectiveFrom && (
                          <span className="ml-3">
                            生效：{fmtDate(row.effectiveFrom)}
                            {row.effectiveTo ? ` · 失效：${fmtDate(row.effectiveTo)}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
