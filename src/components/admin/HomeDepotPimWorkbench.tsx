import { useEffect, useMemo, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  Database,
  Filter,
  PackageSearch,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Tags,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { MainCategory, ProductCategory, ProductSpec } from '../../data/productData';
import {
  getProductMoq,
  getProductOriginalPrice,
  getProductPublishStatus,
  getProductPublishType,
  getProductQuantityStep,
  getProductUnit,
  isWebsiteDealProduct,
} from '../../lib/productPublication';
import {
  fetchAllProducts,
  fetchProductCatalog,
  syncWebsiteCategoryArchitecture,
  upsertWebsiteCatalogProduct,
} from '../../lib/services/productCatalogService';
import { buildMainCategoriesFromStorefrontDepartments, storefrontBaselineDepartments as storefrontDepartments } from '../../lib/storefrontDepartmentBaseline';
import {
  deletePimAsset,
  deletePimAttribute,
  deletePimVariant,
  fetchPimDataset,
  type PimAttribute,
  type PimAttributeDataType,
  type PimAssetQualityStatus,
  type PimAssetType,
  type PimDataset,
  type PimTemplateStatus,
  upsertPimAsset,
  upsertPimAttribute,
  upsertPimAttributeValue,
  upsertPimSearchIndex,
  upsertPimTemplate,
  upsertPimVariant,
} from '../../lib/services/homeDepotPimService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type TemplateField = {
  key: string;
  label: string;
  group: string;
  required?: boolean;
  filterable?: boolean;
  compliance?: boolean;
};

type LoadNotice = {
  type: 'info' | 'warning' | 'error';
  message: string;
};

type WorkspaceTab = 'attributes' | 'template' | 'assets' | 'search' | 'variants';

const emptyPim: PimDataset = {
  templates: [],
  attributes: [],
  values: [],
  assets: [],
  variants: [],
  searchIndexes: [],
};

const templateLibrary: Record<string, { name: string; threshold: number; fields: TemplateField[] }> = {
  'top-freezer': {
    name: 'Top Freezer Refrigerators',
    threshold: 90,
    fields: [
      { key: 'Brand', label: 'Brand', group: 'Identity', required: true, filterable: true },
      { key: 'Capacity', label: 'Capacity', group: 'Specifications', required: true, filterable: true },
      { key: 'Width', label: 'Width', group: 'Dimensions', required: true, filterable: true },
      { key: 'Color/Finish', label: 'Color/Finish', group: 'Specifications', required: true, filterable: true },
      { key: 'Energy Star', label: 'ENERGY STAR Certified', group: 'Compliance', filterable: true, compliance: true },
    ],
  },
  'dimensional-lumber': {
    name: 'Dimensional Lumber',
    threshold: 85,
    fields: [
      { key: 'Wood Species', label: 'Wood Species', group: 'Specifications', required: true, filterable: true },
      { key: 'Nominal Size', label: 'Nominal Size', group: 'Dimensions', required: true, filterable: true },
      { key: 'Length', label: 'Length', group: 'Dimensions', required: true, filterable: true },
      { key: 'Treatment Type', label: 'Treatment Type', group: 'Compliance', filterable: true, compliance: true },
    ],
  },
  'led-bulbs': {
    name: 'LED Bulbs',
    threshold: 88,
    fields: [
      { key: 'Brand', label: 'Brand', group: 'Identity', required: true, filterable: true },
      { key: 'Wattage', label: 'Wattage', group: 'Specifications', required: true, filterable: true },
      { key: 'Lumens', label: 'Lumens', group: 'Specifications', required: true, filterable: true },
      { key: 'Color Temperature', label: 'Color Temperature', group: 'Specifications', required: true, filterable: true },
      { key: 'Certification', label: 'Certification', group: 'Compliance', filterable: true, compliance: true },
    ],
  },
};

const buildStorefrontFallbackCatalog = (): MainCategory[] =>
  buildMainCategoriesFromStorefrontDepartments(storefrontDepartments);

async function resolveWithTimeout<T>(label: string, task: Promise<T>, timeoutMs = 6500): Promise<{ data?: T; error?: string }> {
  try {
    const data = await Promise.race<T>([
      task,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(`${label} request timed out`)), timeoutMs);
      }),
    ]);
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const getSpecMatch = (product: ProductSpec, candidates: string[]) => {
  const specs = product.specifications || {};
  const match = Object.entries(specs).find(([key]) =>
    candidates.some((candidate) => key.trim().toLowerCase() === candidate.toLowerCase())
  );
  return String(match?.[1] || '').trim();
};

const getCategoryPathMap = (catalog: MainCategory[]) => {
  const pathMap = new Map<string, { path: string; leaf: ProductCategory; departmentId: string }>();
  for (const department of catalog) {
    for (const aisle of department.subCategories) {
      for (const leaf of aisle.productCategories) {
        pathMap.set(leaf.id, {
          path: `${department.name} / ${aisle.name} / ${leaf.name}`,
          leaf,
          departmentId: department.id,
        });
      }
    }
  }
  return pathMap;
};

const valueToString = (value: any) => {
  if (Array.isArray(value.value_json)) return value.value_json.join(', ');
  if (value.value_number !== null && value.value_number !== undefined) return String(value.value_number);
  if (value.value_boolean !== null && value.value_boolean !== undefined) return value.value_boolean ? 'true' : 'false';
  return String(value.value_text || '');
};

const hasSavedAttributeValue = (value: any) => {
  if (!value) return false;
  if (Array.isArray(value.value_json)) return value.value_json.length > 0;
  if (value.value_number !== null && value.value_number !== undefined) return true;
  if (value.value_boolean !== null && value.value_boolean !== undefined) return true;
  return Boolean(String(value.value_text || '').trim());
};

