import React, { forwardRef } from 'react';
import type { DocumentLayoutConfig } from '../A4PageContainer';
import type { InquiryOemData } from '../../../types/oem';

/**
 * 📋 客户询价单文档模板 - Taiwan Enterprise Style
 * 
 * 业务场景：
 * 1. 客户通过社媒/网站/邮件发送询价
 * 2. 运营专员录入系统
 * 3. 生成标准化的询价单文档
 * 4. 分配给业务员进行报价
 * 
 * 数据来源：
 * - KV Store: inquiry_{inquiryNo}
 * - 包含客户信息、产品需求、交期要求等
 * 
 * 输出格式：
 * - 台湾大厂专业风格，黑白灰配色
 * - 紧凑表格化布局
 * - 符合国际商业惯例
 */

export interface CustomerInquiryData {
  // 询价单基本信息
  inquiryNo: string;           // INQ-NA-20251210-001
  inquiryDate: string;         // 2025-12-10
  region: 'NA' | 'SA' | 'EU';  // 区域
  
  // 客户信息
  customer: {
    companyName: string;       // ABC Trading Corp.
    contactPerson: string;     // John Smith
    position?: string;         // Purchasing Manager
    email: string;             // john@abc.com
    phone?: string;            // +1-xxx-xxx-xxxx
    address?: string;          // 123 Main St, Los Angeles, CA 90001
    country: string;           // United States
  };
  
  // 产品需求列表
  products: Array<{
    no: number;                // 序号
    modelNo?: string;          // 型号
    imageUrl?: string;         // 产品图片
    productName: string;       // GFCI Outlet
    specification?: string;    // 20A, 125V, Tamper-Resistant
    quantity: number;          // 5000
    unit: string;              // pcs
    targetPrice?: number;      // 2.50
    currency?: string;         // USD
    description?: string;      // 额外说明
  }>;
  
  // 交易要求
  requirements?: {
    deliveryTime?: string;     // "Before March 2025"
    portOfDestination?: string; // "Los Angeles"
    paymentTerms?: string;     // "T/T or L/C"
    tradeTerms?: string;       // "FOB / CIF"
    packingRequirements?: string; // 包装要求
    certifications?: string[];  // ["UL", "FCC", "CE"]
    otherRequirements?: string; // 其他要求
  };

  // OEM 分支（内部流程字段，不直接由客户决定下游是否转发）
  oem?: InquiryOemData;
  
  // 备注
  remarks?: string;
  
  // 来源信息（后台字段，不显示在文档上）
  source?: string;             // 'Facebook' | 'Website' | 'Email'
  assignedTo?: string;         // 分配的业务员
  status?: string;             // 询价状态（后台用）
}

export interface CustomerInquiryRequirementRow {
  key: keyof NonNullable<CustomerInquiryData['requirements']>;
  label: string;
  value: string;
}

export interface CustomerInquiryRequirementField {
  key: keyof NonNullable<CustomerInquiryData['requirements']>;
  sourceLabel: string;
  previewLabel: string;
  description: string;
  placeholder: string;
  type: 'input' | 'textarea';
  rows?: number;
}

export type CustomerInquiryRequirementFormFields = {
  [K in keyof NonNullable<CustomerInquiryData['requirements']>]: K extends 'certifications' ? string : string;
};

export const DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS: CustomerInquiryRequirementFormFields = {
  tradeTerms: '',
  deliveryTime: '',
  portOfDestination: '',
  paymentTerms: '',
  packingRequirements: '',
  certifications: '',
  otherRequirements: '',
};

