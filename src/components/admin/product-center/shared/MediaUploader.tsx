/**
 * Phase 5a — shared media upload component.
 *
 * Two surfaces use it (PIM detail "图片与视频" section and the global Media
 * Center page) so we extract the heavy lifting here:
 *
 *   - File picker + drag-drop zone
 *   - Multi-file batch upload with per-file progress + result icons
 *   - Per-file MediaKind selector (defaults to `main` for the first
 *     image, `detail` for subsequent images, `video` for videos)
 *   - Image preview thumbnail before upload
 *   - Error toast on individual failures (the rest of the batch keeps going)
 *
 * The component is "controlled-trigger / uncontrolled-state" — the parent
 * owns the open/close button; we own the staging list and submit flow.
 */

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import {
  CheckCircle2,
  FileVideo,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { useProductCenter } from '../context/ProductCenterContext';
import type { MediaKind } from '../context/types';

const KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: 'main', label: '主图' },
  { value: 'detail', label: '详情图' },
  { value: 'scene', label: '场景图' },
  { value: 'aplus', label: 'A+ 图' },
  { value: 'video', label: '视频' },
];

const ACCEPTED_MIME = 'image/*,video/*';
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file — matches HD's mailer thresholds

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface StagedFile {
  id: string;
  file: File;
  kind: MediaKind;
  previewUrl: string;
  status: UploadStatus;
  errorMessage?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * If provided, uploads are scoped to this product. Used by the PIM
   * detail page. The Media Center version omits this and instead passes
   * a `productPicker` prop (TODO; Phase 5a uses a single-product flow
   * for both surfaces — caller forwards productId from the row).
   */
  productId: string;
  /** Customise the default kind chosen for each new file. */
  defaultKind?: MediaKind;
  /** Optional callback fired after each successful upload. */
  onUploaded?: (count: number) => void;
}

/**
 * Choose a sensible default `MediaKind` based on filename + the user's
 * current selection. Heuristics mirror Home Depot's convention: the first
 * image is the hero (`main`), subsequent images become `detail`, and any
 * video file goes to `video` regardless of position.
 */
function guessKind(file: File, hasMainAlready: boolean): MediaKind {
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name)) {
    return 'video';
  }
  return hasMainAlready ? 'detail' : 'main';
}

function newPreviewUrl(file: File): string {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return '';
  }
  return URL.createObjectURL(file);
}

