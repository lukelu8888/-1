import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import type { DocumentLayoutConfig } from '../A4PageContainer';

/**
 * 📄 商业发票（Commercial Invoice）
 * 
 * 用途：海关报关必需单据
 * 数据继承：从销售合同 + 出货通知
 * 重要性：最高 - 必须精确无误
 */

export interface CommercialInvoiceData {
  // 发票基本信息
  invoiceNo: string;           // CI-20251210-001
  invoiceDate: string;
  contractNo?: string;         // 关联销售合同号
  
  // 出口方（卖方）
  exporter: {
    name: string;
    nameEn: string;
    address: string;
    addressEn: string;
    tel: string;
    taxId?: string;
  };
  
  // 进口方（买方）
  importer: {
    name: string;
    address: string;
    country: string;
    tel?: string;
  };
  
  // 唛头（Shipping Marks）
  shippingMarks: {
    mainMark: string;          // ABC-LA-001
    sideMark?: string;         // C/NO. 1-50
    cautionMark?: string;      // MADE IN CHINA / FRAGILE
  };
  
  // 货物描述
  goods: Array<{
    no: number;
    description: string;       // 完整商品描述
    hsCode: string;           // HS编码（海关必需）
    quantity: number;
    unit: string;
    unitPrice: number;
    currency: string;
    amount: number;
    grossWeight?: number;      // 毛重（kg）
    netWeight?: number;        // 净重（kg）
    measurement?: number;      // 体积（cbm）
  }>;
  
  // 运输信息
  shipping: {
    tradeTerms: string;        // FOB XIAMEN
    paymentTerms: string;      // T/T
    portOfLoading: string;     // Xiamen, China
    portOfDischarge: string;   // Los Angeles, USA
    finalDestination: string;  // Los Angeles, USA
    vesselName?: string;       // 船名
    voyageNo?: string;         // 航次号
    blNo?: string;             // 提单号
  };
  
  // 包装信息
  packing: {
    totalCartons: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    totalMeasurement: number;
  };
}

interface CommercialInvoiceDocumentProps {
  data: CommercialInvoiceData;
  layoutConfig?: DocumentLayoutConfig;
}

