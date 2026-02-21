import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 📋 供应商询价单（Request for Quotation - RFQ）
 * 
 * 用途：向供应商询价，获取产品报价和供应能力
 * 场景：采购需求池 → 发送询价给供应商 → 收集报价
 * 不包含：供应商收款信息、采购合同条款
 * 包含：产品质量、交货时间、验收标准、付款方式、包装唛头、验货技术文件、知识产权、保密条款
 */

export interface SupplierRFQData {
  // 询价单基本信息
  rfqNo: string;                    // RFQ-20251218-001
  rfqDate: string;                  // 2025-12-18
  requiredResponseDate: string;     // 要求回复日期
  requiredDeliveryDate: string;     // 要求交货日期
  inquiryDescription?: string;      // 询价说明（可选）
  
  // 询价方（公司）信息
  buyer: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    email: string;
    contactPerson: string;           // 采购员
  };
  
  // 供应商信息
  supplier: {
    companyName: string;
    address: string;
    contactPerson: string;
    tel: string;
    email: string;
    supplierCode?: string;           // 供应商专属编号
  };
  
  // 询价产品清单
  products: Array<{
    no: number;
    modelNo?: string;                // 型号
    imageUrl?: string;               // 产品图片
    itemCode?: string;               // 物料编码
    description: string;             // 产品名称
    specification: string;           // 规格
    quantity: number;                // 询价数量
    unit: string;                    // 单位
    targetPrice?: string;            // 目标价格（可选）
    remarks?: string;                // 备注
  }>;
  
  // 询价要求和条款
  terms: {
    // 基本商务条款
    paymentTerms?: string;            // 付款方式：T/T 30% deposit, 70% before shipment
    deliveryTerms?: string;           // 交货条款：EXW / FOB / CIF / DDP
    deliveryAddress?: string;         // 交货地址
    currency?: string;                // 报价币种
    
    // 产品质量要求
    qualityStandard?: string;         // 质量标准：符合GB/T、ISO、CE等标准
    inspectionMethod?: string;        // 验收标准：第三方检测、工厂验货、到货抽检等
    
    // 交货和包装要求
    deliveryRequirement?: string;     // 交货时间要求
    packaging?: string;               // 包装要求：标准出口包装、纸箱+托盘等
    shippingMarks?: string;           // 唛头要求：中性唛头、客户指定唛头等
    
    // 验货和技术文件
    inspectionRequirement?: string;   // 验货要求：出货前验货、第三方检验等
    technicalDocuments?: string;      // 技术文件：产品说明书、检测报告、认证证书等
    
    // 知识产权和保密
    ipRights?: string;                // 知识产权：产品设计、商标、专利归属等
    confidentiality?: string;         // 保密条款：客户信息、价格信息保密要求
    
    // 其他要求
    sampleRequirement?: string;      // 样品要求（可选）
    moq?: string;                    // 最小起订量要求（可选）
    remarks?: string;                // 其他说明（可选）
  };
}

interface SupplierRFQDocumentProps {
  data: SupplierRFQData;
}

