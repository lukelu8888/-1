import { useMemo, useState } from 'react';
import {
  Archive,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FilePlus2,
  Filter,
  Image as ImageIcon,
  Layers,
  PackagePlus,
  Pause,
  Pencil,
  RefreshCcw,
  Search,
  Send,
  Settings2,
  Tag,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '../../../../ui/button';
import { Checkbox } from '../../../../ui/checkbox';
import { Input } from '../../../../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../ui/dropdown-menu';
import { toast } from 'sonner';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { StatusBadge } from '../../shared/StatusBadge';
import { RegionPill } from '../../shared/RegionPill';
import { BulkPriceEditorDialog } from '../../shared/BulkPriceEditorDialog';
import { PublishPreviewModal } from '../../shared/PublishPreviewModal';
import { useProductCenter } from '../../context/ProductCenterContext';
import { REGIONS, formatRegionMoney } from '../../context/regionConfig';
import { getProductCenterService } from '../../services/productCenterService';
import { downloadCsv, rowsToCsv } from '../../services/csv';
import {
  COLUMN_LABELS,
  IMPORT_COLUMNS,
} from '../../services/productImportColumns';
import { BulkImportDialog } from '../../shared/BulkImportDialog';
import type {
  ProductListFilters,
  PublishStatus,
  RegionCode,
  ReviewStatus,
} from '../../context/types';

interface Props {
  onOpenProduct: (id: string) => void;
}

const PUBLISH_STATUS_OPTIONS: { value: PublishStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '全部发布状态' },
  { value: 'not_published', label: '未发布' },
  { value: 'scheduled', label: '定时发布' },
  { value: 'published', label: '已发布' },
  { value: 'paused', label: '已暂停' },
  { value: 'unpublished', label: '已下架' },
  { value: 'archived', label: '已归档' },
];

const REVIEW_STATUS_OPTIONS: { value: ReviewStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '全部审核状态' },
  { value: 'not_submitted', label: '未提交' },
  { value: 'pending_review', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
];

