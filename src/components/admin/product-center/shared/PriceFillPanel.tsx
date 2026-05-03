/**
 * Phase 5d — PriceFillPanel
 *
 * 「从产品中心引入价格」的可复用面板。
 * 可以嵌入 EditQuotationDialog、SalesQuotationManagement 等任何有 SKU
 * 行的报价/估价编辑器，不依赖这些模块的 Context。
 *
 * UI 工作流：
 *   1. 调用方传入 lines（{lineRef, sku, qty}[]）+ region + customerId
 *   2. 点"引入价格"触发 useQuotationPriceFill.fill()
 *   3. 结果表格展示每行：
 *      - 绿色：resolved，显示最终价 / 来源 / 折扣拆解
 *      - 红色：failed，显示原因（SKU 未找到 / 低于 MOQ / 未设价等）
 *      - checkbox：选择哪些行接受
 *   4. "应用已选" 回调 onAccept(lineRef, unitPrice, currency, incoterm)
 *      —— 由外部决定如何写回各自 quotation state，panel 本身不直接
 *         改任何上层 state（单向数据流）。
 *
 * 设计取舍：
 *   - Panel 可折叠（collapsed/expanded），默认折叠，不强占屏幕空间。
 *   - 用 Dialog-level 的 "collapsible section" 而不是独立 dialog，
 *     因为报价单 dialog 已经够深，再套一层 dialog 体验差。
 *   - 只处理价格填充，不做产品信息同步（名称/规格等）——
 *     B2B 报价单上客户看到的名称常常是客制化的，不能被 PIM 覆盖。
 */

import { useCallback, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Button } from '../../../ui/button';
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
import { Badge } from '../../../ui/badge';
import { cn } from '../../../ui/utils';
import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS } from '../context/regionConfig';
import type { RegionCode } from '../context/types';
import type { QuotationLineResolved } from '../services/productCenterService';
import {
  useQuotationPriceFill,
  type QuotationFillLine,
} from './useQuotationPriceFill';

const SOURCE_LABEL: Record<string, string> = {
  'customer-specific': '客户专属',
  'tier-with-discount': '阶梯+等级折',
  'base-with-discount': '基准+等级折',
  tier: '公共阶梯',
  base: '区域基准',
};

const REASON_LABEL: Record<string, string> = {
  'sku-not-found': 'SKU 未找到',
  'below-moq': '低于 MOQ',
  'no-region-price': '该区域未设价',
  'qty-required': '数量无效',
  unknown: '未知错误',
};

export interface PriceFillPanelProps {
  /** Lines from the quotation — must have sku + qty. */
  lines: QuotationFillLine[];
  /** Default region. The panel lets the user override per-fill. */
  defaultRegion: RegionCode;
  /** Default customer. null = no customer (public pricing). */
  defaultCustomerId: string | null;
  /** Called when the user clicks "应用已选" for accepted lines. */
  onAccept: (
    accepted: Array<{
      lineRef: string | number;
      unitPrice: number;
      currency: string;
      incoterm?: string;
    }>,
  ) => void;
}