const scoreProduct = (
  product: ProductSpec,
  pathMap: Map<string, { path: string; leaf: ProductCategory; departmentId: string }>,
  attributes: PimAttribute[] = [],
  savedValues: Record<string, any> = {},
  templateThreshold?: number
) => {
  const staticTemplate = product.categoryId ? templateLibrary[product.categoryId] : undefined;
  const checks = [
    { key: 'category', label: '产品分类', ok: Boolean(pathMap.get(product.categoryId || '')) },
    { key: 'title', label: '产品名称', ok: Boolean(product.name?.trim()) },
    { key: 'model', label: '型号', ok: Boolean(product.model?.trim()) },
    { key: 'image', label: '主图', ok: Boolean(product.image) },
    { key: 'price', label: '官网价格', ok: Number(product.price || 0) > 0 },
    { key: 'unit', label: '计量单位', ok: Boolean(getProductUnit(product)) },
    { key: 'moq', label: '最小订量', ok: getProductMoq(product) > 0 },
    { key: 'step', label: '步进数量', ok: getProductQuantityStep(product) > 0 },
    { key: 'pack', label: '装箱数', ok: Number(product.unitsPerCarton || 0) > 0 },
    {
      key: 'carton',
      label: '外箱尺寸',
      ok: product.cartonDimensions.length > 0 && product.cartonDimensions.width > 0 && product.cartonDimensions.height > 0,
    },
    { key: 'gw', label: '毛重', ok: Number(product.cartonGrossWeight || 0) > 0 },
    { key: 'publish', label: '发布状态', ok: Boolean(getProductPublishStatus(product)) },
    { key: 'type', label: '发布类型', ok: Boolean(getProductPublishType(product)) },
  ];

  const requiredFields = attributes.length
    ? attributes.filter((item) => item.is_required).map((item) => ({ key: item.attribute_key, label: item.label }))
    : staticTemplate?.fields.filter((item) => item.required) || [];

  for (const field of requiredFields) {
    checks.push({
      key: `attr-${field.key}`,
      label: field.label,
      ok: Boolean(getSpecMatch(product, [field.key, field.label])) || hasSavedAttributeValue(savedValues[field.key]),
    });
  }

  const passed = checks.filter((check) => check.ok).length;
  return {
    score: Math.round((passed / checks.length) * 100),
    missing: checks.filter((check) => !check.ok).map((check) => check.label),
    threshold: templateThreshold || staticTemplate?.threshold || 85,
  };
};

