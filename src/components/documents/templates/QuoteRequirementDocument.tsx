import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import type { DocumentConditionGroup } from '../../../types/documentConditions';

/**
 * 📋 报价请求单（Quote Requirement - QR）
 *
 * 用途：业务员向采购员发起内部报价请求，请采购去找供应商拿价格
 * 场景：客户询价（INQ）→ 报价请求（QR）→ 采购询价（XJ）→ 供应商报价（BJ）
 * 包含：客户信息、产品信息、客户需求要素、报价请求说明
 */

export interface QuoteRequirementDocumentData {
  // 报价请求单基本信息
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
  conditionGroups?: DocumentConditionGroup[];
  
  // 业务部说明
  salesDeptNotes?: string;              // 业务部门备注说明（由业务员填写）
  
  // 采购部反馈
  purchaseDeptFeedback?: string;        // 采购部反馈（由采购部填写）
  
  urgency: 'low' | 'medium' | 'high';   // 紧急程度
  createdBy: string;                    // 创建人（业务员）
}

export interface QuoteRequirementPreviewLayout {
  dialogExtraWidthPx: number;
  dialogViewportMarginPx: number;
  dialogTopPx: number;
  canvasWidthMm: number;
  canvasMinHeightMm: number;
  contentPaddingLeftMm: number;
  contentPaddingRightMm: number;
  contentPaddingTopMm: number;
  contentPaddingBottomMm: number;
  fontSizePt: number;
  lineHeight: number;
}

export const DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT: QuoteRequirementPreviewLayout = {
  dialogExtraWidthPx: 44,
  dialogViewportMarginPx: 16,
  dialogTopPx: 8,
  canvasWidthMm: 210,
  canvasMinHeightMm: 297,
  contentPaddingLeftMm: 12,
  contentPaddingRightMm: 12,
  contentPaddingTopMm: 10,
  contentPaddingBottomMm: 12,
  fontSizePt: 10,
  lineHeight: 1.5,
};

export interface QuoteRequirementTextOverrides {
  documentTitle: string;
  documentTitleEn: string;
  sourceInquiryLabel: string;
  urgencyPrefix: string;
  customerSectionTitle: string;
  creatorSectionTitle: string;
  customerRegionLabel: string;
  customerIntroText: string;
  creatorRoleLabel: string;
  creatorDepartmentLabel: string;
  creatorDepartmentValue: string;
  productsSectionTitle: string;
  tableHeaderIndex: string;
  tableHeaderModel: string;
  tableHeaderImage: string;
  tableHeaderProduct: string;
  tableHeaderQuantity: string;
  tableHeaderUnit: string;
  tableHeaderUnitPrice: string;
  tableHeaderTotalPrice: string;
  tableTotalLabel: string;
  salesInstructionsTitle: string;
  customerRequirementsTitle: string;
  customerRequirementsLabel1: string;
  customerRequirementsLabel2: string;
  customerRequirementsLabel3: string;
  customerRequirementsLabel4: string;
  customerRequirementsLabel5: string;
  salesFallbackNote1: string;
  salesFallbackNote2: string;
  salesFallbackNote3: string;
  salesFallbackNote4: string;
  salesFallbackNote5: string;
  purchaseFeedbackTitle: string;
  purchaseFeedbackPlaceholder: string;
  salesSignatureTitle: string;
  procurementSignatureTitle: string;
  managerSignatureTitle: string;
  procurementOfficerPlaceholder: string;
  managerPlaceholder: string;
  signLabel: string;
  dateLabel: string;
  footerNote1: string;
  footerNote2: string;
  footerNote3: string;
}

