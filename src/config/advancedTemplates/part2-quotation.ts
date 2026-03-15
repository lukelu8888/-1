import { AdvancedFormTemplate, PRESET_LAYOUTS } from '../formLayoutSystem';

// Part 2: 询价单 & 报价单 & 销售合同
const advancedTemplatesPart2: AdvancedFormTemplate[] = [
  // 3. 客户询价单 - Customer Inquiry Form
  {
    id: 'customer_inquiry_advanced',
    name: '客户询价单（高级版）',
    name_en: 'CUSTOMER INQUIRY FORM - ADVANCED',
    description: '使用12列网格系统，客户向COSUN提交产品询价',
    type: 'ing',
    owner: 'customer',
    version: '2.0',
    lastModified: '2024-01-20',
    
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15, unit: 'mm' },
    },
    
    styling: {
      primaryColor: '#F96302',
      secondaryColor: '#2563EB',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'inquiry_header',
        name: 'inquiry_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '50% 50%', columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 20px',  // 减少左右padding到20px
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'header_left',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 26px; font-weight: 900; color: #2563EB;">
                INQUIRY FORM
              </div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                客户询价单
              </div>
            `,
          },
          {
            id: 'header_right',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="text-align: right; font-size: 9px; color: #333; line-height: 1.6;">
                <strong style="color: #F96302;">TO: THE COSUN BM</strong><br/>
                福建高盛达富建材有限公司<br/>
                Email: inquiry@cosunbm.com<br/>
                Tel: +86-591-8888-8888
              </div>
            `,
          },
        ],
      },
      
      // Customer Info - 12 column grid
      {
        id: 'customer_info',
        name: 'customer_info',
        title: 'CUSTOMER INFORMATION / 客户信息',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F8FAFC',
        fields: [
          {
            id: 'inquiry_no',
            label: 'Inquiry No. / 询价单号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'INQ-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'inquiry_date',
            label: 'Date / 日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'target_market',
            label: 'Target Market / 目标市场',
            type: 'select',
            grid: { row: 1, col: 9, colSpan: 4 },
            options: ['North America / 北美', 'South America / 南美', 'Europe / 欧洲', 'Africa / 非洲'],
          },
          
          {
            id: 'company_name',
            label: 'Company Name / 公司名称',
            type: 'text',
            grid: { row: 2, col: 1, colSpan: 6 },
            required: true,
          },
          {
            id: 'contact_person',
            label: 'Contact Person / 联系人',
            type: 'text',
            grid: { row: 2, col: 7, colSpan: 6 },
            required: true,
          },
          
          {
            id: 'email',
            label: 'Email / 邮箱',
            type: 'text',
            grid: { row: 3, col: 1, colSpan: 4 },
            required: true,
          },
          {
            id: 'phone',
            label: 'Phone / 电话',
            type: 'text',
            grid: { row: 3, col: 5, colSpan: 4 },
          },
          {
            id: 'country',
            label: 'Country / 国家',
            type: 'text',
            grid: { row: 3, col: 9, colSpan: 4 },
          },
        ],
      },
      
      // Product Details Table
      {
        id: 'products',
        name: 'products',
        title: 'PRODUCT DETAILS / 产品明细',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'product_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'item_no', label: '序号 / No.', type: 'number', width: '50px', editable: false },
                { id: 'category', label: '类别 / Category', type: 'select', width: '120px', editable: true },
                { id: 'product_name', label: '产品名称 / Product', type: 'text', width: '180px', editable: true },
                { id: 'specification', label: '规格 / Spec', type: 'text', width: '150px', editable: true },
                { id: 'quantity', label: '数量 / Qty', type: 'number', width: '80px', editable: true },
                { id: 'unit', label: '单位 / Unit', type: 'select', width: '80px', editable: true },
                { id: 'target_price', label: '目标价 / Target', type: 'number', width: '100px', editable: true },
                { id: 'remarks', label: '备注 / Remarks', type: 'text', width: '150px', editable: true },
              ],
              minRows: 5,
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Additional Requirements
      {
        id: 'requirements',
        name: 'requirements',
        title: 'ADDITIONAL REQUIREMENTS / 其他要求',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '12px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'delivery_terms',
            label: 'Delivery Terms / 交货条款',
            type: 'select',
            grid: { row: 1, col: 1 },
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP'],
          },
          {
            id: 'payment_terms',
            label: 'Payment Terms / 付款条款',
            type: 'select',
            grid: { row: 1, col: 2 },
            options: ['T/T 30%预付', 'T/T 全款', 'L/C at sight', 'Net 30', 'Net 60'],
          },
          {
            id: 'special_requirements',
            label: 'Special Requirements / 特殊要求',
            type: 'textarea',
            grid: { row: 2, col: 1, colSpan: 2 },
            placeholder: '请说明任何特殊要求，如包装、认证、交期等...',
          },
        ],
      },
    ],
  },

  // 4. COSUN 报价单 - Quotation
  {
    id: 'cosun_quotation_advanced',
    name: 'COSUN 报价单（高级版）',
    name_en: 'THE COSUN BM QUOTATION - ADVANCED',
    description: 'COSUN向客户提供的正式报价单，12列网格布局',
    type: 'qt',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15, unit: 'mm' },
    },
    
    styling: {
      primaryColor: '#F96302',
      secondaryColor: '#059669',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'quotation_header',
        name: 'quotation_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '40% 60%', columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'company_logo',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div style="font-size: 26px; font-weight: 900; color: #F96302; letter-spacing: -0.5px;">
                  THE COSUN BM
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.6;">
                  <strong>福建高盛达富建材有限公司</strong><br/>
                  Fujian Cosun Building Materials Co., Ltd.<br/>
                  福州市建设路123号, 福建省, 中国<br/>
                  电话: +86-591-8888-8888<br/>
                  邮箱: sales@cosunbm.com
                </div>
              </div>
            `,
          },
          {
            id: 'doc_title',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="text-align: right;">
                <div style="font-size: 28px; font-weight: 900; color: #000; margin-bottom: 6px;">
                  QUOTATION
                </div>
                <div style="font-size: 14px; color: #F96302; font-weight: bold;">
                  报价单
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Quotation Info
      {
        id: 'quote_info',
        name: 'quote_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'quote_no',
            label: 'Quotation No. / 报价单号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-QT-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'quote_date',
            label: 'Date / 日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'valid_until',
            label: 'Valid Until / 有效期至',
            type: 'date',
            grid: { row: 1, col: 9, colSpan: 4 },
            required: true,
          },
          
          {
            id: 'ref_inquiry',
            label: 'Ref. Inquiry / 询价参考',
            type: 'text',
            grid: { row: 2, col: 1, colSpan: 4 },
          },
          {
            id: 'sales_person',
            label: 'Sales Person / 销售员',
            type: 'text',
            grid: { row: 2, col: 5, colSpan: 4 },
          },
          {
            id: 'currency',
            label: 'Currency / 货币',
            type: 'select',
            grid: { row: 2, col: 9, colSpan: 4 },
            options: ['USD', 'EUR', 'CNY', 'GBP'],
            defaultValue: 'USD',
          },
        ],
      },
      
      // Customer Info
      {
        id: 'customer_section',
        name: 'customer_section',
        title: 'CUSTOMER INFORMATION / 客户信息',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'customer_name',
            label: 'Customer / 客户名称',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
          },
          {
            id: 'customer_contact',
            label: 'Contact / 联系人',
            type: 'text',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'customer_email',
            label: 'Email / 邮箱',
            type: 'text',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'customer_phone',
            label: 'Phone / 电话',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
        ],
      },
      
      // Products Table
      {
        id: 'quote_items',
        name: 'quote_items',
        title: 'QUOTATION ITEMS / 报价明细',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'quote_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'item', label: '序号 / Item', type: 'number', width: '50px', editable: false },
                { id: 'product_code', label: '产品编号 / Code', type: 'text', width: '120px', editable: true },
                { id: 'description', label: '描述 / Description', type: 'text', width: '200px', editable: true },
                { id: 'qty', label: '数量 / Qty', type: 'number', width: '80px', editable: true },
                { id: 'unit', label: '单位 / Unit', type: 'select', width: '70px', editable: true },
                { id: 'unit_price', label: '单价 / Price', type: 'number', width: '100px', editable: true },
                { id: 'amount', label: '金额 / Amount', type: 'calculated', width: '120px', editable: false },
              ],
              minRows: 5,
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
              calculations: [
                { columnId: 'amount', formula: 'qty * unit_price' },
              ],
            },
          },
        ],
      },
      
      // Totals
      {
        id: 'quote_totals',
        name: 'quote_totals',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '65% 35%', columnGap: '20px', rowGap: '8px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'spacer1',
            label: '',
            type: 'spacer',
            grid: { row: 1, col: 1, rowSpan: 3 },
          },
          {
            id: 'subtotal',
            label: 'SUBTOTAL / 小计',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'right',
          },
          {
            id: 'discount',
            label: 'DISCOUNT / 折扣',
            type: 'number',
            grid: { row: 2, col: 2 },
            fontSize: 11,
            textAlign: 'right',
          },
          {
            id: 'total',
            label: 'TOTAL / 总计',
            type: 'calculated',
            grid: { row: 3, col: 2 },
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'right',
            backgroundColor: '#FFF8F0',
            padding: '8px',
            border: '2px solid #F96302',
          },
        ],
      },
      
      // Terms
      {
        id: 'quote_terms',
        name: 'quote_terms',
        title: 'TERMS & CONDITIONS / 条款条件',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'delivery_terms',
            label: 'Delivery Terms / 交货条款',
            type: 'select',
            grid: { row: 1, col: 1 },
            options: ['FOB Origin', 'CIF', 'CFR', 'EXW', 'DDP'],
          },
          {
            id: 'payment_terms',
            label: 'Payment Terms / 付款条款',
            type: 'select',
            grid: { row: 1, col: 2 },
            options: ['T/T 30%预付', 'T/T 全款', 'L/C at sight', 'Net 30'],
          },
          {
            id: 'lead_time',
            label: 'Lead Time / 交货期',
            type: 'text',
            grid: { row: 2, col: 1 },
            placeholder: 'e.g., 30-45 days',
          },
          {
            id: 'warranty',
            label: 'Warranty / 质保期',
            type: 'text',
            grid: { row: 2, col: 2 },
            placeholder: 'e.g., 12 months',
          },
          {
            id: 'remarks',
            label: 'Remarks / 备注',
            type: 'textarea',
            grid: { row: 3, col: 1, colSpan: 2 },
          },
        ],
      },
    ],
  },

  // 5. 销售合同 - Sales Contract
  {
    id: 'sales_contract_advanced',
    name: '销售合同（高级版）',
    name_en: 'SALES CONTRACT - ADVANCED',
    description: 'COSUN与客户签订的正式销售合同',
    type: 'sales_contract',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15, unit: 'mm' },
    },
    
    styling: {
      primaryColor: '#F96302',
      secondaryColor: '#DC2626',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'contract_header',
        name: 'contract_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '12px' },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'title',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: center;">
                <div style="font-size: 28px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                  SALES CONTRACT
                </div>
                <div style="font-size: 16px; font-weight: bold; color: #000;">
                  销售合同
                </div>
              </div>
            `,
          },
          {
            id: 'company_info',
            label: '',
            type: 'html',
            grid: { row: 2, col: 1 },
            customHtml: `
              <div style="text-align: center; font-size: 9px; color: #666; line-height: 1.6;">
                THE COSUN BM - Fujian Cosun Building Materials Co., Ltd.<br/>
                福建高盛达富建材有限公司<br/>
                福州市建设路123号, 福建省, 中国 | Tel: +86-591-8888-8888 | Email: contract@cosunbm.com
              </div>
            `,
          },
        ],
      },
      
      // Contract Info
      {
        id: 'contract_info',
        name: 'contract_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'contract_no',
            label: 'Contract No. / 合同编号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-SC-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'contract_date',
            label: 'Date / 签订日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'effective_date',
            label: 'Effective Date / 生效日期',
            type: 'date',
            grid: { row: 1, col: 9, colSpan: 4 },
          },
        ],
      },
      
      // Parties
      {
        id: 'parties',
        name: 'parties',
        title: 'CONTRACT PARTIES / 合同双方',
        layout: {
          type: 'grid',
          grid: { columns: '50% 50%', columnGap: '20px', rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'seller_info',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 6px; padding: 14px; background: #FFFFFF;">
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 10px; border-bottom: 2px solid #FFE0CC; padding-bottom: 6px;">
                  SELLER / 卖方
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.7;">
                  <strong style="font-size: 10px;">THE COSUN BM</strong><br/>
                  福建高盛达富建材有限公司<br/>
                  Address: 福州市建设路123号<br/>
                  Tel: +86-591-8888-8888<br/>
                  Email: sales@cosunbm.com
                </div>
              </div>
            `,
          },
          {
            id: 'buyer_info',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 6px; padding: 14px; background: #FFFFFF;">
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 10px; border-bottom: 2px solid #FFE0CC; padding-bottom: 6px;">
                  BUYER / 买方
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.7;">
                  <input type="text" placeholder="Company Name / 公司名称" style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #DDD; border-radius: 3px; font-size: 9px;" /><br/>
                  <input type="text" placeholder="Address / 地址" style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #DDD; border-radius: 3px; font-size: 9px;" /><br/>
                  <input type="text" placeholder="Contact / 联系人" style="width: 100%; padding: 5px; border: 1px solid #DDD; border-radius: 3px; font-size: 9px;" />
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Contract Items
      {
        id: 'contract_items',
        name: 'contract_items',
        title: 'CONTRACT ITEMS / 合同条款',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'items_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'item', label: '序号 / No.', type: 'number', width: '50px', editable: false },
                { id: 'product', label: '产品 / Product', type: 'text', width: '180px', editable: true },
                { id: 'spec', label: '规格 / Spec', type: 'text', width: '140px', editable: true },
                { id: 'qty', label: '数量 / Qty', type: 'number', width: '80px', editable: true },
                { id: 'unit', label: '单位 / Unit', type: 'select', width: '70px', editable: true },
                { id: 'price', label: '单价 / Price', type: 'number', width: '100px', editable: true },
                { id: 'amount', label: '金额 / Amount', type: 'calculated', width: '120px', editable: false },
              ],
              minRows: 5,
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
              calculations: [
                { columnId: 'amount', formula: 'qty * price' },
              ],
            },
          },
        ],
      },
      
      // Total
      {
        id: 'contract_total',
        name: 'contract_total',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '65% 35%', columnGap: '20px', rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'spacer',
            label: '',
            type: 'spacer',
            grid: { row: 1, col: 1 },
          },
          {
            id: 'total_amount',
            label: 'TOTAL CONTRACT VALUE / 合同总额',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'right',
            backgroundColor: '#FFF8F0',
            padding: '12px',
            border: '3px solid #F96302',
          },
        ],
      },
      
      // Contract Terms
      {
        id: 'contract_terms',
        name: 'contract_terms',
        title: 'TERMS & CONDITIONS / 条款与条件',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'delivery_terms',
            label: 'Delivery Terms / 交货条款',
            type: 'select',
            grid: { row: 1, col: 1 },
            options: ['FOB', 'CIF', 'CFR', 'EXW', 'DDP'],
            required: true,
          },
          {
            id: 'payment_terms',
            label: 'Payment Terms / 付款条款',
            type: 'select',
            grid: { row: 1, col: 2 },
            options: ['T/T 30%预付70%尾款', 'L/C at sight', 'T/T 全款'],
            required: true,
          },
          {
            id: 'delivery_time',
            label: 'Delivery Time / 交货期',
            type: 'text',
            grid: { row: 2, col: 1 },
            required: true,
          },
          {
            id: 'port',
            label: 'Port / 港口',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'special_terms',
            label: 'Special Terms / 特殊条款',
            type: 'textarea',
            grid: { row: 3, col: 1, colSpan: 2 },
          },
        ],
      },
      
      // Signatures
      {
        id: 'signatures',
        name: 'signatures',
        title: 'SIGNATURES / 签署',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '40px', rowGap: '0' },
        },
        padding: '30px 30px',
        border: '3px 0 0 0',
        fields: [
          {
            id: 'seller_sig',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div>
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 10px;">
                  SELLER / 卖方
                </div>
                <div style="border-bottom: 2px solid #000; height: 70px; margin-bottom: 10px;"></div>
                <div style="font-size: 9px; color: #333;">
                  Signature / 签名: ___________________<br/><br/>
                  Name / 姓名: ___________________<br/><br/>
                  Date / 日期: ___________________
                </div>
              </div>
            `,
          },
          {
            id: 'buyer_sig',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div>
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 10px;">
                  BUYER / 买方
                </div>
                <div style="border-bottom: 2px solid #000; height: 70px; margin-bottom: 10px;"></div>
                <div style="font-size: 9px; color: #333;">
                  Signature / 签名: ___________________<br/><br/>
                  Name / 姓名: ___________________<br/><br/>
                  Date / 日期: ___________________
                </div>
              </div>
            `,
          },
        ],
      },
    ],
  },

];

export default advancedTemplatesPart2;
