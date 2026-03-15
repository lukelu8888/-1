// 表单模板配置文件
// Form Template Configuration

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'table' | 'image' | 'logo' | 'signature' | 'calculated';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // for select
  defaultValue?: any;
  width?: string; // 字段宽度
  position?: { x: number; y: number }; // 在A4纸上的位置
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  alignment?: 'left' | 'center' | 'right';
  calculation?: string; // for calculated fields
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  layout?: 'single' | 'double' | 'triple'; // 列布局
  border?: boolean;
  backgroundColor?: string;
}

export interface FormTemplate {
  id: string;
  name: string; // 表单名称
  name_en: string; // 英文名称
  type: 'ing' | 'qt' | 'sales_contract' | 'purchase_contract' | 'booking' | 'invoice' | 'packing_list' | 'statement' | 'custom';
  category: 'customer' | 'supplier' | 'internal';
  owner: 'customer' | 'cosun' | 'supplier'; // 表单所有人（决定使用哪个Logo）
  version: string;
  lastModified: string;
  createdBy: string;
  
  // A4页面设置 (210mm x 297mm)
  pageSettings: {
    size: 'A4';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number }; // mm
    header?: boolean;
    footer?: boolean;
  };
  
  // 表单结构
  header: {
    logo: {
      enabled: boolean;
      position: 'left' | 'center' | 'right';
      size: { width: number; height: number }; // mm
      source: 'customer' | 'cosun' | 'supplier';
    };
    companyInfo: {
      enabled: boolean;
      fields: string[]; // 公司名称、地址、电话等
    };
    title: {
      text: string;
      fontSize: number;
      alignment: 'left' | 'center' | 'right';
    };
  };
  
  sections: FormSection[];
  
  footer: {
    enabled: boolean;
    fields: string[]; // 签名、日期、页码等
    signatureLines?: {
      enabled: boolean;
      parties: Array<{ label: string; role: string }>;
    };
  };
  
  // 样式设置
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
  };
  
  // 数据映射（从业务数据到表单字段）
  dataMapping?: {
    [fieldId: string]: string; // fieldId -> dataPath
  };
}

