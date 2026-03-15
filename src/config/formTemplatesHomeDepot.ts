// 🏢 Home Depot 风格表单模板配置
// Home Depot Design System - Professional B2B Style

import { FormTemplate } from './formTemplates';

// 🎨 Home Depot 设计系统色彩
export const HomeDepotColors = {
  // 主色调 - Home Depot 橙色
  primary: '#F96302',        // 标志性橙色
  primaryDark: '#E55A00',    // 深橙色
  primaryLight: '#FF7A1F',   // 浅橙色
  
  // 辅助色
  secondary: '#212121',      // 深灰黑
  secondaryLight: '#4A4A4A', // 中灰
  
  // 背景色
  bgLight: '#F7F7F7',        // 浅灰背景
  bgWhite: '#FFFFFF',        // 白色
  bgOrange: '#FFF4ED',       // 浅橙背景
  
  // 边框色
  border: '#D5D5D5',         // 边框灰
  borderLight: '#E8E8E8',    // 浅边框
  
  // 文字色
  textPrimary: '#212121',    // 主文字
  textSecondary: '#666666',  // 次要文字
  textLight: '#999999',      // 浅色文字
  
  // 功能色
  success: '#2D7A3E',        // 成功绿
  warning: '#F5A623',        // 警告黄
  error: '#D0021B',          // 错误红
  info: '#0071CE',           // 信息蓝（Home Depot蓝）
};

