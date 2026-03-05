import React, { forwardRef } from 'react';

/**
 * 📋 供应商报价单（Quotation）
 * 
 * 用途：供应商响应询价，向COSUN提供正式报价
 * 场景：收到询价单 → 供应商填写报价 → 生成报价单文档
 * 包含：产品报价、供应能力、交货条件、付款方式等
 */

export interface SupplierQuotationData {
  // 报价单基本信息
  quotationNo: string;              // BJ-20251218-001
  quotationDate: string;            // 2025-12-18
  validUntil: string;               // 报价有效期至
  xjReference?: string;            // 关联的询价单号（可选）
  inquiryReference?: string;        // 🔥 原始询价说明（业务部说明+特殊要求等）
  
  // 报价方（供应商）信息
  supplier: {
    companyName: string;
    companyNameEn?: string;
    address: string;
    addressEn?: string;
    tel: string;
    email: string;
    contactPerson: string;
    supplierCode?: string;
    logo?: string;                  // 供应商LOGO
  };
  
  // 询价方（COSUN）信息
  buyer: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;           // 采购员
  };
  
  // 报价产品清单
  products: Array<{
    no: number;
    modelNo?: string;                // 型号
    imageUrl?: string;               // 产品图片
    itemCode?: string;               // 物料编码
    description: string;             // 产品名称
    specification: string;           // 规格
    quantity: number;                // 数量
    unit: string;                    // 单位
    unitPrice: number;               // 报价单价
    currency: string;                // 货币单位（USD/CNY/EUR等）
    remarks?: string;                // 备注
  }>;
  
  // 报价条款
  terms: {
    // 基本商务条款
    paymentTerms?: string;           // 付款方式
    deliveryTerms?: string;          // 交货条款（FOB/CIF/DDP等）
    deliveryTime?: string;           // 交货时间
    deliveryAddress?: string;        // 交货地址
    
    // 产品和质量
    moq?: string;                    // 最小起订量
    qualityStandard?: string;        // 质量标准
    warranty?: string;               // 质保期
    
    // 包装和运输
    packaging?: string;              // 包装方式
    shippingMarks?: string;          // 唛头
    
    // 其他条款
    remarks?: string;                // 其他说明
  };
  
  // 🔥 供应商备注
  supplierRemarks?: {
    content: string;                 // 备注内容
    remarkDate?: string;             // 备注日期
    remarkBy?: string;               // 备注人
  };
}

interface SupplierQuotationDocumentProps {
  data: SupplierQuotationData;
}

