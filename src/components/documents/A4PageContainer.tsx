import React, { ReactNode } from 'react';

/**
 * 🔥 A4分页文档容器
 * 
 * 特性：
 * - 屏幕预览：灰色背景 + 白色A4纸张效果 + 自动分页显示
 * - 打印输出：自动分页，标准A4尺寸
 */

interface A4DocumentContainerProps {
  children: ReactNode;
  enablePagination?: boolean; // 是否启用分页显示
  pageWidth?: string;
  pageMinHeight?: string;
}

export const A4DocumentContainer = React.forwardRef<HTMLDivElement, A4DocumentContainerProps>(
  (
    {
      children,
      enablePagination = false,
      pageWidth = '210mm',
      pageMinHeight = '297mm'
    },
    ref
  ) => {
    if (!enablePagination) {
      // 原有的单页模式（向后兼容）
      return (
        <div 
          ref={ref}
          className="a4-document-preview"
          style={{
            // 屏幕显示样式
            background: '#f5f5f5',
            padding: '20px',
            fontFamily: 'Arial, "Helvetica Neue", sans-serif'
          }}
        >
          <div 
            className="a4-page-content"
            style={{
              // A4纸张样式
              width: pageWidth,
              minHeight: pageMinHeight,
              background: 'white',
              margin: '0 auto',
              padding: '15mm',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              boxSizing: 'border-box',
              fontSize: '9pt',
              lineHeight: '1.4'
            }}
          >
            {children}
          </div>
        </div>
      );
    }

    // 🔥 新增：分页模式
    return (
      <div 
        ref={ref}
        className="a4-document-preview-paginated"
        style={{
          background: '#525659',
          padding: '40px 20px',
          fontFamily: 'Arial, "Helvetica Neue", sans-serif',
          minHeight: '100vh'
        }}
      >
        {/* 单页容器 - A4标准尺寸 */}
        <div 
          className="a4-page"
          style={{
            width: pageWidth,
            minHeight: pageMinHeight,
            background: 'white',
            margin: '0 auto 20px auto',
            padding: '15mm',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            boxSizing: 'border-box',
            fontSize: '9pt',
            lineHeight: '1.4',
            position: 'relative'
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

A4DocumentContainer.displayName = 'A4DocumentContainer';

// 🔥 向后兼容：提供旧的导出名
export const A4PageContainer = A4DocumentContainer;

/**
 * 🔥 打印专用CSS样式
 */
export function A4PrintStyles() {
  return (
    <style>{`
      /* ===== 打印专用样式 ===== */
      @media print {
        /* A4页面设置 - 明确设置边距 */
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        
        /* 重置body和html */
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          width: 100% !important;
          height: auto !important;
        }
        
        /* 移除预览容器的背景和padding */
        .a4-document-preview, .a4-document-preview-paginated {
          background: white !important;
          padding: 0 !important;
          margin: 0 !important;
          height: auto !important;
          min-height: auto !important;
        }
        
        /* 页面内容区域 */
        .a4-page-content, .a4-page {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          background: white !important;
        }
        
        /* 文档内容区域 - 允许自动分页 */
        .sales-contract-content {
          width: 100% !important;
          height: auto !important;
        }
        
        /* 确保所有颜色打印 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* 移除所有阴影效果 */
        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
        
        /* 🔥 表格打印优化 - 允许跨页分页 */
        table {
          page-break-inside: auto !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        
        /* 表格行避免被切断 */
        tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
        
        /* 表头在每页重复 */
        thead {
          display: table-header-group !important;
        }
        
        /* 表尾在每页重复 */
        tfoot {
          display: table-footer-group !important;
        }
        
        /* 🔥 避免标题在分页时被切断 */
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid !important;
          break-after: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* 避免重要section被切断 */
        .avoid-break, .contract-section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* 签名区域避免被切断 */
        .signature-section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        /* 🔥 Document Footer - 固定在每页底部 */
        .document-footer-container {
          position: running(footer);
          display: block;
          width: 100%;
          text-align: center;
          font-size: 8pt;
          color: #666;
        }
        
        /* 产品表格特殊处理 */
        .product-table {
          page-break-inside: auto !important;
        }
        
        .product-table tbody {
          page-break-inside: auto !important;
        }
        
        .product-table tbody tr {
          page-break-inside: avoid !important;
          page-break-after: auto !important;
        }
      }
      
      /* ===== 屏幕预览样式 ===== */
      @media screen {
        /* 在屏幕上添加分页效果提示 */
        .page-break-hint {
          display: block;
          height: 1px;
          background: #e0e0e0;
          margin: 20mm 0;
          position: relative;
        }
        
        .page-break-hint::after {
          content: '--- Page Break ---';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          background: #f5f5f5;
          padding: 4px 12px;
          font-size: 10px;
          color: #999;
          white-space: nowrap;
        }
      }
    `}</style>
  );
}
