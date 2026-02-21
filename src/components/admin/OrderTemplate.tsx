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

// 台湾大厂风格的正式订单模板
const OrderTemplate = forwardRef<HTMLDivElement, OrderTemplateProps>(
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

    return (
      <div ref={ref} className="bg-white p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, "Microsoft JhengHei", sans-serif' }}>
        {/* 页眉 - 公司信息 */}
        <div className="border-b-2 border-green-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl mb-1" style={{ color: '#059669' }}>{companyInfo.name}</h1>
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
              <div className="inline-block bg-green-600 text-white px-6 py-2 text-lg">
                訂購單
              </div>
              <div className="text-xs mt-2">PURCHASE ORDER</div>
            </div>
          </div>
        </div>

        {/* 订单信息栏 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="bg-gray-100 px-3 py-1.5 w-28">訂單編號</td>
                  <td className="px-3 py-1.5">{order.orderNumber}</td>
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
        <div className="border border-gray-300 mb-6">
          <div className="bg-green-600 text-white px-3 py-1.5 text-xs">客戶資料 Customer Information</div>
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

        {/* 产品明细 */}
        <div className="border border-gray-300 mb-6">
          <div className="bg-green-600 text-white px-3 py-1.5 text-xs">產品明細 Product Details</div>
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
              {order.products.map((product, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="px-3 py-2 text-center">{index + 1}</td>
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
                  <td className="bg-gray-100 px-3 py-1.5 text-right">小計</td>
                  <td className="px-3 py-1.5 text-right w-32">{order.currency} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                {discount > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-100 px-3 py-1.5 text-right">折扣</td>
                    <td className="px-3 py-1.5 text-right text-red-600">- {order.currency} {discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                {tax > 0 && (
                  <tr className="border-b border-gray-300">
                    <td className="bg-gray-100 px-3 py-1.5 text-right">稅金</td>
                    <td className="px-3 py-1.5 text-right">{order.currency} {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                )}
                <tr className="bg-green-50">
                  <td className="bg-green-100 px-3 py-2 text-right">訂單總額</td>
                  <td className="px-3 py-2 text-right text-green-600" style={{ fontSize: '14px' }}>{order.currency} {order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 交易条款 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-300">
            <div className="bg-gray-100 px-3 py-1.5 text-xs">付款條件 Payment Terms</div>
            <div className="px-3 py-2 text-xs min-h-[60px]">{order.paymentTerms}</div>
          </div>
          <div className="border border-gray-300">
            <div className="bg-gray-100 px-3 py-1.5 text-xs">交貨條件 Delivery Terms</div>
            <div className="px-3 py-2 text-xs min-h-[60px]">{order.deliveryTerms}</div>
          </div>
        </div>

        {/* 备注 */}
        {order.notes && (
          <div className="border border-gray-300 mb-6">
            <div className="bg-gray-100 px-3 py-1.5 text-xs">備註 Notes</div>
            <div className="px-3 py-2 text-xs min-h-[40px]">{order.notes}</div>
          </div>
        )}

        {/* 重要提示 */}
        <div className="border border-orange-300 bg-orange-50 p-3 mb-6">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-orange-800">重要事項 Important Notes:</p>
            <p className="text-gray-700">1. 本訂單一經確認，不得隨意更改或取消</p>
            <p className="text-gray-700">2. 交期以本公司回覆確認函為準</p>
            <p className="text-gray-700">3. 如需變更訂單內容，請於生產前7個工作天提出</p>
            <p className="text-gray-700">4. 付款條件以本訂單所載為準，逾期付款將影響交期</p>
          </div>
        </div>

        {/* 签章区 */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="border border-gray-300 p-4">
            <div className="text-xs mb-8">客戶簽章確認 Customer Signature:</div>
            <div className="flex justify-between items-end">
              <div className="text-xs">簽名: _________________</div>
              <div className="text-xs">日期: _________________</div>
            </div>
          </div>
          <div className="border border-gray-300 p-4">
            <div className="text-xs mb-8">公司授權代表 Authorized By:</div>
            <div className="flex justify-between items-end">
              <div className="text-xs">簽名: _________________</div>
              <div className="text-xs">日期: _________________</div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="border-t border-gray-300 pt-3 text-center text-xs text-gray-500">
          <p>本訂購單為電腦列印文件，經雙方簽章確認後生效</p>
          <p className="mt-1">This purchase order is computer generated and valid only with both parties' signatures</p>
        </div>
      </div>
    );
  }
);

OrderTemplate.displayName = 'OrderTemplate';

export default OrderTemplate;
