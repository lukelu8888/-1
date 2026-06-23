import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { RefreshCw, Search } from 'lucide-react';
import { productMasterService, productModelMappingService } from '../../lib/supabaseService';
import { fetchAllProducts } from '../../lib/services/productCatalogService';
import { customerProductLibraryService, type CustomerProductRecord } from '../../lib/customerProductLibrary';

type MappingRecord = any;
type ProductRecord = any;
type WebsiteProductRecord = any;

type ModelMappingRow = {
  key: string;
  ourModelNo: string;
  productName: string;
  websiteModels: Set<string>;
  customerModels: Set<string>;
  supplierModels: Set<string>;
  factoryModelNo: string;
  sources: Set<string>;
  statuses: Set<string>;
  productId?: string | null;
};

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeKey = (value: unknown) => normalizeText(value).toLowerCase();
const MODEL_MAPPING_CACHE_KEY = 'cosun-model-mapping-center-cache-v1';
const SOURCE_LOAD_TIMEOUT_MS = 6000;

const addSetValue = (set: Set<string>, value: unknown) => {
  const text = normalizeText(value);
  if (text) set.add(text);
};

const createRow = (key: string, patch: Partial<ModelMappingRow> = {}): ModelMappingRow => ({
  key,
  ourModelNo: patch.ourModelNo || '',
  productName: patch.productName || '',
  websiteModels: patch.websiteModels || new Set<string>(),
  customerModels: patch.customerModels || new Set<string>(),
  supplierModels: patch.supplierModels || new Set<string>(),
  factoryModelNo: patch.factoryModelNo || '',
  sources: patch.sources || new Set<string>(),
  statuses: patch.statuses || new Set<string>(),
  productId: patch.productId || null,
});

const rowHasKeyword = (row: ModelMappingRow, keyword: string) => {
  if (!keyword) return true;
  const haystack = [
    row.ourModelNo,
    row.productName,
    row.factoryModelNo,
    ...row.websiteModels,
    ...row.customerModels,
    ...row.supplierModels,
    ...row.sources,
    ...row.statuses,
  ].join(' ').toLowerCase();
  return haystack.includes(keyword);
};

const renderModelSet = (values: Set<string>, emptyText = '-') => {
  const items = Array.from(values).filter(Boolean);
  if (items.length === 0) return <span className="text-xs text-slate-400">{emptyText}</span>;
  return (
    <div className="flex max-w-[280px] flex-wrap gap-1.5">
      {items.slice(0, 5).map((value) => (
        <Badge key={value} variant="outline" className="text-[10px]">
          {value}
        </Badge>
      ))}
      {items.length > 5 ? <Badge variant="secondary" className="text-[10px]">+{items.length - 5}</Badge> : null}
    </div>
  );
};

