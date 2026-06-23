import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileCheck2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { useAuth } from '../../hooks/useAuth'
import { subscribeErpEvent } from '../../lib/erp-core/event-bus'
import { approvalRecordService, staffDirectoryService } from '../../lib/supabaseService'
import {
  EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT,
  loadSalesWorkflowSourceSnapshot,
  readCachedSalesWorkflowSourceSnapshot,
  type SalesWorkflowSourceSnapshot,
} from '../../lib/services/salesWorkflowSourceService'
import { aggregateCustomerReplies, computeSalesTodoSummary } from '../../lib/services/salesTodoCenterService'
import { getCurrentUser } from '../../utils/dataIsolation'

type SalesManagerTodoCenterProps = {
  currentUser?: any
  onNavigateToModule?: (moduleId: string) => void
}

type TeamFocusFilter = 'all' | 'approvals' | 'must_today' | 'quote_contract' | 'execution'

type TeamTodoRow = {
  repName: string
  repEmail: string
  region: string
  totalOpen: number
  mustToday: number
  quoteContract: number
  execution: number
  pendingApprovals: number
  topCustomer: string
  topBlock: string
  nextAction: string
  topTodoCreatedAt?: string
  topTodoDueAt?: string
  latestReply: string
  latestReplyAt?: string
  highestPriority: 'overdue' | 'high' | 'medium' | 'normal'
}

const ROLE_TITLES: Record<string, string> = {
  Regional_Manager: '业务主管待办中心',
  Sales_Manager: '业务主管待办中心',
  Sales_Director: '销售总监待办中心',
}

const ROLE_SUBTITLES: Record<string, string> = {
  Regional_Manager: '围绕团队待审批、超期风险与业务员卡点，快速完成团队级拍板与推进。',
  Sales_Manager: '围绕团队待审批、超期风险与业务员卡点，快速完成团队级拍板与推进。',
  Sales_Director: '围绕全局团队待审批、关键卡点与风险事项，快速完成跨区域销售推进。',
}

const PRIORITY_LABELS: Record<TeamTodoRow['highestPriority'], string> = {
  overdue: '已超期',
  high: '高优先级',
  medium: '需关注',
  normal: '正常',
}

const PRIORITY_BADGE_CLASS: Record<TeamTodoRow['highestPriority'], string> = {
  overdue: 'border-red-200 bg-red-50 text-red-600',
  high: 'border-orange-200 bg-orange-50 text-orange-600',
  medium: 'border-sky-200 bg-sky-50 text-sky-600',
  normal: 'border-slate-200 bg-slate-50 text-slate-500',
}

