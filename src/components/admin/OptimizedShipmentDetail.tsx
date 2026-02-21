import React, { useState, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, Ship, Package, Anchor, CheckCircle2, Building2, 
  Truck, FileText, MapPin, Calendar, DollarSign, User, Mail, 
  Phone, MapPinned, Box, Clock, AlertCircle, Download, Plus,
  Edit, Trash2, Upload, FileDown, CheckSquare, XSquare, FileCheck
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import { Toaster } from '../ui/sonner';

interface ShipmentInfo {
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  currency: string;
  portOfLoading: string;
  portOfDischarge: string;
  tracking: {
    currentStatus: string;
    timeline: Array<{
      date: string;
      status: string;
      location: string;
      note?: string;
    }>;
  };
  logistics: {
    forwarder?: { company: string; contact: string; phone: string; email: string };
    booking?: { 
      bookingDate?: string;
      shippingLine: string; 
      vessel: string; 
      voyage: string; 
      containerType?: string;
      containerQty?: number;
      containerType2?: string;
      containerQty2?: number;
      containerType3?: string;
      containerQty3?: number;
      etd: string; 
      eta: string; 
    };
    trucking?: {
      company?: string;
      pickupDate?: string;
      loadingDate?: string;
      returnDate?: string;
      containerNo?: string;
      sealNo?: string;
    };
    customs?: {
      broker?: string;
      declarationNo?: string;
      declarationDate?: string;
      status?: string;
      files?: Array<{ name: string; size: number; type: string; uploadDate: string }>; // 🔥 添加文件信息存储
    };
  };
  documents: {
    commercialInvoice?: {
      documentNumber: string;
      issueDate: string;
      status: string;
    } | null;
    packingList?: {
      documentNumber: string;
      issueDate: string;
      status: string;
    } | null;
    billOfLading?: {
      blNumber: string;
      type: string;
      issueDate: string;
    } | null;
  };
  delivery?: {
    status: 'pending' | 'delivered';
    deliveryDate?: string;
    receivedBy?: string;
    podNumber?: string;
    notes?: string;
    podFiles?: Array<{ name: string; size: number; type: string; uploadDate: string }>;
  };
  items: any[];
}

interface OptimizedShipmentDetailProps {
  shipment: ShipmentInfo;
  onBack: () => void;
}

// 状态配置
const getStatusConfig = (status: string) => {
  const configs: { [key: string]: { label: string; color: string; icon: any } } = {
    preparing: { label: '准备中', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Package },
    shipped: { label: '已装船', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Ship },
    in_transit: { label: '在途', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', icon: Ship },
    arrived: { label: '已到港', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Anchor },
    cleared: { label: '已清关', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Building2 },
    delivered: { label: '已交付', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 }
  };
  return configs[status] || configs.preparing;
};

export function OptimizedShipmentDetail({ shipment, onBack }: OptimizedShipmentDetailProps) {
  const [activeTab, setActiveTab] = useState<'logistics' | 'documents' | 'tracking' | 'delivery'>('logistics');
  
  // 🔥 添加可编辑状态管理
  const [editableData, setEditableData] = useState<ShipmentInfo>(shipment);
  
  const statusConfig = useMemo(() => getStatusConfig(editableData.tracking.currentStatus), [editableData.tracking.currentStatus]);
  const StatusIcon = statusConfig.icon;
  
  const progressPercentage = useMemo(() => {
    const statusMap: Record<string, string> = {
      preparing: '10%',
      shipped: '40%',
      in_transit: '60%',
      arrived: '80%',
      cleared: '90%',
      delivered: '100%'
    };
    return statusMap[editableData.tracking.currentStatus] || '0%';
  }, [editableData.tracking.currentStatus]);

  // 优化的tab切换
  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
  }, []);

  // 🔥 更新数据的回调函数 - 修复深度合并问题
  const updateData = useCallback((updates: Partial<ShipmentInfo>) => {
    setEditableData(prev => {
      // 深度合并 logistics 对象
      if (updates.logistics) {
        return {
          ...prev,
          logistics: {
            ...prev.logistics,
            forwarder: updates.logistics.forwarder 
              ? { ...prev.logistics.forwarder, ...updates.logistics.forwarder } 
              : prev.logistics.forwarder,
            booking: updates.logistics.booking 
              ? { ...prev.logistics.booking, ...updates.logistics.booking } 
              : prev.logistics.booking,
            trucking: updates.logistics.trucking 
              ? { ...prev.logistics.trucking, ...updates.logistics.trucking } 
              : prev.logistics.trucking,
            customs: updates.logistics.customs 
              ? { ...prev.logistics.customs, ...updates.logistics.customs } 
              : prev.logistics.customs,
          }
        };
      }
      return {
        ...prev,
        ...updates
      };
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Toast 通知容器 */}
      <Toaster position="top-right" />
      
      {/* 头部 */}
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="h-8"
          style={{ transition: 'none' }}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900" style={{ fontSize: '16px', fontWeight: 600 }}>
              {editableData.contractNumber}
            </h2>
            <Badge className={`h-6 px-2 text-[11px] border ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{editableData.customerName}</p>
        </div>
      </div>

      {/* 订单概览 */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-gray-500 mb-1">订单金额</p>
              <p className="font-bold text-gray-900">{editableData.currency} {editableData.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">装运港</p>
              <p className="text-gray-900">{editableData.portOfLoading}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">目的港</p>
              <p className="text-gray-900">{editableData.portOfDischarge}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">发货进度</p>
              <p className="text-gray-900">{progressPercentage}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 自定义标签页 - 完全避免 Radix UI */}
      <div className="bg-white border-2 border-gray-200 rounded">
        {/* Tab 头部 */}
        <div className="grid grid-cols-4 bg-gray-100">
          <button
            onClick={() => handleTabChange('logistics')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium ${
              activeTab === 'logistics'
                ? 'bg-white text-gray-900 border-b-2 border-[#F96302]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ transition: 'none' }}
          >
            <Truck className="w-3.5 h-3.5" />
            物流安排
          </button>
          <button
            onClick={() => handleTabChange('documents')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium ${
              activeTab === 'documents'
                ? 'bg-white text-gray-900 border-b-2 border-[#F96302]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ transition: 'none' }}
          >
            <FileText className="w-3.5 h-3.5" />
            单证制作
          </button>
          <button
            onClick={() => handleTabChange('tracking')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium ${
              activeTab === 'tracking'
                ? 'bg-white text-gray-900 border-b-2 border-[#F96302]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ transition: 'none' }}
          >
            <MapPin className="w-3.5 h-3.5" />
            货柜跟踪
          </button>
          <button
            onClick={() => handleTabChange('delivery')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium ${
              activeTab === 'delivery'
                ? 'bg-white text-gray-900 border-b-2 border-[#F96302]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            style={{ transition: 'none' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            交付确认
          </button>
        </div>

        {/* Tab 内容 - 使用 display:none 而非条件渲染 */}
        <div className="p-4">
          <div style={{ display: activeTab === 'logistics' ? 'block' : 'none' }}>
            <LogisticsContent shipment={editableData} updateData={updateData} />
          </div>
          <div style={{ display: activeTab === 'documents' ? 'block' : 'none' }}>
            <DocumentsContent shipment={editableData} updateData={updateData} />
          </div>
          <div style={{ display: activeTab === 'tracking' ? 'block' : 'none' }}>
            <TrackingContent shipment={editableData} updateData={updateData} />
          </div>
          <div style={{ display: activeTab === 'delivery' ? 'block' : 'none' }}>
            <DeliveryContent shipment={editableData} updateData={updateData} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== 物流安排标签页 ==========
const LogisticsContent = React.memo(({ shipment, updateData }: { shipment: ShipmentInfo; updateData: (updates: Partial<ShipmentInfo>) => void }) => {
  // 🔥 从 shipment.logistics.customs.files 初始化已保存的文件信息
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; type: string; uploadDate: string }>>(() => {
    return shipment.logistics.customs?.files || [];
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
      toast.success(`已选择 ${newFiles.length} 个文件`, {
        duration: 2000,
      });
    }
  };

  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // 保存物流信息
  const handleSaveLogistics = () => {
    // 验证必填字段
    const hasForwarder = shipment.logistics.forwarder?.company;
    const hasBooking = shipment.logistics.booking?.shippingLine;
    
    if (!hasForwarder && !hasBooking) {
      toast.error('请至少填写货代信息或订舱信息', {
        duration: 3000,
      });
      return;
    }

    // 🔥 将文件信息保存到 shipment.logistics.customs.files
    updateData({
      logistics: {
        customs: {
          ...shipment.logistics.customs,
          files: uploadedFiles
        }
      }
    });

    // 这里可以调用API保存数据
    console.log('保存物流信息:', shipment.logistics);
    console.log('保存的文件信息:', uploadedFiles);
    
    toast.success('物流信息已保存成功！', {
      duration: 2000,
    });
  };

  return (
    <div className="space-y-3">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* 货代信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-600" />
            货代信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">货代公司</Label>
              <Input 
                value={shipment.logistics.forwarder?.company || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入货代公司名称"
                onChange={(e) => updateData({ logistics: { forwarder: { ...shipment.logistics.forwarder, company: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">联系人</Label>
              <Input 
                value={shipment.logistics.forwarder?.contact || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入联系人"
                onChange={(e) => updateData({ logistics: { forwarder: { ...shipment.logistics.forwarder, contact: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">电话</Label>
              <Input 
                value={shipment.logistics.forwarder?.phone || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入电话"
                onChange={(e) => updateData({ logistics: { forwarder: { ...shipment.logistics.forwarder, phone: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">邮箱</Label>
              <Input 
                value={shipment.logistics.forwarder?.email || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入邮箱"
                onChange={(e) => updateData({ logistics: { forwarder: { ...shipment.logistics.forwarder, email: e.target.value } } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 订舱信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Ship className="w-4 h-4 text-gray-600" />
            订舱信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-500">订舱日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.bookingDate || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, bookingDate: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">船公司</Label>
              <Input 
                value={shipment.logistics.booking?.shippingLine || ''} 
                className="h-8 text-xs mt-1"
                placeholder="MAERSK, MSC, COSCO..."
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, shippingLine: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">船名</Label>
              <Input 
                value={shipment.logistics.booking?.vessel || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入船名"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, vessel: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">航次</Label>
              <Input 
                value={shipment.logistics.booking?.voyage || ''} 
                className="h-8 text-xs mt-1"
                placeholder="V.2025-12"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, voyage: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜型</Label>
              <Select 
                value={shipment.logistics.booking?.containerType || ''}
                onValueChange={(value) => updateData({ logistics: { ...shipment.logistics, booking: { ...shipment.logistics.booking, containerType: value } } })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="选择柜型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20GP" style={{ fontSize: '12px' }}>20GP</SelectItem>
                  <SelectItem value="20HV" style={{ fontSize: '12px' }}>20HV</SelectItem>
                  <SelectItem value="40GP" style={{ fontSize: '12px' }}>40GP</SelectItem>
                  <SelectItem value="40HQ" style={{ fontSize: '12px' }}>40HQ</SelectItem>
                  <SelectItem value="45HQ" style={{ fontSize: '12px' }}>45HQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜量</Label>
              <Input 
                type="number"
                value={shipment.logistics.booking?.containerQty || ''} 
                className="h-8 text-xs mt-1"
                placeholder="1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, containerQty: parseInt(e.target.value) } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜型2（可选）</Label>
              <Select 
                value={shipment.logistics.booking?.containerType2 || ''}
                onValueChange={(value) => updateData({ logistics: { ...shipment.logistics, booking: { ...shipment.logistics.booking, containerType2: value } } })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="选择柜型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20GP" style={{ fontSize: '12px' }}>20GP</SelectItem>
                  <SelectItem value="20HV" style={{ fontSize: '12px' }}>20HV</SelectItem>
                  <SelectItem value="40GP" style={{ fontSize: '12px' }}>40GP</SelectItem>
                  <SelectItem value="40HQ" style={{ fontSize: '12px' }}>40HQ</SelectItem>
                  <SelectItem value="45HQ" style={{ fontSize: '12px' }}>45HQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜量2（可选）</Label>
              <Input 
                type="number"
                value={shipment.logistics.booking?.containerQty2 || ''} 
                className="h-8 text-xs mt-1"
                placeholder="1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, containerQty2: parseInt(e.target.value) } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜型3（可选）</Label>
              <Select 
                value={shipment.logistics.booking?.containerType3 || ''}
                onValueChange={(value) => updateData({ logistics: { ...shipment.logistics, booking: { ...shipment.logistics.booking, containerType3: value } } })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue placeholder="选择柜型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20GP" style={{ fontSize: '12px' }}>20GP</SelectItem>
                  <SelectItem value="20HV" style={{ fontSize: '12px' }}>20HV</SelectItem>
                  <SelectItem value="40GP" style={{ fontSize: '12px' }}>40GP</SelectItem>
                  <SelectItem value="40HQ" style={{ fontSize: '12px' }}>40HQ</SelectItem>
                  <SelectItem value="45HQ" style={{ fontSize: '12px' }}>45HQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜量3（可选）</Label>
              <Input 
                type="number"
                value={shipment.logistics.booking?.containerQty3 || ''} 
                className="h-8 text-xs mt-1"
                placeholder="1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, containerQty3: parseInt(e.target.value) } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">ETD（预计开船）</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.etd || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, etd: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">ETA（预计到港）</Label>
              <Input 
                type="date"
                value={shipment.logistics.booking?.eta || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { booking: { ...shipment.logistics.booking, eta: e.target.value } } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 拖车信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-600" />
            拖车信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-500">拖车公司</Label>
              <Input 
                value={shipment.logistics.trucking?.company || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入拖车公司"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, company: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">提柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.pickupDate || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, pickupDate: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">装柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.loadingDate || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, loadingDate: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">还柜日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.trucking?.returnDate || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, returnDate: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">柜号 Container No.</Label>
              <Input 
                value={shipment.logistics.trucking?.containerNo || ''} 
                className="h-8 text-xs mt-1 font-mono"
                placeholder="MAEU1234567"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, containerNo: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">封条号 Seal No.</Label>
              <Input 
                value={shipment.logistics.trucking?.sealNo || ''} 
                className="h-8 text-xs mt-1 font-mono"
                placeholder="SEAL789012"
                onChange={(e) => updateData({ logistics: { trucking: { ...shipment.logistics.trucking, sealNo: e.target.value } } })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 报关信息 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-gray-600" />
            报关信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-500">报关行</Label>
              <Input 
                value={shipment.logistics.customs?.broker || ''} 
                className="h-8 text-xs mt-1"
                placeholder="请输入报关行名称"
                onChange={(e) => updateData({ logistics: { customs: { ...shipment.logistics.customs, broker: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">报关单号</Label>
              <Input 
                value={shipment.logistics.customs?.declarationNo || ''} 
                className="h-8 text-xs mt-1 font-mono"
                placeholder="523012345678"
                onChange={(e) => updateData({ logistics: { customs: { ...shipment.logistics.customs, declarationNo: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">报关日期</Label>
              <Input 
                type="date"
                value={shipment.logistics.customs?.declarationDate || ''} 
                className="h-8 text-xs mt-1"
                onChange={(e) => updateData({ logistics: { customs: { ...shipment.logistics.customs, declarationDate: e.target.value } } })}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">报关状态</Label>
              <Select 
                value={shipment.logistics.customs?.status || 'pending'}
                onValueChange={(value) => updateData({ logistics: { ...shipment.logistics, customs: { ...shipment.logistics.customs, status: value } } })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" style={{ fontSize: '12px' }}>待放行</SelectItem>
                  <SelectItem value="cleared" style={{ fontSize: '12px' }}>已放行</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-2 block">报关资料</Label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={triggerFileUpload}>
                <Upload className="w-3 h-3 mr-1" />
                上传文件
              </Button>
              <span className="text-xs text-gray-500 leading-8">支持 PDF, JPG, PNG 格式</span>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                    <FileText className="w-3 h-3" />
                    <span className="flex-1">{file.name}</span>
                    <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-5 w-5 p-0"
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="h-8 text-xs">
          取消
        </Button>
        <Button size="sm" className="h-8 text-xs bg-[#F96302] hover:bg-[#E55A02]" onClick={handleSaveLogistics}>
          保存物流信息
        </Button>
      </div>
    </div>
  );
});

// ========== 单证制作标签页 ==========
const DocumentsContent = React.memo(({ shipment, updateData }: { shipment: ShipmentInfo; updateData: (updates: Partial<ShipmentInfo>) => void }) => {
  // 🔥 处理函数
  const handleDownload = (docType: string, docNumber: string) => {
    toast.success(`正在下载 ${docType} (${docNumber})...`, {
      duration: 2000,
      description: '文档将保存到您的下载文件夹'
    });
    console.log(`下载文档: ${docType} - ${docNumber}`);
  };
  
  const handleSendToCustomer = (docType: string, docNumber: string) => {
    toast.success(`${docType} 已发送至 ${shipment.customerEmail}`, {
      duration: 3000,
      description: `文档编号: ${docNumber}`
    });
    console.log(`发送文档: ${docType} - ${docNumber} -> ${shipment.customerEmail}`);
  };
  
  const handlePreview = (docType: string, docNumber: string) => {
    toast.success(`正在打开 ${docType} 预览...`, {
      duration: 2000
    });
    console.log(`预览文档: ${docType} - ${docNumber}`);
  };
  
  const handleDownloadClearancePackage = () => {
    toast.success('正在打包清关文件...', {
      duration: 2000,
      description: '包含：SC、CI、PL、B/L'
    });
    setTimeout(() => {
      toast.success('清关包下载成功！', {
        duration: 2000,
        description: `文件名: ${shipment.contractNumber}_ClearanceDocs.zip`
      });
    }, 1000);
  };
  
  const handleSendClearancePackage = () => {
    toast.success(`清关文件包已发送至 ${shipment.customerEmail}`, {
      duration: 3000,
      description: '包含：SC、CI、PL、B/L'
    });
  };
  
  return (
  <div className="space-y-3">
    {/* 商业发票 */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
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
            <div className="grid grid-cols-3 gap-3 text-xs">
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
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handlePreview('商业发票', shipment.documents.commercialInvoice!.documentNumber)}
              >
                <FileText className="w-3 h-3 mr-1" />
                预览
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleDownload('商业发票', shipment.documents.commercialInvoice!.documentNumber)}
              >
                <Download className="w-3 h-3 mr-1" />
                下载
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleSendToCustomer('商业发票', shipment.documents.commercialInvoice!.documentNumber)}
              >
                <Mail className="w-3 h-3 mr-1" />
                发送客户
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 mb-3">尚未开具商业发票</p>
            <Button size="sm" className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]">
              <FileText className="w-3 h-3 mr-1" />
              开具发票
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    {/* 装箱清单 */}
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
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
            <div className="grid grid-cols-3 gap-3 text-xs">
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
                <p className="text-xs text-blue-700 font-medium mb-2">✓ 物流信息已自动带入：</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
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
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handlePreview('装箱清单', shipment.documents.packingList!.documentNumber)}
              >
                <FileText className="w-3 h-3 mr-1" />
                预览
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleDownload('装箱清单', shipment.documents.packingList!.documentNumber)}
              >
                <Download className="w-3 h-3 mr-1" />
                下载
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleSendToCustomer('装箱清单', shipment.documents.packingList!.documentNumber)}
              >
                <Mail className="w-3 h-3 mr-1" />
                发送客户
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 mb-3">尚未制作装箱清单</p>
            {shipment.logistics.trucking ? (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-3 text-xs text-green-700">
                ✓ 物流信息已完善，可以制作装箱清单
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3 text-xs text-orange-700">
                ⚠ 请先在"物流安排"中填写柜号、封条号等信息
              </div>
            )}
            <Button 
              size="sm" 
              className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]"
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
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
            <div className="grid grid-cols-3 gap-3 text-xs">
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
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handlePreview('提单', shipment.documents.billOfLading!.blNumber)}
              >
                <FileText className="w-3 h-3 mr-1" />
                预览
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleDownload('提单', shipment.documents.billOfLading!.blNumber)}
              >
                <Download className="w-3 h-3 mr-1" />
                下载
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs"
                onClick={() => handleSendToCustomer('提单', shipment.documents.billOfLading!.blNumber)}
              >
                <Mail className="w-3 h-3 mr-1" />
                发送客户
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-400 mb-2">提单由货代/船公司签发</p>
            <p className="text-[10px] text-gray-400 mb-3">开船后，货代会提供提单扫描件</p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">提单号</Label>
                  <Input 
                    className="h-7 text-xs mt-1 font-mono"
                    placeholder="输入提单号"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">提单类型</Label>
                  <Select>
                    <SelectTrigger className="h-7 text-xs mt-1">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original" style={{ fontSize: '12px' }}>正本</SelectItem>
                      <SelectItem value="seaway" style={{ fontSize: '12px' }}>电放</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-xs w-full">
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
        <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
          <Package className="w-4 h-4" />
          清关文件包
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 text-xs">
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
              <Button 
                size="sm" 
                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1"
                onClick={handleDownloadClearancePackage}
              >
                <Download className="w-3 h-3 mr-1" />
                下载清关包（ZIP）
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs flex-1 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={handleSendClearancePackage}
              >
                <Mail className="w-3 h-3 mr-1" />
                发送清关包给客户
              </Button>
            </div>
          ) : (
            <p className="text-xs text-blue-700 text-center">
              ⚠ 请先完成所有单证制作
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
  );
});

// ========== 货柜跟踪标签页 ==========
const TrackingContent = React.memo(({ shipment, updateData }: { shipment: ShipmentInfo; updateData: (updates: Partial<ShipmentInfo>) => void }) => {
  const statusConfig = useMemo(() => getStatusConfig(shipment.tracking.currentStatus), [shipment.tracking.currentStatus]);
  
  // 🔥 添加跟踪记录表单状态
  const [newRecord, setNewRecord] = useState({
    date: '',
    location: '',
    status: '',
    note: ''
  });
  
  // 添加跟踪记录
  const handleAddRecord = () => {
    if (!newRecord.date || !newRecord.location || !newRecord.status) {
      toast.error('请填写日期、位置和状态描述', {
        duration: 3000,
      });
      return;
    }
    
    const newTimeline = [
      {
        date: newRecord.date,
        location: newRecord.location,
        status: newRecord.status,
        note: newRecord.note
      },
      ...(shipment.tracking.timeline || [])
    ];
    
    updateData({
      tracking: {
        ...shipment.tracking,
        timeline: newTimeline
      }
    });
    
    // 清空表单
    setNewRecord({ date: '', location: '', status: '', note: '' });
    
    toast.success('跟踪记录已添加！', {
      duration: 2000,
    });
  };
  
  // 删除跟踪记录
  const handleDeleteRecord = (index: number) => {
    const newTimeline = shipment.tracking.timeline.filter((_, i) => i !== index);
    
    updateData({
      tracking: {
        ...shipment.tracking,
        timeline: newTimeline
      }
    });
    
    toast.success('记录已删除', {
      duration: 2000,
    });
  };
  
  return (
    <div className="space-y-3">
      {/* 当前状态 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">当前状态</p>
              <Badge className={`h-7 px-3 text-xs border ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>
            {shipment.logistics.booking && (
              <div className="text-right">
                <p className="text-xs text-gray-500">预计到港</p>
                <p className="text-base font-bold text-gray-900">{shipment.logistics.booking.eta}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 时间线 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">物流时间线</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shipment.tracking.timeline && shipment.tracking.timeline.length > 0 ? (
              shipment.tracking.timeline.map((event: any, index: number) => (
                <div key={`${event.date}-${event.status}-${index}`} className="flex gap-3 group">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    {index < shipment.tracking.timeline.length - 1 && (
                      <div className="w-px h-full bg-gray-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">{event.date}</p>
                        <p className="text-sm font-medium text-gray-900">{event.status}</p>
                        <p className="text-xs text-gray-600">{event.location}</p>
                        {event.note && (
                          <p className="text-xs text-gray-500 mt-1">{event.note}</p>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteRecord(index)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4 text-xs">暂无跟踪信息</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 添加跟踪记录 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">添加跟踪记录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">日期 *</Label>
              <Input 
                type="date"
                value={newRecord.date}
                className="h-7 text-xs mt-1"
                onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">位置 *</Label>
              <Input 
                value={newRecord.location}
                className="h-7 text-xs mt-1"
                placeholder="厦门港、上海港、洛杉矶港..."
                onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500">状态描述 *</Label>
            <Textarea 
              value={newRecord.status}
              className="text-xs mt-1"
              rows={2}
              placeholder="请输入状态描述，例如：货柜已装船、货柜已到港、清关中..."
              onChange={(e) => setNewRecord({...newRecord, status: e.target.value})}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">备注（选填）</Label>
            <Textarea 
              value={newRecord.note}
              className="text-xs mt-1"
              rows={2}
              placeholder="其他备注信息..."
              onChange={(e) => setNewRecord({...newRecord, note: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => setNewRecord({ date: '', location: '', status: '', note: '' })}
            >
              清空
            </Button>
            <Button 
              size="sm" 
              className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]"
              onClick={handleAddRecord}
            >
              <Plus className="w-3 h-3 mr-1" />
              添加记录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// ========== 交付确认标签页 ==========
const DeliveryContent = React.memo(({ shipment, updateData }: { shipment: ShipmentInfo; updateData: (updates: Partial<ShipmentInfo>) => void }) => {
  // 🔥 交付确认表单状态
  const [deliveryData, setDeliveryData] = useState({
    deliveryDate: '',
    receivedBy: '',
    podNumber: '',
    notes: ''
  });
  
  const [podFiles, setPodFiles] = useState<Array<{ name: string; size: number; type: string; uploadDate: string }>>(() => {
    return shipment.delivery?.podFiles || [];
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files).map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      }));
      setPodFiles(prev => [...prev, ...newFiles]);
      toast.success(`已选择 ${newFiles.length} 个文件`, {
        duration: 2000,
      });
    }
  };
  
  // 触发文件选择
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  // 确认交付
  const handleConfirmDelivery = () => {
    if (!deliveryData.deliveryDate || !deliveryData.receivedBy) {
      toast.error('请填写交付日期和接收人', {
        duration: 3000,
      });
      return;
    }
    
    updateData({
      delivery: {
        status: 'delivered',
        deliveryDate: deliveryData.deliveryDate,
        receivedBy: deliveryData.receivedBy,
        podNumber: deliveryData.podNumber,
        notes: deliveryData.notes,
        podFiles: podFiles
      },
      tracking: {
        ...shipment.tracking,
        currentStatus: 'delivered'
      }
    });
    
    toast.success('交付确认已保存！货物状态已更新为已交付', {
      duration: 3000,
    });
  };
  
  return (
    <div className="space-y-3">
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">交付确认</CardTitle>
        </CardHeader>
        <CardContent>
          {shipment.tracking.currentStatus === 'delivered' || shipment.delivery?.status === 'delivered' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 mb-3">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">货物已成功交付</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">交付日期</p>
                  <p className="text-gray-900">{shipment.delivery?.deliveryDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">接收人</p>
                  <p className="text-gray-900">{shipment.delivery?.receivedBy}</p>
                </div>
                {shipment.delivery?.podNumber && (
                  <div>
                    <p className="text-gray-500 mb-1">签收单号</p>
                    <p className="text-gray-900 font-mono">{shipment.delivery.podNumber}</p>
                  </div>
                )}
                {shipment.delivery?.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500 mb-1">备注</p>
                    <p className="text-gray-900">{shipment.delivery.notes}</p>
                  </div>
                )}
              </div>
              
              {shipment.delivery?.podFiles && shipment.delivery.podFiles.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">签收单附件</p>
                  <div className="space-y-1">
                    {shipment.delivery.podFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                        <FileText className="w-3 h-3" />
                        <span className="flex-1">{file.name}</span>
                        <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                          <Download className="w-3 h-3 text-blue-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
                <p className="text-xs text-orange-700">
                  ⚠ 请在货物实际交付后填写此表单，系统将自动更新发货状态为"已交付"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-500">交付日期 *</Label>
                  <Input 
                    type="date"
                    value={deliveryData.deliveryDate}
                    className="h-8 text-xs mt-1"
                    onChange={(e) => setDeliveryData({...deliveryData, deliveryDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">接收人 *</Label>
                  <Input 
                    value={deliveryData.receivedBy}
                    className="h-8 text-xs mt-1"
                    placeholder="请输入接收人姓名"
                    onChange={(e) => setDeliveryData({...deliveryData, receivedBy: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">签收单号（选填）</Label>
                  <Input 
                    value={deliveryData.podNumber}
                    className="h-8 text-xs mt-1 font-mono"
                    placeholder="POD-2025-XXXX"
                    onChange={(e) => setDeliveryData({...deliveryData, podNumber: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-500">备注（选填）</Label>
                <Textarea 
                  value={deliveryData.notes}
                  className="text-xs mt-1"
                  rows={2}
                  placeholder="其他交付相关信息..."
                  onChange={(e) => setDeliveryData({...deliveryData, notes: e.target.value})}
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">签收单附件</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={triggerFileUpload}>
                    <Upload className="w-3 h-3 mr-1" />
                    上传签收单
                  </Button>
                  <span className="text-xs text-gray-500 leading-8">支持 PDF, JPG, PNG 格式</span>
                </div>
                {podFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {podFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                        <FileText className="w-3 h-3" />
                        <span className="flex-1">{file.name}</span>
                        <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-5 w-5 p-0"
                          onClick={() => setPodFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  onClick={() => {
                    setDeliveryData({ deliveryDate: '', receivedBy: '', podNumber: '', notes: '' });
                    setPodFiles([]);
                  }}
                >
                  清空
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleConfirmDelivery}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  确认交付
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});