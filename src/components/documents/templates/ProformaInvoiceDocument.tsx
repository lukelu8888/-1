import React, { forwardRef } from 'react';
import { A4PageContainer } from '../A4PageContainer';
import type { DocumentLayoutConfig } from '../A4PageContainer';

/**
 * 📄 Proforma Invoice (形式发票) 数据接口
 */
export interface ProformaInvoiceData {
  // 发票信息
  invoiceNo: string;          // 发票编号
  costNo?: string;            // Cost编号
  scNo?: string;              // S/C编号
  invoiceDate: string;        // 发票日期
  
  // 卖方信息
  seller: {
    name: string;
    nameEn: string;
    unit?: string;            // Unit1807
    building?: string;        // C1# Building
    zone?: string;            // Zone C
    plaza?: string;           // Wanda Plaza
    district?: string;        // Cangshan Dist.
    city?: string;            // Fuzhou
    province?: string;        // Fujian
    country?: string;         // China
    address?: string;         // 完整地址
    addressEn?: string;
    tel?: string;
    cell?: string;
    email?: string;
    logoUrl?: string;         // 公司Logo URL
  };
  
  // 买方信息
  buyer: {
    companyName: string;
    poBox?: string;           // P.O. Box 6011
    city?: string;            // Sharjah
    country?: string;         // UAE
    contactPerson?: string;
    phone?: string;
    address?: string;
  };
  
  // 商品信息
  products: Array<{
    seqNo: number;
    itemNo?: string;          // 5101#
    photoUrl?: string;        // 产品图片URL
    description: string;      // Block Materials- ABS
    specification?: string;   // Color: in white
    quantity: number;
    unit: string;             // pc, pcs, etc.
    unitPrice: number;
    currency: string;         // US$
    extendedValue: number;
  }>;
  
  // 运费和总额
  freight?: {
    type: string;             // "Air Freight"
    terms: string;            // "collected by the buyer"
  };
  totalValue: number;
  totalCurrency: string;
  priceTerms?: string;        // "EX.W (XIAMEN)"
  
  // 银行信息
  bankInfo: {
    beneficiary: string;
    beneficiaryAddress: string;
    accountNo: string;
    bank: string;
    bankAddress: string;
    swiftCode: string;
  };
  
  // 备注
  remarks: {
    priceTerms?: string;      // "Price Term: EX WARE OF XIAMEN"
    containerType?: string;   // "Container Type: 1 x in bulk"
    paymentTerms?: string;    // "Term of payment: 100% prepayment..."
    portOfLoading?: string;   // "Port of Loading: XIAMEN"
    shipmentDate?: string;    // "Date of Shipment: MAY 5, 2025"
    others?: string[];        // 其他备注
  };
  
  // 页脚信息
  footer?: {
    tagline?: string;         // "One-stop Project Sourcing Solution Provider"
    currentPage?: number;
    totalPages?: number;
  };
}

/**
 * 📄 Proforma Invoice 文档模板组件
 */
