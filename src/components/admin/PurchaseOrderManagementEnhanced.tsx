import React, { useEffect, useMemo, useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Download, 
  Eye, 
  Clock,
  Package,
  DollarSign,
  Building2,
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
import { suppliersDatabase, searchSuppliers, type Supplier } from '../../data/suppliersData'; // 🔥 导入真实供应商数据
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { EditableSelect } from '../ui/editable-select'; // 🔥 可编辑下拉选择
import { toast } from 'sonner@2.0.3';
import { PurchaseOrderDocument, PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument'; // 🔥 文档中心采购订单模板
import { SupplierRFQDocument, SupplierRFQData } from '../documents/templates/SupplierRFQDocument'; // 🔥 供应商询价单模板
import QuoteCreationIntelligent from './QuoteCreationIntelligent'; // 🔥 智能报价创建页面
import { PurchaseRequirementDocument, PurchaseRequirementDocumentData } from '../documents/templates/PurchaseRequirementDocument'; // 🔥 采购需求单模板
import SupplierQuotationDocumentViewer from '../supplier/SupplierQuotationDocumentViewer'; // 🔥 供应商报价单查看器
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport'; // 🔥 PDF导出工具
import { usePurchaseRequirements, PurchaseRequirement, PurchaserFeedback } from '../../contexts/PurchaseRequirementContext'; // 🔥 采购需求Context
import { usePurchaseOrders, PurchaseOrder as PurchaseOrderType, PurchaseOrderItem } from '../../contexts/PurchaseOrderContext'; // 🔥 采购订单Context
import { useRFQs, RFQ, RFQProduct } from '../../contexts/RFQContext'; // 🔥 RFQ Context
import { useQuotations } from '../../contexts/QuotationContext'; // 🔥 报价Context（用于保存业务员报价）
import { DatePicker } from '../ui/date-picker'; // 🔥 日期选择器
import { PurchaserFeedbackForm } from './PurchaserFeedbackForm'; // 🔥 智能采购反馈表单
import { useUser } from '../../contexts/UserContext'; // 🔥 用户Context
import { migrateRFQQuotesToBJQuotations, checkMigrationStatus } from '../../utils/migrateQuotations'; // 🔥 报价数据迁移工具
import { generateXJNumber } from '../../utils/rfqNumberGenerator'; // 🔥 XJ编号生成器
import { apiFetchJson } from '../../api/backend-auth';
import { TERMS_OPTIONS } from './purchase-order/purchaseOrderConstants'; // 🔥 从常量文件导入
import { 
  getPOStatusConfig, 
  getPaymentStatusConfig, 
  getBusinessTypeLabel, 
  getUrgencyConfig,
  convertToPOData,
  convertToPRData,
  desensitizeFeedback,
  generateRFQDocumentData
} from './purchase-order/purchaseOrderUtils'; // 🔥 从工具函数文件导入

/**
 * 🔥 采购订单管理 - 台湾大厂风格
 * 与供应商管理保持一致的UI设计
 */

// 🔥 采购订单类型已从PurchaseOrderContext导入，不再在此定义
// 🔥 TERMS_OPTIONS已从purchase-order/purchaseOrderConstants.ts导入，不再在此定义

const PurchaseOrderManagementEnhanced: React.FC = () => {
  console.log('🔥🔥🔥 PurchaseOrderManagementEnhanced组件已加载 - 版本2024-12-21 带编辑按钮');
  
  // 🔥 使用采购需求Context - 添加deleteRequirement
  const { requirements, updateRequirement, deleteRequirement } = usePurchaseRequirements();
  // 🔥 使用采购订单Context
  const { purchaseOrders, addPurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  // 🔥 使用RFQ Context - 获取rfqs列表用于计算状态
  const { rfqs, addRFQ, updateRFQ, deleteRFQ } = useRFQs();
  // 🔥 使用报价Context - 用于保存业务员创建的报价单
  const { addQuotation } = useQuotations();
  // 🔥 用户Context - 获取当前用户信息
  const { user } = useUser();
  const requestPurchaseOrders = React.useCallback(() => {
    // 直接请求一次，确保点击“采购订单”Tab时 Network 一定能看到 /api/purchase-orders
    void apiFetchJson<{ purchaseOrders: any[] }>('/api/purchase-orders')
      .then(() => {
        window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
      })
      .catch((e) => {
        console.warn('⚠️ [PurchaseOrderManagement] request /api/purchase-orders failed:', e);
      });
  }, []);
  useEffect(() => {
    // 进入采购订单页时主动请求一次
    requestPurchaseOrders();
  }, [requestPurchaseOrders]);
  const [activeTab, setActiveTab] = useState<'requirements' | 'rfq-management' | 'supplier-quotations' | 'orders'>('orders');
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
  const [createOrderForm, setCreateOrderForm] = useState({
    supplierName: '',
    supplierCode: '',
    currency: 'USD',
    paymentTerms: '30% 预付，70% 发货前付清',
    deliveryTerms: 'EXW 工厂交货',
    expectedDate: '',
    remarks: ''
  });
  
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
  
  // 🔥 创建RFQ对话框状态
  const [showCreateRFQDialog, setShowCreateRFQDialog] = useState(false);
  const [selectedRequirementForRFQ, setSelectedRequirementForRFQ] = useState<PurchaseRequirement | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [rfqDeadline, setRFQDeadline] = useState<Date | undefined>(undefined);
  const [rfqRemarks, setRFQRemarks] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🔥 选中的产品ID（统一用 string）
  const [submittingRFQ, setSubmittingRFQ] = useState(false);
  
  // 🔥 询价历史弹窗状态
  const [showRFQHistoryDialog, setShowRFQHistoryDialog] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);
  
  // 🔥 询价单预览状态
  const [showRFQPreview, setShowRFQPreview] = useState(false);
  const [currentRFQData, setCurrentRFQData] = useState<SupplierRFQData | null>(null);
  const rfqDocRef = React.useRef<HTMLDivElement>(null);
  
  // 🔥 询价单编辑状态
  const [showEditRFQDialog, setShowEditRFQDialog] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState<RFQ | null>(null);
  const [editRFQData, setEditRFQData] = useState<any>(null); // 完整的documentData
  
  // 🔥 询价管理 - 搜索和批量删除状态
  const [rfqSearchTerm, setRFQSearchTerm] = useState('');
  const [selectedRFQIds, setSelectedRFQIds] = useState<string[]>([]);

  // 🔥 采购需求池 - 搜索和批量删除状态
  const [requirementSearchTerm, setRequirementSearchTerm] = useState('');
  const [selectedRequirementIds, setSelectedRequirementIds] = useState<string[]>([]);

  // 🔥 供应商报价 - 搜索和批量删除状态
  const [quotationSearchTerm, setQuotationSearchTerm] = useState('');
  const [selectedQuotationIds, setSelectedQuotationIds] = useState<string[]>([]);

  // 🔥 采购订单 - 搜索和批量删除状态
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // 🔥 智能采购反馈 - 状态管理
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackRequirement, setFeedbackRequirement] = useState<PurchaseRequirement | null>(null);

  // 🔥 采购需求数据 - 从Context获取
  const purchaseRequirements = requirements;

  // ✅ Suppliers: prefer backend DB organizations, fallback to local static list
  const [suppliersFromApi, setSuppliersFromApi] = useState<Supplier[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetchJson<{ suppliers: any[] }>('/api/suppliers');
        const list = (res?.suppliers || []).map((s: any) => ({
          id: String(s.id || s.code || s.company_id || ''),
          name: s.name || '',
          code: String(s.code || s.id || s.company_id || ''),
          nameEn: s.nameEn || '',
          level: (s.level || 'B') as any,
          category: s.category || '供应商',
          region: s.region || '',
          businessTypes: ['trading'],
          contact: s.contact || '',
          phone: s.phone || '',
          email: s.email || '',
          address: s.address || '',
          businessLicense: '',
          certifications: [],
          cooperationYears: 0,
          totalOrders: 0,
          totalAmount: 0,
          onTimeRate: 0,
          qualityRate: 0,
          status: (s.status || 'active') as any,
          capacity: '',
        })) as Supplier[];
        // ✅ IMPORTANT: use backend result as-is; don't fallback to local static DB
        // Some suppliers might have empty email in DB, but we still want to show exactly what API returns.
        setSuppliersFromApi(list.filter(s => (s.code || s.id) && s.name));
      } catch (e) {
        // ignore: fallback to local suppliersDatabase
      }
    };
    void load();
  }, []);

  const allSuppliers: Supplier[] = suppliersFromApi.length > 0 ? suppliersFromApi : suppliersDatabase;
  
  // 🔥 动态计算采购需求的状态
  const calculateRequirementStatus = (req: PurchaseRequirement): 'pending' | 'partial' | 'processing' | 'completed' => {
    // 获取该采购需求相关的所有RFQ（询价单）
    const relatedRFQs = rfqs.filter(rfq => 
      rfq.requirementNo === req.requirementNo || 
      rfq.rfqNumber === req.requirementNo ||
      rfq.sourceQRNumber === req.requirementNo
    );
    
    if (relatedRFQs.length === 0) {
      // 还未创建任何询价单
      return 'pending';
    }
    
    // 统计已经创建了询价单的产品
    const rfqProductIds = new Set<string>();
    relatedRFQs.forEach(rfq => {
      rfq.products?.forEach((p: any) => {
        rfqProductIds.add(p.id || p.modelNo);
      });
    });
    
    // 采购需求的产品总数
    const totalProducts = req.items?.length || 0;
    const submittedProducts = rfqProductIds.size;
    
    if (submittedProducts === 0) {
      return 'pending';
    } else if (submittedProducts < totalProducts) {
      return 'partial';
    } else {
      return 'processing'; // 全部提交
    }
  };
  
  // 🔥 供应商报价数据 - 从localStorage读取
  const [supplierQuotations, setSupplierQuotations] = useState<any[]>([]);
  const [selectedSupplierQuotation, setSelectedSupplierQuotation] = useState<any>(null);
  const [showSupplierQuotationDialog, setShowSupplierQuotationDialog] = useState(false);
  
  // 🔥 加载供应商报价数据：优先从后端接口拉取（采购员可见供应商提交的 BJ）
  const loadSupplierQuotationsFromApi = React.useCallback(async () => {
    try {
      const res = await apiFetchJson<{ quotations: any[] }>('/api/supplier-quotations');
      const list = res?.quotations ?? [];
      setSupplierQuotations(list);
    } catch (e) {
      const stored = localStorage.getItem('supplierQuotations');
      if (stored) {
        const allQuotations = JSON.parse(stored);
        const visibleQuotations = allQuotations.filter((q: any) => q.status !== 'draft');
        setSupplierQuotations(visibleQuotations);
      }
    }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'supplier-quotations') {
      loadSupplierQuotationsFromApi();
      const interval = setInterval(loadSupplierQuotationsFromApi, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab, loadSupplierQuotationsFromApi]);

  // 统计数据
  const stats = useMemo(() => {
    const total = purchaseOrders.length;
    const pending = purchaseOrders.filter(po => po.status === 'pending').length;
    const producing = purchaseOrders.filter(po => po.status === 'producing').length;
    const completed = purchaseOrders.filter(po => po.status === 'completed').length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

    return { total, pending, producing, completed, totalValue };
  }, [purchaseOrders]);

  // 需求统计 - 🔥 使用动态计算的状态
  const requirementStats = useMemo(() => {
    const total = purchaseRequirements.length;
    const pending = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'pending').length;
    const partial = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'partial').length; // 🔥 部分提交
    const processing = purchaseRequirements.filter(r => calculateRequirementStatus(r) === 'processing').length;
    const highUrgency = purchaseRequirements.filter(r => r.urgency === 'high').length;

    return { total, pending, partial, processing, highUrgency };
  }, [purchaseRequirements, rfqs]);

  // 🔥 旧的筛选订单逻辑已删除，使用下面新的 filteredOrders

  // 🔥 筛选供应商 - 根据供应商名称、产品名称、产品类别
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm) return allSuppliers;

    const kw = supplierSearchTerm.trim().toLowerCase();
    return allSuppliers.filter(supplier => {
      const hay = [
        supplier.name,
        supplier.nameEn,
        supplier.category,
        supplier.code,
        supplier.region,
        supplier.contact,
        supplier.email,
        supplier.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(kw);
    });
  }, [supplierSearchTerm, allSuppliers]);
  
  // 🔥 筛选询价单 - 根据询价单号、供应商、关联需求
  const filteredRFQs = useMemo(() => {
    if (!rfqSearchTerm) return rfqs;
    
    const lowerSearchTerm = rfqSearchTerm.toLowerCase();
    return rfqs.filter(rfq => 
      rfq.supplierRfqNo?.toLowerCase().includes(lowerSearchTerm) ||
      rfq.supplierName?.toLowerCase().includes(lowerSearchTerm) ||
      rfq.requirementNo?.toLowerCase().includes(lowerSearchTerm) ||
      rfq.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [rfqs, rfqSearchTerm]);

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
      q.rfqNo?.toLowerCase().includes(lowerSearchTerm) ||
      q.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [supplierQuotations, quotationSearchTerm]);

  // 🔥 筛选采购订单 - 根据订单号、供应商、需求编号
  const filteredOrders = useMemo(() => {
    if (!orderSearchTerm) return purchaseOrders;
    
    const lowerSearchTerm = orderSearchTerm.toLowerCase();
    return purchaseOrders.filter(order => 
      order.orderNumber?.toLowerCase().includes(lowerSearchTerm) ||
      order.supplierName?.toLowerCase().includes(lowerSearchTerm) ||
      order.requirementNo?.toLowerCase().includes(lowerSearchTerm) ||
      order.supplierCode?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [purchaseOrders, orderSearchTerm]);

  // 🔥 工具函数已移至 purchase-order/purchaseOrderUtils.ts

  // 🔥 处理采购单号点击 - 打开文档预览
  const handleViewPODocument = (po: PurchaseOrderType) => {
    const poData = convertToPOData(po);
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

  // 🔥 处理创建RFQ - 从采购需求创建，向多个供应商询价
  const handleCreateRFQFromRequirement = (req: PurchaseRequirement) => {
    setSelectedRequirementForRFQ(req);
    setSelectedSuppliers([]);
    setRFQDeadline(undefined);
    setRFQRemarks('');
    setSupplierSearchTerm(''); // 🔥 重置供应商搜索
    // 🔥 默认全选所有产品（ID统一 string，避免 number/string 不匹配导致无法创建）
    setSelectedProductIds(req.items?.map(item => String(item.id)) || []);
    setShowCreateRFQDialog(true);
  };

  // 🔥 预览询价单 - 单个供应商
  const handlePreviewRFQ = (supplier: Supplier) => {
    if (!selectedRequirementForRFQ || !rfqDeadline) {
      toast.error('请填写完整的询价信息');
      return;
    }
    
    if (selectedProductIds.length === 0) {
      toast.error('请至少选择一个产品');
      return;
    }
    
    const rfqData = generateRFQDocumentData(supplier, selectedRequirementForRFQ, rfqDeadline, rfqRemarks, selectedProductIds);
    setCurrentRFQData(rfqData);
    setShowRFQPreview(true);
  };

  // 🔥 导出询价单为PDF
  const handleExportRFQPDF = async (download: boolean = true) => {
    if (!currentRFQData || !rfqDocRef.current) return;
    
    const filename = generatePDFFilename('供应商询价单', currentRFQData.rfqNo);
    
    if (download) {
      await exportToPDF(rfqDocRef.current, filename);
      toast.success('询价单已下载');
    } else {
      await exportToPDFPrint(rfqDocRef.current, filename);
    }
  };

  // 🔥 提交RFQ - 向多个供应商发送询价
  const handleSubmitRFQ = async () => {
    if (!selectedRequirementForRFQ) return;
    
    if (selectedSuppliers.length === 0) {
      toast.error('请至少选择一个供应商');
      return;
    }
    
    if (!rfqDeadline) {
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

      const currentUser = JSON.parse(localStorage.getItem('cosun_current_user') || '{}');
      const createdBy = currentUser.name || '采购员';

      const requirementItems = selectedRequirementForRFQ.items || [];
      if (requirementItems.length === 0) {
        toast.error('创建失败：采购需求没有产品明细(items)');
        return;
      }

      // 🔥 为每个供应商创建一份完整的询价单（包含所有选中产品），并落库到后端
      const createdRfqs: RFQ[] = [];
      await Promise.all(selectedSuppliers.map(async (supplier) => {
        // 🔥 生成供应商专属询价单号（XJ开头，从0001开始递增）
        const supplierRfqNo = generateXJNumber();

        // 🔥 生成完整的询价单文档数据
        const rfqDocumentData = generateRFQDocumentData(
          supplier,
          selectedRequirementForRFQ,
          rfqDeadline,
          rfqRemarks,
          selectedProductIds
        );

        // 🔥 只包含选中的产品（ID统一 string 匹配）
        const selectedProducts = requirementItems.filter(item =>
          selectedProductIds.includes(String(item.id))
        );

        if (selectedProducts.length === 0) {
          throw new Error('选中的产品为空：请检查产品ID类型/字段是否一致');
        }

        // 🔥 将产品转换为RFQProduct格式
        const rfqProducts: RFQProduct[] = selectedProducts.map(item => ({
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

        const rfq: RFQ = {
          id: `rfq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          rfqNumber: selectedRequirementForRFQ.requirementNo, // 🔥 使用QR采购需求编号（不是RFQ！）
          supplierRfqNo, // 🔥 供应商询价单号 XJ-xxx
          requirementNo: selectedRequirementForRFQ.requirementNo, // 🔥 采购需求编号 QR-xxx
          sourceRef: selectedRequirementForRFQ.sourceRef,
          customerName: (selectedRequirementForRFQ as any).customerName,
          customerRegion: selectedRequirementForRFQ.region, // 🔥 客户来源区域

          // 🔥 多产品数组（新字段）
          products: rfqProducts,

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

          expectedDate: selectedRequirementForRFQ.requiredDate,
          quotationDeadline: rfqDeadline ? rfqDeadline.toISOString().split('T')[0] : '',

          status: 'pending' as any, // ✅ 直接提交给供应商（供应商端 /mine 可见，后端会过滤 draft）

          remarks: rfqRemarks,
          createdBy,
          createdDate: new Date().toISOString().split('T')[0],

          // 🔥 保存完整的询价单文档数据（供供应商Portal显示）
          documentData: rfqDocumentData as any
        };

        // ✅ 后端落库（让你能在 Network 看到请求 + DB 持久化）
        const res = await apiFetchJson<{ rfq: RFQ }>('/api/supplier-rfqs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...rfq,
            expectedDate: rfq.expectedDate,
            quotationDeadline: rfq.quotationDeadline,
            supplierQuotationNo: (rfq as any).supplierQuotationNo ?? null,
          }),
        });

        const saved = (res as any)?.rfq || rfq;
        createdRfqs.push(saved);
        addRFQ(saved);
      }));

      // 🔥 更新产品的询价历史
      const updatedItems = requirementItems.map(item => {
      // 只更新被选中发送询价的产品
      if (selectedProductIds.includes(String(item.id))) {
        const rfqHistory = (item as any).rfqHistory || [];
        const newHistoryEntry = {
          batchNo: rfqHistory.length + 1,
          sentDate: new Date().toISOString().split('T')[0],
          supplierCount: selectedSuppliers.length,
          suppliers: selectedSuppliers.map(s => ({
            code: s.code,
            name: s.name,
            level: s.level
          })),
          deadline: rfqDeadline ? rfqDeadline.toISOString().split('T')[0] : '',
          remarks: rfqRemarks
        };
        
        return {
          ...item,
          rfqHistory: [...rfqHistory, newHistoryEntry]
        };
      }
      return item;
      });
    
    // 🔥 判断询价状态：
    // - 如果所有产品都已发送询价 → 'processing'
    // - 如果只有部分产品发送询价 → 'partial' 
    // - 如果没有产品发送询价 → 'pending'
    const allProductsSent = updatedItems.every(item => (item as any).rfqHistory && (item as any).rfqHistory.length > 0);
    const someProductsSent = updatedItems.some(item => (item as any).rfqHistory && (item as any).rfqHistory.length > 0);
    
    let newStatus: 'pending' | 'partial' | 'processing' | 'completed' = 'pending';
    if (allProductsSent) {
      newStatus = 'processing'; // 所有产品都已询价
    } else if (someProductsSent) {
      newStatus = 'partial'; // 部分产品已询价
    }
    
    // 更新采购需求状态和产品询价历史
    updateRequirement(selectedRequirementForRFQ.id, { 
      status: newStatus,
      items: updatedItems
    });
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 询价单创建成功</p>
          <p className="text-sm">已为 {selectedSuppliers.length} 个供应商创建并提交询价单</p>
        <p className="text-xs text-slate-600">需求编号: {selectedRequirementForRFQ.requirementNo}</p>
        <p className="text-xs text-slate-600">产品数量: {selectedProductIds.length} 个</p>
          <p className="text-xs text-blue-600 mt-1">👉 供应商可在 Portal【客户需求池】中看到该询价</p>
      </div>,
      { duration: 6000 }
    );
    
    // 🔥 自动跳转到询价管理Tab
    setTimeout(() => {
      setActiveTab('rfq-management');
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
    if (selectedRFQIds.length === 0) {
      toast.error('请先选择要删除的询价单');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedRFQIds.length} 个询价单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      selectedRFQIds.forEach(id => {
        deleteRFQ(id);
      });
      
      toast.success(`已删除 ${selectedRFQIds.length} 个询价单`, {
        duration: 3000
      });
      
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
      selectedRequirementIds.forEach(id => {
        deleteRequirement(id);
      });
      
      toast.success(`已删除 ${selectedRequirementIds.length} 个采购需求`, {
        duration: 3000
      });
      
      setSelectedRequirementIds([]);
    }
  };

  // 🔥 批量删除供应商报价
  const handleBatchDeleteQuotations = () => {
    if (selectedQuotationIds.length === 0) {
      toast.error('请先选择要删除的供应商报价');
      return;
    }
    const confirmMessage = `确定要从当前列表移除选中的 ${selectedQuotationIds.length} 个供应商报价吗？\n\n（列表来自后端，刷新后会重新拉取）`;
    if (!window.confirm(confirmMessage)) return;
    setSupplierQuotations(prev => prev.filter((q: any) => !selectedQuotationIds.includes(q.id)));
    setSelectedQuotationIds([]);
    toast.success(`已从当前列表移除 ${selectedQuotationIds.length} 条`, { duration: 3000 });
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

  // 🔥 编辑询价单
  const handleEditRFQ = (rfq: RFQ) => {
    setEditingRFQ(rfq);
    // 深拷贝documentData，确保编辑不影响原数据
    setEditRFQData(JSON.parse(JSON.stringify(rfq.documentData)));
    setShowEditRFQDialog(true);
  };

  // 🔥 保存编辑的询价单
  const handleSaveEditRFQ = () => {
    if (!editingRFQ || !editRFQData) return;
    
    // 更新RFQ，包括完整的documentData
    updateRFQ(editingRFQ.id, {
      documentData: editRFQData,
      // 同步更新关键字段
      quotationDeadline: editRFQData.requiredResponseDate,
      expectedDate: editRFQData.requiredDeliveryDate,
      products: editRFQData.products?.map((p: any) => ({
        id: p.no?.toString() || String(Math.random()),
        productName: p.description,
        modelNo: p.modelNo || '',
        specification: p.specification || '',
        quantity: p.quantity,
        unit: p.unit,
        targetPrice: p.targetPrice ? parseFloat(p.targetPrice) : undefined,
        currency: editRFQData.terms?.currency || 'CNY'
      }))
    });
    
    toast.success('询价单已更新', {
      duration: 3000
    });
    
    setShowEditRFQDialog(false);
    setEditingRFQ(null);
    setEditRFQData(null);
  };

  // 🔥 提交询价单给供应商 - 从草稿状态提交
  const handleSubmitRFQToSupplier = async (rfq: RFQ) => {
    // ✅ If already non-draft, treat as submitted (backend mine will show it).
    if ((rfq as any)?.status && (rfq as any).status !== 'draft') {
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">✅ 询价单已提交</p>
          <p className="text-sm">无需重复提交</p>
        </div>
      );
      return;
    }

    // 🔥 检查是否已经提交过
    const existingSupplierRFQs = JSON.parse(localStorage.getItem('supplierRFQs') || '[]');
    const alreadySubmitted = existingSupplierRFQs.some((item: any) => item.id === rfq.id);
    
    if (alreadySubmitted) {
      toast.error(
        <div className="space-y-1">
          <p className="font-semibold">⚠️ 询价单已提交</p>
          <p className="text-sm">该询价单已经提交给供应商，无需重复提交</p>
        </div>
      );
      return;
    }

    // ✅ 同步到后端：将 RFQ 从 draft 提交为 pending（供应商端可见）
    try {
      await apiFetchJson<{ rfq: any }>(`/api/supplier-rfqs/${encodeURIComponent(rfq.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' }),
      });
    } catch (err: any) {
      console.error('❌ [提交询价单] 后端提交失败:', err);
      toast.error(`提交失败：${err?.message || '未知错误'}`);
      return;
    }
    
    // 🔥 将状态从draft改为sent
    const updatedRFQ = {
      ...rfq,
      status: 'sent' as any, // 🔥 已发送给供应商
      sentDate: new Date().toISOString().split('T')[0]
    };
    
    // 🔥 更新RFQ Context中的状态
    updateRFQ(rfq.id, {
      status: 'sent' as any,
      sentDate: new Date().toISOString().split('T')[0]
    });
    
    // 🔥 将询价单推送到供应商Portal（保存到supplierRFQs）
    const supplierRFQData = {
      id: rfq.id,
      rfqNumber: rfq.supplierRfqNo || '', // XJ-xxx
      supplierRfqNo: rfq.supplierRfqNo,
      supplierCode: rfq.supplierCode,
      supplierName: rfq.supplierName,
      supplierEmail: rfq.supplierEmail,
      
      // 关联COSUN采购需求
      sourceQRNumber: rfq.requirementNo, // QR-xxx
      
      // 产品信息（支持多产品）
      products: rfq.products || [{
        id: `product_${Date.now()}`,
        productName: rfq.productName,
        modelNo: rfq.modelNo,
        specification: rfq.specification || '',
        quantity: rfq.quantity,
        unit: rfq.unit,
        targetPrice: rfq.targetPrice,
        currency: rfq.currency
      }],
      
      // 单产品字段（兼容）
      productName: rfq.productName,
      modelNo: rfq.modelNo,
      specification: rfq.specification || '',
      quantity: rfq.quantity,
      unit: rfq.unit,
      targetPrice: rfq.targetPrice,
      currency: rfq.currency,
      
      expectedDate: rfq.expectedDate,
      quotationDeadline: rfq.quotationDeadline,
      
      status: 'pending', // 供应商端看到的是pending状态
      createdDate: rfq.createdDate,
      sentDate: new Date().toISOString().split('T')[0],
      
      remarks: rfq.remarks,
      
      // 🔥 完整的询价单文档数据
      documentData: rfq.documentData,
      
      // 🔥 买方信息（COSUN采购）
      buyerContact: rfq.documentData?.buyer?.contactPerson || '采购部',
      buyerEmail: rfq.documentData?.buyer?.email || 'purchasing@gosundafu.com'
    };
    
    // 保存到localStorage的supplierRFQs
    const updatedSupplierRFQs = [...existingSupplierRFQs, supplierRFQData];
    localStorage.setItem('supplierRFQs', JSON.stringify(updatedSupplierRFQs));
    
    // 🔥 触发storage事件（跨标签页）
    window.dispatchEvent(new Event('storage'));
    
    // 🔥 触发自定义事件（同标签页内）- 让供应商Portal能立即接收到
    window.dispatchEvent(new CustomEvent('supplierRFQsUpdated', {
      detail: { rfqNumber: rfq.supplierRfqNo, supplierName: rfq.supplierName }
    }));
    
    // 🔥 记录提交日志
    console.log('📤 [提交询价单] 已成功提交给供应商');
    console.log('  - 询价单号:', rfq.supplierRfqNo);
    console.log('  - 供应商:', rfq.supplierName);
    console.log('  - 供应商邮箱:', rfq.supplierEmail);
    console.log('  - 供应商代码:', rfq.supplierCode);
    console.log('  - 产品数量:', rfq.products?.length || 1);
    console.log('  - 报价截止:', rfq.quotationDeadline);
    console.log('  - 已保存到supplierRFQs，总数:', updatedSupplierRFQs.length);
    console.log('  - 已触发supplierRFQsUpdated事件');
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 询价单已提交</p>
        <p className="text-sm">询价单号: {rfq.supplierRfqNo}</p>
        <p className="text-sm">供应商: {rfq.supplierName}</p>
        <p className="text-xs text-slate-600 mt-1">✓ 供应商将在Portal【客户需求池】中收到询价通知</p>
      </div>,
      { duration: 5000 }
    );
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
  const handleSubmitCreateOrder = () => {
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

    // 生成新的采购订单编号
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const newPONumber = `PO-${dateStr}-${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

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
      sourceRef: selectedRequirement.sourceRef, // 来源单号（销售订单号等）
      
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
    console.log('✅ 采购订单已添加到Context:', newPurchaseOrder);

    // 🔥 更新采购需求状态为已完成
    updateRequirement(selectedRequirement.id, {
      status: 'completed'
    });
    console.log('✅ 采购需求状态已更新为completed:', selectedRequirement.id);

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
    toast.success('请从采购需求池中选择需求创建订单');
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
    
    console.log('✅ [采购反馈] 已调用updateRequirement，业务员应该能看到了');
    console.log('  - 业务员邮箱:', feedbackRequirement.createdBy);
    console.log('  - 反馈产品数:', feedback.products.length);
    
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
        }} className="w-full">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger 
                value="requirements" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-rose-600 data-[state=active]:bg-transparent data-[state=active]:text-rose-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                采购需求池
                {(requirementStats.pending + requirementStats.partial) > 0 && (
                  <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
                    {requirementStats.pending + requirementStats.partial}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger 
                value="rfq-management" 
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
                  {/* 🔥 迁移报价数据按钮 */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const status = checkMigrationStatus();
                      if (status.needsMigration) {
                        if (window.confirm(`检测到 ${status.unmatchedRFQs} 个报价需要迁移。\n\n是否立即迁移？`)) {
                          const result = migrateRFQQuotesToBJQuotations();
                          if (result.success) {
                            toast.success(result.message, {
                              description: `已创建 ${result.migratedCount} 个BJ报价单，总计 ${result.totalBJs} 个`
                            });
                            // 刷新页面以重新加载数据
                            setTimeout(() => window.location.reload(), 1500);
                          } else {
                            toast.error(result.message);
                          }
                        }
                      } else {
                        toast.info('数据已是最新', {
                          description: `所有 ${status.rfqsWithQuotes} 个报价都已迁移`
                        });
                      }
                    }}
                    className="h-8 text-xs px-3 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                    title="将已有的RFQ报价转换成BJ报价单对象"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    迁移报价数据
                  </Button>
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
                      
                      // 🔍 调试：查看数据
                      if (idx === 0) {
                        console.log('🔍 采购需求数据示例:', {
                          requirementNo: req.requirementNo,
                          sourceRef: req.sourceRef,
                          region: req.region,
                          status: req.status,
                          dynamicStatus: dynamicStatus,
                          rawData: req
                        });
                      }
                      
                      // 🔥 区域标签配置
                      const regionConfig = req.region === 'North America' || req.region === 'NA' ? { label: 'NA', color: 'bg-blue-100 text-blue-700' }
                        : req.region === 'South America' || req.region === 'SA' ? { label: 'SA', color: 'bg-green-100 text-green-700' }
                        : req.region === 'Europe & Africa' || req.region === 'EA' ? { label: 'EA', color: 'bg-purple-100 text-purple-700' }
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
                                className="h-6 text-[12px] px-2 border-blue-300 text-blue-600 hover:bg-blue-50 gap-1"
                                title="编辑采购需求"
                              >
                                <Edit className="w-3 h-3" />
                                <span>编辑</span>
                              </Button>
                              
                              {(dynamicStatus === 'pending' || dynamicStatus === 'partial') && (
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
                                  if (window.confirm(`确定要删除采购需求 "${req.requirementNo}" 吗？\n\n产品: ${req.productName}\n数量: ${req.quantity} ${req.unit}`)) {
                                    deleteRequirement(req.id);
                                    toast.success('采购需求已删除', {
                                      description: `${req.requirementNo} - ${req.productName}`,
                                      duration: 3000
                                    });
                                  }
                                }}
                                className="h-6 text-[12px] px-2 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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
          <TabsContent value="rfq-management" className="m-0">
            {/* 询价统计 */}
            <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-5 gap-2">
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">总询价</p>
                  <p className="text-base font-bold text-gray-900">{rfqs.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">草稿</p>
                  <p className="text-base font-bold text-gray-600">{rfqs.filter(r => (r.status as any) === 'draft').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已发送</p>
                  <p className="text-base font-bold text-blue-600">{rfqs.filter(r => (r.status as any) === 'sent').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">等待报价</p>
                  <p className="text-base font-bold text-orange-600">{rfqs.filter(r => r.status === 'pending').length}</p>
                </div>
                <div className="text-center">
                  <p className="text-[14px] text-gray-500">已回复</p>
                  <p className="text-base font-bold text-green-600">{rfqs.filter(r => r.status === 'quoted').length}</p>
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
                      value={rfqSearchTerm}
                      onChange={(e) => setRFQSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs w-80"
                    />
                  </div>
                  {selectedRFQIds.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDeleteRFQs}
                      className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      批量删除 ({selectedRFQIds.length})
                    </Button>
                  )}
                </div>
                <p className="text-[14px] text-gray-600">共 {filteredRFQs.length} 条询价单</p>
              </div>
              
              {filteredRFQs.length === 0 ? (
                <div className="text-center py-12 border border-gray-200 rounded">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无询价单</p>
                  <p className="text-sm text-gray-400 mt-1">从采购需求池创建询价单后将显示在这里</p>
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
                            checked={selectedRFQIds.length === filteredRFQs.length && filteredRFQs.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRFQIds(filteredRFQs.map(r => r.id));
                              } else {
                                setSelectedRFQIds([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">序号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">询价单号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">供应商</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">关联需求</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">创建日期</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">截止日期</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRFQs.map((rfq, idx) => {
                        const rfqStatus = (rfq.status as any);
                        const isDraft = rfqStatus === 'draft';
                        const isSent = rfqStatus === 'sent';
                        
                        return (
                          <tr key={rfq.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                            <td className="py-2 px-2 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                                checked={selectedRFQIds.includes(rfq.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRFQIds([...selectedRFQIds, rfq.id]);
                                  } else {
                                    setSelectedRFQIds(selectedRFQIds.filter(id => id !== rfq.id));
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
                                  setCurrentRFQData(rfq.documentData);
                                  setShowRFQPreview(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                              >
                                {rfq.supplierRfqNo}
                              </button>
                              <div className="text-[12px] text-gray-500">{rfq.createdDate}</div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900">{rfq.supplierName}</div>
                              <div className="text-[12px] text-gray-500">{rfq.supplierCode}</div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900 font-mono">{rfq.requirementNo}</div>
                              {rfq.sourceRef && <div className="text-[12px] text-gray-500">{rfq.sourceRef}</div>}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                                {rfq.products?.length || 1}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900">{rfq.createdDate}</div>
                            </td>
                            <td className="py-2 px-2">
                              <div className="text-gray-900">{rfq.quotationDeadline}</div>
                            </td>
                            <td className="py-2 px-2">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                                isDraft ? 'bg-gray-50 text-gray-700 border-gray-200' :
                                isSent ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                rfq.status === 'pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                rfq.status === 'quoted' ? 'bg-green-50 text-green-700 border-green-200' :
                                'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {isDraft ? '草稿' :
                                 isSent ? '已发送' :
                                 rfq.status === 'pending' ? '等待报价' :
                                 rfq.status === 'quoted' ? '已回复' :
                                 rfq.status}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setCurrentRFQData(rfq.documentData);
                                    setShowRFQPreview(true);
                                  }}
                                  className="h-6 text-[12px] px-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  查看
                                </Button>
                                {isDraft && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditRFQ(rfq)}
                                      className="h-6 text-[12px] px-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
                                      编辑
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        // 🔥 提交询价单给供应商
                                        handleSubmitRFQToSupplier(rfq);
                                      }}
                                      className="h-6 text-[12px] px-2 bg-[#F96302] hover:bg-[#E05502]"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      提交
                                    </Button>
                                  </>
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
                                        await apiFetchJson(`/api/supplier-quotations/${encodeURIComponent(quotation.id)}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'accepted' }),
                                        });
                                        setSupplierQuotations(prev =>
                                          prev.map((q: any) =>
                                            q.id === quotation.id ? { ...q, status: 'accepted' as const } : q
                                          )
                                        );
                                        toast.success(
                                          <div className="space-y-1">
                                            <p className="font-semibold">✅ 已接受报价</p>
                                            <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                            <p className="text-xs text-slate-500">刷新后状态会保持</p>
                                          </div>
                                        );
                                      } catch (e: any) {
                                        toast.error(e?.message || '操作失败，请重试');
                                      }
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
                                        await apiFetchJson(`/api/supplier-quotations/${encodeURIComponent(quotation.id)}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ status: 'rejected' }),
                                        });
                                        setSupplierQuotations(prev =>
                                          prev.map((q: any) =>
                                            q.id === quotation.id ? { ...q, status: 'rejected' as const } : q
                                          )
                                        );
                                        toast.info(
                                          <div className="space-y-1">
                                            <p className="font-semibold">❌ 已拒绝报价</p>
                                            <p className="text-sm">报价单号: {quotation.quotationNo}</p>
                                            <p className="text-xs text-slate-500">刷新后状态会保持</p>
                                          </div>
                                        );
                                      } catch (e: any) {
                                        toast.error(e?.message || '操作失败，请重试');
                                      }
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

          {/* ==================== Tab 4: 采购订单 ==================== */}
          <TabsContent value="orders" className="m-0">
            {/* 搜索和筛选 */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    placeholder="搜索采购单号、供应商、需求编号..."
                    value={orderSearchTerm}
                    onChange={(e) => setOrderSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-xs border-gray-300"
                  />
                </div>
                {selectedOrderIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchDeleteOrders}
                    className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    批量删除 ({selectedOrderIds.length})
                  </Button>
                )}
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8 text-xs px-3 bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateOrder}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  新建采购单
                </Button>
              </div>
            </div>

            {/* 订单列表 - 新样式 */}
            <div className="px-3 py-3">
              <p className="text-[14px] text-gray-600 mb-2">共 {filteredOrders.length} 条采购订单</p>
              <div className="border border-gray-200 rounded overflow-hidden bg-white">
                <table className="w-full text-[14px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                          checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrderIds(filteredOrders.map(o => o.id));
                            } else {
                              setSelectedOrderIds([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">采购单号</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">供应商</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">区域</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">产品数量</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">报价期限</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600">状态</th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((po, idx) => {
                      const statusConfig = getPOStatusConfig(po.status);
                      const paymentConfig = getPaymentStatusConfig(po.paymentStatus);
                      
                      // 🔥 区域标签配置
                      const regionConfig = po.region === 'North America' || po.region === 'NA' ? { label: 'NA', color: 'bg-blue-100 text-blue-700' }
                        : po.region === 'South America' || po.region === 'SA' ? { label: 'SA', color: 'bg-green-100 text-green-700' }
                        : po.region === 'Europe & Africa' || po.region === 'EA' ? { label: 'EA', color: 'bg-purple-100 text-purple-700' }
                        : null;
                      
                      return (
                        <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                          <td className="py-2 px-2 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                              checked={selectedOrderIds.includes(po.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds([...selectedOrderIds, po.id]);
                                } else {
                                  setSelectedOrderIds(selectedOrderIds.filter(id => id !== po.id));
                                }
                              }}
                            />
                          </td>
                          <td className="py-2 px-2 text-center text-gray-500">
                            {idx + 1}
                          </td>
                          {/* 采购单号 */}
                          <td className="py-3 px-3">
                            <button 
                              onClick={() => handleViewPODocument(po)}
                              className="text-purple-600 hover:text-purple-700 font-medium hover:underline text-xs"
                            >
                              {po.poNumber}
                            </button>
                            {/* 🔥 显示来源销售合同编号 */}
                            {po.sourceRef && (
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                来源: {po.sourceRef}
                              </div>
                            )}
                          </td>
                          
                          {/* 供应商 */}
                          <td className="py-3 px-3">
                            <div className="text-gray-900">{po.supplierName}</div>
                            {/* 🔥 显示供应商代码 */}
                            {po.supplierCode && (
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {po.supplierCode}
                              </div>
                            )}
                          </td>
                          
                          {/* 区域 */}
                          <td className="py-3 px-3">
                            {regionConfig ? (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] font-medium ${regionConfig.color}`}>
                                {regionConfig.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[12px]">-</span>
                            )}
                          </td>
                          
                          {/* 产品数量 */}
                          <td className="py-3 px-3">
                            {po.items && po.items.length > 0 ? (
                              <>
                                <div className="text-gray-900">{po.items.length}个产品</div>
                                <div className="text-[12px] text-gray-500">
                                  共 {po.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} 件
                                </div>
                              </>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </td>
                          
                          {/* 报价期限 */}
                          <td className="py-3 px-3">
                            <div className="text-gray-900">{po.expectedDate}</div>
                            {po.actualDate && (
                              <div className="text-[12px] text-green-600">实: {po.actualDate}</div>
                            )}
                          </td>
                          
                          {/* 状态 */}
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[12px] font-medium border ${statusConfig.color}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                          
                          {/* 操作按钮 */}
                          <td className="py-3 px-3">
                            <div className="flex gap-1 justify-center">
                              <button
                                onClick={() => handleViewPODocument(po)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="查看采购订单文档"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    setExportingPDF(true);
                                    const poData = convertToPOData(po);
                                    setCurrentPOData(poData);
                                    
                                    // 等待React状态更新和DOM渲染
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                    
                                    // 使用隐藏的ref进行PDF导出
                                    if (hiddenPDFRef.current) {
                                      const filename = generatePDFFilename('Purchase_Order', po.poNumber);
                                      await exportToPDF(hiddenPDFRef.current, filename);
                                      toast.success(`✅ 采购订单 ${po.poNumber} PDF下载成功！`);
                                    } else {
                                      throw new Error('PDF渲染区域未就绪');
                                    }
                                  } catch (error) {
                                    toast.error('❌ PDF导出失败，请重试');
                                    console.error('PDF export error:', error);
                                  } finally {
                                    setExportingPDF(false);
                                  }
                                }}
                                className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="下载PDF"
                                disabled={exportingPDF}
                              >
                                {exportingPDF ? (
                                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeletePurchaseOrder(po)}
                                className="p-1 hover:bg-red-50 rounded transition-colors border border-red-300 text-red-600"
                                title="删除采购订单"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </Tabs>
      </div>

      {/* 订单详情对话框 */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '15px' }}>采购订单详情 - {viewOrder?.poNumber}</DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>Purchase Order Details</DialogDescription>
          </DialogHeader>
          
          {viewOrder && (
            <div className="space-y-4">
              {/* 🔥 基本信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">📋 基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">采购单号：</span>
                    <span className="font-semibold ml-2 text-purple-600">{viewOrder.poNumber}</span>
                  </div>
                  {viewOrder.sourceRef && (
                    <div>
                      <span className="text-gray-600">来源单号：</span>
                      <span className="ml-2 text-blue-600">{viewOrder.sourceRef}</span>
                    </div>
                  )}
                  {viewOrder.requirementNo && (
                    <div>
                      <span className="text-gray-600">关联需求：</span>
                      <span className="ml-2">{viewOrder.requirementNo}</span>
                    </div>
                  )}
                  {viewOrder.rfqNumber && (
                    <div>
                      <span className="text-gray-600">关联询价：</span>
                      <span className="ml-2">{viewOrder.rfqNumber}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">订单日期：</span>
                    <span className="ml-2">{viewOrder.orderDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">要求交期：</span>
                    <span className="ml-2">{viewOrder.expectedDate}</span>
                  </div>
                  {viewOrder.region && (
                    <div>
                      <span className="text-gray-600">区域：</span>
                      <span className="ml-2">{viewOrder.region}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 供应商信息 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-orange-900 mb-2">🏢 供应商信息（溯源结果）</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">供应商名称：</span>
                    <span className="font-semibold ml-2">{viewOrder.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">供应商代码：</span>
                    <span className="ml-2">{viewOrder.supplierCode}</span>
                  </div>
                  {viewOrder.supplierContact && (
                    <div>
                      <span className="text-gray-600">联系人：</span>
                      <span className="ml-2">{viewOrder.supplierContact}</span>
                    </div>
                  )}
                  {viewOrder.supplierPhone && (
                    <div>
                      <span className="text-gray-600">电话：</span>
                      <span className="ml-2">{viewOrder.supplierPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 产品清单 */}
              <div className="border-t pt-3">
                <h4 className="font-semibold mb-2 text-xs">📦 产品清单（溯源价格）</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">序号</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">产品名称</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-700">型号</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">数量</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">单价</th>
                        <th className="text-right py-2 px-2 font-medium text-gray-700">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((item, idx) => (
                          <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-2 text-gray-600">{idx + 1}</td>
                            <td className="py-2 px-2">
                              <div className="font-medium">{item.productName}</div>
                              {item.specification && (
                                <div className="text-[11px] text-gray-500">{item.specification}</div>
                              )}
                            </td>
                            <td className="py-2 px-2 text-gray-600">{item.modelNo}</td>
                            <td className="py-2 px-2 text-right font-medium">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {item.currency} {item.unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-semibold">
                              {item.currency} {item.subtotal.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-400">
                            暂无产品信息
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={5} className="py-2 px-2 text-right font-semibold">
                          总计：
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-[#F96302]">
                          {viewOrder.currency} {viewOrder.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* 🔥 条款信息 */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded">
                <div>
                  <span className="text-gray-600">付款条款：</span>
                  <span className="ml-2">{viewOrder.paymentTerms}</span>
                </div>
                <div>
                  <span className="text-gray-600">交货条款：</span>
                  <span className="ml-2">{viewOrder.deliveryTerms}</span>
                </div>
              </div>

              {/* 🔥 备注 */}
              {viewOrder.remarks && (
                <div className="text-xs">
                  <span className="text-gray-600">备注：</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-700 whitespace-pre-wrap">
                    {viewOrder.remarks}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDialog(false)} className="text-xs">
              关闭
            </Button>
            <Button 
              onClick={() => {
                if (viewOrder) {
                  handleViewPODocument(viewOrder);
                  setShowOrderDialog(false);
                }
              }}
              className="bg-[#F96302] hover:bg-[#E05502] text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              查看PDF文档
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 采购订单文档预览对话框 - 引用文档中心模板 */}
      <Dialog open={showPOPreview} onOpenChange={setShowPOPreview}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle style={{ fontSize: '15px' }}>
              📋 采购订单预览 - {currentPOData?.poNo}
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>
              Purchase Order Preview - 引用文档中心统一模板
            </DialogDescription>
          </DialogHeader>

          {/* 文档预览区域 */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {currentPOData && (
              <div className="print-contract-content">
                <PurchaseOrderDocument
                  ref={poPDFRef}
                  data={currentPOData}
                />
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-white">
            <Button
              variant="outline"
              onClick={() => setShowPOPreview(false)}
              className="text-xs"
            >
              关闭预览
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!poPDFRef.current || !currentPOData) return;
                const filename = generatePDFFilename('Purchase_Order', currentPOData.poNo);
                await exportToPDFPrint(poPDFRef.current, filename);
              }}
              className="text-xs"
              disabled={exportingPDF}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              打印/另存为PDF
            </Button>
            <Button
              onClick={async () => {
                if (!poPDFRef.current || !currentPOData) return;
                setExportingPDF(true);
                try {
                  await new Promise(resolve => setTimeout(resolve, 500));
                  const filename = generatePDFFilename('Purchase_Order', currentPOData.poNo);
                  await exportToPDF(poPDFRef.current, filename);
                  toast.success('采购订单PDF导出成功！');
                } catch (error) {
                  toast.error('PDF导出失败，请重试');
                  console.error('PDF export error:', error);
                } finally {
                  setExportingPDF(false);
                }
              }}
              className="bg-[#F96302] hover:bg-[#E05502] text-xs"
              disabled={exportingPDF}
            >
              {exportingPDF ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  导出中...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  导出PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 隐藏的PDF导出专用渲染区域 */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        {currentPOData && (
          <div ref={hiddenPDFRef}>
            <PurchaseOrderDocument data={currentPOData} />
          </div>
        )}
      </div>

      {/* 🔥 采购需求详情对话框 - 使用文档模板视图 */}
      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0 gap-0 [&>button]:hidden">
          {/* Hidden Title and Description for accessibility */}
          <DialogTitle className="sr-only">采购需求单详情</DialogTitle>
          <DialogDescription className="sr-only">
            查看完整的采购需求单信息和产品详情
          </DialogDescription>
          
          {/* Header with Print and Export buttons - Floating on top */}
          <div className="absolute top-4 right-16 z-50 flex gap-2 print:hidden">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
              onClick={async () => {
                if (viewRequirement) {
                  try {
                    const prData = convertToPRData(viewRequirement, user?.role);
                    const filename = generatePDFFilename('PR', prData.requirementNo);
                    const el = document.getElementById('pr-document-view') as HTMLDivElement | null;
                    if (!el) {
                      toast.error('未找到可导出的文档区域');
                      return;
                    }
                    await exportToPDFPrint(el, filename);
                    toast.success('PDF已生成！');
                  } catch (error) {
                    console.error('PDF导出失败:', error);
                    toast.error('PDF导出失败');
                  }
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              导出PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 text-sm bg-white shadow-lg hover:bg-gray-50"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              打印
            </Button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setShowRequirementDialog(false)}
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

          {/* Document - Full Screen */}
          <div id="pr-document-view" className="overflow-y-auto max-h-[95vh] bg-gray-100">
            {viewRequirement && (
              <PurchaseRequirementDocument data={convertToPRData(viewRequirement, user?.role)} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔥 创建采购订单对话框 - 从需求创建 */}
      <Dialog open={showCreateOrderDialog} onOpenChange={setShowCreateOrderDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '15px' }}>
              🛒 创建采购订单 - {selectedRequirement?.requirementNo}
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>
              Create Purchase Order from Requirement
            </DialogDescription>
          </DialogHeader>

          {selectedRequirement && (
            <div className="space-y-4">
              {/* 🔥 需求基本信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">需求编号：</span>
                    <span className="font-semibold text-gray-900 ml-1">{selectedRequirement.requirementNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">产品数：</span>
                    <span className="font-semibold text-gray-900 ml-1">{selectedRequirement.items?.length || 0} 个</span>
                  </div>
                  <div>
                    <span className="text-gray-600">型号：</span>
                    <span className="ml-1 text-gray-900">{selectedRequirement.requiredDate}</span>
                  </div>
                  {selectedRequirement.sourceRef && (
                    <div>
                      <span className="text-gray-600">来源：</span>
                      <span className="ml-1 text-blue-600 text-[10px]">{selectedRequirement.sourceRef}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🔥 产品清单 - 每个产品独立的单价输入 */}
              <div>
                <h4 className="text-xs font-semibold text-gray-900 mb-2">📦 产品清单 & 采购单价</h4>
                <div className="border border-gray-200 rounded overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">序号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700">需求数量</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700 w-24">采购单价 *</th>
                        <th className="text-right py-1.5 px-2 font-medium text-gray-700">小计</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequirement.items?.map((item, idx) => {
                        const unitPrice = parseFloat(productPrices[item.id] || '0');
                        const subtotal = item.quantity * unitPrice;
                        
                        return (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2 px-2 text-gray-600">{idx + 1}</td>
                            <td className="py-2 px-2 font-medium text-gray-900">{item.productName}</td>
                            <td className="py-2 px-2 text-gray-700 text-[9px]">{item.modelNo}</td>
                            <td className="py-2 px-2 text-right font-semibold text-gray-900">{item.quantity.toLocaleString()}</td>
                            <td className="py-2 px-2 text-gray-700">{item.unit}</td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                step="0.01"
                                value={productPrices[item.id] || ''}
                                onChange={(e) => setProductPrices({ ...productPrices, [item.id]: e.target.value })}
                                placeholder="0.00"
                                className="h-6 text-[10px] text-right"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-semibold text-gray-900">
                              {isNaN(subtotal) || subtotal === 0 ? '--' : subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={6} className="py-2 px-2 text-right text-gray-700">
                          预计总金额：
                        </td>
                        <td className="py-2 px-2 text-right text-gray-900">
                          {createOrderForm.currency} {
                            (() => {
                              const total = selectedRequirement.items?.reduce((sum, item) => {
                                const price = parseFloat(productPrices[item.id] || '0');
                                return sum + (item.quantity * price);
                              }, 0) || 0;
                              return isNaN(total) ? '--' : total.toFixed(2);
                            })()
                          }
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">💡 请为每个产品填写采购单价</p>
              </div>

              {/* 供应商信息 */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-900">🏭 供应商信息</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="supplierName" className="text-xs">
                      供应商名称 <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="supplierName"
                        value={createOrderForm.supplierName}
                        onChange={(e) => setCreateOrderForm({ ...createOrderForm, supplierName: e.target.value })}
                        placeholder="请输入或从供应商库选择"
                        className="text-xs h-8 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSupplierDialog(true)}
                        className="h-8 text-xs px-3"
                      >
                        <Search className="w-3 h-3 mr-1" />
                        选择
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="supplierCode" className="text-xs">供应商编码</Label>
                    <Input
                      id="supplierCode"
                      value={createOrderForm.supplierCode}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, supplierCode: e.target.value })}
                      placeholder="可选"
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-xs">结算货币</Label>
                    <Select 
                      value={createOrderForm.currency} 
                      onValueChange={(value) => setCreateOrderForm({ ...createOrderForm, currency: value })}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD" style={{ fontSize: '11px' }}>USD 美元</SelectItem>
                        <SelectItem value="EUR" style={{ fontSize: '11px' }}>EUR 欧元</SelectItem>
                        <SelectItem value="GBP" style={{ fontSize: '11px' }}>GBP 英镑</SelectItem>
                        <SelectItem value="CNY" style={{ fontSize: '11px' }}>CNY 人民币</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 采购条款 */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-gray-900">📄 采购条款</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="paymentTerms" className="text-xs">付款条款</Label>
                    <Input
                      id="paymentTerms"
                      value={createOrderForm.paymentTerms}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, paymentTerms: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="deliveryTerms" className="text-xs">交货条款</Label>
                    <Input
                      id="deliveryTerms"
                      value={createOrderForm.deliveryTerms}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, deliveryTerms: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expectedDate" className="text-xs">期望交付日期</Label>
                    <Input
                      id="expectedDate"
                      type="date"
                      value={createOrderForm.expectedDate}
                      onChange={(e) => setCreateOrderForm({ ...createOrderForm, expectedDate: e.target.value })}
                      className="mt-1 text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* 备注 */}
              <div>
                <Label htmlFor="remarks" className="text-xs">备注说明</Label>
                <Textarea
                  id="remarks"
                  value={createOrderForm.remarks}
                  onChange={(e) => setCreateOrderForm({ ...createOrderForm, remarks: e.target.value })}
                  placeholder="订单备注..."
                  className="mt-1 text-xs min-h-[60px]"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateOrderDialog(false)}
              className="text-xs"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitCreateOrder}
              className="bg-[#F96302] hover:bg-[#E05502] text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              创建采购订单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔥 供应商选择对话框 */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '15px' }}>
              🏭 选择供应商
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>
              从供应商库中搜索并选择供应商
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="搜索供应商名称、编码、联系人、类别、区域..."
                value={supplierSearchTerm}
                onChange={(e) => setSupplierSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* 🔥 供应商列表 - 使用真实数据 */}
            <div className="border border-gray-200 rounded overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">等级</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">供应商编码</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">供应商名称</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">类别</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">区域</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">联系人</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-700">电话</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // 🔥 使用供应商数据（优先后端DB）并支持搜索
                    const filteredSuppliers = (supplierSearchTerm
                      ? allSuppliers.filter(s => {
                          const kw = supplierSearchTerm.trim().toLowerCase();
                          const hay = [
                            s.name,
                            s.nameEn,
                            s.category,
                            s.code,
                            s.region,
                            s.contact,
                            s.email,
                            s.phone,
                          ].filter(Boolean).join(' ').toLowerCase();
                          return hay.includes(kw);
                        })
                      : allSuppliers
                    ).filter(s => s.status === 'active');
                    
                    if (filteredSuppliers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="py-8 px-3 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <AlertCircle className="w-8 h-8 text-gray-400" />
                              <p>未找到匹配的供应商</p>
                              <p className="text-[10px]">请尝试其他搜索关键词</p>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    
                    return filteredSuppliers.map((supplier, idx) => (
                      <tr key={supplier.id} className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="py-2 px-3">
                          <Badge 
                            className={`text-[9px] px-1.5 py-0.5 ${
                              supplier.level === 'A' ? 'bg-green-100 text-green-700' :
                              supplier.level === 'B' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {supplier.level}级
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10px] text-gray-600">{supplier.code}</td>
                        <td className="py-2 px-3 font-medium text-gray-900">
                          <div>{supplier.name}</div>
                          <div className="text-[9px] text-gray-500 mt-0.5">{supplier.nameEn}</div>
                        </td>
                        <td className="py-2 px-3 text-gray-700">
                          <Badge variant="outline" className="text-[9px]">{supplier.category}</Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-600">{supplier.region}</td>
                        <td className="py-2 px-3 text-gray-700">{supplier.contact}</td>
                        <td className="py-2 px-3 text-gray-600 text-[10px]">{supplier.phone}</td>
                        <td className="py-2 px-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setCreateOrderForm({
                                ...createOrderForm,
                                supplierName: supplier.name,
                                supplierCode: supplier.code
                              });
                              setShowSupplierDialog(false);
                              setSupplierSearchTerm('');
                              toast.success(
                                <div>
                                  <p className="font-semibold">✅ 已选择供应商</p>
                                  <p className="text-[10px] mt-1">{supplier.name}</p>
                                  <p className="text-[10px]">等级: {supplier.level}级 | {supplier.category}</p>
                                </div>
                              );
                            }}
                            className="h-6 text-[10px] bg-[#F96302] hover:bg-[#E05502] px-2"
                          >
                            选择
                          </Button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <p>💡 提示：点击"选择"按钮将自动填充供应商信息</p>
              <p>
                共 {(supplierSearchTerm
                  ? allSuppliers.filter(s => {
                      const kw = supplierSearchTerm.trim().toLowerCase();
                      const hay = [
                        s.name,
                        s.nameEn,
                        s.category,
                        s.code,
                        s.region,
                        s.contact,
                        s.email,
                        s.phone,
                      ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();
                      return hay.includes(kw);
                    })
                  : allSuppliers
                ).filter(s => s.status === 'active').length}{' '}
                个活跃供应商
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSupplierDialog(false);
                setSupplierSearchTerm(''); // 关闭时清空搜索
              }}
              className="text-xs"
            >
              取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 创建询价单对话框 ==================== */}
      <Dialog open={showCreateRFQDialog} onOpenChange={setShowCreateRFQDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-base">创建询价单 - 向供应商询价</DialogTitle>
            <DialogDescription className="text-xs">
              选择供应商并设置询价参数，系统将向每个供应商发送包含所有产品的询价单
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {/* 需求信息 */}
            {selectedRequirementForRFQ && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4">
                <h4 className="text-xs font-semibold text-gray-900 mb-3">📋 采购需求信息</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">需求编号:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.requirementNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">客户:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.customerName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">要求日期:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.requiredDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">产品数量:</span>
                    <span className="ml-2 font-semibold text-gray-900">{selectedRequirementForRFQ.items?.length || 0} 项</span>
                  </div>
                </div>
                
                {/* 产品列表 */}
                <div className="mt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">产品明细:</div>
                  <div className="bg-white border border-gray-200 rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 cursor-pointer"
                              checked={selectedProductIds.length === selectedRequirementForRFQ.items?.length && selectedProductIds.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProductIds(selectedRequirementForRFQ.items?.map(item => String(item.id)) || []);
                                } else {
                                  setSelectedProductIds([]);
                                }
                              }}
                            />
                          </th>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">#</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                          <th className="text-right py-1.5 px-2 font-medium text-gray-700">数量</th>
                          <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                          <th className="text-center py-1.5 px-2 font-medium text-gray-700">询价状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequirementForRFQ.items?.map((item, idx) => (
                          <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                            <td className="py-1.5 px-2 text-center">
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 cursor-pointer"
                                checked={selectedProductIds.includes(String(item.id))}
                                onChange={(e) => {
                                  const itemId = String(item.id);
                                  if (e.target.checked) {
                                    setSelectedProductIds([...selectedProductIds, itemId]);
                                  } else {
                                    setSelectedProductIds(selectedProductIds.filter(id => id !== itemId));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center text-gray-600">{idx + 1}</td>
                            <td className="py-1.5 px-2">{item.productName}</td>
                            <td className="py-1.5 px-2 text-gray-600">{item.modelNo}</td>
                            <td className="py-1.5 px-2 text-right font-semibold">{item.quantity}</td>
                            <td className="py-1.5 px-2 text-gray-600">{item.unit}</td>
                            <td className="py-1.5 px-2 text-center">
                              {(item as any).rfqHistory && (item as any).rfqHistory.length > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedProductForHistory(item);
                                    setShowRFQHistoryDialog(true);
                                  }}
                                  className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors cursor-pointer"
                                >
                                  已发送
                                </button>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 选择供应商 */}
            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">
                选择供应商 * ({selectedSuppliers.length} 个已选)
              </Label>
              
              {/* 🔥 搜索框 */}
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="搜索供应商名称、产品名称、产品类别..."
                  value={supplierSearchTerm}
                  onChange={(e) => setSupplierSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9"
                />
              </div>

              <div className="border border-gray-300 rounded p-3 bg-white max-h-60 overflow-y-auto">
                {filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    未找到匹配的供应商
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier.code}
                      className={`flex items-center justify-between p-2 border rounded transition-colors ${
                        selectedSuppliers.some(s => s.code === supplier.code)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => {
                          if (selectedSuppliers.some(s => s.code === supplier.code)) {
                            setSelectedSuppliers(selectedSuppliers.filter(s => s.code !== supplier.code));
                          } else {
                            setSelectedSuppliers([...selectedSuppliers, supplier]);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuppliers.some(s => s.code === supplier.code)}
                          onChange={() => {}}
                          className="w-4 h-4"
                        />
                        <div>
                          <div className="text-xs font-semibold text-gray-900">{supplier.name}</div>
                          <div className="text-xs text-gray-600">{supplier.code} | {supplier.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          supplier.level === 'A' ? 'bg-green-100 text-green-700' :
                          supplier.level === 'B' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {supplier.level}级
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewRFQ(supplier);
                          }}
                          className="h-7 text-xs px-2 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          预览
                        </Button>
                      </div>
                    </div>
                  ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 可以选择多个供应商进行询价对比
              </p>
            </div>

            {/* 报价截止日期 */}
            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">
                报价截止日期 *
              </Label>
              <DatePicker
                date={rfqDeadline}
                onSelect={setRFQDeadline}
                placeholder="选择截止日期"
                minDate={new Date()}
                className="text-xs h-9"
              />
              <p className="text-xs text-gray-500 mt-1">
                供应商需要在此日期前提交报价
              </p>
            </div>

            {/* 备注 */}
            <div>
              <Label className="text-xs font-semibold text-gray-900 mb-2 block">
                备注说明
              </Label>
              <Textarea
                value={rfqRemarks}
                onChange={(e) => setRFQRemarks(e.target.value)}
                placeholder="向供应商说明特殊要求、注意事项等..."
                rows={3}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateRFQDialog(false)}
              className="text-xs"
            >
              取消
            </Button>
            <Button
              onClick={handleSubmitRFQ}
              disabled={submittingRFQ || selectedSuppliers.length === 0 || !rfqDeadline}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              {submittingRFQ ? '创建中...' : `创建询价单 (${selectedSuppliers.length} 个供应商)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 询价历史弹窗 ==================== */}
      <Dialog open={showRFQHistoryDialog} onOpenChange={setShowRFQHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <DialogTitle className="text-base">询价历史记录</DialogTitle>
            <DialogDescription className="text-xs">
              {selectedProductForHistory?.productName} - {selectedProductForHistory?.modelNo}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedProductForHistory?.rfqHistory && selectedProductForHistory.rfqHistory.length > 0 ? (
              <div className="space-y-3">
                {selectedProductForHistory.rfqHistory.map((history: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">
                          询价批次 #{history.batchNo || idx + 1}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {history.supplierCount} 家供应商
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        {history.sentDate}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-700 mb-2">
                      <span className="font-medium">发送至：</span>
                    </div>
                    
                    <div className="space-y-1.5">
                      {history.suppliers.map((supplier: any, sIdx: number) => (
                        <div key={sIdx} className="flex items-center justify-between bg-white border border-gray-200 rounded px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-900">{supplier.name}</span>
                            <span className="text-xs text-gray-500">{supplier.code}</span>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            supplier.level === 'A' ? 'bg-green-100 text-green-700' :
                            supplier.level === 'B' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {supplier.level}级
                          </span>
                        </div>
                      ))}
                    </div>

                    {history.remarks && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-600">备注：{history.remarks}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-xs">
                暂无询价历史记录
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowRFQHistoryDialog(false)}
              className="text-xs"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 询价单预览对话框 */}
      <Dialog open={showRFQPreview} onOpenChange={setShowRFQPreview}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              📋 供应商询价单预览 - {currentRFQData?.rfqNo}
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>
              Supplier RFQ Preview - 可直接发送给供应商的询价单文档
            </DialogDescription>
          </DialogHeader>

          {/* 文档预览区域 */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            {currentRFQData && (
              <SupplierRFQDocument
                ref={rfqDocRef}
                data={currentRFQData}
              />
            )}
          </div>

          {/* 操作按钮 */}
          <div className="border-t bg-white px-6 py-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              💡 此询价单可发送给供应商进行报价
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRFQPreview(false)}
                className="text-xs"
              >
                关闭
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportRFQPDF(false)}
                className="text-xs flex items-center gap-1"
              >
                <Printer className="w-3 h-3" />
                打印
              </Button>
              <Button
                size="sm"
                onClick={() => handleExportRFQPDF(true)}
                className="bg-[#F96302] hover:bg-[#E05502] text-xs flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                下载PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔥 供应商报价详情对话框 */}
      <Dialog open={showSupplierQuotationDialog} onOpenChange={setShowSupplierQuotationDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>供应商报价单</DialogTitle>
            <DialogDescription>
              查看供应商提交的完整报价单文档 | 报价单号: {selectedSupplierQuotation?.quotationNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSupplierQuotation && (
            <div className="space-y-4">
              {/* 🔥 使用供应商报价单文档查看器 */}
              <SupplierQuotationDocumentViewer 
                quotation={selectedSupplierQuotation}
                onEdit={undefined} // Admin端不允许编辑供应商报价
                onSubmit={undefined} // Admin端不允许提交
              />
              
              {/* 🔥 Admin操作按钮 */}
              {selectedSupplierQuotation.status === 'submitted' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      try {
                        await apiFetchJson(`/api/supplier-quotations/${encodeURIComponent(selectedSupplierQuotation.id)}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'accepted' }),
                        });
                        setSupplierQuotations(prev =>
                          prev.map((q: any) =>
                            q.id === selectedSupplierQuotation.id ? { ...q, status: 'accepted' as const } : q
                          )
                        );
                        setShowSupplierQuotationDialog(false);
                        toast.success(
                          <div className="space-y-1">
                            <p className="font-semibold">✅ 已接受报价</p>
                            <p className="text-sm">报价单号: {selectedSupplierQuotation.quotationNo}</p>
                            <p className="text-xs text-gray-500">刷新后状态会保持，可在采购订单中创建订单</p>
                          </div>
                        );
                      } catch (e: any) {
                        toast.error(e?.message || '操作失败，请重试');
                      }
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    接受报价
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      try {
                        await apiFetchJson(`/api/supplier-quotations/${encodeURIComponent(selectedSupplierQuotation.id)}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'rejected' }),
                        });
                        setSupplierQuotations(prev =>
                          prev.map((q: any) =>
                            q.id === selectedSupplierQuotation.id ? { ...q, status: 'rejected' as const } : q
                          )
                        );
                        setShowSupplierQuotationDialog(false);
                        toast.info(
                          <div className="space-y-1">
                            <p className="font-semibold">❌ 已拒绝报价</p>
                            <p className="text-sm">报价单号: {selectedSupplierQuotation.quotationNo}</p>
                            <p className="text-xs text-gray-500">刷新后状态会保持</p>
                          </div>
                        );
                      } catch (e: any) {
                        toast.error(e?.message || '操作失败，请重试');
                      }
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    拒绝报价
                  </Button>
                </div>
              )}
              
              {/* 🔥 显示报价状态提示 */}
              {selectedSupplierQuotation.status === 'accepted' && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ 此报价已被接受 | {selectedSupplierQuotation.submittedDate || ''}
                  </p>
                </div>
              )}
              
              {selectedSupplierQuotation.status === 'rejected' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    ❌ 此报价已被拒绝 | {selectedSupplierQuotation.submittedDate || ''}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🔥 编辑询价单对话框 - 完整编辑功能 */}
      <Dialog open={showEditRFQDialog} onOpenChange={setShowEditRFQDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '16px' }}>
              ✏️ 编辑询价单 - {editRFQData?.rfqNo}
            </DialogTitle>
            <DialogDescription style={{ fontSize: '12px' }}>
              Edit RFQ - All fields are editable
            </DialogDescription>
          </DialogHeader>

          {editRFQData && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-blue-900 mb-2">��� 基本信息</h4>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-[10px] text-gray-600">询价单号</Label>
                    <Input
                      value={editRFQData.rfqNo || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, rfqNo: e.target.value})}
                      className="text-xs h-7"
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">询价日期</Label>
                    <Input
                      type="date"
                      value={editRFQData.rfqDate || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, rfqDate: e.target.value})}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">要求回复日期</Label>
                    <Input
                      type="date"
                      value={editRFQData.requiredResponseDate || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, requiredResponseDate: e.target.value})}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">要求交货日期</Label>
                    <Input
                      type="date"
                      value={editRFQData.requiredDeliveryDate || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, requiredDeliveryDate: e.target.value})}
                      className="text-xs h-7"
                    />
                  </div>
                </div>
              </div>

              {/* 供应商信息 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-green-900 mb-2">🏭 供应商信息</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] text-gray-600">公司名称</Label>
                    <Input
                      value={editRFQData.supplier?.companyName || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, supplier: {...editRFQData.supplier, companyName: e.target.value}})}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">联系人</Label>
                    <Input
                      value={editRFQData.supplier?.contactPerson || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, supplier: {...editRFQData.supplier, contactPerson: e.target.value}})}
                      className="text-xs h-7"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-600">地址</Label>
                    <Input
                      value={editRFQData.supplier?.address || ''}
                      onChange={(e) => setEditRFQData({...editRFQData, supplier: {...editRFQData.supplier, address: e.target.value}})}
                      className="text-xs h-7"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-600">电话</Label>
                      <Input
                        value={editRFQData.supplier?.tel || ''}
                        onChange={(e) => setEditRFQData({...editRFQData, supplier: {...editRFQData.supplier, tel: e.target.value}})}
                        className="text-xs h-7"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-600">邮箱</Label>
                      <Input
                        value={editRFQData.supplier?.email || ''}
                        onChange={(e) => setEditRFQData({...editRFQData, supplier: {...editRFQData.supplier, email: e.target.value}})}
                        className="text-xs h-7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 询价说明 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-orange-900 mb-2">📋 询价说明</h4>
                <div>
                  <Textarea
                    value={editRFQData.inquiryDescription || ''}
                    onChange={(e) => setEditRFQData({...editRFQData, inquiryDescription: e.target.value})}
                    className="text-xs min-h-[60px]"
                    placeholder="例如：请贵司根据以下产品清单和要求提供详细报价，包括单价、总价、交货期等信息。请在 2025-12-21 前将报价单回复至采购联系人邮箱。"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">💡 提示：如不填写将使用默认说明（包含回复截止日期）</p>
                </div>
              </div>

              {/* 产品清单 - 可编辑 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-900">📦 产品清单</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newProduct = {
                        no: (editRFQData.products?.length || 0) + 1,
                        modelNo: '',
                        description: '',
                        specification: '',
                        quantity: 1,
                        unit: 'pcs',
                        targetPrice: '',
                        remarks: ''
                      };
                      setEditRFQData({
                        ...editRFQData,
                        products: [...(editRFQData.products || []), newProduct]
                      });
                    }}
                    className="h-6 text-[10px] px-2 border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    添加产品
                  </Button>
                </div>
                <div className="border border-gray-200 rounded overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700 w-10">#</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">型号</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">产品名称</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">规格</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700">数量</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">单位</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">目标价</th>
                        <th className="text-left py-1.5 px-2 font-medium text-gray-700">备注</th>
                        <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-16">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editRFQData.products?.map((product: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-1 px-2 text-gray-500">{product.no}</td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.modelNo || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].modelNo = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.description || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].description = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.specification || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].specification = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              type="number"
                              value={product.quantity || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].quantity = parseInt(e.target.value) || 0;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1 text-center"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.unit || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].unit = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.targetPrice || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].targetPrice = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                              placeholder="选填"
                            />
                          </td>
                          <td className="py-1 px-1">
                            <Input
                              value={product.remarks || ''}
                              onChange={(e) => {
                                const newProducts = [...editRFQData.products];
                                newProducts[idx].remarks = e.target.value;
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="text-[10px] h-6 px-1"
                              placeholder="选填"
                            />
                          </td>
                          <td className="py-1 px-1 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const newProducts = editRFQData.products.filter((_: any, i: number) => i !== idx);
                                // 重新编号
                                newProducts.forEach((p: any, i: number) => p.no = i + 1);
                                setEditRFQData({...editRFQData, products: newProducts});
                              }}
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 报价条款 - 16条完整条款，可下拉选择 + 自定义 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-yellow-900 mb-3">📜 报价条款（16条）</h4>
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. 报价币种 */}
                  <EditableSelect
                    label="1. 报价币种"
                    value={editRFQData.terms?.currency || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, currency: val}})}
                    options={TERMS_OPTIONS.currency}
                    placeholder="选择或输入币种..."
                  />

                  {/* 2. 付款方式 */}
                  <EditableSelect
                    label="2. 付款方式"
                    value={editRFQData.terms?.paymentTerms || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, paymentTerms: val}})}
                    options={TERMS_OPTIONS.paymentTerms}
                    placeholder="选择或输入付款方式..."
                  />

                  {/* 3. 交货条款 */}
                  <EditableSelect
                    label="3. 交货条款"
                    value={editRFQData.terms?.deliveryTerms || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, deliveryTerms: val}})}
                    options={TERMS_OPTIONS.deliveryTerms}
                    placeholder="选择或输入交货条款..."
                  />

                  {/* 4. 交货地址 */}
                  <EditableSelect
                    label="4. 交货地址"
                    value={editRFQData.terms?.deliveryAddress || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, deliveryAddress: val}})}
                    options={TERMS_OPTIONS.deliveryAddress}
                    placeholder="选择或输入交货地址..."
                  />

                  {/* 5. 交货时间 */}
                  <EditableSelect
                    label="5. 交货时间"
                    value={editRFQData.terms?.deliveryRequirement || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, deliveryRequirement: val}})}
                    options={TERMS_OPTIONS.deliveryRequirement}
                    placeholder="选择或输入交货时间..."
                  />

                  {/* 6. 产品质量标准 */}
                  <EditableSelect
                    label="6. 产品质量标准"
                    value={editRFQData.terms?.qualityStandard || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, qualityStandard: val}})}
                    options={TERMS_OPTIONS.qualityStandard}
                    placeholder="选择或输入质量标准..."
                  />

                  {/* 7. 验收标准 */}
                  <EditableSelect
                    label="7. 验收标准"
                    value={editRFQData.terms?.inspectionMethod || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, inspectionMethod: val}})}
                    options={TERMS_OPTIONS.inspectionMethod}
                    placeholder="选择或输入验收标准..."
                  />

                  {/* 8. 包装要求 */}
                  <EditableSelect
                    label="8. 包装要求"
                    value={editRFQData.terms?.packaging || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, packaging: val}})}
                    options={TERMS_OPTIONS.packaging}
                    placeholder="选择或输入包装要求..."
                  />

                  {/* 9. 唛头要求 */}
                  <EditableSelect
                    label="9. 唛头要求"
                    value={editRFQData.terms?.shippingMarks || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, shippingMarks: val}})}
                    options={TERMS_OPTIONS.shippingMarks}
                    placeholder="选择或输入唛头要求..."
                  />

                  {/* 10. 验货要求 */}
                  <EditableSelect
                    label="10. 验货要求"
                    value={editRFQData.terms?.inspectionRequirement || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, inspectionRequirement: val}})}
                    options={TERMS_OPTIONS.inspectionRequirement}
                    placeholder="选择或输入验货要求..."
                  />

                  {/* 11. 技术文件 */}
                  <EditableSelect
                    label="11. 技术文件"
                    value={editRFQData.terms?.technicalDocuments || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, technicalDocuments: val}})}
                    options={TERMS_OPTIONS.technicalDocuments}
                    placeholder="选择或输入技术文件要求..."
                  />

                  {/* 12. 知识产权 */}
                  <EditableSelect
                    label="12. 知识产权"
                    value={editRFQData.terms?.ipRights || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, ipRights: val}})}
                    options={TERMS_OPTIONS.ipRights}
                    placeholder="选择或输入知识产权要求..."
                  />

                  {/* 13. 保密条款 */}
                  <EditableSelect
                    label="13. 保密条款"
                    value={editRFQData.terms?.confidentiality || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, confidentiality: val}})}
                    options={TERMS_OPTIONS.confidentiality}
                    placeholder="选择或输入保密条款..."
                  />

                  {/* 14. 样品要求 */}
                  <EditableSelect
                    label="14. 样品要求"
                    value={editRFQData.terms?.sampleRequirement || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, sampleRequirement: val}})}
                    options={TERMS_OPTIONS.sampleRequirement}
                    placeholder="选择或输入样品要求..."
                  />

                  {/* 15. 最小起订量（MOQ） */}
                  <EditableSelect
                    label="15. 最小起订量（MOQ）"
                    value={editRFQData.terms?.moq || ''}
                    onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, moq: val}})}
                    options={TERMS_OPTIONS.moq}
                    placeholder="选择或输入MOQ..."
                  />

                  {/* 16. 其他说明 */}
                  <div className="col-span-2">
                    <EditableSelect
                      label="16. 其他说明"
                      value={editRFQData.terms?.remarks || ''}
                      onChange={(val) => setEditRFQData({...editRFQData, terms: {...editRFQData.terms, remarks: val}})}
                      options={TERMS_OPTIONS.remarks}
                      placeholder="选择或输入其他说明..."
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditRFQDialog(false);
                setEditRFQData(null);
              }}
              className="text-xs"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveEditRFQ}
              className="text-xs bg-[#F96302] hover:bg-[#E05502]"
            >
              💾 保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            console.log('📤 报价数据已提交:', quoteData);
            
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
              region: selectedRequirementForQuote.region || 'North America',
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
            
            console.log('✅ 报价已保存为草稿:', newQuotation);
            
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
    </div>
  );
};

export default PurchaseOrderManagementEnhanced;