import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Ship, Package, MapPin, CheckCircle2, Calendar, 
  FileText, Upload, Download, Mail, ArrowLeft,
  Truck, Anchor, FileCheck, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

// 发货信息接口
interface ShipmentInfo {
  contractNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  portOfLoading: string;
  portOfDischarge: string;
  
  // 物流信息
  logistics: {
    forwarder?: {
      company: string;
      contact: string;
      phone: string;
      email: string;
      freightQuote: number;
    };
    booking?: {
      bookingDate: string;
      shippingLine: string;
      vessel: string;
      voyage: string;
      containerType: string;
      containerQty: number;
      etd: string;
      eta: string;
    };
    trucking?: {
      company: string;
      pickupDate: string;
      loadingDate: string;
      returnDate: string;
      containerNo: string;
      sealNo: string;
    };
    customs?: {
      broker: string;
      declarationNo: string;
      declarationDate: string;
      status: 'pending' | 'cleared';
    };
  };
  
  // 单证信息
  documents: {
    commercialInvoice?: {
      documentNumber: string;
      issueDate: string;
      status: 'draft' | 'issued' | 'paid';
      pdfUrl?: string;
    };
    packingList?: {
      documentNumber: string;
      issueDate: string;
      status: 'draft' | 'completed';
      pdfUrl?: string;
    };
    billOfLading?: {
      blNumber: string;
      type: 'original' | 'seaway';
      issueDate: string;
      status: 'pending' | 'issued';
      pdfUrl?: string;
    };
  };
  
  // 跟踪信息
  tracking: {
    currentStatus: 'preparing' | 'shipped' | 'in_transit' | 'arrived' | 'cleared' | 'delivered';
    actualDepartureDate?: string;
    actualArrivalDate?: string;
    timeline: Array<{
      date: string;
      status: string;
      location: string;
      note: string;
    }>;
  };
  
  // 交付信息
  delivery?: {
    customsClearanceDate?: string;
    pickupDate?: string;
    customerConfirmation?: boolean;
  };
}

