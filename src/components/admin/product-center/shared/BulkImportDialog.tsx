/**
 * Phase 4e — bulk-import wizard for products.
 *
 * Three-step flow:
 *
 *   1. Upload    Drag/drop a CSV (or click to choose). The CSV may use
 *                English keys or Chinese labels — both are accepted via
 *                `normalizeImportRow`. A "下载模板" button gives users a
 *                blank header row to fill in.
 *
 *   2. Preview   We pre-validate every row in-browser (sku non-empty,
 *                name non-empty for new SKUs, category code resolves to
 *                a known category). Errors are highlighted; the user
 *                sees a created/updated/error count BEFORE they commit.
 *
 *   3. Result    After the user confirms, we call
 *                `ctx.bulkUpsertProducts(rows)`. The dialog then shows
 *                what actually happened (the server may surface
 *                additional errors, e.g. RLS denials in supabase mode).
 *
 * The dialog is dataless on close — every state slice is local to it
 * so opening fresh always starts from step 1.
 */
import {
  ChangeEvent,
  DragEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { cn } from '../../../ui/utils';
import { toast } from 'sonner';

import { useProductCenter } from '../context/ProductCenterContext';
import {
  csvToObjects,
  downloadCsv,
} from '../services/csv';
import {
  COLUMN_LABELS,
  IMPORT_COLUMNS,
  REQUIRED_COLUMNS,
  buildDynamicImportTemplate,
  buildDynamicImportWorkbookHtml,
  normalizeImportRow,
} from '../services/productImportColumns';
import type {
  BulkImportError,
  BulkImportResult,
  BulkImportRow,
} from '../services/productCenterService';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'result';

interface PreviewRow {
  index: number;
  row: BulkImportRow;
  /** Pre-validation outcome — present means this row will be skipped. */
  error?: string;
  /** What we expect to happen if no server-side error occurs. */
  fate: 'create' | 'update' | 'skip';
}

const PREVIEW_LIMIT = 50;

export function BulkImportDialog({ open, onOpenChange }: Props) {
  const ctx = useProductCenter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('upload');
  const [filename, setFilename] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep('upload');
    setFilename(null);
    setRows([]);
    setSubmitting(false);
    setResult(null);
    setParseError(null);
  };

  const counts = useMemo(() => {
    const create = rows.filter((r) => r.fate === 'create').length;
    const update = rows.filter((r) => r.fate === 'update').length;
    const skip = rows.filter((r) => r.fate === 'skip').length;
    return { total: rows.length, create, update, skip };
  }, [rows]);

  // ── step 1: upload ─────────────────────────────────────────────────────────

  const ingestText = (text: string, name: string) => {
    try {
      const parsed = csvToObjects(text);
      if (parsed.length === 0) {
        setParseError('CSV 没有数据行（请检查表头是否正确）');
        return;
      }
      const skuToProduct = new Map(
        ctx.products.map((p) => [p.sku.toLowerCase(), p] as const),
      );
      const parentCategoryIds = new Set(ctx.categories.map((c) => c.parentId).filter(Boolean));
      const knownCodes = new Set(
        ctx.categories
          .filter((c) => c.isActive && !parentCategoryIds.has(c.id))
          .map((c) => c.code),
      );

      const previewRows: PreviewRow[] = parsed.map((raw, i) => {
        const row = normalizeImportRow(raw);
        const sku = String(row.sku ?? '').trim();
        const name = String(row.name ?? '').trim();
        let error: string | undefined;
        let fate: PreviewRow['fate'] = 'create';

        if (!sku) {
          error = '缺少 SKU';
          fate = 'skip';
        } else if (
          row.primaryCategoryCode &&
          !knownCodes.has(String(row.primaryCategoryCode))
        ) {
          error = `未知或非末级主类目编码：${row.primaryCategoryCode}`;
          fate = 'skip';
        } else if (skuToProduct.has(sku.toLowerCase())) {
          fate = 'update';
        } else if (!name) {
          error = '新建产品缺少名称';
          fate = 'skip';
        }

        return { index: i + 1, row, error, fate };
      });

      setRows(previewRows);
      setFilename(name);
      setParseError(null);
      setStep('preview');
    } catch (err) {
      setParseError((err as Error)?.message ?? '解析失败');
    }
  };

  const handleFileChosen = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('请选择 CSV 文件（如有 Excel，请另存为 CSV/UTF-8）');
      return;
    }
    const text = await file.text();
    ingestText(text, file.name);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    void handleFileChosen(file);
  };

  // ── step 3: submit ─────────────────────────────────────────────────────────

  const submit = async () => {
    const validRows = rows.filter((r) => r.fate !== 'skip').map((r) => r.row);
    if (validRows.length === 0) {
      toast.warning('没有可提交的有效行');
      return;
    }
    setSubmitting(true);
    try {
      const res = await ctx.bulkUpsertProducts(validRows);
      // Merge server-side errors with client-side skips so the result
      // table shows both kinds of failure.
      const skipErrors: BulkImportError[] = rows
        .filter((r) => r.fate === 'skip')
        .map((r) => ({
          index: r.index,
          sku: typeof r.row.sku === 'string' ? r.row.sku : undefined,
          message: r.error ?? '已跳过',
        }));
      setResult({
        created: res.created,
        updated: res.updated,
        errors: [...skipErrors, ...res.errors].sort((a, b) => a.index - b.index),
      });
      setStep('result');
      if (res.created || res.updated) {
        toast.success(`导入完成：新增 ${res.created} · 更新 ${res.updated}`);
      }
    } catch (err) {
      const msg = (err as Error)?.message ?? '导入失败';
      toast.error(`导入失败：${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-[14px] font-semibold text-slate-900">
              批量导入产品 / Bulk Import
              <StepIndicator step={step} className="ml-3" />
            </DialogTitle>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto p-4">
          {step === 'upload' && (
            <UploadStep
              dragOver={dragOver}
              parseError={parseError}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onPickClick={() => fileInputRef.current?.click()}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleFileChosen(e.target.files?.[0])
              }
              fileInputRef={fileInputRef}
              onDownloadCsvTemplate={() => {
                downloadCsv(
                  buildDynamicImportTemplate(ctx.categories, ctx.attributes),
                  'product_import_template',
                );
              }}
              onDownloadExcelTemplate={() => {
                downloadExcelHtml(
                  buildDynamicImportWorkbookHtml(ctx.categories, ctx.attributes),
                  'product_import_template',
                );
              }}
            />
          )}

          {step === 'preview' && (
            <PreviewStep
              filename={filename}
              counts={counts}
              rows={rows}
              onBack={() => setStep('upload')}
              onSubmit={submit}
              submitting={submitting}
            />
          )}

          {step === 'result' && result && (
            <ResultStep result={result} onClose={() => onOpenChange(false)} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── sub-components ──────────────────────────────────────────────────────────

function StepIndicator({ step, className }: { step: Step; className?: string }) {
  const items: Array<{ id: Step; label: string }> = [
    { id: 'upload', label: '1. 选择文件' },
    { id: 'preview', label: '2. 预览校验' },
    { id: 'result', label: '3. 导入结果' },
  ];
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-normal', className)}>
      {items.map((it, i) => (
        <span key={it.id} className="inline-flex items-center gap-1">
          <span
            className={cn(
              'whitespace-nowrap rounded px-1.5 py-0.5',
              step === it.id
                ? 'bg-slate-900 text-white'
                : i < items.findIndex((x) => x.id === step)
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500',
            )}
          >
            {it.label}
          </span>
          {i < items.length - 1 && <span className="text-slate-300">›</span>}
        </span>
      ))}
    </span>
  );
}

function UploadStep(props: {
  dragOver: boolean;
  parseError: string | null;
  onDragEnter: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onPickClick: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onDownloadCsvTemplate: () => void;
  onDownloadExcelTemplate: () => void;
}) {
  return (
    <div className="space-y-3">
      <div
        onDragEnter={props.onDragEnter}
        onDragLeave={props.onDragLeave}
        onDragOver={props.onDragOver}
        onDrop={props.onDrop}
        onClick={props.onPickClick}
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-10 text-center transition-colors',
          props.dragOver
            ? 'border-slate-900 bg-slate-50 text-slate-900'
            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50',
        )}
      >
        <FileSpreadsheet className="h-8 w-8 text-slate-400" />
        <div className="text-[13px] font-medium">
          将 CSV 文件拖到这里，或<span className="text-slate-900">点击选择文件</span>
        </div>
        <div className="text-[11px] text-slate-500">
          支持 UTF-8 编码 · 表头可使用中文标签或英文键名
        </div>
        <input
          ref={props.fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={props.onChange}
        />
      </div>

      {props.parseError && (
        <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2 text-[12px] text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{props.parseError}</span>
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-600">
        <div>
          <div className="font-medium text-slate-700">需要参考列结构？</div>
          <div className="text-[11px] text-slate-500">
            下载只含表头的模板。从已有产品导出再编辑也可以直接重新导入。
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={props.onDownloadCsvTemplate}
        >
          <Download className="mr-1 h-3.5 w-3.5" />
          下载 CSV
        </Button>
        <Button
          size="sm"
          className="h-7 text-[12px]"
          onClick={props.onDownloadExcelTemplate}
        >
          <Download className="mr-1 h-3.5 w-3.5" />
          下载 Excel 字典模板
        </Button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3 text-[12px] text-slate-600">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          支持的列
        </div>
        <div className="flex flex-wrap gap-1">
          {IMPORT_COLUMNS.map((k) => (
            <span
              key={k}
              className={cn(
                'rounded border px-1.5 py-0.5 text-[11px]',
                REQUIRED_COLUMNS.includes(k)
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600',
              )}
              title={REQUIRED_COLUMNS.includes(k) ? '必填' : '可选'}
            >
              {COLUMN_LABELS[k]}
              <span className="ml-1 text-[10px] text-slate-400">{k}</span>
            </span>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          带红色标记的列必填。其他列留空即保持现有数据不变（更新模式）。
        </div>
      </div>
    </div>
  );
}

function downloadExcelHtml(html: string, filename: string) {
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function PreviewStep(props: {
  filename: string | null;
  counts: { total: number; create: number; update: number; skip: number };
  rows: PreviewRow[];
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { filename, counts, rows, onBack, onSubmit, submitting } = props;
  const previewRows = rows.slice(0, PREVIEW_LIMIT);
  const more = rows.length - previewRows.length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="text-[12px] text-slate-600">
          <span className="font-medium text-slate-900">{filename}</span>
          <span className="mx-2 text-slate-400">·</span>
          共 {counts.total} 行
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <Pill tone="emerald">新增 {counts.create}</Pill>
          <Pill tone="indigo">更新 {counts.update}</Pill>
          <Pill tone="rose">跳过 {counts.skip}</Pill>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full min-w-[820px] text-[12px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="w-10 px-2 py-1.5 font-medium">#</th>
              <th className="w-20 px-2 py-1.5 font-medium">操作</th>
              <th className="px-2 py-1.5 font-medium">SKU</th>
              <th className="px-2 py-1.5 font-medium">名称</th>
              <th className="px-2 py-1.5 font-medium">类目</th>
              <th className="px-2 py-1.5 font-medium">地区/价格</th>
              <th className="px-2 py-1.5 font-medium">备注</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r) => (
              <tr
                key={r.index}
                className={cn(
                  'border-b border-slate-100 last:border-b-0',
                  r.fate === 'skip' && 'bg-rose-50/40',
                )}
              >
                <td className="whitespace-nowrap px-2 py-1.5 text-slate-400">{r.index}</td>
                <td className="px-2 py-1.5">
                  <FateBadge fate={r.fate} />
                </td>
                <td className="px-2 py-1.5 font-mono text-slate-700">
                  {String(r.row.sku ?? '')}
                </td>
                <td className="px-2 py-1.5">
                  <div className="text-slate-800">{String(r.row.name ?? '')}</div>
                  <div className="text-[11px] text-slate-400">{String(r.row.nameEn ?? '')}</div>
                </td>
                <td className="px-2 py-1.5 text-slate-600">
                  {String(r.row.primaryCategoryCode ?? '')}
                </td>
                <td className="px-2 py-1.5 text-slate-600">
                  {r.row.region ? (
                    <>
                      <span className="font-medium">{String(r.row.region)}</span>
                      {' '}
                      {String(r.row.basePrice ?? '')} {String(r.row.currency ?? '')}
                    </>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td
                  className={cn(
                    'px-2 py-1.5',
                    r.error ? 'text-rose-700' : 'text-slate-400',
                  )}
                >
                  {r.error ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {more > 0 && (
        <div className="text-center text-[11px] text-slate-500">
          仅显示前 {PREVIEW_LIMIT} 行 — 还有 {more} 行将一并提交
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
        <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={onBack}>
          重新选择文件
        </Button>
        <Button
          size="sm"
          className="h-8 text-[12px]"
          onClick={onSubmit}
          disabled={submitting || counts.create + counts.update === 0}
        >
          {submitting
            ? '导入中…'
            : `确认导入（新增 ${counts.create} · 更新 ${counts.update}）`}
        </Button>
      </div>
    </div>
  );
}

function ResultStep({
  result,
  onClose,
}: {
  result: BulkImportResult;
  onClose: () => void;
}) {
  const ok = result.created + result.updated;
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-6">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <div className="text-[14px] font-semibold text-slate-900">导入完成</div>
        <div className="flex items-center gap-3 text-[12px]">
          <Pill tone="emerald">新增 {result.created}</Pill>
          <Pill tone="indigo">更新 {result.updated}</Pill>
          <Pill tone="rose">失败 {result.errors.length}</Pill>
        </div>
        <div className="text-[11px] text-slate-500">
          {ok ? '产品库已刷新' : '没有任何行写入'}
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-rose-700">
            <AlertCircle className="h-3.5 w-3.5" />
            失败 / 跳过明细（{result.errors.length}）
          </div>
          <div className="max-h-[36vh] overflow-y-auto rounded border border-rose-200 bg-white">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-rose-200 bg-rose-50 text-left text-[11px] uppercase tracking-wide text-rose-600">
                  <th className="w-10 px-2 py-1.5 font-medium">#</th>
                  <th className="px-2 py-1.5 font-medium">SKU</th>
                  <th className="px-2 py-1.5 font-medium">原因</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((e) => (
                  <tr key={`${e.index}_${e.sku ?? ''}`} className="border-b border-rose-100">
                    <td className="px-2 py-1.5 text-rose-500">{e.index}</td>
                    <td className="px-2 py-1.5 font-mono text-slate-700">
                      {e.sku ?? '—'}
                    </td>
                    <td className="px-2 py-1.5 text-rose-700">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-3">
        <Button size="sm" className="h-8 text-[12px]" onClick={onClose}>
          完成
        </Button>
      </div>
    </div>
  );
}

function FateBadge({ fate }: { fate: PreviewRow['fate'] }) {
  const m = {
    create: { label: '新增', tone: 'emerald' as const },
    update: { label: '更新', tone: 'indigo' as const },
    skip: { label: '跳过', tone: 'rose' as const },
  }[fate];
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

function Pill({
  tone,
  children,
}: {
  tone: 'emerald' | 'indigo' | 'rose' | 'slate';
  children: React.ReactNode;
}) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  }[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px]',
        cls,
      )}
    >
      {children}
    </span>
  );
}