export function PimListPage({ onOpenProduct }: Props) {
  const ctx = useProductCenter();
  const {
    activeRegion,
    filters,
    setFilters,
    resetFilters,
    selectedProductIds,
    toggleSelected,
    setSelected,
    clearSelected,
    publishProduct,
    pauseProduct,
    unpublishProduct,
    archiveProduct,
    bulkPublish,
    bulkPause,
    bulkArchive,
    bulkSetCategory,
    bulkSetTag,
    categories,
    supplierLinks,
    getStats,
  } = ctx;

  const rows = ctx.buildListRows();
  const stats = getStats();

  const allSelectedOnPage = rows.length > 0 && rows.every((r) => selectedProductIds.includes(r.product.id));

  const setF = (patch: Partial<ProductListFilters>) =>
    setFilters({ ...filters, ...patch });

  const supplierOptions = useMemo(() => {
    const map = new Map<string, string>();
    supplierLinks.forEach((sl) => map.set(sl.supplierId, sl.supplierName));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [supplierLinks]);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [bulkTag, setBulkTag] = useState<string>('');
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [previewProductId, setPreviewProductId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  /**
   * Pull a wide row set through the service layer (mock or supabase) and
   * stream it to the browser as CSV. We deliberately delegate to the
   * service rather than re-using `buildListRows` so the column set matches
   * the server-side `pc_export_products` RPC and stays consistent across
   * backends.
   */
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const service = getProductCenterService();
      const region = filters.region && filters.region !== 'ALL' ? filters.region : undefined;
      const rows = await service.exportProducts({ region });
      if (rows.length === 0) {
        toast.warning('没有可导出的产品');
        return;
      }
      const csv = rowsToCsv(rows, {
        headers: IMPORT_COLUMNS as unknown as Array<keyof (typeof rows)[number] & string>,
        headerLabels: COLUMN_LABELS,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      const tag = region ? `_${region}` : '';
      downloadCsv(csv, `products${tag}_${stamp}`);
      toast.success(`已导出 ${rows.length} 条产品`);
    } catch (err) {
      const msg = (err as Error)?.message ?? '导出失败';
      toast.error(`导出失败：${msg}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="产品库 / PIM Master"
        subtitle="所有产品主数据维护中心 — 唯一主数据源，由此发布到官网、活动、区域市场"
        actions={
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="mr-1 h-3.5 w-3.5" /> 批量导入
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download className="mr-1 h-3.5 w-3.5" />
              {exporting ? '导出中…' : '导出'}
            </Button>
            <Button size="sm" className="h-8" onClick={() => toast.info('新建产品向导：Phase 1 接通现有 ProductCreationWizard')}>
              <FilePlus2 className="mr-1 h-3.5 w-3.5" /> 新建产品
            </Button>
          </>
        }
      />

      <StatStrip
        stats={stats}
        onSelectFilter={(patch) => {
          setSelected([]);
          setF(patch);
        }}
      />

      {/* Filter bar */}
      <Toolbar
        bordered
        left={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.keyword ?? ''}
                onChange={(e) => setF({ keyword: e.target.value })}
                placeholder="产品名称 / SKU / 供应商型号 / 客户型号"
                className="h-8 w-64 pl-7 text-[12px]"
              />
            </div>

            <Select
              value={filters.region ?? 'ALL'}
              onValueChange={(v) => setF({ region: v as RegionCode | 'ALL' })}
            >
              <SelectTrigger className="h-8 w-32 text-[12px]">
                <SelectValue placeholder="区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部区域</SelectItem>
                {REGIONS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.flag} {r.name} {r.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.categoryId ?? 'ALL'}
              onValueChange={(v) => setF({ categoryId: v === 'ALL' ? undefined : v })}
            >
              <SelectTrigger className="h-8 w-40 text-[12px]">
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部分类</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {'— '.repeat(c.level - 1)}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.publishStatus ?? 'ALL'}
              onValueChange={(v) => setF({ publishStatus: v as PublishStatus | 'ALL' })}
            >
              <SelectTrigger className="h-8 w-36 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PUBLISH_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.reviewStatus ?? 'ALL'}
              onValueChange={(v) => setF({ reviewStatus: v as ReviewStatus | 'ALL' })}
            >
              <SelectTrigger className="h-8 w-36 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px]"
              onClick={() => setAdvancedOpen((v) => !v)}
            >
              <Filter className="mr-1 h-3.5 w-3.5" />
              {advancedOpen ? '收起高级筛选' : '高级筛选'}
              <ChevronDown
                className={`ml-1 h-3.5 w-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </>
        }
        right={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[12px]"
              onClick={resetFilters}
            >
              <X className="mr-1 h-3.5 w-3.5" /> 清空筛选
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-[12px]"
              onClick={() => {
                /* mock: reload */
                toast.success('已刷新');
              }}
            >
              <RefreshCcw className="mr-1 h-3.5 w-3.5" /> 刷新
            </Button>
          </>
        }
      />

      {advancedOpen && (
        <div className="grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50/40 px-3 py-2 lg:grid-cols-4">
          <Select
            value={filters.supplierId ?? 'ALL'}
            onValueChange={(v) => setF({ supplierId: v === 'ALL' ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue placeholder="供应商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部供应商</SelectItem>
              {supplierOptions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="标签 (e.g. hot, b2b)"
            value={filters.tag ?? ''}
            onChange={(e) => setF({ tag: e.target.value || undefined })}
            className="h-8 text-[12px]"
          />

          <Select
            value={
              filters.isCampaign == null
                ? 'ALL'
                : filters.isCampaign
                  ? 'YES'
                  : 'NO'
            }
            onValueChange={(v) =>
              setF({
                isCampaign: v === 'ALL' ? undefined : v === 'YES',
              })
            }
          >
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue placeholder="活动产品" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">是否活动产品</SelectItem>
              <SelectItem value="YES">仅活动产品</SelectItem>
              <SelectItem value="NO">非活动产品</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={!!filters.missingImage}
                onCheckedChange={(v) => setF({ missingImage: Boolean(v) })}
              />
              <span>缺图片</span>
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={!!filters.missingPrice}
                onCheckedChange={(v) => setF({ missingPrice: Boolean(v) })}
              />
              <span>缺价格</span>
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={!!filters.missingCategory}
                onCheckedChange={(v) => setF({ missingCategory: Boolean(v) })}
              />
              <span>缺分类</span>
            </label>
          </div>

          <Input
            type="date"
            value={filters.createdFrom?.slice(0, 10) ?? ''}
            onChange={(e) => setF({ createdFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })}
            className="h-8 text-[12px]"
            placeholder="创建时间-起"
          />
          <Input
            type="date"
            value={filters.createdTo?.slice(0, 10) ?? ''}
            onChange={(e) => setF({ createdTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })}
            className="h-8 text-[12px]"
          />
          <Input
            type="date"
            value={filters.updatedFrom?.slice(0, 10) ?? ''}
            onChange={(e) => setF({ updatedFrom: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined })}
            className="h-8 text-[12px]"
            placeholder="更新时间-起"
          />
          <Input
            type="date"
            value={filters.updatedTo?.slice(0, 10) ?? ''}
            onChange={(e) => setF({ updatedTo: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined })}
            className="h-8 text-[12px]"
          />
        </div>
      )}

      {/* Selection toolbar */}
      {selectedProductIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-amber-200 bg-amber-50/60 px-3 py-1.5 text-[12px]">
          <span className="font-medium text-amber-900">
            已选 {selectedProductIds.length} 项
          </span>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => {
              bulkPublish(activeRegion);
              toast.success(`已批量发布 ${selectedProductIds.length} 个产品到 ${activeRegion}`);
            }}
          >
            <Send className="mr-1 h-3.5 w-3.5" /> 批量发布到 <RegionPill region={activeRegion} className="ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => {
              bulkPause(activeRegion);
              toast.success(`已批量暂停 ${selectedProductIds.length} 个产品`);
            }}
          >
            <Pause className="mr-1 h-3.5 w-3.5" /> 批量暂停
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => {
              bulkArchive();
              toast.success('已批量归档');
            }}
          >
            <Archive className="mr-1 h-3.5 w-3.5" /> 批量归档
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-[12px]">
                <Layers className="mr-1 h-3.5 w-3.5" /> 批量改分类
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
              <DropdownMenuLabel>选择目标分类</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => {
                    setBulkCategoryId(c.id);
                    bulkSetCategory(c.id);
                    toast.success(`已将 ${selectedProductIds.length} 个产品改为分类「${c.name}」`);
                  }}
                >
                  {'— '.repeat(c.level - 1)}
                  {c.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1">
            <Input
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              placeholder="标签 …"
              className="h-7 w-28 text-[12px]"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[12px]"
              onClick={() => {
                if (!bulkTag.trim()) return;
                bulkSetTag(bulkTag.trim());
                toast.success(`已加上标签：${bulkTag}`);
                setBulkTag('');
              }}
            >
              <Tag className="mr-1 h-3.5 w-3.5" /> 加标签
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => setBulkPriceOpen(true)}
          >
            批量改价
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => toast.info('批量导入图片：Phase 2 接通')}
          >
            <ImageIcon className="mr-1 h-3.5 w-3.5" /> 批量导入图片
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 text-[12px]"
            onClick={clearSelected}
          >
            <X className="mr-1 h-3.5 w-3.5" /> 清空选择
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-9">
                <Checkbox
                  checked={allSelectedOnPage}
                  onCheckedChange={(v) =>
                    v
                      ? setSelected(rows.map((r) => r.product.id))
                      : clearSelected()
                  }
                />
              </TableHead>
              <TableHead className="w-12">图片</TableHead>
              <TableHead className="w-44">SKU / 名称</TableHead>
              <TableHead className="w-32">分类</TableHead>
              <TableHead className="w-24">品牌</TableHead>
              <TableHead className="w-32">主供应商</TableHead>
              <TableHead className="w-24 text-right">成本价</TableHead>
              <TableHead className="w-24 text-right">北美 NA</TableHead>
              <TableHead className="w-24 text-right">南美 SA</TableHead>
              <TableHead className="w-24 text-right">欧非 EA</TableHead>
              <TableHead className="w-32">发布 ({activeRegion})</TableHead>
              <TableHead className="w-20">审核</TableHead>
              <TableHead className="w-20">活动</TableHead>
              <TableHead className="w-32">最后更新</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={15} className="py-12 text-center text-slate-400">
                  没有匹配的产品。尝试清除筛选条件。
                </TableCell>
              </TableRow>
            )}

            {rows.map((row) => {
              const p = row.product;
              const checked = selectedProductIds.includes(p.id);
              const flagsMissing: string[] = [];
              if (!row.hasMainImage) flagsMissing.push('图');
              if (!row.hasAnyPrice) flagsMissing.push('价');
              if (!row.hasCategory) flagsMissing.push('类');
              return (
                <TableRow
                  key={p.id}
                  className={`hover:bg-slate-50 ${checked ? 'bg-amber-50/40' : ''}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleSelected(p.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {p.thumbnailUrl ? (
                      <img
                        src={p.thumbnailUrl}
                        alt={p.sku}
                        className="h-9 w-9 rounded border border-slate-200 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400">
                        无图
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => onOpenProduct(p.id)}
                      className="block w-full text-left"
                    >
                      <div className="font-medium text-slate-800 hover:text-blue-700 hover:underline">
                        {p.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                      {flagsMissing.length > 0 && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-rose-600">
                          缺：{flagsMissing.join(' · ')}
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {row.categoryName ?? <span className="text-rose-500">未绑定</span>}
                  </TableCell>
                  <TableCell className="text-slate-600">{p.brand ?? '—'}</TableCell>
                  <TableCell className="text-slate-600">
                    {row.primarySupplierName ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.costPrice != null
                      ? `${row.costCurrency ?? 'USD'} ${row.costPrice.toFixed(2)}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRegionMoney('NA', row.priceNA)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRegionMoney('SA', row.priceSA)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatRegionMoney('EA', row.priceEA)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      kind="publish"
                      status={row.publishStatusByRegion[activeRegion]}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="review" status={p.reviewStatus} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge kind="campaign" status={p.campaignStatus} />
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(p.updatedAt).toLocaleString('zh-CN', {
                      hour12: false,
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-0.5">
                      <IconBtn title="编辑" onClick={() => onOpenProduct(p.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn title="发布预览" onClick={() => setPreviewProductId(p.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </IconBtn>
                      <IconBtn
                        title={`发布到 ${activeRegion}`}
                        onClick={() => {
                          publishProduct(p.id, activeRegion);
                          toast.success(`已发布到 ${activeRegion}`);
                        }}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </IconBtn>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="rounded p-1 text-slate-500 hover:bg-slate-100"
                            aria-label="更多操作"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{p.sku}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              pauseProduct(p.id, activeRegion);
                              toast.success('已暂停');
                            }}
                          >
                            <Pause className="mr-2 h-3.5 w-3.5" /> 暂停 ({activeRegion})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const reason = window.prompt('下架原因？', '库存不足');
                              if (reason == null) return;
                              unpublishProduct(p.id, activeRegion, reason);
                              toast.success('已下架');
                            }}
                          >
                            <X className="mr-2 h-3.5 w-3.5" /> 下架 ({activeRegion})
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              archiveProduct(p.id);
                              toast.success('已归档');
                            }}
                          >
                            <Archive className="mr-2 h-3.5 w-3.5" /> 归档（全部区域）
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toast.info('复制产品（Phase 2）')}>
                            <Copy className="mr-2 h-3.5 w-3.5" /> 复制产品
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('查看价格（Phase 1 已就绪）')}>
                            查看价格
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('查看媒体（Phase 1 已就绪）')}>
                            查看媒体
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info('查看发布记录')}>
                            查看发布记录
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500">
        <span>
          共 {rows.length} 条 / 总计 {stats.total} 条产品
        </span>
        <span>
          区域：当前操作 = <strong className="text-slate-700">{activeRegion}</strong>
        </span>
      </div>

      <BulkPriceEditorDialog
        open={bulkPriceOpen}
        onOpenChange={setBulkPriceOpen}
        productIds={selectedProductIds}
      />
      <PublishPreviewModal
        productId={previewProductId}
        onClose={() => setPreviewProductId(null)}
      />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function IconBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  );
}

interface StatStripProps {
  stats: ReturnType<ReturnType<typeof useProductCenter>['getStats']>;
  onSelectFilter: (patch: Partial<ProductListFilters>) => void;
}

function StatStrip({ stats, onSelectFilter }: StatStripProps) {
  const tiles: { key: string; label: string; value: number; tone: string; onClick?: () => void }[] = [
    { key: 'total', label: '产品总数', value: stats.total, tone: 'text-slate-700' },
    { key: 'active', label: '正常上架', value: stats.active, tone: 'text-emerald-700' },
    { key: 'drafts', label: '草稿', value: stats.drafts, tone: 'text-slate-700' },
    {
      key: 'pendingReview',
      label: '待审核',
      value: stats.pendingReview,
      tone: 'text-blue-700',
      onClick: () => onSelectFilter({ reviewStatus: 'pending_review' }),
    },
    { key: 'publishedAny', label: '已发布(任一区域)', value: stats.publishedAny, tone: 'text-emerald-700' },
    {
      key: 'missingImage',
      label: '缺图片',
      value: stats.missingImage,
      tone: 'text-rose-700',
      onClick: () => onSelectFilter({ missingImage: true }),
    },
    {
      key: 'missingPrice',
      label: '缺价格',
      value: stats.missingPrice,
      tone: 'text-rose-700',
      onClick: () => onSelectFilter({ missingPrice: true }),
    },
    {
      key: 'missingCategory',
      label: '缺分类',
      value: stats.missingCategory,
      tone: 'text-rose-700',
      onClick: () => onSelectFilter({ missingCategory: true }),
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7">
        {tiles.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={t.onClick}
            className="group flex min-w-0 items-center justify-between gap-2 border-b border-r border-slate-200 px-3 py-2 text-left last:border-r-0 hover:bg-slate-50 lg:border-b-0"
            disabled={!t.onClick}
          >
            <span className="truncate whitespace-nowrap text-[11px] uppercase tracking-wide text-slate-500">
              {t.label}
            </span>
            <span className={`shrink-0 text-base font-semibold tabular-nums ${t.tone}`}>
              {t.value}
            </span>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-t border-slate-200 px-3 py-1 text-[11px] text-slate-500">
        <PackagePlus className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span className="whitespace-nowrap">点击数字可一键过滤</span>
      </div>
    </div>
  );
}
