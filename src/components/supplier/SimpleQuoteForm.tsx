import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AlertCircle, Calculator, DollarSign, Clock, Package } from 'lucide-react';

interface SimpleQuoteFormProps {
  xj: any;
  initialData?: any;
  onSubmit: (data: any, type: 'draft' | 'submit') => void;
  onCancel?: () => void;
}

export function SimpleQuoteForm({ xj, initialData, onSubmit, onCancel }: SimpleQuoteFormProps) {
  const [formData, setFormData] = useState({
    unitPrice: initialData?.unitPrice || '',
    currency: initialData?.currency || 'CNY', // 默认人民币
    leadTime: initialData?.leadTime || '',
    moq: initialData?.moq || '',
    validityDays: initialData?.validityDays || '30',
    paymentTerms: initialData?.paymentTerms || 'T/T 30% deposit, 70% before shipment',
    remarks: initialData?.remarks || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔥 货币符号映射
  const currencySymbol: Record<string, string> = {
    'CNY': '¥',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥'
  };

  // 🔥 计算总金额
  const totalAmount = xj.items?.[0]?.quantity 
    ? (parseFloat(formData.unitPrice) || 0) * xj.items[0].quantity 
    : 0;

  // 🔥 比较目标价格
  const targetPrice = xj.items?.[0]?.targetPrice || 0;
  const priceDifference = formData.unitPrice 
    ? ((parseFloat(formData.unitPrice) - targetPrice) / targetPrice * 100).toFixed(1)
    : null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      newErrors.unitPrice = '请输入有效的单价';
    }
    
    if (!formData.leadTime || parseInt(formData.leadTime) <= 0) {
      newErrors.leadTime = '请输入有效的交货周期';
    }
    
    if (!formData.moq || parseInt(formData.moq) <= 0) {
      newErrors.moq = '请输入有效的最小订购量';
    }
    
    if (!formData.validityDays || parseInt(formData.validityDays) <= 0) {
      newErrors.validityDays = '请输入有效的报价有效期';
    }
    
    if (!formData.paymentTerms.trim()) {
      newErrors.paymentTerms = '请输入付款条款';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (type: 'draft' | 'submit') => {
    if (type === 'submit' && !validateForm()) {
      return;
    }
    
    onSubmit(formData, type);
  };

  return (
    <div className="space-y-6">
      {/* 采购询价基本信息 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            询价单信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-600">询价单号：</span>
              <span className="font-semibold">{xj.xjNumber}</span>
            </div>
            <div>
              <span className="text-slate-600">截止日期：</span>
              <span className="font-semibold text-orange-600">{xj.quotationDeadline}</span>
            </div>
          </div>
          
          {xj.items && xj.items.length > 0 && (
            <div className="border-t border-blue-200 pt-2 mt-2">
              <p className="text-xs text-slate-600 mb-1">产品清单</p>
              {xj.items.map((item: any, idx: number) => (
                <div key={idx} className="bg-white p-2 rounded border border-blue-100 mb-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.modelNo}</p>
                      {item.specification && (
                        <p className="text-xs text-slate-500">{item.specification}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.quantity} {item.unit}</p>
                      {item.targetPrice && (
                        <p className="text-xs text-slate-500">目标价: ${item.targetPrice}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 报价表单 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            报价信息
          </CardTitle>
          <CardDescription className="text-xs">请填写您的报价详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 单价 - 货币选择器 */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-xs">
                报价币种 <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="选择币种" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                  <SelectItem value="USD">美元 (USD)</SelectItem>
                  <SelectItem value="EUR">欧元 (EUR)</SelectItem>
                  <SelectItem value="GBP">英镑 (GBP)</SelectItem>
                  <SelectItem value="JPY">日元 (JPY)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 单价 - 价格输入 */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice" className="text-xs">
                单价 <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className={`pl-9 ${errors.unitPrice ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.unitPrice && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.unitPrice}
                </p>
              )}
              {priceDifference !== null && (
                <p className={`text-xs ${parseFloat(priceDifference) < 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {parseFloat(priceDifference) < 0 ? '✓ ' : '⚠ '}
                  {parseFloat(priceDifference) < 0 ? '低于' : '高于'}目标价 {Math.abs(parseFloat(priceDifference))}%
                </p>
              )}
            </div>

            {/* 交货周期 */}
            <div className="space-y-2">
              <Label htmlFor="leadTime" className="text-xs">
                交货周期 (天) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="leadTime"
                  type="number"
                  placeholder="30"
                  value={formData.leadTime}
                  onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                  className={`pl-9 ${errors.leadTime ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.leadTime && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.leadTime}
                </p>
              )}
            </div>

            {/* 最小订购量 */}
            <div className="space-y-2">
              <Label htmlFor="moq" className="text-xs">
                最小订购量 (MOQ) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="moq"
                  type="number"
                  placeholder="1000"
                  value={formData.moq}
                  onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  className={`pl-9 ${errors.moq ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.moq && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.moq}
                </p>
              )}
            </div>

            {/* 报价有效期 */}
            <div className="space-y-2">
              <Label htmlFor="validityDays" className="text-xs">
                报价有效期 (天) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="validityDays"
                type="number"
                placeholder="30"
                value={formData.validityDays}
                onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                className={errors.validityDays ? 'border-red-500' : ''}
              />
              {errors.validityDays && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.validityDays}
                </p>
              )}
            </div>
          </div>

          {/* 付款条款 */}
          <div className="space-y-2">
            <Label htmlFor="paymentTerms" className="text-xs">
              付款条款 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="paymentTerms"
              placeholder="T/T 30% deposit, 70% before shipment"
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className={errors.paymentTerms ? 'border-red-500' : ''}
            />
            {errors.paymentTerms && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.paymentTerms}
              </p>
            )}
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-xs">备注说明</Label>
            <Textarea
              id="remarks"
              placeholder="其他说明或特殊条款..."
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 报价摘要 */}
      {formData.unitPrice && xj.items?.[0]?.quantity && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">报价摘要</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">单价</span>
              <span className="font-semibold">{currencySymbol[formData.currency]}{parseFloat(formData.unitPrice).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">数量</span>
              <span className="font-semibold">{xj.items[0].quantity.toLocaleString()} {xj.items[0].unit}</span>
            </div>
            <div className="border-t border-green-200 pt-2 flex items-center justify-between">
              <span className="font-semibold">总金额</span>
              <span className="text-lg font-bold text-green-700">{currencySymbol[formData.currency]}{totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
        >
          保存草稿
        </Button>
        <Button
          className="bg-orange-600 hover:bg-orange-700"
          onClick={() => handleSubmit('submit')}
        >
          提交报价
        </Button>
      </div>
    </div>
  );
}