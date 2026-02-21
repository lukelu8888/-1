import React, { useState, useEffect } from 'react'; // 🔥 添加useEffect
import { Button } from '../ui/button';
import { X, ZoomIn, ZoomOut, Printer, Download, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react'; // 🔥 添加Edit2图标
import { FormTemplate } from '../../config/formTemplates';
import homeDepotFormTemplates from '../../config/formTemplatesHomeDepot';

interface FormTemplatePreviewProps {
  template: FormTemplate;
  onClose: () => void;
  onEdit?: (template: FormTemplate) => void; // 🔥 新增：编辑回调
}

export function FormTemplatePreview({ template, onClose, onEdit }: FormTemplatePreviewProps) {
  const [zoom, setZoom] = useState(130); // 🎯 默认放大30%
  const [currentPage, setCurrentPage] = useState(1);

  // 🔥 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC键关闭
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      // Ctrl+P 打印
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
        return;
      }
      
      // Ctrl+E 编辑
      if ((e.ctrlKey || e.metaKey) && e.key === 'e' && onEdit) {
        e.preventDefault();
        handleEdit();
        return;
      }
      
      // 缩放快捷键
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(prev => Math.min(200, prev + 10));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(prev => Math.max(50, prev - 10));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onEdit]); // 🔥 添加依赖

  // 🔥 打印功能
  const handlePrint = () => {
    // 获取表单预览区域的内容
    const formContent = document.querySelector('.form-preview-content');
    if (!formContent) {
      alert('无法找到表单内容，请重试');
      return;
    }

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    // 克隆表单内容
    const clonedContent = formContent.cloneNode(true) as HTMLElement;
    
    // 构建完整的HTML文档
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${template.name} - ${template.name_en}</title>
          <style>
            @page {
              size: letter portrait;
              margin: 0.5in;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            /* 确保颜色打印 */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* 重置transform */
            .form-preview-content {
              transform: none !important;
              width: 100% !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* 确保橙色背景显示 */
            [style*="background-color: rgb(249, 99, 2)"],
            [style*="background-color:#F96302"] {
              background-color: #F96302 !important;
            }
            
            /* 表格样式 */
            table {
              width: 100%;
              border-collapse: collapse;
            }
            
            /* 避免分页切断 */
            table, tr, td, th {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          ${clonedContent.outerHTML}
        </body>
      </html>
    `;
    
    // 写入内容
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // 等待内容加载完成后打印
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // 打印完成后关闭窗口
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };
  };

  // 🔥 下载PDF功能
  const handleDownload = () => {
    const confirmed = window.confirm(
      `📥 下载 "${template.name}" 为PDF\n\n` +
      '点击"确定"后将打开打印对话框。\n\n' +
      '请在打印对话框中：\n' +
      '1. 选择"保存为PDF"或"Microsoft Print to PDF"\n' +
      '2. 点击"保存"按钮\n' +
      '3. 输入文件名并选择保存位置\n\n' +
      `建议文件名: ${template.id}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    
    if (confirmed) {
      handlePrint();
    }
  };

  // 🔥 编辑功能
  const handleEdit = () => {
    if (onEdit) {
      onEdit(template);
      onClose(); // 关闭预览，打开编辑器
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* 工具栏 */}
        <div className="bg-gray-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg">{template.name}</h3>
            <span className="text-gray-400 text-sm">{template.name_en}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setZoom(Math.max(50, zoom - 10))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">{zoom}%</span>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={() => setZoom(Math.min(200, zoom + 10))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-600 mx-2" />
            
            {/* 🔥 编辑按钮 - 移到这里，打印/下载之前 */}
            {onEdit && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={handleEdit}
                  title="编辑表单"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  编辑
                </Button>
                
                <div className="w-px h-6 bg-gray-600 mx-2" />
              </>
            )}
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10" 
              onClick={handlePrint}
              title="打印表单 (Ctrl+P)"
            >
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10" 
              onClick={handleDownload}
              title="下载为PDF"
            >
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
            
            <div className="w-px h-6 bg-gray-600 mx-2" />
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/10"
              onClick={onClose}
              title="关闭预览 (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 表单预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-8">
          <div 
            className="mx-auto bg-white shadow-xl form-preview-content"
            style={{ 
              width: '8.5in',
              minHeight: '11in',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            <HomeDepotFormRenderer template={template} />
          </div>
        </div>

        {/* 页面导航 */}
        <div className="bg-gray-900 text-white px-6 py-3 rounded-b-lg flex items-center justify-center gap-4">
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">第 {currentPage} 页</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// 🏢 Home Depot 表单渲染器 - 100%还原真实文档样式
function HomeDepotFormRenderer({ template }: { template: FormTemplate }) {
  // Home Depot 橙色
  const hdOrange = '#F96302';
  const hdDarkGray = '#212121';
  
  return (
    <div className="p-12 font-sans" style={{ fontSize: '10pt', lineHeight: '1.5' }}>
      {/* 顶部橙色条纹 */}
      <div 
        className="h-3 mb-6"
        style={{ backgroundColor: hdOrange }}
      />

      {/* Header: Logo + 公司信息 + 文档标题 */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          {/* Logo 区域 */}
          <div className="w-48">
            <div 
              className="text-3xl font-black mb-2"
              style={{ color: hdOrange }}
            >
              THE COSUN BM
            </div>
            <div className="text-xs text-gray-600 leading-tight">
              {template.owner === 'cosun' ? (
                <>
                  <div className="font-semibold">Fujian Cosun Tuff Building Materials Co., Ltd.</div>
                  <div>123 Industrial Park Road</div>
                  <div>Fuzhou, Fujian 350000, China</div>
                  <div>Tel: +86-591-8888-8888</div>
                  <div>Email: info@cosun.com</div>
                </>
              ) : (
                <>
                  <div>2455 Paces Ferry Road SE</div>
                  <div>Atlanta, GA 30339</div>
                  <div>Tel: 1-800-HOME-DEPOT</div>
                </>
              )}
            </div>
          </div>

          {/* 文档标题区域 */}
          <div className="text-right">
            <h1 
              className="text-4xl font-black mb-2"
              style={{ color: hdDarkGray }}
            >
              {template.name_en.toUpperCase()}
            </h1>
            <div className="text-sm text-gray-600">
              {template.name}
            </div>
          </div>
        </div>

        {/* 橙色分隔线 */}
        <div 
          className="h-1 mb-6"
          style={{ backgroundColor: hdOrange }}
        />
      </div>

      {/* 表单内容区域 */}
      <div className="space-y-6">
        {template.sections.map((section, sectionIndex) => (
          <div key={section.id} className="mb-6">
            {/* Section 标题 */}
            {section.title && (
              <div 
                className="px-4 py-2 mb-3 font-bold text-white"
                style={{ backgroundColor: hdOrange }}
              >
                {section.title}
              </div>
            )}

            {/* Section 内容 */}
            <div 
              className="p-4"
              style={{ 
                backgroundColor: section.backgroundColor || 'transparent',
                border: section.border ? `2px solid ${hdOrange}` : 'none'
              }}
            >
              {section.fields[0]?.type === 'table' ? (
                // 表格样式
                <div className="overflow-hidden border-2" style={{ borderColor: hdOrange }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: hdOrange }}>
                        <th className="px-3 py-2 text-left text-white text-xs font-bold border-r border-white">NO.</th>
                        <th className="px-3 py-2 text-left text-white text-xs font-bold border-r border-white">DESCRIPTION</th>
                        <th className="px-3 py-2 text-left text-white text-xs font-bold border-r border-white">QTY</th>
                        <th className="px-3 py-2 text-left text-white text-xs font-bold border-r border-white">UNIT PRICE</th>
                        <th className="px-3 py-2 text-left text-white text-xs font-bold">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row} className="border-b" style={{ borderColor: hdOrange }}>
                          <td className="px-3 py-3 text-xs border-r" style={{ borderColor: '#E0E0E0' }}>{row}</td>
                          <td className="px-3 py-3 text-xs border-r" style={{ borderColor: '#E0E0E0' }}>
                            {row === 1 ? 'Sample Product Description' : ''}
                          </td>
                          <td className="px-3 py-3 text-xs border-r" style={{ borderColor: '#E0E0E0' }}>
                            {row === 1 ? '100' : ''}
                          </td>
                          <td className="px-3 py-3 text-xs text-right border-r" style={{ borderColor: '#E0E0E0' }}>
                            {row === 1 ? '$10.00' : ''}
                          </td>
                          <td className="px-3 py-3 text-xs text-right">
                            {row === 1 ? '$1,000.00' : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // 表单字段网格布局
                <div className={`grid gap-4 ${
                  section.layout === 'single' ? 'grid-cols-1' : 
                  section.layout === 'triple' ? 'grid-cols-3' : 
                  'grid-cols-2'
                }`}>
                  {section.fields.map((field) => (
                    <div key={field.id} style={{ width: field.width || '100%' }}>
                      <label className="block text-xs font-bold mb-1" style={{ color: hdDarkGray }}>
                        {field.label}
                        {field.required && <span style={{ color: hdOrange }}> *</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea 
                          className="w-full px-3 py-2 text-sm border-2 rounded focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: '#D0D0D0',
                            minHeight: '60px'
                          }}
                          placeholder={field.placeholder}
                          defaultValue={field.defaultValue}
                        />
                      ) : field.type === 'select' ? (
                        <select 
                          className="w-full px-3 py-2 text-sm border-2 rounded focus:outline-none"
                          style={{ borderColor: '#D0D0D0' }}
                        >
                          <option value="">Select...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input 
                          type="date"
                          className="w-full px-3 py-2 text-sm border-2 rounded focus:outline-none"
                          style={{ borderColor: '#D0D0D0' }}
                          defaultValue={field.defaultValue || new Date().toISOString().split('T')[0]}
                        />
                      ) : (
                        <input 
                          type={field.type === 'number' ? 'number' : 'text'}
                          className="w-full px-3 py-2 text-sm border-2 rounded focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: '#D0D0D0',
                            fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                            fontSize: field.fontSize ? `${field.fontSize}pt` : '10pt',
                            textAlign: field.alignment || 'left'
                          }}
                          placeholder={field.placeholder}
                          defaultValue={field.defaultValue}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: 签名区域 */}
      {template.footer.signatureLines?.enabled && (
        <div className="mt-12 pt-6 border-t-2" style={{ borderColor: hdOrange }}>
          <div className={`grid gap-8 ${
            template.footer.signatureLines.parties.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
          }`}>
            {template.footer.signatureLines.parties.map((party) => (
              <div key={party.label}>
                <div className="mb-8 border-b-2 border-gray-400" />
                <div className="text-xs font-bold" style={{ color: hdDarkGray }}>
                  {party.label}
                </div>
                <div className="text-xs text-gray-500 mt-1">Date: ______________</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部橙色条纹 */}
      <div 
        className="h-3 mt-8"
        style={{ backgroundColor: hdOrange }}
      />

      {/* 页脚信息 */}
      <div className="mt-4 text-xs text-center text-gray-500">
        <div>This document is for business purposes only. Confidential information.</div>
        <div className="font-bold mt-1" style={{ color: hdOrange }}>
          THE COSUN BM - Building Materials Division
        </div>
      </div>
    </div>
  );
}
