import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Package, Search, RefreshCcw, Link2 } from 'lucide-react';
import { productMasterService, productModelMappingService } from '../../lib/supabaseService';
import { toast } from 'sonner';

type ProductRecord = any;
type MappingRecord = any;

export default function InternalProductCatalog() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.error(`Failed to load internal products: ${message}`);
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
      [product.internalModelNo, product.productName, product.description]
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1 text-[18px] font-bold">内部产品目录</h1>
          <p className="text-gray-500 text-xs">
            这里展示已经进入我方产品系统的内部产品编号，并关联客户提交的客户型号。
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadData()}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Internal Products</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Mapped to Customer Refs</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.mappedProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Pending Mappings</CardTitle>
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
              placeholder="Search internal model#, product name, or description"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Product Master
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading internal products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No internal products found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Internal Model#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer Refs</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const relatedMappings = mappingByProductId.get(product.id) || [];
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium text-slate-900">{product.internalModelNo}</TableCell>
                        <TableCell>
                          <div className="min-w-[220px]">
                            <div className="font-medium text-slate-900">{product.productName || '-'}</div>
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                              {product.description || 'No description'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {relatedMappings.length === 0 ? (
                            <span className="text-slate-400">No customer refs yet</span>
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
                            {relatedMappings.some((item) => item.mappingStatus === 'pending') ? 'Pending Mapping' : 'Active'}
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
