import { supabase } from '../supabase'

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

function toIsoDate(value: any): string | null {
  if (!value) return null
  const text = String(value)
  return text.includes('T') ? text.slice(0, 10) : text
}

function fromDomesticTransferOrderRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    transferNo: r.transfer_no,
    purchaseOrderId: r.purchase_order_id,
    consolidationPlanId: r.consolidation_plan_id,
    shipmentNo: r.shipment_no,
    pickupWarehouseId: r.pickup_warehouse_id,
    pickupWarehouseName: r.pickup_warehouse_name,
    deliveryLocationId: r.delivery_location_id,
    deliveryLocationName: r.delivery_location_name,
    transferMode: r.transfer_mode,
    carrierName: r.carrier_name,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    vehicleNo: r.vehicle_no,
    plannedPickupDate: r.planned_pickup_date,
    plannedArrivalDate: r.planned_arrival_date,
    actualPickupAt: r.actual_pickup_at,
    actualArrivalAt: r.actual_arrival_at,
    status: r.status,
    pickupPackages: Number(r.pickup_packages || 0),
    pickupQuantity: Number(r.pickup_quantity || 0),
    receiptRequired: r.receipt_required ?? true,
    signedReceiptFiles: r.signed_receipt_files || [],
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toDomesticTransferOrderRow(order: any) {
  const id = toUUIDOrNull(order.id)
  const purchaseOrderId = toUUIDOrNull(order.purchaseOrderId || order.purchase_order_id)
  const consolidationPlanId = toUUIDOrNull(order.consolidationPlanId || order.consolidation_plan_id)
  return {
    ...(id ? { id } : {}),
    transfer_no: order.transferNo || order.transfer_no,
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    ...(consolidationPlanId ? { consolidation_plan_id: consolidationPlanId } : {}),
    shipment_no: order.shipmentNo || order.shipment_no || null,
    pickup_warehouse_id: order.pickupWarehouseId || order.pickup_warehouse_id || null,
    pickup_warehouse_name: order.pickupWarehouseName || order.pickup_warehouse_name || null,
    delivery_location_id: order.deliveryLocationId || order.delivery_location_id || null,
    delivery_location_name: order.deliveryLocationName || order.delivery_location_name || null,
    transfer_mode: order.transferMode || order.transfer_mode || 'truck',
    carrier_name: order.carrierName || order.carrier_name || null,
    driver_name: order.driverName || order.driver_name || null,
    driver_phone: order.driverPhone || order.driver_phone || null,
    vehicle_no: order.vehicleNo || order.vehicle_no || null,
    planned_pickup_date: toIsoDate(order.plannedPickupDate || order.planned_pickup_date),
    planned_arrival_date: toIsoDate(order.plannedArrivalDate || order.planned_arrival_date),
    actual_pickup_at: order.actualPickupAt || order.actual_pickup_at || null,
    actual_arrival_at: order.actualArrivalAt || order.actual_arrival_at || null,
    status: order.status || 'draft',
    pickup_packages: Number(order.pickupPackages || order.pickup_packages || 0),
    pickup_quantity: Number(order.pickupQuantity || order.pickup_quantity || 0),
    receipt_required: Boolean(order.receiptRequired ?? order.receipt_required ?? true),
    signed_receipt_files: order.signedReceiptFiles || order.signed_receipt_files || [],
    remarks: order.remarks || null,
    created_by: order.createdBy || order.created_by || null,
  }
}

function fromCargoReceiptRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    receiptNo: r.receipt_no,
    transferOrderId: r.transfer_order_id,
    consolidationPlanId: r.consolidation_plan_id,
    receiptStatus: r.receipt_status,
    receiverPartyType: r.receiver_party_type,
    receiverPartyId: r.receiver_party_id,
    receiverLocationId: r.receiver_location_id,
    receivedAt: r.received_at,
    receivedBy: r.received_by,
    contactPhone: r.contact_phone,
    expectedPackages: r.expected_packages || 0,
    receivedPackages: r.received_packages || 0,
    expectedQuantity: r.expected_quantity || 0,
    receivedQuantity: r.received_quantity || 0,
    damageFlag: r.damage_flag ?? false,
    shortageFlag: r.shortage_flag ?? false,
    overageFlag: r.overage_flag ?? false,
    varianceFlag: r.variance_flag ?? false,
    photoFiles: r.photo_files || [],
    signedFiles: r.signed_files || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toCargoReceiptRow(receipt: any) {
  const id = toUUIDOrNull(receipt.id)
  const transferOrderId = toUUIDOrNull(receipt.transferOrderId || receipt.transfer_order_id)
  const consolidationPlanId = toUUIDOrNull(receipt.consolidationPlanId || receipt.consolidation_plan_id)
  return {
    ...(id ? { id } : {}),
    receipt_no: receipt.receiptNo || receipt.receipt_no,
    ...(transferOrderId ? { transfer_order_id: transferOrderId } : {}),
    ...(consolidationPlanId ? { consolidation_plan_id: consolidationPlanId } : {}),
    receipt_status: receipt.receiptStatus || receipt.receipt_status || 'draft',
    receiver_party_type: receipt.receiverPartyType || receipt.receiver_party_type || null,
    receiver_party_id: receipt.receiverPartyId || receipt.receiver_party_id || null,
    receiver_location_id: receipt.receiverLocationId || receipt.receiver_location_id || null,
    received_at: receipt.receivedAt || receipt.received_at || null,
    received_by: receipt.receivedBy || receipt.received_by || null,
    contact_phone: receipt.contactPhone || receipt.contact_phone || null,
    expected_packages: Number(receipt.expectedPackages || receipt.expected_packages || 0),
    received_packages: Number(receipt.receivedPackages || receipt.received_packages || 0),
    expected_quantity: Number(receipt.expectedQuantity || receipt.expected_quantity || 0),
    received_quantity: Number(receipt.receivedQuantity || receipt.received_quantity || 0),
    damage_flag: Boolean(receipt.damageFlag || receipt.damage_flag || false),
    shortage_flag: Boolean(receipt.shortageFlag || receipt.shortage_flag || false),
    overage_flag: Boolean(receipt.overageFlag || receipt.overage_flag || false),
    variance_flag: Boolean(receipt.varianceFlag || receipt.variance_flag || false),
    photo_files: receipt.photoFiles || receipt.photo_files || [],
    signed_files: receipt.signedFiles || receipt.signed_files || [],
    remarks: receipt.remarks || null,
  }
}

function fromCargoReceiptItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    receiptId: r.receipt_id,
    cargoLotId: r.cargo_lot_id,
    productId: r.product_id,
    productName: r.product_name,
    expectedPackages: r.expected_packages || 0,
    receivedPackages: r.received_packages || 0,
    expectedQuantity: r.expected_quantity || 0,
    receivedQuantity: r.received_quantity || 0,
    damageQty: r.damage_qty || 0,
    shortageQty: r.shortage_qty || 0,
    remarks: r.remarks,
  }
}

function toCargoReceiptItemRow(item: any, receiptId?: string) {
  const id = toUUIDOrNull(item.id)
  const resolvedReceiptId = toUUIDOrNull(receiptId || item.receiptId || item.receipt_id)
  const cargoLotId = toUUIDOrNull(item.cargoLotId || item.cargo_lot_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedReceiptId ? { receipt_id: resolvedReceiptId } : {}),
    ...(cargoLotId ? { cargo_lot_id: cargoLotId } : {}),
    product_id: item.productId || item.product_id || null,
    product_name: item.productName || item.product_name || '',
    expected_packages: Number(item.expectedPackages || item.expected_packages || 0),
    received_packages: Number(item.receivedPackages || item.received_packages || 0),
    expected_quantity: Number(item.expectedQuantity || item.expected_quantity || 0),
    received_quantity: Number(item.receivedQuantity || item.received_quantity || 0),
    damage_qty: Number(item.damageQty || item.damage_qty || 0),
    shortage_qty: Number(item.shortageQty || item.shortage_qty || 0),
    remarks: item.remarks || null,
  }
}

function fromThirdPartyWarehouseRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    warehouseNo: r.warehouse_no,
    warehouseName: r.warehouse_name,
    warehouseType: r.warehouse_type,
    contactName: r.contact_name,
    contactPhone: r.contact_phone,
    contactEmail: r.contact_email,
    address: r.address,
    city: r.city,
    province: r.province,
    country: r.country,
    status: r.status,
    serviceScope: r.service_scope || [],
    settlementTerms: r.settlement_terms,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toThirdPartyWarehouseRow(warehouse: any) {
  const id = toUUIDOrNull(warehouse.id)
  return {
    ...(id ? { id } : {}),
    warehouse_no: warehouse.warehouseNo || warehouse.warehouse_no,
    warehouse_name: warehouse.warehouseName || warehouse.warehouse_name || '',
    warehouse_type: warehouse.warehouseType || warehouse.warehouse_type || 'third_party_warehouse',
    contact_name: warehouse.contactName || warehouse.contact_name || null,
    contact_phone: warehouse.contactPhone || warehouse.contact_phone || null,
    contact_email: warehouse.contactEmail || warehouse.contact_email || null,
    address: warehouse.address || null,
    city: warehouse.city || null,
    province: warehouse.province || null,
    country: warehouse.country || 'China',
    status: warehouse.status || 'active',
    service_scope: warehouse.serviceScope || warehouse.service_scope || [],
    settlement_terms: warehouse.settlementTerms || warehouse.settlement_terms || null,
    remarks: warehouse.remarks || null,
  }
}

function fromConsolidationPlanRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    planNo: r.plan_no,
    shipmentNo: r.shipment_no,
    loadPlanId: r.load_plan_id,
    consolidationPointType: r.consolidation_point_type,
    consolidationPointId: r.consolidation_point_id,
    consolidationPointName: r.consolidation_point_name,
    consolidationPointAddress: r.consolidation_point_address,
    warehouseContactName: r.warehouse_contact_name,
    warehouseContactPhone: r.warehouse_contact_phone,
    plannedLoadingDate: r.planned_loading_date,
    status: r.status,
    remarks: r.remarks,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toConsolidationPlanRow(plan: any) {
  const id = toUUIDOrNull(plan.id)
  const loadPlanId = toUUIDOrNull(plan.loadPlanId || plan.load_plan_id)
  return {
    ...(id ? { id } : {}),
    plan_no: plan.planNo || plan.plan_no,
    shipment_no: plan.shipmentNo || plan.shipment_no || null,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    consolidation_point_type: plan.consolidationPointType || plan.consolidation_point_type || 'third_party_warehouse',
    consolidation_point_id: plan.consolidationPointId || plan.consolidation_point_id || null,
    consolidation_point_name: plan.consolidationPointName || plan.consolidation_point_name || '',
    consolidation_point_address: plan.consolidationPointAddress || plan.consolidation_point_address || null,
    warehouse_contact_name: plan.warehouseContactName || plan.warehouse_contact_name || null,
    warehouse_contact_phone: plan.warehouseContactPhone || plan.warehouse_contact_phone || null,
    planned_loading_date: toIsoDate(plan.plannedLoadingDate || plan.planned_loading_date),
    status: plan.status || 'planning',
    remarks: plan.remarks || null,
    created_by: plan.createdBy || plan.created_by || null,
  }
}

function fromConsolidationPlanItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    planId: r.plan_id,
    purchaseOrderId: r.purchase_order_id,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    productName: r.product_name,
    modelNo: r.model_no,
    plannedContainerNo: r.planned_container_no,
    plannedContainerSlot: r.planned_container_slot,
    plannedPackages: r.planned_packages || 0,
    plannedQuantity: r.planned_quantity || 0,
    receivedPackages: r.received_packages || 0,
    receivedQuantity: r.received_quantity || 0,
    itemStatus: r.item_status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toConsolidationPlanItemRow(item: any, planId?: string) {
  const id = toUUIDOrNull(item.id)
  const resolvedPlanId = toUUIDOrNull(planId || item.planId || item.plan_id)
  const purchaseOrderId = toUUIDOrNull(item.purchaseOrderId || item.purchase_order_id)
  return {
    ...(id ? { id } : {}),
    ...(resolvedPlanId ? { plan_id: resolvedPlanId } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    supplier_id: item.supplierId || item.supplier_id || null,
    supplier_name: item.supplierName || item.supplier_name || null,
    product_name: item.productName || item.product_name || '',
    model_no: item.modelNo || item.model_no || null,
    planned_container_no: item.plannedContainerNo || item.planned_container_no || null,
    planned_container_slot: item.plannedContainerSlot || item.planned_container_slot || null,
    planned_packages: Number(item.plannedPackages || item.planned_packages || 0),
    planned_quantity: Number(item.plannedQuantity || item.planned_quantity || 0),
    received_packages: Number(item.receivedPackages || item.received_packages || 0),
    received_quantity: Number(item.receivedQuantity || item.received_quantity || 0),
    item_status: item.itemStatus || item.item_status || 'planned',
    remarks: item.remarks || null,
  }
}

export const domesticTransferOrderService = {
  async getByPurchaseOrderId(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPurchaseOrderId domestic_transfer_orders', error)
    return (data || []).map(fromDomesticTransferOrderRow)
  },
  async getByConsolidationPlanId(consolidationPlanId: string) {
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .select('*')
      .eq('consolidation_plan_id', consolidationPlanId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByConsolidationPlanId domestic_transfer_orders', error)
    return (data || []).map(fromDomesticTransferOrderRow)
  },
  async create(order: any) {
    const row = toDomesticTransferOrderRow(order)
    const { data, error } = await supabase
      .from('domestic_transfer_orders')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create domestic_transfer_order', error)
    return fromDomesticTransferOrderRow(data)
  },
}

export const cargoReceiptService = {
  async getByTransferOrderId(transferOrderId: string) {
    const { data, error } = await supabase
      .from('cargo_receipts')
      .select('*, cargo_receipt_items(*)')
      .eq('transfer_order_id', transferOrderId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByTransferOrderId cargo_receipts', error)
    return (data || []).map((row) => ({
      ...fromCargoReceiptRow(row),
      items: (row.cargo_receipt_items || []).map(fromCargoReceiptItemRow),
    }))
  },
  async createWithItems(payload: any) {
    const receiptRow = toCargoReceiptRow(payload)
    const { data: receiptData, error: receiptError } = await supabase
      .from('cargo_receipts')
      .insert(receiptRow)
      .select()
      .single()
    if (receiptError) throwServiceError('create cargo_receipt', receiptError)

    const items = Array.isArray(payload.items) ? payload.items : []
    let mappedItems: any[] = []
    if (items.length > 0) {
      const itemRows = items.map((item: any) => toCargoReceiptItemRow(item, receiptData.id))
      const { data: itemData, error: itemError } = await supabase
        .from('cargo_receipt_items')
        .insert(itemRows)
        .select()
      if (itemError) throwServiceError('create cargo_receipt_items', itemError)
      mappedItems = (itemData || []).map(fromCargoReceiptItemRow)

      for (const item of items) {
        const consolidationItemId = toUUIDOrNull(item.consolidationItemId || item.consolidation_item_id)
        if (!consolidationItemId) continue
        const { data: existingItem, error: existingItemError } = await supabase
          .from('consolidation_plan_items')
          .select('received_packages, received_quantity, planned_packages, planned_quantity')
          .eq('id', consolidationItemId)
          .single()
        if (existingItemError) throwServiceError('load consolidation_plan_item for receipt sync', existingItemError)

        const nextReceivedPackages = Number(existingItem.received_packages || 0) + Number(item.receivedPackages || item.received_packages || 0)
        const nextReceivedQuantity = Number(existingItem.received_quantity || 0) + Number(item.receivedQuantity || item.received_quantity || 0)
        const plannedPackages = Number(existingItem.planned_packages || 0)
        const plannedQuantity = Number(existingItem.planned_quantity || 0)
        const nextItemStatus =
          nextReceivedPackages >= plannedPackages && nextReceivedQuantity >= plannedQuantity
            ? 'received'
            : 'in_transit'

        const { error: updateItemError } = await supabase
          .from('consolidation_plan_items')
          .update({
            received_packages: nextReceivedPackages,
            received_quantity: nextReceivedQuantity,
            item_status: nextItemStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', consolidationItemId)
        if (updateItemError) throwServiceError('update consolidation_plan_item receipt progress', updateItemError)
      }
    }

    const transferOrderId = receiptData.transfer_order_id
    if (transferOrderId) {
      const { error: transferError } = await supabase
        .from('domestic_transfer_orders')
        .update({
          status: payload.varianceFlag || payload.variance_flag ? 'exception_pending' : 'received',
          actual_arrival_at: payload.receivedAt || payload.received_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', transferOrderId)
      if (transferError) throwServiceError('update domestic_transfer_order after receipt', transferError)
    }

    const consolidationPlanId = receiptData.consolidation_plan_id
    if (consolidationPlanId) {
      const { data: planItems, error: planItemsError } = await supabase
        .from('consolidation_plan_items')
        .select('planned_packages, planned_quantity, received_packages, received_quantity')
        .eq('plan_id', consolidationPlanId)
      if (planItemsError) throwServiceError('load consolidation_plan_items for status sync', planItemsError)

      const allReceived = (planItems || []).every((item) => {
        const plannedPackages = Number(item.planned_packages || 0)
        const plannedQuantity = Number(item.planned_quantity || 0)
        const receivedPackages = Number(item.received_packages || 0)
        const receivedQuantity = Number(item.received_quantity || 0)
        return receivedPackages >= plannedPackages && receivedQuantity >= plannedQuantity
      })

      const { error: planStatusError } = await supabase
        .from('consolidation_plans')
        .update({
          status: allReceived ? 'ready_for_loading' : 'collecting',
          updated_at: new Date().toISOString(),
        })
        .eq('id', consolidationPlanId)
      if (planStatusError) throwServiceError('update consolidation_plan status after receipt', planStatusError)
    }

    return {
      ...fromCargoReceiptRow(receiptData),
      items: mappedItems,
    }
  },
}

export const thirdPartyWarehouseService = {
  async getAll() {
    const { data, error } = await supabase
      .from('third_party_warehouses')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getAll third_party_warehouses', error)
    return (data || []).map(fromThirdPartyWarehouseRow)
  },
  async upsert(warehouse: any) {
    const row = toThirdPartyWarehouseRow(warehouse)
    const { data, error } = await supabase
      .from('third_party_warehouses')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single()
    if (error) throwServiceError('upsert third_party_warehouse', error)
    return fromThirdPartyWarehouseRow(data)
  },
}

export const consolidationPlanService = {
  async getAll() {
    const { data, error } = await supabase
      .from('consolidation_plans')
      .select('*, consolidation_plan_items(*)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throwServiceError('getAll consolidation_plans', error)
    return (data || []).map((row) => ({
      ...fromConsolidationPlanRow(row),
      items: (row.consolidation_plan_items || []).map(fromConsolidationPlanItemRow),
    }))
  },
  async getByShipmentNo(shipmentNo: string) {
    const { data, error } = await supabase
      .from('consolidation_plans')
      .select('*, consolidation_plan_items(*)')
      .eq('shipment_no', shipmentNo)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByShipmentNo consolidation_plans', error)
    return (data || []).map((row) => ({
      ...fromConsolidationPlanRow(row),
      items: (row.consolidation_plan_items || []).map(fromConsolidationPlanItemRow),
    }))
  },
  async createWithItems(payload: any) {
    const planRow = toConsolidationPlanRow(payload)
    const { data: planData, error: planError } = await supabase
      .from('consolidation_plans')
      .insert(planRow)
      .select()
      .single()
    if (planError) throwServiceError('create consolidation_plan', planError)

    const items = Array.isArray(payload.items) ? payload.items : []
    let mappedItems: any[] = []
    if (items.length > 0) {
      const itemRows = items.map((item: any) => toConsolidationPlanItemRow(item, planData.id))
      const { data: itemData, error: itemError } = await supabase
        .from('consolidation_plan_items')
        .insert(itemRows)
        .select()
      if (itemError) throwServiceError('create consolidation_plan_items', itemError)
      mappedItems = (itemData || []).map(fromConsolidationPlanItemRow)
    }

    return {
      ...fromConsolidationPlanRow(planData),
      items: mappedItems,
    }
  },
}
