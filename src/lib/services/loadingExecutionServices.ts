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

function toIsoDate(value: any): string | null {
  if (!value) return null
  const text = String(value)
  return text.includes('T') ? text.slice(0, 10) : text
}

function fromContainerLoadPlanRow(r: any) {
  if (!r) return null
  const participants = deriveExternalParticipants(r)
  return {
    id: r.id,
    loadPlanNo: r.load_plan_no,
    shipmentNo: r.shipment_no,
    salesContractId: r.sales_contract_id,
    loadingPoolId: r.loading_pool_id,
    solutionId: r.solution_id,
    solutionContainerId: r.solution_container_id,
    status: r.status,
    containerType: r.container_type,
    containerCount: r.container_count,
    loadingMode: r.loading_mode,
    consolidationMode: r.consolidation_mode,
    portOfLoading: r.port_of_loading,
    portOfDestination: r.port_of_destination,
    forwarderId: r.forwarder_id,
    truckCompanyId: r.truck_company_id,
    customsBrokerId: r.customs_broker_id,
    externalParticipants: participants,
    plannedEtd: r.planned_etd,
    bookingCutoffAt: r.booking_cutoff_at,
    plannedCustomsCutoffAt: r.planned_customs_cutoff_at,
    plannedLoadingDate: r.planned_loading_date,
    sealRequired: r.seal_required ?? true,
    finalSealNo: r.final_seal_no,
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toContainerLoadPlanRow(plan: any) {
  const id = toUUIDOrNull(plan.id)
  const salesContractId = toUUIDOrNull(plan.salesContractId || plan.sales_contract_id)
  const loadingPoolId = toUUIDOrNull(plan.loadingPoolId || plan.loading_pool_id)
  const solutionId = toUUIDOrNull(plan.solutionId || plan.solution_id)
  const solutionContainerId = toUUIDOrNull(plan.solutionContainerId || plan.solution_container_id)
  return {
    ...(id ? { id } : {}),
    load_plan_no: plan.loadPlanNo || plan.load_plan_no,
    shipment_no: plan.shipmentNo || plan.shipment_no || null,
    ...(salesContractId ? { sales_contract_id: salesContractId } : {}),
    ...(loadingPoolId ? { loading_pool_id: loadingPoolId } : {}),
    ...(solutionId ? { solution_id: solutionId } : {}),
    ...(solutionContainerId ? { solution_container_id: solutionContainerId } : {}),
    status: plan.status || 'draft',
    container_type: plan.containerType || plan.container_type || '',
    container_count: Number(plan.containerCount || plan.container_count || 1),
    loading_mode: plan.loadingMode || plan.loading_mode || null,
    consolidation_mode: plan.consolidationMode || plan.consolidation_mode || null,
    port_of_loading: plan.portOfLoading || plan.port_of_loading || null,
    port_of_destination: plan.portOfDestination || plan.port_of_destination || null,
    forwarder_id: plan.forwarderId || plan.forwarder_id || null,
    truck_company_id: plan.truckCompanyId || plan.truck_company_id || null,
    customs_broker_id: plan.customsBrokerId || plan.customs_broker_id || null,
    planned_etd: toIsoDate(plan.plannedEtd || plan.planned_etd),
    booking_cutoff_at: plan.bookingCutoffAt || plan.booking_cutoff_at || null,
    planned_customs_cutoff_at: plan.plannedCustomsCutoffAt || plan.planned_customs_cutoff_at || null,
    planned_loading_date: toIsoDate(plan.plannedLoadingDate || plan.planned_loading_date),
    seal_required: Boolean(plan.sealRequired ?? plan.seal_required ?? true),
    final_seal_no: plan.finalSealNo || plan.final_seal_no || null,
    remarks: plan.remarks || null,
  }
}

function fromLoadingTaskRow(r: any) {
  if (!r) return null
  const participants = deriveExternalParticipants(r)
  return {
    id: r.id,
    loadingTaskNo: r.loading_task_no,
    loadPlanId: r.load_plan_id,
    solutionId: r.solution_id,
    solutionContainerId: r.solution_container_id,
    sequenceNo: r.sequence_no,
    taskStatus: r.task_status,
    loadingPointType: r.loading_point_type,
    loadingPointId: r.loading_point_id,
    loadingPointName: r.loading_point_name,
    truckCompanyId: r.truck_company_id,
    containerNo: r.container_no,
    sealStatus: r.seal_status,
    sealNo: r.seal_no,
    driverName: r.driver_name,
    driverPhone: r.driver_phone,
    externalParticipants: participants,
    vehicleNo: r.vehicle_no,
    supervisorName: r.supervisor_name,
    scheduledArrivalAt: r.scheduled_arrival_at,
    actualArrivalAt: r.actual_arrival_at,
    loadingStartAt: r.loading_start_at,
    loadingFinishAt: r.loading_finish_at,
    departedAt: r.departed_at,
    loadedPackages: r.loaded_packages || 0,
    loadedQuantity: r.loaded_quantity || 0,
    loadedWeight: r.loaded_weight || 0,
    loadedCbm: r.loaded_cbm || 0,
    containerConditionOk: r.container_condition_ok,
    containerCleanOk: r.container_clean_ok,
    containerDryOk: r.container_dry_ok,
    odorCheckOk: r.odor_check_ok,
    doorLockOk: r.door_lock_ok,
    floorCheckOk: r.floor_check_ok,
    emptyContainerPhotos: r.empty_container_photos || [],
    halfLoadedInnerPhotos: r.half_loaded_inner_photos || [],
    fullLoadedBothDoorsOpenPhotos: r.full_loaded_both_doors_open_photos || [],
    leftDoorOpenPhotos: r.left_door_open_photos || [],
    bothDoorsClosedPhotos: r.both_doors_closed_photos || [],
    remarks: r.remarks,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function toLoadingTaskRow(task: any) {
  const id = toUUIDOrNull(task.id)
  const loadPlanId = toUUIDOrNull(task.loadPlanId || task.load_plan_id)
  const solutionId = toUUIDOrNull(task.solutionId || task.solution_id)
  const solutionContainerId = toUUIDOrNull(task.solutionContainerId || task.solution_container_id)
  return {
    ...(id ? { id } : {}),
    loading_task_no: task.loadingTaskNo || task.loading_task_no,
    ...(loadPlanId ? { load_plan_id: loadPlanId } : {}),
    ...(solutionId ? { solution_id: solutionId } : {}),
    ...(solutionContainerId ? { solution_container_id: solutionContainerId } : {}),
    sequence_no: Number(task.sequenceNo || task.sequence_no || 1),
    task_status: task.taskStatus || task.task_status || 'planned',
    loading_point_type: task.loadingPointType || task.loading_point_type || null,
    loading_point_id: task.loadingPointId || task.loading_point_id || null,
    loading_point_name: task.loadingPointName || task.loading_point_name || null,
    truck_company_id: task.truckCompanyId || task.truck_company_id || null,
    container_no: task.containerNo || task.container_no || null,
    seal_status: task.sealStatus || task.seal_status || 'not_sealed',
    seal_no: task.sealNo || task.seal_no || null,
    driver_name: task.driverName || task.driver_name || null,
    driver_phone: task.driverPhone || task.driver_phone || null,
    vehicle_no: task.vehicleNo || task.vehicle_no || null,
    supervisor_name: task.supervisorName || task.supervisor_name || null,
    scheduled_arrival_at: task.scheduledArrivalAt || task.scheduled_arrival_at || null,
    actual_arrival_at: task.actualArrivalAt || task.actual_arrival_at || null,
    loading_start_at: task.loadingStartAt || task.loading_start_at || null,
    loading_finish_at: task.loadingFinishAt || task.loading_finish_at || null,
    departed_at: task.departedAt || task.departed_at || null,
    loaded_packages: Number(task.loadedPackages || task.loaded_packages || 0),
    loaded_quantity: Number(task.loadedQuantity || task.loaded_quantity || 0),
    loaded_weight: Number(task.loadedWeight || task.loaded_weight || 0),
    loaded_cbm: Number(task.loadedCbm || task.loaded_cbm || 0),
    container_condition_ok: task.containerConditionOk ?? task.container_condition_ok ?? null,
    container_clean_ok: task.containerCleanOk ?? task.container_clean_ok ?? null,
    container_dry_ok: task.containerDryOk ?? task.container_dry_ok ?? null,
    odor_check_ok: task.odorCheckOk ?? task.odor_check_ok ?? null,
    door_lock_ok: task.doorLockOk ?? task.door_lock_ok ?? null,
    floor_check_ok: task.floorCheckOk ?? task.floor_check_ok ?? null,
    empty_container_photos: task.emptyContainerPhotos || task.empty_container_photos || [],
    half_loaded_inner_photos: task.halfLoadedInnerPhotos || task.half_loaded_inner_photos || [],
    full_loaded_both_doors_open_photos: task.fullLoadedBothDoorsOpenPhotos || task.full_loaded_both_doors_open_photos || [],
    left_door_open_photos: task.leftDoorOpenPhotos || task.left_door_open_photos || [],
    both_doors_closed_photos: task.bothDoorsClosedPhotos || task.both_doors_closed_photos || [],
    remarks: task.remarks || null,
  }
}

function fromLoadingTaskItemRow(r: any) {
  if (!r) return null
  return {
    id: r.id,
    loadingTaskId: r.loading_task_id,
    cargoLotId: r.cargo_lot_id,
    solutionItemId: r.solution_item_id,
    loadedPackages: Number(r.loaded_packages || 0),
    loadedQuantity: Number(r.loaded_quantity || 0),
    remarks: r.remarks || null,
    createdAt: r.created_at,
  }
}

function toLoadingTaskItemRow(item: any) {
  const id = toUUIDOrNull(item.id)
  const loadingTaskId = toUUIDOrNull(item.loadingTaskId || item.loading_task_id)
  const cargoLotId = toUUIDOrNull(item.cargoLotId || item.cargo_lot_id)
  const solutionItemId = toUUIDOrNull(item.solutionItemId || item.solution_item_id)
  return {
    ...(id ? { id } : {}),
    ...(loadingTaskId ? { loading_task_id: loadingTaskId } : {}),
    ...(cargoLotId ? { cargo_lot_id: cargoLotId } : {}),
    ...(solutionItemId ? { solution_item_id: solutionItemId } : {}),
    loaded_packages: Number(item.loadedPackages || item.loaded_packages || 0),
    loaded_quantity: Number(item.loadedQuantity || item.loaded_quantity || 0),
    remarks: item.remarks || null,
  }
}

export const containerLoadPlanService = {
  async create(plan: any) {
    const row = toContainerLoadPlanRow(plan)
    const { data, error } = await supabase
      .from('container_load_plans')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create container_load_plan', error)
    return fromContainerLoadPlanRow(data)
  },
  async getByShipmentNo(shipmentNo: string) {
    const { data, error } = await supabase
      .from('container_load_plans')
      .select('*')
      .eq('shipment_no', shipmentNo)
      .order('created_at', { ascending: false })
    if (error) throwServiceError('getByShipmentNo container_load_plans', error)
    return (data || []).map(fromContainerLoadPlanRow)
  },
  async getBySolutionContainerId(solutionContainerId: string) {
    const { data, error } = await supabase
      .from('container_load_plans')
      .select('*')
      .eq('solution_container_id', solutionContainerId)
      .maybeSingle()
    if (error) throwServiceError('getBySolutionContainerId container_load_plans', error)
    return fromContainerLoadPlanRow(data)
  },
}

export const loadingTaskService = {
  async create(task: any) {
    const row = toLoadingTaskRow(task)
    const { data, error } = await supabase
      .from('loading_tasks')
      .insert(row)
      .select()
      .single()
    if (error) throwServiceError('create loading_task', error)
    return fromLoadingTaskRow(data)
  },
  async getByLoadPlanId(loadPlanId: string) {
    const { data, error } = await supabase
      .from('loading_tasks')
      .select('*')
      .eq('load_plan_id', loadPlanId)
      .order('sequence_no', { ascending: true })
    if (error) throwServiceError('getByLoadPlanId loading_tasks', error)
    return (data || []).map(fromLoadingTaskRow)
  },
  async getBySolutionContainerId(solutionContainerId: string) {
    const { data, error } = await supabase
      .from('loading_tasks')
      .select('*')
      .eq('solution_container_id', solutionContainerId)
      .order('sequence_no', { ascending: true })
    if (error) throwServiceError('getBySolutionContainerId loading_tasks', error)
    return (data || []).map(fromLoadingTaskRow)
  },
  async update(taskId: string, payload: any) {
    const row = toLoadingTaskRow(payload) as Record<string, any>
    delete row.id
    delete row.load_plan_id
    delete row.loading_task_no
    row.updated_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('loading_tasks')
      .update(row)
      .eq('id', taskId)
      .select('*')
      .single()
    if (error) throwServiceError('update loading_tasks', error)
    return fromLoadingTaskRow(data)
  },
}

export const loadingTaskItemService = {
  async getByLoadingTaskId(loadingTaskId: string) {
    const { data, error } = await supabase
      .from('loading_task_items')
      .select('*')
      .eq('loading_task_id', loadingTaskId)
    if (error) throwServiceError('getByLoadingTaskId loading_task_items', error)
    return (data || []).map(fromLoadingTaskItemRow)
  },
  async upsertMany(items: any[]) {
    if (!Array.isArray(items) || items.length === 0) return []
    const rows = items.map(toLoadingTaskItemRow)
    const { data, error } = await supabase
      .from('loading_task_items')
      .upsert(rows, { onConflict: 'loading_task_id,solution_item_id' })
      .select('*')
    if (error) throwServiceError('upsertMany loading_task_items', error)
    return (data || []).map(fromLoadingTaskItemRow)
  },
}
