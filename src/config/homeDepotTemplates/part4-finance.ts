import { FormTemplate } from '../formTemplates';

// Part 4: 对账单 & 付款通知 & 收货单 & 询价单 & 中文采购合同
const hdTemplatesPart4: FormTemplate[] = [
  // 8. 对账单 (Statement of Account)
  {
    id: 'hd_statement_of_account',
    name: '对账单',
    name_en: 'STATEMENT OF ACCOUNT',
    type: 'statement',
    owner: 'finance',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '月度对账单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Statement Header
      {
        id: 'statement_header',
        name: 'statement_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'statement_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 18px; font-weight: bold; color: #000;">
                      FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                    </div>
                    <div style="font-size: 8px; color: #666; margin-top: 6px;">
                      Accounts Receivable Department<br/>
                      Tel: +86-591-8888-8888 | Email: ar@cosun.com
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 28px; font-weight: 900; color: #F96302;">
                      STATEMENT OF
                    </div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302;">
                      ACCOUNT
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Statement Info
      {
        id: 'statement_info',
        name: 'statement_info',
        title: '',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'statement_no',
            label: 'STATEMENT NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'SOA-2024-001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'statement_date',
            label: 'STATEMENT DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'period',
            label: 'STATEMENT PERIOD',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: 'Jan 1, 2024 - Jan 31, 2024'
          },
          {
            id: 'customer_account_no',
            label: 'CUSTOMER ACCOUNT NO.',
            type: 'text',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'payment_terms_soa',
            label: 'PAYMENT TERMS',
            type: 'text',
            required: true,
            width: '33%'
          },
          {
            id: 'currency_soa',
            label: 'CURRENCY',
            type: 'select',
            required: true,
            width: '33%',
            options: ['USD', 'EUR', 'GBP', 'CNY']
          }
        ]
      },

      // Customer Info
      {
        id: 'customer_info_soa',
        name: 'customer_info_soa',
        title: 'CUSTOMER INFORMATION',
        layout: 'single',
        fields: [
          {
            id: 'customer_details',
            label: '',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 4,
            defaultValue: 'THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          }
        ]
      },

      // Account Summary
      {
        id: 'account_summary',
        name: 'account_summary',
        title: 'ACCOUNT SUMMARY',
        layout: 'custom',
        backgroundColor: '#FFF8F0',
        border: true,
        fields: [
          {
            id: 'beginning_balance',
            label: 'BEGINNING BALANCE',
            type: 'currency',
            required: true,
            width: '100%',
            fontSize: 11,
            fontWeight: 'bold'
          },
          {
            id: 'total_charges',
            label: 'TOTAL CHARGES (INVOICES)',
            type: 'currency',
            required: true,
            width: '100%',
            fontSize: 11
          },
          {
            id: 'total_payments',
            label: 'TOTAL PAYMENTS',
            type: 'currency',
            required: true,
            width: '100%',
            fontSize: 11
          },
          {
            id: 'ending_balance',
            label: 'ENDING BALANCE',
            type: 'currency',
            required: true,
            width: '100%',
            fontSize: 14,
            fontWeight: 'bold',
            backgroundColor: '#FFFFFF'
          }
        ]
      },

      // Transaction Details
      {
        id: 'transactions',
        name: 'transactions',
        title: 'TRANSACTION DETAILS',
        layout: 'table',
        fields: [
          {
            id: 'transactions_table',
            label: 'Transactions',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'date', label: 'DATE', width: '10%', type: 'date' },
              { id: 'transaction_type', label: 'TYPE', width: '10%', type: 'text' },
              { id: 'reference', label: 'REFERENCE NO.', width: '15%', type: 'text' },
              { id: 'description', label: 'DESCRIPTION', width: '30%', type: 'text' },
              { id: 'charges', label: 'CHARGES', width: '12%', type: 'currency' },
              { id: 'payments', label: 'PAYMENTS', width: '12%', type: 'currency' },
              { id: 'balance', label: 'BALANCE', width: '12%', type: 'currency' }
            ],
            sampleRows: [
              {
                date: '2024-01-05',
                transaction_type: 'Invoice',
                reference: 'INV-2024-001',
                description: 'Sales Invoice - PO HD-2024-000001',
                charges: '$12,250.00',
                payments: '-',
                balance: '$12,250.00'
              },
              {
                date: '2024-01-15',
                transaction_type: 'Payment',
                reference: 'PAY-2024-001',
                description: 'Wire Transfer',
                charges: '-',
                payments: '$12,250.00',
                balance: '$0.00'
              }
            ]
          }
        ]
      },

      // Aging Analysis
      {
        id: 'aging_analysis',
        name: 'aging_analysis',
        title: 'AGING ANALYSIS',
        layout: 'custom',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'aging_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="display: flex; gap: 10px; padding: 12px; font-size: 10px;">
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">CURRENT</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">1-30 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">31-60 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFFFFF; border: 1px solid #DDD;">
                  <div style="color: #666; margin-bottom: 4px;">61-90 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #000;">$0.00</div>
                </div>
                <div style="flex: 1; text-align: center; padding: 10px; background: #FFF8F0; border: 2px solid #F96302;">
                  <div style="color: #F96302; margin-bottom: 4px; font-weight: bold;">OVER 90 DAYS</div>
                  <div style="font-weight: bold; font-size: 14px; color: #F96302;">$0.00</div>
                </div>
              </div>
            `
          }
        ]
      },

      // Payment Instructions
      {
        id: 'payment_instructions_soa',
        name: 'payment_instructions_soa',
        title: 'PAYMENT INSTRUCTIONS',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'payment_instructions_text',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px;">
                <strong style="color: #F96302;">PAYMENT DETAILS:</strong><br/>
                Bank: Bank of China, Fuzhou Branch<br/>
                Account Name: Fujian Cosun Tuff Building Materials Co., Ltd.<br/>
                Account Number: XXXX-XXXX-XXXX-XXXX<br/>
                SWIFT Code: BKCHCNBJ950<br/><br/>
                
                <strong style="color: #F96302;">IMPORTANT:</strong> Please reference your account number and statement number on all payments.
              </div>
            `
          }
        ]
      },

      // Notes
      {
        id: 'statement_notes',
        name: 'statement_notes',
        title: 'NOTES',
        layout: 'single',
        fields: [
          {
            id: 'notes',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'Additional notes or comments...'
          }
        ]
      }
    ],

    footer: {
      text: 'If you have any questions about this statement, please contact our Accounts Receivable department.',
      signatureLines: {
        enabled: false
      }
    }
  },

  // 9. 付款通知 (Payment Advice)
  {
    id: 'hd_payment_advice',
    name: '付款通知',
    name_en: 'PAYMENT ADVICE',
    type: 'payment_advice',
    owner: 'finance',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '付款通知单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Payment Advice Header
      {
        id: 'pa_header',
        name: 'pa_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'pa_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302; background: linear-gradient(135deg, #FFF8F0 0%, #FFFFFF 100%);">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 4px;">
                    PAYMENT ADVICE
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 8px;">
                    Remittance Notification
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Payment Info
      {
        id: 'payment_info',
        name: 'payment_info',
        title: 'PAYMENT INFORMATION',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        border: true,
        fields: [
          {
            id: 'payment_advice_no',
            label: 'PAYMENT ADVICE NO.',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'PA-2024-0001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'payment_date',
            label: 'PAYMENT DATE',
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
            options: ['Wire Transfer', 'Check', 'ACH', 'Letter of Credit', 'PayPal']
          },
          {
            id: 'payment_reference',
            label: 'PAYMENT REFERENCE',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: 'Transaction ID / Check No.',
            fontWeight: 'bold'
          },
          {
            id: 'payment_amount',
            label: 'PAYMENT AMOUNT',
            type: 'currency',
            required: true,
            width: '33%',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'currency_pa',
            label: 'CURRENCY',
            type: 'select',
            required: true,
            width: '33%',
            options: ['USD', 'EUR', 'GBP', 'CNY']
          }
        ]
      },

      // Payer Information
      {
        id: 'payer_info',
        name: 'payer_info',
        title: '',
        layout: 'double',
        fields: [
          {
            id: 'payer',
            label: 'PAYER (FROM)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            defaultValue: 'THE COSUN BM, INC.\\n2455 Paces Ferry Road, N.W.\\nAtlanta, GA 30339-4024\\nUSA',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'payee',
            label: 'PAYEE (TO)',
            type: 'textarea',
            required: true,
            width: '50%',
            rows: 5,
            placeholder: 'Vendor/Supplier company name and address...'
          }
        ]
      },

      // Bank Details
      {
        id: 'bank_details_pa',
        name: 'bank_details_pa',
        title: 'BANK TRANSFER DETAILS',
        layout: 'double',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'bank_name_pa',
            label: 'BANK NAME',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'bank_branch',
            label: 'BRANCH',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'account_name_pa',
            label: 'ACCOUNT NAME',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'account_number_pa',
            label: 'ACCOUNT NUMBER',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'swift_code_pa',
            label: 'SWIFT/BIC CODE',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'routing_number',
            label: 'ROUTING NUMBER (ACH)',
            type: 'text',
            required: false,
            width: '50%'
          }
        ]
      },

      // Invoice Details Being Paid
      {
        id: 'invoices_paid',
        name: 'invoices_paid',
        title: 'INVOICES BEING PAID',
        layout: 'table',
        fields: [
          {
            id: 'invoices_table',
            label: 'Invoices',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'invoice_no', label: 'INVOICE NO.', width: '15%', type: 'text' },
              { id: 'invoice_date', label: 'INVOICE DATE', width: '12%', type: 'date' },
              { id: 'po_number', label: 'PO NUMBER', width: '15%', type: 'text' },
              { id: 'invoice_amount', label: 'INVOICE AMOUNT', width: '15%', type: 'currency' },
              { id: 'discount', label: 'DISCOUNT', width: '12%', type: 'currency' },
              { id: 'amount_paid', label: 'AMOUNT PAID', width: '15%', type: 'currency' },
              { id: 'status', label: 'STATUS', width: '10%', type: 'text' }
            ],
            sampleRows: [
              {
                invoice_no: 'COSUN-INV-2024-0001',
                invoice_date: '2024-01-05',
                po_number: 'HD-2024-000001',
                invoice_amount: '$12,250.00',
                discount: '$0.00',
                amount_paid: '$12,250.00',
                status: 'Paid in Full'
              }
            ]
          }
        ]
      },

      // Payment Summary
      {
        id: 'payment_summary',
        name: 'payment_summary',
        title: 'PAYMENT SUMMARY',
        layout: 'custom',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'total_invoices',
            label: 'TOTAL INVOICES AMOUNT',
            type: 'currency',
            required: true,
            width: '100%',
            alignment: 'right',
            fontSize: 11
          },
          {
            id: 'total_discounts',
            label: 'TOTAL DISCOUNTS',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'bank_charges',
            label: 'BANK CHARGES',
            type: 'currency',
            required: false,
            width: '100%',
            alignment: 'right'
          },
          {
            id: 'net_payment',
            label: 'NET PAYMENT AMOUNT',
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

      // Payment Notes
      {
        id: 'payment_notes',
        name: 'payment_notes',
        title: 'PAYMENT NOTES',
        layout: 'single',
        fields: [
          {
            id: 'notes_text',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'Additional payment notes or comments...'
          }
        ]
      },

      // Confirmation
      {
        id: 'confirmation',
        name: 'confirmation',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'confirmation_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.6; padding: 12px; border: 2px solid #F96302; background: #FFFBF5; text-align: center;">
                <strong style="color: #F96302; font-size: 11px;">PAYMENT CONFIRMATION</strong><br/><br/>
                This is to confirm that payment has been processed as indicated above. Please allow 2-5 business days for the funds to reflect in your account. If you have any questions regarding this payment, please contact our Accounts Payable department.
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'This is a computer-generated document and does not require a signature. For inquiries, contact: ap@homedepot.com',
      signatureLines: {
        enabled: false
      }
    }
  },

  // 10. 收货确认单 (Goods Receipt Confirmation)
  {
    id: 'hd_goods_receipt',
    name: '收货确认单',
    name_en: 'GOODS RECEIPT CONFIRMATION',
    type: 'goods_receipt',
    owner: 'warehouse',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '货物收货确认单',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // GR Header
      {
        id: 'gr_header',
        name: 'gr_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'gr_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; letter-spacing: -0.5px;">
                      THE COSUN BM
                    </div>
                    <div style="font-size: 9px; color: #666; margin-top: 6px;">
                      Distribution Center Operations
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 900; color: #000;">
                      GOODS RECEIPT
                    </div>
                    <div style="font-size: 20px; font-weight: 700; color: #F96302;">
                      CONFIRMATION
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Receipt Information
      {
        id: 'receipt_info',
        name: 'receipt_info',
        title: 'RECEIPT INFORMATION',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        border: true,
        fields: [
          {
            id: 'gr_number',
            label: 'GR NUMBER',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'GR-2024-0001',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'receipt_date',
            label: 'RECEIPT DATE',
            type: 'date',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'receipt_time',
            label: 'RECEIPT TIME',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: '14:30'
          },
          {
            id: 'po_number_gr',
            label: 'PO NUMBER',
            type: 'text',
            required: true,
            width: '33%',
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'delivery_note_no',
            label: 'DELIVERY NOTE NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'packing_list_no',
            label: 'PACKING LIST NO.',
            type: 'text',
            required: false,
            width: '33%'
          },
          {
            id: 'dc_location',
            label: 'DC LOCATION',
            type: 'text',
            required: true,
            width: '33%',
            placeholder: 'DC #6542'
          },
          {
            id: 'dock_door',
            label: 'DOCK DOOR',
            type: 'text',
            required: false,
            width: '33%',
            placeholder: 'Door 12'
          },
          {
            id: 'carrier_name',
            label: 'CARRIER NAME',
            type: 'text',
            required: true,
            width: '33%'
          }
        ]
      },

      // Vendor Information
      {
        id: 'vendor_info_gr',
        name: 'vendor_info_gr',
        title: 'VENDOR INFORMATION',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'vendor_details_gr',
            label: '',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            placeholder: 'Vendor name and address...'
          }
        ]
      },

      // Received Items
      {
        id: 'received_items',
        name: 'received_items',
        title: 'ITEMS RECEIVED',
        layout: 'table',
        fields: [
          {
            id: 'items_received_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'line', label: 'LINE', width: '5%', type: 'number' },
              { id: 'item_sku_gr', label: 'ITEM/SKU', width: '12%', type: 'text' },
              { id: 'description_gr', label: 'DESCRIPTION', width: '25%', type: 'text' },
              { id: 'po_qty', label: 'PO QTY', width: '8%', type: 'number' },
              { id: 'received_qty', label: 'RECEIVED QTY', width: '10%', type: 'number' },
              { id: 'uom_gr', label: 'UOM', width: '6%', type: 'text' },
              { id: 'variance', label: 'VARIANCE', width: '8%', type: 'number' },
              { id: 'condition', label: 'CONDITION', width: '10%', type: 'select' },
              { id: 'notes', label: 'NOTES', width: '16%', type: 'text' }
            ],
            sampleRows: [
              {
                line: '1',
                item_sku_gr: 'SKU-12345678',
                description_gr: 'Premium Door Lock Set',
                po_qty: '500',
                received_qty: '500',
                uom_gr: 'EA',
                variance: '0',
                condition: 'Good',
                notes: ''
              }
            ]
          }
        ]
      },

      // Receipt Summary
      {
        id: 'receipt_summary',
        name: 'receipt_summary',
        title: 'RECEIPT SUMMARY',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'total_cartons_received',
            label: 'TOTAL CARTONS RECEIVED',
            type: 'number',
            required: true,
            width: '33%',
            fontWeight: 'bold'
          },
          {
            id: 'total_pallets',
            label: 'TOTAL PALLETS',
            type: 'number',
            required: false,
            width: '33%'
          },
          {
            id: 'total_weight_received',
            label: 'TOTAL WEIGHT (LBS)',
            type: 'number',
            required: false,
            width: '33%'
          },
          {
            id: 'receipt_status',
            label: 'RECEIPT STATUS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Complete', 'Partial', 'Over-Shipped', 'Damaged', 'Rejected'],
            backgroundColor: '#FFF8F0',
            fontWeight: 'bold'
          },
          {
            id: 'inspection_result',
            label: 'INSPECTION RESULT',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Passed', 'Failed', 'Conditional', 'Pending'],
            fontWeight: 'bold'
          },
          {
            id: 'put_away_location',
            label: 'PUT-AWAY LOCATION',
            type: 'text',
            required: false,
            width: '33%',
            placeholder: 'Warehouse location'
          }
        ]
      },

      // Inspection Notes
      {
        id: 'inspection_notes',
        name: 'inspection_notes',
        title: 'INSPECTION & QUALITY NOTES',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'quality_notes',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 4,
            placeholder: 'Document any damages, discrepancies, quality issues, or special observations...'
          }
        ]
      },

      // Discrepancies
      {
        id: 'discrepancies',
        name: 'discrepancies',
        title: 'DISCREPANCIES & ACTIONS',
        layout: 'double',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'discrepancy_type',
            label: 'DISCREPANCY TYPE',
            type: 'select',
            required: false,
            width: '50%',
            options: ['None', 'Quantity Shortage', 'Quantity Overage', 'Damaged Goods', 'Wrong Items', 'Quality Issue']
          },
          {
            id: 'action_taken',
            label: 'ACTION TAKEN',
            type: 'select',
            required: false,
            width: '50%',
            options: ['None', 'Accepted', 'Rejected', 'Partial Accept', 'Vendor Notified', 'RMA Issued']
          },
          {
            id: 'discrepancy_details',
            label: 'DISCREPANCY DETAILS',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: 'Describe discrepancies in detail...'
          }
        ]
      },

      // Photos/Evidence
      {
        id: 'evidence',
        name: 'evidence',
        title: 'PHOTOS & EVIDENCE',
        layout: 'single',
        fields: [
          {
            id: 'evidence_notes',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #666; padding: 10px; background: #F9F9F9; border: 1px dashed #CCC;">
                Photos of damaged goods, packaging, or discrepancies should be uploaded to the system and referenced here.<br/>
                Photo IDs: ___________________________________________
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: 'This Goods Receipt Confirmation is an official record. Discrepancies must be reported within 24 hours.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'RECEIVED BY (DC SUPERVISOR)',
            role: 'receiver',
            fields: ['signature', 'name', 'employee_id', 'date']
          },
          {
            label: 'DRIVER SIGNATURE (CARRIER)',
            role: 'carrier',
            fields: ['signature', 'name', 'date']
          }
        ]
      }
    }
  },

  // 11. 客户询价单 (Customer Inquiry)
  {
    id: 'hd_rfq_customer',
    name: '客户询价单',
    name_en: 'CUSTOMER INQUIRY (INQ)',
    type: 'rfq',
    owner: 'customer',
    version: '1.0',
    lastModified: '2024-01-15',
    description: '客户询价单（Home Depot客户询价）',

    layout: {
      pageSize: 'Letter',
      orientation: 'portrait',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    },

    sections: [
      // Inquiry Header
      {
        id: 'rfq_header',
        name: 'rfq_header',
        title: '',
        layout: 'custom',
        fields: [
          {
            id: 'rfq_header_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="padding: 20px 40px; border-bottom: 4px solid #F96302;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <div style="font-size: 28px; font-weight: 900; color: #F96302; letter-spacing: -0.5px; margin-bottom: 8px;">
                      THE COSUN BM
                    </div>
                    <div style="font-size: 9px; color: #333; line-height: 1.4;">
                      <strong>PROCUREMENT DEPARTMENT</strong><br/>
                      2455 Paces Ferry Road, N.W.<br/>
                      Atlanta, Georgia 30339-4024<br/>
                      Phone: (770) 433-8211
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 4px;">
                      CUSTOMER
                    </div>
                    <div style="font-size: 24px; font-weight: 900; color: #F96302;">
                      INQUIRY
                    </div>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // Inquiry Details
      {
        id: 'rfq_details',
        name: 'rfq_details',
        title: 'INQUIRY DETAILS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        border: true,
        fields: [
          {
            id: 'xj_number',
            label: 'INQ NUMBER',
            type: 'text',
            required: true,
            width: '33%',
            defaultValue: 'INQ-HD-2024-0001',
            fontWeight: 'bold',
            fontSize: 11,
            backgroundColor: '#FFF8F0'
          },
          {
            id: 'rfq_date',
            label: 'INQUIRY DATE',
            type: 'date',
            required: true,
            width: '33%'
          },
          {
            id: 'quote_due_date',
            label: 'QUOTE DUE DATE',
            type: 'date',
            required: true,
            width: '33%',
            fontWeight: 'bold',
            backgroundColor: '#FFF8F0'
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
          },
          {
            id: 'project_name',
            label: 'PROJECT NAME',
            type: 'text',
            required: false,
            width: '50%'
          },
          {
            id: 'validity_period',
            label: 'QUOTE VALIDITY PERIOD',
            type: 'select',
            required: true,
            width: '50%',
            options: ['30 Days', '60 Days', '90 Days', '180 Days']
          }
        ]
      },

      // Vendor Information
      {
        id: 'vendor_info_rfq',
        name: 'vendor_info_rfq',
        title: 'VENDOR INFORMATION',
        layout: 'single',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'vendor_details_rfq',
            label: 'TO (VENDOR)',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 4,
            placeholder: 'Vendor Company Name\\nAddress\\nCity, State ZIP\\nCountry\\nContact Person & Email'
          }
        ]
      },

      // Items Requested
      {
        id: 'items_requested',
        name: 'items_requested',
        title: 'ITEMS REQUESTED FOR INQUIRY',
        layout: 'table',
        fields: [
          {
            id: 'rfq_items_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%',
            tableColumns: [
              { id: 'item_no', label: 'ITEM', width: '5%', type: 'number' },
              { id: 'hd_item_code', label: 'HD ITEM CODE', width: '12%', type: 'text' },
              { id: 'description', label: 'ITEM DESCRIPTION & SPECIFICATIONS', width: '35%', type: 'text' },
              { id: 'quantity', label: 'QUANTITY', width: '10%', type: 'number' },
              { id: 'uom', label: 'UOM', width: '8%', type: 'text' },
              { id: 'target_price', label: 'TARGET PRICE', width: '12%', type: 'currency' },
              { id: 'delivery_date', label: 'REQ. DELIVERY', width: '10%', type: 'date' },
              { id: 'notes', label: 'NOTES', width: '8%', type: 'text' }
            ],
            sampleRows: [
              {
                item_no: '1',
                hd_item_code: 'HD-DOL-12345',
                description: 'Premium Door Lock Set - Brushed Nickel Finish, Grade 1 Security, ANSI/BHMA A156.2',
                quantity: '10,000',
                uom: 'EA',
                target_price: '$22.00',
                delivery_date: '2024-03-01',
                notes: 'Sample required'
              }
            ]
          }
        ]
      },

      // Shipping & Delivery Requirements
      {
        id: 'shipping_requirements',
        name: 'shipping_requirements',
        title: 'SHIPPING & DELIVERY REQUIREMENTS',
        layout: 'triple',
        backgroundColor: '#F5F5F5',
        fields: [
          {
            id: 'delivery_location',
            label: 'DELIVERY LOCATION',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB Origin', 'FOB Destination - DC', 'Multiple DCs', 'Store Direct']
          },
          {
            id: 'incoterms_rfq',
            label: 'INCOTERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP', 'DAP']
          },
          {
            id: 'shipping_method',
            label: 'SHIPPING METHOD',
            type: 'select',
            required: false,
            width: '33%',
            options: ['Ocean', 'Air', 'Truck', 'Rail', 'Courier']
          },
          {
            id: 'packaging_requirements',
            label: 'PACKAGING REQUIREMENTS',
            type: 'text',
            required: false,
            width: '100%',
            placeholder: 'Specify any special packaging or labeling requirements...'
          }
        ]
      },

      // Commercial Terms
      {
        id: 'commercial_terms',
        name: 'commercial_terms',
        title: 'COMMERCIAL TERMS',
        layout: 'triple',
        backgroundColor: '#FFFBF5',
        fields: [
          {
            id: 'payment_terms_rfq',
            label: 'PREFERRED PAYMENT TERMS',
            type: 'select',
            required: true,
            width: '33%',
            options: ['Net 30', 'Net 60', 'Net 90', '2/10 Net 30', 'Letter of Credit']
          },
          {
            id: 'warranty_period',
            label: 'WARRANTY PERIOD',
            type: 'select',
            required: true,
            width: '33%',
            options: ['1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime']
          },
          {
            id: 'quality_certification',
            label: 'QUALITY CERTIFICATION',
            type: 'select',
            required: false,
            width: '33%',
            options: ['ISO 9001', 'CE', 'UL', 'ETL', 'ANSI', 'BHMA', 'Other']
          }
        ]
      },

      // Special Requirements
      {
        id: 'special_requirements',
        name: 'special_requirements',
        title: 'SPECIAL REQUIREMENTS & INSTRUCTIONS',
        layout: 'single',
        fields: [
          {
            id: 'special_requirements_text',
            label: '',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 4,
            placeholder: 'Enter any special requirements, testing needs, compliance requirements, or additional instructions...'
          }
        ]
      },

      // Quote Submission Instructions
      {
        id: 'submission_instructions',
        name: 'submission_instructions',
        title: '',
        layout: 'single',
        fields: [
          {
            id: 'instructions_html',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.8; padding: 16px; border: 2px solid #F96302; background: #FFFBF5;">
                <strong style="color: #F96302; font-size: 11px;">QUOTE SUBMISSION INSTRUCTIONS:</strong><br/><br/>
                
                <strong>1. QUOTE MUST INCLUDE:</strong><br/>
                • Itemized pricing for each product<br/>
                • Lead times and delivery schedules<br/>
                • Payment terms and conditions<br/>
                • Warranty information<br/>
                • Product specifications and datasheets<br/>
                • Samples (if applicable)<br/>
                • Certifications and compliance documents<br/><br/>
                
                <strong>2. SUBMISSION METHOD:</strong><br/>
                Please submit your quotation via email to the buyer contact listed above, referencing the inquiry number in the subject line.<br/><br/>
                
                <strong>3. EVALUATION CRITERIA:</strong><br/>
                Quotes will be evaluated based on price, quality, delivery time, payment terms, vendor capabilities, and past performance.<br/><br/>
                
                <strong>4. IMPORTANT NOTES:</strong><br/>
                • Late submissions will not be considered<br/>
                • Home Depot reserves the right to accept or reject any or all quotes<br/>
                • This inquiry does not constitute a purchase order or commitment to buy
              </div>
            `
          }
        ]
      }
    ],

    footer: {
      text: '© 2024 The Home Depot, Inc. This inquiry is confidential and intended only for the recipient vendor.',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: 'ISSUED BY (HOME DEPOT BUYER)',
            role: 'buyer',
            fields: ['signature', 'name', 'title', 'date']
          }
        ]
      }
    }
  },

  // 12. 福建高盛达富建材有限公司 - 中文采购合同
  {
    id: 'cosun_purchase_contract_cn',
    name: '福建高盛达富采购合同',
    name_en: 'Cosun Purchase Contract (Chinese)',
    type: 'purchase_contract',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-11-30',
    description: '福建高盛达富建材有限公司中文采购合同',
    
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
    },

    sections: [
      // 头部 - 公司信息和合同标题
      {
        id: 'header',
        name: 'header',
        title: '',
        layout: 'custom',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'company_header',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="text-align: center; padding: 20px 0; border-bottom: 4px solid #F96302;">
                <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 10px; letter-spacing: 2px;">
                  福建高盛达富建材有限公司
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
                  FUJIAN COSUN TUFF BUILDING MATERIALS CO., LTD.
                </div>
                <div style="font-size: 28px; font-weight: bold; color: #212121; margin-top: 15px;">
                  采购合同
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                  PURCHASE CONTRACT
                </div>
              </div>
            `
          }
        ]
      },

      // 合同基本信息
      {
        id: 'contract_info',
        name: 'contract_info',
        title: '合同信息',
        layout: 'double',
        backgroundColor: '#FFF8F0',
        border: true,
        fields: [
          {
            id: 'contract_no',
            label: '合同编号',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: 'COSUN-PC-2024-001',
            fontWeight: 'bold'
          },
          {
            id: 'contract_date',
            label: '合同日期',
            type: 'date',
            required: true,
            width: '50%',
            defaultValue: new Date().toISOString().split('T')[0]
          },
          {
            id: 'delivery_date',
            label: '交货日期',
            type: 'date',
            required: true,
            width: '50%'
          },
          {
            id: 'payment_terms',
            label: '付款方式',
            type: 'select',
            required: true,
            width: '50%',
            options: ['T/T 30%预付，70%见提单复印件', 'T/T 100%预付', 'L/C 即期', 'L/C 远期', 'D/P', 'D/A', 'O/A 30天', 'O/A 60天', 'O/A 90天']
          }
        ]
      },

      // 采购方和供应商信息（左右并排布局节约空间）
      {
        id: 'parties_info',
        name: 'parties_info',
        title: '合同双方信息',
        layout: 'custom',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'parties_layout',
            label: '',
            type: 'html',
            width: '100%',
            customHtml: `
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; padding: 10px;">
                <!-- 左侧：供应商（乙方/卖家） -->
                <div style="border: 2px solid #888; border-radius: 6px; padding: 12px; background: #FAFAFA;">
                  <h3 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: bold; border-bottom: 2px solid #888; padding-bottom: 6px;">
                    🏭 供应商（乙方）
                  </h3>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司名称 *</div>
                    <input type="text" placeholder="供应商公司名称" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; font-weight: bold;" />
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司地址 *</div>
                    <textarea placeholder="详细地址&#10;邮编：" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px; resize: vertical; min-height: 50px;"></textarea>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系人 *</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系电话 *</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">电子邮箱 *</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">统一社会信用代码</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                </div>
                
                <!-- 右侧：采购方（甲方/买家） -->
                <div style="border: 2px solid #F96302; border-radius: 6px; padding: 12px; background: #FFF8F0;">
                  <h3 style="margin: 0 0 12px 0; color: #F96302; font-size: 15px; font-weight: bold; border-bottom: 2px solid #F96302; padding-bottom: 6px;">
                    📋 采购方（甲方）
                  </h3>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司名称</div>
                    <div style="font-weight: bold; color: #212121; font-size: 13px;">福建高盛达富建材有限公司</div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">公司地址</div>
                    <div style="color: #212121; font-size: 12px; line-height: 1.4;">福建省福州市仓山区建新镇金山工业区<br/>邮编：350008</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系人</div>
                      <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                    <div>
                      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">联系电话</div>
                      <input type="text" placeholder="+86-591-XXXX-XXXX" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                    </div>
                  </div>
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">电子邮箱</div>
                    <input type="text" placeholder="purchase@cosun.com" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 3px;">统一社会信用代码</div>
                    <input type="text" placeholder="请输入" style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 12px;" />
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // 采购产品明细表
      {
        id: 'product_details',
        name: 'product_details',
        title: '产品明细',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'items_table',
            label: '',
            type: 'table',
            width: '100%',
            rows: 3,
            defaultValue: '福建省福州市仓山区建新镇金山工业区\n邮编：350008',
            backgroundColor: '#FFF8F0'
          },

        ]
      },

      // 供应商信息（乙方）
      {
        id: 'supplier_info',
        name: 'supplier_info',
        title: '供应商（乙方）',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'supplier_company',
            label: '公司名称',
            type: 'text',
            required: true,
            width: '100%',
            placeholder: '供应商公司名称',
            fontWeight: 'bold'
          },
          {
            id: 'supplier_address',
            label: '公司地址',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            placeholder: '详细地址\n邮编：'
          },
          {
            id: 'supplier_contact',
            label: '联系人',
            type: 'text',
            required: true,
            width: '50%'
          },
          {
            id: 'supplier_phone',
            label: '联系电话',
            type: 'text',
            required: true,
            width: '50%'
          },
          {
            id: 'supplier_email',
            label: '电子邮箱',
            type: 'text',
            required: true,
            width: '50%'
          },
          {
            id: 'supplier_tax_no',
            label: '统一社会信用代码',
            type: 'text',
            required: false,
            width: '50%'
          }
        ]
      },

      // 采购产品明细表
      {
        id: 'product_details',
        name: 'product_details',
        title: '产品明细',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'items_table',
            label: '',
            type: 'table',
            width: '100%',
            columns: [
              { id: 'item_no', label: '序号', width: '8%', type: 'text' },
              { id: 'product_name', label: '产品名称', width: '25%', type: 'text' },
              { id: 'specifications', label: '规格型号', width: '20%', type: 'text' },
              { id: 'unit', label: '单位', width: '8%', type: 'text' },
              { id: 'quantity', label: '数量', width: '10%', type: 'number' },
              { id: 'unit_price', label: '单价', width: '12%', type: 'number' },
              { id: 'amount', label: '金额', width: '12%', type: 'number' }
            ],
            defaultRows: [
              { item_no: '1', product_name: '', specifications: '', unit: '', quantity: '', unit_price: '', amount: '' },
              { item_no: '2', product_name: '', specifications: '', unit: '', quantity: '', unit_price: '', amount: '' },
              { item_no: '3', product_name: '', specifications: '', unit: '', quantity: '', unit_price: '', amount: '' },
              { item_no: '4', product_name: '', specifications: '', unit: '', quantity: '', unit_price: '', amount: '' },
              { item_no: '5', product_name: '', specifications: '', unit: '', quantity: '', unit_price: '', amount: '' }
            ]
          }
        ]
      },

      // 金额汇总
      {
        id: 'amount_summary',
        name: 'amount_summary',
        title: '金额汇总',
        layout: 'single',
        backgroundColor: '#FFF8F0',
        border: true,
        fields: [
          {
            id: 'subtotal',
            label: '小计金额',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: '¥0.00',
            alignment: 'right',
            fontWeight: 'bold'
          },
          {
            id: 'tax_rate',
            label: '税率',
            type: 'select',
            required: true,
            width: '25%',
            options: ['0%', '3%', '6%', '9%', '13%', '17%'],
            defaultValue: '13%'
          },
          {
            id: 'tax_amount',
            label: '税额',
            type: 'text',
            required: true,
            width: '25%',
            placeholder: '¥0.00',
            alignment: 'right'
          },
          {
            id: 'total_amount',
            label: '合同总额',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: '¥0.00',
            alignment: 'right',
            fontWeight: 'bold',
            fontSize: 14,
            backgroundColor: '#FFE5D0'
          },
          {
            id: 'total_amount_words',
            label: '合同总额（大写）',
            type: 'text',
            required: true,
            width: '50%',
            placeholder: '人民币：',
            fontWeight: 'bold'
          }
        ]
      },

      // 交货条款
      {
        id: 'delivery_terms',
        name: 'delivery_terms',
        title: '交货条款',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'delivery_location',
            label: '交货地点',
            type: 'text',
            required: true,
            width: '100%',
            placeholder: '福建省福州市仓山区金山工业区高盛达富仓库'
          },
          {
            id: 'delivery_method',
            label: '运输方式',
            type: 'select',
            required: true,
            width: '50%',
            options: ['供应商送货', '采购方自提', '物流配送', '快递', '海运', '空运']
          },
          {
            id: 'freight_terms',
            label: '运费承担',
            type: 'select',
            required: true,
            width: '50%',
            options: ['供应商承担', '采购方承担', '到付', 'FOB', 'CIF', 'CFR', 'EXW']
          },
          {
            id: 'delivery_remarks',
            label: '交货备注',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 2,
            placeholder: '其他交货相关说明'
          }
        ]
      },

      // 质量标准
      {
        id: 'quality_standards',
        name: 'quality_standards',
        title: '质量标准',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'quality_standard',
            label: '质量标准',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 3,
            defaultValue: '1. 产品须符合国家相关质量标准和行业规范\n2. 产品须提供合格证、检验报告等相关质量证明文件\n3. 产品包装完好，标识清晰'
          },
          {
            id: 'inspection_method',
            label: '验收方式',
            type: 'select',
            required: true,
            width: '50%',
            options: ['到货验收', '抽样检验', '全检', '第三方检测', '供应商自检']
          },
          {
            id: 'warranty_period',
            label: '质保期',
            type: 'select',
            required: true,
            width: '50%',
            options: ['3个月', '6个月', '12个月', '18个月', '24个月', '36个月']
          }
        ]
      },

      // 违约责任
      {
        id: 'breach_terms',
        name: 'breach_terms',
        title: '违约责任',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'breach_terms_content',
            label: '违约条款',
            type: 'textarea',
            required: true,
            width: '100%',
            rows: 4,
            defaultValue: '1. 乙方未按约定时间交货，每逾期一天按合同总额的0.5%支付违约金\n2. 产品质量不符合约定标准，甲方有权退货，乙方承担相关费用\n3. 甲方未按约定付款，每逾期一天按应付款项的0.3%支付违约金\n4. 任何一方违反合同其他条款，应赔偿对方因此造成的损失'
          }
        ]
      },

      // 争议解决
      {
        id: 'dispute_resolution',
        name: 'dispute_resolution',
        title: '争议解决',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'dispute_method',
            label: '争议解决方式',
            type: 'select',
            required: true,
            width: '50%',
            options: ['友好协商', '仲裁', '诉讼'],
            defaultValue: '友好协商'
          },
          {
            id: 'arbitration_location',
            label: '仲裁/诉讼地点',
            type: 'text',
            required: false,
            width: '50%',
            placeholder: '福建省福州市'
          },
          {
            id: 'applicable_law',
            label: '适用法律',
            type: 'text',
            required: true,
            width: '100%',
            defaultValue: '中华人民共和国合同法及相关法律法规'
          }
        ]
      },

      // 其他条款
      {
        id: 'other_terms',
        name: 'other_terms',
        title: '其他条款',
        layout: 'single',
        backgroundColor: '#FFFFFF',
        border: true,
        fields: [
          {
            id: 'contract_copies',
            label: '合同份数',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '本合同一式两份，甲乙双方各执一份，具有同等法律效力'
          },
          {
            id: 'contract_effective_date',
            label: '生效日期',
            type: 'text',
            required: true,
            width: '50%',
            defaultValue: '自双方签字盖章之日起生效'
          },
          {
            id: 'additional_terms',
            label: '补充条款',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: '其他补充说明事项'
          }
        ]
      },

      // 附件清单
      {
        id: 'attachments',
        name: 'attachments',
        title: '附件清单',
        layout: 'single',
        backgroundColor: '#FFF8F0',
        border: true,
        fields: [
          {
            id: 'attachment_list',
            label: '附件',
            type: 'textarea',
            required: false,
            width: '100%',
            rows: 3,
            placeholder: '附件1：产品规格书\n附件2：质量标准文件\n附件3：...'
          }
        ]
      }
    ],

    // 页脚：签名区域
    footer: {
      showPageNumber: true,
      text: '福建高盛达富建材有限公司 | Fujian Cosun Tuff Building Materials Co., Ltd. | 采购合同',
      signatureLines: {
        enabled: true,
        parties: [
          {
            label: '采购方（甲方）：福建高盛达富建材有限公司',
            role: 'buyer',
            fields: ['signature', 'company_seal', 'name', 'date']
          },
          {
            label: '供应商（乙方）：',
            role: 'supplier',
            fields: ['signature', 'company_seal', 'name', 'date']
          }
        ]
      }
    }
  }
];

export default hdTemplatesPart4;
