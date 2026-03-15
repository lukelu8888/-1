import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CreateInquiryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateInquiry: (inquiry: any) => void;
}

export default function CreateInquiryDialog({ isOpen, onClose, onCreateInquiry }: CreateInquiryDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [region, setRegion] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState<Array<{ name: string; quantity: string; specs: string }>>([
    { name: '', quantity: '', specs: '' }
  ]);

  const handleAddProduct = () => {
    setProducts([...products, { name: '', quantity: '', specs: '' }]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleSubmit = () => {
    // 验证
    if (!customerName || !customerEmail || !region) {
      toast.error('请填写必填项', { description: '客户名称、邮箱和区域为必填项' });
      return;
    }

    const validProducts = products.filter(p => p.name && p.quantity);
    if (validProducts.length === 0) {
      toast.error('请至少添加一个产品');
      return;
    }

    const inquiry = {
      id: `ING-${Date.now()}`,
      inquiryNumber: `ING-2025-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      customerName,
      customerEmail,
      customerPhone,
      region,
      products: validProducts.map(p => ({
        name: p.name,
        quantity: parseInt(p.quantity),
        specs: p.specs
      })),
      message,
      inquiryDate: new Date().toISOString().split('T')[0],
      status: 'pending' as const,
      priority,
      source: 'manual' as const, // 手动创建
      createdBy: 'Admin',
      createdAt: new Date().toISOString()
    };

    onCreateInquiry(inquiry);
    
    // 重置表单
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setRegion('');
    setPriority('medium');
    setMessage('');
    setProducts([{ name: '', quantity: '', specs: '' }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">创建询价单</DialogTitle>
          <DialogDescription className="text-xs">
            手动为客户创建询价，系统将自动生成询价编号
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 客户信息 */}
          <Card className="p-4 bg-blue-50 border-blue-100">
            <h4 className="text-xs mb-3 text-gray-700">客户信息</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-700">客户名称 *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="请输入客户公司名称"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-700">联系邮箱 *</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@company.com"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-700">联系电话</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 555-0123"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-700">区域 *</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="北美">北美 (North America)</SelectItem>
                    <SelectItem value="南美">南美 (South America)</SelectItem>
                    <SelectItem value="欧洲">欧洲 (Europe)</SelectItem>
                    <SelectItem value="非洲">非洲 (Africa)</SelectItem>
                    <SelectItem value="亚洲">亚洲 (Asia)</SelectItem>
                    <SelectItem value="大洋洲">大洋洲 (Oceania)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-700">优先级</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高优先级</SelectItem>
                    <SelectItem value="medium">中优先级</SelectItem>
                    <SelectItem value="low">低优先级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* 产品清单 */}
          <Card className="p-4 border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs text-gray-700">产品清单</h4>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-xs"
                onClick={handleAddProduct}
              >
                <Plus className="w-3 h-3 mr-1" />
                添加产品
              </Button>
            </div>
            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded">
                  <div className="col-span-4 space-y-1.5">
                    <Label className="text-xs text-gray-600">产品名称 *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      placeholder="产品名称"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-gray-600">数量 *</Label>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                      placeholder="1000"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-5 space-y-1.5">
                    <Label className="text-xs text-gray-600">规格说明</Label>
                    <Input
                      value={product.specs}
                      onChange={(e) => handleProductChange(index, 'specs', e.target.value)}
                      placeholder="规格、材质等"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    {products.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 备注信息 */}
          <Card className="p-4 border-gray-200">
            <div className="space-y-2">
              <Label className="text-xs text-gray-700">备注信息</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="客户的特殊要求、交期需求、价格敏感度等..."
                className="text-xs min-h-[80px]"
              />
            </div>
          </Card>

          {/* 提示信息 */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="mb-1">创建询价单后，系统将：</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>自动生成询价编号</li>
                <li>标记为"待处理"状态</li>
                <li>记录创建人和创建时间</li>
                <li>可直接进入报价流程</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">
            取消
          </Button>
          <Button onClick={handleSubmit} className="h-9 text-xs bg-blue-600 hover:bg-blue-700">
            创建询价单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
