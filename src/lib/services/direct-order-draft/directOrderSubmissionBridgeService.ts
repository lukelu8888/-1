import type { Order } from '../../../contexts/OrderContext'
import { directOrderDraftService } from './directOrderDraftService'
import type { DirectOrderDraftRecord } from './directOrderDraftTypes'
import { syncDirectOrderDraftFromOrder } from './syncDirectOrderDraftFromOrder'
import { syncMailThreadFromDirectOrder } from './syncMailThreadFromDirectOrder'

const LEGACY_ACTIVE_ORDERS_KEY = 'activeOrders'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

function readLegacyActiveOrders(): Order[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(LEGACY_ACTIVE_ORDERS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLegacyActiveOrders(records: Order[]) {
  if (!canUseStorage()) return
  localStorage.setItem(LEGACY_ACTIVE_ORDERS_KEY, JSON.stringify(records))
}

function buildProgressByStatus(status: Order['status']) {
  switch (status) {
    case 'Pending':
      return 5
    case 'Awaiting Deposit':
      return 10
    case 'Deposit Received':
      return 20
    case 'Preparing Production':
      return 35
    case 'In Production':
      return 50
    case 'Quality Inspection':
      return 70
    case 'Ready to Ship':
      return 85
    case 'Shipped':
      return 95
    case 'Delivered':
      return 100
    default:
      return 0
  }
}

export function buildOrderFromDirectOrderDraft(
  draft: DirectOrderDraftRecord,
  customerEmail?: string | null,
): Order {
  const products = draft.products.map((item) => ({
    name: item.name,
    quantity: item.qty,
    unitPrice: item.price,
    totalPrice: item.qty * item.price,
    specs: item.specifications || '',
  }))

  const totalAmount = products.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  const status: Order['status'] = 'Pending'

  return {
    id: draft.id,
    orderNumber: draft.draftNumber,
    customer: draft.customerName || 'Direct Order Customer',
    customerEmail: customerEmail || draft.customerEmail || undefined,
    date: draft.orderDate,
    expectedDelivery: draft.deliveryDate,
    totalAmount,
    currency: 'USD',
    status,
    progress: buildProgressByStatus(status),
    products,
    paymentStatus: 'Pending',
    paymentTerms: '30% deposit + 70% before shipment',
    shippingMethod: 'Sea Freight',
    deliveryTerms: 'FOB',
    notes: draft.draftSummary || undefined,
    createdFrom: 'manual',
    createdAt: draft.createdAt,
    updatedAt: new Date().toISOString(),
    confirmed: false,
  }
}

export function syncLegacyActiveOrders(order: Order) {
  const existing = readLegacyActiveOrders()
  const next = [order, ...existing.filter((item) => item.id !== order.id && item.orderNumber !== order.orderNumber)]
  writeLegacyActiveOrders(next)
}

export const directOrderSubmissionBridgeService = {
  submitDraft(draftId: string, customerEmail?: string | null) {
    const draft = directOrderDraftService.getById(draftId)
    if (!draft) {
      throw new Error('Direct order draft not found')
    }

    const order = buildOrderFromDirectOrderDraft(draft, customerEmail)
    directOrderDraftService.markSubmitted(draftId)
    syncDirectOrderDraftFromOrder(order)
    syncMailThreadFromDirectOrder(order)
    syncLegacyActiveOrders(order)
    return order
  },
}
