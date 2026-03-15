import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Search, Package, Paperclip, Link2, Plus } from 'lucide-react';
import { customerProductLibraryService } from '../../lib/customerProductLibrary';
import { useOrders } from '../../contexts/OrderContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { customerAssetAdapter } from '../../lib/adapters/customerAssetAdapter';
import {
  buildProductLibraryAssets,
  resolveProductLibraryCustomerEmail,
  type ProductLibraryAsset,
} from '../../lib/productLibraryPortfolio';
import { isSupabaseStorageBridgeReady } from '../../lib/supabaseStorageBridge';
import { resolveCustomerBusinessMode } from '../../lib/customerBusinessMode';
import { normalizeOemData } from '../../types/oem';
import { toast } from 'sonner';
import { CreateProductFlow } from './product-library/CreateProductFlow';
import type { CreateProductCompletion } from './product-library/createProductFlowTypes';

interface MyProductsSelectorProps {
  onAddProduct: (product: any) => void;
  addedProductIds: Set<string>;
}

const syncBadgeClass: Record<string, string> = {
  synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

const formatSelectorProductType = (asset: ProductLibraryAsset) => {
  if (asset.manualRecord?.serviceType === 'qc_service') return 'QC Service';
  if (asset.manualRecord?.serviceType === 'general_service') return 'General Service';
  if (asset.isProjectBased) return 'Project';
  if (asset.itemType === 'oem_custom') return 'OEM / Custom';
  return 'Standard';
};

const buildInquiryProductFromLibrary = (
  asset: ProductLibraryAsset,
  options?: {
    selectedPackageVersion?: {
      version: number;
      oem?: ProductLibraryAsset['manualRecord'] extends infer R ? any : never;
    } | null;
    selectedProjectRevision?: {
      revisionId: string;
      revisionCode: string;
      revisionStatus: string;
      oem?: ProductLibraryAsset['manualRecord'] extends infer R ? any : never;
    } | null;
  },
) => {
  const record = asset.manualRecord;
  const selectedPackageVersion = options?.selectedPackageVersion || null;
  const selectedProjectRevision = options?.selectedProjectRevision || null;
  const resolvedOem = asset.isProjectBased
    ? (selectedProjectRevision?.oem || record?.oem)
    : (selectedPackageVersion?.oem || record?.oem);
  const normalizedOem = normalizeOemData(resolvedOem);
  const sourceProductId = record?.sourceProductId || asset.supplierProductId || asset.matchKey;
  const customerProductId = record?.id || null;
  const inquirySnapshotDraft = customerAssetAdapter.toInquirySnapshotDraft(asset, {
    selectedPackageVersion,
    selectedProjectRevision,
    quantity: record?.lastQuantity && record.lastQuantity > 0 ? record.lastQuantity : 1,
    currency: 'USD',
  });
  return {
    id: `my-product-${asset.id}`,
    customerProductId,
    sourceProductId,
    supplierProductId: record?.supplierProductId || asset.supplierProductId || null,
    productName: asset.productName,
    customerModelNo: asset.customerModelNo || '',
    supplierModelNo: asset.supplierModelNo || '',
    modelNo: asset.supplierModelNo || asset.customerModelNo || '',
    internalModelNo: asset.supplierModelNo || '',
    quantity: record?.lastQuantity && record.lastQuantity > 0 ? record.lastQuantity : 1,
    unit: asset.unit || 'pcs',
    targetPrice: record?.targetPrice || asset.quoteStats.lastPrice || asset.orderStats.lastPrice || 0,
    specification: asset.description || '',
    specifications: asset.description || '',
    image: asset.imageUrl || '',
    imageUrl: asset.imageUrl || '',
    source: 'my_products' as const,
    addedFrom: 'My Products' as const,
    sourceType: asset.assetSourceType,
    itemType: asset.itemType,
    oem: normalizedOem.enabled ? resolvedOem : undefined,
    syncStatus: asset.syncStatus === 'pending' ? 'pending' : 'synced',
    syncMessage: asset.syncMessage || '',
    attachmentCount: asset.attachmentCount || 0,
    attachmentSummarySnapshot: inquirySnapshotDraft.attachmentSummarySnapshot,
    fileManifestSnapshot: inquirySnapshotDraft.fileManifestSnapshot,
    lastInquiryNumber: asset.lastInquiryNumber || null,
    recordType: asset.recordType,
    isProjectBased: asset.isProjectBased,
    serviceType: asset.manualRecord?.serviceType || null,
    serviceCategory: asset.manualRecord?.serviceCategory || '',
    serviceScopeSummary: asset.manualRecord?.serviceScopeSummary || '',
    serviceDeliverables: asset.manualRecord?.serviceDeliverables || '',
    inspectionType: asset.manualRecord?.inspectionType || '',
    inspectionStandard: asset.manualRecord?.inspectionStandard || '',
    deliveryMethod: asset.manualRecord?.deliveryMethod || '',
    masterRef: inquirySnapshotDraft.masterRef,
    mappingRef: inquirySnapshotDraft.mappingRef,
    inquirySnapshotDraft,
    projectId: asset.isProjectBased ? customerProductId || asset.id : null,
    projectCode: asset.projectCode || '',
    projectName: asset.projectName || asset.productName,
    projectRevisionId: selectedProjectRevision?.revisionId || asset.currentRevisionId || null,
    projectRevisionCode: selectedProjectRevision?.revisionCode || asset.currentRevisionCode || '',
    productPackageSnapshot: {
      id: customerProductId || asset.id,
      sourceProductId,
      productName: asset.productName,
      description: asset.description,
      itemType: asset.itemType,
      customerModelNo: asset.customerModelNo,
      supplierModelNo: asset.supplierModelNo,
      supplierProductId: asset.supplierProductId || null,
      imageUrl: asset.imageUrl,
      unit: asset.unit,
      targetPrice: record?.targetPrice || asset.quoteStats.lastPrice || asset.orderStats.lastPrice || 0,
      attachmentCount:
        asset.isProjectBased
          ? normalizeOemData(selectedProjectRevision?.oem || record?.oem).files.length
          : normalizeOemData(selectedPackageVersion?.oem || record?.oem).files.length,
      oem: resolvedOem || null,
      sourceType: asset.assetSourceType,
      productStatus: asset.productStatus,
      packageVersion: selectedPackageVersion?.version || asset.packageVersion,
      packageStatus: asset.packageStatus,
      sourceTags: asset.sourceTags,
      quoteStats: asset.quoteStats,
      orderStats: asset.orderStats,
      updatedAt: asset.updatedAt,
      attachmentSummarySnapshot: inquirySnapshotDraft.attachmentSummarySnapshot,
      fileManifestSnapshot: inquirySnapshotDraft.fileManifestSnapshot,
      serviceType: asset.manualRecord?.serviceType || null,
      serviceCategory: asset.manualRecord?.serviceCategory || '',
      serviceScopeSummary: asset.manualRecord?.serviceScopeSummary || '',
      serviceDeliverables: asset.manualRecord?.serviceDeliverables || '',
    },
    projectRevisionSnapshot: asset.isProjectBased
      ? {
          projectId: customerProductId || asset.id,
          projectCode: asset.projectCode || '',
          projectName: asset.projectName || asset.productName,
          revisionId: selectedProjectRevision?.revisionId || asset.currentRevisionId || null,
          revisionCode: selectedProjectRevision?.revisionCode || asset.currentRevisionCode || '',
          revisionStatus: selectedProjectRevision?.revisionStatus || asset.currentRevisionStatus || 'working',
          finalRevisionId: asset.finalRevisionId || null,
          finalRevisionCode: asset.finalRevisionCode || '',
          snapshotAt: asset.updatedAt,
          attachmentCount: normalizeOemData(selectedProjectRevision?.oem || record?.oem).files.length,
          description: asset.description,
        }
      : null,
  };
};

export function MyProductsSelector({ onAddProduct, addedProductIds }: MyProductsSelectorProps) {
  const { orders } = useOrders();
  const { quotations } = useSalesQuotations();
  const [records, setRecords] = useState(customerProductLibraryService.getAll());
  const [isBridgeReady, setIsBridgeReady] = useState(() => isSupabaseStorageBridgeReady());
  const [searchTerm, setSearchTerm] = useState('');
  const [itemFilter, setItemFilter] = useState<'all' | 'standard' | 'oem' | 'project'>('all');
  const [selectedProjectRevisionIds, setSelectedProjectRevisionIds] = useState<Record<string, string>>({});
  const [currentUserEmail, setCurrentUserEmail] = useState(() => resolveProductLibraryCustomerEmail());
  const [businessMode, setBusinessMode] = useState(() => resolveCustomerBusinessMode());
  const [isCreateFlowOpen, setIsCreateFlowOpen] = useState(false);

  useEffect(() => {
    const load = () => {
      setRecords(customerProductLibraryService.getAll());
    };

    const handleBridgeSync = () => {
      setIsBridgeReady(true);
      load();
    };

    load();
    window.addEventListener(customerProductLibraryService.changeEvent, load as EventListener);
    window.addEventListener('supabase-storage-bridge-synced', handleBridgeSync as EventListener);
    return () => {
      window.removeEventListener(customerProductLibraryService.changeEvent, load as EventListener);
      window.removeEventListener('supabase-storage-bridge-synced', handleBridgeSync as EventListener);
    };
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      setCurrentUserEmail(resolveProductLibraryCustomerEmail());
      setBusinessMode(resolveCustomerBusinessMode());
    };

    syncIdentity();
    window.addEventListener('userChanged', syncIdentity);
    window.addEventListener('supabaseAuthChanged', syncIdentity as EventListener);
    window.addEventListener('storage', syncIdentity);

    return () => {
      window.removeEventListener('userChanged', syncIdentity);
      window.removeEventListener('supabaseAuthChanged', syncIdentity as EventListener);
      window.removeEventListener('storage', syncIdentity);
    };
  }, []);

  const products = useMemo(() => {
    if (!isBridgeReady || !currentUserEmail) return [];
    return buildProductLibraryAssets({
      libraryRecords: records,
      quotations,
      orders,
      customerEmail: currentUserEmail,
    });
  }, [currentUserEmail, isBridgeReady, orders, quotations, records]);

  const filteredRecords = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((record) => {
      if (!businessMode.projectRevisionEnabled && record.isProjectBased) {
        return false;
      }
      const matchesKeyword =
        !keyword ||
        [
          record.productName,
          record.customerModelNo,
          record.supplierModelNo,
          record.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      const matchesType =
        itemFilter === 'all' ||
        (itemFilter === 'project' && businessMode.projectRevisionEnabled && record.isProjectBased) ||
        (itemFilter === 'oem' && record.itemType === 'oem_custom') ||
        (itemFilter === 'standard' && record.itemType !== 'oem_custom');

      const hasSelectableIdentity =
        Boolean(record.manualRecord) || Boolean(record.productName) || Boolean(record.customerModelNo) || Boolean(record.supplierModelNo);

      return matchesKeyword && matchesType && hasSelectableIdentity;
    });
  }, [businessMode.projectRevisionEnabled, itemFilter, products, searchTerm]);

  const resolvePackageVersion = (asset: ProductLibraryAsset) => {
    const packageVersions = Array.isArray(asset.manualRecord?.packageVersions) ? asset.manualRecord.packageVersions : [];
    if (packageVersions.length === 0) return null;
    return (
      packageVersions.find((pkg) => pkg.version === asset.packageVersion) ||
      packageVersions[0]
    );
  };

  const resolveProjectRevision = (asset: ProductLibraryAsset) => {
    const projectRevisions = Array.isArray(asset.manualRecord?.projectRevisions) ? asset.manualRecord.projectRevisions : [];
    if (projectRevisions.length === 0) return null;
    const selectedRevisionId = selectedProjectRevisionIds[asset.id];
    return (
      projectRevisions.find((revision) => revision.revisionId === selectedRevisionId) ||
      projectRevisions.find((revision) => revision.revisionId === asset.finalRevisionId) ||
      projectRevisions.find((revision) => revision.revisionId === asset.currentRevisionId) ||
      projectRevisions[0]
    );
  };

  const buildAssetFromRecord = (recordId: string) => {
    const nextRecords = customerProductLibraryService.getAll();
    const nextAssets = buildProductLibraryAssets({
      libraryRecords: nextRecords,
      quotations,
      orders,
      customerEmail: currentUserEmail,
    });
    return {
      nextRecords,
      asset: nextAssets.find((item) => item.manualRecord?.id === recordId) || null,
    };
  };

  const handleCreateProductComplete = ({ intent, record }: CreateProductCompletion) => {
    const { nextRecords, asset } = buildAssetFromRecord(record.id);
    setRecords(nextRecords);

    if (!asset) {
      toast.success('Product created in My Products.');
      return;
    }

    if (intent === 'save-and-use') {
      const selectedPackageVersion = resolvePackageVersion(asset);
      const selectedProjectRevision = resolveProjectRevision(asset);
      const inquiryProduct = buildInquiryProductFromLibrary({
        ...asset,
        packageVersion: selectedPackageVersion?.version || asset.packageVersion,
        manualRecord: asset.manualRecord
          ? {
              ...asset.manualRecord,
              packageVersion: selectedPackageVersion?.version || asset.manualRecord.packageVersion || asset.packageVersion,
              oem: asset.isProjectBased
                ? (selectedProjectRevision?.oem || asset.manualRecord.oem)
                : (selectedPackageVersion?.oem || asset.manualRecord.oem),
            }
          : asset.manualRecord,
      }, {
        selectedPackageVersion,
        selectedProjectRevision,
      });

      onAddProduct(inquiryProduct);
      toast.success(`${asset.productName} created and added to inquiry.`);
      return;
    }

    toast.success(`${asset.productName} created in My Products.`);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50/40 px-8 py-6">
      <div className="mx-auto flex h-full w-full max-w-[1040px] min-h-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold tracking-tight text-[#1A1A1A]">My Products</div>
            <div className="mt-1 text-[12px] text-slate-500">
              Select products from your product library. Product packages, drawings, and saved technical files stay with the product record.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-md px-2.5 py-1 text-[12px] font-medium">
              {filteredRecords.length} products
            </Badge>
            <Button onClick={() => setIsCreateFlowOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Product for Inquiry
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search product name, your model#, or supplier model#"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {([
              ['all', 'All'],
              ['standard', 'Standard'],
              ['oem', 'OEM'],
              ...(businessMode.projectRevisionEnabled ? ([['project', 'Project']] as const) : []),
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                variant={itemFilter === value ? 'default' : 'outline'}
                onClick={() => setItemFilter(value)}
                className="h-9"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredRecords.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No products in My Products yet.</p>
              <p className="mt-1 text-sm text-slate-500">
                Products saved manually, quoted, or ordered from COSUN will appear here for reuse in the inquiry.
              </p>
              <Button className="mt-4 gap-2" onClick={() => setIsCreateFlowOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Product for Inquiry
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredRecords.map((record) => {
                const selectedPackageVersion = resolvePackageVersion(record);
                const selectedProjectRevision = resolveProjectRevision(record);
                const inquiryProduct = buildInquiryProductFromLibrary({
                  ...record,
                  packageVersion: selectedPackageVersion?.version || record.packageVersion,
                  manualRecord: record.manualRecord
                    ? {
                        ...record.manualRecord,
                        packageVersion: selectedPackageVersion?.version || record.manualRecord.packageVersion || record.packageVersion,
                        oem: record.isProjectBased
                          ? (selectedProjectRevision?.oem || record.manualRecord.oem)
                          : (selectedPackageVersion?.oem || record.manualRecord.oem),
                      }
                    : record.manualRecord,
                }, {
                  selectedPackageVersion,
                  selectedProjectRevision,
                });
                const alreadyAdded = addedProductIds.has(inquiryProduct.id);
                return (
                  <Card key={record.id} className="border-slate-200">
                    <CardContent className="flex items-start justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-[14px] font-semibold text-slate-900">{record.productName || 'Unnamed Product'}</div>
                          <Badge variant="outline">
                            {formatSelectorProductType(record)}
                          </Badge>
                          <Badge variant="outline">
                            {record.sourceType === 'cosun'
                              ? 'COSUN'
                              : record.sourceType === 'mixed'
                                ? 'Mixed'
                                : record.sourceType === 'third_party'
                                  ? 'Third-party'
                                  : 'Customer-owned'}
                          </Badge>
                          <Badge className={syncBadgeClass[record.syncStatus] || syncBadgeClass.pending}>
                            {record.syncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
                          </Badge>
                        </div>
                        <div className="mt-2 grid gap-2 text-[12px] text-slate-600 md:grid-cols-3">
                          <div>
                            <div className="text-slate-400">Your Model#</div>
                            <div className="font-medium text-slate-800">{record.customerModelNo || '-'}</div>
                          </div>
                          <div>
                            <div className="text-slate-400">COSUN Model#</div>
                            <div className="font-medium text-slate-800">
                              {record.supplierModelNo ? (
                                <span className="inline-flex items-center gap-1">
                                  <Link2 className="h-3.5 w-3.5 text-slate-400" />
                                  {record.supplierModelNo}
                                </span>
                              ) : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Attachments</div>
                            <div className="inline-flex items-center gap-1 font-medium text-slate-800">
                              <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                              {record.attachmentCount || 0}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[12px] leading-5 text-slate-500">
                          {record.description || 'No description'}
                        </div>
                        <div className="mt-2 grid gap-2 text-[12px] text-slate-600 md:grid-cols-3">
                          <div>
                            <div className="text-slate-400">{record.isProjectBased ? 'Revision' : 'Package'}</div>
                            {record.isProjectBased && Array.isArray(record.manualRecord?.projectRevisions) && record.manualRecord.projectRevisions.length > 1 ? (
                              <select
                                value={selectedProjectRevision?.revisionId || record.currentRevisionId || ''}
                                onChange={(e) =>
                                  setSelectedProjectRevisionIds((prev) => ({
                                    ...prev,
                                    [record.id]: e.target.value,
                                  }))
                                }
                                className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-[12px] font-medium text-slate-800"
                              >
                                {record.manualRecord.projectRevisions.map((revision) => (
                                  <option key={`${record.id}-rev-${revision.revisionId}`} value={revision.revisionId}>
                                    {`Revision ${revision.revisionCode} · ${revision.revisionStatus}`}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="font-medium text-slate-800">
                                {record.isProjectBased
                                  ? record.currentRevisionCode
                                    ? `Revision ${record.currentRevisionCode}`
                                    : 'Current Revision'
                                  : record.packageStatus === 'technical_package_ready'
                                    ? 'Current Technical Package'
                                    : record.packageStatus === 'basic_package'
                                      ? 'Current Business Package'
                                      : 'Current Package'}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-slate-400">Last Quote</div>
                            <div className="font-medium text-slate-800">
                              {record.quoteStats.lastPrice ? `$${record.quoteStats.lastPrice.toFixed(2)}` : '-'}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400">Last Order</div>
                            <div className="font-medium text-slate-800">
                              {record.orderStats.lastPrice ? `$${record.orderStats.lastPrice.toFixed(2)}` : '-'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                          {record.isProjectBased && record.currentRevisionStatus ? (
                            <Badge variant="secondary" className="rounded-sm">
                              {`Revision ${record.currentRevisionCode || '-'} · ${record.currentRevisionStatus}`}
                            </Badge>
                          ) : null}
                          {record.sourceTags.map((tag) => (
                            <Badge key={`${record.id}-${tag}`} variant="secondary" className="rounded-sm">
                              {tag === 'manual' ? 'My Products' : tag === 'quoted' ? 'Quotation' : tag === 'ordered' ? 'Order' : tag}
                            </Badge>
                          ))}
                        </div>
                        {record.syncMessage ? (
                          <div className="mt-2 text-[12px] text-amber-700">{record.syncMessage}</div>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        {alreadyAdded ? (
                          <Badge className="border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] text-emerald-700">
                            Added
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => {
                              onAddProduct(inquiryProduct);
                              toast.success(`${record.productName} added from My Products`);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add to Inquiry
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreateProductFlow
        open={isCreateFlowOpen}
        mode="inquiry-return"
        onOpenChange={setIsCreateFlowOpen}
        onComplete={handleCreateProductComplete}
      />
    </div>
  );
}