// 默认表单模板库
export const formTemplates: FormTemplate[] = [
  {
    id: 'form_inquiry_001',
    name: '客户询价单',
    name_en: 'Customer Inquiry Form',
    type: 'ing',
    category: 'customer',
    owner: 'customer',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'system',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 50, height: 20 },
        source: 'customer'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'INQUIRY FORM / 询价单',
        fontSize: 18,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'basic_info',
        title: '基本信息 / Basic Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'inquiry_no', label: 'Inquiry No. / 询价单号', type: 'text', required: true, width: '50%' },
          { id: 'inquiry_date', label: 'Date / 日期', type: 'date', required: true, width: '50%' },
          { id: 'customer_name', label: 'Customer Name / 客户名称', type: 'text', required: true, width: '50%' },
          { id: 'contact_person', label: 'Contact Person / 联系人', type: 'text', width: '50%' },
          { id: 'email', label: 'Email / 邮箱', type: 'text', width: '50%' },
          { id: 'phone', label: 'Phone / 电话', type: 'text', width: '50%' },
          { id: 'target_market', label: 'Target Market / 目标市场', type: 'select', 
            options: ['North America / 北美', 'South America / 南美', 'Europe / 欧洲', 'Africa / 非洲'], width: '100%' }
        ]
      },
      {
        id: 'product_details',
        title: '产品明细 / Product Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'additional_info',
        title: '附加信息 / Additional Information',
        layout: 'single',
        fields: [
          { id: 'target_price', label: 'Target Price / 目标价格', type: 'text', width: '50%' },
          { id: 'expected_qty', label: 'Expected Quantity / 预计数量', type: 'number', width: '50%' },
          { id: 'delivery_date', label: 'Expected Delivery / 期望交期', type: 'date', width: '50%' },
          { id: 'payment_terms', label: 'Payment Terms / 付款方式', type: 'select',
            options: ['T/T', 'L/C', 'D/P', 'D/A', 'Other'], width: '50%' },
          { id: 'special_requirements', label: 'Special Requirements / 特殊要求', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date', 'page_number'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By / 制表人', role: 'customer' }
        ]
      }
    },
    styling: {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.5
    }
  },
  
  {
    id: 'form_quotation_001',
    name: 'Cosun报价单',
    name_en: 'Quotation / Price Quote',
    type: 'qt',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone', 'website']
      },
      title: {
        text: 'QUOTATION / 报价单',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'quote_info',
        title: '报价信息 / Quotation Information',
        layout: 'double',
        border: true,
        backgroundColor: '#f8fafc',
        fields: [
          { id: 'quotation_no', label: 'Quotation No. / 报价单号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'quotation_date', label: 'Date / 日期', type: 'date', required: true, width: '50%' },
          { id: 'valid_until', label: 'Valid Until / 有效期至', type: 'date', required: true, width: '50%' },
          { id: 'inquiry_ref', label: 'Inquiry Ref. / 询价单参考', type: 'text', width: '50%' },
          { id: 'sales_rep', label: 'Sales Representative / 业务员', type: 'text', width: '50%' },
          { id: 'region', label: 'Region / 区域', type: 'select',
            options: ['North America', 'South America', 'Europe-Africa'], width: '50%' }
        ]
      },
      {
        id: 'customer_info',
        title: '客户信息 / Customer Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'customer_name', label: 'Customer Name / 客户名称', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'contact_person', label: 'Contact Person / 联系人', type: 'text', width: '50%' },
          { id: 'email', label: 'Email / 邮箱', type: 'text', width: '50%' },
          { id: 'phone', label: 'Phone / 电话', type: 'text', width: '50%' },
          { id: 'delivery_address', label: 'Delivery Address / 收货地址', type: 'textarea', width: '50%' }
        ]
      },
      {
        id: 'products',
        title: '产品明细 / Product Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'pricing_summary',
        title: '价格汇总 / Pricing Summary',
        layout: 'single',
        border: true,
        backgroundColor: '#f1f5f9',
        fields: [
          { id: 'subtotal', label: 'Subtotal / 小计', type: 'calculated', calculation: 'sum(products)', width: '100%', alignment: 'right', fontWeight: 'bold' },
          { id: 'discount', label: 'Discount / 折扣', type: 'number', width: '100%', alignment: 'right' },
          { id: 'tax', label: 'Tax / 税费', type: 'calculated', calculation: 'subtotal * 0.0', width: '100%', alignment: 'right' },
          { id: 'total', label: 'Total Amount / 总金额', type: 'calculated', calculation: 'subtotal - discount + tax', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'terms',
        title: '条款和条件 / Terms & Conditions',
        layout: 'single',
        fields: [
          { id: 'payment_terms', label: 'Payment Terms / 付款条款', type: 'textarea', width: '100%',
            defaultValue: '30% deposit, 70% before shipment' },
          { id: 'delivery_terms', label: 'Delivery Terms / 交货条款', type: 'text', width: '50%',
            defaultValue: 'FOB China' },
          { id: 'lead_time', label: 'Lead Time / 交货期', type: 'text', width: '50%',
            defaultValue: '30-45 days after order confirmation' },
          { id: 'warranty', label: 'Warranty / 质保', type: 'text', width: '50%' },
          { id: 'remarks', label: 'Remarks / 备注', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'approved_by', 'date', 'page_number'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By / 制表人', role: 'sales_rep' },
          { label: 'Approved By / 审批人', role: 'sales_director' }
        ]
      }
    },
    styling: {
      primaryColor: '#0066cc',
      secondaryColor: '#475569',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_sales_contract_001',
    name: '销售合同',
    name_en: 'Sales Contract',
    type: 'sales_contract',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'SALES CONTRACT / 销售合同',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'contract_info',
        title: '合同信息 / Contract Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'contract_date', label: 'Date / 日期', type: 'date', required: true, width: '50%' },
          { id: 'quotation_ref', label: 'Quotation Ref. / 报价单参考', type: 'text', width: '50%' },
          { id: 'po_ref', label: 'Customer PO / 客户订单号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties',
        title: '合同双方 / Contract Parties',
        layout: 'double',
        border: true,
        fields: [
          { id: 'seller_name', label: 'Seller / 卖方', type: 'text', required: true, width: '100%', fontWeight: 'bold',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'seller_address', label: 'Address / 地址', type: 'textarea', width: '100%' },
          { id: 'buyer_name', label: 'Buyer / 买方', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'buyer_address', label: 'Address / 地址', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'products',
        title: '产品明细 / Product Specifications',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'total_amount',
        title: '合同金额 / Contract Value',
        layout: 'single',
        border: true,
        backgroundColor: '#fef3c7',
        fields: [
          { id: 'total_amount', label: 'Total Contract Value / 合同总金额', type: 'calculated', 
            calculation: 'sum(products)', width: '100%', alignment: 'center', fontWeight: 'bold', fontSize: 16 },
          { id: 'amount_in_words', label: 'Amount in Words / 大写金额', type: 'text', width: '100%', alignment: 'center' }
        ]
      },
      {
        id: 'terms',
        title: '合同条款 / Terms and Conditions',
        layout: 'single',
        fields: [
          { id: 'payment_terms', label: '1. Payment Terms / 付款条款', type: 'textarea', width: '100%', required: true },
          { id: 'delivery_terms', label: '2. Delivery Terms / 交货条款', type: 'textarea', width: '100%', required: true },
          { id: 'quality_warranty', label: '3. Quality & Warranty / 质量和质保', type: 'textarea', width: '100%' },
          { id: 'force_majeure', label: '4. Force Majeure / 不可抗力', type: 'textarea', width: '100%' },
          { id: 'dispute_resolution', label: '5. Dispute Resolution / 争议解决', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['signature', 'date', 'company_seal'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'For Seller (Cosun) / 卖方代表', role: 'sales_director' },
          { label: 'For Buyer / 买方代表', role: 'customer' }
        ]
      }
    },
    styling: {
      primaryColor: '#dc2626',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_purchase_contract_001',
    name: '采购合同',
    name_en: 'Purchase Contract',
    type: 'purchase_contract',
    category: 'supplier',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 15, bottom: 20, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'PURCHASE CONTRACT / 采购合同',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'contract_info',
        title: '合同信息 / Contract Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'po_no', label: 'PO No. / 采购单号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'po_date', label: 'Date / 日期', type: 'date', required: true, width: '50%' },
          { id: 'sales_order_ref', label: 'Sales Order Ref. / 销售订单号', type: 'text', width: '100%' }
        ]
      },
      {
        id: 'parties',
        title: '合同双方 / Contract Parties',
        layout: 'double',
        border: true,
        fields: [
          { id: 'buyer_name', label: 'Buyer / 买方', type: 'text', required: true, width: '100%', fontWeight: 'bold',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'buyer_contact', label: 'Contact / 联系人', type: 'text', width: '50%' },
          { id: 'buyer_phone', label: 'Phone / 电话', type: 'text', width: '50%' },
          { id: 'supplier_name', label: 'Supplier / 供应商', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'supplier_contact', label: 'Contact / 联系人', type: 'text', width: '50%' },
          { id: 'supplier_phone', label: 'Phone / 电话', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'products',
        title: '产品明细 / Product Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '采购产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'pricing',
        title: '价格汇总 / Pricing Summary',
        layout: 'single',
        border: true,
        backgroundColor: '#dbeafe',
        fields: [
          { id: 'subtotal', label: 'Subtotal / 小计', type: 'calculated', calculation: 'sum(products)', width: '100%', alignment: 'right', fontWeight: 'bold' },
          { id: 'total', label: 'Total Amount / 总金额', type: 'calculated', calculation: 'subtotal', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'terms',
        title: '采购条款 / Purchase Terms',
        layout: 'single',
        fields: [
          { id: 'payment_terms', label: 'Payment Terms / 付款条款', type: 'textarea', width: '100%' },
          { id: 'delivery_date', label: 'Delivery Date / 交货日期', type: 'date', width: '50%', required: true },
          { id: 'delivery_address', label: 'Delivery Address / 交货地址', type: 'textarea', width: '50%' },
          { id: 'quality_standards', label: 'Quality Standards / 质量标准', type: 'textarea', width: '100%' },
          { id: 'remarks', label: 'Remarks / 备注', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'approved_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Buyer (Cosun Procurement) / 买方（Cosun采购部）', role: 'procurement' },
          { label: 'Supplier / 供应商', role: 'supplier' }
        ]
      }
    },
    styling: {
      primaryColor: '#0891b2',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_commercial_invoice_001',
    name: '商业发票',
    name_en: 'Commercial Invoice',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone', 'tax_id']
      },
      title: {
        text: 'COMMERCIAL INVOICE / 商业发票',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'invoice_info',
        title: 'Invoice Information / 发票信息',
        layout: 'double',
        border: true,
        backgroundColor: '#fef3c7',
        fields: [
          { id: 'invoice_no', label: 'Invoice No. / 发票号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'invoice_date', label: 'Invoice Date / 开票日期', type: 'date', required: true, width: '50%' },
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', width: '50%' },
          { id: 'po_no', label: 'PO No. / 订单号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties',
        title: 'Shipper & Consignee / 发货人和收货人',
        layout: 'double',
        border: true,
        fields: [
          { id: 'shipper', label: 'Shipper / 发货人', type: 'textarea', required: true, width: '50%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.\nAddress: ...' },
          { id: 'consignee', label: 'Consignee / 收货人', type: 'textarea', required: true, width: '50%' }
        ]
      },
      {
        id: 'shipping_info',
        title: 'Shipping Details / 运输信息',
        layout: 'double',
        border: true,
        fields: [
          { id: 'port_of_loading', label: 'Port of Loading / 装货港', type: 'text', width: '50%' },
          { id: 'port_of_discharge', label: 'Port of Discharge / 卸货港', type: 'text', width: '50%' },
          { id: 'vessel', label: 'Vessel / 船名', type: 'text', width: '50%' },
          { id: 'voyage', label: 'Voyage / 航次', type: 'text', width: '50%' },
          { id: 'bl_no', label: 'B/L No. / 提单号', type: 'text', width: '50%' },
          { id: 'container_no', label: 'Container No. / 柜号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'products',
        title: 'Product Details / 货物明细',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'amount',
        title: 'Invoice Amount / 发票金额',
        layout: 'single',
        border: true,
        backgroundColor: '#dcfce7',
        fields: [
          { id: 'total_amount', label: 'Total Invoice Amount / 发票总金额', type: 'calculated', 
            calculation: 'sum(products)', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 14 },
          { id: 'amount_in_words', label: 'Amount in Words / 大写金额', type: 'text', width: '100%', alignment: 'center', fontWeight: 'bold' }
        ]
      },
      {
        id: 'additional',
        title: 'Additional Information / 附加信息',
        layout: 'single',
        fields: [
          { id: 'payment_terms', label: 'Payment Terms / 付款条款', type: 'text', width: '100%' },
          { id: 'terms_of_delivery', label: 'Terms of Delivery / 贸易条款', type: 'text', width: '50%', defaultValue: 'FOB' },
          { id: 'marks', label: 'Marks & Numbers / 唛头', type: 'textarea', width: '50%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['company_seal', 'signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'For and On Behalf of Shipper / 发货人授权签字', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: '#059669',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 9,
      lineHeight: 1.5
    }
  },

  {
    id: 'form_packing_list_001',
    name: '装箱单',
    name_en: 'Packing List',
    type: 'packing_list',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'PACKING LIST / 装箱单',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'packing_info',
        title: 'Packing List Information / 装箱单信息',
        layout: 'double',
        border: true,
        fields: [
          { id: 'packing_list_no', label: 'Packing List No. / 装箱单号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'date', label: 'Date / 日期', type: 'date', required: true, width: '50%' },
          { id: 'invoice_no', label: 'Invoice No. / 发票号', type: 'text', width: '50%' },
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties',
        title: 'Shipper & Consignee / 发货人和收货人',
        layout: 'double',
        border: true,
        fields: [
          { id: 'shipper', label: 'Shipper / 发货人', type: 'textarea', required: true, width: '50%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'consignee', label: 'Consignee / 收货人', type: 'textarea', required: true, width: '50%' }
        ]
      },
      {
        id: 'shipping_details',
        title: 'Shipping Details / 运输信息',
        layout: 'double',
        border: true,
        fields: [
          { id: 'container_no', label: 'Container No. / 柜号', type: 'text', width: '50%' },
          { id: 'seal_no', label: 'Seal No. / 封条号', type: 'text', width: '50%' },
          { id: 'vessel', label: 'Vessel / 船名', type: 'text', width: '50%' },
          { id: 'voyage', label: 'Voyage / 航次', type: 'text', width: '50%' },
          { id: 'port_of_loading', label: 'Port of Loading / 装货港', type: 'text', width: '50%' },
          { id: 'port_of_discharge', label: 'Port of Discharge / 卸货港', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'packing_details',
        title: 'Packing Details / 装箱明细',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'packing_table',
            label: '装箱清单',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'summary',
        title: 'Summary / 汇总',
        layout: 'single',
        border: true,
        backgroundColor: '#e0f2fe',
        fields: [
          { id: 'total_cartons', label: 'Total Cartons / 总箱数', type: 'calculated', calculation: 'sum(cartons)', width: '33%', alignment: 'center', fontWeight: 'bold' },
          { id: 'total_gross_weight', label: 'Total Gross Weight / 总毛重', type: 'calculated', calculation: 'sum(gross_weight)', width: '33%', alignment: 'center', fontWeight: 'bold' },
          { id: 'total_net_weight', label: 'Total Net Weight / 总净重', type: 'calculated', calculation: 'sum(net_weight)', width: '34%', alignment: 'center', fontWeight: 'bold' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By / 制表人', role: 'logistics' }
        ]
      }
    },
    styling: {
      primaryColor: '#0284c7',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 9,
      lineHeight: 1.5
    }
  },

  {
    id: 'form_deposit_invoice_001',
    name: '预付款发票',
    name_en: 'Deposit Invoice',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'bank_details', 'email', 'phone', 'tax_id']
      },
      title: {
        text: 'DEPOSIT INVOICE / 预付款发票',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'invoice_info',
        title: 'Invoice Information / 发票信息',
        layout: 'double',
        border: true,
        backgroundColor: '#fef3c7',
        fields: [
          { id: 'invoice_no', label: 'Invoice No. / 发票号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'invoice_date', label: 'Invoice Date / 开票日期', type: 'date', required: true, width: '50%' },
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', required: true, width: '50%' },
          { id: 'payment_type', label: 'Payment Type / 付款类型', type: 'text', width: '50%', defaultValue: 'Deposit 30%' }
        ]
      },
      {
        id: 'parties',
        title: 'Bill To / 账单接收方',
        layout: 'single',
        border: true,
        fields: [
          { id: 'customer_name', label: 'Customer Name / 客户名称', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'customer_address', label: 'Address / 地址', type: 'textarea', required: true, width: '100%' },
          { id: 'contact', label: 'Contact / 联系人', type: 'text', width: '50%' },
          { id: 'email', label: 'Email / 邮箱', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'payment_details',
        title: 'Payment Details / 付款明细',
        layout: 'single',
        border: true,
        fields: [
          { id: 'contract_total', label: 'Contract Total Amount / 合同总金额', type: 'number', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'deposit_percentage', label: 'Deposit Percentage / 预付比例', type: 'text', width: '50%', defaultValue: '30%' },
          { id: 'deposit_amount', label: 'Deposit Amount / 预付金额', type: 'calculated', calculation: 'contract_total * 0.3', width: '50%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'bank_info',
        title: 'Bank Information / 银行信息',
        layout: 'single',
        border: true,
        backgroundColor: '#e0f2fe',
        fields: [
          { id: 'bank_name', label: 'Bank Name / 银行名称', type: 'text', required: true, width: '100%' },
          { id: 'account_name', label: 'Account Name / 账户名称', type: 'text', required: true, width: '50%' },
          { id: 'account_number', label: 'Account Number / 账号', type: 'text', required: true, width: '50%' },
          { id: 'swift_code', label: 'SWIFT Code / SWIFT代码', type: 'text', width: '50%' },
          { id: 'bank_address', label: 'Bank Address / 银行地址', type: 'textarea', width: '50%' }
        ]
      },
      {
        id: 'terms',
        title: 'Payment Terms / 付款条款',
        layout: 'single',
        fields: [
          { id: 'payment_deadline', label: 'Payment Deadline / 付款期限', type: 'date', required: true, width: '50%' },
          { id: 'payment_method', label: 'Payment Method / 付款方式', type: 'select', 
            options: ['T/T Bank Transfer', 'L/C', 'Western Union'], width: '50%' },
          { id: 'remarks', label: 'Remarks / 备注', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['company_seal', 'signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized Signature / 授权签字', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: '#f59e0b',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_balance_invoice_001',
    name: '尾款发票',
    name_en: 'Balance Invoice',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'bank_details', 'email', 'phone', 'tax_id']
      },
      title: {
        text: 'BALANCE INVOICE / 尾款发票',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'invoice_info',
        title: 'Invoice Information / 发票信息',
        layout: 'double',
        border: true,
        backgroundColor: '#dcfce7',
        fields: [
          { id: 'invoice_no', label: 'Invoice No. / 发票号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'invoice_date', label: 'Invoice Date / 开票日期', type: 'date', required: true, width: '50%' },
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', required: true, width: '50%' },
          { id: 'deposit_invoice_ref', label: 'Deposit Invoice Ref. / 预付款发票号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties',
        title: 'Bill To / 账单接收方',
        layout: 'single',
        border: true,
        fields: [
          { id: 'customer_name', label: 'Customer Name / 客户名称', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'customer_address', label: 'Address / 地址', type: 'textarea', required: true, width: '100%' }
        ]
      },
      {
        id: 'payment_summary',
        title: 'Payment Summary / 付款汇总',
        layout: 'single',
        border: true,
        backgroundColor: '#f0fdf4',
        fields: [
          { id: 'contract_total', label: 'Contract Total Amount / 合同总金额', type: 'number', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'deposit_paid', label: 'Deposit Paid / 已付预付款', type: 'number', required: true, width: '50%' },
          { id: 'balance_due', label: 'Balance Due / 应付尾款', type: 'calculated', calculation: 'contract_total - deposit_paid', width: '50%', alignment: 'right', fontWeight: 'bold', fontSize: 14 },
          { id: 'production_status', label: 'Production Status / 生产状态', type: 'select',
            options: ['Ready for Shipment', 'In Production', 'Quality Check'], width: '100%' }
        ]
      },
      {
        id: 'bank_info',
        title: 'Bank Information / 银行信息',
        layout: 'single',
        border: true,
        backgroundColor: '#e0f2fe',
        fields: [
          { id: 'bank_name', label: 'Bank Name / 银行名称', type: 'text', required: true, width: '100%' },
          { id: 'account_name', label: 'Account Name / 账户名称', type: 'text', required: true, width: '50%' },
          { id: 'account_number', label: 'Account Number / 账号', type: 'text', required: true, width: '50%' },
          { id: 'swift_code', label: 'SWIFT Code / SWIFT代码', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'terms',
        title: 'Payment Terms / 付款条款',
        layout: 'single',
        fields: [
          { id: 'payment_deadline', label: 'Payment Deadline / 付款期限', type: 'date', required: true, width: '50%' },
          { id: 'shipment_condition', label: 'Shipment Condition / 发货条件', type: 'text', width: '50%', 
            defaultValue: 'Before Shipment / 发货前' },
          { id: 'remarks', label: 'Remarks / 备注', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['company_seal', 'signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized Signature / 授权签字', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: '#16a34a',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_delivery_note_001',
    name: '供应商发货单',
    name_en: 'Supplier Delivery Note',
    type: 'custom',
    category: 'supplier',
    owner: 'supplier',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'supplier'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'DELIVERY NOTE / 发货单',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'delivery_info',
        title: 'Delivery Information / 发货信息',
        layout: 'double',
        border: true,
        backgroundColor: '#fef3c7',
        fields: [
          { id: 'delivery_note_no', label: 'Delivery Note No. / 发货单号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'delivery_date', label: 'Delivery Date / 发货日期', type: 'date', required: true, width: '50%' },
          { id: 'po_no', label: 'PO No. / 采购订单号', type: 'text', required: true, width: '50%' },
          { id: 'contract_no', label: 'Contract No. / 合同号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties',
        title: 'Delivery Details / 交货详情',
        layout: 'double',
        border: true,
        fields: [
          { id: 'supplier_name', label: 'Supplier / 供应商', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'buyer_name', label: 'Buyer / 买方', type: 'text', required: true, width: '50%', fontWeight: 'bold',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'delivery_address', label: 'Delivery Address / 交货地址', type: 'textarea', required: true, width: '100%' },
          { id: 'contact_person', label: 'Contact Person / 联系人', type: 'text', width: '50%' },
          { id: 'contact_phone', label: 'Contact Phone / 联系电话', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'products',
        title: 'Product Details / 产品明细',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: '发货产品列表',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'logistics',
        title: 'Logistics Information / 物流信息',
        layout: 'double',
        border: true,
        backgroundColor: '#e0f2fe',
        fields: [
          { id: 'transport_method', label: 'Transport Method / 运输方式', type: 'select',
            options: ['Truck', 'Rail', 'Air', 'Sea'], width: '50%' },
          { id: 'vehicle_plate', label: 'Vehicle Plate / 车牌号', type: 'text', width: '50%' },
          { id: 'driver_name', label: 'Driver Name / 司机姓名', type: 'text', width: '50%' },
          { id: 'driver_phone', label: 'Driver Phone / 司机电话', type: 'text', width: '50%' },
          { id: 'estimated_arrival', label: 'Estimated Arrival / 预计到达', type: 'date', width: '50%' },
          { id: 'tracking_number', label: 'Tracking Number / 追踪号', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'remarks',
        title: 'Additional Information / 附加信息',
        layout: 'single',
        fields: [
          { id: 'quality_certificate', label: 'Quality Certificate / 质检证书', type: 'text', width: '50%' },
          { id: 'special_notes', label: 'Special Notes / 特别说明', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'received_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Delivered By (Supplier) / 发货人', role: 'supplier' },
          { label: 'Received By (Cosun) / 收货人', role: 'procurement' }
        ]
      }
    },
    styling: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'form_statement_001',
    name: '对账单',
    name_en: 'Statement of Account',
    type: 'statement',
    category: 'customer',
    owner: 'cosun',
    version: '1.0',
    lastModified: '2024-01-15',
    createdBy: 'admin',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      header: true,
      footer: true
    },
    header: {
      logo: {
        enabled: true,
        position: 'left',
        size: { width: 60, height: 24 },
        source: 'cosun'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'STATEMENT OF ACCOUNT / 对账单',
        fontSize: 20,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'statement_info',
        title: 'Statement Information / 对账单信息',
        layout: 'double',
        border: true,
        backgroundColor: '#ede9fe',
        fields: [
          { id: 'statement_no', label: 'Statement No. / 对账单号', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'statement_date', label: 'Statement Date / 对账日期', type: 'date', required: true, width: '50%' },
          { id: 'period_from', label: 'Period From / 账期起', type: 'date', required: true, width: '50%' },
          { id: 'period_to', label: 'Period To / 账期止', type: 'date', required: true, width: '50%' }
        ]
      },
      {
        id: 'customer_info',
        title: 'Customer Information / 客户信息',
        layout: 'single',
        border: true,
        fields: [
          { id: 'customer_name', label: 'Customer Name / 客户名称', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'customer_code', label: 'Customer Code / 客户编号', type: 'text', width: '50%' },
          { id: 'contact_person', label: 'Contact Person / 联系人', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'transaction_details',
        title: 'Transaction Details / 交易明细',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'transactions_table',
            label: '交易记录',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'summary',
        title: 'Summary / 汇总',
        layout: 'single',
        border: true,
        backgroundColor: '#fef3c7',
        fields: [
          { id: 'opening_balance', label: 'Opening Balance / 期初余额', type: 'number', width: '50%', alignment: 'right' },
          { id: 'total_invoiced', label: 'Total Invoiced / 开票总额', type: 'calculated', calculation: 'sum(invoices)', width: '50%', alignment: 'right', fontWeight: 'bold' },
          { id: 'total_received', label: 'Total Received / 收款总额', type: 'calculated', calculation: 'sum(payments)', width: '50%', alignment: 'right', fontWeight: 'bold' },
          { id: 'closing_balance', label: 'Closing Balance / 期末余额', type: 'calculated', 
            calculation: 'opening_balance + total_invoiced - total_received', width: '50%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'outstanding',
        title: 'Outstanding Items / 未结项目',
        layout: 'single',
        border: true,
        backgroundColor: '#fee2e2',
        fields: [
          {
            id: 'outstanding_table',
            label: '未结项目明细',
            type: 'table',
            width: '100%'
          }
        ]
      },
      {
        id: 'payment_reminder',
        title: 'Payment Information / 付款信息',
        layout: 'single',
        fields: [
          { id: 'payment_due_date', label: 'Payment Due Date / 付款截止日期', type: 'date', width: '50%' },
          { id: 'payment_terms', label: 'Payment Terms / 付款条款', type: 'text', width: '50%' },
          { id: 'remarks', label: 'Remarks / 备注', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'confirmed_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By (Cosun Finance) / 制表人', role: 'finance' },
          { label: 'Confirmed By (Customer) / 客户确认', role: 'customer' }
        ]
      }
    },
    styling: {
      primaryColor: '#6366f1',
      secondaryColor: '#64748b',
      fontFamily: 'Arial, sans-serif',
      fontSize: 9,
      lineHeight: 1.5
    }
  }
];

// 字段类型选项
export const fieldTypes = [
  { value: 'text', label: 'Text / 文本' },
  { value: 'number', label: 'Number / 数字' },
  { value: 'date', label: 'Date / 日期' },
  { value: 'textarea', label: 'Textarea / 多行文本' },
  { value: 'select', label: 'Select / 下拉选择' },
  { value: 'table', label: 'Table / 表格' },
  { value: 'calculated', label: 'Calculated / 计算字段' },
  { value: 'logo', label: 'Logo / 标志' },
  { value: 'signature', label: 'Signature / 签名' }
];

// 表单所有人选项
export const formOwners = [
  { value: 'customer', label: 'Customer / 客户', color: '#3b82f6' },
  { value: 'cosun', label: 'Cosun / 高盛达富', color: '#0066cc' },
  { value: 'supplier', label: 'Supplier / 供应商', color: '#10b981' }
];

// 表单类型选项
export const formTypeOptions = [
  { value: 'ing', label: 'Inquiry Form / 询价单', icon: '📋' },
  { value: 'qt', label: 'Quotation / 报价单', icon: '💰' },
  { value: 'sales_contract', label: 'Sales Contract / 销售合同', icon: '📝' },
  { value: 'purchase_contract', label: 'Purchase Contract / 采购合同', icon: '🛒' },
  { value: 'booking', label: 'Booking Form / 订舱单', icon: '🚢' },
  { value: 'invoice', label: 'Commercial Invoice / 商业发票', icon: '🧾' },
  { value: 'packing_list', label: 'Packing List / 装箱单', icon: '📦' },
  { value: 'statement', label: 'Statement of Account / 对账单', icon: '💳' },
  { value: 'custom', label: 'Custom Form / 自定义表单', icon: '⚙️' }
];

export default formTemplates;