export const CUSTOMER_INQUIRY_REQUIREMENT_FIELDS: CustomerInquiryRequirementField[] = [
  {
    key: 'tradeTerms',
    sourceLabel: 'Price Terms',
    previewLabel: 'Trade Terms',
    description: 'How the price should be quoted, such as EXW, FOB, CIF, or DDP.',
    placeholder: 'Example: FOB Xiamen / CIF Los Angeles',
    type: 'input',
  },
  {
    key: 'deliveryTime',
    sourceLabel: 'Delivery Time',
    previewLabel: 'Delivery Time',
    description: 'Expected lead time or target shipment window.',
    placeholder: 'Example: Within 30 days after order confirmation',
    type: 'input',
  },
  {
    key: 'portOfDestination',
    sourceLabel: 'Destination Port',
    previewLabel: 'Port of Destination',
    description: 'Where the goods should be delivered or shipped to.',
    placeholder: 'Example: Los Angeles / Jebel Ali / Door delivery to Houston',
    type: 'input',
  },
  {
    key: 'paymentTerms',
    sourceLabel: 'Payment Terms',
    previewLabel: 'Payment Terms',
    description: 'Preferred settlement method and deposit arrangement.',
    placeholder: 'Example: 30% T/T deposit, 70% before shipment',
    type: 'input',
  },
  {
    key: 'packingRequirements',
    sourceLabel: 'Packing Requirements',
    previewLabel: 'Packing Requirements',
    description: 'Carton, pallet, labeling, barcode, or packaging details.',
    placeholder: 'Example: Export cartons with pallet, each carton with SKU label',
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'certifications',
    sourceLabel: 'Required Certifications',
    previewLabel: 'Certifications Required',
    description: 'Compliance or test standards needed for this inquiry.',
    placeholder: 'Example: UL, ETL, CE, FCC, RoHS',
    type: 'textarea',
    rows: 3,
  },
  {
    key: 'otherRequirements',
    sourceLabel: 'Other Requirements',
    previewLabel: 'Other Requirements',
    description: 'Any other commercial or technical condition to show in the document.',
    placeholder: 'Example: Need logo printing, English manual, and sample approval before mass production',
    type: 'textarea',
    rows: 4,
  },
];

export const normalizeCustomerInquiryRequirementFields = (
  value?: Partial<CustomerInquiryRequirementFormFields> | null,
): CustomerInquiryRequirementFormFields => ({
  tradeTerms: value?.tradeTerms?.trim() || '',
  deliveryTime: value?.deliveryTime?.trim() || '',
  portOfDestination: value?.portOfDestination?.trim() || '',
  paymentTerms: value?.paymentTerms?.trim() || '',
  packingRequirements: value?.packingRequirements?.trim() || '',
  certifications: value?.certifications?.trim() || '',
  otherRequirements: value?.otherRequirements?.trim() || '',
});

export const parseCustomerInquiryRequirementText = (
  value?: string | null,
): CustomerInquiryRequirementFormFields => {
  if (!value?.trim()) {
    return { ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS };
  }

  const fields = { ...DEFAULT_CUSTOMER_INQUIRY_REQUIREMENT_FIELDS };
  const matchers: Array<[keyof CustomerInquiryRequirementFormFields, RegExp[]]> = [
    ['tradeTerms', [/^\s*1\.\s*Price:\s*(.*)$/i, /^\s*Trade Terms:\s*(.*)$/i]],
    ['deliveryTime', [/^\s*2\.\s*Delivery time:\s*(.*)$/i, /^\s*Delivery Time:\s*(.*)$/i]],
    ['portOfDestination', [/^\s*3\.\s*Destination Port:\s*(.*)$/i, /^\s*Port of Destination:\s*(.*)$/i]],
    ['paymentTerms', [/^\s*4\.\s*Payment Term:\s*(.*)$/i, /^\s*Payment Terms:\s*(.*)$/i]],
    ['packingRequirements', [/^\s*Packing Requirements:\s*(.*)$/i]],
    ['certifications', [/^\s*Certifications Required:\s*(.*)$/i]],
    ['otherRequirements', [/^\s*5\.\s*Others:\s*(.*)$/i, /^\s*Other Requirements:\s*(.*)$/i]],
  ];

  value.split('\n').forEach((line) => {
    matchers.forEach(([key, patterns]) => {
      patterns.forEach((pattern) => {
        const match = line.match(pattern);
        if (match) {
          fields[key] = match[1]?.trim() || '';
        }
      });
    });
  });

  return fields;
};

