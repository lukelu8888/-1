import { Card } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { directOrderMailBridgeLookup } from '../../../lib/services/direct-order-draft/directOrderMailBridgeLookup'
import { exportServiceMailBridgeLookup } from '../../../lib/services/export-service/exportServiceMailBridgeLookup'
import type {
  MailCandidateRecord,
  MailDispatchRecord,
  MailLinkRecord,
  MailThreadDetail as MailThreadDetailType,
} from './types'

export function MailThreadDetail({
  thread,
  dispatches,
  candidates,
  links,
}: {
  thread: MailThreadDetailType | null
  dispatches: MailDispatchRecord[]
  candidates: MailCandidateRecord[]
  links: MailLinkRecord[]
}) {
  if (!thread) {
    return (
      <Card className="p-8 text-center text-sm text-slate-500">
        请选择左侧线程，查看邮件详情、候选对象和分发记录。
      </Card>
    )
  }

  const linkedExportServiceOrder =
    exportServiceMailBridgeLookup.getByThreadId(thread.id) || exportServiceMailBridgeLookup.getByLinks(links)
  const linkedDirectOrderDraft =
    directOrderMailBridgeLookup.getByThreadId(thread.id) || directOrderMailBridgeLookup.getByLinks(links)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{thread.subject}</h3>
              <p className="text-sm text-slate-500">{thread.latestSenderName} · {thread.latestSenderEmail}</p>
            </div>
            <Badge variant="outline">{thread.status}</Badge>
          </div>
          <p className="text-sm leading-6 text-slate-700">{thread.snippet}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {thread.participants.map((participant) => (
              <span key={participant} className="rounded-full bg-slate-100 px-2 py-1">{participant}</span>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4">
          <h4 className="mb-3 font-medium text-slate-900">附件</h4>
          <div className="space-y-2 text-sm text-slate-600">
            {thread.attachments.length === 0 ? <div>暂无附件</div> : thread.attachments.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{item.fileName}</span>
                <Badge variant="secondary">{item.fileType}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="mb-3 font-medium text-slate-900">候选业务对象</h4>
          <div className="space-y-2 text-sm text-slate-600">
            {candidates.length === 0 ? <div>暂无候选对象</div> : candidates.map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="font-medium text-slate-800">{item.candidateType}</div>
                <div>{item.candidateSummary}</div>
                <div className="mt-1 text-xs text-slate-500">状态：{item.status}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="mb-3 font-medium text-slate-900">分发与关联</h4>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="space-y-2">
              {dispatches.length === 0 ? <div>暂无分发记录</div> : dispatches.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div>{item.assignedDepartment} / {item.assignedRole}</div>
                  <div className="text-xs text-slate-500">状态：{item.status}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <div className="mb-2 font-medium text-slate-800">已挂接对象</div>
              {links.length === 0 ? <div>暂无正式业务挂接</div> : links.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div>{item.label}</div>
                  <div className="text-xs text-slate-500">{item.targetType} · {item.targetNumber}</div>
                </div>
              ))}
            </div>
            {linkedExportServiceOrder ? (
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-3">
                <div className="font-medium text-orange-900">借抬头服务回看</div>
                <div className="mt-1 text-xs text-orange-700">
                  {linkedExportServiceOrder.serviceOrderNumber} / {linkedExportServiceOrder.customerName}
                </div>
                <div className="mt-1 text-xs text-orange-700">
                  状态：{linkedExportServiceOrder.serviceStatus}
                </div>
                <div className="mt-1 text-xs text-orange-700">
                  线程收口：当前邮件线程状态为 {thread.status}
                </div>
                <div className="mt-1 text-xs text-orange-600">
                  {linkedExportServiceOrder.bridgeSummary || '桥接摘要待同步'}
                </div>
              </div>
            ) : null}
            {linkedDirectOrderDraft ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-3">
                <div className="font-medium text-blue-900">翻单直下单回看</div>
                <div className="mt-1 text-xs text-blue-700">
                  草稿 {linkedDirectOrderDraft.draftNumber} / {linkedDirectOrderDraft.customerName}
                </div>
                <div className="mt-1 text-xs text-blue-700">
                  草稿状态：{linkedDirectOrderDraft.draftStatus}
                </div>
                <div className="mt-1 text-xs text-blue-700">
                  正式订单：{linkedDirectOrderDraft.linkedOrderNumber || '待提交'} / {linkedDirectOrderDraft.linkedOrderStatus || '待推进'}
                </div>
                <div className="mt-1 text-xs text-blue-700">
                  执行阶段：{linkedDirectOrderDraft.executionStage || '待推进'}
                </div>
                <div className="mt-1 text-xs text-blue-700">
                  线程收口：当前邮件线程状态为 {thread.status}
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  {linkedDirectOrderDraft.bridgeSummary || '桥接摘要待同步'}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
