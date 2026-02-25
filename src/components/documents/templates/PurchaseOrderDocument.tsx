import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 📋 采购订单/采购合同（Purchase Order）
 * 
 * 用途：发给供应商的正式采购订单
 * 场景：公司作为买方，向供应商采购产品/原材料
 * 数据来源：采购需求 + 供应商报价
 * 语言：全中文版本
 */

export interface PurchaseOrderData {
  // 采购单基本信息
  poNo: string;                // PO-20251215-001
  poDate: string;              // 2025-12-15
  requiredDeliveryDate: string; // 2026-01-15
  
  // 买方（公司）信息
  buyer: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;      // 采购员
  };
  
  // 卖方（供应商）信息
  supplier: {
    companyName: string;
    address: string;
    contactPerson: string;
    tel: string;
    email: string;
    supplierCode?: string;      // 供应商编码
    // 银行收款信息
    bankInfo?: {
      bankName: string;         // 开户银行
      accountName: string;      // 账户名称
      accountNumber: string;    // 银行账号
      swiftCode?: string;       // SWIFT代码（国际汇款）
      bankAddress?: string;     // 银行地址
      routingNumber?: string;   // 路由号码（美国）
      iban?: string;            // IBAN号码（欧洲）
      currency?: string;        // 收款币种
    };
  };
  
  // 采购产品清单
  products: Array<{
    no: number;
    modelNo?: string;           // 型号
    imageUrl?: string;          // 产品图片
    itemCode?: string;          // 物料编码
    description: string;
    specification: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    currency: string;
    amount: number;
    deliveryDate?: string;      // 交货日期
    remarks?: string;           // 备注
  }>;
  
  // 采购条款
  terms: {
    totalAmount: number;
    currency: string;
    paymentTerms: string;       // 30 days after delivery / T/T 30% deposit
    deliveryTerms: string;      // EXW / FOB / DDP
    deliveryAddress: string;    // 交货地址
    qualityStandard: string;    // 质量标准
    inspectionMethod: string;   // 验收方式
    // 扩展的专业采购条款
    packaging?: string;         // 包装要求
    shippingMarks?: string;     // 唛头要求
    deliveryPenalty?: string;   // 延期交货违约金
    qualityPenalty?: string;    // 质量不符违约金
    warrantyPeriod?: string;    // 质保期
    warrantyTerms?: string;     // 质保条款
    returnPolicy?: string;      // 退换货政策
    confidentiality?: string;   // 保密条款
    ipRights?: string;          // 知识产权
    forceMajeure?: string;      // 不可抗力
    disputeResolution?: string; // 争议解决
    applicableLaw?: string;     // 适用法律
    contractValidity?: string;  // 合同有效期
    modification?: string;      // 合同变更
    termination?: string;       // 合同终止
  };
}

interface PurchaseOrderDocumentProps {
  data: PurchaseOrderData;
}

