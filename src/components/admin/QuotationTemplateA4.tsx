import React, { forwardRef } from 'react';
import { Quotation } from './QuotationManagement';
import CosunA4Template, { 
  CosunFormHeader, 
  CosunFormTable, 
  CosunFormInfoRow,
  CosunSignatureArea,
  CosunFormFooter 
} from '../forms/CosunA4Template';

interface QuotationTemplateProps {
  quotation: Quotation;
}

/**
 * THE COSUN BM 报价单模板 - A4标准版本
 * 
 * 特点：
 * 1. 严格遵循A4标准尺寸（210mm x 297mm）
 * 2. 使用COSUN橙色主题（#F96302）
 * 3. 屏幕预览和打印都完美适配
 * 4. 支持分页避免内容被切断
 */
const QuotationTemplateA4 = forwardRef<HTMLDivElement, QuotationTemplateProps>(
  ({ quotation }, ref) => {
    const companyInfo = {
      name: 'THE COSUN BM',
      nameEn: 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      taxId: '91350000MA2XXXXXXX',
      address: '福建省福州市仓山区建新镇XX工业区XX号',
      addressEn: 'XX Industrial Zone, Jianxin Town, Cangshan District, Fuzhou, Fujian, China',
      tel: '+86-591-8888-8888',
      fax: '+86-591-8888-8889',
      email: 'sales@cosunbm.com',
      website: 'www.cosunbm.com'
    };

    const themeColor = '#F96302'; // COSUN橙色

    return (
      <CosunA4Template ref={ref} paddingMm={15}>
        {/* 页眉 - 公司信息和表单标题 */}
        <CosunFormHeader
          companyName={companyInfo.name}
          companyNameEn={companyInfo.nameEn}
          title="報價單"
          titleEn="QUOTATION"
          themeColor={themeColor}
          companyInfo={{
            taxId: companyInfo.taxId,
            address: companyInfo.address,
            addressEn: companyInfo.addressEn,
            tel: companyInfo.tel,
            fax: companyInfo.fax,
            email: companyInfo.email,
            website: companyInfo.website,
          }}
        />

        {/* 报价单基本信息 */}
        <CosunFormInfoRow
          themeColor={themeColor}
          items={[
            {
              label: '報價單號碼',
              labelEn: 'Quotation No.',
              value: quotation.quotationNumber,
            },
            {
              label: '詢價單號碼',
              labelEn: 'RFQ No.',
              value: quotation.inquiryNumber,
            },
            {
              label: '報價日期',
              labelEn: 'Quote Date',
              value: quotation.quotationDate,
            },
            {
              label: '幣別',
              labelEn: 'Currency',
              value: quotation.currency,
            },
            {
              label: '有效期限',
              labelEn: 'Valid Until',
              value: quotation.validUntil,
            },
            {
              label: '業務負責',
              labelEn: 'Sales Rep.',
              value: 'Sales Department',
            },
          ]}
        />

        {/* 客户信息 */}
        <div className="avoid-break" style={{ marginBottom: '3mm' }}>
          <div 
            className="text-white px-3 py-1.5" 
            style={{ 
              backgroundColor: themeColor,
              fontSize: '8.5pt',
              fontWeight: 600,
              marginBottom: '0',
            }}
          >
            客戶資料 <span style={{ fontSize: '7.5pt', opacity: 0.9 }}>Customer Information</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <tbody>
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    width: '25%',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>客戶名稱</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Customer Name
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.customerName}
                </td>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    width: '25%',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>聯絡Email</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Contact Email
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.customerEmail}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 产品明细 */}
        <CosunFormTable
          title="產品明細"
          titleEn="Product Details"
          themeColor={themeColor}
          headers={[
            { label: '項次', labelEn: 'No.', width: '8%', align: 'center' },
            { label: '圖片', labelEn: 'Image', width: '10%', align: 'center' },
            { label: '產品名稱', labelEn: 'Product Name', width: '25%', align: 'left' },
            { label: '規格說明', labelEn: 'Specifications', width: '25%', align: 'left' },
            { label: '數量', labelEn: 'Qty', width: '10%', align: 'right' },
            { label: '單價', labelEn: 'Unit Price', width: '11%', align: 'right' },
            { label: '金額', labelEn: 'Amount', width: '11%', align: 'right' },
          ]}
          data={quotation.products.map((product, index) => [
            <span key="no" style={{ textAlign: 'center', display: 'block' }}>{index + 1}</span>,
            product.image ? (
              <img 
                key="img"
                src={product.image} 
                alt={product.name}
                style={{
                  width: '12mm',
                  height: '12mm',
                  objectFit: 'cover',
                  border: '1px solid #ddd',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            ) : (
              <div 
                key="img-placeholder"
                style={{
                  width: '12mm',
                  height: '12mm',
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '6pt',
                  color: '#999',
                  margin: '0 auto',
                }}
              >
                N/A
              </div>
            ),
            product.name,
            <span key="specs" style={{ color: '#666' }}>{product.specs}</span>,
            product.quantity.toLocaleString(),
            product.unitPrice.toFixed(2),
            product.totalPrice.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }),
          ])}
        />

        {/* 金额汇总 */}
        <div className="flex justify-end avoid-break" style={{ marginBottom: '3mm' }}>
          <div style={{ width: '80mm', border: '1px solid #ddd' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td 
                    style={{ 
                      backgroundColor: '#f5f5f5',
                      padding: '2mm 3mm',
                      textAlign: 'right',
                      fontSize: '8pt',
                      fontWeight: 600,
                    }}
                  >
                    <div>小計</div>
                    <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                      Subtotal
                    </div>
                  </td>
                  <td style={{ 
                    padding: '2mm 3mm', 
                    textAlign: 'right', 
                    fontSize: '8pt',
                    width: '45%',
                  }}>
                    {quotation.currency} {quotation.subtotal.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </td>
                </tr>
                {quotation.discount > 0 && (
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td 
                      style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '2mm 3mm',
                        textAlign: 'right',
                        fontSize: '8pt',
                        fontWeight: 600,
                      }}
                    >
                      <div>折扣</div>
                      <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                        Discount
                      </div>
                    </td>
                    <td style={{ 
                      padding: '2mm 3mm', 
                      textAlign: 'right', 
                      fontSize: '8pt',
                      color: '#dc2626',
                    }}>
                      - {quotation.currency} {quotation.discount.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                  </tr>
                )}
                {quotation.tax > 0 && (
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td 
                      style={{ 
                        backgroundColor: '#f5f5f5',
                        padding: '2mm 3mm',
                        textAlign: 'right',
                        fontSize: '8pt',
                        fontWeight: 600,
                      }}
                    >
                      <div>稅金</div>
                      <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                        Tax
                      </div>
                    </td>
                    <td style={{ 
                      padding: '2mm 3mm', 
                      textAlign: 'right', 
                      fontSize: '8pt',
                    }}>
                      {quotation.currency} {quotation.tax.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      })}
                    </td>
                  </tr>
                )}
                <tr style={{ backgroundColor: '#FFF5ED' }}>
                  <td 
                    style={{ 
                      backgroundColor: '#FFEAD5',
                      padding: '2.5mm 3mm',
                      textAlign: 'right',
                      fontSize: '8pt',
                      fontWeight: 600,
                    }}
                  >
                    <div>報價總額</div>
                    <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                      Total Amount
                    </div>
                  </td>
                  <td style={{ 
                    padding: '2.5mm 3mm', 
                    textAlign: 'right', 
                    fontSize: '10pt',
                    fontWeight: 600,
                    color: themeColor,
                  }}>
                    {quotation.currency} {quotation.totalAmount.toLocaleString('en-US', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 交易条款 */}
        <div className="avoid-break" style={{ marginBottom: '3mm' }}>
          <div 
            className="text-white px-3 py-1.5" 
            style={{ 
              backgroundColor: themeColor,
              fontSize: '8.5pt',
              fontWeight: 600,
              marginBottom: '0',
            }}
          >
            交易條款 <span style={{ fontSize: '7.5pt', opacity: 0.9 }}>Terms and Conditions</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <tbody>
              {/* 报价有效期 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    width: '25%',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>有效期限</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Validity
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  Valid until {quotation.validUntil}
                </td>
              </tr>
              
              {/* 贸易条款 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>貿易條款</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Trade Terms
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.tradeTerms || 'FOB Xiamen, China'}
                </td>
              </tr>
              
              {/* 付款条款 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>付款條件</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Payment Terms
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.paymentTerms}
                </td>
              </tr>
              
              {/* 交货时间 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>交貨時間</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Delivery Time
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.deliveryTerms}
                </td>
              </tr>
              
              {/* 装运港 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>裝運港</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Port of Loading
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.portOfLoading || 'Xiamen, China'}
                </td>
              </tr>
              
              {/* 包装方式 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>包裝方式</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Packing
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.packing || 'Export standard carton with wooden pallet'}
                </td>
              </tr>
              
              {/* 质保条款 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>品質保證</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Quality Warranty
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.warranty || '12 months from delivery date against manufacturing defects'}
                </td>
              </tr>
              
              {/* 检验标准 */}
              <tr>
                <td 
                  style={{ 
                    backgroundColor: '#f5f5f5',
                    padding: '2mm 3mm',
                    fontSize: '8pt',
                    fontWeight: 600,
                    border: '1px solid #ddd',
                  }}
                >
                  <div>檢驗標準</div>
                  <div style={{ fontSize: '7pt', color: '#666', fontWeight: 'normal' }}>
                    Inspection
                  </div>
                </td>
                <td style={{ padding: '2mm 3mm', fontSize: '8pt', border: '1px solid #ddd' }}>
                  {quotation.inspection || 'Seller\'s factory inspection, buyer has the right to re-inspect upon arrival'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 签章区 */}
        <CosunSignatureArea
          signatures={[
            { title: '製單人員', titleEn: 'Prepared By' },
            { title: '核准主管', titleEn: 'Approved By' },
          ]}
        />

        {/* 页脚 */}
        <CosunFormFooter
          text="本報價單為電腦列印文件，如有塗改或未蓋公司印章恕不生效"
          textEn="This quotation is computer generated and valid only with company seal"
        />
      </CosunA4Template>
    );
  }
);

QuotationTemplateA4.displayName = 'QuotationTemplateA4';

export default QuotationTemplateA4;