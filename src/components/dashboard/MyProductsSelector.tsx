import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GitBranchPlus,
  LayoutGrid,
  LayoutList,
  Package,
  Paperclip,
  Plus,
  Search,
  ShoppingCart,
  Tag,
  Wrench,
} from 'lucide-react';
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

// ─── Formatters ───────────────────────────────────────────────────────────────

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatPrice = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value)) return null;
  return priceFormatter.format(value);
};

const formatSelectorProductType = (asset: ProductLibraryAsset) => {
  if (asset.manualRecord?.serviceType === 'qc_service') return 'QC Service';
  if (asset.manualRecord?.serviceType === 'general_service') return 'Service';
  if (asset.isProjectBased) return 'Project';
  if (asset.itemType === 'oem_custom') return 'OEM';
  return 'Standard';
};

const formatProductTypeBadgeClass = (asset: ProductLibraryAsset) => {
  if (asset.manualRecord?.serviceType) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (asset.isProjectBased) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (asset.itemType === 'oem_custom') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

// ─── Build inquiry product ────────────────────────────────────────────────────

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
    ? selectedProjectRevision?.oem || record?.oem
    : selectedPackageVersion?.oem || record?.oem;
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

// ─── Product type icon ────────────────────────────────────────────────────────

function ProductTypeIcon({ asset }: { asset: ProductLibraryAsset }) {
  if (asset.manualRecord?.serviceType) return <ClipboardList className="h-3.5 w-3.5" />;
  if (asset.isProjectBased) return <GitBranchPlus className="h-3.5 w-3.5" />;
  if (asset.itemType === 'oem_custom') return <Wrench className="h-3.5 w-3.5" />;
  return <Package className="h-3.5 w-3.5" />;
}

// ─── Business status indicator ────────────────────────────────────────────────

function BusinessStatusDot({ asset }: { asset: ProductLibraryAsset }) {
  if (asset.orderStats.count > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
        <ShoppingCart className="h-2.5 w-2.5" />
        Ordered
      </span>
    );
  }
  if (asset.quoteStats.count > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
        <Tag className="h-2.5 w-2.5" />
        Quoted
      </span>
    );
  }
  if (asset.lastInquiryNumber) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
        <FileText className="h-2.5 w-2.5" />
        Inquired
      </span>
    );
  }
  return null;
}

// ─── Product Card (in selector) ───────────────────────────────────────────────

