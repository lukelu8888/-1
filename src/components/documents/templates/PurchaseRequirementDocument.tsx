import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 📋 采购需求单（Purchase Requirement - QR）
 * 
 * 用途：内部采购询价单，从客户询价单（INQ）下推生成，用于向采购部门提交成本询价需求
 * 场景：客户询价（INQ）→ 采购需求（QR）→ 采购询价（XJ）→ 供应商报价（BJ）
 * 包含：客户信息、产品信息、客户需求要素、采购要求
 */

export interface PurchaseRequirementDocumentData {
  // 采购需求单基本信息
  requirementNo: string;                // QR-NA-251220-0001
  requirementDate: string;              // 2025-12-20
  sourceInquiryNo: string;              // 来源询价单号 INQ-NA-251220-0001
  requiredResponseDate: string;         // 要求回复日期
  requiredDeliveryDate: string;         // 要求交货日期
  
  // 客户信息
  customer: {
    companyName: string;                // 客户公司名称
    contactPerson: string;              // 客户联系人
    email: string;                      // 客户邮箱
    phone: string;                      // 客户电话
    address: string;                    // 客户地址
    region: string;                     // 客户区域（North America / South America / Europe-Africa）
    businessType?: string;              // 客户业务类型（可选）
  };
  
  // 产品清单
  products: Array<{
    no: number;
    modelNo: string;                    // 型号
    imageUrl?: string;                  // 产品图片
    productName: string;                // 产品名称
    specification: string;              // 规格
    quantity: number;                   // 数量
    unit: string;                       // 单位
    unitPrice?: number;                 // 单价
    currency?: string;                  // 货币类型（CNY/USD/EUR）🔥 新增
    moq?: number;                       // 最小起订量 🔥 新增
    leadTime?: string;                  // 交货期 🔥 新增
    totalPrice?: number;                // 总价（USD）- 可选，如果不提供则自动计算
    remarks?: string;                   // 备注
  }>;
  
  // 客户需求要素
  customerRequirements: {
    deliveryTerms?: string;             // 交货条款：FOB / CIF / DDP等
    paymentTerms?: string;              // 付款方式
    qualityStandard?: string;           // 质量标准
    packaging?: string;                 // 包装要求
    specialRequirements?: string;       // 特殊要求
  };
  
  // 业务部说明
  salesDeptNotes?: string;              // 业务部门备注说明（由业务员填写）
  
  // 采购部反馈
  purchaseDeptFeedback?: string;        // 采购部反馈（由采购部填写）
  
  urgency: 'low' | 'medium' | 'high';   // 紧急程度
  createdBy: string;                    // 创建人（业务员）
}

interface PurchaseRequirementDocumentProps {
  data: PurchaseRequirementDocumentData;
}

