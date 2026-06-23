import React, { useEffect, useMemo, useState } from 'react'
import { Boxes, Building2, Calculator, CalendarDays, MapPin, Package, Phone, Plus, Save, Search, Ship, User } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Textarea } from '../../ui/textarea'
import { Checkbox } from '../../ui/checkbox'
import { useUser } from '../../../contexts/UserContext'
import {
  arrivalNoticeService,
  cargoReceiptService,
  consolidationPlanService,
  containerAllocationEngine,
  containerPlacementService,
  containerLoadingSolutionService,
  deliveryConfirmationService,
  domesticTransferOrderService,
  exportRequirementCheckService,
  financeCompliancePacketService,
  importClearanceCoordinationService,
  loadingTaskService,
  loadingTaskItemService,
  loadingPoolItemService,
  loadingPoolService,
  notificationSupabaseService,
  purchaseOrderService,
  purchaseOrderExecutionStatusService,
  shipmentDocumentSetService,
  shipmentWorkflowSummaryService,
  thirdPartyWarehouseService,
  voyageTrackingService,
} from '../../../lib/supabaseService'
import { deriveWarehouseTaskSummary } from '../../../lib/services/warehouseTaskCenterService'

const LC_DISCREPANCY_MARKER = '[LC_DISCREPANCY]'

function hasOpenLcDiscrepancy(remarks: unknown) {
  const raw = String(remarks || '').trim()
  if (!raw) return false
  const markerLine = raw.split('\n').find((line) => line.startsWith(LC_DISCREPANCY_MARKER))
  if (!markerLine) return false
  try {
    const parsed = JSON.parse(markerLine.slice(LC_DISCREPANCY_MARKER.length))
    return ['open', 'pending', 'raised'].includes(String(parsed?.status || ''))
  } catch {
    return false
  }
}

type WarehouseRecord = {
  id: string
  warehouseNo: string
  warehouseName: string
  warehouseType: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  city?: string
  province?: string
  country?: string
  status?: string
  serviceScope?: string[]
  settlementTerms?: string
  remarks?: string
}

type ConsolidationItemDraft = {
  supplierName: string
  productName: string
  modelNo: string
  plannedContainerNo: string
  plannedContainerSlot: string
  plannedPackages: string
  plannedQuantity: string
}

type ReceiptItemDraft = {
  consolidationItemId: string
  supplierName: string
  productName: string
  expectedPackages: string
  expectedQuantity: string
  receivedPackages: string
  receivedQuantity: string
  damageQty: string
  shortageQty: string
  remarks: string
}

type PoolItemEditDraft = {
  id: string
  supplierName: string
  productName: string
  cartonCount: string
  quantity: string
  cartonLengthCm: string
  cartonWidthCm: string
  cartonHeightCm: string
  cartonGrossWeightKg: string
  cargoCategory: string
}

type PlacementEditDraft = {
  id: string
  placementUnitNo: string
  xCm: string
  yCm: string
  zCm: string
  layerIndex: string
  nearDoorFlag: boolean
  faceToDoor: boolean
  loadingSequence: string
  unloadingSequence: string
  manualAdjustmentReason: string
}

type ActualContainerDraft = {
  actualContainerNo: string
  actualSealNo: string
  actualWeightKg: string
  actualCbm: string
  actualCartons: string
  varianceFlag: boolean
  varianceReason: string
  manualAdjustmentNotes: string
}

type LoadingTaskEditDraft = {
  id: string
  loadingTaskNo: string
  loadingPointName: string
  taskStatus: string
  containerNo: string
  sealNo: string
  loadedPackages: string
  loadedQuantity: string
  loadedWeight: string
  loadedCbm: string
  remarks: string
}

type LoadingTaskItemEditDraft = {
  id?: string
  solutionItemId: string
  productName: string
  supplierName: string
  plannedCartons: string
  plannedQuantity: string
  loadedPackages: string
  loadedQuantity: string
  remarks: string
}

const EMPTY_WAREHOUSE_FORM = {
  warehouseNo: '',
  warehouseName: '',
  warehouseType: 'third_party_warehouse',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  city: '',
  province: '',
  country: 'China',
  settlementTerms: '',
  serviceScope: '',
  remarks: '',
}

const EMPTY_PLAN_ITEM: ConsolidationItemDraft = {
  supplierName: '',
  productName: '',
  modelNo: '',
  plannedContainerNo: '',
  plannedContainerSlot: '',
  plannedPackages: '',
  plannedQuantity: '',
}

