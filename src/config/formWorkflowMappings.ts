// 表单与工作流映射配置文件
// Form-Workflow Mapping Configuration

/**
 * 🔥 核心概念：表单与工作流深度集成
 * 
 * 这个配置文件定义了10个核心业务单据表单与21步工作流之间的映射关系：
 * 1. 数据字段映射 - 表单字段如何映射到工作流数据
 * 2. 触发机制 - 何时、如何触发表单生成
 * 3. 验证规则 - 表单提交前的验证条件
 * 4. 自动填充 - 从工作流上下文自动填充表单字段
 * 5. 审批流程 - 表单提交后的审批路径
 */

export interface FormFieldMapping {
  formFieldId: string;          // 表单字段ID
  workflowDataPath: string;     // 工作流数据路径
  transformFunction?: string;   // 数据转换函数（可选）
  defaultValue?: any;          // 默认值（可选）
}

export interface FormStepMapping {
  id: string;
  formId: string;
  formName: string;
  formNameEn: string;
  stepId: string;
  stepName: string;
  stageId: string;
  stageName: string;
  stageOrder: number;
  actor: string;
  
  // 触发机制
  triggerType: 'manual' | 'auto' | 'conditional';
  triggerCondition?: string;
  triggerEvent?: string;
  
  // 数据映射
  fieldMappings: FormFieldMapping[];
  
  // 验证规则
  validationRules: {
    ruleId: string;
    ruleName: string;
    condition: string;
    errorMessage: string;
  }[];
  
  // 自动填充配置
  autoPopulateFields: {
    fieldId: string;
    source: 'workflow_context' | 'user_profile' | 'system' | 'previous_form';
    sourcePath: string;
  }[];
  
  // 审批配置
  requiresApproval: boolean;
  approvalRoles?: string[];
  approvalCondition?: string;
  
  // 后续动作
  postActions: {
    actionType: 'create_form' | 'update_status' | 'send_notification' | 'trigger_workflow';
    actionConfig: any;
  }[];
  
