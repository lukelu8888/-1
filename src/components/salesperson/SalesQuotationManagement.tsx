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
import { salesQuotationService, approvalRecordService } from '../../lib/supabaseService';
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { ERP_EVENT_KEYS } from '../../lib/erp-core/events';
import { subscribeErpEvent, emitErpEvent } from '../../lib/erp-core/event-bus';
import { addTombstones, filterNotDeleted, removeTombstones } from '../../lib/erp-core/deletion-tombstone';
import QuoteCreationIntelligent from '../admin/QuoteCreationIntelligent'; // 🔥 智能报价创建
// ❌ 已禁用：文件不存在
// import { CustomerInquiryView } from '../admin/CustomerInquiryView'; // 🔥 客户询价单查看
import { QuotationView } from './QuotationView'; // 🔥 报价单查看（使用文档中心模版）

const SALES_QUOTATION_DRAFT_OVERRIDES_KEY = 'sales_quotation_draft_overrides';
const SALES_QUOTATION_DELETED_IDS_KEY = 'sales_quotation_deleted_ids'; // legacy key, keep for backward compatibility
const SALES_QUOTATION_CACHE_PREFIX = 'sales_quotation_management_cache_v1';
const APPROVAL_CENTER_BRIDGE_KEY = 'approval_center_pending_bridge_v1';

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
  const getSalesQuotationCacheKey = (email?: string) => `${SALES_QUOTATION_CACHE_PREFIX}:${email || 'anonymous'}`;

  const readSalesQuotationCache = (email?: string): any[] => {
    try {
      const raw = localStorage.getItem(getSalesQuotationCacheKey(email));
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeSalesQuotationCache = (email: string | undefined, list: any[]) => {
    localStorage.setItem(getSalesQuotationCacheKey(email), JSON.stringify(Array.isArray(list) ? list : []));
  };

  const readSalesQuotationLocalFallback = (): any[] => {
    try {
      const raw = localStorage.getItem('salesQuotations');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const pushApprovalBridgeItem = async (item: any) => {
    const request = item?.request || {};
    const currentApprover = item?.currentApprover || request?.currentApprover || '';
    const currentApproverRole = request?.currentApproverRole || '';

    // 业务审批记录必须先落 Supabase，localStorage 仅保留 UI 过渡缓存。
    const saved = await approvalRecordService.upsert({
      ...request,
      currentApprover,
      currentApproverRole,
    });
    if (!saved) {
      throw new Error('approval_records upsert failed');
    }

    try {
      const raw = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const queue = Array.isArray(list) ? list : [];
      const dedupKey = `${request?.type}:${request?.relatedDocumentId}:${currentApprover}`;
      const next = queue.filter((x: any) => {
        const k = `${x?.request?.type}:${x?.request?.relatedDocumentId}:${x?.currentApprover}`;
        return k !== dedupKey;
      });
      next.unshift({ ...item, request: { ...request, currentApprover, currentApproverRole } });
      localStorage.setItem(APPROVAL_CENTER_BRIDGE_KEY, JSON.stringify(next.slice(0, 200)));
    } catch {}
  };

  const readDraftOverrides = (): Record<string, any> => {
    try {
      const raw = localStorage.getItem(SALES_QUOTATION_DRAFT_OVERRIDES_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeDraftOverride = (quotationId: string, override: any) => {
    const all = readDraftOverrides();
    all[quotationId] = override;
    localStorage.setItem(SALES_QUOTATION_DRAFT_OVERRIDES_KEY, JSON.stringify(all));
  };

  const readDeletedIds = (): string[] => {
    try {
      const raw = localStorage.getItem(SALES_QUOTATION_DELETED_IDS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
    } catch {
      return [];
    }
  };

  const appendDeletedIds = (ids: string[]) => {
    const merged = new Set(readDeletedIds());
    ids.forEach((id) => merged.add(String(id)));
    localStorage.setItem(SALES_QUOTATION_DELETED_IDS_KEY, JSON.stringify(Array.from(merged)));
    addTombstones(
      'quotation',
      ids.flatMap((id) => [String(id)]),
      { reason: 'manual-delete-sales-quotation', deletedBy: currentUser?.email || 'unknown' },
    );
  };

  const removeDraftOverrideByIds = (ids: string[]) => {
    const all = readDraftOverrides();
    ids.forEach((id) => {
      delete all[String(id)];
    });
    localStorage.setItem(SALES_QUOTATION_DRAFT_OVERRIDES_KEY, JSON.stringify(all));
  };

  const mergeDraftOverrides = (quotations: any[]) => {
    const all = readDraftOverrides();
    const legacyDeletedSet = new Set(readDeletedIds());
    return filterNotDeleted(
      'quotation',
      quotations.filter((qt) => !legacyDeletedSet.has(String(qt.id))),
      (qt: any) => [String(qt?.id || ''), String(qt?.qtNumber || '')],
    )
      .map((qt) => {
      const key = String(qt.id);
      const override = all[key];
      if (!override || typeof override !== 'object') return qt;
      return {
        ...qt,
        ...override,
        id: qt.id,
        qtNumber: qt.qtNumber,
      };
    });
  };

  const mapQuoteDataToServerLike = (quoteData: any, currentQt: any) => ({
    totalPrice: quoteData.totalAmount ?? currentQt?.totalPrice ?? 0,
    totalAmount: quoteData.totalAmount ?? currentQt?.totalAmount ?? 0,
    totalCost: quoteData.totalCost ?? currentQt?.totalCost ?? 0,
    totalProfit: quoteData.totalProfit ?? currentQt?.totalProfit ?? 0,
    profitRate: quoteData.profitMargin ?? quoteData.profitRate ?? currentQt?.profitRate ?? 0,
    validUntil: quoteData.validUntil ?? currentQt?.validUntil ?? null,
    notes: quoteData.approvalNotes ?? currentQt?.notes ?? '',
    items: Array.isArray(quoteData.items)
      ? quoteData.items.map((item: any) => ({
          id: item.id,
          productName: item.productName,
          modelNo: item.modelNo,
          specification: item.specification,
          quantity: item.quantity,
          unit: item.unit,
          costPrice: item.costPrice ?? item.costUSD ?? 0,
          salesPrice: item.salesPrice ?? item.quotePrice ?? 0,
          profitMargin: item.profitMargin ?? 0,
          profit: item.profit ?? item.profitUSD ?? 0,
          totalCost: item.totalCost ?? ((item.costPrice ?? item.costUSD ?? 0) * (item.quantity ?? 0)),
          totalPrice: item.totalPrice ?? item.totalAmount ?? ((item.salesPrice ?? item.quotePrice ?? 0) * (item.quantity ?? 0)),
          currency: item.currency ?? 'USD',
          remarks: item.remarks ?? '',
        }))
      : currentQt?.items ?? [],
  });

  const { quotations, updateQuotation } = useSalesQuotations();
  const quotationsRef = React.useRef(quotations);
  quotationsRef.current = quotations;
  const { contracts: salesContracts, createContract, getContractByQuotationNumber } = useSalesContracts(); // 🔥 获取销售合同
  const { inquiries } = useInquiry();
  const { addQuotation: addCustomerQuotation } = useQuotations(); // 🔥 导入客户报价Context
  const { orders, addOrder } = useOrders(); // 🔥 获取订单和添加订单函数
  const { purchaseRequirements, updatePurchaseRequirement } = usePurchaseRequirements(); // 🔥 获取采购需求和更新函数
  const currentUser = getCurrentUser();

  // 一次性修复：把 salesPerson=admin@cosun.com 的本地报价单更正为当前登录用户
  React.useEffect(() => {
    if (!currentUser?.email || currentUser.email === 'admin@cosun.com') return;
    try {
      const cacheKey = getSalesQuotationCacheKey(currentUser.email);
      const cached: any[] = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      let fixed = false;
      const updated = cached.map((q: any) => {
        if (q.salesPerson === 'admin@cosun.com') {
          fixed = true;
          return { ...q, salesPerson: currentUser.email, salesPersonName: currentUser.name || q.salesPersonName };
        }
        return q;
      });
      if (fixed) {
        localStorage.setItem(cacheKey, JSON.stringify(updated));
        setServerQuotations(updated);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.email]);

  // 🔥 从后端加载报价单列表（只读服务器数据，不读本地）
  const [serverQuotations, setServerQuotations] = useState<any[]>(() => {
    const cached = readSalesQuotationCache(currentUser?.email);
    if (cached.length > 0) return cached;
    return mergeDraftOverrides(readSalesQuotationLocalFallback());
  });
  const [loadingFromApi, setLoadingFromApi] = useState(false);

  // 🔥 加载数据的函数
  const loadSalesQuotations = React.useCallback(() => {
    setLoadingFromApi(true);
    salesQuotationService.getAll()
      .then((rows) => {
        const quotations: any[] = Array.isArray(rows) ? rows : [];
        if (quotations.length === 0) {
          const existingCache = readSalesQuotationCache(currentUser?.email);
          const contextList = Array.isArray(quotationsRef.current) ? (quotationsRef.current as any[]) : [];
          const legacyList = readSalesQuotationLocalFallback();
          const fallback = existingCache.length > 0
            ? existingCache
            : contextList.length > 0
              ? mergeDraftOverrides(contextList)
              : legacyList.length > 0
                ? mergeDraftOverrides(legacyList)
                : [];
          if (fallback.length > 0) {
            setServerQuotations(fallback);
            writeSalesQuotationCache(currentUser?.email, fallback);
          }
        } else {
          let merged = mergeDraftOverrides(quotations);
          try {
            const apiIds = new Set(quotations.flatMap((q: any) => [String(q.qtNumber), String(q.id)].filter(Boolean)));
            const bridge = JSON.parse(localStorage.getItem('customer_quotations_bridge') || '[]');
            const trimmed = bridge.filter((b: any) => !apiIds.has(String(b.qtNumber)) && !apiIds.has(String(b.id)));
            localStorage.setItem('customer_quotations_bridge', JSON.stringify(trimmed));
          } catch {}
          try {
            const declineBridge: any[] = JSON.parse(localStorage.getItem('customer_decline_bridge') || '[]');
            if (declineBridge.length > 0) {
              merged = merged.map((q: any) => {
                const entry = declineBridge.find((b: any) =>
                  (b.qtNumber && b.qtNumber === q.qtNumber) || (b.id && b.id === String(q.id))
                );
                if (entry?.customerResponse && q.customerStatus !== 'sent' && q.customerStatus !== 'accepted') {
                  return { ...q, customerStatus: entry.customerStatus ?? q.customerStatus, customerResponse: entry.customerResponse };
                }
                return q;
              });
            }
          } catch {}
          setServerQuotations(merged);
          writeSalesQuotationCache(currentUser?.email, merged);
        }
      })
      .catch((err) => {
        console.error('❌ [SalesQuotationManagement] 加载 sales_quotations 失败:', err);
        const existingCache = readSalesQuotationCache(currentUser?.email);
        const contextList = Array.isArray(quotationsRef.current) ? (quotationsRef.current as any[]) : [];
        const legacyList = readSalesQuotationLocalFallback();
        const fallback = existingCache.length > 0 ? existingCache
          : contextList.length > 0 ? mergeDraftOverrides(contextList)
          : legacyList.length > 0 ? mergeDraftOverrides(legacyList) : [];
        if (fallback.length > 0) {
          setServerQuotations(fallback);
          writeSalesQuotationCache(currentUser?.email, fallback);
        }
      })
      .finally(() => {
        setLoadingFromApi(false);
      });
  }, [currentUser?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // 🔥 初始加载
  useEffect(() => {
    loadSalesQuotations();
  }, [loadSalesQuotations]);

  // 🔥 ERP事件驱动刷新（减少跨流程切换后的显示延迟）
  useEffect(() => {
    let timer: number | null = null;
    const triggerReload = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        loadSalesQuotations();
      }, 120);
    };

    const unsubscribe = subscribeErpEvent((event) => {
      // QUOTATION_SENT 是业务员主动发出的，不应触发自身 reload（否则会从 API 拉回旧的 not_sent 覆盖本地）
      if (
        event.key === ERP_EVENT_KEYS.QUOTATION_CREATED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_ACCEPTED ||
        event.key === ERP_EVENT_KEYS.QUOTATION_DELETED ||
        event.key === ERP_EVENT_KEYS.INQUIRY_SUBMITTED ||
        event.key === ERP_EVENT_KEYS.ORDER_CREATED
      ) {
        triggerReload();
      }
    });

    return () => {
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, [loadSalesQuotations]);

  // 🔥 当 highlightQtNumber 变化时（下推后切换过来），重新加载数据
  useEffect(() => {
    if (highlightQtNumber) {
      console.log('🔄 [报价管理] 检测到 highlightQtNumber 变化，重新加载数据:', highlightQtNumber);
      loadSalesQuotations();
    }
  }, [highlightQtNumber, loadSalesQuotations]);

  // 如果接口尚未返回且本地缓存为空，则用 Context 兜底，避免页面先空白
  useEffect(() => {
    if (serverQuotations.length === 0 && Array.isArray(quotations) && quotations.length > 0) {
      setServerQuotations(mergeDraftOverrides(quotations as any[]));
    }
  }, [quotations, serverQuotations.length]);
  
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
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的报价单！');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedIds.length} 个报价单吗？此操作不可恢复！`)) {
      const ids = selectedIds.map((id) => String(id));
      let deletedCount = 0;
      for (const id of ids) {
        try {
          await salesQuotationService.delete(id);
          deletedCount += 1;
        } catch {}
      }
      if (deletedCount < ids.length) appendDeletedIds(ids);

      removeDraftOverrideByIds(ids);
      setServerQuotations((prev) => prev.filter((qt) => !ids.includes(String(qt.id))));
      setSelectedIds([]);
      toast.success(`成功删除 ${ids.length} 个报价单！`);
      if (deletedCount > 0) loadSalesQuotations();
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
  
  // 🔥 申请复核：客户拒绝后，业务员申请主管重新审核定价
  const handleSubmitForReview = async (qt: any) => {
    const amount = qt.totalAmount || qt.totalPrice;
    if (!amount || amount <= 0) {
      toast.error('❌ 无法申请复核：报价金额为0');
      return;
    }

    const requiresDirectorReview = amount >= 20000;
    const managerEmail = getRegionalManager(currentUser?.region);
    const directorEmail = 'sales.director@cosun.com';
    const declineReason = qt.customerResponse?.comment || '';

    const approvalChain = [
      { level: 1, approverRole: '区域业务主管', approverEmail: managerEmail, status: 'pending' },
      ...(requiresDirectorReview
        ? [{ level: 2, approverRole: '销售总监', approverEmail: directorEmail, status: 'pending' }]
        : []),
    ];

    // ─── 1. 同步到 Supabase（重置审批状态为 pending_approval）───
    try {
      const submitKey = qt.qtNumber || qt.id;
      await salesQuotationService.updateStatus(submitKey, 'pending_approval', { approval_chain: approvalChain });
    } catch (e: any) {
      toast.error(`❌ 申请复核失败：${e?.message || 'Supabase 写入失败'}`);
      return;
    }

    // ─── 2. 更新本地状态 ───
    setServerQuotations((prev: any[]) =>
      prev.map((q: any) =>
        q.id === qt.id ? { ...q, approvalStatus: 'pending_approval', approvalChain } : q
      )
    );
    try {
      const cacheKey = getSalesQuotationCacheKey(currentUser?.email);
      const cachedList = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const updated = cachedList.map((q: any) =>
        q.id === qt.id ? { ...q, approvalStatus: 'pending_approval', approvalChain } : q
      );
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch {}

    // ─── 3. 推送到审批中心（主管可立即看到复核请求）───
    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const productCount = qt.items?.length ?? 0;
    const productSummary = productCount === 1
      ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit}`
      : productCount > 1
        ? `${qt.items[0].productName} × ${qt.items[0].quantity} ${qt.items[0].unit} 等 ${productCount} 项产品`
        : '暂无产品';

    const reviewNote = declineReason
      ? `客户拒绝报价，申请主管复核定价。客户拒绝理由：${declineReason}`
      : '客户拒绝报价，申请主管复核定价。';

    const baseReviewRequest = {
      id: qt.id,
      type: 'quotation' as const,
      relatedDocumentId: qt.qtNumber || qt.id,
      relatedDocumentType: '销售报价单（复核申请）',
      relatedDocument: { ...qt },
      submittedBy: currentUser?.email || '',
      submittedByName: currentUser?.name || currentUser?.email || '',
      submittedByRole: currentUser?.userRole || currentUser?.role || 'Sales',
      submittedAt: now.toISOString(),
      region: qt.region || currentUser?.region || 'NA',
      requiresDirectorApproval: requiresDirectorReview,
      status: 'pending' as const,
      urgency: (amount >= 100000 ? 'high' : 'normal') as 'high' | 'normal',
      amount,
      currency: qt.currency || 'USD',
      customerName: qt.customerCompany || qt.customerName || 'Customer',
      customerEmail: qt.customerEmail || '',
      productSummary,
      approvalChain,
      approvalHistory: [],
      deadline: deadline.toISOString(),
      expiresIn: 24,
      reviewNote,
      nextApprover: requiresDirectorReview ? directorEmail : null,
      nextApproverRole: requiresDirectorReview ? '销售总监' : null,
    };

    await pushApprovalBridgeItem({
      currentApprover: managerEmail,
      request: { ...baseReviewRequest, currentApprover: managerEmail, currentApproverRole: '区域业务主管' },
    });

    toast.success('✅ 复核申请已提交给主管！', {
      description: `主管将收到复核请求。${declineReason ? `\n客户拒绝理由：${declineReason}` : ''}`,
      duration: 5000,
    });
  };
  
  // 🔥 撤回审批：将待审批中的报价单撤回为草稿，可重新编辑/提交
  // 场景：审批记录被管理员删除，但报价单状态仍停留在 pending_supervisor/pending_director
  const handleWithdraw = async (qt: any) => {
    if (!window.confirm(`确定撤回报价单 ${qt.qtNumber} 吗？撤回后可重新编辑并提交审批。`)) return;
    try {
      const qtId = qt.id || qt.quotation_uid || qt.qtNumber;
      await salesQuotationService.updateStatus(qtId, 'draft', { approval_chain: [] });
      toast.success('✅ 报价单已撤回，可重新编辑并提交审批', {
        description: `报价单号：${qt.qtNumber}`,
        duration: 4000,
      });
      loadSalesQuotations();
    } catch (e: any) {
      console.warn('⚠️ [撤回] Supabase 同步失败，降级本地模式:', e?.message);
      setServerQuotations((prev: any[]) =>
        prev.map((q: any) => q.id === qt.id ? { ...q, approvalStatus: 'draft', approvalChain: [] } : q)
      );
      toast.success('✅ 报价单已撤回（本地），可重新编辑并提交审批', {
        description: `报价单号：${qt.qtNumber}`,
        duration: 4000,
      });
    }
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

    // ─── 1. 同步到 Supabase ───
    try {
      const submitKey = qt.qtNumber || qt.id;
      await salesQuotationService.updateStatus(submitKey, 'pending_approval', {
        approval_chain: approvalChain,
        items: qt.items,
        total_price: amount,
      });
    } catch (e: any) {
      toast.error(`❌ 提交审批失败：${e?.message || 'Supabase 写入失败'}`);
      return;
    }

    // ─── 2. 无论后端是否成功，都在本地更新状态 ───
    setServerQuotations((prev: any[]) =>
      prev.map((q: any) => q.id === qt.id
        ? { ...q, approvalStatus: 'pending_approval', approvalChain }
        : q
      )
    );
    // 同步写入本地缓存（确保切页后状态不丢失，key 与 getSalesQuotationCacheKey 保持一致）
    try {
      const cacheKey = getSalesQuotationCacheKey(currentUser?.email);
      const cachedList = JSON.parse(localStorage.getItem(cacheKey) || '[]');
      const updated = cachedList.map((q: any) => q.id === qt.id
        ? { ...q, approvalStatus: 'pending_approval', approvalChain }
        : q
      );
      localStorage.setItem(cacheKey, JSON.stringify(updated));
    } catch {}

    try {
      const now = new Date();
      const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const baseRequest = {
        id: qt.id,
        type: 'quotation',
        relatedDocumentId: qt.qtNumber || qt.id,
        relatedDocumentType: '销售报价单',
        relatedDocument: { ...qt, id: qt.id },
        submittedBy: currentUser?.email || '',
        submittedByName: currentUser?.name || currentUser?.email || '',
        submittedByRole: currentUser?.userRole || currentUser?.role || 'Sales',
        submittedAt: now.toISOString(),
        region: qt.region || currentUser?.region || 'NA',
        nextApprover: requiresDirectorReview ? directorEmail : null,
        nextApproverRole: requiresDirectorReview ? '销售总监' : null,
        requiresDirectorApproval: requiresDirectorReview,
        status: 'pending',
        urgency: amount >= 100000 ? 'high' : 'normal',
        amount,
        currency: qt.currency || 'USD',
        customerName: qt.customerCompany || qt.customerName || 'Customer',
        customerEmail: qt.customerEmail || '',
        productSummary,
        approvalHistory: [],
        deadline: deadline.toISOString(),
        expiresIn: 24,
      };

      // 注入到主管审批中心（切页可立即看到）
      await pushApprovalBridgeItem({
        currentApprover: managerEmail,
        request: {
          ...baseRequest,
          currentApprover: managerEmail,
          currentApproverRole: '区域业务主管',
        },
      });

      // 提交后刷新列表，确保以 Supabase 实际状态回流
      loadSalesQuotations();
    } catch (e: any) {
      console.error('❌ bridge 注入失败:', e);
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
    
    const nowIso = new Date().toISOString();
    const updateListLocal = (list: any[]): any[] =>
      list.map((q: any) =>
        (q.id === qt.id || q.qtNumber === qt.qtNumber)
          ? { ...q, customerStatus: 'sent', sentAt: nowIso, sentToCustomerAt: nowIso }
          : q
      );

    const applyLocalSent = () => {
      setServerQuotations((prev) => updateListLocal(prev));
      const cacheKey = `sales_quotation_management_cache_v1:${qt.salesPersonEmail || currentUser?.email || 'default'}`;
      const rawGlobal = localStorage.getItem('salesQuotations');
      if (rawGlobal) localStorage.setItem('salesQuotations', JSON.stringify(updateListLocal(JSON.parse(rawGlobal))));
      const rawCache = localStorage.getItem(cacheKey);
      if (rawCache) localStorage.setItem(cacheKey, JSON.stringify(updateListLocal(JSON.parse(rawCache))));

      emitErpEvent({
        id: `evt-qt-sent-${Date.now()}`,
        key: ERP_EVENT_KEYS.QUOTATION_SENT,
        domain: 'quotation',
        recordId: String(qt.id || qt.qtNumber),
        internalNo: String(qt.qtNumber || ''),
        source: 'salesperson',
        occurredAt: nowIso,
        metadata: { customerEmail: qt.customerEmail, customerCompany: qt.customerCompany },
      });
    };

    try {
      const sendKey = qt.qtNumber || qt.id;
      let apiQuotation: any = null;
      try {
        await salesQuotationService.updateStatus(sendKey, 'sent', { customer_status: 'sent', sent_to_customer_at: nowIso });
        apiQuotation = qt;
      } catch (patchErr: any) {
        console.warn('⚠️ [send-to-customer] Supabase 更新失败:', patchErr?.message);
      }

      // 合并时：用 API 返回的元数据（customerEmail、id 等），但保留本地 items（业务员改过的价格）
      // 不能用 apiQuotation.items，因为 DB 可能存的是旧价格（智能反馈自动算的），业务员手动调整后只在前端
      // 强制规范化 items：确保 salesPrice 始终有值（优先 salesPrice，其次 unitPrice，再次 quotePrice）
      const normalizeItems = (items: any[]) =>
        items.map((item: any) => ({
          ...item,
          salesPrice: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0),
          unitPrice:  Number(item.unitPrice ?? item.salesPrice ?? item.quotePrice ?? 0),
        }));

      const rawLocalItems = qt.items && qt.items.length > 0 ? qt.items : null;
      const localItems = rawLocalItems ? normalizeItems(rawLocalItems) : null;
      const localTotalPrice = localItems && localItems.length > 0
        ? localItems.reduce((sum: number, item: any) => sum + (Number(item.salesPrice) * Number(item.quantity ?? 0)), 0)
        : null;
      const latestQt = apiQuotation
        ? {
            ...qt,
            ...apiQuotation,
            // 强制保留本地 items 和 totalPrice，不被 API 旧数据覆盖
            items: localItems ?? normalizeItems(apiQuotation.items ?? []),
            totalPrice: (localTotalPrice && localTotalPrice > 0) ? localTotalPrice : (apiQuotation.totalPrice ?? qt.totalPrice),
          }
        : { ...qt, items: rawLocalItems ? normalizeItems(rawLocalItems) : qt.items };
      const sentEntry = { ...latestQt, customerStatus: 'sent', sentAt: nowIso, sentToCustomerAt: nowIso };
      try {
        const existing = JSON.parse(localStorage.getItem('customer_quotations_bridge') || '[]');
        const deduped = existing.filter((q: any) => q.qtNumber !== sentEntry.qtNumber && q.id !== sentEntry.id);
        deduped.push(sentEntry);
        localStorage.setItem('customer_quotations_bridge', JSON.stringify(deduped));
      } catch {}
      // 重发后清除 decline bridge 里的旧拒绝记录，避免后续加载时覆盖最新 sent 状态
      try {
        const declineBridge: any[] = JSON.parse(localStorage.getItem('customer_decline_bridge') || '[]');
        const filtered = declineBridge.filter((b: any) =>
          b.qtNumber !== qt.qtNumber && b.id !== String(qt.id)
        );
        localStorage.setItem('customer_decline_bridge', JSON.stringify(filtered));
      } catch {}

      applyLocalSent();
      toast.success('✅ 报价单已成功发送给客户！', {
        description: `客户 ${latestQt.customerCompany || qt.customerCompany} (${latestQt.customerEmail || qt.customerEmail}) 现在可以在 Customer Portal 中查看报价单 ${qt.qtNumber}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ [SalesQuotationManagement] 发送报价单接口失败, 启用本地兼容:', error);
      try {
        applyLocalSent();
        toast.success('✅ 报价单已发送给客户（本地兼容模式）', {
          description: `客户 ${qt.customerCompany} (${qt.customerEmail}) 的报价单 ${qt.qtNumber} 状态已更新`,
          duration: 5000,
        });
      } catch (fallbackErr) {
        console.error('❌ 本地兼容也失败:', fallbackErr);
        toast.error(`❌ 发送失败: ${error?.message || '未知错误'}`);
      }
    }
  };

  // 将“已发送”重置回“未发送”，用于重新走发送流程
  const handleUnlockSend = async (qt: any) => {
    const key = qt.qtNumber || qt.id;
    const applyLocalUnlock = () => {
      const patchList = (list: any[]) =>
        list.map((q: any) =>
          (q.id === qt.id || q.qtNumber === qt.qtNumber)
            ? { ...q, customerStatus: 'not_sent', customerResponse: null, sentAt: null, sentToCustomerAt: null }
            : q
        );

      setServerQuotations((prev) => patchList(prev));
      try {
        const rawGlobal = localStorage.getItem('salesQuotations');
        if (rawGlobal) localStorage.setItem('salesQuotations', JSON.stringify(patchList(JSON.parse(rawGlobal))));
        const cacheKey = `sales_quotation_management_cache_v1:${qt.salesPersonEmail || currentUser?.email || 'default'}`;
        const rawCache = localStorage.getItem(cacheKey);
        if (rawCache) localStorage.setItem(cacheKey, JSON.stringify(patchList(JSON.parse(rawCache))));

        // bridge 仅用于客户侧补充：重置后移除该条，避免继续显示 sent
        const bridge = JSON.parse(localStorage.getItem('customer_quotations_bridge') || '[]');
        const trimmed = bridge.filter((b: any) => b.qtNumber !== qt.qtNumber && b.id !== qt.id);
        localStorage.setItem('customer_quotations_bridge', JSON.stringify(trimmed));
      } catch {}
    };

    try {
      await salesQuotationService.updateStatus(String(key), 'approved', { customer_status: null });
      applyLocalUnlock();
      toast.success('已解锁为可发送状态');
    } catch (e: any) {
      console.warn('⚠️ 解锁发送 Supabase 更新失败，降级本地模式:', e?.message);
      applyLocalUnlock();
      toast.success('已解锁为可发送状态（本地兼容）');
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
    
    // 如果已有合同，提示但不阻止（允许重新下推）
    const existingContract = getContractByQuotationNumber(qt.qtNumber);
    if (existingContract) {
      if (!window.confirm(`该报价单已生成合同 ${existingContract.contractNumber}，确定要重新下推吗？`)) {
        return;
      }
    }

    // 在发起任何 API 调用或本地创建前，先清除所有与该报价单相关的合同墓碑
    // 否则新生成的合同会被旧删除标记过滤掉
    {
      const oldContractNumber = existingContract?.contractNumber;
      const markersToRemove = new Set([
        qt.qtNumber,
        qt.id,
        oldContractNumber,
      ].filter(Boolean));
      const removed = removeTombstones(
        (t) => t.domain === 'contract' && markersToRemove.has(t.marker)
      );
      if (removed > 0) {
        console.log(`🧹 [handlePushToContract] 已清除 ${removed} 条合同墓碑`);
      }
    }

    // 先本地创建合同（保证 UI 立即响应），再异步尝试同步到后端
    try {
      const items = (qt.items || []).map((item: any, idx: number) => ({
        id: item.id || `product-${idx}`,
        productName: item.productName || item.name || 'Product',
        modelNo: item.modelNo || '-',
        specification: item.specification || '',
        hsCode: item.hsCode || '',
        quantity: Number(item.quantity || 0),
        unit: item.unit || 'PCS',
        // 优先级：salesPrice > unitPrice > quotePrice（quotePrice 可能是成本价）
        unitPrice: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0),
        currency: item.currency || qt.currency || 'USD',
        amount: Number(item.salesPrice ?? item.unitPrice ?? item.quotePrice ?? 0) * Number(item.quantity || 0),
        deliveryTime: item.leadTime || '',
      }));

      const totalAmount = items.reduce((sum: number, p: any) => sum + p.amount, 0) || Number(qt.totalPrice || qt.totalAmount || 0);

      console.log('🔥 [handlePushToContract] 本地创建合同，items:', items.length, 'totalAmount:', totalAmount);

      const sc = createContract({
        quotationNumber: qt.qtNumber,
        inquiryNumber: qt.inqNumber || qt.xjNumber || '',
        customerName: qt.customerName || qt.customerCompany || '',
        customerEmail: qt.customerEmail || '',
        customerCompany: qt.customerCompany || '',
        customerAddress: qt.customerAddress || '',
        customerCountry: qt.customerCountry || '',
        contactPerson: qt.customerName || '',
        contactPhone: qt.customerPhone || '',
        salesPerson: currentUser?.email || '',
        salesPersonName: currentUser?.name || '',
        region: qt.region || 'NA',
        products: items,
        totalAmount,
        currency: qt.currency || 'USD',
        tradeTerms: qt.tradeTerms?.incoterms || qt.deliveryTerms || 'FOB Xiamen',
        paymentTerms: qt.tradeTerms?.paymentTerms || qt.paymentTerms || '30% T/T deposit, 70% before shipment',
        deliveryTime: qt.tradeTerms?.deliveryTime || '25-30 days after deposit',
        portOfLoading: qt.tradeTerms?.portOfLoading || 'Xiamen, China',
        remarks: qt.remarks || '',
      });

      console.log('✅ [handlePushToContract] createContract 完成，合同编号:', sc.contractNumber);

      // 写入 localStorage 并 dispatch 事件，确保 context 刷新
      const stored: any[] = JSON.parse(localStorage.getItem('salesContracts') || '[]');
      if (!stored.some((c: any) => c.contractNumber === sc.contractNumber)) {
        stored.push(sc);
        localStorage.setItem('salesContracts', JSON.stringify(stored));
      }
      localStorage.removeItem('salesContracts_cleared');
      window.dispatchEvent(new CustomEvent('salesContractCreatedLocally'));
      console.log('📢 [handlePushToContract] dispatched salesContractCreatedLocally');

      // 回写报价单状态
      setServerQuotations((prev: any[]) =>
        prev.map((q: any) =>
          q.id === qt.id
            ? { ...q, pushedToContract: true, pushedContractNumber: sc.contractNumber }
            : q
        )
      );

      toast.success('✅ 销售合同生成成功！', {
        description: `合同编号：${sc.contractNumber}\n正在跳转到订单管理...`,
        duration: 3000,
      });

      setTimeout(() => {
        if (onNavigateToOrdersWithHighlight) {
          onNavigateToOrdersWithHighlight(sc.contractNumber);
        } else if (onNavigateToOrders) {
          onNavigateToOrders();
        }
      }, 600);

      // 异步同步到 Supabase（失败不影响前端显示）
      salesQuotationService.updateStatus(qt.id || qt.qtNumber, 'contract_created', {
        pushed_contract_number: sc.contractNumber,
      }).then(() => {
        loadSalesQuotations();
      }).catch((e: any) => {
        console.warn('⚠️ [handlePushToContract] Supabase 同步失败（不影响本地合同）:', e?.message || e);
      });

    } catch (localErr: any) {
      console.error('❌ [handlePushToContract] 本地创建失败:', localErr);
      toast.error(`❌ 生成销售合同失败: ${localErr?.message || '未知错误'}`);
    }
  };
  
  // 🔥 标准化区域代码
  const normalizeRegionCode = (region: string): 'NA' | 'SA' | 'EA' => {
    const regionMap: Record<string, 'NA' | 'SA' | 'EA'> = {
      'NA': 'NA',
      'North America': 'NA',
      'SA': 'SA',
      'South America': 'SA',
      'EMEA': 'EA',
      'EA': 'EA',
      'Europe & Africa': 'EA',
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
      'EA': 'hans.mueller@cosun.com',      // 欧非区主管：赵国强
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
                <TableHead className="w-28 text-right">产品数量</TableHead>
                <TableHead className="w-32 text-right">产品单价</TableHead>
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
                  <TableCell colSpan={14} className="text-center py-12 text-gray-500">
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

                  const itemQtyTotal = (qt.items || []).reduce(
                    (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
                    0
                  );
                  const unitSet = Array.from(new Set((qt.items || []).map((item: any) => String(item?.unit || '').trim()).filter(Boolean)));
                  const qtyDisplay = unitSet.length === 1
                    ? `${itemQtyTotal.toLocaleString()} ${unitSet[0]}`
                    : `${itemQtyTotal.toLocaleString()} (混合单位)`;

                  const unitPrices = (qt.items || [])
                    .map((item: any) => Number(item?.salesPrice ?? item?.unitPrice ?? 0))
                    .filter((v: number) => Number.isFinite(v) && v > 0);
                  const minPrice = unitPrices.length > 0 ? Math.min(...unitPrices) : null;
                  const maxPrice = unitPrices.length > 0 ? Math.max(...unitPrices) : null;
                  const unitPriceDisplay =
                    minPrice == null || maxPrice == null
                      ? '--'
                      : minPrice === maxPrice
                        ? `$${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : `$${minPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ~ $${maxPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  
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
                      {(() => {
                        const items = Array.isArray(qt.items) ? qt.items : [];
                        const first = items[0];
                        const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                        const unit = first?.unit || '';
                        return (
                          <div className="space-y-1">
                            <div>
                              <span className="font-medium">{first?.productName || 'N/A'}</span>
                            </div>
                            <div className="text-gray-500">
                              共 {Math.max(items.length, 1)} 个产品 · {totalQty.toLocaleString()} {unit}
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-gray-900">{qtyDisplay}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium text-gray-900">{unitPriceDisplay}</div>
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
                      <div className="flex flex-col items-center gap-1">
                        {getCustomerStatusBadge(qt)}
                        {(qt.customerStatus === 'rejected' || qt.customerStatus === 'negotiating') && qt.customerResponse?.comment && (
                          <div className={`text-[10px] max-w-[120px] truncate ${qt.customerStatus === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}
                            title={qt.customerResponse.comment}>
                            💭 {qt.customerResponse.comment}
                          </div>
                        )}
                      </div>
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
                        
                        {(qt.approvalStatus === 'draft' || qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
                          <Button 
                            size="sm"
                            onClick={() => handleCalculatePrice(qt)}
                            className="gap-1 bg-orange-600 hover:bg-orange-700 h-7 text-[11px]"
                          >
                            <Calculator className="h-3 w-3" />
                            核算价格
                          </Button>
                        )}
                        
                        {/* 🔥 提交给主管审核按钮 - 草稿或可重新提交的状态下显示 */}
                        {(qt.approvalStatus === 'draft' || qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
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
                        
                        {/* 🔥 撤回按钮 - 待审批中（主管/总监）可撤回回草稿，重新编辑/提交 */}
                        {(qt.approvalStatus === 'pending_supervisor' || qt.approvalStatus === 'pending_director' || qt.approvalStatus === 'pending_approval') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdraw(qt)}
                            className="gap-1 h-7 text-[11px] border-amber-400 text-amber-700 hover:bg-amber-50"
                            title="撤回审批，回到草稿状态，可重新编辑并提交"
                          >
                            <XCircle className="h-3 w-3" />
                            撤回
                          </Button>
                        )}

                        {/* 🔥 申请复核按钮 - 客户拒绝且审批未重新通过，或上级驳回时显示 */}
                        {((qt.customerStatus === 'rejected' && qt.approvalStatus !== 'approved') || qt.approvalStatus === 'rejected') && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSubmitForReview(qt)}
                            className="gap-1 bg-indigo-600 hover:bg-indigo-700 h-7 text-[11px]"
                            title={`${(qt.totalAmount ?? qt.totalPrice ?? 0) >= 20000 ? '金额≥$20,000，需主管+总监双重复核' : '金额<$20,000，只需主管复核'}${qt.customerResponse?.comment ? `\n客户拒绝理由：${qt.customerResponse.comment}` : ''}`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            申请复核
                          </Button>
                        )}
                        
                        {qt.approvalStatus === 'approved' && qt.customerStatus !== 'accepted' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSendToCustomer(qt)}
                            className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-[11px]"
                            title={qt.customerStatus === 'rejected' ? '客户已拒绝，复核通过后可重新发送' : '发送报价单给客户'}
                          >
                            <Send className="h-3 w-3" />
                            发送
                          </Button>
                        )}
                        
                        {/* 下推生成销售合同 - 客户确认后显示，可重复下推 */}
                        {(qt.customerResponse?.status === 'accepted' || qt.customerStatus === 'accepted') && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handlePushToContract(qt)}
                            className="gap-1 bg-purple-600 hover:bg-purple-700 h-7 text-[11px]"
                          >
                            <FileSignature className="h-3 w-3" />
                            下推生成销售合同
                          </Button>
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
          onSubmit={async (quoteData) => {
            try {
              await salesQuotationService.upsert({ id: String(selectedQuotation.id), ...quoteData });
              toast.success('报价草稿已保存');
              loadSalesQuotations();
              setShowPriceCalculation(false);
              setSelectedQuotation(null);
            } catch (e: any) {
              console.error('❌ 保存报价草稿失败:', e);
              const fallback = mapQuoteDataToServerLike(quoteData, selectedQuotation);
              writeDraftOverride(String(selectedQuotation.id), fallback);
              setServerQuotations(prev =>
                prev.map(qt =>
                  String(qt.id) === String(selectedQuotation.id)
                    ? { ...qt, ...fallback, id: qt.id, qtNumber: qt.qtNumber }
                    : qt
                )
              );
              toast.success('报价草稿已保存（本地兼容模式）');
              setShowPriceCalculation(false);
              setSelectedQuotation(null);
            }
          }}
        />
      )}
    </div>
  );
}