const getSwitchedRbacUser = () => {
  try {
    const stored = localStorage.getItem('cosun_switched_user') || localStorage.getItem('cosun_current_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

const normalizeRegion = (value?: string | null) => {
  const normalized = String(value || '').trim().toUpperCase()
  if (!normalized || normalized === 'ALL') return 'all'
  if (['NA', '北美', 'NORTH AMERICA'].includes(normalized)) return 'NA'
  if (['SA', '南美', 'SOUTH AMERICA'].includes(normalized)) return 'SA'
  if (['EA', '欧非', 'EMEA', 'EUROPE & AFRICA'].includes(normalized)) return 'EA'
  return normalized
}

const regionLabel = (value?: string | null) => {
  const region = normalizeRegion(value)
  if (region === 'NA') return '北美'
  if (region === 'SA') return '南美'
  if (region === 'EA') return '欧非'
  return '全区域'
}

const formatRelative = (value?: string) => {
  if (!value) return '暂无回复'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '暂无回复'
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatPendingAge = (createdAt?: string, dueAt?: string) => {
  const created = createdAt ? new Date(createdAt) : null
  const due = dueAt ? new Date(dueAt) : null

  if (due && !Number.isNaN(due.getTime())) {
    const diff = due.getTime() - Date.now()
    const days = Math.floor(Math.abs(diff) / 86_400_000)
    if (diff < 0) return `已超期 ${Math.max(days, 1)} 天`
    if (days === 0) return '今日到期'
    return `${days} 天后到期`
  }

  if (created && !Number.isNaN(created.getTime())) {
    const diff = Date.now() - created.getTime()
    const hours = Math.floor(diff / 3_600_000)
    if (hours < 24) return `等待 ${Math.max(hours, 1)} 小时`
    return `等待 ${Math.max(Math.floor(hours / 24), 1)} 天`
  }

  return '待更新时间'
}

const EmptyPanel = ({
  text,
  onRefresh,
  onOpenApprovals,
}: {
  text: string
  onRefresh?: () => void
  onOpenApprovals?: () => void
}) => (
  <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
      <CheckCircle2 className="h-8 w-8" />
    </div>
    <p className="mt-4 text-lg font-semibold text-slate-700">{text}</p>
    <p className="mt-1 text-sm text-slate-400">当前没有高优先级事项，可刷新数据或进入审批中心继续查看。</p>
    <div className="mt-5 flex gap-2">
      <Button
        variant="outline"
        className="h-9 rounded-xl border-slate-200 text-slate-600"
        onClick={onRefresh}
      >
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        刷新数据
      </Button>
      <Button
        variant="outline"
        className="h-9 rounded-xl border-slate-200 text-slate-600"
        onClick={onOpenApprovals}
      >
        <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
        审批中心
      </Button>
    </div>
  </div>
)

export function SalesManagerTodoCenter({ currentUser, onNavigateToModule }: SalesManagerTodoCenterProps) {
  const { currentUser: authCurrentUser } = useAuth()
  const [runtimeUser, setRuntimeUser] = useState(() => currentUser || getCurrentUser() || getSwitchedRbacUser())
  const [workflowSnapshot, setWorkflowSnapshot] = useState<SalesWorkflowSourceSnapshot>(() => readCachedSalesWorkflowSourceSnapshot({
    email: currentUser?.email || getCurrentUser()?.email || getSwitchedRbacUser()?.email || '',
    name: currentUser?.name || getCurrentUser()?.name || getSwitchedRbacUser()?.name || '',
    role: currentUser?.role || getCurrentUser()?.role || getCurrentUser()?.userRole || getSwitchedRbacUser()?.role || '',
    region: currentUser?.region || getCurrentUser()?.region || getSwitchedRbacUser()?.region || '',
  }))
  const [approvalRows, setApprovalRows] = useState<any[]>([])
  const [teamStaff, setTeamStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [focusFilter, setFocusFilter] = useState<TeamFocusFilter>('all')
  const [keyword, setKeyword] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const actingUser = currentUser || runtimeUser || authCurrentUser
  const role = String(actingUser?.role || actingUser?.userRole || '').trim()
  const region = normalizeRegion(actingUser?.region)
  const title = ROLE_TITLES[role] || '销售待办中心'
  const subtitle = ROLE_SUBTITLES[role] || '围绕团队待办、审批与风险卡点，直接看到本日需要拍板和推进的事项。'

  useEffect(() => {
    const syncRuntimeUser = () => {
      setRuntimeUser(currentUser || getCurrentUser() || getSwitchedRbacUser())
    }
    window.addEventListener('userChanged', syncRuntimeUser as EventListener)
    window.addEventListener('storage', syncRuntimeUser)
    return () => {
      window.removeEventListener('userChanged', syncRuntimeUser as EventListener)
      window.removeEventListener('storage', syncRuntimeUser)
    }
  }, [currentUser])

  useEffect(() => {
    let alive = true

    const loadData = async () => {
      setLoading(true)
      const actor = {
        email: actingUser?.email || '',
        name: actingUser?.name || '',
        role,
        region,
      }

      try {
        const [snapshot, approvals, staff] = await Promise.all([
          loadSalesWorkflowSourceSnapshot(actor).catch(() => EMPTY_SALES_WORKFLOW_SOURCE_SNAPSHOT),
          approvalRecordService.getAllSummariesCached({ force: refreshKey > 0 }).catch(() => []),
          (role === 'Sales_Director' || region === 'all'
            ? staffDirectoryService.listSalesStaffByRegion('all')
            : staffDirectoryService.listSalesRepsByRegion(region)
          ).catch(() => []),
        ])

        if (!alive) return

        const normalizedRegion = normalizeRegion(region)
        const nextStaff = Array.isArray(staff)
          ? staff.filter((row: any) => {
              if (String(row?.rbacRole || '') !== 'Sales_Rep') return false
              if (role === 'Sales_Director' || normalizedRegion === 'all') return true
              return normalizeRegion(row?.region) === normalizedRegion
            })
          : []

        const nextApprovals = Array.isArray(approvals)
          ? approvals.filter((row: any) => {
              if (String(row?.status || '').trim().toLowerCase() !== 'pending') return false
              if (role === 'Sales_Director' || normalizedRegion === 'all') return true
              return normalizeRegion(row?.region) === normalizedRegion
            })
          : []

        setWorkflowSnapshot(snapshot)
        setTeamStaff(nextStaff)
        setApprovalRows(nextApprovals)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadData()
    const unsubscribe = subscribeErpEvent(() => {
      void loadData()
    })

    return () => {
      alive = false
      unsubscribe()
    }
  }, [actingUser?.email, actingUser?.name, refreshKey, region, role])

  const teamRows = useMemo<TeamTodoRow[]>(() => {
    const rows = teamStaff.map((staff) => {
      const summary = computeSalesTodoSummary({
        salesEmail: String(staff?.email || ''),
        salesName: String(staff?.name || ''),
        salesRegion: String(staff?.region || ''),
        inquiries: workflowSnapshot.inquiries as any,
        quoteRequirements: workflowSnapshot.quoteRequirements as any,
        quotationRequests: workflowSnapshot.quotationRequests as any,
        quotations: workflowSnapshot.quotations as any,
        contracts: workflowSnapshot.contracts as any,
        purchaseOrders: workflowSnapshot.purchaseOrders as any,
        exportServiceOrders: workflowSnapshot.exportServiceOrders as any,
      })

      const openTodos = summary.aggregated.todos.filter((todo) => !todo.isCompleted)
      const priorityWeight = { overdue: 4, high: 3, medium: 2, normal: 1 }
      const topTodo = [...openTodos].sort((a, b) => {
        const priorityDelta = priorityWeight[b.priority] - priorityWeight[a.priority]
        if (priorityDelta !== 0) return priorityDelta
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })[0]
      const replies = aggregateCustomerReplies({
        quotations: workflowSnapshot.quotations as any,
        contracts: workflowSnapshot.contracts as any,
        salesEmail: String(staff?.email || ''),
        salesName: String(staff?.name || ''),
      })
      const pendingApprovals = approvalRows.filter((row) => {
        const submittedBy = String(row?.submittedBy || '').trim().toLowerCase()
        return submittedBy === String(staff?.email || '').trim().toLowerCase()
      }).length

      return {
        repName: String(staff?.name || staff?.email || '未命名业务员'),
        repEmail: String(staff?.email || ''),
        region: regionLabel(staff?.region),
        totalOpen: summary.totalOpen,
        mustToday: Number(summary.aggregated.bucketCounts.must_today || 0),
        quoteContract: Number(summary.aggregated.bucketCounts.quote_contract || 0),
        execution: Number(summary.aggregated.bucketCounts.payment || 0) + Number(summary.aggregated.bucketCounts.delivery || 0),
        pendingApprovals,
        topCustomer: String(topTodo?.customerCompany || '暂无'),
        topBlock: String(topTodo?.blockReason || '暂无卡点'),
        nextAction: String(topTodo?.nextAction || '暂无待推进动作'),
        topTodoCreatedAt: topTodo?.createdAt,
        topTodoDueAt: topTodo?.dueAt,
        latestReply: replies[0]?.summary || '暂无最近客户回复',
        latestReplyAt: replies[0]?.repliedAt,
        highestPriority: (topTodo?.priority || 'normal') as TeamTodoRow['highestPriority'],
      }
    })

    return rows
      .filter((row) => row.totalOpen > 0 || row.pendingApprovals > 0)
      .sort((a, b) =>
        b.pendingApprovals - a.pendingApprovals
        || b.mustToday - a.mustToday
        || b.totalOpen - a.totalOpen
        || a.repName.localeCompare(b.repName, 'zh-CN'),
      )
  }, [approvalRows, teamStaff, workflowSnapshot])

  const approvalInbox = useMemo(() => {
    const myEmail = String(actingUser?.email || '').trim().toLowerCase()
    return approvalRows
      .filter((row) => String(row?.currentApprover || '').trim().toLowerCase() === myEmail)
      .sort((a, b) => new Date(b.submittedAt || b.createdAt || 0).getTime() - new Date(a.submittedAt || a.createdAt || 0).getTime())
  }, [actingUser?.email, approvalRows])

  const filteredRows = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    return teamRows.filter((row) => {
      if (focusFilter === 'approvals' && row.pendingApprovals <= 0) return false
      if (focusFilter === 'must_today' && row.mustToday <= 0) return false
      if (focusFilter === 'quote_contract' && row.quoteContract <= 0) return false
      if (focusFilter === 'execution' && row.execution <= 0) return false
      if (!normalizedKeyword) return true
      return [
        row.repName,
        row.repEmail,
        row.topCustomer,
        row.topBlock,
        row.nextAction,
      ].some((item) => String(item || '').toLowerCase().includes(normalizedKeyword))
    })
  }, [focusFilter, keyword, teamRows])

  const overview = useMemo(() => {
    return {
      totalOpen: teamRows.reduce((sum, row) => sum + row.totalOpen, 0),
      mustToday: teamRows.reduce((sum, row) => sum + row.mustToday, 0),
      quoteContract: teamRows.reduce((sum, row) => sum + row.quoteContract, 0),
      execution: teamRows.reduce((sum, row) => sum + row.execution, 0),
      approvals: approvalInbox.length,
      repCount: teamRows.length,
    }
  }, [approvalInbox.length, teamRows])

  const highRiskRows = useMemo(() => filteredRows.filter((row) => ['overdue', 'high'].includes(row.highestPriority)).slice(0, 6), [filteredRows])
  const latestReplies = useMemo(() => {
    return teamRows
      .filter((row) => row.latestReplyAt)
      .sort((a, b) => new Date(b.latestReplyAt || 0).getTime() - new Date(a.latestReplyAt || 0).getTime())
      .slice(0, 6)
  }, [teamRows])

  const managerHighlights = useMemo(() => {
    const items = [
      approvalInbox[0]
        ? {
            key: 'approval',
            title: '最需要拍板',
            content: `${approvalInbox[0].relatedDocumentId || approvalInbox[0].customerName || '待审批单据'} · ${approvalInbox[0].customerName || '审批事项'}`,
            meta: formatRelative(approvalInbox[0].submittedAt || approvalInbox[0].createdAt),
            action: () => jumpToOrderCenter('approvals'),
          }
        : null,
      highRiskRows[0]
        ? {
            key: 'risk',
            title: '最可能超期',
            content: `${highRiskRows[0].repName} · ${highRiskRows[0].topBlock}`,
            meta: highRiskRows[0].nextAction,
            action: () => setFocusFilter('must_today'),
          }
        : null,
      latestReplies[0]
        ? {
            key: 'reply',
            title: '最新客户回复',
            content: `${latestReplies[0].topCustomer} · ${latestReplies[0].latestReply}`,
            meta: formatRelative(latestReplies[0].latestReplyAt),
            action: () => setFocusFilter('quote_contract'),
          }
        : null,
    ].filter(Boolean) as Array<{ key: string; title: string; content: string; meta: string; action: () => void }>

    return items
  }, [approvalInbox, highRiskRows, latestReplies])

  const jumpToOrderCenter = (targetTab: 'quotations' | 'approvals' | 'orders' = 'quotations') => {
    localStorage.setItem('orderManagementCenterActiveTab', targetTab)
    onNavigateToModule?.('order-management-center')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <ClipboardList className="h-6 w-6" style={{ color: '#F96302' }} />
              {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {region === 'all' ? '全区域' : regionLabel(region)} · {subtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-9 rounded-xl gap-1.5 border-slate-200 text-slate-500 shadow-sm"
              onClick={() => jumpToOrderCenter('approvals')}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              审批中心
            </Button>
            <Button
              variant="outline"
              className="h-9 rounded-xl gap-1.5 border-slate-200 text-slate-500 shadow-sm"
              onClick={() => setRefreshKey((prev) => prev + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          {[
            { label: '团队打开项', value: overview.totalOpen, note: `覆盖 ${overview.repCount} 位业务员`, tone: 'border-slate-200 bg-white text-slate-900', actionLabel: '看团队全盘', action: () => setFocusFilter('all') },
            { label: '今日必须推进', value: overview.mustToday, note: '超期、高优先级与新流入', tone: 'border-red-200 bg-red-50/70 text-red-600', actionLabel: '查看高优先级', action: () => setFocusFilter('must_today') },
            { label: '待确认报价/合同', value: overview.quoteContract, note: 'QT、SC 与客户确认事项', tone: 'border-orange-200 bg-orange-50/70 text-orange-600', actionLabel: '查看待确认', action: () => setFocusFilter('quote_contract') },
            { label: '履约/收款推进', value: overview.execution, note: '付款、到港、收货、反馈', tone: 'border-sky-200 bg-sky-50/70 text-sky-600', actionLabel: '查看履约', action: () => setFocusFilter('execution') },
            { label: '待我审批', value: overview.approvals, note: '当前需要主管拍板的事项', tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-600', actionLabel: '去审批', action: () => jumpToOrderCenter('approvals') },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className={`rounded-xl border px-4 py-3 text-left shadow-sm transition-colors hover:bg-white/70 ${item.tone}`}
            >
              <p className="text-xs font-medium tracking-[0.01em] opacity-80">{item.label}</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <p className="text-2xl font-semibold leading-none">{item.value}</p>
                <span className="text-[11px] font-medium opacity-90">{item.actionLabel}</span>
              </div>
              <p className="mt-2 text-xs opacity-80">{item.note}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-[132px] text-sm font-semibold text-slate-900">今日主管焦点</div>
          <div className="grid flex-1 gap-3 lg:grid-cols-3">
            {(managerHighlights.length > 0 ? managerHighlights : [
              {
                key: 'empty',
                title: '当前暂无焦点事项',
                content: '团队没有待审批、超期或最新回复提醒。',
                meta: '可刷新同步最新业务链数据',
                action: () => setRefreshKey((prev) => prev + 1),
              },
            ]).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left transition-colors hover:bg-slate-50"
              >
                <p className="text-xs font-medium text-slate-500">{item.title}</p>
                <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-800">{item.content}</p>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{item.meta}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">团队待办主表</h2>
                  <p className="mt-1 text-sm text-slate-500">按业务员聚合，优先展示当前最急事项、风险原因和下一步动作。</p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 rounded-xl gap-1.5 border-slate-200 text-slate-500 shadow-sm"
                  onClick={() => {
                    setFocusFilter('all')
                    setKeyword('')
                  }}
                >
                  重新筛选
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-b border-slate-200 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: '全部', count: overview.totalOpen },
                  { key: 'approvals', label: '待我审批', count: overview.approvals },
                  { key: 'must_today', label: '今日必须推进', count: overview.mustToday },
                  { key: 'quote_contract', label: '报价/合同', count: overview.quoteContract },
                  { key: 'execution', label: '履约/收款', count: overview.execution },
                ].map((tab) => {
                  const active = focusFilter === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setFocusFilter(tab.key as TeamFocusFilter)}
                      className={`h-9 rounded-xl px-4 text-sm shadow-sm transition-colors ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-2 text-xs ${active ? 'text-white/90' : 'text-slate-400'}`}>{tab.count || 0}</span>
                    </button>
                  )
                })}
              </div>

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 shadow-sm focus:border-orange-400 focus:outline-none"
                placeholder="搜索业务员、客户、卡点、下一步动作"
              />
            </div>

            {loading ? (
              <EmptyPanel
                text="正在加载团队待办…"
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
                onOpenApprovals={() => jumpToOrderCenter('approvals')}
              />
            ) : filteredRows.length === 0 ? (
              <EmptyPanel
                text="当前团队没有高优先级待办"
                onRefresh={() => setRefreshKey((prev) => prev + 1)}
                onOpenApprovals={() => jumpToOrderCenter('approvals')}
              />
            ) : (
              <Table className="table-fixed border-collapse">
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-white">
                    <TableHead className="px-4 py-3 text-[13px] font-semibold text-slate-900">业务员</TableHead>
                    <TableHead className="px-4 py-3 text-[13px] font-semibold text-slate-900">最急事项</TableHead>
                    <TableHead className="px-4 py-3 text-[13px] font-semibold text-slate-900">风险原因</TableHead>
                    <TableHead className="px-4 py-3 text-center text-[13px] font-semibold text-slate-900">等待/优先级</TableHead>
                    <TableHead className="px-4 py-3 text-right text-[13px] font-semibold text-slate-900">待我审批</TableHead>
                    <TableHead className="px-4 py-3 text-[13px] font-semibold text-slate-900">最近客户回复</TableHead>
                    <TableHead className="px-4 py-3 text-center text-[13px] font-semibold text-slate-900">动作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.repEmail} className="border-b border-slate-200/80 hover:bg-orange-50/20">
                      <TableCell className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          <p className="text-[12px] font-medium text-slate-800">{row.repName}</p>
                          <p className="text-[11px] text-slate-400">{row.region} · {row.repEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <div className="space-y-1.5">
                          <p className="text-[12px] font-medium text-slate-800">{row.topCustomer}</p>
                          <p className="line-clamp-2 text-[11px] font-medium text-orange-600">{row.nextAction}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <p className="line-clamp-2 text-[12px] text-slate-600">{row.topBlock}</p>
                          <p className="text-[11px] text-slate-400">打开项 {row.totalOpen} · 报价/合同 {row.quoteContract} · 履约/收款 {row.execution}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center align-top">
                        <div className="space-y-2">
                          <p className="text-[12px] font-medium text-slate-700">{formatPendingAge(row.topTodoCreatedAt, row.topTodoDueAt)}</p>
                          <div>
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] ${PRIORITY_BADGE_CLASS[row.highestPriority]}`}>
                              {PRIORITY_LABELS[row.highestPriority]}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right align-top">
                        <div className="space-y-1">
                          <p className="text-[12px] font-semibold text-slate-900">{row.pendingApprovals}</p>
                          <p className="text-[11px] text-slate-400">必须推进 {row.mustToday}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <div className="space-y-1">
                          <p className="line-clamp-2 text-[12px] text-slate-700">{row.latestReply}</p>
                          <p className="text-[11px] text-slate-400">{formatRelative(row.latestReplyAt)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4 align-top">
                        <div className="flex justify-center">
                          <div className="grid w-full max-w-[140px] grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="col-span-2 h-8 rounded-2xl border-slate-200 text-[11px] text-slate-600"
                              onClick={() => jumpToOrderCenter('orders')}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              查看全盘
                            </Button>
                            <Button
                              className="col-span-2 h-8 rounded-2xl bg-orange-500 text-[11px] text-white hover:bg-orange-500/95"
                              onClick={() => jumpToOrderCenter(row.pendingApprovals > 0 ? 'approvals' : 'quotations')}
                            >
                              去处理
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="w-80 flex-shrink-0 space-y-4">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <FileCheck2 className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-semibold text-slate-800">待我审批</span>
            </div>
            <div className="divide-y divide-slate-50">
              {approvalInbox.length === 0 ? (
                <p className="px-4 py-3 text-xs text-slate-400">当前没有待审批事项</p>
              ) : (
                approvalInbox.slice(0, 5).map((row) => (
                  <button
                    key={row.id}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    onClick={() => jumpToOrderCenter('approvals')}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-800">{row.relatedDocumentId || row.customerName || '待审批单据'}</p>
                      <span className="text-xs whitespace-nowrap text-slate-400">{formatRelative(row.submittedAt || row.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{row.customerName || '未命名客户'} · {row.productSummary || row.type?.toUpperCase?.() || '审批事项'}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-slate-800">风险雷达</span>
            </div>
            <div className="space-y-4 px-4 py-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-[0.01em] text-slate-500">高风险事项</span>
                </div>
                <div className="space-y-2">
                  {highRiskRows.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无高风险事项</p>
                  ) : (
                    highRiskRows.slice(0, 3).map((row) => (
                      <div key={`${row.repEmail}-risk`} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-800">{row.repName}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${PRIORITY_BADGE_CLASS[row.highestPriority]}`}>
                            {PRIORITY_LABELS[row.highestPriority]}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.topCustomer} · {row.topBlock}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold tracking-[0.01em] text-slate-500">最新客户回复</span>
                </div>
                <div className="space-y-2">
                  {latestReplies.length === 0 ? (
                    <p className="text-xs text-slate-400">暂无最近客户回复</p>
                  ) : (
                    latestReplies.slice(0, 3).map((row) => (
                      <div key={`${row.repEmail}-reply`} className="rounded-lg border border-slate-100 bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-800">{row.topCustomer}</p>
                          <span className="text-xs whitespace-nowrap text-slate-400">{formatRelative(row.latestReplyAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{row.repName} · {row.latestReply}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <Users className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-slate-800">团队覆盖</span>
            </div>
            <div className="space-y-2 px-4 py-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>管理范围</span>
                <span className="font-medium text-slate-900">{region === 'all' ? '全区域' : regionLabel(region)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>活跃业务员</span>
                <span className="font-medium text-slate-900">{overview.repCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>团队待办总量</span>
                <span className="font-medium text-slate-900">{overview.totalOpen}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