export const buildDefaultQuoteRequirementTextOverrides = (
  data: QuoteRequirementDocumentData,
): QuoteRequirementTextOverrides => ({
  documentTitle: '报价请求单',
  documentTitleEn: 'Quote Requirement',
  sourceInquiryLabel: '来源询价单：',
  urgencyPrefix: '紧急程度：',
  customerSectionTitle: '客户信息',
  creatorSectionTitle: '创建人信息',
  customerRegionLabel: '区域：',
  customerIntroText: `该客户来自${data.customer.region}市场，从事${data.customer.businessType || '建材贸易'}业务。客户详细信息已登记在业务部门系统，采购部门如需了解更多客户背景，请联系对应业务员。`,
  creatorRoleLabel: '业务员：',
  creatorDepartmentLabel: '部门：',
  creatorDepartmentValue: '销售部',
  productsSectionTitle: '产品清单：',
  tableHeaderIndex: '序号',
  tableHeaderModel: '型号',
  tableHeaderImage: '图片',
  tableHeaderProduct: '产品名称/规格',
  tableHeaderQuantity: '数量',
  tableHeaderUnit: '单位',
  tableHeaderUnitPrice: '单价',
  tableHeaderTotalPrice: '总价',
  tableTotalLabel: '总计 (Total):',
  salesInstructionsTitle: '业务部说明：',
  customerRequirementsTitle: '客户需求要素',
  customerRequirementsLabel1: '1. 交货条款：',
  customerRequirementsLabel2: '2. 付款方式：',
  customerRequirementsLabel3: '3. 质量标准：',
  customerRequirementsLabel4: '4. 包装要求：',
  customerRequirementsLabel5: '5. 特殊要求：',
  salesFallbackNote1: '✓ 请根据产品清单向合适的供应商发送采购询价，获取最优成本价格',
  salesFallbackNote2: '✓ 供应商报价需包括：单价、总价、交货期、付款方式、MOQ等信息',
  salesFallbackNote3: '✓ 如有质量认证要求，请要求供应商提供相关证书和检测报告',
  salesFallbackNote4: '✓ 请在回复截止日期前完成询价，并将成本反馈给业务员',
  salesFallbackNote5: '✓ 考虑供应商的生产能力、交货周期、历史合作质量等因素',
  purchaseFeedbackTitle: '采购部反馈：',
  purchaseFeedbackPlaceholder: '（此处由采购部填写供应商报价反馈，包括成本价格、交货期、MOQ等信息）',
  salesSignatureTitle: '业务员（创建）：',
  procurementSignatureTitle: '采购部门（处理）：',
  managerSignatureTitle: '业务主管（审批）：',
  procurementOfficerPlaceholder: '采购员：____________',
  managerPlaceholder: '主管：____________',
  signLabel: '签字',
  dateLabel: '日期：',
  footerNote1: '• 本报价请求单为内部文件，请妥善保管，不得外泄',
  footerNote2: '• 采购部门应遵循公司采购流程和保密规定',
  footerNote3: '• 单据编号规则：QR-[区域代码]-[日期YYMMDD]-[流水号]',
});

interface QuoteRequirementDocumentProps {
  data: QuoteRequirementDocumentData;
  layoutConfig?: Partial<QuoteRequirementPreviewLayout>;
  textOverrides?: Partial<QuoteRequirementTextOverrides>;
}

