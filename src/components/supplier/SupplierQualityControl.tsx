import React, { useState } from 'react';
import { Shield, Truck, FileText, Eye } from 'lucide-react';
import DeliveryNotes from './DeliveryNotes';
import DeliveryNoteDocument from './DeliveryNoteDocument';

export default function SupplierQualityControl() {
  const [activeTab, setActiveTab] = useState('quality');
  const [showDocument, setShowDocument] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);

  // Tab配置
  const tabs = [
    { id: 'quality', label: '品质管理', enLabel: 'Quality Control', icon: Shield },
    { id: 'delivery', label: '交期追踪', enLabel: 'Delivery Schedule', icon: Truck },
    { id: 'delivery-notes', label: '送货单', enLabel: 'Delivery Notes', icon: FileText },
  ];

  // 品质数据
  const qualityData = [
    {
      id: 'PO-2025-001156',
      product: '抛光砖 600x600mm',
      quantity: 50000,
      qcStatus: 'passed',
      qcDate: '2025-01-26',
      passRate: 99.5,
      inspector: '李工',
      reportUploaded: true,
    },
    {
      id: 'PO-2025-001145',
      product: '大理石瓷砖 800x800mm',
      quantity: 20000,
      qcStatus: 'in_progress',
      qcDate: '2025-01-27',
      passRate: 98.8,
      inspector: '王工',
      reportUploaded: false,
    },
    {
      id: 'PO-2025-001138',
      product: '木纹砖 200x1000mm',
      quantity: 15000,
      qcStatus: 'passed',
      qcDate: '2025-01-20',
      passRate: 99.8,
      inspector: '张工',
      reportUploaded: true,
    },
  ];

  // 交期数据
  const deliveryData = [
    {
      id: 'PO-2025-001156',
      product: '抛光砖 600x600mm',
      quantity: 50000,
      orderDate: '2025-01-25',
      requiredDate: '2025-02-10',
      estimatedDate: '2025-02-08',
      status: 'on_track',
      progress: 85,
    },
    {
      id: 'PO-2025-001145',
      product: '大理石瓷砖 800x800mm',
      quantity: 20000,
      orderDate: '2025-01-20',
      requiredDate: '2025-02-05',
      estimatedDate: '2025-02-05',
      status: 'on_track',
      progress: 95,
    },
    {
      id: 'PO-2025-001138',
      product: '木纹砖 200x1000mm',
      quantity: 15000,
      orderDate: '2025-01-18',
      requiredDate: '2025-01-30',
      estimatedDate: '2025-01-28',
      status: 'completed',
      progress: 100,
    },
  ];

  // 品质状态
  const getQCStatusBadge = (status: string) => {
    const config = {
      passed: { text: '合格', color: 'bg-green-100 text-green-700' },
      in_progress: { text: '检验中', color: 'bg-blue-100 text-blue-700' },
      failed: { text: '不合格', color: 'bg-red-100 text-red-700' },
    };
    const { text, color } = config[status as keyof typeof config];
    return <span className={`inline-block px-2 py-0.5 rounded text-xs ${color}`}>{text}</span>;
  };

  // 交期状态
  const getDeliveryStatusBadge = (status: string) => {
    const config = {
      on_track: { text: '按时', color: 'bg-green-100 text-green-700' },
      at_risk: { text: '风险', color: 'bg-orange-100 text-orange-700' },
      delayed: { text: '延期', color: 'bg-red-100 text-red-700' },
      completed: { text: '已完成', color: 'bg-blue-100 text-blue-700' },
    };
    const { text, color } = config[status as keyof typeof config];
    return <span className={`inline-block px-2 py-0.5 rounded text-xs ${color}`}>{text}</span>;
  };

  // 渲染品质管理Tab
  const renderQualityTab = () => (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">总检验批次</div>
          <div className="text-2xl font-semibold">{qualityData.length}</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">合格批次</div>
          <div className="text-2xl font-semibold text-green-600">
            {qualityData.filter(d => d.qcStatus === 'passed').length}
          </div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">平均合格率</div>
          <div className="text-2xl font-semibold text-blue-600">99.4%</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">检验中</div>
          <div className="text-2xl font-semibold text-orange-600">
            {qualityData.filter(d => d.qcStatus === 'in_progress').length}
          </div>
        </div>
      </div>

      {/* 品质列表 */}
      <div className="bg-white rounded border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>订单号</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>产品</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>数量</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>检验日期</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>合格率</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>检验员</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>状态</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>报告</th>
            </tr>
          </thead>
          <tbody>
            {qualityData.map((item, index) => (
              <tr key={item.id} className={`border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className="px-3 py-2.5" style={{ fontSize: '13px', fontWeight: 500 }}>{item.id}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.product}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.quantity.toLocaleString()} ㎡</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.qcDate}</td>
                <td className="px-3 py-2.5">
                  <span className={`font-semibold ${item.passRate >= 99 ? 'text-green-600' : 'text-orange-600'}`}>
                    {item.passRate}%
                  </span>
                </td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.inspector}</td>
                <td className="px-3 py-2.5 text-center">{getQCStatusBadge(item.qcStatus)}</td>
                <td className="px-3 py-2.5 text-center">
                  {item.reportUploaded ? (
                    <span className="text-xs text-green-600">✓ 已上传</span>
                  ) : (
                    <span className="text-xs text-gray-400">未上传</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染交期追踪Tab
  const renderDeliveryTab = () => (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">总订单数</div>
          <div className="text-2xl font-semibold">{deliveryData.length}</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">按时交付</div>
          <div className="text-2xl font-semibold text-green-600">
            {deliveryData.filter(d => d.status === 'on_track' || d.status === 'completed').length}
          </div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">准时率</div>
          <div className="text-2xl font-semibold text-blue-600">100%</div>
        </div>
        <div className="bg-white rounded border p-3">
          <div className="text-xs text-gray-500 mb-1">已完成</div>
          <div className="text-2xl font-semibold text-purple-600">
            {deliveryData.filter(d => d.status === 'completed').length}
          </div>
        </div>
      </div>

      {/* 交期列表 */}
      <div className="bg-white rounded border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>订单号</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>产品</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>数量</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>下单日期</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>要求交期</th>
              <th className="text-left px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>预计交期</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>进度</th>
              <th className="text-center px-3 py-2 text-gray-600" style={{ fontSize: '12px', fontWeight: 600 }}>状态</th>
            </tr>
          </thead>
          <tbody>
            {deliveryData.map((item, index) => (
              <tr key={item.id} className={`border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <td className="px-3 py-2.5" style={{ fontSize: '13px', fontWeight: 500 }}>{item.id}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.product}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.quantity.toLocaleString()} ㎡</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.orderDate}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>{item.requiredDate}</td>
                <td className="px-3 py-2.5" style={{ fontSize: '13px' }}>
                  <span className={item.estimatedDate <= item.requiredDate ? 'text-green-600' : 'text-red-600'}>
                    {item.estimatedDate}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-10">{item.progress}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">{getDeliveryStatusBadge(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab导航 - 台湾大厂风格 */}
      <div className="bg-white rounded-lg border">
        <div className="flex border-b">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{tab.label}</div>
                  <div style={{ fontSize: '11px', opacity: 0.75 }}>{tab.enLabel}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab内容区 */}
        <div className="p-4">
          {activeTab === 'quality' && renderQualityTab()}
          {activeTab === 'delivery' && renderDeliveryTab()}
          {activeTab === 'delivery-notes' && <DeliveryNotes />}
        </div>
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
    </div>
  );
}
