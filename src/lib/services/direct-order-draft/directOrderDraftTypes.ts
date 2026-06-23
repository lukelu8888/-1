export type DirectOrderDraftStatus = 'draft' | 'submitted' | 'cancelled'

export interface DirectOrderDraftProduct {
  id: string
  itemNumber?: string
  name: string
  image?: string
  price: number
  qty: number
  cbm?: number
  grossWeight?: number
  netWeight?: number
  pcsPerCarton?: number
  cartonSize?: string
  moq?: number
  specifications?: string
  source?: string
  sourceType?: string
  addedFrom?: string
}

export interface DirectOrderDraftRecord {
  id: string
  draftNumber: string
  sourceMailThreadId?: string | null
  sourceOrderId?: string | null
  customerEmail?: string | null
  customerName?: string | null
  orderDate: string
  deliveryDate: string
  products: DirectOrderDraftProduct[]
  status: DirectOrderDraftStatus
  linkedOrderNumber?: string | null
  linkedOrderStatus?: string | null
  executionStage?: string | null
  bridgeSummary?: string | null
  submittedAt?: string | null
  sourceChannel: 'customer_portal' | 'mail_repeat_direct_order' | 'history_reorder'
  draftSummary?: string | null
  createdAt: string
  updatedAt: string
}
