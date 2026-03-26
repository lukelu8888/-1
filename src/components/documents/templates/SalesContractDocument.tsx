import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import { A4DocumentContainer, A4PrintStyles } from '../A4PageContainer';
import type { DocumentLayoutConfig } from '../A4PageContainer';

/**
 * 📋 Sales Contract
 * 
 * Purpose: Formal sales contract sent to customers
 * Data Source: From Proforma Invoice or Quotation
 * Importance: Legal document requiring signatures and seals from both parties
 */

export interface SalesContractData {
  // Contract Basic Information
  contractNo: string;          // SC-NA-20251220-001
  contractDate: string;        // 2025-12-20
  quotationNo?: string;        // Related quotation number
  region: 'NA' | 'SA' | 'EU';
  
  // Seller (Company) Information
  seller: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    fax?: string;
    email: string;
    legalRepresentative: string;  // Legal representative
    businessLicense?: string;     // Business license number
    // Bank Account Information
    bankInfo?: {
      bankName: string;         // Bank name
      accountName: string;      // Account name
      accountNumber: string;    // Account number
      swiftCode?: string;       // SWIFT code (international transfer)
      bankAddress?: string;     // Bank address
      routingNumber?: string;   // Routing number (USA)
      iban?: string;            // IBAN number (Europe)
      currency?: string;        // Currency
      paymentNote?: string;     // Payment note
    };
  };
  
  // Buyer (Customer) Information
  buyer: {
    companyName: string;
    address: string;
    country: string;
    contactPerson: string;
    tel: string;
    email: string;
  };
  
  // Contract Product List
  products: Array<{
    no: number;
    modelNo?: string;           // Model number
    imageUrl?: string;          // Product image
    description: string;         // Full product description
    specification: string;       // Specification
    hsCode?: string;            // HS Code
    quantity: number;
    unit: string;
    unitPrice: number;
    currency: string;
    amount: number;
    deliveryTime?: string;      // Delivery time
  }>;
  
  // Contract Terms
  terms: {
    totalAmount: number;
    currency: string;
    tradeTerms: string;          // FOB Xiamen / CIF Los Angeles
    paymentTerms: string;        // 30% T/T deposit, 70% before shipment
    depositAmount?: number;      // Deposit amount
    balanceAmount?: number;      // Balance amount
    deliveryTime: string;        // 25-30 days after deposit received
    portOfLoading: string;       // Xiamen, China
    portOfDestination: string;   // Los Angeles, USA
    packing: string;             // Export standard carton
    inspection: string;          // Buyer's inspection or third-party
    insurance?: string;          // If CIF, insurance details
    warranty?: string;           // Product warranty
  };
  
  // Liability Terms
  liabilityTerms?: {
    sellerDefault: string;       // Seller's default liability
    buyerDefault: string;        // Buyer's default liability
    forceMajeure: string;        // Force majeure clause
  };
  
  // Dispute Resolution
  disputeResolution?: {
    governingLaw: string;        // Applicable law
    arbitration: string;         // Arbitration clause
  };
  
  // Signature Information
  signature?: {
    sellerSignatory: string;     // Seller's signatory
    buyerSignatory: string;      // Buyer's signatory
    signDate?: string;           // Signing date
  };

  templateSettings?: {
    productTableColumns?: SalesContractProductTableColumn[];
  };
}

export type SalesContractProductTableColumnKey =
  | 'no'
  | 'modelNo'
  | 'image'
  | 'itemNameSpecification'
  | 'quantity'
  | 'unit'
  | 'unitPrice'
  | 'amount';

export interface SalesContractProductTableColumn {
  key: SalesContractProductTableColumnKey;
  label: string;
  widthPercent: number;
}

export const DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS: SalesContractProductTableColumn[] = [
  { key: 'no', label: 'No.', widthPercent: 5 },
  { key: 'modelNo', label: 'Model No.', widthPercent: 12 },
  { key: 'image', label: 'Image', widthPercent: 8 },
  { key: 'itemNameSpecification', label: 'Item Name / Specification', widthPercent: 32 },
  { key: 'quantity', label: 'Quantity', widthPercent: 10 },
  { key: 'unit', label: 'Unit', widthPercent: 7 },
  { key: 'unitPrice', label: 'Unit Price', widthPercent: 11 },
  { key: 'amount', label: 'Amount', widthPercent: 15 },
];

