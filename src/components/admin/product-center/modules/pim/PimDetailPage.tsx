import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Box,
  ClipboardList,
  Eye,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  Layers,
  Megaphone,
  Package,
  Pause,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Tag,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import { Textarea } from '../../../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/select';
import { Switch } from '../../../../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { StatusBadge } from '../../shared/StatusBadge';
import { RegionPill } from '../../shared/RegionPill';
import { FieldGroup, FieldRow, SectionShell } from '../../shared/SectionShell';
import { PublishPreviewModal } from '../../shared/PublishPreviewModal';
import { PriceHistoryDialog } from '../../shared/PriceHistoryDialog';
import { SupplierQuoteDialog } from '../../shared/SupplierQuoteDialog';
import { ReviewHistoryDrawer } from '../../shared/ReviewHistoryDrawer';
import { MediaUploader } from '../../shared/MediaUploader';
import { TierPricesEditor } from '../../shared/TierPricesEditor';
import { useProductCenter } from '../../context/ProductCenterContext';
import { REGIONS, formatRegionMoney, getRegion } from '../../context/regionConfig';
import type {
  Product,
  ProductPublishChannel,
  ProductRegionPrice,
  RegionCode,
} from '../../context/types';
import { cn } from '../../../../ui/utils';

interface Props {
  productId: string;
  onBack: () => void;
}

type SectionId =
  | 'basic'
  | 'category'
  | 'specs'
  | 'packaging'
  | 'media'
  | 'suppliers'
  | 'prices'
  | 'publish'
  | 'seo'
  | 'campaign'
  | 'documents'
  | 'audit';

const SECTIONS: { id: SectionId; label: string; labelEn: string; icon: any }[] = [
  { id: 'basic', label: '基础信息', labelEn: 'Basic Info', icon: Package },
  { id: 'category', label: '分类与属性', labelEn: 'Category & Attributes', icon: Layers },
  { id: 'specs', label: '规格参数', labelEn: 'Specifications', icon: Box },
  { id: 'packaging', label: '包装与物流', labelEn: 'Packaging & Logistics', icon: Truck },
  { id: 'media', label: '图片与视频', labelEn: 'Media', icon: ImageIcon },
  { id: 'suppliers', label: '供应商与成本', labelEn: 'Suppliers & Cost', icon: Users },
  { id: 'prices', label: '区域价格', labelEn: 'Region Prices', icon: Wallet },
  { id: 'publish', label: '官网发布设置', labelEn: 'Publishing', icon: Globe },
  { id: 'seo', label: 'SEO 设置', labelEn: 'SEO', icon: Tag },
  { id: 'campaign', label: '活动设置', labelEn: 'Campaign', icon: Megaphone },
  { id: 'documents', label: '文件与认证', labelEn: 'Documents', icon: FileText },
  { id: 'audit', label: '操作日志', labelEn: 'Audit Log', icon: History },
];

