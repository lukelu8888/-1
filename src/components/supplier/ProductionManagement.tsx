import React, { useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { FileText, Factory, Search, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext';
import { useUser } from '../../contexts/UserContext';
import { supplierInspectionReportService } from '../../lib/supabaseService';

const buildReportNo = () => `SIR-${Date.now()}`;

export default function ProductionManagement() {
  const { user } = useUser();
  const { purchaseOrders, updatePurchaseOrder } = usePurchaseOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [summary, setSummary] = useState('');
  const [defectNotes, setDefectNotes] = useState('');

  const currentSupplierOrders = useMemo(() => {
    if (!user?.email) return [];
    return purchaseOrders.filter((po) => {
      const reqStatus = String(po.procurementRequestStatus || '').trim();
      const executionStatus = String(po.executionStatus || '').trim();
      const belongsToSupplier =
        String(po.supplierEmail || '').toLowerCase() === String(user.email || '').toLowerCase() ||
        String(po.supplierCode || '').toLowerCase() === String(user.email || '').toLowerCase() ||
        String(po.supplierName || '').trim() === String(user.name || '').trim();
      const inExecution =
        reqStatus === 'pushed_supplier' ||
        executionStatus === 'supplier_pending_confirmation' ||
        executionStatus === 'supplier_confirmed' ||
        executionStatus === 'sampling' ||
        executionStatus === 'in_production' ||
        executionStatus === 'supplier_self_inspection_pending' ||
        executionStatus === 'supplier_self_inspection_submitted';
      return belongsToSupplier && inExecution;
    });
  }, [purchaseOrders, user?.email, user?.name]);

  const filteredOrders = useMemo(() => {
    return currentSupplierOrders.filter((po) => {
      const keyword = searchTerm.trim().toLowerCase();
      if (!keyword) return true;
      return (
        String(po.poNumber || '').toLowerCase().includes(keyword) ||
        String(po.sourceRef || '').toLowerCase().includes(keyword) ||
        String(po.supplierName || '').toLowerCase().includes(keyword) ||
        (po.items || []).some((item) => String(item.productName || '').toLowerCase().includes(keyword))
      );
    });
  }, [currentSupplierOrders, searchTerm]);

  const getStatusConfig = (executionStatus?: string) => {
    switch (String(executionStatus || '')) {
      case 'supplier_pending_confirmation':
        return { label: '待确认接单', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
      case 'supplier_confirmed':
        return { label: '已确认接单', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'sampling':
        return { label: '产前样处理中', color: 'bg-sky-100 text-sky-800 border-sky-300' };
      case 'in_production':
        return { label: '生产中', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'supplier_self_inspection_pending':
        return { label: '待提交自检', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
      case 'supplier_self_inspection_submitted':
        return { label: '已提交自检', color: 'bg-teal-100 text-teal-800 border-teal-300' };
      default:
        return { label: '执行中', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }
  };

  const handleOpenReportDialog = (order: any) => {
    setSelectedOrder(order);
    setSummary('');
    setDefectNotes('');
    setReportDialogOpen(true);
  };

  const handleSubmitInspectionReport = async () => {
    if (!selectedOrder) return;
    if (!summary.trim()) {
      toast.error('请填写自检结论摘要');
      return;
    }

    try {
      await supplierInspectionReportService.create({
        purchaseOrderId: selectedOrder.id,
        reportNo: buildReportNo(),
        supplierId: user?.id || user?.email || '',
        inspectionDate: new Date().toISOString().split('T')[0],
        result: defectNotes.trim() ? 'pass_with_remark' : 'pass',
        summary: summary.trim(),
        defectNotes: defectNotes.trim(),
        submittedBy: user?.name || user?.email || 'supplier',
        submittedFromPortal: 'supplier_portal',
        attachments: [],
      });

      await updatePurchaseOrder(selectedOrder.id, {
        executionStatus: 'supplier_self_inspection_submitted',
        supplierSelfInspectionStatus: 'submitted',
        updatedDate: new Date().toISOString(),
      } as any);

      toast.success(`已提交 ${selectedOrder.poNumber} 的供应商自检报告`);
      setReportDialogOpen(false);
    } catch (error: any) {
      toast.error(`提交自检报告失败：${error?.message || '未知错误'}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索采购单号、来源单号、产品名称..."
              className="pl-9 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">执行中订单</span>
            <Factory className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待提交自检</span>
            <Upload className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredOrders.filter((po) => String(po.executionStatus || '') === 'supplier_self_inspection_pending').length}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已提交自检</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {filteredOrders.filter((po) => String(po.executionStatus || '') === 'supplier_self_inspection_submitted').length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3.5">
          <h3 className="font-semibold text-gray-900">生产与自检管理</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9">采购单号</TableHead>
                <TableHead className="h-9">来源单号</TableHead>
                <TableHead className="h-9">产品信息</TableHead>
                <TableHead className="h-9">数量</TableHead>
                <TableHead className="h-9">当前状态</TableHead>
                <TableHead className="h-9 text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.executionStatus);
                return (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="py-3 font-medium text-blue-600">{order.poNumber}</TableCell>
                    <TableCell className="py-3 text-gray-600">{order.sourceRef || order.salesContractNumber || '-'}</TableCell>
                    <TableCell className="py-3">
                      <div className="space-y-1">
                        {(order.items || []).slice(0, 2).map((item: any) => (
                          <div key={item.id} className="text-sm text-gray-900">{item.productName}</div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <div className="text-xs text-gray-500">另有 {(order.items || []).length - 2} 个产品</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-700">
                      {(order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-teal-600 hover:bg-teal-700"
                        disabled={String(order.executionStatus || '') === 'supplier_self_inspection_submitted'}
                        onClick={() => handleOpenReportDialog(order)}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        提交自检
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交供应商自检报告</DialogTitle>
            <DialogDescription>
              将自检结论提交到后段蓝图执行链，供采购与 QC 继续跟进。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>采购单号</Label>
              <Input value={selectedOrder?.poNumber || ''} disabled />
            </div>
            <div>
              <Label>自检结论摘要</Label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="例如：成品抽检合格，尺寸、外观、包装均符合要求。"
              />
            </div>
            <div>
              <Label>缺陷/备注</Label>
              <Textarea
                value={defectNotes}
                onChange={(e) => setDefectNotes(e.target.value)}
                placeholder="如有轻微问题、返工项或备注，请写在这里。"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              取消
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSubmitInspectionReport}>
              提交自检报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
