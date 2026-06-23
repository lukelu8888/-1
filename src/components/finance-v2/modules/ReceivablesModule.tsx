import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  Eye,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { FinanceFilterBar } from '../components/FinanceFilterBar';
import { FinanceStatStrip } from '../components/FinanceStatStrip';
import { ReceivableDetailStageSummary } from '../components/ReceivableDetailStageSummary';
import { useFinance } from '../../../contexts/FinanceContext';
import { useOrders } from '../../../contexts/OrderContext';
import { usePayments } from '../../../contexts/PaymentContext';
import { usePurchaseOrders } from '../../../contexts/PurchaseOrderContext';
import { useSalesContracts } from '../../../contexts/SalesContractContext';
import {
  BALANCE_TRIGGER_OPTIONS,
  deriveBalanceTrigger,
  getPaymentModeLabel,
  isNoDepositPaymentMode,
  type BalanceTrigger,
} from '../../../lib/paymentFlow';
import * as receivableFlow from '../../../lib/financeReceivableFlow';
import type { PaymentMode } from '../../../contexts/SalesQuotationContext';
import { getCurrentUser } from '../../../utils/dataIsolation';
import { toast } from 'sonner@2.0.3';
import { arService, orderService, paymentService } from '../../../lib/supabaseService';

type ReceivableFlowKey =
  | 'waiting_deposit'
  | 'deposit_review'
  | 'waiting_balance'
  | 'waiting_shipment_trigger'
  | 'waiting_lc'
  | 'balance_review'
  | 'partial'
  | 'overdue'
  | 'settled';

type StatTone = 'default' | 'warn' | 'danger' | 'ok';

interface LiveReceivableRow {
  id: string;
  arNumber: string;
  orderNumber: string;
  contractNumber?: string;
  customer: string;
  customerEmail: string;
  currency: string;
  totalAmount: number;
  receivedAmount: number;
  remainingAmount: number;
  dueDate: string;
  depositDueDate?: string;
  balanceDueDate?: string;
  currentStageDueDate?: string;
  agingBucket: string;
  flowKey: ReceivableFlowKey;
  flowLabel: string;
  flowTone: StatTone;
  nextAction: string;
  depositStageLabel: string;
  balanceStageLabel: string;
  contractStatus?: string;
  contractStatusLabel: string;
  cgStatusLabel: string;
  cgCount: number;
  paymentTerms: string;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  isOverdue: boolean;
  depositProof?: any;
  depositReceiptProof?: any;
  balanceProof?: any;
  balanceReceiptProof?: any;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
    reference: string;
    receivedBy?: string;
    notes?: string;
    proofUrl?: string;
    proofFileName?: string;
  }>;
  createdAt?: string;
  source: 'accounts_receivable' | 'sales_contract';
}

const STAT_TONE_CLASS: Record<StatTone, string> = {
  default: 'border-slate-300 bg-slate-50',
  ok: 'border-emerald-300 bg-emerald-50/80',
  warn: 'border-amber-300 bg-amber-50/80',
  danger: 'border-red-300 bg-red-50/80',
};

const FLOW_LABELS: Record<ReceivableFlowKey, string> = {
  waiting_deposit: '待客户上传定金',
  deposit_review: '待财务确认定金',
  waiting_balance: '待客户上传余款',
  waiting_shipment_trigger: '待出货触发余款',
  waiting_lc: '待信用证落实',
  balance_review: '待财务确认余款',
  partial: '部分收款',
  overdue: '逾期',
  settled: '已结清',
};

const FLOW_TONES: Record<ReceivableFlowKey, StatTone> = {
  waiting_deposit: 'default',
  deposit_review: 'warn',
  waiting_balance: 'warn',
  waiting_shipment_trigger: 'default',
  waiting_lc: 'default',
  balance_review: 'warn',
  partial: 'default',
  overdue: 'danger',
  settled: 'ok',
};

const RECEIVING_BANK_FEE_ALLOWANCE_USD = 60;
const RECEIPT_SAVE_TIMEOUT_MS = 15000;

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  customer_confirmed: 'SC 已确认',
  deposit_uploaded: 'SC 定金已上传',
  deposit_confirmed: 'SC 定金已确认',
  po_generated: 'SC 已下推采购',
  production: 'SC 生产中',
  balance_confirmed: 'SC 尾款已确认',
  shipped: 'SC 已发货',
  completed: 'SC 已完成',
};

function toPositiveNumber(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function isUuid(value: unknown) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim());
}

function safeRandomUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const rand = Math.floor(Math.random() * 16);
    const value = ch === 'x' ? rand : ((rand & 0x3) | 0x8);
    return value.toString(16);
  });
}

