import { supabase, supabaseAnonKey, supabaseUrl } from '../supabase'
import { buildShipmentWorkflowSummary } from './shipmentWorkflowSummaryBuilderService'
import {
  fromArrivalNoticeRow,
  fromDeliveryConfirmationRow,
  fromDeliveryExceptionRow,
  fromImportClearanceRow,
  fromPostOrderFeedbackRow,
  fromVoyageTrackingRow,
} from './shipmentProgressServices'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

export const customerShipmentTrackingService = {
  async getByCustomerEmail(customerEmail: string) {
    const normalizedEmail = String(customerEmail || '').trim().toLowerCase()
    if (!normalizedEmail) return []

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const accessToken = session?.access_token
    if (accessToken) {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/make-server-880fd43b/auth/customer-shipment-tracking?email=${encodeURIComponent(normalizedEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
          },
        },
      )

      let payload: any = null
      try {
        payload = await response.json()
      } catch {
        payload = null
      }

      if (response.ok) {
        return Array.isArray(payload?.rows) ? payload.rows : []
      }
    }

    const { data: poRows, error: poError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, customer_email, supplier_name')
      .eq('customer_email', normalizedEmail)
      .is('deleted_at', null)

    if (poError) throwServiceError('get purchase_orders for customer shipment tracking', poError)

    const purchaseOrders = poRows || []
    if (purchaseOrders.length === 0) return []

    const purchaseOrderIds = purchaseOrders.map((row: any) => row.id).filter(Boolean)
    const voyageMap = new Map<string, any>()
    const arrivalMap = new Map<string, any>()
    const clearanceMap = new Map<string, any>()
    const deliveryMap = new Map<string, any>()
    const feedbackMap = new Map<string, any>()
    const exceptionMap = new Map<string, any[]>()
    const executionMap = new Map<string, any>()

    const { data: voyageRows, error: voyageError } = await supabase
      .from('voyage_tracking')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
      .order('created_at', { ascending: false })
    if (voyageError) throwServiceError('get voyage_tracking for customer shipment tracking', voyageError)

    const { data: executionRows, error: executionError } = await supabase
      .from('purchase_order_execution')
      .select('*')
      .in('purchase_order_id', purchaseOrderIds)
    if (executionError) throwServiceError('get purchase_order_execution for customer shipment tracking', executionError)
    ;(executionRows || []).forEach((row: any) => {
      if (row.purchase_order_id) executionMap.set(row.purchase_order_id, row)
    })

    ;(voyageRows || []).forEach((row: any) => {
      const poId = row.purchase_order_id
      if (poId && !voyageMap.has(poId)) {
        voyageMap.set(poId, fromVoyageTrackingRow(row))
      }
    })

    const voyageIds = Array.from(new Set((voyageRows || []).map((row: any) => row.id).filter(Boolean)))
    if (voyageIds.length > 0) {
      const { data: arrivalRows, error: arrivalError } = await supabase
        .from('arrival_notices')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (arrivalError) throwServiceError('get arrival_notices for customer shipment tracking', arrivalError)
      ;(arrivalRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (voyageId && !arrivalMap.has(voyageId)) {
          arrivalMap.set(voyageId, fromArrivalNoticeRow(row))
        }
      })

      const { data: clearanceRows, error: clearanceError } = await supabase
        .from('import_clearance_coordination')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (clearanceError) throwServiceError('get import_clearance_coordination for customer shipment tracking', clearanceError)
      ;(clearanceRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (voyageId && !clearanceMap.has(voyageId)) {
          clearanceMap.set(voyageId, fromImportClearanceRow(row))
        }
      })

      const clearanceIds = Array.from(new Set((clearanceRows || []).map((row: any) => row.id).filter(Boolean)))
      if (clearanceIds.length > 0) {
        const { data: deliveryRows, error: deliveryError } = await supabase
          .from('delivery_confirmations')
          .select('*')
          .in('clearance_id', clearanceIds)
          .order('created_at', { ascending: false })
        if (deliveryError) throwServiceError('get delivery_confirmations for customer shipment tracking', deliveryError)
        ;(deliveryRows || []).forEach((row: any) => {
          const clearanceId = row.clearance_id
          if (clearanceId && !deliveryMap.has(clearanceId)) {
            deliveryMap.set(clearanceId, fromDeliveryConfirmationRow(row))
          }
        })
      }

      const { data: exceptionRows, error: exceptionError } = await supabase
        .from('delivery_exceptions')
        .select('*')
        .in('voyage_id', voyageIds)
        .order('created_at', { ascending: false })
      if (exceptionError) throwServiceError('get delivery_exceptions for customer shipment tracking', exceptionError)
      ;(exceptionRows || []).forEach((row: any) => {
        const voyageId = row.voyage_id
        if (!voyageId) return
        const existing = exceptionMap.get(voyageId) || []
        existing.push(fromDeliveryExceptionRow(row))
        exceptionMap.set(voyageId, existing)
      })

      const { data: feedbackRows, error: feedbackError } = await supabase
        .from('post_order_feedback')
        .select('*')
        .in('purchase_order_id', purchaseOrderIds)
        .order('created_at', { ascending: false })
      if (feedbackError) throwServiceError('get post_order_feedback for customer shipment tracking', feedbackError)
      ;(feedbackRows || []).forEach((row: any) => {
        const poId = row.purchase_order_id
        if (poId && !feedbackMap.has(poId)) {
          feedbackMap.set(poId, fromPostOrderFeedbackRow(row))
        }
      })
    }

    return purchaseOrders.map((po: any) => {
      const voyage = voyageMap.get(po.id) || null
      const arrival = voyage?.id ? (arrivalMap.get(voyage.id) || null) : null
      const clearance = voyage?.id ? (clearanceMap.get(voyage.id) || null) : null
      const delivery = clearance?.id ? (deliveryMap.get(clearance.id) || null) : null
      return {
        purchaseOrderId: po.id,
        orderNumber: po.po_number || null,
        customerEmail: po.customer_email || null,
        supplierName: po.supplier_name || null,
        execution: executionMap.get(po.id) || null,
        voyage,
        arrivalNotice: arrival,
        importClearance: clearance,
        deliveryConfirmation: delivery,
        deliveryExceptions: voyage?.id ? (exceptionMap.get(voyage.id) || []) : [],
        latestFeedback: feedbackMap.get(po.id) || null,
        workflowSummary: buildShipmentWorkflowSummary({
          execution: executionMap.get(po.id) || null,
          voyage,
          arrivalNotice: arrival,
          importClearance: clearance,
          deliveryConfirmation: delivery,
          latestFeedback: feedbackMap.get(po.id) || null,
        }),
      }
    })
  },
}
