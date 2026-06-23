import { supabase } from '../supabase'
import { deriveExternalParticipants } from './businessFieldNormalization'

function throwServiceError(context: string, error: any): never {
  if (error?.name === 'AbortError') {
    throw (error instanceof Error ? error : new Error('Request aborted'))
  }
  console.warn(`[Supabase] ${context}:`, error?.message || error)
  throw (error instanceof Error ? error : new Error(`${context} failed: ${String(error?.message || error || 'Unknown Supabase error')}`))
}

function toUUIDOrNull(id: string | null | undefined): string | null {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id
  }
  return null
}

function toIsoDate(v: any): string | null {
  if (!v) return null
  if (typeof v === 'string' && v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [m, d, y] = v.split('/')
    return `${y}-${m}-${d}`
  }
  if (typeof v === 'string' && v.includes('T')) return v.split('T')[0]
  return String(v)
}

export function fromBookingQuoteRequestRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    requestNo: r.request_no,
    purchaseOrderId: r.purchase_order_id,
    loadPlanId: r.load_plan_id,
    shipmentNo: r.shipment_no,
    cargoReadyDate: r.cargo_ready_date,
    preferredEtd: r.preferred_etd,
    portOfLoading: r.port_of_loading,
    portOfDestination: r.port_of_destination,
    containerType: r.container_type,
    containerCount: r.container_count,
    incoterm: r.incoterm,
    selectedOptionId: r.selected_option_id,
    notes: r.notes,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBookingQuoteRequestRow(request: any) {
  const id = toUUIDOrNull(request.id)
  const purchaseOrderId = toUUIDOrNull(request.purchaseOrderId || request.purchase_order_id)
  const loadPlanId = toUUIDOrNull(request.loadPlanId || request.load_plan_id)
  return {
    ...(id ? { id } : {}),
    request_no: request.requestNo || request.request_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    shipment_no: request.shipmentNo || request.shipment_no || null,
    cargo_ready_date: toIsoDate(request.cargoReadyDate || request.cargo_ready_date),
    preferred_etd: request.preferredEtd || request.preferred_etd || null,
    port_of_loading: request.portOfLoading || request.port_of_loading || null,
    port_of_destination: request.portOfDestination || request.port_of_destination || null,
    container_type: request.containerType || request.container_type || null,
    container_count: Number(request.containerCount || request.container_count || 1),
    incoterm: request.incoterm || null,
    selected_option_id: request.selectedOptionId || request.selected_option_id || null,
    notes: request.notes || null,
    created_by: request.createdBy || request.created_by || null,
  }
}

export function fromBookingQuoteOptionRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    requestId: r.request_id,
    optionRank: r.option_rank,
    forwarderName: r.forwarder_name,
    carrierName: r.carrier_name,
    serviceMode: r.service_mode,
    etd: r.etd,
    eta: r.eta,
    transitDays: r.transit_days,
    freightCurrency: r.freight_currency,
    freightAmount: Number(r.freight_amount || 0),
    pricingMode: r.pricing_mode,
    validityUntil: r.validity_until,
    remarks: r.remarks,
    isSelected: Boolean(r.is_selected),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toBookingQuoteOptionRow(option: any, requestId?: string) {
  const id = toUUIDOrNull(option.id)
  const resolvedRequestId = toUUIDOrNull(requestId || option.requestId || option.request_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedRequestId ? { request_id: resolvedRequestId } : {}),
    option_rank: Number(option.optionRank || option.option_rank || 1),
    forwarder_name: option.forwarderName || option.forwarder_name || null,
    carrier_name: option.carrierName || option.carrier_name || null,
    service_mode: option.serviceMode || option.service_mode || null,
    etd: toIsoDate(option.etd),
    eta: toIsoDate(option.eta),
    transit_days: Number(option.transitDays || option.transit_days || 0),
    freight_currency: option.freightCurrency || option.freight_currency || 'USD',
    freight_amount: Number(option.freightAmount || option.freight_amount || 0),
    pricing_mode: option.pricingMode || option.pricing_mode || null,
    validity_until: option.validityUntil || option.validity_until || null,
    remarks: option.remarks || null,
    is_selected: Boolean(option.isSelected || option.is_selected || false),
  }
}

