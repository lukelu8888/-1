import React, { useState } from 'react';
import { FileText, Plus, Eye, Truck, CheckCircle, Clock, Search, Filter, Download, Upload, Image as ImageIcon } from 'lucide-react';
import DeliveryNoteDocument from './DeliveryNoteDocument';

export default function DeliveryNotes() {
  const [showDocument, setShowDocument] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [shippingMode, setShippingMode] = useState<'lcl' | 'fcl'>('lcl');

  // 送货单数据
  const deliveryNotes = [
    {
      id: 'DN-2025-001234',
      poNumber: 'PO-2025-001156',
      poDate: '2025-01-25',
      deliveryDate: '2025-01-28',
      customer: 'COSUN采购部',
      products: [
        { code: 'GSD-FL-600', name: '抛光砖', spec: '600x600mm', ordered: 50000, delivered: 48500, unit: 'SQM' },
        { code: 'GSD-WL-300', name: '釉面墙砖', spec: '300x600mm', ordered: 30000, delivered: 30000, unit: 'SQM' },
      ],
      totalAmount: 2042750,
      // 整柜运输
      shippingMode: 'fcl',
      containerType: '40HQ',
      containerNo: 'MSCU1234567',
      shippingLine: 'COSCO',
      sealNo: 'SL987654',
      status: 'received',
      receivedDate: '2025-01-28',
      receivedBy: '张经理',
      hasPhoto: true,
    },
    {
      id: 'DN-2025-001233',
      poNumber: 'PO-2025-001145',
      poDate: '2025-01-20',
      deliveryDate: '2025-01-25',
      customer: 'COSUN采购部',
      products: [
        { code: 'GSD-FL-800', name: '大理石瓷砖', spec: '800x800mm', ordered: 20000, delivered: 20000, unit: 'SQM' },
      ],
      totalAmount: 850000,
      // 散货运输
      shippingMode: 'lcl',
      freightCompany: '顺丰物流',
      freightContact: '李师傅',
      freightPhone: '13900139000',
      vehicleNo: '闽A-67890',
      status: 'pending',
      hasPhoto: true,
    },
    {
      id: 'DN-2025-001232',
      poNumber: 'PO-2025-001138',
      poDate: '2025-01-18',
      deliveryDate: '2025-01-22',
      customer: 'COSUN采购部',
      products: [
        { code: 'GSD-WL-200', name: '木纹砖', spec: '200x1000mm', ordered: 15000, delivered: 14800, unit: 'SQM' },
      ],
      totalAmount: 592000,
      // 整柜运输
      shippingMode: 'fcl',
      containerType: '20GP',
      containerNo: 'TEMU9876543',
      shippingLine: 'MSC',
      sealNo: 'SL123456',
      status: 'reconciled',
      receivedDate: '2025-01-22',
      receivedBy: '刘经理',
      reconciledDate: '2025-01-31',
      hasPhoto: true,
    },
  ];

  // 状态统计
  const stats = {
    total: deliveryNotes.length,
    pending: deliveryNotes.filter(n => n.status === 'pending').length,
    received: deliveryNotes.filter(n => n.status === 'received').length,
    reconciled: deliveryNotes.filter(n => n.status === 'reconciled').length,
  };

  // 状态显示
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: '待收货', color: 'bg-orange-100 text-orange-700', icon: Clock },
      received: { text: '已收货', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
      reconciled: { text: '已对账', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  // 筛选数据
  const filteredNotes = deliveryNotes.filter(note => {
    const matchSearch = note.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       note.poNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || note.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 查看详情
  const handleViewDocument = (note: any) => {
    setSelectedNote(note);
    setShowDocument(true);
  };

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">送货单总数</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">待收货</div>
          <div className="text-2xl font-semibold text-orange-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">已收货</div>
          <div className="text-2xl font-semibold text-blue-600">{stats.received}</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">已对账</div>
          <div className="text-2xl font-semibold text-green-600">{stats.reconciled}</div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建送货单
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待收货</option>
            <option value="received">已收货</option>
            <option value="reconciled">已对账</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索送货单号/订单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              style={{ width: '280px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="bg-white rounded border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>送货单号</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>采购订单</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>客户</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>送货日期</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>产品信息</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>送货数量</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>运输方式</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>状态</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((note, index) => (
              <tr key={note.id} className={`border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="font-medium" style={{ fontSize: '13px' }}>{note.id}</span>
                  </div>
                  {note.hasPhoto && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <ImageIcon className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600">已上传</span>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div style={{ fontSize: '13px' }}>{note.poNumber}</div>
                  <div className="text-xs text-gray-500">{note.poDate}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div style={{ fontSize: '13px' }}>{note.customer}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div style={{ fontSize: '13px' }}>{note.deliveryDate}</div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="space-y-0.5">
                    {note.products.slice(0, 2).map((p, i) => (
                      <div key={i} style={{ fontSize: '12px' }}>
                        <span className="font-medium">{p.code}</span>
                        <span className="text-gray-500 ml-1">{p.name}</span>
                      </div>
                    ))}
                    {note.products.length > 2 && (
                      <div className="text-xs text-gray-400">+{note.products.length - 2} 更多...</div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <div className="space-y-0.5">
                    {note.products.map((p, i) => (
                      <div key={i} style={{ fontSize: '12px' }}>
                        <span className="font-medium">{p.delivered.toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">{p.unit}</span>
                        {p.delivered !== p.ordered && (
                          <span className="text-xs text-orange-600 ml-1">
                            (订{p.ordered.toLocaleString()})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  {note.shippingMode === 'fcl' ? (
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">整柜FCL</span>
                      </div>
                      <div style={{ fontSize: '12px' }} className="font-medium">{note.containerType}</div>
                      <div className="text-xs text-gray-500">{note.containerNo}</div>
                      <div className="text-xs text-gray-500">{note.shippingLine}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">散货LCL</span>
                      </div>
                      <div style={{ fontSize: '12px' }}>{note.freightCompany}</div>
                      <div className="text-xs text-gray-500">{note.vehicleNo}</div>
                      <div className="text-xs text-gray-500">{note.freightContact}</div>
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5 text-center">
                  {getStatusBadge(note.status)}
                  {note.status === 'received' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {note.receivedDate} {note.receivedBy}
                    </div>
                  )}
                  {note.status === 'reconciled' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {note.reconciledDate}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleViewDocument(note)}
                      className="p-1.5 hover:bg-blue-50 rounded transition-colors group"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-green-50 rounded transition-colors group"
                      title="下载PDF"
                    >
                      <Download className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p style={{ fontSize: '13px' }}>暂无送货单记录</p>
          </div>
        )}
      </div>

      {/* A4送货单全屏展示 */}
      {showDocument && (
        <div className="fixed inset-0 z-50">
          <DeliveryNoteDocument
            noteData={selectedNote}
            onClose={() => setShowDocument(false)}
          />
        </div>
      )}

      {/* 创建送货单弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold" style={{ fontSize: '15px' }}>创建送货单</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="text-xl">×</span>
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* 基本信息 */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">选择采购订单 *</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500">
                    <option>PO-2025-001156 - COSUN采购部 - ¥2,042,750</option>
                    <option>PO-2025-001145 - COSUN采购部 - ¥850,000</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">送货日期 *</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" />
                </div>

                {/* 运输方式选择 */}
                <div>
                  <label className="block text-sm text-gray-700 mb-2">运输方式 *</label>
                  <div className="flex gap-3">
                    <label className="flex-1 cursor-pointer">
                      <div className={`p-4 border-2 rounded-lg transition-colors ${shippingMode === 'lcl' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input
                          type="radio"
                          name="shippingMode"
                          value="lcl"
                          checked={shippingMode === 'lcl'}
                          onChange={() => setShippingMode('lcl')}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">散货 LCL</span>
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">陆运</span>
                        </div>
                        <p className="text-xs text-gray-600">Less than Container Load</p>
                        <p className="text-xs text-gray-500 mt-1">委托货运公司运输</p>
                      </div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <div className={`p-4 border-2 rounded-lg transition-colors ${shippingMode === 'fcl' ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}`}>
                        <input
                          type="radio"
                          name="shippingMode"
                          value="fcl"
                          checked={shippingMode === 'fcl'}
                          onChange={() => setShippingMode('fcl')}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">整柜 FCL</span>
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">海运</span>
                        </div>
                        <p className="text-xs text-gray-600">Full Container Load</p>
                        <p className="text-xs text-gray-500 mt-1">整柜运输，需填写柜型柜号</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 散货LCL表单 */}
                {shippingMode === 'lcl' && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
                    <div className="text-sm font-semibold text-blue-900 mb-2">散货运输信息</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">货运公司 *</label>
                        <input 
                          type="text" 
                          placeholder="顺丰物流" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">车牌号 *</label>
                        <input 
                          type="text" 
                          placeholder="闽A-12345" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">司机姓名 *</label>
                        <input 
                          type="text" 
                          placeholder="王师傅" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">司机电话 *</label>
                        <input 
                          type="text" 
                          placeholder="13800138000" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 整柜FCL表单 */}
                {shippingMode === 'fcl' && (
                  <div className="bg-purple-50 rounded-lg p-4 space-y-3 border border-purple-200">
                    <div className="text-sm font-semibold text-purple-900 mb-2">整柜运输信息</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">柜型 Container Type *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500">
                          <option value="">请选择柜型</option>
                          <option value="20GP">20GP (20英尺普柜)</option>
                          <option value="40GP">40GP (40英尺普柜)</option>
                          <option value="40HQ">40HQ (40英尺高柜)</option>
                          <option value="45HQ">45HQ (45英尺高柜)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">船公司 Shipping Line *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500">
                          <option value="">请选择船公司</option>
                          <option value="COSCO">COSCO 中远海运</option>
                          <option value="MSC">MSC 地中海航运</option>
                          <option value="MAERSK">MAERSK 马士基</option>
                          <option value="CMA">CMA CGM 达飞</option>
                          <option value="EVERGREEN">EVERGREEN 长荣</option>
                          <option value="OOCL">OOCL 东方海外</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">柜号 Container No. *</label>
                        <input 
                          type="text" 
                          placeholder="MSCU1234567" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500 font-mono"
                          maxLength={11}
                        />
                        <p className="text-xs text-gray-500 mt-1">11位字符，如：MSCU1234567</p>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">封条号 Seal No. *</label>
                        <input 
                          type="text" 
                          placeholder="SL987654" 
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-purple-500 font-mono" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 照片上传 */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">上传送货单照片（可选）</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">点击或拖拽上传照片</p>
                    <p className="text-xs text-gray-400 mt-1">支持 JPG、PNG 格式，最大 5MB</p>
                  </div>
                </div>

                {/* 备注 */}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">备注</label>
                  <textarea 
                    rows={3}
                    placeholder="其他需要说明的信息..."
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                取消
              </button>
              <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                创建送货单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}