export const buildCustomerInquiryRequirementText = (
  fields: CustomerInquiryRequirementFormFields,
) =>
  [
    `Trade Terms: ${fields.tradeTerms}`.trimEnd(),
    `Delivery Time: ${fields.deliveryTime}`.trimEnd(),
    `Port of Destination: ${fields.portOfDestination}`.trimEnd(),
    `Payment Terms: ${fields.paymentTerms}`.trimEnd(),
    `Packing Requirements: ${fields.packingRequirements}`.trimEnd(),
    `Certifications Required: ${fields.certifications}`.trimEnd(),
    `Other Requirements: ${fields.otherRequirements}`.trimEnd(),
  ].join('\n');

const LEGACY_PACKING_SUMMARY_PATTERN = /^\s*Cartons:\s*.*(?:,\s*CBM:\s*.*)?(?:,\s*GW:\s*.*)?(?:,\s*NW:\s*.*)?\s*$/i;
const LEGACY_REQUIREMENT_BLOCK_PATTERN = /(Trade Terms|Delivery Time|Port of Destination|Payment Terms|Packing Requirements|Certifications Required|Other Requirements)\s*:/i;

const resolveCustomerInquiryRequirementFields = (
  requirements?: CustomerInquiryData['requirements'],
): CustomerInquiryRequirementFormFields => {
  const normalized = normalizeCustomerInquiryRequirementFields({
    tradeTerms: requirements?.tradeTerms,
    deliveryTime: requirements?.deliveryTime,
    portOfDestination: requirements?.portOfDestination,
    paymentTerms: requirements?.paymentTerms,
    packingRequirements: requirements?.packingRequirements,
    certifications: Array.isArray(requirements?.certifications)
      ? requirements.certifications.join(', ')
      : typeof requirements?.certifications === 'string'
        ? requirements.certifications
        : '',
    otherRequirements: requirements?.otherRequirements,
  });

  const legacySources = [normalized.packingRequirements, normalized.otherRequirements]
    .filter((value) => value && LEGACY_REQUIREMENT_BLOCK_PATTERN.test(value))
    .join('\n');

  if (legacySources) {
    const parsedLegacyFields = parseCustomerInquiryRequirementText(legacySources);
    normalized.tradeTerms = normalized.tradeTerms || parsedLegacyFields.tradeTerms;
    normalized.deliveryTime = normalized.deliveryTime || parsedLegacyFields.deliveryTime;
    normalized.portOfDestination = normalized.portOfDestination || parsedLegacyFields.portOfDestination;
    normalized.paymentTerms = normalized.paymentTerms || parsedLegacyFields.paymentTerms;
    normalized.packingRequirements = normalized.packingRequirements || parsedLegacyFields.packingRequirements;
    normalized.certifications = normalized.certifications || parsedLegacyFields.certifications;
    normalized.otherRequirements = normalized.otherRequirements || parsedLegacyFields.otherRequirements;
  }

  if (LEGACY_PACKING_SUMMARY_PATTERN.test(normalized.packingRequirements)) {
    normalized.packingRequirements = '';
  }

  if (LEGACY_REQUIREMENT_BLOCK_PATTERN.test(normalized.otherRequirements)) {
    normalized.otherRequirements = '';
  }

  return normalized;
};

interface CustomerInquiryDocumentProps {
  data: CustomerInquiryData;
  layoutConfig?: DocumentLayoutConfig;
  highlightedRequirementKey?: keyof NonNullable<CustomerInquiryData['requirements']> | string | null;
}

