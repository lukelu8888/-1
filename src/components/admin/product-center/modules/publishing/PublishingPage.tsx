import { useState } from 'react';
import { Archive, Eye, Pause, Send, X } from 'lucide-react';
// (Eye is used in the per-row preview button below.)
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Checkbox } from '../../../../ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { StatusBadge } from '../../shared/StatusBadge';
import { RegionPill } from '../../shared/RegionPill';
import { PublishPreviewModal } from '../../shared/PublishPreviewModal';
import { useProductCenter } from '../../context/ProductCenterContext';
import { REGIONS } from '../../context/regionConfig';
import type { PublishStatus, RegionCode } from '../../context/types';

interface Props {
  onOpenProduct: (id: string) => void;
}

type Bucket = 'queue' | 'live' | 'paused' | 'unpublished' | 'archived';

const BUCKET_DEF: { id: Bucket; label: string; statuses: PublishStatus[]; tone: string }[] = [
  { id: 'queue', label: '待发布 / 定时发布', statuses: ['not_published', 'scheduled'], tone: 'text-slate-700' },
  { id: 'live', label: '已发布', statuses: ['published'], tone: 'text-emerald-700' },
  { id: 'paused', label: '已暂停', statuses: ['paused'], tone: 'text-amber-700' },
  { id: 'unpublished', label: '已下架', statuses: ['unpublished'], tone: 'text-rose-700' },
  { id: 'archived', label: '已归档', statuses: ['archived'], tone: 'text-zinc-500' },
];

export function PublishingPage({ onOpenProduct }: Props) {
  const ctx = useProductCenter();
  const [activeBucket, setActiveBucket] = useState<Bucket>('queue');
  const [bucketRegion, setBucketRegion] = useState<RegionCode | 'ALL'>('ALL');
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);

  const rows = ctx.buildListRows();
  const bucketDef = BUCKET_DEF.find((b) => b.id === activeBucket)!;

  const matchingRows = rows.filter((r) => {
    return (Object.entries(r.publishStatusByRegion) as [RegionCode, PublishStatus][]).some(
      ([region, status]) => {
        if (bucketRegion !== 'ALL' && region !== bucketRegion) return false;
        return bucketDef.statuses.includes(status);
      },
    );
  });

  const counts: Record<Bucket, number> = BUCKET_DEF.reduce(
    (acc, b) => {
      acc[b.id] = rows.filter((r) =>
        (Object.entries(r.publishStatusByRegion) as [RegionCode, PublishStatus][]).some(
          ([_, s]) => b.statuses.includes(s),
        ),
      ).length;
      return acc;
    },
    {} as Record<Bucket, number>,
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const onBulk = (action: 'publish' | 'pause' | 'archive') => {
    const region = bucketRegion === 'ALL' ? ctx.activeRegion : bucketRegion;
    selected.forEach((id) => {
      if (action === 'publish') ctx.publishProduct(id, region);
      if (action === 'pause') ctx.pauseProduct(id, region);
      if (action === 'archive') ctx.archiveProduct(id);
    });
    toast.success(`已批量${action === 'publish' ? '发布' : action === 'pause' ? '暂停' : '归档'} ${selected.size} 项`);
    setSelected(new Set());
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="官网发布 / Website Publishing"
        subtitle="从产品库选择产品发布到官网，按区域控制发布生命周期"
      />

      {/* Bucket tabs */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2">
        {BUCKET_DEF.map((b) => {
          const active = activeBucket === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveBucket(b.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-[12px] transition-colors ${
                active
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`font-medium ${active ? '' : b.tone}`}>{b.label}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                {counts[b.id]}
              </span>
            </button>
          );
        })}
      </div>

      <Toolbar
        bordered
        left={
          <>
            <span className="text-[11px] text-slate-500">区域筛选：</span>
            <button
              type="button"
              onClick={() => setBucketRegion('ALL')}
              className={`rounded border px-2 py-1 text-[11px] ${
                bucketRegion === 'ALL'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white'
              }`}
            >
              全部
            </button>
            {REGIONS.map((r) => (
              <button
                key={r.code}
                type="button"
                onClick={() => setBucketRegion(r.code)}
                className={`rounded border px-2 py-1 text-[11px] ${
                  bucketRegion === r.code
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {r.flag} {r.code}
              </button>
            ))}
          </>
        }
        right={
          selected.size > 0 ? (
            <>
              <span className="text-[11px] text-slate-600">已选 {selected.size} 项 ·</span>
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => onBulk('publish')}>
                <Send className="mr-1 h-3.5 w-3.5" /> 一键发布
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => onBulk('pause')}>
                <Pause className="mr-1 h-3.5 w-3.5" /> 批量暂停
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => onBulk('archive')}>
                <Archive className="mr-1 h-3.5 w-3.5" /> 批量归档
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setSelected(new Set())}>
                <X className="mr-1 h-3.5 w-3.5" /> 清除
              </Button>
            </>
          ) : null
        }
      />

      <div className="flex-1 overflow-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-9"></TableHead>
              <TableHead className="w-12">图</TableHead>
              <TableHead className="w-44">SKU / 名称</TableHead>
              <TableHead className="w-32">分类</TableHead>
              <TableHead>NA</TableHead>
              <TableHead>SA</TableHead>
              <TableHead>EA</TableHead>
              <TableHead className="w-32">最后更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchingRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-slate-400">
                  当前桶为空。
                </TableCell>
              </TableRow>
            )}
            {matchingRows.map((row) => {
              const p = row.product;
              const checked = selected.has(p.id);
              return (
                <TableRow key={p.id} className={checked ? 'bg-amber-50/40' : ''}>
                  <TableCell>
                    <Checkbox checked={checked} onCheckedChange={() => toggle(p.id)} />
                  </TableCell>
                  <TableCell>
                    {p.thumbnailUrl ? (
                      <img src={p.thumbnailUrl} alt={p.sku} className="h-9 w-9 rounded border object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded border border-dashed bg-slate-50" />
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onOpenProduct(p.id)}
                      className="text-left"
                    >
                      <div className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                        {p.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">{row.categoryName ?? '—'}</TableCell>
                  {(['NA', 'SA', 'EA'] as RegionCode[]).map((rc) => (
                    <TableCell key={rc}>
                      <StatusBadge kind="publish" status={row.publishStatusByRegion[rc]} />
                    </TableCell>
                  ))}
                  <TableCell className="text-slate-500">
                    {new Date(p.updatedAt).toLocaleString('zh-CN', { hour12: false, dateStyle: 'short', timeStyle: 'short' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <button
                        title="发布预览"
                        className="rounded p-1 text-slate-500 hover:bg-slate-100"
                        onClick={() => setPreviewProductId(p.id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {REGIONS.map((r) => (
                        <button
                          key={r.code}
                          title={`发布到 ${r.code}`}
                          className="rounded p-1 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                          onClick={() => {
                            ctx.publishProduct(p.id, r.code);
                            toast.success(`已发布到 ${r.code}`);
                          }}
                        >
                          <RegionPill region={r.code} showName={false} />
                        </button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <PublishPreviewModal
        productId={previewProductId}
        onClose={() => setPreviewProductId(null)}
      />
    </div>
  );
}
