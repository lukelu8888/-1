import React, { useMemo, useState } from 'react'
import {
  AlertCircle,
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

const ROLE_LABELS: Record<string, string> = {
  Sales_Rep: '业务员',
  Sales_Manager: '销售经理',
  Sales_Director: '销售总监',
}

const TYPE_LABELS: Record<string, string> = {
  ing_new: '新ING',
  ing_clarify: 'ING澄清',
  qr_waiting_cost: '待采购回传',
  qt_send: '待发QT',
  qt_customer_feedback: '待客户反馈',
  qt_negotiating: '报价协商',
  sc_sign: '待签SC',
  sc_deposit: '待定金',
  inspection_method: '验货方式',
  third_party_inspection: '第三方验货/监装',
  payment_followup: '付款跟进',
  freight_confirmation: '海运费/船期',
  arrival_confirmation: '到港确认',
  clearance_docs: '清关资料',
  receipt_confirmation: '收货确认',
  feedback_followup: '反馈回访',
}

const PRIORITY_LABELS: Record<string, string> = {
  overdue: '已超期',
  high: '高',
  medium: '中',
  normal: '正常',
}

const PRIORITY_BADGE_CLASS: Record<string, string> = {
  overdue: 'bg-red-100 text-red-700 border-0',
  high: 'bg-orange-100 text-orange-700 border-0',
  medium: 'bg-blue-100 text-blue-700 border-0',
  normal: 'bg-gray-100 text-gray-600 border-0',
}

const BUCKET_TABS: { key: TodoBucket | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'must_today', label: '今日必须跟进' },
  { key: 'quote_contract', label: '待确认报价/合同' },
  { key: 'payment', label: '待付款' },
  { key: 'delivery', label: '待到港/收货' },
  { key: 'feedback', label: '待反馈' },
  { key: 'done_today', label: '今日已完成' },
]

const ACTION_LABELS: Record<FollowUpAction, string> = {
  contacted: '已联系客户',
  sent_qt: '已发 QT',
  chased_contract: '已催合同',
  chased_deposit: '已催定金',
  shared_report: '已发验货报告',
  chased_payment: '已催付款',
  notified_arrival: '已通知到港',
  requested_clearance_docs: '已催清关资料',
  confirmed_receipt: '已确认收货',
  invited_feedback: '已邀请反馈',
  scheduled: '约下次跟进',
}

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

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="py-14 text-center">
      <div className="w-14 h-14 rounded-full bg-green-50 mx-auto mb-3 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-green-500" />
      </div>
      <p className="text-sm font-medium text-gray-600">{text}</p>
      <p className="text-xs text-gray-400 mt-1">当前没有匹配项，等待业务链数据触发</p>
    </div>
  )
}

