// 🔥 升级版表单模板 - 使用高级网格布局系统
// Advanced Form Templates with Grid Layout System

import { AdvancedFormTemplate, PRESET_LAYOUTS } from './formLayoutSystem';

const advancedFormTemplates: AdvancedFormTemplate[] = [
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

  // 3. 客户询价单 - Customer Inquiry Form
  {
    id: 'customer_inquiry_advanced',
    name: '客户询价单（高级版）',
    name_en: 'CUSTOMER INQUIRY FORM - ADVANCED',
    description: '使用12列网格系统，客户向COSUN提交产品询价',
    type: 'inquiry',
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
    type: 'quotation',
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

export default advancedFormTemplates;
