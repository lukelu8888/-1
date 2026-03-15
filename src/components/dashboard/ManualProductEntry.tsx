import type React from 'react';
import { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { ChevronDown, Plus, Package, Trash2, Upload, X as CloseIcon, Image as ImageIcon, CircleHelp, Pencil, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { nextInternalModelNo } from '../../lib/supabaseService';
import { productIdentityResolver } from '../../lib/services/productIdentityResolver';
import {
  buildAttachmentSummarySnapshot,
  buildFileManifestSnapshot,
  buildOemRequirementSummary,
  getSnapshotDisplayModelNo,
  tradeProductSnapshotService,
} from '../../lib/services/tradeProductSnapshotService';
import { createEmptyOemData, normalizeOemData, serializeOemDataForPersistence, type InquiryOemData } from '../../types/oem';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { getCustomerFacingModelNo, shouldShowCustomerRefLine } from '../../utils/productModelDisplay';
import { customerProductLibraryService } from '../../lib/customerProductLibrary';
import { getCurrentUser } from '../../utils/dataIsolation';

interface ManualProductEntryProps {
  onAddProduct: (product: any) => void;
  onUpdateProduct?: (productId: string, product: any) => void;
  onCancel: () => void;
  manualProducts?: any[];
  onRemoveProduct?: (productId: string) => void;
  regionCode?: string;
  currentOemData: InquiryOemData;
  onCurrentOemChange: (nextValue: InquiryOemData) => void;
  currentItemType: 'standard_sourcing' | 'oem_custom';
  onCurrentItemTypeChange: (nextValue: 'standard_sourcing' | 'oem_custom') => void;
  formId?: string;
  showSubmitButton?: boolean;
  oemSection?: React.ReactNode;
}

export function ManualProductEntry({
  onAddProduct,
  onUpdateProduct,
  onCancel,
  manualProducts = [],
  onRemoveProduct,
  regionCode = 'NA',
  currentOemData,
  onCurrentOemChange,
  currentItemType,
  onCurrentItemTypeChange,
  formId = 'manual-item-form',
  showSubmitButton = true,
  oemSection,
}: ManualProductEntryProps) {
  const manualWorkspaceColumns = '420px minmax(0, 1fr)';
  const quantityRowColumns = 'minmax(0, 1fr) 120px';
  const manualListColumns = '56px 88px 72px minmax(180px, 1fr) 96px 72px 124px 112px';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    productName: '',
    customerModelNo: '',
    quantity: '',
    unit: 'pcs',
    targetPrice: '',
    specifications: '',
    image: '',
  });
  const [isGeneratingModelNo, setIsGeneratingModelNo] = useState(false);
  const [expandedOemItemIds, setExpandedOemItemIds] = useState<string[]>([]);
  const [itemFilter, setItemFilter] = useState<'all' | 'standard' | 'oem'>('all');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const renderSquareThumbnail = (src?: string, alt = 'Preview image', size = 72) => {
    if (!src) {
      return (
        <div
          className="flex shrink-0 items-center justify-center rounded-md bg-slate-100"
          style={{ width: size, height: size }}
        >
          <ImageIcon className="h-6 w-6 text-slate-300" />
        </div>
      );
    }

    return (
      <div
        className="shrink-0 overflow-hidden rounded-md bg-slate-100"
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
          }}
        />
      </div>
    );
  };

  const FieldHelp = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-slate-500 hover:border-slate-600 hover:text-slate-700"
        >
          <CircleHelp className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-xs leading-5">
        {text}
      </TooltipContent>
    </Tooltip>
  );

  const withTimeout = async <T,>(task: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    return Promise.race([
      task,
      new Promise<T>((_, reject) => {
        window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  };

  const buildLocalFallbackModelNo = () => {
    const normalizedRegion = String(regionCode || 'NA').trim().toUpperCase() || 'NA';
    const now = new Date();
    const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const storageKey = `manual_model_seq_${normalizedRegion}`;

    let nextValue = 1;
    try {
      const saved = Number(localStorage.getItem(storageKey) || '0');
      nextValue = Number.isFinite(saved) ? saved + 1 : 1;
      localStorage.setItem(storageKey, String(nextValue));
    } catch {
      nextValue = Math.floor(Math.random() * 9000) + 1000;
    }

    return `${normalizedRegion}-${yymm}-L${String(nextValue).padStart(4, '0')}`;
  };

  const resolveCustomerPartyId = () => {
    const currentUser = getCurrentUser() as any;
    if (typeof window === 'undefined') {
      return String(currentUser?.companyId || currentUser?.email || 'inquiry-customer');
    }

    try {
      const backendUser = JSON.parse(localStorage.getItem('cosun_backend_user') || 'null');
      const authUser = JSON.parse(localStorage.getItem('cosun_auth_user') || 'null');
      const customerProfile = JSON.parse(localStorage.getItem('cosun_customer_profile') || 'null');
      return String(
        currentUser?.companyId ||
          backendUser?.companyId ||
          authUser?.companyId ||
          customerProfile?.companyId ||
          currentUser?.email ||
          backendUser?.email ||
          authUser?.email ||
          customerProfile?.email ||
          'inquiry-customer',
      ).trim() || 'inquiry-customer';
    } catch {
      return String(currentUser?.companyId || currentUser?.email || 'inquiry-customer');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      customerModelNo: '',
      quantity: '',
      unit: 'pcs',
      targetPrice: '',
      specifications: '',
      image: '',
    });
    setEditingProductId(null);
    onCurrentItemTypeChange('standard_sourcing');
    onCurrentOemChange(createEmptyOemData());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submitProduct = async () => {
    if (!formData.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }

    const normalizedOemData = normalizeOemData(currentOemData);
    if (currentItemType === 'oem_custom') {
      if (normalizedOemData.files.length === 0) {
        toast.error('Add at least one OEM file for this OEM item.');
        return;
      }
      if (!normalizedOemData.overallRequirementNote.trim()) {
        toast.error('Provide the OEM business requirement note for this OEM item.');
        return;
      }
    }

    setIsGeneratingModelNo(true);
    const editingProduct = editingProductId
      ? manualProducts.find((product) => product.id === editingProductId)
      : null;
    let internalModelNo = editingProduct?.modelNo || editingProduct?.model_no || editingProduct?.internalModelNo || '';
    let usedFallbackModelNo = false;
    if (!internalModelNo) {
      try {
        internalModelNo = await withTimeout(
          nextInternalModelNo(regionCode),
          5000,
          'Model number request timed out',
        );
      } catch (error) {
        console.warn('[ManualProductEntry] Falling back to local model number.', error);
        internalModelNo = buildLocalFallbackModelNo();
        usedFallbackModelNo = true;
        toast.warning(`Model# service unavailable. Using temporary number ${internalModelNo}.`);
      }
    }

    const product = {
      id: editingProduct?.id || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      modelNo: internalModelNo,
      productName: formData.productName.trim(),
      customerModelNo: formData.customerModelNo.trim(),
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : 0,
      specifications: formData.specifications.trim(),
      image: formData.image || '',
      source: 'manual' as const,
      itemType: currentItemType,
      oem: currentItemType === 'oem_custom'
        ? serializeOemDataForPersistence({
            ...normalizedOemData,
            enabled: true,
          })
        : undefined,
      syncStatus: 'syncing' as const,
      syncMessage: '',
    };
    let syncStatus: 'synced' | 'pending' = usedFallbackModelNo ? 'pending' : 'synced';
    let syncMessage = usedFallbackModelNo ? 'Temporary local Model# used because Supabase was unavailable.' : '';
    let syncedProductMasterId: string | null = null;
    let masterRef: any = null;
    let mappingRef: any = null;

    try {
      const identity = await withTimeout(productIdentityResolver.resolve({
        regionCode,
        productName: product.productName,
        description: product.specifications,
        imageUrl: product.image,
        internalModelNo,
        customerModelNo: product.customerModelNo,
        mappingPartyType: product.customerModelNo ? 'customer' : null,
        partyId: resolveCustomerPartyId(),
        createdFromDocType: 'inquiry',
        createdFromDocId: product.id,
        createMasterIfMissing: true,
        ensurePendingMapping: Boolean(product.customerModelNo),
        remarks: 'Created from manual inquiry entry',
      }), 5000, 'Product identity sync timed out');
      masterRef = identity.masterRef;
      mappingRef = identity.mappingRef;
      syncedProductMasterId = identity.productMaster?.id || identity.masterRef?.masterProductId || null;
      if (!usedFallbackModelNo) {
        syncStatus = identity.masterRef?.isResolved ? 'synced' : 'pending';
      }
      if (identity.resolutionStatus === 'pending_mapping' && !syncMessage) {
        syncMessage = 'Customer model mapping pending confirmation.';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      syncStatus = 'pending';
      syncMessage = message;
      toast.warning(`Added as pending sync: ${message}`);
    }

    const attachmentSummarySnapshot = buildAttachmentSummarySnapshot(product.oem || null);
    const fileManifestSnapshot = buildFileManifestSnapshot(product.oem || null);
    const inquirySnapshotDraft = {
      masterRef: masterRef || {
        masterProductId: syncedProductMasterId,
        internalModelNo,
        isResolved: Boolean(syncedProductMasterId || internalModelNo),
      },
      mappingRef,
      sourceRef: {
        sourceLayer: 'manual_entry' as const,
        sourceObjectId: product.id,
        sourceSnapshotId: null,
        sourceLabel: 'Manual Entry',
      },
      productName: product.productName,
      displayModelNo: getSnapshotDisplayModelNo({
        masterRef: masterRef || { internalModelNo },
        customerModelNo: product.customerModelNo,
        supplierModelNo: internalModelNo,
      }),
      customerModelNo: product.customerModelNo || '',
      supplierModelNo: internalModelNo,
      description: product.specifications || '',
      specSummary: product.specifications || '',
      imageUrl: product.image || '',
      unit: product.unit,
      itemType: currentItemType,
      regionCode,
      attachmentSummarySnapshot,
      fileManifestSnapshot,
      oemRequirementSummary: buildOemRequirementSummary(product.oem || null),
      oemDataSnapshot: product.oem || null,
      requestedQuantity: product.quantity,
      targetPrice: product.targetPrice,
      currency: 'USD',
      selectedPackageVersionRef: null,
      selectedProjectRevisionRef: null,
      inquiryRequirementSummary: product.specifications || normalizeOemData(product.oem).overallRequirementNote || '',
    };
    const inquirySnapshot = tradeProductSnapshotService.createInquirySnapshot(inquirySnapshotDraft);

    const persistedCustomerProduct = customerProductLibraryService.upsertFromManualItem({
      ...product,
      sourceType: 'customer_created',
      supplierProductId: syncStatus === 'synced' ? syncedProductMasterId : null,
      masterRef: inquirySnapshotDraft.masterRef,
      mappingRef: inquirySnapshotDraft.mappingRef,
      syncStatus,
      syncMessage,
      attachmentSummarySnapshot,
      fileManifestSnapshot,
    });

    const finalProduct = {
      ...product,
      customerProductId: persistedCustomerProduct.id,
      sourceType: 'customer_created' as const,
      masterRef: inquirySnapshotDraft.masterRef,
      mappingRef: inquirySnapshotDraft.mappingRef,
      syncStatus,
      syncMessage,
      attachmentSummarySnapshot,
      fileManifestSnapshot,
      inquirySnapshotDraft,
      inquirySnapshot,
    };

    if (editingProductId && onUpdateProduct) {
      onUpdateProduct(editingProductId, finalProduct);
      toast.success('Item updated in this inquiry and synced to product library by market.');
    } else {
      onAddProduct(finalProduct);
    }

    resetForm();
    setIsGeneratingModelNo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitProduct();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleChange('image', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    handleChange('image', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    setFormData({
      productName: String(product.productName || ''),
      customerModelNo: String(product.customerModelNo || product.customerModelNO || product.customer_model_no || ''),
      quantity: String(product.quantity || ''),
      unit: String(product.unit || 'pcs'),
      targetPrice: product.targetPrice != null ? String(product.targetPrice) : '',
      specifications: String(product.specifications || ''),
      image: String(product.image || ''),
    });
    onCurrentItemTypeChange(product.itemType === 'oem_custom' ? 'oem_custom' : 'standard_sourcing');
    onCurrentOemChange(product.itemType === 'oem_custom' ? normalizeOemData(product.oem) : createEmptyOemData());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleOemDetails = (productId: string) => {
    setExpandedOemItemIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const filteredManualProducts = manualProducts.filter((product) => {
    const itemOem = normalizeOemData(product.oem);
    const isOemProduct = product.itemType === 'oem_custom' && itemOem.enabled;
    if (itemFilter === 'oem') return isOemProduct;
    if (itemFilter === 'standard') return !isOemProduct;
    return true;
  });

  return (
    <div className="flex min-h-full flex-col bg-slate-50/40 px-8 py-6">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-4">
        <div className="flex flex-col border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Item Type <span className="text-red-500">*</span>
              </Label>
              <FieldHelp text="Choose standard sourcing when the item can be sourced by specs or materials. Choose OEM when the item needs customer drawings, branding files, custom design, or mold-driven development." />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    onCurrentItemTypeChange('standard_sourcing');
                    onCurrentOemChange(createEmptyOemData());
                  }}
                  className={`w-full rounded-md border px-4 py-4 pr-12 text-left transition-colors ${
                    currentItemType === 'standard_sourcing'
                      ? 'border-[#0D3B66] bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                    <span>Standard sourcing item</span>
                  </div>
                </button>
                <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
                  <FieldHelp text="For items that can be sourced by specifications, material, size, color, or finish, without custom drawing development or mold opening." />
                </div>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    onCurrentItemTypeChange('oem_custom');
                    onCurrentOemChange({
                      ...normalizeOemData(currentOemData),
                      enabled: true,
                    });
                  }}
                  className={`w-full rounded-md border px-4 py-4 pr-12 text-left transition-colors ${
                    currentItemType === 'oem_custom'
                      ? 'border-[#F96302] bg-orange-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-slate-900">
                    <span>OEM / custom design item</span>
                  </div>
                </button>
                <div className="pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2">
                  <FieldHelp text="For items that need customer drawings, branding files, custom design intent, or mold-driven requirements." />
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex-1"
            style={{ display: 'grid', gridTemplateColumns: manualWorkspaceColumns }}
          >
            <div className="flex flex-col border-r border-slate-200 bg-slate-50/45">
              <div className="px-5 py-5">
                <form id={formId} onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="productName" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="productName"
                      placeholder=""
                      value={formData.productName}
                      onChange={(e) => handleChange('productName', e.target.value)}
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>

                  <div
                    className="gap-3"
                    style={{ display: 'grid', gridTemplateColumns: quantityRowColumns }}
                  >
                  <div>
                    <Label htmlFor="customerModelNo" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Customer Model#
                    </Label>
                    <Input
                      id="customerModelNo"
                      placeholder=""
                      value={formData.customerModelNo}
                      onChange={(e) => handleChange('customerModelNo', e.target.value)}
                      className="h-10 border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Quantity <span className="text-red-500">*</span>
                    </Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder=""
                        value={formData.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        min="1"
                        step="1"
                        className="h-10 border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div
                    className="gap-3"
                    style={{ display: 'grid', gridTemplateColumns: quantityRowColumns }}
                  >
                    <div>
                      <Label htmlFor="targetPrice" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Target Price (USD)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <Input
                          id="targetPrice"
                          type="number"
                          placeholder=""
                          value={formData.targetPrice}
                          onChange={(e) => handleChange('targetPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          className="h-10 border-slate-200 bg-white pl-7"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="unit" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Unit
                      </Label>
                      <select
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => handleChange('unit', e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#F96302]"
                      >
                        <option value="pcs">pcs</option>
                        <option value="sets">sets</option>
                        <option value="boxes">boxes</option>
                        <option value="cartons">cartons</option>
                        <option value="pairs">pairs</option>
                        <option value="kg">kg</option>
                        <option value="m">m</option>
                        <option value="sqm">sqm</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Image
                    </Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-[72px] w-[72px] shrink-0 aspect-square items-center justify-center overflow-hidden rounded-md bg-slate-100">
                          {renderSquareThumbnail(formData.image, 'Product preview', 72)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] text-slate-600">
                            Upload a reference image for this manual item.
                          </div>
                          <div className="mt-3 flex gap-2">
                            {!formData.image ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handlePickImage}
                                className="h-9 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                              >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClearImage}
                                className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              >
                                <CloseIcon className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {currentItemType === 'oem_custom' ? oemSection : null}

                  {currentItemType !== 'oem_custom' && (
                    <div>
                      <Label htmlFor="specifications" className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Specifications / Description
                      </Label>
                      <Textarea
                        id="specifications"
                        placeholder=""
                        value={formData.specifications}
                        onChange={(e) => handleChange('specifications', e.target.value)}
                        rows={5}
                        className="min-h-[132px] resize-none border-slate-200 bg-white"
                      />
                    </div>
                  )}

                  {showSubmitButton && (
                    <Button
                      type="submit"
                      disabled={isGeneratingModelNo}
                      className="h-10 w-full justify-center gap-2 bg-[#F96302] text-white hover:bg-[#E05502]"
                    >
                      {editingProductId ? (
                        <RefreshCcw className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {isGeneratingModelNo
                        ? 'Generating Model#...'
                        : editingProductId
                          ? 'Update Item'
                          : currentItemType === 'oem_custom'
                            ? 'Add OEM Item'
                            : 'Add Item'}
                    </Button>
                  )}
                </form>
              </div>
            </div>

            <div className="flex min-w-0 flex-col bg-white">
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Added Items
                    </div>
                    <div className="mt-1 text-[13px] text-slate-600">
                      {manualProducts.length > 0
                        ? `${manualProducts.length} manual products ready in this inquiry`
                        : 'Review the items you have added manually'}
                    </div>
                    {manualProducts.length > 0 ? (
                      <div className="mt-3 inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'standard', label: 'Standard' },
                          { key: 'oem', label: 'OEM' },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setItemFilter(option.key as 'all' | 'standard' | 'oem')}
                            className={`rounded-sm px-3 py-1 text-[11px] font-semibold transition-colors ${
                              itemFilter === option.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="rounded-md px-2 py-1 text-[12px]">
                    {filteredManualProducts.length} items
                  </Badge>
                </div>
              </div>

              <div className="flex-1 px-5 py-5">
                {manualProducts.length === 0 ? (
                  <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center">
                    <div>
                      <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-[13px] font-medium text-slate-600">No manual items yet</p>
                      <p className="mt-1 text-[12px] text-slate-500">Add a product from the form on the left.</p>
                    </div>
                  </div>
                ) : filteredManualProducts.length === 0 ? (
                  <div className="flex h-full min-h-[220px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/40 px-6 text-center">
                    <div>
                      <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      <p className="text-[13px] font-medium text-slate-600">No matching items</p>
                      <p className="mt-1 text-[12px] text-slate-500">Switch the filter to view other item types.</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full min-w-0 overflow-x-auto border border-slate-200 bg-slate-50">
                    <div className="min-w-[940px]">
                      <div
                        className="items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        style={{ display: 'grid', gridTemplateColumns: manualListColumns }}
                      >
                        <div>Seq#</div>
                        <div>Model#</div>
                        <div>Image</div>
                        <div>Product</div>
                        <div>Qty</div>
                        <div>Unit</div>
                        <div>Target Price</div>
                        <div>Action</div>
                      </div>
                      <div className="divide-y divide-slate-200">
                        {filteredManualProducts.map((product, index) => {
                          const itemOem = normalizeOemData(product.oem);
                          const isOemProduct = product.itemType === 'oem_custom' && itemOem.enabled;
                          const isExpanded = expandedOemItemIds.includes(product.id);

                          return (
                            <div key={product.id}>
                              <div
                                className="items-center gap-3 px-4 py-3"
                                style={{ display: 'grid', gridTemplateColumns: manualListColumns }}
                              >
                                <div className="text-[12px] font-semibold text-slate-500">
                                  {index + 1}
                                </div>
                                <div className="text-[12px] font-medium text-slate-600">
                                  {getCustomerFacingModelNo(product)}
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                                  {product.image
                                    ? renderSquareThumbnail(product.image, product.productName, 48)
                                    : (
                                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-100">
                                        <Package className="h-5 w-5 text-slate-300" />
                                      </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <div className="truncate text-[13px] font-semibold text-[#1A1A1A]">
                                      {product.productName}
                                    </div>
                                    {isOemProduct && (
                                      <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[10px] text-orange-700">
                                        OEM
                                      </Badge>
                                    )}
                                    {product.syncStatus === 'pending' && (
                                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700">
                                        Pending Sync
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-0.5 truncate text-[11px] text-slate-500">
                                    {shouldShowCustomerRefLine(product)
                                      ? `Customer Ref: ${product.customerModelNo || product.customerModelNO || product.customer_model_no}`
                                      : (product.specifications || 'No description')}
                                  </div>
                                  {isOemProduct ? (
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                      <span>{itemOem.files.length} file{itemOem.files.length === 1 ? '' : 's'}</span>
                                      {itemOem.tooling.toolingCostInvolved ? <span>Mold plan</span> : null}
                                      <button
                                        type="button"
                                        onClick={() => toggleOemDetails(product.id)}
                                        className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800"
                                      >
                                        {isExpanded ? 'Hide OEM' : 'View OEM'}
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                  ) : null}
                                  {product.syncStatus === 'pending' && product.syncMessage && (
                                    <div className="mt-1 truncate text-[10px] text-amber-700">
                                      {product.syncMessage}
                                    </div>
                                  )}
                                </div>
                                <div className="text-[12px] font-semibold text-[#1A1A1A]">
                                  {product.quantity}
                                </div>
                                <div className="text-[12px] text-slate-600">
                                  {product.unit || 'pcs'}
                                </div>
                                <div className="text-[12px] font-semibold text-[#D82018]">
                                  ${(Number(product.targetPrice || 0)).toFixed(2)}
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditProduct(product)}
                                    className={`h-8 w-8 ${
                                      editingProductId === product.id
                                        ? 'text-blue-700 hover:bg-blue-50 hover:text-blue-800'
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="submit"
                                    form={formId}
                                    variant="ghost"
                                    size="icon"
                                    disabled={editingProductId !== product.id || isGeneratingModelNo}
                                    className={`h-8 w-8 ${
                                      editingProductId === product.id
                                        ? 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    <RefreshCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveProduct?.(product.id)}
                                    className="h-8 w-8 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {isOemProduct && isExpanded ? (
                                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4">
                                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
                                    <section className="space-y-3">
                                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                        OEM Files
                                      </div>
                                      {itemOem.files.length > 0 ? (
                                        <div className="space-y-2">
                                          {itemOem.files.map((file: any, fileIndex: number) => (
                                            <div key={file.id} className="rounded-md border border-slate-200 bg-white px-3 py-2">
                                              <div className="text-[13px] font-semibold text-slate-800">
                                                {fileIndex + 1}. {file.fileName}
                                              </div>
                                              <div className="mt-1 text-[11px] text-slate-500">
                                                {file.fileType || 'Unknown type'} · {(Number(file.fileSize || 0) / 1024).toFixed(1)} KB
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-[12px] text-slate-500">
                                          No OEM files attached.
                                        </div>
                                      )}
                                    </section>

                                    <div className="space-y-4">
                                      <section>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                          Specifications / Description
                                        </div>
                                        <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-[12px] leading-6 text-slate-700 whitespace-pre-wrap">
                                          {itemOem.overallRequirementNote || 'No OEM description provided.'}
                                        </div>
                                      </section>

                                      <section>
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                                          Mold / Quantity Plan
                                        </div>
                                        <div className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-[12px] leading-6 text-slate-700">
                                          {itemOem.tooling.toolingCostInvolved ? (
                                            <>
                                              <div>1st order quantity: {itemOem.tooling.firstOrderQuantity || '-'}</div>
                                              <div>Annual quantity: {itemOem.tooling.annualQuantity || '-'}</div>
                                              <div>3-year Quantity: {itemOem.tooling.quantityWithinThreeYears || '-'}</div>
                                              <div>Mold lifetime: {itemOem.tooling.moldLifetime || '-'}</div>
                                            </>
                                          ) : (
                                            <div>No mold / quantity plan submitted.</div>
                                          )}
                                        </div>
                                      </section>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
