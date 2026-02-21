// 🔥 升级版表单布局系统 - 支持无限网格、灵活定位
// Advanced Form Layout System with Infinite Grid Support

export type FieldType = 
  | 'text' | 'number' | 'date' | 'datetime' | 'time'
  | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio'
  | 'table' | 'image' | 'logo' | 'signature' | 'calculated'
  | 'html' | 'divider' | 'spacer' | 'qrcode' | 'barcode';

// 🔥 字段的网格位置定义
export interface GridPosition {
  row: number;           // 起始行（从1开始）
  col: number;           // 起始列（从1开始）
  rowSpan?: number;      // 占据的行数（默认1）
  colSpan?: number;      // 占据的列数（默认1）
}

// 🔥 高级字段定义
export interface AdvancedFormField {
  id: string;
  label: string;
  type: FieldType;
  
  // 网格定位（精确控制位置）
  grid?: GridPosition;
  
  // 传统宽度（向后兼容）
  width?: string;
  
  // 字段属性
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: string[] | { value: string; label: string }[];
  
  // 样式控制
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' | number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  
  // 高级样式
  customCSS?: string;
  customHtml?: string; // 用于 html 类型字段
  
  // 验证规则
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
  
  // 计算字段
  calculation?: string | ((formData: any) => any);
  
  // 条件显示
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  
  // 表格配置（当 type 为 'table' 时）
  tableConfig?: {
    columns: Array<{
      id: string;
      label: string;
      type: FieldType;
      width?: string;
      editable?: boolean;
    }>;
    minRows?: number;
    maxRows?: number;
    allowAdd?: boolean;
    allowDelete?: boolean;
    calculations?: {
      columnId: string;
      formula: string;
    }[];
  };
}

// 🔥 高级布局系统
export interface AdvancedLayout {
  type: 'grid' | 'flex' | 'absolute' | 'custom';
  
  // Grid 布局配置
  grid?: {
    columns: number | string;      // 列数或 CSS grid-template-columns
    rows?: number | string;         // 行数或 CSS grid-template-rows
    columnGap?: string;             // 列间距
    rowGap?: string;                // 行间距
    autoRows?: string;              // 自动行高
    autoColumns?: string;           // 自动列宽
    areas?: string[];               // 网格区域定义
  };
  
  // Flex 布局配置
  flex?: {
    direction: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    gap?: string;
  };
  
  // 自定义 CSS
  customCSS?: string;
}

// 🔥 高级区块定义
export interface AdvancedFormSection {
  id: string;
  name: string;
  title?: string;
  
  // 布局系统
  layout: AdvancedLayout;
  
  // 字段列表
  fields: AdvancedFormField[];
  
  // 样式
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  minHeight?: string;
  maxHeight?: string;
  
  // 条件显示
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: any;
  };
  
  // 可折叠
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// 🔥 页面布局配置
export interface PageLayout {
  pageSize: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5' | 'custom';
  customSize?: { width: string; height: string }; // 自定义尺寸（mm 或 in）
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    unit?: 'mm' | 'in' | 'px';
  };
  
  // 多页支持
  multiPage?: boolean;
  pageBreak?: 'auto' | 'section' | 'none';
  
  // 页眉页脚
  header?: {
    enabled: boolean;
    height?: string;
    content?: AdvancedFormSection;
  };
  footer?: {
    enabled: boolean;
    height?: string;
    content?: AdvancedFormSection;
  };
}

// 🔥 高级表单模板
export interface AdvancedFormTemplate {
  id: string;
  name: string;
  name_en: string;
  description?: string;
  
  // 表单分类
  type: string;
  category?: string;
  owner: 'customer' | 'cosun' | 'supplier' | string;
  
  // 版本控制
  version: string;
  lastModified: string;
  createdBy?: string;
  
  // 页面布局
  layout: PageLayout;
  
  // 表单区块
  sections: AdvancedFormSection[];
  
  // 全局样式
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    customCSS?: string;
  };
  
  // 数据模型
  dataSchema?: {
    [fieldId: string]: {
      type: string;
      required?: boolean;
      default?: any;
      validation?: any;
    };
  };
  
  // 业务逻辑
  businessRules?: {
    calculations?: Array<{
      field: string;
      formula: string;
    }>;
    validations?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
    workflows?: Array<{
      trigger: string;
      action: string;
      condition?: string;
    }>;
  };
  
  // 打印配置
  printSettings?: {
    scale?: number;
    fitToPage?: boolean;
    showGrid?: boolean;
    showBorders?: boolean;
    backgroundColor?: string;
  };
}

