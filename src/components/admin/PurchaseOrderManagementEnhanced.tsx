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
} from 'lucide-react';
import { suppliersDatabase, type Supplier } from '../../data/suppliersData'; // fallback only，已废弃，以 Supabase companies 表为准
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { buildPaymentTermsText } from '../../lib/paymentFlow';
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
import { PurchaseOrderData } from '../documents/templates/PurchaseOrderDocument'; // 🔥 文档中心采购订单模板
import { XJData } from '../documents/templates/XJDocument'; // 🔥 采购询价单(XJ)模板
import QuoteCreationIntelligent from './QuoteCreationIntelligent'; // 🔥 智能报价创建页面
import { exportToPDF, exportToPDFPrint, generatePDFFilename } from '../../utils/pdfExport'; // 🔥 PDF导出工具
import {
  useQuoteRequirements,
  type QuoteRequirement,
  type QuoteRequirementFeedback as PurchaserFeedback,
} from '../../contexts/QuoteRequirementContext'; // 🔥 QR Context（沿用现有类型名以保持本文件稳定）
import { usePurchaseOrders, PurchaseOrder as PurchaseOrderType, PurchaseOrderItem } from '../../contexts/PurchaseOrderContext'; // 🔥 采购订单Context
import { useSalesContracts } from '../../contexts/SalesContractContext'; // Phase 3c: SC production mirror
import { useXJs, XJ, XJProduct } from '../../contexts/XJContext'; // 🔥 XJ Context
import { useQuotations } from '../../contexts/QuotationContext'; // 🔥 报价Context（用于保存业务员报价）
import { useInquiry } from '../../contexts/InquiryContext';
import { PurchaserFeedbackForm } from './PurchaserFeedbackForm'; // 🔥 智能采购反馈表单
import { useUser } from '../../contexts/UserContext'; // 🔥 用户Context
import { useApproval } from '../../contexts/ApprovalContext';
import { generateXJNumber, nextXJNumber } from '../../utils/xjNumberGenerator'; // 🔥 XJ编号生成器
import { generateCGNumber, nextCGNumberAsync, normalizeCGNumberForDisplay } from '../../utils/purchaseOrderNumberGenerator';
import { contractService, supplierQuotationService, companyService, toUUID } from '../../lib/supabaseService';
import { TERMS_OPTIONS } from './purchase-order/purchaseOrderConstants'; // 🔥 从常量文件导入
import { PurchaseOrderEditDialog } from './purchase-order/PurchaseOrderEditDialog';
import { PurchaseOrderCreateDialogs } from './purchase-order/PurchaseOrderCreateDialogs';
import { EditXJDialog } from './purchase-order/EditXJDialog';
import { XJPreviewDialog } from './purchase-order/XJPreviewDialog';
import { SupplierQuotationDialog } from './purchase-order/SupplierQuotationDialog';
import { CreateXJAndHistoryDialogs } from './purchase-order/CreateXJAndHistoryDialogs';
import { PurchaseOrdersTab } from './purchase-order/PurchaseOrdersTab';
import { ProcurementRequestsTab } from './purchase-order/ProcurementRequestsTab';
import { FeedbackReminderDialog } from './purchase-order/FeedbackReminderDialog';
import { QuoteRequirementsTab } from './purchase-order/QuoteRequirementsTab';
import { XJManagementTab } from './purchase-order/XJManagementTab';
import { SupplierQuotationsTab } from './purchase-order/SupplierQuotationsTab';
import { SupplierAllocationDialog } from './purchase-order/SupplierAllocationDialog';
import { PurchaseOrderDetailDialog } from './purchase-order/PurchaseOrderDetailDialog';
import { PurchaseOrderPreviewDialog } from './purchase-order/PurchaseOrderPreviewDialog';
import { QuoteRequirementPreviewDialog } from './purchase-order/QuoteRequirementPreviewDialog';
import { EditQuoteRequirementDialog } from './purchase-order/EditQuoteRequirementDialog';
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
  buildPurchaseOrderDocumentSnapshot,
  buildQuoteRequirementDocumentSnapshot,
  buildXJDocumentSnapshot,
  convertToPOData,
  desensitizeFeedback,
  extractProjectExecutionBaseline,
  generateXJDocumentData,
  // Pass A extractions
  calculateRequirementStatus,
  getXJKey,
  getQuotationXJKey,
  getProcurementRequestStatusText,
  parseDateLike,
  formatDateForStorage,
  toNumericAmount,
  getQuotationItems,
} from './purchase-order/purchaseOrderUtils'; // 🔥 从工具函数文件导入
import {
  findRelatedInquiryForProcurementDoc,
  hydrateProcurementRequirementWithInquiry,
} from '../../utils/procurementRequestContext';
import { buildProcurementConditionGroups } from '../../utils/procurementRequestContext';
import { adaptLegacyQuotationToDocumentData } from '../../utils/documentDataAdapters';
import { saveSupplierQuotation } from '../../utils/createQuotationFromXJ';
import { addTombstones, filterNotDeleted, listTombstones, removeTombstones } from '../../lib/erp-core/deletion-tombstone';
import { getFormalBusinessModelNo } from '../../utils/productModelDisplay';
import { resolveQuoteRequirementOwner } from '../../utils/quotationOwnership';
import { buildSourcePricingBasis, normalizePriceType } from '../../types/pricingBasis';
import { derivePurchaseOrderWorkflowFields } from '../../lib/services/purchaseOrderQuoteRequirementServices';

/**
 * 🔥 采购订单管理 - 台湾大厂风格
 * 与供应商管理保持一致的UI设计
 */

// 🔥 采购订单类型已从PurchaseOrderContext导入，不再在此定义
// 🔥 TERMS_OPTIONS已从purchase-order/purchaseOrderConstants.ts导入，不再在此定义
// UI 缓存键：审批请求在切页时的即时通知缓存，业务数据已写入 Supabase approval_records 表
// 此 localStorage 仅用于减少切页空窗，可安全删除（不影响 Supabase 中的审批数据）