export const normalizeSalesContractProductTableColumns = (
  value?: SalesContractProductTableColumn[] | null,
): SalesContractProductTableColumn[] => {
  const incoming = Array.isArray(value) ? value : [];
  const normalized = DEFAULT_SALES_CONTRACT_PRODUCT_TABLE_COLUMNS.map((fallbackColumn) => {
    const matched = incoming.find((column) => column?.key === fallbackColumn.key);
    const widthPercent = Number(matched?.widthPercent);

    return {
      key: fallbackColumn.key,
      label: String(matched?.label || fallbackColumn.label).trim() || fallbackColumn.label,
      widthPercent: Number.isFinite(widthPercent) ? Math.max(4, widthPercent) : fallbackColumn.widthPercent,
    };
  });

  const total = normalized.reduce((sum, column) => sum + column.widthPercent, 0) || 100;

  return normalized.map((column, index) => {
    if (index === normalized.length - 1) {
      const allocated = normalized
        .slice(0, -1)
        .reduce((sum, item) => sum + Number(((item.widthPercent / total) * 100).toFixed(2)), 0);
      return {
        ...column,
        widthPercent: Number((100 - allocated).toFixed(2)),
      };
    }

    return {
      ...column,
      widthPercent: Number(((column.widthPercent / total) * 100).toFixed(2)),
    };
  });
};

interface SalesContractDocumentProps {
  data: SalesContractData;
  layoutConfig?: DocumentLayoutConfig;
}

