import { FormTemplate } from '../formTemplates';

// Part 1: 采购订单 & 供应商发票
const hdTemplatesPart1: FormTemplate[] = [
  // 1. 真实的 Home Depot 采购订单 (Purchase Order)
  {
    id: 'hd_purchase_order_real',
    name: 'Home Depot 采购订单',
    name_en: 'THE COSUN BM PURCHASE ORDER',
    type: 'purchase_contract',
    owner: 'customer',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '真实的Home Depot采购订单格式',
    
    // 页面设置
    layout: {
      pageSize: 'Letter', // 美国信纸 8.5" x 11"
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }, // 单位：英寸
    },

    sections: [
      // Header Section - Logo & Document Info
      {
        id: 'header',
        name: 'header',
        title: '',
        layout: 'custom',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'logo_company_info',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="flex: 1;">
                  <div style="font-size: 28px; font-weight: 900; color: #F96302; font-family: Arial, sans-serif; letter-spacing: -0.5px;">
                    THE COSUN BM
                  </div>
                  <div style="font-size: 9px; color: #333; margin-top: 8px; line-height: 1.4;">
                    <strong>CORPORATE OFFICE</strong><br/>
                    2455 Paces Ferry Road, N.W.<br/>
                    Atlanta, Georgia 30339-4024<br/>
                    Phone: (770) 433-8211
                  </div>
                </div>
                <div style="text-align: right; flex: 1;">
                  <div style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 4px;">
                    PURCHASE ORDER
                  </div>
                  <div style="font-size: 10px; color: #666;">
                    This document constitutes a binding agreement
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // PO Number & Dates Section
      {
        id: 'po_info',
        name: 'po_info',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'po_number',
            label: 'PO NUMBER',
            type: 'text',
            required: true,
            width: '25%',
            defaultValue: 'HD-2024-000001',
            fontWeight: 'bold',
            fontSize: 11
          },
          {
            id: 'po_date',
            label: 'PO DATE',
            type: 'date',
            required: true,
            width: '25%',
            fontSize: 10
          },
          {
            id: 'buyer_code',
            label: 'BUYER CODE',
            type: 'text',
            required: true,
            width: '25%',
            fontSize: 10
          },
          {
            id: 'dept_number',
            label: 'DEPT #',
            type: 'text',
            required: true,
            width: '25%',
            fontSize: 10
          }
        ]
      },

      // Vendor Information
      {
        id: 'vendor_info',
        name: 'vendor_info',
        title: 'VENDOR INFORMATION',
        layout: 'double',
        backgroundColor: '#F5F5F5',
        border: true,
        fields: [
          {
            id: 'vendor_number',
            label: 'VENDOR NUMBER',
            type: 'text',
            required: true,
            width: '50%',
            fontWeight: 'bold'
          },
          {
            id: 'vendor_name',
            label: 'VENDOR NAME',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: 'Fujian Cosun Tuff Building Materials Co., Ltd.'
          },
          {
            id: 'vendor_address',
            label: 'ADDRESS',
            type: 'textarea',
            required: true,
            width: '50%',
            placeholder: '123 Industrial Park Road\nFuzhou, Fujian 350000\nChina'
          },
          {
            id: 'vendor_contact',
            label: 'CONTACT PERSON',
            type: 'text',
            required: true,
            width: '50%'
          },
          {
            id: 'vendor_phone',
            label: 'PHONE',
            type: 'text',
            required: true,
            width: '25%'
          },
          {
            id: 'vendor_email',
            label: 'EMAIL',
            type: 'text',
            required: true,
            width: '25%'
          }
        ]
      },

      // Ship To / Bill To
      {
        id: 'shipping_billing',
        name: 'shipping_billing',
        title: '',
        layout: 'double',
        fields: [
          {
            id: 'ship_to',
            label: 'SHIP TO',
            type: 'textarea',
            required: true,
            width: '50%',
            defaultValue: 'THE COSUN BM\nDistribution Center #6542\n1000 Logistics Drive\nCity, State ZIP',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'bill_to',
            label: 'BILL TO',
            type: 'textarea',
            required: true,
            width: '50%',
            defaultValue: 'THE COSUN BM\nAccounts Payable Department\n2455 Paces Ferry Road\nAtlanta, GA 30339',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Shipping & Payment Terms
      {
        id: 'terms',
        name: 'terms',
        title: 'TERMS & CONDITIONS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'ship_via',
            label: 'SHIP VIA',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB Origin', 'FOB Destination', 'Prepaid & Add', 'Collect']
          },
          {
            id: 'fob_point',
            label: 'FOB POINT',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Origin', 'Destination']
          },
          {
            id: 'freight_terms',
            label: 'FREIGHT TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Prepaid', 'Collect', 'Third Party']
          },
          {
            id: 'payment_terms',
            label: 'PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Net 30', 'Net 60', 'Net 90', '2/10 Net 30', 'COD', 'Letter of Credit']
          },
          {
            id: 'requested_ship_date',
            label: 'REQUESTED SHIP DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'cancel_date',
            label: 'CANCEL DATE',
            type: 'date',
            required: true,
            width: '33%'
          }
        ]
      },

      // Line Items Table
      {
        id: 'line_items',
        name: 'line_items',
        title: 'LINE ITEMS',
        layout: 'table',
        fields: [
          {
            id: 'items_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'line', label: 'LINE', width: '5%', type: 'number' },
              { id: 'item_number', label: 'ITEM NUMBER / SKU', width: '15%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION', width: '30%', type: 'text' },
              { id: 'uom', label: 'UOM', width: '8%', type: 'text' },
              { id: 'qty_ordered', label: 'QTY ORDERED', width: '10%', type: 'number' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '12%', type: 'currency' },
              { id: 'extended_price', label: 'EXTENDED PRICE', width: '12%', type: 'currency' },
              { id: 'req_date', label: 'REQ DATE', width: '8%', type: 'date' }
            ],
            sampleRows: [
              {
                line: '1',
                item_number: 'SKU-12345678',
                description: 'Premium Door Lock Set - Brushed Nickel Finish',
                uom: 'EA',
                qty_ordered: '500',
                unit_price: '$24.50',
                extended_price: '$12,250.00',
                req_date: '2024-02-15'
              },
              {
                line: '2',
                item_number: 'SKU-87654321',
                description: 'Heavy Duty Window Hinge - Stainless Steel',
                uom: 'SET',
                qty_ordered: '1000',
                unit_price: '$8.75',
                extended_price: '$8,750.00',
                req_date: '2024-02-15'
              }
            ]
          }
        ]
      },

      // Totals Section
      {
        id: 'totals',
        name: 'totals',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'subtotal',
            label: 'SUBTOTAL',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$21,000.00',
            fontSize: 11
          },
          {
            id: 'freight',
            label: 'FREIGHT',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00',
            fontSize: 10
          },
          {
            id: 'tax',
            label: 'TAX',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00',
            fontSize: 10
          },
          {
            id: 'total_amount',
            label: 'TOTAL AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$21,000.00',
            fontSize: 14,
            fontWeight: 'bold'
          }
        ]
      },

      // Special Instructions
      {
        id: 'instructions',
        name: 'instructions',
        title: 'SPECIAL INSTRUCTIONS',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'special_instructions',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            placeholder: 'Enter any special shipping, packaging, or handling instructions here...',
            rows: 4
          }
        ]
      },

      // Important Notes
      {
        id: 'important_notes',
        name: 'important_notes',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'notes',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 8px; color: #666; line-height: 1.6; padding: 12px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #000; text-decoration: underline;">IMPORTANT NOTES:</strong><br/>
                • Please acknowledge receipt of this Purchase Order within 24 hours.<br/>
                • All shipments must include a packing list and reference this PO number.<br/>
                • Invoice must match PO line items exactly. Discrepancies will delay payment.<br/>
                • Compliance with Home Depot vendor requirements is mandatory.<br/>
                • All goods are subject to inspection upon receipt. Non-conforming goods will be rejected.<br/>
                • ASN (Advanced Shipping Notice) is required 24 hours prior to delivery.<br/>
                • Vendor must comply with all Home Depot safety and quality standards.
              </div>
            `
          }
        ]
      }
    ],

    // Footer with Authorizations
    footer: {
      text: '© 2024 The Home Depot, Inc. All rights reserved. This Purchase Order is subject to The Home Depot Standard Terms and Conditions.',
      signatureLines: {
        enabled: true,
        parties: [
          { 
            label: 'AUTHORIZED BY (HOME DEPOT BUYER)',
            role: 'buyer',
            fields: ['signature', 'name', 'date']
          }
        ]
      }
    }
  },

  // 2. 真实的 Home Depot Vendor Invoice Template
  {
    id: 'hd_vendor_invoice_real',
    name: 'Home Depot 供应商发票',
    name_en: 'VENDOR INVOICE FOR THE COSUN BM',
    type: 'invoice',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '供应商向Home Depot提交的发票格式',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Vendor Header
      {
        id: 'vendor_header',
        name: 'vendor_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'vendor_info_header',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 18px; font-weight: bold; color: #000; margin-bottom: 8px;">
                      FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                    </div>
                    <div style="font-size: 9px; color: #333; line-height: 1.5;">
                      No. 123 Industrial Park Road, Fuzhou Economic Zone<br/>
                      Fuzhou, Fujian Province 350000, China<br/>
                      Tel: +86-591-8888-8888 | Fax: +86-591-8888-8889<br/>
                      Email: sales@cosun.com | www.cosun.com<br/>
                      Tax ID: 91350000XXXXXXXXXX
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                      INVOICE
                    </div>
                    <div style="font-size: 9px; color: #666;">
                      FOR THE COSUN BM
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Invoice Details
      {
        id: 'invoice_details',
        name: 'invoice_details',
        title: '',
        layout: 'double',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'invoice_number',
            label: 'INVOICE NUMBER',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'COSUN-INV-2024-0001',
            fontWeight: 'bold',
            fontSize: 11
          },
          {
            id: 'invoice_date',
            label: 'INVOICE DATE',
            type: 'date',
            required: true,
            width: '50%'
          },
          {
            id: 'po_number_ref',
            label: 'HOME DEPOT PO NUMBER',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: 'HD-2024-000001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'vendor_number_ref',
            label: 'VENDOR NUMBER',
            type: 'text',
            required: true,
            width: '50%'
          },
          {
            id: 'shipment_date',
            label: 'SHIPMENT DATE',
            type: 'date',
            required: true,
            width: '50%'
          },
          {
            id: 'due_date',
            label: 'PAYMENT DUE DATE',
            type: 'date',
            required: true,
            width: '50%'
          }
        ]
      },

      // Bill To / Ship To
      {
        id: 'addresses',
        name: 'addresses',
        title: '',
        layout: 'double',
        fields: [
          {
            id: 'bill_to_hd',
            label: 'BILL TO',
            type: 'textarea',
            required: true,
            width: '50%',
            defaultValue: 'THE COSUN BM\nAccounts Payable Department\n2455 Paces Ferry Road, N.W.\nAtlanta, GA 30339-4024\nUSA',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'ship_to_dc',
            label: 'SHIP TO',
            type: 'textarea',
            required: true,
            width: '50%',
            placeholder: 'THE COSUN BM DC #XXXX\n...',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Invoice Line Items
      {
        id: 'invoice_items',
        name: 'invoice_items',
        title: 'INVOICE DETAILS',
        layout: 'table',
        fields: [
          {
            id: 'invoice_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'line', label: 'LINE', width: '5%', type: 'number' },
              { id: 'po_line', label: 'PO LINE', width: '7%', type: 'text' },
              { id: 'item_sku', label: 'ITEM/SKU', width: '13%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION', width: '28%', type: 'text' },
              { id: 'qty_shipped', label: 'QTY SHIPPED', width: '10%', type: 'number' },
              { id: 'uom', label: 'UOM', width: '7%', type: 'text' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '12%', type: 'currency' },
              { id: 'amount', label: 'AMOUNT', width: '13%', type: 'currency' }
            ],
            sampleRows: [
              {
                line: '1',
                po_line: '1',
                item_sku: 'SKU-12345678',
                description: 'Premium Door Lock Set - Brushed Nickel',
                qty_shipped: '500',
                uom: 'EA',
                unit_price: '$24.50',
                amount: '$12,250.00'
              }
            ]
          }
        ]
      },

      // Shipping Information
      {
        id: 'shipping_info',
        name: 'shipping_info',
        title: 'SHIPPING INFORMATION',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'carrier',
            label: 'CARRIER',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: 'FedEx / UPS / DHL etc.'
          },
          {
            id: 'tracking_number',
            label: 'TRACKING NUMBER',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'pro_number',
            label: 'PRO NUMBER / BOL',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'number_of_cartons',
            label: 'NUMBER OF CARTONS',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'total_weight',
            label: 'TOTAL WEIGHT (LBS)',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'incoterms',
            label: 'INCOTERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP']
          }
        ]
      },

      // Invoice Totals
      {
        id: 'invoice_totals',
        name: 'invoice_totals',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'merchandise_total',
            label: 'MERCHANDISE TOTAL',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$12,250.00',
            fontSize: 11
          },
          {
            id: 'freight_charges',
            label: 'FREIGHT CHARGES',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00'
          },
          {
            id: 'insurance',
            label: 'INSURANCE',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00'
          },
          {
            id: 'other_charges',
            label: 'OTHER CHARGES',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right',
            defaultValue: '$0.00'
          },
          {
            id: 'invoice_total',
            label: 'INVOICE TOTAL',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            defaultValue: '$12,250.00',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Payment Instructions
      {
        id: 'payment_instructions',
        name: 'payment_instructions',
        title: 'PAYMENT INSTRUCTIONS',
        layout: 'double',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'payment_method',
            label: 'PAYMENT METHOD',
            type: 'select',
            required: true,
            width: '50%',
            options: ['Wire Transfer', 'Letter of Credit', 'Check']
          },
          {
            id: 'payment_terms_inv',
            label: 'PAYMENT TERMS',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: 'Net 30 Days'
          },
          {
            id: 'bank_name',
            label: 'BANK NAME',
            type: 'text',
            required: false,
            width: '50%',
            placeholder: 'Bank of China, Fuzhou Branch'
          },
          {
            id: 'account_number',
            label: 'ACCOUNT NUMBER',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'swift_code',
            label: 'SWIFT CODE',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'bank_address',
            label: 'BANK ADDRESS',
            type: 'textarea',
            required: false,
            width: '50%'
          }
        ]
      },

      // Notes & Remarks
      {
        id: 'notes_remarks',
        name: 'notes_remarks',
        title: 'NOTES & REMARKS',
        layout: 'single',
        fields: [
          {
            id: 'invoice_notes',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'Any additional notes or remarks...'
          }
        ]
      },

      // Certification
      {
        id: 'certification',
        name: 'certification',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'certification_text',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302;">CERTIFICATION:</strong><br/>
                I hereby certify that the information contained in this invoice is true and correct, and that the goods described were shipped on the date indicated and comply with all terms of the Purchase Order referenced above. All goods are warranted to be free from defects in materials and workmanship.
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'Please remit payment to the address shown above. For questions, contact: accounting@cosun.com or +86-591-8888-8888',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'AUTHORIZED SIGNATURE (VENDOR)',
            role: 'vendor',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

];

export default hdTemplatesPart1;
