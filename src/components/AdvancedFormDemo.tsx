// 🔥 高级表单布局系统演示
// Advanced Form Layout System Demo

import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { X, Grid3x3, Maximize2, Code, Eye, Download, Settings, Copy, Check, Loader2, FileText } from 'lucide-react';
import advancedFormTemplates from '../config/formTemplatesAdvanced';
import { AdvancedFormRenderer } from './forms/AdvancedFormRenderer';
import { AdvancedFormTemplate } from '../config/formLayoutSystem';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';

export default function AdvancedFormDemo({ onClose }: { onClose?: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState<AdvancedFormTemplate | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showPageBreaks, setShowPageBreaks] = useState(false);
  const [formData, setFormData] = useState({});
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editMode, setEditMode] = useState(false); // 🎯 编辑模式
  const formRef = useRef<HTMLDivElement>(null);

  // 导出PDF功能
  const handleExportPDF = async () => {
    if (!formRef.current || !selectedTemplate) return;

    setIsExporting(true);
    toast.loading('正在生成PDF...', { id: 'pdf-export' });
    
    try {
      // 动态导入html2canvas和jspdf
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // 暂时隐藏网格（如果正在显示）
      const wasShowingGrid = showGrid;
      if (wasShowingGrid) {
        setShowGrid(false);
        // 等待DOM更新
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // 获取实际的表单内容区域（白色背景的A4页面，不包含灰色外层）
      const formContentElement = document.getElementById('form-content-for-export');
      if (!formContentElement) {
        throw new Error('找不到表单内容区域');
      }
      
      // 临时添加样式来覆盖oklch颜色（html2canvas不支持oklch）
      const tempStyle = document.createElement('style');
      tempStyle.id = 'pdf-export-fix';
      tempStyle.innerHTML = `
        * {
          color: inherit !important;
          background-color: inherit !important;
          border-color: inherit !important;
        }
      `;
      document.head.appendChild(tempStyle);

      // 等待样式应用
      await new Promise(resolve => setTimeout(resolve, 50));

      // 捕获表单内容（只捕获白色的A4页面区域）
      // A4尺寸：210mm × 297mm
      // 使用2倍缩放获得高质量输出，同时保持合理的文件大小
      const canvas = await html2canvas(formContentElement, {
        scale: 2,
        useCORS: true,
        logging: false, // 关闭日志
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        allowTaint: true,
        onclone: (clonedDoc) => {
          // 在克隆的文档中移除所有可能导致问题的样式
          const clonedElement = clonedDoc.getElementById('pdf-export-fix');
          if (clonedElement) {
            clonedElement.remove();
          }
          
          // 移除阴影并转换oklch颜色
          const formContent = clonedDoc.getElementById('form-content-for-export');
          if (formContent) {
            formContent.style.boxShadow = 'none'; // PDF中不需要阴影
          }
          
          // 将所有oklch颜色转换为hex
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            const styles = window.getComputedStyle(el);
            
            // 转换背景色
            if (styles.backgroundColor && styles.backgroundColor.includes('oklch')) {
              el.style.backgroundColor = 'transparent';
            }
            
            // 转换文字颜色
            if (styles.color && styles.color.includes('oklch')) {
              el.style.color = '#000000';
            }
            
            // 转换边框颜色
            if (styles.borderColor && styles.borderColor.includes('oklch')) {
              el.style.borderColor = '#cccccc';
            }
          });
        }
      });

      // 移除临时样式
      const tempStyleEl = document.getElementById('pdf-export-fix');
      if (tempStyleEl) {
        tempStyleEl.remove();
      }

      // 恢复网格显示
      if (wasShowingGrid) {
        setShowGrid(true);
      }

      // 调试：记录捕获的canvas尺寸
      console.log('📸 Canvas捕获尺寸:', {
        width: canvas.width + 'px',
        height: canvas.height + 'px',
        elementWidth: formContentElement.offsetWidth + 'px',
        elementHeight: formContentElement.offsetHeight + 'px',
      });

      // 创建PDF - A4标准尺寸
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4', // 标准A4：210mm × 297mm
        compress: true,
      });

      // A4尺寸（HTML表单已经包含了页边距padding，所以PDF直接全页显示）
      const pdfWidth = 210; // A4宽度（mm）
      const pdfHeight = 297; // A4高度（mm）
      
      // 计算图片在PDF中的尺寸，保持宽高比，填满整个A4宽度
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // 生成PDF图像数据
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // 计算需要的页数（按A4整页高度分页）
      const totalPages = Math.ceil(imgHeight / pdfHeight);
      
      // ⚠️ 关键修复：在PDF每页添加页边距遮罩
      // HTML第1页有顶部padding，最后1页有底部padding
      // 但中间跨页的内容没有页边距，所以需要用白色遮罩强制添加
      const marginTop = 15;    // 顶部页边距 (mm)
      const marginBottom = 15; // 底部页边距 (mm)
      
      // 添加所有页面
      for (let page = 0; page < totalPages; page++) {
        // 如果不是第一页，添加新页
        if (page > 0) {
          pdf.addPage('a4', 'portrait');
        }
        
        // 计算当前页应该显示的图片部分
        // yOffset是负值，表示图片向上偏移多少，从而显示后面的内容
        const yOffset = -(page * pdfHeight);
        
        // 将图片放置在页面上（从(0,0)开始，全页显示）
        pdf.addImage(
          imgData,
          'PNG',
          0,          // x坐标（从左边缘开始）
          yOffset,    // y坐标（负值表示向上偏移）
          imgWidth,   // 图片宽度（填满A4宽度）
          imgHeight   // 图片总高度
        );
        
        // 🎨 在每页的顶部和底部添加白色遮罩，强制预留页边距
        pdf.setFillColor(255, 255, 255); // 白色
        
        // 顶部遮罩（第2页及以后需要，第1页HTML已有padding）
        if (page > 0) {
          pdf.rect(0, 0, pdfWidth, marginTop, 'F');
        }
        
        // 底部遮罩（最后1页之前的所有页面需要，最后1页HTML已有padding）
        if (page < totalPages - 1) {
          pdf.rect(0, pdfHeight - marginBottom, pdfWidth, marginBottom, 'F');
        }
      }

      // 保存PDF
      const fileName = `${selectedTemplate.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      // 记录导出信息到控制台
      console.log('📄 PDF导出详情:', {
        format: 'A4 (210mm × 297mm)',
        pdfDimensions: { width: pdfWidth + 'mm', height: pdfHeight + 'mm' },
        margins: { top: marginTop + 'mm', bottom: marginBottom + 'mm', note: '通过白色遮罩强制实现' },
        contentArea: { 
          perPage: (pdfHeight - marginTop - marginBottom) + 'mm',
          note: '每页可用内容高度 = 267mm' 
        },
        pageMargins: {
          page1: 'HTML顶部padding + 遮罩底部',
          middlePages: '遮罩顶部 + 遮罩底部',
          lastPage: '遮罩顶部 + HTML底部padding'
        },
        canvasDimensions: { width: canvas.width + 'px', height: canvas.height + 'px' },
        imageDimensions: { width: imgWidth + 'mm', height: imgHeight.toFixed(2) + 'mm' },
        pagesPerHeight: (imgHeight / pdfHeight).toFixed(2) + ' pages',
        totalPages: totalPages,
        fileName: fileName,
      });

      toast.success(`✅ PDF导出成功！${totalPages > 1 ? `（共${totalPages}页）` : ''}`, {
        id: 'pdf-export',
        duration: 4000,
        description: `📄 A4标准尺寸 (210×297mm) | 页边距: 上15mm + 下15mm | 文件：${fileName}`,
      });
    } catch (error) {
      console.error('导出PDF失败:', error);
      toast.error('PDF导出失败', {
        id: 'pdf-export',
        duration: 4000,
        description: error instanceof Error ? error.message : '请检查浏览器权限或稍后重试',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 复制代码功能
  const handleCopyCode = () => {
    if (!selectedTemplate) return;
    
    const code = JSON.stringify(selectedTemplate, null, 2);
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast.success('代码已复制到剪贴板！', {
        description: '您可以粘贴到代码编辑器中使用',
      });
    }).catch((error) => {
      console.error('复制失败:', error);
      toast.error('复制失败', {
        description: '请手动复制代码',
      });
    });
  };

  if (selectedTemplate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-8">
        {/* 工具栏 */}
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => setSelectedTemplate(null)} variant="outline" size="sm">
              ← 返回列表
            </Button>
            <div>
              <h2 className="font-bold text-lg">{selectedTemplate.name}</h2>
              <div className="flex items-center gap-3">
                <p className="text-xs text-gray-500">{selectedTemplate.name_en}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                  📄 A4 (210×297mm)
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 显示网格按钮 */}
            <Button
              onClick={() => {
                const newShowGrid = !showGrid;
                setShowGrid(newShowGrid);
                if (newShowGrid) {
                  toast.success('网格调试模式已启用', {
                    description: '橙色虚线边框显示每个表单区域的网格结构',
                    duration: 2000,
                  });
                } else {
                  toast.info('网格调试模式已关闭', {
                    duration: 2000,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-xs font-medium hover:bg-orange-50 hover:border-orange-500 transition-all"
              style={{
                backgroundColor: showGrid ? '#FFF5F0' : undefined,
                borderColor: showGrid ? '#F96302' : undefined,
                color: showGrid ? '#F96302' : undefined,
              }}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              显示网格
            </Button>
            
            {/* 分页预览按钮 */}
            <Button
              onClick={() => {
                const newShowPageBreaks = !showPageBreaks;
                setShowPageBreaks(newShowPageBreaks);
                if (newShowPageBreaks) {
                  toast.success('PDF分页预览已启用', {
                    description: '红色/橙色虚线显示PDF导出时的实际分页位置（含页边距）',
                    duration: 3000,
                  });
                } else {
                  toast.info('PDF分页预览已关闭', {
                    duration: 2000,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-xs font-medium hover:bg-red-50 hover:border-red-500 transition-all"
              style={{
                backgroundColor: showPageBreaks ? '#FEF2F2' : undefined,
                borderColor: showPageBreaks ? '#EF4444' : undefined,
                color: showPageBreaks ? '#EF4444' : undefined,
              }}
            >
              <FileText className="w-3.5 h-3.5" />
              分页预览
            </Button>
            
            {/* 🎯 编辑布局按钮 */}
            <Button
              onClick={() => {
                const newEditMode = !editMode;
                setEditMode(newEditMode);
                if (newEditMode) {
                  toast.success('✏️ 编辑模式已启用', {
                    description: '鼠标悬停在区块上查看网格信息，点击可调整列宽',
                    duration: 3000,
                  });
                } else {
                  toast.info('编辑模式已关闭', {
                    duration: 2000,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-xs font-medium hover:bg-purple-50 hover:border-purple-500 transition-all"
              style={{
                backgroundColor: editMode ? '#FAF5FF' : undefined,
                borderColor: editMode ? '#9333EA' : undefined,
                color: editMode ? '#9333EA' : undefined,
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              编辑布局
            </Button>
            
            {/* 查看代码按钮 */}
            <Button 
              onClick={() => setShowCodeDialog(true)}
              variant="outline" 
              size="sm" 
              className="gap-2 h-8 text-xs font-medium hover:bg-blue-50 hover:border-blue-500 transition-all"
            >
              <Code className="w-3.5 h-3.5" />
              查看代码
            </Button>
            
            {/* 导出PDF按钮 */}
            <Button 
              onClick={handleExportPDF}
              variant="outline" 
              size="sm" 
              className="gap-2 h-8 text-xs font-medium hover:bg-green-50 hover:border-green-500 transition-all"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  正在导出...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  导出A4 PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 表单渲染 */}
        <div ref={formRef}>
          <AdvancedFormRenderer
            template={selectedTemplate}
            data={formData}
            onChange={setFormData}
            showGrid={showGrid}
            showPageBreaks={showPageBreaks}
            editMode={editMode}
          />
        </div>

        {/* 代码查看对话框 */}
        <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Code className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-lg">表单配置代码</div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">
                      {selectedTemplate.name} - {selectedTemplate.name_en}
                    </div>
                  </div>
                </DialogTitle>
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  className="gap-2"
                  style={{
                    backgroundColor: copied ? '#10B981' : '#F96302',
                    color: 'white',
                  }}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      复制代码
                    </>
                  )}
                </Button>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4 border-2 border-gray-200 rounded-lg">
              <pre className="bg-gray-900 text-gray-100 p-6 text-xs font-mono leading-relaxed">
                <code className="language-json">{JSON.stringify(selectedTemplate, null, 2)}</code>
              </pre>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 mt-0.5">💡</div>
                <div className="text-xs text-blue-800">
                  <strong>提示：</strong> 此代码包含完整的表单配置，包括布局、字段、样式等所有信息。
                  您可以复制此配置并在代码中使用，或导入到表单设计器中进行编辑。
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white py-12 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
                <Grid3x3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
                  COSUN BM 高级表单布局系统
                  <Badge className="bg-yellow-400 text-orange-900 text-xs">Pro</Badge>
                </h1>
                <p className="text-orange-100 text-sm">
                  COSUN Building Materials | 支持无限网格、灵活定位、精确控制的表单设计系统
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                关闭
              </Button>
            )}
          </div>

          {/* 功能特性 */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            <Card className="bg-white/10 backdrop-blur border-0 p-3 text-white">
              <div className="text-xl font-bold mb-0.5">A4</div>
              <div className="text-orange-100 text-xs">标准尺寸 210×297mm</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-0 p-3 text-white">
              <div className="text-xl font-bold mb-0.5">24列</div>
              <div className="text-orange-100 text-xs">精细网格系统</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-0 p-3 text-white">
              <div className="text-xl font-bold mb-0.5">无限</div>
              <div className="text-orange-100 text-xs">行列数量</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-0 p-3 text-white">
              <div className="text-xl font-bold mb-0.5">Grid</div>
              <div className="text-orange-100 text-xs">CSS Grid 布局</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-0 p-3 text-white">
              <div className="text-xl font-bold mb-0.5">PDF</div>
              <div className="text-orange-100 text-xs">一键导出</div>
            </Card>
          </div>
        </div>
      </div>

      {/* 核心优势 */}
      <div className="max-w-7xl mx-auto p-6">
        {/* A4标准化提示 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-5 mb-5 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black mb-1">✅ 所有表单已标准化为 A4 尺寸</h3>
              <p className="text-green-50 text-sm">
                📐 页面尺寸：210mm × 297mm（国际标准A4）| 📏 页边距：15mm（上下左右）| 📄 PDF导出完美支持A4打印
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 mb-5">
          <h2 className="text-lg font-black text-gray-900 mb-4">🚀 核心优势</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="border-l-4 border-orange-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-orange-600">1. 精确网格定位</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                每个字段可以指定 <code className="bg-gray-100 px-1 rounded text-xs">grid: &#123; row, col, rowSpan, colSpan &#125;</code>，
                实现像素级精确控制。支持字段跨越多行多列。
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-blue-600">2. 灵活列数系统</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                支持 1列、2列、3列、12列、24列或任意列数。可以使用 <code className="bg-gray-100 px-1 rounded text-xs">'30% 70%'</code> 
                等自定义列宽。
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-green-600">3. 多种布局模式</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                支持 Grid、Flex、Absolute、Custom 四种布局模式。
                每个区块可以独立设置布局，支持嵌套。
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-purple-600">4. 响应式设计</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                基于 CSS Grid 的现代布局引擎，自动响应不同屏幕尺寸。
                支持 <code className="bg-gray-100 px-1 rounded text-xs">autoRows</code> 和 <code className="bg-gray-100 px-1 rounded text-xs">autoColumns</code>。
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-red-600">5. 丰富的字段类型</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                支持 text、number、date、select、table、html、signature、qrcode、barcode 
                等 15+ 种字段类型。
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-3">
              <h3 className="font-bold text-sm mb-1.5 text-yellow-600">6. 可视化调试</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                内置网格线显示功能，点击"显示网格"按钮即可看到每个区块的网格结构，
                方便调试和优化布局。
              </p>
            </div>
          </div>
        </div>

        {/* 表单模板列表 */}
        <h2 className="text-xl font-black text-gray-900 mb-4">📋 高级表单模板</h2>
        
        <div className="grid grid-cols-1 gap-3">
          {advancedFormTemplates.map((template, index) => (
            <Card
              key={template.id}
              className="overflow-hidden border-l-4 hover:shadow-lg transition-all duration-300 cursor-pointer"
              style={{ borderLeftColor: '#F96302' }}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* 序号 */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #F96302 0%, #FFA500 100%)',
                      }}
                    >
                      <span className="text-xl font-black">{index + 1}</span>
                    </div>
                  </div>

                  {/* 内容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">
                          {template.name}
                        </h3>
                        <p className="text-sm font-bold text-orange-600 mb-1">
                          {template.name_en}
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                        v{template.version}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                    {/* 技术特性 */}
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      <div className="bg-green-50 rounded p-2 border border-green-200">
                        <div className="text-xs font-semibold text-green-600 mb-0.5">
                          📄 页面尺寸
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          A4 标准
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded p-2">
                        <div className="text-xs font-semibold text-orange-600 mb-0.5">
                          布局类型
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {template.sections[0]?.layout.type === 'grid' ? 'Grid 网格' : 'Flex 弹性'}
                        </div>
                      </div>
                      <div className="bg-orange-50 rounded p-2">
                        <div className="text-xs font-semibold text-orange-600 mb-0.5">
                          网格列数
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {template.sections[0]?.layout.grid?.columns} 列
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded p-2">
                        <div className="text-xs font-semibold text-amber-600 mb-0.5">
                          区块数量
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {template.sections.length} 个
                        </div>
                      </div>
                      <div className="bg-amber-50 rounded p-2">
                        <div className="text-xs font-semibold text-amber-600 mb-0.5">
                          字段总数
                        </div>
                        <div className="text-xs font-bold text-gray-900">
                          {template.sections.reduce((sum, s) => sum + s.fields.length, 0)} 个
                        </div>
                      </div>
                    </div>

                    {/* 布局信息 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {template.sections.slice(0, 3).map((section) => (
                        <Badge key={section.id} variant="outline" className="text-xs py-0">
                          {section.name}: {section.layout.type === 'grid' ? 
                            `${section.layout.grid?.columns}列网格` : 
                            `Flex ${section.layout.flex?.direction}`
                          }
                        </Badge>
                      ))}
                      {template.sections.length > 3 && (
                        <Badge variant="outline" className="text-xs py-0">
                          +{template.sections.length - 3} 更多区块
                        </Badge>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTemplate(template);
                        }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        预览表单
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-orange-500 text-orange-600 font-bold hover:bg-orange-50"
                      >
                        <Settings className="w-4 h-4 mr-1.5" />
                        编辑布局
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部装饰 */}
              <div
                className="h-1"
                style={{
                  background: 'linear-gradient(90deg, #F96302 0%, #FFA500 50%, #FF8C42 100%)',
                }}
              />
            </Card>
          ))}
        </div>

        {/* 技术说明 */}
        <div className="mt-12 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-8 border-2 border-orange-200">
          <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
            <Code className="w-6 h-6 text-orange-600" />
            技术实现
          </h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-bold text-orange-600 mb-2">布局引擎</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• CSS Grid Layout - 现代化网格系统</li>
                <li>• Flexbox - 灵活的弹性布局</li>
                <li>• Absolute Positioning - 绝对定位</li>
                <li>• Custom CSS - 自定义样式</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-orange-600 mb-2">核心特性</h4>
              <ul className="space-y-1 text-gray-700">
                <li>• gridRow / gridColumn 精确定位</li>
                <li>• rowSpan / colSpan 合并单元格</li>
                <li>• 动态表格组件（可增删行）</li>
                <li>• 计算字段自动更新</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