function toDateOnly(value: unknown): string | undefined {
  if (!value) return undefined;
  const text = String(value).trim();
  if (!text) return undefined;

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  const rangeMatch = text.match(/(\d+)\s*[-~]\s*(\d+)\s*days?/i);
  if (rangeMatch) {
    const averageDays = Math.round((Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2);
    const relativeDate = new Date();
    relativeDate.setDate(relativeDate.getDate() + averageDays);
    return relativeDate.toISOString().split('T')[0];
  }

  const singleMatch = text.match(/(\d+)\s*days?/i);
  if (singleMatch) {
    const relativeDate = new Date();
    relativeDate.setDate(relativeDate.getDate() + Number(singleMatch[1]));
    return relativeDate.toISOString().split('T')[0];
  }

  return undefined;
}

function resolveDepositDueDate(params: {
  raw?: Record<string, any>;
  linkedContract?: Record<string, any>;
  linkedOrder?: Record<string, any>;
}) {
  return (
    toDateOnly(params.raw?.depositDueDate || params.raw?.deposit_due_date)
    || toDateOnly(params.linkedContract?.depositDueDate || params.linkedContract?.deposit_due_date)
    || toDateOnly(params.linkedContract?.customerConfirmedAt || params.linkedContract?.customer_confirmed_at)
    || toDateOnly(params.linkedOrder?.confirmedAt || params.linkedOrder?.confirmed_at)
    || toDateOnly(params.linkedOrder?.date)
    || toDateOnly(params.raw?.createdAt || params.raw?.created_at)
  );
}

function resolveBalanceDueDate(params: {
  raw?: Record<string, any>;
  linkedContract?: Record<string, any>;
  linkedOrder?: Record<string, any>;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  depositDueDate?: string;
  depositReceiptProof?: Record<string, any> | null;
}) {
  const explicitDate = toDateOnly(
    params.raw?.balanceDueDate
      || params.raw?.balance_due_date
      || params.linkedContract?.balanceDueDate
      || params.linkedContract?.balance_due_date,
  );
  if (explicitDate) return explicitDate;

  const trigger = deriveBalanceTrigger(params.paymentMode, params.balanceTrigger);
  if (trigger === 'after_deposit') {
    return (
      toDateOnly(params.depositReceiptProof?.receiptDate || params.depositReceiptProof?.uploadedAt)
      || params.depositDueDate
    );
  }

  if (trigger === 'before_shipment') {
    return (
      toDateOnly(params.linkedOrder?.productionCompletedDate)
      || toDateOnly(params.linkedOrder?.expectedDelivery)
      || toDateOnly(params.linkedContract?.deliveryTime || params.linkedContract?.delivery_time)
      || toDateOnly(params.linkedOrder?.deliveryTime || params.linkedOrder?.delivery_time)
      || toDateOnly(params.linkedOrder?.date)
    );
  }

  if (trigger === 'after_shipment') {
    return (
      toDateOnly(params.linkedOrder?.shipmentDate || params.linkedOrder?.shipment_date)
      || toDateOnly(params.linkedOrder?.freightConfirmedByCustomerAt || params.linkedOrder?.freight_confirmed_by_customer_at)
      || toDateOnly(params.linkedOrder?.expectedDelivery)
      || toDateOnly(params.linkedContract?.deliveryTime || params.linkedContract?.delivery_time)
      || toDateOnly(params.linkedOrder?.date)
    );
  }

  return undefined;
}

function resolveCurrentStageDueDate(params: {
  flowKey: ReceivableFlowKey;
  depositDueDate?: string;
  balanceDueDate?: string;
  fallbackDueDate?: string;
}) {
  if (params.flowKey === 'waiting_deposit' || params.flowKey === 'deposit_review') {
    return params.depositDueDate || params.fallbackDueDate;
  }

  if (
    params.flowKey === 'waiting_balance'
    || params.flowKey === 'waiting_shipment_trigger'
    || params.flowKey === 'waiting_lc'
    || params.flowKey === 'balance_review'
    || params.flowKey === 'partial'
    || params.flowKey === 'overdue'
    || params.flowKey === 'settled'
  ) {
    return params.balanceDueDate || params.depositDueDate || params.fallbackDueDate;
  }

  return params.fallbackDueDate;
}

function resolveReceiptTolerance(expectedAmount: number) {
  if (expectedAmount <= 0) return 0.01;
  return Math.max(0.01, Math.min(50, expectedAmount * 0.01));
}

function normalizeRemainingAmount(totalAmount: number, receivedAmount: number) {
  const rawRemaining = Math.max(toPositiveNumber(totalAmount) - toPositiveNumber(receivedAmount), 0);
  return rawRemaining <= resolveReceiptTolerance(totalAmount) ? 0 : rawRemaining;
}

function resolveRecognizedReceiptAmount(expectedAmount: number, actualAmount: number) {
  const expected = toPositiveNumber(expectedAmount);
  const actual = toPositiveNumber(actualAmount);
  const shortfall = Math.max(expected - actual, 0);

  if (shortfall > 0 && shortfall <= RECEIVING_BANK_FEE_ALLOWANCE_USD) {
    return {
      recognizedAmount: expected,
      receivingBankFeeAmount: shortfall,
      exceedsFeeAllowance: false,
    };
  }

  return {
    recognizedAmount: actual,
    receivingBankFeeAmount: shortfall,
    exceedsFeeAllowance: shortfall > RECEIVING_BANK_FEE_ALLOWANCE_USD,
  };
}

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function withReceivingBankFeeNote(notes: string, feeAmount: number, currency: string) {
  if (feeAmount <= 0) return notes;
  const feeNote = `收款行手续费 ${formatMoney(feeAmount, currency)}，在 ${formatMoney(RECEIVING_BANK_FEE_ALLOWANCE_USD, 'USD')} 额度内按全额到账`;
  return notes ? `${notes}；${feeNote}` : feeNote;
}

function summarizeByCurrency(items: Array<{ currency: string; amount: number }>) {
  const map = new Map<string, number>();
  items.forEach(({ currency, amount }) => {
    const key = currency || 'USD';
    map.set(key, (map.get(key) || 0) + amount);
  });
  const entries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  return {
    singleCurrency: entries.length === 1 ? entries[0] : null,
    display:
      entries.length === 0
        ? '-'
        : entries.map(([currency, amount]) => formatMoney(amount, currency)).join(' · '),
  };
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function toNumericInputValue(value?: unknown) {
  const numeric = Number(value ?? '');
  return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : '';
}

function formatPersonName(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  if (!raw.includes('@')) return raw;
  const localPart = raw.split('@')[0] || '';
  const words = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return raw;
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function isSameMonth(dateValue: string | undefined, now: Date) {
  if (!dateValue) return false;
  const parsed = new Date(dateValue);
  return !Number.isNaN(parsed.getTime())
    && parsed.getFullYear() === now.getFullYear()
    && parsed.getMonth() === now.getMonth();
}

function resolveProof(input: any, fallbackAmount = 0, fallbackCurrency = 'USD') {
  if (!input) return undefined;
  return {
    ...input,
    amount: toPositiveNumber(input.amount || input.actualAmount || fallbackAmount),
    actualAmount: toPositiveNumber(input.actualAmount || input.amount || fallbackAmount),
    currency: input.currency || fallbackCurrency,
    uploadedAt: input.uploadedAt || input.receiptDate || null,
  };
}

function receiptProofFromPaymentHistoryItem(item: any, fallbackCurrency = 'USD') {
  if (!item) return undefined;
  const amount = toPositiveNumber(item.actualAmount || item.amount);
  if (!amount) return undefined;
  return {
    amount,
    actualAmount: amount,
    currency: item.currency || fallbackCurrency,
    receiptDate: item.date || item.receiptDate || item.uploadedAt || null,
    bankReference: item.reference || item.bankReference || '',
    uploadedAt: item.date || item.receiptDate || item.uploadedAt || null,
    uploadedBy: item.receivedBy || item.uploadedBy || '',
    notes: item.notes || '',
    fileUrl: item.proofUrl || '',
    fileName: item.proofFileName || '',
  };
}

function deriveReceiptProofsFromHistory(paymentHistory: any[], fallbackCurrency = 'USD') {
  const sortedHistory = Array.isArray(paymentHistory)
    ? [...paymentHistory].sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')))
    : [];
  return {
    depositReceiptProof: receiptProofFromPaymentHistoryItem(sortedHistory[0], fallbackCurrency),
    balanceReceiptProof: receiptProofFromPaymentHistoryItem(sortedHistory[1], fallbackCurrency),
  };
}

function resolveCustomerDepositAmount(params: {
  totalAmount: number;
  contractDepositAmount?: unknown;
  depositProof?: any;
  orderDepositProof?: any;
}) {
  return toPositiveNumber(
    params.depositProof?.amount
    || params.orderDepositProof?.amount
    || params.contractDepositAmount
    || params.totalAmount * 0.3,
  );
}

function resolveCustomerBalanceAmount(params: {
  totalAmount: number;
  depositCustomerAmount: number;
  contractBalanceAmount?: unknown;
  balanceProof?: any;
  orderBalanceProof?: any;
}) {
  return toPositiveNumber(
    params.balanceProof?.amount
    || params.orderBalanceProof?.amount
    || (params.depositCustomerAmount > 0 ? Math.max(params.totalAmount - params.depositCustomerAmount, 0) : 0)
    || params.contractBalanceAmount
    || Math.max(params.totalAmount - params.depositCustomerAmount, 0),
  );
}

function resolveIsOverdue(params: {
  dueDate?: string;
  remainingAmount: number;
}) {
  const due = params.dueDate ? new Date(params.dueDate) : null;
  return Boolean(
    params.remainingAmount > 0
    && due
    && !Number.isNaN(due.getTime())
    && due.getTime() < new Date().setHours(0, 0, 0, 0),
  );
}

function isShipmentTriggered(contractStatus?: string) {
  const normalized = String(contractStatus || '').trim().toLowerCase();
  return normalized === 'balance_confirmed' || normalized === 'shipped' || normalized === 'completed';
}

function resolvePendingBalanceFlowKey(params: {
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
}) {
  const trigger = deriveBalanceTrigger(params.paymentMode, params.balanceTrigger);
  if (trigger === 'lc_ready') return 'waiting_lc';
  if (trigger === 'after_shipment' && !isShipmentTriggered(params.contractStatus)) {
    return 'waiting_shipment_trigger';
  }
  return 'waiting_balance';
}

function resolveFlowKey(params: {
  remainingAmount: number;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
  depositProof?: any;
  depositReceiptProof?: any;
  balanceProof?: any;
  balanceReceiptProof?: any;
}) {
  const noDepositMode = isNoDepositPaymentMode(params.paymentMode);
  const hasDepositProof = Boolean(params.depositProof);
  const hasDepositReceipt = Boolean(params.depositReceiptProof);
  const hasBalanceProof = Boolean(params.balanceProof);
  const hasBalanceReceipt = Boolean(params.balanceReceiptProof);

  if (params.remainingAmount <= 0) return 'settled';
  if (hasBalanceProof && !hasBalanceReceipt) return 'balance_review';
  if (noDepositMode) {
    if (hasBalanceReceipt) return params.remainingAmount <= 0 ? 'settled' : 'partial';
    return resolvePendingBalanceFlowKey(params);
  }
  if (!hasDepositProof) return 'waiting_deposit';
  if (hasDepositProof && !hasDepositReceipt) return 'deposit_review';
  if (hasDepositReceipt && !hasBalanceProof) return resolvePendingBalanceFlowKey(params);
  if (params.remainingAmount > 0) return 'partial';
  return 'waiting_deposit';
}

function resolveDepositStageLabel(params: {
  paymentMode?: PaymentMode | null;
  depositProof?: any;
  depositReceiptProof?: any;
}) {
  if (isNoDepositPaymentMode(params.paymentMode)) return '无需定金';
  if (params.depositReceiptProof) return '定金已确认到账';
  if (params.depositProof) return '待财务确认定金到账';
  return '待客户上传定金';
}

function resolveBalanceStageLabel(params: {
  remainingAmount: number;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
  balanceProof?: any;
  balanceReceiptProof?: any;
  depositReceiptProof?: any;
}) {
  if (params.remainingAmount <= 0) return '已结清';
  if (params.balanceReceiptProof) return '余款已确认到账';
  if (params.balanceProof) return '待财务确认余款到账';
  if (!isNoDepositPaymentMode(params.paymentMode) && !params.depositReceiptProof) return '等待定金完成';
  const pendingFlowKey = resolvePendingBalanceFlowKey(params);
  return receivableFlow.FLOW_LABELS[pendingFlowKey];
}

function resolveAgingBucket(params: { dueDate?: string; remainingAmount: number }) {
  if (!params.dueDate || params.remainingAmount <= 0) return '已结清';
  const due = new Date(params.dueDate);
  if (Number.isNaN(due.getTime())) return '-';
  const diffDays = Math.floor((new Date().setHours(0, 0, 0, 0) - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return '0-30';
  if (diffDays <= 30) return '0-30';
  if (diffDays <= 60) return '31-60';
  return '60+';
}

function resolveNextAction(flowKey: ReceivableFlowKey) {
  return flowKey === 'waiting_deposit' ? '等待客户上传定金'
    : flowKey === 'deposit_review' ? '财务确认定金到账'
    : flowKey === 'waiting_balance' ? '等待客户上传余款'
    : flowKey === 'waiting_shipment_trigger' ? '等待出货后触发余款'
    : flowKey === 'waiting_lc' ? '等待信用证落实'
    : flowKey === 'balance_review' ? '财务确认余款到账'
    : flowKey === 'settled' ? '无需跟进'
    : '继续跟进回款';
}

function resolveFlowDisplay(row: LiveReceivableRow) {
  return {
    label: row.flowLabel,
    tone: row.flowTone,
  };
}

function withReceiptSaveTimeout<T>(promise: Promise<T>, label: string, timeoutMs = RECEIPT_SAVE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label}超时，请检查网络或 Supabase 写入权限`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function resolveCgStatusLabel(purchaseOrders: any[]) {
  if (purchaseOrders.length === 0) return 'CG 待启动';
  if (purchaseOrders.some((po) => ['pushed_supplier', 'shipped', 'completed'].includes(String(po.procurementRequestStatus || '').toLowerCase()))) {
    return 'CG 已推进';
  }
  if (purchaseOrders.some((po) => ['approved_boss', 'pending_ceo_approval', 'pending_manager_approval'].includes(String(po.procurementRequestStatus || '').toLowerCase()))) {
    return 'CG 待推供应商';
  }
  return 'CG 处理中';
}

export function ReceivablesModule() {
  const { accountsReceivable, addAccountReceivable, updateAccountReceivable, updateARByOrderNumber } = useFinance();
  const { orders, updateOrder } = useOrders();
  const { payments } = usePayments();
  const { purchaseOrders } = usePurchaseOrders();
  const {
    contracts,
    confirmDeposit,
    confirmBalancePayment,
    refreshFromBackend: refreshContracts,
  } = useSalesContracts();
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<LiveReceivableRow | null>(null);
  const [rowOverrides, setRowOverrides] = useState<Record<string, Partial<LiveReceivableRow>>>({});
  const [detailSaving, setDetailSaving] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState({
    depositFileName: '',
    depositFileUrl: '',
    depositAmount: '',
    depositRemittanceDate: '',
    depositUploadedBy: '',
    depositReceiptAmount: '',
    depositReceiptDate: '',
    depositBankReference: '',
    depositNotes: '',
    balanceFileName: '',
    balanceFileUrl: '',
    balanceAmount: '',
    balanceRemittanceDate: '',
    balanceUploadedBy: '',
    balanceReceiptAmount: '',
    balanceReceiptDate: '',
    balanceBankReference: '',
    balanceNotes: '',
  });
  const currentUser = getCurrentUser() as any;

  const selectedOrder = useMemo(() => {
    if (!selectedRow) return null;
    return orders.find((order) => order.orderNumber === selectedRow.orderNumber) || null;
  }, [orders, selectedRow]);

  const selectedContract = useMemo(() => {
    if (!selectedRow) return null;
    return contracts.find((contract) =>
      contract.contractNumber === selectedRow.contractNumber
      || contract.contractNumber === selectedRow.orderNumber,
    ) || null;
  }, [contracts, selectedRow]);

  const depositReceiptLocked =
    Boolean(selectedRow?.depositReceiptProof || selectedOrder?.depositReceiptProof)
    || selectedRow?.depositStageLabel === '定金已确认到账'
    || selectedRow?.depositStageLabel === '无需定金';
  const balanceReceiptLocked =
    Boolean(selectedRow?.balanceReceiptProof || selectedOrder?.balanceReceiptProof)
    || selectedRow?.balanceStageLabel === '余款已确认到账';
  // 财务收款凭证（文件）非强制——财务核对银行账户后直接填入到账金额即可确认，
  // 无需上传文件。客户付款凭证存在或财务已直接录入金额，均可触发确认。
  const depositReceiptReady = (Boolean(detailDraft.depositFileUrl) || Boolean(detailDraft.depositAmount)) && !depositReceiptLocked;
  const balanceReceiptReady = (Boolean(detailDraft.balanceFileUrl) || Boolean(detailDraft.balanceAmount)) && !balanceReceiptLocked;

  React.useEffect(() => {
    if (!selectedRow) return;
    setDetailSaving(null);
    const depositCustomerAmount = resolveCustomerDepositAmount({
      totalAmount: selectedRow.totalAmount,
      contractDepositAmount: selectedContract?.depositAmount,
      depositProof: selectedRow.depositProof,
      orderDepositProof: selectedOrder?.depositPaymentProof,
    });
    const balanceCustomerAmount = resolveCustomerBalanceAmount({
      totalAmount: selectedRow.totalAmount,
      depositCustomerAmount,
      contractBalanceAmount: selectedContract?.balanceAmount,
      balanceProof: selectedRow.balanceProof,
      orderBalanceProof: selectedOrder?.balancePaymentProof,
    });
    setDetailDraft({
      depositFileName: selectedRow.depositProof?.fileName || selectedOrder?.depositPaymentProof?.fileName || '',
      depositFileUrl: selectedRow.depositProof?.fileUrl || selectedOrder?.depositPaymentProof?.fileUrl || '',
      depositAmount: toNumericInputValue(depositCustomerAmount),
      depositRemittanceDate: toDateInputValue(selectedRow.depositProof?.uploadedAt || selectedOrder?.depositPaymentProof?.uploadedAt),
      depositUploadedBy: selectedRow.depositProof?.uploadedBy || selectedOrder?.depositPaymentProof?.uploadedBy || '',
      depositReceiptAmount: toNumericInputValue(selectedRow.depositReceiptProof?.actualAmount || selectedOrder?.depositReceiptProof?.actualAmount),
      depositReceiptDate: toDateInputValue(selectedRow.depositReceiptProof?.receiptDate || selectedOrder?.depositReceiptProof?.receiptDate),
      depositBankReference: selectedRow.depositReceiptProof?.bankReference || selectedOrder?.depositReceiptProof?.bankReference || '',
      depositNotes: selectedRow.depositReceiptProof?.notes || selectedOrder?.depositReceiptProof?.notes || '',
      balanceFileName: selectedRow.balanceProof?.fileName || selectedOrder?.balancePaymentProof?.fileName || '',
      balanceFileUrl: selectedRow.balanceProof?.fileUrl || selectedOrder?.balancePaymentProof?.fileUrl || '',
      balanceAmount: toNumericInputValue(balanceCustomerAmount),
      balanceRemittanceDate: toDateInputValue(selectedRow.balanceProof?.uploadedAt || selectedOrder?.balancePaymentProof?.uploadedAt),
      balanceUploadedBy: selectedRow.balanceProof?.uploadedBy || selectedOrder?.balancePaymentProof?.uploadedBy || '',
      balanceReceiptAmount: toNumericInputValue(selectedRow.balanceReceiptProof?.actualAmount || selectedOrder?.balanceReceiptProof?.actualAmount),
      balanceReceiptDate: toDateInputValue(selectedRow.balanceReceiptProof?.receiptDate || selectedOrder?.balanceReceiptProof?.receiptDate),
      balanceBankReference: selectedRow.balanceReceiptProof?.bankReference || selectedOrder?.balanceReceiptProof?.bankReference || '',
      balanceNotes: selectedRow.balanceReceiptProof?.notes || selectedOrder?.balanceReceiptProof?.notes || '',
    });
  }, [currentUser?.email, selectedContract, selectedOrder, selectedRow]);

  const downloadProof = (url?: string, fileName?: string) => {
    if (!url) {
      toast.error('当前没有可下载的凭证地址');
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noreferrer';
    anchor.download = fileName || '';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleProofClick = (url?: string, fileName?: string) => {
    if (!url) {
      toast.error('当前没有可打开的凭证');
      return;
    }
    const shouldDownload = window.confirm('是否另存该凭证？\n点击“确定”将下载凭证，点击“取消”仅打开预览。');
    if (shouldDownload) {
      downloadProof(url, fileName);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const syncContractDepositInBackground = (contractId: string, confirmedBy: string, notes?: string) => {
    void confirmDeposit(contractId, confirmedBy, notes).catch((error: any) => {
      console.warn('定金合同状态后台同步失败:', error);
      toast.error(error?.message || '定金合同状态同步失败');
    });
  };

  const syncContractBalanceInBackground = (
    contractId: string,
    confirmedBy: string,
    notes?: string,
    receiptProof?: Record<string, any>,
  ) => {
    void confirmBalancePayment(contractId, confirmedBy, notes, receiptProof).catch((error: any) => {
      console.warn('余款合同状态后台同步失败:', error);
      const message = String(error?.message || '');
      if (message.includes('invalid input value for enum sc_status') && message.includes('balance_confirmed')) {
        return;
      }
      toast.error(message || '余款合同状态同步失败');
    });
  };

  const persistReceivableUpdate = async (row: LiveReceivableRow, updates: Record<string, any>) => {
    const matchedAr = accountsReceivable.find((ar) =>
      ar.id === row.id
      || (row.orderNumber && ar.orderNumber === row.orderNumber)
      || (row.contractNumber && ar.contractNumber === row.contractNumber),
    );

    const linkedContract = contracts.find((contract) =>
      contract.contractNumber === row.contractNumber
      || contract.contractNumber === row.orderNumber,
    );
    const linkedOrder = orders.find((order) =>
      order.orderNumber === row.orderNumber
      || order.contractNumber === row.contractNumber
      || order.contractNumber === row.orderNumber,
    );

    const candidateId = matchedAr?.id || (row.source === 'accounts_receivable' ? row.id : undefined);
    const nextReceivable = {
      id: isUuid(candidateId) ? candidateId : safeRandomUUID(),
      arNumber: row.arNumber,
      orderNumber: row.orderNumber,
      quotationNumber: linkedContract?.quotationNumber || linkedOrder?.quotationNumber,
      contractNumber: row.contractNumber || row.orderNumber,
      customerName: row.customer,
      customerEmail: row.customerEmail,
      region: linkedContract?.region || linkedOrder?.region || 'NA',
      invoiceDate: String(linkedContract?.customerConfirmedAt || linkedContract?.createdAt || row.createdAt || new Date().toISOString()).split('T')[0],
      dueDate: String(row.dueDate || linkedContract?.customerConfirmedAt || linkedContract?.createdAt || new Date().toISOString()).split('T')[0],
      totalAmount: row.totalAmount,
      paidAmount: toPositiveNumber(updates.paidAmount ?? row.receivedAmount),
      remainingAmount: toPositiveNumber(updates.remainingAmount ?? row.remainingAmount),
      currency: row.currency,
      status: updates.status || (toPositiveNumber(updates.remainingAmount ?? row.remainingAmount) <= 0 ? 'paid' : 'partially_paid'),
      paymentTerms: row.paymentTerms || linkedContract?.paymentTerms || linkedOrder?.paymentTerms || '',
      products: Array.isArray(linkedOrder?.products)
        ? linkedOrder.products.map((product: any) => ({
            name: product.name || product.productName || 'Product',
            quantity: Number(product.quantity || 0),
            unitPrice: Number(product.unitPrice || 0),
            totalPrice: Number(product.totalPrice || product.amount || (Number(product.quantity || 0) * Number(product.unitPrice || 0))),
          }))
        : Array.isArray(linkedContract?.products)
          ? linkedContract.products.map((product: any) => ({
              name: product.productName || product.name || 'Product',
              quantity: Number(product.quantity || 0),
              unitPrice: Number(product.unitPrice || 0),
              totalPrice: Number(product.amount || (Number(product.quantity || 0) * Number(product.unitPrice || 0))),
            }))
          : [],
      paymentHistory: Array.isArray(updates.paymentHistory) ? updates.paymentHistory : row.paymentHistory,
      depositProof: updates.depositProof ?? row.depositProof,
      balanceProof: updates.balanceProof ?? row.balanceProof,
      depositReceiptProof: updates.depositReceiptProof ?? row.depositReceiptProof,
      balanceReceiptProof: updates.balanceReceiptProof ?? row.balanceReceiptProof,
      createdBy: currentUser?.email || 'finance@cosunchina.com',
      notes: linkedContract?.remarks || undefined,
    };

    const saved = await arService.upsert(nextReceivable as any);
    if (saved) {
      if (matchedAr?.id) {
        updateAccountReceivable(matchedAr.id, updates);
        return saved;
      }

      if (row.orderNumber) {
        updateARByOrderNumber(row.orderNumber, updates);
      }

      addAccountReceivable({
        ...nextReceivable,
        id: undefined as never,
        createdAt: undefined as never,
      } as any);
      return saved;
    }

    console.warn('应收账款 Supabase upsert 失败，尝试按订单/合同号更新并继续本地状态:', {
      arNumber: row.arNumber,
      orderNumber: row.orderNumber,
      contractNumber: row.contractNumber,
    });

    if (row.orderNumber) {
      const updated = await arService.updateByOrderNumber(row.orderNumber, updates);
      updateARByOrderNumber(row.orderNumber, updates);
      if (updated) return updated;
    }

    if (matchedAr?.id) {
      updateAccountReceivable(matchedAr.id, updates);
      return { ...matchedAr, ...updates };
    }

    addAccountReceivable({
      ...nextReceivable,
      id: undefined as never,
      createdAt: undefined as never,
    } as any);
    return nextReceivable;
  };

  const confirmDepositReceipt = async () => {
    if (!selectedRow) return;
    const confirmedCustomerAmount = Number(detailDraft.depositAmount || 0);
    const actualReceivedAmount = Number(detailDraft.depositReceiptAmount || 0);
    if (!confirmedCustomerAmount) {
      toast.error('缺少定金客户汇款金额');
      return;
    }
    if (!actualReceivedAmount) {
      toast.error('请输入定金实际到账金额');
      return;
    }
    setDetailSaving('deposit-receipt');
    try {
      const receiptDate = detailDraft.depositReceiptDate || new Date().toISOString().slice(0, 10);
      const bankReference = detailDraft.depositBankReference || `AR-${selectedRow.arNumber}`;
      const receiptPayload = {
        amount: confirmedCustomerAmount,
        actualAmount: actualReceivedAmount,
        currency: selectedRow.currency,
        receiptDate,
        bankReference,
        notes: detailDraft.depositNotes || '',
        remittanceDate: detailDraft.depositRemittanceDate || null,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.email || 'finance@cosunchina.com',
      };
      const receiptRecognition = resolveRecognizedReceiptAmount(confirmedCustomerAmount, actualReceivedAmount);
      if (receiptRecognition.exceedsFeeAllowance) {
        toast.error(`实际到账差额 ${formatMoney(receiptRecognition.receivingBankFeeAmount, selectedRow.currency)} 超过 ${formatMoney(RECEIVING_BANK_FEE_ALLOWANCE_USD, 'USD')} 手续费额度，请按短款/异常收款处理`);
        return;
      }
      const receiptNotes = withReceivingBankFeeNote(
        detailDraft.depositNotes || `定金到账确认（实际到账 ${formatMoney(actualReceivedAmount, selectedRow.currency)}）`,
        receiptRecognition.receivingBankFeeAmount,
        selectedRow.currency,
      );
      const nextPaidAmount = Math.min(selectedRow.totalAmount, selectedRow.receivedAmount + receiptRecognition.recognizedAmount);
      const nextRemainingAmount = normalizeRemainingAmount(selectedRow.totalAmount, nextPaidAmount);
      const nextFlowKey = nextRemainingAmount <= 0
        ? 'settled'
        : receivableFlow.resolveFlowKey({
            remainingAmount: nextRemainingAmount,
            paymentMode: selectedRow.paymentMode,
            balanceTrigger: selectedRow.balanceTrigger,
            contractStatus: selectedRow.contractStatus,
            depositProof: selectedRow.depositProof,
            depositReceiptProof: receiptPayload,
            balanceProof: selectedRow.balanceProof,
            balanceReceiptProof: selectedRow.balanceReceiptProof,
          });
      const nextBalanceStageLabel = nextRemainingAmount <= 0
        ? '已结清'
        : receivableFlow.resolveBalanceStageLabel({
            remainingAmount: nextRemainingAmount,
            paymentMode: selectedRow.paymentMode,
            balanceTrigger: selectedRow.balanceTrigger,
            contractStatus: selectedRow.contractStatus,
            balanceProof: selectedRow.balanceProof,
            balanceReceiptProof: selectedRow.balanceReceiptProof,
            depositReceiptProof: receiptPayload,
          });
      await withReceiptSaveTimeout(
        persistReceivableUpdate(selectedRow, {
          paidAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          status: nextRemainingAmount <= 0 ? 'paid' : 'partially_paid',
          depositReceiptProof: receiptPayload,
          financeReceiptProof: receiptPayload,
          paymentHistory: [
            ...selectedRow.paymentHistory,
            {
              date: receiptDate,
              amount: receiptRecognition.recognizedAmount,
              actualAmount: actualReceivedAmount,
              receivingBankFeeAmount: receiptRecognition.receivingBankFeeAmount,
              method: 'T/T',
              reference: bankReference,
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: receiptNotes,
              proofUrl: detailDraft.depositFileUrl || undefined,
              proofFileName: detailDraft.depositFileName || undefined,
            },
          ],
        } as any),
        '定金应收账款保存',
      );
      if (selectedOrder) {
        const nextDepositPaymentProof = selectedOrder.depositPaymentProof
          ? {
              ...selectedOrder.depositPaymentProof,
              status: 'confirmed',
              confirmedAt: receiptDate,
              confirmedBy: currentUser?.email || 'finance@cosunchina.com',
            }
          : undefined;
        const nextOrderPayload = {
          depositReceiptProof: receiptPayload as any,
          financeReceiptProof: receiptPayload as any,
          depositPaymentProof: nextDepositPaymentProof as any,
          paymentStatus: 'Deposit Received',
          status: ['Shipped', 'Delivered', 'Ready to Ship', 'In Production', 'Quality Inspection'].includes(String(selectedOrder.status || ''))
            ? selectedOrder.status
            : 'Deposit Received',
        };
        const savedOrder = await withReceiptSaveTimeout(
          orderService.updateStatus(
            selectedOrder.id || selectedOrder.orderNumber || selectedOrder.contractNumber,
            nextOrderPayload.status,
            nextOrderPayload,
          ),
          '定金订单状态保存',
        );
        if (!savedOrder) {
          console.warn('订单定金到账状态写入 Supabase 未返回确认行，继续更新本地订单状态', {
            orderNumber: selectedOrder.orderNumber,
            contractNumber: selectedOrder.contractNumber,
          });
        }
        updateOrder(selectedOrder.id, nextOrderPayload);
      }
      await withReceiptSaveTimeout(
        paymentService.upsert({
          receivableNumber: selectedRow.arNumber,
          receivableId: selectedRow.id,
          orderNumber: selectedRow.orderNumber,
          customerName: selectedRow.customer,
          customerEmail: selectedRow.customerEmail,
          amount: receiptRecognition.recognizedAmount,
          currency: selectedRow.currency,
          paymentType: 'deposit',
          paymentDate: receiptDate,
          paidDate: receiptDate,
          paymentMethod: 'T/T',
          bankReference,
          receivedBy: currentUser?.email || 'finance@cosunchina.com',
          notes: receiptNotes,
          proofUrl: detailDraft.depositFileUrl || undefined,
          proofFileName: detailDraft.depositFileName || undefined,
          status: 'confirmed',
          region: selectedOrder?.region || 'NA',
          createdBy: currentUser?.email || 'finance@cosunchina.com',
        }),
        '定金收款流水保存',
      ).catch((error) => {
        console.warn('定金到账主状态已保存，但收款流水写入失败:', error);
        toast.error(error?.message || '定金收款流水写入失败，主状态已保存');
        return null;
      });
      setSelectedRow((current) => current ? {
        ...current,
        receivedAmount: nextPaidAmount,
        remainingAmount: nextRemainingAmount,
        dueDate: current.balanceDueDate || current.dueDate,
        currentStageDueDate: current.balanceDueDate || current.currentStageDueDate || current.dueDate,
        flowKey: nextFlowKey,
        flowLabel: receivableFlow.FLOW_LABELS[nextFlowKey],
        flowTone: receivableFlow.FLOW_TONES[nextFlowKey],
        nextAction: receivableFlow.resolveNextAction(nextFlowKey),
        depositReceiptProof: receiptPayload,
        depositStageLabel: '定金已确认到账',
        balanceStageLabel: nextBalanceStageLabel,
      } : current);
      setRowOverrides((current) => ({
        ...current,
        [selectedRow.orderNumber]: {
          receivedAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          dueDate: selectedRow.balanceDueDate || selectedRow.dueDate,
          currentStageDueDate: selectedRow.balanceDueDate || selectedRow.currentStageDueDate || selectedRow.dueDate,
          flowKey: nextFlowKey,
          flowLabel: receivableFlow.FLOW_LABELS[nextFlowKey],
          flowTone: receivableFlow.FLOW_TONES[nextFlowKey],
          nextAction: receivableFlow.resolveNextAction(nextFlowKey),
          depositReceiptProof: receiptPayload,
          depositStageLabel: '定金已确认到账',
          balanceStageLabel: nextBalanceStageLabel,
          paymentHistory: [
            ...selectedRow.paymentHistory,
            {
              date: receiptDate,
              amount: receiptRecognition.recognizedAmount,
              actualAmount: actualReceivedAmount,
              receivingBankFeeAmount: receiptRecognition.receivingBankFeeAmount,
              method: 'T/T',
              reference: bankReference,
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: receiptNotes,
              proofUrl: detailDraft.depositFileUrl || undefined,
              proofFileName: detailDraft.depositFileName || undefined,
            } as any,
          ],
        },
      }));
      setDetailDraft((current) => ({
        ...current,
        depositReceiptAmount: toNumericInputValue(actualReceivedAmount),
        depositReceiptDate: receiptDate,
        depositBankReference: bankReference,
        depositNotes: detailDraft.depositNotes || '',
      }));
      if (selectedContract) {
        syncContractDepositInBackground(selectedContract.id || selectedContract.contractNumber, currentUser?.email || 'finance@cosunchina.com', detailDraft.depositNotes || bankReference);
      }
      toast.success('定金到账已确认');
      setDetailOpen(false);
      setSelectedRow(null);
    } catch (error: any) {
      toast.error(error?.message || '定金到账确认失败');
    } finally {
      setDetailSaving(null);
    }
  };

  const confirmBalanceReceipt = async () => {
    if (!selectedRow) return;
    const confirmedCustomerAmount = Number(detailDraft.balanceAmount || 0);
    const actualReceivedAmount = Number(detailDraft.balanceReceiptAmount || 0);
    if (!confirmedCustomerAmount) {
      toast.error('缺少余款客户汇款金额');
      return;
    }
    if (!actualReceivedAmount) {
      toast.error('请输入余款实际到账金额');
      return;
    }
    setDetailSaving('balance-receipt');
    try {
      const receiptDate = detailDraft.balanceReceiptDate || new Date().toISOString().slice(0, 10);
      const bankReference = detailDraft.balanceBankReference || `AR-${selectedRow.arNumber}`;
      const receiptPayload = {
        amount: confirmedCustomerAmount,
        actualAmount: actualReceivedAmount,
        currency: selectedRow.currency,
        receiptDate,
        bankReference,
        notes: detailDraft.balanceNotes || '',
        remittanceDate: detailDraft.balanceRemittanceDate || null,
        uploadedAt: new Date().toISOString(),
        uploadedBy: currentUser?.email || 'finance@cosunchina.com',
      };
      const receiptRecognition = resolveRecognizedReceiptAmount(confirmedCustomerAmount, actualReceivedAmount);
      if (receiptRecognition.exceedsFeeAllowance) {
        toast.error(`实际到账差额 ${formatMoney(receiptRecognition.receivingBankFeeAmount, selectedRow.currency)} 超过 ${formatMoney(RECEIVING_BANK_FEE_ALLOWANCE_USD, 'USD')} 手续费额度，请按短款/异常收款处理`);
        return;
      }
      const receiptNotes = withReceivingBankFeeNote(
        detailDraft.balanceNotes || `余款到账确认（实际到账 ${formatMoney(actualReceivedAmount, selectedRow.currency)}）`,
        receiptRecognition.receivingBankFeeAmount,
        selectedRow.currency,
      );
      const nextPaidAmount = Math.min(selectedRow.totalAmount, selectedRow.receivedAmount + receiptRecognition.recognizedAmount);
      const nextRemainingAmount = normalizeRemainingAmount(selectedRow.totalAmount, nextPaidAmount);
      if (selectedContract) {
        await withReceiptSaveTimeout(
          confirmBalancePayment(
            selectedContract.id || selectedContract.contractNumber,
            currentUser?.email || 'finance@cosunchina.com',
            detailDraft.balanceNotes || bankReference,
            receiptPayload,
          ),
          '余款合同状态保存',
        );
      }

      await withReceiptSaveTimeout(
        persistReceivableUpdate(selectedRow, {
          paidAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          status: nextRemainingAmount <= 0 ? 'paid' : 'partially_paid',
          balanceReceiptProof: receiptPayload,
          financeBalanceReceiptProof: receiptPayload,
          paymentHistory: [
            ...selectedRow.paymentHistory,
            {
              date: receiptDate,
              amount: receiptRecognition.recognizedAmount,
              actualAmount: actualReceivedAmount,
              receivingBankFeeAmount: receiptRecognition.receivingBankFeeAmount,
              method: 'T/T',
              reference: bankReference,
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: receiptNotes,
              proofUrl: detailDraft.balanceFileUrl || undefined,
              proofFileName: detailDraft.balanceFileName || undefined,
            },
          ],
        } as any),
        '余款应收账款保存',
      );

      if (selectedOrder) {
        const nextBalancePaymentProof = selectedOrder.balancePaymentProof
          ? {
              ...selectedOrder.balancePaymentProof,
              status: 'confirmed',
              confirmedAt: receiptDate,
              confirmedBy: currentUser?.email || 'finance@cosunchina.com',
            }
          : undefined;
        const nextOrderPayload = {
          balanceReceiptProof: receiptPayload as any,
          financeBalanceReceiptProof: receiptPayload as any,
          balancePaymentProof: nextBalancePaymentProof as any,
          paymentStatus: 'Balance Received',
          // Do not advance customer-facing execution status from a finance receipt.
          // Operational stages should continue to be driven by PR/CG/production/QC/shipment flow.
          status: selectedOrder.status,
        };
        const savedOrder = await withReceiptSaveTimeout(
          orderService.updateStatus(
            selectedOrder.id || selectedOrder.orderNumber || selectedOrder.contractNumber,
            nextOrderPayload.status,
            nextOrderPayload,
          ),
          '余款订单状态保存',
        );
        if (!savedOrder) {
          console.warn('订单余款到账状态写入 Supabase 未返回确认行，继续更新本地订单状态', {
            orderNumber: selectedOrder.orderNumber,
            contractNumber: selectedOrder.contractNumber,
          });
        }
        updateOrder(selectedOrder.id, nextOrderPayload);
      }

      await withReceiptSaveTimeout(
        paymentService.upsert({
          receivableNumber: selectedRow.arNumber,
          receivableId: selectedRow.id,
          orderNumber: selectedRow.orderNumber,
          contractNumber: selectedRow.contractNumber || selectedContract?.contractNumber,
          customerName: selectedRow.customer,
          customerEmail: selectedRow.customerEmail,
          amount: receiptRecognition.recognizedAmount,
          currency: selectedRow.currency,
          paymentType: 'balance',
          paymentDate: receiptDate,
          paidDate: receiptDate,
          paymentMethod: 'T/T',
          bankReference,
          receivedBy: currentUser?.email || 'finance@cosunchina.com',
          notes: receiptNotes,
          proofUrl: detailDraft.balanceFileUrl || undefined,
          proofFileName: detailDraft.balanceFileName || undefined,
          status: 'confirmed',
          region: selectedOrder?.region || 'NA',
          createdBy: currentUser?.email || 'finance@cosunchina.com',
        }),
        '余款收款流水保存',
      ).catch((error) => {
        console.warn('余款到账主状态已保存，但收款流水写入失败:', error);
        toast.error(error?.message || '余款收款流水写入失败，主状态已保存');
        return null;
      });
      setSelectedRow((current) => current ? {
        ...current,
        receivedAmount: nextPaidAmount,
        remainingAmount: nextRemainingAmount,
        dueDate: current.balanceDueDate || current.dueDate,
        currentStageDueDate: current.balanceDueDate || current.currentStageDueDate || current.dueDate,
        flowKey: nextRemainingAmount <= 0 ? 'settled' : 'partial',
        flowLabel: nextRemainingAmount <= 0 ? receivableFlow.FLOW_LABELS.settled : receivableFlow.FLOW_LABELS.partial,
        flowTone: nextRemainingAmount <= 0 ? receivableFlow.FLOW_TONES.settled : receivableFlow.FLOW_TONES.partial,
        nextAction: nextRemainingAmount <= 0 ? '无需跟进' : '继续跟进回款',
        balanceReceiptProof: receiptPayload,
        balanceStageLabel: '余款已确认到账',
      } : current);
      setRowOverrides((current) => ({
        ...current,
        [selectedRow.orderNumber]: {
          receivedAmount: nextPaidAmount,
          remainingAmount: nextRemainingAmount,
          dueDate: selectedRow.balanceDueDate || selectedRow.dueDate,
          currentStageDueDate: selectedRow.balanceDueDate || selectedRow.currentStageDueDate || selectedRow.dueDate,
          flowKey: nextRemainingAmount <= 0 ? 'settled' : 'partial',
          flowLabel: nextRemainingAmount <= 0 ? receivableFlow.FLOW_LABELS.settled : receivableFlow.FLOW_LABELS.partial,
          flowTone: nextRemainingAmount <= 0 ? receivableFlow.FLOW_TONES.settled : receivableFlow.FLOW_TONES.partial,
          nextAction: nextRemainingAmount <= 0 ? '无需跟进' : '继续跟进回款',
          balanceReceiptProof: receiptPayload,
          balanceStageLabel: '余款已确认到账',
          paymentHistory: [
            ...selectedRow.paymentHistory,
            {
              date: receiptDate,
              amount: receiptRecognition.recognizedAmount,
              actualAmount: actualReceivedAmount,
              receivingBankFeeAmount: receiptRecognition.receivingBankFeeAmount,
              method: 'T/T',
              reference: bankReference,
              receivedBy: currentUser?.email || 'finance@cosunchina.com',
              notes: receiptNotes,
              proofUrl: detailDraft.balanceFileUrl || undefined,
              proofFileName: detailDraft.balanceFileName || undefined,
            } as any,
          ],
        },
      }));
      setDetailDraft((current) => ({
        ...current,
        balanceReceiptAmount: toNumericInputValue(actualReceivedAmount),
        balanceReceiptDate: receiptDate,
        balanceBankReference: bankReference,
        balanceNotes: detailDraft.balanceNotes || '',
      }));
      toast.success('余款到账已确认');
      setDetailOpen(false);
      setSelectedRow(null);
    } catch (error: any) {
      toast.error(error?.message || '余款到账确认失败');
    } finally {
      setDetailSaving(null);
    }
  };

  const rows = useMemo(() => {
    const orderLookup = new Map<string, any>();
    orders.forEach((order) => {
      if (order?.orderNumber) {
        orderLookup.set(order.orderNumber, order);
      }
    });

    const arLookup = new Map<string, any>();
    accountsReceivable.forEach((ar) => {
      const keys = [ar.orderNumber, ar.contractNumber, ar.arNumber]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      keys.forEach((key) => arLookup.set(key, ar));
    });

    const contractLookup = new Map<string, any>();
    contracts.forEach((contract) => {
      if (contract?.contractNumber) {
        contractLookup.set(contract.contractNumber, contract);
      }
    });

    const purchaseOrdersByContract = new Map<string, any[]>();
    purchaseOrders.forEach((po) => {
      const keys = [po.salesContractNumber, po.sourceRef, po.sourceSONumber, po.quotationNumber]
        .map((value) => String(value || '').trim())
        .filter(Boolean);
      keys.forEach((key) => {
        const current = purchaseOrdersByContract.get(key) || [];
        current.push(po);
        purchaseOrdersByContract.set(key, current);
      });
    });

    const rowsMap = new Map<string, LiveReceivableRow>();
    const sourceContracts = new Set<string>();

    const buildRow = (source: 'accounts_receivable' | 'sales_contract', raw: any, linkedOrder?: any, linkedContract?: any, linkedAr?: any): LiveReceivableRow => {
      const orderNumber = String(raw.orderNumber || raw.contractNumber || linkedContract?.contractNumber || linkedOrder?.orderNumber || '').trim();
      const contractNumber = String(raw.contractNumber || linkedContract?.contractNumber || orderNumber || '').trim() || undefined;
      const customerName = raw.customerName || raw.customer || linkedContract?.customerCompany || linkedContract?.customerName || linkedOrder?.customer || 'Unknown Customer';
      const customerEmail = raw.customerEmail || linkedOrder?.customerEmail || linkedContract?.customerEmail || '';
      const currency = raw.currency || linkedOrder?.currency || linkedContract?.currency || 'USD';
      const totalAmount = toPositiveNumber(raw.totalAmount || linkedOrder?.totalAmount || linkedContract?.totalAmount);
      const paidAmountFromAr = toPositiveNumber(raw.paidAmount);
      const receivedFromHistory = Array.isArray(raw.paymentHistory)
        ? raw.paymentHistory.reduce((sum: number, item: any) => sum + toPositiveNumber(item.amount), 0)
        : 0;
      const sourceHistory = Array.isArray(raw.paymentHistory) && raw.paymentHistory.length > 0
        ? raw.paymentHistory
        : Array.isArray(linkedAr?.paymentHistory) ? linkedAr.paymentHistory : [];
      const historyProofs = deriveReceiptProofsFromHistory(sourceHistory, currency);
      const depositProof = resolveProof(raw.depositProof || linkedOrder?.depositPaymentProof || linkedContract?.depositProof, linkedContract?.depositAmount, currency);
      const balanceProof = resolveProof(raw.balanceProof || linkedOrder?.balancePaymentProof || linkedContract?.balanceProof, linkedContract?.balanceAmount, currency);
      const depositCustomerAmount = resolveCustomerDepositAmount({
        totalAmount,
        contractDepositAmount: linkedContract?.depositAmount,
        depositProof,
        orderDepositProof: linkedOrder?.depositPaymentProof,
      });
      const balanceCustomerAmount = resolveCustomerBalanceAmount({
        totalAmount,
        depositCustomerAmount,
        contractBalanceAmount: linkedContract?.balanceAmount,
        balanceProof,
        orderBalanceProof: linkedOrder?.balancePaymentProof,
      });
      const contractDepositReceiptProof = linkedContract?.depositConfirmedAt
        ? {
            amount: toPositiveNumber(linkedContract?.depositAmount || depositCustomerAmount),
            actualAmount: toPositiveNumber(linkedContract?.depositAmount || depositCustomerAmount),
            currency,
            receiptDate: linkedContract.depositConfirmedAt,
            bankReference: linkedContract.depositConfirmNotes || '',
            uploadedAt: linkedContract.depositConfirmedAt,
            uploadedBy: linkedContract.depositConfirmedBy || '',
            notes: linkedContract.depositConfirmNotes || '',
            fileUrl: '',
            fileName: '',
          }
        : undefined;
      const contractWorkflow = linkedContract?.documentRenderMeta?.erpWorkflow || {};
      const contractBalanceReceiptProof = resolveProof(
        contractWorkflow.balanceReceiptProof || contractWorkflow.financeBalanceReceiptProof,
        linkedContract?.balanceAmount,
        currency,
      );
      const depositReceiptProof = resolveProof(
        linkedOrder?.depositReceiptProof || raw.depositReceiptProof || historyProofs.depositReceiptProof || contractDepositReceiptProof,
        linkedContract?.depositAmount,
        currency,
      );
      const balanceReceiptProof = resolveProof(
        linkedOrder?.balanceReceiptProof || raw.balanceReceiptProof || historyProofs.balanceReceiptProof || contractBalanceReceiptProof,
        linkedContract?.balanceAmount,
        currency,
      );
      const receivedAmount = paidAmountFromAr > 0
        ? paidAmountFromAr
        : depositReceiptProof || balanceReceiptProof
          ? [depositReceiptProof?.amount || depositReceiptProof?.actualAmount, balanceReceiptProof?.amount || balanceReceiptProof?.actualAmount].reduce((sum, value) => sum + toPositiveNumber(value), 0)
          : receivedFromHistory;
      const contractStatus = String(raw.contractStatus || linkedContract?.status || '').trim();
      const paymentMode = (linkedContract?.paymentMode || raw.paymentMode || raw.payment_mode || null) as PaymentMode | null;
      const balanceTrigger = (linkedContract?.balanceTrigger || raw.balanceTrigger || raw.balance_trigger || null) as BalanceTrigger | null;
      const statusSnapshot = receivableFlow.deriveReceivableStatus({
        totalAmount,
        receivedAmount,
        paymentMode,
        balanceTrigger,
        contractStatus,
        depositProof,
        depositReceiptProof,
        balanceProof,
        balanceReceiptProof,
      });
      const remainingAmount = statusSnapshot.remainingAmount;
      const fallbackDueDate = toDateOnly(
        raw.dueDate || linkedContract?.customerConfirmedAt || linkedContract?.createdAt || linkedOrder?.date || raw.createdAt || new Date().toISOString(),
      ) || new Date().toISOString().split('T')[0];
      const flowKey = statusSnapshot.flowKey;
      const depositDueDate = resolveDepositDueDate({ raw, linkedContract, linkedOrder });
      const balanceDueDate = resolveBalanceDueDate({
        raw,
        linkedContract,
        linkedOrder,
        paymentMode,
        balanceTrigger,
        depositDueDate,
        depositReceiptProof,
      });
      const dueDate = resolveCurrentStageDueDate({
        flowKey,
        depositDueDate,
        balanceDueDate,
        fallbackDueDate,
      }) || fallbackDueDate;
      const isOverdue = resolveIsOverdue({ dueDate, remainingAmount });
      const contractStatusLabel = CONTRACT_STATUS_LABELS[contractStatus] || (contractStatus ? `SC ${contractStatus}` : 'SC 待确认');
      const depositStageLabel = statusSnapshot.depositStageLabel;
      const balanceStageLabel = statusSnapshot.balanceStageLabel;
      const relevantPOs = Array.from(
        new Map(
          (purchaseOrdersByContract.get(contractNumber || orderNumber || '') || []).map((po) => [
            String(po.id || po.poNumber || JSON.stringify(po)),
            po,
          ]),
        ).values(),
      );
      const cgStatusLabel = resolveCgStatusLabel(relevantPOs);
      const paymentHistory = sourceHistory.length > 0
        ? sourceHistory
        : depositReceiptProof || balanceReceiptProof
          ? [
              ...(depositReceiptProof ? [{
                date: depositReceiptProof.receiptDate || depositReceiptProof.uploadedAt || '',
                amount: toPositiveNumber(depositReceiptProof.actualAmount),
                method: 'T/T',
                reference: depositReceiptProof.bankReference || '',
                receivedBy: depositReceiptProof.uploadedBy || '',
                notes: depositReceiptProof.notes || '定金到账',
                proofUrl: depositReceiptProof.fileUrl,
                proofFileName: depositReceiptProof.fileName,
              }] : []),
              ...(balanceReceiptProof ? [{
                date: balanceReceiptProof.receiptDate || balanceReceiptProof.uploadedAt || '',
                amount: toPositiveNumber(balanceReceiptProof.actualAmount),
                method: 'T/T',
                reference: balanceReceiptProof.bankReference || '',
                receivedBy: balanceReceiptProof.uploadedBy || '',
                notes: balanceReceiptProof.notes || '余款到账',
                proofUrl: balanceReceiptProof.fileUrl,
                proofFileName: balanceReceiptProof.fileName,
              }] : []),
            ]
          : [];

      return {
        id: raw.id || orderNumber || `${source}-${Date.now()}`,
        arNumber: raw.arNumber || raw.arNo || `YS-${String(orderNumber || 'NA').slice(-8)}`,
        orderNumber: orderNumber || '-',
        contractNumber,
        customer: customerName,
        customerEmail,
        currency,
        totalAmount,
        receivedAmount,
        remainingAmount,
        dueDate,
        depositDueDate,
        balanceDueDate,
        currentStageDueDate: dueDate,
        agingBucket: resolveAgingBucket({ dueDate, remainingAmount }),
        flowKey,
        flowLabel: statusSnapshot.flowLabel,
        flowTone: statusSnapshot.flowTone,
        nextAction: statusSnapshot.nextAction,
        contractStatus,
        contractStatusLabel,
        cgStatusLabel,
        cgCount: relevantPOs.length,
        depositStageLabel,
        balanceStageLabel,
        paymentTerms: raw.paymentTerms || linkedContract?.paymentTerms || '',
        paymentMode,
        balanceTrigger,
        isOverdue,
        depositProof: depositProof ? { ...depositProof, amount: depositCustomerAmount } : (depositCustomerAmount > 0 ? { amount: depositCustomerAmount, currency } : undefined),
        depositReceiptProof,
        balanceProof: balanceProof ? { ...balanceProof, amount: balanceCustomerAmount } : (balanceCustomerAmount > 0 ? { amount: balanceCustomerAmount, currency } : undefined),
        balanceReceiptProof,
        paymentHistory: paymentHistory.sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
        createdAt: raw.createdAt || linkedContract?.createdAt || linkedOrder?.createdAt,
        source,
      };
    };

    accountsReceivable.forEach((ar) => {
      const linkedOrder = orderLookup.get(ar.orderNumber) || orderLookup.get(ar.contractNumber || '');
      const linkedContract = contractLookup.get(ar.contractNumber || ar.orderNumber);
      const row = buildRow('accounts_receivable', ar, linkedOrder, linkedContract, ar);
      rowsMap.set(row.orderNumber, row);
      if (row.contractNumber) sourceContracts.add(row.contractNumber);
    });

    contracts.forEach((contract) => {
      const isRelevant = ['customer_confirmed', 'deposit_uploaded', 'deposit_confirmed', 'balance_uploaded', 'po_generated', 'production', 'balance_confirmed', 'shipped', 'completed'].includes(String(contract.status || ''));
      if (!isRelevant) return;
      if (sourceContracts.has(contract.contractNumber)) return;
      const linkedOrder = orderLookup.get(contract.contractNumber);
      const linkedAr = arLookup.get(contract.contractNumber) || arLookup.get(contract.id);
      const row = buildRow('sales_contract', {
        id: contract.id,
        arNumber: `YS-${contract.region || 'NA'}-${String(contract.contractNumber || '').slice(-8)}`,
        orderNumber: contract.contractNumber,
        contractNumber: contract.contractNumber,
        customerName: contract.customerCompany || contract.customerName || 'Unknown Customer',
        customerEmail: contract.customerEmail || '',
        currency: contract.currency || linkedOrder?.currency || 'USD',
        totalAmount: contract.totalAmount || linkedOrder?.totalAmount || 0,
        paidAmount: 0,
        remainingAmount: contract.totalAmount || linkedOrder?.totalAmount || 0,
        dueDate: contract.customerConfirmedAt || contract.createdAt || new Date().toISOString(),
        paymentTerms: contract.paymentTerms || '',
        depositProof: contract.depositProof || linkedOrder?.depositPaymentProof || undefined,
        balanceProof: linkedOrder?.balancePaymentProof || undefined,
        paymentHistory: [],
        contractStatus: contract.status,
        createdAt: contract.createdAt,
      }, linkedOrder, contract, linkedAr);
      rowsMap.set(row.orderNumber, row);
    });

    // 兜底：直接扫描 orders，凡是有 depositPaymentProof 的订单，
    // 若尚无对应行（合同或 AR 都未匹配），自动补充显示，确保财务不会漏收数据。
    orders.forEach((order) => {
      if (!order.depositPaymentProof) return;
      const key = order.orderNumber || order.contractNumber || order.id;
      if (!key) return;
      if (rowsMap.has(key)) return; // 已经有对应行，跳过
      const linkedAr = arLookup.get(key) || arLookup.get(order.contractNumber || '');
      const linkedContract = contractLookup.get(order.contractNumber || key) || contractLookup.get(key);
      if (linkedContract && ['deposit_confirmed', 'po_generated', 'production', 'balance_uploaded', 'balance_confirmed', 'shipped', 'completed'].includes(String(linkedContract.status || ''))) return; // 已到更晚阶段，跳过
      const row = buildRow('sales_contract', {
        id: order.id,
        arNumber: `YS-${order.region || 'NA'}-${String(key).slice(-8)}`,
        orderNumber: key,
        contractNumber: order.contractNumber || key,
        customerName: order.customer || 'Unknown Customer',
        customerEmail: order.customerEmail || '',
        currency: order.currency || 'USD',
        totalAmount: order.totalAmount || 0,
        paidAmount: 0,
        remainingAmount: order.totalAmount || 0,
        dueDate: order.confirmedAt || order.createdAt || new Date().toISOString(),
        paymentTerms: order.paymentTerms || '',
        depositProof: order.depositPaymentProof,
        balanceProof: order.balancePaymentProof || undefined,
        paymentHistory: [],
        contractStatus: linkedContract?.status || 'deposit_uploaded',
        createdAt: order.createdAt,
      }, order, linkedContract || undefined, linkedAr);
      rowsMap.set(key, row);
    });

    const query = search.trim().toLowerCase();
    return Array.from(rowsMap.values())
      .map((row) => {
        const override = rowOverrides[row.orderNumber];
        return override ? { ...row, ...override } : row;
      })
      .filter((row) => {
        if (!query) return true;
        return [
          row.arNumber,
          row.orderNumber,
          row.contractNumber,
          row.customer,
          row.customerEmail,
          row.flowLabel,
          row.contractStatusLabel,
          row.cgStatusLabel,
          row.nextAction,
        ].join(' ').toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const priority: Record<ReceivableFlowKey, number> = {
          deposit_review: 0,
          balance_review: 1,
          waiting_deposit: 2,
          waiting_balance: 3,
          waiting_shipment_trigger: 4,
          waiting_lc: 5,
          partial: 6,
          overdue: 7,
          settled: 8,
        };
        const byPriority = priority[a.flowKey] - priority[b.flowKey];
        if (byPriority !== 0) return byPriority;
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        return String(a.dueDate || '').localeCompare(String(b.dueDate || ''));
      });
  }, [accountsReceivable, contracts, orders, payments, purchaseOrders, rowOverrides, search]);

  React.useEffect(() => {
    if (!selectedRow) return;
    const latestRow = rows.find((row) => row.orderNumber === selectedRow.orderNumber || row.id === selectedRow.id);
    if (!latestRow) return;
    const keepLocalDepositReceipt = Boolean(selectedRow.depositReceiptProof) && !latestRow.depositReceiptProof;
    const keepLocalBalanceReceipt = Boolean(selectedRow.balanceReceiptProof) && !latestRow.balanceReceiptProof;
    const mergedRow = (keepLocalDepositReceipt || keepLocalBalanceReceipt)
      ? {
          ...latestRow,
          receivedAmount: Math.max(latestRow.receivedAmount, selectedRow.receivedAmount),
          remainingAmount: Math.min(latestRow.remainingAmount, selectedRow.remainingAmount),
          flowKey: selectedRow.flowKey,
          flowLabel: selectedRow.flowLabel,
          flowTone: selectedRow.flowTone,
          nextAction: selectedRow.nextAction,
          depositReceiptProof: latestRow.depositReceiptProof || selectedRow.depositReceiptProof,
          balanceReceiptProof: latestRow.balanceReceiptProof || selectedRow.balanceReceiptProof,
          depositStageLabel: latestRow.depositReceiptProof ? latestRow.depositStageLabel : selectedRow.depositStageLabel,
          balanceStageLabel: latestRow.balanceReceiptProof ? latestRow.balanceStageLabel : selectedRow.balanceStageLabel,
          paymentHistory: latestRow.paymentHistory.length >= selectedRow.paymentHistory.length ? latestRow.paymentHistory : selectedRow.paymentHistory,
        }
      : latestRow;
    if (
      mergedRow.receivedAmount !== selectedRow.receivedAmount
      || mergedRow.remainingAmount !== selectedRow.remainingAmount
      || mergedRow.flowKey !== selectedRow.flowKey
      || mergedRow.depositReceiptProof?.actualAmount !== selectedRow.depositReceiptProof?.actualAmount
      || mergedRow.balanceReceiptProof?.actualAmount !== selectedRow.balanceReceiptProof?.actualAmount
    ) {
      setSelectedRow(mergedRow);
    }
  }, [rows, selectedRow]);

  const stats = useMemo(() => {
    const totalReceivable = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    const receivedAmount = rows.reduce((sum, row) => sum + row.receivedAmount, 0);
    const overdueRows = rows.filter((row) => row.isOverdue && row.remainingAmount > 0);
    const overdueAmount = overdueRows.reduce((sum, row) => sum + row.remainingAmount, 0);
    const overdueCount = overdueRows.length;
    const pendingDepositCount = rows.filter((row) => row.flowKey === 'waiting_deposit').length;
    const pendingReviewCount = rows.filter((row) => row.flowKey === 'deposit_review' || row.flowKey === 'balance_review').length;
    const pendingCustomerBalanceCount = rows.filter((row) => row.flowKey === 'waiting_balance').length;
    const pendingShipmentTriggerCount = rows.filter((row) => row.flowKey === 'waiting_shipment_trigger').length;
    const pendingLcCount = rows.filter((row) => row.flowKey === 'waiting_lc').length;
    const collectionRate = totalReceivable > 0 ? (receivedAmount / totalReceivable) * 100 : 100;
    const currentMonthReceived = payments
      .filter((payment) => payment.status === 'confirmed' && isSameMonth(payment.paymentDate, new Date()))
      .reduce((sum, payment) => sum + payment.amount, 0);
    const totalBreakdown = summarizeByCurrency(rows.map((row) => ({ currency: row.currency, amount: row.totalAmount })));
    const receivedBreakdown = summarizeByCurrency(rows.map((row) => ({ currency: row.currency, amount: row.receivedAmount })));
    const overdueBreakdown = summarizeByCurrency(overdueRows.map((row) => ({ currency: row.currency, amount: row.remainingAmount })));
    const monthBreakdown = summarizeByCurrency(payments.filter((payment) => payment.status === 'confirmed' && isSameMonth(payment.paymentDate, new Date())).map((payment) => ({ currency: payment.currency, amount: payment.amount })));

    return {
      totalReceivable,
      receivedAmount,
      overdueAmount,
      overdueCount,
      pendingDepositCount,
      pendingReviewCount,
      pendingCustomerBalanceCount,
      pendingShipmentTriggerCount,
      pendingLcCount,
      collectionRate,
      currentMonthReceived,
      totalBreakdown,
      receivedBreakdown,
      overdueBreakdown,
      monthBreakdown,
    };
  }, [payments, rows]);

  const stripItems = [
    {
      id: 'total',
      label: '应收总额（敞口）',
      value: stats.totalBreakdown.display,
      sub: `${rows.length} 笔 · 按币种汇总`,
      tone: 'default' as const,
    },
    {
      id: 'received',
      label: '已收金额',
      value: stats.receivedBreakdown.display,
      sub: `${payments.filter((payment) => payment.status === 'confirmed').length} 笔收款`,
      tone: 'ok' as const,
    },
    {
      id: 'overdue',
      label: '逾期敞口',
      value: stats.overdueBreakdown.display,
      sub: `${stats.overdueCount} 笔`,
      tone: 'danger' as const,
    },
    {
      id: 'rate',
      label: '回款概况',
      value: stats.totalBreakdown.singleCurrency ? `${stats.collectionRate.toFixed(1)}%` : '多币种',
      sub: stats.totalBreakdown.singleCurrency
        ? `本月已确认 ${stats.monthBreakdown.display}`
        : `本月已确认 ${stats.monthBreakdown.display}`,
      tone: 'ok' as const,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 bg-slate-100/50">
      <div className="px-2 pb-2 pt-1.5">
        <FinanceStatStrip items={stripItems} />

        <div className="mt-1.5 rounded border border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold leading-[1.35] text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              <CircleDot className="h-3.5 w-3.5 text-slate-500" />
              待客户上传 {rows.filter((row) => row.flowKey === 'waiting_deposit').length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
              <Clock3 className="h-3.5 w-3.5" />
              待财务确认 {rows.filter((row) => row.flowKey === 'deposit_review' || row.flowKey === 'balance_review').length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              待客户上传余款 {stats.pendingCustomerBalanceCount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              待出货触发余款 {stats.pendingShipmentTriggerCount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-sky-200 bg-sky-50 px-2.5 py-1 text-sky-700">
              <FileCheck className="h-3.5 w-3.5" />
              待信用证落实 {stats.pendingLcCount}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              逾期 {rows.filter((row) => row.isOverdue && row.remainingAmount > 0).length}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已结清 {rows.filter((row) => row.flowKey === 'settled').length}
            </span>
          </div>
        </div>

        <div className="mt-1.5">
          <FinanceFilterBar
            placeholder="应收号 / 客户 / SC 订单 / 流转状态…"
            value={search}
            onChange={setSearch}
            onReset={() => setSearch('')}
            extra={(
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 shrink-0 border-slate-300 px-3.5 text-[13px] font-semibold leading-[1.35]"
                onClick={async () => {
                  window.dispatchEvent(new CustomEvent('ordersUpdated'));
                  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
                  await refreshContracts();
                  toast.success('已从数据库拉取最新数据');
                }}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                刷新
              </Button>
            )}
          />
        </div>

        <div className="mt-1.5 overflow-auto border border-slate-300 bg-white">
          <table className="w-full border-collapse text-left text-[12px] leading-[1.4]">
            <thead>
              <tr className="bg-slate-100">
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>应收号</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>订单 / 合同</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>客户</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>合同额</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>已收</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>未回款</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>到期日</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>账龄档</th>
                <th className="border-r border-slate-200 px-2 py-2 text-center font-semibold text-amber-700" colSpan={2}>定金</th>
                <th className="border-r border-slate-200 px-2 py-2 text-center font-semibold text-sky-700" colSpan={2}>余款</th>
                <th className="border-r border-slate-200 px-2 py-2 font-semibold" rowSpan={2}>流转状态</th>
                <th className="px-2 py-2 font-semibold" rowSpan={2}>操作</th>
              </tr>
              <tr className="border-b border-slate-300 bg-slate-100 text-[10px]">
                <th className="border-r border-slate-200 px-2 py-1 font-medium text-slate-500">客户付款凭证</th>
                <th className="border-r border-slate-200 px-2 py-1 font-medium text-slate-500">财务收款确认</th>
                <th className="border-r border-slate-200 px-2 py-1 font-medium text-slate-500">客户付款凭证</th>
                <th className="border-r border-slate-200 px-2 py-1 font-medium text-slate-500">财务收款确认</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-2 py-10 text-center text-[12px] text-slate-500">
                    暂无匹配应收数据
                  </td>
                </tr>
              ) : rows.map((row) => (
                (() => {
                  const displayFlow = resolveFlowDisplay(row);
                  return (
                <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono font-normal text-slate-700">{row.arNumber}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5">
                    <div className="space-y-0.5">
                      <div className="font-mono font-semibold text-slate-800">{row.orderNumber}</div>
                      <div className="text-[10px] text-slate-500">{row.contractStatusLabel}</div>
                      <div className="text-[10px] text-slate-500">
                        {getPaymentModeLabel(row.paymentMode)}
                        {row.balanceTrigger ? ` · ${BALANCE_TRIGGER_OPTIONS.find((option) => option.value === row.balanceTrigger)?.label || row.balanceTrigger}` : ''}
                      </div>
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2.5">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-slate-700">{row.customer}</div>
                      <div className="text-[10px] text-slate-500">{row.customerEmail || '—'}</div>
                    </div>
                  </td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono tabular-nums text-slate-800">{formatMoney(row.totalAmount, row.currency)}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono tabular-nums text-emerald-800">{formatMoney(row.receivedAmount, row.currency)}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono tabular-nums text-amber-900">{formatMoney(row.remainingAmount, row.currency)}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-mono tabular-nums text-slate-700">{formatDate(row.dueDate)}</td>
                  <td className="border-r border-slate-100 px-2 py-2.5 font-semibold text-slate-700">{row.agingBucket}</td>
                  {/* 4 凭证状态格 */}
                  {[
                    { has: Boolean(row.depositProof), label: row.depositStageLabel === '无需定金' ? '无需定金' : row.depositProof ? '已上传' : '待上传', tone: row.depositProof ? 'ok' : 'none', isDeposit: true },
                    { has: Boolean(row.depositReceiptProof), label: row.depositStageLabel === '无需定金' ? '—' : row.depositReceiptProof ? '已确认' : '待确认', tone: row.depositReceiptProof ? 'ok' : row.depositProof ? 'warn' : 'none', isDeposit: true },
                    { has: Boolean(row.balanceProof), label: row.remainingAmount <= 0 ? '已结清' : row.balanceProof ? '已上传' : '待上传', tone: row.remainingAmount <= 0 ? 'ok' : row.balanceProof ? 'ok' : 'none', isBalance: true },
                    { has: Boolean(row.balanceReceiptProof), label: row.remainingAmount <= 0 ? '—' : row.balanceReceiptProof ? '已确认' : '待确认', tone: row.balanceReceiptProof ? 'ok' : row.balanceProof ? 'warn' : 'none', isBalance: true },
                  ].map((cell, ci) => (
                    <td key={ci} className="border-r border-slate-100 px-2 py-2.5 text-center">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        cell.tone === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : cell.tone === 'warn' ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {cell.label}
                      </span>
                    </td>
                  ))}
                  <td className="border-r border-slate-100 px-2 py-2.5">
                    <div className="space-y-1">
                      <Badge className={`h-5 px-2 text-xs border ${STAT_TONE_CLASS[displayFlow.tone]} text-slate-700`}>
                        {displayFlow.label}
                      </Badge>
                      <div className="text-[10px] text-slate-500">{row.nextAction}</div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        setSelectedRow(row);
                        setDetailOpen(true);
                      }}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      详情
                    </Button>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          unstyled
          className="fixed left-1/2 top-1/2 z-50 h-auto max-h-[calc(100dvh-2rem)] w-[min(88vw,64rem)] max-w-none -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border bg-white p-0 shadow-lg duration-200"
        >
          {selectedRow ? (
            <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-50">
              <DialogHeader className="border-b border-slate-200 bg-white px-6 py-5 text-left">
                <div className="flex items-start justify-between gap-4 pr-10">
                  <div>
                    <DialogTitle className="text-[1.25rem] font-semibold tracking-tight text-slate-900">
                      {selectedRow.arNumber}
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-slate-600">
                      {selectedRow.customer} · {selectedRow.orderNumber}
                    </DialogDescription>
                  </div>
                  <Badge className={`border ${STAT_TONE_CLASS[selectedRow.flowTone]} text-slate-700`}>
                    {selectedRow.flowLabel}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 p-5">
                  <ReceivableDetailStageSummary row={selectedRow} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-emerald-600" />
                          定金信息
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-md border border-slate-200">
                        {[
                          {
                            label: '定金凭证',
                            value: (selectedRow.depositProof?.fileUrl || selectedOrder?.depositPaymentProof?.fileUrl || detailDraft.depositFileUrl) ? '可下载' : '暂无',
                            isLink: true,
                            url: detailDraft.depositFileUrl || selectedRow.depositProof?.fileUrl || selectedOrder?.depositPaymentProof?.fileUrl,
                          },
                          { label: '定金金额', value: detailDraft.depositAmount ? formatMoney(Number(detailDraft.depositAmount), selectedRow.currency) : '-' },
                          {
                            label: '实际到账',
                            value:
                              detailDraft.depositReceiptAmount
                                ? formatMoney(Number(detailDraft.depositReceiptAmount), selectedRow.currency)
                                : selectedRow.depositReceiptProof?.actualAmount || selectedOrder?.depositReceiptProof?.actualAmount
                                  ? formatMoney(
                                      Number(selectedRow.depositReceiptProof?.actualAmount || selectedOrder?.depositReceiptProof?.actualAmount),
                                      selectedRow.currency,
                                    )
                                  : detailDraft.depositFileUrl
                                    ? '待财务录入'
                                    : '-',
                            isEditable: depositReceiptReady && !detailDraft.depositReceiptAmount,
                          },
                          { label: '汇款日期', value: formatDate(detailDraft.depositRemittanceDate) },
                          { label: '定金到期日', value: formatDate(selectedRow.depositDueDate) },
                          { label: '到账日期', value: formatDate(detailDraft.depositReceiptDate || selectedRow.depositReceiptProof?.receiptDate || selectedOrder?.depositReceiptProof?.receiptDate) },
                          { label: '上传人员', value: detailDraft.depositFileUrl ? formatPersonName(detailDraft.depositUploadedBy) : '' },
                        ].map((item, index) => (
                          <div
                            key={item.label}
                            className={`flex items-center justify-between gap-4 px-4 py-3 text-[13px] ${
                              index === 0 ? '' : 'border-t border-slate-200'
                            }`}
                          >
                            <div className="w-24 shrink-0 font-medium text-slate-400">{item.label}</div>
                            <div className="min-w-0 flex-1 text-right font-mono tabular-nums text-slate-900">
                              {item.isLink ? (
                                <button
                                  type="button"
                                  className="inline-flex max-w-full items-center justify-end gap-1 truncate text-right font-sans text-[13px] font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                                  onClick={() => handleProofClick(item.url, detailDraft.depositFileName || selectedRow.depositProof?.fileName || selectedOrder?.depositPaymentProof?.fileName)}
                                >
                                  {item.url ? <Download className="h-3.5 w-3.5 shrink-0" /> : null}
                                  <span className="truncate">{item.value}</span>
                                </button>
                              ) : item.label === '实际到账' && depositReceiptReady ? (
                                <Input
                                  value={detailDraft.depositReceiptAmount}
                                  onChange={(event) => setDetailDraft((current) => ({ ...current, depositReceiptAmount: event.target.value }))}
                                  inputMode="decimal"
                                  placeholder="输入到账金额"
                                  className="ml-auto h-8 w-40 border-slate-300 bg-white text-right text-sm"
                                />
                              ) : item.label === '到账日期' && depositReceiptReady ? (
                                <Input
                                  type="date"
                                  value={detailDraft.depositReceiptDate}
                                  onChange={(event) => setDetailDraft((current) => ({ ...current, depositReceiptDate: event.target.value }))}
                                  className="ml-auto h-8 w-40 border-slate-300 bg-white text-sm"
                                />
                              ) : (
                                <span>{item.value}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 border-slate-800 bg-slate-800 px-3 text-xs text-white hover:bg-slate-700"
                          disabled={detailSaving === 'deposit-receipt' || !depositReceiptReady}
                          onClick={confirmDepositReceipt}
                        >
                          {depositReceiptLocked
                            ? '已确认到账'
                            : detailSaving === 'deposit-receipt'
                              ? '确认中...'
                              : '确认定金到账'}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-sky-600" />
                          余款信息
                        </div>
                      </div>
                      <div className="overflow-hidden rounded-md border border-slate-200">
                        {[
                          {
                            label: '余款凭证',
                            value: (selectedRow.balanceProof?.fileUrl || selectedOrder?.balancePaymentProof?.fileUrl || detailDraft.balanceFileUrl) ? '可下载' : '暂无',
                            isLink: true,
                            url: detailDraft.balanceFileUrl || selectedRow.balanceProof?.fileUrl || selectedOrder?.balancePaymentProof?.fileUrl,
                          },
                          { label: '余款金额', value: detailDraft.balanceAmount ? formatMoney(Number(detailDraft.balanceAmount), selectedRow.currency) : '-' },
                          {
                            label: '实际到账',
                            value:
                              detailDraft.balanceReceiptAmount
                                ? formatMoney(Number(detailDraft.balanceReceiptAmount), selectedRow.currency)
                                : selectedRow.balanceReceiptProof?.actualAmount || selectedOrder?.balanceReceiptProof?.actualAmount
                                  ? formatMoney(
                                      Number(selectedRow.balanceReceiptProof?.actualAmount || selectedOrder?.balanceReceiptProof?.actualAmount),
                                      selectedRow.currency,
                                    )
                                  : detailDraft.balanceFileUrl
                                    ? '待财务录入'
                                    : '-',
                            isEditable: balanceReceiptReady && !detailDraft.balanceReceiptAmount,
                          },
                          { label: '汇款日期', value: formatDate(detailDraft.balanceRemittanceDate) },
                          { label: '余款到期日', value: formatDate(selectedRow.balanceDueDate) },
                          { label: '到账日期', value: formatDate(detailDraft.balanceReceiptDate || selectedRow.balanceReceiptProof?.receiptDate || selectedOrder?.balanceReceiptProof?.receiptDate) },
                          { label: '上传人员', value: detailDraft.balanceFileUrl ? formatPersonName(detailDraft.balanceUploadedBy) : '' },
                        ].map((item, index) => (
                          <div
                            key={item.label}
                            className={`flex items-center justify-between gap-4 px-4 py-3 text-[13px] ${
                              index === 0 ? '' : 'border-t border-slate-200'
                            }`}
                          >
                            <div className="w-24 shrink-0 font-medium text-slate-400">{item.label}</div>
                            <div className="min-w-0 flex-1 text-right font-mono tabular-nums text-slate-900">
                              {item.isLink ? (
                                <button
                                  type="button"
                                  className="inline-flex max-w-full items-center justify-end gap-1 truncate text-right font-sans text-[13px] font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
                                  onClick={() => handleProofClick(item.url, detailDraft.balanceFileName || selectedRow.balanceProof?.fileName || selectedOrder?.balancePaymentProof?.fileName)}
                                >
                                  {item.url ? <Download className="h-3.5 w-3.5 shrink-0" /> : null}
                                  <span className="truncate">{item.value}</span>
                                </button>
                              ) : item.label === '实际到账' && balanceReceiptReady ? (
                                <Input
                                  value={detailDraft.balanceReceiptAmount}
                                  onChange={(event) => setDetailDraft((current) => ({ ...current, balanceReceiptAmount: event.target.value }))}
                                  inputMode="decimal"
                                  placeholder="输入到账金额"
                                  className="ml-auto h-8 w-40 border-slate-300 bg-white text-right text-sm"
                                />
                              ) : item.label === '到账日期' && balanceReceiptReady ? (
                                <Input
                                  type="date"
                                  value={detailDraft.balanceReceiptDate}
                                  onChange={(event) => setDetailDraft((current) => ({ ...current, balanceReceiptDate: event.target.value }))}
                                  className="ml-auto h-8 w-40 border-slate-300 bg-white text-sm"
                                />
                              ) : (
                                <span>{item.value}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 border-slate-800 bg-slate-800 px-3 text-xs text-white hover:bg-slate-700"
                          disabled={detailSaving === 'balance-receipt' || !balanceReceiptReady}
                          onClick={confirmBalanceReceipt}
                        >
                          {balanceReceiptLocked
                            ? '已确认到账'
                            : detailSaving === 'balance-receipt'
                              ? '确认中...'
                              : '确认余款到账'}
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
