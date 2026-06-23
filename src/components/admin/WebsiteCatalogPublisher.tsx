import { useEffect, useMemo, useState } from 'react';
import { Edit3, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MainCategory, ProductSpec } from '../../data/productData';
import {
  deleteWebsiteCatalogProduct,
  fetchAllProducts,
  fetchProductCatalog,
  upsertWebsiteCatalogProduct,
} from '../../lib/services/productCatalogService';
import {
  getProductDiscountLabel,
  getProductMoq,
  getProductOriginalPrice,
  getProductPublishStatus,
  getProductPublishType,
  getProductQuantityStep,
  getProductSpecValue,
  getProductUnit,
  isWebsiteDealProduct,
} from '../../lib/productPublication';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// 区域标签（只读展示用）
const REGION_LABELS: Record<string, { name: string; flag: string }> = {
  NA: { name: '北美', flag: '🇺🇸' },
  SA: { name: '南美', flag: '🇧🇷' },
  EA: { name: '欧非', flag: '🇪🇺' },
};

const publishTypes = [
  { code: 'standard', label: '标准目录' },
  { code: 'deal', label: '促销 / 特价' },
  { code: 'new-arrival', label: '新品上市' },
  { code: 'bulk-container', label: '整柜 / 批量优惠' },
];

const publishStatuses = [
  { code: 'published', label: '已发布' },
  { code: 'draft', label: '草稿' },
  { code: 'offline', label: '已下架' },
];

const initialForm = {
  id: '',
  categoryId: '',
  publishType: 'standard',
  publishStatus: 'published',
  name: '',
  model: '',
  image: '',
  price: '',
  originalPrice: '',
  discountLabel: '',
  moq: '1',
  stock: '',
  eta: '',
  validUntil: '',
  quantityStep: '1',
  dealTag: '',
  displayPriority: '100',
  unit: 'pc',
  detail: '',
  unitsPerCarton: '1',
  cartonLength: '',
  cartonWidth: '',
  cartonHeight: '',
  cartonNetWeight: '',
  cartonGrossWeight: '',
};

type ProductForm = typeof initialForm;

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function flattenCategories(catalog: MainCategory[]) {
  return catalog.flatMap((main) =>
    main.subCategories.flatMap((sub) =>
      sub.productCategories.map((category) => ({
        id: category.id,
        label: `${main.name} / ${sub.name} / ${category.name}`,
      }))
    )
  );
}

function formFromProduct(product: ProductSpec): ProductForm {
  return {
    id: product.id,
    categoryId: product.categoryId || '',
    publishType: getProductPublishType(product),
    publishStatus: getProductPublishStatus(product),
    name: product.name || '',
    model: product.model || '',
    image: product.image || '',
    price: String(product.price || ''),
    originalPrice: String(getProductOriginalPrice(product) || ''),
    discountLabel: getProductDiscountLabel(product),
    moq: String(getProductMoq(product)),
    stock: getProductSpecValue(product, ['Stock']) || '',
    eta: getProductSpecValue(product, ['ETA']) || '',
    validUntil: getProductSpecValue(product, ['Valid Until']) || '',
    quantityStep: String(getProductQuantityStep(product)),
    dealTag: getProductSpecValue(product, ['Deal Tag']) || '',
    displayPriority: getProductSpecValue(product, ['Display Priority']) || '100',
    unit: getProductUnit(product),
    detail: getProductSpecValue(product, ['Material']) || getProductSpecValue(product, ['Specification']) || '',
    unitsPerCarton: String(product.unitsPerCarton || 1),
    cartonLength: String(product.cartonDimensions?.length || ''),
    cartonWidth: String(product.cartonDimensions?.width || ''),
    cartonHeight: String(product.cartonDimensions?.height || ''),
    cartonNetWeight: String(product.cartonNetWeight || ''),
    cartonGrossWeight: String(product.cartonGrossWeight || ''),
  };
}