export function getCustomerInquiryRequirementRows(
  data: CustomerInquiryData,
  options?: { includeEmpty?: boolean },
): CustomerInquiryRequirementRow[] {
  const requirements = resolveCustomerInquiryRequirementFields(data.requirements);
  const rows = CUSTOMER_INQUIRY_REQUIREMENT_FIELDS.map((field, index) => ({
    key: field.key,
    label: `${index + 1}. ${field.sourceLabel}`,
    value: requirements[field.key] || '',
  }));

  if (options?.includeEmpty) {
    return rows;
  }

  return rows.filter((item) => Boolean(item.value));
}

export const CustomerInquiryDocument = forwardRef<HTMLDivElement, CustomerInquiryDocumentProps>(
  ({ data, layoutConfig, highlightedRequirementKey = null }, ref) => {
    const resolvedLayout = {
      canvasWidthMm: layoutConfig?.canvasWidthMm ?? 210,
      canvasMinHeightMm: layoutConfig?.canvasMinHeightMm ?? 297,
      contentPaddingTopMm: layoutConfig?.contentPaddingTopMm ?? 20,
      contentPaddingBottomMm: layoutConfig?.contentPaddingBottomMm ?? 20,
      fontSizePt: layoutConfig?.fontSizePt ?? 10,
      lineHeight: layoutConfig?.lineHeight ?? 1.5,
    };

    const products = Array.isArray(data.products) ? data.products : [];
    const customer = {
      companyName: data.customer?.companyName || 'N/A',
      contactPerson: data.customer?.contactPerson || 'N/A',
      position: data.customer?.position,
      email: data.customer?.email || 'N/A',
      phone: data.customer?.phone,
      address: data.customer?.address,
      country: data.customer?.country || 'N/A',
    };
    const requirementRows = getCustomerInquiryRequirementRows(data);
    
    // 计算总金额（如果有目标价格）
    const calculateTotal = () => {
      return products.reduce((sum, item) => {
        if (item.targetPrice) {
          return sum + (item.quantity * item.targetPrice);
        }
        return sum;
      }, 0);
    };

    const total = calculateTotal();
    const currency = products[0]?.currency || 'USD';
    const documentWidth = `${resolvedLayout.canvasWidthMm}mm`;
    const documentMinHeight = `${resolvedLayout.canvasMinHeightMm}mm`;
    const fontSize = `${resolvedLayout.fontSizePt}pt`;
    const lineHeight = resolvedLayout.lineHeight;
    const contentPaddingTop = `${resolvedLayout.contentPaddingTopMm}mm`;
    const contentPaddingBottom = `${resolvedLayout.contentPaddingBottomMm}mm`;
    const contentPaddingHorizontal = '20mm';

    return (
      <div 
        ref={ref}
        className="mx-auto bg-white"
        style={{ 
          width: documentWidth,
          minHeight: documentMinHeight,
          boxSizing: 'border-box',
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize,
          lineHeight
        }}
      >
        <div
          style={{
            paddingTop: contentPaddingTop,
            paddingBottom: contentPaddingBottom,
            paddingLeft: contentPaddingHorizontal,
            paddingRight: contentPaddingHorizontal,
          }}
        >
          {/* Header - Taiwan Enterprise Compact Style */}
          <div className="mb-3">
            {/* Title + Inquiry Info Table */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: INQUIRY Title */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold tracking-wider text-black">
                  CUSTOMER INQUIRY
                </h1>
              </div>
              
              {/* Right: Inquiry Info Table */}
              <div className="w-[240px]">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Inq. No.</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.inquiryNo || '-'}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {new Date(data.inquiryDate || '').toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Region</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {data.region === 'NA' ? 'North America' : data.region === 'SA' ? 'South America' : 'Europe & Africa'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* Customer Information - Taiwan Enterprise Table Style */}
          <div className="mb-3">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-0 align-top">
                    <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                      CUSTOMER INFORMATION
                    </div>
                    <div className="px-2 py-1.5 space-y-0.5">
                      <div><span className="font-semibold">{customer.companyName}</span></div>
                      <div><span className="text-gray-600">Contact:</span> {customer.contactPerson}{customer.position && ` (${customer.position})`}</div>
                      <div><span className="text-gray-600">Email:</span> {customer.email}</div>
                      {customer.phone && (
                        <div><span className="text-gray-600">Tel:</span> {customer.phone}</div>
                      )}
                      <div><span className="text-gray-600">Country:</span> {customer.country}</div>
                      {customer.address && (
                        <div><span className="text-gray-600">Address:</span> {customer.address}</div>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Product Requirements Table - Taiwan Enterprise Style */}
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-2 text-gray-900">PRODUCT REQUIREMENTS:</h3>
            <table className="w-full border-collapse border-2 border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left w-8 whitespace-nowrap">No.</th>
                  <th className="border border-gray-300 px-2 py-2 text-left w-20 whitespace-nowrap">Model No.</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16 whitespace-nowrap">Image</th>
                  <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Item Name / Specification</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-12 whitespace-nowrap">Quantity</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-10 whitespace-nowrap">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-20 whitespace-nowrap">Target Price</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-28 whitespace-nowrap">Estimated Value</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={`${product.no || index + 1}-${index}`}>
                    <td className="border border-gray-300 px-2 py-2 text-center">{product.no || index + 1}</td>
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
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <div className="font-semibold">{product.productName}</div>
                      {product.specification && (
                        <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right">
                      {Number(product.quantity || 0).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {product.unit}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right">
                      {product.targetPrice 
                        ? `${product.currency || currency} ${product.targetPrice.toFixed(2)}`
                        : '-'
                      }
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                      {product.targetPrice 
                        ? `${product.currency || currency} ${(Number(product.quantity || 0) * Number(product.targetPrice || 0)).toFixed(2)}`
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
              {total > 0 && (
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                      ESTIMATED TOTAL:
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                      {currency} {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Trading Requirements - Taiwan Enterprise Style (单列表格布局) */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2 text-gray-900">TRADING REQUIREMENTS:</h3>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                {getCustomerInquiryRequirementRows(data, { includeEmpty: true }).map((row, index) => (
                  <tr
                    key={row.label}
                    className={row.key === highlightedRequirementKey ? 'bg-amber-50' : ''}
                  >
                    <td
                      className={`border border-gray-400 px-2 py-1.5 font-semibold ${row.key === highlightedRequirementKey ? 'bg-amber-100 text-amber-900' : 'bg-gray-100'}`}
                      style={index === 0 ? { width: '25%' } : undefined}
                    >
                      {row.label}
                    </td>
                    <td className={`border border-gray-400 px-2 py-1.5 whitespace-pre-wrap ${row.key === highlightedRequirementKey ? 'bg-amber-50 ring-1 ring-inset ring-amber-300' : ''}`}>
                      {row.value || '\u00A0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Statement */}
          <div className="text-xs text-gray-600 text-center border-t border-gray-300 pt-2">
            This inquiry will be processed and quoted within 24-48 hours. Thank you for your interest.
          </div>
        </div>
      </div>
    );
  }
);

CustomerInquiryDocument.displayName = 'CustomerInquiryDocument';

/**
 * 数据调用示例：
 * 
 * // 从KV Store读取询价数据
 * const inquiryData = await kv.get(`inquiry_${inquiryNo}`);
 * 
 * // 渲染文档
 * <CustomerInquiryDocument data={inquiryData} />
 * 
 * // 生成PDF
 * const pdfBlob = await generatePDF(<CustomerInquiryDocument data={inquiryData} />);
 * 
 * 字段映射说明：
 * ✅ 显示在文档上的字段：
 *    - inquiryNo, inquiryDate, region
 *    - customer.*（客户完整信息）
 *    - products[]（产品需求列表）
 *    - requirements.*（交易要求）
 *    - remarks
 * 
 * ❌ 不显示在文档上的字段（仅后台使用）：
 *    - source（询价来源）
 *    - assignedTo（分配业务员）
 *    - status（询价状态）
 *    - 任何审批、流程相关字段
 */
