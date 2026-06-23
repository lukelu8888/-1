import React, { useMemo, useState } from 'react'
import { Card } from '../../ui/card'
import { Input } from '../../ui/input'
import { mailThreadService } from '../../../lib/services/mailThreadService'
import { mailDispatchService } from '../../../lib/services/mailDispatchService'
import { mailCandidateService } from '../../../lib/services/mailCandidateService'
import { mailLinkService } from '../../../lib/services/mailLinkService'
import { MailThreadList } from './MailThreadList'
import { MailThreadDetail } from './MailThreadDetail'
import { MailCandidatePanel } from './MailCandidatePanel'
import { MailDispatchPanel } from './MailDispatchPanel'

export function MailWorkbenchShell() {
  const [keyword, setKeyword] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedThreadId, setSelectedThreadId] = useState<string | undefined>(() => mailThreadService.list()[0]?.id)

  const threads = useMemo(() => {
    const all = mailThreadService.list()
    const lowered = keyword.trim().toLowerCase()
    if (!lowered) return all
    return all.filter((thread) =>
        [thread.subject, thread.latestSenderName, thread.latestSenderEmail, thread.linkedCustomerName, thread.linkedProjectName, thread.linkedOrderNumber]
        .some((value) => String(value || '').toLowerCase().includes(lowered)),
    )
  }, [keyword, refreshKey])

  const selectedThread = selectedThreadId ? mailThreadService.getById(selectedThreadId) : null
  const dispatches = selectedThreadId ? mailDispatchService.listByThread(selectedThreadId) : []
  const candidates = selectedThreadId ? mailCandidateService.listByThread(selectedThreadId) : []
  const links = selectedThreadId ? mailLinkService.listByThread(selectedThreadId) : []

  function handleChanged() {
    setRefreshKey((value) => value + 1)
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">业务邮件工作台</h2>
            <p className="mt-1 text-sm text-slate-600">
              第一阶段先聚焦线程、分发、候选对象和正式业务挂接，不替代企业邮箱原始收发。
            </p>
          </div>
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜索主题、客户、项目、订单号"
            className="max-w-md"
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <MailThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelect={setSelectedThreadId}
        />
        <div className="space-y-4">
          <MailThreadDetail
            thread={selectedThread}
            dispatches={dispatches}
            candidates={candidates}
            links={links}
          />
          <MailCandidatePanel
            thread={selectedThread}
            candidates={candidates}
            onChanged={handleChanged}
          />
          <MailDispatchPanel
            threadId={selectedThreadId}
            dispatches={dispatches}
            onChanged={handleChanged}
          />
        </div>
      </div>
    </div>
  )
}
