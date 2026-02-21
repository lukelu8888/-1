// 🏢 福建高盛达富建材有限公司 - 真实商业文档模板
// Fujian Cosun Tuff Building Materials Co., Ltd. - Real Business Document Templates
// 品牌色：深蓝色 #1E3A8A（专业、信赖）+ 金色 #D97706（品质、荣耀）

import { FormTemplate } from './formTemplates';

const cosunRealTemplates: FormTemplate[] = [
  // ==================== 客户端文档 (Customer Documents) ====================
  
  // 1. 客户询价单 (Request for Quotation - RFQ)
  {
    id: 'cosun_customer_rfq_real',
    name: '客户询价单',
    name_en: 'REQUEST FOR QUOTATION (RFQ)',
    type: 'inquiry',
    owner: 'customer',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '客户向Cosun提交的正式询价单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Customer Header
      {
        id: 'customer_header',
        name: 'customer_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'customer_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #1E3A8A;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 20px; font-weight: bold; color: #000; margin-bottom: 8px;">
                      [CUSTOMER COMPANY NAME]
                    </div>
                    <div style="font-size: 9px; color: #333; line-height: 1.5;">
                      [Customer Address Line 1]<br/>
                      [City, State/Province, Postal Code]<br/>
                      [Country]<br/>
                      Tel: [Phone] | Email: [Email]
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #1E3A8A; margin-bottom: 4px;">
                      RFQ
                    </div>
                    <div style="font-size: 11px; color: #666; font-weight: bold;">
                      REQUEST FOR QUOTATION
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // RFQ Information
      {
        id: 'rfq_info',
        name: 'rfq_info',
        title: 'RFQ INFORMATION',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'rfq_number',
            label: 'RFQ NUMBER',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'RFQ-2024-0001',
            fontWeight: 'bold'
          },
          {
            id: 'rfq_date',
            label: 'RFQ DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'valid_until',
            label: 'VALID UNTIL',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'buyer_name',
            label: 'BUYER NAME',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'buyer_email',
            label: 'BUYER EMAIL',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'buyer_phone',
            label: 'BUYER PHONE',
            type: 'text',
            required: true,
            width: '33%'
          }
        ]
      },

      // Vendor Information
      {
        id: 'vendor_cosun',
        name: 'vendor_cosun',
        title: 'SUPPLIER INFORMATION',
        layout: 'double',
        backgroundColor: '#FEF3C7',
        fields: [
          {
            id: 'supplier_name',
            label: 'SUPPLIER NAME',
            type: 'text',
            required: true,
            width: '100%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.',
            fontWeight: 'bold',
            fontSize: 11
          },
          {
            id: 'supplier_address',
            label: 'ADDRESS',
            type: 'textarea',
            required: true,
            width: '50%',
            defaultValue: 'No. 123 Industrial Park Road\nFuzhou Economic & Technical Development Zone\nFuzhou, Fujian Province 350000\nChina'
          },
          {
            id: 'supplier_contact',
            label: 'CONTACT PERSON',
            type: 'text',
            required: true,
            width: '25%'
          },
          {
            id: 'supplier_email',
            label: 'EMAIL',
            type: 'text',
            required: true,
            width: '25%',
            defaultValue: 'sales@cosun.com'
          }
        ]
      },

      // Delivery Requirements
      {
        id: 'delivery_req',
        name: 'delivery_req',
        title: 'DELIVERY REQUIREMENTS',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'delivery_address',
            label: 'DELIVERY ADDRESS',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3
          },
          {
            id: 'required_delivery_date',
            label: 'REQUIRED DELIVERY DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'shipping_method',
            label: 'SHIPPING METHOD',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Sea Freight', 'Air Freight', 'Express Courier', 'Land Transport']
          },
          {
            id: 'incoterms',
            label: 'INCOTERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DDU', 'FCA']
          }
        ]
      },

      // Product Requirements Table
      {
        id: 'product_requirements',
        name: 'product_requirements',
        title: 'PRODUCT REQUIREMENTS',
        layout: 'table',
        fields: [
          {
            id: 'products_table',
            label: 'Products',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'line', label: 'LINE', width: '5%', type: 'number' },
              { id: 'product_category', label: 'CATEGORY', width: '12%', type: 'text' },
              { id: 'product_name', label: 'PRODUCT NAME / DESCRIPTION', width: '28%', type: 'text' },
              { id: 'specifications', label: 'SPECIFICATIONS', width: '20%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'uom', label: 'UOM', width: '8%', type: 'text' },
              { id: 'target_price', label: 'TARGET PRICE', width: '12%', type: 'text' },
              { id: 'remarks', label: 'REMARKS', width: '5%', type: 'text' }
            ],
            sampleRows: [
              {
                line: '1',
                product_category: 'Door Hardware',
                product_name: 'Premium Door Lock Set with Handle',
                specifications: 'Material: Stainless Steel 304, Finish: Brushed Nickel',
                quantity: '5000',
                uom: 'SET',
                target_price: '$25.00',
                remarks: ''
              },
              {
                line: '2',
                product_category: 'Window Hardware',
                product_name: 'Heavy Duty Window Hinge',
                specifications: 'Size: 4", Material: Zinc Alloy, Load: 150kg',
                quantity: '10000',
                uom: 'PCS',
                target_price: '$3.50',
                remarks: ''
              }
            ]
          }
        ]
      },

      // Quality & Certification Requirements
      {
        id: 'quality_cert',
        name: 'quality_cert',
        title: 'QUALITY & CERTIFICATION REQUIREMENTS',
        layout: 'single',
        backgroundColor: '#FEF3C7',
        fields: [
          {
            id: 'quality_standards',
            label: 'REQUIRED QUALITY STANDARDS',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 2,
            placeholder: 'e.g., ISO 9001, CE, UL, ANSI, ASTM standards...'
          },
          {
            id: 'certifications_required',
            label: 'REQUIRED CERTIFICATIONS',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 2,
            placeholder: 'e.g., Material certificates, Test reports, Factory audit reports...'
          }
        ]
      },

      // Payment Terms Request
      {
        id: 'payment_terms_req',
        name: 'payment_terms_req',
        title: 'PAYMENT TERMS REQUEST',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'preferred_payment_terms',
            label: 'PREFERRED PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['30% Deposit + 70% before shipment', 'Letter of Credit (L/C)', 'Net 30 Days', 'Net 60 Days', 'COD']
          },
          {
            id: 'payment_method',
            label: 'PAYMENT METHOD',
            type: 'select',
            required: true,
            width: '33%',
            options: ['T/T (Wire Transfer)', 'Letter of Credit', 'PayPal', 'Credit Card']
          },
          {
            id: 'currency',
            label: 'CURRENCY',
            type: 'select',
            required: true,
            width: '33%',
            options: ['USD', 'EUR', 'GBP', 'CNY']
          }
        ]
      },

      // Additional Requirements
      {
        id: 'additional_req',
        name: 'additional_req',
        title: 'ADDITIONAL REQUIREMENTS & NOTES',
        layout: 'single',
        fields: [
          {
            id: 'additional_notes',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 4,
            placeholder: 'Please include any additional requirements, packaging specifications, labeling requirements, or special instructions...'
          }
        ]
      },

      // Important Notice
      {
        id: 'important_notice',
        name: 'important_notice',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'notice_text',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 8px; color: #666; line-height: 1.6; padding: 12px; border: 2px solid #1E3A8A; background: #F0F4F8;">
                <strong style="color: #1E3A8A; text-decoration: underline;">IMPORTANT NOTICE:</strong><br/>
                • This RFQ is for quotation purposes only and does not constitute a purchase order.<br/>
                • Please provide your quotation within 7 business days from the date of this RFQ.<br/>
                • Quotation should include: unit price, MOQ, lead time, payment terms, and warranty period.<br/>
                • Samples may be required before placing formal order.<br/>
                • All prices should be quoted in the specified currency.<br/>
                • Please include complete product specifications and technical data sheets.
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'Please submit your quotation to the buyer email address listed above. For questions, contact the buyer directly.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'REQUESTED BY (BUYER)',
            role: 'buyer',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

  // ==================== Cosun 文档 (Cosun Documents) ====================

  // 2. Cosun 正式报价单 (Formal Quotation)
  {
    id: 'cosun_quotation_real',
    name: 'Cosun 正式报价单',
    name_en: 'COMMERCIAL QUOTATION',
    type: 'quotation',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: 'Cosun向客户提供的正式商业报价单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Cosun Official Header
      {
        id: 'cosun_header',
        name: 'cosun_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'cosun_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 30px 40px; color: white; border-radius: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="flex: 1;">
                    <div style="font-size: 26px; font-weight: 900; margin-bottom: 8px; letter-spacing: 1px;">
                      COSUN BUILDING MATERIALS
                    </div>
                    <div style="font-size: 14px; opacity: 0.95; font-weight: 600; color: #FCD34D;">
                      福建高盛达富建材有限公司
                    </div>
                    <div style="font-size: 8px; margin-top: 12px; line-height: 1.6; opacity: 0.9;">
                      No. 123 Industrial Park Road, Fuzhou Economic Zone<br/>
                      Fuzhou, Fujian 350000, China<br/>
                      Tel: +86-591-8888-8888 | Fax: +86-591-8888-8889<br/>
                      Email: sales@cosun.com | Web: www.cosun.com
                    </div>
                  </div>
                  <div style="text-align: right; border-left: 3px solid #FCD34D; padding-left: 30px;">
                    <div style="font-size: 32px; font-weight: 900; margin-bottom: 4px;">
                      QUOTATION
                    </div>
                    <div style="font-size: 10px; opacity: 0.9; font-weight: 600;">
                      商业报价单
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Quotation Details
      {
        id: 'quotation_details',
        name: 'quotation_details',
        title: '',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'quotation_no',
            label: 'QUOTATION NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'COSUN-QT-2024-0001',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#FEF3C7'
          },
          {
            id: 'quotation_date',
            label: 'QUOTATION DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'valid_until_date',
            label: 'VALID UNTIL',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'rfq_reference',
            label: 'RFQ REFERENCE',
            type: 'text',
            required: false,
            width: '33%',
            backgroundColor: '#FEF3C7'
          },
          {
            id: 'sales_representative',
            label: 'SALES REPRESENTATIVE',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'sales_email',
            label: 'SALES EMAIL',
            type: 'text',
            required: true,
            width: '33%'
          }
        ]
      },

      // Customer Information
      {
        id: 'customer_info_qt',
        name: 'customer_info_qt',
        title: 'CUSTOMER INFORMATION',
        layout: 'double',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'customer_company_name',
            label: 'COMPANY NAME',
            type: 'text',
            required: true,
            width: '100%',
            fontWeight: 'bold'
          },
          {
            id: 'customer_address_qt',
            label: 'ADDRESS',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 3
          },
          {
            id: 'customer_contact_person',
            label: 'CONTACT PERSON',
            type: 'text',
            required: true,
            width: '25%'
          },
          {
            id: 'customer_phone',
            label: 'PHONE',
            type: 'text',
            required: true,
            width: '25%'
          }
        ]
      },

      // Quoted Products Table
      {
        id: 'quoted_products',
        name: 'quoted_products',
        title: 'PRODUCT DETAILS & PRICING',
        layout: 'table',
        fields: [
          {
            id: 'quoted_products_table',
            label: 'Products',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'item', label: 'ITEM', width: '5%', type: 'number' },
              { id: 'product_code', label: 'PRODUCT CODE', width: '10%', type: 'text' },
              { id: 'description', label: 'PRODUCT DESCRIPTION', width: '25%', type: 'text' },
              { id: 'specifications', label: 'SPECIFICATIONS', width: '18%', type: 'text' },
              { id: 'qty', label: 'QTY', width: '7%', type: 'number' },
              { id: 'uom', label: 'UOM', width: '7%', type: 'text' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '10%', type: 'currency' },
              { id: 'total_price', label: 'TOTAL PRICE', width: '12%', type: 'currency' },
              { id: 'lead_time', label: 'LEAD TIME', width: '6%', type: 'text' }
            ],
            sampleRows: [
              {
                item: '1',
                product_code: 'CSN-DL-001',
                description: 'Premium Door Lock Set with Lever Handle',
                specifications: 'SS304, Brushed Nickel, ANSI Grade 2',
                qty: '5000',
                uom: 'SET',
                unit_price: '$26.50',
                total_price: '$132,500.00',
                lead_time: '45 days'
              },
              {
                item: '2',
                product_code: 'CSN-WH-002',
                description: 'Heavy Duty Window Hinge - Adjustable',
                specifications: 'Zinc Alloy, 4", 150kg Load Capacity',
                qty: '10000',
                uom: 'PCS',
                unit_price: '$3.80',
                total_price: '$38,000.00',
                lead_time: '30 days'
              }
            ]
          }
        ]
      },

      // Pricing Summary
      {
        id: 'pricing_summary',
        name: 'pricing_summary',
        title: 'PRICING SUMMARY',
        layout: 'custom',
        backgroundColor: '#FEF3C7',
        fields: [
          {
            id: 'subtotal_amount',
            label: 'SUBTOTAL',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$170,500.00',
            fontSize: 11,
            fontWeight: 'bold'
          },
          {
            id: 'discount',
            label: 'DISCOUNT (IF APPLICABLE)',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00'
          },
          {
            id: 'shipping_cost',
            label: 'ESTIMATED SHIPPING',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: 'To be advised'
          },
          {
            id: 'total_quotation',
            label: 'TOTAL QUOTATION AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$170,500.00',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#1E3A8A'
          }
        ]
      },

      // Terms & Conditions
      {
        id: 'terms_conditions_qt',
        name: 'terms_conditions_qt',
        title: 'TERMS & CONDITIONS',
        layout: 'double',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'payment_terms_qt',
            label: 'PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '50%',
            options: ['30% T/T Deposit + 70% before shipment', 'L/C at sight', 'Net 30 Days', 'Net 60 Days'],
            defaultValue: '30% T/T Deposit + 70% before shipment'
          },
          {
            id: 'delivery_terms',
            label: 'DELIVERY TERMS',
            type: 'select',
            required: true,
            width: '50%',
            options: ['FOB Fuzhou', 'CIF Destination', 'CFR Destination', 'EXW Factory'],
            defaultValue: 'FOB Fuzhou'
          },
          {
            id: 'moq',
            label: 'MINIMUM ORDER QUANTITY (MOQ)',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'As quoted above'
          },
          {
            id: 'production_lead_time',
            label: 'PRODUCTION LEAD TIME',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '45 days after deposit'
          },
          {
            id: 'packaging',
            label: 'PACKAGING',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'Standard export carton with inner box'
          },
          {
            id: 'warranty_period',
            label: 'WARRANTY PERIOD',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '12 months from shipment date'
          }
        ]
      },

      // Product Quality & Certifications
      {
        id: 'quality_certs_qt',
        name: 'quality_certs_qt',
        title: 'QUALITY ASSURANCE & CERTIFICATIONS',
        layout: 'single',
        fields: [
          {
            id: 'certifications_list',
            label: 'AVAILABLE CERTIFICATIONS',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 2,
            defaultValue: 'ISO 9001:2015, CE Certificate, SGS Test Report, Material Certificates'
          },
          {
            id: 'quality_control',
            label: 'QUALITY CONTROL PROCESS',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 2,
            defaultValue: '100% inspection before shipment. Third-party inspection accepted. All products comply with international standards.'
          }
        ]
      },

      // Additional Notes
      {
        id: 'additional_notes_qt',
        name: 'additional_notes_qt',
        title: 'ADDITIONAL NOTES',
        layout: 'single',
        fields: [
          {
            id: 'notes_qt',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'Any additional information, special offers, or clarifications...'
          }
        ]
      },

      // Important Information
      {
        id: 'important_info_qt',
        name: 'important_info_qt',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'important_info_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 8px; color: #333; line-height: 1.7; padding: 15px; border: 2px solid #1E3A8A; background: linear-gradient(to right, #F0F4F8, #FEF3C7);">
                <strong style="color: #1E3A8A; font-size: 10px;">IMPORTANT INFORMATION:</strong><br/><br/>
                <strong>1. Quotation Validity:</strong> This quotation is valid for 30 days from the quotation date.<br/>
                <strong>2. Price Adjustment:</strong> Prices are subject to change in case of significant material cost fluctuation.<br/>
                <strong>3. Order Confirmation:</strong> Orders will be confirmed upon receipt of signed purchase order and deposit payment.<br/>
                <strong>4. Samples:</strong> Samples are available upon request. Sample cost will be refunded upon bulk order.<br/>
                <strong>5. Customization:</strong> Custom designs, logos, and packaging are available. MOQ may apply.<br/>
                <strong>6. Shipping:</strong> Actual shipping cost will be calculated based on final order quantity and destination.<br/>
                <strong>7. Force Majeure:</strong> Cosun is not liable for delays caused by circumstances beyond our control.<br/><br/>
                <strong style="color: #D97706;">Thank you for considering Cosun Building Materials as your trusted supplier!</strong>
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'COSUN BUILDING MATERIALS - Your Trusted Partner in Quality Hardware Solutions | www.cosun.com | sales@cosun.com',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'PREPARED BY (SALES REPRESENTATIVE)',
            role: 'sales',
            fields: ['signature', 'name', 'title', 'date']
          },
          {
            label: 'APPROVED BY (SALES MANAGER)',
            role: 'manager',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

  // 3. 形式发票 (Proforma Invoice)
  {
    id: 'cosun_proforma_invoice_real',
    name: 'Cosun 形式发票',
    name_en: 'PROFORMA INVOICE',
    type: 'invoice',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: 'Cosun形式发票，用于客户报关和开立信用证',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Proforma Invoice Header
      {
        id: 'pi_header',
        name: 'pi_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'pi_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); padding: 30px 40px; color: white;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="font-size: 32px; font-weight: 900; margin-bottom: 8px; letter-spacing: 2px;">
                    PROFORMA INVOICE
                  </div>
                  <div style="font-size: 12px; opacity: 0.95; font-weight: 600; color: #FCD34D;">
                    形式发票
                  </div>
                </div>
                <div style="border-top: 2px solid rgba(255,255,255,0.3); padding-top: 15px; display: flex; justify-content: space-between;">
                  <div style="flex: 1;">
                    <div style="font-size: 18px; font-weight: 900; margin-bottom: 8px;">
                      COSUN BUILDING MATERIALS
                    </div>
                    <div style="font-size: 11px; margin-bottom: 4px; font-weight: 600; color: #FCD34D;">
                      福建高盛达富建材有限公司
                    </div>
                    <div style="font-size: 8px; line-height: 1.6; opacity: 0.9;">
                      No. 123 Industrial Park Road, Fuzhou Economic Zone<br/>
                      Fuzhou, Fujian 350000, China<br/>
                      Tel: +86-591-8888-8888 | Email: export@cosun.com
                    </div>
                  </div>
                  <div style="text-align: right; flex: 1;">
                    <div style="font-size: 9px; opacity: 0.9; line-height: 1.6;">
                      <strong>TAX ID:</strong> 91350000XXXXXXXXXX<br/>
                      <strong>BANK:</strong> Bank of China, Fuzhou Branch<br/>
                      <strong>ACCOUNT:</strong> XXXX-XXXX-XXXX-XXXX<br/>
                      <strong>SWIFT:</strong> BKCHCNBJ950
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // PI Details
      {
        id: 'pi_details',
        name: 'pi_details',
        title: 'INVOICE DETAILS',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'pi_number',
            label: 'PROFORMA INVOICE NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'COSUN-PI-2024-0001',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#FEF3C7'
          },
          {
            id: 'pi_date',
            label: 'INVOICE DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'quotation_ref',
            label: 'QUOTATION REF.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'po_reference',
            label: 'CUSTOMER PO NO.',
            type: 'text',
            required: false,
            width: '33%',
            backgroundColor: '#FEF3C7'
          },
          {
            id: 'contract_no',
            label: 'CONTRACT NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'sales_person',
            label: 'SALES PERSON',
            type: 'text',
            required: true,
            width: '33%'
          }
        ]
      },

      // Buyer Information
      {
        id: 'buyer_info_pi',
        name: 'buyer_info_pi',
        title: 'BUYER INFORMATION',
        layout: 'single',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'buyer_company',
            label: 'COMPANY NAME',
            type: 'text',
            required: true,
            width: '100%',
            fontWeight: 'bold',
            fontSize: 11
          },
          {
            id: 'buyer_address_pi',
            label: 'COMPLETE ADDRESS',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3
          }
        ]
      },

      // Consignee & Notify Party
      {
        id: 'consignee_notify',
        name: 'consignee_notify',
        title: '',
        layout: 'double',
        fields: [
          {
            id: 'consignee',
            label: 'CONSIGNEE (收货人)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 4,
            backgroundColor: '#FEF3C7'
          },
          {
            id: 'notify_party',
            label: 'NOTIFY PARTY (通知人)',
            type: 'textarea',
            required: false,
            width: '50%',
            rows: 4,
            backgroundColor: '#FEF3C7',
            defaultValue: 'Same as Consignee'
          }
        ]
      },

      // Shipping Details
      {
        id: 'shipping_details_pi',
        name: 'shipping_details_pi',
        title: 'SHIPPING DETAILS',
        layout: 'triple',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'port_of_loading',
            label: 'PORT OF LOADING',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'Fuzhou, China'
          },
          {
            id: 'port_of_discharge',
            label: 'PORT OF DISCHARGE',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'final_destination',
            label: 'FINAL DESTINATION',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'shipping_method_pi',
            label: 'SHIPPING METHOD',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Sea Freight - FCL', 'Sea Freight - LCL', 'Air Freight', 'Express']
          },
          {
            id: 'container_qty',
            label: 'CONTAINER QTY & TYPE',
            type: 'text',
            required: false,
            width: '33%',
            placeholder: "e.g., 1x40'HQ"
          },
          {
            id: 'estimated_shipping_date',
            label: 'EST. SHIPPING DATE',
            type: 'date',
            required: true,
            width: '33%'
          }
        ]
      },

      // Products Table
      {
        id: 'products_pi',
        name: 'products_pi',
        title: 'PRODUCT DETAILS',
        layout: 'table',
        fields: [
          {
            id: 'products_pi_table',
            label: 'Products',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'item_no', label: 'ITEM NO.', width: '6%', type: 'number' },
              { id: 'product_code', label: 'PRODUCT CODE', width: '12%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION OF GOODS', width: '30%', type: 'text' },
              { id: 'hs_code', label: 'HS CODE', width: '10%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'unit_price', label: 'UNIT PRICE\n(USD)', width: '12%', type: 'currency' },
              { id: 'total_amount', label: 'TOTAL AMOUNT\n(USD)', width: '14%', type: 'currency' },
              { id: 'weight', label: 'N.W./G.W.\n(KGS)', width: '6%', type: 'text' }
            ],
            sampleRows: [
              {
                item_no: '1',
                product_code: 'CSN-DL-001',
                description: 'Premium Door Lock Set with Lever Handle, Material: Stainless Steel 304, Finish: Brushed Nickel, ANSI Grade 2 Certified',
                hs_code: '8301.4000',
                quantity: '5000 SETS',
                unit_price: '$26.50',
                total_amount: '$132,500.00',
                weight: '2.5/2.8'
              },
              {
                item_no: '2',
                product_code: 'CSN-WH-002',
                description: 'Heavy Duty Window Hinge - Adjustable, Size: 4 inch, Material: Zinc Alloy, Load Capacity: 150kg',
                hs_code: '8302.1000',
                quantity: '10000 PCS',
                unit_price: '$3.80',
                total_amount: '$38,000.00',
                weight: '0.3/0.35'
              }
            ]
          }
        ]
      },

      // Invoice Totals
      {
        id: 'invoice_totals_pi',
        name: 'invoice_totals_pi',
        title: 'INVOICE SUMMARY',
        layout: 'custom',
        backgroundColor: '#FEF3C7',
        fields: [
          {
            id: 'total_quantity',
            label: 'TOTAL QUANTITY',
            type: 'text',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '5000 SETS + 10000 PCS',
            fontSize: 10
          },
          {
            id: 'total_net_weight',
            label: 'TOTAL NET WEIGHT',
            type: 'text',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '15,500 KGS',
            fontSize: 10
          },
          {
            id: 'total_gross_weight',
            label: 'TOTAL GROSS WEIGHT',
            type: 'text',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '17,300 KGS',
            fontSize: 10
          },
          {
            id: 'total_volume',
            label: 'TOTAL VOLUME',
            type: 'text',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '65 CBM',
            fontSize: 10
          },
          {
            id: 'fob_amount',
            label: 'FOB AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$170,500.00',
            fontSize: 12,
            fontWeight: 'bold'
          },
          {
            id: 'freight_charges_pi',
            label: 'FREIGHT CHARGES',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$3,500.00',
            fontSize: 11
          },
          {
            id: 'insurance_pi',
            label: 'INSURANCE',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$870.25',
            fontSize: 11
          },
          {
            id: 'total_cif_amount',
            label: 'TOTAL CIF AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$174,870.25',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#1E3A8A'
          }
        ]
      },

      // Terms of Sale
      {
        id: 'terms_of_sale',
        name: 'terms_of_sale',
        title: 'TERMS OF SALE',
        layout: 'double',
        backgroundColor: '#F0F4F8',
        fields: [
          {
            id: 'price_terms',
            label: 'PRICE TERMS',
            type: 'select',
            required: true,
            width: '50%',
            options: ['FOB Fuzhou', 'CIF Destination', 'CFR Destination', 'EXW Factory'],
            defaultValue: 'FOB Fuzhou'
          },
          {
            id: 'payment_terms_pi',
            label: 'PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '50%',
            options: ['30% T/T in advance, 70% before shipment', 'L/C at sight', '100% T/T in advance'],
            defaultValue: '30% T/T in advance, 70% before shipment'
          },
          {
            id: 'delivery_time_pi',
            label: 'DELIVERY TIME',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '45 days after receipt of deposit'
          },
          {
            id: 'validity_pi',
            label: 'VALIDITY',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '30 days from PI date'
          },
          {
            id: 'country_of_origin',
            label: 'COUNTRY OF ORIGIN',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'China'
          },
          {
            id: 'packing_pi',
            label: 'PACKING',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'Standard export carton with inner box'
          }
        ]
      },

      // Banking Information
      {
        id: 'banking_info',
        name: 'banking_info',
        title: 'BANKING INFORMATION FOR PAYMENT',
        layout: 'double',
        backgroundColor: '#FEF3C7',
        fields: [
          {
            id: 'beneficiary_name',
            label: 'BENEFICIARY NAME',
            type: 'text',
            required: true,
            width: '100%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.',
            fontWeight: 'bold'
          },
          {
            id: 'bank_name_pi',
            label: 'BANK NAME',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'Bank of China, Fuzhou Branch'
          },
          {
            id: 'bank_address_pi',
            label: 'BANK ADDRESS',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'Fuzhou, Fujian, China'
          },
          {
            id: 'account_number_pi',
            label: 'ACCOUNT NUMBER',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'XXXX-XXXX-XXXX-XXXX'
          },
          {
            id: 'swift_code_pi',
            label: 'SWIFT CODE',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'BKCHCNBJ950'
          }
        ]
      },

      // Important Notice
      {
        id: 'important_notice_pi',
        name: 'important_notice_pi',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'notice_pi_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 8px; color: #333; line-height: 1.7; padding: 15px; border: 2px solid #1E3A8A; background: linear-gradient(to right, #F0F4F8, #FEF3C7);">
                <strong style="color: #1E3A8A; font-size: 10px;">IMPORTANT NOTES:</strong><br/><br/>
                <strong>1.</strong> This Proforma Invoice is valid for quotation and reference purposes only. It will become binding upon receipt of buyer's confirmation and deposit payment.<br/>
                <strong>2.</strong> All banking charges outside of China are for buyer's account.<br/>
                <strong>3.</strong> Delivery time will commence after receipt of deposit payment and confirmation of all product specifications.<br/>
                <strong>4.</strong> All goods are subject to final inspection before shipment. Third-party inspection is acceptable.<br/>
                <strong>5.</strong> Any changes to this Proforma Invoice must be agreed upon in writing by both parties.<br/>
                <strong>6.</strong> Products are covered by manufacturer's warranty as specified in the quotation.<br/>
                <strong>7.</strong> Force Majeure: Seller is not responsible for delays caused by circumstances beyond our control.<br/><br/>
                <div style="text-align: center; margin-top: 10px;">
                  <strong style="color: #D97706; font-size: 9px;">DECLARATION:</strong><br/>
                  <em style="color: #666;">We hereby certify that this Proforma Invoice shows the actual price and description of the goods described above.</em>
                </div>
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'COSUN BUILDING MATERIALS CO., LTD. | Export Department | Email: export@cosun.com | Tel: +86-591-8888-8888',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'FOR AND ON BEHALF OF COSUN BUILDING MATERIALS',
            role: 'company',
            fields: ['signature', 'name', 'title', 'date', 'company_stamp']
          }
        ]
      }
    }
  }

  // 将继续在页面上动态添加更多模板...
];

// 导出所有Cosun真实商业文档模板
export default cosunRealTemplates;

// 导出Cosun品牌色系
export const cosunBrandColors = {
  primary: '#1E3A8A',      // 深蓝色 - 专业、信赖
  secondary: '#D97706',    // 金色 - 品质、荣耀
  accent: '#3B82F6',       // 亮蓝色 - 活力、创新
  lightBg: '#F0F4F8',      // 浅蓝背景
  goldBg: '#FEF3C7',       // 浅金背景
  text: '#1F2937',         // 深灰文字
  border: '#1E3A8A'        // 边框色
};