export function fromShippingOrderRow(r: any) {
  if (!r) return null
  const participants = deriveExternalParticipants(r)
  return {
    id: r.id,
    shippingOrderNo: r.shipping_order_no,
    purchaseOrderId: r.purchase_order_id,
    bookingQuoteRequestId: r.booking_quote_request_id,
    selectedQuoteOptionId: r.selected_quote_option_id,
    loadPlanId: r.load_plan_id,
    shipmentNo: r.shipment_no,
    status: r.status,
    bookingReference: r.booking_reference,
    vesselName: r.vessel_name,
    voyageNo: r.voyage_no,
    plannedEtd: r.planned_etd,
    bookingConfirmedAt: r.booking_confirmed_at,
    siConfirmedAt: r.si_confirmed_at,
    hblNo: r.hbl_no,
    mblNo: r.mbl_no,
    containerType: r.container_type,
    containerCount: r.container_count,
    sealNo: r.seal_no,
    externalParticipants: participants,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toShippingOrderRow(order: any) {
  const id = toUUIDOrNull(order.id)
  const purchaseOrderId = toUUIDOrNull(order.purchaseOrderId || order.purchase_order_id)
  const bookingQuoteRequestId = toUUIDOrNull(order.bookingQuoteRequestId || order.booking_quote_request_id)
  const selectedQuoteOptionId = toUUIDOrNull(order.selectedQuoteOptionId || order.selected_quote_option_id)
  const loadPlanId = toUUIDOrNull(order.loadPlanId || order.load_plan_id)
  return {
    ...(id ? { id } : {}),
    shipping_order_no: order.shippingOrderNo || order.shipping_order_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(bookingQuoteRequestId ? { booking_quote_request_id: bookingQuoteRequestId } : {}),
    ...(selectedQuoteOptionId ? { selected_quote_option_id: selectedQuoteOptionId } : {}),
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    shipment_no: order.shipmentNo || order.shipment_no || null,
    status: order.status || 'draft',
    booking_reference: order.bookingReference || order.booking_reference || null,
    vessel_name: order.vesselName || order.vessel_name || null,
    voyage_no: order.voyageNo || order.voyage_no || null,
    planned_etd: toIsoDate(order.plannedEtd || order.planned_etd),
    booking_confirmed_at: order.bookingConfirmedAt || order.booking_confirmed_at || null,
    si_confirmed_at: order.siConfirmedAt || order.si_confirmed_at || null,
    hbl_no: order.hblNo || order.hbl_no || null,
    mbl_no: order.mblNo || order.mbl_no || null,
    container_type: order.containerType || order.container_type || null,
    container_count: Number(order.containerCount || order.container_count || 1),
    seal_no: order.sealNo || order.seal_no || null,
    remarks: order.remarks || null,
    created_by: order.createdBy || order.created_by || null,
  }
}

export const bookingQuoteRequestService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('booking_quote_requests')
      .select('*, booking_quote_options(*)')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId booking_quote_requests', error)
    return (data || []).map((row) => ({
      ...fromBookingQuoteRequestRow(row),
      options: (row.booking_quote_options || []).map(fromBookingQuoteOptionRow),
    }))
  },
  async createWithOptions(payload: any) {
    const requestRow = toBookingQuoteRequestRow(payload)
    const { data: requestData, error: requestError } = await supabase
      .from('booking_quote_requests')
      .insert(requestRow)
      .select()
      .single()
    if (requestError) throwServiceError('create booking_quote_request', requestError)

    const options = Array.isArray(payload.options) ? payload.options.filter((option) => option?.forwarderName || option?.carrierName) : []
    let selectedOptionId: string | null = null
    let mappedOptions: any[] = []

    if (options.length > 0) {
      const optionRows = options.map((option: any, index: number) =>
        toBookingQuoteOptionRow({
          ...option,
          optionRank: index + 1,
          isSelected: Boolean(option.isSelected),
        }, requestData.id)
      )
      const { data: optionData, error: optionError } = await supabase
        .from('booking_quote_options')
        .insert(optionRows)
        .select()
      if (optionError) throwServiceError('create booking_quote_options', optionError)
      mappedOptions = (optionData || []).map(fromBookingQuoteOptionRow)
      selectedOptionId = mappedOptions.find((option) => option.isSelected)?.id || null
      if (selectedOptionId) {
        const { error: selectError } = await supabase
          .from('booking_quote_requests')
          .update({ selected_option_id: selectedOptionId })
          .eq('id', requestData.id)
        if (selectError) throwServiceError('update booking_quote_request selected_option_id', selectError)
      }
    }

    return {
      ...fromBookingQuoteRequestRow({ ...requestData, selected_option_id: selectedOptionId || requestData.selected_option_id }),
      options: mappedOptions,
    }
  },
}

export const shippingOrderService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('shipping_orders')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId shipping_orders', error)
    return (data || []).map(fromShippingOrderRow)
  },
  async create(order: any) {
    const row = toShippingOrderRow(order)
    const { data, error } = await supabase
      .from('shipping_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create shipping_order', error)
    return fromShippingOrderRow(data)
  },
}
