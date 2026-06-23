import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileText,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  ShipWheel,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useInquiry } from '../../contexts/InquiryContext'
import { useQuotationRequests } from '../../contexts/QuotationRequestContext'
import { useSalesQuotations } from '../../contexts/SalesQuotationContext'
import { useSalesContracts } from '../../contexts/SalesContractContext'
import { usePurchaseOrders } from '../../contexts/PurchaseOrderContext'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet'
import {
  aggregateCustomerReplies,
  aggregateSalesTodosFromContexts,
  getFollowUpRecords,
  markTodoCompleted,
  saveFollowUpRecord,
  type CustomerGroup,
  type FollowUpAction,
  type FollowUpRecord,
  type SalesTodoItem,
  type TodoBucket,
} from '../../lib/services/salesTodoCenterService'
import {
  getSalesTodoActionOptions,
  getSalesTodoCollaborationHints,
  getSalesTodoDefaultAction,
  SALES_TODO_ACTION_LABELS,
  SALES_TODO_PRIORITY_LABELS,
  SALES_TODO_TYPE_LABELS,
} from '../../lib/services/salesTodoActionSchemaService'

// ─── Labels ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  Sales_Rep: '业务员',
  Sales_Manager: '销售经理',
  Sales_Director: '销售总监',
}

const BUCKET_TABS: { key: TodoBucket | 'all' | 'done_today'; label: string; mobileLabel: string }[] = [
  { key: 'all', label: '全部待办', mobileLabel: '全部' },
  { key: 'must_today', label: '今日必须跟进', mobileLabel: '今日必须' },
  { key: 'quote_contract', label: '待确认报价/合同', mobileLabel: '报价合同' },
  { key: 'payment', label: '待付款', mobileLabel: '待付款' },
  { key: 'delivery', label: '待到港/收货', mobileLabel: '交货' },
  { key: 'feedback', label: '待反馈', mobileLabel: '待反馈' },
  { key: 'done_today', label: '今日已完成', mobileLabel: '已完成' },
]

// ─── Priority styling ───────────────────────────────────────────────────────

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case 'overdue': return 'bg-red-100 text-red-700 border-0 font-medium'
    case 'high': return 'bg-orange-100 text-orange-700 border-0'
    case 'medium': return 'bg-blue-100 text-blue-700 border-0'
    default: return 'bg-gray-100 text-gray-500 border-0'
  }
}

function priorityDotClass(priority: string) {
  switch (priority) {
    case 'overdue': return 'bg-red-500'
    case 'high': return 'bg-orange-400'
    case 'medium': return 'bg-blue-400'
    default: return 'bg-gray-300'
  }
}

// ─── Date helpers ───────────────────────────────────────────────────────────

