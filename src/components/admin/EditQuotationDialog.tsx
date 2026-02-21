import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Trash2, Save, Send, Eye } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Quotation } from './QuotationManagement';
import QuotationTemplate from './QuotationTemplate';
import QuotationTemplateA4 from './QuotationTemplateA4'; // 🔥 导入A4标准版本

interface EditQuotationDialogProps {
  quotation: Quotation | null;
  open: boolean;
  onClose: () => void;
  onSave: (quotation: Quotation) => void;
  onSend: (quotation: Quotation) => void; // 改为直接发送
}

export default function EditQuotationDialog({
  quotation,
  open,
  onClose,
  onSave,
  onSend // 改为直接发送
}: EditQuotationDialogProps) {
  const [formData, setFormData] = useState<Quotation | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (quotation) {
      setFormData({ ...quotation });
    }
  }, [quotation]);

  if (!formData) return null;

  // 更新产品单价
  const updateProductPrice = (index: number, unitPrice: number) => {
    const newProducts = [...formData.products];
    newProducts[index].unitPrice = unitPrice;
    newProducts[index].totalPrice = unitPrice * newProducts[index].quantity;
    
    // 重新计算总额
    const subtotal = newProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    const totalAmount = subtotal - formData.discount + formData.tax;
    
    setFormData({
      ...formData,
      products: newProducts,
      subtotal,
      totalAmount
    });
  };

  // 更新折扣
  const updateDiscount = (discount: number) => {
    const totalAmount = formData.subtotal - discount + formData.tax;
    setFormData({
      ...formData,
      discount,
      totalAmount
    });
  };

  // 保存草稿
  const handleSave = () => {
    // 验证是否所有产品都有价格
    const hasZeroPrice = formData.products.some(p => p.unitPrice === 0);
    if (hasZeroPrice) {
      toast.warning('提醒', {
        description: '部分产品还未填写单价，已保存为草稿',
        duration: 3000
      });
    }
    
    onSave(formData);
    toast.success('保存成功！', {
      description: '报价已保存为草稿',
      duration: 2000
    });
  };

  // 直接发送给客户（去除审核环节）
  const handleSendToCustomer = () => {
    // 验证必填字段
    const hasZeroPrice = formData.products.some(p => p.unitPrice === 0);
    if (hasZeroPrice) {
      toast.error('无法发送报价', {
        description: '请为所有产品填写单价后再发送',
        duration: 3000
      });
      return;
    }

    if (formData.totalAmount === 0) {
      toast.error('无法发送报价', {
        description: '报价总额不能为0',
        duration: 3000
      });
      return;
    }

    // 🔥 关键修复：清除旧的customerFeedback，让客户能够重新响应修改后的报价
    const updatedFormData = {
      ...formData,
      customerFeedback: undefined // 清除旧反馈
    };

    console.log('🔥 [EditQuotationDialog] 发送报价前清除customerFeedback');
    console.log('  - 原始formData.customerFeedback:', formData.customerFeedback);
    console.log('  - 清除后:', updatedFormData.customerFeedback);

    onSend(updatedFormData);
    toast.success('发送成功！', {
      description: '报价已发送给客户，并已发送邮件通知',
      duration: 3000
    });
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showPreview} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">编辑报价 - {formData.quotationNumber}</DialogTitle>
            <DialogDescription className="text-sm">编辑报价单并保存或发送给客户</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 基本信息 */}
            <Card className="p-4 bg-blue-50 border-blue-100">
              <h4 className="text-xs mb-3 text-gray-700">基本信息</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">客户名称</Label>
                  <Input 
                    value={formData.customerName} 
                    readOnly 
                    className="h-8 text-xs bg-white mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">客户邮箱</Label>
                  <Input 
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="h-8 text-xs mt-1" 
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">货币</Label>
                  <Select 
                    value={formData.currency} 
                    onValueChange={(v: any) => setFormData({ ...formData, currency: v })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* 产品清单 */}
            <Card className="p-4 border-gray-200">
              <h4 className="text-xs mb-3 text-gray-700">产品清单</h4>
              <div className="border border-gray-200 rounded">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-xs w-[30%]">产品名称</TableHead>
                      <TableHead className="text-xs w-[20%]">规格</TableHead>
                      <TableHead className="text-xs text-right w-[15%]">数量</TableHead>
                      <TableHead className="text-xs text-right w-[15%]">单价(USD)</TableHead>
                      <TableHead className="text-xs text-right w-[20%]">金额</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{product.name}</TableCell>
                        <TableCell className="text-xs text-gray-600">{product.specs}</TableCell>
                        <TableCell className="text-xs text-right">{product.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={product.unitPrice || ''}
                            onChange={(e) => updateProductPrice(index, parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-right"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          ${product.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 价格汇总 */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-96 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">小计:</span>
                      <span className="text-gray-900">${formData.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">折扣:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600">-$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.discount || ''}
                          onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0)}
                          className="h-7 w-32 text-xs text-right"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span>总计:</span>
                      <span className="text-lg text-green-600">
                        ${formData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {formData.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 交易条款 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">付款条款</h4>
                <Textarea
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="text-xs min-h-20"
                  placeholder="例如: 30% T/T预付，70%见提单副本付款"
                />
              </Card>
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">交货条款</h4>
                <Textarea
                  value={formData.deliveryTerms}
                  onChange={(e) => setFormData({ ...formData, deliveryTerms: e.target.value })}
                  className="text-xs min-h-20"
                  placeholder="例如: FOB Shenzhen, 15-20个工作日"
                />
              </Card>
            </div>

            {/* 有效期和备注 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">有效期至</h4>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="h-8 text-xs"
                />
              </Card>
              <Card className="p-4 border-gray-200">
                <h4 className="text-xs mb-2 text-gray-700">备注</h4>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="text-xs min-h-8"
                  placeholder="其他备注信息..."
                />
              </Card>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                预览报价单
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSave}
                >
                  <Save className="w-3.5 h-3.5 mr-1" />
                  保存草稿
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                  onClick={handleSendToCustomer}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  发送报价
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 预览报价单对话框 */}
      <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
        <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">报价单预览 - {formData.quotationNumber}</DialogTitle>
            <DialogDescription className="text-sm">预览并打印/导出报价单</DialogDescription>
          </DialogHeader>
          <QuotationTemplateA4 quotation={formData} /> {/* 🔥 使用A4标准版本 */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowPreview(false)}
            >
              返回编辑
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-green-600 hover:bg-green-700"
              onClick={() => {
                window.print();
              }}
            >
              打印/导出PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}