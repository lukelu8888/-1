import type { PaymentMode } from '../contexts/SalesQuotationContext';

export type BalanceTrigger =
  | 'after_deposit'
  | 'before_production'
  | 'before_shipment'
  | 'after_shipment'
  | 'lc_ready';

export const PAYMENT_MODE_OPTIONS: Array<{
  value: PaymentMode;
  label: string;
  description: string;
}> = [
  {
    value: 'tt_deposit_balance_before_shipment',
    label: '定金 + 出货前余款',
    description: '客户先付定金，出货前付清余款。',
  },
  {
    value: 'tt_deposit_balance_against_bl',
    label: '定金 + 见提单副本余款',
    description: '客户先付定金，见提单副本后支付余款。',
  },
  {
    value: 'tt_100_before_production',
    label: '100% T/T 生产前全款',
    description: '客户需在投产前支付 100% 货款，常用于模具开发或定制类产品。',
  },
  {
    value: 'deposit_plus_lc',
    label: '定金 + 信用证',
    description: '客户先付定金，剩余货款通过信用证支付。',
  },
  {
    value: 'lc_100',
    label: '100% 信用证',
    description: '无定金，整单通过信用证结算。',
  },
  {
    value: 'dp',
    label: 'D/P 付款交单',
    description: '客户在交单环节付款赎单。',
  },
  {
    value: 'da',
    label: 'D/A 承兑交单',
    description: '客户承兑后赎单，属于出货后回款。',
  },
  {
    value: 'oa',
    label: 'OA 账期',
    description: '无定金，按账期在出货后回款。',
  },
];

export const BALANCE_TRIGGER_OPTIONS: Array<{
  value: BalanceTrigger;
  label: string;
  description: string;
}> = [
  {
    value: 'after_deposit',
    label: '定金确认后触发',
    description: '定金确认后即可进入下一付款阶段。',
  },
  {
    value: 'before_production',
    label: '投产前触发',
    description: '客户需在开始生产前完成全额付款。',
  },
  {
    value: 'before_shipment',
    label: '出货前触发',
    description: '余款需在出货前完成。',
  },
  {
    value: 'after_shipment',
    label: '出货后触发',
    description: '余款或收款动作在出货/交单后开启。',
  },
  {
    value: 'lc_ready',
    label: '信用证到位触发',
    description: '下一阶段由信用证到位驱动。',
  },
];

export function deriveBalanceTrigger(
  paymentMode: PaymentMode | null | undefined,
  explicitTrigger?: BalanceTrigger | string | null,
): BalanceTrigger {
  const normalizedExplicit = String(explicitTrigger || '').trim();
  if (
    normalizedExplicit === 'after_deposit'
    || normalizedExplicit === 'before_production'
    || normalizedExplicit === 'before_shipment'
    || normalizedExplicit === 'after_shipment'
    || normalizedExplicit === 'lc_ready'
  ) {
    return normalizedExplicit;
  }

  switch (paymentMode) {
    case 'tt_100_before_production':
      return 'before_production';
    case 'tt_deposit_balance_against_bl':
    case 'dp':
    case 'da':
    case 'oa':
      return 'after_shipment';
    case 'lc_100':
    case 'deposit_plus_lc':
      return 'lc_ready';
    case 'tt_deposit_balance_before_shipment':
    default:
      return 'before_shipment';
  }
}

export function isNoDepositPaymentMode(paymentMode: PaymentMode | null | undefined): boolean {
  return paymentMode === 'oa' || paymentMode === 'lc_100' || paymentMode === 'tt_100_before_production';
}

export function getDefaultDepositPercentage(paymentMode: PaymentMode | null | undefined): number {
  return isNoDepositPaymentMode(paymentMode) ? 0 : 30;
}

export function getDefaultBalancePercentage(paymentMode: PaymentMode | null | undefined): number {
  return 100 - getDefaultDepositPercentage(paymentMode);
}

export function getPaymentModeLabel(paymentMode: PaymentMode | null | undefined): string {
  return PAYMENT_MODE_OPTIONS.find((option) => option.value === paymentMode)?.label || '未设置';
}

export function buildPaymentTermsText(
  paymentMode: PaymentMode | null | undefined,
  explicitTrigger?: BalanceTrigger | string | null,
): string {
  const trigger = deriveBalanceTrigger(paymentMode, explicitTrigger);

  switch (paymentMode) {
    case 'tt_deposit_balance_before_shipment':
      return 'T/T 30% 定金，70% 余款出货前付清。';
    case 'tt_deposit_balance_against_bl':
      return 'T/T 30% 定金，70% 余款见提单副本后支付。';
    case 'tt_100_before_production':
      return 'T/T 100% 货款生产前付清。';
    case 'deposit_plus_lc':
      return 'T/T 30% 定金，70% 余款通过信用证支付。';
    case 'lc_100':
      return '100% 信用证付款。';
    case 'dp':
      return 'D/P 付款交单，客户在交单环节付款赎单。';
    case 'da':
      return 'D/A 承兑交单，客户承兑后按约定账期付款。';
    case 'oa':
      return 'OA 账期付款，客户按约定账期在出货后付款。';
    default:
      switch (trigger) {
        case 'after_shipment':
          return '客户在出货后进入付款阶段。';
        case 'before_production':
          return '客户需在投产前完成全额付款。';
        case 'lc_ready':
          return '付款按信用证到位执行。';
        case 'after_deposit':
          return '定金确认后进入下一付款阶段。';
        case 'before_shipment':
        default:
          return '付款按合同约定在出货前完成。';
      }
  }
}

export function buildPaymentTermsTextEn(
  paymentMode: PaymentMode | null | undefined,
  explicitTrigger?: BalanceTrigger | string | null,
  options?: {
    lcType?: string | null;
    creditDays?: string | number | null;
  },
): string {
  const trigger = deriveBalanceTrigger(paymentMode, explicitTrigger);
  const lcType = String(options?.lcType || '').trim();
  const creditDays = String(options?.creditDays || '').trim();

  switch (paymentMode) {
    case 'tt_deposit_balance_before_shipment':
      return 'T/T 30% deposit, 70% balance before shipment.';
    case 'tt_deposit_balance_against_bl':
      return 'T/T 30% deposit, 70% balance against copy B/L.';
    case 'tt_100_before_production':
      return '100% T/T payment before production starts.';
    case 'deposit_plus_lc':
      return `30% deposit by T/T, 70% by L/C${lcType ? ` (${lcType})` : ''}.`;
    case 'lc_100':
      return `100% by L/C${lcType ? ` (${lcType})` : ''}.`;
    case 'dp':
      return 'D/P terms, documents against payment.';
    case 'da':
      return creditDays ? `D/A ${creditDays} days.` : 'D/A terms.';
    case 'oa':
      return creditDays ? `Open Account ${creditDays} days.` : 'Open Account terms.';
    default:
      switch (trigger) {
        case 'before_production':
          return 'Full payment is required before production starts.';
        case 'after_shipment':
          return 'Payment is due after shipment.';
        case 'lc_ready':
          return 'Payment follows the L/C arrangement.';
        case 'after_deposit':
          return 'The next payment stage starts after deposit confirmation.';
        case 'before_shipment':
        default:
          return 'Payment must be completed before shipment.';
      }
  }
}
