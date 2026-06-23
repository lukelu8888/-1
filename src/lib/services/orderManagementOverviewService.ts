import type { OrderManagementCounts } from './orderManagementCountService'
import type { SalesWorkflowSourceSnapshot } from './salesWorkflowSourceService'

interface StageTotalSnapshot {
  inquiries: number
  costInquiry: number
  quotations: number
  orders: number
  collections: number
  exportService: number
}

export interface OrderOverviewStageRow {
  stage: string
  total: number
  pending: number
  pendingRate: number
  note: string
  status: 'empty' | 'watch' | 'busy'
}

export interface OrderOverviewDistributionPoint {
  stage: string
  total: number
  pending: number
}

export interface OrderOverviewRegionRow {
  region: string
  inquiries: number
  quotations: number
  contracts: number
  orders: number
  pending: number
}

export interface OrderOverviewCustomerRow {
  name: string
  region: string
  inquiries: number
  quotations: number
  contracts: number
  orders: number
  pending: number
}

export interface OrderOverviewRiskRow {
  type: string
  count: number
  handler: string
  note: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface OrderOverviewViewModel {
  stageRows: OrderOverviewStageRow[]
  distribution: OrderOverviewDistributionPoint[]
  regionRows: OrderOverviewRegionRow[]
  customerRows: OrderOverviewCustomerRow[]
  moduleRanking: Array<{ name: string; count: number }>
  riskRows: OrderOverviewRiskRow[]
}

function normalizeRegionLabel(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return '未分区'
  if (['na', 'north america', 'north_america', '北美'].includes(normalized)) return '北美'
  if (['sa', 'south america', 'south_america', '南美'].includes(normalized)) return '南美'
  if (['ea', 'eu', 'europe & africa', 'europe_africa', '欧非'].includes(normalized)) return '欧非'
  return String(value || '未分区')
}

function countUnique(list: any[], key: string) {
  const values = new Set(
    list
      .map((item) => String(item?.[key] || item?.id || '').trim())
      .filter(Boolean),
  )
  return values.size
}

function computeStageTotals(snapshot: SalesWorkflowSourceSnapshot): StageTotalSnapshot {
  const costInquiryKeys = new Set(
    [
      ...snapshot.quoteRequirements.map((item: any) => String(item?.requirementNo || item?.id || '').trim()),
      ...snapshot.quotationRequests.map((item: any) => String(item?.requestNumber || item?.id || '').trim()),
    ].filter(Boolean),
  )

  return {
    inquiries: countUnique(snapshot.inquiries, 'inquiryNumber'),
    costInquiry: costInquiryKeys.size,
    quotations: countUnique(snapshot.quotations, 'qtNumber'),
    orders: countUnique(snapshot.contracts, 'contractNumber'),
    collections: countUnique(snapshot.payments, 'id'),
    exportService: countUnique(snapshot.exportServiceOrders, 'serviceOrderNumber'),
  }
}

function buildStageRows(stageTotals: StageTotalSnapshot, pendingCounts: OrderManagementCounts): OrderOverviewStageRow[] {
  const rows = [
    { stage: '询价', total: stageTotals.inquiries, pending: pendingCounts.inquiries, note: '客户需求待澄清/待响应' },
    { stage: '成本询报', total: stageTotals.costInquiry, pending: pendingCounts.costInquiry, note: '采购成本与供应商回传' },
    { stage: '报价', total: stageTotals.quotations, pending: pendingCounts.quotations, note: '报价草稿/发送/客户反馈' },
    { stage: '订单', total: stageTotals.orders, pending: pendingCounts.orders, note: '合同签署/履约/交付协同' },
    { stage: '收款', total: stageTotals.collections, pending: pendingCounts.collections, note: '客户付款与财务确认' },
    { stage: '出口服务', total: stageTotals.exportService, pending: pendingCounts.exportService || 0, note: '借抬头出口业务推进' },
  ]

  return rows.map((row) => {
    const pendingRate = row.total > 0 ? Math.round((row.pending / row.total) * 100) : 0
    const status: OrderOverviewStageRow['status'] =
      row.pending === 0 ? 'empty' : pendingRate >= 50 ? 'busy' : 'watch'
    return { ...row, pendingRate, status }
  })
}

function buildRegionRows(snapshot: SalesWorkflowSourceSnapshot, pendingCounts: OrderManagementCounts): OrderOverviewRegionRow[] {
  const regionMap = new Map<string, OrderOverviewRegionRow>()
  const touch = (regionValue?: string | null, field?: 'inquiries' | 'quotations' | 'contracts' | 'orders') => {
    const region = normalizeRegionLabel(regionValue)
    const current = regionMap.get(region) || { region, inquiries: 0, quotations: 0, contracts: 0, orders: 0, pending: 0 }
    if (field) current[field] += 1
    regionMap.set(region, current)
  }

  snapshot.inquiries.forEach((row: any) => touch(row?.region, 'inquiries'))
  snapshot.quotations.forEach((row: any) => touch(row?.region, 'quotations'))
  snapshot.contracts.forEach((row: any) => touch(row?.region, 'contracts'))
  snapshot.purchaseOrders.forEach((row: any) => touch(row?.region, 'orders'))

  const totalPending = pendingCounts.inquiries + pendingCounts.quotations + pendingCounts.orders
  const rows = Array.from(regionMap.values())
  return rows
    .map((row) => {
      const footprint = row.inquiries + row.quotations + row.contracts + row.orders
      const pending = totalPending > 0 && footprint > 0
        ? Math.round((footprint / Math.max(rows.reduce((sum, item) => sum + item.inquiries + item.quotations + item.contracts + item.orders, 0), 1)) * totalPending)
        : 0
      return { ...row, pending }
    })
    .sort((a, b) => b.pending - a.pending || (b.orders + b.contracts + b.quotations + b.inquiries) - (a.orders + a.contracts + a.quotations + a.inquiries))
}

function buildCustomerRows(snapshot: SalesWorkflowSourceSnapshot): OrderOverviewCustomerRow[] {
  const customerMap = new Map<string, OrderOverviewCustomerRow>()
  const touch = (
    name: string,
    regionValue?: string | null,
    field?: 'inquiries' | 'quotations' | 'contracts' | 'orders' | 'pending',
  ) => {
    const key = name || '未命名客户'
    const current = customerMap.get(key) || {
      name: key,
      region: normalizeRegionLabel(regionValue),
      inquiries: 0,
      quotations: 0,
      contracts: 0,
      orders: 0,
      pending: 0,
    }
    if (field) current[field] += 1
    customerMap.set(key, current)
  }

  snapshot.inquiries.forEach((row: any) => touch(row?.buyerInfo?.companyName || row?.buyerCompany || row?.buyerInfo?.contactPerson || '未命名客户', row?.region, 'inquiries'))
  snapshot.quotations.forEach((row: any) => touch(row?.customerCompany || row?.customerName || '未命名客户', row?.region, 'quotations'))
  snapshot.contracts.forEach((row: any) => touch(row?.customerCompany || row?.customerName || '未命名客户', row?.region, 'contracts'))
  snapshot.purchaseOrders.forEach((row: any) => touch(row?.customerCompany || row?.customerName || row?.customer || '未命名客户', row?.region, 'orders'))
  snapshot.payments
    .filter((row: any) => String(row?.status || '').trim().toLowerCase() === 'pending')
    .forEach((row: any) => touch(row?.customerCompany || row?.customerName || row?.customer || '未命名客户', row?.region, 'pending'))

  return Array.from(customerMap.values())
    .sort((a, b) => (b.pending + b.orders + b.contracts + b.quotations + b.inquiries) - (a.pending + a.orders + a.contracts + a.quotations + a.inquiries))
    .slice(0, 8)
}

export function computeOrderOverviewViewModel(input: {
  snapshot: SalesWorkflowSourceSnapshot
  pendingCounts: OrderManagementCounts
}): OrderOverviewViewModel {
  const stageTotals = computeStageTotals(input.snapshot)
  const stageRows = buildStageRows(stageTotals, input.pendingCounts)

  return {
    stageRows,
    distribution: stageRows.map((row) => ({ stage: row.stage, total: row.total, pending: row.pending })),
    regionRows: buildRegionRows(input.snapshot, input.pendingCounts),
    customerRows: buildCustomerRows(input.snapshot),
    moduleRanking: [
      { name: '询价管理', count: input.pendingCounts.inquiries },
      { name: '成本询报', count: input.pendingCounts.costInquiry },
      { name: '报价管理', count: input.pendingCounts.quotations },
      { name: '订单管理', count: input.pendingCounts.orders },
      { name: '收款管理', count: input.pendingCounts.collections },
      { name: '借抬头出口', count: input.pendingCounts.exportService || 0 },
    ].sort((a, b) => b.count - a.count),
    riskRows: [
      { type: '询价待处理', count: input.pendingCounts.inquiries, handler: '业务员', note: '客户初始需求仍需响应或澄清', priority: input.pendingCounts.inquiries > 0 ? 'medium' : 'low' },
      { type: '报价待处理', count: input.pendingCounts.quotations, handler: '业务员/主管', note: '报价草稿、客户反馈或审批回流事项', priority: input.pendingCounts.quotations > 0 ? 'high' : 'low' },
      { type: '订单待处理', count: input.pendingCounts.orders, handler: '业务/履约', note: '合同签署、履约、交付等未闭环事项', priority: input.pendingCounts.orders > 0 ? 'high' : 'low' },
      { type: '收款待处理', count: input.pendingCounts.collections, handler: '财务/业务', note: '客户付款节点与确认动作未完成', priority: input.pendingCounts.collections > 0 ? 'critical' : 'low' },
      { type: '出口服务待处理', count: input.pendingCounts.exportService || 0, handler: '业务员', note: '借抬头出口链路仍在业务推进中', priority: (input.pendingCounts.exportService || 0) > 0 ? 'medium' : 'low' },
    ].filter((item) => item.count > 0),
  }
}