export const SupplierRFQDocument = forwardRef<HTMLDivElement, SupplierRFQDocumentProps>(
  ({ data }, ref) => {
    
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
            .rfq-document {
              width: 210mm !important;
              max-width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            /* 内容区域 - 打印时不额外padding，margin已在@page设置 */
            .rfq-content {
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
            
            /* 条款区域 - 允许分页 */
            .terms-section {
              page-break-inside: auto !important;
              page-break-after: auto;
            }
            
            /* 产品清单区域 - 允许分页 */
            .products-section {
              page-break-inside: auto !important;
            }
          }
          
          /* 屏幕预览样式 */
          @media screen {
            .rfq-document {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              min-height: 297mm;
            }
          }
        `}</style>
        
        <div 
          ref={ref}
          className="rfq-document bg-white w-[210mm] mx-auto"
          style={{ 
            fontFamily: '"Microsoft YaHei", "SimHei", Arial, sans-serif',
            fontSize: '10pt',
            lineHeight: '1.5',
          }}
        >
          {/* ✅ 内容区域 - 屏幕预览20mm padding，打印时0 padding（margin在@page设置） */}
          <div className="rfq-content p-[20mm] print:p-0">
            {/* 页眉 - 台湾大厂紧凑风格 */}
            <div className="mb-3">
              {/* 第一行：Logo + 询价单标题 + 询价信息 */}
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
                
                {/* 中间：询价单标题 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wider text-black">
                      询价单
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Request for Quotation</p>
                  </div>
                </div>
                
                {/* 右侧：询价信息表格 */}
                <div className="w-[180px]">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">询价编号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.rfqNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">询价日期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          {new Date(data.rfqDate).toLocaleDateString('zh-CN', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit' 
                          }).replace(/\//g, '-')}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">回复截止</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-orange-600">
                          {new Date(data.requiredResponseDate).toLocaleDateString('zh-CN', { 
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

            {/* 询价方和供应商信息 - 台湾大厂表格风格 */}
            <div className="mb-3">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    {/* 询价方信息 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        询价方
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
                        供应商
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{data.supplier.companyName}</span></div>
                        {data.supplier.supplierCode && (
                          <div><span className="text-gray-600">供应商编号：</span><span className="font-semibold text-blue-600">{data.supplier.supplierCode}</span></div>
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

            {/* 询价说明 */}
            <div className="mb-3 bg-orange-50 border border-orange-200 rounded p-2">
              <p className="text-xs text-gray-700">
                <span className="font-semibold text-orange-700">📋 询价说明：</span>
                {data.inquiryDescription ? (
                  <span>{data.inquiryDescription}</span>
                ) : (
                  <>
                    请贵司根据以下产品清单和要求提供详细报价，包括单价、总价、交货期等信息。
                    请在 <span className="font-bold text-orange-600">{new Date(data.requiredResponseDate).toLocaleDateString('zh-CN', { 
                      year: 'numeric', 
                      month: '2-digit', 
                      day: '2-digit' 
                    }).replace(/\//g, '-')}</span> 前将报价单回复至采购联系人邮箱。
                  </>
                )}
              </p>
            </div>

            {/* 询价产品清单 */}
            <div className="products-section mb-4">
              <h3 className="font-bold text-base mb-2">询价产品清单：</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left w-8">序号</th>
                    <th className="border border-gray-300 px-2 py-2 text-left w-20">型号</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">图片</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">产品名称/规格</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-16">数量</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-10">单位</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => {
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 询价要求和条款 - 台湾大厂表格风格 */}
            <div className="terms-section mb-6">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">
                      询价要求和条款
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 报价币种 */}
                  {data.terms.currency && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">1. 报价币种：</span>
                        <span className="ml-1">{data.terms.currency}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 付款方式 */}
                  {data.terms.paymentTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">2. 付款方式：</span>
                        <span className="ml-1">{data.terms.paymentTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 交货条款 */}
                  {data.terms.deliveryTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">3. 交货条款：</span>
                        <span className="ml-1">{data.terms.deliveryTerms}</span>
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
                  
                  {/* 交货时间要求 */}
                  {data.terms.deliveryRequirement && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">5. 交货时间：</span>
                        <span className="ml-1">{data.terms.deliveryRequirement}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 产品质量标准 */}
                  {data.terms.qualityStandard && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">6. 产品质量标准：</span>
                        <span className="ml-1">{data.terms.qualityStandard}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 验收标准 */}
                  {data.terms.inspectionMethod && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">7. 验收标准：</span>
                        <span className="ml-1">{data.terms.inspectionMethod}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 包装要求 */}
                  {data.terms.packaging && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">8. 包装要求：</span>
                        <span className="ml-1">{data.terms.packaging}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 唛头要求 */}
                  {data.terms.shippingMarks && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">9. 唛头要求：</span>
                        <span className="ml-1">{data.terms.shippingMarks}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 验货要求 */}
                  {data.terms.inspectionRequirement && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">10. 验货要求：</span>
                        <span className="ml-1">{data.terms.inspectionRequirement}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 技术文件 */}
                  {data.terms.technicalDocuments && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">11. 技术文件：</span>
                        <span className="ml-1">{data.terms.technicalDocuments}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 知识产权 */}
                  {data.terms.ipRights && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">12. 知识产权：</span>
                        <span className="ml-1">{data.terms.ipRights}</span>
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
                  
                  {/* 样品要求 */}
                  {data.terms.sampleRequirement && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">14. 样品要求：</span>
                        <span className="ml-1">{data.terms.sampleRequirement}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 最小起订量 */}
                  {data.terms.moq && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">15. 最小起订量（MOQ）：</span>
                        <span className="ml-1">{data.terms.moq}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 其他说明 */}
                  {data.terms.remarks && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">16. 其他说明：</span>
                        <span className="ml-1">{data.terms.remarks}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 授权签名区域 */}
            <div className="signature-section mt-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold mb-4">询价方（盖章）：</h4>
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
                  <h4 className="font-bold mb-4">供应商（盖章确认）：</h4>
                  <div className="text-sm space-y-3">
                    <p className="font-semibold">{data.supplier.companyName}</p>
                    {data.supplier.supplierCode && (
                      <p className="text-xs text-gray-600">供应商编号：{data.supplier.supplierCode}</p>
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

              {/* 页脚说明 */}
              <div className="text-xs text-gray-500 text-center border-t border-gray-200 pt-3 mt-6">
                <p>请供应商在收到本询价单后 3 个工作日内确认回复。</p>
                <p className="mt-1">如有疑问，请及时联系采购联系人：{data.buyer.contactPerson} | {data.buyer.email}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

SupplierRFQDocument.displayName = 'SupplierRFQDocument';