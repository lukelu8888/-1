// 📊 订单单证矩阵视图（简化版 - 仅显示矩阵表格）
// Order Documentation Matrix View - Matrix Table Only

import React, { useState } from 'react';
import { 
  ArrowLeft, Package, DollarSign, Ship, Calendar, TrendingUp,
  FileText, Upload, Download, Eye, Trash2, CheckCircle2, Clock,
  AlertTriangle, XCircle, Printer, RefreshCw, Save, Send,
  FileSignature, Truck, Plane, FileCheck, BarChart3
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface OrderDocumentMatrixSimpleProps {
  orderId: string;
  onBack: () => void;
}

// 单证状态类型
type DocStatus = 'pending' | 'auto_generated' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 'na' | 'overdue';

// 单证定义
const DOCUMENT_CHECKLIST = [
  { id: 'D01', name: '出口退税申报表', icon: FileText },
  { id: 'D02', name: '购销合同/发票/付款凭证', icon: FileSignature },
  { id: 'D03', name: '国内运输单据及运费凭证', icon: Truck },
  { id: 'D04', name: '国内运费免责声明', icon: XCircle },
  { id: 'D05', name: '报关单/装箱单/提运单', icon: FileCheck },
  { id: 'D06', name: '委托报关合同及费用凭证', icon: FileSignature },
  { id: 'D07', name: '采购发票及付款凭证', icon: FileText },
  { id: 'D08', name: '报关费用免责声明', icon: XCircle },
  { id: 'D09', name: '国际运费发票及付款凭证', icon: Plane },
  { id: 'D10', name: '国际运费免责声明', icon: XCircle },
  { id: 'D11', name: '收汇水单', icon: DollarSign },
  { id: 'D12', name: '结汇水单', icon: DollarSign },
  { id: 'D13', name: '出口退税收汇凭证表', icon: FileCheck },
];

// 业务阶段定义
const BUSINESS_MILESTONES = [
  { id: 'contract', name: '合同签订', date: '12/01', status: 'completed', icon: FileSignature },
  { id: 'procurement', name: '采购完成', date: '12/05', status: 'completed', icon: Package },
  { id: 'shipment', name: '出货', date: '12/15', status: 'completed', icon: Truck },
  { id: 'customs', name: '报关', date: '12/14', status: 'warning', icon: FileCheck },
  { id: 'collection', name: '收汇', date: '待确认', status: 'pending', icon: DollarSign },
  { id: 'tax_refund', name: '退税', date: '', status: 'blocked', icon: TrendingUp },
];

// 模拟订单数据
const mockOrderDetail = {
  orderId: 'SO-NA-20251210-001',
  contractNo: 'SC-NA-20251201-001',
  customer: {
    name: 'Home Depot Inc.',
    country: 'USA',
    region: 'North America',
  },
  salesRep: '张伟',
  incoterm: 'FOB',
  currency: 'USD',
  totalValue: 125000,
  collectionProgress: 60,
  contractDate: '2025-12-01',
  shipmentDate: '2025-12-15',
  destPort: 'Los Angeles',
  container: '40HQ x 2',
  completionRate: 54,
  requiredDocs: 11,
  completedDocs: 6,
  missingDocs: 5,
  overdueItems: 2,
  
  documents: {
    D01: { docId: 'D01', status: 'pending' as DocStatus, files: [], deadline: '2026-01-14', daysRemaining: 33 },
    D02: { 
      docId: 'D02', 
      status: 'approved' as DocStatus, 
      files: [{ fileId: 'F001', fileName: 'SC-NA-20251201-001.pdf', fileSize: '1.8MB' }],
      uploadDate: '2025-12-01',
      deadline: '2025-12-01'
    },
    D03: {
      docId: 'D03',
      status: 'uploaded' as DocStatus,
      files: [{ fileId: 'F003', fileName: '国内运输单据.pdf', fileSize: '850KB' }],
      uploadDate: '2025-12-16',
      deadline: '2025-12-22'
    },
    D04: {
      docId: 'D04',
      status: 'auto_generated' as DocStatus,
      files: [{ fileId: 'F004', fileName: '国内运费免责声明.pdf', fileSize: '120KB' }],
      deadline: '2025-12-01'
    },
    D05: { 
      docId: 'D05',
      status: 'overdue' as DocStatus, 
      files: [],
      deadline: '2025-12-17',
      daysRemaining: -2
    },
    D06: {
      docId: 'D06',
      status: 'uploaded' as DocStatus,
      files: [{ fileId: 'F006', fileName: '报关委托合同.pdf', fileSize: '650KB' }],
      uploadDate: '2025-12-15',
      deadline: '2025-12-21'
    },
    D07: {
      docId: 'D07',
      status: 'approved' as DocStatus,
      files: [{ fileId: 'F007', fileName: '采购发票.pdf', fileSize: '1.2MB' }],
      uploadDate: '2025-12-05',
      deadline: '2025-12-20'
    },
    D08: {
      docId: 'D08',
      status: 'na' as DocStatus,
      files: [],
      note: '根据合同条款，报关费用由买方承担，无需此文档'
    },
    D09: {
      docId: 'D09',
      status: 'reviewing' as DocStatus,
      files: [{ fileId: 'F009', fileName: '国际运费发票.pdf', fileSize: '920KB' }],
      uploadDate: '2025-12-17',
      deadline: '2025-12-31'
    },
    D10: {
      docId: 'D10',
      status: 'auto_generated' as DocStatus,
      files: [{ fileId: 'F010', fileName: '国际运费免责声明.pdf', fileSize: '115KB' }],
      deadline: '2025-12-01'
    },
    D11: { 
      docId: 'D11',
      status: 'pending' as DocStatus, 
      files: [],
      deadline: '2026-03-15',
      daysRemaining: 93,
      note: '等待客户付款，已发催款邮件'
    },
    D12: {
      docId: 'D12',
      status: 'pending' as DocStatus,
      files: [],
      deadline: '2026-03-20',
      daysRemaining: 98
    },
    D13: {
      docId: 'D13',
      status: 'pending' as DocStatus,
      files: [],
      deadline: '2026-03-25',
      daysRemaining: 103
    },
  }
};

export function OrderDocumentMatrixSimple({ orderId, onBack }: OrderDocumentMatrixSimpleProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // 使用传入的orderId（这里用模拟数据）
  const order = {
    ...mockOrderDetail,
    orderId: orderId,
  };

  const getStatusBadge = (status: DocStatus) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-500',
      auto_generated: 'bg-blue-500',
      uploaded: 'bg-cyan-500',
      reviewing: 'bg-yellow-500',
      approved: 'bg-green-600',
      rejected: 'bg-red-600',
      overdue: 'bg-red-700',
      na: 'bg-gray-300'
    };
    const labels: Record<string, string> = {
      pending: '待处理',
      auto_generated: '自动生成',
      uploaded: '已上传',
      reviewing: '审核中',
      approved: '已批准',
      rejected: '已驳回',
      overdue: '超期',
      na: 'N/A'
    };
    return <Badge className={`${styles[status]} text-white text-[10px] px-1.5 py-0`}>{labels[status]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-7 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              返回列表
            </Button>
            <div className="h-5 w-px bg-gray-300"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">{order.orderId}</span>
                <Badge className="text-[10px]" style={{ background: '#F96302', color: 'white' }}>
                  进度 {order.completionRate}%
                </Badge>
              </div>
              <div className="text-xs text-gray-500">{order.customer.name} · {order.contractNo}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Printer className="h-3.5 w-3.5 mr-1" />
              打印
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              打包下载
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Send className="h-3.5 w-3.5 mr-1" />
              发送客户
            </Button>
            <Button size="sm" className="h-7 text-xs text-white" style={{ background: '#F96302' }}>
              <Save className="h-3.5 w-3.5 mr-1" />
              保存
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 订单概览卡片 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">客户信息</div>
                <div className="text-xs font-semibold text-gray-900">{order.customer.name}</div>
                <div className="text-[10px] text-gray-500">{order.customer.country}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">合同金额</div>
                <div className="text-xs font-semibold text-gray-900">{order.currency} {order.totalValue.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">{order.incoterm} · {order.destPort}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Ship className="h-4 w-4 text-indigo-600 mt-0.5" />
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">出货信息</div>
                <div className="text-xs font-semibold text-gray-900">{order.shipmentDate}</div>
                <div className="text-[10px] text-gray-500">{order.container}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600 mt-0.5" />
              <div>
                <div className="text-[10px] text-gray-500 mb-0.5">收汇进度</div>
                <div className="text-xs font-semibold text-gray-900">{order.collectionProgress}% 已收汇</div>
                <div className="text-[10px] text-gray-500">{order.currency} {(order.totalValue * order.collectionProgress / 100).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 业务时间线 */}
          <div className="border-t border-gray-200 pt-3">
            <div className="text-[10px] text-gray-500 mb-2">业务时间线</div>
            <div className="flex items-center justify-between">
              {BUSINESS_MILESTONES.map((milestone, idx) => {
                const Icon = milestone.icon;
                return (
                  <React.Fragment key={milestone.id}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        milestone.status === 'completed' ? 'bg-green-100 border-2 border-green-500' :
                        milestone.status === 'warning' ? 'bg-yellow-100 border-2 border-yellow-500' :
                        milestone.status === 'pending' ? 'bg-blue-100 border-2 border-blue-400' :
                        'bg-gray-100 border-2 border-gray-300'
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${
                          milestone.status === 'completed' ? 'text-green-600' :
                          milestone.status === 'warning' ? 'text-yellow-600' :
                          milestone.status === 'pending' ? 'text-blue-600' :
                          'text-gray-400'
                        }`} />
                      </div>
                      <div className="text-[10px] font-semibold text-gray-700 text-center">{milestone.name}</div>
                      <div className="text-[9px] text-gray-500">{milestone.date}</div>
                      {milestone.status === 'completed' && (
                        <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5" />
                      )}
                      {milestone.status === 'warning' && (
                        <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5" />
                      )}
                      {milestone.status === 'blocked' && (
                        <XCircle className="h-3 w-3 text-gray-400 mt-0.5" />
                      )}
                    </div>
                    {idx < BUSINESS_MILESTONES.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        milestone.status === 'completed' ? 'bg-green-400' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* 单证进度仪表盘 */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg shadow-sm p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-bold text-orange-900">单证进度仪表盘</span>
            </div>
            <div className="text-xl font-bold" style={{ color: '#F96302' }}>{order.completionRate}%</div>
          </div>
          <div className="w-full bg-white rounded-full h-3 mb-2 border border-orange-200">
            <div 
              className="h-3 rounded-full transition-all"
              style={{ 
                width: `${order.completionRate}%`,
                background: 'linear-gradient(to right, #F96302, #ff8534)'
              }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-3">
              <span className="text-gray-700">
                <span className="font-bold text-green-700">{order.completedDocs}</span> / {order.requiredDocs} 完成
              </span>
              <span className="text-gray-700">
                <span className="font-bold text-yellow-700">{order.missingDocs}</span> 项缺失
              </span>
              <span className="text-gray-700">
                <span className="font-bold text-red-700">{order.overdueItems}</span> 项超期
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-red-700 font-semibold">D05报关单已超期2天</span>
            </div>
          </div>
        </div>

        {/* 📊 矩阵视图 - 按业务阶段排列 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: '#F96302' }} />
              <span className="text-sm font-bold text-gray-900">单证矩阵 · 一目了然</span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              刷新
            </Button>
          </div>

          {/* 业务阶段分组 */}
          {[
            { stage: '合同阶段', color: '#3B82F6', docs: ['D02', 'D07'] },
            { stage: '国内运输', color: '#8B5CF6', docs: ['D03', 'D04'] },
            { stage: '报关出口', color: '#F59E0B', docs: ['D05', 'D06', 'D08'] },
            { stage: '国际运输', color: '#10B981', docs: ['D09', 'D10'] },
            { stage: '收汇结汇', color: '#EC4899', docs: ['D11', 'D12'] },
            { stage: '退税阶段', color: '#EF4444', docs: ['D01', 'D13'] },
          ].map((stageGroup, groupIdx) => (
            <div key={groupIdx} className="mb-4">
              {/* 阶段标题 */}
              <div 
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg" 
                style={{ backgroundColor: `${stageGroup.color}15`, borderLeft: `4px solid ${stageGroup.color}` }}
              >
                <span className="text-sm font-bold" style={{ color: stageGroup.color }}>
                  {stageGroup.stage}
                </span>
                <Badge className="text-[9px]" style={{ backgroundColor: stageGroup.color, color: 'white' }}>
                  {stageGroup.docs.length}份
                </Badge>
              </div>

              {/* 单证卡片网格 */}
              <div className="grid grid-cols-6 gap-2">
                {stageGroup.docs.map((docId) => {
                  const doc = DOCUMENT_CHECKLIST.find(d => d.id === docId);
                  if (!doc) return null;
                  
                  const docInstance = order.documents[docId as keyof typeof order.documents];
                  if (!docInstance) return null;
                  
                  const Icon = doc.icon;
                  
                  return (
                    <div
                      key={docId}
                      className={`border-2 rounded p-2 cursor-pointer transition-all hover:shadow-md ${
                        docInstance.status === 'approved' ? 'bg-green-50 border-green-400' :
                        docInstance.status === 'auto_generated' ? 'bg-blue-50 border-blue-400' :
                        docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'bg-cyan-50 border-cyan-400' :
                        docInstance.status === 'overdue' ? 'bg-red-50 border-red-500' :
                        docInstance.status === 'pending' ? 'bg-gray-50 border-gray-300 border-dashed' :
                        docInstance.status === 'na' ? 'bg-gray-100 border-gray-200 opacity-50' :
                        'bg-orange-50 border-orange-400'
                      }`}
                      onClick={() => setSelectedDoc(docId)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <Icon className={`h-4 w-4 ${
                          docInstance.status === 'approved' ? 'text-green-600' :
                          docInstance.status === 'auto_generated' ? 'text-blue-600' :
                          docInstance.status === 'uploaded' || docInstance.status === 'reviewing' ? 'text-cyan-600' :
                          docInstance.status === 'overdue' ? 'text-red-700' :
                          docInstance.status === 'pending' ? 'text-gray-400' :
                          docInstance.status === 'na' ? 'text-gray-300' :
                          'text-orange-600'
                        }`} />
                        {docInstance.status === 'overdue' && (
                          <AlertTriangle className="h-3 w-3 text-red-700" />
                        )}
                        {docInstance.status === 'approved' && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                        {docInstance.status === 'pending' && (
                          <Clock className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                      
                      <div className="text-xs font-bold text-gray-900 mb-0.5">{docId}</div>
                      <div className="text-[9px] text-gray-700 mb-1 line-clamp-2 leading-tight">
                        {doc.name}
                      </div>
                      
                      {getStatusBadge(docInstance.status)}
                      
                      {docInstance.files && docInstance.files.length > 0 ? (
                        <div className="text-[8px] text-gray-600 mt-1">
                          📎 {docInstance.files.length}个文件
                        </div>
                      ) : docInstance.status === 'pending' ? (
                        <div className="text-[8px] text-gray-400 mt-1">
                          ⏳ 待上传
                        </div>
                      ) : docInstance.status === 'na' ? (
                        <div className="text-[8px] text-gray-400 mt-1">
                          ⊘ 不适用
                        </div>
                      ) : null}
                      
                      {docInstance.status === 'pending' || docInstance.status === 'overdue' ? (
                        <Button 
                          size="sm" 
                          className="w-full h-5 text-[8px] mt-1 text-white"
                          style={{ background: '#F96302' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUploadDialog(true);
                          }}
                        >
                          <Upload className="h-2.5 w-2.5 mr-0.5" />
                          上传
                        </Button>
                      ) : docInstance.status !== 'na' ? (
                        <div className="flex gap-0.5 mt-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 h-5 text-[8px] p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye className="h-2.5 w-2.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 h-5 text-[8px] p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