  // 元数据
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedDuration?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 🔥 10个核心业务单据表单 x 21步工作流 = 完整映射关系
export const formWorkflowMappings: FormStepMapping[] = [
  // ========== 阶段1：询价阶段 ==========
  {
    id: 'fwm_001',
    formId: 'form_inquiry_001',
    formName: '客户询价单',
    formNameEn: 'Customer Inquiry Form',
    stepId: 'customer_inquiry',
    stepName: '客户发送询价单',
    stageId: 'inquiry_stage',
    stageName: '📋 询价阶段',
    stageOrder: 1,
    actor: 'customer',
    
    triggerType: 'manual',
    triggerEvent: 'customer_portal_inquiry_submit',
    
    fieldMappings: [
      { formFieldId: 'inquiry_no', workflowDataPath: 'inquiry.number' },
      { formFieldId: 'inquiry_date', workflowDataPath: 'inquiry.date' },
      { formFieldId: 'customer_name', workflowDataPath: 'customer.company_name' },
      { formFieldId: 'contact_person', workflowDataPath: 'customer.contact_name' },
      { formFieldId: 'email', workflowDataPath: 'customer.email' },
      { formFieldId: 'phone', workflowDataPath: 'customer.phone' },
      { formFieldId: 'target_market', workflowDataPath: 'inquiry.target_region' },
      { formFieldId: 'products_table', workflowDataPath: 'inquiry.products' },
      { formFieldId: 'special_requirements', workflowDataPath: 'inquiry.special_requirements' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_001',
        ruleName: 'products_required',
        condition: 'products_table.length > 0',
        errorMessage: 'Please add at least one product to the inquiry'
      },
      {
        ruleId: 'vr_002',
        ruleName: 'quantity_validation',
        condition: 'products.every(p => p.quantity > 0)',
        errorMessage: 'Product quantity must be greater than 0'
      },
      {
        ruleId: 'vr_003',
        ruleName: 'email_format',
        condition: 'email.match(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/)',
        errorMessage: 'Invalid email format'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'inquiry_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'customer_name', source: 'user_profile', sourcePath: 'company_name' },
      { fieldId: 'email', source: 'user_profile', sourcePath: 'email' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'inquiry', newStatus: 'submitted' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['sales_rep', 'admin_finance'],
          template: 'new_inquiry_notification'
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'system_distribute_inquiry' }
      }
    ],
    
    priority: 'high',
    estimatedDuration: '5-10 minutes',
    notes: '客户通过Customer Portal提交询价单，触发整个业务流程',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  // ========== 阶段2：报价阶段 ==========
  {
    id: 'fwm_002',
    formId: 'form_quotation_001',
    formName: 'Cosun报价单',
    formNameEn: 'Quotation / Price Quote',
    stepId: 'sales_create_quotation',
    stepName: '区域业务员创建报价单',
    stageId: 'quotation_stage',
    stageName: '💰 报价阶段',
    stageOrder: 2,
    actor: 'sales_rep',
    
    triggerType: 'manual',
    triggerCondition: 'inquiry.status === "cost_analysis_completed"',
    triggerEvent: 'sales_rep_create_quotation',
    
    fieldMappings: [
      { formFieldId: 'quotation_no', workflowDataPath: 'quotation.number' },
      { formFieldId: 'quotation_date', workflowDataPath: 'quotation.date' },
      { formFieldId: 'valid_until', workflowDataPath: 'quotation.valid_until', transformFunction: 'addDays(30)' },
      { formFieldId: 'inquiry_ref', workflowDataPath: 'inquiry.number' },
      { formFieldId: 'sales_rep', workflowDataPath: 'sales.rep_name' },
      { formFieldId: 'region', workflowDataPath: 'sales.region' },
      { formFieldId: 'customer_name', workflowDataPath: 'customer.company_name' },
      { formFieldId: 'contact_person', workflowDataPath: 'customer.contact_name' },
      { formFieldId: 'email', workflowDataPath: 'customer.email' },
      { formFieldId: 'phone', workflowDataPath: 'customer.phone' },
      { formFieldId: 'products_table', workflowDataPath: 'quotation.products_with_pricing' },
      { formFieldId: 'subtotal', workflowDataPath: 'quotation.subtotal' },
      { formFieldId: 'total', workflowDataPath: 'quotation.total_amount' },
      { formFieldId: 'payment_terms', workflowDataPath: 'quotation.payment_terms' },
      { formFieldId: 'delivery_terms', workflowDataPath: 'quotation.delivery_terms' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_004',
        ruleName: 'pricing_above_cost',
        condition: 'quotation.products.every(p => p.unit_price >= p.cost_price)',
        errorMessage: 'Selling price cannot be lower than cost price'
      },
      {
        ruleId: 'vr_005',
        ruleName: 'minimum_profit_margin',
        condition: 'quotation.profit_margin >= 0.15',
        errorMessage: 'Profit margin must be at least 15%'
      },
      {
        ruleId: 'vr_006',
        ruleName: 'valid_until_future',
        condition: 'valid_until > quotation_date',
        errorMessage: 'Valid until date must be in the future'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'quotation_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'sales_rep', source: 'user_profile', sourcePath: 'full_name' },
      { fieldId: 'region', source: 'user_profile', sourcePath: 'region' },
      { fieldId: 'customer_name', source: 'workflow_context', sourcePath: 'customer.company_name' },
      { fieldId: 'inquiry_ref', source: 'workflow_context', sourcePath: 'inquiry.number' },
      { fieldId: 'payment_terms', source: 'system', sourcePath: 'defaultPaymentTerms' }
    ],
    
    requiresApproval: true,
    approvalRoles: ['regional_manager', 'sales_director'],
    approvalCondition: 'quotation.total_amount >= 20000 ? "sales_director" : "regional_manager"',
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'quotation', newStatus: 'pending_approval' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['regional_manager'],
          template: 'quotation_approval_request',
          condition: 'quotation.total_amount < 20000'
        }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['sales_director'],
          template: 'quotation_approval_request',
          condition: 'quotation.total_amount >= 20000'
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'amount_routing' }
      }
    ],
    
