// 🔥 高级表单渲染引擎 - 支持网格布局和灵活定位
// Advanced Form Renderer with Grid Layout Support

import React, { useState, useEffect, useRef } from 'react';
import { AdvancedFormTemplate, AdvancedFormSection, AdvancedFormField, LayoutEngine } from '../../config/formLayoutSystem';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { FileText, X, Grid3x3, Save, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface AdvancedFormRendererProps {
  template: AdvancedFormTemplate;
  data?: any;
  onChange?: (data: any) => void;
  readOnly?: boolean;
  showGrid?: boolean; // 是否显示网格线（调试用）
  showPageBreaks?: boolean; // 是否显示分页线（PDF预览用）
  editMode?: boolean; // 🎯 是否启用编辑模式（可调整列宽）
}

export function AdvancedFormRenderer({
  template,
  data = {},
  onChange,
  readOnly = false,
  showGrid = false,
  showPageBreaks = false,
  editMode = false,
}: AdvancedFormRendererProps) {
  const [formData, setFormData] = useState(data);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null); // 🎯 当前编辑的section
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFieldChange = (fieldId: string, value: any) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);
    onChange?.(newData);
  };

  // 🎯 点击section进入编辑模式
  const handleSectionClick = (sectionId: string) => {
    if (editMode) {
      setEditingSectionId(sectionId);
    }
  };

  // 智能分页：检测并调整section位置，避免被分页线切断
  useEffect(() => {
    if (!showPageBreaks || !containerRef.current) return;

    // 使用 requestAnimationFrame 确保 DOM 已完全渲染
    requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // A4纸张尺寸和页边距
      const TOTAL_PAGE_HEIGHT = 1123; // A4纸张总高度（像素）
      const MARGIN_TOP = 57;          // 顶部页边距（15mm）
      const MARGIN_BOTTOM = 57;       // 底部页边距（15mm）
      const CONTENT_HEIGHT = TOTAL_PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM; // 可用内容高度 = 1009px
      const PAGE_HEIGHT = TOTAL_PAGE_HEIGHT; // 保持兼容性

      const sections = containerRef.current.querySelectorAll('.section-block');
      
      // 先重置所有section的margin，避免累积
      sections.forEach((section) => {
        const element = section as HTMLElement;
        if (element.getAttribute('data-page-break')) {
          element.style.marginTop = '';
          element.style.borderTop = '';
          element.removeAttribute('data-page-break');
        }
      });

      // 等待重置完成后重新计算
      requestAnimationFrame(() => {
        if (!containerRef.current) return;
        
        const sections = containerRef.current.querySelectorAll('.section-block');
        
        sections.forEach((section) => {
          const element = section as HTMLElement;
          
          // 使用 offsetTop 获取元素相对于其 offsetParent 的位置
          let offsetTop = 0;
          let currentElement: HTMLElement | null = element;
          
          // 累加所有父元素的 offsetTop，直到容器
          while (currentElement && currentElement !== containerRef.current) {
            offsetTop += currentElement.offsetTop;
            currentElement = currentElement.offsetParent as HTMLElement;
          }
          
          const sectionHeight = element.offsetHeight;
          
          // 计算当前section所在的页码和在页面内的位置
          const currentPage = Math.floor(offsetTop / TOTAL_PAGE_HEIGHT);
          const positionInPage = offsetTop % TOTAL_PAGE_HEIGHT;
          const bottomInPage = positionInPage + sectionHeight;
          
          // 计算内容安全区域的底部位置（需要预留底部边距）
          const safeBottomPosition = TOTAL_PAGE_HEIGHT - MARGIN_BOTTOM;
          
          // 计算section溢出安全区域的高度
          const overflowHeight = bottomInPage - safeBottomPosition;
          
          // 智能分页策略：
          // 1. 小section（<150px）：如果底部超出页面>50px，推到下一页
          // 2. 中等section（150-350px）：如果底部超出页面>100px，推到下一页  
          // 3. 大section（>350px）：不做调整，让它自然跨页
          
          let shouldPushToNextPage = false;
          
          if (sectionHeight < 150) {
            // 小section：溢出50px就推下去
            shouldPushToNextPage = overflowHeight > 50 && positionInPage > MARGIN_TOP + 100;
          } else if (sectionHeight < 350) {
            // 中等section：溢出100px才推下去，让更多内容留在第1页
            shouldPushToNextPage = overflowHeight > 100 && positionInPage > MARGIN_TOP + 200;
          }
          // 大section不做调整
          
          if (shouldPushToNextPage && bottomInPage > safeBottomPosition && positionInPage < TOTAL_PAGE_HEIGHT) {
            // 下一页的内容开始位置 = 下一页起始 + 顶部边距
            const nextPageStart = (currentPage + 1) * TOTAL_PAGE_HEIGHT + MARGIN_TOP;
            const marginNeeded = nextPageStart - offsetTop;
            
            element.style.marginTop = `${marginNeeded}px`;
            element.style.borderTop = '3px solid #10B981';
            element.setAttribute('data-page-break', 'before');
            
            console.log(`📄 分页调整: Section ${element.getAttribute('data-section-id')}`, {
              offsetTop,
              sectionHeight,
              positionInPage,
              bottomInPage,
              safeBottomPosition,
              overflowHeight,
              marginNeeded,
              nextPageStart,
            });
          }
        });
      });
    });
  }, [showPageBreaks, formData, template]);

  // 渲染单个字段
  const renderField = (field: AdvancedFormField, sectionId: string) => {
    let fieldStyle: React.CSSProperties = {
      ...LayoutEngine.generateFieldGridStyle(field),
      fontSize: field.fontSize ? `${field.fontSize}px` : undefined,
      fontWeight: field.fontWeight,
      fontFamily: field.fontFamily,
      // textAlign不应用在容器上，而应该应用在内容上
      color: field.color,
      backgroundColor: field.backgroundColor,
      border: field.border,
      borderRadius: field.borderRadius,
      padding: field.padding,
      margin: field.margin,
    };

    // 调试模式：为字段添加边框
    if (showGrid && field.grid) {
      fieldStyle = {
        ...fieldStyle,
        border: '1px solid rgba(249, 99, 2, 0.5)',
        backgroundColor: fieldStyle.backgroundColor || 'rgba(249, 99, 2, 0.05)',
      };
    }

    // HTML 类型字段
    if (field.type === 'html') {
      return (
        <div
          key={field.id}
          style={fieldStyle}
          dangerouslySetInnerHTML={{ __html: field.customHtml || '' }}
        />
      );
    }

    // 分隔符
    if (field.type === 'divider') {
      return (
        <div
          key={field.id}
          style={{
            ...fieldStyle,
            borderTop: '1px solid #DDD',
            margin: '12px 0',
          }}
        />
      );
    }

    // 占位符
    if (field.type === 'spacer') {
      return <div key={field.id} style={fieldStyle} />;
    }

    // 表格类型
    if (field.type === 'table' && field.tableConfig) {
      return (
        <div key={field.id} style={fieldStyle}>
          <TableField
            field={field}
            value={formData[field.id] || []}
            onChange={(value) => handleFieldChange(field.id, value)}
            readOnly={readOnly}
          />
        </div>
      );
    }

    // 计算字段
    if (field.type === 'calculated') {
      const calculatedValue = calculateFieldValue(field, formData);
      return (
        <div key={field.id} style={fieldStyle} className="flex flex-col gap-1">
          {field.label && (
            <label 
              className="text-xs font-semibold text-gray-600 uppercase"
              style={{ textAlign: field.textAlign || 'left' }}
            >
              {field.label}
            </label>
          )}
          <div 
            className="font-bold" 
            style={{ 
              color: field.color || template.styling?.primaryColor || '#333',
              textAlign: field.textAlign || 'left',
              fontSize: field.fontSize ? `${field.fontSize}px` : '14px',
              padding: '4px 0',  // 添加一些padding确保可见
            }}
          >
            {formatValue(calculatedValue, field)}
          </div>
        </div>
      );
    }

    // 普通输入字段
    return (
      <div key={field.id} style={fieldStyle} className="flex flex-col gap-1">
        {field.label && (
          <label 
            className="text-xs font-semibold text-gray-600 uppercase"
            style={{ textAlign: field.textAlign || 'left' }}
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div style={{ textAlign: field.textAlign || 'left' }}>
          {renderInput(field, formData[field.id], (value) => handleFieldChange(field.id, value), readOnly)}
        </div>
      </div>
    );
  };

  // 渲染输入控件
  const renderInput = (field: AdvancedFormField, value: any, onChange: (value: any) => void, readOnly: boolean) => {
    const inputStyle: React.CSSProperties = {
      fontSize: field.fontSize ? `${field.fontSize}px` : undefined,
      fontWeight: field.fontWeight,
      textAlign: field.textAlign || 'left',  // 添加textAlign到input样式
    };

    if (readOnly) {
      return <div style={inputStyle} className="p-2 bg-gray-50 rounded">{value || '-'}</div>;
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={inputStyle}
            className="text-sm"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder={field.placeholder}
            style={inputStyle}
            className="text-sm"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            className="text-sm"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={{ ...inputStyle, minHeight: '80px' }}
            className="w-full p-2 border rounded text-sm"
          />
        );

      case 'select':
        return (
          <select
            value={value || field.defaultValue || ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => {
              const optValue = typeof opt === 'string' ? opt : opt.value;
              const optLabel = typeof opt === 'string' ? opt : opt.label;
              return (
                <option key={optValue} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4"
            />
            <span style={inputStyle}>{field.placeholder}</span>
          </label>
        );

      default:
        return <Input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
    }
  };

  // 渲染区块
  const renderSection = (section: AdvancedFormSection) => {
    const sectionStyle: React.CSSProperties = {
      backgroundColor: section.backgroundColor,
      border: section.border,
      borderRadius: section.borderRadius,
      padding: section.padding,
      margin: section.margin,
      minHeight: section.minHeight,
      maxHeight: section.maxHeight,
      position: 'relative',
      pageBreakInside: 'avoid',  // 避免section被分页切断
      breakInside: 'avoid',       // CSS3标准属性
    };

    // 生成布局样式
    let layoutStyle: React.CSSProperties = {};
    if (section.layout.type === 'grid') {
      layoutStyle = LayoutEngine.generateGridStyle(section.layout);
    } else if (section.layout.type === 'flex') {
      layoutStyle = LayoutEngine.generateFlexStyle(section.layout);
    }

    // 调试模式或编辑模式：显示网格线
    if ((showGrid || editMode) && section.layout.type === 'grid') {
      layoutStyle = {
        ...layoutStyle,
        border: editMode ? '2px solid #F96302' : '2px dashed #F96302',
        backgroundColor: 'rgba(249, 99, 2, 0.03)',
        outline: editMode ? '2px solid rgba(249, 99, 2, 0.4)' : '1px solid rgba(249, 99, 2, 0.2)',
        outlineOffset: '-4px',
        cursor: editMode ? 'pointer' : 'default',
        transition: editMode ? 'all 0.2s ease' : 'none',
      };
    }

    // 添加分页控制class
    // 检查section是否有自定义margin，如果有就不添加默认的mb-4
    const hasCustomMargin = section.margin && section.margin !== '0';
    const sectionClasses = [
      !hasCustomMargin && 'mb-4',  // 只有在没有自定义margin时才添加默认margin
      'relative',
      'section-block',
      'page-break-inside-avoid', // 用于PDF导出时避免切断
      editMode && 'hover:shadow-lg', // 🎯 编辑模式下hover效果
      editMode && 'transition-shadow', // 🎯 平滑过渡
    ].filter(Boolean).join(' ');

    return (
      <div 
        key={section.id} 
        style={sectionStyle} 
        className={sectionClasses}
        data-section-id={section.id}
        onClick={() => editMode && handleSectionClick(section.id)}
      >
        {section.title && (
          <h3 className="text-sm font-bold mb-3 pb-2 border-b" style={{ color: template.styling?.primaryColor }}>
            {section.title}
          </h3>
        )}
        <div style={layoutStyle} className={showGrid ? 'relative' : ''}>
          {section.fields.map((field) => renderField(field, section.id))}
        </div>
        
        {/* 🎯 网格信息标签 - 在调试模式或编辑模式下显示 */}
        {(showGrid || editMode) && section.layout.type === 'grid' && (
          <div 
            className="absolute top-0 right-0 text-white text-[10px] px-2 py-1 rounded-bl shadow-lg font-bold z-10 pointer-events-none"
            style={{ backgroundColor: '#F96302', transform: 'translateY(-100%)' }}
          >
            {typeof section.layout.grid?.columns === 'number' 
              ? `${section.layout.grid.columns} cols × ${section.fields.length} fields`
              : `${section.layout.grid?.columns} × ${section.fields.length} fields`}
          </div>
        )}
      </div>
    );
  };

  // 页面样式 - 标准A4尺寸
  const getPageDimensions = () => {
    if (template.layout.pageSize === 'A4') {
      // A4尺寸：210mm × 297mm
      // 在96 DPI下：210mm = 794px, 297mm = 1123px
      return { width: '794px', height: '1123px' };
    } else if (template.layout.pageSize === 'Letter') {
      return { width: '8.5in', height: '11in' };
    }
    return { width: '794px', height: '1123px' }; // 默认A4
  };
  
  const dimensions = getPageDimensions();
  
  const pageStyle: React.CSSProperties = {
    width: dimensions.width,
    minHeight: dimensions.height,
    height: 'auto', // 允许内容自动扩展
    padding: `${template.layout.margins.top}${template.layout.margins.unit || 'mm'} ${template.layout.margins.right}${template.layout.margins.unit || 'mm'} ${template.layout.margins.bottom}${template.layout.margins.unit || 'mm'} ${template.layout.margins.left}${template.layout.margins.unit || 'mm'}`,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    margin: '0 auto',
    fontFamily: template.styling?.fontFamily,
    fontSize: template.styling?.fontSize ? `${template.styling.fontSize}px` : undefined,
    lineHeight: template.styling?.lineHeight,
    boxSizing: 'border-box', // padding包含在宽度内
    overflow: 'visible', // 确保内容不会被裁剪
  };

  // 如果启用分页显示，将sections分配到不同页面
  const getPaginatedSections = () => {
    if (!showPageBreaks) {
      return [{ pageNumber: 1, sections: template.sections }];
    }

    // 对于Commercial Invoice等多页文档，手动定义页面分配
    // 这里先简单实现：将所有sections放在连续的页面上
    // 实际应该根据每个section的实际渲染高度智能分页
    
    // 简化版本：前6个sections在第1页，其余在第2页
    const pages: Array<{ pageNumber: number; sections: AdvancedFormSection[] }> = [];
    
    // 根据template的sections数量和特点来分页
    const sectionsPerPage = Math.ceil(template.sections.length / 2);
    
    pages.push({
      pageNumber: 1,
      sections: template.sections.slice(0, sectionsPerPage)
    });
    
    if (template.sections.length > sectionsPerPage) {
      pages.push({
        pageNumber: 2,
        sections: template.sections.slice(sectionsPerPage)
      });
    }

    return pages;
  };

  const pages = getPaginatedSections();

  return (
    <div className="bg-gray-100 p-8">
      {/* 为每页创建独立的A4容器 */}
      {pages.map((page, pageIndex) => (
        <div 
          key={page.pageNumber}
          id={pageIndex === 0 ? 'form-content-for-export' : `form-page-${page.pageNumber}`}
          ref={pageIndex === 0 ? containerRef : undefined}
          style={{
            ...pageStyle,
            height: showPageBreaks ? dimensions.height : 'auto', // 分页模式固定高度，否则自动
            marginBottom: showPageBreaks ? '20px' : '0', // 页面之间的间隙
            transform: 'scale(1.3)', // 🎯 放大30%
            transformOrigin: 'top center', // 从顶部中心开始缩放
          }}
          className="relative"
        >
          {page.sections.map((section) => renderSection(section))}
          
          {/* 页码 */}
          {showPageBreaks && (
            <div 
              className="absolute bottom-4 right-8 text-gray-400 text-xs font-mono"
              style={{ fontSize: '10px' }}
            >
              Page {page.pageNumber} of {pages.length}
            </div>
          )}
        </div>
      ))}
      
      {/* 调试工具 */}
      {showGrid && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded shadow-lg border-2 border-green-500">
          <h4 className="font-bold mb-2 text-green-700">📐 布局调试</h4>
          <div className="text-xs space-y-1">
            <div className="font-bold text-green-600">
              📄 页面: {template.layout.pageSize} (794×1123px / 210×297mm)
            </div>
            <div>方向: {template.layout.orientation === 'portrait' ? '竖向' : '横向'}</div>
            <div>边距: {template.layout.margins.top}{template.layout.margins.unit}</div>
            <div>区块数: {template.sections.length}</div>
          </div>
        </div>
      )}
      
      {/* 分页预览说明 */}
      {showPageBreaks && (
        <div className="fixed bottom-4 left-4 bg-white p-4 rounded-lg shadow-xl border-2 border-orange-500 max-w-sm">
          <h4 className="font-bold mb-3 text-orange-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            📄 多页A4预览模式
          </h4>
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-orange-600">每页独立显示</div>
            </div>
            <div className="mt-3 pt-3 border-t space-y-1">
              <div className="font-semibold text-gray-800">📏 A4标准规格</div>
              <div className="text-gray-600">
                • 纸张: 210×297mm (794×1123px)
              </div>
              <div className="text-gray-600">
                • 页边距: 15mm (约57px)
              </div>
              <div className="text-gray-600">
                • 页面间隔: 20px
              </div>
              <div className="text-gray-600">
                • 总页数: {pages.length}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="text-orange-700 font-semibold">
                ✨ 每页A4标准尺寸，独立显示
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 表格字段组件
function TableField({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: AdvancedFormField;
  value: any[];
  onChange: (value: any[]) => void;
  readOnly: boolean;
}) {
  const config = field.tableConfig!;
  // 确保value是数组，如果不是则使用minRows创建空行
  const rows = (Array.isArray(value) && value.length > 0) ? value : Array(config.minRows || 1).fill({});

  const handleCellChange = (rowIndex: number, columnId: string, cellValue: any) => {
    const newRows = [...rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: cellValue };
    onChange(newRows);
  };

  const addRow = () => {
    if (config.maxRows && rows.length >= config.maxRows) return;
    onChange([...rows, {}]);
  };

  const deleteRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="overflow-x-auto border rounded">
      <table className="w-full text-xs">
        <thead className="bg-gray-100">
          <tr>
            {config.columns.map((col) => (
              <th
                key={col.id}
                className="px-2 py-1 text-left font-semibold border-b"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
            {config.allowDelete && !readOnly && <th className="px-2 py-1 w-12"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50">
              {config.columns.map((col) => (
                <td key={col.id} className="px-2 py-1">
                  {col.editable && !readOnly ? (
                    col.type === 'select' ? (
                      <select
                        value={row[col.id] || ''}
                        onChange={(e) => handleCellChange(rowIndex, col.id, e.target.value)}
                        className="w-full px-1.5 py-0.5 border rounded text-xs"
                      >
                        <option value="">-</option>
                        <option value="EA">EA</option>
                        <option value="PCS">PCS</option>
                        <option value="BOX">BOX</option>
                      </select>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        value={row[col.id] || ''}
                        onChange={(e) =>
                          handleCellChange(
                            rowIndex,
                            col.id,
                            col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                          )
                        }
                        className="w-full px-1.5 py-0.5 border rounded text-xs"
                      />
                    )
                  ) : (
                    <span className="text-xs">{row[col.id] || '-'}</span>
                  )}
                </td>
              ))}
              {config.allowDelete && !readOnly && (
                <td className="px-2 py-1">
                  <Button
                    onClick={() => deleteRow(rowIndex)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500"
                  >
                    ×
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {config.allowAdd && !readOnly && (
        <Button onClick={addRow} size="sm" className="m-1.5">
          + Add Row
        </Button>
      )}
    </div>
  );
}

// 计算字段值
function calculateFieldValue(field: AdvancedFormField, formData: any): any {
  if (typeof field.calculation === 'function') {
    return field.calculation(formData);
  }
  if (typeof field.calculation === 'string') {
    // 简单的计算表达式解析（实际项目中应使用更强大的表达式引擎）
    try {
      return eval(field.calculation.replace(/\{(\w+)\}/g, (_, key) => formData[key] || 0));
    } catch (e) {
      return 0;
    }
  }
  
  // 处理对象类型的calculation（如sum, formula等）
  if (typeof field.calculation === 'object' && field.calculation !== null) {
    const calc = field.calculation as any;
    
    // Sum类型：从表格数据求和
    if (calc.type === 'sum' && calc.sourceTable && calc.sourceColumn) {
      const tableData = formData[calc.sourceTable] || [];
      const sum = tableData.reduce((acc: number, row: any) => {
        const value = parseFloat(row[calc.sourceColumn]) || 0;
        return acc + value;
      }, 0);
      return sum;
    }
    
    // Formula类型：计算公式
    if (calc.type === 'formula' && calc.formula) {
      try {
        // 替换公式中的字段引用为实际值
        const formula = calc.formula.replace(/(\w+)/g, (match: string) => {
          // 如果是数字或运算符，保持不变
          if (/^[\d.]+$/.test(match) || ['+', '-', '*', '/', '(', ')'].includes(match)) {
            return match;
          }
          // 否则从formData获取值
          return String(formData[match] || 0);
        });
        return eval(formula);
      } catch (e) {
        console.error('Formula calculation error:', e);
        return 0;
      }
    }
  }
  
  return field.defaultValue || 0;
}

// 格式化值
function formatValue(value: any, field: AdvancedFormField): string {
  if (value === null || value === undefined) return '-';
  
  if (field.type === 'number' || field.type === 'calculated') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  }
  
  return String(value);
}

export default AdvancedFormRenderer;
