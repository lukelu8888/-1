import React, { forwardRef } from 'react';

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
  
  // 备注
  remarks?: string;
  
  // 来源信息（后台字段，不显示在文档上）
  source?: string;             // 'Facebook' | 'Website' | 'Email'
  assignedTo?: string;         // 分配的业务员
  status?: string;             // 询价状态（后台用）
}

interface CustomerInquiryDocumentProps {
  data: CustomerInquiryData;
}

export const CustomerInquiryDocument = forwardRef<HTMLDivElement, CustomerInquiryDocumentProps>(
  ({ data }, ref) => {
    
    // 计算总金额（如果有目标价格）
    const calculateTotal = () => {
      return data.products.reduce((sum, item) => {
        if (item.targetPrice) {
          return sum + (item.quantity * item.targetPrice);
        }
        return sum;
      }, 0);
    };

    const total = calculateTotal();
    const currency = data.products[0]?.currency || 'USD';

    return (
      <div 
        ref={ref}
        className="bg-white w-[794px] min-h-[1123px] mx-auto shadow-lg"
        style={{ 
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize: '10pt',
          lineHeight: '1.5'
        }}
      >
        <div className="p-[20mm]">
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
                      <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{data.inquiryNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {new Date(data.inquiryDate).toLocaleDateString('en-US', { 
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
                      <div><span className="font-semibold">{data.customer.companyName}</span></div>
                      <div><span className="text-gray-600">Contact:</span> {data.customer.contactPerson}{data.customer.position && ` (${data.customer.position})`}</div>
                      <div><span className="text-gray-600">Email:</span> {data.customer.email}</div>
                      {data.customer.phone && (
                        <div><span className="text-gray-600">Tel:</span> {data.customer.phone}</div>
                      )}
                      <div><span className="text-gray-600">Country:</span> {data.customer.country}</div>
                      {data.customer.address && (
                        <div><span className="text-gray-600">Address:</span> {data.customer.address}</div>
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
                {data.products.map((product) => (
                  <tr key={product.no}>
                    <td className="border border-gray-300 px-2 py-2 text-center">{product.no}</td>
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
                      {product.quantity.toLocaleString()}
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
                        ? `${product.currency || currency} ${(product.quantity * product.targetPrice).toFixed(2)}`
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
          {data.requirements && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-2 text-gray-900">TRADING REQUIREMENTS:</h3>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  {data.requirements.deliveryTime && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold" style={{ width: '25%' }}>
                        Delivery Time
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.deliveryTime}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.tradeTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Trade Terms
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.tradeTerms}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.paymentTerms && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Payment Terms
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.paymentTerms}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.portOfDestination && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Port of Destination
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.portOfDestination}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.packingRequirements && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Packing Requirements
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.packingRequirements}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.certifications && data.requirements.certifications.length > 0 && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Certifications Required
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.certifications.join(', ')}
                      </td>
                    </tr>
                  )}
                  
                  {data.requirements.otherRequirements && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                        Other Requirements
                      </td>
                      <td className="border border-gray-400 px-2 py-1.5">
                        {data.requirements.otherRequirements}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Remarks - Taiwan Enterprise Style */}
          {data.remarks && (
            <div className="mb-3">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <thead>
                  <tr>
                    <th className="border border-gray-400 px-2 py-1.5 text-left font-bold bg-gray-100">
                      REMARKS / NOTES
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5 text-gray-700">
                      {data.remarks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

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