import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';

interface ManualProductEntryProps {
  onAddProduct: (product: any) => void;
  onCancel: () => void;
}

export function ManualProductEntry({
  onAddProduct,
  onCancel,
}: ManualProductEntryProps) {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    unit: 'pcs',
    targetPrice: '',
    specifications: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productName.trim()) {
      toast.error('Please enter product name');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }

    const product = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productName: formData.productName.trim(),
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : 0,
      specifications: formData.specifications.trim(),
      source: 'manual' as const,
    };

    onAddProduct(product);

    // Reset form
    setFormData({
      productName: '',
      quantity: '',
      unit: 'pcs',
      targetPrice: '',
      specifications: '',
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
      <Card className="max-w-2xl mx-auto border-2">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#2E7D32] rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-[#1A1A1A] text-lg">Manual Product Entry</h3>
              <p className="text-sm text-gray-600">Enter product details manually</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product Name */}
            <div>
              <Label htmlFor="productName" className="text-sm font-medium text-gray-700 mb-2 block">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="productName"
                placeholder="Enter product name..."
                value={formData.productName}
                onChange={(e) => handleChange('productName', e.target.value)}
                className="border-2"
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700 mb-2 block">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', e.target.value)}
                  min="1"
                  step="1"
                  className="border-2"
                />
              </div>
              <div>
                <Label htmlFor="unit" className="text-sm font-medium text-gray-700 mb-2 block">
                  Unit
                </Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                  className="w-full h-10 px-3 border-2 border-gray-300 rounded-md text-sm focus:border-[#F96302] focus:outline-none"
                >
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="sets">Sets</option>
                  <option value="boxes">Boxes</option>
                  <option value="cartons">Cartons</option>
                  <option value="pairs">Pairs</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="m">Meters (m)</option>
                  <option value="sqm">Square Meters (sqm)</option>
                </select>
              </div>
            </div>

            {/* Target Price */}
            <div>
              <Label htmlFor="targetPrice" className="text-sm font-medium text-gray-700 mb-2 block">
                Target Price (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  id="targetPrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.targetPrice}
                  onChange={(e) => handleChange('targetPrice', e.target.value)}
                  min="0"
                  step="0.01"
                  className="pl-7 border-2"
                />
              </div>
            </div>

            {/* Specifications */}
            <div>
              <Label htmlFor="specifications" className="text-sm font-medium text-gray-700 mb-2 block">
                Specifications / Description
              </Label>
              <Textarea
                id="specifications"
                placeholder="Enter product specifications, description, or special requirements..."
                value={formData.specifications}
                onChange={(e) => handleChange('specifications', e.target.value)}
                rows={4}
                className="border-2 resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-[#2E7D32] hover:bg-[#256428]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-2"
              >
                Back
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> After adding a product, you can continue to add more products 
              or switch to other methods (History or Website) to build your complete inquiry.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
