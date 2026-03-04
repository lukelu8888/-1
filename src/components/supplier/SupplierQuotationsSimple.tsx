import React, { useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Calculator, Send, Clock, CheckCircle, Eye, Package, Trash2, CheckSquare, Square, Download, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner@2.0.3';
import { useXJs } from '../../contexts/XJContext';
import { useUser } from '../../contexts/UserContext';
import { SimpleQuoteForm } from './SimpleQuoteForm';
import XJDocumentViewer from './XJDocumentViewer';
import { nextBJNumber } from '../../utils/xjNumberGenerator'; // 🔥 BJ编号生成器

export default function SupplierQuotationsSimple() {
  const { user } = useUser();
  const { rfqs, getRFQsBySupplier, addQuoteToRFQ, deleteRFQ, updateRFQ } = useXJs();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailRFQ, setDetailRFQ] = useState<any>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [documentRFQ, setDocumentRFQ] = useState<any>(null);
  
  // 🔥 批量删除功能的状态管理
  const [selectedRFQIds, setSelectedRFQIds] = useState<string[]>([]);

  // 🔥 获取当前供应商的所有采购询价
  const xjs = useMemo(() => {
    if (!user?.email) return [];
    
    console.log('🔍 [供应商采购询价查询] ==================');
    console.log('📧 当前供应商用户email:', user.email);
    console.log('📊 所有采购询价总数:', rfqs.length);
    
    // 打印所有采购询价的供应商信息
    xjs.forEach(xj => {
      console.log(`  - 采购询价 ${rfq.xjNumber}:`, {
        supplierCode: xj.supplierCode,
        supplierEmail: xj.supplierEmail,
        supplierName: xj.supplierName
      });
    });
    
    const filtered = getRFQsBySupplier(user.email);
    console.log('✅ 筛选后的采购询价数量:', filtered.length);
    console.log('==================\n');
    
    return filtered;
  }, [rfqs, user?.email, getRFQsBySupplier]);

  // 🔥 分类采购询价
  const categorizedRFQs = useMemo(() => {
    const pending = xjs.filter(xj => {
      const myQuote = xj.quotes?.find(q => q.supplierCode === user?.email);
      return !myQuote && xj.status === 'pending';
    });
    
    const quoted = xjs.filter(xj => {
      const myQuote = xj.quotes?.find(q => q.supplierCode === user?.email);
      return myQuote && xj.status !== 'accepted' && xj.status !== 'rejected';
    });
    
    const accepted = xjs.filter(xj => xj.status === 'accepted');
    
    return { pending, quoted, accepted };
  }, [xjs, user?.email]);

  // 🔥 提交报价
  const handleSubmitQuote = async (formData: any, type: 'draft' | 'submit') => {
    if (!selectedRFQ || !user) return;
    
    if (type === 'submit') {
      // 🔥 生成供应商报价单号（BJ，调用 Supabase RPC）
      const supplierQuotationNo = await nextBJNumber();
      
      const quote = {
        supplierCode: user.email,
        supplierName: user.name || user.email,
        quotedDate: new Date().toISOString().split('T')[0],
        quotedPrice: parseFloat(formData.unitPrice),
        leadTime: parseInt(formData.leadTime),
        moq: parseInt(formData.moq),
        validityDays: parseInt(formData.validityDays),
        paymentTerms: formData.paymentTerms,
        remarks: formData.remarks
      };
      
      addQuoteToRFQ(selectedRFQ.id, quote);
      
      // 🔥 更新报价单号
      updateRFQ(selectedRFQ.id, { 
        supplierQuotationNo,
        status: 'quoted' as any
      });
      
      // 🔥 创建独立的BJ供应商报价单对象（用于智能比价）
      const bjQuotation = {
        id: `bj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        quotationNo: supplierQuotationNo,
        sourceXJ: selectedRFQ.supplierXjNo, // 关联XJ询价单号
        sourceQR: selectedRFQ.requirementNo, // 关联QR采购需求号
        sourceRFQId: selectedRFQ.id,
        customerName: selectedRFQ.customerName || 'COSUN',
        customerCompany: 'COSUN贸易',
        supplierCode: user.email,
        supplierName: user.name || user.email,
        supplierCompany: user.name || user.email,
        supplierEmail: user.email,
        quotationDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + parseInt(formData.validityDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: formData.currency || 'USD',
        totalAmount: parseFloat(formData.unitPrice) * (selectedRFQ.quantity || 0),
        paymentTerms: formData.paymentTerms,
        items: selectedRFQ.products?.map((p: any) => ({
          id: p.id || `item_${Date.now()}`,
          productName: p.productName,
          modelNo: p.modelNo || 'N/A',
          specification: p.specification,
          quantity: p.quantity,
          unit: p.unit || 'pcs',
          unitPrice: parseFloat(formData.unitPrice),
          currency: formData.currency || 'USD',
          amount: parseFloat(formData.unitPrice) * p.quantity,
          leadTime: parseInt(formData.leadTime),
          moq: parseInt(formData.moq),
          remarks: formData.remarks
        })) || [{
          id: `item_${Date.now()}`,
          productName: selectedRFQ.productName,
          modelNo: selectedRFQ.modelNo || 'N/A',
          specification: selectedRFQ.specification,
          quantity: selectedRFQ.quantity,
          unit: selectedRFQ.unit || 'pcs',
          unitPrice: parseFloat(formData.unitPrice),
          currency: formData.currency || 'USD',
          amount: parseFloat(formData.unitPrice) * selectedRFQ.quantity,
          leadTime: parseInt(formData.leadTime),
          moq: parseInt(formData.moq),
          remarks: formData.remarks
        }],
        status: 'submitted' as const,
        createdBy: user.email,
        createdDate: new Date().toISOString().split('T')[0],
        version: 1
      };
      
      // 🔥 保存到localStorage的supplierQuotations
      const storedQuotations = JSON.parse(localStorage.getItem('supplierQuotations') || '[]');
      storedQuotations.push(bjQuotation);
      localStorage.setItem('supplierQuotations', JSON.stringify(storedQuotations));
      
      console.log('✅ [SupplierQuotationsSimple] 创建BJ报价单:', bjQuotation);
      console.log('  - BJ编号:', supplierQuotationNo);
      console.log('  - 关联XJ:', selectedRFQ.supplierXjNo);
      console.log('  - 关联QR:', selectedRFQ.requirementNo);
      
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">✅ 报价已成功提交！</p>
          <p className="text-sm">询价单号: {selectedRFQ.supplierXjNo || 'XJ-未分配'}</p>
          <p className="text-sm">报价单号: {supplierQuotationNo}</p>
          <p className="text-xs text-slate-500">COSUN采购需求: {selectedRFQ.requirementNo}</p>
          <p className="text-xs text-slate-500">报价已发送至COSUN管理员</p>
        </div>,
        { duration: 5000 }
      );
      
      setQuoteDialogOpen(false);
      setSelectedRFQ(null);
    }
  };

  // 🔥 删除询价单
  const handleDeleteXJ = (rfq: any) => {
    if (window.confirm(`确定要删除询价单 ${rfq.xjNumber} 吗？\n\n⚠️ 此操作不可恢复！`)) {
      deleteRFQ(rfq.id);
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">🗑️ 询价单已删除</p>
          <p className="text-sm">采购询价编号: {rfq.xjNumber}</p>
        </div>,
        { duration: 3000 }
      );
    }
  };

  // 🔥 批量删除功能
  const handleToggleSelectRFQ = (rfqId: string) => {
    setSelectedRFQIds(prev => 
      prev.includes(rfqId) 
        ? prev.filter(id => id !== rfqId)
        : [...prev, rfqId]
    );
  };

  const handleToggleSelectAll = () => {
    const currentRFQs = getCurrentRFQs();
    if (selectedRFQIds.length === currentRFQs.length) {
      setSelectedRFQIds([]);
    } else {
      setSelectedRFQIds(currentRFQs.map(rfq => rfq.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedRFQIds.length === 0) {
      toast.error('请先选择要删除的询价单');
      return;
    }

    const confirmMessage = `确定要删除选中的 ${selectedRFQIds.length} 条询价单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      selectedRFQIds.forEach(id => {
        deleteRFQ(id);
      });

      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">🗑️ 批量删除成功！</p>
          <p className="text-sm">已删除 {selectedRFQIds.length} 条询价单</p>
        </div>,
        { duration: 3000 }
      );

      setSelectedRFQIds([]);
    }
  };

  // 🔥 切换Tab时清空选中状态
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSelectedRFQIds([]);
  };

  const getCurrentRFQs = () => {
    switch (activeTab) {
      case 'pending': return categorizedRFQs.pending;
      case 'quoted': return categorizedRFQs.quoted;
      case 'accepted': return categorizedRFQs.accepted;
      default: return xjs;
    }
  };

  const tabs = [
    { id: 'pending', label: '客户需求池', icon: Clock, count: categorizedRFQs.pending.length },
    { id: 'quoted', label: '已报价', icon: Send, count: categorizedRFQs.quoted.length },
    { id: 'accepted', label: '已接受', icon: CheckCircle, count: categorizedRFQs.accepted.length },
    { id: 'all', label: '全部', icon: FileText, count: xjs.length },
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>客户需求池</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{categorizedRFQs.pending.length}</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>需要提交报价</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>已报价</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{categorizedRFQs.quoted.length}</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>等待客户决策</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>已接受</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{categorizedRFQs.accepted.length}</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>成功转化订单</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600" style={{ fontSize: '14px' }}>总询价单</span>
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{xjs.length}</p>
          <p className="text-gray-500 mt-1" style={{ fontSize: '14px' }}>所有询价记录</p>
        </div>
      </div>

      {/* 询价表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '14px' }}>询价报价管理</h3>
            </div>
          </div>

          {/* Tab导航 */}
          <div className="flex items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600 bg-orange-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={{ fontSize: '14px', fontWeight: 500 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="outline" className="h-5 px-1.5 min-w-5" style={{ fontSize: '14px' }}>
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* 🔥 批量操作工具栏 */}
        {selectedRFQIds.length > 0 && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-900" style={{ fontWeight: 500 }}>
                  已选中 <span className="font-bold">{selectedRFQIds.length}</span> 条询价单
                </span>
                <button
                  onClick={() => setSelectedRFQIds([])}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  取消选择
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 gap-2"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  批量删除 ({selectedRFQIds.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-12">
                  <Checkbox
                    checked={getCurrentRFQs().length > 0 && selectedRFQIds.length === getCurrentRFQs().length}
                    onCheckedChange={handleToggleSelectAll}
                  />
                </TableHead>
                <TableHead className="h-9 w-32" style={{ fontSize: '14px' }}>询价单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '14px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '14px' }}>需求数量</TableHead>
                <TableHead className="h-9 w-28" style={{ fontSize: '14px' }}>截止日期</TableHead>
                {(activeTab === 'quoted' || activeTab === 'accepted') && (
                  <>
                    <TableHead className="h-9 w-24 text-right" style={{ fontSize: '14px' }}>我方报价</TableHead>
                    <TableHead className="h-9 w-28" style={{ fontSize: '14px' }}>报价日期</TableHead>
                  </>
                )}
                <TableHead className="h-9 w-20" style={{ fontSize: '14px' }}>状态</TableHead>
                <TableHead className="h-9 w-32 text-center" style={{ fontSize: '14px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentRFQs().length > 0 ? (
                getCurrentRFQs().map((rfq) => {
                  const myQuote = xj.quotes?.find((q: any) => q.supplierCode === user?.email);
                  
                  return (
                    <TableRow key={rfq.id} className="hover:bg-gray-50">
                      <TableCell className="py-3">
                        <Checkbox
                          checked={selectedRFQIds.includes(rfq.id)}
                          onCheckedChange={() => handleToggleSelectRFQ(rfq.id)}
                        />
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '14px' }}>
                        <div>
                          <p className="font-medium text-blue-600">{rfq.supplierXjNo || 'XJ-未分配'}</p>
                          {rfq.supplierQuotationNo && (
                            <p className="text-xs text-green-600 font-medium">报价单: {rfq.supplierQuotationNo}</p>
                          )}
                          <p className="text-xs text-gray-500">COSUN需求: {rfq.requirementNo || 'N/A'}</p>
                          <p className="text-xs text-gray-400">{rfq.createdDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '14px' }}>
                        <div>
                          {/* 🔥 如果有多个产品，显示产品数量 */}
                          {rfq.products && rfq.products.length > 1 ? (
                            <>
                              <p className="font-medium text-gray-900">
                                <Package className="w-3.5 h-3.5 inline mr-1 text-orange-600" />
                                {rfq.products.length} 个产品
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {rfq.products.map(p => p.productName).slice(0, 2).join(', ')}
                                {rfq.products.length > 2 && '...'}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">{rfq.productName || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{rfq.modelNo || ''}</p>
                              {rfq.specification && (
                                <p className="text-xs text-gray-500">{rfq.specification}</p>
                              )}
                            </>
                          )}
                          {rfq.remarks && (
                            <p className="text-xs text-orange-600 mt-1">{rfq.remarks}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right" style={{ fontSize: '14px' }}>
                        {rfq.products && rfq.products.length > 1 ? (
                          <div className="text-xs text-gray-600">
                            多产品<br/>询价
                          </div>
                        ) : (
                          <>
                            <span className="font-medium">{rfq.quantity?.toLocaleString() || 0}</span>
                            <span className="text-gray-500 ml-1">{rfq.unit || ''}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '14px' }}>
                        <span className="text-gray-600">{rfq.quotationDeadline}</span>
                      </TableCell>
                      {(activeTab === 'quoted' || activeTab === 'accepted') && myQuote && (
                        <>
                          <TableCell className="py-3 text-right" style={{ fontSize: '14px' }}>
                            <p className="font-bold text-green-600">
                              ${myQuote.quotedPrice?.toFixed(2)}
                            </p>
                          </TableCell>
                          <TableCell className="py-3" style={{ fontSize: '14px' }}>
                            <span className="text-gray-600">{myQuote.quotedDate}</span>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${
                          xj.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            : xj.status === 'quoted'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-green-100 text-green-800 border-green-300'
                        }`}>
                          {xj.status === 'pending' ? '待报价' : xj.status === 'quoted' ? '已报价' : '已接受'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          {rfq.documentData && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 text-xs border-orange-600 text-orange-600 hover:bg-orange-50"
                              onClick={() => {
                                setDocumentRFQ(rfq);
                                setDocumentViewerOpen(true);
                              }}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              询价单
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setDetailRFQ(rfq);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            详情
                          </Button>
                          {activeTab === 'pending' && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                              onClick={() => {
                                setSelectedRFQ(rfq);
                                setQuoteDialogOpen(true);
                              }}
                            >
                              <Calculator className="w-3 h-3 mr-1" />
                              报价
                            </Button>
                          )}
                          {myQuote && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
                                setDetailRFQ(rfq);
                                setDetailDialogOpen(true);
                              }}
                            >
                              查看报价
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-red-600"
                            onClick={() => handleDeleteXJ(rfq)}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>
                        {activeTab === 'pending' && '暂无待报价询价单'}
                        {activeTab === 'quoted' && '暂无已报价询价单'}
                        {activeTab === 'accepted' && '暂无已接受询价单'}
                        {activeTab === 'all' && '暂无询价单'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 报价对话框 */}
      <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提交报价 - {selectedRFQ?.xjNumber}</DialogTitle>
            <DialogDescription>
              请填写您的报价信息并提交给COSUN管理员
            </DialogDescription>
          </DialogHeader>
          
          {selectedRFQ && (
            <SimpleQuoteForm
              rfq={selectedRFQ}
              onSubmit={handleSubmitQuote}
              onCancel={() => setQuoteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>询价单详情 - {detailRFQ?.xjNumber}</DialogTitle>
            <DialogDescription>详细信息如下</DialogDescription>
          </DialogHeader>
          
          {detailRFQ && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">询价单号</p>
                  <p className="text-sm font-medium">{detailRFQ.xjNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">创建日期</p>
                  <p className="text-sm font-medium">{detailRFQ.createdDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">截止日期</p>
                  <p className="text-sm font-medium text-orange-600">{detailRFQ.quotationDeadline}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">期望交期</p>
                  <p className="text-sm font-medium">{detailRFQ.expectedDate}</p>
                </div>
              </div>

              {detailRFQ.items && detailRFQ.items.length > 0 ? (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-sm">产品清单</h4>
                  <div className="space-y-2">
                    {detailRFQ.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-gray-500">{item.modelNo}</p>
                            {item.specification && (
                              <p className="text-xs text-gray-500 mt-1">{item.specification}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{item.quantity} {item.unit}</p>
                            {item.targetPrice && (
                              <p className="text-xs text-gray-500">目标: ${item.targetPrice}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-sm">产品信息</h4>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">产品名称</p>
                        <p className="text-sm font-medium">{detailRFQ.productName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">型号</p>
                        <p className="text-sm font-medium">{detailRFQ.modelNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">需求数量</p>
                        <p className="text-sm font-semibold">{detailRFQ.quantity} {detailRFQ.unit}</p>
                      </div>
                      {detailRFQ.targetPrice && (
                        <div>
                          <p className="text-xs text-gray-600">目标价格</p>
                          <p className="text-sm font-medium text-orange-600">{detailRFQ.currency} {detailRFQ.targetPrice}</p>
                        </div>
                      )}
                      {detailRFQ.specification && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">规格说明</p>
                          <p className="text-sm">{detailRFQ.specification}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {detailRFQ.quotes && detailRFQ.quotes.find((q: any) => q.supplierCode === user?.email) && (
                <div className="border-t pt-4 bg-green-50 p-4 rounded">
                  <h4 className="font-semibold mb-3 text-sm text-green-800">我的报价</h4>
                  {(() => {
                    const myQuote = detailRFQ.quotes.find((q: any) => q.supplierCode === user?.email);
                    return (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-green-700">报价单价</p>
                          <p className="font-bold text-green-800">${myQuote.quotedPrice}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">交货周期</p>
                          <p className="font-medium">{myQuote.leadTime} 天</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">最小订购量</p>
                          <p className="font-medium">{myQuote.moq}</p>
                        </div>
                        <div>
                          <p className="text-xs text-green-700">报价日期</p>
                          <p className="font-medium">{myQuote.quotedDate}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-green-700">付款条款</p>
                          <p className="font-medium">{myQuote.paymentTerms}</p>
                        </div>
                        {myQuote.remarks && (
                          <div className="col-span-2">
                            <p className="text-xs text-green-700">备注</p>
                            <p className="text-sm">{myQuote.remarks}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {detailRFQ.remarks && (
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600">客户备注</p>
                  <p className="text-sm mt-1">{detailRFQ.remarks}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 文档查看器对话框 */}
      <Dialog open={documentViewerOpen} onOpenChange={setDocumentViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>询价单文档 - {documentRFQ?.xjNumber}</DialogTitle>
            <DialogDescription>
              完整的询价单文档，包含产品清单、商务条款和技术要求
            </DialogDescription>
          </DialogHeader>
          
          {documentRFQ && (
            <XJDocumentViewer rfq={documentRFQ} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}