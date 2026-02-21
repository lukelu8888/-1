// 表格列标题配置管理
// 用于在表单模板管理器和表格列标题管理器之间同步数据

export interface ColumnDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'select' | 'file';
  width?: string;
  required?: boolean;
  editable?: boolean;
}

export interface FormTableConfig {
  formId: string;
  formName: string;
  columns: ColumnDefinition[];
}

// 初始表单列配置
export const initialFormConfigs: FormTableConfig[] = [
  {
    formId: 'inquiry_form',
    formName: '询价单 (Inquiry Form)',
    columns: [
      { id: 'col_1', name: 'Inquiry #', type: 'text', width: '120px', required: true, editable: false },
      { id: 'col_2', name: 'Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_3', name: 'Customer', type: 'text', width: '200px', required: true, editable: true },
      { id: 'col_4', name: 'Product Category', type: 'select', width: '180px', required: true, editable: true },
      { id: 'col_5', name: 'Quantity', type: 'number', width: '100px', required: true, editable: true },
      { id: 'col_6', name: 'Status', type: 'select', width: '120px', required: true, editable: true },
      { id: 'col_7', name: 'Actions', type: 'text', width: '150px', required: true, editable: false }
    ]
  },
  {
    formId: 'quotation_form',
    formName: '报价单 (Quotation Form)',
    columns: [
      { id: 'col_1', name: 'Quote #', type: 'text', width: '120px', required: true, editable: false },
      { id: 'col_2', name: 'Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_3', name: 'Customer', type: 'text', width: '200px', required: true, editable: true },
      { id: 'col_4', name: 'Product', type: 'text', width: '250px', required: true, editable: true },
      { id: 'col_5', name: 'Unit Price', type: 'currency', width: '120px', required: true, editable: true },
      { id: 'col_6', name: 'Quantity', type: 'number', width: '100px', required: true, editable: true },
      { id: 'col_7', name: 'Total Amount', type: 'currency', width: '150px', required: true, editable: false },
      { id: 'col_8', name: 'Validity', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_9', name: 'Status', type: 'select', width: '120px', required: true, editable: true },
      { id: 'col_10', name: 'Actions', type: 'text', width: '150px', required: true, editable: false }
    ]
  },
  {
    formId: 'order_form',
    formName: '订单 (Order Form)',
    columns: [
      { id: 'col_1', name: 'Order #', type: 'text', width: '120px', required: true, editable: false },
      { id: 'col_2', name: 'Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_3', name: 'Product', type: 'text', width: '250px', required: true, editable: true },
      { id: 'col_4', name: 'Quantity', type: 'number', width: '100px', required: true, editable: true },
      { id: 'col_5', name: 'Price', type: 'currency', width: '120px', required: true, editable: true },
      { id: 'col_6', name: 'Deposit Proof', type: 'file', width: '150px', required: false, editable: true },
      { id: 'col_7', name: 'Balance Proof', type: 'file', width: '150px', required: false, editable: true },
      { id: 'col_8', name: 'Status', type: 'select', width: '120px', required: true, editable: true },
      { id: 'col_9', name: 'Actions', type: 'text', width: '150px', required: true, editable: false }
    ]
  },
  {
    formId: 'contract_form',
    formName: '合同 (Contract Form)',
    columns: [
      { id: 'col_1', name: 'Contract #', type: 'text', width: '120px', required: true, editable: false },
      { id: 'col_2', name: 'Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_3', name: 'Customer', type: 'text', width: '200px', required: true, editable: true },
      { id: 'col_4', name: 'Contract Value', type: 'currency', width: '150px', required: true, editable: true },
      { id: 'col_5', name: 'Payment Terms', type: 'select', width: '180px', required: true, editable: true },
      { id: 'col_6', name: 'Delivery Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_7', name: 'Status', type: 'select', width: '120px', required: true, editable: true },
      { id: 'col_8', name: 'Actions', type: 'text', width: '150px', required: true, editable: false }
    ]
  },
  {
    formId: 'shipment_form',
    formName: '发货单 (Shipment Form)',
    columns: [
      { id: 'col_1', name: 'Shipment #', type: 'text', width: '120px', required: true, editable: false },
      { id: 'col_2', name: 'Order #', type: 'text', width: '120px', required: true, editable: true },
      { id: 'col_3', name: 'Ship Date', type: 'date', width: '150px', required: true, editable: true },
      { id: 'col_4', name: 'Carrier', type: 'select', width: '150px', required: true, editable: true },
      { id: 'col_5', name: 'Tracking #', type: 'text', width: '180px', required: false, editable: true },
      { id: 'col_6', name: 'Destination', type: 'text', width: '200px', required: true, editable: true },
      { id: 'col_7', name: 'Status', type: 'select', width: '120px', required: true, editable: true },
      { id: 'col_8', name: 'Actions', type: 'text', width: '150px', required: true, editable: false }
    ]
  }
];

// 🔑 本地存储键名
export const STORAGE_KEY = 'table_column_config';

// 📥 从localStorage加载配置
export const loadTableColumnConfig = (): FormTableConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ 已从localStorage加载表格列配置');
      return parsed;
    }
  } catch (error) {
    console.error('❌ 加载表格列配置失败:', error);
  }
  return initialFormConfigs;
};

// 💾 保存配置到localStorage
export const saveTableColumnConfig = (configs: FormTableConfig[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    console.log('✅ 表格列配置已保存到localStorage');
    
    // 🔔 触发自定义事件，通知其他组件
    window.dispatchEvent(new CustomEvent('tableColumnConfigChanged', { 
      detail: configs 
    }));
  } catch (error) {
    console.error('❌ 保存表格列配置失败:', error);
  }
};

// 🔍 根据formId获取表格列配置
export const getTableColumnConfigByFormId = (formId: string): FormTableConfig | undefined => {
  const configs = loadTableColumnConfig();
  return configs.find(config => config.formId === formId);
};

// 🔄 更新单个表单的列配置
export const updateFormTableConfig = (formId: string, columns: ColumnDefinition[]): void => {
  const configs = loadTableColumnConfig();
  const index = configs.findIndex(c => c.formId === formId);
  
  if (index >= 0) {
    configs[index].columns = columns;
    saveTableColumnConfig(configs);
  }
};