const PurchaseOrderManagementEnhanced: React.FC = () => {
  const toLegacyProcurementRequestStatus = React.useCallback((status: string) => {
    if (status === 'pending_assignment') return 'pending_procurement_assignment';
    if (status === 'partially_allocated') return 'partial_allocated';
    if (status === 'fully_allocated') return 'allocated_completed';
    return status;
  }, []);
  
  // 🔥 使用 QR Context - 底层仍复用当前主承载表
  const { requirements, updateRequirement, deleteRequirement, refreshQuoteRequirementsFromApi } = useQuoteRequirements();
  const { inquiries } = useInquiry();
  // 🔥 使用采购订单Context
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } = usePurchaseOrders();
  // Phase 3c: SC production mirror — advanceSCToProduction is called after all CGs are pushed_supplier
  const { advanceSCToProduction } = useSalesContracts();
  // 🔥 使用XJ Context - 获取rfqs列表用于计算状态
  const { xjs, addXJ, updateXJ, deleteXJ } = useXJs();
  // 🔥 使用报价Context - 用于保存业务员创建的报价单
  const { addQuotation } = useQuotations();
  // 🔥 用户Context - 获取当前用户信息
  const { user } = useUser();
  const { requests: approvalRequests, addApprovalRequest, updateApprovalRequest } = useApproval();
  const isProcurementRequestRecord = React.useCallback((po: PurchaseOrderType) => {
    const workflow = derivePurchaseOrderWorkflowFields(po);
    const reqStatus = String(po.procurementRequestStatus || '').trim();
    const poNo = String(po.poNumber || '').trim().toUpperCase();
    return workflow.documentType === 'PR' || reqStatus === 'pending_procurement_assignment' || poNo.startsWith('CQ-') || poNo.startsWith('PR-');
  }, []);
  const requestPurchaseOrders = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('purchaseOrdersUpdated'));
  }, []);
  const enrichPurchaserFeedbackWithSupplierQuoteData = React.useCallback(
    async (req: QuoteRequirement): Promise<PurchaserFeedback | undefined> => {
      const feedback = req.purchaserFeedback;
      const normalizeComparable = (value: unknown) =>
        String(value || '')
          .trim()
          .replace(/\s+/g, ' ')
          .toLowerCase();
      const toPositiveNumberOrNull = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
      };

      const allQuotations = await supplierQuotationService.getAll();
      const allRows = Array.isArray(allQuotations) ? allQuotations : [];
      const linkedBJList = String(feedback?.linkedBJ || '')
        .split(/[\n,，、;；]+/)
        .map((item) => item.trim())
        .filter(Boolean);
      const requirementNo = String(req.requirementNo || '').trim();
      const sourceInquiryNo = String(req.sourceInquiryNumber || req.sourceRef || '').trim();
      const linkedRows = allRows.filter((quotation: any) =>
        linkedBJList.includes(String(quotation?.quotationNo || quotation?.bjNumber || '').trim()),
      );
      const relatedRows = linkedRows.length > 0
        ? linkedRows
        : allRows.filter((quotation: any) => {
            const quotationNo = String(quotation?.quotationNo || quotation?.bjNumber || '').trim();
            const qrNo = String(quotation?.sourceQR || quotation?.requirementNo || '').trim();
            const xjNo = String(quotation?.sourceXJ || quotation?.xjNumber || '').trim();
            return Boolean(
              (requirementNo && qrNo === requirementNo) ||
              (linkedBJList.length > 0 && linkedBJList.includes(quotationNo)) ||
              (sourceInquiryNo && xjNo === sourceInquiryNo)
            );
          });

      if (relatedRows.length === 0) {
        return feedback;
      }

      const bjItems = relatedRows.flatMap((quotation: any) => {
        const snapshotProducts = Array.isArray(quotation?.documentDataSnapshot?.products)
          ? quotation.documentDataSnapshot.products
          : Array.isArray(quotation?.document_data_snapshot?.products)
            ? quotation.document_data_snapshot.products
            : [];
        const rowItems = Array.isArray(quotation?.items) ? quotation.items : [];
        const sourceItems = snapshotProducts.length > 0 ? snapshotProducts : rowItems;
        return sourceItems.map((item: any, index: number) => {
          const fallbackRowItem = rowItems[index] || null;
          return {
            ...fallbackRowItem,
            ...item,
            productId: item?.productId || item?.id || fallbackRowItem?.productId || fallbackRowItem?.id,
            productName:
              item?.productName ||
              item?.name ||
              item?.description ||
              item?.product ||
              fallbackRowItem?.productName ||
              fallbackRowItem?.name ||
              fallbackRowItem?.description,
            modelNo:
              item?.modelNo ||
              item?.model ||
              item?.sku ||
              fallbackRowItem?.modelNo ||
              fallbackRowItem?.model ||
              fallbackRowItem?.sku,
            quantity: item?.quantity ?? fallbackRowItem?.quantity,
            unitPrice:
              item?.unitPrice ??
              item?.price ??
              item?.quotedPrice ??
              item?.supplierPrice ??
              fallbackRowItem?.unitPrice ??
              fallbackRowItem?.price,
            amount:
              item?.amount ??
              item?.totalPrice ??
              item?.lineAmount ??
              item?.totalAmount ??
              fallbackRowItem?.amount ??
              fallbackRowItem?.totalPrice ??
              fallbackRowItem?.lineAmount,
            currency:
              item?.currency ||
              item?.quoteCurrency ||
              fallbackRowItem?.currency ||
              fallbackRowItem?.quoteCurrency ||
              quotation?.currency ||
              'CNY',
            quoteMode: item?.quoteMode || fallbackRowItem?.quoteMode || quotation?.quoteMode,
            taxSettings: item?.taxSettings || fallbackRowItem?.taxSettings || quotation?.taxSettings || null,
          };
        });
      });

      const buildFallbackRemarks = (products: Array<{ amount?: number; currency?: string; leadTime?: string }>) => {
        const totalCost = products.reduce((sum, product) => sum + Number(product.amount || 0), 0);
        const avgLeadDays = products
          .map((product) => Number(String(product.leadTime || '').replace(/[^\d.]/g, '')))
          .filter((value) => Number.isFinite(value) && value > 0);
        const avgLeadTime = avgLeadDays.length > 0
          ? Math.round(avgLeadDays.reduce((sum, value) => sum + value, 0) / avgLeadDays.length)
          : null;
        const fallbackCurrency = products[0]?.currency || 'CNY';

        return [
          `已根据关联供应商报价自动汇总 ${products.length} 个产品的采购成本。`,
          `当前汇总成本：${fallbackCurrency} ${totalCost.toLocaleString()}`,
          avgLeadTime ? `平均交期约 ${avgLeadTime} 天。` : null,
          '本次为系统自动回填采购反馈，如需补充议价判断、风险说明或报价策略，请由采购员进一步完善。',
        ].filter(Boolean).join('\n');
      };

      if (!feedback || !Array.isArray(feedback.products) || feedback.products.length === 0) {
        const fallbackProducts = (Array.isArray(req.items) ? req.items : []).map((item: any, index: number) => {
          const matched = bjItems.find((bjItem: any, bjIndex: number) => {
            if (bjIndex === index) return true;
            const sameId =
              normalizeComparable(bjItem?.productId) &&
              normalizeComparable(bjItem?.productId) === normalizeComparable(item?.id);
            const sameModel =
              normalizeComparable(bjItem?.modelNo) &&
              normalizeComparable(bjItem?.modelNo) === normalizeComparable(item?.modelNo);
            const sameName =
              normalizeComparable(bjItem?.productName) &&
              normalizeComparable(bjItem?.productName) === normalizeComparable(item?.productName);
            return Boolean(sameId || sameModel || sameName);
          }) || bjItems[index] || null;

          const quantity = Number(matched?.quantity ?? item?.quantity ?? 0);
          const unitPrice = toPositiveNumberOrNull(matched?.unitPrice);
          const amount =
            toPositiveNumberOrNull(matched?.amount) ??
            (unitPrice != null && quantity > 0 ? unitPrice * quantity : 0);
          const currency = String(matched?.currency || 'CNY').toUpperCase();

          return {
            productId: String(item?.id || matched?.productId || `qr-item-${index + 1}`),
            productName: String(matched?.productName || item?.productName || item?.name || item?.description || ''),
            specification: String(item?.specification || item?.spec || ''),
            quantity,
            unit: String(item?.unit || item?.uom || 'pcs'),
            costPrice: unitPrice ?? 0,
            currency,
            sourcePricing: unitPrice != null
              ? buildSourcePricingBasis({
                  unitPrice,
                  currency,
                  priceType: normalizePriceType(undefined, currency),
                  deliveryTerms: relatedRows[0]?.deliveryTerms,
                  quoteMode: matched?.quoteMode || relatedRows[0]?.quoteMode,
                  sourceDocumentNo: relatedRows[0]?.quotationNo || relatedRows[0]?.bjNumber,
                  supplierQuotationNo: relatedRows[0]?.quotationNo || relatedRows[0]?.bjNumber,
                  taxSettings: matched?.taxSettings || relatedRows[0]?.taxSettings || null,
                })
              : undefined,
            amount,
            moq: matched?.moq,
            leadTime: matched?.leadTime != null ? `${matched.leadTime}天` : undefined,
            remarks: String(item?.remarks || ''),
          };
        });
        const fallbackRemarks = buildFallbackRemarks(fallbackProducts);

        return {
          status: 'quoted',
          feedbackDate: new Date().toISOString().split('T')[0],
          feedbackBy: '采购部',
          linkedBJ: relatedRows
            .map((quotation: any) => String(quotation?.quotationNo || quotation?.bjNumber || '').trim())
            .filter(Boolean)
            .join(', '),
          linkedSupplier: relatedRows
            .map((quotation: any) => String(quotation?.supplierName || quotation?.supplierCompany || '').trim())
            .filter(Boolean)
            .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
            .join(', '),
          linkedXJ: relatedRows
            .map((quotation: any) => String(quotation?.sourceXJ || quotation?.xjNumber || '').trim())
            .filter(Boolean)
            .filter((value: string, index: number, arr: string[]) => arr.indexOf(value) === index)
            .join(', '),
          products: fallbackProducts,
          paymentTerms: relatedRows[0]?.paymentTerms || undefined,
          deliveryTerms: relatedRows[0]?.deliveryTerms || undefined,
          packaging: undefined,
          warranty: relatedRows[0]?.warrantyTerms || undefined,
          purchaserRemarks: fallbackRemarks,
          suggestedMargin: 30,
          riskLevel: 'medium',
        };
      }

      const enrichedProducts = feedback.products.map((product: any, index: number) => {
        const sourceItem = Array.isArray(req.items) ? req.items[index] : null;
        const matched = bjItems.find((item: any, bjIndex: number) => {
          if (bjIndex === index) return true;
          const sameId =
            normalizeComparable(item?.productId) &&
            (
              normalizeComparable(item?.productId) === normalizeComparable(product?.productId) ||
              normalizeComparable(item?.productId) === normalizeComparable(sourceItem?.id)
            );
          const sameModel =
            normalizeComparable(item?.modelNo) &&
            (
              normalizeComparable(item?.modelNo) === normalizeComparable((product as any)?.modelNo || (product as any)?.productModelNo) ||
              normalizeComparable(item?.modelNo) === normalizeComparable(sourceItem?.modelNo)
            );
          const sameName =
            normalizeComparable(item?.productName) &&
            (
              normalizeComparable(item?.productName) === normalizeComparable(product?.productName) ||
              normalizeComparable(item?.productName) === normalizeComparable(sourceItem?.productName)
            );
          return Boolean(sameId || sameModel || sameName);
        }) || bjItems[index] || null;

        if (!matched) return product;

        const quantity = Number(product?.quantity || matched?.quantity || sourceItem?.quantity || 0);
        const unitPrice = toPositiveNumberOrNull(matched?.unitPrice) ?? toPositiveNumberOrNull(product?.costPrice);
        const amount =
          toPositiveNumberOrNull(matched?.amount) ??
          (unitPrice != null && quantity > 0 ? unitPrice * quantity : product?.amount);

        return {
          ...product,
          costPrice: unitPrice ?? product.costPrice,
          amount: amount ?? product.amount,
          currency: String(
            matched?.currency ||
            product?.sourcePricing?.currency ||
            product?.currency ||
            'CNY',
          ).toUpperCase(),
          sourcePricing: {
            ...(product?.sourcePricing || {}),
            unitPrice: unitPrice ?? product?.sourcePricing?.unitPrice,
            currency: String(
              matched?.currency ||
              product?.sourcePricing?.currency ||
              product?.currency ||
              'CNY',
            ).toUpperCase(),
          },
        };
      });

      const fallbackRemarks = buildFallbackRemarks(enrichedProducts);

      return {
        ...feedback,
        products: enrichedProducts,
        purchaserRemarks: String(feedback.purchaserRemarks || '').trim() || fallbackRemarks,
        suggestedMargin: Number.isFinite(Number(feedback.suggestedMargin)) ? Number(feedback.suggestedMargin) : 30,
        riskLevel: feedback.riskLevel || 'medium',
      };
    },
    [],
  );
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
  const [viewRequirement, setViewRequirement] = useState<QuoteRequirement | null>(null);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  
  // 🔥 智能报价创建对话框状态
  const [showQuoteCreation, setShowQuoteCreation] = useState(false);
  const [selectedRequirementForQuote, setSelectedRequirementForQuote] = useState<QuoteRequirement | null>(null);
  
  // 🔥 创建采购订单对话框状态
  const [showCreateOrderDialog, setShowCreateOrderDialog] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<QuoteRequirement | null>(null);
  const [createOrderForm, setCreateOrderForm] = useState(createInitialCreateOrderForm);
  const [showEditPODialog, setShowEditPODialog] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrderType | null>(null);
  const [editPOForm, setEditPOForm] = useState<EditPOFormState>(createInitialEditPOForm);
  const [editPOItems, setEditPOItems] = useState<PurchaseOrderItem[]>([]);
  const editPOFormRef = React.useRef<EditPOFormState>(createInitialEditPOForm());
  const editPOItemsRef = React.useRef<PurchaseOrderItem[]>([]);
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
  
  // 🔥 创建XJ对话框状态
  const [showCreateXJDialog, setShowCreateXJDialog] = useState(false);
  const [selectedRequirementForXJ, setSelectedRequirementForXJ] = useState<QuoteRequirement | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [xjDeadline, setXJDeadline] = useState<Date | undefined>(undefined);
  const [xjRemarks, setXJRemarks] = useState('');

  useEffect(() => {
    editPOFormRef.current = editPOForm;
  }, [editPOForm]);

  useEffect(() => {
    editPOItemsRef.current = editPOItems;
  }, [editPOItems]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]); // 🔥 选中的产品ID（统一用 string）
  const [submittingXJ, setSubmittingXJ] = useState(false);
  
  // 🔥 询价历史弹窗状态
  const [showXJHistoryDialog, setShowXJHistoryDialog] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);
  
  // 🔥 询价单预览状态
  const [showXJPreview, setShowXJPreview] = useState(false);
  const [currentXJData, setCurrentXJData] = useState<XJData | null>(null);
  const [currentXJBaseline, setCurrentXJBaseline] = useState<any>(null);
  const xjDocRef = React.useRef<HTMLDivElement>(null);
  
  // 🔥 询价单编辑状态
  const [showEditXJDialog, setShowEditXJDialog] = useState(false);
  const [editingXJ, setEditingXJ] = useState<XJ | null>(null);
  const [editXJData, setEditXJData] = useState<any>(null); // 完整的documentData
  
  // 🔥 询价管理 - 搜索和批量删除状态
  const [xjSearchTerm, setXJSearchTerm] = useState('');
  const [selectedXJIds, setSelectedXJIds] = useState<string[]>([]);

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
  const [feedbackRequirement, setFeedbackRequirement] = useState<QuoteRequirement | null>(null);
  const [showEditRequirementDialog, setShowEditRequirementDialog] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<QuoteRequirement | null>(null);
  const [savingRequirementEdit, setSavingRequirementEdit] = useState(false);

  // 🔥 采购需求数据 - 从Context获取
  const purchaseRequirements = useMemo(
    () =>
      requirements.map((req) => {
        const relatedInquiry = findRelatedInquiryForProcurementDoc(req, inquiries);
        return hydrateProcurementRequirementWithInquiry(req, relatedInquiry);
      }),
    [requirements, inquiries],
  );

  useEffect(() => {
    const staleRequirements = purchaseRequirements.filter((req) => {
      if (!req.pushedToQuotation) return false;
      const hasPushEvidence = Boolean(
        String(req.pushedToQuotationDate || '').trim() ||
        String(req.pushedBy || '').trim() ||
        String((req as any).quotationNumber || '').trim(),
      );
      const feedbackProducts = Array.isArray(req.purchaserFeedback?.products)
        ? req.purchaserFeedback.products
        : [];
      const hasFeedbackPricing = feedbackProducts.some((product: any) => {
        const unitPrice = Number(product?.sourcePricing?.unitPrice ?? product?.costPrice ?? 0);
        const amount = Number(product?.amount ?? 0);
        return (Number.isFinite(unitPrice) && unitPrice > 0) || (Number.isFinite(amount) && amount > 0);
      });
      return !hasPushEvidence || !hasFeedbackPricing;
    });
    if (!staleRequirements.length) return;

    let cancelled = false;
    const reconcileStalePushFlags = async () => {
      for (const req of staleRequirements) {
        if (cancelled) return;
        await updateRequirement(req.id, {
          pushedToQuotation: false,
          pushedToQuotationDate: null,
          pushedBy: null,
          quotationNumber: null,
        } as any).catch((error: any) => {
          console.warn('⚠️ [PurchaseOrderMgmt] clear stale pushedToQuotation failed:', error?.message || error);
        });
      }
    };

    void reconcileStalePushFlags();
    return () => {
      cancelled = true;
    };
  }, [purchaseRequirements, updateRequirement]);

  // 🔥 供应商报价数据 - Supabase-first
  const [supplierQuotations, setSupplierQuotations] = useState<any[]>([]);
  const [selectedSupplierQuotation, setSelectedSupplierQuotation] = useState<any>(null);
  const [showSupplierQuotationDialog, setShowSupplierQuotationDialog] = useState(false);
  const [showFeedbackReminderDialog, setShowFeedbackReminderDialog] = useState(false);
  const [acceptedQuotationNo, setAcceptedQuotationNo] = useState<string>('');
  const [acceptedSupplierQuotation, setAcceptedSupplierQuotation] = useState<any>(null);
  const [salesContractsLite, setSalesContractsLite] = useState<any[]>([]);
  const getQuotationMarkers = React.useCallback((q: any) => {
    return [
      q?.id,
      q?.quotationNo,
      q?.quotationNumber,
      q?.bjNumber,
      q?.displayNumber,
    ].filter(Boolean).map((v) => String(v));
  }, []);

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
  
  // calculateRequirementStatus, getXJKey, getQuotationXJKey → purchaseOrderUtils (Pass A)

  const hasDownstreamQuotationForXJ = React.useCallback((xj: any, quotationList?: any[]) => {
    const key = getXJKey(xj);
    if (!key) return false;
    const list = Array.isArray(quotationList) ? quotationList : supplierQuotations;
    return list.some((q: any) => getQuotationXJKey(q) === key);
  }, [supplierQuotations]);

  const hasDownstreamXJForRequirement = React.useCallback((req: QuoteRequirement, xjList?: XJ[]) => {
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
      const nextStatus: QuoteRequirement['status'] = activeXJCount > 0 ? 'processing' : 'pending';
      if ((req.status as any) !== nextStatus) {
        void updateRequirement(req.id, { status: nextStatus }).catch((error: any) => {
          console.warn('⚠️ [PurchaseOrderMgmt] recomputeRequirementStatusByXJ failed:', error?.message || error);
        });
      }
    });
  }, [requirements, updateRequirement, xjs]);

  const findRequirementForSupplierQuotation = React.useCallback((quotation: any): QuoteRequirement | undefined => {
    if (!quotation) return undefined;

    const quotedRequirementNo = String(
      quotation?.sourceQR ||
      quotation?.requirementNo ||
      quotation?.source_qr_number ||
      ''
    ).trim();
    if (quotedRequirementNo) {
      const byRequirementNo = requirements.find((req) => String(req.requirementNo || '').trim() === quotedRequirementNo);
      if (byRequirementNo) return byRequirementNo;
    }

    const quotedXJNo = String(
      quotation?.sourceXJ ||
      quotation?.sourceXJNumber ||
      quotation?.xjNumber ||
      ''
    ).trim();
    if (!quotedXJNo) return undefined;

    const relatedXJ = xjs.find((xj) => {
      const supplierXjNo = String(xj?.supplierXjNo || '').trim();
      const xjNumber = String(xj?.xjNumber || '').trim();
      return quotedXJNo === supplierXjNo || quotedXJNo === xjNumber;
    });
    if (!relatedXJ) return undefined;

    const xjRequirementNo = String(relatedXJ.requirementNo || relatedXJ.sourceQRNumber || '').trim();
    if (!xjRequirementNo) return undefined;
    return requirements.find((req) => String(req.requirementNo || '').trim() === xjRequirementNo);
  }, [requirements, xjs]);

  const navigateAcceptedQuotationToFeedback = React.useCallback(() => {
    setShowFeedbackReminderDialog(false);
    setActiveTab('requirements');

    const matchedRequirement = findRequirementForSupplierQuotation(acceptedSupplierQuotation || selectedSupplierQuotation);
    if (!matchedRequirement) {
      toast.error('未找到该 BJ 对应的询价要求单，请先检查 BJ 与 QR/XJ 的关联编号');
      return;
    }
    if (!ensureBoundQuoteRequirementSnapshot(matchedRequirement)) return;

    setFeedbackRequirement(matchedRequirement);
    setShowFeedbackForm(true);
  }, [acceptedSupplierQuotation, findRequirementForSupplierQuotation, selectedSupplierQuotation]);
  
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
      const tombstones = listTombstones('qt');

      const revivedMarkers = new Set<string>();
      apiList.forEach((q: any) => {
        const rowUpdatedAt = Date.parse(String(q?.updatedAt || q?.createdAt || ''));
        if (!Number.isFinite(rowUpdatedAt)) return;
        getQuotationMarkers(q).forEach((marker) => {
          const tombstone = tombstones.find((item) => item.marker === String(marker));
          if (!tombstone) return;
          const hiddenAt = Date.parse(String(tombstone.deletedAt || ''));
          if (Number.isFinite(hiddenAt) && rowUpdatedAt > hiddenAt) {
            revivedMarkers.add(String(marker));
          }
        });
      });

      if (revivedMarkers.size > 0) {
        removeTombstones((t) => t.domain === 'qt' && revivedMarkers.has(String(t.marker)));
      }

      const visibleList = filterNotDeleted('qt', apiList, (q: any) => getQuotationMarkers(q));
      setSupplierQuotations(visibleList);
    } catch (e: any) {
      console.warn('⚠️ [loadSupplierQuotations] Supabase 读取失败:', e?.message);
      setSupplierQuotations([]);
    }
  }, [getQuotationMarkers]);

  // Apply status change to local state after Supabase success
  const applyLocalQuotationStatus = React.useCallback((id: string, status: 'accepted' | 'rejected') => {
    setSupplierQuotations((prev) =>
      prev.map((q: any) => (q.id === id ? { ...q, status } : q)),
    );
  }, []);

  const handleAcceptSupplierQuotation = React.useCallback(async () => {
    if (!selectedSupplierQuotation) return;
    const qid = selectedSupplierQuotation.id;
    const acceptedQuotation = { ...selectedSupplierQuotation, status: 'accepted' };
    try {
      await saveSupplierQuotation(acceptedQuotation as any);
    } catch (e: any) {
      console.warn('⚠️ 接受报价 Supabase 同步失败:', e?.message);
      toast.error('接受报价失败：Supabase 写入未成功');
      return;
    }
    applyLocalQuotationStatus(qid, 'accepted');
    await loadSupplierQuotationsFromApi();
    setShowSupplierQuotationDialog(false);
    setAcceptedQuotationNo(selectedSupplierQuotation.quotationNo || qid);
    setAcceptedSupplierQuotation(acceptedQuotation);
    setShowFeedbackReminderDialog(true);
  }, [selectedSupplierQuotation, applyLocalQuotationStatus, loadSupplierQuotationsFromApi]);

  const handleRejectSupplierQuotation = React.useCallback(async () => {
    if (!selectedSupplierQuotation) return;
    const qid = selectedSupplierQuotation.id;
    try {
      await saveSupplierQuotation({ ...selectedSupplierQuotation, status: 'rejected' } as any);
    } catch (e: any) {
      console.warn('⚠️ 拒绝报价 Supabase 同步失败:', e?.message);
      toast.error('拒绝报价失败：Supabase 写入未成功');
      return;
    }
    applyLocalQuotationStatus(qid, 'rejected');
    await loadSupplierQuotationsFromApi();
    setShowSupplierQuotationDialog(false);
    toast.info(
      <div className="space-y-1">
        <p className="font-semibold">❌ 已拒绝报价</p>
        <p className="text-sm">报价单号: {selectedSupplierQuotation.quotationNo}</p>
        <p className="text-xs text-gray-500">状态已更新</p>
      </div>,
    );
  }, [selectedSupplierQuotation, applyLocalQuotationStatus, loadSupplierQuotationsFromApi]);

  React.useEffect(() => {
    void loadSupplierQuotationsFromApi();
    const interval = setInterval(loadSupplierQuotationsFromApi, activeTab === 'supplier-quotations' ? 10000 : 30000);
    return () => clearInterval(interval);
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
      String(order.xjNumber || '').toLowerCase().includes(keyword) ||
      String(order.sourceRef || '').toLowerCase().includes(keyword) ||
      String(order.requirementNo || (order as any).requirementNumber || '').toLowerCase().includes(keyword) ||
      order.supplierName?.toLowerCase().includes(keyword) ||
      order.supplierCode?.toLowerCase().includes(keyword)
    );
  }, [purchaseOrders, procurementRequestSearchTerm, isProcurementRequestRecord]);

  const getProcurementChildOrders = React.useCallback((po: PurchaseOrderType) => {
    const workflow = derivePurchaseOrderWorkflowFields(po);
    const parentNo = String(po.poNumber || '').trim().toUpperCase();
    if (workflow.documentType !== 'PR' && !parentNo.startsWith('CQ-') && !parentNo.startsWith('PR-')) {
      return [] as PurchaseOrderType[];
    }
    return purchaseOrders.filter((child) => {
      const childNo = String(child.poNumber || '').trim().toUpperCase();
      const parent = String(child.parentRequestPoNumber || '').trim().toUpperCase();
      return !!parent && parent === parentNo && !childNo.startsWith('CQ-');
    });
  }, [purchaseOrders]);

  const hasDownstreamPOForProcurementRequest = React.useCallback((po: PurchaseOrderType) => {
    if (!isProcurementRequestRecord(po)) return false;
    return getProcurementChildOrders(po).length > 0;
  }, [getProcurementChildOrders, isProcurementRequestRecord]);

  const getProcurementRequestRuntimeStatus = React.useCallback((po: PurchaseOrderType) => {
    const workflow = derivePurchaseOrderWorkflowFields(po);
    if (workflow.documentType === 'PR') {
      if (workflow.executionStatus === 'fully_allocated') return 'fully_allocated';
      if (workflow.executionStatus === 'partially_allocated') return 'partially_allocated';
      if (workflow.executionStatus === 'pending_assignment') return 'pending_assignment';
    }

    const requestItems = po.items || [];
    const children = getProcurementChildOrders(po);
    if (children.length === 0) return 'pending_assignment';
    if (requestItems.length === 0) return 'partially_allocated';

    const isMatched = (reqItem: any) => {
      const reqId = String(reqItem?.id || '').trim();
      const reqModel = String(getFormalBusinessModelNo(reqItem) || '').trim().toLowerCase();
      const reqName = String(reqItem?.productName || '').trim().toLowerCase();
      return children.some((child) =>
        (child.items || []).some((childItem: any) => {
          const sameId = reqId && String(childItem?.id || '').trim() === reqId;
          const sameModel = reqModel && String(getFormalBusinessModelNo(childItem) || '').trim().toLowerCase() === reqModel;
          const sameName = reqName && String(childItem?.productName || '').trim().toLowerCase() === reqName;
          return sameId || sameModel || sameName;
        })
      );
    };

    const matchedCount = requestItems.filter((item) => isMatched(item)).length;
    if (matchedCount >= requestItems.length) return 'fully_allocated';
    if (matchedCount > 0) return 'partially_allocated';
    return 'pending_assignment';
  }, [getProcurementChildOrders]);

  // getProcurementRequestStatusText → purchaseOrderUtils (Pass A)

  const pendingProcurementRequestCount = useMemo(() => {
    const requests = purchaseOrders.filter((po) => isProcurementRequestRecord(po));
    return requests.filter((po) => getProcurementRequestRuntimeStatus(po) !== 'fully_allocated').length;
  }, [purchaseOrders, isProcurementRequestRecord, getProcurementRequestRuntimeStatus]);

  // 采购请求状态自动随分配结果变化（包括下游CG被删除后自动恢复可分配）
  useEffect(() => {
    const requests = purchaseOrders.filter((po) => isProcurementRequestRecord(po));
    const syncStatuses = async () => {
      for (const po of requests) {
        const runtimeStatus = getProcurementRequestRuntimeStatus(po);
        const persisted = String(po.procurementRequestStatus || '').trim();
        const legacyRuntimeStatus = toLegacyProcurementRequestStatus(runtimeStatus);
        if (persisted === legacyRuntimeStatus) continue;
        try {
          await updatePurchaseOrder(po.id, { procurementRequestStatus: legacyRuntimeStatus } as any);
        } catch (error: any) {
          console.warn('⚠️ [PurchaseOrderMgmt] procurementRequestStatus sync failed:', error?.message || error);
        }
      }
    };
    void syncStatuses();
  }, [purchaseOrders, isProcurementRequestRecord, getProcurementRequestRuntimeStatus, toLegacyProcurementRequestStatus, updatePurchaseOrder]);

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
    const recoverMissingProcurementRequests = async () => {
      const recoveryTasks: Promise<void>[] = [];
      purchaseRequirements.forEach((req) => {
      const note = String(req.specialRequirements || '');
      const match = note.match(/采购单号[:：]\s*(CQ-\d{6}-\d{4})/i);
      if (!match) return;

      const cqNo = String(match[1] || '').trim().toUpperCase();
      if (!cqNo || existingByPo.has(cqNo)) return;

      const requirementNo = String(req.requirementNo || '').trim();
        const inferredRfq = String(req.sourceInquiryNumber || '').trim();
        const recoveredItems = Array.isArray(req.items)
          ? req.items.map((item: any, idx: number) => ({
              id: String(item?.id || `item-${idx + 1}`),
              productName: String(item?.productName || 'Unknown Product'),
              modelNo: getFormalBusinessModelNo(item) || String(item?.productName || '-'),
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

        const recoveredOrder = {
          id: `recovered-${cqNo.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          poNumber: cqNo,
          documentType: 'PR',
          executionStatus: 'pending_assignment',
          approvalStatus: 'not_required',
          requirementNo,
        sourceRef: inferredRfq || String(req.sourceRef || '').trim(),
        sourceSONumber: String(req.salesOrderNo || req.sourceRef || '').trim(),
        salesContractNumber: String(req.sourceRef || '').trim(),
          xjNumber: inferredRfq,
          supplierName: '待采购分配',
          supplierCode: 'TBD',
          region: String(req.region || 'NA'),
          items: recoveredItems,
          totalAmount: 0,
          currency: recoveredCurrency,
        paymentTerms: '待采购确认',
        deliveryTerms: '待采购确认',
        orderDate: String(req.createdDate || new Date().toISOString()),
        expectedDate: String(req.requiredDate || new Date().toISOString()),
        status: 'pending',
        paymentStatus: 'unpaid',
        remarks: note || '系统自动回填采购请求',
        createdBy: String(req.createdBy || 'system'),
        createdDate: String(req.createdDate || new Date().toISOString()),
        updatedDate: new Date().toISOString(),
        procurementRequestStatus: 'pending_procurement_assignment',
        } as any;
        recoveredOrder.templateSnapshot = { pendingResolution: true };
        recoveredOrder.documentRenderMeta = null;
        recoveredOrder.documentDataSnapshot = buildPurchaseOrderDocumentSnapshot(recoveredOrder);
        recoveryTasks.push(
          addPurchaseOrder(recoveredOrder).catch((error: any) => {
            console.warn('⚠️ [PurchaseOrderMgmt] recovered purchase request sync failed:', error?.message || error);
            toast.error('自动补回采购请求失败', {
              description: error?.message || 'Supabase 写入失败',
              duration: 5000,
            });
          })
        );
      });

      await Promise.all(recoveryTasks);
    };

    void recoverMissingProcurementRequests();
  }, [purchaseRequirements, purchaseOrders, addPurchaseOrder]);

  const requirementByNo = useMemo(() => {
    const byNo = new Map<string, QuoteRequirement>();
    purchaseRequirements.forEach((req) => {
      if (req.requirementNo) byNo.set(req.requirementNo, req);
    });
    return byNo;
  }, [purchaseRequirements]);

  const getRequirementNoFromPO = (po: PurchaseOrderType): string => {
    return String(po.requirementNo || (po as any).requirementNumber || '').trim();
  };

  // parseDateLike, formatDateForStorage, toNumericAmount, getQuotationItems → purchaseOrderUtils (Pass A)

  const findRequirementForPO = (po: PurchaseOrderType): QuoteRequirement | undefined => {
    const requirementNo = getRequirementNoFromPO(po);
    if (requirementNo && requirementByNo.has(requirementNo)) {
      return requirementByNo.get(requirementNo);
    }
    const refs = [
      String(po.salesContractNumber || '').trim(),
      String(po.sourceSONumber || '').trim(),
      String(po.sourceRef || '').trim(),
      String(po.quotationNumber || '').trim(),
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
    return candidate.startsWith('ING-') ? candidate : '';
  };

  const getInquiryByContractRef = (po: PurchaseOrderType): string => {
    const refs = [
      String(po.sourceSONumber || '').trim(),
      String(po.salesContractNumber || '').trim(),
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
    return inquiryNo.startsWith('ING-') ? inquiryNo : '';
  };

  const resolveInquirySourceRef = (po: PurchaseOrderType): string => {
    const requirementNo = getRequirementNoFromPO(po);
    const matchedRequirement = findRequirementForPO(po);
    const xjFromRequirement = requirementNo ? getXJNumberByRequirementNo(requirementNo) : '';
    const poRfqRef = String(po.xjNumber || '').trim();
    const poSourceRef = String(po.sourceRef || '').trim();
    const xjFromPO = poRfqRef.startsWith('ING-')
      ? poRfqRef
      : (poSourceRef.startsWith('ING-') ? poSourceRef : '');
    const legacyFromRequirement = String(matchedRequirement?.sourceRef || '').trim();
    const sourceInquiryNumber = String(matchedRequirement?.sourceInquiryNumber || '').trim();
    const inquiryFromContract = getInquiryByContractRef(po);
    // 规则：来源统一显示 ING 客户询价编号；不显示 CG/SC/XJ
    if (sourceInquiryNumber.startsWith('ING-')) return sourceInquiryNumber;
    if (xjFromRequirement) return xjFromRequirement;
    if (inquiryFromContract) return inquiryFromContract;
    if (xjFromPO) return xjFromPO;
    if (legacyFromRequirement.startsWith('ING-')) return legacyFromRequirement;
    return '';
  };

  const getPOTraceRefs = React.useCallback((po: PurchaseOrderType): Set<string> => {
    const refs = new Set<string>();
    const addRef = (v: unknown) => {
      const s = String(v || '').trim().toUpperCase();
      if (s) refs.add(s);
    };
    addRef(resolveInquirySourceRef(po));
    addRef(po.xjNumber);
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
          q?.sourceXJId,
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

  const resolveQuotationSourceRef = React.useCallback((po: PurchaseOrderType): string => {
    const candidate = getPOQuoteCandidates(po)[0];
    return String(
      candidate?.bjNumber ||
      candidate?.quotationNo ||
      candidate?.quotationNumber ||
      po.quotationNumber ||
      po.selectedBjId ||
      '',
    ).trim();
  }, [getPOQuoteCandidates]);

  const resolveSupplierInquiryRef = React.useCallback((po: PurchaseOrderType): string => {
    const candidate = getPOQuoteCandidates(po)[0];
    return String(
      candidate?.sourceXJ ||
      candidate?.sourceXJNumber ||
      candidate?.xjNumber ||
      po.xjNumber ||
      '',
    ).trim();
  }, [getPOQuoteCandidates]);

  const resolveQuotedItemPricing = React.useCallback(
    (po: PurchaseOrderType, item: PurchaseOrderItem, supplierCode?: string) => {
      const itemId = String(item?.id || '').trim();
      const itemModel = String(getFormalBusinessModelNo(item) || '').trim().toLowerCase();
      const itemName = String(item?.productName || '').trim().toLowerCase();
      const quotes = getPOQuoteCandidates(po, supplierCode);
      for (const quotation of quotes) {
        const qItems = getQuotationItems(quotation);
        const matched = qItems.find((qi: any) => {
          const qiId = String(qi?.id || qi?.productId || '').trim();
          const qiModel = String(getFormalBusinessModelNo(qi) || '').trim().toLowerCase();
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
      const sourceContract = salesContractsLite.find((contract: any) => {
        const contractNo = String(contract?.contractNumber || '').trim();
        return contractNo !== '' && [
          String(po.salesContractNumber || '').trim(),
          String(po.sourceRef || '').trim(),
          String(po.sourceSONumber || '').trim(),
        ].includes(contractNo);
      });
      const sourceContractProducts = Array.isArray(sourceContract?.products) ? sourceContract.products : [];
      const tracedItems = (po.items || []).map((item) => {
        const traced = resolveQuotedItemPricing(po, item);
        const itemId = String(item?.id || item?.productId || '').trim();
        const itemModel = String(getFormalBusinessModelNo(item) || '').trim().toLowerCase();
        const itemName = String(item?.productName || '').trim().toLowerCase();
        const contractProduct = sourceContractProducts.find((product: any) => {
          const productId = String(product?.id || product?.productId || '').trim();
          const productModel = String(getFormalBusinessModelNo(product) || '').trim().toLowerCase();
          const productName = String(product?.productName || '').trim().toLowerCase();
          return (
            (itemId !== '' && productId !== '' && itemId === productId) ||
            (itemModel !== '' && productModel !== '' && itemModel === productModel) ||
            (itemName !== '' && productName !== '' && itemName === productName)
          );
        });
        const contractUnitPrice = toNumericAmount(
          contractProduct?.unitPrice ?? contractProduct?.price ?? contractProduct?.targetPrice ?? 0
        );
        const unitPrice = traced && traced.unitPrice > 0
          ? traced.unitPrice
          : (toNumericAmount(item.unitPrice) > 0 ? toNumericAmount(item.unitPrice) : contractUnitPrice);
        const currency = normalizeCurrencyCode(
          traced?.currency ||
          item.currency ||
          contractProduct?.currency ||
          sourceContract?.currency ||
          po.currency ||
          ''
        );
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
    [resolveQuotedItemPricing, salesContractsLite]
  );

  const supplierPortalLinkageBackfillAttemptedRef = React.useRef<Set<string>>(new Set());

  // 自动反查回填：为缺失来源的采购单回填 ING（持久化到 purchase order）
  useEffect(() => {
    if (!purchaseOrders.length) return;
    const backfillXjNumbers = async () => {
      for (const po of purchaseOrders) {
        const existing = String(po.xjNumber || '').trim();
        if (existing.startsWith('ING-')) continue;
        const inferred = resolveInquirySourceRef(po);
        if (!inferred || inferred === existing) continue;
        try {
          await updatePurchaseOrder(po.id, { xjNumber: inferred });
        } catch (error: any) {
          console.warn('⚠️ [PurchaseOrderMgmt] xjNumber backfill failed:', error?.message || error);
        }
      }
    };
    void backfillXjNumbers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, salesContractsLite, xjs, purchaseRequirements]);

  // 自动反查回填：为历史 CG 固化 supplier XJ/BJ（持久化到 purchase order）
  useEffect(() => {
    if (!purchaseOrders.length) return;
    const backfillSupplierPortalLinkage = async () => {
      for (const po of purchaseOrders) {
        const poNo = String(po.poNumber || '').trim().toUpperCase();
        if (!poNo.startsWith('CG-')) continue;

        const backfillKey = String(po.id || po.poNumber || '').trim();
        if (!backfillKey || supplierPortalLinkageBackfillAttemptedRef.current.has(backfillKey)) continue;

        const renderMeta = po.documentRenderMeta || {};
        const supplierPortalLinkage = renderMeta?.supplierPortalLinkage || {};
        const snapshot = po.documentDataSnapshot || {};
        const editForm = (snapshot as any)?.editForm || {};

        const existingSupplierXjNo = String(
          supplierPortalLinkage?.supplierXjNo ||
          editForm?.xjNumber ||
          ''
        ).trim();
        const existingSupplierBjNo = String(
          supplierPortalLinkage?.supplierBjNo ||
          editForm?.supplierQuotationNo ||
          ''
        ).trim();

        if (/^XJ-/i.test(existingSupplierXjNo) && /^BJ-/i.test(existingSupplierBjNo)) {
          supplierPortalLinkageBackfillAttemptedRef.current.add(backfillKey);
          continue;
        }

        const matchedQuotation = getPOQuoteCandidates(po)[0] || null;
        const inferredSupplierXjNo = String(resolveSupplierInquiryRef(po) || '').trim();
        const inferredSupplierBjNo = String(resolveQuotationSourceRef(po) || '').trim();

        if (!/^XJ-/i.test(inferredSupplierXjNo) && !/^BJ-/i.test(inferredSupplierBjNo)) {
          continue;
        }

        supplierPortalLinkageBackfillAttemptedRef.current.add(backfillKey);

        try {
          await updatePurchaseOrder(po.id, {
            documentRenderMeta: {
              ...renderMeta,
              supplierPortalLinkage: {
                ...supplierPortalLinkage,
                supplierXjNo: /^XJ-/i.test(inferredSupplierXjNo)
                  ? inferredSupplierXjNo
                  : (supplierPortalLinkage?.supplierXjNo || null),
                supplierBjNo: /^BJ-/i.test(inferredSupplierBjNo)
                  ? inferredSupplierBjNo
                  : (supplierPortalLinkage?.supplierBjNo || null),
                supplierQuotationId: matchedQuotation?.id || supplierPortalLinkage?.supplierQuotationId || null,
                supplierCode: po.supplierCode || matchedQuotation?.supplierCode || supplierPortalLinkage?.supplierCode || null,
              },
            } as any,
            documentDataSnapshot: {
              ...snapshot,
              editForm: {
                ...editForm,
                xjNumber: /^XJ-/i.test(inferredSupplierXjNo)
                  ? inferredSupplierXjNo
                  : (editForm?.xjNumber || ''),
                supplierQuotationNo: /^BJ-/i.test(inferredSupplierBjNo)
                  ? inferredSupplierBjNo
                  : (editForm?.supplierQuotationNo || ''),
              },
            } as any,
          } as any);
        } catch (error: any) {
          supplierPortalLinkageBackfillAttemptedRef.current.delete(backfillKey);
          console.warn('⚠️ [PurchaseOrderMgmt] supplierPortalLinkage backfill failed:', po.poNumber, error?.message || error);
        }
      }
    };
    void backfillSupplierPortalLinkage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, supplierQuotations, xjs, purchaseRequirements]);

  // 审批联动：采购主管 / CEO 审批采购请求后，自动更新采购单可下推状态
  useEffect(() => {
    if (!purchaseOrders.length || !approvalRequests.length) return;
    const syncApprovalStatuses = async () => {
      for (const po of purchaseOrders) {
        const workflow = derivePurchaseOrderWorkflowFields(po);
        const reqStatus = String(po.procurementRequestStatus || '').trim();
        const approvalStatus = String(workflow.approvalStatus || '').trim();
        const isPendingApproval =
          ['pending_l1', 'pending_l2'].includes(approvalStatus) ||
          ['pending_manager_approval', 'pending_ceo_approval'].includes(reqStatus);
        if (!isPendingApproval) continue;
        const poNo = String(po.poNumber || '').trim();
        const parentNo = String(po.parentRequestPoNumber || '').trim();
        const requestIds = [
          poNo ? `PRQ-${poNo}` : '',
          !poNo && parentNo ? `PRQ-${parentNo}` : ''
        ].filter(Boolean);
        const matched = approvalRequests.find((r) => requestIds.includes(String(r.relatedDocumentId || '')));
        if (!matched) continue;
        try {
          if (matched.status === 'approved') {
            await updatePurchaseOrder(po.id, {
              status: 'confirmed',
              approvalStatus: 'approved',
              executionStatus: String(workflow.executionStatus || '').trim() || 'approved',
              ...( { procurementRequestStatus: 'approved_boss' } as any ),
            } as any);
          } else if (
            matched.status === 'forwarded' &&
            (approvalStatus === 'pending_l1' || reqStatus === 'pending_manager_approval')
          ) {
            await updatePurchaseOrder(po.id, {
              approvalStatus: 'pending_l2',
              ...( { procurementRequestStatus: 'pending_ceo_approval' } as any ),
            } as any);
          } else if (matched.status === 'rejected') {
            await updatePurchaseOrder(po.id, {
              approvalStatus: 'rejected',
              ...( { procurementRequestStatus: 'rejected_boss' } as any ),
            } as any);
          }
        } catch (error: any) {
          console.warn('⚠️ [PurchaseOrderMgmt] approval status sync failed:', error?.message || error);
        }
      }
    };
    void syncApprovalStatuses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrders, approvalRequests]);

  // 🔥 工具函数已移至 purchase-order/purchaseOrderUtils.ts

  // 🔥 处理采购单号点击 - 打开文档预览
  const handleViewPODocument = async (po: PurchaseOrderType) => {
    const tracedPatch = buildPOWithTracedQuoteCurrency(po);
    const poForDoc = {
      ...po,
      ...tracedPatch,
    };
    const nextDocumentSnapshot = buildPurchaseOrderDocumentSnapshot(poForDoc as any, {
      preferLiveData: true,
    });
    const hasCurrencyDelta =
      String(po.currency || '').toUpperCase() !== String(tracedPatch.currency || '').toUpperCase();
    const hasAmountDelta = Math.abs(Number(po.totalAmount || 0) - Number(tracedPatch.totalAmount || 0)) > 0.0001;
    const hasItemDelta = (po.items || []).some((item, idx) => {
      const next = tracedPatch.items[idx];
      return !next ||
        Number(item.unitPrice || 0) !== Number(next.unitPrice || 0) ||
        String(item.currency || '').toUpperCase() !== String(next.currency || '').toUpperCase();
    });
    const existingSnapshot = (po as any).documentDataSnapshot || (po as any).document_data_snapshot || null;
    const hasSnapshotDelta = JSON.stringify(existingSnapshot || null) !== JSON.stringify(nextDocumentSnapshot);
    setCurrentPOData(nextDocumentSnapshot);
    setShowPOPreview(true);
    if (hasCurrencyDelta || hasAmountDelta || hasItemDelta || hasSnapshotDelta) {
      void updatePurchaseOrder(po.id, {
        items: tracedPatch.items as any,
        currency: tracedPatch.currency,
        totalAmount: tracedPatch.totalAmount,
        documentDataSnapshot: nextDocumentSnapshot,
        updatedDate: new Date().toISOString(),
      } as any).catch((error: any) => {
        toast.error('采购合同数据后台同步失败', {
          description: error?.message || 'Supabase 写入失败',
          duration: 5000,
        });
      });
    }
  };

  // 🔥 处理采购需求单号点击 - 打开文档预览
  const handleViewPRDocument = (req: QuoteRequirement) => {
    // 使用文档预览
    setViewRequirement(req);
    setShowRequirementDialog(true);
  };

  const handleApplyBossApproval = async (po: PurchaseOrderType) => {
    const navigateToBossApproval = () => {
      window.dispatchEvent(new CustomEvent('navigate', {
        detail: {
          page: 'order-management-center',
          subTab: 'approvals',
        },
      }));
    };

    const workflow = derivePurchaseOrderWorkflowFields(po);
    const reqStatus = String(po.procurementRequestStatus || '');
    const approvalStatus = String(workflow.approvalStatus || '').trim();
    const executionStatus = String(workflow.executionStatus || '').trim();
    if (['pending_l1', 'pending_l2'].includes(approvalStatus) || reqStatus === 'pending_manager_approval' || reqStatus === 'pending_ceo_approval') {
      toast.info('该采购单已提交审核');
      navigateToBossApproval();
      return;
    }
    if (approvalStatus === 'approved' || reqStatus === 'approved_boss') {
      toast.info('该采购单已审核通过');
      navigateToBossApproval();
      return;
    }
    const isRejectedAndResubmit = approvalStatus === 'rejected' || reqStatus === 'rejected_boss';
    if (executionStatus === 'pushed_to_supplier' || reqStatus === 'pushed_supplier') {
      toast.info('该采购单已发送供应商');
      return;
    }

    const currentPoNo = String(po.poNumber || '').trim();
    const parentPoNo = String(po.parentRequestPoNumber || '').trim();
    // Phase 3d: PR-aware sibling grouping for boss-approval submission.
    // Standard-path CGs carry parentRequestPoNumber = 'PR-xxx' (typed, Phase 3b).
    const mainPoNo = parentPoNo.startsWith('PR-')
      ? parentPoNo   // standard path: use PR as group key — collects all siblings
      : parentPoNo.startsWith('CG-')
        ? parentPoNo // legacy CG-era parent: original behaviour preserved
        : currentPoNo; // no parent: treat as standalone
    // Standard path: select all CGs that share the same PR parent (excludes the PR record itself).
    // Legacy path: original logic — match by poNumber or parentRequestPoNumber.
    const groupPOs = parentPoNo.startsWith('PR-')
      ? purchaseOrders.filter(
          (p) => String(p.parentRequestPoNumber || '').trim() === mainPoNo
        )
      : purchaseOrders.filter((p) => {
          const pNo = String(p.poNumber || '').trim();
          const parentNo = String(p.parentRequestPoNumber || '').trim();
          return pNo === mainPoNo || parentNo === mainPoNo;
        });
    const needsValidation = groupPOs.some((p) => String(p.prValidationStatus || '').trim() !== 'passed');
    if (needsValidation) {
      const hasComparisonEvidence = groupPOs.every((p) => {
        const selectedQuote = p.selectedQuote;
        const selectedBjId = String(p.selectedBjId || '').trim();
        const xjNo = String(p.xjNumber || '').trim();
        return Boolean(selectedQuote || selectedBjId || xjNo);
      });
      if (!hasComparisonEvidence) {
        const shouldContinue = window.confirm(
          '部分采购单缺少 XJ/BJ 比价依据（xjNumber / selectedQuote / selectedBjId）。\n\n建议先补齐比价结论再提交审核。\n\n是否仍继续提交审核？'
        );
        if (!shouldContinue) return;
      }
      const validationTimestamp = new Date().toISOString();
      const validatedBy = user?.email || user?.name || 'procurement';
      try {
        await Promise.all(groupPOs.map((p) => updatePurchaseOrder(p.id, {
          prValidationStatus: 'passed',
          prValidatedAt: validationTimestamp,
          prValidatedBy: validatedBy,
        } as any)));
      } catch (error: any) {
        toast.error('自动检查采购草稿失败', {
          description: error?.message || 'Supabase 写入失败',
          duration: 5000,
        });
        return;
      }
    }
    const procurementManagerEmail = 'procurement.manager@cosunchina.com';
    const ceoEmail = 'ceo@cosunchina.com';
    const requiresCeoSecondReview = Number(po.totalAmount || 0) > 100000;
    const requestId = `PRQ-${mainPoNo || currentPoNo}`;
    const existingRequest = approvalRequests.find((r) => String(r.relatedDocumentId || '') === requestId);
    if (existingRequest && (existingRequest.status === 'pending' || existingRequest.status === 'forwarded')) {
      toast.info('该采购单已提交审核');
      navigateToBossApproval();
      return;
    }

    if (existingRequest && isRejectedAndResubmit) {
      await updateApprovalRequest(existingRequest.id, {
        status: 'pending',
        submittedAt: new Date().toISOString(),
        submittedBy: user?.email || existingRequest.submittedBy,
        submittedByName: user?.name || user?.email || existingRequest.submittedByName,
        submittedByRole: user?.role || existingRequest.submittedByRole,
        currentApprover: procurementManagerEmail,
        currentApproverRole: 'Procurement_Manager',
        nextApprover: requiresCeoSecondReview ? ceoEmail : null,
        nextApproverRole: requiresCeoSecondReview ? 'CEO' : null,
        expiresIn: 24,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      } as any);
    } else if (!existingRequest) {
      const linkedRequirement = findRequirementForPO(po);
      await addApprovalRequest({
        type: 'cg_approval',
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
        currentApprover: procurementManagerEmail,
        currentApproverRole: 'Procurement_Manager',
        nextApprover: requiresCeoSecondReview ? ceoEmail : null,
        nextApproverRole: requiresCeoSecondReview ? 'CEO' : null,
        status: 'pending',
        urgency: Number(po.totalAmount || 0) >= 50000 ? 'high' : 'normal',
        amount: Number(po.totalAmount || 0),
        currency: po.currency || 'USD',
        customerName: linkedRequirement?.customer?.companyName || '',
        customerEmail: linkedRequirement?.customer?.email || '',
        productSummary: requiresCeoSecondReview
          ? `${groupPOs.length}张采购单草稿，待采购主管审核，通过后进入 CEO 二审`
          : `${groupPOs.length}张采购单草稿，待采购主管审核`,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expiresIn: 24
      } as any);
    }
    try {
      await Promise.all(groupPOs.map((p) => updatePurchaseOrder(p.id, {
        approvalStatus: 'pending_l1',
        procurementRequestStatus: 'pending_manager_approval',
      } as any)));
    } catch (error: any) {
      toast.error('同步采购单审批状态失败', {
        description: error?.message || 'Supabase 写入失败',
        duration: 5000,
      });
      return;
    }
    toast.success(`已提交审核（${groupPOs.length}张采购单）`);
    navigateToBossApproval();
  };

  const handleValidateProcurementRequest = async (po: PurchaseOrderType) => {
    const workflow = derivePurchaseOrderWorkflowFields(po);
    const reqStatus = String(po.procurementRequestStatus || '').trim();
    const approvalStatus = String(workflow.approvalStatus || '').trim();
    const executionStatus = String(workflow.executionStatus || '').trim();
    if (['pending_l1', 'pending_l2'].includes(approvalStatus) || reqStatus === 'pending_manager_approval' || reqStatus === 'pending_ceo_approval') {
      toast.info('该采购单已进入审批阶段，无需重复检查');
      return;
    }
    if (approvalStatus === 'approved' || executionStatus === 'pushed_to_supplier' || reqStatus === 'approved_boss' || reqStatus === 'pushed_supplier') {
      toast.info('该采购单已通过审批，无需重复检查');
      return;
    }

    const currentPoNo = String(po.poNumber || '').trim();
    const parentPoNo = String(po.parentRequestPoNumber || '').trim();
    const mainPoNo = parentPoNo.startsWith('PR-')
      ? parentPoNo
      : parentPoNo.startsWith('CG-')
        ? parentPoNo
        : currentPoNo;
    const groupPOs = parentPoNo.startsWith('PR-')
      ? purchaseOrders.filter((p) => String(p.parentRequestPoNumber || '').trim() === mainPoNo)
      : purchaseOrders.filter((p) => {
          const pNo = String(p.poNumber || '').trim();
          const parentNo = String(p.parentRequestPoNumber || '').trim();
          return pNo === mainPoNo || parentNo === mainPoNo;
        });

    const hasComparisonEvidence = groupPOs.every((p) => {
      const selectedQuote = p.selectedQuote;
      const selectedBjId = String(p.selectedBjId || '').trim();
      const xjNo = String(p.xjNumber || '').trim();
      return Boolean(selectedQuote || selectedBjId || xjNo);
    });

    if (!hasComparisonEvidence) {
      const shouldContinue = window.confirm(
        '部分采购单缺少 XJ/BJ 比价依据（xjNumber / selectedQuote / selectedBjId）。\n\n建议先补齐比价结论后再继续。\n\n是否仍继续？'
      );
      if (!shouldContinue) return;
    }

    if (groupPOs.length === 0) {
      toast.error('未找到可校验的采购单草稿');
      return;
    }

    const validationTimestamp = new Date().toISOString();
    const validatedBy = user?.email || user?.name || 'procurement';
    try {
      await Promise.all(groupPOs.map((p) => updatePurchaseOrder(p.id, {
        prValidationStatus: 'passed',
        prValidatedAt: validationTimestamp,
        prValidatedBy: validatedBy,
      } as any)));
      toast.success(`检查已通过（${groupPOs.length}张采购单）`);
    } catch (error: any) {
      toast.error('同步检查状态失败', {
        description: error?.message || 'Supabase 写入失败',
        duration: 5000,
      });
    }
  };

  const handlePushPurchaseToSupplier = async (po: PurchaseOrderType) => {
    const workflow = derivePurchaseOrderWorkflowFields(po);
    const reqStatus = String(po.procurementRequestStatus || '');
    const approvalStatus = String(workflow.approvalStatus || '').trim();
    const executionStatus = String(workflow.executionStatus || '').trim();
    const isUnassigned = !po.supplierCode || po.supplierCode === 'TBD' || String(po.supplierName || '').includes('待');
    if (workflow.documentType === 'PR' || executionStatus === 'pending_assignment' || reqStatus === 'pending_procurement_assignment' || isUnassigned) {
      openSupplierAllocationDialog(po);
      return;
    }
    if (approvalStatus === 'draft' || (!approvalStatus && (!reqStatus || reqStatus === 'draft_allocated'))) {
      toast.error('请先点击“申请审核”，审核通过后才能下推采购');
      return;
    }
    if (approvalStatus === 'pending_l1' || reqStatus === 'pending_manager_approval') {
      toast.error('该采购请求待采购主管审核，通过后才能下推采购');
      return;
    }
    if (approvalStatus === 'pending_l2' || reqStatus === 'pending_ceo_approval') {
      toast.error('该采购请求待 CEO 二审，通过后才能下推采购');
      return;
    }
    if (approvalStatus === 'rejected' || reqStatus === 'rejected_boss') {
      toast.error('该采购请求已被老板驳回，请业务员重新发起请求采购');
      return;
    }
    if (approvalStatus === 'approved' || reqStatus === 'approved_boss') {
      const currentPoNo = String(po.poNumber || '').trim();
      const parentPoNo = String(po.parentRequestPoNumber || '').trim();
      // Phase 3d: corrected sibling-selection for standard PR → CG path.
      // Standard-path CGs carry parentRequestPoNumber = 'PR-xxx' (typed, Phase 3b).
      const mainPoNo = parentPoNo.startsWith('PR-')
        ? parentPoNo   // standard path: use PR as group key — finds all siblings
        : parentPoNo.startsWith('CG-')
          ? parentPoNo // legacy CG-era parent: original behaviour preserved
          : currentPoNo; // no parent: push this record only
      // Standard path: filter by parentRequestPoNumber only (excludes the PR record itself).
      // Legacy path: original filter — finds the record + any that name it as parent.
      const targetPOs = parentPoNo.startsWith('PR-')
        ? purchaseOrders.filter(
            (p) => String(p.parentRequestPoNumber || '').trim() === mainPoNo
          )
        : purchaseOrders.filter((p) => {
            const pNo = String(p.poNumber || '').trim();
            const parentNo = String(p.parentRequestPoNumber || '').trim();
            return pNo === mainPoNo || parentNo === mainPoNo;
          });
      try {
        await Promise.all(targetPOs.map((p) => updatePurchaseOrder(p.id, {
          approvalStatus: 'approved',
          executionStatus: 'pushed_to_supplier',
          procurementRequestStatus: 'pushed_supplier',
          status: 'confirmed',
          updatedDate: new Date().toISOString(),
        } as any)));
      } catch (error: any) {
        toast.error(`下推采购单失败：${error?.message || '未知错误'}`);
        return;
      }

      // Phase 3c: SC.production mirror ─────────────────────────────────────────────────────────
      // Check whether ALL standard-path CG records for this PR are now pushed_supplier.
      // Standard path: CG has parentRequestPoNumber that starts with 'PR-' (set by Phase 3b).
      // If all CGs are pushed, advance the linked SC from po_generated → production.
      //
      // ⚠️  Phase 5 rule: SC mirrors CG execution ONLY up to 'production'.
      //     SC does NOT auto-sync CG 'producing', 'shipped', or 'completed'.
      //     SC.shipped and SC.completed are SALES-CONTROLLED actions (advanceSCToShipped /
      //     advanceSCToCompleted in SalesContractContext) triggered by the salesperson, not here.
      //     Do NOT extend this block to advance SC beyond 'production'.
      //
      // Timing note: purchaseOrders state has not re-rendered yet after the updatePurchaseOrder
      // calls above, so we simulate the post-push state by treating targetPOs as pushed_supplier.
      //
      // Legacy paths (CGs without parentRequestPoNumber, or parentRequestPoNumber not 'PR-' prefix)
      // are intentionally excluded from this reflection.
      const prPoNumber = String(po.parentRequestPoNumber || '').trim();
      if (prPoNumber.startsWith('PR-')) {
        // All standard-path CGs that share this PR as parent
        const allCGsForPR = purchaseOrders.filter(
          p => String(p.parentRequestPoNumber || '').trim() === prPoNumber
        );
        // Simulate post-push: consider targetPOs as already pushed_supplier
        const justPushedIds = new Set(targetPOs.map(p => p.id));
        const allPushed =
          allCGsForPR.length > 0 &&
          allCGsForPR.every(
            cg => {
              const cgWorkflow = derivePurchaseOrderWorkflowFields(cg);
              return cgWorkflow.executionStatus === 'pushed_to_supplier' || cg.procurementRequestStatus === 'pushed_supplier' || justPushedIds.has(cg.id);
            }
          );
        if (allPushed) {
          // Resolve SC contract number from the parent PR record
          const prRecord = purchaseOrders.find(p => p.poNumber === prPoNumber);
          const scContractNumber = prRecord?.salesContractNumber || prRecord?.sourceRef;
          if (scContractNumber) {
            try {
              await advanceSCToProduction(scContractNumber);
            } catch {
              // Non-fatal: the CG push succeeded. SC advancement failure is recoverable —
              // the SC stays at po_generated until this is retried or advanced manually.
            }
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────────────────────────

      toast.success(`已向供应商发送 ${targetPOs.length || 1} 张采购单`);
      return;
    }
    if (executionStatus === 'pushed_to_supplier' || reqStatus === 'pushed_supplier') {
      toast.info('该采购单已完成下推采购');
      return;
    }
    toast.error('当前状态不可下推，请先完成分配和审批');
  };

  const handleOpenEditPO = (po: PurchaseOrderType) => {
    const existingSnapshot = ((po as any).documentDataSnapshot || (po as any).document_data_snapshot || null) as PurchaseOrderData | null;
    const existingEditForm = (existingSnapshot?.editForm || {}) as Record<string, any>;
    const resolvedOrderDate = String(
      (po as any).orderDate ||
      (po as any).order_date ||
      existingEditForm.orderDate ||
      existingSnapshot?.poDate ||
      ''
    ).trim();
    const resolvedExpectedDate = String(
      (po as any).expectedDate ||
      (po as any).expectedDeliveryDate ||
      (po as any).expected_delivery_date ||
      existingEditForm.expectedDate ||
      existingSnapshot?.requiredDeliveryDate ||
      ''
    ).trim();
    const resolvedPaymentTerms = String(
      (po as any).paymentTerms ||
      existingEditForm.paymentTerms ||
      existingSnapshot?.terms?.paymentTerms ||
      ''
    );
    const resolvedSupplierBankInfo =
      (po as any).supplierBankInfo ||
      (po as any).supplier_bank_info ||
      existingSnapshot?.supplier?.bankInfo ||
      null;
    const resolvedDeliveryTerms = String(
      (po as any).deliveryTerms ||
      existingEditForm.deliveryTerms ||
      existingSnapshot?.terms?.deliveryTerms ||
      ''
    );
    const resolvedDeliveryAddress = String(
      (po as any).deliveryAddress ||
      existingEditForm.deliveryAddress ||
      existingSnapshot?.terms?.deliveryAddress ||
      ''
    );
    const resolvedQualityStandard = String(
      (po as any).qualityStandard ||
      (po as any).qualityTerms ||
      existingEditForm.qualityStandard ||
      existingSnapshot?.terms?.qualityStandard ||
      ''
    );
    const resolvedInspectionMethod = String(
      (po as any).inspectionMethod ||
      (po as any).inspectionTerms ||
      existingEditForm.inspectionMethod ||
      existingSnapshot?.terms?.inspectionMethod ||
      ''
    );
    const resolvedPackaging = String(
      (po as any).packaging ||
      (po as any).packagingTerms ||
      existingEditForm.packaging ||
      existingSnapshot?.terms?.packaging ||
      ''
    );
    const resolvedShippingMarks = String(
      (po as any).shippingMarks ||
      existingEditForm.shippingMarks ||
      existingSnapshot?.terms?.shippingMarks ||
      ''
    );
    const resolvedDeliveryPenalty = String(
      (po as any).deliveryPenalty ||
      existingEditForm.deliveryPenalty ||
      existingSnapshot?.terms?.deliveryPenalty ||
      ''
    );
    const resolvedQualityPenalty = String(
      (po as any).qualityPenalty ||
      (po as any).penaltyTerms ||
      existingEditForm.qualityPenalty ||
      existingSnapshot?.terms?.qualityPenalty ||
      ''
    );
    const resolvedWarrantyPeriod = String(
      (po as any).warrantyPeriod ||
      existingEditForm.warrantyPeriod ||
      existingSnapshot?.terms?.warrantyPeriod ||
      ''
    );
    const resolvedWarrantyTerms = String(
      (po as any).warrantyTerms ||
      existingEditForm.warrantyTerms ||
      existingSnapshot?.terms?.warrantyTerms ||
      ''
    );
    const resolvedApplicableLaw = String(
      (po as any).applicableLaw ||
      existingEditForm.applicableLaw ||
      existingSnapshot?.terms?.applicableLaw ||
      ''
    );
    const resolvedContractValidity = String(
      (po as any).contractValidity ||
      existingEditForm.contractValidity ||
      existingSnapshot?.terms?.contractValidity ||
      ''
    );
    const resolvedReturnPolicy = String(
      (po as any).returnPolicy ||
      existingEditForm.returnPolicy ||
      existingSnapshot?.terms?.returnPolicy ||
      ''
    );
    const resolvedConfidentiality = String(
      (po as any).confidentiality ||
      existingEditForm.confidentiality ||
      existingSnapshot?.terms?.confidentiality ||
      ''
    );
    const resolvedIpRights = String(
      (po as any).ipRights ||
      existingEditForm.ipRights ||
      existingSnapshot?.terms?.ipRights ||
      ''
    );
    const resolvedForceMajeure = String(
      (po as any).forceMajeure ||
      existingEditForm.forceMajeure ||
      existingSnapshot?.terms?.forceMajeure ||
      ''
    );
    const resolvedDisputeResolution = String(
      (po as any).disputeResolution ||
      (po as any).disputeResolutionTerms ||
      existingEditForm.disputeResolution ||
      existingSnapshot?.terms?.disputeResolution ||
      ''
    );
    const resolvedModification = String(
      (po as any).modification ||
      existingEditForm.modification ||
      existingSnapshot?.terms?.modification ||
      ''
    );
    const resolvedTermination = String(
      (po as any).termination ||
      existingEditForm.termination ||
      existingSnapshot?.terms?.termination ||
      ''
    );
    const resolvedIncoterm = String(
      (po as any).incoterm ||
      existingEditForm.incoterm ||
      existingSnapshot?.terms?.incoterm ||
      ''
    );
    const resolvedPortOfLoading = String(
      (po as any).portOfLoading ||
      existingEditForm.portOfLoading ||
      existingSnapshot?.terms?.portOfLoading ||
      ''
    );
    const resolvedPortOfDestination = String(
      (po as any).portOfDestination ||
      existingEditForm.portOfDestination ||
      existingSnapshot?.terms?.portOfDestination ||
      ''
    );
    const resolvedTaxTerms = String(
      (po as any).taxTerms ||
      existingEditForm.taxTerms ||
      existingSnapshot?.terms?.taxTerms ||
      ''
    );
    const resolvedBankTerms = String(
      (po as any).bankTerms ||
      existingEditForm.bankTerms ||
      existingSnapshot?.terms?.bankTerms ||
      ''
    );
    const normalizedSourceRef = normalizeRegionalDocNo(
      String(
        po.sourceRef ||
        existingEditForm.sourceRef ||
        po.salesContractNumber ||
        po.sourceSONumber ||
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
      requirementNo: String(po.requirementNo || existingEditForm.requirementNo || ''),
      xjNumber: String(po.xjNumber || existingEditForm.xjNumber || ''),
      sourceRef: normalizedSourceRef,
      supplierName: String(po.supplierName || existingEditForm.supplierName || ''),
      supplierCode: String(po.supplierCode || existingEditForm.supplierCode || ''),
      supplierContact: String((po as any).supplierContact || existingEditForm.supplierContact || ''),
      supplierPhone: String((po as any).supplierPhone || existingEditForm.supplierPhone || ''),
      supplierAddress: String((po as any).supplierAddress || existingEditForm.supplierAddress || ''),
      supplierBankName: String(resolvedSupplierBankInfo?.bankName || ''),
      supplierBankAccountName: String(resolvedSupplierBankInfo?.accountName || ''),
      supplierBankAccountNumber: String(resolvedSupplierBankInfo?.accountNumber || ''),
      supplierBankSwiftCode: String(resolvedSupplierBankInfo?.swiftCode || resolvedSupplierBankInfo?.swift || ''),
      supplierBankAddress: String(resolvedSupplierBankInfo?.bankAddress || ''),
      supplierBankCurrency: String(resolvedSupplierBankInfo?.currency || ''),
      currency: effectivePOCurrency,
      paymentTerms: resolvedPaymentTerms,
      deliveryTerms: resolvedDeliveryTerms,
      deliveryAddress: resolvedDeliveryAddress,
      qualityStandard: resolvedQualityStandard,
      inspectionMethod: resolvedInspectionMethod,
      packaging: resolvedPackaging,
      shippingMarks: resolvedShippingMarks,
      deliveryPenalty: resolvedDeliveryPenalty,
      qualityPenalty: resolvedQualityPenalty,
      warrantyPeriod: resolvedWarrantyPeriod,
      returnPolicy: resolvedReturnPolicy,
      confidentiality: resolvedConfidentiality,
      ipRights: resolvedIpRights,
      forceMajeure: resolvedForceMajeure,
      disputeResolution: resolvedDisputeResolution,
      applicableLaw: resolvedApplicableLaw,
      contractValidity: resolvedContractValidity,
      modification: resolvedModification,
      termination: resolvedTermination,
      incoterm: resolvedIncoterm,
      portOfLoading: resolvedPortOfLoading,
      portOfDestination: resolvedPortOfDestination,
      qualityTerms: String((po as any).qualityTerms || ''),
      inspectionTerms: String((po as any).inspectionTerms || ''),
      packagingTerms: String((po as any).packagingTerms || ''),
      warrantyTerms: resolvedWarrantyTerms,
      penaltyTerms: String((po as any).penaltyTerms || ''),
      disputeResolutionTerms: String((po as any).disputeResolutionTerms || ''),
      taxTerms: resolvedTaxTerms,
      bankTerms: resolvedBankTerms,
      orderDate: resolvedOrderDate,
      expectedDate: resolvedExpectedDate,
      actualDate: String((po as any).actualDate || existingEditForm.actualDate || ''),
      status: String((po as any).status || existingEditForm.status || 'pending'),
      paymentStatus: String((po as any).paymentStatus || existingEditForm.paymentStatus || 'unpaid'),
      remarks: String((po as any).remarks || existingEditForm.remarks || ''),
    });
    setEditPOOrderDate(parseDateLike(resolvedOrderDate));
    setEditPOExpectedDate(parseDateLike(resolvedExpectedDate));
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

  const handleSaveEditPO = async () => {
    if (!editingPO) return;
    const latestEditPOForm = editPOFormRef.current;
    const latestEditPOItems = editPOItemsRef.current;
    const totalAmount = latestEditPOItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
    const normalizedSourceRef = normalizeRegionalDocNo(latestEditPOForm.sourceRef);
    const normalizedOrderDate = formatDateForStorage(editPOOrderDate) || String(latestEditPOForm.orderDate || '').trim();
    const normalizedExpectedDate = formatDateForStorage(editPOExpectedDate) || String(latestEditPOForm.expectedDate || '').trim();
    const normalizedActualDate = formatDateForStorage(editPOActualDate) || String(latestEditPOForm.actualDate || '').trim() || undefined;
    const normalizedUpdates = {
      ...editingPO,
      poNumber: String(latestEditPOForm.poNumber || '').trim(),
      requirementNo: String(latestEditPOForm.requirementNo || '').trim(),
      xjNumber: String(latestEditPOForm.xjNumber || '').trim(),
      sourceRef: normalizedSourceRef,
      sourceSONumber: normalizedSourceRef,
      salesContractNumber: normalizedSourceRef,
      supplierName: String(latestEditPOForm.supplierName || '').trim(),
      supplierCode: String(latestEditPOForm.supplierCode || '').trim(),
      supplierContact: String(latestEditPOForm.supplierContact || '').trim(),
      supplierPhone: String(latestEditPOForm.supplierPhone || '').trim(),
      supplierAddress: String(latestEditPOForm.supplierAddress || '').trim(),
      supplierBankInfo: {
        bankName: String(latestEditPOForm.supplierBankName || '').trim(),
        accountName: String(latestEditPOForm.supplierBankAccountName || '').trim(),
        accountNumber: String(latestEditPOForm.supplierBankAccountNumber || '').trim(),
        swiftCode: String(latestEditPOForm.supplierBankSwiftCode || '').trim(),
        bankAddress: String(latestEditPOForm.supplierBankAddress || '').trim(),
        currency: normalizeCurrencyCode(latestEditPOForm.supplierBankCurrency) || '',
      },
      supplier_bank_info: {
        bankName: String(latestEditPOForm.supplierBankName || '').trim(),
        accountName: String(latestEditPOForm.supplierBankAccountName || '').trim(),
        accountNumber: String(latestEditPOForm.supplierBankAccountNumber || '').trim(),
        swiftCode: String(latestEditPOForm.supplierBankSwiftCode || '').trim(),
        bankAddress: String(latestEditPOForm.supplierBankAddress || '').trim(),
        currency: normalizeCurrencyCode(latestEditPOForm.supplierBankCurrency) || '',
      },
      currency: normalizeCurrencyCode(latestEditPOForm.currency) || 'CNY',
      paymentTerms: String(latestEditPOForm.paymentTerms || '').trim(),
      deliveryTerms: String(latestEditPOForm.deliveryTerms || '').trim(),
      deliveryAddress: String(latestEditPOForm.deliveryAddress || '').trim(),
      qualityStandard: String(latestEditPOForm.qualityStandard || '').trim(),
      inspectionMethod: String(latestEditPOForm.inspectionMethod || '').trim(),
      packaging: String(latestEditPOForm.packaging || '').trim(),
      shippingMarks: String(latestEditPOForm.shippingMarks || '').trim(),
      deliveryPenalty: String(latestEditPOForm.deliveryPenalty || '').trim(),
      qualityPenalty: String(latestEditPOForm.qualityPenalty || '').trim(),
      warrantyPeriod: String(latestEditPOForm.warrantyPeriod || '').trim(),
      returnPolicy: String(latestEditPOForm.returnPolicy || '').trim(),
      confidentiality: String(latestEditPOForm.confidentiality || '').trim(),
      ipRights: String(latestEditPOForm.ipRights || '').trim(),
      forceMajeure: String(latestEditPOForm.forceMajeure || '').trim(),
      disputeResolution: String(latestEditPOForm.disputeResolution || '').trim(),
      applicableLaw: String(latestEditPOForm.applicableLaw || '').trim(),
      contractValidity: String(latestEditPOForm.contractValidity || '').trim(),
      modification: String(latestEditPOForm.modification || '').trim(),
      termination: String(latestEditPOForm.termination || '').trim(),
      incoterm: String(latestEditPOForm.incoterm || '').trim(),
      portOfLoading: String(latestEditPOForm.portOfLoading || '').trim(),
      portOfDestination: String(latestEditPOForm.portOfDestination || '').trim(),
      qualityTerms: String(latestEditPOForm.qualityStandard || latestEditPOForm.qualityTerms || '').trim(),
      inspectionTerms: String(latestEditPOForm.inspectionMethod || latestEditPOForm.inspectionTerms || '').trim(),
      packagingTerms: String(latestEditPOForm.packaging || latestEditPOForm.packagingTerms || '').trim(),
      warrantyTerms: String(latestEditPOForm.warrantyTerms || '').trim(),
      penaltyTerms: String(latestEditPOForm.qualityPenalty || latestEditPOForm.penaltyTerms || '').trim(),
      disputeResolutionTerms: String(latestEditPOForm.disputeResolution || latestEditPOForm.disputeResolutionTerms || '').trim(),
      taxTerms: String(latestEditPOForm.taxTerms || '').trim(),
      bankTerms: String(latestEditPOForm.bankTerms || '').trim(),
      orderDate: normalizedOrderDate,
      expectedDate: normalizedExpectedDate,
      expectedDeliveryDate: normalizedExpectedDate,
      actualDate: normalizedActualDate,
      status: String(latestEditPOForm.status || 'pending') as any,
      paymentStatus: String(latestEditPOForm.paymentStatus || 'unpaid') as any,
      remarks: String(latestEditPOForm.remarks || '').trim(),
      items: latestEditPOItems,
      totalAmount,
      updatedDate: new Date().toISOString(),
    } as any;
    normalizedUpdates.documentDataSnapshot = buildPurchaseOrderDocumentSnapshot(normalizedUpdates, {
      preferLiveData: true,
    });
    try {
      await updatePurchaseOrder(editingPO.id, normalizedUpdates as any);
      setCurrentPOData(normalizedUpdates.documentDataSnapshot);
      toast.success(`采购订单 ${editingPO.poNumber} 已更新`);
      setShowEditPODialog(false);
      setEditingPO(null);
    } catch (error: any) {
      toast.error(`采购订单更新失败：${error?.message || '未知错误'}`);
    }
  };

  // 🔥 处理创建XJ - 从采购需求创建，向多个供应商发送采购询价
  const handleCreateXJFromRequirement = (req: QuoteRequirement) => {
    const sourceTemplateSnapshot = (req as any).templateSnapshot || (req as any).template_snapshot || null;
    const sourceTemplateVersion = sourceTemplateSnapshot?.version || null;
    const sourceDocumentData = (req as any).documentDataSnapshot || (req as any).document_data_snapshot || null;
    if (!sourceTemplateVersion || !sourceDocumentData) {
      toast.error('该 QR 未绑定模板中心版本快照，无法创建 XJ');
      return;
    }

    setSelectedRequirementForXJ(req);
    setSelectedSuppliers([]);
    setXJDeadline(undefined);
    setXJRemarks('');
    setSupplierSearchTerm(''); // 🔥 重置供应商搜索
    // 默认全选所有产品（items.id 由 toPRRow 写入时确保为 UUID）
    setSelectedProductIds(req.items?.map((item: any) => String(item.id)) || []);
    setShowCreateXJDialog(true);
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
    setCurrentXJData(xjData);
    setCurrentXJBaseline(extractProjectExecutionBaseline(selectedRequirementForXJ));
    setShowXJPreview(true);
  };

  // toDateText, formatCompactUtcMinute, buildXJPreviewData → purchaseOrderUtils (Pass A)

  const openXJPreview = (xj: XJ) => {
    const templateSnapshot = (xj as any).templateSnapshot || (xj as any).template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = (xj as any).documentDataSnapshot || (xj as any).document_data_snapshot || null;
    if (!templateVersion || !documentData) {
      toast.error('该 XJ 未绑定模板中心版本快照，无法预览');
      return;
    }
    setCurrentXJData(documentData as XJData);
    setCurrentXJBaseline(extractProjectExecutionBaseline(xj));
    setShowXJPreview(true);
  };

  // 🔥 导出询价单为PDF
  const handleExportXJPDF = async (download: boolean = true) => {
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

    const sourceTemplateSnapshot =
      (selectedRequirementForXJ as any).templateSnapshot ||
      (selectedRequirementForXJ as any).template_snapshot ||
      null;
    const sourceTemplateVersion = sourceTemplateSnapshot?.version || null;
    const sourceDocumentData =
      (selectedRequirementForXJ as any).documentDataSnapshot ||
      (selectedRequirementForXJ as any).document_data_snapshot ||
      null;
    if (!sourceTemplateVersion || !sourceDocumentData) {
      toast.error('该 QR 未绑定模板中心版本快照，无法创建 XJ');
      return;
    }
    
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
      setSubmittingXJ(true);
      // allow UI to paint loading state before heavy work / network
      await new Promise<void>(resolve => setTimeout(resolve, 0));

      const createdBy = user?.name || user?.email || '采购员';

      const requirementItems = selectedRequirementForXJ.items || [];
      if (requirementItems.length === 0) {
        toast.error('创建失败：QR 没有产品明细(items)');
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
        const projectExecutionBaseline = extractProjectExecutionBaseline(selectedRequirementForXJ);

        if (selectedProducts.length === 0) {
          throw new Error('选中的产品为空：请检查产品ID类型/字段是否一致');
        }

        // 🔥 将产品转换为XJ产品格式
        const xjProducts: XJProduct[] = selectedProducts.map(item => ({
          id: String(item.id),
          productName: item.productName,
          modelNo: getFormalBusinessModelNo(item),
          specification: item.specification || '',
          quantity: item.quantity,
          unit: item.unit,
          targetPrice: item.targetPrice,
          currency: item.targetCurrency || 'USD',
          customerProductId: (item as any).customerProductId || null,
          projectId: (item as any).projectId || projectExecutionBaseline?.projectId || null,
          projectRevisionId: (item as any).projectRevisionId || projectExecutionBaseline?.projectRevisionId || null,
          projectRevisionCode: (item as any).projectRevisionCode || projectExecutionBaseline?.projectRevisionCode || null,
        }));

        // 🔥 使用第一个产品作为主产品（兼容旧字段）
        const mainProduct = selectedProducts[0];

        const xj: XJ = {
          id: toUUID(null),                                 // 兼容缺少 crypto.randomUUID 的运行环境
          xjNumber: supplierXjNo,                          // XJ-xxx（RPC 生成的询价单号，唯一约束键）
          supplierXjNo,                                    // 同上，冗余保留兼容旧字段
          requirementNo: selectedRequirementForXJ.requirementNo, // QR-xxx（关联采购需求）
          sourceQRNumber: selectedRequirementForXJ.requirementNo, // 溯源链：QR → XJ
          sourceRef: selectedRequirementForXJ.sourceRef,
          customerName: (selectedRequirementForXJ as any).customerName,
          customerRegion: selectedRequirementForXJ.region,
          projectId: projectExecutionBaseline?.projectId || null,
          projectCode: projectExecutionBaseline?.projectCode || null,
          projectName: projectExecutionBaseline?.projectName || null,
          projectRevisionId: projectExecutionBaseline?.projectRevisionId || null,
          projectRevisionCode: projectExecutionBaseline?.projectRevisionCode || null,
          projectRevisionStatus: projectExecutionBaseline?.projectRevisionStatus || null,
          finalRevisionId: projectExecutionBaseline?.finalRevisionId || null,
          finalQuotationId: projectExecutionBaseline?.finalQuotationId || null,
          finalQuotationNumber: projectExecutionBaseline?.finalQuotationNumber || null,

          // 🔥 多产品数组（新字段）
          products: xjProducts,

          // 🔥 主产品信息（兼容旧字段）
          productName: mainProduct.productName,
          modelNo: getFormalBusinessModelNo(mainProduct),
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
          templateSnapshot: { pendingResolution: true },
          documentData: xjDocumentData as any,
          documentDataSnapshot: xjDocumentData as any,
          documentRenderMeta: projectExecutionBaseline
            ? { projectExecutionBaseline }
            : undefined,
        };

        await addXJ(xj);
        createdXJs.push(xj);
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

    // 写回 Supabase（updateRequirement 内部调用 QR 主承载 service.upsert）
    await updateRequirement(selectedRequirementForXJ.id, {
      status: newStatus,
      items: updatedItems
    });
    
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ 询价单创建成功</p>
          <p className="text-sm">已为 {selectedSuppliers.length} 个供应商创建并提交询价单</p>
        <p className="text-xs text-slate-600">QR编号: {selectedRequirementForXJ.requirementNo}</p>
        <p className="text-xs text-slate-600">产品数量: {selectedProductIds.length} 个</p>
          <p className="text-xs text-blue-600 mt-1">👉 供应商可在 Portal【客户需求池】中看到该询价</p>
      </div>,
      { duration: 6000 }
    );
    
    // 🔥 自动跳转到询价管理Tab
    setTimeout(() => {
      setActiveTab('xj-management');
    }, 1000);
    
    setShowCreateXJDialog(false);
    setSelectedSuppliers([]);
    } catch (error: any) {
      console.error('❌ 创建询价单失败:', error);
      toast.error(`创建询价单失败：${error?.message || '未知错误'}`);
    } finally {
      setSubmittingXJ(false);
    }
  };

  // 🔥 批量删除询价单
  const handleBatchDeleteXJs = async () => {
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

      try {
        await Promise.all(deletableXJs.map((x) => deleteXJ(x.id)));
      } catch (error: any) {
        toast.error(`删除询价单失败：${error?.message || '未知错误'}`);
        return;
      }

      if (deletableXJs.length > 0) {
        const remainingXJs = xjs.filter((x) => !deletableXJs.some((d) => d.id === x.id));
        recomputeRequirementStatusByXJ(deletableXJs.map((x) => String(x.requirementNo || '')), remainingXJs);
        toast.success(`已删除 ${deletableXJs.length} 个询价单`, { duration: 3000 });
      }

      setSelectedXJIds([]);
    }
  };

  // 🔥 批量删除采购需求
  const handleBatchDeleteRequirements = async () => {
    if (selectedRequirementIds.length === 0) {
      toast.error('请先选择要删除的报价请求单');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedRequirementIds.length} 个报价请求单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      const targets = requirements.filter((r) => selectedRequirementIds.includes(r.id));
      const locked = targets.filter((r) => hasDownstreamXJForRequirement(r));
      const deletable = targets.filter((r) => !hasDownstreamXJForRequirement(r));

      if (locked.length > 0) {
        toast.error(`有 ${locked.length} 条报价请求单已生成下游询价(XJ)，不可删除`);
      }

      try {
        await Promise.all(deletable.map((r) => deleteRequirement(r.id)));
      } catch (error: any) {
        toast.error(`删除报价请求单失败：${error?.message || '未知错误'}`);
        return;
      }

      if (deletable.length > 0) {
        toast.success(`已删除 ${deletable.length} 个报价请求单`, { duration: 3000 });
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
    // 采购侧删除采用“视图墓碑删除”：不删除 Supabase 原始 BJ，避免影响供应商侧“我的报价”
    const tombstoneMarkers = Array.from(
      new Set(
        deletedQuotationRows.flatMap((q: any) => getQuotationMarkers(q))
      )
    );
    addTombstones('qt', tombstoneMarkers, {
      reason: 'manual-hide-admin-supplier-quotation',
      deletedBy: user?.email || 'admin',
    });

    toast.success(`已从采购侧列表删除 ${ids.length} 条供应商报价`, { duration: 3000 });

    // 下游(BJ)删除后：上游(XJ)立即恢复为可编辑/可下推（状态从 quoted 回滚到 sent）
    const remainingQuotationList = supplierQuotations.filter((q: any) => !ids.includes(String(q.id)));
    await Promise.all(deletedQuotationRows.map(async (q: any) => {
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

    await loadSupplierQuotationsFromApi();
    setSelectedQuotationIds([]);
  };

  // 🔥 批量删除采购订单
  const handleBatchDeleteOrders = async () => {
    if (selectedOrderIds.length === 0) {
      toast.error('请先选择要删除的采购订单');
      return;
    }
    
    const confirmMessage = `确定要删除选中的 ${selectedOrderIds.length} 个采购订单吗？\n\n⚠️ 此操作不可恢复！`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(selectedOrderIds.map((id) => deletePurchaseOrder(id)));
        toast.success(`已删除 ${selectedOrderIds.length} 个采购订单`, {
          duration: 3000
        });
        setSelectedOrderIds([]);
      } catch (error: any) {
        toast.error(`删除采购订单失败：${error?.message || '未知错误'}`);
      }
    }
  };

  // 🔥 批量删除采购请求
  const handleBatchDeleteProcurementRequests = async () => {
    if (selectedProcurementRequestIds.length === 0) {
      toast.error('请先选择要删除的采购请求');
      return;
    }

    const confirmMessage = `确定要删除选中的 ${selectedProcurementRequestIds.length} 个采购请求吗？\n\n⚠️ 此操作不可恢复！`;
    if (!window.confirm(confirmMessage)) return;

    const rows = purchaseOrders.filter((po) => selectedProcurementRequestIds.includes(po.id));
    const deletable = rows.filter((po) => !hasDownstreamPOForProcurementRequest(po));
    const blocked = rows.filter((po) => hasDownstreamPOForProcurementRequest(po));

    if (deletable.length > 0) {
      try {
        await Promise.all(deletable.map((po) => deletePurchaseOrder(po.id)));
        toast.success(`已删除 ${deletable.length} 个采购请求`, {
          duration: 3000,
        });
      } catch (error: any) {
        toast.error(`删除采购请求失败：${error?.message || '未知错误'}`);
        return;
      }
    }
    if (blocked.length > 0) {
      toast.error(`有 ${blocked.length} 个采购请求已存在下游采购单(PO)，已禁止删除`, {
        duration: 4000,
      });
    }
    setSelectedProcurementRequestIds([]);
  };

  const handleDeleteProcurementRequest = async (po: PurchaseOrderType) => {
    if (hasDownstreamPOForProcurementRequest(po)) {
      toast.error('该采购请求已存在下游采购单(PO)，禁止删除上游记录');
      return;
    }
    if (!window.confirm(`确定要删除采购请求 "${po.poNumber}" 吗？\n\n⚠️ 此操作不可恢复！`)) return;
    try {
      await deletePurchaseOrder(po.id);
      toast.success('采购请求已删除');
    } catch (error: any) {
      toast.error(`删除采购请求失败：${error?.message || '未知错误'}`);
    }
  };

  // 🔥 编辑询价单
  const handleEditXJ = (xj: XJ) => {
    setEditingXJ(xj);
    // 深拷贝documentData，确保编辑不影响原数据，并与列表XJ单号强制对齐
    const cloned = JSON.parse(JSON.stringify(xj.documentData || {}));
    cloned.xjNo = xj.supplierXjNo || cloned.xjNo || '';
    setEditXJData(cloned);
    setShowEditXJDialog(true);
  };

  // 🔥 保存编辑的询价单
  const handleSaveEditXJ = async () => {
    if (!editingXJ || !editXJData) return;
    const normalizedRfqNo = String(editingXJ.supplierXjNo || editXJData?.xjNo || '').trim();
    const normalizedDocumentData = {
      ...editXJData,
      xjNo: normalizedRfqNo || editXJData?.xjNo || '',
    };
    
    // 更新XJ，包括完整的documentData
    try {
      await updateXJ(editingXJ.id, {
        documentData: normalizedDocumentData,
        documentDataSnapshot: normalizedDocumentData,
        supplierXjNo: normalizedRfqNo || editingXJ.supplierXjNo,
        quotationDeadline: normalizedDocumentData.requiredResponseDate,
        expectedDate: normalizedDocumentData.requiredDeliveryDate,
        products: normalizedDocumentData.products?.map((p: any) => ({
          id: p.no?.toString() || String(Math.random()),
          productName: p.description,
          modelNo: getFormalBusinessModelNo(p),
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
      setEditXJData(null);
    } catch (error: any) {
      toast.error(`询价单更新失败：${error?.message || '未知错误'}`);
    }
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
      const templateSnapshot = (xj as any).templateSnapshot || (xj as any).template_snapshot || null;
      const documentData = (xj as any).documentDataSnapshot || (xj as any).document_data_snapshot || null;
      if (!documentData) {
        throw new Error('该 XJ 未绑定模板中心版本快照，无法下推供应商');
      }

      await updateXJ(xj.id, {
        status: 'sent' as any,
        sentDate: new Date().toISOString().split('T')[0],
        templateSnapshot: templateSnapshot || { pendingResolution: true },
        documentDataSnapshot: documentData,
      });
    } catch (error: any) {
      toast.error(`下推失败：${error?.message || '未知错误'}`);
      return;
    }


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
    return String(item?.id || getFormalBusinessModelNo(item) || `${index}`);
  };

  const getProductMatchToken = (item: PurchaseOrderItem, index: number) => {
    const key = getPOProductAllocationKey(item, index);
    const name = String(item?.productName || '').trim().toLowerCase();
    const model = String(getFormalBusinessModelNo(item) || '').trim().toLowerCase();
    return `${key}|${name}|${model}`;
  };

  const allocatedProductTokensInDialog = useMemo(() => {
    if (!allocationPO) return new Set<string>();
    const parentNo = String(allocationPO.poNumber || '').trim();
    if (!parentNo) return new Set<string>();

    const children = purchaseOrders.filter((po) => {
      const parent = String(po.parentRequestPoNumber || '').trim();
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
            String(getFormalBusinessModelNo(ci) || '').trim().toLowerCase() !== '' &&
            String(getFormalBusinessModelNo(ci) || '').trim().toLowerCase() === String(getFormalBusinessModelNo(item) || '').trim().toLowerCase();
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
        const linkedQuotation = getPOQuoteCandidates(po, supplierCode)[0] || null;
        const supplierInquiryNo = String(
          linkedQuotation?.sourceXJ ||
          linkedQuotation?.sourceXJNumber ||
          linkedQuotation?.xjNumber ||
          '',
        ).trim();
        const supplierQuotationNo = String(
          linkedQuotation?.quotationNo ||
          linkedQuotation?.bjNumber ||
          linkedQuotation?.quotationNumber ||
          '',
        ).trim();
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
        const allocatedOrder = {
          ...po,
          id: `po-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          poNumber: newPoNumber,
          documentType: 'CG',
          approvalStatus: 'draft',
          executionStatus: 'draft',
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
          createdBy: user?.id || user?.email || user?.name || po.createdBy || 'procurement',
          operatorUserId: user?.id || null,
          operatorEmail: user?.email || null,
          operatorRole: user?.role || user?.userRole || null,
          authenticatedUserId: user?.id || null,
          authenticatedUserEmail: user?.email || null,
          authenticatedUserRole: user?.role || user?.userRole || null,
          procurementRequestStatus: 'draft_allocated',
          prValidationStatus: 'pending',
          // Phase 3b: explicit PR → CG linkage — written overtly, not just inherited via ...po spread.
          // These three fields are the structural contract that makes the CG traceable back through
          // the PR tier to its originating SC. Do not remove these explicit assignments.
          parentRequestPoNumber: po.poNumber,        // typed backlink to parent PR
          sourceRef: po.sourceRef,                   // SC number — explicit SC traceability on CG
          salesContractNumber: po.salesContractNumber, // SC number — explicit SC traceability on CG
          xjNumber: supplierInquiryNo || po.xjNumber || '',
          selectedBjId: linkedQuotation?.id || po.selectedBjId || null,
          bjLockedAt: po.bjLockedAt || null,
        } as any;
        allocatedOrder.templateSnapshot = { pendingResolution: true };
        allocatedOrder.documentRenderMeta = {
          ...(po.documentRenderMeta || po.document_render_meta || {}),
          supplierPortalLinkage: {
            supplierXjNo: supplierInquiryNo || null,
            supplierBjNo: supplierQuotationNo || null,
            supplierQuotationId: linkedQuotation?.id || null,
            supplierCode: supplier.code || null,
          },
        };
        allocatedOrder.documentDataSnapshot = buildPurchaseOrderDocumentSnapshot(allocatedOrder);
        allocatedOrder.documentDataSnapshot = {
          ...allocatedOrder.documentDataSnapshot,
          editForm: {
            ...(allocatedOrder.documentDataSnapshot?.editForm || {}),
            xjNumber: supplierInquiryNo || allocatedOrder.documentDataSnapshot?.editForm?.xjNumber || '',
            supplierQuotationNo: supplierQuotationNo || allocatedOrder.documentDataSnapshot?.editForm?.supplierQuotationNo || '',
          },
        };
        await addPurchaseOrder(allocatedOrder);
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
        await updatePurchaseOrder(po.id, {
          items: tracedRemainingItems,
          totalAmount: remainingAmount,
          currency: remainingCurrencies[0] || normalizeCurrencyCode(po.currency || 'USD') || 'USD',
          documentType: 'PR',
          executionStatus: 'partially_allocated',
          approvalStatus: 'not_required',
          procurementRequestStatus: 'partial_allocated',
          status: 'pending',
          supplierAllocationReady: true,
          allocatedSupplierCount: distribution.length,
          pendingSupplierPONumbers: createdPONumbers,
          updatedDate: new Date().toISOString(),
        });
      } else {
        // 全部分配完成：保留采购请求记录，仅更新状态（不消失）
        await updatePurchaseOrder(po.id, {
          documentType: 'PR',
          executionStatus: 'fully_allocated',
          approvalStatus: 'not_required',
          procurementRequestStatus: 'allocated_completed',
          supplierAllocationReady: true,
          allocatedSupplierCount: distribution.length,
          pendingSupplierPONumbers: createdPONumbers,
          status: 'confirmed',
          updatedDate: new Date().toISOString(),
        });
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
  const handleCreateOrderFromRequirement = (req: QuoteRequirement) => {
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
  // ⚠️ LEGACY PATH (Phase 3b): Direct CG creation from QR — bypasses the PR tier.
  // This path creates a CG record directly from a QuoteRequirement without a parent PR.
  // The standard path is: SC → PR (requestProcurementFromContract) → CG (submitSupplierAllocation).
  // This function is retained for admin convenience but is classified as non-standard.
  // Distinguishing marker: the resulting CG record will NOT have parentRequestPoNumber set,
  // meaning it has no formal PR ancestor in the procurement chain.
  //
  // Phase 3d: The "直接下单" entry point in QuoteRequirementsTab has been visually downgraded
  // (outline/gray vs solid colour) to signal non-standard status to operators.
  const handleSubmitCreateOrder = async () => {
    if (!selectedRequirement) return;

    // ── Standard-path guard (Phase 3d enforcement) ────────────────────────────
    // If the SC referenced by this QR already has a standard PR (poNumber starts
    // with 'PR-' and salesContractNumber matches), block direct-CG creation.
    // The standard path is SC → PR → CG (via submitSupplierAllocation).
    // Detection: sourceRef on QR stores the SC.contractNumber.
    const scContractNumber = String(selectedRequirement.sourceRef || '').trim();
    if (scContractNumber) {
      const hasStandardPR = purchaseOrders.some(
        (po) =>
          String(po.poNumber || '').trim().startsWith('PR-') &&
          String(po.salesContractNumber || '').trim() === scContractNumber,
      );
      if (hasStandardPR) {
        toast.error('该合同已进入标准采购流程（PR），请通过PR分配生成CG，不可再使用直接下单。');
        return;
      }
    }

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
        modelNo: getFormalBusinessModelNo(item),
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
    // Note (Phase 3b): parentRequestPoNumber is intentionally absent here — this is the legacy
    // direct-CG path. CG records created by the standard path (submitSupplierAllocation) always
    // carry parentRequestPoNumber linking back to their parent PR.
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
        modelNo: getFormalBusinessModelNo(item),
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
      createdBy: user?.id || user?.email || user?.name || 'procurement',
      createdDate: today.toISOString(),
      operatorUserId: user?.id || null,
      operatorEmail: user?.email || null,
      operatorRole: user?.role || user?.userRole || null,
      authenticatedUserId: user?.id || null,
      authenticatedUserEmail: user?.email || null,
      authenticatedUserRole: user?.role || user?.userRole || null,
    };
    (newPurchaseOrder as any).templateSnapshot = { pendingResolution: true };
    (newPurchaseOrder as any).documentRenderMeta = null;
    (newPurchaseOrder as any).documentDataSnapshot = buildPurchaseOrderDocumentSnapshot(newPurchaseOrder);

    try {
      await addPurchaseOrder(newPurchaseOrder);
      await updateRequirement(selectedRequirement.id, {
        status: 'completed'
      });
    } catch (error: any) {
      toast.error(`创建采购订单失败：${error?.message || '未知错误'}`);
      return;
    }

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
        <p className="text-xs text-green-600">✓ QR 已标记完成</p>
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

  const ensureBoundQuoteRequirementSnapshot = (req: QuoteRequirement | null | undefined) => {
    if (!req) return false;
    const templateSnapshot = (req as any).templateSnapshot || (req as any).template_snapshot || null;
    const templateVersion = templateSnapshot?.version || null;
    const documentData = (req as any).documentDataSnapshot || (req as any).document_data_snapshot || null;
    if (!templateVersion || !documentData) {
      toast.error('该 QR 未绑定模板中心版本快照，无法继续流转');
      return false;
    }
    return true;
  };

  const hasPositiveQrPricingPayload = React.useCallback((req: QuoteRequirement) => {
    const feedbackProducts = Array.isArray(req.purchaserFeedback?.products)
      ? req.purchaserFeedback.products
      : [];
    return feedbackProducts.some((product: any) => {
      const unitPrice = Number(product?.sourcePricing?.unitPrice ?? product?.costPrice ?? 0);
      const amount = Number(product?.amount ?? 0);
      return (Number.isFinite(unitPrice) && unitPrice > 0) || (Number.isFinite(amount) && amount > 0);
    });
  }, []);

  // 🔥 处理智能采购反馈 - 一键流转
  const handleSmartFeedback = (req: QuoteRequirement) => {
    if (!ensureBoundQuoteRequirementSnapshot(req)) return;
    setFeedbackRequirement(req);
    setShowFeedbackForm(true);
  };

  // 🔥 下推业务员询报（采购侧仅做下推动作，不创建业务员报价）
  const handlePushToSalesInquiry = async (req: QuoteRequirement) => {
    const hasActualPush = Boolean(
      req.pushedToQuotation &&
      (
        String(req.pushedToQuotationDate || '').trim() ||
        String(req.pushedBy || '').trim() ||
        String((req as any).quotationNumber || '').trim()
      ) &&
      hasPositiveQrPricingPayload(req)
    );

    const pushTimestamp = new Date().toISOString();
    try {
      const pushedWithoutFeedback = !req.purchaserFeedback;
      const enrichedPurchaserFeedback = await enrichPurchaserFeedbackWithSupplierQuoteData(req);
      const resolvedOwner = resolveQuoteRequirementOwner(req, inquiries, {
        email: user?.email || '',
        name: user?.name || '',
      });
      const existingTemplateSnapshot =
        (req as any).templateSnapshot ||
        (req as any).template_snapshot ||
        null;
      const nextRequirement = {
        ...req,
        templateSnapshot: existingTemplateSnapshot || { pendingResolution: true },
        template_snapshot: existingTemplateSnapshot || { pendingResolution: true },
        purchaserFeedback: enrichedPurchaserFeedback || req.purchaserFeedback,
        requestedBy: resolvedOwner.email || req.requestedBy || null,
        requestedByName: resolvedOwner.name || req.requestedByName || null,
        ownerEmail: resolvedOwner.email || req.ownerEmail || null,
        ownerName: resolvedOwner.name || req.ownerName || null,
        ownerRole: req.ownerRole || 'Sales_Rep',
        pushedToQuotation: true,
        pushedToQuotationDate: pushTimestamp,
        pushedBy: user?.email || user?.name || 'procurement',
      } as QuoteRequirement;
      const nextDocumentSnapshot = buildQuoteRequirementDocumentSnapshot(
        nextRequirement,
        user?.type || user?.role,
        { forceRebuild: true },
      );
      await updateRequirement(req.id, {
        templateSnapshot: existingTemplateSnapshot || { pendingResolution: true },
        template_snapshot: existingTemplateSnapshot || { pendingResolution: true },
        purchaserFeedback: enrichedPurchaserFeedback || req.purchaserFeedback,
        requestedBy: resolvedOwner.email || req.requestedBy || null,
        requestedByName: resolvedOwner.name || req.requestedByName || null,
        ownerEmail: resolvedOwner.email || req.ownerEmail || null,
        ownerName: resolvedOwner.name || req.ownerName || null,
        ownerRole: req.ownerRole || 'Sales_Rep',
        pushedToQuotation: true,
        pushedToQuotationDate: pushTimestamp,
        pushedBy: user?.email || user?.name || 'procurement',
        documentDataSnapshot: nextDocumentSnapshot,
        document_data_snapshot: nextDocumentSnapshot as any,
      });
      await refreshQuoteRequirementsFromApi();
      toast.success(
        hasActualPush
          ? '已重新反馈业务员询报'
          : pushedWithoutFeedback
            ? '已反馈业务员询报（未附采购反馈）'
            : '已反馈业务员询报'
      );
    } catch (error: any) {
      toast.error(`同步 QR 状态失败：${error?.message || '未知错误'}`);
    }
  };

  // 🔥 保存采购反馈（仅保存，不在此处下推）
  const handleSubmitFeedback = async (feedback: PurchaserFeedback) => {
    if (!feedbackRequirement) return;
    if (!ensureBoundQuoteRequirementSnapshot(feedbackRequirement)) return;
    
    console.log('🔥 [采购反馈] 提交反馈，QR信息:', {
      qrId: feedbackRequirement.id,
      qrNumber: feedbackRequirement.requirementNo,
      createdBy: feedbackRequirement.createdBy,
      feedbackData: feedback
    });
    
    try {
      const nextRequirement = {
        ...feedbackRequirement,
        purchaserFeedback: feedback,
        status: 'completed' as const,
      } as QuoteRequirement;
      const nextDocumentSnapshot = buildQuoteRequirementDocumentSnapshot(
        nextRequirement,
        user?.type || user?.role,
        { forceRebuild: true },
      );

      await updateRequirement(feedbackRequirement.id, {
        purchaserFeedback: feedback,
        status: 'completed',
        documentDataSnapshot: nextDocumentSnapshot,
        document_data_snapshot: nextDocumentSnapshot as any,
      });
      await refreshQuoteRequirementsFromApi();

      toast.success('✅ 采购反馈已保存', {
        description: '已同步刷新 QR 单据，并自动打开最新预览',
        duration: 4000
      });
      
      setShowFeedbackForm(false);
      const syncedRequirement = {
        ...nextRequirement,
        documentDataSnapshot: nextDocumentSnapshot,
      } as QuoteRequirement;
      setFeedbackRequirement(syncedRequirement);
      setViewRequirement(syncedRequirement);
      setShowRequirementDialog(true);
    } catch (error: any) {
      toast.error(`同步 QR 状态失败：${error?.message || '未知错误'}`);
    }
  };

  const handleSaveEditedRequirement = async (updates: Partial<QuoteRequirement>) => {
    if (!editingRequirement) return;

    try {
      setSavingRequirementEdit(true);
      const nextRequirement = {
        ...editingRequirement,
        ...updates,
        items: Array.isArray(updates.items) ? updates.items : editingRequirement.items,
      } as QuoteRequirement;
      const nextDocumentSnapshot = buildQuoteRequirementDocumentSnapshot(
        nextRequirement,
        user?.type || user?.role,
        { forceRebuild: true },
      );

      await updateRequirement(editingRequirement.id, {
        ...updates,
        items: nextRequirement.items,
        documentDataSnapshot: nextDocumentSnapshot,
        document_data_snapshot: nextDocumentSnapshot as any,
      });
      await refreshQuoteRequirementsFromApi();
      setEditingRequirement({
        ...nextRequirement,
        documentDataSnapshot: nextDocumentSnapshot,
      });
      setShowEditRequirementDialog(false);
      toast.success('报价请求单已更新');
    } catch (error: any) {
      toast.error(`保存报价请求单失败：${error?.message || '未知错误'}`);
    } finally {
      setSavingRequirementEdit(false);
    }
  };

  // 🔥 处理删除采购订单
  const handleDeletePurchaseOrder = async (po: PurchaseOrderType) => {
    const firstProductName = po.items?.[0]?.productName || 'N/A';
    if (window.confirm(`确定要删除采购订单 "${po.poNumber}" 吗？\n\n供应商: ${po.supplierName}\n产品: ${firstProductName}\n金额: ${po.currency} ${po.totalAmount.toLocaleString()}\n\n⚠️ 此操作不可恢复！`)) {
      try {
        await deletePurchaseOrder(po.id);
        toast.success('采购订单已删除', {
          description: `${po.poNumber} - ${po.supplierName}`,
          duration: 3000
        });
      } catch (error: any) {
        toast.error(`删除采购订单失败：${error?.message || '未知错误'}`);
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
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
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">待审批</span>
            <Clock className="w-3 h-3 text-amber-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">执行中</span>
            <Truck className="w-3 h-3 text-blue-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.producing}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">已完成</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-gray-900">{stats.completed}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[14px] text-gray-500">采购总额</span>
            <DollarSign className="w-3 h-3 text-[#F96302]" />
          </div>
          <p className="text-lg font-bold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</p>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="bg-white border border-gray-200 rounded flex flex-1 min-h-0 flex-col">
        <Tabs value={activeTab} onValueChange={(v) => {
          setActiveTab(v as any);
          if (v === 'orders') {
            requestPurchaseOrders();
          }
          if (v === 'procurement-requests') {
            setProcurementRequestSearchTerm('');
          }
        }} className="w-full flex-1 min-h-0">
          <div className="border-b border-gray-200 px-3">
            <TabsList className="bg-transparent h-auto p-0 gap-4">
              <TabsTrigger 
                value="requirements" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-rose-600 data-[state=active]:bg-transparent data-[state=active]:text-rose-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                报价请求池（QR）
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
                询价管理（XJ）
              </TabsTrigger>

              <TabsTrigger 
                value="supplier-quotations" 
                className="bg-transparent border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:bg-transparent data-[state=active]:text-green-700 rounded-none px-0 pb-2 pt-2 text-[14px] font-medium relative"
              >
                供应商报价（BJ）
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
                采购请求池（PR）
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
                采购订单（CG）
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ==================== Tab 1: QR池 ==================== */}
          <QuoteRequirementsTab
            requirementStats={requirementStats}
            requirementSearchTerm={requirementSearchTerm}
            setRequirementSearchTerm={setRequirementSearchTerm}
            selectedRequirementIds={selectedRequirementIds}
            setSelectedRequirementIds={setSelectedRequirementIds}
            filteredRequirements={filteredRequirements}
            handleBatchDeleteRequirements={handleBatchDeleteRequirements}
        hasDownstreamXJForRequirement={hasDownstreamXJForRequirement}
        setViewRequirement={setViewRequirement}
        setShowRequirementDialog={setShowRequirementDialog}
        setEditingRequirement={setEditingRequirement}
        setShowEditRequirementDialog={setShowEditRequirementDialog}
        handleCreateXJFromRequirement={handleCreateXJFromRequirement}
            handleCreateOrderFromRequirement={handleCreateOrderFromRequirement}
            handleSmartFeedback={handleSmartFeedback}
            handlePushToSalesInquiry={handlePushToSalesInquiry}
            deleteRequirement={deleteRequirement}
          />

          {/* ==================== Tab 2: 询价管理 ==================== */}
          <XJManagementTab
            xjs={xjs}
            xjSearchTerm={xjSearchTerm}
            setXJSearchTerm={setXJSearchTerm}
            selectedXJIds={selectedXJIds}
            setSelectedXJIds={setSelectedXJIds}
            filteredXJs={filteredXJs}
            handleBatchDeleteXJs={handleBatchDeleteXJs}
            hasDownstreamQuotationForXJ={hasDownstreamQuotationForXJ}
            openXJPreview={openXJPreview}
            handleEditXJ={handleEditXJ}
            handleSubmitXJToSupplier={handleSubmitXJToSupplier}
          />

          {/* ==================== Tab 3: 供应商报价 ==================== */}
          <SupplierQuotationsTab
            supplierQuotations={supplierQuotations}
            quotationSearchTerm={quotationSearchTerm}
            setQuotationSearchTerm={setQuotationSearchTerm}
            loadSupplierQuotationsFromApi={loadSupplierQuotationsFromApi}
            selectedQuotationIds={selectedQuotationIds}
            setSelectedQuotationIds={setSelectedQuotationIds}
            handleBatchDeleteQuotations={handleBatchDeleteQuotations}
            filteredQuotations={filteredQuotations}
            setSelectedSupplierQuotation={setSelectedSupplierQuotation}
            setShowSupplierQuotationDialog={setShowSupplierQuotationDialog}
            applyLocalQuotationStatus={applyLocalQuotationStatus}
            setAcceptedQuotationNo={setAcceptedQuotationNo}
            setShowFeedbackReminderDialog={setShowFeedbackReminderDialog}
          />

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
            handleValidateProcurementRequest={handleValidateProcurementRequest}
            handleDeletePurchaseOrder={handleDeletePurchaseOrder}
            normalizeCGNumberForDisplay={normalizeCGNumberForDisplay}
            resolveInquirySourceRef={resolveInquirySourceRef}
            resolveQuotationSourceRef={resolveQuotationSourceRef}
            resolveSupplierInquiryRef={resolveSupplierInquiryRef}
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

      <QuoteRequirementPreviewDialog
        showRequirementDialog={showRequirementDialog}
        setShowRequirementDialog={setShowRequirementDialog}
        viewRequirement={viewRequirement}
        userRole={user?.role || user?.userRole}
        supplierQuotations={supplierQuotations}
      />

      <EditQuoteRequirementDialog
        open={showEditRequirementDialog}
        onOpenChange={(open) => {
          setShowEditRequirementDialog(open);
          if (!open) setEditingRequirement(null);
        }}
        requirement={editingRequirement}
        saving={savingRequirementEdit}
        onSave={handleSaveEditedRequirement}
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
        showCreateXJDialog={showCreateXJDialog}
        setShowCreateXJDialog={setShowCreateXJDialog}
        selectedRequirementForXJ={selectedRequirementForXJ}
        selectedProductIds={selectedProductIds}
        setSelectedProductIds={setSelectedProductIds}
        selectedSuppliers={selectedSuppliers}
        setSelectedSuppliers={setSelectedSuppliers}
        supplierSearchTerm={supplierSearchTerm}
        setSupplierSearchTerm={setSupplierSearchTerm}
        allSuppliers={allSuppliers}
        handlePreviewXJ={handlePreviewXJ}
        xjDeadline={xjDeadline}
        setXJDeadline={setXJDeadline}
        xjRemarks={xjRemarks}
        setXJRemarks={setXJRemarks}
        handleSubmitXJ={handleSubmitXJ}
        submittingXJ={submittingXJ}
        showXJHistoryDialog={showXJHistoryDialog}
        setShowXJHistoryDialog={setShowXJHistoryDialog}
        selectedProductForHistory={selectedProductForHistory}
        setSelectedProductForHistory={setSelectedProductForHistory}
      />
      
      <XJPreviewDialog
        showXJPreview={showXJPreview}
        setShowXJPreview={setShowXJPreview}
        currentXJData={currentXJData}
        projectExecutionBaseline={currentXJBaseline}
        xjDocRef={xjDocRef}
        handleExportXJPDF={handleExportXJPDF}
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
        setEditXJData={setEditXJData}
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
          preferredBJNumber={acceptedSupplierQuotation?.quotationNo}
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
          onSubmit={async (quoteData) => {
            
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
                sku: item.sku || getFormalBusinessModelNo(item) || '',
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
              paymentTerms: buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment'),
              notes: quoteData.approvalNotes || '',
              // 🔥 审批流程信息（待提交审核时使用）
              approvalNotes: quoteData.approvalNotes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              templateSnapshot: { pendingResolution: true },
              documentRenderMeta: null,
            };
            (newQuotation as any).documentDataSnapshot = adaptLegacyQuotationToDocumentData(newQuotation);
            
            // 🔥 保存到QuotationContext
            await addQuotation(newQuotation as any);
            
            
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
        <FeedbackReminderDialog
          acceptedQuotationNo={acceptedQuotationNo}
          onClose={() => setShowFeedbackReminderDialog(false)}
          onNavigateToRequirements={navigateAcceptedQuotationToFeedback}
        />
      )}
    </div>
  );
};

export default PurchaseOrderManagementEnhanced;
