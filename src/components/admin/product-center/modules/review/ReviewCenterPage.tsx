import { useMemo, useState } from 'react';
import { AlertTriangle, Check, History, RotateCcw, Shield, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';
import { Checkbox } from '../../../../ui/checkbox';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { StatusBadge } from '../../shared/StatusBadge';
import { useProductCenter } from '../../context/ProductCenterContext';
import type { ReviewStatus } from '../../context/types';
import { ReviewHistoryDrawer } from '../../shared/ReviewHistoryDrawer';

interface Props {
  onOpenProduct: (id: string) => void;
}

const QUEUES: { id: ReviewStatus; label: string }[] = [
  { id: 'not_submitted', label: '草稿 / 未提交' },
  { id: 'pending_review', label: '待审核' },
  { id: 'approved', label: '已通过' },
  { id: 'rejected', label: '已拒绝' },
];

const FLAG_LABEL: Record<string, string> = {
  missingImage: '缺图片',
  missingPrice: '缺价格',
  missingCategory: '未绑分类',
  missingSeo: '缺 SEO',
  missingSupplier: '未绑供应商',
};

export function ReviewCenterPage({ onOpenProduct }: Props) {
  const ctx = useProductCenter();
  const [active, setActive] = useState<ReviewStatus>('pending_review');
  const [selected, setSelected] = useState<string[]>([]);
  const [historyProduct, setHistoryProduct] = useState<string | null>(null);

  const canReview = ctx.canReview();

  const rows = useMemo(() => {
    return ctx.products
      .filter((p) => p.reviewStatus === active)
      .map((p) => {
        const supplier = ctx.supplierLinks.find((sl) => sl.productId === p.id && sl.isPrimary);
        const prices = ctx.regionPrices.filter((rp) => rp.productId === p.id);
        const flags = ctx.getMissingFlags(p.id);
        const priceWarning =
          prices.length > 0 &&
          supplier?.costPrice != null &&
          prices.some((pr) => pr.salePrice != null && pr.salePrice <= supplier.costPrice!);
        return { product: p, flags, priceWarning };
      });
  }, [active, ctx]);

  const stats = useMemo(() => {
    const acc: Record<ReviewStatus, number> = {
      not_submitted: 0,
      pending_review: 0,
      approved: 0,
      rejected: 0,
    };
    ctx.products.forEach((p) => {
      acc[p.reviewStatus] = (acc[p.reviewStatus] ?? 0) + 1;
    });
    return acc;
  }, [ctx.products]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.product.id));
  const toggleAll = () =>
    setSelected(allSelected ? [] : rows.map((r) => r.product.id));

  function safeApprove(id: string) {
    try {
      ctx.approveProduct(id);
      toast.success('已通过');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function safeReject(id: string) {
    const reason = window.prompt('拒绝原因？\n（必填，将写入审核历史与操作日志）', '请补全图片');
    if (!reason) return;
    try {
      ctx.rejectProduct(id, reason);
      toast.success('已拒绝');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function safeReturn(id: string) {
    const reason = window.prompt('退回原因？', '请重新整理后再提交');
    if (!reason) return;
    try {
      ctx.returnToDraft(id, reason);
      toast.success('已退回草稿');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function bulkApprove() {
    if (selected.length === 0) return;
    try {
      const n = ctx.bulkApprove(selected);
      toast.success(`批量通过 ${n} 个产品`);
      setSelected([]);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="审核中心 / Review & Approval"
        subtitle="产品发布前数据质量与合规审核 — 角色受限，记录完整历史"
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-2">
        {QUEUES.map((q) => {
          const isActive = active === q.id;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                setActive(q.id);
                setSelected([]);
              }}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12px] transition-colors ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <StatusBadge kind="review" status={q.id} />
              <span>{q.label}</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px]">
                {stats[q.id]}
              </span>
            </button>
          );
        })}
      </div>

      <Toolbar
        bordered
        left={
          <div className="flex items-center gap-3 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              <Shield className="h-3.5 w-3.5" />
              当前身份：
              <strong>{ctx.currentUser.name}</strong>
              <span className="text-slate-400">·</span>
              <span className={canReview ? 'text-emerald-600' : 'text-rose-600'}>
                {canReview ? '可审核' : '只读'}
              </span>
            </span>
            {!canReview && (
              <span className="text-[11px] text-rose-500">
                请切换到审核员/管理员身份后操作
              </span>
            )}
            <span className="text-slate-500">
              已选 {selected.length} 项
            </span>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            {active === 'pending_review' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px]"
                disabled={!canReview || selected.length === 0}
                onClick={bulkApprove}
              >
                <Check className="mr-1 h-3.5 w-3.5" /> 批量通过
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="全选当前队列"
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-44">SKU / 名称</TableHead>
              <TableHead>缺失提醒</TableHead>
              <TableHead>主状态</TableHead>
              <TableHead>最近审核</TableHead>
              <TableHead>更新</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                  当前队列为空
                </TableCell>
              </TableRow>
            )}
            {rows.map(({ product: p, flags, priceWarning }) => {
              const lastReview = ctx
                .getReviewHistoryForProduct(p.id)
                .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={() => toggle(p.id)}
                      aria-label={`选择 ${p.sku}`}
                    />
                  </TableCell>
                  <TableCell>
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        className="h-9 w-9 rounded border object-cover"
                        alt={p.sku}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded border border-dashed bg-slate-50" />
                    )}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onOpenProduct(p.id)} className="text-left">
                      <div className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                        {p.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {flags.map((f) => (
                        <Pill key={f} tone={f === 'missingSeo' ? 'amber' : 'rose'}>
                          {FLAG_LABEL[f] ?? f}
                        </Pill>
                      ))}
                      {priceWarning && (
                        <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700">
                          <AlertTriangle className="h-3 w-3" /> 价格异常 售价≤成本
                        </span>
                      )}
                      {flags.length === 0 && !priceWarning && (
                        <span className="text-[11px] text-emerald-600">无缺失</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="product" status={p.status} />
                  </TableCell>
                  <TableCell>
                    {lastReview ? (
                      <div className="text-[11px] text-slate-500">
                        <div>
                          {lastReview.actorName ?? '—'}
                          <span className="ml-1 text-slate-400">
                            {new Date(lastReview.occurredAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        {lastReview.reason && (
                          <div className="truncate max-w-[180px]" title={lastReview.reason}>
                            {lastReview.reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(p.updatedAt).toLocaleString('zh-CN', { hour12: false })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-[12px] text-slate-500 hover:bg-slate-100"
                        onClick={() => setHistoryProduct(p.id)}
                        title="审核历史"
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      {active === 'pending_review' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] text-emerald-700 hover:bg-emerald-50"
                            disabled={!canReview}
                            onClick={() => safeApprove(p.id)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" /> 通过
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[12px] text-rose-700 hover:bg-rose-50"
                            disabled={!canReview}
                            onClick={() => safeReject(p.id)}
                          >
                            <X className="mr-1 h-3.5 w-3.5" /> 拒绝
                          </Button>
                        </>
                      )}
                      {active === 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px]"
                          disabled={!canReview}
                          onClick={() => safeReturn(p.id)}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> 退回草稿
                        </Button>
                      )}
                      {active === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[12px]"
                          disabled={!canReview}
                          onClick={() => safeReturn(p.id)}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" /> 撤回
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ReviewHistoryDrawer
        productId={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
}

function Pill({ children, tone }: { children: React.ReactNode; tone: 'rose' | 'amber' }) {
  const classes =
    tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-amber-200 bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${classes}`}>
      {children}
    </span>
  );
}
