import {
  readDirectOrderDraftRecords,
  readLegacyDraftOrders,
  writeDirectOrderDraftRecords,
  writeLegacyDraftOrders,
} from './directOrderDraftStorage'
import type { DirectOrderDraftProduct, DirectOrderDraftRecord } from './directOrderDraftTypes'

const STORAGE_KEY = 'directOrderDraft.records.v1'
const LEGACY_STORAGE_KEY = 'draftOrders'

type LegacyDraftOrder = {
  id: string
  orderDate: string
  deliveryDate: string
  sourceOrderId?: string
  products: DirectOrderDraftProduct[]
  status: 'draft'
  createdAt: string
  updatedAt: string
}

function generateDraftNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
  return `ORD-${year}${month}${day}-${random}`
}

function generateDeliveryDate() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString().split('T')[0]
}

function mapLegacyDraft(legacy: LegacyDraftOrder): DirectOrderDraftRecord {
  return {
    id: legacy.id,
    draftNumber: legacy.id,
    sourceMailThreadId: null,
    sourceOrderId: legacy.sourceOrderId || null,
    customerEmail: null,
    customerName: null,
    orderDate: legacy.orderDate,
    deliveryDate: legacy.deliveryDate,
    products: Array.isArray(legacy.products) ? legacy.products : [],
    status: legacy.status || 'draft',
    sourceChannel: legacy.sourceOrderId ? 'history_reorder' : 'customer_portal',
    draftSummary: null,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
  }
}

function toLegacyDraft(record: DirectOrderDraftRecord): LegacyDraftOrder {
  return {
    id: record.id,
    orderDate: record.orderDate,
    deliveryDate: record.deliveryDate,
    sourceOrderId: record.sourceOrderId || undefined,
    products: record.products,
    status: 'draft',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

function syncLegacyDrafts(records: DirectOrderDraftRecord[]) {
  const activeDrafts = records
    .filter((item) => item.status === 'draft')
    .map(toLegacyDraft)
  writeLegacyDraftOrders(LEGACY_STORAGE_KEY, activeDrafts)
}

function persist(records: DirectOrderDraftRecord[]) {
  writeDirectOrderDraftRecords(STORAGE_KEY, records)
  syncLegacyDrafts(records)
}

function loadRecords(): DirectOrderDraftRecord[] {
  const current = readDirectOrderDraftRecords<DirectOrderDraftRecord>(STORAGE_KEY)
  if (current.length > 0) {
    return current
  }

  const legacy = readLegacyDraftOrders<LegacyDraftOrder>(LEGACY_STORAGE_KEY)
  if (legacy.length === 0) {
    return []
  }

  const migrated = legacy.map(mapLegacyDraft)
  persist(migrated)
  return migrated
}

export const directOrderDraftService = {
  list(): DirectOrderDraftRecord[] {
    return loadRecords()
  },

  listDrafts(): DirectOrderDraftRecord[] {
    return this.list().filter((item) => item.status === 'draft')
  },

  getById(draftId: string): DirectOrderDraftRecord | undefined {
    return this.list().find((item) => item.id === draftId)
  },

  replaceAll(records: DirectOrderDraftRecord[]) {
    persist(records)
  },

  replaceDrafts(records: DirectOrderDraftRecord[]) {
    const historical = this.list().filter((item) => item.status !== 'draft')
    persist([...records, ...historical].sort((left, right) => right.createdAt.localeCompare(left.createdAt)))
  },

  create(
    input?: Partial<
      Omit<DirectOrderDraftRecord, 'id' | 'draftNumber' | 'createdAt' | 'updatedAt' | 'status' | 'products'>
    > & {
      products?: DirectOrderDraftProduct[]
      status?: DirectOrderDraftRecord['status']
    },
  ): DirectOrderDraftRecord {
    const now = new Date().toISOString()
    const draftNumber = generateDraftNumber()
    const next: DirectOrderDraftRecord = {
      id: draftNumber,
      draftNumber,
      sourceMailThreadId: input?.sourceMailThreadId || null,
      sourceOrderId: input?.sourceOrderId || null,
      customerEmail: input?.customerEmail || null,
      customerName: input?.customerName || null,
      orderDate: input?.orderDate || now.slice(0, 10),
      deliveryDate: input?.deliveryDate || generateDeliveryDate(),
      products: input?.products || [],
      status: input?.status || 'draft',
      sourceChannel: input?.sourceChannel || 'customer_portal',
      draftSummary: input?.draftSummary || null,
      createdAt: now,
      updatedAt: now,
    }
    persist([next, ...this.list()])
    return next
  },

  update(draftId: string, patch: Partial<DirectOrderDraftRecord>) {
    persist(
      this.list().map((item) =>
        item.id === draftId
          ? {
              ...item,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  },

  updateProducts(draftId: string, products: DirectOrderDraftProduct[]) {
    this.update(draftId, { products })
  },

  markSubmitted(draftId: string) {
    this.update(draftId, { status: 'submitted' })
  },

  markCancelled(draftId: string) {
    this.update(draftId, { status: 'cancelled' })
  },
}
