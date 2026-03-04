import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { FileText, ArrowRight, CheckCircle, Calculator } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { createQuotationFromXJ, saveSupplierQuotation } from '../../utils/createQuotationFromXJ';
import { useUser } from '../../contexts/UserContext';
import { useXJs } from '../../contexts/XJContext';

export default function QuickQuotationCreator() {
  const { user } = useUser();
  const { rfqs, getRFQsBySupplier, updateRFQ } = useXJs();
  
  const [xjNumber, setXjNumber] = useState('XJ-251220-7726');
  const [unitPrice, setUnitPrice] = useState('');
  const [leadTime, setLeadTime] = useState('30');
  const [moq, setMoq] = useState('1000');
  const [paymentTerms, setPaymentTerms] = useState('T/T 30天');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB 厦门');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<'draft' | 'submitted'>('draft');

  // 🔥 组件加载时检查是否有待报价的询价单
  useEffect(() => {
    const pendingRFQ = localStorage.getItem('pendingQuotationRFQ');
    if (pendingRFQ) {
      setXjNumber(pendingRFQ);
      localStorage.removeItem('pendingQuotationRFQ'); // 清除标记
    }
  }, []);

  const handleCreateQuotation = () => {
    if (!user?.email) {
      toast.error('请先登录');
      return;
    }

    // 查找对应的采购询价
    const rfq = rfqs.find(r => 
      r.supplierXjNo === xjNumber || 
      r.xjNumber === xjNumber
    );

    if (!rfq) {
      toast.error(`未找到询价单 ${xjNumber}`);
      console.log('所有采购询价:', rfqs.map(r => ({ 
        supplierXjNo: r.supplierXjNo, 
        xjNumber: r.xjNumber 
      })));
      return;
    }

    // 验证必填字段
    if (!unitPrice || parseFloat(unitPrice) <= 0) {
      toast.error('请输入有效的单价');
      return;
    }

    try {
      // 创建报价单
      const quotation = createQuotationFromXJ(
        rfq,
        user.email,
        user.name || user.email,
        user.company || '供应商公司',
        {
          unitPrice: parseFloat(unitPrice),
          leadTime: parseInt(leadTime),
          moq: parseInt(moq),
          paymentTerms,
          deliveryTerms,
          status
        }
      );

      // 保存到localStorage
      saveSupplierQuotation(quotation);

      // 更新采购询价状态
      if (status === 'submitted') {
        updateRFQ(rfq.id, {
          supplierQuotationNo: quotation.quotationNo,
          status: 'quoted' as any
        });
      }

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">✅ 报价单创建成功！</p>
          <p className="text-sm">询价单号: {xjNumber}</p>
          <p className="text-sm">报价单号: {quotation.quotationNo}</p>
          <p className="text-sm">状态: {status === 'draft' ? '草稿' : '已提交'}</p>
          <p className="text-xs text-slate-500 mt-2">
            请前往"订单管理中心 → 我的报价"查看
          </p>
        </div>,
        { duration: 6000 }
      );

      // 跳转到订单管理中心
      setTimeout(() => {
        localStorage.setItem('supplierDashboardActiveTab', 'order-management');
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('创建报价单失败:', error);
      toast.error('创建报价单失败，请重试');
    }
  };

  // 查找采购询价信息
  const rfq = rfqs.find(r => 
    r.supplierXjNo === xjNumber || 
    r.xjNumber === xjNumber
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">快速创建报价单</h2>
        <p className="text-sm text-slate-500">从询价单XJ快速生成供应商报价单BJ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            询价单信息
          </CardTitle>
          <CardDescription>XJ → BJ 流转</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 询价单号 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>询价单号 (XJ)</Label>
              <Input
                value={xjNumber}
                onChange={(e) => setXjNumber(e.target.value)}
                placeholder="XJ-251220-7726"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>状态</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">保存为草稿</SelectItem>
                  <SelectItem value="submitted">直接提交</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 采购询价详情 */}
          {rfq && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-900">找到询价单</span>
                <Badge className="bg-blue-600">匹配成功</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">产品名称：</span>
                  <span className="font-medium">{rfq.productName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">型号：</span>
                  <span className="font-medium">{rfq.modelNo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-blue-700">数量：</span>
                  <span className="font-medium">{rfq.quantity} {rfq.unit}</span>
                </div>
                <div>
                  <span className="text-blue-700">货币：</span>
                  <span className="font-medium">{rfq.currency || 'CNY'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-blue-700">关联采购需求：</span>
                  <span className="font-medium">{rfq.requirementNo || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {!rfq && xjNumber && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                ⚠️ 未找到询价单 {xjNumber}，请检查编号是否正确
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-600" />
            报价信息
          </CardTitle>
          <CardDescription>填写供应商报价详情</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 报价详情 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>单价 *</Label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1.5"
                step="0.01"
              />
            </div>
            <div>
              <Label>交货周期（天）</Label>
              <Input
                type="number"
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                placeholder="30"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>最小起订量 (MOQ)</Label>
              <Input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="1000"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>付款方式</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T/T 30天">T/T 30天</SelectItem>
                  <SelectItem value="T/T 60天">T/T 60天</SelectItem>
                  <SelectItem value="L/C at sight">L/C at sight</SelectItem>
                  <SelectItem value="30% 预付 + 70% 发货前">30% 预付 + 70% 发货前</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>交货条款</Label>
              <Select value={deliveryTerms} onValueChange={setDeliveryTerms}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOB 厦门">FOB 厦门</SelectItem>
                  <SelectItem value="CIF">CIF</SelectItem>
                  <SelectItem value="DDP">DDP</SelectItem>
                  <SelectItem value="EXW">EXW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <Label>备注说明</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="其他说明..."
              className="mt-1.5 min-h-20"
            />
          </div>

          {/* 总金额预览 */}
          {rfq && unitPrice && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">报价总金额</span>
                <span className="text-2xl font-bold text-green-900">
                  ¥{(parseFloat(unitPrice) * (rfq.quantity || 0)).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                {rfq.quantity} {rfq.unit} × ¥{parseFloat(unitPrice).toFixed(2)} = ¥{(parseFloat(unitPrice) * (rfq.quantity || 0)).toFixed(2)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setXjNumber('');
            setUnitPrice('');
            setRemarks('');
          }}
        >
          重置
        </Button>
        <Button
          onClick={handleCreateQuotation}
          disabled={!rfq || !unitPrice}
          className="bg-orange-600 hover:bg-orange-700 gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          {status === 'draft' ? '保存草稿' : '提交报价'}
        </Button>
      </div>

      {/* 流程图示 */}
      <Card className="bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <p className="font-medium">询价单</p>
              <p className="text-xs text-slate-500">XJ-251220-7726</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Calculator className="w-8 h-8 text-orange-600" />
              </div>
              <p className="font-medium">供应商报价</p>
              <p className="text-xs text-slate-500">填写报价信息</p>
            </div>
            <ArrowRight className="w-6 h-6 text-slate-400" />
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-medium">报价单</p>
              <p className="text-xs text-slate-500">BJ-YYMMDD-XXXX</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}