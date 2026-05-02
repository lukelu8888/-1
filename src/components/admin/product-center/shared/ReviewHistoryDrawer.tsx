import { useMemo } from 'react';
import { Clock, ShieldCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';

import { useProductCenter } from '../context/ProductCenterContext';
import { StatusBadge } from './StatusBadge';

interface Props {
  productId: string | null;
  onClose: () => void;
}

const FLAG_LABEL: Record<string, string> = {
  missingImage: '缺图片',
  missingPrice: '缺价格',
  missingCategory: '未绑分类',
  missingSeo: '缺 SEO',
  missingSupplier: '未绑供应商',
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}

/**
 * Phase 3 — full audit-style timeline of every review state transition for
 * a product. Used by the Review Center and PIM detail page.
 */
export function ReviewHistoryDrawer({ productId, onClose }: Props) {
  const ctx = useProductCenter();
  const product = productId ? ctx.getProductById(productId) : null;
  const entries = useMemo(
    () =>
      productId
        ? [...ctx.getReviewHistoryForProduct(productId)].sort((a, b) =>
            b.occurredAt.localeCompare(a.occurredAt),
          )
        : [],
    [ctx, productId],
  );

  return (
    <Dialog open={Boolean(productId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            <ShieldCheck className="mr-2 inline h-4 w-4 text-slate-500" />
            审核历史 · {product?.sku ?? ''} {product?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="text-xs">
            每一次提交、通过、拒绝、退回都会写入此处，包含审核人、原因和当时的缺失字段快照。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[480px] overflow-auto">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">暂无审核记录</div>
          ) : (
            <ol className="relative ml-4 space-y-4 border-l border-slate-200 py-4 pl-6">
              {entries.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 shadow" />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span className="font-medium text-slate-800">{fmt(e.occurredAt)}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700">
                      {e.actorName ?? '—'}
                      {e.actorRole && (
                        <span className="ml-1 text-slate-500">/{e.actorRole}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <StatusBadge kind="review" status={e.fromStatus} />
                    <span className="text-slate-400">→</span>
                    <StatusBadge kind="review" status={e.toStatus} />
                  </div>
                  {e.reason && (
                    <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                      {e.reason}
                    </div>
                  )}
                  {e.missingFlags && e.missingFlags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-500">提交时缺失：</span>
                      {e.missingFlags.map((f) => (
                        <span
                          key={f}
                          className="rounded border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-700"
                        >
                          {FLAG_LABEL[f] ?? f}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
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
