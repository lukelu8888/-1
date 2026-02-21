import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface DeliveryNoteDocumentProps {
  noteData?: any;
  onClose?: () => void;
}

export default function DeliveryNoteDocument({ noteData, onClose }: DeliveryNoteDocumentProps) {
  // 缩放比例状态
  const [scale, setScale] = useState(1);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 送货单数据
  const dnData = {
    dnNumber: noteData?.id || 'DN-2025-001234',
    dnDate: noteData?.deliveryDate || '2025-01-28',
    poNumber: noteData?.poNumber || 'PO-2025-001156',
    poDate: noteData?.poDate || '2025-01-25',
    
    // 供应商信息
    supplierCompany: '福建高盛达富建材有限公司',
    supplierContact: '李经理',
    supplierPhone: '+86-591-xxxx-xxxx',
    supplierEmail: 'export@gaoshengdafu.com',
    supplierAddress: '福州市闽侯县工业园区',
    
    // 客户信息
    customerCompany: noteData?.customer || 'COSUN采购部',
    customerContact: '张经理',
    customerPhone: '+86-591-8888-8888',
    customerEmail: 'zhang@cosun.com',
    customerAddress: '福州市仓山区金山工业区',
    
    // 送货地址
    deliveryAddress: '福州市仓山区金山工业区\nCOSUN仓库1号',
    
    // 物流信息
    driver: noteData?.driver || '王师傅',
    driverPhone: noteData?.driverPhone || '13800138000',
    vehicleNo: noteData?.vehicleNo || '闽A-12345',
    
    // 收货信息
    receivedBy: noteData?.receivedBy || '',
    receivedDate: noteData?.receivedDate || '',
    status: noteData?.status || 'pending',
  };

  // 产品清单
  const products = noteData?.products || [
    {
      id: 1,
      itemNo: '1',
      productCode: 'GSD-FL-600',
      productName: '抛光砖',
      specs: '规格：600x600mm, 厚度10mm\n颜色：米黄色 | 表面：抛光面\n包装：4片/箱, 1.44平米/箱',
      orderedQty: 50000,
      deliveredQty: 48500,
      unit: 'SQM',
      unitPrice: 28.50,
      amount: 1382250.00,
    },
    {
      id: 2,
      itemNo: '2',
      productCode: 'GSD-WL-300',
      productName: '釉面墙砖',
      specs: '规格：300x600mm, 厚度8mm\n颜色：白色 | 表面：光面\n包装：6片/箱, 1.08平米/箱',
      orderedQty: 30000,
      deliveredQty: 30000,
      unit: 'SQM',
      unitPrice: 22.00,
      amount: 660000.00,
    },
  ];

  // 计算总计
  const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);
  const totalBoxes = 3458; // 示例箱数

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
  }, []);

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

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center relative" style={{ padding: '20px 0' }}>
      {/* 关闭按钮 */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      )}

      {/* 极简缩放控制器 */}
      <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-50">
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
        className={`bg-white shadow-xl ${scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
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
            <h1 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px', color: '#333' }}>
              🚚 送货单 DELIVERY NOTE
            </h1>
            <p style={{ fontSize: '8px', color: '#666' }}>Shipping Document</p>
          </div>
          <div className="text-right">
            <div className="text-white px-3 py-1 inline-block" style={{ fontSize: '8px', lineHeight: '1.2', backgroundColor: '#999' }}>
              <div style={{ marginBottom: '1px' }}>送货单号 DN NO.</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{dnData.dnNumber}</div>
            </div>
            <div style={{ fontSize: '8px', color: '#666', marginTop: '3px' }}>
              <div>送货日期：{dnData.dnDate}</div>
              <div>采购订单：{dnData.poNumber}</div>
              <div>订单日期：{dnData.poDate}</div>
            </div>
          </div>
        </div>

        {/* 重要提示 - 紧凑 */}
        <div className="px-2 py-1.5 mb-3" style={{ borderLeft: '3px solid #999', backgroundColor: '#f5f5f5' }}>
          <p style={{ fontSize: '8px', color: '#333' }}>
            <strong>📋 送货须知：</strong>请核对产品规格、数量、包装。收货时如发现异常请立即联系。送货单需签字确认并留存。
          </p>
        </div>

        {/* 供应商与客户 - 双栏紧凑布局 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* 供应商 - 灰色边框 */}
          <div className="p-2" style={{ fontSize: '9px', border: '2px solid #999' }}>
            <div className="pb-1 mb-1.5" style={{ fontSize: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #aaa' }}>
              供应商 SUPPLIER
            </div>
            <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '4px' }}>{dnData.supplierCompany}</div>
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <div style={{ fontSize: '7px', color: '#666' }}>联系人</div>
                <div>{dnData.supplierContact}</div>
              </div>
              <div>
                <div style={{ fontSize: '7px', color: '#666' }}>电话</div>
                <div style={{ fontSize: '8px' }}>{dnData.supplierPhone}</div>
              </div>
            </div>
            <div className="mb-1">
              <div style={{ fontSize: '7px', color: '#666' }}>邮箱</div>
              <div style={{ fontSize: '8px' }}>{dnData.supplierEmail}</div>
            </div>
            <div>
              <div style={{ fontSize: '7px', color: '#666' }}>地址</div>
              <div>{dnData.supplierAddress}</div>
            </div>
          </div>

          {/* 客户 - 灰色边框 */}
          <div className="p-2" style={{ fontSize: '9px', backgroundColor: '#fafafa', border: '1px solid #bbb' }}>
            <div className="pb-1 mb-1.5" style={{ fontSize: '8px', fontWeight: 600, color: '#333', borderBottom: '1px solid #ccc' }}>
              客户 CUSTOMER
            </div>
            <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '4px' }}>{dnData.customerCompany}</div>
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <div style={{ fontSize: '7px', color: '#666' }}>联系人</div>
                <div>{dnData.customerContact}</div>
              </div>
              <div>
                <div style={{ fontSize: '7px', color: '#666' }}>电话</div>
                <div style={{ fontSize: '8px' }}>{dnData.customerPhone}</div>
              </div>
            </div>
            <div className="mb-1">
              <div style={{ fontSize: '7px', color: '#666' }}>邮箱</div>
              <div style={{ fontSize: '8px' }}>{dnData.customerEmail}</div>
            </div>
            <div>
              <div style={{ fontSize: '7px', color: '#666' }}>送货地址</div>
              <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3' }}>{dnData.deliveryAddress}</div>
            </div>
          </div>
        </div>

        {/* 物流信息 - 浅灰背景条 */}
        <div className="mb-3">
          <div className="px-2 py-1" style={{ fontSize: '9px', fontWeight: 600, backgroundColor: '#e5e5e5', color: '#333' }}>
            物流信息 LOGISTICS INFO
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="p-1.5" style={{ fontSize: '8px', border: '1px solid #ccc' }}>
              <div style={{ color: '#333', fontSize: '7px', fontWeight: 600, marginBottom: '3px' }}>车牌号</div>
              <div style={{ fontSize: '11px', fontWeight: 600 }}>{dnData.vehicleNo}</div>
            </div>
            <div className="p-1.5" style={{ fontSize: '8px', border: '1px solid #ccc' }}>
              <div style={{ color: '#333', fontSize: '7px', fontWeight: 600, marginBottom: '3px' }}>司机姓名</div>
              <div>{dnData.driver}</div>
            </div>
            <div className="p-1.5" style={{ fontSize: '8px', border: '1px solid #ccc' }}>
              <div style={{ color: '#333', fontSize: '7px', fontWeight: 600, marginBottom: '3px' }}>司机电话</div>
              <div>{dnData.driverPhone}</div>
            </div>
          </div>
        </div>

        {/* 送货明细 */}
        <div className="mb-3">
          <div className="px-2 py-1 mb-2" style={{ borderLeft: '3px solid #999', fontSize: '9px', fontWeight: 600, backgroundColor: '#f5f5f5' }}>
            送货明细 DELIVERY DETAILS
          </div>
          
          <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '8px' }}>
            <thead>
              <tr style={{ backgroundColor: '#e5e5e5', color: '#333' }}>
                <th className="px-1 py-1" style={{ fontSize: '7px', width: '25px', border: '1px solid #aaa' }}>项次</th>
                <th className="px-1 py-1 text-left" style={{ fontSize: '7px', width: '70px', border: '1px solid #aaa' }}>产品编码</th>
                <th className="px-1 py-1 text-left" style={{ fontSize: '7px', border: '1px solid #aaa' }}>产品名称及规格</th>
                <th className="px-1 py-1" style={{ fontSize: '7px', width: '60px', border: '1px solid #aaa' }}>订单数量</th>
                <th className="px-1 py-1" style={{ fontSize: '7px', width: '60px', border: '1px solid #aaa' }}>本次送货</th>
                <th className="px-1 py-1" style={{ fontSize: '7px', width: '35px', border: '1px solid #aaa' }}>单位</th>
                <th className="px-1 py-1 text-right" style={{ fontSize: '7px', width: '60px', border: '1px solid #aaa' }}>单价<br/>(CNY)</th>
                <th className="px-1 py-1 text-right" style={{ fontSize: '7px', width: '75px', border: '1px solid #aaa' }}>金额<br/>(CNY)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={product.id} style={{ backgroundColor: index % 2 === 1 ? '#fafafa' : 'white' }}>
                  <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd' }}>{product.itemNo}</td>
                  <td className="px-1 py-1" style={{ fontWeight: 600, border: '1px solid #ddd' }}>{product.productCode}</td>
                  <td className="px-1 py-1" style={{ border: '1px solid #ddd' }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{product.productName}</div>
                    <div style={{ fontSize: '7px', color: '#666', whiteSpace: 'pre-line', lineHeight: '1.3' }}>
                      {product.specs}
                    </div>
                  </td>
                  <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd', color: '#666' }}>{product.orderedQty.toLocaleString()}</td>
                  <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd', fontWeight: 600 }}>
                    {product.deliveredQty.toLocaleString()}
                    {product.deliveredQty !== product.orderedQty && (
                      <div style={{ fontSize: '7px', color: '#ff6600', marginTop: '1px' }}>
                        差异 {(product.deliveredQty - product.orderedQty).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-1 py-1 text-center" style={{ border: '1px solid #ddd' }}>{product.unit}</td>
                  <td className="px-1 py-1 text-right" style={{ border: '1px solid #ddd' }}>{formatCurrency(product.unitPrice)}</td>
                  <td className="px-1 py-1 text-right" style={{ fontWeight: 600, border: '1px solid #ddd' }}>{formatCurrency(product.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 汇总信息 */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* 包装信息 */}
          <div className="p-2" style={{ fontSize: '8px', backgroundColor: '#f5f5f5', border: '1px solid #ccc' }}>
            <div style={{ fontSize: '8px', fontWeight: 600, color: '#333', marginBottom: '3px' }}>包装信息 PACKAGING</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">总箱数：</span>
                <span className="font-semibold">{totalBoxes.toLocaleString()} 箱</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">包装方式：</span>
                <span>木托盘+缠绕膜</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">托盘数：</span>
                <span>24 托</span>
              </div>
            </div>
          </div>

          {/* 金额汇总 */}
          <div>
            <table style={{ borderCollapse: 'collapse', fontSize: '8px', width: '100%' }}>
              <tbody>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <td className="px-2 py-1" style={{ border: '1px solid #ddd' }}>送货总额 TOTAL</td>
                  <td className="px-2 py-1 text-right" style={{ fontWeight: 600, fontSize: '11px', color: '#333', border: '2px solid #999' }}>
                    ¥ {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 p-1.5" style={{ fontSize: '7px', backgroundColor: '#fffbeb', border: '1px solid #fcd34d' }}>
              <div className="text-gray-700">
                <strong>备注：</strong>金额仅供参考，最终以采购订单为准。
              </div>
            </div>
          </div>
        </div>

        {/* 签收确认 - 紧凑双栏 */}
        <div className="mb-3">
          <div className="px-2 py-1 mb-2" style={{ borderLeft: '3px solid #999', fontSize: '9px', fontWeight: 600, backgroundColor: '#f5f5f5' }}>
            签收确认 RECEIPT CONFIRMATION
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* 供应商 */}
            <div className="p-2" style={{ fontSize: '8px', backgroundColor: '#f5f5f5', border: '2px solid #999' }}>
              <div style={{ color: '#333', fontSize: '7px', fontWeight: 600, marginBottom: '4px' }}>供应商发货确认 SUPPLIER</div>
              <div className="mb-1.5" style={{ height: '30px', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', borderBottom: '1px solid #aaa' }}>
                <span style={{ fontSize: '11px', fontFamily: 'cursive' }}>{dnData.supplierContact}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <div style={{ fontSize: '7px', color: '#666' }}>发货人：</div>
                  <div>{dnData.supplierContact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '7px', color: '#666' }}>日期：</div>
                  <div>{dnData.dnDate}</div>
                </div>
              </div>
            </div>

            {/* 客户 */}
            <div className="p-2" style={{ fontSize: '8px', backgroundColor: '#fafafa', border: '1px solid #bbb' }}>
              <div style={{ color: '#333', fontSize: '7px', fontWeight: 600, marginBottom: '4px' }}>客户签收确认 CUSTOMER</div>
              <div className="mb-1.5" style={{ height: '30px', borderBottom: '1px solid #aaa', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                {dnData.receivedBy && (
                  <span style={{ fontSize: '11px', fontFamily: 'cursive' }}>{dnData.receivedBy}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <div style={{ fontSize: '7px', color: '#666' }}>收货人：</div>
                  <div>{dnData.receivedBy || '_______________'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '7px', color: '#666' }}>日期：</div>
                  <div>{dnData.receivedDate || '_______________'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 重要声明 */}
        <div className="p-2 mb-2" style={{ border: '2px solid #999', backgroundColor: '#f5f5f5' }}>
          <div style={{ fontSize: '8px', fontWeight: 600, marginBottom: '3px' }}>📋 重要声明：</div>
          <ul style={{ fontSize: '7px', paddingLeft: '10px', lineHeight: '1.5' }}>
            <li>1. 本送货单为正式送货凭证，请妥善保管。</li>
            <li>2. 收货时请当场核对产品规格、数量、包装是否完好。</li>
            <li>3. 如发现数量短缺、产品破损、规格不符，请立即在送货单上注明并联系供应商。</li>
            <li>4. 签收后视为确认收货，后续异议需提供照片等证明材料。</li>
          </ul>
        </div>

        {/* 页脚 */}
        <div className="border-t border-gray-300 pt-1.5 text-center">
          <p style={{ fontSize: '7px', color: '#666' }}>本送货单由供应商系统自动生成，电子传输有效。</p>
          <p style={{ fontSize: '7px', color: '#666', marginTop: '2px' }}>
            <strong>{dnData.supplierCompany}</strong> | {dnData.supplierAddress} | Tel: {dnData.supplierPhone} | Email: {dnData.supplierEmail}
          </p>
          <p style={{ fontSize: '6px', color: '#999', marginTop: '2px' }}>
            送货单生成时间：{dnData.dnDate} | 文档编号：{dnData.dnNumber} | 第 1 页 共 1 页
          </p>
        </div>
      </div>
    </div>
  );
}
