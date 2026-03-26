import { supabase } from '../supabase'
import { containerLoadPlanService, loadingTaskItemService, loadingTaskService } from './postContractExecutionServices'

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

function toNumber(value: any, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function ensureRisk(value: any = {}, fallbackCode = 'OK') {
  return {
    code: value?.code || fallbackCode,
    level: value?.level || 'info',
    score: toNumber(value?.score, 0),
    reason: value?.reason || '',
    suggested_action: value?.suggested_action || '',
  }
}

function estimateCbm(lengthCm: number, widthCm: number, heightCm: number, cartons: number) {
  if (!lengthCm || !widthCm || !heightCm || !cartons) return 0
  return (lengthCm * widthCm * heightCm * cartons) / 1000000
}

function fromLoadingPoolRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    poolNo: r.pool_no,
    poolName: r.pool_name,
    poolType: r.pool_type,
    customerId: r.customer_id,
    customerName: r.customer_name,
    shipmentBatchNo: r.shipment_batch_no,
    shipmentSplitNo: r.shipment_split_no,
    planningScope: r.planning_scope,
    poolStatus: r.pool_status,
    plannedLoadingDate: r.planned_loading_date,
    portOfLoading: r.port_of_loading,
    destinationPort: r.destination_port,
    tradeTerm: r.trade_term,
    currency: r.currency,
    totalOrders: r.total_orders || 0,
    totalSuppliers: r.total_suppliers || 0,
    totalSkus: r.total_skus || 0,
    totalCartons: toNumber(r.total_cartons),
    totalWeightKg: toNumber(r.total_weight_kg),
    totalCbm: toNumber(r.total_cbm),
    rulesProfileCode: r.rules_profile_code,
    businessConstraintsSnapshot: r.business_constraints_snapshot || {},
    remarks: r.remarks,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toLoadingPoolRow(pool: any) {
  const id = toUUIDOrNull(pool.id)
  return {
    ...(id ? { id } : {}),
    pool_no: pool.poolNo || pool.pool_no,
    pool_name: pool.poolName || pool.pool_name,
    pool_type: pool.poolType || pool.pool_type || 'manual_pool',
    customer_id: pool.customerId || pool.customer_id || null,
    customer_name: pool.customerName || pool.customer_name || null,
    shipment_batch_no: pool.shipmentBatchNo || pool.shipment_batch_no || null,
    shipment_split_no: pool.shipmentSplitNo || pool.shipment_split_no || null,
    planning_scope: pool.planningScope || pool.planning_scope || 'outbound_loading',
    pool_status: pool.poolStatus || pool.pool_status || 'draft',
    planned_loading_date: pool.plannedLoadingDate || pool.planned_loading_date || null,
    port_of_loading: pool.portOfLoading || pool.port_of_loading || null,
    destination_port: pool.destinationPort || pool.destination_port || null,
    trade_term: pool.tradeTerm || pool.trade_term || null,
    currency: pool.currency || null,
    rules_profile_code: pool.rulesProfileCode || pool.rules_profile_code || null,
    business_constraints_snapshot: pool.businessConstraintsSnapshot || pool.business_constraints_snapshot || {},
    remarks: pool.remarks || null,
    created_by: pool.createdBy || pool.created_by || null,
    approved_by: pool.approvedBy || pool.approved_by || null,
  }
}

function fromLoadingPoolItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    poolId: r.pool_id,
    sourceType: r.source_type,
    sourceRefId: r.source_ref_id,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    orderId: r.order_id,
    orderNo: r.order_no,
    customerId: r.customer_id,
    customerName: r.customer_name,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    shipmentBatchNo: r.shipment_batch_no,
    shipmentSplitNo: r.shipment_split_no,
    skuId: r.sku_id,
    skuCode: r.sku_code,
    productName: r.product_name,
    modelNo: r.model_no,
    categoryCode: r.category_code,
    cargoCategory: r.cargo_category,
    packagingUnitType: r.packaging_unit_type,
    isPalletized: r.is_palletized ?? false,
    unitsPerHandlingGroup: r.units_per_handling_group || 1,
    cartonCount: toNumber(r.carton_count),
    quantity: toNumber(r.quantity),
    cartonLengthCm: toNumber(r.carton_length_cm),
    cartonWidthCm: toNumber(r.carton_width_cm),
    cartonHeightCm: toNumber(r.carton_height_cm),
    cartonGrossWeightKg: toNumber(r.carton_gross_weight_kg),
    singleCartonCbm: toNumber(r.single_carton_cbm),
    totalWeightKg: toNumber(r.total_weight_kg),
    totalCbm: toNumber(r.total_cbm),
    rotationAllowed: r.rotation_allowed ?? true,
    rotationModes: r.rotation_modes || [],
    stackable: r.stackable ?? true,
    maxStackLayers: r.max_stack_layers,
    fragile: r.fragile ?? false,
    mixable: r.mixable ?? true,
    mustSameContainer: r.must_same_container ?? false,
    manualLockContainerKey: r.manual_lock_container_key,
    preferredContainerType: r.preferred_container_type,
    forbiddenContainerTypes: r.forbidden_container_types || [],
    mustNearDoor: r.must_near_door ?? false,
    mustBottom: r.must_bottom ?? false,
    mustTop: r.must_top ?? false,
    loadingPriority: r.loading_priority || 100,
    unloadingPriority: r.unloading_priority || 100,
    itemStatus: r.item_status,
    manualOverrideFlag: r.manual_override_flag ?? false,
    constraintNotes: r.constraint_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toLoadingPoolItemRow(item: any, poolId?: string) {
  const id = toUUIDOrNull(item.id)
  const resolvedPoolId = toUUIDOrNull(poolId || item.poolId || item.pool_id)
  const purchaseOrderId = toUUIDOrNull(item.purchaseOrderId || item.purchase_order_id)
  const salesContractId = toUUIDOrNull(item.salesContractId || item.sales_contract_id)
  const cartonCount = toNumber(item.cartonCount || item.carton_count)
  const cartonLengthCm = toNumber(item.cartonLengthCm || item.carton_length_cm)
  const cartonWidthCm = toNumber(item.cartonWidthCm || item.carton_width_cm)
  const cartonHeightCm = toNumber(item.cartonHeightCm || item.carton_height_cm)
  const singleCartonCbm = toNumber(item.singleCartonCbm || item.single_carton_cbm || estimateCbm(cartonLengthCm, cartonWidthCm, cartonHeightCm, 1))
  const totalCbm = toNumber(item.totalCbm || item.total_cbm || singleCartonCbm * cartonCount)
  const totalWeightKg = toNumber(item.totalWeightKg || item.total_weight_kg || toNumber(item.cartonGrossWeightKg || item.carton_gross_weight_kg) * cartonCount)
  return {
    ...(id ? { id } : {}),
    ...(resolvedPoolId ? { pool_id: resolvedPoolId } : {}),
    source_type: item.sourceType || item.source_type || 'manual_entry',
    source_ref_id: toUUIDOrNull(item.sourceRefId || item.source_ref_id),
    ...(salesContractId ? { sales_contract_id: salesContractId } : {}),
    ...(purchaseOrderId ? { purchase_order_id: purchaseOrderId } : {}),
    order_id: item.orderId || item.order_id || null,
    order_no: item.orderNo || item.order_no || null,
    customer_id: item.customerId || item.customer_id || null,
    customer_name: item.customerName || item.customer_name || null,
    supplier_id: item.supplierId || item.supplier_id || null,
    supplier_name: item.supplierName || item.supplier_name || null,
    shipment_batch_no: item.shipmentBatchNo || item.shipment_batch_no || null,
    shipment_split_no: item.shipmentSplitNo || item.shipment_split_no || null,
    sku_id: item.skuId || item.sku_id || null,
    sku_code: item.skuCode || item.sku_code || null,
    product_name: item.productName || item.product_name || '',
    model_no: item.modelNo || item.model_no || null,
    category_code: item.categoryCode || item.category_code || null,
    cargo_category: item.cargoCategory || item.cargo_category || null,
    packaging_unit_type: item.packagingUnitType || item.packaging_unit_type || 'carton',
    is_palletized: Boolean(item.isPalletized || item.is_palletized || false),
    units_per_handling_group: Number(item.unitsPerHandlingGroup || item.units_per_handling_group || 1),
    carton_count: cartonCount,
    quantity: toNumber(item.quantity),
    carton_length_cm: cartonLengthCm,
    carton_width_cm: cartonWidthCm,
    carton_height_cm: cartonHeightCm,
    carton_gross_weight_kg: toNumber(item.cartonGrossWeightKg || item.carton_gross_weight_kg),
    single_carton_cbm: singleCartonCbm,
    total_weight_kg: totalWeightKg,
    total_cbm: totalCbm,
    rotation_allowed: Boolean(item.rotationAllowed ?? item.rotation_allowed ?? true),
    rotation_modes: item.rotationModes || item.rotation_modes || [],
    stackable: Boolean(item.stackable ?? item.stackable ?? true),
    max_stack_layers: item.maxStackLayers || item.max_stack_layers || null,
    fragile: Boolean(item.fragile || false),
    mixable: Boolean(item.mixable ?? true),
    must_same_container: Boolean(item.mustSameContainer || item.must_same_container || false),
    manual_lock_container_key: item.manualLockContainerKey || item.manual_lock_container_key || null,
    preferred_container_type: item.preferredContainerType || item.preferred_container_type || null,
    forbidden_container_types: item.forbiddenContainerTypes || item.forbidden_container_types || [],
    must_near_door: Boolean(item.mustNearDoor || item.must_near_door || false),
    must_bottom: Boolean(item.mustBottom || item.must_bottom || false),
    must_top: Boolean(item.mustTop || item.must_top || false),
    loading_priority: Number(item.loadingPriority || item.loading_priority || 100),
    unloading_priority: Number(item.unloadingPriority || item.unloading_priority || 100),
    item_status: item.itemStatus || item.item_status || 'ready',
    manual_override_flag: Boolean(item.manualOverrideFlag || item.manual_override_flag || false),
    constraint_notes: item.constraintNotes || item.constraint_notes || null,
  }
}

function fromContainerTypeSpecRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    containerTypeCode: r.container_type_code,
    containerTypeName: r.container_type_name,
    innerLengthCm: toNumber(r.inner_length_cm),
    innerWidthCm: toNumber(r.inner_width_cm),
    innerHeightCm: toNumber(r.inner_height_cm),
    doorWidthCm: toNumber(r.door_width_cm),
    doorHeightCm: toNumber(r.door_height_cm),
    maxPayloadKg: toNumber(r.max_payload_kg),
    maxVolumeCbm: toNumber(r.max_volume_cbm),
    tareWeightKg: toNumber(r.tare_weight_kg),
    usableVolumeRatio: toNumber(r.usable_volume_ratio, 0.95),
    usableWeightRatio: toNumber(r.usable_weight_ratio, 0.95),
    defaultForExport: r.default_for_export ?? false,
    status: r.status,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toContainerTypeSpecRow(spec: any) {
  const id = toUUIDOrNull(spec.id)
  return {
    ...(id ? { id } : {}),
    container_type_code: spec.containerTypeCode || spec.container_type_code,
    container_type_name: spec.containerTypeName || spec.container_type_name,
    inner_length_cm: toNumber(spec.innerLengthCm || spec.inner_length_cm),
    inner_width_cm: toNumber(spec.innerWidthCm || spec.inner_width_cm),
    inner_height_cm: toNumber(spec.innerHeightCm || spec.inner_height_cm),
    door_width_cm: spec.doorWidthCm != null || spec.door_width_cm != null ? toNumber(spec.doorWidthCm || spec.door_width_cm) : null,
    door_height_cm: spec.doorHeightCm != null || spec.door_height_cm != null ? toNumber(spec.doorHeightCm || spec.door_height_cm) : null,
    max_payload_kg: toNumber(spec.maxPayloadKg || spec.max_payload_kg),
    max_volume_cbm: toNumber(spec.maxVolumeCbm || spec.max_volume_cbm),
    tare_weight_kg: spec.tareWeightKg != null || spec.tare_weight_kg != null ? toNumber(spec.tareWeightKg || spec.tare_weight_kg) : null,
    usable_volume_ratio: toNumber(spec.usableVolumeRatio || spec.usable_volume_ratio, 0.95),
    usable_weight_ratio: toNumber(spec.usableWeightRatio || spec.usable_weight_ratio, 0.95),
    default_for_export: Boolean(spec.defaultForExport || spec.default_for_export || false),
    status: spec.status || 'active',
    remarks: spec.remarks || null,
  }
}

function fromSolutionRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    solutionNo: r.solution_no,
    poolId: r.pool_id,
    planningMode: r.planning_mode,
    solutionStatus: r.solution_status,
    isBaseline: r.is_baseline ?? false,
    parentSolutionId: r.parent_solution_id,
    versionNo: r.version_no || 1,
    algorithmVersion: r.algorithm_version,
    estimationSummary: r.estimation_summary || {},
    recommendedContainerMix: r.recommended_container_mix || [],
    utilizationSummary: r.utilization_summary || {},
    riskSummary: r.risk_summary || {},
    totalWeightKg: toNumber(r.total_weight_kg),
    totalCbm: toNumber(r.total_cbm),
    totalCartons: toNumber(r.total_cartons),
    containerCount: r.container_count || 0,
    manualAdjustmentCount: r.manual_adjustment_count || 0,
    confirmedAt: r.confirmed_at,
    confirmedBy: r.confirmed_by,
    executedAt: r.executed_at,
    executedBy: r.executed_by,
    remarks: r.remarks,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function fromSolutionContainerRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    solutionId: r.solution_id,
    containerIndex: r.container_index,
    plannedContainerNo: r.planned_container_no,
    actualContainerNo: r.actual_container_no,
    containerTypeSpecId: r.container_type_spec_id,
    containerTypeCode: r.container_type_code,
    doorSide: r.door_side,
    planningStatus: r.planning_status,
    manualLocked: r.manual_locked ?? false,
    plannedWeightKg: toNumber(r.planned_weight_kg),
    plannedCbm: toNumber(r.planned_cbm),
    plannedCartons: toNumber(r.planned_cartons),
    weightUtilization: toNumber(r.weight_utilization),
    volumeUtilization: toNumber(r.volume_utilization),
    supplierGroupingScore: toNumber(r.supplier_grouping_score),
    loadingRiskScore: toNumber(r.loading_risk_score),
    unloadingRiskScore: toNumber(r.unloading_risk_score),
    weightRisk: r.weight_risk || {},
    volumeRisk: r.volume_risk || {},
    stackingRisk: r.stacking_risk || {},
    fragileRisk: r.fragile_risk || {},
    unloadingRisk: r.unloading_risk || {},
    groupingRisk: r.grouping_risk || {},
    nearDoorItemCount: r.near_door_item_count || 0,
    blockedAccessRisk: r.blocked_access_risk || {},
    plannedLoadingSequenceSummary: r.planned_loading_sequence_summary || [],
    actualWeightKg: toNumber(r.actual_weight_kg),
    actualCbm: toNumber(r.actual_cbm),
    actualCartons: toNumber(r.actual_cartons),
    actualSealNo: r.actual_seal_no,
    varianceFlag: r.variance_flag ?? false,
    varianceReason: r.variance_reason,
    manualAdjustmentNotes: r.manual_adjustment_notes,
    executedAt: r.executed_at,
    executedBy: r.executed_by,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function fromSolutionItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    solutionContainerId: r.solution_container_id,
    poolItemId: r.pool_item_id,
    lineNo: r.line_no,
    itemSeq: r.item_seq,
    salesContractId: r.sales_contract_id,
    purchaseOrderId: r.purchase_order_id,
    orderId: r.order_id,
    orderNo: r.order_no,
    customerId: r.customer_id,
    customerName: r.customer_name,
    supplierId: r.supplier_id,
    supplierName: r.supplier_name,
    shipmentBatchNo: r.shipment_batch_no,
    shipmentSplitNo: r.shipment_split_no,
    skuId: r.sku_id,
    skuCode: r.sku_code,
    productName: r.product_name,
    modelNo: r.model_no,
    categoryCode: r.category_code,
    cargoCategory: r.cargo_category,
    packagingUnitType: r.packaging_unit_type,
    isPalletized: r.is_palletized ?? false,
    unitsPerHandlingGroup: r.units_per_handling_group || 1,
    plannedCartonCount: toNumber(r.planned_carton_count),
    plannedQuantity: toNumber(r.planned_quantity),
    plannedWeightKg: toNumber(r.planned_weight_kg),
    plannedCbm: toNumber(r.planned_cbm),
    actualCartonCount: toNumber(r.actual_carton_count),
    actualQuantity: toNumber(r.actual_quantity),
    actualWeightKg: toNumber(r.actual_weight_kg),
    actualCbm: toNumber(r.actual_cbm),
    mustSameContainer: r.must_same_container ?? false,
    mixable: r.mixable ?? true,
    loadingPriority: r.loading_priority || 100,
    unloadingPriority: r.unloading_priority || 100,
    fragile: r.fragile ?? false,
    stackable: r.stackable ?? true,
    maxStackLayers: r.max_stack_layers,
    rotationAllowed: r.rotation_allowed ?? true,
    rotationModes: r.rotation_modes || [],
    preferredContainerType: r.preferred_container_type,
    forbiddenContainerTypes: r.forbidden_container_types || [],
    mustNearDoor: r.must_near_door ?? false,
    mustBottom: r.must_bottom ?? false,
    mustTop: r.must_top ?? false,
    nearDoorFlag: r.near_door_flag ?? false,
    blockedAccessRisk: r.blocked_access_risk || {},
    allocationStatus: r.allocation_status,
    manualOverrideFlag: r.manual_override_flag ?? false,
    manualOverrideReason: r.manual_override_reason,
    varianceFlag: r.variance_flag ?? false,
    varianceReason: r.variance_reason,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function fromPlacementRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    solutionContainerId: r.solution_container_id,
    solutionItemId: r.solution_item_id,
    placementUnitNo: r.placement_unit_no,
    cartonSerialNo: r.carton_serial_no,
    packagingUnitType: r.packaging_unit_type,
    isPalletized: r.is_palletized ?? false,
    unitsPerHandlingGroup: r.units_per_handling_group || 1,
    handlingGroupNo: r.handling_group_no,
    xCm: toNumber(r.x_cm),
    yCm: toNumber(r.y_cm),
    zCm: toNumber(r.z_cm),
    lengthCm: toNumber(r.length_cm),
    widthCm: toNumber(r.width_cm),
    heightCm: toNumber(r.height_cm),
    weightKg: toNumber(r.weight_kg),
    cbm: toNumber(r.cbm),
    rotationMode: r.rotation_mode,
    layerIndex: r.layer_index || 1,
    faceToDoor: r.face_to_door ?? false,
    nearDoorFlag: r.near_door_flag ?? false,
    loadingSequence: r.loading_sequence || 0,
    unloadingSequence: r.unloading_sequence || 0,
    placementStatus: r.placement_status,
    blockedAccessRisk: r.blocked_access_risk || {},
    fragileRisk: r.fragile_risk || {},
    isManualAdjusted: r.is_manual_adjusted ?? false,
    manualAdjustmentReason: r.manual_adjustment_reason,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function createPlacementUnitRows(container: any, items: any[]) {
  const placements: any[] = []
  let cursorX = 0
  let cursorY = 0
  let currentRowDepth = 0
  const containerLength = toNumber(container?.spec?.innerLengthCm || container?.innerLengthCm || 0, 1203.2)
  const containerWidth = toNumber(container?.spec?.innerWidthCm || container?.innerWidthCm || 0, 235.2)
  let loadingSequence = 1

  for (const item of items) {
    const unitCount = Math.max(1, Math.round(toNumber(item.plannedCartonCount)))
    const lengthCm = toNumber(item.cartonLengthCm || item.lengthCm || 0)
    const widthCm = toNumber(item.cartonWidthCm || item.widthCm || 0)
    const heightCm = toNumber(item.cartonHeightCm || item.heightCm || 0)
    const weightKg = unitCount > 0 ? toNumber(item.plannedWeightKg) / unitCount : 0
    const cbm = unitCount > 0 ? toNumber(item.plannedCbm) / unitCount : 0

    for (let i = 0; i < unitCount; i += 1) {
      if (cursorX + lengthCm > containerLength && cursorX > 0) {
        cursorX = 0
        cursorY += currentRowDepth
        currentRowDepth = 0
      }
      if (cursorY + widthCm > containerWidth) {
        cursorX = 0
        cursorY = 0
      }
      currentRowDepth = Math.max(currentRowDepth, widthCm)
      placements.push({
        solution_container_id: container.id,
        solution_item_id: item.id,
        placement_unit_no: `${container.containerIndex || 1}-${item.itemSeq || 1}-${i + 1}`,
        carton_serial_no: `${item.skuCode || item.productName || 'ITEM'}-${i + 1}`,
        packaging_unit_type: item.packagingUnitType || 'carton',
        is_palletized: Boolean(item.isPalletized || false),
        units_per_handling_group: Number(item.unitsPerHandlingGroup || 1),
        handling_group_no: null,
        x_cm: Number(cursorX.toFixed(3)),
        y_cm: Number(cursorY.toFixed(3)),
        z_cm: 0,
        length_cm: lengthCm,
        width_cm: widthCm,
        height_cm: heightCm,
        weight_kg: Number(weightKg.toFixed(3)),
        cbm: Number(cbm.toFixed(6)),
        rotation_mode: 'LWH',
        layer_index: 1,
        face_to_door: Boolean(item.nearDoorFlag || false),
        near_door_flag: Boolean(item.nearDoorFlag || false),
        loading_sequence: loadingSequence,
        unloading_sequence: Math.max(1, 1000 - loadingSequence),
        placement_status: 'planned',
        blocked_access_risk: ensureRisk(item.nearDoorFlag ? { code: 'NEAR_DOOR', level: 'info', score: 0.1, reason: '该货物靠门放置', suggested_action: '' } : {}),
        fragile_risk: ensureRisk(item.fragile ? { code: 'FRAGILE_ITEM', level: 'warning', score: 0.5, reason: '易碎货物需重点关注层位和挤压风险', suggested_action: '优先安排顶部或单独隔离' } : {}),
        is_manual_adjusted: false,
        manual_adjustment_reason: null,
        remarks: null,
      })
      cursorX += lengthCm
      loadingSequence += 1
    }
  }

  return placements
}

function buildPoolTotals(items: any[]) {
  const orderSet = new Set<string>()
  const supplierSet = new Set<string>()
  const skuSet = new Set<string>()
  let totalCartons = 0
  let totalWeightKg = 0
  let totalCbm = 0
  for (const item of items) {
    if (item.orderId || item.order_id) orderSet.add(String(item.orderId || item.order_id))
    if (item.supplierId || item.supplier_id) supplierSet.add(String(item.supplierId || item.supplier_id))
    if (item.skuId || item.sku_id) skuSet.add(String(item.skuId || item.sku_id))
    totalCartons += toNumber(item.cartonCount || item.carton_count)
    totalWeightKg += toNumber(item.totalWeightKg || item.total_weight_kg)
    totalCbm += toNumber(item.totalCbm || item.total_cbm)
  }
  return {
    total_orders: orderSet.size,
    total_suppliers: supplierSet.size,
    total_skus: skuSet.size,
    total_cartons: Number(totalCartons.toFixed(3)),
    total_weight_kg: Number(totalWeightKg.toFixed(3)),
    total_cbm: Number(totalCbm.toFixed(6)),
  }
}

export const loadingPoolService = {
  async getAll(filters: Record<string, any> = {}) {
    let query = supabase
      .from('loading_pools')
      .select('*')
      .order('created_at', { ascending: false })
    if (filters.poolStatus) query = query.eq('pool_status', filters.poolStatus)
    if (filters.customerId) query = query.eq('customer_id', filters.customerId)
    if (filters.shipmentBatchNo) query = query.eq('shipment_batch_no', filters.shipmentBatchNo)
    const { data, error } = await query
    if (error) throwServiceError('getAll loading_pools', error)
    return (data || []).map(fromLoadingPoolRow)
  },
  async getById(id: string) {
    const { data, error } = await supabase
      .from('loading_pools')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throwServiceError('getById loading_pools', error)
    return fromLoadingPoolRow(data)
  },
  async create(pool: any) {
    const { data, error } = await supabase
      .from('loading_pools')
      .insert(toLoadingPoolRow(pool))
      .select()
      .single()
    if (error) throwServiceError('create loading_pool', error)
    return fromLoadingPoolRow(data)
  },
  async refreshTotals(poolId: string) {
    const { data, error } = await supabase
      .from('loading_pool_items')
      .select('order_id, supplier_id, sku_id, carton_count, total_weight_kg, total_cbm')
      .eq('pool_id', poolId)
    if (error) throwServiceError('refreshTotals loading_pool_items', error)
    const totals = buildPoolTotals(data || [])
    const { data: updated, error: updateError } = await supabase
      .from('loading_pools')
      .update({
        ...totals,
        pool_status: (data || []).length > 0 ? 'ready_for_planning' : 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', poolId)
      .select()
      .single()
    if (updateError) throwServiceError('refreshTotals loading_pools', updateError)
    return fromLoadingPoolRow(updated)
  },
  async updateStatus(poolId: string, poolStatus: string) {
    const { data, error } = await supabase
      .from('loading_pools')
      .update({ pool_status: poolStatus, updated_at: new Date().toISOString() })
      .eq('id', poolId)
      .select()
      .single()
    if (error) throwServiceError('updateStatus loading_pools', error)
    return fromLoadingPoolRow(data)
  },
}

export const loadingPoolItemService = {
  async getByPoolId(poolId: string) {
    const { data, error } = await supabase
      .from('loading_pool_items')
      .select('*')
      .eq('pool_id', poolId)
      .order('created_at', { ascending: true })
    if (error) throwServiceError('getByPoolId loading_pool_items', error)
    return (data || []).map(fromLoadingPoolItemRow)
  },
  async addMany(poolId: string, items: any[]) {
    const rows = items.map((item) => toLoadingPoolItemRow(item, poolId))
    const { data, error } = await supabase
      .from('loading_pool_items')
      .insert(rows)
      .select()
    if (error) throwServiceError('addMany loading_pool_items', error)
    await loadingPoolService.refreshTotals(poolId)
    return (data || []).map(fromLoadingPoolItemRow)
  },
  async updateConstraints(itemId: string, payload: any) {
    const { data: existing, error: existingError } = await supabase
      .from('loading_pool_items')
      .select('*')
      .eq('id', itemId)
      .single()
    if (existingError) throwServiceError('updateConstraints load loading_pool_item', existingError)

    const row = toLoadingPoolItemRow({
      ...fromLoadingPoolItemRow(existing),
      ...payload,
      id: itemId,
      poolId: existing.pool_id,
      sourceType: existing.source_type,
      productName: payload.productName || payload.product_name || existing.product_name,
    })
    delete (row as any).id
    delete (row as any).pool_id
    const { data, error } = await supabase
      .from('loading_pool_items')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single()
    if (error) throwServiceError('updateConstraints loading_pool_items', error)
    return fromLoadingPoolItemRow(data)
  },
  async getRemainingByPoolItem(poolItemId: string) {
    const { data: poolItem, error: itemError } = await supabase
      .from('loading_pool_items')
      .select('*')
      .eq('id', poolItemId)
      .single()
    if (itemError) throwServiceError('getRemainingByPoolItem loading_pool_items', itemError)

    const { data: allocations, error: allocationError } = await supabase
      .from('container_loading_solution_items')
      .select('planned_carton_count, planned_quantity, planned_weight_kg, planned_cbm, allocation_status')
      .eq('pool_item_id', poolItemId)
      .not('allocation_status', 'eq', 'cancelled')
    if (allocationError) throwServiceError('getRemainingByPoolItem solution_items', allocationError)

    const allocated = (allocations || []).reduce((acc, row) => ({
      cartons: acc.cartons + toNumber(row.planned_carton_count),
      quantity: acc.quantity + toNumber(row.planned_quantity),
      weightKg: acc.weightKg + toNumber(row.planned_weight_kg),
      cbm: acc.cbm + toNumber(row.planned_cbm),
    }), { cartons: 0, quantity: 0, weightKg: 0, cbm: 0 })

    return {
      poolItem: fromLoadingPoolItemRow(poolItem),
      remainingCartons: Number((toNumber(poolItem.carton_count) - allocated.cartons).toFixed(3)),
      remainingQuantity: Number((toNumber(poolItem.quantity) - allocated.quantity).toFixed(3)),
      remainingWeightKg: Number((toNumber(poolItem.total_weight_kg) - allocated.weightKg).toFixed(3)),
      remainingCbm: Number((toNumber(poolItem.total_cbm) - allocated.cbm).toFixed(6)),
      allocatedCartons: Number(allocated.cartons.toFixed(3)),
      allocatedQuantity: Number(allocated.quantity.toFixed(3)),
      allocatedWeightKg: Number(allocated.weightKg.toFixed(3)),
      allocatedCbm: Number(allocated.cbm.toFixed(6)),
    }
  },
  async getRemainingByPool(poolId: string) {
    const items = await this.getByPoolId(poolId)
    return Promise.all(items.map((item) => this.getRemainingByPoolItem(item.id)))
  },
}

export const containerTypeSpecService = {
  async getActive() {
    const { data, error } = await supabase
      .from('container_type_specs')
      .select('*')
      .eq('status', 'active')
      .order('default_for_export', { ascending: false })
      .order('container_type_code', { ascending: true })
    if (error) throwServiceError('getActive container_type_specs', error)
    return (data || []).map(fromContainerTypeSpecRow)
  },
  async getByCode(code: string) {
    const { data, error } = await supabase
      .from('container_type_specs')
      .select('*')
      .eq('container_type_code', code)
      .single()
    if (error) throwServiceError('getByCode container_type_specs', error)
    return fromContainerTypeSpecRow(data)
  },
  async upsert(spec: any) {
    const { data, error } = await supabase
      .from('container_type_specs')
      .upsert(toContainerTypeSpecRow(spec), { onConflict: 'container_type_code' })
      .select()
      .single()
    if (error) throwServiceError('upsert container_type_specs', error)
    return fromContainerTypeSpecRow(data)
  },
}

export const containerPlanningEngine = {
  async estimatePool(poolId: string, options: Record<string, any> = {}) {
    const items = await loadingPoolItemService.getByPoolId(poolId)
    const specs = await containerTypeSpecService.getActive()
    const totalWeightKg = items.reduce((sum, item) => sum + toNumber(item.totalWeightKg), 0)
    const totalCbm = items.reduce((sum, item) => sum + toNumber(item.totalCbm), 0)
    const totalCartons = items.reduce((sum, item) => sum + toNumber(item.cartonCount), 0)
    const mixes = specs.map((spec) => {
      const usableWeight = spec.maxPayloadKg * spec.usableWeightRatio
      const usableVolume = spec.maxVolumeCbm * spec.usableVolumeRatio
      const byWeight = usableWeight > 0 ? Math.ceil(totalWeightKg / usableWeight) : 0
      const byVolume = usableVolume > 0 ? Math.ceil(totalCbm / usableVolume) : 0
      const recommendedCount = Math.max(byWeight, byVolume, 1)
      return {
        containerTypeCode: spec.containerTypeCode,
        recommendedCount,
        weightCapacityKg: usableWeight,
        volumeCapacityCbm: usableVolume,
        weightUtilizationPerContainer: recommendedCount ? totalWeightKg / (usableWeight * recommendedCount) : 0,
        volumeUtilizationPerContainer: recommendedCount ? totalCbm / (usableVolume * recommendedCount) : 0,
      }
    }).sort((a, b) => a.recommendedCount - b.recommendedCount || a.volumeUtilizationPerContainer - b.volumeUtilizationPerContainer)

    const recommended = mixes[0] || null
    const riskSummary = {
      weight_risk: ensureRisk(
        recommended && recommended.weightUtilizationPerContainer > 0.95
          ? { code: 'WEIGHT_TIGHT', level: 'warning', score: recommended.weightUtilizationPerContainer, reason: '预计单柜载重利用率偏高', suggested_action: '考虑拆分至下一柜或调整重货搭配' }
          : { code: 'WEIGHT_OK', level: 'info', score: recommended?.weightUtilizationPerContainer || 0, reason: '载重在安全范围内', suggested_action: '' },
      ),
      volume_risk: ensureRisk(
        recommended && recommended.volumeUtilizationPerContainer > 0.95
          ? { code: 'VOLUME_TIGHT', level: 'warning', score: recommended.volumeUtilizationPerContainer, reason: '预计单柜体积利用率偏高', suggested_action: '考虑改用更大柜型或拆分柜次' }
          : { code: 'VOLUME_OK', level: 'info', score: recommended?.volumeUtilizationPerContainer || 0, reason: '体积利用率在安全范围内', suggested_action: '' },
      ),
      stacking_risk: ensureRisk(),
      fragile_risk: ensureRisk(),
      unloading_risk: ensureRisk(),
      grouping_risk: ensureRisk(),
    }

    return {
      poolId,
      options,
      estimationSummary: {
        totalWeightKg: Number(totalWeightKg.toFixed(3)),
        totalCbm: Number(totalCbm.toFixed(6)),
        totalCartons: Number(totalCartons.toFixed(3)),
        recommendedContainerType: recommended?.containerTypeCode || null,
        recommendedContainerCount: recommended?.recommendedCount || 0,
      },
      recommendedContainerMix: mixes,
      riskSummary,
    }
  },
}

export const containerAllocationEngine = {
  async allocatePool(poolId: string, options: Record<string, any> = {}) {
    const estimate = await containerPlanningEngine.estimatePool(poolId, options)
    const items = await loadingPoolItemService.getByPoolId(poolId)
    const specs = await containerTypeSpecService.getActive()
    const selectedTypeCode = options.containerTypeCode || estimate.estimationSummary.recommendedContainerType || specs[0]?.containerTypeCode
    const selectedSpec = specs.find((spec) => spec.containerTypeCode === selectedTypeCode) || specs[0]
    if (!selectedSpec) {
      throw new Error('No active container type specs available')
    }

    const usableWeight = selectedSpec.maxPayloadKg * selectedSpec.usableWeightRatio
    const usableVolume = selectedSpec.maxVolumeCbm * selectedSpec.usableVolumeRatio
    const sortedItems = [...items].sort((a, b) => {
      const categoryScore = (value: string | null | undefined) => value === 'heavy' ? 0 : value === 'normal' ? 1 : 2
      return categoryScore(a.cargoCategory) - categoryScore(b.cargoCategory)
        || (a.loadingPriority - b.loadingPriority)
        || (b.totalWeightKg - a.totalWeightKg)
    })

    const containers: any[] = []
    for (const item of sortedItems) {
      let target = containers.find((container) =>
        container.plannedWeightKg + item.totalWeightKg <= usableWeight
        && container.plannedCbm + item.totalCbm <= usableVolume
      )
      if (!target) {
        target = {
          containerIndex: containers.length + 1,
          containerTypeSpecId: selectedSpec.id,
          containerTypeCode: selectedSpec.containerTypeCode,
          doorSide: 'rear',
          planningStatus: 'allocated',
          manualLocked: false,
          plannedWeightKg: 0,
          plannedCbm: 0,
          plannedCartons: 0,
          items: [],
        }
        containers.push(target)
      }
      target.items.push(item)
      target.plannedWeightKg += item.totalWeightKg
      target.plannedCbm += item.totalCbm
      target.plannedCartons += item.cartonCount
    }

    const mappedContainers = containers.map((container) => {
      const weightUtilization = usableWeight > 0 ? container.plannedWeightKg / usableWeight : 0
      const volumeUtilization = usableVolume > 0 ? container.plannedCbm / usableVolume : 0
      return {
        ...container,
        weightUtilization: Number(weightUtilization.toFixed(4)),
        volumeUtilization: Number(volumeUtilization.toFixed(4)),
        supplierGroupingScore: 0,
        loadingRiskScore: Number(Math.max(weightUtilization, volumeUtilization).toFixed(4)),
        unloadingRiskScore: 0,
        weightRisk: ensureRisk(weightUtilization > 0.95
          ? { code: 'WEIGHT_TIGHT', level: 'warning', score: weightUtilization, reason: '单柜计划重量接近上限', suggested_action: '考虑拆分部分重货' }
          : { code: 'WEIGHT_OK', level: 'info', score: weightUtilization, reason: '单柜计划重量正常', suggested_action: '' }),
        volumeRisk: ensureRisk(volumeUtilization > 0.95
          ? { code: 'VOLUME_TIGHT', level: 'warning', score: volumeUtilization, reason: '单柜计划体积接近上限', suggested_action: '考虑拆分部分抛货或改大柜型' }
          : { code: 'VOLUME_OK', level: 'info', score: volumeUtilization, reason: '单柜计划体积正常', suggested_action: '' }),
        stackingRisk: ensureRisk(),
        fragileRisk: ensureRisk(),
        unloadingRisk: ensureRisk(),
        groupingRisk: ensureRisk(),
        nearDoorItemCount: container.items.filter((item: any) => item.mustNearDoor).length,
        blockedAccessRisk: ensureRisk(),
        plannedLoadingSequenceSummary: container.items.map((item: any, index: number) => ({
          seq: index + 1,
          poolItemId: item.id,
          skuCode: item.skuCode,
          productName: item.productName,
          nearDoor: item.mustNearDoor,
        })),
      }
    })

    return {
      poolId,
      planningMode: options.planningMode || 'system',
      estimationSummary: estimate.estimationSummary,
      recommendedContainerMix: estimate.recommendedContainerMix,
      utilizationSummary: {
        averageWeightUtilization: mappedContainers.length
          ? Number((mappedContainers.reduce((sum, c) => sum + c.weightUtilization, 0) / mappedContainers.length).toFixed(4))
          : 0,
        averageVolumeUtilization: mappedContainers.length
          ? Number((mappedContainers.reduce((sum, c) => sum + c.volumeUtilization, 0) / mappedContainers.length).toFixed(4))
          : 0,
      },
      riskSummary: estimate.riskSummary,
      totalWeightKg: estimate.estimationSummary.totalWeightKg,
      totalCbm: estimate.estimationSummary.totalCbm,
      totalCartons: estimate.estimationSummary.totalCartons,
      containerCount: mappedContainers.length,
      containers: mappedContainers.map((container) => ({
        ...container,
        items: container.items.map((item: any, index: number) => ({
          poolItemId: item.id,
          lineNo: index + 1,
          itemSeq: index + 1,
          salesContractId: item.salesContractId || null,
          purchaseOrderId: item.purchaseOrderId || null,
          orderId: item.orderId || null,
          orderNo: item.orderNo || null,
          customerId: item.customerId || null,
          customerName: item.customerName || null,
          supplierId: item.supplierId || null,
          supplierName: item.supplierName || null,
          shipmentBatchNo: item.shipmentBatchNo || null,
          shipmentSplitNo: item.shipmentSplitNo || null,
          skuId: item.skuId || null,
          skuCode: item.skuCode || null,
          productName: item.productName,
          modelNo: item.modelNo || null,
          categoryCode: item.categoryCode || null,
          cargoCategory: item.cargoCategory || null,
          packagingUnitType: item.packagingUnitType || 'carton',
          isPalletized: item.isPalletized || false,
          unitsPerHandlingGroup: item.unitsPerHandlingGroup || 1,
          plannedCartonCount: item.cartonCount,
          plannedQuantity: item.quantity,
          plannedWeightKg: item.totalWeightKg,
          plannedCbm: item.totalCbm,
          mustSameContainer: item.mustSameContainer || false,
          mixable: item.mixable ?? true,
          loadingPriority: item.loadingPriority || 100,
          unloadingPriority: item.unloadingPriority || 100,
          fragile: item.fragile || false,
          stackable: item.stackable ?? true,
          maxStackLayers: item.maxStackLayers || null,
          rotationAllowed: item.rotationAllowed ?? true,
          rotationModes: item.rotationModes || [],
          preferredContainerType: item.preferredContainerType || null,
          forbiddenContainerTypes: item.forbiddenContainerTypes || [],
          mustNearDoor: item.mustNearDoor || false,
          mustBottom: item.mustBottom || false,
          mustTop: item.mustTop || false,
          nearDoorFlag: item.mustNearDoor || false,
          blockedAccessRisk: ensureRisk(),
          allocationStatus: 'allocated',
          manualOverrideFlag: item.manualOverrideFlag || false,
          manualOverrideReason: null,
          varianceFlag: false,
          varianceReason: null,
          remarks: item.constraintNotes || null,
        })),
      })),
    }
  },
}

export const containerLoadingSolutionService = {
  async getByPoolId(poolId: string) {
    const { data, error } = await supabase
      .from('container_loading_solutions')
      .select(`
        *,
        container_loading_solution_containers (
          *,
          container_loading_solution_items (*)
        )
      `)
      .eq('pool_id', poolId)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByPoolId container_loading_solutions', error)
    return (data || []).map((row) => ({
      ...fromSolutionRow(row),
      containers: (row.container_loading_solution_containers || []).map((containerRow: any) => ({
        ...fromSolutionContainerRow(containerRow),
        items: (containerRow.container_loading_solution_items || []).map(fromSolutionItemRow),
      })),
    }))
  },
  async getById(solutionId: string) {
    const { data, error } = await supabase
      .from('container_loading_solutions')
      .select(`
        *,
        container_loading_solution_containers (
          *,
          container_loading_solution_items (*)
        )
      `)
      .eq('id', solutionId)
      .single()
    if (error) throwServiceError('getById container_loading_solutions', error)
    return {
      ...fromSolutionRow(data),
      containers: (data.container_loading_solution_containers || []).map((containerRow: any) => ({
        ...fromSolutionContainerRow(containerRow),
        items: (containerRow.container_loading_solution_items || []).map(fromSolutionItemRow),
      })),
    }
  },
  async createSolutionFromEngineResult(payload: any) {
    const solutionNo = payload.solutionNo || payload.solution_no
    const poolId = toUUIDOrNull(payload.poolId || payload.pool_id)
    if (!solutionNo || !poolId) {
      throw new Error('solutionNo and poolId are required')
    }
    const solutionRow = {
      solution_no: solutionNo,
      pool_id: poolId,
      planning_mode: payload.planningMode || payload.planning_mode || 'system',
      solution_status: payload.solutionStatus || payload.solution_status || 'recommended',
      is_baseline: Boolean(payload.isBaseline || payload.is_baseline || false),
      parent_solution_id: toUUIDOrNull(payload.parentSolutionId || payload.parent_solution_id),
      version_no: Number(payload.versionNo || payload.version_no || 1),
      algorithm_version: payload.algorithmVersion || payload.algorithm_version || null,
      estimation_summary: payload.estimationSummary || payload.estimation_summary || {},
      recommended_container_mix: payload.recommendedContainerMix || payload.recommended_container_mix || [],
      utilization_summary: payload.utilizationSummary || payload.utilization_summary || {},
      risk_summary: payload.riskSummary || payload.risk_summary || {},
      total_weight_kg: toNumber(payload.totalWeightKg || payload.total_weight_kg),
      total_cbm: toNumber(payload.totalCbm || payload.total_cbm),
      total_cartons: toNumber(payload.totalCartons || payload.total_cartons),
      container_count: Number(payload.containerCount || payload.container_count || 0),
      manual_adjustment_count: Number(payload.manualAdjustmentCount || payload.manual_adjustment_count || 0),
      remarks: payload.remarks || null,
      created_by: payload.createdBy || payload.created_by || null,
      approved_by: payload.approvedBy || payload.approved_by || null,
    }

    const { data: solutionData, error: solutionError } = await supabase
      .from('container_loading_solutions')
      .insert(solutionRow)
      .select()
      .single()
    if (solutionError) throwServiceError('create container_loading_solution', solutionError)

    const containers = Array.isArray(payload.containers) ? payload.containers : []
    const createdContainers: any[] = []

    for (const container of containers) {
      const containerRow = {
        solution_id: solutionData.id,
        container_index: Number(container.containerIndex || container.container_index || createdContainers.length + 1),
        planned_container_no: container.plannedContainerNo || container.planned_container_no || null,
        actual_container_no: container.actualContainerNo || container.actual_container_no || null,
        container_type_spec_id: toUUIDOrNull(container.containerTypeSpecId || container.container_type_spec_id),
        container_type_code: container.containerTypeCode || container.container_type_code || '',
        door_side: container.doorSide || container.door_side || 'rear',
        planning_status: container.planningStatus || container.planning_status || 'allocated',
        manual_locked: Boolean(container.manualLocked || container.manual_locked || false),
        planned_weight_kg: toNumber(container.plannedWeightKg || container.planned_weight_kg),
        planned_cbm: toNumber(container.plannedCbm || container.planned_cbm),
        planned_cartons: toNumber(container.plannedCartons || container.planned_cartons),
        weight_utilization: toNumber(container.weightUtilization || container.weight_utilization),
        volume_utilization: toNumber(container.volumeUtilization || container.volume_utilization),
        supplier_grouping_score: toNumber(container.supplierGroupingScore || container.supplier_grouping_score),
        loading_risk_score: toNumber(container.loadingRiskScore || container.loading_risk_score),
        unloading_risk_score: toNumber(container.unloadingRiskScore || container.unloading_risk_score),
        weight_risk: container.weightRisk || container.weight_risk || ensureRisk(),
        volume_risk: container.volumeRisk || container.volume_risk || ensureRisk(),
        stacking_risk: container.stackingRisk || container.stacking_risk || ensureRisk(),
        fragile_risk: container.fragileRisk || container.fragile_risk || ensureRisk(),
        unloading_risk: container.unloadingRisk || container.unloading_risk || ensureRisk(),
        grouping_risk: container.groupingRisk || container.grouping_risk || ensureRisk(),
        near_door_item_count: Number(container.nearDoorItemCount || container.near_door_item_count || 0),
        blocked_access_risk: container.blockedAccessRisk || container.blocked_access_risk || ensureRisk(),
        planned_loading_sequence_summary: container.plannedLoadingSequenceSummary || container.planned_loading_sequence_summary || [],
        actual_weight_kg: toNumber(container.actualWeightKg || container.actual_weight_kg),
        actual_cbm: toNumber(container.actualCbm || container.actual_cbm),
        actual_cartons: toNumber(container.actualCartons || container.actual_cartons),
        actual_seal_no: container.actualSealNo || container.actual_seal_no || null,
        variance_flag: Boolean(container.varianceFlag || container.variance_flag || false),
        variance_reason: container.varianceReason || container.variance_reason || null,
        manual_adjustment_notes: container.manualAdjustmentNotes || container.manual_adjustment_notes || null,
        executed_at: container.executedAt || container.executed_at || null,
        executed_by: container.executedBy || container.executed_by || null,
        remarks: container.remarks || null,
      }
      const { data: containerData, error: containerError } = await supabase
        .from('container_loading_solution_containers')
        .insert(containerRow)
        .select()
        .single()
      if (containerError) throwServiceError('create container_loading_solution_container', containerError)

      const items = Array.isArray(container.items) ? container.items : []
      let createdItems: any[] = []
      if (items.length > 0) {
        const itemRows = items.map((item: any, index: number) => ({
          solution_container_id: containerData.id,
          pool_item_id: toUUIDOrNull(item.poolItemId || item.pool_item_id),
          line_no: Number(item.lineNo || item.line_no || index + 1),
          item_seq: Number(item.itemSeq || item.item_seq || index + 1),
          sales_contract_id: toUUIDOrNull(item.salesContractId || item.sales_contract_id),
          purchase_order_id: toUUIDOrNull(item.purchaseOrderId || item.purchase_order_id),
          order_id: item.orderId || item.order_id || null,
          order_no: item.orderNo || item.order_no || null,
          customer_id: item.customerId || item.customer_id || null,
          customer_name: item.customerName || item.customer_name || null,
          supplier_id: item.supplierId || item.supplier_id || null,
          supplier_name: item.supplierName || item.supplier_name || null,
          shipment_batch_no: item.shipmentBatchNo || item.shipment_batch_no || null,
          shipment_split_no: item.shipmentSplitNo || item.shipment_split_no || null,
          sku_id: item.skuId || item.sku_id || null,
          sku_code: item.skuCode || item.sku_code || null,
          product_name: item.productName || item.product_name || '',
          model_no: item.modelNo || item.model_no || null,
          category_code: item.categoryCode || item.category_code || null,
          cargo_category: item.cargoCategory || item.cargo_category || null,
          packaging_unit_type: item.packagingUnitType || item.packaging_unit_type || 'carton',
          is_palletized: Boolean(item.isPalletized || item.is_palletized || false),
          units_per_handling_group: Number(item.unitsPerHandlingGroup || item.units_per_handling_group || 1),
          planned_carton_count: toNumber(item.plannedCartonCount || item.planned_carton_count),
          planned_quantity: toNumber(item.plannedQuantity || item.planned_quantity),
          planned_weight_kg: toNumber(item.plannedWeightKg || item.planned_weight_kg),
          planned_cbm: toNumber(item.plannedCbm || item.planned_cbm),
          actual_carton_count: toNumber(item.actualCartonCount || item.actual_carton_count),
          actual_quantity: toNumber(item.actualQuantity || item.actual_quantity),
          actual_weight_kg: toNumber(item.actualWeightKg || item.actual_weight_kg),
          actual_cbm: toNumber(item.actualCbm || item.actual_cbm),
          must_same_container: Boolean(item.mustSameContainer || item.must_same_container || false),
          mixable: Boolean(item.mixable ?? true),
          loading_priority: Number(item.loadingPriority || item.loading_priority || 100),
          unloading_priority: Number(item.unloadingPriority || item.unloading_priority || 100),
          fragile: Boolean(item.fragile || false),
          stackable: Boolean(item.stackable ?? true),
          max_stack_layers: item.maxStackLayers || item.max_stack_layers || null,
          rotation_allowed: Boolean(item.rotationAllowed ?? item.rotation_allowed ?? true),
          rotation_modes: item.rotationModes || item.rotation_modes || [],
          preferred_container_type: item.preferredContainerType || item.preferred_container_type || null,
          forbidden_container_types: item.forbiddenContainerTypes || item.forbidden_container_types || [],
          must_near_door: Boolean(item.mustNearDoor || item.must_near_door || false),
          must_bottom: Boolean(item.mustBottom || item.must_bottom || false),
          must_top: Boolean(item.mustTop || item.must_top || false),
          near_door_flag: Boolean(item.nearDoorFlag || item.near_door_flag || false),
          blocked_access_risk: item.blockedAccessRisk || item.blocked_access_risk || ensureRisk(),
          allocation_status: item.allocationStatus || item.allocation_status || 'allocated',
          manual_override_flag: Boolean(item.manualOverrideFlag || item.manual_override_flag || false),
          manual_override_reason: item.manualOverrideReason || item.manual_override_reason || null,
          variance_flag: Boolean(item.varianceFlag || item.variance_flag || false),
          variance_reason: item.varianceReason || item.variance_reason || null,
          remarks: item.remarks || null,
        }))
        const { data: itemData, error: itemError } = await supabase
          .from('container_loading_solution_items')
          .insert(itemRows)
          .select()
        if (itemError) throwServiceError('create container_loading_solution_items', itemError)
        createdItems = (itemData || []).map(fromSolutionItemRow)
      }

      createdContainers.push({
        ...fromSolutionContainerRow(containerData),
        items: createdItems,
      })
    }

    await loadingPoolService.updateStatus(poolId, 'planned')

    return {
      ...fromSolutionRow(solutionData),
      containers: createdContainers,
    }
  },
  async setBaseline(solutionId: string) {
    const current = await this.getById(solutionId)
    await supabase
      .from('container_loading_solutions')
      .update({ is_baseline: false, updated_at: new Date().toISOString() })
      .eq('pool_id', current.poolId)
    const { data, error } = await supabase
      .from('container_loading_solutions')
      .update({ is_baseline: true, updated_at: new Date().toISOString() })
      .eq('id', solutionId)
      .select()
      .single()
    if (error) throwServiceError('setBaseline container_loading_solutions', error)
    return fromSolutionRow(data)
  },
  async confirmSolution(solutionId: string, confirmedBy: string) {
    const { data, error } = await supabase
      .from('container_loading_solutions')
      .update({
        solution_status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: confirmedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', solutionId)
      .select()
      .single()
    if (error) throwServiceError('confirmSolution container_loading_solutions', error)
    return fromSolutionRow(data)
  },
  async applySolutionToExecution(solutionId: string, operator = 'admin') {
    const solution = await this.getById(solutionId)
    if (!solution) throw new Error('未找到分柜方案')
    if (solution.solutionStatus !== 'confirmed') {
      throw new Error('请先确认分柜方案，再生成执行对象')
    }

    const pool = await loadingPoolService.getById(solution.poolId)
    if (!pool) throw new Error('未找到对应待装柜池')

    const shipmentNo = pool.shipmentBatchNo || pool.poolNo
    const generatedPlans: any[] = []
    const generatedTasks: any[] = []

    for (const container of solution.containers || []) {
      let loadPlan = await containerLoadPlanService.getBySolutionContainerId(container.id)
      if (!loadPlan) {
        loadPlan = await containerLoadPlanService.create({
          loadPlanNo: `CLP-${Date.now()}-${container.containerIndex}`,
          shipmentNo,
          loadingPoolId: pool.id,
          solutionId: solution.id,
          solutionContainerId: container.id,
          status: 'ready_for_loading',
          containerType: container.containerTypeCode,
          containerCount: 1,
          loadingMode: 'single_point_loading',
          consolidationMode: pool.poolType === 'shipment_batch' ? 'third_party_warehouse_consolidation' : 'multi_supplier_consolidation',
          portOfLoading: pool.portOfLoading || null,
          portOfDestination: pool.destinationPort || null,
          plannedLoadingDate: pool.plannedLoadingDate || null,
          sealRequired: true,
          remarks: `由分柜方案 ${solution.solutionNo} 第 ${container.containerIndex} 柜生成`,
        })
      }
      generatedPlans.push(loadPlan)

      const existingTasks = await loadingTaskService.getBySolutionContainerId(container.id)
      if (!existingTasks.length) {
        const task = await loadingTaskService.create({
          loadingTaskNo: `LT-${Date.now()}-${container.containerIndex}`,
          loadPlanId: loadPlan.id,
          solutionId: solution.id,
          solutionContainerId: container.id,
          sequenceNo: 1,
          taskStatus: 'planned',
          loadingPointType: 'third_party_warehouse',
          loadingPointId: null,
          loadingPointName: pool.poolName || '待装柜池',
          containerNo: container.actualContainerNo || container.plannedContainerNo || null,
          sealStatus: container.actualSealNo ? 'sealed_final' : 'not_sealed',
          sealNo: container.actualSealNo || null,
          loadedPackages: container.actualCartons > 0 ? container.actualCartons : container.plannedCartons,
          loadedQuantity: 0,
          loadedWeight: container.actualWeightKg > 0 ? container.actualWeightKg : container.plannedWeightKg,
          loadedCbm: container.actualCbm > 0 ? container.actualCbm : container.plannedCbm,
          remarks: `由分柜方案 ${solution.solutionNo} 自动生成的装柜任务`,
        })
        generatedTasks.push(task)
      } else {
        generatedTasks.push(...existingTasks)
      }
    }

    await loadingPoolService.updateStatus(pool.id, 'executing')

    return {
      solutionId: solution.id,
      solutionNo: solution.solutionNo,
      generatedPlans,
      generatedTasks,
    }
  },
  async updateContainerActuals(containerId: string, payload: any) {
    const row = {
      actual_container_no: payload.actualContainerNo || payload.actual_container_no || null,
      actual_weight_kg: payload.actualWeightKg != null || payload.actual_weight_kg != null ? toNumber(payload.actualWeightKg ?? payload.actual_weight_kg) : undefined,
      actual_cbm: payload.actualCbm != null || payload.actual_cbm != null ? toNumber(payload.actualCbm ?? payload.actual_cbm) : undefined,
      actual_cartons: payload.actualCartons != null || payload.actual_cartons != null ? toNumber(payload.actualCartons ?? payload.actual_cartons) : undefined,
      actual_seal_no: payload.actualSealNo || payload.actual_seal_no || null,
      variance_flag: payload.varianceFlag != null || payload.variance_flag != null ? Boolean(payload.varianceFlag ?? payload.variance_flag) : undefined,
      variance_reason: payload.varianceReason || payload.variance_reason || null,
      manual_adjustment_notes: payload.manualAdjustmentNotes || payload.manual_adjustment_notes || null,
      planning_status: payload.planningStatus || payload.planning_status || undefined,
      executed_at: payload.executedAt || payload.executed_at || undefined,
      executed_by: payload.executedBy || payload.executed_by || undefined,
      remarks: payload.remarks || null,
      updated_at: new Date().toISOString(),
    } as Record<string, any>
    Object.keys(row).forEach((key) => {
      if (row[key] === undefined) delete row[key]
    })
    const { data, error } = await supabase
      .from('container_loading_solution_containers')
      .update(row)
      .eq('id', containerId)
      .select('*')
      .single()
    if (error) throwServiceError('updateContainerActuals container_loading_solution_containers', error)
    return fromSolutionContainerRow(data)
  },
  async syncContainerActualsFromExecution(containerId: string, operator = 'admin') {
    const tasks = await loadingTaskService.getBySolutionContainerId(containerId)
    if (!tasks.length) {
      throw new Error('当前柜还没有执行任务可回写')
    }

    const firstTaskWithContainer = tasks.find((task) => task.containerNo || task.sealNo)
    const totalPackages = tasks.reduce((sum, task) => sum + toNumber(task.loadedPackages), 0)
    const totalWeight = tasks.reduce((sum, task) => sum + toNumber(task.loadedWeight), 0)
    const totalCbm = tasks.reduce((sum, task) => sum + toNumber(task.loadedCbm), 0)
    const allCompleted = tasks.every((task) => ['completed', 'loaded'].includes(String(task.taskStatus || '')))
    const anyExecuting = tasks.some((task) => ['loading', 'loaded', 'completed', 'arrived'].includes(String(task.taskStatus || '')))

    const updatedContainer = await this.updateContainerActuals(containerId, {
      actualContainerNo: firstTaskWithContainer?.containerNo || null,
      actualSealNo: firstTaskWithContainer?.sealNo || null,
      actualWeightKg: totalWeight,
      actualCbm: totalCbm,
      actualCartons: totalPackages,
      planningStatus: allCompleted ? 'completed' : anyExecuting ? 'executing' : 'locked',
      executedAt: allCompleted ? new Date().toISOString() : null,
      executedBy: allCompleted ? operator : null,
    })

    const { data: itemRows, error: itemLoadError } = await supabase
      .from('container_loading_solution_items')
      .select('*')
      .eq('solution_container_id', containerId)
      .order('item_seq', { ascending: true })
    if (itemLoadError) throwServiceError('syncContainerActualsFromExecution load items', itemLoadError)

    const items = (itemRows || []).map(fromSolutionItemRow)
    if (items.length) {
      const taskItemMap = new Map<string, any>()
      for (const task of tasks) {
        const taskItems = await loadingTaskItemService.getByLoadingTaskId(task.id)
        for (const taskItem of taskItems) {
          const key = String(taskItem.solutionItemId || '')
          if (!key) continue
          const current = taskItemMap.get(key) || { loadedPackages: 0, loadedQuantity: 0 }
          taskItemMap.set(key, {
            loadedPackages: current.loadedPackages + toNumber(taskItem.loadedPackages),
            loadedQuantity: current.loadedQuantity + toNumber(taskItem.loadedQuantity),
          })
        }
      }

      const containerCartons = toNumber(updatedContainer.actualCartons)
      const totalPlannedCartons = items.reduce((sum, item) => sum + Math.max(0, toNumber(item.plannedCartonCount)), 0)
      for (const item of items) {
        const plannedCartons = Math.max(0, toNumber(item.plannedCartonCount))
        const mappedTaskItem = taskItemMap.get(String(item.id))
        const ratio = totalPlannedCartons > 0 ? plannedCartons / totalPlannedCartons : 0
        const actualCartons = mappedTaskItem
          ? Number(toNumber(mappedTaskItem.loadedPackages).toFixed(3))
          : totalPlannedCartons > 0 ? Number((containerCartons * ratio).toFixed(3)) : 0
        const plannedWeight = toNumber(item.plannedWeightKg)
        const plannedCbm = toNumber(item.plannedCbm)
        const plannedQty = toNumber(item.plannedQuantity)
        const plannedCartonBase = plannedCartons > 0 ? plannedCartons : 1
        const qtyPerCarton = plannedQty / plannedCartonBase
        const weightPerCarton = plannedWeight / plannedCartonBase
        const cbmPerCarton = plannedCbm / plannedCartonBase

        const { error: itemUpdateError } = await supabase
          .from('container_loading_solution_items')
          .update({
            actual_carton_count: actualCartons,
            actual_quantity: mappedTaskItem
              ? Number(toNumber(mappedTaskItem.loadedQuantity).toFixed(3))
              : Number((qtyPerCarton * actualCartons).toFixed(3)),
            actual_weight_kg: Number((weightPerCarton * actualCartons).toFixed(3)),
            actual_cbm: Number((cbmPerCarton * actualCartons).toFixed(6)),
            allocation_status: allCompleted ? 'loaded' : anyExecuting ? 'adjusted' : item.allocationStatus || 'allocated',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
        if (itemUpdateError) throwServiceError('syncContainerActualsFromExecution update items', itemUpdateError)
      }
    }

    return {
      container: updatedContainer,
      tasks,
    }
  },
  async markExecuted(solutionId: string, executedBy: string) {
    const { data, error } = await supabase
      .from('container_loading_solutions')
      .update({
        solution_status: 'executed',
        executed_at: new Date().toISOString(),
        executed_by: executedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', solutionId)
      .select()
      .single()
    if (error) throwServiceError('markExecuted container_loading_solutions', error)
    return fromSolutionRow(data)
  },
}

export const containerPlacementService = {
  async getByContainerId(containerId: string) {
    const { data, error } = await supabase
      .from('container_loading_placements')
      .select('*')
      .eq('solution_container_id', containerId)
      .order('loading_sequence', { ascending: true })
    if (error) throwServiceError('getByContainerId container_loading_placements', error)
    return (data || []).map(fromPlacementRow)
  },
  async regenerateForContainer(containerId: string) {
    const { data: containerRow, error: containerError } = await supabase
      .from('container_loading_solution_containers')
      .select(`
        *,
        container_type_specs (*),
        container_loading_solution_items (*)
      `)
      .eq('id', containerId)
      .single()
    if (containerError) throwServiceError('regenerateForContainer load solution_container', containerError)

    const container = {
      ...fromSolutionContainerRow(containerRow),
      spec: containerRow.container_type_specs ? fromContainerTypeSpecRow(containerRow.container_type_specs) : null,
    }
    const items = (containerRow.container_loading_solution_items || []).map(fromSolutionItemRow)

    const { error: deleteError } = await supabase
      .from('container_loading_placements')
      .delete()
      .eq('solution_container_id', containerId)
    if (deleteError) throwServiceError('regenerateForContainer delete old placements', deleteError)

    const placementRows = createPlacementUnitRows(container, items)
    if (placementRows.length === 0) {
      return []
    }

    const { data, error } = await supabase
      .from('container_loading_placements')
      .insert(placementRows)
      .select('*')
    if (error) throwServiceError('regenerateForContainer insert placements', error)
    return (data || []).map(fromPlacementRow)
  },
  async updatePlacement(placementId: string, payload: any) {
    const row = {
      x_cm: payload.xCm != null || payload.x_cm != null ? toNumber(payload.xCm ?? payload.x_cm) : undefined,
      y_cm: payload.yCm != null || payload.y_cm != null ? toNumber(payload.yCm ?? payload.y_cm) : undefined,
      z_cm: payload.zCm != null || payload.z_cm != null ? toNumber(payload.zCm ?? payload.z_cm) : undefined,
      layer_index: payload.layerIndex != null || payload.layer_index != null ? Number(payload.layerIndex ?? payload.layer_index) : undefined,
      face_to_door: payload.faceToDoor != null || payload.face_to_door != null ? Boolean(payload.faceToDoor ?? payload.face_to_door) : undefined,
      near_door_flag: payload.nearDoorFlag != null || payload.near_door_flag != null ? Boolean(payload.nearDoorFlag ?? payload.near_door_flag) : undefined,
      loading_sequence: payload.loadingSequence != null || payload.loading_sequence != null ? Number(payload.loadingSequence ?? payload.loading_sequence) : undefined,
      unloading_sequence: payload.unloadingSequence != null || payload.unloading_sequence != null ? Number(payload.unloadingSequence ?? payload.unloading_sequence) : undefined,
      blocked_access_risk: payload.blockedAccessRisk || payload.blocked_access_risk || undefined,
      fragile_risk: payload.fragileRisk || payload.fragile_risk || undefined,
      is_manual_adjusted: true,
      manual_adjustment_reason: payload.manualAdjustmentReason || payload.manual_adjustment_reason || null,
      placement_status: payload.placementStatus || payload.placement_status || 'adjusted',
      remarks: payload.remarks || null,
      updated_at: new Date().toISOString(),
    } as Record<string, any>

    Object.keys(row).forEach((key) => {
      if (row[key] === undefined) delete row[key]
    })

    const { data, error } = await supabase
      .from('container_loading_placements')
      .update(row)
      .eq('id', placementId)
      .select('*')
      .single()
    if (error) throwServiceError('updatePlacement container_loading_placements', error)
    return fromPlacementRow(data)
  },
  buildLayeredView(placements: any[]) {
    const layers = new Map<number, any[]>()
    for (const placement of placements) {
      const layer = Number(placement.layerIndex || placement.layer_index || 1)
      const current = layers.get(layer) || []
      current.push(placement)
      layers.set(layer, current)
    }
    return Array.from(layers.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([layerIndex, items]) => ({
        layerIndex,
        items: items.sort((a, b) => (a.loadingSequence || 0) - (b.loadingSequence || 0)),
      }))
  },
}
