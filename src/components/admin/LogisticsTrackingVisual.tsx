import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { 
  Truck,
  Ship,
  Plane,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Eye,
  Bell,
  Calendar,
  Activity,
  Navigation,
  Anchor,
  Box,
  FileText
} from 'lucide-react';

interface LogisticsTrackingVisualProps {
  userRole?: string;
}

export default function LogisticsTrackingVisual({ userRole = 'Sales_Rep' }: LogisticsTrackingVisualProps) {
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showShipmentDetail, setShowShipmentDetail] = useState(false);

  // 物流总览
  const logisticsOverview = {
    totalShipments: 89,
    inTransit: 45,
    onTimeRate: 92.5,
    avgDeliveryDays: 12.3,
    delayedShipments: 6,
    completedThisMonth: 34
  };

  // 货运方式分布
  const shippingMethods = [
    { method: '海运', count: 52, percent: 58.4, avgDays: 25, color: '#3b82f6' },
    { method: '空运', count: 28, percent: 31.5, avgDays: 5, color: '#8b5cf6' },
    { method: '陆运', count: 9, percent: 10.1, avgDays: 8, color: '#10b981' }
  ];

  // 运输中货物
  const shipmentsInTransit = [
    {
      id: 'SH2024001',
      customer: 'ABC Trading Co.',
      origin: '厦门港',
      destination: '洛杉矶港',
      method: 'sea',
      status: 'in_transit',
      progress: 65,
      eta: '2024-12-05',
      currentLocation: '太平洋',
      vessel: 'COSCO PACIFIC',
      milestones: [
        { name: '已装船', completed: true, date: '2024-11-15' },
        { name: '离港', completed: true, date: '2024-11-16' },
        { name: '海上运输', completed: false, date: '进行中' },
        { name: '到达目的港', completed: false, date: '预计12-05' },
        { name: '清关', completed: false, date: '待定' },
        { name: '派送', completed: false, date: '待定' }
      ]
    },
    {
      id: 'SH2024002',
      customer: 'Global Parts Ltd.',
      origin: '深圳机场',
      destination: '纽约JFK',
      method: 'air',
      status: 'in_transit',
      progress: 80,
      eta: '2024-11-26',
      currentLocation: '阿拉斯加安克雷奇',
      vessel: 'UA888',
      milestones: [
        { name: '已提货', completed: true, date: '2024-11-23' },
        { name: '机场待发', completed: true, date: '2024-11-23' },
        { name: '空中运输', completed: true, date: '2024-11-24' },
        { name: '中转', completed: true, date: '2024-11-25' },
        { name: '到达目的地', completed: false, date: '预计11-26' },
        { name: '派送', completed: false, date: '待定' }
      ]
    },
    {
      id: 'SH2024003',
      customer: 'Euro Building Materials',
      origin: '广州港',
      destination: '鹿特丹港',
      method: 'sea',
      status: 'delayed',
      progress: 45,
      eta: '2024-12-15',
      delay: 3,
      currentLocation: '苏伊士运河',
      vessel: 'MAERSK ANTWERP',
      milestones: [
        { name: '已装船', completed: true, date: '2024-11-10' },
        { name: '离港', completed: true, date: '2024-11-11' },
        { name: '海上运输', completed: false, date: '进行中（延误3天）' },
        { name: '到达目的港', completed: false, date: '预计12-15' },
        { name: '清关', completed: false, date: '待定' },
        { name: '派送', completed: false, date: '待定' }
      ]
    }
  ];

  const getMethodIcon = (method: string) => {
    switch(method) {
      case 'sea': return Ship;
      case 'air': return Plane;
      case 'land': return Truck;
      default: return Package;
    }
  };

  const getMethodLabel = (method: string) => {
    switch(method) {
      case 'sea': return '海运';
      case 'air': return '空运';
      case 'land': return '陆运';
      default: return '其他';
    }
  };

  const handleRefresh = () => {
    toast.success('数据已刷新', {
      description: '物流追踪数据已更新到最新状态'
    });
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 flex items-center gap-3" style={{ fontSize: '24px', fontWeight: 700 }}>
            <Navigation className="w-7 h-7 text-emerald-600" />
            物流追踪
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
              Visual
            </Badge>
          </h1>
          <p className="text-slate-600 mt-1" style={{ fontSize: '14px' }}>
            Logistics Tracking · 全球货运追踪 · ETA预测 · 异常预警
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            导出报告
          </Button>
        </div>
      </div>

      {/* KPI总览 - 台湾大厂风格：紧凑、无阴影、细边框 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center border border-slate-200">
              <Package className="w-4 h-4 text-slate-700" />
            </div>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">总运输单</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.totalShipments}
          </div>
        </Card>

        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded flex items-center justify-center border border-blue-200">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <Badge className="h-5 px-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200">
              进行中
            </Badge>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">运输中</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.inTransit}
          </div>
        </Card>

        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-emerald-50 rounded flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <Badge className="h-5 px-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              +2.1%
            </Badge>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">准时率</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.onTimeRate}%
          </div>
        </Card>

        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-purple-50 rounded flex items-center justify-center border border-purple-200">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <Badge className="h-5 px-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 gap-1">
              <TrendingUp className="w-2.5 h-2.5" />
              -1.2天
            </Badge>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">平均时效</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.avgDeliveryDays}天
          </div>
        </Card>

        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-orange-50 rounded flex items-center justify-center border border-orange-200">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <Badge className="h-5 px-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200">
              需关注
            </Badge>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">延误货物</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.delayedShipments}
          </div>
        </Card>

        <Card className="p-3 bg-white border border-[#D1D5DB] shadow-none hover:border-[#F96302] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 bg-teal-50 rounded flex items-center justify-center border border-teal-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <div className="text-xs text-slate-600 mb-0.5">本月完成</div>
          <div className="text-slate-900" style={{ fontSize: '20px', fontWeight: 700 }}>
            {logisticsOverview.completedThisMonth}
          </div>
        </Card>
      </div>

      {/* 运输方式分布 - 台湾大厂风格：紧凑、细边框 */}
      <Card className="p-4 bg-white border border-[#D1D5DB] shadow-none">
        <h3 className="text-slate-900 flex items-center gap-2 mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
          <Truck className="w-4 h-4 text-emerald-600" />
          运输方式分布
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {shippingMethods.map((method, index) => (
            <div key={index} className="bg-white rounded border border-[#D1D5DB] p-3 hover:border-[#F96302] transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{method.method}</div>
                <Badge className="h-5 px-1.5 text-xs" style={{ backgroundColor: method.color + '15', color: method.color, border: `1px solid ${method.color}40` }}>
                  {method.count}单
                </Badge>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">占比</span>
                  <span className="text-xs" style={{ color: method.color, fontWeight: 600 }}>{method.percent}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">平均时效</span>
                  <span className="text-xs text-slate-900" style={{ fontWeight: 600 }}>{method.avgDays}天</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div 
                  className="h-1.5 rounded-full transition-all" 
                  style={{ width: `${method.percent}%`, backgroundColor: method.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 运输中货物追踪 - 台湾大厂风格：紧凑、细边框、高信息密度 */}
      <Card className="p-4 bg-white border border-[#D1D5DB] shadow-none">
        <h3 className="text-slate-900 flex items-center gap-2 mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
          <Navigation className="w-4 h-4 text-blue-600" />
          运输中货物追踪
        </h3>
        <div className="space-y-3">
          {shipmentsInTransit.map((shipment, index) => {
            const MethodIcon = getMethodIcon(shipment.method);
            const isDelayed = shipment.status === 'delayed';
            
            return (
              <div 
                key={shipment.id} 
                className={`bg-white rounded border p-3 transition-colors ${
                  isDelayed ? 'border-orange-400 hover:border-orange-500' : 'border-[#D1D5DB] hover:border-[#F96302]'
                }`}
              >
                {/* 头部信息行 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-900" style={{ fontWeight: 600 }}>{shipment.id}</span>
                    <Badge className="h-5 px-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 gap-1">
                      <MethodIcon className="w-3 h-3" />
                      {getMethodLabel(shipment.method)}
                    </Badge>
                    {isDelayed && (
                      <Badge className="h-5 px-1.5 text-xs bg-orange-50 text-orange-700 border border-orange-200">
                        延误{shipment.delay}天
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button 
                      size="sm" 
                      className="h-7 px-2.5 text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        setSelectedShipment(shipment);
                        setShowShipmentDetail(true);
                      }}
                    >
                      <Eye className="w-3 h-3" />
                      详情
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1">
                      <FileText className="w-3 h-3" />
                      运单
                    </Button>
                  </div>
                </div>

                {/* 核心信息网格 */}
                <div className="grid grid-cols-5 gap-3 mb-2">
                  <div>
                    <div className="text-xs text-slate-500">客户</div>
                    <div className="text-xs text-slate-900" style={{ fontWeight: 600 }}>{shipment.customer}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">起运地</div>
                    <div className="text-xs text-slate-900" style={{ fontWeight: 600 }}>{shipment.origin}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">目的地</div>
                    <div className="text-xs text-slate-900" style={{ fontWeight: 600 }}>{shipment.destination}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">当前位置</div>
                    <div className="text-xs text-blue-600 flex items-center gap-1" style={{ fontWeight: 600 }}>
                      <MapPin className="w-3 h-3" />
                      {shipment.currentLocation}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">预计到达</div>
                    <div className="text-xs text-emerald-600" style={{ fontWeight: 600 }}>{shipment.eta}</div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-500">运输进度 · {shipment.vessel}</span>
                    <span className="text-xs" style={{ color: isDelayed ? '#ea580c' : '#2563eb', fontWeight: 600 }}>{shipment.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all"
                      style={{ 
                        width: `${shipment.progress}%`, 
                        backgroundColor: isDelayed ? '#ea580c' : '#2563eb' 
                      }}
                    />
                  </div>
                </div>

                {/* 里程碑 - 简化版 */}
                <div className="bg-slate-50 rounded p-2 border border-slate-200">
                  <div className="flex items-center gap-2">
                    {shipment.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {milestone.completed ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs truncate ${milestone.completed ? 'text-emerald-700' : 'text-slate-500'}`} style={{ fontWeight: milestone.completed ? 600 : 400 }}>
                              {milestone.name}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{milestone.date}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 弹窗：货物详情 */}
      <Dialog open={showShipmentDetail} onOpenChange={setShowShipmentDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-600" />
              货物追踪详情
            </DialogTitle>
            <DialogDescription>
              {selectedShipment?.id} - {selectedShipment?.customer}
            </DialogDescription>
          </DialogHeader>

          {selectedShipment && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-600">运单号</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedShipment.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">运输方式</p>
                    <p className="text-sm font-semibold text-slate-900">{getMethodLabel(selectedShipment.method)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">起运地</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedShipment.origin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">目的地</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedShipment.destination}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">当前状态</h4>
                <p className="text-sm text-slate-700">位置: {selectedShipment.currentLocation}</p>
                <p className="text-sm text-slate-700">运输工具: {selectedShipment.vessel}</p>
                <p className="text-sm text-slate-700">预计到达: {selectedShipment.eta}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipmentDetail(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}