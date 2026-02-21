import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Printer, Download, Search } from 'lucide-react'; // 🔥 添加图标

interface PurchaseOrderDocumentProps {
  orderData?: any;
  onClose?: () => void;
}

export default function PurchaseOrderDocument({ orderData, onClose }: PurchaseOrderDocumentProps) {
  // 缩放比例状态
  const [scale, setScale] = useState(1.3); // 🔥 改为1.3 (130%)作为默认值

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 采购订单数据
  const poData = {
    poNumber: orderData?.id || 'PO-2025-001156',
    poDate: '2025-01-25',
    rfqNumber: 'RFQ-2025-001045',
    quotationNumber: 'COSUN-Q-202501000234',
    buyerCompany: 'COSUN采购部',
    buyerContact: '张经理',
    buyerPhone: '+86-591-8888-8888',
    buyerEmail: 'zhang@cosun.com',
    buyerAddress: '福州市仓山区金山工业区',
    supplierCompany: '福建高盛达富建材有限公司',
    supplierContact: '李经理',
    supplierPhone: '+86-591-xxxx-xxxx',
    supplierEmail: 'export@gaoshengdafu.com',
    supplierAddress: '福州市闽侯县工业园区',
    shippingAddress: '福州市仓山区金山工业区\nCOSUN仓库1号',
    deliveryDate: '2025-03-30',
    paymentTerms: '30%定金，70%尾款发货前付清',
    shippingTerms: 'EXW 工厂交货',
    currency: 'CNY',
  };

  // 产品清单
  const products = [
    {
      id: 1,
      itemNo: '1',
      productCode: 'GSD-FL-600',
      productName: '抛光砖',
      specs: '规格：600x600mm, 厚度10mm\n颜色：米黄色 | 表面：抛光面\n包装：4片/箱, 1.44平米/箱',
      quantity: 50000,
      unit: 'SQM',
      unitPrice: 28.50,
      amount: 1425000.00,
    },
    {
      id: 2,
      itemNo: '2',
      productCode: 'GSD-WL-300',
      productName: '釉面墙砖',
      specs: '规格：300x600mm, 厚度8mm\n颜色：白色 | 表面：光面\n包装：6片/箱, 1.08平米/箱',
      quantity: 30000,
      unit: 'SQM',
      unitPrice: 22.00,
      amount: 660000.00,
    },
  ];

  // 计算总计
  const subtotal = products.reduce((sum, p) => sum + p.amount, 0);
  const discount = subtotal * 0.02;
  const total = subtotal - discount;

  // 缩放控制
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setDragOffset({ x: 0, y: 0 });
  };

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC键关闭
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }
      
      // Ctrl+P 打印
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
        return;
      }
      
      // 缩放快捷键
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]); // 🔥 添加onClose依赖

  // 全局鼠标抬起事件
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // 格式化金额
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 🔥 打印功能
  const handlePrint = () => {
    // 获取文档内容区域
    const formContent = document.querySelector('.purchase-order-content');
    if (!formContent) {
      alert('无法找到文档内容，请重试');
      return;
    }

    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    // 克隆文档内容
    const clonedContent = formContent.cloneNode(true) as HTMLElement;
    
    // 构建完整的HTML文档
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>采购订单 - ${poData.poNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            
            /* 确保颜色打印 */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* 重置transform和缩放 */
            .purchase-order-content {
              transform: none !important;
              width: 210mm !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 20mm !important;
            }
            
            /* 确保橙色背景显示 */
            [style*="background-color: rgb(249, 99, 2)"],
            [style*="background-color:#F96302"],
            .bg-orange-600 {
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
            
            /* 保持边框 */
            .border { border-width: 1px; }
            .border-2 { border-width: 2px; }
            .border-t { border-top-width: 1px; }
            .border-b { border-bottom-width: 1px; }
            .border-l { border-left-width: 1px; }
            .border-r { border-right-width: 1px; }
            .border-gray-300 { border-color: #d1d5db; }
            .border-orange-600 { border-color: #F96302; }
            
            /* 颜色 */
            .text-orange-600 { color: #F96302; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-900 { color: #111827; }
            .text-white { color: white; }
            
            /* 背景色 */
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-orange-50 { background-color: #fff7ed; }
            
            /* 字体大小 */
            .text-xs { font-size: 0.75rem; }
            .text-sm { font-size: 0.875rem; }
            .text-base { font-size: 1rem; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-2xl { font-size: 1.5rem; }
            .text-3xl { font-size: 1.875rem; }
            
            /* 字体粗细 */
            .font-normal { font-weight: 400; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            
            /* 间距 */
            .p-2 { padding: 0.5rem; }
            .p-3 { padding: 0.75rem; }
            .p-4 { padding: 1rem; }
            .p-6 { padding: 1.5rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mt-4 { margin-top: 1rem; }
            .mt-6 { margin-top: 1.5rem; }
            
            /* 布局 */
            .flex { display: flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-between { justify-content: space-between; }
            .justify-center { justify-content: center; }
            .gap-2 { gap: 0.5rem; }
            .gap-4 { gap: 1rem; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .whitespace-pre-line { white-space: pre-line; }
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

  // 🔥 下载PDF功能 - 使用html2canvas和jsPDF
  const handleDownload = async () => {
    try {
      // 方法1: 使用打印功能（推荐，兼容性最好）
      const printAndSave = () => {
        // 提示用户在打印对话框中选择"保存为PDF"
        const confirmed = window.confirm(
          '点击"确定"后将打开打印对话框。\n\n' +
          '请在打印对话框中：\n' +
          '1. 选择"保存为PDF"或"Microsoft Print to PDF"\n' +
          '2. 点击"保存"按钮\n' +
          '3. 选择保存位置和文件名'
        );
        
        if (confirmed) {
          handlePrint();
        }
      };
      
      printAndSave();
    } catch (error) {
      console.error('下载失败:', error);
      alert('下载功能暂时不可用，请使用打印功能并选择"保存为PDF"');
    }
  };

  // 🔥 搜索功能（暂时显示提示）
  const handleSearch = () => {
    alert('搜索功能开发中...');
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col relative"> {/* 🔥 改为flex-col布局，深色背景 */}
      
      {/* 🔥 顶部固定工具栏 - Home Depot风格 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg print:hidden">
        <div className="flex items-center justify-between px-6 py-3">
          {/* 左侧：文档标题 */}
          <div>
            <h1 className="text-white font-semibold text-base flex items-center gap-2">
              Home Depot 采购订单
              <span className="text-sm font-normal text-gray-400">THE COSUN BM PURCHASE ORDER</span>
            </h1>
          </div>

          {/* 中间：缩放控制 */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleSearch}
              className="text-gray-400 hover:text-white transition-colors p-2"
              title="搜索 (Ctrl+F)"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 bg-gray-800 rounded px-3 py-1.5">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                title="缩小 (Ctrl+-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <span className="text-white font-semibold min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={scale >= 2}
                className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                title="放大 (Ctrl++)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSearch}
              className="text-gray-400 hover:text-white transition-colors p-2"
              title="搜索"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              title="打印 (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm">打印</span>
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              title="下载PDF"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">下载</span>
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition-colors"
                title="关闭 (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 - 添加顶部padding避免被工具栏遮挡 */}
      <div className="flex-1 flex justify-center relative" style={{ paddingTop: '70px', paddingBottom: '20px' }}>
        {/* 关闭按钮 - 移除，已整合到工具栏 */}
        
        {/* 极简缩放控制器 - 保留右侧悬浮控制 */}
        <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 print:hidden">
          <div className="flex flex-col items-center bg-white shadow-lg rounded-full p-2">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 2}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            <div className="relative flex items-center justify-center" style={{ height: '120px', width: '32px' }}>
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 transform -translate-x-1/2" />
              <input
                type="range"
                orient="vertical"
                min="50"
                max="200"
                step="5"
                value={scale * 100}
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                className="minimal-vertical-slider"
                style={{
                  width: '120px',
                  height: '32px',
                  margin: 0,
                  transform: 'rotate(-90deg)',
                  transformOrigin: 'center center',
                }}
              />
            </div>
            
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-black disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4纸张容器 - 台湾大厂紧凑风格 */}
        <div 
          className={`bg-white shadow-xl purchase-order-content ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            padding: '8mm 10mm',
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
            transformOrigin: 'top center',
            marginBottom: scale < 1 ? `${(1 - scale) * 297}mm` : '0',
            userSelect: isDragging ? 'none' : 'auto',
            transition: isDragging ? 'none' : 'transform 0.2s',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* 顶部标题栏 - 紧凑型 */}
          <div className="flex items-start justify-between mb-3 pb-2" style={{ borderBottom: '2px solid #999' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '2px', color: '#000' }}>
                📋 采购订单 PURCHASE ORDER
              </h1>
              <p style={{ fontSize: '10px', color: '#666' }}>正式采购确认单</p>
            </div>
            <div className="text-right">
              <div className="text-white px-3 py-1 inline-block" style={{ fontSize: '10px', lineHeight: '1.2', backgroundColor: '#999' }}>
                <div style={{ marginBottom: '1px' }}>订单编号 PO NO.</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>{poData.poNumber}</div>
              </div>
              <div style={{ fontSize: '10px', color: '#000', marginTop: '3px' }}>
                <div>订单日期：{poData.poDate}</div>
                <div>询价编号：{poData.rfqNumber}</div>
                <div>报价编号：{poData.quotationNumber}</div>
              </div>
            </div>
          </div>

          {/* 重要提示 - 紧凑 */}
          <div className="px-2 py-1.5 mb-3" style={{ borderLeft: '3px solid #999', backgroundColor: '#f5f5f5' }}>
            <p style={{ fontSize: '10px', color: '#000' }}>
              <strong>⚠ 重要提示：</strong>此为正式采购订单，请于2个工作日内确认接受。订单任何变更需双方书面同意。
            </p>
          </div>

          {/* 采购方与供应方 - 双栏紧凑布局 */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* 采购方 - 灰色边框 */}
            <div className="p-2" style={{ fontSize: '11px', border: '2px solid #999' }}>
              <div className="pb-1 mb-1.5" style={{ fontSize: '10px', fontWeight: 600, color: '#000', borderBottom: '1px solid #aaa' }}>
                采购方 BUYER
              </div>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#000' }}>{poData.buyerCompany}</div>
              <div className="grid grid-cols-2 gap-1 mb-1">
                <div>
                  <div style={{ fontSize: '9px', color: '#666' }}>联系人</div>
                  <div style={{ color: '#000' }}>{poData.buyerContact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#666' }}>电话</div>
                  <div style={{ fontSize: '10px', color: '#000' }}>{poData.buyerPhone}</div>
                </div>
              </div>
              <div className="mb-1">
                <div style={{ fontSize: '9px', color: '#666' }}>邮箱</div>
                <div style={{ fontSize: '10px', color: '#000' }}>{poData.buyerEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#666' }}>地址</div>
                <div style={{ color: '#000' }}>{poData.buyerAddress}</div>
              </div>
            </div>

            {/* 供应方 - 灰色边框 */}
            <div className="p-2" style={{ fontSize: '11px', backgroundColor: '#fafafa', border: '1px solid #bbb' }}>
              <div className="pb-1 mb-1.5" style={{ fontSize: '10px', fontWeight: 600, color: '#000', borderBottom: '1px solid #ccc' }}>
                供应方 SUPPLIER
              </div>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#000' }}>{poData.supplierCompany}</div>
              <div className="grid grid-cols-2 gap-1 mb-1">
                <div>
                  <div style={{ fontSize: '9px', color: '#666' }}>联系人</div>
                  <div style={{ color: '#000' }}>{poData.supplierContact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#666' }}>电话</div>
                  <div style={{ fontSize: '10px', color: '#000' }}>{poData.supplierPhone}</div>
                </div>
              </div>
              <div className="mb-1">
                <div style={{ fontSize: '9px', color: '#666' }}>邮箱</div>
                <div style={{ fontSize: '10px', color: '#000' }}>{poData.supplierEmail}</div>
              </div>
              <div>
                <div style={{ fontSize: '9px', color: '#666' }}>地址</div>
                <div style={{ color: '#000' }}>{poData.supplierAddress}</div>
              </div>
            </div>
          </div>

          {/* 交货与付款信息 - 浅灰背景条 */}
          <div className="mb-3">
            <div className="px-2 py-1" style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#e5e5e5', color: '#000' }}>
              交货与付款信息 DELIVERY & PAYMENT INFO
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div className="p-1.5" style={{ fontSize: '10px', border: '1px solid #ccc' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '3px' }}>交货地址</div>
                <div style={{ whiteSpace: 'pre-line', lineHeight: '1.4', color: '#000' }}>{poData.shippingAddress}</div>
              </div>
              <div className="p-1.5" style={{ fontSize: '10px', border: '1px solid #ccc' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '3px' }}>交货条款</div>
                <div style={{ color: '#000' }}>{poData.shippingTerms}</div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>要求交货日期：{poData.deliveryDate}</div>
              </div>
              <div className="p-1.5" style={{ fontSize: '10px', border: '1px solid #ccc' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '3px' }}>付款条款</div>
                <div style={{ lineHeight: '1.4', color: '#000' }}>{poData.paymentTerms}</div>
                <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>币种：{poData.currency}</div>
              </div>
            </div>
          </div>

          {/* 订单明细 */}
          <div className="mb-3">
            <div className="px-2 py-1 mb-2" style={{ borderLeft: '3px solid #999', fontSize: '11px', fontWeight: 600, backgroundColor: '#f5f5f5', color: '#000' }}>
              订单明细 ORDER DETAILS
            </div>
            
            <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ backgroundColor: '#e5e5e5', color: '#000' }}>
                  <th className="px-1 py-1" style={{ fontSize: '9px', fontWeight: 600, width: '25px', border: '1px solid #aaa' }}>项次</th>
                  <th className="px-1 py-1 text-left" style={{ fontSize: '9px', fontWeight: 600, width: '70px', border: '1px solid #aaa' }}>产品编码</th>
                  <th className="px-1 py-1 text-left" style={{ fontSize: '9px', fontWeight: 600, border: '1px solid #aaa' }}>产品名称及规格</th>
                  <th className="px-1 py-1" style={{ fontSize: '9px', fontWeight: 600, width: '60px', border: '1px solid #aaa' }}>订购数量</th>
                  <th className="px-1 py-1" style={{ fontSize: '9px', fontWeight: 600, width: '35px', border: '1px solid #aaa' }}>单位</th>
                  <th className="px-1 py-1 text-right" style={{ fontSize: '9px', fontWeight: 600, width: '60px', border: '1px solid #aaa' }}>单价<br/>(CNY)</th>
                  <th className="px-1 py-1 text-right" style={{ fontSize: '9px', fontWeight: 600, width: '75px', border: '1px solid #aaa' }}>金额<br/>(CNY)</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} style={{ backgroundColor: index % 2 === 1 ? '#fafafa' : 'white' }}>
                    <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd', color: '#000' }}>{product.itemNo}</td>
                    <td className="px-1 py-1" style={{ fontWeight: 600, border: '1px solid #ddd', color: '#000' }}>{product.productCode}</td>
                    <td className="px-1 py-1" style={{ border: '1px solid #ddd' }}>
                      <div style={{ fontWeight: 600, marginBottom: '2px', color: '#000' }}>{product.productName}</div>
                      <div style={{ fontSize: '9px', color: '#666', whiteSpace: 'pre-line', lineHeight: '1.3' }}>
                        {product.specs}
                      </div>
                    </td>
                    <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd', color: '#000' }}>{product.quantity.toLocaleString()}</td>
                    <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd', color: '#000' }}>{product.unit}</td>
                    <td className="px-1 py-1 text-right" style={{ border: '1px solid #ddd', color: '#000' }}>{formatCurrency(product.unitPrice)}</td>
                    <td className="px-1 py-1 text-right" style={{ fontWeight: 600, border: '1px solid #ddd', color: '#000' }}>{formatCurrency(product.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 金额汇总 - 右对齐紧凑 */}
          <div className="flex justify-end mb-3">
            <table style={{ borderCollapse: 'collapse', fontSize: '10px', width: '250px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <td className="px-2 py-1" style={{ border: '1px solid #ddd', color: '#000' }}>小计 Subtotal</td>
                  <td className="px-2 py-1 text-right" style={{ border: '1px solid #ddd', color: '#000' }}>{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td className="px-2 py-1" style={{ border: '1px solid #ddd', color: '#000' }}>折扣 Discount (2%)</td>
                  <td className="px-2 py-1 text-right" style={{ border: '1px solid #ddd', color: '#000' }}>-{formatCurrency(discount)}</td>
                </tr>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <td className="px-2 py-1" style={{ fontWeight: 600, fontSize: '11px', border: '2px solid #999', color: '#000' }}>订单总额 TOTAL</td>
                  <td className="px-2 py-1 text-right" style={{ fontWeight: 600, fontSize: '13px', color: '#000', border: '2px solid #999' }}>
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 条款与条件 - 紧凑双栏 */}
          <div className="mb-3">
            <div className="px-2 py-1 mb-2" style={{ fontSize: '11px', fontWeight: 600, backgroundColor: '#e5e5e5', color: '#000' }}>
              条款与条件 TERMS & CONDITIONS
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1.5" style={{ fontSize: '9px', border: '1px solid #ccc', color: '#000' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '3px' }}>质量标准：</div>
                <ul style={{ paddingLeft: '10px', lineHeight: '1.5' }}>
                  <li>• 产品符合国家GB标准</li>
                  <li>• 提供质检报告和合格证</li>
                  <li>• 允许采购方预检</li>
                  <li>• 破损率不超过3%</li>
                </ul>
              </div>
              <div className="p-1.5" style={{ fontSize: '9px', border: '1px solid #ccc', color: '#000' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '3px' }}>交货条款：</div>
                <ul style={{ paddingLeft: '10px', lineHeight: '1.5' }}>
                  <li>• 生产周期25-30天</li>
                  <li>• 发货前7天通知采购方</li>
                  <li>• 提供完整装箱单</li>
                  <li>• 逾期交货需赔偿</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 授权签署 - 紧凑双栏 */}
          <div className="mb-3">
            <div className="px-2 py-1 mb-2" style={{ borderLeft: '3px solid #999', fontSize: '11px', fontWeight: 600, backgroundColor: '#f5f5f5', color: '#000' }}>
              授权签署 AUTHORIZATION
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2" style={{ fontSize: '10px', backgroundColor: '#f5f5f5', border: '2px solid #999' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '4px' }}>采购方授权 BUYER AUTHORIZATION</div>
                <div className="mb-1.5" style={{ height: '30px', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', borderBottom: '1px solid #aaa' }}>
                  <span style={{ fontSize: '13px', fontFamily: 'cursive', color: '#000' }}>{poData.buyerContact}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div style={{ fontSize: '9px', color: '#666' }}>姓名：</div>
                    <div style={{ color: '#000' }}>{poData.buyerContact}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#666' }}>日期：</div>
                    <div style={{ color: '#000' }}>{poData.poDate}</div>
                  </div>
                </div>
              </div>
              <div className="p-2" style={{ fontSize: '10px', backgroundColor: '#fafafa', border: '1px solid #bbb' }}>
                <div style={{ color: '#000', fontSize: '9px', fontWeight: 600, marginBottom: '4px' }}>供应方确认 SUPPLIER ACCEPTANCE</div>
                <div className="mb-1.5" style={{ height: '30px', borderBottom: '1px solid #aaa' }}></div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div style={{ fontSize: '9px', color: '#666' }}>姓名：</div>
                    <div style={{ color: '#000' }}>_______________</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', color: '#666' }}>日期：</div>
                    <div style={{ color: '#000' }}>_______________</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 重要声明 */}
          <div className="p-2 mb-2" style={{ border: '2px solid #999', backgroundColor: '#f5f5f5' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, marginBottom: '3px', color: '#000' }}>📋 重要声明：</div>
            <ul style={{ fontSize: '9px', paddingLeft: '10px', lineHeight: '1.5', color: '#000' }}>
              <li>1. 本采购订单为法律有效文件，双方具有约束力。</li>
              <li>2. 供应方须在2个工作日内确认接受本订单。</li>
              <li>3. 任何规格偏差必须立即告知采购方。</li>
              <li>4. 逾期交货可能导致订单取消或罚款。</li>
            </ul>
          </div>

          {/* 页脚 */}
          <div className="border-t border-gray-300 pt-1.5 text-center">
            <p style={{ fontSize: '9px', color: '#666' }}>本采购订单由系统自动生成，电子传输有效。</p>
            <p style={{ fontSize: '9px', color: '#000', marginTop: '2px' }}>
              <strong>{poData.buyerCompany}</strong> | {poData.buyerAddress} | Tel: {poData.buyerPhone} | Email: {poData.buyerEmail}
            </p>
            <p style={{ fontSize: '8px', color: '#999', marginTop: '2px' }}>
              订单生成时间：{poData.poDate} | 文档编号：{poData.poNumber} | 第 1 页 共 1 页
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}