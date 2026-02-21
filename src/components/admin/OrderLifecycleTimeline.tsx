// 🔥 订单全生命周期时间线视图
// 显示从询价到收款的完整业务链路

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import {
  FileText, DollarSign, FileCheck, Package, Ship, Wallet,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Search,
  Eye, ArrowRight, TrendingUp, Calendar, User
} from 'lucide-react';

// 时间线节点接口
interface TimelineStage {
  stage: string;
  label: string;
  icon: any;
  status: 'completed' | 'in_progress' | 'pending' | 'partial';
  date?: string;
  documentId?: string;
  color: string;
  progress?: number;
  details?: string;
}

// 订单数据接口
interface OrderLifecycle {
  customerName: string;
  orderReference: string; // 用于关联查询
  timeline: TimelineStage[];
  totalAmount: number;
  currency: string;
  region: string;
  createdAt: string;
  estimatedCompletion?: string;
}

export default function OrderLifecycleTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderLifecycle | null>(null);

  // 🔥 模拟订单全生命周期数据
  const mockOrderLifecycles: OrderLifecycle[] = [
    {
      customerName: 'ABC Trading Ltd.',
      orderReference: 'RFQ-251201-0001',
      region: 'NA',
      totalAmount: 125000,
      currency: 'USD',
      createdAt: '2024-12-01',
      estimatedCompletion: '2025-02-15',
      timeline: [
        {
          stage: 'inquiry',
          label: '询价',
          icon: FileText,
          status: 'completed',
          date: '2024-12-01',
          documentId: 'RFQ-251201-0001',
          color: 'blue',
          details: '客户提交询价单，5个产品项'
        },
        {
          stage: 'quotation',
          label: '报价',
          icon: DollarSign,
          status: 'completed',
          date: '2024-12-02',
          documentId: 'QT-251202-0001',
          color: 'purple',
          details: '报价单已发送并被客户接受'
        },
        {
          stage: 'contract',
          label: '合同',
          icon: FileCheck,
          status: 'completed',
          date: '2024-12-03',
          documentId: 'SC-NA-251203-0001',
          color: 'green',
          details: '销售合同已签订'
        },
        {
          stage: 'order',
          label: '订单',
          icon: Package,
          status: 'in_progress',
          date: '2024-12-04',
          documentId: 'PO-NA-251204-0001',
          color: 'orange',
          details: '订单执行中，生产进度65%'
        },
        {
          stage: 'shipping',
          label: '发货',
          icon: Ship,
          status: 'pending',
          color: 'cyan',
          details: '待发货'
        },
        {
          stage: 'payment',
          label: '收款',
          icon: Wallet,
          status: 'partial',
          date: '2024-12-05',
          color: 'emerald',
          progress: 30,
          details: '已收30%定金 ($37,500)'
        }
      ]
    },
    {
      customerName: 'Global Parts Ltd.',
      orderReference: 'RFQ-251115-0012',
      region: 'NA',
      totalAmount: 85000,
      currency: 'USD',
      createdAt: '2024-11-15',
      timeline: [
        {
          stage: 'inquiry',
          label: '询价',
          icon: FileText,
          status: 'completed',
          date: '2024-11-15',
          documentId: 'RFQ-251115-0012',
          color: 'blue'
        },
        {
          stage: 'quotation',
          label: '报价',
          icon: DollarSign,
          status: 'completed',
          date: '2024-11-16',
          documentId: 'QT-251116-0008',
          color: 'purple'
        },
        {
          stage: 'contract',
          label: '合同',
          icon: FileCheck,
          status: 'completed',
          date: '2024-11-18',
          documentId: 'SC-NA-251118-0008',
          color: 'green'
        },
        {
          stage: 'order',
          label: '订单',
          icon: Package,
          status: 'completed',
          date: '2024-11-20',
          documentId: 'PO-NA-251120-0008',
          color: 'orange'
        },
        {
          stage: 'shipping',
          label: '发货',
          icon: Ship,
          status: 'completed',
          date: '2024-11-28',
          documentId: 'SH-2024-0032',
          color: 'cyan'
        },
        {
          stage: 'payment',
          label: '收款',
          icon: Wallet,
          status: 'completed',
          date: '2024-12-01',
          color: 'emerald',
          progress: 100,
          details: '已收全款'
        }
      ]
    },
    {
      customerName: 'Euro Building Materials',
      orderReference: 'RFQ-251125-0018',
      region: 'EA',
      totalAmount: 210000,
      currency: 'EUR',
      createdAt: '2024-11-25',
      timeline: [
        {
          stage: 'inquiry',
          label: '询价',
          icon: FileText,
          status: 'completed',
          date: '2024-11-25',
          documentId: 'RFQ-251125-0018',
          color: 'blue'
        },
        {
          stage: 'quotation',
          label: '报价',
          icon: DollarSign,
          status: 'completed',
          date: '2024-11-26',
          documentId: 'QT-251126-0013',
          color: 'purple'
        },
        {
          stage: 'contract',
          label: '合同',
          icon: FileCheck,
          status: 'in_progress',
          date: '2024-11-28',
          color: 'green',
          details: '合同审核中'
        },
        {
          stage: 'order',
          label: '订单',
          icon: Package,
          status: 'pending',
          color: 'orange'
        },
        {
          stage: 'shipping',
          label: '发货',
          icon: Ship,
          status: 'pending',
          color: 'cyan'
        },
        {
          stage: 'payment',
          label: '收款',
          icon: Wallet,
          status: 'pending',
          color: 'emerald'
        }
      ]
    }
  ];

  // 筛选订单
  const filteredOrders = mockOrderLifecycles.filter(order =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取状态配置
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-300 h-5 px-2 text-xs">
          <CheckCircle2 className="size-3 mr-1" />
          已完成
        </Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300 h-5 px-2 text-xs">
          <Clock className="size-3 mr-1" />
          进行中
        </Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 h-5 px-2 text-xs">
          <AlertCircle className="size-3 mr-1" />
          部分完成
        </Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-300 h-5 px-2 text-xs">
          待处理
        </Badge>;
    }
  };

  // 计算订单整体进度
  const calculateOverallProgress = (timeline: TimelineStage[]) => {
    const totalStages = timeline.length;
    let completedStages = 0;
    let partialProgress = 0;

    timeline.forEach(stage => {
      if (stage.status === 'completed') {
        completedStages++;
      } else if (stage.status === 'in_progress' || stage.status === 'partial') {
        partialProgress += 0.5;
      }
    });

    return ((completedStages + partialProgress) / totalStages) * 100;
  };

  return (
    <div className="space-y-4">
      {/* 头部说明 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="size-10 text-blue-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900" style={{ fontSize: '15px' }}>
                订单全生命周期视图
              </h3>
              <p className="text-xs text-blue-700 mt-0.5">
                追踪从询价到收款的完整业务流程，一目了然掌握订单进度
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 搜索栏 */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-4" />
            <Input
              placeholder="搜索客户名称或询价单号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* 订单时间线列表 */}
      <div className="space-y-3">
        {filteredOrders.map((order, index) => {
          const overallProgress = calculateOverallProgress(order.timeline);
          const currentStage = order.timeline.find(s => s.status === 'in_progress') || 
                               order.timeline.find(s => s.status === 'partial') ||
                               order.timeline.filter(s => s.status === 'completed').slice(-1)[0];

          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <div className="p-5">
                {/* 订单头部信息 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>
                        {order.customerName}
                      </h4>
                      <Badge variant="outline" className="h-5 px-2 text-xs">
                        {order.region}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {order.orderReference}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        创建于 {order.createdAt}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-gray-900">
                        <DollarSign className="size-3" />
                        {order.currency} {order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">整体进度</p>
                    <p className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(0)}%</p>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-4">
                  <Progress value={overallProgress} className="h-2" />
                </div>

                {/* 时间线 */}
                <div className="flex items-center gap-2 relative">
                  {order.timeline.map((stage, stageIndex) => {
                    const StageIcon = stage.icon;
                    const isActive = currentStage?.stage === stage.stage;
                    
                    return (
                      <React.Fragment key={stage.stage}>
                        <div className="flex-1">
                          <div className={`
                            border-2 rounded-lg p-3 transition-all
                            ${stage.status === 'completed' 
                              ? 'border-green-300 bg-green-50' 
                              : stage.status === 'in_progress' || stage.status === 'partial'
                              ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 bg-gray-50'
                            }
                            ${isActive ? 'shadow-md' : ''}
                          `}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`
                                p-1.5 rounded-full
                                ${stage.status === 'completed' 
                                  ? 'bg-green-500' 
                                  : stage.status === 'in_progress' || stage.status === 'partial'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-300'
                                }
                              `}>
                                <StageIcon className="size-3 text-white" />
                              </div>
                              <span className={`
                                font-medium text-xs
                                ${stage.status === 'completed' 
                                  ? 'text-green-900' 
                                  : stage.status === 'in_progress' || stage.status === 'partial'
                                  ? 'text-blue-900'
                                  : 'text-gray-600'
                                }
                              `}>
                                {stage.label}
                              </span>
                            </div>
                            
                            {stage.documentId && (
                              <p className="text-xs font-mono text-gray-700 mb-1">
                                {stage.documentId}
                              </p>
                            )}
                            
                            {stage.date && (
                              <p className="text-xs text-gray-500 mb-1">
                                {stage.date}
                              </p>
                            )}
                            
                            {stage.progress !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">进度</span>
                                  <span className="text-xs font-medium text-gray-900">{stage.progress}%</span>
                                </div>
                                <Progress value={stage.progress} className="h-1.5" />
                              </div>
                            )}
                            
                            {stage.details && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1" title={stage.details}>
                                {stage.details}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {stageIndex < order.timeline.length - 1 && (
                          <ChevronRight className={`
                            size-5 flex-shrink-0
                            ${order.timeline[stageIndex + 1].status === 'completed' 
                              ? 'text-green-500' 
                              : 'text-gray-300'
                            }
                          `} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="size-3.5 mr-1.5" />
                    查看详情
                  </Button>
                  {currentStage && currentStage.documentId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs text-blue-600 border-blue-300"
                    >
                      <ArrowRight className="size-3.5 mr-1.5" />
                      跳转到 {currentStage.label}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <FileText className="size-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">暂无订单数据</p>
          </div>
        </Card>
      )}
    </div>
  );
}