function newId(): string {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function MediaUploader({
  open,
  onOpenChange,
  productId,
  defaultKind,
  onUploaded,
}: Props) {
  const ctx = useProductCenter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [running, setRunning] = useState(false);

  const counts = useMemo(() => {
    const total = staged.length;
    const success = staged.filter((s) => s.status === 'success').length;
    const error = staged.filter((s) => s.status === 'error').length;
    const pending = staged.filter((s) => s.status === 'pending').length;
    return { total, success, error, pending };
  }, [staged]);

  const reset = () => {
    staged.forEach((s) => {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
    });
    setStaged([]);
    setRunning(false);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const ingest = (files: FileList | File[] | null | undefined) => {
    if (!files) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setStaged((prev) => {
      const hasMain =
        defaultKind !== 'main' &&
        (prev.some((s) => s.kind === 'main') ||
          ctx.getMediaForProduct(productId).some((m) => m.kind === 'main'));
      const next = [...prev];
      let mainSeen = hasMain;
      for (const file of list) {
        if (file.size > MAX_BYTES) {
          toast.warning(`${file.name} 超过 25MB，已跳过`);
          continue;
        }
        const kind = defaultKind ?? guessKind(file, mainSeen);
        if (kind === 'main') mainSeen = true;
        next.push({
          id: newId(),
          file,
          kind,
          previewUrl: newPreviewUrl(file),
          status: 'pending',
        });
      }
      return next;
    });
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    ingest(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    ingest(e.dataTransfer?.files);
  };

  const removeStaged = (id: string) => {
    setStaged((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  };

  const setKind = (id: string, kind: MediaKind) => {
    setStaged((prev) => prev.map((s) => (s.id === id ? { ...s, kind } : s)));
  };

  const submit = async () => {
    if (running) return;
    const queue = staged.filter((s) => s.status === 'pending' || s.status === 'error');
    if (queue.length === 0) {
      toast.info('没有待上传的文件');
      return;
    }
    setRunning(true);
    let successCount = 0;
    // Sequential rather than Promise.all — keeps the per-file status
    // updates and the toast order deterministic, and avoids spamming the
    // bucket with parallel writes the rare browser misbehaves with.
    for (const item of queue) {
      setStaged((prev) =>
        prev.map((s) =>
          s.id === item.id ? { ...s, status: 'uploading', errorMessage: undefined } : s,
        ),
      );
      try {
        await ctx.attachMedia({
          productId,
          kind: item.kind,
          file: item.file,
          altText: item.file.name.replace(/\.[a-z0-9]+$/i, ''),
          sortOrder: 0,
        });
        successCount += 1;
        setStaged((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, status: 'success' } : s)),
        );
      } catch (err) {
        const msg = (err as Error)?.message ?? '上传失败';
        setStaged((prev) =>
          prev.map((s) =>
            s.id === item.id ? { ...s, status: 'error', errorMessage: msg } : s,
          ),
        );
        toast.error(`${item.file.name} 上传失败：${msg}`);
      }
    }
    setRunning(false);
    if (successCount > 0) {
      toast.success(`已上传 ${successCount} 个文件`);
      onUploaded?.(successCount);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[14px] font-semibold text-slate-900">
              上传媒体 / Upload Media
            </DialogTitle>
            <button
              type="button"
              onClick={close}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-3 p-4">
          {/* drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            }`}
          >
            <Upload className="mb-2 h-6 w-6 text-slate-400" />
            <div className="text-[13px] font-medium text-slate-700">
              拖放图片/视频到此处，或
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ml-1 text-blue-600 underline-offset-2 hover:underline"
              >
                点击选择
              </button>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              支持 JPG / PNG / WebP / MP4 / WebM · 单个文件 ≤ 25MB · 可同时上传多个
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              multiple
              accept={ACCEPTED_MIME}
              onChange={onPick}
            />
          </div>

          {/* staged list */}
          {staged.length === 0 ? (
            <div className="rounded border border-dashed border-slate-200 bg-white p-6 text-center text-[12px] text-slate-400">
              尚未选择文件。
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  共 {counts.total} 个 · 待上传 {counts.pending} · 成功 {counts.success}
                  {counts.error > 0 && (
                    <span className="ml-1 text-rose-600">· 失败 {counts.error}</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={reset}
                  className="text-slate-500 hover:text-slate-700 hover:underline"
                  disabled={running}
                >
                  全部清空
                </button>
              </div>

              <div className="max-h-72 space-y-1 overflow-auto rounded border border-slate-200 bg-white p-1">
                {staged.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-slate-50"
                  >
                    <Thumb file={s.file} previewUrl={s.previewUrl} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-medium text-slate-800">
                        {s.file.name}
                      </div>
                      <div className="truncate text-[10px] text-slate-500">
                        {(s.file.size / 1024).toFixed(1)} KB
                        {s.errorMessage && (
                          <span className="ml-1 text-rose-600">· {s.errorMessage}</span>
                        )}
                      </div>
                    </div>

                    <Select
                      value={s.kind}
                      onValueChange={(v) => setKind(s.id, v as MediaKind)}
                    >
                      <SelectTrigger className="h-7 w-24 text-[11px]" disabled={running}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KIND_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <StatusGlyph status={s.status} />

                    <button
                      type="button"
                      onClick={() => removeStaged(s.id)}
                      disabled={running}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      aria-label="移除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2">
          <Button variant="outline" size="sm" onClick={close} disabled={running}>
            关闭
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={running || counts.pending + counts.error === 0}
          >
            {running ? '上传中…' : `上传 ${counts.pending + counts.error} 个文件`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Thumb({ file, previewUrl }: { file: File; previewUrl: string }) {
  const isImage = file.type.startsWith('image/');
  if (isImage && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt=""
        className="h-9 w-9 shrink-0 rounded border border-slate-200 object-cover"
      />
    );
  }
  if (file.type.startsWith('video/')) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
        <FileVideo className="h-4 w-4" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 bg-slate-50 text-slate-400">
      <ImageIcon className="h-4 w-4" />
    </div>
  );
}

function StatusGlyph({ status }: { status: UploadStatus }) {
  if (status === 'uploading') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
  }
  if (status === 'success') {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  }
  if (status === 'error') {
    return <X className="h-3.5 w-3.5 text-rose-600" />;
  }
  return <span className="text-[10px] text-slate-400">待上传</span>;
}