export const CommercialInvoiceDocument = forwardRef<HTMLDivElement, CommercialInvoiceDocumentProps>(
  ({ data, layoutConfig }, ref) => {
    
    const total = data.goods.reduce((sum, item) => sum + item.amount, 0);
    const currency = data.goods[0]?.currency || 'USD';
    const documentWidth = layoutConfig ? `${layoutConfig.canvasWidthMm}mm` : '794px';
    const documentMinHeight = layoutConfig ? `${layoutConfig.canvasMinHeightMm}mm` : '1123px';
    const fontSize = layoutConfig ? `${layoutConfig.fontSizePt}pt` : '9pt';
    const lineHeight = layoutConfig?.lineHeight ?? 1.3;
    const contentPaddingTop = layoutConfig ? `${layoutConfig.contentPaddingTopMm}mm` : '15mm';
    const contentPaddingBottom = layoutConfig ? `${layoutConfig.contentPaddingBottomMm}mm` : '15mm';
    
    // 大写金额转换
    const numberToWords = (num: number): string => {
      // TODO: 实现数字转大写英文
      return `${currency} ${num.toFixed(2)} ONLY`;
    };

    return (
      <div 
        ref={ref}
        className="bg-white mx-auto shadow-lg"
        style={{ 
          width: documentWidth,
          minHeight: documentMinHeight,
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          fontSize,
          lineHeight
        }}
      >
        <div
          style={{
            paddingTop: contentPaddingTop,
            paddingBottom: contentPaddingBottom,
            paddingLeft: '15mm',
            paddingRight: '15mm',
          }}
        >
          {/* Header - Taiwan Enterprise Compact Style */}
          <div className="mb-3">
            {/* Title + Invoice Info Table */}
            <div className="flex items-start justify-between mb-2">
              {/* Left: LOGO */}
              <div className="w-[70px] flex-shrink-0">
                <img
                  src={cosunLogo}
                  alt="Company Logo"
                  className="w-full h-auto"
                  style={{ objectFit: 'contain' }}
                />
              </div>
              
              {/* Center: COMMERCIAL INVOICE Title */}
              <div className="flex-1 flex justify-center items-center">
                <h1 className="text-2xl font-bold tracking-wider text-black whitespace-nowrap">
                  COMMERCIAL INVOICE
                </h1>
              </div>
              
              {/* Right: Invoice Info Table */}
              <div className="w-[250px]">
                <table className="w-full border-collapse border border-gray-400 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap w-[85px]">Invoice No.</td>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-black whitespace-nowrap">{data.invoiceNo}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Date</td>
                      <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">
                        {new Date(data.invoiceDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                    </tr>
                    {data.contractNo && (
                      <tr>
                        <td className="border border-gray-400 px-2 py-1 bg-gray-100 font-semibold whitespace-nowrap">Contract No.</td>
                        <td className="border border-gray-400 px-2 py-1 font-semibold text-black whitespace-nowrap">{data.contractNo}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Divider - Double Line Design */}
            <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }}></div>
          </div>

          {/* 出口方和进口方 */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="border border-black p-3">
              <h3 className="font-semibold mb-2 underline">EXPORTER (Seller):</h3>
              <p className="font-semibold">{data.exporter.nameEn}</p>
              <p>{data.exporter.addressEn}</p>
              <p>Tel: {data.exporter.tel}</p>
            </div>
            <div className="border border-black p-3">
              <h3 className="font-semibold mb-2 underline">IMPORTER (Buyer):</h3>
              <p className="font-semibold">{data.importer.name}</p>
              <p>{data.importer.address}</p>
              <p>{data.importer.country}</p>
              {data.importer.tel && <p>Tel: {data.importer.tel}</p>}
            </div>
          </div>

          {/* 唛头 */}
          <div className="mb-4 border border-black p-3">
            <h3 className="font-semibold mb-2">SHIPPING MARKS:</h3>
            <div className="font-mono text-sm whitespace-pre-line">
              {data.shippingMarks.mainMark}
              {data.shippingMarks.sideMark && `\n${data.shippingMarks.sideMark}`}
              {data.shippingMarks.cautionMark && `\n${data.shippingMarks.cautionMark}`}
            </div>
          </div>

          {/* 货物清单 */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">DESCRIPTION OF GOODS:</h3>
            <table className="w-full border-collapse border-2 border-black text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black px-1 py-1 w-8">No.</th>
                  <th className="border border-black px-1 py-1">Description & Specification</th>
                  <th className="border border-black px-1 py-1 w-20">HS Code</th>
                  <th className="border border-black px-1 py-1 w-16">Quantity</th>
                  <th className="border border-black px-1 py-1 w-20">Unit Price</th>
                  <th className="border border-black px-1 py-1 w-20">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.goods.map((item) => (
                  <tr key={item.no}>
                    <td className="border border-black px-1 py-1 text-center">{item.no}</td>
                    <td className="border border-black px-1 py-1">{item.description}</td>
                    <td className="border border-black px-1 py-1 text-center">{item.hsCode}</td>
                    <td className="border border-black px-1 py-1 text-right">
                      {item.quantity.toLocaleString()} {item.unit}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {item.currency} {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right font-semibold">
                      {item.currency} {item.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td colSpan={5} className="border border-black px-1 py-1 text-right">
                    TOTAL:
                  </td>
                  <td className="border border-black px-1 py-1 text-right">
                    {currency} {total.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="border border-black px-2 py-1 text-xs">
                    <span className="font-semibold">SAY TOTAL: </span>
                    {numberToWords(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 运输和包装信息 */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="mb-1"><span className="font-semibold">Terms:</span> {data.shipping.tradeTerms}</div>
              <div className="mb-1"><span className="font-semibold">Payment:</span> {data.shipping.paymentTerms}</div>
              <div className="mb-1"><span className="font-semibold">Port of Loading:</span> {data.shipping.portOfLoading}</div>
              <div className="mb-1"><span className="font-semibold">Port of Discharge:</span> {data.shipping.portOfDischarge}</div>
              <div><span className="font-semibold">Final Destination:</span> {data.shipping.finalDestination}</div>
            </div>
            <div>
              <div className="mb-1"><span className="font-semibold">Total Cartons:</span> {data.packing.totalCartons}</div>
              <div className="mb-1"><span className="font-semibold">Total G.W.:</span> {data.packing.totalGrossWeight} KGS</div>
              <div className="mb-1"><span className="font-semibold">Total N.W.:</span> {data.packing.totalNetWeight} KGS</div>
              <div><span className="font-semibold">Total Measurement:</span> {data.packing.totalMeasurement} CBM</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CommercialInvoiceDocument.displayName = 'CommercialInvoiceDocument';