/**
 * 🔥 应收账款管理 - 财务模块（Admin & 财务专员通用）
 * 
 * 表格列结构：
 * - 序号
 * - 订单编号（SC-开头）
 * - 客户信息
 * - 订单金额
 * - 定金-客户付款凭证（2个状态区域）
 * - 定金-财务收款凭证（2个状态区域）
 * - 余款-客户付款凭证（2个状态区域）
 * - 余款-财务收款凭证（2个状态区域）
 * - 操作
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload,
  FileText,
  AlertCircle,
  Download,
  Building,
  FileCheck,
  X,
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckSquare
} from 'lucide-react';
import { useOrders } from '../../contexts/OrderContext';
import { useFinance } from '../../contexts/FinanceContext';
import { usePayments } from '../../contexts/PaymentContext';
import { useSalesContracts } from '../../contexts/SalesContractContext';
import { getCurrentUser } from '../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { orderService } from '../../lib/supabaseService';
import { paymentProofStorage } from '../../lib/storageService';
import { generateAccountsReceivableNumber } from '../../utils/xjNumberGenerator';
import { deriveReceivableStatus } from '../../lib/financeReceivableFlow';
import { ReceivableProofCell } from './receivables/ReceivableProofCell';

export function AccountsReceivableList() {
  const { orders, updateOrder } = useOrders();
  const { accountsReceivable, addAccountReceivable, updateARByOrderNumber } = useFinance();
  const { addPayment } = usePayments();
  const { contracts, getContractByContractNumber, confirmDeposit } = useSalesContracts();
  const currentUser = getCurrentUser();
  const autoBackfilledContractsRef = useRef<Set<string>>(new Set());
  const normalizeCustomerProof = (proof: any, fallbackAmount = 0, fallbackCurrency = 'USD') => {
    if (!proof) return undefined;
    return {
      ...proof,
      amount: Number(proof.amount || fallbackAmount || 0),
      currency: proof.currency || fallbackCurrency,
      uploadedAt: proof.uploadedAt || proof.receiptDate || null,
    };
  };
  const normalizeReceiptProof = (proof: any, fallbackAmount = 0, fallbackCurrency = 'USD') => {
    if (!proof) return undefined;
    return {
      ...proof,
      amount: Number(proof.amount || proof.actualAmount || fallbackAmount || 0),
      actualAmount: Number(proof.actualAmount || proof.amount || fallbackAmount || 0),
      currency: proof.currency || fallbackCurrency,
      uploadedAt: proof.uploadedAt || proof.receiptDate || null,
    };
  };
  const resolveBackendPublicUrl = (fileUrl?: string | null) => {
    if (!fileUrl) return '';
    if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
      return fileUrl;
    }
    return paymentProofStorage.getPublicUrl(fileUrl);
  };
  const getProofFileName = (proof?: any) => {
    const explicitName = String(proof?.fileName || '').trim();
    if (explicitName) return explicitName;
    const sourceUrl = String(proof?.fileUrl || '').trim();
    if (!sourceUrl) return 'proof-file';
    try {
      const parsed = sourceUrl.startsWith('http') ? new URL(sourceUrl) : null;
      const pathname = parsed?.pathname || sourceUrl;
      const rawName = pathname.split('/').filter(Boolean).pop() || 'proof-file';
      return decodeURIComponent(rawName);
    } catch {
      const rawName = sourceUrl.split('/').filter(Boolean).pop() || 'proof-file';
      return decodeURIComponent(rawName.split('?')[0] || 'proof-file');
    }
  };
  const formatDisplayDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString('zh-CN');
  };
  const formatDisplayDateTime = (value?: string | null) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleString('zh-CN');
  };
  const toPositiveNumber = (value: unknown) => {
    const numeric = Number(value || 0);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  };
  const resolveExpectedDepositAmount = (params: {
    totalAmount: number;
    contract?: any;
    depositPaymentProof?: any;
    depositReceiptProof?: any;
  }) => {
    const explicitAmount = [
      params.contract?.depositAmount,
      params.depositPaymentProof?.amount,
      params.depositReceiptProof?.actualAmount,
    ].map(toPositiveNumber).find((amount) => amount > 0);
    if (explicitAmount) return explicitAmount;
    return toPositiveNumber(params.totalAmount) * 0.3;
  };
  const resolveExpectedBalanceAmount = (params: {
    totalAmount: number;
    contract?: any;
    balancePaymentProof?: any;
    balanceReceiptProof?: any;
    depositAmount: number;
  }) => {
    const explicitAmount = [
      params.contract?.balanceAmount,
      params.balancePaymentProof?.amount,
      params.balanceReceiptProof?.actualAmount,
    ].map(toPositiveNumber).find((amount) => amount > 0);
    if (explicitAmount) return explicitAmount;
    return Math.max(toPositiveNumber(params.totalAmount) - toPositiveNumber(params.depositAmount), 0);
  };
  const normalizeReceiptDateInput = (value: string) => value.replace(/\//g, '-').trim();
  const isImageProof = (proof?: any) => {
    const target = String(getProofFileName(proof) || proof?.fileUrl || '').toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].some((ext) => target.includes(ext));
  };
  const openProofInNewWindow = (proof?: any) => {
    const previewUrl = resolveBackendPublicUrl(proof?.fileUrl);
    if (!previewUrl) {
      toast.error('未找到凭证文件地址');
      return;
    }
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };
  const downloadProofFile = (proof?: any) => {
    const previewUrl = resolveBackendPublicUrl(proof?.fileUrl);
    if (!previewUrl) {
      toast.error('未找到可下载的凭证文件');
      return;
    }
    const link = document.createElement('a');
    link.href = previewUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = getProofFileName(proof);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 进入应收账款页面时主动请求一次订单列表（GET /api/orders）
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ordersUpdated'));
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  
  // 🔥 Dialog状态
  const [uploadDialog, setUploadDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [notifyDialog, setNotifyDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proofType, setProofType] = useState<'depositReceipt' | 'balanceReceipt'>('depositReceipt');
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  // 🔥 通知表单数据
  const [notifyData, setNotifyData] = useState({
    notifyTargets: { salesperson: true, customer: true },
    notifyMethods: { inApp: true, email: true },
    message: ''
  });
  
  // 🔥 上传表单数据
  const [receiptData, setReceiptData] = useState({
    actualAmount: 0,
    receiptDate: new Date().toISOString().split('T')[0],
    bankReference: '',
    fileUrl: '',
    fileName: '',
    notes: ''
  });
  
  // 🔥 文件上传状态
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedReceiptFile, setSelectedReceiptFile] = useState<File | null>(null);
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<string>('');
  useEffect(() => {
    return () => {
      if (selectedReceiptPreview.startsWith('blob:')) {
        URL.revokeObjectURL(selectedReceiptPreview);
      }
    };
  }, [selectedReceiptPreview]);
  
  const contractLookup = useMemo(() => {
    const lookup = new Map<string, any>();
    contracts.forEach((contract) => {
      if (contract?.contractNumber) {
        lookup.set(contract.contractNumber, contract);
      }
    });
    return lookup;
  }, [contracts]);

  const orderLookup = useMemo(() => {
    const lookup = new Map<string, any>();
    orders.forEach((order) => {
      if (order?.orderNumber) {
        lookup.set(order.orderNumber, order);
      }
    });
    return lookup;
  }, [orders]);

  useEffect(() => {
    const qualifyingStatuses = new Set(['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'balance_uploaded', 'balance_confirmed', 'completed']);

    contracts.forEach((contract) => {
      if (!contract?.contractNumber || !qualifyingStatuses.has(String(contract.status || ''))) {
        return;
      }
      if (accountsReceivable.some((ar) => ar.orderNumber === contract.contractNumber)) {
        autoBackfilledContractsRef.current.delete(contract.contractNumber);
        return;
      }
      if (autoBackfilledContractsRef.current.has(contract.contractNumber)) {
        return;
      }

      const linkedOrder = orderLookup.get(contract.contractNumber);
      const contractWorkflow = contract.documentRenderMeta?.erpWorkflow || {};
      const depositReceiptProof = normalizeReceiptProof(
        linkedOrder?.depositReceiptProof || contractWorkflow.depositReceiptProof || contractWorkflow.financeReceiptProof,
        contract.depositAmount,
        contract.currency || 'USD',
      );
      const paidAmount = Number(depositReceiptProof?.actualAmount || 0);
      const totalAmount = Number(contract.totalAmount || 0);
      const remainingAmount = Math.max(totalAmount - paidAmount, 0);

      autoBackfilledContractsRef.current.add(contract.contractNumber);
      addAccountReceivable({
        arNumber: generateAccountsReceivableNumber((contract.region || 'NA') as any),
        orderNumber: contract.contractNumber,
        quotationNumber: contract.quotationNumber,
        contractNumber: contract.contractNumber,
        customerName: contract.customerCompany || contract.customerName || 'Unknown Customer',
        customerEmail: contract.customerEmail || '',
        region: contract.region || 'NA',
        invoiceDate: String(contract.customerConfirmedAt || contract.createdAt || new Date().toISOString()).split('T')[0],
        dueDate: String(contract.customerConfirmedAt || contract.createdAt || new Date().toISOString()).split('T')[0],
        totalAmount,
        paidAmount,
        remainingAmount,
        currency: contract.currency || 'USD',
        status: paidAmount > 0
          ? (remainingAmount <= 0 ? 'paid' : 'partially_paid')
          : contract.status === 'deposit_uploaded'
            ? 'proof_uploaded'
            : 'pending',
        paymentTerms: contract.paymentTerms || '',
        products: Array.isArray(contract.products)
          ? contract.products.map((product: any) => ({
              name: product.productName || product.name || 'Product',
              quantity: Number(product.quantity || 0),
              unitPrice: Number(product.unitPrice || 0),
              totalPrice: Number(product.amount || (Number(product.quantity || 0) * Number(product.unitPrice || 0))),
            }))
          : [],
        paymentHistory: paidAmount > 0
          ? [{
              date: depositReceiptProof.receiptDate || String(new Date().toISOString()).split('T')[0],
              amount: paidAmount,
              method: 'T/T',
              reference: depositReceiptProof.bankReference || '',
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: depositReceiptProof.notes || 'Backfilled from linked sales contract receipt proof',
              proofUrl: depositReceiptProof.fileUrl,
              proofFileName: depositReceiptProof.fileName,
            }]
          : [],
        depositProof: normalizeCustomerProof(
          linkedOrder?.depositPaymentProof || contract.depositProof,
          contract.depositAmount,
          contract.currency || 'USD',
        ),
        balanceProof: linkedOrder?.balancePaymentProof || undefined,
        createdBy: currentUser?.email || 'finance@cosunchina.com',
        notes: `Auto-backfilled from sales contract status ${contract.status}`,
      });
    });
  }, [accountsReceivable, addAccountReceivable, contracts, currentUser?.email, orderLookup]);

  // 🔥 筛选需要财务处理的订单（优先使用AR，其次回退到合同）
  const receivableOrders = useMemo(() => {
    const rows: any[] = [];
    const seen = new Set<string>();
    const financeContractStatuses = new Set(['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'balance_uploaded', 'balance_confirmed', 'completed']);

    accountsReceivable.forEach((ar) => {
      if (!ar?.orderNumber?.startsWith('SC-')) {
        return;
      }
      const linkedOrder = orderLookup.get(ar.orderNumber);
      const linkedContract = contractLookup.get(ar.contractNumber || ar.orderNumber);
      const contractWorkflow = linkedContract?.documentRenderMeta?.erpWorkflow || {};
      const latestPayment = Array.isArray(ar.paymentHistory) ? ar.paymentHistory[ar.paymentHistory.length - 1] : undefined;
      const totalAmount = Number(ar.totalAmount || linkedOrder?.totalAmount || linkedContract?.totalAmount || 0);
      const currency = ar.currency || linkedOrder?.currency || linkedContract?.currency || 'USD';
      const depositPaymentProof = normalizeCustomerProof(
        ar.depositProof || linkedOrder?.depositPaymentProof || linkedContract?.depositProof,
        linkedContract?.depositAmount,
        currency,
      );
      const depositReceiptProof = normalizeReceiptProof(
        linkedOrder?.depositReceiptProof
          || contractWorkflow.depositReceiptProof
          || contractWorkflow.financeReceiptProof
          || (latestPayment ? {
            actualAmount: latestPayment.amount,
            receiptDate: latestPayment.date,
            bankReference: latestPayment.reference,
            fileUrl: latestPayment.proofUrl,
            fileName: latestPayment.proofFileName,
          } : undefined),
        linkedContract?.depositAmount,
        currency,
      );
      const balancePaymentProof = ar.balanceProof || linkedOrder?.balancePaymentProof || undefined;
      const balanceReceiptProof = normalizeReceiptProof(
        linkedOrder?.balanceReceiptProof
          || contractWorkflow.balanceReceiptProof
          || contractWorkflow.financeBalanceReceiptProof,
        linkedContract?.balanceAmount,
        currency,
      );
      const depositExpectedAmount = resolveExpectedDepositAmount({
        totalAmount,
        contract: linkedContract,
        depositPaymentProof,
        depositReceiptProof,
      });
      const balanceExpectedAmount = resolveExpectedBalanceAmount({
        totalAmount,
        contract: linkedContract,
        balancePaymentProof,
        balanceReceiptProof,
        depositAmount: depositExpectedAmount,
      });
      const receivedAmount =
        toPositiveNumber(depositReceiptProof?.actualAmount)
        + toPositiveNumber(balanceReceiptProof?.actualAmount);
      const statusSnapshot = deriveReceivableStatus({
        totalAmount,
        receivedAmount,
        paymentMode: linkedContract?.paymentMode || null,
        balanceTrigger: linkedContract?.balanceTrigger || null,
        contractStatus: linkedContract?.status,
        depositProof: depositPaymentProof,
        depositReceiptProof,
        balanceProof: balancePaymentProof,
        balanceReceiptProof,
      });

      rows.push({
        id: ar.id,
        orderRecordId: linkedOrder?.id || null,
        orderNumber: ar.orderNumber,
        customer: ar.customerName || linkedOrder?.customer || linkedContract?.customerCompany || linkedContract?.customerName || 'Unknown Customer',
        customerEmail: ar.customerEmail || linkedOrder?.customerEmail || linkedContract?.customerEmail || '',
        totalAmount,
        currency,
        status: ar.status,
        depositPaymentProof,
        depositReceiptProof,
        balancePaymentProof,
        balanceReceiptProof,
        depositExpectedAmount,
        balanceExpectedAmount,
        arNumber: ar.arNumber,
        contractStatus: linkedContract?.status,
        statusSnapshot,
        source: 'accounts_receivable',
      });
      seen.add(ar.orderNumber);
    });

    contracts.forEach((contract) => {
      if (!contract?.contractNumber?.startsWith('SC-')) {
        return;
      }
      if (seen.has(contract.contractNumber) || !financeContractStatuses.has(String(contract.status || ''))) {
        return;
      }
      const linkedOrder = orderLookup.get(contract.contractNumber);
      const contractWorkflow = contract.documentRenderMeta?.erpWorkflow || {};
      const totalAmount = Number(contract.totalAmount || linkedOrder?.totalAmount || 0);
      const currency = contract.currency || linkedOrder?.currency || 'USD';
      const depositPaymentProof = normalizeCustomerProof(
        linkedOrder?.depositPaymentProof || contract.depositProof,
        contract.depositAmount,
        currency,
      );
      const depositReceiptProof = normalizeReceiptProof(
        linkedOrder?.depositReceiptProof || contractWorkflow.depositReceiptProof || contractWorkflow.financeReceiptProof,
        contract.depositAmount,
        currency,
      );
      const balancePaymentProof = linkedOrder?.balancePaymentProof || undefined;
      const balanceReceiptProof = normalizeReceiptProof(
        linkedOrder?.balanceReceiptProof || contractWorkflow.balanceReceiptProof || contractWorkflow.financeBalanceReceiptProof,
        contract.balanceAmount,
        currency,
      );
      const depositExpectedAmount = resolveExpectedDepositAmount({
        totalAmount,
        contract,
        depositPaymentProof,
        depositReceiptProof,
      });
      const balanceExpectedAmount = resolveExpectedBalanceAmount({
        totalAmount,
        contract,
        balancePaymentProof,
        balanceReceiptProof,
        depositAmount: depositExpectedAmount,
      });
      const receivedAmount =
        toPositiveNumber(depositReceiptProof?.actualAmount)
        + toPositiveNumber(balanceReceiptProof?.actualAmount);
      const statusSnapshot = deriveReceivableStatus({
        totalAmount,
        receivedAmount,
        paymentMode: contract.paymentMode || null,
        balanceTrigger: contract.balanceTrigger || null,
        contractStatus: contract.status,
        depositProof: depositPaymentProof,
        depositReceiptProof,
        balanceProof: balancePaymentProof,
        balanceReceiptProof,
      });
      rows.push({
        id: contract.id,
        orderRecordId: linkedOrder?.id || null,
        orderNumber: contract.contractNumber,
        customer: contract.customerCompany || contract.customerName || linkedOrder?.customer || 'Unknown Customer',
        customerEmail: contract.customerEmail || linkedOrder?.customerEmail || '',
        totalAmount,
        currency,
        status: contract.status,
        depositPaymentProof,
        depositReceiptProof,
        balancePaymentProof,
        balanceReceiptProof,
        depositExpectedAmount,
        balanceExpectedAmount,
        contractStatus: contract.status,
        statusSnapshot,
        source: 'sales_contract',
      });
      seen.add(contract.contractNumber);
    });

    return rows.filter((order) => {
      if (!order.orderNumber?.startsWith('SC-')) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          String(order.orderNumber || '').toLowerCase().includes(term) ||
          String(order.customer || '').toLowerCase().includes(term) ||
          String(order.customerEmail || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [accountsReceivable, contractLookup, contracts, orderLookup, searchTerm]);
  
  // 🔥 统计信息
  const stats = useMemo(() => {
    const total = receivableOrders.length;
    const depositPending = receivableOrders.filter(
      (o) => o.statusSnapshot?.depositStageLabel === '待财务确认定金到账',
    ).length;
    const balancePending = receivableOrders.filter(
      (o) => o.statusSnapshot?.balanceStageLabel === '待财务确认余款到账',
    ).length;
    const depositReceived = receivableOrders.filter(
      (o) => o.statusSnapshot?.depositStageLabel === '定金已确认到账',
    ).length;
    const balanceReceived = receivableOrders.filter(
      (o) => o.statusSnapshot?.balanceStageLabel === '已结清'
        || o.statusSnapshot?.balanceStageLabel === '余款已确认到账',
    ).length;
    
    // 🔥 计算金额统计
    const totalReceivable = receivableOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const depositAmount = receivableOrders.reduce((sum, o) => sum + toPositiveNumber(o.depositExpectedAmount), 0);
    const balanceAmount = receivableOrders.reduce((sum, o) => sum + toPositiveNumber(o.balanceExpectedAmount), 0);
    
    return {
      total,
      depositPending,
      balancePending,
      depositReceived,
      balanceReceived,
      totalReceivable,
      depositAmount,
      balanceAmount
    };
  }, [receivableOrders]);
  
  // 🔥 打开上传收款凭证Dialog
  const handleOpenUpload = (order: any, type: 'depositReceipt' | 'balanceReceipt') => {
    setSelectedOrder(order);
    setProofType(type);
    
    // 预填充金额
    const expectedAmount = type === 'depositReceipt' 
      ? order.depositPaymentProof?.amount || 0
      : order.balancePaymentProof?.amount || 0;
    
    setReceiptData({
      actualAmount: expectedAmount,
      receiptDate: new Date().toISOString().split('T')[0],
      bankReference: '',
      fileUrl: '',
      fileName: '',
      notes: ''
    });
    setUploadedFile(null);
    setSelectedReceiptFile(null);
    setSelectedReceiptPreview('');
    
    setUploadDialog(true);
  };
  
  // 🔥 打开查看凭证Dialog
  const handleOpenView = (order: any, proof: any, type: string) => {
    setSelectedOrder(order);
    setSelectedProof(proof);
    setProofType(type as 'depositReceipt' | 'balanceReceipt');
    setViewDialog(true);
    
    // 🔥 预览图片
    if (proof.fileUrl) {
      setPreviewImage(resolveBackendPublicUrl(proof.fileUrl));
    }
  };
  
  // 🔥 上传收款凭证（落库后端）
  const handleUploadReceipt = async () => {
    if (!selectedOrder) return;

    // 验证必填字段
    if (receiptData.actualAmount <= 0) {
      toast.error('请填写实际到账金额！');
      return;
    }

    if (!receiptData.bankReference.trim()) {
      toast.error('请填写银行流水号！');
      return;
    }

    const normalizedReceiptDate = normalizeReceiptDateInput(receiptData.receiptDate);
    if (!normalizedReceiptDate || Number.isNaN(new Date(normalizedReceiptDate).getTime())) {
      toast.error('请填写正确的收款日期！');
      return;
    }

    if (!selectedReceiptFile && !receiptData.fileUrl) {
      toast.error('请先上传收款凭证文件！');
      return;
    }

    setUploadingReceipt(true);
    try {
      let fileUrl = receiptData.fileUrl;
      let fileName = receiptData.fileName;

      const orderUid = selectedOrder.orderRecordId || null;
      const type = proofType === 'depositReceipt' ? 'deposit' : 'balance';

      // 上传文件到 Supabase Storage
      if (selectedReceiptFile) {
        const uploaded = await paymentProofStorage.upload(
          selectedReceiptFile,
          selectedOrder.orderNumber || orderUid,
          type,
          'admin',
        );
        fileUrl = uploaded.url;
        fileName = uploaded.fileName;
      }

      const proofData = {
        actualAmount: receiptData.actualAmount,
        receiptDate: normalizedReceiptDate,
        bankReference: receiptData.bankReference,
        notes: receiptData.notes || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        uploadedAt: new Date().toISOString(),
      };
      if (orderUid) {
        const proofField = type === 'deposit' ? 'deposit_receipt_proof' : 'balance_receipt_proof';
        await orderService.upsert({ id: orderUid, [proofField]: proofData });
        updateOrder(orderUid, { [`${type}ReceiptProof`]: proofData });
      }

      const matchedAR = accountsReceivable.find((ar) => ar.orderNumber === selectedOrder.orderNumber);
      if (matchedAR) {
        const paymentAmount = receiptData.actualAmount;
        const nextPaidAmount = (matchedAR.paidAmount || 0) + paymentAmount;
        const nextRemainingAmount = Math.max((matchedAR.totalAmount || 0) - nextPaidAmount, 0);
        const nextStatus = nextRemainingAmount <= 0 ? 'paid' : 'partially_paid';

        updateARByOrderNumber(selectedOrder.orderNumber, {
          paidAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          status: nextStatus,
          paymentHistory: [
            ...(matchedAR.paymentHistory || []),
            {
              date: normalizedReceiptDate,
              amount: paymentAmount,
              method: 'T/T',
              reference: receiptData.bankReference,
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: receiptData.notes || `${type === 'deposit' ? 'Deposit' : 'Balance'} receipt confirmed by finance`,
              proofUrl: fileUrl || undefined,
              proofFileName: fileName || undefined,
            },
          ],
        });

        addPayment({
          receivableNumber: matchedAR.arNumber,
          receivableId: matchedAR.id,
          orderNumber: matchedAR.orderNumber,
          customerName: matchedAR.customerName,
          customerEmail: matchedAR.customerEmail,
          amount: paymentAmount,
          currency: matchedAR.currency,
          paymentDate: normalizedReceiptDate,
          paymentMethod: 'T/T',
          bankReference: receiptData.bankReference,
          receivedBy: currentUser?.email || 'finance@cosunchina.com',
          notes: receiptData.notes || `${type === 'deposit' ? 'Deposit' : 'Balance'} receipt uploaded by finance`,
          proofUrl: fileUrl || undefined,
          proofFileName: fileName || undefined,
          status: 'confirmed',
          region: matchedAR.region,
          createdBy: currentUser?.email || 'finance@cosunchina.com',
        });
      }

      if (type === 'deposit') {
        const relatedContract = getContractByContractNumber(selectedOrder.orderNumber);
        if (relatedContract?.id || relatedContract?.contractNumber) {
          await confirmDeposit(
            relatedContract.contractNumber || relatedContract.id,
            currentUser?.email || 'finance@cosunchina.com',
            receiptData.notes || `Bank reference: ${receiptData.bankReference}`,
          );
        }
      }

      window.dispatchEvent(new CustomEvent('ordersUpdated'));

      toast.success(`${proofType === 'depositReceipt' ? '定金' : '余款'}收款凭证已上传！`, {
        description: `订单 ${selectedOrder.orderNumber} 的收款凭证已写入数据库。`
      });

      setUploadDialog(false);
      resetForm();
    } catch (e: any) {
      toast.error(e?.message || '上传失败，请重试');
    } finally {
      setUploadingReceipt(false);
    }
  };
  
  // 🔥 重置表单
  const resetForm = () => {
    setReceiptData({
      actualAmount: 0,
      receiptDate: new Date().toISOString().split('T')[0],
      bankReference: '',
      fileUrl: '',
      fileName: '',
      notes: ''
    });
    setUploadedFile(null);
    setSelectedReceiptFile(null);
    setSelectedReceiptPreview('');
  };
  
  // 🔥 文件选择（真实上传在提交时执行）
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('文件格式不支持', { description: '仅支持 PDF、JPG、PNG 格式' });
        e.currentTarget.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件过大', { description: '请上传 10MB 以内文件' });
        e.currentTarget.value = '';
        return;
      }
      setSelectedReceiptFile(file);
      setUploadedFile(file.name);
      if (file.type.startsWith('image/')) {
        if (selectedReceiptPreview.startsWith('blob:')) {
          URL.revokeObjectURL(selectedReceiptPreview);
        }
        setSelectedReceiptPreview(URL.createObjectURL(file));
      } else {
        if (selectedReceiptPreview.startsWith('blob:')) {
          URL.revokeObjectURL(selectedReceiptPreview);
        }
        setSelectedReceiptPreview('');
      }
      setReceiptData(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: ''
      }));
      toast.success('文件已选择', {
        description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`
      });
    }
  };

  const handleRemoveSelectedFile = () => {
    if (selectedReceiptPreview.startsWith('blob:')) {
      URL.revokeObjectURL(selectedReceiptPreview);
    }
    setSelectedReceiptFile(null);
    setUploadedFile(null);
    setSelectedReceiptPreview('');
    setReceiptData(prev => ({ ...prev, fileName: '', fileUrl: '' }));
  };
  
  // 🔥 渲染凭证状态单元格
  const renderProofCell = (
    order: any, 
    proofType: 'depositPayment' | 'depositReceipt' | 'balancePayment' | 'balanceReceipt'
  ) => {
    return (
      <ReceivableProofCell
        order={order}
        proofType={proofType}
        onView={handleOpenView}
        onUpload={handleOpenUpload}
      />
    );
  };
  
  return (
    <div className="space-y-4">
      {/* 🔥 统计卡片 */}
      <div className="grid grid-cols-7 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">订单总数</div>
        </div>
        
        <div className="bg-white border border-yellow-200 rounded-lg p-4 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-700">{stats.depositPending}</div>
          <div className="text-xs text-yellow-600 mt-1">定金待处理</div>
        </div>
        
        <div className="bg-white border border-orange-200 rounded-lg p-4 bg-orange-50">
          <div className="text-2xl font-bold text-orange-700">{stats.balancePending}</div>
          <div className="text-xs text-orange-600 mt-1">余款待处理</div>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-700">{stats.depositReceived}</div>
          <div className="text-xs text-green-600 mt-1">定金已收</div>
        </div>
        
        <div className="bg-white border border-teal-200 rounded-lg p-4 bg-teal-50">
          <div className="text-2xl font-bold text-teal-700">{stats.balanceReceived}</div>
          <div className="text-xs text-teal-600 mt-1">余款已收</div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="text-lg font-bold text-blue-700">
            ${stats.depositAmount.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 mt-1">定金金额</div>
        </div>
        
        <div className="bg-white border border-purple-200 rounded-lg p-4 bg-purple-50">
          <div className="text-lg font-bold text-purple-700">
            ${stats.balanceAmount.toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 mt-1">余款金额</div>
        </div>
      </div>
      
      {/* 🔥 搜索栏 + 刷新（订单数据来自接口） */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <Input
            placeholder="搜索订单号、客户名称、邮箱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 text-xs shrink-0"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('ordersUpdated'));
            toast.success('已从服务器刷新订单列表');
          }}
        >
          刷新
        </Button>
      </div>
      
      {/* 🔥 订单表格 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 text-[11px]">
                <TableHead className="w-12">序号</TableHead>
                <TableHead className="w-40">订单编号</TableHead>
                <TableHead className="w-32">客户信息</TableHead>
                <TableHead className="w-28 text-right">订单金额</TableHead>
                <TableHead className="w-36 text-center border-l-2 border-blue-200 bg-blue-50">
                  <div className="font-semibold text-blue-900">定金</div>
                  <div className="font-normal">客户付款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center bg-blue-50">
                  <div className="font-semibold text-blue-900">定金</div>
                  <div className="font-normal">财务收款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center border-l-2 border-green-200 bg-green-50">
                  <div className="font-semibold text-green-900">余款</div>
                  <div className="font-normal">客户付款凭证</div>
                </TableHead>
                <TableHead className="w-36 text-center bg-green-50">
                  <div className="font-semibold text-green-900">余款</div>
                  <div className="font-normal">财务收款凭证</div>
                </TableHead>
                <TableHead className="w-24 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[12px]">
              {receivableOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>暂无应收账款订单</p>
                    <p className="text-sm mt-1">当客户接受销售合同后，订单将出现在这里</p>
                  </TableCell>
                </TableRow>
              ) : (
                receivableOrders.map((order, index) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="text-gray-500">{index + 1}</TableCell>
                    
                    <TableCell className="font-mono font-semibold text-purple-600">
                      {order.orderNumber}
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="font-medium text-[11px]">{order.customer}</div>
                        <div className="text-gray-400 text-[10px]">{order.customerEmail}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="font-bold text-gray-900 text-[13px]">
                        {order.currency} {order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </TableCell>
                    
                    {/* 🔥 定金-客户付款凭证 */}
                    <TableCell className="border-l-2 border-blue-200 bg-blue-50/30">
                      {renderProofCell(order, 'depositPayment')}
                    </TableCell>
                    
                    {/* 🔥 定金-财务收款凭证 */}
                    <TableCell className="bg-blue-50/30">
                      {renderProofCell(order, 'depositReceipt')}
                    </TableCell>
                    
                    {/* 🔥 余款-客户付款凭证 */}
                    <TableCell className="border-l-2 border-green-200 bg-green-50/30">
                      {renderProofCell(order, 'balancePayment')}
                    </TableCell>
                    
                    {/* 🔥 余款-财务收款凭证 */}
                    <TableCell className="bg-green-50/30">
                      {renderProofCell(order, 'balanceReceipt')}
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          toast.info('订单详情', {
                            description: `订单号: ${order.orderNumber}\n客户: ${order.customer}\n金额: ${order.currency} ${order.totalAmount.toLocaleString()}`
                          });
                        }}
                        className="h-7 text-[11px] px-2"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* 🔥 上传收款凭证Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#F96302]" />
              上传{proofType === 'depositReceipt' ? '定金' : '余款'}收款凭证
            </DialogTitle>
            <DialogDescription>
              订单: {selectedOrder?.orderNumber} | 客户: {selectedOrder?.customer}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 px-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>实际到账金额 <span className="text-red-500">*</span></Label>
                <Input
                  type="number"
                  value={receiptData.actualAmount}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, actualAmount: Number(e.target.value) }))}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>收款日期 <span className="text-red-500">*</span></Label>
                <Input
                  type="text"
                  value={receiptData.receiptDate}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, receiptDate: normalizeReceiptDateInput(e.target.value) }))}
                  placeholder="YYYY-MM-DD 或 YYYY/MM/DD"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label>银行流水号 <span className="text-red-500">*</span></Label>
              <Input
                value={receiptData.bankReference}
                onChange={(e) => setReceiptData(prev => ({ ...prev, bankReference: e.target.value }))}
                placeholder="例如：20250101-ABC-123456"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>收款凭证文件 <span className="text-red-500">*</span></Label>
              <label htmlFor="receipt-file-upload" className="mt-1 block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#F96302] transition-colors cursor-pointer">
                  {uploadedFile ? (
                    <div className="space-y-2">
                      {selectedReceiptPreview ? (
                        <img
                          src={selectedReceiptPreview}
                          alt="收款凭证预览"
                          className="max-h-[40vh] max-w-full mx-auto rounded border object-contain bg-gray-50"
                        />
                      ) : (
                        <FileCheck className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      )}
                      <p className="text-sm text-green-700 font-medium">{uploadedFile}</p>
                      <p className="text-xs text-gray-400">文件已选择，点击可重新选择</p>
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            handleRemoveSelectedFile();
                          }}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          移除文件
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">点击上传或拖拽文件</p>
                      <p className="text-xs text-gray-400 mt-1">支持 PDF、JPG、PNG 格式，最大 10MB</p>
                    </>
                  )}
                </div>
                <input
                  id="receipt-file-upload"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            
            <div>
              <Label>备注</Label>
              <Textarea
                value={receiptData.notes}
                onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="选填：其他说明信息..."
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="px-6 pb-6 pt-4 shrink-0 border-t bg-white">
            <Button variant="outline" onClick={() => {
              setUploadDialog(false);
              resetForm();
            }}>
              取消
            </Button>
            <Button 
              onClick={handleUploadReceipt}
              className="bg-[#F96302] hover:bg-[#e05502]"
              disabled={
                uploadingReceipt ||
                receiptData.actualAmount <= 0 ||
                !receiptData.bankReference.trim() ||
                (!selectedReceiptFile && !receiptData.fileUrl)
              }
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploadingReceipt ? '上传中...' : '确认上传'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 🔥 查看凭证Dialog */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              查看凭证详情
            </DialogTitle>
            <DialogDescription>
              订单: {selectedOrder?.orderNumber} | 客户: {selectedOrder?.customer}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {selectedProof && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">
                      {selectedProof.actualAmount ? '实际到账金额' : '付款金额'}
                    </Label>
                    <div className="text-lg font-bold text-gray-900">
                      {selectedOrder?.currency} {(selectedProof.actualAmount || selectedProof.amount)?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">上传时间</Label>
                    <div className="text-sm text-gray-700">
                      {formatDisplayDateTime(selectedProof.uploadedAt)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500">上传人</Label>
                  <div className="text-sm text-gray-700">{selectedProof.uploadedBy}</div>
                </div>
                
                {selectedProof.bankReference && (
                  <div>
                    <Label className="text-xs text-gray-500">银行流水号</Label>
                    <div className="text-sm font-mono text-gray-700">{selectedProof.bankReference}</div>
                  </div>
                )}
                
                {selectedProof.receiptDate && (
                  <div>
                    <Label className="text-xs text-gray-500">收款日期</Label>
                    <div className="text-sm text-gray-700">
                      {formatDisplayDate(selectedProof.receiptDate)}
                    </div>
                  </div>
                )}
                
                {selectedProof.notes && (
                  <div>
                    <Label className="text-xs text-gray-500">备注</Label>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                      {selectedProof.notes}
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium text-blue-900">凭证文件</Label>
                  </div>
                  <div className="text-xs text-blue-700 mb-3">
                    {getProofFileName(selectedProof)}
                  </div>
                  
                  {/* 🔥 凭证预览区域 */}
                  <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden mb-3">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-medium">凭证预览</span>
                      <Badge className="bg-white/20 text-white text-[10px] px-2 py-0.5">
                        {selectedProof.actualAmount ? '收款凭证' : '付款凭证'}
                      </Badge>
                    </div>
                    <div className="p-3 bg-gray-50">
                      {isImageProof(selectedProof) ? (
                        <>
                          <img 
                            src={previewImage || resolveBackendPublicUrl(selectedProof.fileUrl)}
                            alt="凭证预览"
                            className="w-full h-auto rounded border border-gray-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => openProofInNewWindow(selectedProof)}
                          />
                          <p className="text-[10px] text-gray-500 text-center mt-2">
                            点击图片可在新窗口中查看完整凭证
                          </p>
                        </>
                      ) : (
                        <div className="rounded border border-gray-300 bg-white p-6 text-center">
                          <FileText className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                          <p className="text-sm text-gray-700 mb-1">该凭证为文档文件，当前不支持内嵌图片预览</p>
                          <p className="text-[10px] text-gray-500">请使用下方按钮在新窗口中打开原文件</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        openProofInNewWindow(selectedProof);
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      查看大图
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => {
                        downloadProofFile(selectedProof);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      下载凭证
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