export const PurchaseOrderDocument = forwardRef<HTMLDivElement, PurchaseOrderDocumentProps>(
  ({ data }, ref) => {
    
    const total = data.products.reduce((sum, item) => sum + item.amount, 0);

    return (
      <>
        {/* 🔥 打印专用样式 - A4标准分页支持 */}
        <style>{`
          /* ✅ A4页面设置 - 国际标准 */
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          /* 打印时的全局样式 */
          @media print {
            html, body {
              margin: 0;
              padding: 0;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            
            /* 文档容器 - A4标准宽度 210mm */
            .purchase-order-document {
              width: 794px !important;
              max-width: 794px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            /* 内容区域 - 打印时不额外padding，margin已在@page设置 */
            .purchase-order-content {
              padding: 0 !important;
              margin: 0 !important;
              page-break-after: auto;
            }
            
            /* 表格打印优化 - 允许跨页 */
            table {
              page-break-inside: auto !important;
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            /* 表格行避免被切断 */
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            
            /* 表头在每页重复 */
            thead {
              display: table-header-group !important;
            }
            
            /* 表尾在每页底部 */
            tfoot {
              display: table-footer-group !important;
            }
            
            /* 避免标题被切断 */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* 签名区域避免被切断 */
            .signature-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-before: auto;
            }
            
            /* 页脚说明避免被切断 */
            .footer-note {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            /* 合同条款区域 - 允许分页，但在签名前尝试分页 */
            .terms-section {
              page-break-inside: auto !important;
              page-break-after: auto;
            }
            
            /* 产品清单区域 - 允许分页 */
            .products-section {
              page-break-inside: auto !important;
            }
            
            /* 银行信息避免被切断 */
            .bank-info-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
          
          /* 屏幕预览样式 */
          @media screen {
            .purchase-order-document {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              /* A4标准宽度 210mm，屏幕预览时显示阴影效果 */
              min-height: 1123px;
            }
          }
        `}</style>
        
        <div 
          ref={ref}
          className="purchase-order-document bg-white w-[794px] min-h-[1123px] mx-auto"
          style={{ 
            fontFamily: '"Microsoft YaHei", "SimHei", Arial, sans-serif',
            fontSize: '10pt',
            lineHeight: '1.5',
          }}
        >
          {/* ✅ 内容区域 - 屏幕预览20mm padding，打印时0 padding（margin在@page设置） */}
          <div className="purchase-order-content p-[20mm] print:p-0">
            {/* 页眉 - 台湾大厂紧凑风格 */}
            <div className="mb-3">
              {/* 第一行：Logo + 采购订单标题 + 订单信息 */}
              <div className="flex items-center justify-between mb-2">
                {/* 左侧：Logo */}
                <div className="w-[80px] h-[70px] flex items-center">
                  <img
                    src={cosunLogo}
                    alt="THE COSUN Logo"
                    className="w-full h-auto max-h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                {/* 中间：采购订单标题 */}
                <div className="flex-1 flex justify-center items-center">
                  <h1 className="text-3xl font-bold tracking-wider text-black">
                    采购订单
                  </h1>
                </div>
                
                {/* 右侧：订单信息表格 */}
                <div className="w-[180px] h-[70px]">
                  <table className="w-full h-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">订单编号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.poNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">订单日期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          {new Date(data.poDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '-')}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">要求交期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                          {new Date(data.requiredDeliveryDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '-')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 分隔线 - 双线设计 */}
              <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
            </div>

            {/* 采购方和供应商信息 - 台湾大厂表格风格 */}
            <div className="mb-3">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    {/* 采购方信息 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        采购方（买方）
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
                    
                    {/* 供应商信息 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        供应商（卖方）
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                        {data.supplier.supplierCode && (
                          <div><span className="text-gray-600">编码：</span>{data.supplier.supplierCode}</div>
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
            <div className="products-section mb-4">
              <h3 className="font-bold text-base mb-2">采购明细：</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left w-8">序号</th>
                    <th className="border border-gray-300 px-2 py-2 text-left w-20">型号</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">图片</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">产品名称/规格</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-10">单位</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-20">单价</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-24">金额</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => (
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
                      <td className="border border-gray-300 px-2 py-2 text-right">
                        {product.quantity.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        {product.unit}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right">
                        {product.currency} {(product.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                        {product.currency} {(product.amount || product.totalPrice || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                      采购总金额：
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right text-base text-black">
                      {data.terms.currency} {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 供应商银行收款信息 - 台湾大厂表格风格 */}
            {data.supplier.bankInfo && (
              <div className="bank-info-section mb-4">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={4}>
                        供应商银行收款信息
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">开户银行</td>
                      <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.supplier.bankInfo.bankName}</td>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">账户名称</td>
                      <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.supplier.bankInfo.accountName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">银行账号</td>
                      <td className="border border-gray-400 px-2 py-1.5 font-bold" colSpan={3}>
                        {data.supplier.bankInfo.accountNumber}
                      </td>
                    </tr>
                    {(data.supplier.bankInfo.swiftCode || data.supplier.bankInfo.currency) && (
                      <tr>
                        {data.supplier.bankInfo.swiftCode && (
                          <>
                            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">SWIFT代码</td>
                            <td className="border border-gray-400 px-2 py-1.5">{data.supplier.bankInfo.swiftCode}</td>
                          </>
                        )}
                        {data.supplier.bankInfo.currency && (
                          <>
                            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">收款币种</td>
                            <td className="border border-gray-400 px-2 py-1.5">{data.supplier.bankInfo.currency}</td>
                          </>
                        )}
                      </tr>
                    )}
                    {data.supplier.bankInfo.iban && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">IBAN号码</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.supplier.bankInfo.iban}</td>
                      </tr>
                    )}
                    {data.supplier.bankInfo.routingNumber && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">路由号码</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.supplier.bankInfo.routingNumber}</td>
                      </tr>
                    )}
                    {data.supplier.bankInfo.bankAddress && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">银行地址</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.supplier.bankInfo.bankAddress}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 合同条款 - 台湾大厂表格风格 */}
            <div className="terms-section mb-6">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">
                      合同条款
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 付款条款 */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">1. 付款条款：</span>
                      <span className="ml-1">{data.terms.paymentTerms}</span>
                    </td>
                  </tr>
                  
                  {/* 交货条款 */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2. 交货条款：</span>
                      <span className="ml-1">{data.terms.deliveryTerms}</span>
                    </td>
                  </tr>
                  
                  {/* 交货地址 */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">3. 交货地址：</span>
                      <span className="ml-1">{data.terms.deliveryAddress}</span>
                    </td>
                  </tr>
                  
                  {/* 质量标准 */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">4. 质量标准：</span>
                      <span className="ml-1">{data.terms.qualityStandard}</span>
                    </td>
                  </tr>
                  
                  {/* 验收方式 */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">5. 验收方式：</span>
                      <span className="ml-1">{data.terms.inspectionMethod}</span>
                    </td>
                  </tr>
                  
                  {/* 包装要求 */}
                  {data.terms.packaging && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">6. 包装要求：</span>
                        <span className="ml-1">{data.terms.packaging}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 唛头要求 */}
                  {data.terms.shippingMarks && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">7. 唛头要求：</span>
                        <span className="ml-1">{data.terms.shippingMarks}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质保期 */}
                  {data.terms.warrantyPeriod && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">8. 质保期：</span>
                        <span className="ml-1">{data.terms.warrantyPeriod}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质保条款 */}
                  {data.terms.warrantyTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">9. 质保条款：</span>
                        <span className="ml-1">{data.terms.warrantyTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 退换货政策 */}
                  {data.terms.returnPolicy && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">10. 退换货政策：</span>
                        <span className="ml-1">{data.terms.returnPolicy}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 延期交货违约金 */}
                  {data.terms.deliveryPenalty && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">11. 延期交货违约金：</span>
                        <span className="ml-1">{data.terms.deliveryPenalty}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质量不符违约金 */}
                  {data.terms.qualityPenalty && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">12. 质量不符违约金：</span>
                        <span className="ml-1">{data.terms.qualityPenalty}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 保密条款 */}
                  {data.terms.confidentiality && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">13. 保密条款：</span>
                        <span className="ml-1">{data.terms.confidentiality}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 知识产权 */}
                  {data.terms.ipRights && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">14. 知识产权：</span>
                        <span className="ml-1">{data.terms.ipRights}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 不可抗力 */}
                  {data.terms.forceMajeure && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">15. 不可抗力：</span>
                        <span className="ml-1">{data.terms.forceMajeure}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 争议解决 */}
                  {data.terms.disputeResolution && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">16. 争议解决：</span>
                        <span className="ml-1">{data.terms.disputeResolution}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 适用法律 */}
                  {data.terms.applicableLaw && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">17. 适用法律：</span>
                        <span className="ml-1">{data.terms.applicableLaw}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 合同有效期 */}
                  {data.terms.contractValidity && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">18. 合同有效期：</span>
                        <span className="ml-1">{data.terms.contractValidity}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 合同变更 */}
                  {data.terms.modification && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">19. 合同变更：</span>
                        <span className="ml-1">{data.terms.modification}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 合同终止 */}
                  {data.terms.termination && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">20. 合同终止：</span>
                        <span className="ml-1">{data.terms.termination}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 授权签名区域 + 页脚说明 - 作为整体避免分页 */}
            <div className="signature-section mt-6">
              {/* 签名区域 */}
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                  <h4 className="font-bold mb-4">采购方（盖章）：</h4>
                  <div className="text-sm space-y-3">
                    <p className="font-semibold">{data.buyer.name}</p>
                    <p className="text-xs text-gray-600">{data.buyer.nameEn}</p>
                    <div className="border-2 border-dashed border-gray-300 rounded p-6 mt-4 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">公司盖章处</p>
                    </div>
                    <div className="mt-4 space-y-1">
                      <div className="border-b border-gray-400 pb-1">
                        <p className="text-xs text-gray-600">授权代表签字</p>
                      </div>
                      <p className="text-xs text-gray-600">日期：_________________</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-4">供应方（盖章）：</h4>
                  <div className="text-sm space-y-3">
                    <p className="font-semibold">{data.supplier.companyName}</p>
                    {data.supplier.supplierCode && (
                      <p className="text-xs text-gray-600">供应商编码：{data.supplier.supplierCode}</p>
                    )}
                    <div className="border-2 border-dashed border-gray-300 rounded p-6 mt-4 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">公司盖章处</p>
                    </div>
                    <div className="mt-4 space-y-1">
                      <div className="border-b border-gray-400 pb-1">
                        <p className="text-xs text-gray-600">授权代表签字</p>
                      </div>
                      <p className="text-xs text-gray-600">日期：_________________</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 页脚说明 - 与签名区域一起，不分页 */}
              <div className="text-xs text-gray-500 text-center border-t border-gray-200 pt-3">
                <p>本采购订单一式两份，采购方和供应方各执一份，双方签章后生效。</p>
                <p className="mt-1">请供应方签章确认后回扫件至采购方邮箱。</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

PurchaseOrderDocument.displayName = 'PurchaseOrderDocument';
