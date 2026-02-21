/**
 * 🔥 报价管理 - 业务员销售报价单管理
 *
 * 功能：
 * 显示从成本询报模块“下推报价管理”生成的 draft 状态 QT 报价单，
 * 数据优先从后端接口 /api/sales-quotations 加载，其次使用本地 Context。
 *
 * 流程：
 * 成本询报 → 点击“下推报价管理” → POST /api/sales-quotations → 保存到数据库 →
 * 报价管理 → GET /api/sales-quotations → 显示报价单列表
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { 
  Search, 
  Eye, 
  Edit, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Trash2,
  Calculator,
  FileSignature
} from 'lucide-react';
import { useSalesQuotations } from '../../contexts/SalesQuotationContext';
import { useSalesContracts } from '../../contexts/SalesContractContext'; // 🔥 导入销售合同Context
import { useInquiry } from '../../contexts/InquiryContext'; // 🔥 导入询价Context
import { useQuotations } from '../../contexts/QuotationContext'; // 🔥 导入客户报价Context
import { useOrders } from '../../contexts/OrderContext'; // 🔥 导入订单Context
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext'; // 🔥 导入采购需求Context（用于溯源回写）
import { apiFetchJson } from '../../api/backend-auth'; // 🔥 后端接口调用工具
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import QuoteCreationIntelligent from '../admin/QuoteCreationIntelligent'; // 🔥 智能报价创建
// ❌ 已禁用：文件不存在
// import { CustomerInquiryView } from '../admin/CustomerInquiryView'; // 🔥 客户询价单查看
import { QuotationView } from './QuotationView'; // 🔥 报价单查看（使用文档中心模版）

interface SalesQuotationManagementProps {
  highlightQtNumber?: string; // 🔥 高亮显示的报价单号
  onNavigateToOrders?: () => void; // 🔥 导航到订单管理的回调
  onNavigateToOrdersWithHighlight?: (scNumber: string) => void; // 🔥 导航到订单管理并高亮SC单号
}

export function SalesQuotationManagement({ 
  highlightQtNumber, 
  onNavigateToOrders, 
  onNavigateToOrdersWithHighlight 
}: SalesQuotationManagementProps = {}) {
  const { quotations, deleteQuotation, updateQuotation } = useSalesQuotations();
  const { contracts: salesContracts, createContract, getContractByQuotationNumber } = useSalesContracts(); // 🔥 获取销售合同
  const { inquiries } = useInquiry();
  const { addQuotation: addCustomerQuotation } = useQuotations(); // 🔥 导入客户报价Context
  const { orders, addOrder } = useOrders(); // 🔥 获取订单和添加订单函数
  const { purchaseRequirements, updatePurchaseRequirement } = usePurchaseRequirements(); // 🔥 获取采购需求和更新函数
  const currentUser = getCurrentUser();

  // 🔥 从后端加载报价单列表（只读服务器数据，不读本地）
  const [serverQuotations, setServerQuotations] = useState<any[]>([]);
  const [loadingFromApi, setLoadingFromApi] = useState(false);

  // 🔥 加载数据的函数
  const loadSalesQuotations = React.useCallback(() => {
    setLoadingFromApi(true);
    apiFetchJson<{ quotations: any[] }>('/api/sales-quotations')
      .then((res) => {
        if (Array.isArray(res?.quotations)) {
          console.log('✅ [报价管理] 接口返回数据:', res.quotations.length, '条');
          console.log('  - 接口返回的报价单详情:');
          res.quotations.forEach((qt: any, idx: number) => {
            console.log(`    ${idx + 1}. ${qt.qtNumber} - 业务员: ${qt.salesPerson} - 当前用户: ${currentUser?.email}`);
          });
          setServerQuotations(res.quotations);
        } else {
          setServerQuotations([]);
        }
      })
      .catch((err) => {
        console.error('❌ [SalesQuotationManagement] 加载 /api/sales-quotations 失败:', err);
        setServerQuotations([]); // 🔥 失败时也设为空数组，不读本地数据
      })
      .finally(() => {
        setLoadingFromApi(false);
      });
  }, [currentUser?.email]);

  // 🔥 初始加载
  useEffect(() => {
    loadSalesQuotations();
  }, [loadSalesQuotations]);

  // 🔥 当 highlightQtNumber 变化时（下推后切换过来），重新加载数据
  useEffect(() => {
    if (highlightQtNumber) {
      console.log('🔄 [报价管理] 检测到 highlightQtNumber 变化，重新加载数据:', highlightQtNumber);
      loadSalesQuotations();
    }
  }, [highlightQtNumber, loadSalesQuotations]);
  
  // 🔥 高亮状态（3秒后自动消失）
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (highlightQtNumber) {
      const qt = serverQuotations.find(q => q.qtNumber === highlightQtNumber);
      if (qt) {
        setHighlightedId(qt.id);
        // 3秒后清除高亮
        const timer = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightQtNumber, serverQuotations]);
  
  // 🔥 新增：选中的报价单ID列表
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 新：全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(myQuotations.map(qt => qt.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  // 🔥 新增：单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };
  
  // 🔥 新增：批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的报价单！');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？此操作不可恢复！`)) {
      selectedIds.forEach(id => {
        deleteQuotation(id);
      });
      setSelectedIds([]);
      toast.success(`成功删除 ${selectedIds.length} 个报价单！`);
    }
  };
  
  // 🔥 只使用服务器数据，不读本地数据
  const effectiveQuotations = serverQuotations;

  // 🔥 调试日志
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎯 [SalesQuotationManagement] 组件渲染');
  console.log('  - 服务器返回QT数量:', serverQuotations.length);
  console.log('  - 当前用户:', currentUser?.email, currentUser?.role);
  console.log('  - 🔥 onNavigateToOrders回调:', onNavigateToOrders ? '✅ 已传递' : '❌ 未传递（需要从父组件传递）');
  console.log('  - 🔥 highlightQtNumber:', highlightQtNumber || '(无)');
  
  // 🔥 服务器数据详情
  console.log('  - 服务器返回的QT详情:');
  serverQuotations.forEach((qt, index) => {
    console.log(`    ${index + 1}. QT单号: ${qt.qtNumber}`);
    console.log(`       - 业务员: ${qt.salesPerson}`);
    console.log(`       - 状态: ${qt.approvalStatus}`);
    console.log(`       - QR: ${qt.qrNumber}`);
    console.log(`       - 客户: ${qt.customerCompany}`);
  });
  
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending_approval' | 'approved' | 'rejected'>('all');
  
  // 🔥 新增：弹窗状态
  const [showInquiryView, setShowInquiryView] = useState(false); // 查看客户询价单
  const [showQuotationView, setShowQuotationView] = useState(false); // 🔥 查看报价单（文档模版）
  const [showPriceCalculation, setShowPriceCalculation] = useState(false); // 核算价格
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null); // 当前选中的报价单
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null); // 当前选中的询价单
  
  // 🔥 新增：查看客户询价单
  const handleViewInquiry = (qt: any) => {
    // 根据INQ单号查找对应的客户询价单
    const inquiry = inquiries.find(inq => inq.inquiryNo === qt.inqNumber);
    if (!inquiry) {
      toast.error('未找到对应的客户询价单！');
      return;
    }
    setSelectedInquiry(inquiry);
    setShowInquiryView(true);
  };
  
  // 🔥 新增：查看报价单（使用文档模版）
  const handleViewQuotation = (qt: any) => {
    setSelectedQuotation(qt);
    setShowQuotationView(true);
  };
  
  // 🔥 新增：核算价格（打开智能报价创建弹窗）
  const handleCalculatePrice = (qt: any) => {
    setSelectedQuotation(qt);
    setShowPriceCalculation(true);
  };
  
  // 🔥 新增：申请复核
  const handleSubmitForReview = (qt: any) => {
    console.log('📤 申请报价复核:', qt);
    
    // 判断复核流程（使用totalAmount或totalPrice）
    const amount = qt.totalAmount || qt.totalPrice;
    const requiresDirectorReview = amount >= 20000;
    
    // 更新报价单状态为待复核
    updateQuotation(qt.id, {
      approvalStatus: 'pending_approval', // 重新进入审批流程
      reviewRequested: true, // 标记为复核申请
      reviewRequestedAt: new Date().toISOString(),
      reviewRequestedBy: currentUser?.email
    });
    
    // 显示复核流程提示
    const reviewMessage = requiresDirectorReview
      ? `💰 报价金额：$${amount.toLocaleString()} (≥ $20,000)\n\n📋 复核流程：\n1️⃣ 区域业务主管复核\n2️⃣ 销售总监复核\n\n✅ 双重复核通过后，报价将恢复为已批准状态。`
      : `💰 报价金额：$${amount.toLocaleString()} (< $20,000)\n\n📋 复核流程：\n1️⃣ 区域业务主管复核\n\n✅ 主管复核通过后，报价将恢复为已批准状态。`;
    
    toast.success('✅ 复核申请已提交！', {
      description: reviewMessage,
      duration: 6000
    });
    
    console.log('✅ 报价复核申请成功:', {
      qtNumber: qt.qtNumber,
      amount: amount,
      requiresDirectorReview
    });
  };
  
  // 🔥 新增：提交审批（从草稿提交给主管审批）
  const handleSubmitForApproval = async (qt: any) => {
    console.log('📤 提交审批:', qt);
    
    // 检查是否有报价金额
    const amount = qt.totalAmount || qt.totalPrice;
    if (!amount || amount <= 0) {
      toast.error('❌ 请先核算价格后再提交审批！');
      return;
    }
    
    // 判断审批流程
    const requiresDirectorReview = amount >= 20000;
    
    // 🔥 获取主管信息（根据用户区域获取对应主管）
    const managerEmail = getRegionalManager(currentUser?.region);
    const directorEmail = 'sales.director@cosun.com'; // 销售总监：王强
    
    // 🔥 产品摘要
    const productCount = qt.items.length;
    const productSummary = productCount === 1
      ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit}`
      : `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit} 等 ${productCount} 项产品`;
    
    // 🔥 组装审批链（落库到 sales_quotations.approval_chain）
    const approvalChain = [
      {
        level: 1,
        approverRole: '区域业务主管',
        approverEmail: managerEmail,
        status: 'pending',
      },
      ...(requiresDirectorReview
        ? [{
            level: 2,
            approverRole: '销售总监',
            approverEmail: directorEmail,
            status: 'pending',
          }]
        : []),
    ];

    try {
      // 🔥 调用后端：提交审批（更新 approval_status + approval_chain）
      await apiFetchJson(`/api/sales-quotations/${encodeURIComponent(qt.id)}/submit-approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalChain,
          amount,
        }),
      });

      // 提交后刷新列表（只读服务器数据）
      loadSalesQuotations();
    } catch (e: any) {
      console.error('❌ 提交审批接口失败:', e);
      toast.error(`❌ 提交审批失败: ${e?.message || '未知错误'}`);
      return;
    }
    
    // 显示审批流程提示
    const approvalMessage = requiresDirectorReview
      ? `💰 报价金额：$${amount.toLocaleString()} (≥ $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n2️⃣ 销售总监审批\n\n✅ 双重审批通过后，即可发送给客户。`
      : `💰 报价金额：$${amount.toLocaleString()} (< $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n\n✅ 主管审批通过后，即可发送给客户。`;
    
    toast.success('✅ 报价单已提交审批！', {
      description: approvalMessage,
      duration: 6000
    });
    
    console.log('✅ 提交审批成功:', {
      qtNumber: qt.qtNumber,
      amount: amount,
      requiresDirectorReview,
      managerEmail,
      directorEmail: requiresDirectorReview ? directorEmail : null
    });
  };
  
  // 🔥 新增：发送报价单给客户
  const handleSendToCustomer = async (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📤 [SalesQuotationManagement] 发送报价单给客户');
    console.log('  - QT单号:', qt.qtNumber);
    console.log('  - 客户公司:', qt.customerCompany);
    console.log('  - 客户邮箱:', qt.customerEmail);
    console.log('  - 报价金额:', qt.totalPrice || qt.totalAmount);
    console.log('  - 完整QT对象:', qt);
    
    // 🔥 验证客户邮箱
    if (!qt.customerEmail || qt.customerEmail === 'N/A' || qt.customerEmail === 'customer@example.com') {
      console.error('❌ [SalesQuotationManagement] 客户邮箱无效！');
      toast.error('❌ 客户邮箱无效，无法发送报价单！');
      return;
    }
    
    try {
      await apiFetchJson<{ message: string; quotation: any }>(`/api/sales-quotations/${encodeURIComponent(qt.id || qt.qtNumber)}/send-to-customer`, {
        method: 'PATCH',
      });

      // 刷新列表（只读服务器数据）
      loadSalesQuotations();

      toast.success('✅ 报价单已成功发送给客户！', {
        description: `客户 ${qt.customerCompany} (${qt.customerEmail}) 现在可以在 Customer Portal 中查看报价单 ${qt.qtNumber}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ [SalesQuotationManagement] 发送报价单接口失败:', error);
      toast.error(`❌ 发送失败: ${error?.message || '未知错误'}`);
    }
  };
  
  // 🔥 处理生成销售合同
  const handleGenerateContract = (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥 [handleGenerateContract] 开始生成销售合同');
  };
  
  // 🔥 新增：下推生成销售合同
  const handlePushToContract = async (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥 [handlePushToContract] 开始下推生成销售合同');
    console.log('  - QT单号:', qt.qtNumber);
    console.log('  - 客户公司:', qt.customerCompany);
    console.log('  - 报价金额:', qt.totalPrice || qt.totalAmount);
    console.log('  - 完整QT对象:', qt);
    
    // 🔥 检查是否已经生成过合同
    const existingContract = getContractByQuotationNumber(qt.qtNumber);
    if (existingContract) {
      console.log('⚠️ [handlePushToContract] 已存在关联的合同:', existingContract.contractNumber);
      toast.warning('该报价单已生成销售合同！', {
        description: `合同编号：${existingContract.contractNumber}`,
        duration: 3000
      });
      
      // 导航到订单管理并高亮显示合同
      if (onNavigateToOrdersWithHighlight) {
        onNavigateToOrdersWithHighlight(existingContract.contractNumber);
      } else if (onNavigateToOrders) {
        onNavigateToOrders();
      }
      return;
    }
    
    try {
      const resp = await apiFetchJson<{ message: string; contract: any; quotation: any }>(
        `/api/sales-quotations/${encodeURIComponent(qt.id || qt.qtNumber)}/push-to-contract`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            remarks: qt.remarks || '',
            portOfDestination: qt.portOfDestination || '',
            packing: qt.packing || '',
            // ✅ 支持 Admin token 切换业务员视角下推
            asEmail: currentUser?.email || undefined,
          }),
        }
      );

      const contractNumber = resp?.contract?.contractNumber;
      if (!contractNumber) {
        toast.error('❌ 下推失败：接口未返回合同编号');
        return;
      }

      // 刷新报价列表（只读服务器数据）
      loadSalesQuotations();

      toast.success('✅ 销售合同生成成功！', {
        description: `合同编号：${contractNumber}\n正在跳转到订单管理...`,
        duration: 3000,
      });

      setTimeout(() => {
        if (onNavigateToOrdersWithHighlight) {
          onNavigateToOrdersWithHighlight(contractNumber);
        } else if (onNavigateToOrders) {
          onNavigateToOrders();
        }
      }, 500);
    } catch (error: any) {
      console.error('❌ [handlePushToContract] 下推接口失败:', error);
      toast.error(`❌ 生成销售合同失败: ${error?.message || '未知错误'}`);
    }
  };
  
  // 🔥 新增：重置下推状态（开发调试用）
  const handleResetPushStatus = (qt: any) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔄 [handleResetPushStatus] 重置报价单下推状态');
    console.log('  - QT单号:', qt.qtNumber);
    
    updateQuotation(qt.id, {
      pushedToContract: false,
      pushedContractNumber: undefined,
      pushedContractAt: undefined,
      pushedBy: undefined
    });
    
    console.log('✅ [handleResetPushStatus] 下推状态已重置，按钮已激活');
    console.log('═══════════════════════════════════════════════════════');
    
    toast.success('✅ 下推状态已重置！', {
      description: `报价单 ${qt.qtNumber} 现在可以重新下推生成销售合同`,
      duration: 3000
    });
  };
  
  // 🔥 标准化区域代码
  const normalizeRegionCode = (region: string): 'NA' | 'SA' | 'EMEA' => {
    const regionMap: Record<string, 'NA' | 'SA' | 'EMEA'> = {
      'NA': 'NA',
      'North America': 'NA',
      'SA': 'SA',
      'South America': 'SA',
      'EMEA': 'EMEA',
      'EA': 'EMEA',
      'Europe & Africa': 'EMEA',
      'Other': 'NA'
    };
    
    const normalized = regionMap[region] || 'NA';
    console.log('🔍 [normalizeRegionCode] 标准化区域代码:', {
      input: region,
      output: normalized
    });
    
    return normalized;
  };
  
  // 🔥 获取区域主管邮箱的辅助函数
  const getRegionalManager = (region: string) => {
    const managers: Record<string, string> = {
      'NA': 'john.smith@cosun.com',          // 北美区主管：刘建国
      'North America': 'john.smith@cosun.com',
      'SA': 'carlos.silva@cosun.com',        // 南美区主管：陈明华
      'South America': 'carlos.silva@cosun.com',
      'EMEA': 'hans.mueller@cosun.com',      // 欧非区主管：赵国强
      'EA': 'hans.mueller@cosun.com',
      'Europe & Africa': 'hans.mueller@cosun.com',
      'Other': 'john.smith@cosun.com',       // 默认使用北美主管
    };
    
    console.log('🔍 [getRegionalManager] 根据区域获取主管:', {
      inputRegion: region,
      managerEmail: managers[region] || managers['NA']
    });
    
    return managers[region] || managers['NA'];
  };
  
  // 🔥 筛选：只做状态、搜索筛选；数据来自接口，后端已按权限过滤
  const myQuotations = useMemo(() => {
    const filtered = effectiveQuotations.filter(qt => {
      // 🔥 数据来自接口：后端已按登录用户过滤，前端不再按 salesPerson 过滤，避免「admin 登录、前端角色为业务员」时全被筛掉
      // 状态筛选
      if (filterStatus !== 'all' && qt.approvalStatus !== filterStatus) {
        console.log(`    ❌ 状态不匹配: filterStatus=${filterStatus}, approvalStatus=${qt.approvalStatus}`);
        return false;
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          qt.qtNumber.toLowerCase().includes(term) ||
          qt.qrNumber.toLowerCase().includes(term) ||
          qt.inqNumber.toLowerCase().includes(term) ||
          qt.customerCompany.toLowerCase().includes(term) ||
          qt.items.some(item => 
            item.productName.toLowerCase().includes(term) ||
            item.modelNo?.toLowerCase().includes(term)
          )
        );
      }
      
      return true;
    });
    
    return filtered;
  }, [effectiveQuotations, filterStatus, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myQuotations.length;
    const draft = myQuotations.filter(qt => qt.approvalStatus === 'draft').length;
    const pendingApproval = myQuotations.filter(qt => 
      qt.approvalStatus === 'pending_approval' || 
      qt.approvalStatus === 'pending_director'
    ).length;
    const pendingManager = myQuotations.filter(qt => qt.approvalStatus === 'pending_approval').length;
    const pendingDirector = myQuotations.filter(qt => qt.approvalStatus === 'pending_director').length;
    const approved = myQuotations.filter(qt => qt.approvalStatus === 'approved').length;
    const rejected = myQuotations.filter(qt => qt.approvalStatus === 'rejected').length;
    const sent = myQuotations.filter(qt => qt.customerStatus === 'sent' || qt.customerStatus === 'viewed' || qt.customerStatus === 'accepted' || qt.customerStatus === 'rejected').length;
    
    return { total, draft, pendingApproval, pendingManager, pendingDirector, approved, rejected, sent };
  }, [myQuotations]);
  
  // 🔥 获取状态Badge（审批状态）
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Edit },
      pending_approval: { label: '待主管审批', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      pending_director: { label: '待总监审批', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
      approved: { label: '已批准', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge className={`h-5 px-2 text-xs border ${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };
  
  // 🔥 获取客户状态Badge（带Tooltip显示时间线）
  const getCustomerStatusBadge = (qt: any) => {
    const status = qt.customerStatus;
    const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
      not_sent: { label: '未发送', icon: Clock, color: 'text-gray-500' },
      sent: { label: '已发送', icon: Send, color: 'text-blue-500' },
      viewed: { label: '已查看', icon: Eye, color: 'text-purple-500' },
      accepted: { label: '✅ 已确认', icon: CheckCircle, color: 'text-green-600' },
      rejected: { label: '❌ 已拒绝', icon: XCircle, color: 'text-red-600' },
      negotiating: { label: '💬 需协商', icon: AlertCircle, color: 'text-orange-600' },
      expired: { label: '已过期', icon: XCircle, color: 'text-gray-400' },
    };
    
    const config = statusConfig[status] || statusConfig.not_sent;
    const Icon = config.icon;
    
    // 🔥 构建Tooltip内容
    const getTooltipContent = () => {
      const lines: string[] = [];
      
      // 📤 发送时间
      if (qt.sentToCustomerAt || qt.sentAt) {
        const sentTime = new Date(qt.sentToCustomerAt || qt.sentAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        lines.push(`📤 发送时间：${sentTime}`);
        lines.push(`👤 发送人：${qt.sentBy || qt.salesPersonName || '系统'}`);
      }
      
      // 💬 客户响应
      if (qt.customerResponse) {
        const responseTime = new Date(qt.customerResponse.respondedAt).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        let responseLabel = '';
        if (qt.customerResponse.status === 'accepted') {
          responseLabel = '✅ 客户确认';
        } else if (qt.customerResponse.status === 'rejected') {
          responseLabel = '❌ 客户拒绝';
        } else if (qt.customerResponse.status === 'negotiating') {
          responseLabel = '💬 请求协商';
        }
        
        lines.push('');
        lines.push(`${responseLabel}：${responseTime}`);
        
        if (qt.customerResponse.comment) {
          lines.push(`💭 客户反馈：${qt.customerResponse.comment}`);
        }
      }
      
      // 如果没有任何时间信息
      if (lines.length === 0) {
        if (status === 'not_sent') {
          return '📌 报价单尚未发送给客户';
        }
        return '📌 暂无时间线信息';
      }
      
      return lines.join('\n');
    };
    
    const tooltipContent = getTooltipContent();
    
    // 🔥 渲染Badge with Tooltip
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 text-xs ${config.color} font-medium cursor-help`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="max-w-xs bg-gray-900 text-white text-xs whitespace-pre-line p-3"
          sideOffset={5}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    );
  };
  
  return (
    <div className="space-y-4">
      {/* 🔥 报价单列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3 bg-gray-50">
            {loadingFromApi && (
              <div className="mb-2 text-xs text-blue-600 flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" />
                正在从服务器加载报价数据...
              </div>
            )}
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索报价单号、采购需求单号、询价单号、客户名称、产品..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              
              {/* 🔥 新增：批量删除按钮 */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0}
                className="gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                批量删除 {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
              
              {/* 状态筛选标签 */}
              <div className="flex gap-2">
                <Button 
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  全部 ({stats.total})
                </Button>
                <Button 
                  variant={filterStatus === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('draft')}
                >
                  草稿 ({stats.draft})
                </Button>
                <Button 
                  variant={filterStatus === 'pending_approval' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending_approval')}
                >
                  待审批 ({stats.pendingApproval})
                </Button>
                <Button 
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('approved')}
                >
                  已批准 ({stats.approved})
                </Button>
                <Button 
                  variant={filterStatus === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('rejected')}
                >
                  已拒绝 ({stats.rejected})
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 🔥 报价单表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[12px]">
                {/* 🔥 新增：复选框列 */}
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length > 0 && selectedIds.length === myQuotations.length}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {/* 🔥 新增：序号列 */}
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">报价单号</TableHead>
                <TableHead className="w-32">关联单据</TableHead>
                <TableHead className="w-24">区域</TableHead>
                <TableHead>客户信息</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-32 text-right">报价金额</TableHead>
                <TableHead className="w-24 text-center">利润率</TableHead>
                <TableHead className="w-24 text-center">审批状态</TableHead>
                <TableHead className="w-24 text-center">客户状态</TableHead>
                <TableHead className="w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[12px]">
              {myQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>暂无报价单</p>
                    <p className="text-sm mt-1">在成本询报模块中，点击"下推报价管理"可创建报价单</p>
                  </TableCell>
                </TableRow>
              ) : (
                myQuotations.map((qt, index) => {
                  const isHighlighted = highlightedId === qt.id; // 🔥 判断是否高亮
                  
                  // 🔥 调试：检查按钮显示条件
                  console.log(`📌 [报价单 ${qt.qtNumber}] 按钮显示条件检查:`);
                  console.log(`  - approvalStatus: ${qt.approvalStatus}`);
                  console.log(`  - customerStatus: ${qt.customerStatus}`);
                  console.log(`  - 已有合同: ${getContractByQuotationNumber(qt.qtNumber) ? '是' : '否'}`);
                  console.log(`  - 显示"审批通过生成合同"按钮: ${qt.approvalStatus === 'approved' && qt.customerStatus !== 'accepted' && !getContractByQuotationNumber(qt.qtNumber) ? '✅ 是' : '❌ 否'}`);
                  
                  return (
                  <TableRow 
                    key={qt.id} 
                    className={`hover:bg-gray-50 transition-all duration-300 ${
                      isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : ''
                    }`}
                    style={isHighlighted ? { animation: 'pulse 1s ease-in-out 3' } : undefined}
                  >
                    {/* 🔥 新增：复选框 */}
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(qt.id)}
                        onCheckedChange={(checked) => handleSelectOne(qt.id, checked as boolean)}
                      />
                    </TableCell>
                    {/* 🔥 新增：序号 */}
                    <TableCell className="text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-blue-600 cursor-pointer hover:underline" onClick={() => handleViewQuotation(qt)}>
                      {qt.qtNumber}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-mono text-green-600">{qt.qrNumber}</div>
                        <div className="font-mono text-purple-600">{qt.inqNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {qt.region}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium">{qt.customerCompany}</div>
                        <div className="text-gray-500">{qt.customerName}</div>
                        <div className="text-gray-400">{qt.customerEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {qt.items.slice(0, 2).map((item, idx) => (
                          <div key={idx}>
                            <span className="font-medium">{item.productName}</span>
                            <span className="text-gray-500 ml-2">
                              × {item.quantity.toLocaleString()} {item.unit}
                            </span>
                          </div>
                        ))}
                        {qt.items.length > 2 && (
                          <div className="text-gray-500">
                            +{qt.items.length - 2} 个产品...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900">
                          ${(qt.totalAmount || qt.totalPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-gray-500">
                          成本: ${qt.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-green-600 font-medium">
                          利润: ${((qt.totalAmount || qt.totalPrice) - qt.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="font-bold" style={{ 
                          color: (((qt.totalAmount || qt.totalPrice) - qt.totalCost) / qt.totalCost) >= 0.2 ? '#10b981' : (((qt.totalAmount || qt.totalPrice) - qt.totalCost) / qt.totalCost) >= 0.15 ? '#f59e0b' : '#ef4444' 
                        }}>
                          {((((qt.totalAmount || qt.totalPrice) - qt.totalCost) / qt.totalCost) * 100).toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          {(((qt.totalAmount || qt.totalPrice) - qt.totalCost) / qt.totalCost) >= 0.2 ? '优秀' : (((qt.totalAmount || qt.totalPrice) - qt.totalCost) / qt.totalCost) >= 0.15 ? '良好' : '偏低'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(qt.approvalStatus)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getCustomerStatusBadge(qt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewQuotation(qt)}
                          className="gap-1 h-7 text-[11px]"
                        >
                          <Eye className="h-3 w-3" />
                          查看
                        </Button>
                        
                        {qt.approvalStatus === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => handleCalculatePrice(qt)}
                            className="gap-1 bg-orange-600 hover:bg-orange-700 h-7 text-[11px]"
                          >
                            <Calculator className="h-3 w-3" />
                            核算价格
                          </Button>
                        )}
                        
                        {/* 🔥 提交给主管审核按钮 - 草稿状态下显示 */}
                        {qt.approvalStatus === 'draft' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitForApproval(qt)}
                            className="gap-1 bg-blue-600 hover:bg-blue-700 h-7 text-[11px]"
                            title={qt.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重审批' : '金额<$20,000，只需主管审批'}
                          >
                            <Send className="h-3 w-3" />
                            提交给主管审核
                          </Button>
                        )}
                        
                        {/* 🔥 申请复核按钮 - 客户拒绝报价或上级驳回审批时显示 */}
                        {(qt.customerStatus === 'rejected' || qt.approvalStatus === 'rejected') && (
                          <Button 
                            size="sm"
                            onClick={() => handleSubmitForReview(qt)}
                            className="gap-1 bg-indigo-600 hover:bg-indigo-700 h-7 text-[11px]"
                            title={qt.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重复核' : '金额<$20,000，只需主管复核'}
                          >
                            <CheckCircle className="h-3 w-3" />
                            申请复核
                          </Button>
                        )}
                        
                        {qt.approvalStatus === 'approved' && qt.customerStatus === 'not_sent' && (
                          <Button 
                            size="sm"
                            onClick={() => handleSendToCustomer(qt)}
                            className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-[11px]"
                          >
                            <Send className="h-3 w-3" />
                            发送
                          </Button>
                        )}
                        
                        {/* 🔥 新增：下推生成销售合同按钮 - 客户确认后显示 */}
                        {qt.customerResponse?.status === 'accepted' && !qt.pushedToContract && (
                          <Button 
                            size="sm"
                            onClick={() => handlePushToContract(qt)}
                            className="gap-1 bg-purple-600 hover:bg-purple-700 h-7 text-[11px]"
                          >
                            <FileSignature className="h-3 w-3" />
                            下推生成销售合同
                          </Button>
                        )}

                        {/* 🔥 新增：已下推订单按钮 - 下推后显示（不可点击） */}
                        {qt.pushedToContract && qt.pushedContractNumber && (
                          <>
                            <Button 
                              size="sm"
                              disabled
                              className="gap-1 bg-gray-400 cursor-not-allowed h-7 text-[11px]"
                              title={`已下推至合同：${qt.pushedContractNumber}`}
                            >
                              <FileSignature className="h-3 w-3" />
                              已下推订单
                            </Button>
                            
                            {/* 🔥 开发调试：重置下推状态按钮 */}
                            <Button 
                              size="sm"
                              onClick={() => handleResetPushStatus(qt)}
                              className="gap-1 bg-yellow-500 hover:bg-yellow-600 h-7 text-[11px]"
                              title="开发调试：重置下推状态，允许重新下推"
                            >
                              🔄 重置
                            </Button>
                          </>
                        )}
                        
                        {/* 🔥 删除所有"生成合同"按钮 - 已放弃此功能 */}
                      </div>
                    </TableCell>
                  </TableRow>
                  ); // 🔥 闭合 return 语句
                }) // 🔥 闭合 map 函数
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* 🔥 新增：查看客户询价单弹窗 - 已禁用（文件不存在） */}
      {/* {showInquiryView && selectedInquiry && (
        <CustomerInquiryView
          inquiry={selectedInquiry}
          onClose={() => {
            setShowInquiryView(false);
            setSelectedInquiry(null);
          }}
        />
      )} */}
      
      {/* 🔥 新增：查看报价单弹窗（文档模版） */}
      {showQuotationView && selectedQuotation && (
        <QuotationView
          quotation={selectedQuotation}
          onClose={() => {
            setShowQuotationView(false);
            setSelectedQuotation(null);
          }}
        />
      )}
      
      {/* 🔥 新增：核算价格弹窗（智能报价创建） */}
      {showPriceCalculation && selectedQuotation && (
        <QuoteCreationIntelligent
          requirementNo={selectedQuotation.qrNumber}
          requirement={selectedQuotation}
          onClose={() => {
            setShowPriceCalculation(false);
            setSelectedQuotation(null);
          }}
          onSubmit={(quoteData) => {
            // 更新报价单数据
            updateQuotation(selectedQuotation.id, quoteData);
            toast.success('报价单更新成功！');
            setShowPriceCalculation(false);
            setSelectedQuotation(null);
          }}
        />
      )}
    </div>
  );
}