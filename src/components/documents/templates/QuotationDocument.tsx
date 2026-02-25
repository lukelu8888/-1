import React, { forwardRef } from 'react';
import { ImageWithFallback } from '../../figma/ImageWithFallback';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';

/**
 * 💰 业务员报价单文档模板
 * 
 * 业务场景：
 * 1. 业务员收到询价后进行成本核算
 * 2. 生成正式报价单发送给客户
 * 3. 这是客户看到的第一份正式商业文档
 * 
 * 数据来源：
 * - 继承自客户询价单（90%数据）
 * - 业务员添加报价、交期、贸易条款
 * - KV Store: quotation_{quotationNo}
 * 
 * 关键特点：
 * - 必须包含公司完整信息和Logo
 * - 价格清晰、专业
 * - 有效期明确
 * - 符合国际商业标准
 */

export interface QuotationData {
  // 报价单基本信息
  quotationNo: string;         // QT-NA-20251210-001
  quotationDate: string;       // 2025-12-10
  validUntil: string;          // 2026-01-10
  inquiryNo?: string;          // 关联的询价单号
  region: 'NA' | 'SA' | 'EU';
  
  // 公司信息（报价方）
  company: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    fax?: string;
    email: string;
    website?: string;
    logo?: string;
  };
  
  // 客户信息（收件方）
  customer: {
    companyName: string;
    contactPerson: string;
    address?: string;
    email: string;
    phone?: string;
  };
  
  // 产品报价列表
  products: Array<{
    no: number;
    modelNo?: string;          // 型号
    imageUrl?: string;         // 产品图片
    productName: string;
    specification: string;
    hsCode?: string;           // HS编码
    quantity: number;
    unit: string;
    unitPrice: number;         // 单价
    currency: string;          // USD / EUR / GBP
    amount: number;            // 金额
    moq?: number;              // 最小起订量
    leadTime?: string;         // 生产周期
  }>;
  
  // 贸易条款
  tradeTerms: {
    incoterms: string;         // FOB Xiamen / CIF Los Angeles
    paymentTerms: string;      // 30% T/T deposit, 70% before shipment
    deliveryTime: string;      // 25-30 days after deposit
    packing: string;           // Export carton with pallets
    portOfLoading: string;     // Xiamen, China
    portOfDestination?: string; // Los Angeles, USA
    warranty?: string;         // Quality warranty
    inspection?: string;       // Inspection standards
  };
  
  // 备注
  remarks?: string;
  
  // 业务员信息
  salesPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
    whatsapp?: string;
  };
}

interface QuotationDocumentProps {
  data?: QuotationData;
  quotation?: QuotationData; // 🔥 支持两种prop名称
}