    priority: 'high',
    estimatedDuration: '30-60 minutes',
    notes: '业务员基于成本底价创建报价单，需要根据金额进行审批路由',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  // ========== 阶段4：合同阶段 ==========
  {
    id: 'fwm_003',
    formId: 'form_sales_contract_001',
    formName: '销售合同',
    formNameEn: 'Sales Contract',
    stepId: 'generate_sales_contract',
    stepName: '生成销售合同',
    stageId: 'contract_stage',
    stageName: '📝 合同阶段',
    stageOrder: 4,
    actor: 'sales_rep',
    
    triggerType: 'auto',
    triggerCondition: 'customer.po_received && quotation.status === "approved"',
    triggerEvent: 'quotation_accepted_with_po',
    
    fieldMappings: [
      { formFieldId: 'contract_no', workflowDataPath: 'contract.number', transformFunction: 'generateContractNumber()' },
      { formFieldId: 'contract_date', workflowDataPath: 'contract.date' },
      { formFieldId: 'quotation_ref', workflowDataPath: 'quotation.number' },
      { formFieldId: 'po_ref', workflowDataPath: 'customer.po_number' },
      { formFieldId: 'seller_name', workflowDataPath: 'cosun.legal_entity_name', defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
      { formFieldId: 'seller_address', workflowDataPath: 'cosun.legal_address' },
      { formFieldId: 'buyer_name', workflowDataPath: 'customer.legal_entity_name' },
      { formFieldId: 'buyer_address', workflowDataPath: 'customer.legal_address' },
      { formFieldId: 'products_table', workflowDataPath: 'contract.products' },
      { formFieldId: 'total_amount', workflowDataPath: 'contract.total_amount' },
      { formFieldId: 'payment_terms', workflowDataPath: 'contract.payment_terms' },
      { formFieldId: 'delivery_terms', workflowDataPath: 'contract.delivery_terms' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_007',
        ruleName: 'po_number_required',
        condition: 'po_ref !== null && po_ref !== ""',
        errorMessage: 'Customer PO number is required'
      },
      {
        ruleId: 'vr_008',
        ruleName: 'buyer_legal_entity',
        condition: 'buyer_name !== null && buyer_name.length > 0',
        errorMessage: 'Buyer legal entity name is required'
      },
      {
        ruleId: 'vr_009',
        ruleName: 'contract_value_match',
        condition: 'Math.abs(contract.total_amount - quotation.total_amount) < 1',
        errorMessage: 'Contract value must match quotation value'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'contract_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'seller_name', source: 'system', sourcePath: 'cosun_legal_name' },
      { fieldId: 'seller_address', source: 'system', sourcePath: 'cosun_legal_address' },
      { fieldId: 'quotation_ref', source: 'workflow_context', sourcePath: 'quotation.number' },
      { fieldId: 'products_table', source: 'workflow_context', sourcePath: 'quotation.products' }
    ],
    
    requiresApproval: true,
    approvalRoles: ['sales_director', 'finance_director'],
    approvalCondition: 'contract.total_amount >= 50000',
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'contract', newStatus: 'draft' }
      },
      {
        actionType: 'create_form',
        actionConfig: { formId: 'form_purchase_contract_001', trigger: 'auto' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['customer'],
          template: 'contract_for_review'
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'generate_purchase_order' }
      }
    ],
    
    priority: 'critical',
    estimatedDuration: '1-2 hours',
    notes: '客户PO收到后自动生成销售合同，需要客户确认签字',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_004',
    formId: 'form_purchase_contract_001',
    formName: '采购合同',
    formNameEn: 'Purchase Contract',
    stepId: 'generate_purchase_order',
    stepName: '生成采购订单',
    stageId: 'contract_stage',
    stageName: '📝 合同阶段',
    stageOrder: 4,
    actor: 'admin_finance',
    
