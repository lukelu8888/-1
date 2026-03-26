import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface QuotationProductRow {
  no: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface QuotationProductsEditorPanelProps {
  products: QuotationProductRow[];
  onUpdateProductName: (index: number, value: string) => void;
  onUpdateQuantity: (index: number, value: number) => void;
  onUpdateUnitPrice: (index: number, value: number) => void;
}

export function QuotationProductsEditorPanel({
  products,
  onUpdateProductName,
  onUpdateQuantity,
  onUpdateUnitPrice,
}: QuotationProductsEditorPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="mb-3 text-xs font-semibold text-gray-900">报价产品</p>
      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-gray-500">产品名称</Label>
                <Input
                  value={product.productName}
                  onChange={(e) => onUpdateProductName(index, e.target.value)}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-gray-500">数量</Label>
                  <Input
                    type="number"
                    value={product.quantity}
                    onChange={(e) => onUpdateQuantity(index, Number(e.target.value) || 0)}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">单价</Label>
                  <Input
                    type="number"
                    value={product.unitPrice}
                    onChange={(e) => onUpdateUnitPrice(index, Number(e.target.value) || 0)}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