const readMappingCache = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MODEL_MAPPING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeMappingCache = (cache: {
  products?: ProductRecord[];
  websiteProducts?: WebsiteProductRecord[];
  mappings?: MappingRecord[];
}) => {
  if (typeof window === 'undefined') return;
  try {
    const existing = readMappingCache() || {};
    window.localStorage.setItem(MODEL_MAPPING_CACHE_KEY, JSON.stringify({
      ...existing,
      ...cache,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // Cache is a convenience only.
  }
};

const safeLoadSource = async <T,>(
  label: string,
  loader: () => Promise<T[]>,
  cachedRows: T[] = [],
) => {
  try {
    const rows = await Promise.race([
      loader(),
      new Promise<T[]>((_, reject) => {
        window.setTimeout(() => reject(new Error(`${label}读取超时`)), SOURCE_LOAD_TIMEOUT_MS);
      }),
    ]);
    return { rows: Array.isArray(rows) ? rows : [], warning: '' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error || 'Load failed');
    return {
      rows: cachedRows,
      warning: `${label} 暂时无法读取，已使用本地缓存或空数据。${message}`,
    };
  }
};

export default function ModelMappingCenter() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'supplier' | 'pending'>('all');
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [websiteProducts, setWebsiteProducts] = useState<WebsiteProductRecord[]>([]);
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [customerProducts, setCustomerProducts] = useState<CustomerProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceWarnings, setSourceWarnings] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cache = readMappingCache() || {};
      const [productResult, websiteResult, mappingResult] = await Promise.all([
        safeLoadSource<ProductRecord>('产品主档', () => productMasterService.getAll(), cache.products || []),
        safeLoadSource<WebsiteProductRecord>('网站产品', () => fetchAllProducts(null, { includeUnpublished: true }), cache.websiteProducts || []),
        safeLoadSource<MappingRecord>(
          '型号映射表',
          () => productModelMappingService.getAllCompact
            ? productModelMappingService.getAllCompact()
            : productModelMappingService.getAll(),
          cache.mappings || [],
        ),
      ]);

      setProducts(productResult.rows);
      setWebsiteProducts(websiteResult.rows);
      setMappings(mappingResult.rows);
      setCustomerProducts(customerProductLibraryService.getAll());
      setSourceWarnings([productResult.warning, websiteResult.warning, mappingResult.warning].filter(Boolean));
      writeMappingCache({
        products: productResult.warning ? cache.products || [] : productResult.rows,
        websiteProducts: websiteResult.warning ? cache.websiteProducts || [] : websiteResult.rows,
        mappings: mappingResult.warning ? cache.mappings || [] : mappingResult.rows,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || 'Load failed');
      setProducts([]);
      setWebsiteProducts([]);
      setMappings([]);
      setCustomerProducts(customerProductLibraryService.getAll());
      setSourceWarnings([`型号映射中心加载异常，已切换为空数据。${message}`]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const handleCustomerProductChange = () => setCustomerProducts(customerProductLibraryService.getAll());
    window.addEventListener(customerProductLibraryService.changeEvent, handleCustomerProductChange as EventListener);
    return () => window.removeEventListener(customerProductLibraryService.changeEvent, handleCustomerProductChange as EventListener);
  }, []);

  const rows = useMemo(() => {
    const byKey = new Map<string, ModelMappingRow>();
    const productIdToKey = new Map<string, string>();
    const modelToKey = new Map<string, string>();

    const getOrCreateByModel = (modelNo: unknown, fallbackKey?: string) => {
      const model = normalizeText(modelNo);
      const key = model ? normalizeKey(model) : normalizeKey(fallbackKey);
      if (!key) return null;
      if (!byKey.has(key)) byKey.set(key, createRow(key, { ourModelNo: model }));
      const row = byKey.get(key)!;
      if (model && !row.ourModelNo) row.ourModelNo = model;
      if (model) modelToKey.set(normalizeKey(model), key);
      return row;
    };

    products.forEach((product) => {
      const row = getOrCreateByModel(product.internalModelNo || product.modelNo || product.factoryModelNo, product.id);
      if (!row) return;
      row.productId = product.id || row.productId;
      row.productName = row.productName || normalizeText(product.productName || product.description);
      row.factoryModelNo = row.factoryModelNo || normalizeText(product.factoryModelNo || product.factorySku || product.internalModelNo);
      addSetValue(row.supplierModels, product.factoryModelNo || product.factorySku);
      row.sources.add('产品主档');
      row.statuses.add('已建主档');
      if (product.id) productIdToKey.set(normalizeKey(product.id), row.key);
    });

    websiteProducts.forEach((product) => {
      const ourModelNo = normalizeText(product.model || product.modelNo || product.internalModelNo);
      const row = getOrCreateByModel(ourModelNo, product.id);
      if (!row) return;
      row.productName = row.productName || normalizeText(product.name || product.productName || product.description);
      addSetValue(row.websiteModels, ourModelNo);
      row.sources.add('网站展示');
      row.statuses.add('网站我方型号');
      if (product.id) productIdToKey.set(normalizeKey(product.id), row.key);
    });

    customerProducts.forEach((record) => {
      const ourModelNo = normalizeText(
        record.masterRef?.internalModelNo ||
        record.supplierModelNo ||
        record.supplierProductId,
      );
      const row = getOrCreateByModel(ourModelNo || record.customerModelNo, record.id);
      if (!row) return;
      row.productName = row.productName || normalizeText(record.productName || record.description);
      addSetValue(row.customerModels, record.customerModelNo);
      if (ourModelNo) addSetValue(row.websiteModels, ourModelNo);
      row.sources.add('My Products');
      row.statuses.add(record.mappingStatus === 'confirmed' ? '客户型号已确认' : '客户型号待确认');
      if (record.supplierProductId) productIdToKey.set(normalizeKey(record.supplierProductId), row.key);
    });

    mappings.forEach((mapping) => {
      const productKey =
        productIdToKey.get(normalizeKey(mapping.productId || mapping.confirmedProductId || mapping.suggestedProductId)) ||
        modelToKey.get(normalizeKey(mapping.product?.internalModelNo || mapping.confirmedProduct?.internalModelNo || mapping.suggestedProduct?.internalModelNo));
      const linkedProduct = mapping.product || mapping.confirmedProduct || mapping.suggestedProduct || null;
      const row = productKey
        ? byKey.get(productKey)
        : getOrCreateByModel(linkedProduct?.internalModelNo || mapping.externalModelNo, mapping.id);
      if (!row) return;

      row.productId = row.productId || mapping.productId || mapping.confirmedProductId || mapping.suggestedProductId || linkedProduct?.id || null;
      row.productName = row.productName || normalizeText(linkedProduct?.productName || mapping.externalProductName);
      row.factoryModelNo = row.factoryModelNo || normalizeText(linkedProduct?.factoryModelNo);
      if (linkedProduct?.internalModelNo && !row.ourModelNo) row.ourModelNo = linkedProduct.internalModelNo;
      if (mapping.partyType === 'supplier') {
        addSetValue(row.supplierModels, mapping.externalModelNo);
      } else {
        addSetValue(row.customerModels, mapping.externalModelNo);
      }
      row.sources.add('型号映射表');
      row.statuses.add(mapping.mappingStatus === 'confirmed' ? '映射已确认' : '映射待确认');
    });

    return Array.from(byKey.values())
      .filter((row) => row.ourModelNo || row.customerModels.size > 0 || row.supplierModels.size > 0)
      .sort((a, b) => normalizeText(a.ourModelNo || a.productName).localeCompare(normalizeText(b.ourModelNo || b.productName)));
  }, [customerProducts, mappings, products, websiteProducts]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (activeFilter === 'customer' && row.customerModels.size === 0) return false;
      if (activeFilter === 'supplier' && row.supplierModels.size === 0 && !row.factoryModelNo) return false;
      if (activeFilter === 'pending' && !Array.from(row.statuses).some((status) => status.includes('待确认'))) return false;
      return rowHasKeyword(row, keyword);
    });
  }, [activeFilter, rows, search]);

  const summary = useMemo(() => ({
    total: rows.length,
    website: rows.filter((row) => row.websiteModels.size > 0).length,
    customer: rows.filter((row) => row.customerModels.size > 0).length,
    supplier: rows.filter((row) => row.supplierModels.size > 0 || row.factoryModelNo).length,
    pending: rows.filter((row) => Array.from(row.statuses).some((status) => status.includes('待确认'))).length,
  }), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="mb-1 text-[18px] font-bold text-gray-900">型号映射中心</h2>
          <p className="text-xs text-gray-500">
            网站展示使用我方型号；客户从 My Products 带入的是客户型号；采购和工厂询价使用供应侧/工厂型号。
          </p>
        </div>
        <Button variant="outline" className="w-fit gap-2" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">我方型号</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">网站展示</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.website}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">有客户型号</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.customer}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">有供应侧型号</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.supplier}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500">待确认</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.pending}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {sourceWarnings.length > 0 ? (
            <div className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <div className="font-semibold">部分远端数据暂时不可读</div>
              <div className="mt-1 space-y-1">
                {sourceWarnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-lg flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索我方型号、客户型号、供应侧型号或产品名"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ['all', '全部'],
                ['customer', '客户型号'],
                ['supplier', '供应侧型号'],
                ['pending', '待确认'],
              ].map(([key, label]) => (
                <Button
                  key={key}
                  variant={activeFilter === key ? 'default' : 'outline'}
                  onClick={() => setActiveFilter(key as typeof activeFilter)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">型号一一对应表（{filteredRows.length} 条）</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">加载中...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">暂无可显示的型号对应关系</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>我方型号/网站型号</TableHead>
                  <TableHead>产品名称</TableHead>
                  <TableHead>客户型号</TableHead>
                  <TableHead>供应侧/工厂型号</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <div className="min-w-[180px]">
                        <div className="font-semibold text-slate-900">{row.ourModelNo || <span className="text-slate-400">待分配我方型号</span>}</div>
                        <div className="mt-1">{renderModelSet(row.websiteModels, '网站未发布')}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] whitespace-normal text-sm text-slate-700">
                      {row.productName || '-'}
                    </TableCell>
                    <TableCell>{renderModelSet(row.customerModels, '无客户型号')}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {row.factoryModelNo ? <div className="text-sm font-medium text-slate-900">{row.factoryModelNo}</div> : null}
                        {renderModelSet(row.supplierModels, row.factoryModelNo ? '' : '无供应侧型号')}
                      </div>
                    </TableCell>
                    <TableCell>{renderModelSet(row.sources)}</TableCell>
                    <TableCell>{renderModelSet(row.statuses)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
