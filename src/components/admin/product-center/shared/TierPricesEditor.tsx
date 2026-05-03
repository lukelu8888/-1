/**
 * Phase 5b — B2B 阶梯报价编辑器
 *
 * 嵌入 PIM 详情页「7. 区域价格」区域，与 RegionPricesSection 并列。
 * 设计要点：
 *   1. 一次只编辑一个区域 — B2B 谈价区域差异大，不在同表里横向对比；
 *      用 Tab 切换 NA / SA / EA。
 *   2. inline 表格编辑（min_qty / max_qty / unit_price / discount / incoterm）
 *      —— 不弹 dialog，运营节奏快。
 *   3. 顶部「报价模拟器」：输入数量，实时调用 ctx.getEffectiveTierPrice 看
 *      最终单价。这个 widget 直接对应销售在客户面前的工作流。
 *   4. 保存按钮触发同步校验（MOQ 一致性、最高档开口、阶梯连续性），
 *      error 阻塞保存、warning 仅展示。
 *   5. 「复制到其他区域」一键把当前区域的档位结构 clone 到目标区域，
 *      保留单价不变（运营再按汇率/利润率手工调）。
 */

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calculator,
  Copy,
  Plus,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../ui/table';
import { Switch } from '../../../ui/switch';
import { Badge } from '../../../ui/badge';
import { cn } from '../../../ui/utils';

import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS, getRegion } from '../context/regionConfig';
import type {
  EffectiveCustomerPriceResult,
  ProductTierPrice,
  RegionCode,
  TierIssue,
} from '../context/types';
import { RegionPill } from './RegionPill';
import { CustomerSpecificPricesDialog } from './CustomerSpecificPricesDialog';

const INCOTERM_OPTIONS: ProductTierPrice['incoterm'][] = [
  'EXW',
  'FOB',
  'CIF',
  'DAP',
  'DDP',
];

interface Props {
  productId: string;
}

export function TierPricesEditor({ productId }: Props) {
  const ctx = useProductCenter();
  const product = ctx.getProductById(productId);
  const [region, setRegion] = useState<RegionCode>(ctx.activeRegion);
  // null = "公共报价" (no customer), 'customer-id' = a specific customer.
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [specificDialogOpen, setSpecificDialogOpen] = useState(false);

  const allTiers = ctx.getTierPricesForProduct(productId, region);
  const issues = ctx.validateTierPrices(productId, region);
  const regionInfo = getRegion(region);
  const moq = product?.moq ?? null;

  const baseRegionPrice = useMemo(
    () => ctx.getRegionPricesForProduct(productId).find((p) => p.regionCode === region),
    [ctx, productId, region],
  );

  const specificPricesForProduct = ctx.getCustomerSpecificPricesForProduct(productId);
  const specificCount = specificPricesForProduct.length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-slate-700">阶梯报价</span>
          <Badge
            variant="outline"
            className="h-5 border-slate-300 px-1.5 font-mono text-[10px] text-slate-600"
          >
            B2B
          </Badge>
          {moq != null && (
            <span className="text-[11px] text-slate-500">
              MOQ <span className="font-mono text-slate-700">{moq}</span>
            </span>
          )}
          {issues.length > 0 && <IssuePill issues={issues} />}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">区域</span>
          <div className="flex overflow-hidden rounded border border-slate-300 text-[11px]">
            {REGIONS.map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => setRegion(r.code)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 transition-colors',
                  region === r.code
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100',
                )}
              >
                {r.code} · {r.currency}
              </button>
            ))}
          </div>
          <CopyToOtherRegionsMenu sourceRegion={region} productId={productId} />
        </div>
      </div>

      <PriceSimulator
        productId={productId}
        region={region}
        moq={moq}
        customerId={selectedCustomerId}
        onCustomerChange={setSelectedCustomerId}
      />

      <TiersTable
        productId={productId}
        region={region}
        moq={moq}
        currency={baseRegionPrice?.currency ?? regionInfo.currency}
        basePrice={baseRegionPrice?.basePrice}
        rows={allTiers}
      />

      {issues.length > 0 && <IssueList issues={issues} />}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-dashed border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <UserCircle2 className="h-3.5 w-3.5" />
          <span>客户专属价</span>
          <Badge
            variant="outline"
            className="h-5 border-slate-300 px-1.5 font-mono text-[10px]"
          >
            {specificCount}
          </Badge>
          <span className="text-slate-400">
            · 完全覆盖任何阶梯/折扣，命中即用（年度框架协议、anchor 客户）
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={() => setSpecificDialogOpen(true)}
        >
          管理专属价
        </Button>
      </div>

      <CustomerSpecificPricesDialog
        productId={productId}
        open={specificDialogOpen}
        onOpenChange={setSpecificDialogOpen}
      />
    </div>
  );
}

