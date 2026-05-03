import { useMemo, useState } from 'react';
import { Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '../../../../ui/input';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { MediaUploader } from '../../shared/MediaUploader';
import { useProductCenter } from '../../context/ProductCenterContext';
import type { MediaKind } from '../../context/types';

interface Props {
  onOpenProduct: (id: string) => void;
}

const KIND_LABEL: Record<MediaKind, string> = {
  main: '主图',
  detail: '详情图',
  scene: '场景图',
  aplus: 'A+ 图',
  video: '视频',
};

export function MediaCenterPage({ onOpenProduct }: Props) {
  const ctx = useProductCenter();
  const [keyword, setKeyword] = useState('');
  const [kindFilter, setKindFilter] = useState<MediaKind | 'ALL'>('ALL');
  /**
   * Phase 5a — single uploader instance shared across rows. We open it
   * with a target productId rather than embedding one dialog per row,
   * which keeps DOM footprint tiny on long lists.
   */
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const productList = ctx.products.filter(
      (p) => !kw || p.sku.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw),
    );
    return productList
      .map((p) => ({
        product: p,
        media: ctx
          .getMediaForProduct(p.id)
          .filter((m) => kindFilter === 'ALL' || m.kind === kindFilter),
      }))
      .filter(
        (g) =>
          g.media.length > 0 ||
          (kindFilter === 'ALL' && !g.product.thumbnailUrl),
      );
  }, [ctx, keyword, kindFilter]);

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="媒体中心 / Media Center"
        subtitle="主图 · 详情图 · 应用场景图 · A+ · 视频 · PDF · 认证文件"
        actions={
          <span className="text-[11px] text-slate-500">
            点击下方产品的「+ 上传」按钮，可批量上传该产品的图片/视频
          </span>
        }
      />

      <Toolbar
        bordered
        left={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索 SKU / 名称"
                className="h-8 w-64 pl-7 text-[12px]"
              />
            </div>
            <div className="flex gap-1">
              {(['ALL', 'main', 'detail', 'scene', 'aplus', 'video'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindFilter(k as any)}
                  className={`rounded border px-2 py-1 text-[11px] ${
                    kindFilter === k
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {k === 'ALL' ? '全部' : KIND_LABEL[k as MediaKind]}
                </button>
              ))}
            </div>
          </>
        }
      />

      <div className="flex-1 overflow-auto p-3">
        {grouped.length === 0 && (
          <div className="rounded border border-dashed border-slate-300 bg-white p-10 text-center text-[12px] text-slate-500">
            没有匹配的媒体资源。
          </div>
        )}

        <div className="space-y-3">
          {grouped.map((g) => (
            <div key={g.product.id} className="rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => onOpenProduct(g.product.id)}
                  className="flex items-center gap-2 text-left text-[13px]"
                >
                  {g.product.thumbnailUrl ? (
                    <img src={g.product.thumbnailUrl} className="h-8 w-8 rounded border object-cover" alt={g.product.sku} />
                  ) : (
                    <div className="h-8 w-8 rounded border border-dashed bg-slate-50" />
                  )}
                  <div>
                    <div className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                      {g.product.name}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">{g.product.sku}</div>
                  </div>
                </button>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <ImageIcon className="h-3.5 w-3.5" />
                  共 {g.media.length} 项
                  <button
                    type="button"
                    onClick={() => setUploadTarget(g.product.id)}
                    className="ml-1 inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  >
                    <Upload className="h-3 w-3" />
                    上传
                  </button>
                </div>
              </div>

              {g.media.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
                  {g.media.map((m) => (
                    <div key={m.id} className="rounded border border-slate-200 bg-white p-1">
                      <img
                        src={m.url}
                        alt={m.altText ?? m.kind}
                        className="aspect-square w-full rounded object-cover"
                        loading="lazy"
                      />
                      <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-500">
                        <span className="truncate whitespace-nowrap rounded bg-slate-100 px-1">
                          {KIND_LABEL[m.kind]}
                        </span>
                        <button
                          onClick={() => {
                            ctx.removeMedia(m.id);
                            toast.success('已移除');
                          }}
                          className="shrink-0 rounded p-0.5 text-rose-600 hover:bg-rose-50"
                          title="移除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-[12px] text-rose-600">该产品缺少图片</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {uploadTarget && (
        <MediaUploader
          open
          onOpenChange={(o) => {
            if (!o) setUploadTarget(null);
          }}
          productId={uploadTarget}
        />
      )}
    </div>
  );
}
