/**
 * 🔥 订单管理 - 业务员销售订单管理
 * 
 * 功能：
 * - 在制订单：查看从报价单生成的销售合同（SC）
 * - 提交合同审批（主管 → 总监）
 * - 发送合同给客户
 * - 查看客户签署状态
 */

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Search, 
  Eye, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileSignature,
  Trash2,
  Edit,
  Package,
  Truck,
  FileCheck,
  DollarSign,
  ShoppingCart,
  FileText // 🔥 新增：文档图标
} from 'lucide-react';
import { SalesContractContext, useSalesContracts } from '../../contexts/SalesContractContext';
import { useOrders } from '../../contexts/OrderContext';
import { useApproval } from '../../contexts/ApprovalContext'; // 🔥 添加审批Context
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext'; // 🔥 新增：采购订单Context
import { usePurchaseRequirements } from '../../contexts/PurchaseRequirementContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { generateCQNumber } from '../../utils/purchaseOrderNumberGenerator';
import { apiFetchJson } from '../../api/backend-auth';
import { toast } from 'sonner@2.0.3';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'; // 🔥 新增：Dialog组件
import { SalesContractDocument, SalesContractData } from '../documents/templates/SalesContractDocument'; // 🔥 新增：销售合同文档模板

const APPROVAL_CENTER_BRIDGE_KEY = 'approval_center_pending_bridge_v1';

const pushContractApprovalBridgeItem = (item: any) => {
  try {
    const raw = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const queue = Array.isArray(list) ? list : [];
    const dedupKey = `${item?.request?.type}:${item?.request?.relatedDocumentId}:${item?.currentApprover}`;
    const next = queue.filter((x: any) => {
      const k = `${x?.request?.type}:${x?.request?.relatedDocumentId}:${x?.currentApprover}`;
      return k !== dedupKey;
    });
    next.unshift(item);
    localStorage.setItem(APPROVAL_CENTER_BRIDGE_KEY, JSON.stringify(next.slice(0, 200)));
  } catch {}
};

interface SalesContractManagementProps {
  highlightScNumber?: string; // 🔥 高亮显示的销售合同号
}