export const QuotationDocument = forwardRef<HTMLDivElement, QuotationDocumentProps>(
  ({ data, quotation }, ref) => {
    // 🔥 兼容两种prop名称
    const quotationData = quotation || data;
    
    if (!quotationData) {
      return <div>No quotation data available</div>;
    }
    
    const total = quotationData.products.reduce((sum, item) => sum + item.amount, 0);
    const currency = quotationData.products[0]?.currency || 'USD';

    // Extract trade term abbreviation (EXW, FOB, CNF, CIF) from incoterms
    const extractTradeTerm = (incoterms: string): string => {
      const upperTerms = incoterms.toUpperCase();
      if (upperTerms.includes('EXW')) return 'EXW';
      if (upperTerms.includes('FOB')) return 'FOB';
      if (upperTerms.includes('CNF') || upperTerms.includes('C&F')) return 'CNF';
      if (upperTerms.includes('CIF')) return 'CIF';
      return 'EXW'; // Default to EXW
    };
    
    const tradeTerm = extractTradeTerm(quotationData.tradeTerms.incoterms);

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
            {/* First Row: Logo + QUOTATION Title + Quotation Info */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: Logo */}
              <div className="w-[80px] h-[70px] flex items-center">
                <img
                  src={cosunLogo}
                  alt="THE COSUN Logo"
                  className="w-full h-auto max-h-full"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Center: QUOTATION Title */}
              <div className="flex-1 flex justify-center items-center">
                <h1 className="text-2xl font-bold tracking-wider text-black">
                  QUOTATION
                </h1>
              </div>
              
              {/* Right: Quotation Info Table */}
              <div className="w-[240px]">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    {quotationData.inquiryNo && (
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Inq. No.</td>
                        <td className="border border-gray-400 px-1.5 py-0.5">{quotationData.inquiryNo}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Quo. No.</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black">{quotationData.quotationNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {new Date(quotationData.quotationDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap">Valid Until</td>
                      <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black">
                        {new Date(quotationData.validUntil).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* Company and Customer Information - Taiwan Enterprise Table Style */}
          <div className="mb-3">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  {/* Company Information (FROM) */}
                  <td className="border border-gray-400 p-0 w-1/2 align-top">
                    <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                      FROM
                    </div>
                    <div className="px-2 py-1.5 space-y-0.5">
                      <div><span className="font-semibold">{quotationData.company.nameEn}</span></div>
                      <div><span className="text-gray-600">Address:</span> {quotationData.company.addressEn}</div>
                      <div><span className="text-gray-600">Tel:</span> {quotationData.company.tel} {quotationData.company.fax && `| Fax: ${quotationData.company.fax}`}</div>
                      <div><span className="text-gray-600">Email:</span> {quotationData.company.email}</div>
                      {quotationData.company.website && (
                        <div><span className="text-gray-600">Website:</span> {quotationData.company.website}</div>
                      )}
                    </div>
                  </td>
                  
                  {/* Customer Information (TO) */}
                  <td className="border border-gray-400 p-0 w-1/2 align-top">
                    <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                      TO
                    </div>
                    <div className="px-2 py-1.5 space-y-0.5">
                      <div><span className="font-semibold">{quotationData.customer.companyName}</span></div>
                      <div><span className="text-gray-600">Attn:</span> {quotationData.customer.contactPerson}</div>
                      {quotationData.customer.address && <div><span className="text-gray-600">Address:</span> {quotationData.customer.address}</div>}
                      <div><span className="text-gray-600">Email:</span> {quotationData.customer.email}</div>
                      {quotationData.customer.phone && <div><span className="text-gray-600">Tel:</span> {quotationData.customer.phone}</div>}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Product Quotation Table - Taiwan Enterprise Style */}
          <div className="mb-4">
            <table className="w-full border-collapse border-2 border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 text-left w-8 whitespace-nowrap">No.</th>
                  <th className="border border-gray-300 px-2 py-2 text-left w-20 whitespace-nowrap">Model No.</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-16 whitespace-nowrap">Image</th>
                  <th className="border border-gray-300 px-2 py-2 text-left whitespace-nowrap">Item Name / Specification</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-12 whitespace-nowrap">Quantity</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-10 whitespace-nowrap">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-20 whitespace-nowrap">Unit Price</th>
                  <th className="border border-gray-300 px-2 py-2 text-right w-28 whitespace-nowrap">Extended Value</th>
                </tr>
              </thead>
              <tbody>
                {quotationData.products.map((product) => (
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
                      <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right">
                      {product.quantity.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {product.unit}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right">
                      {product.currency} {product.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                      {product.currency} {product.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={7} className="border border-gray-300 px-2 py-2 text-right">
                    TOTAL VALUE ({tradeTerm}):
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                    {currency} {total.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 贸易条款 - Taiwan Enterprise Style (单列表格布局) */}
          <div className="mb-6">
            <h3 className="text-sm font-bold mb-2 text-gray-900">TERMS AND CONDITIONS:</h3>
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                {/* Validity */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold" style={{ width: '25%' }}>
                    Validity
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    Valid until {new Date(quotationData.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </td>
                </tr>
                
                {/* Trade Terms */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Trade Terms
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.incoterms}
                  </td>
                </tr>
                
                {/* Payment Terms */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Payment Terms
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.paymentTerms}
                  </td>
                </tr>
                
                {/* Delivery Time */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Delivery Time
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.deliveryTime}
                  </td>
                </tr>
                
                {/* Port of Loading */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Port of Loading
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.portOfLoading}
                  </td>
                </tr>
                
                {/* Port of Destination */}
                {quotationData.tradeTerms.portOfDestination && (
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                      Port of Destination
                    </td>
                    <td className="border border-gray-400 px-2 py-1.5">
                      {quotationData.tradeTerms.portOfDestination}
                    </td>
                  </tr>
                )}
                
                {/* Packing */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Packing
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.packing}
                  </td>
                </tr>
                
                {/* Quality Warranty */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Quality Warranty
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.warranty || '12 months from delivery date against manufacturing defects'}
                  </td>
                </tr>
                
                {/* Inspection */}
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">
                    Inspection
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    {quotationData.tradeTerms.inspection || "Seller's factory inspection, buyer has the right to re-inspect upon arrival"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Remarks - Taiwan Enterprise Style */}
          {quotationData.remarks && (
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
                      {quotationData.remarks}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Salesperson Signature - Taiwan Enterprise Style */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold w-[25%]">
                    Prepared By
                  </td>
                  <td className="border border-gray-400 px-2 py-1.5">
                    <div className="space-y-0.5">
                      <div><span className="font-semibold">{quotationData.salesPerson.name}</span> - {quotationData.salesPerson.position}</div>
                      <div className="text-gray-600">
                        Tel: {quotationData.salesPerson.phone}
                        {quotationData.salesPerson.whatsapp && ` | WhatsApp: ${quotationData.salesPerson.whatsapp}`}
                      </div>
                      <div className="text-gray-600">Email: {quotationData.salesPerson.email}</div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Closing Statement */}
          <div className="text-xs text-gray-600 text-center border-t border-gray-300 pt-2">
            We look forward to receiving your order and establishing a long-term business relationship.
          </div>
        </div>
      </div>
    );
  }
);

QuotationDocument.displayName = 'QuotationDocument';