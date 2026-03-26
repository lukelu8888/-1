import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';

interface XjProductRow {
  no: number;
  description: string;
  specification: string;
  quantity: number;
  targetPrice?: string;
}

interface XjProductsEditorPanelProps {
  products: XjProductRow[];
  onUpdateDescription: (index: number, value: string) => void;
  onUpdateSpecification: (index: number, value: string) => void;
  onUpdateQuantity: (index: number, value: number) => void;
  onUpdateTargetPrice: (index: number, value: string) => void;
}

export function XjProductsEditorPanel({
  products,
  onUpdateDescription,
  onUpdateSpecification,
  onUpdateQuantity,
  onUpdateTargetPrice,
}: XjProductsEditorPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="mb-3 text-xs font-semibold text-gray-900">产品清单</p>
      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
            <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
            <div className="space-y-2">
              <div>
                <Label className="text-[11px] text-gray-500">产品名称</Label>
                <Input
                  value={product.description}
                  onChange={(e) => onUpdateDescription(index, e.target.value)}
                  className="mt-1 h-7 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px] text-gray-500">规格</Label>
                <Textarea
                  value={product.specification}
                  onChange={(e) => onUpdateSpecification(index, e.target.value)}
                  className="mt-1 min-h-[52px] text-xs"
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
                  <Label className="text-[11px] text-gray-500">目标价格</Label>
                  <Input
                    value={product.targetPrice || ''}
                    onChange={(e) => onUpdateTargetPrice(index, e.target.value)}
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
