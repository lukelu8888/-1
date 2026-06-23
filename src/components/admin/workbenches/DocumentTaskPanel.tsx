import { FileCheck2, RefreshCw } from 'lucide-react'
import { documentTaskService } from '../../../lib/services/document-task/documentTaskService'
import type { DocumentTaskRecord } from '../../../lib/services/document-task/documentTaskTypes'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'

interface DocumentTaskPanelProps {
  onChanged?: () => void
  derivedTasks?: DocumentTaskRecord[]
}

const statusTone: Record<string, string> = {
  open: 'border-slate-200 bg-slate-50 text-slate-700',
  in_progress: 'border-blue-200 bg-blue-50 text-blue-700',
  reviewing: 'border-amber-200 bg-amber-50 text-amber-700',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
}

const nextStatusMap = {
  open: 'in_progress',
  in_progress: 'reviewing',
  reviewing: 'done',
  done: 'done',
  cancelled: 'cancelled',
} as const

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function DocumentTaskPanel({ onChanged, derivedTasks = [] }: DocumentTaskPanelProps) {
  const manualTasks = documentTaskService.list()
  const tasks = [...derivedTasks, ...manualTasks].sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  if (tasks.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileCheck2 className="h-4 w-4 text-orange-500" />
            单证任务对象
          </div>
          <div className="mt-1 text-xs text-slate-500">第一阶段先落最小正式任务对象，不重做完整单证任务引擎。</div>
        </div>
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">{tasks.length} 条</Badge>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">{task.taskNumber}</div>
                  {task.id.startsWith('derived-') && (
                    <Badge className="border-blue-200 bg-blue-50 text-blue-700">自动派生</Badge>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-600">{task.taskTitle}</div>
              </div>
              <Badge className={statusTone[task.status] || statusTone.open}>{formatLabel(task.status)}</Badge>
            </div>

            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <div>归属：{task.ownerDepartment} / {task.ownerRole}</div>
              <div>文档代码：{task.docCode || '待识别'} / 优先级：{task.priority}</div>
              <div>到期：{task.dueAt ? new Date(task.dueAt).toLocaleString('zh-CN') : '待补充'}</div>
            </div>

            <div className="mt-3 text-xs leading-relaxed text-slate-600">{task.taskSummary}</div>

            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={task.id.startsWith('derived-') || task.status === 'done' || task.status === 'cancelled'}
                onClick={() => {
                  documentTaskService.updateStatus(task.id, nextStatusMap[task.status])
                  onChanged?.()
                }}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                {task.id.startsWith('derived-') ? '系统派生任务' : '推进一步'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
