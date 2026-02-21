import React, { useState, useEffect } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner@2.0.3';

// 🔥 预设选项配置
const PAYMENT_TERMS_PRESETS = [
  '30% T/T预付，70%见提单副本付款',
  '50% T/T预付，50%发货前付清',
  '100% T/T预付',
  'L/C at sight（即期信用证）',
  '30天远期信用证',
  '自定义...'
];

const QUALITY_REQUIREMENTS_PRESETS = [
  '需要第三方验货，AQL 2.5标准',
  '供应商自检，提供检验报告',
  '全检（100%检验）',
  'AQL 1.5标准验货',
  'AQL 4.0标准验货',
  '自定义...'
];

const PACKAGING_REQUIREMENTS_PRESETS = [
  '需要客户logo印刷，彩盒包装',
  '中性包装，无logo',
  '出口标准牛皮纸箱',
  'Polybag + 彩盒 + 外箱',
  '吸塑包装 + 展示盒',
  '自定义...'
];

interface SubmitToProcurementDialogProps {
  open: boolean;
  onClose: () => void;
  requirement: any; // 采购需求单数据
  onSubmit: (data: any) => void;
}

export function SubmitToProcurementDialog({
  open,
  onClose,
  requirement,
  onSubmit
}: SubmitToProcurementDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // 🔥 计算默认日期：期望报价日期 = 今天 + 3天，期望交期 = 今天 + 30天
  const getDefaultQuoteDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };
  
  const getDefaultDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  const [expectedQuoteDate, setExpectedQuoteDate] = useState(getDefaultQuoteDate()); // 🔥 默认：3天后
  const [remarks, setRemarks] = useState('');
  
  const [tradeTerms, setTradeTerms] = useState('FOB');
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERMS_PRESETS[0]); // 🔥 默认：第一条付款条款
  const [deliveryDate, setDeliveryDate] = useState(getDefaultDeliveryDate()); // 🔥 默认：30天后
  const [targetCostRange, setTargetCostRange] = useState('');
  const [qualityRequirements, setQualityRequirements] = useState(QUALITY_REQUIREMENTS_PRESETS[0]); // 🔥 默认：第一条验货要求
  const [packagingRequirements, setPackagingRequirements] = useState(PACKAGING_REQUIREMENTS_PRESETS[0]); // 🔥 默认：第一条特殊包装

  // 🔥 控制是否使用自定义输入
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [isCustomQuality, setIsCustomQuality] = useState(false);
  const [isCustomPackaging, setIsCustomPackaging] = useState(false);

  const [editableProducts, setEditableProducts] = useState<any[]>([]);

  // 🔍 调试：打印完整的requirement对象
  useEffect(() => {
    if (requirement && requirement.items && requirement.items.length > 0) {
      console.log('🔍 [SubmitDialog] requirement:', requirement.requirementNo);
      console.log('   - 第一个产品 modelNo:', requirement.items[0].modelNo);
      console.log('   - 第一个产品 specification:', requirement.items[0].specification);
    }
  }, [requirement]);

  useEffect(() => {
    if (requirement?.items) {
      console.log('🔍 [SubmitToProcurementDialog] requirement.items:', requirement.items);
      
      const processedProducts = requirement.items.map((p: any) => ({
        ...p,
        editableQuantity: p.quantity || 0,
        editableRemarks: p.remarks || ''
      }));
      
      console.log('✅ [SubmitToProcurementDialog] processedProducts:', processedProducts);
      setEditableProducts(processedProducts);
    }
  }, [requirement]);

  // 🔥 每次打开对话框时重置为默认值
  useEffect(() => {
    if (open) {
      console.log('🔄 [SubmitToProcurementDialog] 对话框打开，重置为默认值');
      setExpectedQuoteDate(getDefaultQuoteDate());
      setDeliveryDate(getDefaultDeliveryDate());
      setPaymentTerms(PAYMENT_TERMS_PRESETS[0]);
      setQualityRequirements(QUALITY_REQUIREMENTS_PRESETS[0]);
      setPackagingRequirements(PACKAGING_REQUIREMENTS_PRESETS[0]);
      setTradeTerms('FOB');
      setTargetCostRange('');
      setRemarks('');
      setIsCustomPayment(false);
      setIsCustomQuality(false);
      setIsCustomPackaging(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    // 验证必填字段
    if (!expectedQuoteDate) {
      toast.error('请选择期望报价日期');
      return;
    }
    if (!deliveryDate) {
      toast.error('请选择期望交期');
      return;
    }
    if (!paymentTerms) {
      toast.error('请填写付款条款');
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        expectedQuoteDate,
        deliveryDate,
        paymentTerms,
        tradeTerms,
        targetCostRange,
        qualityRequirements,
        packagingRequirements,
        remarks,
        products: editableProducts
      };

      onSubmit(submissionData);
      
      // 重置表单
      setExpectedQuoteDate('');
      setDeliveryDate('');
      setPaymentTerms('');
      setTradeTerms('FOB');
      setTargetCostRange('');
      setQualityRequirements('');
      setPackagingRequirements('');
      setRemarks('');
      
      onClose();
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!requirement) return null;

  const productCount = editableProducts?.length || 0;
  const totalQuantity = editableProducts?.reduce((sum: number, p: any) => sum + (p.editableQuantity || 0), 0) || 0;
  const hasNoProducts = !editableProducts || editableProducts.length === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        
        {/* 标题区 - 极简黑白 */}
        <DialogHeader className="border-b border-gray-300 px-8 py-5 bg-white">
          <div className="flex items-end justify-between">
            <div>
              <DialogTitle className="text-xl tracking-tight text-black mb-1">
                向采购员请求报价
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 font-normal">
                QUOTATION REQUEST TO PROCUREMENT DEPT.
              </DialogDescription>
            </div>
            <div className="text-xs text-gray-900 font-mono border border-gray-300 px-3 py-1.5 bg-gray-50">
              {requirement.requirementNo}
            </div>
          </div>
        </DialogHeader>

        {/* 内容区 - 滚动 */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
          
          {hasNoProducts && (
            <div className="bg-white border border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-600">没有产品数据</p>
            </div>
          )}

          {!hasNoProducts && (
            <div className="space-y-6">
              
              {/* 产品清单 */}
              <div className="bg-white border border-gray-300">
                {/* 表头 */}
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm tracking-wide uppercase text-black">
                      产品清单明细 / PRODUCT LIST
                    </h3>
                    <div className="text-xs text-gray-600">
                      {productCount} 项 | 共 {totalQuantity} 件
                    </div>
                  </div>
                </div>

                {/* 表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-12">No.</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-32">Model No.</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 min-w-[320px]">Item Name / Specification</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-28">Quantity</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-16">Unit</th>
                        <th className="text-left px-4 py-3 text-xs tracking-wider uppercase text-gray-700 w-40">备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableProducts?.map((product: any, index: number) => (
                        <tr key={product.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                          {/* No. */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm text-gray-900">{index + 1}</span>
                          </td>
                          
                          {/* Model No. */}
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono text-black">
                              {product.modelNo || '-'}
                            </span>
                          </td>
                          
                          {/* Item Name / Specification */}
                          <td className="px-4 py-3">
                            <div className="space-y-1.5">
                              <div className="text-sm text-black leading-tight">
                                {product.productName || '-'}
                              </div>
                              {product.specification && (
                                <div className="text-xs text-gray-600 leading-tight">
                                  {product.specification}
                                </div>
                              )}
                            </div>
                          </td>
                          
                          {/* Quantity - 可编辑 */}
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="1"
                              value={product.editableQuantity}
                              onChange={(e) => {
                                const newProducts = [...editableProducts];
                                newProducts[index].editableQuantity = parseInt(e.target.value) || 0;
                                setEditableProducts(newProducts);
                              }}
                              className="w-20 text-center text-sm border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:border-black"
                            />
                          </td>
                          
                          {/* Unit */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-gray-600">
                              {product.unit || 'pcs'}
                            </span>
                          </td>
                          
                          {/* 备注 - 可编辑 */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={product.editableRemarks}
                              onChange={(e) => {
                                const newProducts = [...editableProducts];
                                newProducts[index].editableRemarks = e.target.value;
                                setEditableProducts(newProducts);
                              }}
                              placeholder="备注"
                              className="w-full text-xs border border-gray-300 px-2 py-1.5 bg-white focus:outline-none focus:border-black placeholder:text-gray-400"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 客户对产品的要求 */}
              <div className="bg-white border border-gray-300">
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <h3 className="text-sm tracking-wide uppercase text-black">
                    客户对产品的要求 / CUSTOMER REQUIREMENTS
                  </h3>
                </div>
                <div className="px-5 py-4">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 w-32 text-gray-600">包装要求</td>
                        <td className="py-2 text-black">出口标准包装</td>
                      </tr>
                      <tr>
                        <td className="py-2 w-32 text-gray-600">其它要求</td>
                        <td className="py-2 text-black">详见产品规格说明（Item Name / Specification 列）</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 其它商务要求 */}
              <div className="bg-white border border-gray-300">
                <div className="border-b border-gray-300 px-5 py-3 bg-gray-100">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm tracking-wide uppercase text-black">
                      其它商务要求 / TRADING TERMS
                    </h3>
                    <span className="text-xs text-gray-600">* 必填项</span>
                  </div>
                </div>
                <div className="px-5 py-5">
                  <div className="space-y-4">
                    {/* 第一行：期望报价日期 + 期望交期 + 付款条款 + 贸易条款 + 验货要求 + 目标成本价区间 + 特殊包装要求（占满整个宽度） */}
                    <div className="grid grid-cols-7 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          期望报价日期 *
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={expectedQuoteDate}
                            onChange={(e) => setExpectedQuoteDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            onKeyDown={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            className="text-xs border-gray-300 focus:border-black cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          采购员需在此日期前完成供应商询价
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          期望交期 *
                        </Label>
                        <div className="relative">
                          <Input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            onKeyDown={(e) => e.preventDefault()}
                            onPaste={(e) => e.preventDefault()}
                            className="text-xs border-gray-300 focus:border-black cursor-pointer pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Calendar className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          付款条款 *
                        </Label>
                        {!isCustomPayment ? (
                          <select
                            value={paymentTerms}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomPayment(true);
                                setPaymentTerms('');
                              } else {
                                setPaymentTerms(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {PAYMENT_TERMS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：30% T/T预付，70%见提单副本付款"
                              value={paymentTerms}
                              onChange={(e) => setPaymentTerms(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomPayment(false);
                                setPaymentTerms('');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          贸易条款 *
                        </Label>
                        <select
                          value={tradeTerms}
                          onChange={(e) => setTradeTerms(e.target.value)}
                          className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                        >
                          <option value="FOB">FOB</option>
                          <option value="CIF">CIF</option>
                          <option value="EXW">EXW</option>
                          <option value="CNF">CNF</option>
                          <option value="DDP">DDP</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          验货要求
                        </Label>
                        {!isCustomQuality ? (
                          <select
                            value={qualityRequirements}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomQuality(true);
                                setQualityRequirements('');
                              } else {
                                setQualityRequirements(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {QUALITY_REQUIREMENTS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：需要第三方验货，AQL 2.5标准"
                              value={qualityRequirements}
                              onChange={(e) => setQualityRequirements(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomQuality(false);
                                setQualityRequirements('');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          目标成本
                        </Label>
                        <Input
                          placeholder="例如：USD 5.50 - 6.20 /pcs"
                          value={targetCostRange}
                          onChange={(e) => setTargetCostRange(e.target.value)}
                          className="text-xs border-gray-300 focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          特殊包装
                        </Label>
                        {!isCustomPackaging ? (
                          <select
                            value={packagingRequirements}
                            onChange={(e) => {
                              if (e.target.value === '自定义...') {
                                setIsCustomPackaging(true);
                                setPackagingRequirements('');
                              } else {
                                setPackagingRequirements(e.target.value);
                              }
                            }}
                            className="w-full text-xs border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-black"
                          >
                            {PACKAGING_REQUIREMENTS_PRESETS.map((preset) => (
                              <option key={preset} value={preset}>{preset}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <Input
                              placeholder="例如：需要客户logo印刷，彩盒包装"
                              value={packagingRequirements}
                              onChange={(e) => setPackagingRequirements(e.target.value)}
                              className="text-xs border-gray-300 focus:border-black"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomPackaging(false);
                                setPackagingRequirements('');
                              }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 self-start"
                            >
                              返回
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 第二行：给采购员的备注（单独一行，仅占左半边） */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-gray-700">
                          给采购员的备注 Remarks
                        </Label>
                        <Textarea
                          placeholder="例如：客户很急，请优先处理..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={3}
                          className="resize-none text-xs border-gray-300 focus:border-black"
                        />
                        <p className="text-xs text-gray-500">
                          请勿在备注中透露客户身份信息
                        </p>
                      </div>
                      
                      {/* 右侧留空 */}
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <DialogFooter className="border-t border-gray-300 px-8 py-4 bg-white">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-gray-600">
              共 <span className="text-black font-mono">{productCount}</span> 个产品，
              总计 <span className="text-black font-mono">{totalQuantity}</span> 件
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={loading}
                className="text-xs border-gray-300 hover:bg-gray-50"
              >
                取消
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!expectedQuoteDate || loading}
                className="bg-black hover:bg-gray-800 text-white text-xs"
              >
                {loading ? '提交中...' : '提交报价请求'}
              </Button>
            </div>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}