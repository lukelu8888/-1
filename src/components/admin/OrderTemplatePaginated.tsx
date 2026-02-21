import React, { forwardRef } from 'react';

interface OrderProduct {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specs: string;
  produced?: number;
}

interface Order {
  orderNumber: string;
  date: string;
  customer: string;
  customerEmail?: string;
  quotationNumber?: string;
  expectedDelivery: string;
  totalAmount: number;
  currency: string;
  products: OrderProduct[];
  paymentTerms: string;
  deliveryTerms: string;
  shippingMethod?: string;
  notes?: string;
}

interface OrderTemplateProps {
  order: Order;
}

/**
 * 🔥 分页版订单模板
 * 
 * 真正的多页面A4显示：
 * - 每页独立的210mm × 297mm容器
 * - 屏幕预览和打印预览都能看到正确的分页
 */
const OrderTemplatePaginated = forwardRef<HTMLDivElement, OrderTemplateProps>(
  ({ order }, ref) => {
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

    // 计算小计
    const subtotal = order.products.reduce((sum, p) => sum + p.totalPrice, 0);
    const tax = 0; // 根据实际需求计算
    const discount = subtotal - order.totalAmount + tax;
    
    // 分页：第一页显示6个产品，后续页面显示剩余产品
    const productsPerFirstPage = 6;
    const firstPageProducts = order.products.slice(0, productsPerFirstPage);
    const remainingProducts = order.products.slice(productsPerFirstPage);
    const totalPages = remainingProducts.length > 0 ? 2 : 1;

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
            
            .order-paginated-container {
              background: white !important;
              padding: 0 !important;
            }
            
            .order-page {
              margin: 0 !important;
              box-shadow: none !important;
              page-break-after: always !important;
            }
            
            .order-page:last-child {
              page-break-after: auto !important;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          @media screen {
            .order-paginated-container {
              background: #525659;
              padding: 40px 20px;
              min-height: 100vh;
            }
            
            .order-page {
              width: 210mm;
              height: 297mm;
              background: white;
              margin: 0 auto 20px auto;
              padding: 20mm;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              box-sizing: border-box;
              font-family: Arial, "Microsoft JhengHei", sans-serif;
              position: relative;
              overflow: hidden;
            }
            
            .order-page:last-child {
              margin-bottom: 40px;
            }
          }
        `}</style>

        <div ref={ref} className="order-paginated-container">
          {/* ========== 第一页 ========== */}
          <div className="order-page">
            {/* 页眉 - 公司信息 */}
            <div className="border-b-2 pb-3 mb-4" style={{ borderColor: '#F96302' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl mb-1" style={{ color: '#F96302' }}>{companyInfo.name}</h1>
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
                  <div className="inline-block text-white px-6 py-2 text-lg" style={{ backgroundColor: '#F96302' }}>
                    訂購單
                  </div>
                  <div className="text-xs mt-2">PURCHASE ORDER</div>
                </div>
              </div>
            </div>

            {/* 订单信息栏 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="border border-gray-300">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-1.5 w-28">訂單編號</td>
                      <td className="px-3 py-1.5 font-semibold">{order.orderNumber}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-1.5">訂單日期</td>
                      <td className="px-3 py-1.5">{order.date}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 px-3 py-1.5">預計交期</td>
                      <td className="px-3 py-1.5">{order.expectedDelivery}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="border border-gray-300">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-1.5 w-28">報價單號碼</td>
                      <td className="px-3 py-1.5">{order.quotationNumber || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-1.5">幣別</td>
                      <td className="px-3 py-1.5">{order.currency}</td>
                    </tr>
                    <tr>
                      <td className="bg-gray-100 px-3 py-1.5">運輸方式</td>
                      <td className="px-3 py-1.5">{order.shippingMethod || 'Sea Freight'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 客户信息 */}
            <div className="border border-gray-300 mb-4">
              <div className="text-white px-3 py-1.5 text-xs" style={{ backgroundColor: '#F96302' }}>客戶資料 Customer Information</div>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-100 px-3 py-1.5 w-28">客戶名稱</td>
                    <td className="px-3 py-1.5">{order.customer}</td>
                    <td className="bg-gray-100 px-3 py-1.5 w-28">聯絡Email</td>
                    <td className="px-3 py-1.5">{order.customerEmail || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 产品明细 - 第一页 */}
            <div className="border border-gray-300 mb-4">
              <div className="text-white px-3 py-1.5 text-xs" style={{ backgroundColor: '#F96302' }}>產品明細 Product Details</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    <th className="px-3 py-2 text-left w-12">項次</th>
                    <th className="px-3 py-2 text-left">產品名稱</th>
                    <th className="px-3 py-2 text-left">規格說明</th>
                    <th className="px-3 py-2 text-right w-24">訂購數量</th>
                    <th className="px-3 py-2 text-right w-28">單價</th>
                    <th className="px-3 py-2 text-right w-32">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {firstPageProducts.map((product, index) => (
                    <tr key={index} className="border-b border-gray-300">
                      <td className="px-3 py-2 text-center">{index + 1}</td>
                      <td className="px-3 py-2">{product.name}</td>
                      <td className="px-3 py-2 text-gray-600">{product.specs}</td>
                      <td className="px-3 py-2 text-right">{product.quantity.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right">{order.currency} {product.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{order.currency} {product.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                  {remainingProducts.length > 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-center italic text-gray-500">
                        ... 續下頁 ...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 如果只有一页，显示合计和条款 */}
            {totalPages === 1 && (
              <>
                {/* 金额汇总 */}
                <div className="border border-gray-300 mb-4">
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-100 px-3 py-2 text-right w-3/4">小計 Subtotal</td>
                        <td className="px-3 py-2 text-right font-semibold">{order.currency} {subtotal.toFixed(2)}</td>
                      </tr>
                      {discount > 0 && (
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-100 px-3 py-2 text-right">折扣 Discount</td>
                          <td className="px-3 py-2 text-right text-red-600">-{order.currency} {discount.toFixed(2)}</td>
                        </tr>
                      )}
                      {tax > 0 && (
                        <tr className="border-b border-gray-300">
                          <td className="bg-gray-100 px-3 py-2 text-right">稅額 Tax</td>
                          <td className="px-3 py-2 text-right">{order.currency} {tax.toFixed(2)}</td>
                        </tr>
                      )}
                      <tr style={{ backgroundColor: '#FFF4EC' }}>
                        <td className="px-3 py-2 text-right text-base">總計 Total Amount</td>
                        <td className="px-3 py-2 text-right text-base font-bold" style={{ color: '#F96302' }}>{order.currency} {order.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 付款和交货条款 */}
                <div className="border border-gray-300 mb-4">
                  <div className="text-white px-3 py-1.5 text-xs" style={{ backgroundColor: '#F96302' }}>付款及交貨條款 Payment & Delivery Terms</div>
                  <table className="w-full text-xs">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-100 px-3 py-2 w-32">付款條件</td>
                        <td className="px-3 py-2">{order.paymentTerms}</td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-100 px-3 py-2">交貨條件</td>
                        <td className="px-3 py-2">{order.deliveryTerms}</td>
                      </tr>
                      {order.notes && (
                        <tr>
                          <td className="bg-gray-100 px-3 py-2">備註</td>
                          <td className="px-3 py-2">{order.notes}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 签章区 */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
                  <div>
                    <p className="text-xs mb-2">採購方（蓋章）：</p>
                    <div className="border-2 border-dashed border-gray-300 h-20 flex items-center justify-center text-gray-400 text-xs">
                      公司印章
                    </div>
                  </div>
                  <div>
                    <p className="text-xs mb-2">供應商（蓋章）：</p>
                    <div className="border-2 border-dashed border-gray-300 h-20 flex items-center justify-center text-gray-400 text-xs">
                      公司印章
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 页脚 */}
            <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-between items-center text-[8pt] text-gray-500">
              <div>本訂購單為電腦列印文件，經雙方簽章確認後生效</div>
              <div>第 1 頁 / 共 {totalPages} 頁</div>
            </div>
          </div>

          {/* ========== 第二页（如果有） ========== */}
          {remainingProducts.length > 0 && (
            <div className="order-page">
              {/* 续表 */}
              <div className="border border-gray-300 mb-4">
                <div className="text-white px-3 py-1.5 text-xs" style={{ backgroundColor: '#F96302' }}>產品明細（續）Product Details (Continued)</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="px-3 py-2 text-left w-12">項次</th>
                      <th className="px-3 py-2 text-left">產品名稱</th>
                      <th className="px-3 py-2 text-left">規格說明</th>
                      <th className="px-3 py-2 text-right w-24">訂購數量</th>
                      <th className="px-3 py-2 text-right w-28">單價</th>
                      <th className="px-3 py-2 text-right w-32">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="px-3 py-2 text-center">{productsPerFirstPage + index + 1}</td>
                        <td className="px-3 py-2">{product.name}</td>
                        <td className="px-3 py-2 text-gray-600">{product.specs}</td>
                        <td className="px-3 py-2 text-right">{product.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{order.currency} {product.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{order.currency} {product.totalPrice.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 金额汇总 */}
              <div className="border border-gray-300 mb-4">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-2 text-right w-3/4">小計 Subtotal</td>
                      <td className="px-3 py-2 text-right font-semibold">{order.currency} {subtotal.toFixed(2)}</td>
                    </tr>
                    {discount > 0 && (
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-100 px-3 py-2 text-right">折扣 Discount</td>
                        <td className="px-3 py-2 text-right text-red-600">-{order.currency} {discount.toFixed(2)}</td>
                      </tr>
                    )}
                    {tax > 0 && (
                      <tr className="border-b border-gray-300">
                        <td className="bg-gray-100 px-3 py-2 text-right">稅額 Tax</td>
                        <td className="px-3 py-2 text-right">{order.currency} {tax.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: '#FFF4EC' }}>
                      <td className="px-3 py-2 text-right text-base">總計 Total Amount</td>
                      <td className="px-3 py-2 text-right text-base font-bold" style={{ color: '#F96302' }}>{order.currency} {order.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 付款和交货条款 */}
              <div className="border border-gray-300 mb-4">
                <div className="text-white px-3 py-1.5 text-xs" style={{ backgroundColor: '#F96302' }}>付款及交貨條款 Payment & Delivery Terms</div>
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-2 w-32">付款條件</td>
                      <td className="px-3 py-2">{order.paymentTerms}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="bg-gray-100 px-3 py-2">交貨條件</td>
                      <td className="px-3 py-2">{order.deliveryTerms}</td>
                    </tr>
                    {order.notes && (
                      <tr>
                        <td className="bg-gray-100 px-3 py-2">備註</td>
                        <td className="px-3 py-2">{order.notes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 签章区 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
                <div>
                  <p className="text-xs mb-2">採購方（蓋章）：</p>
                  <div className="border-2 border-dashed border-gray-300 h-20 flex items-center justify-center text-gray-400 text-xs">
                    公司印章
                  </div>
                </div>
                <div>
                  <p className="text-xs mb-2">供應商（蓋章）：</p>
                  <div className="border-2 border-dashed border-gray-300 h-20 flex items-center justify-center text-gray-400 text-xs">
                    公司印章
                  </div>
                </div>
              </div>

              {/* 页脚 */}
              <div className="absolute bottom-3 left-0 right-0 px-[20mm] flex justify-between items-center text-[8pt] text-gray-500">
                <div>本訂購單為電腦列印文件，經雙方簽章確認後生效</div>
                <div>第 2 頁 / 共 {totalPages} 頁</div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
);

OrderTemplatePaginated.displayName = 'OrderTemplatePaginated';

export default OrderTemplatePaginated;
