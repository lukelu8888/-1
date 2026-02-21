// 单证制作模块 - 完整可编辑版本
// 此代码将替换 OptimizedShipmentDetail.tsx 中的 DocumentsContent 组件

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FileText, Download, Mail, Package, Ship, CheckCircle2, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ShipmentInfo {
  contractNumber: string;
  customerName: string;
  customerEmail: string;
  logistics: {
    trucking?: {
      containerNo?: string;
      sealNo?: string;
    };
    booking?: {
      vessel: string;
      voyage: string;
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
}

const DocumentsContent = React.memo(({ shipment, updateData }: { shipment: ShipmentInfo; updateData: (updates: any) => void }) => {
  // 🔥 开具发票对话框状态
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    documentNumber: '',
    issueDate: '',
    status: 'issued'
  });
  
  // 🔥 制作装箱清单对话框状态
  const [showPackingListDialog, setShowPackingListDialog] = useState(false);
  const [packingListData, setPackingListData] = useState({
    documentNumber: '',
    issueDate: '',
    status: 'completed'
  });
  
  // 🔥 录入提单对话框状态
  const [showBLDialog, setShowBLDialog] = useState(false);
  const [blData, setBlData] = useState({
    blNumber: '',
    type: 'original',
    issueDate: ''
  });
  
  // 🔥 预览对话框
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ type: string; title: string; data: any } | null>(null);
  
  // 开具商业发票
  const handleCreateInvoice = () => {
    if (!invoiceData.documentNumber || !invoiceData.issueDate) {
      toast.error('请填写发票号和开票日期', { duration: 3000 });
      return;
    }
    
    updateData({
      documents: {
        ...shipment.documents,
        commercialInvoice: invoiceData
      }
    });
    
    setShowInvoiceDialog(false);
    toast.success('商业发票已开具成功！', { duration: 2000 });
  };
  
  // 制作装箱清单
  const handleCreatePackingList = () => {
    if (!packingListData.documentNumber || !packingListData.issueDate) {
      toast.error('请填写清单号和制作日期', { duration: 3000 });
      return;
    }
    
    updateData({
      documents: {
        ...shipment.documents,
        packingList: packingListData
      }
    });
    
    setShowPackingListDialog(false);
    toast.success('装箱清单已制作成功！', { duration: 2000 });
  };
  
  // 录入提单
  const handleCreateBL = () => {
    if (!blData.blNumber || !blData.issueDate) {
      toast.error('请填写提单号和签发日期', { duration: 3000 });
      return;
    }
    
    updateData({
      documents: {
        ...shipment.documents,
        billOfLading: blData
      }
    });
    
    setShowBLDialog(false);
    toast.success('提单信息已录入成功！', { duration: 2000 });
  };
  
  // 预览文档
  const handlePreview = (type: string, title: string, data: any) => {
    setPreviewDoc({ type, title, data });
    setShowPreviewDialog(true);
  };
  
  // 下载文档
  const handleDownload = (docType: string, docNumber: string) => {
    toast.success(`正在下载 ${docType} (${docNumber})...`, {
      duration: 2000,
      description: '文档将保存到您的下载文件夹'
    });
    console.log(`下载文档: ${docType} - ${docNumber}`);
  };
  
  // 发送给客户
  const handleSendToCustomer = (docType: string, docNumber: string) => {
    toast.success(`${docType} 已发送至 ${shipment.customerEmail}`, {
      duration: 3000,
      description: `文档编号: ${docNumber}`
    });
    console.log(`发送文档给客户: ${docType} - ${docNumber} -> ${shipment.customerEmail}`);
  };
  
  // 下载清关包
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
  
  // 发送清关包给客户
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
                  onClick={() => handlePreview('CI', '商业发票', shipment.documents.commercialInvoice)}
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
              <Button 
                size="sm" 
                className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]"
                onClick={() => setShowInvoiceDialog(true)}
              >
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
                  onClick={() => handlePreview('PL', '装箱清单', shipment.documents.packingList)}
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
                onClick={() => setShowPackingListDialog(true)}
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
                  onClick={() => handlePreview('BL', '提单', shipment.documents.billOfLading)}
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
              <Button 
                size="sm" 
                className="h-7 text-xs bg-[#F96302] hover:bg-[#E55A02]"
                onClick={() => setShowBLDialog(true)}
              >
                <Upload className="w-3 h-3 mr-1" />
                录入提单信息
              </Button>
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

      {/* 开具发票对话框 */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">开具商业发票</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label className="text-xs text-gray-600">发票号 *</Label>
              <Input
                value={invoiceData.documentNumber}
                onChange={(e) => setInvoiceData({...invoiceData, documentNumber: e.target.value})}
                placeholder="INV-2025-001"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">开票日期 *</Label>
              <Input
                type="date"
                value={invoiceData.issueDate}
                onChange={(e) => setInvoiceData({...invoiceData, issueDate: e.target.value})}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">状态</Label>
              <Select value={invoiceData.status} onValueChange={(value) => setInvoiceData({...invoiceData, status: value})}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft" style={{ fontSize: '12px' }}>草稿</SelectItem>
                  <SelectItem value="issued" style={{ fontSize: '12px' }}>已开</SelectItem>
                  <SelectItem value="paid" style={{ fontSize: '12px' }}>已付</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowInvoiceDialog(false)}>
                取消
              </Button>
              <Button size="sm" className="h-8 text-xs bg-[#F96302] hover:bg-[#E55A02]" onClick={handleCreateInvoice}>
                确认开具
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 制作装箱清单对话框 */}
      <Dialog open={showPackingListDialog} onOpenChange={setShowPackingListDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">制作装箱清单</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label className="text-xs text-gray-600">清单号 *</Label>
              <Input
                value={packingListData.documentNumber}
                onChange={(e) => setPackingListData({...packingListData, documentNumber: e.target.value})}
                placeholder="PL-2025-001"
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">制作日期 *</Label>
              <Input
                type="date"
                value={packingListData.issueDate}
                onChange={(e) => setPackingListData({...packingListData, issueDate: e.target.value})}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPackingListDialog(false)}>
                取消
              </Button>
              <Button size="sm" className="h-8 text-xs bg-[#F96302] hover:bg-[#E55A02]" onClick={handleCreatePackingList}>
                确认制作
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 录入提单对话框 */}
      <Dialog open={showBLDialog} onOpenChange={setShowBLDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">录入提单信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label className="text-xs text-gray-600">提单号 *</Label>
              <Input
                value={blData.blNumber}
                onChange={(e) => setBlData({...blData, blNumber: e.target.value})}
                placeholder="MAEU123456789"
                className="h-8 text-xs mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600">提单类型 *</Label>
              <Select value={blData.type} onValueChange={(value) => setBlData({...blData, type: value})}>
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original" style={{ fontSize: '12px' }}>正本</SelectItem>
                  <SelectItem value="seaway" style={{ fontSize: '12px' }}>电放</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-600">签发日期 *</Label>
              <Input
                type="date"
                value={blData.issueDate}
                onChange={(e) => setBlData({...blData, issueDate: e.target.value})}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowBLDialog(false)}>
                取消
              </Button>
              <Button size="sm" className="h-8 text-xs bg-[#F96302] hover:bg-[#E55A02]" onClick={handleCreateBL}>
                确认录入
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">{previewDoc?.title} - 预览</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 border-2 border-gray-200 rounded p-6 min-h-[400px]">
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg">{previewDoc?.title}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {previewDoc?.type === 'CI' && `Invoice No: ${previewDoc.data?.documentNumber}`}
                  {previewDoc?.type === 'PL' && `Packing List No: ${previewDoc.data?.documentNumber}`}
                  {previewDoc?.type === 'BL' && `B/L No: ${previewDoc.data?.blNumber}`}
                </p>
              </div>
              <div className="text-xs text-gray-600 space-y-2">
                <p>合同号: {shipment.contractNumber}</p>
                <p>客户: {shipment.customerName}</p>
                {previewDoc?.data && (
                  <>
                    <p>日期: {previewDoc.data.issueDate}</p>
                    {previewDoc.type === 'BL' && <p>类型: {previewDoc.data.type === 'original' ? '正本' : '电放'}</p>}
                  </>
                )}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <p className="text-center text-gray-400">
                    这是文档预览界面
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default DocumentsContent;