export const ProformaInvoiceDocument = forwardRef<HTMLDivElement, { data: ProformaInvoiceData; layoutConfig?: DocumentLayoutConfig }>(
  ({ data, layoutConfig }, ref) => {
    // 格式化金额
    const formatAmount = (amount: number, currency: string = 'US$') => {
      return `${currency}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    const pageWidth = layoutConfig ? `${layoutConfig.canvasWidthMm}mm` : '210mm';
    const pageMinHeight = layoutConfig ? `${layoutConfig.canvasMinHeightMm}mm` : '297mm';
    const pagePaddingTop = layoutConfig ? `${layoutConfig.contentPaddingTopMm}mm` : '15mm';
    const pagePaddingBottom = layoutConfig ? `${layoutConfig.contentPaddingBottomMm}mm` : '15mm';
    const pageFontSize = layoutConfig ? `${layoutConfig.fontSizePt}pt` : '9pt';
    const pageLineHeight = layoutConfig?.lineHeight ?? 1.4;
    const contentPaddingTop = layoutConfig ? `${layoutConfig.contentPaddingTopMm}mm` : '3rem';
    const contentPaddingBottom = layoutConfig ? `${layoutConfig.contentPaddingBottomMm}mm` : '3rem';
    const contentFontSize = layoutConfig ? `${layoutConfig.fontSizePt}pt` : '0.875rem';
    const contentLineHeight = layoutConfig?.lineHeight ?? 1.25;

    return (
      <div ref={ref}>
        {/* 第一页 */}
        <A4PageContainer
          pageWidth={pageWidth}
          pageMinHeight={pageMinHeight}
          pagePaddingTop={pagePaddingTop}
          pagePaddingBottom={pagePaddingBottom}
          pagePaddingX="15mm"
          fontSize={pageFontSize}
          lineHeight={pageLineHeight}
        >
          <div
            style={{
              paddingTop: contentPaddingTop,
              paddingBottom: contentPaddingBottom,
              paddingLeft: '3rem',
              paddingRight: '3rem',
              fontFamily: 'Times New Roman, serif',
              fontSize: contentFontSize,
              lineHeight: contentLineHeight,
            }}
          >
            {/* 页眉：公司Logo和信息 */}
            <div className="mb-6 pb-4">
              <div className="flex items-start justify-between mb-3">
                {/* 左侧：Logo和公司信息 */}
                <div className="flex items-start gap-4">
                  {data.seller.logoUrl ? (
                    <img src={data.seller.logoUrl} alt="Company Logo" className="w-16 h-16 object-contain flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-red-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      LOGO
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-sm font-bold tracking-normal mb-1" style={{ letterSpacing: '0.02em' }}>
                      {data.seller.nameEn || data.seller.name}
                    </h1>
                    <div className="text-xs leading-relaxed" style={{ lineHeight: '1.4' }}>
                      <p>
                        {data.seller.unit && `${data.seller.unit}, `}
                        {data.seller.building && `${data.seller.building}, `}
                        {data.seller.zone && `${data.seller.zone},`}
                      </p>
                      <p>
                        {data.seller.plaza && `${data.seller.plaza}, `}
                        {data.seller.district && `${data.seller.district}., `}
                        {data.seller.city},
                      </p>
                      <p>
                        {data.seller.province}, {data.seller.country}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 右侧：联系方式 */}
                <div className="text-xs text-right leading-relaxed" style={{ lineHeight: '1.4' }}>
                  {data.seller.cell && <p>Cell: {data.seller.cell}</p>}
                  {data.seller.email && <p>Email: {data.seller.email}</p>}
                </div>
              </div>
              
              {/* 黑色分隔线 */}
              <div className="w-full h-px bg-black"></div>
            </div>

            {/* 文档标题 */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold italic tracking-wide">
                PROFORMA INVOICE
              </h2>
            </div>

            {/* 客户信息和发票信息 */}
            <div className="flex justify-between mb-4 text-xs">
              {/* 左侧：客户信息 */}
              <div className="flex-1">
                <p className="mb-1">
                  <span className="font-bold italic">TO: </span>
                  <span className="italic">{data.buyer.companyName}</span>
                </p>
                {data.buyer.poBox && (
                  <p className="italic mb-1">
                    <span className="font-bold">P.O. </span>{data.buyer.poBox}
                  </p>
                )}
                {data.buyer.contactPerson && (
                  <p className="italic mt-2">
                    {data.buyer.contactPerson}
                  </p>
                )}
              </div>
              
              {/* 右侧：发票信息 */}
              <div className="text-right text-xs">
                {data.costNo && (
                  <p className="mb-1">
                    <span className="italic">Cost.#: </span>
                    <span className="font-bold italic">{data.costNo}</span>
                  </p>
                )}
                <p className="mb-1">
                  <span className="italic">Inv. #: </span>
                  <span className="font-bold italic">{data.invoiceNo}</span>
                </p>
                {data.scNo && (
                  <p className="mb-1">
                    <span className="italic">S/C #: </span>
                    <span className="font-bold italic">{data.scNo}</span>
                  </p>
                )}
                <p>
                  <span className="italic">Date: </span>
                  <span className="font-bold italic">{data.invoiceDate}</span>
                </p>
              </div>
            </div>

            {/* 产品表格 */}
            <table className="w-full border-collapse border-2 border-black text-xs mb-4">
              <thead>
                <tr className="bg-white">
                  <th className="border border-black px-1 py-1 font-bold italic text-center" style={{ width: '50px' }}>
                    Seq Item No.
                  </th>
                  <th className="border border-black px-1 py-1 font-bold italic text-center" style={{ width: '80px' }}>
                    Photos
                  </th>
                  <th className="border border-black px-2 py-1 font-bold italic text-center">
                    Description of Goods
                  </th>
                  <th className="border border-black px-1 py-1 font-bold italic text-center" style={{ width: '70px' }}>
                    Q'ty
                  </th>
                  <th className="border border-black px-1 py-1 font-bold italic text-center" style={{ width: '80px' }}>
                    Unit Price
                  </th>
                  <th className="border border-black px-1 py-1 font-bold italic text-center" style={{ width: '90px' }}>
                    Extended Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.seqNo}>
                    <td className="border border-black px-1 py-2 text-center italic align-top">
                      {product.seqNo}
                    </td>
                    <td className="border border-black px-1 py-2 text-center align-top">
                      {product.itemNo && (
                        <div className="italic text-xs mb-1">{product.itemNo}</div>
                      )}
                      {product.photoUrl ? (
                        <img src={product.photoUrl} alt={product.description} className="w-full h-auto" />
                      ) : (
                        <div className="w-full h-12 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                          Photo
                        </div>
                      )}
                    </td>
                    <td className="border border-black px-2 py-2 italic align-top">
                      <div className="font-bold">{product.description}</div>
                      {product.specification && (
                        <div className="mt-1">{product.specification}</div>
                      )}
                    </td>
                    <td className="border border-black px-1 py-2 text-center italic align-top">
                      {product.quantity.toLocaleString()} {product.unit}
                    </td>
                    <td className="border border-black px-1 py-2 text-center italic align-top">
                      {formatAmount(product.unitPrice, product.currency)}
                    </td>
                    <td className="border border-black px-1 py-2 text-center italic align-top">
                      {formatAmount(product.extendedValue, product.currency)}
                    </td>
                  </tr>
                ))}
                
                {/* Null行 */}
                <tr>
                  <td className="border border-black px-1 py-2" colSpan={6}>
                    <div className="text-center italic font-bold">Null</div>
                  </td>
                </tr>
                
                {/* 运费行 */}
                {data.freight && (
                  <tr>
                    <td className="border border-black px-2 py-2 text-center italic" colSpan={6}>
                      {data.freight.type}: {data.freight.terms}
                    </td>
                  </tr>
                )}
                
                {/* 总额行 */}
                <tr>
                  <td className="border border-black px-2 py-2 text-right italic font-bold" colSpan={5}>
                    Total {data.priceTerms} Value
                  </td>
                  <td className="border border-black px-1 py-2 text-center font-bold italic">
                    {formatAmount(data.totalValue, data.totalCurrency)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 银行信息 */}
            <div className="mb-4 text-xs">
              <p className="font-bold italic mb-2">BANK INFORMATION FOR T/T:</p>
              <div className="leading-snug italic">
                <p><span className="font-bold">Beneficiary:</span> {data.bankInfo.beneficiary}</p>
                <p><span className="font-bold">Beneficiary's address:</span> {data.bankInfo.beneficiaryAddress}</p>
                <p><span className="font-bold">Beneficiary's account:</span> {data.bankInfo.accountNo}</p>
                <p><span className="font-bold">Beneficiary's bank:</span> {data.bankInfo.bank}</p>
                <p><span className="font-bold">Beneficiary's bank address:</span> {data.bankInfo.bankAddress}</p>
                <p><span className="font-bold">Swift Code:</span> {data.bankInfo.swiftCode}</p>
              </div>
            </div>

            {/* 备注 */}
            <div className="mb-6 text-xs">
              <p className="font-bold italic mb-2">Remarks:</p>
              <div className="leading-snug italic">
                {data.remarks.priceTerms && <p>1. {data.remarks.priceTerms}</p>}
                {data.remarks.containerType && <p>2. {data.remarks.containerType}</p>}
                {data.remarks.paymentTerms && <p>3. {data.remarks.paymentTerms}</p>}
                {data.remarks.portOfLoading && <p>4. {data.remarks.portOfLoading}</p>}
                {data.remarks.shipmentDate && <p>5. {data.remarks.shipmentDate}</p>}
                {data.remarks.others && data.remarks.others.length > 0 && (
                  <>
                    <p className="mt-2 font-bold">Others:</p>
                    {data.remarks.others.map((remark, index) => (
                      <p key={index} className="ml-2">{remark}</p>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 页脚 */}
            <div className="absolute bottom-8 left-0 right-0 px-12">
              <div className="border-t border-black pt-2 flex items-center justify-between text-xs italic">
                <span>{data.footer?.tagline || 'One-stop Project Sourcing Solution Provider'}</span>
                <span>Page {data.footer?.currentPage || 1}/{data.footer?.totalPages || 2}</span>
              </div>
            </div>
          </div>
        </A4PageContainer>

        {/* 第二页：签名页 */}
        <A4PageContainer
          pageWidth={pageWidth}
          pageMinHeight={pageMinHeight}
          pagePaddingTop={pagePaddingTop}
          pagePaddingBottom={pagePaddingBottom}
          pagePaddingX="15mm"
          fontSize={pageFontSize}
          lineHeight={pageLineHeight}
        >
          <div
            style={{
              paddingTop: contentPaddingTop,
              paddingBottom: contentPaddingBottom,
              paddingLeft: '3rem',
              paddingRight: '3rem',
              fontFamily: 'Times New Roman, serif',
              fontSize: contentFontSize,
              lineHeight: contentLineHeight,
            }}
          >
            {/* 签名区域 */}
            <div className="flex justify-between gap-8 pt-8">
              {/* 买方签名 */}
              <div className="flex-1">
                <p className="italic mb-2">For and on Behalf of Buyer</p>
                <p className="font-bold mb-20">{data.buyer.companyName}</p>
                <div className="border-b border-dotted border-black pb-1 mb-2"></div>
                <p className="text-center italic text-xs">Authorized Signature(s)</p>
              </div>

              {/* 卖方签名 */}
              <div className="flex-1">
                <p className="italic text-right mb-2">For and on Behalf of Seller</p>
                <p className="font-bold text-right mb-20">{data.seller.nameEn || data.seller.name}</p>
                <div className="border-b border-dotted border-black pb-1 mb-2"></div>
                <p className="text-center italic text-xs">Authorized Signature(s)</p>
              </div>
            </div>

            {/* 页脚 */}
            <div className="absolute bottom-8 left-0 right-0 px-12">
              <div className="border-t border-black pt-2 flex items-center justify-between text-xs italic">
                <span>{data.footer?.tagline || 'One-stop Project Sourcing Solution Provider'}</span>
                <span>Page {data.footer?.currentPage ? data.footer.currentPage + 1 : 2}/{data.footer?.totalPages || 2}</span>
              </div>
            </div>
          </div>
        </A4PageContainer>
      </div>
    );
  }
);

ProformaInvoiceDocument.displayName = 'ProformaInvoiceDocument';