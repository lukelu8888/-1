import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Search, Calendar, Package, Check } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useInquiry } from '../../contexts/InquiryContext';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface InquiryHistorySelectorProps {
  onSelectProducts: (products: any[]) => void;
  onCancel: () => void;
}

export function InquiryHistorySelector({
  onSelectProducts,
  onCancel,
}: InquiryHistorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const { user } = useUser();
  const { getUserInquiries, getCompanyInquiries } = useInquiry();

  // Prefer a union of company + user inquiries to avoid missing records
  const companyId =
    (() => {
      try {
        const raw = localStorage.getItem('cosun_current_user');
        if (!raw) return null;
        const u = JSON.parse(raw);
        return u?.companyId || u?.company_id || u?.org_id || null;
      } catch {
        return null;
      }
    })();

  const byCompany = companyId ? getCompanyInquiries(companyId) : [];
  const byUser = user ? getUserInquiries(user.email) : [];
  const inquiries = (() => {
    const map = new Map<string, any>();
    for (const inq of [...byCompany, ...byUser]) {
      if (!inq?.id) continue;
      map.set(inq.id, inq);
    }
    return Array.from(map.values());
  })();

  // Filter inquiries
  const filteredInquiries = inquiries.filter(inquiry => {
    const searchLower = searchQuery.toLowerCase();
    const hasMatchingProduct = inquiry.products?.some((p: any) =>
      p.productName?.toLowerCase().includes(searchLower)
    );
    return (
      inquiry.id.toLowerCase().includes(searchLower) ||
      hasMatchingProduct
    );
  });

  const selectedInquiry = inquiries.find(i => i.id === selectedInquiryId);

  const handleToggleProduct = (productId: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(productId)) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    setSelectedProductIds(newSet);
  };

  const handleSelectAll = () => {
    if (!selectedInquiry) return;
    
    if (selectedProductIds.size === selectedInquiry.products.length) {
      // Deselect all
      setSelectedProductIds(new Set());
    } else {
      // Select all
      const allIds = selectedInquiry.products.map((p: any, idx: number) => 
        `${selectedInquiry.id}-product-${idx}`
      );
      setSelectedProductIds(new Set(allIds));
    }
  };

  const handleConfirm = () => {
    if (!selectedInquiry || selectedProductIds.size === 0) return;

    const selectedProducts = selectedInquiry.products
      .map((p: any, idx: number) => ({
        ...p,
        id: `history-${selectedInquiry.id}-${idx}-${Date.now()}`,
        originalInquiryId: selectedInquiry.id,
      }))
      .filter((_: any, idx: number) => 
        selectedProductIds.has(`${selectedInquiry.id}-product-${idx}`)
      );

    onSelectProducts(selectedProducts);
  };

  return (
    <div className="h-full flex">
      {/* Left - Inquiry List */}
      <div className="w-1/3 border-r bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b bg-white sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search inquiries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="p-4 space-y-2">
          {filteredInquiries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">No inquiries found</p>
            </div>
          ) : (
            filteredInquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedInquiryId === inquiry.id
                    ? 'border-2 border-[#F96302] shadow-md'
                    : 'border-2 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedInquiryId(inquiry.id);
                  setSelectedProductIds(new Set());
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{inquiry.date}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {inquiry.products?.length || 0} items
                  </Badge>
                </div>
                <h4 className="font-medium text-sm text-[#1A1A1A] mb-1">
                  {inquiry.id}
                </h4>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {inquiry.products?.[0]?.productName || 'No products'}
                  {inquiry.products?.length > 1 && ` +${inquiry.products.length - 1} more`}
                </p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Right - Product Selection */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedInquiry ? (
          <>
            {/* Header - Fixed */}
            <div className="p-6 border-b bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[#1A1A1A] text-lg">
                    {selectedInquiry.id}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Select products to copy to new inquiry
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-2"
                  >
                    {selectedProductIds.size === selectedInquiry.products.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                  <Badge className="bg-[#F96302]">
                    {selectedProductIds.size} selected
                  </Badge>
                </div>
              </div>
            </div>

            {/* Product List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {selectedInquiry.products.map((product: any, index: number) => {
                  const productId = `${selectedInquiry.id}-product-${index}`;
                  const isSelected = selectedProductIds.has(productId);

                  return (
                    <Card
                      key={productId}
                      className={`p-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-[#F96302] bg-orange-50'
                          : 'border-2 hover:border-gray-300'
                      }`}
                      onClick={() => handleToggleProduct(productId)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleProduct(productId)}
                          className="flex-shrink-0"
                        />

                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <ImageWithFallback
                              src={product.image}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-[#1A1A1A] truncate mb-1">
                            {product.productName}
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>Qty: {product.quantity} {product.unit}</span>
                            <span>•</span>
                            <span>Target: ${product.targetPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                          {product.specifications && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {product.specifications}
                            </p>
                          )}
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-[#F96302] rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Footer - Fixed */}
            <div className="p-6 border-t bg-white flex-shrink-0">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="border-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={selectedProductIds.size === 0}
                  className="bg-[#F96302] hover:bg-[#E05502]"
                >
                  Add {selectedProductIds.size} Products
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="font-medium">No inquiry selected</p>
              <p className="text-sm mt-1">Select an inquiry from the left to view products</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}