// 🔥 布局工具函数
export class LayoutEngine {
  /**
   * 生成网格布局的 CSS Grid 样式
   */
  static generateGridStyle(layout: AdvancedLayout): React.CSSProperties {
    if (layout.type !== 'grid' || !layout.grid) return {};
    
    const { columns, rows, columnGap, rowGap, autoRows, autoColumns, areas } = layout.grid;
    
    return {
      display: 'grid',
      gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
      gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, auto)` : rows,
      gridColumnGap: columnGap || '8px',
      gridRowGap: rowGap || '8px',
      gridAutoRows: autoRows || 'auto',
      gridAutoColumns: autoColumns || 'auto',
      gridTemplateAreas: areas ? areas.map(a => `"${a}"`).join(' ') : undefined,
    };
  }
  
  /**
   * 生成字段的网格位置样式
   */
  static generateFieldGridStyle(field: AdvancedFormField): React.CSSProperties {
    if (!field.grid) return {};
    
    const { row, col, rowSpan = 1, colSpan = 1 } = field.grid;
    
    return {
      gridRow: rowSpan > 1 ? `${row} / span ${rowSpan}` : `${row}`,
      gridColumn: colSpan > 1 ? `${col} / span ${colSpan}` : `${col}`,
    };
  }
  
  /**
   * 生成 Flex 布局样式
   */
  static generateFlexStyle(layout: AdvancedLayout): React.CSSProperties {
    if (layout.type !== 'flex' || !layout.flex) return {};
    
    const { direction, wrap, justifyContent, alignItems, gap } = layout.flex;
    
    return {
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap,
      justifyContent: justifyContent,
      alignItems: alignItems,
      gap: gap || '8px',
    };
  }
  
  /**
   * 将旧版表单转换为新版格式
   */
  static migrateOldTemplate(oldTemplate: any): AdvancedFormTemplate {
    // 兼容旧版表单模板
    return {
      id: oldTemplate.id,
      name: oldTemplate.name,
      name_en: oldTemplate.name_en,
      description: oldTemplate.description,
      type: oldTemplate.type,
      owner: oldTemplate.owner,
      version: oldTemplate.version,
      lastModified: oldTemplate.lastModified,
      
      layout: {
        pageSize: oldTemplate.layout?.pageSize || 'Letter',
        orientation: oldTemplate.layout?.orientation || 'portrait',
        margins: oldTemplate.layout?.margins || { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5, unit: 'in' },
      },
      
      sections: oldTemplate.sections?.map((section: any, idx: number) => ({
        id: section.id || `section_${idx}`,
        name: section.name || section.id || `section_${idx}`,
        title: section.title,
        layout: {
          type: 'grid',
          grid: {
            columns: this.inferColumnsFromLayout(section.layout),
            columnGap: '12px',
            rowGap: '12px',
          },
        },
        fields: section.fields || [],
        backgroundColor: section.backgroundColor,
      })) || [],
    };
  }
  
  private static inferColumnsFromLayout(layout?: string): number {
    if (layout === 'single') return 1;
    if (layout === 'double') return 2;
    if (layout === 'triple') return 3;
    return 12; // 默认12列网格
  }
}

// 🔥 预设布局模板
export const PRESET_LAYOUTS = {
  // 单列布局
  singleColumn: {
    type: 'grid',
    grid: { columns: 1, columnGap: '0', rowGap: '12px' },
  } as AdvancedLayout,
  
  // 双列布局
  doubleColumn: {
    type: 'grid',
    grid: { columns: 2, columnGap: '16px', rowGap: '12px' },
  } as AdvancedLayout,
  
  // 三列布局
  tripleColumn: {
    type: 'grid',
    grid: { columns: 3, columnGap: '12px', rowGap: '12px' },
  } as AdvancedLayout,
  
  // 12列响应式网格
  responsive12: {
    type: 'grid',
    grid: { columns: 12, columnGap: '8px', rowGap: '8px' },
  } as AdvancedLayout,
  
  // 24列精细网格
  fine24: {
    type: 'grid',
    grid: { columns: 24, columnGap: '4px', rowGap: '8px' },
  } as AdvancedLayout,
  
  // 左右分栏（30% / 70%）
  leftRightSplit: {
    type: 'grid',
    grid: { columns: '30% 70%', columnGap: '20px', rowGap: '12px' },
  } as AdvancedLayout,
  
  // 表头布局（logo + title + info）
  headerLayout: {
    type: 'grid',
    grid: { columns: '150px 1fr 200px', columnGap: '20px', rowGap: '0' },
  } as AdvancedLayout,
  
  // 表格行布局
  tableRow: {
    type: 'flex',
    flex: {
      direction: 'row',
      wrap: 'nowrap',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '8px',
    },
  } as AdvancedLayout,
};

export default AdvancedFormTemplate;