export const SalesContractDocument = forwardRef<HTMLDivElement, SalesContractDocumentProps>(
  ({ data, layoutConfig }, ref) => {
    const sellerDisplayName = data.seller.nameEn || data.seller.name;
    const sellerDisplayAddress = data.seller.addressEn || data.seller.address;
    const total = data.products.reduce((sum, item) => sum + item.amount, 0);
    const productTableColumns = normalizeSalesContractProductTableColumns(
      data.templateSettings?.productTableColumns,
    );
    const pageWidth = layoutConfig ? `${layoutConfig.canvasWidthMm}mm` : '794px';
    const pageMinHeight = layoutConfig ? `${layoutConfig.canvasMinHeightMm}mm` : '1123px';
    const pagePaddingTop = layoutConfig ? `${layoutConfig.contentPaddingTopMm}mm` : '15mm';
    const pagePaddingBottom = layoutConfig ? `${layoutConfig.contentPaddingBottomMm}mm` : '15mm';
    const fontSize = layoutConfig ? `${layoutConfig.fontSizePt}pt` : '9pt';
    const lineHeight = layoutConfig?.lineHeight ?? 1.4;
    
    // Extract trade term abbreviation (EXW, FOB, CNF, CIF) from tradeTerms
    const extractTradeTerm = (tradeTerms: string): string => {
      const upperTerms = tradeTerms.toUpperCase();
      if (upperTerms.includes('EXW')) return 'EXW';
      if (upperTerms.includes('FOB')) return 'FOB';
      if (upperTerms.includes('CNF') || upperTerms.includes('C&F')) return 'CNF';
      if (upperTerms.includes('CIF')) return 'CIF';
      return 'EXW'; // Default to EXW
    };
    
    const tradeTerm = extractTradeTerm(data.terms.tradeTerms);

    return (
      <>
        <A4PrintStyles />
        <style>{`
          /* 🔥 打印分页控制 */
          @media print {
            /* 确保整个文档可以分页 */
            .sales-contract-content {
              page-break-after: auto;
            }
            
            /* 产品表格允许分页 */
            .product-table {
              page-break-inside: auto;
            }
            
            .product-table thead {
              display: table-header-group;
            }
            
            .product-table tbody tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            /* 各个section避免被切断 */
            .contract-section {
              page-break-inside: avoid;
            }
            
            /* 签名区域避免被切断 */
            .signature-section {
              page-break-inside: avoid;
            }
            
            /* 强制在特定位置分页 */
            .page-break-before {
              page-break-before: always;
            }
          }
          
          /* 屏幕预览时的分页提示 */
          @media screen {
            .page-break-hint-line {
              margin: 40px 0;
              border-top: 2px dashed #e0e0e0;
              position: relative;
            }
            
            .page-break-hint-line::after {
              content: '--- Page Break ---';
              position: absolute;
              left: 50%;
              top: -10px;
              transform: translateX(-50%);
              background: white;
              padding: 0 10px;
              font-size: 10px;
              color: #999;
            }
          }
        `}</style>
        <A4DocumentContainer
          ref={ref}
          pageWidth={pageWidth}
          pageMinHeight={pageMinHeight}
          pagePaddingTop={pagePaddingTop}
          pagePaddingBottom={pagePaddingBottom}
          pagePaddingX="15mm"
          fontSize={fontSize}
          lineHeight={lineHeight}
        >
          <div className="sales-contract-content">{/* Header - Taiwan Enterprise Compact Style */}
            <div className="mb-3">
              {/* First Row: Logo + Sales Contract Title + Contract Info */}
              <div className="flex items-center justify-between mb-2">
                {/* Left: Logo */}
                <div className="w-[80px] h-[70px] flex items-center">
                  <img
                    src={cosunLogo}
                    alt="THE COSUN Logo"
                    className="w-full h-auto max-h-full"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                {/* Center: Sales Contract Title */}
                <div className="flex-1 flex justify-center items-center">
                  <h1 className="text-2xl font-bold tracking-wider text-black">
                    SALES CONTRACT
                  </h1>
                </div>
                
                {/* Right: Contract Info Table */}
                <div className="w-[231px] h-[70px]">
                  <table className="w-full h-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      {data.quotationNo && (
                        <tr>
                          <td className="border border-gray-400 px-2 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Ref. No.</td>
                          <td className="border border-gray-400 px-2 py-0.5 w-[70%]">{data.quotationNo}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-400 px-2 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Contract No.</td>
                        <td className="border border-gray-400 px-2 py-0.5 font-bold text-black w-[70%]">{data.contractNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-2 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Date</td>
                        <td className="border border-gray-400 px-2 py-0.5 font-semibold text-black w-[70%]">
                          {new Date(data.contractDate).toLocaleDateString('en-US', { 
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

            {/* Contract Parties Information - Taiwan Enterprise Table Style */}
            <div className="mb-3 contract-section">
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  <tr>
                    {/* Seller Information */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        SELLER
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{sellerDisplayName}</span></div>
                        <div><span className="text-gray-600">Address:</span> {sellerDisplayAddress}</div>
                        <div><span className="text-gray-600">Tel:</span> {data.seller.tel} {data.seller.fax && `| Fax: ${data.seller.fax}`}</div>
                        <div><span className="text-gray-600">Email:</span> {data.seller.email}</div>
                        {data.seller.legalRepresentative && (
                          <div><span className="text-gray-600">Legal Rep.:</span> {data.seller.legalRepresentative}</div>
                        )}
                      </div>
                    </td>
                    
                    {/* Buyer Information */}
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-2 py-1 font-bold border-b border-gray-400">
                        BUYER
                      </div>
                      <div className="px-2 py-1.5 space-y-0.5">
                        <div><span className="font-semibold">{data.buyer.companyName}</span></div>
                        <div><span className="text-gray-600">Address:</span> {data.buyer.address}</div>
                        <div><span className="text-gray-600">Country:</span> {data.buyer.country}</div>
                        <div><span className="text-gray-600">Contact:</span> {data.buyer.contactPerson}</div>
                        <div><span className="text-gray-600">Tel:</span> {data.buyer.tel}</div>
                        <div><span className="text-gray-600">Email:</span> {data.buyer.email}</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Product List */}
            <div className="mb-4 contract-section">
              <h3 className="font-bold text-base mb-2">ARTICLE 1: PRODUCT DESCRIPTION</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-xs product-table">
                <thead>
                  <tr className="bg-gray-100">
                    {productTableColumns.map((column) => (
                      <th
                        key={column.key}
                        className={`border border-gray-300 px-2 py-2 ${
                          column.key === 'quantity' || column.key === 'unitPrice' || column.key === 'amount'
                            ? 'text-right'
                            : column.key === 'unit' || column.key === 'image'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                        style={{ width: `${column.widthPercent}%` }}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product) => (
                    <tr key={product.no}>
                      {productTableColumns.map((column) => {
                        switch (column.key) {
                          case 'no':
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{product.no}</td>;
                          case 'modelNo':
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-gray-700">{product.modelNo || '-'}</td>;
                          case 'image':
                            return (
                              <td key={column.key} className="border border-gray-300 px-1 py-1 text-center">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.description}
                                    className="w-10 h-10 object-cover mx-auto rounded"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 mx-auto rounded flex items-center justify-center text-xs text-gray-400">
                                    N/A
                                  </div>
                                )}
                              </td>
                            );
                          case 'itemNameSpecification':
                            return (
                              <td key={column.key} className="border border-gray-300 px-2 py-2">
                                <div className="font-semibold">{product.description}</div>
                                <div className="text-xs text-gray-600 mt-0.5">{product.specification}</div>
                              </td>
                            );
                          case 'quantity':
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{product.quantity.toLocaleString()}</td>;
                          case 'unit':
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-center">{product.unit}</td>;
                          case 'unitPrice':
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right">{product.currency} {product.unitPrice.toFixed(2)}</td>;
                          case 'amount':
                          default:
                            return <td key={column.key} className="border border-gray-300 px-2 py-2 text-right font-semibold">{product.currency} {product.amount.toFixed(2)}</td>;
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={Math.max(productTableColumns.length - 1, 1)} className="border border-gray-300 px-2 py-2 text-right">
                      Total Value ({tradeTerm}):
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-right font-semibold">
                      {data.terms.currency} {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Seller Bank Receipt Information - Taiwan Enterprise Table Style */}
            {data.seller.bankInfo && (
              <div className="mb-4 contract-section">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-400 px-2 py-1.5 text-left font-bold" colSpan={4}>
                        SELLER'S BANK INFORMATION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">Bank Name</td>
                      <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.seller.bankInfo.bankName}</td>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 w-[15%] font-semibold">Account Name</td>
                      <td className="border border-gray-400 px-2 py-1.5 w-[35%]">{data.seller.bankInfo.accountName}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Account No.</td>
                      <td className="border border-gray-400 px-2 py-1.5 font-bold" colSpan={3}>
                        {data.seller.bankInfo.accountNumber}
                      </td>
                    </tr>
                    {(data.seller.bankInfo.swiftCode || data.seller.bankInfo.currency) && (
                      <tr>
                        {data.seller.bankInfo.swiftCode && (
                          <>
                            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">SWIFT Code</td>
                            <td className="border border-gray-400 px-2 py-1.5">{data.seller.bankInfo.swiftCode}</td>
                          </>
                        )}
                        {data.seller.bankInfo.currency && (
                          <>
                            <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Currency</td>
                            <td className="border border-gray-400 px-2 py-1.5">{data.seller.bankInfo.currency}</td>
                          </>
                        )}
                      </tr>
                    )}
                    {data.seller.bankInfo.iban && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">IBAN</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.iban}</td>
                      </tr>
                    )}
                    {data.seller.bankInfo.routingNumber && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Routing No.</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.routingNumber}</td>
                      </tr>
                    )}
                    {data.seller.bankInfo.bankAddress && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Bank Address</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.bankAddress}</td>
                      </tr>
                    )}
                    {data.seller.bankInfo.paymentNote && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1.5 bg-gray-100 font-semibold">Payment Note</td>
                        <td className="border border-gray-400 px-2 py-1.5" colSpan={3}>{data.seller.bankInfo.paymentNote}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contract Terms - Taiwan Enterprise Table Style */}
            <div className="mb-4 contract-section">
              <h3 className="font-bold text-base mb-2">ARTICLE 2: TERMS AND CONDITIONS</h3>
              <table className="w-full border-collapse border border-gray-400 text-xs">
                <tbody>
                  {/* Trade Terms */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.1 Trade Terms:</span>
                      <span className="ml-1">{data.terms.tradeTerms}</span>
                    </td>
                  </tr>
                  
                  {/* Payment Terms */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.2 Payment Terms:</span>
                      <span className="ml-1">{data.terms.paymentTerms}</span>
                      {(data.terms.depositAmount || data.terms.balanceAmount) && (
                        <span className="ml-2 text-gray-600">
                          {data.terms.depositAmount && `(Deposit: ${data.terms.currency} ${data.terms.depositAmount.toFixed(2)})`}
                          {data.terms.depositAmount && data.terms.balanceAmount && ', '}
                          {data.terms.balanceAmount && `(Balance: ${data.terms.currency} ${data.terms.balanceAmount.toFixed(2)})`}
                        </span>
                      )}
                    </td>
                  </tr>
                  
                  {/* Delivery Time */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.3 Delivery Time:</span>
                      <span className="ml-1">{data.terms.deliveryTime}</span>
                    </td>
                  </tr>
                  
                  {/* Port of Loading */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.4 Port of Loading:</span>
                      <span className="ml-1">{data.terms.portOfLoading}</span>
                    </td>
                  </tr>
                  
                  {/* Port of Destination */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.5 Port of Destination:</span>
                      <span className="ml-1">{data.terms.portOfDestination}</span>
                    </td>
                  </tr>
                  
                  {/* Packing */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.6 Packing:</span>
                      <span className="ml-1">{data.terms.packing}</span>
                    </td>
                  </tr>
                  
                  {/* Inspection */}
                  <tr>
                    <td className="border border-gray-400 px-2 py-1.5">
                      <span className="font-semibold">2.7 Inspection:</span>
                      <span className="ml-1">{data.terms.inspection}</span>
                    </td>
                  </tr>
                  
                  {/* Insurance (if any) */}
                  {data.terms.insurance && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">2.8 Insurance:</span>
                        <span className="ml-1">{data.terms.insurance}</span>
                      </td>
                    </tr>
                  )}
                  
                  {/* Warranty (if any) */}
                  {data.terms.warranty && (
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5">
                        <span className="font-semibold">2.9 Warranty:</span>
                        <span className="ml-1">{data.terms.warranty}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Liability for Breach - Taiwan Enterprise Table Style */}
            {data.liabilityTerms && (
              <div className="mb-4 contract-section">
                <h3 className="font-bold text-base mb-2">ARTICLE 3: LIABILITY FOR BREACH</h3>
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
                        <span className="font-semibold">3.1 Seller's Default:</span>
                        <span className="ml-1">{data.liabilityTerms.sellerDefault}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
                        <span className="font-semibold">3.2 Buyer's Default:</span>
                        <span className="ml-1">{data.liabilityTerms.buyerDefault}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
                        <span className="font-semibold">3.3 Force Majeure:</span>
                        <span className="ml-1">{data.liabilityTerms.forceMajeure}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Dispute Resolution - Taiwan Enterprise Table Style */}
            {data.disputeResolution && (
              <div className="mb-4 contract-section">
                <h3 className="font-bold text-base mb-2">ARTICLE 4: DISPUTE RESOLUTION</h3>
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
                        <span className="font-semibold">4.1 Governing Law:</span>
                        <span className="ml-1">{data.disputeResolution.governingLaw}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1.5" colSpan={2}>
                        <span className="font-semibold">4.2 Arbitration:</span>
                        <span className="ml-1">{data.disputeResolution.arbitration}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Authorization Signature Area */}
            <div className="mt-12 pt-4 border-t-2 border-gray-300 signature-section">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold mb-4">SELLER (Company Seal):</h4>
                  <div className="text-sm space-y-3">
                    <p className="font-semibold">{data.seller.nameEn}</p>
                    <div className="border-2 border-dashed border-gray-300 rounded p-6 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">Company Seal</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-b border-gray-400 pb-1">
                        <p className="text-xs text-gray-600">Authorized Signature</p>
                      </div>
                      <p className="text-xs text-gray-600">Date: _________________</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-4">BUYER (Company Seal):</h4>
                  <div className="text-sm space-y-3">
                    <p className="font-semibold">{data.buyer.companyName}</p>
                    <div className="border-2 border-dashed border-gray-300 rounded p-6 bg-gray-50 text-center">
                      <p className="text-xs text-gray-400">Company Seal</p>
                    </div>
                    <div className="space-y-1">
                      <div className="border-b border-gray-400 pb-1">
                        <p className="text-xs text-gray-600">Authorized Signature</p>
                      </div>
                      <p className="text-xs text-gray-600">Date: _________________</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-8 text-xs text-gray-500 text-center border-t border-gray-200 pt-3">
              <p>This Sales Contract is made in duplicate, one for each party, and shall become effective upon signature and seal by both parties.</p>
              <p className="mt-1">Please sign, seal and return a scanned copy to the Seller's email address.</p>
            </div>
            
            {/* 🔥 Document Footer - Page Number and URL */}
            <div className="document-footer-container mt-6 pt-2 border-t border-gray-300 flex justify-between items-center text-[8pt] text-gray-500">
              <div>https://www.figma.com/make?via=hyperliquid2-qva1&id=p-6ahs3uj1UtCJHKC3dF8GhGc6U-0</div>
              <div className="page-number"></div>
            </div>
          </div>
        </A4DocumentContainer>
      </>
    );
  }
);

SalesContractDocument.displayName = 'SalesContractDocument';