export const QuoteRequirementDocument = forwardRef<HTMLDivElement, QuoteRequirementDocumentProps>(
  ({ data, layoutConfig, textOverrides }, ref) => {
    const layout = {
      ...DEFAULT_QUOTE_REQUIREMENT_PREVIEW_LAYOUT,
      ...(layoutConfig || {}),
    };
    const texts = {
      ...buildDefaultQuoteRequirementTextOverrides(data),
      ...(textOverrides || {}),
    };
    
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
            margin: 10mm;
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
              width: ${layout.canvasWidthMm}mm !important;
              max-width: ${layout.canvasWidthMm}mm !important;
              min-height: ${layout.canvasMinHeightMm}mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            
            /* 内容区域 - 打印时不额外padding，margin已在@page设置 */
            .qr-content {
              padding: 0 !important;
              margin: 0 !important;
              height: auto !important;
              overflow: visible !important;
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
              width: ${layout.canvasWidthMm}mm;
              max-width: ${layout.canvasWidthMm}mm;
              min-height: ${layout.canvasMinHeightMm}mm;
            }
          }
        `}</style>
        
        <div 
          ref={ref}
          className="qr-document bg-white mx-auto"
          style={{ 
            fontFamily: '"Microsoft YaHei", "SimHei", Arial, sans-serif',
            fontSize: `${layout.fontSizePt}pt`,
            lineHeight: String(layout.lineHeight),
            width: `${layout.canvasWidthMm}mm`,
            maxWidth: `${layout.canvasWidthMm}mm`,
            minHeight: `${layout.canvasMinHeightMm}mm`,
          }}
        >
          {/* ✅ 内容区域 - 屏幕预览使用较小页边距，打印时由 @page 控制 */}
          <div
            className="qr-content print:p-0"
            style={{
              paddingLeft: `${layout.contentPaddingLeftMm}mm`,
              paddingRight: `${layout.contentPaddingRightMm}mm`,
              paddingTop: `${layout.contentPaddingTopMm}mm`,
              paddingBottom: `${layout.contentPaddingBottomMm}mm`,
            }}
          >
            {/* 页眉 - 台湾大厂紧凑风格 */}
            <div className="mb-3">
              {/* 第一行：Logo + 报价请求单标题 + 单据信息 */}
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
                
                {/* 中间：报价请求单标题 */}
                <div className="flex-1 flex justify-center items-center">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-wider text-black">
                      {texts.documentTitle}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">{texts.documentTitleEn}</p>
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
                <span className="text-gray-600">{texts.sourceInquiryLabel}</span>
                <span className="font-bold text-blue-600 ml-1">{data.sourceInquiryNo}</span>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${urgencyInfo.bgColor} ${urgencyInfo.color}`}>
                {texts.urgencyPrefix}{urgencyInfo.label}
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
                        {texts.customerSectionTitle}
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="text-gray-600">{texts.customerRegionLabel}</span>{data.customer.region}</div>
                        <div className="mt-2 pt-2 border-t border-gray-300">
                          <div className="text-xs text-gray-600 leading-relaxed">
                            {texts.customerIntroText}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* 创建人信息 */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        {texts.creatorSectionTitle}
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="text-gray-600">{texts.creatorRoleLabel}</span><span className="font-semibold">{data.createdBy}</span></div>
                        <div><span className="text-gray-600">{texts.creatorDepartmentLabel}</span>{texts.creatorDepartmentValue}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 产品清单 */}
            <div className="products-section mb-4">
              <h3 className="font-bold text-base mb-2">{texts.productsSectionTitle}</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left w-8">{texts.tableHeaderIndex}</th>
                    <th className="border border-gray-300 px-2 py-2 text-left w-20">{texts.tableHeaderModel}</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-16">{texts.tableHeaderImage}</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">{texts.tableHeaderProduct}</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-16">{texts.tableHeaderQuantity}</th>
                    <th className="border border-gray-300 px-2 py-2 text-center w-10">{texts.tableHeaderUnit}</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-20">{texts.tableHeaderUnitPrice}</th>
                    <th className="border border-gray-300 px-2 py-2 text-right w-20">{texts.tableHeaderTotalPrice}</th>
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
                          <div className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap break-words leading-5">{product.specification}</div>
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
                      {texts.tableTotalLabel}
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

            <div className="mb-6">
              <h3 className="font-bold text-base mb-2">{texts.salesInstructionsTitle}</h3>
              <div className="border border-gray-300 rounded p-4 bg-blue-50 text-xs text-left min-h-[180px]">
                {data.salesDeptNotes ? (
                  <div className="whitespace-pre-wrap break-words leading-7">{data.salesDeptNotes}</div>
                ) : (
                  <div className="space-y-1">
                    <p>{texts.salesFallbackNote1}</p>
                    <p>{texts.salesFallbackNote2}</p>
                    <p>{texts.salesFallbackNote3}</p>
                    <p>{texts.salesFallbackNote4}</p>
                    <p>{texts.salesFallbackNote5}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 采购部反馈 */}
            <div className="mb-6">
              <h3 className="font-bold text-base mb-2">{texts.purchaseFeedbackTitle}</h3>
              <div className="border border-gray-300 rounded p-3 bg-blue-50 text-xs min-h-[100px]">
                {data.purchaseDeptFeedback ? (
                  <div className="whitespace-pre-wrap">{data.purchaseDeptFeedback}</div>
                ) : (
                  <div className="text-gray-400 italic">
                    {texts.purchaseFeedbackPlaceholder}
                  </div>
                )}
              </div>
            </div>

            {/* 审批签名区域 */}
            <div className="signature-section mt-8">
              <div className="grid grid-cols-3 gap-6">
                {/* 业务员 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">{texts.salesSignatureTitle}</h4>
                  <div className="text-xs space-y-2">
                    <p className="font-semibold">{data.createdBy}</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">{texts.signLabel}</p>
                    </div>
                    <p className="text-xs text-gray-600">{texts.dateLabel}{new Date(data.requirementDate).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
                
                {/* 采购部门 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">{texts.procurementSignatureTitle}</h4>
                  <div className="text-xs space-y-2">
                    <p className="text-gray-500">{texts.procurementOfficerPlaceholder}</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">{texts.signLabel}</p>
                    </div>
                    <p className="text-xs text-gray-600">{texts.dateLabel}_____________</p>
                  </div>
                </div>
                
                {/* 业务主管 */}
                <div>
                  <h4 className="font-bold mb-2 text-sm">{texts.managerSignatureTitle}</h4>
                  <div className="text-xs space-y-2">
                    <p className="text-gray-500">{texts.managerPlaceholder}</p>
                    <div className="border-b border-gray-400 pb-1 mt-6">
                      <p className="text-xs text-gray-600">{texts.signLabel}</p>
                    </div>
                    <p className="text-xs text-gray-600">{texts.dateLabel}_____________</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 页脚说明 */}
            <div className="mt-8 pt-4 border-t border-gray-300">
              <div className="text-xs text-gray-500 space-y-1">
                <p>{texts.footerNote1}</p>
                <p>{texts.footerNote2}</p>
                <p>{texts.footerNote3}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

QuoteRequirementDocument.displayName = 'QuoteRequirementDocument';
