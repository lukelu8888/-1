import type { ExportServiceInternalUiSkeleton } from '../../../lib/services/export-service/exportServiceUiSkeletonService'

interface ExportServiceInternalViewProps {
  summary: ExportServiceInternalUiSkeleton
}

export function ExportServiceInternalView({ summary }: ExportServiceInternalViewProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">我方侧推进提示</div>
        <div className="mt-1 text-xs text-slate-500">内部重点看阻断、引用、追办动作和责任归口。</div>
      </div>

      <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        <div className="font-medium">{summary.blockerLabel}</div>
        <div className="mt-1 text-xs">{summary.blockerSummary}</div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium text-slate-700">{summary.blockerReferenceLabel}</div>
          <div className="mt-1 text-xs text-slate-600">{summary.blockerReferenceSummary}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium text-slate-700">{summary.blockerActionLabel}</div>
          <div className="mt-1 text-xs text-slate-600">{summary.blockerActionSummary}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium text-slate-700">{summary.blockerOwnerLabel}</div>
          <div className="mt-1 text-xs text-slate-600">{summary.blockerOwnerSummary}</div>
        </div>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="text-xs font-medium text-amber-800">{summary.internalNextActionLabel}</div>
          <div className="mt-1 text-xs text-amber-700">{summary.internalNextActionSummary}</div>
        </div>
      </div>
    </section>
  )
}
