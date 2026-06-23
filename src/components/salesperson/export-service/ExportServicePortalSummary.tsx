import { Badge } from '../../ui/badge'
import type { ExportServicePortalSummary } from '../../../lib/services/export-service/exportServicePortalSummaryService'

interface ExportServicePortalSummaryProps {
  summary: ExportServicePortalSummary
}

const statusClass = (status: ExportServicePortalSummary['overallStatus']) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const nodeStatusClass = (status: ExportServicePortalSummary['nodes'][number]['status']) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function ExportServicePortalSummary({ summary }: ExportServicePortalSummaryProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">客户侧可见服务状态</div>
          <div className="mt-1 text-xs text-slate-500">第二阶段先做轻量摘要，不单独开客户服务门户。</div>
        </div>
        <Badge className={statusClass(summary.overallStatus)}>{summary.overallLabel}</Badge>
      </div>
      <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
        <div className="font-medium">{summary.customerActionLabel}</div>
        <div className="mt-1 text-xs">{summary.customerActionSummary}</div>
      </div>
      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        <div className="font-medium">{summary.blockerLabel}</div>
        <div className="mt-1 text-xs">{summary.blockerSummary}</div>
        <div className="mt-2 text-xs font-medium">{summary.blockerReferenceLabel}</div>
        <div className="mt-1 text-xs text-rose-700">{summary.blockerReferenceSummary}</div>
        <div className="mt-2 text-xs font-medium">{summary.blockerActionLabel}</div>
        <div className="mt-1 text-xs text-rose-700">{summary.blockerActionSummary}</div>
        <div className="mt-2 text-xs font-medium">{summary.blockerOwnerLabel}</div>
        <div className="mt-1 text-xs text-rose-700">{summary.blockerOwnerSummary}</div>
      </div>
      <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        <div className="font-medium">{summary.internalNextActionLabel}</div>
        <div className="mt-1 text-xs">{summary.internalNextActionSummary}</div>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {summary.nodes.map((node) => (
          <div key={node.key} className="rounded-md bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{node.label}</div>
              <Badge className={nodeStatusClass(node.status)}>
                {node.status === 'done' ? '已完成' : node.status === 'in_progress' ? '进行中' : '待启动'}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-slate-600">{node.summary}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