export const PurchaseRequirementDocument = forwardRef<HTMLDivElement, PurchaseRequirementDocumentProps>(
  ({ data }, ref) => {
    
    // 紧急程度配置
    const urgencyConfig = {
      low: { label: '普通', color: 'text-gray-600', bgColor: 'bg-gray-100' },
      medium: { label: '一般', color: 'text-blue-600', bgColor: 'bg-blue-100' },
      high: { label: '紧急', color: 'text-red-600', bgColor: 'bg-red-100' },
    };
    
    const urgencyInfo = urgencyConfig[data.urgency];
    
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
            .qr-document {
              width: 794px !important;
              max-width: 794px !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            /* 内容区域 - 打印时不额外padding，margin已在@page设置 */
            .qr-content {
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
          }
          
          /* 屏幕预览样式 */
          @media screen {
            .qr-document {
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              min-height: 1123px;
            }
          }
        `}</style>
        
        <div 
          ref={ref}
          className="qr-document bg-white w-[794px] min-h-[1123px] mx-auto"
          style={{ 
            fontFamily: '"Microsoft YaHei", "SimHei", Arial, sans-serif',
            fontSize: '10pt',
            lineHeight: '1.5',
          }}
        >
          {/* ✅ 内容区域 - 屏幕预览20mm padding，打印时0 padding（margin在@page设置） */}
          <div className="qr-content p-[20mm] print:p-0">
            {/* 页眉 - 台湾大厂紧凑风格 */}
            <div className="mb-3">
              {/* 第一行：Logo + 采购需求单标题 + 单据信息 */}
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
                
                {/* 中间：采购需求单标题 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wider text-black">
                      采购需求单
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">Purchase Requirement</p>
                  </div>
                </div>
                
                {/* 右侧：单据信息表格 */}
                <div className="w-[210px]">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">单据编号</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.requirementNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">创建日期</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          {new Date(data.requirementDate).toLocaleDateString('zh-CN', { 
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

            {/* 单据关系和紧急程度 */}
            <div className="mb-3 flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
              <div className="text-xs">
                <span className="text-gray-600">来源询价单：</span>
                <span className="font-bold text-blue-600 ml-1">{data.sourceInquiryNo}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyInfo.bgColor} ${urgencyInfo.color}`}>
                紧急程度：{urgencyInfo.label}
              </div>
            </div>

            {/* 客户信息和创建人信息 - 台湾大厂表格风格 */}
            <div className="mb-3">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    {/* 客户信息 - 不泄露客户名称和联系方式 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        客户信息
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="text-gray-600">区域：</span>{data.customer.region}</div>
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="text-xs text-gray-600 leading-relaxed">
                            该客户来自{data.customer.region}市场，从事{data.customer.businessType || '建材贸易'}业务。客户详细信息已登记在业务部门系统，采购部门如需了解更多客户背景，请联系对应业务员。
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* 创建人信息 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        创建人信息
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="text-gray-600">业务员：</span><span className="font-semibold">{data.createdBy}</span></div>
                        <div><span className="text-gray-600">部门：</span>销售部</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 产品清单 */}
            <div className="products-section mb-4">
              <h3 className="font-bold text-base mb-2">产品清单：</h3>
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
                    <th className="border border-gray-300 px-2 py-2 text-right w-20">总价</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => {
                    const totalPrice = product.totalPrice || (product.unitPrice ? product.quantity * product.unitPrice : 0);
                    // 🔥 货币符号映射
                    const currencySymbol = product.currency === 'USD' ? '$' : 
                                          product.currency === 'EUR' ? '€' : 
                                          product.currency === 'CNY' ? '¥' : 
                                          (product.currency || '¥');
                    
                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {product.no}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-700">
                          {product.modelNo || '-'}
                        </td>
                        <td className="border border-gray-300 px-1 py-1 text-center">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.productName}
                              className="w-10 h-10 object-cover mx-auto rounded"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">
                              无图
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="font-semibold">{product.productName}</div>
                          <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
                          {/* 🔥 显示MOQ和交货期 */}
                          {(product.moq || product.leadTime) && (
                            <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                              {product.moq && <div>MOQ: {product.moq} {product.unit}</div>}
                              {product.leadTime && <div>交期: {product.leadTime}</div>}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                          {product.quantity.toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-center">
                          {product.unit}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right text-blue-600">
                          {product.unitPrice ? `${currencySymbol}${product.unitPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right text-blue-600 font-semibold">
                          {totalPrice > 0 ? `${currencySymbol}${totalPrice.toFixed(2)}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* 总计行 */}
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="border-2 border-gray-400 px-2 py-2 text-right">
                      总计 (Total):
                    </td>
                    <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600">
                      {data.products.reduce((sum, p) => sum + p.quantity, 0).toLocaleString()}
                    </td>
                    <td className="border-2 border-gray-400 px-2 py-2"></td>
                    <td className="border-2 border-gray-400 px-2 py-2"></td>
                    <td className="border-2 border-gray-400 px-2 py-2 text-right text-orange-600">
                      {(() => {
                        const total = data.products.reduce((sum, p) => {
                          const itemTotal = p.totalPrice || (p.unitPrice ? p.quantity * p.unitPrice : 0);
                          return sum + itemTotal;
                        }, 0);
                        return total > 0 ? `¥${total.toFixed(2)}` : '-';
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 客户需求要素 - 台湾大厂表格风格 */}
            <div className="terms-section mb-6">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold">
                      客户需求要素
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 交货条款 */}
                  {data.customerRequirements.deliveryTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">1. 交货条款：</span>
                        <span className="ml-1">{data.customerRequirements.deliveryTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 付款方式 */}
                  {data.customerRequirements.paymentTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">2. 付款方式：</span>
                        <span className="ml-1">{data.customerRequirements.paymentTerms}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 质量标准 */}
                  {data.customerRequirements.qualityStandard && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">3. 质量标准：</span>
                        <span className="ml-1">{data.customerRequirements.qualityStandard}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 包装要求 */}
                  {data.customerRequirements.packaging && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">4. 包装要求：</span>
                        <span className="ml-1">{data.customerRequirements.packaging}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* 特殊要求 */}
                  {data.customerRequirements.specialRequirements && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">5. 特殊要求：</span>
                        <span className="ml-1">{data.customerRequirements.specialRequirements}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 业务部说明 */}
            <div className="mb-4">
              <h3 className="font-bold text-base mb-2">业务部说明：</h3>
              <div className="border border-gray-300 rounded p-3 bg-orange-50 text-xs space-y-1">
                {data.salesDeptNotes ? (
                  <div className="whitespace-pre-wrap">{data.salesDeptNotes}</div>
                ) : (
                  <>
                    <p>✓ 请根据产品清单向合适的供应商发送采购询价，获取最优成本价格</p>
                    <p>✓ 供应商报价需包括：单价、总价、交货期、付款方式、MOQ等信息</p>
                    <p>✓ 如有质量认证要求，请要求供应商提供相关证书和检测报告</p>
                    <p>✓ 请在回复截止日期前完成询价，并将成本反馈给业务员</p>
                    <p>✓ 考虑供应商的生产能力、交货周期、历史合作质量等因素</p>
                  </>
                )}
              </div>
            </div>

            {/* 采购部反馈 */}
            <div className="mb-6">
              <h3 className="font-bold text-base mb-2">采购部反馈：</h3>
              <div className="border border-gray-300 rounded p-3 bg-blue-50 text-xs min-h-[100px]">
                {data.purchaseDeptFeedback ? (
                  <div className="whitespace-pre-wrap">{data.purchaseDeptFeedback}</div>
                ) : (
                  <div className="text-gray-400 italic">
                    （此处由采购部填写供应商报价反馈，包括成本价格、交货期、MOQ等信息）
                  </div>
                )}
              </div>
            </div>

            {/* 审批签名区域 */}
            <div className="signature-section mt-8">
              <div className="grid grid-cols-3 gap-6">
                {/* 业务员 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">业务员（创建）：</h4>
                  <div className="text-xs space-y-2">
                    <p className="font-semibold">{data.createdBy}</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">签字</p>
                    </div>
                    <p className="text-xs text-gray-600">日期：{new Date(data.requirementDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
                
                {/* 采购部门 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">采购部门（处理）：</h4>
                  <div className="text-xs space-y-2">
                    <p className="text-gray-500">采购员：____________</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">签字</p>
                    </div>
                    <p className="text-xs text-gray-600">日期：_____________</p>
                  </div>
                </div>
                
                {/* 业务主管 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">业务主管（审批）：</h4>
                  <div className="text-xs space-y-2">
                    <p className="text-gray-500">主管：____________</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">签字</p>
                    </div>
                    <p className="text-xs text-gray-600">日期：_____________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 页脚说明 */}
            <div className="mt-8 pt-4 border-t border-gray-300">
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 本采购需求单为内部文件，请妥善保管，不得外泄</p>
                <p>• 采购部门应遵循公司采购流程和保密规定</p>
                <p>• 单据编号规则：QR-[区域代码]-[日期YYMMDD]-[流水号]</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

PurchaseRequirementDocument.displayName = 'PurchaseRequirementDocument';
