import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Search, Calendar, Package, Check, History } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useInquiry } from '../../contexts/InquiryContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { getCustomerFacingModelNo } from '../../utils/productModelDisplay';

interface InquiryHistorySelectorProps {
  onSelectProducts: (products: any[]) => void;
  onCancel: () => void;
}

const PRODUCT_ROW_GRID_TEMPLATE = '28px 88px 56px minmax(180px,1fr) 88px 64px 100px 120px';

const HISTORY_SELECTOR_STYLE = {
  shell: 'h-full bg-slate-50/40 px-8 py-6',
  body: 'mx-auto flex h-full min-h-0 w-full max-w-[960px] flex-col gap-4',
  sectionTitle: 'flex items-center gap-2 text-[14px] font-semibold tracking-tight text-[#1A1A1A]',
  panel: 'flex min-h-0 flex-1 overflow-hidden border border-slate-200 bg-white',
  leftCol: 'flex w-[225px] flex-shrink-0 flex-col border-r border-slate-200 bg-slate-50/65',
  rightCol: 'flex min-w-0 flex-col overflow-hidden bg-white',
  footer: 'flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4',
} as const;

export function InquiryHistorySelector({
  onSelectProducts,
  onCancel,
}: InquiryHistorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const { user } = useUser();
  const { getUserInquiries, getCompanyInquiries } = useInquiry();

  const companyId =
    (() => {
      try {
        const raw = localStorage.getItem('cosun_current_user');
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.companyId || parsed?.company_id || parsed?.org_id || null;
      } catch {
        return null;
      }
    })();

  const byCompany = companyId ? getCompanyInquiries(companyId) : [];
  const byUser = user ? getUserInquiries(user.email) : [];
  const inquiries = (() => {
    const map = new Map<string, any>();
    for (const inquiry of [...byCompany, ...byUser]) {
      if (!inquiry?.id) continue;
      map.set(inquiry.id, inquiry);
    }
    return Array.from(map.values());
  })();

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchLower = searchQuery.toLowerCase();
    const hasMatchingProduct = inquiry.products?.some((product: any) =>
      product.productName?.toLowerCase().includes(searchLower)
    );

    return inquiry.id.toLowerCase().includes(searchLower) || hasMatchingProduct;
  });

  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedInquiryId);
  const selectedInquiryNumber =
    selectedInquiry?.inquiryNumber ||
    selectedInquiry?.inquiry_number ||
    selectedInquiry?.inquiryNo ||
    selectedInquiry?.id;

  const handleToggleProduct = (productId: string) => {
    const next = new Set(selectedProductIds);
    if (next.has(productId)) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setSelectedProductIds(next);
  };

  const handleSelectAll = () => {
    if (!selectedInquiry) return;

    if (selectedProductIds.size === selectedInquiry.products.length) {
      setSelectedProductIds(new Set());
      return;
    }

    const allIds = selectedInquiry.products.map((_: any, index: number) => `${selectedInquiry.id}-product-${index}`);
    setSelectedProductIds(new Set(allIds));
  };

  const handleConfirm = () => {
    if (!selectedInquiry || selectedProductIds.size === 0) return;

    const selectedProducts = selectedInquiry.products
      .map((product: any, index: number) => ({
        ...product,
        id: `history-${selectedInquiry.id}-${index}-${Date.now()}`,
        originalInquiryId: selectedInquiry.id,
      }))
      .filter((_: any, index: number) => selectedProductIds.has(`${selectedInquiry.id}-product-${index}`));

    onSelectProducts(selectedProducts);
  };

  return (
    <div className={HISTORY_SELECTOR_STYLE.shell}>
      <div className={HISTORY_SELECTOR_STYLE.body}>
        <div className={HISTORY_SELECTOR_STYLE.sectionTitle}>
          <History className="h-4.5 w-4.5 text-[#F96302]" />
          <span>Inquiry History</span>
        </div>

        <div className={HISTORY_SELECTOR_STYLE.panel}>
          <div className={HISTORY_SELECTOR_STYLE.leftCol}>
            <div className="border-b border-slate-200 bg-white px-4 py-4">
              <div className="mb-3">
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  History List
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 border-slate-200 bg-slate-50 pl-10"
                />
              </div>
              <div className="mt-3 text-[12px] text-slate-500">
                {filteredInquiries.length} records
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-200">
                {filteredInquiries.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-sm">No inquiries found</p>
                  </div>
                ) : (
                  filteredInquiries.map((inquiry) => (
                    <button
                      type="button"
                      key={inquiry.id}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        selectedInquiryId === inquiry.id
                          ? 'bg-orange-50/60'
                          : 'bg-transparent hover:bg-slate-50/70'
                      }`}
                      onClick={() => {
                        setSelectedInquiryId(inquiry.id);
                        setSelectedProductIds(new Set());
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          selectedInquiryId === inquiry.id ? 'bg-[#F96302]' : 'bg-slate-300'
                        }`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-[13px] font-semibold leading-5 text-[#1A1A1A]">
                                {inquiry.inquiryNumber || inquiry.inquiry_number || inquiry.inquiryNo || inquiry.id}
                              </h4>
                              <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-500">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{inquiry.date}</span>
                              </div>
                            </div>
                            <Badge variant="secondary" className="rounded-md px-1.5 py-0.5 text-[11px]">
                              {inquiry.products?.length || 0} items
                            </Badge>
                          </div>
                          <div className="mt-1.5">
                            <p className="line-clamp-1 text-[12px] leading-5 text-slate-600">
                              {inquiry.products?.[0]?.productName || 'No products'}
                              {inquiry.products?.length > 1 && ` +${inquiry.products.length - 1} more`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className={HISTORY_SELECTOR_STYLE.rightCol}>
            <div className="border-b border-slate-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Product Details
                  </div>
                  <h3 className="mt-1 truncate text-[16px] font-semibold text-[#1A1A1A]">
                    {selectedInquiryNumber || 'Select a source inquiry'}
                  </h3>
                  <p className="mt-1 text-[12px] text-slate-600">
                    {selectedInquiry
                      ? 'Select products to copy into the new inquiry.'
                      : 'Choose one record from the left to open its product details.'}
                  </p>
                </div>
                {selectedInquiry && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 border-slate-300 bg-white px-3 text-[12px] text-slate-800 hover:bg-slate-50"
                    >
                      {selectedProductIds.size === selectedInquiry.products.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                    <Badge className="rounded-md bg-[#F96302] px-2 py-1 text-[12px]">
                      {selectedProductIds.size} selected
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50/40 px-6 py-4">
              {selectedInquiry ? (
                <>
                  <div className="w-full min-w-0 overflow-x-auto border border-slate-200 bg-white">
                    <div className="min-w-[920px] max-w-none">
                      <div
                        className="grid items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                        style={{ gridTemplateColumns: PRODUCT_ROW_GRID_TEMPLATE }}
                      >
                        <div />
                        <div>Model#</div>
                        <div>Image</div>
                        <div>Product</div>
                        <div>Qty</div>
                        <div>Unit</div>
                        <div>Unit Price</div>
                        <div>Subtotal</div>
                      </div>
                      {selectedInquiry.products.map((product: any, index: number) => {
                        const productId = `${selectedInquiry.id}-product-${index}`;
                        const isSelected = selectedProductIds.has(productId);
                        const modelText = getCustomerFacingModelNo(product) || '-';
                        const unitText = product.unit || 'pcs';
                        const quantity = Number(product.quantity ?? 0);
                        const unitPrice = Number(product.targetPrice ?? 0);
                        const subtotal = quantity * unitPrice;

                        return (
                          <button
                            type="button"
                            key={productId}
                            className={`w-full border-b border-slate-200 px-4 py-2.5 text-left transition-colors last:border-b-0 ${
                              isSelected
                                ? 'bg-orange-50/60'
                                : 'bg-white hover:bg-slate-50/70'
                            }`}
                            onClick={() => handleToggleProduct(productId)}
                          >
                            <div
                              className="grid items-center gap-3"
                              style={{ gridTemplateColumns: PRODUCT_ROW_GRID_TEMPLATE }}
                            >
                              <div className="flex justify-start">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleProduct(productId)}
                                  className="flex-shrink-0"
                                />
                              </div>

                              <div className="truncate text-[12px] font-medium text-slate-600">
                                {modelText}
                              </div>

                              <div className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">
                                {product.image ? (
                                  <ImageWithFallback
                                    src={product.image}
                                    alt={product.productName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h4 className="truncate text-[13px] font-semibold text-[#1A1A1A]">
                                  {product.productName}
                                </h4>
                                {product.specifications && (
                                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                    {product.specifications}
                                  </p>
                                )}
                              </div>

                              <div className="text-[12px] text-slate-700">
                                <div className="font-semibold text-[#1A1A1A]">{quantity}</div>
                              </div>

                              <div className="text-[12px] text-slate-600">
                                {unitText}
                              </div>

                              <div className="text-[12px] font-semibold text-[#D82018]">
                                ${unitPrice.toFixed(2)}
                              </div>

                              <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-[#1A1A1A]">
                                <span>${subtotal.toFixed(2)}</span>
                                {isSelected && (
                                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F96302]">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="font-medium">No inquiry selected</p>
                    <p className="mt-1 text-sm">Select an inquiry from the left to view products</p>
                  </div>
                </div>
              )}
            </div>

            <div className={HISTORY_SELECTOR_STYLE.footer}>
              <div className="text-[12px] text-slate-600">
                {selectedInquiry ? (
                  selectedProductIds.size > 0 ? (
                    <span>
                      <strong>{selectedProductIds.size}</strong> products ready to copy
                    </span>
                  ) : (
                    <span>Select one or more products from the detail list</span>
                  )
                ) : (
                  <span>Choose a history record to start copying products</span>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="h-10 border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedInquiry || selectedProductIds.size === 0}
                  className="h-10 bg-[#F96302] hover:bg-[#E05502]"
                >
                  Add {selectedProductIds.size} Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