export default function HomeDepotPimWorkbench() {
  const [catalog, setCatalog] = useState<MainCategory[]>([]);
  const [products, setProducts] = useState<ProductSpec[]>([]);
  const [pim, setPim] = useState<PimDataset>(emptyPim);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadNotices, setLoadNotices] = useState<LoadNotice[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceTab>('attributes');
  const [templateForm, setTemplateForm] = useState({
    categoryId: '',
    templateName: '',
    status: 'active',
    versionNo: '1',
    threshold: '85',
  });
  const [attributeForm, setAttributeForm] = useState({
    id: '',
    templateId: '',
    attributeKey: '',
    label: '',
    dataType: 'text',
    unit: '',
    optionsText: '',
    displayGroup: 'Specifications',
    displayOrder: '100',
    isRequired: true,
    isFilterable: true,
    isSearchable: true,
    isCompliance: false,
  });
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
  const [assetForm, setAssetForm] = useState({
    assetType: 'gallery',
    assetUrl: '',
    title: '',
    altText: '',
    sortOrder: '100',
    qualityStatus: 'unchecked',
  });
  const [searchForm, setSearchForm] = useState({
    searchTitle: '',
    keywordsText: '',
    brand: '',
    modelNumber: '',
    internetSku: '',
  });
  const [variantForm, setVariantForm] = useState({
    childProductId: '',
    variantAxis: 'Color',
    variantValue: '',
    displayOrder: '100',
  });
  const [newSkuForm, setNewSkuForm] = useState({
    categoryId: '',
    name: '',
    model: '',
    image: '',
    price: '0',
    unit: 'pc',
    moq: '1',
    quantityStep: '1',
    stock: '0',
    publishStatus: 'draft',
    publishType: 'standard-catalog',
  });

  const pathMap = useMemo(() => getCategoryPathMap(catalog), [catalog]);

  const leafCategories = useMemo(
    () =>
      catalog.flatMap((department) =>
        department.subCategories.flatMap((aisle) =>
          aisle.productCategories.map((leaf) => ({
            id: leaf.id,
            name: leaf.name,
            path: `${department.name} / ${aisle.name} / ${leaf.name}`,
          }))
        )
      ),
    [catalog]
  );

  const templateByCategory = useMemo(() => {
    const map = new Map<string, (typeof pim.templates)[number]>();
    for (const template of pim.templates) map.set(template.category_id, template);
    return map;
  }, [pim.templates]);

  const attributesByTemplate = useMemo(() => {
    const map = new Map<string, PimAttribute[]>();
    for (const attribute of pim.attributes) {
      const list = map.get(attribute.template_id) || [];
      list.push(attribute);
      map.set(attribute.template_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.display_order - b.display_order || a.label.localeCompare(b.label));
    return map;
  }, [pim.attributes]);

  const loadData = async () => {
    setLoading(true);
    const notices: LoadNotice[] = [];
    try {
      const [catalogResult, productsResult, pimResult] = await Promise.all([
        resolveWithTimeout('Category catalog', fetchProductCatalog(null, { includeUnpublished: true })),
        resolveWithTimeout('Products', fetchAllProducts(null, { includeUnpublished: true })),
        resolveWithTimeout('PIM metadata', fetchPimDataset(), 5500),
      ]);

      const nextCatalog = catalogResult.data && catalogResult.data.length > 0 ? catalogResult.data : buildStorefrontFallbackCatalog();
      if (catalogResult.error) {
        notices.push({ type: 'warning', message: `产品类目表读取失败，已用前台类目结构临时展示：${catalogResult.error}` });
      } else if (!catalogResult.data || catalogResult.data.length === 0) {
        notices.push({ type: 'warning', message: '数据库暂无类目记录，当前使用前台类目结构展示。保存模板前请先同步类目。' });
      }

      const nextProducts = productsResult.data || [];
      if (productsResult.error) {
        notices.push({ type: 'error', message: `产品 SKU 读取失败：${productsResult.error}` });
      } else if (nextProducts.length === 0) {
        notices.push({ type: 'info', message: '当前没有 SKU。可在中间工作区创建官网 SKU，之后这里会成为质量治理队列。' });
      }

      if (pimResult.error) notices.push({ type: 'warning', message: `PIM 扩展表读取失败：${pimResult.error}` });

      setCatalog(nextCatalog);
      setProducts(nextProducts);
      setPim(pimResult.data || emptyPim);
      setLoadNotices(notices);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`PIM 管控中心加载失败：${message}`);
      setLoadNotices([{ type: 'error', message: `PIM 控制台加载失败：${message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const reloadPim = async () => {
    setPim(await fetchPimDataset());
  };

  useEffect(() => {
    void loadData();
  }, []);

  const scoredProducts = useMemo(
    () =>
      products.map((product) => {
        const template = templateByCategory.get(product.categoryId || '');
        const attributes = template ? attributesByTemplate.get(template.id) || [] : [];
        const savedValues = Object.fromEntries(
          attributes.map((attribute) => [
            attribute.attribute_key,
            pim.values.find((value) => value.product_id === product.id && value.attribute_id === attribute.id),
          ])
        );
        return {
          product,
          quality: scoreProduct(product, pathMap, attributes, savedValues, template?.required_score_threshold),
        };
      }),
    [attributesByTemplate, pathMap, pim.values, products, templateByCategory]
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return scoredProducts
      .filter(({ product }) => {
        const departmentMatch = selectedDepartmentId === 'all' || pathMap.get(product.categoryId || '')?.departmentId === selectedDepartmentId;
        const path = pathMap.get(product.categoryId || '')?.path || '';
        const queryMatch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.model.toLowerCase().includes(query) ||
          path.toLowerCase().includes(query);
        return departmentMatch && queryMatch;
      })
      .sort((a, b) => a.quality.score - b.quality.score || a.product.name.localeCompare(b.product.name));
  }, [pathMap, scoredProducts, searchTerm, selectedDepartmentId]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || filteredProducts[0]?.product || products[0],
    [filteredProducts, products, selectedProductId]
  );

  const selectedCategoryId = selectedProduct?.categoryId || newSkuForm.categoryId || leafCategories[0]?.id || '';
  const selectedCategoryPath = pathMap.get(selectedCategoryId)?.path || leafCategories.find((item) => item.id === selectedCategoryId)?.path || '未映射';
  const selectedTemplate = templateByCategory.get(selectedCategoryId);
  const selectedAttributes = selectedTemplate ? attributesByTemplate.get(selectedTemplate.id) || [] : [];
  const selectedAssets = selectedProduct ? pim.assets.filter((asset) => asset.product_id === selectedProduct.id) : [];
  const selectedVariants = selectedProduct ? pim.variants.filter((variant) => variant.parent_product_id === selectedProduct.id) : [];
  const selectedSearchIndex = selectedProduct ? pim.searchIndexes.find((index) => index.product_id === selectedProduct.id) : undefined;

  const templateCategoryId = templateForm.categoryId || selectedCategoryId;
  const templateCategoryPath = pathMap.get(templateCategoryId)?.path || leafCategories.find((item) => item.id === templateCategoryId)?.path || '未映射';
  const templateForEditor = templateByCategory.get(templateCategoryId);
  const editorAttributes = templateForEditor ? attributesByTemplate.get(templateForEditor.id) || [] : [];

  const selectedQuality = scoredProducts.find(({ product }) => product.id === selectedProduct?.id)?.quality;

  const summary = useMemo(() => {
    const published = scoredProducts.filter(({ product }) => getProductPublishStatus(product) === 'published').length;
    const dealProducts = scoredProducts.filter(({ product }) => isWebsiteDealProduct(product)).length;
    const readyProducts = scoredProducts.filter(({ quality }) => quality.score >= quality.threshold).length;
    const templateCovered = scoredProducts.filter(({ product }) => Boolean(templateByCategory.get(product.categoryId || ''))).length;
    const averageScore = scoredProducts.length
      ? Math.round(scoredProducts.reduce((sum, item) => sum + item.quality.score, 0) / scoredProducts.length)
      : 0;
    return { published, dealProducts, readyProducts, templateCovered, averageScore };
  }, [scoredProducts, templateByCategory]);

  const categoryStats = useMemo(() => {
    const departments = catalog.length;
    const aisles = catalog.reduce((sum, item) => sum + item.subCategories.length, 0);
    const leafCategoryCount = leafCategories.length;
    return { departments, aisles, leafCategoryCount };
  }, [catalog, leafCategories.length]);

  const selectedDepartment = catalog.find((department) => department.id === selectedDepartmentId);
  const activeDepartment = selectedDepartmentId === 'all' ? catalog[0] : selectedDepartment;
  const templateCoverage = products.length ? Math.round((summary.templateCovered / products.length) * 100) : 0;
  const readyRate = products.length ? Math.round((summary.readyProducts / products.length) * 100) : 0;
  const workspaceTabs: Array<{ id: WorkspaceTab; label: string; count?: number }> = [
    { id: 'attributes', label: 'SKU属性值', count: selectedAttributes.length },
    { id: 'template', label: '属性模板', count: editorAttributes.length },
    { id: 'assets', label: '媒体资产', count: selectedAssets.length },
    { id: 'search', label: '搜索索引' },
    { id: 'variants', label: '产品变体', count: selectedVariants.length },
  ];

  useEffect(() => {
    if (selectedProduct && selectedProduct.id !== selectedProductId) setSelectedProductId(selectedProduct.id);
  }, [selectedProduct, selectedProductId]);

  useEffect(() => {
    const staticTemplate = templateLibrary[selectedCategoryId];
    setTemplateForm({
      categoryId: selectedCategoryId,
      templateName: selectedTemplate?.template_name || staticTemplate?.name || pathMap.get(selectedCategoryId)?.leaf.name || 'Category Template',
      status: selectedTemplate?.status || 'active',
      versionNo: String(selectedTemplate?.version_no || 1),
      threshold: String(selectedTemplate?.required_score_threshold || staticTemplate?.threshold || 85),
    });
    setAttributeForm((current) => ({
      ...current,
      id: '',
      templateId: selectedTemplate?.id || '',
      attributeKey: '',
      label: '',
      dataType: 'text',
      unit: '',
      optionsText: '',
      displayGroup: 'Specifications',
      displayOrder: '100',
      isRequired: true,
      isFilterable: true,
      isSearchable: true,
      isCompliance: false,
    }));
    setNewSkuForm((current) => ({ ...current, categoryId: selectedCategoryId }));
  }, [pathMap, selectedCategoryId, selectedTemplate]);

  useEffect(() => {
    if (!selectedProduct) return;
    const nextValues: Record<string, string> = {};
    for (const attribute of selectedAttributes) {
      const stored = pim.values.find((value) => value.product_id === selectedProduct.id && value.attribute_id === attribute.id);
      nextValues[attribute.id] = stored ? valueToString(stored) : getSpecMatch(selectedProduct, [attribute.attribute_key, attribute.label]);
    }
    setAttributeValues(nextValues);

    const specs = selectedProduct.specifications || {};
    const specText = Object.values(specs).slice(0, 8).join(', ');
    setSearchForm({
      searchTitle: selectedSearchIndex?.search_title || selectedProduct.name || '',
      keywordsText: selectedSearchIndex?.search_keywords?.join(', ') || [selectedProduct.name, selectedProduct.model, selectedCategoryPath, specText].filter(Boolean).join(', '),
      brand: selectedSearchIndex?.brand || getSpecMatch(selectedProduct, ['Brand']) || '',
      modelNumber: selectedSearchIndex?.model_number || selectedProduct.model || '',
      internetSku: selectedSearchIndex?.internet_sku || selectedProduct.id || '',
    });
    setAssetForm({
      assetType: 'gallery',
      assetUrl: '',
      title: '',
      altText: selectedProduct.name || '',
      sortOrder: '100',
      qualityStatus: 'unchecked',
    });
    setVariantForm((current) => ({ ...current, childProductId: '', variantValue: '' }));
  }, [pim.values, selectedAttributes, selectedCategoryPath, selectedProduct, selectedSearchIndex]);

  const runSave = async (label: string, action: () => Promise<void>) => {
    setSaving(true);
    try {
      await action();
      toast.success(`${label} saved`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`${label} failed: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = () =>
    runSave('Category template', async () => {
      await syncWebsiteCategoryArchitecture(catalog);
      const saved = await upsertPimTemplate({
        id: templateForEditor?.id,
        categoryId: templateForm.categoryId,
        templateName: templateForm.templateName,
        status: templateForm.status as PimTemplateStatus,
        versionNo: Number(templateForm.versionNo || 1),
        requiredScoreThreshold: Number(templateForm.threshold || 85),
      });
      setAttributeForm((current) => ({ ...current, templateId: saved.id }));
      await reloadPim();
    });

  const handleSaveAttribute = () =>
    runSave('Attribute', async () => {
      const templateId = attributeForm.templateId || templateForEditor?.id;
      if (!templateId) throw new Error('Save the category template first.');
      await upsertPimAttribute({
        id: attributeForm.id || undefined,
        templateId,
        attributeKey: attributeForm.attributeKey || attributeForm.label,
        label: attributeForm.label,
        dataType: attributeForm.dataType as PimAttributeDataType,
        unit: attributeForm.unit,
        optionsText: attributeForm.optionsText,
        isRequired: attributeForm.isRequired,
        isFilterable: attributeForm.isFilterable,
        isSearchable: attributeForm.isSearchable,
        isCompliance: attributeForm.isCompliance,
        displayGroup: attributeForm.displayGroup,
        displayOrder: Number(attributeForm.displayOrder || 100),
      });
      await reloadPim();
    });

  const handleSaveAttributeValues = () =>
    runSave('SKU attributes', async () => {
      if (!selectedProduct) throw new Error('Select a SKU first.');
      await Promise.all(
        selectedAttributes.map((attribute) =>
          upsertPimAttributeValue({
            productId: selectedProduct.id,
            attribute,
            value: attributeValues[attribute.id] || '',
          })
        )
      );
      await reloadPim();
    });

  const handleSaveAsset = () =>
    runSave('Asset', async () => {
      if (!selectedProduct) throw new Error('Select a SKU first.');
      if (!assetForm.assetUrl.trim()) throw new Error('Asset URL is required.');
      await upsertPimAsset({
        productId: selectedProduct.id,
        assetType: assetForm.assetType as PimAssetType,
        assetUrl: assetForm.assetUrl,
        title: assetForm.title,
        altText: assetForm.altText,
        sortOrder: Number(assetForm.sortOrder || 100),
        qualityStatus: assetForm.qualityStatus as PimAssetQualityStatus,
      });
      await reloadPim();
      setAssetForm((current) => ({ ...current, assetUrl: '', title: '' }));
    });

  const handleSaveSearchIndex = () =>
    runSave('Search index', async () => {
      if (!selectedProduct) throw new Error('Select a SKU first.');
      await upsertPimSearchIndex({
        product_id: selectedProduct.id,
        search_title: searchForm.searchTitle,
        search_keywords: searchForm.keywordsText.split(',').map((item) => item.trim()).filter(Boolean),
        brand: searchForm.brand,
        model_number: searchForm.modelNumber,
        internet_sku: searchForm.internetSku,
        category_path: selectedCategoryPath,
      });
      await reloadPim();
    });

  const handleSaveVariant = () =>
    runSave('Variant', async () => {
      if (!selectedProduct) throw new Error('Select a parent SKU first.');
      if (!variantForm.childProductId) throw new Error('Select a child SKU.');
      if (variantForm.childProductId === selectedProduct.id) throw new Error('Child SKU cannot be the same as parent SKU.');
      await upsertPimVariant({
        parentProductId: selectedProduct.id,
        childProductId: variantForm.childProductId,
        variantAxis: variantForm.variantAxis,
        variantValue: variantForm.variantValue,
        displayOrder: Number(variantForm.displayOrder || 100),
      });
      await reloadPim();
      setVariantForm((current) => ({ ...current, childProductId: '', variantValue: '' }));
    });

  const handleSyncCategoryArchitecture = () =>
    runSave('Website category architecture', async () => {
      const result = await syncWebsiteCategoryArchitecture(catalog);
      toast.success(`Synced ${result.departments} departments, ${result.aisles} aisles, ${result.leafCategories} leaf categories`);
      await loadData();
    });

  const handleCreateSku = () =>
    runSave('SKU', async () => {
      if (!newSkuForm.categoryId) throw new Error('Select a leaf category first.');
      if (!newSkuForm.name.trim()) throw new Error('Product name is required.');
      if (!newSkuForm.model.trim()) throw new Error('Model# is required.');
      await syncWebsiteCategoryArchitecture(catalog);
      const saved = await upsertWebsiteCatalogProduct({
        categoryId: newSkuForm.categoryId,
        name: newSkuForm.name,
        model: newSkuForm.model,
        image: newSkuForm.image,
        price: Number(newSkuForm.price || 0),
        netWeight: 0,
        grossWeight: 0,
        unitsPerCarton: 1,
        cartonLength: 0,
        cartonWidth: 0,
        cartonHeight: 0,
        cartonNetWeight: 0,
        cartonGrossWeight: 0,
        specifications: {
          Unit: newSkuForm.unit,
          MOQ: newSkuForm.moq,
          'Quantity Step': newSkuForm.quantityStep,
          Stock: newSkuForm.stock,
          'Publish Status': newSkuForm.publishStatus,
          'Publish Type': newSkuForm.publishType,
          'Display Priority': '100',
        },
      });
      setSelectedProductId(saved.id);
      setActiveWorkspace('attributes');
      setNewSkuForm((current) => ({ ...current, name: '', model: '', image: '', price: '0', stock: '0' }));
      await loadData();
    });

  const editAttribute = (attribute: PimAttribute) => {
    setAttributeForm({
      id: attribute.id,
      templateId: attribute.template_id,
      attributeKey: attribute.attribute_key,
      label: attribute.label,
      dataType: attribute.data_type,
      unit: attribute.unit || '',
      optionsText: Array.isArray(attribute.options) ? attribute.options.join(', ') : '',
      displayGroup: attribute.display_group,
      displayOrder: String(attribute.display_order),
      isRequired: attribute.is_required,
      isFilterable: attribute.is_filterable,
      isSearchable: attribute.is_searchable,
      isCompliance: attribute.is_compliance,
    });
    setActiveWorkspace('template');
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-wide text-red-600">产品信息管理 · PIM</div>
            <h1 className="mt-1 text-xl font-black tracking-normal text-gray-950">PIM 管控中心</h1>
            <p className="mt-1 max-w-3xl text-sm font-medium text-gray-500">
              统一管理分类架构、SKU 就绪度、属性模板、媒体资产、搜索索引与变体治理。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleSyncCategoryArchitecture} disabled={saving || catalog.length === 0}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              同步分类
            </Button>
            <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>

        {loadNotices.length > 0 && (
          <div className="mt-4 grid gap-2">
            {loadNotices.map((notice) => (
              <div
                key={notice.message}
                className={`rounded-md border px-3 py-2 text-xs font-bold ${
                  notice.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : notice.type === 'warning'
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-blue-200 bg-blue-50 text-blue-800'
                }`}
              >
                {notice.message}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: '大类', value: categoryStats.departments, icon: Database },
            { label: '子类', value: categoryStats.aisles, icon: Tags },
            { label: '叶子分类', value: categoryStats.leafCategoryCount, icon: Filter },
            { label: 'SKU 总数', value: products.length, icon: Boxes },
            { label: '就绪率', value: `${readyRate}%`, icon: CheckCircle2 },
            { label: '模板覆盖率', value: `${templateCoverage}%`, icon: PackageSearch },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-black uppercase text-gray-500">{item.label}</div>
                  <Icon className="h-4 w-4 text-red-600" />
                </div>
                <div className="mt-1 text-2xl font-black text-gray-950">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader className="border-b border-gray-100 pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wide text-gray-800">分类导航</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b border-gray-100 p-3">
              <button
                type="button"
                onClick={() => setSelectedDepartmentId('all')}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm font-black ${
                  selectedDepartmentId === 'all' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700'
                }`}
                >
                  全部大类
                </button>
            </div>
            <div className="max-h-[680px] overflow-y-auto p-3">
              <div className="space-y-1">
                {catalog.map((department) => (
                  <button
                    key={department.id}
                    type="button"
                    onClick={() => setSelectedDepartmentId(department.id)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-bold ${
                      selectedDepartmentId === department.id ? 'bg-gray-950 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{department.name}</span>
                    <span className="text-xs opacity-70">{department.subCategories.length}</span>
                  </button>
                ))}
              </div>

              {activeDepartment && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="mb-2 text-xs font-black uppercase text-gray-500">
                    {selectedDepartmentId === 'all' ? '分类预览' : '子类与叶子分类'}
                  </div>
                  <div className="space-y-3">
                    {activeDepartment.subCategories.map((aisle) => (
                      <div key={aisle.id}>
                        <div className="text-xs font-black text-gray-700">{aisle.name}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {aisle.productCategories.slice(0, 8).map((leaf) => (
                            <button
                              key={leaf.id}
                              type="button"
                              onClick={() => setNewSkuForm((current) => ({ ...current, categoryId: leaf.id }))}
                              className={`rounded border px-2 py-1 text-[11px] font-bold ${
                                newSkuForm.categoryId === leaf.id ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'
                              }`}
                            >
                              {leaf.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-5">
          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm font-black uppercase tracking-wide text-gray-800">SKU 质量队列</CardTitle>
                <Badge variant="outline">{filteredProducts.length} 条</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="搜索 SKU、型号、产品名或分类路径"
                  className="pl-9"
                />
              </label>

              <div className="min-h-[300px] overflow-hidden rounded-md border border-gray-200">
                {loading ? (
                  <div className="flex h-[300px] items-center justify-center text-sm font-semibold text-gray-500">加载中…</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="flex h-[300px] flex-col items-center justify-center px-6 text-center">
                    <PackageSearch className="h-8 w-8 text-gray-300" />
                    <div className="mt-3 text-sm font-black text-gray-800">暂无 SKU</div>
                    <div className="mt-1 max-w-md text-xs font-medium text-gray-500">
                      可在下方创建官网 SKU，或在「官网发布」标签页发布产品。产品存在后，此处将成为质量管控队列。
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[560px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>就绪度</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>发布状态</TableHead>
                          <TableHead>缺失数据</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.slice(0, 120).map(({ product, quality }) => (
                          <TableRow
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            className={`cursor-pointer ${selectedProduct?.id === product.id ? 'bg-red-50' : ''}`}
                          >
                            <TableCell className="w-[100px]">
                              <div className={`text-sm font-black ${quality.score >= quality.threshold ? 'text-green-700' : 'text-red-600'}`}>
                                {quality.score}%
                              </div>
                              <Progress
                                value={quality.score}
                                className="mt-2 h-2 rounded-none bg-gray-100"
                                indicatorClassName={quality.score >= quality.threshold ? 'bg-green-600' : 'bg-red-600'}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-black text-gray-950">{product.name}</div>
                              <div className="text-xs font-semibold text-gray-500">型号 {product.model}</div>
                              <div className="mt-1 line-clamp-1 text-xs font-medium text-gray-500">
                                {pathMap.get(product.categoryId || '')?.path || '未映射'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant={getProductPublishStatus(product) === 'published' ? 'default' : 'outline'}>
                                  {getProductPublishStatus(product)}
                                </Badge>
                                <Badge variant="outline">{getProductPublishType(product)}</Badge>
                                {isWebsiteDealProduct(product) && <Badge className="bg-red-600">促销</Badge>}
                              </div>
                              <div className="mt-1 text-xs font-bold text-gray-600">
                                ${Number(product.price || 0).toFixed(2)} / {getProductUnit(product)}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              {quality.missing.length === 0 ? (
                                <span className="text-xs font-black text-green-700">已就绪</span>
                              ) : (
                                <span className="line-clamp-2 text-xs font-semibold text-red-600">{quality.missing.slice(0, 5).join(', ')}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-100 pb-3">
              <CardTitle className="text-sm font-black uppercase tracking-wide text-gray-800">创建官网 SKU</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">叶子分类</span>
                  <select
                    value={newSkuForm.categoryId}
                    onChange={(event) => setNewSkuForm((current) => ({ ...current, categoryId: event.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {leafCategories.map((leaf) => (
                      <option key={leaf.id} value={leaf.id}>
                        {leaf.path}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">产品名称</span>
                  <Input value={newSkuForm.name} onChange={(event) => setNewSkuForm((current) => ({ ...current, name: event.target.value }))} placeholder="面向客户的展示名称" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">型号 / SKU</span>
                  <Input value={newSkuForm.model} onChange={(event) => setNewSkuForm((current) => ({ ...current, model: event.target.value }))} placeholder="型号" />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">主图 URL</span>
                  <Input value={newSkuForm.image} onChange={(event) => setNewSkuForm((current) => ({ ...current, image: event.target.value }))} placeholder="https://..." />
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-6">
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">价格</span>
                  <Input type="number" value={newSkuForm.price} onChange={(event) => setNewSkuForm((current) => ({ ...current, price: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">单位</span>
                  <Input value={newSkuForm.unit} onChange={(event) => setNewSkuForm((current) => ({ ...current, unit: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">最小订量</span>
                  <Input type="number" value={newSkuForm.moq} onChange={(event) => setNewSkuForm((current) => ({ ...current, moq: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">步进</span>
                  <Input type="number" value={newSkuForm.quantityStep} onChange={(event) => setNewSkuForm((current) => ({ ...current, quantityStep: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">库存</span>
                  <Input type="number" value={newSkuForm.stock} onChange={(event) => setNewSkuForm((current) => ({ ...current, stock: event.target.value }))} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold text-gray-700">状态</span>
                  <select
                    value={newSkuForm.publishStatus}
                    onChange={(event) => setNewSkuForm((current) => ({ ...current, publishStatus: event.target.value }))}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">已发布</option>
                    <option value="hidden">已隐藏</option>
                  </select>
                </label>
              </div>
              <Button onClick={handleCreateSku} disabled={saving || !newSkuForm.categoryId}>
                <Plus className="mr-2 h-4 w-4" />
                创建 SKU
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="xl:col-span-4">
          <CardHeader className="border-b border-gray-100 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wide text-gray-800">SKU 详情</CardTitle>
                <div className="mt-2 text-sm font-black text-gray-950">{selectedProduct?.name || '未选中 SKU'}</div>
                <div className="mt-1 line-clamp-1 text-xs font-semibold text-gray-500">{selectedCategoryPath}</div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-black ${selectedQuality && selectedQuality.score >= selectedQuality.threshold ? 'text-green-700' : 'text-red-600'}`}>
                  {selectedQuality ? `${selectedQuality.score}%` : '--'}
                </div>
                <div className="text-[11px] font-black uppercase text-gray-500">就绪度</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveWorkspace(tab.id)}
                  className={`rounded-md border px-2 py-2 text-xs font-black ${
                    activeWorkspace === tab.id ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="max-h-[920px] overflow-y-auto p-4">
            {activeWorkspace === 'attributes' && (
              <div className="space-y-3">
                {selectedAttributes.length === 0 ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    请先在「属性模板」标签页为该分类创建属性字段，再编辑 SKU 属性值。
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {selectedAttributes.map((attribute) => (
                      <label key={attribute.id}>
                        <span className="mb-1 block text-xs font-bold text-gray-700">
                          {attribute.label}
                          {attribute.is_required && <span className="text-red-600"> *</span>}
                        </span>
                        <Input
                          value={attributeValues[attribute.id] || ''}
                          onChange={(event) => setAttributeValues((current) => ({ ...current, [attribute.id]: event.target.value }))}
                          placeholder={attribute.unit || attribute.data_type}
                        />
                      </label>
                    ))}
                  </div>
                )}
                <Button onClick={handleSaveAttributeValues} disabled={saving || selectedAttributes.length === 0 || !selectedProduct}>
                  <Save className="mr-2 h-4 w-4" />
                  保存属性值
                </Button>
              </div>
            )}

            {activeWorkspace === 'template' && (
              <div className="space-y-4">
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs font-semibold text-gray-600">{templateCategoryPath}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-gray-700">叶子分类</span>
                    <select
                      value={templateForm.categoryId}
                      onChange={(event) => setTemplateForm((current) => ({ ...current, categoryId: event.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {leafCategories.map((leaf) => (
                        <option key={leaf.id} value={leaf.id}>
                          {leaf.path}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">模板名称</span>
                    <Input value={templateForm.templateName} onChange={(event) => setTemplateForm((current) => ({ ...current, templateName: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">状态</span>
                    <select
                      value={templateForm.status}
                      onChange={(event) => setTemplateForm((current) => ({ ...current, status: event.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="draft">草稿</option>
                      <option value="active">启用</option>
                      <option value="archived">已归档</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">版本号</span>
                    <Input type="number" value={templateForm.versionNo} onChange={(event) => setTemplateForm((current) => ({ ...current, versionNo: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">就绪阈值 (%)</span>
                    <Input type="number" value={templateForm.threshold} onChange={(event) => setTemplateForm((current) => ({ ...current, threshold: event.target.value }))} />
                  </label>
                </div>
                <Button onClick={handleSaveTemplate} disabled={saving || !templateForm.categoryId}>
                  <Save className="mr-2 h-4 w-4" />
                  保存模板
                </Button>

                <div className="border-t border-gray-100 pt-4">
                  <div className="mb-2 text-xs font-black uppercase text-gray-500">属性字段</div>
                  <div className="space-y-2">
                    {editorAttributes.map((attribute) => (
                      <div key={attribute.id} className="flex items-center justify-between rounded-md border border-gray-200 p-2">
                        <button type="button" onClick={() => editAttribute(attribute)} className="text-left">
                          <div className="text-sm font-black text-gray-900">{attribute.label}</div>
                          <div className="text-xs font-semibold text-gray-500">{attribute.display_group} / {attribute.data_type}</div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            runSave('Delete attribute', async () => {
                              await deletePimAttribute(attribute.id);
                              await reloadPim();
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {editorAttributes.length === 0 && <div className="text-xs font-semibold text-gray-500">此分类暂无属性字段。</div>}
                  </div>
                </div>

                <div className="grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">字段键名</span>
                    <Input value={attributeForm.attributeKey} onChange={(event) => setAttributeForm((current) => ({ ...current, attributeKey: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">显示标签</span>
                    <Input value={attributeForm.label} onChange={(event) => setAttributeForm((current) => ({ ...current, label: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">数据类型</span>
                    <select
                      value={attributeForm.dataType}
                      onChange={(event) => setAttributeForm((current) => ({ ...current, dataType: event.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {['text', 'number', 'boolean', 'enum', 'multi_enum', 'dimension', 'file', 'image'].map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">单位</span>
                    <Input value={attributeForm.unit} onChange={(event) => setAttributeForm((current) => ({ ...current, unit: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">显示分组</span>
                    <Input value={attributeForm.displayGroup} onChange={(event) => setAttributeForm((current) => ({ ...current, displayGroup: event.target.value }))} />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs font-bold text-gray-700">排序</span>
                    <Input type="number" value={attributeForm.displayOrder} onChange={(event) => setAttributeForm((current) => ({ ...current, displayOrder: event.target.value }))} />
                  </label>
                  <label className="md:col-span-2">
                    <span className="mb-1 block text-xs font-bold text-gray-700">枚举选项（逗号分隔）</span>
                    <Input value={attributeForm.optionsText} onChange={(event) => setAttributeForm((current) => ({ ...current, optionsText: event.target.value }))} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
                  {[
                    ['isRequired', '必填'],
                    ['isFilterable', '前台筛选'],
                    ['isSearchable', '可搜索'],
                    ['isCompliance', '合规属性'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={Boolean(attributeForm[key as keyof typeof attributeForm])}
                        onChange={(event) => setAttributeForm((current) => ({ ...current, [key]: event.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Button onClick={handleSaveAttribute} disabled={saving || !attributeForm.label}>
                  <Plus className="mr-2 h-4 w-4" />
                  {attributeForm.id ? '更新字段' : '新增字段'}
                </Button>
              </div>
            )}

            {activeWorkspace === 'assets' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {selectedAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between rounded-md border border-gray-200 p-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-gray-900">{asset.title || asset.asset_url}</div>
                        <div className="text-xs font-semibold text-gray-500">{asset.asset_type} / {asset.quality_status}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          runSave('Delete asset', async () => {
                            await deletePimAsset(asset.id);
                            await reloadPim();
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedAssets.length === 0 && <div className="text-xs font-semibold text-gray-500">此 SKU 暂无媒体资产。</div>}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select
                    value={assetForm.assetType}
                    onChange={(event) => setAssetForm((current) => ({ ...current, assetType: event.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="main">主图</option>
                    <option value="gallery">展示图集</option>
                    <option value="lifestyle">生活场景图</option>
                    <option value="detail">细节图</option>
                    <option value="dimension">尺寸图</option>
                    <option value="packaging">包装图</option>
                    <option value="certificate">认证证书</option>
                    <option value="manual">说明书</option>
                    <option value="video">视频</option>
                  </select>
                  <select
                    value={assetForm.qualityStatus}
                    onChange={(event) => setAssetForm((current) => ({ ...current, qualityStatus: event.target.value }))}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="unchecked">待审核</option>
                    <option value="approved">已通过</option>
                    <option value="needs_review">需复审</option>
                    <option value="rejected">已驳回</option>
                  </select>
                </div>
                <Input value={assetForm.assetUrl} onChange={(event) => setAssetForm((current) => ({ ...current, assetUrl: event.target.value }))} placeholder="资产 URL" />
                <Input value={assetForm.title} onChange={(event) => setAssetForm((current) => ({ ...current, title: event.target.value }))} placeholder="标题" />
                <Input value={assetForm.altText} onChange={(event) => setAssetForm((current) => ({ ...current, altText: event.target.value }))} placeholder="替代文本" />
                <Button onClick={handleSaveAsset} disabled={saving || !selectedProduct}>
                  <Save className="mr-2 h-4 w-4" />
                  保存资产
                </Button>
              </div>
            )}

            {activeWorkspace === 'search' && (
              <div className="space-y-3">
                <Input value={searchForm.searchTitle} onChange={(event) => setSearchForm((current) => ({ ...current, searchTitle: event.target.value }))} placeholder="搜索标题" />
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={searchForm.brand} onChange={(event) => setSearchForm((current) => ({ ...current, brand: event.target.value }))} placeholder="品牌" />
                  <Input value={searchForm.modelNumber} onChange={(event) => setSearchForm((current) => ({ ...current, modelNumber: event.target.value }))} placeholder="型号" />
                </div>
                <Input value={searchForm.internetSku} onChange={(event) => setSearchForm((current) => ({ ...current, internetSku: event.target.value }))} placeholder="互联网 SKU 编码" />
                <textarea
                  value={searchForm.keywordsText}
                  onChange={(event) => setSearchForm((current) => ({ ...current, keywordsText: event.target.value }))}
                  placeholder="关键词（逗号分隔）"
                  className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button onClick={handleSaveSearchIndex} disabled={saving || !selectedProduct}>
                  <Save className="mr-2 h-4 w-4" />
                  保存搜索索引
                </Button>
              </div>
            )}

            {activeWorkspace === 'variants' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {selectedVariants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between rounded-md border border-gray-200 p-2">
                      <div className="text-sm font-semibold text-gray-700">
                        {variant.variant_axis}: <span className="font-black text-gray-950">{variant.variant_value}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          runSave('Delete variant', async () => {
                            await deletePimVariant(variant.id);
                            await reloadPim();
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {selectedVariants.length === 0 && <div className="text-xs font-semibold text-gray-500">此 SKU 暂无子变体。</div>}
                </div>
                <select
                  value={variantForm.childProductId}
                  onChange={(event) => setVariantForm((current) => ({ ...current, childProductId: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">选择子 SKU</option>
                  {products
                    .filter((product) => product.id !== selectedProduct?.id)
                    .slice(0, 300)
                    .map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.model} / {product.name}
                      </option>
                    ))}
                </select>
                <div className="grid grid-cols-[1fr_1fr_90px] gap-3">
                  <Input value={variantForm.variantAxis} onChange={(event) => setVariantForm((current) => ({ ...current, variantAxis: event.target.value }))} placeholder="变体维度（如颜色）" />
                  <Input value={variantForm.variantValue} onChange={(event) => setVariantForm((current) => ({ ...current, variantValue: event.target.value }))} placeholder="变体值（如红色）" />
                  <Input type="number" value={variantForm.displayOrder} onChange={(event) => setVariantForm((current) => ({ ...current, displayOrder: event.target.value }))} />
                </div>
                <Button onClick={handleSaveVariant} disabled={saving || !selectedProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  新增变体
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