export default function WebsiteCatalogPublisher({ regionCode }: { regionCode: string }) {
  // regionCode 由顶层区域选择器控制，此处不再维护内部 state
  const [catalog, setCatalog] = useState<MainCategory[]>([]);
  const [products, setProducts] = useState<ProductSpec[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('published');
  const [bulkType, setBulkType] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const categories = useMemo(() => flattenCategories(catalog), [catalog]);
  const discountedCount = useMemo(() => products.filter(isWebsiteDealProduct).length, [products]);
  const publishedCount = useMemo(() => products.filter((product) => getProductPublishStatus(product) === 'published').length, [products]);
  const draftCount = useMemo(() => products.filter((product) => getProductPublishStatus(product) === 'draft').length, [products]);
  const missingPriceCount = useMemo(() => products.filter((product) => Number(product.price || 0) <= 0).length, [products]);
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return [...products]
      .filter((product) => {
        const matchesQuery = !query || product.name.toLowerCase().includes(query) || product.model.toLowerCase().includes(query);
        const matchesType = typeFilter === 'all' || getProductPublishType(product) === typeFilter;
        const matchesStatus = statusFilter === 'all' || getProductPublishStatus(product) === statusFilter;
        return matchesQuery && matchesType && matchesStatus;
      })
      .sort((a, b) => {
        const priorityA = Number(getProductSpecValue(a, ['Display Priority']) || 100);
        const priorityB = Number(getProductSpecValue(b, ['Display Priority']) || 100);
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchTerm, typeFilter, statusFilter]);
  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.includes(product.id)),
    [products, selectedProductIds]
  );

  const getQualityStatus = (product: ProductSpec) => {
    const checks = [
      { ok: Boolean(product.categoryId), label: 'category' },
      { ok: Boolean(product.name.trim()), label: 'name' },
      { ok: Boolean(product.model.trim()), label: 'sku' },
      { ok: Boolean(product.image), label: 'image' },
      { ok: Number(product.price || 0) > 0, label: 'price' },
      { ok: getProductMoq(product) > 0, label: 'MOQ' },
      { ok: getProductQuantityStep(product) > 0, label: 'pack' },
      { ok: product.cartonDimensions.length > 0 && product.cartonDimensions.width > 0 && product.cartonDimensions.height > 0, label: 'carton size' },
      { ok: product.cartonGrossWeight > 0, label: 'GW' },
    ];
    const passed = checks.filter((check) => check.ok).length;
    return {
      score: Math.round((passed / checks.length) * 100),
      missing: checks.filter((check) => !check.ok).map((check) => check.label),
    };
  };

  const updateForm = (key: keyof ProductForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const loadData = async () => {
    setLoading(true);
    const [catalogResult, productsResult] = await Promise.allSettled([
      fetchProductCatalog(regionCode || null, { includeUnpublished: true }),
      fetchAllProducts(regionCode || null, { includeUnpublished: true }),
    ]);

    const nextCatalog = catalogResult.status === 'fulfilled' ? catalogResult.value : [];
    const nextProducts = productsResult.status === 'fulfilled' ? productsResult.value : [];

    if (catalogResult.status === 'rejected') {
      console.warn('Failed to load website category catalog.', catalogResult.reason);
    }
    if (productsResult.status === 'rejected') {
      console.warn('Failed to load website catalog products.', productsResult.reason);
    }

    setCatalog(nextCatalog);
    setProducts(nextProducts);
    setForm((current) => ({
      ...current,
      categoryId: current.categoryId || flattenCategories(nextCatalog)[0]?.id || '',
    }));
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [regionCode]);

  const resetForm = () => {
    setForm({
      ...initialForm,
      categoryId: categories[0]?.id || '',
    });
  };

  const buildUpsertInput = (sourceForm: ProductForm) => {
    const currentPrice = parseNumber(sourceForm.price);
    const originalPrice = parseNumber(sourceForm.originalPrice);
    const unitsPerCarton = Math.max(parseNumber(sourceForm.unitsPerCarton) || 1, 1);
    const quantityStep = Math.max(parseNumber(sourceForm.quantityStep) || unitsPerCarton, 1);
    const moq = Math.max(parseNumber(sourceForm.moq) || quantityStep, quantityStep);
    const publishType = sourceForm.publishType || 'standard';
    const isDealType = publishType === 'deal' || publishType === 'bulk-container';
    const discountPercent = originalPrice > currentPrice && currentPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
    const discountLabel = sourceForm.discountLabel.trim() || (discountPercent > 0 ? `${discountPercent}% OFF` : '');
    const specifications: Record<string, string> = {
      Unit: sourceForm.unit.trim() || 'pc',
      'Publish Type': publishType,
      'Publish Status': sourceForm.publishStatus || 'published',
      MOQ: String(moq),
      Stock: sourceForm.stock.trim(),
      ETA: sourceForm.eta.trim(),
      'Valid Until': sourceForm.validUntil.trim(),
      'Quantity Step': String(quantityStep),
      'Deal Tag': sourceForm.dealTag.trim(),
      'Display Priority': sourceForm.displayPriority.trim() || '100',
      'On Sale': isDealType ? 'true' : 'false',
    };
    if (originalPrice > 0) specifications['Original Price'] = sourceForm.originalPrice.trim();
    if (isDealType || discountLabel) {
      specifications.Discount = discountLabel || 'Deal';
      specifications['Deal Label'] = discountLabel || 'Deal';
    }
    if (sourceForm.detail.trim()) {
      specifications.Material = sourceForm.detail.trim();
      specifications.Specification = sourceForm.detail.trim();
    }

    return {
      id: sourceForm.id || undefined,
      categoryId: sourceForm.categoryId,
      name: sourceForm.name,
      model: sourceForm.model,
      image: sourceForm.image,
      price: currentPrice,
      regionCode: regionCode || null,
      unitsPerCarton,
      cartonLength: parseNumber(sourceForm.cartonLength),
      cartonWidth: parseNumber(sourceForm.cartonWidth),
      cartonHeight: parseNumber(sourceForm.cartonHeight),
      cartonNetWeight: parseNumber(sourceForm.cartonNetWeight),
      cartonGrossWeight: parseNumber(sourceForm.cartonGrossWeight),
      specifications,
    };
  };

  const saveProduct = async () => {
    if (!form.categoryId) {
      toast.error('Please select a website category first');
      return;
    }
    if (!form.name.trim() || !form.model.trim()) {
      toast.error('Product name and model are required');
      return;
    }
    const currentPrice = parseNumber(form.price);
    if (currentPrice <= 0) {
      toast.error('Website products must have a valid selling price');
      return;
    }
    setSaving(true);
    try {
      await upsertWebsiteCatalogProduct(buildUpsertInput(form));
      toast.success('Website product published');
      resetForm();
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to publish product: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]
    );
  };

  const toggleVisibleSelection = () => {
    const visibleIds = filteredProducts.map((product) => product.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedProductIds.includes(id));
    setSelectedProductIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...current, ...visibleIds]))
    );
  };

  const applyBulkUpdate = async (mode: 'status' | 'type') => {
    if (selectedProducts.length === 0) {
      toast.error('Select products first');
      return;
    }
    if (
      mode === 'status' &&
      bulkStatus === 'published' &&
      selectedProducts.some((product) => Number(product.price || 0) <= 0)
    ) {
      toast.error('Products without a valid price cannot be published');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        selectedProducts.map((product) => {
          const nextForm = {
            ...formFromProduct(product),
            publishStatus: mode === 'status' ? bulkStatus : getProductPublishStatus(product),
            publishType: mode === 'type' ? bulkType : getProductPublishType(product),
          };
          return upsertWebsiteCatalogProduct(buildUpsertInput(nextForm));
        })
      );
      toast.success(`Updated ${selectedProducts.length} products`);
      setSelectedProductIds([]);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Bulk update failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: ProductSpec) => {
    if (!window.confirm(`Delete ${product.name} from website catalog?`)) return;
    try {
      await deleteWebsiteCatalogProduct(product.id);
      toast.success('Website product deleted');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to delete product: ${message}`);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[18px] font-bold text-gray-900">官网产品发布</h1>
            {(() => {
              const r = REGION_LABELS[regionCode];
              return r ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  <span>{r.flag}</span>{r.name}
                </span>
              ) : null;
            })()}
          </div>
          <p className="text-xs text-gray-500">发布到前台 Catalog / Deals & Offers。所有官网产品必须在这里维护真实价格。</p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: 'SKU 总数', value: products.length },
          { label: '已发布', value: publishedCount },
          { label: '促销产品', value: discountedCount },
          { label: '草稿 / 缺价格', value: `${draftCount} / ${missingPriceCount}` },
        ].map((item) => (
          <div key={item.label} className="rounded border border-gray-200 bg-white px-4 py-3">
            <div className="text-[11px] font-bold uppercase text-gray-500">{item.label}</div>
            <div className="mt-1 text-2xl font-black text-gray-950">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">发布 / 编辑产品</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>发布区域</Label>
              <div className="flex h-9 items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700">
                {(() => {
                  const r = REGION_LABELS[regionCode];
                  return r ? (
                    <>
                      <span>{r.flag}</span>
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-gray-400">（由顶层区域选择器控制）</span>
                    </>
                  ) : (
                    <span className="text-gray-400">未指定区域</span>
                  );
                })()}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>网站分类</Label>
              <select
                value={form.categoryId}
                onChange={(event) => updateForm('categoryId', event.target.value)}
                className="h-9 rounded border border-gray-200 bg-white px-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label>发布类型</Label>
                <select
                  value={form.publishType}
                  onChange={(event) => updateForm('publishType', event.target.value)}
                  className="h-9 rounded border border-gray-200 bg-white px-3 text-sm"
                >
                  {publishTypes.map((type) => (
                    <option key={type.code} value={type.code}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>发布状态</Label>
                <select
                  value={form.publishStatus}
                  onChange={(event) => updateForm('publishStatus', event.target.value)}
                  className="h-9 rounded border border-gray-200 bg-white px-3 text-sm"
                >
                  {publishStatuses.map((status) => (
                    <option key={status.code} value={status.code}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>产品名称</Label>
              <Input value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>型号 / SKU</Label>
              <Input value={form.model} onChange={(event) => updateForm('model', event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>产品图片链接</Label>
              <Input value={form.image} onChange={(event) => updateForm('image', event.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>网站售价</Label>
                <Input value={form.price} onChange={(event) => updateForm('price', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>原价</Label>
                <Input value={form.originalPrice} onChange={(event) => updateForm('originalPrice', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>单位</Label>
                <Input value={form.unit} onChange={(event) => updateForm('unit', event.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>折扣标签</Label>
              <Input placeholder="如：立省 20%" value={form.discountLabel} onChange={(event) => updateForm('discountLabel', event.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>最小起订量</Label>
                <Input value={form.moq} onChange={(event) => updateForm('moq', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>订购步长</Label>
                <Input value={form.quantityStep} onChange={(event) => updateForm('quantityStep', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>库存</Label>
                <Input value={form.stock} onChange={(event) => updateForm('stock', event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>交期</Label>
                <Input placeholder="如：7-10 天" value={form.eta} onChange={(event) => updateForm('eta', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>有效期</Label>
                <Input placeholder="如：2026-05-15" value={form.validUntil} onChange={(event) => updateForm('validUntil', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>展示优先级</Label>
                <Input value={form.displayPriority} onChange={(event) => updateForm('displayPriority', event.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>产品标签</Label>
              <Input placeholder="如：整柜现货 / 可接散货" value={form.dealTag} onChange={(event) => updateForm('dealTag', event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>规格 / 材质说明</Label>
              <Input value={form.detail} onChange={(event) => updateForm('detail', event.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>装箱数</Label>
                <Input value={form.unitsPerCarton} onChange={(event) => updateForm('unitsPerCarton', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>箱净重(kg)</Label>
                <Input value={form.cartonNetWeight} onChange={(event) => updateForm('cartonNetWeight', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>箱毛重(kg)</Label>
                <Input value={form.cartonGrossWeight} onChange={(event) => updateForm('cartonGrossWeight', event.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label>长(cm)</Label>
                <Input value={form.cartonLength} onChange={(event) => updateForm('cartonLength', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>宽(cm)</Label>
                <Input value={form.cartonWidth} onChange={(event) => updateForm('cartonWidth', event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>高(cm)</Label>
                <Input value={form.cartonHeight} onChange={(event) => updateForm('cartonHeight', event.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveProduct} disabled={saving} className="bg-red-600 hover:bg-red-700">
                <Save className="mr-2 h-4 w-4" />
                发布产品
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>新建</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">已发布产品（{products.length} 个） / 促销（{discountedCount} 个）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 xl:grid-cols-[minmax(220px,1fr)_180px_160px]">
              <Input
                placeholder="搜索产品名或型号..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="h-9 rounded border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="all">全部类型</option>
                {publishTypes.map((type) => (
                  <option key={type.code} value={type.code}>{type.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="all">全部状态</option>
                {publishStatuses.map((status) => (
                  <option key={status.code} value={status.code}>{status.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2">
              <span className="text-xs font-bold text-gray-600">已选 {selectedProducts.length} 个</span>
              <select
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value)}
                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs font-semibold"
              >
                {publishStatuses.map((status) => (
                  <option key={status.code} value={status.code}>{status.label}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" disabled={saving || selectedProducts.length === 0} onClick={() => void applyBulkUpdate('status')}>
                批量设置状态
              </Button>
              <select
                value={bulkType}
                onChange={(event) => setBulkType(event.target.value)}
                className="h-8 rounded border border-gray-200 bg-white px-2 text-xs font-semibold"
              >
                {publishTypes.map((type) => (
                  <option key={type.code} value={type.code}>{type.label}</option>
                ))}
              </select>
              <Button size="sm" variant="outline" disabled={saving || selectedProducts.length === 0} onClick={() => void applyBulkUpdate('type')}>
                批量设置类型
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={filteredProducts.length > 0 && filteredProducts.every((product) => selectedProductIds.includes(product.id))}
                        onChange={toggleVisibleSelection}
                      />
                    </TableHead>
                    <TableHead>产品</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>起订量 / 库存</TableHead>
                    <TableHead>数据质量</TableHead>
                    <TableHead>区域</TableHead>
                    <TableHead>促销</TableHead>
                    <TableHead className="w-[96px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const quality = getQualityStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(product.id)}
                            onChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-500">{product.model}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-red-600">${Number(product.price || 0).toFixed(2)}</div>
                          {getProductOriginalPrice(product) > 0 && (
                            <div className="text-xs text-slate-400 line-through">${getProductOriginalPrice(product).toFixed(2)}</div>
                          )}
                        </TableCell>
                        <TableCell>{getProductPublishType(product)}</TableCell>
                        <TableCell>
                          {(() => {
                            const s = getProductPublishStatus(product);
                            const map: Record<string, { label: string; cls: string }> = {
                              published: { label: '已发布', cls: 'bg-green-50 text-green-700' },
                              draft: { label: '草稿', cls: 'bg-yellow-50 text-yellow-700' },
                              offline: { label: '已下架', cls: 'bg-gray-100 text-gray-600' },
                            };
                            const info = map[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600' };
                            return (
                              <span className={`rounded px-2 py-1 text-xs font-bold ${info.cls}`}>
                                {info.label}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-slate-700">起订 {getProductMoq(product)}</div>
                          <div className="text-xs text-slate-500">库存 {getProductSpecValue(product, ['Stock']) || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-xs font-black ${quality.score >= 80 ? 'text-green-700' : 'text-red-600'}`}>
                            {quality.score}%
                          </div>
                          {quality.missing.length > 0 && (
                            <div className="max-w-[160px] truncate text-[11px] text-slate-500" title={quality.missing.join(', ')}>
                              缺少: {quality.missing.join(', ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.regionCode || '通用'}</TableCell>
                        <TableCell>{isWebsiteDealProduct(product) ? getProductDiscountLabel(product) || '促销中' : '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => setForm(formFromProduct(product))}>
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => void deleteProduct(product)}>
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredProducts.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-500">当前区域暂无已发布产品，请先在左侧表单添加。</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