export function PimDetailPage({ productId, onBack }: Props) {
  const ctx = useProductCenter();
  const baseProduct = ctx.getProductById(productId);

  const [draft, setDraft] = useState<Product | null>(baseProduct ?? null);
  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string>(baseProduct?.updatedAt ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const [supplierQuoteOpen, setSupplierQuoteOpen] = useState(false);
  const [reviewHistoryOpen, setReviewHistoryOpen] = useState(false);

  // refs for scroll-spy
  const refs = useRef<Record<SectionId, HTMLDivElement | null>>({} as any);
  const contentScrollRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (baseProduct) {
      setDraft(baseProduct);
      setSavedAt(baseProduct.updatedAt);
      setDirty(false);
    }
  }, [baseProduct]);

  const update = <K extends keyof Product>(field: K, value: Product[K]) => {
    setDraft((d) => (d ? { ...d, [field]: value } : d));
    setDirty(true);
  };

  const handleSave = () => {
    if (!draft) return;
    // Diff vs the original entity in the store and audit changed fields.
    const original = ctx.getProductById(draft.id);
    const changes = original ? diffProduct(original, draft) : [];
    ctx.upsertProduct(draft);
    changes.forEach((c) =>
      ctx.logAudit({
        productId: draft.id,
        action: 'edit',
        field: c.field,
        fromValue: c.from,
        toValue: c.to,
        actorName: ctx.currentUser.name,
      }),
    );
    setSavedAt(new Date().toISOString());
    setDirty(false);
    toast.success(
      changes.length === 0 ? '已保存（无字段变化）' : `已保存 · 记录 ${changes.length} 条变更`,
    );
  };

  const handleSubmitReview = () => {
    if (!draft) return;
    const flags = ctx.getMissingFlags(draft.id);
    if (flags.length > 0) {
      const FLAG_LABEL: Record<string, string> = {
        missingImage: '主图',
        missingPrice: '价格',
        missingCategory: '分类',
        missingSeo: 'SEO',
        missingSupplier: '供应商',
      };
      const labels = flags.map((f) => FLAG_LABEL[f] ?? f).join(' / ');
      const ok = window.confirm(
        `当前产品缺失字段：${labels}\n\n仍要提交审核吗？(审核员将在审核历史中看到这些缺失项)`,
      );
      if (!ok) return;
    }
    ctx.submitForReview(draft.id);
    toast.success('已提交审核');
  };

  const handleApprove = () => {
    if (!draft) return;
    if (!ctx.canReview()) {
      toast.error('当前角色无审核权限，请先在顶部切换为审核员/管理员');
      return;
    }
    try {
      ctx.approveProduct(draft.id);
      toast.success('已通过');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleReject = () => {
    if (!draft) return;
    if (!ctx.canReview()) {
      toast.error('当前角色无审核权限');
      return;
    }
    const reason = window.prompt('拒绝原因？', '请补全图片');
    if (!reason) return;
    try {
      ctx.rejectProduct(draft.id, reason);
      toast.success('已拒绝');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleQuickPublish = () => {
    if (!draft) return;
    if (dirty) ctx.upsertProduct(draft);
    ctx.publishProduct(draft.id, ctx.activeRegion);
    toast.success(`已发布到 ${ctx.activeRegion}`);
  };

  if (!baseProduct || !draft) {
    return (
      <div className="p-6 text-sm text-slate-500">
        产品不存在或已被删除。{' '}
        <button onClick={onBack} className="text-blue-600 hover:underline">
          返回列表
        </button>
      </div>
    );
  }

  const scrollTo = (id: SectionId) => {
    const container = contentScrollRef.current;
    const el = refs.current[id];
    if (!container || !el) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = el.getBoundingClientRect();
    const targetTop = targetRect.top - containerRect.top + container.scrollTop;

    container.scrollTo({ top: targetTop, behavior: 'smooth' });
    setActiveSection(id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top status bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-3 py-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onBack}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> 返回列表
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-[14px] font-semibold text-slate-900">
              {draft.name}
            </h1>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">
              {draft.sku}
            </span>
            <RegionPill region={ctx.activeRegion} />
            <StatusBadge kind="product" status={draft.status} />
            <StatusBadge kind="review" status={draft.reviewStatus} />
            <StatusBadge kind="campaign" status={draft.campaignStatus} />
          </div>
          <div className="text-[11px] text-slate-500">
            最后保存：
            {savedAt
              ? new Date(savedAt).toLocaleString('zh-CN', { hour12: false })
              : '—'}
            {dirty && <span className="ml-2 text-amber-600">· 有未保存更改</span>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="mr-1 h-3.5 w-3.5" /> 发布预览
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => setReviewHistoryOpen(true)}
            title="审核历史"
          >
            <History className="mr-1 h-3.5 w-3.5" /> 审核历史
          </Button>
          {draft.reviewStatus === 'pending_review' && ctx.canReview() ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-emerald-700 hover:bg-emerald-50"
                onClick={handleApprove}
              >
                通过
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-rose-700 hover:bg-rose-50"
                onClick={handleReject}
              >
                拒绝
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={handleSubmitReview}
              disabled={draft.reviewStatus === 'pending_review' || draft.reviewStatus === 'approved'}
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> 提交审核
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              ctx.pauseProduct(draft.id, ctx.activeRegion);
              toast.success('已暂停');
            }}
          >
            <Pause className="mr-1 h-3.5 w-3.5" /> 暂停
          </Button>
          <Button size="sm" className="h-8" onClick={handleQuickPublish}>
            <Send className="mr-1 h-3.5 w-3.5" /> 一键发布
          </Button>
          <Button
            size="sm"
            className="h-8 bg-slate-900 hover:bg-slate-800"
            onClick={handleSave}
            disabled={!dirty}
          >
            <Save className="mr-1 h-3.5 w-3.5" /> 保存
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left TOC */}
        <aside className="w-48 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 border-b border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            产品详情目录
          </div>
          <ol className="py-1">
            {SECTIONS.map((s, idx) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      'flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-left text-[12px]',
                      active
                        ? 'border-slate-900 bg-slate-50 text-slate-900'
                        : 'border-transparent text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <span className="w-4 text-right text-[10px] tabular-nums text-slate-400">
                      {idx + 1}
                    </span>
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                    <div className="min-w-0">
                      <div className="truncate">{s.label}</div>
                      <div className="truncate text-[10px] text-slate-400">{s.labelEn}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Right content */}
        <section ref={contentScrollRef} className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
          <div className="space-y-3 p-3">
            <div ref={(el) => (refs.current.basic = el)}>
              <BasicInfoSection product={draft} update={update} />
            </div>
            <div ref={(el) => (refs.current.category = el)}>
              <CategoryAttrsSection product={draft} update={update} />
            </div>
            <div ref={(el) => (refs.current.specs = el)}>
              <SpecsSection product={draft} update={update} />
            </div>
            <div ref={(el) => (refs.current.packaging = el)}>
              <PackagingSection product={draft} update={update} />
            </div>
            <div ref={(el) => (refs.current.media = el)}>
              <MediaSection productId={draft.id} thumbnailUrl={draft.thumbnailUrl} />
            </div>
            <div ref={(el) => (refs.current.suppliers = el)}>
              <SuppliersSection
                productId={draft.id}
                onOpenQuotes={() => setSupplierQuoteOpen(true)}
              />
            </div>
            <div ref={(el) => (refs.current.prices = el)}>
              <RegionPricesSection
                productId={draft.id}
                onOpenHistory={() => setPriceHistoryOpen(true)}
              />
            </div>
            <div ref={(el) => (refs.current.publish = el)}>
              <PublishSettingsSection productId={draft.id} />
            </div>
            <div ref={(el) => (refs.current.seo = el)}>
              <SeoSection productId={draft.id} />
            </div>
            <div ref={(el) => (refs.current.campaign = el)}>
              <CampaignSection productId={draft.id} />
            </div>
            <div ref={(el) => (refs.current.documents = el)}>
              <DocumentsSection productId={draft.id} />
            </div>
            <div ref={(el) => (refs.current.audit = el)}>
              <AuditSection productId={draft.id} />
            </div>

            <div className="h-32" />
          </div>
        </section>
      </div>

      <PublishPreviewModal
        productId={previewOpen ? draft.id : null}
        onClose={() => setPreviewOpen(false)}
      />
      <PriceHistoryDialog
        productId={priceHistoryOpen ? draft.id : null}
        onClose={() => setPriceHistoryOpen(false)}
      />
      <SupplierQuoteDialog
        productId={supplierQuoteOpen ? draft.id : null}
        onClose={() => setSupplierQuoteOpen(false)}
      />
      <ReviewHistoryDrawer
        productId={reviewHistoryOpen ? draft.id : null}
        onClose={() => setReviewHistoryOpen(false)}
      />
    </div>
  );
}

// ── Section: Basic Info ─────────────────────────────────────────────────────

export function BasicInfoSection({
  product,
  update,
}: {
  product: Product;
  update: <K extends keyof Product>(field: K, value: Product[K]) => void;
}) {
  return (
    <SectionShell title="1. 基础信息" subtitle="产品名称 / SKU / 描述 / 标签 / 状态">
      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <div className="min-w-0">
          <FieldRow label="产品名称" required>
            <Input
              value={product.name}
              onChange={(e) => update('name', e.target.value)}
              className="h-8"
            />
          </FieldRow>
          <FieldRow label="英文名称">
            <Input
              value={product.nameEn ?? ''}
              onChange={(e) => update('nameEn', e.target.value)}
              className="h-8"
            />
          </FieldRow>
          <FieldRow label="中文名称">
            <Input
              value={product.nameZh ?? ''}
              onChange={(e) => update('nameZh', e.target.value)}
              className="h-8"
            />
          </FieldRow>
          <FieldRow label="SKU" required>
            <Input
              value={product.sku}
              onChange={(e) => update('sku', e.target.value)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="SPU">
            <Input
              value={product.spu ?? ''}
              onChange={(e) => update('spu', e.target.value)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="品牌">
            <Input
              value={product.brand ?? ''}
              onChange={(e) => update('brand', e.target.value)}
              className="h-8"
            />
          </FieldRow>
          <FieldRow label="产品类型">
            <Select
              value={product.productType ?? ''}
              onValueChange={(v) => update('productType', v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Standard">Standard 标准品</SelectItem>
                <SelectItem value="OEM">OEM 客户定制</SelectItem>
                <SelectItem value="ODM">ODM 授权改造</SelectItem>
                <SelectItem value="Service">Service 服务类</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="产品状态">
            <Select
              value={product.status}
              onValueChange={(v) => update('status', v as Product['status'])}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿 Draft</SelectItem>
                <SelectItem value="active">正常 Active</SelectItem>
                <SelectItem value="disabled">停用 Disabled</SelectItem>
                <SelectItem value="archived">归档 Archived</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>

        <div className="min-w-0">
          <FieldRow label="简短描述">
            <Textarea
              value={product.shortDescription ?? ''}
              onChange={(e) => update('shortDescription', e.target.value)}
              rows={2}
              className="text-[12px]"
            />
          </FieldRow>
          <FieldRow label="详细描述">
            <Textarea
              value={product.longDescription ?? ''}
              onChange={(e) => update('longDescription', e.target.value)}
              rows={5}
              className="text-[12px]"
            />
          </FieldRow>
          <FieldRow label="关键词">
            <Input
              value={(product.keywords ?? []).join(', ')}
              onChange={(e) =>
                update(
                  'keywords',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
              placeholder="逗号分隔"
              className="h-8"
            />
          </FieldRow>
          <FieldRow label="标签">
            <Input
              value={(product.tags ?? []).join(', ')}
              onChange={(e) =>
                update(
                  'tags',
                  e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                )
              }
              placeholder="hot, b2b, promo …"
              className="h-8"
            />
          </FieldRow>
        </div>
      </div>
    </SectionShell>
  );
}

// ── Section: Category & Attributes ──────────────────────────────────────────

export function CategoryAttrsSection({
  product,
  update,
}: {
  product: Product;
  update: <K extends keyof Product>(field: K, value: Product[K]) => void;
}) {
  const ctx = useProductCenter();
  const attrs = ctx.attributes
    .filter((a) => {
      if (!product.primaryCategoryId) return true;
      if (!a.appliesToCategoryIds || a.appliesToCategoryIds.length === 0) return false;
      return a.appliesToCategoryIds.includes(product.primaryCategoryId);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const values = ctx.getAttributeValuesForProduct(product.id);
  const valueByAttr = new Map(values.map((v) => [v.attributeId, v]));

  const writeAttr = (
    attributeId: string,
    patch: { valueText?: string; valueNumber?: number; valueBool?: boolean },
  ) => {
    const existing = valueByAttr.get(attributeId);
    ctx.upsertAttributeValue({
      id: existing?.id ?? '',
      productId: product.id,
      attributeId,
      valueText: patch.valueText ?? existing?.valueText,
      valueNumber: patch.valueNumber ?? existing?.valueNumber,
      valueBool: patch.valueBool ?? existing?.valueBool,
      valueOptions: existing?.valueOptions,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <SectionShell title="2. 分类与属性" subtitle="官网分类 / 内部分类 / 属性模板（失焦自动保存）">
      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <div className="min-w-0">
          <FieldRow label="官网分类" required>
            <Select
              value={product.primaryCategoryId ?? ''}
              onValueChange={(v) => update('primaryCategoryId', v)}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="选择官网分类" />
              </SelectTrigger>
              <SelectContent>
                {ctx.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {'— '.repeat(c.level - 1)}
                    {c.name} · {c.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="内部分类">
            <Input
              value={product.internalCategory ?? ''}
              onChange={(e) => update('internalCategory', e.target.value)}
              className="h-8"
            />
          </FieldRow>
        </div>
        <div className="min-w-0">
          <FieldGroup title="属性模板（按官网分类绑定）">
            <div className="space-y-1.5">
              {attrs.map((a) => {
                const val = valueByAttr.get(a.id);
                return (
                  <FieldRow
                    key={a.id}
                    label={`${a.label}${a.unit ? ` (${a.unit})` : ''}`}
                    hint={a.isFilterable ? '前台筛选' : undefined}
                  >
                    {a.dataType === 'enum' ? (
                      <Select
                        value={val?.valueText ?? ''}
                        onValueChange={(v) => writeAttr(a.id, { valueText: v })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {a.options?.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : a.dataType === 'number' ? (
                      <AttrNumber
                        value={val?.valueNumber}
                        onCommit={(v) => writeAttr(a.id, { valueNumber: v ?? 0 })}
                      />
                    ) : a.dataType === 'boolean' ? (
                      <Select
                        value={val?.valueBool == null ? '' : val.valueBool ? 'true' : 'false'}
                        onValueChange={(v) => writeAttr(a.id, { valueBool: v === 'true' })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="是/否" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">是</SelectItem>
                          <SelectItem value="false">否</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <AttrText
                        value={val?.valueText ?? ''}
                        onCommit={(v) => writeAttr(a.id, { valueText: v })}
                      />
                    )}
                  </FieldRow>
                );
              })}
              {attrs.length === 0 && (
                <div className="text-[12px] text-slate-500">
                  未定义属性模板，请在「分类 & 属性」模块中维护。
                </div>
              )}
            </div>
          </FieldGroup>
        </div>
      </div>
    </SectionShell>
  );
}

function AttrText({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      className="h-8"
    />
  );
}

function AttrNumber({
  value,
  onCommit,
}: {
  value?: number;
  onCommit: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  useEffect(() => setDraft(value == null ? '' : String(value)), [value]);
  return (
    <Input
      type="number"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = draft.trim() === '' ? undefined : Number(draft);
        if (n !== value) onCommit(Number.isFinite(n as number) ? n : undefined);
      }}
      className="h-8 font-mono"
    />
  );
}

// ── Section: Specs ───────────────────────────────────────────────────────────

export function SpecsSection({
  product,
  update,
}: {
  product: Product;
  update: <K extends keyof Product>(field: K, value: Product[K]) => void;
}) {
  return (
    <SectionShell title="3. 规格参数" subtitle="尺寸 / 重量 / 单位 / MOQ">
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <FieldRow label="长 (cm)">
            <Input
              type="number"
              value={product.lengthCm ?? ''}
              onChange={(e) => update('lengthCm', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="宽 (cm)">
            <Input
              type="number"
              value={product.widthCm ?? ''}
              onChange={(e) => update('widthCm', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="高 (cm)">
            <Input
              type="number"
              value={product.heightCm ?? ''}
              onChange={(e) => update('heightCm', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
        </div>
        <div className="min-w-0">
          <FieldRow label="净重 (kg)">
            <Input
              type="number"
              value={product.netWeight ?? ''}
              onChange={(e) => update('netWeight', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="毛重 (kg)">
            <Input
              type="number"
              value={product.grossWeight ?? ''}
              onChange={(e) => update('grossWeight', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="单位">
            <Input
              value={product.unit ?? 'pcs'}
              onChange={(e) => update('unit', e.target.value)}
              className="h-8"
            />
          </FieldRow>
        </div>
        <div className="min-w-0">
          <FieldRow label="MOQ">
            <Input
              type="number"
              value={product.moq ?? ''}
              onChange={(e) => update('moq', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="装箱数">
            <Input
              type="number"
              value={product.unitsPerCarton ?? ''}
              onChange={(e) => update('unitsPerCarton', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="HS Code">
            <Input
              value={product.hsCode ?? ''}
              onChange={(e) => update('hsCode', e.target.value)}
              className="h-8 font-mono"
            />
          </FieldRow>
        </div>
      </div>
    </SectionShell>
  );
}

// ── Section: Packaging & Logistics ──────────────────────────────────────────

export function PackagingSection({
  product,
  update,
}: {
  product: Product;
  update: <K extends keyof Product>(field: K, value: Product[K]) => void;
}) {
  return (
    <SectionShell title="4. 包装与物流" subtitle="CBM / 装柜量 / 港口 / 交期">
      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <FieldRow label="CBM (m³)">
            <Input
              type="number"
              value={product.cbm ?? ''}
              onChange={(e) => update('cbm', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="20GP 装柜量">
            <Input
              type="number"
              value={product.qty20gp ?? ''}
              onChange={(e) => update('qty20gp', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
          <FieldRow label="40HQ 装柜量">
            <Input
              type="number"
              value={product.qty40hq ?? ''}
              onChange={(e) => update('qty40hq', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
        </div>
        <div className="min-w-0">
          <FieldRow label="出货港口">
            <Input
              value={product.port ?? ''}
              onChange={(e) => update('port', e.target.value)}
              className="h-8"
              placeholder="Ningbo / Shanghai / Shenzhen"
            />
          </FieldRow>
          <FieldRow label="交期 (天)">
            <Input
              type="number"
              value={product.leadTimeDays ?? ''}
              onChange={(e) => update('leadTimeDays', Number(e.target.value) || undefined)}
              className="h-8 font-mono"
            />
          </FieldRow>
        </div>
        <div className="text-[11px] text-slate-500">
          托盘信息 / 单品包装尺寸 / 外箱尺寸 等扩展字段将在 <strong className="text-slate-700">Phase 2</strong> 接通包装版本管理。
        </div>
      </div>
    </SectionShell>
  );
}

// ── Section: Media ──────────────────────────────────────────────────────────

export function MediaSection({ productId, thumbnailUrl }: { productId: string; thumbnailUrl?: string }) {
  const ctx = useProductCenter();
  const media = ctx.getMediaForProduct(productId);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  return (
    <>
      <SectionShell
        title="5. 图片与视频"
        subtitle="主图 · 详情图 · 应用场景图 · A+ · 视频"
        actions={
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px]"
            onClick={() => setUploaderOpen(true)}
          >
            + 上传媒体
          </Button>
        }
      >
        {media.length === 0 ? (
          <div className="text-[12px] text-slate-500">
            {thumbnailUrl ? (
              <div className="flex items-center gap-2">
                <img src={thumbnailUrl} alt="thumb" className="h-16 w-16 rounded border object-cover" />
                <span>仅有列表缩略图，建议上传主图与详情图。</span>
              </div>
            ) : (
              <span className="text-rose-600">该产品尚无任何媒体资源 — 请上传主图。</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {media.map((m) => (
              <div key={m.id} className="rounded border border-slate-200 bg-white p-1">
                <img
                  src={m.url}
                  alt={m.altText ?? m.kind}
                  className="h-24 w-full rounded object-cover"
                  loading="lazy"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="rounded bg-slate-100 px-1">{m.kind}</span>
                  <button
                    onClick={() => {
                      ctx.removeMedia(m.id);
                      toast.success('已移除');
                    }}
                    className="text-rose-600 hover:underline"
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <MediaUploader
        open={uploaderOpen}
        onOpenChange={setUploaderOpen}
        productId={productId}
      />
    </>
  );
}

// ── Section: Suppliers & Cost ───────────────────────────────────────────────

export function SuppliersSection({
  productId,
  onOpenQuotes,
}: {
  productId: string;
  onOpenQuotes: () => void;
}) {
  const ctx = useProductCenter();
  const links = ctx.getSupplierLinksForProduct(productId);
  const quotes = ctx.getSupplierQuotesForProduct(productId);
  const currentQuotes = quotes.filter((q) => q.isCurrent);

  return (
    <SectionShell
      title="6. 供应商与成本"
      subtitle="主供应商 · 备选供应商 · 工厂报价 · 采购价 · 成本构成"
      actions={
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={onOpenQuotes}
        >
          报价历史 / 记录新报价 ({quotes.length})
        </Button>
      }
    >
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>供应商</TableHead>
            <TableHead>供应商型号</TableHead>
            <TableHead>是否主</TableHead>
            <TableHead className="text-right">最新报价</TableHead>
            <TableHead className="text-right">MOQ</TableHead>
            <TableHead className="text-right">采购成本</TableHead>
            <TableHead>最近报价</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-slate-400">
                未关联供应商，可点击右上角「记录新报价」建立第一条报价记录。
              </TableCell>
            </TableRow>
          )}
          {links.map((sl) => {
            const latest = currentQuotes.find((q) => q.supplierId === sl.supplierId) ?? null;
            return (
              <TableRow key={sl.id}>
                <TableCell className="font-medium">{sl.supplierName}</TableCell>
                <TableCell className="font-mono">
                  {latest?.supplierModelNo ?? sl.supplierModelNo ?? '—'}
                </TableCell>
                <TableCell>
                  {sl.isPrimary ? (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">主</span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {latest
                    ? `${latest.currency} ${latest.quotedPrice.toFixed(2)}`
                    : sl.factoryQuotePrice != null
                      ? `${sl.factoryQuoteCurrency ?? 'USD'} ${sl.factoryQuotePrice.toFixed(2)}`
                      : '—'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {latest?.moq ?? sl.factoryQuoteMoq ?? '—'}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {sl.costPrice != null ? `${sl.costCurrency ?? 'USD'} ${sl.costPrice.toFixed(2)}` : '—'}
                </TableCell>
                <TableCell className="text-slate-500">
                  {latest
                    ? new Date(latest.createdAt).toLocaleDateString('zh-CN')
                    : sl.factoryQuoteAt
                      ? new Date(sl.factoryQuoteAt).toLocaleDateString('zh-CN')
                      : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionShell>
  );
}

// ── Section: Region Prices ──────────────────────────────────────────────────

export function RegionPricesSection({
  productId,
  onOpenHistory,
}: {
  productId: string;
  onOpenHistory: () => void;
}) {
  const ctx = useProductCenter();
  const prices = ctx.getRegionPricesForProduct(productId);
  const cost = ctx.getSupplierLinksForProduct(productId).find((s) => s.isPrimary)?.costPrice;
  const historyCount = ctx.getPriceHistoryForProduct(productId).length;

  const byRegion: Record<RegionCode, ProductRegionPrice | undefined> = {
    NA: prices.find((p) => p.regionCode === 'NA'),
    SA: prices.find((p) => p.regionCode === 'SA'),
    EA: prices.find((p) => p.regionCode === 'EA'),
  };

  return (
    <SectionShell
      title="7. 区域价格"
      subtitle="北美 · 南美 · 欧非 — 各自币种 / 售价 / 利润率"
      actions={
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[12px]"
          onClick={onOpenHistory}
        >
          <History className="mr-1 h-3.5 w-3.5" /> 价格历史 ({historyCount})
        </Button>
      }
    >
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>区域</TableHead>
            <TableHead>币种</TableHead>
            <TableHead className="text-right">建议价</TableHead>
            <TableHead className="text-right">售价</TableHead>
            <TableHead className="text-right">活动价</TableHead>
            <TableHead className="text-right">毛利率</TableHead>
            <TableHead>生效</TableHead>
            <TableHead>失效</TableHead>
            <TableHead>启用</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REGIONS.map((r) => {
            const p = byRegion[r.code];
            const margin = p?.salePrice && cost ? (p.salePrice - cost) / p.salePrice : null;
            return (
              <TableRow key={r.code}>
                <TableCell>
                  <RegionPill region={r.code} />
                </TableCell>
                <TableCell className="font-mono">{p?.currency ?? r.currency}</TableCell>
                <TableCell className="text-right font-mono">
                  <PriceCell
                    value={p?.basePrice}
                    onChange={(v) => savePrice(ctx, productId, r.code, { basePrice: v ?? 0 })}
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  <PriceCell
                    value={p?.salePrice}
                    onChange={(v) => savePrice(ctx, productId, r.code, { salePrice: v })}
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  <PriceCell
                    value={p?.campaignPrice ?? null}
                    onChange={(v) => savePrice(ctx, productId, r.code, { campaignPrice: v })}
                  />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {margin != null ? `${(margin * 100).toFixed(1)}%` : '—'}
                </TableCell>
                <TableCell className="font-mono text-[11px]">
                  {p?.effectiveFrom?.slice(0, 10) ?? '—'}
                </TableCell>
                <TableCell className="font-mono text-[11px]">
                  {p?.effectiveTo?.slice(0, 10) ?? '—'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!p?.isActive}
                    onCheckedChange={(v) => savePrice(ctx, productId, r.code, { isActive: v })}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[12px]"
                    onClick={onOpenHistory}
                  >
                    历史
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-2 text-[11px] text-slate-500">
        提示：区域价格直接驱动「价格中心」、「促销管理」与官网前台展示。基础成本来自上方供应商表。
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3">
        <TierPricesEditor productId={productId} />
      </div>
    </SectionShell>
  );
}

function PriceCell({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (v: number | null | undefined) => void;
}) {
  const [draft, setDraft] = useState<string>(value == null ? '' : String(value));
  useEffect(() => {
    setDraft(value == null ? '' : String(value));
  }, [value]);
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = draft.trim() === '' ? null : Number(draft);
        if (!Number.isFinite(n) && n !== null) return;
        onChange(n);
      }}
      className="h-7 text-right font-mono text-[12px]"
    />
  );
}

function savePrice(
  ctx: ReturnType<typeof useProductCenter>,
  productId: string,
  regionCode: RegionCode,
  patch: Partial<ProductRegionPrice>,
) {
  const existing = ctx
    .getRegionPricesForProduct(productId)
    .find((p) => p.regionCode === regionCode);
  const region = getRegion(regionCode);
  const merged: ProductRegionPrice = {
    id: existing?.id ?? `prp_${productId}_${regionCode}`,
    productId,
    regionCode,
    currency: existing?.currency ?? region.currency,
    basePrice: existing?.basePrice ?? 0,
    salePrice: existing?.salePrice,
    campaignPrice: existing?.campaignPrice ?? null,
    fxRate: existing?.fxRate,
    shippingCost: existing?.shippingCost,
    dutyAndLocalFee: existing?.dutyAndLocalFee,
    marginTarget: existing?.marginTarget,
    marginActual: existing?.marginActual,
    effectiveFrom: existing?.effectiveFrom,
    effectiveTo: existing?.effectiveTo,
    isActive: existing?.isActive ?? true,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...patch,
  };
  ctx.updateRegionPrice(merged);
}

// ── Section: Publish Settings ───────────────────────────────────────────────

export function PublishSettingsSection({ productId }: { productId: string }) {
  const ctx = useProductCenter();
  const channels = ctx.getPublishChannelsForProduct(productId);
  const byRegion = new Map(channels.map((c) => [c.regionCode, c] as const));

  return (
    <SectionShell
      title="8. 官网发布设置"
      subtitle="按区域单独控制发布行为 — 所有字段实时持久化"
    >
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>区域</TableHead>
            <TableHead>发布状态</TableHead>
            <TableHead>首页推荐</TableHead>
            <TableHead>分类页推荐</TableHead>
            <TableHead className="text-right">权重</TableHead>
            <TableHead>展示价格</TableHead>
            <TableHead>允许询价</TableHead>
            <TableHead>展示MOQ</TableHead>
            <TableHead>展示交期</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REGIONS.map((r) => {
            const c = byRegion.get(r.code);
            const status = c?.publishStatus ?? 'not_published';
            return (
              <TableRow key={r.code}>
                <TableCell>
                  <RegionPill region={r.code} />
                </TableCell>
                <TableCell>
                  <StatusBadge kind="publish" status={status} />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!c?.homepageFeatured}
                    onCheckedChange={(v) => patchChannel(ctx, productId, r.code, { homepageFeatured: v })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={!!c?.categoryFeatured}
                    onCheckedChange={(v) => patchChannel(ctx, productId, r.code, { categoryFeatured: v })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="number"
                    value={c?.sortWeight ?? 100}
                    onChange={(e) =>
                      patchChannel(ctx, productId, r.code, { sortWeight: Number(e.target.value) || 0 })
                    }
                    className="h-7 w-16 text-right font-mono text-[12px]"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={c?.showPriceOnFrontend ?? true}
                    onCheckedChange={(v) =>
                      patchChannel(ctx, productId, r.code, { showPriceOnFrontend: v })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={c?.allowInquiry ?? true}
                    onCheckedChange={(v) => patchChannel(ctx, productId, r.code, { allowInquiry: v })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={c?.showMoq ?? true}
                    onCheckedChange={(v) => patchChannel(ctx, productId, r.code, { showMoq: v })}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={c?.showLeadTime ?? true}
                    onCheckedChange={(v) => patchChannel(ctx, productId, r.code, { showLeadTime: v })}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[12px]"
                      onClick={() => {
                        ctx.publishProduct(productId, r.code);
                        toast.success(`已发布 ${r.code}`);
                      }}
                    >
                      发布
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[12px]"
                      onClick={() => {
                        ctx.pauseProduct(productId, r.code);
                        toast.success(`已暂停 ${r.code}`);
                      }}
                    >
                      暂停
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionShell>
  );
}

function patchChannel(
  ctx: ReturnType<typeof useProductCenter>,
  productId: string,
  regionCode: RegionCode,
  patch: Partial<ProductPublishChannel>,
) {
  ctx.patchPublishChannel(productId, regionCode, patch);
}

// ── Section: SEO ────────────────────────────────────────────────────────────

export function SeoSection({ productId }: { productId: string }) {
  const ctx = useProductCenter();
  const channels = ctx.getPublishChannelsForProduct(productId);
  const byRegion = new Map(channels.map((c) => [c.regionCode, c] as const));

  return (
    <SectionShell
      title="9. SEO 设置"
      subtitle="按区域分别维护 — 直接写入 publish_channels.seo_*，影响前台 <head> 与分享卡"
    >
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-20">区域</TableHead>
            <TableHead>SEO Title</TableHead>
            <TableHead>Meta Description</TableHead>
            <TableHead className="w-44">URL Slug</TableHead>
            <TableHead className="w-56">Keywords</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {REGIONS.map((r) => {
            const c = byRegion.get(r.code);
            return (
              <TableRow key={r.code}>
                <TableCell>
                  <RegionPill region={r.code} />
                </TableCell>
                <TableCell>
                  <SeoCell
                    value={c?.seoTitle ?? ''}
                    onCommit={(v) =>
                      ctx.patchPublishChannel(productId, r.code, { seoTitle: v })
                    }
                    placeholder="Best LED Panel 600x600 — Bulk Wholesale"
                  />
                </TableCell>
                <TableCell>
                  <SeoCell
                    value={c?.seoDescription ?? ''}
                    onCommit={(v) =>
                      ctx.patchPublishChannel(productId, r.code, { seoDescription: v })
                    }
                    placeholder="High-efficiency LED panel for office and retail …"
                  />
                </TableCell>
                <TableCell>
                  <SeoCell
                    value={c?.seoSlug ?? ''}
                    onCommit={(v) =>
                      ctx.patchPublishChannel(productId, r.code, {
                        seoSlug: v.replace(/\s+/g, '-').toLowerCase(),
                      })
                    }
                    placeholder="led-panel-600-40w"
                    mono
                  />
                </TableCell>
                <TableCell>
                  <SeoCell
                    value={(c?.seoKeywords ?? []).join(', ')}
                    onCommit={(v) =>
                      ctx.patchPublishChannel(productId, r.code, {
                        seoKeywords: v
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="led panel, 40w, office"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <div className="mt-2 text-[11px] text-slate-500">
        缺失字段会进入「审核中心 · 缺 SEO」提醒队列。失焦自动保存。
      </div>
    </SectionShell>
  );
}

function SeoCell({
  value,
  onCommit,
  placeholder,
  mono,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      placeholder={placeholder}
      className={`h-7 text-[12px] ${mono ? 'font-mono' : ''}`}
    />
  );
}

// ── Section: Campaign ───────────────────────────────────────────────────────

export function CampaignSection({ productId }: { productId: string }) {
  const ctx = useProductCenter();
  const cmps = ctx.getCampaignsForProduct(productId);
  return (
    <SectionShell title="10. 活动设置" subtitle="是否参加活动 / 活动价 / 活动标签 / 区域 / 展示位置" phase="Phase 2">
      {cmps.length === 0 ? (
        <div className="text-[12px] text-slate-500">
          该产品未加入任何活动。可在「促销管理」中将其加入活动。
        </div>
      ) : (
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>活动</TableHead>
              <TableHead>区域</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>展示位置</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>开始</TableHead>
              <TableHead>结束</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cmps.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {c.regionCodes.map((rc) => (
                      <RegionPill key={rc} region={rc} />
                    ))}
                  </div>
                </TableCell>
                <TableCell>{c.tag}</TableCell>
                <TableCell>{c.displaySlots.join(', ')}</TableCell>
                <TableCell className="capitalize">{c.status}</TableCell>
                <TableCell className="font-mono text-[11px]">
                  {new Date(c.startsAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono text-[11px]">
                  {new Date(c.endsAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionShell>
  );
}

// ── Section: Documents ──────────────────────────────────────────────────────

export function DocumentsSection({ productId }: { productId: string }) {
  const ctx = useProductCenter();
  const docs = ctx.getDocumentsForProduct(productId);
  return (
    <SectionShell title="11. 文件与认证" subtitle="说明书 · 认证证书 · A+ 资料">
      {docs.length === 0 ? (
        <div className="text-[12px] text-slate-500">未上传任何文件。</div>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <div>
                  <div className="font-medium text-slate-800">{d.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {d.kind} {d.issuedBy ? `· ${d.issuedBy}` : ''}{' '}
                    {d.validUntil ? `· 有效至 ${d.validUntil}` : ''}
                  </div>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-[12px]">
                下载
              </Button>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

// ── Section: Audit ──────────────────────────────────────────────────────────

export function AuditSection({ productId }: { productId: string }) {
  const ctx = useProductCenter();
  const logs = ctx.getAuditLogsForProduct(productId);
  return (
    <SectionShell title="12. 操作日志" subtitle="该产品所有操作的审计记录">
      {logs.length === 0 ? (
        <div className="text-[12px] text-slate-500">暂无操作。</div>
      ) : (
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-40">时间</TableHead>
              <TableHead className="w-28">操作</TableHead>
              <TableHead>字段</TableHead>
              <TableHead>变化</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...logs].reverse().map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-[11px] text-slate-500">
                  {new Date(l.occurredAt).toLocaleString('zh-CN', { hour12: false })}
                </TableCell>
                <TableCell className="font-mono">{l.action}</TableCell>
                <TableCell className="text-slate-600">{l.field ?? '—'}</TableCell>
                <TableCell className="text-slate-600">
                  {l.fromValue ?? '—'} → {l.toValue ?? '—'}
                </TableCell>
                <TableCell>{l.actorName ?? '—'}</TableCell>
                <TableCell className="text-slate-500">{l.note ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </SectionShell>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Field-level diff used by the Save button. Limits noise by:
 *   - skipping `updatedAt` / `archivedAt` (system-managed)
 *   - normalizing arrays / nulls
 *   - capping value previews at 80 chars
 */
const TRACKED_FIELDS: (keyof Product)[] = [
  'name',
  'nameEn',
  'nameZh',
  'sku',
  'spu',
  'brand',
  'productType',
  'shortDescription',
  'longDescription',
  'keywords',
  'tags',
  'thumbnailUrl',
  'primaryCategoryId',
  'internalCategory',
  'status',
  'reviewStatus',
  'campaignStatus',
  'unit',
  'netWeight',
  'grossWeight',
  'lengthCm',
  'widthCm',
  'heightCm',
  'moq',
  'unitsPerCarton',
  'cbm',
  'qty20gp',
  'qty40hq',
  'hsCode',
  'port',
  'leadTimeDays',
];

function diffProduct(a: Product, b: Product): { field: string; from: string; to: string }[] {
  const out: { field: string; from: string; to: string }[] = [];
  for (const k of TRACKED_FIELDS) {
    const va = a[k];
    const vb = b[k];
    if (Array.isArray(va) || Array.isArray(vb)) {
      const sa = (Array.isArray(va) ? va : []).join(', ');
      const sb = (Array.isArray(vb) ? vb : []).join(', ');
      if (sa !== sb) out.push({ field: String(k), from: cap(sa), to: cap(sb) });
      continue;
    }
    if ((va ?? '') !== (vb ?? '')) {
      out.push({ field: String(k), from: cap(String(va ?? '')), to: cap(String(vb ?? '')) });
    }
  }
  return out;
}

function cap(s: string) {
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}