function formatRelative(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EmptyState({ text, sub }: { text: string; sub?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-full bg-green-50 mx-auto mb-3 flex items-center justify-center">
        <CheckCircle2 className="w-6 h-6 text-green-400" />
      </div>
      <p className="text-sm font-medium text-gray-600">{text}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// KPI Card — clickable, sets active bucket filter
function KpiCard({
  label,
  count,
  sub,
  colorScheme,
  active,
  onClick,
}: {
  label: string
  count: number
  sub: string
  colorScheme: 'neutral' | 'red' | 'brand' | 'blue' | 'green'
  active?: boolean
  onClick?: () => void
}) {
  const schemes = {
    neutral: {
      wrap: active ? 'border-gray-400 bg-gray-50' : 'border-gray-200 bg-white hover:border-gray-300',
      label: 'text-gray-400',
      count: 'text-gray-900',
      sub: 'text-gray-400',
    },
    red: {
      wrap: active ? 'border-red-400 bg-red-50' : 'border-red-100 bg-red-50/40 hover:border-red-300',
      label: 'text-red-500',
      count: 'text-red-600',
      sub: 'text-red-400',
    },
    brand: {
      wrap: active ? 'border-[#F96302] bg-orange-50' : 'border-orange-100 bg-orange-50/40 hover:border-[#F96302]/50',
      label: 'text-[#F96302]',
      count: 'text-[#F96302]',
      sub: 'text-orange-400',
    },
    blue: {
      wrap: active ? 'border-blue-400 bg-blue-50' : 'border-blue-100 bg-blue-50/40 hover:border-blue-300',
      label: 'text-blue-500',
      count: 'text-blue-600',
      sub: 'text-blue-400',
    },
    green: {
      wrap: active ? 'border-green-400 bg-green-50' : 'border-green-100 bg-green-50/40 hover:border-green-300',
      label: 'text-green-500',
      count: 'text-green-600',
      sub: 'text-green-400',
    },
  }
  const s = schemes[colorScheme]
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-3 text-left w-full transition-all ${s.wrap} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <p className={`text-xs font-medium ${s.label}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${s.count}`}>{count}</p>
      <p className={`text-xs mt-1 ${s.sub}`}>{sub}</p>
    </button>
  )
}

// Mobile todo card
function MobileTodoCard({
  todo,
  onContacted,
  onOpen,
}: {
  todo: SalesTodoItem
  onContacted: () => void
  onOpen: () => void
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 space-y-3 transition-opacity ${
        todo.isCompleted ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${priorityDotClass(todo.priority)}`}
            />
            <span className="font-semibold text-gray-900 text-sm truncate">{todo.customerCompany}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {todo.customerName !== '—' ? `${todo.customerName} · ` : ''}{todo.customerEmail || ''}
          </p>
        </div>
        <Badge className={`${priorityBadgeClass(todo.priority)} flex-shrink-0 text-xs`}>
          {SALES_TODO_PRIORITY_LABELS[todo.priority]}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs text-gray-600 bg-gray-50 rounded px-1.5 py-0.5">
          {todo.docNumber}
        </span>
          <span className="text-xs text-gray-400">{todo.docType} · {SALES_TODO_TYPE_LABELS[todo.type]}</span>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2 space-y-1">
        <p className="text-xs text-gray-500">
          <span className="text-gray-400">卡点：</span>{todo.blockReason}
        </p>
        <p className="text-xs font-medium" style={{ color: '#F96302' }}>
          <span className="text-gray-400 font-normal">下一步：</span>{todo.nextAction}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>最近联系：{formatRelative(todo.lastContactAt || todo.createdAt)}</span>
        {(todo.nextFollowUpAt || todo.dueAt) && (
          <span>计划：{formatDate(todo.nextFollowUpAt || todo.dueAt)}</span>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 gap-1.5 text-gray-600 text-xs"
          onClick={onContacted}
        >
          <PhoneCall className="w-3 h-3" />
          已联系
        </Button>
        <Button
          size="sm"
          className="flex-1 h-8 gap-1.5 text-xs text-white"
          style={{ backgroundColor: '#F96302' }}
          onClick={onOpen}
        >
          去处理
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function SalesTodoCenter() {
  const { currentUser } = useAuth()
  const { inquiries } = useInquiry()
  const { quotationRequests } = useQuotationRequests()
  const { quotations } = useSalesQuotations()
  const { contracts } = useSalesContracts()
  const { purchaseOrders } = usePurchaseOrders()

  const [activeBucket, setActiveBucket] = useState<TodoBucket | 'all' | 'done_today'>('all')
  const [keyword, setKeyword] = useState('')
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [selectedTodo, setSelectedTodo] = useState<SalesTodoItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')
  // Track which quick action the user selected in the drawer
  const [selectedAction, setSelectedAction] = useState<FollowUpAction | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const salesEmail = currentUser?.email || ''
  const roleLabel = ROLE_LABELS[currentUser?.role || ''] || '业务员'
  const userName = currentUser?.name || currentUser?.email?.split('@')[0] || '业务员'

  const aggregated = useMemo(
    () =>
      aggregateSalesTodosFromContexts({
        salesEmail,
        inquiries,
        quotationRequests,
        quotations,
        contracts,
        purchaseOrders,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salesEmail, inquiries, quotationRequests, quotations, contracts, purchaseOrders, refreshKey],
  )

  const recentReplies = useMemo(
    () => aggregateCustomerReplies({ quotations, contracts, salesEmail }).slice(0, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotations, contracts, salesEmail, refreshKey],
  )

  const recentFollowUps = useMemo(() => getFollowUpRecords().slice(0, 5), [refreshKey])

  const filteredGroups = useMemo(() => {
    const lowered = keyword.trim().toLowerCase()
    return aggregated.customerGroups
      .map((group) => {
        const todos = group.todos.filter((todo) => {
          const bucketMatched =
            activeBucket === 'all'
              ? !todo.isCompleted
              : activeBucket === 'done_today'
              ? Boolean(todo.isCompleted)
              : !todo.isCompleted && todo.bucket === activeBucket
          if (!bucketMatched) return false
          if (!lowered) return true
          return [
            todo.customerCompany,
            todo.customerName,
            todo.customerEmail,
            todo.docNumber,
            todo.stage,
            todo.blockReason,
            todo.nextAction,
          ].some((v) => String(v || '').toLowerCase().includes(lowered))
        })
        return { ...group, todos }
      })
      .filter((g) => g.todos.length > 0)
  }, [aggregated.customerGroups, activeBucket, keyword])

  const {
    totalOpen,
    mustTodayCount,
    overdueCount,
    completedTodayCount,
    highRiskGroups,
    upcomingTodos,
    mustTodayDone,
    mustTodayTotal,
    progressPct,
  } = aggregated.summary

  function refresh() {
    setRefreshKey((prev) => prev + 1)
  }

  function toggleCustomer(key: string) {
    setExpandedCustomers((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function openDrawer(todo: SalesTodoItem) {
    setSelectedTodo(todo)
    setActionNote('')
    setSelectedAction(null)
    setNextFollowUpAt(todo.nextFollowUpAt ? String(todo.nextFollowUpAt).slice(0, 10) : '')
    setDrawerOpen(true)
  }

  function handleQuickContact(todo: SalesTodoItem) {
    saveFollowUpRecord({
      todoId: todo.id,
      docNumber: todo.docNumber,
      action: getSalesTodoDefaultAction(todo.type),
      recordedAt: new Date().toISOString(),
    })
    refresh()
  }

  // Bug 1 fixed: uses selectedAction (user's choice) instead of hardcoded 'contacted'
  function handleRecordPlan() {
    if (!selectedTodo) return
    const action = selectedAction || 'scheduled'
    saveFollowUpRecord({
      todoId: selectedTodo.id,
      docNumber: selectedTodo.docNumber,
      action,
      note: actionNote || undefined,
      nextFollowUpAt: nextFollowUpAt || undefined,
      recordedAt: new Date().toISOString(),
    })
    setDrawerOpen(false)
    refresh()
  }

  function handleRecordDone() {
    if (!selectedTodo) return
    const action = selectedAction || getSalesTodoDefaultAction(selectedTodo.type)
    saveFollowUpRecord({
      todoId: selectedTodo.id,
      docNumber: selectedTodo.docNumber,
      action,
      note: actionNote || undefined,
      nextFollowUpAt: nextFollowUpAt || undefined,
      recordedAt: new Date().toISOString(),
    })
    markTodoCompleted(selectedTodo.id, actionNote || SALES_TODO_ACTION_LABELS[action])
    setDrawerOpen(false)
    refresh()
  }

  // History for the selected todo
  const selectedTodoHistory = useMemo(() => {
    if (!selectedTodo) return []
    return getFollowUpRecords()
      .filter((r) => r.todoId === selectedTodo.id)
      .slice(0, 8)
  }, [selectedTodo, refreshKey])

  const selectedTodoActionOptions = useMemo(
    () => (selectedTodo ? getSalesTodoActionOptions(selectedTodo.type) : []),
    [selectedTodo],
  )

  const selectedTodoCollaborationHints = useMemo(
    () => (selectedTodo ? getSalesTodoCollaborationHints(selectedTodo.type) : []),
    [selectedTodo],
  )

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  // ── Quick-filter via KPI card click ──────────────────────────────────────
  function handleKpiClick(bucket: TodoBucket | 'all' | 'done_today') {
    setActiveBucket((prev) => (prev === bucket ? 'all' : bucket))
    setKeyword('')
  }

  return (
    <div className="space-y-3 pb-6">

      {/* ── Header ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#F96302' }}
          >
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              {greeting}，{userName}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {roleLabel} · 待办中心 · 今日还有 <span className="font-semibold text-gray-700">{mustTodayCount}</span> 项需要跟进
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-gray-500 flex-shrink-0"
          onClick={refresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">刷新</span>
        </Button>
      </div>

      {/* ── Overdue Warning Banner ── */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">
            <span className="font-semibold">注意：</span>
            你有 <span className="font-bold">{overdueCount}</span> 个客户事项已超期，请优先处理。
          </p>
          <button
            className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0"
            onClick={() => handleKpiClick('must_today')}
          >
            查看 →
          </button>
        </div>
      )}

      {/* ── KPI Cards + Progress ── */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 pt-4 pb-3 space-y-3">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#22c55e' : '#F96302' }}
            />
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            今日必须：{mustTodayDone}/{mustTodayTotal > 0 ? mustTodayTotal : '—'} 完成
          </span>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <KpiCard
            label="当前待办"
            count={totalOpen}
            sub="全部未完成事项"
            colorScheme="neutral"
            active={activeBucket === 'all'}
            onClick={() => handleKpiClick('all')}
          />
          <KpiCard
            label="今日必须"
            count={mustTodayCount}
            sub="新询价·超期·高优先"
            colorScheme="red"
            active={activeBucket === 'must_today'}
            onClick={() => handleKpiClick('must_today')}
          />
          <KpiCard
            label="待确认报价/合同"
            count={aggregated.bucketCounts.quote_contract || 0}
            sub="QT · SC · 验货方式"
            colorScheme="brand"
            active={activeBucket === 'quote_contract'}
            onClick={() => handleKpiClick('quote_contract')}
          />
          <KpiCard
            label="待付款/履约"
            count={(aggregated.bucketCounts.payment || 0) + (aggregated.bucketCounts.delivery || 0)}
            sub="付款 · 到港 · 收货"
            colorScheme="blue"
            active={activeBucket === 'payment' || activeBucket === 'delivery'}
            onClick={() => handleKpiClick('payment')}
          />
          <KpiCard
            label="今日已完成"
            count={completedTodayCount}
            sub="已完成本轮跟进"
            colorScheme="green"
            active={activeBucket === 'done_today'}
            onClick={() => handleKpiClick('done_today')}
          />
        </div>
      </div>

      {/* ── Main Content: List + Sidebar ── */}
      <div className="flex gap-3 items-start">

        {/* ── Left: Todo List ── */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

            {/* List Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">客户跟进主表</h2>
                  <p className="text-xs text-gray-400 mt-0.5">按客户分组，直接看到卡点与下一步动作</p>
                </div>
                {(activeBucket !== 'all' || keyword) && (
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                    onClick={() => { setActiveBucket('all'); setKeyword('') }}
                  >
                    <X className="w-3 h-3" />
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
              {/* Bucket tabs — scroll horizontally on mobile */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                {BUCKET_TABS.map((tab) => {
                  const count =
                    tab.key === 'all'
                      ? totalOpen
                      : tab.key === 'done_today'
                      ? completedTodayCount
                      : aggregated.bucketCounts[tab.key as TodoBucket]
                  const isActive = activeBucket === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveBucket(tab.key as any)}
                      className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                        isActive
                          ? 'text-white font-medium'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={isActive ? { backgroundColor: '#F96302' } : {}}
                    >
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.mobileLabel}</span>
                      <span
                        className={`ml-1.5 ${isActive ? 'text-white/80' : 'text-gray-400'}`}
                      >
                        {count || 0}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Search */}
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#F96302]/40 focus:border-[#F96302]/60"
                placeholder="搜索客户、单号、卡点、下一步动作…"
              />
            </div>

            {/* ── Desktop Table ── */}
            {filteredGroups.length === 0 ? (
              <EmptyState
                text="当前没有匹配的待办项"
                sub="数据从业务链实时聚合，有新单据时自动出现"
              />
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/80">
                        <TableHead className="w-6" />
                        <TableHead className="text-xs font-semibold text-gray-500">客户</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">当前单据</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">当前卡点</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">下一步动作</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">最近联系</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">计划跟进</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">优先级</TableHead>
                        <TableHead className="text-right text-xs font-semibold text-gray-500">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroups.map((group: CustomerGroup) => {
                        const expanded = expandedCustomers.has(group.customerCompany)
                        const visibleTodos = expanded ? group.todos : group.todos.slice(0, 3)
                        const hiddenCount = group.todos.length - visibleTodos.length

                        return (
                          <React.Fragment key={group.customerCompany}>
                            {/* Customer group row */}
                            <TableRow
                              className="bg-gray-50/60 hover:bg-gray-100/60 cursor-pointer select-none"
                              onClick={() => toggleCustomer(group.customerCompany)}
                            >
                              <TableCell className="py-2.5">
                                {expanded
                                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                              </TableCell>
                              <TableCell colSpan={6} className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDotClass(group.highestPriority)}`}
                                  />
                                  <span className="font-semibold text-sm text-gray-800">
                                    {group.customerCompany}
                                  </span>
                                  {group.customerName !== '—' && (
                                    <span className="text-xs text-gray-400">· {group.customerName}</span>
                                  )}
                                  {group.customerEmail && (
                                    <span className="text-xs text-gray-400 hidden xl:inline">
                                      · {group.customerEmail}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <Badge className={priorityBadgeClass(group.highestPriority)}>
                                  {group.hasOverdue ? '超期' : SALES_TODO_PRIORITY_LABELS[group.highestPriority]}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-2.5 text-right text-xs text-gray-400">
                                {group.todos.length} 项
                              </TableCell>
                            </TableRow>

                            {/* Todo rows */}
                            {visibleTodos.map((todo) => (
                              <TableRow
                                key={todo.id}
                                className={`${
                                  todo.isCompleted
                                    ? 'opacity-40 bg-gray-50/30'
                                    : 'hover:bg-orange-50/20'
                                }`}
                              >
                                <TableCell />
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-gray-800 leading-snug">
                                      {todo.customerCompany}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {todo.customerName !== '—' ? todo.customerName : ''}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-mono text-xs text-gray-700">{todo.docNumber}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      {todo.docType} · {SALES_TODO_TYPE_LABELS[todo.type]}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500 max-w-[180px]">
                                  <p className="line-clamp-2">{todo.blockReason}</p>
                                </TableCell>
                                <TableCell>
                                  <p
                                    className="text-xs font-medium max-w-[160px] line-clamp-2"
                                    style={{ color: '#F96302' }}
                                  >
                                    {todo.nextAction}
                                  </p>
                                </TableCell>
                                <TableCell className="text-xs text-gray-400">
                                  {formatRelative(todo.lastContactAt || todo.createdAt)}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {formatDate(todo.nextFollowUpAt || todo.dueAt)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={priorityBadgeClass(todo.priority)}>
          {SALES_TODO_PRIORITY_LABELS[todo.priority]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2.5 gap-1 text-xs text-gray-600"
                                      onClick={() => handleQuickContact(todo)}
                                    >
                                      <PhoneCall className="w-3 h-3" />
                                      已联系
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-7 px-2.5 gap-1 text-xs text-white"
                                      style={{ backgroundColor: '#F96302' }}
                                      onClick={() => openDrawer(todo)}
                                    >
                                      去处理
                                      <ArrowRight className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}

                            {/* Expand / collapse */}
                            {!expanded && hiddenCount > 0 && (
                              <TableRow>
                                <TableCell colSpan={9} className="py-2 text-center">
                                  <button
                                    className="text-xs text-gray-400 hover:text-[#F96302] transition-colors"
                                    onClick={() => toggleCustomer(group.customerCompany)}
                                  >
                                    还有 {hiddenCount} 条 · 点击展开
                                  </button>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* ── Mobile Cards ── */}
                <div className="lg:hidden px-3 py-3 space-y-2.5">
                  {filteredGroups.map((group: CustomerGroup) => {
                    const expanded = expandedCustomers.has(group.customerCompany)
                    const visibleTodos = expanded ? group.todos : group.todos.slice(0, 2)
                    const hiddenCount = group.todos.length - visibleTodos.length

                    return (
                      <div key={group.customerCompany} className="space-y-2">
                        {/* Group label */}
                        <div className="flex items-center gap-2 px-1">
                          <span className={`w-2 h-2 rounded-full ${priorityDotClass(group.highestPriority)}`} />
                          <span className="text-xs font-semibold text-gray-600">{group.customerCompany}</span>
                          <span className="text-xs text-gray-400">· {group.todos.length} 项</span>
                        </div>
                        {visibleTodos.map((todo) => (
                          <MobileTodoCard
                            key={todo.id}
                            todo={todo}
                            onContacted={() => handleQuickContact(todo)}
                            onOpen={() => openDrawer(todo)}
                          />
                        ))}
                        {!expanded && hiddenCount > 0 && (
                          <button
                            className="w-full text-xs text-center text-gray-400 hover:text-[#F96302] py-1"
                            onClick={() => toggleCustomer(group.customerCompany)}
                          >
                            还有 {hiddenCount} 条 · 展开
                          </button>
                        )}
                        {expanded && (
                          <button
                            className="w-full text-xs text-center text-gray-400 hover:text-[#F96302] py-1"
                            onClick={() => toggleCustomer(group.customerCompany)}
                          >
                            收起
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right Sidebar (desktop only) ── */}
        <div className="hidden xl:flex flex-col w-72 flex-shrink-0 gap-3">

          {/* Recent customer replies */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#F96302' }} />
              <span className="text-sm font-semibold text-gray-800">最近客户回复</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentReplies.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400 text-center">暂无最近回复</p>
              ) : (
                recentReplies.map((reply, i) => (
                  <div key={`${reply.docNumber}-${i}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{reply.customerCompany}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {formatRelative(reply.repliedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{reply.docNumber} · {reply.source}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reply.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming / overdue */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Clock3 className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">即将到期 / 应跟进</span>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingTodos.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400 text-center">暂无即将到期项</p>
              ) : (
                upcomingTodos.map((todo) => (
                  <button
                    key={todo.id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => openDrawer(todo)}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{todo.customerCompany}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{todo.docNumber} · {todo.nextAction}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(todo.nextFollowUpAt || todo.dueAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* High risk */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">高风险卡点</span>
            </div>
            <div className="divide-y divide-gray-50">
              {highRiskGroups.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400 text-center">暂无高风险客户</p>
              ) : (
                highRiskGroups.map((group) => (
                  <div key={group.customerCompany} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{group.customerCompany}</p>
                      <Badge className={`${priorityBadgeClass(group.highestPriority)} flex-shrink-0 text-xs`}>
                        {group.hasOverdue ? '超期' : SALES_TODO_PRIORITY_LABELS[group.highestPriority]}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {group.todos[0]?.blockReason || '存在高优先级客户动作'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent follow-ups */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">我最近的跟进</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentFollowUps.length === 0 ? (
                <p className="px-4 py-4 text-xs text-gray-400 text-center">还没有跟进记录</p>
              ) : (
                recentFollowUps.map((item, i) => (
                  <div key={`${item.docNumber}-${i}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-700 truncate">{item.docNumber}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {formatRelative(item.recordedAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{SALES_TODO_ACTION_LABELS[item.action]}</p>
                    {item.note && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.note}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sidebar Panels (below the list) ── */}
      <div className="xl:hidden space-y-3">
        {recentReplies.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: '#F96302' }} />
              <span className="text-sm font-semibold text-gray-800">最近客户回复</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentReplies.map((reply, i) => (
                <div key={`${reply.docNumber}-${i}`} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{reply.customerCompany}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatRelative(reply.repliedAt)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{reply.docNumber} · {reply.source}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{reply.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {highRiskGroups.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">高风险卡点</span>
            </div>
            <div className="divide-y divide-gray-50">
              {highRiskGroups.map((group) => (
                <div key={group.customerCompany} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{group.customerCompany}</p>
                    <Badge className={`${priorityBadgeClass(group.highestPriority)} flex-shrink-0`}>
                      {group.hasOverdue ? '超期' : SALES_TODO_PRIORITY_LABELS[group.highestPriority]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                    {group.todos[0]?.blockReason || '存在高优先级客户动作'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Follow-up Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:w-[460px] overflow-y-auto">
          <SheetHeader className="border-b border-gray-100 pb-4">
            <SheetTitle className="text-base font-semibold text-gray-900">跟进处理</SheetTitle>
            {selectedTodo && (
              <div className="space-y-2 text-left mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-gray-700 bg-gray-50 rounded px-2 py-0.5">
                    {selectedTodo.docNumber}
                  </span>
                  <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                    {SALES_TODO_TYPE_LABELS[selectedTodo.type]}
                  </Badge>
                  <Badge className={`${priorityBadgeClass(selectedTodo.priority)} text-xs`}>
                    {SALES_TODO_PRIORITY_LABELS[selectedTodo.priority]}
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-gray-900">{selectedTodo.customerCompany}</p>
                <p className="text-xs text-gray-500">{selectedTodo.stage}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{selectedTodo.blockReason}</p>
              </div>
            )}
          </SheetHeader>

          {selectedTodo && (
            <div className="space-y-5 pt-5">

              {/* Todo info grid */}
              <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">客户</p>
                  <p className="text-gray-800 font-medium text-sm">{selectedTodo.customerCompany}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">单据</p>
                  <p className="text-gray-800 font-mono text-sm">{selectedTodo.docNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">最近联系</p>
                  <p className="text-gray-700 text-sm">
                    {formatRelative(selectedTodo.lastContactAt || selectedTodo.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">下一步</p>
                  <p className="text-sm font-medium" style={{ color: '#F96302' }}>
                    {selectedTodo.nextAction}
                  </p>
                </div>
              </div>

              {selectedTodoCollaborationHints.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs text-blue-600 font-semibold mb-1">建议协同角色</p>
                  <p className="text-xs text-blue-700">{selectedTodoCollaborationHints.join(' / ')}</p>
                </div>
              )}

              {/* Quick actions — now stateful (selectable) */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  选择本次动作
                  {selectedAction && (
                    <button
                      className="ml-2 text-gray-400 hover:text-gray-600 normal-case font-normal"
                      onClick={() => setSelectedAction(null)}
                    >
                      (取消选择)
                    </button>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTodoActionOptions.map((action) => {
                    const isSelected = selectedAction === action
                    return (
                      <button
                        key={action}
                        className={`text-left rounded-xl px-3 py-2.5 text-xs transition-all border ${
                          isSelected
                            ? 'text-white font-medium border-[#F96302]'
                            : 'border-gray-200 text-gray-700 hover:border-[#F96302]/50 hover:bg-orange-50/50'
                        }`}
                        style={isSelected ? { backgroundColor: '#F96302' } : {}}
                        onClick={() => setSelectedAction(isSelected ? null : action)}
                      >
                        {SALES_TODO_ACTION_LABELS[action]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Note */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">跟进备注</p>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#F96302]/40 focus:border-[#F96302]/60 resize-none"
                  placeholder="写下本次联系结果、客户回复、风险判断或后续安排"
                />
              </div>

              {/* Next follow-up date */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">下次跟进时间</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="date"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#F96302]/40 focus:border-[#F96302]/60"
                  />
                </div>
              </div>

              {/* History */}
              {selectedTodoHistory.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    本单跟进历史
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedTodoHistory.map((record: FollowUpRecord, i: number) => (
                      <div
                        key={`${record.recordedAt}-${i}`}
                        className="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700">
                            {SALES_TODO_ACTION_LABELS[record.action]}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {formatRelative(record.recordedAt)}
                          </span>
                        </div>
                        {record.note && (
                          <p className="text-xs text-gray-500 line-clamp-2">{record.note}</p>
                        )}
                        {record.nextFollowUpAt && (
                          <p className="text-xs text-gray-400">
                            下次：{formatDate(record.nextFollowUpAt)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600 rounded-xl"
                  onClick={handleRecordPlan}
                >
                  <Calendar className="w-4 h-4" />
                  仅记录计划
                </Button>
                <Button
                  className="gap-2 rounded-xl text-white"
                  style={{ backgroundColor: '#F96302' }}
                  onClick={handleRecordDone}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  完成本轮跟进
                </Button>
              </div>

              {/* Navigate to business module */}
              {selectedTodo.navigateTo && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-gray-600 rounded-xl"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('navigate', {
                        detail: { page: selectedTodo.navigateTo },
                      }),
                    )
                    setDrawerOpen(false)
                  }}
                >
                  <FileText className="w-4 h-4" />
                  前往相关业务模块
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