    triggerType: 'auto',
    triggerCondition: 'contract.status === "signed_by_customer"',
    triggerEvent: 'sales_contract_confirmed',
    
    fieldMappings: [
      { formFieldId: 'po_no', workflowDataPath: 'purchase_order.number', transformFunction: 'generatePONumber()' },
      { formFieldId: 'po_date', workflowDataPath: 'purchase_order.date' },
      { formFieldId: 'sales_order_ref', workflowDataPath: 'contract.number' },
      { formFieldId: 'buyer_name', workflowDataPath: 'cosun.legal_entity_name', defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
      { formFieldId: 'supplier_name', workflowDataPath: 'supplier.company_name' },
      { formFieldId: 'supplier_contact', workflowDataPath: 'supplier.contact_name' },
      { formFieldId: 'products_table', workflowDataPath: 'purchase_order.products' },
      { formFieldId: 'total', workflowDataPath: 'purchase_order.total_amount' },
      { formFieldId: 'delivery_date', workflowDataPath: 'purchase_order.required_delivery_date' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_010',
        ruleName: 'supplier_approved',
        condition: 'supplier.status === "approved"',
        errorMessage: 'Supplier must be in approved status'
      },
      {
        ruleId: 'vr_011',
        ruleName: 'delivery_date_validation',
        condition: 'delivery_date <= contract.customer_required_date - 7',
        errorMessage: 'Supplier delivery date must be at least 7 days before customer required date'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'po_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'buyer_name', source: 'system', sourcePath: 'cosun_legal_name' },
      { fieldId: 'sales_order_ref', source: 'workflow_context', sourcePath: 'contract.number' },
      { fieldId: 'products_table', source: 'workflow_context', sourcePath: 'supplier_quotation.products' }
    ],
    
    requiresApproval: true,
    approvalRoles: ['procurement_manager'],
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'purchase_order', newStatus: 'pending_supplier_confirmation' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['supplier'],
          template: 'purchase_order_notification'
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'supplier_confirm_po' }
      }
    ],
    
    priority: 'critical',
    estimatedDuration: '30 minutes',
    notes: '销售合同签订后自动生成采购订单发给供应商',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  // ========== 阶段5：收款和出运阶段 ==========
  {
    id: 'fwm_005',
    formId: 'form_deposit_invoice_001',
    formName: '预付款发票',
    formNameEn: 'Deposit Invoice',
    stepId: 'issue_deposit_invoice',
    stepName: '开具预付款发票',
    stageId: 'payment_stage',
    stageName: '💰 收款阶段',
    stageOrder: 5,
    actor: 'admin_finance',
    
    triggerType: 'auto',
    triggerCondition: 'contract.status === "confirmed" && purchase_order.status === "supplier_confirmed"',
    triggerEvent: 'both_contracts_confirmed',
    
    fieldMappings: [
      { formFieldId: 'invoice_no', workflowDataPath: 'invoice.deposit_number', transformFunction: 'generateInvoiceNumber("DEP")' },
      { formFieldId: 'invoice_date', workflowDataPath: 'invoice.date' },
      { formFieldId: 'contract_no', workflowDataPath: 'contract.number' },
      { formFieldId: 'customer_name', workflowDataPath: 'customer.legal_entity_name' },
      { formFieldId: 'customer_address', workflowDataPath: 'customer.billing_address' },
      { formFieldId: 'contract_total', workflowDataPath: 'contract.total_amount' },
      { formFieldId: 'deposit_percentage', workflowDataPath: 'contract.deposit_percentage', defaultValue: '30%' },
      { formFieldId: 'deposit_amount', workflowDataPath: 'invoice.deposit_amount', transformFunction: 'contract.total_amount * 0.30' },
      { formFieldId: 'payment_deadline', workflowDataPath: 'invoice.payment_deadline', transformFunction: 'addDays(7)' },
      { formFieldId: 'bank_name', workflowDataPath: 'cosun.bank_name' },
      { formFieldId: 'account_number', workflowDataPath: 'cosun.bank_account' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_012',
        ruleName: 'deposit_percentage_30',
        condition: 'deposit_percentage === "30%"',
        errorMessage: 'Deposit must be 30% of contract value'
      },
      {
        ruleId: 'vr_013',
        ruleName: 'bank_details_complete',
        condition: 'bank_name && account_number && swift_code',
        errorMessage: 'Complete bank details are required'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'invoice_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'contract_no', source: 'workflow_context', sourcePath: 'contract.number' },
      { fieldId: 'customer_name', source: 'workflow_context', sourcePath: 'customer.legal_entity_name' },
      { fieldId: 'bank_name', source: 'system', sourcePath: 'cosun_bank_name' },
      { fieldId: 'account_number', source: 'system', sourcePath: 'cosun_account_number' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'invoice', newStatus: 'issued', subType: 'deposit' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['customer'],
          template: 'deposit_invoice_notification',
          attachments: ['deposit_invoice_pdf']
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'customer_pay_deposit' }
      }
    ],
    
    priority: 'critical',
    estimatedDuration: '15 minutes',
    notes: '合同确认后自动开具30%预付款发票',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_006',
    formId: 'form_balance_invoice_001',
    formName: '尾款发票',
    formNameEn: 'Balance Invoice',
    stepId: 'issue_balance_invoice',
    stepName: '开具尾款发票',
    stageId: 'payment_stage',
    stageName: '💰 收款阶段',
    stageOrder: 5,
    actor: 'admin_finance',
    
    triggerType: 'conditional',
    triggerCondition: 'production.status === "completed" && qc.status === "passed"',
    triggerEvent: 'production_ready_for_shipment',
    
    fieldMappings: [
      { formFieldId: 'invoice_no', workflowDataPath: 'invoice.balance_number', transformFunction: 'generateInvoiceNumber("BAL")' },
      { formFieldId: 'invoice_date', workflowDataPath: 'invoice.date' },
      { formFieldId: 'contract_no', workflowDataPath: 'contract.number' },
      { formFieldId: 'deposit_invoice_ref', workflowDataPath: 'invoice.deposit_number' },
      { formFieldId: 'customer_name', workflowDataPath: 'customer.legal_entity_name' },
      { formFieldId: 'contract_total', workflowDataPath: 'contract.total_amount' },
      { formFieldId: 'deposit_paid', workflowDataPath: 'payment.deposit_amount_received' },
      { formFieldId: 'balance_due', workflowDataPath: 'invoice.balance_amount', transformFunction: 'contract.total_amount - payment.deposit_amount_received' },
      { formFieldId: 'production_status', workflowDataPath: 'production.status' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_014',
        ruleName: 'deposit_confirmed',
        condition: 'payment.deposit_confirmed === true',
        errorMessage: 'Deposit payment must be confirmed before issuing balance invoice'
      },
      {
        ruleId: 'vr_015',
        ruleName: 'production_ready',
        condition: 'production.status === "completed" && qc.status === "passed"',
        errorMessage: 'Production must be completed and QC passed'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'invoice_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'contract_no', source: 'workflow_context', sourcePath: 'contract.number' },
      { fieldId: 'deposit_invoice_ref', source: 'workflow_context', sourcePath: 'invoice.deposit_number' },
      { fieldId: 'deposit_paid', source: 'workflow_context', sourcePath: 'payment.deposit_amount_received' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'invoice', newStatus: 'issued', subType: 'balance' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['customer'],
          template: 'balance_invoice_notification',
          attachments: ['balance_invoice_pdf', 'qc_report_pdf']
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'customer_pay_balance' }
      }
    ],
    
    priority: 'critical',
    estimatedDuration: '15 minutes',
    notes: '生产完成、质检通过后开具70%尾款发票',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_007',
    formId: 'form_commercial_invoice_001',
    formName: '商业发票',
    formNameEn: 'Commercial Invoice',
    stepId: 'issue_commercial_invoice',
    stepName: '开具商业发票',
    stageId: 'shipping_stage',
    stageName: '🚢 出运阶段',
    stageOrder: 5,
    actor: 'admin_finance',
    
    triggerType: 'auto',
    triggerCondition: 'payment.balance_confirmed === true && shipping.booking_confirmed === true',
    triggerEvent: 'ready_for_customs_clearance',
    
    fieldMappings: [
      { formFieldId: 'invoice_no', workflowDataPath: 'invoice.commercial_number', transformFunction: 'generateInvoiceNumber("COM")' },
      { formFieldId: 'invoice_date', workflowDataPath: 'invoice.date' },
      { formFieldId: 'contract_no', workflowDataPath: 'contract.number' },
      { formFieldId: 'shipper', workflowDataPath: 'cosun.export_entity_info' },
      { formFieldId: 'consignee', workflowDataPath: 'customer.import_entity_info' },
      { formFieldId: 'port_of_loading', workflowDataPath: 'shipping.loading_port' },
      { formFieldId: 'port_of_discharge', workflowDataPath: 'shipping.discharge_port' },
      { formFieldId: 'vessel', workflowDataPath: 'shipping.vessel_name' },
      { formFieldId: 'bl_no', workflowDataPath: 'shipping.bl_number' },
      { formFieldId: 'container_no', workflowDataPath: 'shipping.container_number' },
      { formFieldId: 'products_table', workflowDataPath: 'shipping.final_products' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_016',
        ruleName: 'balance_payment_confirmed',
        condition: 'payment.balance_confirmed === true',
        errorMessage: 'Balance payment must be confirmed'
      },
      {
        ruleId: 'vr_017',
        ruleName: 'shipping_docs_ready',
        condition: 'shipping.bl_number && shipping.vessel_name',
        errorMessage: 'Shipping documents must be ready'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'invoice_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'shipper', source: 'system', sourcePath: 'cosun_export_entity' },
      { fieldId: 'contract_no', source: 'workflow_context', sourcePath: 'contract.number' },
      { fieldId: 'products_table', source: 'workflow_context', sourcePath: 'contract.products' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'invoice', newStatus: 'issued', subType: 'commercial' }
      },
      {
        actionType: 'create_form',
        actionConfig: { formId: 'form_packing_list_001', trigger: 'auto' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['customer', 'freight_forwarder'],
          template: 'commercial_invoice_notification'
        }
      }
    ],
    
    priority: 'critical',
    estimatedDuration: '30 minutes',
    notes: '尾款确认后开具商业发票，用于报关清关',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_008',
    formId: 'form_packing_list_001',
    formName: '装箱单',
    formNameEn: 'Packing List',
    stepId: 'issue_commercial_invoice',
    stepName: '开具商业发票',
    stageId: 'shipping_stage',
    stageName: '🚢 出运阶段',
    stageOrder: 5,
    actor: 'admin_finance',
    
    triggerType: 'auto',
    triggerCondition: 'invoice.commercial_number !== null',
    triggerEvent: 'commercial_invoice_issued',
    
    fieldMappings: [
      { formFieldId: 'packing_list_no', workflowDataPath: 'packing_list.number', transformFunction: 'generatePackingListNumber()' },
      { formFieldId: 'date', workflowDataPath: 'packing_list.date' },
      { formFieldId: 'invoice_no', workflowDataPath: 'invoice.commercial_number' },
      { formFieldId: 'contract_no', workflowDataPath: 'contract.number' },
      { formFieldId: 'shipper', workflowDataPath: 'cosun.export_entity_info' },
      { formFieldId: 'consignee', workflowDataPath: 'customer.import_entity_info' },
      { formFieldId: 'container_no', workflowDataPath: 'shipping.container_number' },
      { formFieldId: 'seal_no', workflowDataPath: 'shipping.seal_number' },
      { formFieldId: 'packing_table', workflowDataPath: 'packing.details' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_018',
        ruleName: 'packing_completed',
        condition: 'packing.status === "completed"',
        errorMessage: 'Packing must be completed'
      },
      {
        ruleId: 'vr_019',
        ruleName: 'weight_verified',
        condition: 'packing.gross_weight_verified === true',
        errorMessage: 'Gross weight must be verified'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'invoice_no', source: 'workflow_context', sourcePath: 'invoice.commercial_number' },
      { fieldId: 'shipper', source: 'system', sourcePath: 'cosun_export_entity' },
      { fieldId: 'packing_table', source: 'workflow_context', sourcePath: 'packing.verified_details' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'shipping', newStatus: 'docs_ready' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['freight_forwarder', 'customer'],
          template: 'packing_list_notification'
        }
      }
    ],
    
    priority: 'high',
    estimatedDuration: '30 minutes',
    notes: '商业发票开具后自动生成装箱单',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_009',
    formId: 'form_delivery_note_001',
    formName: '供应商发货单',
    formNameEn: 'Supplier Delivery Note',
    stepId: 'supplier_delivery',
    stepName: '供应商发货',
    stageId: 'procurement_stage',
    stageName: '🏭 采购阶段',
    stageOrder: 4,
    actor: 'supplier',
    
    triggerType: 'manual',
    triggerCondition: 'purchase_order.status === "confirmed" && production.status === "completed"',
    triggerEvent: 'supplier_ready_to_deliver',
    
    fieldMappings: [
      { formFieldId: 'delivery_note_no', workflowDataPath: 'delivery.note_number' },
      { formFieldId: 'delivery_date', workflowDataPath: 'delivery.date' },
      { formFieldId: 'po_no', workflowDataPath: 'purchase_order.number' },
      { formFieldId: 'supplier_name', workflowDataPath: 'supplier.company_name' },
      { formFieldId: 'buyer_name', workflowDataPath: 'cosun.company_name', defaultValue: 'Fujian Cosun Tuff Building Materials Co., Ltd.' },
      { formFieldId: 'delivery_address', workflowDataPath: 'cosun.warehouse_address' },
      { formFieldId: 'products_table', workflowDataPath: 'delivery.products' },
      { formFieldId: 'transport_method', workflowDataPath: 'delivery.transport_method' },
      { formFieldId: 'estimated_arrival', workflowDataPath: 'delivery.eta' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_020',
        ruleName: 'po_confirmed',
        condition: 'purchase_order.status === "confirmed"',
        errorMessage: 'Purchase order must be confirmed'
      },
      {
        ruleId: 'vr_021',
        ruleName: 'quality_check_passed',
        condition: 'supplier.qc_status === "passed"',
        errorMessage: 'Quality check must be passed before delivery'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'delivery_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'po_no', source: 'workflow_context', sourcePath: 'purchase_order.number' },
      { fieldId: 'buyer_name', source: 'system', sourcePath: 'cosun_company_name' },
      { fieldId: 'products_table', source: 'workflow_context', sourcePath: 'purchase_order.products' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'delivery', newStatus: 'in_transit' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['procurement', 'warehouse'],
          template: 'delivery_notification'
        }
      },
      {
        actionType: 'trigger_workflow',
        actionConfig: { nextStepId: 'cosun_receive_goods' }
      }
    ],
    
    priority: 'high',
    estimatedDuration: '20 minutes',
    notes: '供应商生产完成后发货到Cosun仓库',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },

  {
    id: 'fwm_010',
    formId: 'form_statement_001',
    formName: '对账单',
    formNameEn: 'Statement of Account',
    stepId: 'monthly_reconciliation',
    stepName: '月度对账',
    stageId: 'payment_stage',
    stageName: '💰 收款阶段',
    stageOrder: 5,
    actor: 'admin_finance',
    
    triggerType: 'conditional',
    triggerCondition: 'date.isLastDayOfMonth() && customer.has_transactions',
    triggerEvent: 'month_end_reconciliation',
    
    fieldMappings: [
      { formFieldId: 'statement_no', workflowDataPath: 'statement.number', transformFunction: 'generateStatementNumber()' },
      { formFieldId: 'statement_date', workflowDataPath: 'statement.date' },
      { formFieldId: 'period_from', workflowDataPath: 'statement.period_start' },
      { formFieldId: 'period_to', workflowDataPath: 'statement.period_end' },
      { formFieldId: 'customer_name', workflowDataPath: 'customer.company_name' },
      { formFieldId: 'customer_code', workflowDataPath: 'customer.code' },
      { formFieldId: 'transactions_table', workflowDataPath: 'statement.all_transactions' },
      { formFieldId: 'opening_balance', workflowDataPath: 'statement.opening_balance' },
      { formFieldId: 'total_invoiced', workflowDataPath: 'statement.total_invoiced' },
      { formFieldId: 'total_received', workflowDataPath: 'statement.total_received' },
      { formFieldId: 'closing_balance', workflowDataPath: 'statement.closing_balance' }
    ],
    
    validationRules: [
      {
        ruleId: 'vr_022',
        ruleName: 'transactions_verified',
        condition: 'statement.all_transactions_verified === true',
        errorMessage: 'All transactions must be verified'
      },
      {
        ruleId: 'vr_023',
        ruleName: 'balance_matched',
        condition: 'Math.abs((opening_balance + total_invoiced - total_received) - closing_balance) < 0.01',
        errorMessage: 'Balance calculation mismatch'
      }
    ],
    
    autoPopulateFields: [
      { fieldId: 'statement_date', source: 'system', sourcePath: 'currentDate' },
      { fieldId: 'period_from', source: 'system', sourcePath: 'currentMonth.firstDay' },
      { fieldId: 'period_to', source: 'system', sourcePath: 'currentMonth.lastDay' },
      { fieldId: 'transactions_table', source: 'workflow_context', sourcePath: 'customer.monthly_transactions' }
    ],
    
    requiresApproval: false,
    
    postActions: [
      {
        actionType: 'update_status',
        actionConfig: { target: 'statement', newStatus: 'issued' }
      },
      {
        actionType: 'send_notification',
        actionConfig: {
          recipients: ['customer'],
          template: 'statement_notification',
          attachments: ['statement_pdf']
        }
      }
    ],
    
    priority: 'medium',
    estimatedDuration: '1 hour',
    notes: '月底自动生成对账单发给客户确认',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  }
];

