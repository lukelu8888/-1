import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { FileText, Calculator, Send, Clock, CheckCircle, Eye, Calendar, Package, AlertCircle, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { toast } from 'sonner@2.0.3';
import QuotationDocument from './QuotationDocument';
import { useXJs } from '../../contexts/XJContext'; // 🔥 导入采购询价 Context
import { useUser } from '../../contexts/UserContext'; // 🔥 获取当前供应商信息（我方）
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { SupplierDataCleaner } from './SupplierDataCleaner'; // 🧹 数据清理工具
import { Trash2 } from 'lucide-react';
import { SupplierQuotationDocument, SupplierQuotationData } from '../documents/templates/SupplierQuotationDocument'; // 🔥 供应商报价单模板
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { suppliersDatabase } from '../../data/suppliersData'; // 🔥 导入供应商数据库
import { generateBJNumber, nextBJNumber } from '../../utils/xjNumberGenerator'; // 🔥 BJ编号生成器

/**
 * 🔥 供应商视角：询价报价管理
 * - COSUN（福建高盛达富建材）= 我们的客户（买方）
 * - 供应商 = 我方（卖方）
 * - 收到客户COSUN的采购询价单（XJ），我方提交报价
 */
export default function SupplierQuotations() {
  const { user } = useUser(); // 🔥 当前登录的供应商（我方）
  const { rfqs, getRFQsBySupplier, addQuoteToRFQ, updateRFQ } = useXJs(); // 🔥 使用采购询价 Context
  
  // 🔥 获取完整的供应商信息（从suppliersDatabase）
  const supplierInfo = useMemo(() => {
    if (!user?.email) return null;
    
    // 从数据库中查找匹配的供应商
    const supplier = suppliersDatabase.find(s => s.email === user.email);
    
    if (supplier) {
      return supplier;
    }
    
    // 如果找不到，返回基础信息
    return {
      email: user.email,
      name: user.company || user.name || '供应商',
      company: user.company || '供应商公司',
      contact: user.name || '联系人',
      phone: user.phone || '',
      address: user.address || '供应商地址'
    };
  }, [user]);
  
  const [activeTab, setActiveTab] = useState('pending');
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingQuoteData, setPendingQuoteData] = useState<any>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailRFQ, setDetailRFQ] = useState<any>(null);
  
  // 🔥 报价单预览状态
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);
  const [currentQuotationData, setCurrentQuotationData] = useState<SupplierQuotationData | null>(null);
  const quotationDocRef = React.useRef<HTMLDivElement>(null);
  
  // 🔥 报价表单状态
  const [quoteForm, setQuoteForm] = useState({
    unitPrice: '',
    leadTime: '',
    moq: '',
    validityDays: '30',
    paymentTerms: 'T/T 30% deposit, 70% before shipment',
    remarks: ''
  });

  // 🔥 获取当前供应商的所有采购询价
  const supplierRFQs = useMemo(() => {
    if (!user?.email) {
      console.log('❌ [SupplierQuotations] 供应商未登录，user.email 为空');
      return [];
    }
    
    console.log('🔍 [SupplierQuotations] 查询采购询价...');
    console.log('  - 当前供应商Email:', user.email);
    console.log('  - 总采购询价数量:', rfqs.length);
    
    const result = getRFQsBySupplier(user.email);
    console.log('  - 匹配到的采购询价数量:', result.length);
    
    if (result.length > 0) {
      console.log('✅ [SupplierQuotations] 找到采购询价:');
      result.forEach((rfq, idx) => {
        console.log(`  ${idx + 1}. 采购询价单号: ${rfq.supplierXjNo || '未生成'} (内部: ${rfq.xjNumber})`);
        console.log(`      产品: ${rfq.productName} - 供应商: ${rfq.supplierName}`);
        if (rfq.supplierQuotationNo) {
          console.log(`      报价单号: ${rfq.supplierQuotationNo}`);
        }
      });
    } else {
      console.log('⚠️ [SupplierQuotations] 未找到采购询价');
      console.log('  - 请检查供应商Email是否与采购询价中的supplierEmail匹配');
      if (rfqs.length > 0) {
        console.log('  - 现有采购询价的供应商Email列表:');
        const uniqueEmails = [...new Set(rfqs.map(r => r.supplierEmail))];
        uniqueEmails.forEach(email => {
          console.log(`    * ${email}`);
        });
      }
    }
    
    return result;
  }, [rfqs, user?.email]);

  // 🔥 分类采购询价
  const categorizedRFQs = useMemo(() => {
    const pending = supplierRFQs.filter(rfq => {
      const myQuote = rfq.quotes?.find(q => q.supplierCode === user?.email);
      return !myQuote && rfq.status === 'pending';
    });
    
    const quoted = supplierRFQs.filter(rfq => {
      const myQuote = rfq.quotes?.find(q => q.supplierCode === user?.email);
      return myQuote && rfq.status !== 'accepted' && rfq.status !== 'rejected';
    });
    
    const accepted = supplierRFQs.filter(rfq => rfq.status === 'accepted');
    const rejected = supplierRFQs.filter(rfq => rfq.status === 'rejected');
    
    return { pending, quoted, accepted, rejected };
  }, [supplierRFQs, user?.email]);

  // 🔥 提交报价
  const handleSubmitQuote = useCallback((submitType: 'draft' | 'submit') => {
    if (!selectedRFQ) return;
    
    // 验证必填项
    if (!quoteForm.unitPrice || !quoteForm.leadTime || !quoteForm.moq) {
      toast.error('请填写完整的报价信息！');
      return;
    }
    
    if (submitType === 'draft') {
      // 保存草稿
      const draftId = editingDraft?.id || `DRAFT-${Date.now()}`;
      const newDraft = {
        id: draftId,
        rfqId: selectedRFQ.id,
        xjNumber: selectedRFQ.xjNumber,
        productName: selectedRFQ.items[0]?.productName,
        ...quoteForm,
        savedDate: new Date().toISOString().split('T')[0],
        status: 'draft'
      };
      
      if (editingDraft) {
        setDrafts(prev => prev.map(d => d.id === draftId ? newDraft : d));
        toast.success('报价草稿已更新！');
      } else {
        setDrafts(prev => [...prev, newDraft]);
        toast.success('报价草稿已保存！');
      }
      
      setQuoteDialogOpen(false);
      setEditingDraft(null);
      resetQuoteForm();
    } else {
      // 提交报价
      setPendingQuoteData(quoteForm);
      setQuoteDialogOpen(false);
      setConfirmDialogOpen(true);
    }
  }, [selectedRFQ, quoteForm, editingDraft]);

  // 🔥 确认提交报价
  const handleConfirmSubmitQuote = useCallback(async () => {
    if (!selectedRFQ || !pendingQuoteData || !user) return;
    
    // 🔥 生成供应商报价单号（BJ，调用 Supabase RPC）
    const supplierQuotationNo = await nextBJNumber();
    
    const quote = {
      supplierCode: user.email,
      supplierName: user.name || user.email,
      quotedDate: new Date().toISOString().split('T')[0],
      quotedPrice: parseFloat(pendingQuoteData.unitPrice),
      currency: pendingQuoteData.currency || 'USD',
      leadTime: parseInt(pendingQuoteData.leadTime),
      moq: parseInt(pendingQuoteData.moq),
      validityDays: parseInt(pendingQuoteData.validityDays),
      paymentTerms: pendingQuoteData.paymentTerms,
      remarks: pendingQuoteData.remarks
    };
    
    // 🔥 添加报价到采购询价
    addQuoteToRFQ(selectedRFQ.id, quote);
    
    // 🔥 更新采购询价，添加供应商报价单号
    updateRFQ(selectedRFQ.id, { supplierQuotationNo });
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 报价已成功提交！</p>
        <p className="text-sm">询价单号: {selectedRFQ.supplierXjNo || selectedRFQ.xjNumber}</p>
        <p className="text-sm">报价单号: {supplierQuotationNo}</p>
        <p className="text-xs text-slate-500">报价已发送至COSUN管理员审核</p>
      </div>,
      { duration: 5000 }
    );
    
    setConfirmDialogOpen(false);
    setPendingQuoteData(null);
    setSelectedRFQ(null);
    resetQuoteForm();
  }, [selectedRFQ, pendingQuoteData, user, addQuoteToRFQ]);

  const resetQuoteForm = () => {
    setQuoteForm({
      unitPrice: '',
      leadTime: '',
      moq: '',
      validityDays: '30',
      paymentTerms: 'T/T 30% deposit, 70% before shipment',
      remarks: ''
    });
  };

  const handleOpenQuoteDialog = (rfq: any) => {
    setSelectedRFQ(rfq);
    
    // 如果之前报过价，预填数据
    const existingQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
    if (existingQuote) {
      setQuoteForm({
        unitPrice: existingQuote.quotedPrice.toString(),
        leadTime: existingQuote.leadTime.toString(),
        moq: existingQuote.moq.toString(),
        validityDays: existingQuote.validityDays.toString(),
        paymentTerms: existingQuote.paymentTerms,
        remarks: existingQuote.remarks || ''
      });
    } else {
      resetQuoteForm();
    }
    
    setQuoteDialogOpen(true);
  };

  const getStatusConfig = (status: string) => {
    const config: any = {
      pending: { label: '待报价', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      quoted: { label: '已报价', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      accepted: { label: '已接受', color: 'bg-green-100 text-green-800 border-green-300' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-800 border-red-300' },
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    };
    return config[status] || { label: status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  const pendingRFQs = categorizedRFQs.pending;
  const quotedRFQs = categorizedRFQs.quoted;
  const acceptedRFQs = categorizedRFQs.accepted;

  const getCurrentRFQs = () => {
    switch (activeTab) {
      case 'pending': return pendingRFQs;
      case 'drafts': return drafts;
      case 'quoted': return quotedRFQs;
      case 'accepted': return acceptedRFQs;
      default: return supplierRFQs;
    }
  };

  const tabs = [
    { id: 'pending', label: '待报价', icon: Clock, count: pendingRFQs.length },
    { id: 'drafts', label: '报价草稿', icon: FileText, count: drafts.length },
    { id: 'quoted', label: '已报价', icon: Send, count: quotedRFQs.length },
    { id: 'accepted', label: '已接受', icon: CheckCircle, count: acceptedRFQs.length },
    { id: 'all', label: '全部', icon: FileText, count: supplierRFQs.length },
  ];

  // 🔥 生成供应商报价单文档数据
  const generateQuotationData = (rfq: any): SupplierQuotationData => {
    const myQuote = rfq.quotes?.find((q: any) => q.supplierCode === user?.email);
    if (!myQuote) return null as any;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (myQuote.validityDays || 30));

    return {
      quotationNo: rfq.supplierQuotationNo || `BJ-${new Date().toISOString().slice(2,10).replace(/-/g,'')}`, // fallback placeholder
      quotationDate: myQuote.quotedDate,
      validUntil: validUntilDate.toISOString().split('T')[0],
      rfqReference: rfq.supplierXjNo || rfq.xjNumber,
      
      supplier: {
        companyName: supplierInfo?.name || supplierInfo?.company || user?.company || '供应商公司名称',
        companyNameEn: supplierInfo?.nameEn || 'Supplier Company Ltd.',
        address: supplierInfo?.address || user?.address || '供应商地址',
        addressEn: supplierInfo?.addressEn || 'Supplier Address',
        tel: supplierInfo?.phone || user?.phone || user?.tel || '+86-XXX-XXXX-XXXX',
        email: supplierInfo?.email || user?.email || 'supplier@email.com',
        contactPerson: supplierInfo?.contact || user?.name || '联系人',
        supplierCode: supplierInfo?.code || supplierInfo?.id || user?.email,
        logo: supplierInfo?.logo || user?.logo || ''
      },
      
      buyer: {
        name: '福建高盛达富建材有限公司',
        nameEn: 'FUJIAN GOSUNDA FU BUILDING MATERIALS CO., LTD.',
        address: '福建省福州市仓山区金山工业区',
        addressEn: 'Jinshan Industrial Zone, Cangshan District, Fuzhou, Fujian, China',
        tel: '+86-591-8888-8888',
        email: 'purchasing@gosundafu.com',
        contactPerson: '采购部'
      },
      
      products: [{
        no: 1,
        modelNo: rfq.productCode || rfq.product || 'N/A',
        description: rfq.productName || rfq.product,
        specification: rfq.specifications || rfq.spec || '',
        quantity: rfq.quantity,
        unit: rfq.unit || 'pcs',
        unitPrice: myQuote.quotedPrice,
        currency: myQuote.currency || 'USD',
        remarks: myQuote.remarks || ''
      }],
      
      terms: {
        paymentTerms: myQuote.paymentTerms || 'T/T 30% deposit, 70% before shipment',
        deliveryTerms: rfq.deliveryTerms || 'EXW',
        deliveryTime: `${myQuote.leadTime || 30}天`,
        deliveryAddress: rfq.deliveryAddress || '福建省福州市仓山区金山工业区',
        moq: `${myQuote.moq || 1000}`,
        qualityStandard: rfq.qualityStandard || '符合国家标准',
        warranty: rfq.warranty || '12个月',
        packaging: rfq.packaging || '标准出口包装',
        shippingMarks: rfq.shippingMarks || '中性唛头',
        remarks: `报价有效期${myQuote.validityDays || 30}天`
      },
      
      // 🔥 供应商备注（从quote.remarks字段读取）
      supplierRemarks: myQuote.remarks ? {
        content: myQuote.remarks,
        remarkDate: myQuote.quotedDate,
        remarkBy: supplierInfo?.contact || user?.name || '供应商'
      } : undefined
    };
  };

  // 🔥 查看报价单
  const handleViewQuotation = (rfq: any) => {
    const quotationData = generateQuotationData(rfq);
    if (quotationData) {
      setCurrentQuotationData(quotationData);
      setShowQuotationPreview(true);
    }
  };

  // 🔥 下载报价单PDF
  const handleDownloadQuotationPDF = async () => {
    const element = quotationDocRef.current;
    if (!element || !currentQuotationData) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const a4Width = 210;
      const a4Height = 297;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = a4Width;
      const imgHeight = (canvas.height * a4Width) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      
      heightLeft -= a4Height;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= a4Height;
      }
      
      pdf.save(`Supplier_Quotation_${currentQuotationData.quotationNo}.pdf`);
      toast.success('PDF下载成功！');
    } catch (error) {
      console.error('PDF生成失败:', error);
      toast.error('PDF生成失败，请重试');
    }
  };

  // 🔥 打印报价单
  const handlePrintQuotation = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 🧹 测试数据清理横幅 - 仅在有数据时显示 */}
      {supplierRFQs.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <div className="font-bold text-red-600">⚠️ 检测到 {supplierRFQs.length} 条测试数据</div>
              <div className="text-sm text-red-500">
                这些是旧的测试数据，建议清空后重新从采购端流转生成真实数据
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              if (window.confirm('⚠️ 确定要清空所有询价数据吗？\n\n这将删除：\n- 所有询价单（' + supplierRFQs.length + '条）\n- 所有报价记录\n- 所有草稿\n\n此操作不可恢复！清空后请从采购端重新发送询价。')) {
                localStorage.removeItem('rfqs');
                toast.success('✅ 所有测试数据已清空', {
                  description: '页面将在2秒后刷新'
                });
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            立即清空测试数据
          </Button>
        </div>
      )}
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">待报价</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingRFQs.length}</p>
          <p className="text-xs text-gray-500 mt-1">需要提交报价</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">报价草稿</span>
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{drafts.length}</p>
          <p className="text-xs text-gray-500 mt-1">未完成的报价</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已报价</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{quotedRFQs.length}</p>
          <p className="text-xs text-gray-500 mt-1">等待客户决策</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600">已接受</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{acceptedRFQs.length}</p>
          <p className="text-xs text-gray-500 mt-1">成功转化订单</p>
        </div>
      </div>

      {/* 询价表格 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h3 className="font-semibold text-gray-900" style={{ fontSize: '15px' }}>询价报价管理</h3>
            </div>
          </div>

          {/* Tab导航 */}
          <div className="flex items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-600 text-orange-600 bg-orange-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={{ fontSize: '13px', fontWeight: 500 }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <Badge variant="outline" className="h-5 px-1.5 min-w-5 text-xs">
                    {tab.count}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-32" style={{ fontSize: '12px' }}>询价单号</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9 w-24" style={{ fontSize: '12px' }}>客户区域</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>需求数量</TableHead>
                <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>目标价格</TableHead>
                {activeTab !== 'drafts' && (
                  <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>截止日期</TableHead>
                )}
                {(activeTab === 'quoted' || activeTab === 'accepted' || activeTab === 'drafts') && (
                  <TableHead className="h-9 w-24 text-right" style={{ fontSize: '12px' }}>我方报价</TableHead>
                )}
                {activeTab === 'quoted' && (
                  <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>报价日期</TableHead>
                )}
                {activeTab === 'accepted' && (
                  <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>接受日期</TableHead>
                )}
                {activeTab === 'drafts' && (
                  <TableHead className="h-9 w-28" style={{ fontSize: '12px' }}>保存日期</TableHead>
                )}
                <TableHead className="h-9 w-20" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 w-40 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getCurrentRFQs().length > 0 ? (
                getCurrentRFQs().map((item) => {
                  const statusConfig = getStatusConfig(item.status);
                  const isDraft = activeTab === 'drafts';
                  const rfq = isDraft ? item : item;
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-blue-600">
                            {isDraft 
                              ? item.xjNumber || item.rfqId 
                              : item.supplierXjNo || item.xjNumber || item.id}
                          </p>
                          <p className="text-xs text-gray-500">{isDraft ? item.savedDate : item.createdDate}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div>
                          <p className="font-medium text-gray-900">{item.product}</p>
                          <p className="text-xs text-gray-500">{item.specifications}</p>
                          {item.customerNote && item.priority === 'high' && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {item.customerNote}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <p className="font-medium text-gray-900">{item.customerRegion}</p>
                      </TableCell>
                      <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                        <span className="font-medium">{item.quantity.toLocaleString()}</span>
                        <span className="text-gray-500 ml-1">件</span>
                      </TableCell>
                      <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                        <span className="font-medium text-gray-900">${item.targetPrice.toFixed(2)}</span>
                      </TableCell>
                      {activeTab !== 'drafts' && (
                        <TableCell className="py-3" style={{ fontSize: '12px' }}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className={item.priority === 'high' ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                              {item.deadline}
                            </span>
                          </div>
                        </TableCell>
                      )}
                      {(activeTab === 'quoted' || activeTab === 'accepted' || activeTab === 'drafts') && (
                        <TableCell className="py-3 text-right" style={{ fontSize: '13px' }}>
                          <div>
                            <p className="font-bold text-green-600">
                              ${(isDraft ? item.unitPrice : item.quotedPrice).toFixed(2)}
                            </p>
                            {item.targetPrice && (
                              <p className="text-xs text-gray-500">
                                {((isDraft ? item.unitPrice : item.quotedPrice) < item.targetPrice ? '低于' : '高于')}目标
                              </p>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {activeTab === 'quoted' && (
                        <TableCell className="py-3" style={{ fontSize: '12px' }}>
                          <span className="text-gray-600">{item.quotedDate}</span>
                        </TableCell>
                      )}
                      {activeTab === 'accepted' && (
                        <TableCell className="py-3" style={{ fontSize: '12px' }}>
                          <span className="text-green-600 font-medium">{item.acceptedDate}</span>
                        </TableCell>
                      )}
                      {activeTab === 'drafts' && (
                        <TableCell className="py-3" style={{ fontSize: '12px' }}>
                          <span className="text-gray-600">{item.savedDate}</span>
                        </TableCell>
                      )}
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          {activeTab === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  setDetailRFQ(item);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                详情
                              </Button>
                              <Dialog open={quoteDialogOpen && selectedRFQ?.id === item.id} onOpenChange={setQuoteDialogOpen}>
                                <Button
                                  size="sm"
                                  className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                                  onClick={() => {
                                    setSelectedRFQ(item);
                                    setQuoteDialogOpen(true);
                                  }}
                                >
                                  <Calculator className="w-3 h-3 mr-1" />
                                  报价
                                </Button>
                                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>提交报价 - {item.supplierXjNo || item.xjNumber || item.id}</DialogTitle>
                                    <DialogDescription>
                                      为 {item.productName || item.product} 提供详细报价（含价格梯度）
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <QuotationDocument
                                    rfq={item}
                                    onSubmit={handleSubmitQuote}
                                  />

                                  <DialogFooter>
                                    <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                                      取消
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          {activeTab === 'drafts' && (
                            <Dialog 
                              open={quoteDialogOpen && selectedRFQ?.id === item.rfqId && editingDraft?.id === item.id} 
                              onOpenChange={(open) => {
                                setQuoteDialogOpen(open);
                                if (!open) setEditingDraft(null);
                              }}
                            >
                              <Button
                                size="sm"
                                className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                                onClick={() => {
                                  const rfq = supplierRFQs.find(r => r.id === item.rfqId);
                                  if (rfq) {
                                    setSelectedRFQ(rfq);
                                    setEditingDraft(item);
                                    setQuoteDialogOpen(true);
                                  }
                                }}
                              >
                                <Calculator className="w-3 h-3 mr-1" />
                                继续编辑
                              </Button>
                              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>继续编辑报价 - {item.rfqId}</DialogTitle>
                                  <DialogDescription>
                                    为 {item.product} 提供详细报价
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <QuotationDocument
                                  rfq={{
                                    id: item.rfqId,
                                    product: item.product,
                                    specifications: item.specifications,
                                    quantity: item.quantity,
                                    targetPrice: item.targetPrice
                                  }}
                                  initialData={item.fullQuoteData}
                                  onSubmit={handleSubmitQuote}
                                />

                                <DialogFooter>
                                  <Button variant="outline" onClick={() => {
                                    setQuoteDialogOpen(false);
                                    setEditingDraft(null);
                                  }}>
                                    取消
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {(activeTab === 'quoted' || activeTab === 'accepted') && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleViewQuotation(item)}>
                              <Eye className="w-3 h-3 mr-1" />
                              查看报价
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-12 h-12 mb-2" />
                      <p style={{ fontSize: '13px' }}>
                        {activeTab === 'pending' && '暂无待报价询价单'}
                        {activeTab === 'drafts' && '暂无报价草稿'}
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

      {/* 审核确认对话框 */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认提交报价</AlertDialogTitle>
            <AlertDialogDescription>
              请确认报价信息无误后提交给COSUN管理员审核
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingQuoteData && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
                <div>
                  <p className="text-xs text-gray-600">询价单号</p>
                  <p className="text-sm font-medium font-mono text-blue-600">{selectedRFQ?.supplierXjNo || selectedRFQ?.xjNumber || selectedRFQ?.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">产品名称</p>
                  <p className="text-sm font-medium">{selectedRFQ?.productName || selectedRFQ?.product}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-600 mb-1">报价信息</p>
                  <p className="text-sm text-gray-800">
                    报价单已准备完成，请确认后提交
                  </p>
                </div>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmitQuote} className="bg-orange-600 hover:bg-orange-700">
              确认提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>询价单详情 - {detailRFQ?.id}</DialogTitle>
            <DialogDescription>
              详细信息如下
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">产品名称</p>
                <p className="text-sm font-medium">{detailRFQ?.product}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">规格</p>
                <p className="text-sm font-medium">{detailRFQ?.specifications}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">需求数量</p>
                <p className="text-sm font-medium">{detailRFQ?.quantity.toLocaleString()} 件</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">目标价格</p>
                <p className="text-sm font-medium">${detailRFQ?.targetPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">截止日期</p>
                <p className="text-sm font-medium">{detailRFQ?.deadline}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">客户备注</p>
                <p className="text-sm font-medium">{detailRFQ?.customerNote}</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 供应商报价单预览对话框 */}
      <Dialog open={showQuotationPreview} onOpenChange={setShowQuotationPreview}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>供应商报价单预览</DialogTitle>
                <DialogDescription>
                  报价单号: {currentQuotationData?.quotationNo}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintQuotation}>
                  <Printer className="w-4 h-4 mr-2" />
                  打印
                </Button>
                <Button size="sm" className="bg-[#F96302] hover:bg-[#F96302]/90" onClick={handleDownloadQuotationPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  下载PDF
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            {currentQuotationData && (
              <SupplierQuotationDocument
                ref={quotationDocRef}
                data={currentQuotationData}
              />
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setShowQuotationPreview(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🧹 数据清理工具 - 供应商专用 */}
      <SupplierDataCleaner />
    </div>
  );
}