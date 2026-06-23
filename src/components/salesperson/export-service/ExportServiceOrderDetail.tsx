import { exportExecutionBridgeService } from '../../../lib/services/export-service/exportExecutionBridgeService'
import { exportServiceUiSkeletonService } from '../../../lib/services/export-service/exportServiceUiSkeletonService'
import { Badge } from '../../ui/badge'
import type {
  ExportExecutionBridgeRecord,
  ExportFreightSettlementRecord,
  ExportHeaderDocumentRecord,
  ExportServiceFeeRecord,
  ExportServiceOrderRecord,
} from '../../../lib/services/export-service/exportServiceTypes'
import { ExportServiceCustomerView } from './ExportServiceCustomerView'
import { ExportServiceInternalView } from './ExportServiceInternalView'

interface ExportServiceOrderDetailProps {
  order: ExportServiceOrderRecord | null
  documents: ExportHeaderDocumentRecord[]
  fees: ExportServiceFeeRecord[]
  freightSettlements: ExportFreightSettlementRecord[]
}

const formatLabel = (value: string) =>
  value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function ExportServiceOrderDetail({
  order,
  documents,
  fees,
  freightSettlements,
}: ExportServiceOrderDetailProps) {
  if (!order) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        请选择一条借抬头服务委托单。
      </div>
    )
  }

  const executionBridge: ExportExecutionBridgeRecord | null = exportExecutionBridgeService.getByServiceOrder(order.id)
  const uiSkeleton = exportServiceUiSkeletonService.build({
    order,
    documents,
    fees,
    freightSettlements,
    executionBridge,
  })

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">{order.serviceOrderNumber}</div>
            <div className="mt-1 text-sm text-slate-600">{order.customerName}</div>
          </div>
          <Badge className="border-slate-200 bg-slate-50 text-slate-700">{formatLabel(order.serviceStatus)}</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <div>客户邮箱：{order.customerEmail || '待补充'}</div>
            <div className="mt-1">供应商：{order.supplierName || '待补充'}</div>
            <div className="mt-1">贸易条款：{order.supplierTradeTerm || '待补充'}</div>
          </div>
          <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            <div>货款经过我司：{order.goodsPaymentHandledByUs ? '是' : '否'}</div>
            <div className="mt-1">客户自购保险：{order.insuranceHandledByCustomer ? '是' : '否'}</div>
            <div className="mt-1">需要订舱：{order.bookingRequired ? '是' : '否'}</div>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600">出货摘要：{order.cargoSummary || '待补充'}</div>
        <div className="mt-2 text-sm text-slate-600">来源邮件线程：{order.sourceMailThreadId || '非邮件入口创建'}</div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ExportServiceCustomerView summary={uiSkeleton.customer} />
        <ExportServiceInternalView summary={uiSkeleton.internal} />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">后段桥接状态</div>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Shipment：{formatLabel(executionBridge?.shipmentBridgeStatus || 'not_started')} / {executionBridge?.shipmentReference || '待挂接'}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Docs：{formatLabel(executionBridge?.docsBridgeStatus || 'not_started')} / {executionBridge?.docsReference || '待挂接'}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Payment：{formatLabel(executionBridge?.paymentBridgeStatus || 'not_started')} / {executionBridge?.paymentReference || '待挂接'}
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Payable：{formatLabel(executionBridge?.payableBridgeStatus || 'not_started')} / {executionBridge?.payableReference || '待挂接'}
          </div>
        </div>
        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          桥接汇总：{executionBridge?.notes || '待同步'}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          最后触达：{executionBridge ? new Date(executionBridge.lastTouchedAt).toLocaleString('zh-CN') : '待同步'}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">抬头文件记录</div>
        <div className="mt-3 space-y-2">
          {documents.length === 0 ? (
            <div className="text-sm text-slate-500">暂无抬头文件记录。</div>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {formatLabel(document.documentType)} / {document.titleHeadingCompany} / {formatLabel(document.status)}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">服务费应收记录</div>
        <div className="mt-3 space-y-2">
          {fees.length === 0 ? (
            <div className="text-sm text-slate-500">暂无服务费记录。</div>
          ) : (
            fees.map((fee) => (
              <div key={fee.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {fee.currency} {fee.amount.toLocaleString()} / {formatLabel(fee.paymentStatus)} / 发票：{formatLabel(fee.invoiceStatus)}
                {' '} / 应收识别键：{fee.receivableReference || '待生成'}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold text-slate-900">代收代付运费记录</div>
        <div className="mt-3 space-y-2">
          {freightSettlements.length === 0 ? (
            <div className="text-sm text-slate-500">暂无运费结算记录。</div>
          ) : (
            freightSettlements.map((item) => (
              <div key={item.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                货代：{item.providerName || '待补充'} / 代收：{item.currency} {item.collectAmount.toLocaleString()} / 代付：{item.currency}{' '}
                {item.payableAmount.toLocaleString()} / {formatLabel(item.settlementStatus)} / 应付识别键：
                {item.payableReference || '待生成'} / 付款识别键：{item.paymentRecordReference || '待生成'}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
