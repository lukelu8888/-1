import { AdvancedFormTemplate, PRESET_LAYOUTS } from '../formLayoutSystem';

// Part 3: 装箱单 & 对账单 & 订舱单 & 提单 & 产品规格书
const advancedTemplatesPart3: AdvancedFormTemplate[] = [
  // 6. 装箱单 - Packing List
  {
    id: 'packing_list_advanced',
    name: '装箱单（高级版）',
    name_en: 'PACKING LIST - ADVANCED',
    description: '详细的货物装箱清单，支持多箱号管理',
    type: 'packing_list',
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
      secondaryColor: '#0891B2',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'packing_header',
        name: 'packing_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '35% 65%', columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'company',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 22px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                THE COSUN BM
              </div>
              <div style="font-size: 8px; color: #333; line-height: 1.5;">
                福建高盛达富建材有限公司<br/>
                福州市建设路123号<br/>
                Tel: +86-591-8888-8888
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
                <div style="font-size: 26px; font-weight: 900; color: #000; margin-bottom: 4px;">
                  PACKING LIST
                </div>
                <div style="font-size: 13px; color: #F96302; font-weight: bold;">
                  装箱单
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Document Info
      {
        id: 'doc_info',
        name: 'doc_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F0F9FF',
        fields: [
          {
            id: 'packing_no',
            label: 'Packing List No. / 装箱单号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-PL-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'date',
            label: 'Date / 日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'invoice_ref',
            label: 'Invoice Ref. / 发票编号',
            type: 'text',
            grid: { row: 1, col: 9, colSpan: 4 },
          },
          
          {
            id: 'contract_no',
            label: 'Contract No. / 合同号',
            type: 'text',
            grid: { row: 2, col: 1, colSpan: 4 },
          },
          {
            id: 'po_no',
            label: 'PO No. / 订单号',
            type: 'text',
            grid: { row: 2, col: 5, colSpan: 4 },
          },
          {
            id: 'total_packages',
            label: 'Total Packages / 总箱数',
            type: 'number',
            grid: { row: 2, col: 9, colSpan: 4 },
            fontWeight: 'bold',
          },
        ],
      },
      
      // Shipping Info
      {
        id: 'shipping_info',
        name: 'shipping_info',
        title: 'SHIPPING INFORMATION / 货运信息',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'shipper',
            label: 'Shipper / 发货人',
            type: 'text',
            grid: { row: 1, col: 1 },
            defaultValue: 'Fujian Cosun Building Materials Co., Ltd.',
          },
          {
            id: 'consignee',
            label: 'Consignee / 收货人',
            type: 'text',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'port_of_loading',
            label: 'Port of Loading / 装运港',
            type: 'text',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'port_of_discharge',
            label: 'Port of Discharge / 目的港',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'vessel',
            label: 'Vessel / 船名',
            type: 'text',
            grid: { row: 3, col: 1 },
          },
          {
            id: 'container_no',
            label: 'Container No. / 柜号',
            type: 'text',
            grid: { row: 3, col: 2 },
          },
        ],
      },
      
      // Packing Details
      {
        id: 'packing_details',
        name: 'packing_details',
        title: 'PACKING DETAILS / 装箱明细',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'packing_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'carton_no', label: '箱号 / Carton', type: 'text', width: '80px', editable: true },
                { id: 'product', label: '产品 / Product', type: 'text', width: '160px', editable: true },
                { id: 'qty', label: '数量 / Qty', type: 'number', width: '70px', editable: true },
                { id: 'unit', label: '单位 / Unit', type: 'text', width: '60px', editable: true },
                { id: 'net_weight', label: '净重(kg) / N.W.', type: 'number', width: '90px', editable: true },
                { id: 'gross_weight', label: '毛重(kg) / G.W.', type: 'number', width: '90px', editable: true },
                { id: 'dimensions', label: '尺寸(cm) / Meas.', type: 'text', width: '120px', editable: true },
                { id: 'volume', label: '体积(m³) / CBM', type: 'number', width: '90px', editable: true },
              ],
              minRows: 10,
              maxRows: 100,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Summary
      {
        id: 'summary',
        name: 'summary',
        title: 'SUMMARY / 汇总',
        layout: {
          type: 'grid',
          grid: { columns: 4, columnGap: '16px', rowGap: '0' },
        },
        padding: '20px 30px',
        backgroundColor: '#FFF8F0',
        border: '2px 0 0 0',
        fields: [
          {
            id: 'total_cartons',
            label: 'Total Cartons / 总箱数',
            type: 'calculated',
            grid: { row: 1, col: 1 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          {
            id: 'total_net_weight',
            label: 'Total N.W. (kg) / 总净重',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          {
            id: 'total_gross_weight',
            label: 'Total G.W. (kg) / 总毛重',
            type: 'calculated',
            grid: { row: 1, col: 3 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          {
            id: 'total_volume',
            label: 'Total CBM / 总体积',
            type: 'calculated',
            grid: { row: 1, col: 4 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
        ],
      },
    ],
  },

  // 7. 对账单 - Statement
  {
    id: 'statement_advanced',
    name: '对账单（高级版）',
    name_en: 'STATEMENT OF ACCOUNT - ADVANCED',
    description: '客户往来对账单，支持多期账单管理',
    type: 'statement',
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
      secondaryColor: '#7C3AED',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'statement_header',
        name: 'statement_header',
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
            id: 'company',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 24px; font-weight: 900; color: #F96302; margin-bottom: 8px;">
                THE COSUN BM
              </div>
              <div style="font-size: 9px; color: #333; line-height: 1.6;">
                福建高盛达富建材有限公司<br/>
                Fujian Cosun Building Materials Co., Ltd.<br/>
                财务部 / Finance Department<br/>
                Tel: +86-591-8888-8888<br/>
                Email: finance@cosunbm.com
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
                <div style="font-size: 26px; font-weight: 900; color: #000; margin-bottom: 6px;">
                  STATEMENT OF ACCOUNT
                </div>
                <div style="font-size: 13px; color: #F96302; font-weight: bold;">
                  往来对账单
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Statement Info
      {
        id: 'statement_info',
        name: 'statement_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FAF5FF',
        fields: [
          {
            id: 'statement_no',
            label: 'Statement No. / 对账单号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-ST-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'statement_date',
            label: 'Statement Date / 对账日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'currency',
            label: 'Currency / 货币',
            type: 'select',
            grid: { row: 1, col: 9, colSpan: 4 },
            options: ['USD', 'EUR', 'CNY'],
            defaultValue: 'USD',
          },
          
          {
            id: 'period_from',
            label: 'Period From / 账期起',
            type: 'date',
            grid: { row: 2, col: 1, colSpan: 6 },
            required: true,
          },
          {
            id: 'period_to',
            label: 'Period To / 账期止',
            type: 'date',
            grid: { row: 2, col: 7, colSpan: 6 },
            required: true,
          },
        ],
      },
      
      // Customer Info
      {
        id: 'customer_info',
        name: 'customer_info',
        title: 'CUSTOMER INFORMATION / 客户信息',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'customer_name',
            label: 'Customer Name / 客户名称',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
          },
          {
            id: 'customer_code',
            label: 'Customer Code / 客户代码',
            type: 'text',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'contact',
            label: 'Contact / 联系人',
            type: 'text',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'phone',
            label: 'Phone / 电话',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
        ],
      },
      
      // Account Details
      {
        id: 'account_details',
        name: 'account_details',
        title: 'ACCOUNT DETAILS / 账目明细',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'details_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'date', label: '日期 / Date', type: 'date', width: '100px', editable: true },
                { id: 'doc_type', label: '类型 / Type', type: 'select', width: '100px', editable: true },
                { id: 'doc_no', label: '单据号 / Doc No.', type: 'text', width: '130px', editable: true },
                { id: 'description', label: '描述 / Description', type: 'text', width: '160px', editable: true },
                { id: 'debit', label: '借方 / Debit', type: 'number', width: '110px', editable: true },
                { id: 'credit', label: '贷方 / Credit', type: 'number', width: '110px', editable: true },
                { id: 'balance', label: '余额 / Balance', type: 'calculated', width: '120px', editable: false },
              ],
              minRows: 10,
              maxRows: 100,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Summary
      {
        id: 'account_summary',
        name: 'account_summary',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '60% 40%', columnGap: '20px', rowGap: '10px' },
        },
        padding: '20px 30px',
        backgroundColor: '#FFF8F0',
        border: '2px 0 0 0',
        fields: [
          {
            id: 'spacer',
            label: '',
            type: 'spacer',
            grid: { row: 1, col: 1, rowSpan: 4 },
          },
          {
            id: 'opening_balance',
            label: 'Opening Balance / 期初余额',
            type: 'number',
            grid: { row: 1, col: 2 },
            fontSize: 11,
            textAlign: 'right',
          },
          {
            id: 'total_debit',
            label: 'Total Debit / 借方合计',
            type: 'calculated',
            grid: { row: 2, col: 2 },
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'right',
          },
          {
            id: 'total_credit',
            label: 'Total Credit / 贷方合计',
            type: 'calculated',
            grid: { row: 3, col: 2 },
            fontSize: 11,
            fontWeight: 'bold',
            textAlign: 'right',
          },
          {
            id: 'closing_balance',
            label: 'Closing Balance / 期末余额',
            type: 'calculated',
            grid: { row: 4, col: 2 },
            fontSize: 13,
            fontWeight: 'bold',
            textAlign: 'right',
            backgroundColor: '#FFFFFF',
            padding: '10px',
            border: '2px solid #F96302',
          },
        ],
      },
      
      // Confirmation
      {
        id: 'confirmation',
        name: 'confirmation',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '40px', rowGap: '0' },
        },
        padding: '30px 30px',
        border: '2px 0 0 0',
        fields: [
          {
            id: 'cosun_confirm',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></div>
                <div style="font-size: 10px; font-weight: bold;">COSUN确认 / Confirmed by COSUN</div>
                <div style="font-size: 8px; color: #666;">日期 / Date: _______________</div>
              </div>
            `,
          },
          {
            id: 'customer_confirm',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></div>
                <div style="font-size: 10px; font-weight: bold;">客户确认 / Confirmed by Customer</div>
                <div style="font-size: 8px; color: #666;">日期 / Date: _______________</div>
              </div>
            `,
          },
        ],
      },
    ],
  },

  // 8. 订舱单 - Booking Order
  {
    id: 'booking_order_advanced',
    name: '订舱单（高级版）',
    name_en: 'BOOKING ORDER - ADVANCED',
    description: '货运订舱单，用于向货代订舱',
    type: 'booking',
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
      secondaryColor: '#0284C7',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'booking_header',
        name: 'booking_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '50% 50%', columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'shipper',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 8px;">
                SHIPPER / 发货人
              </div>
              <div style="font-size: 20px; font-weight: 900; color: #F96302; margin-bottom: 6px;">
                THE COSUN BM
              </div>
              <div style="font-size: 8px; color: #333; line-height: 1.6;">
                福建高盛达富建材有限公司<br/>
                福州市建设路123号, 福建省, 中国<br/>
                Tel: +86-591-8888-8888<br/>
                Email: export@cosunbm.com
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
                  BOOKING ORDER
                </div>
                <div style="font-size: 14px; color: #F96302; font-weight: bold;">
                  订舱单
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Booking Info
      {
        id: 'booking_info',
        name: 'booking_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F0F9FF',
        fields: [
          {
            id: 'booking_no',
            label: 'Booking No. / 订舱号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-BK-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'booking_date',
            label: 'Date / 日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'shipment_mode',
            label: 'Shipment Mode / 运输方式',
            type: 'select',
            grid: { row: 1, col: 9, colSpan: 4 },
            options: ['Ocean / 海运', 'Air / 空运'],
            defaultValue: 'Ocean / 海运',
          },
          
          {
            id: 'contract_ref',
            label: 'Contract Ref. / 合同号',
            type: 'text',
            grid: { row: 2, col: 1, colSpan: 6 },
          },
          {
            id: 'invoice_ref',
            label: 'Invoice Ref. / 发票号',
            type: 'text',
            grid: { row: 2, col: 7, colSpan: 6 },
          },
        ],
      },
      
      // Freight Forwarder
      {
        id: 'forwarder',
        name: 'forwarder',
        title: 'FREIGHT FORWARDER / 货代信息',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'forwarder_name',
            label: 'Forwarder Name / 货代名称',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
          },
          {
            id: 'forwarder_contact',
            label: 'Contact / 联系人',
            type: 'text',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'forwarder_email',
            label: 'Email / 邮箱',
            type: 'text',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'forwarder_phone',
            label: 'Phone / 电话',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
        ],
      },
      
      // Shipping Details
      {
        id: 'shipping_details',
        name: 'shipping_details',
        title: 'SHIPPING DETAILS / 货运详情',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'port_of_loading',
            label: 'Port of Loading / 装运港',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
            placeholder: 'e.g., Fuzhou, China',
          },
          {
            id: 'port_of_discharge',
            label: 'Port of Discharge / 目的港',
            type: 'text',
            grid: { row: 1, col: 2 },
            required: true,
            placeholder: 'e.g., Los Angeles, USA',
          },
          {
            id: 'etd',
            label: 'ETD / 预计离港',
            type: 'date',
            grid: { row: 2, col: 1 },
            required: true,
          },
          {
            id: 'eta',
            label: 'ETA / 预计到港',
            type: 'date',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'shipping_line',
            label: 'Shipping Line / 船公司',
            type: 'text',
            grid: { row: 3, col: 1 },
          },
          {
            id: 'vessel',
            label: 'Vessel / 船名',
            type: 'text',
            grid: { row: 3, col: 2 },
          },
          {
            id: 'container_type',
            label: 'Container Type / 柜型',
            type: 'select',
            grid: { row: 4, col: 1 },
            options: ['20GP', '40GP', '40HQ', '45HQ'],
          },
          {
            id: 'container_qty',
            label: 'Container Qty / 柜量',
            type: 'number',
            grid: { row: 4, col: 2 },
          },
        ],
      },
      
      // Consignee
      {
        id: 'consignee',
        name: 'consignee',
        title: 'CONSIGNEE / 收货人',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F8FAFC',
        fields: [
          {
            id: 'consignee_name',
            label: 'Name / 名称',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
          },
          {
            id: 'consignee_address',
            label: 'Address / 地址',
            type: 'textarea',
            grid: { row: 2, col: 1 },
            required: true,
          },
          {
            id: 'consignee_contact',
            label: 'Contact / 联系人',
            type: 'text',
            grid: { row: 3, col: 1 },
          },
        ],
      },
      
      // Cargo Details
      {
        id: 'cargo',
        name: 'cargo',
        title: 'CARGO DETAILS / 货物详情',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'cargo_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'item', label: '序号 / No.', type: 'number', width: '50px', editable: false },
                { id: 'description', label: '货物描述 / Description', type: 'text', width: '200px', editable: true },
                { id: 'packages', label: '件数 / Pkgs', type: 'number', width: '80px', editable: true },
                { id: 'gross_weight', label: '毛重(kg) / G.W.', type: 'number', width: '100px', editable: true },
                { id: 'volume', label: '体积(m³) / CBM', type: 'number', width: '100px', editable: true },
                { id: 'hs_code', label: 'HS Code', type: 'text', width: '100px', editable: true },
                { id: 'remarks', label: '备注 / Remarks', type: 'text', width: '120px', editable: true },
              ],
              minRows: 5,
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Summary
      {
        id: 'cargo_summary',
        name: 'cargo_summary',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 3, columnGap: '20px', rowGap: '0' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'total_packages',
            label: 'Total Packages / 总件数',
            type: 'calculated',
            grid: { row: 1, col: 1 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          {
            id: 'total_weight',
            label: 'Total Weight (kg) / 总重量',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
          {
            id: 'total_cbm',
            label: 'Total CBM / 总体积',
            type: 'calculated',
            grid: { row: 1, col: 3 },
            fontSize: 12,
            fontWeight: 'bold',
            textAlign: 'center',
          },
        ],
      },
      
      // Special Instructions
      {
        id: 'instructions',
        name: 'instructions',
        title: 'SPECIAL INSTRUCTIONS / 特殊要求',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'special_instructions',
            label: '',
            type: 'textarea',
            grid: { row: 1, col: 1 },
            placeholder: '请在此填写任何特殊要求或注意事项...',
          },
        ],
      },
    ],
  },

  // 9. 提单 - Bill of Lading
  {
    id: 'bill_of_lading_advanced',
    name: '提单（高级版）',
    name_en: 'BILL OF LADING - ADVANCED',
    description: '海运提单，国际贸易重要单据',
    type: 'bill_of_lading',
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
      secondaryColor: '#0F172A',
      fontFamily: 'Arial, sans-serif',
      fontSize: 9,
    },
    
    sections: [
      // Header
      {
        id: 'bl_header',
        name: 'bl_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '8px' },
        },
        padding: '20px 30px',
        border: '0 0 3px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'title',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: center;">
                <div style="font-size: 32px; font-weight: 900; color: #F96302; margin-bottom: 6px; letter-spacing: 2px;">
                  BILL OF LADING
                </div>
                <div style="font-size: 14px; font-weight: bold; color: #000;">
                  海运提单
                </div>
              </div>
            `,
          },
          {
            id: 'carrier',
            label: '',
            type: 'html',
            grid: { row: 2, col: 1 },
            customHtml: `
              <div style="text-align: center; font-size: 8px; color: #666; line-height: 1.5;">
                Issued by THE COSUN BM Shipping Department<br/>
                福建高盛达富建材有限公司 船运部<br/>
                Tel: +86-591-8888-8888 | Email: shipping@cosunbm.com
              </div>
            `,
          },
        ],
      },
      
      // B/L Info
      {
        id: 'bl_info',
        name: 'bl_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '10px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F8FAFC',
        fields: [
          {
            id: 'bl_no',
            label: 'B/L No. / 提单号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-BL-2024-000001',
            fontWeight: 'bold',
            fontSize: 10,
          },
          {
            id: 'bl_date',
            label: 'B/L Date / 提单日期',
            type: 'date',
            grid: { row: 1, col: 5, colSpan: 4 },
            required: true,
          },
          {
            id: 'bl_type',
            label: 'B/L Type / 提单类型',
            type: 'select',
            grid: { row: 1, col: 9, colSpan: 4 },
            options: ['Original / 正本', 'Copy / 副本', 'Sea Waybill / 电放'],
            defaultValue: 'Original / 正本',
          },
        ],
      },
      
      // Shipper, Consignee, Notify Party
      {
        id: 'parties',
        name: 'parties',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '12px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'shipper',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 4px; padding: 12px; background: #FFFFFF;">
                <div style="font-size: 10px; font-weight: bold; color: #F96302; margin-bottom: 8px;">
                  SHIPPER / 发货人
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.7; font-weight: bold;">
                  THE COSUN BM<br/>
                  Fujian Cosun Building Materials Co., Ltd.<br/>
                  福州市建设路123号, 福建省, 中国<br/>
                  Tel: +86-591-8888-8888
                </div>
              </div>
            `,
          },
          {
            id: 'consignee',
            label: '',
            type: 'html',
            grid: { row: 2, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 4px; padding: 12px; background: #FFFFFF;">
                <div style="font-size: 10px; font-weight: bold; color: #F96302; margin-bottom: 8px;">
                  CONSIGNEE / 收货人
                </div>
                <textarea placeholder="Enter consignee details..." style="width: 100%; height: 80px; padding: 6px; border: 1px solid #DDD; border-radius: 3px; font-size: 9px; resize: vertical;"></textarea>
              </div>
            `,
          },
          {
            id: 'notify_party',
            label: '',
            type: 'html',
            grid: { row: 3, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 4px; padding: 12px; background: #FFFFFF;">
                <div style="font-size: 10px; font-weight: bold; color: #F96302; margin-bottom: 8px;">
                  NOTIFY PARTY / 通知人
                </div>
                <textarea placeholder="Enter notify party details..." style="width: 100%; height: 60px; padding: 6px; border: 1px solid #DDD; border-radius: 3px; font-size: 9px; resize: vertical;"></textarea>
              </div>
            `,
          },
        ],
      },
      
      // Vessel & Voyage
      {
        id: 'vessel_info',
        name: 'vessel_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '16px', rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'vessel',
            label: 'Vessel / 船名',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
          },
          {
            id: 'voyage_no',
            label: 'Voyage No. / 航次',
            type: 'text',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'port_of_loading',
            label: 'Port of Loading / 装货港',
            type: 'text',
            grid: { row: 2, col: 1 },
            required: true,
          },
          {
            id: 'port_of_discharge',
            label: 'Port of Discharge / 卸货港',
            type: 'text',
            grid: { row: 2, col: 2 },
            required: true,
          },
          {
            id: 'place_of_delivery',
            label: 'Place of Delivery / 交货地',
            type: 'text',
            grid: { row: 3, col: 1 },
          },
          {
            id: 'final_destination',
            label: 'Final Destination / 最终目的地',
            type: 'text',
            grid: { row: 3, col: 2 },
          },
        ],
      },
      
      // Container & Cargo Details
      {
        id: 'cargo_details',
        name: 'cargo_details',
        title: 'CONTAINER & CARGO DETAILS / 货柜及货物详情',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'cargo_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'container_no', label: '柜号 / Container No.', type: 'text', width: '130px', editable: true },
                { id: 'seal_no', label: '封号 / Seal No.', type: 'text', width: '100px', editable: true },
                { id: 'description', label: '货物描述 / Description', type: 'text', width: '180px', editable: true },
                { id: 'packages', label: '件数 / Pkgs', type: 'number', width: '70px', editable: true },
                { id: 'gross_weight', label: '毛重(kg)', type: 'number', width: '90px', editable: true },
                { id: 'measurement', label: '体积(m³)', type: 'number', width: '90px', editable: true },
              ],
              minRows: 5,
              maxRows: 20,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Freight & Charges
      {
        id: 'freight',
        name: 'freight',
        title: 'FREIGHT & CHARGES / 运费',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '16px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F8FAFC',
        fields: [
          {
            id: 'freight_term',
            label: 'Freight / 运费条款',
            type: 'select',
            grid: { row: 1, col: 1 },
            options: ['Prepaid / 预付', 'Collect / 到付'],
            defaultValue: 'Prepaid / 预付',
          },
          {
            id: 'freight_amount',
            label: 'Freight Amount / 运费金额',
            type: 'number',
            grid: { row: 1, col: 2 },
          },
        ],
      },
      
      // Remarks
      {
        id: 'bl_remarks',
        name: 'bl_remarks',
        title: 'REMARKS / 备注',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'remarks',
            label: '',
            type: 'textarea',
            grid: { row: 1, col: 1 },
            placeholder: 'Enter any remarks or special notes...',
          },
        ],
      },
      
      // Signature
      {
        id: 'bl_signature',
        name: 'bl_signature',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '30px 30px',
        border: '3px 0 0 0',
        fields: [
          {
            id: 'carrier_signature',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: right;">
                <div style="font-size: 9px; color: #666; margin-bottom: 10px;">
                  Signed for and on behalf of the Carrier / 承运人签署
                </div>
                <div style="border-bottom: 2px solid #000; width: 300px; height: 60px; margin-left: auto; margin-bottom: 10px;"></div>
                <div style="font-size: 10px; font-weight: bold;">
                  THE COSUN BM SHIPPING
                </div>
                <div style="font-size: 8px; color: #666;">
                  Place: _____________ Date: _____________
                </div>
              </div>
            `,
          },
        ],
      },
    ],
  },

  // 10. 产品规格书 - Product Specification
  {
    id: 'product_spec_advanced',
    name: '产品规格书（高级版）',
    name_en: 'PRODUCT SPECIFICATION - ADVANCED',
    description: '详细的产品技术规格书',
    type: 'specification',
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
      secondaryColor: '#16A34A',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header
      {
        id: 'spec_header',
        name: 'spec_header',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: '30% 70%', columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          {
            id: 'company',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 22px; font-weight: 900; color: #F96302; margin-bottom: 6px;">
                COSUN BM
              </div>
              <div style="font-size: 8px; color: #333; line-height: 1.5;">
                福建高盛达富建材有限公司<br/>
                Building Materials Expert<br/>
                Since 2010
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
                  PRODUCT SPECIFICATION
                </div>
                <div style="font-size: 13px; color: #F96302; font-weight: bold;">
                  产品规格书
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Document Info
      {
        id: 'doc_info',
        name: 'doc_info',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 12, columnGap: '12px', rowGap: '8px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F0FDF4',
        fields: [
          {
            id: 'spec_no',
            label: 'Specification No. / 规格书编号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            required: true,
            defaultValue: 'COSUN-SPEC-2024-000001',
            fontWeight: 'bold',
          },
          {
            id: 'revision',
            label: 'Revision / 版本',
            type: 'text',
            grid: { row: 1, col: 5, colSpan: 4 },
            defaultValue: 'Rev. 1.0',
          },
          {
            id: 'date',
            label: 'Date / 日期',
            type: 'date',
            grid: { row: 1, col: 9, colSpan: 4 },
            required: true,
          },
        ],
      },
      
      // Product Info
      {
        id: 'product_info',
        name: 'product_info',
        title: 'PRODUCT INFORMATION / 产品信息',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'product_name',
            label: 'Product Name / 产品名称',
            type: 'text',
            grid: { row: 1, col: 1 },
            required: true,
            fontSize: 11,
            fontWeight: 'bold',
          },
          {
            id: 'product_code',
            label: 'Product Code / 产品编号',
            type: 'text',
            grid: { row: 1, col: 2 },
            required: true,
          },
          {
            id: 'category',
            label: 'Category / 类别',
            type: 'select',
            grid: { row: 2, col: 1 },
            options: ['Electrical / 电气', 'Plumbing / 卫浴', 'Hardware / 五金', 'Safety / 劳保'],
          },
          {
            id: 'brand',
            label: 'Brand / 品牌',
            type: 'text',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'model',
            label: 'Model / 型号',
            type: 'text',
            grid: { row: 3, col: 1 },
          },
          {
            id: 'origin',
            label: 'Country of Origin / 原产地',
            type: 'text',
            grid: { row: 3, col: 2 },
            defaultValue: 'China',
          },
        ],
      },
      
      // Technical Specifications
      {
        id: 'technical_specs',
        name: 'technical_specs',
        title: 'TECHNICAL SPECIFICATIONS / 技术规格',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFFBEB',
        fields: [
          {
            id: 'specs_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'parameter', label: '参数 / Parameter', type: 'text', width: '200px', editable: true },
                { id: 'value', label: '数值 / Value', type: 'text', width: '150px', editable: true },
                { id: 'unit', label: '单位 / Unit', type: 'text', width: '100px', editable: true },
                { id: 'tolerance', label: '公差 / Tolerance', type: 'text', width: '100px', editable: true },
                { id: 'test_method', label: '测试方法 / Test Method', type: 'text', width: '150px', editable: true },
              ],
              minRows: 8,
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
            },
          },
        ],
      },
      
      // Materials
      {
        id: 'materials',
        name: 'materials',
        title: 'MATERIALS / 材料',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'material_description',
            label: 'Material Description / 材料说明',
            type: 'textarea',
            grid: { row: 1, col: 1 },
            placeholder: 'Describe the materials used...',
          },
        ],
      },
      
      // Dimensions
      {
        id: 'dimensions',
        name: 'dimensions',
        title: 'DIMENSIONS / 尺寸',
        layout: {
          type: 'grid',
          grid: { columns: 3, columnGap: '16px', rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#F0FDF4',
        fields: [
          {
            id: 'length',
            label: 'Length / 长度 (mm)',
            type: 'number',
            grid: { row: 1, col: 1 },
          },
          {
            id: 'width',
            label: 'Width / 宽度 (mm)',
            type: 'number',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'height',
            label: 'Height / 高度 (mm)',
            type: 'number',
            grid: { row: 1, col: 3 },
          },
          {
            id: 'weight',
            label: 'Weight / 重量 (kg)',
            type: 'number',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'net_weight',
            label: 'Net Weight / 净重 (kg)',
            type: 'number',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'package_size',
            label: 'Package Size / 包装尺寸',
            type: 'text',
            grid: { row: 2, col: 3 },
          },
        ],
      },
      
      // Performance
      {
        id: 'performance',
        name: 'performance',
        title: 'PERFORMANCE / 性能',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '10px' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'performance_description',
            label: '',
            type: 'textarea',
            grid: { row: 1, col: 1 },
            placeholder: 'Describe product performance characteristics...',
          },
        ],
      },
      
      // Certifications
      {
        id: 'certifications',
        name: 'certifications',
        title: 'CERTIFICATIONS / 认证',
        layout: {
          type: 'grid',
          grid: { columns: 2, columnGap: '20px', rowGap: '10px' },
        },
        padding: '16px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'ce_mark',
            label: 'CE Mark',
            type: 'checkbox',
            grid: { row: 1, col: 1 },
          },
          {
            id: 'rohs',
            label: 'RoHS Compliant',
            type: 'checkbox',
            grid: { row: 1, col: 2 },
          },
          {
            id: 'ul',
            label: 'UL Listed',
            type: 'checkbox',
            grid: { row: 2, col: 1 },
          },
          {
            id: 'iso',
            label: 'ISO 9001',
            type: 'checkbox',
            grid: { row: 2, col: 2 },
          },
          {
            id: 'other_certs',
            label: 'Other Certifications / 其他认证',
            type: 'text',
            grid: { row: 3, col: 1, colSpan: 2 },
          },
        ],
      },
      
      // Remarks
      {
        id: 'spec_remarks',
        name: 'spec_remarks',
        title: 'REMARKS / 备注',
        layout: {
          type: 'grid',
          grid: { columns: 1, rowGap: '0' },
        },
        padding: '16px 30px',
        fields: [
          {
            id: 'remarks',
            label: '',
            type: 'textarea',
            grid: { row: 1, col: 1 },
            placeholder: 'Enter any additional notes or remarks...',
          },
        ],
      },
      
      // Approval
      {
        id: 'approval',
        name: 'approval',
        title: '',
        layout: {
          type: 'grid',
          grid: { columns: 3, columnGap: '20px', rowGap: '0' },
        },
        padding: '20px 30px',
        border: '2px 0 0 0',
        fields: [
          {
            id: 'prepared_by',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: center;">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 6px;">准备 / Prepared By</div>
                <div style="border-bottom: 2px solid #000; height: 50px; margin-bottom: 6px;"></div>
                <div style="font-size: 8px; color: #666;">Date: __________</div>
              </div>
            `,
          },
          {
            id: 'reviewed_by',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="text-align: center;">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 6px;">审核 / Reviewed By</div>
                <div style="border-bottom: 2px solid #000; height: 50px; margin-bottom: 6px;"></div>
                <div style="font-size: 8px; color: #666;">Date: __________</div>
              </div>
            `,
          },
          {
            id: 'approved_by',
            label: '',
            type: 'html',
            grid: { row: 1, col: 3 },
            customHtml: `
              <div style="text-align: center;">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 6px;">批准 / Approved By</div>
                <div style="border-bottom: 2px solid #000; height: 50px; margin-bottom: 6px;"></div>
                <div style="font-size: 8px; color: #666;">Date: __________</div>
              </div>
            `,
          },
        ],
      },
    ],
  },
];

export default advancedTemplatesPart3;
