import { FileCheck, Link2, RefreshCw } from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { toast } from 'sonner'
import { exportDocumentationBridgeService } from '../../../lib/services/export-service/exportDocumentationBridgeService'
import {
  advanceExportDocumentationBridge,
  getNextExportDocumentationBridgeActionLabel,
} from '../../../lib/services/export-service/exportDocumentationBridgeWorkflowService'
import { syncExportExecutionBridgeState } from '../../../lib/services/export-service/syncExportExecutionBridgeState'

interface ExportDocumentationBridgePanelProps {
  onChanged?: () => void
}

const statusTone: Record<string, string> = {
  pending: 'border-slate-200 bg-slate-50 text-slate-700',
  processing: 'border-orange-200 bg-orange-50 text-orange-700',
  reviewing: 'border-amber-200 bg-amber-50 text-amber-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ExportDocumentationBridgePanel({ onChanged }: ExportDocumentationBridgePanelProps) {
  const records = exportDocumentationBridgeService
    .list()
    .filter((item) => item.orderId.startsWith('ES-DOC-'))
    .sort((left, right) => right.lastUpdate.localeCompare(left.lastUpdate))

  if (records.length === 0) {
    return null
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Link2 className="h-4 w-4 text-orange-500" />
            借抬头服务桥接任务
          </div>
          <div className="mt-1 text-xs text-slate-500">在现有单证工作面内推进 Docs 桥接，并回写服务委托桥接摘要。</div>
        </div>
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">{records.length} 条</Badge>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        {records.map((record) => {
          const nextAction = getNextExportDocumentationBridgeActionLabel(record)

          return (
            <div key={record.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{record.contractNo}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {record.orderId} / {record.customerName}
                  </div>
                </div>
                <Badge className={statusTone[record.status] || statusTone.pending}>{formatLabel(record.status)}</Badge>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  进度：{record.completedDocs}/{record.requiredDocs} / {record.completionRate}%
                </div>
                <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                  预警：{record.alerts.length} / 剩余 {record.daysRemaining} 天
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  下一步：{nextAction || '已完成桥接收口'}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!nextAction}
                  onClick={() => {
                    const updated = advanceExportDocumentationBridge(record.id)
                    if (!updated) {
                      toast.error('未找到可推进的单证桥接记录')
                      return
                    }

                    syncExportExecutionBridgeState(updated.serviceOrderId)
                    onChanged?.()
                    toast.success(`${record.contractNo} 已推进：${nextAction || '桥接收口完成'}`)
                  }}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  {nextAction || '已完成'}
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <FileCheck className="h-3.5 w-3.5" />
                最后更新：{record.lastUpdate}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