function SelectorProductCard({
  asset,
  isAdded,
  selectedRevisionId,
  onRevisionChange,
  onAdd,
}: {
  asset: ProductLibraryAsset;
  isAdded: boolean;
  selectedRevisionId?: string;
  onRevisionChange?: (revisionId: string) => void;
  onAdd: () => void;
}) {
  const refPrice = asset.orderStats.lastPrice || asset.quoteStats.lastPrice;
  const revisions = Array.isArray(asset.manualRecord?.projectRevisions) ? asset.manualRecord.projectRevisions : [];

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white transition ${
        isAdded ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {isAdded && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      )}

      <div className="flex-1 p-4">
        {/* Header */}
        <div className="flex items-start gap-2.5 pr-5">
          <div className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border ${formatProductTypeBadgeClass(asset)}`}>
            <ProductTypeIcon asset={asset} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {asset.productName || 'Unnamed Product'}
              </span>
              <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${formatProductTypeBadgeClass(asset)}`}>
                {formatSelectorProductType(asset)}
              </span>
              <BusinessStatusDot asset={asset} />
            </div>
            {asset.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{asset.description}</p>
            )}
          </div>
        </div>

        {/* Model numbers */}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {asset.customerModelNo && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Your Model#</div>
              <div className="text-[11px] font-medium text-slate-700">{asset.customerModelNo}</div>
            </div>
          )}
          {asset.supplierModelNo && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">COSUN Model#</div>
              <div className="text-[11px] font-medium text-slate-700">{asset.supplierModelNo}</div>
            </div>
          )}
          {refPrice && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Ref. Price</div>
              <div className="text-[11px] font-medium text-emerald-700">{formatPrice(refPrice)}</div>
            </div>
          )}
          {asset.attachmentCount > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">Files</div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-700">
                <Paperclip className="h-2.5 w-2.5 text-slate-400" />
                {asset.attachmentCount}
              </div>
            </div>
          )}
        </div>

        {/* Revision selector for project-based with multiple revisions */}
        {asset.isProjectBased && revisions.length > 1 && onRevisionChange && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">Select Revision</div>
            <select
              value={selectedRevisionId || asset.currentRevisionId || ''}
              onChange={(e) => onRevisionChange(e.target.value)}
              className="mt-1 h-7 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700"
            >
              {revisions.map((rev) => (
                <option key={`${asset.id}-rev-${rev.revisionId}`} value={rev.revisionId}>
                  Rev {rev.revisionCode} · {rev.revisionStatus}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Package / revision label for single */}
        {(!asset.isProjectBased || revisions.length <= 1) && (
          <div className="mt-3 flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              asset.packageStatus === 'technical_package_ready'
                ? 'bg-emerald-50 text-emerald-700'
                : asset.packageStatus === 'basic_package'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
            }`}>
              {asset.isProjectBased
                ? `Rev ${asset.currentRevisionCode || '—'}`
                : asset.packageStatus === 'technical_package_ready'
                  ? 'Files Ready'
                  : asset.packageStatus === 'basic_package'
                    ? 'Basic Package'
                    : 'No Package'}
            </span>
            {asset.usageCount > 0 && (
              <span className="text-[10px] text-slate-400">{asset.usageCount}× used</span>
            )}
          </div>
        )}
      </div>

      {/* Footer action */}
      <div className="border-t border-slate-100 px-4 py-3">
        {isAdded ? (
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Added to inquiry
          </div>
        ) : (
          <Button onClick={onAdd} className="h-8 w-full gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Add to Inquiry
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Product Row (list view in selector) ─────────────────────────────────────

function SelectorProductRow({
  asset,
  isAdded,
  onAdd,
}: {
  asset: ProductLibraryAsset;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const refPrice = asset.orderStats.lastPrice || asset.quoteStats.lastPrice;

  return (
    <div className={`flex items-center gap-4 rounded-xl border p-3 transition ${
      isAdded ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}>
      <div className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${formatProductTypeBadgeClass(asset)}`}>
        <ProductTypeIcon asset={asset} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold text-slate-900">{asset.productName}</span>
          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${formatProductTypeBadgeClass(asset)}`}>
            {formatSelectorProductType(asset)}
          </span>
          <BusinessStatusDot asset={asset} />
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          {asset.customerModelNo && <span>Your#: {asset.customerModelNo}</span>}
          {asset.supplierModelNo && <span>COSUN#: {asset.supplierModelNo}</span>}
          {refPrice && <span className="text-emerald-600">{formatPrice(refPrice)}</span>}
          {asset.attachmentCount > 0 && (
            <span className="flex items-center gap-0.5">
              <Paperclip className="h-2.5 w-2.5" />{asset.attachmentCount}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0">
        {isAdded ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Added
          </span>
        ) : (
          <Button size="sm" onClick={onAdd} className="h-7 gap-1.5 text-xs">
            <Plus className="h-3 w-3" />
            Add
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyProductsSelector({ onAddProduct, addedProductIds }: MyProductsSelectorProps) {
  const { orders } = useOrders();
  const { quotations } = useSalesQuotations();
  const [records, setRecords] = useState(customerProductLibraryService.getAll());
  const [isBridgeReady, setIsBridgeReady] = useState(() => isSupabaseStorageBridgeReady());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'standard' | 'oem' | 'project' | 'service'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProjectRevisionIds, setSelectedProjectRevisionIds] = useState<Record<string, string>>({});
  const [currentUserEmail, setCurrentUserEmail] = useState(() => resolveProductLibraryCustomerEmail());
  const [businessMode, setBusinessMode] = useState(() => resolveCustomerBusinessMode());
  const [isCreateFlowOpen, setIsCreateFlowOpen] = useState(false);

  useEffect(() => {
    const load = () => setRecords(customerProductLibraryService.getAll());
    const handleBridgeSync = () => { setIsBridgeReady(true); load(); };
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
    return buildProductLibraryAssets({ libraryRecords: records, quotations, orders, customerEmail: currentUserEmail });
  }, [currentUserEmail, isBridgeReady, orders, quotations, records]);

  const filteredProducts = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return products.filter((asset) => {
      if (!businessMode.projectRevisionEnabled && asset.isProjectBased) return false;
      const matchesKeyword =
        !keyword ||
        [asset.productName, asset.customerModelNo, asset.supplierModelNo, asset.description]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(keyword));
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'project' && businessMode.projectRevisionEnabled && asset.isProjectBased) ||
        (typeFilter === 'oem' && asset.itemType === 'oem_custom') ||
        (typeFilter === 'service' && !!asset.manualRecord?.serviceType) ||
        (typeFilter === 'standard' && !asset.isProjectBased && asset.itemType !== 'oem_custom' && !asset.manualRecord?.serviceType);
      const hasIdentity = Boolean(asset.manualRecord) || Boolean(asset.productName) || Boolean(asset.customerModelNo);
      return matchesKeyword && matchesType && hasIdentity;
    });
  }, [businessMode.projectRevisionEnabled, products, searchTerm, typeFilter]);

  const resolvePackageVersion = (asset: ProductLibraryAsset) => {
    const pkgs = Array.isArray(asset.manualRecord?.packageVersions) ? asset.manualRecord.packageVersions : [];
    if (pkgs.length === 0) return null;
    return pkgs.find((p) => p.version === asset.packageVersion) || pkgs[0];
  };

  const resolveProjectRevision = (asset: ProductLibraryAsset) => {
    const revs = Array.isArray(asset.manualRecord?.projectRevisions) ? asset.manualRecord.projectRevisions : [];
    if (revs.length === 0) return null;
    const selectedId = selectedProjectRevisionIds[asset.id];
    return (
      revs.find((r) => r.revisionId === selectedId) ||
      revs.find((r) => r.revisionId === asset.finalRevisionId) ||
      revs.find((r) => r.revisionId === asset.currentRevisionId) ||
      revs[0]
    );
  };

  const buildAssetFromRecord = (recordId: string) => {
    const nextRecords = customerProductLibraryService.getAll();
    const nextAssets = buildProductLibraryAssets({ libraryRecords: nextRecords, quotations, orders, customerEmail: currentUserEmail });
    return { nextRecords, asset: nextAssets.find((a) => a.manualRecord?.id === recordId) || null };
  };

  const handleAddAsset = (asset: ProductLibraryAsset) => {
    const selectedPackageVersion = resolvePackageVersion(asset);
    const selectedProjectRevision = resolveProjectRevision(asset);
    const inquiryProduct = buildInquiryProductFromLibrary(
      {
        ...asset,
        packageVersion: selectedPackageVersion?.version || asset.packageVersion,
        manualRecord: asset.manualRecord
          ? {
              ...asset.manualRecord,
              packageVersion: selectedPackageVersion?.version || asset.manualRecord.packageVersion || asset.packageVersion,
              oem: asset.isProjectBased
                ? selectedProjectRevision?.oem || asset.manualRecord.oem
                : selectedPackageVersion?.oem || asset.manualRecord.oem,
            }
          : asset.manualRecord,
      },
      { selectedPackageVersion, selectedProjectRevision },
    );
    onAddProduct(inquiryProduct);
    toast.success(`${asset.productName} added to inquiry`);
  };

  const getInquiryProductId = (asset: ProductLibraryAsset) => {
    const selectedPackageVersion = resolvePackageVersion(asset);
    const selectedProjectRevision = resolveProjectRevision(asset);
    const inquiryProduct = buildInquiryProductFromLibrary(
      {
        ...asset,
        packageVersion: selectedPackageVersion?.version || asset.packageVersion,
        manualRecord: asset.manualRecord
          ? {
              ...asset.manualRecord,
              packageVersion: selectedPackageVersion?.version || asset.manualRecord.packageVersion || asset.packageVersion,
              oem: asset.isProjectBased
                ? selectedProjectRevision?.oem || asset.manualRecord.oem
                : selectedPackageVersion?.oem || asset.manualRecord.oem,
            }
          : asset.manualRecord,
      },
      { selectedPackageVersion, selectedProjectRevision },
    );
    return inquiryProduct.id;
  };

  const handleCreateProductComplete = ({ intent, record }: CreateProductCompletion) => {
    const { nextRecords, asset } = buildAssetFromRecord(record.id);
    setRecords(nextRecords);
    if (!asset) { toast.success('Product created in My Products.'); return; }
    if (intent === 'save-and-use') {
      const selectedPackageVersion = resolvePackageVersion(asset);
      const selectedProjectRevision = resolveProjectRevision(asset);
      const inquiryProduct = buildInquiryProductFromLibrary(
        {
          ...asset,
          packageVersion: selectedPackageVersion?.version || asset.packageVersion,
          manualRecord: asset.manualRecord
            ? {
                ...asset.manualRecord,
                packageVersion: selectedPackageVersion?.version || asset.manualRecord.packageVersion || asset.packageVersion,
                oem: asset.isProjectBased
                  ? selectedProjectRevision?.oem || asset.manualRecord.oem
                  : selectedPackageVersion?.oem || asset.manualRecord.oem,
              }
            : asset.manualRecord,
        },
        { selectedPackageVersion, selectedProjectRevision },
      );
      onAddProduct(inquiryProduct);
      toast.success(`${asset.productName} created and added to inquiry.`);
      return;
    }
    toast.success(`${asset.productName} created in My Products.`);
  };

  const addedCount = filteredProducts.filter((a) => addedProductIds.has(getInquiryProductId(a))).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">My Products</span>
              {addedCount > 0 && (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]">
                  {addedCount} added
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Select from your product library — specs, files &amp; OEM data are pre-attached.
            </p>
          </div>
          <Button onClick={() => setIsCreateFlowOpen(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            Create &amp; Add
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products…"
              className="h-7 rounded-lg pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1">
            {(
              [
                ['all', 'All'],
                ['standard', 'Standard'],
                ['oem', 'OEM'],
                ...(businessMode.projectRevisionEnabled ? [['project', 'Project']] : []),
                ['service', 'Service'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value as typeof typeFilter)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                  typeFilter === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`rounded-md p-1 transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md p-1 transition ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutList className="h-3 w-3" />
            </button>
          </div>
          <span className="text-[11px] text-slate-400">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Product list */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 px-5 py-4">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <Package className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-700">No products in your library yet</p>
            <p className="mt-1 max-w-xs text-xs text-slate-500">
              Products you've saved, quoted, or ordered from COSUN will appear here for easy reuse.
            </p>
            <Button className="mt-4 h-8 gap-1.5 text-xs" onClick={() => setIsCreateFlowOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Create Product &amp; Add to Inquiry
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((asset) => {
              const inquiryId = getInquiryProductId(asset);
              const isAdded = addedProductIds.has(inquiryId);
              return (
                <SelectorProductCard
                  key={asset.id}
                  asset={asset}
                  isAdded={isAdded}
                  selectedRevisionId={selectedProjectRevisionIds[asset.id]}
                  onRevisionChange={
                    asset.isProjectBased
                      ? (revisionId) => setSelectedProjectRevisionIds((prev) => ({ ...prev, [asset.id]: revisionId }))
                      : undefined
                  }
                  onAdd={() => handleAddAsset(asset)}
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((asset) => {
              const inquiryId = getInquiryProductId(asset);
              const isAdded = addedProductIds.has(inquiryId);
              return (
                <SelectorProductRow
                  key={asset.id}
                  asset={asset}
                  isAdded={isAdded}
                  onAdd={() => handleAddAsset(asset)}
                />
              );
            })}
          </div>
        )}
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
