import type { MailThreadSummary } from './types'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'

function statusLabel(status: MailThreadSummary['status']) {
  const labels: Record<MailThreadSummary['status'], string> = {
    new: '新进入',
    triaging: '分诊中',
    assigned: '已接手',
    linked: '已挂接',
    resolved: '已处理',
    closed: '已关闭',
    escalated: '已升级',
  }
  return labels[status]
}

export function MailThreadList({
  threads,
  selectedThreadId,
  onSelect,
}: {
  threads: MailThreadSummary[]
  selectedThreadId?: string
  onSelect: (threadId: string) => void
}) {
  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <Card
          key={thread.id}
          className={`p-4 transition-colors ${selectedThreadId === thread.id ? 'border-sky-300 bg-sky-50' : 'hover:border-slate-300'}`}
        >
          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-0 text-left"
            onClick={() => onSelect(thread.id)}
          >
            <div className="w-full space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{thread.subject}</div>
                  <div className="text-xs text-slate-500">{thread.latestSenderName} · {thread.latestSenderEmail}</div>
                </div>
                <Badge variant="secondary">{statusLabel(thread.status)}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                {thread.linkedCustomerName ? <span>客户：{thread.linkedCustomerName}</span> : null}
                {thread.linkedProjectName ? <span>项目：{thread.linkedProjectName}</span> : null}
                {thread.linkedOrderNumber ? <span>单号：{thread.linkedOrderNumber}</span> : null}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{thread.ownerLabel}</span>
                <span>附件 {thread.attachmentCount} · 未读 {thread.unreadCount}</span>
              </div>
            </div>
          </Button>
        </Card>
      ))}
    </div>
  )
}
