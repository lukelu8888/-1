import { AdvancedFormTemplate, PRESET_LAYOUTS } from '../formLayoutSystem';

// Part 1: 采购订单 & 商业发票
const advancedTemplatesPart1: AdvancedFormTemplate[] = [
  // 1. COSUN BM 采购订单 - 升级版
  {
    id: 'cosun_po_advanced',
    name: 'COSUN BM 采购订单（高级版）',
    name_en: 'THE COSUN BM PURCHASE ORDER - ADVANCED',
    description: '使用12列网格系统，支持灵活布局和精确定位',
    type: 'purchase_order',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15, unit: 'mm' },
      multiPage: true,
    },
    
    styling: {
      primaryColor: '#F96302',
      secondaryColor: '#FF8C42',
      accentColor: '#FFA500',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.4,
    },
    
    sections: [
      // ==================== Header Section ====================
      {
        id: 'header',
        name: 'header',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '40% 60%',
            columnGap: '20px',
            rowGap: '0',
          },
        },
        padding: '20px 30px',
        border: '0 0 4px 0',
        backgroundColor: '#FFFFFF',
        fields: [
          // Logo 和公司信息（左侧）
          {
            id: 'company_logo',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
            customHtml: `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 28px; font-weight: 900; color: #F96302; letter-spacing: -0.5px;">
                  THE COSUN BM
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.6;">
                  <strong>福建高盛达富建材有限公司</strong><br/>
                  Fujian Cosun Building Materials Co., Ltd.<br/>
                  福州市建设路123号, 福建省, 中国<br/>
                  电话: +86-591-8888-8888 | 传真: +86-591-8888-8889<br/>
                  邮箱: sales@cosunbm.com
                </div>
              </div>
            `,
          },
          
          // 文档标题和说明（右侧）
          {
            id: 'document_title',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
            customHtml: `
              <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: 900; color: #000; margin-bottom: 8px;">
                  PURCHASE ORDER
                </div>
                <div style="font-size: 9px; color: #666; line-height: 1.5;">
                  采购订单 | 此文件构成具有约束力的协议<br/>
                  This document constitutes a binding agreement
                </div>
              </div>
            `,
          },
        ],
      },
      
      // ==================== PO基本信息 - 使用12列网格 ====================
      {
        id: 'po_info',
        name: 'po_info',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: 12,  // 12列网格系统
            columnGap: '12px',
            rowGap: '6px',
          },
        },
        padding: '12px 30px',
        backgroundColor: '#FFF8F0',
        fields: [
          {
            id: 'po_number',
            label: 'PO NUMBER / 订单编号',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 3 },
            required: true,
            defaultValue: 'COSUN-PO-2024-000001',
            fontWeight: 'bold',
            fontSize: 11,
          },
          {
            id: 'po_date',
            label: 'PO DATE / 订单日期',
            type: 'date',
            grid: { row: 1, col: 4, colSpan: 3 },
            required: true,
            fontSize: 10,
          },
          {
            id: 'buyer_code',
            label: 'BUYER CODE / 采购员',
            type: 'text',
            grid: { row: 1, col: 7, colSpan: 3 },
            required: true,
            fontSize: 10,
          },
          {
            id: 'dept_number',
            label: 'DEPT # / 部门',
            type: 'text',
            grid: { row: 1, col: 10, colSpan: 3 },
            fontSize: 10,
          },
          
          // 第二行
          {
            id: 'ship_date',
            label: 'SHIP DATE / 发货日期',
            type: 'date',
            grid: { row: 2, col: 1, colSpan: 3 },
            required: true,
            fontSize: 10,
          },
          {
            id: 'cancel_date',
            label: 'CANCEL DATE / 取消日期',
            type: 'date',
            grid: { row: 2, col: 4, colSpan: 3 },
            fontSize: 10,
          },
          {
            id: 'fob_terms',
            label: 'FOB TERMS / 贸易条款',
            type: 'select',
            grid: { row: 2, col: 7, colSpan: 3 },
            options: ['FOB Origin', 'FOB Destination', 'CIF', 'CFR', 'EXW'],
            defaultValue: 'FOB Origin',
            fontSize: 10,
          },
          {
            id: 'ship_via',
            label: 'SHIP VIA / 运输方式',
            type: 'select',
            grid: { row: 2, col: 10, colSpan: 3 },
            options: ['Ocean / 海运', 'Air / 空运', 'Truck / 卡车', 'Rail / 铁路'],
            fontSize: 10,
          },
        ],
      },
      
      // ==================== 供应商和收货地址 - 双列布局 ====================
      {
        id: 'addresses',
        name: 'addresses',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '50% 50%',
            columnGap: '20px',
            rowGap: '0',
          },
        },
        padding: '12px 30px 8px 30px',  // 减少底部padding，让section更紧凑
        fields: [
          // 供应商地址（左侧）
          {
            id: 'vendor_address',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 4px; padding: 12px; background: #FFFFFF;">
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 8px; border-bottom: 1px solid #FFE0CC; padding-bottom: 4px;">
                  VENDOR / 供应商
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.6;">
                  <input type="text" placeholder="供应商名称 / Vendor Name" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="地址 / Address" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="城市, 省份, 邮编 / City, Province, ZIP" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="国家 / Country" style="width: 100%; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" />
                </div>
              </div>
            `,
          },
          
          // 收货地址（右侧）
          {
            id: 'ship_to_address',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="border: 2px solid #F96302; border-radius: 4px; padding: 12px; background: #FFFFFF;">
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 8px; border-bottom: 1px solid #FFE0CC; padding-bottom: 4px;">
                  SHIP TO / 收货地址
                </div>
                <div style="font-size: 9px; color: #333; line-height: 1.6;">
                  <input type="text" placeholder="仓库编号 / Warehouse #" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="收货地址 / Delivery Address" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="城市, 省份, 邮编 / City, Province, ZIP" style="width: 100%; margin-bottom: 4px; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" /><br/>
                  <input type="text" placeholder="收货时间 / Receiving Hours" style="width: 100%; padding: 4px; border: 1px solid #DDD; border-radius: 2px;" />
                </div>
              </div>
            `,
          },
        ],
      },
      
      // ==================== 产品明细表 - 使用表格组件 ====================
      {
        id: 'line_items',
        name: 'line_items',
        title: 'LINE ITEMS / 产品明细',
        layout: {
          type: 'grid',
          grid: {
            columns: 1,
            rowGap: '0',
          },
        },
        padding: '12px 30px 4px 30px',  // 减少底部padding，从12px改为4px
        fields: [
          {
            id: 'items_table',
            label: '',
            type: 'table',
            grid: { row: 1, col: 1 },
            tableConfig: {
              columns: [
                { id: 'line_no', label: '序号 / Line', type: 'number', width: '60px', editable: false },
                { id: 'sku', label: '产品编号 / SKU', type: 'text', width: '130px', editable: true },
                { id: 'description', label: '产品描述 / Description', type: 'text', width: '220px', editable: true },
                { id: 'qty', label: '数量 / Qty', type: 'number', width: '80px', editable: true },
                { id: 'uom', label: '单位 / UOM', type: 'select', width: '80px', editable: true },
                { id: 'unit_price', label: '单价 / Price', type: 'number', width: '100px', editable: true },
                { id: 'total', label: '小计 / Total', type: 'calculated', width: '120px', editable: false },
              ],
              minRows: 4,  // 增加默认行数，确保第1页有足够内容
              maxRows: 50,
              allowAdd: true,
              allowDelete: true,
              calculations: [
                { columnId: 'total', formula: 'qty * unit_price' },
              ],
            },
          },
        ],
      },
      
      // ==================== 金额汇总 - 右对齐布局 ====================
      {
        id: 'totals',
        name: 'totals',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '50% 50%',  // 调整为50/50，确保右侧内容不超出A4边界
            columnGap: '12px',   // 减少间距到12px，节省空间
            rowGap: '8px',
          },
        },
        padding: '8px 20px',  // 减少左右padding从30px到20px，确保在A4安全区内
        margin: '0',           // 移除默认margin
        backgroundColor: '#FFFFFF',
        fields: [
          // 左侧空白
          {
            id: 'spacer',
            label: '',
            type: 'spacer',
            grid: { row: 1, col: 1, rowSpan: 4 },
          },
          
          // 右侧金额汇总
          {
            id: 'subtotal',
            label: 'SUBTOTAL / 小计',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 11,
            textAlign: 'right',
            fontWeight: 'bold',
            padding: '4px 8px',  // 添加内边距
          },
          {
            id: 'tax',
            label: 'TAX / 税费',
            type: 'calculated',
            grid: { row: 2, col: 2 },
            fontSize: 11,
            textAlign: 'right',
            padding: '4px 8px',  // 添加内边距
          },
          {
            id: 'shipping',
            label: 'SHIPPING & HANDLING / 运费',
            type: 'number',
            grid: { row: 3, col: 2 },
            fontSize: 11,
            textAlign: 'right',
            padding: '4px 8px',  // 添加内边距
          },
          {
            id: 'total_amount',
            label: 'TOTAL AMOUNT / 总金额',
            type: 'calculated',
            grid: { row: 4, col: 2 },
            fontSize: 11,  // 减少字号从12到11，确保长文字不超出
            fontWeight: 'bold',
            textAlign: 'right',
            backgroundColor: '#FFF8F0',
            padding: '8px',  // 保持padding
            border: '2px solid #F96302',
            borderRadius: '4px',  // 添加圆角
          },
        ],
      },
      
      // ==================== 条款和备注 - 单列布局 ====================
      {
        id: 'terms',
        name: 'terms',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: 1,
            rowGap: '8px',
          },
        },
        padding: '8px 20px',  // 减少左右padding到20px，确保在A4安全区内
        fields: [
          {
            id: 'payment_terms',
            label: 'PAYMENT TERMS / 付款条款',
            type: 'select',
            grid: { row: 1, col: 1 },
            options: ['Net 30', 'Net 45', 'Net 60', '2/10 Net 30', 'T/T 30%预付', 'L/C at sight'],
            defaultValue: 'Net 30',
            fontSize: 10,
          },
          {
            id: 'special_instructions',
            label: 'SPECIAL INSTRUCTIONS / 特殊说明',
            type: 'textarea',
            grid: { row: 2, col: 1 },
            placeholder: 'Enter any special instructions or notes here...',
            fontSize: 9,
          },
          {
            id: 'terms_conditions',
            label: '',
            type: 'html',
            grid: { row: 3, col: 1 },
            customHtml: `
              <div style="font-size: 8px; color: #666; line-height: 1.5; border-top: 1px solid #DDD; padding-top: 12px;">
                <strong>条款与条件 / TERMS AND CONDITIONS:</strong><br/>
                1. 本采购订单受福建高盛达富建材有限公司标准条款约束 | This PO is subject to COSUN BM's standard terms.<br/>
                2. 供应商必须遵守所有适用的法律法规 | Supplier must comply with all applicable laws and regulations.<br/>
                3. 货物必须在指定发货日期前交付，否则订单可能被取消 | Goods must be delivered by the ship date or order may be cancelled.<br/>
                4. 所有发票必须引用PO编号并发送至：finance@cosunbm.com | All invoices must reference PO number.
              </div>
            `,
          },
        ],
      },
      
      // ==================== 签名区 - 三列布局 ====================
      {
        id: 'signatures',
        name: 'signatures',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: 3,
            columnGap: '20px',
            rowGap: '0',
          },
        },
        padding: '20px 30px',
        border: '2px 0 0 0',
        fields: [
          {
            id: 'buyer_signature',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></div>
                <div style="font-size: 9px; font-weight: bold;">采购方签名 / BUYER</div>
                <div style="font-size: 8px; color: #666;">日期 / Date: _______________</div>
              </div>
            `,
          },
          {
            id: 'vendor_signature',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></div>
                <div style="font-size: 9px; font-weight: bold;">供应商签名 / VENDOR</div>
                <div style="font-size: 8px; color: #666;">日期 / Date: _______________</div>
              </div>
            `,
          },
          {
            id: 'approval_signature',
            label: '',
            type: 'html',
            grid: { row: 1, col: 3 },
            customHtml: `
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></div>
                <div style="font-size: 9px; font-weight: bold;">审批签名 / APPROVAL</div>
                <div style="font-size: 8px; color: #666;">日期 / Date: _______________</div>
              </div>
            `,
          },
        ],
      },
    ],
  },
  
  // 2. COSUN BM 商业发票 - 展示复杂网格布局
  {
    id: 'cosun_invoice_advanced',
    name: 'COSUN BM 商业发票（高级版）',
    name_en: 'COSUN BM COMMERCIAL INVOICE - ADVANCED',
    description: '使用24列精细网格，支持复杂的表单布局',
    type: 'invoice',
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
      secondaryColor: '#1E3A8A',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
    },
    
    sections: [
      // Header with 24-column grid for precise positioning
      {
        id: 'invoice_header',
        name: 'invoice_header',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: 24,  // 24列精细网格
            columnGap: '4px',
            rowGap: '8px',
          },
        },
        padding: '20px',
        fields: [
          {
            id: 'company_name',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1, colSpan: 16 },
            customHtml: '<div style="font-size: 24px; font-weight: bold; color: #F96302;">THE COSUN BM</div><div style="font-size: 11px; color: #333; margin-top: 4px;">福建高盛达富建材有限公司</div>',
          },
          {
            id: 'invoice_title',
            label: '',
            type: 'html',
            grid: { row: 1, col: 17, colSpan: 8 },
            customHtml: '<div style="font-size: 20px; font-weight: bold; text-align: right; color: #F96302;">COMMERCIAL INVOICE</div><div style="font-size: 10px; text-align: right; color: #666; margin-top: 4px;">商业发票</div>',
          },
          
          // Company address - spans 16 columns
          {
            id: 'company_address',
            label: '',
            type: 'html',
            grid: { row: 2, col: 1, colSpan: 16, rowSpan: 2 },
            customHtml: `
              <div style="font-size: 9px; color: #333; line-height: 1.6;">
                Fujian Cosun Building Materials Co., Ltd.<br/>
                地址：福州市建设路123号, 福建省, 中国<br/>
                电话: +86-591-8888-8888 | 邮箱: sales@cosunbm.com<br/>
                网站: www.cosunbm.com
              </div>
            `,
          },
          
          // Invoice number and date - right side
          {
            id: 'invoice_no',
            label: 'Invoice No. / 发票编号',
            type: 'text',
            grid: { row: 2, col: 17, colSpan: 8 },
            fontSize: 10,
            fontWeight: 'bold',
            defaultValue: 'COSUN-INV-2024-000001',
          },
          {
            id: 'invoice_date',
            label: 'Invoice Date / 发票日期',
            type: 'date',
            grid: { row: 3, col: 17, colSpan: 8 },
            fontSize: 10,
          },
        ],
      },
      
      // Buyer and Seller Information
      {
        id: 'parties_info',
        name: 'parties_info',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '50% 50%',
            columnGap: '20px',
            rowGap: '0',
          },
        },
        padding: '0 20px 12px 20px',  // 减少底部padding
        fields: [
          {
            id: 'seller_info',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="border: 2px solid #F96302; padding: 12px; border-radius: 4px; background: #FFF9F5; height: 100%; min-height: 130px;">
                <div style="font-size: 11px; font-weight: bold; color: #F96302; margin-bottom: 8px; border-bottom: 1px solid #F96302; padding-bottom: 4px;">
                  SELLER / EXPORTER 卖方/出口商
                </div>
                <div style="font-size: 9px; line-height: 1.6; color: #333;">
                  <strong>Fujian Cosun Building Materials Co., Ltd.</strong><br/>
                  福建高盛达富建材有限公司<br/>
                  Add: No.123, Jianshe Road, Fuzhou, Fujian, China<br/>
                  Tel: +86-591-8888-8888<br/>
                  Email: sales@cosunbm.com<br/>
                  Website: www.cosunbm.com
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
              <div style="border: 2px solid #10B981; padding: 12px; border-radius: 4px; background: #F0FDF4; height: 100%; min-height: 130px;">
                <div style="font-size: 11px; font-weight: bold; color: #10B981; margin-bottom: 8px; border-bottom: 1px solid #10B981; padding-bottom: 4px;">
                  BUYER / CONSIGNEE 买方/收货人
                </div>
                <div style="font-size: 9px; line-height: 1.6; color: #333;">
                  <input type="text" placeholder="Company Name" style="width: 100%; border: none; background: transparent; margin-bottom: 4px; font-size: 9px; font-weight: bold;"/><br/>
                  <input type="text" placeholder="Address Line 1" style="width: 100%; border: none; background: transparent; margin-bottom: 4px; font-size: 9px;"/><br/>
                  <input type="text" placeholder="City, State, Country" style="width: 100%; border: none; background: transparent; margin-bottom: 4px; font-size: 9px;"/><br/>
                  <input type="text" placeholder="Tel: " style="width: 100%; border: none; background: transparent; font-size: 9px;"/>
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Shipping and Payment Info
      {
        id: 'shipping_payment_info',
        name: 'shipping_payment_info',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: 12,
            columnGap: '12px',
            rowGap: '10px',
          },
        },
        padding: '0 20px 12px 20px',  // 减少底部padding
        fields: [
          {
            id: 'port_of_loading',
            label: 'Port of Loading / 装运港',
            type: 'text',
            grid: { row: 1, col: 1, colSpan: 4 },
            fontSize: 9,
            defaultValue: 'Fuzhou, China',
          },
          {
            id: 'port_of_discharge',
            label: 'Port of Discharge / 目的港',
            type: 'text',
            grid: { row: 1, col: 5, colSpan: 4 },
            fontSize: 9,
          },
          {
            id: 'vessel_voyage',
            label: 'Vessel/Voyage / 船名航次',
            type: 'text',
            grid: { row: 1, col: 9, colSpan: 4 },
            fontSize: 9,
          },
          
          {
            id: 'payment_terms',
            label: 'Payment Terms / 付款条款',
            type: 'select',
            grid: { row: 2, col: 1, colSpan: 4 },
            fontSize: 9,
            options: ['T/T 30% Deposit, 70% Before Shipment', 'L/C at Sight', 'T/T 100% in Advance', 'T/T 30 Days'],
          },
          {
            id: 'trade_terms',
            label: 'Trade Terms / 贸易条款',
            type: 'select',
            grid: { row: 2, col: 5, colSpan: 4 },
            fontSize: 9,
            options: ['FOB Fuzhou', 'CIF', 'CFR', 'EXW'],
          },
          {
            id: 'delivery_date',
            label: 'Delivery Date / 交货日期',
            type: 'date',
            grid: { row: 2, col: 9, colSpan: 4 },
            fontSize: 9,
          },
        ],
      },
      
      // Product Items Table
      {
        id: 'invoice_items',
        name: 'invoice_items',
        title: 'ITEMS / 货物明细',
        layout: {
          type: 'flex',
        },
        padding: '0 20px 8px 20px',  // 减少底部padding，让section更紧凑
        fields: [
          {
            id: 'items_table',
            label: '',
            type: 'table',
            tableConfig: {
              columns: [
                { id: 'no', label: 'No.', width: '5%', type: 'text' },
                { id: 'description', label: 'Description of Goods / 货物描述', width: '30%', type: 'text' },
                { id: 'hs_code', label: 'HS Code', width: '12%', type: 'text' },
                { id: 'quantity', label: 'Quantity / 数量', width: '10%', type: 'number' },
                { id: 'unit', label: 'Unit / 单位', width: '8%', type: 'text' },
                { id: 'unit_price', label: 'Unit Price / 单价(USD)', width: '12%', type: 'number' },
                { id: 'amount', label: 'Amount / 金额(USD)', width: '13%', type: 'calculated' },
              ],
              minRows: 6,  // 减少行数，确保totals section能留在第1页
              showTotal: true,
              alternateRowColors: true,
              headerColor: '#F96302',
              headerTextColor: '#FFFFFF',
            },
            defaultValue: [
              {
                no: '1',
                description: 'Door Hardware Set - Stainless Steel',
                hs_code: '8302.41',
                quantity: 500,
                unit: 'Sets',
                unit_price: 12.50,
                amount: 6250.00,
              },
              {
                no: '2',
                description: 'Window Frame Bracket - Aluminum',
                hs_code: '7610.90',
                quantity: 1000,
                unit: 'Pcs',
                unit_price: 3.80,
                amount: 3800.00,
              },
            ],
          },
        ],
      },
      
      // Totals Section
      {
        id: 'totals_section',
        name: 'totals_section',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '50% 50%',  // 调整为50/50，给右侧更多空间显示内容
            columnGap: '12px',   // 保持间距
            rowGap: '8px',       // 添加行间距
          },
        },
        padding: '0 20px 12px 20px',  // 增加底部padding，避免太紧凑
        margin: '0',  // 移除默认margin
        fields: [
          {
            id: 'packing_marking',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1, rowSpan: 5 },
            customHtml: `
              <div style="border: 1px solid #DDD; padding: 12px; border-radius: 4px; height: 100%;">
                <div style="font-size: 10px; font-weight: bold; color: #333; margin-bottom: 8px;">
                  PACKING & MARKING / 包装及唛头
                </div>
                <textarea placeholder="Enter packing details and shipping marks..." style="width: 100%; height: 120px; border: 1px solid #E5E7EB; border-radius: 4px; padding: 8px; font-size: 9px; font-family: Arial; resize: none;">Standard Export Carton Packing
Shipping Mark: COSUN
Made in China</textarea>
              </div>
            `,
          },
          
          {
            id: 'subtotal',
            label: 'Subtotal / 小计',
            type: 'calculated',
            grid: { row: 1, col: 2 },
            fontSize: 10,
            fontWeight: 'bold',
            calculation: {
              type: 'sum',
              sourceTable: 'items_table',
              sourceColumn: 'amount',
            },
            textAlign: 'right',
            padding: '4px 8px',  // 添加内边距，确保内容有空间显示
          },
          {
            id: 'freight',
            label: 'Freight / 运费',
            type: 'number',
            grid: { row: 2, col: 2 },
            fontSize: 9,
            defaultValue: 0,
            textAlign: 'right',
            padding: '4px 8px',  // 添加内边距
          },
          {
            id: 'insurance',
            label: 'Insurance / 保险',
            type: 'number',
            grid: { row: 3, col: 2 },
            fontSize: 9,
            defaultValue: 0,
            textAlign: 'right',
            padding: '4px 8px',  // 添加内边距
          },
          {
            id: 'total',
            label: 'TOTAL / 总计',
            type: 'calculated',
            grid: { row: 4, col: 2 },
            fontSize: 11,  // 减少字号，确保长文字不超出A4边界
            fontWeight: 'bold',
            color: '#F96302',
            calculation: {
              type: 'formula',
              formula: 'subtotal + freight + insurance',
            },
            textAlign: 'right',
            padding: '8px',  // 添加内边距
            backgroundColor: '#FFF8F0',  // 保持背景色
            border: '2px solid #F96302',  // 保持边框
            borderRadius: '4px',  // 添加圆角
          },
          {
            id: 'currency_note',
            label: '',
            type: 'html',
            grid: { row: 5, col: 2 },
            customHtml: `
              <div style="font-size: 8px; color: #666; text-align: right; font-style: italic; margin-top: 4px;">
                Currency: United States Dollars (USD)
              </div>
            `,
          },
        ],
      },
      
      // Bank Information
      {
        id: 'bank_info',
        name: 'bank_info',
        title: 'BANK INFORMATION / 银行信息',
        layout: {
          type: 'flex',
        },
        padding: '12px 20px',  // 简化padding，四边均等
        margin: '0 20px',  // 使用margin来控制左右边距
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '4px',  // 添加圆角使其更美观
        fields: [
          {
            id: 'bank_details',
            label: '',
            type: 'html',
            customHtml: `
              <div style="font-size: 9px; line-height: 1.8; color: #333;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                  <div>
                    <strong>Beneficiary Bank / 受益银行:</strong><br/>
                    Bank of China, Fuzhou Branch<br/>
                    <strong>Swift Code:</strong> BKCHCNBJ950<br/>
                    <strong>Bank Address:</strong> No.88, Wuyi Road, Fuzhou, Fujian, China
                  </div>
                  <div>
                    <strong>Beneficiary / 受益人:</strong><br/>
                    Fujian Cosun Building Materials Co., Ltd.<br/>
                    <strong>Account No.:</strong> 1234 5678 9012 3456<br/>
                    <strong>IBAN:</strong> CN00 1234 5678 9012 3456 7890
                  </div>
                </div>
              </div>
            `,
          },
        ],
      },
      
      // Terms and Signature
      {
        id: 'footer_section',
        name: 'footer_section',
        title: '',
        layout: {
          type: 'grid',
          grid: {
            columns: '55% 45%',  // 调整列宽比例，确保右侧内容不超出A4边界
            columnGap: '12px',   // 减少间距，节省空间
            rowGap: '12px',
          },
        },
        padding: '0 20px 20px 20px',
        fields: [
          {
            id: 'terms',
            label: '',
            type: 'html',
            grid: { row: 1, col: 1 },
            customHtml: `
              <div style="font-size: 8px; line-height: 1.6; color: #555;">
                <strong style="color: #F96302;">TERMS & CONDITIONS / 条款与条件:</strong><br/>
                1. Payment must be received before shipment unless otherwise agreed.<br/>
                2. Goods remain property of seller until full payment is received.<br/>
                3. Any disputes shall be governed by the laws of P.R. China.<br/>
                4. This invoice is computer generated and valid without signature.
              </div>
            `,
          },
          {
            id: 'signature',
            label: '',
            type: 'html',
            grid: { row: 1, col: 2 },
            customHtml: `
              <div style="border-top: 2px solid #DDD; padding-top: 8px; margin-top: 20px;">
                <div style="font-size: 9px; color: #333; text-align: center;">
                  <strong>Authorized Signature / 授权签字</strong><br/>
                  <div style="height: 40px;"></div>
                  <div style="border-top: 1px solid #999; margin: 0 20px; padding-top: 4px; font-size: 8px;">
                    THE COSUN BM
                  </div>
                </div>
              </div>
            `,
          },
        ],
      },
    ],
  },

];

export default advancedTemplatesPart1;