export const SupplierQuotationDocument = forwardRef<HTMLDivElement, SupplierQuotationDocumentProps>(
  ({ data }, ref) => {
    
    // 计算总价
    const calculateGrandTotal = () => {
      return data.products.reduce((sum, product) => {
        return sum + (product.unitPrice * product.quantity);
      }, 0);
    };
    
    return (
      <>
        {/* 🔥 打印专用样式 - A4标准分页支持 */}
        <style>{`
          /* ✅ A4页面设置 - 国际标准 */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          /* ✅ 打印时的样式优化 */
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .print-document {
              width: 794px;
              min-height: 1123px;
              padding: 15mm 15mm;
              margin: 0 auto;
              background: white;
              box-shadow: none !important;
              page-break-after: always;
            }
            
            /* 🔥 强制表格不分页 */
            .products-section table,
            .terms-section table {
              page-break-inside: avoid;
            }
            
            /* 🔥 避免标题和内容分离 */
            h3 {
              page-break-after: avoid;
            }
            
            /* 隐藏不需要打印的元素 */
            button,
            .no-print {
              display: none !important;
            }
          }
          
          /* ✅ 屏幕预览样式 */
          @media screen {
            .print-document {
              width: 794px;
              min-height: 1123px;
              padding: 15mm 15mm;
              margin: 0 auto;
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        `}</style>

        {/* 📄 报价单文档主体 */}
        <div ref={ref} className="print-document">
          <div className="document-content">
            
            {/* 文档头部 - Logo + 标题 + 报价信息 */}
            <div className="mb-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                {/* 左侧：供应商Logo */}
                <div className="w-[150px] h-[60px] flex items-center">
                  {data.supplier.logo ? (
                    <img
                      src={data.supplier.logo}
                      alt={`${data.supplier.companyName} Logo`}
                      className="w-full h-auto max-h-full"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">供应商LOGO</span>
                    </div>
                  )}
                </div>
                
                {/* 中间：报价单标题 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wider text-black">
                      报价单
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Quotation</p>
                  </div>
                </div>
                
                {/* 右侧：报价信息表格 */}
                <div className="w-[216px]">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">报价编号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.quotationNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">报价日期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          {new Date(data.quotationDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '-')}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">有效期至</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-orange-600">
                          {new Date(data.validUntil).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '-')}
                        </td>
                      </tr>
                      {data.xjReference && (
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">询价单号</td>
                          <td className="border border-gray-400 px-1.5 py-0.5 text-blue-600 text-xs">
                            {data.xjReference}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 分隔线 - 双线设计 */}
              <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
            </div>

            {/* 报价方和询价方信息 - 台湾大厂表格风格 */}
            <div className="mb-3">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    {/* 报价方信息（供应商） */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        报价方（供应商）
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                        {data.supplier.companyNameEn && (
                          <div className="text-gray-600">{data.supplier.companyNameEn}</div>
                        )}
                        {data.supplier.supplierCode && (
                          <div><span className="text-gray-600">供应商编号：</span><span className="font-semibold text-blue-600">{data.supplier.supplierCode}</span></div>
                        )}
                        <div><span className="text-gray-600">地址：</span>{data.supplier.address}</div>
                        {data.supplier.addressEn && (
                          <div className="text-gray-600 text-xs">{data.supplier.addressEn}</div>
                        )}
                        <div><span className="text-gray-600">电话：</span>{data.supplier.tel}</div>
                        <div><span className="text-gray-600">邮箱：</span>{data.supplier.email}</div>
                        <div><span className="text-gray-600">联系人：</span>{data.supplier.contactPerson}</div>
                      </div>
                    </td>
                    
                    {/* 询价方信息（COSUN） */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        询价方（客户）
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{data.buyer.name}</span></div>
                        <div className="text-gray-600">{data.buyer.nameEn}</div>
                        <div><span className="text-gray-600">地址：</span>{data.buyer.address}</div>
                        <div><span className="text-gray-600">电话：</span>{data.buyer.tel}</div>
                        <div><span className="text-gray-600">邮箱：</span>{data.buyer.email}</div>
                        <div><span className="text-gray-600">联系人：</span>{data.buyer.contactPerson}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 报价说明 */}
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-xs text-gray-700">
                <span className="font-semibold text-blue-700">📋 报价说明：</span>
                本报价单是对贵司询价的正式回复，包含详细的产品报价和商务条款。
                报价有效期至 <span className="font-bold text-blue-600">{new Date(data.validUntil).toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                }).replace(/\//g, '-')}</span>，请在有效期内确认订单。
              </p>
            </div>

            {/* 🔥 原始询价说明（业务部说明+特殊要求） */}
            {data.inquiryReference && (
              <div className="mb-3 bg-orange-50 border border-orange-200 rounded p-2">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold text-orange-700">📝 询价说明：</span>
                  <span className="ml-1">{data.inquiryReference}</span>
                </p>
              </div>
            )}

            {/* 报价产品清单 */}
            <div className="products-section mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-base">报价产品清单：</h3>
                {/* 🔥 货币单位显示在右侧 - 默认为人民币元 */}
                <div className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded border border-orange-200">
                  货币单位：元
                </div>
              </div>
              <table className="w-full border-collapse border-2 border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left w-8">序号</th>
                    <th className="border border-gray-300 px-2 py-2 text-left w-20">型号</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">图片</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">产品名称/规格</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-10">单位</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-24">单价</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-24">报价金额</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => {
                    // 计算报价金额：报价单价 × 数量
                    const totalPrice = product.unitPrice * product.quantity;
                    
                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {product.no}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-700">
                          {product.modelNo || product.itemCode || '-'}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.description}
                              className="w-10 h-10 object-cover mx-auto rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">
                              无图
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="font-semibold">{product.description}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                          {product.quantity.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {product.unit}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right text-blue-600 font-medium">
                          {product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right font-semibold text-orange-600">
                          {totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* 总价行 */}
                  <tr className="bg-orange-50 font-bold">
                    <td colSpan={7} className="border-2 border-gray-400 px-2 py-2 text-right">
                      报价总额 (Total Amount):
                    </td>
                    <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600 text-sm">
                      {calculateGrandTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 报价条款 - 台湾大厂表格风格 */}
            <div className="terms-section mb-6">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">
                      报价条款
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 付款方式 */}
                  {data.terms.paymentTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">1. 付款方式：</span>
                        <span className="ml-1">{data.terms.paymentTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 交货条款 */}
                  {data.terms.deliveryTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">2. 交货条款：</span>
                        <span className="ml-1">{data.terms.deliveryTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 交货时间 */}
                  {data.terms.deliveryTime && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">3. 交货时间：</span>
                        <span className="ml-1">{data.terms.deliveryTime}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 交货地址 */}
                  {data.terms.deliveryAddress && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">4. 交货地址：</span>
                        <span className="ml-1">{data.terms.deliveryAddress}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 最小起订量 */}
                  {data.terms.moq && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">5. 最小起订量（MOQ）：</span>
                        <span className="ml-1">{data.terms.moq}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质量标准 */}
                  {data.terms.qualityStandard && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">6. 质量标准：</span>
                        <span className="ml-1">{data.terms.qualityStandard}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质保期 */}
                  {data.terms.warranty && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">7. 质保期：</span>
                        <span className="ml-1">{data.terms.warranty}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 包装方式 */}
                  {data.terms.packaging && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">8. 包装方式：</span>
                        <span className="ml-1">{data.terms.packaging}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 唛头 */}
                  {data.terms.shippingMarks && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">9. 唛头：</span>
                        <span className="ml-1">{data.terms.shippingMarks}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 其他说明 */}
                  {data.terms.remarks && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">10. 其他说明：</span>
                        <span className="ml-1">{data.terms.remarks}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 🔥 供应商备注 */}
            {data.supplierRemarks && data.supplierRemarks.content && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-300 rounded-md p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="font-bold text-sm text-blue-900">供应商备注：</h4>
                    {data.supplierRemarks.remarkDate && (
                      <span className="text-xs text-blue-600">
                        ({data.supplierRemarks.remarkDate})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {data.supplierRemarks.content}
                  </div>
                  {data.supplierRemarks.remarkBy && (
                    <div className="mt-2 text-xs text-blue-700">
                      备注人：{data.supplierRemarks.remarkBy}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 文档底部 - 签名区域 */}
            <div className="mt-8 pt-4 border-t-2 border-gray-300">
              <div className="grid grid-cols-2 gap-8">
                {/* 报价方签名 */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">报价方（供应商）</p>
                  <div className="border-b border-gray-400 pb-8 mb-2"></div>
                  <div className="text-xs text-gray-500">
                    <p>签字盖章：________________</p>
                    <p className="mt-1">日期：____年____月____日</p>
                  </div>
                </div>
                
                {/* 询价方确认 */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">询价方确认（客户）</p>
                  <div className="border-b border-gray-400 pb-8 mb-2"></div>
                  <div className="text-xs text-gray-500">
                    <p>签字盖章：________________</p>
                    <p className="mt-1">日期：____年____月____日</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 页脚说明 */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                本报价单一式两份，报价方和询价方各执一份。报价单经双方签字盖章后生效。
              </p>
            </div>

          </div>
        </div>
      </>
    );
  }
);

SupplierQuotationDocument.displayName = 'SupplierQuotationDocument';