// 🎯 Home Depot 风格的表单模板
export const homeDepotFormTemplates: FormTemplate[] = [
  {
    id: 'hd_form_inquiry_001',
    name: '客户询价单 (Home Depot风格)',
    name_en: 'Customer Inquiry Form (HD Style)',
    type: 'ing',
    category: 'customer',
    owner: 'customer',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'system',
    description: '采用Home Depot专业B2B设计风格，橙色主色调，清晰的信息层次',
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
        size: { width: 55, height: 22 },
        source: 'customer'
      },
      companyInfo: {
        enabled: true,
        fields: ['company_name', 'address', 'contact', 'email', 'phone']
      },
      title: {
        text: 'PURCHASE INQUIRY',
        fontSize: 24,
        alignment: 'left'
      }
    },
    sections: [
      {
        id: 'inquiry_header',
        title: 'Inquiry Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'inquiry_no', label: 'Inquiry No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'inquiry_date', label: 'Date', type: 'date', required: true, width: '50%' },
          { id: 'project_name', label: 'Project Name', type: 'text', width: '50%' },
          { id: 'target_market', label: 'Target Market', type: 'select', 
            options: ['North America', 'South America', 'Europe', 'Africa'], width: '50%' }
        ]
      },
      {
        id: 'customer_details',
        title: 'Customer Details',
        layout: 'double',
        border: true,
        fields: [
          { id: 'company_name', label: 'Company Name', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'contact_person', label: 'Contact Person', type: 'text', required: true, width: '50%' },
          { id: 'title', label: 'Title/Position', type: 'text', width: '50%' },
          { id: 'email', label: 'Email Address', type: 'text', required: true, width: '50%' },
          { id: 'phone', label: 'Phone Number', type: 'text', required: true, width: '50%' },
          { id: 'address', label: 'Business Address', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'product_requirements',
        title: 'Product Requirements',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: 'Product List',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'specifications',
        title: 'Specifications & Requirements',
        layout: 'double',
        border: true,
        fields: [
          { id: 'target_price', label: 'Target Price Range', type: 'text', width: '50%' },
          { id: 'moq', label: 'Minimum Order Qty', type: 'number', width: '50%' },
          { id: 'delivery_timeline', label: 'Required Delivery Date', type: 'date', width: '50%' },
          { id: 'payment_terms', label: 'Preferred Payment Terms', type: 'select',
            options: ['T/T', 'L/C at Sight', 'D/P', 'D/A', 'Open Account'], width: '50%' },
          { id: 'special_requirements', label: 'Special Requirements/Notes', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date', 'page_number'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Submitted By', role: 'customer' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_quotation_001',
    name: 'Cosun报价单 (Home Depot风格)',
    name_en: 'Quotation (HD Style)',
    type: 'qt',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot专业风格报价单，橙色强调重点，清晰的价格展示',
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
        fields: ['company_name', 'address', 'contact', 'email', 'phone', 'website']
      },
      title: {
        text: 'PRICE QUOTATION',
        fontSize: 26,
        alignment: 'left'
      }
    },
    sections: [
      {
        id: 'quote_header',
        title: 'Quotation Details',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'quotation_no', label: 'Quote No.', type: 'text', required: true, width: '50%', fontWeight: 'bold', fontSize: 11 },
          { id: 'quotation_date', label: 'Quote Date', type: 'date', required: true, width: '50%' },
          { id: 'valid_until', label: 'Valid Through', type: 'date', required: true, width: '50%' },
          { id: 'inquiry_ref', label: 'Reference No.', type: 'text', width: '50%' },
          { id: 'sales_rep', label: 'Sales Representative', type: 'text', width: '50%' },
          { id: 'sales_email', label: 'Contact Email', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'bill_to',
        title: 'Bill To',
        layout: 'single',
        border: true,
        fields: [
          { id: 'customer_name', label: 'Customer Name', type: 'text', required: true, width: '100%', fontWeight: 'bold', fontSize: 12 },
          { id: 'contact_person', label: 'Attention', type: 'text', width: '50%' },
          { id: 'phone', label: 'Phone', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' },
          { id: 'address', label: 'Address', type: 'textarea', width: '50%' }
        ]
      },
      {
        id: 'pricing_table',
        title: 'Pricing Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: 'Product Pricing',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'totals',
        title: 'Quote Summary',
        layout: 'single',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'subtotal', label: 'Subtotal', type: 'calculated', calculation: 'sum(products)', 
            width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 11 },
          { id: 'discount', label: 'Discount', type: 'number', width: '100%', alignment: 'right' },
          { id: 'shipping', label: 'Estimated Shipping', type: 'number', width: '100%', alignment: 'right' },
          { id: 'total', label: 'TOTAL AMOUNT', type: 'calculated', calculation: 'subtotal - discount + shipping', 
            width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 16 }
        ]
      },
      {
        id: 'terms_conditions',
        title: 'Terms & Conditions',
        layout: 'double',
        border: true,
        fields: [
          { id: 'payment_terms', label: 'Payment Terms', type: 'textarea', width: '50%',
            defaultValue: '30% T/T deposit\n70% before shipment' },
          { id: 'delivery_terms', label: 'Delivery Terms', type: 'text', width: '50%', defaultValue: 'FOB China' },
          { id: 'lead_time', label: 'Production Lead Time', type: 'text', width: '50%', defaultValue: '30-45 days' },
          { id: 'warranty', label: 'Warranty Period', type: 'text', width: '50%', defaultValue: '1 Year' },
          { id: 'remarks', label: 'Additional Notes', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'approved_by', 'date', 'page_number'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By', role: 'sales_rep' },
          { label: 'Approved By', role: 'sales_manager' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_sales_contract_001',
    name: '销售合同 (Home Depot风格)',
    name_en: 'Sales Contract (HD Style)',
    type: 'sales_contract',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot专业风格销售合同，清晰的合同条款展示',
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
        text: 'SALES CONTRACT',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'contract_header',
        title: 'Contract Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'contract_no', label: 'Contract No.', type: 'text', required: true, width: '50%', fontWeight: 'bold', fontSize: 12 },
          { id: 'contract_date', label: 'Contract Date', type: 'date', required: true, width: '50%' },
          { id: 'quotation_ref', label: 'Quote Reference', type: 'text', width: '50%' },
          { id: 'po_number', label: 'Customer PO No.', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'contracting_parties',
        title: 'Contracting Parties',
        layout: 'double',
        border: true,
        fields: [
          { id: 'seller_title', label: 'SELLER', type: 'text', width: '100%', fontWeight: 'bold', fontSize: 11,
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'seller_address', label: 'Registered Address', type: 'textarea', width: '100%' },
          { id: 'seller_contact', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'seller_email', label: 'Email', type: 'text', width: '50%' },
          { id: 'buyer_title', label: 'BUYER', type: 'text', width: '100%', fontWeight: 'bold', fontSize: 11 },
          { id: 'buyer_address', label: 'Registered Address', type: 'textarea', width: '100%' },
          { id: 'buyer_contact', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'buyer_email', label: 'Email', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'products_services',
        title: 'Products & Services',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'products_table',
            label: 'Contract Items',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'contract_value',
        title: 'Contract Value',
        layout: 'single',
        border: true,
        backgroundColor: '#FFF9E6',
        fields: [
          { id: 'total_value', label: 'TOTAL CONTRACT VALUE', type: 'calculated', 
            calculation: 'sum(products)', width: '100%', alignment: 'center', fontWeight: 'bold', fontSize: 18 },
          { id: 'value_in_words', label: 'Amount in Words', type: 'text', width: '100%', 
            alignment: 'center', fontWeight: 'bold' }
        ]
      },
      {
        id: 'payment_terms_section',
        title: 'Article 1: Payment Terms',
        layout: 'single',
        border: true,
        fields: [
          { id: 'payment_method', label: '1.1 Payment Method', type: 'textarea', width: '100%', required: true,
            defaultValue: 'Telegraphic Transfer (T/T)' },
          { id: 'payment_schedule', label: '1.2 Payment Schedule', type: 'textarea', width: '100%', required: true,
            defaultValue: '30% deposit upon contract signing\n70% balance before shipment' },
          { id: 'bank_details', label: '1.3 Bank Account Details', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'delivery_terms_section',
        title: 'Article 2: Delivery Terms',
        layout: 'single',
        border: true,
        fields: [
          { id: 'incoterms', label: '2.1 Trade Terms', type: 'text', width: '50%', defaultValue: 'FOB China' },
          { id: 'port_of_shipment', label: '2.2 Port of Shipment', type: 'text', width: '50%' },
          { id: 'delivery_time', label: '2.3 Delivery Time', type: 'text', width: '50%', 
            defaultValue: '30-45 days after deposit receipt' },
          { id: 'partial_shipment', label: '2.4 Partial Shipment', type: 'select', 
            options: ['Allowed', 'Not Allowed'], width: '50%' }
        ]
      },
      {
        id: 'quality_warranty',
        title: 'Article 3: Quality & Warranty',
        layout: 'single',
        border: true,
        fields: [
          { id: 'quality_standards', label: '3.1 Quality Standards', type: 'textarea', width: '100%' },
          { id: 'warranty_period', label: '3.2 Warranty Period', type: 'text', width: '50%', defaultValue: '12 months' },
          { id: 'warranty_terms', label: '3.3 Warranty Coverage', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'other_terms',
        title: 'Additional Terms',
        layout: 'single',
        fields: [
          { id: 'force_majeure', label: '4. Force Majeure', type: 'textarea', width: '100%' },
          { id: 'dispute_resolution', label: '5. Dispute Resolution', type: 'textarea', width: '100%',
            defaultValue: 'Any disputes shall be resolved through friendly negotiation. If negotiation fails, disputes shall be submitted to arbitration.' },
          { id: 'governing_law', label: '6. Governing Law', type: 'text', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['signature', 'date', 'company_seal'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'FOR SELLER (Authorized Signature)', role: 'sales_director' },
          { label: 'FOR BUYER (Authorized Signature)', role: 'customer' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.7
    }
  },

  {
    id: 'hd_form_purchase_order_001',
    name: '采购订单 (Home Depot风格)',
    name_en: 'Purchase Order (HD Style)',
    type: 'purchase_contract',
    category: 'supplier',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格采购订单，清晰的采购信息展示',
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
        text: 'PURCHASE ORDER',
        fontSize: 26,
        alignment: 'left'
      }
    },
    sections: [
      {
        id: 'po_header',
        title: 'Order Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'po_number', label: 'PO Number', type: 'text', required: true, width: '50%', fontWeight: 'bold', fontSize: 12 },
          { id: 'po_date', label: 'PO Date', type: 'date', required: true, width: '50%' },
          { id: 'sales_order_ref', label: 'Sales Order Ref.', type: 'text', width: '50%' },
          { id: 'buyer_name', label: 'Buyer Name', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'vendor_info',
        title: 'Vendor Information',
        layout: 'single',
        border: true,
        fields: [
          { id: 'vendor_name', label: 'Vendor Name', type: 'text', required: true, width: '100%', fontWeight: 'bold', fontSize: 11 },
          { id: 'vendor_code', label: 'Vendor Code', type: 'text', width: '50%' },
          { id: 'contact_person', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'phone', label: 'Phone', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' },
          { id: 'address', label: 'Address', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'order_details',
        title: 'Order Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'items_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'order_summary',
        title: 'Order Summary',
        layout: 'single',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'subtotal', label: 'Subtotal', type: 'calculated', calculation: 'sum(items)', 
            width: '100%', alignment: 'right', fontWeight: 'bold' },
          { id: 'tax', label: 'Tax', type: 'number', width: '100%', alignment: 'right' },
          { id: 'total', label: 'TOTAL', type: 'calculated', calculation: 'subtotal + tax', 
            width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'delivery_payment',
        title: 'Delivery & Payment',
        layout: 'double',
        border: true,
        fields: [
          { id: 'required_delivery_date', label: 'Required Delivery Date', type: 'date', required: true, width: '50%' },
          { id: 'delivery_address', label: 'Delivery Address', type: 'textarea', width: '50%' },
          { id: 'payment_terms', label: 'Payment Terms', type: 'textarea', width: '50%' },
          { id: 'shipping_method', label: 'Shipping Method', type: 'text', width: '50%' },
          { id: 'special_instructions', label: 'Special Instructions', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'approved_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By (Procurement)', role: 'procurement' },
          { label: 'Approved By (Manager)', role: 'procurement_manager' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_commercial_invoice_001',
    name: '商业发票 (Home Depot风格)',
    name_en: 'Commercial Invoice (HD Style)',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格商业发票，专业的国际贸易文档',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
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
        text: 'COMMERCIAL INVOICE',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'invoice_header',
        title: 'Invoice Details',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'invoice_no', label: 'Invoice No.', type: 'text', required: true, width: '50%', fontWeight: 'bold', fontSize: 11 },
          { id: 'invoice_date', label: 'Invoice Date', type: 'date', required: true, width: '50%' },
          { id: 'contract_no', label: 'Contract No.', type: 'text', width: '50%' },
          { id: 'customer_po', label: 'Customer PO', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties_info',
        title: 'Parties Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'exporter', label: 'EXPORTER/SHIPPER', type: 'textarea', required: true, width: '50%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.\n[Address]' },
          { id: 'consignee', label: 'CONSIGNEE', type: 'textarea', required: true, width: '50%' },
          { id: 'notify_party', label: 'NOTIFY PARTY', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'shipping_details',
        title: 'Shipping Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'port_of_loading', label: 'Port of Loading', type: 'text', width: '50%' },
          { id: 'port_of_discharge', label: 'Port of Discharge', type: 'text', width: '50%' },
          { id: 'destination', label: 'Final Destination', type: 'text', width: '50%' },
          { id: 'vessel_voyage', label: 'Vessel/Voyage', type: 'text', width: '50%' },
          { id: 'bl_no', label: 'B/L No.', type: 'text', width: '50%' },
          { id: 'container_no', label: 'Container No.', type: 'text', width: '50%' },
          { id: 'shipping_terms', label: 'Terms of Delivery', type: 'text', width: '50%', defaultValue: 'FOB' },
          { id: 'sailing_date', label: 'Sailing Date', type: 'date', width: '50%' }
        ]
      },
      {
        id: 'goods_description',
        title: 'Description of Goods',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'goods_table',
            label: 'Items',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'invoice_totals',
        title: 'Invoice Total',
        layout: 'single',
        border: true,
        backgroundColor: '#FFFBEB',
        fields: [
          { id: 'total_amount', label: 'TOTAL INVOICE VALUE', type: 'calculated', 
            calculation: 'sum(goods)', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 16 },
          { id: 'amount_in_words', label: 'Amount in Words', type: 'text', width: '100%', 
            alignment: 'center', fontWeight: 'bold' }
        ]
      },
      {
        id: 'additional_info',
        title: 'Additional Information',
        layout: 'double',
        fields: [
          { id: 'payment_terms', label: 'Payment Terms', type: 'text', width: '50%' },
          { id: 'origin', label: 'Country of Origin', type: 'text', width: '50%', defaultValue: 'China' },
          { id: 'marks_numbers', label: 'Marks & Numbers', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['company_seal', 'signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized Signature & Company Seal', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 9,
      lineHeight: 1.5
    }
  },

  {
    id: 'hd_form_packing_list_001',
    name: '装箱单 (Home Depot风格)',
    name_en: 'Packing List (HD Style)',
    type: 'packing_list',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格装箱单，清晰的货物明细展示',
    pageSettings: {
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
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
        text: 'PACKING LIST',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'packing_header',
        title: 'Document Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'packing_list_no', label: 'Packing List No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'date', label: 'Date', type: 'date', required: true, width: '50%' },
          { id: 'invoice_no', label: 'Invoice No.', type: 'text', width: '50%' },
          { id: 'contract_no', label: 'Contract No.', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'parties_section',
        title: 'Shipment Details',
        layout: 'double',
        border: true,
        fields: [
          { id: 'shipper', label: 'SHIPPER', type: 'textarea', required: true, width: '50%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'consignee', label: 'CONSIGNEE', type: 'textarea', required: true, width: '50%' }
        ]
      },
      {
        id: 'transport_info',
        title: 'Transportation Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'container_no', label: 'Container No.', type: 'text', width: '50%' },
          { id: 'seal_no', label: 'Seal No.', type: 'text', width: '50%' },
          { id: 'vessel_name', label: 'Vessel Name', type: 'text', width: '50%' },
          { id: 'voyage_no', label: 'Voyage No.', type: 'text', width: '50%' },
          { id: 'port_of_loading', label: 'Port of Loading', type: 'text', width: '50%' },
          { id: 'port_of_discharge', label: 'Port of Discharge', type: 'text', width: '50%' },
          { id: 'bl_no', label: 'B/L No.', type: 'text', width: '50%' },
          { id: 'shipping_date', label: 'Shipping Date', type: 'date', width: '50%' }
        ]
      },
      {
        id: 'packing_details_table',
        title: 'Packing Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'packing_table',
            label: 'Carton Details',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'totals_section',
        title: 'Summary',
        layout: 'triple',
        border: true,
        backgroundColor: '#E0F2FE',
        fields: [
          { id: 'total_cartons', label: 'Total Cartons', type: 'calculated', calculation: 'count(cartons)', 
            width: '33%', alignment: 'center', fontWeight: 'bold', fontSize: 11 },
          { id: 'total_gross_weight', label: 'Total Gross Weight (KG)', type: 'calculated', 
            calculation: 'sum(gross_weight)', width: '33%', alignment: 'center', fontWeight: 'bold', fontSize: 11 },
          { id: 'total_net_weight', label: 'Total Net Weight (KG)', type: 'calculated', 
            calculation: 'sum(net_weight)', width: '34%', alignment: 'center', fontWeight: 'bold', fontSize: 11 },
          { id: 'total_volume', label: 'Total Volume (CBM)', type: 'calculated', 
            calculation: 'sum(volume)', width: '100%', alignment: 'center', fontWeight: 'bold', fontSize: 11 }
        ]
      },
      {
        id: 'marks_section',
        title: 'Shipping Marks',
        layout: 'single',
        fields: [
          { id: 'marks_numbers', label: 'Marks & Numbers', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By (Logistics Department)', role: 'logistics' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 9,
      lineHeight: 1.5
    }
  },

  {
    id: 'hd_form_proforma_invoice_001',
    name: '形式发票 (Home Depot风格)',
    name_en: 'Proforma Invoice (HD Style)',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格形式发票，用于预付款和信用证',
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
        text: 'PROFORMA INVOICE',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'pi_header',
        title: 'Invoice Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'pi_no', label: 'PI No.', type: 'text', required: true, width: '50%', fontWeight: 'bold', fontSize: 11 },
          { id: 'pi_date', label: 'Date', type: 'date', required: true, width: '50%' },
          { id: 'contract_ref', label: 'Contract Ref.', type: 'text', width: '50%' },
          { id: 'quotation_ref', label: 'Quotation Ref.', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'buyer_info',
        title: 'Buyer Information',
        layout: 'single',
        border: true,
        fields: [
          { id: 'buyer_name', label: 'Buyer Name', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'buyer_address', label: 'Address', type: 'textarea', required: true, width: '100%' },
          { id: 'contact', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'items_section',
        title: 'Items',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'items_table',
            label: 'Product Details',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'amount_section',
        title: 'Invoice Amount',
        layout: 'single',
        border: true,
        backgroundColor: '#FFF9E6',
        fields: [
          { id: 'subtotal', label: 'Subtotal', type: 'calculated', calculation: 'sum(items)', 
            width: '100%', alignment: 'right', fontWeight: 'bold' },
          { id: 'total', label: 'TOTAL AMOUNT', type: 'calculated', calculation: 'subtotal', 
            width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 16 },
          { id: 'amount_in_words', label: 'Amount in Words', type: 'text', width: '100%', alignment: 'center' }
        ]
      },
      {
        id: 'payment_banking',
        title: 'Payment & Banking Details',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'payment_terms', label: 'Payment Terms', type: 'textarea', width: '50%', required: true,
            defaultValue: '30% T/T deposit\n70% before shipment' },
          { id: 'delivery_terms', label: 'Delivery Terms', type: 'text', width: '50%', defaultValue: 'FOB China' },
          { id: 'bank_name', label: 'Bank Name', type: 'text', required: true, width: '100%' },
          { id: 'account_name', label: 'Account Name', type: 'text', required: true, width: '50%' },
          { id: 'account_number', label: 'Account Number', type: 'text', required: true, width: '50%' },
          { id: 'swift_code', label: 'SWIFT Code', type: 'text', width: '50%' },
          { id: 'bank_address', label: 'Bank Address', type: 'textarea', width: '50%' }
        ]
      },
      {
        id: 'other_info',
        title: 'Other Information',
        layout: 'double',
        fields: [
          { id: 'lead_time', label: 'Production Lead Time', type: 'text', width: '50%', defaultValue: '30-45 days' },
          { id: 'validity', label: 'Valid Until', type: 'date', width: '50%' },
          { id: 'remarks', label: 'Remarks', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['company_seal', 'signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized Signature', role: 'sales_manager' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_booking_confirmation_001',
    name: '订舱确认书 (Home Depot风格)',
    name_en: 'Booking Confirmation (HD Style)',
    type: 'booking',
    category: 'internal',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格订舱确认书，物流文档',
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
        text: 'BOOKING CONFIRMATION',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'booking_header',
        title: 'Booking Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'booking_no', label: 'Booking No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'booking_date', label: 'Booking Date', type: 'date', required: true, width: '50%' },
          { id: 'invoice_ref', label: 'Invoice Ref.', type: 'text', width: '50%' },
          { id: 'contract_ref', label: 'Contract Ref.', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'shipper_consignee',
        title: 'Shipper & Consignee',
        layout: 'double',
        border: true,
        fields: [
          { id: 'shipper', label: 'SHIPPER', type: 'textarea', required: true, width: '50%',
            defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
          { id: 'consignee', label: 'CONSIGNEE', type: 'textarea', required: true, width: '50%' },
          { id: 'notify_party', label: 'NOTIFY PARTY', type: 'textarea', width: '100%' }
        ]
      },
      {
        id: 'shipping_details',
        title: 'Shipping Details',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'shipping_line', label: 'Shipping Line', type: 'text', width: '50%' },
          { id: 'vessel_name', label: 'Vessel Name', type: 'text', width: '50%' },
          { id: 'voyage_no', label: 'Voyage No.', type: 'text', width: '50%' },
          { id: 'port_of_loading', label: 'Port of Loading', type: 'text', required: true, width: '50%' },
          { id: 'port_of_discharge', label: 'Port of Discharge', type: 'text', required: true, width: '50%' },
          { id: 'final_destination', label: 'Final Destination', type: 'text', width: '50%' },
          { id: 'etd', label: 'ETD (Estimated Time of Departure)', type: 'date', width: '50%' },
          { id: 'eta', label: 'ETA (Estimated Time of Arrival)', type: 'date', width: '50%' }
        ]
      },
      {
        id: 'container_info',
        title: 'Container Information',
        layout: 'double',
        border: true,
        fields: [
          { id: 'container_type', label: 'Container Type', type: 'select', 
            options: ['20GP', '40GP', '40HQ', '45HQ'], width: '50%' },
          { id: 'container_qty', label: 'Number of Containers', type: 'number', width: '50%' },
          { id: 'container_no', label: 'Container No.', type: 'text', width: '50%' },
          { id: 'seal_no', label: 'Seal No.', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'cargo_details',
        title: 'Cargo Details',
        layout: 'single',
        border: true,
        fields: [
          { id: 'cargo_description', label: 'Description of Goods', type: 'textarea', required: true, width: '100%' },
          { id: 'gross_weight', label: 'Total Gross Weight (KG)', type: 'number', width: '33%' },
          { id: 'net_weight', label: 'Total Net Weight (KG)', type: 'number', width: '33%' },
          { id: 'volume', label: 'Total Volume (CBM)', type: 'number', width: '34%' },
          { id: 'hs_code', label: 'HS Code', type: 'text', width: '50%' },
          { id: 'marks_numbers', label: 'Marks & Numbers', type: 'textarea', width: '50%' }
        ]
      },
      {
        id: 'terms_info',
        title: 'Terms & Additional Information',
        layout: 'double',
        fields: [
          { id: 'freight_terms', label: 'Freight Terms', type: 'select',
            options: ['Prepaid', 'Collect'], width: '50%' },
          { id: 'incoterms', label: 'Trade Terms', type: 'text', width: '50%', defaultValue: 'FOB' },
          { id: 'special_requirements', label: 'Special Requirements', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By (Logistics)', role: 'logistics' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_statement_001',
    name: '对账单 (Home Depot风格)',
    name_en: 'Statement of Account (HD Style)',
    type: 'statement',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格对账单，清晰的财务对账文档',
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
        text: 'STATEMENT OF ACCOUNT',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'statement_header',
        title: 'Statement Information',
        layout: 'double',
        border: true,
        backgroundColor: HomeDepotColors.bgOrange,
        fields: [
          { id: 'statement_no', label: 'Statement No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'statement_date', label: 'Statement Date', type: 'date', required: true, width: '50%' },
          { id: 'period_from', label: 'Period From', type: 'date', required: true, width: '50%' },
          { id: 'period_to', label: 'Period To', type: 'date', required: true, width: '50%' }
        ]
      },
      {
        id: 'account_info',
        title: 'Account Information',
        layout: 'single',
        border: true,
        fields: [
          { id: 'account_name', label: 'Account Name', type: 'text', required: true, width: '100%', fontWeight: 'bold', fontSize: 11 },
          { id: 'account_number', label: 'Account Number', type: 'text', width: '50%' },
          { id: 'contact_person', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' },
          { id: 'phone', label: 'Phone', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'transactions_table',
        title: 'Transaction Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'transactions_table',
            label: 'Transactions',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'account_summary',
        title: 'Account Summary',
        layout: 'single',
        border: true,
        backgroundColor: HomeDepotColors.bgLight,
        fields: [
          { id: 'opening_balance', label: 'Opening Balance', type: 'number', width: '100%', alignment: 'right', fontWeight: 'bold' },
          { id: 'total_charges', label: 'Total Charges', type: 'calculated', calculation: 'sum(debits)', 
            width: '100%', alignment: 'right' },
          { id: 'total_payments', label: 'Total Payments', type: 'calculated', calculation: 'sum(credits)', 
            width: '100%', alignment: 'right' },
          { id: 'closing_balance', label: 'CLOSING BALANCE', type: 'calculated', 
            calculation: 'opening_balance + total_charges - total_payments', 
            width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 14 }
        ]
      },
      {
        id: 'aging_analysis',
        title: 'Aging Analysis',
        layout: 'single',
        border: true,
        backgroundColor: '#FFF9E6',
        fields: [
          { id: 'current', label: 'Current (0-30 days)', type: 'number', width: '25%', alignment: 'center' },
          { id: 'days_31_60', label: '31-60 days', type: 'number', width: '25%', alignment: 'center' },
          { id: 'days_61_90', label: '61-90 days', type: 'number', width: '25%', alignment: 'center' },
          { id: 'over_90', label: 'Over 90 days', type: 'number', width: '25%', alignment: 'center' }
        ]
      },
      {
        id: 'payment_info',
        title: 'Payment Information',
        layout: 'single',
        fields: [
          { id: 'payment_due_date', label: 'Payment Due Date', type: 'date', width: '50%' },
          { id: 'payment_method', label: 'Payment Method', type: 'text', width: '50%' },
          { id: 'remarks', label: 'Remarks/Notes', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['prepared_by', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Prepared By (Finance Department)', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.primary,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_debit_note_001',
    name: '借项通知单 (Home Depot风格)',
    name_en: 'Debit Note (HD Style)',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格借项通知单，用于额外费用通知',
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
        text: 'DEBIT NOTE',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'debit_note_header',
        title: 'Debit Note Information',
        layout: 'double',
        border: true,
        backgroundColor: '#FEE2E2',
        fields: [
          { id: 'debit_note_no', label: 'Debit Note No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'date', label: 'Date', type: 'date', required: true, width: '50%' },
          { id: 'invoice_ref', label: 'Invoice Reference', type: 'text', width: '50%' },
          { id: 'contract_ref', label: 'Contract Reference', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'debtor_info',
        title: 'Debtor Information',
        layout: 'single',
        border: true,
        fields: [
          { id: 'company_name', label: 'Company Name', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'address', label: 'Address', type: 'textarea', width: '100%' },
          { id: 'contact', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'charges_details',
        title: 'Charge Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'charges_table',
            label: 'Charges',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'total_section',
        title: 'Total Amount',
        layout: 'single',
        border: true,
        backgroundColor: '#FFF9E6',
        fields: [
          { id: 'total_amount', label: 'TOTAL AMOUNT DUE', type: 'calculated', 
            calculation: 'sum(charges)', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 16 },
          { id: 'amount_in_words', label: 'Amount in Words', type: 'text', width: '100%', alignment: 'center' }
        ]
      },
      {
        id: 'reason_payment',
        title: 'Reason & Payment Details',
        layout: 'single',
        fields: [
          { id: 'reason', label: 'Reason for Debit Note', type: 'textarea', required: true, width: '100%' },
          { id: 'payment_due_date', label: 'Payment Due Date', type: 'date', width: '50%' },
          { id: 'payment_method', label: 'Payment Method', type: 'text', width: '50%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized By (Finance)', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.error,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  },

  {
    id: 'hd_form_credit_note_001',
    name: '贷项通知单 (Home Depot风格)',
    name_en: 'Credit Note (HD Style)',
    type: 'invoice',
    category: 'customer',
    owner: 'cosun',
    version: '2.0',
    lastModified: '2024-01-20',
    createdBy: 'admin',
    description: 'Home Depot风格贷项通知单，用于退款或折让',
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
        text: 'CREDIT NOTE',
        fontSize: 26,
        alignment: 'center'
      }
    },
    sections: [
      {
        id: 'credit_note_header',
        title: 'Credit Note Information',
        layout: 'double',
        border: true,
        backgroundColor: '#D1FAE5',
        fields: [
          { id: 'credit_note_no', label: 'Credit Note No.', type: 'text', required: true, width: '50%', fontWeight: 'bold' },
          { id: 'date', label: 'Date', type: 'date', required: true, width: '50%' },
          { id: 'invoice_ref', label: 'Invoice Reference', type: 'text', width: '50%' },
          { id: 'contract_ref', label: 'Contract Reference', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'creditor_info',
        title: 'Customer Information',
        layout: 'single',
        border: true,
        fields: [
          { id: 'company_name', label: 'Company Name', type: 'text', required: true, width: '100%', fontWeight: 'bold' },
          { id: 'address', label: 'Address', type: 'textarea', width: '100%' },
          { id: 'contact', label: 'Contact Person', type: 'text', width: '50%' },
          { id: 'email', label: 'Email', type: 'text', width: '50%' }
        ]
      },
      {
        id: 'credits_details',
        title: 'Credit Details',
        layout: 'single',
        border: true,
        fields: [
          {
            id: 'credits_table',
            label: 'Credits',
            type: 'table',
            required: true,
            width: '100%'
          }
        ]
      },
      {
        id: 'total_section',
        title: 'Total Credit Amount',
        layout: 'single',
        border: true,
        backgroundColor: '#ECFDF5',
        fields: [
          { id: 'total_amount', label: 'TOTAL CREDIT AMOUNT', type: 'calculated', 
            calculation: 'sum(credits)', width: '100%', alignment: 'right', fontWeight: 'bold', fontSize: 16 },
          { id: 'amount_in_words', label: 'Amount in Words', type: 'text', width: '100%', alignment: 'center' }
        ]
      },
      {
        id: 'reason_details',
        title: 'Reason & Settlement Details',
        layout: 'single',
        fields: [
          { id: 'reason', label: 'Reason for Credit Note', type: 'textarea', required: true, width: '100%' },
          { id: 'settlement_method', label: 'Settlement Method', type: 'select',
            options: ['Refund', 'Credit to Account', 'Offset Next Invoice'], width: '50%' },
          { id: 'settlement_date', label: 'Settlement Date', type: 'date', width: '50%' },
          { id: 'remarks', label: 'Additional Remarks', type: 'textarea', width: '100%' }
        ]
      }
    ],
    footer: {
      enabled: true,
      fields: ['signature', 'date'],
      signatureLines: {
        enabled: true,
        parties: [
          { label: 'Authorized By (Finance)', role: 'finance' }
        ]
      }
    },
    styling: {
      primaryColor: HomeDepotColors.success,
      secondaryColor: HomeDepotColors.secondary,
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: 10,
      lineHeight: 1.6
    }
  }
];

// 导出Home Depot配色方案供其他组件使用
export default homeDepotFormTemplates;