export default function ThirdPartyWarehouseModule() {
  const { user } = useUser()
  const currentUserRole = String(user?.role || user?.userRole || '')
  const canEditFinancialReleaseFields = ['Finance', 'CFO', 'CEO'].includes(currentUserRole)
  const canManageExecutionCloseArchive = ['Warehouse_Ops', 'CEO'].includes(currentUserRole)
  const [activeTab, setActiveTab] = useState('warehouses')
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingWarehouse, setSavingWarehouse] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [warehouseSearch, setWarehouseSearch] = useState('')
  const [planSearch, setPlanSearch] = useState('')
  const [warehouseForm, setWarehouseForm] = useState(EMPTY_WAREHOUSE_FORM)
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('')
  const [shipmentNo, setShipmentNo] = useState('')
  const [plannedLoadingDate, setPlannedLoadingDate] = useState('')
  const [planRemarks, setPlanRemarks] = useState('')
  const [planItems, setPlanItems] = useState<ConsolidationItemDraft[]>([{ ...EMPTY_PLAN_ITEM }])
  const [activeReceiptPlan, setActiveReceiptPlan] = useState<any | null>(null)
  const [receiptTransferOrderId, setReceiptTransferOrderId] = useState('')
  const [receiptReceivedBy, setReceiptReceivedBy] = useState('')
  const [receiptContactPhone, setReceiptContactPhone] = useState('')
  const [receiptRemarks, setReceiptRemarks] = useState('')
  const [receiptItems, setReceiptItems] = useState<ReceiptItemDraft[]>([])
  const [availableTransfers, setAvailableTransfers] = useState<any[]>([])
  const [savingReceipt, setSavingReceipt] = useState(false)
  const [loadingPools, setLoadingPools] = useState<any[]>([])
  const [poolSearch, setPoolSearch] = useState('')
  const [selectedPool, setSelectedPool] = useState<any | null>(null)
  const [selectedPoolItems, setSelectedPoolItems] = useState<PoolItemEditDraft[]>([])
  const [selectedPoolSolutions, setSelectedPoolSolutions] = useState<any[]>([])
  const [creatingPoolId, setCreatingPoolId] = useState<string | null>(null)
  const [savingPoolItems, setSavingPoolItems] = useState(false)
  const [planningPool, setPlanningPool] = useState(false)
  const [solutionActionLoading, setSolutionActionLoading] = useState<string | null>(null)
  const [executionSyncLoading, setExecutionSyncLoading] = useState<string | null>(null)
  const [selectedContainerDetail, setSelectedContainerDetail] = useState<any | null>(null)
  const [containerPlacements, setContainerPlacements] = useState<any[]>([])
  const [placementActionLoading, setPlacementActionLoading] = useState<string | null>(null)
  const [placementEditRows, setPlacementEditRows] = useState<PlacementEditDraft[]>([])
  const [savingPlacementId, setSavingPlacementId] = useState<string | null>(null)
  const [actualContainerDraft, setActualContainerDraft] = useState<ActualContainerDraft | null>(null)
  const [savingActualContainer, setSavingActualContainer] = useState(false)
  const [actualLoadingTasks, setActualLoadingTasks] = useState<any[]>([])
  const [taskEditRows, setTaskEditRows] = useState<LoadingTaskEditDraft[]>([])
  const [taskItemEditRows, setTaskItemEditRows] = useState<LoadingTaskItemEditDraft[]>([])
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null)
  const [savingTaskItems, setSavingTaskItems] = useState(false)
  const [syncingExecutionBack, setSyncingExecutionBack] = useState(false)
  const [preparingExportDocs, setPreparingExportDocs] = useState(false)
  const [exportPrepRows, setExportPrepRows] = useState<any[]>([])
  const [loadingExportPrep, setLoadingExportPrep] = useState(false)
  const [savingExportPrepId, setSavingExportPrepId] = useState<string | null>(null)

  const layeredPlacements = useMemo(
    () => containerPlacementService.buildLayeredView(containerPlacements || []),
    [containerPlacements]
  )

  async function loadData() {
    setLoading(true)
    try {
      const [warehouseRows, planRows, poolRows] = await Promise.all([
        thirdPartyWarehouseService.getAll(),
        consolidationPlanService.getAll(),
        loadingPoolService.getAll(),
      ])
      setWarehouses(Array.isArray(warehouseRows) ? warehouseRows : [])
      setPlans(Array.isArray(planRows) ? planRows : [])
      setLoadingPools(Array.isArray(poolRows) ? poolRows : [])
    } catch (error: any) {
      toast.error(error?.message || '第三方仓数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredWarehouses = useMemo(() => {
    const keyword = warehouseSearch.trim().toLowerCase()
    if (!keyword) return warehouses
    return warehouses.filter((warehouse) =>
      [
        warehouse.warehouseNo,
        warehouse.warehouseName,
        warehouse.contactName,
        warehouse.contactPhone,
        warehouse.address,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    )
  }, [warehouseSearch, warehouses])

  const filteredPlans = useMemo(() => {
    const keyword = planSearch.trim().toLowerCase()
    if (!keyword) return plans
    return plans.filter((plan) =>
      [
        plan.planNo,
        plan.shipmentNo,
        plan.consolidationPointName,
        plan.warehouseContactName,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    )
  }, [planSearch, plans])

  const filteredPools = useMemo(() => {
    const keyword = poolSearch.trim().toLowerCase()
    if (!keyword) return loadingPools
    return loadingPools.filter((pool) =>
      [
        pool.poolNo,
        pool.poolName,
        pool.customerName,
        pool.shipmentBatchNo,
        pool.shipmentSplitNo,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    )
  }, [loadingPools, poolSearch])

  const warehouseTaskSummary = useMemo(
    () =>
      deriveWarehouseTaskSummary({
        plans,
        loadingPools,
        selectedPoolSolutions,
        exportPrepRows,
      }),
    [exportPrepRows, loadingPools, plans, selectedPoolSolutions],
  )
  const { taskCenter } = warehouseTaskSummary
  const collaborationSections = taskCenter.collaborationSections

  async function openPool(pool: any) {
    setSelectedPool(pool)
    try {
      const [poolItems, solutions] = await Promise.all([
        loadingPoolItemService.getByPoolId(pool.id),
        containerLoadingSolutionService.getByPoolId(pool.id),
      ])
      setSelectedPoolItems((poolItems || []).map((item: any) => ({
        id: item.id,
        supplierName: item.supplierName || '',
        productName: item.productName || '',
        cartonCount: String(item.cartonCount || 0),
        quantity: String(item.quantity || 0),
        cartonLengthCm: String(item.cartonLengthCm || 0),
        cartonWidthCm: String(item.cartonWidthCm || 0),
        cartonHeightCm: String(item.cartonHeightCm || 0),
        cartonGrossWeightKg: String(item.cartonGrossWeightKg || 0),
        cargoCategory: item.cargoCategory || 'normal',
      })))
      setSelectedPoolSolutions(Array.isArray(solutions) ? solutions : [])
      setSelectedContainerDetail(null)
      setContainerPlacements([])
      setActualContainerDraft(null)
      setActualLoadingTasks([])
    } catch (error: any) {
      toast.error(error?.message || '加载待装柜池详情失败')
    }
  }

  function updatePoolItem(index: number, key: keyof PoolItemEditDraft, value: string) {
    setSelectedPoolItems((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
  }

  async function handleCreatePoolFromPlan(plan: any) {
    if (!plan?.items?.length) {
      toast.error('当前计划没有可入池的明细')
      return
    }
    setCreatingPoolId(plan.id)
    try {
      const pool = await loadingPoolService.create({
        poolNo: `LP-${Date.now()}`,
        poolName: `${plan.planNo} 待装柜池`,
        poolType: plan.shipmentNo ? 'shipment_batch' : 'manual_pool',
        customerName: '',
        shipmentBatchNo: plan.shipmentNo || null,
        shipmentSplitNo: null,
        plannedLoadingDate: plan.plannedLoadingDate || null,
        portOfLoading: '',
        destinationPort: '',
        tradeTerm: '',
        currency: 'USD',
        remarks: `由集货计划 ${plan.planNo} 生成`,
      })

      await loadingPoolItemService.addMany(pool.id, (plan.items || []).map((item: any) => ({
        sourceType: 'consolidation_item',
        sourceRefId: item.id,
        purchaseOrderId: item.purchaseOrderId || null,
        supplierId: item.supplierId || null,
        supplierName: item.supplierName || '',
        shipmentBatchNo: plan.shipmentNo || null,
        shipmentSplitNo: null,
        skuId: null,
        skuCode: null,
        productName: item.productName || '',
        modelNo: item.modelNo || '',
        cargoCategory: 'normal',
        packagingUnitType: 'carton',
        cartonCount: Number(item.receivedPackages || item.plannedPackages || 0),
        quantity: Number(item.receivedQuantity || item.plannedQuantity || 0),
        cartonLengthCm: 0,
        cartonWidthCm: 0,
        cartonHeightCm: 0,
        cartonGrossWeightKg: 0,
        totalWeightKg: 0,
        totalCbm: 0,
        loadingPriority: 100,
        unloadingPriority: 100,
        constraintNotes: `由集货计划 ${plan.planNo} 导入，请补充箱规和重量后再分柜`,
      })))

      toast.success('待装柜池已生成，请补充箱规和重量后再分柜')
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || '生成待装柜池失败')
    } finally {
      setCreatingPoolId(null)
    }
  }

  async function handleSavePoolItems() {
    if (!selectedPool) return
    setSavingPoolItems(true)
    try {
      await Promise.all(selectedPoolItems.map((item) => loadingPoolItemService.updateConstraints(item.id, {
        cartonCount: Number(item.cartonCount || 0),
        quantity: Number(item.quantity || 0),
        cartonLengthCm: Number(item.cartonLengthCm || 0),
        cartonWidthCm: Number(item.cartonWidthCm || 0),
        cartonHeightCm: Number(item.cartonHeightCm || 0),
        cartonGrossWeightKg: Number(item.cartonGrossWeightKg || 0),
        totalWeightKg: Number(item.cartonCount || 0) * Number(item.cartonGrossWeightKg || 0),
        totalCbm: (Number(item.cartonLengthCm || 0) * Number(item.cartonWidthCm || 0) * Number(item.cartonHeightCm || 0) * Number(item.cartonCount || 0)) / 1000000,
        cargoCategory: item.cargoCategory,
      })))
      await loadingPoolService.refreshTotals(selectedPool.id)
      await openPool(selectedPool)
      await loadData()
      toast.success('待装柜池货源已更新')
    } catch (error: any) {
      toast.error(error?.message || '保存待装柜池货源失败')
    } finally {
      setSavingPoolItems(false)
    }
  }

  async function handleRunPlanning() {
    if (!selectedPool) return
    setPlanningPool(true)
    try {
      const allocation = await containerAllocationEngine.allocatePool(selectedPool.id, {
        planningMode: 'system',
      })
      await containerLoadingSolutionService.createSolutionFromEngineResult({
        solutionNo: `CLS-${Date.now()}`,
        poolId: selectedPool.id,
        planningMode: allocation.planningMode,
        solutionStatus: 'recommended',
        isBaseline: true,
        versionNo: 1,
        algorithmVersion: 'mvp-v1',
        estimationSummary: allocation.estimationSummary,
        recommendedContainerMix: allocation.recommendedContainerMix,
        utilizationSummary: allocation.utilizationSummary,
        riskSummary: allocation.riskSummary,
        totalWeightKg: allocation.totalWeightKg,
        totalCbm: allocation.totalCbm,
        totalCartons: allocation.totalCartons,
        containerCount: allocation.containerCount,
        containers: allocation.containers,
      })
      await openPool(selectedPool)
      toast.success('系统推荐分柜方案已生成')
    } catch (error: any) {
      toast.error(error?.message || '生成分柜方案失败')
    } finally {
      setPlanningPool(false)
    }
  }

  async function handleSetBaseline(solutionId: string) {
    setSolutionActionLoading(solutionId)
    try {
      await containerLoadingSolutionService.setBaseline(solutionId)
      if (selectedPool) {
        await openPool(selectedPool)
      }
      toast.success('已设置为基线方案')
    } catch (error: any) {
      toast.error(error?.message || '设置基线方案失败')
    } finally {
      setSolutionActionLoading(null)
    }
  }

  async function handleConfirmSolution(solutionId: string) {
    setSolutionActionLoading(solutionId)
    try {
      await containerLoadingSolutionService.confirmSolution(solutionId, 'admin')
      if (selectedPool) {
        await openPool(selectedPool)
      }
      toast.success('分柜方案已确认')
    } catch (error: any) {
      toast.error(error?.message || '确认分柜方案失败')
    } finally {
      setSolutionActionLoading(null)
    }
  }

  async function handleGeneratePlacement(container: any) {
    setPlacementActionLoading(container.id)
    try {
      const placements = await containerPlacementService.regenerateForContainer(container.id)
      setSelectedContainerDetail(container)
      setContainerPlacements(Array.isArray(placements) ? placements : [])
      setPlacementEditRows((Array.isArray(placements) ? placements : []).map((placement: any) => ({
        id: placement.id,
        placementUnitNo: placement.placementUnitNo,
        xCm: String(placement.xCm || 0),
        yCm: String(placement.yCm || 0),
        zCm: String(placement.zCm || 0),
        layerIndex: String(placement.layerIndex || 1),
        nearDoorFlag: Boolean(placement.nearDoorFlag),
        faceToDoor: Boolean(placement.faceToDoor),
        loadingSequence: String(placement.loadingSequence || 0),
        unloadingSequence: String(placement.unloadingSequence || 0),
        manualAdjustmentReason: '',
      })))
      toast.success('单柜装载预案已生成')
    } catch (error: any) {
      toast.error(error?.message || '生成单柜装载预案失败')
    } finally {
      setPlacementActionLoading(null)
    }
  }

  function syncPlacementDrafts(placements: any[]) {
    setPlacementEditRows((placements || []).map((placement: any) => ({
      id: placement.id,
      placementUnitNo: placement.placementUnitNo,
      xCm: String(placement.xCm || 0),
      yCm: String(placement.yCm || 0),
      zCm: String(placement.zCm || 0),
      layerIndex: String(placement.layerIndex || 1),
      nearDoorFlag: Boolean(placement.nearDoorFlag),
      faceToDoor: Boolean(placement.faceToDoor),
      loadingSequence: String(placement.loadingSequence || 0),
      unloadingSequence: String(placement.unloadingSequence || 0),
      manualAdjustmentReason: placement.manualAdjustmentReason || '',
    })))
  }

  function updatePlacementDraft(id: string, key: keyof PlacementEditDraft, value: string | boolean) {
    setPlacementEditRows((rows) => rows.map((row) => (
      row.id === id ? { ...row, [key]: value } : row
    )))
  }

  async function handleSavePlacementAdjustment(id: string) {
    const draft = placementEditRows.find((row) => row.id === id)
    if (!draft) return
    setSavingPlacementId(id)
    try {
      await containerPlacementService.updatePlacement(id, {
        xCm: Number(draft.xCm || 0),
        yCm: Number(draft.yCm || 0),
        zCm: Number(draft.zCm || 0),
        layerIndex: Number(draft.layerIndex || 1),
        nearDoorFlag: draft.nearDoorFlag,
        faceToDoor: draft.faceToDoor,
        loadingSequence: Number(draft.loadingSequence || 0),
        unloadingSequence: Number(draft.unloadingSequence || 0),
        manualAdjustmentReason: draft.manualAdjustmentReason.trim(),
      })
      if (selectedContainerDetail?.id) {
        const placements = await containerPlacementService.getByContainerId(selectedContainerDetail.id)
        setContainerPlacements(Array.isArray(placements) ? placements : [])
        syncPlacementDrafts(Array.isArray(placements) ? placements : [])
      }
      toast.success('placement 调整已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存 placement 调整失败')
    } finally {
      setSavingPlacementId(null)
    }
  }

  async function loadContainerExecutionContext(container: any) {
    setSelectedContainerDetail(container)
    setActualContainerDraft({
      actualContainerNo: container.actualContainerNo || '',
      actualSealNo: container.actualSealNo || '',
      actualWeightKg: String(container.actualWeightKg || 0),
      actualCbm: String(container.actualCbm || 0),
      actualCartons: String(container.actualCartons || 0),
      varianceFlag: Boolean(container.varianceFlag),
      varianceReason: container.varianceReason || '',
      manualAdjustmentNotes: container.manualAdjustmentNotes || '',
    })
    const placements = await containerPlacementService.getByContainerId(container.id)
    setContainerPlacements(Array.isArray(placements) ? placements : [])
    syncPlacementDrafts(Array.isArray(placements) ? placements : [])
    const tasks = await loadingTaskService.getBySolutionContainerId(container.id)
    setActualLoadingTasks(Array.isArray(tasks) ? tasks : [])
    setTaskEditRows((Array.isArray(tasks) ? tasks : []).map((task: any) => ({
      id: task.id,
      loadingTaskNo: task.loadingTaskNo || '',
      loadingPointName: task.loadingPointName || '',
      taskStatus: task.taskStatus || 'planned',
      containerNo: task.containerNo || '',
      sealNo: task.sealNo || '',
      loadedPackages: String(task.loadedPackages || 0),
      loadedQuantity: String(task.loadedQuantity || 0),
      loadedWeight: String(task.loadedWeight || 0),
      loadedCbm: String(task.loadedCbm || 0),
      remarks: task.remarks || '',
    })))
    const primaryTask = Array.isArray(tasks) ? tasks[0] : null
    if (primaryTask) {
      const taskItems = await loadingTaskItemService.getByLoadingTaskId(primaryTask.id)
      const taskItemMap = new Map((taskItems || []).map((item: any) => [String(item.solutionItemId || ''), item]))
      setTaskItemEditRows((container.items || []).map((item: any) => {
        const taskItem = taskItemMap.get(String(item.id))
        return {
          id: taskItem?.id,
          solutionItemId: item.id,
          productName: item.productName || '',
          supplierName: item.supplierName || '',
          plannedCartons: String(item.plannedCartonCount || 0),
          plannedQuantity: String(item.plannedQuantity || 0),
          loadedPackages: String(taskItem?.loadedPackages ?? item.actualCartonCount ?? 0),
          loadedQuantity: String(taskItem?.loadedQuantity ?? item.actualQuantity ?? 0),
          remarks: taskItem?.remarks || '',
        }
      }))
    } else {
      setTaskItemEditRows([])
    }
    await loadExportPrepOverview(container)
  }

  async function loadExportPrepOverview(container: any) {
    const purchaseOrderIds = Array.from(
      new Set(
        (container?.items || [])
          .map((item: any) => item.purchaseOrderId)
          .filter(Boolean)
      )
    )

    if (purchaseOrderIds.length === 0) {
      setExportPrepRows([])
      return
    }

    setLoadingExportPrep(true)
    try {
      const rows = await Promise.all(
        purchaseOrderIds.map(async (purchaseOrderId) => {
          const [checks, docSet, customs, execution, voyage, arrivalNotice, clearance, delivery, workflowSummary] = await Promise.all([
            exportRequirementCheckService.getByPurchaseOrderId(purchaseOrderId),
            shipmentDocumentSetService.getByPurchaseOrderId(purchaseOrderId),
            customsDeclarationService.getByPurchaseOrderId(purchaseOrderId),
            purchaseOrderExecutionStatusService.getByPurchaseOrderId(purchaseOrderId),
            voyageTrackingService.getByPurchaseOrderId(purchaseOrderId),
            arrivalNoticeService.getByPurchaseOrderId(purchaseOrderId),
            importClearanceCoordinationService.getByPurchaseOrderId(purchaseOrderId),
            deliveryConfirmationService.getByPurchaseOrderId(purchaseOrderId),
            shipmentWorkflowSummaryService.getByPurchaseOrderId(purchaseOrderId),
          ])
          const latestCheck = Array.isArray(checks) ? checks[0] : null
          const relatedItems = (container.items || []).filter((item: any) => item.purchaseOrderId === purchaseOrderId)
          return {
            purchaseOrderId,
            orderNo: relatedItems[0]?.orderNo || null,
            supplierName: relatedItems[0]?.supplierName || null,
            products: relatedItems.map((item: any) => item.productName).filter(Boolean),
            collectionControlMode: execution?.collection_control_mode || null,
            documentReleaseMode: execution?.document_release_mode || null,
            customerBalanceStatus: execution?.customer_balance_status || 'pending',
            customerBalanceGateStatus: execution?.customer_balance_gate_status || null,
            bankSubmissionStatus: execution?.bank_submission_status || 'not_required',
            bankSubmittedAt: execution?.bank_submitted_at ? String(execution.bank_submitted_at).slice(0, 16) : null,
            bankSubmittedBy: execution?.bank_submitted_by || null,
            documentReleaseStatus: execution?.document_release_status || 'pending',
            documentReleasedAt: execution?.document_released_at ? String(execution.document_released_at).slice(0, 16) : null,
            documentReleasedBy: execution?.document_released_by || null,
            caseCloseStatus: execution?.case_close_status || 'pending',
            archiveStatus: execution?.archive_status || 'pending',
            caseClosedAt: execution?.case_closed_at ? String(execution.case_closed_at).slice(0, 16) : null,
            archivedAt: execution?.archived_at ? String(execution.archived_at).slice(0, 16) : null,
            exportCheckStatus: latestCheck?.status || 'missing',
            requiresInspection: latestCheck?.requiresInspection || false,
            requiresCo: latestCheck?.requiresCo || false,
            requiresFumigation: latestCheck?.requiresFumigation || false,
            requiresCustomsDeclaration: latestCheck?.requiresCustomsDeclaration ?? true,
            documentSetStatus: docSet ? `${docSet.ciStatus || 'draft'} / ${docSet.plStatus || 'draft'}` : 'missing',
            customsStatus: customs?.declarationStatus || 'missing',
            ciNo: docSet?.commercialInvoiceNo || null,
            plNo: docSet?.packingListNo || null,
            brokerName: customs?.brokerName || null,
            customsDeclNo: customs?.customsDeclNo || null,
            blNo: voyage?.blNo || null,
            carrierName: voyage?.carrierName || null,
            vesselName: voyage?.vesselName || null,
            voyageNo: voyage?.voyageNo || null,
            etd: voyage?.etd || null,
            eta: voyage?.eta || null,
            voyageStatus: voyage?.currentStatus || 'departed',
            currentLocation: voyage?.currentLocation || null,
            arrivalNoticeNo: arrivalNotice?.arrivalNoticeNo || null,
            arrivalPort: arrivalNotice?.arrivalPort || null,
            arrivalAt: arrivalNotice?.arrivalAt ? String(arrivalNotice.arrivalAt).slice(0, 10) : null,
            arrivalNoticeStatus: arrivalNotice?.status || 'draft',
            sentToCustomerAt: arrivalNotice?.sentToCustomerAt ? String(arrivalNotice.sentToCustomerAt).slice(0, 16) : null,
            clearanceStatus: clearance?.clearanceStatus || 'not_started',
            docStatus: clearance?.docStatus || 'pending',
            importBrokerName: clearance?.importBrokerName || null,
            importBrokerContact: clearance?.importBrokerContact || null,
            customsReleaseAt: clearance?.customsReleaseAt ? String(clearance.customsReleaseAt).slice(0, 16) : null,
            deliveryOrderReceived: clearance?.deliveryOrderReceived ?? false,
            deliveredAt: delivery?.deliveredAt ? String(delivery.deliveredAt).slice(0, 16) : null,
            deliveryStatus: delivery?.status || 'pending',
            receivedBy: delivery?.receivedBy || null,
            receivedQuantity: delivery?.receivedQuantity || null,
            damageFlag: delivery?.damageFlag ?? false,
            shortageFlag: delivery?.shortageFlag ?? false,
            workflowSummary: workflowSummary || null,
          }
        })
      )
      setExportPrepRows(rows)
    } catch (error: any) {
      toast.error(error?.message || '加载报关前准备概览失败')
      setExportPrepRows([])
    } finally {
      setLoadingExportPrep(false)
    }
  }

  function updateExportPrepRow(purchaseOrderId: string, key: string, value: any) {
    setExportPrepRows((rows) => rows.map((row) => (
      row.purchaseOrderId === purchaseOrderId ? { ...row, [key]: value } : row
    )))
  }

  function normalizeBankAndReleaseState(row: any, actorName: string) {
    const mode = String(row.collectionControlMode || '')
    const balanceStatus = String(row.customerBalanceStatus || '').toLowerCase()
    const gateStatus = String(row.customerBalanceGateStatus || '').toLowerCase()
    const hasCustomerPaymentClearance =
      ['finance_confirmed', 'paid', 'balance_paid'].includes(balanceStatus) ||
      gateStatus.startsWith('finance_confirmed')

    let bankStatus = String(row.bankSubmissionStatus || 'not_required')
    let releaseStatus = String(row.documentReleaseStatus || 'pending')
    const warnings: string[] = []
    const lcDiscrepancyOpen = hasOpenLcDiscrepancy(row.executionRemarks || row.remarks)
    const paymentControlSummary = row.workflowSummary?.replySummary?.customerPaymentControl || null
    const financialRiskBlocked = Boolean(paymentControlSummary?.financialRiskBlocked)
    const financialBlockedReason = paymentControlSummary?.blockedReason || null

    if (['prepaid_before_booking', 'post_tt_before_obl_release'].includes(mode)) {
      if (bankStatus !== 'not_required') {
        bankStatus = 'not_required'
        warnings.push('当前收款模式无需银行交单，系统已自动改为 not_required。')
      }

      if (!hasCustomerPaymentClearance) {
        if (releaseStatus !== 'blocked') {
          releaseStatus = 'blocked'
          warnings.push('客户款项未确认，放单状态已自动阻断。')
        }
      } else if (!['ready_to_release', 'released'].includes(releaseStatus)) {
        releaseStatus = 'ready_to_release'
      }
    }

    if (mode === 'lc_bank_negotiation') {
      if (bankStatus === 'not_required') {
        bankStatus = 'pending_submission'
        warnings.push('L/C 模式必须走银行交单，系统已自动改为 pending_submission。')
      }

      if (lcDiscrepancyOpen) {
        if (releaseStatus !== 'blocked') {
          releaseStatus = 'blocked'
          warnings.push('当前存在 L/C 不符点未解除，放单状态已自动阻断。')
        }
      } else if (!['negotiated', 'collected'].includes(bankStatus)) {
        if (releaseStatus !== 'blocked') {
          releaseStatus = 'blocked'
          warnings.push('L/C 模式下需完成银行议付或收汇后才能放单，系统已自动阻断。')
        }
      } else if (!['ready_to_release', 'released'].includes(releaseStatus)) {
        releaseStatus = 'ready_to_release'
      }
    }

    if (mode === 'dp_collection' || mode === 'dp_or_other_collection') {
      if (bankStatus === 'not_required') {
        bankStatus = 'pending_submission'
        warnings.push('D/P 或托收模式必须跟踪银行交单，系统已自动改为 pending_submission。')
      }

      if (bankStatus !== 'collected') {
        if (releaseStatus !== 'blocked') {
          releaseStatus = 'blocked'
          warnings.push('D/P 或托收模式下需确认托收到账后才能放单，系统已自动阻断。')
        }
      } else if (!['ready_to_release', 'released'].includes(releaseStatus)) {
        releaseStatus = 'ready_to_release'
      }
    }

    if (mode === 'da_acceptance') {
      if (bankStatus === 'not_required') {
        bankStatus = 'pending_submission'
        warnings.push('D/A 模式必须跟踪银行交单与承兑状态，系统已自动改为 pending_submission。')
      }

      if (!['accepted', 'negotiated', 'collected'].includes(bankStatus)) {
        if (releaseStatus !== 'blocked') {
          releaseStatus = 'blocked'
          warnings.push('D/A 模式下需先完成承兑确认后才能放单，系统已自动阻断。')
        }
      } else if (!['ready_to_release', 'released'].includes(releaseStatus)) {
        releaseStatus = 'ready_to_release'
      }
    }

    if (financialRiskBlocked) {
      if (releaseStatus !== 'blocked') {
        releaseStatus = 'blocked'
        warnings.push(financialBlockedReason || '存在财务放货风险，系统已自动阻断放单。')
      }
    }

    const hasBankMilestone = ['submitted_to_bank', 'negotiated', 'collected'].includes(bankStatus)

    return {
      bankStatus,
      releaseStatus,
      bankSubmittedAt: hasBankMilestone ? (row.bankSubmittedAt || new Date().toISOString()) : null,
      bankSubmittedBy: hasBankMilestone ? (row.bankSubmittedBy || actorName) : null,
      documentReleasedAt: releaseStatus === 'released' ? (row.documentReleasedAt || new Date().toISOString()) : null,
      documentReleasedBy: releaseStatus === 'released' ? (row.documentReleasedBy || actorName) : null,
      warnings,
    }
  }

  function renderWorkflowReplySummary(row: any) {
    const summary = row.workflowSummary?.replySummary || {}
    const pendingReplies = row.workflowSummary?.pendingReplies || []
    const formatSummaryValue = (value: any) => {
      if (!value) return '-'
      if (typeof value === 'string') return value
      const parts = [
        value.status || null,
        value.mode || null,
        typeof value.docReadyPercent === 'number' ? `${value.docReadyPercent}%` : null,
        value.packetNo || null,
        typeof value.pendingCount === 'number' ? `${value.pendingCount} pending` : null,
        value.d05Milestone || null,
      ].filter(Boolean)
      return parts.join(' · ') || JSON.stringify(value)
    }
    const summaryEntries = [
      ['验货', summary.customerThirdPartyInspection],
      ['监装', summary.loadingSupervision],
      ['付款', summary.customerPaymentControl],
      ['交单', summary.bankSubmission],
      ['放单', summary.documentRelease],
      ['到港', summary.arrivalNotice],
      ['清关', summary.clearanceDocs],
      ['收货', summary.deliveryReceipt],
      ['反馈', summary.feedback],
      ['财务包', summary.financeCompliance],
    ].filter(([, value]) => value)

    if (summaryEntries.length === 0 && pendingReplies.length === 0) {
      return <div className="text-xs text-gray-400">暂无回执摘要</div>
    }

    return (
      <div className="space-y-2 text-xs">
        {summaryEntries.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {summaryEntries.map(([label, value]: any) => (
              <div key={label} className="rounded border border-gray-200 bg-gray-50 px-2 py-1">
                <div className="text-[11px] text-gray-500">{label}</div>
                <div className="font-medium text-gray-800">{formatSummaryValue(value)}</div>
              </div>
            ))}
          </div>
        )}
        {pendingReplies.length > 0 && (
          <div className="rounded border border-amber-200 bg-amber-50 px-2 py-2">
            <div className="mb-1 text-[11px] font-medium text-amber-700">待客户回执</div>
            <div className="flex flex-wrap gap-1">
              {pendingReplies.map((item: any) => (
                <span key={item.key} className="rounded bg-white px-2 py-0.5 text-[11px] text-amber-800 border border-amber-200">
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  async function handleSaveExportPrepRow(row: any) {
    setSavingExportPrepId(row.purchaseOrderId)
    try {
      const actorName = user?.name || user?.email || 'warehouse-loading'
      const {
        bankStatus,
        releaseStatus,
        bankSubmittedAt,
        bankSubmittedBy,
        documentReleasedAt,
        documentReleasedBy,
        warnings,
      } = normalizeBankAndReleaseState(row, actorName)
      const docsPending = Boolean(row.requiresInspection || row.requiresCo || row.requiresFumigation)
      const primaryTask = actualLoadingTasks[0] || null
      await exportRequirementCheckService.upsertByPurchaseOrderId(row.purchaseOrderId, {
        checkNo: `ERC-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
        shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
        loadPlanId: primaryTask?.loadPlanId || null,
        destinationCountry: null,
        tradeTerm: selectedPool?.tradeTerm || null,
        customerId: selectedPool?.customerId || selectedPool?.customerName || null,
        requiresCustomsDeclaration: row.requiresCustomsDeclaration,
        requiresInspection: row.requiresInspection,
        requiresCo: row.requiresCo,
        requiresFumigation: row.requiresFumigation,
        requiresLoadingInspectionReport: false,
        requiresHealthCertificate: false,
        requiresOtherDocs: false,
        checkedBy: 'warehouse-loading',
        checkedAt: new Date().toISOString(),
        status: docsPending ? 'documents_pending' : 'ready_for_customs',
      })

      await shipmentDocumentSetService.upsertByPurchaseOrderId(row.purchaseOrderId, {
        documentSetNo: `DOC-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
        loadPlanId: primaryTask?.loadPlanId || null,
        commercialInvoiceNo: row.ciNo?.trim() || null,
        packingListNo: row.plNo?.trim() || null,
        ciStatus: row.ciNo?.trim() ? 'prepared' : 'draft',
        plStatus: row.plNo?.trim() ? 'prepared' : 'draft',
        preparedBy: 'warehouse-loading',
        remarks: `由装柜模块更新报关前单证准备`,
      })

      if (row.brokerName?.trim() || row.customsDeclNo?.trim()) {
        await customsDeclarationService.upsertByPurchaseOrderId(row.purchaseOrderId, {
          customsDeclNo: row.customsDeclNo?.trim() || null,
          brokerName: row.brokerName?.trim() || null,
          declarationStatus: row.customsStatus || 'draft',
          loadPlanId: primaryTask?.loadPlanId || null,
          remarks: '由装柜模块更新报关前准备状态',
          createdBy: 'warehouse-loading',
        })
      }

      const normalizedCustomsStatus = String(row.customsStatus || 'missing')
      const shipmentReadinessStatus = normalizedCustomsStatus === 'submitted'
        ? 'customs_submitted'
        : docsPending
          ? 'documents_pending_before_customs'
          : 'ready_for_customs'

      await purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(row.purchaseOrderId, {
        executionStatus: 'loaded',
        shipmentReadinessStatus,
        collectionControlMode: row.collectionControlMode || undefined,
        documentReleaseMode: row.documentReleaseMode || undefined,
        customerBalanceStatus: row.customerBalanceStatus || undefined,
        customerBalanceGateStatus: row.customerBalanceGateStatus || undefined,
        bankSubmissionStatus: bankStatus,
        bankSubmittedAt,
        bankSubmittedBy,
        documentReleaseStatus: releaseStatus,
        documentReleasedAt,
        documentReleasedBy,
        caseCloseStatus: row.caseCloseStatus || 'pending',
        archiveStatus: row.archiveStatus || 'pending',
        remarks: '由装柜模块更新报关前准备状态',
      })

      if (row.blNo?.trim() || row.carrierName?.trim() || row.vesselName?.trim() || row.voyageNo?.trim() || row.etd || row.eta) {
        const voyage = await voyageTrackingService.upsertByPurchaseOrderId(row.purchaseOrderId, {
          trackingNo: `VT-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
          shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
          loadPlanId: primaryTask?.loadPlanId || null,
          blNo: row.blNo?.trim() || null,
          containerNo: actualContainerDraft?.actualContainerNo || selectedContainerDetail?.actualContainerNo || null,
          carrierName: row.carrierName?.trim() || null,
          vesselName: row.vesselName?.trim() || null,
          voyageNo: row.voyageNo?.trim() || null,
          etd: row.etd || null,
          eta: row.eta || null,
          currentStatus: row.voyageStatus || 'departed',
          currentLocation: row.currentLocation?.trim() || null,
          trackingSource: 'loading-module',
          remarks: '由装柜模块维护开船/提单基础信息',
        })

        if (row.arrivalPort?.trim() || row.arrivalAt || row.arrivalNoticeStatus !== 'draft' || row.sentToCustomerAt || row.arrivalNoticeNo?.trim()) {
          await arrivalNoticeService.upsertByPurchaseOrderId(row.purchaseOrderId, {
            arrivalNoticeNo: row.arrivalNoticeNo?.trim() || `AN-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
            shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
            loadPlanId: primaryTask?.loadPlanId || null,
            blNo: row.blNo?.trim() || null,
            arrivalPort: row.arrivalPort?.trim() || null,
            arrivalAt: row.arrivalAt ? `${row.arrivalAt}T00:00:00` : null,
            sentToCustomerAt: row.sentToCustomerAt || null,
            status: row.arrivalNoticeStatus || 'draft',
            remarks: '由装柜模块维护到港通知',
            voyageId: voyage?.id,
          })
        }
      }

      if (
        row.importBrokerName?.trim() ||
        row.importBrokerContact?.trim() ||
        row.clearanceStatus !== 'not_started' ||
        row.docStatus !== 'pending' ||
        row.customsReleaseAt ||
        row.deliveryOrderReceived
      ) {
        await importClearanceCoordinationService.upsertByPurchaseOrderId(row.purchaseOrderId, {
          clearanceNo: `CLR-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
          shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
          customerId: selectedPool?.customerId || selectedPool?.customerName || null,
          destinationPort: row.arrivalPort?.trim() || null,
          importBrokerName: row.importBrokerName?.trim() || null,
          importBrokerContact: row.importBrokerContact?.trim() || null,
          clearanceStatus: row.clearanceStatus || 'not_started',
          docStatus: row.docStatus || 'pending',
          customsReleaseAt: row.customsReleaseAt || null,
          deliveryOrderReceived: Boolean(row.deliveryOrderReceived),
          remarks: '由装柜模块维护清关协同状态',
        })
      }

      if (
        row.deliveredAt ||
        row.receivedBy?.trim() ||
        row.deliveryStatus !== 'pending' ||
        row.receivedQuantity ||
        row.damageFlag ||
        row.shortageFlag
      ) {
        await deliveryConfirmationService.upsertByPurchaseOrderId(row.purchaseOrderId, {
          deliveryConfirmNo: `DCF-${Date.now()}-${String(row.purchaseOrderId).slice(0, 8)}`,
          shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
          customerId: selectedPool?.customerId || selectedPool?.customerName || null,
          deliveredAt: row.deliveredAt || null,
          receivedBy: row.receivedBy?.trim() || null,
          receivedQuantity: Number(row.receivedQuantity || 0),
          damageFlag: Boolean(row.damageFlag),
          shortageFlag: Boolean(row.shortageFlag),
          claimFlag: Boolean(row.damageFlag || row.shortageFlag),
          status: row.deliveryStatus || 'pending',
          remarks: '由装柜模块维护交付确认',
        })
      }

      const normalizedVoyageStatus = String(row.voyageStatus || 'departed')
      const normalizedArrivalStatus = String(row.arrivalNoticeStatus || 'draft')
      const normalizedClearanceStatus = String(row.clearanceStatus || 'not_started')
      const normalizedDeliveryStatus = String(row.deliveryStatus || 'pending')
      const transitReadinessStatus = normalizedDeliveryStatus === 'closed' || normalizedDeliveryStatus === 'received_ok' || normalizedDeliveryStatus === 'received_with_issue'
        ? 'delivered_to_customer'
        : normalizedClearanceStatus === 'released' || normalizedClearanceStatus === 'delivered_to_customer'
          ? 'customs_released'
          : normalizedClearanceStatus === 'documents_sent' || normalizedClearanceStatus === 'under_clearance' || normalizedClearanceStatus === 'hold'
            ? 'under_import_clearance'
            : normalizedArrivalStatus === 'acknowledged' || normalizedArrivalStatus === 'sent'
              ? 'arrival_notice_sent'
              : normalizedVoyageStatus === 'arrived_at_port'
                ? 'arrived_at_port'
                : row.blNo?.trim() || row.etd || row.eta
                  ? 'in_transit'
                  : shipmentReadinessStatus

      await purchaseOrderExecutionStatusService.upsertByPurchaseOrderId(row.purchaseOrderId, {
        shipmentReadinessStatus: transitReadinessStatus,
        collectionControlMode: row.collectionControlMode || undefined,
        documentReleaseMode: row.documentReleaseMode || undefined,
        customerBalanceStatus: row.customerBalanceStatus || undefined,
        customerBalanceGateStatus: row.customerBalanceGateStatus || undefined,
        bankSubmissionStatus: bankStatus,
        bankSubmittedAt,
        bankSubmittedBy,
        documentReleaseStatus: releaseStatus,
        documentReleasedAt,
        documentReleasedBy,
        caseCloseStatus: row.caseCloseStatus || 'pending',
        archiveStatus: row.archiveStatus || 'pending',
        remarks: '由装柜模块更新在途/放单状态',
      })

      const purchaseOrder = await purchaseOrderService.getById(row.purchaseOrderId)
      const customerEmail = String(purchaseOrder?.customerEmail || '').trim().toLowerCase()
      if (customerEmail) {
        if (normalizedArrivalStatus === 'sent' || normalizedArrivalStatus === 'acknowledged') {
          await notificationSupabaseService.send({
            recipient_email: customerEmail,
            type: 'shipment_arrival_notice',
            title: '到港通知已发送',
            message: `${row.blNo?.trim() || '该批次货物'} 已生成到港通知，请准备清关资料。ETA: ${row.arrivalAt || row.eta || '-'}`,
            related_id: purchaseOrder?.orderNumber || purchaseOrder?.poNumber || row.purchaseOrderId,
            related_type: 'order',
            sender: 'warehouse-loading',
            metadata: {
              purchaseOrderId: row.purchaseOrderId,
              arrivalNoticeNo: row.arrivalNoticeNo || null,
              arrivalPort: row.arrivalPort || null,
              eta: row.arrivalAt || row.eta || null,
            },
          })
        }
        if (normalizedClearanceStatus === 'released') {
          await notificationSupabaseService.send({
            recipient_email: customerEmail,
            type: 'shipment_customs_released',
            title: '清关已放行',
            message: `${row.blNo?.trim() || '该批次货物'} 已完成清关放行，可安排提货/收货。`,
            related_id: purchaseOrder?.orderNumber || purchaseOrder?.poNumber || row.purchaseOrderId,
            related_type: 'order',
            sender: 'warehouse-loading',
            metadata: {
              purchaseOrderId: row.purchaseOrderId,
              customsReleaseAt: row.customsReleaseAt || null,
            },
          })
        }
        if (normalizedDeliveryStatus === 'received_ok' || normalizedDeliveryStatus === 'received_with_issue' || normalizedDeliveryStatus === 'closed') {
          await notificationSupabaseService.send({
            recipient_email: customerEmail,
            type: 'shipment_delivered',
            title: '货物已交付，请反馈',
            message: `${row.blNo?.trim() || '该批次货物'} 已登记收货确认，请在系统中提交产品与交付反馈。`,
            related_id: purchaseOrder?.orderNumber || purchaseOrder?.poNumber || row.purchaseOrderId,
            related_type: 'order',
            sender: 'warehouse-loading',
            metadata: {
              purchaseOrderId: row.purchaseOrderId,
              deliveryStatus: normalizedDeliveryStatus,
              deliveredAt: row.deliveredAt || null,
            },
          })
        }
      }

      await financeCompliancePacketService.syncByPurchaseOrderId(row.purchaseOrderId)
      await loadExportPrepOverview(selectedContainerDetail)
      if (warnings.length > 0) {
        toast.warning(warnings.join(' '))
      }
      toast.success('报关前准备已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存报关前准备失败')
    } finally {
      setSavingExportPrepId(null)
    }
  }

  async function handleCloseCase(row: any) {
    if (!canManageExecutionCloseArchive) {
      toast.error('当前角色不能执行结案，请由 Warehouse_Ops 或 CEO 处理')
      return
    }
    setSavingExportPrepId(row.purchaseOrderId)
    try {
      await purchaseOrderExecutionStatusService.closeCaseByPurchaseOrderId(row.purchaseOrderId, {
        closedBy: user?.name || user?.email || 'warehouse-ops',
        remarks: '由发货管理模块执行结案',
      })
      await loadExportPrepOverview(selectedContainerDetail)
      toast.success('已结案')
    } catch (error: any) {
      toast.error(error?.message || '结案失败')
    } finally {
      setSavingExportPrepId(null)
    }
  }

  async function handleArchiveCase(row: any) {
    if (!canManageExecutionCloseArchive) {
      toast.error('当前角色不能执行业务归档，请由 Warehouse_Ops 或 CEO 处理')
      return
    }
    setSavingExportPrepId(row.purchaseOrderId)
    try {
      await purchaseOrderExecutionStatusService.markArchivedByPurchaseOrderId(row.purchaseOrderId, {
        archivedBy: user?.name || user?.email || 'warehouse-ops',
        remarks: '由发货管理模块执行业务归档完成',
      })
      await loadExportPrepOverview(selectedContainerDetail)
      toast.success('已完成业务归档')
    } catch (error: any) {
      toast.error(error?.message || '业务归档失败')
    } finally {
      setSavingExportPrepId(null)
    }
  }

  function updateTaskDraft(id: string, key: keyof LoadingTaskEditDraft, value: string) {
    setTaskEditRows((rows) => rows.map((row) => (
      row.id === id ? { ...row, [key]: value } : row
    )))
  }

  async function handleSaveTaskExecution(taskId: string) {
    const draft = taskEditRows.find((row) => row.id === taskId)
    if (!draft) return
    setSavingTaskId(taskId)
    try {
      await loadingTaskService.update(taskId, {
        taskStatus: draft.taskStatus,
        containerNo: draft.containerNo.trim(),
        sealNo: draft.sealNo.trim(),
        loadedPackages: Number(draft.loadedPackages || 0),
        loadedQuantity: Number(draft.loadedQuantity || 0),
        loadedWeight: Number(draft.loadedWeight || 0),
        loadedCbm: Number(draft.loadedCbm || 0),
        remarks: draft.remarks.trim(),
      })
      if (selectedContainerDetail?.id) {
        await loadContainerExecutionContext(selectedContainerDetail)
      }
      toast.success('装柜执行任务已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存装柜执行任务失败')
    } finally {
      setSavingTaskId(null)
    }
  }

  function updateTaskItemDraft(solutionItemId: string, key: keyof LoadingTaskItemEditDraft, value: string) {
    setTaskItemEditRows((rows) => rows.map((row) => (
      row.solutionItemId === solutionItemId ? { ...row, [key]: value } : row
    )))
  }

  async function handleSaveTaskItems() {
    if (!actualLoadingTasks.length) return
    const primaryTask = actualLoadingTasks[0]
    setSavingTaskItems(true)
    try {
      await loadingTaskItemService.upsertMany(taskItemEditRows.map((row) => ({
        id: row.id,
        loadingTaskId: primaryTask.id,
        solutionItemId: row.solutionItemId,
        loadedPackages: Number(row.loadedPackages || 0),
        loadedQuantity: Number(row.loadedQuantity || 0),
        remarks: row.remarks.trim(),
      })))
      if (selectedContainerDetail?.id) {
        await loadContainerExecutionContext(selectedContainerDetail)
      }
      toast.success('SKU级执行明细已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存SKU级执行明细失败')
    } finally {
      setSavingTaskItems(false)
    }
  }

  async function handleSyncExecutionBack() {
    if (!selectedContainerDetail?.id) return
    setSyncingExecutionBack(true)
    try {
      const result = await containerLoadingSolutionService.syncContainerActualsFromExecution(selectedContainerDetail.id, 'admin')
      setSelectedContainerDetail((prev: any) => ({ ...(prev || {}), ...result.container }))
      if (selectedPool) {
        const solutions = await containerLoadingSolutionService.getByPoolId(selectedPool.id)
        setSelectedPoolSolutions(Array.isArray(solutions) ? solutions : [])
        const refreshedContainer = (solutions || [])
          .flatMap((solution: any) => solution.containers || [])
          .find((container: any) => container.id === selectedContainerDetail.id)
        if (refreshedContainer) {
          await loadContainerExecutionContext(refreshedContainer)
        }
      }
      toast.success('执行结果已回写到分柜方案对照')
    } catch (error: any) {
      toast.error(error?.message || '执行回写失败')
    } finally {
      setSyncingExecutionBack(false)
    }
  }

  async function handlePrepareExportDocs() {
    if (!selectedContainerDetail) return
    const allCompleted = actualLoadingTasks.length > 0 && actualLoadingTasks.every((task) => ['completed', 'loaded'].includes(String(task.taskStatus || '')))
    if (!allCompleted) {
      toast.error('请先完成当前柜的装柜执行，再进入报关前准备')
      return
    }

    const purchaseOrderIds = Array.from(
      new Set(
        (selectedContainerDetail.items || [])
          .map((item: any) => item.purchaseOrderId)
          .filter(Boolean)
      )
    )

    if (purchaseOrderIds.length === 0) {
      toast.error('当前柜没有关联采购单，无法生成报关前准备骨架')
      return
    }

    setPreparingExportDocs(true)
    try {
      const primaryTask = actualLoadingTasks[0] || null
      for (const purchaseOrderId of purchaseOrderIds) {
        await exportRequirementCheckService.upsertByPurchaseOrderId(purchaseOrderId, {
          checkNo: `ERC-${Date.now()}-${String(purchaseOrderId).slice(0, 8)}`,
          shipmentNo: selectedPool?.shipmentBatchNo || selectedPool?.poolNo || null,
          loadPlanId: primaryTask?.loadPlanId || null,
          destinationCountry: null,
          tradeTerm: selectedPool?.tradeTerm || null,
          customerId: selectedPool?.customerId || selectedPool?.customerName || null,
          requiresCustomsDeclaration: true,
          requiresInspection: false,
          requiresCo: false,
          requiresFumigation: false,
          requiresLoadingInspectionReport: false,
          requiresHealthCertificate: false,
          requiresOtherDocs: false,
          checkedBy: 'warehouse-loading',
          checkedAt: new Date().toISOString(),
          status: 'draft',
        })

        await shipmentDocumentSetService.upsertByPurchaseOrderId(purchaseOrderId, {
          documentSetNo: `DOC-${Date.now()}-${String(purchaseOrderId).slice(0, 8)}`,
          loadPlanId: primaryTask?.loadPlanId || null,
          commercialInvoiceNo: null,
          packingListNo: null,
          ciStatus: 'draft',
          plStatus: 'draft',
          preparedBy: 'warehouse-loading',
          remarks: `由装柜模块从柜 ${selectedContainerDetail.containerIndex} 自动生成报关前单证骨架`,
        })
      }
      await loadExportPrepOverview(selectedContainerDetail)
      toast.success(`已为 ${purchaseOrderIds.length} 个采购单生成报关前准备骨架`)
    } catch (error: any) {
      toast.error(error?.message || '生成报关前准备骨架失败')
    } finally {
      setPreparingExportDocs(false)
    }
  }

  async function handleApplySolutionToExecution(solutionId: string) {
    setExecutionSyncLoading(solutionId)
    try {
      const result = await containerLoadingSolutionService.applySolutionToExecution(solutionId, 'admin')
      if (selectedPool) {
        await openPool(selectedPool)
      }
      if (selectedContainerDetail?.id) {
        const refreshedSolution = await containerLoadingSolutionService.getById(selectedContainerDetail.solutionId)
        const refreshedContainer = (refreshedSolution?.containers || []).find((item: any) => item.id === selectedContainerDetail.id)
        if (refreshedContainer) {
          await loadContainerExecutionContext(refreshedContainer)
        }
      }
      toast.success(`已生成 ${result.generatedPlans.length} 个装柜计划和 ${result.generatedTasks.length} 个装柜任务`)
    } catch (error: any) {
      toast.error(error?.message || '生成执行对象失败')
    } finally {
      setExecutionSyncLoading(null)
    }
  }

  async function handleSaveContainerActuals() {
    if (!selectedContainerDetail || !actualContainerDraft) return
    setSavingActualContainer(true)
    try {
      const updated = await containerLoadingSolutionService.updateContainerActuals(selectedContainerDetail.id, {
        actualContainerNo: actualContainerDraft.actualContainerNo.trim(),
        actualSealNo: actualContainerDraft.actualSealNo.trim(),
        actualWeightKg: Number(actualContainerDraft.actualWeightKg || 0),
        actualCbm: Number(actualContainerDraft.actualCbm || 0),
        actualCartons: Number(actualContainerDraft.actualCartons || 0),
        varianceFlag: actualContainerDraft.varianceFlag,
        varianceReason: actualContainerDraft.varianceReason.trim(),
        manualAdjustmentNotes: actualContainerDraft.manualAdjustmentNotes.trim(),
        planningStatus: actualContainerDraft.actualContainerNo || actualContainerDraft.actualSealNo ? 'executing' : selectedContainerDetail.planningStatus,
      })
      setSelectedContainerDetail((prev: any) => ({ ...(prev || {}), ...updated }))
      if (selectedPool) {
        const solutions = await containerLoadingSolutionService.getByPoolId(selectedPool.id)
        setSelectedPoolSolutions(Array.isArray(solutions) ? solutions : [])
      }
      toast.success('实际装柜对照已保存')
    } catch (error: any) {
      toast.error(error?.message || '保存实际装柜对照失败')
    } finally {
      setSavingActualContainer(false)
    }
  }

  async function handleSaveWarehouse() {
    if (!warehouseForm.warehouseName.trim()) {
      toast.error('请填写仓库名称')
      return
    }
    if (!warehouseForm.warehouseNo.trim()) {
      toast.error('请填写仓库编号')
      return
    }
    setSavingWarehouse(true)
    try {
      await thirdPartyWarehouseService.upsert({
        warehouseNo: warehouseForm.warehouseNo.trim(),
        warehouseName: warehouseForm.warehouseName.trim(),
        warehouseType: warehouseForm.warehouseType,
        contactName: warehouseForm.contactName.trim(),
        contactPhone: warehouseForm.contactPhone.trim(),
        contactEmail: warehouseForm.contactEmail.trim(),
        address: warehouseForm.address.trim(),
        city: warehouseForm.city.trim(),
        province: warehouseForm.province.trim(),
        country: warehouseForm.country.trim() || 'China',
        settlementTerms: warehouseForm.settlementTerms.trim(),
        serviceScope: warehouseForm.serviceScope
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter(Boolean),
        remarks: warehouseForm.remarks.trim(),
      })
      toast.success('第三方仓库已保存')
      setWarehouseDialogOpen(false)
      setWarehouseForm(EMPTY_WAREHOUSE_FORM)
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || '保存第三方仓库失败')
    } finally {
      setSavingWarehouse(false)
    }
  }

  function addPlanItem() {
    setPlanItems((items) => [...items, { ...EMPTY_PLAN_ITEM }])
  }

  function updatePlanItem(index: number, key: keyof ConsolidationItemDraft, value: string) {
    setPlanItems((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
  }

  function removePlanItem(index: number) {
    setPlanItems((items) => (items.length > 1 ? items.filter((_, itemIndex) => itemIndex !== index) : items))
  }

  async function handleSavePlan() {
    const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId)
    const validItems = planItems.filter((item) => item.supplierName.trim() && item.productName.trim())
    if (!selectedWarehouse) {
      toast.error('请先选择集中装柜仓库')
      return
    }
    if (!shipmentNo.trim()) {
      toast.error('请填写出运批次号')
      return
    }
    if (validItems.length === 0) {
      toast.error('请至少填写一条集货计划明细')
      return
    }
    setSavingPlan(true)
    try {
      await consolidationPlanService.createWithItems({
        planNo: `CP-${Date.now()}`,
        shipmentNo: shipmentNo.trim(),
        consolidationPointType: selectedWarehouse.warehouseType || 'third_party_warehouse',
        consolidationPointId: selectedWarehouse.id,
        consolidationPointName: selectedWarehouse.warehouseName,
        consolidationPointAddress: selectedWarehouse.address || '',
        warehouseContactName: selectedWarehouse.contactName || '',
        warehouseContactPhone: selectedWarehouse.contactPhone || '',
        plannedLoadingDate: plannedLoadingDate || null,
        remarks: planRemarks.trim(),
        items: validItems.map((item) => ({
          supplierName: item.supplierName.trim(),
          productName: item.productName.trim(),
          modelNo: item.modelNo.trim(),
          plannedContainerNo: item.plannedContainerNo.trim(),
          plannedContainerSlot: item.plannedContainerSlot.trim(),
          plannedPackages: Number(item.plannedPackages || 0),
          plannedQuantity: Number(item.plannedQuantity || 0),
        })),
      })
      toast.success('集货装柜计划已创建')
      setPlanDialogOpen(false)
      setSelectedWarehouseId('')
      setShipmentNo('')
      setPlannedLoadingDate('')
      setPlanRemarks('')
      setPlanItems([{ ...EMPTY_PLAN_ITEM }])
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || '创建集货装柜计划失败')
    } finally {
      setSavingPlan(false)
    }
  }

  async function openReceiptDialog(plan: any) {
    setActiveReceiptPlan(plan)
    setReceiptTransferOrderId('')
    setReceiptReceivedBy(plan.warehouseContactName || '')
    setReceiptContactPhone(plan.warehouseContactPhone || '')
    setReceiptRemarks('')
    setReceiptItems((plan.items || []).map((item: any) => ({
      consolidationItemId: item.id,
      supplierName: item.supplierName || '',
      productName: item.productName || '',
      expectedPackages: String(item.plannedPackages || 0),
      expectedQuantity: String(item.plannedQuantity || 0),
      receivedPackages: String(item.plannedPackages || 0),
      receivedQuantity: String(item.plannedQuantity || 0),
      damageQty: '0',
      shortageQty: '0',
      remarks: '',
    })))
    try {
      const transfers = await domesticTransferOrderService.getByConsolidationPlanId(plan.id)
      setAvailableTransfers(Array.isArray(transfers) ? transfers : [])
      setReceiptTransferOrderId(transfers?.[0]?.id || '')
    } catch (error: any) {
      setAvailableTransfers([])
      toast.error(error?.message || '加载对应转运单失败')
    }
    setReceiptDialogOpen(true)
  }

  function updateReceiptItem(index: number, key: keyof ReceiptItemDraft, value: string) {
    setReceiptItems((items) => items.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )))
  }

  async function handleSaveReceipt() {
    if (!activeReceiptPlan) {
      toast.error('未找到当前集货计划')
      return
    }
    if (!receiptTransferOrderId) {
      toast.error('请先选择对应的国内转运单')
      return
    }
    setSavingReceipt(true)
    try {
      const expectedPackages = receiptItems.reduce((sum, item) => sum + Number(item.expectedPackages || 0), 0)
      const expectedQuantity = receiptItems.reduce((sum, item) => sum + Number(item.expectedQuantity || 0), 0)
      const receivedPackages = receiptItems.reduce((sum, item) => sum + Number(item.receivedPackages || 0), 0)
      const receivedQuantity = receiptItems.reduce((sum, item) => sum + Number(item.receivedQuantity || 0), 0)
      const varianceFlag = receiptItems.some((item) =>
        Number(item.receivedPackages || 0) !== Number(item.expectedPackages || 0) ||
        Number(item.receivedQuantity || 0) !== Number(item.expectedQuantity || 0) ||
        Number(item.damageQty || 0) > 0 ||
        Number(item.shortageQty || 0) > 0
      )

      await cargoReceiptService.createWithItems({
        receiptNo: `CR-${Date.now()}`,
        transferOrderId: receiptTransferOrderId,
        consolidationPlanId: activeReceiptPlan.id,
        receiptStatus: varianceFlag ? 'received_with_variance' : 'received_match',
        receiverPartyType: activeReceiptPlan.consolidationPointType || 'third_party_warehouse',
        receiverPartyId: activeReceiptPlan.consolidationPointId || null,
        receivedAt: new Date().toISOString(),
        receivedBy: receiptReceivedBy.trim(),
        contactPhone: receiptContactPhone.trim(),
        expectedPackages,
        expectedQuantity,
        receivedPackages,
        receivedQuantity,
        damageFlag: receiptItems.some((item) => Number(item.damageQty || 0) > 0),
        shortageFlag: receiptItems.some((item) => Number(item.shortageQty || 0) > 0),
        overageFlag: receivedPackages > expectedPackages || receivedQuantity > expectedQuantity,
        varianceFlag,
        remarks: receiptRemarks.trim(),
        items: receiptItems.map((item) => ({
          consolidationItemId: item.consolidationItemId,
          productName: item.productName,
          expectedPackages: Number(item.expectedPackages || 0),
          expectedQuantity: Number(item.expectedQuantity || 0),
          receivedPackages: Number(item.receivedPackages || 0),
          receivedQuantity: Number(item.receivedQuantity || 0),
          damageQty: Number(item.damageQty || 0),
          shortageQty: Number(item.shortageQty || 0),
          remarks: item.remarks.trim(),
        })),
      })

      toast.success('仓库到货清点已登记')
      setReceiptDialogOpen(false)
      setActiveReceiptPlan(null)
      setAvailableTransfers([])
      await loadData()
    } catch (error: any) {
      toast.error(error?.message || '保存到货清点失败')
    } finally {
      setSavingReceipt(false)
    }
  }

  const selectedWarehouse = warehouses.find((warehouse) => warehouse.id === selectedWarehouseId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-gray-900">第三方仓与集货装柜计划</h2>
          <p className="text-sm text-gray-500">先建仓库档案，再提前规划哪家供应商哪些货进哪个柜，方便仓库提前分区堆货。</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Building2 className="w-4 h-4 mr-2" />
                新增第三方仓
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>新增第三方仓库</DialogTitle>
                <DialogDescription>建立仓库主数据，供集货计划、接货、装柜与结算复用。</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <Label>仓库编号</Label>
                  <Input value={warehouseForm.warehouseNo} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, warehouseNo: e.target.value }))} />
                </div>
                <div>
                  <Label>仓库名称</Label>
                  <Input value={warehouseForm.warehouseName} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, warehouseName: e.target.value }))} />
                </div>
                <div>
                  <Label>仓库类型</Label>
                  <Select value={warehouseForm.warehouseType} onValueChange={(value) => setWarehouseForm((prev) => ({ ...prev, warehouseType: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="third_party_warehouse">第三方仓</SelectItem>
                      <SelectItem value="supplier_warehouse">供应商仓</SelectItem>
                      <SelectItem value="self_operated_warehouse">自有仓</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>联系人</Label>
                  <Input value={warehouseForm.contactName} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, contactName: e.target.value }))} />
                </div>
                <div>
                  <Label>联系电话</Label>
                  <Input value={warehouseForm.contactPhone} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
                </div>
                <div>
                  <Label>联系邮箱</Label>
                  <Input value={warehouseForm.contactEmail} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>仓库地址</Label>
                  <Input value={warehouseForm.address} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, address: e.target.value }))} />
                </div>
                <div>
                  <Label>城市</Label>
                  <Input value={warehouseForm.city} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, city: e.target.value }))} />
                </div>
                <div>
                  <Label>省份</Label>
                  <Input value={warehouseForm.province} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, province: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>服务范围</Label>
                  <Textarea rows={2} value={warehouseForm.serviceScope} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, serviceScope: e.target.value }))} placeholder="例如：收货、分货、装柜、短驳、临时仓储" />
                </div>
                <div className="col-span-2">
                  <Label>结算条款</Label>
                  <Textarea rows={2} value={warehouseForm.settlementTerms} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, settlementTerms: e.target.value }))} placeholder="例如：按托盘/天、按柜装卸费、按票操作费" />
                </div>
                <div className="col-span-2">
                  <Label>备注</Label>
                  <Textarea rows={2} value={warehouseForm.remarks} onChange={(e) => setWarehouseForm((prev) => ({ ...prev, remarks: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>取消</Button>
                <Button onClick={handleSaveWarehouse} disabled={savingWarehouse}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingWarehouse ? '保存中...' : '保存仓库'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#F96302] hover:bg-[#E55A02]">
                <Plus className="w-4 h-4 mr-2" />
                新建集货计划
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>新建集货装柜计划</DialogTitle>
                <DialogDescription>在供应商发货到仓前，先规划每家哪些货进哪个柜，仓库才能提前分区堆货。</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <Label>出运批次号</Label>
                  <Input value={shipmentNo} onChange={(e) => setShipmentNo(e.target.value)} placeholder="例如：SH-20260321-001" />
                </div>
                <div>
                  <Label>集中装柜仓库</Label>
                  <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                    <SelectTrigger><SelectValue placeholder="选择仓库" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.warehouseName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>计划装柜日期</Label>
                  <Input type="date" value={plannedLoadingDate} onChange={(e) => setPlannedLoadingDate(e.target.value)} />
                </div>
                <div>
                  <Label>仓库联系人</Label>
                  <Input value={selectedWarehouse?.contactName || ''} readOnly />
                </div>
                <div className="col-span-2">
                  <Label>仓库地址</Label>
                  <Input value={selectedWarehouse?.address || ''} readOnly />
                </div>
                <div className="col-span-2">
                  <Label>计划说明</Label>
                  <Textarea rows={2} value={planRemarks} onChange={(e) => setPlanRemarks(e.target.value)} placeholder="补充仓库分区、到货顺序、特殊注意事项" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm text-gray-700">集货明细</h3>
                  <Button variant="outline" size="sm" onClick={addPlanItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    新增明细
                  </Button>
                </div>
                {planItems.map((item, index) => (
                  <Card key={index} className="p-4 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>供应商</Label>
                        <Input value={item.supplierName} onChange={(e) => updatePlanItem(index, 'supplierName', e.target.value)} />
                      </div>
                      <div>
                        <Label>产品名称</Label>
                        <Input value={item.productName} onChange={(e) => updatePlanItem(index, 'productName', e.target.value)} />
                      </div>
                      <div>
                        <Label>型号</Label>
                        <Input value={item.modelNo} onChange={(e) => updatePlanItem(index, 'modelNo', e.target.value)} />
                      </div>
                      <div>
                        <Label>计划入柜号</Label>
                        <Input value={item.plannedContainerNo} onChange={(e) => updatePlanItem(index, 'plannedContainerNo', e.target.value)} placeholder="如 1#柜 / 2#柜" />
                      </div>
                      <div>
                        <Label>仓内分区</Label>
                        <Input value={item.plannedContainerSlot} onChange={(e) => updatePlanItem(index, 'plannedContainerSlot', e.target.value)} placeholder="如 A区 / 靠门区" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>计划件数</Label>
                          <Input value={item.plannedPackages} onChange={(e) => updatePlanItem(index, 'plannedPackages', e.target.value)} />
                        </div>
                        <div>
                          <Label>计划数量</Label>
                          <Input value={item.plannedQuantity} onChange={(e) => updatePlanItem(index, 'plannedQuantity', e.target.value)} />
                        </div>
                      </div>
                    </div>
                    {planItems.length > 1 && (
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => removePlanItem(index)}>删除明细</Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>取消</Button>
                <Button onClick={handleSavePlan} disabled={savingPlan}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingPlan ? '保存中...' : '保存计划'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>仓库到货清点</DialogTitle>
                <DialogDescription>按集货装柜计划登记到货，回写已收件数/数量，并自动判断是否可进入待装柜。</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <Label>当前计划</Label>
                  <Input value={activeReceiptPlan?.planNo || ''} readOnly />
                </div>
                <div>
                  <Label>对应转运单</Label>
                  <Select value={receiptTransferOrderId} onValueChange={setReceiptTransferOrderId}>
                    <SelectTrigger><SelectValue placeholder="选择转运单" /></SelectTrigger>
                    <SelectContent>
                      {availableTransfers.map((transfer) => (
                        <SelectItem key={transfer.id} value={transfer.id}>
                          {transfer.transferNo} {transfer.carrierName ? `· ${transfer.carrierName}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>接收人</Label>
                  <Input value={receiptReceivedBy} onChange={(e) => setReceiptReceivedBy(e.target.value)} />
                </div>
                <div>
                  <Label>联系电话</Label>
                  <Input value={receiptContactPhone} onChange={(e) => setReceiptContactPhone(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>清点备注</Label>
                  <Textarea rows={2} value={receiptRemarks} onChange={(e) => setReceiptRemarks(e.target.value)} placeholder="记录差异、破损、堆货区域等备注" />
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {receiptItems.map((item, index) => (
                  <Card key={item.consolidationItemId || index} className="p-4 space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label>供应商</Label>
                        <Input value={item.supplierName} readOnly />
                      </div>
                      <div>
                        <Label>产品</Label>
                        <Input value={item.productName} readOnly />
                      </div>
                      <div>
                        <Label>应收件数</Label>
                        <Input value={item.expectedPackages} readOnly />
                      </div>
                      <div>
                        <Label>应收数量</Label>
                        <Input value={item.expectedQuantity} readOnly />
                      </div>
                      <div>
                        <Label>实收件数</Label>
                        <Input value={item.receivedPackages} onChange={(e) => updateReceiptItem(index, 'receivedPackages', e.target.value)} />
                      </div>
                      <div>
                        <Label>实收数量</Label>
                        <Input value={item.receivedQuantity} onChange={(e) => updateReceiptItem(index, 'receivedQuantity', e.target.value)} />
                      </div>
                      <div>
                        <Label>破损数</Label>
                        <Input value={item.damageQty} onChange={(e) => updateReceiptItem(index, 'damageQty', e.target.value)} />
                      </div>
                      <div>
                        <Label>短少数</Label>
                        <Input value={item.shortageQty} onChange={(e) => updateReceiptItem(index, 'shortageQty', e.target.value)} />
                      </div>
                      <div className="col-span-4">
                        <Label>备注</Label>
                        <Input value={item.remarks} onChange={(e) => updateReceiptItem(index, 'remarks', e.target.value)} placeholder="如：已堆放A区、外箱轻微破损等" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>取消</Button>
                <Button onClick={handleSaveReceipt} disabled={savingReceipt}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingReceipt ? '保存中...' : '保存清点结果'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>第三方仓总数</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl text-gray-900">{warehouses.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>集货计划</span>
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl text-gray-900">{plans.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>待收货计划</span>
            <CalendarDays className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl text-gray-900">{plans.filter((plan) => plan.status === 'planning').length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>活跃仓库</span>
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl text-gray-900">{warehouses.filter((warehouse) => warehouse.status === 'active').length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">集货/装柜计划</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{warehouseTaskSummary.counts.totalPlans}</div>
          <div className="text-[11px] text-gray-500">当前模块可见计划总数</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">待规划装柜池</div>
          <div className="mt-1 text-lg font-semibold text-amber-700">{warehouseTaskSummary.counts.poolsPendingPlanning}</div>
          <div className="text-[11px] text-gray-500">待补箱规/待生成方案</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">待执行柜</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{warehouseTaskSummary.counts.containersAwaitingExecution}</div>
          <div className="text-[11px] text-gray-500">已分柜但未完成执行回写</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">放单阻断</div>
          <div className="mt-1 text-lg font-semibold text-red-600">{warehouseTaskSummary.counts.releaseBlocked}</div>
          <div className="text-[11px] text-gray-500">财务/收款/LC 条件未满足</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">待结案</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{warehouseTaskSummary.counts.caseClosePending}</div>
          <div className="text-[11px] text-gray-500">已出运但未结案</div>
        </Card>
        <Card className="p-3">
          <div className="text-[11px] text-gray-500">待归档</div>
          <div className="mt-1 text-lg font-semibold text-gray-900">{warehouseTaskSummary.counts.archivePending}</div>
          <div className="text-[11px] text-gray-500">已结案但未归档</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">仓配风险摘要</div>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs text-amber-700">规划/执行风险</div>
              <div className="mt-1 text-xl font-semibold text-amber-900">{warehouseTaskSummary.riskSummary.planningRisk}</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <div className="text-xs text-red-700">放单阻断</div>
              <div className="mt-1 text-xl font-semibold text-red-900">{warehouseTaskSummary.riskSummary.releaseBlocked}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-700">待结案</div>
              <div className="mt-1 text-xl font-semibold text-slate-900">{warehouseTaskSummary.riskSummary.pendingClosure}</div>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="text-xs text-purple-700">待归档</div>
              <div className="mt-1 text-xl font-semibold text-purple-900">{warehouseTaskSummary.riskSummary.pendingArchive}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">协同角色入口</div>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="space-y-2">
            {collaborationSections.map((section) => (
              <div key={section.key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{section.label}</div>
                    <div className="mt-0.5 text-xs text-slate-600">{section.roles.join(' / ')}</div>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 border border-slate-200">
                    {section.count}
                  </div>
                </div>
              </div>
            ))}
            {collaborationSections.length === 0 && (
              <div className="text-xs text-gray-500">暂无待协同事项</div>
            )}
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="warehouses">第三方仓档案</TabsTrigger>
          <TabsTrigger value="plans">集货装柜计划</TabsTrigger>
          <TabsTrigger value="loading-pools">待装柜池 / 分柜规划</TabsTrigger>
        </TabsList>

        <TabsContent value="warehouses" className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={warehouseSearch} onChange={(e) => setWarehouseSearch(e.target.value)} className="pl-9" placeholder="搜索仓库编号、名称、联系人、电话" />
            </div>
          </Card>
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>仓库编号</TableHead>
                  <TableHead>仓库名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>地址</TableHead>
                  <TableHead>结算条款</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.warehouseNo}</TableCell>
                    <TableCell>{warehouse.warehouseName}</TableCell>
                    <TableCell>{warehouse.contactName || '-'}</TableCell>
                    <TableCell>{warehouse.contactPhone || warehouse.contactEmail || '-'}</TableCell>
                    <TableCell>{warehouse.address || '-'}</TableCell>
                    <TableCell className="max-w-[260px] truncate">{warehouse.settlementTerms || '-'}</TableCell>
                  </TableRow>
                ))}
                {!loading && filteredWarehouses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">暂无第三方仓库数据</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} className="pl-9" placeholder="搜索计划号、出运批次号、集中仓名称" />
            </div>
          </Card>
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-gray-900">{plan.planNo}</div>
                    <div className="text-sm text-gray-500">出运批次：{plan.shipmentNo || '-'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">{plan.status || 'planning'}</div>
                    <Button variant="outline" size="sm" onClick={() => openReceiptDialog(plan)}>
                      登记到货
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-500">集中点</div>
                      <div className="text-gray-900">{plan.consolidationPointName || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-500">仓库联系人</div>
                      <div className="text-gray-900">{plan.warehouseContactName || '-'}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-gray-500">联系电话</div>
                      <div className="text-gray-900">{plan.warehouseContactPhone || '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm text-gray-500 mb-2">计划明细</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>供应商</TableHead>
                        <TableHead>产品</TableHead>
                        <TableHead>型号</TableHead>
                        <TableHead>计划入柜</TableHead>
                        <TableHead>仓内分区</TableHead>
                        <TableHead>计划件数/数量</TableHead>
                        <TableHead>已收件数/数量</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(plan.items || []).map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.supplierName || '-'}</TableCell>
                          <TableCell>{item.productName || '-'}</TableCell>
                          <TableCell>{item.modelNo || '-'}</TableCell>
                          <TableCell>{item.plannedContainerNo || '-'}</TableCell>
                          <TableCell>{item.plannedContainerSlot || '-'}</TableCell>
                          <TableCell>{item.plannedPackages || 0} / {item.plannedQuantity || 0}</TableCell>
                          <TableCell>{item.receivedPackages || 0} / {item.receivedQuantity || 0}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            ))}
            {!loading && filteredPlans.length === 0 && (
              <Card className="p-8 text-center text-gray-500">暂无集货装柜计划</Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="loading-pools" className="space-y-4">
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={poolSearch} onChange={(e) => setPoolSearch(e.target.value)} className="pl-9" placeholder="搜索待装柜池编号、名称、出运批次" />
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.4fr] gap-4">
            <div className="space-y-4">
              {filteredPools.map((pool) => (
                <Card key={pool.id} className={`p-4 space-y-3 ${selectedPool?.id === pool.id ? 'ring-2 ring-[#F96302]' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-gray-900">{pool.poolNo}</div>
                      <div className="text-sm text-gray-500">{pool.poolName}</div>
                    </div>
                    <div className="text-xs text-gray-500">{pool.poolStatus || 'draft'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">出运批次</div>
                      <div className="text-gray-900">{pool.shipmentBatchNo || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">总箱数 / CBM</div>
                      <div className="text-gray-900">{pool.totalCartons || 0} / {pool.totalCbm || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">供应商数</div>
                      <div className="text-gray-900">{pool.totalSuppliers || 0}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">总重量</div>
                      <div className="text-gray-900">{pool.totalWeightKg || 0} KG</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPool(pool)}>
                      <Boxes className="w-4 h-4 mr-1" />
                      查看池
                    </Button>
                  </div>
                </Card>
              ))}

              <Card className="p-4 space-y-3">
                <div className="text-sm text-gray-700">从集货计划生成待装柜池</div>
                <div className="text-xs text-gray-500">先把已接货或可接货的集货计划转成待装柜池，再补箱规/重量后运行系统分柜。</div>
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {plans.map((plan) => (
                    <div key={plan.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                      <div>
                        <div className="text-sm text-gray-900">{plan.planNo}</div>
                        <div className="text-xs text-gray-500">{plan.shipmentNo || '-'} · {plan.consolidationPointName || '-'}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreatePoolFromPlan(plan)}
                        disabled={creatingPoolId === plan.id}
                      >
                        <Ship className="w-4 h-4 mr-1" />
                        {creatingPoolId === plan.id ? '生成中...' : '生成待装柜池'}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <Card className="p-4 space-y-4">
              {!selectedPool ? (
                <div className="py-16 text-center text-gray-500">
                  请选择一个待装柜池，继续补箱规/重量并运行分柜规划。
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg text-gray-900">{selectedPool.poolNo}</div>
                      <div className="text-sm text-gray-500">{selectedPool.poolName}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleSavePoolItems} disabled={savingPoolItems}>
                        <Save className="w-4 h-4 mr-2" />
                        {savingPoolItems ? '保存中...' : '保存货源参数'}
                      </Button>
                      <Button className="bg-[#F96302] hover:bg-[#E55A02]" onClick={handleRunPlanning} disabled={planningPool}>
                        <Calculator className="w-4 h-4 mr-2" />
                        {planningPool ? '计算中...' : '系统推荐分柜'}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-sm text-gray-500 mb-2">池内货源</div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>供应商</TableHead>
                          <TableHead>产品</TableHead>
                          <TableHead>箱数</TableHead>
                          <TableHead>数量</TableHead>
                          <TableHead>外箱尺寸(cm)</TableHead>
                          <TableHead>单箱毛重</TableHead>
                          <TableHead>类别</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPoolItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.supplierName || '-'}</TableCell>
                            <TableCell>{item.productName || '-'}</TableCell>
                            <TableCell>
                              <Input value={item.cartonCount} onChange={(e) => updatePoolItem(index, 'cartonCount', e.target.value)} className="h-8 min-w-[90px]" />
                            </TableCell>
                            <TableCell>
                              <Input value={item.quantity} onChange={(e) => updatePoolItem(index, 'quantity', e.target.value)} className="h-8 min-w-[90px]" />
                            </TableCell>
                            <TableCell>
                              <div className="grid grid-cols-3 gap-1">
                                <Input value={item.cartonLengthCm} onChange={(e) => updatePoolItem(index, 'cartonLengthCm', e.target.value)} className="h-8 min-w-[64px]" />
                                <Input value={item.cartonWidthCm} onChange={(e) => updatePoolItem(index, 'cartonWidthCm', e.target.value)} className="h-8 min-w-[64px]" />
                                <Input value={item.cartonHeightCm} onChange={(e) => updatePoolItem(index, 'cartonHeightCm', e.target.value)} className="h-8 min-w-[64px]" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input value={item.cartonGrossWeightKg} onChange={(e) => updatePoolItem(index, 'cartonGrossWeightKg', e.target.value)} className="h-8 min-w-[90px]" />
                            </TableCell>
                            <TableCell>
                              <Select value={item.cargoCategory} onValueChange={(value) => updatePoolItem(index, 'cargoCategory', value)}>
                                <SelectTrigger className="h-8 min-w-[100px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="heavy">重货</SelectItem>
                                  <SelectItem value="normal">普货</SelectItem>
                                  <SelectItem value="light">抛货</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                        {selectedPoolItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">当前待装柜池暂无货源明细</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-sm text-gray-500 mb-2">分柜方案</div>
                    {selectedPoolSolutions.length === 0 ? (
                      <div className="text-sm text-gray-500 py-6 text-center">尚未生成分柜方案</div>
                    ) : (
                      <div className="space-y-3">
                        {selectedPoolSolutions.map((solution) => (
                          <Card key={solution.id} className="p-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-gray-900">{solution.solutionNo}</div>
                                <div className="text-xs text-gray-500">
                                  {solution.planningMode} · {solution.solutionStatus} · {solution.containerCount || 0} 柜
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-gray-500">
                                  推荐柜型：{solution.estimationSummary?.recommendedContainerType || '-'}
                                </div>
                                <div className="flex gap-2 mt-2 justify-end">
                                  {!solution.isBaseline && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSetBaseline(solution.id)}
                                      disabled={solutionActionLoading === solution.id}
                                    >
                                      {solutionActionLoading === solution.id ? '处理中...' : '设为基线'}
                                    </Button>
                                  )}
                                  {solution.solutionStatus !== 'confirmed' && (
                                    <Button
                                      size="sm"
                                      className="bg-[#F96302] hover:bg-[#E55A02]"
                                      onClick={() => handleConfirmSolution(solution.id)}
                                      disabled={solutionActionLoading === solution.id}
                                    >
                                      {solutionActionLoading === solution.id ? '处理中...' : '确认方案'}
                                    </Button>
                                  )}
                                  {solution.solutionStatus === 'confirmed' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApplySolutionToExecution(solution.id)}
                                      disabled={executionSyncLoading === solution.id}
                                    >
                                      {executionSyncLoading === solution.id ? '生成中...' : '生成执行对象'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {solution.isBaseline && (
                                <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-1">Baseline</span>
                              )}
                              {solution.solutionStatus === 'confirmed' && (
                                <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-1">可下推执行</span>
                              )}
                              <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-1">
                                平均重量利用率 {((Number(solution.utilizationSummary?.averageWeightUtilization || 0)) * 100).toFixed(1)}%
                              </span>
                              <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-1">
                                平均体积利用率 {((Number(solution.utilizationSummary?.averageVolumeUtilization || 0)) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(solution.containers || []).map((container: any) => (
                                <button
                                  key={container.id}
                                  type="button"
                                  onClick={async () => {
                                    await loadContainerExecutionContext(container)
                                  }}
                                  className={`rounded-lg border p-3 text-left transition ${
                                    selectedContainerDetail?.id === container.id
                                      ? 'border-[#F96302] ring-1 ring-[#F96302]'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="text-sm text-gray-900">第 {container.containerIndex} 柜 · {container.containerTypeCode}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    门向 {container.doorSide === 'rear' ? '尾门' : '前门'} · 计划重量 {container.plannedWeightKg || 0} KG · 计划体积 {container.plannedCbm || 0} CBM
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    重量利用率 {(Number(container.weightUtilization || 0) * 100).toFixed(1)}% · 体积利用率 {(Number(container.volumeUtilization || 0) * 100).toFixed(1)}%
                                  </div>
                                  <div className="mt-2 text-xs text-gray-600">
                                    {(container.items || []).map((item: any) => item.productName).join(' / ') || '暂无分配明细'}
                                  </div>
                                  <div className="mt-2">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleGeneratePlacement(container)
                                      }}
                                      disabled={placementActionLoading === container.id}
                                    >
                                      {placementActionLoading === container.id ? '生成中...' : '生成装载预案'}
                                    </Button>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="text-sm text-gray-500 mb-2">单柜详情</div>
                    {!selectedContainerDetail ? (
                      <div className="text-sm text-gray-500 py-6 text-center">请选择一个柜查看单柜详情</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-gray-500">柜号序位</div>
                            <div className="text-gray-900">第 {selectedContainerDetail.containerIndex} 柜</div>
                          </div>
                          <div>
                            <div className="text-gray-500">柜型</div>
                            <div className="text-gray-900">{selectedContainerDetail.containerTypeCode || '-'}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">门向</div>
                            <div className="text-gray-900">{selectedContainerDetail.doorSide === 'rear' ? '尾门' : '前门'}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">近门货数</div>
                            <div className="text-gray-900">{selectedContainerDetail.nearDoorItemCount || 0}</div>
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">计划 vs 实际</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={handlePrepareExportDocs} disabled={preparingExportDocs}>
                                {preparingExportDocs ? '生成中...' : '生成报关前准备'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleSyncExecutionBack} disabled={syncingExecutionBack}>
                                {syncingExecutionBack ? '回写中...' : '从执行回写'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleSaveContainerActuals} disabled={savingActualContainer}>
                                {savingActualContainer ? '保存中...' : '保存实际对照'}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div className="rounded-lg bg-slate-50 p-2">
                              <div className="text-gray-500">计划柜号</div>
                              <div className="text-gray-900">{selectedContainerDetail.plannedContainerNo || `第 ${selectedContainerDetail.containerIndex} 柜`}</div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2">
                              <div className="text-gray-500">计划重量</div>
                              <div className="text-gray-900">{selectedContainerDetail.plannedWeightKg || 0} KG</div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2">
                              <div className="text-gray-500">计划CBM</div>
                              <div className="text-gray-900">{selectedContainerDetail.plannedCbm || 0}</div>
                            </div>
                            <div className="rounded-lg bg-slate-50 p-2">
                              <div className="text-gray-500">计划箱数</div>
                              <div className="text-gray-900">{selectedContainerDetail.plannedCartons || 0}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <Label>实际柜号</Label>
                              <Input
                                value={actualContainerDraft?.actualContainerNo || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, actualContainerNo: e.target.value } : prev)}
                              />
                            </div>
                            <div>
                              <Label>实际封签号</Label>
                              <Input
                                value={actualContainerDraft?.actualSealNo || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, actualSealNo: e.target.value } : prev)}
                              />
                            </div>
                            <div>
                              <Label>实际重量</Label>
                              <Input
                                value={actualContainerDraft?.actualWeightKg || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, actualWeightKg: e.target.value } : prev)}
                              />
                            </div>
                            <div>
                              <Label>实际CBM</Label>
                              <Input
                                value={actualContainerDraft?.actualCbm || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, actualCbm: e.target.value } : prev)}
                              />
                            </div>
                            <div>
                              <Label>实际箱数</Label>
                              <Input
                                value={actualContainerDraft?.actualCartons || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, actualCartons: e.target.value } : prev)}
                              />
                            </div>
                            <div>
                              <Label>是否有差异</Label>
                              <Select
                                value={actualContainerDraft?.varianceFlag ? 'yes' : 'no'}
                                onValueChange={(value) => setActualContainerDraft((prev) => prev ? { ...prev, varianceFlag: value === 'yes' } : prev)}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no">否</SelectItem>
                                  <SelectItem value="yes">是</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-2">
                              <Label>差异原因</Label>
                              <Input
                                value={actualContainerDraft?.varianceReason || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, varianceReason: e.target.value } : prev)}
                                placeholder="例如：现场改柜、重量重算、部分货临时换柜"
                              />
                            </div>
                            <div className="col-span-2 md:col-span-4">
                              <Label>现场调整说明</Label>
                              <Textarea
                                rows={2}
                                value={actualContainerDraft?.manualAdjustmentNotes || ''}
                                onChange={(e) => setActualContainerDraft((prev) => prev ? { ...prev, manualAdjustmentNotes: e.target.value } : prev)}
                                placeholder="记录现场装柜时与计划不一致的原因和处理动作"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="text-gray-500 mb-1">重量风险</div>
                            <div className="text-gray-900">{selectedContainerDetail.weightRisk?.level || 'info'}</div>
                            <div className="text-gray-500 mt-1">{selectedContainerDetail.weightRisk?.reason || '无'}</div>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="text-gray-500 mb-1">体积风险</div>
                            <div className="text-gray-900">{selectedContainerDetail.volumeRisk?.level || 'info'}</div>
                            <div className="text-gray-500 mt-1">{selectedContainerDetail.volumeRisk?.reason || '无'}</div>
                          </div>
                          <div className="rounded-lg border border-gray-200 p-3">
                            <div className="text-gray-500 mb-1">取货阻挡风险</div>
                            <div className="text-gray-900">{selectedContainerDetail.blockedAccessRisk?.level || 'info'}</div>
                            <div className="text-gray-500 mt-1">{selectedContainerDetail.blockedAccessRisk?.reason || '无'}</div>
                          </div>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>序号</TableHead>
                              <TableHead>供应商</TableHead>
                              <TableHead>产品</TableHead>
                              <TableHead>计划箱数</TableHead>
                              <TableHead>计划重量</TableHead>
                              <TableHead>计划CBM</TableHead>
                              <TableHead>靠门</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedContainerDetail.items || []).map((item: any) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.itemSeq || item.lineNo || '-'}</TableCell>
                                <TableCell>{item.supplierName || '-'}</TableCell>
                                <TableCell>{item.productName || '-'}</TableCell>
                                <TableCell>{item.plannedCartonCount || 0}</TableCell>
                                <TableCell>{item.plannedWeightKg || 0}</TableCell>
                                <TableCell>{item.plannedCbm || 0}</TableCell>
                                <TableCell>{item.nearDoorFlag ? '是' : '否'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="rounded-lg border border-dashed border-gray-200 p-3 text-xs text-gray-500">
                          装载顺序视角：{(selectedContainerDetail.plannedLoadingSequenceSummary || []).map((step: any) => step.productName).join(' → ') || '暂无'}
                        </div>
                        <div className="rounded-lg border border-dashed border-gray-200 p-3">
                          <div className="text-xs text-gray-500 mb-2">已有装柜执行摘要</div>
                          {actualLoadingTasks.length === 0 ? (
                            <div className="text-xs text-gray-500">当前未关联到实际 loading task</div>
                          ) : (
                            <div className="space-y-3">
                              {taskEditRows.slice(0, 6).map((task) => (
                                <div key={task.id} className="rounded-lg border border-gray-200 p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-900">{task.loadingTaskNo || '-'}</div>
                                    <Button size="sm" variant="outline" onClick={() => handleSaveTaskExecution(task.id)} disabled={savingTaskId === task.id}>
                                      {savingTaskId === task.id ? '保存中...' : '保存任务执行'}
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                      <Label>装柜点</Label>
                                      <Input value={task.loadingPointName} disabled />
                                    </div>
                                    <div>
                                      <Label>任务状态</Label>
                                      <Select value={task.taskStatus} onValueChange={(value) => updateTaskDraft(task.id, 'taskStatus', value)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="planned">planned</SelectItem>
                                          <SelectItem value="truck_dispatched">truck_dispatched</SelectItem>
                                          <SelectItem value="arrived">arrived</SelectItem>
                                          <SelectItem value="loading">loading</SelectItem>
                                          <SelectItem value="loaded">loaded</SelectItem>
                                          <SelectItem value="completed">completed</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label>实际柜号</Label>
                                      <Input value={task.containerNo} onChange={(e) => updateTaskDraft(task.id, 'containerNo', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>实际封签</Label>
                                      <Input value={task.sealNo} onChange={(e) => updateTaskDraft(task.id, 'sealNo', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>实装件数</Label>
                                      <Input value={task.loadedPackages} onChange={(e) => updateTaskDraft(task.id, 'loadedPackages', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>实装数量</Label>
                                      <Input value={task.loadedQuantity} onChange={(e) => updateTaskDraft(task.id, 'loadedQuantity', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>实装重量</Label>
                                      <Input value={task.loadedWeight} onChange={(e) => updateTaskDraft(task.id, 'loadedWeight', e.target.value)} />
                                    </div>
                                    <div>
                                      <Label>实装CBM</Label>
                                      <Input value={task.loadedCbm} onChange={(e) => updateTaskDraft(task.id, 'loadedCbm', e.target.value)} />
                                    </div>
                                    <div className="col-span-2 md:col-span-4">
                                      <Label>执行备注</Label>
                                      <Input value={task.remarks} onChange={(e) => updateTaskDraft(task.id, 'remarks', e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg border border-dashed border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">报关前准备概览</div>
                            <Button size="sm" variant="outline" onClick={() => loadExportPrepOverview(selectedContainerDetail)} disabled={loadingExportPrep}>
                              {loadingExportPrep ? '刷新中...' : '刷新概览'}
                            </Button>
                          </div>
                          {exportPrepRows.length === 0 ? (
                            <div className="text-xs text-gray-500">当前柜尚未生成报关前准备骨架，或暂无关联采购单</div>
                          ) : (
                            <div className="space-y-3">

                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>供应商</TableHead>
                                    <TableHead>产品</TableHead>
                                    <TableHead>出口要求</TableHead>
                                    <TableHead>CI/PL</TableHead>
                                    <TableHead>报关状态</TableHead>
                                    <TableHead>BL / 放单 / 到港 / 清关 / 收货</TableHead>
                                    <TableHead>回执摘要</TableHead>
                                    <TableHead>结案 / 归档</TableHead>
                                    <TableHead>操作</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {exportPrepRows.map((row) => (
                                    <TableRow key={row.purchaseOrderId}>
                                    <TableCell>{row.supplierName || '-'}</TableCell>
                                    <TableCell>{(row.products || []).join(' / ') || '-'}</TableCell>
                                    <TableCell>
                                      <div className="space-y-2 text-xs">
                                        <div className="text-gray-700">{row.exportCheckStatus}</div>
                                        <div className="flex flex-wrap gap-3">
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.requiresInspection)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'requiresInspection', Boolean(checked))} />
                                            <span>商检</span>
                                          </label>
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.requiresCo)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'requiresCo', Boolean(checked))} />
                                            <span>CO</span>
                                          </label>
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.requiresFumigation)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'requiresFumigation', Boolean(checked))} />
                                            <span>熏蒸</span>
                                          </label>
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.requiresCustomsDeclaration)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'requiresCustomsDeclaration', Boolean(checked))} />
                                            <span>需报关</span>
                                          </label>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-2 text-xs">
                                        <div className="text-gray-700">{row.documentSetStatus}</div>
                                        <div className="grid grid-cols-1 gap-2">
                                          <Input value={row.ciNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'ciNo', e.target.value)} placeholder="CI 单号" className="h-8" />
                                          <Input value={row.plNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'plNo', e.target.value)} placeholder="PL 单号" className="h-8" />
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-2 text-xs">
                                        <Select value={row.customsStatus || 'missing'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'customsStatus', value)}>
                                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="missing">missing</SelectItem>
                                            <SelectItem value="draft">draft</SelectItem>
                                            <SelectItem value="submitted">submitted</SelectItem>
                                            <SelectItem value="under_review">under_review</SelectItem>
                                            <SelectItem value="released">released</SelectItem>
                                            <SelectItem value="hold">hold</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input value={row.brokerName || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'brokerName', e.target.value)} placeholder="报关行" className="h-8" />
                                        <Input value={row.customsDeclNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'customsDeclNo', e.target.value)} placeholder="报关单号" className="h-8" />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-2 text-xs">
                                        <Input value={row.blNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'blNo', e.target.value)} placeholder="BL / 提单号" className="h-8" />
                                        <Input value={row.carrierName || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'carrierName', e.target.value)} placeholder="船公司 / 货代" className="h-8" />
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input value={row.vesselName || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'vesselName', e.target.value)} placeholder="船名" className="h-8" />
                                          <Input value={row.voyageNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'voyageNo', e.target.value)} placeholder="航次" className="h-8" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input type="date" value={row.etd || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'etd', e.target.value)} className="h-8" />
                                          <Input type="date" value={row.eta || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'eta', e.target.value)} className="h-8" />
                                        </div>
                                        <Select value={row.voyageStatus || 'departed'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'voyageStatus', value)}>
                                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="departed">departed</SelectItem>
                                            <SelectItem value="in_transit">in_transit</SelectItem>
                                            <SelectItem value="transshipment">transshipment</SelectItem>
                                            <SelectItem value="arrived_at_port">arrived_at_port</SelectItem>
                                            <SelectItem value="delayed">delayed</SelectItem>
                                            <SelectItem value="exception">exception</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input value={row.currentLocation || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'currentLocation', e.target.value)} placeholder="当前节点 / 地点" className="h-8" />
                                        <Select value={row.bankSubmissionStatus || 'not_required'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'bankSubmissionStatus', value)}>
                                          <SelectTrigger className="h-8" disabled={!canEditFinancialReleaseFields}><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="not_required">not_required</SelectItem>
                                            <SelectItem value="pending_submission">pending_submission</SelectItem>
                                            <SelectItem value="submitted_to_bank">submitted_to_bank</SelectItem>
                                            <SelectItem value="negotiated">negotiated</SelectItem>
                                            <SelectItem value="collected">collected</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select value={row.documentReleaseStatus || 'pending'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'documentReleaseStatus', value)}>
                                          <SelectTrigger className="h-8" disabled={!canEditFinancialReleaseFields}><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">pending</SelectItem>
                                            <SelectItem value="blocked">blocked</SelectItem>
                                            <SelectItem value="ready_to_release">ready_to_release</SelectItem>
                                            <SelectItem value="released">released</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="rounded border border-dashed border-gray-200 bg-gray-50 px-2 py-2 text-[11px] text-gray-600">
                                          <div>交单时间：{row.bankSubmittedAt || '-'}</div>
                                          <div>交单操作者：{row.bankSubmittedBy || '-'}</div>
                                          <div>放单时间：{row.documentReleasedAt || '-'}</div>
                                          <div>放单操作者：{row.documentReleasedBy || '-'}</div>
                                          {!canEditFinancialReleaseFields && (
                                            <div className="mt-1 text-amber-700">银行交单与放单状态仅允许 Finance / CFO / CEO 维护，仓配侧只读。</div>
                                          )}
                                        </div>
                                        <Input value={row.arrivalNoticeNo || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'arrivalNoticeNo', e.target.value)} placeholder="Arrival Notice No." className="h-8" />
                                        <Input value={row.arrivalPort || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'arrivalPort', e.target.value)} placeholder="到港港口" className="h-8" />
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input type="date" value={row.arrivalAt || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'arrivalAt', e.target.value)} className="h-8" />
                                          <Input type="datetime-local" value={row.sentToCustomerAt || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'sentToCustomerAt', e.target.value)} className="h-8" />
                                        </div>
                                        <Select value={row.arrivalNoticeStatus || 'draft'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'arrivalNoticeStatus', value)}>
                                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="draft">draft</SelectItem>
                                            <SelectItem value="ready">ready</SelectItem>
                                            <SelectItem value="sent">sent</SelectItem>
                                            <SelectItem value="acknowledged">acknowledged</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select value={row.clearanceStatus || 'not_started'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'clearanceStatus', value)}>
                                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="not_started">not_started</SelectItem>
                                            <SelectItem value="documents_sent">documents_sent</SelectItem>
                                            <SelectItem value="under_clearance">under_clearance</SelectItem>
                                            <SelectItem value="hold">hold</SelectItem>
                                            <SelectItem value="released">released</SelectItem>
                                            <SelectItem value="delivered_to_customer">delivered_to_customer</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input value={row.importBrokerName || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'importBrokerName', e.target.value)} placeholder="进口报关行" className="h-8" />
                                          <Input value={row.importBrokerContact || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'importBrokerContact', e.target.value)} placeholder="报关行联系人" className="h-8" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input type="datetime-local" value={row.customsReleaseAt || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'customsReleaseAt', e.target.value)} className="h-8" />
                                          <Select value={row.docStatus || 'pending'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'docStatus', value)}>
                                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">pending</SelectItem>
                                              <SelectItem value="sent">sent</SelectItem>
                                              <SelectItem value="received">received</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <label className="flex items-center gap-2">
                                          <Checkbox checked={Boolean(row.deliveryOrderReceived)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'deliveryOrderReceived', Boolean(checked))} />
                                          <span>已收到 Delivery Order</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input type="datetime-local" value={row.deliveredAt || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'deliveredAt', e.target.value)} className="h-8" />
                                          <Input value={row.receivedBy || ''} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'receivedBy', e.target.value)} placeholder="收货人" className="h-8" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <Input value={String(row.receivedQuantity || '')} onChange={(e) => updateExportPrepRow(row.purchaseOrderId, 'receivedQuantity', e.target.value)} placeholder="实收数量" className="h-8" />
                                          <Select value={row.deliveryStatus || 'pending'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'deliveryStatus', value)}>
                                            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="pending">pending</SelectItem>
                                              <SelectItem value="received_ok">received_ok</SelectItem>
                                              <SelectItem value="received_with_issue">received_with_issue</SelectItem>
                                              <SelectItem value="claim_open">claim_open</SelectItem>
                                              <SelectItem value="closed">closed</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.damageFlag)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'damageFlag', Boolean(checked))} />
                                            <span>破损</span>
                                          </label>
                                          <label className="flex items-center gap-2">
                                            <Checkbox checked={Boolean(row.shortageFlag)} onCheckedChange={(checked) => updateExportPrepRow(row.purchaseOrderId, 'shortageFlag', Boolean(checked))} />
                                            <span>短少</span>
                                          </label>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>{renderWorkflowReplySummary(row)}</TableCell>
                                    <TableCell>
                                      <div className="space-y-2 text-xs">
                                        <Select value={row.caseCloseStatus || 'pending'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'caseCloseStatus', value)}>
                                          <SelectTrigger className="h-8" disabled><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">pending</SelectItem>
                                            <SelectItem value="in_progress">in_progress</SelectItem>
                                            <SelectItem value="closed">closed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Select value={row.archiveStatus || 'pending'} onValueChange={(value) => updateExportPrepRow(row.purchaseOrderId, 'archiveStatus', value)}>
                                          <SelectTrigger className="h-8" disabled><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">pending</SelectItem>
                                            <SelectItem value="ready">ready</SelectItem>
                                            <SelectItem value="archived">archived</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <div className="text-[11px] text-gray-500">
                                          {row.caseClosedAt ? `结案: ${row.caseClosedAt}` : '结案: -'}
                                        </div>
                                        <div className="text-[11px] text-gray-500">
                                          {row.archivedAt ? `归档: ${row.archivedAt}` : '归档: -'}
                                        </div>
                                        <div className="text-[11px] text-amber-700">
                                          结案/归档状态不可直接手改，请使用下方动作按钮。
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-col gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleSaveExportPrepRow(row)} disabled={savingExportPrepId === row.purchaseOrderId}>
                                          {savingExportPrepId === row.purchaseOrderId ? '保存中...' : '保存'}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleCloseCase(row)} disabled={!canManageExecutionCloseArchive || savingExportPrepId === row.purchaseOrderId || row.caseCloseStatus === 'closed'}>
                                          结案
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleArchiveCase(row)} disabled={!canManageExecutionCloseArchive || savingExportPrepId === row.purchaseOrderId || row.archiveStatus === 'archived' || row.caseCloseStatus !== 'closed'}>
                                          业务归档
                                        </Button>
                                        {!canManageExecutionCloseArchive && (
                                          <div className="text-[11px] text-amber-700">仅 Warehouse_Ops / CEO 可执行结案与业务归档。</div>
                                        )}
                                      </div>
                                    </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                        <div className="rounded-lg border border-dashed border-gray-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-gray-500">SKU级执行明细</div>
                            <Button size="sm" variant="outline" onClick={handleSaveTaskItems} disabled={savingTaskItems || actualLoadingTasks.length === 0}>
                              {savingTaskItems ? '保存中...' : '保存SKU执行明细'}
                            </Button>
                          </div>
                          {taskItemEditRows.length === 0 ? (
                            <div className="text-xs text-gray-500">当前没有可编辑的SKU级执行明细</div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>供应商</TableHead>
                                  <TableHead>产品</TableHead>
                                  <TableHead>计划箱数</TableHead>
                                  <TableHead>计划数量</TableHead>
                                  <TableHead>实际箱数</TableHead>
                                  <TableHead>实际数量</TableHead>
                                  <TableHead>备注</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {taskItemEditRows.map((row) => (
                                  <TableRow key={row.solutionItemId}>
                                    <TableCell>{row.supplierName || '-'}</TableCell>
                                    <TableCell>{row.productName || '-'}</TableCell>
                                    <TableCell>{row.plannedCartons}</TableCell>
                                    <TableCell>{row.plannedQuantity}</TableCell>
                                    <TableCell>
                                      <Input value={row.loadedPackages} onChange={(e) => updateTaskItemDraft(row.solutionItemId, 'loadedPackages', e.target.value)} className="h-8 min-w-[90px]" />
                                    </TableCell>
                                    <TableCell>
                                      <Input value={row.loadedQuantity} onChange={(e) => updateTaskItemDraft(row.solutionItemId, 'loadedQuantity', e.target.value)} className="h-8 min-w-[90px]" />
                                    </TableCell>
                                    <TableCell>
                                      <Input value={row.remarks} onChange={(e) => updateTaskItemDraft(row.solutionItemId, 'remarks', e.target.value)} className="h-8 min-w-[140px]" />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                        <div className="rounded-lg border border-dashed border-gray-200 p-3">
                          <div className="text-xs text-gray-500 mb-2">装载预案（2.5D 前置数据）</div>
                          {containerPlacements.length === 0 ? (
                            <div className="text-xs text-gray-500">尚未生成 placement 预案</div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                                <div>总 placement：{containerPlacements.length}</div>
                                <div>靠门货：{containerPlacements.filter((item) => item.nearDoorFlag).length}</div>
                                <div>层数：{Array.from(new Set(containerPlacements.map((item) => item.layerIndex))).length}</div>
                                <div>首件坐标：{containerPlacements[0] ? `${containerPlacements[0].xCm}, ${containerPlacements[0].yCm}, ${containerPlacements[0].zCm}` : '-'}</div>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>装载顺序</TableHead>
                                    <TableHead>箱体编号</TableHead>
                                    <TableHead>坐标</TableHead>
                                    <TableHead>层</TableHead>
                                    <TableHead>靠门</TableHead>
                                    <TableHead>朝门</TableHead>
                                    <TableHead>卸货顺序</TableHead>
                                    <TableHead>调整原因</TableHead>
                                    <TableHead>操作</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {containerPlacements.slice(0, 12).map((placement) => {
                                    const draft = placementEditRows.find((row) => row.id === placement.id)
                                    return (
                                    <TableRow key={placement.id}>
                                      <TableCell>
                                        <Input
                                          value={draft?.loadingSequence || String(placement.loadingSequence || 0)}
                                          onChange={(e) => updatePlacementDraft(placement.id, 'loadingSequence', e.target.value)}
                                          className="h-8 min-w-[72px]"
                                        />
                                      </TableCell>
                                      <TableCell>{placement.placementUnitNo}</TableCell>
                                      <TableCell>
                                        <div className="grid grid-cols-3 gap-1">
                                          <Input
                                            value={draft?.xCm || String(placement.xCm || 0)}
                                            onChange={(e) => updatePlacementDraft(placement.id, 'xCm', e.target.value)}
                                            className="h-8 min-w-[64px]"
                                          />
                                          <Input
                                            value={draft?.yCm || String(placement.yCm || 0)}
                                            onChange={(e) => updatePlacementDraft(placement.id, 'yCm', e.target.value)}
                                            className="h-8 min-w-[64px]"
                                          />
                                          <Input
                                            value={draft?.zCm || String(placement.zCm || 0)}
                                            onChange={(e) => updatePlacementDraft(placement.id, 'zCm', e.target.value)}
                                            className="h-8 min-w-[64px]"
                                          />
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={draft?.layerIndex || String(placement.layerIndex || 1)}
                                          onChange={(e) => updatePlacementDraft(placement.id, 'layerIndex', e.target.value)}
                                          className="h-8 min-w-[64px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={(draft?.nearDoorFlag ?? placement.nearDoorFlag) ? 'yes' : 'no'}
                                          onValueChange={(value) => updatePlacementDraft(placement.id, 'nearDoorFlag', value === 'yes')}
                                        >
                                          <SelectTrigger className="h-8 min-w-[78px]"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="yes">是</SelectItem>
                                            <SelectItem value="no">否</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={(draft?.faceToDoor ?? placement.faceToDoor) ? 'yes' : 'no'}
                                          onValueChange={(value) => updatePlacementDraft(placement.id, 'faceToDoor', value === 'yes')}
                                        >
                                          <SelectTrigger className="h-8 min-w-[78px]"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="yes">是</SelectItem>
                                            <SelectItem value="no">否</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={draft?.unloadingSequence || String(placement.unloadingSequence || 0)}
                                          onChange={(e) => updatePlacementDraft(placement.id, 'unloadingSequence', e.target.value)}
                                          className="h-8 min-w-[72px]"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          value={draft?.manualAdjustmentReason || placement.manualAdjustmentReason || ''}
                                          onChange={(e) => updatePlacementDraft(placement.id, 'manualAdjustmentReason', e.target.value)}
                                          className="h-8 min-w-[140px]"
                                          placeholder="现场调整原因"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleSavePlacementAdjustment(placement.id)}
                                          disabled={savingPlacementId === placement.id}
                                        >
                                          {savingPlacementId === placement.id ? '保存中...' : '保存'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  )})}
                                </TableBody>
                              </Table>
                              <div className="rounded-lg bg-white border border-gray-200 p-3">
                                <div className="text-xs text-gray-500 mb-3">2.5D 分层示意</div>
                                <div className="space-y-4">
                                  {layeredPlacements.map((layer) => {
                                    const maxX = Math.max(...layer.items.map((item: any) => Number(item.xCm || 0) + Number(item.lengthCm || 0)), 1)
                                    const maxY = Math.max(...layer.items.map((item: any) => Number(item.yCm || 0) + Number(item.widthCm || 0)), 1)
                                    const scaleX = 560 / maxX
                                    const scaleY = 220 / maxY
                                    return (
                                      <div key={layer.layerIndex} className="space-y-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                          <span>第 {layer.layerIndex} 层</span>
                                          <span>门向：{selectedContainerDetail.doorSide === 'rear' ? '右侧为尾门' : '左侧为前门'}</span>
                                        </div>
                                        <div className="overflow-x-auto">
                                          <svg
                                            viewBox="0 0 600 250"
                                            className="min-w-[600px] h-[250px] rounded-md border border-gray-200 bg-slate-50"
                                            role="img"
                                            aria-label={`第 ${layer.layerIndex} 层装载示意`}
                                          >
                                            <rect x="20" y="15" width="560" height="220" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                                            {layer.items.map((placement: any, index: number) => {
                                              const x = 20 + Number(placement.xCm || 0) * scaleX
                                              const y = 15 + Number(placement.yCm || 0) * scaleY
                                              const width = Math.max(8, Number(placement.lengthCm || 0) * scaleX)
                                              const height = Math.max(8, Number(placement.widthCm || 0) * scaleY)
                                              const fill = placement.nearDoorFlag
                                                ? '#fed7aa'
                                                : placement.fragileRisk?.level === 'warning'
                                                  ? '#fde68a'
                                                  : '#bfdbfe'
                                              const stroke = placement.isManualAdjusted ? '#ea580c' : '#475569'
                                              return (
                                                <g key={placement.id || index}>
                                                  <rect
                                                    x={x}
                                                    y={y}
                                                    width={width}
                                                    height={height}
                                                    rx="3"
                                                    fill={fill}
                                                    stroke={stroke}
                                                    strokeWidth="1.5"
                                                  />
                                                  <text
                                                    x={x + 4}
                                                    y={y + Math.min(14, height - 2)}
                                                    fontSize="9"
                                                    fill="#0f172a"
                                                  >
                                                    {placement.loadingSequence}
                                                  </text>
                                                </g>
                                              )
                                            })}
                                            <line
                                              x1={selectedContainerDetail.doorSide === 'rear' ? 580 : 20}
                                              y1="15"
                                              x2={selectedContainerDetail.doorSide === 'rear' ? 580 : 20}
                                              y2="235"
                                              stroke="#f97316"
                                              strokeWidth="4"
                                            />
                                            <text
                                              x={selectedContainerDetail.doorSide === 'rear' ? 530 : 30}
                                              y="30"
                                              fontSize="10"
                                              fill="#ea580c"
                                            >
                                              DOOR
                                            </text>
                                          </svg>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
