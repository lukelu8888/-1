import type { Order } from '../../../contexts/OrderContext'

function toSafeText(value?: string | null) {
  if (!value) return null
  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '-') return null
  return trimmed
}

function normalizeStatus(value?: string | null) {
  return String(value || '').trim().toLowerCase()
}

function includesAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern))
}

function hasConfirmedProof(proof?: { status?: 'pending' | 'confirmed' | 'rejected' } | null) {
  return proof?.status === 'confirmed'
}

function hasRejectedProof(proof?: { status?: 'pending' | 'confirmed' | 'rejected' } | null) {
  return proof?.status === 'rejected'
}

function hasPendingProof(proof?: { status?: 'pending' | 'confirmed' | 'rejected' } | null) {
  return !!proof && (!proof.status || proof.status === 'pending')
}

function deriveExecutionStage(order: Order) {
  const status = normalizeStatus(order.status)
  const hasDepositProof = !!order.depositPaymentProof
  const hasDepositReceived = !!order.depositReceiptProof
  const hasBalanceProof = !!order.balancePaymentProof
  const hasBalanceReceived = !!order.balanceReceiptProof
  const hasTracking = !!toSafeText(order.trackingNumber)
  const progress = typeof order.progress === 'number' ? order.progress : 0
  const paymentStatus = normalizeStatus(order.paymentStatus)
  const extendedOrder = order as Order & {
    signedAt?: string | null
    signedBy?: string | null
    receivedAt?: string | null
    receivedBy?: string | null
    actualArrivalAt?: string | null
    deliveryConfirmedAt?: string | null
  }
  const depositProofPending = hasPendingProof(order.depositPaymentProof)
  const depositProofRejected = hasRejectedProof(order.depositPaymentProof)
  const balanceProofPending = hasPendingProof(order.balancePaymentProof)
  const balanceProofRejected = hasRejectedProof(order.balancePaymentProof)
  const depositProofConfirmed = hasConfirmedProof(order.depositPaymentProof)
  const balanceProofConfirmed = hasConfirmedProof(order.balancePaymentProof)
  const hasSignedOffSignal = Boolean(
    hasBalanceReceived ||
      toSafeText(extendedOrder.signedAt) ||
      toSafeText(extendedOrder.signedBy) ||
      toSafeText(extendedOrder.receivedAt) ||
      toSafeText(extendedOrder.receivedBy) ||
      toSafeText(extendedOrder.deliveryConfirmedAt),
  )
  const hasArrivalSignal = Boolean(toSafeText(extendedOrder.actualArrivalAt))
  const isAwaitingDepositStatus = includesAny(status, ['awaiting deposit', 'customer_confirmed', 'confirmed'])
  const isProductionStatus = includesAny(status, ['in production', 'production', 'preparing production'])
  const isQualityStatus = includesAny(status, ['quality inspection', 'quality_check'])
  const isReadyStatus = includesAny(status, ['ready to ship', 'ready_to_ship'])
  const isShippedStatus = includesAny(status, ['shipped', 'in_transit'])
  const isCompletedStatus = includesAny(status, ['delivered', 'completed'])
  const paymentShowsDepositReceived = includesAny(paymentStatus, ['deposit received', 'deposit confirmed'])
  const paymentShowsBalanceReview = includesAny(paymentStatus, ['balance pending', 'balance uploaded', 'balance review'])
  const paymentShowsBalanceReceived = includesAny(paymentStatus, ['balance received', 'paid', 'fully paid', 'settled'])
  const paymentShowsDepositReview = includesAny(paymentStatus, ['deposit pending', 'deposit uploaded', 'deposit review'])
  const paymentShowsAwaitingDeposit = includesAny(paymentStatus, ['pending', 'unpaid', 'awaiting deposit'])

  if (status === 'cancelled') return 'cancelled'
  if (isCompletedStatus || hasSignedOffSignal || (progress >= 100 && hasTracking)) return 'signed_off'
  if (isShippedStatus || hasTracking || hasArrivalSignal) return 'in_transit'
  if (isReadyStatus || paymentShowsBalanceReceived || balanceProofConfirmed) return 'ready_to_ship'
  if (isQualityStatus || progress >= 80) return 'quality_check'
  if (isProductionStatus || progress >= 35) {
    return 'production'
  }
  if (balanceProofRejected) return 'balance_rejected'
  if (hasBalanceProof || balanceProofPending || paymentShowsBalanceReview) return 'balance_review'
  if (status === 'deposit received' || hasDepositReceived || depositProofConfirmed || paymentShowsDepositReceived) {
    return 'deposit_received'
  }
  if (depositProofRejected) return 'deposit_rejected'
  if (status === 'payment proof uploaded' || hasDepositProof || depositProofPending || paymentShowsDepositReview) {
    return 'deposit_review'
  }
  if (isAwaitingDepositStatus || paymentShowsAwaitingDeposit) return 'awaiting_deposit'
  if (status === 'pending' || status === 'negotiating') return 'submitted'
  return 'processing'
}

export function buildDirectOrderExecutionSummary(order: Order) {
  const depositProofState = hasRejectedProof(order.depositPaymentProof)
    ? '定金水单被退回'
    : hasConfirmedProof(order.depositPaymentProof)
      ? '定金水单已确认'
      : order.depositPaymentProof
        ? '客户已传定金水单'
        : null

  const balanceProofState = hasRejectedProof(order.balancePaymentProof)
    ? '余款水单被退回'
    : hasConfirmedProof(order.balancePaymentProof)
      ? '余款水单已确认'
      : order.balancePaymentProof
        ? '客户已传余款水单'
        : null

  const segments = [
    `订单号 ${order.orderNumber}`,
    `阶段 ${deriveExecutionStage(order)}`,
    `状态 ${order.status}`,
    order.paymentStatus ? `付款 ${order.paymentStatus}` : null,
    typeof order.progress === 'number' ? `进度 ${order.progress}%` : null,
    depositProofState,
    order.depositReceiptProof ? '财务已登记定金到账' : null,
    balanceProofState,
    order.balanceReceiptProof ? '财务已登记余款到账' : null,
    toSafeText(order.trackingNumber) ? `追踪 ${toSafeText(order.trackingNumber)}` : null,
    order.expectedDelivery ? `交期 ${order.expectedDelivery}` : null,
    `金额 ${order.currency} ${order.totalAmount}`,
  ]

  return {
    stage: deriveExecutionStage(order),
    summary: segments.filter(Boolean).join(' / '),
  }
}
