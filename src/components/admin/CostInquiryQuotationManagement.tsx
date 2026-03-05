import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { Search, Filter, Eye, Send, CheckCircle, AlertCircle, Package, FileText, Trash2, Plus, HelpCircle, Clock, TrendingUp, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { PurchaseRequirementView } from './PurchaseRequirementView';
import { SubmitToProcurementDialog } from './SubmitToProcurementDialog';
import QuoteCreationIntelligent from './QuoteCreationIntelligent'; // 🔥 智能报价创建
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext';
import { useInquiry } from '../../contexts/InquiryContext';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'; // 🔥 新增：销售报价Context
import { nextQRNumber, nextQTNumber } from '../../utils/xjNumberGenerator'; // 🔥 新增：生成QT/QR编号
import { getCurrentUser } from '../../utils/dataIsolation';
import { purchaseRequirementService, salesQuotationService } from '../../lib/supabaseService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatDocumentNumber, getDocumentLevel, getDocumentColorClass } from '../../utils/documentNumbering'; // 🔥 新增：7级编号体系辅助函数

type TabType = 'all' | 'pending' | 'partial' | 'processing' | 'completed';

interface CostInquiryQuotationManagementProps {
  onSwitchToQuotationManagement?: (qtNumber: string) => void; // 🔥 切换到报价管理并高亮指定单号
}

export function CostInquiryQuotationManagement({ onSwitchToQuotationManagement }: CostInquiryQuotationManagementProps = {}) {
  const { inquiries } = useInquiry();
  const purchaseContext = usePurchaseRequirements();
  const purchaseRequirements = purchaseContext.requirements;
  const addPurchaseRequirement = purchaseContext.addRequirement;
  const updatePurchaseRequirement = purchaseContext.updateRequirement;
  const deleteRequirement = purchaseContext.deleteRequirement;
  const refreshPurchaseRequirementsFromApi = purchaseContext.refreshPurchaseRequirementsFromApi;
  const currentUser = getCurrentUser();
  const [refreshing, setRefreshing] = useState(false);
  
  // 🔥 新增：销售报价Context
  const { addQuotation: addSalesQuotation, updateQuotation: updateSalesQuotation, quotations: allSalesQuotations } = useSalesQuotations();

  const [filterStatus, setFilterStatus] = useState<TabType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // 🔥 查看采购需求单详情（客户询价单内容）
  const [showSubmitDialog, setShowSubmitDialog] = useState(false); // 🔥 提交采购弹窗
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [selectedINQ, setSelectedINQ] = useState<any>(null);
  
  // 🔥 批量选择和删除状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 🔥 智能报价创建弹窗状态
  const [showQuoteCreation, setShowQuoteCreation] = useState(false);
  const [selectedQRForQuote, setSelectedQRForQuote] = useState<any>(null);
  

  // 🔥 筛选业务员自己创建的QR（Admin可以看所有）
  const myQRs = useMemo(() => {
    // Admin可以看所有QR，业务员只能看自己创建的且在自己负责区域的
    const isAdmin = currentUser?.type === 'admin';
    if (isAdmin) return purchaseRequirements;

    const userRegion = currentUser?.region;
    return purchaseRequirements.filter(qr =>
      qr.createdBy === currentUser?.email && qr.region === userRegion
    );
  }, [purchaseRequirements, currentUser]);

  // 🔥 根据状态和搜索词筛选
  const filteredQRs = useMemo(() => {
    let filtered = myQRs;

    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(qr => qr.status === filterStatus);
    }

    // 搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(qr =>
        qr.requirementNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.sourceInquiryNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.items.some((item: any) => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 按创建时间倒序
    return filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }, [myQRs, filterStatus, searchTerm]);

  // 🔥 获取可用的客户询价单（已提交且尚未创建QR的）
  const availableINQs = useMemo(() => {
    return inquiries.filter(inq => {
      // 只显示已提交的询价
      if (!inq.isSubmitted) return false;
      
      // 检查是否已经创建过QR
      const hasQR = purchaseRequirements.some(qr => qr.sourceInquiryNumber === inq.inquiryNumber);
      return !hasQR;
    });
  }, [inquiries, purchaseRequirements]);

  // 🔥 状态配置
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending:    { label: '待处理', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    draft:      { label: '草稿',   color: 'bg-gray-100 text-gray-600 border-gray-200' },
    submitted:  { label: '已提交', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    partial:    { label: '已提交', color: 'bg-blue-100 text-blue-600 border-blue-200' },
    processing: { label: '处理中', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    quoted:     { label: '已报价', color: 'bg-purple-100 text-purple-600 border-purple-200' },
    completed:  { label: '已完成', color: 'bg-green-100 text-green-600 border-green-200' },
    cancelled:  { label: '已取消', color: 'bg-red-100 text-red-600 border-red-200' },
  };
  const getStatusConfig = (status: string) =>
    statusConfig[status] ?? { label: status || '未知', color: 'bg-gray-100 text-gray-500 border-gray-200' };

  // 🔥 创建采购需求（从INQ）
  const handleCreateQRFromINQ = async (inq: any) => {
    console.log('🔍 [创建QR] 原始询价单数据:', inq);
    console.log('  - buyerInfo:', inq.buyerInfo);
    console.log('  - products:', inq.products);
    console.log('  - products[0].image:', inq.products[0]?.image);
    
    const newQR = {
      id: `qr_${Date.now()}`,
      requirementNo: await nextQRNumber(
        inq.region === 'South America' ? 'SA' : inq.region === 'Europe & Africa' ? 'EA' : 'NA'
      ),
      source: '销售订单',
      sourceInquiryNumber: inq.inquiryNumber || `INQ-${inq.id}`,
      requiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgency: 'medium' as const,
      status: 'pending' as const,
      createdBy: currentUser?.email || '',
      createdDate: new Date().toISOString(),
      region: inq.region,
      // 🔥 同步客户信息（从buyerInfo）
      customer: {
        companyName: inq.buyerInfo?.companyName || 'N/A',
        contactPerson: inq.buyerInfo?.contactPerson || 'N/A',
        email: [inq.buyerInfo?.email, inq.userEmail].find(e => e && e !== 'N/A' && e.includes('@')) || inq.userEmail || '',
        phone: inq.buyerInfo?.phone || 'N/A',
        mobile: inq.buyerInfo?.mobile || '',
        address: inq.buyerInfo?.address || 'N/A',
        website: inq.buyerInfo?.website || '',
        businessType: inq.buyerInfo?.businessType || ''
      },
      items: inq.products.map((p: any) => ({
        id: p.id,
        productName: p.productName, // 🔥 修复：CartItem的字段是productName，不是name
        modelNo: p.modelNo || '-', // 🔥 修复：CartItem的字段是modelNo，不是model
        specification: p.specification || '-',
        quantity: p.quantity,
        unit: p.unit || 'PCS',
        targetPrice: p.unitPrice || 0, // 🔥 修复：CartItem的字段是unitPrice，不是price
        targetCurrency: 'USD',
        hsCode: p.hsCode || '',
        imageUrl: p.image || '', // 🔥 CartItem的字段是image
        remarks: p.notes || ''
      })),
      specialRequirements: inq.message || ''
    };

    console.log('✅ [创建QR] 新建的采购需求:', newQR);
    console.log('  - customer:', newQR.customer);
    console.log('  - items[0]:', newQR.items[0]);

    addPurchaseRequirement(newQR);
    toast.success(`✅ 成功创建采购需求！单号：${newQR.requirementNo}`);
    setShowCreateModal(false);
    setSelectedINQ(null);
  };

  // 🔥 提交给采购部门 - 打开提交弹窗
  const handleOpenSubmitDialog = (qr: any) => {
    setSelectedQR(qr);
    setShowSubmitDialog(true);
  };

  // 🔥 确认提交给采购部门（调用后端API）
  const handleConfirmSubmit = async (data: any) => {
    if (!selectedQR) return;
    
    // 🔥 检查是否是本地创建的数据（未同步到后端）
    const isLocalOnlyData = selectedQR.id && selectedQR.id.startsWith('qr_');
    
    if (isLocalOnlyData) {
      // 本地数据，需要先创建到后端再更新
      console.log('⚠️ [提交到采购部门] 检测到本地数据，先同步到后端');
      toast.info('正在同步数据到服务器...');
      
      try {
        // 先创建到后端
        const createData = {
          source_inquiry_number: selectedQR.sourceInquiryNumber || selectedQR.requirementNo,
          region: selectedQR.region || 'North America',
          required_date: selectedQR.requiredDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          urgency: selectedQR.urgency || 'medium',
          special_requirements: selectedQR.specialRequirements || '',
          customer: selectedQR.customer || {
            companyName: 'N/A',
            contactPerson: 'N/A',
            email: 'N/A',
            phone: 'N/A'
          },
          items: (selectedQR.items || []).map((item: any) => ({
            productName: item.productName || 'Unknown Product',
            modelNo: item.modelNo || '',
            specification: item.specification || '',
            quantity: item.quantity || 1,
            unit: item.unit || 'PCS',
            targetPrice: item.targetPrice || 0,
            targetCurrency: item.targetCurrency || 'USD',
            hsCode: item.hsCode || '',
            imageUrl: item.imageUrl || '',
            remarks: item.remarks || ''
          }))
        };

        const createResponse: any = await purchaseRequirementService.upsert(createData) || createData;

        updatePurchaseRequirement(selectedQR.id, {
          ...selectedQR,
          id: createResponse.id,
          requirementNumber: createResponse.requirementNumber || createResponse.requirementNo,
        });
        
        selectedQR.id = createResponse.id;
        selectedQR.requirementNo = createResponse.requirementNumber || createResponse.requirementNo;
      } catch (syncError: any) {
        console.error('❌ [提交到采购部门] 同步失败:', syncError);
        toast.error(`❌ 数据同步失败: ${syncError.message || '未知错误'}`);
        return;
      }
    }
    
    try {
      // 准备请求数据
      const requestData: any = {
        status: 'partial',
        expected_quote_date: data.expectedQuoteDate,
        delivery_date: data.deliveryDate,
        payment_terms: data.paymentTerms,
        trade_terms: data.tradeTerms,
        target_cost_range: data.targetCostRange,
        quality_requirements: data.qualityRequirements,
        packaging_requirements: data.packagingRequirements,
        remarks: data.remarks,
      };

      // 如果产品数量或备注有修改，包含items更新
      if (data.products && data.products.length > 0) {
        requestData.items = data.products.map((p: any) => ({
          id: p.id,
          quantity: p.editableQuantity || p.quantity,
          remarks: p.editableRemarks || p.remarks
        }));
      }
      
      console.log('📤 [提交到采购部门] 发送请求:', {
        requirementUid: selectedQR.id,
        requestData
      });
      
      const response: any = await purchaseRequirementService.upsert({ id: selectedQR.id, ...requestData }) || {};
      
      const updateData = {
        status: 'partial' as const,
        submittedAt: new Date().toISOString(),
        ...requestData,
      };
      
      updatePurchaseRequirement(selectedQR.id, updateData as any);
      toast.success(`✅ 已提交给采购部门！单号：${selectedQR.requirementNo}`);
      setShowSubmitDialog(false);
      setSelectedQR(null);
    } catch (error: any) {
      console.error('❌ [提交到采购部门] 失败:', error);
      toast.error(`❌ 提交失败: ${error.message || '未知错误'}`);
    }
  };

  // 🔥 查看采购需求单详情（客户询价单内容）
  const handleViewRequirement = (qr: any) => {
    setSelectedQR(qr);
    setShowViewModal(true);
  };

  // 🔥 创建销售报价（从QR）
  const handleCreateSalesQuotation = (qr: any) => {
    // 🔥 修正：检查purchaserFeedback而不是selectedSupplier
    if (!qr.purchaserFeedback || !qr.purchaserFeedback.products || qr.purchaserFeedback.products.length === 0) {
      toast.error('❌ 采购成本尚未反馈，无法创建销售报价');
      return;
    }

    // 🔥 打开智能报价创建弹窗
    setSelectedQRForQuote(qr);
    setShowQuoteCreation(true);
  };
  
  // 🔥 新增：下推报价管理（从QR创建业务员销售报价单QT）
  const handlePushToQuotationManagement = async (qr: any) => {
    console.log('🔽🔽🔽 [开始] 下推报价管理 🔽🔽🔽');
    console.log('1️⃣ 采购需求单号:', qr.requirementNo);
    console.log('2️⃣ addSalesQuotation函数:', addSalesQuotation);
    console.log('3️⃣ addSalesQuotation类型:', typeof addSalesQuotation);
    
    try {
      // 🔥 检查是否有采购成本反馈
      if (!qr.purchaserFeedback || !qr.purchaserFeedback.products || qr.purchaserFeedback.products.length === 0) {
        console.error('❌ 采购成本尚未反馈');
        toast.error('❌ 采购成本尚未反馈，无法下推到报价管理！');
        return;
      }
      console.log('✅ 采购成本反馈检查通过');
      
      // 🔥 智能检查是否已经下推过（检查标记 AND 是否真的有QT）
      if (qr.pushedToQuotation) {
        // 检查是否真的有对应的QT
        const existingQT = allSalesQuotations.find(qt => qt.qrNumber === qr.requirementNo);
        
        if (existingQT) {
          // 真的有QT，不允许重复下推
          console.warn('⚠️ 此采购需求已下推过，且找到对应的QT:', existingQT.qtNumber);
          toast.info(`ℹ️ 此采购需求已下推到报价管理，QT单号：${existingQT.qtNumber}，请前往报价管理模块查看`);
          return;
        } else {
          // 有标记但没有QT，说明之前创建失败，允许重新下推
          console.warn('⚠️ 检测到pushedToQuotation标记，但未找到对应的QT，允许重新下推');
          console.log('  - 将清除pushedToQuotation标记并重新创建');
          toast.info('检测到之前下推失败，正在重新创建销售报价单...');
        }
      }
      console.log('✅ 未下推过（或之前失败），可以继续');
      
      // 🔥 区域代码映射为完整区域名称
      const regionMap: Record<string, 'North America' | 'South America' | 'Europe & Africa'> = {
        'NA': 'North America',
        'SA': 'South America',
        'EA': 'Europe & Africa',
        'EU': 'Europe & Africa',
        'North America': 'North America',
        'South America': 'South America',
        'Europe & Africa': 'Europe & Africa'
      };
      
      const fullRegion = regionMap[qr.region] || 'North America';
      console.log('4️⃣ 区域映射:', { original: qr.region, mapped: fullRegion });
      
      // 🔥 自动创建draft状态的业务员销售报价单（QT）
      console.log('5️⃣ 准备生成QT编号...');
      const regionCode = qr.region === 'South America' ? 'SA' : qr.region === 'Europe & Africa' ? 'EA' : 'NA';
      const qtNumber = await nextQTNumber(regionCode);
      console.log('6️⃣ QT编号生成成功:', qtNumber);
      
      console.log('📋 准备创建销售报价单:', {
        qtNumber,
        qrNumber: qr.requirementNo,
        inqNumber: qr.sourceInquiryNumber,
        region: qr.region,
        fullRegion: fullRegion,
        customerInfo: qr.customer,
        itemsCount: qr.items.length,
        feedbackProductsCount: qr.purchaserFeedback.products.length
      });
      
      // 🔥 映射产品项：合并QR产品信息和采购反馈成本
      const quotationItems = qr.items.map((item: any) => {
        // 🔥 从采购反馈中查找对应产品的成本信息
        const feedbackProduct = qr.purchaserFeedback.products.find(
          (fp: any) => fp.productId === item.id || fp.productName === item.productName
        );
        
        if (!feedbackProduct) {
          console.warn('⚠️ 未找到产品的成本反馈:', item.productName);
        }
        
        // 成本单价（从采购反馈）
        const rawCostPrice = feedbackProduct?.costPrice || 0;
        const feedbackCurrency = (feedbackProduct?.currency || 'CNY').toUpperCase();

        // 供应商报价通常为 CNY；需换算为销售报价的 USD
        // 使用报价单 currency 字段，默认销售报价为 USD
        const targetCurrency = 'USD';
        // 固定汇率兜底（实际环境应从汇率服务获取）
        const CNY_TO_USD = 1 / 7.2;
        const costPriceUSD = feedbackCurrency === 'CNY' || feedbackCurrency === 'RMB'
          ? rawCostPrice * CNY_TO_USD
          : feedbackCurrency === 'USD'
            ? rawCostPrice
            : rawCostPrice; // 其他货币原样保留，如有需要可扩展

        // 🔥 默认利润率18%计算销售价（基于 USD 成本）
        const defaultMargin = 0.18;
        const salesPrice = costPriceUSD * (1 + defaultMargin);
        const profit = salesPrice - costPriceUSD;
        
        // 总成本和总价（均为 USD）
        const totalCost = costPriceUSD * item.quantity;
        const totalPrice = salesPrice * item.quantity;
        
        console.log(`  - ${item.productName}:`, {
          quantity: item.quantity,
          rawCostPrice,
          feedbackCurrency,
          costPriceUSD: costPriceUSD.toFixed(4),
          salesPrice: salesPrice.toFixed(4),
          margin: (defaultMargin * 100) + '%'
        });
        
        return {
          id: item.id,
          productName: item.productName,
          modelNo: item.modelNo || '-',
          specification: item.specification || '-',
          quantity: item.quantity,
          unit: item.unit || 'PCS',
          costPrice: costPriceUSD,
          salesPrice: salesPrice,
          profitMargin: defaultMargin,
          profit: profit,
          totalCost: totalCost,
          totalPrice: totalPrice,
          currency: targetCurrency,
          selectedSupplier: qr.purchaserFeedback.linkedSupplier || 'N/A',
          selectedSupplierName: qr.purchaserFeedback.linkedSupplier || 'N/A',
          selectedBJ: qr.purchaserFeedback.linkedBJ || 'N/A',
          moq: feedbackProduct?.moq,
          leadTime: feedbackProduct?.leadTime || '',
          remarks: item.remarks || '',
          hsCode: item.hsCode || ''
        };
      });
      
      // 🔥 计算汇总金额
      const totalCost = quotationItems.reduce((sum: number, item: any) => sum + item.totalCost, 0);
      const totalPrice = quotationItems.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
      const totalProfit = totalPrice - totalCost;
      const profitRate = totalCost > 0 ? totalProfit / totalCost : 0;
      
      // 🔥 创建销售报价单（QT）- draft状态
      const newQuotation = {
        id: `qt_${Date.now()}`,
        qtNumber: qtNumber,
        
        // 关联单据
        qrNumber: qr.requirementNo,
        inqNumber: qr.sourceInquiryNumber || '',
        
        // 客户信息（从QR）
        customerCompany: qr.customer?.companyName || 'N/A',
        customerName: qr.customer?.contactPerson || 'N/A',
        customerEmail: [qr.customer?.email, qr.sourceInquiry?.userEmail, qr.sourceInquiry?.buyerInfo?.email].find(e => e && e !== 'N/A' && e.includes('@')) || qr.customer?.email || '',
        customerPhone: qr.customer?.phone || '',
        customerAddress: qr.customer?.address || '',
        
        // 业务信息
        region: qr.region || 'NA',
        salesPerson: currentUser?.email || '',
        salesPersonName: currentUser?.name || '',
        
        // 产品清单
        items: quotationItems,
        
        // 金额汇总
        totalCost: totalCost,
        totalPrice: totalPrice,
        totalProfit: totalProfit,
        profitRate: profitRate,
        currency: 'USD',
        
        // 商务条款（从采购反馈）
        paymentTerms: qr.purchaserFeedback.paymentTerms || 'T/T 30天',
        deliveryTerms: qr.purchaserFeedback.deliveryTerms || 'FOB',
        deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45天后
        
        // 状态（默认draft草稿）
        approvalStatus: 'draft' as const,
        customerStatus: 'not_sent' as const,
        
        // 审批链（空数组，待提交审批时填充）
        approvalChain: [],
        
        // 报价有效期（30天）
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        
        // 版本管理
        version: 1,
        
        // 时间戳
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.email || '',
        
        // 备注
        notes: qr.purchaserFeedback.purchaserRemarks || ''
      };
      
      console.log('✅ 创建的销售报价单:', newQuotation);
      console.log('  - QT编号:', newQuotation.qtNumber);
      console.log('  - 产品数量:', quotationItems.length);
      console.log('  - 总成本:', totalCost.toFixed(2));
      console.log('  - 总报价:', totalPrice.toFixed(2));
      console.log('  - 总利润:', totalProfit.toFixed(2));
      console.log('  - 利润率:', (profitRate * 100).toFixed(2) + '%');
      
      // 🔥 调用后端接口创建报价单
      console.log('7️⃣ 准备调用 POST /api/sales-quotations...');
      
      try {
        await salesQuotationService.upsert(newQuotation);
        
        addSalesQuotation(newQuotation);
        
        // 🔥 标记QR为已下推
        updatePurchaseRequirement(qr.id, {
          pushedToQuotation: true,
          pushedToQuotationDate: new Date().toISOString(),
          pushedBy: currentUser?.email || '',
          quotationNumber: newQuotation.qtNumber
        });
        
        console.log(`✅ [溯源关联] 已将QT编号回写到QR记录: ${qr.requirementNo}.quotationNumber = ${newQuotation.qtNumber}`);
        
        toast.success(`✅ 成功下推到报价管理！销售报价单号：${newQuotation.qtNumber}`, {
          description: `已自动创建草稿状态的报价单，默认利润率18%，请前往报价管理模块查看和编辑`,
          duration: 5000
        });
        
        // 🔥 切换到报价管理并高亮指定单号
        if (onSwitchToQuotationManagement) {
          onSwitchToQuotationManagement(newQuotation.qtNumber);
        }
      } catch (err: any) {
        console.error('❌❌❌ POST /api/sales-quotations 调用失败:', err);
        toast.error(`❌ 下推失败: ${err.message || '未知错误'}`);
        throw err;
      }
    } catch (error) {
      console.error('🔥 [错误] 下推报价管理时发生错误:', error);
      toast.error('❌ 下推报价管理时发生错误，请稍后再试');
    }
  };
  
  // 🔥 批量删除处理函数
  const handleBulkDelete = () => {
    const visibleSelectedIds = Array.from(selectedIds).filter((id) =>
      filteredQRs.some((qr) => qr.id === id),
    );

    if (visibleSelectedIds.length === 0) {
      toast.error('请先选择要删除的采购需求单');
      return;
    }

    if (window.confirm(`确认要删除选中的 ${visibleSelectedIds.length} 条采购需求单吗？此操作无法撤销！`)) {
      visibleSelectedIds.forEach(id => {
        deleteRequirement(id);
      });
      setSelectedIds(new Set());
      toast.success(`✅ 已成功删除 ${visibleSelectedIds.length} 条采购需求单`);
    }
  };

  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredQRs.map(qr => qr.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // 🔥 单选处理
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };
  
  // 计算全选状态
  const isAllSelected = filteredQRs.length > 0 && selectedIds.size === filteredQRs.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < filteredQRs.length;

  useEffect(() => {
    const visibleIds = new Set(filteredQRs.map((qr) => qr.id));
    const nextSelected = new Set(Array.from(selectedIds).filter((id) => visibleIds.has(id)));
    if (nextSelected.size !== selectedIds.size) {
      setSelectedIds(nextSelected);
    }
  }, [filteredQRs, selectedIds]);

  return (
    <div>
      {/* 📋 成本询报表格 - 参考询价管理样式 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          {/* 🎯 紧凑型单行筛选栏 */}
          <div className="px-5 py-3 bg-gray-50">
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索采购需求单号、来源询价单号、产品名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              {/* 🔥 刷新：拉取最新采购需求，采购员接受报价后业务员点此可看到「采购反馈」 */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-blue-600 hover:bg-blue-50"
                style={{ fontSize: '12px' }}
                disabled={refreshing}
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    await refreshPurchaseRequirementsFromApi();
                    toast.success('已刷新，若有采购员接受的报价会显示在「采购反馈」列');
                  } catch {
                    toast.error('刷新失败，请稍后再试');
                  } finally {
                    setRefreshing(false);
                  }
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? '刷新中...' : '刷新'}
              </Button>

              {/* 🔥 批量删除按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-40"
                style={{ fontSize: '12px' }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                批量删除 {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>

              {/* 状态筛选 */}
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-white">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" style={{ fontSize: '12px' }}>全部状态</SelectItem>
                  <SelectItem value="pending" style={{ fontSize: '12px' }}>草稿</SelectItem>
                  <SelectItem value="partial" style={{ fontSize: '12px' }}>已提交</SelectItem>
                  <SelectItem value="processing" style={{ fontSize: '12px' }}>处理中</SelectItem>
                  <SelectItem value="completed" style={{ fontSize: '12px' }}>已完成</SelectItem>
                </SelectContent>
              </Select>

              {/* 新建采购需求按钮 */}
              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-9 px-4 text-white hover:opacity-90 text-xs"
                style={{ backgroundColor: '#F96302' }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                新建采购需求
              </Button>
            </div>
          </div>
        </div>

        {/* 📊 表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="h-9 w-16" style={{ fontSize: '12px' }}>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="全选"
                    />
                    <span>序号</span>
                  </div>
                </TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>
                  <div className="flex items-center gap-1.5">
                    <span>采购需求单号</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-2 p-1">
                            <p className="font-semibold text-sm">📋 采购需求单（QR）定义：</p>
                            <p className="text-xs leading-relaxed">
                              采购需求单是从客户询价单（INQ）下推生成的内部采购询价单据，用于向采购部门提交成本询价需求。
                            </p>
                            <div className="text-xs space-y-1 pt-2 border-t border-gray-200">
                              <p><span className="font-medium">• 作用：</span>获取供应商成本价格，为销售报价提供依据</p>
                              <p><span className="font-medium">• 编号规则：</span>QR-{'{区域代码}'}-{'{日期}'}-{'{流水号}'}</p>
                              <p><span className="font-medium">• 流转关系：</span>INQ → QR → XJ → BJ → QT → SO → PO</p>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>来源询价单</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>产品信息</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>客户备注</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>创建日期</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>成本反馈</TableHead>
                <TableHead className="h-9" style={{ fontSize: '12px' }}>状态</TableHead>
                <TableHead className="h-9 text-center" style={{ fontSize: '12px' }}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQRs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400 mb-2">暂无采购需求</p>
                    <p className="text-xs text-gray-400">点击右上角"新建采购需求"开始向采购部门询价</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQRs.map((qr, index) => {
                  const config = getStatusConfig(qr.status);
                  // 🔥 修复：检查采购反馈数据（purchaserFeedback）而不是selectedSupplier
                  const hasPurchaserFeedback = qr.purchaserFeedback && qr.purchaserFeedback.status === 'quoted';
                  const isSelected = selectedIds.has(qr.id);

                  return (
                    <TableRow key={qr.id} className="hover:bg-gray-50">
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(qr.id, checked as boolean)}
                            aria-label={`选择 ${qr.requirementNo}`}
                          />
                          <span className="text-gray-500 text-xs">{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '13px' }}>
                        <button
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                          onClick={() => handleViewRequirement(qr)}
                        >
                          {formatDocumentNumber(qr.requirementNo)}
                        </button>
                        {/* 🔥 流转关系标识 */}
                        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <span>来自</span>
                          <span className="text-blue-500 font-mono">{formatDocumentNumber(qr.sourceInquiryNumber || 'N/A')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        {/* 🔥 显客户公司名称 */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-900 font-medium">{qr.customer?.companyName || 'N/A'}</span>
                          <span className="text-xs text-gray-500">{qr.customer?.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs" style={{ fontSize: '13px' }}>
                        <div className="space-y-0.5">
                          {qr.items.slice(0, 2).map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-700 truncate">
                              {item.productName} × {item.quantity} {item.unit}
                            </div>
                          ))}
                          {qr.items.length > 2 && (
                            <div className="text-xs text-gray-400">还有 {qr.items.length - 2} 个产品...</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 max-w-xs" style={{ fontSize: '13px' }}>
                        {qr.specialRequirements ? (
                          <div className="text-xs text-gray-700 truncate" title={qr.specialRequirements}>
                            {qr.specialRequirements}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        <span className="text-gray-600">
                          {new Date(qr.createdDate).toLocaleDateString('zh-CN')}
                        </span>
                      </TableCell>
                      <TableCell className="py-3" style={{ fontSize: '12px' }}>
                        {/* 🔥 修复：显示采购反馈信息（purchaserFeedback）*/}
                        {hasPurchaserFeedback ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              已反馈
                            </span>
                            <span className="text-xs text-gray-500">
                              {qr.purchaserFeedback.products?.length || 0} 个产品
                            </span>
                            {qr.purchaserFeedback.feedbackBy && (
                              <span className="text-xs text-blue-600">
                                采购员: {qr.purchaserFeedback.feedbackBy}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            待反馈
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={`h-5 px-2 text-xs border ${config.color}`}>
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* 查看按钮 */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleViewRequirement(qr)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            查看
                          </Button>

                          {/* 草稿状态：提交按钮 */}
                          {qr.status === 'pending' && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleOpenSubmitDialog(qr)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              提交采购部
                            </Button>
                          )}

                          {/* 已提交状态：已有成本反馈时显示"下推报价管理"，否则同时显示状态提示和下推按钮 */}
                          {qr.status === 'partial' && !hasPurchaserFeedback && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                              onClick={() => handlePushToQuotationManagement(qr)}
                              title="跳过采购反馈，直接下推到报价管理"
                            >
                              <Package className="w-3 h-3 mr-1" />
                              下推报价管理
                            </Button>
                          )}

                          {/* 🔥 已反馈成本：下推到报价管理 */}
                          {hasPurchaserFeedback && (
                            <Button
                              size="sm"
                              className="h-7 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                              onClick={() => handlePushToQuotationManagement(qr)}
                            >
                              <Package className="w-3 h-3 mr-1" />
                              下推报价管理
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 🔥 创建采购需求弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 标题 */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg" style={{ color: '#F96302' }}>➕ 新建采购需求</h2>
              <button onClick={() => { setShowCreateModal(false); setSelectedINQ(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm mb-2 text-gray-700">选择客户询价单</label>
                {availableINQs.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">暂无可用的客户询价单</p>
                    <p className="text-xs text-gray-400 mt-1">所有询价单已创建采购需求，或无已提交的询价单</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableINQs.map(inq => (
                      <div
                        key={inq.id}
                        onClick={() => setSelectedINQ(inq)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedINQ?.id === inq.id
                            ? 'border-2'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={selectedINQ?.id === inq.id ? { borderColor: '#F96302' } : {}}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-sm mb-1">
                              {inq.inquiryNumber || `INQ-${inq.id}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              客户：{inq.buyerInfo?.companyName || inq.userEmail}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(inq.submittedAt || inq.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {inq.products.length} 个产品 • 总价：${inq.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedINQ && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="text-sm mb-2">📦 品清单预览</div>
                  <div className="space-y-1">
                    {selectedINQ.products.slice(0, 3).map((p: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-700">
                        • {p.productName} - {p.quantity} {p.unit || 'PCS'}
                      </div>
                    ))}
                    {selectedINQ.products.length > 3 && (
                      <div className="text-xs text-gray-500">还有 {selectedINQ.products.length - 3} 个产品...</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => { setShowCreateModal(false); setSelectedINQ(null); }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-all text-sm"
              >
                取消
              </button>
              <button
                onClick={() => selectedINQ && handleCreateQRFromINQ(selectedINQ)}
                disabled={!selectedINQ}
                className="px-4 py-2 text-white rounded hover:opacity-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F96302' }}
              >
                创建采购需求
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 提交采购弹窗 */}
      <SubmitToProcurementDialog
        open={showSubmitDialog}
        onClose={() => { setShowSubmitDialog(false); setSelectedQR(null); }}
        requirement={selectedQR}
        onSubmit={handleConfirmSubmit}
      />

      {/* 🔥 查看采购需求单详情弹窗 */}
      {showViewModal && selectedQR && (
        <Dialog open={showViewModal} onOpenChange={() => { setShowViewModal(false); setSelectedQR(null); }}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
            {/* Hidden Title and Description for accessibility */}
            <DialogTitle className="sr-only">采购需求单详情</DialogTitle>
            <DialogDescription className="sr-only">
              查看完整的客户询价单信息和产品详情
            </DialogDescription>
            
            {/* Header with Print button - Floating on top */}
            <div className="absolute top-4 right-16 z-50 flex gap-2 print:hidden">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
                onClick={() => {
                  window.print();
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                打印
              </Button>
            </div>

            {/* Close Button */}
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-colors print:hidden"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </DialogClose>

            {/* Document - Full Screen */}
            <div className="overflow-y-auto max-h-[95vh] bg-gray-100">
              <PurchaseRequirementView requirement={selectedQR} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 🔥 智能报价创建弹窗 */}
      {showQuoteCreation && selectedQRForQuote && (
        <QuoteCreationIntelligent
          requirementNo={selectedQRForQuote.requirementNo}
          requirement={selectedQRForQuote}
          onClose={() => {
            setShowQuoteCreation(false);
            setSelectedQRForQuote(null);
          }}
          onSubmit={(quoteData) => {
            console.log('📤 报价数据已提交:', quoteData);
            console.log('  - totalAmount:', quoteData.totalAmount);
            console.log('  - totalCost:', quoteData.totalCost);
            console.log('  - totalProfit:', quoteData.totalProfit);
            console.log('  - profitMargin:', quoteData.profitMargin);
            console.log('  - items:', quoteData.items);
            console.log('  - items[0]:', quoteData.items?.[0]);
            
            // 🔥 转换为 SalesQuotation 格式并保存到 Context
            const salesQuotation = {
              id: `sq-${Date.now()}`,
              qtNumber: quoteData.qtNumber || quoteData.quoteNo,
              qrNumber: quoteData.qrNumber || quoteData.requirementNo,
              inqNumber: quoteData.inquiryNo || '',
              
              region: quoteData.region || 'NA',
              customerName: quoteData.customerName || '',
              customerEmail: quoteData.customerEmail || '',
              customerCompany: quoteData.customerName || '',
              
              salesPerson: currentUser?.email || '',
              salesPersonName: currentUser?.name || '',
              
              items: quoteData.items || [],
              
              // 🔥 财务汇总数据（使用智能核算的准确数据）
              totalCost: quoteData.totalCost,
              totalPrice: quoteData.totalAmount,
              totalProfit: quoteData.totalProfit,
              profitRate: quoteData.profitMargin,
              totalAmount: quoteData.totalAmount, // 🔥 兼容字段
              
              currency: 'USD',
              paymentTerms: '30% T/T in advance, 70% before shipment',
              deliveryTerms: 'FOB Xiamen',
              deliveryDate: '',
              
              approvalStatus: 'draft' as const,
              approvalChain: [],
              customerStatus: 'not_sent' as const,
              
              validUntil: new Date(Date.now() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              version: 1,
              
              createdAt: quoteData.createdAt || new Date().toISOString(),
              updatedAt: quoteData.updatedAt || new Date().toISOString(),
              notes: quoteData.approvalNotes || ''
            };
            
            console.log('💾 保存到 SalesQuotationContext:', salesQuotation);
            console.log('  - salesQuotation.totalPrice:', salesQuotation.totalPrice);
            console.log('  - salesQuotation.totalCost:', salesQuotation.totalCost);
            console.log('  - salesQuotation.totalProfit:', salesQuotation.totalProfit);
            console.log('  - salesQuotation.profitRate:', salesQuotation.profitRate);
            addSalesQuotation(salesQuotation);
            
            toast.success('报价已创建！', {
              description: `报价单号：${quoteData.quoteNo}\n总额：$${quoteData.totalAmount.toFixed(2)}\n利润率：${quoteData.profitMargin.toFixed(1)}%`,
              duration: 3000
            });
            setShowQuoteCreation(false);
            setSelectedQRForQuote(null);
          }}
        />
      )}
    </div>
  );
}
