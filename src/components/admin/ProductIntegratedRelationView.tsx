import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Database, GitBranch, Link2, Search } from 'lucide-react';
import { nextInternalModelNo, productMasterService, productModelMappingService } from '../../lib/supabaseService';
import { fetchAllProducts } from '../../lib/services/productCatalogService';
import { useInquiry } from '../../contexts/InquiryContext';
import { useQuoteRequirements } from '../../contexts/QuoteRequirementContext';
import { useXJs } from '../../contexts/XJContext';
import { getCustomerFacingModelNo, getFactoryFacingModelNo, getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { toast } from 'sonner';

type ProductRecord = any;
type MappingRecord = any;
type RelationProduct = ProductRecord & {
  isMasterProduct?: boolean;
  sourceLabels?: string[];
};

type RelationRow = {
  product: RelationProduct;
  mappings: MappingRecord[];
  inquiries: any[];
  requirements: any[];
  xjs: any[];
};

const normalizeText = (value: unknown) => String(value || '').trim();
const normalizeKey = (value: unknown) => normalizeText(value).toLowerCase();

const collectProductIdentityKeys = (product: any) => {
  const snapshot = product?.inquirySnapshot || product?.inquirySnapshotDraft || null;
  const values = [
    product?.id,
    product?.productId,
    product?.sourceProductId,
    product?.masterProductId,
    product?.supplierProductId,
    product?.internalModelNo,
    product?.modelNo,
    product?.model,
    product?.sku,
    product?.factoryModelNo,
    product?.factorySku,
    product?.customerModelNo,
    product?.supplierModelNo,
    snapshot?.masterRef?.masterProductId,
    snapshot?.masterRef?.internalModelNo,
    snapshot?.masterRef?.factoryModelNo,
    snapshot?.factoryModelNo,
    snapshot?.supplierModelNo,
    snapshot?.customerModelNo,
    getFormalBusinessModelNo(product),
    getFactoryFacingModelNo(product),
    getCustomerFacingModelNo(product),
  ];

  return new Set(values.map(normalizeKey).filter(Boolean));
};

const productLineMatches = (line: any, identityKeys: Set<string>) => {
  if (identityKeys.size === 0) return false;
  const lineKeys = collectProductIdentityKeys(line);
  for (const key of lineKeys) {
    if (identityKeys.has(key)) return true;
  }
  return false;
};

const getProductSnapshot = (product: any) => product?.inquirySnapshot || product?.inquirySnapshotDraft || null;

const resolveInternalModelNo = (product: any) => {
  const snapshot = getProductSnapshot(product);
  return normalizeText(
    product?.internalModelNo ||
    snapshot?.masterRef?.internalModelNo ||
    getFormalBusinessModelNo(product) ||
    product?.model ||
    product?.modelNo ||
    product?.sku,
  );
};

const resolveFactoryModelNo = (product: any) => {
  const snapshot = getProductSnapshot(product);
  return normalizeText(
    product?.factoryModelNo ||
    product?.factorySku ||
    snapshot?.factoryModelNo ||
    snapshot?.masterRef?.factoryModelNo ||
    getFactoryFacingModelNo(product) ||
    product?.model ||
    product?.modelNo,
  );
};

const resolveCustomerModelNo = (product: any) => {
  const snapshot = getProductSnapshot(product);
  return normalizeText(
    product?.customerModelNo ||
    snapshot?.customerModelNo ||
    getCustomerFacingModelNo(product) ||
    product?.modelNo ||
    product?.model,
  );
};

const resolveProductName = (product: any) => normalizeText(
  product?.productName ||
  product?.name ||
  product?.title ||
  product?.description ||
  getProductSnapshot(product)?.productName,
);

const makeRelationProduct = (sourceLabel: string, product: any, fallbackId: string): RelationProduct => ({
  ...product,
  id: product?.id ? `${sourceLabel}:${product.id}` : fallbackId,
  sourceProductId: product?.sourceProductId || product?.productId || product?.id,
  productName: resolveProductName(product),
  internalModelNo: resolveInternalModelNo(product),
  factoryModelNo: resolveFactoryModelNo(product),
  customerModelNo: resolveCustomerModelNo(product),
  isMasterProduct: false,
  sourceLabels: [sourceLabel],
});

const makeMappingRelationProduct = (mapping: MappingRecord): RelationProduct => {
  const linkedProduct = mapping.confirmedProduct || mapping.product || mapping.suggestedProduct || null;
  const partyType = normalizeText(mapping.partyType || mapping.party_type);
  return {
    ...linkedProduct,
    id: mapping.productId || mapping.confirmedProductId || mapping.suggestedProductId || `mapping:${mapping.id}`,
    sourceProductId: mapping.productId || mapping.confirmedProductId || mapping.suggestedProductId || '',
    productName: resolveProductName(linkedProduct) || mapping.externalProductName || mapping.externalModelNo,
    internalModelNo: resolveInternalModelNo(linkedProduct),
    factoryModelNo: resolveFactoryModelNo(linkedProduct),
    customerModelNo: partyType === 'customer' || !partyType ? mapping.externalModelNo : '',
    supplierModelNo: partyType === 'supplier' ? mapping.externalModelNo : '',
    isMasterProduct: Boolean(mapping.productId || mapping.confirmedProductId || linkedProduct?.id),
    sourceLabels: ['型号映射'],
  };
};

const getPreferredRelationKey = (product: RelationProduct) => {
  const snapshot = getProductSnapshot(product);
  return normalizeKey(
    product.masterProductId ||
    snapshot?.masterRef?.masterProductId ||
    product.internalModelNo ||
    product.factoryModelNo ||
    product.customerModelNo ||
    product.sourceProductId ||
    product.productName ||
    product.id,
  );
};

const mergeRelationProduct = (current: RelationProduct, next: RelationProduct): RelationProduct => ({
  ...next,
  ...current,
  id: current.isMasterProduct ? current.id : next.id,
  sourceProductId: current.sourceProductId || next.sourceProductId,
  productName: current.productName || next.productName,
  internalModelNo: current.internalModelNo || next.internalModelNo,
  factoryModelNo: current.factoryModelNo || next.factoryModelNo,
  customerModelNo: current.customerModelNo || next.customerModelNo,
  isMasterProduct: Boolean(current.isMasterProduct || next.isMasterProduct),
  sourceLabels: Array.from(new Set([...(current.sourceLabels || []), ...(next.sourceLabels || [])])),
});

const buildDefaultConfirmForm = (product: RelationProduct) => ({
  internalModelNo: normalizeText(product.internalModelNo),
  factoryModelNo: normalizeText(product.factoryModelNo),
  customerModelNo: normalizeText(product.customerModelNo),
  productName: normalizeText(product.productName || product.description),
});

export default function ProductIntegratedRelationView() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [websiteProducts, setWebsiteProducts] = useState<ProductRecord[]>([]);
  const [mappings, setMappings] = useState<MappingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmingRow, setConfirmingRow] = useState<RelationRow | null>(null);
  const [confirmForm, setConfirmForm] = useState({
    internalModelNo: '',
    factoryModelNo: '',
    customerModelNo: '',
    productName: '',
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBulkConfirming, setIsBulkConfirming] = useState(false);
  const { getSubmittedInquiries } = useInquiry();
  const { requirements } = useQuoteRequirements();
  const { xjs } = useXJs();

  const inquiries = getSubmittedInquiries();

  const loadData = async () => {
    setLoading(true);
    try {
      const [productRows, mappingRows, websiteRows] = await Promise.all([
        productMasterService.getAll().catch(() => []),
        (productModelMappingService.getAllCompact
          ? productModelMappingService.getAllCompact()
          : productModelMappingService.getAll()
        ).catch(() => []),
        fetchAllProducts(null, { includeUnpublished: true }).catch(() => []),
      ]);
      setProducts(productRows);
      setMappings(mappingRows);
      setWebsiteProducts(websiteRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`加载产品关系视图失败: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const relationProducts = useMemo(() => {
    const candidates: RelationProduct[] = [
      ...products.map((product) => ({
        ...product,
        productName: resolveProductName(product),
        internalModelNo: resolveInternalModelNo(product),
        factoryModelNo: resolveFactoryModelNo(product),
        customerModelNo: resolveCustomerModelNo(product),
        isMasterProduct: true,
        sourceLabels: ['产品主档'],
      })),
      ...websiteProducts.map((product, index) => makeRelationProduct('前台展示', product, `website:${index}`)),
      ...mappings.map(makeMappingRelationProduct),
    ].filter((product) =>
      normalizeText(product.internalModelNo) ||
      normalizeText(product.factoryModelNo) ||
      normalizeText(product.customerModelNo) ||
      normalizeText(product.productName),
    );

    const byKey = new Map<string, RelationProduct>();
    const aliasToPreferredKey = new Map<string, string>();
    candidates.forEach((candidate) => {
      const candidateKeys = Array.from(collectProductIdentityKeys(candidate));
      const preferredKey = getPreferredRelationKey(candidate) || candidateKeys[0];
      if (!preferredKey) return;
      const existingKey = candidateKeys.map((key) => aliasToPreferredKey.get(key)).find(Boolean) || preferredKey;
      const existing = byKey.get(existingKey);
      const merged = existing ? mergeRelationProduct(existing, candidate) : candidate;
      byKey.set(existingKey, merged);
      Array.from(collectProductIdentityKeys(merged)).forEach((key) => {
        aliasToPreferredKey.set(key, existingKey);
      });
    });

    return Array.from(byKey.values());
  }, [mappings, products, websiteProducts]);

  const rows = useMemo(() => {
    return relationProducts.map((product) => {
      const identityKeys = collectProductIdentityKeys(product);
      identityKeys.add(normalizeKey(product.id));
      identityKeys.add(normalizeKey(product.sourceProductId));
      identityKeys.add(normalizeKey(product.internalModelNo));
      identityKeys.add(normalizeKey(product.factoryModelNo));
      identityKeys.add(normalizeKey(product.customerModelNo));

      const relatedMappings = mappings.filter((mapping) => {
        const mappingProductId = normalizeKey(mapping.productId || mapping.confirmedProductId || mapping.masterProductId);
        if (mappingProductId && (mappingProductId === normalizeKey(product.id) || identityKeys.has(mappingProductId))) return true;
        const externalKey = normalizeKey(mapping.externalModelNo);
        return Boolean(externalKey && identityKeys.has(externalKey));
      });

      const relatedInquiries = inquiries.filter((inquiry) =>
        (Array.isArray(inquiry.products) ? inquiry.products : []).some((item: any) => productLineMatches(item, identityKeys)),
      );

      const relatedRequirements = requirements.filter((requirement) =>
        (Array.isArray(requirement.items) ? requirement.items : []).some((item: any) => productLineMatches(item, identityKeys)),
      );

      const relatedXjs = xjs.filter((xj) => {
        const productLines = Array.isArray(xj.products) && xj.products.length > 0
          ? xj.products
          : [xj];
        return productLines.some((item: any) => productLineMatches(item, identityKeys));
      });

      return {
        product,
        mappings: relatedMappings,
        inquiries: relatedInquiries,
        requirements: relatedRequirements,
        xjs: relatedXjs,
      };
    });
  }, [inquiries, mappings, relationProducts, requirements, xjs]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter(({ product, mappings, inquiries, requirements, xjs: relatedXjs }) => {
      const haystack = [
        product.internalModelNo,
        product.factoryModelNo,
        product.productName,
        product.description,
        ...mappings.map((item) => item.externalModelNo),
        ...(product.sourceLabels || []),
        ...inquiries.map((item) => item.inquiryNumber || item.id),
        ...requirements.map((item) => item.requirementNo),
        ...relatedXjs.map((item) => item.xjNumber),
      ]
        .map((value) => normalizeText(value).toLowerCase())
        .join(' ');
      return haystack.includes(keyword);
    });
  }, [rows, search]);

  const summary = useMemo(() => {
    const linkedProducts = rows.filter((row) =>
      row.mappings.length > 0 ||
      row.inquiries.length > 0 ||
      row.requirements.length > 0 ||
      row.xjs.length > 0,
    ).length;
    const factoryReady = rows.filter((row) => normalizeText(row.product.factoryModelNo)).length;
    const pendingMasterProducts = rows.filter((row) => !row.product.isMasterProduct).length;
    const pendingMappings = mappings.filter((mapping) => mapping.mappingStatus === 'pending' || mapping.mappingStatus === 'suggested').length;
    return {
      totalProducts: rows.length,
      linkedProducts,
      factoryReady,
      pendingMappings: pendingMappings + pendingMasterProducts,
    };
  }, [mappings, rows]);

  const openConfirmDialog = (row: RelationRow) => {
    setConfirmingRow(row);
    setConfirmForm(buildDefaultConfirmForm(row.product));
  };

  const persistRelation = async (
    row: RelationRow,
    form: typeof confirmForm,
  ) => {
      const sourceProduct = row.product;
      const regionCode = normalizeText(sourceProduct.regionCode) || 'NA';
      const internalModelNo = normalizeText(form.internalModelNo) || await nextInternalModelNo(regionCode);
      const factoryModelNo = normalizeText(form.factoryModelNo) || internalModelNo;
      const customerModelNo = normalizeText(form.customerModelNo);
      const productName = normalizeText(form.productName) || sourceProduct.productName || sourceProduct.description || internalModelNo;

      const productMaster = await productMasterService.upsert({
        id: sourceProduct.isMasterProduct ? sourceProduct.id : undefined,
        internalModelNo,
        factoryModelNo,
        regionCode,
        productName,
        description: sourceProduct.description || '',
        imageUrl: sourceProduct.imageUrl || sourceProduct.image || '',
        status: 'active',
      });

      const externalCustomerModelNos = Array.from(new Set([
        customerModelNo,
        normalizeText(sourceProduct.model),
        normalizeText(sourceProduct.modelNo),
        normalizeText(sourceProduct.customerModelNo),
      ].filter(Boolean)));

      for (const externalModelNo of externalCustomerModelNos) {
        const mapping = await productModelMappingService.ensurePending({
          productId: productMaster.id,
          partyType: 'customer',
          partyId: 'front-catalog',
          externalModelNo,
          externalProductName: productName,
          externalSpecification: sourceProduct.description || '',
          externalImageUrl: sourceProduct.imageUrl || sourceProduct.image || '',
          createdFromDocType: 'product_integrated_relation',
          createdFromDocId: sourceProduct.sourceProductId || sourceProduct.id || null,
          remarks: `前台/客户型号 ${externalModelNo} 对应内部型号 ${internalModelNo}，工厂编号 ${factoryModelNo}`,
        });
        if (mapping?.id && mapping.mappingStatus !== 'confirmed') {
          await productModelMappingService.confirmMapping(mapping.id, productMaster.id, 'admin');
        }
      }

      for (const mapping of row.mappings) {
        if (mapping?.id && mapping.mappingStatus !== 'confirmed') {
          await productModelMappingService.confirmMapping(mapping.id, productMaster.id, 'admin');
        }
      }

      return { customerModelNo, internalModelNo, factoryModelNo };
  };

  const handleConfirmRelation = async () => {
    if (!confirmingRow || isConfirming) return;
    setIsConfirming(true);
    try {
      const { customerModelNo, internalModelNo, factoryModelNo } = await persistRelation(confirmingRow, confirmForm);
      toast.success(`已建立编号对应：客户型号 ${customerModelNo || '-'} → 内部型号 ${internalModelNo} → 工厂编号 ${factoryModelNo}`);
      setConfirmingRow(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`确认编号对应失败: ${message}`);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBulkConfirmRelations = async () => {
    if (isBulkConfirming || filteredRows.length === 0) return;
    setIsBulkConfirming(true);
    try {
      const targetRows = filteredRows.filter((row) => {
        const product = row.product;
        return !product.isMasterProduct || !normalizeText(product.factoryModelNo) || row.mappings.some((mapping) => mapping.mappingStatus !== 'confirmed');
      });
      let confirmedCount = 0;
      for (const row of targetRows) {
        await persistRelation(row, buildDefaultConfirmForm(row.product));
        confirmedCount += 1;
      }
      toast.success(`已批量固化 ${confirmedCount} 条产品编号对应关系。`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`批量固化编号关系失败: ${message}`);
    } finally {
      setIsBulkConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="mb-1 text-[18px] font-bold text-gray-900">产品一体化关系视图</h1>
        <p className="text-xs text-gray-500">
          以产品身份为中心，维护前台型号、客户型号、内部型号和工厂编号的一一对应；业务单据仅作为使用痕迹显示。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">产品身份关系</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.totalProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">被业务引用</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.linkedProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">有工厂编号</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.factoryReady}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">待确认对应</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-slate-900">{summary.pendingMappings}</CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative max-w-lg flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索内部型号、工厂编号、客户/前台型号..."
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              className="w-fit gap-2"
              onClick={handleBulkConfirmRelations}
              disabled={isBulkConfirming || filteredRows.length === 0}
            >
              <Link2 className="h-4 w-4" />
              {isBulkConfirming ? '固化中...' : '一键固化可识别对应'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="h-4 w-4" />
            产品对应明细（{filteredRows.length} 条）
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">加载中...</div>
          ) : filteredRows.length === 0 ? (
            <div className="py-12 text-center">
              <Database className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-slate-500">暂无可匹配的产品关系</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品来源/内部型号</TableHead>
                    <TableHead>工厂编号</TableHead>
                    <TableHead>客户/外部型号</TableHead>
                    <TableHead>ING 询价</TableHead>
                    <TableHead>QR 成本询报</TableHead>
                    <TableHead>XJ 工厂询价</TableHead>
                    <TableHead>状态/操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(({ product, mappings: relatedMappings, inquiries: relatedInquiries, requirements: relatedRequirements, xjs: relatedXjs }) => {
                    const hasFactoryNo = Boolean(normalizeText(product.factoryModelNo));
                    const hasBusinessFlow = relatedInquiries.length > 0 || relatedRequirements.length > 0 || relatedXjs.length > 0;
                    const externalModels = Array.from(new Set([
                      product.customerModelNo,
                      ...relatedMappings.map((mapping) => mapping.externalModelNo),
                    ].map(normalizeText).filter(Boolean)));
                    const row = {
                      product,
                      mappings: relatedMappings,
                      inquiries: relatedInquiries,
                      requirements: relatedRequirements,
                      xjs: relatedXjs,
                    };
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="min-w-[220px]">
                            <div className="font-medium text-slate-900">{product.internalModelNo || <span className="text-slate-400">待建主档</span>}</div>
                            <div className="mt-1 line-clamp-2 text-xs text-slate-500">{product.productName || product.description || '-'}</div>
                            {product.sourceLabels?.length ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {product.sourceLabels.slice(0, 3).map((label: string) => (
                                  <Badge key={label} variant="secondary" className="text-[10px]">
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {product.factoryModelNo || <span className="text-slate-400">待补充</span>}
                        </TableCell>
                        <TableCell>
                          {externalModels.length === 0 ? (
                            <span className="text-xs text-slate-400">暂无映射</span>
                          ) : (
                            <div className="flex max-w-[260px] flex-wrap gap-1.5">
                              {externalModels.slice(0, 4).map((externalModelNo) => (
                                <Badge key={externalModelNo} variant="outline" className="text-[10px]">
                                  {externalModelNo}
                                </Badge>
                              ))}
                              {externalModels.length > 4 ? <Badge variant="secondary">+{externalModels.length - 4}</Badge> : null}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedInquiries.slice(0, 3).map((inquiry) => (
                              <Badge key={inquiry.id} variant="outline" className="text-[10px]">
                                {inquiry.inquiryNumber || inquiry.id}
                              </Badge>
                            ))}
                            {relatedInquiries.length > 3 ? <Badge variant="secondary">+{relatedInquiries.length - 3}</Badge> : null}
                            {relatedInquiries.length === 0 ? <span className="text-xs text-slate-400">-</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedRequirements.slice(0, 3).map((requirement) => (
                              <Badge key={requirement.id} variant="outline" className="text-[10px]">
                                {requirement.requirementNo}
                              </Badge>
                            ))}
                            {relatedRequirements.length > 3 ? <Badge variant="secondary">+{relatedRequirements.length - 3}</Badge> : null}
                            {relatedRequirements.length === 0 ? <span className="text-xs text-slate-400">-</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedXjs.slice(0, 3).map((xj) => (
                              <Badge key={xj.id} variant="outline" className="text-[10px]">
                                {xj.xjNumber}
                              </Badge>
                            ))}
                            {relatedXjs.length > 3 ? <Badge variant="secondary">+{relatedXjs.length - 3}</Badge> : null}
                            {relatedXjs.length === 0 ? <span className="text-xs text-slate-400">-</span> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Badge variant={hasFactoryNo ? 'default' : 'outline'} className="w-fit">
                              {hasFactoryNo ? '工厂可执行' : '缺工厂编号'}
                            </Badge>
                            {!product.isMasterProduct ? (
                              <Badge variant="outline" className="w-fit">
                                待建主档
                              </Badge>
                            ) : null}
                            <Badge variant={hasBusinessFlow ? 'default' : 'outline'} className="w-fit">
                              {hasBusinessFlow ? '已进入链路' : '未进入链路'}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant={product.isMasterProduct && hasFactoryNo ? 'outline' : 'default'}
                              className="mt-1 h-7 w-fit gap-1.5 px-2 text-[11px]"
                              onClick={() => openConfirmDialog(row)}
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              {product.isMasterProduct ? '更新对应' : '建立对应'}
                            </Button>
                          </div>
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

      <Dialog open={Boolean(confirmingRow)} onOpenChange={(open) => !open && setConfirmingRow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>确认编号对应关系</DialogTitle>
            <DialogDescription>
              固化后，客户询价会保留客户可见型号，后台业务使用内部型号，生成工厂询价时自动使用工厂编号。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">客户/前台型号</label>
              <Input
                value={confirmForm.customerModelNo}
                onChange={(event) => setConfirmForm((prev) => ({ ...prev, customerModelNo: event.target.value }))}
                placeholder="客户看到的编号"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">内部型号</label>
              <Input
                value={confirmForm.internalModelNo}
                onChange={(event) => setConfirmForm((prev) => ({ ...prev, internalModelNo: event.target.value }))}
                placeholder="留空则自动生成"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">工厂编号</label>
              <Input
                value={confirmForm.factoryModelNo}
                onChange={(event) => setConfirmForm((prev) => ({ ...prev, factoryModelNo: event.target.value }))}
                placeholder="工厂实际执行编号"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">产品名称</label>
              <Input
                value={confirmForm.productName}
                onChange={(event) => setConfirmForm((prev) => ({ ...prev, productName: event.target.value }))}
                placeholder="产品名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmingRow(null)} disabled={isConfirming}>
              取消
            </Button>
            <Button type="button" onClick={handleConfirmRelation} disabled={isConfirming}>
              {isConfirming ? '保存中...' : '保存并确认映射'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
