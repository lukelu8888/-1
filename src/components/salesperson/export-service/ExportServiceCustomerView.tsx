import { Badge } from '../../ui/badge'
import type { ExportServiceCustomerUiSkeleton } from '../../../lib/services/export-service/exportServiceUiSkeletonService'

interface ExportServiceCustomerViewProps {
  summary: ExportServiceCustomerUiSkeleton
  title?: string
  subtitle?: string
}

const overallClass = (status: ExportServiceCustomerUiSkeleton['overallStatus']) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

const nodeClass = (status: ExportServiceCustomerUiSkeleton['nodes'][number]['status']) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

export function ExportServiceCustomerView({
  summary,
  title = '客户侧状态摘要',
  subtitle = '客户只看当前状态、当前配合动作和四段服务进度。',
}: ExportServiceCustomerViewProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
        <Badge className={overallClass(summary.overallStatus)}>{summary.overallLabel}</Badge>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {summary.overallSummary}
      </div>

      <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
        <div className="font-medium">{summary.customerActionLabel}</div>
        <div className="mt-1 text-xs">{summary.customerActionSummary}</div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {summary.nodes.map((node) => (
          <div key={node.key} className="rounded-md bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-900">{node.label}</div>
              <Badge className={nodeClass(node.status)}>
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