// ─── Issue badges ──────────────────────────────────────────────────────────

function IssuePill({ issues }: { issues: TierIssue[] }) {
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  if (errors > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700">
        <AlertCircle className="h-3 w-3" /> {errors} 错误
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
      <AlertTriangle className="h-3 w-3" /> {warnings} 警告
    </span>
  );
}

function IssueList({ issues }: { issues: TierIssue[] }) {
  return (
    <ul className="space-y-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[11px]">
      {issues.map((i, idx) => (
        <li
          key={`${i.code}-${idx}`}
          className={cn(
            'flex items-start gap-2',
            i.severity === 'error' ? 'text-rose-700' : 'text-amber-700',
          )}
        >
          {i.severity === 'error' ? (
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          )}
          <span>{i.message}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Price simulator ───────────────────────────────────────────────────────

function PriceSimulator({
  productId,
  region,
  moq,
  customerId,
  onCustomerChange,
}: {
  productId: string;
  region: RegionCode;
  moq: number | null;
  customerId: string | null;
  onCustomerChange: (id: string | null) => void;
}) {
  const ctx = useProductCenter();
  const [qty, setQty] = useState<number>(moq ?? 1);
  const [result, setResult] = useState<EffectiveCustomerPriceResult | null>(null);
  const [loading, setLoading] = useState(false);

  // When the user picks a customer, scope the simulator to that customer's
  // primary region by default. This matches how a sales rep thinks: pick
  // the customer first, then quote in the region they buy from.
  const customers = ctx.listCustomers();
  const selectedCustomer = ctx.getCustomerById(customerId);
  const tier = ctx.getCustomerTierById(selectedCustomer?.tierId);

  useEffect(() => {
    setQty(moq ?? 1);
  }, [moq, region]);

  useEffect(() => {
    if (!qty || qty < 1) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    ctx
      .getEffectiveCustomerPrice({ productId, region, qty, customerId })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .catch(() => {
        if (!cancelled) setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, productId, region, qty, customerId]);

  const message = renderResultMessage(result, qty, moq);
  const tone = renderResultTone(result);

  return (
    <div className="space-y-2 rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <Calculator className="h-4 w-4 shrink-0 text-slate-500" />
        <div className="text-[12px] font-medium text-slate-700">报价模拟器</div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">客户</span>
          <Select
            value={customerId ?? 'PUBLIC'}
            onValueChange={(v) => onCustomerChange(v === 'PUBLIC' ? null : v)}
          >
            <SelectTrigger className="h-7 w-[200px] text-[12px]">
              <SelectValue placeholder="公共报价" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">公共报价（无客户）</SelectItem>
              {customers.map((c) => {
                const t = ctx.getCustomerTierById(c.tierId);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shortName ?? c.name}
                    {t ? ` · ${t.name}` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">数量</span>
          <Input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 0)}
            className="h-7 w-24 text-[12px]"
          />
        </div>

        <RegionPill region={region} />
      </div>

      <div className={cn('text-[12px] font-mono', tone)}>
        {loading ? '…计算中…' : message}
      </div>

      {/* When a customer is selected, show a one-line breakdown to make
          the customer-tier discount transparent (very important for B2B
          sales — no hidden math). */}
      {selectedCustomer && result && result.source !== 'none' && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <Badge
            variant="outline"
            className={cn(
              'h-5 border-slate-300 px-1.5 font-mono text-[10px]',
              tier?.badgeColor === 'yellow' && 'border-yellow-400 text-yellow-700',
              tier?.badgeColor === 'amber' && 'border-amber-400 text-amber-700',
              tier?.badgeColor === 'emerald' && 'border-emerald-400 text-emerald-700',
            )}
          >
            {tier ? tier.name : '无等级'}
          </Badge>
          {result.source === 'customer-specific' ? (
            <span>专属价命中 → 跳过任何 tier 折扣</span>
          ) : (
            <>
              <span>原价 {formatMoney(result.listPrice, result.currency)}</span>
              <span className="text-slate-400">×</span>
              <span>(1 − {result.discountPercent ?? 0}%)</span>
              <span className="text-slate-400">=</span>
              <span className="font-medium text-slate-800">
                {formatMoney(result.unitPrice, result.currency)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function renderResultMessage(
  result: EffectiveCustomerPriceResult | null,
  qty: number,
  moq: number | null,
): string {
  if (!result) return '请输入数量';
  switch (result.source) {
    case 'customer-specific':
      return `命中客户专属价 ${formatMoney(result.unitPrice, result.currency)} / 件${result.incoterm ? ` (${result.incoterm})` : ''}`;
    case 'tier':
    case 'tier-with-discount':
      return `命中阶梯 ${result.minQty}${result.maxQty != null ? `–${result.maxQty - 1}` : '+'} · ${formatMoney(result.unitPrice, result.currency)} / 件${result.incoterm ? ` (${result.incoterm})` : ''}`;
    case 'base':
    case 'base-with-discount':
      return `回退至区域建议价 ${formatMoney(result.unitPrice, result.currency)}（无阶梯命中）`;
    case 'none':
      if (result.reason === 'below-moq') {
        return `数量 ${qty} 低于 MOQ ${result.moq ?? moq}，无法报价`;
      }
      if (result.reason === 'no-region-price') return '该区域尚未设置基准价格';
      return '无可用报价';
    default:
      return '无可用报价';
  }
}

function renderResultTone(result: EffectiveCustomerPriceResult | null): string {
  if (!result) return 'text-slate-500';
  switch (result.source) {
    case 'customer-specific':
      return 'text-indigo-700';
    case 'tier':
    case 'tier-with-discount':
      return 'text-emerald-700';
    case 'base':
    case 'base-with-discount':
      return 'text-slate-700';
    case 'none':
      return 'text-rose-700';
    default:
      return 'text-slate-700';
  }
}

function formatMoney(value: number | undefined, currency: string | undefined) {
  if (value == null) return '—';
  const ccy = currency ?? 'USD';
  return `${ccy} ${value.toFixed(2)}`;
}

// ─── Tier table ────────────────────────────────────────────────────────────

function TiersTable({
  productId,
  region,
  moq,
  currency,
  basePrice,
  rows,
}: {
  productId: string;
  region: RegionCode;
  moq: number | null;
  currency: string;
  basePrice: number | undefined;
  rows: ProductTierPrice[];
}) {
  const ctx = useProductCenter();

  const handleAdd = () => {
    const last = rows[rows.length - 1];
    const nextMin = last
      ? last.maxQty != null
        ? last.maxQty
        : last.minQty + 1000
      : (moq ?? 1);
    const tier: ProductTierPrice = {
      id: `tier_${productId}_${region}_${nextMin}_${Date.now()}`,
      productId,
      regionCode: region,
      minQty: nextMin,
      maxQty: null,
      unitPrice: last?.unitPrice ?? basePrice ?? 0,
      currency,
      incoterm: last?.incoterm,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    if (last && last.maxQty == null) {
      ctx.upsertTierPrice({ ...last, maxQty: nextMin });
    }
    ctx.upsertTierPrice(tier);
  };

  return (
    <div>
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-[110px]">起订量 (≥)</TableHead>
            <TableHead className="w-[110px]">上限 (&lt;, 空=不限)</TableHead>
            <TableHead className="w-[120px] text-right">单价</TableHead>
            <TableHead className="w-[90px]">币种</TableHead>
            <TableHead className="w-[110px] text-right">折扣</TableHead>
            <TableHead className="w-[100px]">Incoterm</TableHead>
            <TableHead className="w-[80px]">启用</TableHead>
            <TableHead className="w-[60px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-4 text-center text-[12px] italic text-slate-400"
              >
                暂无阶梯档位 — 数量 ≥ MOQ 时将回退至区域建议价
                {basePrice != null && ` (${formatMoney(basePrice, currency)})`}
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => (
            <TierRow
              key={row.id}
              tier={row}
              moq={moq}
              basePrice={basePrice}
              onChange={(patch) => ctx.upsertTierPrice({ ...row, ...patch })}
              onRemove={() => {
                if (window.confirm(`删除起订量 ${row.minQty} 这一档？`)) {
                  ctx.removeTierPrice(row.id);
                  toast.success('阶梯价已删除');
                }
              }}
            />
          ))}
        </TableBody>
      </Table>
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[11px] text-slate-500">
          B2B 提示：最低档应等于 MOQ；最高档建议 max_qty 留空（"以上不限"）以覆盖大额订单。
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={handleAdd}
        >
          <Plus className="mr-1 h-3 w-3" /> 增加一档
        </Button>
      </div>
    </div>
  );
}

function TierRow({
  tier,
  moq,
  basePrice,
  onChange,
  onRemove,
}: {
  tier: ProductTierPrice;
  moq: number | null;
  basePrice: number | undefined;
  onChange: (patch: Partial<ProductTierPrice>) => void;
  onRemove: () => void;
}) {
  // 自动计算折扣百分比展示（不入库 — 入库的 discountPercent 仅在 UI 表单填写时存）
  const inferredDiscount =
    basePrice != null && basePrice > 0
      ? ((basePrice - tier.unitPrice) / basePrice) * 100
      : null;
  const belowMoq = moq != null && tier.minQty < moq;

  return (
    <TableRow className={belowMoq ? 'bg-rose-50/40' : undefined}>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={tier.minQty}
          onChange={(e) => onChange({ minQty: Number(e.target.value) || 0 })}
          className={cn(
            'h-7 w-24 text-[12px] font-mono',
            belowMoq && 'border-rose-300 text-rose-700',
          )}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={tier.minQty + 1}
          value={tier.maxQty ?? ''}
          placeholder="不限"
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange({ maxQty: v === '' ? null : Number(v) });
          }}
          className="h-7 w-24 text-[12px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={0}
          step="0.01"
          value={tier.unitPrice}
          onChange={(e) => onChange({ unitPrice: Number(e.target.value) || 0 })}
          className="h-7 w-28 text-right text-[12px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          value={tier.currency}
          onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
          className="h-7 w-16 text-[12px] font-mono"
          maxLength={3}
        />
      </TableCell>
      <TableCell className="text-right">
        <span className="font-mono text-[11px] text-slate-600">
          {inferredDiscount != null && inferredDiscount > 0
            ? `-${inferredDiscount.toFixed(1)}%`
            : '—'}
        </span>
      </TableCell>
      <TableCell>
        <Select
          value={tier.incoterm ?? 'NONE'}
          onValueChange={(v) =>
            onChange({
              incoterm:
                v === 'NONE' ? undefined : (v as ProductTierPrice['incoterm']),
            })
          }
        >
          <SelectTrigger className="h-7 text-[12px]">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">—</SelectItem>
            {INCOTERM_OPTIONS.map((i) => (
              <SelectItem key={i} value={i!}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Switch
          checked={tier.isActive}
          onCheckedChange={(v) => onChange({ isActive: v })}
        />
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-500 hover:text-rose-600"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Copy-to-other-regions menu ────────────────────────────────────────────

function CopyToOtherRegionsMenu({
  productId,
  sourceRegion,
}: {
  productId: string;
  sourceRegion: RegionCode;
}) {
  const ctx = useProductCenter();
  const sourceTiers = ctx.getTierPricesForProduct(productId, sourceRegion);
  if (sourceTiers.length === 0) return null;

  const handleCopyTo = (targetRegion: RegionCode) => {
    const targetCurrency = getRegion(targetRegion).currency;
    sourceTiers.forEach((src, idx) => {
      const cloned: ProductTierPrice = {
        ...src,
        id: `tier_${productId}_${targetRegion}_${src.minQty}_${Date.now() + idx}`,
        regionCode: targetRegion,
        currency: targetCurrency,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      ctx.upsertTierPrice(cloned);
    });
    toast.success(`已复制 ${sourceTiers.length} 档到 ${targetRegion}（请按汇率/利润率手工调整单价）`);
  };

  return (
    <Select onValueChange={(v) => handleCopyTo(v as RegionCode)}>
      <SelectTrigger className="h-7 w-auto gap-1 text-[11px]">
        <Copy className="h-3 w-3" />
        <span>复制到</span>
      </SelectTrigger>
      <SelectContent>
        {REGIONS.filter((r) => r.code !== sourceRegion).map((r) => (
          <SelectItem key={r.code} value={r.code}>
            {r.code} · {r.currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
