import React, { useEffect, useMemo, useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  Eye, 
  Clock,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Filter,
  Plus,
  FileText,
  Truck,
  Calendar,
  Printer,
  Trash2,  // 🔥 添加删除图标
  Send,  // 🔥 提交图标
  Edit,  // 🔥 编辑图标
  Calculator  // 🔥 智能反馈图标
} from 'lucide-react';
import { suppliersDatabase, type Supplier } from '../../data/suppliersData'; // fallback only，已废弃，以 Supabase companies 表为准
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner@2.0.3';
import { PurchaseOrderDocument, PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument'; // 🔥 文档中心采购订单模板
import { XJData } from '../documents/templates/XJDocument'; // 🔥 采购询价单(XJ)模板
import QuoteCreationIntelligent from './QuoteCreationIntelligent'; // 🔥 智能报价创建页面
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport'; // 🔥 PDF导出工具
import { usePurchaseRequirements, PurchaseRequirement, PurchaserFeedback } from '../../contexts/PurchaseRequirementContext'; // 🔥 采购需求Context
import { usePurchaseOrders, PurchaseOrder as PurchaseOrderType, PurchaseOrderItem } from '../../contexts/PurchaseOrderContext'; // 🔥 采购订单Context
import { useXJs, XJ, XJProduct } from '../../contexts/XJContext'; // 🔥 XJ Context
import { useQuotations } from '../../contexts/QuotationContext'; // 🔥 报价Context（用于保存业务员报价）
import { PurchaserFeedbackForm } from './PurchaserFeedbackForm'; // 🔥 智能采购反馈表单
import { useUser } from '../../contexts/UserContext'; // 🔥 用户Context
import { useApproval } from '../../contexts/ApprovalContext';
import { generateXJNumber, nextXJNumber } from '../../utils/xjNumberGenerator'; // 🔥 XJ编号生成器
import { generateCGNumber, nextCGNumberAsync, normalizeCGNumberForDisplay } from '../../utils/purchaseOrderNumberGenerator';
import { contractService, xjService, supplierQuotationService, companyService } from '../../lib/supabaseService';
import { TERMS_OPTIONS } from './purchase-order/purchaseOrderConstants'; // 🔥 从常量文件导入
import { PurchaseOrderEditDialog } from './purchase-order/PurchaseOrderEditDialog';
import { PurchaseOrderCreateDialogs } from './purchase-order/PurchaseOrderCreateDialogs';
import { EditXJDialog } from './purchase-order/EditXJDialog';
import { XJPreviewDialog } from './purchase-order/XJPreviewDialog';
import { SupplierQuotationDialog } from './purchase-order/SupplierQuotationDialog';
import { CreateXJAndHistoryDialogs } from './purchase-order/CreateXJAndHistoryDialogs';
import { PurchaseOrdersTab } from './purchase-order/PurchaseOrdersTab';
import { ProcurementRequestsTab } from './purchase-order/ProcurementRequestsTab';
import { SupplierAllocationDialog } from './purchase-order/SupplierAllocationDialog';
import { PurchaseOrderDetailDialog } from './purchase-order/PurchaseOrderDetailDialog';
import { PurchaseOrderPreviewDialog } from './purchase-order/PurchaseOrderPreviewDialog';
import { PurchaseRequirementPreviewDialog } from './purchase-order/PurchaseRequirementPreviewDialog';
import {
  createInitialCreateOrderForm,
  createInitialEditPOForm,
  EditPOFormState,
  normalizeCurrencyCode,
  normalizeRegionalDocNo,
} from './purchase-order/purchaseOrderEditConfig';
import {
  getBusinessTypeLabel, 
  getUrgencyConfig,
  convertToPOData,
  convertToPRData,
  desensitizeFeedback,
  generateXJDocumentData
} from './purchase-order/purchaseOrderUtils'; // 🔥 从工具函数文件导入
import { addTombstones } from '../../lib/erp-core/deletion-tombstone';

/**
 * 🔥 采购订单管理 - 台湾大厂风格
 * 与供应商管理保持一致的UI设计
 */

// 🔥 采购订单类型已从PurchaseOrderContext导入，不再在此定义
// 🔥 TERMS_OPTIONS已从purchase-order/purchaseOrderConstants.ts导入，不再在此定义
// UI 缓存键：审批请求在切页时的即时通知缓存，业务数据已写入 Supabase approval_records 表
// 此 localStorage 仅用于减少切页空窗，可安全删除（不影响 Supabase 中的审批数据）
const APPROVAL_CENTER_BRIDGE_KEY = 'approval_center_pending_bridge_v1';

const PurchaseOrderManagementEnhanced: React.FC = () => {
  
  // 🔥 使用采购需求Context - 添加deleteRequirement
  const { requirements, updateRequirement, deleteRequirement } = usePurchaseRequirements();
  // 🔥 使用采购订单Context
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  // 🔥 使用XJ Context - 获取rfqs列表用于计算状态
  const { xjs, addXJ, updateXJ, deleteXJ } = useXJs();
  // 🔥 使用报价Context - 用于保存业务员创建的报价单
  const { addQuotation } = useQuotations();
  // 🔥 用户Context - 获取当前用户信息
  const { user } = useUser();
  const { requests: approvalRequests, addApprovalRequest, updateApprovalRequest } = useApproval();
  const isProcurementRequestRecord = React.useCallback((po: PurchaseOrderType) => {
    const reqStatus = String((po as any).procurementRequestStatus || '').trim();
    const poNo = String(po.poNumber || '').trim().toUpperCase();
    return reqStatus === 'pending_procurement_assignment' || poNo.startsWith('CQ-');
  }, []);
  const requestPurchaseOrders = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
  }, []);
  useEffect(() => {
    // 进入采购订单页时主动请求一次
    requestPurchaseOrders();
  }, [requestPurchaseOrders]);
  const [activeTab, setActiveTab] = useState<'requirements' | 'xj-management' | 'supplier-quotations' | 'procurement-requests' | 'orders'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedBusinessType, setSelectedBusinessType] = useState('all');
  const [viewOrder, setViewOrder] = useState<PurchaseOrderType | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  
  // 🔥 需求详情对话框状态
  const [viewRequirement, setViewRequirement] = useState<PurchaseRequirement | null>(null);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  
  // 🔥 智能报价创建对话框状态
  const [showQuoteCreation, setShowQuoteCreation] = useState(false);
  const [selectedRequirementForQuote, setSelectedRequirementForQuote] = useState<PurchaseRequirement | null>(null);
  
  // 🔥 创建采购订单对话框状态
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<PurchaseRequirement | null>(null);
  const [createOrderForm, setCreateOrderForm] = useState(createInitialCreateOrderForm);
  const [showEditPODialog, setShowEditPODialog] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrderType | null>(null);
  const [editPOForm, setEditPOForm] = useState<EditPOFormState>(createInitialEditPOForm);
  const [editPOItems, setEditPOItems] = useState<PurchaseOrderItem[]>([]);
  const [editPOOrderDate, setEditPOOrderDate] = useState<Date | undefined>(undefined);
  const [editPOExpectedDate, setEditPOExpectedDate] = useState<Date | undefined>(undefined);
  const [editPOActualDate, setEditPOActualDate] = useState<Date | undefined>(undefined);
  
  // 🔥 供应商选择对话框状态
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  
  // 🔥 产品单价映射 - 每个产品独立的单价
  const [productPrices, setProductPrices] = useState<{ [itemId: string]: string }>({});
  
  // 🔥 PDF导出相关状态
  const [showPOPreview, setShowPOPreview] = useState(false);
  const [currentPOData, setCurrentPOData] = useState<PurchaseOrderData | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const poPDFRef = React.useRef<HTMLDivElement>(null);
  const hiddenPDFRef = React.useRef<HTMLDivElement>(null); // 🔥 隐藏的PDF导出专用ref
  
  // 🔥 创建XJ对话框状态
  const [showCreateXJDialog, setShowCreateRFQDialog] = useState(false);
  const [selectedRequirementForXJ, setSelectedRequirementForRFQ] = useState<PurchaseRequirement | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [xjDeadline, setRFQDeadline] = useState<Date | undefined>(undefined);
  const [xjRemarks, setRFQRemarks] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🔥 选中的产品ID（统一用 string）
  const [submittingXJ, setSubmittingRFQ] = useState(false);
  
  // 🔥 询价历史弹窗状态
  const [showXJHistoryDialog, setShowRFQHistoryDialog] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);
  
  // 🔥 询价单预览状态
  const [showXJPreview, setShowRFQPreview] = useState(false);
  const [currentXJData, setCurrentRFQData] = useState<XJData | null>(null);
  const xjDocRef = React.useRef<HTMLDivElement>(null);
  
  // 🔥 询价单编辑状态
  const [showEditXJDialog, setShowEditXJDialog] = useState(false);
  const [editingXJ, setEditingXJ] = useState<XJ | null>(null);
  const [editXJData, setEditRFQData] = useState<any>(null); // 完整的documentData
  
  // 🔥 询价管理 - 搜索和批量删除状态
  const [xjSearchTerm, setRFQSearchTerm] = useState('');
  const [selectedXJIds, setSelectedRFQIds] = useState<string[]>([]);

  // 🔥 采购需求池 - 搜索和批量删除状态
  const [requirementSearchTerm, setRequirementSearchTerm] = useState('');
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);

  // 🔥 供应商报价 - 搜索和批量删除状态
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);

  // 🔥 采购订单 - 搜索和批量删除状态
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [procurementRequestSearchTerm, setProcurementRequestSearchTerm] = useState('');
  const [selectedProcurementRequestIds, setSelectedProcurementRequestIds] = useState<string[]>([]);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [allocationPO, setAllocationPO] = useState<PurchaseOrderType | null>(null);
  const [submittingAllocation, setSubmittingAllocation] = useState(false);
  const [allocationSupplierSearchTerm, setAllocationSupplierSearchTerm] = useState('');
  const [allocationSelectedSupplierCodes, setAllocationSelectedSupplierCodes] = useState<string[]>([]);
  const [allocationSelectedProductKeys, setAllocationSelectedProductKeys] = useState<string[]>([]);

  // 🔥 智能采购反馈 - 状态管理
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRequirement, setFeedbackRequirement] = useState<PurchaseRequirement | null>(null);

  // 🔥 采购需求数据 - 从Context获取
  const purchaseRequirements = requirements;

  // 🔥 供应商报价数据 - Supabase-first
  const [supplierQuotations, setSupplierQuotations] = useState<any[]>([]);
  const [selectedSupplierQuotation, setSelectedSupplierQuotation] = useState<any>(null);
  const [showSupplierQuotationDialog, setShowSupplierQuotationDialog] = useState(false);
  const [showFeedbackReminderDialog, setShowFeedbackReminderDialog] = useState(false);
  const [acceptedQuotationNo, setAcceptedQuotationNo] = useState<string>('');
  const [salesContractsLite, setSalesContractsLite] = useState<any[]>([]);

  // Supabase-first: 供应商数据从 companies 表读取，静态 suppliersDatabase 仅作加载失败兜底
  const [suppliersFromApi, setSuppliersFromApi] = useState<Supplier[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await companyService.getSuppliers();
        if (!cancelled && Array.isArray(rows) && rows.length > 0) {
          setSuppliersFromApi(rows as Supplier[]);
        }
      } catch (e) {
        console.warn('[PurchaseOrderMgmt] 供应商数据加载失败，使用本地静态数据:', e);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const allSuppliers: Supplier[] = suppliersFromApi.length > 0 ? suppliersFromApi : suppliersDatabase;
  
  // Supabase-first: 直接读 DB status 字段，不在前端重新计算
  // DB purchase_requirements.status 由业务操作（创建XJ、收到报价等）更新
  const calculateRequirementStatus = (req: PurchaseRequirement): 'pending' | 'partial' | 'processing' | 'completed' => {
    const s = req.status as string;
    if (s === 'completed') return 'completed';
    if (s === 'processing' || s === 'in_progress') return 'processing';
    if (s === 'partial') return 'partial';
    return 'pending';
  };

  const getXJKey = (xj: any) => String(xj?.supplierXjNo || xj?.xjNumber || '').trim();
  const getQuotationXJKey = (q: any) => String(q?.sourceXJ || q?.sourceXJNumber || '').trim();

  const hasDownstreamQuotationForXJ = React.useCallback((xj: any, quotationList?: any[]) => {
    const key = getXJKey(xj);
    if (!key) return false;
    const list = Array.isArray(quotationList) ? quotationList : supplierQuotations;
    return list.some((q: any) => getQuotationXJKey(q) === key);
  }, [supplierQuotations]);

  const hasDownstreamXJForRequirement = React.useCallback((req: PurchaseRequirement, xjList?: XJ[]) => {
    const reqNo = String(req?.requirementNo || '').trim();
    const list = Array.isArray(xjList) ? xjList : xjs;
    if (!reqNo) return false;
    return list.some((x) => String(x?.requirementNo || '').trim() === reqNo);
  }, [xjs]);

  const recomputeRequirementStatusByXJ = React.useCallback((reqNoList: string[], xjList?: XJ[]) => {
    const list = Array.isArray(xjList) ? xjList : xjs;
    const uniqueReqNos = Array.from(new Set(reqNoList.map((r) => String(r || '').trim()).filter(Boolean)));
    uniqueReqNos.forEach((reqNo) => {
      const req = requirements.find((r) => String(r.requirementNo || '').trim() === reqNo);
      if (!req) return;
      const activeXJCount = list.filter((x) => String(x?.requirementNo || '').trim() === reqNo).length;
      const nextStatus: PurchaseRequirement['status'] = activeXJCount > 0 ? 'processing' : 'pending';
      if ((req.status as any) !== nextStatus) {
        updateRequirement(req.id, { status: nextStatus });
      }
    });
  }, [requirements, updateRequirement, xjs]);
  
  useEffect(() => {
    let cancelled = false;
    const loadSalesContractsLite = async () => {
      if (cancelled) return;
      try {
        const rows = await contractService.getAll();
        if (!cancelled) setSalesContractsLite(Array.isArray(rows) ? rows : []);
      } catch (e: any) {
        console.warn('⚠️ [PurchaseOrderMgmt] 加载销售合同失败:', e?.message);
        if (!cancelled) setSalesContractsLite([]);
      }
    };
    void loadSalesContractsLite();
    return () => { cancelled = true; };
  }, []);

  // 🔥 加载供应商报价数据 — Supabase-first: 纯从 supplier_quotations 表读取
  const loadSupplierQuotationsFromApi = React.useCallback(async () => {
    try {
      const rows = await supplierQuotationService.getAll();
      const apiList: any[] = Array.isArray(rows) ? rows : [];
      setSupplierQuotations(apiList);
    } catch (e: any) {
      console.warn('⚠️ [loadSupplierQuotations] Supabase 读取失败:', e?.message);
      setSupplierQuotations([]);
    }
  }, []);

  // Apply status change to local state after Supabase success
  const applyLocalQuotationStatus = React.useCallback((id: string, status: 'accepted' | 'rejected') => {
    setSupplierQuotations((prev) =>
      prev.map((q: any) => (q.id === id ? { ...q, status } : q)),
    );
  }, []);

  const handleAcceptSupplierQuotation = React.useCallback(async () => {
    if (!selectedSupplierQuotation) return;
    const qid = selectedSupplierQuotation.id;
    try {
      await supplierQuotationService.upsert({ id: qid, status: 'accepted' });
    } catch (e: any) {
      console.warn('⚠️ 接受报价 Supabase 同步失败:', e?.message);
      toast.error('接受报价失败：Supabase 写入未成功');
      return;
    }
    applyLocalQuotationStatus(qid, 'accepted');
    setShowSupplierQuotationDialog(false);
    setAcceptedQuotationNo(selectedSupplierQuotation.quotationNo || qid);
    setShowFeedbackReminderDialog(true);
  }, [selectedSupplierQuotation, applyLocalQuotationStatus]);

  const handleRejectSupplierQuotation = React.useCallback(async () => {
    if (!selectedSupplierQuotation) return;
    const qid = selectedSupplierQuotation.id;
    try {
      await supplierQuotationService.upsert({ id: qid, status: 'rejected' });
    } catch (e: any) {
      console.warn('⚠️ 拒绝报价 Supabase 同步失败:', e?.message);
      toast.error('拒绝报价失败：Supabase 写入未成功');
      return;
    }
    applyLocalQuotationStatus(qid, 'rejected');
    setShowSupplierQuotationDialog(false);
    toast.info(
      <div className="space-y-1">
        <p className="font-semibold">❌ 已拒绝报价</p>
        <p className="text-sm">报价单号: {selectedSupplierQuotation.quotationNo}</p>
        <p className="text-xs text-gray-500">状态已更新</p>
      </div>,
    );
  }, [selectedSupplierQuotation, applyLocalQuotationStatus]);

  React.useEffect(() => {
    if (activeTab === 'supplier-quotations') {
      loadSupplierQuotationsFromApi();
      const interval = setInterval(loadSupplierQuotationsFromApi, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, loadSupplierQuotationsFromApi]);

  // 统计数据
  const stats = useMemo(() => {
    const orderPool = purchaseOrders.filter((po) => !isProcurementRequestRecord(po));
    const total = orderPool.length;
    const pending = orderPool.filter(po => po.status === 'pending').length;
    const producing = orderPool.filter(po => po.status === 'producing').length;
    const completed = orderPool.filter(po => po.status === 'completed').length;
    const totalValue = orderPool.reduce((sum, po) => sum + po.totalAmount, 0);

    return { total, pending, producing, completed, totalValue };
  }, [purchaseOrders, isProcurementRequestRecord]);

  // 需求统计 - 🔥 使用动态计算的状态
  const requirementStats = useMemo(() => {
    const total = purchaseRequirements.length;
    const pending = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'pending').length;
    const partial = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'partial').length; // 🔥 部分提交
    const processing = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'processing').length;
    const highUrgency = purchaseRequirements.filter(r => r.urgency === 'high').length;

    return { total, pending, partial, processing, highUrgency };
  }, [purchaseRequirements, xjs]);

  // 🔥 旧的筛选订单逻辑已删除，使用下面新的 filteredOrders

  // 🔥 筛选询价单 - 根据询价单号、供应商、关联需求
  const filteredXJs = useMemo(() => {
    if (!xjSearchTerm) return xjs;
    
    const lowerSearchTerm = xjSearchTerm.toLowerCase();
    return xjs.filter(xj => 
      xj.supplierXjNo?.toLowerCase().includes(lowerSearchTerm) ||
      xj.supplierName?.toLowerCase().includes(lowerSearchTerm) ||
      xj.requirementNo?.toLowerCase().includes(lowerSearchTerm) ||
      xj.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [xjs, xjSearchTerm]);

  // 🔥 筛选采购需求 - 根据需求编号、来源单号、区域
  const filteredRequirements = useMemo(() => {
    if (!requirementSearchTerm) return purchaseRequirements;
    
    const lowerSearchTerm = requirementSearchTerm.toLowerCase();
    return purchaseRequirements.filter(req => 
      req.requirementNo?.toLowerCase().includes(lowerSearchTerm) ||
      req.sourceRef?.toLowerCase().includes(lowerSearchTerm) ||
      req.source?.toLowerCase().includes(lowerSearchTerm) ||
      req.region?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [purchaseRequirements, requirementSearchTerm]);

  // 🔥 筛选供应商报价 - 根据报价单号、供应商、询价单号
  const filteredQuotations = useMemo(() => {
    if (!quotationSearchTerm) return supplierQuotations;
    
    const lowerSearchTerm = quotationSearchTerm.toLowerCase();
    return supplierQuotations.filter(q => 
      q.quotationNo?.toLowerCase().includes(lowerSearchTerm) ||
      q.supplierName?.toLowerCase().includes(lowerSearchTerm) ||
      q.xjNo?.toLowerCase().includes(lowerSearchTerm) ||
      q.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [supplierQuotations, quotationSearchTerm]);

  // 🔥 筛选采购请求池（业务员提请采购，待采购员分配供应商）
  const filteredProcurementRequests = useMemo(() => {
    const requests = purchaseOrders.filter((po) => isProcurementRequestRecord(po));
    const keyword = procurementRequestSearchTerm.trim().toLowerCase();
    if (!keyword) return requests;

    return requests.filter((order) =>
      order.poNumber?.toLowerCase().includes(keyword) ||
      String((order as any).xjNumber || '').toLowerCase().includes(keyword) ||
      String(order.sourceRef || '').toLowerCase().includes(keyword) ||
      String(order.requirementNo || (order as any).requirementNumber || '').toLowerCase().includes(keyword) ||
      order.supplierName?.toLowerCase().includes(keyword) ||
      order.supplierCode?.toLowerCase().includes(keyword)
    );
  }, [purchaseOrders, procurementRequestSearchTerm, isProcurementRequestRecord]);

  const getProcurementChildOrders = React.useCallback((po: PurchaseOrderType) => {
    const parentNo = String(po.poNumber || '').trim().toUpperCase();
    if (!parentNo.startsWith('CQ-')) return [] as PurchaseOrderType[];
    return purchaseOrders.filter((child) => {
      const childNo = String(child.poNumber || '').trim().toUpperCase();
      const parent = String((child as any).parentRequestPoNumber || '').trim().toUpperCase();
      return !!parent && parent === parentNo && !childNo.startsWith('CQ-');
    });
  }, [purchaseOrders]);

  const hasDownstreamPOForProcurementRequest = React.useCallback((po: PurchaseOrderType) => {
    if (!isProcurementRequestRecord(po)) return false;
    return getProcurementChildOrders(po).length > 0;
  }, [getProcurementChildOrders, isProcurementRequestRecord]);

  const getProcurementRequestRuntimeStatus = React.useCallback((po: PurchaseOrderType) => {
    const requestItems = po.items || [];
    const children = getProcurementChildOrders(po);
    if (children.length === 0) return 'pending_procurement_assignment';
    if (requestItems.length === 0) return 'partial_allocated';

    const isMatched = (reqItem: any) => {
      const reqId = String(reqItem?.id || '').trim();
      const reqModel = String(reqItem?.modelNo || '').trim().toLowerCase();
      const reqName = String(reqItem?.productName || '').trim().toLowerCase();
      return children.some((child) =>
        (child.items || []).some((childItem: any) => {
          const sameId = reqId && String(childItem?.id || '').trim() === reqId;
          const sameModel = reqModel && String(childItem?.modelNo || '').trim().toLowerCase() === reqModel;
          const sameName = reqName && String(childItem?.productName || '').trim().toLowerCase() === reqName;
          return sameId || sameModel || sameName;
        })
      );
    };

    const matchedCount = requestItems.filter((item) => isMatched(item)).length;
    if (matchedCount >= requestItems.length) return 'allocated_completed';
    if (matchedCount > 0) return 'partial_allocated';
    return 'pending_procurement_assignment';
  }, [getProcurementChildOrders]);

  const getProcurementRequestStatusText = (status: string) => {
    if (status === 'allocated_completed') return '已分配完成';
    if (status === 'partial_allocated') return '部分分配';
    return '待分配供应商';
  };

  const pendingProcurementRequestCount = useMemo(() => {
    const requests = purchaseOrders.filter((po) => isProcurementRequestRecord(po));
    return requests.filter((po) => getProcurementRequestRuntimeStatus(po) !== 'allocated_completed').length;
  }, [purchaseOrders, isProcurementRequestRecord, getProcurementRequestRuntimeStatus]);

  // 采购请求状态自动随分配结果变化（包括下游CG被删除后自动恢复可分配）
  useEffect(() => {
    const requests = purchaseOrders.filter((po) => isProcurementRequestRecord(po));
    requests.forEach((po) => {
      const runtimeStatus = getProcurementRequestRuntimeStatus(po);
      const persisted = String((po as any).procurementRequestStatus || '').trim();
      if (persisted !== runtimeStatus) {
        updatePurchaseOrder(po.id, { procurementRequestStatus: runtimeStatus } as any);
      }
    });
  }, [purchaseOrders, isProcurementRequestRecord, getProcurementRequestRuntimeStatus, updatePurchaseOrder]);

  // 🔥 筛选采购订单 - 根据订单号、供应商、需求编号（不含“待分配”的采购请求）
  const filteredOrders = useMemo(() => {
    const orderPool = purchaseOrders.filter((po) => !isProcurementRequestRecord(po));
    if (!orderSearchTerm) return orderPool;

    const lowerSearchTerm = orderSearchTerm.toLowerCase();
    return orderPool.filter(order => 
      order.poNumber?.toLowerCase().includes(lowerSearchTerm) ||
      order.supplierName?.toLowerCase().includes(lowerSearchTerm) ||
      order.requirementNo?.toLowerCase().includes(lowerSearchTerm) ||
      String((order as any).requirementNumber || '').toLowerCase().includes(lowerSearchTerm) ||
      order.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [purchaseOrders, orderSearchTerm, isProcurementRequestRecord]);

  // 采购请求兜底修复：
  // 若业务员已发起“请求采购”并在采购需求中留下 CQ 标记，但采购请求记录异常缺失，则自动补回 CQ 请求记录
  useEffect(() => {
    if (!purchaseRequirements.length) return;

    const existingByPo = new Set(
      (purchaseOrders || []).map((po) => String(po.poNumber || '').trim().toUpperCase()).filter(Boolean)
    );

    purchaseRequirements.forEach((req) => {
      const note = String((req as any).specialRequirements || '');
      const match = note.match(/采购单号[:：]\s*(CQ-\d{6}-\d{4})/i);
      if (!match) return;

      const cqNo = String(match[1] || '').trim().toUpperCase();
      if (!cqNo || existingByPo.has(cqNo)) return;

      const requirementNo = String(req.requirementNo || '').trim();
        const inferredRfq = String((req as any).sourceInquiryNumber || '').trim();
        const recoveredItems = Array.isArray((req as any).items)
          ? (req as any).items.map((item: any, idx: number) => ({
              id: String(item?.id || `item-${idx + 1}`),
              productName: String(item?.productName || 'Unknown Product'),
              modelNo: String(item?.modelNo || item?.productName || '-'),
              specification: String(item?.specification || ''),
              quantity: Number(item?.quantity || 0),
              unit: String(item?.unit || 'PCS'),
              unitPrice: Number(item?.targetPrice || 0),
              currency: normalizeCurrencyCode(item?.targetCurrency || req?.currency || ''),
              subtotal: Number(item?.quantity || 0) * Number(item?.targetPrice || 0),
              hsCode: String(item?.hsCode || ''),
              packingRequirement: String(item?.packingRequirement || ''),
              remarks: String(item?.remarks || ''),
            }))
          : [];
        const recoveredCurrency =
          normalizeCurrencyCode((req as any)?.currency || recoveredItems[0]?.currency || 'USD') || 'USD';

        addPurchaseOrder({
          id: `recovered-${cqNo.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          poNumber: cqNo,
          requirementNo,
        sourceRef: inferredRfq || String(req.sourceRef || '').trim(),
        sourceSONumber: String((req as any).salesOrderNo || req.sourceRef || '').trim(),
        salesContractNumber: String((req as any).sourceRef || '').trim(),
          xjNumber: inferredRfq,
          supplierName: '待采购分配',
          supplierCode: 'TBD',
          region: String((req as any).region || 'NA'),
          items: recoveredItems,
          totalAmount: 0,
          currency: recoveredCurrency,
        paymentTerms: '待采购确认',
        deliveryTerms: '待采购确认',
        orderDate: String((req as any).createdDate || new Date().toISOString()),
        expectedDate: String((req as any).requiredDate || new Date().toISOString()),
        status: 'pending',
        paymentStatus: 'unpaid',
        remarks: note || '系统自动回填采购请求',
        createdBy: String((req as any).createdBy || 'system'),
        createdDate: String((req as any).createdDate || new Date().toISOString()),
        updatedDate: new Date().toISOString(),
        procurementRequestStatus: 'pending_procurement_assignment',
      } as any);
    });
  }, [purchaseRequirements, purchaseOrders, addPurchaseOrder]);

  const requirementByNo = useMemo(() => {
    const byNo = new Map<string, PurchaseRequirement>();
    purchaseRequirements.forEach((req) => {
      if (req.requirementNo) byNo.set(req.requirementNo, req);
    });
    return byNo;
  }, [purchaseRequirements]);

  const getRequirementNoFromPO = (po: PurchaseOrderType): string => {
    return String(po.requirementNo || (po as any).requirementNumber || '').trim();
  };

  const parseDateLike = (value: unknown): Date | undefined => {
    const raw = String(value || '').trim();
    if (!raw) return undefined;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? undefined : d;
  };

  const formatDateForStorage = (date?: Date): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const toNumericAmount = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const getQuotationItems = (quotation: any): any[] => {
    if (Array.isArray(quotation?.items)) return quotation.items;
    if (Array.isArray(quotation?.quoteData?.items)) return quotation.quoteData.items;
    if (Array.isArray(quotation?.documentData?.products)) {
      return quotation.documentData.products.map((p: any) => ({
        id: p?.id || p?.productId || '',
        productName: p?.description || p?.productName || '',
        modelNo: p?.modelNo || '',
        unitPrice: p?.unitPrice || 0,
        currency: p?.currency || quotation?.currency || '',
      }));
    }
    return [];
  };

  const findRequirementForPO = (po: PurchaseOrderType): PurchaseRequirement | undefined => {
    const requirementNo = getRequirementNoFromPO(po);
    if (requirementNo && requirementByNo.has(requirementNo)) {
      return requirementByNo.get(requirementNo);
    }
    const refs = [
      String((po as any).salesContractNumber || '').trim(),
      String((po as any).sourceSONumber || '').trim(),
      String(po.sourceRef || '').trim(),
      String((po as any).quotationNumber || '').trim(),
    ].filter(Boolean);
    if (refs.length === 0) return undefined;
    return purchaseRequirements.find((req: any) => {
      const reqRefs = [
        String(req.salesContractNumber || '').trim(),
        String(req.salesOrderNo || '').trim(),
        String(req.sourceRef || '').trim(),
        String(req.quotationNumber || '').trim(),
      ];
      return refs.some((ref) => reqRefs.includes(ref));
    });
  };

  const getXJNumberByRequirementNo = (requirementNo: string): string => {
    if (!requirementNo) return '';
    const matchedXJ = xjs.find((xj) => String(xj.requirementNo || '').trim() === requirementNo);
    const candidate = String(
      (matchedXJ as any)?.sourceInquiryNumber ||
      matchedXJ?.sourceInquiryNumber ||
      matchedXJ?.xjNumber ||
      '',
    ).trim();
    return candidate.startsWith('RFQ-') || candidate.startsWith('INQ-') ? candidate : '';
  };

  const getInquiryByContractRef = (po: PurchaseOrderType): string => {
    const refs = [
      String((po as any).sourceSONumber || '').trim(),
      String((po as any).salesContractNumber || '').trim(),
      String(po.sourceRef || '').trim(),
      String(po.poNumber || '').trim(),
    ].filter(Boolean);
    if (refs.length === 0) return '';

    const matchedContract = salesContractsLite.find((c: any) => {
      const contractNo = String(c?.contractNumber || '').trim();
      const poNumbers = Array.isArray(c?.purchaseOrderNumbers) ? c.purchaseOrderNumbers.map((x: any) => String(x || '').trim()) : [];
      return refs.some((ref) => ref === contractNo || poNumbers.includes(ref));
    });
    if (!matchedContract) return '';
    const inquiryNo = String(matchedContract?.inquiryNumber || '').trim();
    return inquiryNo.startsWith('RFQ-') || inquiryNo.startsWith('INQ-') ? inquiryNo : '';
  };

  const resolveInquirySourceRef = (po: PurchaseOrderType): string => {
    const requirementNo = getRequirementNoFromPO(po);
    const matchedRequirement = findRequirementForPO(po);
    const xjFromRequirement = requirementNo ? getXJNumberByRequirementNo(requirementNo) : '';
    const poRfqRef = String((po as any).xjNumber || '').trim();
    const poSourceRef = String(po.sourceRef || '').trim();
    const xjFromPO = poRfqRef.startsWith('RFQ-') || poRfqRef.startsWith('INQ-')
      ? poRfqRef
      : (poSourceRef.startsWith('RFQ-') || poSourceRef.startsWith('INQ-') ? poSourceRef : '');
    const legacyFromRequirement = String(matchedRequirement?.sourceRef || '').trim();
    const sourceInquiryNumber = String(matchedRequirement?.sourceInquiryNumber || '').trim();
    const inquiryFromContract = getInquiryByContractRef(po);
    // 规则：来源统一显示 INQ 客户询价编号；不显示 CG/SC/XJ
    if (sourceInquiryNumber.startsWith('RFQ-') || sourceInquiryNumber.startsWith('INQ-')) return sourceInquiryNumber;
    if (xjFromRequirement) return xjFromRequirement;
    if (inquiryFromContract) return inquiryFromContract;
    if (xjFromPO) return xjFromPO;
    if (legacyFromRequirement.startsWith('RFQ-') || legacyFromRequirement.startsWith('INQ-')) return legacyFromRequirement;
    return '';
  };

  const getPOTraceRefs = React.useCallback((po: PurchaseOrderType): Set<string> => {
    const refs = new Set<string>();
    const addRef = (v: unknown) => {
      const s = String(v || '').trim().toUpperCase();
      if (s) refs.add(s);
    };
    addRef(resolveInquirySourceRef(po));
    addRef((po as any).xjNumber);
    addRef(po.sourceRef);
    addRef(getRequirementNoFromPO(po));
    addRef((po as any).requirementNumber);
    addRef((po as any).sourceInquiryNumber);
    return refs;
  }, [resolveInquirySourceRef]);

  const getPOQuoteCandidates = React.useCallback(
    (po: PurchaseOrderType, supplierCode?: string) => {
      const refs = getPOTraceRefs(po);
      const preferredSupplier = String(supplierCode || po.supplierCode || '').trim().toUpperCase();
      const statusWeight = (status: string) => {
        const s = String(status || '').trim().toLowerCase();
        if (s === 'accepted' || s === 'approved') return 0;
        if (s === 'submitted' || s === 'quoted') return 1;
        return 2;
      };
      const candidates = supplierQuotations.filter((q: any) => {
        const qSupplier = String(q?.supplierCode || '').trim().toUpperCase();
        if (preferredSupplier && preferredSupplier !== 'TBD' && qSupplier && qSupplier !== preferredSupplier) {
          return false;
        }
        const qRefs = [
          q?.sourceQR,
          q?.xjNumber,
          q?.xjNo,
          q?.sourceXJ,
          q?.requirementNo,
          q?.sourceRFQId,
          q?.quoteData?.sourceQR,
          q?.quoteData?.xjNo,
          q?.quoteData?.xjNumber,
        ]
          .map((v) => String(v || '').trim().toUpperCase())
          .filter(Boolean);
        return qRefs.some((r) => refs.has(r));
      });
      return candidates.sort((a: any, b: any) => {
        const w = statusWeight(a?.status) - statusWeight(b?.status);
        if (w !== 0) return w;
        const da = Date.parse(String(a?.submittedDate || a?.quotationDate || a?.quotedDate || 0));
        const db = Date.parse(String(b?.submittedDate || b?.quotationDate || b?.quotedDate || 0));
        return db - da;
      });
    },
    [getPOTraceRefs, supplierQuotations]
  );

  const resolveQuotedItemPricing = React.useCallback(
    (po: PurchaseOrderType, item: PurchaseOrderItem, supplierCode?: string) => {
      const itemId = String(item?.id || '').trim();
      const itemModel = String(item?.modelNo || '').trim().toLowerCase();
      const itemName = String(item?.productName || '').trim().toLowerCase();
      const quotes = getPOQuoteCandidates(po, supplierCode);
      for (const quotation of quotes) {
        const qItems = getQuotationItems(quotation);
        const matched = qItems.find((qi: any) => {
          const qiId = String(qi?.id || qi?.productId || '').trim();
          const qiModel = String(qi?.modelNo || '').trim().toLowerCase();
          const qiName = String(qi?.productName || qi?.description || '').trim().toLowerCase();
          const sameId = itemId !== '' && qiId !== '' && qiId === itemId;
          const sameModel = itemModel !== '' && qiModel !== '' && qiModel === itemModel;
          const sameName = itemName !== '' && qiName !== '' && qiName === itemName;
          return sameId || sameModel || sameName;
        });
        if (!matched) continue;
        const unitPrice = toNumericAmount(
          matched?.unitPrice ?? matched?.quotePrice ?? matched?.quotedPrice ?? matched?.costPrice ?? 0
        );
        const currency = normalizeCurrencyCode(
          matched?.currency ?? matched?.targetCurrency ?? matched?.quoteCurrency ?? quotation?.currency
        );
        if (unitPrice > 0 || currency) {
          return { unitPrice, currency };
        }
      }
      return null;
    },
    [getPOQuoteCandidates]
  );

  const buildPOWithTracedQuoteCurrency = React.useCallback(
    (po: PurchaseOrderType) => {
      const tracedItems = (po.items || []).map((item) => {
        const traced = resolveQuotedItemPricing(po, item);
        const unitPrice = traced && traced.unitPrice > 0 ? traced.unitPrice : toNumericAmount(item.unitPrice);
        const currency = normalizeCurrencyCode(traced?.currency || item.currency || po.currency || '');
        return {
          ...item,
          unitPrice,
          currency: currency || 'USD',
          subtotal: toNumericAmount(item.quantity) * unitPrice,
        };
      });
      const currencies = Array.from(
        new Set(tracedItems.map((it) => normalizeCurrencyCode(it.currency)).filter(Boolean))
      );
      const poCurrency =
        currencies.length > 0
          ? currencies[0]
          : normalizeCurrencyCode(po.currency || tracedItems[0]?.currency || 'USD');
      const totalAmount = tracedItems.reduce(
        (sum, item) => sum + toNumericAmount(item.subtotal || toNumericAmount(item.quantity) * toNumericAmount(item.unitPrice)),
        0
      );
      return {
        items: tracedItems,
        currency: poCurrency || 'USD',
        totalAmount,
      };
    },
    [resolveQuotedItemPricing]
  );

  // 自动反查回填：为缺失来源的采购单回填 INQ（持久化到 purchase order）
  useEffect(() => {
    if (!purchaseOrders.length) return;
    purchaseOrders.forEach((po) => {
      const existing = String((po as any).xjNumber || '').trim();
      if (existing.startsWith('RFQ-') || existing.startsWith('INQ-')) return;
      const inferred = resolveInquirySourceRef(po);
      if (!inferred) return;
      if (inferred === existing) return;
      updatePurchaseOrder(po.id, { xjNumber: inferred });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, salesContractsLite, xjs, purchaseRequirements]);

  // 审批联动：老板审批采购请求后，自动更新采购单可下推状态
  useEffect(() => {
    if (!purchaseOrders.length || !approvalRequests.length) return;
    purchaseOrders.forEach((po) => {
      const reqStatus = String((po as any).procurementRequestStatus || '');
      if (reqStatus !== 'pending_boss_approval') return;
      const poNo = String(po.poNumber || '').trim();
      const parentNo = String((po as any).parentRequestPoNumber || '').trim();
      const requestIds = [
        poNo ? `PRQ-${poNo}` : '',
        !poNo && parentNo ? `PRQ-${parentNo}` : ''
      ].filter(Boolean);
      const matched = approvalRequests.find((r) => requestIds.includes(String(r.relatedDocumentId || '')));
      if (!matched) return;
      if (matched.status === 'approved') {
        updatePurchaseOrder(po.id, {
          status: 'confirmed',
          ...( { procurementRequestStatus: 'approved_boss' } as any ),
        } as any);
      } else if (matched.status === 'rejected') {
        updatePurchaseOrder(po.id, {
          ...( { procurementRequestStatus: 'rejected_boss' } as any ),
        } as any);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, approvalRequests]);

  // 🔥 工具函数已移至 purchase-order/purchaseOrderUtils.ts

  // 🔥 处理采购单号点击 - 打开文档预览
  const handleViewPODocument = (po: PurchaseOrderType) => {
    const tracedPatch = buildPOWithTracedQuoteCurrency(po);
    const poForDoc = {
      ...po,
      ...tracedPatch,
    };
    const hasCurrencyDelta =
      String(po.currency || '').toUpperCase() !== String(tracedPatch.currency || '').toUpperCase();
    const hasAmountDelta = Math.abs(Number(po.totalAmount || 0) - Number(tracedPatch.totalAmount || 0)) > 0.0001;
    const hasItemDelta = (po.items || []).some((item, idx) => {
      const next = tracedPatch.items[idx];
      return !next ||
        Number(item.unitPrice || 0) !== Number(next.unitPrice || 0) ||
        String(item.currency || '').toUpperCase() !== String(next.currency || '').toUpperCase();
    });
    if (hasCurrencyDelta || hasAmountDelta || hasItemDelta) {
      updatePurchaseOrder(po.id, {
        items: tracedPatch.items as any,
        currency: tracedPatch.currency,
        totalAmount: tracedPatch.totalAmount,
        updatedDate: new Date().toISOString(),
      } as any);
    }
    const poData = convertToPOData(poForDoc);
    setCurrentPOData(poData);
    setShowPOPreview(true);
  };

  // 🔥 处理采购需求单号点击 - 打开文档预览
  const handleViewPRDocument = (req: PurchaseRequirement) => {
    const prData = convertToPRData(req, user?.role);
    // 使用文档预览
    setViewRequirement(req);
    setShowRequirementDialog(true);
  };

  const handleApplyBossApproval = (po: PurchaseOrderType) => {
    const navigateToBossApproval = () => {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: {
          page: 'order-management-center',
          subTab: 'approvals',
        },
      }));
    };

    const reqStatus = String((po as any).procurementRequestStatus || '');
    if (reqStatus === 'pending_boss_approval') {
      toast.info('该采购单已提交审核');
      navigateToBossApproval();
      return;
    }
    if (reqStatus === 'approved_boss') {
      toast.info('该采购单已审核通过');
      navigateToBossApproval();
      return;
    }
    const isRejectedAndResubmit = reqStatus === 'rejected_boss';
    if (reqStatus === 'pushed_supplier') {
      toast.info('该采购单已发送供应商');
      return;
    }

    const currentPoNo = String(po.poNumber || '').trim();
    const parentPoNo = String((po as any).parentRequestPoNumber || '').trim();
    const mainPoNo = parentPoNo.startsWith('CG-') ? parentPoNo : currentPoNo;
    const groupPOs = purchaseOrders.filter((p) => {
      const pNo = String(p.poNumber || '').trim();
      const parentNo = String((p as any).parentRequestPoNumber || '').trim();
      return pNo === mainPoNo || parentNo === mainPoNo;
    });
    const managerByRegion: Record<string, string> = {
      NA: 'ceo@cosun.com',
      SA: 'ceo@cosun.com',
      EA: 'ceo@cosun.com',
    };
    const currentApproverEmail = managerByRegion[po.region || 'NA'] || 'ceo@cosun.com';
    const requestId = `PRQ-${mainPoNo || currentPoNo}`;
    const existingRequest = approvalRequests.find((r) => String(r.relatedDocumentId || '') === requestId);
    let bridgeRequest: any = null;
    if (existingRequest && (existingRequest.status === 'pending' || existingRequest.status === 'forwarded')) {
      toast.info('该采购单已提交审核');
      navigateToBossApproval();
      return;
    }

    if (existingRequest && isRejectedAndResubmit) {
      updateApprovalRequest(existingRequest.id, {
        status: 'pending',
        submittedAt: new Date().toISOString(),
        submittedBy: user?.email || existingRequest.submittedBy,
        submittedByName: user?.name || user?.email || existingRequest.submittedByName,
        submittedByRole: user?.role || existingRequest.submittedByRole,
        currentApprover: currentApproverEmail,
        currentApproverRole: 'CEO',
        nextApprover: null,
        nextApproverRole: null,
        expiresIn: 24,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as any);
    } else if (!existingRequest) {
      const linkedRequirement = findRequirementForPO(po);
      bridgeRequest = addApprovalRequest({
        type: 'contract',
        relatedDocumentId: requestId,
        relatedDocumentType: '采购请求审批',
        relatedDocument: {
          poNumber: mainPoNo || currentPoNo,
          sourceInquiryNumber: resolveInquirySourceRef(po),
          requirementNo: getRequirementNoFromPO(po),
          purchaseOrders: groupPOs.map((p) => p.poNumber),
        },
        submittedBy: user?.email || '',
        submittedByName: user?.name || user?.email || '',
        submittedByRole: user?.role || 'Purchaser',
        submittedAt: new Date().toISOString(),
        region: po.region || 'NA',
        currentApprover: currentApproverEmail,
        currentApproverRole: 'CEO',
        status: 'pending',
        urgency: Number(po.totalAmount || 0) >= 50000 ? 'high' : 'normal',
        amount: Number(po.totalAmount || 0),
        currency: po.currency || 'USD',
        customerName: linkedRequirement?.customer?.companyName || '',
        customerEmail: linkedRequirement?.customer?.email || '',
        productSummary: `${groupPOs.length}张采购单草稿，待老板审核`,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expiresIn: 24
      } as any);

      try {
        const rawBridge = localStorage.getItem(APPROVAL_CENTER_BRIDGE_KEY);
        const bridgeItems = rawBridge ? JSON.parse(rawBridge) : [];
        const next = Array.isArray(bridgeItems) ? bridgeItems : [];
        next.unshift({
          currentApprover: currentApproverEmail,
          request: bridgeRequest,
        });
        localStorage.setItem(APPROVAL_CENTER_BRIDGE_KEY, JSON.stringify(next.slice(0, 200)));
      } catch {}
    }
    groupPOs.forEach((p) => {
      updatePurchaseOrder(p.id, { procurementRequestStatus: 'pending_boss_approval' } as any);
    });
    toast.success(`已提交审核（${groupPOs.length}张采购单）`);
    navigateToBossApproval();
  };

  const handlePushPurchaseToSupplier = (po: PurchaseOrderType) => {
    const reqStatus = String((po as any).procurementRequestStatus || '');
    const isUnassigned = !po.supplierCode || po.supplierCode === 'TBD' || String(po.supplierName || '').includes('待');
    if (reqStatus === 'pending_procurement_assignment' || isUnassigned) {
      openSupplierAllocationDialog(po);
      return;
    }
    if (!reqStatus || reqStatus === 'draft_allocated') {
      toast.error('请先点击“申请审核”，审核通过后才能下推采购');
      return;
    }
    if (reqStatus === 'pending_boss_approval') {
      toast.error('该采购请求待老板审核，通过后才能下推采购');
      return;
    }
    if (reqStatus === 'rejected_boss') {
      toast.error('该采购请求已被老板驳回，请业务员重新发起请求采购');
      return;
    }
    if (reqStatus === 'approved_boss') {
      const currentPoNo = String(po.poNumber || '').trim();
      const parentPoNo = String((po as any).parentRequestPoNumber || '').trim();
      const mainPoNo = parentPoNo.startsWith('CG-') ? parentPoNo : currentPoNo;
      const targetPOs = purchaseOrders.filter((p) => {
        const pNo = String(p.poNumber || '').trim();
        const parentNo = String((p as any).parentRequestPoNumber || '').trim();
        return pNo === mainPoNo || parentNo === mainPoNo;
      });
      targetPOs.forEach((p) => {
        updatePurchaseOrder(p.id, {
          procurementRequestStatus: 'pushed_supplier',
          status: 'confirmed',
          updatedDate: new Date().toISOString(),
        } as any);
      });
      toast.success(`已向供应商发送 ${targetPOs.length || 1} 张采购单`);
      return;
    }
    if (reqStatus === 'pushed_supplier') {
      toast.info('该采购单已完成下推采购');
      return;
    }
    toast.error('当前状态不可下推，请先完成分配和审批');
  };

  const handleOpenEditPO = (po: PurchaseOrderType) => {
    const normalizedSourceRef = normalizeRegionalDocNo(
      String(
        po.sourceRef ||
        (po as any).salesContractNumber ||
        (po as any).sourceSONumber ||
        ''
      )
    );
    const normalizedPOCurrency = normalizeCurrencyCode((po as any).currency);
    const legacyAutoUsd =
      normalizedPOCurrency === 'USD' &&
      (po.items || []).every((item) => {
        const c = normalizeCurrencyCode(item?.currency || '');
        const unitPrice = Number(item?.unitPrice || 0);
        return (!c || c === 'USD') && unitPrice <= 0;
      });
    const effectivePOCurrency = legacyAutoUsd ? 'CNY' : (normalizedPOCurrency || 'CNY');
    setEditingPO(po);
    setEditPOForm({
      poNumber: String(po.poNumber || ''),
      requirementNo: String(po.requirementNo || ''),
      xjNumber: String((po as any).xjNumber || ''),
      sourceRef: normalizedSourceRef,
      supplierName: String(po.supplierName || ''),
      supplierCode: String(po.supplierCode || ''),
      supplierContact: String((po as any).supplierContact || ''),
      supplierPhone: String((po as any).supplierPhone || ''),
      supplierAddress: String((po as any).supplierAddress || ''),
      currency: effectivePOCurrency,
      paymentTerms: String((po as any).paymentTerms || ''),
      deliveryTerms: String((po as any).deliveryTerms || ''),
      deliveryAddress: String((po as any).deliveryAddress || ''),
      qualityStandard: String((po as any).qualityStandard || (po as any).qualityTerms || ''),
      inspectionMethod: String((po as any).inspectionMethod || (po as any).inspectionTerms || ''),
      packaging: String((po as any).packaging || (po as any).packagingTerms || ''),
      shippingMarks: String((po as any).shippingMarks || ''),
      deliveryPenalty: String((po as any).deliveryPenalty || ''),
      qualityPenalty: String((po as any).qualityPenalty || (po as any).penaltyTerms || ''),
      warrantyPeriod: String((po as any).warrantyPeriod || ''),
      returnPolicy: String((po as any).returnPolicy || ''),
      confidentiality: String((po as any).confidentiality || ''),
      ipRights: String((po as any).ipRights || ''),
      forceMajeure: String((po as any).forceMajeure || ''),
      disputeResolution: String((po as any).disputeResolution || (po as any).disputeResolutionTerms || ''),
      applicableLaw: String((po as any).applicableLaw || ''),
      contractValidity: String((po as any).contractValidity || ''),
      modification: String((po as any).modification || ''),
      termination: String((po as any).termination || ''),
      incoterm: String((po as any).incoterm || ''),
      portOfLoading: String((po as any).portOfLoading || ''),
      portOfDestination: String((po as any).portOfDestination || ''),
      qualityTerms: String((po as any).qualityTerms || ''),
      inspectionTerms: String((po as any).inspectionTerms || ''),
      packagingTerms: String((po as any).packagingTerms || ''),
      warrantyTerms: String((po as any).warrantyTerms || ''),
      penaltyTerms: String((po as any).penaltyTerms || ''),
      disputeResolutionTerms: String((po as any).disputeResolutionTerms || ''),
      taxTerms: String((po as any).taxTerms || ''),
      bankTerms: String((po as any).bankTerms || ''),
      orderDate: String((po as any).orderDate || ''),
      expectedDate: String((po as any).expectedDate || ''),
      actualDate: String((po as any).actualDate || ''),
      status: String((po as any).status || 'pending'),
      paymentStatus: String((po as any).paymentStatus || 'unpaid'),
      remarks: String((po as any).remarks || ''),
    });
    setEditPOOrderDate(parseDateLike((po as any).orderDate));
    setEditPOExpectedDate(parseDateLike((po as any).expectedDate));
    setEditPOActualDate(parseDateLike((po as any).actualDate));
    setEditPOItems(
      (po.items || []).map((item) => ({
        ...item,
        currency: (() => {
          const itemCurrency = normalizeCurrencyCode(item?.currency || '');
          if (legacyAutoUsd && (!itemCurrency || itemCurrency === 'USD')) return 'CNY';
          return itemCurrency || effectivePOCurrency || 'CNY';
        })(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        subtotal: Number(item.subtotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
      }))
    );
    setShowEditPODialog(true);
  };

  const handleEditPOItemChange = (idx: number, field: keyof PurchaseOrderItem, value: string) => {
    setEditPOItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const next: PurchaseOrderItem = { ...it };
        if (field === 'quantity' || field === 'unitPrice') {
          (next as any)[field] = Number(value || 0);
          next.subtotal = Number(next.quantity || 0) * Number(next.unitPrice || 0);
        } else if (field === 'subtotal') {
          next.subtotal = Number(value || 0);
        } else {
          (next as any)[field] = value;
        }
        return next;
      })
    );
  };

  const resolveSupplierByKeyword = (keywordRaw: string) => {
    const keyword = String(keywordRaw || '').trim().toLowerCase();
    if (!keyword) return null;

    const exact = allSuppliers.find((s) => {
      const name = String(s.name || '').trim().toLowerCase();
      const code = String(s.code || s.id || '').trim().toLowerCase();
      return name === keyword || code === keyword;
    });
    if (exact) return exact;

    return allSuppliers.find((s) => {
      const name = String(s.name || '').trim().toLowerCase();
      const code = String(s.code || s.id || '').trim().toLowerCase();
      return name.includes(keyword) || code.includes(keyword);
    }) || null;
  };

  const handleEditSupplierNameChange = (value: string) => {
    const nextName = String(value || '');
    const matched = resolveSupplierByKeyword(nextName);
    if (matched) {
      setEditPOForm((prev) => ({
        ...prev,
        supplierName: matched.name || nextName,
        supplierCode: String(matched.code || matched.id || prev.supplierCode || ''),
        supplierContact: String(matched.contact || ''),
        supplierPhone: String(matched.phone || ''),
        supplierAddress: String(matched.address || ''),
      }));
      return;
    }
    setEditPOForm((prev) => ({
      ...prev,
      supplierName: nextName,
      supplierContact: '',
      supplierPhone: '',
      supplierAddress: '',
    }));
  };

  const handleEditSupplierCodeChange = (value: string) => {
    const nextCode = String(value || '');
    const matched = resolveSupplierByKeyword(nextCode);
    if (matched) {
      setEditPOForm((prev) => ({
        ...prev,
        supplierCode: String(matched.code || matched.id || nextCode || ''),
        supplierName: matched.name || prev.supplierName,
        supplierContact: String(matched.contact || ''),
        supplierPhone: String(matched.phone || ''),
        supplierAddress: String(matched.address || ''),
      }));
      return;
    }
    setEditPOForm((prev) => ({
      ...prev,
      supplierCode: nextCode,
      supplierContact: '',
      supplierPhone: '',
      supplierAddress: '',
    }));
  };

  const handleSaveEditPO = () => {
    if (!editingPO) return;
    const totalAmount = editPOItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const normalizedSourceRef = normalizeRegionalDocNo(editPOForm.sourceRef);
    updatePurchaseOrder(editingPO.id, {
      poNumber: String(editPOForm.poNumber || '').trim(),
      requirementNo: String(editPOForm.requirementNo || '').trim(),
      xjNumber: String(editPOForm.xjNumber || '').trim(),
      sourceRef: normalizedSourceRef,
      sourceSONumber: normalizedSourceRef,
      salesContractNumber: normalizedSourceRef,
      supplierName: String(editPOForm.supplierName || '').trim(),
      supplierCode: String(editPOForm.supplierCode || '').trim(),
      supplierContact: String(editPOForm.supplierContact || '').trim(),
      supplierPhone: String(editPOForm.supplierPhone || '').trim(),
      supplierAddress: String(editPOForm.supplierAddress || '').trim(),
      currency: normalizeCurrencyCode(editPOForm.currency) || 'CNY',
      paymentTerms: String(editPOForm.paymentTerms || '').trim(),
      deliveryTerms: String(editPOForm.deliveryTerms || '').trim(),
      deliveryAddress: String(editPOForm.deliveryAddress || '').trim(),
      qualityStandard: String(editPOForm.qualityStandard || '').trim(),
      inspectionMethod: String(editPOForm.inspectionMethod || '').trim(),
      packaging: String(editPOForm.packaging || '').trim(),
      shippingMarks: String(editPOForm.shippingMarks || '').trim(),
      deliveryPenalty: String(editPOForm.deliveryPenalty || '').trim(),
      qualityPenalty: String(editPOForm.qualityPenalty || '').trim(),
      warrantyPeriod: String(editPOForm.warrantyPeriod || '').trim(),
      returnPolicy: String(editPOForm.returnPolicy || '').trim(),
      confidentiality: String(editPOForm.confidentiality || '').trim(),
      ipRights: String(editPOForm.ipRights || '').trim(),
      forceMajeure: String(editPOForm.forceMajeure || '').trim(),
      disputeResolution: String(editPOForm.disputeResolution || '').trim(),
      applicableLaw: String(editPOForm.applicableLaw || '').trim(),
      contractValidity: String(editPOForm.contractValidity || '').trim(),
      modification: String(editPOForm.modification || '').trim(),
      termination: String(editPOForm.termination || '').trim(),
      incoterm: String(editPOForm.incoterm || '').trim(),
      portOfLoading: String(editPOForm.portOfLoading || '').trim(),
      portOfDestination: String(editPOForm.portOfDestination || '').trim(),
      qualityTerms: String(editPOForm.qualityStandard || editPOForm.qualityTerms || '').trim(),
      inspectionTerms: String(editPOForm.inspectionMethod || editPOForm.inspectionTerms || '').trim(),
      packagingTerms: String(editPOForm.packaging || editPOForm.packagingTerms || '').trim(),
      warrantyTerms: String(editPOForm.warrantyTerms || '').trim(),
      penaltyTerms: String(editPOForm.qualityPenalty || editPOForm.penaltyTerms || '').trim(),
      disputeResolutionTerms: String(editPOForm.disputeResolution || editPOForm.disputeResolutionTerms || '').trim(),
      taxTerms: String(editPOForm.taxTerms || '').trim(),
      bankTerms: String(editPOForm.bankTerms || '').trim(),
      orderDate: formatDateForStorage(editPOOrderDate) || String(editPOForm.orderDate || '').trim(),
      expectedDate: formatDateForStorage(editPOExpectedDate) || String(editPOForm.expectedDate || '').trim(),
      actualDate: formatDateForStorage(editPOActualDate) || String(editPOForm.actualDate || '').trim() || undefined,
      status: String(editPOForm.status || 'pending') as any,
      paymentStatus: String(editPOForm.paymentStatus || 'unpaid') as any,
      remarks: String(editPOForm.remarks || '').trim(),      
      items: editPOItems,
      totalAmount,
      updatedDate: new Date().toISOString(),
    } as any);
    toast.success(`采购订单 ${editingPO.poNumber} 已更新`);
    setShowEditPODialog(false);
    setEditingPO(null);
  };

  // 🔥 处理创建XJ - 从采购需求创建，向多个供应商发送采购询价
  const handleCreateRFQFromRequirement = (req: PurchaseRequirement) => {
    setSelectedRequirementForRFQ(req);
    setSelectedSuppliers([]);
    setRFQDeadline(undefined);
    setRFQRemarks('');
    setSupplierSearchTerm(''); // 🔥 重置供应商搜索
    // 默认全选所有产品（items.id 由 toPRRow 写入时确保为 UUID）
    setSelectedProductIds(req.items?.map((item: any) => String(item.id)) || []);
    setShowCreateRFQDialog(true);
  };

  // 🔥 预览询价单 - 单个供应商
  const handlePreviewXJ = (supplier: Supplier) => {
    if (!selectedRequirementForXJ || !xjDeadline) {
      toast.error('请填写完整的询价信息');
      return;
    }
    
    if (selectedProductIds.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }
    
    const xjData = generateXJDocumentData(supplier, selectedRequirementForXJ, xjDeadline, xjRemarks, selectedProductIds);
    setCurrentRFQData(xjData);
    setShowRFQPreview(true);
  };

  const toDateText = (value?: string) => {
    if (!value) return new Date().toISOString().split('T')[0];
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  };

  const buildXJPreviewData = (xj: XJ): XJData => {
    const raw = xj.documentData && typeof xj.documentData === 'object' && !Array.isArray(xj.documentData)
      ? (xj.documentData as any)
      : {};
    const rawBuyer = raw.buyer && typeof raw.buyer === 'object' ? raw.buyer : {};
    const rawSupplier = raw.supplier && typeof raw.supplier === 'object' ? raw.supplier : {};
    const rawTerms = raw.terms && typeof raw.terms === 'object' ? raw.terms : {};
    const sourceProducts = Array.isArray(raw.products)
      ? raw.products
      : Array.isArray(xj.products)
        ? xj.products
        : [];
    const dateFallback = toDateText(xj.quotationDeadline || xj.createdDate);

    return {
      xjNo: String(raw.xjNo || xj.supplierXjNo || xj.xjNumber || ''),
      xjDate: toDateText(raw.xjDate || xj.createdDate),
      requiredResponseDate: toDateText(raw.requiredResponseDate || raw.quoteDeadline || raw.deadline || xj.quotationDeadline || dateFallback),
      requiredDeliveryDate: toDateText(raw.requiredDeliveryDate || xj.quotationDeadline || dateFallback),
      inquiryDescription: String(raw.inquiryDescription || ''),
      buyer: {
        name: String(rawBuyer.name || rawBuyer.companyName || '福建高盛达富建材有限公司'),
        nameEn: String(rawBuyer.nameEn || rawBuyer.companyNameEn || 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.'),
        address: String(rawBuyer.address || '福建省福州市仓山区金山街道浦上大道216号'),
        addressEn: String(rawBuyer.addressEn || 'No.216 Pushang Avenue, Jinshan Street, Cangshan District, Fuzhou, Fujian, China'),
        contactPerson: String(rawBuyer.contactPerson || '采购部'),
        tel: String(rawBuyer.tel || '+86-591-8888-8888'),
        email: String(rawBuyer.email || 'purchase@cosun.com'),
      },
      supplier: {
        companyName: String(rawSupplier.companyName || xj.supplierName || ''),
        supplierCode: String(rawSupplier.supplierCode || xj.supplierCode || ''),
        contactPerson: String(rawSupplier.contactPerson || ''),
        tel: String(rawSupplier.tel || ''),
        email: String(rawSupplier.email || xj.supplierEmail || ''),
        address: String(rawSupplier.address || ''),
      },
      products: sourceProducts.map((p: any, i: number) => ({
        no: i + 1,
        description: String(p?.description || p?.productName || p?.name || ''),
        specification: String(p?.specification || '-'),
        quantity: Number(p?.quantity || 0),
        unit: String(p?.unit || '件'),
        modelNo: p?.modelNo ? String(p.modelNo) : undefined,
        imageUrl: p?.imageUrl ? String(p.imageUrl) : undefined,
        targetPrice: p?.targetPrice ? String(p.targetPrice) : undefined,
      })),
      terms: {
        paymentTerms: String(rawTerms.paymentTerms || 'T/T 30% 预付，70% 发货前付清'),
        deliveryTerms: String(rawTerms.deliveryTerms || 'EXW 工厂交货'),
        currency: String(rawTerms.currency || 'USD'),
        deliveryAddress: rawTerms.deliveryAddress ? String(rawTerms.deliveryAddress) : undefined,
        qualityStandard: rawTerms.qualityStandard ? String(rawTerms.qualityStandard) : undefined,
        inspectionMethod: rawTerms.inspectionMethod ? String(rawTerms.inspectionMethod) : undefined,
      },
    };
  };

  const openXJPreview = (xj: XJ) => {
    setCurrentRFQData(buildXJPreviewData(xj));
    setShowRFQPreview(true);
  };

  // 🔥 导出询价单为PDF
  const handleExportRFQPDF = async (download: boolean = true) => {
    if (!currentXJData || !xjDocRef.current) return;
    
    const filename = generatePDFFilename('采购询价单', currentXJData.xjNo);
    
    if (download) {
      await exportToPDF(xjDocRef.current, filename);
      toast.success('询价单已下载');
    } else {
      await exportToPDFPrint(xjDocRef.current, filename);
    }
  };

  // 🔥 提交XJ - 向多个供应商发送询价
  const handleSubmitXJ = async () => {
    if (!selectedRequirementForXJ) return;
    
    if (selectedSuppliers.length === 0) {
      toast.error('请至少选择一个供应商');
      return;
    }
    
    if (!xjDeadline) {
      toast.error('请设置报价截止日期');
      return;
    }
    
    if (selectedProductIds.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }

    try {
      setSubmittingRFQ(true);
      // allow UI to paint loading state before heavy work / network
      await new Promise<void>(resolve => setTimeout(resolve, 0));

      const createdBy = user?.name || user?.email || '采购员';

      const requirementItems = selectedRequirementForXJ.items || [];
      if (requirementItems.length === 0) {
        toast.error('创建失败：采购需求没有产品明细(items)');
        return;
      }

      // 🔥 为每个供应商创建一份完整的询价单（包含所有选中产品），并落库到后端
      const createdXJs: XJ[] = [];
      await Promise.all(selectedSuppliers.map(async (supplier) => {
        // 🔥 生成供应商专属询价单号（XJ，调用 Supabase RPC）
        const supplierXjNo = await nextXJNumber();

        // 🔥 生成完整的询价单文档数据
        const xjDocumentData = generateXJDocumentData(
          supplier,
          selectedRequirementForXJ,
          xjDeadline,
          xjRemarks,
          selectedProductIds,
          supplierXjNo
        );

        const selectedProducts = requirementItems.filter((item: any) =>
          selectedProductIds.includes(String(item.id))
        );

        if (selectedProducts.length === 0) {
          throw new Error('选中的产品为空：请检查产品ID类型/字段是否一致');
        }

        // 🔥 将产品转换为XJ产品格式
        const xjProducts: XJProduct[] = selectedProducts.map(item => ({
          id: String(item.id),
          productName: item.productName,
          modelNo: item.modelNo,
          specification: item.specification || '',
          quantity: item.quantity,
          unit: item.unit,
          targetPrice: item.targetPrice,
          currency: item.targetCurrency || 'USD'
        }));

        // 🔥 使用第一个产品作为主产品（兼容旧字段）
        const mainProduct = selectedProducts[0];

        const xj: XJ = {
          id: crypto.randomUUID(),                          // 合法 UUID，toXJRow 无需再生成
          xjNumber: supplierXjNo,                          // XJ-xxx（RPC 生成的询价单号，唯一约束键）
          supplierXjNo,                                    // 同上，冗余保留兼容旧字段
          requirementNo: selectedRequirementForXJ.requirementNo, // QR-xxx（关联采购需求）
          sourceQRNumber: selectedRequirementForXJ.requirementNo, // 溯源链：QR → XJ
          sourceRef: selectedRequirementForXJ.sourceRef,
          customerName: (selectedRequirementForXJ as any).customerName,
          customerRegion: selectedRequirementForXJ.region,

          // 🔥 多产品数组（新字段）
          products: xjProducts,

          // 🔥 主产品信息（兼容旧字段）
          productName: mainProduct.productName,
          modelNo: mainProduct.modelNo,
          specification: mainProduct.specification || '',
          quantity: mainProduct.quantity,
          unit: mainProduct.unit,
          targetPrice: mainProduct.targetPrice,
          currency: mainProduct.targetCurrency || 'CNY',

          supplierCode: supplier.code,
          supplierName: supplier.name,
          supplierContact: (supplier as any).contactPerson || (supplier as any).contact || '',
          supplierEmail: supplier.email,

          expectedDate: selectedRequirementForXJ.requiredDate,
          quotationDeadline: xjDeadline ? xjDeadline.toISOString().split('T')[0] : '',

          status: 'pending' as any, // ✅ 直接提交给供应商（供应商端 /mine 可见，后端会过滤 draft）

          remarks: xjRemarks,
          createdBy,
          createdDate: new Date().toISOString().split('T')[0],

          // 🔥 保存完整的询价单文档数据（供供应商Portal显示）
          documentData: xjDocumentData as any
        };

        const savedXJ = await xjService.upsert(xj).catch(() => null);
        const saved = savedXJ || xj;
        createdXJs.push(saved);
        addXJ(saved);
      }));

      // 更新产品的询价历史
      const updatedItems = requirementItems.map((item: any) => {
      if (selectedProductIds.includes(String(item.id))) {
        const xjHistory = (item as any).xjHistory || [];
        const newHistoryEntry = {
          batchNo: xjHistory.length + 1,
          sentDate: new Date().toISOString().split('T')[0],
          supplierCount: selectedSuppliers.length,
          suppliers: selectedSuppliers.map(s => ({
            code: s.code,
            name: s.name,
            level: s.level
          })),
          deadline: xjDeadline ? xjDeadline.toISOString().split('T')[0] : '',
          remarks: xjRemarks
        };
        
        return {
          ...item,
          xjHistory: [...xjHistory, newHistoryEntry]
        };
      }
      return item;
      });
    
    // QR status 基于选中产品数量判断（Supabase-first：写回 DB）
    const totalItems = requirementItems.length;
    const sentCount = selectedProductIds.length;
    let newStatus: 'pending' | 'partial' | 'processing' | 'completed' = 'pending';
    if (sentCount >= totalItems) {
      newStatus = 'processing'; // 全部产品已发询价
    } else if (sentCount > 0) {
      newStatus = 'partial';    // 部分产品已发询价
    }

    // 写回 Supabase（updateRequirement 内部调用 purchaseRequirementService.upsert）
    updateRequirement(selectedRequirementForXJ.id, {
      status: newStatus,
      items: updatedItems
    });
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 询价单创建成功</p>
          <p className="text-sm">已为 {selectedSuppliers.length} 个供应商创建并提交询价单</p>
        <p className="text-xs text-slate-600">需求编号: {selectedRequirementForXJ.requirementNo}</p>
        <p className="text-xs text-slate-600">产品数量: {selectedProductIds.length} 个</p>
          <p className="text-xs text-blue-600 mt-1">👉 供应商可在 Portal【客户需求池】中看到该询价</p>
      </div>,
      { duration: 6000 }
    );
    
    // 🔥 自动跳转到询价管理Tab
    setTimeout(() => {
      setActiveTab('xj-management');
    }, 1000);
    
    setShowCreateRFQDialog(false);
    setSelectedSuppliers([]);
    } catch (error: any) {
      console.error('❌ 创建询价单失败:', error);
      toast.error(`创建询价单失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmittingRFQ(false);
    }
  };

  // 🔥 批量删除询价单
  const handleBatchDeleteRFQs = () => {
    if (selectedXJIds.length === 0) {
      toast.error('请先选择要删除的询价单');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedXJIds.length} 个询价单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      const targetXJs = xjs.filter((x) => selectedXJIds.includes(x.id));
      const lockedXJs = targetXJs.filter((x) => hasDownstreamQuotationForXJ(x));
      const deletableXJs = targetXJs.filter((x) => !hasDownstreamQuotationForXJ(x));

      if (lockedXJs.length > 0) {
        toast.error(`有 ${lockedXJs.length} 条询价已生成下游报价(BJ)，不可删除`);
      }

      deletableXJs.forEach((x) => {
        deleteXJ(x.id);
      });

      if (deletableXJs.length > 0) {
        const remainingXJs = xjs.filter((x) => !deletableXJs.some((d) => d.id === x.id));
        recomputeRequirementStatusByXJ(deletableXJs.map((x) => String(x.requirementNo || '')), remainingXJs);
        toast.success(`已删除 ${deletableXJs.length} 个询价单`, { duration: 3000 });
      }

      setSelectedRFQIds([]);
    }
  };

  // 🔥 批量删除采购需求
  const handleBatchDeleteRequirements = () => {
    if (selectedRequirementIds.length === 0) {
      toast.error('请先选择要删除的采购需求');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedRequirementIds.length} 个采购需求吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      const targets = requirements.filter((r) => selectedRequirementIds.includes(r.id));
      const locked = targets.filter((r) => hasDownstreamXJForRequirement(r));
      const deletable = targets.filter((r) => !hasDownstreamXJForRequirement(r));

      if (locked.length > 0) {
        toast.error(`有 ${locked.length} 条采购需求已生成下游询价(XJ)，不可删除`);
      }

      deletable.forEach((r) => deleteRequirement(r.id));

      if (deletable.length > 0) {
        toast.success(`已删除 ${deletable.length} 个采购需求`, { duration: 3000 });
      }

      setSelectedRequirementIds([]);
    }
  };

  // 🔥 批量删除供应商报价
  const handleBatchDeleteQuotations = async () => {
    if (selectedQuotationIds.length === 0) {
      toast.error('请先选择要删除的供应商报价');
      return;
    }
    const confirmMessage = `确定要永久删除选中的 ${selectedQuotationIds.length} 个供应商报价吗？\n\n⚠️ 删除后不可恢复`;
    if (!window.confirm(confirmMessage)) return;

    const ids = [...selectedQuotationIds];
    const deletedQuotationRows = supplierQuotations.filter((q: any) => ids.includes(String(q.id)));
    const results = await Promise.allSettled(
      ids.map((id) => supplierQuotationService.delete(String(id)))
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = ids.length - successCount;
    const failedIds = ids.filter((_, idx) => results[idx].status === 'rejected');

    if (successCount > 0) {
      toast.success(`已永久删除 ${successCount} 条供应商报价`, { duration: 3000 });
      addTombstones('quotation', ids, {
        reason: 'manual-delete-admin-supplier-quotation',
        deletedBy: user?.email || 'admin',
      });

      // 下游(BJ)删除后：上游(XJ)立即恢复为可编辑/可下推（状态从 quoted 回滚到 sent）
      const successIds = ids.filter((_, idx) => results[idx].status === 'fulfilled');
      const successRows = deletedQuotationRows.filter((q: any) => successIds.includes(String(q.id)));
      const remainingQuotationList = supplierQuotations.filter((q: any) => !successIds.includes(String(q.id)));
      await Promise.all(successRows.map(async (q: any) => {
        const key = getQuotationXJKey(q);
        if (!key) return;
        const xj = xjs.find((r) => getXJKey(r) === key);
        if (!xj) return;
        const stillHasDownstream = remainingQuotationList.some((rq: any) => getQuotationXJKey(rq) === key);
        if (!stillHasDownstream) {
          const filteredQuotes = (xj.quotes || []).filter((qt: any) => String(qt?.quotationNo || '').trim() !== String(q?.quotationNo || '').trim());
          await updateXJ(xj.id, {
            status: 'sent' as any,
            supplierQuotationNo: '',
            quotes: filteredQuotes,
          });
        }
      }));
    }

    if (failedCount > 0) {
      toast.error(`删除失败 ${failedCount} 条，请重试`, { duration: 4000 });
      console.warn('⚠️ [BatchDeleteSupplierQuotation] failed ids:', failedIds);
    }

    await loadSupplierQuotationsFromApi();
    setSelectedQuotationIds([]);
  };

  // 🔥 批量删除采购订单
  const handleBatchDeleteOrders = () => {
    if (selectedOrderIds.length === 0) {
      toast.error('请先选择要删除的采购订单');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedOrderIds.length} 个采购订单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      selectedOrderIds.forEach(id => {
        deletePurchaseOrder(id);
      });
      
      toast.success(`已删除 ${selectedOrderIds.length} 个采购订单`, {
        duration: 3000
      });
      
      setSelectedOrderIds([]);
    }
  };

  // 🔥 批量删除采购请求
  const handleBatchDeleteProcurementRequests = () => {
    if (selectedProcurementRequestIds.length === 0) {
      toast.error('请先选择要删除的采购请求');
      return;
    }

    const confirmMessage = `确定要删除选中的 ${selectedProcurementRequestIds.length} 个采购请求吗？\n\n⚠️ 此操作不可恢复！`;
    if (!window.confirm(confirmMessage)) return;

    const rows = purchaseOrders.filter((po) => selectedProcurementRequestIds.includes(po.id));
    const deletable = rows.filter((po) => !hasDownstreamPOForProcurementRequest(po));
    const blocked = rows.filter((po) => hasDownstreamPOForProcurementRequest(po));

    deletable.forEach((po) => {
      deletePurchaseOrder(po.id);
    });
    if (deletable.length > 0) {
      toast.success(`已删除 ${deletable.length} 个采购请求`, {
        duration: 3000,
      });
    }
    if (blocked.length > 0) {
      toast.error(`有 ${blocked.length} 个采购请求已存在下游采购单(PO)，已禁止删除`, {
        duration: 4000,
      });
    }
    setSelectedProcurementRequestIds([]);
  };

  const handleDeleteProcurementRequest = (po: PurchaseOrderType) => {
    if (hasDownstreamPOForProcurementRequest(po)) {
      toast.error('该采购请求已存在下游采购单(PO)，禁止删除上游记录');
      return;
    }
    if (!window.confirm(`确定要删除采购请求 "${po.poNumber}" 吗？\n\n⚠️ 此操作不可恢复！`)) return;
    deletePurchaseOrder(po.id);
    toast.success('采购请求已删除');
  };

  // 🔥 编辑询价单
  const handleEditXJ = (xj: XJ) => {
    setEditingXJ(xj);
    // 深拷贝documentData，确保编辑不影响原数据，并与列表XJ单号强制对齐
    const cloned = JSON.parse(JSON.stringify(xj.documentData || {}));
    cloned.xjNo = xj.supplierXjNo || cloned.xjNo || '';
    setEditRFQData(cloned);
    setShowEditXJDialog(true);
  };

  // 🔥 保存编辑的询价单
  const handleSaveEditXJ = () => {
    if (!editingXJ || !editXJData) return;
    const normalizedRfqNo = String(editingXJ.supplierXjNo || editXJData?.xjNo || '').trim();
    const normalizedDocumentData = {
      ...editXJData,
      xjNo: normalizedRfqNo || editXJData?.xjNo || '',
    };
    
    // 更新XJ，包括完整的documentData
    updateXJ(editingXJ.id, {
      documentData: normalizedDocumentData,
      supplierXjNo: normalizedRfqNo || editingXJ.supplierXjNo,
      // 同步更新关键字段
      quotationDeadline: normalizedDocumentData.requiredResponseDate,
      expectedDate: normalizedDocumentData.requiredDeliveryDate,
      products: normalizedDocumentData.products?.map((p: any) => ({
        id: p.no?.toString() || String(Math.random()),
        productName: p.description,
        modelNo: p.modelNo || '',
        specification: p.specification || '',
        quantity: p.quantity,
        unit: p.unit,
        targetPrice: p.targetPrice ? parseFloat(p.targetPrice) : undefined,
        currency: normalizedDocumentData.terms?.currency || 'CNY'
      }))
    });
    
    toast.success('询价单已更新', {
      duration: 3000
    });
    
    setShowEditXJDialog(false);
    setEditingXJ(null);
    setEditRFQData(null);
  };

  // 🔥 提交询价单给供应商 - Supabase-first: 状态改为 pending，供应商通过 XJContext getByEmail 可见
  const handleSubmitXJToSupplier = async (xj: XJ) => {
    if (hasDownstreamQuotationForXJ(xj) || xj.status === 'completed') {
      toast.error(
        <div className="space-y-1">
          <p className="font-semibold">⚠️ 已生成下游报价单</p>
          <p className="text-sm">该询价单已存在下游(BJ)，不可重复下推</p>
        </div>
      );
      return;
    }

    try {
      // Supabase-first: 将状态改为 pending，供应商端通过 supplier_xjs 表查询可见
      await xjService.upsert({ ...xj, status: 'pending', sentDate: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      toast.error('下推失败：' + (err?.message || '请稍后重试'));
      return;
    }

    // 更新 XJ Context 中的本地状态
    updateXJ(xj.id, {
      status: 'sent' as any,
      sentDate: new Date().toISOString().split('T')[0]
    });


    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 已下推供应商</p>
        <p className="text-sm">询价单号: {xj.supplierXjNo}</p>
        <p className="text-sm">供应商: {xj.supplierName}</p>
        <p className="text-xs text-slate-600 mt-1">✓ 供应商将在Portal【客户需求池】中收到询价通知</p>
      </div>,
      { duration: 5000 }
    );
  };

  const getPOProductAllocationKey = (item: PurchaseOrderItem, index: number) => {
    return String(item?.id || item?.modelNo || `${index}`);
  };

  const getProductMatchToken = (item: PurchaseOrderItem, index: number) => {
    const key = getPOProductAllocationKey(item, index);
    const name = String(item?.productName || '').trim().toLowerCase();
    const model = String(item?.modelNo || '').trim().toLowerCase();
    return `${key}|${name}|${model}`;
  };

  const allocatedProductTokensInDialog = useMemo(() => {
    if (!allocationPO) return new Set<string>();
    const parentNo = String(allocationPO.poNumber || '').trim();
    if (!parentNo) return new Set<string>();

    const children = purchaseOrders.filter((po) => {
      const parent = String((po as any).parentRequestPoNumber || '').trim();
      const poNo = String(po.poNumber || '').trim().toUpperCase();
      return parent === parentNo && !poNo.startsWith('CQ-');
    });

    const tokenSet = new Set<string>();
    (allocationPO.items || []).forEach((item, idx) => {
      const token = getProductMatchToken(item, idx);
      const matched = children.some((child) =>
        (child.items || []).some((ci) => {
          const sameId = String(ci?.id || '').trim() !== '' && String(ci?.id || '').trim() === String(item?.id || '').trim();
          const sameModel =
            String(ci?.modelNo || '').trim().toLowerCase() !== '' &&
            String(ci?.modelNo || '').trim().toLowerCase() === String(item?.modelNo || '').trim().toLowerCase();
          const sameName =
            String(ci?.productName || '').trim().toLowerCase() !== '' &&
            String(ci?.productName || '').trim().toLowerCase() === String(item?.productName || '').trim().toLowerCase();
          return sameId || sameModel || sameName;
        })
      );
      if (matched) tokenSet.add(token);
    });

    return tokenSet;
  }, [allocationPO, purchaseOrders]);

  const openSupplierAllocationDialog = (po: PurchaseOrderType) => {
    setAllocationSelectedSupplierCodes([]);
    setAllocationSelectedProductKeys([]);
    setAllocationSupplierSearchTerm('');
    setAllocationPO(po);
    setShowAllocationDialog(true);
  };

  const filteredAllocationSuppliers = useMemo(() => {
    const keyword = allocationSupplierSearchTerm.trim().toLowerCase();
    return allSuppliers.filter((s) => {
      if (!(s.status === 'active' && s.code && s.name)) return false;
      if (!keyword) return true;
      const haystack = [s.name, s.code, s.email, s.category].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [allSuppliers, allocationSupplierSearchTerm]);

  const toggleAllocationSupplier = (supplierCode: string, checked: boolean) => {
    setAllocationSelectedSupplierCodes((prev) => {
      if (checked) {
        if (prev.includes(supplierCode)) return prev;
        return [...prev, supplierCode];
      }
      return prev.filter((code) => code !== supplierCode);
    });
  };

  const toggleAllocationProduct = (productKey: string, checked: boolean) => {
    setAllocationSelectedProductKeys((prev) => {
      if (checked) {
        if (prev.includes(productKey)) return prev;
        return [...prev, productKey];
      }
      return prev.filter((key) => key !== productKey);
    });
  };

  const toggleAllAllocationProducts = (checked: boolean) => {
    if (!allocationPO) return;
    if (checked) {
      const keys: string[] = [];
      (allocationPO.items || []).forEach((item, idx) => {
        if (!allocatedProductTokensInDialog.has(getProductMatchToken(item, idx))) {
          keys.push(getPOProductAllocationKey(item, idx));
        }
      });
      setAllocationSelectedProductKeys(keys);
      return;
    }
    setAllocationSelectedProductKeys([]);
  };

  const submitSupplierAllocation = async () => {
    const po = allocationPO;
    if (!po) return;
    if (allocationSelectedSupplierCodes.length === 0) {
      toast.error('请先选择供应商');
      return;
    }

    const selectedItems = (po.items || []).filter((item, idx) =>
      allocationSelectedProductKeys.includes(getPOProductAllocationKey(item, idx))
    );
    const remainingItems = (po.items || []).filter((item, idx) =>
      !allocationSelectedProductKeys.includes(getPOProductAllocationKey(item, idx))
    );

    if (selectedItems.length === 0) {
      toast.error('请先选择至少一个产品');
      return;
    }

    setSubmittingAllocation(true);
    try {
      const createdPONumbers: string[] = [];
      const distribution = allocationSelectedSupplierCodes.map((supplierCode) => {
        const supplierItems = selectedItems.map((item) => ({
          ...item,
          id: `${item.id}-${supplierCode}-${Math.random().toString(36).slice(2, 6)}`,
          quantity: Number(item.quantity || 0),
          subtotal: Number(item.quantity || 0) * Number(item.unitPrice || 0),
        }));
        return [supplierCode, supplierItems] as const;
      });

      for (const [supplierCode, supplierItems] of distribution) {
        const supplier = allSuppliers.find((s) => s.code === supplierCode);
        if (!supplier) {
          throw new Error(`供应商不存在: ${supplierCode}`);
        }
        const tracedItems = supplierItems.map((item) => {
          const traced = resolveQuotedItemPricing(po, item, supplierCode);
          const unitPrice = traced && traced.unitPrice > 0 ? traced.unitPrice : Number(item.unitPrice || 0);
          const currency = normalizeCurrencyCode(traced?.currency || item.currency || po.currency || 'USD');
          return {
            ...item,
            unitPrice,
            currency: currency || 'USD',
            subtotal: Number(item.quantity || 0) * unitPrice,
          };
        });
        const totalAmount = tracedItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
        const currencyCandidates = Array.from(
          new Set(tracedItems.map((it) => normalizeCurrencyCode(it.currency)).filter(Boolean))
        );
        const draftCurrency = currencyCandidates[0] || normalizeCurrencyCode(po.currency || 'USD') || 'USD';
        const newPoNumber = await nextCGNumberAsync();
        addPurchaseOrder({
          ...po,
          id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          poNumber: newPoNumber,
          supplierName: supplier.name || '待选择供应商',
          supplierCode: supplier.code || 'TBD',
          supplierContact: supplier.contact || '',
          supplierPhone: supplier.phone || '',
          supplierAddress: supplier.address || '',
          items: tracedItems,
          totalAmount,
          currency: draftCurrency,
          createdDate: new Date().toISOString(),
          updatedDate: new Date().toISOString(),
          procurementRequestStatus: 'draft_allocated',
          parentRequestPoNumber: po.poNumber as any,
        } as any);
        createdPONumbers.push(newPoNumber);
      }

      // 参照“创建询价单”逻辑：
      // 仅下推选中产品，未选中产品继续保留在采购请求池（待后续分配）
      if (remainingItems.length > 0) {
        const tracedRemainingItems = remainingItems.map((item) => {
          const traced = resolveQuotedItemPricing(po, item);
          const unitPrice = traced && traced.unitPrice > 0 ? traced.unitPrice : Number(item.unitPrice || 0);
          const currency = normalizeCurrencyCode(traced?.currency || item.currency || po.currency || 'USD');
          return {
            ...item,
            unitPrice,
            currency: currency || 'USD',
            subtotal: Number(item.quantity || 0) * unitPrice,
          };
        });
        const remainingCurrencies = Array.from(
          new Set(tracedRemainingItems.map((it) => normalizeCurrencyCode(it.currency)).filter(Boolean))
        );
        const remainingAmount = tracedRemainingItems.reduce(
          (sum, item) => sum + Number(item.subtotal || Number(item.quantity || 0) * Number(item.unitPrice || 0)),
          0
        );
        updatePurchaseOrder(po.id, {
          items: tracedRemainingItems,
          totalAmount: remainingAmount,
          currency: remainingCurrencies[0] || normalizeCurrencyCode(po.currency || 'USD') || 'USD',
          procurementRequestStatus: 'partial_allocated',
          status: 'pending',
          supplierAllocationReady: true as any,
          allocatedSupplierCount: distribution.length as any,
          pendingSupplierPONumbers: createdPONumbers as any,
          updatedDate: new Date().toISOString(),
        } as any);
      } else {
        // 全部分配完成：保留采购请求记录，仅更新状态（不消失）
        updatePurchaseOrder(po.id, {
          procurementRequestStatus: 'allocated_completed',
          supplierAllocationReady: true as any,
          allocatedSupplierCount: distribution.length as any,
          pendingSupplierPONumbers: createdPONumbers as any,
          status: 'confirmed',
          updatedDate: new Date().toISOString(),
        } as any);
      }

      setShowAllocationDialog(false);
      setAllocationPO(null);
      setActiveTab('orders');
      toast.success('已生成采购单草稿', {
        description:
          remainingItems.length > 0
            ? `已生成 ${createdPONumbers.length} 张CG采购单草稿；未分配产品已保留在“采购请求”模块`
            : `已生成 ${createdPONumbers.length} 张CG采购单草稿；采购请求已更新为“已分配完成”`,
      });
    } catch (error: any) {
      toast.error('提交分配失败', {
        description: error?.message || '请重试',
      });
    } finally {
      setSubmittingAllocation(false);
    }
  };

  // 🔥 处理创建订单 - 从采购需求创建
  const handleCreateOrderFromRequirement = (req: PurchaseRequirement) => {
    setSelectedRequirement(req);
    
    // 🔥 初始化产品单价映射 - 每个产品都有独立的单价
    const initialPrices: { [itemId: string]: string } = {};
    req.items?.forEach(item => {
      initialPrices[item.id] = item.targetPrice?.toString() || '';
    });
    setProductPrices(initialPrices);
    
    // 自动填充部分表单数据
    setCreateOrderForm({
      supplierName: '',
      supplierCode: '',
      currency: req.items?.[0]?.targetCurrency || 'USD',
      paymentTerms: '30% 预付，70% 发货前付清',
      deliveryTerms: 'EXW 工厂交货',
      expectedDate: req.requiredDate,
      remarks: req.sourceRef ? `来源: ${req.source} - ${req.sourceRef}` : `来源: ${req.source}`
    });
    setShowCreateOrderDialog(true);
  };

  // 🔥 提交创建订单
  const handleSubmitCreateOrder = async () => {
    if (!selectedRequirement) return;
    
    // 验证必填字段
    if (!createOrderForm.supplierName) {
      toast.error('请填写供应商信息');
      return;
    }

    // 🔥 验证所有产品都有单价
    const items = selectedRequirement.items || [];
    const missingPrices = items.filter(item => {
      const price = productPrices[item.id];
      return !price || isNaN(parseFloat(price)) || parseFloat(price) <= 0;
    });

    if (missingPrices.length > 0) {
      toast.error(`请为所有产品填写有效的采购单价（缺少 ${missingPrices.length} 个）`);
      return;
    }

    const newPONumber = await nextCGNumberAsync();

    // 🔥 生成产品清单并计算总金额
    const products = items.map((item, index) => {
      const unitPrice = parseFloat(productPrices[item.id]);
      const amount = item.quantity * unitPrice;
      
      return {
        no: index + 1,
        modelNo: item.modelNo,
        description: item.productName,
        specification: item.specification || '标准规格',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: unitPrice,
        currency: createOrderForm.currency,
        amount: amount,
        deliveryDate: createOrderForm.expectedDate || selectedRequirement.requiredDate,
        remarks: item.remarks || ''
      };
    });

    // 计算总金额
    const totalAmount = products.reduce((sum, p) => sum + p.amount, 0);

    // 🔥 生成采购订单文档数据 - 使用文档中心模板
    const newPOData: PurchaseOrderData = {
      // 采购单基本信息
      poNo: newPONumber,
      poDate: today.toISOString().split('T')[0],
      requiredDeliveryDate: createOrderForm.expectedDate || selectedRequirement.requiredDate,
      
      // 买方（公司）信息
      buyer: {
        name: '福建高盛达富建材有限公司',
        nameEn: 'FUJIAN GAOSHENGDAFU BUILDING MATERIALS CO., LTD.',
        address: '福建省福州市仓山区金山街道浦上大道216号',
        addressEn: 'No.216 Pushang Avenue, Jinshan Street, Cangshan District, Fuzhou, Fujian, China',
        tel: '+86-591-8888-8888',
        email: 'purchase@gaoshengdafu.com',
        contactPerson: '采购部-刘明'
      },
      
      // 卖方（供应商）信息
      supplier: {
        companyName: createOrderForm.supplierName,
        address: '供应商地址（待完善）',
        contactPerson: '联系人',
        tel: '+86-xxx-xxxx-xxxx',
        email: 'supplier@example.com',
        supplierCode: createOrderForm.supplierCode || `SUP-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        bankInfo: {
          bankName: '中国工商银行',
          accountName: createOrderForm.supplierName,
          accountNumber: '6222 xxxx xxxx xxxx',
          currency: createOrderForm.currency
        }
      },
      
      // 🔥 采购产品清单 - 包含所有产品
      products: products,
      
      // 采购条款
      terms: {
        totalAmount: totalAmount,
        currency: createOrderForm.currency,
        paymentTerms: createOrderForm.paymentTerms,
        deliveryTerms: createOrderForm.deliveryTerms,
        deliveryAddress: '福建省福州市仓山区金山街道浦上大道216号',
        qualityStandard: '符合国家标准及合同约定',
        inspectionMethod: '到货验收',
        packaging: '标准出口包装',
        warrantyPeriod: '12个月',
        warrantyTerms: '质量问题免费更换',
        applicableLaw: '中华人民共和国合同法',
        contractValidity: '订单确认后生效'
      }
    };

    // 🔥 创建采购订单对象并添加到Context
    const newPurchaseOrder: PurchaseOrderType = {
      id: `PO-${Date.now()}`,
      poNumber: newPONumber,
      requirementNo: selectedRequirement.requirementNo, // 🔥 关联采购需求编号
      sourceRef: getXJNumberByRequirementNo(selectedRequirement.requirementNo) || selectedRequirement.sourceInquiryNumber || selectedRequirement.sourceRef,
      
      // 供应商信息
      supplierName: createOrderForm.supplierName,
      supplierCode: createOrderForm.supplierCode || `SUP-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      
      // 🔥 区域信息（继承自采购需求，用于市场区分）
      region: selectedRequirement.region,
      // ❌ 采购员不能看到客户信息 - 权限隔离
      // customerName: selectedRequirement.customerName,
      
      // 🔥 产品清单 - 转换为PurchaseOrderItem格式
      items: items.map((item) => ({
        id: item.id,
        productName: item.productName,
        modelNo: item.modelNo,
        specification: item.specification,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: parseFloat(productPrices[item.id]),
        currency: createOrderForm.currency,
        subtotal: item.quantity * parseFloat(productPrices[item.id]),
        hsCode: item.hsCode,
        packingRequirement: item.packingRequirement,
        remarks: item.remarks
      })),
      
      // 金额信息
      totalAmount: totalAmount,
      currency: createOrderForm.currency,
      
      // 条款信息
      paymentTerms: createOrderForm.paymentTerms,
      deliveryTerms: createOrderForm.deliveryTerms,
      
      // 日期信息
      orderDate: today.toISOString().split('T')[0],
      expectedDate: createOrderForm.expectedDate || selectedRequirement.requiredDate,
      
      // 状态信息
      status: 'pending', // 待确认
      paymentStatus: 'unpaid', // 未付款
      
      // 其他信息
      remarks: createOrderForm.remarks,
      createdBy: '采购部-刘明', // TODO: 从用户Context获取
      createdDate: today.toISOString()
    };

    // 🔥 添加采购订单到Context（持久化保存）
    addPurchaseOrder(newPurchaseOrder);

    // 🔥 更新采购需求状态为已完成
    updateRequirement(selectedRequirement.id, {
      status: 'completed'
    });

    // 🔥 设置文档数据并打开预览
    setCurrentPOData(newPOData);
    
    // 关闭创建对话框
    setShowCreateOrderDialog(false);

    // 显示成功消息
    toast.success(
      <div>
        <p className="font-semibold">✅ 采购订单创建成功！</p>
        <p className="text-xs mt-1">订单号: {newPONumber}</p>
        <p className="text-xs">供应商: {createOrderForm.supplierName}</p>
        <p className="text-xs">产品数: {products.length} 个</p>
        <p className="text-xs">金额: {createOrderForm.currency} {totalAmount.toLocaleString()}</p>
        <p className="text-xs mt-1 text-green-600">✓ 已保存到采购订单模块</p>
        <p className="text-xs text-green-600">✓ 采购需求已标记完成</p>
        <p className="text-xs mt-1 text-blue-600">正在打开文档预览...</p>
      </div>,
      { duration: 5000 }
    );

    // 延迟打开预览，让Toast先显示
    setTimeout(() => {
      setShowPOPreview(true);
    }, 500);

    // 重置表单和选中的需求
    setSelectedRequirement(null);
    setProductPrices({});
    setCreateOrderForm({
      supplierName: '',
      supplierCode: '',
      currency: 'USD',
      paymentTerms: '30% 预付，70% 发货前付清',
      deliveryTerms: 'EXW 工厂交货',
      expectedDate: '',
      remarks: ''
    });
  };

  // 处理创建订单（旧版，保留向后兼容）
  const handleCreateOrder = () => {
    toast.success('请从报价请求池中选择需求创建订单');
  };

  // 🔥 处理智能采购反馈 - 一键流转
  const handleSmartFeedback = (req: PurchaseRequirement) => {
    setFeedbackRequirement(req);
    setShowFeedbackForm(true);
  };

  // 🔥 提交采购反馈
  const handleSubmitFeedback = (feedback: PurchaserFeedback) => {
    if (!feedbackRequirement) return;
    
    console.log('🔥 [采购反馈] 提交反馈，QR信息:', {
      qrId: feedbackRequirement.id,
      qrNumber: feedbackRequirement.requirementNo,
      createdBy: feedbackRequirement.createdBy,
      feedbackData: feedback
    });
    
    // 更新QR，添加采购反馈
    updateRequirement(feedbackRequirement.id, {
      purchaserFeedback: feedback,
      status: 'completed' // 🔥 同时更新状态为已完成
    });
    
    
    toast.success('✅ 采购反馈已提交', {
      description: `业务员 ${feedbackRequirement.createdBy} 将收到成本信息通知`,
      duration: 4000
    });
    
    setShowFeedbackForm(false);
    setFeedbackRequirement(null);
  };

  // 🔥 处理删除采购订单
  const handleDeletePurchaseOrder = (po: PurchaseOrderType) => {
    const firstProductName = po.items?.[0]?.productName || 'N/A';
    if (window.confirm(`确定要删除采购订单 "${po.poNumber}" 吗？\n\n供应商: ${po.supplierName}\n产品: ${firstProductName}\n金额: ${po.currency} ${po.totalAmount.toLocaleString()}\n\n⚠️ 此操作不可恢复！`)) {
      deletePurchaseOrder(po.id);
      toast.success('采购订单已删除', {
        description: `${po.poNumber} - ${po.supplierName}`,
        duration: 3000
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* 🔥 标题栏 - 与供应商管理保持一致 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#F96302]" />
            采购订单管理
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Purchase Order Management - 供应链执行中枢 (Pro版)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            导出报表
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">订单总数</span>
            <ShoppingCart className="w-3 h-3 text-purple-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          <p className="text-[14px] text-gray-500 mt-0.5">Total Orders</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">待审批</span>
            <Clock className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
          <p className="text-[14px] text-gray-500 mt-0.5">Pending Approval</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">执行中</span>
            <Truck className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.producing}</p>
          <p className="text-[14px] text-gray-500 mt-0.5">In Progress</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">已完成</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
          <p className="text-[14px] text-gray-500 mt-0.5">Completed</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">采购总额</span>
            <DollarSign className="w-3 h-3 text-[#F96302]" />
          </div>
          <p className="text-lg font-bold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</p>
          <p className="text-[14px] text-gray-500 mt-0.5">Total Value</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          if (v === 'orders') {
            requestPurchaseOrders();
          }
          if (v === 'procurement-requests') {
            setProcurementRequestSearchTerm('');
          }
        }} className="w-full">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger 
                value="requirements" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-rose-600 data-[state=active]:bg-transparent data-[state=active]:text-rose-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                报价请求池
                {(requirementStats.pending + requirementStats.partial) > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {requirementStats.pending + requirementStats.partial}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger 
                value="xj-management" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-purple-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                <FileText className="w-3 h-3 mr-1" />
                询价管理
              </TabsTrigger>

              <TabsTrigger 
                value="supplier-quotations" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:text-green-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                <FileText className="w-3 h-3 mr-1" />
                供应商报价
                {supplierQuotations.filter(q => q.status === 'submitted').length > 0 && (
                  <span className="absolute -top-1 -right-3 bg-green-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {supplierQuotations.filter(q => q.status === 'submitted').length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="procurement-requests"
                className="bg-transparent border border-transparent data-[state=active]:border-[#F96302] data-[state=active]:bg-[#FFF7ED] data-[state=active]:text-[#F96302] rounded px-2 py-1 text-[14px] font-medium relative"
              >
                <Send className="w-3 h-3 mr-1" />
                采购请求
                {pendingProcurementRequestCount > 0 && (
                  <span className="absolute -top-1 -right-3 bg-sky-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingProcurementRequestCount}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger 
                value="orders" 
                onClick={() => {
                  requestPurchaseOrders();
                }}
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-[#F96302] data-[state=active]:bg-transparent data-[state=active]:text-[#F96302] rounded-none px-0 pb-2 pt-2 text-[14px] font-medium"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                采购订单
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== Tab 1: 采购需求池 ==================== */}
          <TabsContent value="requirements" className="m-0">
            {/* 需求统计 */}
            <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">总需求</p>
                  <p className="text-base font-bold text-gray-900">{requirementStats.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">待处理</p>
                  <p className="text-base font-bold text-amber-600">{requirementStats.pending}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">部分提交</p>
                  <p className="text-base font-bold text-orange-600">{requirementStats.partial}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已发供应商</p>
                  <p className="text-base font-bold text-blue-600">{requirementStats.processing}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">紧急需求</p>
                  <p className="text-base font-bold text-red-600">{requirementStats.highUrgency}</p>
                </div>
              </div>
            </div>

            {/* 需求列表 */}
            <div className="px-3 py-2">
              {/* 🔥 搜索框和批量操作 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      placeholder="搜索需求编号、来源单号、区域..."
                      value={requirementSearchTerm}
                      onChange={(e) => setRequirementSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-80"
                    />
                  </div>
                  {selectedRequirementIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDeleteRequirements}
                      className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      批量删除 ({selectedRequirementIds.length})
                    </Button>
                  )}
                </div>
                <p className="text-[14px] text-gray-600">共 {filteredRequirements.length} 条采购需求</p>
              </div>
              
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-[14px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                          checked={selectedRequirementIds.length === filteredRequirements.length && filteredRequirements.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequirementIds(filteredRequirements.map(r => r.id));
                            } else {
                              setSelectedRequirementIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">需求编号</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">来源单号</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">区域</th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">要求日期</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">紧急程度</th>
                      <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作 ✨NEW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequirements.map((req, idx) => {
                      const urgencyConfig = getUrgencyConfig(req.urgency);
                      const itemCount = req.items?.length || 0;
                      
                      // 🔥 动态计算状态
                      const dynamicStatus = calculateRequirementStatus(req);
                      const hasLinkedXJ = hasDownstreamXJForRequirement(req);
                      
                      // 🔥 区域标签配置
                      // region 统一用 Supabase 存储的 code（NA/SA/EA）
                      const regionCode = req.region?.toUpperCase().replace('NORTH AMERICA','NA').replace('SOUTH AMERICA','SA').replace('EUROPE & AFRICA','EA').replace('EUROPE-AFRICA','EA');
                      const regionConfig = regionCode === 'NA' ? { label: 'NA', color: 'bg-blue-100 text-blue-700' }
                        : regionCode === 'SA' ? { label: 'SA', color: 'bg-green-100 text-green-700' }
                        : regionCode === 'EA' ? { label: 'EA', color: 'bg-purple-100 text-purple-700' }
                        : null;
                      
                      return (
                        <tr key={req.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                              checked={selectedRequirementIds.includes(req.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRequirementIds([...selectedRequirementIds, req.id]);
                                } else {
                                  setSelectedRequirementIds(selectedRequirementIds.filter(id => id !== req.id));
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 px-2 text-center text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => {
                                setViewRequirement(req);
                                setShowRequirementDialog(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                            >
                              {req.requirementNo}
                            </button>
                            <div className="text-[12px] text-gray-500">{req.createdDate}</div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{req.source}</div>
                            {req.sourceRef && <div className="text-[12px] text-blue-600 font-mono">{req.sourceRef}</div>}
                          </td>
                          <td className="py-2 px-2">
                            {regionConfig ? (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] font-medium ${regionConfig.color}`}>
                                {regionConfig.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[12px]">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                              {itemCount}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{req.requiredDate}</div>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${urgencyConfig.color}`}>
                              {urgencyConfig.label}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                              dynamicStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                              dynamicStatus === 'partial' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              dynamicStatus === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              'bg-green-50 text-green-700 border-green-200'
                            }`}>
                              {dynamicStatus === 'pending' ? '待处理' : 
                               dynamicStatus === 'partial' ? '部分提交' : 
                               dynamicStatus === 'processing' ? '全部提交' : '已完成'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex gap-1 justify-center">
                              {/* 🔥 查看按钮 */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setViewRequirement(req);
                                  setShowRequirementDialog(true);
                                }}
                                className="h-6 text-[12px] px-2 border-gray-300 text-gray-600 hover:bg-gray-50 gap-1"
                                title="查看采购需求详情"
                              >
                                <Eye className="w-3 h-3" />
                                <span>查看</span>
                              </Button>
                              
                              {/* 🔥 编辑按钮 */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: 实现编辑功能
                                  toast.info('编辑功能开发中...', {
                                    description: '即将支持编辑采购需求',
                                    duration: 2000
                                  });
                                }}
                                disabled={hasLinkedXJ}
                                className={`h-6 text-[12px] px-2 gap-1 ${
                                  hasLinkedXJ
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                                }`}
                                title="编辑采购需求"
                              >
                                <Edit className="w-3 h-3" />
                                <span>编辑</span>
                              </Button>
                              
                              {!hasLinkedXJ && (dynamicStatus === 'pending' || dynamicStatus === 'partial') && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateRFQFromRequirement(req)}
                                    className="h-6 text-[12px] bg-blue-600 hover:bg-blue-700 px-2"
                                  >
                                    创建询价单
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleCreateOrderFromRequirement(req)}
                                    className="h-6 text-[12px] bg-[#F96302] hover:bg-[#E05502] px-2"
                                  >
                                    直接下单
                                  </Button>
                                </>
                              )}
                              {/* 🔥 智能采购反馈按钮 - 当有XJ询价单时显示 */}
                              {(dynamicStatus === 'processing' || dynamicStatus === 'partial') && !req.purchaserFeedback && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSmartFeedback(req)}
                                  className="h-6 text-[12px] bg-green-600 hover:bg-green-700 px-2 gap-1"
                                  title="智能提取BJ报价，反馈给业务员"
                                >
                                  <Calculator className="w-3 h-3" />
                                  <span>智能反馈</span>
                                </Button>
                              )}
                              {/* 🔥 已反馈标识 */}
                              {req.purchaserFeedback && (
                                <>
                                  <Badge className="h-6 px-2 bg-green-100 text-green-700 border-green-300 text-[12px]">
                                    ✓ 已反馈
                                  </Badge>
                                  {/* 🔥 创建报价按钮 - 只有采购反馈后才显示 */}
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequirementForQuote(req);
                                      setShowQuoteCreation(true);
                                    }}
                                    className="h-6 text-[12px] bg-orange-500 hover:bg-orange-600 px-2 gap-1"
                                    title="创建客户报价单（含智能价格计算）"
                                  >
                                    <Calculator className="w-3 h-3" />
                                    <span>创建报价</span>
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (hasLinkedXJ) {
                                    toast.error('该采购需求已生成下游询价(XJ)，不可删除');
                                    return;
                                  }
                                  if (window.confirm(`确定要删除采购需求 "${req.requirementNo}" 吗？\n\n产品: ${req.productName}\n数量: ${req.quantity} ${req.unit}`)) {
                                    deleteRequirement(req.id);
                                    toast.success('采购需求已删除', {
                                      description: `${req.requirementNo} - ${req.productName}`,
                                      duration: 3000
                                    });
                                  }
                                }}
                                disabled={hasLinkedXJ}
                                className={`h-6 text-[12px] px-2 ${
                                  hasLinkedXJ
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                    : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                                }`}
                                title="删除采购需求"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* ==================== Tab 2: 询价管理 ==================== */}
          <TabsContent value="xj-management" className="m-0">
            {/* 询价统计 */}
            <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">总询价</p>
                  <p className="text-base font-bold text-gray-900">{xjs.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">草稿</p>
                  <p className="text-base font-bold text-gray-600">{xjs.filter(r => (r.status as any) === 'draft').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已发送</p>
                  <p className="text-base font-bold text-blue-600">{xjs.filter(r => (r.status as any) === 'sent').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">等待报价</p>
                  <p className="text-base font-bold text-orange-600">{xjs.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已回复</p>
                  <p className="text-base font-bold text-green-600">{xjs.filter(r => r.status === 'quoted').length}</p>
                </div>
              </div>
            </div>

            {/* 询价列表 */}
            <div className="px-3 py-2">
              {/* 🔥 搜索框和批量操作 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      placeholder="搜索询价单号、供应商、需求编号..."
                      value={xjSearchTerm}
                      onChange={(e) => setRFQSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-80"
                    />
                  </div>
                  {selectedXJIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDeleteRFQs}
                      className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      批量删除 ({selectedXJIds.length})
                    </Button>
                  )}
                </div>
                <p className="text-[14px] text-gray-600">共 {filteredXJs.length} 条询价单</p>
              </div>
              
              {filteredXJs.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无询价单</p>
                  <p className="text-sm text-gray-400 mt-1">从报价请求池创建询价单后将显示在这里</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded overflow-x-auto">
                  <table className="min-w-max w-full text-[14px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                            checked={selectedXJIds.length === filteredXJs.length && filteredXJs.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRFQIds(filteredXJs.map(r => r.id));
                              } else {
                                setSelectedRFQIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">序号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-36">询价单号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-40">供应商</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-32">关联需求</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-16">产品数</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-28">创建日期</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-24">截止日期</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-20">状态</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-40">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredXJs.map((xj, idx) => {
                        const xjStatus = (xj.status as any);
                        const isDraft = xjStatus === 'draft';
                        const isSent = xjStatus === 'sent';
                        const lockedByQuotation = hasDownstreamQuotationForXJ(xj);
                        
                        return (
                          <tr key={xj.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="py-2 px-2 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                                checked={selectedXJIds.includes(xj.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRFQIds([...selectedXJIds, xj.id]);
                                  } else {
                                    setSelectedRFQIds(selectedXJIds.filter(id => id !== xj.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-2 px-2 text-center text-gray-500">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2">
                              <button
                                type="button"
                                onClick={() => openXJPreview(xj)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                              >
                                {xj.supplierXjNo}
                              </button>
                              <div className="text-[12px] text-gray-500">{xj.createdDate}</div>
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <div className="text-gray-900">{xj.supplierName}</div>
                              <div className="text-[12px] text-gray-500">{xj.supplierCode}</div>
                            </td>
                            <td className="py-2 px-2 whitespace-nowrap">
                              <div className="text-gray-900 font-mono">{xj.requirementNo}</div>
                              {xj.sourceRef && <div className="text-[12px] text-gray-500">{xj.sourceRef}</div>}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                {xj.products?.length || 1}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900">{xj.createdDate}</div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900">{xj.quotationDeadline}</div>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                                isDraft ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                isSent ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                xj.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                xj.status === 'quoted' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {isDraft ? '草稿' :
                                 isSent ? '已发送' :
                                 xj.status === 'pending' ? '等待报价' :
                                 xj.status === 'quoted' ? '已回复' :
                                 xj.status}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex gap-1 justify-center">
                                {/* 查看按钮：始终可用 */}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openXJPreview(xj)}
                                  className="h-6 text-[12px] px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  查看
                                </Button>
                                {/* 编辑按钮：存在下游(BJ)后禁用 */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditXJ(xj)}
                                  disabled={lockedByQuotation || xj.status === 'completed'}
                                  className={`h-6 text-[12px] px-2 ${
                                    lockedByQuotation || xj.status === 'completed'
                                      ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  编辑
                                </Button>
                                {/* 下推按钮：存在下游(BJ)后变灰禁用 */}
                                {lockedByQuotation || xj.status === 'completed' ? (
                                  <Button
                                    size="sm"
                                    disabled
                                    className="h-6 text-[12px] px-2 bg-gray-200 text-gray-400 cursor-not-allowed"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    已锁定
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitXJToSupplier(xj)}
                                    className="h-6 text-[12px] px-2 bg-[#F96302] hover:bg-[#E05502]"
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    {isSent ? '重新下推' : '下推供应商'}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ==================== Tab 3: 供应商报价 ==================== */}
          <TabsContent value="supplier-quotations" className="m-0">
            {/* 统计卡片 */}
            <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">总报价</p>
                  <p className="text-base font-bold text-gray-900">{supplierQuotations.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">待审核</p>
                  <p className="text-base font-bold text-blue-600">
                    {supplierQuotations.filter(q => q.status === 'submitted').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已接受</p>
                  <p className="text-base font-bold text-green-600">
                    {supplierQuotations.filter(q => q.status === 'accepted').length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已拒绝</p>
                  <p className="text-base font-bold text-red-600">
                    {supplierQuotations.filter(q => q.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>

            {/* 报价列表 */}
            <div className="px-3 py-2">
              {/* 🔥 搜索框和批量操作 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      placeholder="搜索报价单号、供应商、询价单号..."
                      value={quotationSearchTerm}
                      onChange={(e) => setQuotationSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-80"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadSupplierQuotationsFromApi()}
                    className="h-8 text-xs px-3"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    刷新
                  </Button>
                  {selectedQuotationIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDeleteQuotations}
                      className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      批量删除 ({selectedQuotationIds.length})
                    </Button>
                  )}
                </div>
                <p className="text-[14px] text-gray-600">共 {filteredQuotations.length} 条供应商报价</p>
              </div>
              
              {filteredQuotations.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无供应商报价</p>
                  <p className="text-sm text-gray-400 mt-1">供应商在 Portal 提交报价后，点击「刷新」或切换 Tab 后会自动拉取</p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-[14px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                            checked={selectedQuotationIds.length === filteredQuotations.length && filteredQuotations.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedQuotationIds(filteredQuotations.map(q => q.id));
                              } else {
                                setSelectedQuotationIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">报价单号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">供应商</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">关联询价</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700">报价金额</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">报价日期</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">有效期至</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotations.map((quotation, idx) => (
                        <tr key={quotation.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                              checked={selectedQuotationIds.includes(quotation.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedQuotationIds([...selectedQuotationIds, quotation.id]);
                                } else {
                                  setSelectedQuotationIds(selectedQuotationIds.filter(id => id !== quotation.id));
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 px-2 text-center text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-2">
                            <button
                              onClick={() => {
                                setSelectedSupplierQuotation(quotation);
                                setShowSupplierQuotationDialog(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                            >
                              {quotation.quotationNo}
                            </button>
                            <div className="text-[12px] text-gray-500">{quotation.submittedDate || quotation.quotationDate}</div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{quotation.supplierName}</div>
                            <div className="text-[12px] text-gray-500">{quotation.supplierCompany}</div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{quotation.sourceXJ || '-'}</div>
                            {quotation.sourceQR && <div className="text-[12px] text-blue-600 font-mono">{quotation.sourceQR}</div>}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <div className="font-semibold text-green-600">
                              {quotation.currency === 'CNY' ? '¥' : '$'}{quotation.totalAmount?.toLocaleString() || 0}
                            </div>
                            <div className="text-[12px] text-gray-500">{quotation.currency}</div>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                              {quotation.items?.length || 0}
                            </span>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{quotation.quotationDate}</div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="text-gray-900">{quotation.validUntil}</div>
                          </td>
                          <td className="py-2 px-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                              quotation.status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                              quotation.status === 'accepted' ? 'bg-green-50 text-green-700 border-green-200' : 
                              'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {quotation.status === 'submitted' ? '待审核' 
                                : quotation.status === 'accepted' ? '已接受'
                                : '已拒绝'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSupplierQuotation(quotation);
                                  setShowSupplierQuotationDialog(true);
                                }}
                                className="h-6 text-[12px] px-2"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                查看
                              </Button>
                              
                              {quotation.status === 'submitted' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        await supplierQuotationService.upsert({ id: quotation.id, status: 'accepted' });
                                      } catch (e: any) {
                                        console.warn('⚠️ 接受报价 Supabase 同步失败:', e?.message);
                                        toast.error('接受报价失败：Supabase 写入未成功');
                                        return;
                                      }
                                      applyLocalQuotationStatus(quotation.id, 'accepted');
                                      setAcceptedQuotationNo(quotation.quotationNo || quotation.id);
                                      setShowFeedbackReminderDialog(true);
                                    }}
                                    className="h-6 text-[12px] bg-green-600 hover:bg-green-700 px-2"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    接受
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await supplierQuotationService.upsert({ id: quotation.id, status: 'rejected' });
                                      } catch (e: any) {
                                        console.warn('⚠️ 拒绝报价 Supabase 同步失败:', e?.message);
                                        toast.error('拒绝报价失败：Supabase 写入未成功');
                                        return;
                                      }
                                      applyLocalQuotationStatus(quotation.id, 'rejected');
                                      toast.info(
                                        <div className="space-y-1">
                                          <p className="font-semibold">❌ 已拒绝报价</p>
                                          <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                          <p className="text-xs text-slate-500">状态已更新</p>
                                        </div>
                                      );
                                    }}
                                    className="h-6 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                                  >
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    拒绝
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          <ProcurementRequestsTab
            procurementRequestSearchTerm={procurementRequestSearchTerm}
            setProcurementRequestSearchTerm={setProcurementRequestSearchTerm}
            selectedProcurementRequestIds={selectedProcurementRequestIds}
            setSelectedProcurementRequestIds={setSelectedProcurementRequestIds}
            handleBatchDeleteProcurementRequests={handleBatchDeleteProcurementRequests}
            filteredProcurementRequests={filteredProcurementRequests}
            purchaseOrders={purchaseOrders}
            isProcurementRequestRecord={isProcurementRequestRecord}
            getProcurementRequestRuntimeStatus={getProcurementRequestRuntimeStatus}
            getProcurementRequestStatusText={getProcurementRequestStatusText}
            normalizeCGNumberForDisplay={normalizeCGNumberForDisplay}
            resolveInquirySourceRef={resolveInquirySourceRef}
            getRequirementNoFromPO={getRequirementNoFromPO}
            handleViewPODocument={handleViewPODocument}
            openSupplierAllocationDialog={openSupplierAllocationDialog}
            hasDownstreamPOForProcurementRequest={hasDownstreamPOForProcurementRequest}
            handleDeleteProcurementRequest={handleDeleteProcurementRequest}
          />

          <PurchaseOrdersTab
            orderSearchTerm={orderSearchTerm}
            setOrderSearchTerm={setOrderSearchTerm}
            selectedOrderIds={selectedOrderIds}
            setSelectedOrderIds={setSelectedOrderIds}
            handleBatchDeleteOrders={handleBatchDeleteOrders}
            handleCreateOrder={handleCreateOrder}
            filteredOrders={filteredOrders}
            handleViewPODocument={handleViewPODocument}
            handleOpenEditPO={handleOpenEditPO}
            handlePushPurchaseToSupplier={handlePushPurchaseToSupplier}
            handleApplyBossApproval={handleApplyBossApproval}
            handleDeletePurchaseOrder={handleDeletePurchaseOrder}
            normalizeCGNumberForDisplay={normalizeCGNumberForDisplay}
            resolveInquirySourceRef={resolveInquirySourceRef}
            getRequirementNoFromPO={getRequirementNoFromPO}
          />
        </Tabs>
      </div>

      <SupplierAllocationDialog
        showAllocationDialog={showAllocationDialog}
        setShowAllocationDialog={setShowAllocationDialog}
        allocationPO={allocationPO}
        setAllocationPO={setAllocationPO}
        resolveInquirySourceRef={resolveInquirySourceRef}
        getRequirementNoFromPO={getRequirementNoFromPO}
        allocatedProductTokensInDialog={allocatedProductTokensInDialog}
        getProductMatchToken={getProductMatchToken}
        getPOProductAllocationKey={getPOProductAllocationKey}
        allocationSelectedProductKeys={allocationSelectedProductKeys}
        toggleAllAllocationProducts={toggleAllAllocationProducts}
        toggleAllocationProduct={toggleAllocationProduct}
        allocationSelectedSupplierCodes={allocationSelectedSupplierCodes}
        allocationSupplierSearchTerm={allocationSupplierSearchTerm}
        setAllocationSupplierSearchTerm={setAllocationSupplierSearchTerm}
        filteredAllocationSuppliers={filteredAllocationSuppliers}
        toggleAllocationSupplier={toggleAllocationSupplier}
        submittingAllocation={submittingAllocation}
        submitSupplierAllocation={submitSupplierAllocation}
      />

      <PurchaseOrderDetailDialog
        showOrderDialog={showOrderDialog}
        setShowOrderDialog={setShowOrderDialog}
        viewOrder={viewOrder}
        normalizeCGNumberForDisplay={normalizeCGNumberForDisplay}
        resolveInquirySourceRef={resolveInquirySourceRef}
        handleViewPODocument={handleViewPODocument}
      />

      <PurchaseOrderPreviewDialog
        showPOPreview={showPOPreview}
        setShowPOPreview={setShowPOPreview}
        currentPOData={currentPOData}
        poPDFRef={poPDFRef}
        exportingPDF={exportingPDF}
        setExportingPDF={setExportingPDF}
      />

      {/* 🔥 隐藏的PDF导出专用渲染区域 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {currentPOData && (
          <div ref={hiddenPDFRef}>
            <PurchaseOrderDocument data={currentPOData} />
          </div>
        )}
      </div>

      <PurchaseRequirementPreviewDialog
        showRequirementDialog={showRequirementDialog}
        setShowRequirementDialog={setShowRequirementDialog}
        viewRequirement={viewRequirement}
        userRole={user?.role}
      />

      {/* 🔥 编辑采购订单对话框 */}
      <PurchaseOrderEditDialog
        open={showEditPODialog}
        onOpenChange={setShowEditPODialog}
        editingPONumber={editingPO?.poNumber}
        editPOForm={editPOForm}
        setEditPOForm={setEditPOForm}
        editPOItems={editPOItems}
        onEditPOItemChange={handleEditPOItemChange}
        editPOOrderDate={editPOOrderDate}
        setEditPOOrderDate={setEditPOOrderDate}
        editPOExpectedDate={editPOExpectedDate}
        setEditPOExpectedDate={setEditPOExpectedDate}
        editPOActualDate={editPOActualDate}
        setEditPOActualDate={setEditPOActualDate}
        allSuppliers={allSuppliers}
        onSupplierNameChange={handleEditSupplierNameChange}
        onSupplierCodeChange={handleEditSupplierCodeChange}
        onCancel={() => {
          setShowEditPODialog(false);
          setEditingPO(null);
        }}
        onSave={handleSaveEditPO}
      />

      <PurchaseOrderCreateDialogs
        showCreateOrderDialog={showCreateOrderDialog}
        setShowCreateOrderDialog={setShowCreateOrderDialog}
        selectedRequirement={selectedRequirement}
        createOrderForm={createOrderForm}
        setCreateOrderForm={setCreateOrderForm}
        productPrices={productPrices}
        setProductPrices={setProductPrices}
        handleSubmitCreateOrder={handleSubmitCreateOrder}
        showSupplierDialog={showSupplierDialog}
        setShowSupplierDialog={setShowSupplierDialog}
        supplierSearchTerm={supplierSearchTerm}
        setSupplierSearchTerm={setSupplierSearchTerm}
        allSuppliers={allSuppliers}
      />

      <CreateXJAndHistoryDialogs
        showCreateRFQDialog={showCreateXJDialog}
        setShowCreateRFQDialog={setShowCreateRFQDialog}
        selectedRequirementForRFQ={selectedRequirementForXJ}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
        selectedSuppliers={selectedSuppliers}
        setSelectedSuppliers={setSelectedSuppliers}
        supplierSearchTerm={supplierSearchTerm}
        setSupplierSearchTerm={setSupplierSearchTerm}
        allSuppliers={allSuppliers}
        handlePreviewRFQ={handlePreviewXJ}
        xjDeadline={xjDeadline}
        setXJDeadline={setRFQDeadline}
        xjRemarks={xjRemarks}
        setRFQRemarks={setRFQRemarks}
        handleSubmitXJ={handleSubmitXJ}
        submittingXJ={submittingXJ}
        showRFQHistoryDialog={showXJHistoryDialog}
        setShowRFQHistoryDialog={setShowRFQHistoryDialog}
        selectedProductForHistory={selectedProductForHistory}
        setSelectedProductForHistory={setSelectedProductForHistory}
      />
      
      <XJPreviewDialog
        showXJPreview={showXJPreview}
        setShowRFQPreview={setShowRFQPreview}
        currentXJData={currentXJData}
        xjDocRef={xjDocRef}
        handleExportRFQPDF={handleExportRFQPDF}
      />

      <SupplierQuotationDialog
        showSupplierQuotationDialog={showSupplierQuotationDialog}
        setShowSupplierQuotationDialog={setShowSupplierQuotationDialog}
        selectedSupplierQuotation={selectedSupplierQuotation}
        onAccept={handleAcceptSupplierQuotation}
        onReject={handleRejectSupplierQuotation}
      />

      <EditXJDialog
        showEditXJDialog={showEditXJDialog}
        setShowEditXJDialog={setShowEditXJDialog}
        editXJData={editXJData}
        setEditRFQData={setEditRFQData}
        handleSaveEditXJ={handleSaveEditXJ}
      />

      {/* 🔥 智能采购反馈表单 */}
      {feedbackRequirement && (
        <PurchaserFeedbackForm
          open={showFeedbackForm}
          onOpenChange={setShowFeedbackForm}
          qr={feedbackRequirement}
          onSubmit={handleSubmitFeedback}
          currentUserName={user?.name || '采购员'}
        />
      )}

      {/* 🔥 智能报价创建弹窗 */}
      {showQuoteCreation && selectedRequirementForQuote && (
        <QuoteCreationIntelligent
          requirementNo={selectedRequirementForQuote.requirementNo}
          requirement={selectedRequirementForQuote}
          onClose={() => {
            setShowQuoteCreation(false);
            setSelectedRequirementForQuote(null);
          }}
          onSubmit={(quoteData) => {
            
            // 🔥 转换数据格式：QuoteData → Quotation
            const newQuotation = {
              id: `quotation-${Date.now()}`,
              quotationNumber: quoteData.quoteNo,
              inquiryId: selectedRequirementForQuote.inquiryNo || '',
              inquiryNumber: selectedRequirementForQuote.inquiryNo || '',
              customerName: selectedRequirementForQuote.customer || 'Unknown',
              customer: selectedRequirementForQuote.customer || 'Unknown',
              customerEmail: selectedRequirementForQuote.customerEmail || '',
              quotationDate: quoteData.quoteDate,
              validUntil: new Date(new Date(quoteData.quoteDate).getTime() + quoteData.validityDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              totalAmount: quoteData.totalAmount,
              currency: 'USD' as 'USD' | 'EUR' | 'CNY',
              status: 'draft' as any, // 🔥 草稿状态，待业务员在报价管理中提交审核
              region: selectedRequirementForQuote.region || 'NA',
              products: quoteData.items.map((item: any) => ({
                name: item.productName,
                productName: item.productName,
                sku: item.sku || item.modelNo || '',
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.quotePrice,
                totalPrice: item.totalAmount || (item.quotePrice * item.quantity),
                specs: item.specification || '',
                image: item.imageUrl || ''
              })),
              // 🔥 其他必填字段
              subtotal: quoteData.totalAmount,
              discount: 0,
              tax: 0,
              deliveryTerms: 'FOB Xiamen',
              paymentTerms: '30% T/T deposit, 70% before shipment',
              notes: quoteData.approvalNotes || '',
              // 🔥 审批流程信息（待提交审核时使用）
              approvalNotes: quoteData.approvalNotes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // 🔥 保存到QuotationContext
            addQuotation(newQuotation);
            
            
            toast.success('报价已保存！', {
              description: `报价单号：${quoteData.quoteNo}\n已保存到报价管理，请前往报价管理模块提交审核。`,
              duration: 5000
            });
            
            // 关闭弹窗
            setShowQuoteCreation(false);
            setSelectedRequirementForQuote(null);
          }}
        />
      )}

      {/* 接受报价后的智能反馈引导弹窗 */}
      {showFeedbackReminderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFeedbackReminderDialog(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
            {/* 标题 */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-base">✅ 已接受供应商报价</p>
                <p className="text-sm text-gray-500 mt-0.5">报价单号：{acceptedQuotationNo}</p>
              </div>
            </div>

            {/* 提醒内容 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-amber-800">⚠️ 请记得反馈成本价给业务员</p>
                <p className="text-sm text-amber-700">
                  接受报价后，业务员还不知道采购成本，请前往
                  <span className="font-semibold text-amber-900">「报价请求池」</span>
                  找到对应需求，点击
                  <span className="font-semibold text-amber-900">「智能反馈」</span>
                  按钮，将供应商报价成本一键反馈给业务员，以便其制作销售报价单。
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-end pt-1">
              <Button
                variant="outline"
                className="text-gray-600"
                onClick={() => setShowFeedbackReminderDialog(false)}
              >
                稍后处理
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
                onClick={() => {
                  setShowFeedbackReminderDialog(false);
                  setActiveTab('requirements');
                }}
              >
                <Calculator className="w-4 h-4" />
                立即前往报价请求池
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderManagementEnhanced;