export function SalesTodoCenter() {
  const { currentUser } = useAuth()
  const { inquiries } = useInquiry()
  const { quotationRequests } = useQuotationRequests()
  const { quotations } = useSalesQuotations()
  const { contracts } = useSalesContracts()
  const { purchaseOrders } = usePurchaseOrders()

  const [activeBucket, setActiveBucket] = useState<TodoBucket | 'all'>('all')
  const [keyword, setKeyword] = useState('')
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set())
  const [selectedTodo, setSelectedTodo] = useState<SalesTodoItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionNote, setActionNote] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const salesEmail = currentUser?.email || ''
  const roleLabel = ROLE_LABELS[currentUser?.role || ''] || '业务员'

  const aggregated = useMemo(
    () => aggregateSalesTodosFromContexts({
      salesEmail,
      inquiries,
      quotationRequests,
      quotations,
      contracts,
      purchaseOrders,
    }),
    [salesEmail, inquiries, quotationRequests, quotations, contracts, purchaseOrders, refreshKey],
  )

  const recentReplies = useMemo(
    () => aggregateCustomerReplies({ quotations, contracts, salesEmail }).slice(0, 6),
    [quotations, contracts, salesEmail, refreshKey],
  )

  const recentFollowUps = useMemo(() => getFollowUpRecords().slice(0, 6), [refreshKey])

  const filteredGroups = useMemo(() => {
    const lowered = keyword.trim().toLowerCase()
    return aggregated.customerGroups
      .map((group) => {
        const todos = group.todos.filter((todo) => {
          const bucketMatched = activeBucket === 'all'
            ? true
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
          ].some((value) => String(value || '').toLowerCase().includes(lowered))
        })
        return { ...group, todos }
      })
      .filter((group) => group.todos.length > 0)
  }, [aggregated.customerGroups, activeBucket, keyword])

  const totalOpen = aggregated.todos.filter((todo) => !todo.isCompleted).length
  const mustTodayCount = aggregated.bucketCounts.must_today || 0
  const overdueCount = aggregated.todos.filter((todo) => todo.priority === 'overdue' && !todo.isCompleted).length
  const completedTodayCount = aggregated.bucketCounts.done_today || 0
  const highRiskGroups = aggregated.customerGroups.filter((group) => group.hasOverdue || group.highestPriority === 'high').slice(0, 5)
  const upcomingTodos = aggregated.todos
    .filter((todo) => !todo.isCompleted && todo.nextFollowUpAt)
    .sort((a, b) => new Date(a.nextFollowUpAt || 0).getTime() - new Date(b.nextFollowUpAt || 0).getTime())
    .slice(0, 6)

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
    setNextFollowUpAt(todo.nextFollowUpAt ? String(todo.nextFollowUpAt).slice(0, 10) : '')
    setDrawerOpen(true)
  }

  function handleRecord(action: FollowUpAction, markDone = false) {
    if (!selectedTodo) return
    saveFollowUpRecord({
      todoId: selectedTodo.id,
      docNumber: selectedTodo.docNumber,
      action,
      note: actionNote || undefined,
      nextFollowUpAt: nextFollowUpAt || undefined,
      recordedAt: new Date().toISOString(),
    })
    if (markDone) {
      markTodoCompleted(selectedTodo.id, actionNote || ACTION_LABELS[action])
    }
    setDrawerOpen(false)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg px-6 py-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: '#F96302' }} />
            业务员待办中心
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {roleLabel} · 围绕客户、单据与当前卡点推进今日动作
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-gray-500" onClick={() => setRefreshKey((prev) => prev + 1)}>
          <RefreshCw className="w-3.5 h-3.5" />
          刷新
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400">当前打开项</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalOpen}</p>
            <p className="text-xs text-gray-500 mt-1">当前需要推进的客户事项</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50/60 px-4 py-3">
            <p className="text-xs text-red-500">今日必须</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{mustTodayCount}</p>
            <p className="text-xs text-red-500 mt-1">新询价、超期、高优先级</p>
          </div>
          <div className="rounded-lg border border-orange-100 bg-orange-50/60 px-4 py-3">
            <p className="text-xs text-orange-500">待确认报价/合同</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{aggregated.bucketCounts.quote_contract || 0}</p>
            <p className="text-xs text-orange-500 mt-1">QT、SC、验货方式</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
            <p className="text-xs text-blue-500">待付款/履约确认</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{(aggregated.bucketCounts.payment || 0) + (aggregated.bucketCounts.delivery || 0)}</p>
            <p className="text-xs text-blue-500 mt-1">付款、到港、收货确认</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50/60 px-4 py-3">
            <p className="text-xs text-green-500">今日已完成</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{completedTodayCount}</p>
            <p className="text-xs text-green-500 mt-1">已完成本轮跟进</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">客户跟进主表</h2>
                  <p className="text-sm text-gray-500 mt-1">按客户与当前业务单组织，直接看到卡点、下一步动作和入口。</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-gray-500" onClick={() => {
                  setKeyword('')
                  setActiveBucket('all')
                }}>
                  重新筛选
                </Button>
              </div>
            </div>

            <div className="px-5 py-4 border-b border-gray-100 space-y-3">
              <div className="flex flex-wrap gap-2">
                {BUCKET_TABS.map((tab) => {
                  const count = tab.key === 'all'
                    ? totalOpen
                    : tab.key === 'done_today'
                      ? completedTodayCount
                      : aggregated.bucketCounts[tab.key]
                  const active = activeBucket === tab.key
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveBucket(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        active
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                      <span className={`ml-2 text-xs ${active ? 'text-white/90' : 'text-gray-500'}`}>{count || 0}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-400"
                  placeholder="搜索客户、单号、卡点、下一步动作"
                />
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <EmptyPanel text="暂无匹配的待办项" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-8" />
                    <TableHead>客户 / 邮箱</TableHead>
                    <TableHead>当前业务单</TableHead>
                    <TableHead>当前阶段</TableHead>
                    <TableHead>当前卡点</TableHead>
                    <TableHead>下一步动作</TableHead>
                    <TableHead>最近联系</TableHead>
                    <TableHead>计划跟进</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group: CustomerGroup) => {
                    const expanded = expandedCustomers.has(group.customerCompany)
                    const visibleTodos = expanded ? group.todos : group.todos.slice(0, 3)
                    const hiddenCount = group.todos.length - visibleTodos.length

                    return (
                      <React.Fragment key={group.customerCompany}>
                        <TableRow
                          className="bg-gray-50 hover:bg-gray-100/80 cursor-pointer"
                          onClick={() => toggleCustomer(group.customerCompany)}
                        >
                          <TableCell>
                            {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          </TableCell>
                          <TableCell colSpan={7}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{group.customerCompany}</span>
                              {group.customerName !== '—' && <span className="text-xs text-gray-400">· {group.customerName}</span>}
                              {group.customerEmail && <span className="text-xs text-gray-400">· {group.customerEmail}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={PRIORITY_BADGE_CLASS[group.highestPriority]}>
                              {group.hasOverdue ? '超期' : PRIORITY_LABELS[group.highestPriority]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-xs text-gray-400">{group.todos.length} 项</TableCell>
                        </TableRow>

                        {visibleTodos.map((todo) => (
                          <TableRow key={todo.id} className={todo.isCompleted ? 'opacity-50 bg-gray-50/50' : 'hover:bg-orange-50/30'}>
                            <TableCell />
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-800">{todo.customerCompany}</p>
                                <p className="text-xs text-gray-400">{todo.customerName || '—'}{todo.customerEmail ? ` · ${todo.customerEmail}` : ''}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="font-mono text-xs text-gray-700">{todo.docNumber}</p>
                                <p className="text-xs text-gray-400">{todo.docType} · {TYPE_LABELS[todo.type]}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">{todo.stage}</TableCell>
                            <TableCell className="text-sm text-gray-500">{todo.blockReason}</TableCell>
                            <TableCell className="text-sm text-orange-600 font-medium">{todo.nextAction}</TableCell>
                            <TableCell className="text-xs text-gray-400">{formatRelative(todo.lastContactAt || todo.createdAt)}</TableCell>
                            <TableCell className="text-xs text-gray-500">{formatDate(todo.nextFollowUpAt || todo.dueAt)}</TableCell>
                            <TableCell>
                              <Badge className={PRIORITY_BADGE_CLASS[todo.priority]}>
                                {PRIORITY_LABELS[todo.priority]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5 text-gray-600"
                                  onClick={() => {
                                    saveFollowUpRecord({
                                      todoId: todo.id,
                                      docNumber: todo.docNumber,
                                      action: 'contacted',
                                      recordedAt: new Date().toISOString(),
                                    })
                                    setRefreshKey((prev) => prev + 1)
                                  }}
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  已联系
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 gap-1.5"
                                  style={{ backgroundColor: '#F96302', color: '#fff' }}
                                  onClick={() => openDrawer(todo)}
                                >
                                  去处理
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}

                        {!expanded && hiddenCount > 0 && (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-2.5">
                              <button
                                className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
                                onClick={() => toggleCustomer(group.customerCompany)}
                              >
                                还有 {hiddenCount} 条，点击展开
                              </button>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <div className="w-80 flex-shrink-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-gray-800">最近客户回复</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentReplies.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">暂无最近回复</p>
              ) : (
                recentReplies.map((reply, index) => (
                  <div key={`${reply.docNumber}-${index}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-800 truncate">{reply.customerCompany}</p>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelative(reply.repliedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{reply.docNumber} · {reply.source}</p>
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{reply.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-800">即将超期 / 应跟进</span>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingTodos.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">暂无即将到期项</p>
              ) : (
                upcomingTodos.map((todo) => (
                  <button
                    key={todo.id}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    onClick={() => openDrawer(todo)}
                  >
                    <p className="text-sm font-medium text-gray-800">{todo.customerCompany}</p>
                    <p className="text-xs text-gray-500 mt-1">{todo.docNumber} · {todo.nextAction}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(todo.nextFollowUpAt || todo.dueAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-gray-800">高风险卡点</span>
            </div>
            <div className="divide-y divide-gray-50">
              {highRiskGroups.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">暂无高风险客户</p>
              ) : (
                highRiskGroups.map((group) => (
                  <div key={group.customerCompany} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-800">{group.customerCompany}</p>
                      <Badge className={PRIORITY_BADGE_CLASS[group.highestPriority]}>
                        {group.hasOverdue ? '超期' : PRIORITY_LABELS[group.highestPriority]}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{group.todos[0]?.blockReason || '存在高优先级客户动作'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <ShipWheel className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">我最近的跟进</span>
            </div>
            <div className="divide-y divide-gray-50">
              {recentFollowUps.length === 0 ? (
                <p className="px-4 py-3 text-xs text-gray-400">还没有跟进记录</p>
              ) : (
                recentFollowUps.map((item, index) => (
                  <div key={`${item.docNumber}-${index}`} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-800">{item.docNumber}</p>
                      <span className="text-xs text-gray-400">{formatRelative(item.recordedAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{ACTION_LABELS[item.action]}</p>
                    {item.note && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.note}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[420px] sm:w-[500px]">
          <SheetHeader className="border-b border-gray-100 pb-4">
            <SheetTitle className="text-lg font-semibold text-gray-900">跟进处理</SheetTitle>
            {selectedTodo && (
              <div className="mt-3 space-y-1 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-gray-700">{selectedTodo.docNumber}</span>
                  <Badge className="bg-gray-100 text-gray-600 border-0">{TYPE_LABELS[selectedTodo.type]}</Badge>
                  <Badge className={PRIORITY_BADGE_CLASS[selectedTodo.priority]}>{PRIORITY_LABELS[selectedTodo.priority]}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-800">{selectedTodo.customerCompany}</p>
                <p className="text-xs text-gray-500">{selectedTodo.stage}</p>
                <p className="text-xs text-gray-400">{selectedTodo.blockReason}</p>
              </div>
            )}
          </SheetHeader>

          {selectedTodo && (
            <div className="space-y-5 pt-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">客户</p>
                    <p className="text-gray-800">{selectedTodo.customerCompany}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">单据</p>
                    <p className="text-gray-800 font-mono">{selectedTodo.docNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">最近联系</p>
                    <p className="text-gray-800">{formatRelative(selectedTodo.lastContactAt || selectedTodo.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">下一步</p>
                    <p className="text-orange-600 font-medium">{selectedTodo.nextAction}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">快捷动作</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    'contacted',
                    'sent_qt',
                    'chased_contract',
                    'chased_deposit',
                    'shared_report',
                    'chased_payment',
                    'notified_arrival',
                    'requested_clearance_docs',
                    'confirmed_receipt',
                    'invited_feedback',
                  ] as FollowUpAction[]).map((action) => (
                    <button
                      key={action}
                      className="text-left border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                      onClick={() => handleRecord(action)}
                    >
                      {ACTION_LABELS[action]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">跟进备注</p>
                <textarea
                  rows={4}
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-orange-400 resize-none"
                  placeholder="写下本次联系结果、客户回复、风险判断或后续安排"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">下次跟进时间</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={nextFollowUpAt}
                    onChange={(event) => setNextFollowUpAt(event.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  className="gap-2 text-gray-600"
                  onClick={() => handleRecord('scheduled')}
                >
                  <Calendar className="w-4 h-4" />
                  仅记录计划
                </Button>
                <Button
                  className="gap-2"
                  style={{ backgroundColor: '#F96302', color: '#fff' }}
                  onClick={() => handleRecord('contacted', true)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  完成本轮跟进
                </Button>
              </div>

              {selectedTodo.navigateTo && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-gray-600"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { page: selectedTodo.navigateTo } }))
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
