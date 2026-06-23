import { Badge } from '../../ui/badge'
import type { ExportServiceOrderRecord } from '../../../lib/services/export-service/exportServiceTypes'
import { CompactDetailsPopover } from '../../shared/CompactDetailsPopover'

interface ExportServiceOrderListProps {
  orders: ExportServiceOrderRecord[]
  selectedOrderId: string | null
  onSelect: (orderId: string) => void
}

const formatStatusLabel = (value: ExportServiceOrderRecord['serviceStatus']) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const statusClassName = (status: ExportServiceOrderRecord['serviceStatus']) => {
  if (status === 'settlement_closed') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'freight_quoting' || status === 'booking_pending' || status === 'execution_in_progress') {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-amber-50 text-amber-700 border-amber-200'
}

export function ExportServiceOrderList({
  orders,
  selectedOrderId,
  onSelect,
}: ExportServiceOrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        还没有借抬头服务委托单。
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <button
          key={order.id}
          type="button"
          onClick={() => onSelect(order.id)}
          className={`w-full rounded-lg border px-4 py-3 text-left transition ${
            selectedOrderId === order.id
              ? 'border-orange-300 bg-orange-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">{order.serviceOrderNumber}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={statusClassName(order.serviceStatus)}>{formatStatusLabel(order.serviceStatus)}</Badge>
              <CompactDetailsPopover
                items={[
                  { label: '客户', value: order.customerName },
                  { label: '供应商', value: order.supplierName || '待补充' },
                  { label: '贸易条款', value: order.supplierTradeTerm || '待补充' },
                  { label: '货款经我司', value: order.goodsPaymentHandledByUs ? '是' : '否' },
                  { label: '需要订舱', value: order.bookingRequired ? '是' : '否' },
                ]}
              />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
