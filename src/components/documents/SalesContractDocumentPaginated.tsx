import React, { forwardRef } from 'react';
import cosunLogo from 'figma:asset/410810351d2b1fef484ded221d682af920f7ac14.png';
import { SalesContractData } from './templates/SalesContractDocument';

/**
 * 🔥 分页版销售合同文档
 * 
 * 智能分页逻辑：
 * - 产品数量 <= 10：所有内容显示在一页
 * - 产品数量 > 10：分两页显示
 */

interface SalesContractDocumentPaginatedProps {
  data: SalesContractData;
}

export const SalesContractDocumentPaginated = forwardRef<HTMLDivElement, SalesContractDocumentPaginatedProps>(
  ({ data }, ref) => {
    const toSafeNumber = (value: unknown): number => {
      if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
      if (typeof value === 'string') {
        const normalized = value.replace(/[^0-9.\-]/g, '').trim();
        if (!normalized) return 0;
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };
    
    const total = data.products.reduce((sum, item) => sum + toSafeNumber(item.amount), 0);
    
    const extractTradeTerm = (tradeTerms: string): string => {
      const upperTerms = tradeTerms.toUpperCase();
      if (upperTerms.includes('EXW')) return 'EXW';
      if (upperTerms.includes('FOB')) return 'FOB';
      if (upperTerms.includes('CNF') || upperTerms.includes('C&F')) return 'CNF';
      if (upperTerms.includes('CIF')) return 'CIF';
      return 'EXW';
    };
    
    const tradeTerm = extractTradeTerm(data.terms.tradeTerms);
    
    // 🔥 智能分页：根据产品数量决定是否需要第二页
    // 销售合同第一页可以显示更多产品（10个），充分利用空间
    const needsSecondPage = data.products.length > 10;
    const totalPages = needsSecondPage ? 2 : 1;
    const firstPageProducts = needsSecondPage ? 10 : data.products.length;
    
    return (
      <>
        {/* 打印样式 */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            html, body {
              margin: 0;
              padding: 0;
              background: white !important;
            }
            
            .paginated-document-container {
              background: white !important;
              padding: 0 !important;
            }
            
            .contract-page {
              margin: 0 !important;
              box-shadow: none !important;
              page-break-after: always !important;
            }
            
            .contract-page:last-child {
              page-break-after: auto !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @media screen {
            .paginated-document-container {
              background: #525659;
              padding: 40px 20px;
              min-height: 100vh;
            }
            
            .contract-page {
              width: 794px;
              height: 1123px;
              background: white;
              margin: 0 auto 20px auto;
              padding: 20mm;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              box-sizing: border-box;
              font-family: Arial, "Helvetica Neue", sans-serif;
              font-size: 9pt;
              line-height: 1.4;
              position: relative;
              overflow: hidden;
            }
            
            .contract-page:last-child {
              margin-bottom: 40px;
            }
          }
        `}</style>
        
        <div ref={ref} className="paginated-document-container">
          {/* ========== 第一页 ========== */}
          <div className="contract-page">
            {/* Header */}
            <div className="mb-2.5">
              <div className="flex justify-between mb-1.5">
                <div className="w-[70px] flex items-end">
                  <img
                    src={cosunLogo}
                    alt="THE COSUN Logo"
                    className="w-full h-auto"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                
                <div className="flex-1 flex justify-center items-end pb-1">
                  <h1 className="text-2xl font-bold tracking-wider text-black">
                    SALES CONTRACT
                  </h1>
                </div>
                
                <div className="w-[231px] flex items-end pb-1">
                  <table className="w-full border-collapse border border-gray-400 text-xs">
                    <tbody>
                      {data.quotationNo && (
                        <tr>
                          <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Ref. No.</td>
                          <td className="border border-gray-400 px-1.5 py-0.5 w-[70%]">{data.quotationNo}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Contract No.</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-bold text-black w-[70%]">{data.contractNo}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5 bg-gray-100 font-semibold whitespace-nowrap w-[30%]">Date</td>
                        <td className="border border-gray-400 px-1.5 py-0.5 font-semibold text-black w-[70%]">
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
              
              <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '2.5px' }}></div>
            </div>

            {/* Contract Parties */}
            <div className="mb-2.5">
              <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-1.5 py-0.5 font-bold border-b border-gray-400 text-[9pt]">
                        SELLER
                      </div>
                      <div className="px-1.5 py-1 space-y-0.5 text-[9pt]">
                        <div><span className="font-semibold">{data.seller.nameEn}</span></div>
                        <div><span className="text-gray-600">Address:</span> {data.seller.addressEn}</div>
                        <div><span className="text-gray-600">Tel:</span> {data.seller.tel}</div>
                        <div><span className="text-gray-600">Email:</span> {data.seller.email}</div>
                      </div>
                    </td>
                    
                    <td className="border border-gray-400 p-0 w-1/2 align-top">
                      <div className="bg-gray-200 px-1.5 py-0.5 font-bold border-b border-gray-400 text-[9pt]">
                        BUYER
                      </div>
                      <div className="px-1.5 py-1 space-y-0.5 text-[9pt]">
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
            <div className="mb-2">
              <h3 className="font-bold text-sm mb-1">ARTICLE 1: PRODUCT DESCRIPTION</h3>
              <table className="w-full border-collapse border-2 border-gray-300 text-[9pt]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-1.5 py-1 text-left w-8">No.</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-left w-20">Model</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-center w-16">Image</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-left">Description / Specification</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-16">Qty</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-20">Unit Price</th>
                    <th className="border border-gray-300 px-1.5 py-1 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.slice(0, firstPageProducts).map((product) => (
                    <tr key={product.no}>
                      <td className="border border-gray-300 px-1.5 py-1 text-center">{product.no}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-[8pt]">{product.modelNo || '-'}</td>
                      <td className="border border-gray-300 px-1 py-1 text-center">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.description}
                            className="w-8 h-8 object-cover mx-auto rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 mx-auto rounded flex items-center justify-center text-[7pt] text-gray-400">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1">
                        <div className="font-semibold text-[9pt]">{product.description}</div>
                        <div className="text-[8pt] text-gray-600">{product.specification}</div>
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">{product.quantity.toLocaleString()}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right">{product.currency} {toSafeNumber(product.unitPrice).toFixed(2)}</td>
                      <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">{product.currency} {toSafeNumber(product.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                  {!needsSecondPage && (
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={6} className="border border-gray-300 px-1.5 py-1.5 text-right text-sm">
                        Total Value ({tradeTerm}):
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-semibold text-sm">
                        {data.terms.currency} {total.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 如果不需要第二页，在第一页显示条款和签名区 */}
            {!needsSecondPage && (
              <>
                {/* Terms and Conditions */}
                <div className="mb-2">
                  <h3 className="font-bold text-sm mb-1">ARTICLE 2: TERMS AND CONDITIONS</h3>
                  <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.1 Trade Terms:</span>
                          <span className="ml-1">{data.terms.tradeTerms}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.2 Payment Terms:</span>
                          <span className="ml-1">{data.terms.paymentTerms}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.3 Delivery Time:</span>
                          <span className="ml-1">{data.terms.deliveryTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.4 Port of Loading:</span>
                          <span className="ml-1">{data.terms.portOfLoading}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.5 Port of Destination:</span>
                          <span className="ml-1">{data.terms.portOfDestination}</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 px-1.5 py-0.5">
                          <span className="font-semibold">2.6 Packing:</span>
                          <span className="ml-1">{data.terms.packing}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Section */}
                <div className="mt-3 pt-2 border-t-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold mb-1 text-[9pt]">SELLER (Company Seal):</h4>
                      <div className="text-[8pt] space-y-1">
                        <p className="font-semibold text-[9pt]">{data.seller.nameEn}</p>
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                          <p className="text-[8pt] text-gray-400">Company Seal</p>
                        </div>
                        <div className="border-b border-gray-400 pb-0.5">
                          <p className="text-[8pt] text-gray-600">Signature: ____________</p>
                        </div>
                        <p className="text-[8pt] text-gray-600">Date: ____________</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 text-[9pt]">BUYER (Company Seal):</h4>
                      <div className="text-[8pt] space-y-1">
                        <p className="font-semibold text-[9pt]">{data.buyer.companyName}</p>
                        <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                          <p className="text-[8pt] text-gray-400">Company Seal</p>
                        </div>
                        <div className="border-b border-gray-400 pb-0.5">
                          <p className="text-[8pt] text-gray-600">Signature: ____________</p>
                        </div>
                        <p className="text-[8pt] text-gray-600">Date: ____________</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Page footer */}
            <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-end items-center text-[7pt] text-gray-500">
              <div>Page 1 of {totalPages}</div>
            </div>
          </div>

          {/* ========== 第二页（仅在需要时显示）========== */}
          {needsSecondPage && (
            <div className="contract-page">
              {/* 续表 */}
              <div className="mb-2.5">
                <h3 className="font-bold text-sm mb-1.5">ARTICLE 1: PRODUCT DESCRIPTION (Continued)</h3>
                <table className="w-full border-collapse border-2 border-gray-300 text-[9pt]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-1.5 py-1 text-left w-8">No.</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-left w-20">Model</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-center w-16">Image</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-left">Description / Specification</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-16">Qty</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-20">Unit Price</th>
                      <th className="border border-gray-300 px-1.5 py-1 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.slice(10).map((product) => (
                      <tr key={product.no}>
                        <td className="border border-gray-300 px-1.5 py-1 text-center">{product.no}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-[8pt]">{product.modelNo || '-'}</td>
                        <td className="border border-gray-300 px-1 py-1 text-center">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.description}
                              className="w-8 h-8 object-cover mx-auto rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 mx-auto rounded flex items-center justify-center text-[7pt] text-gray-400">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-1.5 py-1">
                          <div className="font-semibold text-[9pt]">{product.description}</div>
                          <div className="text-[8pt] text-gray-600">{product.specification}</div>
                        </td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right">{product.quantity.toLocaleString()}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right">{product.currency} {toSafeNumber(product.unitPrice).toFixed(2)}</td>
                        <td className="border border-gray-300 px-1.5 py-1 text-right font-semibold">{product.currency} {toSafeNumber(product.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={6} className="border border-gray-300 px-1.5 py-1.5 text-right text-sm">
                        Total Value ({tradeTerm}):
                      </td>
                      <td className="border border-gray-300 px-1.5 py-1.5 text-right font-semibold text-sm">
                        {data.terms.currency} {total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-2.5">
                <h3 className="font-bold text-sm mb-1">ARTICLE 2: TERMS AND CONDITIONS</h3>
                <table className="w-full border-collapse border border-gray-400 text-[9pt]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.1 Trade Terms:</span>
                        <span className="ml-1">{data.terms.tradeTerms}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.2 Payment Terms:</span>
                        <span className="ml-1">{data.terms.paymentTerms}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.3 Delivery Time:</span>
                        <span className="ml-1">{data.terms.deliveryTime}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.4 Port of Loading:</span>
                        <span className="ml-1">{data.terms.portOfLoading}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.5 Port of Destination:</span>
                        <span className="ml-1">{data.terms.portOfDestination}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 px-1.5 py-0.5">
                        <span className="font-semibold">2.6 Packing:</span>
                        <span className="ml-1">{data.terms.packing}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Section */}
              <div className="mt-4 pt-2 border-t-2 border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold mb-1 text-[9pt]">SELLER (Company Seal):</h4>
                    <div className="text-[8pt] space-y-1">
                      <p className="font-semibold text-[9pt]">{data.seller.nameEn}</p>
                      <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                        <p className="text-[8pt] text-gray-400">Company Seal</p>
                      </div>
                      <div className="border-b border-gray-400 pb-0.5">
                        <p className="text-[8pt] text-gray-600">Signature: ____________</p>
                      </div>
                      <p className="text-[8pt] text-gray-600">Date: ____________</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-[9pt]">BUYER (Company Seal):</h4>
                    <div className="text-[8pt] space-y-1">
                      <p className="font-semibold text-[9pt]">{data.buyer.companyName}</p>
                      <div className="border-2 border-dashed border-gray-300 rounded p-2 bg-gray-50 text-center">
                        <p className="text-[8pt] text-gray-400">Company Seal</p>
                      </div>
                      <div className="border-b border-gray-400 pb-0.5">
                        <p className="text-[8pt] text-gray-600">Signature: ____________</p>
                      </div>
                      <p className="text-[8pt] text-gray-600">Date: ____________</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page footer */}
              <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-end items-center text-[7pt] text-gray-500">
                <div>Page 2 of {totalPages}</div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

SalesContractDocumentPaginated.displayName = 'SalesContractDocumentPaginated';
