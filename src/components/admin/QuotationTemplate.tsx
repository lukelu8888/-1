import React, { forwardRef } from 'react';
import { Quotation } from './QuotationManagement';

interface QuotationTemplateProps {
  quotation: Quotation;
}

// 台湾大厂风格的正式报价单模板
const QuotationTemplate = forwardRef<HTMLDivElement, QuotationTemplateProps>(
  ({ quotation }, ref) => {
    const companyInfo = {
      name: '福建高盛达富建材有限公司',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      taxId: '91350000MA2XXXXXXX',
      address: '福建省福州市仓山区建新镇XX工业区XX号',
      addressEn: 'XX Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      fax: '+86-591-8888-8889',
      email: 'sales@gaoshengdafu.com',
      website: 'www.gaoshengdafu.com'
    };

    return (
      <div 
        ref={ref} 
        className="bg-white mx-auto" 
        style={{ 
          fontFamily: 'Arial, "Microsoft JhengHei", sans-serif',
          width: '194mm',
          maxWidth: '194mm',
          padding: '8mm',
          boxSizing: 'border-box'
        }}
      >
        {/* 页眉 - 公司信息 */}
        <div className="border-b-2 border-blue-600 pb-3 mb-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl mb-1" style={{ color: '#1e40af' }}>{companyInfo.name}</h1>
              <p className="text-sm text-gray-600 mb-2">{companyInfo.nameEn}</p>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p>統一編號: {companyInfo.taxId}</p>
                <p>地址: {companyInfo.address}</p>
                <p>Address: {companyInfo.addressEn}</p>
                <p>Tel: {companyInfo.tel} | Fax: {companyInfo.fax}</p>
                <p>Email: {companyInfo.email} | Web: {companyInfo.website}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block bg-blue-600 text-white px-6 py-2 text-lg">
                報價單
              </div>
              <div className="text-xs mt-2">QUOTATION</div>
            </div>
          </div>
        </div>

        {/* 报价单信息栏 */}
        <div className="grid grid-cols-2 gap-4 mb-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="border border-gray-300">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5 w-32">
                    <div>報價單號碼</div>
                    <div className="text-[10px] text-gray-500">Quotation No.</div>
                  </td>
                  <td className="px-3 py-1.5">{quotation.quotationNumber}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5">
                    <div>報價日期</div>
                    <div className="text-[10px] text-gray-500">Quote Date</div>
                  </td>
                  <td className="px-3 py-1.5">{quotation.quotationDate}</td>
                </tr>
                <tr>
                  <td className="bg-gray-100 px-3 py-1.5">
                    <div>有效期限</div>
                    <div className="text-[10px] text-gray-500">Valid Until</div>
                  </td>
                  <td className="px-3 py-1.5">{quotation.validUntil}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="border border-gray-300">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5 w-32">
                    <div>詢價單號碼</div>
                    <div className="text-[10px] text-gray-500">RFQ No.</div>
                  </td>
                  <td className="px-3 py-1.5">{quotation.inquiryNumber}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5">
                    <div>幣別</div>
                    <div className="text-[10px] text-gray-500">Currency</div>
                  </td>
                  <td className="px-3 py-1.5">{quotation.currency}</td>
                </tr>
                <tr>
                  <td className="bg-gray-100 px-3 py-1.5">
                    <div>業務負責</div>
                    <div className="text-[10px] text-gray-500">Sales Rep.</div>
                  </td>
                  <td className="px-3 py-1.5">Sales Department</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 客户信息 */}
        <div className="border border-gray-300 mb-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="bg-blue-600 text-white px-3 py-1.5 text-xs">客戶資料 Customer Information</div>
          <table className="w-full text-xs">
            <tbody>
              <tr className="border-b border-gray-300">
                <td className="bg-gray-100 px-3 py-1.5 w-32">
                  <div>客戶名稱</div>
                  <div className="text-[10px] text-gray-500">Customer Name</div>
                </td>
                <td className="px-3 py-1.5">{quotation.customerName}</td>
                <td className="bg-gray-100 px-3 py-1.5 w-32">
                  <div>聯絡Email</div>
                  <div className="text-[10px] text-gray-500">Contact Email</div>
                </td>
                <td className="px-3 py-1.5">{quotation.customerEmail}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 产品明细 */}
        <div className="border border-gray-300 mb-6">
          <div className="bg-blue-600 text-white px-3 py-1.5 text-xs">產品明細 Product Details</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="px-3 py-2 text-left w-12">
                  <div>項次</div>
                  <div className="text-[10px] text-gray-500">No.</div>
                </th>
                <th className="px-3 py-2 text-left w-16">
                  <div>圖片</div>
                  <div className="text-[10px] text-gray-500">Image</div>
                </th>
                <th className="px-3 py-2 text-left">
                  <div>產品名稱</div>
                  <div className="text-[10px] text-gray-500">Product Name</div>
                </th>
                <th className="px-3 py-2 text-left">
                  <div>規格說明</div>
                  <div className="text-[10px] text-gray-500">Specifications</div>
                </th>
                <th className="px-3 py-2 text-right w-24">
                  <div>數量</div>
                  <div className="text-[10px] text-gray-500">Qty</div>
                </th>
                <th className="px-3 py-2 text-right w-28">
                  <div>單價</div>
                  <div className="text-[10px] text-gray-500">Unit Price</div>
                </th>
                <th className="px-3 py-2 text-right w-32">
                  <div>金額</div>
                  <div className="text-[10px] text-gray-500">Amount</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {quotation.products.map((product, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="px-3 py-2 text-center">{index + 1}</td>
                  <td className="px-3 py-2">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-12 h-12 object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-[8px]">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2 text-gray-600">{product.specs}</td>
                  <td className="px-3 py-2 text-right">{product.quantity.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{product.unitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{product.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 金额汇总 */}
        <div className="flex justify-end mb-6">
          <div className="w-80 border border-gray-300">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5 text-right">
                    <div>小計</div>
                    <div className="text-[10px] text-gray-500">Subtotal</div>
                  </td>
                  <td className="px-3 py-1.5 text-right w-32">{quotation.currency} {quotation.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                {quotation.discount > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-100 px-3 py-1.5 text-right">
                      <div>折扣</div>
                      <div className="text-[10px] text-gray-500">Discount</div>
                    </td>
                    <td className="px-3 py-1.5 text-right text-red-600">- {quotation.currency} {quotation.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                {quotation.tax > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-100 px-3 py-1.5 text-right">
                      <div>稅金</div>
                      <div className="text-[10px] text-gray-500">Tax</div>
                    </td>
                    <td className="px-3 py-1.5 text-right">{quotation.currency} {quotation.tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="bg-blue-50">
                  <td className="bg-blue-100 px-3 py-2 text-right">
                    <div>報價總額</div>
                    <div className="text-[10px] text-gray-500">Total Amount</div>
                  </td>
                  <td className="px-3 py-2 text-right text-blue-600" style={{ fontSize: '14px' }}>{quotation.currency} {quotation.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 交易条款 */}
        <div className="grid grid-cols-2 gap-4 mb-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="border border-gray-300">
            <div className="bg-gray-100 px-3 py-1.5 text-xs">付款條件 Payment Terms</div>
            <div className="px-3 py-2 text-xs min-h-[60px]">{quotation.paymentTerms}</div>
          </div>
          <div className="border border-gray-300">
            <div className="bg-gray-100 px-3 py-1.5 text-xs">交貨條件 Delivery Terms</div>
            <div className="px-3 py-2 text-xs min-h-[60px]">{quotation.deliveryTerms}</div>
          </div>
        </div>

        {/* 备注 */}
        {quotation.notes && (
          <div className="border border-gray-300 mb-4" style={{ pageBreakInside: 'avoid' }}>
            <div className="bg-gray-100 px-3 py-1.5 text-xs">備註 Notes</div>
            <div className="px-3 py-2 text-xs min-h-[40px]">{quotation.notes}</div>
          </div>
        )}

        {/* 签章区 */}
        <div className="grid grid-cols-2 gap-8 mb-4" style={{ pageBreakInside: 'avoid' }}>
          <div className="border border-gray-300 p-4">
            <div className="text-xs mb-8">製單人員 Prepared By:</div>
            <div className="flex justify-between items-end">
              <div className="text-xs">
                <div>簽名 Signature:</div>
                <div className="mt-2">_________________</div>
              </div>
              <div className="text-xs">
                <div>日期 Date:</div>
                <div className="mt-2">_________________</div>
              </div>
            </div>
          </div>
          <div className="border border-gray-300 p-4">
            <div className="text-xs mb-8">核准主管 Approved By:</div>
            <div className="flex justify-between items-end">
              <div className="text-xs">
                <div>簽名 Signature:</div>
                <div className="mt-2">_________________</div>
              </div>
              <div className="text-xs">
                <div>日期 Date:</div>
                <div className="mt-2">_________________</div>
              </div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-500">
          <p>本報價單為電腦列印文件，如有塗改或未蓋公司印章恕不生效</p>
          <p className="mt-1">This quotation is computer generated and valid only with company seal</p>
        </div>
      </div>
    );
  }
);

QuotationTemplate.displayName = 'QuotationTemplate';

export default QuotationTemplate;