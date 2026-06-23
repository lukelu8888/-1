import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Package, Search, RefreshCcw, Link2, Plus, X } from 'lucide-react';
import { productMasterService, productModelMappingService } from '../../lib/supabaseService';
import { toast } from 'sonner';
import ProductCreationWizard from './ProductCreationWizard';

type ProductRecord = any;
type MappingRecord = any;

export default function InternalProductCatalog() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productRows, mappingRows] = await Promise.all([
        productMasterService.getAll(),
        productModelMappingService.getAll('customer'),
      ]);
      setProducts(productRows);
      setMappings(mappingRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`加载内部产品失败: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const mappingByProductId = useMemo(() => {
    const grouped = new Map<string, MappingRecord[]>();
    for (const mapping of mappings) {
      const productId = String(mapping.productId || mapping.confirmedProductId || '').trim();
      if (!productId) continue;
      const next = grouped.get(productId) || [];
      next.push(mapping);
      grouped.set(productId, next);
    }
    return grouped;
  }, [mappings]);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((product) =>
      [product.internalModelNo, product.factoryModelNo, product.productName, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [products, searchTerm]);

  const summary = useMemo(() => {
    const mappedProductIds = new Set(
      mappings
        .map((item) => String(item.productId || item.confirmedProductId || '').trim())
        .filter(Boolean),
    );
    return {
      totalProducts: products.length,
      mappedProducts: mappedProductIds.size,
      pendingMappings: mappings.filter((item) => item.mappingStatus === 'pending').length,
    };
  }, [mappings, products]);

  // Wizard overlay
  if (showWizard) {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">新建内部产品</h2>
            <p className="text-xs text-gray-500">按照8步向导完成产品信息录入</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => { setShowWizard(false); void loadData(); }}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            退出向导
          </Button>
        </div>
        <ProductCreationWizard
          onComplete={() => {
            setShowWizard(false);
            void loadData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1 text-[18px] font-bold">内部产品目录</h1>
          <p className="text-gray-500 text-xs">
            内部产品主数据库，展示已录入系统的产品编号，并关联客户提交的客户型号。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => void loadData()}>
            <RefreshCcw className="mr-1.5 h-4 w-4" />
            刷新
          </Button>
          <Button
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            新建产品
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">内部产品总数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">已关联客户型号</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.mappedProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">待确认映射</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.pendingMappings}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索内部型号、工厂编号、产品名称或描述..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            产品主数据（{filteredProducts.length} 条）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">加载中...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-slate-500">暂无内部产品数据</p>
              <p className="text-xs text-slate-400 mt-1">点击右上角「新建产品」按照向导录入产品信息</p>
              <Button
                size="sm"
                className="mt-3 h-8 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowWizard(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />新建首个产品
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>内部型号</TableHead>
                    <TableHead>工厂编号</TableHead>
                    <TableHead>产品名称</TableHead>
                    <TableHead>关联客户型号</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const relatedMappings = mappingByProductId.get(product.id) || [];
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-slate-900">{product.internalModelNo}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{product.factoryModelNo || product.internalModelNo || '-'}</div>
                          <div className="mt-1 text-xs text-slate-400">询价自动带入</div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[220px]">
                            <div className="font-medium text-slate-900">{product.productName || '-'}</div>
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {product.description || '暂无描述'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {relatedMappings.length === 0 ? (
                            <span className="text-slate-400 text-xs">暂无客户型号</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {relatedMappings.slice(0, 3).map((mapping) => (
                                <div
                                  key={mapping.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700"
                                >
                                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{mapping.externalModelNo}</span>
                                </div>
                              ))}
                              {relatedMappings.length > 3 ? (
                                <Badge variant="outline">+{relatedMappings.length - 3}</Badge>
                              ) : null}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={relatedMappings.some((item) => item.mappingStatus === 'pending') ? 'outline' : 'default'}>
                            {relatedMappings.some((item) => item.mappingStatus === 'pending') ? '待映射确认' : '正常'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
