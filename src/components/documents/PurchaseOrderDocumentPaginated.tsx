import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import { PurchaseOrderData } from './templates/PurchaseOrderDocument';

/**
 * 🔥 分页版采购合同文档
 * 
 * 智能分页逻辑：
 * - 产品数量 <= 2：所有内容显示在一页
 * - 产品数量 > 2：分两页显示，第一页显示2个产品
 * 
 * 由于12条采购合同条款使用12px字体，内容占用空间非常大，
 * 必须设置较低的阈值，确保所有内容（特别是签章区）都能正确显示
 */

interface PurchaseOrderDocumentPaginatedProps {
  data: PurchaseOrderData;
}

export const PurchaseOrderDocumentPaginated = forwardRef<HTMLDivElement, PurchaseOrderDocumentPaginatedProps>(
  ({ data }, ref) => {
    const toSafeNumber = (value: unknown): number => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
      if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.\-]/g, '').trim();
        if (!normalized) return 0;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };
    
    const total = data.products.reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
    
    // 🔥 智能分页：根据产品数量决定是否需要第二页
    // 第一页显示2个产品，为12条12px字体的合同条款和签章区留出足够空间
    const needsSecondPage = data.products.length > 2;
    const totalPages = needsSecondPage ? 2 : 1;
    const firstPageProducts = needsSecondPage ? 2 : data.products.length;
    
    // 🔍 调试日志
    console.log('🔥 PO分页调试:', {
      产品总数: data.products.length,
      是否需要第二页: needsSecondPage,
      第一页显示产品数: firstPageProducts,
      总页数: totalPages
    });
    
    return (
      <>
        {/* 打印样式 */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              background: white !important;
            }
            
            .po-paginated-container {
              background: white !important;
              padding: 0 !important;
            }
            
            .po-page {
              margin: 0 !important;
              box-shadow: none !important;
              page-break-after: always !important;
            }
            
            .po-page:last-child {
              page-break-after: auto !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @media screen {
            .po-paginated-container {
              background: #525659;
              padding: 40px 20px;
              min-height: 100vh;
            }
            
            .po-page {
              width: 210mm;
              height: 297mm;
              background: white;
              margin: 0 auto 20px auto;
              padding: 20mm;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              box-sizing: border-box;
              font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.5;
              position: relative;
              overflow: hidden;
            }
            
            .po-page:last-child {
              margin-bottom: 40px;
            }
          }
        `}</style>
        
        <div ref={ref} className="po-paginated-container">
          {/* ========== 第一页 ========== */}
          <div className="po-page">
            {/* 页眉 */}
            <div className="mb-2.5">
              <div className="flex justify-between mb-1.5">
                <div className="w-[70px] flex items-end">
                  <img
                    src={cosunLogo}
                    alt="THE COSUN Logo"
                    className="w-full h-auto"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                <div className="flex-1 flex justify-center items-end pb-1">
                  <h1 className="text-2xl font-bold tracking-wider text-black">
                    采购合同
                  </h1>
                </div>
                
                <div className="w-[204px] flex items-end pb-1">
                  <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">合同编号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.poNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">合同日期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          {new Date(data.poDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">要求交期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-[#F96302]">
                          {new Date(data.requiredDeliveryDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#F96302', borderTopWidth: '2.5px' }}></div>
            </div>

            {/* 采购方和供应商信息 */}
            <div className="mb-2.5">
              <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-[#FFF4EC] px-1.5 py-0.5 font-bold border-b border-gray-400 text-[9pt]" style={{ backgroundColor: '#FFF4EC' }}>
                        采购方（买方）
                      </div>
                      <div className="px-1.5 py-1 space-y-0.5 text-[9pt]">
                        <div><span className="font-semibold">{data.buyer.name}</span></div>
                        <div className="text-gray-600 text-[8pt]">{data.buyer.nameEn}</div>
                        <div><span className="text-gray-600">地址：</span>{data.buyer.address}</div>
                        <div><span className="text-gray-600">电话：</span>{data.buyer.tel}</div>
                        <div><span className="text-gray-600">邮箱：</span>{data.buyer.email}</div>
                        <div><span className="text-gray-600">采购联系人：</span>{data.buyer.contactPerson}</div>
                      </div>
                    </td>
                    
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-100 px-1.5 py-0.5 font-bold border-b border-gray-400 text-[9pt]">
                        供应商（卖方）
                      </div>
                      <div className="px-1.5 py-1 space-y-0.5 text-[9pt]">
                        <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                        {data.supplier.supplierCode && (
                          <div><span className="text-gray-600">供应商编码：</span><span className="font-mono">{data.supplier.supplierCode}</span></div>
                        )}
                        <div><span className="text-gray-600">地址：</span>{data.supplier.address}</div>
                        <div><span className="text-gray-600">联系人：</span>{data.supplier.contactPerson}</div>
                        <div><span className="text-gray-600">电话：</span>{data.supplier.tel}</div>
                        <div><span className="text-gray-600">邮箱：</span>{data.supplier.email}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 产品清单 */}
            <div className="mb-2">
              <h3 className="font-bold text-sm mb-1">采购产品明细</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-[9pt]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1.5 py-1 text-left w-8">序号</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-left">产品名称 / 规格</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center w-12">单位</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-16">数量</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-20">单价</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-24">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.slice(0, firstPageProducts).map((product) => (
                    <tr key={product.no}>
                      <td className="border border-gray-300 px-1.5 py-1 text-center">{product.no}</td>
                      <td className="border border-gray-300 px-1.5 py-1">
                        <div className="font-semibold text-[9pt]">{product.description}</div>
                        <div className="text-[8pt] text-gray-600">{product.specification}</div>
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-center">{product.unit}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">{product.quantity.toLocaleString()}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">{product.currency}{toSafeNumber(product.unitPrice).toFixed(2)}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">{product.currency}{toSafeNumber(product.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {needsSecondPage && (
                    <tr>
                      <td colSpan={6} className="border border-gray-300 px-1.5 py-1 text-center italic text-gray-500 text-[8pt]">
                        ... 续下页 ...
                      </td>
                    </tr>
                  )}
                  {!needsSecondPage && (
                    <tr className="bg-[#FFF4EC] font-bold" style={{ backgroundColor: '#FFF4EC' }}>
                      <td colSpan={5} className="border border-gray-300 px-1.5 py-1.5 text-right text-sm">
                        采购合同总金额：
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-bold text-sm text-[#F96302]">
                        {(data.products[0]?.currency || data.terms.currency)}{total.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 如果不需要第二页，在第一页显示付款条款和签名区 */}
            {!needsSecondPage && (
              <>
                {/* 供应商银行信息 */}
                {data.supplier.bankInfo && (
                  <div className="mb-2.5">
                    <h3 className="font-bold text-sm mb-1">供应商收款信息</h3>
                    <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                      <tbody>
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-0.5 w-24 bg-gray-50 font-semibold">开户银行</td>
                          <td className="border border-gray-400 px-1.5 py-0.5">{data.supplier.bankInfo.bankName}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50 font-semibold">账户名称</td>
                          <td className="border border-gray-400 px-1.5 py-0.5">{data.supplier.bankInfo.accountName}</td>
                        </tr>
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50 font-semibold">银行账号</td>
                          <td className="border border-gray-400 px-1.5 py-0.5 font-mono">{data.supplier.bankInfo.accountNumber}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 采购合同条款 */}
                <div className="mb-2.5">
                  <h3 className="font-bold text-sm mb-1">采购合同条款</h3>
                  <div className="border border-gray-400 px-2 py-1.5 text-[12px] leading-relaxed space-y-1">
                    <p><span className="font-semibold">1. 产品质量：</span>供应商应确保所供产品符合国家标准及本订单约定的质量标准，如因质量问题造成损失，供应商应承担相应责任。</p>
                    <p><span className="font-semibold">2. 交货时间：</span>供应商应按约定时间交货，逾期交货每日按订单金额的1%支付违约金，累计超过10日采购方有权解除合同。</p>
                    <p><span className="font-semibold">3. 验收标准：</span>采购方收货后有权进行质量检验，如不符合要求有权拒收并要求供应商承担相应损失。</p>
                    <p><span className="font-semibold">4. 付款方式：</span>采购方按约定的付款条款支付货款，供应商应提供合法有效的发票及相关单据。</p>
                    <p><span className="font-semibold">5. 包装与唛头：</span>外包装应牢固防潮防震，适合长途运输；唛头应清晰标注订单号、品名、规格、数量、毛重/净重、目的地、"易碎物品"/"向上"等标识；内包装应有产品说明书、合格证、装箱清单。</p>
                    <p><span className="font-semibold">6. 检验与索赔：</span>采购方收货后7日内为质量异议期，发现质量问题应书面通知供应商；供应商应在收到通知后3日内响应，15日内提出解决方案；因质量问题产生的退换货运费由供应商承担。</p>
                    <p><span className="font-semibold">7. 技术文件：</span>供应商应随货提供产品合格证、检验报告、使用说明书、质保卡等完整技术资料；如需特殊认证（CE、UL、CCC等），应提供相应证书复印件。</p>
                    <p><span className="font-semibold">8. 知识产权：</span>供应商保证所供产品不侵犯任何第三方知识产权；如因侵权引起纠纷，由供应商承担全部法律责任和经济损失。</p>
                    <p><span className="font-semibold">9. 保密条款：</span>双方对本订单内容及商业信息负有保密义务，经对方书面同意不得向第三方披露；保密期限为合同终止后2年。</p>
                    <p><span className="font-semibold">10. 不可抗力：</span>因不可抗力（自然灾害、战争、政府行为等）导致无法履约，受影响方应在3日内书面通知对方，并提供相关证明；双方协商解决方案，免除相应责任。</p>
                    <p><span className="font-semibold">11. 质保与售后：</span>质保期为货到后12个月；质保期内因产品质量问题产生的维修、更换费用由供应商承担；供应商应提供及时的技术支持和售后服务。</p>
                    <p><span className="font-semibold">12. 争议解决：</span>双方如发生争议应友好协商解决，协商不成可向采购方所在地人民法院提起诉讼。本合同适用中华人民共和国法律。</p>
                  </div>
                </div>

                {/* 签章区 */}
                <div className="mt-3 pt-2 border-t-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-1 text-[9pt]">采购方（盖章）：</h4>
                      <div className="text-[8pt] space-y-1">
                        <p className="font-semibold text-[9pt]">{data.buyer.name}</p>
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                          <p className="text-[8pt] text-gray-400">公司公章</p>
                        </div>
                        <div className="border-b border-gray-400 pb-0.5">
                          <p className="text-[8pt] text-gray-600">经办人签字：____________</p>
                        </div>
                        <p className="text-[8pt] text-gray-600">日期：____________</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 text-[9pt]">供应商（盖章）：</h4>
                      <div className="text-[8pt] space-y-1">
                        <p className="font-semibold text-[9pt]">{data.supplier.companyName}</p>
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                          <p className="text-[8pt] text-gray-400">公司公章</p>
                        </div>
                        <div className="border-b border-gray-400 pb-0.5">
                          <p className="text-[8pt] text-gray-600">授权代表签字：____________</p>
                        </div>
                        <p className="text-[8pt] text-gray-600">日期：____________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 页脚 */}
            <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-between items-center text-[7pt] text-gray-500">
              <div>https://www.figma.com/make</div>
              <div>第 1 页 / 共 {totalPages} 页</div>
            </div>
          </div>

          {/* ========== 第二页（仅在需要时显示）========== */}
          {needsSecondPage && (
            <div className="po-page">
              {/* 续表 */}
              <div className="mb-2.5">
                <h3 className="font-bold text-sm mb-1.5">采购产品明细（续）</h3>
                <table className="w-full border-collapse border-2 border-gray-300 text-[9pt]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1.5 py-1 text-left w-8">序号</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-left">产品名称 / 规格</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-center w-12">单位</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-16">数量</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-20">单价</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-24">金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.slice(2).map((product) => (
                      <tr key={product.no}>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{product.no}</td>
                        <td className="border border-gray-300 px-1.5 py-1">
                          <div className="font-semibold text-[9pt]">{product.description}</div>
                          <div className="text-[8pt] text-gray-600">{product.specification}</div>
                        </td>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{product.unit}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right">{product.quantity.toLocaleString()}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right">{product.currency}{toSafeNumber(product.unitPrice).toFixed(2)}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">{product.currency}{toSafeNumber(product.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#FFF4EC] font-bold" style={{ backgroundColor: '#FFF4EC' }}>
                      <td colSpan={5} className="border border-gray-300 px-1.5 py-1.5 text-right text-sm">
                        采购合同总金额：
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-bold text-sm text-[#F96302]">
                        {(data.products[0]?.currency || data.terms.currency)}{total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 付款条款 */}
              <div className="mb-2.5">
                <h3 className="font-bold text-sm mb-1">付款条款</h3>
                <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50">
                        <span className="font-semibold">付款方式：</span>
                        <span className="ml-1">{data.terms.paymentTerms}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50">
                        <span className="font-semibold">交货方式：</span>
                        <span className="ml-1">{data.terms.deliveryTerms}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50">
                        <span className="font-semibold">质量标准：</span>
                        <span className="ml-1">{data.terms.qualityStandard}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 供应商银行信息 */}
              {data.supplier.bankInfo && (
                <div className="mb-2.5">
                  <h3 className="font-bold text-sm mb-1">供应商收款信息</h3>
                  <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 w-24 bg-gray-50 font-semibold">开户银行</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">{data.supplier.bankInfo.bankName}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50 font-semibold">账户名称</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">{data.supplier.bankInfo.accountName}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-50 font-semibold">银行账号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-mono">{data.supplier.bankInfo.accountNumber}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 采购合同条款 */}
              <div className="mb-2.5">
                <h3 className="font-bold text-sm mb-1">采购合同条款</h3>
                <div className="border border-gray-400 px-2 py-1.5 text-[12px] leading-relaxed space-y-1">
                  <p><span className="font-semibold">1. 产品质量：</span>供应商应确保所供产品符合国家标准及本订单约定的质量标准，如因质量问题造成损失，供应商应承担相应责任。</p>
                  <p><span className="font-semibold">2. 交货时间：</span>供应商应按约定时间交货，逾期交货每日按订单金额的1%支付违约金，累计超过10日采购方有权解除合同。</p>
                  <p><span className="font-semibold">3. 验收标准：</span>采购方收货后有权进行质量检验，如不符合要求有权拒收并要求供应商承担相应损失。</p>
                  <p><span className="font-semibold">4. 付款方式：</span>采购方按约定的付款条款支付货款，供应商应提供合法有效的发票及相关单据。</p>
                  <p><span className="font-semibold">5. 包装与唛头：</span>外包装应牢固防潮防震，适合长途运输；唛头应清晰标注订单号、品名、规格、数量、毛重/净重、目的地、"易碎物品"/"向上"等标识；内包装应有产品说明书、合格证、装箱清单。</p>
                  <p><span className="font-semibold">6. 检验与索赔：</span>采购方收货后7日内为质量异议期，发现质量问题应书面通知供应商；供应商应在收到通知后3日内响应，15日内提出解决方案；因质量问题产生的退换货运费由供应商承担。</p>
                  <p><span className="font-semibold">7. 技术文件：</span>供应商应随货提供产品合格证、检验报告、使用说明书、质保卡等完整技术资料；如需特殊认证（CE、UL、CCC等），应提供相应证书复印件。</p>
                  <p><span className="font-semibold">8. 知识产权：</span>供应商保证所供产品不侵犯任何第三方知识产权；如因侵权引起纠纷，由供应商承担全部法律责任和经济损失。</p>
                  <p><span className="font-semibold">9. 保密条款：</span>双方对本订单内容及商业信息负有保密义务，未经对方书面同意不得向第三方披露；保密期限为合同终止后2年。</p>
                  <p><span className="font-semibold">10. 不可抗力：</span>因不可抗力（自然灾害、战争、政府行为等）导致无法履约，受影响方应在3日内书面通知对方，并提供相关证明；双方协商解决方案，免除相应责任。</p>
                  <p><span className="font-semibold">11. 质保与售后：</span>质保期为货到后12个月；质保期内因产品质量问题产生的维修、更换费用由供应商承担；供应商应提供及时的技术支持和售后服务。</p>
                  <p><span className="font-semibold">12. 争议解决：</span>双方如发生争议应友好协商解决，协商不成可向采购方所在地人民法院提起诉讼。本合同适用中华人民共和国法律。</p>
                </div>
              </div>

              {/* 签章区 */}
              <div className="mt-4 pt-2 border-t-2 border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-1 text-[9pt]">采购方（盖章）：</h4>
                    <div className="text-[8pt] space-y-1">
                      <p className="font-semibold text-[9pt]">{data.buyer.name}</p>
                      <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                        <p className="text-[8pt] text-gray-400">公司公章</p>
                      </div>
                      <div className="border-b border-gray-400 pb-0.5">
                        <p className="text-[8pt] text-gray-600">经办人签字：____________</p>
                      </div>
                      <p className="text-[8pt] text-gray-600">日期：____________</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-[9pt]">供应商（盖章）：</h4>
                    <div className="text-[8pt] space-y-1">
                      <p className="font-semibold text-[9pt]">{data.supplier.companyName}</p>
                      <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                        <p className="text-[8pt] text-gray-400">公司公章</p>
                      </div>
                      <div className="border-b border-gray-400 pb-0.5">
                        <p className="text-[8pt] text-gray-600">授权代表签字：____________</p>
                      </div>
                      <p className="text-[8pt] text-gray-600">日期：____________</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 页脚 */}
              <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-between items-center text-[7pt] text-gray-500">
                <div>https://www.figma.com/make</div>
                <div>第 2 页 / 共 {totalPages} 页</div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

PurchaseOrderDocumentPaginated.displayName = 'PurchaseOrderDocumentPaginated';