export function PriceFillPanel({
  lines,
  defaultRegion,
  defaultCustomerId,
  onAccept,
}: PriceFillPanelProps) {
  const ctx = useProductCenter();
  const { status, results, fill, reset, resolvedCount, failedCount } =
    useQuotationPriceFill();
  const [expanded, setExpanded] = useState(false);
  const [region, setRegion] = useState<RegionCode>(defaultRegion);
  const [customerId, setCustomerId] = useState<string | null>(defaultCustomerId);
  const [accepted, setAccepted] = useState<Set<string | number>>(new Set());

  const customers = ctx.listCustomers();

  const handleFill = () => {
    setAccepted(new Set());
    fill(lines, region, customerId);
    setExpanded(true);
  };

  const toggleAccept = (ref: string | number) => {
    setAccepted((prev) => {
      const next = new Set(prev);
      next.has(ref) ? next.delete(ref) : next.add(ref);
      return next;
    });
  };

  const handleSelectAll = () => {
    const resolvable = results.filter((r) => r.resolved).map((r) => r.lineRef);
    setAccepted(new Set(resolvable));
  };

  const handleApply = () => {
    const toApply = results
      .filter((r) => r.resolved && accepted.has(r.lineRef))
      .map((r) => ({
        lineRef: r.lineRef,
        unitPrice: (r as Extract<QuotationLineResolved, { resolved: true }>).unitPrice,
        currency: (r as Extract<QuotationLineResolved, { resolved: true }>).currency,
        incoterm: (r as Extract<QuotationLineResolved, { resolved: true }>).incoterm,
      }));
    if (toApply.length === 0) return;
    onAccept(toApply);
    reset();
    setExpanded(false);
  };

  const hasLines = lines.length > 0;

  return (
    <div className="rounded border border-dashed border-slate-300 bg-slate-50 text-[12px]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-slate-500" />
        <span className="font-medium text-slate-700">从产品中心引入价格</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-500">
          {lines.length} 行待报价（共 {lines.filter((l) => l.sku?.trim()).length} 有 SKU）
        </span>

        {status === 'done' && (
          <>
            <Badge variant="outline" className="h-5 border-emerald-400 px-1.5 text-[10px] text-emerald-700">
              {resolvedCount} 成功
            </Badge>
            {failedCount > 0 && (
              <Badge variant="outline" className="h-5 border-rose-400 px-1.5 text-[10px] text-rose-700">
                {failedCount} 失败
              </Badge>
            )}
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Region picker */}
          <Select value={region} onValueChange={(v) => setRegion(v as RegionCode)}>
            <SelectTrigger className="h-7 w-[90px] text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.code} · {r.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Customer picker */}
          <Select
            value={customerId ?? 'PUBLIC'}
            onValueChange={(v) => setCustomerId(v === 'PUBLIC' ? null : v)}
          >
            <SelectTrigger className="h-7 w-[160px] text-[12px]">
              <SelectValue placeholder="公共报价" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">公共报价（无客户）</SelectItem>
              {customers.map((c) => {
                const t = ctx.getCustomerTierById(c.tierId);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    {c.shortName ?? c.name}{t ? ` · ${t.name}` : ''}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {status === 'loading' ? (
            <Button size="sm" variant="outline" className="h-7 text-[12px]" disabled>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 查询中…
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px]"
              onClick={handleFill}
              disabled={!hasLines}
            >
              {status === 'done' ? (
                <RefreshCw className="mr-1 h-3 w-3" />
              ) : (
                <Zap className="mr-1 h-3 w-3" />
              )}
              {status === 'done' ? '重新查询' : '引入价格'}
            </Button>
          )}

          {status === 'done' && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-0.5 text-[11px] text-slate-500 hover:text-slate-800"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results table */}
      {expanded && status === 'done' && results.length > 0 && (
        <div className="border-t border-slate-200 px-0">
          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="w-[36px]">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5"
                    checked={accepted.size === resolvedCount && resolvedCount > 0}
                    onChange={handleSelectAll}
                    title="全选已解析"
                  />
                </TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="w-[60px] text-center">数量</TableHead>
                <TableHead className="w-[110px] text-right">建议单价</TableHead>
                <TableHead className="w-[130px]">来源</TableHead>
                <TableHead className="w-[180px]">折扣拆解</TableHead>
                <TableHead className="w-[90px]">Incoterm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) =>
                r.resolved ? (
                  <ResolvedRow
                    key={r.lineRef}
                    row={r}
                    checked={accepted.has(r.lineRef)}
                    onToggle={() => toggleAccept(r.lineRef)}
                  />
                ) : (
                  <FailedRow key={r.lineRef} row={r} />
                ),
              )}
            </TableBody>
          </Table>

          {resolvedCount > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-3 py-2">
              <span className="text-[11px] text-slate-500">
                已选 <span className="font-mono text-slate-700">{accepted.size}</span> / {resolvedCount} 行
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[12px] text-slate-600"
                  onClick={reset}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-[12px]"
                  onClick={handleApply}
                  disabled={accepted.size === 0}
                >
                  应用已选 ({accepted.size})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 border-t border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>查询失败，请检查产品中心服务连接后重试</span>
        </div>
      )}
    </div>
  );
}

// ─── Sub-rows ──────────────────────────────────────────────────────────────

function ResolvedRow({
  row,
  checked,
  onToggle,
}: {
  row: Extract<QuotationLineResolved, { resolved: true }>;
  checked: boolean;
  onToggle: () => void;
}) {
  const hasDiscount = row.discountPercent > 0;
  return (
    <TableRow className={checked ? 'bg-emerald-50/50' : undefined}>
      <TableCell>
        <input
          type="checkbox"
          className="h-3.5 w-3.5"
          checked={checked}
          onChange={onToggle}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
          <span className="font-mono">{row.sku}</span>
        </div>
        <div className="truncate text-[10px] text-slate-500">{row.pimProductName}</div>
      </TableCell>
      <TableCell className="text-center font-mono">{/* qty echoed from parent */}—</TableCell>
      <TableCell className="text-right font-mono font-semibold">
        {row.currency} {row.unitPrice.toFixed(2)}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(
            'h-5 px-1.5 text-[10px]',
            row.source === 'customer-specific'
              ? 'border-indigo-400 text-indigo-700'
              : row.source.startsWith('tier')
                ? 'border-emerald-400 text-emerald-700'
                : 'border-slate-400 text-slate-700',
          )}
        >
          {SOURCE_LABEL[row.source] ?? row.source}
        </Badge>
        {row.customerTierCode && (
          <span className="ml-1 text-[10px] text-slate-500">{row.customerTierCode}</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-[11px]">
        {hasDiscount ? (
          <span>
            {row.currency} {row.listPrice.toFixed(2)}
            <span className="text-slate-500"> ×(1−{row.discountPercent}%)</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </TableCell>
      <TableCell className="font-mono text-[11px]">{row.incoterm ?? '—'}</TableCell>
    </TableRow>
  );
}

function FailedRow({ row }: { row: Extract<QuotationLineResolved, { resolved: false }> }) {
  return (
    <TableRow className="bg-rose-50/30">
      <TableCell>
        <input type="checkbox" className="h-3.5 w-3.5" disabled />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-rose-700">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="font-mono">{row.sku}</span>
        </div>
      </TableCell>
      <TableCell colSpan={5}>
        <span className="text-[11px] text-rose-600">
          {REASON_LABEL[row.reason] ?? row.reason}
          {row.reason === 'below-moq' && row.moq != null && `（MOQ ${row.moq}）`}
        </span>
      </TableCell>
    </TableRow>
  );
}
