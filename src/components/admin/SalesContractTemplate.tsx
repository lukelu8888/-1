import React from 'react';
import { format } from 'date-fns';

interface SalesContractTemplateProps {
  order: {
    orderNumber: string;
    customer: string;
    customerEmail?: string;
    date: string;
    expectedDelivery: string;
    totalAmount: number;
    currency: string;
    products: {
      name: string;
      quantity: number;
      unitPrice?: number;
      totalPrice?: number;
      specs?: string;
    }[];
    paymentTerms?: string;
    deliveryTerms?: string;
    shippingMethod?: string;
    quotationNumber?: string;
    // 🔥 新增收款账户和付款信息
    bankAccount?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      swiftCode: string;
      bankAddress: string;
    };
    depositAmount?: number; // 定金金额
    balanceAmount?: number; // 余款金额
    depositPercentage?: number; // 定金百分比 (默认30)
    balancePercentage?: number; // 余款百分比 (默认70)
  };
}

export const SalesContractTemplate = React.forwardRef<HTMLDivElement, SalesContractTemplateProps>(
  ({ order }, ref) => {
    // 生成合同编号（基于订单编号）
    const contractNumber = `SC-${order.orderNumber.replace('ORD-', '')}`;
    
    // 计算小计
    const subtotal = order.products.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    
    // 🔥 计算定金和余款（如果未提供）
    const depositPercentage = order.depositPercentage || 30;
    const balancePercentage = order.balancePercentage || 70;
    const depositAmount = order.depositAmount || (order.totalAmount * depositPercentage / 100);
    const balanceAmount = order.balanceAmount || (order.totalAmount * balancePercentage / 100);
    
    // 🔥 默认银行账户信息（如果未提供）
    const defaultBankAccount = {
      bankName: 'Bank of China, Fuzhou Branch 中国银行福州分行',
      accountName: 'Fujian Cosun Dafu Building Materials Co., Ltd. 福建高盛达富建材有限公司',
      accountNumber: '1234 5678 9012 3456',
      swiftCode: 'BKCHCNBJ950',
      bankAddress: 'No. 123 Wuyi Road, Fuzhou, Fujian Province, China'
    };
    
    const bankAccount = order.bankAccount || defaultBankAccount;

    return (
      <div
        ref={ref}
        className="cosun-a4-page print:shadow-none"
        style={{
          padding: '12mm', // 统一页边距12mm
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
          color: '#000',
          lineHeight: '1.5',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '15px', borderBottom: '3px solid #F96302', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: '1' }}>
              <h1 style={{ fontSize: '20pt', fontWeight: 'bold', color: '#F96302', margin: '0 0 4px 0', lineHeight: '1.2' }}>
                高盛达富 COSUN
              </h1>
              <p style={{ fontSize: '8pt', color: '#666', margin: '0 0 2px 0', lineHeight: '1.3' }}>
                福建高盛达富建材有限公司
              </p>
              <p style={{ fontSize: '8pt', color: '#666', margin: '0 0 4px 0', lineHeight: '1.3' }}>
                Fujian Cosun Dafu Building Materials Co., Ltd.
              </p>
              <p style={{ fontSize: '7.5pt', color: '#666', margin: 0, lineHeight: '1.4' }}>
                Add: Fujian Province, China<br />
                Tel: +86-591-8888-8888 | Email: export@cosun.com<br />
                Web: www.cosun.com
              </p>
            </div>
            <div style={{ textAlign: 'right', flex: '1' }}>
              <h2 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 4px 0', color: '#F96302', lineHeight: '1.2' }}>
                SALES CONTRACT
              </h2>
              <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 8px 0', color: '#F96302', lineHeight: '1.2' }}>
                销售合同
              </h3>
              <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.3' }}>
                <strong>Contract No 合同号:</strong> {contractNumber}
              </p>
              <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.3' }}>
                <strong>Date 日期:</strong> {order.date}
              </p>
              {order.quotationNumber && (
                <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.3' }}>
                  <strong>Ref. Quotation 报价号:</strong> {order.quotationNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Parties Information */}
        <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Seller */}
          <div style={{ border: '2px solid #F96302', borderRadius: '3px', padding: '10px', backgroundColor: '#FFF5F0' }}>
            <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', color: '#F96302', lineHeight: '1.2' }}>
              卖方 SELLER:
            </h3>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Company 公司名称:</strong>
            </p>
            <p style={{ fontSize: '8pt', margin: '0 0 4px 10px', lineHeight: '1.4' }}>
              福建高盛达富建材有限公司<br />
              Fujian Cosun Dafu Building Materials Co., Ltd.
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Address 地址:</strong> Fujian Province, China
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Tel 电话:</strong> +86-591-8888-8888
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Email 邮箱:</strong> export@cosun.com
            </p>
          </div>

          {/* Buyer */}
          <div style={{ border: '2px solid #10b981', borderRadius: '3px', padding: '10px', backgroundColor: '#F0FDF4' }}>
            <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', color: '#10b981', lineHeight: '1.2' }}>
              买方 BUYER:
            </h3>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Company 公司名称:</strong> {order.customer}
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Email 邮箱:</strong> {order.customerEmail || 'N/A'}
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Order No. 订单编号:</strong> {order.orderNumber}
            </p>
            <p style={{ fontSize: '8.5pt', margin: '2px 0', lineHeight: '1.4' }}>
              <strong>Order Date 下单日期:</strong> {order.date}
            </p>
          </div>
        </div>

        {/* Article 1: Product Details */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第一条 产品明细 ARTICLE 1: PRODUCT DETAILS
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt', marginTop: '6px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F96302', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '6px 4px', textAlign: 'center', width: '5%', lineHeight: '1.3' }}>
                  序号<br />No.
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 4px', textAlign: 'left', width: '40%', lineHeight: '1.3' }}>
                  产品名称及规格<br />Product Name & Specifications
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 4px', textAlign: 'center', width: '15%', lineHeight: '1.3' }}>
                  数量<br />Quantity (pcs)
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 4px', textAlign: 'right', width: '15%', lineHeight: '1.3' }}>
                  单价<br />Unit Price
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 4px', textAlign: 'right', width: '20%', lineHeight: '1.3' }}>
                  金额<br />Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {order.products.map((product, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '5px 4px', textAlign: 'center', lineHeight: '1.3' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 4px', lineHeight: '1.4' }}>
                    <strong>{product.name}</strong>
                    {product.specs && (
                      <span style={{ display: 'block', fontSize: '7pt', color: '#666', marginTop: '2px' }}>
                        {product.specs}
                      </span>
                    )}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 4px', textAlign: 'center', lineHeight: '1.3' }}>
                    {product.quantity.toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 4px', textAlign: 'right', lineHeight: '1.3' }}>
                    {product.unitPrice ? `${order.currency} ${product.unitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '5px 4px', textAlign: 'right', lineHeight: '1.3' }}>
                    {product.totalPrice 
                      ? `${order.currency} ${product.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#FFF5F0', fontWeight: 'bold' }}>
                <td colSpan={4} style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right', fontSize: '9pt', lineHeight: '1.3' }}>
                  总计 TOTAL AMOUNT:
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right', fontSize: '9.5pt', color: '#F96302', lineHeight: '1.3' }}>
                  {order.currency} {order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Article 2: Payment Terms */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第二条 付款条款 ARTICLE 2: PAYMENT TERMS
          </h3>
          
          {/* 🔥 第一框：付款条件和付款金额 */}
          <div style={{ border: '1px solid #ddd', padding: '8px', fontSize: '8pt', backgroundColor: '#f9fafb', lineHeight: '1.5', marginBottom: '8px' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>Payment Terms 付款方式:</strong> {order.paymentTerms || '30% T/T deposit, 70% balance before shipment'}
            </p>
            <p style={{ margin: '4px 0 8px 0', color: '#666', fontSize: '7.5pt' }}>
              预付30%电汇定金，发货前支付70%尾款。
            </p>
            
            {/* 付款金额明细 */}
            {depositAmount !== undefined && balanceAmount !== undefined && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ddd' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '8.5pt', fontWeight: 'bold', color: '#F96302' }}>
                  Payment Amount Details 付款金额明细:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ backgroundColor: '#FFF5F0', padding: '6px', borderRadius: '2px', border: '1px solid #F96302' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#666' }}>
                      Deposit 定金 ({depositPercentage}%)
                    </p>
                    <p style={{ margin: 0, fontSize: '9.5pt', fontWeight: 'bold', color: '#F96302' }}>
                      {order.currency} {depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div style={{ backgroundColor: '#FFF5F0', padding: '6px', borderRadius: '2px', border: '1px solid #F96302' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#666' }}>
                      Balance 余款 ({balancePercentage}%)
                    </p>
                    <p style={{ margin: 0, fontSize: '9.5pt', fontWeight: 'bold', color: '#F96302' }}>
                      {order.currency} {balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 🔥 第二框：银行账户信息 */}
          {bankAccount && (
            <div style={{ border: '1px solid #10b981', padding: '8px', fontSize: '8pt', backgroundColor: '#F0FDF4', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '8.5pt', fontWeight: 'bold', color: '#10b981' }}>
                Bank Account Information 收款账户信息:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#059669', fontWeight: 'bold' }}>
                    Bank Name 银行名称:
                  </p>
                  <p style={{ margin: '0 0 6px 0', color: '#666', fontSize: '7.5pt' }}>
                    {bankAccount.bankName}
                  </p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#059669', fontWeight: 'bold' }}>
                    Swift Code SWIFT代码:
                  </p>
                  <p style={{ margin: '0 0 6px 0', color: '#666', fontSize: '7.5pt' }}>
                    {bankAccount.swiftCode}
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#059669', fontWeight: 'bold' }}>
                    Account Name 账户名称:
                  </p>
                  <p style={{ margin: '0 0 6px 0', color: '#666', fontSize: '7.5pt' }}>
                    {bankAccount.accountName}
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#059669', fontWeight: 'bold' }}>
                    Account Number 账户号码:
                  </p>
                  <p style={{ margin: '0 0 6px 0', color: '#666', fontSize: '7.5pt', fontWeight: 'bold' }}>
                    {bankAccount.accountNumber}
                  </p>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{ margin: '0 0 2px 0', fontSize: '7pt', color: '#059669', fontWeight: 'bold' }}>
                    Bank Address 银行地址:
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '7.5pt' }}>
                    {bankAccount.bankAddress}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Article 3: Delivery Terms */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第三条 交货条款 ARTICLE 3: DELIVERY TERMS
          </h3>
          <div style={{ border: '1px solid #ddd', padding: '8px', fontSize: '8pt', backgroundColor: '#f9fafb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', lineHeight: '1.4' }}>
                  <strong>Delivery Date 交货日期:</strong>
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '7.5pt' }}>{order.expectedDelivery}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', lineHeight: '1.4' }}>
                  <strong>Shipping Method 运输方式:</strong>
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '7.5pt' }}>{order.shippingMethod || 'Sea Freight 海运'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ margin: '0 0 2px 0', lineHeight: '1.4' }}>
                  <strong>Delivery Terms 贸易术语:</strong>
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '7.5pt' }}>{order.deliveryTerms || 'FOB Fuzhou, China (福州FOB)'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Article 4: Quality Assurance */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第四条 质量保证 ARTICLE 4: QUALITY ASSURANCE
          </h3>
          <div style={{ border: '1px solid #ddd', padding: '8px', fontSize: '8pt', backgroundColor: '#f9fafb', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              The products shall comply with international quality standards and the specifications agreed upon in this contract.
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '7.5pt' }}>
              产品应符合国际质量标准及本合同约定的规格要求。
            </p>
          </div>
        </div>

        {/* Article 5: Warranty Terms */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第五条 质保条款 ARTICLE 5: WARRANTY TERMS
          </h3>
          <div style={{ border: '1px solid #ddd', padding: '8px', fontSize: '8pt', backgroundColor: '#f9fafb', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>Warranty Period 质保期:</strong> 12-month warranty from date of shipment
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '7.5pt' }}>
              自发货之日起12个月质保期。质保期内如有质量问题，卖方负责免费维修或更换。
            </p>
          </div>
        </div>

        {/* Article 6: Breach of Contract */}
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 6px 0', backgroundColor: '#F96302', color: 'white', padding: '5px 8px', borderRadius: '2px', lineHeight: '1.2' }}>
            第六条 违约责任 ARTICLE 6: BREACH OF CONTRACT
          </h3>
          <div style={{ border: '1px solid #ddd', padding: '8px', fontSize: '8pt', backgroundColor: '#f9fafb', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 4px 0' }}>
              If either party fails to fulfill its obligations under this contract, the defaulting party shall compensate the other party for losses incurred.
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '7.5pt' }}>
              如任何一方未能履行本合同义务，违约方应赔偿对方因此遭受的损失。
            </p>
          </div>
        </div>

        {/* Signature Section */}
        <div className="avoid-break" style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
          <div style={{ width: '48%', border: '1px solid #ddd', padding: '10px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <h4 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 8px 0', color: '#F96302', lineHeight: '1.2' }}>
              卖方签字 SELLER'S SIGNATURE
            </h4>
            <p style={{ fontSize: '8pt', margin: '0 0 25px 0', lineHeight: '1.3' }}>
              <strong>Authorized Signature 授权签字:</strong>
            </p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '8px' }}>
              <p style={{ fontSize: '7.5pt', margin: '0 0 1px 0', lineHeight: '1.3' }}>福建高盛达富建材有限公司</p>
              <p style={{ fontSize: '7.5pt', margin: 0, lineHeight: '1.3' }}>Fujian Cosun Dafu Building Materials Co., Ltd.</p>
              <p style={{ fontSize: '8pt', margin: '8px 0 0 0', lineHeight: '1.3' }}>
                <strong>Date 日期:</strong> __________________
              </p>
            </div>
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '7pt', color: '#666', margin: 0 }}>(Company Seal 公司盖章)</p>
            </div>
          </div>

          <div style={{ width: '48%', border: '1px solid #ddd', padding: '10px', borderRadius: '3px', backgroundColor: '#fafafa' }}>
            <h4 style={{ fontSize: '9pt', fontWeight: 'bold', margin: '0 0 8px 0', color: '#10b981', lineHeight: '1.2' }}>
              买方签字 BUYER'S SIGNATURE
            </h4>
            <p style={{ fontSize: '8pt', margin: '0 0 25px 0', lineHeight: '1.3' }}>
              <strong>Authorized Signature 授权签字:</strong>
            </p>
            <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '8px' }}>
              <p style={{ fontSize: '7.5pt', margin: 0, lineHeight: '1.3' }}>{order.customer}</p>
              <p style={{ fontSize: '8pt', margin: '8px 0 0 0', lineHeight: '1.3' }}>
                <strong>Date 日期:</strong> __________________
              </p>
            </div>
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '7pt', color: '#666', margin: 0 }}>(Company Seal 公司盖章)</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '15px', paddingTop: '8px', borderTop: '2px solid #F96302', textAlign: 'center', fontSize: '7pt', color: '#666', lineHeight: '1.4' }}>
          <p style={{ margin: 0 }}>
            本合同一式两份，买卖双方各执一份，具有同等法律效力。
          </p>
          <p style={{ margin: '2px 0 0 0' }}>
            This contract is made in duplicate, one for each party, and both copies have equal legal effect.
          </p>
          <p style={{ margin: '6px 0 0 0', fontWeight: 'bold', color: '#F96302', fontSize: '7.5pt' }}>
            福建高盛达富建材有限公司 Fujian Cosun Dafu Building Materials Co., Ltd. | 20 Years of Excellence in Building Materials
          </p>
        </div>
      </div>
    );
  }
);

SalesContractTemplate.displayName = 'SalesContractTemplate';