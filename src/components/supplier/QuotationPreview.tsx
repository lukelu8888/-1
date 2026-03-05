import React from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Printer, Download, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface QuotationPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any;
}

export default function QuotationPreview({ open, onOpenChange, data }: QuotationPreviewProps) {
  if (!data) return null;

  const currentDate = new Date().toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).replace(/\//g, '/');

  // 报价数据
  const quotationData = {
    quotationNo: data.fullQuoteData?.quotationData?.quotationNo || `QT-${Date.now()}`,
    issueDate: currentDate,
    validUntil: data.fullQuoteData?.quotationData?.validUntil || '2024-12-17',
    xjId: data.xjId || data.id,
    product: data.product,
    specifications: data.specifications,
    quantity: data.quantity,
    targetPrice: data.targetPrice,
    unitPrice: parseFloat(data.unitPrice || data.quotedPrice || 0),
    moq: data.moq || data.fullQuoteData?.moq || 1000,
    leadTime: data.leadTime || data.fullQuoteData?.leadTime || 30,
    validityDays: data.validityDays || data.fullQuoteData?.validityDays || 30,
    paymentTerms: data.paymentTerms || data.fullQuoteData?.paymentTerms || 'T/T 30% deposit, 70% before shipment',
    baseCost: data.baseCost || data.fullQuoteData?.baseCost || 8.50,
    profitMargin: data.profitMargin || data.fullQuoteData?.profitMargin || 15,
    taxRate: data.taxRate || data.fullQuoteData?.taxRate || 13,
    priceBreaks: data.fullQuoteData?.calculatedPrices?.priceBreaksCalculated || [],
    notes: data.notes || data.fullQuoteData?.notes || '',
    certifications: data.fullQuoteData?.quotationData?.certifications || ['CE认证', 'RoHS认证', 'ISO9001质量管理体系']
  };

  // 计算金额
  const subtotal = quotationData.unitPrice * quotationData.quantity;
  const taxAmount = subtotal * (quotationData.taxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        工 厂 报 价 单
                          QUOTATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

福建高盛达富建材有限公司
Fujian Gaoshengdafu Building Materials Co., Ltd.

报价单号：${quotationData.quotationNo}          日期：${quotationData.issueDate}
客户名称：COSUN                                询价单号：${quotationData.xjId}
有效期限：${quotationData.validityDays} 天      有效期至：${quotationData.validUntil}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
序号  品名规格                           数量        单位  单价      金额
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1    ${quotationData.product}
      ${quotationData.specifications}       ${quotationData.quantity.toLocaleString()}     件   $${quotationData.unitPrice.toFixed(2)}  $${subtotal.toFixed(2)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                                                    小计：$${subtotal.toFixed(2)}
                                            税金(${quotationData.taxRate}%)：$${taxAmount.toFixed(2)}
                                                    总计：$${totalAmount.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
交易条款：

• 付款条件 (Payment Terms)：${quotationData.paymentTerms}
• 交货期 (Lead Time)：${quotationData.leadTime} 天
• 最小订购量 (MOQ)：${quotationData.moq.toLocaleString()} 件
• 包装方式：标准出口纸箱包装
• 贸易条款：FOB、CIF、EXW 等可协商

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
备注：
${quotationData.notes || '无'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
制表：__________    审核：__________    批准：__________

福建高盛达富建材有限公司
Fujian Gaoshengdafu Building Materials Co., Ltd.
    `;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `报价单_${quotationData.quotationNo}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[95vh] overflow-y-auto p-0 bg-white">
        {/* 打印按钮区 - 不打印 */}
        <div className="sticky top-0 bg-white border-b z-10 px-6 py-3 print:hidden">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              打印
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              下载
            </Button>
          </div>
        </div>

        {/* 报价单主体 - A4纸张样式 */}
        <div className="px-12 py-10 bg-white" style={{ minHeight: '297mm' }}>
          {/* 顶部：公司信息 + 报价单标题 */}
          <div className="border-2 border-black mb-0">
            {/* Header区 */}
            <div className="flex items-start justify-between border-b-2 border-black p-4">
              {/* 左侧：公司Logo和信息 */}
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1" style={{ fontSize: '16px' }}>福建高盛达富建材有限公司</h3>
                  <p className="text-gray-700 mb-0.5" style={{ fontSize: '12px' }}>Fujian Gaoshengdafu Building Materials Co., Ltd.</p>
                  <p className="text-gray-600" style={{ fontSize: '10px' }}>地址：福建省 | 电话：+86-xxx-xxxx | 传真：+86-xxx-xxxx</p>
                </div>
              </div>
              
              {/* 右侧：报价单标题 */}
              <div className="text-right">
                <h1 className="font-bold text-gray-900 mb-1" style={{ fontSize: '24px', letterSpacing: '4px' }}>报 价 单</h1>
                <p className="text-gray-600" style={{ fontSize: '14px', letterSpacing: '2px' }}>QUOTATION</p>
              </div>
            </div>

            {/* 基本信息区 */}
            <div className="grid grid-cols-2 border-b border-black">
              {/* 左列 */}
              <div className="border-r border-black">
                <div className="flex border-b border-black">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>报价单号</div>
                  <div className="flex-1 px-3 py-2 font-bold" style={{ fontSize: '13px' }}>{quotationData.quotationNo}</div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>客户名称</div>
                  <div className="flex-1 px-3 py-2" style={{ fontSize: '13px' }}>COSUN</div>
                </div>
                <div className="flex">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>询价单号</div>
                  <div className="flex-1 px-3 py-2" style={{ fontSize: '13px' }}>{quotationData.xjId}</div>
                </div>
              </div>
              
              {/* 右列 */}
              <div>
                <div className="flex border-b border-black">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>报价日期</div>
                  <div className="flex-1 px-3 py-2" style={{ fontSize: '13px' }}>{quotationData.issueDate}</div>
                </div>
                <div className="flex border-b border-black">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>有效期限</div>
                  <div className="flex-1 px-3 py-2" style={{ fontSize: '13px' }}>{quotationData.validityDays} 天</div>
                </div>
                <div className="flex">
                  <div className="w-28 bg-gray-50 border-r border-black px-3 py-2 font-medium" style={{ fontSize: '13px' }}>有效期至</div>
                  <div className="flex-1 px-3 py-2" style={{ fontSize: '13px' }}>{quotationData.validUntil}</div>
                </div>
              </div>
            </div>

            {/* 产品明细表格 */}
            <div>
              {/* 表头 */}
              <div className="flex bg-gray-100 border-b-2 border-black font-bold">
                <div className="w-12 border-r border-black px-2 py-2.5 text-center" style={{ fontSize: '13px' }}>序号</div>
                <div className="flex-1 border-r border-black px-3 py-2.5" style={{ fontSize: '13px' }}>品名规格</div>
                <div className="w-20 border-r border-black px-2 py-2.5 text-center" style={{ fontSize: '13px' }}>数量</div>
                <div className="w-16 border-r border-black px-2 py-2.5 text-center" style={{ fontSize: '13px' }}>单位</div>
                <div className="w-24 border-r border-black px-2 py-2.5 text-right" style={{ fontSize: '13px' }}>单价</div>
                <div className="w-28 px-2 py-2.5 text-right" style={{ fontSize: '13px' }}>金额</div>
              </div>

              {/* 产品行 */}
              <div className="flex border-b border-black min-h-[80px]">
                <div className="w-12 border-r border-black px-2 py-3 text-center font-medium" style={{ fontSize: '13px' }}>1</div>
                <div className="flex-1 border-r border-black px-3 py-3">
                  <p className="font-bold mb-1" style={{ fontSize: '13px' }}>{quotationData.product}</p>
                  <p className="text-gray-700" style={{ fontSize: '12px' }}>{quotationData.specifications}</p>
                </div>
                <div className="w-20 border-r border-black px-2 py-3 text-center font-medium" style={{ fontSize: '13px' }}>
                  {quotationData.quantity.toLocaleString()}
                </div>
                <div className="w-16 border-r border-black px-2 py-3 text-center" style={{ fontSize: '13px' }}>件</div>
                <div className="w-24 border-r border-black px-2 py-3 text-right font-bold" style={{ fontSize: '13px' }}>
                  ${quotationData.unitPrice.toFixed(2)}
                </div>
                <div className="w-28 px-2 py-3 text-right font-bold" style={{ fontSize: '13px' }}>
                  ${subtotal.toFixed(2)}
                </div>
              </div>

              {/* 空白行（可选，用于多个产品） */}
              <div className="flex border-b border-black min-h-[60px]">
                <div className="w-12 border-r border-black"></div>
                <div className="flex-1 border-r border-black"></div>
                <div className="w-20 border-r border-black"></div>
                <div className="w-16 border-r border-black"></div>
                <div className="w-24 border-r border-black"></div>
                <div className="w-28"></div>
              </div>

              {/* 合计区 */}
              <div className="border-b border-black">
                <div className="flex justify-end items-center py-2 px-3">
                  <span className="mr-4 font-medium" style={{ fontSize: '13px' }}>小计 (Subtotal)：</span>
                  <span className="font-bold w-28 text-right" style={{ fontSize: '14px' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-end items-center py-2 px-3 bg-gray-50">
                  <span className="mr-4 font-medium" style={{ fontSize: '13px' }}>税金 {quotationData.taxRate}% (Tax)：</span>
                  <span className="font-bold w-28 text-right" style={{ fontSize: '14px' }}>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-end items-center py-2.5 px-3 bg-orange-50">
                  <span className="mr-4 font-bold" style={{ fontSize: '14px' }}>总计 (Total)：</span>
                  <span className="font-bold w-28 text-right text-orange-700" style={{ fontSize: '16px' }}>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* 价格梯度表格（如有） */}
              {quotationData.priceBreaks && quotationData.priceBreaks.length > 0 && (
                <div className="border-b border-black">
                  <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black" style={{ fontSize: '13px' }}>
                    价格梯度 (Volume Pricing)
                  </div>
                  <div className="p-3">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>数量范围</th>
                          <th className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>单价（含税）</th>
                          <th className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>单价（不含税）</th>
                          <th className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>折扣</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationData.priceBreaks.map((tier: any, idx: number) => (
                          <tr key={idx}>
                            <td className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>
                              {tier.minQty.toLocaleString()} - {tier.maxQty ? tier.maxQty.toLocaleString() : '∞'} 件
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center font-bold" style={{ fontSize: '12px' }}>
                              ${tier.priceInclTax}/件
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>
                              ${tier.priceExclTax}/件
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center" style={{ fontSize: '12px' }}>
                              {tier.discount > 0 ? `-${tier.discount}%` : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 交易条款 */}
              <div className="border-b border-black">
                <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black" style={{ fontSize: '13px' }}>
                  交易条款 (Terms & Conditions)
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">付款条件：</span>
                    <span className="text-gray-800">{quotationData.paymentTerms}</span>
                  </div>
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">交货期：</span>
                    <span className="text-gray-800">{quotationData.leadTime} 天（自订单确认日起算）</span>
                  </div>
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">最小订购量：</span>
                    <span className="text-gray-800">{quotationData.moq.toLocaleString()} 件</span>
                  </div>
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">包装方式：</span>
                    <span className="text-gray-800">标准出口纸箱包装，保证产品安全运输</span>
                  </div>
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">贸易条款：</span>
                    <span className="text-gray-800">FOB、CIF、EXW 等可协商</span>
                  </div>
                  <div className="flex items-start" style={{ fontSize: '12px' }}>
                    <span className="font-medium w-32 flex-shrink-0">质量认证：</span>
                    <span className="text-gray-800">{quotationData.certifications.join('、')}</span>
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div className="border-b border-black">
                <div className="bg-gray-100 px-3 py-2 font-bold border-b border-black" style={{ fontSize: '13px' }}>
                  备注 (Notes)
                </div>
                <div className="px-4 py-3 min-h-[60px]" style={{ fontSize: '12px' }}>
                  {quotationData.notes ? (
                    <p className="text-gray-800 whitespace-pre-wrap">{quotationData.notes}</p>
                  ) : (
                    <p className="text-gray-400">无</p>
                  )}
                </div>
              </div>

              {/* 签章区 */}
              <div className="grid grid-cols-3">
                <div className="border-r border-black px-4 py-4 text-center">
                  <p className="mb-6 font-medium" style={{ fontSize: '13px' }}>制表人</p>
                  <div className="border-b border-gray-400 w-24 mx-auto"></div>
                </div>
                <div className="border-r border-black px-4 py-4 text-center">
                  <p className="mb-6 font-medium" style={{ fontSize: '13px' }}>审核人</p>
                  <div className="border-b border-gray-400 w-24 mx-auto"></div>
                </div>
                <div className="px-4 py-4 text-center">
                  <p className="mb-6 font-medium" style={{ fontSize: '13px' }}>批准人</p>
                  <div className="border-b border-gray-400 w-24 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部公司信息 */}
          <div className="mt-6 text-center">
            <p className="font-bold text-gray-900 mb-1" style={{ fontSize: '14px' }}>福建高盛达富建材有限公司</p>
            <p className="text-gray-600" style={{ fontSize: '12px' }}>Fujian Gaoshengdafu Building Materials Co., Ltd.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