export function SalesContractManagement({ highlightScNumber }: SalesContractManagementProps = {}) {
  const { contracts, deleteContract, submitForApproval, sendToCustomer, clearAllContracts, updateContract, refreshFromBackend } = useSalesContracts();
  const { orders } = useOrders(); // 🔥 获取订单数据
  const { addApprovalRequest } = useApproval(); // 🔥 审批功能
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders(); // 🔥 新增：采购订单功能
  const { addRequirement } = usePurchaseRequirements();
  const currentUser = getCurrentUser();
  const persistPurchaseRequest = (contract: any, newPO: any, poNumber: string) => {
    void (async () => {
      try {
        const payload = {
          cgNumber: poNumber,
          sourceInquiryNumber: contract.inquiryNumber || contract.quotationNumber || contract.contractNumber,
          urgency: 'high',
          specialRequirements: `由业务员下推采购，采购单号: ${poNumber}`,
          customer: {
            companyName: contract.customerCompany || contract.customerName || 'Unknown Customer',
            contactPerson: contract.contactPerson || contract.customerName || '',
            email: contract.customerEmail || 'unknown@example.com',
            phone: contract.contactPhone || '',
            address: contract.customerAddress || ''
          },
          items: (newPO?.items || []).map((item: any) => ({
            productName: item.productName || item.name || 'Unknown Product',
            modelNo: item.modelNo || item.productName || item.name || '-',
            specification: item.specification || '',
            quantity: Number(item.quantity || 0) || 1,
            unit: item.unit || 'PCS',
            targetPrice: Number(item.unitPrice || 0) || 0,
            targetCurrency: item.currency || contract.currency || 'USD',
            hsCode: item.hsCode || '',
            remarks: item.remarks || ''
          }))
        };
        const res = await apiFetchJson<{ requirement?: any; message?: string }>(
          `/api/sales-contracts/${encodeURIComponent(contract.id || contract.contractNumber)}/push-to-purchase`,
          {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const createdRequirement = res?.requirement;
        if (createdRequirement?.id) {
          addRequirement(createdRequirement);
          toast.success('采购请求已落库', {
            description: `已生成采购需求 ${createdRequirement.requirementNo}（来源 ${poNumber}）`,
            duration: 4500
          });
          void refreshFromBackend().catch(() => {});
        } else if (res?.message) {
          const isAlready = String(res.message).toLowerCase().includes('already');
          toast[isAlready ? 'info' : 'success'](isAlready ? '该合同已下推采购' : res.message, {
            description: `采购来源号：${poNumber}`,
            duration: 3500
          });
        }
      } catch (e: any) {
        toast.error('采购请求落库失败', {
          description: e?.message || '请检查后端接口 /api/sales-contracts/{id}/push-to-purchase',
          duration: 5000
        });
      }
    })();
  };

  // 🔥 接口化：进入“订单管理”Tab时立刻请求后端（Network 面板能直接看到 /api/sales-contracts）
  React.useEffect(() => {
    // context 为空但 localStorage 有合同时，强制重新加载（防墓碑误过滤）
    try {
      const saved = localStorage.getItem('salesContracts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && contracts.length === 0) {
          window.dispatchEvent(new CustomEvent('salesContractCreatedLocally'));
        }
      }
    } catch { /* ignore */ }
    void refreshFromBackend().catch((e: any) => {
      console.warn('⚠️ [SalesContractManagement] refreshFromBackend failed:', e?.message || e);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // 🔥 调试：监听contracts变化
  React.useEffect(() => {
    console.log('🔍 [SalesContractManagement] contracts变化:');
    console.log('  - 合同总数:', contracts.length);
    console.log('  - 所有合同编号:', contracts.map(c => c.contractNumber));
    console.log('  - 当前用户:', currentUser);
  }, [contracts]);
  
  // 一次性修正：用报价单的 salesPrice 纠正合同 products 里错误的 unitPrice
  // 直接修正 localStorage，不调用 refreshFromBackend（避免触发墓碑过滤清空新合同）
  React.useEffect(() => {
    try {
      const stored: any[] = JSON.parse(localStorage.getItem('salesContracts') || '[]');
      if (!stored.length) return;

      // 收集所有本地报价单（各缓存 key）
      const allQuotations: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || '';
        if (key.startsWith('sales_quotations_')) {
          try { allQuotations.push(...JSON.parse(localStorage.getItem(key) || '[]')); } catch { /* ignore */ }
        }
      }

      let changed = false;
      const corrected = stored.map((contract: any) => {
        const qt = allQuotations.find((q: any) => q.qtNumber === contract.quotationNumber);
        if (!qt?.items?.length) return contract;
        const newProducts = (contract.products || []).map((p: any, idx: number) => {
          const item = qt.items[idx];
          if (!item) return p;
          const correctPrice = Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0);
          if (correctPrice > 0 && Math.abs(correctPrice - Number(p.unitPrice)) > 0.001) {
            changed = true;
            return { ...p, unitPrice: correctPrice, amount: correctPrice * Number(p.quantity || 0) };
          }
          return p;
        });
        return { ...contract, products: newProducts };
      });

      if (changed) {
        // 只更新 localStorage，不触发 refreshFromBackend，避免后端空响应干扰
        localStorage.setItem('salesContracts', JSON.stringify(corrected));
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔥 高亮状态（3秒后自动消失）
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (highlightScNumber) {
      console.log('🔍 [SalesContractManagement] 收到高亮请求:', highlightScNumber);
      const contract = contracts.find(c => c.contractNumber === highlightScNumber);
      if (contract) {
        console.log('  ✅ 找到合同:', contract.contractNumber);
        setHighlightedId(contract.id);
        // 3秒后清除高亮
        const timer = setTimeout(() => setHighlightedId(null), 3000);
        return () => clearTimeout(timer);
      } else {
        console.log('  ⚠️ 未找到合同:', highlightScNumber);
        console.log('  - 可用合同:', contracts.map(c => c.contractNumber));
      }
    }
  }, [highlightScNumber, contracts]);
  
  // 🔥 子Tab状态
  const [activeSubTab, setActiveSubTab] = useState('in-progress');
  
  // 🔥 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'sent' | 'confirmed'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 🔥 新增：文档预览状态
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const requestProcurementFromContract = (contract: any) => {
    const livePOs = getLivePurchaseOrdersForContract(contract);
    if (livePOs.length > 0) {
      // 允许业务员“重新激活”已有采购请求，避免按钮长期灰置且请求链路断裂
      livePOs.forEach((po: any) => {
        updatePurchaseOrder(po.id, {
          procurementRequestStatus: 'pending_procurement_assignment',
          status: 'pending',
          updatedDate: new Date().toISOString(),
        } as any);
      });
      toast.success('已重新激活采购请求', {
        description: `采购来源号：${livePOs.map((po: any) => po.poNumber).join(', ')}`,
        duration: 3500
      });
      return;
    }

    const poNumber = generateCQNumber();
    const items = (contract.products || []).map((product: any, index: number) => ({
      id: String(product?.id || product?.productId || `item-${index + 1}`),
      productName: product?.productName || 'Unknown Product',
      modelNo: product?.modelNo || product?.productName || '-',
      specification: product?.specification || '',
      quantity: Number(product?.quantity || 0),
      unit: product?.unit || 'PCS',
      unitPrice: 0,
      currency: contract?.currency || 'USD',
      subtotal: 0,
      hsCode: product?.hsCode || '',
      packingRequirement: product?.packingRequirement || '',
      remarks: product?.remarks || ''
    }));

    addPurchaseOrder({
      id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      poNumber,
      sourceRef: contract.contractNumber,
      sourceSONumber: contract.contractNumber,
      salesContractNumber: contract.contractNumber,
      quotationNumber: contract.quotationNumber,
      rfqNumber: contract.inquiryNumber || '',
      requirementNo: '',
      supplierName: '待采购分配',
      supplierCode: 'TBD',
      region: contract.region,
      items,
      totalAmount: 0,
      currency: contract.currency || 'USD',
      paymentTerms: '待采购确认',
      deliveryTerms: contract.deliveryTime || '待采购确认',
      orderDate: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      paymentStatus: 'unpaid',
      remarks: `📋 业务员请求采购（不含供应商信息）\n来源销售合同: ${contract.contractNumber}\n来源询价: ${contract.inquiryNumber || ''}\n待采购员分配供应商`,
      createdBy: currentUser?.email || 'system',
      createdDate: new Date().toISOString(),
      procurementRequestStatus: 'pending_procurement_assignment',
    } as any);

    persistPurchaseRequest(contract, { items }, poNumber);

    toast.success('✅ 已请求采购', {
      description: `采购单号：${poNumber}（待采购员分配供应商）`,
      duration: 4500
    });
  };

  const isContractDeletable = (contract: any): boolean => {
    return true;
  };
  
  // 🔥 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    const deletableIds = myContracts.filter((c) => isContractDeletable(c)).map((c) => c.id);
    if (checked) {
      setSelectedIds(deletableIds);
    } else {
      setSelectedIds([]);
    }
  };
  
  // 🔥 单个选择
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };
  
  // 🔥 批量删除
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的合同！');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个合同吗？此操作不可恢复！`)) {
      selectedIds.forEach(id => {
        deleteContract(id);
      });
      setSelectedIds([]);
      toast.success(`成功删除 ${selectedIds.length} 个合同！`);
    }
  };
  
  // 🔥 提交审批
  const handleSubmitForApproval = (contract: any) => {
    console.log('📤 [SO] 提交审批:', contract);
    
    // 判断审批流程
    const requiresDirectorApproval = contract.totalAmount >= 20000;
    
    // 🔥 获取主管和总监信息
    const getRegionalManager = (region: string) => {
      const managers: Record<string, string> = {
        'NA': 'john.smith@cosun.com',          // 北美区主管：刘建国
        'SA': 'carlos.silva@cosun.com',        // 南美区主管：陈明华
        'EMEA': 'hans.mueller@cosun.com',      // 欧非区主管：赵国强
      };
      return managers[region] || managers['NA'];
    };
    
    const managerEmail = getRegionalManager(contract.region);
    const directorEmail = 'sales.director@cosun.com'; // 销售总监：王强
    
    // 🔥 产品摘要
    const productCount = contract.products.length;
    const productSummary = productCount === 1
      ? `${contract.products[0].productName} × ${contract.products[0].quantity} ${contract.products[0].unit}`
      : `${contract.products[0].productName} × ${contract.products[0].quantity} ${contract.products[0].unit} 等 ${productCount} 项产品`;
    
    // 🔥 创建审批请求
    const approvalRequest = addApprovalRequest({
      type: 'sales_contract',
      relatedDocumentId: contract.contractNumber,
      relatedDocumentType: '销售合同',
      relatedDocument: contract,
      submittedBy: currentUser?.email || '',
      submittedByName: currentUser?.name || currentUser?.email || '',
      submittedByRole: currentUser?.role || 'Salesperson',
      submittedAt: new Date().toISOString(),
      region: contract.region,
      currentApprover: managerEmail,
      currentApproverRole: 'Regional_Manager',
      nextApprover: requiresDirectorApproval ? directorEmail : null,
      nextApproverRole: requiresDirectorApproval ? 'Sales_Director' : null,
      requiresDirectorApproval,
      status: 'pending',
      urgency: contract.totalAmount >= 50000 ? 'high' : 'normal',
      amount: contract.totalAmount,
      currency: contract.currency,
      customerName: contract.customerName,
      customerEmail: contract.customerEmail,
      productSummary,
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48小时期限
      expiresIn: 48
    });
    
    // 写入 bridge，让主管的审批中心立刻看到
    pushContractApprovalBridgeItem({
      currentApprover: managerEmail,
      request: approvalRequest,
    });

    // 🔥 更新销售合同状态
    submitForApproval(contract.id, `销售合同 ${contract.contractNumber} 已准备好，请审批。`);
    
    // 🔥 显示审批流程提示
    const approvalMessage = requiresDirectorApproval
      ? `💰 合同金额：${contract.currency} ${contract.totalAmount.toLocaleString()} (≥ $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n2️⃣ 销售总监审批\n\n✅ 双重审批通过后，可以发送给客户。`
      : `💰 合同金额：${contract.currency} ${contract.totalAmount.toLocaleString()} (< $20,000)\n\n📋 审批流程：\n1️⃣ 区域业务主管审批\n\n✅ 主管审批通过后，可以发送给客户。`;
    
    toast.success('✅ 合同已提交审批！', {
      description: approvalMessage,
      duration: 6000
    });
    
    console.log('✅ [SO] 审批请求创建成功:', approvalRequest);
  };
  
  // 🔥 发送给客户
  const handleSendToCustomer = (contract: any) => {
    if (contract.status !== 'approved') {
      toast.error('只有审批通过的合同才能发送给客户！');
      return;
    }
    sendToCustomer(contract.id);
  };

  const formatContractNumberForDisplay = (contractNumber: string) => {
    return String(contractNumber || '')
      .replace('SC-North America-', 'SC-NA-')
      .replace('SC-South America-', 'SC-SA-')
      .replace('SC-Europe & Africa-', 'SC-EA-');
  };

  const getLivePurchaseOrdersForContract = (contract: any) => {
    const contractNo = String(contract?.contractNumber || '').trim();
    const idsFromContract = Array.isArray(contract?.purchaseOrderNumbers)
      ? new Set(contract.purchaseOrderNumbers.map((v: any) => String(v)))
      : new Set<string>();
    return (purchaseOrders || []).filter((po: any) => {
      const poNo = String(po?.poNumber || '').trim();
      const sourceRef = String(po?.sourceRef || '').trim();
      const sourceSONumber = String(po?.sourceSONumber || '').trim();
      const salesContractNumber = String(po?.salesContractNumber || '').trim();
      const reqStatus = String((po as any)?.procurementRequestStatus || '').trim();
      const isCq = poNo.startsWith('CQ-');
      if (!isCq) return false;
      // 已下推供应商后的历史请求不阻止再次“请求采购”
      if (reqStatus === 'pushed_supplier' || reqStatus === 'allocated_completed') return false;
      return (
        (poNo && idsFromContract.has(poNo)) ||
        (sourceRef && sourceRef === contractNo) ||
        (sourceSONumber && sourceSONumber === contractNo) ||
        (salesContractNumber && salesContractNumber === contractNo)
      );
    });
  };
  
  // 🔥 筛选：只做状态、搜索筛选；数据来自接口，后端已按权限过滤
  const myContracts = useMemo(() => {
    console.log('🔍 [SalesContractManagement] 筛选业务员合同:');
    console.log('  - 总合同数:', contracts.length);
    console.log('  - 当前用户邮箱:', currentUser?.email);
    console.log('  - 所有合同的salesPerson:', contracts.map(c => ({ 
      contractNumber: c.contractNumber, 
      salesPerson: c.salesPerson,
      customerEmail: c.customerEmail 
    })));
    
    return contracts.filter(contract => {
      // 🔥 数据来自接口：后端已按登录用户过滤，前端不再按 salesPerson 硬过滤
      console.log(`  - ${contract.contractNumber}: salesPerson=${contract.salesPerson}`);

      // 状态筛选
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && !['pending_supervisor', 'pending_director'].includes(contract.status)) {
          return false;
        } else if (filterStatus === 'sent' && !['sent_to_customer', 'customer_confirmed', 'customer_rejected', 'customer_requested_changes'].includes(contract.status)) {
          return false;
        } else if (filterStatus === 'confirmed' && contract.status !== 'customer_confirmed') {
          return false;
        } else if (!['pending', 'sent', 'confirmed'].includes(filterStatus) && contract.status !== filterStatus) {
          return false;
        }
      }
      
      // 搜索筛选
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const displayContractNo = formatContractNumberForDisplay(contract.contractNumber).toLowerCase();
        return (
          contract.contractNumber.toLowerCase().includes(term) ||
          displayContractNo.includes(term) ||
          contract.quotationNumber.toLowerCase().includes(term) ||
          contract.customerCompany.toLowerCase().includes(term) ||
          contract.customerName.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [contracts, currentUser, filterStatus, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = myContracts.length;
    const draft = myContracts.filter(c => c.status === 'draft').length;
    const pending = myContracts.filter(c => ['pending_supervisor', 'pending_director'].includes(c.status)).length;
    const approved = myContracts.filter(c => c.status === 'approved').length;
    const rejected = myContracts.filter(c => c.status === 'rejected').length;
    const sent = myContracts.filter(c => ['sent_to_customer', 'customer_confirmed', 'customer_rejected', 'customer_requested_changes'].includes(c.status)).length;
    const confirmed = myContracts.filter(c => c.status === 'customer_confirmed').length;
    
    return { total, draft, pending, approved, rejected, sent, confirmed };
  }, [myContracts]);
  
  // 🔥 获取状态Badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: '草稿', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: Edit },
      pending_supervisor: { label: '待主管审批', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      pending_director: { label: '待总监审批', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
      approved: { label: '已批准', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
      rejected: { label: '已驳回', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      sent_to_customer: { label: '已发送客户', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send },
      sent: { label: '已发送客户', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Send }, // 🔥 添加sent状态映射
      customer_confirmed: { label: '客户确认·等待定金', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: DollarSign }, // 🔥 修改：更清晰的状态描述，使用金钱图标
      deposit_uploaded: { label: '定金已上传·待财务确认', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: FileCheck }, // 🔥 新增：定金已上传状态
      deposit_confirmed: { label: '定金已确认·可生成PO', color: 'bg-teal-100 text-teal-700 border-teal-300', icon: CheckCircle }, // 🔥 新增：定金已确认状态
      customer_rejected: { label: '客户已拒绝', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
      customer_requested_changes: { label: '客户要求修改', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: AlertCircle },
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
  
  return (
    <div className="space-y-4">
      {/* 🔥 统计卡片 */}
      <div className="grid grid-cols-7 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">全部合同</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
          <div className="text-xs text-gray-500 mt-1">草稿</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
          <div className="text-xs text-yellow-600 mt-1">待审批</div>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
          <div className="text-xs text-green-600 mt-1">已批准</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4 bg-red-50">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-xs text-red-600 mt-1">已驳回</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="text-2xl font-bold text-blue-700">{stats.sent}</div>
          <div className="text-xs text-blue-600 mt-1">已发送</div>
        </div>
        <div className="bg-white border border-emerald-200 rounded-lg p-4 bg-emerald-50">
          <div className="text-2xl font-bold text-emerald-700">{stats.confirmed}</div>
          <div className="text-xs text-emerald-600 mt-1">已确认</div>
        </div>
      </div>
      
      {/* 🔥 合同列表 */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-5 py-3 bg-gray-50">
            <div className="flex gap-3 items-center">
              {/* 搜索框 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <Input
                  placeholder="搜索合同号、报价单号、客户名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              
              {/* 批量删除按钮 */}
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
              
              {/* 🔥 清空所有按钮 */}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (window.confirm('⚠️ 确定要清空所有销售合同吗？\n\n此操作不可恢复！\n\n这将删除所有在制订单和订单历史。')) {
                    clearAllContracts();
                    setSelectedIds([]);
                  }
                }}
                disabled={myContracts.length === 0}
                className="gap-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清空所有
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
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                >
                  待审批 ({stats.pending})
                </Button>
                <Button 
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('approved')}
                >
                  已批准 ({stats.approved})
                </Button>
                <Button 
                  variant={filterStatus === 'sent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('sent')}
                >
                  已发送 ({stats.sent})
                </Button>
                <Button 
                  variant={filterStatus === 'confirmed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('confirmed')}
                >
                  已确认 ({stats.confirmed})
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 🔥 合同表格 */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[12px]">
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === myContracts.filter((c) => isContractDeletable(c)).length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">序号</TableHead>
                <TableHead className="w-40">合同编号</TableHead>
                <TableHead className="w-24">区域</TableHead>
                <TableHead>客户信息</TableHead>
                <TableHead>产品信息</TableHead>
                <TableHead className="w-28 text-right">商品单价</TableHead>
                <TableHead className="w-32 text-right">合同金额</TableHead>
                <TableHead className="w-24 text-center">状态</TableHead>
                <TableHead className="w-32 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[12px]">
              {myContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>暂无销售合同</p>
                    <p className="text-sm mt-1">在报价管理模块中，客户接受报价后可生成销售合同</p>
                  </TableCell>
                </TableRow>
              ) : (
                myContracts.map((contract, index) => {
                  const isHighlighted = highlightedId === contract.id; // 🔥 判断是否高亮
                  
                  // 🔥 查找对应的订单数据，检查定金支付状态
                  const correspondingOrder = orders.find(o => o.orderNumber === contract.contractNumber);
                  const depositConfirmed = correspondingOrder?.depositPaymentProof?.status === 'confirmed';
                  const hasLiveProcurementRequest = getLivePurchaseOrdersForContract(contract).length > 0;
                  
                  return (
                    <TableRow 
                      key={contract.id} 
                      className={`hover:bg-gray-50 transition-all duration-300 ${
                        isHighlighted ? 'bg-yellow-100 border-2 border-yellow-400 shadow-lg' : ''
                      }`}
                      style={isHighlighted ? { animation: 'pulse 1s ease-in-out 3' } : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(contract.id)}
                          disabled={!isContractDeletable(contract)}
                          onCheckedChange={(checked) => handleSelectOne(contract.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {index + 1}
                      </TableCell>
                      <TableCell 
                        className="font-mono font-semibold text-purple-600 cursor-pointer hover:text-purple-700 hover:underline"
                        onClick={() => {
                          setSelectedContract(contract);
                          setShowDocumentPreview(true);
                        }}
                        title="点击查看合同文档"
                      >
                        <div className="space-y-0.5">
                          <div>{formatContractNumberForDisplay(contract.contractNumber)}</div>
                          <div className="text-[11px] font-normal text-blue-600">
                            报价单编号：{contract.quotationNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">
                          {contract.region}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{contract.customerCompany}</div>
                          <div className="text-gray-500">{contract.customerName}</div>
                          <div className="text-gray-400">{contract.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {contract.products.slice(0, 2).map((product, idx) => (
                            <div key={idx}>
                              <span className="font-medium">{product.productName}</span>
                              <span className="text-gray-500 ml-2">
                                × {product.quantity.toLocaleString()} {product.unit}
                              </span>
                            </div>
                          ))}
                          {contract.products.length > 2 && (
                            <div className="text-gray-500">
                              +{contract.products.length - 2} 个产品...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {(() => {
                          const first = contract.products?.[0];
                          const up = Number(
                            (first as any)?.unitPrice ??
                            (first as any)?.salesPrice ??
                            (first as any)?.quotePrice ??
                            0
                          );
                          if (!up) return <span className="text-gray-400">—</span>;
                          const currency = contract.currency || 'USD';
                          const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency;
                          const formatted = up.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const hasMultiple = contract.products.length > 1;
                          return (
                            <span className="font-medium text-gray-800">
                              {symbol}{formatted}{hasMultiple ? ' ~' : ''}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900">
                            {contract.currency} {contract.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            定金 {contract.depositPercentage}%: {contract.currency} {contract.depositAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-gray-500 text-[10px]">
                            余款 {contract.balancePercentage}%: {contract.currency} {contract.balanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {/* 🔥 根据订单定金状态动态显示Badge */}
                        {(() => {
                          const order = orders.find(o => o.orderNumber === contract.contractNumber);
                          
                          // 如果财务已确认定金
                          if (order?.depositPaymentProof?.status === 'confirmed') {
                            return (
                              <Badge className="h-5 px-2 text-xs border bg-teal-100 text-teal-700 border-teal-300 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                定金已确认·可采购
                              </Badge>
                            );
                          }
                          
                          // 如果客户已上传定金凭证，等待财务确认
                          if (order?.depositPaymentProof && !order.depositPaymentProof.status) {
                            return (
                              <Badge className="h-5 px-2 text-xs border bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
                                <FileCheck className="h-3 w-3" />
                                定金已上传·待确认
                              </Badge>
                            );
                          }
                          
                          // 否则显示默认状态
                          return getStatusBadge(contract.status);
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowDocumentPreview(true);
                            }}
                            className="gap-1 h-7 text-[11px] px-2"
                            title="查看合同文档"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          
                          {/* 🔥 临时修复按钮：强制更新状态为customer_confirmed */}
                          {contract.status === 'approved' && correspondingOrder?.depositPaymentProof?.status === 'confirmed' && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                updateContract(contract.id, { 
                                  status: 'customer_confirmed',
                                  customerConfirmedAt: new Date().toISOString(),
                                  sentToCustomerAt: contract.sentToCustomerAt || new Date().toISOString()
                                });
                                toast.success('✅ 状态已修复为"客户已确认"', {
                                  description: '现在可以点击"通知采购部"按钮了！',
                                  duration: 3000
                                });
                              }}
                              className="gap-1 h-7 text-[11px] px-2 bg-orange-50 hover:bg-orange-100 border-orange-300"
                              title="临时修复：将状态更新为customer_confirmed"
                            >
                              🔧 修复状态
                            </Button>
                          )}
                          
                          {contract.status === 'draft' && (
                            <Button 
                              size="sm"
                              onClick={() => handleSubmitForApproval(contract)}
                              className="gap-1 bg-blue-600 hover:bg-blue-700 h-7 text-[11px]"
                              title={contract.totalAmount >= 20000 ? '金额≥$20,000，需主管+总监双重审批' : '金额<$20,000，只需主管审批'}
                            >
                              <CheckCircle className="h-3 w-3" />
                              提交审批
                            </Button>
                          )}
                          
                          {contract.status === 'approved' && (
                            <Button 
                              size="sm"
                              onClick={() => handleSendToCustomer(contract)}
                              className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-[11px]"
                            >
                              <Send className="h-3 w-3" />
                              发送客户
                            </Button>
                          )}
                          
                          {/* 🔥 已发送客户：只显示已发状态 */}
                          {(contract.status === 'sent' || contract.status === 'sent_to_customer') && (
                            <Button 
                              size="sm"
                              disabled
                              className="gap-1 bg-gray-400 text-white cursor-not-allowed h-7 text-[11px]"
                            >
                              <Send className="h-3 w-3" />
                              已发客户
                            </Button>
                          )}
                          
                          {/* 🔥 客户确认但未到款：显示等待定金确认 */}
                          {contract.status === 'customer_confirmed' && !depositConfirmed && (
                            <Button 
                              size="sm"
                              disabled
                              className="gap-1 bg-yellow-400 text-white cursor-not-allowed h-7 text-[11px]"
                              title="等待客户上传定金凭证，或等待财务确认收款"
                            >
                              <Clock className="h-3 w-3" />
                              等待定金确认
                            </Button>
                          )}
                          
                          {/* 🔥 定金已确认即可请求采购：不再受合同状态字符串卡死 */}
                          {depositConfirmed && (
                            <Button
                              size="sm"
                              onClick={() => requestProcurementFromContract(contract)}
                              className="gap-1 bg-[#F96302] hover:bg-[#e05502] text-white h-7 text-[11px]"
                              title={hasLiveProcurementRequest ? '已存在采购请求，点击可重新激活' : '定金已确认，点击请求采购（由采购员分配供应商）'}
                            >
                              <ShoppingCart className="h-3 w-3" />
                              请求采购
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

      {/* 🔥 销售合同文档预览Dialog */}
      {showDocumentPreview && selectedContract && (
        <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
          <DialogContent className="max-w-[95vw] h-[95vh] p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                📄 销售合同文档 - {selectedContract.contractNumber}
              </DialogTitle>
              <DialogDescription>
                Sales Contract Document - 福建高盛达富建材有限公司
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto p-6" style={{ height: 'calc(95vh - 80px)' }}>
              <SalesContractDocument
                data={{
                  // 合同基本信息
                  contractNo: selectedContract.contractNumber,
                  contractDate: selectedContract.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  quotationNo: selectedContract.quotationNumber,
                  inquiryNo: selectedContract.inquiryNumber,
                  region: selectedContract.region,
                  
                  // 卖方信息福建高盛达富建材有限公司）
                  seller: {
                    name: '福建高盛达富建材有限公司',
                    nameEn: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                    address: '中国福建省厦门市工业园区123号',
                    addressEn: 'No. 123, Industrial Park, Xiamen, Fujian, China',
                    tel: '+86-592-1234-5678',
                    fax: '+86-592-1234-5679',
                    email: currentUser?.email || 'sales@cosun.com',
                    legalRepresentative: '张总',
                    bankInfo: {
                      bankName: 'Bank of China, Xiamen Branch',
                      accountName: 'FUJIAN COSUN BUILDING MATERIALS CO., LTD.',
                      accountNumber: '1234567890123456',
                      swiftCode: 'BKCHCNBJ950',
                      bankAddress: 'Xiamen, Fujian, China',
                      currency: 'USD'
                    }
                  },
                  
                  // 买方信息（客户）
                  buyer: {
                    companyName: selectedContract.customerCompany,
                    address: selectedContract.customerAddress || 'Customer Address',
                    country: selectedContract.region === 'NA' ? 'United States' : selectedContract.region === 'SA' ? 'Brazil' : 'Germany',
                    contactPerson: selectedContract.customerName,
                    tel: selectedContract.customerPhone || 'N/A',
                    email: selectedContract.customerEmail
                  },
                  
                  // 产品信息
                  products: selectedContract.products.map((product: any, index: number) => ({
                    no: index + 1,
                    description: product.productName,
                    specification: product.specification || '',
                    hsCode: product.hsCode || '',
                    quantity: product.quantity,
                    unit: product.unit,
                    unitPrice: product.unitPrice,
                    currency: selectedContract.currency,
                    amount: product.amount,
                    deliveryTime: product.deliveryTime || selectedContract.deliveryTime || '30-45 days after deposit'
                  })),
                  
                  // 合同条款
                  terms: {
                    totalAmount: selectedContract.totalAmount,
                    currency: selectedContract.currency,
                    tradeTerms: selectedContract.tradeTerms || 'FOB Xiamen',
                    paymentTerms: selectedContract.paymentTerms,
                    depositAmount: selectedContract.depositAmount || selectedContract.totalAmount * 0.3,
                    balanceAmount: selectedContract.balanceAmount || selectedContract.totalAmount * 0.7,
                    deliveryTime: selectedContract.deliveryTime || '30-45 days after receiving deposit',
                    portOfLoading: selectedContract.portOfLoading || 'Xiamen, China',
                    portOfDestination: selectedContract.portOfDestination || "As per buyer's request",
                    packing: selectedContract.packing || 'Standard Export Packing',
                    inspection: 'Buyer inspection or third-party inspection before shipment',
                    warranty: '1 year warranty for quality issues'
                  },
                  
                  // 签署信息
                  signature: {
                    sellerSignatory: currentUser?.name || 'Sales Manager',
                    buyerSignatory: selectedContract.customerName,
                    signDate: selectedContract.createdAt?.split('T')[0]
                  }
                } as SalesContractData}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
