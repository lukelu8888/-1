import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Save, Send, FileText, Printer, Download, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import QuotationDocument from './QuotationDocument';

interface QuoteFormProps {
  rfq: any;
  onSubmit: (quoteData: any, submitType: 'draft' | 'review' | 'direct') => void;
  initialData?: any;
}

const QuoteForm = memo(({ rfq, onSubmit, initialData }: QuoteFormProps) => {
  // 报价表单数据
  const [baseCost, setBaseCost] = useState(initialData?.baseCost || '');
  const [profitMargin, setProfitMargin] = useState(initialData?.profitMargin || '15');
  const [taxRate, setTaxRate] = useState(initialData?.taxRate || '13');
  const [validityDays, setValidityDays] = useState(initialData?.validityDays || '30');
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || 'net30');
  const [leadTime, setLeadTime] = useState(initialData?.leadTime || '');
  const [moq, setMOQ] = useState(initialData?.moq || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // 认证管理
  const [certifications, setCertifications] = useState<Array<{id: string, name: string, isCustom: boolean, checked: boolean}>>(
    initialData?.certifications || [
      { id: 'ce', name: 'CE', isCustom: false, checked: true },
      { id: 'rohs', name: 'RoHS', isCustom: false, checked: true },
      { id: 'ul', name: 'UL', isCustom: false, checked: true },
      { id: 'iso9001', name: 'ISO 9001', isCustom: false, checked: true },
      { id: 'iso14001', name: 'ISO 14001', isCustom: false, checked: true },
      { id: 'ccc', name: 'CCC (3C认证)', isCustom: false, checked: false },
      { id: 'fcc', name: 'FCC', isCustom: false, checked: false },
      { id: 'etl', name: 'ETL', isCustom: false, checked: false },
      { id: 'saa', name: 'SAA', isCustom: false, checked: false },
    ]
  );
  const [newCertification, setNewCertification] = useState('');
  
  // 添加自定义认证
  const handleAddCertification = () => {
    if (newCertification.trim()) {
      const newCert = {
        id: `custom-${Date.now()}`,
        name: newCertification.trim(),
        isCustom: true,
        checked: true
      };
      setCertifications(prev => [...prev, newCert]);
      setNewCertification('');
    }
  };
  
  // 切换认证选中状态
  const toggleCertification = (id: string) => {
    setCertifications(prev => 
      prev.map(cert => 
        cert.id === id ? { ...cert, checked: !cert.checked } : cert
      )
    );
  };
  
  // 删除自定义认证
  const deleteCertification = (id: string) => {
    setCertifications(prev => prev.filter(cert => cert.id !== id));
  };

  // 使用 useMemo 优化价格计算
  const calculatedPrices = useMemo(() => {
    if (!baseCost || baseCost === '') {
      return {
        unitCostExclTax: 0,
        unitPriceExclTax: 0,
        unitPriceInclTax: 0
      };
    }

    const cost = parseFloat(baseCost);
    if (isNaN(cost)) {
      return {
        unitCostExclTax: 0,
        unitPriceExclTax: 0,
        unitPriceInclTax: 0
      };
    }

    const margin = parseFloat(profitMargin) / 100;
    const tax = parseFloat(taxRate) / 100;

    const priceExclTax = cost * (1 + margin);
    const priceInclTax = priceExclTax * (1 + tax);

    return {
      unitCostExclTax: cost.toFixed(2),
      unitPriceExclTax: priceExclTax.toFixed(2),
      unitPriceInclTax: priceInclTax.toFixed(2)
    };
  }, [baseCost, profitMargin, taxRate]);

  // 生成报价单数据
  const quotationData = useMemo(() => {
    const today = new Date();
    const validUntilDate = new Date(today);
    validUntilDate.setDate(validUntilDate.getDate() + parseInt(validityDays || '30'));

    return {
      quotationNo: initialData?.quotationNo || `COSUN-Q-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      rfqNo: rfq.id,
      date: today.toISOString().split('T')[0],
      validUntil: validUntilDate.toISOString().split('T')[0],
      
      supplierName: '福建高盛达富建材有限公司',
      supplierAddress: '中国福建省泉州市工业园区123号 362000',
      supplierContact: '销售部',
      supplierEmail: 'sales@cosun-building.com',
      supplierPhone: '+86-595-1234-5678',
      
      customerName: 'COSUN采购部',
      customerAddress: '',
      customerContact: '',
      
      productName: rfq.product,
      productCode: rfq.productCode || 'LED-PL-1200x300',
      specifications: rfq.specifications,
      hsCode: '9405.40.00',
      
      currency: 'CNY',
      unitPrice: calculatedPrices.unitPriceInclTax,
      moq: moq,
      
      priceTerms: 'FOB厦门',
      paymentTerms: paymentTerms === 'net30' ? '账期30天' : 
                     paymentTerms === 'net45' ? '账期45天' :
                     paymentTerms === 'net60' ? '账期60天' :
                     paymentTerms === '50_50' ? '50%预付款 + 50%发货前付款' :
                     '30%预付款 + 70%发货前付款',
      leadTime: leadTime,
      portOfLoading: '中国厦门港',
      portOfDestination: '根据买方要求',
      
      packingDetails: '每件独立包装于塑料袋中，然后装入标准出口纸箱，附带泡沫保护',
      cartonSize: '122 x 32 x 12 cm',
      grossWeight: '8.5 kg',
      netWeight: '7.8 kg',
      qtyPerCarton: '4 件',
      
      qualityStandard: '符合CE、RoHS和UL标准。所有产品在发货前经过100%质检。',
      certifications: certifications.filter(cert => cert.checked).map(cert => cert.name),
      warranty: '3年制造商质保，质保范围包括材料和工艺缺陷',
      inspection: '接受第三方验货（SGS/BV/TUV），验货费用由买方承担',
      
      samplePolicy: '样品可提供，¥50/件（大货订单可退还样品费）。样品交货期：5-7天。运费到付。',
      remarks: notes || '所有价格基于当前原材料成本，以最终确认为准。特殊包装、定制颜色或设计修改可能产生额外费用并影响交货期。下单前请确认所有规格要求。'
    };
  }, [rfq, validityDays, moq, leadTime, paymentTerms, notes, calculatedPrices, initialData, certifications]);

  const handleSubmit = useCallback((submitType: 'draft' | 'review' | 'direct') => {
    onSubmit({
      baseCost,
      profitMargin,
      taxRate,
      validityDays,
      paymentTerms,
      leadTime,
      moq,
      notes,
      certifications,  // 保存认证数据
      calculatedPrices,
      quotationData
    }, submitType);
  }, [baseCost, profitMargin, taxRate, validityDays, paymentTerms, leadTime, moq, notes, certifications, calculatedPrices, quotationData, onSubmit]);

  return (
    <div className="space-y-6 py-4">
      {/* 基础成本和定价 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. 成本与定价计算</CardTitle>
          <CardDescription>输入成本和利润率，系统自动计算报价</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base-cost">单位成本 (不含税) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">¥</span>
                <Input
                  id="base-cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={baseCost}
                  onChange={(e) => setBaseCost(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profit-margin">利润率 (%)</Label>
              <Input
                id="profit-margin"
                type="number"
                step="0.1"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">税率 (%)</Label>
              <Select value={taxRate} onValueChange={setTaxRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (免税)</SelectItem>
                  <SelectItem value="6">6%</SelectItem>
                  <SelectItem value="9">9%</SelectItem>
                  <SelectItem value="13">13%</SelectItem>
                  <SelectItem value="17">17%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 计算结果 */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg min-h-[140px]">
            <h4 className="font-medium text-sm mb-3">💰 价格计算结果</h4>
            {calculatedPrices.unitPriceExclTax > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">单位成本</p>
                    <p className="text-lg font-bold text-gray-900">
                      ¥{calculatedPrices.unitCostExclTax}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">报价（不含税）</p>
                    <p className="text-lg font-bold text-blue-600">
                      ¥{calculatedPrices.unitPriceExclTax}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">报价（含税）</p>
                    <p className="text-lg font-bold text-orange-600">
                      ¥{calculatedPrices.unitPriceInclTax}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  利润率 {profitMargin}% | 税率 {taxRate}%
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-20">
                <p className="text-sm text-gray-500">请输入单位成本以查看价格计算</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 交货与付款条款 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. 交货与付款条款</CardTitle>
          <CardDescription>设置订单基本条件</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moq">最小起订量 (MOQ) *</Label>
              <Input
                id="moq"
                type="number"
                placeholder="1000"
                value={moq}
                onChange={(e) => setMOQ(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-time">交货期（天）*</Label>
              <Input
                id="lead-time"
                type="number"
                placeholder="30"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">报价有效期（天）</Label>
              <Input
                id="validity"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-terms">付款条款</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="net30">账期30天</SelectItem>
                  <SelectItem value="net45">账期45天</SelectItem>
                  <SelectItem value="net60">账期60天</SelectItem>
                  <SelectItem value="50_50">50%预付 + 50%发货前</SelectItem>
                  <SelectItem value="30_70">30%预付 + 70%发货前</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="notes">备注说明</Label>
            <Textarea
              id="notes"
              placeholder="包装方式、认证证书、质保期等特殊说明..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 认证管理 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">3. 质量保证与认证</CardTitle>
          <CardDescription>选择现有认证或添加自定义认证条件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 认证选择区域 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-3 gap-3">
              {certifications.map(cert => (
                <div 
                  key={cert.id} 
                  className={`flex items-center justify-between p-3 rounded border transition-all ${
                    cert.checked 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      id={cert.id}
                      checked={cert.checked}
                      onCheckedChange={() => toggleCertification(cert.id)}
                    />
                    <label
                      htmlFor={cert.id}
                      className="text-sm cursor-pointer select-none"
                    >
                      {cert.name}
                    </label>
                  </div>
                  {cert.isCustom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteCertification(cert.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 添加自定义认证 */}
          <div className="border-t pt-4">
            <Label className="text-sm mb-2 block">添加自定义认证</Label>
            <div className="flex gap-2">
              <Input
                placeholder="例如：BSCI、SA8000、FSC等..."
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCertification();
                  }
                }}
              />
              <Button
                onClick={handleAddCertification}
                disabled={!newCertification.trim()}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                添加
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              已选择 <strong className="text-orange-600">{certifications.filter(c => c.checked).length}</strong> 项认证
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          <strong>提示：</strong>报价需经内部审核批准后才能提交给COSUN采购方
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit('draft')} className="gap-2">
            <Save className="w-4 h-4" />
            保存草稿
          </Button>
          <Button onClick={() => handleSubmit('review')} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Send className="w-4 h-4" />
            提交内部审核
          </Button>
        </div>
      </div>

      {/* Quotation Document Preview */}
      {calculatedPrices.unitPriceInclTax > 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 w-full bg-orange-50 border-orange-300 hover:bg-orange-100">
              <FileText className="w-4 h-4" />
              📄 预览专业报价单文档
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden flex flex-col">
            {/* 工具栏 */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50 print:hidden shrink-0">
              <div>
                <DialogTitle className="text-lg">工厂正式报价单 - Professional Quotation</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">Quotation No: {quotationData.quotationNo}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4" />
                  打印报价单
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    // 下载功能（简单版）
                    window.print();
                  }}
                >
                  <Download className="w-4 h-4" />
                  导出PDF
                </Button>
              </div>
            </div>
            
            {/* 报价单内容区域 */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-6 print:p-0 print:bg-white">
              <QuotationDocument quotationData={quotationData} preview={true} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

QuoteForm.displayName = 'QuoteForm';

export default QuoteForm;