export default function ShipmentManagement() {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentInfo | null>(null);

  // 模拟发货数据
  const mockShipments: ShipmentInfo[] = [
    {
      contractNumber: 'SC-NA-251121-0001',
      customerName: 'ABC Trading Ltd.',
      amount: 125000,
      currency: 'USD',
      portOfLoading: 'XIAMEN',
      portOfDischarge: 'LOS ANGELES',
      logistics: {
        forwarder: {
          company: 'China Freight Co.',
          contact: '张三',
          phone: '+86 592 1234567',
          email: 'zhangsan@freight.com',
          freightQuote: 2500
        },
        booking: {
          bookingDate: '2025-12-15',
          shippingLine: 'MAERSK',
          vessel: 'MAERSK HONAM',
          voyage: 'V.2025-12',
          containerType: '40HQ',
          containerQty: 2,
          etd: '2025-12-25',
          eta: '2026-01-22'
        },
        trucking: {
          company: 'Local Trucking Ltd.',
          pickupDate: '2025-12-22',
          loadingDate: '2025-12-23',
          returnDate: '2025-12-24',
          containerNo: 'MAEU1234567',
          sealNo: 'SEAL789012'
        },
        customs: {
          broker: 'China Customs Broker',
          declarationNo: '523012345678',
          declarationDate: '2025-12-24',
          status: 'cleared'
        }
      },
      documents: {
        commercialInvoice: {
          documentNumber: 'CI-NA-251220-0001',
          issueDate: '2025-12-20',
          status: 'issued',
          pdfUrl: '#'
        },
        packingList: {
          documentNumber: 'PL-NA-251220-0001',
          issueDate: '2025-12-20',
          status: 'completed',
          pdfUrl: '#'
        },
        billOfLading: {
          blNumber: 'MAEU123456789',
          type: 'original',
          issueDate: '2025-12-25',
          status: 'issued',
          pdfUrl: '#'
        }
      },
      tracking: {
        currentStatus: 'in_transit',
        actualDepartureDate: '2025-12-25',
        timeline: [
          { date: '2025-12-24', status: '报关放行', location: 'XIAMEN', note: '海关已放行' },
          { date: '2025-12-25', status: '已装船', location: 'XIAMEN', note: 'MAERSK HONAM' },
          { date: '2026-01-08', status: '在途', location: '太平洋', note: '航行正常' }
        ]
      }
    },
    {
      contractNumber: 'SC-NA-251115-0001',
      customerName: 'Industrial Supply Hub',
      amount: 156000,
      currency: 'USD',
      portOfLoading: 'SHANGHAI',
      portOfDischarge: 'NEW YORK',
      logistics: {
        forwarder: {
          company: 'Global Shipping Ltd.',
          contact: '李四',
          phone: '+86 21 8765432',
          email: 'lisi@global.com',
          freightQuote: 3200
        },
        booking: {
          bookingDate: '2025-11-20',
          shippingLine: 'MSC',
          vessel: 'MSC OSCAR',
          voyage: 'V.2025-11',
          containerType: '40HQ',
          containerQty: 3,
          etd: '2025-12-05',
          eta: '2026-01-10'
        }
      },
      documents: {
        commercialInvoice: {
          documentNumber: 'CI-NA-251130-0001',
          issueDate: '2025-11-30',
          status: 'issued',
          pdfUrl: '#'
        }
      },
      tracking: {
        currentStatus: 'preparing',
        timeline: [
          { date: '2025-11-20', status: '订舱成功', location: 'SHANGHAI', note: 'MSC OSCAR' }
        ]
      }
    },
    {
      contractNumber: 'SC-EU-251101-0001',
      customerName: 'EuroHome GmbH',
      amount: 45000,
      currency: 'EUR',
      portOfLoading: 'NINGBO',
      portOfDischarge: 'HAMBURG',
      logistics: {
        forwarder: {
          company: 'Euro Express Freight',
          contact: '王五',
          phone: '+86 574 5551234',
          email: 'wangwu@euroex.com',
          freightQuote: 1800
        },
        booking: {
          bookingDate: '2025-11-05',
          shippingLine: 'COSCO',
          vessel: 'COSCO SHIPPING UNIVERSE',
          voyage: 'V.2025-11',
          containerType: '20GP',
          containerQty: 1,
          etd: '2025-11-15',
          eta: '2025-12-20'
        },
        trucking: {
          company: 'Ningbo Trucking',
          pickupDate: '2025-11-12',
          loadingDate: '2025-11-13',
          returnDate: '2025-11-14',
          containerNo: 'COSU9876543',
          sealNo: 'SEAL456789'
        },
        customs: {
          broker: 'Ningbo Customs',
          declarationNo: '523098765432',
          declarationDate: '2025-11-14',
          status: 'cleared'
        }
      },
      documents: {
        commercialInvoice: {
          documentNumber: 'CI-EU-251110-0001',
          issueDate: '2025-11-10',
          status: 'paid',
          pdfUrl: '#'
        },
        packingList: {
          documentNumber: 'PL-EU-251110-0001',
          issueDate: '2025-11-10',
          status: 'completed',
          pdfUrl: '#'
        },
        billOfLading: {
          blNumber: 'COSU7654321',
          type: 'seaway',
          issueDate: '2025-11-15',
          status: 'issued',
          pdfUrl: '#'
        }
      },
      tracking: {
        currentStatus: 'arrived',
        actualDepartureDate: '2025-11-15',
        actualArrivalDate: '2025-12-20',
        timeline: [
          { date: '2025-11-14', status: '报关放行', location: 'NINGBO', note: '海关已放行' },
          { date: '2025-11-15', status: '已装船', location: 'NINGBO', note: 'COSCO SHIPPING UNIVERSE' },
          { date: '2025-12-05', status: '在途', location: '印度洋', note: '航行正常' },
          { date: '2025-12-20', status: '到港', location: 'HAMBURG', note: '已到达目的港' }
        ]
      },
      delivery: {
        customsClearanceDate: '2025-12-22',
        customerConfirmation: false
      }
    }
  ];

  // 获取状态配置
  const getStatusConfig = (status: string) => {
    const configs = {
      preparing: { label: '准备中', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Package },
      shipped: { label: '已装船', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Ship },
      in_transit: { label: '在途', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Ship },
      arrived: { label: '已到港', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Anchor },
      cleared: { label: '已清关', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileCheck },
      delivered: { label: '已交付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
    };
    return configs[status as keyof typeof configs] || configs.preparing;
  };

  // 打开发货详情
  const openShipmentDetail = (shipment: ShipmentInfo) => {
    setSelectedShipment(shipment);
    setViewMode('detail');
  };

  // 返回列表
  const backToList = () => {
    setViewMode('list');
    setSelectedShipment(null);
  };

  if (viewMode === 'detail' && selectedShipment) {
    return <ShipmentDetail shipment={selectedShipment} onBack={backToList} />;
  }

  // 发货列表视图
  return (
    <div className="space-y-3 p-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">发货管理</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">管理订单物流、单证制作和货柜跟踪</p>
        </div>
        <Button size="sm" className="h-7 text-[14px] bg-[#F96302] hover:bg-[#E55A02] px-2.5">
          <Ship className="w-3 h-3 mr-1" />
          新建发货
        </Button>
      </div>

      {/* 发货列表 */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="grid gap-3 p-3">
          {mockShipments.map((shipment) => {
            const statusConfig = getStatusConfig(shipment.tracking.currentStatus);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card key={shipment.contractNumber} className="hover:shadow-md transition-shadow cursor-pointer border-gray-200" onClick={() => openShipmentDetail(shipment)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    {/* 左侧：订单信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-blue-600">{shipment.contractNumber}</p>
                        <Badge className={`h-5 px-2 text-[10px] border ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      
                      <p className="text-[13px] text-gray-900 mb-1">{shipment.customerName}</p>
                      
                      <div className="flex items-center gap-4 text-[11px] text-gray-500">
                        <span>💰 {shipment.currency} {shipment.amount.toLocaleString()}</span>
                        <span>🚢 {shipment.portOfLoading} → {shipment.portOfDischarge}</span>
                      </div>
                    </div>

                    {/* 右侧：物流信息 */}
                    <div className="text-right">
                      {shipment.logistics.booking ? (
                        <>
                          <p className="text-[11px] text-gray-500 mb-1">
                            {shipment.logistics.booking.shippingLine} - {shipment.logistics.booking.vessel}
                          </p>
                          <p className="text-[11px] text-gray-900">
                            ETD: {shipment.logistics.booking.etd}
                          </p>
                          <p className="text-[11px] text-gray-900">
                            ETA: {shipment.logistics.booking.eta}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-gray-400">待订舱</p>
                      )}
                    </div>
                  </div>

                  {/* 底部：单证和物流进度 */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px]">
                      {/* 单证状态 */}
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-500">单证:</span>
                        {shipment.documents.commercialInvoice && (
                          <span className="text-emerald-600">CI✓</span>
                        )}
                        {shipment.documents.packingList && (
                          <span className="text-emerald-600 ml-1">PL✓</span>
                        )}
                        {shipment.documents.billOfLading && (
                          <span className="text-emerald-600 ml-1">B/L✓</span>
                        )}
                        {!shipment.documents.commercialInvoice && !shipment.documents.packingList && (
                          <span className="text-orange-600">待制作</span>
                        )}
                      </div>

                      {/* 报关状态 */}
                      {shipment.logistics.customs && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">|</span>
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-500">报关:</span>
                          <span className={shipment.logistics.customs.status === 'cleared' ? 'text-emerald-600' : 'text-orange-600'}>
                            {shipment.logistics.customs.status === 'cleared' ? '已放行' : '待放行'}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" size="sm" className="h-6 text-[11px] text-blue-600 hover:text-blue-700">
                      查看详情 →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>共 {mockShipments.length} 个发货订单</span>
        <div className="flex items-center gap-4">
          <span>准备中: {mockShipments.filter(s => s.tracking.currentStatus === 'preparing').length}</span>
          <span>在途: {mockShipments.filter(s => s.tracking.currentStatus === 'in_transit').length}</span>
          <span>已到港: {mockShipments.filter(s => s.tracking.currentStatus === 'arrived').length}</span>
        </div>
      </div>
    </div>
  );
}

// 发货详情组件（包含4个标签页）
function ShipmentDetail({ shipment, onBack }: { shipment: ShipmentInfo; onBack: () => void }) {
  const statusConfig = getStatusConfig(shipment.tracking.currentStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-3 p-4" style={{ 
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* 头部：返回按钮和基本信息 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 transition-none">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900">{shipment.contractNumber}</h2>
            <Badge className={`h-6 px-2 text-[11px] border ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">{shipment.customerName}</p>
        </div>
      </div>

      {/* 订单概览卡片 */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-[11px]">
            <div>
              <p className="text-gray-500 mb-1">订单金额</p>
              <p className="font-bold text-gray-900">{shipment.currency} {shipment.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">装运港</p>
              <p className="text-gray-900">{shipment.portOfLoading}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">目的港</p>
              <p className="text-gray-900">{shipment.portOfDischarge}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">发货进度</p>
              <p className="text-gray-900">
                {shipment.tracking.currentStatus === 'preparing' && '10%'}
                {shipment.tracking.currentStatus === 'shipped' && '40%'}
                {shipment.tracking.currentStatus === 'in_transit' && '60%'}
                {shipment.tracking.currentStatus === 'arrived' && '80%'}
                {shipment.tracking.currentStatus === 'cleared' && '90%'}
                {shipment.tracking.currentStatus === 'delivered' && '100%'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 标签页内容 - 性能优化：forceMount保持DOM常驻 */}
      <Tabs defaultValue="logistics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100">
          <TabsTrigger value="logistics" className="text-[11px]">
            <Truck className="w-3 h-3 mr-1" />
            物流安排
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-[11px]">
            <FileText className="w-3 h-3 mr-1" />
            单证制作
          </TabsTrigger>
          <TabsTrigger value="tracking" className="text-[11px]">
            <MapPin className="w-3 h-3 mr-1" />
            货柜跟踪
          </TabsTrigger>
          <TabsTrigger value="delivery" className="text-[11px]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            交付确认
          </TabsTrigger>
        </TabsList>

        {/* 物流安排 - 强制保持挂载 */}
        <TabsContent value="logistics" className="space-y-3 mt-3" forceMount>
          <LogisticsTab shipment={shipment} />
        </TabsContent>

        {/* 单证制作 - 强制保持挂载 */}
        <TabsContent value="documents" className="space-y-3 mt-3" forceMount>
          <DocumentsTab shipment={shipment} />
        </TabsContent>

        {/* 货柜跟踪 - 强制保持挂载 */}
        <TabsContent value="tracking" className="space-y-3 mt-3" forceMount>
          <TrackingTab shipment={shipment} />
        </TabsContent>

        {/* 交付确认 - 强制保持挂载 */}
        <TabsContent value="delivery" className="space-y-3 mt-3" forceMount>
          <DeliveryTab shipment={shipment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 物流安排标签页
function LogisticsTab({ shipment }: { shipment: ShipmentInfo }) {
  return (
    <div className="space-y-3">
      {/* 货代信息 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-600" />
            货代信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">货代公司</Label>
              <Input 
                value={shipment.logistics.forwarder?.company || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入货代公司名称"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">联系人</Label>
              <Input 
                value={shipment.logistics.forwarder?.contact || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入联系人"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">电话</Label>
              <Input 
                value={shipment.logistics.forwarder?.phone || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入电话"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input 
                value={shipment.logistics.forwarder?.email || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入邮箱"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订舱信息 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <Ship className="w-4 h-4 text-gray-600" />
            订舱信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">订舱日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.bookingDate || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">船公司</Label>
              <Input 
                value={shipment.logistics.booking?.shippingLine || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="MAERSK, MSC, COSCO..."
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">船名</Label>
              <Input 
                value={shipment.logistics.booking?.vessel || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入船名"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">航次</Label>
              <Input 
                value={shipment.logistics.booking?.voyage || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="V.2025-12"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">柜型</Label>
              <Select value={shipment.logistics.booking?.containerType || ''}>
                <SelectTrigger className="h-8 text-[11px] mt-1 border-gray-300">
                  <SelectValue placeholder="选择柜型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20GP" style={{ fontSize: '11px' }}>20GP</SelectItem>
                  <SelectItem value="40GP" style={{ fontSize: '11px' }}>40GP</SelectItem>
                  <SelectItem value="40HQ" style={{ fontSize: '11px' }}>40HQ</SelectItem>
                  <SelectItem value="45HQ" style={{ fontSize: '11px' }}>45HQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">柜量</Label>
              <Input 
                type="number"
                value={shipment.logistics.booking?.containerQty || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="1"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">ETD（预计开船）</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.etd || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">ETA（预计到港）</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.eta || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 拖车信息 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-600" />
            拖车信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">拖车公司</Label>
              <Input 
                value={shipment.logistics.trucking?.company || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入拖车公司"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">提柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.pickupDate || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">装柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.loadingDate || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">还柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.returnDate || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">柜号 Container No.</Label>
              <Input 
                value={shipment.logistics.trucking?.containerNo || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300 font-mono"
                placeholder="MAEU1234567"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">封条号 Seal No.</Label>
              <Input 
                value={shipment.logistics.trucking?.sealNo || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300 font-mono"
                placeholder="SEAL789012"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 报关信息 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-gray-600" />
            报关信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">报关行</Label>
              <Input 
                value={shipment.logistics.customs?.broker || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
                placeholder="请输入报关行名称"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">报关单号</Label>
              <Input 
                value={shipment.logistics.customs?.declarationNo || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300 font-mono"
                placeholder="523012345678"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">报关日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.customs?.declarationDate || ''} 
                className="h-8 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">报关状态</Label>
              <Select value={shipment.logistics.customs?.status || 'pending'}>
                <SelectTrigger className="h-8 text-[11px] mt-1 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" style={{ fontSize: '11px' }}>待放行</SelectItem>
                  <SelectItem value="cleared" style={{ fontSize: '11px' }}>已放行</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500 mb-2 block">报关资料</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-[11px]">
                <Upload className="w-3 h-3 mr-1" />
                上传文件
              </Button>
              <span className="text-[11px] text-gray-500 leading-8">支持 PDF, JPG, PNG 格式</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-8 text-[11px]">
          取消
        </Button>
        <Button size="sm" className="h-8 text-[11px] bg-[#F96302] hover:bg-[#E55A02]">
          保存物流信息
        </Button>
      </div>
    </div>
  );
}

// 单证制作标签页
function DocumentsTab({ shipment }: { shipment: ShipmentInfo }) {
  return (
    <div className="space-y-3">
      {/* 商业发票 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              商业发票 Commercial Invoice
            </span>
            {shipment.documents.commercialInvoice && (
              <Badge className="h-5 px-2 text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ 已开
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.documents.commercialInvoice ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-gray-500 mb-1">发票号</p>
                  <p className="text-gray-900 font-mono">{shipment.documents.commercialInvoice.documentNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">开票日期</p>
                  <p className="text-gray-900">{shipment.documents.commercialInvoice.issueDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">状态</p>
                  <Badge className="h-5 px-2 text-[10px] border bg-blue-50 text-blue-700 border-blue-200">
                    {shipment.documents.commercialInvoice.status === 'issued' && '已开'}
                    {shipment.documents.commercialInvoice.status === 'paid' && '已付'}
                    {shipment.documents.commercialInvoice.status === 'draft' && '草稿'}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <FileText className="w-3 h-3 mr-1" />
                  预览
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Download className="w-3 h-3 mr-1" />
                  下载
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Mail className="w-3 h-3 mr-1" />
                  发送客户
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[11px] text-gray-400 mb-3">尚未开具商业发票</p>
              <Button size="sm" className="h-7 text-[11px] bg-[#F96302] hover:bg-[#E55A02]">
                <FileText className="w-3 h-3 mr-1" />
                开具发票
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 装箱清单 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-600" />
              装箱清单 Packing List
            </span>
            {shipment.documents.packingList && (
              <Badge className="h-5 px-2 text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200">
                ✓ 已完成
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.documents.packingList ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-gray-500 mb-1">清单号</p>
                  <p className="text-gray-900 font-mono">{shipment.documents.packingList.documentNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">制作日期</p>
                  <p className="text-gray-900">{shipment.documents.packingList.issueDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">状态</p>
                  <Badge className="h-5 px-2 text-[10px] border bg-blue-50 text-blue-700 border-blue-200">
                    {shipment.documents.packingList.status === 'completed' && '已完成'}
                    {shipment.documents.packingList.status === 'draft' && '草稿'}
                  </Badge>
                </div>
              </div>
              
              {/* 显示从物流自动带入的信息 */}
              {shipment.logistics.trucking && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-2">
                  <p className="text-[11px] text-blue-700 font-medium mb-2">✓ 物流信息已自动带入：</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-blue-600">柜号:</span>
                      <span className="text-blue-900 ml-2 font-mono">{shipment.logistics.trucking.containerNo}</span>
                    </div>
                    <div>
                      <span className="text-blue-600">封条号:</span>
                      <span className="text-blue-900 ml-2 font-mono">{shipment.logistics.trucking.sealNo}</span>
                    </div>
                    {shipment.logistics.booking && (
                      <>
                        <div>
                          <span className="text-blue-600">船名:</span>
                          <span className="text-blue-900 ml-2">{shipment.logistics.booking.vessel}</span>
                        </div>
                        <div>
                          <span className="text-blue-600">航次:</span>
                          <span className="text-blue-900 ml-2">{shipment.logistics.booking.voyage}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <FileText className="w-3 h-3 mr-1" />
                  预览
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Download className="w-3 h-3 mr-1" />
                  下载
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Mail className="w-3 h-3 mr-1" />
                  发送客户
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[11px] text-gray-400 mb-3">尚未制作装箱清单</p>
              {shipment.logistics.trucking ? (
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-3 text-[11px] text-green-700">
                  ✓ 物流信息已完善，可以制作装箱清单
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3 text-[11px] text-orange-700">
                  ⚠ 请先在"物流安排"中填写柜号、封条号等信息
                </div>
              )}
              <Button 
                size="sm" 
                className="h-7 text-[11px] bg-[#F96302] hover:bg-[#E55A02]"
                disabled={!shipment.logistics.trucking}
              >
                <Package className="w-3 h-3 mr-1" />
                制作装箱清单
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 提单 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-purple-600" />
              提单 Bill of Lading
            </span>
            {shipment.documents.billOfLading && (
              <Badge className="h-5 px-2 text-[10px] border bg-blue-50 text-blue-700 border-blue-200">
                ✓ 已签发
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.documents.billOfLading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div>
                  <p className="text-gray-500 mb-1">提单号</p>
                  <p className="text-gray-900 font-mono">{shipment.documents.billOfLading.blNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">提单类型</p>
                  <p className="text-gray-900">
                    {shipment.documents.billOfLading.type === 'original' && '正本'}
                    {shipment.documents.billOfLading.type === 'seaway' && '电放'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">签发日期</p>
                  <p className="text-gray-900">{shipment.documents.billOfLading.issueDate}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <FileText className="w-3 h-3 mr-1" />
                  预览
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Download className="w-3 h-3 mr-1" />
                  下载
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]">
                  <Mail className="w-3 h-3 mr-1" />
                  发送客户
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[11px] text-gray-400 mb-2">提单由货代/船公司签发</p>
              <p className="text-[10px] text-gray-400 mb-3">开船后，货代会提供提单扫描件</p>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">提单号</Label>
                    <Input 
                      className="h-7 text-[11px] mt-1 border-gray-300 font-mono"
                      placeholder="输入提单号"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">提单类型</Label>
                    <Select>
                      <SelectTrigger className="h-7 text-[11px] mt-1 border-gray-300">
                        <SelectValue placeholder="选择类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original" style={{ fontSize: '11px' }}>正本</SelectItem>
                        <SelectItem value="seaway" style={{ fontSize: '11px' }}>电放</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[11px] w-full">
                  <Upload className="w-3 h-3 mr-1" />
                  上传提单扫描件
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 清关文件包 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px] flex items-center gap-2 text-blue-900">
            <Package className="w-4 h-4" />
            清关文件包
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-[11px]">
              <div className="flex items-center gap-1">
                {shipment.documents.commercialInvoice ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-blue-900">销售合同(SC)</span>
              </div>
              <div className="flex items-center gap-1">
                {shipment.documents.commercialInvoice ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-blue-900">商业发票(CI)</span>
              </div>
              <div className="flex items-center gap-1">
                {shipment.documents.packingList ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-blue-900">装箱清单(PL)</span>
              </div>
              <div className="flex items-center gap-1">
                {shipment.documents.billOfLading ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                )}
                <span className="text-blue-900">提单(B/L)</span>
              </div>
            </div>
            
            {shipment.documents.commercialInvoice && 
             shipment.documents.packingList && 
             shipment.documents.billOfLading ? (
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white flex-1">
                  <Download className="w-3 h-3 mr-1" />
                  下载清关包（ZIP）
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px] flex-1 border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Mail className="w-3 h-3 mr-1" />
                  发送清关包给客户
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-blue-700 text-center">
                ⚠ 请先完成所有单证制作
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 货柜跟踪标签页
function TrackingTab({ shipment }: { shipment: ShipmentInfo }) {
  const statusConfig = getStatusConfig(shipment.tracking.currentStatus);
  
  return (
    <div className="space-y-3">
      {/* 当前状态 */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 mb-1">当前状态</p>
              <Badge className={`h-7 px-3 text-[13px] border ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>
            {shipment.logistics.booking && (
              <div className="text-right">
                <p className="text-[11px] text-gray-500">预计到港</p>
                <p className="text-[15px] font-bold text-gray-900">{shipment.logistics.booking.eta}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 时间线 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">物流时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipment.tracking.timeline.map((event, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                  {index < shipment.tracking.timeline.length - 1 && (
                    <div className="w-px h-full bg-gray-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-[11px] text-gray-500">{event.date}</p>
                  <p className="text-[13px] font-medium text-gray-900">{event.status}</p>
                  <p className="text-[11px] text-gray-600">{event.location}</p>
                  {event.note && (
                    <p className="text-[11px] text-gray-500 mt-1">{event.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 添加跟踪记录 */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">添加跟踪记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">日期</Label>
              <Input 
                type="date"
                className="h-7 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">位置</Label>
              <Input 
                className="h-7 text-[11px] mt-1 border-gray-300"
                placeholder="请输入位置"
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">状态/备注</Label>
            <Textarea 
              className="text-[11px] mt-1 border-gray-300 min-h-[60px]"
              placeholder="请输入状态更新或备注信息"
            />
          </div>
          <Button size="sm" className="h-7 text-[11px] bg-[#F96302] hover:bg-[#E55A02]">
            添加记录
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// 交付确认标签页
function DeliveryTab({ shipment }: { shipment: ShipmentInfo }) {
  return (
    <div className="space-y-3">
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">客户清关与提货</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500">清关日期</Label>
              <Input 
                type="date"
                value={shipment.delivery?.customsClearanceDate || ''}
                className="h-7 text-[11px] mt-1 border-gray-300"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">提货日期</Label>
              <Input 
                type="date"
                value={shipment.delivery?.pickupDate || ''}
                className="h-7 text-[11px] mt-1 border-gray-300"
              />
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <Label className="text-[11px] text-gray-500 flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                checked={shipment.delivery?.customerConfirmation || false}
                className="w-4 h-4"
              />
              客户已确认收货
            </Label>
          </div>

          {shipment.delivery?.customerConfirmation ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-emerald-900">订单已完成交付</p>
              <p className="text-[11px] text-emerald-700 mt-1">客户已确认收货，订单流程结束</p>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded p-3 text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-orange-900">等待客户确认收货</p>
              <p className="text-[11px] text-orange-700 mt-1">请联系客户确认是否已提货</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" className="h-7 text-[11px]">
              取消
            </Button>
            <Button size="sm" className="h-7 text-[11px] bg-[#F96302] hover:bg-[#E55A02]">
              保存交付信息
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 辅助函数：获取状态配置
function getStatusConfig(status: string) {
  const configs = {
    preparing: { label: '准备中', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Package },
    shipped: { label: '已装船', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Ship },
    in_transit: { label: '在途', color: 'bg-cyan-50 text-cyan-700 border-cyan-200', icon: Ship },
    arrived: { label: '已到港', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Anchor },
    cleared: { label: '已清关', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FileCheck },
    delivered: { label: '已交付', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
  };
  return configs[status as keyof typeof configs] || configs.preparing;
}