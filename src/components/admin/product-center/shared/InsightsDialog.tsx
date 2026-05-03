/**
 * Phase 4d — analytics rollup dialog.
 *
 * Single round-trip dashboard powered by `service.getAnalyticsRollup()`.
 * The dialog keeps the ERP look-and-feel (compact tables, no chart libs)
 * so it matches the rest of the Product Center.
 */
import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, X } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { cn } from '../../../ui/utils';

import {
  getProductCenterService,
  type AnalyticsRollup,
} from '../services/productCenterService';
import { REGIONS } from '../context/regionConfig';
import type { PublishStatus, RegionCode } from '../context/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Region scope. Pass undefined to roll up across all regions. */
  region?: RegionCode;
}

const PUBLISH_STATUS_LABEL: Record<PublishStatus, string> = {
  not_published: '未发布',
  scheduled: '定时',
  published: '已发布',
  paused: '已暂停',
  unpublished: '已下架',
  archived: '已归档',
};

const PUBLISH_STATUS_ORDER: PublishStatus[] = [
  'published',
  'scheduled',
  'paused',
  'unpublished',
  'not_published',
  'archived',
];

export function InsightsDialog({ open, onOpenChange, region }: Props) {
  const [data, setData] = useState<AnalyticsRollup | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getProductCenterService()
      .getAnalyticsRollup({ region })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message ?? '加载失败');
        setLoading(false);
      });
  };

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, region]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[14px] font-semibold text-slate-900">
              产品中心 · 概览 / Insights
              <span className="ml-2 text-[11px] font-normal text-slate-500">
                {region ? `仅 ${region} 区域` : '全部区域'}
              </span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px]"
                onClick={load}
                disabled={loading}
              >
                <RefreshCw
                  className={cn('mr-1 h-3.5 w-3.5', loading && 'animate-spin')}
                />
                刷新
              </Button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto p-4">
          {loading && !data && (
            <div className="flex h-48 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              加载中…
            </div>
          )}
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-[12px] text-rose-700">
              加载失败：{error}
            </div>
          )}
          {data && (
            <div className="space-y-4">
              <TotalsBlock data={data} />
              <DataQualityBlock data={data} />
              <PublishMatrixBlock data={data} />
              <PriceMatrixBlock data={data} />
              <CategoriesBlock data={data} />

              <div className="text-right text-[10px] text-slate-400">
                生成于 {new Date(data.generatedAt).toLocaleString()} ·
                {data.regionFilter ? ` 区域 ${data.regionFilter}` : ' 全部区域'}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── blocks ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'emerald' | 'amber' | 'rose' | 'indigo';
}) {
  const toneClass = {
    slate: 'text-slate-900',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
    indigo: 'text-indigo-700',
  }[tone];
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2">
      <div className="whitespace-nowrap text-[11px] text-slate-500">{label}</div>
      <div className={cn('mt-0.5 text-[18px] font-semibold tabular-nums', toneClass)}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function TotalsBlock({ data }: { data: AnalyticsRollup }) {
  const t = data.totals;
  return (
    <Section title="产品总数与状态分布">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        <StatTile label="全部产品" value={t.all} />
        <StatTile label="启用" value={t.active} tone="emerald" />
        <StatTile label="草稿" value={t.draft} />
        <StatTile label="禁用" value={t.disabled} tone="rose" />
        <StatTile label="归档" value={t.archived} />
        <StatTile label="待审核" value={t.pendingReview} tone="amber" />
        <StatTile label="审核通过" value={t.approved} tone="emerald" />
        <StatTile label="审核拒绝" value={t.rejected} tone="rose" />
        <StatTile label="未提交" value={t.notSubmitted} />
      </div>
    </Section>
  );
}

function DataQualityBlock({ data }: { data: AnalyticsRollup }) {
  const q = data.dataQuality;
  return (
    <Section title="数据质量">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="缺主图" value={q.missingImage} tone="rose" />
        <StatTile label="缺类目" value={q.missingCategory} tone="amber" />
        <StatTile label="缺价格" value={q.missingPrice} tone="rose" />
      </div>
    </Section>
  );
}

function PublishMatrixBlock({ data }: { data: AnalyticsRollup }) {
  const regions = (data.regionFilter ? [data.regionFilter] : (['NA', 'SA', 'EA'] as const));
  return (
    <Section title="各地区发布状态分布">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1.5 font-medium">地区</th>
              {PUBLISH_STATUS_ORDER.map((s) => (
                <th key={s} className="whitespace-nowrap px-2 py-1.5 text-right font-medium">
                  {PUBLISH_STATUS_LABEL[s]}
                </th>
              ))}
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">合计</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((reg) => {
              const meta = REGIONS.find((r) => r.code === reg);
              const m = data.publishStatusByRegion[reg] ?? {};
              const total = Object.values(m).reduce<number>(
                (a, b) => a + (b ?? 0),
                0,
              );
              return (
                <tr key={reg} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-slate-700">
                    {meta?.flag} {reg} · {meta?.name}
                  </td>
                  {PUBLISH_STATUS_ORDER.map((s) => (
                    <td
                      key={s}
                      className={cn(
                        'px-2 py-1.5 text-right tabular-nums',
                        (m[s] ?? 0) === 0 && 'text-slate-300',
                      )}
                    >
                      {m[s] ?? 0}
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-right font-semibold tabular-nums text-slate-900">
                    {total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function PriceMatrixBlock({ data }: { data: AnalyticsRollup }) {
  const regions = (data.regionFilter ? [data.regionFilter] : (['NA', 'SA', 'EA'] as const));
  return (
    <Section title="各地区价格汇总">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-2 py-1.5 font-medium">地区</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">已定价</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">币种</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">售价均值</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">售价最低</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">售价最高</th>
              <th className="whitespace-nowrap px-2 py-1.5 text-right font-medium">标价均值</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((reg) => {
              const meta = REGIONS.find((r) => r.code === reg);
              const s = data.priceSummaryByRegion[reg];
              return (
                <tr key={reg} className="border-b border-slate-100">
                  <td className="whitespace-nowrap px-2 py-1.5 font-medium text-slate-700">
                    {meta?.flag} {reg} · {meta?.name}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{s?.count ?? 0}</td>
                  <td className="px-2 py-1.5 text-right text-slate-500">{s?.currency ?? '—'}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {s?.avgSale != null ? s.avgSale.toFixed(2) : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {s?.minSale != null ? s.minSale.toFixed(2) : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {s?.maxSale != null ? s.maxSale.toFixed(2) : '—'}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">
                    {s?.avgBase != null ? s.avgBase.toFixed(2) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function CategoriesBlock({ data }: { data: AnalyticsRollup }) {
  const top = data.topCategories.slice(0, 10);
  if (top.length === 0) return null;
  const max = Math.max(...top.map((c) => c.count));
  return (
    <Section title="Top 10 类目分布">
      <div className="space-y-1">
        {top.map((c) => {
          const pct = max ? Math.round((c.count / max) * 100) : 0;
          return (
            <div key={c.categoryId ?? '__none__'} className="flex items-center gap-2 text-[12px]">
              <div className="w-40 shrink-0 truncate text-slate-700" title={c.categoryName ?? '未分类'}>
                {c.categoryName ?? <span className="text-slate-400">未分类</span>}
              </div>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-100">
                <div
                  className="absolute inset-y-0 left-0 bg-slate-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 shrink-0 text-right tabular-nums text-slate-500">
                {c.count.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
