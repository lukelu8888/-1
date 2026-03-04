import { FormTemplate } from '../formTemplates';

// Part 2: 装箱单 & 销售合同 & 采购合同
const hdTemplatesPart2: FormTemplate[] = [
  // 3. 真实的 Home Depot Packing List
  {
    id: 'hd_packing_list_real',
    name: 'Home Depot 装箱单',
    name_en: 'PACKING LIST FOR THE COSUN BM',
    type: 'packing_list',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '真实的Home Depot装箱单格式',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Header
      {
        id: 'pl_header',
        name: 'pl_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'pl_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="text-align: center;">
                  <div style="font-size: 24px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                    PACKING LIST
                  </div>
                  <div style="font-size: 11px; color: #000; font-weight: bold; margin-bottom: 12px;">
                    FOR THE COSUN BM SHIPMENT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    Vendor: FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.<br/>
                    Address: No. 123 Industrial Park Road, Fuzhou, Fujian 350000, China<br/>
                    Tel: +86-591-8888-8888 | Email: export@cosun.com
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Packing List Info
      {
        id: 'pl_info',
        name: 'pl_info',
        title: 'SHIPMENT INFORMATION',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'pl_number',
            label: 'PACKING LIST NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'PL-2024-0001',
            fontWeight: 'bold'
          },
          {
            id: 'pl_date',
            label: 'DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'invoice_ref',
            label: 'INVOICE NO.',
            type: 'text',
            required: true,
            width: '33%',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'po_ref',
            label: 'HOME DEPOT PO NO.',
            type: 'text',
            required: true,
            width: '33%',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'destination_dc',
            label: 'DESTINATION DC',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'container_no',
            label: 'CONTAINER NO.',
            type: 'text',
            required: false,
            width: '33%'
          }
        ]
      },

      // Carton Details Table
      {
        id: 'carton_details',
        name: 'carton_details',
        title: 'CARTON DETAILS',
        layout: 'table',
        fields: [
          {
            id: 'carton_table',
            label: 'Cartons',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'carton_no', label: 'CARTON NO.', width: '8%', type: 'text' },
              { id: 'po_line', label: 'PO LINE', width: '7%', type: 'text' },
              { id: 'item_sku', label: 'ITEM/SKU', width: '15%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION', width: '25%', type: 'text' },
              { id: 'qty_per_carton', label: 'QTY/CTN', width: '8%', type: 'number' },
              { id: 'total_cartons', label: 'CTNS', width: '7%', type: 'number' },
              { id: 'total_qty', label: 'TOTAL QTY', width: '10%', type: 'number' },
              { id: 'gross_weight', label: 'G.W. (KG)', width: '10%', type: 'number' },
              { id: 'net_weight', label: 'N.W. (KG)', width: '10%', type: 'number' }
            ],
            sampleRows: [
              {
                carton_no: '1-10',
                po_line: '1',
                item_sku: 'SKU-12345678',
                description: 'Premium Door Lock Set',
                qty_per_carton: '50',
                total_cartons: '10',
                total_qty: '500',
                gross_weight: '250',
                net_weight: '220'
              }
            ]
          }
        ]
      },

      // Shipment Summary
      {
        id: 'shipment_summary',
        name: 'shipment_summary',
        title: 'SHIPMENT SUMMARY',
        layout: 'triple',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'total_cartons',
            label: 'TOTAL CARTONS',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold',
            fontSize: 12
          },
          {
            id: 'total_gross_weight',
            label: 'TOTAL GROSS WEIGHT (KG)',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold',
            fontSize: 12
          },
          {
            id: 'total_net_weight',
            label: 'TOTAL NET WEIGHT (KG)',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold',
            fontSize: 12
          },
          {
            id: 'total_volume',
            label: 'TOTAL VOLUME (CBM)',
            type: 'number',
            required: true,
            width: '33%'
          },
          {
            id: 'number_of_pallets',
            label: 'NUMBER OF PALLETS',
            type: 'number',
            required: false,
            width: '33%'
          },
          {
            id: 'container_type',
            label: 'CONTAINER TYPE',
            type: 'select',
            required: false,
            width: '33%',
            options: ['20\' GP', '40\' GP', '40\' HQ', 'LCL']
          }
        ]
      },

      // Marks & Numbers
      {
        id: 'marks_numbers',
        name: 'marks_numbers',
        title: 'SHIPPING MARKS',
        layout: 'single',
        fields: [
          {
            id: 'shipping_marks',
            label: '',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 5,
            defaultValue: 'THE COSUN BM\nPO NO.: HD-2024-000001\nDC #: 6542\nMADE IN CHINA\nCARTON NO.: 1-10 OF 10',
            fontFamily: 'monospace'
          }
        ]
      },

      // Special Handling
      {
        id: 'special_handling',
        name: 'special_handling',
        title: 'SPECIAL HANDLING INSTRUCTIONS',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'handling_instructions',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'e.g., Handle with care, Keep dry, This side up, etc.'
          }
        ]
      }
    ],

    footer: {
      text: 'This packing list must accompany the shipment. Copy to be retained for customs clearance.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'PREPARED BY',
            role: 'shipper',
            fields: ['name', 'date']
          }
        ]
      }
    }
  },

  // 4. 真实的 Home Depot 销售合同 (Sales Contract)
  {
    id: 'hd_sales_contract_real',
    name: 'Home Depot 销售合同',
    name_en: 'THE COSUN BM SALES CONTRACT',
    type: 'sales_contract',
    owner: 'customer',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '真实的Home Depot销售合同格式',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Contract Header
      {
        id: 'contract_header',
        name: 'contract_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'contract_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302; background: linear-gradient(to right, #FFFFFF 0%, #FFF8F0 100%);">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 900; color: #F96302; letter-spacing: -0.5px; margin-bottom: 8px;">
                    THE COSUN BM
                  </div>
                  <div style="font-size: 20px; font-weight: 700; color: #000; margin-bottom: 12px;">
                    SALES CONTRACT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    2455 Paces Ferry Road, N.W. | Atlanta, Georgia 30339-4024<br/>
                    Phone: (770) 433-8211 | www.homedepot.com
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Contract Information
      {
        id: 'contract_info',
        name: 'contract_info',
        title: 'CONTRACT INFORMATION',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        border: true,
        fields: [
          {
            id: 'contract_number',
            label: 'CONTRACT NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'HD-SC-2024-0001',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'contract_date',
            label: 'CONTRACT DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'effective_date',
            label: 'EFFECTIVE DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'expiry_date',
            label: 'EXPIRY DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'contract_value',
            label: 'CONTRACT VALUE',
            type: 'currency',
            required: true,
            width: '33%',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'payment_terms',
            label: 'PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Net 30', 'Net 60', 'Net 90', '2/10 Net 30', 'Letter of Credit']
          }
        ]
      },

      // Parties Section
      {
        id: 'parties',
        name: 'parties',
        title: 'CONTRACTING PARTIES',
        layout: 'double',
        fields: [
          {
            id: 'buyer_info',
            label: 'BUYER (THE COSUN BM)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 6,
            defaultValue: 'THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA\\nTax ID: XX-XXXXXXX',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'seller_info',
            label: 'SELLER (VENDOR)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 6,
            placeholder: 'Vendor Company Name\\nAddress\\nCity, State ZIP\\nCountry\\nTax ID',
            backgroundColor: '#FFFFFF'
          }
        ]
      },

      // Contract Items
      {
        id: 'contract_items',
        name: 'contract_items',
        title: 'CONTRACT ITEMS & SPECIFICATIONS',
        layout: 'table',
        fields: [
          {
            id: 'items_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'item', label: 'ITEM', width: '5%', type: 'number' },
              { id: 'sku', label: 'SKU / PART NO.', width: '15%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION & SPECS', width: '30%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'uom', label: 'UOM', width: '8%', type: 'text' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '12%', type: 'currency' },
              { id: 'total_price', label: 'TOTAL PRICE', width: '12%', type: 'currency' },
              { id: 'delivery_date', label: 'DELIVERY', width: '8%', type: 'date' }
            ],
            sampleRows: [
              {
                item: '1',
                sku: 'SKU-12345678',
                description: 'Premium Door Lock Set - Brushed Nickel Finish, Grade 1 Security',
                quantity: '10,000',
                uom: 'EA',
                unit_price: '$24.50',
                total_price: '$245,000.00',
                delivery_date: '2024-03-01'
              }
            ]
          }
        ]
      },

      // Contract Totals
      {
        id: 'contract_totals',
        name: 'contract_totals',
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
            fontSize: 11
          },
          {
            id: 'discount',
            label: 'DISCOUNT',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'contract_total',
            label: 'CONTRACT TOTAL',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Terms & Conditions
      {
        id: 'terms_conditions',
        name: 'terms_conditions',
        title: 'TERMS & CONDITIONS',
        layout: 'single',
        fields: [
          {
            id: 'terms_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.8; padding: 16px; border: 1px solid #DDD; background: #F9F9F9;">
                <strong style="color: #F96302; font-size: 11px;">1. DELIVERY TERMS:</strong><br/>
                Seller shall deliver all goods FOB Destination to Home Depot distribution centers as specified. Delivery dates are firm commitments.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">2. QUALITY STANDARDS:</strong><br/>
                All goods must meet Home Depot quality specifications. Non-conforming goods will be rejected at Seller's expense.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">3. PAYMENT TERMS:</strong><br/>
                Payment as specified above, subject to receipt of compliant goods and proper documentation.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">4. WARRANTIES:</strong><br/>
                Seller warrants all goods are free from defects, merchantable, and fit for intended purpose.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">5. COMPLIANCE:</strong><br/>
                Seller must comply with all applicable laws, regulations, and Home Depot vendor requirements.<br/><br/>
                
                <strong style="color: #F96302; font-size: 11px;">6. TERMINATION:</strong><br/>
                Home Depot may terminate this contract for cause with 30 days written notice.
              </div>
            `
          }
        ]
      },

      // Special Provisions
      {
        id: 'special_provisions',
        name: 'special_provisions',
        title: 'SPECIAL PROVISIONS',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'special_provisions_text',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 4,
            placeholder: 'Enter any special provisions, amendments, or additional terms...'
          }
        ]
      }
    ],

    footer: {
      text: '© 2024 The Home Depot, Inc. This contract is governed by the laws of the State of Georgia.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'AUTHORIZED SIGNATURE (BUYER - HOME DEPOT)',
            role: 'buyer',
            fields: ['signature', 'name', 'title', 'date']
          },
          {
            label: 'AUTHORIZED SIGNATURE (SELLER - VENDOR)',
            role: 'seller',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

  // 5. 采购合同 (Purchase Contract from Vendor to Cosun)
  {
    id: 'hd_purchase_contract_vendor',
    name: 'Cosun 采购合同',
    name_en: 'PURCHASE CONTRACT - COSUN',
    type: 'purchase_contract',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    description: 'Cosun与供应商之间的采购合同',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Header
      {
        id: 'header',
        name: 'header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="text-align: center;">
                  <div style="font-size: 20px; font-weight: bold; color: #000; margin-bottom: 8px;">
                    FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                  </div>
                  <div style="font-size: 24px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                    PURCHASE CONTRACT
                  </div>
                  <div style="font-size: 9px; color: #666; line-height: 1.5;">
                    No. 123 Industrial Park Road | Fuzhou, Fujian 350000, China<br/>
                    Tel: +86-591-8888-8888 | Email: purchase@cosun.com
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Contract Details
      {
        id: 'contract_details',
        name: 'contract_details',
        title: 'CONTRACT DETAILS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'contract_no',
            label: 'CONTRACT NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'COSUN-PC-2024-0001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'contract_date',
            label: 'DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'hd_po_reference',
            label: 'HOME DEPOT PO REF',
            type: 'text',
            required: true,
            width: '33%',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'delivery_deadline',
            label: 'DELIVERY DEADLINE',
            type: 'date',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'payment_method',
            label: 'PAYMENT METHOD',
            type: 'select',
            required: true,
            width: '33%',
            options: ['T/T in Advance', '30% Deposit + 70% Balance', 'L/C at Sight', 'Net 30']
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

      // Parties
      {
        id: 'parties',
        name: 'parties',
        title: 'PARTIES',
        layout: 'double',
        fields: [
          {
            id: 'buyer',
            label: 'BUYER (COSUN)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.\\nNo. 123 Industrial Park Road\\nFuzhou, Fujian 350000, China\\nTel: +86-591-8888-8888',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'supplier',
            label: 'SUPPLIER (VENDOR)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            placeholder: 'Supplier company name and address...'
          }
        ]
      },

      // Purchase Items
      {
        id: 'purchase_items',
        name: 'purchase_items',
        title: 'PURCHASE ITEMS',
        layout: 'table',
        fields: [
          {
            id: 'items_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'no', label: 'NO.', width: '5%', type: 'number' },
              { id: 'product_name', label: 'PRODUCT NAME', width: '25%', type: 'text' },
              { id: 'specifications', label: 'SPECIFICATIONS', width: '20%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'unit', label: 'UNIT', width: '8%', type: 'text' },
              { id: 'unit_price', label: 'UNIT PRICE', width: '12%', type: 'currency' },
              { id: 'amount', label: 'AMOUNT', width: '12%', type: 'currency' },
              { id: 'delivery', label: 'DELIVERY', width: '8%', type: 'date' }
            ],
            sampleRows: []
          }
        ]
      },

      // Totals
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
            alignment: 'right'
          },
          {
            id: 'tax',
            label: 'TAX',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'total',
            label: 'TOTAL AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          }
        ]
      },

      // Contract Terms
      {
        id: 'contract_terms',
        name: 'contract_terms',
        title: 'CONTRACT TERMS',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'terms',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 5,
            placeholder: 'Quality standards, packaging requirements, inspection terms, etc.'
          }
        ]
      }
    ],

    footer: {
      text: 'This contract is subject to the laws of the People\'s Republic of China.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'BUYER (COSUN) - AUTHORIZED SIGNATURE',
            role: 'buyer',
            fields: ['signature', 'name', 'title', 'date']
          },
          {
            label: 'SUPPLIER - AUTHORIZED SIGNATURE',
            role: 'supplier',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

];

export default hdTemplatesPart2;
