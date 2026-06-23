import type { PaymentMode } from '../contexts/SalesQuotationContext';
import {
  deriveBalanceTrigger,
  isNoDepositPaymentMode,
  type BalanceTrigger,
} from './paymentFlow';

export type ReceivableFlowKey =
  | 'waiting_deposit'
  | 'deposit_review'
  | 'waiting_full_payment'
  | 'waiting_balance'
  | 'waiting_shipment_trigger'
  | 'waiting_lc'
  | 'balance_review'
  | 'partial'
  | 'overdue'
  | 'settled';

export type StatTone = 'default' | 'warn' | 'danger' | 'ok';

export interface ReceivableStatusInput {
  totalAmount: number;
  receivedAmount: number;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
  depositProof?: any;
  depositReceiptProof?: any;
  balanceProof?: any;
  balanceReceiptProof?: any;
}

export interface ReceivableStatusSnapshot {
  remainingAmount: number;
  flowKey: ReceivableFlowKey;
  flowLabel: string;
  flowTone: StatTone;
  depositStageLabel: string;
  balanceStageLabel: string;
  nextAction: string;
}

export const FLOW_LABELS: Record<ReceivableFlowKey, string> = {
  waiting_deposit: '待客户上传定金',
  deposit_review: '待财务确认定金',
  waiting_full_payment: '待客户支付全款',
  waiting_balance: '待客户上传余款',
  waiting_shipment_trigger: '待出货触发余款',
  waiting_lc: '待信用证落实',
  balance_review: '待财务确认余款',
  partial: '部分收款',
  overdue: '逾期',
  settled: '已结清',
};

export const FLOW_TONES: Record<ReceivableFlowKey, StatTone> = {
  waiting_deposit: 'default',
  deposit_review: 'warn',
  waiting_full_payment: 'warn',
  waiting_balance: 'warn',
  waiting_shipment_trigger: 'default',
  waiting_lc: 'default',
  balance_review: 'warn',
  partial: 'default',
  overdue: 'danger',
  settled: 'ok',
};

function toPositiveNumber(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function isShipmentTriggered(contractStatus?: string) {
  const normalized = String(contractStatus || '').trim().toLowerCase();
  return normalized === 'balance_confirmed' || normalized === 'shipped' || normalized === 'completed';
}

function resolvePendingBalanceFlowKey(params: {
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
}): ReceivableFlowKey {
  const trigger = deriveBalanceTrigger(params.paymentMode, params.balanceTrigger);
  if (trigger === 'lc_ready') return 'waiting_lc';
  if (trigger === 'before_production') return 'waiting_full_payment';
  if (trigger === 'after_shipment' && !isShipmentTriggered(params.contractStatus)) {
    return 'waiting_shipment_trigger';
  }
  return 'waiting_balance';
}

export function resolveReceiptTolerance(expectedAmount: number) {
  if (expectedAmount <= 0) return 0.01;
  return Math.max(0.01, Math.min(50, expectedAmount * 0.01));
}

export function normalizeRemainingAmount(totalAmount: number, receivedAmount: number) {
  const rawRemaining = Math.max(toPositiveNumber(totalAmount) - toPositiveNumber(receivedAmount), 0);
  return rawRemaining <= resolveReceiptTolerance(totalAmount) ? 0 : rawRemaining;
}

export function resolveFlowKey(params: {
  remainingAmount: number;
  paymentMode?: PaymentMode | null;
  balanceTrigger?: BalanceTrigger | null;
  contractStatus?: string;
  depositProof?: any;
  depositReceiptProof?: any;
  balanceProof?: any;
  balanceReceiptProof?: any;
}): ReceivableFlowKey {
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

export function resolveDepositStageLabel(params: {
  paymentMode?: PaymentMode | null;
  depositProof?: any;
  depositReceiptProof?: any;
}) {
  if (params.paymentMode === 'tt_100_before_production') return '整款预付';
  if (isNoDepositPaymentMode(params.paymentMode)) return '无需定金';
  if (params.depositReceiptProof) return '定金已确认到账';
  if (params.depositProof) return '待财务确认定金到账';
  return '待客户上传定金';
}

export function resolveBalanceStageLabel(params: {
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
  return FLOW_LABELS[pendingFlowKey];
}

export function resolveNextAction(flowKey: ReceivableFlowKey) {
  return flowKey === 'waiting_deposit' ? '等待客户上传定金'
    : flowKey === 'deposit_review' ? '财务确认定金到账'
    : flowKey === 'waiting_full_payment' ? '等待客户支付全款'
    : flowKey === 'waiting_balance' ? '等待客户上传余款'
    : flowKey === 'waiting_shipment_trigger' ? '等待出货后触发余款'
    : flowKey === 'waiting_lc' ? '等待信用证落实'
    : flowKey === 'balance_review' ? '财务确认余款到账'
    : flowKey === 'settled' ? '无需跟进'
    : '继续跟进回款';
}

export function deriveReceivableStatus(input: ReceivableStatusInput): ReceivableStatusSnapshot {
  const remainingAmount = normalizeRemainingAmount(input.totalAmount, input.receivedAmount);
  const flowKey = resolveFlowKey({
    remainingAmount,
    paymentMode: input.paymentMode,
    balanceTrigger: input.balanceTrigger,
    contractStatus: input.contractStatus,
    depositProof: input.depositProof,
    depositReceiptProof: input.depositReceiptProof,
    balanceProof: input.balanceProof,
    balanceReceiptProof: input.balanceReceiptProof,
  });

  return {
    remainingAmount,
    flowKey,
    flowLabel: FLOW_LABELS[flowKey],
    flowTone: FLOW_TONES[flowKey],
    depositStageLabel: resolveDepositStageLabel({
      paymentMode: input.paymentMode,
      depositProof: input.depositProof,
      depositReceiptProof: input.depositReceiptProof,
    }),
    balanceStageLabel: resolveBalanceStageLabel({
      remainingAmount,
      paymentMode: input.paymentMode,
      balanceTrigger: input.balanceTrigger,
      contractStatus: input.contractStatus,
      balanceProof: input.balanceProof,
      balanceReceiptProof: input.balanceReceiptProof,
      depositReceiptProof: input.depositReceiptProof,
    }),
    nextAction: resolveNextAction(flowKey),
  };
}
