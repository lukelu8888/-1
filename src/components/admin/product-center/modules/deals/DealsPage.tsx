import { useEffect, useMemo, useState } from 'react';
import { CalendarRange, Pause, Play, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { FieldRow, SectionShell } from '../../shared/SectionShell';
import { RegionPill } from '../../shared/RegionPill';
import { CampaignProductPickerDialog } from '../../shared/CampaignProductPickerDialog';
import { useProductCenter } from '../../context/ProductCenterContext';
import { REGIONS } from '../../context/regionConfig';
import type {
  Campaign,
  CampaignDisplaySlot,
  CampaignTag,
  RegionCode,
} from '../../context/types';

const TAG_LABEL: Record<CampaignTag, string> = {
  hot_sale: '🔥 Hot Sale',
  new_arrival: '✨ New Arrival',
  clearance: '🏷️ Clearance',
  limited_offer: '⏰ Limited Offer',
};

const SLOT_LABEL: Record<CampaignDisplaySlot, string> = {
  homepage_banner: '首页大图',
  homepage_strip: '首页横条',
  category_hero: '分类页 Hero',
  category_strip: '分类页横条',
  cart_recommend: '购物车推荐',
};

export function DealsPage() {
  const ctx = useProductCenter();
  const [active, setActive] = useState<Campaign | null>(ctx.campaigns[0] ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const campaignProductsForActive = useMemo(() => {
    if (!active) return [];
    const ids = ctx.campaignProducts.filter((cp) => cp.campaignId === active.id);
    return ids.map((cp) => ({
      cp,
      product: ctx.products.find((p) => p.id === cp.productId),
    }));
  }, [active, ctx.campaignProducts, ctx.products]);

  const onCreate = () => {
    const newC: Campaign = {
      id: `cmp_${Date.now().toString(36)}`,
      tenantId: 'tenant_default',
      name: '新建活动',
      code: `NEW-${Date.now().toString(36).toUpperCase().slice(-4)}`,
      regionCodes: ['NA'],
      status: 'draft',
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 14 * 86400e3).toISOString(),
      tag: 'hot_sale',
      displaySlots: ['homepage_strip'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ctx.upsertCampaign(newC);
    setActive(newC);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="促销管理 / Deals & Offers"
        subtitle="活动计划 · 活动价 · 区域 · 展示位 · 标签 · 数据预留"
        actions={
          <Button size="sm" className="h-8" onClick={onCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 新建活动
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Campaign list */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 border-b border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            活动列表 ({ctx.campaigns.length})
          </div>
          <ul className="divide-y divide-slate-100">
            {ctx.campaigns.map((c) => {
              const isActive = active?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(c)}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-[12px] hover:bg-slate-50 ${
                      isActive ? 'bg-slate-50' : ''
                    }`}
                  >
                    <CalendarRange className="mt-0.5 h-4 w-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-slate-800">{c.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{c.code}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.regionCodes.map((r) => (
                          <RegionPill key={r} region={r} size="xs" />
                        ))}
                        <span
                          className={`rounded border px-1.5 text-[10px] ${
                            c.status === 'active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : c.status === 'scheduled'
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                : c.status === 'paused'
                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                  : c.status === 'ended'
                                    ? 'border-zinc-200 bg-zinc-50 text-zinc-500'
                                    : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Campaign detail */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
          {active ? (
            <div className="space-y-3 p-3">
              <SectionShell
                title="活动配置"
                actions={
                  <div className="flex gap-1">
                    {active.status !== 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px]"
                        onClick={() => ctx.setCampaignStatus(active.id, 'active')}
                      >
                        <Play className="mr-1 h-3.5 w-3.5" /> 启用
                      </Button>
                    )}
                    {active.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[12px]"
                        onClick={() => ctx.setCampaignStatus(active.id, 'paused')}
                      >
                        <Pause className="mr-1 h-3.5 w-3.5" /> 暂停
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px]"
                      onClick={() => ctx.setCampaignStatus(active.id, 'ended')}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> 结束
                    </Button>
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
                  <div className="min-w-0">
                    <FieldRow label="活动名称" required>
                      <Input
                        value={active.name}
                        onChange={(e) => ctx.upsertCampaign({ ...active, name: e.target.value })}
                        className="h-8"
                      />
                    </FieldRow>
                    <FieldRow label="活动代码">
                      <Input
                        value={active.code}
                        onChange={(e) => ctx.upsertCampaign({ ...active, code: e.target.value })}
                        className="h-8 font-mono"
                      />
                    </FieldRow>
                    <FieldRow label="活动标签">
                      <Select
                        value={active.tag}
                        onValueChange={(v) =>
                          ctx.upsertCampaign({ ...active, tag: v as CampaignTag })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TAG_LABEL) as CampaignTag[]).map((t) => (
                            <SelectItem key={t} value={t}>
                              {TAG_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  </div>
                  <div className="min-w-0">
                    <FieldRow label="开始时间">
                      <Input
                        type="datetime-local"
                        value={active.startsAt.slice(0, 16)}
                        onChange={(e) =>
                          ctx.upsertCampaign({
                            ...active,
                            startsAt: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="h-8"
                      />
                    </FieldRow>
                    <FieldRow label="结束时间">
                      <Input
                        type="datetime-local"
                        value={active.endsAt.slice(0, 16)}
                        onChange={(e) =>
                          ctx.upsertCampaign({
                            ...active,
                            endsAt: new Date(e.target.value).toISOString(),
                          })
                        }
                        className="h-8"
                      />
                    </FieldRow>
                    <FieldRow label="区域">
                      <div className="flex flex-wrap items-center gap-2">
                        {REGIONS.map((r) => {
                          const selected = active.regionCodes.includes(r.code);
                          return (
                            <label key={r.code} className="flex items-center gap-1 text-[12px]">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  const next: RegionCode[] = selected
                                    ? active.regionCodes.filter((x) => x !== r.code)
                                    : [...active.regionCodes, r.code];
                                  ctx.upsertCampaign({ ...active, regionCodes: next });
                                }}
                              />
                              <RegionPill region={r.code} />
                            </label>
                          );
                        })}
                      </div>
                    </FieldRow>
                    <FieldRow label="展示位">
                      <div className="flex flex-wrap items-center gap-2">
                        {(Object.keys(SLOT_LABEL) as CampaignDisplaySlot[]).map((slot) => {
                          const selected = active.displaySlots.includes(slot);
                          return (
                            <label key={slot} className="flex items-center gap-1 text-[12px]">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  const next: CampaignDisplaySlot[] = selected
                                    ? active.displaySlots.filter((x) => x !== slot)
                                    : [...active.displaySlots, slot];
                                  ctx.upsertCampaign({ ...active, displaySlots: next });
                                }}
                              />
                              {SLOT_LABEL[slot]}
                            </label>
                          );
                        })}
                      </div>
                    </FieldRow>
                  </div>
                </div>
              </SectionShell>

              <SectionShell
                title={`活动产品 (${campaignProductsForActive.length})`}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px]"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> 从产品库添加
                  </Button>
                }
              >
                <Table className="text-[12px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="w-12">图</TableHead>
                      <TableHead className="w-40">SKU</TableHead>
                      <TableHead>名称</TableHead>
                      <TableHead className="w-24">币种</TableHead>
                      <TableHead className="w-32 text-right">活动价</TableHead>
                      <TableHead className="w-24 text-right">折扣 %</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignProductsForActive.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-6 text-center text-slate-400">
                          尚未添加产品到该活动 — 点击右上「从产品库添加」
                        </TableCell>
                      </TableRow>
                    )}
                    {campaignProductsForActive.map(({ cp, product }) => (
                      <TableRow key={cp.id}>
                        <TableCell>
                          {product?.thumbnailUrl ? (
                            <img
                              src={product.thumbnailUrl}
                              alt={product.sku}
                              className="h-8 w-8 rounded border object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded border border-dashed bg-slate-50" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{product?.sku ?? cp.productId}</TableCell>
                        <TableCell>{product?.name}</TableCell>
                        <TableCell className="font-mono">
                          <Input
                            value={cp.currency}
                            onChange={(e) =>
                              ctx.updateCampaignProduct({ ...cp, currency: e.target.value.toUpperCase() })
                            }
                            className="h-7 w-20 font-mono text-[12px]"
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <CampaignNumber
                            value={cp.campaignPrice}
                            onCommit={(v) =>
                              ctx.updateCampaignProduct({ ...cp, campaignPrice: v ?? 0 })
                            }
                            decimals={2}
                          />
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <CampaignNumber
                            value={cp.discountPercent ?? null}
                            onCommit={(v) =>
                              ctx.updateCampaignProduct({
                                ...cp,
                                discountPercent: v == null ? undefined : v,
                              })
                            }
                            decimals={1}
                          />
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => {
                              ctx.removeProductFromCampaign(active.id, cp.productId);
                              toast.success('已移除');
                            }}
                            className="rounded p-1 text-rose-600 hover:bg-rose-50"
                            title="移除"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionShell>

              <SectionShell title="活动效果数据" phase="Phase 4">
                <div className="grid grid-cols-3 gap-3 text-[12px]">
                  <Stat label="浏览数" value={active.analyticsViewCount ?? 0} />
                  <Stat label="点击数" value={active.analyticsClickCount ?? 0} />
                  <Stat label="转化数" value={active.analyticsConversionCount ?? 0} />
                </div>
              </SectionShell>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-slate-500">
              请选择或新建活动
            </div>
          )}
        </main>
      </div>

      {active && (
        <CampaignProductPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          campaignId={active.id}
          excludeIds={campaignProductsForActive.map((x) => x.cp.productId)}
        />
      )}
    </div>
  );
}

function CampaignNumber({
  value,
  onCommit,
  decimals = 2,
}: {
  value: number | null | undefined;
  onCommit: (v: number | null) => void;
  decimals?: number;
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  useEffect(() => setDraft(value == null ? '' : String(value)), [value]);
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === '') {
          onCommit(null);
          return;
        }
        const n = Number(draft);
        if (Number.isFinite(n)) {
          const rounded = Math.round(n * 10 ** decimals) / 10 ** decimals;
          if (rounded !== value) onCommit(rounded);
        }
      }}
      className="h-7 text-right font-mono text-[12px]"
    />
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-slate-800">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