// 🔥 辅助函数：根据表单ID获取映射
export const getMappingByFormId = (formId: string): FormStepMapping | undefined => {
  return formWorkflowMappings.find(m => m.formId === formId);
};

// 🔥 辅助函数：根据步骤ID获取映射
export const getMappingByStepId = (stepId: string): FormStepMapping[] => {
  return formWorkflowMappings.filter(m => m.stepId === stepId);
};

// 🔥 辅助函数：根据阶段ID获取映射
export const getMappingsByStageId = (stageId: string): FormStepMapping[] => {
  return formWorkflowMappings.filter(m => m.stageId === stageId);
};

// 🔥 辅助函数：根据角色获取映射
export const getMappingsByActor = (actor: string): FormStepMapping[] => {
  return formWorkflowMappings.filter(m => m.actor === actor);
};

// 🔥 辅助函数：获取自动触发的映射
export const getAutoTriggerMappings = (): FormStepMapping[] => {
  return formWorkflowMappings.filter(m => m.triggerType === 'auto');
};

// 🔥 辅助函数：验证映射数据
export const validateMappingData = (mapping: FormStepMapping, data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  mapping.validationRules.forEach(rule => {
    try {
      // 这里应该实现实际的规则验证逻辑
      // 简化示例
      const isValid = eval(rule.condition.replace(/\./g, '?.'));
      if (!isValid) {
        errors.push(rule.errorMessage);
      }
    } catch (error) {
      errors.push(`Validation error for rule ${rule.ruleId}: ${error}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default formWorkflowMappings;
